import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FormFieldItem, SelfieLivenessValue, SelfieCaptureSide } from '@/lib/sqlite';
import {
 Camera,
 UploadCloud,
 Check,
 Trash2,
 ScanFace,
 Eye,
 ShieldCheck,
 X,
 RotateCcw,
 Sparkles,
 RefreshCw,
 Clock,
 Zap,
 ZapOff,
 Maximize2,
 ZoomIn,
 ZoomOut,
 RotateCw,
 CheckCircle2,
 Info,
 Loader2,
 AlertTriangle,
 Users,
 EyeOff,
 Play,
 Film,
 Smile,
 Glasses,
 Hand
} from 'lucide-react';
import { toast } from 'sonner';
import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface SelfieLivenessWidgetProps {
 field: FormFieldItem;
 value?: SelfieLivenessValue | any;
 onProcessSelfieStep?: (fieldId: string, step: 'step1' | 'step2' | 'videoClip', file: File) => void;
 onRemoveSelfieStep?: (fieldId: string, step: 'step1' | 'step2') => void;
 onResetSelfie?: (fieldId: string) => void;
 onOpenPreviewModal?: (url: string, title: string, isVideo?: boolean) => void;
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
// MEDIAPIPE FACE LANDMARKER SINGLETON LOADER
// ----------------------------------------------------------------------------
let faceLandmarkerInstance: FaceLandmarker | null = null;
let faceLandmarkerPromise: Promise<FaceLandmarker | null> | null = null;

async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
 if (faceLandmarkerInstance) return faceLandmarkerInstance;
 if (faceLandmarkerPromise) return faceLandmarkerPromise;

 faceLandmarkerPromise = (async () => {
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
 outputFaceBlendshapes: true,
 outputFacialTransformationMatrixes: true,
 runningMode: 'VIDEO',
 numFaces: 3
 });
 faceLandmarkerInstance = landmarker;
 return landmarker;
 } catch (err) {
 console.warn('GPU delegate failed for FaceLandmarker, falling back to CPU:', err);
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
 outputFaceBlendshapes: true,
 outputFacialTransformationMatrixes: true,
 runningMode: 'VIDEO',
 numFaces: 3
 });
 faceLandmarkerInstance = landmarker;
 return landmarker;
 } catch (cpuErr) {
 console.error('Failed to initialize MediaPipe FaceLandmarker:', cpuErr);
 return null;
 }
 }
 })();

 return faceLandmarkerPromise;
}

// ----------------------------------------------------------------------------
// FACE LANDMARKS & BIOMETRIC VALIDATION LOGIC (STEP-BY-STEP HIERARCHY)
// ----------------------------------------------------------------------------
interface ValidationResult {
 isValid: boolean;
 feedback: string;
 errorCode?:
 | 'NO_FACE'
 | 'MULTI_FACE'
 | 'NOT_CENTERED'
 | 'DISTANCE_WRONG'
 | 'HEADWEAR_OCCLUDED'
 | 'GLASSES_DETECTED'
 | 'PROFILE_POSE'
 | 'FACE_OCCLUDED'
 | 'EYES_CLOSED'
 | 'SMILE_REQUIRED'
 | 'MOVING';
 confidence: number;
 landmarks?: any[];
 eyeOpenScore?: number;
}

function evaluateFaceLiveness(
 result: FaceLandmarkerResult | null,
 step: 'step1' | 'step2',
 videoWidth: number,
 videoHeight: number,
 prevLandmarksRef: React.MutableRefObject<any[] | null>
): ValidationResult {
 // RESTRICTION 1: Face Presence & Single Person
 if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
 return {
 isValid: false,
 feedback: 'Coloca tu rostro dentro del óvalo',
 errorCode: 'NO_FACE',
 confidence: 0
 };
 }

 // RESTRICTION 1b: No multiple faces on screen
 if (result.faceLandmarks.length > 1) {
 return {
 isValid: false,
 feedback: 'Solo debe aparecer 1 persona en la cámara',
 errorCode: 'MULTI_FACE',
 confidence: 0
 };
 }

 const landmarks = result.faceLandmarks[0];
 const blendshapes = result.faceBlendshapes?.[0]?.categories || [];

 const nose = landmarks[1];
 const noseTip = landmarks[4];
 const chin = landmarks[152];
 const forehead = landmarks[10];
 const leftEyeOuter = landmarks[33];
 const rightEyeOuter = landmarks[263];
 const leftEyeInner = landmarks[133];
 const rightEyeInner = landmarks[362];
 const leftCheek = landmarks[234];
 const rightCheek = landmarks[454];
 const upperLip = landmarks[13];
 const lowerLip = landmarks[14];
 const mouthLeft = landmarks[61];
 const mouthRight = landmarks[291];

 const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
 const faceCenterY = (forehead.y + chin.y) / 2;
 const centerOffsetX = Math.abs(faceCenterX - 0.5);
 const centerOffsetY = Math.abs(faceCenterY - 0.5);

 const faceHeight = Math.abs(chin.y - forehead.y);
 const faceWidth = Math.abs(rightCheek.x - leftCheek.x);

 // RESTRICTION 2: Face must be centered and inside the oval guide (BOTH step 1 & step 2)
 if (centerOffsetX > 0.20 || centerOffsetY > 0.22) {
 return {
 isValid: false,
 feedback: 'Centra tu rostro dentro del óvalo',
 errorCode: 'NOT_CENTERED',
 confidence: 30,
 landmarks
 };
 }

 // Distance / framing within oval bounds (Calibrated to camera aspect ratios without false alarms)
 if (faceHeight < 0.12 || faceWidth < 0.10) {
 return {
 isValid: false,
 feedback: 'Acércate un poco más a la cámara',
 errorCode: 'DISTANCE_WRONG',
 confidence: 35,
 landmarks
 };
 }

 if (faceHeight > 0.80 || faceWidth > 0.75) {
 return {
 isValid: false,
 feedback: 'Aléjate un poco de la cámara',
 errorCode: 'DISTANCE_WRONG',
 confidence: 35,
 landmarks
 };
 }

 // Strict Oval Enclosure Check: Extreme points must stay inside the oval envelope
 const envelopePoints = [forehead, chin, leftCheek, rightCheek];
 for (const pt of envelopePoints) {
 const normX = (pt.x - 0.5) / 0.35;
 const normY = (pt.y - 0.5) / 0.45;
 if (normX * normX + normY * normY > 1.45) {
 return {
 isValid: false,
 feedback: 'Mantén todo tu rostro dentro del óvalo',
 errorCode: 'NOT_CENTERED',
 confidence: 40,
 landmarks
 };
 }
 }

 // RESTRICTION 7: No headwear, caps, hats or accessories covering head / forehead
 const eyebrowMidY = (landmarks[107].y + landmarks[336].y) / 2;
 const foreheadToEyebrow = Math.abs(forehead.y - eyebrowMidY);
 const foreheadRatio = faceHeight > 0 ? foreheadToEyebrow / faceHeight : 0.3;
 if (foreheadRatio < 0.13 || forehead.y < 0.04) {
 return {
 isValid: false,
 feedback: 'Retira gorras, sombreros o accesorios de la cabeza',
 errorCode: 'HEADWEAR_OCCLUDED',
 confidence: 50,
 landmarks
 };
 }

 // RESTRICTION 6: No glasses or sunglasses
 const noseBridgeZDiff = Math.abs((landmarks[6]?.z || 0) - (landmarks[168]?.z || 0));
 const innerEyeDist = Math.abs(rightEyeInner.x - leftEyeInner.x);
 const bridgeGlanceRatio = faceWidth > 0 ? innerEyeDist / faceWidth : 0.25;
 const eyeBridgeSpread = Math.abs((landmarks[130]?.x || 0) - leftEyeInner.x) + Math.abs(rightEyeInner.x - (landmarks[359]?.x || 0));
 const eyeBridgeRatio = faceWidth > 0 ? eyeBridgeSpread / faceWidth : 0.3;

 // Eyewear frame / reflection detection signature
 const hasGlassesSignature = noseBridgeZDiff > 0.046 || (eyeBridgeRatio < 0.15 && bridgeGlanceRatio > 0.33);
 if (hasGlassesSignature) {
 return {
 isValid: false,
 feedback: 'Retira tus lentes o espejuelos',
 errorCode: 'GLASSES_DETECTED',
 confidence: 55,
 landmarks
 };
 }

 // RESTRICTION 4: Looking directly at camera (Frontal pose - NO profile, tilt, or extreme pitch)
 const distLeft = Math.abs(nose.x - leftCheek.x);
 const distRight = Math.abs(nose.x - rightCheek.x);
 const totalDist = distLeft + distRight;
 const yawRatio = totalDist > 0 ? (distLeft - distRight) / totalDist : 0;

 if (Math.abs(yawRatio) > 0.16) {
 return {
 isValid: false,
 feedback: 'Mira directo de frente a la cámara (no de perfil)',
 errorCode: 'PROFILE_POSE',
 confidence: 60,
 landmarks
 };
 }

 const dy = rightEyeOuter.y - leftEyeOuter.y;
 const dx = rightEyeOuter.x - leftEyeOuter.x;
 const rollAngle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
 if (rollAngle > 10 && rollAngle < 170) {
 return {
 isValid: false,
 feedback: 'Endereza tu cabeza',
 errorCode: 'PROFILE_POSE',
 confidence: 60,
 landmarks
 };
 }

 const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
 const noseRelativeY = faceHeight > 0 ? (nose.y - eyeMidY) / faceHeight : 0.4;
 if (noseRelativeY < 0.25 || noseRelativeY > 0.52) {
 return {
 isValid: false,
 feedback: 'Mantén el rostro recto hacia la cámara',
 errorCode: 'PROFILE_POSE',
 confidence: 60,
 landmarks
 };
 }

 // RESTRICTION 5: No hands or objects occluding/covering face, mouth, chin, or cheeks
 const chinToMouth = Math.abs(chin.y - lowerLip.y);
 const noseToMouth = Math.abs(upperLip.y - noseTip.y);
 const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);

 if (
 chinToMouth / faceHeight < 0.10 ||
 noseToMouth / faceHeight < 0.11 ||
 mouthWidth / faceHeight < 0.14 ||
 (totalDist > 0 && Math.abs(distLeft - distRight) / totalDist > 0.32)
 ) {
 return {
 isValid: false,
 feedback: 'No cubras tu rostro con las manos ni objetos',
 errorCode: 'FACE_OCCLUDED',
 confidence: 65,
 landmarks
 };
 }

 // RESTRICTION 3: Eyes must be open (No closed eyes or blinking in both steps)
 let eyeBlinkLeft = 0;
 let eyeBlinkRight = 0;
 for (const b of blendshapes) {
 if (b.categoryName === 'eyeBlinkLeft') eyeBlinkLeft = b.score;
 if (b.categoryName === 'eyeBlinkRight') eyeBlinkRight = b.score;
 }

 const leftEyeHeight = Math.abs(landmarks[159].y - landmarks[145].y);
 const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x);
 const leftEAR = leftEyeWidth > 0 ? leftEyeHeight / leftEyeWidth : 0.3;

 const rightEyeHeight = Math.abs(landmarks[386].y - landmarks[374].y);
 const rightEyeWidth = Math.abs(landmarks[263].x - landmarks[362].x);
 const rightEAR = rightEyeWidth > 0 ? rightEyeHeight / rightEyeWidth : 0.3;

 const eyesClosed = eyeBlinkLeft > 0.45 || eyeBlinkRight > 0.45 || (leftEAR < 0.13 && rightEAR < 0.13);
 const eyeOpenScore = 1 - Math.max(eyeBlinkLeft, eyeBlinkRight);

 if (eyesClosed) {
 return {
 isValid: false,
 feedback: 'Abre bien los ojos (no parpadees)',
 errorCode: 'EYES_CLOSED',
 confidence: 70,
 landmarks,
 eyeOpenScore
 };
 }

 // STEP 2 CHALLENGE: Smile Challenge (while fully respecting all 7 restrictions inside the oval)
 if (step === 'step2') {
 let smileLeft = 0;
 let smileRight = 0;
 for (const b of blendshapes) {
 if (b.categoryName === 'mouthSmileLeft') smileLeft = b.score;
 if (b.categoryName === 'mouthSmileRight') smileRight = b.score;
 }
 const smileScore = (smileLeft + smileRight) / 2;
 if (smileScore < 0.30) {
 return {
 isValid: false,
 feedback: 'Sonríe para la cámara ',
 errorCode: 'SMILE_REQUIRED',
 confidence: 75,
 landmarks,
 eyeOpenScore
 };
 }
 }

 // RESTRICTION STILLNESS: Head stability while capturing
 let motionDistance = 0;
 if (prevLandmarksRef.current && prevLandmarksRef.current.length > 0) {
 const prev = prevLandmarksRef.current;
 const samplePoints = [1, 10, 152, 33, 263, 234, 454];
 let sumDist = 0;
 for (const idx of samplePoints) {
 const dX = (landmarks[idx].x - prev[idx].x) * videoWidth;
 const dY = (landmarks[idx].y - prev[idx].y) * videoHeight;
 sumDist += Math.sqrt(dX * dX + dY * dY);
 }
 motionDistance = sumDist / samplePoints.length;
 }
 prevLandmarksRef.current = landmarks;

 if (motionDistance > 4.5) {
 return {
 isValid: false,
 feedback: '¡Mantén la cabeza quieta!',
 errorCode: 'MOVING',
 confidence: 80,
 landmarks,
 eyeOpenScore
 };
 }

 // ALL 7 BIOMETRIC RESTRICTIONS + STEP VALIDATIONS PASSED!
 return {
 isValid: true,
 feedback: '¡Excelente! Mantente quieto...',
 confidence: 100,
 landmarks,
 eyeOpenScore
 };
}

// ----------------------------------------------------------------------------
// IMAGE QUALITY & BIOMETRIC POST-PROCESSING UTILITIES
// ----------------------------------------------------------------------------

/**
 * Computes sharpness score using the variance of the Laplacian operator on the face ROI.
 */
function computeSharpness(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): number {
 try {
 const rx = Math.max(0, Math.floor(x));
 const ry = Math.max(0, Math.floor(y));
 const rw = Math.min(ctx.canvas.width - rx, Math.floor(w));
 const rh = Math.min(ctx.canvas.height - ry, Math.floor(h));
 if (rw <= 10 || rh <= 10) return 50;

 const imgData = ctx.getImageData(rx, ry, rw, rh);
 const data = imgData.data;
 let sum = 0;
 let sumSq = 0;
 let count = 0;

 // Subsample step for high-speed calculation
 const step = Math.max(1, Math.floor(rw / 80));
 for (let j = step; j < rh - step; j += step) {
 for (let i = step; i < rw - step; i += step) {
 const idx = (j * rw + i) * 4;
 const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;

 const idxUp = ((j - step) * rw + i) * 4;
 const idxDown = ((j + step) * rw + i) * 4;
 const idxLeft = (j * rw + (i - step)) * 4;
 const idxRight = (j * rw + (i + step)) * 4;

 const grayUp = data[idxUp] * 0.299 + data[idxUp + 1] * 0.587 + data[idxUp + 2] * 0.114;
 const grayDown = data[idxDown] * 0.299 + data[idxDown + 1] * 0.587 + data[idxDown + 2] * 0.114;
 const grayLeft = data[idxLeft] * 0.299 + data[idxLeft + 1] * 0.587 + data[idxLeft + 2] * 0.114;
 const grayRight = data[idxRight] * 0.299 + data[idxRight + 1] * 0.587 + data[idxRight + 2] * 0.114;

 // Laplacian 2D convolution kernel [0, 1, 0; 1, -4, 1; 0, 1, 0]
 const lap = Math.abs(grayUp + grayDown + grayLeft + grayRight - 4 * gray);
 sum += lap;
 sumSq += lap * lap;
 count++;
 }
 }

 if (count === 0) return 50;
 const variance = (sumSq / count) - (sum / count) ** 2;
 return Math.max(0, Math.min(100, Math.round(variance * 1.8)));
 } catch {
 return 50;
 }
}

/**
 * Intelligent Adaptive Lighting & Skin Contrast Enhancement (CLAHE-inspired Gamma Curve)
 */
function enhanceAdaptiveLighting(ctx: CanvasRenderingContext2D, width: number, height: number) {
 try {
 const imgData = ctx.getImageData(0, 0, width, height);
 const d = imgData.data;

 // Calculate average luminance
 let totalLum = 0;
 const len = d.length;
 for (let i = 0; i < len; i += 16) {
 totalLum += (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
 }
 const avgLum = totalLum / (len / 16);

 let gamma = 1.0;
 let boost = 0;
 if (avgLum < 110) {
 // Underexposed or in shadow: lift shadows softly
 gamma = 0.78;
 boost = (110 - avgLum) * 0.35;
 } else if (avgLum > 190) {
 // Overexposed: slight compress
 gamma = 1.15;
 } else {
 gamma = 0.92; // Natural crisp contrast
 }

 const lut = new Uint8ClampedArray(256);
 for (let i = 0; i < 256; i++) {
 const normalized = i / 255;
 const corrected = Math.pow(normalized, gamma) * 255 + boost;
 lut[i] = Math.min(255, Math.max(0, Math.round(corrected)));
 }

 for (let i = 0; i < len; i += 4) {
 d[i] = lut[d[i]];
 d[i + 1] = lut[d[i + 1]];
 d[i + 2] = lut[d[i + 2]];
 }

 ctx.putImageData(imgData, 0, 0);
 } catch (e) {
 console.warn('Adaptive lighting enhancement bypassed:', e);
 }
}

/**
 * Standard ICAO 9303 Biometric Smart Auto-Crop & Framing
 */
function createBiometricAutoCrop(
 sourceCanvas: HTMLCanvasElement,
 landmarks: any[],
 targetWidth = 1080,
 targetHeight = 1440
): string {
 if (!landmarks || landmarks.length < 468) {
 return sourceCanvas.toDataURL('image/jpeg', 0.94);
 }

 const srcW = sourceCanvas.width;
 const srcH = sourceCanvas.height;

 const forehead = landmarks[10];
 const chin = landmarks[152];
 const leftCheek = landmarks[234];
 const rightCheek = landmarks[454];
 const leftEye = landmarks[33];
 const rightEye = landmarks[263];

 const faceCenterX = ((leftCheek.x + rightCheek.x) / 2) * srcW;
 const faceH = Math.abs(chin.y - forehead.y) * srcH;
 const faceW = Math.abs(rightCheek.x - leftCheek.x) * srcW;

 // ICAO standard: Face height should occupy ~62% of vertical frame height
 const idealCropH = Math.max(faceH * 1.65, faceW * 2.0);
 const idealCropW = idealCropH * (targetWidth / targetHeight);

 // Eye level located at ~56% from bottom (44% from top)
 const eyeCenterY = ((leftEye.y + rightEye.y) / 2) * srcH;
 const cropTop = eyeCenterY - idealCropH * 0.44;
 const cropLeft = faceCenterX - idealCropW / 2;

 // Safe bounds clamp
 const safeLeft = Math.max(0, Math.min(srcW - idealCropW, cropLeft));
 const safeTop = Math.max(0, Math.min(srcH - idealCropH, cropTop));
 const safeW = Math.min(srcW - safeLeft, idealCropW);
 const safeH = Math.min(srcH - safeTop, idealCropH);

 const outCanvas = document.createElement('canvas');
 outCanvas.width = targetWidth;
 outCanvas.height = targetHeight;
 const outCtx = outCanvas.getContext('2d');
 if (!outCtx) return sourceCanvas.toDataURL('image/jpeg', 0.94);

 outCtx.imageSmoothingEnabled = true;
 outCtx.imageSmoothingQuality = 'high';

 outCtx.drawImage(
 sourceCanvas,
 safeLeft, safeTop, safeW, safeH,
 0, 0, targetWidth, targetHeight
 );

 enhanceAdaptiveLighting(outCtx, targetWidth, targetHeight);

 return outCanvas.toDataURL('image/jpeg', 0.94);
}

// ----------------------------------------------------------------------------
// FULLSCREEN AUTOCAPTURE BIOMETRIC LIVE SCANNER MODAL WITH VIDEO BURST
// ----------------------------------------------------------------------------
interface SelfieScannerModalProps {
 isOpen: boolean;
 themeColor: string;
 onCaptureStep: (step: 'step1' | 'step2' | 'videoClip', file: File) => void;
 onClose: () => void;
}

export const SelfieScannerModal: React.FC<SelfieScannerModalProps> = ({
 isOpen,
 themeColor,
 onCaptureStep,
 onClose
}) => {
 const videoRef = useRef<HTMLVideoElement>(null);
 const maskRef = useRef<HTMLDivElement>(null);
 const prevLandmarksRef = useRef<any[] | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const landmarkerRef = useRef<FaceLandmarker | null>(null);

 // Live video clip recording refs
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const recordedChunksRef = useRef<Blob[]>([]);

 const [activeStep, setActiveStep] = useState<'step1' | 'step2'>('step1');
 const [stream, setStream] = useState<MediaStream | null>(null);
 const [isRequestingPermission, setIsRequestingPermission] = useState(false);
 const [isModelLoading, setIsModelLoading] = useState(true);
 const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
 const [torchOn, setTorchOn] = useState(false);
 const [hasTorch, setHasTorch] = useState(false);
 const [flashEffect, setFlashEffect] = useState(false);
 const [timeLeft, setTimeLeft] = useState(120);

 // Smoothed feedback state with minimum 1000ms display time
 const [displayedFeedback, setDisplayedFeedback] = useState<{
 text: string;
 errorCode?: ValidationResult['errorCode'];
 isValid: boolean;
 }>({
 text: 'Coloca tu rostro dentro del óvalo',
 isValid: false
 });

 const [rawValidation, setRawValidation] = useState<ValidationResult>({
 isValid: false,
 feedback: 'Coloca tu rostro dentro del óvalo',
 confidence: 0
 });

 const feedbackStateRef = useRef<{
 text: string;
 errorCode?: ValidationResult['errorCode'];
 isValid: boolean;
 timestamp: number;
 }>({
 text: 'Coloca tu rostro dentro del óvalo',
 isValid: false,
 timestamp: 0
 });

 const [holdProgress, setHoldProgress] = useState(0); // 0 to 100

 interface BestShotCandidate {
 canvas: HTMLCanvasElement;
 landmarks: any[];
 score: number;
 sharpness: number;
 eyeScore: number;
 timestamp: number;
 }

 const bestShotBufferRef = useRef<BestShotCandidate[]>([]);
 const lastSampleTimeRef = useRef<number>(0);
 const isCapturingRef = useRef<boolean>(false);
 const holdDurationMsRef = useRef<number>(0);
 const lastTimestampRef = useRef<number>(0);
 const lastVideoTimeRef = useRef<number>(-1);
 const animationFrameIdRef = useRef<number | null>(null);

 // Format time (mm:ss)
 const formatTime = (seconds: number) => {
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins}:${secs.toString().padStart(2, '0')}`;
 };

 // Start continuous 1.5s video burst recording for anti-spoofing proof of life
 const startLivenessRecording = useCallback((activeMediaStream: MediaStream) => {
 if (!activeMediaStream || typeof MediaRecorder === 'undefined') return;
 try {
 if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
 mediaRecorderRef.current.stop();
 }

 recordedChunksRef.current = [];
 let mimeType = 'video/webm';
 if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
 mimeType = 'video/webm;codecs=vp8';
 } else if (MediaRecorder.isTypeSupported('video/mp4')) {
 mimeType = 'video/mp4';
 }

 const recorder = new MediaRecorder(activeMediaStream, { mimeType, videoBitsPerSecond: 1200000 });
 recorder.ondataavailable = (e) => {
 if (e.data && e.data.size > 0) {
 recordedChunksRef.current.push(e.data);
 }
 };
 recorder.start(80); // Record chunks every 80ms
 mediaRecorderRef.current = recorder;
 } catch (e) {
 console.warn('MediaRecorder start failed:', e);
 }
 }, []);

 const stopLivenessRecording = useCallback((): Promise<File | null> => {
 return new Promise((resolve) => {
 const recorder = mediaRecorderRef.current;
 if (!recorder || recorder.state === 'inactive') {
 resolve(null);
 return;
 }

 recorder.onstop = () => {
 try {
 const mimeType = recorder.mimeType || 'video/webm';
 const blob = new Blob(recordedChunksRef.current, { type: mimeType });
 const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
 const file = new File([blob], `selfie_liveness_clip_${Date.now()}.${ext}`, {
 type: mimeType
 });
 resolve(file);
 } catch (e) {
 resolve(null);
 }
 };

 try {
 recorder.stop();
 } catch (e) {
 resolve(null);
 }
 });
 }, []);

 // Pre-load MediaPipe FaceLandmarker Model
 useEffect(() => {
 if (!isOpen) return;

 let isMounted = true;
 setIsModelLoading(true);

 getFaceLandmarker()
 .then(landmarker => {
 if (!isMounted) return;
 landmarkerRef.current = landmarker;
 setIsModelLoading(false);
 })
 .catch(err => {
 console.error('Failed to load FaceLandmarker:', err);
 if (isMounted) setIsModelLoading(false);
 });

 return () => {
 isMounted = false;
 };
 }, [isOpen]);

 // Start Camera Stream
 useEffect(() => {
 if (!isOpen) return;

 let isMounted = true;
 setIsRequestingPermission(true);
 setTimeLeft(120);
 setActiveStep('step1');
 setHoldProgress(0);
 holdDurationMsRef.current = 0;
 lastTimestampRef.current = 0;
 bestShotBufferRef.current = [];
 isCapturingRef.current = false;
 prevLandmarksRef.current = null;
 feedbackStateRef.current = {
 text: 'Coloca tu rostro dentro del óvalo',
 isValid: false,
 timestamp: performance.now()
 };
 setDisplayedFeedback({
 text: 'Coloca tu rostro dentro del óvalo',
 isValid: false
 });

 const startStream = async () => {
 try {
 if (stream) {
 stream.getTracks().forEach(t => t.stop());
 }

 const constraints: MediaStreamConstraints = {
 video: {
 facingMode: { ideal: facingMode },
 width: { ideal: 1920, min: 1280 },
 height: { ideal: 1080, min: 720 }
 },
 audio: false
 };

 const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
 if (!isMounted) {
 mediaStream.getTracks().forEach(t => t.stop());
 return;
 }

 setStream(mediaStream);
 setIsRequestingPermission(false);

 if (videoRef.current) {
 videoRef.current.srcObject = mediaStream;
 await videoRef.current.play().catch(e => console.warn('Video play prevented:', e));
 }

 // Start 1.5s video burst recording buffer
 startLivenessRecording(mediaStream);

 const track = mediaStream.getVideoTracks()[0];
 const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
 setHasTorch(Boolean(capabilities.torch));
 } catch (err: any) {
 console.error('Error starting selfie camera:', err);
 setIsRequestingPermission(false);
 toast.error('No se pudo acceder a la cámara. Por favor verifica los permisos.');
 }
 };

 startStream();

 return () => {
 isMounted = false;
 if (stream) {
 stream.getTracks().forEach(t => t.stop());
 }
 if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
 try { mediaRecorderRef.current.stop(); } catch (e) { }
 }
 };
 }, [isOpen, facingMode, startLivenessRecording]);

 // Inactivity countdown timer
 useEffect(() => {
 if (!isOpen || isRequestingPermission) return;

 const timer = setInterval(() => {
 setTimeLeft(prev => {
 if (prev <= 1) {
 clearInterval(timer);
 toast.warning('Tiempo agotado. Intenta nuevamente.');
 handleClose();
 return 0;
 }
 return prev - 1;
 });
 }, 1000);

 return () => clearInterval(timer);
 }, [isOpen, isRequestingPermission]);

 // Convert best buffered video frame to standard ICAO cropped & lighting-enhanced JPEG
 const snapFrameToFile = useCallback((): Promise<File | null> => {
 return new Promise((resolve) => {
 let sourceCanvas: HTMLCanvasElement | null = null;
 let landmarks: any[] | null = null;

 // 1. Select highest-scored sharpest candidate with open eyes from 3s buffer
 if (bestShotBufferRef.current.length > 0) {
 const sorted = [...bestShotBufferRef.current].sort((a, b) => b.score - a.score);
 const best = sorted[0];
 if (best) {
 sourceCanvas = best.canvas;
 landmarks = best.landmarks;
 }
 }

 // 2. Direct fallback if buffer is empty
 if (!sourceCanvas && videoRef.current) {
 const video = videoRef.current;
 sourceCanvas = document.createElement('canvas');
 sourceCanvas.width = video.videoWidth || 1920;
 sourceCanvas.height = video.videoHeight || 1080;
 const ctx = sourceCanvas.getContext('2d');
 if (ctx) {
 if (facingMode === 'user') {
 ctx.translate(sourceCanvas.width, 0);
 ctx.scale(-1, 1);
 }
 ctx.drawImage(video, 0, 0, sourceCanvas.width, sourceCanvas.height);
 }
 }

 if (!sourceCanvas) {
 resolve(null);
 return;
 }

 // 3. Apply ICAO 9303 Smart Auto-Crop & Centering + Adaptive Lighting Curve
 const finalDataUrl = createBiometricAutoCrop(sourceCanvas, landmarks || [], 1080, 1440);

 fetch(finalDataUrl)
 .then(res => res.blob())
 .then(blob => {
 const fileName = `selfie_${activeStep}_${Date.now()}.jpg`;
 const file = new File([blob], fileName, { type: 'image/jpeg' });
 resolve(file);
 })
 .catch(() => {
 resolve(null);
 });
 });
 }, [activeStep, facingMode]);

 // Execute snapshot for active step and generate 1.5s liveness video clip
 const handleSnap = useCallback(async () => {
 if (isCapturingRef.current) return;
 isCapturingRef.current = true;

 setFlashEffect(true);
 setTimeout(() => setFlashEffect(false), 280);

 try {
 if (navigator.vibrate) {
 navigator.vibrate([40, 60, 40]);
 }
 } catch {
 // Ignore vibration errors
 }

 const file = await snapFrameToFile();
 if (!file) {
 toast.error('Error al capturar la fotografía');
 isCapturingRef.current = false;
 return;
 }

 onCaptureStep(activeStep, file);

 if (activeStep === 'step1') {
 setActiveStep('step2');
 holdDurationMsRef.current = 0;
 lastTimestampRef.current = 0;
 bestShotBufferRef.current = [];
 setHoldProgress(0);
 prevLandmarksRef.current = null;
 isCapturingRef.current = false;
 feedbackStateRef.current = {
 text: 'Sonreí para la cámara ',
 errorCode: 'SMILE_REQUIRED',
 isValid: false,
 timestamp: performance.now()
 };
 setDisplayedFeedback({
 text: 'Sonreí para la cámara ',
 errorCode: 'SMILE_REQUIRED',
 isValid: false
 });
 } else {
 // Step 2 finished: Stop and dispatch the 1.5s live verification video clip
 const videoClipFile = await stopLivenessRecording();
 if (videoClipFile) {
 onCaptureStep('videoClip', videoClipFile);
 }
 toast.success('¡Verificación biométrica completada con éxito!');
 handleClose();
 }
 }, [activeStep, onCaptureStep, snapFrameToFile, stopLivenessRecording]);

 // Real-time AI Face Detection & Biometric Liveness Loop with 1-second Debounce
 useEffect(() => {
 if (!isOpen || !stream || isRequestingPermission) return;

 let isMounted = true;

 const processLoop = () => {
 if (!isMounted) return;

 const video = videoRef.current;
 const landmarker = landmarkerRef.current;

 if (
 video &&
 video.readyState >= 2 &&
 video.videoWidth > 0 &&
 video.videoHeight > 0 &&
 !video.paused &&
 !video.ended &&
 landmarker &&
 !isCapturingRef.current &&
 video.currentTime !== lastVideoTimeRef.current
 ) {
 lastVideoTimeRef.current = video.currentTime;
 const now = performance.now();

 try {
 const results = landmarker.detectForVideo(video, now);
 const evalResult = evaluateFaceLiveness(
 results,
 activeStep,
 video.videoWidth || 640,
 video.videoHeight || 480,
 prevLandmarksRef
 );

 setRawValidation(evalResult);

 // 1-SECOND MINIMUM DISPLAY TIME DEBOUNCING LOGIC
 const current = feedbackStateRef.current;
 const timeSinceChange = now - current.timestamp;
 const MIN_DISPLAY_TIME_MS = 1000;

 const isCandidateDifferent = current.text !== evalResult.feedback;

 if (isCandidateDifferent) {
 const canChange =
 timeSinceChange >= MIN_DISPLAY_TIME_MS ||
 evalResult.isValid ||
 (current.errorCode === 'NO_FACE' && evalResult.errorCode !== 'NO_FACE');

 if (canChange) {
 feedbackStateRef.current = {
 text: evalResult.feedback,
 errorCode: evalResult.errorCode,
 isValid: evalResult.isValid,
 timestamp: now
 };
 setDisplayedFeedback({
 text: evalResult.feedback,
 errorCode: evalResult.errorCode,
 isValid: evalResult.isValid
 });
 }
 }

 // Auto-capture progress & Best-Shot Frame Buffering during 1.5-second hold
 const REQUIRED_HOLD_MS = 1500;
 const delta = lastTimestampRef.current > 0 ? Math.min(100, now - lastTimestampRef.current) : 16;
 lastTimestampRef.current = now;

 if (evalResult.isValid && evalResult.landmarks) {
 // Buffer candidate frames every 80ms during the 3-second hold
 if (now - lastSampleTimeRef.current >= 80) {
 lastSampleTimeRef.current = now;
 const offCanvas = document.createElement('canvas');
 offCanvas.width = video.videoWidth || 1920;
 offCanvas.height = video.videoHeight || 1080;
 const offCtx = offCanvas.getContext('2d');
 if (offCtx) {
 if (facingMode === 'user') {
 offCtx.translate(offCanvas.width, 0);
 offCtx.scale(-1, 1);
 }
 offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

 const lm = evalResult.landmarks;
 const fx = Math.min(...lm.map((p: any) => p.x)) * offCanvas.width;
 const fy = Math.min(...lm.map((p: any) => p.y)) * offCanvas.height;
 const fw = (Math.max(...lm.map((p: any) => p.x)) - Math.min(...lm.map((p: any) => p.x))) * offCanvas.width;
 const fh = (Math.max(...lm.map((p: any) => p.y)) - Math.min(...lm.map((p: any) => p.y))) * offCanvas.height;

 const sharpness = computeSharpness(offCtx, fx, fy, fw, fh);
 const eyeScore = (evalResult.eyeOpenScore ?? 0.9) * 100;
 const compositeScore = sharpness * 1.5 + eyeScore * 0.8;

 bestShotBufferRef.current.push({
 canvas: offCanvas,
 landmarks: lm,
 score: compositeScore,
 sharpness,
 eyeScore,
 timestamp: now
 });

 if (bestShotBufferRef.current.length > 30) {
 bestShotBufferRef.current.shift();
 }
 }
 }

 holdDurationMsRef.current += delta;
 const progress = Math.min(100, Math.round((holdDurationMsRef.current / REQUIRED_HOLD_MS) * 100));
 setHoldProgress(progress);

 if (holdDurationMsRef.current >= REQUIRED_HOLD_MS) {
 handleSnap();
 }
 } else {
 // Decay hold duration if posture/face moves away
 holdDurationMsRef.current = Math.max(0, holdDurationMsRef.current - delta * 1.5);
 const progress = Math.min(100, Math.round((holdDurationMsRef.current / REQUIRED_HOLD_MS) * 100));
 setHoldProgress(progress);
 }
 } catch (detectErr) {
 console.warn('Face landmark detect error:', detectErr);
 }
 }

 animationFrameIdRef.current = requestAnimationFrame(processLoop);
 };

 animationFrameIdRef.current = requestAnimationFrame(processLoop);

 return () => {
 isMounted = false;
 if (animationFrameIdRef.current) {
 cancelAnimationFrame(animationFrameIdRef.current);
 }
 };
 }, [isOpen, stream, isRequestingPermission, activeStep, handleSnap]);

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

 // Close and stop stream
 const handleClose = () => {
 if (stream) {
 stream.getTracks().forEach(t => t.stop());
 setStream(null);
 }
 if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
 try { mediaRecorderRef.current.stop(); } catch (e) { }
 }
 setHoldProgress(0);
 holdDurationMsRef.current = 0;
 lastTimestampRef.current = 0;
 setTorchOn(false);
 isCapturingRef.current = false;
 prevLandmarksRef.current = null;
 onClose();
 };

 // Handle fallback file upload
 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 onCaptureStep(activeStep, file);

 if (activeStep === 'step1') {
 toast.success('Paso 1 cargado. Ahora captura o sube el Paso 2.');
 setActiveStep('step2');
 setHoldProgress(0);
 holdDurationMsRef.current = 0;
 lastTimestampRef.current = 0;
 } else {
 toast.success('¡Verificación biométrica completada!');
 handleClose();
 }
 if (e.target) e.target.value = '';
 };

 if (!isOpen || typeof document === 'undefined') return null;

 return createPortal(
 <div className="!mt-0 fixed inset-0 z-[999999] w-screen h-[100dvh] max-h-[100dvh] bg-black flex flex-col justify-between select-none overflow-hidden touch-none animate-in fade-in duration-200">
 {/* Hidden File Input for manual upload fallback */}
 <input
 type="file"
 ref={fileInputRef}
 accept="image/*"
 capture="user"
 onChange={handleFileUpload}
 className="hidden"
 />

 {/* FLASH SCREEN ANIMATION */}
 {flashEffect && (
 <div className="absolute inset-0 z-50 bg-white animate-out fade-out duration-300 pointer-events-none" />
 )}

 {/* 1. TOP STATUS & CONTROLS BAR */}
 <div className="relative z-30 px-4 py-3 sm:py-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent text-white">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400">
 <ScanFace className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <h3 className="text-xs sm:text-sm font-bold truncate">
 Verificación Facial Biométrica
 </h3>
 <p className="text-[10px] text-white/70">
 Detección y captura inteligente en vivo
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* 120s Timeout Countdown Badge */}
 {!isRequestingPermission && (
 <div
 className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md border transition-colors ${timeLeft <= 20
 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
 : timeLeft <= 45
 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
 : 'bg-white/10 border-white/15 text-white/80'
 }`}
 title="Tiempo restante de escaneo automático"
 >
 <Clock className="w-3 h-3" />
 <span>{formatTime(timeLeft)}</span>
 </div>
 )}

 {/* Torch toggle if available */}
 {hasTorch && !isRequestingPermission && (
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

 {/* Camera Flip Button */}
 <button
 type="button"
 onClick={() => setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))}
 className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 backdrop-blur-md transition-colors cursor-pointer"
 title="Cambiar cámara"
 >
 <RefreshCw className="w-4 h-4" />
 </button>

 {/* Close button */}
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

 {/* 2. VIEWFINDER & LIVE OVAL MASK AREA */}
 <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
 {/* Live Video */}
 <video
 ref={videoRef}
 autoPlay
 playsInline
 muted
 className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
 />

 {/* Loading Overlay (Permissions or AI Model) */}
 {(isRequestingPermission || isModelLoading) && (
 <div className="relative z-30 max-w-sm mx-auto p-6 rounded-3xl bg-slate-900/90 border border-slate-700 text-center text-white space-y-4 m-4 backdrop-blur-xl animate-in fade-in">
 <div className="w-14 h-14 rounded-2xl bg-forest/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
 {isModelLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7" />}
 </div>
 <div className="space-y-1.5">
 <h4 className="font-bold text-sm">
 {isModelLoading ? 'Cargando Modelo Biométrico...' : 'Iniciando Cámara Frontal...'}
 </h4>
 <p className="text-xs text-white/70 leading-relaxed">
 {isModelLoading
 ? 'Preparando validadores de detección facial en tiempo real...'
 : 'Por favor presiona "Permitir" cuando tu navegador te solicite permiso de cámara.'}
 </p>
 </div>
 </div>
 )}

 {/* Dynamic Biometric Unified SVG Mask & Charging Border (100% Shared Vector Geometry) */}
 {!isRequestingPermission && !isModelLoading && (
 <svg
 className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-hidden"
 viewBox="0 0 1000 1000"
 preserveAspectRatio="xMidYMid slice"
 >
 <defs>
 <linearGradient id="scanline-glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
 <stop offset="50%" stopColor="#34d399" stopOpacity="0.95" />
 <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* 1. Dark Backdrop with EVENODD Cutout Hole (Uses EXACT same OVOID_PATH) */}
 <path
 d="M -2000,-2000 L 3000,-2000 L 3000,3000 L -2000,3000 Z M 500, 240 C 610, 240 695, 295 695, 395 C 695, 545 615, 750 500, 750 C 385, 750 305, 545 305, 395 C 305, 295 390, 240 500, 240 Z"
 fill="rgba(0, 0, 0, 0.74)"
 fillRule="evenodd"
 />

 {/* 2. Base Guide Outline Stroke (Uses EXACT same OVOID_PATH) */}
 <path
 d="M 500, 240 C 610, 240 695, 295 695, 395 C 695, 545 615, 750 500, 750 C 385, 750 305, 545 305, 395 C 305, 295 390, 240 500, 240 Z"
 fill="none"
 stroke={holdProgress > 0 ? "rgba(52, 211, 153, 0.25)" : rawValidation.isValid ? "rgba(52, 211, 153, 0.85)" : "rgba(255, 255, 255, 0.8)"}
 strokeWidth="4"
 vectorEffect="non-scaling-stroke"
 className="transition-colors duration-200"
 />

 {/* 3. Concentric Glowing Aura during stability hold */}
 {holdProgress > 0 && (
 <path
 d="M 500, 240 C 610, 240 695, 295 695, 395 C 695, 545 615, 750 500, 750 C 385, 750 305, 545 305, 395 C 305, 295 390, 240 500, 240 Z"
 fill="none"
 stroke="rgba(52, 211, 153, 0.45)"
 strokeWidth="12"
 vectorEffect="non-scaling-stroke"
 className="animate-pulse"
 />
 )}

 {/* 4. Animated Charging Progress Stroke (Traces clockwise along EXACT same path) */}
 {holdProgress > 0 && (
 <path
 d="M 500, 240 C 610, 240 695, 295 695, 395 C 695, 545 615, 750 500, 750 C 385, 750 305, 545 305, 395 C 305, 295 390, 240 500, 240 Z"
 fill="none"
 stroke="#10b981"
 strokeWidth="7"
 strokeLinecap="round"
 vectorEffect="non-scaling-stroke"
 pathLength="100"
 strokeDasharray="100"
 strokeDashoffset={100 - holdProgress}
 className="transition-all duration-100 ease-linear"
 style={{
 filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.95)) drop-shadow(0 0 20px rgba(16, 185, 129, 0.8))'
 }}
 />
 )}

 {/* 5. Pulsing Laser Scanline inside the ovoid */}
 <line
 x1="320"
 y1="495"
 x2="680"
 y2="495"
 stroke="url(#scanline-glow-grad)"
 strokeWidth="2.5"
 className={`transition-opacity ${holdProgress > 0 ? 'opacity-100 animate-pulse' : 'opacity-40'}`}
 style={{
 filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.9))'
 }}
 />
 </svg>
 )}

 {/* TOP HUD: Real-time AI Instruction & Stability Progress (Anchored near camera lens) */}
 {!isRequestingPermission && !isModelLoading && (
 <div className="absolute top-3 inset-x-4 z-30 flex flex-col items-center gap-2 pointer-events-none animate-in fade-in">
 {/* Main AI Feedback Pill */}
 <div
 className={`px-4 py-2 sm:py-2.5 rounded-full backdrop-blur-md border text-xs font-bold flex items-center gap-2 shadow-2xl transition-all duration-300 max-w-md text-center ${holdProgress > 0
 ? 'bg-emerald-600/95 border-emerald-400 text-white shadow-emerald-950/60 scale-105 ring-2 ring-emerald-400/60'
 : displayedFeedback.isValid
 ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-400'
 : displayedFeedback.errorCode === 'SMILE_REQUIRED'
 ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300 ring-2 ring-emerald-500/20'
 : displayedFeedback.errorCode === 'MULTI_FACE' || displayedFeedback.errorCode === 'HEADWEAR_OCCLUDED' || displayedFeedback.errorCode === 'FACE_OCCLUDED'
 ? 'bg-rose-950/90 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/30'
 : displayedFeedback.errorCode === 'EYES_CLOSED' || displayedFeedback.errorCode === 'GLASSES_DETECTED' || displayedFeedback.errorCode === 'PROFILE_POSE'
 ? 'bg-amber-950/90 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/30'
 : 'bg-slate-900/90 border-white/15 text-white/90'
 }`}
 >
 {/* Step indicator badge */}
 <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] uppercase font-mono tracking-wider text-white">
 {activeStep === 'step1' ? 'Paso 1/2' : 'Paso 2/2'}
 </span>

 <div key={holdProgress > 0 ? 'holding' : displayedFeedback.text} className="flex items-center gap-2 animate-in fade-in duration-200">
 {holdProgress > 0 ? (
 <div className="flex items-center gap-2 text-white">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping shrink-0" />
 <span className="text-xs sm:text-sm uppercase tracking-wider text-emerald-200 font-extrabold font-display">
 ¡NO TE MUEVAS!
 </span>
 <span className="text-[11px] text-white/90 font-mono font-bold">({holdProgress}%)</span>
 </div>
 ) : displayedFeedback.errorCode === 'MULTI_FACE' ? (
 <>
 <Users className="w-4 h-4 text-rose-400 animate-bounce shrink-0" />
 <span>{displayedFeedback.text}</span>
 </>
 ) : displayedFeedback.errorCode === 'GLASSES_DETECTED' ? (
 <>
 <Glasses className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
 <span>{displayedFeedback.text}</span>
 </>
 ) : displayedFeedback.errorCode === 'FACE_OCCLUDED' ? (
 <>
 <Hand className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
 <span>{displayedFeedback.text}</span>
 </>
 ) : displayedFeedback.errorCode === 'EYES_CLOSED' ? (
 <>
 <EyeOff className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
 <span>{displayedFeedback.text}</span>
 </>
 ) : displayedFeedback.errorCode === 'HEADWEAR_OCCLUDED' ? (
 <>
 <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
 <span>{displayedFeedback.text}</span>
 </>
 ) : displayedFeedback.errorCode === 'SMILE_REQUIRED' ? (
 <>
 <Smile className="w-4 h-4 text-emerald-400 animate-bounce shrink-0" />
 <span>{displayedFeedback.text}</span>
 </>
 ) : (
 <>
 {displayedFeedback.isValid ? (
 <Check className="w-4 h-4 text-emerald-400 shrink-0" />
 ) : (
 <ScanFace className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
 )}
 <span>{displayedFeedback.text}</span>
 </>
 )}
 </div>
 </div>

 {/* Stability Hold Progress Bar directly beneath the top instruction */}
 {holdProgress > 0 && (
 <div className="w-52 sm:w-60 bg-black/60 backdrop-blur-md rounded-full p-1 border border-emerald-400/40 shadow-xl animate-in fade-in">
 <div
 className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-100 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
 style={{ width: `${holdProgress}%` }}
 />
 </div>
 )}
 </div>
 )}
 </div>

 {/* 4. BOTTOM CONTROLS BAR (Minimal & Automatic - No Manual Shutter Click Needed) */}
 <div className="relative z-30 px-6 py-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex items-center justify-between text-white">
 {/* Upload from file system fallback */}
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="p-2.5 sm:px-3.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold"
 title="Subir foto desde archivo"
 >
 <UploadCloud className="w-4 h-4" />
 <span className="hidden sm:inline">Subir archivo</span>
 </button>

 {/* Center Auto-capture indicator badge */}
 <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[11px] font-medium text-white/80 shadow-xs">
 <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
 <span>Captura 100% automática</span>
 </div>

 {/* Camera Flip Button */}
 <button
 type="button"
 onClick={() => setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))}
 className="p-2.5 sm:px-3.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold"
 title="Girar cámara"
 >
 <RefreshCw className="w-4 h-4" />
 <span className="hidden sm:inline">Girar cámara</span>
 </button>
 </div>
 </div>,
 document.body
 );
};

// ----------------------------------------------------------------------------
// FULLSCREEN IMAGE / VIDEO ZOOM & PREVIEW MODAL
// ----------------------------------------------------------------------------
interface PreviewImageModalProps {
 imageData: { url: string; title: string; isVideo?: boolean } | null;
 onClose: () => void;
}

const PreviewImageModal: React.FC<PreviewImageModalProps> = ({ imageData, onClose }) => {
 const [zoomLevel, setZoomLevel] = useState(1);
 const [rotation, setRotation] = useState(0);

 useEffect(() => {
 setZoomLevel(1);
 setRotation(0);
 }, [imageData]);

 useEffect(() => {
 if (!imageData) return;
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') onClose();
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [imageData, onClose]);

 if (!imageData || typeof document === 'undefined') return null;

 const isVideo =
 imageData.isVideo ||
 imageData.url.startsWith('data:video') ||
 imageData.url.match(/\.(webm|mp4|mov|ogg)($|\?)/i);

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
 {isVideo ? <Film className="w-5 h-5" /> : <ScanFace className="w-5 h-5" />}
 </div>
 <div className="min-w-0">
 <h3 className="text-sm sm:text-base font-bold truncate text-white">{imageData.title}</h3>
 <p className="text-[11px] text-white/70">
 {isVideo ? 'Clip animado de verificación biométrica en vivo (1.5s)' : 'Vista previa de captura biométrica'}
 </p>
 </div>
 </div>

 {/* Action Controls & Close */}
 <div className="flex items-center gap-1.5 sm:gap-2">
 {!isVideo && (
 <>
 <button
 type="button"
 onClick={() => setZoomLevel(prev => Math.max(0.5, +(prev - 0.25).toFixed(2)))}
 className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
 title="Reducir zoom"
 >
 <ZoomOut className="w-4 h-4" />
 </button>
 <button
 type="button"
 onClick={() => { setZoomLevel(1); setRotation(0); }}
 className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
 title="Restablecer tamaño y giro"
 >
 {Math.round(zoomLevel * 100)}%
 </button>
 <button
 type="button"
 onClick={() => setZoomLevel(prev => Math.min(3, +(prev + 0.25).toFixed(2)))}
 className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
 title="Aumentar zoom"
 >
 <ZoomIn className="w-4 h-4" />
 </button>
 <button
 type="button"
 onClick={() => setRotation(prev => (prev + 90) % 360)}
 className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
 title="Girar foto 90°"
 >
 <RotateCw className="w-4 h-4" />
 </button>
 </>
 )}
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

 {/* Main Viewport */}
 <div
 className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative cursor-zoom-out"
 onClick={onClose}
 >
 <div
 className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
 onClick={(e) => e.stopPropagation()}
 >
 {isVideo ? (
 <video
 src={imageData.url}
 autoPlay
 loop
 muted
 playsInline
 controls
 className="max-h-[76vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/20"
 />
 ) : (
 <img
 src={imageData.url}
 alt={imageData.title}
 className="max-h-[76vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-transform duration-200"
 style={{
 transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
 transformOrigin: 'center center'
 }}
 />
 )}
 </div>
 </div>

 {/* Footer */}
 <div
 className="px-4 sm:px-6 py-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-white text-xs relative z-10 border-t border-white/10"
 onClick={(e) => e.stopPropagation()}
 >
 <span className="text-white/60 text-[11px] hidden sm:inline">Presiona <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Esc</kbd> para cerrar</span>
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
// MAIN UNIFIED SELFIE / LIVENESS WIDGET COMPONENT
// ----------------------------------------------------------------------------
export const SelfieLivenessWidget: React.FC<SelfieLivenessWidgetProps> = ({
 field,
 value,
 onProcessSelfieStep,
 onRemoveSelfieStep,
 onResetSelfie,
 onOpenPreviewModal,
 isDark = false,
 themeColor = '#10b981',
 borderRadius = 'lg',
 shadowStyle = 'subtle',
 layoutVariant = 'standard'
}) => {
 const selfieValue: SelfieLivenessValue = value && typeof value === 'object' ? value : {};
 const isComplete = Boolean(selfieValue.step1?.fileUrl && selfieValue.step2?.fileUrl && selfieValue.isComplete);

 const [isScannerOpen, setIsScannerOpen] = useState(false);
 const [internalPreviewModal, setInternalPreviewModal] = useState<{ url: string; title: string; isVideo?: boolean } | null>(null);

 const handleStepCapture = (step: 'step1' | 'step2' | 'videoClip', file: File) => {
 if (onProcessSelfieStep) {
 onProcessSelfieStep(field.id, step, file);
 }
 };

 const getSideUrl = (side?: any): string => {
 if (!side) return '';
 if (typeof side === 'string') return side;
 return side.fileUrl || side.url || '';
 };

 const handlePreview = (url?: string, title?: string, isVideo?: boolean) => {
 if (!url) return;
 setInternalPreviewModal({ url, title: title || 'Vista previa', isVideo });
 if (onOpenPreviewModal) {
 try {
 onOpenPreviewModal(url, title || 'Vista previa', isVideo);
 } catch (e) {
 console.warn('onOpenPreviewModal failed:', e);
 }
 }
 };

 // The primary best photo to show (Step 1 frontal capture)
 const primaryPhotoUrl = getSideUrl(selfieValue.step1) || getSideUrl(selfieValue.step2);
 const clipUrl = getSideUrl(selfieValue.videoClip);

 return (
 <div className={`w-full transition-all duration-300 ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>
 {/* Internal Zoom Modal for guaranteed direct compatibility */}
 <PreviewImageModal
 imageData={internalPreviewModal}
 onClose={() => setInternalPreviewModal(null)}
 />

 {/* Fullscreen Live Camera Scanner Modal */}
 <SelfieScannerModal
 isOpen={isScannerOpen}
 themeColor={themeColor}
 onCaptureStep={handleStepCapture}
 onClose={() => setIsScannerOpen(false)}
 />

 {/* MAIN SINGLE CARD */}
 <div
 className={`p-5 sm:p-6 border transition-all duration-200 ${isDark
 ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-sm'
 : 'bg-white border-slate-200/90 shadow-xs'
 } ${isComplete ? 'ring-2 ring-emerald-500/30' : ''} ${getRadiusClass(borderRadius, 'card')}`}
 >
 {/* Header with Title and Verification Badge */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
 <div className="flex items-start gap-3 min-w-0">
 <div
 className={`p-2.5 flex items-center justify-center shrink-0 ${getRadiusClass(borderRadius, 'icon')} ${isComplete
 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
 : 'bg-forest/10 text-forest dark:text-emerald-400'
 }`}
 >
 {isComplete ? <ShieldCheck className="w-5 h-5" /> : <ScanFace className="w-5 h-5" />}
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <h4 className={`font-bold text-sm sm:text-base font-display truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
 {field.label || 'Selfie con Prueba de Vida'}
 </h4>
 {field.required && <span className="text-rose-500 text-xs font-bold">*</span>}
 </div>
 <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
 {field.helpText || 'Captura biométrica interactiva en tiempo real para verificar presencia física e identidad'}
 </p>
 </div>
 </div>

 {/* Status Badge */}
 <div className="shrink-0">
 {isComplete ? (
 <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shadow-2xs ${getRadiusClass(borderRadius, 'badge')}`}>
 <CheckCircle2 className="w-3.5 h-3.5" />
 Biometría Verificada
 </span>
 ) : (
 <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 ${getRadiusClass(borderRadius, 'badge')}`}>
 <Info className="w-3.5 h-3.5" />
 {getSideUrl(selfieValue.step1) ? 'Paso 2 pendiente' : 'Pendiente'}
 </span>
 )}
 </div>
 </div>

 {/* BODY: IF NOT CAPTURED -> SINGLE CLEAN ACTION BANNER */}
 {!isComplete ? (
 <div className="space-y-4">
 {/* Visual Guide Box */}
 <div
 className={`p-6 border-2 border-dashed text-center space-y-3 transition-colors ${isDark ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50/70 border-slate-200/90 hover:border-forest/30'
 } ${getRadiusClass(borderRadius, 'card')}`}
 >
 <div
 className={`w-14 h-14 mx-auto flex items-center justify-center shadow-xs transition-transform hover:scale-105 ${getRadiusClass(borderRadius, 'icon')}`}
 style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
 >
 <ScanFace className="w-7 h-7" />
 </div>

 <div className="max-w-md mx-auto space-y-1">
 <h5 className={`font-bold text-xs sm:text-sm font-display ${isDark ? 'text-white' : 'text-slate-800'}`}>
 Escaneo Biométrico de Rostro con IA
 </h5>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Al presionar el botón se abrirá la cámara en pantalla completa. El modelo validará tu postura y capturará la verificación con clip de movimiento anti-suplantación en tiempo real.
 </p>
 </div>
 </div>

 {/* SINGLE MAIN TRIGGER BUTTON */}
 <button
 type="button"
 onClick={() => setIsScannerOpen(true)}
 className={`w-full py-3.5 px-5 text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer ${getRadiusClass(
 borderRadius,
 'button'
 )}`}
 style={{ backgroundColor: themeColor }}
 >
 <Camera className="w-4 h-4 shrink-0" />
 <span>{getSideUrl(selfieValue.step1) ? 'Continuar Verificación Facial' : 'Iniciar Verificación Facial'}</span>
 </button>
 </div>
 ) : (
 /* BODY: IF COMPLETED -> SINGLE BEST PHOTO PRESENTATION + LIVENESS CLIP */
 <div className="space-y-4">
 {primaryPhotoUrl && (
 <div
 className={`p-4 border space-y-3.5 ${getRadiusClass(borderRadius, 'card')} ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
 }`}
 >
 {/* Photo Top Badge */}
 <div className="flex items-center justify-between text-xs font-bold">
 <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
 <span>Identidad Facial Confirmada</span>
 </span>

 {clipUrl && (
 <button
 type="button"
 onClick={() => handlePreview(clipUrl, 'Clip de Liveness en Vivo', true)}
 className={`px-2.5 py-1 bg-forest/10 hover:bg-forest/20 text-forest dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${getRadiusClass(borderRadius, 'badge')}`}
 >
 <Film className="w-3.5 h-3.5" />
 <span>Ver clip 1.5s</span>
 </button>
 )}
 </div>

 {/* Single Hero Thumbnail Preview */}
 <div
 role="button"
 tabIndex={0}
 onClick={() => handlePreview(primaryPhotoUrl, 'Fotografía Biométrica Frontal')}
 className={`relative h-48 sm:h-56 w-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/10 cursor-pointer group flex items-center justify-center ${getRadiusClass(borderRadius, 'input')}`}
 >
 <img
 src={primaryPhotoUrl}
 alt="Selfie Biométrica"
 className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
 />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
 <div className={`px-3.5 py-2 bg-white/25 backdrop-blur-md border border-white/30 flex items-center gap-2 text-xs font-bold shadow-lg ${getRadiusClass(borderRadius, 'button')}`}>
 <ZoomIn className="w-4 h-4 text-emerald-300" />
 <span>Ampliar Fotografía</span>
 </div>
 </div>
 </div>

 {/* Subtitle Details: Confirms all biometrics saved */}
 <p className="text-[11px] text-muted-foreground flex items-center justify-between">
 <span>Captura frontal y prueba de vida registradas correctamente.</span>
 {selfieValue.step1 && selfieValue.step2 && (
 <span className={`font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 ${getRadiusClass(borderRadius, 'badge')}`}>2 tomas + clip</span>
 )}
 </p>
 </div>
 )}

 {/* Actions: Retake or Reset */}
 <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
 <button
 type="button"
 onClick={() => setIsScannerOpen(true)}
 className={`py-2 px-4 border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
 >
 <RefreshCw className="w-3.5 h-3.5" />
 <span>Volver a Capturar</span>
 </button>

 {onResetSelfie && (
 <button
 type="button"
 onClick={() => onResetSelfie(field.id)}
 className={`text-xs text-rose-500 hover:text-rose-600 p-1.5 hover:bg-rose-500/10 flex items-center gap-1 transition-colors cursor-pointer font-bold ${getRadiusClass(borderRadius, 'button')}`}
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span>Eliminar Biometría</span>
 </button>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 );
};
