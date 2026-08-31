import './env.js';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Returns clean Umami credentials from environment variables
 */
export function getUmamiConfig() {
  const host = (
    process.env.VITE_UMAMI_HOST || 
    process.env.UMAMI_HOST || 
    'https://analytics.chamba.pro'
  ).trim().replace(/\/+$/, '');

  const username = (
    process.env.VITE_UMAMI_USERNAME || 
    process.env.UMAMI_USERNAME || 
    'montessorinexus'
  ).trim();

  const password = (
    process.env.VITE_UMAMI_PASSWORD || 
    process.env.UMAMI_PASSWORD || 
    'L4cl4v3c31b4'
  ).trim();

  return { host, username, password };
}

/**
 * Authenticates with Umami and returns a valid JWT token
 */
export async function getUmamiToken(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const { host, username, password } = getUmamiConfig();

  if (!username || !password) {
    throw new Error('Faltan credenciales VITE_UMAMI_USERNAME o VITE_UMAMI_PASSWORD en el entorno.');
  }

  const response = await fetch(`${host}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Error autenticando con Umami API (HTTP ${response.status})`);
  }

  const data = await response.json();
  const token = data.token || data.jwt;
  if (!token) {
    throw new Error('Respuesta de autenticación Umami sin token JWT.');
  }

  cachedToken = token;
  // Umami tokens typically last 24h, cache for 12h
  tokenExpiresAt = now + 12 * 60 * 60 * 1000;
  return token;
}

export const FORBIDDEN_SUBDOMAIN_WORDS = [
  'montessori', 'colegio', 'colegios', 'school', 'schools', 'escuela', 'escuelas',
  'international', 'internacional', 'academy', 'academia', 'institut', 'instituto',
  'institute', 'comunidad', 'community', 'schule', 'escola', 'centre', 'centro'
];

/**
 * Strips forbidden words like 'montessori', 'school', 'colegio' from a subdomain slug
 */
export function cleanSubdomainSlug(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim().toLowerCase();

  // Normalize accents and remove special characters
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[^a-z0-9-_]/g, '-');

  // Split into tokens by '-' or '_'
  const tokens = str.split(/[-_]+/).filter(Boolean);
  const filteredTokens = tokens.filter(token => !FORBIDDEN_SUBDOMAIN_WORDS.includes(token));

  let cleaned = filteredTokens.join('-');
  cleaned = cleaned.replace(/^-+|-+$/g, '');

  return cleaned || str.replace(/^-+|-+$/g, '') || 'colegio';
}

/**
 * Resolves the primary domain or subdomain for a given school.
 * Priority:
 * 1. custom_domain in siteSettings (dedicated custom domain e.g. "ceibamontessori.com")
 * 2. subdomain in siteSettings (cleaned of forbidden words e.g. "moots")
 * 3. school.slug cleaned of forbidden words (e.g. "roble-montessori" -> "roble")
 */
export async function resolveSchoolDomain(school, prisma, currentHost = null) {
  if (!school) return 'montessorinexus.com';

  try {
    if (prisma) {
      // 1. Check custom_domain in DB (own pointed domain)
      const customDomainSetting = await prisma.siteSetting.findFirst({
        where: { schoolId: school.id, key: 'custom_domain' }
      });
      if (customDomainSetting?.value && customDomainSetting.value.trim().length > 0) {
        let cd = customDomainSetting.value.trim().toLowerCase();
        cd = cd.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
        if (cd.length > 0 && !['localhost', '127.0.0.1'].includes(cd)) {
          return cd;
        }
      }

      // 2. Check subdomain in DB
      const subdomainSetting = await prisma.siteSetting.findFirst({
        where: { schoolId: school.id, key: 'subdomain' }
      });
      if (subdomainSetting?.value && subdomainSetting.value.trim().length > 0) {
        const rawSub = subdomainSetting.value.trim().toLowerCase();
        const cleanSub = cleanSubdomainSlug(rawSub);
        if (currentHost && currentHost.includes('.')) {
          const cleanHost = currentHost.split(':')[0].toLowerCase();
          const parts = cleanHost.split('.');
          if (parts.length >= 2 && !['localhost', '127.0.0.1'].includes(cleanHost)) {
            const baseDomain = parts.slice(1).join('.');
            return `${cleanSub}.${baseDomain}`;
          }
        }
        return `${cleanSub}.montessorinexus.com`;
      }
    }
  } catch (err) {
    console.warn(`[UMAMI] Warning reading domain settings for school ${school.id}:`, err.message);
  }

  // 3. Fallback: clean school slug
  const cleanSlug = cleanSubdomainSlug(school.slug || school.name || 'colegio');

  if (currentHost && currentHost.includes('.')) {
    const cleanHost = currentHost.split(':')[0].toLowerCase();
    const parts = cleanHost.split('.');
    if (parts.length >= 2 && !['localhost', '127.0.0.1'].includes(cleanHost)) {
      const sub = cleanSubdomainSlug(parts[0]);
      const baseDomain = parts.slice(1).join('.');
      return `${sub}.${baseDomain}`;
    }
  }

  return `${cleanSlug}.montessorinexus.com`;
}

/**
 * Ensures a school has an Umami siteId provisioned in Umami and saved in PostgreSQL.
 * Actively checks Umami by domain/ID; if missing or deleted in Umami, automatically recreates it on the fly.
 * Uses a Redis lock to guarantee atomicity and avoid duplicate creation under concurrent requests.
 */
export async function ensureSchoolUmamiSiteId(school, prisma, redisClient, currentHost = null) {
  if (!school || !school.id) return null;

  const lockKey = `umami:lock:${school.id}`;
  const lockTtlSeconds = 20;
  let lockAcquired = false;

  // 1. Acquire atomic Redis lock if redisClient is available
  if (redisClient) {
    try {
      // SET key value NX EX seconds
      const lockRes = await redisClient.set(lockKey, '1', 'EX', lockTtlSeconds, 'NX');
      lockAcquired = lockRes === 'OK';

      if (!lockAcquired) {
        console.log(`⏳ [UMAMI LOCK] Creation/Validation in progress for school ${school.id}. Waiting for concurrent worker...`);
        // Poll for completion up to 5 seconds
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 350));
          if (prisma) {
            const recheck = await prisma.school.findUnique({
              where: { id: school.id },
              select: { umamiSiteId: true }
            });
            if (recheck?.umamiSiteId) {
              school.umamiSiteId = recheck.umamiSiteId;
              return recheck.umamiSiteId;
            }
          }
        }
      }
    } catch (rErr) {
      console.warn(`[UMAMI REDIS LOCK WARNING] Error with Redis lock:`, rErr.message);
      lockAcquired = true; // Fallback to proceed if Redis has transient issues
    }
  } else {
    lockAcquired = true;
  }

  try {
    const { host } = getUmamiConfig();
    const token = await getUmamiToken();
    const domain = await resolveSchoolDomain(school, prisma, currentHost);
    const schoolName = school.name || school.slug || 'Colegio Montessori';

    // 2. Search if website currently exists in Umami for this user
    let matchedSiteId = null;
    try {
      const searchRes = await fetch(`${host}/api/websites?search=${encodeURIComponent(domain)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const items = Array.isArray(searchData) 
          ? searchData 
          : (Array.isArray(searchData?.data) ? searchData.data : []);

        const matched = items.find(item => 
          (item.domain && item.domain.toLowerCase() === domain.toLowerCase()) ||
          (item.name && item.name.toLowerCase() === schoolName.toLowerCase()) ||
          (school.umamiSiteId && item.id === school.umamiSiteId)
        );

        if (matched?.id) {
          matchedSiteId = matched.id;
          // If domain name in Umami is different from current clean domain, update it
          if (matched.domain !== domain) {
            fetch(`${host}/api/websites/${matched.id}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name: schoolName, domain: domain })
            }).catch(() => {});
          }
        }
      }
    } catch (searchErr) {
      console.warn(`[UMAMI] Search error for ${domain}:`, searchErr.message);
    }

    // 3. If website does NOT exist in Umami (e.g. was deleted or never created), CREATE IT on the fly
    if (!matchedSiteId) {
      console.log(`🌐 [UMAMI] Website missing in Umami for "${schoolName}" (${domain}). Creating on the fly...`);
      const createRes = await fetch(`${host}/api/websites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: schoolName,
          domain: domain
        })
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(errJson.message || `Error creando website en Umami (HTTP ${createRes.status})`);
      }

      const createData = await createRes.json();
      matchedSiteId = createData.id || createData.data?.id;
      console.log(`🎉 [UMAMI] Created new website in Umami for ${schoolName} (${domain}) -> Site ID: ${matchedSiteId}`);
    }

    // 4. Update memory & PostgreSQL if changed
    if (matchedSiteId) {
      school.umamiSiteId = matchedSiteId;
      if (prisma) {
        await prisma.school.update({
          where: { id: school.id },
          data: { umamiSiteId: matchedSiteId }
        }).catch(dbErr => {
          console.warn(`[UMAMI] Warning updating school umamiSiteId in DB:`, dbErr.message);
        });
      }
      return matchedSiteId;
    }

    return null;
  } catch (err) {
    console.error(`❌ [UMAMI ERROR] ensureSchoolUmamiSiteId failed for school ${school.id}:`, err.message);
    return school.umamiSiteId || null;
  } finally {
    // 5. Release Redis lock
    if (redisClient && lockAcquired) {
      try {
        await redisClient.del(lockKey);
      } catch (delErr) {
        console.warn(`[UMAMI REDIS LOCK DEL ERROR]`, delErr.message);
      }
    }
  }
}
