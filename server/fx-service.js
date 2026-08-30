/**
 * FX / Exchange Rate Service
 * Fetches real-time exchange rates with in-memory caching and resilient fallback.
 */

let cachedRates = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 3600 * 1000; // 1 hour

const FALLBACK_RATES = {
  USD: 1,
  MXN: 18.5,
  EUR: 0.92,
  COP: 4100,
  ARS: 1200,
  CLP: 950,
  PEN: 3.75,
  BRL: 5.6
};

/**
 * Fetches latest exchange rates with USD base.
 */
export async function getExchangeRates(base = 'USD') {
  const now = Date.now();
  if (cachedRates && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedRates;
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!res.ok) {
      throw new Error(`Open ER API error: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.rates) {
      cachedRates = data.rates;
      lastFetchTime = now;
      console.log(`💱 [FX SERVICE] Updated exchange rates (1 USD = ${data.rates.MXN} MXN).`);
      return cachedRates;
    }
  } catch (err) {
    console.warn('[FX SERVICE WARNING] Failed to fetch live exchange rate from primary source:', err.message);
    try {
      const fallbackRes = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data && data.rates) {
          cachedRates = data.rates;
          lastFetchTime = now;
          return cachedRates;
        }
      }
    } catch (fbErr) {
      console.warn('[FX SERVICE WARNING] Fallback FX API also failed:', fbErr.message);
    }
  }

  return cachedRates || FALLBACK_RATES;
}

/**
 * Gets exchange rate from USD to target currency.
 */
export async function getUsdExchangeRate(targetCurrency = 'USD') {
  const code = (targetCurrency || 'USD').toUpperCase();
  if (code === 'USD') return 1;

  const rates = await getExchangeRates('USD');
  const rate = rates[code];
  if (typeof rate === 'number' && rate > 0) {
    return rate;
  }

  return FALLBACK_RATES[code] || 1;
}
