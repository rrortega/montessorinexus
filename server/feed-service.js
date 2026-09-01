import './env.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pgPkg from 'pg';
const { Pool } = pgPkg;

import {
  extractStorageRelativePath,
  getCachedFilePath,
  DEFAULT_LOCAL_ROOT,
  deleteFromLocalCache,
  storageServiceFor
} from './storage-service.js';

let defaultFeedPrisma = null;
export function getFeedServicePrisma(customPrisma = null) {
  if (customPrisma) return customPrisma;
  if (!defaultFeedPrisma) {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    defaultFeedPrisma = new PrismaClient({ adapter });
    defaultFeedPrisma.admissionStage = defaultFeedPrisma.processStage;
    defaultFeedPrisma.admissionApplication = defaultFeedPrisma.processApplication;
    defaultFeedPrisma.admissionFormTemplate = defaultFeedPrisma.processFormTemplate;
  }
  return defaultFeedPrisma;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

/**
 * Converts a relative image path or URL into a base64 Data URI for AI Vision models.
 */
export function convertImageToDataUri(imgUrl) {
  if (!imgUrl || typeof imgUrl !== 'string') return null;
  const trimmed = imgUrl.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;

  try {
    let relativeCandidate = trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
        const parsed = new URL(trimmed);
        relativeCandidate = parsed.pathname + (parsed.search || '');
      } else {
        // External public URL (e.g. S3, Cloudinary)
        return trimmed;
      }
    }

    // 1. Check if it is a school storage path (/api/storage/schools/... or /api/storage/stream?file=...)
    const storageRel = extractStorageRelativePath(relativeCandidate);
    if (storageRel) {
      const cached = getCachedFilePath(storageRel);
      const localFs = path.join(DEFAULT_LOCAL_ROOT, storageRel);
      const targetFilePath = fs.existsSync(cached) ? cached : (fs.existsSync(localFs) ? localFs : null);
      if (targetFilePath && fs.statSync(targetFilePath).isFile()) {
        const ext = path.extname(targetFilePath).toLowerCase().replace('.', '') || 'jpeg';
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'svg') mimeType = 'image/svg+xml';

        const fileBuffer = fs.readFileSync(targetFilePath);
        return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      }
    }

    // 2. Legacy public directory fallback (/feed/..., /gallery/..., etc.)
    const cleanRelative = relativeCandidate.split('?')[0].replace(/^\/+/, '');
    const absolutePath = path.join(publicDir, cleanRelative);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      const ext = path.extname(absolutePath).toLowerCase().replace('.', '') || 'jpeg';
      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'svg') mimeType = 'image/svg+xml';

      const fileBuffer = fs.readFileSync(absolutePath);
      return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    }
  } catch (err) {
    console.warn('[FEED SERVICE CONVERT IMAGE ERROR]', err.message);
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

/**
 * Physically deletes media assets from school storage (S3/MinIO/Local), local cache and legacy public disk
 */
export async function deletePhysicalFeedMedia({ schoolId, urls, prisma = null }) {
  if (!urls) return { count: 0 };
  const rawList = Array.isArray(urls) ? urls : [urls];
  const list = rawList.filter(Boolean);
  if (list.length === 0) return { count: 0 };

  let deletedCount = 0;
  try {
    const storage = await storageServiceFor(schoolId, prisma);
    for (const item of list) {
      if (!item || typeof item !== 'string') continue;
      const cleanUrl = item.trim();
      if (!cleanUrl) continue;

      // 1. Storage Relative Path resolution (S3 / MinIO / Local Storage / Cache)
      const relPath = extractStorageRelativePath(cleanUrl);
      if (relPath) {
        const delRes = await storage.deleteFile(relPath);
        if (delRes?.success) {
          deletedCount++;
          console.log(`🗑️ [STORAGE FEED MEDIA DELETED] Deleted: ${relPath}`);
        }
        deleteFromLocalCache(relPath);
      }

      // 2. Also ensure legacy public disk file is deleted if present (/public/feed/...)
      if (cleanUrl.startsWith('/feed/') || cleanUrl.startsWith('feed/')) {
        const relativePart = cleanUrl.replace(/^\/?feed\//, '').split('?')[0];
        const diskPath = path.join(publicDir, 'feed', relativePart);
        if (fs.existsSync(diskPath)) {
          try {
            fs.unlinkSync(diskPath);
            deletedCount++;
            console.log(`🗑️ [LEGACY DISK FEED MEDIA DELETED] Deleted disk file: ${diskPath}`);
          } catch (uErr) {
            console.warn('[FEED DELETE DISK WARNING]', uErr.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('[DELETE PHYSICAL FEED MEDIA ERROR]', err.message);
  }

  return { count: deletedCount };
}

export const MONTESSORI_WISDOM_CORPUS = `
Compendio de Filosofía y Citas de María Montessori para encauzar reflexiones pedagógicas:

1. Sobre la independencia y autonomía del niño:
- «Ayúdame a hacerlo por mí mismo» (Lema principal del método).
- «Nunca ayudes a un niño en una tarea en la que siente que puede tener éxito».
- «Cualquier ayuda innecesaria es un obstáculo para el desarrollo del niño».
- «El instinto más grande de los niños es precisamente liberarse del adulto».
- «No hagas por un niño nada que él sea capaz de hacer por sí mismo».

2. Sobre la mente absorbente y el aprendizaje natural:
- «La mente del niño no es un recipiente para llenar, sino un fuego que encender».
- «Los niños tienen una mente absorbente. Absorben conocimientos del entorno sin fatigarse».
- «La educación es un proceso natural llevado a cabo por el niño y no adquirido por la escuela».
- «La mano es el instrumento de la inteligencia».
- «Lo que la mano hace, la mente lo recuerda».

3. Sobre el rol del maestro y del adulto preparado:
- «No me sigan a mí, sigan al niño».
- «Esta es nuestra obligación hacia el niño: darle un rayo de luz y seguir nuestro camino».
- «La mayor señal de éxito para un profesor es poder decir: "Los niños están trabajando como si yo no existiera"».
- «Enseñar enseñando, no corrigiendo».
- «No les digas cómo hacerlo. Muéstrales cómo hacerlo y no digas ni una palabra. Si les dices, se fijarán en tus labios. Si les muestras, querrán hacerlo ellos mismos».
- «La mejor enseñanza es la que utiliza la menor cantidad de palabras necesarias para la tarea».

4. Sobre el respeto, el entorno preparado y la libertad con límites:
- «Si criticas al niño con demasiada frecuencia, aprenderá a juzgar. Si lo elogias con regularidad, le enseñarás a valorar».
- «Debemos recordar algo fundamental: dar libertad a un niño no significa dejarlo solo ni, mucho menos, abandonarlo».
- «No hay descripción, ni imagen, ni libro que pueda reemplazar ver árboles reales y toda la vida que los rodea en un bosque».
- «Cuando un niño se siente seguro de sí mismo, deja entonces de buscar la aprobación».
- «Educar a niños felices equivale a educar a adultos felices».

5. Sobre la sociedad y la paz mundial:
- «La educación desde el comienzo de la vida podría cambiar verdaderamente el presente y futuro de la sociedad».
- «Sembrad en los niños ideas buenas, aunque no las entiendan; los años se encargarán de descifrarlas en su entendimiento y de hacerlas florecer en su corazón».
- «Si la ayuda y la salvación han de llegar, será a través de los niños, porque los niños son los creadores de la humanidad».
`;

/**
 * Emits realtime events to Deepstream WebSocket service
 */
export async function publishDeepstreamRealtimeEvent(eventName, data) {
  try {
    const deepstreamUrl = process.env.DEEPSTREAM_URL || 'https://realtime.asistenxa.com/api';
    await fetch(deepstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: [
          {
            topic: 'event',
            action: 'emit',
            eventName,
            data
          }
        ]
      })
    });
  } catch (err) {
    console.warn(`[DEEPSTREAM EVENT PUBLISH ERROR: ${eventName}]`, err.message);
  }
}

/**
 * Returns human-readable role subtitle for notifications (e.g. 'Padre de Mateo', 'Guía', etc.)
 */
export async function getAuthorSubtitleInfo(userId, schoolId, prisma) {
  if (!userId) return '';
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentLinks: {
          include: { student: { select: { fullName: true } } }
        },
        memberships: {
          where: schoolId ? { schoolId } : undefined
        }
      }
    });
    if (!user) return '';

    const membership = user.memberships?.[0];
    const role = membership?.role || user.staffRole || 'TUTOR';

    if (role === 'TUTOR') {
      const children = user.studentLinks?.map(sl => sl.student?.fullName).filter(Boolean).join(', ');
      return children ? `Padre de ${children}` : 'Familia / Tutor';
    } else if (role === 'TEACHER' || role === 'STAFF') {
      return user.jobTitle ? `Guía (${user.jobTitle})` : 'Guía / Docente';
    } else if (role === 'OWNER' || role === 'ADMIN') {
      return 'Dirección escolar';
    }
    return '';
  } catch (e) {
    return '';
  }
}

/**
 * Fetches feed AI configuration for a given school
 */
export async function getSchoolFeedAiConfig(schoolId, customPrisma = null) {
  const prisma = getFeedServicePrisma(customPrisma);
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, logoUrl: true, slug: true, features: true }
  });

  const settings = await prisma.siteSetting.findMany({
    where: {
      schoolId,
      key: {
        in: [
          'ai_provider_mode',
          'ai_api_key', 'openai_api_key', 'OPENAI_API_KEY',
          'ai_base_url', 'openai_base_url',
          'ai_model_text',
          'feed_ai_moderation_tutors',
          'feed_ai_moderation_guides',
          'feed_ai_grammar_curation',
          'feed_ai_agent_enabled',
          'feed_ai_agent_name',
          'feed_ai_agent_role',
          'feed_ai_agent_instructions'
        ]
      }
    }
  });

  const getVal = (keys, fallback = '') => {
    const s = settings.find(item => keys.includes(item.key));
    return s ? s.value.trim() : fallback;
  };

  const defaultAgentName = school?.name
    ? school.name.split(' ')[0].replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '')
    : 'Ceiba';

  const providerMode = getVal(['ai_provider_mode'], 'platform');
  const customApiKey = getVal(['ai_api_key', 'openai_api_key', 'OPENAI_API_KEY'], '');
  const platformApiKey = (process.env.DEFAULT_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '').trim();

  const hasCustomKey = Boolean(customApiKey);
  const hasPlatformKey = Boolean(platformApiKey);

  let usePlatform = true;
  if (providerMode === 'custom' && hasCustomKey) {
    usePlatform = false;
  } else if (providerMode === 'platform') {
    if (hasPlatformKey) {
      usePlatform = true;
    } else if (hasCustomKey) {
      usePlatform = false;
    }
  } else if (hasCustomKey && !hasPlatformKey) {
    usePlatform = false;
  }

  const apiKey = usePlatform ? (platformApiKey || customApiKey) : (customApiKey || platformApiKey);
  const baseUrl = usePlatform
    ? (process.env.DEFAULT_AI_BASE_URL || process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
    : getVal(['ai_base_url', 'openai_base_url'], 'https://api.openai.com/v1').replace(/\/+$/, '');
  const textModel = usePlatform
    ? (process.env.DEFAULT_AI_MODEL || process.env.OPENAI_TEXT_MODEL || process.env.AI_MODEL || 'gpt-4o-mini').replace(/^models\//, '')
    : getVal(['ai_model_text'], 'gpt-4o-mini').replace(/^models\//, '');

  return {
    providerMode,
    isCustom: !usePlatform,
    customApiKey,
    platformApiKey,
    apiKey,
    baseUrl,
    textModel,
    moderationTutors: getVal(['feed_ai_moderation_tutors'], 'true') === 'true',
    moderationGuides: getVal(['feed_ai_moderation_guides'], 'false') === 'true',
    grammarCuration: getVal(['feed_ai_grammar_curation'], 'true') === 'true',
    agentEnabled: getVal(['feed_ai_agent_enabled'], 'true') === 'true',
    agentName: getVal(['feed_ai_agent_name'], defaultAgentName || 'Ceiba'),
    agentRole: getVal(['feed_ai_agent_role'], 'Asistente Pedagógico Montessori'),
    agentInstructions: getVal(['feed_ai_agent_instructions'], ''),
    school
  };
}

export function getSchoolMonthlyPlanUsd(school) {
  const feat = (school && school.features && typeof school.features === 'object') ? school.features : {};
  let envCost = 0;
  const environmentsCount = Array.isArray(school?.environments) ? school.environments.length : 0;
  if (environmentsCount > 3) {
    envCost = (environmentsCount - 3) * 5;
  }
  let modulesCost = 0;
  if (feat.modules) {
    if (feat.storageTier === '10gb') modulesCost += 5;
    if (feat.storageTier === '22gb') modulesCost += 10;
    if (feat.storageTier === '52gb') modulesCost += 25;
  }
  return 14 + envCost + modulesCost;
}

export function getSchoolAiBillingCycle(school, now = new Date()) {
  const feat = (school && school.features && typeof school.features === 'object') ? school.features : {};
  const createdDate = school?.createdAt ? new Date(school.createdAt) : new Date();
  const trialEndsAt = feat.trialEndsAt
    ? new Date(feat.trialEndsAt)
    : new Date(createdDate.getTime() + (90 + (feat.trialExtendedDays || 0)) * 24 * 60 * 60 * 1000);
  const diffMs = trialEndsAt.getTime() - now.getTime();
  const isTrialActive = diffMs > 0 && feat.subscriptionStatus !== 'TRIAL_EXPIRED';
  const isPaid = feat.subscriptionStatus === 'ACTIVE_PAID' || Boolean(feat.isPaid);
  const isFreeTrial = !isPaid && isTrialActive;

  if (isFreeTrial) {
    const cycleKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfCycle = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfCycle = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    return {
      isFreeTrial: true,
      cycleKey,
      startOfCycle,
      endOfCycle,
      renewalDate,
      renewalDay: 1,
      renewalDescription: 'Se renueva el día 1 de cada mes (no acumulativo)'
    };
  }

  let billingAnchorDate = null;
  if (feat.subscriptionStartDate) {
    billingAnchorDate = new Date(feat.subscriptionStartDate);
  } else if (feat.lastPaymentDate) {
    billingAnchorDate = new Date(feat.lastPaymentDate);
  } else if (Array.isArray(feat.paymentHistory) && feat.paymentHistory.length > 0 && feat.paymentHistory[0].date) {
    billingAnchorDate = new Date(feat.paymentHistory[0].date);
  } else {
    billingAnchorDate = createdDate;
  }

  const anchorDay = billingAnchorDate.getDate() || 1;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const maxDaysThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const clampedDayThisMonth = Math.min(anchorDay, maxDaysThisMonth);
  const anchorThisMonth = new Date(currentYear, currentMonth, clampedDayThisMonth, 0, 0, 0);

  let cycleStart, cycleEnd;
  if (now >= anchorThisMonth) {
    cycleStart = anchorThisMonth;
    const maxDaysNextMonth = new Date(currentYear, currentMonth + 2, 0).getDate();
    const clampedDayNextMonth = Math.min(anchorDay, maxDaysNextMonth);
    cycleEnd = new Date(currentYear, currentMonth + 1, clampedDayNextMonth, 0, 0, 0);
  } else {
    const maxDaysPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const clampedDayPrevMonth = Math.min(anchorDay, maxDaysPrevMonth);
    cycleStart = new Date(currentYear, currentMonth - 1, clampedDayPrevMonth, 0, 0, 0);
    cycleEnd = anchorThisMonth;
  }

  const startStr = cycleStart.toISOString().split('T')[0];
  const endStr = cycleEnd.toISOString().split('T')[0];
  const cycleKey = `sub_${startStr}_${endStr}`;

  return {
    isFreeTrial: false,
    cycleKey,
    startOfCycle: cycleStart,
    endOfCycle: new Date(cycleEnd.getTime() - 1000),
    renewalDate: cycleEnd,
    renewalDay: anchorDay,
    renewalDescription: `Se renueva el día ${anchorDay} de cada mes con tu suscripción (no acumulativo)`
  };
}

export async function getSchoolAiUsageStats(schoolId, customPrisma = null) {
  try {
    const prisma = getFeedServicePrisma(customPrisma);
    if (!schoolId || !prisma) {
      return {
        providerMode: 'platform',
        isFreeTrial: false,
        totalPurchasedTokens: 0,
        consumedTokens: 0,
        remainingTokens: 0,
        monthlyPlanUsd: 0,
        tokenLimit: 0,
        percentageUsed: 0,
        isLimitReached: false,
        cycleKey: '',
        startOfCycle: new Date(),
        endOfCycle: new Date(),
        renewalDate: new Date(),
        renewalDay: 1,
        renewalDescription: ''
      };
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { environments: { select: { id: true } } }
    });

    if (!school) {
      return {
        providerMode: 'platform',
        isFreeTrial: false,
        totalPurchasedTokens: 0,
        consumedTokens: 0,
        remainingTokens: 0,
        monthlyPlanUsd: 0,
        tokenLimit: 0,
        percentageUsed: 0,
        isLimitReached: false,
        cycleKey: '',
        startOfCycle: new Date(),
        endOfCycle: new Date(),
        renewalDate: new Date(),
        renewalDay: 1,
        renewalDescription: ''
      };
    }

    const now = new Date();
    const cycle = getSchoolAiBillingCycle(school, now);
    const yearMonth = cycle.cycleKey;

    const settingsList = await prisma.siteSetting.findMany({
      where: { schoolId }
    });
    const settingsMap = {};
    settingsList.forEach(s => { settingsMap[s.key] = s.value; });

    const providerMode = settingsMap.ai_provider_mode === 'custom' ? 'custom' : 'platform';
    const customApiKey = (settingsMap.ai_api_key || settingsMap.openai_api_key || '').trim();
    const customBaseUrl = (settingsMap.ai_base_url || settingsMap.openai_base_url || 'https://api.openai.com/v1').trim();
    const customModelText = (settingsMap.ai_model_text || settingsMap.openai_model || 'gpt-4o-mini').trim();
    const customModelVision = (settingsMap.ai_model_vision || '').trim();

    const monthlyPlanUsd = getSchoolMonthlyPlanUsd(school);
    const tokensPer10Usd = Number(process.env.AI_TOKENS_PER_10_USD || 1000000);
    const includedLimit = cycle.isFreeTrial
      ? (2 * 1000000)
      : Math.floor(monthlyPlanUsd / 10) * tokensPer10Usd;

    const usageRecord = await prisma.aiTokenUsage.findUnique({
      where: {
        schoolId_yearMonth: {
          schoolId,
          yearMonth
        }
      }
    });

    // Count billable output tokens or total tokens against quota
    const usedTokens = usageRecord ? (usageRecord.completionTokens || usageRecord.totalTokens || 0) : 0;
    const requestCount = usageRecord ? usageRecord.requestCount : 0;
    const remainingTokens = Math.max(0, includedLimit - usedTokens);
    const percentage = includedLimit > 0 ? Math.min(100, Math.round((usedTokens / includedLimit) * 100)) : 0;

    return {
      providerMode,
      isCustom: providerMode === 'custom',
      hasCustomKey: Boolean(customApiKey),
      customBaseUrl,
      customModelText,
      customModelVision,
      monthlyPlanUsd: cycle.isFreeTrial ? 0 : monthlyPlanUsd,
      isFreeTrial: cycle.isFreeTrial,
      tokensPer10Usd,
      includedLimit,
      used: usedTokens,
      remaining: remainingTokens,
      percentage,
      requestCount,
      yearMonth,
      startOfMonth: cycle.startOfCycle.toISOString(),
      endOfMonth: cycle.endOfCycle.toISOString(),
      startOfCycle: cycle.startOfCycle.toISOString(),
      endOfCycle: cycle.endOfCycle.toISOString(),
      renewalDate: cycle.renewalDate.toISOString(),
      renewalDay: cycle.renewalDay,
      renewalDescription: cycle.renewalDescription,
      isNonCumulative: true,
      hasFallback: true
    };
  } catch (err) {
    console.error('[AI USAGE STATS ERROR]', err);
    return {
      providerMode: 'platform',
      isCustom: false,
      hasCustomKey: false,
      monthlyPlanUsd: 25,
      tokensPer10Usd: 1000000,
      includedLimit: 2000000,
      used: 0,
      remaining: 2000000,
      percentage: 0,
      requestCount: 0,
      isFreeTrial: true,
      renewalDescription: 'Se renueva el día 1 de cada mes (no acumulativo)',
      isNonCumulative: true,
      hasFallback: true
    };
  }
}

export async function recordSchoolAiTokenUsage({ schoolId, promptTokens = 0, completionTokens = 0, totalTokens = 0, prisma: customPrisma = null }) {
  try {
    if (!schoolId) return;
    const prisma = getFeedServicePrisma(customPrisma);
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, createdAt: true, features: true }
    });

    const now = new Date();
    const cycle = getSchoolAiBillingCycle(school, now);
    const yearMonth = cycle.cycleKey;
    const billableTokens = completionTokens > 0 ? completionTokens : (totalTokens > 0 ? totalTokens : (promptTokens + completionTokens));

    await prisma.aiTokenUsage.upsert({
      where: {
        schoolId_yearMonth: {
          schoolId,
          yearMonth
        }
      },
      update: {
        promptTokens: { increment: promptTokens },
        completionTokens: { increment: completionTokens },
        totalTokens: { increment: billableTokens },
        requestCount: { increment: 1 }
      },
      create: {
        schoolId,
        yearMonth,
        promptTokens,
        completionTokens,
        totalTokens: billableTokens,
        requestCount: 1
      }
    });
  } catch (err) {
    console.warn('[RECORD AI TOKEN USAGE WARN]', err.message);
  }
}

/**
 * Generates one of 5 distinct variants for out-of-tokens responses across supported languages (es, en, pt, fr)
 */
export function getOutOfTokensGenericResponse({ adminTag = '@Administración', locale = 'es', agentName = 'Ceiba' }) {
  const normLocale = (locale || 'es').toLowerCase().slice(0, 2);

  const templates = {
    es: [
      `¡Hola! Lo siento mucho, en este momento no puedo responderte porque no me han habilitado tokens para poder pensar. ${adminTag}, ¿serías tan amable de revisar y recargar los tokens del colegio en la plataforma para que pueda seguir acompañando a nuestra comunidad? ¡Muchas gracias!`,
      `Querida comunidad, lamento no poder brindarles una respuesta en este instante, ya que he agotado los tokens disponibles para reflexionar. ${adminTag}, te pido amablemente si puedes habilitar más tokens para nuestro colegio en la administración del sistema. ¡Agradezco mucho tu apoyo!`,
      `¡Hola! Me encantaría responderte, pero me encuentro temporalmente sin tokens activos para procesar mis respuestas. ${adminTag}, por favor, cuando tengas un momento, ¿podrías gestionar la recarga de tokens para nuestro agente escolar? ¡Gracias de corazón!`,
      `Disculpa, no me es posible generar una respuesta en este momento porque no dispongo de tokens habilitados para pensar y redactar. ${adminTag}, te invito cordialmente a verificar el saldo de tokens de la escuela en el panel para reactivar mi asistencia. ¡Muchas gracias!`,
      `¡Hola! Con mucho gusto te respondería, pero he llegado al límite de tokens habilitados para mi funcionamiento. ${adminTag}, ¿podrías por favor ocuparte de renovar o habilitar los tokens de IA de la escuela para que pueda seguir participando en el muro? ¡Te lo agradecería muchísimo!`
    ],
    en: [
      `Hello! I am very sorry, right now I cannot answer because I do not have active processing tokens available to think. ${adminTag}, would you be so kind as to check and reload our school's tokens in the dashboard so I can keep supporting our community? Thank you very much!`,
      `Dear community, I apologize for not being able to provide a response at this moment as I have used all available reflection tokens. ${adminTag}, could you please enable more tokens for our school in the system settings? Thank you for your support!`,
      `Hello! I would love to answer you, but I am temporarily out of tokens to process my thoughts. ${adminTag}, whenever you have a moment, could you please manage the token reload for our school agent? Thank you from the bottom of my heart!`,
      `Apologies, I am unable to generate a response right now because I have no enabled tokens to think and write. ${adminTag}, I kindly invite you to check the school's token balance in the dashboard to reactivate my assistance. Thank you!`,
      `Hello! I would gladly assist, but I have reached the limit of enabled tokens for my operation. ${adminTag}, could you please help renew or enable our school's AI tokens so I can continue participating in the feed? I would greatly appreciate it!`
    ],
    pt: [
      `Olá! Sinto muito, neste momento não posso responder porque não tenho tokens de processamento habilitados para pensar. ${adminTag}, você poderia verificar e recarregar os tokens da nossa escola na plataforma para que eu possa continuar ajudando nossa comunidade? Muito obrigado!`,
      `Querida comunidade, lamento não poder responder neste instante, pois esgotei os tokens disponíveis para reflexão. ${adminTag}, peço gentilmente que habilite mais tokens para a escola no painel administrativo. Agradeço imensamente!`,
      `Olá! Adoraria te responder, mas estou temporariamente sem tokens ativos para processar respostas. ${adminTag}, por favor, quando tiver um momento, poderia providenciar a recarga de tokens do nosso agente escolar? Muito obrigado de coração!`,
      `Desculpe, não consigo gerar uma resposta agora porque não disponho de tokens habilitados para pensar e escrever. ${adminTag}, convido você cordialmente a verificar o saldo de tokens da escola no painel para reativar minha assistência. Obrigado!`,
      `Olá! Responderia com muito prazer, mas atingi o limite de tokens habilitados para meu funcionamento. ${adminTag}, você poderia por favor renovar ou habilitar os tokens de IA da escola para que eu continue participando no mural? Agradeço muito!`
    ],
    fr: [
      `Bonjour ! Je suis désolé, pour le moment je ne peux pas vous répondre car je n'ai pas de jetons de traitement disponibles pour réfléchir. ${adminTag}, auriez-vous la gentillesse de vérifier et recharger les jetons de l'école dans le tableau de bord pour que je puisse continuer à aider notre communauté ? Merci beaucoup !`,
      `Chère communauté, je regrette de ne pas pouvoir répondre pour l'instant car j'ai épuisé mes jetons de réflexion. ${adminTag}, pourriez-vous s'il vous plaît activer plus de jetons pour l'école dans l'administration ? Merci pour votre soutien !`,
      `Bonjour ! J'aimerais beaucoup vous répondre, mais je suis temporairement à court de jetons pour traiter mes réponses. ${adminTag}, dès que vous aurez un moment, pourriez-vous gérer la recharge des jetons de notre agent scolaire ? Merci de tout cœur !`,
      `Toutes mes excuses, je ne peux pas générer de réponse actuellement car je ne dispose pas de jetons activés pour penser et rédiger. ${adminTag}, je vous invite cordialement à vérifier le solde de jetons de l'école dans le panneau d'administration. Merci !`,
      `Bonjour ! Je vous répondrais volontiers, mais j'ai atteint la limite de jetons activés pour mon fonctionnement. ${adminTag}, pourriez-vous s'il vous plaît renouveler ou activer les jetons d'IA de l'école pour que je puisse continuer à participer au fil d'actualité ? Je vous en serais très reconnaissant !`
    ]
  };

  const list = templates[normLocale] || templates.es;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

/**
 * Executes chat completion for school feed tasks (moderation or agent response)
 */
export async function executeSchoolAiChatCompletion({
  schoolId,
  messages,
  temperature = 0.7,
  maxTokens = 600,
  responseFormat = null,
  customModel = null,
  prisma
}) {
  const aiConfig = await getSchoolFeedAiConfig(schoolId, prisma);
  const platformApiKey = (process.env.DEFAULT_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '').trim();
  const platformBaseUrl = (process.env.DEFAULT_AI_BASE_URL || process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const platformModel = (process.env.DEFAULT_AI_MODEL || process.env.OPENAI_TEXT_MODEL || process.env.AI_MODEL || 'gpt-4o-mini').replace(/^models\//, '');

  const keyToUse = aiConfig.apiKey || aiConfig.customApiKey || platformApiKey;
  if (!keyToUse) {
    throw new Error('No hay proveedor de IA configurado ni clave de API disponible.');
  }

  // Quota check when using platform key
  if (!aiConfig.isCustom) {
    const stats = await getSchoolAiUsageStats(schoolId, prisma);
    if (stats.remaining <= 0) {
      const err = new Error('Tokens de IA de la escuela agotados.');
      err.code = 'OUT_OF_TOKENS';
      err.stats = stats;
      throw err;
    }
  }

  const urlToUse = aiConfig.baseUrl || platformBaseUrl || 'https://api.openai.com/v1';
  const modelToUse = customModel || aiConfig.textModel || platformModel || 'gpt-4o-mini';

  const cleanBaseUrl = urlToUse.replace(/\/models$/, '').replace(/\/chat\/completions$/, '');
  const reqBody = {
    model: modelToUse,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(responseFormat && { response_format: responseFormat })
  };

  const res = await fetch(`${cleanBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${keyToUse}`
    },
    body: JSON.stringify(reqBody)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI API Error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || '';
  const usage = json.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // Record strictly output completion tokens consumed when using platform key
  if (!aiConfig.isCustom) {
    await recordSchoolAiTokenUsage({
      schoolId,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.completion_tokens || 0,
      prisma
    });
  }

  return {
    content,
    raw: json,
    usage,
    provider: aiConfig.isCustom ? 'custom' : 'platform',
    wasFallback: false
  };
}

/**
 * Evaluates language and community standards using AI, and optionally curates spelling/grammar
 */
export async function moderateFeedTextWithAi({ text, schoolId, authorRole, includeGrammarCuration = false, prisma }) {
  try {
    const aiConfig = await getSchoolFeedAiConfig(schoolId, prisma);
    if (!aiConfig.apiKey && !aiConfig.platformApiKey) {
      return { approved: true, reason: null, curatedContent: text, hasGrammarChanges: false };
    }

    const systemPrompt = `Eres un evaluador de moderación ética y corrector pedagógico para el muro escolar de una comunidad educativa Montessori (${aiConfig.school?.name || 'Montessori'}).
Tu objetivo es garantizar un entorno armónico, respetuoso, seguro y con excelente ortografía para familias, niños y docentes.

Paso 1 - Moderación (approved: boolean):
- RECHAZAR (approved: false) si contiene:
  1. Insultos, groserías, lenguaje vulgar, descalificaciones o agresiones verbales.
  2. Acoso, intimidación, hostigamiento o ciberacoso contra alumnos, docentes o familias.
  3. Discurso de odio, discriminación o contenido explícito.
  4. Difamación o ataques directos a la comunidad.
  5. Spam comercial no autorizado o enlaces sospechosos.
- APROBAR (approved: true) si:
  Es una duda, consulta, felicitación, saludo, reflexión o comentario respetuoso y constructivo.

Paso 2 - Curado ortográfico y gramatical (solo si approved es true${includeGrammarCuration ? ' y se solicita curado de texto' : ''}):
- Corrige faltas de ortografía, errores de tipeo, acentuación (tildes), mayúsculas y puntuación.
- Conserva FIELMENTE el tono, sentido e intención original del autor sin alterar su vocabulario ni agregar texto no solicitado.
- Conserva ESTRICTAMENTE todas las menciones con arroba (@Nombre, @Usuario), URLs/enlaces, hashtags (#tag), números y emojis.
- Si no hay faltas de ortografía o no se requiere cambio, "curatedContent" debe ser idéntico al texto original.

Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto:
{
  "approved": boolean,
  "reason": "Explicación breve, cortés y respetuosa en español solo cuando approved sea false, de lo contrario null",
  "hasGrammarErrors": boolean,
  "curatedContent": "Texto con ortografía y tildes corregidas (solo si approved es true)"
}`;

    const completion = await executeSchoolAiChatCompletion({
      schoolId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Autor (${authorRole}): "${text}"` }
      ],
      temperature: 0.1,
      maxTokens: Math.max(400, Math.ceil(text.length * 1.5)),
      responseFormat: { type: 'json_object' },
      prisma
    });

    const parsed = JSON.parse(completion.content || '{}');
    const approved = Boolean(parsed.approved);
    const reason = parsed.reason || (approved ? null : 'El contenido fue marcado por no cumplir con las normas de respeto de la comunidad escolar.');
    const curatedContent = (typeof parsed.curatedContent === 'string' && parsed.curatedContent.trim())
      ? parsed.curatedContent.trim()
      : text;
    const hasGrammarChanges = Boolean(approved && includeGrammarCuration && parsed.hasGrammarErrors && curatedContent !== text);

    return {
      approved,
      reason,
      curatedContent: hasGrammarChanges ? curatedContent : text,
      hasGrammarChanges
    };
  } catch (err) {
    console.error('[AI MODERATION ERROR]', err);
    return { approved: true, reason: null, curatedContent: text, hasGrammarChanges: false };
  }
}

/**
 * Curates spelling, accent marks, and grammar in feed posts or comments using AI
 */
export async function curateSpellingAndGrammarWithAi({ text, schoolId, prisma }) {
  if (!text || !text.trim()) {
    return { curatedText: text, hasChanges: false };
  }
  try {
    const aiConfig = await getSchoolFeedAiConfig(schoolId, prisma);
    if (!aiConfig.apiKey && !aiConfig.platformApiKey) {
      return { curatedText: text, hasChanges: false };
    }

    const systemPrompt = `Eres un corrector ortográfico y de redacción profesional para una comunidad escolar (${aiConfig.school?.name || 'Montessori'}).
Tu labor es corregir las faltas de ortografía, acentuación (tildes), mayúsculas/minúsculas y puntuación del texto redactado por un miembro escolar.

Reglas estrictas de curado ortográfico:
1. Corrige TODAS las faltas de ortografía, errores de tipeo y omisiones de tildes (ej: "queiro" -> "quiero", "esceula" -> "escuela", "tambien" -> "también", "aqui" -> "aquí", "pos" -> "post").
2. Corrige la puntuación y el uso adecuado de signos de interrogación/exclamación (¿? ¡!) y mayúsculas iniciales.
3. PRESERVA FIELMENTE el sentido, tono, intención y vocabulario del autor. No inventes contenido ni cambies el estilo natural del mensaje.
4. PRESERVA EXACTAMENTE las menciones con arroba (@Nombre, @Usuario), URLs/enlaces, hashtags (#tag), números y emojis.
5. Si el texto original ya está bien escrito y no contiene errores, devuelve el texto original intacto.

Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto:
{
  "hasErrors": boolean,
  "curatedText": "Texto final con ortografía y gramática corregida"
}`;

    const completion = await executeSchoolAiChatCompletion({
      schoolId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      maxTokens: Math.max(500, Math.ceil(text.length * 1.5)),
      responseFormat: { type: 'json_object' },
      prisma
    });

    const parsed = JSON.parse(completion.content || '{}');
    const curatedText = typeof parsed.curatedText === 'string' && parsed.curatedText.trim()
      ? parsed.curatedText.trim()
      : text;
    const hasChanges = Boolean(parsed.hasErrors && curatedText !== text);

    return {
      curatedText: hasChanges ? curatedText : text,
      hasChanges
    };
  } catch (err) {
    console.error('[AI GRAMMAR CURATION ERROR]', err);
    return { curatedText: text, hasChanges: false };
  }
}

// In-memory worker & AI mention deduplication tracking
const activeJobLocks = new Set();
const activeAiMentionLocks = new Map();

/**
 * Triggers the School AI Agent when mentioned (@AgentName)
 */
export async function checkAndTriggerSchoolAiAgent({
  postId,
  content,
  schoolId,
  authorName = 'Miembro de la comunidad',
  authorRole = 'TUTOR',
  authorEmail = null,
  isDirectPostMention = false,
  parentCommentId = null,
  prisma
}) {
  try {
    const aiConfig = await getSchoolFeedAiConfig(schoolId, prisma);
    if (!aiConfig.agentEnabled) return { triggered: false, reason: 'agent_disabled' };

    const rawAgentName = (aiConfig.agentName || 'Ceiba').trim();
    const agentName = rawAgentName.replace(/^@+/, '').trim() || 'Ceiba';
    if (!agentName) return { triggered: false, reason: 'no_agent_name' };

    // Check if content mentions @AgentName (e.g. @Ceiba, @ceiba, @ceiba:, etc.)
    const escapedName = agentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentionRegex = new RegExp(`@${escapedName}(?:\\b|[\\s,.:;!?)]|$)`, 'i');
    if (!mentionRegex.test(content)) {
      return { triggered: false, reason: 'not_mentioned' };
    }

    // 1. In-flight memory lock: avoid concurrent duplicate execution across workers
    const mentionLockKey = `${postId}:${parentCommentId || 'root'}`;
    const existingLockTime = activeAiMentionLocks.get(mentionLockKey);
    const nowMs = Date.now();
    if (existingLockTime && (nowMs - existingLockTime) < 30000) {
      console.log(`🔒 [AI AGENT LOCK] Already processing mention for ${mentionLockKey}, skipping duplicate trigger.`);
      return { triggered: false, reason: 'in_flight' };
    }
    activeAiMentionLocks.set(mentionLockKey, nowMs);

    // Occasional cleanup of old locks
    if (activeAiMentionLocks.size > 1000) {
      for (const [k, ts] of activeAiMentionLocks.entries()) {
        if (nowMs - ts > 60000) activeAiMentionLocks.delete(k);
      }
    }

    // 2. Database Deduplication: verify if an AI response already exists for this post/thread within last 60s
    const recentExistingAiComment = await prisma.feedComment.findFirst({
      where: {
        postId,
        parentId: parentCommentId || null,
        isAiAgent: true,
        createdAt: { gte: new Date(nowMs - 60000) }
      }
    });
    if (recentExistingAiComment) {
      console.log(`🛑 [AI AGENT DEDUP] AI comment already created for ${mentionLockKey} recently (${recentExistingAiComment.id}). Skipping.`);
      return { triggered: false, reason: 'already_responded' };
    }

    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            jobTitle: true,
            staffRole: true,
            studentLinks: {
              include: { student: { select: { fullName: true } } }
            }
          }
        },
        environment: { select: { id: true, name: true, stage: true } },
        student: { select: { id: true, fullName: true } },
        comments: {
          where: { moderationStatus: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, fullName: true, staffRole: true } }
          }
        },
        school: { select: { id: true, name: true, logoUrl: true } }
      }
    });
    if (!post) return { status: 'post_not_found' };

    // Check school token balance when using platform API key (or if no key is configured)
    if (!aiConfig.isCustom) {
      const usageStats = await getSchoolAiUsageStats(schoolId, prisma);
      const isOutOfTokens = usageStats.remaining <= 0 || (!aiConfig.apiKey && !aiConfig.platformApiKey);
      if (isOutOfTokens) {
        // Retrieve school admin/owner user for mention tag
        const adminMembership = await prisma.schoolMembership.findFirst({
          where: {
            schoolId,
            role: { in: ['OWNER', 'ADMIN'] }
          },
          include: {
            user: { select: { fullName: true } }
          },
          orderBy: { role: 'asc' }
        });
        const adminName = adminMembership?.user?.fullName || 'Administración';
        const adminTag = `@${adminName.replace(/\s+/g, '')}`;
        const outOfTokensMsg = getOutOfTokensGenericResponse({
          adminTag,
          locale: post.school?.locale || 'es',
          agentName
        });

        // Create Out-of-tokens generic response comment
        const aiComment = await prisma.feedComment.create({
          data: {
            postId,
            parentId: parentCommentId || null,
            authorRole: 'STAFF',
            content: outOfTokensMsg,
            isInternalGuideOnly: false,
            isAiAgent: true,
            aiAgentName: `@${agentName}`,
            aiAgentAvatar: post.school?.logoUrl || undefined,
            moderationStatus: 'APPROVED'
          },
          include: {
            author: {
              select: { id: true, email: true, fullName: true, avatarUrl: true, staffRole: true }
            }
          }
        });

        await prisma.feedPost.update({
          where: { id: postId },
          data: { commentsCount: { increment: 1 } }
        });

        publishDeepstreamRealtimeEvent(`feed-post-comment:${postId}`, {
          postId,
          comment: aiComment,
          schoolId: post.schoolId,
          action: 'created'
        });
        publishDeepstreamRealtimeEvent(`feed-post-comment:${post.schoolId}`, {
          postId,
          comment: aiComment,
          schoolId: post.schoolId,
          action: 'created'
        });
        publishDeepstreamRealtimeEvent(`feed-post-comment`, {
          postId,
          comment: aiComment,
          schoolId: post.schoolId,
          action: 'created'
        });

        if (post.authorId) {
          const notificationPayload = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'AI_COMMENT',
            postId: postId,
            postAuthorId: post.authorId,
            actorId: 'ai_agent',
            actorName: `@${agentName}`,
            actorSubtitle: 'Asistente de la Comunidad',
            actorAvatarUrl: post.school?.logoUrl || undefined,
            contentPreview: outOfTokensMsg.length > 90 ? `${outOfTokensMsg.slice(0, 90)}...` : outOfTokensMsg,
            reactionEmoji: null,
            createdAt: new Date().toISOString()
          };
          publishDeepstreamRealtimeEvent(`feed-author-notification:${post.authorId}`, notificationPayload);
          publishDeepstreamRealtimeEvent(`feed-author-notification`, notificationPayload);
        }

        return;
      }
    }

    const schoolTitle = post.school?.name || 'Comunidad Montessori';
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 1. Gather Dynamic Knowledge: Environments & Assigned Guides
    let envsContext = 'No hay ambientes registrados aún.';
    try {
      const environments = await prisma.environment.findMany({
        where: { schoolId },
        include: {
          guides: {
            include: {
              user: { select: { fullName: true, staffRole: true, jobTitle: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      if (environments.length > 0) {
        envsContext = environments.map(e => {
          const guideNames = e.guides.map(g => `${g.user?.fullName || 'Guía'} (${g.user?.jobTitle || g.user?.staffRole || 'Guía'})`).join(', ');
          return `- Ambiente "${e.name}" (Etapa: ${e.stage || 'Montessori'}): Guías a cargo: ${guideNames || 'Sin guías asignadas'}`;
        }).join('\n');
      }
    } catch (e) {
      console.warn('[FEED AI AGENT ENVS KNOWLEDGE ERROR]', e.message);
    }

    // 2. Gather Dynamic Knowledge: Author Family & Student Link
    const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'admin@montessorinexus.com').trim().toLowerCase();
    const cleanAuthorEmail = (authorEmail || (isDirectPostMention ? post.author?.email : null) || '').trim().toLowerCase();
    const rawAuthorName = (authorName || post.author?.fullName || 'Familia').trim();
    const isSuperAdminAuthor = Boolean(
      (cleanAuthorEmail && cleanAuthorEmail === superAdminEmail) ||
      authorRole === 'SUPERADMIN' ||
      rawAuthorName.toLowerCase() === 'superadmin' ||
      rawAuthorName.toLowerCase() === 'nexus' ||
      rawAuthorName.toLowerCase().includes('superadmin') ||
      (post.author?.email && post.author.email.toLowerCase() === superAdminEmail && isDirectPostMention)
    );

    const authorCleanName = isSuperAdminAuthor
      ? 'Nexus'
      : rawAuthorName.replace(/^(Administrador|Admin|Director|Directora|Guía|Profesor|Profesora|Tutor|Tutora|Docente)\s+/i, '');
    const authorFirstName = isSuperAdminAuthor
      ? 'Nexus'
      : (authorCleanName.split(/\s+/)[0] || rawAuthorName.split(/\s+/)[0] || 'Familia').trim();

    let authorFamilyContext = '';
    let authorRoleDesc = isSuperAdminAuthor ? 'Superadministrador de la Plataforma (Nexus)' : 'Miembro de la comunidad';
    if (!isSuperAdminAuthor) {
      if (authorRole === 'TEACHER' || authorRole === 'STAFF') {
        authorRoleDesc = `Guía / Docente (${post.author?.jobTitle || post.author?.staffRole || 'Guía'})`;
      } else if (authorRole === 'TUTOR') {
        const children = post.author?.studentLinks?.map(sl => {
          const student = sl.student;
          return `${student?.fullName || 'Hijo'}`;
        }).filter(Boolean).join(', ');
        authorRoleDesc = children ? `Familia / Tutor (de ${children})` : 'Familia / Tutor';

        if (post.author?.studentLinks && post.author.studentLinks.length > 0) {
          const detailedChildren = post.author.studentLinks.map(sl => {
            return `* Alumno(a): ${sl.student?.fullName || 'Estudiante'}`;
          }).join('\n');
          authorFamilyContext = `\n[INFORMACIÓN DEL ESTUDIANTE / FAMILIA DEL AUTOR]
El autor con quien estás interactuando es madre/padre/tutor de:
${detailedChildren}
(Pauta de calidez y privacidad: Puedes aludir con mucho cariño y naturalidad a su proceso de desarrollo cuando sea pertinente para la conversación, cuidando siempre su privacidad).`;
        }
      } else if (authorRole === 'OWNER' || authorRole === 'ADMIN') {
        authorRoleDesc = 'Dirección / Administración Escolar';
      }
    }

    // 3. Gather Dynamic Knowledge: School Calendar & Events
    let eventsContext = 'No hay eventos programados en el calendario escolar actualmente.';
    try {
      const schoolEvents = await prisma.schoolEvent.findMany({
        where: { schoolId },
        include: { category: true },
        orderBy: { startDateTime: 'asc' },
        take: 10
      });
      if (schoolEvents.length > 0) {
        eventsContext = schoolEvents.map(ev => {
          const startDate = new Date(ev.startDateTime).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
          const time = new Date(ev.startDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const cat = ev.category?.name ? ` [Categoría: ${ev.category.name}]` : '';
          const loc = ev.location ? ` - Ubicación: ${ev.location}` : '';
          return `- ${ev.title}${cat} | Fecha: ${startDate} a las ${time}${loc}. ${ev.description ? `Descripción: "${ev.description.slice(0, 100)}"` : ''}`;
        }).join('\n');
      }
    } catch (e) {
      console.warn('[FEED AI AGENT EVENTS KNOWLEDGE ERROR]', e.message);
    }

    // 4. Gather Dynamic Knowledge: Announcements (Vigentes + Últimos 3 pasados)
    let announcementsContext = 'No hay comunicados registrados.';
    try {
      const activeAnnouncements = await prisma.announcement.findMany({
        where: { schoolId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 6
      });
      const pastAnnouncements = await prisma.announcement.findMany({
        where: { schoolId, status: { not: 'ACTIVE' } },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      const allAnnouncements = [
        ...activeAnnouncements.map(a => ({ ...a, vigencia: 'VIGENTE / ACTIVO' })),
        ...pastAnnouncements.map(a => ({ ...a, vigencia: 'HISTÓRICO / PASADO RECIENTE' }))
      ];

      if (allAnnouncements.length > 0) {
        announcementsContext = allAnnouncements.map(a => {
          return `- [${a.vigencia}] "${a.title}": ${a.content ? a.content.slice(0, 140) : 'Sin contenido'}`;
        }).join('\n');
      }
    } catch (e) {
      console.warn('[FEED AI AGENT ANNOUNCEMENTS KNOWLEDGE ERROR]', e.message);
    }

    // 5. System Map and Role Permissions Reference
    const systemMapContext = `[MAPA DE HERRAMIENTAS DEL SISTEMA Y PERMISOS POR ROL]
El sistema MontessoriNexus se organiza en módulos accesibles mediante el menú lateral izquierdo:

A) SECCIONES PARA FAMILIAS / TUTORES:
- "Portal Familiar" (/panel?tab=portal): Resumen de comunicados, accesos rápidos y notificaciones.
- "Progreso y Desarrollo" (/panel?tab=progress): Bitácora autorizada y seguimiento del desarrollo del niño.
- "Bitácora" (/panel?tab=journal): Registros pedagógicos autorizados.
- "Calendario y Eventos" (/panel?tab=events): Fechas de festivales, reuniones y citas escolares.
- "Mis Pagos" (/panel?tab=finances): Historial de pagos y recibos escolares.
- "Documentos" (/panel?tab=documents): Circulares oficiales, manuales de convivencia y descargables.
- "Muro de la Comunidad" (/panel?tab=feed): Red social y feed de la escuela.

B) SECCIONES PARA GUÍAS Y DOCENTES:
- "Seguimiento Montessori" (/panel?tab=montessori): Registro de lecciones de 3 tiempos y trabajo individual.
- "Asistencia" (/panel?tab=attendance): Toma de lista y control diario del salón.
- "Bitácora" (/panel?tab=journal): Registro diario de observaciones pedagógicas del ambiente.
- "Curriculum" (/panel?tab=curriculum): Áreas y lecciones del currículo Montessori.
- "Eventos" (/panel?tab=events): Convocatorias y organización escolar.

C) SECCIONES PARA DIRECCIÓN Y ADMINISTRACIÓN:
- "Ambientes" (/panel?tab=environments): Gestión de salones y asignación de guías.
- "Alumnos" (/panel?tab=students) y "Familias" (/panel?tab=tutors): Directorio escolar.
- "Guías" (/panel?tab=guides): Directorio de personal docente.
- "Admisiones" (/panel?tab=admissions) y "Procesos": Solicitudes y admisiones de nuevos alumnos.
- "Finanzas" (/panel?tab=finances): Facturación, conceptos y planes de pago.
- "Configuración del Sistema" (/panel?tab=system-settings): Parámetros institucionales.

* REGLA DE PRIVACIDAD Y GUÍA POR ROL:
Si un padre de familia pregunta cómo usar o acceder a funciones que son de uso docente o administrativo (por ejemplo, registrar presentaciones de lecciones, modificar admisiones o ver notas privadas), aclárale amablemente que esas herramientas están reservadas para el equipo de guías y dirección por protección pedagógica, e indícale el paso a paso exacto para consultar su sección correspondiente como familia.`;

    const systemPrompt = `Eres @${agentName}, el Agente de Inteligencia Artificial Oficial de la escuela "${schoolTitle}".
Hoy es: ${formattedDate}.

Personalidad y Tono:
- Tono neutral, ejecutivo, refinado, empático y respetuoso, con profunda ternura hacia el niño y la comunidad escolar.
- Conoces a las guías, sus ambientes y a los niños de la comunidad.
- Promueves la filosofía de María Montessori: autonomía, observación, ambiente preparado y respeto al ritmo natural de cada niño.

${MONTESSORI_WISDOM_CORPUS}

[AMBIENTES Y GUÍAS DE LA ESCUELA]
${envsContext}
${authorFamilyContext}

[CALENDARIO Y EVENTOS DE LA ESCUELA]
${eventsContext}

[COMUNICADOS ESCOLARES VIGENTES Y RECIENTES]
${announcementsContext}

${systemMapContext}

REGLAS DE ORO OBLIGATORIAS:
1. LONGITUD Y CONCISIÓN:
   - Sé conciso, elegante y directo (1 o 2 párrafos breves por defecto).
   - NO escribas discursos largos ni explicaciones innecesarias a menos que el usuario te pida explícitamente profundizar (ej: "explícame a fondo", "cuéntame detalladamente la teoría de...", etc.).

2. CERO DISCUSIÓN DE FACTURACIÓN Y PAGOS (DESVÍO PROFESIONAL):
   - NUNCA des cotizaciones, precios de colegiaturas, montos de deuda, descuentos, convenios ni discutas sobre cobros o planes de pago.
   - Si el usuario te pregunta por precios, pagos, colegiaturas o becas, esquiva el tema amablemente indicándole que para temas administrativos y aranceles debe acudir presencialmente a la administración escolar o solicitar una cita con el área administrativa del colegio.

3. CERO PROVOCACIONES Y CONFLICTOS:
   - NUNCA caigas en provocaciones, quejas hostiles, comparaciones destructivas o debates polémicos. Mantén una postura serena, diplomática y constructiva.

4. AYUDA PASO A PASO DEL SISTEMA:
   - Si alguien pregunta cómo encontrar una herramienta, guíale con un paso a paso sencillo basado en su rol.

5. PRIVACIDAD DE FOTOS, MARCAS DE AGUA, DIFUMINADO Y CONSENTIMIENTOS:
   - Si alguien pregunta por qué su hijo(a) sale con marca de agua o rostro difuminado/pixelado en una foto:
     Explícale con calidez que en su perfil (dentro de su Portal Familiar) tiene la opción de otorgar el consentimiento del uso de imagen de su hijo(a) para que sus fotos no se protejan de esa manera y se retire la marca de agua. Aclara que este es un mecanismo de seguridad y privacidad propio de MontessoriNexus (la plataforma donde se gestiona el colegio) diseñado para proteger la privacidad y seguridad de los estudiantes.
   - Si alguien pregunta por qué sale la cara de su hijo(a) en una foto si NO ha otorgado el consentimiento:
     Explícale con calma que a veces el sistema automático puede no detectar el rostro con total precisión producto del ángulo de la cara, el movimiento o reflejos de luz y sombra. Aclara que puede reportarla de inmediato para que no sea pública: desde la galería de fotos (o visor de la imagen) puede pulsar en reportar foto y dejar un comentario, y el sistema la desactivará inmediatamente de todos lados.

6. SALUDO INICIAL Y TRATO AFABLE (USO DEL PRIMER NOMBRE OBLIGATORIO):
   - ${isSuperAdminAuthor ? `REGLA ESTRICTA DE SUPERADMIN: Quien hace la mención es el Superadministrador de la plataforma ("Nexus"). NO debes llamarle por su nombre personal ni por "Superadmin", sino SIEMPRE y ÚNICAMENTE por "Nexus" (ejemplo obligatorio: "Hola Nexus, ...", "Nexus, con respecto a lo que mencionas...").` : `Inicia SIEMPRE tu respuesta dirigiéndote al autor directamente por su PRIMER NOMBRE de pila: "Hola ${authorFirstName}, ...".
   - Si el autor se llama "Juan Rodríguez", debes llamarle únicamente "Juan" (ej: "Hola Juan, la razón por la cual..."). Si se llama "Sofía Martínez", usa "Hola Sofía, ...".`}
   - PROHIBIDO usar introducciones robóticas, frías o frases hechas como:
     ❌ "Hola, es un placer poder ayudarte"
     ❌ "Hola, es un gusto atenderte"
     ❌ "Estimado Administrador" / "Estimado Juan Rodríguez" / "Estimada Familia"
   - Ve directo al grano desde la primera frase de forma afable, cordial, humana y empática.

7. GUARDRAILS DE VISIÓN Y ANÁLISIS DE FOTOGRAFÍAS (CERO ALUCINACIONES):
   - Cuando una publicación o comentario incluya fotos, dispones de visión directa de la imagen en alta resolución. OBSERVA E INTERPRETA CON RIGUROSA EXACTITUD lo que verdaderamente se aprecia en la imagen.
   - PROHIBIDO INVENTAR: NUNCA inventes paisajes, tierra, cielo, naturaleza, árboles, animales, personas, niños o materiales que NO se encuentren visibles de forma inequívoca en la foto.
   - Si el usuario te pregunta explícitamente sobre la foto (ej: "¿qué vemos en la foto?", "¿qué hay en la imagen?", "¿qué están haciendo?"):
     * Describe los elementos reales con precisión y fidelidad (por ejemplo: el tipo de material didáctico u objeto concreto, la mesa o tapete de trabajo, la postura del niño, las manos, los colores o el espacio visible).
     * Si algún elemento no se distingue con total claridad, indícalo con transparencia y honestidad en vez de suponer o fantasear.
     * Conecta lo observado con la pedagogía Montessori únicamente a partir de lo que de verdad muestra la imagen.

${aiConfig.agentInstructions ? `\nInstrucciones adicionales de la escuela:\n${aiConfig.agentInstructions}` : ''}`;

    // Extract media images if any
    let mediaUrls = [];
    if (Array.isArray(post.mediaUrls)) {
      mediaUrls = post.mediaUrls;
    } else if (typeof post.mediaUrls === 'string') {
      try {
        mediaUrls = JSON.parse(post.mediaUrls);
      } catch {
        mediaUrls = [post.mediaUrls];
      }
    }
    mediaUrls = Array.isArray(mediaUrls) ? mediaUrls.filter(Boolean) : [];

    const validImageDataUris = [];
    for (const url of mediaUrls.slice(0, 3)) {
      const dataUri = convertImageToDataUri(url);
      if (dataUri) {
        validImageDataUris.push(dataUri);
      }
    }

    // Context Messages construction
    const contextMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Original Post Content message (multimodal if images exist)
    const postHeader = `[PUBLICACIÓN ORIGINAL EN EL MURO ESCOLAR]
Escuela: ${schoolTitle}
Fecha de hoy: ${formattedDate}
Autor de la publicación: ${post.author?.fullName || 'Comunidad'} (${post.authorRole || 'Miembro'})
Ambiente: ${post.environment ? `${post.environment.name} (${post.environment.stage || ''})` : 'Toda la escuela'}
${post.student ? `Estudiante mencionado: ${post.student.fullName}\n` : ''}${post.title ? `Título: ${post.title}\n` : ''}Contenido de la publicación:
"${post.content}"`;

    if (validImageDataUris.length > 0) {
      const contentParts = [{ type: 'text', text: postHeader }];
      validImageDataUris.forEach(imgDataUri => {
        contentParts.push({
          type: 'image_url',
          image_url: { url: imgDataUri, detail: 'high' }
        });
      });
      contextMessages.push({ role: 'user', content: contentParts });
    } else {
      contextMessages.push({ role: 'user', content: postHeader });
    }

    // Append full comments conversation script in chronological order
    if (post.comments.length > 0) {
      post.comments.forEach(c => {
        if (c.isAiAgent) {
          contextMessages.push({
            role: 'assistant',
            content: `${c.aiAgentName || `@${agentName}`}: ${c.content}`
          });
        } else {
          const commentImgUri = c.mediaUrl ? convertImageToDataUri(c.mediaUrl) : null;
          if (commentImgUri) {
            contextMessages.push({
              role: 'user',
              content: [
                { type: 'text', text: `[Comentario previo de ${c.author?.fullName || 'Miembro'}]: "${c.content || 'Adjunta una imagen:'}"` },
                { type: 'image_url', image_url: { url: commentImgUri, detail: 'high' } }
              ]
            });
          } else {
            contextMessages.push({
              role: 'user',
              content: `[Comentario previo de ${c.author?.fullName || 'Miembro'}]: "${c.content}"`
            });
          }
        }
      });
    }

    // Trigger Turn
    const authorCallName = isSuperAdminAuthor ? 'Nexus' : authorFirstName;
    const visionDirectInstruction = validImageDataUris.length > 0
      ? `\n\n[INSTRUCCIÓN CRÍTICA DE VISIÓN]: La publicación contiene ${validImageDataUris.length} imagen(es) adjunta(s). Obsérvala(s) directamente y con sumo cuidado. NUNCA inventes paisajes, tierra, naturaleza ni elementos que no aparezcan. Si ${authorCallName} te pregunta sobre la foto (ej: "¿qué vemos en la foto?"), describe con fidelidad, precisión y valor pedagógico lo que REALMENTE está en la imagen.`
      : '';

    if (isDirectPostMention) {
      contextMessages.push({
        role: 'user',
        content: `${authorCallName} (${authorRoleDesc}) ha mencionado a @${agentName} directamente en la publicación:\n"${content}"${visionDirectInstruction}\n\nPor favor, responde como @${agentName} iniciando directamente con "Hola ${authorCallName}, ..." con una respuesta concisa, útil y afable siguiendo todas tus reglas.`
      });
    } else {
      contextMessages.push({
        role: 'user',
        content: `${authorCallName} (${authorRoleDesc}) te ha mencionado en un comentario:\n"${content}"${visionDirectInstruction}\n\nPor favor, responde directamente a este comentario iniciando directamente con "Hola ${authorCallName}, ..." manteniendo el contexto completo del post y siguiendo todas tus reglas.`
      });
    }

    const completion = await executeSchoolAiChatCompletion({
      schoolId,
      messages: contextMessages,
      temperature: 0.7,
      maxTokens: 650,
      prisma
    });

    const replyContent = completion.content?.trim();
    if (!replyContent) return;

    // Create AI Comment
    const aiComment = await prisma.feedComment.create({
      data: {
        postId,
        parentId: parentCommentId || null,
        authorRole: 'STAFF',
        content: replyContent,
        isInternalGuideOnly: false,
        isAiAgent: true,
        aiAgentName: `@${agentName}`,
        aiAgentAvatar: post.school?.logoUrl || undefined,
        moderationStatus: 'APPROVED'
      },
      include: {
        author: {
          select: { id: true, email: true, fullName: true, avatarUrl: true, staffRole: true }
        }
      }
    });

    // Increment post comments count
    await prisma.feedPost.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } }
    });

    // Realtime broadcast of AI comment via Deepstream
    publishDeepstreamRealtimeEvent(`feed-post-comment:${postId}`, {
      postId,
      comment: aiComment,
      schoolId: post.schoolId,
      action: 'created'
    });
    publishDeepstreamRealtimeEvent(`feed-post-comment:${post.schoolId}`, {
      postId,
      comment: aiComment,
      schoolId: post.schoolId,
      action: 'created'
    });
    publishDeepstreamRealtimeEvent(`feed-post-comment`, {
      postId,
      comment: aiComment,
      schoolId: post.schoolId,
      action: 'created'
    });

    // Send realtime notification balloon to post author
    if (post.authorId) {
      const notificationPayload = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'AI_COMMENT',
        postId: postId,
        postAuthorId: post.authorId,
        actorId: 'ai_agent',
        actorName: `@${agentName}`,
        actorSubtitle: 'Asistente de la Comunidad',
        actorAvatar: post.school?.logoUrl || '/gallery/ceiba-gallery-descarga.png',
        contentPreview: replyContent.slice(0, 120),
        reaction: null,
        schoolId: post.schoolId,
        createdAt: new Date().toISOString()
      };
      publishDeepstreamRealtimeEvent(`feed-author-notification:${post.authorId}`, notificationPayload);
      publishDeepstreamRealtimeEvent('feed-author-notification', notificationPayload);
    }

    return {
      triggered: true,
      agentName: `@${agentName}`,
      commentId: aiComment.id,
      replyPreview: replyContent.slice(0, 100) + '...'
    };
  } catch (err) {
    console.error('[TRIGGER SCHOOL AI AGENT ERROR]', err);
    return { triggered: false, error: err.message };
  }
}

/**
 * Worker Processor: Process Feed Post Moderation and Agent Trigger
 */
export async function processFeedPostModerationJob(postId, prisma) {
  const lockKey = `post:${postId}`;
  if (activeJobLocks.has(lockKey)) {
    console.log(`🔒 [JOB LOCK] Feed Post Job already in progress for ${postId}. Skipping duplicate run.`);
    return { success: true, status: 'already_processing' };
  }
  activeJobLocks.add(lockKey);

  try {
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, fullName: true, email: true } }
      }
    });
    if (!post) return { status: 'not_found' };

    const aiConfig = await getSchoolFeedAiConfig(post.schoolId, prisma);
    const needsModeration =
      (post.authorRole === 'TUTOR' && aiConfig.moderationTutors) ||
      ((post.authorRole === 'TEACHER' || post.authorRole === 'STAFF') && aiConfig.moderationGuides);

    let moderationApproved = true;
    let moderationReason = null;
    let finalContent = post.content;

    if (needsModeration) {
      const modResult = await moderateFeedTextWithAi({
        text: post.content,
        schoolId: post.schoolId,
        authorRole: post.authorRole || 'TUTOR',
        includeGrammarCuration: aiConfig.grammarCuration,
        prisma
      });
      moderationApproved = modResult.approved;
      moderationReason = modResult.reason;
      if (modResult.approved && modResult.hasGrammarChanges && modResult.curatedContent) {
        finalContent = modResult.curatedContent;
      }
    } else if (aiConfig.grammarCuration) {
      const curResult = await curateSpellingAndGrammarWithAi({
        text: post.content,
        schoolId: post.schoolId,
        prisma
      });
      if (curResult.hasChanges && curResult.curatedText) {
        finalContent = curResult.curatedText;
      }
    }

    const newStatus = moderationApproved ? 'APPROVED' : 'REJECTED';
    const updatedPost = await prisma.feedPost.update({
      where: { id: postId },
      data: {
        content: finalContent,
        moderationStatus: newStatus,
        moderationReason
      },
      include: {
        author: { select: { id: true, email: true, fullName: true, avatarUrl: true, jobTitle: true, staffRole: true } },
        environment: { select: { id: true, name: true, stage: true, color: true } },
        student: { select: { id: true, fullName: true, avatarUrl: true } },
        comments: {
          include: {
            author: { select: { id: true, email: true, fullName: true, avatarUrl: true, staffRole: true } }
          }
        },
        likes: true,
        school: { select: { id: true, name: true, logoUrl: true, slug: true } }
      }
    });

    // Realtime Deepstream Events
    publishDeepstreamRealtimeEvent(`feed-post-moderated:${post.schoolId}`, {
      postId,
      moderationStatus: newStatus,
      moderationReason,
      post: updatedPost,
      schoolId: post.schoolId
    });
    publishDeepstreamRealtimeEvent(`feed-post-moderated`, {
      postId,
      moderationStatus: newStatus,
      moderationReason,
      post: updatedPost,
      schoolId: post.schoolId
    });
    publishDeepstreamRealtimeEvent(`feed-post-updated:${post.schoolId}`, {
      post: updatedPost,
      schoolId: post.schoolId
    });
    publishDeepstreamRealtimeEvent('feed-post-updated', {
      post: updatedPost,
      schoolId: post.schoolId
    });

    // If approved, trigger AI Agent if mentioned
    let aiAgentResult = null;
    if (moderationApproved) {
      aiAgentResult = await checkAndTriggerSchoolAiAgent({
        postId,
        content: finalContent,
        schoolId: post.schoolId,
        authorName: updatedPost.author?.fullName || 'Comunidad',
        authorRole: post.authorRole,
        authorEmail: updatedPost.author?.email || post.author?.email || null,
        isDirectPostMention: true,
        prisma
      });
    }

    return {
      success: true,
      postId,
      moderationStatus: newStatus,
      moderationApproved,
      contentUpdated: finalContent !== post.content,
      aiAgent: aiAgentResult || { triggered: false }
    };
  } catch (err) {
    console.error('[PROCESS FEED POST JOB ERROR]', err);
    throw err;
  } finally {
    setTimeout(() => activeJobLocks.delete(lockKey), 5000);
  }
}

/**
 * Worker Processor: Process Feed Comment Moderation and Agent Trigger
 */
export async function processFeedCommentModerationJob(commentId, prisma) {
  const lockKey = `comment:${commentId}`;
  if (activeJobLocks.has(lockKey)) {
    console.log(`🔒 [JOB LOCK] Feed Comment Job already in progress for ${commentId}. Skipping duplicate run.`);
    return { success: true, status: 'already_processing' };
  }
  activeJobLocks.add(lockKey);

  try {
    const comment = await prisma.feedComment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
        author: { select: { id: true, fullName: true, email: true } }
      }
    });
    if (!comment) return { status: 'not_found' };

    const aiConfig = await getSchoolFeedAiConfig(comment.post.schoolId, prisma);
    const needsModeration =
      (comment.authorRole === 'TUTOR' && aiConfig.moderationTutors) ||
      ((comment.authorRole === 'TEACHER' || comment.authorRole === 'STAFF') && aiConfig.moderationGuides);

    let moderationApproved = true;
    let moderationReason = null;
    let finalContent = comment.content;

    if (needsModeration) {
      const modResult = await moderateFeedTextWithAi({
        text: comment.content,
        schoolId: comment.post.schoolId,
        authorRole: comment.authorRole || 'TUTOR',
        includeGrammarCuration: aiConfig.grammarCuration,
        prisma
      });
      moderationApproved = modResult.approved;
      moderationReason = modResult.reason;
      if (modResult.approved && modResult.hasGrammarChanges && modResult.curatedContent) {
        finalContent = modResult.curatedContent;
      }
    } else if (aiConfig.grammarCuration) {
      const curResult = await curateSpellingAndGrammarWithAi({
        text: comment.content,
        schoolId: comment.post.schoolId,
        prisma
      });
      if (curResult.hasChanges && curResult.curatedText) {
        finalContent = curResult.curatedText;
      }
    }

    const newStatus = moderationApproved ? 'APPROVED' : 'REJECTED';
    const updatedComment = await prisma.feedComment.update({
      where: { id: commentId },
      data: {
        content: finalContent,
        moderationStatus: newStatus,
        moderationReason
      },
      include: {
        author: { select: { id: true, email: true, fullName: true, avatarUrl: true, staffRole: true } }
      }
    });

    // Realtime Deepstream Events
    publishDeepstreamRealtimeEvent(`feed-comment-moderated:${comment.postId}`, {
      commentId,
      postId: comment.postId,
      moderationStatus: newStatus,
      moderationReason,
      comment: updatedComment,
      schoolId: comment.post.schoolId
    });
    publishDeepstreamRealtimeEvent(`feed-comment-updated:${comment.postId}`, {
      commentId,
      postId: comment.postId,
      comment: updatedComment,
      schoolId: comment.post.schoolId
    });

    // If approved, trigger AI Agent if mentioned
    let aiAgentResult = null;
    if (moderationApproved) {
      aiAgentResult = await checkAndTriggerSchoolAiAgent({
        postId: comment.postId,
        content: finalContent,
        schoolId: comment.post.schoolId,
        authorName: updatedComment.author?.fullName || 'Comunidad',
        authorRole: comment.authorRole,
        authorEmail: updatedComment.author?.email || null,
        isDirectPostMention: false,
        parentCommentId: comment.parentId || comment.id,
        prisma
      });
    }

    return {
      success: true,
      commentId,
      moderationStatus: newStatus,
      moderationApproved,
      contentUpdated: finalContent !== comment.content,
      aiAgent: aiAgentResult || { triggered: false }
    };
  } catch (err) {
    console.error('[PROCESS FEED COMMENT JOB ERROR]', err);
    throw err;
  } finally {
    setTimeout(() => activeJobLocks.delete(lockKey), 5000);
  }
}
