import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FormFieldItem, KycDocumentVariant } from '@/lib/sqlite';
import {
  Camera,
  UploadCloud,
  Check,
  Trash2,
  CreditCard,
  BookOpen,
  Car,
  ScanLine,
  Eye,
  FileText,
  ShieldCheck,
  ArrowRight,
  X,
  RotateCcw,
  Zap,
  ZapOff,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { toast } from 'sonner';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { getDeepstreamClient } from '@/lib/deepstream';

let docLandmarkerInstance: FaceLandmarker | null = null;
let docLandmarkerPromise: Promise<FaceLandmarker | null> | null = null;

async function getDocFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (docLandmarkerInstance) return docLandmarkerInstance;
  if (docLandmarkerPromise) return docLandmarkerPromise;

  docLandmarkerPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        runningMode: 'IMAGE',
        numFaces: 4
      });
      docLandmarkerInstance = landmarker;
      return landmarker;
    } catch {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          runningMode: 'IMAGE',
          numFaces: 4
        });
        docLandmarkerInstance = landmarker;
        return landmarker;
      } catch (err) {
        console.warn('FaceLandmarker load failed in DocumentCaptureWidget:', err);
        return null;
      }
    }
  })();

  return docLandmarkerPromise;
}

function enhanceImageForBiometrics(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  try {
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const gray = new Float32Array(w * h);
    let minLum = 255;
    let maxLum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      gray[i / 4] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    const range = maxLum - minLum || 1;
    const stretched = new Float32Array(w * h);
    for (let i = 0; i < gray.length; i++) {
      stretched[i] = Math.min(255, Math.max(0, ((gray[i] - minLum) / range) * 255));
    }

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const center = stretched[idx];
        const blur = (
          stretched[idx - 1] +
          stretched[idx + 1] +
          stretched[idx - w] +
          stretched[idx + w]
        ) * 0.25;

        const sharpened = center + 0.6 * (center - blur);
        const finalVal = Math.min(255, Math.max(0, Math.round(sharpened)));

        const pixelIdx = idx * 4;
        data[pixelIdx] = finalVal;
        data[pixelIdx + 1] = finalVal;
        data[pixelIdx + 2] = finalVal;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('enhanceImageForBiometrics skipped:', e);
  }
}

export interface FaceDetectionResult {
  hasFace: boolean;
  faceTooLarge: boolean;
}

export async function detectFaceInImage(imageSource: string | File | Blob): Promise<FaceDetectionResult> {
  return new Promise((resolve) => {
    let url = '';
    let isCreatedUrl = false;
    if (typeof imageSource === 'string') {
      url = imageSource;
    } else {
      url = URL.createObjectURL(imageSource);
      isCreatedUrl = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          if (isCreatedUrl) URL.revokeObjectURL(url);
          resolve({ hasFace: false, faceTooLarge: false });
          return;
        }

        const landmarker = await getDocFaceLandmarker();
        if (!landmarker) {
          if (isCreatedUrl) URL.revokeObjectURL(url);
          resolve({ hasFace: true, faceTooLarge: false });
          return;
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.min(w, 800);
        tempCanvas.height = Math.round((h / w) * tempCanvas.width);
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          
          // 1. Try detecting on raw image first
          let detection = landmarker.detect(tempCanvas);
          
          // 2. If raw detection fails, try after biometric contrast enhancement
          if (!detection || !detection.faceLandmarks || detection.faceLandmarks.length === 0) {
            enhanceImageForBiometrics(tempCanvas);
            detection = landmarker.detect(tempCanvas);
          }

          let hasFace = false;
          let faceTooLarge = false;

          if (detection && detection.faceLandmarks && detection.faceLandmarks.length > 0) {
            hasFace = true;
            // Iterate all detected faces (handles ghost portraits + watermarks)
            for (const landmarks of detection.faceLandmarks) {
              let minX = 1.0;
              let maxX = 0.0;
              let minY = 1.0;
              let maxY = 0.0;
              for (const pt of landmarks) {
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
              }
              const faceWidthRatio = maxX - minX;
              const faceHeightRatio = maxY - minY;
              const faceCenterX = (minX + maxX) / 2;

              // Selfie rejection logic:
              // - Too large (width > 42% or height > 50%)
              // - Centered in middle third of card (0.38 - 0.62) AND relatively large (> 28%)
              const isCenteredSelfie = (faceCenterX >= 0.38 && faceCenterX <= 0.62) && (faceWidthRatio > 0.28);
              
              if (faceWidthRatio > 0.42 || faceHeightRatio > 0.50 || isCenteredSelfie) {
                faceTooLarge = true; // Selfie detected
              } else {
                faceTooLarge = false;
                break; // Found a valid small card face!
              }
            }
          }

          if (isCreatedUrl) URL.revokeObjectURL(url);
          resolve({ hasFace, faceTooLarge });
          return;
        }
        if (isCreatedUrl) URL.revokeObjectURL(url);
        resolve({ hasFace: true, faceTooLarge: false });
      } catch (err) {
        console.warn('Face detection error:', err);
        if (isCreatedUrl) URL.revokeObjectURL(url);
        resolve({ hasFace: true, faceTooLarge: false });
      }
    };
    img.onerror = () => {
      if (isCreatedUrl) URL.revokeObjectURL(url);
      resolve({ hasFace: false, faceTooLarge: false });
    };
    img.src = url;
  });
}

export interface KycCaptureSide {
  fileName: string;
  fileUrl: string;
  isImage?: boolean;
  fileSize?: string;
  capturedAt?: string;
}

export interface KycDocumentValue {
  selectedType: KycDocumentVariant;
  front?: KycCaptureSide;
  back?: KycCaptureSide;
  isComplete?: boolean;
}

export interface DocumentCaptureWidgetProps {
  field: FormFieldItem;
  value?: KycDocumentValue | any;
  fileInfo?: { fileName: string; fileUrl: string; isImage?: boolean; fileSize?: string };
  onProcessKycSide?: (fieldId: string, side: 'front' | 'back', file: File, docType: KycDocumentVariant) => void;
  onRemoveKycSide?: (fieldId: string, side: 'front' | 'back') => void;
  onSelectDocType?: (fieldId: string, docType: KycDocumentVariant) => void;
  onProcessFile?: (fieldId: string, file: File) => void;
  onRemoveFile?: (fieldId: string) => void;
  onOpenPreviewModal?: (url: string, title: string) => void;
  isDark?: boolean;
  themeColor?: string;
  borderRadius?: string;
  shadowStyle?: string;
  layoutVariant?: 'standard' | 'focus' | 'card';
}

const getRadiusClass = (rad: string = 'lg', elem: 'card' | 'button' | 'input' | 'badge' | 'icon' = 'card') => {
  if (!rad) return elem === 'card' ? 'rounded-2xl' : 'rounded-xl';
  const cleanRadius = typeof rad === 'string' ? rad.replace(/^rounded-/, '') : 'lg';

  if (cleanRadius === 'none' || rad === 'rounded-none' || rad === 'none') {
    return 'rounded-none';
  }

  switch (cleanRadius) {
    case 'sm':
      return elem === 'badge' ? 'rounded-xs' : elem === 'button' || elem === 'icon' ? 'rounded-sm' : elem === 'input' ? 'rounded-sm' : 'rounded-md';
    case 'md':
      return elem === 'badge' ? 'rounded-sm' : elem === 'button' || elem === 'icon' ? 'rounded-md' : elem === 'input' ? 'rounded-md' : 'rounded-lg';
    case 'xl':
      return elem === 'badge' ? 'rounded-md' : elem === 'button' || elem === 'icon' ? 'rounded-xl' : elem === 'input' ? 'rounded-xl' : 'rounded-2xl';
    case '2xl':
      return elem === 'badge' ? 'rounded-lg' : elem === 'button' || elem === 'icon' ? 'rounded-2xl' : elem === 'input' ? 'rounded-2xl' : 'rounded-3xl';
    case '3xl':
      return elem === 'badge' ? 'rounded-xl' : elem === 'button' || elem === 'icon' ? 'rounded-3xl' : elem === 'input' ? 'rounded-3xl' : 'rounded-3xl';
    case 'full':
      return elem === 'card' ? 'rounded-3xl' : 'rounded-full';
    case 'lg':
    default:
      return elem === 'badge' ? 'rounded-sm' : elem === 'button' || elem === 'icon' ? 'rounded-xl' : elem === 'input' ? 'rounded-xl' : 'rounded-2xl';
  }
};

// ----------------------------------------------------------------------------
// CLIENT-SIDE REAL-TIME CV / AI DOCUMENT ANALYZER & CLARITY PROCESSOR
// ----------------------------------------------------------------------------
export interface CropRect {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
}

interface CvAnalysisResult {
  isAligned: boolean;
  feedback: string;
  brightness: number; // 0 - 100
  sharpness: number;  // 0 - 100
  cardDetected: boolean;
  borderScore: number;
  cropRect?: CropRect;
  glareRatio?: number;
}

/**
 * Adaptive Document Image & Text Contrast Enhancer (CLAHE-inspired dynamic range optimization)
 */
function enhanceDocumentClarity(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    const len = d.length;

    // 1. Calculate average document background & text luminance
    let totalLum = 0;
    let minLum = 255;
    let maxLum = 0;
    for (let i = 0; i < len; i += 16) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      totalLum += lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }
    const avgLum = totalLum / (len / 16);

    // 2. Compute adaptive gamma & contrast curve
    let gamma = 0.94;
    let shadowLift = 0;
    if (avgLum < 120) {
      // Document is in shadow: lift shadows and increase contrast
      gamma = 0.82;
      shadowLift = (120 - avgLum) * 0.35;
    } else if (avgLum > 185) {
      // High glare/brightness: soft compress
      gamma = 1.08;
    }

    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
      const normalized = i / 255;
      const corrected = Math.pow(normalized, gamma) * 255 + shadowLift;
      lut[i] = Math.min(255, Math.max(0, Math.round(corrected)));
    }

    for (let i = 0; i < len; i += 4) {
      d[i] = lut[d[i]];         // R
      d[i + 1] = lut[d[i + 1]]; // G
      d[i + 2] = lut[d[i + 2]]; // B
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('Document clarity enhancement bypassed:', e);
  }
}

/**
 * Precision ISO/IEC 7810 Document Auto-Crop & Framing
 * Extracts the exact document bounds from the camera stream, discarding all background table/scene.
 */
function createDocumentAutoCrop(
  sourceCanvas: HTMLCanvasElement,
  cropRect: CropRect | null,
  docType: KycDocumentVariant
): string {
  const isPassport = docType === 'passport';
  // Standard ISO/IEC 7810 target dimensions:
  // ID-1 (ID Cards, Driver Licenses): 1920x1210 (aspect ratio 1.586)
  // ID-3 (Passport): 1775x1250 (aspect ratio 1.42)
  const targetWidth = isPassport ? 1775 : 1920;
  const targetHeight = isPassport ? 1250 : 1210;

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  let sx = cropRect?.cropX ?? Math.round(srcW * 0.1);
  let sy = cropRect?.cropY ?? Math.round(srcH * 0.2);
  let sw = cropRect?.cropW ?? Math.round(srcW * 0.8);
  let sh = cropRect?.cropH ?? Math.round(srcH * 0.6);

  // Add 1.5% margin around the visual cutout so we don't clip card borders or security features
  const padX = Math.round(sw * 0.015);
  const padY = Math.round(sh * 0.015);

  sx = Math.max(0, sx - padX);
  sy = Math.max(0, sy - padY);
  sw = Math.min(srcW - sx, sw + padX * 2);
  sh = Math.min(srcH - sy, sh + padY * 2);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return sourceCanvas.toDataURL('image/jpeg', 0.95);

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  outCtx.drawImage(
    sourceCanvas,
    sx, sy, sw, sh,
    0, 0, targetWidth, targetHeight
  );

  // Apply Document Clarity & Contrast Filter
  enhanceDocumentClarity(outCtx, targetWidth, targetHeight);

  return outCanvas.toDataURL('image/jpeg', 0.95);
}

function analyzeVideoFrame(
  video: HTMLVideoElement,
  analysisCanvas: HTMLCanvasElement,
  maskElement: HTMLElement | null,
  docType: KycDocumentVariant,
  prevFrameRef: React.MutableRefObject<Float32Array | null>
): CvAnalysisResult {
  const ctx = analysisCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !video.videoWidth || !video.videoHeight) {
    return {
      isAligned: false,
      feedback: 'Iniciando escáner...',
      brightness: 50,
      sharpness: 0,
      cardDetected: false,
      borderScore: 0
    };
  }

  const vW = video.videoWidth;
  const vH = video.videoHeight;
  const vRect = video.getBoundingClientRect();

  // 1. Calculate the exact crop coordinates of the visual mask on the video stream
  let cropX = Math.round(vW * 0.1);
  let cropY = Math.round(vH * 0.2);
  let cropW = Math.round(vW * 0.8);
  let cropH = Math.round(vH * 0.6);

  if (maskElement && vRect.width > 0 && vRect.height > 0) {
    const scale = Math.max(vRect.width / vW, vRect.height / vH);
    const renderedW = vW * scale;
    const renderedH = vH * scale;
    const offsetX = (renderedW - vRect.width) / 2;
    const offsetY = (renderedH - vRect.height) / 2;

    const mRect = maskElement.getBoundingClientRect();
    cropX = Math.max(0, Math.round((mRect.left - vRect.left + offsetX) / scale));
    cropY = Math.max(0, Math.round((mRect.top - vRect.top + offsetY) / scale));
    cropW = Math.min(vW - cropX, Math.round(mRect.width / scale));
    cropH = Math.min(vH - cropY, Math.round(mRect.height / scale));
  }

  const cropRect: CropRect = { cropX, cropY, cropW, cropH };

  // 2. Draw only the cropped document area at optimized analysis resolution (240x150)
  const targetW = 240;
  const targetH = Math.round((cropH / cropW) * targetW);
  analysisCanvas.width = targetW;
  analysisCanvas.height = targetH;

  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

  const img = ctx.getImageData(0, 0, targetW, targetH);
  const data = img.data;
  const pixelCount = targetW * targetH;

  const gray = new Float32Array(pixelCount);
  let totalLuminance = 0;
  let glarePixels = 0;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    gray[i] = lum;
    totalLuminance += lum;
    if (lum > 248) glarePixels++;
  }

  // Measure frame-to-frame motion delta to ensure stillness
  let motionDelta = 0;
  if (prevFrameRef.current && prevFrameRef.current.length === pixelCount) {
    let diffSum = 0;
    const step = 4;
    for (let i = 0; i < pixelCount; i += step) {
      diffSum += Math.abs(gray[i] - prevFrameRef.current[i]);
    }
    motionDelta = diffSum / (pixelCount / step);
  }
  prevFrameRef.current = new Float32Array(gray);

  const isMoving = motionDelta > 16.0;

  const avgLuminance = totalLuminance / pixelCount;
  const isTooDark = avgLuminance < 25;
  const isTooBright = avgLuminance > 240;
  const glareRatio = glarePixels / pixelCount;
  const hasGlare = glareRatio > 0.25;

  // 3. Compute directional border gradients on 4 card margins and interior text texture
  let edgeCount = 0;
  let topBorderSum = 0, topBorderSamples = 0;
  let bottomBorderSum = 0, bottomBorderSamples = 0;
  let leftBorderSum = 0, leftBorderSamples = 0;
  let rightBorderSum = 0, rightBorderSamples = 0;
  let interiorEdgeSum = 0, interiorSamples = 0;

  let leftWeight = 0;
  let rightWeight = 0;
  let topWeight = 0;
  let bottomWeight = 0;

  const padX = Math.round(targetW * 0.18);
  const padY = Math.round(targetH * 0.18);

  for (let y = 1; y < targetH - 1; y += 2) {
    for (let x = 1; x < targetW - 1; x += 2) {
      const idx = y * targetW + x;
      const gx = gray[idx + 1] - gray[idx - 1];
      const gy = gray[idx + targetW] - gray[idx - targetW];
      const mag = Math.abs(gx) + Math.abs(gy);

      if (mag > 16) edgeCount++;

      // Directional border tracking on the 4 card edges
      if (y < padY) {
        topBorderSum += Math.abs(gy);
        topBorderSamples++;
      } else if (y > targetH - padY) {
        bottomBorderSum += Math.abs(gy);
        bottomBorderSamples++;
      }

      if (x < padX) {
        leftBorderSum += Math.abs(gx);
        leftBorderSamples++;
      } else if (x > targetW - padX) {
        rightBorderSum += Math.abs(gx);
        rightBorderSamples++;
      }

      // Interior document content region
      if (x >= padX && x <= targetW - padX && y >= padY && y <= targetH - padY) {
        interiorEdgeSum += mag;
        interiorSamples++;
      }

      // Balance weights
      if (x < targetW / 2) leftWeight += mag;
      else rightWeight += mag;

      if (y < targetH / 2) topWeight += mag;
      else bottomWeight += mag;
    }
  }

  const totalSamples = (targetW / 2) * (targetH / 2);
  const totalEdgeRatio = edgeCount / totalSamples;

  const avgTop = topBorderSamples > 0 ? topBorderSum / topBorderSamples : 0;
  const avgBottom = bottomBorderSamples > 0 ? bottomBorderSum / bottomBorderSamples : 0;
  const avgLeft = leftBorderSamples > 0 ? leftBorderSum / leftBorderSamples : 0;
  const avgRight = rightBorderSamples > 0 ? rightBorderSum / rightBorderSamples : 0;
  const avgInterior = interiorSamples > 0 ? interiorEdgeSum / interiorSamples : 0;

  // Evaluate distinct detected card borders (requires high gradient contrast along rectangular margins)
  const borderThreshold = 8.0;
  const detectedBordersCount = [
    avgTop > borderThreshold,
    avgBottom > borderThreshold,
    avgLeft > borderThreshold,
    avgRight > borderThreshold
  ].filter(Boolean).length;

  const totalWeightX = leftWeight + rightWeight;
  const totalWeightY = topWeight + bottomWeight;
  const balanceX = totalWeightX > 0 ? leftWeight / totalWeightX : 0.5;
  const balanceY = totalWeightY > 0 ? topWeight / totalWeightY : 0.5;

  const sharpnessScore = Math.min(100, Math.round(avgInterior * 2.2));
  const borderScore = Math.min(100, Math.round(((avgTop + avgBottom + avgLeft + avgRight) / 4) * 2.5));

  // A real document has distinct card boundary edges on at least 3 sides AND interior text contrast
  const hasCardBorders = detectedBordersCount >= 3;
  const hasInteriorContent = avgInterior > 6 && totalEdgeRatio > 0.05;
  const hasDocumentFeatures = hasCardBorders && hasInteriorContent;
  const isCentered = balanceX >= 0.30 && balanceX <= 0.70 && balanceY >= 0.28 && balanceY <= 0.72;

  let feedback = 'Coloca tu documento dentro del marco';
  let isAligned = false;

  if (isTooDark) {
    feedback = 'Demasiado oscuro. Busca mejor iluminación';
  } else if (isTooBright || hasGlare) {
    feedback = 'Evita reflejos de luz directa sobre el documento';
  } else if (!hasCardBorders) {
    feedback = 'Alinea los bordes del documento con el marco';
  } else if (!hasInteriorContent) {
    feedback = 'Acerca más el documento para enfocar el texto';
  } else if (!isCentered) {
    if (balanceX < 0.30) feedback = 'Mueve el documento más a la izquierda';
    else if (balanceX > 0.70) feedback = 'Mueve el documento más a la derecha';
    else if (balanceY < 0.28) feedback = 'Baja un poco el documento';
    else feedback = 'Sube un poco el documento';
  } else if (isMoving || sharpnessScore < 12) {
    feedback = 'Mantén quieto el documento...';
  } else {
    // Verified: Physical card borders confirmed on 4 margins, sharp interior text, steady!
    isAligned = true;
    feedback = 'Bordes detectados ✓ Capturando...';
  }

  return {
    isAligned,
    feedback,
    brightness: Math.min(100, Math.round((avgLuminance / 255) * 100)),
    sharpness: sharpnessScore,
    cardDetected: hasDocumentFeatures,
    borderScore,
    cropRect,
    glareRatio
  };
}

// ----------------------------------------------------------------------------
// FULLSCREEN AUTOCAPTURE LIVE SCANNER MODAL
// ----------------------------------------------------------------------------
interface DocumentScannerModalProps {
  isOpen: boolean;
  side: 'front' | 'back';
  docType: KycDocumentVariant;
  themeColor: string;
  borderRadius?: string;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  side,
  docType,
  themeColor,
  borderRadius = 'lg',
  onCapture,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Float32Array | null>(null);
  interface DocumentBurstCandidate {
    canvas: HTMLCanvasElement;
    cropRect: CropRect;
    score: number;
    sharpness: number;
    glareRatio: number;
    timestamp: number;
  }

  const burstBufferRef = useRef<DocumentBurstCandidate[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [faceTooLarge, setFaceTooLarge] = useState<boolean>(false);
  const [isCheckingFace, setIsCheckingFace] = useState(false);

  // Real-time AI Analysis State
  const [analysis, setAnalysis] = useState<CvAnalysisResult>({
    isAligned: false,
    feedback: 'Coloca tu documento dentro del marco',
    brightness: 50,
    sharpness: 0,
    cardDetected: false,
    borderScore: 0
  });
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 120s inactivity timeout

  // Initialize hidden analysis canvas
  useEffect(() => {
    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  const triggerServerFaceDetection = async (imageBase64: string) => {
    setIsCheckingFace(true);
    try {
      const dsClient = getDeepstreamClient();
      
      const response = await fetch('/api/kyc/detect-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      });
      const data = await response.json();
      
      if (data.success && data.jobId && dsClient) {
        const jobId = data.jobId;
        const eventName = `kyc-face-result:${jobId}`;
        
        console.log(`[KYC FALLBACK] Enqueued Job ID: ${jobId}. Subscribing to deepstream: ${eventName}`);
        
        // Timeout fallback (fail open in 15 seconds)
        const fallbackTimeout = setTimeout(() => {
          console.warn('[KYC FALLBACK] Server face detection timed out. Failing open.');
          dsClient.event.unsubscribe(eventName);
          setFaceDetected(true); 
          setFaceTooLarge(false);
          setIsCheckingFace(false);
        }, 15000);

        dsClient.event.subscribe(eventName, (eventData: any) => {
          clearTimeout(fallbackTimeout);
          console.log('[KYC FALLBACK] Deepstream event received:', eventData);
          setFaceDetected(eventData.hasFace);
          setFaceTooLarge(eventData.faceTooLarge);
          setIsCheckingFace(false);
          dsClient.event.unsubscribe(eventName);
        });
      } else {
        console.warn('[KYC FALLBACK] Queue failed or Deepstream unavailable. Failing open.');
        setFaceDetected(true);
        setFaceTooLarge(false);
        setIsCheckingFace(false);
      }
    } catch (err) {
      console.warn('[KYC FALLBACK] Error during server face check:', err);
      setFaceDetected(true);
      setFaceTooLarge(false);
      setIsCheckingFace(false);
    }
  };

  // Real-time AI Face Detection on captured snapshot
  useEffect(() => {
    if (capturedDataUrl) {
      setIsCheckingFace(true);
      setFaceDetected(null);
      setFaceTooLarge(false);
      detectFaceInImage(capturedDataUrl).then((res) => {
        if (res.hasFace) {
          setFaceDetected(true);
          setFaceTooLarge(res.faceTooLarge);
          setIsCheckingFace(false);
        } else {
          // Trigger server-side hybrid processing
          triggerServerFaceDetection(capturedDataUrl);
        }
      });
    } else {
      setFaceDetected(null);
      setFaceTooLarge(false);
      setIsCheckingFace(false);
    }
  }, [capturedDataUrl]);

  // 120-Second Timeout Countdown (Auto-close after 120s without framing)
  useEffect(() => {
    if (!isOpen || capturedDataUrl || isRequestingPermission) {
      if (!isOpen) setTimeLeft(120);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
          }
          setCapturedDataUrl(null);
          setHoldProgress(0);
          burstBufferRef.current = [];
          onClose();
          toast.error('Tiempo de escaneo excedido (120 s)', {
            description: 'La cámara se cerró automáticamente por inactividad. Puedes volver a intentarlo cuando tengas tu documento listo.'
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, capturedDataUrl, isRequestingPermission, stream, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Snap Snapshot Function (Extracts exact document auto-crop from best burst candidate)
  const handleSnap = useCallback((forcedDataUrl?: string) => {
    if (isAutoCapturing) return;

    // Flash visual animation
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    // Haptic vibration feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60, 50, 100]);
      } catch {
        // Ignore vibration failures silently (e.g., policy or lack of user gesture)
      }
    }

    if (forcedDataUrl) {
      setCapturedDataUrl(forcedDataUrl);
    } else {
      let sourceCanvas: HTMLCanvasElement | null = null;
      let cropRect: CropRect | null = null;

      // 1. Pick the single best candidate from the burst buffer (highest sharpness & lowest glare)
      if (burstBufferRef.current.length > 0) {
        const sorted = [...burstBufferRef.current].sort((a, b) => b.score - a.score);
        const best = sorted[0];
        if (best) {
          sourceCanvas = best.canvas;
          cropRect = best.cropRect;
        }
      }

      // 2. Direct fallback from video stream if buffer is empty
      if (!sourceCanvas && videoRef.current) {
        const video = videoRef.current;
        sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = video.videoWidth || 1920;
        sourceCanvas.height = video.videoHeight || 1080;
        const ctx = sourceCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, sourceCanvas.width, sourceCanvas.height);
        }
        if (analysis.cropRect) {
          cropRect = analysis.cropRect;
        }
      }

      if (sourceCanvas) {
        // Precision Auto-Crop only the document card + Clarity Enhancement
        const finalDataUrl = createDocumentAutoCrop(sourceCanvas, cropRect, docType);
        setCapturedDataUrl(finalDataUrl);
      }
    }

    burstBufferRef.current = [];
    setIsAutoCapturing(false);
    setHoldProgress(0);
  }, [isAutoCapturing, analysis.cropRect, docType]);

  // Start live camera stream
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setCapturedDataUrl(null);
      setHoldProgress(0);
      burstBufferRef.current = [];
      return;
    }

    let activeStream: MediaStream | null = null;
    let isCancelled = false;

    async function initCamera() {
      setIsRequestingPermission(true);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Tu navegador o conexión no soporta acceso a la cámara en vivo.');
        }

        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }

        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          });
        } catch (constraintErr: any) {
          if (constraintErr.name === 'NotAllowedError' || constraintErr.name === 'PermissionDeniedError') {
            throw constraintErr;
          }
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }

        if (isCancelled) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        setIsRequestingPermission(false);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.warn('Video play error:', e));
          };
        }

        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const caps: any = (videoTrack.getCapabilities && videoTrack.getCapabilities()) || {};
          setHasTorch(Boolean(caps.torch));
        }
      } catch (err: any) {
        setIsRequestingPermission(false);
        if (isCancelled) return;

        console.error('Camera access error:', err);

        if (activeStream) {
          activeStream.getTracks().forEach(t => t.stop());
        }
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
          setStream(null);
        }
        onClose();

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast.error('Permiso de cámara denegado', {
            description: 'Para capturar tu documento, permite el acceso a la cámara en los permisos de tu navegador.'
          });
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          toast.error('No se detectó ninguna cámara disponible en este dispositivo.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          toast.error('La cámara está siendo utilizada por otra aplicación.');
        } else {
          toast.error('No se pudo acceder a la cámara', {
            description: err.message || 'Verifica los permisos de tu navegador e inténtalo nuevamente.'
          });
        }
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Real-time Frame Analysis & Auto-Capture Loop (Runs every 100ms)
  useEffect(() => {
    if (!isOpen || !stream || capturedDataUrl || isRequestingPermission) {
      return;
    }

    let intervalId: any;

    intervalId = setInterval(() => {
      if (!videoRef.current || !analysisCanvasRef.current) return;
      if (videoRef.current.readyState < 2) return; // Wait for video to have enough data

      const result = analyzeVideoFrame(videoRef.current, analysisCanvasRef.current, maskRef.current, docType, prevFrameRef);
      setAnalysis(result);

      // Auto-Capture State Machine with Background Burst & Best-Shot Selection
      if (result.isAligned && result.cropRect) {
        // 1. In background, capture a high-resolution candidate into the burst buffer
        const video = videoRef.current;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = video.videoWidth || 1920;
        offCanvas.height = video.videoHeight || 1080;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

          const glareScore = (1 - (result.glareRatio || 0)) * 30;
          const brightnessFactor = 1 - Math.abs(result.brightness - 55) / 55;
          const compositeScore =
            (result.sharpness * 2.0) +
            (result.borderScore * 1.2) +
            (brightnessFactor * 20) +
            glareScore;

          burstBufferRef.current.push({
            canvas: offCanvas,
            cropRect: result.cropRect,
            score: compositeScore,
            sharpness: result.sharpness,
            glareRatio: result.glareRatio || 0,
            timestamp: Date.now()
          });

          if (burstBufferRef.current.length > 15) {
            burstBufferRef.current.shift();
          }
        }

        // 2. Advance stability hold progress (~0.4s to 0.5s of steady framing)
        setHoldProgress(prev => {
          const next = prev + 25;
          if (next >= 100) {
            handleSnap();
            return 100;
          }
          return next;
        });
      } else {
        // Smooth decay instead of instant wipeout on single frame jitter
        setHoldProgress(prev => Math.max(0, prev - 15));
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen, stream, capturedDataUrl, isRequestingPermission, handleSnap, docType]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Toggle front/back camera
  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

  // Confirm and save captured photo
  const handleConfirm = () => {
    if (!capturedDataUrl) return;

    if (faceDetected === false && (isPassport || side === 'front')) {
      toast.warning('No se detectó un rostro claro', {
        description: isPassport
          ? 'Para la verificación biométrica es necesario que tu fotografía sea visible en el pasaporte.'
          : 'Asegúrate de que al menos una cara de tu documento contenga tu fotografía visible.'
      });
    }

    try {
      const fileName = `${docType}_${side}_${Date.now()}.jpg`;
      const file = dataUrlToFile(capturedDataUrl, fileName);
      onCapture(file);
      handleClose();
    } catch (err) {
      console.error('Error processing captured photo:', err);
      toast.error('Error al procesar la captura de la fotografía.');
    }
  };

  // Close and stop stream
  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCapturedDataUrl(null);
    setHoldProgress(0);
    setTorchOn(false);
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const isPassport = docType === 'passport';
  const isLicense = docType === 'drivers_license';
  const docTitle = isPassport ? 'Pasaporte' : isLicense ? 'Licencia de Conducir' : 'INE / DNI / Cédula';
  const sideTitle = side === 'front' ? 'Frente (Anverso)' : 'Reverso (Dorso)';

  return createPortal(
    <div className="!mt-0 fixed inset-0 z-[999999] w-screen h-[100dvh] max-h-[100dvh] bg-black flex flex-col justify-between select-none overflow-hidden touch-none animate-in fade-in duration-200">

      {/* FLASH SCREEN ANIMATION */}
      {flashEffect && (
        <div className="absolute inset-0 z-50 bg-white animate-out fade-out duration-300 pointer-events-none" />
      )}

      {/* 1. TOP STATUS & CONTROLS BAR */}
      <div className="relative z-30 px-4 py-3 sm:py-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400">
            {isPassport ? <BookOpen className="w-4 h-4" /> : isLicense ? <Car className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold truncate">{docTitle} • {sideTitle}</h3>
            <p className="text-[10px] text-white/70">
              {capturedDataUrl ? 'Revisa la nitidez de la foto' : 'Captura automática inteligente'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 120s Timeout Countdown Badge */}
          {!capturedDataUrl && !isRequestingPermission && (
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md border transition-colors ${timeLeft <= 20
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
              : timeLeft <= 45
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-white/10 border-white/15 text-white/80'
              }`} title="Tiempo restante de escaneo automático">
              <Clock className="w-3 h-3" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Torch toggle if available */}
          {hasTorch && !capturedDataUrl && !isRequestingPermission && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${torchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              title="Linterna"
            >
              {torchOn ? <Zap className="w-4 h-4 fill-black" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 backdrop-blur-md transition-colors cursor-pointer"
            title="Cerrar escáner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. VIEWFINDER & LIVE MASK AREA */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Live Video (Always mounted to preserve stream and prevent camera black screen on retake) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            capturedDataUrl ? 'hidden' : 'block'
          }`}
        />

        {/* Clean Cropped Document Preview */}
        {capturedDataUrl && (
          <div className="relative z-20 max-w-[94vw] sm:max-w-2xl max-h-[75vh] p-2 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            <div className={`relative overflow-hidden shadow-2xl border border-white/25 bg-slate-950 max-h-[66vh] flex items-center justify-center ${getRadiusClass(borderRadius, 'card')}`}>
              <img
                src={capturedDataUrl}
                alt="Documento Optimizado"
                className="w-full h-auto max-h-[66vh] object-contain"
              />
              <div className={`absolute top-3 left-3 px-3 py-1 bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md ${getRadiusClass(borderRadius, 'badge')}`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Documento Recortado y Optimizado</span>
              </div>

              {/* AI Face Detection Badge on Document */}
              {isCheckingFace ? (
                <div className={`absolute bottom-3 left-3 px-3 py-1 bg-black/75 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md ${getRadiusClass(borderRadius, 'badge')}`}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Validando rostro en documento...</span>
                </div>
              ) : faceDetected === true && faceTooLarge ? (
                <div className={`absolute bottom-3 left-3 right-3 px-3 py-1.5 bg-amber-500 text-black text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md ${getRadiusClass(borderRadius, 'badge')}`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Se detectó una selfie directa. Enfoca la foto pequeña dentro de tu documento físico.</span>
                </div>
              ) : faceDetected === true ? (
                <div className={`absolute bottom-3 left-3 px-3 py-1 bg-emerald-600/95 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md ${getRadiusClass(borderRadius, 'badge')}`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Rostro Humano Detectado ✓</span>
                </div>
              ) : faceDetected === false && (isPassport || side === 'front') ? (
                <div className={`absolute bottom-3 left-3 right-3 px-3 py-1.5 bg-amber-500 text-black text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md ${getRadiusClass(borderRadius, 'badge')}`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{isPassport ? 'No se detectó un rostro en el pasaporte. Enfoca la página con tu foto.' : 'No se detectó rostro en esta cara. Asegúrate de que una de las caras contenga tu foto.'}</span>
                </div>
              ) : null}
            </div>
            <p className="text-center text-xs text-white/80 font-medium mt-3">
              Revisa que todos los datos y textos sean legibles antes de continuar.
            </p>
          </div>
        )}

        {/* Permission Request Loading Screen */}
        {isRequestingPermission && (
          <div className="relative z-30 max-w-sm mx-auto p-6 rounded-3xl bg-slate-900/90 border border-slate-700 text-center text-white space-y-4 m-4 backdrop-blur-xl animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-forest/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
              <Camera className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm">Iniciando Cámara...</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Por favor presiona <strong>"Permitir"</strong> cuando tu navegador te solicite permiso de acceso a la cámara.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Aspect Ratio Mask Cutout Overlay (Rendered ONLY during live camera scan, completely hidden after capture) */}
        {!isRequestingPermission && !capturedDataUrl && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            {/* Cutout Box matching ISO standard document dimensions with GLOWING auto-capture border */}
            <div
              ref={maskRef}
              className={`relative w-full max-w-[92vw] sm:max-w-[430px] rounded-2xl border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] flex flex-col justify-between p-3.5 sm:p-4 transition-colors duration-200 ${isPassport ? 'aspect-[125/88]' : 'aspect-[85.6/53.98]'
                } ${analysis.isAligned
                  ? 'border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.72),0_0_35px_rgba(52,211,153,0.9)] ring-2 ring-emerald-400/60'
                  : 'border-white/80'
                }`}
            >
              {/* 4 Corner framing brackets */}
              <div className={`absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-200 ${analysis.isAligned ? 'border-emerald-400' : 'border-white'
                }`} />
              <div className={`absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-200 ${analysis.isAligned ? 'border-emerald-400' : 'border-white'
                }`} />
              <div className={`absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-200 ${analysis.isAligned ? 'border-emerald-400' : 'border-white'
                }`} />
              <div className={`absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 rounded-br-xl transition-colors duration-200 ${analysis.isAligned ? 'border-emerald-400' : 'border-white'
                }`} />

              {/* Pulsing Scanline */}
              <div className={`absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)] top-1/2 -translate-y-1/2 transition-opacity ${analysis.isAligned ? 'opacity-100 animate-pulse' : 'opacity-50'
                }`} />

              {/* Mask Header Indicator */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-md flex items-center gap-1.5 shadow-xs transition-colors ${analysis.isAligned
                  ? 'bg-emerald-600/90 text-white border-emerald-400'
                  : 'bg-black/60 text-white border-white/20'
                  }`}>
                  <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{side === 'front' ? 'Cara 1: Anverso' : 'Cara 2: Reverso'}</span>
                </span>
                <span className="text-[9px] font-mono text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                  {isPassport ? 'Formato Pasaporte' : 'Formato Tarjeta ID'}
                </span>
              </div>

              {/* Silhouette Visual Guides */}
              {side === 'front' || isPassport ? (
                <div className="flex items-center gap-3 my-auto opacity-35">
                  <div className="w-14 h-18 sm:w-16 sm:h-20 border-2 border-dashed border-white rounded-lg flex flex-col items-center justify-center gap-1 text-white shrink-0">
                    <div className="w-5 h-5 rounded-full bg-white/60" />
                    <div className="w-9 h-4 rounded-t-full bg-white/60" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-white/60 rounded-full w-3/4" />
                    <div className="h-2 bg-white/40 rounded-full w-full" />
                    <div className="h-2 bg-white/40 rounded-full w-5/6" />
                    <div className="h-2 bg-white/40 rounded-full w-1/2" />
                  </div>
                </div>
              ) : (
                <div className="my-auto space-y-2.5 opacity-35">
                  <div className="flex justify-between items-center px-1">
                    <div className="h-4 w-12 bg-white/40 rounded" />
                    <div className="h-6 w-16 border border-white/50 rounded flex items-center justify-center text-[8px] text-white font-mono">
                      FIRMA
                    </div>
                  </div>
                  <div className="border-t-2 border-dashed border-white/60 pt-1.5 flex flex-col items-center justify-center gap-0.5 text-white font-mono text-[9px] tracking-widest">
                    <span>|||||| |||| |||||||| ||||| |||||||</span>
                    <span className="text-[7px] tracking-widest opacity-80">&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  </div>
                </div>
              )}

              {/* Real-Time AI Feedback Banner */}
              <div className="text-center">
                <span className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border shadow-lg inline-flex items-center gap-1.5 transition-colors duration-150 ${analysis.isAligned
                    ? 'bg-emerald-500 text-black border-emerald-300 font-extrabold'
                    : 'bg-black/75 text-white border-white/20'
                  }`}>
                  {analysis.isAligned && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  )}
                  <span>{analysis.feedback}</span>
                </span>
              </div>

              {/* Hold Progress Bar */}
              <div className="absolute -bottom-14 left-0 right-0 px-2 flex flex-col items-center pointer-events-none">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-xs p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full transition-all duration-100 ease-out shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
                <div className="h-5 flex items-center justify-center">
                  <p className={`text-center text-[10px] font-bold text-emerald-400 uppercase tracking-wider transition-opacity duration-150 ${holdProgress > 0 ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
                    Capturando automáticamente... {holdProgress}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROLS BAR */}
      <div className="relative z-30 px-6 py-5 sm:py-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-center min-h-[100px]">
        {capturedDataUrl ? (
          /* Snapshot Review Actions */
          <div className="w-full max-w-sm flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setCapturedDataUrl(null);
                setHoldProgress(0);
                burstBufferRef.current = [];
                if (videoRef.current && stream) {
                  videoRef.current.play().catch(() => {});
                }
              }}
              className={`flex-1 py-3 px-4 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-md transition-all cursor-pointer active:scale-95 ${getRadiusClass(borderRadius, 'button')}`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repetir Foto</span>
            </button>

            {(() => {
              const isFaceRequired = isPassport || side === 'front';
              const canUsePhoto = !isCheckingFace && (faceDetected === true && !faceTooLarge || !isFaceRequired);
              return (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canUsePhoto}
                  className={`flex-1 py-3 px-4 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-slate-700 ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: canUsePhoto ? '#059669' : undefined }}
                >
                  {isCheckingFace ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>{isCheckingFace ? 'Validando...' : 'Usar esta Foto'}</span>
                </button>
              );
            })()}
          </div>
        ) : !isRequestingPermission ? (
          /* Live AI Sensor Status (100% Automatic Capture) */
          <div className="w-full max-w-sm flex items-center justify-between px-4">
            {/* Flip camera button */}
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="w-12 h-12 rounded-full bg-white/15 text-white hover:bg-white/25 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Cambiar cámara"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Smart Auto-Capture Status Indicator (Non-clickable) */}
            <div className="flex flex-col items-center gap-1.5 pointer-events-none select-none">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  analysis.isAligned
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.6)] scale-105'
                    : 'border-white/30 bg-black/40'
                }`}
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
                    analysis.isAligned
                      ? 'bg-emerald-400 text-black animate-pulse'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  <ScanLine className="w-5 h-5" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-white/90 tracking-wide text-center">
                {analysis.isAligned ? 'Mantén quieto el documento...' : 'Autocaptura Inteligente'}
              </span>
            </div>

            {/* Right side balance spacer */}
            <div className="w-12 h-12 flex items-center justify-center">
              <span className="text-[10px] text-white/50 font-mono text-center">AI Auto</span>
            </div>
          </div>
        ) : null}
      </div>

    </div>,
    document.body
  );
};

// ----------------------------------------------------------------------------
// IMAGE LIGHTBOX FULLSCREEN MODAL COMPONENT
// ----------------------------------------------------------------------------
interface ImageLightboxModalProps {
  imageData: { url: string; title: string } | null;
  onClose: () => void;
  themeColor: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ imageData, onClose, themeColor }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!imageData) {
      setZoomLevel(1);
      setRotation(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageData, onClose]);

  if (!imageData || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="!mt-0 fixed inset-0 z-[999999] w-screen h-[100dvh] max-h-[100dvh] bg-black/92 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Header Bar */}
      <div
        className="px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between text-white relative z-10 border-b border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="w-9 h-9 rounded-xl bg-forest/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold truncate text-white">{imageData.title}</h3>
            <p className="text-[11px] text-white/70">Vista previa ampliada del documento</p>
          </div>
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.5, +(prev - 0.25).toFixed(2)))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Reducir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Reset / Current Scale */}
          <button
            type="button"
            onClick={() => { setZoomLevel(1); setRotation(0); }}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
            title="Restablecer tamaño y giro"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(3, +(prev + 0.25).toFixed(2)))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Rotate */}
          <button
            type="button"
            onClick={() => setRotation(prev => (prev + 90) % 360)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Girar foto 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer ml-1"
            title="Cerrar vista (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Pan / Zoom */}
      <div
        className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative cursor-zoom-out"
        onClick={onClose}
      >
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageData.url}
            alt={imageData.title}
            className="max-h-[76vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-transform duration-200"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div
        className="px-4 sm:px-6 py-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-white text-xs relative z-10 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-[11px] hidden sm:inline">Usa los botones de zoom o presiona <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Esc</kbd> para cerrar</span>
        <span className="text-white/60 text-[11px] sm:hidden">Toca fuera para cerrar</span>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition-colors cursor-pointer shadow-md"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
};

// ----------------------------------------------------------------------------
// KYC CAPTURE SLOT COMPONENT
// ----------------------------------------------------------------------------
interface KycCaptureSlotProps {
  side: 'front' | 'back';
  title: string;
  subtitle: string;
  docType: KycDocumentVariant;
  data?: KycCaptureSide;
  allowedDocTypes?: string;
  onProcessFile: (file: File) => void;
  onRemove: () => void;
  onOpenPreviewModal?: (url: string, title: string) => void;
  onOpenCameraScanner: () => void;
  isDark?: boolean;
  themeColor: string;
  borderRadius?: string;
  shadowStyle?: string;
  isFocus?: boolean;
}

export const KycCaptureSlot: React.FC<KycCaptureSlotProps> = ({
  side,
  title,
  subtitle,
  docType,
  data,
  allowedDocTypes,
  onProcessFile,
  onRemove,
  onOpenPreviewModal,
  onOpenCameraScanner,
  isDark = false,
  themeColor,
  borderRadius = 'lg',
  isFocus = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onProcessFile(file);
    }
  };

  // If already captured, show preview card
  if (data?.fileUrl) {
    return (
      <div className={`p-4 border space-y-3 relative group transition-all ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-slate-200'
        } ${getRadiusClass(borderRadius, 'card')}`}>
        {/* Slot Top Header */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 flex items-center gap-1.5 border border-emerald-500/20 ${getRadiusClass(borderRadius, 'badge')}`}>
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{title} Capturado</span>
          </span>
        </div>

        {/* Thumbnail Preview Area */}
        {!data.fileName?.toLowerCase().endsWith('.pdf') && !data.fileUrl?.toLowerCase().endsWith('.pdf') ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenPreviewModal?.(data.fileUrl, `${title} - ${data.fileName || 'Documento'}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenPreviewModal?.(data.fileUrl, `${title} - ${data.fileName || 'Documento'}`);
              }
            }}
            className={`relative h-44 sm:h-52 w-full overflow-hidden border cursor-pointer group/thumb flex items-center justify-center ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
              } ${getRadiusClass(borderRadius, 'input')}`}
          >
            <img
              src={data.fileUrl}
              alt={title}
              className="w-full h-full object-contain transition-transform duration-200 group-hover/thumb:scale-105"
            />

            {/* Hover / tap overlay with clear zoom CTA */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white backdrop-blur-2xs">
              <div className={`px-3.5 py-1.5 bg-white/25 hover:bg-white/35 backdrop-blur-md border border-white/30 flex items-center gap-2 text-xs font-bold shadow-lg ${getRadiusClass(borderRadius, 'button')}`}>
                <ZoomIn className="w-4 h-4 text-emerald-300" />
                <span>Ampliar foto</span>
              </div>
              <span className="text-[10px] text-white/80">Toca para pantalla completa</span>
            </div>

            {/* Always visible small zoom indicator badge */}
            <div className={`absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs shadow-sm transition-transform group-hover/thumb:scale-110 flex items-center gap-1 text-[10px] font-bold ${getRadiusClass(borderRadius, 'button')}`}>
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Ampliar</span>
            </div>

            {data.fileSize && (
              <span className={`absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 bg-black/60 text-white backdrop-blur-xs ${getRadiusClass(borderRadius, 'badge')}`}>
                {data.fileSize}
              </span>
            )}
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenPreviewModal?.(data.fileUrl, `${title} - ${data.fileName || 'Documento'}`)}
            className={`p-4 border flex items-center gap-3 cursor-pointer hover:border-forest/40 transition-colors ${getRadiusClass(borderRadius, 'input')} ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}
          >
            <FileText className="w-8 h-8 text-forest shrink-0" style={{ color: themeColor }} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{data.fileName || 'Documento adjunto'}</p>
              <p className="text-[10px] text-muted-foreground">Toca para ver archivo</p>
            </div>
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        )}

        {/* Action Buttons to Retake / Replace */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenCameraScanner}
            className={`flex-1 py-2 px-2.5 border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              } ${getRadiusClass(borderRadius, 'button')}`}
          >
            <Camera className="w-3.5 h-3.5 text-forest" style={{ color: themeColor }} />
            <span>Volver a Capturar</span>
          </button>

          {/* Desktop Only: Upload file replacement */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`hidden sm:flex flex-1 py-2 px-2.5 border text-[11px] font-bold transition-all items-center justify-center gap-1.5 cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              } ${getRadiusClass(borderRadius, 'button')}`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Cambiar Archivo</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={allowedDocTypes || '.pdf,.jpg,.jpeg,.png,.webp'}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onProcessFile(file);
            }}
          />
        </div>
      </div>
    );
  }

  // Empty Slot Card
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
      onDrop={handleDrop}
      className={`border-2 border-dashed transition-all duration-200 flex flex-col justify-between ${isFocus ? 'p-5 sm:p-6 space-y-4' : 'p-4 sm:p-5 space-y-3'
        } ${getRadiusClass(borderRadius, 'card')} ${isDragOver
          ? 'border-forest bg-forest/10 scale-[1.01]'
          : isDark
            ? 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
            : 'bg-white/80 border-slate-300/90 hover:border-forest/40 shadow-xs'
        }`}
    >
      {/* Visual Header & Mock ID Outline */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            {side === 'front' ? <CreditCard className="w-3.5 h-3.5" /> : <ScanLine className="w-3.5 h-3.5" />}
            {title}
          </span>
          <span className={`text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700 ${getRadiusClass(borderRadius, 'badge')}`}>
            {docType === 'passport' ? 'Pág. Principal' : side === 'front' ? 'Cara 1 / 2' : 'Cara 2 / 2'}
          </span>
        </div>

        {/* Blueprint ID Card Iconography */}
        <div className="relative py-1 sm:py-2">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${getRadiusClass(borderRadius, 'icon')}`}
            style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
          >
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div>
          <h4 className={`font-bold text-xs sm:text-sm font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Action Buttons: On Mobile ONLY Live Camera Photo Trigger is shown */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onOpenCameraScanner}
          className={`w-full flex items-center justify-center gap-2 p-3 sm:p-3.5 text-xs font-bold text-white shadow-sm hover:brightness-105 active:scale-98 transition-all cursor-pointer select-none ${getRadiusClass(borderRadius, 'button')}`}
          style={{ backgroundColor: themeColor }}
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>Tomar Foto con Cámara</span>
        </button>

        {/* Desktop Only: Upload File alternative */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`hidden sm:flex w-full items-center justify-center gap-2 p-2 sm:p-2.5 border text-xs font-bold transition-all cursor-pointer select-none ${isDark
            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            } ${getRadiusClass(borderRadius, 'button')}`}
        >
          <UploadCloud className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span>Subir Archivo / PDF (Solo PC)</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={allowedDocTypes || '.pdf,.jpg,.jpeg,.png,.webp'}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onProcessFile(file);
          }}
        />
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MAIN WIDGET COMPONENT
// ----------------------------------------------------------------------------
export const DocumentCaptureWidget: React.FC<DocumentCaptureWidgetProps> = ({
  field,
  value,
  fileInfo,
  onProcessKycSide,
  onRemoveKycSide,
  onSelectDocType,
  onProcessFile,
  onRemoveFile,
  onOpenPreviewModal,
  isDark = false,
  themeColor = '#1b3b2b',
  borderRadius = 'lg',
  shadowStyle = 'subtle',
  layoutVariant = 'standard'
}) => {
  const allowedVariants: KycDocumentVariant[] = useMemo(() => {
    if (field.allowedIdTypes && field.allowedIdTypes.length > 0) {
      return field.allowedIdTypes;
    }
    return ['id_card', 'passport', 'drivers_license'];
  }, [field.allowedIdTypes]);

  // Determine current active document type
  const [localDocType, setLocalDocType] = useState<KycDocumentVariant>(() => {
    if (value && typeof value === 'object' && value.selectedType && allowedVariants.includes(value.selectedType)) {
      return value.selectedType;
    }
    return allowedVariants[0] || 'id_card';
  });

  const activeDocType = (value && typeof value === 'object' && value.selectedType)
    ? value.selectedType
    : localDocType;

  const handleChooseType = (type: KycDocumentVariant) => {
    setLocalDocType(type);
    if (onSelectDocType) {
      onSelectDocType(field.id, type);
    }
  };

  // Resolve front & back data strictly from value if object, avoiding stale fileInfo resurrection
  const frontData: KycCaptureSide | undefined = (value && typeof value === 'object')
    ? (value.front?.fileUrl ? value.front : undefined)
    : (fileInfo?.fileUrl ? { fileName: fileInfo.fileName, fileUrl: fileInfo.fileUrl, fileSize: fileInfo.fileSize, isImage: fileInfo.isImage } : undefined);

  const backData: KycCaptureSide | undefined = (value && typeof value === 'object')
    ? (value.back?.fileUrl ? value.back : undefined)
    : undefined;

  const requiresTwoSides = activeDocType !== 'passport';
  const isComplete = requiresTwoSides ? Boolean(frontData && backData) : Boolean(frontData);
  const isFocus = layoutVariant === 'focus';

  // Step/Tab for mobile sequential capture
  const [mobileTab, setMobileTab] = useState<'front' | 'back'>(() => {
    if (frontData && !backData) return 'back';
    return 'front';
  });

  // Lightbox Preview Modal State (Self-contained for universal compatibility)
  const [internalLightbox, setInternalLightbox] = useState<{ url: string; title: string } | null>(null);

  const handleOpenPreviewModal = (url: string, title: string) => {
    setInternalLightbox({ url, title });
    if (onOpenPreviewModal) {
      onOpenPreviewModal(url, title);
    }
  };

  // Fullscreen Camera Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerSide, setScannerSide] = useState<'front' | 'back'>('front');

  const openCameraScanner = (side: 'front' | 'back') => {
    setScannerSide(side);
    setScannerOpen(true);
  };

  // Automatically switch tab on mobile if front is captured and back is not yet captured
  useEffect(() => {
    if (frontData && !backData && mobileTab === 'front') {
      setMobileTab('back');
    }
  }, [frontData?.fileUrl]);

  // Handler adapters
  const handleSlotCapture = (side: 'front' | 'back', file: File) => {
    if (onProcessKycSide) {
      onProcessKycSide(field.id, side, file, activeDocType);
    } else if (onProcessFile) {
      onProcessFile(field.id, file);
    }
    if (side === 'front' && requiresTwoSides && !backData) {
      setMobileTab('back');
    }
  };

  const handleSlotRemove = (side: 'front' | 'back') => {
    if (onRemoveKycSide) {
      onRemoveKycSide(field.id, side);
    } else if (onRemoveFile) {
      onRemoveFile(field.id);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full pb-4 sm:pb-1">
      {/* 1. Document Guide or Instructions */}
      {field.documentGuide && (
        <div className={`p-2.5 sm:p-3 border text-xs flex items-start gap-2 ${isDark ? 'bg-forest/10 border-forest/20 text-emerald-200' : 'bg-forest/5 border-forest/15 text-forest'
          } ${getRadiusClass(borderRadius, 'card')}`}>
          <ScanLine className="w-4 h-4 shrink-0 mt-0.5" style={{ color: themeColor }} />
          <div className="min-w-0 flex-1 leading-snug">
            <span className="font-bold block text-[10px] sm:text-[11px] uppercase tracking-wider opacity-75">Guía de Captura</span>
            <span className="text-xs font-medium">{field.documentGuide}</span>
          </div>
        </div>
      )}

      {/* 2. Document Variant Selection (If multiple are allowed) */}
      {allowedVariants.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Selecciona el documento que vas a presentar:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {allowedVariants.includes('id_card') && (
              <button
                type="button"
                onClick={() => handleChooseType('id_card')}
                className={`p-3 border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${activeDocType === 'id_card'
                  ? 'bg-white dark:bg-slate-900 border-2 shadow-xs ring-1 ring-forest/20'
                  : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80'
                  } ${getRadiusClass(borderRadius, 'button')}`}
                style={activeDocType === 'id_card' ? { borderColor: themeColor } : {}}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ${getRadiusClass(borderRadius, 'icon')}`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs truncate">INE / DNI / Cédula</p>
                    <p className="text-[10px] text-muted-foreground">Frente y Reverso</p>
                  </div>
                </div>
                {activeDocType === 'id_card' && (
                  <div className={`w-4 h-4 bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold ${getRadiusClass(borderRadius, 'badge')}`}>
                    ✓
                  </div>
                )}
              </button>
            )}

            {allowedVariants.includes('passport') && (
              <button
                type="button"
                onClick={() => handleChooseType('passport')}
                className={`p-3 border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${activeDocType === 'passport'
                  ? 'bg-white dark:bg-slate-900 border-2 shadow-xs ring-1 ring-forest/20'
                  : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80'
                  } ${getRadiusClass(borderRadius, 'button')}`}
                style={activeDocType === 'passport' ? { borderColor: themeColor } : {}}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 ${getRadiusClass(borderRadius, 'icon')}`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs truncate">Pasaporte</p>
                    <p className="text-[10px] text-muted-foreground">1 Sola Cara</p>
                  </div>
                </div>
                {activeDocType === 'passport' && (
                  <div className={`w-4 h-4 bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold ${getRadiusClass(borderRadius, 'badge')}`}>
                    ✓
                  </div>
                )}
              </button>
            )}

            {allowedVariants.includes('drivers_license') && (
              <button
                type="button"
                onClick={() => handleChooseType('drivers_license')}
                className={`p-3 border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${activeDocType === 'drivers_license'
                  ? 'bg-white dark:bg-slate-900 border-2 shadow-xs ring-1 ring-forest/20'
                  : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80'
                  } ${getRadiusClass(borderRadius, 'button')}`}
                style={activeDocType === 'drivers_license' ? { borderColor: themeColor } : {}}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ${getRadiusClass(borderRadius, 'icon')}`}>
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs truncate">Licencia Conducir</p>
                    <p className="text-[10px] text-muted-foreground">Frente y Reverso</p>
                  </div>
                </div>
                {activeDocType === 'drivers_license' && (
                  <div className={`w-4 h-4 bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold ${getRadiusClass(borderRadius, 'badge')}`}>
                    ✓
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Global Status Banner */}
      <div className={`p-3 border flex items-center justify-between gap-2 transition-all ${isComplete
        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-300'
        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
        } ${getRadiusClass(borderRadius, 'card')}`}>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <div className={`w-5 h-5 bg-emerald-600 text-white flex items-center justify-center font-bold text-xs ${getRadiusClass(borderRadius, 'badge')}`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className={`w-5 h-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs ${getRadiusClass(borderRadius, 'badge')}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="font-semibold text-xs">
            {isComplete
              ? '¡Documento verificado y listo para enviar!'
              : requiresTwoSides
                ? (frontData ? 'Frente listo. Ahora captura el reverso de tu documento.' : backData ? 'Reverso listo. Ahora captura el frente.' : 'Por favor captura ambas caras (Frente y Reverso).')
                : 'Por favor captura la fotografía de la página principal del pasaporte.'}
          </span>
        </div>
        <span className={`font-bold text-[11px] px-2 py-0.5 bg-white/80 dark:bg-slate-900/80 border border-black/5 dark:border-white/5 ${getRadiusClass(borderRadius, 'badge')}`}>
          {requiresTwoSides
            ? `${(frontData ? 1 : 0) + (backData ? 1 : 0)} / 2 Caras`
            : `${frontData ? 1 : 0} / 1 Cara`}
        </span>
      </div>

      {/* 4. Document Capture Slots */}
      {requiresTwoSides ? (
        <>
          {/* Desktop view (md and up): side-by-side grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-4">
            {/* Slot 1: Frente */}
            <KycCaptureSlot
              side="front"
              title="Frente / Anverso"
              subtitle="Cara con fotografía, nombre completo y datos"
              docType={activeDocType}
              data={frontData}
              allowedDocTypes={field.allowedDocTypes}
              onProcessFile={(file) => handleSlotCapture('front', file)}
              onRemove={() => handleSlotRemove('front')}
              onOpenPreviewModal={handleOpenPreviewModal}
              onOpenCameraScanner={() => openCameraScanner('front')}
              isDark={isDark}
              themeColor={themeColor}
              borderRadius={borderRadius}
              shadowStyle={shadowStyle}
              isFocus={isFocus}
            />

            {/* Slot 2: Reverso */}
            <KycCaptureSlot
              side="back"
              title="Reverso / Dorso"
              subtitle="Cara posterior con código de barras, firma o domicilio"
              docType={activeDocType}
              data={backData}
              allowedDocTypes={field.allowedDocTypes}
              onProcessFile={(file) => handleSlotCapture('back', file)}
              onRemove={() => handleSlotRemove('back')}
              onOpenPreviewModal={handleOpenPreviewModal}
              onOpenCameraScanner={() => openCameraScanner('back')}
              isDark={isDark}
              themeColor={themeColor}
              borderRadius={borderRadius}
              shadowStyle={shadowStyle}
              isFocus={isFocus}
            />
          </div>

          {/* Mobile view (< md): Sequential Step by Step with tabs */}
          <div className="block md:hidden space-y-3.5">
            {/* Mobile Step Selector / Progress Bar */}
            <div className={`p-1 flex items-center gap-1.5 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100/90 border-slate-200/80'
              } ${getRadiusClass(borderRadius, 'card')}`}>
              <button
                type="button"
                onClick={() => setMobileTab('front')}
                className={`flex-1 py-2 px-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${mobileTab === 'front'
                  ? (isDark ? 'bg-slate-800 text-white shadow-xs border border-slate-700' : 'bg-white text-slate-900 shadow-xs border border-slate-200/80')
                  : 'text-muted-foreground hover:text-foreground'
                  } ${getRadiusClass(borderRadius, 'button')}`}
              >
                {frontData ? (
                  <span className={`w-4 h-4 bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 ${getRadiusClass(borderRadius, 'badge')}`}>
                    ✓
                  </span>
                ) : (
                  <span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 ${getRadiusClass(borderRadius, 'badge')} ${mobileTab === 'front' ? 'text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`} style={mobileTab === 'front' ? { backgroundColor: themeColor } : {}}>
                    1
                  </span>
                )}
                <span className="truncate">1. Frente (Anverso)</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab('back')}
                className={`flex-1 py-2 px-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${mobileTab === 'back'
                  ? (isDark ? 'bg-slate-800 text-white shadow-xs border border-slate-700' : 'bg-white text-slate-900 shadow-xs border border-slate-200/80')
                  : 'text-muted-foreground hover:text-foreground'
                  } ${getRadiusClass(borderRadius, 'button')}`}
              >
                {backData ? (
                  <span className={`w-4 h-4 bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 ${getRadiusClass(borderRadius, 'badge')}`}>
                    ✓
                  </span>
                ) : (
                  <span className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 ${getRadiusClass(borderRadius, 'badge')} ${mobileTab === 'back' ? 'text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`} style={mobileTab === 'back' ? { backgroundColor: themeColor } : {}}>
                    2
                  </span>
                )}
                <span className="truncate">2. Reverso (Dorso)</span>
              </button>
            </div>

            {/* Active Mobile Step Card */}
            {mobileTab === 'front' ? (
              <div className="space-y-2.5">
                <KycCaptureSlot
                  side="front"
                  title="Frente / Anverso"
                  subtitle="Cara con fotografía, nombre completo y datos"
                  docType={activeDocType}
                  data={frontData}
                  allowedDocTypes={field.allowedDocTypes}
                  onProcessFile={(file) => handleSlotCapture('front', file)}
                  onRemove={() => handleSlotRemove('front')}
                  onOpenPreviewModal={handleOpenPreviewModal}
                  onOpenCameraScanner={() => openCameraScanner('front')}
                  isDark={isDark}
                  themeColor={themeColor}
                  borderRadius={borderRadius}
                  shadowStyle={shadowStyle}
                  isFocus={isFocus}
                />
                {frontData && !backData && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileTab('back');
                      openCameraScanner('back');
                    }}
                    className={`w-full py-3 px-4 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:brightness-105 active:scale-98 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                    style={{ backgroundColor: themeColor }}
                  >
                    <span>Siguiente: Tomar Foto del Reverso</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <KycCaptureSlot
                  side="back"
                  title="Reverso / Dorso"
                  subtitle="Cara posterior con código de barras, firma o domicilio"
                  docType={activeDocType}
                  data={backData}
                  allowedDocTypes={field.allowedDocTypes}
                  onProcessFile={(file) => handleSlotCapture('back', file)}
                  onRemove={() => handleSlotRemove('back')}
                  onOpenPreviewModal={handleOpenPreviewModal}
                  onOpenCameraScanner={() => openCameraScanner('back')}
                  isDark={isDark}
                  themeColor={themeColor}
                  borderRadius={borderRadius}
                  shadowStyle={shadowStyle}
                  isFocus={isFocus}
                />
                {!frontData && (
                  <button
                    type="button"
                    onClick={() => setMobileTab('front')}
                    className={`w-full py-2 px-3 border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Aún falta el frente. Toca aquí para capturar el anverso</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Single Slot (Passport) */
        <div className="w-full">
          <KycCaptureSlot
            side="front"
            title="Página Principal del Pasaporte"
            subtitle="Página con fotografía, datos personales y firma"
            docType={activeDocType}
            data={frontData}
            allowedDocTypes={field.allowedDocTypes}
            onProcessFile={(file) => handleSlotCapture('front', file)}
            onRemove={() => handleSlotRemove('front')}
            onOpenPreviewModal={handleOpenPreviewModal}
            onOpenCameraScanner={() => openCameraScanner('front')}
            isDark={isDark}
            themeColor={themeColor}
            borderRadius={borderRadius}
            shadowStyle={shadowStyle}
            isFocus={isFocus}
          />
        </div>
      )}

      {/* Fullscreen Live Camera Scanner Modal with Framing Mask */}
      <DocumentScannerModal
        isOpen={scannerOpen}
        side={scannerSide}
        docType={activeDocType}
        themeColor={themeColor}
        borderRadius={borderRadius}
        onCapture={(file) => handleSlotCapture(scannerSide, file)}
        onClose={() => setScannerOpen(false)}
      />

      {/* Self-contained Fullscreen Image Lightbox Preview Modal */}
      <ImageLightboxModal
        imageData={internalLightbox}
        onClose={() => setInternalLightbox(null)}
        themeColor={themeColor}
      />

      {/* Supported formats footer */}
      <div className="text-center pt-0.5">
        <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
          Captura nítida sin reflejos • Buena iluminación recomendada
        </span>
      </div>
    </div>
  );
};
