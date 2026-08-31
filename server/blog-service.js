import './env.js';
import crypto from 'crypto';
import { storageServiceFor, extractStorageRelativePath } from './storage-service.js';
import { recordSchoolAiTokenUsage } from './feed-service.js';

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
 * Normalizes arrows in Mermaid diagrams from -> or → to ==>
 * Prevents rich-text / markdown sanitizers from breaking Mermaid syntax.
 */
export const sanitizeMermaidDiagramArrows = (content) => {
  if (!content || typeof content !== 'string') return '';

  return content.replace(/```(?:mermaid)([\s\S]*?)```/gi, (_match, mermaidCode) => {
    const sanitized = mermaidCode
      .replace(/→/g, '==>')
      .replace(/->\|([^|]+)\|/g, '==>|$1|')
      .replace(/(?<![-=])->(?![->])/g, '==>')
      .replace(/-->/g, '==>');

    return '```mermaid' + sanitized + '```';
  });
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
  const usage = data?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  if (schoolId) {
    await recordSchoolAiTokenUsage({
      schoolId,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      prisma
    });
  }

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
   - REGLA CRÍTICA PARA DIAGRAMAS MERMAID (\`\`\`mermaid ... \`\`\`):
     * Mantén intacta la sintaxis y palabras clave de Mermaid (\`flowchart TD\`, \`flowchart LR\`, \`graph TD\`, \`subgraph\`, \`end\`, \`stateDiagram-v2\`, \`mindmap\`, \`-->\`, \`--- \`, etc.) y los IDs de los nodos.
     * Traduce ÚNICAMENTE el texto legible dentro de las etiquetas.
     * TODAS las etiquetas traducidas de nodos deben permanecer estrictamente entre comillas dobles (ej. \`nodeId["Texto traducido (con detalles)"]\`) para no romper la sintaxis por puntuación o caracteres especiales.
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
        { role: 'system', content: 'Eres un traductor profesional experto en localización editorial multilingüe, SEO y OpenGraph para educación Montessori. Responde exclusivamente en JSON válido.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en API de IA (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const usage = data?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  if (schoolId) {
    await recordSchoolAiTokenUsage({
      schoolId,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      prisma
    });
  }

  const contentStr = data.choices?.[0]?.message?.content || '{}';
  
  let parsed = {};
  try {
    parsed = JSON.parse(contentStr);
  } catch (err) {
    // Robust fallback regex extraction if LLM emitted unescaped quotes or malformed JSON
    const extractStringField = (key) => {
      const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
      const match = contentStr.match(regex);
      if (match) {
        try {
          return JSON.parse(`"${match[1]}"`);
        } catch {
          return match[1];
        }
      }
      return '';
    };

    let extractedContent = '';
    const contentStart = contentStr.indexOf('"content"');
    if (contentStart !== -1) {
      const firstQuote = contentStr.indexOf('"', contentStart + 9);
      if (firstQuote !== -1) {
        const nextFieldMatch = contentStr.slice(firstQuote + 1).search(/"(?:metaTitle|metaDescription|slug|title|excerpt)"\s*:/);
        if (nextFieldMatch !== -1) {
          const sliceUntilNext = contentStr.slice(firstQuote + 1, firstQuote + 1 + nextFieldMatch);
          const lastQuote = sliceUntilNext.lastIndexOf('"');
          extractedContent = (lastQuote !== -1 ? sliceUntilNext.slice(0, lastQuote) : sliceUntilNext)
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        } else {
          const lastQuote = contentStr.lastIndexOf('"');
          extractedContent = (lastQuote > firstQuote ? contentStr.slice(firstQuote + 1, lastQuote) : contentStr.slice(firstQuote + 1))
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
      }
    }

    parsed = {
      title: extractStringField('title'),
      slug: extractStringField('slug'),
      excerpt: extractStringField('excerpt'),
      content: extractedContent || content,
      metaTitle: extractStringField('metaTitle'),
      metaDescription: extractStringField('metaDescription')
    };
  }

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

Escribe un contenido cautivador, fundamentado en el respeto al niño, la autonomía y la filosofía Montessori. Si incluyes diagramas Mermaid (\`\`\`mermaid ... \`\`\`), encierra obligatoriamente todas las etiquetas de nodos entre comillas dobles (ej: \`nodeId["Texto descriptivo (0-3 años)"]\`) e identificadores simples sin espacios para evitar errores de renderizado.

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
  const usage = data?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  if (schoolId) {
    await recordSchoolAiTokenUsage({
      schoolId,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      prisma
    });
  }

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

/**
 * Evaluates article content against existing categories (or requested categories)
 * and resolves or creates multiple appropriate pedagogical categories (1 to 3).
 */
export async function resolveOrCreateCategoriesForBlog({ title, content, requestedCategories = [], schoolId = null, prisma }) {
  if (!prisma) return [];

  // 1. Fetch all existing categories for this scope
  const existingCategories = await prisma.blogCategory.findMany({
    where: { schoolId: schoolId || null }
  });

  const resolved = [];

  // 2. If explicit requestedCategories array provided, resolve each
  if (Array.isArray(requestedCategories) && requestedCategories.length > 0) {
    for (const reqCat of requestedCategories) {
      if (!reqCat || typeof reqCat !== 'string') continue;
      const targetSlug = slugify(reqCat);
      const found = existingCategories.find(c => c.slug === targetSlug || c.name.toLowerCase() === reqCat.trim().toLowerCase());
      if (found) {
        if (!resolved.some(r => r.id === found.id)) resolved.push(found);
      } else {
        const created = await prisma.blogCategory.create({
          data: {
            schoolId: schoolId || null,
            name: reqCat.trim(),
            slug: targetSlug || 'general',
            description: `Artículos y recursos sobre ${reqCat.trim()}`
          }
        });
        existingCategories.push(created);
        resolved.push(created);
      }
    }
    if (resolved.length > 0) return resolved;
  }

  // 3. Ask AI to classify into 1-3 relevant categories
  try {
    const { apiKey, baseUrl, textModel } = await getBlogAiConfig(schoolId, prisma);
    if (apiKey) {
      const existingListStr = existingCategories.map(c => `- ID: "${c.id}", Nombre: "${c.name}", Slug: "${c.slug}", Desc: "${c.description || ''}"`).join('\n');

      const prompt = `Analiza el siguiente artículo educativo y determina entre 1 y 3 categorías pedagógicas relevantes (un artículo puede pertenecer a múltiples categorías, ej: "Pedagogía Montessori" + "Neurociencia y Aprendizaje" + "Ambiente Preparado").
Título: "${title}"
Contenido (extracto):
${(content || '').slice(0, 2500)}

Categorías existentes en la base de datos:
${existingListStr || '(Ninguna categoría previa)'}

Instrucciones:
1. Para cada categoría identificada (1 a 3):
   - Si encaja en una existente, incluye su "existingCategoryId".
   - Si es una categoría nueva valiosa, propón "categoryName", "categorySlug" y "categoryDescription".

Responde ÚNICAMENTE en JSON con este formato exacto:
{
  "categories": [
    {
      "existingCategoryId": "id-de-la-categoria-o-null",
      "categoryName": "Nombre de la categoría",
      "categorySlug": "slug-amigable",
      "categoryDescription": "Breve descripción pedagógica (1 frase)"
    }
  ]
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
            { role: 'system', content: 'Eres un taxonomista editorial y pedagogo Montessori experto. Responde exclusivamente en JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        const rawCats = Array.isArray(parsed.categories) ? parsed.categories : (parsed.existingCategoryId || parsed.categoryName ? [parsed] : []);

        for (const item of rawCats) {
          if (item.existingCategoryId && item.existingCategoryId !== 'null' && item.existingCategoryId !== 'id-de-la-categoria-o-null') {
            const matched = existingCategories.find(c => c.id === item.existingCategoryId);
            if (matched && !resolved.some(r => r.id === matched.id)) {
              resolved.push(matched);
            }
          } else if (item.categoryName && item.categoryName !== 'null') {
            const cleanSlug = slugify(item.categorySlug || item.categoryName);
            let catObj = existingCategories.find(c => c.slug === cleanSlug);
            if (!catObj) {
              catObj = await prisma.blogCategory.create({
                data: {
                  schoolId: schoolId || null,
                  name: item.categoryName.trim(),
                  slug: cleanSlug,
                  description: item.categoryDescription || `Artículos sobre ${item.categoryName.trim()}`
                }
              });
              existingCategories.push(catObj);
            }
            if (catObj && !resolved.some(r => r.id === catObj.id)) {
              resolved.push(catObj);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Multiple categories AI resolution warning:', err.message);
  }

  // Fallback if none resolved
  if (resolved.length === 0) {
    let fallback = existingCategories.find(c => c.slug === 'pedagogia-montessori') || existingCategories[0];
    if (!fallback) {
      fallback = await prisma.blogCategory.create({
        data: {
          schoolId: schoolId || null,
          name: 'Pedagogía Montessori',
          slug: 'pedagogia-montessori',
          description: 'Fundamentos, ambiente preparado y rol del adulto.'
        }
      });
    }
    resolved.push(fallback);
  }

  return resolved;
}

/**
 * Single category resolution for backwards compatibility
 */
export async function resolveOrCreateCategoryForBlog({ title, content, requestedCategory, schoolId = null, prisma }) {
  const cats = await resolveOrCreateCategoriesForBlog({
    title,
    content,
    requestedCategories: requestedCategory ? [requestedCategory] : [],
    schoolId,
    prisma
  });
  return cats[0] || null;
}

/**
 * Detect client language from Accept-Language, query or headers
 */
export function resolveClientLocale(req) {
  const qLang = String(req?.query?.lang || req?.query?.locale || req?.headers?.['x-locale'] || '').toLowerCase().trim();
  if (['es', 'en', 'fr', 'pt', 'de', 'ru'].includes(qLang)) return qLang;

  const accept = String(req?.headers?.['accept-language'] || '').toLowerCase();
  if (accept.startsWith('pt')) return 'pt';
  if (accept.startsWith('fr')) return 'fr';
  if (accept.startsWith('de')) return 'de';
  if (accept.startsWith('ru')) return 'ru';
  if (accept.startsWith('en')) return 'en';
  if (accept.startsWith('es')) return 'es';

  return 'es';
}

/**
 * Check if the incoming request is asking for Markdown or coming from an AI crawler
 */
export function isMarkdownOrAiRequest(req) {
  if (!req) return false;
  const path = req.path || '';
  if (path.endsWith('.md') || path.endsWith('/llms.txt') || path === '/llms.txt') return true;

  const accept = String(req.headers?.accept || '').toLowerCase();
  if (accept.includes('text/markdown') || accept.includes('text/x-markdown')) return true;

  const userAgent = String(req.headers?.['user-agent'] || '').toLowerCase();
  const aiBots = [
    'gptbot', 'chatgpt-user', 'claudebot', 'anthropic-ai', 'perplexitybot', 
    'google-extended', 'amazonbot', 'facebookbot', 'bytespider', 'cohere-ai'
  ];
  return aiBots.some(bot => userAgent.includes(bot));
}

/**
 * Helper to construct clean URLs for:
 * 1. SaaS Blog:
 *    - Index: https://blog.montessorinexus.com (and /index.md)
 *    - Article: https://blog.montessorinexus.com/:slug (and /:slug.md)
 * 2. School Blog (each school has its own custom domain or subdomain):
 *    - e.g. https://ceiba.montessorinexus.com/blog (and /blog/index.md)
 *    - e.g. https://kapili.com/blog (and /blog/index.md)
 *    - Article: https://ceiba.montessorinexus.com/blog/:slug (and /blog/:slug.md)
 *    - Article: https://kapili.com/blog/:slug (and /blog/:slug.md)
 */
export function resolveBlogUrls({ school, slug, baseUrl = 'https://montessorinexus.com', isSaaS = true }) {
  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

  if (isSaaS || !school) {
    const saasHost = isLocal ? baseUrl : 'https://blog.montessorinexus.com';
    const blogIndex = saasHost;
    const blogIndexMd = `${saasHost}/index.md`;
    const postUrl = slug ? `${saasHost}/${slug}` : saasHost;
    const postMdUrl = slug ? `${saasHost}/${slug}.md` : blogIndexMd;
    return { 
      blogIndex, 
      blogIndexMd, 
      postUrl, 
      postMdUrl, 
      platformHome: isLocal ? baseUrl : 'https://montessorinexus.com' 
    };
  }

  // School domain resolution: check custom_domain first, then subdomain, then school.slug
  let schoolHost = '';
  const customDomain = school.siteSettings?.find(s => s.key === 'custom_domain')?.value || school.customDomain;
  const subdomain = school.siteSettings?.find(s => s.key === 'subdomain')?.value || school.slug;

  if (isLocal) {
    schoolHost = baseUrl;
  } else if (customDomain && String(customDomain).trim()) {
    const cleanDomain = String(customDomain).trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    schoolHost = `https://${cleanDomain}`;
  } else if (subdomain && String(subdomain).trim()) {
    schoolHost = `https://${String(subdomain).trim()}.montessorinexus.com`;
  } else if (school.slug) {
    schoolHost = `https://${school.slug}.montessorinexus.com`;
  } else {
    schoolHost = baseUrl;
  }

  const blogIndex = `${schoolHost}/blog`;
  const blogIndexMd = `${schoolHost}/blog/index.md`;
  const postUrl = slug ? `${schoolHost}/blog/${slug}` : blogIndex;
  const postMdUrl = slug ? `${schoolHost}/blog/${slug}.md` : blogIndexMd;
  return { 
    blogIndex, 
    blogIndexMd, 
    postUrl, 
    postMdUrl, 
    platformHome: schoolHost 
  };
}

/**
 * Generate localized index.md / llms.txt Markdown for blog index
 */
export function generateBlogIndexMarkdown({ school, posts, locale = 'es', baseUrl = 'https://montessorinexus.com', isSaaS = true }) {
  const brandName = isSaaS ? 'MontessoriNexus' : (school?.name || 'Comunidad Montessori');
  const { blogIndex, blogIndexMd, platformHome } = resolveBlogUrls({ school, isSaaS, baseUrl });

  const headings = {
    es: {
      title: `Blog Oficial • ${brandName}`,
      desc: 'Publicaciones pedagógicas, reflexiones y novedades sobre el método Montessori y desarrollo infantil.',
      published: 'Artículos Publicados',
      readTime: 'min de lectura',
      readMore: 'Leer artículo',
      aboutTitle: `Sobre ${brandName}`,
      aboutText: isSaaS
        ? 'MontessoriNexus es el ecosistema integral de software para la gestión escolar, bitácora pedagógica y admisiones en colegios Montessori.'
        : `Comunidad educativa dedicada a la formación integral de niños y jóvenes bajo la auténtica pedagogía Montessori en ${brandName}.`,
      visitSite: 'Visitar sitio web oficial',
      ctaText: isSaaS ? 'Solicitar una demostración para tu colegio' : 'Solicitar información o agendar visita guiada'
    },
    en: {
      title: `Official Blog • ${brandName}`,
      desc: 'Pedagogical insights, articles, and updates on authentic Montessori education and child development.',
      published: 'Published Articles',
      readTime: 'min read',
      readMore: 'Read article',
      aboutTitle: `About ${brandName}`,
      aboutText: isSaaS
        ? 'MontessoriNexus is the all-in-one management, observation log, and admissions software for Montessori schools.'
        : `Educational community dedicated to authentic Montessori pedagogy fostering independence and concentration at ${brandName}.`,
      visitSite: 'Visit official website',
      ctaText: isSaaS ? 'Request a personalized demo for your school' : 'Request information or book a campus tour'
    },
    pt: {
      title: `Blog Oficial • ${brandName}`,
      desc: 'Artigos pedagógicos, reflexões e novidades sobre o método Montessori e desenvolvimento infantil.',
      published: 'Artigos Publicados',
      readTime: 'min de leitura',
      readMore: 'Ler artigo',
      aboutTitle: `Sobre ${brandName}`,
      aboutText: isSaaS
        ? 'MontessoriNexus é a plataforma completa para gestão, observação pedagógica e matrículas em escolas Montessori.'
        : `Comunidade educativa dedicada à pedagogia Montessori autêntica em ${brandName}.`,
      visitSite: 'Visitar site oficial',
      ctaText: isSaaS ? 'Solicitar demonstração para sua escola' : 'Solicitar informações ou agendar visita guiada'
    },
    fr: {
      title: `Blog Officiel • ${brandName}`,
      desc: 'Articles pédagogiques et actualités sur la méthode Montessori et le développement de l\'enfant.',
      published: 'Articles Publiés',
      readTime: 'min de lecture',
      readMore: 'Lire l\'article',
      aboutTitle: `À propos de ${brandName}`,
      aboutText: isSaaS
        ? 'MontessoriNexus est le logiciel tout-en-un pour la gestion, le suivi pédagogique et les admissions Montessori.'
        : `Communauté éducative dédiée à la pédagogie Montessori authentique à ${brandName}.`,
      visitSite: 'Visiter le site officiel',
      ctaText: isSaaS ? 'Demander une démo pour votre école' : 'Demander des informations ou réserver une visite'
    },
    de: {
      title: `Offizieller Blog • ${brandName}`,
      desc: 'Pädagogische Artikel und Einblicke in die Montessori-Pädagogik und kindliche Entwicklung.',
      published: 'Veröffentlichte Artikel',
      readTime: 'Min. Lesezeit',
      readMore: 'Artikel lesen',
      aboutTitle: `Über ${brandName}`,
      aboutText: isSaaS
        ? 'MontessoriNexus ist die All-in-One Software für Schulverwaltung und Montessori-Beobachtungen.'
        : `Bildungsgemeinschaft für authentische Montessori-Pädagogik bei ${brandName}.`,
      visitSite: 'Offizielle Website besuchen',
      ctaText: isSaaS ? 'Demo für Ihre Schule anfordern' : 'Informationen anfordern oder Führung buchen'
    },
    ru: {
      title: `Официальный блог • ${brandName}`,
      desc: 'Педагогические статьи и новости о методике Монтессори и развитии детей.',
      published: 'Опубликованные статьи',
      readTime: 'мин чтения',
      readMore: 'Читать статью',
      aboutTitle: `О ${brandName}`,
      aboutText: isSaaS
        ? 'MontessoriNexus — комплексная платформа для управления школами Монтессори и наблюдений.'
        : `Образовательное сообщество аутентичной педагогики Монтессори в ${brandName}.`,
      visitSite: 'Посетить официальный сайт',
      ctaText: isSaaS ? 'Запросить демоверсию для вашей школы' : 'Запросить информацию или записаться на экскурсию'
    }
  };

  const h = headings[locale] || headings.es;

  let md = `# ${h.title}\n\n`;
  md += `> ${h.desc}\n\n`;
  md += `**URL:** [${blogIndex}](${blogIndex})\n\n`;
  md += `---\n\n`;
  md += `## ${h.published}\n\n`;

  if (!posts || posts.length === 0) {
    md += `*No hay artículos disponibles en este momento.*\n\n`;
  } else {
    posts.forEach((p, idx) => {
      const { postUrl, postMdUrl } = resolveBlogUrls({ school, slug: p.slug, isSaaS, baseUrl });
      const dateStr = p.publishedAt ? new Date(p.publishedAt).toISOString().split('T')[0] : '';
      const cats = p.categories && p.categories.length > 0 ? p.categories.join(', ') : 'Montessori';

      md += `### ${idx + 1}. [${p.title}](${postMdUrl})\n\n`;
      if (p.excerpt) {
        md += `> ${p.excerpt}\n\n`;
      }
      if (p.coverImage) {
        md += `![${p.title}](${p.coverImage})\n\n`;
      }
      md += `- 🏷️ **Categoría:** ${cats}\n`;
      md += `- 📅 **Fecha:** ${dateStr} • ⏱️ **Lectura:** ${p.readingTimeMinutes || 3} ${h.readTime} • ✍️ **Autor:** ${p.author?.fullName || 'Equipo Pedagógico'}\n`;
      md += `- 🤖 **Artículo en Markdown (.md):** [${postMdUrl}](${postMdUrl})\n`;
      md += `- 🌐 **Versión Web (HTML):** [${postUrl}](${postUrl})\n\n`;
      md += `---\n\n`;
    });
  }

  md += `## 🚀 ${h.aboutTitle}\n\n`;
  md += `${h.aboutText}\n\n`;
  md += `- 🌐 **Web:** [${platformHome}](${platformHome})\n`;
  md += `- 📩 **Acción:** [${h.ctaText}](${isSaaS ? 'https://montessorinexus.com/#contacto' : `${platformHome}#contacto`})\n`;

  return md;
}

/**
 * Generate pristine markdown for a single blog post with YAML metadata and conversion footer
 */
export function generateBlogPostMarkdown({ post, translation, school, baseUrl = 'https://montessorinexus.com', isSaaS = true }) {
  const brandName = isSaaS ? 'MontessoriNexus' : (school?.name || 'Comunidad Montessori');
  const { blogIndex, postUrl, postMdUrl, platformHome } = resolveBlogUrls({ school, slug: translation.slug, isSaaS, baseUrl });
  const ctaUrl = isSaaS ? 'https://montessorinexus.com/#contacto' : `${platformHome}#contacto`;
  const dateStr = (post.publishedAt || post.createdAt).toISOString();
  const authorName = post.customAuthorName || post.author?.fullName || 'Equipo Pedagógico';
  const cats = post.categories?.map(c => c.category?.name).filter(Boolean).join(', ') || 'Pedagogía Montessori';

  let md = `---
title: "${(translation.title || '').replace(/"/g, '\\"')}"
slug: "${translation.slug}"
description: "${(translation.excerpt || '').replace(/"/g, '\\"')}"
published_at: "${dateStr}"
author: "${authorName.replace(/"/g, '\\"')}"
reading_time: "${post.readingTimeMinutes || 3} min"
canonical_url: "${postUrl}"
markdown_url: "${postMdUrl}"
locale: "${translation.locale || 'es'}"
category: "${cats}"
---

# ${translation.title}

> ${translation.excerpt || ''}

${post.coverImage ? `![${post.coverImageAlt || translation.title}](${post.coverImage})\n\n` : ''}
${translation.content}

---

## 💡 Sobre ${brandName}

${isSaaS
  ? `**MontessoriNexus** es la plataforma digital de referencia para escuelas Montessori: gestión integral de aula, bitácoras de observación pedagógica estructuradas con IA alineadas a la filosofía de María Montessori y sistema de admisiones.`
  : `**${brandName}** ofrece educación Montessori auténtica guiada por docentes certificados internacionalmente, con ambientes preparados diseñados para el desarrollo natural del niño.`}

- 🌐 **Sitio Web:** [${platformHome}](${platformHome})
- 📖 **Explorar más lecturas:** [Blog Principal](${blogIndex})
- 🚀 **Contacto / Admisiones:** [Solicitar información o demostración](${ctaUrl})
`;

  return md;
}


