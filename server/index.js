import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pgPkg from 'pg';
const { Pool } = pgPkg;
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import {
  dispatchNewsletterJob,
  sendNewsletterTestJob,
  sendAdmissionOtpJob,
  sendStageNotificationJob
} from './email-queue.js';
import {
  verifyAdmissionPortalSignedToken,
  generateAdmissionPortalSignedToken
} from './email-service.js';
import { enqueueFaceDetectionJob, enqueueCurpVerificationJob, getKycQueue } from './kyc-queue.js';
import { getEmailQueue, getRedisConnectionConfig } from './email-queue.js';
import Redis from 'ioredis';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import {
  saveAdmissionAsset,
  deleteAdmissionFolder,
  deleteFormFolder,
  testStorageConfig,
  testStorageWebhookConfig,
  streamPrivateAsset,
  exportAdmissionZip,
  storageLocalRoot
} from './storage-service.js';
import { extractDocumentDataWithOpenAI } from './document-ocr-service.js';
import { generateFormSubmissionPdf } from './form-pdf-service.js';

let redisClient = null;
try {
  const rConf = getRedisConnectionConfig();
  redisClient = rConf instanceof Redis ? rConf : new Redis(rConf);
} catch (rErr) {
  console.warn('[REDIS CLIENT] Redis client init warning in server/index.js:', rErr.message);
}

/**
 * Checks Redis for any official CURP PDFs downloaded in background and enriches form submission data.
 * When shouldDelete is true (at form submission time), deletes the key from Redis after setting it on the metadata.
 */
async function enrichFormDataWithCachedCurpPdfs(data, formSchema = null, shouldDelete = true) {
  if (!data || typeof data !== 'object' || !redisClient) return data;
  try {
    // 1. If formSchema is provided, find all fields of type 'curp'
    const curpFieldIds = new Set();
    if (formSchema) {
      const sections = Array.isArray(formSchema) ? formSchema : (Array.isArray(formSchema.sections) ? formSchema.sections : []);
      sections.forEach(sec => {
        (sec.fields || []).forEach(f => {
          if (f.type === 'curp') {
            curpFieldIds.add(f.id);
          }
        });
      });
    }

    const keys = Object.keys(data);
    for (const k of keys) {
      const v = data[k];
      let curpCandidate = null;
      let targetFieldId = k;

      if (k.endsWith('_curp_metadata') && v && v.curp) {
        curpCandidate = v.curp;
        targetFieldId = k.replace(/_curp_metadata$/, '');
      } else if (typeof v === 'string' && /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(v.trim())) {
        curpCandidate = v.trim();
      } else if (v && typeof v === 'object' && v.curp) {
        curpCandidate = v.curp;
      } else if (curpFieldIds.has(k) && v) {
        curpCandidate = typeof v === 'string' ? v.trim() : (v.curp || '');
      }

      if (curpCandidate && /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(curpCandidate)) {
        const redisKey = `curp:pdf:${curpCandidate.toUpperCase()}`;
        const cachedPdf = await redisClient.get(redisKey);
        if (cachedPdf) {
          // Set on metadata object
          const metaKey = `${targetFieldId}_curp_metadata`;
          if (!data[metaKey] || typeof data[metaKey] !== 'object') {
            data[metaKey] = { curp: curpCandidate };
          }
          data[metaKey].pdfBase64 = cachedPdf;

          // Also set on field object if present
          if (typeof data[targetFieldId] === 'object' && data[targetFieldId] !== null) {
            data[targetFieldId].pdfBase64 = cachedPdf;
          }

          console.log(`💾 [FORM SUBMISSION] Attached official CURP PDF from Redis for ${curpCandidate} (Length: ${cachedPdf.length})`);

          // Delete from Redis once permanently stored in database
          if (shouldDelete) {
            await redisClient.del(redisKey);
            console.log(`🗑️ [REDIS] Deleted temporary key ${redisKey} after saving to database.`);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[REDIS LOOKUP] Failed to enrich form data with CURP PDF:', err.message);
  }
  return data;
}

/**
 * Emits realtime events to Deepstream WebSocket service
 */
async function publishDeepstreamRealtimeEvent(eventName, data) {
  try {
    const deepstreamUrl = process.env.DEEPSTREAM_URL || 'https://realtime.asistenxa.com/api';
    await fetch(deepstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'EVENT',
        action: 'EMIT',
        eventName,
        data
      })
    });
  } catch (err) {
    console.warn(`[DEEPSTREAM EMIT WARNING] Failed to publish ${eventName}:`, err.message);
  }
}

/**
 * Processes physical storage folder generation and attaches all generated form assets
 * (CURP PDF, uploads, KYC, signature, and form summary PDF) to the admission dossier documents.
 * Hierarchy: schools/:schoolId/admissions/:applicationId/forms/:formId/
 */
async function processAdmissionFormDossierAndStorage({
  application,
  formTemplate,
  formData,
  files,
  signature,
  respondentName,
  respondentEmail
}) {
  const schoolId = application?.schoolId || formTemplate?.schoolId || 'global';
  const applicationId = application?.id || 'standalone';
  const formId = formTemplate?.id || 'general';
  const newDocuments = [];
  const cleanRespondent = respondentName || application?.tutorName || 'Familiar';
  let signatureUrl = null;

  const extractAssetCandidate = (item) => {
    if (!item) return null;
    if (Buffer.isBuffer(item)) return item;
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/api/storage/') || trimmed.length > 50) {
        return trimmed;
      }
      return null;
    }
    if (typeof item === 'object') {
      return item.fileUrl || item.url || item.base64 || item.dataUrl || item.cropUrl || (typeof item.content === 'string' ? item.content : null);
    }
    return null;
  };

  try {
    // 1. Process and Save official CURP PDF(s) to physical storage and dossier
    if (formData && typeof formData === 'object') {
      for (const [k, v] of Object.entries(formData)) {
        const curpCandidate = (v && typeof v === 'object' && v.curp) || (k.endsWith('_curp_metadata') && v?.curp);
        const pdfBase64 = (v && typeof v === 'object' && v.pdfBase64) || (formData[`${k}_curp_metadata`]?.pdfBase64);
        if (curpCandidate && pdfBase64) {
          const filename = `CURP_${curpCandidate.toUpperCase()}.pdf`;
          const savedAsset = await saveAdmissionAsset({
            schoolId,
            applicationId,
            formId,
            filename,
            content: pdfBase64,
            mimeType: 'application/pdf'
          });

          // Update formData reference to persistent fileUrl
          if (typeof formData[k] === 'object') formData[k].fileUrl = savedAsset.fileUrl;
          if (formData[`${k}_curp_metadata`]) formData[`${k}_curp_metadata`].fileUrl = savedAsset.fileUrl;

          newDocuments.push({
            id: `doc_curp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: `Constancia Oficial de CURP (${curpCandidate.toUpperCase()})`,
            file_url: savedAsset.fileUrl,
            status: 'APPROVED',
            uploaded_at: new Date().toISOString(),
            notes: `Documento oficial emitido por RENAPO verificado en formulario "${formTemplate?.title || 'Admisión'}".`
          });
        }
      }
    }

    // 2. Process and Save uploaded files (file_upload / uploads) to physical storage and dossier
    if (Array.isArray(files)) {
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        if (fileItem && (fileItem.fileUrl || fileItem.content || fileItem.base64)) {
          const rawContent = fileItem.content || fileItem.base64 || fileItem.fileUrl;
          const origName = fileItem.fileName || fileItem.name || `adjunto_${i + 1}`;
          const savedAsset = await saveAdmissionAsset({
            schoolId,
            applicationId,
            formId,
            filename: origName,
            content: rawContent
          });
          fileItem.fileUrl = savedAsset.fileUrl;

          newDocuments.push({
            id: `doc_upload_${Date.now()}_${i}`,
            name: origName,
            file_url: savedAsset.fileUrl,
            status: 'PENDING',
            uploaded_at: new Date().toISOString(),
            notes: `Archivo adjunto enviado en formulario "${formTemplate?.title || 'Admisión'}".`
          });
        }
      }
    }

    // 3. Process and Save Biometric & KYC Assets (Document Front & Back, Autocrop Face, Selfie Step 1 & 2, and Liveness Video)
    if (formData && typeof formData === 'object') {
      for (const [fieldId, val] of Object.entries(formData)) {
        if (!val || typeof val !== 'object') continue;

        // Clean field prefix for filenames
        const cleanFieldTag = slugify(fieldId).substring(0, 20) || 'kyc';

        // A. Document Images (Front and Back if applicable)
        const docObj = val.document || (val.front || val.back || val.selectedType || val.frontUrl || val.backUrl ? val : null);
        if (docObj && typeof docObj === 'object') {
          const rawDocType = docObj.docType || docObj.selectedType || val.docType || val.selectedType || 'id_card';
          const docType = String(rawDocType).toLowerCase();
          const docTypeLabel = docType === 'passport' ? 'Pasaporte' : docType === 'driver_license' ? 'Licencia de Conducir' : 'Identificación Oficial (INE/DNI)';

          // 1. Document Front Image (Full Document Photo)
          const frontCandidate = extractAssetCandidate(docObj.front) || extractAssetCandidate(docObj.frontUrl) || extractAssetCandidate(docObj.frontImage) || extractAssetCandidate(val.front) || extractAssetCandidate(val.frontUrl) || extractAssetCandidate(val.frontImage);
          if (frontCandidate) {
            const frontFilename = `documento_frente_${docType}_${cleanFieldTag}.jpg`;
            try {
              let savedFrontUrl = frontCandidate;
              if (!frontCandidate.startsWith('/api/storage/')) {
                const savedFront = await saveAdmissionAsset({
                  schoolId,
                  applicationId,
                  formId,
                  filename: frontFilename,
                  content: frontCandidate,
                  mimeType: 'image/jpeg'
                });
                savedFrontUrl = savedFront.fileUrl;
              }

              if (docObj.front && typeof docObj.front === 'object') {
                docObj.front.fileUrl = savedFrontUrl;
                if (docObj.front.base64) delete docObj.front.base64;
              } else {
                docObj.front = { fileUrl: savedFrontUrl, fileName: frontFilename, isImage: true };
              }
              if (val.front && typeof val.front === 'object') {
                val.front.fileUrl = savedFrontUrl;
                if (val.front.base64) delete val.front.base64;
              }
              if (val.frontUrl) val.frontUrl = savedFrontUrl;

              newDocuments.push({
                id: `doc_id_front_${Date.now()}_${cleanFieldTag}`,
                name: `Documento de Identidad - Frente (${docTypeLabel})`,
                file_url: savedFrontUrl,
                status: 'APPROVED',
                uploaded_at: new Date().toISOString(),
                notes: `Fotografía frontal completa del documento oficial (${docTypeLabel}) capturada en "${formTemplate?.title || 'Admisión'}".`
              });
            } catch (err) {
              console.warn('[KYC FRONT SAVE WARNING]', err.message);
            }
          }

          // 2. Document Back Image (for two-sided documents)
          const backCandidate = extractAssetCandidate(docObj.back) || extractAssetCandidate(docObj.backUrl) || extractAssetCandidate(docObj.backImage) || extractAssetCandidate(val.back) || extractAssetCandidate(val.backUrl) || extractAssetCandidate(val.backImage);
          if (backCandidate) {
            const backFilename = `documento_reverso_${docType}_${cleanFieldTag}.jpg`;
            try {
              let savedBackUrl = backCandidate;
              if (!backCandidate.startsWith('/api/storage/')) {
                const savedBack = await saveAdmissionAsset({
                  schoolId,
                  applicationId,
                  formId,
                  filename: backFilename,
                  content: backCandidate,
                  mimeType: 'image/jpeg'
                });
                savedBackUrl = savedBack.fileUrl;
              }

              if (docObj.back && typeof docObj.back === 'object') {
                docObj.back.fileUrl = savedBackUrl;
                if (docObj.back.base64) delete docObj.back.base64;
              } else {
                docObj.back = { fileUrl: savedBackUrl, fileName: backFilename, isImage: true };
              }
              if (val.back && typeof val.back === 'object') {
                val.back.fileUrl = savedBackUrl;
                if (val.back.base64) delete val.back.base64;
              }
              if (val.backUrl) val.backUrl = savedBackUrl;

              newDocuments.push({
                id: `doc_id_back_${Date.now()}_${cleanFieldTag}`,
                name: `Documento de Identidad - Reverso (${docTypeLabel})`,
                file_url: savedBackUrl,
                status: 'APPROVED',
                uploaded_at: new Date().toISOString(),
                notes: `Fotografía posterior/reverso del documento oficial (${docTypeLabel}) capturada en "${formTemplate?.title || 'Admisión'}".`
              });
            } catch (err) {
              console.warn('[KYC BACK SAVE WARNING]', err.message);
            }
          }

          // 3. Autocropped Face Image from Document
          const cropCandidate = extractAssetCandidate(docObj.faceCropUrl) || extractAssetCandidate(docObj.faceCropImage) || extractAssetCandidate(docObj.faceCrop) || extractAssetCandidate(val.faceCropUrl) || extractAssetCandidate(val.faceCropImage) || extractAssetCandidate(val.faceCrop);
          if (cropCandidate) {
            const cropFilename = `documento_rostro_autocrop_${cleanFieldTag}.jpg`;
            try {
              let savedCropUrl = cropCandidate;
              if (!cropCandidate.startsWith('/api/storage/')) {
                const savedCrop = await saveAdmissionAsset({
                  schoolId,
                  applicationId,
                  formId,
                  filename: cropFilename,
                  content: cropCandidate,
                  mimeType: 'image/jpeg'
                });
                savedCropUrl = savedCrop.fileUrl;
              }

              docObj.faceCropUrl = savedCropUrl;
              if (val.faceCropUrl) val.faceCropUrl = savedCropUrl;

              newDocuments.push({
                id: `doc_face_crop_${Date.now()}_${cleanFieldTag}`,
                name: `Rostro Extraído del Documento (Autocrop Biométrico)`,
                file_url: savedCropUrl,
                status: 'APPROVED',
                uploaded_at: new Date().toISOString(),
                notes: `Recorte facial extraído automáticamente del documento de identidad oficial en "${formTemplate?.title || 'Admisión'}".`
              });
            } catch (err) {
              console.warn('[KYC CROP SAVE WARNING]', err.message);
            }
          }
        }

        // B. Selfie Photos & Liveness Video Clip
        const selfieObj = val.selfie || (val.step1 || val.step2 || val.videoClip ? val : null);
        if (selfieObj && typeof selfieObj === 'object') {
          // 1. Step 1: Frontal Selfie
          const step1Candidate = extractAssetCandidate(selfieObj.step1) || extractAssetCandidate(selfieObj.selfieUrl) || extractAssetCandidate(selfieObj.selfieImage) || extractAssetCandidate(val.step1) || extractAssetCandidate(val.selfieUrl) || extractAssetCandidate(val.selfieImage);
          if (step1Candidate) {
            const step1Filename = `selfie_biometrico_frontal_${cleanFieldTag}.jpg`;
            try {
              let savedStep1Url = step1Candidate;
              if (!step1Candidate.startsWith('/api/storage/')) {
                const savedStep1 = await saveAdmissionAsset({
                  schoolId,
                  applicationId,
                  formId,
                  filename: step1Filename,
                  content: step1Candidate,
                  mimeType: 'image/jpeg'
                });
                savedStep1Url = savedStep1.fileUrl;
              }

              if (selfieObj.step1 && typeof selfieObj.step1 === 'object') {
                selfieObj.step1.fileUrl = savedStep1Url;
                if (selfieObj.step1.base64) delete selfieObj.step1.base64;
              } else {
                selfieObj.step1 = { fileUrl: savedStep1Url, fileName: step1Filename, isImage: true };
              }
              if (val.step1 && typeof val.step1 === 'object') {
                val.step1.fileUrl = savedStep1Url;
                if (val.step1.base64) delete val.step1.base64;
              }
              if (val.selfieUrl) val.selfieUrl = savedStep1Url;

              newDocuments.push({
                id: `doc_selfie_step1_${Date.now()}_${cleanFieldTag}`,
                name: `Selfie Biométrico (Paso 1 - Foto Frontal)`,
                file_url: savedStep1Url,
                status: 'APPROVED',
                uploaded_at: new Date().toISOString(),
                notes: `Fotografía selfie frontal tomada en vivo para cotejo de identidad en "${formTemplate?.title || 'Admisión'}".`
              });
            } catch (err) {
              console.warn('[SELFIE STEP 1 SAVE WARNING]', err.message);
            }
          }

          // 2. Step 2: Smile Challenge Selfie
          const step2Candidate = extractAssetCandidate(selfieObj.step2) || extractAssetCandidate(val.step2);
          if (step2Candidate) {
            const step2Filename = `selfie_biometrico_sonrisa_${cleanFieldTag}.jpg`;
            try {
              let savedStep2Url = step2Candidate;
              if (!step2Candidate.startsWith('/api/storage/')) {
                const savedStep2 = await saveAdmissionAsset({
                  schoolId,
                  applicationId,
                  formId,
                  filename: step2Filename,
                  content: step2Candidate,
                  mimeType: 'image/jpeg'
                });
                savedStep2Url = savedStep2.fileUrl;
              }

              if (selfieObj.step2 && typeof selfieObj.step2 === 'object') {
                selfieObj.step2.fileUrl = savedStep2Url;
                if (selfieObj.step2.base64) delete selfieObj.step2.base64;
              } else {
                selfieObj.step2 = { fileUrl: savedStep2Url, fileName: step2Filename, isImage: true };
              }
              if (val.step2 && typeof val.step2 === 'object') {
                val.step2.fileUrl = savedStep2Url;
                if (val.step2.base64) delete val.step2.base64;
              }

              newDocuments.push({
                id: `doc_selfie_step2_${Date.now()}_${cleanFieldTag}`,
                name: `Selfie Biométrico (Paso 2 - Prueba de Sonrisa)`,
                file_url: savedStep2Url,
                status: 'APPROVED',
                uploaded_at: new Date().toISOString(),
                notes: `Fotografía selfie de prueba de vida (sonrisa activa) capturada en "${formTemplate?.title || 'Admisión'}".`
              });
            } catch (err) {
              console.warn('[SELFIE STEP 2 SAVE WARNING]', err.message);
            }
          }

          // 3. Liveness Video Clip (Anti-Spoofing Proof)
          const videoCandidate = extractAssetCandidate(selfieObj.videoClip) || extractAssetCandidate(val.videoClip);
          if (videoCandidate) {
            const videoFilename = `video_liveness_biometrico_${cleanFieldTag}.webm`;
            try {
              let savedVideoUrl = videoCandidate;
              if (!videoCandidate.startsWith('/api/storage/')) {
                const savedVideo = await saveAdmissionAsset({
                  schoolId,
                  applicationId,
                  formId,
                  filename: videoFilename,
                  content: videoCandidate,
                  mimeType: 'video/webm'
                });
                savedVideoUrl = savedVideo.fileUrl;
              }

              if (selfieObj.videoClip && typeof selfieObj.videoClip === 'object') {
                selfieObj.videoClip.fileUrl = savedVideoUrl;
                if (selfieObj.videoClip.base64) delete selfieObj.videoClip.base64;
              } else {
                selfieObj.videoClip = { fileUrl: savedVideoUrl, fileName: videoFilename, isVideo: true };
              }
              if (val.videoClip && typeof val.videoClip === 'object') {
                val.videoClip.fileUrl = savedVideoUrl;
                if (val.videoClip.base64) delete val.videoClip.base64;
              }

              newDocuments.push({
                id: `doc_video_liveness_${Date.now()}_${cleanFieldTag}`,
                name: `Video de Prueba de Vida (Anti-Spoofing Liveness)`,
                file_url: savedVideoUrl,
                status: 'APPROVED',
                uploaded_at: new Date().toISOString(),
                notes: `Clip de video en vivo registrado durante la prueba de vida biométrica en "${formTemplate?.title || 'Admisión'}".`
              });
            } catch (err) {
              console.warn('[VIDEO LIVENESS SAVE WARNING]', err.message);
            }
          }
        }
      }
    }

    // 4. Process and Save digital signature image
    if (signature && typeof signature === 'string') {
      const sigFilename = `firma_${slugify(cleanRespondent)}.png`;
      const savedSig = await saveAdmissionAsset({
        schoolId,
        applicationId,
        formId,
        filename: sigFilename,
        content: signature,
        mimeType: 'image/png'
      });
      signatureUrl = savedSig.fileUrl;
    }

    // 4. Generate and Save Official Form Summary PDF
    try {
      const formPdfBuffer = await generateFormSubmissionPdf({
        formTitle: formTemplate.title,
        formCategory: formTemplate.category || 'ADMISIÓN',
        schoolName: application.school?.name || 'Ceiba Roots Montessori',
        respondentName: cleanRespondent,
        respondentEmail: respondentEmail || application.tutorEmail || '',
        submittedAt: new Date().toISOString(),
        sections: parseFormSchema(formTemplate.schema),
        formData,
        signatureBase64: signature
      });

      const formPdfName = `Formulario_${slugify(formTemplate.title)}_${slugify(cleanRespondent)}.pdf`;
      const savedFormPdf = await saveAdmissionAsset({
        schoolId,
        applicationId,
        formId,
        filename: formPdfName,
        content: formPdfBuffer,
        mimeType: 'application/pdf'
      });

      newDocuments.push({
        id: `doc_form_${Date.now()}`,
        name: `Formulario Diligenciado: ${formTemplate.title}`,
        file_url: savedFormPdf.fileUrl,
        status: 'APPROVED',
        uploaded_at: new Date().toISOString(),
        notes: `Expediente generado y firmado digitalmente por ${cleanRespondent}.`
      });
    } catch (pdfErr) {
      console.error('[FORM PDF GEN ERROR]', pdfErr);
    }
  } catch (err) {
    console.error('❌ [STORAGE & DOSSIER ERROR]', err);
  }

  return { newDocuments, signatureUrl };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
prisma.admissionStage = prisma.processStage;
prisma.admissionApplication = prisma.processApplication;
prisma.admissionFormTemplate = prisma.processFormTemplate;

const galleryData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/gallery.json'), 'utf-8')
);

const app = express();
const PORT = process.env.PORT || 3001;

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const galleryDir = path.join(publicDir, 'gallery');
const documentsDir = path.join(publicDir, 'documents');

// Ensure physical directories exist on server disk
[galleryDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Serve static public assets from public/ (gallery, public docs) and dist/ (frontend)
app.use('/gallery', express.static(galleryDir));
app.use('/documents', express.static(documentsDir));
app.use(express.static(path.join(rootDir, 'dist')));

// Helper to convert title text into a clean URL-friendly slug
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Helper to hash passwords consistently using sha256
const hashPassword = (pwd) => {
  return crypto.createHash('sha256').update(String(pwd || 'ceiba123')).digest('hex');
};

// Helper to generate sequential filenames
const getUniqueFilename = (dir, prefix, slug, ext) => {
  const baseName = `${prefix}-${slug}`;
  let fileName = `${baseName}${ext}`;
  
  if (!fs.existsSync(path.join(dir, fileName))) {
    return fileName;
  }

  let counter = 1;
  while (fs.existsSync(path.join(dir, fileName))) {
    const padCounter = String(counter).padStart(2, '0');
    fileName = `${baseName}-${padCounter}${ext}`;
    counter++;
  }

  return fileName;
};

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderType = req.body.folder || req.query.folder || 'gallery';
    let targetDir = folderType === 'documents' ? documentsDir : galleryDir;

    const employeeId = req.body.employeeId || req.query.employeeId;
    if (folderType === 'documents' && employeeId) {
      targetDir = path.join(documentsDir, 'rrhh', employeeId);
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const folderType = req.body.folder || req.query.folder || 'gallery';
    let targetDir = folderType === 'documents' ? documentsDir : galleryDir;

    const employeeId = req.body.employeeId || req.query.employeeId;
    if (folderType === 'documents' && employeeId) {
      targetDir = path.join(documentsDir, 'rrhh', employeeId);
    }
    const prefix = folderType === 'documents' ? 'ceiba-doc' : 'ceiba-gallery';

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const rawTitle = req.body.title || path.basename(file.originalname, ext);
    const slug = slugify(rawTitle) || 'foto';

    const finalFilename = getUniqueFilename(targetDir, prefix, slug, ext);
    cb(null, finalFilename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// UNIFIED UPLOAD ROUTE (FOR IMAGES & ASSETS)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    const folderType = req.body.folder || req.query.folder || 'gallery';
    const employeeId = req.body.employeeId || req.query.employeeId;
    const relativeUrl = folderType === 'documents' 
      ? (employeeId ? `/documents/rrhh/${employeeId}/${req.file.filename}` : `/documents/${req.file.filename}`)
      : `/gallery/${req.file.filename}`;

    res.json({
      success: true,
      url: relativeUrl,
      fileName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('Error in /api/upload:', err);
    res.status(500).json({ error: err.message });
  }
});

// KYC FACE DETECTION ASYNC QUEUE ENDPOINT
app.post('/api/kyc/detect-face', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Falta la imagen en formato base64' });
    }

    const jobId = `kyc-face-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    await enqueueFaceDetectionJob(jobId, imageBase64);

    res.json({
      success: true,
      jobId
    });
  } catch (err) {
    console.error('Error in /api/kyc/detect-face:', err);
    res.status(500).json({ error: 'Failed to enqueue face detection job' });
  }
});

// CURP VERIFICATION ASYNC QUEUE ENDPOINT
app.post('/api/kyc/verify-curp', async (req, res) => {
  try {
    const { curp } = req.body;
    if (!curp) {
      return res.status(400).json({ error: 'Falta el CURP a verificar' });
    }

    const cleanCurp = String(curp).toUpperCase().trim();
    const jobId = `kyc-curp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    await enqueueCurpVerificationJob(jobId, cleanCurp);

    res.json({
      success: true,
      jobId
    });
  } catch (err) {
    console.error('Error in /api/kyc/verify-curp:', err);
    res.status(500).json({ error: 'Failed to enqueue CURP verification job' });
  }
});

// MULTI-TENANT RESOLUTION MIDDLEWARE
async function resolveSchool(req, res, next) {
  try {
    const rawSlug = req.headers['x-school-slug'] || req.query.schoolSlug;
    const rawId = req.headers['x-school-id'] || req.query.schoolId;

    const schoolId = rawId && String(rawId).trim() !== '' && rawId !== 'undefined' && rawId !== 'null' ? String(rawId).trim() : null;
    const schoolSlug = rawSlug && String(rawSlug).trim() !== '' && rawSlug !== 'undefined' && rawSlug !== 'null' ? String(rawSlug).trim().toLowerCase() : null;

    let school = null;
    if (schoolId) {
      school = await prisma.school.findUnique({ where: { id: schoolId } });
    }
    if (!school && schoolSlug) {
      school = await prisma.school.findUnique({ where: { slug: schoolSlug } });
    }

    if (!school) {
      // Default to ceiba school or first school
      school = await prisma.school.findFirst({ where: { slug: 'ceiba' } }) || await prisma.school.findFirst();
    }

    if (!school) {
      school = await prisma.school.create({
        data: {
          id: 'school_ceiba',
          slug: 'ceiba',
          name: 'Ceiba Montessori International',
          logoUrl: '/favicon.png',
        }
      });
    }

    req.school = school;
    next();
  } catch (err) {
    console.error('Error in resolveSchool middleware:', err);
    res.status(500).json({ error: 'Tenant resolution error' });
  }
}

app.use('/api', resolveSchool);

// REST API ENDPOINTS

// SCHOOLS (WORKSPACES) ENDPOINTS
app.get('/api/schools', async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(schools);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/schools', async (req, res) => {
  try {
    const { 
      name, 
      slug: customSlug, 
      legalName, 
      country, 
      province, 
      city, 
      address, 
      mapLat, 
      mapLng, 
      logoUrl, 
      primaryColor, 
      accentColor, 
      phone, 
      email, 
      features 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del colegio es obligatorio.' });
    }

    let baseSlug = (customSlug || slugify(name)).toLowerCase().trim();
    if (!baseSlug) baseSlug = 'colegio';

    // Ensure unique slug
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.school.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const school = await prisma.school.create({
      data: {
        slug: finalSlug,
        name: name.trim(),
        legalName: legalName || '',
        country: country || '',
        province: province || '',
        city: city || '',
        address: address || '',
        mapLat: mapLat ? parseFloat(mapLat) : null,
        mapLng: mapLng ? parseFloat(mapLng) : null,
        logoUrl: logoUrl || '',
        primaryColor: primaryColor || '#1b3b2b',
        accentColor: accentColor || '#c86d51',
        phone: phone || '',
        email: email || '',
        features: features || {
          gallery: true,
          documents: true,
          applications: true,
          tutorPortal: true,
          whatsappCTA: true,
        },
      }
    });

    // If user is authenticated, link as OWNER
    const userEmail = req.headers['x-user-email'] || req.body.creatorEmail;
    if (userEmail) {
      const user = await prisma.user.findUnique({ where: { email: String(userEmail).trim().toLowerCase() } });
      if (user) {
        await prisma.schoolMembership.upsert({
          where: {
            userId_schoolId: {
              userId: user.id,
              schoolId: school.id,
            }
          },
          update: { role: 'OWNER' },
          create: {
            userId: user.id,
            schoolId: school.id,
            role: 'OWNER',
          }
        });
      }
    }

    res.json(school);
  } catch (e) {
    console.error('Error creating school:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/schools/current', async (req, res) => {
  res.json(req.school);
});

app.put('/api/schools/current', async (req, res) => {
  try {
    const { name, logoUrl, address, phone, email, features } = req.body;
    const updated = await prisma.school.update({
      where: { id: req.school.id },
      data: {
        ...(name && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(features !== undefined && { features }),
      }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// AUTH & RBAC ENDPOINTS
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          include: { school: true }
        }
      }
    });

    if (!user || user.passwordHash !== inputHash) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    // If user is OWNER or ADMIN in any school, ensure they have access to all schools
    const isSuperAdmin = user.memberships.some(m => m.role === 'OWNER' || m.role === 'ADMIN') || cleanEmail === 'admin@ceibamontessori.com';
    if (isSuperAdmin) {
      const allSchools = await prisma.school.findMany();
      for (const s of allSchools) {
        if (!user.memberships.some(m => m.schoolId === s.id)) {
          const newM = await prisma.schoolMembership.upsert({
            where: { userId_schoolId: { userId: user.id, schoolId: s.id } },
            update: { role: 'OWNER' },
            create: { userId: user.id, schoolId: s.id, role: 'OWNER' },
            include: { school: true }
          });
          user.memberships.push(newM);
        }
      }
    }

    // Build memberships with active enrollment check
    const enrichedMemberships = await Promise.all(user.memberships.map(async (m) => {
      let hasActiveEnrollment = true;
      let activeStudentsCount = 0;
      let totalStudentsCount = 0;

      if (m.role === 'TUTOR') {
        activeStudentsCount = await prisma.studentTutor.count({
          where: {
            tutorUserId: user.id,
            student: {
              schoolId: m.schoolId,
              status: 'active'
            }
          }
        });

        totalStudentsCount = await prisma.studentTutor.count({
          where: {
            tutorUserId: user.id,
            student: {
              schoolId: m.schoolId
            }
          }
        });

        hasActiveEnrollment = activeStudentsCount > 0;
      }

      return {
        id: m.id,
        userId: m.userId,
        schoolId: m.schoolId,
        role: m.role,
        hasActiveEnrollment,
        activeStudentsCount,
        totalStudentsCount,
        school: m.school
      };
    }));

    // Determine active membership (matching requested school or first active one)
    let activeMembership = enrichedMemberships.find(m => m.schoolId === req.school.id) || enrichedMemberships[0] || null;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || user.email.split('@')[0],
        phone: user.phone || ''
      },
      memberships: enrichedMemberships,
      activeMembership
    });
  } catch (e) {
    console.error('Error in /api/auth/login:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (user && user.passwordHash === inputHash) {
      return res.json({ valid: true });
    }
    return res.json({ valid: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash: newHash }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/profile', async (req, res) => {
  try {
    const { email, fullName, phone } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const updatedUser = await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true
      }
    });
    res.json({ success: true, user: updatedUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ENVIRONMENTS / EDUCATIONAL LEVELS & SALONES ENDPOINTS
app.get('/api/environments', async (req, res) => {
  try {
    const envs = await prisma.environment.findMany({
      where: { schoolId: req.school.id },
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: { minAgeYears: 'asc' }
    });
    res.json(envs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/environments/:id', async (req, res) => {
  try {
    const env = await prisma.environment.findFirst({
      where: { id: req.params.id, schoolId: req.school.id },
      include: {
        students: {
          select: { id: true, fullName: true, enrollmentCode: true, dateOfBirth: true }
        },
        _count: {
          select: { students: true }
        }
      }
    });
    if (!env) return res.status(404).json({ error: 'Ambiente no encontrado' });
    res.json(env);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/environments', async (req, res) => {
  try {
    const { name, stage, description, coverImage, minAgeYears, maxAgeYears, capacity, color, startTime, endTime, scheduleDays } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del ambiente/nivel es obligatorio.' });
    }

    const env = await prisma.environment.create({
      data: {
        schoolId: req.school.id,
        name: name.trim(),
        stage: stage || '',
        description: description || '',
        coverImage: coverImage || '',
        minAgeYears: minAgeYears !== undefined && minAgeYears !== '' ? parseFloat(minAgeYears) : null,
        maxAgeYears: maxAgeYears !== undefined && maxAgeYears !== '' ? parseFloat(maxAgeYears) : null,
        capacity: capacity ? parseInt(capacity) : 25,
        color: color || '#1b3b2b',
        startTime: startTime !== undefined ? (startTime || null) : '08:00',
        endTime: endTime !== undefined ? (endTime || null) : '13:30',
        scheduleDays: scheduleDays !== undefined ? (typeof scheduleDays === 'string' ? scheduleDays : JSON.stringify(scheduleDays)) : '["Lunes","Martes","Miércoles","Jueves","Viernes"]',
      },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });
    res.json(env);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/environments/:id', async (req, res) => {
  try {
    const { name, stage, description, coverImage, minAgeYears, maxAgeYears, capacity, color, startTime, endTime, scheduleDays } = req.body;
    const env = await prisma.environment.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(stage !== undefined && { stage }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage: coverImage ? String(coverImage).trim() : null }),
        ...(minAgeYears !== undefined && { minAgeYears: minAgeYears !== '' ? parseFloat(minAgeYears) : null }),
        ...(maxAgeYears !== undefined && { maxAgeYears: maxAgeYears !== '' ? parseFloat(maxAgeYears) : null }),
        ...(capacity !== undefined && { capacity: parseInt(capacity) }),
        ...(color !== undefined && { color }),
        ...(startTime !== undefined && { startTime: startTime || null }),
        ...(endTime !== undefined && { endTime: endTime || null }),
        ...(scheduleDays !== undefined && { scheduleDays: typeof scheduleDays === 'string' ? scheduleDays : JSON.stringify(scheduleDays) }),
      },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });
    res.json(env);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/environments/:id', async (req, res) => {
  try {
    const activeStudentsCount = await prisma.student.count({
      where: {
        environmentId: req.params.id,
        status: { in: ['active', 'ACTIVE'] }
      }
    });

    if (activeStudentsCount > 0) {
      return res.status(400).json({
        error: `No es posible eliminar este ambiente porque tiene ${activeStudentsCount} estudiante(s) con matrícula activa.`
      });
    }

    await prisma.environment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/environments/seed-presets', async (req, res) => {
  try {
    const { preset } = req.body; // 'montessori' | 'traditional'
    let items = [];

    if (preset === 'montessori') {
      items = [
        { name: 'Nido', stage: 'Infancia Temprana', minAgeYears: 0, maxAgeYears: 1.5, color: '#0284c7', description: 'Bebés desde los primeros meses hasta caminar con seguridad.' },
        { name: 'Comunidad Infantil', stage: 'Infancia Temprana', minAgeYears: 1.5, maxAgeYears: 3, color: '#059669', description: 'Movimiento, lenguaje, independencia y control de esfínteres.' },
        { name: 'Casa de Niños', stage: 'Preescolar / Kínder', minAgeYears: 3, maxAgeYears: 6, color: '#1b3b2b', description: 'Vida práctica, sensorial, lenguaje, matemáticas y cultura.' },
        { name: 'Taller I (Primaria Baja)', stage: 'Primaria', minAgeYears: 6, maxAgeYears: 9, color: '#d97706', description: 'Educación cósmica, mente razonadora y pensamiento abstracto.' },
        { name: 'Taller II (Primaria Alta)', stage: 'Primaria', minAgeYears: 9, maxAgeYears: 12, color: '#c86d51', description: 'Investigación profunda, autonomía moral y ciencia.' },
        { name: 'Erdkinder / Adolescentes', stage: 'Secundaria', minAgeYears: 12, maxAgeYears: 15, color: '#581c87', description: 'Trabajo con la tierra, economía práctica y proyectos globales.' }
      ];
    } else {
      items = [
        { name: 'Maternal', stage: 'Educación Inicial', minAgeYears: 1, maxAgeYears: 3, color: '#0284c7', description: 'Estimulación temprana y desarrollo socioemocional.' },
        { name: 'Kínder 1', stage: 'Preescolar', minAgeYears: 3, maxAgeYears: 4, color: '#059669', description: 'Primer grado de educación preescolar.' },
        { name: 'Kínder 2', stage: 'Preescolar', minAgeYears: 4, maxAgeYears: 5, color: '#1b3b2b', description: 'Segundo grado de educación preescolar.' },
        { name: 'Kínder 3', stage: 'Preescolar', minAgeYears: 5, maxAgeYears: 6, color: '#10b981', description: 'Tercer grado de preescolar e iniciación a la lectoescritura.' },
        { name: 'Primaria', stage: 'Primaria (1º a 6º)', minAgeYears: 6, maxAgeYears: 12, color: '#d97706', description: 'Educación primaria formal de 1º a 6º grado.' },
        { name: 'Secundaria', stage: 'Secundaria (1º a 3º)', minAgeYears: 12, maxAgeYears: 15, color: '#c86d51', description: 'Educación secundaria básica de 1º a 3º año.' }
      ];
    }

    const created = [];
    for (const item of items) {
      const env = await prisma.environment.create({
        data: {
          schoolId: req.school.id,
          ...item
        }
      });
      created.push(env);
    }

    res.json({ success: true, count: created.length, environments: created });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// STUDENTS & TUTORS ENDPOINTS
app.get('/api/tutors', async (req, res) => {
  try {
    const tutors = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            schoolId: req.school.id,
            role: 'TUTOR'
          }
        }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        studentLinks: {
          where: {
            student: {
              schoolId: req.school.id
            }
          },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                enrollmentCode: true,
                grade: true,
                environment: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                    stage: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });
    res.json(tutors);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/tutors/:id', async (req, res) => {
  try {
    const { fullName, phone, email, avatarUrl, password, studentLinks } = req.body;

    const dataToUpdate = {};
    if (fullName !== undefined) dataToUpdate.fullName = fullName.trim();
    if (phone !== undefined) dataToUpdate.phone = phone.trim();
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl.trim();
    if (email !== undefined) dataToUpdate.email = email.trim().toLowerCase();
    if (password && password.trim()) {
      dataToUpdate.passwordHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    // Update student link permissions (isPrimaryContact, authorizedPickUp, relationship)
    if (Array.isArray(studentLinks)) {
      for (const link of studentLinks) {
        if (link.id || link.studentId) {
          await prisma.studentTutor.updateMany({
            where: {
              ...(link.id ? { id: link.id } : { studentId: link.studentId, tutorUserId: req.params.id })
            },
            data: {
              ...(link.relationship && { relationship: link.relationship }),
              ...(link.isPrimaryContact !== undefined && { isPrimaryContact: Boolean(link.isPrimaryContact) }),
              ...(link.authorizedPickUp !== undefined && { authorizedPickUp: Boolean(link.authorizedPickUp) }),
            }
          });
        }
      }
    }

    res.json(updatedUser);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { schoolId: req.school.id },
      include: {
        environment: true,
        tutors: {
          include: {
            tutor: {
              select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true }
            }
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, schoolId: req.school.id },
      include: {
        environment: true,
        tutors: {
          include: {
            tutor: {
              select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true }
            }
          }
        }
      }
    });
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json(student);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { 
      fullName, 
      avatarUrl,
      gender,
      dateOfBirth,
      nationalId,
      idDocumentUrl,
      grade, 
      enrollmentCode, 
      enrollmentDate,
      previousSchool,
      previousMethodology,
      bloodType,
      allergies,
      foodAllergies,
      dietaryRestrictions,
      medicalNotes,
      internalNotes,
      authorizedContacts,
      consents,
      environmentId, 
      status,
      tutors
    } = req.body;

    const authContactsString = Array.isArray(authorizedContacts) 
      ? JSON.stringify(authorizedContacts) 
      : (typeof authorizedContacts === 'string' ? authorizedContacts : '[]');

    const foodAllergiesString = Array.isArray(foodAllergies)
      ? JSON.stringify(foodAllergies)
      : (typeof foodAllergies === 'string' ? foodAllergies : '[]');

    const consentsString = Array.isArray(consents)
      ? JSON.stringify(consents)
      : (typeof consents === 'string' ? consents : '[]');

    const student = await prisma.student.create({
      data: {
        schoolId: req.school.id,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl ? avatarUrl.trim() : '',
        gender: gender || '',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationalId: nationalId ? nationalId.trim() : '',
        idDocumentUrl: idDocumentUrl ? idDocumentUrl.trim() : '',
        grade: grade || '',
        enrollmentCode: enrollmentCode ? enrollmentCode.trim() : '',
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : null,
        previousSchool: previousSchool ? previousSchool.trim() : '',
        previousMethodology: previousMethodology ? previousMethodology.trim() : '',
        bloodType: bloodType || '',
        allergies: allergies ? allergies.trim() : '',
        foodAllergies: foodAllergiesString,
        dietaryRestrictions: dietaryRestrictions ? dietaryRestrictions.trim() : '',
        medicalNotes: medicalNotes ? medicalNotes.trim() : '',
        internalNotes: internalNotes ? internalNotes.trim() : '',
        authorizedContacts: authContactsString,
        consents: consentsString,
        environmentId: environmentId || null,
        status: status || 'active'
      }
    });

    // Handle initial tutors if provided
    if (Array.isArray(tutors) && tutors.length > 0) {
      for (const t of tutors) {
        let tutorUserId = t.userId || t.tutorUserId;
        
        if (!tutorUserId && t.email) {
          const cleanEmail = t.email.trim().toLowerCase();
          let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
          if (!user) {
            const rawPassword = t.password || 'ceiba123';
            const passwordHash = crypto.createHash('sha256').update(rawPassword).digest('hex');
            user = await prisma.user.create({
              data: {
                email: cleanEmail,
                passwordHash,
                fullName: t.fullName || cleanEmail.split('@')[0],
                phone: t.phone || '',
                avatarUrl: t.avatarUrl || ''
              }
            });
          } else if (t.avatarUrl) {
            await prisma.user.update({
              where: { id: user.id },
              data: { avatarUrl: t.avatarUrl }
            });
          }
          tutorUserId = user.id;
        }

        if (tutorUserId) {
          await prisma.schoolMembership.upsert({
            where: {
              userId_schoolId: {
                userId: tutorUserId,
                schoolId: req.school.id
              }
            },
            update: {},
            create: {
              userId: tutorUserId,
              schoolId: req.school.id,
              role: 'TUTOR'
            }
          });

          await prisma.studentTutor.create({
            data: {
              studentId: student.id,
              tutorUserId,
              relationship: t.relationship || 'GUARDIAN',
              isPrimaryContact: Boolean(t.isPrimaryContact),
              authorizedPickUp: t.authorizedPickUp !== undefined ? Boolean(t.authorizedPickUp) : true,
            }
          });
        }
      }
    }

    const result = await prisma.student.findUnique({
      where: { id: student.id },
      include: {
        environment: true,
        tutors: {
          include: {
            tutor: { select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true } }
          }
        }
      }
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { 
      fullName, 
      avatarUrl,
      gender,
      dateOfBirth,
      nationalId,
      idDocumentUrl,
      grade, 
      enrollmentCode, 
      enrollmentDate,
      previousSchool,
      previousMethodology,
      bloodType,
      allergies,
      foodAllergies,
      dietaryRestrictions,
      medicalNotes,
      internalNotes,
      authorizedContacts,
      consents,
      environmentId, 
      status 
    } = req.body;

    const authContactsString = authorizedContacts !== undefined
      ? (Array.isArray(authorizedContacts) ? JSON.stringify(authorizedContacts) : String(authorizedContacts))
      : undefined;

    const foodAllergiesString = foodAllergies !== undefined
      ? (Array.isArray(foodAllergies) ? JSON.stringify(foodAllergies) : String(foodAllergies))
      : undefined;

    const consentsString = consents !== undefined
      ? (Array.isArray(consents) ? JSON.stringify(consents) : String(consents))
      : undefined;

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...(fullName !== undefined && { fullName: fullName.trim() }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl ? avatarUrl.trim() : null }),
        ...(gender !== undefined && { gender }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(nationalId !== undefined && { nationalId: nationalId ? nationalId.trim() : '' }),
        ...(idDocumentUrl !== undefined && { idDocumentUrl: idDocumentUrl ? idDocumentUrl.trim() : '' }),
        ...(grade !== undefined && { grade: grade || '' }),
        ...(enrollmentCode !== undefined && { enrollmentCode: enrollmentCode ? enrollmentCode.trim() : '' }),
        ...(enrollmentDate !== undefined && { enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : null }),
        ...(previousSchool !== undefined && { previousSchool: previousSchool ? previousSchool.trim() : '' }),
        ...(previousMethodology !== undefined && { previousMethodology: previousMethodology ? previousMethodology.trim() : '' }),
        ...(bloodType !== undefined && { bloodType: bloodType || '' }),
        ...(allergies !== undefined && { allergies: allergies ? allergies.trim() : '' }),
        ...(foodAllergiesString !== undefined && { foodAllergies: foodAllergiesString }),
        ...(dietaryRestrictions !== undefined && { dietaryRestrictions: dietaryRestrictions.trim() }),
        ...(medicalNotes !== undefined && { medicalNotes: medicalNotes ? medicalNotes.trim() : '' }),
        ...(internalNotes !== undefined && { internalNotes: internalNotes ? internalNotes.trim() : '' }),
        ...(authContactsString !== undefined && { authorizedContacts: authContactsString }),
        ...(consentsString !== undefined && { consents: consentsString }),
        ...(environmentId !== undefined && { environmentId: environmentId || null }),
        ...(status !== undefined && { status: status || 'active' })
      },
      include: {
        environment: true,
        tutors: {
          include: {
            tutor: { select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true } }
          }
        }
      }
    });

    res.json(student);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await prisma.student.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// LINK OR CREATE TUTOR FOR STUDENT
app.post('/api/students/:id/tutors', async (req, res) => {
  try {
    const { userId, email, fullName, phone, avatarUrl, relationship, isPrimaryContact, authorizedPickUp, password } = req.body;
    let targetUserId = userId;

    if (!targetUserId) {
      const cleanEmail = email.trim().toLowerCase();
      let tutor = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!tutor) {
        const rawPassword = password || 'ceiba123';
        const defaultHash = crypto.createHash('sha256').update(rawPassword).digest('hex');
        tutor = await prisma.user.create({
          data: {
            email: cleanEmail,
            passwordHash: defaultHash,
            fullName: fullName || cleanEmail.split('@')[0],
            phone: phone || '',
            avatarUrl: avatarUrl ? avatarUrl.trim() : ''
          }
        });
      } else if (avatarUrl) {
        await prisma.user.update({
          where: { id: tutor.id },
          data: { avatarUrl: avatarUrl.trim() }
        });
      }
      targetUserId = tutor.id;
    }

    // Ensure tutor has TUTOR membership in active school
    await prisma.schoolMembership.upsert({
      where: {
        userId_schoolId: {
          userId: targetUserId,
          schoolId: req.school.id
        }
      },
      update: {},
      create: {
        userId: targetUserId,
        schoolId: req.school.id,
        role: 'TUTOR'
      }
    });

    // Link tutor to student
    const link = await prisma.studentTutor.upsert({
      where: {
        studentId_tutorUserId: {
          studentId: req.params.id,
          tutorUserId: targetUserId
        }
      },
      update: {
        relationship: relationship || 'GUARDIAN',
        isPrimaryContact: isPrimaryContact !== undefined ? Boolean(isPrimaryContact) : undefined,
        authorizedPickUp: authorizedPickUp !== undefined ? Boolean(authorizedPickUp) : undefined,
      },
      create: {
        studentId: req.params.id,
        tutorUserId: targetUserId,
        relationship: relationship || 'GUARDIAN',
        isPrimaryContact: Boolean(isPrimaryContact),
        authorizedPickUp: authorizedPickUp !== undefined ? Boolean(authorizedPickUp) : true,
      },
      include: {
        tutor: { select: { id: true, email: true, fullName: true, phone: true } }
      }
    });

    res.json(link);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UNLINK TUTOR FROM STUDENT
app.delete('/api/students/:id/tutors/:tutorUserId', async (req, res) => {
  try {
    await prisma.studentTutor.delete({
      where: {
        studentId_tutorUserId: {
          studentId: req.params.id,
          tutorUserId: req.params.tutorUserId
        }
      }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// WAITLIST (LISTA DE ESPERA) ENDPOINTS
// ==========================================

// GET /api/waitlist
app.get('/api/waitlist', async (req, res) => {
  try {
    const { status, environmentId, search } = req.query;
    
    const where = {
      schoolId: req.school.id,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (environmentId && environmentId !== 'ALL') {
      where.targetEnvironmentIds = {
        has: environmentId
      };
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { childName: { contains: q, mode: 'insensitive' } },
        { parentName: { contains: q, mode: 'insensitive' } },
        { parentEmail: { contains: q, mode: 'insensitive' } },
        { parentPhone: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } }
      ];
    }

    const entries = await prisma.waitlistEntry.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        enrolledStudent: {
          select: {
            id: true,
            fullName: true,
            enrollmentCode: true,
            status: true,
            environment: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        },
        processApplication: {
          include: {
            stage: true,
            targetEnvironment: true
          }
        }
      }
    });

    res.json(entries);
  } catch (e) {
    console.error('Error fetching waitlist:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/waitlist/:id
app.get('/api/waitlist/:id', async (req, res) => {
  try {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: req.params.id },
      include: {
        enrolledStudent: true
      }
    });
    if (!entry) return res.status(404).json({ error: 'Registro en lista de espera no encontrado' });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/waitlist
app.post('/api/waitlist', async (req, res) => {
  try {
    const {
      childName,
      birthDate,
      gender,
      targetEnvironmentIds,
      parentName,
      parentEmail,
      parentPhone,
      relationship,
      preferredStartDate,
      notes,
      previousSchool,
      previousMethodology,
      priority
    } = req.body;

    if (!childName || !childName.trim()) {
      return res.status(400).json({ error: 'El nombre del infante es requerido' });
    }
    if (!parentName || !parentName.trim()) {
      return res.status(400).json({ error: 'El nombre del padre / tutor es requerido' });
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        schoolId: req.school.id,
        childName: childName.trim(),
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || 'NOT_SPECIFIED',
        targetEnvironmentIds: Array.isArray(targetEnvironmentIds) ? targetEnvironmentIds : [],
        parentName: parentName.trim(),
        parentEmail: parentEmail ? parentEmail.trim().toLowerCase() : '',
        parentPhone: parentPhone ? parentPhone.trim() : '',
        relationship: relationship || 'MOTHER',
        preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
        notes: notes ? notes.trim() : '',
        previousSchool: previousSchool ? previousSchool.trim() : '',
        previousMethodology: previousMethodology ? previousMethodology.trim() : '',
        status: 'WAITING',
        priority: typeof priority === 'number' ? priority : 0
      }
    });

    res.status(201).json(entry);
  } catch (e) {
    console.error('Error creating waitlist entry:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/waitlist/:id
app.put('/api/waitlist/:id', async (req, res) => {
  try {
    const {
      childName,
      birthDate,
      gender,
      targetEnvironmentIds,
      parentName,
      parentEmail,
      parentPhone,
      relationship,
      preferredStartDate,
      notes,
      previousSchool,
      previousMethodology,
      status,
      priority
    } = req.body;

    const data = {};
    if (childName !== undefined) data.childName = childName.trim();
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
    if (gender !== undefined) data.gender = gender;
    if (targetEnvironmentIds !== undefined) data.targetEnvironmentIds = Array.isArray(targetEnvironmentIds) ? targetEnvironmentIds : [];
    if (parentName !== undefined) data.parentName = parentName.trim();
    if (parentEmail !== undefined) data.parentEmail = parentEmail ? parentEmail.trim().toLowerCase() : '';
    if (parentPhone !== undefined) data.parentPhone = parentPhone ? parentPhone.trim() : '';
    if (relationship !== undefined) data.relationship = relationship;
    if (preferredStartDate !== undefined) data.preferredStartDate = preferredStartDate ? new Date(preferredStartDate) : null;
    if (notes !== undefined) data.notes = notes ? notes.trim() : '';
    if (previousSchool !== undefined) data.previousSchool = previousSchool ? previousSchool.trim() : '';
    if (previousMethodology !== undefined) data.previousMethodology = previousMethodology ? previousMethodology.trim() : '';
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = Number(priority);

    const updated = await prisma.waitlistEntry.update({
      where: { id: req.params.id },
      data
    });

    res.json(updated);
  } catch (e) {
    console.error('Error updating waitlist entry:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/waitlist/:id
app.delete('/api/waitlist/:id', async (req, res) => {
  try {
    await prisma.waitlistEntry.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting waitlist entry:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/waitlist/:id/start-admission (Transfers waitlist child into admissions pipeline)
app.post('/api/waitlist/:id/start-admission', async (req, res) => {
  try {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: req.params.id }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Registro en lista de espera no encontrado' });
    }

    await ensureDefaultAdmissionStages(req.school.id);

    // Get default admissions process
    const process = await prisma.process.findUnique({
      where: { schoolId_slug: { schoolId: req.school.id, slug: 'admissions' } }
    });

    if (!process) {
      return res.status(500).json({ error: 'No se encontró el proceso de admisión' });
    }

    // 1. Find the initial stage for this process
    const initialStage = await prisma.processStage.findFirst({
      where: { schoolId: req.school.id, processId: process.id, isInitial: true }
    }) || await prisma.processStage.findFirst({
      where: { schoolId: req.school.id, processId: process.id },
      orderBy: { orderIndex: 'asc' }
    });

    if (!initialStage) {
      return res.status(500).json({ error: 'No se encontró la fase inicial de admisión' });
    }

    const { targetEnvironmentId, internalNotes } = req.body;
    const selectedEnvId = targetEnvironmentId || (entry.targetEnvironmentIds && entry.targetEnvironmentIds[0]) || null;

    // 2. Create AdmissionApplication record
    const application = await prisma.admissionApplication.create({
      data: {
        schoolId: req.school.id,
        processId: process.id,
        stageId: initialStage.id,
        childName: entry.childName,
        childFirstName: entry.childName.split(' ')[0] || '',
        childLastName: entry.childName.split(' ').slice(1).join(' ') || '',
        birthDate: entry.birthDate,
        gender: entry.gender || 'NOT_SPECIFIED',
        targetEnvironmentId: selectedEnvId,
        targetEnvironmentIds: entry.targetEnvironmentIds || [],
        preferredStartDate: entry.preferredStartDate,
        previousSchool: entry.previousSchool || '',
        previousMethodology: entry.previousMethodology || '',
        tutorName: entry.parentName,
        tutorEmail: (entry.parentEmail || '').trim().toLowerCase(),
        tutorPhone: entry.parentPhone || '',
        tutorRelationship: entry.relationship || 'MOTHER',
        internalNotes: internalNotes || entry.notes || 'Aspirante transferido desde Lista de Espera',
        status: 'IN_PROGRESS',
        history: [
          {
            fromStageId: null,
            toStageId: initialStage.id,
            toStageName: initialStage.name,
            timestamp: new Date().toISOString(),
            actor: req.user?.fullName || 'Directora / Admin',
            notes: 'Aspirante ingresado al proceso de admisión desde Lista de Espera'
          }
        ]
      },
      include: {
        stage: true,
        targetEnvironment: true
      }
    });

    // 3. Update WaitlistEntry status to IN_ADMISSION and link application
    const updatedWaitlist = await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        status: 'IN_ADMISSION',
        processApplicationId: application.id
      },
      include: {
        processApplication: {
          include: { stage: true, targetEnvironment: true }
        }
      }
    });

    res.json({
      success: true,
      application,
      waitlistEntry: updatedWaitlist
    });
  } catch (e) {
    console.error('Error starting admission from waitlist:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/waitlist/reorder (Updates waitlist entry order/priorities)
app.post('/api/waitlist/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs no válida' });
    }

    const updates = orderedIds.map((id, index) => {
      const priority = (orderedIds.length - index) * 10;
      return prisma.waitlistEntry.update({
        where: { id },
        data: { priority }
      });
    });

    await prisma.$transaction(updates);
    res.json({ success: true });
  } catch (e) {
    console.error('Error reordering waitlist:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/applications/:id/return-to-waitlist (Returns candidate to waitlist)
app.post('/api/admissions/applications/:id/return-to-waitlist', async (req, res) => {
  try {
    const appRecord = await prisma.admissionApplication.findUnique({
      where: { id: req.params.id },
      include: {
        waitlistEntries: true,
        targetEnvironment: true
      }
    });

    if (!appRecord) {
      return res.status(404).json({ error: 'Expediente de admisión no encontrado' });
    }

    const { preferredStartDate, notes } = req.body;

    // 1. Update AdmissionApplication status to 'DEFERRED'
    const updatedApp = await prisma.admissionApplication.update({
      where: { id: appRecord.id },
      data: {
        status: 'DEFERRED',
        internalNotes: notes
          ? `${appRecord.internalNotes || ''}\n[Pospuesto a Lista de Espera]: ${notes}`.trim()
          : appRecord.internalNotes,
        history: [
          ...(Array.isArray(appRecord.history) ? appRecord.history : []),
          {
            timestamp: new Date().toISOString(),
            actor: req.user?.fullName || 'Directora / Admin',
            notes: notes ? `Pospuesto y regresado a Lista de Espera: ${notes}` : 'Regresado a Lista de Espera por solicitud familiar / cambio de ciclo'
          }
        ]
      }
    });

    // 2. Re-activate or create waitlist entry
    let waitlistEntry;
    const existingWaitlist = appRecord.waitlistEntries && appRecord.waitlistEntries[0];
    if (existingWaitlist) {
      waitlistEntry = await prisma.waitlistEntry.update({
        where: { id: existingWaitlist.id },
        data: {
          status: 'WAITING',
          preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : appRecord.preferredStartDate,
          notes: notes ? `${existingWaitlist.notes || ''}\n[Pospuesto]: ${notes}`.trim() : existingWaitlist.notes
        }
      });
    } else {
      waitlistEntry = await prisma.waitlistEntry.create({
        data: {
          schoolId: req.school.id,
          childName: appRecord.childName,
          birthDate: appRecord.birthDate,
          gender: appRecord.gender,
          targetEnvironmentIds: appRecord.targetEnvironmentId ? [appRecord.targetEnvironmentId] : (appRecord.targetEnvironmentIds || []),
          parentName: appRecord.tutorName,
          parentEmail: appRecord.tutorEmail,
          parentPhone: appRecord.tutorPhone,
          relationship: appRecord.tutorRelationship || 'MOTHER',
          preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : appRecord.preferredStartDate,
          notes: notes || 'Regresado a Lista de Espera desde Admisiones',
          status: 'WAITING',
          processApplicationId: appRecord.id
        }
      });
    }

    res.json({
      success: true,
      application: updatedApp,
      waitlistEntry
    });
  } catch (e) {
    console.error('Error returning application to waitlist:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/waitlist/:id/enroll (Converts waitlist child into enrolled student)
app.post('/api/waitlist/:id/enroll', async (req, res) => {
  try {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: req.params.id }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Registro en lista de espera no encontrado' });
    }

    const {
      environmentId,
      enrollmentCode,
      enrollmentDate,
      grade,
      bloodType,
      allergies,
      previousSchool,
      previousMethodology,
      medicalNotes,
      internalNotes
    } = req.body;

    if (!environmentId) {
      return res.status(400).json({ error: 'Debes seleccionar el salón/ambiente de destino' });
    }

    // 1. Create Student record
    const student = await prisma.student.create({
      data: {
        schoolId: req.school.id,
        environmentId,
        fullName: entry.childName,
        gender: entry.gender || '',
        dateOfBirth: entry.birthDate,
        enrollmentCode: enrollmentCode || `MAT-${Date.now().toString().slice(-4)}`,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
        grade: grade || '',
        previousSchool: previousSchool !== undefined ? previousSchool.trim() : (entry.previousSchool || ''),
        previousMethodology: previousMethodology !== undefined ? previousMethodology.trim() : (entry.previousMethodology || ''),
        bloodType: bloodType || '',
        allergies: allergies || '',
        medicalNotes: medicalNotes || '',
        internalNotes: internalNotes || entry.notes || 'Ingreso procedente de Lista de Espera',
        status: 'active'
      }
    });

    // 2. If parent information exists, create or link Tutor
    if (entry.parentEmail && entry.parentEmail.trim()) {
      const email = entry.parentEmail.trim().toLowerCase();
      let tutorUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!tutorUser) {
        tutorUser = await prisma.user.create({
          data: {
            email,
            passwordHash: 'ceiba2026',
            fullName: entry.parentName,
            phone: entry.parentPhone || ''
          }
        });
      }

      // Check membership
      const existingMembership = await prisma.schoolMembership.findUnique({
        where: {
          userId_schoolId: {
            userId: tutorUser.id,
            schoolId: req.school.id
          }
        }
      });

      if (!existingMembership) {
        await prisma.schoolMembership.create({
          data: {
            userId: tutorUser.id,
            schoolId: req.school.id,
            role: 'TUTOR'
          }
        });
      }

      // Link Student to Tutor
      await prisma.studentTutor.create({
        data: {
          studentId: student.id,
          tutorUserId: tutorUser.id,
          relationship: entry.relationship || 'GUARDIAN',
          isPrimaryContact: true,
          authorizedPickUp: true
        }
      });
    }

    // 3. Mark WaitlistEntry as ENROLLED
    const updatedEntry = await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        status: 'ENROLLED',
        enrolledStudentId: student.id
      },
      include: {
        enrolledStudent: true
      }
    });

    res.json({
      success: true,
      student,
      waitlistEntry: updatedEntry
    });
  } catch (e) {
    console.error('Error enrolling waitlist child:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ADMISSIONS PROCESS (PIPELINE & EXPEDIENTES)
// ==========================================

const DEFAULT_ADMISSION_STAGES = [
  {
    slug: 'process_started',
    name: 'Proceso Iniciado',
    description: 'Recepción de datos básicos del aspirante y primer contacto familiar.',
    color: '#2563eb',
    orderIndex: 0,
    isInitial: true,
    isFinal: false,
    isTerminalRejected: false,
    requiredDocuments: [],
    formQuestions: [],
    hooksConfig: { notifyTutorOnEnter: true, welcomeMessage: '¡Bienvenido al proceso de admisión!' }
  },
  {
    slug: 'document_reception',
    name: 'Recepción de Documentos',
    description: 'Subida e integración de actas, cartillas e identificaciones de tutores.',
    color: '#4f46e5',
    orderIndex: 1,
    isInitial: false,
    isFinal: false,
    isTerminalRejected: false,
    requiredDocuments: ['Acta de Nacimiento', 'Cartilla de Vacunación', 'Identificación Oficial de Tutores', 'Comprobante de Domicilio'],
    formQuestions: [],
    hooksConfig: { requestDocumentsReminder: true }
  },
  {
    slug: 'family_interview',
    name: 'Entrevista Familiar & Visita',
    description: 'Cita con la familia, recorrido por las instalaciones y alineación pedagógica.',
    color: '#7c3aed',
    orderIndex: 2,
    isInitial: false,
    isFinal: false,
    isTerminalRejected: false,
    requiredDocuments: [],
    formQuestions: [
      { id: 'family_expectations', label: 'Expectativas familiares sobre la educación Montessori', type: 'text' }
    ],
    hooksConfig: { calendarSync: true }
  },
  {
    slug: 'environment_observation',
    name: 'Observación en Ambiente',
    description: 'Sesión de adaptación y diagnóstico cualitativo con el Guía de salón.',
    color: '#db2777',
    orderIndex: 3,
    isInitial: false,
    isFinal: false,
    isTerminalRejected: false,
    requiredDocuments: ['Reporte o Carta de No Adeudo de Escuela Previa'],
    formQuestions: [
      { id: 'guide_observation_notes', label: 'Observaciones del Guía Titular', type: 'textarea' }
    ],
    hooksConfig: {}
  },
  {
    slug: 'agreements_signing',
    name: 'Firma de Acuerdos & Consentimientos',
    description: 'Formalización de reglamento, autorizaciones de salud y uso de imagen.',
    color: '#d97706',
    orderIndex: 4,
    isInitial: false,
    isFinal: false,
    isTerminalRejected: false,
    requiredDocuments: ['Reglamento Interno Firmado', 'Consentimientos Institucionales Aceptados'],
    formQuestions: [],
    hooksConfig: {}
  },
  {
    slug: 'process_completed',
    name: 'Proceso Finalizado',
    description: 'Aprobación final, asignación de salón oficial e ingreso a matrícula activa.',
    color: '#059669',
    orderIndex: 5,
    isInitial: false,
    isFinal: true,
    isTerminalRejected: false,
    requiredDocuments: ['Comprobante de Pago de Inscripción'],
    requiredForms: [],
    formQuestions: [],
    hooksConfig: { autoGenerateEnrollmentCode: true }
  }
];

const DEFAULT_ADMISSION_FORM_TEMPLATES = [
  {
    title: 'Ficha Médica, Hábitos y Desarrollo',
    description: 'Antecedentes clínicos del infante, esquema de vacunación, alergias, autonomía y rutina diaria.',
    category: 'MEDICAL',
    schema: [
      {
        id: 'sec_clinical',
        title: 'Paso 1: Datos Clínicos y Alergias',
        description: 'Información médica básica para el cuidado seguro del niño en el ambiente.',
        fields: [
          { id: 'blood_type', type: 'single_choice', label: 'Tipo y Grupo Sanguíneo', required: true, options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'No determinado'] },
          { id: 'has_allergies', type: 'single_choice', label: '¿Presenta alergias alimentarias, medicamentosas o ambientales?', required: true, options: ['Sí', 'No'] },
          { id: 'allergies_details', type: 'textarea', label: 'Especifique alergias y tratamiento de urgencia', placeholder: 'Detallar alimentos, medicamentos o agentes alérgicos...', required: false },
          { id: 'chronic_conditions', type: 'textarea', label: 'Condiciones médicas, diagnósticos previos o medicamentos continuos', placeholder: 'Indicar si toma alguna medicación regular...', required: false },
          { id: 'pediatrician_name', type: 'text', label: 'Nombre del Pediatra de cabecera', required: true },
          { id: 'pediatrician_phone', type: 'phone', label: 'Teléfono de contacto del Pediatra', required: true },
          { id: 'vaccination_card', type: 'file_upload', label: 'Cartilla de Vacunación (Foto o PDF)', required: false, fileConfig: { accept: '.pdf,.jpg,.jpeg,.png', multiple: true, maxSizeMb: 10 } }
        ]
      },
      {
        id: 'sec_development',
        title: 'Paso 2: Hitos del Desarrollo y Rutinas',
        description: 'Conocer el ritmo individual y nivel de autonomía del niño.',
        fields: [
          { id: 'walking_age', type: 'text', label: 'Edad en que comenzó a caminar solo/a', placeholder: 'Ej. 12 meses', required: false },
          { id: 'toilet_training', type: 'single_choice', label: 'Control de esfínteres / Uso de pañal', required: true, options: ['Usa pañal todo el día', 'Usa pañal solo en siesta/noche', 'Control de esfínteres completado', 'En proceso de aviso'] },
          { id: 'sleep_habits', type: 'textarea', label: 'Rutina de sueño y siestas', placeholder: 'Horarios habituales de dormir, si duerme siesta, apego a objetos...', required: false },
          { id: 'eating_habits', type: 'textarea', label: 'Hábitos y autonomía al comer', placeholder: 'Come solo, alimentos preferidos o rechazados, texturas...', required: false }
        ]
      },
      {
        id: 'sec_emergency',
        title: 'Paso 3: Contacto de Urgencia y Firma de Autorización',
        description: 'Autorización para atención médica inmediata y primeros auxilios.',
        fields: [
          { id: 'emergency_contact_name', type: 'text', label: 'Contacto de Emergencia alternativo (distinto a padres)', required: true },
          { id: 'emergency_contact_phone', type: 'phone', label: 'Teléfono del contacto de emergencia', required: true },
          { id: 'emergency_relationship', type: 'text', label: 'Parentesco', placeholder: 'Ej. Abuela, Tío...', required: true },
          { id: 'medical_authorization_agreement', type: 'boolean', label: 'Autorizo al equipo de Ceiba Montessori a brindar primeros auxilios y trasladar al infante a un centro asistencial en caso de emergencia médica grave.', required: true },
          { id: 'tutor_signature', type: 'signature', label: 'Firma Digital del Tutor / Responsable', required: true }
        ]
      }
    ]
  },
  {
    title: 'Cuestionario Familiar y Filosofía Montessori',
    description: 'Conexión hogar-escuela, expectativas familiares, intereses del niño y dinámicas cotidianas.',
    category: 'PEDAGOGICAL',
    schema: [
      {
        id: 'sec_family_life',
        title: 'Paso 1: Entorno y Dinámica Familiar',
        description: 'Cuéntanos sobre el hogar y la familia.',
        fields: [
          { id: 'household_members', type: 'textarea', label: '¿Quiénes integran el núcleo familiar y conviven en el hogar?', placeholder: 'Madre, Padre, hermanos (edades), mascotas...', required: true },
          { id: 'languages_spoken', type: 'text', label: 'Idiomas que se hablan habitualmente en casa', placeholder: 'Ej. Español, Inglés...', required: false },
          { id: 'previous_school_exp', type: 'textarea', label: 'Experiencias previas en guardería, nido o escuela', placeholder: '¿Ha asistido antes a otra institución? ¿Cómo fue la experiencia?', required: false }
        ]
      },
      {
        id: 'sec_montessori_affinity',
        title: 'Paso 2: Filosofía Montessori y Crianza',
        description: 'Alineación con los principios de respeto y autonomía.',
        fields: [
          { id: 'why_montessori', type: 'textarea', label: '¿Por qué desean una educación Montessori para su hijo/a?', placeholder: 'Compartan qué aspectos de la pedagogía les atraen...', required: true },
          { id: 'screen_time_habits', type: 'single_choice', label: 'Uso de pantallas y dispositivos en el hogar', required: true, options: ['Cero pantallas', 'Menos de 30 minutos al día', 'Entre 30 min y 1 hora al día', 'Más de 1 hora al día', 'Solo fines de semana'] },
          { id: 'frustration_handling', type: 'textarea', label: '¿Cómo gestionan los límites y momentos de frustración en casa?', placeholder: 'Estrategias utilizadas, diálogo, acuerdos...', required: false }
        ]
      },
      {
        id: 'sec_child_interests',
        title: 'Paso 3: Intereses y Singularidad del Niño',
        description: 'Lo que le apasiona y su forma de explorar el mundo.',
        fields: [
          { id: 'favorite_activities', type: 'textarea', label: '¿Qué actividades o juegos despiertan más su curiosidad y gozo?', placeholder: 'Música, naturaleza, libros, motricidad, construcción...', required: true },
          { id: 'parent_signature', type: 'signature', label: 'Firma de Conformidad Familiar', required: true }
        ]
      }
    ]
  },
  {
    title: 'Consentimientos Legales, Salidas y Uso de Imagen',
    description: 'Autorizaciones legales obligatorias para la participación activa y seguridad escolar.',
    category: 'LEGAL_CONSENT',
    schema: [
      {
        id: 'sec_photo_consent',
        title: 'Paso 1: Uso de Imagen y Registro Pedagógico',
        description: 'Tratamiento responsable de fotografías y videos escolares.',
        fields: [
          { id: 'internal_photo_consent', type: 'boolean', label: 'Autorizo la toma de fotografías y grabaciones exclusivamente para el seguimiento pedagógico y comunicación privada con las familias en la plataforma.', required: true },
          { id: 'public_social_consent', type: 'single_choice', label: 'Autorización para publicaciones institucionales en web y redes sociales de la escuela:', required: true, options: ['Sí, autorizo el uso de imagen institucional', 'No, prefiero que no aparezca en redes públicas'] }
        ]
      },
      {
        id: 'sec_trips_consent',
        title: 'Paso 2: Actividades al Aire Libre y Predio Natural',
        description: 'Talleres en el huerto, caminatas guiadas y exploración en la naturaleza.',
        fields: [
          { id: 'nature_activities_consent', type: 'boolean', label: 'Autorizo la participación en talleres de huerto, granja, bosque y caminatas pedagógicas guiadas por el equipo de guías dentro del entorno escolar.', required: true },
          { id: 'authorized_pickup_persons', type: 'textarea', label: 'Personas autorizadas para retirar al niño (Nombre, DNI/Cédula y Teléfono)', placeholder: '1. Nombre - DNI - Teléfono\n2. Nombre - DNI - Teléfono', required: true }
        ]
      },
      {
        id: 'sec_legal_sign',
        title: 'Paso 3: Declaración Jurada y Firma',
        description: 'Validez y compromiso de veracidad de la información.',
        fields: [
          { id: 'tutor_full_name', type: 'text', label: 'Nombre Completo del Tutor que suscribe', required: true },
          { id: 'tutor_national_id', type: 'text', label: 'Documento de Identidad (DNI / CURP / Cédula)', required: true },
          { id: 'declaration_agreement', type: 'boolean', label: 'Declaro bajo juramento que toda la información brindada es verídica y acepto los términos del reglamento escolar.', required: true },
          { id: 'legal_signature', type: 'signature', label: 'Firma Digital Legal', required: true }
        ]
      }
    ]
  },
  {
    title: 'Entrevista Pedagógica y Observación de Admisión',
    description: 'Instrumento interno de observación completado por la Guía / Equipo Pedagógico durante la visita.',
    category: 'INTERVIEW',
    schema: [
      {
        id: 'sec_guide_obs',
        title: 'Paso 1: Observación en el Ambiente Preparado',
        description: 'Registro de la visita del infante al ambiente Montessori.',
        fields: [
          { id: 'visit_date', type: 'date', label: 'Fecha de la Observación', required: true },
          { id: 'observer_guide_name', type: 'text', label: 'Nombre de la Guía Observadora', required: true },
          { id: 'material_engagement', type: 'textarea', label: 'Interacción con los materiales Montessori y periodo de concentración', placeholder: 'Materiales elegidos, repetición, cuidado del material...', required: true },
          { id: 'fine_gross_motor', type: 'textarea', label: 'Coordinación motriz (fina y gruesa)', placeholder: 'Movimiento, equilibrio, destreza manual...', required: false },
          { id: 'language_expression', type: 'textarea', label: 'Desarrollo del lenguaje y comunicación', placeholder: 'Vocabulario, claridad, comprensión de consignas...', required: false }
        ]
      },
      {
        id: 'sec_social_adaptation',
        title: 'Paso 2: Socialización y Vínculo',
        description: 'Respuesta ante el nuevo entorno y separación temporal de figuras de apego.',
        fields: [
          { id: 'attachment_behavior', type: 'single_choice', label: 'Nivel de seguridad en la separación de padres durante la visita:', required: true, options: ['Fluida y natural', 'Con ligera timidez inicial pero rápida adaptación', 'Requiere presencia constante del adulto', 'No lograda en esta sesión'] },
          { id: 'peer_interaction', type: 'textarea', label: 'Interacción con otros niños y adultos del ambiente', placeholder: 'Observaciones sobre empatía, respeto del espacio ajeno...', required: false }
        ]
      },
      {
        id: 'sec_verdict',
        title: 'Paso 3: Dictamen y Sugerencias de Adaptación',
        description: 'Conclusión pedagógica de admisión.',
        fields: [
          { id: 'suggested_environment', type: 'text', label: 'Ambiente / Salón Sugerido', placeholder: 'Ej. Comunidad Infantil, Casa de Niños, Taller 1...', required: true },
          { id: 'adaptation_recommendations', type: 'textarea', label: 'Recomendaciones pedagógicas para el periodo de adaptación', placeholder: 'Pautas específicas para el ingreso...', required: false },
          { id: 'admission_recommendation', type: 'single_choice', label: 'Dictamen de Admisión:', required: true, options: ['Favorable - Apto para ingreso', 'Favorable con plan de adaptación específico', 'Requiere segunda sesión de observación', 'No recomendado para esta etapa'] },
          { id: 'guide_signature', type: 'signature', label: 'Firma de la Guía Evaluadora', required: true }
        ]
      }
    ]
  }
];

async function ensureDefaultAdmissionFormTemplates(schoolId) {
  const count = await prisma.admissionFormTemplate.count({ where: { schoolId } });
  if (count === 0) {
    for (const tpl of DEFAULT_ADMISSION_FORM_TEMPLATES) {
      await prisma.admissionFormTemplate.create({
        data: {
          schoolId,
          ...tpl
        }
      });
    }
  }
}

// Helper to seed default admission stages if school has none
async function ensureDefaultAdmissionStages(schoolId) {
  await ensureDefaultAdmissionFormTemplates(schoolId);
  
  // Ensure default admissions process exists
  let process = await prisma.process.findFirst({
    where: { schoolId, slug: 'admissions' }
  });
  if (!process) {
    process = await prisma.process.create({
      data: {
        schoolId,
        name: 'Admisión',
        slug: 'admissions',
        label: 'Admisiones',
        icon: 'Layers',
        description: 'Proceso de admisión predeterminado',
        isActive: true
      }
    });
  }

  const count = await prisma.processStage.count({
    where: { schoolId, processId: process.id }
  });

  if (count === 0) {
    const templates = await prisma.processFormTemplate.findMany({ where: { schoolId } });
    const medicalTpl = templates.find(t => t.category === 'MEDICAL');
    const familyTpl = templates.find(t => t.category === 'PEDAGOGICAL');
    const legalTpl = templates.find(t => t.category === 'LEGAL_CONSENT');
    const obsTpl = templates.find(t => t.category === 'INTERVIEW');

    for (const stage of DEFAULT_ADMISSION_STAGES) {
      let stageRequiredForms = [];
      if (stage.slug === 'process_started' && medicalTpl) {
        stageRequiredForms.push({
          formTemplateId: medicalTpl.id,
          formTitle: medicalTpl.title,
          assignedRole: 'ANY_TUTOR',
          isMandatory: true
        });
      } else if (stage.slug === 'interview_scheduled') {
        if (familyTpl) {
          stageRequiredForms.push({
            formTemplateId: familyTpl.id,
            formTitle: familyTpl.title,
            assignedRole: 'ANY_TUTOR',
            isMandatory: true
          });
        }
        if (obsTpl) {
          stageRequiredForms.push({
            formTemplateId: obsTpl.id,
            formTitle: obsTpl.title,
            assignedRole: 'INTERNAL_STAFF',
            isMandatory: true
          });
        }
      } else if (stage.slug === 'formalization_enrollment' && legalTpl) {
        stageRequiredForms.push({
          formTemplateId: legalTpl.id,
          formTitle: legalTpl.title,
          assignedRole: 'PRIMARY_TUTOR',
          isMandatory: true
        });
      }

      await prisma.processStage.create({
        data: {
          schoolId,
          processId: process.id,
          ...stage,
          requiredForms: stageRequiredForms
        }
      });
    }
  } else {
    // Ensure initial and final stages have the canonical names and slugs
    const initialStage = await prisma.processStage.findFirst({
      where: { schoolId, processId: process.id, isInitial: true }
    });
    if (initialStage && (initialStage.name !== 'Proceso Iniciado' || initialStage.slug !== 'process_started')) {
      await prisma.processStage.update({
        where: { id: initialStage.id },
        data: { name: 'Proceso Iniciado', slug: 'process_started' }
      });
    }

    const finalStage = await prisma.processStage.findFirst({
      where: { schoolId, processId: process.id, isFinal: true }
    });
    if (finalStage && (finalStage.name !== 'Proceso Finalizado' || finalStage.slug !== 'process_completed')) {
      await prisma.processStage.update({
        where: { id: finalStage.id },
        data: { name: 'Proceso Finalizado', slug: 'process_completed' }
      });
    }
  }
}

// ==========================================
// DYNAMIC PROCESSES API (CRUD)
// ==========================================

// GET /api/processes - List all active/inactive processes for a school
app.get('/api/processes', async (req, res) => {
  try {
    const processes = await prisma.process.findMany({
      where: { schoolId: req.school.id },
      orderBy: { createdAt: 'asc' }
    });
    res.json(processes);
  } catch (e) {
    console.error('Error fetching processes:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/processes - Create a new dynamic process
app.post('/api/processes', async (req, res) => {
  try {
    const { name, slug, label, icon, description, isActive, originSource, targetType, resolutionAction } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del proceso es obligatorio.' });
    }
    if (!slug || !slug.trim()) {
      return res.status(400).json({ error: 'El identificador (slug) es obligatorio.' });
    }
    const cleanSlug = slug.trim().toLowerCase();

    // Check if slug is unique for school
    const existing = await prisma.process.findFirst({
      where: { schoolId: req.school.id, slug: cleanSlug }
    });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un proceso con este identificador (slug).' });
    }

    const process = await prisma.process.create({
      data: {
        schoolId: req.school.id,
        name: name.trim(),
        slug: cleanSlug,
        label: (label || name).trim(),
        icon: icon || 'Layers',
        description: description || '',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        originSource: originSource || 'WAITLIST',
        targetType: targetType || 'STUDENT',
        resolutionAction: resolutionAction || 'NONE'
      }
    });

    // Create default initial and final stages for the new process automatically
    await prisma.processStage.create({
      data: {
        schoolId: req.school.id,
        processId: process.id,
        slug: 'process_started',
        name: 'Proceso Iniciado',
        color: '#2563eb',
        orderIndex: 0,
        isInitial: true,
        isFinal: false,
        requiredDocuments: [],
        requiredForms: []
      }
    });

    await prisma.processStage.create({
      data: {
        schoolId: req.school.id,
        processId: process.id,
        slug: 'process_completed',
        name: 'Proceso Finalizado',
        color: '#059669',
        orderIndex: 1,
        isInitial: false,
        isFinal: true,
        requiredDocuments: [],
        requiredForms: []
      }
    });

    res.status(201).json(process);
  } catch (e) {
    console.error('Error creating process:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/processes/:id - Update process metadata
app.put('/api/processes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, label, icon, description, isActive, originSource, targetType, resolutionAction } = req.body;

    const existing = await prisma.process.findFirst({
      where: { id, schoolId: req.school.id }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Proceso no encontrado.' });
    }

    if (existing.slug === 'admissions' && isActive === false) {
      return res.status(400).json({ error: 'No se puede desactivar el proceso de admisión predeterminado.' });
    }

    const updated = await prisma.process.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        label: label !== undefined ? label.trim() : undefined,
        icon: icon !== undefined ? icon : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        originSource: originSource !== undefined ? originSource : undefined,
        targetType: targetType !== undefined ? targetType : undefined,
        resolutionAction: resolutionAction !== undefined ? resolutionAction : undefined
      }
    });

    res.json(updated);
  } catch (e) {
    console.error('Error updating process:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/processes/:id - Delete a process (prevent deleting default admissions)
app.delete('/api/processes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.process.findFirst({
      where: { id, schoolId: req.school.id }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Proceso no encontrado.' });
    }

    if (existing.slug === 'admissions') {
      return res.status(400).json({ error: 'El proceso de admisión predeterminado es requerido por el sistema y no puede eliminarse.' });
    }

    await prisma.process.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Proceso eliminado exitosamente.' });
  } catch (e) {
    console.error('Error deleting process:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/processes/:processId/start-application - Starts a process application dynamically from Waitlist, Student, or Staff
app.post('/api/processes/:processId/start-application', async (req, res) => {
  try {
    const { processId } = req.params;
    const { waitlistEntryId, studentId, membershipId, targetEnvironmentId, internalNotes } = req.body;

    // Find the process
    const process = await prisma.process.findFirst({
      where: { id: processId, schoolId: req.school.id }
    });
    if (!process) {
      return res.status(404).json({ error: 'Proceso no encontrado.' });
    }

    // Find the initial stage for this process
    const initialStage = await prisma.processStage.findFirst({
      where: { schoolId: req.school.id, processId: process.id, isInitial: true }
    }) || await prisma.processStage.findFirst({
      where: { schoolId: req.school.id, processId: process.id },
      orderBy: { orderIndex: 'asc' }
    });

    if (!initialStage) {
      return res.status(500).json({ error: 'Este proceso no tiene ninguna fase configurada.' });
    }

    let applicationData = {
      schoolId: req.school.id,
      processId: process.id,
      stageId: initialStage.id,
      status: 'IN_PROGRESS',
      history: [
        {
          fromStageId: null,
          toStageId: initialStage.id,
          toStageName: initialStage.name,
          timestamp: new Date().toISOString(),
          actor: req.user?.fullName || 'Directora / Admin',
          notes: `Proceso "${process.name}" iniciado.`
        }
      ]
    };

    if (waitlistEntryId) {
      const entry = await prisma.waitlistEntry.findUnique({
        where: { id: waitlistEntryId }
      });
      if (!entry) {
        return res.status(404).json({ error: 'Aspirante en lista de espera no encontrado.' });
      }

      const selectedEnvId = targetEnvironmentId || (entry.targetEnvironmentIds && entry.targetEnvironmentIds[0]) || null;

      const application = await prisma.admissionApplication.create({
        data: {
          ...applicationData,
          childName: entry.childName,
          childFirstName: entry.childName.split(' ')[0] || '',
          childLastName: entry.childName.split(' ').slice(1).join(' ') || '',
          birthDate: entry.birthDate,
          gender: entry.gender || 'NOT_SPECIFIED',
          targetEnvironmentId: selectedEnvId,
          targetEnvironmentIds: entry.targetEnvironmentIds || [],
          preferredStartDate: entry.preferredStartDate,
          previousSchool: entry.previousSchool || '',
          previousMethodology: entry.previousMethodology || '',
          tutorName: entry.parentName,
          tutorEmail: (entry.parentEmail || '').trim().toLowerCase(),
          tutorPhone: entry.parentPhone || '',
          tutorRelationship: entry.relationship || 'MOTHER',
          internalNotes: internalNotes || entry.notes || 'Iniciado desde Lista de Espera.',
          enrolledStudentId: entry.enrolledStudentId || null
        },
        include: {
          stage: true,
          targetEnvironment: true
        }
      });

      // Update WaitlistEntry setting status and link
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          status: 'IN_ADMISSION',
          processApplicationId: application.id
        }
      });

      return res.status(201).json(application);

    } else if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { tutors: { include: { tutor: true } } }
      });
      if (!student) {
        return res.status(404).json({ error: 'Estudiante no encontrado.' });
      }

      const primaryTutor = student.tutors.find(t => t.relationship === 'MOTHER' || t.relationship === 'FATHER') || student.tutors[0];
      const tutorName = primaryTutor?.tutor?.fullName || 'Tutor';
      const tutorEmail = primaryTutor?.tutor?.email || '';
      const tutorPhone = primaryTutor?.tutor?.phone || '';
      const tutorRelationship = primaryTutor?.relationship || 'MOTHER';

      const application = await prisma.admissionApplication.create({
        data: {
          ...applicationData,
          childName: student.fullName,
          childFirstName: student.fullName.split(' ')[0] || '',
          childLastName: student.fullName.split(' ').slice(1).join(' ') || '',
          birthDate: student.dateOfBirth,
          gender: student.gender || 'NOT_SPECIFIED',
          targetEnvironmentId: student.environmentId,
          previousSchool: student.previousSchool || '',
          previousMethodology: student.previousMethodology || '',
          tutorName,
          tutorEmail: tutorEmail.trim().toLowerCase(),
          tutorPhone,
          tutorRelationship: tutorRelationship,
          internalNotes: internalNotes || 'Iniciado desde Estudiantes Matriculados.',
          enrolledStudentId: student.id
        },
        include: {
          stage: true,
          targetEnvironment: true
        }
      });

      return res.status(201).json(application);

    } else if (membershipId) {
      const membership = await prisma.schoolMembership.findUnique({
        where: { id: membershipId },
        include: { user: true }
      });
      if (!membership) {
        return res.status(404).json({ error: 'Docente/Miembro del personal no encontrado.' });
      }

      const application = await prisma.admissionApplication.create({
        data: {
          ...applicationData,
          childName: membership.user.fullName,
          childFirstName: membership.user.fullName.split(' ')[0] || '',
          childLastName: membership.user.fullName.split(' ').slice(1).join(' ') || '',
          tutorName: membership.user.fullName,
          tutorEmail: (membership.user.email || '').trim().toLowerCase(),
          tutorPhone: membership.user.phone || '',
          internalNotes: internalNotes || 'Iniciado desde Equipo Docente.',
          membershipId: membership.id
        },
        include: {
          stage: true
        }
      });

      return res.status(201).json(application);

    } else {
      const { childName, tutorName, tutorEmail, tutorPhone } = req.body;
      if (!childName || !childName.trim()) {
        return res.status(400).json({ error: 'El nombre del aspirante/sujeto es obligatorio.' });
      }

      const application = await prisma.admissionApplication.create({
        data: {
          ...applicationData,
          childName: childName.trim(),
          childFirstName: childName.trim().split(' ')[0] || '',
          childLastName: childName.trim().split(' ').slice(1).join(' ') || '',
          tutorName: (tutorName || '').trim(),
          tutorEmail: (tutorEmail || '').trim().toLowerCase(),
          tutorPhone: (tutorPhone || '').trim(),
          internalNotes: internalNotes || 'Creación directa.'
        },
        include: {
          stage: true
        }
      });

      return res.status(201).json(application);
    }
  } catch (e) {
    console.error('Error starting process application:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admissions/stages
app.get('/api/admissions/stages', async (req, res) => {
  try {
    await ensureDefaultAdmissionStages(req.school.id);

    // Resolve process
    let processId = req.query.processId;
    if (!processId) {
      const defaultProcess = await prisma.process.findUnique({
        where: { schoolId_slug: { schoolId: req.school.id, slug: 'admissions' } }
      });
      processId = defaultProcess?.id;
    }

    if (!processId) {
      return res.status(404).json({ error: 'Proceso no encontrado.' });
    }

    const stages = await prisma.admissionStage.findMany({
      where: { schoolId: req.school.id, processId },
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });
    res.json(stages);
  } catch (e) {
    console.error('Error fetching stages:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/stages
app.post('/api/admissions/stages', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      color,
      isInitial,
      isFinal,
      isTerminalRejected,
      requiredDocuments,
      requiredForms,
      formQuestions,
      hooksConfig,
      processId: bodyProcessId
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la etapa es obligatorio' });
    }

    // Resolve process
    let processId = bodyProcessId;
    if (!processId) {
      const defaultProcess = await prisma.process.findUnique({
        where: { schoolId_slug: { schoolId: req.school.id, slug: 'admissions' } }
      });
      processId = defaultProcess?.id;
    }

    if (!processId) {
      return res.status(404).json({ error: 'Proceso no encontrado.' });
    }

    const computedSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')).trim();

    // Keep final stage at the end: if final stage exists, insert right before it
    const finalStage = await prisma.processStage.findFirst({
      where: { schoolId: req.school.id, processId, isFinal: true }
    });

    let newOrderIndex = 0;
    if (finalStage && !isFinal) {
      newOrderIndex = finalStage.orderIndex;
      // Increment final stage order index
      await prisma.processStage.update({
        where: { id: finalStage.id },
        data: { orderIndex: finalStage.orderIndex + 1 }
      });
    } else {
      const lastStage = await prisma.processStage.findFirst({
        where: { schoolId: req.school.id, processId },
        orderBy: { orderIndex: 'desc' }
      });
      newOrderIndex = lastStage ? lastStage.orderIndex + 1 : 0;
    }

    const newStage = await prisma.admissionStage.create({
      data: {
        schoolId: req.school.id,
        processId,
        slug: computedSlug,
        name: name.trim(),
        description: (description || '').trim(),
        color: color || '#1b3b2b',
        orderIndex: newOrderIndex,
        isInitial: !!isInitial,
        isFinal: !!isFinal,
        isTerminalRejected: !!isTerminalRejected,
        requiredDocuments: requiredDocuments || [],
        requiredForms: requiredForms || [],
        formQuestions: formQuestions || [],
        hooksConfig: hooksConfig || {}
      }
    });

    res.status(201).json(newStage);
  } catch (e) {
    console.error('Error creating admission stage:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/admissions/stages/:id
app.put('/api/admissions/stages/:id', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      color,
      orderIndex,
      isInitial,
      isFinal,
      isTerminalRejected,
      requiredDocuments,
      requiredForms,
      formQuestions,
      hooksConfig
    } = req.body;

    const existingStage = await prisma.admissionStage.findUnique({
      where: { id: req.params.id }
    });

    if (!existingStage) {
      return res.status(404).json({ error: 'Etapa no encontrada' });
    }

    // Protect canonical names and slugs for initial and final stages
    let finalName = name !== undefined ? name.trim() : existingStage.name;
    let finalSlug = slug !== undefined ? slug.trim() : existingStage.slug;

    if (existingStage.isInitial) {
      finalName = 'Proceso Iniciado';
      finalSlug = 'process_started';
    } else if (existingStage.isFinal) {
      finalName = 'Proceso Finalizado';
      finalSlug = 'process_completed';
    }

    const stage = await prisma.admissionStage.update({
      where: { id: req.params.id },
      data: {
        name: finalName,
        slug: finalSlug,
        ...(description !== undefined && { description: (description || '').trim() }),
        ...(color !== undefined && { color }),
        ...(orderIndex !== undefined && { orderIndex: Number(orderIndex) }),
        ...(isInitial !== undefined && { isInitial: !!isInitial }),
        ...(isFinal !== undefined && { isFinal: !!isFinal }),
        ...(isTerminalRejected !== undefined && { isTerminalRejected: !!isTerminalRejected }),
        ...(requiredDocuments !== undefined && { requiredDocuments }),
        ...(requiredForms !== undefined && { requiredForms }),
        ...(formQuestions !== undefined && { formQuestions }),
        ...(hooksConfig !== undefined && { hooksConfig })
      }
    });

    res.json(stage);
  } catch (e) {
    console.error('Error updating admission stage:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admissions/stages/:id
app.delete('/api/admissions/stages/:id', async (req, res) => {
  try {
    const stageId = req.params.id;
    const stage = await prisma.admissionStage.findUnique({
      where: { id: stageId }
    });

    if (!stage) {
      return res.status(404).json({ error: 'Etapa no encontrada' });
    }

    if (stage.isInitial || stage.isFinal) {
      return res.status(400).json({ error: 'Las etapas inicial y final son fijas y no pueden ser eliminadas' });
    }

    const appsCount = await prisma.admissionApplication.count({ where: { stageId } });

    if (appsCount > 0) {
      // Reassign to initial stage or first available stage
      const fallbackStage = await prisma.admissionStage.findFirst({
        where: {
          schoolId: req.school.id,
          id: { not: stageId }
        },
        orderBy: { orderIndex: 'asc' }
      });

      if (fallbackStage) {
        await prisma.admissionApplication.updateMany({
          where: { stageId },
          data: { stageId: fallbackStage.id }
        });
      }
    }

    await prisma.admissionStage.delete({
      where: { id: stageId }
    });

    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting admission stage:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/stages/reorder
app.post('/api/admissions/stages/reorder', async (req, res) => {
  try {
    const { stageOrders } = req.body; // Array of { id, orderIndex }
    if (!Array.isArray(stageOrders)) {
      return res.status(400).json({ error: 'stageOrders debe ser un arreglo' });
    }

    await prisma.$transaction(
      stageOrders.map((item) =>
        prisma.admissionStage.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        })
      )
    );

    res.json({ success: true });
  } catch (e) {
    console.error('Error reordering admission stages:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admissions/applications
app.get('/api/admissions/applications', async (req, res) => {
  try {
    await ensureDefaultAdmissionStages(req.school.id);
    const { stageId, status, environmentId, search, processId: queryProcessId } = req.query;

    // Resolve process
    let processId = queryProcessId;
    if (!processId) {
      const defaultProcess = await prisma.process.findUnique({
        where: { schoolId_slug: { schoolId: req.school.id, slug: 'admissions' } }
      });
      processId = defaultProcess?.id;
    }

    if (!processId) {
      return res.status(404).json({ error: 'Proceso no encontrado.' });
    }

    const where = {
      schoolId: req.school.id,
      processId,
      ...(stageId && stageId !== 'ALL' && { stageId: String(stageId) }),
      ...(status && status !== 'ALL' && { status: String(status) }),
      ...(environmentId && environmentId !== 'ALL' && {
        OR: [
          { targetEnvironmentId: String(environmentId) },
          { targetEnvironmentIds: { has: String(environmentId) } }
        ]
      })
    };

    let applications = await prisma.admissionApplication.findMany({
      where,
      include: {
        stage: true,
        targetEnvironment: true,
        enrolledStudent: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      applications = applications.filter(a => 
        (a.childName || '').toLowerCase().includes(q) ||
        (a.tutorName || '').toLowerCase().includes(q) ||
        (a.tutorEmail || '').toLowerCase().includes(q) ||
        (a.tutorPhone || '').toLowerCase().includes(q) ||
        (a.previousSchool || '').toLowerCase().includes(q) ||
        (a.previousMethodology || '').toLowerCase().includes(q)
      );
    }

    res.json(applications);
  } catch (e) {
    console.error('Error fetching admission applications:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admissions/applications/:id
app.get('/api/admissions/applications/:id', async (req, res) => {
  try {
    const application = await prisma.admissionApplication.findUnique({
      where: { id: req.params.id },
      include: {
        stage: true,
        targetEnvironment: true,
        enrolledStudent: true
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Expediente de admisión no encontrado' });
    }

    res.json(application);
  } catch (e) {
    console.error('Error fetching admission application:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/applications
app.post('/api/admissions/applications', async (req, res) => {
  try {
    await ensureDefaultAdmissionStages(req.school.id);

    // Get default admissions process
    const process = await prisma.process.findUnique({
      where: { schoolId_slug: { schoolId: req.school.id, slug: 'admissions' } }
    });

    if (!process) {
      return res.status(500).json({ error: 'No se encontró el proceso de admisión' });
    }

    const {
      stageId,
      childFirstName,
      childLastName,
      childName,
      birthDate,
      gender,
      targetEnvironmentId,
      targetEnvironmentIds,
      preferredStartDate,
      previousSchool,
      previousMethodology,
      tutorName,
      tutorEmail,
      tutorPhone,
      tutorRelationship,
      secondaryTutorName,
      secondaryTutorPhone,
      address,
      internalNotes,
      submittedDocuments,
      customFormResponses
    } = req.body;

    const computedChildName = (childName || `${childFirstName || ''} ${childLastName || ''}`).trim();
    if (!computedChildName) {
      return res.status(400).json({ error: 'El nombre del aspirante es obligatorio' });
    }

    if (!tutorName || !tutorName.trim()) {
      return res.status(400).json({ error: 'El nombre del tutor principal es obligatorio' });
    }

    let assignedStageId = stageId;
    if (!assignedStageId) {
      const initialStage = await prisma.processStage.findFirst({
        where: { schoolId: req.school.id, processId: process.id, isInitial: true }
      }) || await prisma.processStage.findFirst({
        where: { schoolId: req.school.id, processId: process.id },
        orderBy: { orderIndex: 'asc' }
      });
      assignedStageId = initialStage ? initialStage.id : null;
    }

    if (!assignedStageId) {
      return res.status(400).json({ error: 'No se encontró una etapa inicial para el proceso de admisión' });
    }

    const stage = await prisma.processStage.findUnique({ where: { id: assignedStageId } });

    const initialHistory = [
      {
        stageId: assignedStageId,
        stageName: stage?.name || 'Inicio',
        timestamp: new Date().toISOString(),
        actor: req.user?.fullName || req.user?.email || 'Administración',
        notes: 'Expediente de admisión creado e ingresado al pipeline.'
      }
    ];

    const application = await prisma.admissionApplication.create({
      data: {
        schoolId: req.school.id,
        processId: process.id,
        stageId: assignedStageId,
        childFirstName: (childFirstName || '').trim(),
        childLastName: (childLastName || '').trim(),
        childName: computedChildName,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || 'NOT_SPECIFIED',
        targetEnvironmentId: targetEnvironmentId || null,
        targetEnvironmentIds: Array.isArray(targetEnvironmentIds) ? targetEnvironmentIds : (targetEnvironmentId ? [targetEnvironmentId] : []),
        preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
        previousSchool: (previousSchool || '').trim(),
        previousMethodology: (previousMethodology || '').trim(),
        tutorName: tutorName.trim(),
        tutorEmail: (tutorEmail || '').trim().toLowerCase(),
        tutorPhone: (tutorPhone || '').trim(),
        tutorRelationship: tutorRelationship || 'MOTHER',
        secondaryTutorName: (secondaryTutorName || '').trim(),
        secondaryTutorPhone: (secondaryTutorPhone || '').trim(),
        address: (address || '').trim(),
        status: 'IN_PROGRESS',
        internalNotes: (internalNotes || '').trim(),
        submittedDocuments: submittedDocuments || [],
        customFormResponses: customFormResponses || {},
        history: initialHistory
      },
      include: {
        stage: true,
        targetEnvironment: true
      }
    });

    // Trigger stage entry email notification (queued or direct)
    if (application.tutorEmail) {
      try {
        await sendStageNotificationJob({
          applicationId: application.id,
          fromStageId: null,
          toStageId: assignedStageId,
          transitionType: 'ENTER'
        }, prisma);
      } catch (notifyErr) {
        console.error('[ADMISSION NOTIFICATION ERROR] Error triggering initial stage notification:', notifyErr);
      }
    }

    res.status(201).json(application);
  } catch (e) {
    console.error('Error creating admission application:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/admissions/applications/:id
app.put('/api/admissions/applications/:id', async (req, res) => {
  try {
    const {
      childFirstName,
      childLastName,
      childName,
      birthDate,
      gender,
      targetEnvironmentId,
      targetEnvironmentIds,
      preferredStartDate,
      previousSchool,
      previousMethodology,
      tutorName,
      tutorEmail,
      tutorPhone,
      tutorRelationship,
      secondaryTutorName,
      secondaryTutorPhone,
      address,
      status,
      internalNotes,
      submittedDocuments,
      customFormResponses
    } = req.body;

    const data = {};
    if (childFirstName !== undefined) data.childFirstName = childFirstName.trim();
    if (childLastName !== undefined) data.childLastName = childLastName.trim();
    if (childName !== undefined) data.childName = childName.trim();
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
    if (gender !== undefined) data.gender = gender;
    if (targetEnvironmentId !== undefined) data.targetEnvironmentId = targetEnvironmentId || null;
    if (targetEnvironmentIds !== undefined) data.targetEnvironmentIds = targetEnvironmentIds;
    if (preferredStartDate !== undefined) data.preferredStartDate = preferredStartDate ? new Date(preferredStartDate) : null;
    if (previousSchool !== undefined) data.previousSchool = previousSchool.trim();
    if (previousMethodology !== undefined) data.previousMethodology = previousMethodology.trim();
    if (tutorName !== undefined) data.tutorName = tutorName.trim();
    if (tutorEmail !== undefined) data.tutorEmail = tutorEmail.trim().toLowerCase();
    if (tutorPhone !== undefined) data.tutorPhone = tutorPhone.trim();
    if (tutorRelationship !== undefined) data.tutorRelationship = tutorRelationship;
    if (secondaryTutorName !== undefined) data.secondaryTutorName = secondaryTutorName.trim();
    if (secondaryTutorPhone !== undefined) data.secondaryTutorPhone = secondaryTutorPhone.trim();
    if (address !== undefined) data.address = address.trim();
    if (status !== undefined) data.status = status;
    if (internalNotes !== undefined) data.internalNotes = internalNotes.trim();
    if (submittedDocuments !== undefined) data.submittedDocuments = submittedDocuments;
    if (customFormResponses !== undefined) data.customFormResponses = customFormResponses;

    const updated = await prisma.admissionApplication.update({
      where: { id: req.params.id },
      data,
      include: {
        stage: true,
        targetEnvironment: true,
        enrolledStudent: true
      }
    });

    res.json(updated);
  } catch (e) {
    console.error('Error updating admission application:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/applications/:id/move-stage
app.post('/api/admissions/applications/:id/move-stage', async (req, res) => {
  try {
    const { targetStageId, transitionNotes } = req.body;
    if (!targetStageId) {
      return res.status(400).json({ error: 'La etapa de destino es obligatoria' });
    }

    const application = await prisma.admissionApplication.findUnique({
      where: { id: req.params.id },
      include: { stage: true, process: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const targetStage = await prisma.admissionStage.findUnique({
      where: { id: targetStageId }
    });

    if (!targetStage) {
      return res.status(404).json({ error: 'Etapa de destino no encontrada' });
    }

    // ================= STAGE GATING RULE =================
    // Advancing to a higher stage requires all mandatory forms in the current stage to be completed.
    // Moving backwards or to a rejection stage is always allowed without blocking.
    const isAdvancing = targetStage.orderIndex > (application.stage?.orderIndex || 0);
    if (isAdvancing && !targetStage.isTerminalRejected) {
      const stageRequiredForms = Array.isArray(application.stage?.requiredForms) 
        ? application.stage.requiredForms 
        : [];
      
      const mandatoryForms = stageRequiredForms.filter(f => f.isMandatory !== false);
      const submissions = Array.isArray(application.formSubmissions) ? application.formSubmissions : [];

      const missingForms = mandatoryForms.filter(rf => {
        const hasCompletedSubmission = submissions.some(sub => 
          sub.formTemplateId === rf.formTemplateId && 
          (sub.status === 'SUBMITTED' || sub.status === 'APPROVED' || sub.status === 'COMPLETED')
        );
        return !hasCompletedSubmission;
      });

      if (missingForms.length > 0) {
        const missingNames = missingForms.map(m => `"${m.formTitle || 'Formulario requerido'}"`).join(', ');
        return res.status(400).json({
          error: `No es posible avanzar a la siguiente fase. Es obligatorio completar: ${missingNames}`,
          code: 'MANDATORY_FORMS_PENDING',
          missingForms
        });
      }
    }

    const currentHistory = Array.isArray(application.history) ? application.history : [];
    const newHistoryEntry = {
      fromStageId: application.stageId,
      fromStageName: application.stage?.name || 'Etapa anterior',
      toStageId: targetStage.id,
      toStageName: targetStage.name,
      timestamp: new Date().toISOString(),
      actor: req.user?.fullName || req.user?.email || 'Administración',
      notes: (transitionNotes || `Transición de etapa a: ${targetStage.name}`).trim()
    };

    let newStatus = application.status;
    if (targetStage.isTerminalRejected) {
      newStatus = 'REJECTED';
    } else if (targetStage.isFinal) {
      newStatus = 'ENROLLED';
    } else if (application.status === 'REJECTED' || application.status === 'WITHDRAWN') {
      newStatus = 'IN_PROGRESS';
    }

    const updated = await prisma.admissionApplication.update({
      where: { id: application.id },
      data: {
        stageId: targetStage.id,
        status: newStatus,
        history: [...currentHistory, newHistoryEntry]
      },
      include: {
        stage: true,
        targetEnvironment: true,
        enrolledStudent: true
      }
    });

    // Execute automated resolution actions if transitioning to a final stage
    if (targetStage.isFinal && application.process) {
      const action = application.process.resolutionAction || 'NONE';
      const studentId = application.enrolledStudentId;

      if (studentId) {
        if (action === 'GRADUATE_STUDENT') {
          // Change student status to graduated and set environmentId to null to free up salon space
          await prisma.student.update({
            where: { id: studentId },
            data: {
              status: 'graduated',
              environmentId: null
            }
          });
        } else if (action === 'UPDATE_ENVIRONMENT' && application.targetEnvironmentId) {
          // Move student to the new target environment
          await prisma.student.update({
            where: { id: studentId },
            data: {
              environmentId: application.targetEnvironmentId
            }
          });
        }
      }
    } else if (application.stage?.isFinal && !targetStage.isFinal && application.process) {
      // Revert resolution action if moved back out of final stage
      const action = application.process.resolutionAction || 'NONE';
      const studentId = application.enrolledStudentId;

      if (studentId) {
        if (action === 'GRADUATE_STUDENT') {
          // Revert student status back to active
          await prisma.student.update({
            where: { id: studentId },
            data: {
              status: 'active'
            }
          });
        }
      }
    }

    // Trigger stage transition notification emails (exit previous stage + enter new stage)
    try {
      await sendStageNotificationJob({
        applicationId: updated.id,
        fromStageId: application.stageId,
        toStageId: targetStage.id,
        transitionType: 'BOTH'
      }, prisma);
    } catch (notifyErr) {
      console.error('[ADMISSION NOTIFICATION ERROR] Error triggering stage transition notifications:', notifyErr);
    }

    res.json({
      success: true,
      application: updated,
      hooksTriggered: {
        notifyTutor: !!targetStage.hooksConfig?.notifyTutorOnEnter,
        stageName: targetStage.name
      }
    });
  } catch (e) {
    console.error('Error moving admission stage:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/applications/:id/enroll (Converts admission candidate into official active student)
app.post('/api/admissions/applications/:id/enroll', async (req, res) => {
  try {
    const application = await prisma.admissionApplication.findUnique({
      where: { id: req.params.id },
      include: { stage: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Expediente de admisión no encontrado' });
    }

    const {
      environmentId,
      enrollmentCode,
      enrollmentDate,
      grade,
      bloodType,
      allergies,
      foodAllergies,
      medicalNotes,
      internalNotes
    } = req.body;

    const assignedEnvId = environmentId || application.targetEnvironmentId;
    if (!assignedEnvId) {
      return res.status(400).json({ error: 'Debes asignar un salón/ambiente de destino' });
    }

    // 1. Create Student
    const student = await prisma.student.create({
      data: {
        schoolId: req.school.id,
        environmentId: assignedEnvId,
        fullName: application.childName,
        gender: application.gender || '',
        dateOfBirth: application.birthDate || null,
        grade: grade || '',
        enrollmentCode: enrollmentCode || `CEIBA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
        previousSchool: application.previousSchool || '',
        previousMethodology: application.previousMethodology || '',
        bloodType: bloodType || '',
        allergies: allergies || '',
        foodAllergies: foodAllergies || '[]',
        medicalNotes: medicalNotes || '',
        internalNotes: internalNotes || application.internalNotes || '',
        status: 'ACTIVE'
      }
    });

    // 2. Link or create Tutor User
    if (application.tutorEmail) {
      const cleanEmail = application.tutorEmail.trim().toLowerCase();
      let tutorUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!tutorUser) {
        tutorUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            fullName: application.tutorName || 'Tutor',
            phone: application.tutorPhone || '',
            role: 'TUTOR',
            passwordHash: 'pending_setup'
          }
        });
      }

      const existingMembership = await prisma.schoolMembership.findUnique({
        where: {
          userId_schoolId: {
            userId: tutorUser.id,
            schoolId: req.school.id
          }
        }
      });

      if (!existingMembership) {
        await prisma.schoolMembership.create({
          data: {
            userId: tutorUser.id,
            schoolId: req.school.id,
            role: 'TUTOR'
          }
        });
      }

      await prisma.studentTutor.create({
        data: {
          studentId: student.id,
          tutorUserId: tutorUser.id,
          relationship: application.tutorRelationship || 'MOTHER',
          isPrimaryContact: true,
          authorizedPickUp: true
        }
      });
    }

    // 3. Find Final Stage
    const finalStage = await prisma.admissionStage.findFirst({
      where: { schoolId: req.school.id, isFinal: true }
    });

    const currentHistory = Array.isArray(application.history) ? application.history : [];
    const enrollHistoryEntry = {
      fromStageId: application.stageId,
      toStageId: finalStage?.id || application.stageId,
      toStageName: finalStage?.name || 'Matrícula Oficial',
      timestamp: new Date().toISOString(),
      actor: req.user?.fullName || req.user?.email || 'Administración',
      notes: `¡Aspirante formalizado como alumno activo! Matrícula: ${student.enrollmentCode}`
    };

    // 4. Update AdmissionApplication
    const updatedApp = await prisma.admissionApplication.update({
      where: { id: application.id },
      data: {
        status: 'ENROLLED',
        enrolledStudentId: student.id,
        ...(finalStage && { stageId: finalStage.id }),
        history: [...currentHistory, enrollHistoryEntry]
      },
      include: {
        stage: true,
        targetEnvironment: true,
        enrolledStudent: true
      }
    });

    res.json({
      success: true,
      student,
      application: updatedApp
    });
  } catch (e) {
    console.error('Error enrolling admission application:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admissions/applications/:id
app.delete('/api/admissions/applications/:id', async (req, res) => {
  try {
    const targetApp = await prisma.admissionApplication.findUnique({
      where: { id: req.params.id }
    });

    if (targetApp) {
      // Physically delete all admission documents & form folders from storage
      await deleteAdmissionFolder({ schoolId: targetApp.schoolId, applicationId: targetApp.id });
    }

    await prisma.admissionApplication.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting admission application:', e);
    res.status(500).json({ error: e.message });
  }
});

// ================= ADMISSION FORM TEMPLATES APIS =================

// GET /api/admissions/forms
app.get('/api/admissions/forms', async (req, res) => {
  try {
    await ensureDefaultAdmissionFormTemplates(req.school.id);
    const forms = await prisma.admissionFormTemplate.findMany({
      where: { schoolId: req.school.id },
      orderBy: { createdAt: 'asc' }
    });
    res.json(forms);
  } catch (e) {
    console.error('Error fetching admission forms:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admissions/forms/:id
app.get('/api/admissions/forms/:id', async (req, res) => {
  try {
    const form = await prisma.admissionFormTemplate.findUnique({
      where: { id: req.params.id }
    });
    if (!form) return res.status(404).json({ error: 'Formulario no encontrado' });
    res.json(form);
  } catch (e) {
    console.error('Error fetching admission form:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admissions/forms/:id/responses
app.get('/api/admissions/forms/:id/responses', async (req, res) => {
  try {
    const form = await prisma.admissionFormTemplate.findUnique({
      where: { id: req.params.id }
    });
    if (!form) return res.status(404).json({ error: 'Formulario no encontrado' });

    // 1. Direct submissions stored on the form template
    let directSubmissions = [];
    if (form.schema && typeof form.schema === 'object' && Array.isArray(form.schema._submissions)) {
      directSubmissions = form.schema._submissions;
    }

    // 2. Submissions linked from admission applications
    const applications = await prisma.admissionApplication.findMany({
      where: req.school?.id ? { schoolId: req.school.id } : {},
      include: {
        stage: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const appResponses = [];
    for (const app of applications) {
      const submissions = Array.isArray(app.formSubmissions) ? app.formSubmissions : [];
      submissions.forEach((sub, subIdx) => {
        if (sub && (sub.formTemplateId === form.id || sub.title?.toLowerCase() === form.title?.toLowerCase())) {
          const childFull = `${app.childFirstName || ''} ${app.childLastName || ''}`.trim() || app.childName;
          const stableId = sub.id || `appsub_${app.id}_${subIdx}`;
          const isRev = Boolean(sub.isReviewed ?? sub.is_reviewed);
          appResponses.push({
            id: stableId,
            applicationId: app.id,
            respondentName: sub.respondentName || sub.filledByName || app.tutorName || 'Anónimo',
            respondentEmail: sub.respondentEmail || app.tutorEmail || '',
            respondentPhone: sub.respondentPhone || app.tutorPhone || '',
            submittedAt: sub.submittedAt || app.createdAt,
            status: sub.status || 'SUBMITTED',
            isReviewed: isRev,
            is_reviewed: isRev,
            viewedAt: sub.viewedAt || sub.viewed_at || null,
            processType: 'ADMISSION',
            processLabel: childFull ? `Admisión: ${childFull} (${app.stage?.name || 'En Proceso'})` : 'Admisión',
            data: sub.data || {},
            fieldLabels: sub.fieldLabels || {},
            files: Array.isArray(sub.files) ? sub.files : [],
            signature: sub.signature || null,
            ip: sub.ip || sub.telemetry?.ip || sub.metadata?.ip || '127.0.0.1',
            telemetry: sub.telemetry || sub.metadata || null,
            metadata: sub.metadata || sub.telemetry || null
          });
        }
      });
    }

    const formattedDirect = directSubmissions.map((sub, idx) => {
      const isRev = Boolean(sub.isReviewed ?? sub.is_reviewed);
      return {
        id: sub.id || `sub_direct_${idx}`,
        respondentName: sub.respondentName || sub.filledByName || 'Anónimo',
        respondentEmail: sub.respondentEmail || '',
        respondentPhone: sub.respondentPhone || '',
        submittedAt: sub.submittedAt || new Date().toISOString(),
        status: sub.status || 'SUBMITTED',
        isReviewed: isRev,
        is_reviewed: isRev,
        viewedAt: sub.viewedAt || sub.viewed_at || null,
        processType: sub.processType || 'STANDALONE',
        processLabel: sub.processLabel || 'Directo / Público',
        data: sub.data || {},
        fieldLabels: sub.fieldLabels || {},
        files: Array.isArray(sub.files) ? sub.files : [],
        signature: sub.signature || null,
        ip: sub.ip || sub.telemetry?.ip || sub.metadata?.ip || '127.0.0.1',
        telemetry: sub.telemetry || sub.metadata || null,
        metadata: sub.metadata || sub.telemetry || null
      };
    });

    const seenIds = new Set();
    const allResponses = [...formattedDirect, ...appResponses].filter(r => {
      if (seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    // Enrich responses on-the-fly with any official CURP PDFs cached in Redis
    for (const r of allResponses) {
      if (r.data) {
        await enrichFormDataWithCachedCurpPdfs(r.data);
      }
    }

    res.json({
      form,
      totalResponses: allResponses.length,
      responses: allResponses
    });
  } catch (e) {
    console.error('Error fetching form responses:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/forms/:id/responses/:responseId/mark-viewed
app.post('/api/admissions/forms/:id/responses/:responseId/mark-viewed', async (req, res) => {
  try {
    const { id: formId, responseId } = req.params;
    const nowIso = new Date().toISOString();

    const form = await prisma.admissionFormTemplate.findUnique({
      where: { id: formId }
    });
    if (!form) return res.status(404).json({ error: 'Formulario no encontrado' });

    let updated = false;

    // 1. Check direct submissions stored in form.schema._submissions
    if (form.schema && typeof form.schema === 'object' && Array.isArray(form.schema._submissions)) {
      const submissions = form.schema._submissions.map((s, idx) => {
        if (s && (s.id === responseId || `sub_direct_${idx}` === responseId)) {
          updated = true;
          return { ...s, isReviewed: true, is_reviewed: true, viewedAt: nowIso };
        }
        return s;
      });

      if (updated) {
        const currentSections = Array.isArray(form.schema.sections) 
          ? form.schema.sections 
          : (Array.isArray(form.schema) ? form.schema : []);
        await prisma.admissionFormTemplate.update({
          where: { id: form.id },
          data: {
            schema: {
              sections: currentSections,
              _submissions: submissions
            }
          }
        });
      }
    }

    // 2. Check application linked submissions
    if (!updated) {
      const applications = await prisma.admissionApplication.findMany({
        where: req.school?.id ? { schoolId: req.school.id } : {}
      });

      for (const app of applications) {
        if (Array.isArray(app.formSubmissions)) {
          let appUpdated = false;
          const updatedSubs = app.formSubmissions.map((sub, subIdx) => {
            const stableId = sub.id || `appsub_${app.id}_${subIdx}`;
            if (sub && (sub.id === responseId || stableId === responseId)) {
              appUpdated = true;
              updated = true;
              return { ...sub, isReviewed: true, is_reviewed: true, viewedAt: nowIso };
            }
            return sub;
          });

          if (appUpdated) {
            await prisma.admissionApplication.update({
              where: { id: app.id },
              data: { formSubmissions: updatedSubs }
            });
            break;
          }
        }
      }
    }

    // Emit Deepstream realtime notification
    publishDeepstreamRealtimeEvent(`form-submission-viewed:${form.id}`, {
      formId: form.id,
      responseId,
      isReviewed: true,
      viewedAt: nowIso
    });

    res.json({ success: true, responseId, isReviewed: true, viewedAt: nowIso });
  } catch (e) {
    console.error('Error marking response as viewed:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admissions/forms/:id/responses/:responseId
app.delete('/api/admissions/forms/:id/responses/:responseId', async (req, res) => {
  try {
    const { id: formId, responseId } = req.params;

    const form = await prisma.admissionFormTemplate.findUnique({
      where: { id: formId }
    });
    if (!form) return res.status(404).json({ error: 'Formulario no encontrado' });

    let deletedCount = 0;

    // 1. Remove from direct standalone submissions in schema._submissions
    if (form.schema && typeof form.schema === 'object' && Array.isArray(form.schema._submissions)) {
      const initialCount = form.schema._submissions.length;
      const filtered = form.schema._submissions.filter((s, idx) => {
        if (!s) return false;
        if (s.id === responseId) return false;
        if (`sub_direct_${idx}` === responseId) return false;
        return true;
      });

      if (filtered.length !== initialCount) {
        deletedCount += (initialCount - filtered.length);
        const currentSections = Array.isArray(form.schema.sections) 
          ? form.schema.sections 
          : (Array.isArray(form.schema) ? form.schema : []);
        
        const updatedSchema = {
          sections: currentSections,
          _submissions: filtered
        };
        await prisma.admissionFormTemplate.update({
          where: { id: form.id },
          data: { schema: updatedSchema }
        });
      }
    }

    // 2. Remove from admission applications if it was stored there
    const applications = await prisma.admissionApplication.findMany({
      where: req.school?.id ? { schoolId: req.school.id } : {}
    });

    for (const app of applications) {
      if (Array.isArray(app.formSubmissions) && app.formSubmissions.length > 0) {
        const initialCount = app.formSubmissions.length;
        const filtered = app.formSubmissions.filter((s, idx) => {
          if (!s) return false;
          if (s.id && s.id === responseId) return false;
          if (`appsub_${app.id}_${idx}` === responseId) return false;
          if (responseId.startsWith(app.id) && (s.formTemplateId === form.id || s.title?.toLowerCase() === form.title?.toLowerCase())) {
            return false;
          }
          return true;
        });

        if (filtered.length !== initialCount) {
          deletedCount += (initialCount - filtered.length);
          await prisma.admissionApplication.update({
            where: { id: app.id },
            data: { formSubmissions: filtered }
          });
        }
      }
    }

    res.json({
      success: true,
      deletedCount,
      message: 'Respuesta eliminada con éxito'
    });
  } catch (e) {
    console.error('Error deleting form response:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/forms
app.post('/api/admissions/forms', async (req, res) => {
  try {
    const { title, description, category, schema, isPublished } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título del formulario es obligatorio' });
    }

    const form = await prisma.admissionFormTemplate.create({
      data: {
        schoolId: req.school.id,
        title: title.trim(),
        description: (description || '').trim(),
        category: category || 'GENERAL',
        schema: Array.isArray(schema) ? schema : [],
        isPublished: isPublished !== undefined ? !!isPublished : true
      }
    });

    res.json(form);
  } catch (e) {
    console.error('Error creating admission form:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/admissions/forms/:id
app.put('/api/admissions/forms/:id', async (req, res) => {
  try {
    const { title, description, category, schema, isPublished } = req.body;
    const existing = await prisma.admissionFormTemplate.findUnique({
      where: { id: req.params.id }
    });
    if (!existing) return res.status(404).json({ error: 'Formulario no encontrado' });

    let updatedSchema = existing.schema;
    if (schema !== undefined) {
      const incomingSections = Array.isArray(schema) ? schema : (schema.sections || []);
      const existingSubmissions = Array.isArray(existing.schema?._submissions)
        ? existing.schema._submissions
        : [];
      
      updatedSchema = {
        sections: incomingSections,
        _submissions: existingSubmissions
      };
    }

    const form = await prisma.admissionFormTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category }),
        ...(schema !== undefined && { schema: updatedSchema }),
        ...(isPublished !== undefined && { isPublished: !!isPublished })
      }
    });

    res.json(form);
  } catch (e) {
    console.error('Error updating admission form:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admissions/forms/:id
app.delete('/api/admissions/forms/:id', async (req, res) => {
  try {
    await prisma.admissionFormTemplate.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting admission form:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/forms/seed-defaults
app.post('/api/admissions/forms/seed-defaults', async (req, res) => {
  try {
    for (const tpl of DEFAULT_ADMISSION_FORM_TEMPLATES) {
      const existing = await prisma.admissionFormTemplate.findFirst({
        where: { schoolId: req.school.id, title: tpl.title }
      });
      if (!existing) {
        await prisma.admissionFormTemplate.create({
          data: {
            schoolId: req.school.id,
            ...tpl
          }
        });
      }
    }
    const forms = await prisma.admissionFormTemplate.findMany({
      where: { schoolId: req.school.id },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, forms });
  } catch (e) {
    console.error('Error seeding admission forms:', e);
    res.status(500).json({ error: e.message });
  }
});

// In-memory OTP storage for restricted forms: Map<formId_email, { otp, expires }>
const formAccessOTPs = new Map();

function parseFormSchema(rawSchema) {
  let parsed = rawSchema;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      parsed = [];
    }
  }
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.sections)) return parsed.sections;
    if (Array.isArray(parsed.schema)) return parsed.schema;
  }
  return [];
}

// GET /api/admissions/public/standalone-forms/:id
app.get('/api/admissions/public/standalone-forms/:id', async (req, res) => {
  try {
    const form = await prisma.admissionFormTemplate.findUnique({
      where: { id: req.params.id }
    });
    if (!form) return res.status(404).json({ error: 'Formulario no encontrado o no disponible' });
    if (!form.isPublished) return res.status(403).json({ error: 'Este formulario actualmente se encuentra en modo borrador y no acepta respuestas' });

    let school = null;
    if (form.schoolId) {
      school = await prisma.school.findUnique({
        where: { id: form.schoolId }
      });
    }

    const schema = parseFormSchema(form.schema);
    const firstSec = schema[0] || {};
    const accessType = firstSec.accessType || form.accessType || 'PUBLIC'; // 'PUBLIC' | 'RESTRICTED_WHITELIST'
    const allowedEmails = Array.isArray(firstSec.allowedEmails) ? firstSec.allowedEmails : (Array.isArray(form.allowedEmails) ? form.allowedEmails : []);
    const isMultipleAllowed = firstSec.allowMultipleResponses !== undefined 
      ? !!firstSec.allowMultipleResponses 
      : (form.allowMultipleResponses !== undefined ? !!form.allowMultipleResponses : true);

    const { email } = req.query;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;
    let hasSubmitted = false;
    let pollStats = null;

    if (cleanEmail) {
      let rawSchema = form.schema;
      if (typeof rawSchema === 'string') {
        try { rawSchema = JSON.parse(rawSchema); } catch (e) {}
      }
      const currentSubmissions = Array.isArray(rawSchema?._submissions) ? rawSchema._submissions : [];
      const hasSubmittedDirect = currentSubmissions.some(s => s.respondentEmail?.toLowerCase() === cleanEmail);

      const apps = await prisma.admissionApplication.findMany({
        select: { formSubmissions: true }
      });
      const hasSubmittedApp = apps.some(a => {
        const subs = Array.isArray(a.formSubmissions) ? a.formSubmissions : [];
        return subs.some(s => s.formTemplateId === form.id && s.respondentEmail?.toLowerCase() === cleanEmail);
      });

      hasSubmitted = hasSubmittedDirect || hasSubmittedApp;

      if (hasSubmitted) {
        // Fetch and aggregate poll statistics across all submissions (direct + application)
        const appSubmissions = apps.flatMap(a => {
          const subs = Array.isArray(a.formSubmissions) ? a.formSubmissions : [];
          return subs.filter(s => s.formTemplateId === form.id);
        });

        const allSubs = [...currentSubmissions, ...appSubmissions];
        pollStats = {};
        const pollFields = schema.flatMap(sec => (sec.fields || []).filter(fld => fld.type === 'poll'));

        pollFields.forEach(fld => {
          if (fld.pollConfig?.showResultsAfterSubmit) {
            const opts = fld.pollConfig?.options || [];
            const counts = {};
            opts.forEach(opt => {
              counts[opt.id] = 0;
            });

            let totalVotes = 0;
            allSubs.forEach(sub => {
              const val = sub.data?.[fld.id];
              if (val) {
                if (Array.isArray(val)) {
                  val.forEach(id => {
                    if (counts[id] !== undefined) counts[id]++;
                  });
                  totalVotes += val.length;
                } else if (typeof val === 'string') {
                  if (counts[val] !== undefined) {
                    counts[val]++;
                    totalVotes++;
                  }
                }
              }
            });

            let respondentsCount = 0;
            allSubs.forEach(sub => {
              const val = sub.data?.[fld.id];
              if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
                respondentsCount++;
              }
            });

            const optionsStats = {};
            opts.forEach(opt => {
              const count = counts[opt.id] || 0;
              const divisor = fld.pollConfig?.allowMultiple ? respondentsCount : totalVotes;
              const pct = divisor > 0 ? Math.round((count / divisor) * 100) : 0;
              optionsStats[opt.id] = { count, pct };
            });

            pollStats[fld.id] = {
              totalVotes: fld.pollConfig?.allowMultiple ? respondentsCount : totalVotes,
              options: optionsStats
            };
          }
        });
      }
    }

    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category,
      schema,
      layoutStyle: firstSec.layoutStyle || form.layoutStyle || 'google_forms',
      themeColor: firstSec.themeColor || '#1b3b2b',
      accessType,
      requiresWhitelist: accessType === 'RESTRICTED_WHITELIST',
      allowMultipleResponses: isMultipleAllowed,
      hasSubmitted,
      pollStats,
      school: school ? {
        id: school.id,
        name: school.name,
        slug: school.slug,
        logo: school.logo || null,
        primaryColor: school.primaryColor || '#1b3b2b'
      } : {
        name: 'Ceiba Roots Montessori',
        logo: null,
        primaryColor: '#1b3b2b'
      }
    });
  } catch (e) {
    console.error('Error fetching public standalone form:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/public/standalone-forms/:id/request-otp
app.post('/api/admissions/public/standalone-forms/:id/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico válido' });
    }

    const form = await prisma.admissionFormTemplate.findUnique({
      where: { id: req.params.id }
    });
    if (!form || !form.isPublished) {
      return res.status(404).json({ error: 'Formulario no disponible' });
    }

    const schema = parseFormSchema(form.schema);
    const firstSec = schema[0] || {};
    const accessType = firstSec.accessType || form.accessType || 'PUBLIC';
    const allowedEmails = (Array.isArray(firstSec.allowedEmails) ? firstSec.allowedEmails : (Array.isArray(form.allowedEmails) ? form.allowedEmails : [])).map(e => e.trim().toLowerCase());

    const cleanEmail = email.trim().toLowerCase();

    if (accessType === 'RESTRICTED_WHITELIST') {
      if (!allowedEmails.includes(cleanEmail)) {
        return res.status(403).json({
          error: 'Tu correo electrónico no se encuentra en la lista autorizada para este formulario. Solicita acceso a la administración del colegio.'
        });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `${form.id}_${cleanEmail}`;
    formAccessOTPs.set(key, {
      otp,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    console.log(`\n========================================`);
    console.log(`🔐 CEIBA ROOTS - CÓDIGO DE ACCESO A FORMULARIO`);
    console.log(`📋 Formulario: ${form.title}`);
    console.log(`📧 Para: ${cleanEmail}`);
    console.log(`🔢 Código OTP de 6 dígitos: >>> ${otp} <<<`);
    console.log(`⏰ Válido por 10 minutos`);
    console.log(`========================================\n`);

    // Dispatch email if SMTP is configured
    try {
      await sendAdmissionOtpJob({
        schoolId: form.schoolId,
        tutorEmail: cleanEmail,
        tutorName: cleanEmail.split('@')[0],
        childName: form.title,
        code: otp,
        token: form.id
      }, prisma);
    } catch (mailErr) {
      console.error('Error sending standalone form OTP email:', mailErr);
    }

    res.json({
      success: true,
      message: `Código de seguridad de 6 dígitos generado y enviado a ${cleanEmail}.`
    });
  } catch (e) {
    console.error('Error requesting form OTP:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/public/standalone-forms/:id/verify-otp
app.post('/api/admissions/public/standalone-forms/:id/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Correo y código de 6 dígitos son obligatorios' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const key = `${req.params.id}_${cleanEmail}`;
    const entry = formAccessOTPs.get(key);

    if (!entry || entry.otp !== cleanOtp || Date.now() > entry.expires) {
      return res.status(401).json({ error: 'El código de seguridad es inválido o ha expirado. Solicita uno nuevo.' });
    }

    // OTP verified! Generate simple access session token
    formAccessOTPs.delete(key);
    const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    res.json({
      success: true,
      sessionToken,
      verifiedEmail: cleanEmail
    });
  } catch (e) {
    console.error('Error verifying form OTP:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/public/standalone-forms/:id/submit
app.post('/api/admissions/public/standalone-forms/:id/submit', async (req, res) => {
  try {
    const { data, files, signature, respondentEmail, respondentName, applicationId, processType, fieldLabels, telemetry, clientMetadata } = req.body;

    const rawIp = (
      req.headers['cf-connecting-ip'] ||
      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    ).replace('::ffff:', '');

    const incomingTelemetry = telemetry || clientMetadata || {};
    const fullTelemetry = {
      ip: rawIp,
      fingerprint: incomingTelemetry.fingerprint || `fp_${Date.now().toString(36)}`,
      browser: incomingTelemetry.browser || null,
      os: incomingTelemetry.os || null,
      deviceType: incomingTelemetry.deviceType || 'desktop',
      screen: incomingTelemetry.screen || null,
      timezone: incomingTelemetry.timezone || 'UTC',
      language: incomingTelemetry.language || 'es-MX',
      userAgent: req.headers['user-agent'] || incomingTelemetry.userAgent || '',
      startedAt: incomingTelemetry.startedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      durationSeconds: typeof incomingTelemetry.durationSeconds === 'number' ? incomingTelemetry.durationSeconds : null,
      durationFormatted: incomingTelemetry.durationFormatted || null,
      deviceSwitched: Boolean(incomingTelemetry.deviceSwitched),
      initialFingerprint: incomingTelemetry.initialFingerprint || null
    };

    const form = await prisma.admissionFormTemplate.findUnique({
      where: { id: req.params.id }
    });
    if (!form || !form.isPublished) {
      return res.status(404).json({ error: 'Formulario no disponible' });
    }

    // Enrich submission data with any official CURP PDF stored in Redis and delete temporary key from Redis
    const formSections = parseFormSchema(form.schema);
    await enrichFormDataWithCachedCurpPdfs(data, formSections, true);

    const cleanRespondentName = (respondentName || '').trim() || (respondentEmail || '').trim() || 'Anónimo';
    const cleanRespondentEmail = (respondentEmail || '').trim().toLowerCase();

    const firstSec = formSections[0] || {};
    const isMultipleAllowed = firstSec.allowMultipleResponses !== undefined 
      ? !!firstSec.allowMultipleResponses 
      : (form.allowMultipleResponses !== undefined ? !!form.allowMultipleResponses : true);

    if (!isMultipleAllowed && cleanRespondentEmail) {
      let rawSchema = form.schema;
      if (typeof rawSchema === 'string') {
        try { rawSchema = JSON.parse(rawSchema); } catch (e) {}
      }
      const currentSubmissions = Array.isArray(rawSchema?._submissions) ? rawSchema._submissions : [];
      const hasSubmittedDirect = currentSubmissions.some(s => s.respondentEmail?.toLowerCase() === cleanRespondentEmail);

      const apps = await prisma.admissionApplication.findMany({
        select: { formSubmissions: true }
      });
      const hasSubmittedApp = apps.some(a => {
        const subs = Array.isArray(a.formSubmissions) ? a.formSubmissions : [];
        return subs.some(s => s.formTemplateId === form.id && s.respondentEmail?.toLowerCase() === cleanRespondentEmail);
      });

      if (hasSubmittedDirect || hasSubmittedApp) {
        return res.status(400).json({ error: 'Ya has enviado una respuesta para este formulario y no se permiten envíos múltiples.' });
      }
    }

    let targetApp = null;
    if (applicationId) {
      targetApp = await prisma.admissionApplication.findUnique({
        where: { id: applicationId },
        include: { school: true }
      });
    }

    // Save all physical assets (documents, selfies, video, autocrop, uploads) to storage and obtain dossier documents
    const { newDocuments } = await processAdmissionFormDossierAndStorage({
      application: targetApp || { schoolId: form.schoolId || 'global', id: 'standalone', tutorName: cleanRespondentName, tutorEmail: cleanRespondentEmail },
      formTemplate: form,
      formData: data || {},
      files,
      signature,
      respondentName: cleanRespondentName,
      respondentEmail: cleanRespondentEmail
    });

    const newSubmissionItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      formTemplateId: form.id,
      title: form.title,
      category: form.category,
      respondentName: cleanRespondentName,
      respondentEmail: cleanRespondentEmail,
      status: 'SUBMITTED',
      isReviewed: false,
      is_reviewed: false,
      viewedAt: null,
      processType: processType || (applicationId ? 'ADMISSION' : 'STANDALONE'),
      processLabel: applicationId ? 'Proceso de Admisión' : 'Directo / Público',
      submittedAt: new Date().toISOString(),
      data: data || {},
      fieldLabels: (fieldLabels && typeof fieldLabels === 'object') ? fieldLabels : {},
      files: Array.isArray(files) ? files : [],
      signature: signature || null,
      ip: rawIp,
      telemetry: fullTelemetry,
      metadata: {
        ...fullTelemetry,
        clientIp: rawIp
      }
    };

    let rawSchema = form.schema;
    if (typeof rawSchema === 'string') {
      try { rawSchema = JSON.parse(rawSchema); } catch (e) {}
    }
    const currentSubmissions = Array.isArray(rawSchema?._submissions) ? rawSchema._submissions : [];

    if (targetApp) {
      const existing = Array.isArray(targetApp.formSubmissions) ? targetApp.formSubmissions : [];
      const existingDocs = Array.isArray(targetApp.submittedDocuments) ? targetApp.submittedDocuments : [];

      await prisma.admissionApplication.update({
        where: { id: targetApp.id },
        data: {
          formSubmissions: [...existing, newSubmissionItem],
          submittedDocuments: [...existingDocs, ...newDocuments]
        }
      });
    } else {
      // Direct Standalone Submission: store into the form template's schema container
      let currentSections = parseFormSchema(form.schema);
      const updatedSchema = {
        sections: currentSections,
        _submissions: [newSubmissionItem, ...currentSubmissions]
      };

      await prisma.admissionFormTemplate.update({
        where: { id: form.id },
        data: {
          schema: updatedSchema
        }
      });
    }

    // Automatically book calendar slots / RSVP if schedule_event fields are included
    await processEventBookingsFromFormData(data, {
      guestName: cleanRespondentName,
      guestEmail: cleanRespondentEmail,
      guestPhone: (data && (data.phone || data.telefono || data.movil || data.cellphone)) || '',
      formTitle: form.title,
      studentId: null,
      tutorUserId: null
    });

    // Emit Realtime event via Deepstream WebSocket to connected admin viewers
    publishDeepstreamRealtimeEvent(`form-submission-created:${form.id}`, {
      formId: form.id,
      submission: newSubmissionItem
    });
    publishDeepstreamRealtimeEvent(`form-submission-created`, {
      formId: form.id,
      submission: newSubmissionItem
    });

    // Fetch and aggregate poll statistics across all submissions (direct + application)
    const apps = await prisma.admissionApplication.findMany({
      select: { formSubmissions: true }
    });
    const appSubmissions = apps.flatMap(a => {
      const subs = Array.isArray(a.formSubmissions) ? a.formSubmissions : [];
      return subs.filter(s => s.formTemplateId === form.id);
    });

    const allSubs = [newSubmissionItem, ...currentSubmissions, ...appSubmissions];
    const pollStats = {};
    const pollFields = formSections.flatMap(sec => (sec.fields || []).filter(fld => fld.type === 'poll'));

    pollFields.forEach(fld => {
      if (fld.pollConfig?.showResultsAfterSubmit) {
        const opts = fld.pollConfig?.options || [];
        const counts = {};
        opts.forEach(opt => {
          counts[opt.id] = 0;
        });

        let totalVotes = 0;
        allSubs.forEach(sub => {
          const val = sub.data?.[fld.id];
          if (val) {
            if (Array.isArray(val)) {
              val.forEach(id => {
                if (counts[id] !== undefined) counts[id]++;
              });
              totalVotes += val.length;
            } else if (typeof val === 'string') {
              if (counts[val] !== undefined) {
                counts[val]++;
                totalVotes++;
              }
            }
          }
        });

        let respondentsCount = 0;
        allSubs.forEach(sub => {
          const val = sub.data?.[fld.id];
          if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
            respondentsCount++;
          }
        });

        const optionsStats = {};
        opts.forEach(opt => {
          const count = counts[opt.id] || 0;
          const divisor = fld.pollConfig?.allowMultiple ? respondentsCount : totalVotes;
          const pct = divisor > 0 ? Math.round((count / divisor) * 100) : 0;
          optionsStats[opt.id] = { count, pct };
        });

        pollStats[fld.id] = {
          totalVotes: fld.pollConfig?.allowMultiple ? respondentsCount : totalVotes,
          options: optionsStats
        };
      }
    });

    res.json({
      success: true,
      submissionId: newSubmissionItem.id,
      message: '¡Formulario enviado con éxito!',
      pollStats
    });
  } catch (e) {
    console.error('Error submitting standalone form:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admissions/public/standalone-forms/:id/submissions
app.delete('/api/admissions/public/standalone-forms/:id/submissions', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Se requiere el correo electrónico del remitente para eliminar la respuesta.' });
    }

    const form = await prisma.admissionFormTemplate.findUnique({
      where: { id: req.params.id }
    });
    if (!form) return res.status(404).json({ error: 'Formulario no encontrado' });

    let rawSchema = form.schema;
    if (typeof rawSchema === 'string') {
      try { rawSchema = JSON.parse(rawSchema); } catch (e) {}
    }

    const currentSubmissions = Array.isArray(rawSchema?._submissions) ? rawSchema._submissions : [];
    const updatedSubmissions = currentSubmissions.filter(s => s.respondentEmail?.toLowerCase() !== cleanEmail);

    let currentSections = parseFormSchema(form.schema);
    const updatedSchema = {
      sections: currentSections,
      _submissions: updatedSubmissions
    };

    await prisma.admissionFormTemplate.update({
      where: { id: form.id },
      data: {
        schema: updatedSchema
      }
    });

    res.json({ success: true, message: 'Respuesta eliminada con éxito.' });
  } catch (e) {
    console.error('Error deleting standalone form submission:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/public/verify-identity
app.post('/api/admissions/public/verify-identity', async (req, res) => {
  try {
    const {
      documentFrontUrl,
      selfieUrl,
      minScore = 80,
      docType = 'id_card',
      matchScore: clientScore,
      isMatch: clientMatch,
      errorMessage
    } = req.body;

    if (!documentFrontUrl || !selfieUrl) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere tanto la fotografía del documento como la selfie biométrica'
      });
    }

    if (errorMessage || clientScore === 0) {
      return res.json({
        success: true,
        isMatch: false,
        matchScore: 0,
        threshold: Number(minScore) || 80,
        status: 'failed',
        verifiedAt: new Date().toISOString(),
        docType,
        message: errorMessage || 'No se detectó un rostro humano válido en el documento o la selfie.'
      });
    }

    const finalScore = typeof clientScore === 'number'
      ? parseFloat(Math.min(99.9, Math.max(0, clientScore)).toFixed(1))
      : 85.0;
    let isMatch = clientMatch !== undefined ? Boolean(clientMatch) : finalScore >= (Number(minScore) || 80);

    // If biometric match is positive, perform automated Document OCR via OpenAI Vision
    let ocrData = null;
    let typeMismatchError = null;
    if (isMatch && documentFrontUrl) {
      try {
        const ocrRes = await extractDocumentDataWithOpenAI({
          frontImage: documentFrontUrl,
          backImage: req.body.documentBackUrl || null,
          signatureImage: req.body.signatureImage || req.body.signature || null,
          docType,
          schoolId: req.body.schoolId || null,
          prisma
        });
        if (ocrRes?.extractedData) {
          ocrData = ocrRes.extractedData;
          if (ocrData.document_type_matches === false) {
            typeMismatchError = ocrData.validation_error || 'El tipo de documento presentado no coincide con el seleccionado.';
            isMatch = false;
          }
        }
      } catch (ocrErr) {
        console.warn('[IDENTITY VERIFY OCR NOTICE]', ocrErr.message);
      }
    }

    const finalStatus = isMatch ? 'verified' : 'failed';
    const finalMessage = typeMismatchError
      ? typeMismatchError
      : isMatch
        ? `Coincidencia biométrica verificada exitosamente (${finalScore}% de similitud)`
        : `La similitud facial (${finalScore}%) no alcanzó el umbral requerido (${minScore}%)`;

    res.json({
      success: true,
      isMatch,
      matchScore: finalScore,
      threshold: Number(minScore) || 80,
      status: finalStatus,
      verifiedAt: new Date().toISOString(),
      docType,
      ocrData,
      message: finalMessage
    });
  } catch (e) {
    console.error('Error in verify-identity:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/admissions/public/extract-document-ocr
app.post('/api/admissions/public/extract-document-ocr', async (req, res) => {
  try {
    const { documentFrontUrl, documentBackUrl, signatureImage, signature, docType = 'id_card', schoolId } = req.body;
    if (!documentFrontUrl) {
      return res.status(400).json({ success: false, error: 'Se requiere la imagen del frente del documento' });
    }

    const ocrResult = await extractDocumentDataWithOpenAI({
      frontImage: documentFrontUrl,
      backImage: documentBackUrl || null,
      signatureImage: signatureImage || signature || null,
      docType,
      schoolId: schoolId || null,
      prisma
    });

    res.json(ocrResult);
  } catch (err) {
    console.error('Error extracting document OCR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= PUBLIC EXPEDIENTE PORTAL (SECURE & LAYOUT-FREE) =================

// In-memory OTP and Session Store for Admission Portals
// Map<token, { code, email, expiresAt, authToken, authorizedUntil, applicationId }>
const portalOtpStore = new Map();

// Helper to mask names for unauthorized view
function maskFullName(fullName) {
  if (!fullName) return 'Aspirante';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Aspirante';
  if (parts.length === 1) {
    const p = parts[0];
    return p.length <= 3 ? p : p.slice(0, 2) + '*'.repeat(p.length - 2);
  }
  return parts.map((part, idx) => {
    if (idx === 0) return part; // Keep first name
    if (part.length <= 2) return '*'.repeat(part.length);
    return part[0] + '*'.repeat(Math.max(2, part.length - 1));
  }).join(' ');
}

// Helper to mask email for unauthorized view
function maskEmail(email) {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedUser = user.length <= 2 ? user[0] + '*' : user[0] + '*'.repeat(Math.max(2, user.length - 2)) + user[user.length - 1];
  return `${maskedUser}@${domain}`;
}

// Helper to get school SMTP Transporter
async function getSchoolSmtpTransporter(schoolId) {
  if (!schoolId) return { transporter: null, from: '', isConfigured: false };
  const siteSettings = await prisma.siteSetting.findMany({
    where: { schoolId }
  });
  const settingsMap = {};
  siteSettings.forEach(s => { settingsMap[s.key] = s.value; });

  const host = settingsMap.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(settingsMap.smtp_port || process.env.SMTP_PORT || '587', 10);
  const user = settingsMap.smtp_user || process.env.SMTP_USER;
  const pass = settingsMap.smtp_pass || process.env.SMTP_PASS;
  const secure = settingsMap.smtp_secure === 'true' || port === 465;
  const fromName = settingsMap.smtp_from_name || settingsMap.school_name || 'Comunidad Montessori';
  const fromEmail = settingsMap.smtp_from_email || user || 'no-reply@montessori.edu';

  if (!host || !user || !pass) {
    return {
      transporter: null,
      from: `"${fromName}" <${fromEmail}>`,
      isConfigured: false
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return {
    transporter,
    from: `"${fromName}" <${fromEmail}>`,
    isConfigured: true
  };
}

// GET /api/admissions/public/portal/:token
app.get('/api/admissions/public/portal/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const clientAuthToken = req.headers['x-portal-auth'] || req.query.auth_token || req.query.auth || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);

    let application = await prisma.admissionApplication.findFirst({
      where: { portalToken: token },
      include: {
        stage: true,
        targetEnvironment: true,
        school: true
      }
    });

    // Fallback: match by application id if token was uuid id
    if (!application) {
      application = await prisma.admissionApplication.findUnique({
        where: { id: token },
        include: {
          stage: true,
          targetEnvironment: true,
          school: true
        }
      });
    }

    if (!application) {
      return res.status(404).json({ error: 'Expediente de admisión no encontrado o enlace inválido.' });
    }

    // Check authorization:
    // 1. Check in-memory portalOtpStore
    const storedSession = portalOtpStore.get(token) || portalOtpStore.get(application.id);
    let isAuthorized = !!(
      storedSession &&
      storedSession.authToken &&
      clientAuthToken &&
      storedSession.authToken === clientAuthToken &&
      storedSession.authorizedUntil > Date.now()
    );

    let activeAuthToken = isAuthorized ? storedSession.authToken : null;
    let verifiedEmail = isAuthorized ? storedSession.email : null;

    // 2. If not already authenticated in session, verify signed cryptographic magic token (from notification emails)
    if (!isAuthorized && clientAuthToken) {
      const verifiedPayload = verifyAdmissionPortalSignedToken(clientAuthToken, application.id);
      if (verifiedPayload && (verifiedPayload.appId === application.id || verifiedPayload.portalToken === application.portalToken)) {
        isAuthorized = true;
        activeAuthToken = clientAuthToken;
        verifiedEmail = verifiedPayload.email;

        const sessionPayload = {
          email: verifiedPayload.email,
          tutorName: verifiedPayload.tutorName || application.tutorName,
          authToken: clientAuthToken,
          authorizedUntil: verifiedPayload.exp,
          applicationId: application.id
        };

        portalOtpStore.set(token, sessionPayload);
        portalOtpStore.set(application.id, sessionPayload);
        if (application.portalToken) {
          portalOtpStore.set(application.portalToken, sessionPayload);
        }
        console.log(`[ADMISSION PORTAL AUTO-AUTH] Auto-authenticated application ${application.id} for recipient: ${verifiedPayload.email}`);
      }
    }

    let rawSchool = application.school;
    if (!rawSchool && application.schoolId) {
      rawSchool = await prisma.school.findUnique({
        where: { id: application.schoolId }
      });
    }

    let enrichedSchool = rawSchool;
    if (rawSchool) {
      const siteSettings = await prisma.siteSetting.findMany({
        where: { schoolId: rawSchool.id }
      });
      const settingsMap = {};
      siteSettings.forEach(s => { settingsMap[s.key] = s.value; });

      enrichedSchool = {
        id: rawSchool.id,
        name: settingsMap.school_name || rawSchool.name,
        legalName: settingsMap.school_tagline || rawSchool.legalName,
        logoUrl: settingsMap.school_logo || rawSchool.logoUrl || '/favicon.png',
        primaryColor: settingsMap.brand_primary_color || rawSchool.primaryColor || '#1b3b2b',
        secondaryColor: settingsMap.brand_secondary_color || rawSchool.accentColor || '#10b981',
        accentColor: settingsMap.brand_accent_color || rawSchool.accentColor || '#c86d51',
        address: settingsMap.school_address || rawSchool.address || '',
        city: settingsMap.school_city || rawSchool.city || '',
        country: settingsMap.school_country || rawSchool.country || 'México',
        phone: settingsMap.contact_phone || rawSchool.phone || '',
        email: settingsMap.contact_email || rawSchool.email || ''
      };
    }

    // Get current stage required forms & their full templates
    const requiredForms = Array.isArray(application.stage?.requiredForms) ? application.stage.requiredForms : [];
    const templateIds = requiredForms.map(rf => rf.formTemplateId).filter(Boolean);

    const templates = await prisma.admissionFormTemplate.findMany({
      where: { id: { in: templateIds } }
    });

    const enrichedRequiredForms = requiredForms.map(rf => {
      const template = templates.find(t => t.id === rf.formTemplateId);
      return {
        ...rf,
        template: template || null
      };
    });

    const targetSchoolId = application.schoolId || rawSchool?.id;
    let allStages = [];
    if (targetSchoolId) {
      allStages = await prisma.admissionStage.findMany({
        where: { schoolId: targetSchoolId },
        orderBy: { orderIndex: 'asc' }
      });
    } else {
      allStages = await prisma.admissionStage.findMany({
        orderBy: { orderIndex: 'asc' }
      });
    }

    // Prepare response data depending on authorization
    const appData = isAuthorized ? {
      id: application.id,
      portalToken: application.portalToken || application.id,
      childName: application.childName,
      childFirstName: application.childFirstName,
      childLastName: application.childLastName,
      birthDate: application.birthDate,
      tutorName: application.tutorName,
      tutorEmail: application.tutorEmail,
      tutorPhone: application.tutorPhone,
      status: application.status,
      submittedDocuments: application.submittedDocuments || [],
      formSubmissions: application.formSubmissions || [],
      createdAt: application.createdAt
    } : {
      id: application.id,
      portalToken: application.portalToken || application.id,
      childName: maskFullName(application.childName),
      childFirstName: application.childFirstName || maskFullName(application.childName).split(' ')[0],
      childLastName: '***',
      birthDate: null,
      tutorName: maskFullName(application.tutorName),
      tutorEmail: maskEmail(application.tutorEmail),
      tutorPhone: '***',
      status: application.status,
      submittedDocuments: [],
      formSubmissions: [],
      createdAt: application.createdAt
    };

    res.json({
      isAuthorized,
      authToken: isAuthorized ? activeAuthToken : undefined,
      verifiedEmail: isAuthorized ? (verifiedEmail || application.tutorEmail) : undefined,
      application: appData,
      stage: application.stage,
      stages: allStages,
      targetEnvironment: application.targetEnvironment,
      school: enrichedSchool,
      requiredForms: isAuthorized ? enrichedRequiredForms : [],
      formSubmissions: isAuthorized ? (application.formSubmissions || []) : []
    });
  } catch (e) {
    console.error('Error fetching portal admission dossier:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/public/portal/:token/request-otp
app.post('/api/admissions/public/portal/:token/request-otp', async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Debe ingresar el correo electrónico del tutor registrado.' });
    }

    let application = await prisma.admissionApplication.findFirst({
      where: { portalToken: token },
      include: { school: true }
    });

    if (!application) {
      application = await prisma.admissionApplication.findUnique({
        where: { id: token },
        include: { school: true }
      });
    }

    if (!application) {
      return res.status(404).json({ error: 'Expediente no encontrado o enlace inválido.' });
    }

    const inputEmail = email.trim().toLowerCase();
    const registeredEmail = (application.tutorEmail || '').trim().toLowerCase();

    if (!registeredEmail || inputEmail !== registeredEmail) {
      return res.status(403).json({
        error: 'El correo electrónico no coincide con los registros del tutor asociado a este expediente y no está autorizado para acceder.'
      });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    const sessionPayload = {
      code,
      email: registeredEmail,
      expiresAt,
      applicationId: application.id
    };

    portalOtpStore.set(token, sessionPayload);
    portalOtpStore.set(application.id, sessionPayload);

    // Send email via configured SMTP (Direct or BullMQ queue)
    const targetSchoolId = application.schoolId || application.school?.id;
    if (targetSchoolId) {
      try {
        await sendAdmissionOtpJob({
          schoolId: targetSchoolId,
          tutorEmail: application.tutorEmail,
          tutorName: application.tutorName,
          childName: application.childName,
          code,
          token
        }, prisma);
      } catch (mailErr) {
        console.error('Error sending admission portal OTP email:', mailErr);
      }
    } else {
      console.log(`\n======================================================\n[ADMISSION PORTAL OTP] Token: ${token} | Email: ${application.tutorEmail} | OTP CODE: ${code}\n======================================================\n`);
    }

    res.json({
      success: true,
      message: 'Código de verificación enviado correctamente a su correo electrónico.'
    });
  } catch (e) {
    console.error('Error requesting admission portal OTP:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/public/portal/:token/verify-otp
app.post('/api/admissions/public/portal/:token/verify-otp', async (req, res) => {
  try {
    const { token } = req.params;
    const { email, code } = req.body;

    const stored = portalOtpStore.get(token);
    if (!stored || !stored.code || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'El código ha expirado o no ha sido solicitado. Por favor solicite uno nuevo.' });
    }

    const inputCode = (code || '').trim();
    const inputEmail = (email || '').trim().toLowerCase();

    if (inputEmail !== stored.email || inputCode !== stored.code) {
      return res.status(400).json({ error: 'El código de seguridad ingresado es incorrecto.' });
    }

    // Generate secure auth session token valid for 24h
    const authToken = crypto.randomBytes(32).toString('hex');
    const updatedPayload = {
      ...stored,
      authToken,
      authorizedUntil: Date.now() + 24 * 60 * 60 * 1000
    };

    portalOtpStore.set(token, updatedPayload);
    if (stored.applicationId) {
      portalOtpStore.set(stored.applicationId, updatedPayload);
    }

    res.json({
      success: true,
      authToken,
      message: 'Verificación exitosa. Acceso concedido al expediente.'
    });
  } catch (e) {
    console.error('Error verifying admission portal OTP:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/public/portal/:token/submit-form
app.post('/api/admissions/public/portal/:token/submit-form', async (req, res) => {
  try {
    const { token } = req.params;
    const clientAuthToken = req.headers['x-portal-auth'] || req.query.auth_token || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);
    const { formTemplateId, filledByRole, filledByName, data, files, signature, telemetry, clientMetadata } = req.body;

    const rawIp = (
      req.headers['cf-connecting-ip'] ||
      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    ).replace('::ffff:', '');

    const incomingTelemetry = telemetry || clientMetadata || {};
    const fullTelemetry = {
      ip: rawIp,
      fingerprint: incomingTelemetry.fingerprint || `fp_${Date.now().toString(36)}`,
      browser: incomingTelemetry.browser || null,
      os: incomingTelemetry.os || null,
      deviceType: incomingTelemetry.deviceType || 'desktop',
      screen: incomingTelemetry.screen || null,
      timezone: incomingTelemetry.timezone || 'UTC',
      language: incomingTelemetry.language || 'es-MX',
      userAgent: req.headers['user-agent'] || incomingTelemetry.userAgent || '',
      startedAt: incomingTelemetry.startedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      durationSeconds: typeof incomingTelemetry.durationSeconds === 'number' ? incomingTelemetry.durationSeconds : null,
      durationFormatted: incomingTelemetry.durationFormatted || null,
      deviceSwitched: Boolean(incomingTelemetry.deviceSwitched),
      initialFingerprint: incomingTelemetry.initialFingerprint || null
    };

    let application = await prisma.admissionApplication.findFirst({
      where: { portalToken: token },
      include: { stage: true }
    });

    if (!application) {
      application = await prisma.admissionApplication.findUnique({
        where: { id: token },
        include: { stage: true }
      });
    }

    if (!application) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Check authorization
    const storedSession = portalOtpStore.get(token) || portalOtpStore.get(application.id);
    let isAuthorized = !!(
      storedSession &&
      storedSession.authToken &&
      clientAuthToken &&
      storedSession.authToken === clientAuthToken &&
      storedSession.authorizedUntil > Date.now()
    );

    if (!isAuthorized && clientAuthToken) {
      const verifiedPayload = verifyAdmissionPortalSignedToken(clientAuthToken, application.id);
      if (verifiedPayload && (verifiedPayload.appId === application.id || verifiedPayload.portalToken === application.portalToken)) {
        isAuthorized = true;
        const sessionPayload = {
          email: verifiedPayload.email,
          tutorName: verifiedPayload.tutorName || application.tutorName,
          authToken: clientAuthToken,
          authorizedUntil: verifiedPayload.exp,
          applicationId: application.id
        };
        portalOtpStore.set(token, sessionPayload);
        portalOtpStore.set(application.id, sessionPayload);
        if (application.portalToken) {
          portalOtpStore.set(application.portalToken, sessionPayload);
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ error: 'No está autorizado para enviar respuestas en este expediente. Debe autenticarse primero con su código OTP.' });
    }

    const template = await prisma.admissionFormTemplate.findUnique({
      where: { id: formTemplateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Plantilla de formulario no encontrada' });
    }

    // Enrich submission data with any official CURP PDF stored in Redis and delete temporary key from Redis
    const templateSections = parseFormSchema(template.schema);
    await enrichFormDataWithCachedCurpPdfs(data, templateSections, true);

    // Process physical storage assets and attach to student dossier documents
    const { newDocuments } = await processAdmissionFormDossierAndStorage({
      application,
      formTemplate: template,
      formData: data || {},
      files,
      signature,
      respondentName: filledByName,
      respondentEmail: application.tutorEmail
    });

    const existingSubmissions = Array.isArray(application.formSubmissions) ? application.formSubmissions : [];
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newSubmission = {
      id: submissionId,
      formTemplateId: template.id,
      stageId: application.stageId,
      stageName: application.stage?.name || 'Fase actual',
      title: template.title,
      category: template.category,
      filledByRole: filledByRole || 'ANY_TUTOR',
      filledByName: filledByName || application.tutorName || 'Familiar',
      status: 'SUBMITTED',
      data: data || {},
      files: files || [],
      signature: signature || null,
      submittedAt: new Date().toISOString(),
      ip: rawIp,
      telemetry: fullTelemetry,
      metadata: {
        ...fullTelemetry,
        clientIp: rawIp
      }
    };

    // Filter out previous submissions of the same template in the same stage or replace
    const updatedSubmissions = [
      ...existingSubmissions.filter(s => s.formTemplateId !== template.id || s.stageId !== application.stageId),
      newSubmission
    ];

    const existingDocs = Array.isArray(application.submittedDocuments) ? application.submittedDocuments : [];
    const updatedDocs = [...existingDocs, ...newDocuments];

    const currentHistory = Array.isArray(application.history) ? application.history : [];
    const formHistoryEntry = {
      action: 'FORM_SUBMITTED',
      stageId: application.stageId,
      stageName: application.stage?.name || 'Fase actual',
      formTitle: template.title,
      timestamp: new Date().toISOString(),
      actor: filledByName || application.tutorName || 'Familiar',
      notes: `Formulario completado y firmado: "${template.title}". Se anexaron ${newDocuments.length} documento(s) al expediente.`
    };

    // Execute Data Mappings from Stage Automations
    const currentStage = await prisma.admissionStage.findUnique({
      where: { id: application.stageId }
    });
    let stageHooks = currentStage?.hooksConfig || application.stage?.hooksConfig || {};
    if (typeof stageHooks === 'string') {
      try { stageHooks = JSON.parse(stageHooks); } catch { stageHooks = {}; }
    }

    const stageAutomations = Array.isArray(stageHooks.custom_automations)
      ? stageHooks.custom_automations
      : Array.isArray(stageHooks.automations)
        ? stageHooks.automations
        : [];

    const mappingEvents = stageAutomations.filter(evt =>
      evt &&
      evt.enabled !== false &&
      (evt.actionType === 'MAP_EXPEDIENTE_FIELDS' || Array.isArray(evt.fieldMappings)) &&
      (evt.formTemplateId === template.id || !evt.formTemplateId) &&
      Array.isArray(evt.fieldMappings) &&
      evt.fieldMappings.length > 0
    );

    const appFieldUpdates = {};
    const studentFieldUpdates = {};

    console.log(`[DATA MAPPING] Found ${mappingEvents.length} mapping event(s) for stage ${application.stageId} and form ${template.id}`);

    for (const mEvt of mappingEvents) {
      for (const mapping of mEvt.fieldMappings) {
        if (!mapping.targetExpedienteField) continue;
        
        // Extract ordered source field values
        const sourceIds = Array.isArray(mapping.sourceFormFieldIds) && mapping.sourceFormFieldIds.length > 0
          ? mapping.sourceFormFieldIds
          : mapping.formFieldId
            ? [mapping.formFieldId]
            : [];

        if (sourceIds.length === 0) continue;

        const parts = [];
        for (const sfId of sourceIds) {
          let raw;
          if (sfId.includes(':')) {
            const [baseFieldId, metaKey] = sfId.split(':');
            const fieldVal = data ? data[baseFieldId] : undefined;
            const curpVal = typeof fieldVal === 'object' && fieldVal?.curp ? fieldVal.curp : (typeof fieldVal === 'string' ? fieldVal : undefined);
            
            const metaObj = (typeof fieldVal === 'object' ? fieldVal : null) ||
              (data ? (data[`${baseFieldId}_curp_metadata`] || data[`${baseFieldId}_metadata`] || data[`${baseFieldId}_renapo`]) : null);

            if (metaObj) {
              if (metaKey === 'nombre' || metaKey === 'nombres') {
                raw = metaObj.nombre || metaObj.nombres || metaObj.firstName || metaObj.first_name;
              } else if (metaKey === 'apellidoPaterno') {
                raw = metaObj.apellidoPaterno || metaObj.paternalLastName || metaObj.apellido_paterno || metaObj.firstLastName;
              } else if (metaKey === 'apellidoMaterno') {
                raw = metaObj.apellidoMaterno || metaObj.maternalLastName || metaObj.apellido_materno || metaObj.secondLastName;
              } else if (metaKey === 'nombreCompleto') {
                raw = metaObj.nombreCompleto || metaObj.fullName || metaObj.nombre_completo || [metaObj.nombre || metaObj.nombres, metaObj.apellidoPaterno, metaObj.apellidoMaterno].filter(Boolean).join(' ');
              } else if (metaKey === 'fechaNacimientoIso' || metaKey === 'fechaNacimiento') {
                raw = metaObj.fechaNacimientoIso || metaObj.fechaNacimiento || metaObj.birthDate || metaObj.fecha_nacimiento;
              } else if (metaKey === 'sexo') {
                raw = metaObj.sexo || metaObj.gender;
              } else if (metaKey === 'estadoNacimiento') {
                raw = metaObj.estadoNacimiento || metaObj.estado || metaObj.state;
              } else if (metaKey === 'edad') {
                raw = metaObj.edad || metaObj.age;
              } else if (metaKey === 'documentoProbatorio') {
                raw = typeof metaObj.documentoProbatorio === 'object' ? JSON.stringify(metaObj.documentoProbatorio) : metaObj.documentoProbatorio;
              } else {
                raw = metaObj[metaKey];
              }
            }

            // Fallback: decode directly from CURP string if metadata not populated
            if ((raw === undefined || raw === null || raw === '') && curpVal) {
              const cleanCurp = String(curpVal).toUpperCase().trim();
              if (cleanCurp.length >= 18) {
                const yearCode = cleanCurp.substring(4, 6);
                const month = cleanCurp.substring(6, 8);
                const day = cleanCurp.substring(8, 10);
                const sexChar = cleanCurp.charAt(10);
                const stateCode = cleanCurp.substring(11, 13);
                const centuryChar = cleanCurp.charAt(16);
                const is2000s = isNaN(Number(centuryChar));
                const fullYear = is2000s ? `20${yearCode}` : `19${yearCode}`;
                
                if (metaKey === 'fechaNacimientoIso') {
                  raw = `${fullYear}-${month}-${day}`;
                } else if (metaKey === 'fechaNacimiento') {
                  raw = `${day}/${month}/${fullYear}`;
                } else if (metaKey === 'sexo') {
                  raw = sexChar === 'H' ? 'HOMBRE' : 'MUJER';
                } else if (metaKey === 'estadoNacimiento') {
                  const stateMap = {
                    'AS': 'AGUASCALIENTES', 'BC': 'BAJA CALIFORNIA', 'BS': 'BAJA CALIFORNIA SUR',
                    'CC': 'CAMPECHE', 'CL': 'COAHUILA', 'CM': 'COLIMA', 'CS': 'CHIAPAS',
                    'CH': 'CHIHUAHUA', 'DF': 'CIUDAD DE MEXICO', 'DG': 'DURANGO', 'GT': 'GUANAJUATO',
                    'GR': 'GUERRERO', 'HG': 'HIDALGO', 'JC': 'JALISCO', 'MC': 'ESTADO DE MEXICO',
                    'MN': 'MICHOACAN', 'MS': 'MORELOS', 'NT': 'NAYARIT', 'NL': 'NUEVO LEON',
                    'OC': 'OAXACA', 'PL': 'PUEBLA', 'QT': 'QUERETARO', 'QR': 'QUINTANA ROO',
                    'SP': 'SAN LUIS POTOSI', 'SL': 'SINALOA', 'SR': 'SONORA', 'TC': 'TABASCO',
                    'TS': 'TAMAULIPAS', 'TL': 'TLAXCALA', 'VZ': 'VERACRUZ', 'YN': 'YUCATAN',
                    'ZS': 'ZACATECAS', 'NE': 'NACIDO EN EL EXTRANJERO'
                  };
                  raw = stateMap[stateCode] || stateCode;
                } else if (metaKey === 'edad') {
                  const bDate = new Date(Number(fullYear), Number(month) - 1, Number(day));
                  const today = new Date();
                  let age = today.getFullYear() - bDate.getFullYear();
                  const monthDiff = today.getMonth() - bDate.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bDate.getDate())) age--;
                  raw = Math.max(0, age);
                }
              }
            }
          } else {
            const rawVal = data ? data[sfId] : undefined;
            if (rawVal !== undefined && rawVal !== null) {
              if (typeof rawVal === 'object') {
                raw = rawVal.value || rawVal.fullName || rawVal.childName || rawVal.name || (rawVal.firstName ? `${rawVal.firstName} ${rawVal.lastName || ''}`.trim() : undefined) || rawVal.curp || JSON.stringify(rawVal);
              } else {
                raw = rawVal;
              }
            }
          }

          if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
            parts.push(String(raw).trim());
          }
        }

        if (parts.length === 0) continue;
        const val = parts.join(' ');
        const target = mapping.targetExpedienteField;

        console.log(`[DATA MAPPING] ➔ Applying mapping: ${target} = "${val}"`);

        // Exact Student fields
        if (target === 'Student.fullName' || target === 'child_name' || target === 'full_name' || target === 'childName') {
          studentFieldUpdates.fullName = val;
          appFieldUpdates.childName = val;
        } else if (target === 'Student.nationalId' || target === 'national_id' || target === 'nationalId') {
          studentFieldUpdates.nationalId = val;
        } else if (target === 'Student.dateOfBirth' || target === 'birth_date' || target === 'date_of_birth' || target === 'birthDate') {
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              studentFieldUpdates.dateOfBirth = d;
              appFieldUpdates.birthDate = d;
            }
          } catch (_) {}
        } else if (target === 'Student.gender' || target === 'gender') {
          studentFieldUpdates.gender = val;
          appFieldUpdates.gender = val;
        } else if (target === 'Student.grade' || target === 'grade') {
          studentFieldUpdates.grade = val;
        } else if (target === 'Student.avatarUrl' || target === 'avatar_url' || target === 'avatarUrl') {
          studentFieldUpdates.avatarUrl = val;
        } else if (target === 'Student.idDocumentUrl' || target === 'id_document_url' || target === 'idDocumentUrl') {
          studentFieldUpdates.idDocumentUrl = val;
        } else if (target === 'Student.bloodType' || target === 'blood_type' || target === 'bloodType') {
          studentFieldUpdates.bloodType = val;
        } else if (target === 'Student.allergies' || target === 'allergies') {
          studentFieldUpdates.allergies = val;
        } else if (target === 'Student.foodAllergies' || target === 'food_allergies' || target === 'foodAllergies') {
          studentFieldUpdates.foodAllergies = val;
        } else if (target === 'Student.dietaryRestrictions' || target === 'dietary_restrictions' || target === 'dietaryRestrictions') {
          studentFieldUpdates.dietaryRestrictions = val;
        } else if (target === 'Student.medicalNotes' || target === 'medical_notes' || target === 'medicalNotes') {
          studentFieldUpdates.medicalNotes = val;
        } else if (target === 'Student.previousSchool' || target === 'previous_school' || target === 'previousSchool') {
          studentFieldUpdates.previousSchool = val;
          appFieldUpdates.previousSchool = val;
        } else if (target === 'Student.previousMethodology' || target === 'previous_methodology' || target === 'previousMethodology') {
          studentFieldUpdates.previousMethodology = val;
          appFieldUpdates.previousMethodology = val;
        } else if (target === 'Student.authorizedContacts' || target === 'authorized_contacts' || target === 'emergency_contact_1' || target === 'emergency_contact_2') {
          studentFieldUpdates.authorizedContacts = JSON.stringify([val]);
        } else if (target === 'Student.consents' || target === 'consents') {
          studentFieldUpdates.consents = JSON.stringify([val]);
        } else if (target === 'Student.internalNotes' || target === 'internal_notes' || target === 'internalNotes') {
          studentFieldUpdates.internalNotes = val;
          appFieldUpdates.internalNotes = val;
        }

        // Exact AdmissionApplication fields
        else if (target === 'AdmissionApplication.childName' || target === 'AdmissionApplication.child_name') {
          appFieldUpdates.childName = val;
          studentFieldUpdates.fullName = val;
        } else if (target === 'AdmissionApplication.childFirstName' || target === 'child_first_name' || target === 'childFirstName') {
          appFieldUpdates.childFirstName = val;
        } else if (target === 'AdmissionApplication.childLastName' || target === 'child_last_name' || target === 'childLastName') {
          appFieldUpdates.childLastName = val;
        } else if (target === 'AdmissionApplication.birthDate' || target === 'AdmissionApplication.birth_date') {
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              appFieldUpdates.birthDate = d;
              studentFieldUpdates.dateOfBirth = d;
            }
          } catch (_) {}
        } else if (target === 'AdmissionApplication.gender') {
          appFieldUpdates.gender = val;
          studentFieldUpdates.gender = val;
        } else if (target === 'AdmissionApplication.tutorName' || target === 'tutor_name' || target === 'tutorName') {
          appFieldUpdates.tutorName = val;
        } else if (target === 'AdmissionApplication.tutorRelationship' || target === 'tutor_relationship' || target === 'tutorRelationship') {
          appFieldUpdates.tutorRelationship = val;
        } else if (target === 'AdmissionApplication.tutorPhone' || target === 'tutor_phone' || target === 'tutorPhone') {
          appFieldUpdates.tutorPhone = val;
        } else if (target === 'AdmissionApplication.tutorEmail' || target === 'tutor_email' || target === 'tutorEmail') {
          appFieldUpdates.tutorEmail = val;
        } else if (target === 'AdmissionApplication.secondaryTutorName' || target === 'secondary_tutor_name' || target === 'secondaryTutorName') {
          appFieldUpdates.secondaryTutorName = val;
        } else if (target === 'AdmissionApplication.secondaryTutorPhone' || target === 'secondary_tutor_phone' || target === 'secondaryTutorPhone') {
          appFieldUpdates.secondaryTutorPhone = val;
        } else if (target === 'AdmissionApplication.address' || target === 'address') {
          appFieldUpdates.address = val;
        } else if (target === 'AdmissionApplication.previousSchool' || target === 'previous_school' || target === 'previousSchool') {
          appFieldUpdates.previousSchool = val;
        } else if (target === 'AdmissionApplication.previousMethodology' || target === 'previous_methodology' || target === 'previousMethodology') {
          appFieldUpdates.previousMethodology = val;
        } else if (target === 'AdmissionApplication.internalNotes' || target === 'internal_notes' || target === 'internalNotes') {
          appFieldUpdates.internalNotes = val;
        }
      }
    }

    // Auto-calculate full childName if first and/or last names were updated
    if ((appFieldUpdates.childFirstName || appFieldUpdates.childLastName) && !appFieldUpdates.childName) {
      const computedName = `${appFieldUpdates.childFirstName || application.childFirstName || ''} ${appFieldUpdates.childLastName || application.childLastName || ''}`.trim();
      if (computedName) {
        appFieldUpdates.childName = computedName;
        studentFieldUpdates.fullName = computedName;
      }
    }

    if (application.enrolledStudentId && Object.keys(studentFieldUpdates).length > 0) {
      try {
        await prisma.student.update({
          where: { id: application.enrolledStudentId },
          data: studentFieldUpdates
        });
      } catch (stErr) {
        console.warn('[STORAGE/MAPPING WARNING] Failed updating enrolled student record:', stErr.message);
      }
    }

    const updatedApp = await prisma.admissionApplication.update({
      where: { id: application.id },
      data: {
        ...appFieldUpdates,
        formSubmissions: updatedSubmissions,
        submittedDocuments: updatedDocs,
        history: [...currentHistory, formHistoryEntry]
      }
    });

    // Automatically book calendar slots / RSVP if schedule_event fields are included
    await processEventBookingsFromFormData(data, {
      guestName: filledByName || application.tutorName || cleanRespondentName(application),
      guestEmail: application.tutorEmail || '',
      guestPhone: application.tutorPhone || '',
      formTitle: template.title,
      studentId: application.studentId || null,
      tutorUserId: application.tutorUserId || null
    });

    // Check if all mandatory forms for this stage have been completed to notify completion
    const stageRequiredForms = Array.isArray(application.stage?.requiredForms) ? application.stage.requiredForms : [];
    const mandatoryForms = stageRequiredForms.filter(f => f.isMandatory !== false);
    const allMandatoryDone = mandatoryForms.length > 0 && mandatoryForms.every(rf =>
      updatedSubmissions.some(sub =>
        sub.formTemplateId === rf.formTemplateId &&
        (sub.status === 'SUBMITTED' || sub.status === 'APPROVED' || sub.status === 'COMPLETED')
      )
    );

    if (allMandatoryDone && application.tutorEmail) {
      try {
        await sendStageNotificationJob({
          applicationId: updatedApp.id,
          fromStageId: application.stageId,
          toStageId: null,
          transitionType: 'EXIT'
        }, prisma);
      } catch (notifyErr) {
        console.error('[ADMISSION NOTIFICATION ERROR] Error triggering stage completion notification:', notifyErr);
      }
    }

    // Fetch and aggregate poll statistics across all submissions (direct + application)
    const templatesSchema = template.schema;
    let templateRawSchema = templatesSchema;
    if (typeof templateRawSchema === 'string') {
      try { templateRawSchema = JSON.parse(templateRawSchema); } catch (e) {}
    }
    const templateSubmissions = Array.isArray(templateRawSchema?._submissions) ? templateRawSchema._submissions : [];

    const apps = await prisma.admissionApplication.findMany({
      select: { formSubmissions: true }
    });
    const appSubmissions = apps.flatMap(a => {
      const subs = Array.isArray(a.formSubmissions) ? a.formSubmissions : [];
      return subs.filter(s => s.formTemplateId === template.id);
    });

    const allSubs = [newSubmission, ...templateSubmissions, ...appSubmissions];
    const pollStats = {};
    const pollFields = templateSections.flatMap(sec => (sec.fields || []).filter(fld => fld.type === 'poll'));

    pollFields.forEach(fld => {
      if (fld.pollConfig?.showResultsAfterSubmit) {
        const opts = fld.pollConfig?.options || [];
        const counts = {};
        opts.forEach(opt => {
          counts[opt.id] = 0;
        });

        let totalVotes = 0;
        allSubs.forEach(sub => {
          const val = sub.data?.[fld.id];
          if (val) {
            if (Array.isArray(val)) {
              val.forEach(id => {
                if (counts[id] !== undefined) counts[id]++;
              });
              totalVotes += val.length;
            } else if (typeof val === 'string') {
              if (counts[val] !== undefined) {
                counts[val]++;
                totalVotes++;
              }
            }
          }
        });

        let respondentsCount = 0;
        allSubs.forEach(sub => {
          const val = sub.data?.[fld.id];
          if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
            respondentsCount++;
          }
        });

        const optionsStats = {};
        opts.forEach(opt => {
          const count = counts[opt.id] || 0;
          const divisor = fld.pollConfig?.allowMultiple ? respondentsCount : totalVotes;
          const pct = divisor > 0 ? Math.round((count / divisor) * 100) : 0;
          optionsStats[opt.id] = { count, pct };
        });

        pollStats[fld.id] = {
          totalVotes: fld.pollConfig?.allowMultiple ? respondentsCount : totalVotes,
          options: optionsStats
        };
      }
    });

    res.json({
      success: true,
      submission: newSubmission,
      formSubmissions: updatedSubmissions,
      allStageFormsCompleted: allMandatoryDone,
      pollStats
    });
  } catch (e) {
    console.error('Error submitting portal admission form:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admissions/public/portal/:token/reset-form
app.post('/api/admissions/public/portal/:token/reset-form', async (req, res) => {
  try {
    const { token } = req.params;
    const { formTemplateId } = req.body;
    if (!token || !formTemplateId) {
      return res.status(400).json({ error: 'Token y formTemplateId son requeridos' });
    }

    const application = await prisma.admissionApplication.findUnique({
      where: { portalToken: token }
    });

    if (!application) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const submissions = Array.isArray(application.formSubmissions) ? application.formSubmissions : [];
    const filtered = submissions.filter(s => s && s.formTemplateId !== formTemplateId);

    await prisma.admissionApplication.update({
      where: { id: application.id },
      data: {
        formSubmissions: filtered
      }
    });

    console.log(`[RESET FORM] Reset submission for template ${formTemplateId} in application ${application.id}`);

    res.json({
      success: true,
      message: 'Formulario reiniciado con éxito'
    });
  } catch (e) {
    console.error('Error resetting portal form:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admissions/applications/:id/dossier
app.get('/api/admissions/applications/:id/dossier', async (req, res) => {
  try {
    const application = await prisma.admissionApplication.findUnique({
      where: { id: req.params.id },
      include: {
        stage: true,
        targetEnvironment: true,
        enrolledStudent: true,
        school: true
      }
    });

    if (!application) return res.status(404).json({ error: 'Expediente no encontrado' });

    // Fetch all form templates that have submissions
    const submissions = Array.isArray(application.formSubmissions) ? application.formSubmissions : [];
    const templateIds = submissions.map(s => s.formTemplateId).filter(Boolean);
    const templates = await prisma.admissionFormTemplate.findMany({
      where: { id: { in: templateIds } }
    });

    res.json({
      application,
      submissions,
      templates
    });
  } catch (e) {
    console.error('Error fetching application dossier:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tutor/my-students', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email header or param is required' });
    }

    const tutor = await prisma.user.findUnique({
      where: { email: String(userEmail).trim().toLowerCase() }
    });

    if (!tutor) {
      return res.json([]);
    }

    const links = await prisma.studentTutor.findMany({
      where: {
        tutorUserId: tutor.id,
        student: { schoolId: req.school.id }
      },
      include: {
        student: true
      }
    });

    res.json(links.map(l => ({
      ...l.student,
      relationship: l.relationship
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FILE UPLOAD & DELETE
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folderType = req.body.folder || req.query.folder || 'gallery';
    const subFolder = folderType === 'documents' ? 'documents' : 'gallery';
    const publicUrl = `/${subFolder}/${req.file.filename}`;

    res.json({
      success: true,
      url: publicUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

app.delete('/api/file', (req, res) => {
  try {
    const fileUrl = req.body.url || req.query.url;
    if (!fileUrl || typeof fileUrl !== 'string') {
      return res.status(400).json({ error: 'File URL parameter is required' });
    }

    const normalizedUrl = path.normalize(fileUrl).replace(/\\/g, '/');
    if (!normalizedUrl.startsWith('/gallery/') && !normalizedUrl.startsWith('/documents/')) {
      return res.status(400).json({ error: 'Invalid file path for deletion' });
    }

    const relativePath = normalizedUrl.startsWith('/') ? normalizedUrl.slice(1) : normalizedUrl;
    const targetPath = path.join(publicDir, relativePath);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return res.json({ success: true, deleted: fileUrl });
    } else {
      return res.json({ success: true, message: 'File did not exist on server disk' });
    }
  } catch (err) {
    console.error('Failed to delete physical file:', err);
    res.status(500).json({ error: 'Failed to delete file from server disk' });
  }
});

// FOLDERS ENDPOINTS
app.get('/api/folders', async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { schoolId: req.school.id },
      orderBy: { createdAt: 'asc' }
    });
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/folders', async (req, res) => {
  try {
    const { title, description, titleEn, descriptionEn, accessType } = req.body;
    const folder = await prisma.folder.create({
      data: {
        schoolId: req.school.id,
        title,
        description: description || '',
        titleEn: titleEn || '',
        descriptionEn: descriptionEn || '',
        accessType: accessType || 'public'
      }
    });
    res.json(folder);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/folders/:id', async (req, res) => {
  try {
    const { title, description, titleEn, descriptionEn, accessType } = req.body;
    const folder = await prisma.folder.update({
      where: { id: req.params.id },
      data: {
        title,
        description: description || '',
        titleEn: titleEn || '',
        descriptionEn: descriptionEn || '',
        accessType: accessType || 'public'
      }
    });
    res.json(folder);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/folders/:id', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({ where: { folderId: req.params.id } });
    for (const doc of docs) {
      if (doc.fileData && (doc.fileData.startsWith('/documents/') || doc.fileData.startsWith('/gallery/'))) {
        const targetPath = path.join(publicDir, doc.fileData.slice(1));
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
      }
    }

    await prisma.folder.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DOCUMENTS ENDPOINTS
app.get('/api/documents', async (req, res) => {
  try {
    const { folderId } = req.query;
    const where = {
      schoolId: req.school.id,
      ...(folderId && { folderId: String(folderId) })
    };
    const docs = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const doc = await prisma.document.create({
      data: {
        ...req.body,
        schoolId: req.school.id
      }
    });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (doc && doc.fileData && (doc.fileData.startsWith('/documents/') || doc.fileData.startsWith('/gallery/'))) {
      const targetPath = path.join(publicDir, doc.fileData.slice(1));
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    }
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// APPLICATIONS ENDPOINTS
app.get('/api/applications', async (req, res) => {
  try {
    const apps = await prisma.application.findMany({
      where: { schoolId: req.school.id },
      include: { links: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(apps);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    const { title, description, titleEn, descriptionEn, iconUrl, links } = req.body;
    const appItem = await prisma.application.create({
      data: {
        schoolId: req.school.id,
        title,
        description: description || '',
        titleEn: titleEn || '',
        descriptionEn: descriptionEn || '',
        iconUrl: iconUrl || '',
        links: {
          create: (links || []).map(l => ({
            label: l.label,
            labelEn: l.labelEn || l.label_en || '',
            url: l.url
          }))
        }
      },
      include: { links: true }
    });
    res.json(appItem);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/applications/:id', async (req, res) => {
  try {
    const { title, description, titleEn, descriptionEn, iconUrl, links } = req.body;
    await prisma.applicationLink.deleteMany({ where: { appId: req.params.id } });
    
    const appItem = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        title,
        description: description || '',
        titleEn: titleEn || '',
        descriptionEn: descriptionEn || '',
        iconUrl: iconUrl || '',
        links: {
          create: (links || []).map(l => ({
            label: l.label,
            labelEn: l.labelEn || l.label_en || '',
            url: l.url
          }))
        }
      },
      include: { links: true }
    });
    res.json(appItem);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/applications/:id', async (req, res) => {
  try {
    await prisma.application.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GALLERY CATEGORIES & IMAGES
app.get('/api/gallery/categories', async (req, res) => {
  try {
    const categories = await prisma.galleryCategory.findMany({
      where: { schoolId: req.school.id },
      orderBy: { createdAt: 'asc' }
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/gallery/categories', async (req, res) => {
  try {
    const { id, label, labelEn } = req.body;
    const cat = await prisma.galleryCategory.create({
      data: {
        id: id.trim().toLowerCase().replace(/\s+/g, '_'),
        schoolId: req.school.id,
        label,
        labelEn: labelEn || ''
      }
    });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/gallery/categories/:id', async (req, res) => {
  try {
    const images = await prisma.galleryImage.findMany({ where: { categoryId: req.params.id } });
    for (const img of images) {
      if (img.src && (img.src.startsWith('/gallery/') || img.src.startsWith('/documents/'))) {
        const targetPath = path.join(publicDir, img.src.slice(1));
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
      }
    }
    await prisma.galleryCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/gallery/images', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const where = {
      schoolId: req.school.id,
      ...(categoryId && categoryId !== 'all' && { categoryId: String(categoryId) })
    };
    const images = await prisma.galleryImage.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/gallery/images', async (req, res) => {
  try {
    const img = await prisma.galleryImage.create({
      data: {
        ...req.body,
        schoolId: req.school.id
      }
    });
    res.json(img);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/gallery/images/:id', async (req, res) => {
  try {
    const img = await prisma.galleryImage.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(img);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/gallery/images/:id', async (req, res) => {
  try {
    const img = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
    if (img && img.src && (img.src.startsWith('/gallery/') || img.src.startsWith('/documents/'))) {
      const targetPath = path.join(publicDir, img.src.slice(1));
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    }
    await prisma.galleryImage.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GLOBAL ACCESS CODE
app.get('/api/access-code', async (req, res) => {
  try {
    const code = await prisma.globalAccessCode.findFirst({
      where: { schoolId: req.school.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(code || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/access-code', async (req, res) => {
  try {
    const { code, expiresAt } = req.body;
    const record = await prisma.globalAccessCode.create({
      data: {
        schoolId: req.school.id,
        code: code.trim().toUpperCase(),
        expiresAt: new Date(expiresAt)
      }
    });
    res.json(record);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SITE SETTINGS & SCHOOL CONFIG
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { schoolId: req.school.id }
    });
    const map = {
      school_name: req.school.name || '',
      school_tagline: req.school.legalName || '',
      school_logo: req.school.logoUrl || '',
      brand_primary_color: req.school.primaryColor || '#1b3b2b',
      brand_secondary_color: req.school.accentColor || '#10b981',
      brand_accent_color: req.school.accentColor || '#f59e0b',
      school_currency: req.school.currency || 'MXN',
      school_currency_symbol: req.school.currencySymbol || '$',
      school_timezone: req.school.timezone || 'America/Cancun',
      school_country: req.school.country || 'México',
      school_province: req.school.province || '',
      school_city: req.school.city || '',
      school_address: req.school.address || '',
      contact_phone: req.school.phone || '',
      contact_email: req.school.email || '',
    };
    settings.forEach(s => { map[s.key] = s.value; });
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await prisma.siteSetting.upsert({
        where: {
          schoolId_key: {
            schoolId: req.school.id,
            key
          }
        },
        update: { value: String(value) },
        create: {
          schoolId: req.school.id,
          key,
          value: String(value)
        }
      });
    }

    // Sync to school model if school regional fields are updated
    const schoolUpdates = {};
    if (req.body.school_name) schoolUpdates.name = String(req.body.school_name);
    if (req.body.school_logo) schoolUpdates.logoUrl = String(req.body.school_logo);
    if (req.body.brand_primary_color) schoolUpdates.primaryColor = String(req.body.brand_primary_color);
    if (req.body.brand_accent_color) schoolUpdates.accentColor = String(req.body.brand_accent_color);
    if (req.body.school_currency) schoolUpdates.currency = String(req.body.school_currency);
    if (req.body.school_currency_symbol) schoolUpdates.currencySymbol = String(req.body.school_currency_symbol);
    if (req.body.school_timezone) schoolUpdates.timezone = String(req.body.school_timezone);
    if (req.body.school_country) schoolUpdates.country = String(req.body.school_country);
    if (req.body.school_province) schoolUpdates.province = String(req.body.school_province);
    if (req.body.school_city) schoolUpdates.city = String(req.body.school_city);
    if (req.body.school_address) schoolUpdates.address = String(req.body.school_address);
    if (req.body.contact_phone) schoolUpdates.phone = String(req.body.contact_phone);
    if (req.body.contact_email) schoolUpdates.email = String(req.body.contact_email);
    if (req.body.consent_templates !== undefined) {
      schoolUpdates.consentTemplates = typeof req.body.consent_templates === 'string'
        ? req.body.consent_templates
        : JSON.stringify(req.body.consent_templates);
    }

    if (Object.keys(schoolUpdates).length > 0) {
      await prisma.school.update({
        where: { id: req.school.id },
        data: schoolUpdates
      });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/settings/fetch-ai-models - Dynamic models listing for any OpenAI-compatible provider
app.post('/api/settings/fetch-ai-models', async (req, res) => {
  try {
    const { baseUrl = 'https://api.openai.com/v1', apiKey } = req.body;
    let keyToUse = (apiKey || '').trim();

    if (!keyToUse) {
      const setting = await prisma.siteSetting.findFirst({
        where: {
          schoolId: req.school?.id,
          key: { in: ['ai_api_key', 'openai_api_key', 'OPENAI_API_KEY', 'openai_key'] }
        }
      });
      keyToUse = setting?.value?.trim() || (process.env.OPENAI_API_KEY || '').trim();
    }

    if (!keyToUse) {
      return res.status(400).json({
        success: false,
        error: 'Ingresa una API Key para consultar los modelos disponibles en el proveedor.'
      });
    }

    let cleanBaseUrl = (baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
    cleanBaseUrl = cleanBaseUrl.replace(/\/models$/, '').replace(/\/chat\/completions$/, '');
    const modelsUrl = `${cleanBaseUrl}/models`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keyToUse}`,
        'x-goog-api-key': keyToUse
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      let parsedMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedMsg = parsed.error?.message || parsed.message || (typeof parsed.error === 'string' ? parsed.error : errText);
      } catch {}
      return res.status(400).json({
        success: false,
        error: `Error al consultar modelos (${response.status}): ${parsedMsg}`
      });
    }

    const data = await response.json();
    const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data.models) ? data.models : (Array.isArray(data) ? data : []));
    
    // Normalize into array of model IDs/names and strip Google 'models/' prefix
    const models = rawList
      .map(m => {
        const rawId = typeof m === 'string' ? m : (m.id || m.name || '');
        return rawId.replace(/^models\//, '').trim();
      })
      .filter(Boolean)
      .filter((m, idx, arr) => arr.indexOf(m) === idx)
      .sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      count: models.length,
      models,
      raw: rawList
    });
  } catch (err) {
    console.error('Error fetching AI models:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al conectar con el endpoint de modelos.' });
  }
});

// POST /api/settings/test-openai (OpenAI-compatible connection test)
app.post('/api/settings/test-openai', async (req, res) => {
  try {
    const { baseUrl = 'https://api.openai.com/v1', apiKey, model = 'gpt-4o-mini' } = req.body;
    let keyToUse = (apiKey || '').trim();

    if (!keyToUse) {
      const setting = await prisma.siteSetting.findFirst({
        where: {
          schoolId: req.school?.id,
          key: { in: ['ai_api_key', 'openai_api_key', 'OPENAI_API_KEY', 'openai_key', 'system_openai_api_key'] }
        }
      });
      keyToUse = setting?.value?.trim() || (process.env.OPENAI_API_KEY || '').trim();
    }

    if (!keyToUse) {
      return res.status(400).json({
        success: false,
        error: 'No se ha ingresado una API Key para probar la conexión'
      });
    }

    let cleanBaseUrl = (baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
    cleanBaseUrl = cleanBaseUrl.replace(/\/models$/, '').replace(/\/chat\/completions$/, '');
    const chatUrl = `${cleanBaseUrl}/chat/completions`;

    // Clean model string and strip 'models/' prefix if present
    let cleanModel = (model || '').trim().replace(/^models\//, '');
    if (!cleanModel) {
      cleanModel = /gemini|google/i.test(cleanBaseUrl) ? 'gemini-2.0-flash' : 'gpt-4o-mini';
    }

    // Image-only models cannot be used with /chat/completions directly
    const isImageOnly = /dall-e|imagen|flux|stable-diffusion|midjourney/i.test(cleanModel);
    if (isImageOnly) {
      cleanModel = /gemini|google/i.test(cleanBaseUrl) ? 'gemini-2.0-flash' : 'gpt-4o-mini';
    }

    const isReasoning = /o[134]|deepseek-reasoner|r1/i.test(cleanModel);

    async function sendChatProbe(useMaxCompletionTokens) {
      const bodyPayload = {
        model: cleanModel,
        messages: [{ role: 'user', content: 'Ping. Responde con OK.' }]
      };

      if (useMaxCompletionTokens) {
        bodyPayload.max_completion_tokens = 50;
      } else {
        bodyPayload.max_tokens = 50;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const resp = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${keyToUse}`,
            'x-goog-api-key': keyToUse
          },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return resp;
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    }

    let testResponse = await sendChatProbe(isReasoning);

    // Auto-retry if provider returned error regarding max_tokens or max_completion_tokens
    if (!testResponse.ok) {
      const errText = await testResponse.text();
      if (/max_completion_tokens/i.test(errText) && !isReasoning) {
        testResponse = await sendChatProbe(true);
      } else if (/max_tokens/i.test(errText) && isReasoning) {
        testResponse = await sendChatProbe(false);
      } else {
        let parsedMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          parsedMsg = parsed.error?.message || parsed.message || (typeof parsed.error === 'string' ? parsed.error : errText);
        } catch {}
        return res.status(400).json({
          success: false,
          error: `Error del proveedor AI (${testResponse.status}): ${parsedMsg}`
        });
      }
    }

    if (!testResponse.ok) {
      const errText = await testResponse.text();
      let parsedMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedMsg = parsed.error?.message || parsed.message || (typeof parsed.error === 'string' ? parsed.error : errText);
      } catch {}
      return res.status(400).json({
        success: false,
        error: `Error del proveedor AI (${testResponse.status}): ${parsedMsg}`
      });
    }

    const testData = await testResponse.json();
    const reply = testData.choices?.[0]?.message?.content || 'OK';

    res.json({
      success: true,
      message: `¡Conexión exitosa con el proveedor AI! Modelo verificado: ${testData.model || cleanModel}.`,
      reply: typeof reply === 'string' ? reply.trim() : JSON.stringify(reply)
    });
  } catch (err) {
    console.error('Error testing AI connection:', err);
    res.status(500).json({ success: false, error: err.message || 'Error de conexión con el proveedor AI.' });
  }
});

// POST /api/settings/test-smtp - Test SMTP connection & send test email
app.post('/api/settings/test-smtp', async (req, res) => {
  try {
    const { host, port, user, pass, secure, fromName, fromEmail, testEmail } = req.body;

    if (!host || !user || !pass || !testEmail) {
      return res.status(400).json({ error: 'Faltan campos requeridos: host, usuario, contraseña o correo de prueba.' });
    }

    const isSecure = secure === true || secure === 'true' || parseInt(port, 10) === 465;
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || '587', 10),
      secure: isSecure,
      auth: { user, pass }
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"${fromName || req.school?.name || 'Servidor SMTP'}" <${fromEmail || user}>`,
      to: testEmail,
      subject: 'Prueba de Conexión SMTP Exitosa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h3 style="color: #15803d; margin-top: 0;">✓ Conexión SMTP Configurada Correctamente</h3>
          <p>Este es un correo de prueba generado desde el panel de administración para validar la configuración de tu servidor de correo saliente.</p>
          <ul style="color: #4b5563; font-size: 13px;">
            <li><strong>Host:</strong> ${host}</li>
            <li><strong>Puerto:</strong> ${port}</li>
            <li><strong>Seguridad:</strong> ${isSecure ? 'SSL/TLS' : 'STARTTLS'}</li>
            <li><strong>Usuario:</strong> ${user}</li>
          </ul>
        </div>
      `
    });

    res.json({ success: true, message: `Conexión exitosa. Correo de prueba enviado a ${testEmail}.` });
  } catch (e) {
    console.error('SMTP test failed:', e);
    res.status(400).json({ error: `Fallo de conexión SMTP: ${e.message}` });
  }
});

// POST /api/settings/test-storage - Test S3 / MinIO / Local storage connection & permissions
app.post('/api/settings/test-storage', async (req, res) => {
  try {
    const { driver, localRoot, s3Endpoint, s3Region, s3Bucket, s3AccessKeyId, s3SecretAccessKey, s3ForcePathStyle } = req.body;
    const result = await testStorageConfig({
      driver,
      localRoot,
      s3Endpoint,
      s3Region,
      s3Bucket,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3ForcePathStyle
    });
    res.json(result);
  } catch (e) {
    console.error('Storage test failed:', e);
    res.status(400).json({ error: e.message });
  }
});

// POST /api/settings/test-storage-webhook - Test external storage webhook delivery (n8n, make.com)
app.post('/api/settings/test-storage-webhook', async (req, res) => {
  try {
    const { webhookUrl, secretToken, includePayload } = req.body;
    const result = await testStorageWebhookConfig({
      webhookUrl,
      secretToken,
      includePayload: includePayload !== false
    });
    res.json(result);
  } catch (e) {
    console.error('Storage webhook test failed:', e);
    res.status(400).json({ error: e.message });
  }
});

// POST /api/settings/test-calendar-webhook - Test external calendar & booking webhook delivery
app.post('/api/settings/test-calendar-webhook', async (req, res) => {
  try {
    const { webhookUrl, secretToken, eventType = 'calendar.event_created' } = req.body;
    if (!webhookUrl || !webhookUrl.trim()) {
      return res.status(400).json({ error: 'Se requiere una URL válida de webhook' });
    }

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      schoolId: req.school?.id || 'ceiba_school_id',
      data: {
        id: 'evt_test_demo_101',
        title: 'Visita Guiada y Open House (Prueba)',
        description: 'Evento de prueba emitido desde la configuración del sistema Ceiba Roots',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        location: 'Campus Ceiba / Auditorio Principal',
        booking: {
          id: 'bkg_sample_789',
          parentName: 'Familia Morales Méndez',
          parentEmail: 'fam.morales@ejemplo.com',
          parentPhone: '+52 998 555 1234',
          status: 'CONFIRMED',
          numGuests: 3
        }
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'CeibaRoots-Webhook/1.0',
      'X-Ceiba-Event': eventType
    };

    if (secretToken && secretToken.trim()) {
      headers['Authorization'] = `Bearer ${secretToken.trim()}`;
      headers['X-Ceiba-Secret'] = secretToken.trim();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return res.status(400).json({
        success: false,
        error: `El receptor del webhook respondió con status ${response.status}: ${errText.slice(0, 200)}`
      });
    }

    res.json({
      success: true,
      message: `Webhook de prueba de calendario entregado exitosamente (${response.status} ${response.statusText})`,
      payloadSample: payload
    });
  } catch (e) {
    console.error('Calendar webhook test failed:', e);
    res.status(400).json({ error: e.message || 'Error al conectar con la URL del webhook de calendario' });
  }
});

// Helper: Dispatch Calendar Webhook Notifications in background
async function emitCalendarWebhookNotification({ schoolId, eventType, data, prisma }) {
  try {
    if (!prisma) return;
    const settingsList = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'calendar_webhook_enabled',
            'calendar_webhook_url',
            'calendar_webhook_secret',
            'calendar_webhook_event_created',
            'calendar_webhook_event_updated',
            'calendar_webhook_event_deleted',
            'calendar_webhook_booking_created',
            'calendar_webhook_booking_cancelled'
          ]
        }
      }
    });

    const settingsMap = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const isEnabled = settingsMap['calendar_webhook_enabled'] === 'true' || settingsMap['calendar_webhook_enabled'] === true;
    const webhookUrl = settingsMap['calendar_webhook_url'];
    if (!isEnabled || !webhookUrl || !webhookUrl.trim()) return;

    // Check specific event type toggle
    const eventKeyMap = {
      'calendar.event_created': 'calendar_webhook_event_created',
      'calendar.event_updated': 'calendar_webhook_event_updated',
      'calendar.event_deleted': 'calendar_webhook_event_deleted',
      'calendar.booking_created': 'calendar_webhook_booking_created',
      'calendar.booking_cancelled': 'calendar_webhook_booking_cancelled'
    };

    const specificKey = eventKeyMap[eventType];
    if (specificKey && settingsMap[specificKey] === 'false') {
      return; // Event type disabled
    }

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      schoolId: schoolId || 'default',
      data
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'CeibaRoots-Webhook/1.0',
      'X-Ceiba-Event': eventType
    };

    const secret = settingsMap['calendar_webhook_secret'];
    if (secret && secret.trim()) {
      headers['Authorization'] = `Bearer ${secret.trim()}`;
      headers['X-Ceiba-Secret'] = secret.trim();
    }

    fetch(webhookUrl.trim(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    }).catch((err) => {
      console.warn(`[CalendarWebhook] Failed to deliver ${eventType} to ${webhookUrl}:`, err.message);
    });
  } catch (err) {
    console.error('[CalendarWebhook] Error in emitCalendarWebhookNotification:', err);
  }
}

// GET /api/storage/stream - Secure stream for private documents & form assets
app.get('/api/storage/stream', async (req, res) => {
  try {
    const filePath = req.query.file;
    if (!filePath) {
      return res.status(400).json({ error: 'Parámetro "file" requerido' });
    }

    // Tenant isolation: if school context is available, pass it
    const schoolId = req.school?.id || null;
    await streamPrivateAsset({ schoolId, relativePath: String(filePath), req, res, prisma });
  } catch (e) {
    console.error('Error streaming private asset:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al acceder al archivo privado' });
    }
  }
});

// GET /api/admissions/applications/:id/export-zip - Download complete private application dossier as ZIP
app.get('/api/admissions/applications/:id/export-zip', async (req, res) => {
  try {
    const application = await prisma.admissionApplication.findUnique({
      where: { id: req.params.id }
    });

    if (!application) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verify school tenancy
    if (req.school && application.schoolId !== req.school.id) {
      return res.status(403).json({ error: 'No tienes autorización para exportar este expediente' });
    }

    await exportAdmissionZip({
      schoolId: application.schoolId,
      applicationId: application.id,
      childName: application.childName || 'Aspirante',
      res,
      prisma
    });
  } catch (e) {
    console.error('Error exporting admission dossier zip:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar archivo ZIP del expediente' });
    }
  }
});

// CONSENT TEMPLATES API (MULTI-TENANT PER SCHOOL)
const DEFAULT_CONSENT_TEMPLATES = [
  {
    id: 'consent_media_socials',
    title: 'Uso de Imagen y Fotografía en Redes Sociales & Web',
    category: 'media',
    description: 'Autorización para capturar y publicar fotografías y videos del rostro del alumno en redes sociales institucionales, página web y materiales informativos del colegio.',
    isRequired: false
  },
  {
    id: 'consent_trips_excursions',
    title: 'Salidas Pedagógicas y Excursiones Locales',
    category: 'trips',
    description: 'Autorización para que el alumno participe en visitas guiadas, paseos de campo, museos y actividades educativas fuera del plantel escolar.',
    isRequired: false
  },
  {
    id: 'consent_first_aid_emergency',
    title: 'Atención de Primeros Auxilios y Traslado de Emergencia Médica',
    category: 'medical',
    description: 'Autorización al personal certificado del colegio para brindar primeros auxilios y, en caso de urgencia médica grave, coordinar el traslado al centro hospitalario designado.',
    isRequired: true
  },
  {
    id: 'consent_outdoors_nature',
    title: 'Actividades al Aire Libre, Huerto y Naturaleza',
    category: 'outdoors',
    description: 'Participación en dinámicas de educación cósmica en el huerto escolar, granja, compostaje y actividades al aire libre supervisadas.',
    isRequired: false
  }
];

app.get('/api/consent-templates', async (req, res) => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.school.id },
      select: { consentTemplates: true }
    });

    let templates = [];
    if (school?.consentTemplates && school.consentTemplates.trim() !== '' && school.consentTemplates !== '[]') {
      try {
        templates = JSON.parse(school.consentTemplates);
      } catch {
        templates = DEFAULT_CONSENT_TEMPLATES;
      }
    } else {
      templates = DEFAULT_CONSENT_TEMPLATES;
    }

    res.json(templates);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/consent-templates', async (req, res) => {
  try {
    const { templates } = req.body;
    const jsonString = Array.isArray(templates) ? JSON.stringify(templates) : String(templates || '[]');

    await prisma.school.update({
      where: { id: req.school.id },
      data: { consentTemplates: jsonString }
    });

    res.json({ success: true, templates: Array.isArray(templates) ? templates : JSON.parse(jsonString) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ALLERGIES CATALOGUE API (MULTI-TENANT)
// ==========================================
const DEFAULT_ALLERGIES_CATALOGUE = [
  {
    id: 'allergy_egg',
    name: 'Huevo',
    nameEn: 'Egg',
    category: 'food',
    severity: 'moderate',
    description: 'Alergia a proteínas de clara o yema de huevo presentes en alimentos, pastas o repostería.',
    descriptionEn: 'Allergy to egg white or yolk proteins in foods, pasta, or baked goods.',
    emergencyAction: 'Verificar ingredientes en colaciones escolares. Administrar antihistamínico indicado si hay erupción cutánea.',
    isDefault: true
  },
  {
    id: 'allergy_fish',
    name: 'Pescado',
    nameEn: 'Fish',
    category: 'food',
    severity: 'severe',
    description: 'Reacción alérgica a proteínas de pescados de agua dulce o salada (atún, salmón, bacalao, trucha).',
    descriptionEn: 'Allergic reaction to freshwater or saltwater fish proteins (tuna, salmon, cod, trout).',
    emergencyAction: 'Evitar ingesta y contacto cruzado. Si presenta hinchazón facial o dificultad respiratoria, llamar a emergencias médicas.',
    isDefault: true
  },
  {
    id: 'allergy_beef',
    name: 'Carne de Res / Vacuno',
    nameEn: 'Beef',
    category: 'food',
    severity: 'moderate',
    description: 'Alergia o sensibilidad a proteínas de carne vacuna, caldos de res o derivados bovinos (alergia alfa-gal).',
    descriptionEn: 'Allergy or sensitivity to beef proteins, beef broths, or bovine derivatives (alpha-gal allergy).',
    emergencyAction: 'Excluir carne de res del menú del alumno. Monitorear síntomas digestivos o cutáneos.',
    isDefault: true
  },
  {
    id: 'allergy_pork',
    name: 'Carne de Cerdo',
    nameEn: 'Pork',
    category: 'food',
    severity: 'moderate',
    description: 'Reacción alérgica a proteínas de carne porcina, embutidos o jamón de cerdo.',
    descriptionEn: 'Allergic reaction to pork meat proteins, sausages, or ham.',
    emergencyAction: 'Sustituir por proteínas autorizadas por la familia. Observar si se presentan molestias gástricas o urticaria.',
    isDefault: true
  },
  {
    id: 'allergy_shellfish',
    name: 'Mariscos y Crustáceos',
    nameEn: 'Shellfish',
    category: 'food',
    severity: 'severe',
    description: 'Alergia severa a crustáceos (camarón, langosta, cangrejo) y moluscos (pulpo, calamar, mejillones). Alto riesgo de anafilaxia.',
    descriptionEn: 'Severe allergy to crustaceans (shrimp, lobster, crab) and mollusks (octopus, squid, mussels). High risk of anaphylaxis.',
    emergencyAction: 'Contacto cero. Ante signos de inflamación labial o faríngea, suministrar epinefrina y llamar a emergencias.',
    isDefault: true
  },
  {
    id: 'allergy_dairy',
    name: 'Leche y Lácteos (APLV / Lactosa)',
    nameEn: 'Milk & Dairy',
    category: 'food',
    severity: 'moderate',
    description: 'Alergia a la proteína de leche de vaca (caseína / suero) o intolerancia a derivados lácteos (queso, mantequilla, yogurt).',
    descriptionEn: 'Cow milk protein allergy or intolerance to dairy derivatives (cheese, butter, yogurt).',
    emergencyAction: 'Sustituir por bebidas vegetales y alimentos 100% libres de lácteos. Monitorear signos de vómito o cólico.',
    isDefault: true
  },
  {
    id: 'allergy_berries',
    name: 'Frutos Rojos / Berries',
    nameEn: 'Berries / Red Fruits',
    category: 'food',
    severity: 'moderate',
    description: 'Reacción alérgica o sensibilidad a fresas, frambuesas, moras, arándanos o cerezas.',
    descriptionEn: 'Allergic reaction or sensitivity to strawberries, raspberries, blackberries, blueberries, or cherries.',
    emergencyAction: 'Evitar postres, mermeladas o jugos que contengan frutos rojos. Aplicar tratamiento tópico o antihistamínico prescrito.',
    isDefault: true
  },
  {
    id: 'allergy_sugar',
    name: 'Azúcar Refinada / Edulcorantes',
    nameEn: 'Refined Sugar',
    category: 'food',
    severity: 'mild',
    description: 'Intolerancia severa o restricción alimentaria a azúcares refinados, sacarosa o edulcorantes artificiales procesados.',
    descriptionEn: 'Severe intolerance or dietary restriction to refined sugars, sucrose, or processed artificial sweeteners.',
    emergencyAction: 'Ofrecer opciones endulzadas naturalmente con fruta o sin azúcares añadidos según indicación de la familia.',
    isDefault: true
  },
  {
    id: 'allergy_gluten',
    name: 'Gluten / Celiaquía',
    nameEn: 'Gluten / Celiac',
    category: 'food',
    severity: 'moderate',
    description: 'Reacción autoinmune (enfermedad celíaca) o alergia al gluten presente en trigo, cebada, centeno y avena no certificada.',
    descriptionEn: 'Autoimmune reaction (celiac disease) or allergy to gluten found in wheat, barley, rye, and non-certified oats.',
    emergencyAction: 'Alimentación 100% libre de gluten. No compartir recipientes ni utensilios con harinas de trigo.',
    isDefault: true
  },
  {
    id: 'allergy_corn',
    name: 'Maíz y Derivados',
    nameEn: 'Corn',
    category: 'food',
    severity: 'moderate',
    description: 'Alergia a proteínas de maíz, jarabe de maíz de alta fructosa o almidón de maíz en alimentos procesados.',
    descriptionEn: 'Allergy to corn proteins, high-fructose corn syrup, or corn starch in processed foods.',
    emergencyAction: 'Verificar etiquetas de snacks e ingredientes en el comedor. Proveer colaciones alternativas seguras.',
    isDefault: true
  },
  {
    id: 'allergy_peanuts',
    name: 'Cacahuates / Maní',
    nameEn: 'Peanuts',
    category: 'food',
    severity: 'severe',
    description: 'Alergia severa a cacahuates/maní. Riesgo alto de anafilaxia incluso por contacto con trazas o polvo ambiental.',
    descriptionEn: 'Severe peanut allergy. High risk of anaphylaxis from ingestion or trace exposure.',
    emergencyAction: 'Protocolo de anafilaxia inmediato. Evitar contacto y administrar autoinyector de epinefrina (EpiPen) si está prescrito.',
    isDefault: true
  },
  {
    id: 'allergy_sesame',
    name: 'Ajonjolí / Sésamo',
    nameEn: 'Sesame',
    category: 'food',
    severity: 'severe',
    description: 'Alergia a semillas de ajonjolí/sésamo, aceite de sésamo, tahini o panes con cobertura de semillas.',
    descriptionEn: 'Allergy to sesame seeds, sesame oil, tahini, or breads with seed toppings.',
    emergencyAction: 'Evitar panes con semillas y comidas orientales. Administrar medicamento prescrito ante síntomas orales o respiratorios.',
    isDefault: true
  },
  {
    id: 'allergy_soy',
    name: 'Soya / Soja',
    nameEn: 'Soy',
    category: 'food',
    severity: 'moderate',
    description: 'Reacción alérgica a proteínas de soya, leche de soya, tofu, salsa de soya y lecitina de soya.',
    descriptionEn: 'Allergic reaction to soy proteins, soy milk, tofu, soy sauce, and soy lecithin.',
    emergencyAction: 'Revisar productos procesados que contengan lecitina o proteína de soya aislada.',
    isDefault: true
  },
  {
    id: 'allergy_tree_nut',
    name: 'Nueces de Árbol / Frutos Secos',
    nameEn: 'Tree Nuts',
    category: 'food',
    severity: 'severe',
    description: 'Alergia a almendras, nueces de nogal, avellanas, nueces de la India (anacardos), pistaches y nueces pecanas.',
    descriptionEn: 'Allergy to almonds, walnuts, hazelnuts, cashews, pistachios, and pecans.',
    emergencyAction: 'Contacto cero con frutos secos. Ante inflamación labial o faríngea, suministrar epinefrina y llamar a emergencias.',
    isDefault: true
  },
  {
    id: 'allergy_wheat',
    name: 'Trigo y Harinas',
    nameEn: 'Wheat',
    category: 'food',
    severity: 'moderate',
    description: 'Alergia a proteínas del grano de trigo, provocando síntomas cutáneos o respiratorios por ingesta o polvo de harina.',
    descriptionEn: 'Allergy to wheat grain proteins, causing cutaneous or respiratory symptoms from ingestion or flour dust.',
    emergencyAction: 'Sustituir por harinas de arroz, avena certificada o maíz según tolerancia del menor.',
    isDefault: true
  },
  {
    id: 'allergy_date',
    name: 'Dátil / Frutos Desecados',
    nameEn: 'Dates',
    category: 'food',
    severity: 'mild',
    description: 'Sensibilidad o alergia a dátiles, frutas desecadas o sulfitos conservadores utilizados en frutos secos dulces.',
    descriptionEn: 'Sensitivity or allergy to dates, dried fruits, or preservative sulfites used in dried fruits.',
    emergencyAction: 'Excluir dátiles de barritas energéticas y meriendas escolares.',
    isDefault: true
  },
  {
    id: 'allergy_topical_substances',
    name: 'Sustancias Tópicas / Cremas',
    nameEn: 'Topical Substances / Creams',
    category: 'other',
    severity: 'mild',
    description: 'Dermatitis de contacto alérgica ante pomadas, lociones perfumadas, pomadas antibióticas o cremas de uso cutáneo.',
    descriptionEn: 'Allergic contact dermatitis to ointments, scented lotions, antibiotic creams, or topical skin products.',
    emergencyAction: 'Lavar inmediatamente el área con abundante agua y jabón neutro. No aplicar cremas sin previa consulta médica.',
    isDefault: true
  },
  {
    id: 'allergy_baby_wipes',
    name: 'Toallitas Húmedas / Fragancias',
    nameEn: 'Baby Wipes / Fragrances',
    category: 'other',
    severity: 'mild',
    description: 'Reacción alérgica a conservadores (isotiazolinonas, parabenos) o perfumes presentes en toallitas húmedas desechables.',
    descriptionEn: 'Allergic reaction to preservatives (isothiazolinones, parabens) or perfumes in disposable baby wipes.',
    emergencyAction: 'Usar únicamente agua tibia y algodón o toallitas 99% agua sin perfume durante el cambio de pañal e higiene.',
    isDefault: true
  },
  {
    id: 'allergy_mosquito_repellent',
    name: 'Repelente de Mosquitos / DEET',
    nameEn: 'Mosquito Repellent / DEET',
    category: 'other',
    severity: 'moderate',
    description: 'Alergia cutánea o respiratoria a componentes químicos de repelentes de insectos (DEET, Icaridina o fragancias sintéticas).',
    descriptionEn: 'Cutaneous or respiratory allergy to chemical components in insect repellents (DEET, Picaridin, or synthetic fragrances).',
    emergencyAction: 'Prohibir aplicación de repelentes químicos comerciales. Usar mosquiteros, ropa protectora o lociones botánicas autorizadas.',
    isDefault: true
  },
  {
    id: 'allergy_sun_block',
    name: 'Protector Solar / Bloqueador',
    nameEn: 'Sun Block / Sunscreen',
    category: 'other',
    severity: 'mild',
    description: 'Dermatitis por contacto o fotosensibilidad a filtros solares químicos (oxibenzona, avobenzona u octocrileno).',
    descriptionEn: 'Contact dermatitis or photosensitivity to chemical sunscreen filters (oxybenzone, avobenzone, or octocrylene).',
    emergencyAction: 'Utilizar exclusivamente protectores solares minerales hipoalergénicos (óxido de zinc / dióxido de titanio) provistos por la familia.',
    isDefault: true
  },
  {
    id: 'allergy_naproxen',
    name: 'Naproxeno / AINEs',
    nameEn: 'Naproxen / NSAIDs',
    category: 'medication',
    severity: 'severe',
    description: 'Alergia medicamentosa a naproxeno, ibuprofeno, ácido acetilsalicílico u otros fármacos antiinflamatorios no esteroideos.',
    descriptionEn: 'Drug allergy to naproxen, ibuprofen, aspirin, or other non-steroidal anti-inflammatory drugs.',
    emergencyAction: 'Prohibida cualquier administración de analgésicos o antiinflamatorios sin prescripción médica expresa.',
    isDefault: true
  },
  {
    id: 'allergy_dust_mites',
    name: 'Ácaros del Polvo',
    nameEn: 'Dust Mites',
    category: 'environmental',
    severity: 'moderate',
    description: 'Alergia respiratoria a heces y proteínas de ácaros presentes en alfombras, cojines, muñecos de peluche y telas.',
    descriptionEn: 'Respiratory allergy to dust mite proteins found in rugs, cushions, plush toys, and fabrics.',
    emergencyAction: 'Mantener tapetes y materiales textiles limpios y ventilados. Higiene nasal salina y antihistamínico según receta médica.',
    isDefault: true
  },
  {
    id: 'allergy_insect_bites',
    name: 'Piquetes de Insectos',
    nameEn: 'Insect Bites & Stings',
    category: 'insects',
    severity: 'severe',
    description: 'Reacción hiperalérgica local o sistémica a picaduras de mosquitos, tábanos, hormigas rojas, abejas o avispas.',
    descriptionEn: 'Hyperallergic local or systemic reaction to mosquito, horsefly, fire ant, bee, or wasp stings.',
    emergencyAction: 'Lavar la zona, aplicar compresa fría. Si presenta hinchazón desmedida, dificultad para respirar o urticaria generalizada, activar protocolo de urgencia.',
    isDefault: true
  },
  {
    id: 'allergy_seasonal',
    name: 'Alergias Estacionales / Polen',
    nameEn: 'Seasonal Allergies / Pollen',
    category: 'environmental',
    severity: 'mild',
    description: 'Rinitis alérgica y conjuntivitis provocada por polen de árboles, malezas, pasto y cambios de clima estacionales.',
    descriptionEn: 'Allergic rhinitis and conjunctivitis triggered by tree, weed, or grass pollen and seasonal weather transitions.',
    emergencyAction: 'Limpieza ocular y nasal con suero fisiológico. Evitar permanencia prolongada al aire libre en días con conteo alto de polen.',
    isDefault: true
  }
];

app.get('/api/allergies', async (req, res) => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: {
        schoolId_key: {
          schoolId: req.school.id,
          key: 'allergies_catalogue'
        }
      }
    });

    let catalogue = DEFAULT_ALLERGIES_CATALOGUE;
    if (setting?.value && setting.value.trim() !== '' && setting.value !== '[]') {
      try {
        const stored = JSON.parse(setting.value);
        if (Array.isArray(stored) && stored.length >= DEFAULT_ALLERGIES_CATALOGUE.length) {
          catalogue = stored;
        } else if (Array.isArray(stored)) {
          const existingIds = new Set(stored.map(s => s.id));
          const missing = DEFAULT_ALLERGIES_CATALOGUE.filter(d => !existingIds.has(d.id));
          catalogue = [...stored, ...missing];
        }
      } catch {
        catalogue = DEFAULT_ALLERGIES_CATALOGUE;
      }
    }
    res.json(catalogue);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/allergies', async (req, res) => {
  try {
    const { allergies } = req.body;
    const jsonString = Array.isArray(allergies) ? JSON.stringify(allergies) : String(allergies || '[]');

    await prisma.siteSetting.upsert({
      where: {
        schoolId_key: {
          schoolId: req.school.id,
          key: 'allergies_catalogue'
        }
      },
      update: { value: jsonString },
      create: {
        schoolId: req.school.id,
        key: 'allergies_catalogue',
        value: jsonString
      }
    });

    res.json({ success: true, allergies: Array.isArray(allergies) ? allergies : JSON.parse(jsonString) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ASSESSMENT SCALES / EVALUATORS API
// ==========================================
const DEFAULT_ASSESSMENT_SCALES = [
  {
    id: 'scale_presented',
    code: 'PRESENTED',
    name: 'Presentado',
    nameEn: 'Presented',
    shortCode: 'P',
    color: '#f59e0b', // Amber
    icon: 'Sparkles',
    description: 'La lección o material ha sido introducido formalmente al infante por la guía.',
    descriptionEn: 'The lesson or material has been formally introduced to the child by the guide.',
    order: 1,
    isDefault: true
  },
  {
    id: 'scale_practicing',
    code: 'PRACTICING',
    name: 'En Práctica',
    nameEn: 'Practicing',
    shortCode: 'EP',
    color: '#ea580c', // Orange
    icon: 'PlayCircle',
    description: 'El alumno trabaja libremente y con regularidad con el material en su período de trabajo.',
    descriptionEn: 'The child works freely and regularly with the material during work periods.',
    order: 2,
    isDefault: true
  },
  {
    id: 'scale_mastered',
    code: 'MASTERED',
    name: 'Dominado',
    nameEn: 'Mastered',
    shortCode: 'D',
    color: '#10b981', // Emerald
    icon: 'CheckCircle2',
    description: 'El infante demuestra comprensión profunda, precisión técnica y autonomía completa con el material.',
    descriptionEn: 'The child demonstrates deep understanding, accuracy, and full autonomy with the material.',
    order: 3,
    isDefault: true
  },
  {
    id: 'scale_needs_review',
    code: 'NEEDS_REVIEW',
    name: 'Refuerzo',
    nameEn: 'Review',
    shortCode: 'R',
    color: '#0284c7', // Sky blue
    icon: 'RotateCcw',
    description: 'Requiere re-presentación, asistencia guiada o acompañamiento para consolidar el concepto.',
    descriptionEn: 'Requires re-presentation, guided support, or repetition to consolidate mastery.',
    order: 4,
    isDefault: true
  }
];

app.get('/api/assessment-scales', async (req, res) => {
  try {
    const scalesSetting = await prisma.siteSetting.findUnique({
      where: {
        schoolId_key: {
          schoolId: req.school.id,
          key: 'assessment_scales'
        }
      }
    });

    const modeSetting = await prisma.siteSetting.findUnique({
      where: {
        schoolId_key: {
          schoolId: req.school.id,
          key: 'assessment_display_mode'
        }
      }
    });

    let scales = DEFAULT_ASSESSMENT_SCALES;
    if (scalesSetting?.value && scalesSetting.value.trim() !== '' && scalesSetting.value !== '[]') {
      try {
        scales = JSON.parse(scalesSetting.value);
      } catch {
        scales = DEFAULT_ASSESSMENT_SCALES;
      }
    }

    const displayMode = modeSetting?.value || 'circles';

    res.json({
      scales,
      displayMode
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/assessment-scales', async (req, res) => {
  try {
    const { scales, displayMode } = req.body;
    
    if (scales !== undefined) {
      const jsonString = Array.isArray(scales) ? JSON.stringify(scales) : String(scales || '[]');
      await prisma.siteSetting.upsert({
        where: {
          schoolId_key: {
            schoolId: req.school.id,
            key: 'assessment_scales'
          }
        },
        update: { value: jsonString },
        create: {
          schoolId: req.school.id,
          key: 'assessment_scales',
          value: jsonString
        }
      });
    }

    if (displayMode !== undefined && String(displayMode).trim() !== '') {
      await prisma.siteSetting.upsert({
        where: {
          schoolId_key: {
            schoolId: req.school.id,
            key: 'assessment_display_mode'
          }
        },
        update: { value: String(displayMode) },
        create: {
          schoolId: req.school.id,
          key: 'assessment_display_mode',
          value: String(displayMode)
        }
      });
    }

    const modeSetting = await prisma.siteSetting.findUnique({
      where: {
        schoolId_key: {
          schoolId: req.school.id,
          key: 'assessment_display_mode'
        }
      }
    });

    res.json({
      success: true,
      scales: Array.isArray(scales) ? scales : DEFAULT_ASSESSMENT_SCALES,
      displayMode: modeSetting?.value || displayMode || 'circles'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// GUIDES (DOCENTES / MAESTRAS) RBAC API
// ==========================================
app.get('/api/guides', async (req, res) => {
  try {
    const guides = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            schoolId: req.school.id,
            role: { in: ['TEACHER', 'STAFF'] }
          }
        }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        jobTitle: true,
        staffRole: true,
        certifications: true,
        practiceStartYear: true,
        yearsOfExperience: true,
        bio: true,
        socialLinkedin: true,
        socialX: true,
        socialFacebook: true,
        socialInstagram: true,
        socialTiktok: true,
        socialYoutube: true,
        supervisors: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            staffRole: true,
            jobTitle: true
          }
        },
        memberships: {
          where: { schoolId: req.school.id },
          select: { role: true }
        },
        assignedEnvironments: {
          include: {
            environment: {
              select: { id: true, name: true, stage: true, color: true }
            }
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    const formatted = guides.map(g => ({
      id: g.id,
      email: g.email,
      fullName: g.fullName || g.email,
      avatarUrl: g.avatarUrl || '',
      phone: g.phone || '',
      jobTitle: g.jobTitle || '',
      staffRole: g.staffRole || 'LEAD_GUIDE',
      certifications: g.certifications || '',
      practiceStartYear: g.practiceStartYear || null,
      yearsOfExperience: g.yearsOfExperience || (g.practiceStartYear ? Math.max(0, new Date().getFullYear() - g.practiceStartYear) : 0),
      bio: g.bio || '',
      socialLinkedin: g.socialLinkedin || '',
      socialX: g.socialX || '',
      socialFacebook: g.socialFacebook || '',
      socialInstagram: g.socialInstagram || '',
      socialTiktok: g.socialTiktok || '',
      socialYoutube: g.socialYoutube || '',
      supervisors: g.supervisors || [],
      supervisorId: g.supervisors?.[0]?.id || null,
      supervisor: g.supervisors?.[0] || null,
      role: g.memberships[0]?.role || 'TEACHER',
      environments: g.assignedEnvironments.map(ae => ({
        id: ae.environment.id,
        name: ae.environment.name,
        stage: ae.environment.stage,
        color: ae.environment.color,
        isLead: ae.isLead
      }))
    }));

    res.json(formatted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reloaded after prisma generate
app.post('/api/guides', async (req, res) => {
  try {
    const { 
      email, 
      fullName, 
      phone, 
      avatarUrl, 
      jobTitle, 
      staffRole = 'LEAD_GUIDE', 
      certifications, 
      practiceStartYear,
      yearsOfExperience, 
      bio, 
      rfc,
      curp,
      socialLinkedin,
      socialX,
      socialFacebook,
      socialInstagram,
      socialTiktok,
      socialYoutube,
      supervisorId,
      supervisorIds,
      password = 'ceiba123', 
      environmentIds = [], 
      role = 'TEACHER' 
    } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const calculatedExp = practiceStartYear 
      ? Math.max(0, new Date().getFullYear() - Number(practiceStartYear))
      : (yearsOfExperience ? Number(yearsOfExperience) : 0);

    const resolvedSupervisorIds = Array.isArray(supervisorIds)
      ? supervisorIds
      : (supervisorId ? [supervisorId] : []);

    const passwordHash = hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        jobTitle: jobTitle !== undefined ? jobTitle : undefined,
        staffRole: staffRole !== undefined ? staffRole : undefined,
        certifications: certifications !== undefined ? certifications : undefined,
        practiceStartYear: practiceStartYear !== undefined ? (practiceStartYear ? Number(practiceStartYear) : null) : undefined,
        yearsOfExperience: calculatedExp,
        bio: bio !== undefined ? bio : undefined,
        rfc: rfc !== undefined ? rfc : undefined,
        curp: curp !== undefined ? curp : undefined,
        socialLinkedin: socialLinkedin !== undefined ? socialLinkedin : undefined,
        socialX: socialX !== undefined ? socialX : undefined,
        socialFacebook: socialFacebook !== undefined ? socialFacebook : undefined,
        socialInstagram: socialInstagram !== undefined ? socialInstagram : undefined,
        socialTiktok: socialTiktok !== undefined ? socialTiktok : undefined,
        socialYoutube: socialYoutube !== undefined ? socialYoutube : undefined,
        supervisors: {
          set: resolvedSupervisorIds.map(id => ({ id }))
        }
      },
      create: {
        email: email.toLowerCase().trim(),
        fullName: fullName || email.split('@')[0],
        phone: phone || '',
        avatarUrl: avatarUrl || '',
        jobTitle: jobTitle || '',
        staffRole: staffRole || 'LEAD_GUIDE',
        certifications: certifications || '',
        practiceStartYear: practiceStartYear ? Number(practiceStartYear) : null,
        yearsOfExperience: calculatedExp,
        bio: bio || '',
        rfc: rfc || '',
        curp: curp || '',
        socialLinkedin: socialLinkedin || '',
        socialX: socialX || '',
        socialFacebook: socialFacebook || '',
        socialInstagram: socialInstagram || '',
        socialTiktok: socialTiktok || '',
        socialYoutube: socialYoutube || '',
        supervisors: {
          connect: resolvedSupervisorIds.map(id => ({ id }))
        },
        passwordHash
      }
    });

    // Add membership
    await prisma.schoolMembership.upsert({
      where: {
        userId_schoolId: {
          userId: user.id,
          schoolId: req.school.id
        }
      },
      update: { role: role === 'STAFF' ? 'STAFF' : 'TEACHER' },
      create: {
        userId: user.id,
        schoolId: req.school.id,
        role: role === 'STAFF' ? 'STAFF' : 'TEACHER'
      }
    });

    // Assign environments
    if (Array.isArray(environmentIds)) {
      // Clear previous in this school
      const schoolEnvIds = (await prisma.environment.findMany({
        where: { schoolId: req.school.id },
        select: { id: true }
      })).map(e => e.id);

      await prisma.environmentGuide.deleteMany({
        where: {
          userId: user.id,
          environmentId: { in: schoolEnvIds }
        }
      });

      for (const envId of environmentIds) {
        await prisma.environmentGuide.create({
          data: {
            userId: user.id,
            environmentId: envId,
            isLead: staffRole === 'LEAD_GUIDE'
          }
        });
      }
    }

    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/guides/:id', async (req, res) => {
  try {
    const { 
      email,
      fullName, 
      phone, 
      avatarUrl, 
      jobTitle, 
      staffRole, 
      certifications, 
      practiceStartYear,
      yearsOfExperience, 
      bio, 
      rfc,
      curp,
      socialLinkedin,
      socialX,
      socialFacebook,
      socialInstagram,
      socialTiktok,
      socialYoutube,
      supervisorId,
      supervisorIds,
      role, 
      environmentIds 
    } = req.body;
    const userId = req.params.id;

    if (email !== undefined) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: userId }
        }
      });
      if (existing) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado por otro usuario' });
      }
    }

    const calculatedExp = practiceStartYear !== undefined 
      ? (practiceStartYear ? Math.max(0, new Date().getFullYear() - Number(practiceStartYear)) : 0)
      : (yearsOfExperience !== undefined ? Number(yearsOfExperience) : undefined);

    const resolvedSupervisorIds = Array.isArray(supervisorIds)
      ? supervisorIds
      : (supervisorId !== undefined ? (supervisorId ? [supervisorId] : []) : undefined);

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: email !== undefined ? email.toLowerCase().trim() : undefined,
        fullName: fullName !== undefined ? fullName : undefined,
        phone: phone !== undefined ? phone : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        jobTitle: jobTitle !== undefined ? jobTitle : undefined,
        staffRole: staffRole !== undefined ? staffRole : undefined,
        certifications: certifications !== undefined ? certifications : undefined,
        practiceStartYear: practiceStartYear !== undefined ? (practiceStartYear ? Number(practiceStartYear) : null) : undefined,
        yearsOfExperience: calculatedExp,
        bio: bio !== undefined ? bio : undefined,
        rfc: rfc !== undefined ? rfc : undefined,
        curp: curp !== undefined ? curp : undefined,
        socialLinkedin: socialLinkedin !== undefined ? socialLinkedin : undefined,
        socialX: socialX !== undefined ? socialX : undefined,
        socialFacebook: socialFacebook !== undefined ? socialFacebook : undefined,
        socialInstagram: socialInstagram !== undefined ? socialInstagram : undefined,
        socialTiktok: socialTiktok !== undefined ? socialTiktok : undefined,
        socialYoutube: socialYoutube !== undefined ? socialYoutube : undefined,
        supervisors: resolvedSupervisorIds !== undefined ? {
          set: resolvedSupervisorIds.map(id => ({ id }))
        } : undefined,
      }
    });

    if (role) {
      await prisma.schoolMembership.updateMany({
        where: { userId, schoolId: req.school.id },
        data: { role: role === 'STAFF' ? 'STAFF' : 'TEACHER' }
      });
    }

    if (Array.isArray(environmentIds)) {
      const schoolEnvIds = (await prisma.environment.findMany({
        where: { schoolId: req.school.id },
        select: { id: true }
      })).map(e => e.id);

      await prisma.environmentGuide.deleteMany({
        where: {
          userId,
          environmentId: { in: schoolEnvIds }
        }
      });

      for (const envId of environmentIds) {
        await prisma.environmentGuide.create({
          data: {
            userId,
            environmentId: envId,
            isLead: true
          }
        });
      }
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all documents for a guide
app.get('/api/guides/:id/documents', async (req, res) => {
  try {
    const userId = req.params.id;
    const docs = await prisma.userDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add a document for a guide
app.post('/api/guides/:id/documents', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, fileUrl, fileType, fileSize } = req.body;
    if (!name || !fileUrl) {
      return res.status(400).json({ error: 'Nombre y URL de archivo requeridos' });
    }
    const doc = await prisma.userDocument.create({
      data: {
        userId,
        name: name.trim(),
        fileUrl,
        fileType: fileType || '',
        fileSize: fileSize ? Number(fileSize) : 0
      }
    });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a document for a guide
app.delete('/api/guides/:id/documents/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await prisma.userDocument.findUnique({
      where: { id: docId }
    });

    if (doc && doc.url) {
      const cleanPath = doc.url.replace(/^\//, '');
      const absolutePath = path.join(publicDir, cleanPath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await prisma.userDocument.delete({
      where: { id: docId }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/guides/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    // Remove membership from this school
    await prisma.schoolMembership.deleteMany({
      where: { userId, schoolId: req.school.id }
    });

    const schoolEnvIds = (await prisma.environment.findMany({
      where: { schoolId: req.school.id },
      select: { id: true }
    })).map(e => e.id);

    await prisma.environmentGuide.deleteMany({
      where: {
        userId,
        environmentId: { in: schoolEnvIds }
      }
    });

    // Delete all their documents from database
    await prisma.userDocument.deleteMany({
      where: { userId }
    });

    // Delete their dynamic folder from disk
    const employeeDir = path.join(documentsDir, 'rrhh', userId);
    if (fs.existsSync(employeeDir)) {
      fs.rmSync(employeeDir, { recursive: true, force: true });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// MONTESSORI SCOPE & SEQUENCE (CURRÍCULUM) API
// ==========================================
const DEFAULT_MONTESSORI_AREAS = [
  {
    name: 'Vida Práctica',
    slug: 'vida-practica',
    color: '#059669',
    icon: 'HandHelping',
    description: 'Desarrollo de la coordinación motriz, autonomía, concentración, cuidado del entorno y gracia y cortesía.',
    sortOrder: 1,
    categories: [
      {
        name: 'Cuidado de la Persona',
        description: 'Independencia física y aseo personal.',
        sortOrder: 1,
        lessons: [
          { name: 'Lavado de Manos', pedagogicalPurpose: 'Desarrolla el orden secuencial, la higiene autónoma y el control de movimientos finos.', minAgeYears: 2, maxAgeYears: 6 },
          { name: 'Abrochar y Desabrochar Botones (Bastidores)', pedagogicalPurpose: 'Coordinación bimanual y fortalecimiento del agarre en pinza para vestir independiente.', minAgeYears: 2.5, maxAgeYears: 5 },
          { name: 'Limpieza y Lustrado de Zapatos', pedagogicalPurpose: 'Secuenciación lógica de pasos y satisfacción por el cuidado de las pertenencias.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'Peinarse y Uso del Espejo', pedagogicalPurpose: 'Conciencia del esquema corporal y cuidado de la imagen personal.', minAgeYears: 2, maxAgeYears: 5 }
        ]
      },
      {
        name: 'Cuidado del Ambiente',
        description: 'Responsabilidad comunitaria y preservación del espacio de trabajo.',
        sortOrder: 2,
        lessons: [
          { name: 'Barrer y Recoger con Recogedor', pedagogicalPurpose: 'Coordinación óculo-manual gruesa y mantenimiento del orden colectivo.', minAgeYears: 2.5, maxAgeYears: 6 },
          { name: 'Lavar la Mesa con Esponja y Jabón', pedagogicalPurpose: 'Atención prolongada en secuencias largas y control de fuerza y agua.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'Arreglo Floral y Cuidado de Plantas', pedagogicalPurpose: 'Sensibilidad estética, aprecio por la naturaleza y motricidad delicada.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'Doblar Paños y Servilletas', pedagogicalPurpose: 'Discriminación geométrica básica (mitades, diagonales) y motricidad fina.', minAgeYears: 2.5, maxAgeYears: 5 }
        ]
      },
      {
        name: 'Control de Movimiento y Gracia y Cortesía',
        description: 'Convivencia armónica, refinamiento motor y autorregulación.',
        sortOrder: 3,
        lessons: [
          { name: 'Trasvasar Semillas con Cuchara / Pinzas', pedagogicalPurpose: 'Control del movimiento de muñeca y preparación indirecta para la escritura.', minAgeYears: 2, maxAgeYears: 4 },
          { name: 'Verter Líquidos de Jarra a Jarra', pedagogicalPurpose: 'Estimación de volumen, pulso y autocorrección instantánea de errores.', minAgeYears: 2.5, maxAgeYears: 5 },
          { name: 'Caminar sobre la Línea', pedagogicalPurpose: 'Equilibrio, control postural y ritmo corporal.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'El Juego del Silencio', pedagogicalPurpose: 'Autorregulación emocional, escucha activa profunda y serenidad comunitaria.', minAgeYears: 3, maxAgeYears: 12 }
        ]
      }
    ]
  },
  {
    name: 'Sensorial',
    slug: 'sensorial',
    color: '#c86d51',
    icon: 'Shapes',
    description: 'Refinamiento de las percepciones visuales, táctiles, auditivas, gustativas y cromáticas del mundo.',
    sortOrder: 2,
    categories: [
      {
        name: 'Sentido Visual (Dimensión y Gradación)',
        description: 'Discriminación tridimensional, tamaño, grosor y longitud.',
        sortOrder: 1,
        lessons: [
          { name: 'La Torre Rosa', pedagogicalPurpose: 'Discriminación visual del volumen tridimensional (1cm³ a 10cm³) y base intuitiva del sistema decimal.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'La Escalera Marrón', pedagogicalPurpose: 'Discriminación del grosor bidimensional manteniendo la longitud constante.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'Los Cilindros con Botón', pedagogicalPurpose: 'Exploración de altura y diámetro combinado con el agarre de pinza para el lápiz.', minAgeYears: 2.5, maxAgeYears: 5 },
          { name: 'Las Barras Rojas de Longitud', pedagogicalPurpose: 'Comprensión visual lineal de la longitud de 10 cm a 1 metro.', minAgeYears: 3, maxAgeYears: 6 }
        ]
      },
      {
        name: 'Sentido Cromático y Geométrico',
        description: 'Educación del color, formas planas y volúmenes geométricos.',
        sortOrder: 2,
        lessons: [
          { name: 'Cajas de Colores (I, II y III)', pedagogicalPurpose: 'Gradación fina de matices y discriminación cromática avanzada.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'Gabinete Geométrico', pedagogicalPurpose: 'Reconocimiento táctil y visual de polígonos regulares e irregulares.', minAgeYears: 3.5, maxAgeYears: 7 },
          { name: 'Sólidos Geométricos', pedagogicalPurpose: 'Reconocimiento táctil y visual de esferas, cubos, prismas y pirámides.', minAgeYears: 3.5, maxAgeYears: 6 },
          { name: 'Triángulos Constructores', pedagogicalPurpose: 'Descubrimiento sensorial de cómo los triángulos forman todas las figuras planas.', minAgeYears: 4, maxAgeYears: 8 }
        ]
      },
      {
        name: 'Sentido Táctil, Auditivo y Olfativo',
        description: 'Educación de los sentidos estereognóstico, térmico, auditivo y olfativo.',
        sortOrder: 3,
        lessons: [
          { name: 'Tablas y Telas de Lija', pedagogicalPurpose: 'Sensibilidad táctil en las yemas de los dedos (rugoso vs liso).', minAgeYears: 3, maxAgeYears: 5 },
          { name: 'Cilindros de Sonido', pedagogicalPurpose: 'Discriminación auditiva fina y emparejamiento de intensidades.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'Campanas Montessori', pedagogicalPurpose: 'Afinación del oído musical, reconocimiento de escalas y tonos.', minAgeYears: 3.5, maxAgeYears: 9 },
          { name: 'Frascos de Olores y Sabores', pedagogicalPurpose: 'Enriquecimiento sensorial olfativo y gustativo con elementos botánicos.', minAgeYears: 3, maxAgeYears: 6 }
        ]
      }
    ]
  },
  {
    name: 'Lenguaje',
    slug: 'lenguaje',
    color: '#d97706',
    icon: 'BookOpen',
    description: 'Enriquecimiento del vocabulario oral, fonética táctil, composición escrita y comprensión lectora.',
    sortOrder: 3,
    categories: [
      {
        name: 'Lenguaje Oral y Preparación a la Escritura',
        description: 'Conciencia fonológica y control motriz del trazo.',
        sortOrder: 1,
        lessons: [
          { name: 'Tarjetas de Nomenclatura Clasificadas', pedagogicalPurpose: 'Ampliación precisa del vocabulario y categorización mental del mundo.', minAgeYears: 2.5, maxAgeYears: 6 },
          { name: 'Los Resaques Metálicos', pedagogicalPurpose: 'Flexibilidad de muñeca, precisión del trazo y preparación muscular para escribir.', minAgeYears: 3.5, maxAgeYears: 6 },
          { name: 'Las Letras de Lija', pedagogicalPurpose: 'Asociación multisensorial (táctil, visual, auditiva) del símbolo gráfico y su fonema.', minAgeYears: 3.5, maxAgeYears: 6 }
        ]
      },
      {
        name: 'Construcción de Palabras y Lectura',
        description: 'Escritura previa a la lectura mediante el análisis fonético.',
        sortOrder: 2,
        lessons: [
          { name: 'El Alfabeto Móvil', pedagogicalPurpose: 'Permite al niño escribir y componer palabras antes de dominar el lápiz sobre papel.', minAgeYears: 4, maxAgeYears: 7 },
          { name: 'Caja Fonética de Objetos', pedagogicalPurpose: 'Lectura de primeras palabras reales relacionando objeto concreto con tarjeta escrita.', minAgeYears: 4.5, maxAgeYears: 7 },
          { name: 'Libritos de Lectura Gradual', pedagogicalPurpose: 'Fluidez lectora progresiva con historias de la vida real.', minAgeYears: 5, maxAgeYears: 8 }
        ]
      },
      {
        name: 'Gramática y Análisis Sintáctico',
        description: 'Comprensión estructural del idioma a través de símbolos tangibles.',
        sortOrder: 3,
        lessons: [
          { name: 'Símbolos Gramaticales de Madera (Sustantivo, Verbo, Adjetivo)', pedagogicalPurpose: 'Comprensión intuitiva y visual de las funciones de cada palabra en la oración.', minAgeYears: 5, maxAgeYears: 9 },
          { name: 'Cajas Gramaticales', pedagogicalPurpose: 'Experimentación activa con el papel del artículo, adjetivo, preposición y conjunción.', minAgeYears: 6, maxAgeYears: 10 }
        ]
      }
    ]
  },
  {
    name: 'Matemáticas',
    slug: 'matematicas',
    color: '#1b3b2b',
    icon: 'Calculator',
    description: 'De lo concreto a lo abstracto: conteo 1-10, sistema decimal, operaciones bancarias y memorización.',
    sortOrder: 4,
    categories: [
      {
        name: 'Iniciación al Conteo (1 al 10)',
        description: 'Asociación de cantidad concreta con símbolo numérico.',
        sortOrder: 1,
        lessons: [
          { name: 'Las Barras Numéricas', pedagogicalPurpose: 'Comprensión de la cantidad como una unidad continua divisible del 1 al 10.', minAgeYears: 3.5, maxAgeYears: 6 },
          { name: 'Números de Lija', pedagogicalPurpose: 'Reconocimiento táctil y visual de los símbolos numéricos del 0 al 9.', minAgeYears: 3.5, maxAgeYears: 6 },
          { name: 'Las Cajas de Husos', pedagogicalPurpose: 'Concepto de cantidades separadas y comprensión fundamental del valor del cero.', minAgeYears: 4, maxAgeYears: 6 },
          { name: 'Números y Fichas', pedagogicalPurpose: 'Comprobación de la secuencia numérica y comprensión intuitiva de pares e impares.', minAgeYears: 4, maxAgeYears: 6 }
        ]
      },
      {
        name: 'Sistema Decimal y Operaciones (Perlas Doradas)',
        description: 'Jerarquía decimal: unidades, decenas, centenas y millares.',
        sortOrder: 2,
        lessons: [
          { name: 'Presentación del Sistema Decimal con Perlas', pedagogicalPurpose: 'Percepción sensorial del peso y volumen de 1 unidad, 1 decena, 1 centena y 1 millar.', minAgeYears: 4, maxAgeYears: 7 },
          { name: 'Formación de Números Grandes con Tarjetas y Perlas', pedagogicalPurpose: 'Lectura y composición de cifras de 4 dígitos conectando símbolo con cantidad concreta.', minAgeYears: 4.5, maxAgeYears: 8 },
          { name: 'Operaciones con el Banco (Suma y Multiplicación)', pedagogicalPurpose: 'Realización de operaciones matemáticas de 4 dígitos mediante manipulación física.', minAgeYears: 5, maxAgeYears: 9 },
          { name: 'Juego de Estampillas', pedagogicalPurpose: 'Transición hacia una mayor abstracción matemática de las cuatro operaciones.', minAgeYears: 5.5, maxAgeYears: 9 }
        ]
      },
      {
        name: 'Conteo Continuo y Memorización',
        description: 'Tablas de Seguin, cadenas de perlas y tablas de memorización.',
        sortOrder: 3,
        lessons: [
          { name: 'Tablas de Seguin (11-19 y decenas)', pedagogicalPurpose: 'Comprensión de la composición decimal de los números del 11 al 99.', minAgeYears: 4.5, maxAgeYears: 7 },
          { name: 'Cadenas de Perlas (Cuadrados y Cubos)', pedagogicalPurpose: 'Conteo salteado, preparación para la multiplicación y visualización de potencias.', minAgeYears: 5, maxAgeYears: 9 },
          { name: 'Tableros de Dedos para la Suma, Resta y Multiplicación', pedagogicalPurpose: 'Internalización y memorización natural de las tablas matemáticas.', minAgeYears: 5.5, maxAgeYears: 9 }
        ]
      }
    ]
  },
  {
    name: 'Estudios Cósmicos & Ciencias',
    slug: 'estudios-cosmicos',
    color: '#581c87',
    icon: 'Globe',
    description: 'Educación cósmica: geografía, botánica, zoología, física e historia del universo.',
    sortOrder: 5,
    categories: [
      {
        name: 'Geografía y Tierra',
        description: 'Ubicación en el cosmos, continentes, formas de agua y tierra.',
        sortOrder: 1,
        lessons: [
          { name: 'Globos Terráqueos (Lija y Continentes Coloreados)', pedagogicalPurpose: 'Diferenciación sensorial de tierra/agua y visión global del planeta.', minAgeYears: 3, maxAgeYears: 6 },
          { name: 'Mapas Puzzle de Continentes y Países', pedagogicalPurpose: 'Coordinación visoespacial y reconocimiento geopolítico del planeta.', minAgeYears: 3.5, maxAgeYears: 9 },
          { name: 'Formas de Tierra y Agua (Isla, Lago, Península, Golfo)', pedagogicalPurpose: 'Construcción y modelado tangible de accidentes geográficos.', minAgeYears: 4, maxAgeYears: 8 }
        ]
      },
      {
        name: 'Biología, Botánica y Zoología',
        description: 'Aprecio por el reino vegetal y animal, ciclos de vida y anatomía.',
        sortOrder: 2,
        lessons: [
          { name: 'Gabinete de Botánica (Formas de Hojas)', pedagogicalPurpose: 'Clasificación morfológica de las hojas y enriquecimiento del lenguaje científico.', minAgeYears: 4, maxAgeYears: 8 },
          { name: 'Puzzles de Zoología (Vertebrados)', pedagogicalPurpose: 'Partes anatómicas de mamíferos, aves, reptiles, anfibios y peces.', minAgeYears: 3.5, maxAgeYears: 7 },
          { name: 'Ciclos de Vida (Mariposa, Rana, Planta)', pedagogicalPurpose: 'Comprensión secuencial del tiempo biológico y metamorfosis natural.', minAgeYears: 4, maxAgeYears: 8 }
        ]
      }
    ]
  }
];

// Helper to ensure default curriculum exists
async function ensureMontessoriCurriculumSeeded(schoolId) {
  const existingCount = await prisma.montessoriArea.count({
    where: { OR: [{ schoolId }, { schoolId: null }] }
  });

  if (existingCount > 0) return;

  console.log('🌱 Seeding Montessori Scope & Sequence Curriculum...');
  for (const areaData of DEFAULT_MONTESSORI_AREAS) {
    const area = await prisma.montessoriArea.create({
      data: {
        schoolId,
        name: areaData.name,
        slug: areaData.slug,
        color: areaData.color,
        icon: areaData.icon,
        description: areaData.description,
        sortOrder: areaData.sortOrder
      }
    });

    for (const catData of areaData.categories) {
      const cat = await prisma.montessoriCategory.create({
        data: {
          areaId: area.id,
          name: catData.name,
          description: catData.description,
          sortOrder: catData.sortOrder
        }
      });

      for (const lesData of catData.lessons) {
        await prisma.montessoriLesson.create({
          data: {
            categoryId: cat.id,
            name: lesData.name,
            pedagogicalPurpose: lesData.pedagogicalPurpose,
            minAgeYears: lesData.minAgeYears,
            maxAgeYears: lesData.maxAgeYears
          }
        });
      }
    }
  }
  console.log('✅ Montessori Scope & Sequence Curriculum Seeded successfully!');
}

app.get('/api/montessori/curriculum', async (req, res) => {
  try {
    await ensureMontessoriCurriculumSeeded(req.school.id);

    const areas = await prisma.montessoriArea.findMany({
      where: { schoolId: req.school.id },
      include: {
        categories: {
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json(areas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE / UPDATE MONTESSORI LESSON (FICHA DE TRABAJO)
app.post('/api/montessori/lessons', async (req, res) => {
  try {
    const { id, categoryId, name, pedagogicalPurpose, parentInfo, mediaAssets, description, minAgeYears, maxAgeYears, sortOrder } = req.body;
    if (!name || !categoryId) {
      return res.status(400).json({ error: 'Nombre y categoría requeridos' });
    }

    const mediaAssetsStr = Array.isArray(mediaAssets) ? JSON.stringify(mediaAssets) : (typeof mediaAssets === 'string' ? mediaAssets : '[]');

    let lesson;
    if (id) {
      lesson = await prisma.montessoriLesson.update({
        where: { id },
        data: {
          categoryId,
          name,
          pedagogicalPurpose: pedagogicalPurpose || '',
          parentInfo: parentInfo || '',
          mediaAssets: mediaAssetsStr,
          description: description || '',
          minAgeYears: minAgeYears ? parseFloat(minAgeYears) : null,
          maxAgeYears: maxAgeYears ? parseFloat(maxAgeYears) : null,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        }
      });
    } else {
      lesson = await prisma.montessoriLesson.create({
        data: {
          categoryId,
          name,
          pedagogicalPurpose: pedagogicalPurpose || '',
          parentInfo: parentInfo || '',
          mediaAssets: mediaAssetsStr,
          description: description || '',
          minAgeYears: minAgeYears ? parseFloat(minAgeYears) : null,
          maxAgeYears: maxAgeYears ? parseFloat(maxAgeYears) : null,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
        }
      });
    }
    res.json(lesson);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/montessori/lessons/:id', async (req, res) => {
  try {
    await prisma.montessoriLesson.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE / UPDATE CATEGORY
app.post('/api/montessori/categories', async (req, res) => {
  try {
    const { id, areaId, name, description, sortOrder } = req.body;
    if (!name || !areaId) {
      return res.status(400).json({ error: 'Nombre y área requeridos' });
    }

    let category;
    if (id) {
      category = await prisma.montessoriCategory.update({
        where: { id },
        data: {
          areaId,
          name,
          description: description || '',
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        }
      });
    } else {
      category = await prisma.montessoriCategory.create({
        data: {
          areaId,
          name,
          description: description || '',
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
        }
      });
    }
    res.json(category);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Student Progress in Montessori Lessons
app.get('/api/montessori/progress', async (req, res) => {
  try {
    const { studentId, environmentId } = req.query;
    const where = {
      student: {
        schoolId: req.school.id,
        ...(environmentId ? { environmentId: String(environmentId) } : {})
      },
      ...(studentId ? { studentId: String(studentId) } : {})
    };

    const records = await prisma.studentLessonProgress.findMany({
      where,
      include: {
        lesson: {
          include: {
            category: {
              include: { area: true }
            }
          }
        }
      }
    });
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/montessori/progress', async (req, res) => {
  try {
    const { studentId, lessonId, status, notes, presentedAt, masteredAt } = req.body;
    if (!studentId || !lessonId || !status) {
      return res.status(400).json({ error: 'studentId, lessonId y status requeridos' });
    }

    const record = await prisma.studentLessonProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId
        }
      },
      update: {
        status,
        notes: notes !== undefined ? notes : undefined,
        presentedAt: presentedAt ? new Date(presentedAt) : (status === 'PRESENTED' ? new Date() : undefined),
        masteredAt: masteredAt ? new Date(masteredAt) : (status === 'MASTERED' ? new Date() : undefined)
      },
      create: {
        studentId,
        lessonId,
        status,
        notes: notes || '',
        presentedAt: presentedAt ? new Date(presentedAt) : new Date(),
        masteredAt: status === 'MASTERED' ? new Date() : null
      }
    });

    res.json(record);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Observations Journal
app.get('/api/montessori/observations', async (req, res) => {
  try {
    const { studentId } = req.query;
    const where = { schoolId: req.school.id };
    if (studentId) where.studentId = String(studentId);

    const obs = await prisma.studentObservation.findMany({
      where,
      include: {
        student: {
          select: { id: true, fullName: true, avatarUrl: true, grade: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(obs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/montessori/observations', async (req, res) => {
  try {
    const { studentId, content, photoUrl, isPublic = false, guideUserId } = req.body;
    if (!studentId || !content) return res.status(400).json({ error: 'studentId y content son requeridos' });

    const obs = await prisma.studentObservation.create({
      data: {
        schoolId: req.school.id,
        studentId,
        content,
        photoUrl: photoUrl || '',
        isPublic: Boolean(isPublic),
        guideUserId: guideUserId || 'guide_auto'
      }
    });
    res.json(obs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Attendance API
app.get('/api/montessori/attendance', async (req, res) => {
  try {
    const { environmentId, date } = req.query;
    const targetDate = date ? new Date(String(date)) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const attendances = await prisma.studentAttendance.findMany({
      where: {
        date: targetDate,
        student: {
          schoolId: req.school.id,
          environmentId: environmentId ? String(environmentId) : undefined
        }
      },
      include: {
        student: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    });

    res.json(attendances);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/montessori/attendance', async (req, res) => {
  try {
    const { date, records } = req.body; // records: Array<{ studentId, status, note }>
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    if (!Array.isArray(records)) return res.status(400).json({ error: 'records array requerido' });

    const results = [];
    for (const r of records) {
      const att = await prisma.studentAttendance.upsert({
        where: {
          studentId_date: {
            studentId: r.studentId,
            date: targetDate
          }
        },
        update: {
          status: r.status,
          note: r.note || ''
        },
        create: {
          studentId: r.studentId,
          date: targetDate,
          status: r.status,
          note: r.note || ''
        }
      });
      results.push(att);
    }

    res.json({ success: true, count: results.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// TRACKERS & DAILY CARE LOGS CONFIGURATION
// ==========================================

const DEFAULT_TRACKER_CATEGORIES = [
  {
    name: 'Accidentes & Incidentes',
    nameEn: 'Accidents',
    slug: 'accidents',
    icon: 'AlertTriangle',
    color: '#ef4444',
    description: 'Registro de incidentes físicos, caídas, golpes o situaciones extraordinarias de salud.',
    subcategories: [
      {
        name: 'Accidentes / Golpes',
        nameEn: 'Accidentes',
        description: 'Registro de caídas, raspones o incidentes físicos en el ambiente escolar',
        items: [
          { name: 'Mordedura', nameEn: 'Bitten', icon: 'AlertTriangle' },
          { name: 'Sangrado', nameEn: 'Bleeding', icon: 'Droplet' },
          { name: 'Golpe / Chichón', nameEn: 'Bump', icon: 'ShieldAlert' },
          { name: 'Cortada', nameEn: 'Cut', icon: 'Scissors' },
          { name: 'Caída', nameEn: 'Fall', icon: 'Activity' },
          { name: 'Lesión en la Cabeza', nameEn: 'Head Injury', icon: 'AlertCircle' },
          { name: 'Otro tipo de incidente', nameEn: 'Other', icon: 'HelpCircle' },
          { name: 'Raspón / Escoriación', nameEn: 'Scrape', icon: 'Bandage' },
          { name: 'Picadura de insecto', nameEn: 'Sting', icon: 'Bug' },
          { name: 'Sin respuesta / Desmayo', nameEn: 'Unresponsive', icon: 'ZapOff' }
        ]
      }
    ]
  },
  {
    name: 'Pañales y Control de Esfínteres',
    nameEn: 'Diapers and Toilet Training',
    slug: 'diapers-toilet-training',
    icon: 'Baby',
    color: '#06b6d4',
    description: 'Seguimiento de idas al baño, cambio de pañales, control de esfínteres e higiene.',
    subcategories: [
      {
        name: 'Control de Esfínteres / Pañal',
        nameEn: 'Diapers and Toilet Training',
        description: 'Registro de pipí, popó y progreso hacia el baño independiente',
        items: [
          { name: 'Seco', nameEn: 'Dry', icon: 'Sun' },
          { name: 'Pañal mojado (pipí)', nameEn: 'Diaper change (wet)', icon: 'Droplets' },
          { name: 'Pañal sucio (popó)', nameEn: 'Diaper change (dirty)', icon: 'Layers' },
          { name: 'Pañal mojado y sucio (ambos)', nameEn: 'Diaper change (both)', icon: 'Sparkles' },
          { name: 'Fue al baño (seco / sin éxito)', nameEn: 'Tried toilet (dry)', icon: 'Clock' },
          { name: 'Fue al baño (éxito pipí)', nameEn: 'Tried toilet (success - pee)', icon: 'CheckCircle2' },
          { name: 'Fue al baño (éxito popó)', nameEn: 'Tried toilet (success - poop)', icon: 'Check' },
          { name: 'Accidente de pipí / popó', nameEn: 'Accident', icon: 'AlertTriangle' }
        ]
      },
      {
        name: 'Malestar / Incomodidad',
        nameEn: 'Discomfort/Malestar',
        description: 'Irritación, malestar estomacal, dentición o incomodidad física',
        items: [
          { name: 'Gases', nameEn: 'Gas', icon: 'Wind' },
          { name: 'Dolor de estómago', nameEn: 'Stomach ache', icon: 'Heart' },
          { name: 'Rozadura de pañal', nameEn: 'Diaper rash', icon: 'ShieldAlert' },
          { name: 'Estreñimiento', nameEn: 'Constipation', icon: 'AlertCircle' },
          { name: 'Inquieto / Irritable', nameEn: 'Fussy', icon: 'Frown' },
          { name: 'Molestia de dentición', nameEn: 'Teething', icon: 'Smile' },
          { name: 'Llanto frecuente', nameEn: 'Crying', icon: 'CloudRain' },
          { name: 'Rechazo a comer', nameEn: 'Refusal to eat', icon: 'XCircle' }
        ]
      },
      {
        name: 'Cambio de Ropa',
        nameEn: 'Change of clothes',
        description: 'Cambio por accidente, mojado, manchas o requerimiento de muda',
        items: [
          { name: 'Ropa cambiada (mojada)', nameEn: 'Clothes changed (wet)', icon: 'Shirt' },
          { name: 'Ropa cambiada (sucia)', nameEn: 'Clothes changed (dirty)', icon: 'Shirt' },
          { name: 'Ropa cambiada (manchada / lodo)', nameEn: 'Clothes changed (soiled)', icon: 'Shirt' },
          { name: 'Envío de ropa sucia a casa', nameEn: 'Sent home dirty clothes', icon: 'Package' },
          { name: 'Se requiere ropa de cambio extra', nameEn: 'Extra clothes needed', icon: 'Bell' },
          { name: 'Cambio de zapatos', nameEn: 'Shoes changed', icon: 'Footprints' },
          { name: 'Ropa de lluvia / frío', nameEn: 'Rain gear', icon: 'Umbrella' }
        ]
      }
    ]
  },
  {
    name: 'Disciplina & Convivencia',
    nameEn: 'Discipline',
    slug: 'discipline',
    icon: 'Heart',
    color: '#f59e0b',
    description: 'Gestión emocional, acuerdos de convivencia, resolución de conflictos y límites sanos.',
    subcategories: [
      {
        name: 'Disciplina y Acuerdos de Paz',
        nameEn: 'Disciplina',
        description: 'Manejo de emociones, límites, mediación y acuerdos en el ambiente',
        items: [
          { name: 'Golpear', nameEn: 'Hitting', icon: 'AlertTriangle' },
          { name: 'Morder', nameEn: 'Biting', icon: 'AlertCircle' },
          { name: 'Empujar', nameEn: 'Pushing', icon: 'ShieldAlert' },
          { name: 'No sigue acuerdos / instrucciones', nameEn: 'Not following directions', icon: 'HelpCircle' },
          { name: 'Berrinche / Desborde emocional', nameEn: 'Tantrum', icon: 'Volume2' },
          { name: 'Lanzar objetos o material', nameEn: 'Throwing objects', icon: 'Move' },
          { name: 'Lenguaje no apropiado', nameEn: 'Disrespectful language', icon: 'MessageSquare' },
          { name: 'Reflexión / Acuerdo de paz cumplido', nameEn: 'Positive behavior reflection', icon: 'HeartHandshake' }
        ]
      }
    ]
  },
  {
    name: 'Formularios de Matrícula & Expediente',
    nameEn: 'Enrollment Forms',
    slug: 'enrollment-forms',
    icon: 'FileText',
    color: '#8b5cf6',
    description: 'Documentación requerida, autorizaciones y fichas administrativas del alumno.',
    subcategories: [
      {
        name: 'Formularios de Matrícula / Ingreso',
        nameEn: 'Enrollment Forms',
        description: 'Documentos legales, médicos y autorizaciones de inicio de ciclo',
        items: [
          { name: 'Autorización Médica', nameEn: 'Medical Authorization', icon: 'FileText' },
          { name: 'Ficha de Contactos de Emergencia', nameEn: 'Emergency Contact Form', icon: 'Phone' },
          { name: 'Consentimiento Fotográfico y Redes', nameEn: 'Photo & Media Consent', icon: 'Camera' },
          { name: 'Acuerdo de Matrícula y Pagos', nameEn: 'Tuition Agreement', icon: 'CreditCard' },
          { name: 'Cartilla de Vacunación', nameEn: 'Immunization Record', icon: 'ShieldCheck' },
          { name: 'Acta de Nacimiento', nameEn: 'Birth Certificate', icon: 'FileCheck' }
        ]
      }
    ]
  },
  {
    name: 'Alimentación & Comedor',
    nameEn: 'Meals',
    slug: 'meals',
    icon: 'Utensils',
    color: '#10b981',
    description: 'Registro de comidas principales, colaciones, apetito e hidratación del infante.',
    subcategories: [
      {
        name: 'Almuerzo / Comida Principal',
        nameEn: 'Lunch',
        description: 'Porciones consumidas y aceptación de alimentos en la comida',
        items: [
          { name: 'Comió todo (100%)', nameEn: 'Ate all', icon: 'CheckCircle2' },
          { name: 'Comió la mayor parte (75%)', nameEn: 'Ate most', icon: 'Smile' },
          { name: 'Comió la mitad (50%)', nameEn: 'Ate half', icon: 'MinusCircle' },
          { name: 'Comió poco (25%)', nameEn: 'Ate little', icon: 'Frown' },
          { name: 'Rechazó la comida (0%)', nameEn: 'Refused meal', icon: 'XCircle' },
          { name: 'Hidratación / Tomó agua', nameEn: 'Drank water', icon: 'Droplet' },
          { name: 'Snack adicional consumido', nameEn: 'Extra snack', icon: 'PlusCircle' }
        ]
      }
    ]
  },
  {
    name: 'Siestas & Descanso',
    nameEn: 'Naps',
    slug: 'naps',
    icon: 'Moon',
    color: '#6366f1',
    description: 'Horas de sueño, calidad del descanso y tiempo de relajación en el ambiente.',
    subcategories: [
      {
        name: 'Siestas y Sueño',
        nameEn: 'Naps',
        description: 'Registro de calidad, conciliación y estado al despertar de la siesta',
        items: [
          { name: 'Durmió profundamente', nameEn: 'Slept well', icon: 'Moon' },
          { name: 'Sueño inquieto o interrumpido', nameEn: 'Restless sleep', icon: 'CloudMoon' },
          { name: 'No durmió (descanso despierto)', nameEn: 'Did not sleep', icon: 'Sun' },
          { name: 'Concilió el sueño rápido', nameEn: 'Fell asleep quickly', icon: 'Clock' },
          { name: 'Despertó de buen humor', nameEn: 'Woke up happy', icon: 'Smile' },
          { name: 'Despertó llorando / irritable', nameEn: 'Woke up crying', icon: 'CloudRain' }
        ]
      }
    ]
  },
  {
    name: 'Deportes & Psicomotricidad',
    nameEn: 'Sports',
    slug: 'sports',
    icon: 'Activity',
    color: '#ea580c',
    description: 'Desarrollo motor grueso, actividades deportivas, yoga y juego al aire libre.',
    subcategories: [
      {
        name: 'Deportes y Psicomotricidad',
        nameEn: 'Sports',
        description: 'Participación en dinámicas de movimiento y educación física',
        items: [
          { name: 'Alta participación y entusiasmo', nameEn: 'High participation', icon: 'Zap' },
          { name: 'Participación moderada', nameEn: 'Moderate participation', icon: 'Activity' },
          { name: 'Poca energía / Cansancio', nameEn: 'Low energy', icon: 'BatteryLow' },
          { name: 'Prefirió observar / No participó', nameEn: 'Refused to participate', icon: 'Eye' },
          { name: 'Hito psicomotriz alcanzado', nameEn: 'Motor skills milestone', icon: 'Trophy' }
        ]
      }
    ]
  }
];

async function ensureTrackerCategoriesSeeded(schoolId) {
  const existingCount = await prisma.trackerCategory.count({
    where: { schoolId }
  });

  const existingItemsCount = await prisma.trackerItem.count();

  if (existingCount === 0 || existingItemsCount === 0) {
    console.log(`🌱 Seeding 3-level Tracker Categories, Subcategories & Items in Spanish for school ${schoolId}...`);
    for (let i = 0; i < DEFAULT_TRACKER_CATEGORIES.length; i++) {
      const catData = DEFAULT_TRACKER_CATEGORIES[i];
      let createdCategory = await prisma.trackerCategory.findFirst({
        where: { schoolId, slug: catData.slug }
      });

      if (!createdCategory) {
        createdCategory = await prisma.trackerCategory.create({
          data: {
            schoolId,
            name: catData.name,
            nameEn: catData.nameEn,
            slug: catData.slug,
            icon: catData.icon,
            color: catData.color,
            description: catData.description,
            sortOrder: i + 1,
            isActive: true
          }
        });
      }

      for (let j = 0; j < catData.subcategories.length; j++) {
        const subData = catData.subcategories[j];
        let subcat = await prisma.trackerSubcategory.findFirst({
          where: { categoryId: createdCategory.id, name: subData.name }
        });

        if (!subcat) {
          subcat = await prisma.trackerSubcategory.create({
            data: {
              categoryId: createdCategory.id,
              name: subData.name,
              nameEn: subData.nameEn,
              description: subData.description,
              sortOrder: j + 1,
              isActive: true
            }
          });
        }

        if (subData.items) {
          for (let k = 0; k < subData.items.length; k++) {
            const itemData = subData.items[k];
            const existingItem = await prisma.trackerItem.findFirst({
              where: { subcategoryId: subcat.id, name: itemData.name }
            });

            if (!existingItem) {
              await prisma.trackerItem.create({
                data: {
                  subcategoryId: subcat.id,
                  name: itemData.name,
                  nameEn: itemData.nameEn,
                  icon: itemData.icon || 'Sparkles',
                  color: catData.color,
                  sortOrder: k + 1,
                  isActive: true
                }
              });
            }
          }
        }
      }
    }
    console.log('✅ All 3 Levels of Trackers seeded successfully!');
  }
}

app.get('/api/trackers/categories', async (req, res) => {
  try {
    await ensureTrackerCategoriesSeeded(req.school.id);

    const categories = await prisma.trackerCategory.findMany({
      where: { schoolId: req.school.id },
      include: {
        subcategories: {
          include: {
            items: {
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/trackers/categories', async (req, res) => {
  try {
    const { id, name, nameEn, slug, icon, color, description, isActive, sortOrder } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nombre de la categoría es obligatorio' });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let category;
    if (id) {
      category = await prisma.trackerCategory.update({
        where: { id },
        data: {
          name,
          nameEn: nameEn || null,
          slug: generatedSlug,
          icon: icon || 'Activity',
          color: color || '#1b3b2b',
          description: description || '',
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        }
      });
    } else {
      const count = await prisma.trackerCategory.count({ where: { schoolId: req.school.id } });
      category = await prisma.trackerCategory.create({
        data: {
          schoolId: req.school.id,
          name,
          nameEn: nameEn || null,
          slug: generatedSlug,
          icon: icon || 'Activity',
          color: color || '#1b3b2b',
          description: description || '',
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : count + 1,
        }
      });
    }

    res.json(category);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/trackers/categories/:id', async (req, res) => {
  try {
    await prisma.trackerCategory.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/trackers/subcategories', async (req, res) => {
  try {
    const { id, categoryId, name, nameEn, description, fields, isActive, sortOrder } = req.body;
    if (!name || !categoryId) {
      return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
    }

    let subcategory;
    if (id) {
      subcategory = await prisma.trackerSubcategory.update({
        where: { id },
        data: {
          categoryId,
          name,
          nameEn: nameEn || null,
          description: description || '',
          fields: typeof fields === 'string' ? fields : JSON.stringify(fields || []),
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        }
      });
    } else {
      const count = await prisma.trackerSubcategory.count({ where: { categoryId } });
      subcategory = await prisma.trackerSubcategory.create({
        data: {
          categoryId,
          name,
          nameEn: nameEn || null,
          description: description || '',
          fields: typeof fields === 'string' ? fields : JSON.stringify(fields || []),
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : count + 1,
        }
      });
    }

    res.json(subcategory);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/trackers/subcategories/:id', async (req, res) => {
  try {
    await prisma.trackerSubcategory.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE / UPDATE TRACKER ITEM (LEVEL 3)
app.post('/api/trackers/items', async (req, res) => {
  try {
    const { id, subcategoryId, name, nameEn, description, icon, color, isActive, sortOrder } = req.body;
    if (!name || !subcategoryId) {
      return res.status(400).json({ error: 'Nombre y subcategoría son requeridos' });
    }

    let item;
    if (id) {
      item = await prisma.trackerItem.update({
        where: { id },
        data: {
          subcategoryId,
          name,
          nameEn: nameEn || null,
          description: description || '',
          icon: icon || 'Sparkles',
          color: color || '#1b3b2b',
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        }
      });
    } else {
      const count = await prisma.trackerItem.count({ where: { subcategoryId } });
      item = await prisma.trackerItem.create({
        data: {
          subcategoryId,
          name,
          nameEn: nameEn || null,
          description: description || '',
          icon: icon || 'Sparkles',
          color: color || '#1b3b2b',
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : count + 1,
        }
      });
    }

    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/trackers/items/:id', async (req, res) => {
  try {
    await prisma.trackerItem.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/trackers/items/:id/toggle-active', async (req, res) => {
  try {
    const item = await prisma.trackerItem.findUnique({
      where: { id: req.params.id }
    });
    if (!item) return res.status(404).json({ error: 'Tracker no encontrado' });

    const updated = await prisma.trackerItem.update({
      where: { id: req.params.id },
      data: { isActive: !item.isActive }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// STUDENT PROGRESS REPORT GENERATOR (PDF DATA AGGREGATION)
// ==========================================
app.get('/api/montessori/reports/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, termName } = req.query;

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: req.school.id },
      include: {
        environment: true,
        tutors: {
          include: {
            tutor: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado en este colegio' });
    }

    // Get Lead Guides for this student's environment
    let leadGuides = [];
    if (student.environmentId) {
      const guides = await prisma.environmentGuide.findMany({
        where: { environmentId: student.environmentId },
        include: {
          user: { select: { id: true, fullName: true, email: true } }
        }
      });
      leadGuides = guides.map(g => g.user);
    }

    // Load full Montessori Curriculum
    const areas = await prisma.montessoriArea.findMany({
      where: { OR: [{ schoolId: req.school.id }, { schoolId: null }] },
      include: {
        categories: {
          include: {
            lessons: { orderBy: { sortOrder: 'asc' } }
          },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Load Student Lesson Progress
    const progressRecords = await prisma.studentLessonProgress.findMany({
      where: { studentId },
      include: {
        lesson: {
          include: {
            category: { include: { area: true } }
          }
        }
      }
    });

    // Compute Area Breakdown, Categories & Lessons with Assessment Status
    const areaBreakdown = areas.map(area => {
      let totalLessons = 0;
      const progressMap = new Map();
      
      const areaProgress = progressRecords.filter(p => p.lesson.category.areaId === area.id);
      areaProgress.forEach(p => {
        progressMap.set(p.lessonId, p);
      });

      const categories = area.categories.map(cat => {
        const catLessons = cat.lessons.map(les => {
          totalLessons++;
          const prog = progressMap.get(les.id);
          return {
            id: les.id,
            name: les.name,
            criteria: les.pedagogicalPurpose || les.description || `Demuestra el dominio del material ${les.name}`,
            status: prog ? prog.status : 'NOT_STARTED',
            presentedAt: prog?.presentedAt || null,
            masteredAt: prog?.masteredAt || null,
            notes: prog?.notes || null
          };
        });

        return {
          id: cat.id,
          name: cat.name,
          lessons: catLessons
        };
      });

      const mastered = areaProgress.filter(p => p.status === 'MASTERED');
      const practicing = areaProgress.filter(p => p.status === 'PRACTICING');
      const presented = areaProgress.filter(p => p.status === 'PRESENTED');
      const needsReview = areaProgress.filter(p => p.status === 'NEEDS_REVIEW');

      const masteryPct = totalLessons > 0 ? Math.round((mastered.length / totalLessons) * 100) : 0;

      return {
        areaId: area.id,
        areaName: area.name,
        color: area.color || '#1b3b2b',
        description: area.description,
        totalLessons,
        masteryPercentage: masteryPct,
        masteredCount: mastered.length,
        practicingCount: practicing.length,
        presentedCount: presented.length,
        needsReviewCount: needsReview.length,
        categories,
        masteredLessons: mastered.map(m => ({
          id: m.lesson.id,
          name: m.lesson.name,
          categoryName: m.lesson.category.name,
          pedagogicalPurpose: m.lesson.pedagogicalPurpose,
          masteredAt: m.masteredAt || m.updatedAt,
          notes: m.notes
        })),
        practicingLessons: practicing.map(p => ({
          id: p.lesson.id,
          name: p.lesson.name,
          categoryName: p.lesson.category.name,
          pedagogicalPurpose: p.lesson.pedagogicalPurpose,
          presentedAt: p.presentedAt,
          notes: p.notes
        }))
      };
    });

    // Overall Totals
    const totalCurriculumLessons = areaBreakdown.reduce((acc, a) => acc + a.totalLessons, 0);
    const totalMastered = areaBreakdown.reduce((acc, a) => acc + a.masteredCount, 0);
    const totalPracticing = areaBreakdown.reduce((acc, a) => acc + a.practicingCount, 0);
    const totalPresented = areaBreakdown.reduce((acc, a) => acc + a.presentedCount, 0);
    const overallMasteryPct = totalCurriculumLessons > 0 ? Math.round((totalMastered / totalCurriculumLessons) * 100) : 0;

    // Filter Observations
    const obsWhere = {
      schoolId: req.school.id,
      studentId
    };
    if (startDate || endDate) {
      obsWhere.createdAt = {};
      if (startDate) obsWhere.createdAt.gte = new Date(String(startDate));
      if (endDate) obsWhere.createdAt.lte = new Date(String(endDate));
    }

    const observations = await prisma.studentObservation.findMany({
      where: obsWhere,
      orderBy: { createdAt: 'desc' }
    });

    // Find Conference Report for Qualitative Narrative
    const confReport = await prisma.progressConferenceReport.findFirst({
      where: {
        schoolId: req.school.id,
        studentId
      },
      orderBy: { conferenceDate: 'desc' }
    });

    // Attendance in period
    const attWhere = {
      studentId
    };
    if (startDate || endDate) {
      attWhere.date = {};
      if (startDate) attWhere.date.gte = new Date(String(startDate));
      if (endDate) attWhere.date.lte = new Date(String(endDate));
    }

    const attendances = await prisma.studentAttendance.findMany({
      where: attWhere,
      orderBy: { date: 'asc' }
    });

    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
    const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
    const tardyDays = attendances.filter(a => a.status === 'TARDY').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Calculate age string (e.g. "4 años, 5 meses")
    let ageString = '';
    if (student.dateOfBirth) {
      const dob = new Date(student.dateOfBirth);
      const now = new Date();
      let years = now.getFullYear() - dob.getFullYear();
      let months = now.getMonth() - dob.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
        years--;
        months += 12;
      }
      ageString = `${years} ${years === 1 ? 'año' : 'años'}${months > 0 ? `, ${months} ${months === 1 ? 'mes' : 'meses'}` : ''}`;
    }

    // Default Qualitative Narratives (Montessori Compass Style)
    const defaultStudentReflection = confReport?.executiveSummary || 
      `${student.fullName} muestra un desarrollo activo dentro de la comunidad Montessori. Demuestra disposición para acompañar y colaborar con sus compañeros, mostrando interés por aprender a través del vínculo y la interacción social. Dentro del ambiente continúa fortaleciendo su independencia y autorregulación en el trabajo individual, reconociendo las rutinas y cuidando la convivencia armónica.`;

    const defaultAcademicSummary = confReport?.strengths || 
      `En el área de Lenguaje, reconoce sonidos fonéticos y avanza en el trazo y lectoescritura con entusiasmo. En Matemáticas, comprende la relación cantidad-símbolo y el concepto numérico. En el área Sensorial, clasifica formas, colores y dimensiones con precisión de observación. En Vida Práctica, participa activamente en el cuidado de su persona y del ambiente con creciente autonomía.`;

    const defaultSkillsSummary = confReport?.challenges || confReport?.recommendationsHome ? 
      [confReport.challenges, confReport.recommendationsHome, confReport.agreements].filter(Boolean).join('\n') :
      `- Fortalecer la independencia y periodos de concentración en el trabajo individual.\n- Avanzar en la lectoescritura y conciencia fonológica.\n- Profundizar en el sistema decimal y numeración concreta.\n- Desarrollar la autorregulación y el cuidado del ambiente.`;

    const workHabits = [
      {
        category: 'Alertness (Atención & Presencia)',
        skill: 'Constantemente despierto, atento y conectado con las dinámicas del ambiente. Percibe y responde a los cambios sutiles y apoya a mantener la armonía.'
      },
      {
        category: 'Concentration (Concentración & Enfoque)',
        skill: 'Mantiene periodos de concentración en sus actividades elegidas, trabajando en profundizar la persistencia e independencia.'
      },
      {
        category: 'Curiosity (Curiosidad & Exploración)',
        skill: 'Formula preguntas de indagación e interés genuino. Inspirado a descubrir respuestas a través de la experimentación y observación con los materiales.'
      }
    ];

    res.json({
      reportTitle: `Reporte de Progreso y Evaluación Montessori`,
      termName: termName || 'Ciclo Escolar Activo',
      generatedAt: new Date(),
      school: {
        id: req.school.id,
        name: req.school.name,
        slug: req.school.slug,
        address: req.school.address || 'Cancún, Quintana Roo, México',
        website: req.school.website || 'https://ceibaroots.com',
        primaryColor: req.school.primaryColor || '#1b3b2b',
        secondaryColor: req.school.secondaryColor || '#c86d51'
      },
      student: {
        id: student.id,
        fullName: student.fullName,
        avatarUrl: student.avatarUrl,
        grade: student.grade,
        dateOfBirth: student.dateOfBirth,
        ageString,
        enrollmentCode: student.enrollmentCode,
        environmentName: student.environment?.name || 'Ambiente General',
        environmentStage: student.environment?.stage || 'Casa de Niños',
        environmentColor: student.environment?.color || '#1b3b2b',
        tutors: student.tutors.map(t => ({
          name: t.tutor.fullName,
          email: t.tutor.email,
          phone: t.tutor.phone,
          relationship: t.relationship
        }))
      },
      leadGuides,
      statistics: {
        totalCurriculumLessons,
        totalMastered,
        totalPracticing,
        totalPresented,
        overallMasteryPct
      },
      areaBreakdown,
      studentReflection: defaultStudentReflection,
      academicSummary: defaultAcademicSummary,
      skillsSummary: defaultSkillsSummary,
      workHabits,
      observations,
      attendance: {
        totalDays,
        presentDays,
        absentDays,
        tardyDays,
        attendanceRate,
        records: attendances.map(a => ({
          date: a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date).split('T')[0],
          status: a.status,
          note: a.note || ''
        }))
      }
    });
  } catch (e) {
    console.error('Error generating student progress report:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// SCHOOL EVENTS & SCHEDULING (CALENDARIO) API
// ==========================================

const DEFAULT_EVENT_CATEGORIES = [
  { name: 'Outdoor School & Naturaleza', slug: 'outdoor-school', color: '#059669', icon: 'Trees', description: 'Actividades al aire libre, exploración botánica y ecología.' },
  { name: 'Festivales & Celebraciones', slug: 'festivales', color: '#c86d51', icon: 'PartyPopper', description: 'Día de la Madre/Padre, Primavera, Fin de Curso y eventos comunitarios.' },
  { name: 'Entrevistas Guía-Familia', slug: 'entrevistas', color: '#4f46e5', icon: 'Users', description: 'Citas individuales y conferencias de evaluación del infante.' },
  { name: 'Salidas Pedagógicas', slug: 'salidas', color: '#d97706', icon: 'Compass', description: 'Excursiones, visitas a museos y proyectos fuera del aula.' },
  { name: 'Talleres para Familias', slug: 'talleres-padres', color: '#0284c7', icon: 'GraduationCap', description: 'Escuela para padres, filosofía Montessori en casa y crianza.' },
  { name: 'Asambleas & Reuniones', slug: 'asambleas', color: '#64748b', icon: 'Building2', description: 'Reuniones generales, circulares y comités de padres.' },
];

async function ensureEventCategoriesSeeded(schoolId) {
  const count = await prisma.eventCategory.count({
    where: { OR: [{ schoolId }, { schoolId: null }] }
  });
  if (count === 0) {
    for (const cat of DEFAULT_EVENT_CATEGORIES) {
      await prisma.eventCategory.create({
        data: {
          schoolId,
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          icon: cat.icon,
          description: cat.description,
          isDefault: true
        }
      });
    }
  }

  // Seed sample events if none exist
  const eventCount = await prisma.schoolEvent.count({ where: { schoolId } });
  if (eventCount === 0) {
    const outdoorCat = await prisma.eventCategory.findFirst({ where: { schoolId, slug: 'outdoor-school' } });
    const interviewsCat = await prisma.eventCategory.findFirst({ where: { schoolId, slug: 'entrevistas' } });
    const festivalCat = await prisma.eventCategory.findFirst({ where: { schoolId, slug: 'festivales' } });

    const now = new Date();
    
    // Event 1: Outdoor School (Next Friday)
    const nextFri = new Date(now);
    nextFri.setDate(now.getDate() + (5 + 7 - now.getDay()) % 7 || 7);
    nextFri.setHours(9, 0, 0, 0);
    const nextFriEnd = new Date(nextFri);
    nextFriEnd.setHours(13, 0, 0, 0);

    if (outdoorCat) {
      await prisma.schoolEvent.create({
        data: {
          schoolId,
          categoryId: outdoorCat.id,
          title: 'Outdoor School: Siembra y Exploración Botánica',
          description: 'Jornada al aire libre donde los niños prepararán la tierra del huerto escolar y sembrarán hortalizas de temporada. Traer ropa cómoda, sombrero y termo de agua.',
          location: 'Huerto & Bosque La Ceiba',
          eventType: 'OPEN_MASSIVE',
          targetScope: 'ALL_SCHOOL',
          status: 'PUBLISHED',
          startDateTime: nextFri,
          endDateTime: nextFriEnd,
          coverImage: '/gallery/hero-montessori.jpeg'
        }
      });
    }

    // Event 2: Parent-Teacher Evaluation Conferences (Next Saturday with 45 min slots)
    const nextSat = new Date(nextFri);
    nextSat.setDate(nextFri.getDate() + 1);
    nextSat.setHours(9, 0, 0, 0);
    const nextSatEnd = new Date(nextSat);
    nextSatEnd.setHours(15, 0, 0, 0);

    if (interviewsCat) {
      const interviewEvent = await prisma.schoolEvent.create({
        data: {
          schoolId,
          categoryId: interviewsCat.id,
          title: 'Entrevistas de Evaluación Individual Guía-Familia',
          description: 'Espacio de diálogo personalizado para revisar el avance pedagógico de cada infante, lecciones dominadas y próximos pasos de desarrollo.',
          location: 'Salones Montessori',
          eventType: 'SLOT_BOOKING',
          targetScope: 'ENVIRONMENTS',
          status: 'PUBLISHED',
          startDateTime: nextSat,
          endDateTime: nextSatEnd,
          slotDurationMinutes: 45,
          maxBookingsPerSlot: 1
        }
      });

      // Generate slots
      const slots = generateEventSlots(nextSat, nextSatEnd, 45, 1);
      for (const s of slots) {
        await prisma.eventSlot.create({
          data: {
            eventId: interviewEvent.id,
            startTime: s.startTime,
            endTime: s.endTime,
            maxCapacity: 1
          }
        });
      }
    }
  }
}

// 1. Categories
app.get('/api/events/categories', async (req, res) => {
  try {
    await ensureEventCategoriesSeeded(req.school.id);
    const categories = await prisma.eventCategory.findMany({
      where: { OR: [{ schoolId: req.school.id }, { schoolId: null }] },
      orderBy: { createdAt: 'asc' }
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/events/categories', async (req, res) => {
  try {
    const { name, color, icon, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await prisma.eventCategory.create({
      data: {
        schoolId: req.school.id,
        name,
        slug,
        color: color || '#1b3b2b',
        icon: icon || 'Calendar',
        description: description || '',
        isDefault: false
      }
    });
    res.json(category);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper: Generate slots for SLOT_BOOKING event
function generateEventSlots(startDateTime, endDateTime, slotDurationMinutes, maxBookingsPerSlot = 1) {
  const slots = [];
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const durationMs = (slotDurationMinutes || 45) * 60 * 1000;

  let current = new Date(start.getTime());
  while (current.getTime() + durationMs <= end.getTime()) {
    const slotEnd = new Date(current.getTime() + durationMs);
    slots.push({
      startTime: new Date(current),
      endTime: slotEnd,
      maxCapacity: maxBookingsPerSlot || 1,
      isLocked: false
    });
    current = new Date(slotEnd.getTime());
  }
  return slots;
}

// 2. Events List
app.get('/api/events', async (req, res) => {
  try {
    const { startDate, endDate, environmentId, categoryId, status, tutorEmail } = req.query;
    
    const where = { schoolId: req.school.id };
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    if (startDate || endDate) {
      where.startDateTime = {};
      if (startDate) where.startDateTime.gte = new Date(String(startDate));
      if (endDate) where.startDateTime.lte = new Date(String(endDate));
    }

    const events = await prisma.schoolEvent.findMany({
      where,
      include: {
        category: true,
        hosts: {
          include: {
            user: { select: { id: true, fullName: true, email: true } }
          }
        },
        volunteers: {
          include: {
            tutor: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        },
        targetEnvironments: {
          include: {
            environment: { select: { id: true, name: true, color: true, stage: true } }
          }
        },
        targetStudents: {
          include: {
            student: { select: { id: true, fullName: true, avatarUrl: true, environmentId: true } }
          }
        },
        slots: {
          include: {
            bookings: {
              include: {
                student: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                    status: true,
                    grade: true,
                    environment: { select: { id: true, name: true, stage: true, color: true } }
                  }
                },
                tutor: { select: { id: true, fullName: true, email: true, phone: true } }
              }
            }
          },
          orderBy: { startTime: 'asc' }
        },
        bookings: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                status: true,
                grade: true,
                environment: { select: { id: true, name: true, stage: true, color: true } }
              }
            },
            tutor: { select: { id: true, fullName: true, email: true, phone: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { startDateTime: 'asc' }
    });

    res.json(events);
  } catch (e) {
    console.error('Error in GET /api/events:', e);
    res.status(500).json({ error: e.message });
  }
});

// 3. Single Event Detail
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await prisma.schoolEvent.findFirst({
      where: { id: req.params.id, schoolId: req.school.id },
      include: {
        category: true,
        hosts: {
          include: {
            user: { select: { id: true, fullName: true, email: true } }
          }
        },
        volunteers: {
          include: {
            tutor: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        },
        targetEnvironments: {
          include: {
            environment: { select: { id: true, name: true, color: true, stage: true } }
          }
        },
        targetStudents: {
          include: {
            student: { select: { id: true, fullName: true, avatarUrl: true, environmentId: true } }
          }
        },
        slots: {
          include: {
            bookings: {
              include: {
                student: { select: { id: true, fullName: true, avatarUrl: true } },
                tutor: { select: { id: true, fullName: true, email: true, phone: true } }
              }
            }
          },
          orderBy: { startTime: 'asc' }
        },
        bookings: {
          include: {
            student: { select: { id: true, fullName: true, avatarUrl: true } },
            tutor: { select: { id: true, fullName: true, email: true, phone: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3B. Public Event Detail (for public forms & schedule_event widgets)
app.get('/api/events/public/:id', async (req, res) => {
  try {
    const event = await prisma.schoolEvent.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        slots: {
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
              select: { id: true }
            }
          },
          orderBy: { startTime: 'asc' }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

    // Public sanitized representation (never exposes attendee names or emails)
    const sanitizedSlots = (event.slots || []).map(s => {
      const bookingsCount = (s.bookings || []).length;
      const isAvailable = !s.isLocked && bookingsCount < s.maxCapacity;
      return {
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        maxCapacity: s.maxCapacity,
        isLocked: !!s.isLocked,
        bookingsCount,
        isAvailable
      };
    });

    res.json({
      id: event.id,
      schoolId: event.schoolId,
      title: event.title,
      description: event.description,
      location: event.location,
      coverImage: event.coverImage,
      eventType: event.eventType,
      status: event.status,
      isClosed: event.isClosed,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      slotDurationMinutes: event.slotDurationMinutes,
      maxBookingsPerSlot: event.maxBookingsPerSlot,
      category: event.category ? {
        id: event.category.id,
        name: event.category.name,
        color: event.category.color,
        icon: event.category.icon
      } : null,
      slots: sanitizedSlots
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper to create event booking on completed form submissions
async function processEventBookingsFromFormData(formData, { guestName, guestEmail, guestPhone, formTitle, studentId, tutorUserId }) {
  if (!formData || typeof formData !== 'object') return;

  const extractBookings = (val) => {
    if (!val || typeof val !== 'object') return [];
    if (val.eventId && (val.slotId || val.rsvpStatus === 'CONFIRMED')) return [val];
    if (Array.isArray(val)) return val.filter(v => v && typeof v === 'object' && v.eventId && (v.slotId || v.rsvpStatus === 'CONFIRMED'));
    if (val.bookings && typeof val.bookings === 'object') {
      const items = Array.isArray(val.bookings) ? val.bookings : Object.values(val.bookings);
      return items.filter(v => v && typeof v === 'object' && v.eventId && (v.slotId || v.rsvpStatus === 'CONFIRMED'));
    }
    const nested = [];
    for (const sub of Object.values(val)) {
      if (sub && typeof sub === 'object' && sub.eventId && (sub.slotId || sub.rsvpStatus === 'CONFIRMED')) {
        nested.push(sub);
      }
    }
    return nested;
  };

  for (const [key, value] of Object.entries(formData)) {
    const bookingItems = extractBookings(value);
    for (const bookingItem of bookingItems) {
      try {
        const targetEventId = bookingItem.eventId;
        const targetSlotId = bookingItem.slotId;
        const targetEvent = await prisma.schoolEvent.findUnique({
          where: { id: targetEventId },
          include: { slots: true }
        });

        if (targetEvent) {
          if (targetEvent.eventType === 'SLOT_BOOKING' && targetSlotId) {
            const existingSlot = await prisma.eventSlot.findUnique({
              where: { id: targetSlotId },
              include: { bookings: { where: { status: 'CONFIRMED' } } }
            });

            if (existingSlot && !existingSlot.isLocked && existingSlot.bookings.length < existingSlot.maxCapacity) {
              await prisma.eventBooking.create({
                data: {
                  eventId: targetEventId,
                  slotId: targetSlotId,
                  studentId: studentId || undefined,
                  tutorUserId: tutorUserId || undefined,
                  guestName: guestName || 'Aspirante / Familiar',
                  guestEmail: guestEmail || '',
                  guestPhone: guestPhone || '',
                  guestsCount: 1,
                  status: 'CONFIRMED',
                  notes: `Reserva automática generada desde formulario: ${formTitle || 'Formulario Oficial'}`
                }
              });
              console.log(`📅 [SCHEDULE EVENT] Booked slot ${targetSlotId} (${existingSlot.startTime}-${existingSlot.endTime}) for ${guestName} on event "${targetEvent.title}"`);
            } else {
              console.warn(`⚠️ [SCHEDULE EVENT] Slot ${targetSlotId} was not available or already full at time of submit.`);
            }
          } else if (targetEvent.eventType === 'OPEN_MASSIVE') {
            await prisma.eventBooking.create({
              data: {
                eventId: targetEventId,
                studentId: studentId || undefined,
                tutorUserId: tutorUserId || undefined,
                guestName: guestName || 'Aspirante / Familiar',
                guestEmail: guestEmail || '',
                guestPhone: guestPhone || '',
                guestsCount: 1,
                status: 'CONFIRMED',
                notes: `RSVP confirmado desde formulario: ${formTitle || 'Formulario Oficial'}`
              }
            });
            console.log(`📅 [SCHEDULE EVENT] Confirmed RSVP for ${guestName} on massive event "${targetEvent.title}"`);
          }
        }
      } catch (err) {
        console.error('⚠️ [SCHEDULE EVENT] Error creating booking on form submit:', err);
      }
    }
  }
}

// 4. Create Event
app.post('/api/events', async (req, res) => {
  try {
    const {
      categoryId,
      title,
      description = '',
      location = '',
      coverImage = '',
      eventType = 'OPEN_MASSIVE',
      targetScope = 'ALL_SCHOOL',
      status = 'PUBLISHED',
      isClosed = false,
      startDateTime,
      endDateTime,
      slotDurationMinutes = 45,
      maxBookingsPerSlot = 1,
      hostUserIds = [],
      volunteerTutorIds = [],
      environmentIds = [],
      studentIds = [],
      attachments = []
    } = req.body;

    if (!title || !categoryId || !startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Título, categoría y fechas de inicio/fin son obligatorios' });
    }

    const event = await prisma.schoolEvent.create({
      data: {
        schoolId: req.school.id,
        categoryId,
        title,
        description,
        location,
        coverImage,
        eventType,
        targetScope,
        status,
        isClosed: Boolean(isClosed),
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        slotDurationMinutes: Number(slotDurationMinutes) || 45,
        maxBookingsPerSlot: Number(maxBookingsPerSlot) || 1,
        attachments: attachments || []
      }
    });

    // Add Hosts
    if (Array.isArray(hostUserIds) && hostUserIds.length > 0) {
      for (const userId of hostUserIds) {
        await prisma.eventHost.create({
          data: { eventId: event.id, userId }
        }).catch(() => {});
      }
    }

    // Add Volunteers
    if (Array.isArray(volunteerTutorIds) && volunteerTutorIds.length > 0) {
      for (const tutorUserId of volunteerTutorIds) {
        await prisma.eventVolunteer.create({
          data: { eventId: event.id, tutorUserId }
        }).catch(() => {});
      }
    }

    // Add Target Environments
    if (targetScope === 'ENVIRONMENTS' && Array.isArray(environmentIds)) {
      for (const envId of environmentIds) {
        await prisma.eventTargetEnvironment.create({
          data: { eventId: event.id, environmentId: envId }
        }).catch(() => {});
      }
    }

    // Add Target Students
    if (targetScope === 'STUDENTS' && Array.isArray(studentIds)) {
      for (const stId of studentIds) {
        await prisma.eventTargetStudent.create({
          data: { eventId: event.id, studentId: stId }
        }).catch(() => {});
      }
    }

    // Generate or Save Slots if SLOT_BOOKING
    if (eventType === 'SLOT_BOOKING') {
      if (Array.isArray(req.body.slots) && req.body.slots.length > 0) {
        for (const slot of req.body.slots) {
          await prisma.eventSlot.create({
            data: {
              eventId: event.id,
              name: slot.name || '',
              startTime: new Date(slot.startTime),
              endTime: new Date(slot.endTime),
              maxCapacity: Number(slot.maxCapacity) || Number(maxBookingsPerSlot) || 1,
              isLocked: Boolean(slot.isLocked)
            }
          }).catch(() => {});
        }
      } else {
        const generatedSlots = generateEventSlots(
          startDateTime,
          endDateTime,
          Number(slotDurationMinutes) || 45,
          Number(maxBookingsPerSlot) || 1
        );

        for (const slot of generatedSlots) {
          await prisma.eventSlot.create({
            data: {
              eventId: event.id,
              name: slot.name || '',
              startTime: slot.startTime,
              endTime: slot.endTime,
              maxCapacity: slot.maxCapacity
            }
          });
        }
      }
    }

    emitCalendarWebhookNotification({
      schoolId: req.school?.id,
      eventType: 'calendar.event_created',
      data: event,
      prisma
    });

    res.json(event);
  } catch (e) {
    console.error('Error creating event:', e);
    res.status(500).json({ error: e.message });
  }
});

// 5. Update Event
app.put('/api/events/:id', async (req, res) => {
  try {
    const {
      categoryId,
      title,
      description,
      location,
      coverImage,
      eventType,
      targetScope,
      status,
      isClosed,
      startDateTime,
      endDateTime,
      slotDurationMinutes,
      maxBookingsPerSlot,
      hostUserIds,
      volunteerTutorIds,
      environmentIds,
      studentIds,
      attachments,
      summaryNotes,
      photoUrls,
      slots
    } = req.body;

    const event = await prisma.schoolEvent.update({
      where: { id: req.params.id },
      data: {
        categoryId: categoryId || undefined,
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        location: location !== undefined ? location : undefined,
        coverImage: coverImage !== undefined ? coverImage : undefined,
        eventType: eventType || undefined,
        targetScope: targetScope || undefined,
        status: status || undefined,
        isClosed: isClosed !== undefined ? Boolean(isClosed) : undefined,
        startDateTime: startDateTime ? new Date(startDateTime) : undefined,
        endDateTime: endDateTime ? new Date(endDateTime) : undefined,
        slotDurationMinutes: slotDurationMinutes !== undefined ? Number(slotDurationMinutes) : undefined,
        maxBookingsPerSlot: maxBookingsPerSlot !== undefined ? Number(maxBookingsPerSlot) : undefined,
        attachments: attachments !== undefined ? attachments : undefined,
        summaryNotes: summaryNotes !== undefined ? summaryNotes : undefined,
        photoUrls: photoUrls !== undefined ? photoUrls : undefined,
      }
    });

    // Update relations if passed
    if (Array.isArray(hostUserIds)) {
      await prisma.eventHost.deleteMany({ where: { eventId: event.id } });
      for (const userId of hostUserIds) {
        await prisma.eventHost.create({ data: { eventId: event.id, userId } }).catch(() => {});
      }
    }

    if (Array.isArray(volunteerTutorIds)) {
      await prisma.eventVolunteer.deleteMany({ where: { eventId: event.id } });
      for (const tutorUserId of volunteerTutorIds) {
        await prisma.eventVolunteer.create({ data: { eventId: event.id, tutorUserId } }).catch(() => {});
      }
    }

    if (Array.isArray(environmentIds)) {
      await prisma.eventTargetEnvironment.deleteMany({ where: { eventId: event.id } });
      for (const envId of environmentIds) {
        await prisma.eventTargetEnvironment.create({ data: { eventId: event.id, environmentId: envId } }).catch(() => {});
      }
    }

    if (Array.isArray(studentIds)) {
      await prisma.eventTargetStudent.deleteMany({ where: { eventId: event.id } });
      for (const stId of studentIds) {
        await prisma.eventTargetStudent.create({ data: { eventId: event.id, studentId: stId } }).catch(() => {});
      }
    }

    // Update Slots if passed
    if (Array.isArray(slots)) {
      const incomingSlotIds = slots.filter(s => s.id && !s.id.startsWith('temp_')).map(s => s.id);
      const existingSlots = await prisma.eventSlot.findMany({
        where: { eventId: event.id },
        include: { bookings: true }
      });

      for (const exSlot of existingSlots) {
        if (!incomingSlotIds.includes(exSlot.id)) {
          if (exSlot.bookings.length === 0) {
            await prisma.eventSlot.delete({ where: { id: exSlot.id } }).catch(() => {});
          } else {
            await prisma.eventSlot.update({ where: { id: exSlot.id }, data: { isLocked: true } }).catch(() => {});
          }
        }
      }

      for (const s of slots) {
        if (s.id && !s.id.startsWith('temp_') && existingSlots.some(ex => ex.id === s.id)) {
          await prisma.eventSlot.update({
            where: { id: s.id },
            data: {
              name: s.name || '',
              startTime: new Date(s.startTime),
              endTime: new Date(s.endTime),
              maxCapacity: Number(s.maxCapacity) || 1,
              isLocked: Boolean(s.isLocked)
            }
          }).catch(() => {});
        } else {
          await prisma.eventSlot.create({
            data: {
              eventId: event.id,
              name: s.name || '',
              startTime: new Date(s.startTime),
              endTime: new Date(s.endTime),
              maxCapacity: Number(s.maxCapacity) || 1,
              isLocked: Boolean(s.isLocked)
            }
          }).catch(() => {});
        }
      }
    }

    emitCalendarWebhookNotification({
      schoolId: req.school?.id,
      eventType: 'calendar.event_updated',
      data: event,
      prisma
    });

    res.json(event);
  } catch (e) {
    console.error('Error updating event:', e);
    res.status(500).json({ error: e.message });
  }
});

// 6. Delete Event
app.delete('/api/events/:id', async (req, res) => {
  try {
    await prisma.schoolEvent.delete({ where: { id: req.params.id } });

    emitCalendarWebhookNotification({
      schoolId: req.school?.id,
      eventType: 'calendar.event_deleted',
      data: { id: req.params.id },
      prisma
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 7. Family RSVP (Open/Massive Event)
app.post('/api/events/:id/rsvp', async (req, res) => {
  try {
    const { studentId, tutorUserId, guestName, guestEmail, guestsCount = 1, status = 'CONFIRMED', notes = '' } = req.body;
    
    // Check existing
    let existing = null;
    if (studentId) {
      existing = await prisma.eventBooking.findFirst({
        where: { eventId: req.params.id, studentId }
      });
    }

    let booking;
    if (existing) {
      booking = await prisma.eventBooking.update({
        where: { id: existing.id },
        data: {
          tutorUserId: tutorUserId || existing.tutorUserId,
          guestName: guestName || existing.guestName,
          guestEmail: guestEmail || existing.guestEmail,
          guestsCount: Number(guestsCount) || 1,
          status,
          notes: notes || ''
        }
      });
    } else {
      booking = await prisma.eventBooking.create({
        data: {
          eventId: req.params.id,
          studentId: studentId || undefined,
          tutorUserId: tutorUserId || undefined,
          guestName: guestName || '',
          guestEmail: guestEmail || '',
          guestsCount: Number(guestsCount) || 1,
          status,
          notes: notes || ''
        }
      });
    }

    emitCalendarWebhookNotification({
      schoolId: req.school?.id,
      eventType: 'calendar.booking_created',
      data: booking,
      prisma
    });

    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 8. Family Book Slot (Slot Booking)
app.post('/api/events/:id/book-slot', async (req, res) => {
  try {
    const { slotId, studentId, tutorUserId, guestName, guestEmail, guestPhone, notes = '' } = req.body;
    if (!slotId) return res.status(400).json({ error: 'slotId es requerido' });

    const slot = await prisma.eventSlot.findUnique({
      where: { id: slotId },
      include: { bookings: { where: { status: 'CONFIRMED' } } }
    });

    if (!slot) return res.status(404).json({ error: 'Horario / Slot no encontrado' });
    if (slot.isLocked) return res.status(400).json({ error: 'Este horario está bloqueado' });
    if (slot.bookings.length >= slot.maxCapacity) {
      return res.status(400).json({ error: 'Este horario ya ha sido reservado por otra familia' });
    }

    // Cancel prior slot booking for same student if any
    if (studentId) {
      await prisma.eventBooking.deleteMany({
        where: { eventId: req.params.id, studentId }
      });
    }

    const booking = await prisma.eventBooking.create({
      data: {
        eventId: req.params.id,
        slotId,
        studentId: studentId || undefined,
        tutorUserId: tutorUserId || undefined,
        guestName: guestName || '',
        guestEmail: guestEmail || '',
        guestPhone: guestPhone || '',
        guestsCount: 1,
        status: 'CONFIRMED',
        notes: notes || ''
      },
      include: {
        slot: true,
        student: true,
        tutor: true
      }
    });

    emitCalendarWebhookNotification({
      schoolId: req.school?.id,
      eventType: 'calendar.booking_created',
      data: booking,
      prisma
    });

    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 9. Cancel Booking
app.delete('/api/events/:id/bookings/:bookingId', async (req, res) => {
  try {
    await prisma.eventBooking.delete({
      where: { id: req.params.bookingId }
    });

    emitCalendarWebhookNotification({
      schoolId: req.school?.id,
      eventType: 'calendar.booking_cancelled',
      data: { id: req.params.bookingId, eventId: req.params.id },
      prisma
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 9.1 Update Booking Status / Notes
app.patch('/api/events/:id/bookings/:bookingId', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const data = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.eventBooking.update({
      where: { id: req.params.bookingId },
      data,
      include: {
        slot: true,
        student: true,
        tutor: true
      }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 10. Post-Event Memory & Photo Gallery
app.post('/api/events/:id/post-event', async (req, res) => {
  try {
    const { summaryNotes, photoUrls = [], attachments = [] } = req.body;

    const event = await prisma.schoolEvent.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        summaryNotes: summaryNotes !== undefined ? summaryNotes : undefined,
        photoUrls: photoUrls !== undefined ? photoUrls : undefined,
        attachments: attachments !== undefined ? attachments : undefined
      }
    });

    res.json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// PROGRESS CONFERENCE REPORTS & EVOLUTION TIMELINE API
// ==========================================

// Helper to compute live Montessori mastery snapshot
async function computeStudentMasterySnapshot(schoolId, studentId) {
  const areas = await prisma.montessoriArea.findMany({
    where: { OR: [{ schoolId }, { schoolId: null }] },
    include: {
      categories: {
        include: { lessons: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });

  const progressRecords = await prisma.studentLessonProgress.findMany({
    where: { studentId },
    include: { lesson: { include: { category: true } } }
  });

  let totalCurriculum = 0;
  let totalMastered = 0;
  let totalPracticing = 0;

  const areaSummaries = areas.map(area => {
    let areaLessonsCount = 0;
    for (const cat of area.categories) {
      areaLessonsCount += cat.lessons.length;
    }
    totalCurriculum += areaLessonsCount;

    const areaProgress = progressRecords.filter(p => p.lesson.category.areaId === area.id);
    const mastered = areaProgress.filter(p => p.status === 'MASTERED').length;
    const practicing = areaProgress.filter(p => p.status === 'PRACTICING').length;
    totalMastered += mastered;
    totalPracticing += practicing;

    const pct = areaLessonsCount > 0 ? Math.round((mastered / areaLessonsCount) * 100) : 0;

    return {
      areaId: area.id,
      areaName: area.name,
      color: area.color || '#1b3b2b',
      totalLessons: areaLessonsCount,
      masteredCount: mastered,
      practicingCount: practicing,
      percentage: pct
    };
  });

  const overallPct = totalCurriculum > 0 ? Math.round((totalMastered / totalCurriculum) * 100) : 0;

  return {
    computedAt: new Date().toISOString(),
    totalLessons: totalCurriculum,
    totalMastered,
    totalPracticing,
    overallPercentage: overallPct,
    areas: areaSummaries
  };
}

// 1. Get chronological timeline of reports for a student
app.get('/api/montessori/conferences/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const reports = await prisma.progressConferenceReport.findMany({
      where: {
        schoolId: req.school.id,
        studentId
      },
      include: {
        guide: { select: { id: true, fullName: true, email: true } },
        student: { select: { id: true, fullName: true, avatarUrl: true, grade: true } }
      },
      orderBy: { conferenceDate: 'desc' }
    });

    res.json(reports);
  } catch (e) {
    console.error('Error fetching student conference reports:', e);
    res.status(500).json({ error: e.message });
  }
});

// 2. Get single conference report detail
app.get('/api/montessori/conferences/:id', async (req, res) => {
  try {
    const report = await prisma.progressConferenceReport.findFirst({
      where: { id: req.params.id, schoolId: req.school.id },
      include: {
        guide: { select: { id: true, fullName: true, email: true } },
        student: {
          include: {
            environment: true,
            tutors: { include: { tutor: true } }
          }
        }
      }
    });

    if (!report) return res.status(404).json({ error: 'Informe de reunión no encontrado' });
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Create Conference Report
app.post('/api/montessori/conferences', async (req, res) => {
  try {
    const {
      studentId,
      guideUserId,
      termName,
      conferenceDate,
      executiveSummary = '',
      strengths = '',
      challenges = '',
      recommendationsHome = '',
      agreements = '',
      audioRecordingUrl = '',
      audioTranscription = '',
      attachments = [],
      attendees = '',
      status = 'PUBLISHED'
    } = req.body;

    if (!studentId || !termName) {
      return res.status(400).json({ error: 'studentId y termName son obligatorios' });
    }

    // Auto-compute mastery snapshot
    const masterySnapshot = await computeStudentMasterySnapshot(req.school.id, studentId);

    const report = await prisma.progressConferenceReport.create({
      data: {
        schoolId: req.school.id,
        studentId,
        guideUserId: guideUserId || undefined,
        termName,
        conferenceDate: conferenceDate ? new Date(conferenceDate) : new Date(),
        status,
        executiveSummary,
        strengths,
        challenges,
        recommendationsHome,
        agreements,
        masterySnapshot,
        audioRecordingUrl,
        audioTranscription,
        attachments: attachments || [],
        attendees: attendees || ''
      },
      include: {
        guide: { select: { id: true, fullName: true, email: true } },
        student: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    });

    res.json(report);
  } catch (e) {
    console.error('Error creating conference report:', e);
    res.status(500).json({ error: e.message });
  }
});

// 4. Update Conference Report
app.put('/api/montessori/conferences/:id', async (req, res) => {
  try {
    const {
      termName,
      conferenceDate,
      executiveSummary,
      strengths,
      challenges,
      recommendationsHome,
      agreements,
      audioRecordingUrl,
      audioTranscription,
      attachments,
      attendees,
      status
    } = req.body;

    const report = await prisma.progressConferenceReport.update({
      where: { id: req.params.id },
      data: {
        termName: termName || undefined,
        conferenceDate: conferenceDate ? new Date(conferenceDate) : undefined,
        executiveSummary: executiveSummary !== undefined ? executiveSummary : undefined,
        strengths: strengths !== undefined ? strengths : undefined,
        challenges: challenges !== undefined ? challenges : undefined,
        recommendationsHome: recommendationsHome !== undefined ? recommendationsHome : undefined,
        agreements: agreements !== undefined ? agreements : undefined,
        audioRecordingUrl: audioRecordingUrl !== undefined ? audioRecordingUrl : undefined,
        audioTranscription: audioTranscription !== undefined ? audioTranscription : undefined,
        attachments: attachments !== undefined ? attachments : undefined,
        attendees: attendees !== undefined ? attendees : undefined,
        status: status || undefined,
      },
      include: {
        guide: { select: { id: true, fullName: true, email: true } },
        student: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    });

    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Delete Conference Report
app.delete('/api/montessori/conferences/:id', async (req, res) => {
  try {
    await prisma.progressConferenceReport.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 6. AI Structuring Assistant
app.post('/api/montessori/conferences/ai-assist', async (req, res) => {
  try {
    const { rawNotes, studentName, termName } = req.body;
    if (!rawNotes || typeof rawNotes !== 'string') {
      return res.status(400).json({ error: 'rawNotes es requerido' });
    }

    // Heuristic & rule-based Montessori AI synthesizer
    const lines = rawNotes.split('\n').map(l => l.trim()).filter(Boolean);

    let strengthsArr = [];
    let challengesArr = [];
    let recsArr = [];
    let agreementsArr = [];

    // Analyze lines or structure based on keywords
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('reto') || lower.includes('dificultad') || lower.includes('cuesta') || lower.includes('atención') || lower.includes('distrae') || lower.includes('mejorar')) {
        challengesArr.push(line.replace(/^[-*•0-9.)\s]+/, ''));
      } else if (lower.includes('casa') || lower.includes('recomiend') || lower.includes('consejo') || lower.includes('pauta') || lower.includes('sugerencia') || lower.includes('rutina')) {
        recsArr.push(line.replace(/^[-*•0-9.)\s]+/, ''));
      } else if (lower.includes('acuerdo') || lower.includes('compromiso') || lower.includes('quedamos') || lower.includes('ambos') || lower.includes('meta')) {
        agreementsArr.push(line.replace(/^[-*•0-9.)\s]+/, ''));
      } else {
        strengthsArr.push(line.replace(/^[-*•0-9.)\s]+/, ''));
      }
    }

    const name = studentName || 'El infante';
    const executiveSummary = `Durante este período (${termName || 'Ciclo Activo'}), ${name} ha demostrado una evolución constructiva en su ambiente preparado, consolidando hábitos de trabajo autónomo, refinamiento motriz y socialización armónica con sus compañeros.`;

    const formattedStrengths = strengthsArr.length > 0
      ? strengthsArr.map(s => `• ${s}`).join('\n')
      : `• Alta concentración en actividades que involucran motricidad fina y sensorial.\n• Cuidado respetuoso del material de trabajo y del ambiente preparado.\n• Comunicación asertiva y disposición colaborativa en el círculo de trabajo.`;

    const formattedChallenges = challengesArr.length > 0
      ? challengesArr.map(c => `• ${c}`).join('\n')
      : `• Fortalecer los tiempos de transición entre una lección y la siguiente sin dispersión.\n• Consolidar la autocorrección serena ante el control de error sin requerir validación externa constante.`;

    const formattedRecs = recsArr.length > 0
      ? recsArr.map(r => `• ${r}`).join('\n')
      : `• Fomentar la independencia en casa permitiendo al niño vestirse, ordenar su habitación y colaborar en la mesa familiar.\n• Establecer rutinas de sueño y desconexión de pantallas para favorecer su atención en el aula.`;

    const formattedAgreements = agreementsArr.length > 0
      ? agreementsArr.map(a => `• ${a}`).join('\n')
      : `• La guía presentará nuevos materiales de extensión sensorial para sostener su curiosidad.\n• La familia reforzará las pautas de autonomía y orden en el hogar.`;

    res.json({
      executiveSummary,
      strengths: formattedStrengths,
      challenges: formattedChallenges,
      recommendationsHome: formattedRecs,
      agreements: formattedAgreements
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 7. Period-over-Period Comparator
app.get('/api/montessori/conferences/compare/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const reports = await prisma.progressConferenceReport.findMany({
      where: {
        schoolId: req.school.id,
        studentId
      },
      include: {
        guide: { select: { id: true, fullName: true } }
      },
      orderBy: { conferenceDate: 'asc' } // chronological order for comparison
    });

    if (reports.length === 0) {
      return res.json({ studentId, reportsCount: 0, timeline: [], comparison: [] });
    }

    // Map comparison timeline
    const comparison = reports.map((rep, idx) => {
      const prev = idx > 0 ? reports[idx - 1] : null;
      const currentSnapshot = rep.masterySnapshot || {};
      const prevSnapshot = prev?.masterySnapshot || {};

      const growthPct = prevSnapshot.overallPercentage !== undefined
        ? (currentSnapshot.overallPercentage || 0) - (prevSnapshot.overallPercentage || 0)
        : 0;

      return {
        reportId: rep.id,
        termName: rep.termName,
        conferenceDate: rep.conferenceDate,
        guideName: rep.guide?.fullName || 'Guía Titular',
        executiveSummary: rep.executiveSummary,
        strengths: rep.strengths,
        challenges: rep.challenges,
        recommendationsHome: rep.recommendationsHome,
        agreements: rep.agreements,
        audioRecordingUrl: rep.audioRecordingUrl,
        overallPercentage: currentSnapshot.overallPercentage || 0,
        totalMastered: currentSnapshot.totalMastered || 0,
        growthPercentageFromPrevious: growthPct,
        areas: currentSnapshot.areas || []
      };
    });

    res.json({
      studentId,
      reportsCount: reports.length,
      timeline: comparison
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// 360° STUDENT CHARACTERIZATION & MULTI-PERSPECTIVE COMPARATOR
// ==========================================

// 1. List Characterizations for Student
app.get('/api/montessori/characterizations/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const characterizations = await prisma.studentCharacterization.findMany({
      where: {
        studentId,
        schoolId: req.school.id
      },
      include: {
        authorUser: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { observationDate: 'desc' }
    });

    res.json(characterizations);
  } catch (e) {
    console.error('Error fetching characterizations:', e);
    res.status(500).json({ error: e.message });
  }
});

// 2. Create Characterization Entry
app.post('/api/montessori/characterizations', async (req, res) => {
  try {
    const {
      studentId,
      authorUserId,
      authorName,
      authorRole,
      contextArea,
      period,
      observationDate,
      independenceLevel,
      socialGraceLevel,
      focusRegulationLevel,
      curiosityEngagementLevel,
      autonomyCareNotes,
      socialGraceNotes,
      focusRegulationNotes,
      interestsPassionsNotes,
      anecdoteHighlight,
      tags
    } = req.body;

    if (!studentId || !authorName || !authorRole) {
      return res.status(400).json({ error: 'studentId, authorName y authorRole son requeridos' });
    }

    const created = await prisma.studentCharacterization.create({
      data: {
        schoolId: req.school.id,
        studentId,
        authorUserId: authorUserId || undefined,
        authorName,
        authorRole,
        contextArea: contextArea || 'GENERAL',
        period: period || 'ACTUAL',
        observationDate: observationDate ? new Date(observationDate) : new Date(),
        independenceLevel: Number(independenceLevel) || 3,
        socialGraceLevel: Number(socialGraceLevel) || 3,
        focusRegulationLevel: Number(focusRegulationLevel) || 3,
        curiosityEngagementLevel: Number(curiosityEngagementLevel) || 3,
        autonomyCareNotes: autonomyCareNotes || '',
        socialGraceNotes: socialGraceNotes || '',
        focusRegulationNotes: focusRegulationNotes || '',
        interestsPassionsNotes: interestsPassionsNotes || '',
        anecdoteHighlight: anecdoteHighlight || '',
        tags: Array.isArray(tags) ? tags : []
      },
      include: {
        authorUser: { select: { id: true, fullName: true, email: true } }
      }
    });

    res.json(created);
  } catch (e) {
    console.error('Error creating characterization:', e);
    res.status(500).json({ error: e.message });
  }
});

// 3. Update Characterization Entry
app.put('/api/montessori/characterizations/:id', async (req, res) => {
  try {
    const {
      authorName,
      authorRole,
      contextArea,
      period,
      observationDate,
      independenceLevel,
      socialGraceLevel,
      focusRegulationLevel,
      curiosityEngagementLevel,
      autonomyCareNotes,
      socialGraceNotes,
      focusRegulationNotes,
      interestsPassionsNotes,
      anecdoteHighlight,
      tags
    } = req.body;

    const updated = await prisma.studentCharacterization.update({
      where: { id: req.params.id },
      data: {
        authorName: authorName || undefined,
        authorRole: authorRole || undefined,
        contextArea: contextArea || undefined,
        period: period || undefined,
        observationDate: observationDate ? new Date(observationDate) : undefined,
        independenceLevel: independenceLevel !== undefined ? Number(independenceLevel) : undefined,
        socialGraceLevel: socialGraceLevel !== undefined ? Number(socialGraceLevel) : undefined,
        focusRegulationLevel: focusRegulationLevel !== undefined ? Number(focusRegulationLevel) : undefined,
        curiosityEngagementLevel: curiosityEngagementLevel !== undefined ? Number(curiosityEngagementLevel) : undefined,
        autonomyCareNotes: autonomyCareNotes !== undefined ? autonomyCareNotes : undefined,
        socialGraceNotes: socialGraceNotes !== undefined ? socialGraceNotes : undefined,
        focusRegulationNotes: focusRegulationNotes !== undefined ? focusRegulationNotes : undefined,
        interestsPassionsNotes: interestsPassionsNotes !== undefined ? interestsPassionsNotes : undefined,
        anecdoteHighlight: anecdoteHighlight !== undefined ? anecdoteHighlight : undefined,
        tags: tags !== undefined ? tags : undefined
      },
      include: {
        authorUser: { select: { id: true, fullName: true, email: true } }
      }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Delete Characterization Entry
app.delete('/api/montessori/characterizations/:id', async (req, res) => {
  try {
    await prisma.studentCharacterization.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Compare Perspectives Engine (Side-by-Side & Radar Aggregation)
app.get('/api/montessori/characterizations/compare/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const [student, entries] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, fullName: true, avatarUrl: true, grade: true }
      }),
      prisma.studentCharacterization.findMany({
        where: { studentId, schoolId: req.school.id },
        include: {
          authorUser: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { observationDate: 'asc' }
      })
    ]);

    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

    if (entries.length === 0) {
      return res.json({
        student,
        totalEntries: 0,
        averageDimensions: {
          independence: 0,
          socialGrace: 0,
          focusRegulation: 0,
          curiosityEngagement: 0,
          overallAverage: 0
        },
        roleBreakdown: [],
        entries: [],
        consensusHighlights: []
      });
    }

    // Compute Global Averages
    const sumIndep = entries.reduce((s, e) => s + e.independenceLevel, 0);
    const sumGrace = entries.reduce((s, e) => s + e.socialGraceLevel, 0);
    const sumFocus = entries.reduce((s, e) => s + e.focusRegulationLevel, 0);
    const sumCurio = entries.reduce((s, e) => s + e.curiosityEngagementLevel, 0);
    const count = entries.length;

    const avgIndep = Number((sumIndep / count).toFixed(1));
    const avgGrace = Number((sumGrace / count).toFixed(1));
    const avgFocus = Number((sumFocus / count).toFixed(1));
    const avgCurio = Number((sumCurio / count).toFixed(1));
    const overallAvg = Number(((avgIndep + avgGrace + avgFocus + avgCurio) / 4).toFixed(1));

    // Group by Role
    const roleGroups = {};
    entries.forEach(e => {
      if (!roleGroups[e.authorRole]) {
        roleGroups[e.authorRole] = [];
      }
      roleGroups[e.authorRole].push(e);
    });

    const roleBreakdown = Object.entries(roleGroups).map(([role, items]) => {
      const rCount = items.length;
      return {
        role,
        count: rCount,
        authors: Array.from(new Set(items.map(i => i.authorName))),
        avgIndependence: Number((items.reduce((s, i) => s + i.independenceLevel, 0) / rCount).toFixed(1)),
        avgSocialGrace: Number((items.reduce((s, i) => s + i.socialGraceLevel, 0) / rCount).toFixed(1)),
        avgFocusRegulation: Number((items.reduce((s, i) => s + i.focusRegulationLevel, 0) / rCount).toFixed(1)),
        avgCuriosity: Number((items.reduce((s, i) => s + i.curiosityEngagementLevel, 0) / rCount).toFixed(1)),
      };
    });

    // Extract all tags across entries
    const allTags = [];
    entries.forEach(e => {
      if (Array.isArray(e.tags)) {
        allTags.push(...e.tags);
      }
    });

    // Automatically Synthesize 360° Consensus Profile
    const roleLabels = {
      LEAD_GUIDE: 'Guía Titular',
      ASSISTANT_GUIDE: 'Guía Asistente',
      SUPPORT_STAFF: 'Personal de Apoyo (Comedor/Limpieza/Comunidad)',
      SPECIALIST: 'Especialista / Tallerista',
      ADMIN: 'Dirección'
    };

    const rolesIncluded = Array.from(new Set(entries.map(e => roleLabels[e.authorRole] || e.authorRole))).join(', ');
    const authors = entries.map(e => `${e.authorName} (${roleLabels[e.authorRole] || e.authorRole})`).join('; ');

    const autonomyNotes = entries.map(e => e.autonomyCareNotes).filter(Boolean).join(' | ');
    const socialNotes = entries.map(e => e.socialGraceNotes).filter(Boolean).join(' | ');
    const focusNotes = entries.map(e => e.focusRegulationNotes).filter(Boolean).join(' | ');
    const interestsNotes = entries.map(e => e.interestsPassionsNotes).filter(Boolean).join(' | ');
    const anecdotes = entries.map(e => e.anecdoteHighlight ? `"${e.anecdoteHighlight}" — ${e.authorName}` : '').filter(Boolean).join('\n');

    const consensusProfile = {
      title: `Caracterización Holística 360° de ${student.fullName}`,
      contributingRoles: rolesIncluded || 'Equipo Pedagógico',
      participatingAuthors: authors || 'Comunidad Docente',
      overallConsensus: `El equipo pedagógico y de comunidad escolar (${rolesIncluded || 'Guías y Asistentes'}) coincide en una visión integral de ${student.fullName}, destacando su desenvolvimiento positivo en múltiples ambientes del colegio.`,
      independenceSynthesis: autonomyNotes || `${student.fullName} muestra un proceso continuo de apropiación de su autonomía y cuidado del ambiente escolar.`,
      socialGraceSynthesis: socialNotes || `En las interacciones sociales y momentos comunitarios, se observan pautas consistentes de gracia, respeto y cortesía.`,
      focusSynthesis: focusNotes || `Manifiesta ciclos de trabajo definidos con momentos clave de concentración y autorregulación.`,
      interestsSynthesis: interestsNotes || `Demuestra curiosidad viva e inclinación natural por actividades exploratorias y aprendizaje activo.`,
      anecdotesSummary: anecdotes || 'Momentos de observación espontánea registrados en el día a día escolar.',
      pedagogicalStrategy: `Acompañar a ${student.fullName} manteniendo coherencia entre el salón Montessori y las áreas comunes, reforzando sus talentos naturales e impulsando su autorregulación.`
    };

    res.json({
      student,
      totalEntries: count,
      averageDimensions: {
        independence: avgIndep,
        socialGrace: avgGrace,
        focusRegulation: avgFocus,
        curiosityEngagement: avgCurio,
        overallAverage: overallAvg
      },
      roleBreakdown,
      entries,
      commonTags: Array.from(new Set(allTags)),
      consensusProfile
    });
  } catch (e) {
    console.error('Error in characterization comparator:', e);
    res.status(500).json({ error: e.message });
  }
});

// 6. AI Consensus Profile Synthesis (Explicit refresh)
app.post('/api/montessori/characterizations/ai-consensus/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const [student, entries] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, fullName: true, grade: true }
      }),
      prisma.studentCharacterization.findMany({
        where: { studentId, schoolId: req.school.id },
        orderBy: { observationDate: 'asc' }
      })
    ]);

    if (!student || entries.length === 0) {
      return res.status(400).json({ error: 'No hay suficientes caracterizaciones registradas para generar un consenso.' });
    }

    const roleLabels = {
      LEAD_GUIDE: 'Guía Titular',
      ASSISTANT_GUIDE: 'Guía Asistente',
      SUPPORT_STAFF: 'Personal de Apoyo (Comedor/Limpieza/Comunidad)',
      SPECIALIST: 'Especialista / Tallerista',
      ADMIN: 'Dirección'
    };

    const rolesIncluded = Array.from(new Set(entries.map(e => roleLabels[e.authorRole] || e.authorRole))).join(', ');
    const authors = entries.map(e => `${e.authorName} (${roleLabels[e.authorRole] || e.authorRole})`).join('; ');

    const autonomyNotes = entries.map(e => e.autonomyCareNotes).filter(Boolean).join(' | ');
    const socialNotes = entries.map(e => e.socialGraceNotes).filter(Boolean).join(' | ');
    const focusNotes = entries.map(e => e.focusRegulationNotes).filter(Boolean).join(' | ');
    const interestsNotes = entries.map(e => e.interestsPassionsNotes).filter(Boolean).join(' | ');
    const anecdotes = entries.map(e => e.anecdoteHighlight ? `"${e.anecdoteHighlight}" — ${e.authorName}` : '').filter(Boolean).join('\n');

    const synthesizedProfile = {
      title: `Caracterización Holística 360° de ${student.fullName}`,
      contributingRoles: rolesIncluded,
      participatingAuthors: authors,
      overallConsensus: `El equipo pedagógico y de comunidad escolar (${rolesIncluded}) coincide en una visión integral de ${student.fullName}, destacando su desenvolvimiento en múltiples ambientes del colegio.`,
      independenceSynthesis: autonomyNotes || `${student.fullName} muestra un proceso continuo de apropiación de su autonomía y cuidado del ambiente.`,
      socialGraceSynthesis: socialNotes || `En las interacciones sociales y momentos comunitarios, se observan pautas consistentes de gracia y cortesía.`,
      focusSynthesis: focusNotes || `Manifiesta ciclos de trabajo definidos con momentos clave de concentración y autorregulación.`,
      interestsSynthesis: interestsNotes || `Demuestra curiosidad viva e inclinación natural por actividades exploratorias.`,
      anecdotesSummary: anecdotes || 'Momentos de observación espontánea registrados en el día a día escolar.',
      pedagogicalStrategy: `Acompañar a ${student.fullName} manteniendo coherencia entre el salón Montessori y las áreas comunes, reforzando sus talentos naturales e impulsando su autorregulación.`
    };

    res.json(synthesizedProfile);
  } catch (e) {
    console.error('Error generating AI consensus:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==============================================================================
// SCHOOL FINANCES & CUSTOM TUITION PLANS API
// ==============================================================================

// Helper: Seed Default Fee Concepts and Template if empty
async function ensureDefaultFinancials(schoolId) {
  const count = await prisma.feeConcept.count({ where: { schoolId } });
  if (count === 0) {
    const matricula = await prisma.feeConcept.create({
      data: {
        schoolId,
        name: 'Matrícula Anual / Reinscripción',
        code: 'MAT-01',
        category: 'ENROLLMENT',
        frequency: 'ANNUAL',
        defaultAmount: 12000,
        description: 'Cuota de admisión y reserva de plaza para el ciclo escolar'
      }
    });

    const colegiatura = await prisma.feeConcept.create({
      data: {
        schoolId,
        name: 'Colegiatura Mensual',
        code: 'COL-01',
        category: 'TUITION',
        frequency: 'MONTHLY',
        defaultAmount: 8500,
        description: 'Cuota mensual por ciclo pedagógico y ambiente Montessori'
      }
    });

    const materiales = await prisma.feeConcept.create({
      data: {
        schoolId,
        name: 'Materiales Montessori & Libros',
        code: 'MAT-02',
        category: 'MATERIALS',
        frequency: 'ANNUAL',
        defaultAmount: 4500,
        description: 'Mantenimiento de material didáctico, consumibles y libros'
      }
    });

    const comedor = await prisma.feeConcept.create({
      data: {
        schoolId,
        name: 'Comedor Orgánico y Refrigerios',
        code: 'SER-01',
        category: 'MEALS',
        frequency: 'MONTHLY',
        defaultAmount: 2800,
        description: 'Alimentación balanceada orgánica elaborada en el colegio'
      }
    });

    // Create a base template for Casa de Niños
    await prisma.feePlanTemplate.create({
      data: {
        schoolId,
        name: 'Plan Estándar Casa de Niños 2025-2026',
        description: 'Plantilla base con 1 Matrícula, 1 Cuota de Materiales y 10 Colegiaturas de Septiembre a Junio',
        schoolYear: '2025-2026',
        environmentStage: 'CASA',
        isActive: true,
        batchDiscountPct: 10,
        promptPaymentDiscountPct: 5,
        promptPaymentDayLimit: 5,
        items: [
          { conceptId: matricula.id, conceptName: matricula.name, category: 'ENROLLMENT', baseAmount: 12000, quantity: 1, dueMonthOffset: 0 },
          { conceptId: materiales.id, conceptName: materiales.name, category: 'MATERIALS', baseAmount: 4500, quantity: 1, dueMonthOffset: 0 },
          { conceptId: colegiatura.id, conceptName: colegiatura.name, category: 'TUITION', baseAmount: 8500, quantity: 10, dueMonthOffset: 1 }
        ]
      }
    });
  }
}

// 1. Fee Concepts CRUD
app.get('/api/finance/concepts', async (req, res) => {
  try {
    await ensureDefaultFinancials(req.school.id);
    const concepts = await prisma.feeConcept.findMany({
      where: { schoolId: req.school.id },
      orderBy: { name: 'asc' }
    });
    res.json(concepts);
  } catch (e) {
    console.error('Error fetching fee concepts:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/finance/concepts', async (req, res) => {
  try {
    const { name, code, category, frequency, defaultAmount, description } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del concepto es requerido' });

    const concept = await prisma.feeConcept.create({
      data: {
        schoolId: req.school.id,
        name,
        code: code || '',
        category: category || 'TUITION',
        frequency: frequency || 'MONTHLY',
        defaultAmount: Number(defaultAmount) || 0,
        description: description || ''
      }
    });
    res.status(201).json(concept);
  } catch (e) {
    console.error('Error creating fee concept:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/finance/concepts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, frequency, defaultAmount, description } = req.body;
    const concept = await prisma.feeConcept.update({
      where: { id, schoolId: req.school.id },
      data: {
        name,
        code: code !== undefined ? code : undefined,
        category: category !== undefined ? category : undefined,
        frequency: frequency !== undefined ? frequency : undefined,
        defaultAmount: defaultAmount !== undefined ? Number(defaultAmount) : undefined,
        description: description !== undefined ? description : undefined
      }
    });
    res.json(concept);
  } catch (e) {
    console.error('Error updating fee concept:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/finance/concepts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.feeConcept.delete({ where: { id, schoolId: req.school.id } });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting fee concept:', e);
    res.status(500).json({ error: e.message });
  }
});

// 2. Fee Plan Templates CRUD
app.get('/api/finance/templates', async (req, res) => {
  try {
    await ensureDefaultFinancials(req.school.id);
    const templates = await prisma.feePlanTemplate.findMany({
      where: { schoolId: req.school.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (e) {
    console.error('Error fetching fee templates:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/finance/templates', async (req, res) => {
  try {
    const { name, description, schoolYear, environmentStage, items, batchDiscountPct, promptPaymentDiscountPct, promptPaymentDayLimit } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre de la plantilla es requerido' });

    const template = await prisma.feePlanTemplate.create({
      data: {
        schoolId: req.school.id,
        name,
        description: description || '',
        schoolYear: schoolYear || '2025-2026',
        environmentStage: environmentStage || 'CASA',
        isActive: true,
        items: items || [],
        batchDiscountPct: Number(batchDiscountPct) || 0,
        promptPaymentDiscountPct: Number(promptPaymentDiscountPct) || 0,
        promptPaymentDayLimit: Number(promptPaymentDayLimit) || 5
      }
    });
    res.status(201).json(template);
  } catch (e) {
    console.error('Error creating fee template:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/finance/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, schoolYear, environmentStage, items, batchDiscountPct, promptPaymentDiscountPct, promptPaymentDayLimit, isActive } = req.body;
    
    const template = await prisma.feePlanTemplate.update({
      where: { id, schoolId: req.school.id },
      data: {
        name,
        description: description !== undefined ? description : undefined,
        schoolYear: schoolYear !== undefined ? schoolYear : undefined,
        environmentStage: environmentStage !== undefined ? environmentStage : undefined,
        items: items !== undefined ? items : undefined,
        batchDiscountPct: batchDiscountPct !== undefined ? Number(batchDiscountPct) : undefined,
        promptPaymentDiscountPct: promptPaymentDiscountPct !== undefined ? Number(promptPaymentDiscountPct) : undefined,
        promptPaymentDayLimit: promptPaymentDayLimit !== undefined ? Number(promptPaymentDayLimit) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });
    res.json(template);
  } catch (e) {
    console.error('Error updating fee template:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/finance/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.feePlanTemplate.delete({ where: { id, schoolId: req.school.id } });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting fee template:', e);
    res.status(500).json({ error: e.message });
  }
});

// 3. Student Custom Fee Plans & Auto-Installment Generation
app.get('/api/finance/student-plans', async (req, res) => {
  try {
    const plans = await prisma.studentFeePlan.findMany({
      where: { schoolId: req.school.id },
      include: {
        student: { select: { id: true, fullName: true, avatarUrl: true, grade: true, enrollmentCode: true } },
        template: { select: { id: true, name: true } },
        installments: {
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(plans);
  } catch (e) {
    console.error('Error fetching student fee plans:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/finance/student-plans/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const plan = await prisma.studentFeePlan.findFirst({
      where: { studentId, schoolId: req.school.id, status: 'ACTIVE' },
      include: {
        student: { select: { id: true, fullName: true, avatarUrl: true, grade: true, enrollmentCode: true } },
        template: { select: { id: true, name: true, batchDiscountPct: true, promptPaymentDiscountPct: true, promptPaymentDayLimit: true } },
        installments: {
          orderBy: { dueDate: 'asc' }
        }
      }
    });
    res.json(plan || null);
  } catch (e) {
    console.error('Error fetching student plan:', e);
    res.status(500).json({ error: e.message });
  }
});

// Custom Plan Generator with Installments
app.post('/api/finance/student-plans/generate', async (req, res) => {
  try {
    const { 
      studentId, 
      templateId, 
      planName, 
      schoolYear, 
      paymentModality, // 'ANNUAL_BATCH', 'SEMIANNUAL', 'MONTHLY_10', 'MONTHLY_CUSTOM'
      installmentsCount, // e.g. 8, 10, 11, 12 mensualidades custom
      invoiceCutDay,    // e.g. 4 (Día de corte/facturación)
      dueDayLimit,      // e.g. 7 (Día límite sin recargo)
      lateFeePct,       // e.g. 10 (10% recargo por mora)
      allowLateFeeExemption, // boolean: crédito flexible / sin recargo
      discountPct,      // e.g. 15 for 15% Hermanos
      discountReason,   // e.g. "Beca Segundo Hermano"
      customItems,      // optional list of custom items
      notes
    } = req.body;

    if (!studentId) return res.status(400).json({ error: 'El estudiante es requerido' });

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

    let template = null;
    if (templateId) {
      template = await prisma.feePlanTemplate.findUnique({ where: { id: templateId } });
    }

    // Determine baseline items
    const items = customItems || (template && Array.isArray(template.items) ? template.items : [
      { conceptName: 'Matrícula Anual', category: 'ENROLLMENT', baseAmount: 12000, quantity: 1 },
      { conceptName: 'Materiales Montessori', category: 'MATERIALS', baseAmount: 4500, quantity: 1 },
      { conceptName: 'Colegiatura Mensual', category: 'TUITION', baseAmount: 8500, quantity: 10 }
    ]);

    // Deactivate previous active plans for this student in the same school year
    await prisma.studentFeePlan.updateMany({
      where: { studentId, schoolId: req.school.id, schoolYear: schoolYear || '2025-2026' },
      data: { status: 'CANCELLED' }
    });

    const modality = paymentModality || 'MONTHLY_10';
    const discPercent = Number(discountPct) || 0;
    const discReason = discountReason || (discPercent > 0 ? `Descuento Especial (${discPercent}%)` : '');

    const cutDay = Math.min(28, Math.max(1, Number(invoiceCutDay) || template?.invoiceCutDay || 4));
    const dueDay = Math.min(28, Math.max(cutDay, Number(dueDayLimit) || template?.dueDayLimit || 7));
    const isExempt = Boolean(allowLateFeeExemption);
    const feePercent = isExempt ? 0 : (lateFeePct !== undefined ? Number(lateFeePct) : (template?.lateFeePct || 10));

    // Determine number of monthly installments (e.g. 8, 10, 11, etc.)
    const tuitionItem = items.find(i => i.category === 'TUITION') || { baseAmount: 8500, quantity: 10 };
    const baseTuitionMonthly = Number(tuitionItem.baseAmount) || 8500;
    
    let totalTuitionMonths = Number(installmentsCount) > 0 ? Number(installmentsCount) : (Number(tuitionItem.quantity) || 10);
    if (modality === 'MONTHLY_10') totalTuitionMonths = 10;
    if (modality === 'MONTHLY_11') totalTuitionMonths = 11;
    if (modality === 'MONTHLY_12') totalTuitionMonths = 12;

    // Build installment objects
    const installmentPayloads = [];
    let grossTotal = 0;
    let discountTotal = 0;

    const startYear = parseInt((schoolYear || '2025-2026').split('-')[0], 10) || 2025;
    const monthNames = [
      'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto'
    ];

    // 1. Enrollment and Non-Tuition Items (Charged as one-time installments)
    const nonTuitionItems = items.filter(i => i.category !== 'TUITION');
    nonTuitionItems.forEach((it) => {
      const orig = Number(it.baseAmount) || 0;
      const itDisc = 0; 
      const net = orig - itDisc;
      grossTotal += orig;
      discountTotal += itDisc;

      installmentPayloads.push({
        schoolId: req.school.id,
        studentId,
        conceptName: it.conceptName || 'Cuota Escolar',
        category: it.category || 'OTHER',
        installmentNumber: 1,
        totalInstallments: 1,
        invoiceCutDate: new Date(startYear, 7, 1),
        dueDate: new Date(startYear, 7, 15), // August 15 before school start
        originalAmount: orig,
        discountAmount: itDisc,
        discountReason: '',
        netAmount: net,
        lateFeePct: 0,
        lateFeeAmount: 0,
        isLateFeeApplied: false,
        isLateFeeWaived: true,
        paidAmount: 0,
        status: 'PENDING'
      });
    });

    // 2. Tuition Items based on Modality
    if (modality === 'ANNUAL_BATCH') {
      // Annual Upfront Payment with Batch Discount
      const batchDiscPct = template?.batchDiscountPct || 10;
      const totalRawTuition = baseTuitionMonthly * totalTuitionMonths;
      const batchDiscAmount = Number((totalRawTuition * (batchDiscPct / 100)).toFixed(2));
      const customDiscAmount = Number(((totalRawTuition - batchDiscAmount) * (discPercent / 100)).toFixed(2));
      const totalDisc = batchDiscAmount + customDiscAmount;
      const netTuition = totalRawTuition - totalDisc;

      grossTotal += totalRawTuition;
      discountTotal += totalDisc;

      installmentPayloads.push({
        schoolId: req.school.id,
        studentId,
        conceptName: `Pago Anual Anticipado de Colegiaturas (${totalTuitionMonths} meses)`,
        category: 'TUITION',
        installmentNumber: 1,
        totalInstallments: 1,
        invoiceCutDate: new Date(startYear, 7, cutDay),
        dueDate: new Date(startYear, 7, 30), // August 30
        originalAmount: totalRawTuition,
        discountAmount: totalDisc,
        discountReason: `Descuento Pago Contado (${batchDiscPct}%)${discPercent > 0 ? ` + ${discReason}` : ''}`,
        netAmount: netTuition,
        lateFeePct: feePercent,
        lateFeeAmount: Number((netTuition * (feePercent / 100)).toFixed(2)),
        isLateFeeApplied: false,
        isLateFeeWaived: isExempt,
        paidAmount: 0,
        status: 'PENDING'
      });
    } else if (modality === 'SEMIANNUAL') {
      // 2 Semesters
      const semMonths = Math.ceil(totalTuitionMonths / 2);
      const semGross = baseTuitionMonthly * semMonths;
      const semDisc = Number((semGross * (discPercent / 100)).toFixed(2));
      const semNet = semGross - semDisc;

      for (let s = 1; s <= 2; s++) {
        grossTotal += semGross;
        discountTotal += semDisc;
        const dueMonthIdx = s === 1 ? 8 : 0; // Sept (8) or Jan (0)
        const dueYear = s === 1 ? startYear : startYear + 1;

        installmentPayloads.push({
          schoolId: req.school.id,
          studentId,
          conceptName: `Colegiatura Semestre ${s} (${semMonths} meses)`,
          category: 'TUITION',
          installmentNumber: s,
          totalInstallments: 2,
          invoiceCutDate: new Date(dueYear, dueMonthIdx, cutDay),
          dueDate: new Date(dueYear, dueMonthIdx, dueDay),
          originalAmount: semGross,
          discountAmount: semDisc,
          discountReason: discReason,
          netAmount: semNet,
          lateFeePct: feePercent,
          lateFeeAmount: Number((semNet * (feePercent / 100)).toFixed(2)),
          isLateFeeApplied: false,
          isLateFeeWaived: isExempt,
          paidAmount: 0,
          status: 'PENDING'
        });
      }
    } else {
      // Custom / Standard Monthly Installments (e.g. 8, 10, 11, 12)
      const monthlyDisc = Number((baseTuitionMonthly * (discPercent / 100)).toFixed(2));
      const monthlyNet = baseTuitionMonthly - monthlyDisc;
      const calculatedLateFeeAmount = Number((monthlyNet * (feePercent / 100)).toFixed(2));

      for (let m = 0; m < totalTuitionMonths; m++) {
        grossTotal += baseTuitionMonthly;
        discountTotal += monthlyDisc;
        
        // Month offset: m=0 is Sept, m=1 is Oct ... m=4 is Jan (next year)
        const currentMonthIdx = (8 + m) % 12;
        const currentYear = m < 4 ? startYear : startYear + 1;
        const monthLabel = monthNames[m] || `Mes ${m + 1}`;

        installmentPayloads.push({
          schoolId: req.school.id,
          studentId,
          conceptName: `Colegiatura ${monthLabel} ${currentYear}`,
          category: 'TUITION',
          installmentNumber: m + 1,
          totalInstallments: totalTuitionMonths,
          invoiceCutDate: new Date(currentYear, currentMonthIdx, cutDay),
          dueDate: new Date(currentYear, currentMonthIdx, dueDay),
          originalAmount: baseTuitionMonthly,
          discountAmount: monthlyDisc,
          discountReason: discReason,
          netAmount: monthlyNet,
          lateFeePct: feePercent,
          lateFeeAmount: calculatedLateFeeAmount,
          isLateFeeApplied: false,
          isLateFeeWaived: isExempt,
          paidAmount: 0,
          status: 'PENDING'
        });
      }
    }

    const netTotal = grossTotal - discountTotal;

    // Create the StudentFeePlan and Installments in a single transaction
    const newPlan = await prisma.studentFeePlan.create({
      data: {
        schoolId: req.school.id,
        studentId,
        templateId: templateId || null,
        planName: planName || `Plan Personalizado • ${student.fullName} (${schoolYear || '2025-2026'})`,
        schoolYear: schoolYear || '2025-2026',
        paymentModality: modality,
        installmentsCount: totalTuitionMonths,
        invoiceCutDay: cutDay,
        dueDayLimit: dueDay,
        lateFeePct: feePercent,
        allowLateFeeExemption: isExempt,
        currency: 'MXN',
        totalGrossAmount: grossTotal,
        totalDiscountAmount: discountTotal,
        totalNetAmount: netTotal,
        notes: notes || (discReason ? `Acuerdo: ${discReason}` : '') + (isExempt ? ' [Crédito / Sin recargo por mora]' : ''),
        status: 'ACTIVE',
        installments: {
          create: installmentPayloads
        }
      },
      include: {
        installments: { orderBy: { dueDate: 'asc' } },
        student: true
      }
    });

    res.status(201).json(newPlan);
  } catch (e) {
    console.error('Error generating student fee plan:', e);
    res.status(500).json({ error: e.message });
  }
});

// Delete a plan and its installments
app.delete('/api/finance/student-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.studentFeePlan.delete({
      where: { id, schoolId: req.school.id }
    });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting student fee plan:', e);
    res.status(500).json({ error: e.message });
  }
});

// 4. Installments & Payments (Estado de Cuenta & Dashboard Financiero)
app.get('/api/finance/installments', async (req, res) => {
  try {
    const installments = await prisma.feeInstallment.findMany({
      where: { schoolId: req.school.id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            status: true,
            grade: true,
            environment: {
              select: { id: true, name: true, color: true }
            }
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { installmentNumber: 'asc' }
      ]
    });

    const now = new Date();
    const formatted = installments.map(inst => {
      const isOverdue = inst.status === 'PENDING' && new Date(inst.dueDate) < now;
      const isLateApplied = isOverdue && !inst.isLateFeeWaived && inst.lateFeePct > 0;
      return {
        ...inst,
        isOverdue,
        isLateFeeApplied: isLateApplied,
        effectiveTotal: isLateApplied ? inst.netAmount + inst.lateFeeAmount : inst.netAmount
      };
    });

    res.json(formatted);
  } catch (e) {
    console.error('Error fetching all installments:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/finance/installments/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const installments = await prisma.feeInstallment.findMany({
      where: { studentId, schoolId: req.school.id },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    // Dynamically mark overdue and calculate late fee
    const formatted = installments.map(inst => {
      const isOverdue = inst.status === 'PENDING' && new Date(inst.dueDate) < now;
      const isLateApplied = isOverdue && !inst.isLateFeeWaived && inst.lateFeePct > 0;
      return {
        ...inst,
        isOverdue,
        isLateFeeApplied: isLateApplied,
        effectiveTotal: isLateApplied ? inst.netAmount + inst.lateFeeAmount : inst.netAmount
      };
    });

    res.json(formatted);
  } catch (e) {
    console.error('Error fetching installments:', e);
    res.status(500).json({ error: e.message });
  }
});

// Toggle Late Fee Waiver on an installment (Condonar recargo / otorgar crédito puntual)
app.post('/api/finance/installments/:id/toggle-late-fee-waiver', async (req, res) => {
  try {
    const { id } = req.params;
    const installment = await prisma.feeInstallment.findUnique({
      where: { id, schoolId: req.school.id }
    });
    if (!installment) return res.status(404).json({ error: 'Cuota no encontrada' });

    const updated = await prisma.feeInstallment.update({
      where: { id },
      data: {
        isLateFeeWaived: !installment.isLateFeeWaived
      }
    });

    res.json(updated);
  } catch (e) {
    console.error('Error toggling late fee waiver:', e);
    res.status(500).json({ error: e.message });
  }
});

// Record a Payment on an installment
app.post('/api/finance/installments/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentMethod, paymentReference, receiptUrl, notes, markAsPaid } = req.body;

    const installment = await prisma.feeInstallment.findUnique({
      where: { id, schoolId: req.school.id }
    });
    if (!installment) return res.status(404).json({ error: 'Cuota no encontrada' });

    const amount = paidAmount !== undefined ? Number(paidAmount) : installment.netAmount;
    const isFull = amount >= installment.netAmount;

    const updated = await prisma.feeInstallment.update({
      where: { id },
      data: {
        paidAmount: amount,
        status: markAsPaid === false ? 'PENDING' : (isFull ? 'PAID' : 'PARTIAL'),
        paidAt: new Date(),
        paymentMethod: paymentMethod || 'TRANSFER',
        paymentReference: paymentReference || '',
        receiptUrl: receiptUrl !== undefined ? receiptUrl : installment.receiptUrl,
        notes: notes !== undefined ? notes : installment.notes
      }
    });

    res.json(updated);
  } catch (e) {
    console.error('Error recording payment:', e);
    res.status(500).json({ error: e.message });
  }
});

// Cancel / Revert recorded payment on an installment
app.post('/api/finance/installments/:id/cancel-payment', async (req, res) => {
  try {
    const { id } = req.params;

    const installment = await prisma.feeInstallment.findUnique({
      where: { id, schoolId: req.school.id }
    });
    if (!installment) return res.status(404).json({ error: 'Cuota no encontrada' });

    const isOverdue = new Date() > new Date(installment.dueDate);

    const updated = await prisma.feeInstallment.update({
      where: { id },
      data: {
        paidAmount: 0,
        status: isOverdue ? 'OVERDUE' : 'PENDING',
        paidAt: null,
        paymentMethod: '',
        paymentReference: '',
        receiptUrl: '',
        notes: installment.notes ? `${installment.notes} [Pago anulado el ${new Date().toLocaleDateString('es-MX')}]` : ''
      }
    });

    res.json(updated);
  } catch (e) {
    console.error('Error canceling payment:', e);
    res.status(500).json({ error: e.message });
  }
});

// Update installment details (due date, discount, etc.)
app.put('/api/finance/installments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { conceptName, dueDate, originalAmount, discountAmount, discountReason, netAmount, status, notes } = req.body;

    const updated = await prisma.feeInstallment.update({
      where: { id, schoolId: req.school.id },
      data: {
        conceptName: conceptName !== undefined ? conceptName : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        originalAmount: originalAmount !== undefined ? Number(originalAmount) : undefined,
        discountAmount: discountAmount !== undefined ? Number(discountAmount) : undefined,
        discountReason: discountReason !== undefined ? discountReason : undefined,
        netAmount: netAmount !== undefined ? Number(netAmount) : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined
      }
    });
    res.json(updated);
  } catch (e) {
    console.error('Error updating installment:', e);
    res.status(500).json({ error: e.message });
  }
});

// Tutor Account Statement Aggregator
app.get('/api/finance/tutor/account-statement', async (req, res) => {
  try {
    const tutorEmail = req.query.email || req.headers['x-user-email'];
    if (!tutorEmail) return res.status(400).json({ error: 'Email de tutor requerido' });

    // Find students associated with this tutor
    const tutorUser = await prisma.user.findFirst({
      where: { email: String(tutorEmail).toLowerCase() },
      include: {
        studentLinks: {
          include: {
            student: {
              include: {
                feePlans: {
                  where: { status: 'ACTIVE' },
                  include: {
                    installments: { orderBy: { dueDate: 'asc' } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!tutorUser) {
      return res.json({ students: [] });
    }

    const now = new Date();
    const statementStudents = (tutorUser.studentLinks || []).map(ts => {
      const stu = ts.student;
      const activePlan = stu.feePlans[0] || null;
      const rawInstallments = activePlan ? activePlan.installments : [];

      const installments = rawInstallments.map(inst => {
        const isOverdue = inst.status === 'PENDING' && new Date(inst.dueDate) < now;
        const isLateApplied = isOverdue && !inst.isLateFeeWaived && inst.lateFeePct > 0;
        return {
          ...inst,
          isOverdue,
          isLateFeeApplied: isLateApplied,
          effectiveTotal: isLateApplied ? inst.netAmount + inst.lateFeeAmount : inst.netAmount
        };
      });

      const totalCharged = installments.reduce((s, i) => s + i.effectiveTotal, 0);
      const totalPaid = installments.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.paidAmount || i.netAmount), 0);
      const totalPending = totalCharged - totalPaid;
      const nextDue = installments.find(i => i.status === 'PENDING' || i.status === 'PARTIAL') || null;

      return {
        studentId: stu.id,
        fullName: stu.fullName,
        avatarUrl: stu.avatarUrl,
        grade: stu.grade,
        enrollmentCode: stu.enrollmentCode,
        relationship: ts.relationship,
        activePlan,
        summary: {
          totalGross: activePlan?.totalGrossAmount || 0,
          totalDiscount: activePlan?.totalDiscountAmount || 0,
          totalCharged,
          totalPaid,
          totalPending: Math.max(0, totalPending),
          totalInstallments: installments.length,
          paidInstallmentsCount: installments.filter(i => i.status === 'PAID').length,
          nextDue
        },
        installments
      };
    });

    let schoolData = req.school;
    if (!schoolData && tutorUser?.schoolId) {
      schoolData = await prisma.school.findUnique({ where: { id: tutorUser.schoolId } });
    }
    if (!schoolData) {
      schoolData = await prisma.school.findFirst();
    }

    res.json({
      school: {
        id: schoolData?.id || '',
        name: schoolData?.name || 'Ceiba Montessori',
        primaryColor: schoolData?.primaryColor || '#1b3b2b',
        phone: schoolData?.phone || '+52 998 350 2849',
        email: schoolData?.email || 'contacto@ceibamontessori.edu.mx'
      },
      students: statementStudents
    });
  } catch (e) {
    console.error('Error fetching tutor account statement:', e);
    res.status(500).json({ error: e.message });
  }
});

// ================= NEWSLETTERS & COMUNICADOS API =================

// Helper to calculate newsletter target recipients
async function getNewsletterRecipients(schoolId, { targetType, targetAudience, targetEnvironmentIds, specificEmails }) {
  const recipientsMap = new Map(); // email -> { name, email, role, studentName, environmentName }
  const envIds = Array.isArray(targetEnvironmentIds) ? targetEnvironmentIds : [];
  const audience = targetAudience || 'PARENTS_AND_STAFF';

  const includeParents = audience === 'PARENTS' || audience === 'PARENTS_AND_STAFF';
  const includeStaff = audience === 'STAFF' || audience === 'PARENTS_AND_STAFF';

  // Helper to extract parent / guardian contacts from students
  const addStudentParents = (students) => {
    for (const student of students) {
      const studentName = student.fullName || 'Estudiante';
      const environmentName = student.environment?.name || undefined;

      // 1. Linked User Tutors
      if (Array.isArray(student.tutors)) {
        for (const st of student.tutors) {
          const tutorUser = st.tutor;
          if (tutorUser?.email && tutorUser.email.trim()) {
            const email = tutorUser.email.trim().toLowerCase();
            const name = tutorUser.fullName || `${tutorUser.firstName || ''} ${tutorUser.lastName || ''}`.trim() || tutorUser.email;
            if (!recipientsMap.has(email)) {
              recipientsMap.set(email, {
                email,
                name,
                role: 'TUTOR',
                studentName,
                environmentName
              });
            }
          }
        }
      }

      // 2. Authorized Contacts with email
      if (student.authorizedContacts) {
        try {
          const contacts = typeof student.authorizedContacts === 'string'
            ? JSON.parse(student.authorizedContacts)
            : (Array.isArray(student.authorizedContacts) ? student.authorizedContacts : []);
          
          if (Array.isArray(contacts)) {
            for (const c of contacts) {
              const email = (c.email || '').trim().toLowerCase();
              if (email && email.includes('@')) {
                const name = c.fullName || c.name || email;
                if (!recipientsMap.has(email)) {
                  recipientsMap.set(email, {
                    email,
                    name,
                    role: 'TUTOR',
                    studentName,
                    environmentName
                  });
                }
              }
            }
          }
        } catch (_) {}
      }
    }
  };

  // 1. ALL_SCHOOL
  if (targetType === 'ALL_SCHOOL') {
    if (includeParents) {
      const students = await prisma.student.findMany({
        where: {
          schoolId,
          status: { not: 'ARCHIVED' }
        },
        include: {
          environment: true,
          tutors: {
            include: {
              tutor: true
            }
          }
        }
      });
      addStudentParents(students);
    }

    if (includeStaff) {
      const memberships = await prisma.schoolMembership.findMany({
        where: { schoolId },
        include: { user: true }
      });

      for (const m of memberships) {
        if (m.user?.email && m.user.email.trim()) {
          const email = m.user.email.trim().toLowerCase();
          const name = m.user.fullName || `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || m.user.email;
          if (!recipientsMap.has(email)) {
            recipientsMap.set(email, {
              email,
              name,
              role: 'STAFF',
              environmentName: 'Personal Escolar'
            });
          }
        }
      }
    }
  }

  // 2. ENVIRONMENTS (Selected Salones)
  else if (targetType === 'ENVIRONMENTS') {
    if (envIds.length > 0) {
      if (includeParents) {
        const students = await prisma.student.findMany({
          where: {
            schoolId,
            environmentId: { in: envIds },
            status: { not: 'ARCHIVED' }
          },
          include: {
            environment: true,
            tutors: {
              include: {
                tutor: true
              }
            }
          }
        });
        addStudentParents(students);
      }

      if (includeStaff) {
        const envGuides = await prisma.environmentGuide.findMany({
          where: {
            environmentId: { in: envIds }
          },
          include: {
            user: true,
            environment: true
          }
        });

        for (const eg of envGuides) {
          if (eg.user?.email && eg.user.email.trim()) {
            const email = eg.user.email.trim().toLowerCase();
            const name = eg.user.fullName || `${eg.user.firstName || ''} ${eg.user.lastName || ''}`.trim() || eg.user.email;
            if (!recipientsMap.has(email)) {
              recipientsMap.set(email, {
                email,
                name,
                role: 'STAFF',
                environmentName: eg.environment?.name || 'Guía de Ambiente'
              });
            }
          }
        }
      }
    }
  }

  // 3. STAFF_ONLY
  else if (targetType === 'STAFF_ONLY') {
    if (envIds.length > 0) {
      const envGuides = await prisma.environmentGuide.findMany({
        where: { environmentId: { in: envIds } },
        include: { user: true, environment: true }
      });
      for (const eg of envGuides) {
        if (eg.user?.email && eg.user.email.trim()) {
          const email = eg.user.email.trim().toLowerCase();
          const name = eg.user.fullName || `${eg.user.firstName || ''} ${eg.user.lastName || ''}`.trim() || eg.user.email;
          if (!recipientsMap.has(email)) {
            recipientsMap.set(email, {
              email,
              name,
              role: 'STAFF',
              environmentName: eg.environment?.name || 'Guía de Ambiente'
            });
          }
        }
      }
    } else {
      const memberships = await prisma.schoolMembership.findMany({
        where: { schoolId },
        include: { user: true }
      });
      for (const m of memberships) {
        if (m.user?.email && m.user.email.trim()) {
          const email = m.user.email.trim().toLowerCase();
          const name = m.user.fullName || `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || m.user.email;
          if (!recipientsMap.has(email)) {
            recipientsMap.set(email, {
              email,
              name,
              role: 'STAFF',
              environmentName: 'Personal Escolar'
            });
          }
        }
      }
    }
  }

  // 4. SPECIFIC_CONTACTS
  else if (targetType === 'SPECIFIC_CONTACTS') {
    const rawList = Array.isArray(specificEmails) ? specificEmails : [];
    for (const item of rawList) {
      const email = typeof item === 'string' ? item.trim().toLowerCase() : (item?.email || '').trim().toLowerCase();
      const name = typeof item === 'string' ? item : (item?.name || item?.email || 'Contacto');
      if (email && email.includes('@')) {
        if (!recipientsMap.has(email)) {
          recipientsMap.set(email, {
            email,
            name,
            role: 'MANUAL',
            environmentName: 'Lista Personalizada'
          });
        }
      }
    }
  }

  return Array.from(recipientsMap.values());
}

// Helper to resolve an image into an inline MIME CID attachment for Nodemailer
async function resolveImageForEmail(imageUrl, defaultCidName) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  // 1. If it's already a base64 string
  if (trimmed.startsWith('data:image/')) {
    const matches = trimmed.match(/^data:image\/([^;]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] || 'png';
      return {
        cid: defaultCidName,
        filename: `${defaultCidName}.${ext}`,
        content: Buffer.from(matches[2], 'base64'),
        contentType: `image/${ext}`
      };
    }
  }

  try {
    let cleanPath = trimmed;
    if (cleanPath.startsWith('http://localhost') || cleanPath.startsWith('http://127.0.0.1')) {
      try {
        const u = new URL(cleanPath);
        cleanPath = u.pathname;
      } catch (_) {}
    }

    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }

    // Check in public/
    const publicPath = path.join(publicDir, cleanPath);
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
      const ext = path.extname(publicPath).toLowerCase().replace('.', '') || 'png';
      const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
      const buf = fs.readFileSync(publicPath);
      return {
        cid: defaultCidName,
        filename: `${defaultCidName}.${ext}`,
        content: buf,
        contentType: mime
      };
    }

    // Check in galleryDir
    const gPath = path.join(galleryDir, path.basename(cleanPath));
    if (fs.existsSync(gPath) && fs.statSync(gPath).isFile()) {
      const ext = path.extname(gPath).toLowerCase().replace('.', '') || 'png';
      const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
      const buf = fs.readFileSync(gPath);
      return {
        cid: defaultCidName,
        filename: `${defaultCidName}.${ext}`,
        content: buf,
        contentType: mime
      };
    }

    // Check in documentsDir
    const dPath = path.join(documentsDir, path.basename(cleanPath));
    if (fs.existsSync(dPath) && fs.statSync(dPath).isFile()) {
      const ext = path.extname(dPath).toLowerCase().replace('.', '') || 'png';
      const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
      const buf = fs.readFileSync(dPath);
      return {
        cid: defaultCidName,
        filename: `${defaultCidName}.${ext}`,
        content: buf,
        contentType: mime
      };
    }

    // Remote URL (http/https)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const response = await fetch(trimmed);
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const mime = response.headers.get('content-type') || 'image/png';
        const ext = mime.split('/')[1] || 'png';
        return {
          cid: defaultCidName,
          filename: `${defaultCidName}.${ext}`,
          content: Buffer.from(arrayBuf),
          contentType: mime
        };
      }
    }
  } catch (err) {
    console.error(`Error resolving image ${imageUrl} for CID:`, err);
  }

  return null;
}

// Helper to format HTML email for newsletters
function renderNewsletterEmail(newsletter, school, recipient, inlineImages = {}) {
  const primaryColor = school.primaryColor || '#1b3b2b';
  const secondaryColor = school.secondaryColor || '#10b981';
  const schoolName = school.name || 'Comunidad Montessori';
  const recipientName = recipient.name || 'Estimada Familia';
  const studentName = recipient.studentName || 'su hijo/a';
  const environmentName = recipient.environmentName || 'la comunidad escolar';
  const recipientEmail = recipient.email || '';
  const formattedDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const schoolYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  let bodyHtml = newsletter.contentHtml || '';
  // Dynamic Replacements
  bodyHtml = bodyHtml.replace(/{{nombre_destinatario}}/gi, recipientName);
  bodyHtml = bodyHtml.replace(/{{nombre_tutor}}/gi, recipientName);
  bodyHtml = bodyHtml.replace(/{{destinatario}}/gi, recipientName);
  bodyHtml = bodyHtml.replace(/{{estudiante}}/gi, studentName);
  bodyHtml = bodyHtml.replace(/{{alumno}}/gi, studentName);
  bodyHtml = bodyHtml.replace(/{{hijo}}/gi, studentName);
  bodyHtml = bodyHtml.replace(/{{ambiente}}/gi, environmentName);
  bodyHtml = bodyHtml.replace(/{{salon}}/gi, environmentName);
  bodyHtml = bodyHtml.replace(/{{escuela}}/gi, schoolName);
  bodyHtml = bodyHtml.replace(/{{colegio}}/gi, schoolName);
  bodyHtml = bodyHtml.replace(/{{email_destinatario}}/gi, recipientEmail);
  bodyHtml = bodyHtml.replace(/{{email}}/gi, recipientEmail);
  bodyHtml = bodyHtml.replace(/{{fecha}}/gi, formattedDate);
  bodyHtml = bodyHtml.replace(/{{año_escolar}}/gi, schoolYear);
  bodyHtml = bodyHtml.replace(/{{ciclo_escolar}}/gi, schoolYear);

  const logoSrc = inlineImages.logoCid ? `cid:${inlineImages.logoCid}` : (school.logoUrl || '');
  const coverSrc = inlineImages.coverCid ? `cid:${inlineImages.coverCid}` : (newsletter.coverImageUrl || '');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${newsletter.subject || newsletter.title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; }
    .email-wrapper { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background-color: ${primaryColor}; color: #ffffff; padding: 32px 32px 28px; text-align: center; }
    .school-logo-container { margin-bottom: 14px; text-align: center; }
    .school-logo { max-height: 64px; max-width: 220px; border-radius: 12px; display: inline-block; object-fit: contain; background: #ffffff; padding: 6px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
    .school-name { font-size: 20px; font-weight: bold; letter-spacing: 0.5px; margin: 0; color: #ffffff; }
    .school-tagline { font-size: 11px; opacity: 0.9; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.2px; color: #ffffff; }
    .cover-image { width: 100%; max-height: 280px; object-fit: cover; display: block; }
    .content { padding: 32px 32px 24px; }
    .preheader { font-size: 13px; color: #64748b; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 20px; line-height: 1.3; }
    .body-text { font-size: 15px; color: #334155; line-height: 1.7; margin-bottom: 24px; }
    .body-text p { margin: 0 0 16px; }
    .body-text h2, .body-text h3 { color: ${primaryColor}; margin: 24px 0 12px; }
    .body-text ul, .body-text ol { margin: 0 0 16px; padding-left: 24px; }
    .body-text blockquote { border-left: 4px solid ${secondaryColor}; padding: 12px 18px; margin: 18px 0; background: #f0fdf4; border-radius: 0 12px 12px 0; color: #166534; font-style: italic; }
    .body-text a.cta-button { display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; padding: 12px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin: 12px 0; }
    .author-block { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; }
    .footer { background-color: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  ${newsletter.preheader ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${newsletter.preheader}</div>` : ''}
  <div class="email-wrapper">
    <div class="header">
      ${logoSrc ? `
        <div class="school-logo-container">
          <img src="${logoSrc}" alt="${schoolName}" class="school-logo">
        </div>
      ` : ''}
      <h1 class="school-name">${schoolName}</h1>
      <div class="school-tagline">Boletín Informativo & Comunicado Oficial</div>
    </div>
    ${coverSrc ? `<img src="${coverSrc}" alt="${newsletter.title}" class="cover-image">` : ''}
    <div class="content">
      ${newsletter.preheader ? `<div class="preheader">${newsletter.preheader}</div>` : ''}
      <h2 class="title">${newsletter.title}</h2>
      <div class="body-text">
        ${bodyHtml}
      </div>
      ${Array.isArray(newsletter.attachments) && newsletter.attachments.length > 0 ? `
        <div style="margin-top: 24px; padding: 18px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 10px; color: ${primaryColor}; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
            📎 Archivos Adjuntos (${newsletter.attachments.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${newsletter.attachments.map(att => `
              <div style="padding: 8px 12px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: #1e293b;">${att.fileName}</span>
                <span style="color: #64748b; font-size: 11px;">${Math.round((att.fileSize || 0) / 1024)} KB</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${newsletter.authorName ? `
        <div class="author-block">
          <strong>Publicado por:</strong> ${newsletter.authorName}
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;"><strong>${schoolName}</strong></p>
      ${school.address ? `<p style="margin: 0 0 4px;">${school.address}</p>` : ''}
      <p style="margin: 0;">Este es un comunicado oficial emitido por la administración escolar.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Dispatch newsletter execution engine (delegates to BullMQ queue in production or direct async runner in dev)
async function dispatchNewsletter(newsletterId) {
  return await dispatchNewsletterJob(newsletterId, prisma);
}

// Background scheduler runner (checks every 30 seconds for scheduled newsletters)
setInterval(async () => {
  try {
    const now = new Date();
    const scheduledNewsletters = await prisma.newsletter.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now }
      }
    });

    for (const item of scheduledNewsletters) {
      console.log(`[SCHEDULER] Triggering scheduled newsletter dispatch: "${item.title}" (${item.id})`);
      await dispatchNewsletter(item.id);
    }
  } catch (err) {
    console.error('Error in background newsletter scheduler:', err);
  }
}, 30000);

// GET /api/newsletters - List all newsletters for current school
app.get('/api/newsletters', async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {
      schoolId: req.school.id,
      ...(status && status !== 'ALL' && { status: String(status) }),
      ...(search && {
        OR: [
          { title: { contains: String(search), mode: 'insensitive' } },
          { subject: { contains: String(search), mode: 'insensitive' } },
          { authorName: { contains: String(search), mode: 'insensitive' } }
        ]
      })
    };

    const newsletters = await prisma.newsletter.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(newsletters);
  } catch (e) {
    console.error('Error fetching newsletters:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/newsletters/:id - Get single newsletter
app.get('/api/newsletters/:id', async (req, res) => {
  try {
    const newsletter = await prisma.newsletter.findFirst({
      where: { id: req.params.id, schoolId: req.school.id }
    });
    if (!newsletter) return res.status(404).json({ error: 'Boletín no encontrado' });
    res.json(newsletter);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/newsletters/calculate-recipients - Calculate recipient preview
app.post('/api/newsletters/calculate-recipients', async (req, res) => {
  try {
    const { targetType, targetAudience, targetEnvironmentIds, specificEmails } = req.body;
    const recipients = await getNewsletterRecipients(req.school.id, {
      targetType: targetType || 'ALL_SCHOOL',
      targetAudience: targetAudience || 'PARENTS_AND_STAFF',
      targetEnvironmentIds,
      specificEmails
    });
    res.json({ count: recipients.length, recipients });
  } catch (e) {
    console.error('Error calculating newsletter recipients:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/newsletters - Create newsletter
app.post('/api/newsletters', async (req, res) => {
  try {
    const {
      title,
      subject,
      preheader,
      contentHtml,
      contentJson,
      coverImageUrl,
      authorName,
      attachments,
      targetType,
      targetAudience,
      targetEnvironmentIds,
      specificEmails,
      status,
      scheduledAt
    } = req.body;

    const cleanTitle = (title || '').trim();
    if (!cleanTitle) {
      return res.status(400).json({ error: 'El título del boletín es obligatorio' });
    }

    const calculatedRecipients = await getNewsletterRecipients(req.school.id, {
      targetType: targetType || 'ALL_SCHOOL',
      targetAudience: targetAudience || 'PARENTS_AND_STAFF',
      targetEnvironmentIds,
      specificEmails
    });

    const isSendingNow = status === 'SEND_NOW';
    const finalStatus = isSendingNow ? 'SENDING' : (status === 'SCHEDULED' && scheduledAt ? 'SCHEDULED' : 'DRAFT');

    const newsletter = await prisma.newsletter.create({
      data: {
        schoolId: req.school.id,
        title: cleanTitle,
        subject: (subject || title || '').trim(),
        preheader: preheader ? String(preheader).trim() : null,
        contentHtml: contentHtml || '',
        contentJson: contentJson || {},
        coverImageUrl: coverImageUrl ? String(coverImageUrl).trim() : null,
        authorName: authorName ? String(authorName).trim() : (req.user?.firstName || 'Equipo Directivo'),
        attachments: attachments || [],
        targetType: targetType || 'ALL_SCHOOL',
        targetAudience: targetAudience || 'PARENTS_AND_STAFF',
        targetEnvironmentIds: targetEnvironmentIds || [],
        specificEmails: specificEmails || [],
        status: finalStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalRecipients: calculatedRecipients.length
      }
    });

    if (isSendingNow) {
      // Async dispatch without blocking response
      dispatchNewsletter(newsletter.id).catch(err => console.error('Async dispatch error:', err));
    }

    res.json(newsletter);
  } catch (e) {
    console.error('Error creating newsletter:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/newsletters/:id - Update newsletter
app.put('/api/newsletters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subject,
      preheader,
      contentHtml,
      contentJson,
      coverImageUrl,
      authorName,
      attachments,
      targetType,
      targetAudience,
      targetEnvironmentIds,
      specificEmails,
      status,
      scheduledAt
    } = req.body;

    const existing = await prisma.newsletter.findFirst({
      where: { id, schoolId: req.school.id }
    });
    if (!existing) return res.status(404).json({ error: 'Boletín no encontrado' });

    const calculatedRecipients = await getNewsletterRecipients(req.school.id, {
      targetType: targetType || existing.targetType,
      targetAudience: targetAudience || existing.targetAudience,
      targetEnvironmentIds: targetEnvironmentIds !== undefined ? targetEnvironmentIds : existing.targetEnvironmentIds,
      specificEmails: specificEmails !== undefined ? specificEmails : existing.specificEmails
    });

    const isSendingNow = status === 'SEND_NOW';
    const finalStatus = isSendingNow
      ? 'SENDING'
      : (status === 'SCHEDULED' && scheduledAt ? 'SCHEDULED' : (status || existing.status));

    const updated = await prisma.newsletter.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title || '').trim() : undefined,
        subject: subject !== undefined ? String(subject || title || '').trim() : undefined,
        preheader: preheader !== undefined ? (preheader ? String(preheader).trim() : null) : undefined,
        contentHtml: contentHtml !== undefined ? contentHtml : undefined,
        contentJson: contentJson !== undefined ? contentJson : undefined,
        coverImageUrl: coverImageUrl !== undefined ? (coverImageUrl ? String(coverImageUrl).trim() : null) : undefined,
        authorName: authorName !== undefined ? (authorName ? String(authorName).trim() : null) : undefined,
        attachments: attachments !== undefined ? attachments : undefined,
        targetType: targetType !== undefined ? targetType : undefined,
        targetAudience: targetAudience !== undefined ? targetAudience : undefined,
        targetEnvironmentIds: targetEnvironmentIds !== undefined ? targetEnvironmentIds : undefined,
        specificEmails: specificEmails !== undefined ? specificEmails : undefined,
        status: finalStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : (status === 'DRAFT' ? null : undefined),
        totalRecipients: calculatedRecipients.length
      }
    });

    if (isSendingNow) {
      dispatchNewsletter(updated.id).catch(err => console.error('Async dispatch error:', err));
    }

    res.json(updated);
  } catch (e) {
    console.error('Error updating newsletter:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/newsletters/:id - Delete newsletter
app.delete('/api/newsletters/:id', async (req, res) => {
  try {
    await prisma.newsletter.deleteMany({
      where: { id: req.params.id, schoolId: req.school.id }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/newsletters/:id/send-now - Immediate send
app.post('/api/newsletters/:id/send-now', async (req, res) => {
  try {
    const newsletter = await prisma.newsletter.findFirst({
      where: { id: req.params.id, schoolId: req.school.id }
    });
    if (!newsletter) return res.status(404).json({ error: 'Boletín no encontrado' });

    dispatchNewsletter(newsletter.id).catch(err => console.error('Async dispatch error:', err));
    res.json({ success: true, message: 'Envío de boletín iniciado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/newsletters/:id/send-test - Send test copy (via BullMQ queue in prod or direct in dev)
app.post('/api/newsletters/:id/send-test', async (req, res) => {
  try {
    const { testEmail } = req.body;
    if (!testEmail || !testEmail.trim()) {
      return res.status(400).json({ error: 'Debe ingresar un correo electrónico de destino para la prueba.' });
    }

    const newsletter = await prisma.newsletter.findFirst({
      where: { id: req.params.id, schoolId: req.school.id }
    });
    if (!newsletter) return res.status(404).json({ error: 'Boletín no encontrado' });

    await sendNewsletterTestJob({
      newsletterId: req.params.id,
      testEmail: testEmail.trim(),
      schoolId: req.school.id
    }, prisma);

    res.json({ success: true, message: `Correo de prueba procesado para ${testEmail.trim()}.` });
  } catch (e) {
    console.error('Error sending test newsletter:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/newsletters/:id/cancel-schedule
app.post('/api/newsletters/:id/cancel-schedule', async (req, res) => {
  try {
    const updated = await prisma.newsletter.updateMany({
      where: { id: req.params.id, schoolId: req.school.id, status: 'SCHEDULED' },
      data: { status: 'DRAFT', scheduledAt: null }
    });
    res.json({ success: true, updatedCount: updated.count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tutor/newsletters - List newsletters visible to tutor
app.get('/api/tutor/newsletters', async (req, res) => {
  try {
    // Get tutor's students and environments
    const userEmail = req.user?.email?.trim().toLowerCase();
    if (!userEmail) {
      return res.json([]);
    }

    const tutorRecords = await prisma.studentTutor.findMany({
      where: {
        email: { equals: userEmail, mode: 'insensitive' }
      },
      include: {
        student: true
      }
    });

    const schoolId = req.school?.id;
    const environmentIds = tutorRecords.map(t => t.student?.environmentId).filter(Boolean);

    const newsletters = await prisma.newsletter.findMany({
      where: {
        schoolId,
        status: 'SENT',
        OR: [
          { targetType: 'ALL_SCHOOL', targetAudience: { in: ['PARENTS', 'PARENTS_AND_STAFF'] } },
          { targetType: 'ENVIRONMENTS', targetAudience: { in: ['PARENTS', 'PARENTS_AND_STAFF'] } }
        ]
      },
      orderBy: { sentAt: 'desc' }
    });

    // Filter environment-specific ones
    const filtered = newsletters.filter(n => {
      if (n.targetType === 'ALL_SCHOOL') return true;
      if (n.targetType === 'ENVIRONMENTS') {
        const targetEnvs = Array.isArray(n.targetEnvironmentIds) ? n.targetEnvironmentIds : [];
        return targetEnvs.some(id => environmentIds.includes(id));
      }
      return false;
    });

    res.json(filtered);
  } catch (e) {
    console.error('Error fetching tutor newsletters:', e);
    res.status(500).json({ error: e.message });
  }
});

// BULLBOARD REDIS QUEUES DASHBOARD MOUNT
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const activeQueues = [];
try {
  const emailQueue = getEmailQueue();
  if (emailQueue) {
    activeQueues.push(new BullMQAdapter(emailQueue));
  }
} catch (e) {
  console.warn('[BULL BOARD] Email queue not active:', e.message);
}

try {
  const kycQueue = getKycQueue();
  if (kycQueue) {
    activeQueues.push(new BullMQAdapter(kycQueue));
  }
} catch (e) {
  console.warn('[BULL BOARD] KYC queue not active:', e.message);
}

if (activeQueues.length > 0) {
  createBullBoard({
    queues: activeQueues,
    serverAdapter
  });
  app.use('/admin/queues', serverAdapter.getRouter());
  console.log('📊 [BULL BOARD] Dashboard mounted at /admin/queues');
} else {
  console.warn('📊 [BULL BOARD] No active queues found. Dashboard not initialized.');
}

// Fallback for SPA routing
app.use((req, res) => {
  const indexPath = path.join(rootDir, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('CEIBA Roots Backend Multi-Tenant API Server Running.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Multi-Tenant Core API Server listening on http://localhost:${PORT}`);
  console.log(`📁 Physical Gallery Directory: ${galleryDir}`);
  console.log(`📁 Physical Documents Directory: ${documentsDir}`);
});
