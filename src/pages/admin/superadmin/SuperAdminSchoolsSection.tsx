import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Eye,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Globe,
  RefreshCw,
  Clock,
  AlertTriangle,
  Receipt,
  X,
  Trash2,
  AlertOctagon,
  Layers
} from 'lucide-react';
import {
  getSuperAdminSchoolsSummary,
  eradicateSchool,
  SuperAdminSchoolItem,
  School
} from '@/lib/sqlite';
import { toast } from 'sonner';

interface SuperAdminSchoolsSectionProps {
  onEnterGhostMode: (school: School) => void;
  onOpenCreateSchool: () => void;
  onNavigateToBilling?: () => void;
}

export const SuperAdminSchoolsSection: React.FC<SuperAdminSchoolsSectionProps> = ({
  onEnterGhostMode,
  onOpenCreateSchool,
  onNavigateToBilling
}) => {
  const [schools, setSchools] = useState<SuperAdminSchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubscription, setFilterSubscription] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');

  // Eradication state
  const [schoolToEradicate, setSchoolToEradicate] = useState<SuperAdminSchoolItem | null>(null);
  const [confirmSlugInput, setConfirmSlugInput] = useState<string>('');
  const [isEradicating, setIsEradicating] = useState<boolean>(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getSuperAdminSchoolsSummary();
      setSchools(data);
    } catch (err: any) {
      toast.error('Error al cargar directorio de colegios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const totalMetrics = useMemo(() => {
    const totalSchools = schools.length;
    const totalStudents = schools.reduce((acc, s) => acc + (s.stats?.studentsCount || 0), 0);
    const totalEnvironments = schools.reduce((acc, s) => acc + (s.stats?.environmentsCount || 0), 0);
    const activeTrials = schools.filter(s => s.trial?.isTrialActive).length;
    const activePaid = schools.filter(s => s.billing?.subscriptionStatus === 'ACTIVE_PAID').length;

    return {
      totalSchools,
      totalStudents,
      totalEnvironments,
      activeTrials,
      activePaid
    };
  }, [schools]);

  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.country && s.country.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterSubscription !== 'all') {
        if (filterSubscription === 'trial' && !s.trial?.isTrialActive) return false;
        if (filterSubscription === 'paid' && s.billing?.subscriptionStatus !== 'ACTIVE_PAID') return false;
        if (filterSubscription === 'expired' && (s.trial?.isTrialActive || s.billing?.subscriptionStatus === 'ACTIVE_PAID')) return false;
      }

      if (filterModule === 'all') return true;
      const feat = (s.features as any) || {};
      if (filterModule === 'finances') return !!feat.finances;
      if (filterModule === 'webBuilder') return !!feat.webBuilder || !!feat.website;
      if (filterModule === 'forms') return !!feat.forms;
      if (filterModule === 'pipelines') return !!feat.pipelines;
      return true;
    });
  }, [schools, searchQuery, filterModule, filterSubscription]);

  const handleEradicateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolToEradicate) return;

    if (confirmSlugInput.trim().toLowerCase() !== schoolToEradicate.slug.trim().toLowerCase()) {
      toast.error(`Debes escribir exactamente el slug "${schoolToEradicate.slug}" para confirmar.`);
      return;
    }

    setIsEradicating(true);
    try {
      const res = await eradicateSchool(schoolToEradicate.id);
      if (res.success) {
        toast.success(res.message || `Colegio ${schoolToEradicate.name} erradicado por completo.`);
        setSchoolToEradicate(null);
        setConfirmSlugInput('');
        await loadSummary();
      } else {
        toast.error(res.error || 'Error al erradicar colegio');
      }
    } catch (err: any) {
      toast.error('Error al erradicar colegio');
    } finally {
      setIsEradicating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-forest via-[#162218] to-forest/90 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-forest/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Superadmin • Directorio Global</span>
              </span>
              <span className="px-3 py-1 bg-white/10 text-slate-300 rounded-full text-xs font-medium">
                {schools.length} Colegios Registrados
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-white">
              Directorio de Colegios & Acceso Ghost
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Supervisa las escuelas conectadas a la plataforma, consulta sus ambientes y alumnos activos, o entra instantáneamente en <strong>Modo Fantasma (Ghost Owner)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={loadSummary}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateSchool}
              className="py-3 px-5 bg-terracotta hover:bg-terracotta/90 text-white rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer border border-white/20"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nuevo Colegio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-emerald-400">Total Colegios</span>
            <div className="w-9 h-9 rounded-2xl bg-forest/10 dark:bg-emerald-500/10 text-forest dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {totalMetrics.totalSchools}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {totalMetrics.activeTrials} en período de prueba • {totalMetrics.activePaid} con pago activo
          </span>
        </div>

        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F]">Alumnos en Red</span>
            <div className="w-9 h-9 rounded-2xl bg-[#C4661F]/10 text-[#C4661F] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {totalMetrics.totalStudents}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Estudiantes matriculados en la plataforma
          </span>
        </div>

        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ambientes Montessori</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {totalMetrics.totalEnvironments}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Salones y aulas configuradas
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#162218] p-4 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, slug o ciudad..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-forest dark:focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-muted-foreground shrink-0">Filtrar:</span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'trial', label: 'En Prueba (3M)' },
            { id: 'paid', label: 'Pagados' },
            { id: 'expired', label: 'Vencidos' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterSubscription(f.id)}
              className={`py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                filterSubscription === f.id
                  ? 'bg-forest text-white'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map(school => {
          const feat = (school.features as any) || {};
          const envCount = school.stats?.environmentsCount || 0;
          const studentCount = school.stats?.studentsCount || 0;
          const mrr = school.stats?.estimatedMrr || 14;

          const isTrial = school.trial?.isTrialActive;
          const daysLeft = school.trial?.daysRemaining || 0;
          const isPaid = school.billing?.subscriptionStatus === 'ACTIVE_PAID';

          return (
            <div
              key={school.id}
              className="bg-white dark:bg-[#162218] rounded-3xl border border-stone-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 relative overflow-hidden group"
            >
              <div className="space-y-4">
                {/* School Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {school.logoUrl ? (
                      <img
                        src={school.logoUrl}
                        alt={school.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs"
                        style={{ backgroundColor: school.primaryColor || '#1b3b2b' }}
                      >
                        {school.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {school.name}
                      </h3>
                      <span className="text-[11px] text-muted-foreground font-mono block truncate">
                        slug: {school.slug}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    ${mrr} USD/mes
                  </span>
                </div>

                {/* Trial / Subscription Status Pill */}
                <div className="p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: isPaid ? '#ecfdf5' : isTrial ? '#eff6ff' : '#fef2f2',
                    borderColor: isPaid ? '#a7f3d0' : isTrial ? '#bfdbfe' : '#fecaca',
                    color: isPaid ? '#065f46' : isTrial ? '#1e40af' : '#991b1b'
                  }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {isPaid
                        ? 'Suscripción Activa y Pagada'
                        : isTrial
                        ? `Prueba Gratuita (3 Meses): ${daysLeft} días restantes`
                        : 'Prueba Vencida: Pago Requerido'}
                    </span>
                  </div>
                  {onNavigateToBilling && (
                    <button
                      type="button"
                      onClick={onNavigateToBilling}
                      className="text-[10.5px] font-bold underline hover:opacity-80 cursor-pointer"
                    >
                      Facturación
                    </button>
                  )}
                </div>

                {/* Location */}
                <div className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">
                    {[school.city, school.province, school.country].filter(Boolean).join(', ') || 'Ubicación no especificada'}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Alumnos</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{studentCount}</span>
                  </div>
                  <div className="border-x border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Ambientes</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{envCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Staff</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{school.stats?.membershipsCount || 1}</span>
                  </div>
                </div>

                {/* Active Modules */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    Core Base
                  </span>
                  {feat.finances && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400">
                      Cobranza
                    </span>
                  )}
                  {(feat.webBuilder || feat.website) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400">
                      Web Builder
                    </span>
                  )}
                  {feat.forms && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      Formularios
                    </span>
                  )}
                  {feat.pipelines && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-700 dark:text-pink-400">
                      Pipelines
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEnterGhostMode(school)}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Entrar como Ghost (Owner)</span>
                </button>
                <a
                  href={`/?school=${school.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                  title="Ver sitio web público"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSchoolToEradicate(school);
                    setConfirmSlugInput('');
                  }}
                  className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Erradicar Colegio y Archivos"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: COMPLETE SCHOOL ERADICATION */}
      {schoolToEradicate && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162218] rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-2xl max-w-xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-rose-100 dark:border-rose-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
                  <AlertOctagon className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <span className="text-[10.5px] font-bold text-rose-600 uppercase tracking-wider block">
                    Acción Destructiva Irreversible
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Erradicar Colegio & Datos Completos
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEradicating) {
                    setSchoolToEradicate(null);
                    setConfirmSlugInput('');
                  }
                }}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
              <div className="font-bold text-sm text-slate-900 dark:text-white">{schoolToEradicate.name}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">slug: {schoolToEradicate.slug} (ID: {schoolToEradicate.id})</div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 space-y-2.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Esta operación eliminará de forma permanente e irrecuperable:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11.5px]">
                <li><strong>Todos los alumnos ({schoolToEradicate.stats?.studentsCount || 0})</strong>, historias clínicas, fichas y expedientes.</li>
                <li><strong>Todos los ambientes Montessori ({schoolToEradicate.stats?.environmentsCount || 0})</strong> y asignaciones docentes.</li>
                <li><strong>Todo el storage en disco físico:</strong> Documentos subidos, identificaciones KYC, galerías de fotos y PDFs.</li>
                <li><strong>Todos los formularios, admisiones ({schoolToEradicate.stats?.applicationsCount || 0}) y planes de cobranza.</strong></li>
                <li><strong>Membresías ({schoolToEradicate.stats?.membershipsCount || 0}) y cuentas de usuario asociadas</strong> que no tengan acceso a otros colegios.</li>
              </ul>
            </div>

            <form onSubmit={handleEradicateSchool} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                  Para confirmar la erradicación, escribe el slug del colegio:{' '}
                  <span className="font-mono text-rose-600 dark:text-rose-400 select-all bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/40">
                    {schoolToEradicate.slug}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={confirmSlugInput}
                  onChange={e => setConfirmSlugInput(e.target.value)}
                  placeholder={`Escribe "${schoolToEradicate.slug}" para confirmar`}
                  disabled={isEradicating}
                  className="w-full py-2.5 px-4 text-xs font-mono rounded-xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isEradicating}
                  onClick={() => {
                    setSchoolToEradicate(null);
                    setConfirmSlugInput('');
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isEradicating || confirmSlugInput.trim().toLowerCase() !== schoolToEradicate.slug.trim().toLowerCase()}
                  className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isEradicating ? 'Erradicando Colegio...' : 'Erradicar Colegio y Archivos'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
