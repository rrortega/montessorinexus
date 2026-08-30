/**
 * Frontend FX / Exchange Rate Utility
 */

let cachedRates: Record<string, number> | null = null;
let lastFetchTime = 0;
const TTL = 3600 * 1000; // 1 hour

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  MXN: 17.02,
  EUR: 0.92,
  COP: 4100,
  ARS: 1200,
  CLP: 950,
  PEN: 3.75,
  BRL: 5.6
};

export async function fetchExchangeRates(forceRefresh = false): Promise<Record<string, number>> {
  const now = Date.now();
  if (!forceRefresh && cachedRates && (now - lastFetchTime) < TTL) {
    return cachedRates;
  }

  // Try fetching from backend API first
  try {
    const res = await fetch('/api/fx/rates?base=USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        cachedRates = data.rates;
        lastFetchTime = now;
        try {
          sessionStorage.setItem('nexus_fx_rates', JSON.stringify(data.rates));
          sessionStorage.setItem('nexus_fx_rates_time', String(now));
        } catch {}
        return cachedRates!;
      }
    }
  } catch {
    // fallback to direct open API
    try {
      const directRes = await fetch('https://open.er-api.com/v6/latest/USD');
      if (directRes.ok) {
        const data = await directRes.json();
        if (data && data.rates) {
          cachedRates = data.rates;
          lastFetchTime = now;
          return cachedRates!;
        }
      }
    } catch {}
  }

  // If network failed, check sessionStorage
  try {
    const stored = sessionStorage.getItem('nexus_fx_rates');
    if (stored) {
      cachedRates = JSON.parse(stored);
      return cachedRates!;
    }
  } catch {}

  return cachedRates || FALLBACK_RATES;
}

export async function getExchangeRateForCurrency(targetCurrency = 'USD'): Promise<number> {
  const code = (targetCurrency || 'USD').toUpperCase();
  if (code === 'USD') return 1;
  const rates = await fetchExchangeRates();
  return rates[code] || FALLBACK_RATES[code] || 1;
}

/**
 * Format currency amount with symbol and code
 */
export function formatCurrencyPrice(amount: number, currency = 'USD', symbol = '$'): string {
  const code = (currency || 'USD').toUpperCase();
  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);

  return `${symbol}${formatted} ${code}`;
}
