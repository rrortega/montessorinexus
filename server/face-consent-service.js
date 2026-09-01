import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pico from 'picojs';
import sharp from 'sharp';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getStorageConfigForSchool, storageServiceFor } from './storage-service.js';

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
 * Loads configurable parameters for Face Recognition and Matching from environment variables.
 */
export function getFaceMatchConfig() {
  const threshold = parseFloat(process.env.FACEMATCH_SIMILARITY_THRESHOLD) || 0.58;
  const minDetectionScore = parseFloat(process.env.FACEMATCH_MIN_DETECTION_SCORE) || 20.0;
  const marginPercent = parseFloat(process.env.FACEMATCH_MARGIN_PERCENT) || 0.12;
  const debug = process.env.FACEMATCH_DEBUG !== 'false';

  return { threshold, minDetectionScore, marginPercent, debug };
}

/**
 * Checks if a buffer represents a valid image (JPEG, PNG, WebP, GIF, SVG) and not HTML/text error pages
 */
function isValidImageBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 16) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // WebP: RIFF ... WEBP
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return true;
  // GIF: GIF87a / GIF89a
  if (buffer.slice(0, 3).toString('ascii') === 'GIF') return true;
  // SVG / XML
  const startStr = buffer.slice(0, 100).toString('utf8').trim();
  if (startStr.includes('<svg') || (startStr.includes('<?xml') && !startStr.includes('<html'))) return true;
  // Filter out HTML error pages (e.g. 404/500 catchall)
  if (startStr.startsWith('<!DOCTYPE') || startStr.startsWith('<html') || startStr.includes('Cannot GET')) return false;

  return true;
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
    const buf = Buffer.from(base64Data, 'base64');
    return isValidImageBuffer(buf) ? buf : null;
  }

  // 2. HTTP/HTTPS Remote URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const response = await fetch(trimmed);
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && !contentType.includes('text/html') && !contentType.includes('application/json')) {
        const arrayBuffer = await response.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        if (isValidImageBuffer(buf)) return buf;
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
        const buf = fs.readFileSync(candidate);
        if (isValidImageBuffer(buf)) return buf;
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
            const buf = Buffer.concat(chunks);
            if (isValidImageBuffer(buf)) return buf;
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
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && !contentType.includes('text/html') && !contentType.includes('application/json')) {
        const arr = await res.arrayBuffer();
        const buf = Buffer.from(arr);
        if (isValidImageBuffer(buf)) return buf;
      }
    } catch {}
  }

  return null;
}

/**
 * Runs PicoJS face detection on an image buffer and returns face bounding boxes
 */
export async function detectFacesInImage(imageBuffer) {
  if (!facefinderClassifyRegion || !imageBuffer || !isValidImageBuffer(imageBuffer)) {
    return { faces: [], width: 0, height: 0 };
  }

  try {
    // 1. Standardize image orientation from EXIF and obtain true post-rotation dimensions
    const rotatedBuffer = await sharp(imageBuffer).rotate().toBuffer();
    const rotatedImage = sharp(rotatedBuffer);
    const metadata = await rotatedImage.metadata();
    const origWidth = metadata.width || 800;
    const origHeight = metadata.height || 600;

    const maxDim = 1000;
    const scale = Math.min(1, maxDim / Math.max(origWidth, origHeight));
    const targetW = Math.round(origWidth * scale);
    const targetH = Math.round(origHeight * scale);

    const { data: grayPixels } = await rotatedImage
      .resize(targetW, targetH, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const minsize = Math.max(16, Math.round(Math.min(targetW, targetH) * 0.025));
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

    dets = pico.cluster_detections(dets, 0.2);
    const { minDetectionScore } = getFaceMatchConfig();
    const confident = dets.filter(d => d[3] >= minDetectionScore);

    const rawBoxes = confident.map(det => {
      const rowScaled = det[0]; // Y center
      const colScaled = det[1]; // X center
      const sizeScaled = det[2]; // diameter
      const score = det[3];

      // Project back to original rotated image dimensions
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

    // 1. Sort raw boxes by score descending and deduplicate by IoU and skin texture
    rawBoxes.sort((a, b) => b.score - a.score);
    const validCandidateBoxes = [];

    for (const item of rawBoxes) {
      const b1 = item.box;
      let hasOverlap = false;

      for (const kept of validCandidateBoxes) {
        const b2 = kept.box;
        const xOverlap = Math.max(0, Math.min(b1.x + b1.width, b2.x + b2.width) - Math.max(b1.x, b2.x));
        const yOverlap = Math.max(0, Math.min(b1.y + b1.height, b2.y + b2.height) - Math.max(b1.y, b2.y));
        const intersection = xOverlap * yOverlap;
        const union = (b1.width * b1.height) + (b2.width * b2.height) - intersection;
        const iou = union > 0 ? intersection / union : 0;
        if (iou > 0.25) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap && b1.width >= 16 && b1.height >= 16) {
        const isGenuineFaceSkin = await validateFaceSkinAndTexture(rotatedBuffer, b1);
        if (isGenuineFaceSkin) {
          validCandidateBoxes.push(item);
        }
      }
    }

    // 2. Anatomical Body & Torso Suppression:
    // When multiple detections are aligned on the same vertical body column, the uppermost detection (smaller y)
    // is the real head, while any lower detection at chest/torso/belly height is a false positive artifact on clothing.
    const faces = [];
    // Sort spatially from top to bottom (by y ascending)
    validCandidateBoxes.sort((a, b) => a.box.y - b.box.y);

    for (let i = 0; i < validCandidateBoxes.length; i++) {
      const current = validCandidateBoxes[i];
      const curBox = current.box;
      let isTorsoFalsePositive = false;

      for (let j = 0; j < faces.length; j++) {
        const headBox = faces[j].box;
        // Check horizontal alignment (X center distance)
        const curCenterX = curBox.x + curBox.width / 2;
        const headCenterX = headBox.x + headBox.width / 2;
        const xDist = Math.abs(curCenterX - headCenterX);
        const maxAllowedXOffset = Math.max(headBox.width, curBox.width) * 0.75;

        // Check vertical distance below head (y distance between 0.8x and 3.0x head height)
        const yDistBelowHead = curBox.y - headBox.y;

        if (xDist <= maxAllowedXOffset && yDistBelowHead > (headBox.height * 0.7) && yDistBelowHead < (headBox.height * 3.2)) {
          // This candidate is physically on the neck/chest/belly/torso of the person above it
          isTorsoFalsePositive = true;
          break;
        }
      }

      if (!isTorsoFalsePositive) {
        faces.push(current);
      }
    }

    return { faces, width: origWidth, height: origHeight };
  } catch (err) {
    console.error('[FACE CONSENT] Error in detectFacesInImage:', err);
    return { faces: [], width: 0, height: 0 };
  }
}

/**
 * Validates whether a candidate face bounding box contains human skin tone pixels (YCbCr chrominance)
 * and rejects reflective vest / fabric artifacts.
 */
async function validateFaceSkinAndTexture(imageBuffer, box) {
  try {
    if (!box || (box.width <= 4 && (!box.wPercent || box.wPercent <= 0))) return false;
    const { data } = await sharp(imageBuffer)
      .extract({
        left: Math.max(0, Math.round(box.x)),
        top: Math.max(0, Math.round(box.y)),
        width: Math.max(10, Math.round(box.width)),
        height: Math.max(10, Math.round(box.height))
      })
      .resize(32, 32, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let skinPixels = 0;
    let reflectiveVestPixels = 0;
    const totalPixels = 32 * 32;

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Detect synthetic high-saturation safety neon orange/yellow vest colors
      if (r > 200 && g > 70 && g < 180 && b < 50 && (r - g) > 50) {
        reflectiveVestPixels++;
      }

      // YCbCr skin chrominance formula
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      // Check skin gamut across all natural human complexions
      if (cb >= 75 && cb <= 135 && cr >= 130 && cr <= 175 && (r > g * 0.9 && (r - b) > 8)) {
        skinPixels++;
      }
    }

    // If candidate crop is predominantly a reflective orange safety vest, reject it
    if (reflectiveVestPixels / totalPixels > 0.30) {
      return false;
    }

    const skinRatio = skinPixels / totalPixels;
    return skinRatio >= 0.12;
  } catch (err) {
    return true; // Default to pass on extraction edge cases
  }
}

// Lookup table for Uniform LBP (59 bins: 58 uniform bit transitions + 1 non-uniform bin)
const uniformLBPMap = new Uint8Array(256);
(function initUniformLBP() {
  let uniformIdx = 0;
  for (let i = 0; i < 256; i++) {
    let transitions = 0;
    for (let b = 0; b < 8; b++) {
      const bit1 = (i >> b) & 1;
      const bit2 = (i >> ((b + 1) % 8)) & 1;
      if (bit1 !== bit2) transitions++;
    }
    if (transitions <= 2) {
      uniformLBPMap[i] = uniformIdx++;
    } else {
      uniformLBPMap[i] = 58; // non-uniform fallback bin
    }
  }
})();

/**
 * Computes a 59-bin Uniform Local Binary Patterns (LBP) microtexture histogram across 4x4 spatial cells
 * Provides high-precision facial microtexture analysis invariant to lighting shifts.
 */
function computeLBPHistogram(pixels, width = 64, height = 64) {
  const blocksX = 4;
  const blocksY = 4;
  const blockW = width / blocksX; // 16
  const blockH = height / blocksY; // 16
  const hist = new Float32Array(blocksX * blocksY * 59);

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const blockIdx = by * blocksX + bx;
      const histOffset = blockIdx * 59;
      let blockPixelCount = 0;

      for (let y = 1; y < blockH - 1; y++) {
        const py = by * blockH + y;
        for (let x = 1; x < blockW - 1; x++) {
          const px = bx * blockW + x;
          const center = pixels[py * width + px];

          // 8-neighbor comparative sampling
          let code = 0;
          if (pixels[(py - 1) * width + (px - 1)] >= center) code |= 1;
          if (pixels[(py - 1) * width + px] >= center) code |= 2;
          if (pixels[(py - 1) * width + (px + 1)] >= center) code |= 4;
          if (pixels[py * width + (px + 1)] >= center) code |= 8;
          if (pixels[(py + 1) * width + (px + 1)] >= center) code |= 16;
          if (pixels[(py + 1) * width + px] >= center) code |= 32;
          if (pixels[(py + 1) * width + (px - 1)] >= center) code |= 64;
          if (pixels[py * width + (px - 1)] >= center) code |= 128;

          const uBin = uniformLBPMap[code];
          hist[histOffset + uBin]++;
          blockPixelCount++;
        }
      }

      // Normalize histogram per block
      if (blockPixelCount > 0) {
        for (let b = 0; b < 59; b++) {
          hist[histOffset + b] /= blockPixelCount;
        }
      }
    }
  }

  return hist;
}

/**
 * Extracts a normalized 64x64 grayscale feature vector and spatial block descriptor from a face crop
 */
export async function extractNormalizedFaceFeature(imageBuffer, box, marginPercent = null) {
  try {
    if (!imageBuffer || !isValidImageBuffer(imageBuffer)) return null;

    const { marginPercent: defaultMargin } = getFaceMatchConfig();
    const margin = typeof marginPercent === 'number' ? marginPercent : defaultMargin;

    let pipeline = sharp(imageBuffer).rotate();

    if (box && box.width > 0 && box.height > 0) {
      const meta = await sharp(imageBuffer).rotate().metadata();
      const imgW = meta.width || (box.x + box.width * 2);
      const imgH = meta.height || (box.y + box.height * 2);

      const marginX = Math.round(box.width * margin);
      const marginY = Math.round(box.height * margin);

      const cropX = Math.max(0, Math.round(box.x - marginX));
      const cropY = Math.max(0, Math.round(box.y - marginY));
      const cropW = Math.min(imgW - cropX, Math.round(box.width + marginX * 2));
      const cropH = Math.min(imgH - cropY, Math.round(box.height + marginY * 2));

      pipeline = pipeline.extract({
        left: cropX,
        top: cropY,
        width: Math.max(10, cropW),
        height: Math.max(10, cropH)
      });
    }

    // Resize to standard 64x64 grayscale with adaptive normalization
    const { data: rawPixels } = await pipeline
      .resize(64, 64, { fit: 'fill' })
      .grayscale()
      .normalize()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Compute center-weighted Gaussian normalization for eye-nose-mouth region
    const centerNorm = new Float32Array(64 * 64);
    let sum = 0;
    const n = 64 * 64;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const dx = (x - 31.5) / 20;
        const dy = (y - 31.5) / 24;
        const weight = Math.exp(-(dx * dx + dy * dy) / 2);
        centerNorm[y * 64 + x] = rawPixels[y * 64 + x] * weight;
        sum += centerNorm[y * 64 + x];
      }
    }
    const mean = sum / n;

    let varSum = 0;
    for (let i = 0; i < n; i++) {
      const diff = centerNorm[i] - mean;
      varSum += diff * diff;
    }
    const std = Math.sqrt(varSum / n) || 1;

    // Compute Uniform LBP microtexture histogram across 16 blocks
    const lbpHist = computeLBPHistogram(rawPixels, 64, 64);

    return { rawPixels, centerNorm, mean, std, lbpHist };
  } catch (err) {
    return null;
  }
}

/**
 * Computes face similarity between two extracted face descriptors (0 to 1.0)
 * Uses a weighted combination of:
 * 1. Shift-Invariant Gaussian-Weighted Cross-Correlation (tolerant to minor cropping & alignment shifts)
 * 2. 59-bin Uniform Local Binary Patterns (LBP) with center cell prioritization
 */
export function computeFaceSimilarity(featA, featB) {
  if (!featA || !featB) return 0;

  const w = 64;
  const h = 64;

  // 1. Shift-Invariant Center-Weighted Cross-Correlation (-2 to +2 pixels)
  let bestNCC = 0;
  const shifts = [-2, -1, 0, 1, 2];

  for (const dy of shifts) {
    for (const dx of shifts) {
      let dot = 0;
      let count = 0;

      const yStart = Math.max(0, dy);
      const yEnd = Math.min(h, h + dy);
      const xStart = Math.max(0, dx);
      const xEnd = Math.min(w, w + dx);

      for (let y = yStart; y < yEnd; y++) {
        const yB = y - dy;
        const rowA = y * w;
        const rowB = yB * w;
        for (let x = xStart; x < xEnd; x++) {
          const xB = x - dx;
          const valA = featA.centerNorm[rowA + x] - featA.mean;
          const valB = featB.centerNorm[rowB + xB] - featB.mean;
          dot += valA * valB;
          count++;
        }
      }

      if (count > 0) {
        const curNCC = dot / (featA.std * featB.std * count);
        if (curNCC > bestNCC) {
          bestNCC = curNCC;
        }
      }
    }
  }
  const ncc = Math.max(0, Math.min(1, bestNCC));

  // 2. Uniform LBP Histogram Intersection across 16 blocks (central facial blocks receive 1.5x weight)
  let lbpSim = 0;
  if (featA.lbpHist && featB.lbpHist) {
    let intersectionSum = 0;
    let totalWeight = 0;

    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        const bIdx = by * 4 + bx;
        const offset = bIdx * 59;
        const isCenter = (by === 1 || by === 2) && (bx === 1 || bx === 2);
        const weight = isCenter ? 1.5 : 0.8;
        totalWeight += weight;

        let blockIntersect = 0;
        for (let b = 0; b < 59; b++) {
          blockIntersect += Math.min(featA.lbpHist[offset + b], featB.lbpHist[offset + b]);
        }
        intersectionSum += blockIntersect * weight;
      }
    }
    lbpSim = Math.max(0, Math.min(1, intersectionSum / totalWeight));
  }

  // Weighted Combination: 50% Shift-Invariant Center NCC + 50% Uniform Microtexture LBP
  const combined = (0.50 * ncc) + (0.50 * lbpSim);
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
export async function generateBlurredGalleryImage(originalBuffer, facesToBlur, imageId, schoolId = 'school_ceiba', prisma = null) {
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
      if (!box) continue;

      let bX = typeof box.x === 'number' ? box.x : 0;
      let bY = typeof box.y === 'number' ? box.y : 0;
      let bW = typeof box.width === 'number' ? box.width : 0;
      let bH = typeof box.height === 'number' ? box.height : 0;

      // If pixel width/height are not set, calculate from percentages
      if (bW <= 0 && box.wPercent > 0) {
        bX = Math.round((box.xPercent / 100) * width);
        bY = Math.round((box.yPercent / 100) * height);
        bW = Math.round((box.wPercent / 100) * width);
        bH = Math.round((box.hPercent / 100) * height);
      }

      if (bW <= 4 || bH <= 4) continue;

      // Expand bounding box slightly for complete facial coverage (20% margin)
      const padX = Math.round(bW * 0.20);
      const padY = Math.round(bH * 0.20);

      const cropX = Math.max(0, bX - padX);
      const cropY = Math.max(0, bY - padY);
      const cropW = Math.min(width - cropX, bW + padX * 2);
      const cropH = Math.min(height - cropY, bH + padY * 2);

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

    const cleanSchoolId = schoolId || 'school_ceiba';
    const filename = `blurred_${Date.now()}_${imageId.replace(/[^a-zA-Z0-9_-]/g, '')}.jpg`;
    const relativePath = `schools/${cleanSchoolId}/public/gallery/${filename}`;

    // Upload using school's configured storage provider (S3/MinIO, system storage, or local disk fallback with cache)
    const storage = await storageServiceFor(cleanSchoolId, prisma);
    const uploadResult = await storage.upload({
      relativePath,
      buffer: blurredResultBuffer,
      mimeType: 'image/jpeg'
    });

    return uploadResult?.url || `/api/storage/schools/${cleanSchoolId}/public/gallery/${filename}`;
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

    // 3b. Pre-extract parent/tutor and staff descriptors for face identification
    const candidateDescriptors = [...studentDescriptors.map(s => ({ ...s, isStudent: true }))];
    try {
      const usersWithAvatars = await prisma.user.findMany({
        where: {
          avatarUrl: { not: null },
          OR: [
            { memberships: { some: { schoolId } } },
            { studentLinks: { some: { student: { schoolId } } } }
          ]
        },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          staffRole: true,
          studentLinks: {
            where: { student: { schoolId } },
            include: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  environment: { select: { name: true } }
                }
              }
            }
          }
        }
      });

      for (const u of usersWithAvatars) {
        if (!u.avatarUrl || u.avatarUrl.trim() === '') continue;
        const avatarBuf = await resolveImageBuffer(u.avatarUrl, schoolId, prisma);
        if (!avatarBuf) continue;

        const avatarDetection = await detectFacesInImage(avatarBuf);
        let faceBox = null;
        if (avatarDetection.faces && avatarDetection.faces.length > 0) {
          faceBox = avatarDetection.faces[0].box;
        }

        const feature = await extractNormalizedFaceFeature(avatarBuf, faceBox);
        if (feature) {
          const children = (u.studentLinks || []).map(l => l.student).filter(Boolean);
          const childrenNames = children.map(c => c.fullName);
          const childrenSummary = childrenNames.length > 0
            ? `Mamá/Papá de ${childrenNames.join(', ')}`
            : (u.staffRole || 'Familia / Tutor');

          candidateDescriptors.push({
            isParentOrStaff: true,
            personType: childrenNames.length > 0 ? 'parent' : (u.staffRole ? 'staff' : 'user'),
            user: u,
            childrenSummary,
            feature
          });
        }
      }
      console.log(`👨‍👩‍👧 [FACE CONSENT] Loaded ${candidateDescriptors.length - studentDescriptors.length} parent/staff reference(s) for comparison`);
    } catch (uErr) {
      console.warn('[FACE CONSENT] Warning loading user avatars:', uErr.message);
    }

    // 4. Compare each detected face and apply 1-to-1 Maximum Similarity Greedy Assignment
    const config = getFaceMatchConfig();
    const faceFeatures = [];
    for (let i = 0; i < detectedFacesList.length; i++) {
      const feat = await extractNormalizedFaceFeature(imgBuffer, detectedFacesList[i].box, config.marginPercent);
      faceFeatures.push(feat);
    }

    // Collect all candidate pairings meeting the threshold
    const candidateMatches = [];
    if (candidateDescriptors.length > 0) {
      for (let fIdx = 0; fIdx < detectedFacesList.length; fIdx++) {
        const feat = faceFeatures[fIdx];
        if (!feat) continue;

        for (let cIdx = 0; cIdx < candidateDescriptors.length; cIdx++) {
          const cand = candidateDescriptors[cIdx];
          const sim = computeFaceSimilarity(feat, cand.feature);
          if (sim >= config.threshold) {
            candidateMatches.push({
              faceIndex: fIdx,
              candidateIndex: cIdx,
              candidate: cand,
              similarity: sim
            });
          }
        }
      }
    }

    // Sort all candidate matches descending by similarity score
    candidateMatches.sort((a, b) => b.similarity - a.similarity);

    // Greedily assign: 1 person cannot appear more than once in the same photo
    const assignedFaces = new Map(); // faceIndex -> { candidate, similarity }
    const usedCandidates = new Set(); // candidateIndex

    for (const match of candidateMatches) {
      if (!assignedFaces.has(match.faceIndex) && !usedCandidates.has(match.candidateIndex)) {
        assignedFaces.set(match.faceIndex, { candidate: match.candidate, similarity: match.similarity });
        usedCandidates.add(match.candidateIndex);
      }
    }

    const processedFaces = [];
    let hasAnyConsentIssue = false;
    const facesToBlur = [];

    for (let i = 0; i < detectedFacesList.length; i++) {
      const faceDet = detectedFacesList[i];
      const match = assignedFaces.get(i);
      const isMatched = Boolean(match);
      const bestMatch = match ? match.candidate : null;
      const highestSimilarity = match ? match.similarity : 0;
      const candidateName = bestMatch?.student?.fullName || bestMatch?.user?.fullName || 'N/A';

      if (config.debug) {
        if (isMatched) {
          console.log(`👤 [FACEMATCH] Face #${i + 1}: Assigned to="${candidateName}" | Score=${(highestSimilarity * 100).toFixed(1)}% | Threshold=${(config.threshold * 100).toFixed(1)}% -> MATCHED ✅`);
        } else {
          console.log(`👤 [FACEMATCH] Face #${i + 1}: Unidentified / Below threshold or identity claimed by higher confidence face -> UNASSIGNED ❌`);
        }
      }

      let personInfo = null;
      let consentResult = { hasConsent: true, consentNotes: 'No requiere consentimiento (rostro no identificado)' };

      if (isMatched && bestMatch) {
        if (bestMatch.isStudent && bestMatch.student) {
          const st = bestMatch.student;
          consentResult = checkStudentPhotoConsent(st.consents);
          personInfo = {
            personType: 'student',
            id: st.id,
            name: st.fullName,
            studentId: st.id,
            studentName: st.fullName,
            avatarUrl: st.avatarUrl || null,
            environmentName: st.environment?.name || null,
            confidence: Number(highestSimilarity.toFixed(2))
          };

          if (!consentResult.hasConsent) {
            hasAnyConsentIssue = true;
            facesToBlur.push({
              ...faceDet,
              studentName: st.fullName
            });
          }
        } else if (bestMatch.isParentOrStaff && bestMatch.user) {
          const u = bestMatch.user;
          personInfo = {
            personType: bestMatch.personType || 'parent',
            id: u.id,
            name: u.fullName || '',
            parentName: u.fullName || '',
            studentName: u.fullName || '',
            childrenSummary: bestMatch.childrenSummary,
            avatarUrl: u.avatarUrl || null,
            confidence: Number(highestSimilarity.toFixed(2))
          };
        }
      }

      processedFaces.push({
        box: faceDet.box,
        score: faceDet.score,
        isIdentified: isMatched,
        personType: personInfo?.personType || 'unknown',
        studentId: personInfo?.studentId || null,
        studentName: personInfo?.studentName || personInfo?.name || 'Persona no identificada',
        parentName: personInfo?.parentName || null,
        childrenSummary: personInfo?.childrenSummary || null,
        avatarUrl: personInfo?.avatarUrl || null,
        environmentName: personInfo?.environmentName || null,
        confidence: personInfo?.confidence || null,
        hasConsent: consentResult.hasConsent,
        consentNotes: consentResult.consentNotes,
        isBlurred: !consentResult.hasConsent
      });
    }

    // 5. Generate blurred image if there are consent issues
    let blurredSrc = null;
    if (hasAnyConsentIssue && facesToBlur.length > 0) {
      console.log(`🛡️ [FACE CONSENT] Generating blurred privacy version for ${facesToBlur.length} student(s) without consent...`);
      blurredSrc = await generateBlurredGalleryImage(imgBuffer, facesToBlur, imageId, schoolId, prisma);
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
 * Reprocesses all gallery images in a school where a specific student is NOT yet identified.
 * Called when a student's avatar/profile photo is added or updated.
 */
export async function reprocessUnmatchedGalleryImagesForStudent(studentId, schoolId, prisma) {
  console.log(`\n🔄 [STUDENT AVATAR REPROCESS] Checking gallery images to re-scan for Student ID: ${studentId} (School: ${schoolId})`);

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student || !student.avatarUrl || student.avatarUrl.trim() === '') {
      console.log(`[FACE CONSENT REPROCESS] Student ${studentId} has no avatarUrl. Skipping.`);
      return { totalReprocessed: 0, matchedImages: [] };
    }

    const allImages = await prisma.galleryImage.findMany({
      where: { schoolId },
      select: {
        id: true,
        detectedFaces: true
      }
    });

    // Filter to images where student is NOT yet identified
    const imagesToReprocess = allImages.filter(img => {
      let faces = [];
      try {
        faces = typeof img.detectedFaces === 'string' ? JSON.parse(img.detectedFaces || '[]') : (img.detectedFaces || []);
      } catch {
        faces = [];
      }
      const alreadyIdentified = faces.some(f => f.studentId === studentId);
      return !alreadyIdentified;
    });

    console.log(`📸 [FACE CONSENT REPROCESS] Found ${imagesToReprocess.length} image(s) where student ${student.fullName} was not previously identified. Starting re-scan...`);

    const reprocessedResults = [];
    for (const img of imagesToReprocess) {
      const res = await processGalleryImageFaceConsent(img.id, schoolId, prisma);
      reprocessedResults.push({ imageId: img.id, ...res });
    }

    console.log(`✅ [FACE CONSENT REPROCESS] Completed re-scan for student ${student.fullName}. Total processed: ${imagesToReprocess.length}`);
    return {
      totalReprocessed: imagesToReprocess.length,
      results: reprocessedResults
    };
  } catch (err) {
    console.error(`❌ [FACE CONSENT REPROCESS ERROR] Error re-scanning for student ${studentId}:`, err);
    return { totalReprocessed: 0, error: err.message };
  }
}

export async function scanAllGalleryImagesForConsents(schoolId, prisma) {
  try {
    const images = await prisma.galleryImage.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📸 [SCAN ALL CONSENTS] Scanning all ${images.length} images for school ${schoolId}...`);
    const results = [];
    for (const img of images) {
      const res = await processGalleryImageFaceConsent(img.id, schoolId, prisma);
      results.push({ imageId: img.id, ...res });
    }

    return {
      total: images.length,
      results
    };
  } catch (err) {
    console.error(`❌ [SCAN ALL CONSENTS ERROR] Error scanning gallery images for school ${schoolId}:`, err);
    throw err;
  }
}

/**
 * Manually updates detected faces array for an image, re-verifies student consent and regenerates blur if needed
 */
export async function updateGalleryImageFaces(imageId, facesArray, schoolId, prisma) {
  const galleryImage = await prisma.galleryImage.findUnique({
    where: { id: imageId }
  });

  if (!galleryImage || galleryImage.schoolId !== schoolId) {
    throw new Error('Fotografía no encontrada');
  }

  // Fetch all active students in school to verify mapping
  const students = await prisma.student.findMany({
    where: { schoolId },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      consents: true,
      environment: { select: { id: true, name: true } }
    }
  });

  const studentMap = new Map(students.map(s => [s.id, s]));

  const updatedFaces = [];
  let hasAnyConsentIssue = false;
  const facesToBlur = [];

  for (const face of facesArray) {
    let studentInfo = null;
    let consentResult = { hasConsent: true, consentNotes: 'No requiere consentimiento (rostro no identificado)' };
    let isIdentified = false;

    if (face.studentId && studentMap.has(face.studentId)) {
      const student = studentMap.get(face.studentId);
      consentResult = checkStudentPhotoConsent(student.consents);
      isIdentified = true;
      studentInfo = {
        id: student.id,
        name: student.fullName,
        avatarUrl: student.avatarUrl || null,
        environmentName: student.environment?.name || null,
        confidence: face.confidence ?? 1.0
      };

      if (!consentResult.hasConsent) {
        hasAnyConsentIssue = true;
        if (face.box && ((typeof face.box.width === 'number' && face.box.width > 0) || (typeof face.box.wPercent === 'number' && face.box.wPercent > 0))) {
          facesToBlur.push({
            box: face.box,
            studentName: student.fullName
          });
        }
      }
    }

    updatedFaces.push({
      box: face.box || { x: 0, y: 0, width: 100, height: 100, xPercent: 10, yPercent: 10, wPercent: 20, hPercent: 20 },
      score: face.score ?? 5.0,
      isIdentified,
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

  let blurredSrc = null;
  if (hasAnyConsentIssue && facesToBlur.length > 0) {
    const imgBuffer = await resolveImageBuffer(galleryImage.src, schoolId, prisma);
    if (imgBuffer) {
      blurredSrc = await generateBlurredGalleryImage(imgBuffer, facesToBlur, imageId, schoolId, prisma);
    }
  }

  const consentStatus = updatedFaces.length === 0
    ? 'no_faces'
    : hasAnyConsentIssue
    ? 'has_violations'
    : 'verified_clean';

  const updatedImage = await prisma.galleryImage.update({
    where: { id: imageId },
    data: {
      consentStatus,
      detectedFaces: JSON.stringify(updatedFaces),
      blurredSrc,
      hasConsentIssues: hasAnyConsentIssue
    },
    include: {
      gallery: {
        select: { id: true, name: true, isDefault: true, showOnWeb: true }
      }
    }
  });

  return updatedImage;
}


