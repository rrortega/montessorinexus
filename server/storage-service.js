import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { ZipArchive } from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Private Storage Directory (Completely outside public/ directory)
export const DEFAULT_LOCAL_ROOT = path.join(__dirname, '../storage');

if (!fs.existsSync(DEFAULT_LOCAL_ROOT)) {
  fs.mkdirSync(DEFAULT_LOCAL_ROOT, { recursive: true });
}

/**
 * Loads storage configuration for a specific school from DB settings or process.env
 * All storages are 100% PRIVATE with zero public URLs.
 */
export async function getStorageConfigForSchool(schoolId, prisma = null) {
  let driver = (process.env.STORAGE_DRIVER || (process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET ? 's3' : 'local')).toLowerCase().trim();
  let localRoot = process.env.STORAGE_LOCAL_ROOT || DEFAULT_LOCAL_ROOT;
  let s3Endpoint = process.env.S3_ENDPOINT || '';
  let s3Region = process.env.S3_REGION || 'us-east-1';
  let s3Bucket = process.env.S3_BUCKET || 'montessori-nexus';
  let s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || '';
  let s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
  let s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

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
        if (settingMap.s3_bucket) s3Bucket = settingMap.s3_bucket.trim();
        if (settingMap.s3_access_key_id) s3AccessKeyId = settingMap.s3_access_key_id.trim();
        if (settingMap.s3_secret_access_key) s3SecretAccessKey = settingMap.s3_secret_access_key.trim();
        if (settingMap.s3_force_path_style !== undefined) {
          s3ForcePathStyle = settingMap.s3_force_path_style === 'true' || settingMap.s3_force_path_style === true;
        }
      } else {
        // 'nexus', 'local', or unset: Montessori Nexus managed server storage
        driver = (process.env.STORAGE_DRIVER || (process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET ? 's3' : 'local')).toLowerCase().trim();
        localRoot = process.env.STORAGE_LOCAL_ROOT || DEFAULT_LOCAL_ROOT;
      }
    } catch (e) {
      console.warn('[STORAGE CONFIG DB WARNING]', e.message);
    }
  }

  // Auto-enable force path style for MinIO / Localhost
  if (s3Endpoint && (s3Endpoint.includes('localhost') || s3Endpoint.includes('127.0.0.1') || s3Endpoint.includes('minio') || s3Endpoint.includes(':9000'))) {
    s3ForcePathStyle = true;
  }

  return {
    driver,
    localRoot: localRoot || DEFAULT_LOCAL_ROOT,
    s3Endpoint,
    s3Region: s3Region || 'us-east-1',
    s3Bucket: s3Bucket || 'montessori-nexus',
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

  // Relative storage path: schools/:schoolId/admissions/:applicationId/forms/:formId/:filename
  const relativePath = path.join('schools', cleanSchoolId, 'admissions', cleanAppId, 'forms', cleanFormId, cleanFilename).replace(/\\/g, '/');

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
 * Streams a private asset securely to authorized client
 */
export async function streamPrivateAsset({ schoolId, relativePath, req = null, res, prisma = null }) {
  if (!relativePath) {
    res.status(400).json({ error: 'Ruta de archivo no especificada' });
    return;
  }

  const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');

  // Extract schoolId from path if not explicitly provided (e.g. schools/school_123/...)
  const targetSchoolId = schoolId || (cleanPath.startsWith('schools/') ? cleanPath.split('/')[1] : null);

  // Verify school tenant isolation if schoolId provided
  if (schoolId && !cleanPath.startsWith(`schools/${schoolId}/`)) {
    res.status(403).json({ error: 'Acceso denegado a este archivo' });
    return;
  }

  const config = await getStorageConfigForSchool(targetSchoolId, prisma);

  const cleanFilename = path.basename(cleanPath).toLowerCase();
  const detectedMime = (
    cleanFilename.endsWith('.pdf') ? 'application/pdf' :
    cleanFilename.endsWith('.png') ? 'image/png' :
    cleanFilename.endsWith('.jpg') || cleanFilename.endsWith('.jpeg') ? 'image/jpeg' :
    cleanFilename.endsWith('.webp') ? 'image/webp' :
    cleanFilename.endsWith('.webm') ? 'video/webm' :
    cleanFilename.endsWith('.mp4') ? 'video/mp4' :
    cleanFilename.endsWith('.mov') ? 'video/quicktime' :
    cleanFilename.endsWith('.ogg') || cleanFilename.endsWith('.ogv') ? 'video/ogg' :
    cleanFilename.endsWith('.mp3') ? 'audio/mpeg' :
    cleanFilename.endsWith('.wav') ? 'audio/wav' :
    'application/octet-stream'
  );

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(cleanPath)}"`);
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

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

      const s3Params = {
        Bucket: config.s3Bucket,
        Key: cleanPath
      };

      if (req?.headers?.range) {
        s3Params.Range = req.headers.range;
      }

      const s3Obj = await s3.send(new GetObjectCommand(s3Params));

      if (s3Obj.ContentRange) {
        res.status(206);
        res.setHeader('Content-Range', s3Obj.ContentRange);
      }
      if (s3Obj.ContentLength) {
        res.setHeader('Content-Length', s3Obj.ContentLength);
      }

      res.setHeader('Content-Type', s3Obj.ContentType || detectedMime);
      s3Obj.Body.pipe(res);
      return;
    } catch (e) {
      console.error('[STORAGE S3 STREAM ERROR]', e.message);
      res.status(404).json({ error: 'Archivo no encontrado en almacenamiento seguro' });
      return;
    }
  }

  // Local private stream
  const fullPath = path.join(config.localRoot, cleanPath);
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Archivo no encontrado en disco' });
    return;
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req?.headers?.range;

  if (range && (detectedMime.startsWith('video/') || detectedMime.startsWith('audio/'))) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(fullPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': detectedMime,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    });
    file.pipe(res);
    return;
  }

  res.setHeader('Content-Type', detectedMime);
  res.setHeader('Content-Length', fileSize);

  const stream = fs.createReadStream(fullPath);
  stream.pipe(res);
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
 * Deletes a single form's directory
 */
export async function deleteFormFolder({ schoolId, applicationId, formId, prisma = null }) {
  if (!schoolId || !applicationId || !formId) return;

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const relativeDir = path.join('schools', String(schoolId), 'admissions', String(applicationId), 'forms', String(formId)).replace(/\\/g, '/');

  if (config.driver === 'local') {
    const fullDirPath = path.join(config.localRoot, relativeDir);
    if (fs.existsSync(fullDirPath)) {
      try {
        fs.rmSync(fullDirPath, { recursive: true, force: true });
        console.log(`🗑️ [STORAGE LOCAL] Deleted form folder: ${fullDirPath}`);
      } catch (e) {
        console.warn('[STORAGE ERROR]', e.message);
      }
    }
  }

  // Emit Webhook Event
  dispatchStorageWebhook({
    schoolId: String(schoolId),
    event: 'form.folder_deleted',
    applicationId: String(applicationId),
    formId: String(formId),
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
 * Generic save file abstraction supporting local and S3/MinIO
 */
export async function saveGenericFile({ schoolId, relativePath, buffer, mimeType, prisma = null }) {
  if (!relativePath || !buffer) {
    throw new Error('Faltan parámetros requeridos para guardar archivo');
  }

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');
  const size = buffer.length;

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
      Key: cleanPath,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream'
    }));

    return {
      success: true,
      url: `/api/storage/stream?file=${encodeURIComponent(cleanPath)}`,
      relativePath: cleanPath,
      size
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
    url: `/api/storage/stream?file=${encodeURIComponent(cleanPath)}`,
    relativePath: cleanPath,
    size
  };
}

/**
 * Generic delete file abstraction supporting local and S3/MinIO
 */
export async function deleteGenericFile({ schoolId, relativePath, prisma = null }) {
  if (!relativePath) return;

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');

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

      await s3.send(new DeleteObjectCommand({
        Bucket: config.s3Bucket,
        Key: cleanPath
      }));
    } catch (e) {
      console.warn('[STORAGE S3 DELETE FILE ERROR]', e.message);
    }
    return;
  }

  // Local filesystem
  const fullPath = path.join(config.localRoot, cleanPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.warn(`[STORAGE WARNING] Failed to delete file ${fullPath}:`, err.message);
    }
  }
}

/**
 * Generic delete folder abstraction supporting local and S3/MinIO
 */
export async function deleteGenericFolder({ schoolId, relativePath, prisma = null }) {
  if (!relativePath) return;

  const config = await getStorageConfigForSchool(schoolId, prisma);
  const cleanPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');

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

      const prefix = cleanPath.endsWith('/') ? cleanPath : cleanPath + '/';
      const list = await s3.send(new ListObjectsV2Command({ Bucket: config.s3Bucket, Prefix: prefix }));
      if (list.Contents && list.Contents.length > 0) {
        for (const item of list.Contents) {
          if (item.Key) {
            await s3.send(new DeleteObjectCommand({ Bucket: config.s3Bucket, Key: item.Key }));
          }
        }
      }
    } catch (e) {
      console.warn('[STORAGE S3 DELETE FOLDER ERROR]', e.message);
    }
    return;
  }

  // Local filesystem
  const fullPath = path.join(config.localRoot, cleanPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[STORAGE WARNING] Failed to delete folder ${fullPath}:`, err.message);
    }
  }
}

export const storageLocalRoot = DEFAULT_LOCAL_ROOT;
