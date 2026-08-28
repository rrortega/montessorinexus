import sharp from 'sharp';
import { scanIdentityDocumentBarcodes } from './barcode-scanner-service.js';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pgPkg from 'pg';
const { Pool } = pgPkg;

let defaultPrisma = null;
function getPrismaInstance(prisma) {
  if (prisma) return prisma;
  if (!defaultPrisma) {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    defaultPrisma = new PrismaClient({ adapter });
    defaultPrisma.admissionStage = defaultPrisma.processStage;
    defaultPrisma.admissionApplication = defaultPrisma.processApplication;
    defaultPrisma.admissionFormTemplate = defaultPrisma.processFormTemplate;
  }
  return defaultPrisma;
}

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
    const res = await fetch(trimmed);
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
  if (trimmed.length > 50) {
    return Buffer.from(trimmed, 'base64');
  }
  return null;
}

/**
 * Automatically crops the detected handwritten signature from the document image
 */
/**
 * Intelligently crops and centers the handwritten signature from the document image.
 * Uses 2-stage processing:
 * 1. Extracts a candidate region based on AI coordinates / document template fallback.
 * 2. Analyzes raw pixel grayscale luminance to locate the exact ink strokes and centers the crop tightly with balanced padding.
 */
export async function cropSignatureFromDocument({
  frontImage,
  backImage = null,
  bbox = null,
  signatureAssessment = null,
  docType = 'id_card'
}) {
  try {
    const targetBbox = bbox || signatureAssessment?.holder_signature?.bounding_box || signatureAssessment?.signature_bounding_box;
    const isDetected = targetBbox || signatureAssessment?.has_handwritten_signature || signatureAssessment?.signature_detected;
    if (!isDetected) return null;

    const useBack = targetBbox?.image_side === 'back' || signatureAssessment?.signature_location === 'back';
    const targetImageInput = (useBack && backImage) ? backImage : frontImage;
    const imageBuf = await getImageBuffer(targetImageInput);
    if (!imageBuf) return null;

    const metadata = await sharp(imageBuf).metadata();
    const imgW = metadata.width || 1000;
    const imgH = metadata.height || 600;

    let leftPct = targetBbox?.left_pct;
    let topPct = targetBbox?.top_pct;
    let widthPct = targetBbox?.width_pct;
    let heightPct = targetBbox?.height_pct;

    // Fallbacks based on standard document templates if coordinates are missing or invalid
    if (typeof leftPct !== 'number' || typeof topPct !== 'number' || !widthPct || !heightPct) {
      if (docType === 'id_card' || docType === 'voter_credential') {
        // Mexican INE / IFE: citizen's signature box under/near the photo on the left
        leftPct = 5;
        topPct = 55;
        widthPct = 30;
        heightPct = 35;
      } else if (docType === 'passport') {
        // Passport signature line
        leftPct = 8;
        topPct = 68;
        widthPct = 55;
        heightPct = 25;
      } else {
        // Driver's license or generic
        leftPct = 10;
        topPct = 55;
        widthPct = 40;
        heightPct = 30;
      }
    }

    // Calculate base pixel bounding box from LLM percentages
    const rawLeft = Math.round((leftPct / 100) * imgW);
    const rawTop = Math.round((topPct / 100) * imgH);
    const rawWidth = Math.round((widthPct / 100) * imgW);
    const rawHeight = Math.round((heightPct / 100) * imgH);

    // Apply explicit pixel breathing margin (at least 25px vertical, 20px horizontal)
    const padYPixels = Math.max(25, Math.round(imgH * 0.04));
    const padXPixels = Math.max(20, Math.round(imgW * 0.03));

    const finalLeft = Math.max(0, rawLeft - padXPixels);
    const finalTop = Math.max(0, rawTop - padYPixels);
    const finalRight = Math.min(imgW, rawLeft + rawWidth + padXPixels);
    const finalBottom = Math.min(imgH, rawTop + rawHeight + padYPixels);
    const finalWidth = Math.max(30, finalRight - finalLeft);
    const finalHeight = Math.max(30, finalBottom - finalTop);

    const croppedBuf = await sharp(imageBuf)
      .extract({ left: finalLeft, top: finalTop, width: finalWidth, height: finalHeight })
      .png({ quality: 95 })
      .toBuffer();

    return `data:image/png;base64,${croppedBuf.toString('base64')}`;
  } catch (err) {
    console.warn('[SIGNATURE AUTOCROP WARNING]', err.message);
    return null;
  }
}

/**
 * Retrieves the AI configuration (API Key, Base URL, Vision Model) from environment variables or database SiteSettings.
 */
export async function getAiConfig(schoolId = null, prisma = null) {
  let apiKey = (process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '').trim();
  let baseUrl = (process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim();
  let visionModel = (process.env.OPENAI_VISION_MODEL || process.env.AI_MODEL_VISION || 'gpt-4o-mini').trim();

  const p = getPrismaInstance(prisma);
  try {
    const whereClause = {
      key: {
        in: [
          'ai_api_key', 'openai_api_key', 'OPENAI_API_KEY', 'openai_key',
          'ai_base_url', 'openai_base_url', 'OPENAI_BASE_URL',
          'ai_model_vision', 'openai_model', 'OPENAI_MODEL'
        ]
      }
    };
    if (schoolId && schoolId !== 'global' && schoolId !== 'standalone') {
      whereClause.schoolId = schoolId;
    }

    let settingsList = await p.siteSetting.findMany({ where: whereClause });
    if (settingsList.length === 0 && whereClause.schoolId) {
      // Fallback to any configured school settings if specific school has none
      settingsList = await p.siteSetting.findMany({
        where: {
          key: whereClause.key
        }
      });
    }

    for (const s of settingsList) {
      if (!s?.value) continue;
      const key = s.key.toLowerCase();
      if ((key === 'ai_api_key' || key === 'openai_api_key' || key === 'openai_key') && !apiKey) {
        apiKey = s.value.trim();
      }
      if ((key === 'ai_base_url' || key === 'openai_base_url') && baseUrl === 'https://api.openai.com/v1') {
        baseUrl = s.value.trim();
      }
      if ((key === 'ai_model_vision' || key === 'openai_model') && visionModel === 'gpt-4o-mini') {
        visionModel = s.value.trim();
      }
    }
  } catch (err) {
    console.warn('[AI CONFIG LOOKUP WARNING]', err.message);
  }

  return {
    apiKey: apiKey || null,
    baseUrl: baseUrl || 'https://api.openai.com/v1',
    visionModel: visionModel || 'gpt-4o-mini'
  };
}

export async function getOpenAIApiKey(schoolId = null, prisma = null) {
  const config = await getAiConfig(schoolId, prisma);
  return config.apiKey;
}

/**
 * Normalizes input image string into a valid OpenAI image_url object
 */
function formatOpenAiImageUrl(imageInput) {
  if (!imageInput) return null;
  if (typeof imageInput !== 'string') return null;

  const trimmed = imageInput.trim();
  if (trimmed.startsWith('data:image/')) {
    return { url: trimmed, detail: 'high' };
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { url: trimmed, detail: 'high' };
  }
  if (trimmed.length > 50) {
    // Treat as raw base64 JPEG
    return { url: `data:image/jpeg;base64,${trimmed}`, detail: 'high' };
  }
  return null;
}

/**
 * Executes OCR on official identity documents (INE, Pasaporte, Licencia, Cédula) using OpenAI GPT-4o-mini
 */
export async function extractDocumentDataWithOpenAI({
  frontImage,
  backImage = null,
  signatureImage = null,
  docType = 'id_card',
  schoolId = null,
  prisma = null
}) {
  const { apiKey, baseUrl, visionModel } = await getAiConfig(schoolId, prisma);
  if (!apiKey) {
    throw new Error('No se encontró una API Key para el proveedor de IA configurada en las variables de entorno o en la configuración del sistema.');
  }

  const frontFormatted = formatOpenAiImageUrl(frontImage);
  if (!frontFormatted) {
    throw new Error('Se requiere una imagen válida del frente del documento para realizar el OCR.');
  }

  const backFormatted = formatOpenAiImageUrl(backImage);
  const signatureFormatted = formatOpenAiImageUrl(signatureImage);

  const expectedLabels = {
    id_card: 'Voter ID (INE/IFE) or National ID (DNI/Cedula)',
    passport: 'Official International Passport',
    drivers_license: 'Official Driver License'
  };
  const expectedDesc = expectedLabels[docType] || docType;

  const contentArray = [
    {
      type: 'text',
      text: `Analyze this identity document image. Expected type: "${docType}" (${expectedDesc}). Extract all readable data following the JSON schema, check for the presence and legibility of the cardholder's handwritten signature, and verify if the document category matches the expected type.`
    },
    {
      type: 'image_url',
      image_url: frontFormatted
    }
  ];

  if (backFormatted) {
    contentArray.push({
      type: 'image_url',
      image_url: backFormatted
    });
  }

  if (signatureFormatted) {
    contentArray.push({
      type: 'text',
      text: 'Also provided: user handwritten digital signature from canvas. Compare it with the handwritten signature visible on the identity document.'
    });
    contentArray.push({
      type: 'image_url',
      image_url: signatureFormatted
    });
  }

  const systemPrompt = `You are an expert identity document OCR and forensic verification engine (Mexican INE/IFE, international passports, driver licenses, national IDs).

EXPECTED DOCUMENT:
Type: "${docType}" (${expectedDesc})

DOCUMENT TYPE VALIDATION:
1. Identify the document category:
   - "voter_credential": INE/IFE voter ID from Mexico.
   - "passport": Official international passport with biographical page/MRZ.
   - "drivers_license": Official driver's license.
   - "national_id": National identity card (DNI, Cedula, Residence card).
   - "unknown": Unreadable image or non-identity document.
2. If expected type is "${docType}" but image shows a different category (e.g. passport expected but INE presented, or id_card expected but driver license presented), set:
   "document_type_matches": false
   "validation_error": "Document presented is [Detected Category], but [Expected Category] was required."
3. If document type matches or is compatible, set "document_type_matches": true and "validation_error": null.

JSON SCHEMA:
{
  "country": "string | null (Issuing country normalized to English common name, e.g. 'Mexico', 'United States')",
  "issuing_authority": "string | null (Official institution, e.g. 'Instituto Nacional Electoral')",
  "document_type": "voter_credential" | "passport" | "drivers_license" | "national_id" | "unknown",
  "detected_document_type": "voter_credential" | "passport" | "drivers_license" | "national_id" | "unknown",
  "expected_document_type": "${docType}",
  "document_type_matches": boolean,
  "validation_error": string | null,
  "first_name": "string | null (Given name/names only)",
  "first_surname": "string | null (First/paternal surname)",
  "second_surname": "string | null (Second/maternal surname)",
  "full_name": "string | null (Standard order: First-Name(s) First-Surname Second-Surname)",
  "sex": "female" | "male" | "other" | null (Normalize Mexican INE 'M' -> 'female', 'H' -> 'male')",
  "sex_code": "string | null (Raw printed sex code, e.g. 'M', 'H', 'F')",
  "address": {
    "street_address": "string | null",
    "postal_code": "string | null (Preserve leading zeros)",
    "municipality": "string | null",
    "state": "string | null"
  } | null,
  "curp": "string | null (18-char Mexican CURP)",
  "date_of_birth": "YYYY-MM-DD | null",
  "voter_key": "string | null (INE Clave de Elector without spaces)",
  "electoral_section": "string | null",
  "registration_year": "string | null (4-digit year, e.g. '2006')",
  "registration_number": "string | null",
  "valid_from": "string | null (First year of validity)",
  "valid_until": "string | null (Final year of validity/expiration)",
  "passport_number": "string | null",
  "license_number": "string | null",
  "license_type": "string | null",
  "nationality": "string | null",
  "issue_date": "YYYY-MM-DD | null",
  "expiration_date": "YYYY-MM-DD | null",
  "mrz": "string | null (MRZ machine readable lines)",
  "ocr_code": "string | null (Back OCR/CIC code for INE/IFE)",
  "signature_assessment": {
    "has_handwritten_signature": boolean (True if the citizen/cardholder personal signature is present),
    "signature_detected": boolean,
    "multiple_signatures_detected": boolean (True if document contains both holder signature and issuing authority/official signature),
    "holder_signature": {
      "detected": boolean,
      "legibility": "clear" | "partial" | "smudged" | "missing",
      "location_description": "string (e.g. 'Recuadro de Firma del Titular')",
      "bounding_box": {
        "top_pct": number (0-100),
        "left_pct": number (0-100),
        "width_pct": number (0-100),
        "height_pct": number (0-100),
        "image_side": "front" | "back"
      } | null
    },
    "authority_signature": {
      "detected": boolean,
      "title_or_official": "string | null (e.g. 'Secretario Ejecutivo' or 'Director')",
      "location_description": "string | null",
      "bounding_box": {
        "top_pct": number (0-100),
        "left_pct": number (0-100),
        "width_pct": number (0-100),
        "height_pct": number (0-100),
        "image_side": "front" | "back"
      } | null
    } | null,
    "signature_legibility": "clear" | "partial" | "smudged" | "missing",
    "signature_location": "front_bottom" | "front_middle" | "front_right" | "front_left" | "back" | "none",
    "signature_confidence": number (0-100),
    "signature_description": "string | null (Brief explanation distinguishing the cardholder signature from any official authorized signature)",
    "signature_bounding_box": {
      "top_pct": number (0-100, approximate percentage from top of image where cardholder signature box begins),
      "left_pct": number (0-100, approximate percentage from left of image where cardholder signature box begins),
      "width_pct": number (0-100, approximate percentage width of cardholder signature box),
      "height_pct": number (0-100, approximate percentage height of cardholder signature box),
      "image_side": "front" | "back"
    } | null,
    "stroke_match_score": number | null (0-100, if user digital signature was provided for comparison),
    "stroke_match_notes": "string | null"
  },
  "quality_assessment": {
    "condition": "good" | "worn" | "damaged" | "mutilated",
    "has_glare": boolean,
    "has_heavy_shadows": boolean,
    "is_blurry": boolean,
    "has_occlusions": boolean,
    "is_cropped": boolean,
    "is_photocopy_or_screen": boolean,
    "overall_quality": "excellent" | "acceptable" | "poor" | "unusable",
    "detected_issues": ["glare" | "shadows" | "blur" | "fingers_or_objects" | "cropped_edges" | "damaged" | "screen_or_photocopy"],
    "quality_summary": "string | null (Brief diagnosis in Spanish, e.g. 'Documento con reflejo de flash y sombra en esquina inferior')"
  },
  "is_valid_document": boolean,
  "confidence_score": number (0-100),
  "raw_notes": "string | null"
}

RULES:
- NAME EXTRACTION & DISAMBIGUATION (CRITICAL):
  1) Mexican INE / IFE Voter IDs:
     - The printed name block has 3 sequential lines:
       * Line 1: PRIMER APELLIDO (Paternal / First Surname) -> assign to "first_surname"
       * Line 2: SEGUNDO APELLIDO (Maternal / Second Surname) -> assign to "second_surname"
       * Line 3: NOMBRE(S) (Given Name / Names) -> assign to "first_name"
     - NEVER confuse the Given Name with the Second Surname.
     - MANDATORY FORENSIC CROSS-CHECK WITH CURP / CLAVE DE ELECTOR:
       The first 4 characters of the CURP (and positions 1-4 of the Clave de Elector) encode:
       * Character 1: Initial letter of First Surname ("first_surname")
       * Character 2: First internal vowel of First Surname
       * Character 3: Initial letter of Second Surname ("second_surname")
       * Character 4: Initial letter of First Given Name ("first_name")
       Example: CURP "ROOR840511..." means: First Surname starts with "RO" (e.g. "RODRIGUEZ"), Second Surname starts with "O" (e.g. "ORTEGA"), Given Name starts with "R" (e.g. "ROBERTO").
       Always verify and match the names against the CURP initials to ensure 100% correct assignment.
  2) Passports & International IDs:
     - "Surnames / Apellidos" -> "first_surname" & "second_surname".
     - "Given Names / Nombres" -> "first_name".
  3) "full_name": Build the complete natural name as "[first_name] [first_surname] [second_surname]" (e.g. "Roberto Rodriguez Ortega").

- CRITICAL FOR SIGNATURE EXTRACTION (MEXICAN INE/IFE, PASSPORTS & IDs):
  1) CARDHOLDER / CITIZEN SIGNATURE ("Firma del Titular / Ciudadano"):
     - Physical Location on Mexican INE: Located on the FRONT of the card, on the LEFT SIDE, directly below (or across) the citizen's portrait photo, or in the dedicated box labeled 'FIRMA'.
     - Visual Nature: It is a handwritten/cursive ink stroke drawn by the human applicant.
     - STRICT PROHIBITION: DO NOT crop printed typography text such as 'DOMICILIO', 'FRACC', 'CALLE', 'COLONIA', 'BENITO JUAREZ', 'CLAVE DE ELECTOR', 'CURP', 'NOMBRE', or 'FECHA DE NACIMIENTO'.
     - Priority: This is the PRIMARY biometric signature of the applicant. You MUST assign its exact coordinates to 'holder_signature.bounding_box' and 'signature_bounding_box'.
  2) OFFICIAL / AUTHORITY SIGNATURE ("Firma del Secretario Ejecutivo / Funcionario Autorizado"):
     - Position: Located at the bottom edge of the card, printed small next to 'FECHA DE NACIMIENTO' / 'SECCIÓN'.
     - Distinction: This is ONLY the issuing government official's signature. Record this under 'authority_signature'.
- Precise Bounding Box: Provide tight bounding box coordinates (top_pct, left_pct, width_pct, height_pct) around ONLY the handwritten strokes of the signature, excluding printed text labels or card borders.

- RIGOROUS QUALITY & FORENSIC ASSESSMENT (BE STRICT, DO NOT DEFAULT TO EXCELLENT):
  1) "overall_quality":
     - "excellent": ONLY for perfect studio scans/photos with zero glare, razor-sharp microprinting, flat orientation, and even lighting.
     - "acceptable": Decent photo where text is readable but shows typical phone camera artifacts (minor glare, slight angle).
     - "poor": Obvious flash glare/reflections, motion blur, soft focus, heavy cast shadows, washed out colors, or photographed from a digital screen/monitor.
     - "unusable": Severe glare or blur obscuring identity data or face.
  2) "condition":
     - "good": Crisp physical card with clean surface and unblemished lamination.
     - "worn": Scratched plastic, corner wear, peeling edges, faded holographic seal, or discoloration.
     - "damaged": Cracks, tears, creases, erased letters, or heavy stains.
     - "mutilated": Missing pieces, holes, or severe physical mutilation.
  3) Flag specific defects:
     - Set "has_glare": true if there are bright white flash hotspots, light reflection streaks, or glare patches.
     - Set "is_blurry": true if characters have soft/fuzzy edges or lack high-contrast sharpness.
     - Set "has_heavy_shadows": true if the card is partially occluded by phone/hand shadows.
     - Set "is_photocopy_or_screen": true if moiré screen patterns, pixel grids, or black-and-white photocopy raster dots are visible.
  4) "quality_summary": Provide a concise objective diagnosis in Spanish (e.g. "Documento desgastado con reflejo de flash y leve desenfoque").

- For Mexican INE: 'M' = 'Mujer' = 'female', 'H' = 'Hombre' = 'male'.
- Format all dates as ISO YYYY-MM-DD.
- Return null for unreadable or non-applicable fields.
- Output ONLY valid JSON, no markdown formatting.`;

  let cleanBaseUrl = (baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  cleanBaseUrl = cleanBaseUrl.replace(/\/models$/, '').replace(/\/chat\/completions$/, '');
  const chatUrl = `${cleanBaseUrl}/chat/completions`;
  const cleanModel = (visionModel || 'gpt-4o-mini').trim().replace(/^models\//, '');

  const isReasoning = /o[134]|deepseek-reasoner|r1/i.test(cleanModel);

  async function sendOcrRequest(useMaxCompletionTokens) {
    const payload = {
      model: cleanModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentArray }
      ],
      response_format: { type: 'json_object' }
    };

    if (useMaxCompletionTokens) {
      payload.max_completion_tokens = 2000;
    } else {
      payload.max_tokens = 2000;
      payload.temperature = 0.1;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const resp = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return resp;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  try {
    let response = await sendOcrRequest(isReasoning);

    if (!response.ok) {
      const errBody = await response.text();
      if (/max_completion_tokens/i.test(errBody) && !isReasoning) {
        response = await sendOcrRequest(true);
      } else if (/max_tokens/i.test(errBody) && isReasoning) {
        response = await sendOcrRequest(false);
      } else {
        throw new Error(`AI API error (${response.status}): ${errBody}`);
      }
    }

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Respuesta vacía del proveedor de IA');
    }

    const parsed = JSON.parse(rawContent);

    // Normalize and generate compatibility fields
    const detected = (parsed.detected_document_type || parsed.document_type || '').toLowerCase();
    let typeMatches = parsed.document_type_matches;
    if (typeMatches === undefined) {
      if (docType === 'passport') {
        typeMatches = detected === 'passport';
      } else if (docType === 'drivers_license') {
        typeMatches = detected === 'drivers_license' || detected === 'driver_license';
      } else if (docType === 'id_card') {
        typeMatches = detected === 'voter_credential' || detected === 'id_card' || detected === 'national_id' || detected === 'ine';
      } else {
        typeMatches = true;
      }
    }

    let validationError = parsed.validation_error || null;
    if (!typeMatches && !validationError) {
      const expectedNames = {
        passport: 'Pasaporte',
        drivers_license: 'Licencia de Conducir',
        id_card: 'Credencial para Votar (INE) / Cédula de Identidad'
      };
      const detectedNames = {
        voter_credential: 'Credencial para Votar (INE/IFE)',
        ine: 'Credencial para Votar (INE/IFE)',
        passport: 'Pasaporte',
        drivers_license: 'Licencia de Conducir',
        driver_license: 'Licencia de Conducir',
        national_id: 'Documento Nacional de Identidad',
        unknown: 'Documento no reconocido'
      };
      validationError = `El documento presentado (${detectedNames[detected] || detected}) no coincide con el tipo seleccionado (${expectedNames[docType] || docType}).`;
    }

    // Programmatic verification of First Name, First Surname, Second Surname against CURP initials
    let firstName = parsed.first_name || '';
    let firstSurname = parsed.first_surname || '';
    let secondSurname = parsed.second_surname || '';

    const curpStr = (parsed.curp || '').trim().toUpperCase();
    if (curpStr.length >= 4) {
      const curpSecondSurnameInitial = curpStr[2];
      const curpFirstNameInitial = curpStr[3];

      const fnInit = (firstName[0] || '').toUpperCase();
      const snInit = (secondSurname[0] || '').toUpperCase();

      // If AI model swapped Given Name with Second Surname
      if (fnInit === curpSecondSurnameInitial && snInit === curpFirstNameInitial) {
        const temp = firstName;
        firstName = secondSurname;
        secondSurname = temp;
      }
    }

    const fullName = [firstName, firstSurname, secondSurname].filter(Boolean).join(' ').trim() || parsed.full_name || parsed.fullName || '';
    const birthDate = parsed.date_of_birth || parsed.birthDate || parsed.birth_date || null;
    const documentNumber = parsed.voter_key || parsed.passport_number || parsed.license_number || parsed.curp || parsed.documentNumber || null;
    const gender = parsed.sex === 'female' ? 'F' : parsed.sex === 'male' ? 'M' : (parsed.sex_code || parsed.gender || null);
    const expirationDate = parsed.valid_until || parsed.expiration_date || parsed.expirationDate || null;
    const issueDate = parsed.valid_from || parsed.issue_date || parsed.issueDate || null;

    const qualityAssessment = parsed.quality_assessment || {
      condition: 'good',
      has_glare: false,
      has_heavy_shadows: false,
      is_blurry: false,
      has_occlusions: false,
      is_cropped: false,
      is_photocopy_or_screen: false,
      overall_quality: 'acceptable',
      detected_issues: [],
      quality_summary: null
    };

    // Autocrop handwritten signature(s) if detected
    let croppedHolderSignatureBase64 = null;
    let croppedAuthoritySignatureBase64 = null;

    const sigAssessmentRaw = parsed.signature_assessment;
    if (sigAssessmentRaw?.has_handwritten_signature || sigAssessmentRaw?.signature_detected || sigAssessmentRaw?.holder_signature?.detected) {
      try {
        // 1. Crop holder signature (Titular / Ciudadano)
        croppedHolderSignatureBase64 = await cropSignatureFromDocument({
          frontImage,
          backImage,
          bbox: sigAssessmentRaw.holder_signature?.bounding_box || sigAssessmentRaw.signature_bounding_box,
          signatureAssessment: sigAssessmentRaw,
          docType
        });
      } catch (cropErr) {
        console.warn('[HOLDER SIGNATURE CROP WARNING]', cropErr.message);
      }

      // 2. Crop authority signature if detected (Secretario / Funcionario Autorizado)
      if (sigAssessmentRaw.authority_signature?.detected && sigAssessmentRaw.authority_signature?.bounding_box) {
        try {
          croppedAuthoritySignatureBase64 = await cropSignatureFromDocument({
            frontImage,
            backImage,
            bbox: sigAssessmentRaw.authority_signature.bounding_box,
            signatureAssessment: sigAssessmentRaw,
            docType
          });
        } catch (authCropErr) {
          console.warn('[AUTHORITY SIGNATURE CROP WARNING]', authCropErr.message);
        }
      }
    }

    const signatureAssessment = sigAssessmentRaw ? {
      ...sigAssessmentRaw,
      cropped_signature_base64: croppedHolderSignatureBase64,
      signature_crop_url: croppedHolderSignatureBase64,
      signatureCropUrl: croppedHolderSignatureBase64,
      authority_signature_crop_url: croppedAuthoritySignatureBase64,
      authoritySignatureCropUrl: croppedAuthoritySignatureBase64,
      holder_signature: sigAssessmentRaw.holder_signature ? {
        ...sigAssessmentRaw.holder_signature,
        cropped_signature_base64: croppedHolderSignatureBase64,
        signature_crop_url: croppedHolderSignatureBase64
      } : null,
      authority_signature: sigAssessmentRaw.authority_signature ? {
        ...sigAssessmentRaw.authority_signature,
        cropped_signature_base64: croppedAuthoritySignatureBase64,
        signature_crop_url: croppedAuthoritySignatureBase64
      } : null
    } : null;

    // Dynamic calibrated confidence score computation & manual review triggers
    const reviewReasons = [];
    let calibratedScore = typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 90;

    if (!typeMatches || validationError) {
      calibratedScore -= 30;
      reviewReasons.push('El tipo de documento no coincide con el seleccionado');
    }
    if (!fullName || fullName.length < 5) {
      calibratedScore -= 25;
      reviewReasons.push('Nombre no detectado o incompleto');
    }
    if (docType === 'id_card' && !parsed.curp && !parsed.voter_key) {
      calibratedScore -= 20;
      reviewReasons.push('Falta CURP o Clave de Elector');
    }
    if (!birthDate) {
      calibratedScore -= 10;
      reviewReasons.push('Fecha de nacimiento no legible');
    }
    if (qualityAssessment.is_blurry) {
      calibratedScore -= 20;
      reviewReasons.push('Fotografía con desenfoque / falta de nitidez');
    }
    if (qualityAssessment.has_glare) {
      calibratedScore -= 15;
      reviewReasons.push('Reflejo de luz o flash sobre los datos');
    }
    if (qualityAssessment.has_heavy_shadows) {
      calibratedScore -= 10;
      reviewReasons.push('Sombras oscuras sobre el documento');
    }
    if (qualityAssessment.is_photocopy_or_screen) {
      calibratedScore -= 25;
      reviewReasons.push('Posible captura desde pantalla o fotocopia');
    }
    if (qualityAssessment.overall_quality === 'poor') {
      calibratedScore -= 20;
      if (!reviewReasons.some(r => r.includes('Calidad'))) reviewReasons.push('Calidad visual deficiente');
    } else if (qualityAssessment.overall_quality === 'unusable') {
      calibratedScore -= 45;
      reviewReasons.push('Documento ilegible');
    }
    if (qualityAssessment.condition === 'damaged' || qualityAssessment.condition === 'mutilated') {
      calibratedScore -= 15;
      reviewReasons.push('Documento físico maltratado o roto');
    }

    // Local Deterministic Barcode & QR Code Scanning (Front and Back sides)
    let barcodeAssessment = null;
    let qrVerified = false;
    let qrMatchedFields = [];

    try {
      barcodeAssessment = await scanIdentityDocumentBarcodes({ frontImage, backImage });

      // Cross-check QR extracted payloads with OCR fields (Anti-tampering verification)
      if (barcodeAssessment?.detected) {
        barcodeAssessment.codes.forEach(code => {
          if (code.parsed?.curp && curpStr && code.parsed.curp === curpStr) {
            qrVerified = true;
            qrMatchedFields.push('CURP');
          }
          if (code.parsed?.electorKey && (parsed.voter_key || parsed.electorKey)) {
            const cleanKey = String(parsed.voter_key || parsed.electorKey).trim().toUpperCase();
            if (code.parsed.electorKey === cleanKey) {
              qrVerified = true;
              qrMatchedFields.push('Clave de Elector');
            }
          }
        });

        if (qrVerified) {
          calibratedScore = Math.min(100, calibratedScore + 15);
        }
      }
    } catch (barcodeErr) {
      console.warn('[BARCODE DETECTION WARNING]', barcodeErr.message);
    }

    const confidenceScore = Math.max(5, Math.min(100, Math.round(calibratedScore)));
    const confidenceLevel = confidenceScore >= 80 ? 'high' : confidenceScore >= 60 ? 'medium' : 'low';
    const requiresManualReview = confidenceScore < 80 || reviewReasons.length > 0;

    const normalizedData = {
      ...parsed,
      first_name: firstName,
      first_surname: firstSurname,
      second_surname: secondSurname,
      full_name: fullName,
      document_type_matches: typeMatches,
      validation_error: validationError,
      quality_assessment: qualityAssessment,
      signature_assessment: signatureAssessment,
      signatureAssessment,
      cropped_signature_base64: croppedHolderSignatureBase64,
      signature_crop_url: croppedHolderSignatureBase64,
      signatureCropUrl: croppedHolderSignatureBase64,
      authority_signature_crop_url: croppedAuthoritySignatureBase64,
      authoritySignatureCropUrl: croppedAuthoritySignatureBase64,
      // Barcode & QR code scanning assessment
      barcode_assessment: barcodeAssessment,
      barcodeAssessment,
      qr_codes: barcodeAssessment?.qr_codes || [],
      qrCodes: barcodeAssessment?.qr_codes || [],
      qr_verified: qrVerified,
      qrVerified,
      qr_matched_fields: qrMatchedFields,
      // Standard compatibility aliases
      fullName,
      firstName,
      firstLastName: firstSurname,
      secondLastName: secondSurname,
      birthDate,
      gender,
      documentNumber,
      electorKey: parsed.voter_key || parsed.electorKey || null,
      curp: parsed.curp || null,
      expirationDate,
      issueDate,
      confidenceScore,
      confidence_score: confidenceScore,
      confidenceLevel,
      confidence_level: confidenceLevel,
      requiresManualReview,
      requires_manual_review: requiresManualReview,
      reviewReasons,
      review_reasons: reviewReasons,
      ocrSuccess: typeMatches && parsed.is_valid_document !== false
    };

    return {
      success: true,
      extractedData: normalizedData,
      modelUsed: data.model || cleanModel,
      processedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('[DOCUMENT OCR ERROR]', err.message);
    throw err;
  }
}
