import fs from 'fs';
import path from 'path';
import pico from 'picojs';
import jpeg from 'jpeg-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PicoJS Cascade Classifier
let facefinderClassifyRegion = null;

try {
  const cascadePath = path.join(__dirname, 'data', 'facefinder');
  const cascadeBuffer = fs.readFileSync(cascadePath);
  const bytes = new Int8Array(cascadeBuffer);
  facefinderClassifyRegion = pico.unpack_cascade(bytes);
  console.log('[KYC SERVICE] PicoJS facefinder cascade loaded and unpacked successfully.');
} catch (err) {
  console.error('[KYC SERVICE] Failed to load PicoJS cascade facefinder model:', err);
}

/**
 * Detects if there is a face in a base64-encoded JPEG image and
 * applies geometric rules to classify it as either a valid document portrait or a direct selfie.
 * 
 * @param {string} base64DataUrl
 * @returns {Promise<{ hasFace: boolean, faceTooLarge: boolean }>}
 */
export async function detectFaceInDocumentImage(base64DataUrl) {
  return new Promise((resolve, reject) => {
    try {
      if (!facefinderClassifyRegion) {
        // Fallback if model failed to load (fail open to prevent UX lock)
        console.warn('[KYC SERVICE] Face finder cascade not loaded, failing open.');
        resolve({ hasFace: true, faceTooLarge: false });
        return;
      }

      // Extract raw base64 data
      const commaIdx = base64DataUrl.indexOf(',');
      const base64Data = commaIdx >= 0 ? base64DataUrl.substring(commaIdx + 1) : base64DataUrl;
      const buffer = Buffer.from(base64Data, 'base64');

      // Decode JPEG using jpeg-js
      const img = jpeg.decode(buffer, { useTArray: true });
      const rgba = img.data;
      const w = img.width;
      const h = img.height;

      // Convert RGBA to Grayscale
      const gray = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const idx = i * 4;
        // Rec 709 high-precision luminance formula
        gray[i] = Math.round(0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2]);
      }

      // Run PicoJS cascade classifier
      // Setup detection parameters
      const minsize = Math.round(Math.min(w, h) * 0.08); // faces should be at least 8% of the dimension
      const maxsize = Math.min(w, h);
      const scaleFactor = 1.1;

      let dets = pico.run_cascade(
        {
          "pixels": gray,
          "nrows": h,
          "ncols": w,
          "ldim": w
        },
        facefinderClassifyRegion,
        {
          "shiftfactor": 0.1,
          "minsize": minsize,
          "maxsize": maxsize,
          "scalefactor": scaleFactor
        }
      );

      // Cluster detections to remove duplicate candidates
      dets = pico.cluster_detections(dets, 0.2);

      // PicoJS: det is [row, col, size, score]
      // A score >= 5.0 is highly confident for faces
      const confidentDetections = dets.filter(d => d[3] >= 5.0);

      let hasFace = confidentDetections.length > 0;
      let faceTooLarge = false;

      if (hasFace) {
        for (const det of confidentDetections) {
          const row = det[0]; // Y center
          const col = det[1]; // X center
          const size = det[2]; // diameter

          const faceWidthRatio = size / w;
          const faceHeightRatio = size / h;
          const faceCenterX = col / w;

          // Geometric check to see if it is a centered selfie
          const isCenteredSelfie = (faceCenterX >= 0.38 && faceCenterX <= 0.62) && (faceWidthRatio > 0.28);

          if (faceWidthRatio > 0.42 || faceHeightRatio > 0.50 || isCenteredSelfie) {
            faceTooLarge = true;
          } else {
            // Found a valid small card portrait
            faceTooLarge = false;
            break;
          }
        }
      }

      console.log(`[KYC SERVICE] Face analysis completed. Result: hasFace=${hasFace}, faceTooLarge=${faceTooLarge}`);
      resolve({ hasFace, faceTooLarge });
    } catch (err) {
      console.error('[KYC SERVICE] Error during face detection processing:', err);
      // Fallback: fail open in case of decoding errors so we don't lock the user
      resolve({ hasFace: true, faceTooLarge: false });
    }
  });
}
