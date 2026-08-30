/**
 * Form Telemetry & Client Device Fingerprinting Utility
 * Captures device fingerprint, browser, OS, screen resolution, timezone,
 * and tracks form fill timing (start time -> submission time -> duration)
 * and device switching detection.
 */

export interface FormSubmissionTelemetry {
 ip?: string;
 fingerprint: string;
 browser: {
 name: string;
 version: string;
 major: string;
 full: string;
 };
 os: {
 name: string;
 version: string;
 full: string;
 };
 deviceType: 'mobile' | 'tablet' | 'desktop';
 screen: string;
 timezone: string;
 language: string;
 userAgent: string;
 startedAt: string;
 submittedAt: string;
 durationSeconds: number;
 durationFormatted: string;
 deviceSwitched: boolean;
 initialFingerprint?: string;
}

// ----------------------------------------------------
// 1. Device Fingerprint Generator (Canvas, Audio, WebGL, Screen, Navigator)
// ----------------------------------------------------
export function getDeviceFingerprint(): string {
 if (typeof window === 'undefined') return 'fp_server_side';

 try {
 const components: string[] = [];

 // Screen
 components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
 components.push(`dpr_${window.devicePixelRatio || 1}`);

 // Navigator
 const nav = window.navigator;
 components.push(nav.userAgent || '');
 components.push(nav.language || '');
 components.push((nav.languages || []).join(','));
 components.push(`hc_${nav.hardwareConcurrency || 'unknown'}`);
 components.push(`dm_${(nav as any).deviceMemory || 'unknown'}`);
 components.push(`touch_${nav.maxTouchPoints || 0}`);
 components.push(nav.platform || '');

 // Timezone
 try {
 components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
 components.push(String(new Date().getTimezoneOffset()));
 } catch (e) {
 // ignore
 }

 // 2D Canvas Fingerprint
 try {
 const canvas = document.createElement('canvas');
 canvas.width = 240;
 canvas.height = 60;
 const ctx = canvas.getContext('2d');
 if (ctx) {
 ctx.textBaseline = 'top';
 ctx.font = '14px "Arial", "Helvetica", sans-serif';
 ctx.textBaseline = 'alphabetic';
 ctx.fillStyle = '#f60';
 ctx.fillRect(125, 1, 62, 20);
 ctx.fillStyle = '#069';
 ctx.fillText('CeibaRoots,🇲🇽 123!', 2, 15);
 ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
 ctx.fillText('CeibaRoots,🇲🇽 123!', 4, 17);
 components.push(`canvas_${hashString(canvas.toDataURL())}`);
 }
 } catch (e) {
 // ignore canvas blocking
 }

 // WebGL Renderer Info
 try {
 const canvas = document.createElement('canvas');
 const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
 if (gl) {
 const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
 if (debugInfo) {
 const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
 const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
 components.push(`gl_${vendor}_${renderer}`);
 }
 }
 } catch (e) {
 // ignore webgl blocking
 }

 const rawString = components.join('|||');
 const hash = hashString(rawString);
 return `fp_${hash}`;
 } catch (err) {
 return `fp_${Math.random().toString(36).substring(2, 10)}`;
 }
}

// Simple fast string hashing (Murmur/FNV-inspired 32-bit hex)
function hashString(str: string): string {
 let h1 = 0xdeadbeef;
 let h2 = 0x41c6ce57;
 for (let i = 0; i < str.length; i++) {
 const ch = str.charCodeAt(i);
 h1 = Math.imul(h1 ^ ch, 2654435761);
 h2 = Math.imul(h2 ^ ch, 1597334677);
 }
 h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
 h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
 const full = 4294967296 * (2097151 & h2) + (h1 >>> 0);
 return full.toString(16);
}

// ----------------------------------------------------
// 2. Client Device, Browser and OS Parser
// ----------------------------------------------------
export function getClientDeviceMetadata() {
 if (typeof window === 'undefined') {
 return {
 browser: { name: 'Server', version: '1.0', major: '1', full: 'Server' },
 os: { name: 'Server', version: '', full: 'Server' },
 deviceType: 'desktop' as const,
 screen: '1920x1080',
 timezone: 'UTC',
 language: 'es-MX',
 userAgent: 'Server',
 fingerprint: 'fp_server'
 };
 }

 const ua = window.navigator.userAgent || '';
 const nav = window.navigator;

 // Browser Detection
 let browserName = 'Navegador Web';
 let browserVersion = '';

 if (/Edg\/([0-9.]+)/i.test(ua)) {
 browserName = 'Microsoft Edge';
 browserVersion = RegExp.$1;
 } else if (/OPR\/([0-9.]+)/i.test(ua) || /Opera\/([0-9.]+)/i.test(ua)) {
 browserName = 'Opera';
 browserVersion = RegExp.$1;
 } else if (/SamsungBrowser\/([0-9.]+)/i.test(ua)) {
 browserName = 'Samsung Internet';
 browserVersion = RegExp.$1;
 } else if (/Chrome\/([0-9.]+)/i.test(ua) && !/Chromium/i.test(ua)) {
 browserName = 'Google Chrome';
 browserVersion = RegExp.$1;
 } else if (/Version\/([0-9.]+).*Safari/i.test(ua)) {
 browserName = 'Apple Safari';
 browserVersion = RegExp.$1;
 } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
 browserName = 'Mozilla Firefox';
 browserVersion = RegExp.$1;
 } else if (/MSIE ([0-9.]+)/i.test(ua) || /Trident\/.*rv:([0-9.]+)/i.test(ua)) {
 browserName = 'Internet Explorer';
 browserVersion = RegExp.$1;
 }

 const major = browserVersion.split('.')[0] || '';
 const browserFull = `${browserName} ${major ? `${major}` : ''}`.trim();

 // OS Detection
 let osName = 'Desconocido';
 let osVersion = '';

 if (/iPhone/i.test(ua)) {
 osName = 'iOS (iPhone)';
 const match = ua.match(/OS (\d+[_.]\d+)/i);
 if (match) osVersion = match[1].replace(/_/g, '.');
 } else if (/iPad/i.test(ua)) {
 osName = 'iPadOS';
 const match = ua.match(/OS (\d+[_.]\d+)/i);
 if (match) osVersion = match[1].replace(/_/g, '.');
 } else if (/Macintosh|Mac OS X/i.test(ua)) {
 osName = 'macOS';
 const match = ua.match(/Mac OS X (\d+[_.]\d+)/i);
 if (match) osVersion = match[1].replace(/_/g, '.');
 } else if (/Windows NT 10\.0/i.test(ua)) {
 osName = 'Windows';
 osVersion = '10/11';
 } else if (/Windows NT 6\.3/i.test(ua)) {
 osName = 'Windows';
 osVersion = '8.1';
 } else if (/Windows NT 6\.1/i.test(ua)) {
 osName = 'Windows';
 osVersion = '7';
 } else if (/Android (\d+([.]\d+)?)/i.test(ua)) {
 osName = 'Android';
 osVersion = RegExp.$1;
 } else if (/Linux/i.test(ua)) {
 osName = 'Linux';
 } else if (/CrOS/i.test(ua)) {
 osName = 'ChromeOS';
 }

 const osFull = `${osName} ${osVersion}`.trim();

 // Device Type Detection
 let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
 if (/iPad|tablet/i.test(ua) || (osName === 'macOS' && nav.maxTouchPoints > 1)) {
 deviceType = 'tablet';
 } else if (/Mobi|Android|iPhone/i.test(ua)) {
 deviceType = 'mobile';
 }

 const screenRes = `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio || 1}x)`;
 let timezone = 'UTC';
 try {
 timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
 } catch (e) {
 // ignore
 }

 const language = nav.language || 'es-MX';
 const fingerprint = getDeviceFingerprint();

 return {
 browser: {
 name: browserName,
 version: browserVersion,
 major,
 full: browserFull
 },
 os: {
 name: osName,
 version: osVersion,
 full: osFull
 },
 deviceType,
 screen: screenRes,
 timezone,
 language,
 userAgent: ua,
 fingerprint
 };
}

// ----------------------------------------------------
// 3. Form Session Timing & Cross-Device Tracking
// ----------------------------------------------------
export function initFormSession(formId: string): { startedAt: string; initialFingerprint: string; isDeviceSwitched: boolean } {
 if (typeof window === 'undefined') {
 const now = new Date().toISOString();
 return { startedAt: now, initialFingerprint: 'fp_init', isDeviceSwitched: false };
 }

 const startKey = `cr_form_start_${formId}`;
 const fpKey = `cr_form_init_fp_${formId}`;

 let startedAt = sessionStorage.getItem(startKey) || localStorage.getItem(startKey);
 const currentFp = getDeviceFingerprint();
 let initialFp = localStorage.getItem(fpKey);

 if (!startedAt) {
 startedAt = new Date().toISOString();
 try {
 sessionStorage.setItem(startKey, startedAt);
 localStorage.setItem(startKey, startedAt);
 } catch (e) {
 // ignore
 }
 }

 if (!initialFp) {
 initialFp = currentFp;
 try {
 localStorage.setItem(fpKey, currentFp);
 } catch (e) {
 // ignore
 }
 }

 const isDeviceSwitched = Boolean(initialFp && initialFp !== currentFp);

 return {
 startedAt,
 initialFingerprint: initialFp,
 isDeviceSwitched
 };
}

export function formatDuration(seconds: number): string {
 if (seconds < 60) {
 return `${seconds} s`;
 }
 const mins = Math.floor(seconds / 60);
 const remSec = seconds % 60;
 if (mins < 60) {
 return `${mins} min ${remSec > 0 ? `${remSec} s` : ''}`.trim();
 }
 const hours = Math.floor(mins / 60);
 const remMin = mins % 60;
 return `${hours} h ${remMin > 0 ? `${remMin} min` : ''}`.trim();
}

export function getFormSubmissionTelemetry(formId: string): FormSubmissionTelemetry {
 const session = initFormSession(formId);
 const metadata = getClientDeviceMetadata();
 const submittedAt = new Date().toISOString();

 const startTime = new Date(session.startedAt).getTime();
 const endTime = new Date(submittedAt).getTime();
 const rawDiffSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));
 // Guard against invalid system clock anomalies
 const durationSeconds = (isNaN(rawDiffSeconds) || rawDiffSeconds < 0) ? 1 : rawDiffSeconds;
 const durationFormatted = formatDuration(durationSeconds);

 return {
 fingerprint: metadata.fingerprint,
 browser: metadata.browser,
 os: metadata.os,
 deviceType: metadata.deviceType,
 screen: metadata.screen,
 timezone: metadata.timezone,
 language: metadata.language,
 userAgent: metadata.userAgent,
 startedAt: session.startedAt,
 submittedAt,
 durationSeconds,
 durationFormatted,
 deviceSwitched: session.isDeviceSwitched,
 initialFingerprint: session.initialFingerprint
 };
}
