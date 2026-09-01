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
  x: string;
  y: number;
}

export type MetricType = 'path' | 'url' | 'referrer' | 'browser' | 'os' | 'device' | 'country' | 'city' | 'language';

export interface TrafficSummaryResponse {
  success: boolean;
  siteId: string | null;
  timeframe: string;
  activeVisitors: number;
  stats: UmamiStats | null;
  chartData: { time: string; views: number }[];
  devices: { device: string; rawType: string; percentage: number; count: number }[];
  topPages: { path: string; views: number }[];
  countries: { country: string; percentage: number; count: number }[];
  error?: string;
}

/**
 * BFF Client helper to fetch analytics securely from server backend
 */
export async function fetchSchoolTrafficSummary(timeframe: string = '24h'): Promise<TrafficSummaryResponse> {
  const res = await fetch(`/api/schools/current/traffic/summary?timeframe=${encodeURIComponent(timeframe)}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
