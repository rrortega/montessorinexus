import { chromium } from 'playwright';
import { Hyperbrowser } from '@hyperbrowser/sdk';
import fs from 'fs';

/**
 * Parses details from a CURP string to generate realistic mock fallback data.
 * Useful for development and bypass of CAPTCHA blocks.
 * 
 * @param {string} curpStr 
 * @returns {any}
 */
export function parseCurpDetailsLocal(curpStr) {
  try {
    const yearStr = curpStr.substring(4, 6);
    const monthStr = curpStr.substring(6, 8);
    const dayStr = curpStr.substring(8, 10);
    const genderChar = curpStr.substring(10, 11);
    const stateCode = curpStr.substring(11, 13);

    // Determine year prefix based on the 17th character (index 16)
    // Digits 0-9 indicate 1900-1999, letters A-Z indicate 2000-2099.
    const isCentury21 = isNaN(parseInt(curpStr[16], 10));
    const year = isCentury21 ? `20${yearStr}` : `19${yearStr}`;
    const fecha = `${dayStr}/${monthStr}/${year}`;
    const sexo = genderChar === 'H' ? 'HOMBRE' : 'MUJER';

    // Map states
    const statesMap = {
      'AS': 'AGUASCALIENTES', 'BC': 'BAJA CALIFORNIA', 'BS': 'BAJA CALIFORNIA SUR',
      'CC': 'CAMPECHE', 'CL': 'COAHUILA', 'CM': 'COLIMA', 'CS': 'CHIAPAS', 'CH': 'CHIHUAHUA',
      'DF': 'DISTRITO FEDERAL', 'DG': 'DURANGO', 'GT': 'GUANAJUATO', 'GR': 'GUERRERO',
      'HG': 'HIDALGO', 'JC': 'JALISCO', 'MC': 'MEXICO', 'MN': 'MICHOACAN', 'MS': 'MORELOS',
      'NT': 'NAYARIT', 'NL': 'NUEVO LEON', 'OC': 'OAXACA', 'PL': 'PUEBLA', 'QT': 'QUERETARO',
      'QR': 'QUINTANA ROO', 'SP': 'SAN LUIS POTOSI', 'SL': 'SINALOA', 'SR': 'SONORA',
      'TC': 'TABASCO', 'TS': 'TAMAULIPAS', 'TL': 'TLAXCALA', 'VZ': 'VERACRUZ', 'YN': 'YUCATAN',
      'ZS': 'ZACATECAS', 'NE': 'NACIDO EN EL EXTRANJERO'
    };

    const estado = statesMap[stateCode] || 'DESCONOCIDO';

    return {
      curp: curpStr,
      nombre: null,
      apellidoPaterno: null,
      apellidoMaterno: null,
      fechaNacimiento: fecha,
      sexo,
      estadoNacimiento: estado,
      isExtranjero: stateCode === 'NE',
      status: 'FALLBACK_LOCAL'
    };
  } catch (e) {
    return null;
  }
}

/**
 * Solves reCAPTCHA v2 using NoCaptchaAI API (async createTask -> getTaskResult flow).
 * 
 * @param {string} sitekey 
 * @param {string} url 
 * @param {string} apiKey 
 * @returns {Promise<string>}
 */
async function solveRecaptchaNoCaptchaAI(sitekey, url, apiKey) {
  console.log(`[NOCAPTCHAAI] Creating task for sitekey: ${sitekey} on ${url}`);

  const createResponse = await fetch('https://api.nocaptchaai.com/createTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientKey: apiKey,
      task: {
        type: "ReCaptchaV2TaskProxyLess",
        websiteURL: url,
        websiteKey: sitekey
      }
    })
  });

  const createData = await createResponse.json();
  if (createData.errorId !== 0 || !createData.taskId) {
    throw new Error(createData.errorDescription || `Error al crear tarea (código: ${createData.errorId})`);
  }

  const taskId = createData.taskId;
  console.log(`[NOCAPTCHAAI] Task created successfully. Task ID: ${taskId}. Polling for solution...`);

  const maxAttempts = 15; // Polling limit of ~30 seconds to allow complete captcha resolution
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const resultResponse = await fetch('https://api.nocaptchaai.com/getTaskResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: apiKey,
        taskId: taskId
      })
    });

    const resultData = await resultResponse.json();
    if (resultData.errorId !== 0) {
      throw new Error(resultData.errorDescription || `Error al obtener resultado (código: ${resultData.errorId})`);
    }

    if (resultData.status === 'ready') {
      console.log(`[NOCAPTCHAAI] Captcha solved in attempt ${attempt}!`);
      return resultData.solution.token;
    }

    if (resultData.status === 'failed') {
      throw new Error('NoCaptchaAI informó que la resolución falló.');
    }

    console.log(`[NOCAPTCHAAI] Polling attempt ${attempt}/${maxAttempts}. Status: ${resultData.status}...`);
  }

  throw new Error('Excedido el tiempo de espera (timeout) en NoCaptchaAI.');
}

/**
 * Smoothly scrolls the page toward a target element with dynamic, randomized human-like easing steps.
 * 
 * @param {import('playwright').Page} page 
 * @param {string} targetSelector 
 */
async function smoothScrollToElement(page, targetSelector) {
  try {
    const el = await page.$(targetSelector);
    if (!el) return;
    const box = await el.boundingBox();
    if (!box) return;

    const currentScrollY = await page.evaluate(() => window.scrollY || window.pageYOffset || 0);
    // Randomized viewport vertical offset (140px to 220px)
    const randomOffset = 140 + Math.floor(Math.random() * 80);
    const targetY = Math.max(0, currentScrollY + box.y - randomOffset);
    const totalDist = targetY - currentScrollY;

    if (Math.abs(totalDist) < 10) return;

    // Randomize step count between 16 and 26 steps for variation
    const steps = 16 + Math.floor(Math.random() * 10);
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      // Cubic ease-out with slight randomized jitter
      const ease = 1 - Math.pow(1 - progress, 3);
      const stepY = currentScrollY + totalDist * ease;
      await page.evaluate((y) => window.scrollTo(0, y), stepY);
      await page.waitForTimeout(20 + Math.floor(Math.random() * 25));
    }

    // 40% chance of subtle human scanning micro-reverse scroll
    if (Math.random() < 0.4) {
      await page.waitForTimeout(200 + Math.floor(Math.random() * 200));
      const microReverse = 15 + Math.floor(Math.random() * 25);
      await page.evaluate((rev) => window.scrollBy({ top: -rev, behavior: 'smooth' }), microReverse);
      await page.waitForTimeout(250);
    }

    console.log(`[CURP SCRAPER] Dynamically scrolled towards ${targetSelector} (${steps} steps, total: ${Math.round(totalDist)}px).`);
  } catch (err) {
    // Ignore scroll errors
  }
}

/**
 * Types the CURP dynamically using varied human behaviors to prevent fingerprinting.
 * Alternates randomly between typing strategies per request.
 * 
 * @param {import('playwright').Page} page 
 * @param {string} targetSelector 
 * @param {string} curp 
 */
/**
 * Types the CURP dynamically using varied human behaviors to prevent fingerprinting.
 * Alternates randomly between typing strategies per request / pattern.
 * 
 * @param {import('playwright').Page} page 
 * @param {string} targetSelector 
 * @param {string} curp 
 * @param {number} mode
 */
async function dynamicHumanTyping(page, targetSelector, curp, mode = 0) {
  console.log(`[CURP SCRAPER] Executing human typing strategy Mode ${mode}...`);

  await page.click(targetSelector);
  await page.waitForTimeout(150 + Math.floor(Math.random() * 150));

  if (mode === 0) {
    // Mode 0: Type first part, make deliberate typo, backspace, and finish
    const splitPoint = 5 + Math.floor(Math.random() * 5);
    const firstPart = curp.substring(0, splitPoint);
    const restPart = curp.substring(splitPoint);
    
    // Type first chunk
    for (const char of firstPart) {
      await page.keyboard.type(char, { delay: 35 + Math.floor(Math.random() * 45) });
    }
    // Typo keystroke
    const typoChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    await page.keyboard.type(typoChar, { delay: 50 });
    await page.waitForTimeout(220 + Math.floor(Math.random() * 180));
    // Backspace correction
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(180 + Math.floor(Math.random() * 140));
    // Type remaining characters
    for (const char of restPart) {
      await page.keyboard.type(char, { delay: 35 + Math.floor(Math.random() * 45) });
    }
  } else if (mode === 1) {
    // Mode 1: Segmented typing (Name code -> Birthdate -> Homoclave) with human reading pauses
    const p1 = curp.substring(0, 4);   // 4 letters
    const p2 = curp.substring(4, 10);  // 6 digits birthdate
    const p3 = curp.substring(10);     // 8 chars homoclave/gender/state

    for (const char of p1) await page.keyboard.type(char, { delay: 40 + Math.floor(Math.random() * 40) });
    await page.waitForTimeout(200 + Math.floor(Math.random() * 150));
    for (const char of p2) await page.keyboard.type(char, { delay: 35 + Math.floor(Math.random() * 40) });
    await page.waitForTimeout(180 + Math.floor(Math.random() * 140));
    for (const char of p3) await page.keyboard.type(char, { delay: 40 + Math.floor(Math.random() * 40) });
  } else if (mode === 2) {
    // Mode 2: Paste simulation + cursor arrow key triggers
    await page.fill(targetSelector, curp);
    await page.waitForTimeout(200 + Math.floor(Math.random() * 100));
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(80);
  } else {
    // Mode 3: Continuous organic cadence with keystroke jitter and intermittent micro-pauses
    for (const char of curp) {
      const delay = (char >= '0' && char <= '9') ? (45 + Math.floor(Math.random() * 35)) : (35 + Math.floor(Math.random() * 50));
      await page.keyboard.type(char, { delay });
      if (Math.random() < 0.15) {
        await page.waitForTimeout(100 + Math.floor(Math.random() * 120));
      }
    }
  }

  // Ensure Ember.js event loop registers the input
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, targetSelector);
}

/**
 * Runs a single scrape attempt against the official portal with a specific pattern.
 *
 * @param {string} curp
 * @param {number} attemptIndex 1, 2, or 3
 * @param {any} options
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
async function runSingleScrapeAttempt(curp, attemptIndex, options = {}) {
  let browser = null;
  let hyperbrowserClient = null;
  let sessionId = null;
  const startTime = Date.now();

  // Pattern Configurations for attempts 1, 2, 3
  const patterns = [
    {
      name: 'Patrón 1 (Orgánico Mac / Hover suave / Delay 5.5s)',
      typingMode: 0,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      platform: '"macOS"',
      settleDelay: 5500,
      clickMethod: 'smooth_hover',
      resultTimeout: 14000
    },
    {
      name: 'Patrón 2 (Segmentado Windows / Click directo + Enter / Delay 4.0s)',
      typingMode: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      platform: '"Windows"',
      settleDelay: 4000,
      clickMethod: 'direct_and_enter',
      resultTimeout: 14000
    },
    {
      name: 'Patrón 3 (Directo / Event Dispatch / Delay 3.0s)',
      typingMode: 2,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      platform: '"Linux"',
      settleDelay: 3000,
      clickMethod: 'form_dispatch',
      resultTimeout: 14000
    }
  ];

  const currentPattern = patterns[(attemptIndex - 1) % patterns.length];
  console.log(`\n======================================================`);
  console.log(`[CURP SCRAPER] 🚀 INICIANDO INTENTO ${attemptIndex}/3: ${currentPattern.name}`);
  console.log(`======================================================`);

  try {
    const hyperApiKey = process.env.HYPERBROWSER_API_KEY;
    const nocaptchaApiKey = process.env.NOCAPTCHA_API_KEY;

    if (hyperApiKey && !nocaptchaApiKey) {
      console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Abriendo sesión cloud Hyperbrowser...`);
      hyperbrowserClient = new Hyperbrowser({ apiKey: hyperApiKey });
      try {
        const session = await hyperbrowserClient.sessions.create({ solveCaptchas: true });
        sessionId = session.id;
        browser = await chromium.connectOverCDP(session.wsEndpoint);
      } catch (hbErr) {
        if (hbErr.message.includes('Free plan') || hbErr.message.includes('solving captchas') || hbErr.message.includes('plan')) {
          console.warn(`[CURP SCRAPER] [Intento ${attemptIndex}] Hyperbrowser Free plan detectado. Reintentando solveCaptchas: false...`);
          const session = await hyperbrowserClient.sessions.create({ solveCaptchas: false });
          sessionId = session.id;
          browser = await chromium.connectOverCDP(session.wsEndpoint);
        } else {
          throw hbErr;
        }
      }
    } else {
      console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Lanzando nueva instancia fresca de Playwright Chromium...`);
      const isHeadless = process.env.PLAYWRIGHT_HEADLESS === 'true';
      browser = await chromium.launch({
        headless: isHeadless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });
    }

    const context = (hyperApiKey && !nocaptchaApiKey)
      ? browser.contexts()[0]
      : await browser.newContext({
        viewport: { width: 1366, height: 768 },
        acceptDownloads: true,
        userAgent: currentPattern.userAgent,
        locale: 'es-MX',
        timezoneId: 'America/Mexico_City',
        extraHTTPHeaders: {
          'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
          'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': currentPattern.platform
        }
      });

    const page = (hyperApiKey && !nocaptchaApiKey)
      ? (context.pages()[0] || await context.newPage())
      : await context.newPage();

    // Stealth script
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'languages', { get: () => ['es-MX', 'es', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });

    // Navigate to Gob.mx CURP
    console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Navegando a https://www.gob.mx/curp/...`);
    await page.goto('https://www.gob.mx/curp/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for CURP input
    console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Esperando input #curpinput...`);
    await page.waitForSelector('input#curpinput', { timeout: 35000 });

    // Scroll slightly
    try {
      await page.evaluate(() => {
        window.scrollBy({ top: 120 + Math.floor(Math.random() * 60), behavior: 'smooth' });
      });
      await page.waitForTimeout(200);
    } catch {
      // ignore
    }

    // Type CURP with current pattern's mode
    await dynamicHumanTyping(page, 'input#curpinput', curp, currentPattern.typingMode);
    console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] CURP escrita.`);

    // Captcha handling
    let hasCaptcha = false;
    try {
      await page.waitForSelector('iframe[src*="recaptcha"], .g-recaptcha', { timeout: 3000 });
      hasCaptcha = true;
    } catch {
      hasCaptcha = await page.evaluate(() => {
        return !!document.querySelector('.g-recaptcha, iframe[src*="recaptcha"], [data-sitekey]');
      });
    }

    if (hasCaptcha && nocaptchaApiKey) {
      console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] CAPTCHA detectado. Resolviendo con NoCaptchaAI...`);
      const sitekey = await page.evaluate(() => {
        const el = document.querySelector('.g-recaptcha, [data-sitekey]');
        if (el) return el.getAttribute('data-sitekey');
        const iframe = document.querySelector('iframe[src*="recaptcha"]');
        if (iframe) {
          const src = iframe.getAttribute('src');
          const match = src.match(/k=([^&]+)/);
          if (match) return match[1];
        }
        return null;
      });

      if (sitekey) {
        try {
          const token = await solveRecaptchaNoCaptchaAI(sitekey, page.url(), nocaptchaApiKey);
          await page.evaluate((solToken) => {
            const textareas = document.querySelectorAll('textarea[id^="g-recaptcha-response"], [name="g-recaptcha-response"]');
            textareas.forEach(ta => {
              ta.value = solToken;
              ta.dispatchEvent(new Event('input', { bubbles: true }));
              ta.dispatchEvent(new Event('change', { bubbles: true }));
            });
            if (window.grecaptcha) {
              if (window.grecaptcha.enterprise) window.grecaptcha.enterprise.getResponse = () => solToken;
              window.grecaptcha.getResponse = () => solToken;
            }
          }, token);

          const callbackName = await page.evaluate(() => {
            const el = document.querySelector('[data-callback]');
            return el ? el.getAttribute('data-callback') : null;
          });
          if (callbackName) {
            await page.evaluate((cbName) => {
              if (typeof window[cbName] === 'function') window[cbName]();
            }, callbackName);
          }
          console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Token inyectado.`);
        } catch (solveErr) {
          console.warn(`[CURP SCRAPER] [Intento ${attemptIndex}] NoCaptchaAI error: ${solveErr.message}`);
        }
      }
    }

    // Scroll to search button
    await smoothScrollToElement(page, 'button#searchButton, button[type="submit"]');

    // Settle pause
    console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Pausa de telemetría (${(currentPattern.settleDelay / 1000).toFixed(1)}s)...`);
    await page.waitForTimeout(currentPattern.settleDelay);

    // Click search button using pattern strategy
    const searchBtn = await page.$('button#searchButton, button[type="submit"]');
    if (searchBtn) {
      if (currentPattern.clickMethod === 'smooth_hover') {
        try {
          const box = await searchBtn.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
            await page.waitForTimeout(400);
          }
        } catch {
          // ignore
        }
        await searchBtn.click();
      } else if (currentPattern.clickMethod === 'direct_and_enter') {
        await searchBtn.click();
        // Also trigger Enter on the input if Ember event missed
        await page.waitForTimeout(300);
        try {
          await page.focus('input#curpinput');
          await page.keyboard.press('Enter');
        } catch {
          // ignore
        }
      } else {
        // Form dispatch method
        await page.evaluate(() => {
          const btn = document.querySelector('button#searchButton, button[type="submit"]');
          if (btn) {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          }
        });
      }
    } else {
      await page.click('button[type="submit"]');
    }
    console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Botón Buscar presionado. Monitoreando transición / resultados (Timeout: ${currentPattern.resultTimeout / 1000}s)...`);

    // Wait for results table OR error alert with fast timeout to detect freezes
    let extractedData = null;
    try {
      await page.waitForFunction(() => {
        const hasTable = !!document.querySelector('table tr, .table tr, tr');
        const hasError = !!document.querySelector('.alert-danger, .alert-warning, .has-error');
        return hasTable || hasError;
      }, { timeout: currentPattern.resultTimeout });

      // Extract table rows
      extractedData = await page.evaluate(() => {
        const result = {};
        const rows = Array.from(document.querySelectorAll('table tr, .table tr, tr'));
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          if (cells.length >= 2) {
            const keyRaw = cells[0].textContent.trim().toLowerCase();
            const value = cells[1].textContent.trim();
            const keyClean = keyRaw.replace(/:/g, '').trim();
            if (keyClean.includes('curp')) result.curp = value;
            else if (keyClean.includes('nombre')) result.nombre = value;
            else if (keyClean.includes('primer apellido') || keyClean.includes('paterno')) result.apellidoPaterno = value;
            else if (keyClean.includes('segundo apellido') || keyClean.includes('materno')) result.apellidoMaterno = value;
            else if (keyClean.includes('fecha de nacimiento') || keyClean === 'fecha nacimiento') result.fechaNacimiento = value;
            else if (keyClean.includes('sexo')) result.sexo = value;
            else if (keyClean.includes('entidad de nacimiento') || keyClean === 'entidad nacimiento') result.estadoNacimiento = value;
            else if (keyClean.includes('nacionalidad')) result.nacionalidad = value;
            else if (keyClean.includes('documento probatorio')) result.documentoProbatorio = value;
            else if (keyClean.includes('año registro') || keyClean.includes('año de registro')) result.anioRegistro = value;
            else if (keyClean.includes('número de acta') || keyClean.includes('numero de acta') || keyClean.includes('acta')) result.numActa = value;
            else if (keyClean.includes('entidad de registro') || keyClean.includes('entidad registro')) result.entidadRegistro = value;
            else if (keyClean.includes('municipio de registro') || keyClean.includes('municipio registro')) result.municipioRegistro = value;
          }
        });
        return result;
      });
    } catch (waitErr) {
      console.warn(`[CURP SCRAPER] ⚠️ [Intento ${attemptIndex}] La página se quedó frizada/demoró más de ${currentPattern.resultTimeout / 1000}s tras el click.`);
      throw new Error(`FREEZE_TIMEOUT: La página de RENAPO no cargó la tabla de resultados tras hacer clic en Buscar.`);
    }

    if (extractedData && (extractedData.nombre || extractedData.curp)) {
      console.log(`✅ [CURP SCRAPER] [Intento ${attemptIndex}] ¡Datos extraídos con éxito! (${Date.now() - startTime}ms):`, extractedData);

      // Fast early callback: emit success immediately to the frontend
      if (typeof options.onDataExtracted === 'function') {
        try {
          options.onDataExtracted(extractedData);
        } catch (cbErr) {
          console.warn('[CURP SCRAPER] onDataExtracted callback error:', cbErr.message);
        }
      }

      // Background PDF download attempt
      let pdfBase64 = null;
      try {
        console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Intentando descarga del PDF oficial...`);
        let pdfBuffer = null;

        const responseHandler = async (res) => {
          try {
            const headers = res.headers();
            const ct = headers['content-type'] || '';
            const url = res.url();
            if (ct.includes('application/pdf') || url.includes('.pdf') || headers['content-disposition']?.includes('.pdf')) {
              const body = await res.body();
              if (body && body.length > 500) pdfBuffer = body;
            }
          } catch {
            // ignore
          }
        };
        page.on('response', responseHandler);

        const downloadHandler = async (download) => {
          try {
            const stream = await download.createReadStream();
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            pdfBuffer = Buffer.concat(chunks);
          } catch {
            // ignore
          }
        };
        page.on('download', downloadHandler);

        const downloadBtn = await page.waitForSelector(
          '#download, button#download, button:has-text("Descargar"), a:has-text("Descargar")',
          { timeout: 8000 }
        ).catch(() => null);

        if (downloadBtn) {
          await downloadBtn.scrollIntoViewIfNeeded();
          await downloadBtn.click();

          for (let poll = 0; poll < 20; poll++) {
            const domHref = await page.evaluate(() => {
              const dwnldLnk = document.getElementById('dwnldLnk') || document.querySelector('a#dwnldLnk, a[download*="curp"]');
              if (dwnldLnk) {
                const h = dwnldLnk.getAttribute('href') || dwnldLnk.href || '';
                if (h.includes('base64') && (h.includes('pdf') || h.startsWith('data:'))) return h;
              }
              return null;
            });

            if (domHref) {
              pdfBase64 = domHref.replace(/^data:[^;]+;base64,/, '');
              break;
            }
            if (pdfBuffer && pdfBuffer.length > 0) {
              pdfBase64 = pdfBuffer.toString('base64');
              break;
            }
            await page.waitForTimeout(300);
          }
        }
      } catch (pdfErr) {
        console.warn(`[CURP SCRAPER] [Intento ${attemptIndex}] Error en PDF opcional:`, pdfErr.message);
      }

      return {
        success: true,
        data: {
          ...extractedData,
          pdfBase64,
          status: 'VERIFICADO_OFICIAL'
        }
      };
    }

    throw new Error('No se encontraron datos de ciudadano en la tabla.');
  } finally {
    if (browser) {
      try {
        console.log(`[CURP SCRAPER] [Intento ${attemptIndex}] Cerrando navegador...`);
        await browser.close();
      } catch {
        // ignore
      }
    }
    if (hyperbrowserClient && sessionId) {
      try {
        await hyperbrowserClient.sessions.stop(sessionId);
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Navigates to the official Mexican government CURP lookup portal and
 * attempts to scrape the details for a CURP with up to 3 automatic retries,
 * opening a fresh browser and changing patterns on freeze/timeout.
 * Falls back to local parsing if all attempts are exhausted.
 * 
 * @param {string} curp 
 * @param {any} options
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export async function scrapeCurp(curp, options = {}) {
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await runSingleScrapeAttempt(curp, attempt, options);
      if (result.success) {
        return result;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[CURP SCRAPER] ❌ Intento ${attempt}/${maxAttempts} falló o se frizó: ${err.message}`);

      if (attempt < maxAttempts) {
        console.log(`🔄 [CURP SCRAPER] Reiniciando proceso: Abriendo nuevo navegador con patrón alternativo (Intento ${attempt + 1}/${maxAttempts})...\n`);
        await new Promise(res => setTimeout(res, 1200)); // Short pause between browser launches
      }
    }
  }

  console.warn(`[CURP SCRAPER] Agotados los ${maxAttempts} intentos. Aplicando fallback local deducido.`);
  const fallback = parseCurpDetailsLocal(curp);
  return {
    success: false,
    error: lastError ? `Falla tras ${maxAttempts} intentos: ${lastError.message}` : 'No se pudo validar ante RENAPO.',
    data: fallback
  };
}
