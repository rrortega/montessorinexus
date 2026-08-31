import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  Globe,
  Smartphone,
  Laptop
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { UmamiClient, UmamiStats, UmamiPageviewPoint, UmamiMetricItem } from '@/lib/umami';
import { WorldMapMetrics, CountryMetric } from '@/components/admin/WorldMapMetrics';
import { useAuth } from '@/context/AuthContext';

// Fallback metrics if initial load or network offline
const fallbackTrafficData = [
  { time: '00:00', views: 42, visitors: 18 },
  { time: '04:00', views: 15, visitors: 8 },
  { time: '08:00', views: 120, visitors: 65 },
  { time: '12:00', views: 240, visitors: 110 },
  { time: '16:00', views: 310, visitors: 145 },
  { time: '20:00', views: 185, visitors: 90 },
];

const fallbackDevicesData = [
  { device: 'Móvil', percentage: 62, icon: Smartphone },
  { device: 'Escritorio', percentage: 34, icon: Laptop },
  { device: 'Tablet', percentage: 4, icon: Globe },
];

const fallbackTopPages = [
  { path: '/', views: 1240 },
  { path: '/documentos', views: 580 },
  { path: '/#admisiones', views: 410 },
];

type TimeFrame = '24h' | '7d' | '30d' | '90d' | '1y';

export const WebTrafficSection: React.FC = () => {
  const { activeMembership } = useAuth();
  const school = activeMembership?.school;

  const envHost = import.meta.env.VITE_UMAMI_HOST || 'https://analytics.chamba.pro';
  const envUser = import.meta.env.VITE_UMAMI_USERNAME || 'montessorinexus';
  const envPass = import.meta.env.VITE_UMAMI_PASSWORD || 'L4cl4v3c31b4';

  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');
  const [loading, setLoading] = useState(false);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(school?.umamiSiteId || null);

  // Live Metrics
  const [activeVisitors, setActiveVisitors] = useState<number>(0);
  const [stats, setStats] = useState<UmamiStats | null>(null);
  const [chartData, setChartData] = useState<{ time: string; views: number }[]>(fallbackTrafficData);
  const [devicesData, setDevicesData] = useState<{ device: string; percentage: number; icon: any }[]>(fallbackDevicesData);
  const [topPages, setTopPages] = useState<{ path: string; views: number }[]>(fallbackTopPages);
  const [countryData, setCountryData] = useState<CountryMetric[]>([]);

  const resolveSchoolSiteId = async (): Promise<string | null> => {
    if (currentSiteId) return currentSiteId;
    if (school?.umamiSiteId) {
      setCurrentSiteId(school.umamiSiteId);
      return school.umamiSiteId;
    }
    try {
      const res = await fetch('/api/schools/current/umami-site');
      if (res.ok) {
        const data = await res.json();
        if (data.umamiSiteId) {
          setCurrentSiteId(data.umamiSiteId);
          return data.umamiSiteId;
        }
      }
    } catch (e) {
      console.warn('Error resolviendo umamiSiteId en el servidor:', e);
    }
    return null;
  };

  const fetchTrafficData = async (frame: TimeFrame = timeFrame) => {
    setLoading(true);

    const siteId = await resolveSchoolSiteId();
    if (!siteId) {
      setLoading(false);
      return;
    }

    const client = new UmamiClient(envHost);
    const now = Date.now();
    let startAt = now - 24 * 60 * 60 * 1000;
    let unit: 'hour' | 'day' | 'month' = 'hour';

    if (frame === '7d') {
      startAt = now - 7 * 24 * 60 * 60 * 1000;
      unit = 'day';
    } else if (frame === '30d') {
      startAt = now - 30 * 24 * 60 * 60 * 1000;
      unit = 'day';
    } else if (frame === '90d') {
      startAt = now - 90 * 24 * 60 * 60 * 1000;
      unit = 'day';
    } else if (frame === '1y') {
      startAt = now - 365 * 24 * 60 * 60 * 1000;
      unit = 'month';
    }

    try {
      // 1. Authenticate silently with environment credentials
      await client.login(envUser, envPass);

      // 2. Active visitors right now
      try {
        const activeCount = await client.getActiveVisitors(siteId);
        setActiveVisitors(activeCount);
      } catch (e) {
        console.warn('Active visitors fetch error', e);
      }

      // 3. Stats
      const statsData = await client.getWebsiteStats(siteId, startAt, now);
      setStats(statsData);

      // 4. Pageviews series
      try {
        const pvData = await client.getPageviews(siteId, startAt, now, unit);
        if (pvData && pvData.pageviews && pvData.pageviews.length > 0) {
          const formattedData = pvData.pageviews.map((pt: UmamiPageviewPoint) => {
            const dateObj = new Date(pt.x);
            let timeStr = pt.x;
            if (!isNaN(dateObj.getTime())) {
              timeStr = frame === '24h' 
                ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
            return { time: timeStr, views: pt.y };
          });
          setChartData(formattedData);
        }
      } catch (e) {
        console.warn('Pageviews chart fetch error', e);
      }

      // 5. Device metrics
      try {
        const devMetrics = await client.getMetrics(siteId, 'device', startAt, now);
        if (devMetrics && devMetrics.length > 0) {
          const total = devMetrics.reduce((acc, curr) => acc + curr.y, 0) || 1;
          const formattedDevs = devMetrics.map((item: UmamiMetricItem) => {
            const devName = item.x.toLowerCase();
            const icon = devName.includes('mobile') || devName.includes('móvil') ? Smartphone : devName.includes('tablet') ? Globe : Laptop;
            return {
              device: item.x.charAt(0).toUpperCase() + item.x.slice(1),
              percentage: Math.round((item.y / total) * 100),
              icon,
            };
          });
          setDevicesData(formattedDevs);
        }
      } catch (e) {
        console.warn('Device metrics fetch error', e);
      }

      // 6. Top pages metrics
      try {
        const pathMetrics = await client.getMetrics(siteId, 'path', startAt, now);
        if (pathMetrics && pathMetrics.length > 0) {
          const formattedPages = pathMetrics.slice(0, 5).map((item: UmamiMetricItem) => ({
            path: item.x || '/',
            views: item.y,
          }));
          setTopPages(formattedPages);
        }
      } catch (e) {
        console.warn('Path metrics fetch error', e);
      }

      // 7. Country metrics (Map)
      try {
        const countryMetrics = await client.getMetrics(siteId, 'country', startAt, now);
        if (countryMetrics && countryMetrics.length > 0) {
          const total = countryMetrics.reduce((acc, curr) => acc + curr.y, 0) || 1;
          const formattedCountries: CountryMetric[] = countryMetrics.map((item: UmamiMetricItem) => ({
            code: item.x,
            name: item.x,
            views: item.y,
            percentage: Math.round((item.y / total) * 100),
          }));
          setCountryData(formattedCountries);
        }
      } catch (e) {
        console.warn('Country metrics fetch error', e);
      }

      toast.success('Métricas actualizadas.');
    } catch (err: any) {
      console.error('Traffic metrics fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, [timeFrame]);

  const formatSeconds = (sec: number) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="space-y-6 font-body">
      
      {/* Header Banner - Full Width Edge-to-Edge without rounded corners */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 bg-gradient-to-r from-forest to-forest-light rounded-none p-5 sm:p-6 md:p-8 text-white shadow-card relative overflow-hidden border-b border-forest-light/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3">
            <MobileMenuButton />
            <div>
              <div className="flex items-center gap-2 text-white/80 text-xs uppercase tracking-wider font-semibold mb-1">
                <BarChart2 className="w-4 h-4" />
                <span>Métricas de Acceso & Tráfico Web</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight">Dashboard de Tráfico Web</h2>
              <p className="hidden sm:block text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
                Visión general en tiempo real del acceso y rendimiento de la plataforma.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe Selector Pills */}
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20">
              <button
                onClick={() => setTimeFrame('24h')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  timeFrame === '24h' ? 'bg-white text-forest shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setTimeFrame('7d')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  timeFrame === '7d' ? 'bg-white text-forest shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                7d
              </button>
              <button
                onClick={() => setTimeFrame('30d')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  timeFrame === '30d' ? 'bg-white text-forest shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                30d
              </button>
              <button
                onClick={() => setTimeFrame('90d')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  timeFrame === '90d' ? 'bg-white text-forest shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                90d
              </button>
              <button
                onClick={() => setTimeFrame('1y')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  timeFrame === '1y' ? 'bg-white text-forest shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                1y
              </button>
            </div>

            <button
              onClick={() => fetchTrafficData()}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all disabled:opacity-50"
              title="Actualizar Datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {(() => {
        const visitorsVal = stats ? (typeof stats.visitors === 'number' ? stats.visitors : (stats.visitors as any)?.value ?? 0) : 0;
        const pageviewsVal = stats ? (typeof stats.pageviews === 'number' ? stats.pageviews : (stats.pageviews as any)?.value ?? 0) : 0;
        const visitsVal = stats ? (typeof stats.visits === 'number' ? stats.visits : (stats.visits as any)?.value ?? 0) : 0;
        const bouncesVal = stats ? (typeof stats.bounces === 'number' ? stats.bounces : (stats.bounces as any)?.value ?? 0) : 0;
        const totaltimeVal = stats ? (typeof stats.totaltime === 'number' ? stats.totaltime : (stats.totaltime as any)?.value ?? 0) : 0;

        const bounceRatePercent = visitsVal > 0 ? Math.round((bouncesVal / visitsVal) * 100) : (visitorsVal > 0 ? Math.round((bouncesVal / visitorsVal) * 100) : 0);
        const avgTimeSeconds = visitsVal > 0 ? Math.round(totaltimeVal / visitsVal) : (visitorsVal > 0 ? Math.round(totaltimeVal / visitorsVal) : 0);

        const compVisitors = stats?.comparison?.visitors;
        const visitorChange = compVisitors && compVisitors > 0 ? Math.round(((visitorsVal - compVisitors) / compVisitors) * 100) : null;

        const compPageviews = stats?.comparison?.pageviews;
        const pageviewChange = compPageviews && compPageviews > 0 ? Math.round(((pageviewsVal - compPageviews) / compPageviews) * 100) : null;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-forest/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Visitantes Únicos
                </span>
                <div className="w-9 h-9 bg-forest/10 text-forest rounded-2xl flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-display text-3xl font-bold text-forest">
                  {visitorsVal.toLocaleString()}
                </div>
                {visitorChange !== null ? (
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{visitorChange >= 0 ? `+${visitorChange}%` : `${visitorChange}%`} vs periodo anterior</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">Visitantes únicos registrados</div>
                )}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-forest/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Vistas de Página
                </span>
                <div className="w-9 h-9 bg-terracotta/10 text-terracotta rounded-2xl flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-display text-3xl font-bold text-forest">
                  {pageviewsVal.toLocaleString()}
                </div>
                {pageviewChange !== null ? (
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{pageviewChange >= 0 ? `+${pageviewChange}%` : `${pageviewChange}%`} vs periodo anterior</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">Vistas de página totales</div>
                )}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-forest/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tiempo Promedio
                </span>
                <div className="w-9 h-9 bg-forest/10 text-forest rounded-2xl flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-display text-3xl font-bold text-forest">
                  {formatSeconds(avgTimeSeconds)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Tiempo medio por sesión
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-forest/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tasa de Rebote
                </span>
                <div className="w-9 h-9 bg-terracotta/10 text-terracotta rounded-2xl flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-display text-3xl font-bold text-forest">
                  {bounceRatePercent}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Porcentaje de sesiones rebotadas
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* Main Graph & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Traffic Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-forest/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-forest text-base">Serie de Vistas de Página</h3>
              <p className="text-xs text-muted-foreground">Distribución de accesos ({timeFrame})</p>
            </div>
            <span className="text-xs font-semibold bg-forest/10 text-forest px-3 py-1 rounded-full uppercase">
              {timeFrame}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b4332" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1b4332" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#1b433220' }}
                />
                <Area type="monotone" dataKey="views" stroke="#1b4332" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Devices & Top Pages Breakdown */}
        <div className="space-y-6">
          
          {/* Devices Breakdown */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-forest/10 shadow-sm">
            <h3 className="font-display font-bold text-forest text-base mb-1">Dispositivos Principales</h3>
            <p className="text-xs text-muted-foreground mb-4">Porcentaje por tipo de equipo</p>

            <div className="space-y-3">
              {devicesData.map((item, idx) => {
                const Icon = item.icon || Laptop;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-forest">
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-terracotta" />
                        {item.device}
                      </span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-forest/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-forest rounded-full transition-all duration-500" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Pages Breakdown */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-forest/10 shadow-sm">
            <h3 className="font-display font-bold text-forest text-base mb-1">Páginas Más Visitadas</h3>
            <p className="text-xs text-muted-foreground mb-3">Rutas con mayor tráfico</p>

            <div className="space-y-2">
              {topPages.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-forest/5 border border-forest/10">
                  <span className="font-mono text-forest truncate max-w-[170px]">{p.path}</span>
                  <span className="font-semibold text-terracotta">{p.views} vistas</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* World Map Geographic Breakdown */}
      <WorldMapMetrics countries={countryData} />

    </div>
  );
};
