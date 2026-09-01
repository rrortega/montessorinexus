import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  HeadBucketCommand,
  CreateBucketCommand
} from '@aws-sdk/client-s3';
import { ZipArchive } from 'archiver';
import { isBlogImage, isSaaSBlogRequest, getOrGenerateSignedBlogFile } from './blog-watermark-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Private Storage Directory (Completely outside public/ directory)
export const DEFAULT_LOCAL_ROOT = path.join(__dirname, '../storage');

if (!fs.existsSync(DEFAULT_LOCAL_ROOT)) {
  fs.mkdirSync(DEFAULT_LOCAL_ROOT, { recursive: true });
}

// Local Cache Directory for S3/MinIO Assets to guarantee ultra-fast delivery and offline caching
export const STORAGE_CACHE_DIR = path.join(DEFAULT_LOCAL_ROOT, 'cache');
if (!fs.existsSync(STORAGE_CACHE_DIR)) {
  fs.mkdirSync(STORAGE_CACHE_DIR, { recursive: true });
}

export function getCachedFilePath(cleanPath) {
  return path.join(STORAGE_CACHE_DIR, cleanPath);
}

export function saveToLocalCache(cleanPath, buffer) {
  try {
    const cachedPath = getCachedFilePath(cleanPath);
    const targetDir = path.dirname(cachedPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(cachedPath, buffer);
  } catch (err) {
    console.warn(`[STORAGE CACHE WARNING] Failed to cache ${cleanPath}:`, err.message);
  }
}

export function deleteFromLocalCache(cleanPath) {
  try {
    const cachedPath = getCachedFilePath(cleanPath);
    if (fs.existsSync(cachedPath)) {
      fs.unlinkSync(cachedPath);
    }
  } catch (err) {
    // Ignore cache cleanup errors
  }
}

const STORAGE_SIGN_SECRET = process.env.STORAGE_SIGN_SECRET || process.env.JWT_SECRET || 'nexus-super-secure-storage-key-2026';

/**
 * Checks if a relative storage path is classified as public media (Web Builder, Gallery, Brand, Icons)
 */
export function isPublicStorageMedia(relativePath) {
  if (!relativePath) return false;
  const cleanPath = String(relativePath).toLowerCase().replace(/\\/g, '/');

  // Explicit private paths (Forms, Admissions, Documents, KYC, RRHH, etc.) are ALWAYS private
  if (
    cleanPath.includes('/forms/') ||
    cleanPath.includes('/admissions/') ||
    cleanPath.includes('/rrhh/') ||
    cleanPath.includes('/private/') ||
    cleanPath.includes('/documents/')
  ) {
    return false;
  }

  // Explicit public web folders (Web Builder, Public Gallery, Feed, Stickers, Brand, Theme assets, Blog)
  return (
    cleanPath.startsWith('public/') ||
    cleanPath.includes('/public/') ||
    cleanPath.includes('/gallery/') || 
    cleanPath.includes('/feed/') ||
    cleanPath.includes('/stickers/') || 
    cleanPath.includes('/hero') || 
    cleanPath.includes('/brand/') ||
    cleanPath.includes('/logo') ||
    cleanPath.includes('/pillars/') ||
    cleanPath.includes('/web-builder/') ||
    cleanPath.includes('/blog/')
  );
}

/**
 * Generates a signed token for private storage access
 */
export function generateStorageSignature(cleanPath, expires) {
  return crypto
    .createHmac('sha256', STORAGE_SIGN_SECRET)
    .update(`${cleanPath}:${expires}`)
    .digest('hex');
}

/**
 * Verifies if a signed storage token is valid and not expired
 */
export function verifyStorageSignature(cleanPath, expires, signature) {
  if (!cleanPath || !expires || !signature) return false;
  const expNum = parseInt(expires, 10);
  if (isNaN(expNum) || expNum < Math.floor(Date.now() / 1000)) {
    return false; // Expired
  }
  const expectedSig = generateStorageSignature(cleanPath, expNum);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch (e) {
    return false;
  }
}

/**
 * Extracts a normalized relative path from any full URL, stream URL or relative path string
 */
export function extractStorageRelativePath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const raw = urlOrPath.trim();

  // 1. Query based: /api/storage/stream?file=schools%2F...
  if (raw.includes('/api/storage/stream')) {
    try {
      const parsed = new URL(raw, 'http://localhost');
      const fileParam = parsed.searchParams.get('file');
      if (fileParam) return path.normalize(fileParam).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/').replace(/^\/+/, '');
    } catch {}
  }

  // 2. RESTful URL: http://.../api/storage/schools/... or /api/storage/public/...
  const storageIndex = raw.indexOf('/api/storage/');
  if (storageIndex !== -1) {
    const after = raw.substring(storageIndex + '/api/storage/'.length).split('?')[0];
    let clean = path.normalize(after).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!clean.startsWith('schools/') && !clean.startsWith('public/')) {
      clean = `schools/${clean}`;
    }
    return clean;
  }

  // 3. Direct S3 / MinIO / full CDN URLs containing /schools/... or /public/...
  const schoolsIndex = raw.indexOf('schools/');
  if (schoolsIndex !== -1) {
    const afterSchools = raw.substring(schoolsIndex).split('?')[0];
    return path.normalize(afterSchools).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/').replace(/^\/+/, '');
  }

  const publicIndex = raw.indexOf('public/');
  if (publicIndex !== -1) {
    const afterPublic = raw.substring(publicIndex).split('?')[0];
    return path.normalize(afterPublic).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/').replace(/^\/+/, '');
  }

  // 4. Legacy /feed/:schoolId/:filename path
  if (raw.startsWith('/feed/') || raw.startsWith('feed/')) {
    const relativePart = raw.replace(/^\/?feed\//, '').split('?')[0];
    const parts = relativePart.split('/');
    if (parts.length >= 2) {
      const schoolId = parts[0];
      const filename = parts.slice(1).join('/');
      return `schools/${schoolId}/feed/${filename}`;
    }
  }

  if (raw.startsWith('schools/') || raw.startsWith('public/')) {
    return path.normalize(raw).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/').replace(/^\/+/, '');
  }

  return null;
}

/**
 * Builds a clean RESTful storage URL (e.g. /api/storage/schools/:schoolId/:folder/:file)
 * Automatically appends HMAC signature only for private documents when requested
 */
export function buildStorageUrl(relativePath, options = {}) {
  const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/').replace(/^\/+/, '');
  const isPublic = isPublicStorageMedia(cleanPath);

  const baseUrl = `/api/storage/${cleanPath}`;

  if (isPublic || !options.signed) {
    return baseUrl;
  }

  const expiresIn = options.expiresIn || 86400; // default 24h
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  const hash = generateStorageSignature(cleanPath, expires);
  return `${baseUrl}?expires=${expires}&hash=${hash}`;
}

/**
 * Returns the default SaaS root bucket or custom school bucket
 */
export function getBucketNameForSchool(schoolId = null, customBucket = null) {
  if (customBucket && typeof customBucket === 'string' && customBucket.trim()) {
    return customBucket.trim().toLowerCase().replace(/_/g, '-');
  }
  return (process.env.S3_BUCKET || 'montessorinexus-storage').toLowerCase().trim().replace(/_/g, '-');
}

/**
 * Automatically creates the bucket on MinIO/S3 if it doesn't already exist
 */
export async function ensureBucketExists(s3Client, bucketName) {
  if (!bucketName) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err) {
    if (
      err.name === 'NotFound' || 
      err.name === 'NoSuchBucket' || 
      err.$metadata?.httpStatusCode === 404 || 
      err.$metadata?.httpStatusCode === 400
    ) {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`[STORAGE] MinIO/S3 Bucket "${bucketName}" auto-created successfully.`);
      } catch (createErr) {
        console.warn(`[STORAGE] Note on bucket creation for "${bucketName}":`, createErr.message);
      }
    }
  }
}

/**
 * Loads storage configuration for a specific school from DB settings or process.env
 */
export async function getStorageConfigForSchool(schoolId, prisma = null) {
  const rootSaaSBucket = (process.env.S3_BUCKET || 'montessorinexus-storage').toLowerCase().trim().replace(/_/g, '-');
  let driver = (process.env.STORAGE_DRIVER || (process.env.S3_ACCESS_KEY_ID && (process.env.S3_BUCKET || process.env.S3_ENDPOINT) ? 's3' : 'local')).toLowerCase().trim();
  let localRoot = process.env.STORAGE_LOCAL_ROOT || DEFAULT_LOCAL_ROOT;
  let s3Endpoint = process.env.S3_ENDPOINT || '';
  let s3Region = process.env.S3_REGION || 'us-east-1';
  let s3Bucket = rootSaaSBucket;
  let s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || '';
  let s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
  let s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' || process.env.S3_FORCE_PATH_STYLE === '1' || process.env.S3_FORCE_PATH_STYLE === true;

  if (schoolId && prisma) {
    try {
      const dbSettings = await prisma.siteSetting.findMany({
        where: {
          schoolId,
          key: {
            in: [
              'storage_driver',
              'storage_local_root',
              's3_endpoint',
              's3_region',
              's3_bucket',
              's3_access_key_id',
              's3_secret_access_key',
              's3_force_path_style'
            ]
          }
        }
      });
      const settingMap = {};
      dbSettings.forEach(s => { settingMap[s.key] = s.value; });

      // If school has explicit BYOS (Amazon S3 or MinIO) configured
      if (settingMap.storage_driver === 's3' || settingMap.storage_driver === 'minio') {
        driver = settingMap.storage_driver.toLowerCase().trim();
        if (settingMap.s3_endpoint) s3Endpoint = settingMap.s3_endpoint.trim();
        if (settingMap.s3_region) s3Region = settingMap.s3_region.trim();
        s3Bucket = settingMap.s3_bucket ? settingMap.s3_bucket.trim().toLowerCase().replace(/_/g, '-') : rootSaaSBucket;
        if (settingMap.s3_access_key_id) s3AccessKeyId = settingMap.s3_access_key_id.trim();
        if (settingMap.s3_secret_access_key) s3SecretAccessKey = settingMap.s3_secret_access_key.trim();
        if (settingMap.s3_force_path_style !== undefined) {
          s3ForcePathStyle = settingMap.s3_force_path_style === 'true' || settingMap.s3_force_path_style === true;
        }
      } else {
        // 'nexus', 'local', or unset: Montessori Nexus managed SaaS server storage
        driver = (process.env.STORAGE_DRIVER || (process.env.S3_ACCESS_KEY_ID && (process.env.S3_BUCKET || process.env.S3_ENDPOINT) ? 's3' : 'local')).toLowerCase().trim();
        localRoot = process.env.STORAGE_LOCAL_ROOT || DEFAULT_LOCAL_ROOT;
        s3Bucket = rootSaaSBucket;
      }
    } catch (e) {
      console.warn('[STORAGE CONFIG DB WARNING]', e.message);
    }
  }

  // Auto-enable force path style for MinIO / Localhost
  if (s3Endpoint && (s3Endpoint.includes('localhost') || s3Endpoint.includes('127.0.0.1') || s3Endpoint.includes('minio') || s3Endpoint.includes(':9000') || s3Endpoint.includes('easypanel'))) {
    s3ForcePathStyle = true;
  }

  return {
    driver,
    localRoot: localRoot || DEFAULT_LOCAL_ROOT,
    s3Endpoint,
    s3Region: s3Region || 'us-east-1',
    s3Bucket,
    s3AccessKeyId,
    s3SecretAccessKey,
    s3ForcePathStyle
  };
}

/**
 * Loads webhook configuration for a school
 */
export async function getWebhookConfigForSchool(schoolId, prisma = null) {
  let enabled = process.env.STORAGE_WEBHOOK_ENABLED === 'true';
  let url = process.env.STORAGE_WEBHOOK_URL || '';
  let secret = process.env.STORAGE_WEBHOOK_SECRET || '';
  let includePayload = process.env.STORAGE_WEBHOOK_INCLUDE_PAYLOAD !== 'false';

  if (schoolId && prisma) {
    try {
      const dbSettings = await prisma.siteSetting.findMany({
        where: {
          schoolId,
          key: {
            in: [
              'storage_webhook_enabled',
              'storage_webhook_url',
              'storage_webhook_secret',
              'storage_webhook_include_payload'
            ]
          }
        }
      });
      const map = {};
      dbSettings.forEach(s => { map[s.key] = s.value; });
      if (map.storage_webhook_enabled !== undefined) {
        enabled = map.storage_webhook_enabled === 'true' || map.storage_webhook_enabled === true;
      }
      if (map.storage_webhook_url) url = map.storage_webhook_url.trim();
      if (map.storage_webhook_secret) secret = map.storage_webhook_secret.trim();
      if (map.storage_webhook_include_payload !== undefined) {
        includePayload = map.storage_webhook_include_payload === 'true' || map.storage_webhook_include_payload === true;
      }
    } catch (e) {
      console.warn('[STORAGE WEBHOOK CONFIG WARNING]', e.message);
    }
  }

  return { enabled, url, secret, includePayload };
}

/**
 * Dispatches an event to the configured external webhook (e.g. n8n, Make.com, Cloud Functions)
 */
export async function dispatchStorageWebhook({
  schoolId,
  event,
  applicationId = null,
  formId = null,
  filename = null,
  relativePath = null,
  size = 0,
  mimeType = null,
  fileBuffer = null,
  metadata = {},
  prisma = null
}) {
  try {
    const whConfig = await getWebhookConfigForSchool(schoolId, prisma);
    if (!whConfig.enabled || !whConfig.url) return;

    const payload = {
      event, // e.g. 'file.created', 'file.deleted', 'admission.folder_deleted', 'storage.test'
      timestamp: new Date().toISOString(),
      schoolId,
      applicationId,
      formId,
      filename,
      relativePath,
      size,
      mimeType,
      metadata,
      fileBase64: (whConfig.includePayload && fileBuffer) ? fileBuffer.toString('base64') : undefined
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'CeibaRoots-Storage-Webhook/1.0',
      'X-Ceiba-Event': event,
      'X-Ceiba-School-Id': String(schoolId || '')
    };

    if (whConfig.secret) {
      headers['Authorization'] = `Bearer ${whConfig.secret}`;
      headers['X-Ceiba-Secret'] = whConfig.secret;
    }

    // Fire and forget with timeout
    fetch(whConfig.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000)
    })
      .then(async (res) => {
        if (!res.ok) {
          console.warn(`⚠️ [STORAGE WEBHOOK] Non-OK response from ${whConfig.url}: ${res.status}`);
        } else {
          console.log(`📡 [STORAGE WEBHOOK] Dispatched event "${event}" to ${whConfig.url} (${res.status})`);
        }
      })
      .catch((err) => {
        console.warn(`⚠️ [STORAGE WEBHOOK FAILED] Could not dispatch to ${whConfig.url}: ${err.message}`);
      });
  } catch (err) {
    console.warn('[STORAGE WEBHOOK DISPATCH ERROR]', err.message);
  }
}

/**
 * Tests the webhook endpoint by sending an immediate diagnostic ping
 */
export async function testStorageWebhookConfig({
  webhookUrl,
  secretToken = '',
  includePayload = true
}) {
  if (!webhookUrl || !webhookUrl.trim()) {
    throw new Error('La URL del webhook es obligatoria');
  }

  const testPayload = {
    event: 'storage.test',
    timestamp: new Date().toISOString(),
    schoolId: 'test-school-id',
    applicationId: 'test-application-id',
    formId: 'test-form-id',
    filename: 'healthcheck.txt',
    relativePath: 'schools/test-school/admissions/test-app/forms/test-form/healthcheck.txt',
    size: 58,
    mimeType: 'text/plain',
    metadata: {
      source: 'Ceiba Roots Webhook Diagnostic Tool',
      testTriggeredBy: 'Admin Settings Panel'
    },
    fileBase64: includePayload ? Buffer.from('Ceiba Roots Webhook Test Payload', 'utf-8').toString('base64') : undefined
  };

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'CeibaRoots-Storage-Webhook/1.0',
    'X-Ceiba-Event': 'storage.test',
    'X-Ceiba-School-Id': 'test-school'
  };

  if (secretToken && secretToken.trim()) {
    headers['Authorization'] = `Bearer ${secretToken.trim()}`;
    headers['X-Ceiba-Secret'] = secretToken.trim();
  }

  const res = await fetch(webhookUrl.trim(), {
    method: 'POST',
    headers,
    body: JSON.stringify(testPayload),
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) {
    throw new Error(`El servidor webhook respondió con código HTTP de error: ${res.status} ${res.statusText}`);
  }

  return {
    success: true,
    httpStatus: res.status,
    message: `Webhook entregado exitosamente a "${webhookUrl.trim()}" (Respuesta HTTP: ${res.status})`
  };
}

/**
 * Parses buffer from base64 string, data URL or buffer
 */
function parseBufferFromInput(bufferOrBase64) {
  if (Buffer.isBuffer(bufferOrBase64)) {
    return bufferOrBase64;
  }
  if (typeof bufferOrBase64 === 'string') {
    const match = bufferOrBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return Buffer.from(match[2], 'base64');
    }
    return Buffer.from(bufferOrBase64, 'base64');
  }
  throw new Error('Formato de archivo inválido para almacenamiento');
}

/**
 * Saves an asset privately for an admission application within the folder structure:
 * schools/{schoolId}/admissions/{applicationId}/forms/{formId}/{filename}
 */
export async function saveAdmissionAsset({
  schoolId,
  applicationId,
  formId = 'general',
  filename,
  content,
  mimeType,
  prisma = null
}) {
  if (!schoolId || !applicationId || !filename || !content) {
    throw new Error('Faltan parámetros requeridos para guardar archivo de admisión');
  }

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const cleanSchoolId = String(schoolId).trim();
  const cleanAppId = String(applicationId).trim();
  const cleanFormId = String(formId).trim();
  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');

  const buffer = parseBufferFromInput(content);
  const size = buffer.length;

  const detectedMime = mimeType || (
    cleanFilename.endsWith('.pdf') ? 'application/pdf' :
    cleanFilename.endsWith('.png') ? 'image/png' :
    cleanFilename.endsWith('.jpg') || cleanFilename.endsWith('.jpeg') ? 'image/jpeg' :
    cleanFilename.endsWith('.webp') ? 'image/webp' :
    'application/octet-stream'
  );

  // Relative storage path: schools/:schoolId/forms/:formId/:filename (or schools/:schoolId/admissions/:applicationId/forms/:formId/:filename if bound to admission)
  const relativePath = (cleanAppId === 'standalone' || !cleanAppId)
    ? path.join('schools', cleanSchoolId, 'forms', cleanFormId, cleanFilename).replace(/\\/g, '/')
    : path.join('schools', cleanSchoolId, 'admissions', cleanAppId, 'forms', cleanFormId, cleanFilename).replace(/\\/g, '/');

  if (config.driver === 's3' || config.driver === 'minio') {
    const s3 = new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint || undefined,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey
      },
      forcePathStyle: config.s3ForcePathStyle
    });

    await s3.send(new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: relativePath,
      Body: buffer,
      ContentType: detectedMime
    }));

    const fileUrl = `/api/storage/stream?file=${encodeURIComponent(relativePath)}`;

    console.log(`🔒 [STORAGE ${config.driver.toUpperCase()} PRIVATE] Saved asset: ${relativePath} (${size} bytes)`);

    // Emit Webhook Event
    dispatchStorageWebhook({
      schoolId: cleanSchoolId,
      event: 'file.created',
      applicationId: cleanAppId,
      formId: cleanFormId,
      filename: cleanFilename,
      relativePath,
      size,
      mimeType: detectedMime,
      fileBuffer: buffer,
      prisma
    });

    return {
      fileUrl,
      relativePath,
      size,
      filename: cleanFilename,
      mimeType: detectedMime
    };
  }

  // Local private filesystem driver
  const targetFullPath = path.join(config.localRoot, relativePath);
  const targetDir = path.dirname(targetFullPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetFullPath, buffer);
  const fileUrl = `/api/storage/stream?file=${encodeURIComponent(relativePath)}`;

  console.log(`🔒 [STORAGE LOCAL PRIVATE] Saved asset: ${relativePath} (${size} bytes) -> ${fileUrl}`);

  // Emit Webhook Event
  dispatchStorageWebhook({
    schoolId: cleanSchoolId,
    event: 'file.created',
    applicationId: cleanAppId,
    formId: cleanFormId,
    filename: cleanFilename,
    relativePath,
    size,
    mimeType: detectedMime,
    fileBuffer: buffer,
    prisma
  });

  return {
    fileUrl,
    relativePath,
    size,
    filename: cleanFilename,
    mimeType: detectedMime
  };
}

/**
 * Saves an uploaded asset specifically for a dynamic standalone form
 * Hierarchy: schools/:schoolId/forms/:formId/:filename
 */
export async function saveFormAsset({
  schoolId,
  formId = 'general',
  filename,
  content,
  mimeType,
  prisma = null
}) {
  if (!schoolId || !filename || !content) {
    throw new Error('Faltan parámetros requeridos para guardar archivo de formulario');
  }

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const cleanSchoolId = String(schoolId).trim();
  const cleanFormId = String(formId || 'general').trim();
  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');

  const buffer = parseBufferFromInput(content);
  const size = buffer.length;

  const detectedMime = mimeType || (
    cleanFilename.endsWith('.pdf') ? 'application/pdf' :
    cleanFilename.endsWith('.png') ? 'image/png' :
    cleanFilename.endsWith('.jpg') || cleanFilename.endsWith('.jpeg') ? 'image/jpeg' :
    cleanFilename.endsWith('.webp') ? 'image/webp' :
    cleanFilename.endsWith('.webm') ? 'video/webm' :
    cleanFilename.endsWith('.mp4') ? 'video/mp4' :
    'application/octet-stream'
  );

  // Hierarchy: schools/:schoolId/forms/:formId/:filename
  const relativePath = path.join('schools', cleanSchoolId, 'forms', cleanFormId, cleanFilename).replace(/\\/g, '/');

  if (config.driver === 's3' || config.driver === 'minio') {
    const s3 = new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint || undefined,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey
      },
      forcePathStyle: config.s3ForcePathStyle
    });

    await s3.send(new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: relativePath,
      Body: buffer,
      ContentType: detectedMime
    }));

    const fileUrl = `/api/storage/stream?file=${encodeURIComponent(relativePath)}`;

    console.log(`🔒 [STORAGE ${config.driver.toUpperCase()} FORMS] Saved form asset: ${relativePath} (${size} bytes)`);

    dispatchStorageWebhook({
      schoolId: cleanSchoolId,
      event: 'form.file_created',
      formId: cleanFormId,
      filename: cleanFilename,
      relativePath,
      size,
      mimeType: detectedMime,
      fileBuffer: buffer,
      prisma
    });

    return {
      fileUrl,
      relativePath,
      size,
      filename: cleanFilename,
      mimeType: detectedMime
    };
  }

  // Local private filesystem driver
  const targetFullPath = path.join(config.localRoot, relativePath);
  const targetDir = path.dirname(targetFullPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetFullPath, buffer);
  const fileUrl = `/api/storage/stream?file=${encodeURIComponent(relativePath)}`;

  console.log(`🔒 [STORAGE LOCAL FORMS] Saved form asset: ${relativePath} (${size} bytes) -> ${fileUrl}`);

  dispatchStorageWebhook({
    schoolId: cleanSchoolId,
    event: 'form.file_created',
    formId: cleanFormId,
    filename: cleanFilename,
    relativePath,
    size,
    mimeType: detectedMime,
    fileBuffer: buffer,
    prisma
  });

  return {
    fileUrl,
    relativePath,
    size,
    filename: cleanFilename,
    mimeType: detectedMime
  };
}

/**
 * Deletes the entire physical directory for a standalone dynamic form
 */
export async function deleteFormFolder({ schoolId, formId, prisma = null }) {
  if (!schoolId || !formId) return;

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const cleanSchoolId = String(schoolId).trim();
  const cleanFormId = String(formId).trim();
  const relativeDir = path.join('schools', cleanSchoolId, 'forms', cleanFormId).replace(/\\/g, '/');

  if (config.driver === 'local') {
    const fullDirPath = path.join(config.localRoot, relativeDir);
    if (fs.existsSync(fullDirPath)) {
      try {
        fs.rmSync(fullDirPath, { recursive: true, force: true });
        console.log(`🗑️ [STORAGE LOCAL] Deleted form folder: ${fullDirPath}`);
      } catch (err) {
        console.warn(`[STORAGE WARNING] Failed to delete form folder ${fullDirPath}:`, err.message);
      }
    }
  } else if (config.driver === 's3' || config.driver === 'minio') {
    try {
      const s3 = new S3Client({
        region: config.s3Region,
        endpoint: config.s3Endpoint || undefined,
        credentials: {
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3SecretAccessKey
        },
        forcePathStyle: config.s3ForcePathStyle
      });
      const prefix = relativeDir + '/';
      const list = await s3.send(new ListObjectsV2Command({ Bucket: config.s3Bucket, Prefix: prefix }));
      if (list.Contents && list.Contents.length > 0) {
        for (const item of list.Contents) {
          if (item.Key) {
            await s3.send(new DeleteObjectCommand({ Bucket: config.s3Bucket, Key: item.Key }));
          }
        }
        console.log(`🗑️ [STORAGE ${config.driver.toUpperCase()}] Deleted ${list.Contents.length} objects for form ${formId}`);
      }
    } catch (e) {
      console.warn('[STORAGE S3 DELETE ERROR]', e.message);
    }
  }

  dispatchStorageWebhook({
    schoolId: cleanSchoolId,
    event: 'form.folder_deleted',
    formId: cleanFormId,
    relativePath: relativeDir,
    prisma
  });
}

/**
 * Streams a private/public asset securely with disk caching, CORS headers and ETag support
 */
export async function streamPrivateAsset({ schoolId, relativePath, req = null, res, prisma = null }) {
  if (!relativePath) {
    res.status(400).json({ error: 'Ruta de archivo no especificada' });
    return;
  }

  const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/').replace(/^\/+/, '');

  // Extract schoolId directly from path first (e.g. schools/{schoolId}/...)
  const pathSchoolId = cleanPath.startsWith('schools/') ? cleanPath.split('/')[1] : null;
  const targetSchoolId = pathSchoolId || schoolId;

  const isPublic = isPublicStorageMedia(cleanPath);

  // Private file access authorization
  if (!isPublic) {
    const signature = req?.query?.hash || req?.query?.signature || req?.query?.token;
    const expires = req?.query?.expires;
    const isSignatureValid = verifyStorageSignature(cleanPath, expires, signature);

    if (!isSignatureValid) {
      const isSessionAuthorized = schoolId && pathSchoolId && pathSchoolId === schoolId;
      if (!isSessionAuthorized) {
        res.status(403).json({
          error: 'Acceso denegado: Este archivo es confidencial y requiere una URL firmada válida (?hash=...)'
        });
        return;
      }
    }
  }

  const config = await getStorageConfigForSchool(targetSchoolId, prisma);

  const cleanFilename = path.basename(cleanPath).toLowerCase();
  const detectedMime = (
    cleanFilename.endsWith('.pdf') ? 'application/pdf' :
    cleanFilename.endsWith('.png') ? 'image/png' :
    cleanFilename.endsWith('.jpg') || cleanFilename.endsWith('.jpeg') ? 'image/jpeg' :
    cleanFilename.endsWith('.webp') ? 'image/webp' :
    cleanFilename.endsWith('.svg') ? 'image/svg+xml' :
    cleanFilename.endsWith('.webm') ? 'video/webm' :
    cleanFilename.endsWith('.mp4') ? 'video/mp4' :
    cleanFilename.endsWith('.mov') ? 'video/quicktime' :
    cleanFilename.endsWith('.ogg') || cleanFilename.endsWith('.ogv') ? 'video/ogg' :
    cleanFilename.endsWith('.mp3') ? 'audio/mpeg' :
    cleanFilename.endsWith('.wav') ? 'audio/wav' :
    'application/octet-stream'
  );

  // Set universal CORS & streaming headers
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(cleanPath)}"`);

  if (isPublic) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  }

  // 1. Check local cache or local filesystem first (High-speed zero-latency hit)
  const cachedFilePath = getCachedFilePath(cleanPath);
  const localFSPath = path.join(config.localRoot, cleanPath);
  const publicGalleryFallback = path.join(process.cwd(), 'public', 'gallery', path.basename(cleanPath));
  const storagePublicFallback = path.join(process.cwd(), 'storage', 'public', 'gallery', path.basename(cleanPath));
  const publicRootFallback = path.join(process.cwd(), 'public', path.basename(cleanPath));

  const resolvedLocalPath = fs.existsSync(cachedFilePath)
    ? cachedFilePath
    : fs.existsSync(localFSPath)
    ? localFSPath
    : fs.existsSync(publicGalleryFallback)
    ? publicGalleryFallback
    : fs.existsSync(storagePublicFallback)
    ? storagePublicFallback
    : fs.existsSync(publicRootFallback)
    ? publicRootFallback
    : null;

  if (resolvedLocalPath) {
    // Automatic Watermarking EXCLUSIVELY for SaaS Blog (e.g. blog. subdomain)
    if (isBlogImage(cleanPath) && isSaaSBlogRequest(req, cleanPath)) {
      try {
        const signedResult = await getOrGenerateSignedBlogFile({
          relativePath: cleanPath,
          sourceFSPath: resolvedLocalPath,
          config
        });

        if (signedResult?.filePath && fs.existsSync(signedResult.filePath)) {
          const signedStat = fs.statSync(signedResult.filePath);
          const signedEtag = `"${signedStat.size}-${Math.floor(signedStat.mtimeMs)}"`;
          res.setHeader('ETag', signedEtag);
          res.setHeader('Content-Type', signedResult.mimeType || 'image/webp');
          res.setHeader('Content-Length', signedStat.size);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

          if (req?.headers['if-none-match'] === signedEtag) {
            res.status(304).end();
            return;
          }

          return fs.createReadStream(signedResult.filePath).pipe(res);
        }
      } catch (watermarkErr) {
        console.warn('⚠️ [Blog Watermark] Error applying signature, falling back to original:', watermarkErr.message);
      }
    }

    const stat = fs.statSync(resolvedLocalPath);
    const etag = `"${stat.size}-${Math.floor(stat.mtimeMs)}"`;
    res.setHeader('ETag', etag);

    if (req?.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    const range = req?.headers?.range;
    if (range && (detectedMime.startsWith('video/') || detectedMime.startsWith('audio/'))) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(resolvedLocalPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': detectedMime
      });
      file.pipe(res);
      return;
    }

    res.setHeader('Content-Type', detectedMime);
    res.setHeader('Content-Length', stat.size);
    return fs.createReadStream(resolvedLocalPath).pipe(res);
  }

  // 2. Fetch from S3/MinIO if remote driver
  if (config.driver === 's3' || config.driver === 'minio') {
    try {
      const s3 = new S3Client({
        region: config.s3Region || 'us-east-1',
        endpoint: config.s3Endpoint || undefined,
        credentials: {
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3SecretAccessKey
        },
        forcePathStyle: config.s3ForcePathStyle
      });

      let s3Obj = null;
      const candidates = [
        { bucket: config.s3Bucket, key: cleanPath },
        { bucket: process.env.S3_BUCKET || 'montessorinexus-storage', key: cleanPath },
        { bucket: config.s3Bucket, key: cleanPath.replace(/^schools\/[^\/]+\//, '') },
        { bucket: process.env.S3_BUCKET || 'montessorinexus-storage', key: cleanPath.replace(/^schools\/[^\/]+\//, '') }
      ];

      // Remove duplicate candidate configurations
      const uniqueCandidates = [];
      const seen = new Set();
      for (const c of candidates) {
        const id = `${c.bucket}:${c.key}`;
        if (!seen.has(id) && c.bucket && c.key) {
          seen.add(id);
          uniqueCandidates.push(c);
        }
      }

      for (const candidate of uniqueCandidates) {
        try {
          const s3Params = {
            Bucket: candidate.bucket,
            Key: candidate.key
          };
          if (req?.headers?.range) {
            s3Params.Range = req.headers.range;
          }
          s3Obj = await s3.send(new GetObjectCommand(s3Params));
          if (s3Obj && s3Obj.Body) break;
        } catch (candidateErr) {
          // Continue to next candidate
        }
      }

      if (!s3Obj || !s3Obj.Body) {
        throw new Error(`Archivo no encontrado en MinIO/S3 (Bucket: ${config.s3Bucket}, Key: ${cleanPath})`);
      }

      if (s3Obj.ContentRange) {
        res.status(206);
        res.setHeader('Content-Range', s3Obj.ContentRange);
      }

      const mimeToUse = s3Obj.ContentType || detectedMime;
      res.setHeader('Content-Type', mimeToUse);

      if (s3Obj.ContentLength) {
        res.setHeader('Content-Length', s3Obj.ContentLength);
      }

      // Convert stream to byte array to safely pipe and save into local disk cache
      const byteArray = await s3Obj.Body.transformToByteArray();
      const buffer = Buffer.from(byteArray);

      // Cache raw file locally in background for subsequent high-speed hits
      saveToLocalCache(cleanPath, buffer);

      // Automatic Watermarking EXCLUSIVELY for SaaS Blog (e.g. blog. subdomain)
      if (isBlogImage(cleanPath) && isSaaSBlogRequest(req, cleanPath)) {
        try {
          const signedResult = await getOrGenerateSignedBlogFile({
            relativePath: cleanPath,
            sourceBuffer: buffer,
            config
          });

          if (signedResult?.buffer) {
            const signedEtag = `"${signedResult.buffer.length}-${Date.now().toString(36)}"`;
            res.setHeader('ETag', signedEtag);
            res.setHeader('Content-Type', signedResult.mimeType || 'image/webp');
            res.setHeader('Content-Length', signedResult.buffer.length);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.end(signedResult.buffer);
          }
        } catch (watermarkErr) {
          console.warn('⚠️ [Blog Watermark S3] Error applying signature, falling back to original:', watermarkErr.message);
        }
      }

      const etag = `"${buffer.length}-${Date.now().toString(36)}"`;
      res.setHeader('ETag', etag);

      return res.end(buffer);
    } catch (e) {
      console.error('[STORAGE S3 STREAM ERROR]', e.message);
      res.status(404).json({ error: 'Archivo no encontrado en almacenamiento seguro: ' + e.message });
      return;
    }
  }

  res.status(404).json({ error: 'Archivo no encontrado en disco' });
}

/**
 * Packages the entire admission application folder as a ZIP file and streams it
 */
export async function exportAdmissionZip({ schoolId, applicationId, childName = 'Expediente', res, prisma = null }) {
  if (!schoolId || !applicationId) {
    res.status(400).json({ error: 'Faltan identificadores del expediente' });
    return;
  }

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const relativeDir = path.join('schools', String(schoolId), 'admissions', String(applicationId)).replace(/\\/g, '/');
  const safeChildName = childName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const zipName = `Expediente_${safeChildName}_${applicationId.substring(0, 8)}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.pipe(res);

  if (config.driver === 'local') {
    const fullDirPath = path.join(config.localRoot, relativeDir);
    if (fs.existsSync(fullDirPath)) {
      archive.directory(fullDirPath, false);
    } else {
      archive.append(Buffer.from('No se encontraron archivos cargados en este expediente.'), { name: 'README.txt' });
    }
    await archive.finalize();
    return;
  }

  // S3 / MinIO archive builder
  if (config.driver === 's3' || config.driver === 'minio') {
    try {
      const s3 = new S3Client({
        region: config.s3Region,
        endpoint: config.s3Endpoint || undefined,
        credentials: {
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3SecretAccessKey
        },
        forcePathStyle: config.s3ForcePathStyle
      });
      const prefix = relativeDir + '/';
      const list = await s3.send(new ListObjectsV2Command({ Bucket: config.s3Bucket, Prefix: prefix }));

      if (list.Contents && list.Contents.length > 0) {
        for (const item of list.Contents) {
          if (item.Key) {
            const relativeItemPath = item.Key.replace(prefix, '');
            const obj = await s3.send(new GetObjectCommand({ Bucket: config.s3Bucket, Key: item.Key }));
            archive.append(obj.Body, { name: relativeItemPath });
          }
        }
      } else {
        archive.append(Buffer.from('No se encontraron archivos en este expediente.'), { name: 'README.txt' });
      }
      await archive.finalize();
    } catch (e) {
      console.error('[STORAGE ZIP S3 ERROR]', e);
      res.status(500).json({ error: 'Error al compilar expediente ZIP' });
    }
  }
}

/**
 * Deletes the entire physical directory for an admission application when deleted
 */
export async function deleteAdmissionFolder({ schoolId, applicationId, prisma = null }) {
  if (!schoolId || !applicationId) return;

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const cleanSchoolId = String(schoolId).trim();
  const cleanAppId = String(applicationId).trim();
  const relativeDir = path.join('schools', cleanSchoolId, 'admissions', cleanAppId).replace(/\\/g, '/');

  if (config.driver === 'local') {
    const fullDirPath = path.join(config.localRoot, relativeDir);
    if (fs.existsSync(fullDirPath)) {
      try {
        fs.rmSync(fullDirPath, { recursive: true, force: true });
        console.log(`🗑️ [STORAGE LOCAL] Deleted admission folder: ${fullDirPath}`);
      } catch (err) {
        console.warn(`[STORAGE WARNING] Failed to delete folder ${fullDirPath}:`, err.message);
      }
    }
  } else if (config.driver === 's3' || config.driver === 'minio') {
    try {
      const s3 = new S3Client({
        region: config.s3Region,
        endpoint: config.s3Endpoint || undefined,
        credentials: {
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3SecretAccessKey
        },
        forcePathStyle: config.s3ForcePathStyle
      });
      const prefix = relativeDir + '/';
      const list = await s3.send(new ListObjectsV2Command({ Bucket: config.s3Bucket, Prefix: prefix }));
      if (list.Contents && list.Contents.length > 0) {
        for (const item of list.Contents) {
          if (item.Key) {
            await s3.send(new DeleteObjectCommand({ Bucket: config.s3Bucket, Key: item.Key }));
          }
        }
        console.log(`🗑️ [STORAGE ${config.driver.toUpperCase()}] Deleted ${list.Contents.length} objects for admission ${applicationId}`);
      }
    } catch (e) {
      console.warn('[STORAGE S3 DELETE ERROR]', e.message);
    }
  }

  // Emit Webhook Event
  dispatchStorageWebhook({
    schoolId: cleanSchoolId,
    event: 'admission.folder_deleted',
    applicationId: cleanAppId,
    relativePath: relativeDir,
    prisma
  });
}



/**
 * Tests storage connection with provided or active parameters
 */
export async function testStorageConfig({
  driver = 'local',
  localRoot = DEFAULT_LOCAL_ROOT,
  s3Endpoint = '',
  s3Region = 'us-east-1',
  s3Bucket = 'montessori-nexus',
  s3AccessKeyId = '',
  s3SecretAccessKey = '',
  s3ForcePathStyle = false,
  schoolId = null
}) {
  const isNexusManaged = driver === 'local' || driver === 'nexus' || driver === 'montessorinexus' || !driver;
  const testFilename = `test_healthcheck_${Date.now()}.txt`;
  const testContent = Buffer.from(`Montessori Nexus Storage Health Check at ${new Date().toISOString()}`, 'utf-8');

  if (isNexusManaged) {
    const targetDir = schoolId
      ? path.join(localRoot || DEFAULT_LOCAL_ROOT, 'schools', String(schoolId), '_healthcheck')
      : path.join(localRoot || DEFAULT_LOCAL_ROOT, '_healthcheck');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const fullPath = path.join(targetDir, testFilename);
    fs.writeFileSync(fullPath, testContent);
    const readBack = fs.readFileSync(fullPath, 'utf-8');
    fs.unlinkSync(fullPath);
    if (!readBack.includes('Montessori Nexus Storage')) {
      throw new Error('No se pudo verificar la lectura del archivo de prueba en el servidor');
    }
    return {
      success: true,
      message: `Conexión privada y almacenamiento en Montessori Nexus server verificados exitosamente.`
    };
  } else if (driver === 's3' || driver === 'minio') {
    if (!s3Bucket || !s3Bucket.trim()) {
      throw new Error('El nombre del bucket es obligatorio');
    }
    if (!s3AccessKeyId || !s3AccessKeyId.trim() || !s3SecretAccessKey || !s3SecretAccessKey.trim()) {
      throw new Error('Las credenciales de acceso (Access Key ID y Secret Access Key) son obligatorias');
    }

    const s3 = new S3Client({
      region: s3Region || 'us-east-1',
      endpoint: s3Endpoint || undefined,
      credentials: {
        accessKeyId: s3AccessKeyId.trim(),
        secretAccessKey: s3SecretAccessKey.trim()
      },
      forcePathStyle: Boolean(s3ForcePathStyle || (s3Endpoint && !s3Endpoint.includes('amazonaws.com')))
    });

    const key = schoolId
      ? `schools/${schoolId}/_healthcheck/${testFilename}`
      : `_healthcheck/${testFilename}`;

    // 1. Put object
    await s3.send(new PutObjectCommand({
      Bucket: s3Bucket.trim(),
      Key: key,
      Body: testContent,
      ContentType: 'text/plain'
    }));

    // 2. Delete test object
    await s3.send(new DeleteObjectCommand({
      Bucket: s3Bucket.trim(),
      Key: key
    }));

    return {
      success: true,
      message: `Conexión privada con ${driver === 'minio' ? 'MinIO' : 'Amazon S3'} (Bucket: "${s3Bucket}") verificada exitosamente.`
    };
  }

  throw new Error(`Driver de almacenamiento no reconocido: ${driver}`);
}

/**
 * Utility to format bytes into readable strings
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Unified Multi-Tenant School Storage Service
 * Automatically encapsulates resolution of SaaS Global vs School BYOS settings
 */
export class SchoolStorageService {
  constructor(schoolId, prisma = null) {
    this.schoolId = String(schoolId || '').trim();
    this.prisma = prisma;
    this._config = null;
    this._s3Client = null;
  }

  async getConfig() {
    if (!this._config) {
      this._config = await getStorageConfigForSchool(this.schoolId, this.prisma);
    }
    return this._config;
  }

  async getS3Client() {
    const config = await this.getConfig();
    if (config.driver !== 's3' && config.driver !== 'minio') {
      return null;
    }
    if (!this._s3Client) {
      this._s3Client = new S3Client({
        region: config.s3Region || 'us-east-1',
        endpoint: config.s3Endpoint || undefined,
        credentials: {
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3SecretAccessKey
        },
        forcePathStyle: config.s3ForcePathStyle
      });
    }
    return this._s3Client;
  }

  /**
   * Uploads a file buffer to storage (S3/MinIO or Local) with automatic local caching
   */
  async upload({ relativePath, buffer, mimeType = 'application/octet-stream', metadata = {} }) {
    if (!relativePath || !buffer) {
      throw new Error('Faltan parámetros requeridos (relativePath, buffer) para almacenar el archivo');
    }

    const config = await this.getConfig();
    const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');
    const size = buffer.length;

    // Immediately cache in local fast disk for zero-latency subsequent reads
    saveToLocalCache(cleanPath, buffer);

    if (config.driver === 's3' || config.driver === 'minio') {
      const s3 = await this.getS3Client();
      await ensureBucketExists(s3, config.s3Bucket);

      await s3.send(new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: cleanPath,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream'
      }));

      return {
        success: true,
        driver: config.driver,
        bucket: config.s3Bucket,
        url: buildStorageUrl(cleanPath),
        relativePath: cleanPath,
        storedName: path.basename(cleanPath),
        size,
        mimeType
      };
    }

    // Local filesystem
    const fullPath = path.join(config.localRoot, cleanPath);
    const targetDir = path.dirname(fullPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(fullPath, buffer);

    return {
      success: true,
      driver: 'local',
      url: buildStorageUrl(cleanPath),
      relativePath: cleanPath,
      storedName: path.basename(cleanPath),
      size,
      mimeType
    };
  }

  /**
   * Deletes a single file
   */
  async deleteFile(relativePath) {
    if (!relativePath) return { success: false };
    const config = await this.getConfig();
    const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');

    // Clean from local cache
    deleteFromLocalCache(cleanPath);

    if (config.driver === 's3' || config.driver === 'minio') {
      try {
        const s3 = await this.getS3Client();
        await s3.send(new DeleteObjectCommand({
          Bucket: config.s3Bucket,
          Key: cleanPath
        }));
        return { success: true, relativePath: cleanPath };
      } catch (e) {
        console.warn(`[STORAGE ${config.driver.toUpperCase()} DELETE ERROR]`, e.message);
        return { success: false, error: e.message };
      }
    }

    // Local filesystem
    const fullPath = path.join(config.localRoot, cleanPath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        return { success: true, relativePath: cleanPath };
      } catch (err) {
        console.warn(`[STORAGE LOCAL WARNING] Failed to delete file ${fullPath}:`, err.message);
        return { success: false, error: err.message };
      }
    }
    return { success: true, relativePath: cleanPath };
  }

  /**
   * Deletes a folder and all its contents recursively
   */
  async deleteFolder(relativePath) {
    if (!relativePath) return { success: false };
    const config = await this.getConfig();
    const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');

    if (config.driver === 's3' || config.driver === 'minio') {
      try {
        const s3 = await this.getS3Client();
        const prefix = cleanPath.endsWith('/') ? cleanPath : cleanPath + '/';
        const list = await s3.send(new ListObjectsV2Command({ Bucket: config.s3Bucket, Prefix: prefix }));
        if (list.Contents && list.Contents.length > 0) {
          for (const item of list.Contents) {
            if (item.Key) {
              await s3.send(new DeleteObjectCommand({ Bucket: config.s3Bucket, Key: item.Key }));
            }
          }
        }
        return { success: true, relativePath: cleanPath };
      } catch (e) {
        console.warn(`[STORAGE ${config.driver.toUpperCase()} DELETE FOLDER ERROR]`, e.message);
        return { success: false, error: e.message };
      }
    }

    // Local filesystem
    const fullPath = path.join(config.localRoot, cleanPath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return { success: true, relativePath: cleanPath };
      } catch (err) {
        console.warn(`[STORAGE LOCAL WARNING] Failed to delete folder ${fullPath}:`, err.message);
        return { success: false, error: err.message };
      }
    }
    return { success: true, relativePath: cleanPath };
  }

  /**
   * Lists files under a given prefix inside the school's storage boundary
   */
  async listFiles(subPrefix = '') {
    const config = await this.getConfig();
    const cleanSub = subPrefix ? path.normalize(subPrefix).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/') : '';
    const rootPrefix = `schools/${this.schoolId}/`;
    const targetPrefix = cleanSub ? (cleanSub.startsWith(rootPrefix) ? cleanSub : `${rootPrefix}${cleanSub.replace(/^\//, '')}`) : rootPrefix;

    if (config.driver === 's3' || config.driver === 'minio') {
      const s3 = await this.getS3Client();
      const files = [];
      let isTruncated = true;
      let continuationToken = undefined;

      while (isTruncated) {
        const params = {
          Bucket: config.s3Bucket,
          Prefix: targetPrefix,
          ContinuationToken: continuationToken
        };
        const response = await s3.send(new ListObjectsV2Command(params));
        if (response.Contents) {
          for (const item of response.Contents) {
            if (item.Key && !item.Key.endsWith('/')) {
              files.push({
                key: item.Key,
                relativePath: item.Key,
                name: path.basename(item.Key),
                size: item.Size || 0,
                lastModified: item.LastModified,
                url: buildStorageUrl(item.Key)
              });
            }
          }
        }
        isTruncated = Boolean(response.IsTruncated);
        continuationToken = response.NextContinuationToken;
      }
      return files;
    }

    // Local filesystem
    const baseDir = path.join(config.localRoot, targetPrefix);
    const files = [];

    function scanDir(currentDir, relPrefix) {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const entryRel = path.join(relPrefix, entry.name).replace(/\\/g, '/');
        const entryFull = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          scanDir(entryFull, entryRel);
        } else {
          const stats = fs.statSync(entryFull);
          files.push({
            key: entryRel,
            relativePath: entryRel,
            name: entry.name,
            size: stats.size,
            lastModified: stats.mtime,
            url: buildStorageUrl(entryRel)
          });
        }
      }
    }

    scanDir(baseDir, targetPrefix);
    return files;
  }

  /**
   * Calculates total storage usage and breakdown by folder for this school
   */
  async calculateUsage() {
    const config = await this.getConfig();
    const rootPrefix = `schools/${this.schoolId}/`;
    let totalBytes = 0;
    let filesCount = 0;
    const breakdown = {};

    const registerItem = (key, size) => {
      totalBytes += size;
      filesCount += 1;

      // Extract section/folder name e.g. "schools/school_123/gallery/img.png" -> "gallery"
      const afterRoot = key.startsWith(rootPrefix) ? key.slice(rootPrefix.length) : key;
      const parts = afterRoot.split('/');
      const section = parts.length > 1 ? parts[0] : 'root';

      if (!breakdown[section]) {
        breakdown[section] = { bytes: 0, count: 0, formattedSize: '0 Bytes' };
      }
      breakdown[section].bytes += size;
      breakdown[section].count += 1;
      breakdown[section].formattedSize = formatBytes(breakdown[section].bytes);
    };

    if (config.driver === 's3' || config.driver === 'minio') {
      const s3 = await this.getS3Client();
      let isTruncated = true;
      let continuationToken = undefined;

      while (isTruncated) {
        const response = await s3.send(new ListObjectsV2Command({
          Bucket: config.s3Bucket,
          Prefix: rootPrefix,
          ContinuationToken: continuationToken
        }));

        if (response.Contents) {
          for (const item of response.Contents) {
            if (item.Key && !item.Key.endsWith('/')) {
              registerItem(item.Key, item.Size || 0);
            }
          }
        }

        isTruncated = Boolean(response.IsTruncated);
        continuationToken = response.NextContinuationToken;
      }
    } else {
      // Local
      const baseDir = path.join(config.localRoot, rootPrefix);
      function scanDir(currentDir, relPrefix) {
        if (!fs.existsSync(currentDir)) return;
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const entryRel = path.join(relPrefix, entry.name).replace(/\\/g, '/');
          const entryFull = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            scanDir(entryFull, entryRel);
          } else {
            const stats = fs.statSync(entryFull);
            registerItem(entryRel, stats.size);
          }
        }
      }
      scanDir(baseDir, rootPrefix);
    }

    return {
      schoolId: this.schoolId,
      driver: config.driver,
      bucket: config.driver === 's3' || config.driver === 'minio' ? config.s3Bucket : null,
      totalBytes,
      formattedSize: formatBytes(totalBytes),
      filesCount,
      breakdown
    };
  }

  /**
   * Streams a file to Express response
   */
  async streamToResponse(relativePath, req, res) {
    return streamPrivateAsset({
      schoolId: this.schoolId,
      relativePath,
      req,
      res,
      prisma: this.prisma
    });
  }

  /**
   * Tests connection with active credentials
   */
  async testConnection(overrideConfig = null) {
    const config = overrideConfig || await this.getConfig();
    return testStorageConfig({
      ...config,
      schoolId: this.schoolId
    });
  }
}

/**
 * Storage Service Factory: Returns an initialized SchoolStorageService for a given schoolId
 */
export async function storageServiceFor(schoolId, prisma = null) {
  const service = new SchoolStorageService(schoolId, prisma);
  await service.getConfig();
  return service;
}

/**
 * Generic save file abstraction (Backwards compatible helper)
 */
export async function saveGenericFile({ schoolId, relativePath, buffer, mimeType, prisma = null }) {
  const service = await storageServiceFor(schoolId, prisma);
  return service.upload({ relativePath, buffer, mimeType });
}

/**
 * Generic delete file abstraction (Backwards compatible helper)
 */
export async function deleteGenericFile({ schoolId, relativePath, prisma = null }) {
  const service = await storageServiceFor(schoolId, prisma);
  return service.deleteFile(relativePath);
}

/**
 * Generic delete folder abstraction (Backwards compatible helper)
 */
export async function deleteGenericFolder({ schoolId, relativePath, prisma = null }) {
  const service = await storageServiceFor(schoolId, prisma);
  return service.deleteFolder(relativePath);
}

export const storageLocalRoot = DEFAULT_LOCAL_ROOT;

