import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Layers,
  CreditCard,
  Eye,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Activity,
  CheckCircle2,
  TrendingUp,
  Globe,
  Sparkles,
  Server,
  Database,
  Mail,
  FolderLock,
  Workflow,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sliders,
  ChevronRight,
  Shield,
  Clock,
  AlertTriangle,
  Receipt,
  X,
  PlusCircle,
  HelpCircle,
  Trash2,
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react';
import {
  getSuperAdminSchoolsSummary,
  recordSchoolSubscriptionPayment,
  getSuperAdminInfrastructureStatus,
  eradicateSchool,
  SuperAdminSchoolItem,
  School
} from '@/lib/sqlite';
import { toast } from 'sonner';

interface SuperAdminHubSectionProps {
  activeHubTab?: 'schools' | 'billing' | 'infrastructure';
  onNavigateHubTab?: (tab: 'schools' | 'billing' | 'infrastructure') => void;
  onEnterGhostMode: (school: School) => void;
  onOpenCreateSchool: () => void;
}

export const SuperAdminHubSection: React.FC<SuperAdminHubSectionProps> = ({
  activeHubTab = 'schools',
  onNavigateHubTab,
  onEnterGhostMode,
  onOpenCreateSchool
}) => {
  const [schools, setSchools] = useState<SuperAdminSchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterSubscription, setFilterSubscription] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'schools' | 'billing' | 'infrastructure'>(activeHubTab);

  // Selected school for subscription/billing modal
  const [selectedSchoolForBilling, setSelectedSchoolForBilling] = useState<SuperAdminSchoolItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Stripe / Tarjeta');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [extendTrialDays, setExtendTrialDays] = useState<string>('30');
  const [updatingBilling, setUpdatingBilling] = useState(false);

  // Eradication state
  const [schoolToEradicate, setSchoolToEradicate] = useState<SuperAdminSchoolItem | null>(null);
  const [confirmSlugInput, setConfirmSlugInput] = useState<string>('');
  const [isEradicating, setIsEradicating] = useState<boolean>(false);

  // Live infrastructure status
  const [infraStatus, setInfraStatus] = useState<any>(null);
  const [loadingInfra, setLoadingInfra] = useState(false);

  useEffect(() => {
    setActiveTab(activeHubTab);
  }, [activeHubTab]);

  const handleTabChange = (tab: 'schools' | 'billing' | 'infrastructure') => {
    setActiveTab(tab);
    if (onNavigateHubTab) {
      onNavigateHubTab(tab);
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getSuperAdminSchoolsSummary();
      setSchools(data);
    } catch (err: any) {
      toast.error('Error al cargar resumen global de colegios');
    } finally {
      setLoading(false);
    }
  };

  const loadInfraStatus = async () => {
    setLoadingInfra(true);
    try {
      const data = await getSuperAdminInfrastructureStatus();
      setInfraStatus(data);
    } catch (err: any) {
      console.error('Error loading infrastructure status:', err);
    } finally {
      setLoadingInfra(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'infrastructure') {
      loadInfraStatus();
    }
  }, [activeTab]);

  // Aggregated platform metrics
  const totalMetrics = useMemo(() => {
    const totalSchools = schools.length;
    const totalStudents = schools.reduce((acc, s) => acc + (s.stats?.studentsCount || 0), 0);
    const totalEnvironments = schools.reduce((acc, s) => acc + (s.stats?.environmentsCount || 0), 0);
    const totalEstimatedMrr = schools.reduce((acc, s) => acc + (s.stats?.estimatedMrr || 0), 0);
    const totalCollected = schools.reduce((acc, s) => acc + (s.billing?.totalPaid || 0), 0);

    const activeTrials = schools.filter(s => s.trial?.isTrialActive).length;
    const activePaid = schools.filter(s => s.billing?.subscriptionStatus === 'ACTIVE_PAID').length;
    const expiredTrials = schools.filter(s => !s.trial?.isTrialActive && s.billing?.subscriptionStatus !== 'ACTIVE_PAID').length;

    return {
      totalSchools,
      totalStudents,
      totalEnvironments,
      totalEstimatedMrr,
      totalCollected,
      activeTrials,
      activePaid,
      expiredTrials
    };
  }, [schools]);

  // Filtered schools
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

  // Handle Recording Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForBilling) return;
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto de pago válido.');
      return;
    }

    setUpdatingBilling(true);
    try {
      const ok = await recordSchoolSubscriptionPayment(selectedSchoolForBilling.id, {
        paymentAmount: amount,
        paymentMethod,
        paymentReference,
        paymentNotes,
        status: 'ACTIVE_PAID'
      });

      if (ok) {
        toast.success(`Pago de $${amount} USD registrado exitosamente para ${selectedSchoolForBilling.name}`);
        setPaymentAmount('');
        setPaymentReference('');
        setPaymentNotes('');
        await loadSummary();
        const updated = (await getSuperAdminSchoolsSummary()).find(s => s.id === selectedSchoolForBilling.id);
        if (updated) setSelectedSchoolForBilling(updated);
      } else {
        toast.error('No se pudo registrar el pago.');
      }
    } catch (err: any) {
      toast.error('Error al registrar pago');
    } finally {
      setUpdatingBilling(false);
    }
  };

  // Handle Extending Trial
  const handleExtendTrial = async () => {
    if (!selectedSchoolForBilling) return;
    const days = Number(extendTrialDays);
    if (isNaN(days) || days <= 0) return;

    setUpdatingBilling(true);
    try {
      const ok = await recordSchoolSubscriptionPayment(selectedSchoolForBilling.id, {
        extendTrialDays: days,
        status: 'TRIAL_ACTIVE'
      });

      if (ok) {
        toast.success(`Período de prueba extendido por ${days} días.`);
        await loadSummary();
        const updated = (await getSuperAdminSchoolsSummary()).find(s => s.id === selectedSchoolForBilling.id);
        if (updated) setSelectedSchoolForBilling(updated);
      } else {
        toast.error('No se pudo extender el período de prueba.');
      }
    } catch (err) {
      toast.error('Error al extender prueba');
    } finally {
      setUpdatingBilling(false);
    }
  };

  // Handle Eradication
  const handleEradicateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolToEradicate) return;

    if (confirmSlugInput.trim().toLowerCase() !== schoolToEradicate.slug.trim().toLowerCase()) {
      toast.error(`Debes escribir exactamente el slug "${schoolToEradicate.slug}" para confirmar la erradicación.`);
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
                <span>Superadmin Hub Global</span>
              </span>
              <span className="px-3 py-1 bg-white/10 text-slate-300 rounded-full text-xs font-medium">
                Multi-Tenant Architecture
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-white">
              Centro de Control Global Montessori Nexus
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Supervisa colegios registrados, períodos de prueba gratuitos (3 meses full access), facturación y suscripciones multi-tenant, o accede en <strong>Modo Fantasma (Ghost Owner)</strong>.
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

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-emerald-400">Colegios Activos</span>
            <div className="w-9 h-9 rounded-2xl bg-forest/10 dark:bg-emerald-500/10 text-forest dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {totalMetrics.totalSchools}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {totalMetrics.activeTrials} en prueba (3 meses) • {totalMetrics.activePaid} pagos activos
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
            {totalMetrics.totalEnvironments} ambientes Montessori activos
          </span>
        </div>

        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">MRR Mensual Proyectado</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            ${totalMetrics.totalEstimatedMrr} <span className="text-sm font-sans font-normal text-muted-foreground">USD/mes</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Facturación recurrente post-trial
          </span>
        </div>

        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Recaudado Histórico</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            ${totalMetrics.totalCollected} <span className="text-sm font-sans font-normal text-muted-foreground">USD</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Pagos procesados y registrados
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('schools')}
          className={`py-2.5 px-5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'schools'
              ? 'bg-forest text-white shadow-sm'
              : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Directorio de Colegios ({schools.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('billing')}
          className={`py-2.5 px-5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-forest text-white shadow-sm'
              : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Facturación & Suscripciones Multi-Tenant</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('infrastructure')}
          className={`py-2.5 px-5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'infrastructure'
              ? 'bg-forest text-white shadow-sm'
              : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Infraestructura & Colas</span>
        </button>
      </div>

      {/* TAB 1: SCHOOLS DIRECTORY & GHOST ACCESS */}
      {activeTab === 'schools' && (
        <div className="space-y-5">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#162218] p-4 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar colegio por nombre, slug, ciudad..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-forest dark:focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-muted-foreground shrink-0">Suscripción:</span>
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

          {/* Schools Grid */}
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
                      <button
                        type="button"
                        onClick={() => setSelectedSchoolForBilling(school)}
                        className="text-[10.5px] font-bold underline hover:opacity-80 cursor-pointer"
                      >
                        Gestionar
                      </button>
                    </div>

                    {/* Meta location */}
                    <div className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">
                        {[school.city, school.province, school.country].filter(Boolean).join(', ') || 'Ubicación no especificada'}
                      </span>
                    </div>

                    {/* Operational Stats Grid */}
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

                    {/* Active Modules Badges */}
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

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEnterGhostMode(school)}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Entrar como Ghost (Owner)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSchoolForBilling(school)}
                      className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-[#C4661F] rounded-xl transition-all cursor-pointer"
                      title="Gestionar Suscripción & Pagos"
                    >
                      <Receipt className="w-4 h-4" />
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
        </div>
      )}

      {/* TAB 2: GLOBAL BILLING BREAKDOWN & TRIAL ENGINE */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#162218] p-6 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Matriz de Facturación y Suscripciones de Colegios
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cada colegio cuenta con 3 meses de prueba gratuita desde su fecha de creación en la base de datos.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-stone-50 dark:bg-slate-900 p-3 rounded-2xl border border-stone-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">Total Recaudado</span>
                  <span className="text-lg font-bold text-emerald-600">${totalMetrics.totalCollected} USD</span>
                </div>
                <div className="border-l border-stone-200 dark:border-slate-700 pl-3">
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">MRR Recurrente</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">${totalMetrics.totalEstimatedMrr} USD/mes</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Colegio / Workspace</th>
                    <th className="py-3 px-4">Fecha Creación</th>
                    <th className="py-3 px-4">Estado Suscripción</th>
                    <th className="py-3 px-4">Fin de Prueba (3M)</th>
                    <th className="py-3 px-4">MRR Estimado</th>
                    <th className="py-3 px-4">Total Pagado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                  {schools.map(s => {
                    const isTrial = s.trial?.isTrialActive;
                    const daysLeft = s.trial?.daysRemaining || 0;
                    const isPaid = s.billing?.subscriptionStatus === 'ACTIVE_PAID';
                    const totalPaid = s.billing?.totalPaid || 0;
                    const mrr = s.stats?.estimatedMrr || 14;

                    const createdStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                    const trialEndStr = s.trial?.trialEndsAt ? new Date(s.trial.trialEndsAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                    return (
                      <tr key={s.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{s.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground font-normal">slug: {s.slug}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {createdStr}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1"
                            style={{
                              backgroundColor: isPaid ? '#ecfdf5' : isTrial ? '#eff6ff' : '#fef2f2',
                              color: isPaid ? '#065f46' : isTrial ? '#1e40af' : '#991b1b'
                            }}
                          >
                            {isPaid ? 'Pagado y Activo' : isTrial ? `Trial (${daysLeft}d restantes)` : 'Trial Vencido'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {trialEndStr}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          ${mrr} USD/mes
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          ${totalPaid} USD
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSchoolForBilling(s)}
                            className="py-1.5 px-3 bg-forest hover:bg-forest/90 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Facturar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSchoolToEradicate(s);
                              setConfirmSlugInput('');
                            }}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Erradicar Colegio y Archivos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INFRASTRUCTURE & BACKEND SERVICES */}
      {activeTab === 'infrastructure' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-[#162218] p-4 rounded-2xl border border-stone-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Estado Operativo de Servidores y Microservicios
              </h3>
              <span className="text-xs text-muted-foreground">
                Monitoreo en tiempo real de colas BullMQ, PostgreSQL y Deepstream
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadInfraStatus}
                className="py-2 px-3 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingInfra ? 'animate-spin' : ''}`} />
                <span>Verificar Conexiones</span>
              </button>
              <a
                href="/admin/queues"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Abrir Bull Board UI</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BullMQ Email Queue */}
            <div className="bg-white dark:bg-[#162218] p-6 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span>Cola de Correos y Comunicados (email-queue)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {infraStatus?.queues?.redisStatus || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Despacho masivo y concurrente de boletines semanales, avisos urgentes e invitaciones a tutores.
              </p>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">En Espera</span>
                  <span className="text-lg font-bold text-amber-600">{infraStatus?.queues?.emailQueue?.waiting || 0}</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Activos</span>
                  <span className="text-lg font-bold text-blue-600">{infraStatus?.queues?.emailQueue?.active || 0}</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Completados</span>
                  <span className="text-lg font-bold text-emerald-600">{infraStatus?.queues?.emailQueue?.completed || 0}</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Fallidos</span>
                  <span className="text-lg font-bold text-rose-600">{infraStatus?.queues?.emailQueue?.failed || 0}</span>
                </div>
              </div>
            </div>

            {/* BullMQ KYC Verification Queue */}
            <div className="bg-white dark:bg-[#162218] p-6 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderLock className="w-5 h-5 text-amber-500" />
                  <span>Cola de Verificación KYC / Documentos (kyc-queue)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {infraStatus?.queues?.redisStatus || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Análisis OCR inteligente y validación criptográfica de actas, identificaciones y comprobantes de domicilio.
              </p>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">En Espera</span>
                  <span className="text-lg font-bold text-amber-600">{infraStatus?.queues?.kycQueue?.waiting || 0}</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Activos</span>
                  <span className="text-lg font-bold text-blue-600">{infraStatus?.queues?.kycQueue?.active || 0}</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Completados</span>
                  <span className="text-lg font-bold text-emerald-600">{infraStatus?.queues?.kycQueue?.completed || 0}</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Fallidos</span>
                  <span className="text-lg font-bold text-rose-600">{infraStatus?.queues?.kycQueue?.failed || 0}</span>
                </div>
              </div>
            </div>

            {/* PostgreSQL Engine */}
            <div className="bg-white dark:bg-[#162218] p-6 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                <span>Base de Datos PostgreSQL Multi-Tenant</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pool de conexiones activo con adaptador PrismaPg. Partición multi-tenant nativa.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Conexión establecida y verificada</span>
                </div>
                <span className="font-mono font-bold">Latencia: {infraStatus?.database?.latencyMs || 5}ms</span>
              </div>
            </div>

            {/* Deepstream Realtime */}
            <div className="bg-white dark:bg-[#162218] p-6 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <span>Servidor Realtime WebSocket (Deepstream)</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sincronización bidireccional instantánea de asistencia en vivo, avisos y tableros Montessori.
              </p>
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>WebSocket Bridge Activo</span>
                </div>
                <span className="font-mono text-[11px] truncate max-w-[180px]">{infraStatus?.realtime?.endpoint || 'Connected'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHOOL SUBSCRIPTION & PAYMENT MANAGEMENT */}
      {selectedSchoolForBilling && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162218] rounded-3xl border border-stone-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[#C4661F] text-[10.5px] font-bold uppercase tracking-wider">
                    Suscripción & Cobranza
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">slug: {selectedSchoolForBilling.slug}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedSchoolForBilling.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchoolForBilling(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trial & Subscription Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Período de Prueba</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mt-1">
                  {selectedSchoolForBilling.trial?.isTrialActive
                    ? `${selectedSchoolForBilling.trial.daysRemaining} días restantes`
                    : 'Prueba Vencida'}
                </span>
                <span className="text-[10.5px] text-muted-foreground block mt-0.5">
                  Vence: {selectedSchoolForBilling.trial?.trialEndsAt ? new Date(selectedSchoolForBilling.trial.trialEndsAt).toLocaleDateString('es-MX') : 'N/A'}
                </span>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Tarifa Mensual (MRR)</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white block mt-1">
                  ${selectedSchoolForBilling.stats?.estimatedMrr || 14} USD/mes
                </span>
                <span className="text-[10.5px] text-muted-foreground block mt-0.5">
                  Base ($14) + {selectedSchoolForBilling.stats?.environmentsCount || 0} amb.
                </span>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-2xl border border-stone-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Total Pagado a la Fecha</span>
                <span className="text-lg font-bold text-emerald-600 block mt-1">
                  ${selectedSchoolForBilling.billing?.totalPaid || 0} USD
                </span>
                <span className="text-[10.5px] text-muted-foreground block mt-0.5">
                  {selectedSchoolForBilling.billing?.paymentHistory?.length || 0} pagos registrados
                </span>
              </div>
            </div>

            {/* Quick Trial Extension */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Extender Período de Prueba Gratuita</span>
                </h4>
                <div className="flex items-center gap-2">
                  <select
                    value={extendTrialDays}
                    onChange={e => setExtendTrialDays(e.target.value)}
                    className="text-xs font-bold py-1 px-2.5 rounded-xl border border-amber-300 bg-white text-stone-900 focus:outline-none"
                  >
                    <option value="15">+15 días</option>
                    <option value="30">+30 días (1 mes)</option>
                    <option value="60">+60 días (2 meses)</option>
                    <option value="90">+90 días (3 meses)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExtendTrial}
                    disabled={updatingBilling}
                    className="py-1 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {updatingBilling ? 'Guardando...' : 'Aplicar Extensión'}
                  </button>
                </div>
              </div>
            </div>

            {/* Record Payment Form */}
            <form onSubmit={handleRecordPayment} className="p-5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-forest dark:text-emerald-400" />
                <span>Registrar Nuevo Pago de Suscripción</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Monto Pagado ($ USD):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="Ej. 14.00 o 45.00"
                    className="w-full py-2 px-3 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Método de Pago:</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Stripe / Tarjeta">Stripe / Tarjeta Online</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Transferencia SPEI / Banco">Transferencia SPEI / Banco</option>
                    <option value="Depósito Directo">Depósito Directo</option>
                    <option value="Cortesía / Beca Institucional">Cortesía / Beca Institucional</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Folio / Referencia:</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="Ej. TX-984210 / Stripe ch_12345"
                    className="w-full py-2 px-3 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Notas:</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="Ej. Suscripción mensual adelantada"
                    className="w-full py-2 px-3 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingBilling}
                  className="py-2.5 px-5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{updatingBilling ? 'Procesando...' : 'Confirmar Registro de Pago'}</span>
                </button>
              </div>
            </form>

            {/* Payment History Ledger */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Historial de Pagos Registrados
              </h4>

              {(!selectedSchoolForBilling.billing?.paymentHistory || selectedSchoolForBilling.billing.paymentHistory.length === 0) ? (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900 text-center text-xs text-muted-foreground border border-stone-100 dark:border-slate-800">
                  No hay pagos registrados aún para este colegio.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSchoolForBilling.billing.paymentHistory.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="text-emerald-600 font-bold">${p.amount} USD</span>
                          <span>•</span>
                          <span>{p.method}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.date ? new Date(p.date).toLocaleString('es-MX') : 'Fecha no registrada'}
                          {p.reference && ` • Ref: ${p.reference}`}
                          {p.notes && ` • ${p.notes}`}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                        Completado
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE SCHOOL ERADICATION */}
      {schoolToEradicate && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162218] rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-2xl max-w-xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
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

            {/* School identity box */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
              <div className="font-bold text-sm text-slate-900 dark:text-white">{schoolToEradicate.name}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">slug: {schoolToEradicate.slug} (ID: {schoolToEradicate.id})</div>
            </div>

            {/* Warning items list */}
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

            {/* Confirmation form */}
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
