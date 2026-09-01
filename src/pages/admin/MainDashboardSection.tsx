import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Award, 
  Clock, 
  Workflow, 
  Layers, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  Compass, 
  UserCheck, 
  CreditCard, 
  Mail, 
  Activity, 
  ChevronRight, 
  Sparkles, 
  LayoutDashboard,
  HardDrive,
  Server,
  Cloud,
  Gauge,
  Zap,
  Info,
  CheckCircle2,
  BrainCircuit,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getStudents, 
  getWaitlistEntries, 
  getAdmissionApplications, 
  getEnvironments, 
  getGuides, 
  getSchoolEvents,
  getSchoolUsage,
  SchoolUsageStats,
  StudentItem, 
  EnvironmentItem, 
  GuideUserItem, 
  AdmissionApplicationItem, 
  SchoolEventItem 
} from '@/lib/sqlite';
import { MobileMenuButton } from './AdminDashboard';
import { useAuth } from '@/context/AuthContext';

interface MainDashboardSectionProps {
  onNavigateTab: (tabId: string) => void;
}

export const MainDashboardSection: React.FC<MainDashboardSectionProps> = ({ onNavigateTab }) => {
  const { user, role, activeMembership } = useAuth();
  
  const isGlobalSuperAdmin = user?.email?.toLowerCase() === (import.meta.env.VITE_SUPERADMIN_EMAIL || 'admin@montessorinexus.com').toLowerCase();
  const isOwner = role === 'OWNER' || activeMembership?.role === 'OWNER';
  const isSuperAdmin = role === 'SUPERADMIN' || isGlobalSuperAdmin;
  const canViewUsageQuotas = isOwner || isSuperAdmin;

  const [isQuotasExpanded, setIsQuotasExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('ceiba_dashboard_quotas_expanded');
    return saved !== null ? saved === 'true' : false;
  });

  const toggleQuotasExpanded = () => {
    setIsQuotasExpanded(prev => {
      const next = !prev;
      localStorage.setItem('ceiba_dashboard_quotas_expanded', String(next));
      return next;
    });
  };
  
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [guides, setGuides] = useState<GuideUserItem[]>([]);
  const [applications, setApplications] = useState<AdmissionApplicationItem[]>([]);
  const [events, setEvents] = useState<SchoolEventItem[]>([]);
  const [usageStats, setUsageStats] = useState<SchoolUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStudents(),
      getWaitlistEntries().then(res => res.length).catch(() => 0),
      getEnvironments(),
      getGuides(),
      getAdmissionApplications(),
      getSchoolEvents({ limit: 4 }),
      getSchoolUsage().catch(() => null)
    ]).then(([st, wl, env, gd, app, ev, usg]) => {
      setStudents(st);
      setWaitlistCount(wl);
      setEnvironments(env);
      setGuides(gd);
      setApplications(app);
      setEvents(ev);
      if (usg) setUsageStats(usg);
    }).catch(err => {
      console.error('Error loading dashboard stats:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // KPI Calculations
  const activeStudentsCount = useMemo(() => students.filter(s => s.status === 'active').length, [students]);
  const graduatedCount = useMemo(() => students.filter(s => s.status === 'graduated').length, [students]);
  const activeAppsCount = useMemo(() => applications.filter(a => a.status === 'IN_PROGRESS').length, [applications]);

  // Helper to calculate remaining %: 100% only if 0 consumed; caps at 99% if anything is consumed (< 100% remaining); always integer without comma
  const calculateRemainingPct = (remaining: number, limit: number, used: number = 0): number => {
    if (limit <= 0) return 0;
    if (used <= 0 || remaining >= limit) return 100;
    if (remaining <= 0) return 0;

    const rawPct = (remaining / limit) * 100;
    const rounded = Math.round(rawPct);
    if (rounded >= 100) return 99;
    return Math.max(0, rounded);
  };

  // Quotas Remaining Calculations (Negative Progress Bars)
  const quotasRemaining = useMemo(() => {
    if (!usageStats) return null;

    // Emails
    const emailLimit = usageStats.emails.limit || 0;
    const emailUsed = usageStats.emails.used || 0;
    const emailRemaining = usageStats.emails.remaining ?? Math.max(0, emailLimit - emailUsed);
    const emailRemainingPct = calculateRemainingPct(emailRemaining, emailLimit, emailUsed);

    // Storage
    const storageLimitBytes = usageStats.storage.limitBytes || (usageStats.storage.limitGb * 1024 * 1024 * 1024) || 0;
    const storageUsedBytes = usageStats.storage.usedBytes || (usageStats.storage.usedMb * 1024 * 1024) || 0;
    const storageRemainingBytes = Math.max(0, storageLimitBytes - storageUsedBytes);
    const storageRemainingPct = calculateRemainingPct(storageRemainingBytes, storageLimitBytes, storageUsedBytes);

    // AI
    const aiLimit = usageStats.ai?.includedLimit || 0;
    const aiUsed = usageStats.ai?.used || 0;
    const aiRemaining = usageStats.ai?.remaining ?? Math.max(0, aiLimit - aiUsed);
    const aiRemainingPct = calculateRemainingPct(aiRemaining, aiLimit, aiUsed);

    return {
      emailRemaining,
      emailRemainingPct,
      storageRemainingPct,
      aiRemaining,
      aiRemainingPct
    };
  }, [usageStats]);

  // Student Distribution by Environment
  const envDistribution = useMemo(() => {
    if (environments.length === 0 || students.length === 0) return [];
    
    return environments.map(env => {
      const count = students.filter(s => s.status === 'active' && s.environmentId === env.id).length;
      return {
        id: env.id,
        name: env.name,
        color: env.color || '#1b3b2b',
        count,
        percentage: activeStudentsCount > 0 ? Math.round((count / activeStudentsCount) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [environments, students, activeStudentsCount]);

  // Gender Distribution
  const genderStats = useMemo(() => {
    const activeSts = students.filter(s => s.status === 'active');
    if (activeSts.length === 0) return { male: 0, female: 0, unspecified: 0 };
    
    let male = 0;
    let female = 0;
    let unspecified = 0;
    
    activeSts.forEach(s => {
      const g = (s.gender || '').toUpperCase();
      if (g.startsWith('M') || g.includes('MASC') || g.includes('BOY')) male++;
      else if (g.startsWith('F') || g.includes('FEM') || g.includes('GIRL')) female++;
      else unspecified++;
    });

    return {
      male: Math.round((male / activeSts.length) * 100),
      female: Math.round((female / activeSts.length) * 100),
      unspecified: Math.round((unspecified / activeSts.length) * 100),
    };
  }, [students]);

  // Recent applications (take first 5)
  const recentApps = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [applications]);

  const quickActions = [
    { id: 'students', label: 'Matrícula Activa', desc: 'Ver listado y fichas', icon: Users, color: 'text-forest bg-forest/10 hover:bg-forest/15' },
    { id: 'waitlist', label: 'Lista de Espera', desc: 'Registrar nueva pre-matrícula', icon: Clock, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
    { id: 'admissions', label: 'Admisiones', desc: 'Gestionar candidatos y etapas', icon: Workflow, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { id: 'attendance', label: 'Asistencia Diaria', desc: 'Tomar asistencia de salones', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
    { id: 'newsletters', label: 'Enviar Boletín', desc: 'Escribir aviso o comunicación', icon: Mail, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { id: 'events', label: 'Calendario', desc: 'Agendar eventos del colegio', icon: Calendar, color: 'text-pink-600 bg-pink-50 hover:bg-pink-100' }
  ];

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-forest border-t-transparent animate-spin" />
        <span>Cargando panel de control Ceiba Roots...</span>
      </div>
    );
  }

  const welcomeMessage = () => {
    const hr = new Date().getHours();
    if (hr < 12) return '¡Buenos días!';
    if (hr < 19) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  return (
    <div className="space-y-6">
      {/* HEADER HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-8 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-6 pt-8 pb-8 text-white shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider block font-mono">
                Panel de Control
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                {welcomeMessage()}, {user?.fullName || 'Administración'}
              </h1>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-[11px] font-bold">Ceiba Roots Manager</span>
          </div>
        </div>
      </div>

      {/* PLAN LIMITS & CONSUMPTION SECTION (COLLAPSIBLE, VISIBLE ONLY FOR OWNER / SUPERADMIN) */}
      {canViewUsageQuotas && usageStats && (
        <div className="p-5 md:p-6 bg-white dark:bg-slate-900 border border-forest/15 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-forest/10 dark:border-slate-800 pb-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest/10 dark:bg-emerald-500/20 text-forest dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                  Cuotas y Consumo del Plan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Monitoreo de despachos de correo mensuales, almacenamiento en la nube y consumo de IA.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              {isQuotasExpanded && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('pricing')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest/10 hover:bg-forest/15 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-forest dark:text-emerald-400 text-xs font-bold transition-all cursor-pointer animate-in fade-in duration-200"
                >
                  <span>Administrar o Ampliar Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={toggleQuotasExpanded}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                title={isQuotasExpanded ? 'Contraer resumen de cuotas' : 'Ver detalle ampliado de cuotas'}
              >
                <span>{isQuotasExpanded ? 'Contraer' : 'Ver Detalle'}</span>
                {isQuotasExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!isQuotasExpanded ? (
            /* COMPACT STACKED 3-BAR VIEW (REMAINING QUOTAS) */
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 dark:bg-slate-850/60 border border-stone-200/70 dark:border-slate-800 space-y-3.5">
              {/* 1. EMAILS COMPACT ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      Correos
                    </span>
                  </div>
                  {usageStats.emails.isByos ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      SMTP Propio
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      <strong className="text-emerald-700 dark:text-emerald-400">{usageStats.emails.remaining.toLocaleString()}</strong> / {usageStats.emails.limit.toLocaleString()} restantes
                    </span>
                  )}
                </div>

                <div className="sm:col-span-6">
                  {usageStats.emails.isByos ? (
                    <div className="h-2.5 rounded-full bg-emerald-500/15 dark:bg-emerald-950/50 border border-emerald-500/25 dark:border-emerald-500/30 p-0.5 flex items-center overflow-hidden">
                      <div className="w-full h-full rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-full h-2.5 rounded-full bg-emerald-500/15 dark:bg-emerald-950/50 border border-emerald-500/25 dark:border-emerald-500/30 p-0.5 flex items-center overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (quotasRemaining?.emailRemainingPct ?? 0) <= 10
                            ? 'bg-rose-500'
                            : (quotasRemaining?.emailRemainingPct ?? 0) <= 25
                            ? 'bg-amber-500'
                            : 'bg-emerald-600 dark:bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max((quotasRemaining?.emailRemainingPct ?? 0) > 0 ? 3 : 0, quotasRemaining?.emailRemainingPct ?? 0)}%` }}
                        title={`Restantes: ${usageStats.emails.remaining} (${quotasRemaining?.emailRemainingPct}%)`}
                      />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 text-right hidden sm:block">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {usageStats.emails.isByos ? 'Ilimitado' : `${quotasRemaining?.emailRemainingPct}% restante`}
                  </span>
                </div>
              </div>

              {/* 2. STORAGE COMPACT ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/50 dark:border-slate-800">
                <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <HardDrive className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      Almacenamiento
                    </span>
                  </div>
                  {usageStats.storage.isByos ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
                      AWS S3 Propio
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      <strong className="text-blue-700 dark:text-blue-400">{usageStats.storage.remainingGb} GB</strong> / {usageStats.storage.limitGb} GB disponibles
                    </span>
                  )}
                </div>

                <div className="sm:col-span-6">
                  {usageStats.storage.isByos ? (
                    <div className="h-2.5 rounded-full bg-blue-500/15 dark:bg-blue-950/50 border border-blue-500/25 dark:border-blue-500/30 p-0.5 flex items-center overflow-hidden">
                      <div className="w-full h-full rounded-full bg-blue-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-full h-2.5 rounded-full bg-blue-500/15 dark:bg-blue-950/50 border border-blue-500/25 dark:border-blue-500/30 p-0.5 flex items-center overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (quotasRemaining?.storageRemainingPct ?? 0) <= 10
                            ? 'bg-rose-500'
                            : (quotasRemaining?.storageRemainingPct ?? 0) <= 25
                            ? 'bg-amber-500'
                            : 'bg-blue-600 dark:bg-blue-500'
                        }`}
                        style={{ width: `${Math.max((quotasRemaining?.storageRemainingPct ?? 0) > 0 ? 3 : 0, quotasRemaining?.storageRemainingPct ?? 0)}%` }}
                        title={`Disponible: ${usageStats.storage.remainingGb} GB (${quotasRemaining?.storageRemainingPct}%)`}
                      />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 text-right hidden sm:block">
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 font-mono">
                    {usageStats.storage.isByos ? 'Ilimitado' : `${quotasRemaining?.storageRemainingPct}% restante`}
                  </span>
                </div>
              </div>

              {/* 3. AI TOKENS COMPACT ROW */}
              {usageStats.ai && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/50 dark:border-slate-800">
                  <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <BrainCircuit className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        Tokens IA
                      </span>
                    </div>
                    {usageStats.ai.isCustom && usageStats.ai.hasCustomKey ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0">
                        LLM Propio
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                        <strong className="text-purple-700 dark:text-purple-400">
                          {usageStats.ai.remaining >= 1000000 
                            ? `${(usageStats.ai.remaining / 1000000).toFixed(1)}M` 
                            : usageStats.ai.remaining >= 1000 
                            ? `${(usageStats.ai.remaining / 1000).toFixed(0)}k` 
                            : usageStats.ai.remaining.toLocaleString()}
                        </strong> / {usageStats.ai.includedLimit >= 1000000 ? `${Math.round(usageStats.ai.includedLimit / 1000000)}M` : usageStats.ai.includedLimit.toLocaleString()} restantes
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-6">
                    {usageStats.ai.isCustom && usageStats.ai.hasCustomKey ? (
                      <div className="h-2.5 rounded-full bg-purple-500/15 dark:bg-purple-950/50 border border-purple-500/25 dark:border-purple-500/30 p-0.5 flex items-center overflow-hidden">
                        <div className="w-full h-full rounded-full bg-purple-500 animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-full h-2.5 rounded-full bg-purple-500/15 dark:bg-purple-950/50 border border-purple-500/25 dark:border-purple-500/30 p-0.5 flex items-center overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            (quotasRemaining?.aiRemainingPct ?? 0) <= 10 || (usageStats.ai.remaining <= 2000)
                              ? 'bg-rose-500'
                              : (quotasRemaining?.aiRemainingPct ?? 0) <= 25 || usageStats.ai.remaining <= 50000
                              ? 'bg-amber-500'
                              : 'bg-purple-600 dark:bg-purple-500'
                          }`}
                          style={{ width: `${Math.max((quotasRemaining?.aiRemainingPct ?? 0) > 0 ? 3 : 0, quotasRemaining?.aiRemainingPct ?? 0)}%` }}
                          title={`Restantes: ${usageStats.ai.remaining.toLocaleString()} (${quotasRemaining?.aiRemainingPct}%)`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2 text-right hidden sm:block">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 font-mono">
                      {usageStats.ai.isCustom && usageStats.ai.hasCustomKey ? 'Ilimitado' : `${quotasRemaining?.aiRemainingPct}% restante`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EXPANDED FULL 3-CARD GRID VIEW (REMAINING QUOTAS - TOP ALIGNED BARS) */
            <div className={`grid grid-cols-1 ${usageStats.ai ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-5 pt-1`}>
              {/* 1. EMAILS DISPATCH CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 dark:bg-slate-850/60 border border-stone-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  {/* TOP HEADER ROW */}
                  <div className="flex items-center justify-between gap-2 h-7">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Despacho de Correos
                      </h4>
                    </div>

                    {usageStats.emails.isByos && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                        <Server className="w-3 h-3" />
                        <span>SMTP Propio</span>
                      </span>
                    )}
                  </div>

                  {/* PROGRESS BAR AT TOP */}
                  {usageStats.emails.isByos ? (
                    <div className="h-3.5 rounded-full bg-emerald-500/15 dark:bg-emerald-950/50 border border-emerald-500/25 dark:border-emerald-500/30 p-0.5 flex items-center overflow-hidden">
                      <div className="w-full h-full rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-full h-3.5 rounded-full bg-emerald-500/15 dark:bg-emerald-950/50 border border-emerald-500/25 dark:border-emerald-500/30 p-0.5 flex items-center overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (quotasRemaining?.emailRemainingPct ?? 0) <= 10
                            ? 'bg-rose-500'
                            : (quotasRemaining?.emailRemainingPct ?? 0) <= 25
                            ? 'bg-amber-500'
                            : 'bg-emerald-600 dark:bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max((quotasRemaining?.emailRemainingPct ?? 0) > 0 ? 3 : 0, quotasRemaining?.emailRemainingPct ?? 0)}%` }}
                        title={`Restantes: ${usageStats.emails.remaining} (${quotasRemaining?.emailRemainingPct}%)`}
                      />
                    </div>
                  )}

                  {/* METRICS COUNTER UNDER BAR */}
                  {usageStats.emails.isByos ? (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-semibold truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{usageStats.emails.used.toLocaleString()} enviados este mes</span>
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{usageStats.emails.smtpHost || 'Servidor Personalizado'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0" />
                        <span>
                          Restantes: <strong className="text-emerald-700 dark:text-emerald-400">{usageStats.emails.remaining.toLocaleString()}</strong> ({quotasRemaining?.emailRemainingPct}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                        <span>
                          Consumidos: <strong className="text-slate-900 dark:text-slate-100">{usageStats.emails.used.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONTEXT FOOTER */}
                <div className="pt-2 border-t border-stone-200/50 dark:border-slate-800/80 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Boletines, circulares y comunicados</span>
                  {usageStats.emails.isByos && <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sin límite</span>}
                </div>
              </div>

              {/* 2. STORAGE CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 dark:bg-slate-850/60 border border-stone-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  {/* TOP HEADER ROW */}
                  <div className="flex items-center justify-between gap-2 h-7">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <HardDrive className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Almacenamiento en Nube
                      </h4>
                    </div>

                    {usageStats.storage.isByos && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
                        <Cloud className="w-3 h-3" />
                        <span>AWS S3 Propio</span>
                      </span>
                    )}
                  </div>

                  {/* PROGRESS BAR AT TOP */}
                  {usageStats.storage.isByos ? (
                    <div className="h-3.5 rounded-full bg-blue-500/15 dark:bg-blue-950/50 border border-blue-500/25 dark:border-blue-500/30 p-0.5 flex items-center overflow-hidden">
                      <div className="w-full h-full rounded-full bg-blue-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-full h-3.5 rounded-full bg-blue-500/15 dark:bg-blue-950/50 border border-blue-500/25 dark:border-blue-500/30 p-0.5 flex items-center overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (quotasRemaining?.storageRemainingPct ?? 0) <= 10
                            ? 'bg-rose-500'
                            : (quotasRemaining?.storageRemainingPct ?? 0) <= 25
                            ? 'bg-amber-500'
                            : 'bg-blue-600 dark:bg-blue-500'
                        }`}
                        style={{ width: `${Math.max((quotasRemaining?.storageRemainingPct ?? 0) > 0 ? 3 : 0, quotasRemaining?.storageRemainingPct ?? 0)}%` }}
                        title={`Disponible: ${usageStats.storage.remainingGb} GB (${quotasRemaining?.storageRemainingPct}%)`}
                      />
                    </div>
                  )}

                  {/* METRICS COUNTER UNDER BAR */}
                  {usageStats.storage.isByos ? (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1 text-blue-800 dark:text-blue-300 font-semibold truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{usageStats.storage.usedMb < 1024 ? `${usageStats.storage.usedMb} MB` : `${usageStats.storage.usedGb} GB`} almacenados</span>
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">Infraestructura AWS</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0" />
                        <span>
                          Disponible: <strong className="text-blue-700 dark:text-blue-400">{usageStats.storage.remainingGb} GB</strong> ({quotasRemaining?.storageRemainingPct}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                        <span>
                          Usado: <strong className="text-slate-900 dark:text-slate-100">{usageStats.storage.usedMb < 1024 ? `${usageStats.storage.usedMb} MB` : `${usageStats.storage.usedGb} GB`}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONTEXT FOOTER */}
                <div className="pt-2 border-t border-stone-200/50 dark:border-slate-800/80 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Documentos, expedientes y multimedia</span>
                  {usageStats.storage.isByos && <span className="font-semibold text-blue-600 dark:text-blue-400">Sin límite</span>}
                </div>
              </div>

              {/* 3. AI TOKENS CARD */}
              {usageStats.ai && (
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 dark:bg-slate-850/60 border border-stone-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-3">
                    {/* TOP HEADER ROW */}
                    <div className="flex items-center justify-between gap-2 h-7">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <BrainCircuit className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Tokens de IA
                        </h4>
                      </div>

                      {usageStats.ai.isCustom && usageStats.ai.hasCustomKey && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0">
                          <Zap className="w-3 h-3" />
                          <span>LLM Propio</span>
                        </span>
                      )}
                    </div>

                    {/* PROGRESS BAR AT TOP */}
                    {usageStats.ai.isCustom && usageStats.ai.hasCustomKey ? (
                      <div className="h-3.5 rounded-full bg-purple-500/15 dark:bg-purple-950/50 border border-purple-500/25 dark:border-purple-500/30 p-0.5 flex items-center overflow-hidden">
                        <div className="w-full h-full rounded-full bg-purple-500 animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-full h-3.5 rounded-full bg-purple-500/15 dark:bg-purple-950/50 border border-purple-500/25 dark:border-purple-500/30 p-0.5 flex items-center overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            (quotasRemaining?.aiRemainingPct ?? 0) <= 10 || usageStats.ai.remaining <= 2000
                              ? 'bg-rose-500'
                              : (quotasRemaining?.aiRemainingPct ?? 0) <= 25 || usageStats.ai.remaining <= 50000
                              ? 'bg-amber-500'
                              : 'bg-purple-600 dark:bg-purple-500'
                          }`}
                          style={{ width: `${Math.max((quotasRemaining?.aiRemainingPct ?? 0) > 0 ? 3 : 0, quotasRemaining?.aiRemainingPct ?? 0)}%` }}
                          title={`Restantes: ${usageStats.ai.remaining.toLocaleString()} (${quotasRemaining?.aiRemainingPct}%)`}
                        />
                      </div>
                    )}

                    {/* METRICS COUNTER UNDER BAR */}
                    {usageStats.ai.isCustom && usageStats.ai.hasCustomKey ? (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1 text-purple-800 dark:text-purple-300 font-semibold truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{usageStats.ai.requestCount || 0} peticiones este ciclo</span>
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {usageStats.ai.customModelText || 'Modelo Personalizado'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-500 shrink-0" />
                          <span>
                            Restantes: <strong className="text-purple-700 dark:text-purple-400">{usageStats.ai.remaining.toLocaleString()}</strong> ({quotasRemaining?.aiRemainingPct}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                          <span>
                            Consumidos: <strong className="text-slate-900 dark:text-slate-100">{usageStats.ai.used.toLocaleString()}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CONTEXT FOOTER */}
                  <div className="pt-2 border-t border-stone-200/50 dark:border-slate-800/80 text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>Muro escolar, bitácoras, OCR y redacción</span>
                    {usageStats.ai.isCustom && usageStats.ai.hasCustomKey && <span className="font-semibold text-purple-600 dark:text-purple-400">Sin límite</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Matrícula Activa', val: activeStudentsCount, color: 'border-emerald-200/60 bg-emerald-50/20 text-emerald-800', icon: Users },
          { label: 'Egresados / Graduados', val: graduatedCount, color: 'border-blue-200/60 bg-blue-50/20 text-blue-800', icon: Award },
          { label: 'Lista de Espera', val: waitlistCount, color: 'border-amber-200/60 bg-amber-50/20 text-amber-800', icon: Clock },
          { label: 'Expedientes Activos', val: activeAppsCount, color: 'border-indigo-200/60 bg-indigo-50/20 text-indigo-800', icon: Workflow },
          { label: 'Ambientes / Salones', val: environments.length, color: 'border-teal-200/60 bg-teal-50/20 text-teal-800', icon: Layers },
          { label: 'Equipo Docente', val: guides.length, color: 'border-purple-200/60 bg-purple-800', icon: GraduationCap }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`p-4 bg-white border rounded-2xl shadow-xs flex flex-col justify-between ${kpi.color}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                <Icon className="w-4 h-4 opacity-80 shrink-0" />
              </div>
              <span className="text-2xl font-bold font-display tracking-tight mt-2 block">{kpi.val}</span>
            </div>
          );
        })}
      </div>

      {/* TWO COLUMN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER PANEL (COL-SPAN 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ENVIRONMENT DISTRIBUTION & DENSITY */}
          <div className="p-5 md:p-6 bg-white border border-forest/10 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-forest/5 pb-3">
              <div>
                <h3 className="font-bold text-forest text-base font-display">Distribución de Matrícula</h3>
                <p className="text-xs text-muted-foreground">Densidad de alumnos activos asignados por salón/ambiente.</p>
              </div>
              <span className="text-xs font-bold text-forest bg-forest/5 px-2.5 py-1 rounded-xl">
                {activeStudentsCount} alumnos en total
              </span>
            </div>

            <div className="space-y-3.5">
              {envDistribution.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No hay alumnos matriculados en ningún ambiente.</p>
              ) : (
                envDistribution.map(dist => (
                  <div key={dist.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground">{dist.name}</span>
                      <span className="text-muted-foreground">
                        <strong>{dist.count}</strong> alumnos ({dist.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${dist.percentage}%`,
                          backgroundColor: dist.color 
                        }} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* GENDER CHART BAR */}
            <div className="pt-4 border-t border-forest/5">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-forest">Balance de Género (Matrícula Activa)</span>
                <span className="text-muted-foreground">Niños: {genderStats.male}% • Niñas: {genderStats.female}%</span>
              </div>
              <div className="w-full h-3 rounded-full flex overflow-hidden">
                {genderStats.male > 0 && <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${genderStats.male}%` }} title={`Niños: ${genderStats.male}%`} />}
                {genderStats.female > 0 && <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${genderStats.female}%` }} title={`Niñas: ${genderStats.female}%`} />}
                {genderStats.unspecified > 0 && <div className="h-full bg-slate-400 transition-all duration-300" style={{ width: `${genderStats.unspecified}%` }} title={`Sin especificar: ${genderStats.unspecified}%`} />}
              </div>
            </div>
          </div>

          {/* RECENT ADMISSIONS / PROCESS APPLICATIONS */}
          <div className="p-5 md:p-6 bg-white border border-forest/10 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-forest/5 pb-3">
              <div>
                <h3 className="font-bold text-forest text-base font-display">Expedientes Recientes</h3>
                <p className="text-xs text-muted-foreground">Últimos aplicantes registrados en los procesos institucionales.</p>
              </div>
              <button 
                type="button" 
                onClick={() => onNavigateTab('admissions')}
                className="text-xs font-bold text-forest hover:underline flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-muted-foreground font-bold">
                    <th className="py-2.5 pb-2">Alumno</th>
                    <th className="py-2.5 pb-2">Proceso / Etapa</th>
                    <th className="py-2.5 pb-2">Tutor</th>
                    <th className="py-2.5 pb-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentApps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">No hay expedientes registrados en el sistema.</td>
                    </tr>
                  ) : (
                    recentApps.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-semibold text-foreground">{app.childName}</td>
                        <td className="py-3">
                          <span className="block text-[11px] font-bold text-forest">{app.processName || 'Admisión'}</span>
                          <span className="text-[10px] text-muted-foreground">{app.stageName || 'Etapa Inicial'}</span>
                        </td>
                        <td className="py-3">
                          <span className="block text-[11px] font-semibold">{app.tutorName}</span>
                          <span className="text-[10px] text-muted-foreground">{app.tutorEmail}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'ENROLLED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {app.status === 'ENROLLED' ? 'Finalizado' : app.status === 'REJECTED' ? 'Declinado' : 'En progreso'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (COL-SPAN 1) */}
        <div className="space-y-6">
          
          {/* QUICK ACTIONS GRID */}
          <div className="p-5 md:p-6 bg-white border border-forest/10 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-bold text-forest text-base font-display border-b border-forest/5 pb-3">
              Acciones Rápidas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onNavigateTab(action.id)}
                    className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-200 flex items-center gap-3 text-left w-full group/act"
                  >
                    <div className={`p-2 rounded-xl shrink-0 transition-transform group-hover/act:scale-105 duration-200 ${action.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate flex-1">
                      <span className="block text-xs font-bold text-foreground truncate group-hover/act:text-forest transition-colors">
                        {action.label}
                      </span>
                      <span className="block text-[10px] text-muted-foreground truncate">
                        {action.desc}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 transition-transform group-hover/act:translate-x-0.5 duration-200 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* UPCOMING CALENDAR EVENTS */}
          <div className="p-5 md:p-6 bg-white border border-forest/10 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-forest/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-forest rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-forest text-base font-display">Próximos Eventos</h3>
              </div>
              <button 
                type="button" 
                onClick={() => onNavigateTab('events')}
                className="text-xs font-bold text-forest hover:text-forest/80 hover:underline transition-colors flex items-center gap-1 group/link"
              >
                <span>Ver agenda</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
              </button>
            </div>

            <div>
              {events.length === 0 ? (
                <div className="py-6 text-center px-4 bg-slate-50/50 rounded-2xl border border-dashed border-forest/10">
                  <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-forest/5 flex items-center justify-center text-forest/50">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-foreground/80">No hay eventos próximos</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Los eventos agendados aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {events
                    .filter(ev => ev.status !== 'CANCELLED')
                    .slice(0, 4)
                    .map(ev => {
                      const rawDate = ev.startDateTime || (ev as any).startDate;
                      let day = '--';
                      let monthStr = '---';
                      let timeStr = 'Todo el día';

                      if (rawDate) {
                        const d = new Date(rawDate);
                        if (!isNaN(d.getTime())) {
                          day = String(d.getDate());
                          monthStr = d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '');
                          const hours = d.getHours();
                          const minutes = d.getMinutes();
                          if (hours !== 0 || minutes !== 0) {
                            timeStr = d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true });
                          }
                        }
                      }

                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => onNavigateTab('events')}
                          className="w-full p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-200 flex items-center gap-3 text-left group/item cursor-pointer"
                        >
                          {/* Mini Calendar Badge */}
                          <div className="w-11 h-12 bg-white group-hover/item:bg-forest/5 border border-forest/10 rounded-xl shrink-0 flex flex-col items-center justify-center shadow-2xs transition-colors">
                            <span className="text-[9px] text-forest/75 font-bold tracking-wider leading-none">
                              {monthStr}
                            </span>
                            <span className="text-sm font-bold text-forest font-mono leading-tight mt-0.5">
                              {day}
                            </span>
                          </div>

                          {/* Event Details */}
                          <div className="truncate flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-foreground group-hover/item:text-forest transition-colors truncate leading-snug">
                              {ev.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 truncate">
                              <span className="truncate text-forest/70 font-medium">{ev.location || 'Campus'}</span>
                              <span className="text-slate-300">•</span>
                              <span className="shrink-0">{timeStr}</span>
                              {ev.category?.name && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span 
                                    className="px-1.5 py-0.2 rounded-md text-[9px] font-semibold shrink-0"
                                    style={{
                                      backgroundColor: ev.category.color ? `${ev.category.color}15` : 'rgba(46, 125, 50, 0.1)',
                                      color: ev.category.color || '#2e7d32'
                                    }}
                                  >
                                    {ev.category.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action indicator */}
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/item:text-forest group-hover/item:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
