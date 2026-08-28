import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  TrendingUp,
  DollarSign,
  Search,
  RefreshCw,
  Clock,
  Receipt,
  X,
  PlusCircle,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import {
  getSuperAdminSchoolsSummary,
  recordSchoolSubscriptionPayment,
  SuperAdminSchoolItem
} from '@/lib/sqlite';
import { toast } from 'sonner';

export const SuperAdminBillingSection: React.FC = () => {
  const [schools, setSchools] = useState<SuperAdminSchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubscription, setFilterSubscription] = useState<string>('all');

  // Selected school for subscription/billing modal
  const [selectedSchoolForBilling, setSelectedSchoolForBilling] = useState<SuperAdminSchoolItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Stripe / Tarjeta');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [extendTrialDays, setExtendTrialDays] = useState<string>('30');
  const [updatingBilling, setUpdatingBilling] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getSuperAdminSchoolsSummary();
      setSchools(data);
    } catch (err: any) {
      toast.error('Error al cargar datos de facturación global');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const totalMetrics = useMemo(() => {
    const totalSchools = schools.length;
    const totalEstimatedMrr = schools.reduce((acc, s) => acc + (s.stats?.estimatedMrr || 0), 0);
    const totalCollected = schools.reduce((acc, s) => acc + (s.billing?.totalPaid || 0), 0);
    const activeTrials = schools.filter(s => s.trial?.isTrialActive).length;
    const activePaid = schools.filter(s => s.billing?.subscriptionStatus === 'ACTIVE_PAID').length;
    const expiredTrials = schools.filter(s => !s.trial?.isTrialActive && s.billing?.subscriptionStatus !== 'ACTIVE_PAID').length;

    return {
      totalSchools,
      totalEstimatedMrr,
      totalCollected,
      activeTrials,
      activePaid,
      expiredTrials
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

      return true;
    });
  }, [schools, searchQuery, filterSubscription]);

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-forest via-[#162218] to-forest/90 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-forest/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Superadmin • Finanzas SaaS</span>
              </span>
              <span className="px-3 py-1 bg-white/10 text-slate-300 rounded-full text-xs font-medium">
                Multi-Tenant Subscription Matrix
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-white">
              Facturación Global & Suscripciones de Colegios
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Cada colegio cuenta con <strong>3 meses de prueba gratuita</strong> desde su fecha de creación en la base de datos. Consulta las fechas de cobro, registra pagos recibidos y monitorea el MRR recurrente.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSummary}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar Facturación</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">MRR Proyectado</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            ${totalMetrics.totalEstimatedMrr} <span className="text-sm font-sans font-normal text-muted-foreground">USD/m</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Ingreso recurrente mensual en red
          </span>
        </div>

        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Total Recaudado</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            ${totalMetrics.totalCollected} <span className="text-sm font-sans font-normal text-muted-foreground">USD</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Cobros históricos registrados
          </span>
        </div>

        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Pruebas Activas (3M)</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {totalMetrics.activeTrials}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Colegios en período de gracia full
          </span>
        </div>

        <div className="bg-white dark:bg-[#162218] p-5 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Suscripciones Pagadas</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {totalMetrics.activePaid}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {totalMetrics.expiredTrials} colegios con prueba vencida
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#162218] p-6 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-stone-100 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar colegio por nombre o slug..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-muted-foreground shrink-0">Filtrar Estado:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'trial', label: 'En Prueba' },
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

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Colegio / Workspace</th>
                <th className="py-3 px-4">Fecha Creación</th>
                <th className="py-3 px-4">Estado Suscripción</th>
                <th className="py-3 px-4">Fin de Prueba (3M)</th>
                <th className="py-3 px-4">MRR Proyectado</th>
                <th className="py-3 px-4">Total Pagado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
              {filteredSchools.map(s => {
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
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSchoolForBilling(s)}
                        className="py-1.5 px-3.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Gestionar Pago</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SCHOOL SUBSCRIPTION & PAYMENT MANAGEMENT */}
      {selectedSchoolForBilling && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162218] rounded-3xl border border-stone-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-stone-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10.5px] font-bold uppercase tracking-wider">
                    Gestión de Cobranza & Suscripción
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
    </div>
  );
};
