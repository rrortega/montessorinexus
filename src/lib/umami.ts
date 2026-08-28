export interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  comparison?: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totaltime: number;
  };
}

export interface UmamiPageviewPoint {
  x: string;
  y: number;
}

export interface UmamiMetricItem {
  x: string; // e.g. "desktop", "mobile", "/documentos"
  y: number; // e.g. count
}

export type MetricType = 'path' | 'url' | 'referrer' | 'browser' | 'os' | 'device' | 'country' | 'city' | 'language';

export class UmamiClient {
  private host: string;
  private token: string | null = null;

  constructor(host?: string) {
    let cleanHost = (host || import.meta.env.VITE_UMAMI_HOST || 'https://analytics.chamba.pro').trim();
    if (cleanHost.endsWith('/')) {
      cleanHost = cleanHost.slice(0, -1);
    }
    this.host = cleanHost;
  }

  async login(username?: string, password?: string): Promise<string> {
    const user = username || import.meta.env.VITE_UMAMI_USERNAME;
    const pass = password || import.meta.env.VITE_UMAMI_PASSWORD;

    if (!user || !pass) {
      throw new Error('Faltan credenciales VITE_UMAMI_USERNAME o VITE_UMAMI_PASSWORD.');
    }

    const res = await fetch(`${this.host}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: user, password: pass }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Error de autenticación Umami (${res.status})`);
    }

    const data = await res.json();
    const token = data.token || data.jwt;
    if (!token) {
      throw new Error('Respuesta de autenticación sin token JWT.');
    }

    this.token = token;
    return token;
  }

  private async fetchAuth(url: string) {
    if (!this.token) {
      await this.login();
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 401) {
      // Re-try login once if token expired
      await this.login();
      return fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    return res;
  }

  // GET /api/websites/:websiteId/active (Current live active visitors)
  async getActiveVisitors(siteId?: string): Promise<number> {
    const sid = siteId || import.meta.env.VITE_UMAMI_SITE_ID;
    const res = await this.fetchAuth(`${this.host}/api/websites/${sid}/active`);
    if (!res.ok) return 0;
    const data = await res.json();
    if (typeof data === 'number') return data;
    if (Array.isArray(data)) return data.length;
    if (data && typeof data.x === 'number') return data.x;
    return data?.visitors || data?.count || 0;
  }

  // GET /api/websites/:websiteId/stats
  async getWebsiteStats(siteId?: string, startAt?: number, endAt?: number): Promise<UmamiStats> {
    const sid = siteId || import.meta.env.VITE_UMAMI_SITE_ID;
    const now = Date.now();
    const start = startAt || now - 24 * 60 * 60 * 1000;
    const end = endAt || now;

    const res = await this.fetchAuth(`${this.host}/api/websites/${sid}/stats?startAt=${start}&endAt=${end}`);
    if (!res.ok) {
      throw new Error(`Error obteniendo estadísticas: HTTP ${res.status}`);
    }
    return res.json();
  }

  // GET /api/websites/:websiteId/pageviews (Supports unit: minute, hour, day, month, year)
  async getPageviews(
    siteId?: string, 
    startAt?: number, 
    endAt?: number, 
    unit: 'minute' | 'hour' | 'day' | 'month' | 'year' = 'hour'
  ): Promise<{ pageviews: UmamiPageviewPoint[]; sessions: UmamiPageviewPoint[] }> {
    const sid = siteId || import.meta.env.VITE_UMAMI_SITE_ID;
    const now = Date.now();
    const start = startAt || now - 24 * 60 * 60 * 1000;
    const end = endAt || now;

    const res = await this.fetchAuth(`${this.host}/api/websites/${sid}/pageviews?startAt=${start}&endAt=${end}&unit=${unit}`);
    if (!res.ok) {
      throw new Error(`Error obteniendo vistas de página: HTTP ${res.status}`);
    }
    return res.json();
  }

  // GET /api/websites/:websiteId/metrics (Supports path, referrer, browser, os, device, country, city, language)
  async getMetrics(
    siteId?: string, 
    type: MetricType = 'device', 
    startAt?: number, 
    endAt?: number
  ): Promise<UmamiMetricItem[]> {
    const sid = siteId || import.meta.env.VITE_UMAMI_SITE_ID;
    const now = Date.now();
    const start = startAt || now - 24 * 60 * 60 * 1000;
    const end = endAt || now;
    const apiType = type === 'url' ? 'path' : type;

    const res = await this.fetchAuth(`${this.host}/api/websites/${sid}/metrics?startAt=${start}&endAt=${end}&type=${apiType}`);
    if (!res.ok) {
      throw new Error(`Error obteniendo métricas (${type}): HTTP ${res.status}`);
    }
    return res.json();
  }
}
