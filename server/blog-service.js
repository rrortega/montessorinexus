import './env.js';
import crypto from 'crypto';
import { storageServiceFor, extractStorageRelativePath } from './storage-service.js';

// Slugify helper
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Calculates estimated reading time in minutes based on words count
 */
export const calculateReadingTime = (content) => {
  if (!content) return 1;
  const words = content.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

/**
 * Checks if a school has active entitlement to use the Blog module.
 * Logic: Free for the first 90 days (trial) from school creation, or if subscription/feature is enabled.
 */
export function checkSchoolBlogEntitlement(school) {
  if (!school || !school.id) {
    // SaaS platform level is always entitled
    return { allowed: true, inTrial: false, daysLeft: 0, isPlatform: true };
  }

  const features = typeof school.features === 'object' && school.features !== null ? school.features : {};
  const blogFeature = features.blog || {};
  
  if (blogFeature.enabled === true || features.blogSubscriptionActive === true || features.allModulesActive === true) {
    return { allowed: true, inTrial: false, daysLeft: 0, isSubscribed: true };
  }

  const createdAt = school.createdAt ? new Date(school.createdAt) : new Date();
  const now = new Date();
  const trialDays = 90;
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, trialDays - diffDays);

  if (daysLeft > 0) {
    return {
      allowed: true,
      inTrial: true,
      daysLeft,
      trialEndsAt: new Date(createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  return {
    allowed: false,
    inTrial: false,
    daysLeft: 0,
    reason: 'El período de prueba de 3 meses para el módulo de Blog ha expirado. Por favor activa la suscripción para continuar publicando.'
  };
}

/**
 * AI Configuration resolver for Blog Copilot
 */
export async function getBlogAiConfig(schoolId, prisma) {
  let settings = [];
  if (schoolId) {
    settings = await prisma.siteSetting.findMany({
      where: {
        schoolId,
        key: {
          in: ['ai_provider_mode', 'ai_api_key', 'openai_api_key', 'OPENAI_API_KEY', 'ai_base_url', 'ai_model_text', 'ai_model_image']
        }
      }
    });
  }

  const getVal = (keys, fallback = '') => {
    const s = settings.find(item => keys.includes(item.key));
    return s ? s.value.trim() : fallback;
  };

  const providerMode = getVal(['ai_provider_mode'], 'platform');
  const customApiKey = getVal(['ai_api_key', 'openai_api_key', 'OPENAI_API_KEY'], '');
  let platformApiKey = (process.env.DEFAULT_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '').trim();

  // If no env key found, check database for any configured system/school AI key
  if (!platformApiKey && prisma) {
    try {
      const fallbackSetting = await prisma.siteSetting.findFirst({
        where: {
          key: { in: ['ai_api_key', 'openai_api_key', 'OPENAI_API_KEY', 'system_openai_api_key'] },
          value: { not: '' }
        }
      });
      if (fallbackSetting && fallbackSetting.value) {
        platformApiKey = fallbackSetting.value.trim();
      }
    } catch (e) {
      console.warn('Fallback AI key query error:', e.message);
    }
  }

  let usePlatform = true;
  if (providerMode === 'custom' && customApiKey) {
    usePlatform = false;
  } else if (!platformApiKey && customApiKey) {
    usePlatform = false;
  }

  const apiKey = usePlatform ? (platformApiKey || customApiKey) : (customApiKey || platformApiKey);
  const baseUrl = (usePlatform
    ? (process.env.DEFAULT_AI_BASE_URL || process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1')
    : getVal(['ai_base_url'], 'https://api.openai.com/v1')).replace(/\/+$/, '');
  const textModel = (usePlatform
    ? (process.env.DEFAULT_AI_MODEL || process.env.OPENAI_TEXT_MODEL || process.env.AI_MODEL || 'gpt-4o-mini')
    : getVal(['ai_model_text'], 'gpt-4o-mini')).replace(/^models\//, '');
  const imageModel = (usePlatform
    ? (process.env.DEFAULT_AI_IMAGE_MODEL || process.env.AI_IMAGE_MODEL || process.env.AI_MODEL_IMAGE || 'gpt-image-1')
    : getVal(['ai_model_image'], 'gpt-image-1')).replace(/^models\//, '');

  return { apiKey, baseUrl, textModel, imageModel };
}

/**
 * Generates SEO metadata (metaTitle, metaDescription, slug, excerpt, keywords, coverImageAlt)
 */
export async function generateBlogMetadataWithAi({ title, content, locale = 'es', schoolId, prisma }) {
  const { apiKey, baseUrl, textModel } = await getBlogAiConfig(schoolId, prisma);

  if (!apiKey) {
    const cleanSlug = slugify(title);
    const plainText = content.replace(/<[^>]*>?/gm, '').trim();
    const excerpt = plainText.slice(0, 160) + '...';
    return {
      slug: cleanSlug,
      metaTitle: title ? `${title} | Blog` : 'Artículo de Blog',
      metaDescription: excerpt,
      excerpt,
      keywords: ['montessori', 'educacion', 'aprendizaje'],
      coverImageAlt: title || 'Imagen principal del artículo'
    };
  }

  const prompt = `Analiza el siguiente título y contenido de un artículo de blog educativo/Montessori en idioma "${locale}".
Genera metadatos altamente optimizados para SEO y accesibilidad.

Título: ${title}
Contenido (extracto):
${content.slice(0, 3500)}

Responde ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "slug": "slug-url-amigable-en-${locale}-sin-tildes-ni-simbolos",
  "metaTitle": "Título SEO optimizado de 50 a 60 caracteres",
  "metaDescription": "Descripción SEO cautivadora de 130 a 155 caracteres",
  "excerpt": "Extracto o resumen del artículo de 2 a 3 frases",
  "keywords": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
  "coverImageAlt": "Texto alternativo descriptivo y accesible para la imagen de portada"
}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: textModel,
      messages: [
        { role: 'system', content: 'Eres un experto en SEO técnico, accesibilidad web y pedagogía Montessori. Responde exclusivamente en JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en API de IA (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const contentStr = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(contentStr);

  return {
    slug: slugify(parsed.slug || title),
    metaTitle: parsed.metaTitle || title,
    metaDescription: parsed.metaDescription || parsed.excerpt || '',
    excerpt: parsed.excerpt || '',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    coverImageAlt: parsed.coverImageAlt || title
  };
}

/**
 * Translates blog article content into targetLocale preserving markdown formatting, SEO, OpenGraph and Montessori tone
 */
export async function translateBlogContentWithAi({ title, excerpt, content, metaTitle, metaDescription, targetLocale, sourceLocale = 'es', schoolId, prisma }) {
  const { apiKey, baseUrl, textModel } = await getBlogAiConfig(schoolId, prisma);

  if (!apiKey) {
    throw new Error('No se encontró API Key configurada para realizar la traducción con IA.');
  }

  const prompt = `Traduce y adapta completamente el siguiente artículo del idioma "${sourceLocale}" al idioma "${targetLocale}".
Conserva intacta la estructura en Markdown (títulos #, negritas, listas, citas, enlaces, imágenes), manteniendo una terminología pedagógica Montessori rigurosa y natural en "${targetLocale}".

Título original: ${title}
Extracto original: ${excerpt || ''}
Meta Título original: ${metaTitle || title}
Meta Descripción original: ${metaDescription || excerpt || ''}

Contenido Markdown a traducir:
${content}

REGLAS OBLIGATORIAS PARA METADATOS Y REDES SOCIALES (SEO & OpenGraph):
1. "title": Título principal del artículo traducido con fuerza pedagógica.
2. "excerpt": Resumen cautivador traducido de 2 a 3 oraciones.
3. "content": Markdown completo 100% traducido al idioma "${targetLocale}".
4. "metaTitle": Título SEO y OpenGraph (Facebook/Twitter/LinkedIn) optimizado en "${targetLocale}", atractivo y conciso (máximo 60 caracteres).
5. "metaDescription": Descripción persuasiva para buscadores SEO y OpenGraph en "${targetLocale}" (entre 120 y 160 caracteres).
6. "slug": Slug URL amigable en minúsculas y separado por guiones en "${targetLocale}".

Responde ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "title": "Título traducido",
  "slug": "slug-en-${targetLocale}",
  "excerpt": "Extracto traducido",
  "content": "Contenido Markdown completamente traducido",
  "metaTitle": "Título SEO y OpenGraph en ${targetLocale}",
  "metaDescription": "Descripción SEO y OpenGraph en ${targetLocale}"
}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: textModel,
      messages: [
        { role: 'system', content: 'Eres un traductor profesional experto en localización editorial multilingüe, SEO y OpenGraph para educación Montessori. Responde exclusivamente en JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en API de IA (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const contentStr = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(contentStr);

  return {
    title: parsed.title || title,
    slug: slugify(parsed.slug || parsed.title || title),
    excerpt: parsed.excerpt || '',
    content: parsed.content || content,
    metaTitle: parsed.metaTitle || parsed.title || title,
    metaDescription: parsed.metaDescription || parsed.excerpt || ''
  };
}

/**
 * Assists author in expanding or refining article draft
 */
export async function assistBlogDraftWithAi({ topic, targetAudience = 'families', tone = 'warm_pedagogical', locale = 'es', outlineOnly = false, schoolId, prisma }) {
  const { apiKey, baseUrl, textModel } = await getBlogAiConfig(schoolId, prisma);

  if (!apiKey) {
    throw new Error('No se encontró API Key de IA disponible.');
  }

  const prompt = `Eres un redactor y pedagogo Montessori de alto nivel internacional.
Tema del artículo: "${topic}"
Audiencia objetivo: "${targetAudience}" (ej: familias, educadores, directores escolares)
Idioma: "${locale}"
Modo: ${outlineOnly ? 'Estructura / Outline con puntos clave' : 'Artículo completo listo para publicar en formato Markdown enriquecido'}

Escribe un contenido cautivador, fundamentado en el respeto al niño, la autonomía y la filosofía Montessori.

Responde ÚNICAMENTE un objeto JSON con la siguiente estructura exacta:
{
  "suggestedTitle": "Título cautivador y SEO-friendly",
  "slug": "slug-url-amigable-en-${locale}",
  "suggestedExcerpt": "Resumen o lead cautivador de 2 o 3 oraciones",
  "content": "Texto completo en formato Markdown con subtítulos ##, listas, ejemplos prácticos y citas de María Montessori",
  "metaTitle": "Título SEO optimizado de 50-60 caracteres",
  "metaDescription": "Descripción SEO de 130-155 caracteres",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: textModel,
      messages: [
        { role: 'system', content: 'Eres un escritor editorial y guía Montessori experto. Responde exclusivamente en JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en API de IA (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const contentStr = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(contentStr);

  return {
    suggestedTitle: parsed.suggestedTitle || parsed.title || topic,
    slug: slugify(parsed.slug || parsed.suggestedTitle || parsed.title || topic),
    suggestedExcerpt: parsed.suggestedExcerpt || parsed.excerpt || '',
    content: parsed.content || '',
    metaTitle: parsed.metaTitle || parsed.suggestedTitle || parsed.title || topic,
    metaDescription: parsed.metaDescription || parsed.suggestedExcerpt || parsed.excerpt || '',
    suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : []
  };
}

/**
 * Generates a blog cover image using the AI image generation API
 */
export async function generateBlogCoverImage({ prompt, title, schoolId, prisma }) {
  const { apiKey, baseUrl, imageModel: configuredImageModel } = await getBlogAiConfig(schoolId, prisma);

  if (!apiKey) {
    throw new Error('No se encontro API Key de IA para generar imagenes.');
  }

  const imageModel = configuredImageModel || 'dall-e-3';
  const NO_TEXT_INSTRUCTION = 'IMPORTANT: Do NOT generate any text, words, letters, typography, banners, signs, posters, or watermarks. Pure visual scene and illustration only, completely text-free.';

  let imagePrompt = prompt
    ? `${prompt}. ${NO_TEXT_INSTRUCTION}`
    : `Warm, professional Montessori education editorial cover image inspired by the concept of: "${title}". Soft natural lighting, earthy warm tones, children learning freely in a prepared Montessori environment. High quality artistic photography. ${NO_TEXT_INSTRUCTION}`;

  const imagesUrl = `${baseUrl.replace(/\/+$/, '')}/images/generations`;

  const response = await fetch(imagesUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: imageModel,
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en API de generacion de imagen (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const imageData = data.data?.[0];

  // Extract image binary buffer
  let imageBuffer = null;
  if (imageData.b64_json) {
    imageBuffer = Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData.url) {
    const imgRes = await fetch(imageData.url);
    if (!imgRes.ok) {
      throw new Error(`Error al descargar la imagen de la IA (${imgRes.status})`);
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  }

  if (!imageBuffer) {
    throw new Error('No se pudo procesar la imagen devuelta por la IA');
  }

  // Upload directly to MinIO/S3 or storage under public/blog/
  const storage = await storageServiceFor(schoolId || 'default', prisma);
  const cleanFilename = `ai-cover-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.png`;
  const relativePath = `public/blog/${cleanFilename}`;

  const uploadResult = await storage.upload({
    relativePath,
    buffer: imageBuffer,
    mimeType: 'image/png'
  });

  return {
    success: true,
    url: uploadResult.url,
    relativePath: uploadResult.relativePath,
    revised_prompt: imageData.revised_prompt || prompt
  };
}

/**
 * Extracts all image URLs referenced in a markdown or HTML string
 */
export function extractImageUrls(content) {
  if (!content || typeof content !== 'string') return [];
  const urls = new Set();

  // Markdown image syntax: ![alt](url)
  const mdRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+|\/api\/storage\/[^\s\)]+|[^\s\)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(content)) !== null) {
    if (match[1]) urls.add(match[1].trim());
  }

  // HTML img syntax: <img src="url" ... />
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlRegex.exec(content)) !== null) {
    if (match[1]) urls.add(match[1].trim());
  }

  return Array.from(urls);
}

/**
 * Physically deletes a storage media URL if it belongs to local or MinIO storage
 */
export async function deleteStorageMediaUrl(url, schoolId = null, prisma = null) {
  if (!url || typeof url !== 'string') return;
  const relPath = extractStorageRelativePath(url);
  if (!relPath) return;

  try {
    const isGlobal = relPath.startsWith('public/');
    const storage = await storageServiceFor(isGlobal ? 'default' : (schoolId || 'default'), prisma);
    await storage.deleteFile(relPath);
  } catch (err) {
    console.warn(`[BLOG STORAGE DELETE ERROR] Could not delete file "${relPath}":`, err.message);
  }
}

/**
 * Clean up all media (cover and embedded images) for a blog post
 */
export async function cleanupBlogPostMedia(post, schoolId = null, prisma = null) {
  if (!post) return;

  // 1. Delete cover image
  if (post.coverImage) {
    await deleteStorageMediaUrl(post.coverImage, schoolId || post.schoolId, prisma);
  }

  // 2. Delete all embedded content images across all translations
  if (Array.isArray(post.translations)) {
    for (const t of post.translations) {
      if (t.content) {
        const imageUrls = extractImageUrls(t.content);
        for (const imgUrl of imageUrls) {
          await deleteStorageMediaUrl(imgUrl, schoolId || post.schoolId, prisma);
        }
      }
    }
  }
}
