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
  ShieldCheck,
  Gauge,
  Zap,
  Info,
  CheckCircle2
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
  const { user } = useAuth();
  
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

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Matrícula Activa', val: activeStudentsCount, color: 'border-emerald-200/60 bg-emerald-50/20 text-emerald-800', icon: Users },
          { label: 'Egresados / Graduados', val: graduatedCount, color: 'border-blue-200/60 bg-blue-50/20 text-blue-800', icon: Award },
          { label: 'Lista de Espera', val: waitlistCount, color: 'border-amber-200/60 bg-amber-50/20 text-amber-800', icon: Clock },
          { label: 'Expedientes Activos', val: activeAppsCount, color: 'border-indigo-200/60 bg-indigo-50/20 text-indigo-800', icon: Workflow },
          { label: 'Ambientes / Salones', val: environments.length, color: 'border-teal-200/60 bg-teal-50/20 text-teal-800', icon: Layers },
          { label: 'Equipo Docente', val: guides.length, color: 'border-purple-200/60 bg-purple-50/20 text-purple-800', icon: GraduationCap }
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

      {/* PLAN LIMITS & CONSUMPTION SECTION (EMAILS & STORAGE PROGRESS) */}
      {usageStats && (
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
                  Monitoreo de despachos de correo mensuales y almacenamiento en la nube.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('pricing')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest/10 hover:bg-forest/15 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-forest dark:text-emerald-400 text-xs font-bold transition-all cursor-pointer"
            >
              <span>Administrar o Ampliar Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* 1. EMAILS DISPATCH PROGRESS BAR */}
            <div className="p-4 rounded-2xl bg-stone-50/70 dark:bg-slate-850/60 border border-stone-200/70 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Despacho Mensual de Correos
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      Boletines, circulares y comunicados
                    </span>
                  </div>
                </div>

                {usageStats.emails.isByos ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                    <Server className="w-3 h-3" />
                    <span>Ilimitado • SMTP Propio</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest dark:text-emerald-400 border border-forest/20 shrink-0 font-mono">
                    {usageStats.emails.limit.toLocaleString()} emails / mes
                  </span>
                )}
              </div>

              {usageStats.emails.isByos ? (
                <div className="space-y-2">
                  <div className="h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 overflow-hidden flex items-center px-2">
                    <div className="w-full h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{usageStats.emails.used.toLocaleString()} enviados este mes (Sin costo de plataforma)</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{usageStats.emails.smtpHost || 'Servidor Personalizado'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* DUAL-COLOR PROGRESS BAR */}
                  <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                    {/* Consumed Segment */}
                    <div
                      className={`h-full transition-all duration-500 ${
                        usageStats.emails.percentage > 90
                          ? 'bg-rose-500'
                          : usageStats.emails.percentage > 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-600 dark:bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(usageStats.emails.percentage > 0 ? 3 : 0, usageStats.emails.percentage)}%` }}
                      title={`Consumidos: ${usageStats.emails.used} (${usageStats.emails.percentage}%)`}
                    />
                    {/* Remaining Segment */}
                    <div
                      className="h-full bg-emerald-100 dark:bg-emerald-950/70 transition-all duration-500"
                      style={{ width: `${Math.max(0, 100 - usageStats.emails.percentage)}%` }}
                      title={`Restantes: ${usageStats.emails.remaining} (${100 - usageStats.emails.percentage}%)`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0" />
                      <span>
                        Consumidos: <strong className="text-slate-900 dark:text-slate-100">{usageStats.emails.used.toLocaleString()}</strong> ({usageStats.emails.percentage}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-200 dark:bg-emerald-800 shrink-0" />
                      <span>
                        Restantes: <strong className="text-emerald-700 dark:text-emerald-400">{usageStats.emails.remaining.toLocaleString()}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. STORAGE PROGRESS BAR */}
            <div className="p-4 rounded-2xl bg-stone-50/70 dark:bg-slate-850/60 border border-stone-200/70 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <HardDrive className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Almacenamiento en la Nube
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      Documentos, expedientes y galería fotográfica
                    </span>
                  </div>
                </div>

                {usageStats.storage.isByos ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
                    <Cloud className="w-3 h-3" />
                    <span>Ilimitado • AWS S3 Propio</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 shrink-0 font-mono">
                    {usageStats.storage.limitGb} GB asignados
                  </span>
                )}
              </div>

              {usageStats.storage.isByos ? (
                <div className="space-y-2">
                  <div className="h-3.5 rounded-full bg-blue-500/20 border border-blue-500/30 overflow-hidden flex items-center px-2">
                    <div className="w-full h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1 text-blue-800 dark:text-blue-300 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{usageStats.storage.usedMb < 1024 ? `${usageStats.storage.usedMb} MB` : `${usageStats.storage.usedGb} GB`} almacenados en tu Bucket S3</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">Infraestructura AWS</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* DUAL-COLOR PROGRESS BAR */}
                  <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                    {/* Used Segment */}
                    <div
                      className={`h-full transition-all duration-500 ${
                        usageStats.storage.percentage > 90
                          ? 'bg-rose-500'
                          : usageStats.storage.percentage > 75
                          ? 'bg-amber-500'
                          : 'bg-blue-600 dark:bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(usageStats.storage.percentage > 0 ? 3 : 0, usageStats.storage.percentage)}%` }}
                      title={`Usado: ${usageStats.storage.usedMb < 1024 ? `${usageStats.storage.usedMb} MB` : `${usageStats.storage.usedGb} GB`} (${usageStats.storage.percentage}%)`}
                    />
                    {/* Remaining Segment */}
                    <div
                      className="h-full bg-blue-100 dark:bg-blue-950/70 transition-all duration-500"
                      style={{ width: `${Math.max(0, 100 - usageStats.storage.percentage)}%` }}
                      title={`Disponible: ${usageStats.storage.remainingGb} GB (${100 - usageStats.storage.percentage}%)`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0" />
                      <span>
                        Usado: <strong className="text-slate-900 dark:text-slate-100">{usageStats.storage.usedMb < 1024 ? `${usageStats.storage.usedMb} MB` : `${usageStats.storage.usedGb} GB`}</strong> ({usageStats.storage.percentage}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-200 dark:bg-blue-800 shrink-0" />
                      <span>
                        Disponible: <strong className="text-blue-700 dark:text-blue-400">{usageStats.storage.remainingGb} GB</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

          {/* UPCOMING CALENDER EVENTS */}
          <div className="p-5 md:p-6 bg-white border border-forest/10 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-forest/5 pb-3">
              <h3 className="font-bold text-forest text-base font-display">Próximos Eventos</h3>
              <button 
                type="button" 
                onClick={() => onNavigateTab('events')}
                className="text-xs font-bold text-forest hover:underline"
              >
                Ver agenda
              </button>
            </div>

            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No hay eventos próximos agendados.</p>
              ) : (
                events.map(ev => {
                  const evDate = new Date(ev.startDate);
                  const day = evDate.getDate();
                  const monthStr = evDate.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '');
                  
                  return (
                    <div key={ev.id} className="flex gap-3.5 items-start">
                      <div className="w-11 h-11 bg-forest/5 border border-forest/10 rounded-2xl shrink-0 flex flex-col items-center justify-center font-mono p-1">
                        <span className="text-[10px] text-forest/80 font-bold leading-none">{monthStr}</span>
                        <span className="text-sm text-forest font-bold leading-tight">{day}</span>
                      </div>
                      <div className="truncate flex-1">
                        <h4 className="text-xs font-bold text-foreground truncate leading-tight">
                          {ev.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {ev.location || 'Ceiba Roots'} • {ev.startTime || 'Todo el día'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
