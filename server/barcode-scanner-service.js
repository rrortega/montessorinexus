import sharp from 'sharp';
import jsQRPkg from 'jsqr';
import zxingPkg from '@zxing/library';

const jsQR = jsQRPkg.default || jsQRPkg;
const {
  MultiFormatReader,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  DecodeHintType,
  BarcodeFormat
} = zxingPkg;

/**
 * Converts a base64 or URL image into a Buffer
 */
async function getImageBuffer(imageInput) {
  if (!imageInput || typeof imageInput !== 'string') return null;
  const trimmed = imageInput.trim();
  if (trimmed.startsWith('data:image/')) {
    const base64Data = trimmed.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const res = await fetch(trimmed);
      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    } catch {
      return null;
    }
  }
  if (trimmed.length > 50) {
    return Buffer.from(trimmed, 'base64');
  }
  return null;
}

/**
 * Extracts structured data from Mexican INE QR payloads or standard ID barcodes
 */
function parseBarcodePayload(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim();
  const parsed = {
    rawText: text,
    isUrl: false,
    curp: null,
    electorKey: null,
    type: 'generic'
  };

  if (/^https?:\/\//i.test(text)) {
    parsed.isUrl = true;
    parsed.url = text;
    if (text.includes('ine.mx') || text.includes('listanominal.ine.mx')) {
      parsed.type = 'ine_official_verification_url';
    }
  }

  // Mexican CURP pattern (18 alphanumeric chars)
  const curpMatch = text.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d/i);
  if (curpMatch) {
    parsed.curp = curpMatch[0].toUpperCase();
  }

  // Mexican Voter Key pattern (18 alphanumeric chars starting with 6 letters)
  const voterKeyMatch = text.match(/[A-Z]{6}\d{8}[HM]\d{3}/i);
  if (voterKeyMatch) {
    parsed.electorKey = voterKeyMatch[0].toUpperCase();
  }

  return parsed;
}

/**
 * Scans an image buffer using jsQR with multi-pass and quadrant detection
 */
async function scanWithJsQr(imageBuf, width, height) {
  const detectedCodes = [];

  // Pass A: Full image RGBA raw pixel scan
  try {
    const { data: rawRgba } = await sharp(imageBuf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const code = jsQR(new Uint8ClampedArray(rawRgba), width, height, {
      inversionAttempts: 'attemptBoth'
    });

    if (code && code.data) {
      const loc = code.location;
      const xs = [loc.topLeftCorner.x, loc.topRightCorner.x, loc.bottomRightCorner.x, loc.bottomLeftCorner.x];
      const ys = [loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomRightCorner.y, loc.bottomLeftCorner.y];
      const minX = Math.max(0, Math.floor(Math.min(...xs)));
      const maxX = Math.min(width, Math.ceil(Math.max(...xs)));
      const minY = Math.max(0, Math.floor(Math.min(...ys)));
      const maxY = Math.min(height, Math.ceil(Math.max(...ys)));

      detectedCodes.push({
        format: 'QR_CODE',
        data: code.data,
        bbox: {
          left: minX,
          top: minY,
          width: Math.max(20, maxX - minX),
          height: Math.max(20, maxY - minY)
        }
      });
    }
  } catch (e) {
    // continue
  }

  // Pass B: Quadrant scanning for multiple QR codes (e.g. Mexican INE back has 2 QRs side-by-side or stacked)
  const quadrants = [
    { name: 'left_half', left: 0, top: 0, width: Math.floor(width * 0.55), height },
    { name: 'right_half', left: Math.floor(width * 0.45), top: 0, width: Math.ceil(width * 0.55), height },
    { name: 'bottom_left', left: 0, top: Math.floor(height * 0.4), width: Math.floor(width * 0.55), height: Math.ceil(height * 0.6) },
    { name: 'bottom_right', left: Math.floor(width * 0.45), top: Math.floor(height * 0.4), width: Math.ceil(width * 0.55), height: Math.ceil(height * 0.6) }
  ];

  for (const quad of quadrants) {
    try {
      const quadBuf = await sharp(imageBuf)
        .extract({ left: quad.left, top: quad.top, width: quad.width, height: quad.height })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const qCode = jsQR(new Uint8ClampedArray(quadBuf.data), quad.width, quad.height, {
        inversionAttempts: 'attemptBoth'
      });

      if (qCode && qCode.data) {
        const alreadyFound = detectedCodes.some(c => c.data === qCode.data);
        if (!alreadyFound) {
          const loc = qCode.location;
          const xs = [loc.topLeftCorner.x, loc.topRightCorner.x, loc.bottomRightCorner.x, loc.bottomLeftCorner.x];
          const ys = [loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomRightCorner.y, loc.bottomLeftCorner.y];
          const minX = Math.max(0, Math.floor(Math.min(...xs))) + quad.left;
          const maxX = Math.min(width, Math.ceil(Math.max(...xs))) + quad.left;
          const minY = Math.max(0, Math.floor(Math.min(...ys))) + quad.top;
          const maxY = Math.min(height, Math.ceil(Math.max(...ys))) + quad.top;

          detectedCodes.push({
            format: 'QR_CODE',
            data: qCode.data,
            bbox: {
              left: minX,
              top: minY,
              width: Math.max(20, maxX - minX),
              height: Math.max(20, maxY - minY)
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return detectedCodes;
}

/**
 * Scans an image buffer using @zxing/library for Multi-Format barcodes (QR, PDF417, DataMatrix)
 */
async function scanWithZxing(imageBuf, width, height) {
  const detectedCodes = [];
  const reader = new MultiFormatReader();
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.PDF_417,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.CODE_128
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  reader.setHints(hints);

  // Helper to decode an RGBA buffer
  const decodeRgba = async (buf, w, h, offsetX = 0, offsetY = 0) => {
    try {
      const len = w * h;
      const luminances = new Uint8ClampedArray(len);
      for (let i = 0; i < len; i++) {
        const r = buf[i * 4];
        const g = buf[i * 4 + 1];
        const b = buf[i * 4 + 2];
        luminances[i] = (r * 306 + g * 601 + b * 117) >> 10;
      }

      const lumSource = new RGBLuminanceSource(luminances, w, h);
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
      const result = reader.decode(binaryBitmap);

      if (result && result.getText()) {
        const pts = result.getResultPoints() || [];
        let minX = w, maxX = 0, minY = h, maxY = 0;
        if (pts.length > 0) {
          pts.forEach(p => {
            const px = p.getX();
            const py = p.getY();
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
          });
        } else {
          minX = 0;
          maxX = w;
          minY = 0;
          maxY = h;
        }

        const formatName = BarcodeFormat[result.getBarcodeFormat()] || 'BARCODE';
        detectedCodes.push({
          format: formatName,
          data: result.getText(),
          bbox: {
            left: Math.max(0, Math.floor(minX) + offsetX),
            top: Math.max(0, Math.floor(minY) + offsetY),
            width: Math.max(20, Math.ceil(maxX - minX)),
            height: Math.max(20, Math.ceil(maxY - minY))
          }
        });
      }
    } catch {
      // not found in this pass
    }
  };

  try {
    // Normal contrast full pass
    const { data: rawRgba } = await sharp(imageBuf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    await decodeRgba(rawRgba, width, height);

    // High contrast pass (ideal for PDF417 and dense INE QR)
    const { data: contrastRgba } = await sharp(imageBuf)
      .normalize()
      .linear(1.3, -20)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    await decodeRgba(contrastRgba, width, height);
  } catch {
    // ignore
  }

  return detectedCodes;
}

/**
 * Scans a single document side image and returns all detected QR/2D barcodes with auto-cropped snippets
 */
export async function scanDocumentSideForCodes(imageInput, side = 'front') {
  if (!imageInput) return [];
  const imageBuf = await getImageBuffer(imageInput);
  if (!imageBuf) return [];

  try {
    const meta = await sharp(imageBuf).metadata();
    const imgW = meta.width || 1000;
    const imgH = meta.height || 600;

    // Run parallel scanning passes
    const [jsQrResults, zxingResults] = await Promise.all([
      scanWithJsQr(imageBuf, imgW, imgH),
      scanWithZxing(imageBuf, imgW, imgH)
    ]);

    // Merge and deduplicate by raw data string
    const rawList = [...jsQrResults, ...zxingResults];
    const uniqueMap = new Map();

    for (const item of rawList) {
      if (!uniqueMap.has(item.data)) {
        uniqueMap.set(item.data, item);
      }
    }

    const processedCodes = [];
    for (const [dataStr, codeObj] of uniqueMap.entries()) {
      const bbox = codeObj.bbox;
      // Add safe 15px margin around the barcode
      const pad = 15;
      const cropLeft = Math.max(0, bbox.left - pad);
      const cropTop = Math.max(0, bbox.top - pad);
      const cropWidth = Math.min(imgW - cropLeft, bbox.width + (pad * 2));
      const cropHeight = Math.min(imgH - cropTop, bbox.height + (pad * 2));

      let croppedBase64 = null;
      try {
        const croppedBuf = await sharp(imageBuf)
          .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
          .png({ quality: 95 })
          .toBuffer();
        croppedBase64 = `data:image/png;base64,${croppedBuf.toString('base64')}`;
      } catch (cropErr) {
        console.warn('[BARCODE CROP WARNING]', cropErr.message);
      }

      const parsedPayload = parseBarcodePayload(dataStr);

      processedCodes.push({
        format: codeObj.format,
        data: dataStr,
        side,
        parsed: parsedPayload,
        boundingBox: {
          left: cropLeft,
          top: cropTop,
          width: cropWidth,
          height: cropHeight,
          left_pct: Number(((cropLeft / imgW) * 100).toFixed(2)),
          top_pct: Number(((cropTop / imgH) * 100).toFixed(2)),
          width_pct: Number(((cropWidth / imgW) * 100).toFixed(2)),
          height_pct: Number(((cropHeight / imgH) * 100).toFixed(2))
        },
        cropped_code_base64: croppedBase64,
        cropped_code_url: croppedBase64
      });
    }

    return processedCodes;
  } catch (err) {
    console.warn('[BARCODE SCANNING ERROR]', err.message);
    return [];
  }
}

/**
 * Scans both Front and Back sides of an identity document and generates a complete 2D barcode report
 */
export async function scanIdentityDocumentBarcodes({ frontImage, backImage = null }) {
  const [frontCodes, backCodes] = await Promise.all([
    frontImage ? scanDocumentSideForCodes(frontImage, 'front') : Promise.resolve([]),
    backImage ? scanDocumentSideForCodes(backImage, 'back') : Promise.resolve([])
  ]);

  const allCodes = [...frontCodes, ...backCodes];
  const qrCodes = allCodes.filter(c => c.format === 'QR_CODE');
  const pdf417Codes = allCodes.filter(c => c.format === 'PDF_417');

  return {
    detected: allCodes.length > 0,
    total_count: allCodes.length,
    qr_count: qrCodes.length,
    pdf417_count: pdf417Codes.length,
    codes: allCodes,
    qr_codes: qrCodes,
    pdf417_codes: pdf417Codes
  };
}
