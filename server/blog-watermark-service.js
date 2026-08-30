import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WATERMARK_VERSION = 'v13.0';
const DEFAULT_LOCAL_ROOT = path.join(__dirname, '../storage');

/**
 * Samples the original image to detect the exact paper background color
 * (parchment, ivory, warm beige, light cream, or warm grey)
 */
export async function detectPaperColor(imageInstance) {
  try {
    const raw = await imageInstance
      .clone()
      .resize(64, 64, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer();

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < raw.length; i += 3) {
      const r = raw[i];
      const g = raw[i + 1];
      const b = raw[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      // Sample bright/paper pixels
      if (luminance > 140) {
        rSum += r;
        gSum += g;
        bSum += b;
        count++;
      }
    }

    if (count > 10) {
      return {
        r: Math.round(rSum / count),
        g: Math.round(gSum / count),
        b: Math.round(bSum / count)
      };
    }
  } catch (err) {
    console.warn('⚠️ [Watermark] Error sampling paper color, using warm parchment fallback:', err.message);
  }

  // Fallback: warm artist sketchbook paper
  return { r: 238, g: 228, b: 215 };
}

/**
 * Returns dynamic SVG simulating an artist manually erasing a charcoal drawing with:
 * - Highly pronounced forward-leaning eraser scrubs (steep diagonal forward angle)
 * - Chiseled, straight, and uneven edge profiles (oscillating widths, non-uniform flat/square caps)
 * - Hand-dragged tapered horizontal wedge sweep (thin on the left, thick on the right)
 * - Residual charcoal smudges, rough torn friction edges, and crumb specks
 * - Signed with hand-drawn black crayon / soft charcoal
 */
export function getArtisticEraserSignatureSvg(paperColor = { r: 238, g: 228, b: 215 }) {
  const { r, g, b } = paperColor;
  const paperRgb = `rgb(${r}, ${g}, ${b})`;
  const paperLighter = `rgb(${Math.min(255, r + 18)}, ${Math.min(255, g + 18)}, ${Math.min(255, b + 18)})`;
  const paperDarker = `rgb(${Math.max(0, r - 12)}, ${Math.max(0, g - 12)}, ${Math.max(0, b - 12)})`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 95" width="460" height="95">
  <defs>
    <!-- Heavy Organic Paper Friction & Torn Eraser Edge Filter -->
    <filter id="organicFriction" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045 0.08" numOctaves="4" result="roughNoise" />
      <feDisplacementMap in="SourceGraphic" in2="roughNoise" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced" />
      <feGaussianBlur in="displaced" stdDeviation="1.8" result="blurred" />
      <feMerge>
        <feMergeNode in="blurred" />
        <feMergeNode in="displaced" opacity="0.94" />
      </feMerge>
    </filter>

    <!-- Charcoal / Crayon Texture Filter for Hand-drawn Stroke -->
    <filter id="charcoalTexture" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" result="grain" />
      <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="textured" />
      <feMerge>
        <feMergeNode in="textured" />
      </feMerge>
    </filter>
  </defs>

  <!-- 1. Real Hand-Erased Smudge & Friction Layer -->
  <g filter="url(#organicFriction)">
    <!-- Base ambient erased zone: organic irregular blob where graphite was lifted -->
    <path 
      d="M 20,48 C 45,35 110,40 180,32 C 260,26 350,23 434,22 C 446,38 448,68 430,76 C 350,84 240,78 140,74 C 65,72 16,64 20,48 Z" 
      fill="${paperRgb}" 
      fill-opacity="0.45" 
    />

    <!-- A) LARGE HAND-DRAGGED HORIZONTAL WEDGE (Thin on the left ~9px, expanding wide on the right ~46px) -->
    <path 
      d="M 14,50 C 60,42 120,52 190,42 C 270,34 360,28 440,24 C 448,46 444,72 434,78 C 340,80 230,72 130,66 C 70,62 24,58 14,50 Z" 
      fill="${paperLighter}" 
      fill-opacity="0.68" 
    />
    <path 
      d="M 22,52 C 90,48 180,42 300,34 C 370,30 415,28 436,40 C 440,58 410,66 330,67 C 210,69 110,60 22,52 Z" 
      fill="${paperDarker}" 
      fill-opacity="0.22" 
    />

    <!-- B) PRONOUNCED FORWARD-LEANING ERASER SCRUBS (Steep angle forward, oscillating widths & chisel edges) -->
    <!-- Scrub 1: Far left chiseled cut (starts at x=12, leans hard forward to x=58, chisel square cap) -->
    <path d="M 12,82 C 24,60 42,40 58,16" stroke="${paperRgb}" stroke-width="15" stroke-linecap="square" fill="none" stroke-opacity="0.50" />
    
    <!-- Scrub 2: Wedge-shaped scrub with oscillating variable ribbon contour -->
    <path d="M 32,86 C 46,74 62,54 78,38 C 88,28 98,18 106,12 L 122,16 C 110,34 94,56 76,72 C 60,86 46,90 32,86 Z" fill="${paperLighter}" fill-opacity="0.74" />
    
    <!-- Scrub 3: Medium forward thrust with flat butt cap -->
    <path d="M 54,80 C 72,56 96,36 118,14" stroke="${paperRgb}" stroke-width="18" stroke-linecap="butt" fill="none" stroke-opacity="0.55" />
    
    <!-- Scrub 4: Broad heavy pressure chisel swipe (starts at x=78, sweeps to x=152) -->
    <path d="M 76,88 C 96,54 126,30 152,10" stroke="${paperLighter}" stroke-width="30" stroke-linecap="square" fill="none" stroke-opacity="0.85" />
    
    <!-- Scrub 5: Quick narrow gouge with sharp end -->
    <path d="M 112,82 C 132,58 154,40 174,18" stroke="${paperRgb}" stroke-width="14" stroke-linecap="butt" fill="none" stroke-opacity="0.48" />
    
    <!-- Scrub 6: Massive wedge scrub expanding from 18px to 38px under "Montessori" -->
    <path d="M 132,90 C 150,78 174,54 198,36 C 214,24 230,14 242,8 L 260,14 C 242,32 220,58 196,76 C 174,90 152,94 132,90 Z" fill="${paperLighter}" fill-opacity="0.88" />
    
    <!-- Scrub 7: Steep friction mark crossing middle -->
    <path d="M 168,78 C 190,52 216,32 238,16" stroke="${paperRgb}" stroke-width="19" stroke-linecap="butt" fill="none" stroke-opacity="0.60" />
    
    <!-- Scrub 8: Heavy forward chisel pass under "Nexus" -->
    <path d="M 204,88 C 230,52 264,26 298,10" stroke="${paperLighter}" stroke-width="34" stroke-linecap="square" fill="none" stroke-opacity="0.88" />
    
    <!-- Scrub 9: Narrow oscillating strike -->
    <path d="M 242,82 C 264,58 290,40 312,22" stroke="${paperRgb}" stroke-width="16" stroke-linecap="butt" fill="none" stroke-opacity="0.52" />
    
    <!-- Scrub 10: Broad wedge scrub with irregular chiseled profile under ".com" -->
    <path d="M 268,90 C 290,74 318,52 344,34 C 362,22 380,12 394,8 L 410,14 C 392,34 366,60 340,78 C 314,92 290,94 268,90 Z" fill="${paperLighter}" fill-opacity="0.84" />
    
    <!-- Scrub 11: Steep forward flick -->
    <path d="M 308,80 C 334,54 362,34 388,18" stroke="${paperRgb}" stroke-width="18" stroke-linecap="butt" fill="none" stroke-opacity="0.58" />
    
    <!-- Scrub 12: Broad final wipe on far right (slanted forward to x=448) -->
    <path d="M 346,86 C 376,52 410,26 446,10" stroke="${paperLighter}" stroke-width="28" stroke-linecap="square" fill="none" stroke-opacity="0.78" />
    
    <!-- Scrub 13: Tail end sharp edge mark -->
    <path d="M 384,80 C 408,58 430,40 450,24" stroke="${paperRgb}" stroke-width="15" stroke-linecap="butt" fill="none" stroke-opacity="0.45" />

    <!-- Organic eraser crumbs & residual graphite lift patches -->
    <ellipse cx="64" cy="48" rx="26" ry="16" fill="${paperLighter}" fill-opacity="0.42" />
    <ellipse cx="195" cy="44" rx="38" ry="22" fill="${paperLighter}" fill-opacity="0.48" />
    <ellipse cx="345" cy="46" rx="32" ry="19" fill="${paperLighter}" fill-opacity="0.44" />
  </g>

  <!-- 2. Pure Black Hand-drawn Charcoal / Crayon Signature (No logo, No terracotta) -->
  <g filter="url(#charcoalTexture)">
    <!-- Main Hand-written Text in Rough Graphite/Charcoal Black -->
    <text 
      x="35" 
      y="57" 
      font-family="'Caveat', 'Kalam', 'Dancing Script', 'Architects Daughter', 'Bradley Hand', 'Segoe Script', cursive, sans-serif" 
      font-size="39" 
      font-weight="700" 
      font-style="italic"
      fill="#0e0e0e" 
      letter-spacing="0.7"
    >
      MontessoriNexus<tspan font-size="25" font-weight="600" font-style="normal" fill="#1c1c1c">.com</tspan>
    </text>

    <!-- Artistic quick gesture underline flourish -->
    <path 
      d="M 38,68 C 140,73 260,65 410,69" 
      fill="none" 
      stroke="#121212" 
      stroke-width="2.0" 
      stroke-linecap="round" 
      stroke-opacity="0.82" 
    />
  </g>
</svg>`;
}

export function getDefaultSignatureSvg() {
  return getArtisticEraserSignatureSvg();
}

/**
 * Checks if a given storage path is a blog image eligible for watermark
 */
export function isBlogImage(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return false;
  const clean = relativePath.toLowerCase().replace(/\\/g, '/');
  
  // Must be in a blog-related directory
  const isBlogDir = clean.includes('/blog/') || clean.startsWith('public/blog/') || clean.startsWith('blog/') || clean.startsWith('schools/platform/blog/');
  if (!isBlogDir) return false;

  // Exclude cache directories
  if (clean.includes('cache/')) return false;

  // Must be an image format supported by sharp
  return (
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.webp')
  );
}

/**
 * Ensures watermark is ONLY applied if accessed from the SaaS blog (e.g. blog. subdomain)
 * and strictly never on school blogs.
 */
export function isSaaSBlogRequest(req, relativePath) {
  // 1. If path explicitly belongs to a specific school tenant, never watermark
  if (relativePath) {
    const clean = relativePath.toLowerCase().replace(/\\/g, '/');
    if (clean.startsWith('schools/') && !clean.startsWith('schools/platform/')) {
      return false; // Belongs to a school
    }
  }

  if (!req) return false;

  // 2. Check Host / x-forwarded-host (e.g. blog.montessorinexus.com, blog.localhost)
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').split(':')[0].toLowerCase().trim();
  if (host.startsWith('blog.') || host === 'blog.localhost' || host === 'blog.montessorinexus.com') {
    return true;
  }

  // 3. Check Referer header (when images are requested by an HTML page on blog.* or /blog)
  const referer = String(req.headers?.referer || '').toLowerCase();
  if (referer.includes('://blog.') || (referer.includes('/blog') && !referer.includes('/colegio/'))) {
    return true;
  }

  // 4. Check explicit platform indicator or signed endpoint
  if (
    req.path?.includes('/blog/images/signed') ||
    req.query?.isPlatform === 'true' ||
    req.query?.source === 'saas-blog' ||
    req.headers?.['x-is-platform'] === 'true'
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves signature buffer: dynamically generates custom SVG tailored to detected paper color
 */
export async function getSignatureBuffer(signaturePath = null, paperColor = null) {
  if (signaturePath && fs.existsSync(signaturePath)) {
    try {
      return fs.readFileSync(signaturePath);
    } catch (e) {
      console.warn('Could not read custom signature, using default SVG:', e.message);
    }
  }

  return Buffer.from(getArtisticEraserSignatureSvg(paperColor || { r: 238, g: 228, b: 215 }), 'utf8');
}

/**
 * Composites the signature watermark onto an image buffer
 */
export async function processSignedBlogImageBuffer(sourceBuffer, options = {}) {
  const image = sharp(sourceBuffer).rotate();
  const metadata = await image.metadata();

  const imgWidth = metadata.width || 1200;
  const imgHeight = metadata.height || 800;

  // Detect genuine paper color from original drawing
  const paperColor = await detectPaperColor(image);

  // Calculate signature dimensions relative to main image (enlarged for prominence)
  const targetSigWidth = Math.max(220, Math.min(Math.round(imgWidth * 0.36), 460));
  
  const signatureRawBuffer = await getSignatureBuffer(options.signaturePath, paperColor);
  
  // Resize signature proportionally with sharp density for crisp SVG rendering
  const signatureSharp = sharp(signatureRawBuffer, { density: 250 });
  const resizedSigBuffer = await signatureSharp
    .resize({ width: targetSigWidth, withoutEnlargement: false })
    .png()
    .toBuffer();

  const sigMeta = await sharp(resizedSigBuffer).metadata();
  const sigWidth = sigMeta.width || targetSigWidth;
  const sigHeight = sigMeta.height || Math.round(targetSigWidth * (95 / 460));

  // Compute position (southwest bottom-left with margin)
  const marginLeft = Math.max(18, Math.round(imgWidth * 0.025));
  const marginBottom = Math.max(18, Math.round(imgHeight * 0.03));
  const left = marginLeft;
  const top = Math.max(0, imgHeight - sigHeight - marginBottom);

  // Composite and export as WebP
  return await image
    .composite([
      {
        input: resizedSigBuffer,
        left,
        top,
        blend: 'over'
      }
    ])
    .webp({ quality: 88, effort: 4 })
    .toBuffer();
}

/**
 * Gets or creates cached signed blog image file
 */
export async function getOrGenerateSignedBlogFile({
  relativePath,
  sourceFSPath = null,
  sourceBuffer = null,
  config = null
}) {
  const localRoot = config?.localRoot || DEFAULT_LOCAL_ROOT;
  const cacheDir = path.join(localRoot, 'cache/blog-signed');

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Derive unique deterministic cache filename
  const baseName = path.basename(relativePath, path.extname(relativePath));
  const pathHash = crypto.createHash('md5').update(`${relativePath}:${WATERMARK_VERSION}`).digest('hex').substring(0, 10);
  const cachedFilePath = path.join(cacheDir, `${baseName}-${pathHash}.webp`);

  // Check if already in cache and newer than source file
  if (fs.existsSync(cachedFilePath)) {
    if (sourceFSPath && fs.existsSync(sourceFSPath)) {
      const srcStat = fs.statSync(sourceFSPath);
      const cacheStat = fs.statSync(cachedFilePath);
      if (cacheStat.mtimeMs >= srcStat.mtimeMs) {
        return {
          filePath: cachedFilePath,
          mimeType: 'image/webp',
          isCacheHit: true
        };
      }
    } else {
      return {
        filePath: cachedFilePath,
        mimeType: 'image/webp',
        isCacheHit: true
      };
    }
  }

  // Need to process: load source buffer
  let inputBuffer = sourceBuffer;
  if (!inputBuffer && sourceFSPath && fs.existsSync(sourceFSPath)) {
    inputBuffer = fs.readFileSync(sourceFSPath);
  }

  if (!inputBuffer) {
    throw new Error(`Source image buffer not available for ${relativePath}`);
  }

  // Process with sharp
  const signedWebpBuffer = await processSignedBlogImageBuffer(inputBuffer);

  // Write to cache
  fs.writeFileSync(cachedFilePath, signedWebpBuffer);

  return {
    filePath: cachedFilePath,
    buffer: signedWebpBuffer,
    mimeType: 'image/webp',
    isCacheHit: false
  };
}

/**
 * Transforms any storage URL into a dedicated signed watermarked URL for SaaS blog
 */
export function transformBlogImageUrl(imageUrl, isSaaS = true) {
  if (!isSaaS || !imageUrl || typeof imageUrl !== 'string') return imageUrl;
  const clean = imageUrl.trim();

  // If already has signed path but outdated version, or clean external third-party avatar
  if (clean.startsWith('data:') || clean.includes('randomuser.me')) {
    return clean;
  }

  if (clean.includes('/api/blog/images/signed')) {
    // If version missing or outdated, refresh version query param
    if (!clean.includes(`v=${WATERMARK_VERSION}`)) {
      const separator = clean.includes('?') ? '&' : '?';
      return `${clean.replace(/[?&]v=[^&]+/g, '')}${separator}v=${WATERMARK_VERSION}`;
    }
    return clean;
  }

  // If it's a storage URL or public blog image
  if (clean.includes('/api/storage/') || clean.startsWith('public/blog/') || clean.startsWith('/public/blog/') || clean.includes('storage/')) {
    return `/api/blog/images/signed?url=${encodeURIComponent(clean)}&v=${WATERMARK_VERSION}`;
  }

  return clean;
}

/**
 * Replaces all embedded markdown image links with signed watermarked URLs
 */
export function transformBlogContentImages(content, isSaaS = true) {
  if (!isSaaS || !content || typeof content !== 'string') return content;
  return content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    const transformed = transformBlogImageUrl(url, isSaaS);
    return `![${alt}](${transformed})`;
  });
}

