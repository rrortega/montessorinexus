import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// In-memory cache for rendered PNGs
const ogImageCache = new Map();
const CACHE_MAX_ITEMS = 300;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Escapes XML/SVG special characters
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wraps text into lines for SVG <text> elements
 */
function wrapText(text, maxCharsPerLine = 38, maxLines = 3) {
  if (!text) return [];
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        break;
      }
    }
  }
  if (currentLine && lines.length < maxLines) {
    // If there were remaining words that didn't fit into maxLines, add ellipsis
    const consumedWords = lines.join(' ').split(/\s+/).length + currentLine.split(/\s+/).length;
    if (consumedWords < words.length) {
      currentLine += '...';
    }
    lines.push(currentLine);
  } else if (lines.length === maxLines && lines.join(' ').split(/\s+/).length < words.length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\.*$/, '...');
  }
  return lines;
}

/**
 * Converts category token to friendly human readable label
 */
function getCategoryLabel(category) {
  switch (String(category || '').toUpperCase()) {
    case 'PEDAGOGICAL':
      return { label: 'Pedagógico & Filosofía', color: '#10b981', bg: 'rgba(16, 185, 129, 0.18)' };
    case 'MEDICAL':
      return { label: 'Salud & Ficha Médica', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.18)' };
    case 'LEGAL_CONSENT':
      return { label: 'Consentimiento & Legal', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.18)' };
    case 'INTERVIEW':
      return { label: 'Entrevista & Admisiones', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.18)' };
    case 'FINANCIAL':
      return { label: 'Finanzas & Aranceles', color: '#34d399', bg: 'rgba(52, 211, 153, 0.18)' };
    case 'SURVEY':
      return { label: 'Encuesta Institucional', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.18)' };
    case 'ADMISSION_PROCESS':
    case 'PROCESS':
      return { label: 'Proceso & Expediente', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.18)' };
    default:
      return { label: 'Formulario Oficial', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.18)' };
  }
}

/**
 * Resolves a logo URL or local file path to a base64 Data URI
 */
async function resolveLogoBase64(logoUrl, rootDir) {
  if (!logoUrl) return null;

  try {
    // 1. If it's already a data URI
    if (logoUrl.startsWith('data:')) {
      return logoUrl;
    }

    // 2. If it's a local gallery path (/gallery/... or public/gallery/...)
    if (logoUrl.startsWith('/gallery/') || logoUrl.startsWith('gallery/')) {
      const filename = path.basename(logoUrl);
      const localPath = path.join(rootDir, 'public', 'gallery', filename);
      if (fs.existsSync(localPath)) {
        const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'png';
        const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png');
        const buf = fs.readFileSync(localPath);
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    }

    // 3. If it's in public root (/images/... or /assets/...)
    if (logoUrl.startsWith('/')) {
      const localPath = path.join(rootDir, 'public', logoUrl.slice(1));
      if (fs.existsSync(localPath)) {
        const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'png';
        const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png');
        const buf = fs.readFileSync(localPath);
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    }

    // 4. If it's an HTTP/HTTPS remote URL
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(logoUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const mime = res.headers.get('content-type') || 'image/png';
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    }
  } catch (err) {
    console.warn(`[OG-Image] Could not resolve logo URL "${logoUrl}":`, err.message);
  }

  return null;
}

/**
 * Builds the SVG string for the 1200x630 Form OpenGraph card
 */
export function buildFormOgSvg({
  title = 'Formulario',
  description = '',
  category = 'GENERAL',
  schoolName = 'Comunidad Montessori',
  schoolColor = '#1b3b2b',
  accentColor = '#c86d51',
  logoDataUri = null,
}) {
  const cat = getCategoryLabel(category);
  const primaryColor = schoolColor && schoolColor.startsWith('#') ? schoolColor : '#1b3b2b';
  const secondaryAccent = accentColor && accentColor.startsWith('#') ? accentColor : '#c86d51';

  const safeSchoolName = escapeXml(schoolName);
  const schoolInitial = safeSchoolName.charAt(0).toUpperCase() || 'M';
  const titleLines = wrapText(title, 32, 3);
  const descLines = wrapText(description || 'Completa este formulario oficial en línea de manera segura y confidencial.', 55, 2);

  const W = 1200;
  const H = 630;

  let titleStartY = 275;
  if (titleLines.length === 1) titleStartY = 295;
  if (titleLines.length === 2) titleStartY = 280;
  if (titleLines.length === 3) titleStartY = 265;

  const titleTspans = titleLines.map((line, idx) => {
    return `<tspan x="80" dy="${idx === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`;
  }).join('');

  const descTspans = descLines.map((line, idx) => {
    return `<tspan x="80" dy="${idx === 0 ? 0 : 30}">${escapeXml(line)}</tspan>`;
  }).join('');

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#060911"/>
    </linearGradient>

    <radialGradient id="schoolGlow" cx="20%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.45"/>
      <stop offset="70%" stop-color="${primaryColor}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="accentGlow" cx="85%" cy="80%" r="55%">
      <stop offset="0%" stop-color="${secondaryAccent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.85"/>
    </linearGradient>

    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.4"/>
    </linearGradient>

    <linearGradient id="nexusBadgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <clipPath id="logoClip">
      <rect x="80" y="70" width="76" height="76" rx="18" ry="18"/>
    </clipPath>

    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>

    <filter id="textGlow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap');
    .font-base { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
  </style>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#schoolGlow)"/>
  <rect width="${W}" height="${H}" fill="url(#accentGlow)"/>

  <g opacity="0.04" stroke="#ffffff" stroke-width="1">
    <line x1="0" y1="105" x2="1200" y2="105"/>
    <line x1="0" y1="210" x2="1200" y2="210"/>
    <line x1="0" y1="315" x2="1200" y2="315"/>
    <line x1="0" y1="420" x2="1200" y2="420"/>
    <line x1="0" y1="525" x2="1200" y2="525"/>
    <line x1="200" y1="0" x2="200" y2="630"/>
    <line x1="400" y1="0" x2="400" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="800" y1="0" x2="800" y2="630"/>
    <line x1="1000" y1="0" x2="1000" y2="630"/>
  </g>

  <rect x="44" y="38" width="1112" height="554" rx="28" fill="url(#cardGrad)" filter="url(#cardShadow)"/>
  <rect x="44" y="38" width="1112" height="554" rx="28" fill="none" stroke="url(#borderGrad)" stroke-width="2"/>

  ${logoDataUri ? `
    <rect x="80" y="70" width="76" height="76" rx="18" fill="#ffffff" fill-opacity="0.95"/>
    <image href="${logoDataUri}" x="84" y="74" width="68" height="68" preserveAspectRatio="xMidYMid meet" clip-path="url(#logoClip)"/>
  ` : `
    <rect x="80" y="70" width="76" height="76" rx="18" fill="${primaryColor}"/>
    <text x="118" y="122" class="font-base" font-size="36" font-weight="800" fill="#ffffff" text-anchor="middle">${schoolInitial}</text>
  `}

  <g transform="translate(174, 82)">
    <text x="0" y="28" class="font-base" font-size="28" font-weight="700" fill="#f8fafc" letter-spacing="-0.02em">
      ${safeSchoolName}
    </text>
    <text x="0" y="54" class="font-base" font-size="15" font-weight="500" fill="#94a3b8">
      Portal Oficial de Formularios &amp; Admisiones
    </text>
  </g>

  <g transform="translate(930, 74)">
    <rect x="0" y="0" width="190" height="42" rx="21" fill="rgba(255, 255, 255, 0.07)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5"/>
    <circle cx="24" cy="21" r="9" fill="#10b981" fill-opacity="0.2"/>
    <path d="M21 21l2 2 4-4" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="42" y="26" class="font-base" font-size="13" font-weight="600" fill="#e2e8f0" letter-spacing="0.04em">
      FORMULARIO WEB
    </text>
  </g>

  <g transform="translate(80, 185)">
    <rect x="0" y="0" width="${cat.label.length * 10 + 36}" height="32" rx="16" fill="${cat.bg}" stroke="${cat.color}" stroke-opacity="0.4" stroke-width="1"/>
    <circle cx="16" cy="16" r="4" fill="${cat.color}"/>
    <text x="28" y="21" class="font-base" font-size="13" font-weight="700" fill="${cat.color}" letter-spacing="0.02em">
      ${escapeXml(cat.label.toUpperCase())}
    </text>
  </g>

  <text x="80" y="${titleStartY}" class="font-base" font-size="44" font-weight="800" fill="#ffffff" filter="url(#textGlow)" letter-spacing="-0.03em">
    ${titleTspans}
  </text>

  <text x="80" y="${titleStartY + (titleLines.length * 54) + 12}" class="font-base" font-size="20" font-weight="400" fill="#cbd5e1" opacity="0.9">
    ${descTspans}
  </text>

  <g transform="translate(80, 520)">
    <line x1="0" y1="0" x2="1040" y2="0" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5"/>

    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="34" height="34" rx="10" fill="url(#nexusBadgeGrad)"/>
      <path d="M17 9 L24 13 L24 21 L17 25 L10 21 L10 13 Z" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="17" cy="17" r="2.5" fill="#ffffff"/>

      <text x="44" y="16" class="font-base" font-size="16" font-weight="700" fill="#f8fafc" letter-spacing="-0.01em">
        Montessori Nexus
      </text>
      <text x="44" y="30" class="font-base" font-size="12" font-weight="500" fill="#94a3b8">
        El Sistema Operativo para Escuelas Montessori
      </text>
    </g>

    <g transform="translate(820, 26)">
      <text x="220" y="14" class="font-base" font-size="14" font-weight="600" fill="#38bdf8" text-anchor="end" letter-spacing="0.02em">
        montessorinexus.com 🔒
      </text>
    </g>
  </g>
</svg>`;
}

/**
 * Builds the SVG string for the 1200x630 Process / Dossier OpenGraph card
 */
export function buildProcessOgSvg({
  processName = 'Proceso de Admisión',
  stageName = '',
  stagesCount = 0,
  schoolName = 'Comunidad Montessori',
  schoolColor = '#1b3b2b',
  accentColor = '#c86d51',
  logoDataUri = null,
  description = '',
}) {
  const primaryColor = schoolColor && schoolColor.startsWith('#') ? schoolColor : '#1b3b2b';
  const secondaryAccent = accentColor && accentColor.startsWith('#') ? accentColor : '#c86d51';

  const safeSchoolName = escapeXml(schoolName);
  const schoolInitial = safeSchoolName.charAt(0).toUpperCase() || 'M';
  const title = processName.toLowerCase().startsWith('proceso') ? processName : `Proceso de ${processName}`;
  const titleLines = wrapText(title, 32, 2);
  const descText = description || (stageName ? `Etapa actual: ${stageName}. Seguimiento de expediente y requisitos en línea.` : `Portal interactivo de seguimiento para el proceso de ${processName}.`);
  const descLines = wrapText(descText, 55, 2);

  const W = 1200;
  const H = 630;

  let titleStartY = 280;
  if (titleLines.length === 1) titleStartY = 300;
  if (titleLines.length === 2) titleStartY = 280;

  const titleTspans = titleLines.map((line, idx) => {
    return `<tspan x="80" dy="${idx === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`;
  }).join('');

  const descTspans = descLines.map((line, idx) => {
    return `<tspan x="80" dy="${idx === 0 ? 0 : 30}">${escapeXml(line)}</tspan>`;
  }).join('');

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c16"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#080a12"/>
    </linearGradient>

    <radialGradient id="pSchoolGlow" cx="25%" cy="20%" r="65%">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="${primaryColor}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="pAccentGlow" cx="80%" cy="80%" r="55%">
      <stop offset="0%" stop-color="${secondaryAccent}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="pCardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/>
    </linearGradient>

    <linearGradient id="pBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.45"/>
    </linearGradient>

    <linearGradient id="nexusBadgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <clipPath id="pLogoClip">
      <rect x="80" y="70" width="76" height="76" rx="18" ry="18"/>
    </clipPath>

    <filter id="pCardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>

    <filter id="pTextGlow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap');
    .font-base { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
  </style>

  <rect width="${W}" height="${H}" fill="url(#pBgGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#pSchoolGlow)"/>
  <rect width="${W}" height="${H}" fill="url(#pAccentGlow)"/>

  <g opacity="0.04" stroke="#ffffff" stroke-width="1">
    <line x1="0" y1="105" x2="1200" y2="105"/>
    <line x1="0" y1="210" x2="1200" y2="210"/>
    <line x1="0" y1="315" x2="1200" y2="315"/>
    <line x1="0" y1="420" x2="1200" y2="420"/>
    <line x1="0" y1="525" x2="1200" y2="525"/>
    <line x1="200" y1="0" x2="200" y2="630"/>
    <line x1="400" y1="0" x2="400" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="800" y1="0" x2="800" y2="630"/>
    <line x1="1000" y1="0" x2="1000" y2="630"/>
  </g>

  <rect x="44" y="38" width="1112" height="554" rx="28" fill="url(#pCardGrad)" filter="url(#pCardShadow)"/>
  <rect x="44" y="38" width="1112" height="554" rx="28" fill="none" stroke="url(#pBorderGrad)" stroke-width="2"/>

  ${logoDataUri ? `
    <rect x="80" y="70" width="76" height="76" rx="18" fill="#ffffff" fill-opacity="0.95"/>
    <image href="${logoDataUri}" x="84" y="74" width="68" height="68" preserveAspectRatio="xMidYMid meet" clip-path="url(#pLogoClip)"/>
  ` : `
    <rect x="80" y="70" width="76" height="76" rx="18" fill="${primaryColor}"/>
    <text x="118" y="122" class="font-base" font-size="36" font-weight="800" fill="#ffffff" text-anchor="middle">${schoolInitial}</text>
  `}

  <g transform="translate(174, 82)">
    <text x="0" y="28" class="font-base" font-size="28" font-weight="700" fill="#f8fafc" letter-spacing="-0.02em">
      ${safeSchoolName}
    </text>
    <text x="0" y="54" class="font-base" font-size="15" font-weight="500" fill="#94a3b8">
      Portal de Procesos &amp; Expediente de Admisiones
    </text>
  </g>

  <!-- Top Right Portal Badge -->
  <g transform="translate(900, 74)">
    <rect x="0" y="0" width="220" height="42" rx="21" fill="rgba(255, 255, 255, 0.07)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5"/>
    <circle cx="24" cy="21" r="9" fill="#818cf8" fill-opacity="0.2"/>
    <path d="M19 21h10M24 16v10" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
    <text x="44" y="26" class="font-base" font-size="13" font-weight="600" fill="#e2e8f0" letter-spacing="0.04em">
      EXPEDIENTE DIGITAL
    </text>
  </g>

  <!-- Process / Stage Badge -->
  <g transform="translate(80, 185)">
    <rect x="0" y="0" width="220" height="34" rx="17" fill="rgba(129, 140, 248, 0.18)" stroke="#818cf8" stroke-opacity="0.4" stroke-width="1"/>
    <circle cx="18" cy="17" r="4" fill="#818cf8"/>
    <text x="32" y="22" class="font-base" font-size="13" font-weight="700" fill="#818cf8" letter-spacing="0.02em">
      ${escapeXml(stageName ? `ETAPA: ${stageName.toUpperCase()}` : (stagesCount > 0 ? `${stagesCount} FASES DEL PROCESO` : 'PROCESO ACTIVO'))}
    </text>
  </g>

  <!-- Process Title -->
  <text x="80" y="${titleStartY}" class="font-base" font-size="44" font-weight="800" fill="#ffffff" filter="url(#pTextGlow)" letter-spacing="-0.03em">
    ${titleTspans}
  </text>

  <!-- Process Description -->
  <text x="80" y="${titleStartY + (titleLines.length * 54) + 12}" class="font-base" font-size="20" font-weight="400" fill="#cbd5e1" opacity="0.9">
    ${descTspans}
  </text>

  <!-- Bottom Platform Credit & Branding Divider -->
  <g transform="translate(80, 520)">
    <line x1="0" y1="0" x2="1040" y2="0" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5"/>

    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="34" height="34" rx="10" fill="url(#nexusBadgeGrad)"/>
      <path d="M17 9 L24 13 L24 21 L17 25 L10 21 L10 13 Z" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="17" cy="17" r="2.5" fill="#ffffff"/>

      <text x="44" y="16" class="font-base" font-size="16" font-weight="700" fill="#f8fafc" letter-spacing="-0.01em">
        Montessori Nexus
      </text>
      <text x="44" y="30" class="font-base" font-size="12" font-weight="500" fill="#94a3b8">
        El Sistema Operativo para Escuelas Montessori
      </text>
    </g>

    <g transform="translate(820, 26)">
      <text x="220" y="14" class="font-base" font-size="14" font-weight="600" fill="#38bdf8" text-anchor="end" letter-spacing="0.02em">
        montessorinexus.com 🔒
      </text>
    </g>
  </g>
</svg>`;
}

/**
 * Generates and returns a PNG buffer for the given form
 */
export async function generateFormOgImage({
  form,
  school,
  rootDir,
}) {
  const cacheKey = `form_og_${form.id}_${form.updatedAt ? new Date(form.updatedAt).getTime() : 0}_${school?.updatedAt ? new Date(school.updatedAt).getTime() : 0}`;

  const cached = ogImageCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.buffer;
  }

  const logoDataUri = await resolveLogoBase64(school?.logoUrl, rootDir);

  const svgString = buildFormOgSvg({
    title: form.title || 'Formulario',
    description: form.description || '',
    category: form.category || 'GENERAL',
    schoolName: school?.name || 'Comunidad Montessori',
    schoolColor: school?.primaryColor || '#1b3b2b',
    accentColor: school?.accentColor || '#c86d51',
    logoDataUri,
  });

  const pngBuffer = await sharp(Buffer.from(svgString), { density: 150 })
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  if (ogImageCache.size >= CACHE_MAX_ITEMS) {
    const firstKey = ogImageCache.keys().next().value;
    ogImageCache.delete(firstKey);
  }
  ogImageCache.set(cacheKey, { buffer: pngBuffer, timestamp: Date.now() });

  return pngBuffer;
}

/**
 * Generates and returns a PNG buffer for a Process / Admission Application Dossier
 */
export async function generateProcessOgImage({
  process,
  application,
  school,
  stage,
  rootDir,
}) {
  const processId = process?.id || application?.processId || application?.id || 'proc';
  const cacheKey = `process_og_${processId}_${stage?.id || ''}_${school?.id || ''}`;

  const cached = ogImageCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.buffer;
  }

  const logoDataUri = await resolveLogoBase64(school?.logoUrl, rootDir);

  const svgString = buildProcessOgSvg({
    processName: process?.name || process?.label || 'Admisión',
    stageName: stage?.name || '',
    stagesCount: Array.isArray(process?.stages) ? process.stages.length : 0,
    schoolName: school?.name || 'Comunidad Montessori',
    schoolColor: school?.primaryColor || '#1b3b2b',
    accentColor: school?.accentColor || '#c86d51',
    logoDataUri,
    description: process?.description || '',
  });

  const pngBuffer = await sharp(Buffer.from(svgString), { density: 150 })
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  if (ogImageCache.size >= CACHE_MAX_ITEMS) {
    const firstKey = ogImageCache.keys().next().value;
    ogImageCache.delete(firstKey);
  }
  ogImageCache.set(cacheKey, { buffer: pngBuffer, timestamp: Date.now() });

  return pngBuffer;
}
