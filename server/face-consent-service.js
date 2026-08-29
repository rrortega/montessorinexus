import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pico from 'picojs';
import sharp from 'sharp';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getStorageConfigForSchool } from './storage-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PicoJS Cascade Classifier
let facefinderClassifyRegion = null;

try {
  const cascadePath = path.join(__dirname, 'data', 'facefinder');
  if (fs.existsSync(cascadePath)) {
    const cascadeBuffer = fs.readFileSync(cascadePath);
    const bytes = new Int8Array(cascadeBuffer);
    facefinderClassifyRegion = pico.unpack_cascade(bytes);
    console.log('✅ [FACE CONSENT SERVICE] PicoJS facefinder cascade loaded successfully.');
  } else {
    console.warn('⚠️ [FACE CONSENT SERVICE] Cascade file not found at:', cascadePath);
  }
} catch (err) {
  console.error('❌ [FACE CONSENT SERVICE] Failed to load PicoJS cascade facefinder model:', err);
}

/**
 * Resolves a local or remote URL/path to a Buffer
 * Supports: Base64 data URLs, HTTP/HTTPS URLs, /api/storage/ paths, storage/cache/, storage/ and public/ files.
 */
export async function resolveImageBuffer(src, schoolId = null, prisma = null) {
  if (!src || typeof src !== 'string') return null;

  const trimmed = src.trim();

  // 1. Data URL
  if (trimmed.startsWith('data:image')) {
    const commaIdx = trimmed.indexOf(',');
    const base64Data = commaIdx >= 0 ? trimmed.substring(commaIdx + 1) : trimmed;
    return Buffer.from(base64Data, 'base64');
  }

  // 2. HTTP/HTTPS Remote URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const response = await fetch(trimmed);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (err) {
      console.warn(`[FACE CONSENT] Failed to fetch remote image ${trimmed}:`, err.message);
    }
  }

  // 3. Extract and normalize clean relative path
  let relativePath = trimmed;
  if (relativePath.startsWith('/api/storage/')) {
    relativePath = relativePath.replace(/^\/api\/storage\/?/, '');
  } else if (relativePath.startsWith('/storage/')) {
    relativePath = relativePath.replace(/^\/storage\/?/, '');
  } else if (relativePath.startsWith('/')) {
    relativePath = relativePath.slice(1);
  }

  const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');
  const filename = path.basename(cleanPath);

  // 4. Try local candidates (fast disk & cache hits)
  const localCandidates = [
    path.join(process.cwd(), 'storage', 'cache', cleanPath),
    path.join(process.cwd(), 'storage', cleanPath),
    path.join(process.cwd(), 'public', cleanPath),
    path.join(process.cwd(), 'public', 'gallery', filename),
    path.join(process.cwd(), 'public', filename),
    path.join(process.cwd(), cleanPath),
    path.resolve(cleanPath)
  ];

  for (const candidate of localCandidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return fs.readFileSync(candidate);
      }
    } catch {}
  }

  // 5. If remote S3/MinIO driver is configured for school
  try {
    const pathSchoolId = cleanPath.startsWith('schools/') ? cleanPath.split('/')[1] : null;
    const targetSchoolId = pathSchoolId || schoolId;
    if (targetSchoolId) {
      const config = await getStorageConfigForSchool(targetSchoolId, prisma);
      if (config && (config.driver === 's3' || config.driver === 'minio') && config.s3Bucket) {
        const s3 = new S3Client({
          region: config.s3Region || 'us-east-1',
          endpoint: config.s3Endpoint || undefined,
          credentials: {
            accessKeyId: config.s3AccessKeyId,
            secretAccessKey: config.s3SecretAccessKey
          },
          forcePathStyle: config.s3ForcePathStyle
        });

        const s3Keys = [
          cleanPath,
          cleanPath.replace(/^schools\/[^\/]+\//, ''),
          `schools/${targetSchoolId}/${cleanPath}`
        ];

        for (const key of s3Keys) {
          try {
            const obj = await s3.send(new GetObjectCommand({
              Bucket: config.s3Bucket,
              Key: key
            }));
            const chunks = [];
            for await (const chunk of obj.Body) {
              chunks.push(chunk);
            }
            return Buffer.concat(chunks);
          } catch {}
        }
      }
    }
  } catch (err) {
    console.warn(`[FACE CONSENT] Storage remote fetch error for ${cleanPath}:`, err.message);
  }

  // 6. Loopback HTTP request fallback if running Express server has the asset route
  if (trimmed.startsWith('/')) {
    try {
      const port = process.env.PORT || 3001;
      const loopbackUrl = `http://127.0.0.1:${port}${trimmed}`;
      const res = await fetch(loopbackUrl);
      if (res.ok) {
        const arr = await res.arrayBuffer();
        return Buffer.from(arr);
      }
    } catch {}
  }

  return null;
}

/**
 * Runs PicoJS face detection on an image buffer and returns face bounding boxes
 */
export async function detectFacesInImage(imageBuffer) {
  if (!facefinderClassifyRegion || !imageBuffer) {
    return { faces: [], width: 0, height: 0 };
  }

  try {
    // Standardize image orientation and scale down if needed for fast detection
    const image = sharp(imageBuffer).rotate();
    const metadata = await image.metadata();
    const origWidth = metadata.width || 800;
    const origHeight = metadata.height || 600;

    const maxDim = 1000;
    const scale = Math.min(1, maxDim / Math.max(origWidth, origHeight));
    const targetW = Math.round(origWidth * scale);
    const targetH = Math.round(origHeight * scale);

    const { data: grayPixels } = await image
      .resize(targetW, targetH, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const minsize = Math.max(20, Math.round(Math.min(targetW, targetH) * 0.04));
    const maxsize = Math.min(targetW, targetH);

    let dets = pico.run_cascade(
      {
        pixels: grayPixels,
        nrows: targetH,
        ncols: targetW,
        ldim: targetW
      },
      facefinderClassifyRegion,
      {
        shiftfactor: 0.1,
        minsize,
        maxsize,
        scalefactor: 1.1
      }
    );

    dets = pico.cluster_detections(dets, 0.25);
    // Score >= 3.5 gives solid balance of high recall and minimal false positives
    const confident = dets.filter(d => d[3] >= 3.5);

    const faces = confident.map(det => {
      const rowScaled = det[0]; // Y center
      const colScaled = det[1]; // X center
      const sizeScaled = det[2]; // diameter
      const score = det[3];

      // Project back to original dimensions
      const size = Math.round(sizeScaled / scale);
      const col = Math.round(colScaled / scale);
      const row = Math.round(rowScaled / scale);

      const x = Math.max(0, Math.round(col - size / 2));
      const y = Math.max(0, Math.round(row - size / 2));
      const width = Math.min(origWidth - x, size);
      const height = Math.min(origHeight - y, size);

      return {
        box: {
          x,
          y,
          width,
          height,
          xPercent: Number(((x / origWidth) * 100).toFixed(2)),
          yPercent: Number(((y / origHeight) * 100).toFixed(2)),
          wPercent: Number(((width / origWidth) * 100).toFixed(2)),
          hPercent: Number(((height / origHeight) * 100).toFixed(2))
        },
        score: Number(score.toFixed(2))
      };
    });

    return { faces, width: origWidth, height: origHeight };
  } catch (err) {
    console.error('[FACE CONSENT] Error in detectFacesInImage:', err);
    return { faces: [], width: 0, height: 0 };
  }
}

/**
 * Extracts a normalized 64x64 grayscale feature vector and spatial block descriptor from a face crop
 */
async function extractNormalizedFaceFeature(imageBuffer, box) {
  try {
    let pipeline = sharp(imageBuffer).rotate();
    if (box && box.width > 0 && box.height > 0) {
      pipeline = pipeline.extract({
        left: Math.max(0, Math.round(box.x)),
        top: Math.max(0, Math.round(box.y)),
        width: Math.max(10, Math.round(box.width)),
        height: Math.max(10, Math.round(box.height))
      });
    }

    // Resize to standard 64x64 grayscale
    const { data: rawPixels } = await pipeline
      .resize(64, 64, { fit: 'fill' })
      .grayscale()
      .normalize() // contrast normalization
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Compute mean and standard deviation
    let sum = 0;
    const n = rawPixels.length;
    for (let i = 0; i < n; i++) {
      sum += rawPixels[i];
    }
    const mean = sum / n;

    let varSum = 0;
    for (let i = 0; i < n; i++) {
      const diff = rawPixels[i] - mean;
      varSum += diff * diff;
    }
    const std = Math.sqrt(varSum / n) || 1;

    // 4x4 spatial block averages (16 cells)
    const blockMeans = new Float32Array(16);
    const blockSize = 16;
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        let bSum = 0;
        for (let py = 0; py < blockSize; py++) {
          for (let px = 0; px < blockSize; px++) {
            const idx = (by * blockSize + py) * 64 + (bx * blockSize + px);
            bSum += rawPixels[idx];
          }
        }
        blockMeans[by * 4 + bx] = bSum / (blockSize * blockSize);
      }
    }

    return { rawPixels, mean, std, blockMeans };
  } catch (err) {
    return null;
  }
}

/**
 * Computes face similarity between two extracted face descriptors (0 to 1.0)
 */
function computeFaceSimilarity(featA, featB) {
  if (!featA || !featB) return 0;

  // 1. Normalized Cross-Correlation (NCC)
  const n = featA.rawPixels.length;
  let dot = 0;
  for (let i = 0; i < n; i++) {
    dot += (featA.rawPixels[i] - featA.mean) * (featB.rawPixels[i] - featB.mean);
  }
  const ncc = Math.max(0, dot / (featA.std * featB.std * n));

  // 2. Spatial Block Distance
  let blockDiffSum = 0;
  for (let b = 0; b < 16; b++) {
    blockDiffSum += Math.abs(featA.blockMeans[b] - featB.blockMeans[b]);
  }
  const avgBlockDiff = blockDiffSum / 16;
  const blockSim = Math.max(0, 1 - avgBlockDiff / 90);

  // Weighted combination
  const combined = 0.65 * ncc + 0.35 * blockSim;
  return Math.min(1, Math.max(0, combined));
}

/**
 * Checks student's consent records for photo/media permission
 */
export function checkStudentPhotoConsent(consentsRaw) {
  if (!consentsRaw) {
    return { hasConsent: false, consentNotes: 'Sin consentimientos registrados en expediente' };
  }

  let consentsList = [];
  if (Array.isArray(consentsRaw)) {
    consentsList = consentsRaw;
  } else if (typeof consentsRaw === 'string') {
    try {
      consentsList = JSON.parse(consentsRaw);
    } catch {
      consentsList = [];
    }
  }

  if (!Array.isArray(consentsList) || consentsList.length === 0) {
    return { hasConsent: false, consentNotes: 'Sin consentimientos registrados' };
  }

  // Look for photo/image consent: 'consent_media_socials' or any matching media/foto/imagen
  const mediaConsent = consentsList.find(c =>
    c.templateId === 'consent_media_socials' ||
    (c.templateId && (c.templateId.includes('media') || c.templateId.includes('imagen') || c.templateId.includes('foto')))
  );

  if (!mediaConsent) {
    // If not specifically answered, default to false for strict child safety
    return { hasConsent: false, consentNotes: 'Consentimiento de imagen no especificado por el tutor' };
  }

  const isGranted = Boolean(mediaConsent.granted);
  return {
    hasConsent: isGranted,
    consentNotes: mediaConsent.notes || (isGranted ? 'Autorizado por el tutor' : 'Tutor no autorizó uso de imagen')
  };
}

/**
 * Generates an edited version of the image with circular Gaussian blur on faces without consent
 */
export async function generateBlurredGalleryImage(originalBuffer, facesToBlur, imageId) {
  if (!originalBuffer || !Array.isArray(facesToBlur) || facesToBlur.length === 0) {
    return null;
  }

  try {
    const origImage = sharp(originalBuffer).rotate();
    const metadata = await origImage.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const composites = [];

    for (const face of facesToBlur) {
      const box = face.box;
      if (!box || box.width <= 0 || box.height <= 0) continue;

      // Expand bounding box slightly for complete facial coverage (20% margin)
      const padX = Math.round(box.width * 0.20);
      const padY = Math.round(box.height * 0.20);

      const cropX = Math.max(0, box.x - padX);
      const cropY = Math.max(0, box.y - padY);
      const cropW = Math.min(width - cropX, box.width + padX * 2);
      const cropH = Math.min(height - cropY, box.height + padY * 2);

      if (cropW <= 4 || cropH <= 4) continue;

      const rx = (cropW / 2).toFixed(2);
      const ry = (cropH / 2).toFixed(2);
      const cx = rx;
      const cy = ry;

      // Clean SVG radial feather with 100% transparent exterior (Direct ellipse, no outer rect/matte)
      const maskSvg = Buffer.from(`
        <svg width="${cropW}" height="${cropH}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="featherGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
              <stop offset="65%" stop-color="#ffffff" stop-opacity="1" />
              <stop offset="85%" stop-color="#ffffff" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#featherGrad)" />
        </svg>
      `);

      // Extract, blur heavily, guarantee RGBA alpha channel, and cut into a smooth circle
      const blurredFaceBuffer = await sharp(originalBuffer)
        .rotate()
        .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
        .ensureAlpha()
        .blur(36) // Deep Gaussian blur
        .composite([{ input: maskSvg, blend: 'dest-in' }])
        .png()
        .toBuffer();

      composites.push({
        input: blurredFaceBuffer,
        left: cropX,
        top: cropY
      });
    }

    if (composites.length === 0) return null;

    const blurredResultBuffer = await origImage
      .composite(composites)
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    // Ensure output directory exists in public/gallery
    const galleryDir = path.join(process.cwd(), 'public', 'gallery');
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }

    // Clean up any previously generated blurred files for this image ID
    try {
      const existingFiles = fs.readdirSync(galleryDir);
      const idClean = imageId.replace(/[^a-zA-Z0-9_-]/g, '');
      for (const f of existingFiles) {
        if (f.startsWith('blurred_') && f.includes(`_${idClean}`)) {
          try { fs.unlinkSync(path.join(galleryDir, f)); } catch {}
        }
      }
    } catch {}

    const filename = `blurred_${Date.now()}_${imageId.replace(/[^a-zA-Z0-9_-]/g, '')}.jpg`;
    const outputPath = path.join(galleryDir, filename);
    fs.writeFileSync(outputPath, blurredResultBuffer);

    return `/gallery/${filename}`;
  } catch (err) {
    console.error('[FACE CONSENT] Error generating blurred image:', err);
    return null;
  }
}

/**
 * Main function to process a single gallery image:
 * 1. Detects faces in the image.
 * 2. Compares detected faces against all students in the school with profile pictures.
 * 3. Identifies students, bounding boxes, and consent permissions.
 * 4. Generates a blurred version if any student has negative consent.
 * 5. Updates the database record.
 */
export async function processGalleryImageFaceConsent(imageId, schoolId, prisma) {
  console.log(`\n🔍 [FACE CONSENT WORKER] Starting face consent scan for Image ID: ${imageId} (School: ${schoolId})`);

  try {
    const galleryImage = await prisma.galleryImage.findUnique({
      where: { id: imageId }
    });

    if (!galleryImage) {
      console.warn(`[FACE CONSENT] Gallery image ${imageId} not found.`);
      return { success: false, reason: 'Image not found' };
    }

    const imgBuffer = await resolveImageBuffer(galleryImage.src, schoolId, prisma);
    if (!imgBuffer) {
      console.warn(`[FACE CONSENT] Could not load image buffer for ${galleryImage.src}`);
      await prisma.galleryImage.update({
        where: { id: imageId },
        data: {
          consentStatus: 'no_faces',
          detectedFaces: '[]',
          hasConsentIssues: false
        }
      });
      return { success: false, reason: 'Image buffer unresolvable' };
    }

    // 1. Detect faces in Gallery Image
    const detectionResult = await detectFacesInImage(imgBuffer);
    const detectedFacesList = detectionResult.faces || [];
    console.log(`📸 [FACE CONSENT] Detected ${detectedFacesList.length} face(s) in image ${imageId}`);

    if (detectedFacesList.length === 0) {
      await prisma.galleryImage.update({
        where: { id: imageId },
        data: {
          consentStatus: 'no_faces',
          detectedFaces: '[]',
          hasConsentIssues: false,
          blurredSrc: null
        }
      });
      return { success: true, facesCount: 0, consentStatus: 'no_faces' };
    }

    // 2. Fetch all active students in this school to compare avatars
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        status: { not: 'archived' }
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        consents: true,
        environment: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // 3. Pre-extract student face features for comparison
    const studentDescriptors = [];
    for (const student of students) {
      if (!student.avatarUrl || student.avatarUrl.trim() === '') continue;

      const avatarBuf = await resolveImageBuffer(student.avatarUrl, schoolId, prisma);
      if (!avatarBuf) continue;

      // Detect face in avatar or use center crop
      const avatarDetection = await detectFacesInImage(avatarBuf);
      let faceBox = null;
      if (avatarDetection.faces && avatarDetection.faces.length > 0) {
        faceBox = avatarDetection.faces[0].box;
      }

      const feature = await extractNormalizedFaceFeature(avatarBuf, faceBox);
      if (feature) {
        studentDescriptors.push({
          student,
          feature
        });
      }
    }

    console.log(`🧑‍🎓 [FACE CONSENT] Loaded ${studentDescriptors.length} student avatar reference(s) for comparison`);

    // 4. Compare each detected face in gallery image against student descriptors
    const processedFaces = [];
    let hasAnyConsentIssue = false;
    const facesToBlur = [];

    for (let i = 0; i < detectedFacesList.length; i++) {
      const faceDet = detectedFacesList[i];
      const faceFeature = await extractNormalizedFaceFeature(imgBuffer, faceDet.box);

      let bestMatch = null;
      let highestSimilarity = 0;

      if (faceFeature && studentDescriptors.length > 0) {
        for (const candidate of studentDescriptors) {
          const sim = computeFaceSimilarity(faceFeature, candidate.feature);
          if (sim > highestSimilarity) {
            highestSimilarity = sim;
            bestMatch = candidate.student;
          }
        }
      }

      // Matching threshold (0.54 is reliable with multi-metric correlation)
      const isMatched = highestSimilarity >= 0.54 && bestMatch !== null;
      let studentInfo = null;
      let consentResult = { hasConsent: true, consentNotes: 'No requiere consentimiento (rostro no identificado)' };

      if (isMatched && bestMatch) {
        consentResult = checkStudentPhotoConsent(bestMatch.consents);
        studentInfo = {
          id: bestMatch.id,
          name: bestMatch.fullName,
          avatarUrl: bestMatch.avatarUrl || null,
          environmentName: bestMatch.environment?.name || null,
          confidence: Number(highestSimilarity.toFixed(2))
        };

        if (!consentResult.hasConsent) {
          hasAnyConsentIssue = true;
          facesToBlur.push({
            ...faceDet,
            studentName: bestMatch.fullName
          });
        }
      }

      processedFaces.push({
        box: faceDet.box,
        score: faceDet.score,
        isIdentified: isMatched,
        studentId: studentInfo ? studentInfo.id : null,
        studentName: studentInfo ? studentInfo.name : 'Persona no identificada',
        avatarUrl: studentInfo ? studentInfo.avatarUrl : null,
        environmentName: studentInfo ? studentInfo.environmentName : null,
        confidence: studentInfo ? studentInfo.confidence : null,
        hasConsent: consentResult.hasConsent,
        consentNotes: consentResult.consentNotes,
        isBlurred: !consentResult.hasConsent
      });
    }

    // 5. Generate blurred image if there are consent issues
    let blurredSrc = null;
    if (hasAnyConsentIssue && facesToBlur.length > 0) {
      console.log(`🛡️ [FACE CONSENT] Generating blurred privacy version for ${facesToBlur.length} student(s) without consent...`);
      blurredSrc = await generateBlurredGalleryImage(imgBuffer, facesToBlur, imageId);
    }

    const consentStatus = hasAnyConsentIssue ? 'has_violations' : 'verified_clean';

    // 6. Update database record
    const updatedImage = await prisma.galleryImage.update({
      where: { id: imageId },
      data: {
        consentStatus,
        detectedFaces: JSON.stringify(processedFaces),
        blurredSrc,
        hasConsentIssues: hasAnyConsentIssue
      }
    });

    console.log(`✅ [FACE CONSENT] Image ${imageId} processed. Status: ${consentStatus}. Faces: ${processedFaces.length}. Has Violations: ${hasAnyConsentIssue}`);

    return {
      success: true,
      consentStatus,
      facesCount: processedFaces.length,
      hasConsentIssues: hasAnyConsentIssue,
      blurredSrc,
      image: updatedImage
    };
  } catch (err) {
    console.error(`❌ [FACE CONSENT] Error processing image ${imageId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Scans all gallery images of a school for face consent
 */
export async function scanAllGalleryImagesForConsents(schoolId, prisma) {
  const images = await prisma.galleryImage.findMany({
    where: { schoolId },
    select: { id: true }
  });

  console.log(`🚀 [FACE CONSENT SCAN] Enqueuing batch consent check for ${images.length} images in school ${schoolId}`);

  const results = [];
  for (const img of images) {
    const res = await processGalleryImageFaceConsent(img.id, schoolId, prisma);
    results.push({ imageId: img.id, ...res });
  }

  return { total: images.length, results };
}
