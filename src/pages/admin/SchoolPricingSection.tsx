import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Layers,
  Building,
  Building2,
  HardDrive,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Zap,
  Users,
  UserCheck,
  Calendar,
  Activity,
  Workflow,
  Mail,
  FolderLock,
  Image as ImageIcon,
  Brain,
  HelpCircle,
  ExternalLink,
  Plus,
  Minus,
  AlertTriangle,
  Lock,
  Trash2,
  Tag,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEnvironments, EnvironmentItem, School } from '@/lib/sqlite';
import { toast } from 'sonner';

// PRICING CONSTANTS
export const PRICING_CONFIG = {
  environmentTier1: 25, // 1st environment = $25 USD
  environmentTier2: 12.5, // 2nd+ environment = 50% discount ($12.5 USD)
  storage10GbUnit: 5,

  // Core Base Modules (Mandatory in membership) = $14 USD base
  waitlist: 1,
  portalParents: 5,
  portalTeachers: 5,
  progressTracking: 1,
  attendance: 1,
  calendar: 1,

  // Optional Add-on Modules
  finances: 12,
  newsletterSmtp: 3,
  websiteBuilder: 18,
  forms: 9,
  pipelines: 9,
};

export const AnimatedPriceCounter: React.FC<{
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}> = ({ value, className = '', prefix = '$', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 400; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

export interface NewEnvironmentEntry {
  id: string;
  name: string;
  stage?: string;
}

export const SchoolPricingSection: React.FC = () => {
  const navigate = useNavigate();
  const { activeMembership, user } = useAuth();
  const school = activeMembership?.school;

  const basePath = useMemo(() => {
    const p = window.location.pathname;
    if (p.startsWith('/console')) return '/console';
    if (p.startsWith('/admin')) return '/admin';
    return '/panel';
  }, []);

  // Wizard Step State (1: Ambientes, 2: Módulos Opcionales, 3: Almacenamiento, 4: Confirmación & Pago)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Environments State
  const [existingEnvironments, setExistingEnvironments] = useState<EnvironmentItem[]>([]);
  const [selectedExistingEnvIds, setSelectedExistingEnvIds] = useState<string[]>([]);
  const [newEnvironments, setNewEnvironments] = useState<NewEnvironmentEntry[]>([]);
  const [newEnvNameInput, setNewEnvNameInput] = useState('');
  const [loadingEnvs, setLoadingEnvs] = useState(true);

  // Load real existing environments from DB
  useEffect(() => {
    getEnvironments()
      .then((data) => {
        setExistingEnvironments(data);
        if (data && data.length > 0) {
          // Select all existing environments by default
          setSelectedExistingEnvIds(data.map((e) => e.id));
        } else {
          // If 0 environments in DB, prefill with 2 recommended draft environments
          setSelectedExistingEnvIds([]);
          setNewEnvironments([
            { id: 'draft_env_1', name: 'Comunidad Infantil' },
            { id: 'draft_env_2', name: 'Casa de Niños' }
          ]);
        }
      })
      .catch((err) => {
        console.error('Error fetching environments:', err);
        setNewEnvironments([
          { id: 'draft_env_1', name: 'Comunidad Infantil' },
          { id: 'draft_env_2', name: 'Casa de Niños' }
        ]);
      })
      .finally(() => setLoadingEnvs(false));
  }, [school?.id]);

  // Total active environments in configuration
  const totalActiveEnvsCount = useMemo(() => {
    return selectedExistingEnvIds.length + newEnvironments.length;
  }, [selectedExistingEnvIds.length, newEnvironments.length]);

  // Active environments list for summary
  const activeEnvironmentsList = useMemo(() => {
    const existingSelected = existingEnvironments
      .filter((e) => selectedExistingEnvIds.includes(e.id))
      .map((e) => ({ id: e.id, name: e.name, isExisting: true }));
    const newOnes = newEnvironments.map((e) => ({ id: e.id, name: e.name, isExisting: false }));
    return [...existingSelected, ...newOnes];
  }, [existingEnvironments, selectedExistingEnvIds, newEnvironments]);

  const feat = (school?.features && typeof school.features === 'object') ? school.features : {};

  // Calculator state preloaded from school features
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(feat.billingCycle || 'monthly');
  const [storageTier, setStorageTier] = useState<'2gb_free' | '12gb' | '22gb' | '52gb' | 'byos_aws'>(feat.storageTier || '2gb_free');

  const [selectedOptionalModules, setSelectedOptionalModules] = useState<{
    finances: boolean;
    websiteBuilder: boolean;
    forms: boolean;
    pipelines: boolean;
    newsletterSmtp: boolean;
  }>({
    finances: feat.finances ?? false,
    websiteBuilder: feat.webBuilder ?? feat.website ?? false,
    forms: feat.forms ?? false,
    pipelines: feat.pipelines ?? false,
    newsletterSmtp: feat.newsletters ?? false,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Toggle selection of an existing environment
  const toggleExistingEnv = (envId: string) => {
    setSelectedExistingEnvIds((prev) => {
      if (prev.includes(envId)) {
        return prev.filter((id) => id !== envId);
      } else {
        return [...prev, envId];
      }
    });
  };

  // Add a new environment
  const handleAddNewEnvironment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newEnvNameInput.trim();
    if (!trimmed) {
      toast.error('Por favor escribe el nombre del nuevo ambiente.');
      return;
    }

    const newEntry: NewEnvironmentEntry = {
      id: `new_env_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed
    };

    setNewEnvironments((prev) => [...prev, newEntry]);
    setNewEnvNameInput('');
    toast.success(`Ambiente "${trimmed}" agregado.`);
  };

  // Remove a newly added environment
  const handleRemoveNewEnv = (envId: string) => {
    setNewEnvironments((prev) => prev.filter((e) => e.id !== envId));
  };

  // Modular Pricing Real-time Calculation with 50% discount from 2nd environment
  const pricingSummary = useMemo(() => {
    // 1. Mandatory Core Base ($14 USD)
    const coreBaseTotal = 14;

    // 2. Environments Cost:
    // 1st environment = $25 USD
    // 2nd and subsequent = 50% discount ($12.50 USD each)
    let environmentsCost = 0;
    if (totalActiveEnvsCount === 1) {
      environmentsCost = PRICING_CONFIG.environmentTier1; // $25
    } else if (totalActiveEnvsCount > 1) {
      environmentsCost =
        PRICING_CONFIG.environmentTier1 +
        (totalActiveEnvsCount - 1) * PRICING_CONFIG.environmentTier2; // $25 + (N-1)*$12.50
    }

    // 3. Optional Modules Cost
    let optionalModulesCost = 0;
    let selectedModulesCount = 0;
    if (selectedOptionalModules.finances) {
      optionalModulesCost += PRICING_CONFIG.finances;
      selectedModulesCount++;
    }
    if (selectedOptionalModules.newsletterSmtp) {
      optionalModulesCost += PRICING_CONFIG.newsletterSmtp;
      selectedModulesCount++;
    }
    if (selectedOptionalModules.websiteBuilder) {
      optionalModulesCost += PRICING_CONFIG.websiteBuilder;
      selectedModulesCount++;
    }
    if (selectedOptionalModules.forms) {
      optionalModulesCost += PRICING_CONFIG.forms;
      selectedModulesCount++;
    }
    if (selectedOptionalModules.pipelines) {
      optionalModulesCost += PRICING_CONFIG.pipelines;
      selectedModulesCount++;
    }

    // 4. Storage Cost
    let storageCost = 0;
    if (storageTier === '12gb') storageCost = PRICING_CONFIG.storage10GbUnit * 1;
    if (storageTier === '22gb') storageCost = PRICING_CONFIG.storage10GbUnit * 2;
    if (storageTier === '52gb') storageCost = PRICING_CONFIG.storage10GbUnit * 5;

    // Monthly Subtotal
    const monthlyTotal = coreBaseTotal + environmentsCost + optionalModulesCost + storageCost;

    // Annual Calculation (Pay 10 months, get 12 = 2 months free)
    const annualEquivalentMonthly = Math.round((monthlyTotal * 10) / 12);
    const annualBilledTotal = monthlyTotal * 10;

    return {
      coreBaseTotal,
      environmentsCost,
      optionalModulesCost,
      selectedModulesCount,
      storageCost,
      monthlyTotal,
      annualEquivalentMonthly,
      annualBilledTotal
    };
  }, [totalActiveEnvsCount, selectedOptionalModules, storageTier]);

  const handleProceedToNextStep = () => {
    if (currentStep === 1) {
      if (totalActiveEnvsCount < 1) {
        toast.error('Se requiere como mínimo 1 ambiente configurado para tu colegio.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleProceedToPayment = async () => {
    if (totalActiveEnvsCount < 1) {
      toast.error('No se puede crear un plan con 0 salones. Debes seleccionar al menos 1 ambiente.');
      setCurrentStep(1);
      return;
    }
    if (!school) return;
    setIsSaving(true);
    try {
      // Save desired configuration in features
      const payload = {
        features: {
          ...feat,
          finances: selectedOptionalModules.finances,
          webBuilder: selectedOptionalModules.websiteBuilder,
          website: selectedOptionalModules.websiteBuilder,
          forms: selectedOptionalModules.forms,
          pipelines: selectedOptionalModules.pipelines,
          newsletters: selectedOptionalModules.newsletterSmtp,
          storageTier,
          billingCycle,
          configuredEnvironmentsCount: totalActiveEnvsCount
        }
      };

      const res = await fetch(`/api/schools/${school.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error al sincronizar configuración del plan');
      }

      toast.success('Configuración de suscripción guardada.');
      toast.info('Redirigiendo a pasarela segura de pago...');

      const environmentsListStr = activeEnvironmentsList.map((e, idx) => `  ${idx + 1}. ${e.name} ${e.isExisting ? '(Existente)' : '(Nuevo)'}`).join('\n');
      const subject = encodeURIComponent(`Activación Suscripción Colegio ${school.name}`);
      const body = encodeURIComponent(
        `Hola Equipo de Montessori Nexus,\n\nDeseo activar la membresía para el colegio: ${school.name} (${school.slug})\n\nConfiguración elegida:\n- Ambientes (${totalActiveEnvsCount}):\n${environmentsListStr}\n\n- Facturación: ${billingCycle === 'annual' ? 'Anual (2 meses gratis)' : 'Mensual'}\n- Módulos opcionales: ${Object.entries(selectedOptionalModules).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Ninguno'}\n- Almacenamiento: ${storageTier}\n- Total estimado: $${billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal} USD/mes (Facturado: $${billingCycle === 'annual' ? pricingSummary.annualBilledTotal : pricingSummary.monthlyTotal} USD)\n\nPor favor envíenme el enlace de pago seguro con tarjeta o los datos para transferencia bancaria SPEI.`
      );
      window.location.href = `mailto:soporte@montessorinexus.com?subject=${subject}&body=${body}`;
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar suscripción');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-body animate-in fade-in duration-300 pb-32 xl:pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* TOP HEADER HERO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-forest/10 pb-6 pt-2">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/dashboard`)}
            className="inline-flex items-center gap-2 text-xs font-bold text-forest hover:text-forest/80 hover:underline mb-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center border border-forest/15 shadow-2xs">
              <Sparkles className="w-5 h-5 text-forest" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white">
                Arma tu Suscripción a la Medida
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Configura los salones, herramientas y almacenamiento para tu colegio <strong className="text-slate-900 dark:text-white">{school?.name}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="p-1.5 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-forest shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pago Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-forest text-white shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Pago Anual</span>
            <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full font-black">
              2 MESES GRATIS
            </span>
          </button>
        </div>
      </div>

      {/* STEP INDICATOR BAR */}
      <div className="bg-stone-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        {[
          { step: 1, label: '1. Ambientes', icon: Building2 },
          { step: 2, label: '2. Módulos Opcionales', icon: Layers },
          { step: 3, label: '3. Almacenamiento', icon: HardDrive },
          { step: 4, label: '4. Resumen y Pago', icon: CreditCard }
        ].map((s) => {
          const StepIcon = s.icon;
          const isCurrent = currentStep === s.step;
          const isPassed = currentStep > s.step;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                // Only allow switching to step if step 1 is valid or going back
                if (s.step > 1 && totalActiveEnvsCount < 1) {
                  toast.error('Configura al menos 1 ambiente en el Paso 1 antes de continuar.');
                  return;
                }
                setCurrentStep(s.step as any);
              }}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-forest text-white shadow-xs'
                  : isPassed
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'text-muted-foreground hover:text-slate-900 hover:bg-stone-200/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isCurrent ? 'bg-white text-forest font-black' : isPassed ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-slate-700 text-stone-600'
              }`}>
                {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : s.step}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN RESPONSIVE WIZARD CONTAINER (Single column below xl, 2-column with min 320px summary at xl+) */}
      <div className="flex flex-col xl:flex-row items-start gap-8">
        {/* LEFT COLUMN: ACTIVE STEP CONTENT */}
        <div className="w-full xl:flex-1 min-w-0 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: AMBIENTES (LIST EXISTING + ADD NEW + 50% DISCOUNT FROM 2ND) */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                      Paso 1 de 4 • Salones Escolares
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <Tag className="w-3 h-3" />
                      50% OFF a partir del 2º ambiente
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                    Selecciona y agrega los ambientes de tu colegio
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Marca los salones existentes que deseas mantener activos o añade nuevos ambientes. El 1er ambiente cuesta $25 USD y cada ambiente adicional tiene un <strong>50% de descuento ($12.50 USD)</strong>.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-forest bg-forest/10 px-3 py-1.5 rounded-xl inline-block">
                    ${pricingSummary.environmentsCost} USD/mes
                  </span>
                </div>
              </div>

              {/* Existing Environments Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ambientes Actuales en tu Cuenta ({existingEnvironments.length})
                  </h4>
                  {existingEnvironments.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExistingEnvIds(existingEnvironments.map((e) => e.id))}
                        className="text-[11px] font-bold text-forest hover:underline cursor-pointer"
                      >
                        Marcar todos
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExistingEnvIds([])}
                        className="text-[11px] font-bold text-muted-foreground hover:underline cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    </div>
                  )}
                </div>

                {existingEnvironments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {existingEnvironments.map((env, idx) => {
                      const isSelected = selectedExistingEnvIds.includes(env.id);
                      return (
                        <div
                          key={env.id}
                          onClick={() => toggleExistingEnv(env.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-forest bg-forest/5 ring-1 ring-forest/20 shadow-2xs'
                              : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/40 opacity-60 hover:opacity-100 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-forest border-forest text-white' : 'border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold block truncate text-slate-900 dark:text-white">
                                {env.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {env.stage || 'Ambiente Montessori'} {env.capacity ? `• Capacidad: ${env.capacity}` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest dark:text-emerald-400 shrink-0">
                            Existente
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No tienes salones registrados previamente. Agrega a continuación los ambientes que tendrá tu colegio.</span>
                  </div>
                )}
              </div>

              {/* Newly Added Environments List */}
              {newEnvironments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Nuevos Ambientes por Crear ({newEnvironments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {newEnvironments.map((env, idx) => (
                      <div
                        key={env.id}
                        className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate text-slate-900 dark:text-white">
                              {env.name}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Nuevo ambiente a registrar
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewEnv(env.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar este ambiente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form to add more environments */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-forest" />
                  <span>Agregar un Nuevo Ambiente al Plan</span>
                </h4>
                <form onSubmit={handleAddNewEnvironment} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={newEnvNameInput}
                    onChange={(e) => setNewEnvNameInput(e.target.value)}
                    placeholder="Ej. Nido / Bebés, Comunidad Infantil II, Taller I..."
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Ambiente</span>
                  </button>
                </form>
              </div>

              {/* Validation Warning & Summary Badge */}
              <div className="pt-2">
                {totalActiveEnvsCount === 0 ? (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center gap-3 text-red-900 dark:text-red-200 text-xs">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">Mínimo 1 ambiente requerido</strong>
                      <span>No se admiten escuelas con 0 salones. Por favor marca al menos un salón existente o agrega un nuevo ambiente para continuar.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-forest/5 dark:bg-emerald-500/10 border border-forest/15 flex items-center justify-between gap-4 flex-wrap text-xs">
                    <div className="flex items-center gap-2 font-bold text-forest dark:text-emerald-400">
                      <Building2 className="w-4 h-4" />
                      <span>{totalActiveEnvsCount} {totalActiveEnvsCount === 1 ? 'Ambiente configurado' : 'Ambientes configurados'}</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {totalActiveEnvsCount === 1 ? (
                        <span>1 salón base = $25 USD/mes</span>
                      ) : (
                        <span>1 salón base ($25) + {totalActiveEnvsCount - 1} adicional{totalActiveEnvsCount - 1 > 1 ? 'es' : ''} con 50% OFF (${(totalActiveEnvsCount - 1) * 12.5}) = ${pricingSummary.environmentsCost} USD/mes</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Core Base Included Essentials Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-stone-50/80 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-forest dark:text-emerald-400 bg-forest/10 px-2 py-0.5 rounded-full">
                        Membresía Base ($14 USD/mes)
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>100% Incluido</span>
                      </span>
                    </div>
                    <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white mt-1.5">
                      Herramientas Pedagógicas Esenciales Incluidas
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Todos tus salones seleccionados cuentan con acceso ilimitado a las funciones core:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {[
                    { label: 'Portal de Familias', desc: 'Web & Móvil para padres y tutores', icon: Users },
                    { label: 'Portal de Guías', desc: 'Gestión pedagógica del salón', icon: UserCheck },
                    { label: 'Seguimiento Montessori', desc: 'Presentaciones, ciclos 3h y notas', icon: Sparkles },
                    { label: 'Control de Asistencia', desc: 'Pase de lista y presentismo', icon: Calendar },
                    { label: 'Trackers de Hábitos', desc: 'Esfínteres, sueño y comida', icon: Activity },
                    { label: 'Lista de Espera', desc: 'Admisiones y nuevos prospectos', icon: Workflow },
                    { label: 'Calendario & Eventos', desc: 'Agenda escolar unificada', icon: Calendar },
                    { label: 'Circulares Oficiales', desc: 'Comunicados directos a familias', icon: Mail },
                    { label: 'Bóveda de Expedientes', desc: 'Fichas médicas y documentos', icon: FolderLock }
                  ].map((item, idx) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-stone-200/70 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-forest/10 text-forest dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <ItemIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold block leading-tight truncate text-slate-800 dark:text-slate-200">
                              {item.label}
                            </span>
                            <span className="text-[9.5px] text-muted-foreground block truncate">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="flex justify-end pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={totalActiveEnvsCount < 1}
                  onClick={handleProceedToNextStep}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                    totalActiveEnvsCount < 1
                      ? 'bg-stone-300 dark:bg-slate-800 text-stone-500 cursor-not-allowed opacity-60'
                      : 'bg-forest hover:bg-forest/90 text-white hover:scale-102 active:scale-98 cursor-pointer'
                  }`}
                >
                  <span>Siguiente: Módulos Opcionales</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: OPTIONAL MODULES */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                    Paso 2 de 4 • Módulos a la Carta
                  </span>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                    Selecciona herramientas opcionales
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agrega únicamente las herramientas especializadas que requiere tu equipo administrativo.
                  </p>
                </div>
                <span className="text-xs font-bold font-mono text-forest bg-forest/10 px-3 py-1.5 rounded-xl shrink-0">
                  +${pricingSummary.optionalModulesCost} USD/mes
                </span>
              </div>

              <div className="space-y-3">
                {/* Cobranza & Finanzas */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.finances
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.finances}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, finances: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Cobranza, Colegiaturas & Facturación Electrónica
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Planes de pago flexibles, cargos recurrentes, suscripciones automatizadas con tu propia cuenta de Stripe o Mercado Pago, estados de cuenta para tutores y recordatorios automáticos.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.finances} USD/mes
                  </span>
                </label>

                {/* Website + Web Builder + Analytics */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.websiteBuilder
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.websiteBuilder}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, websiteBuilder: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Diseñador Web Visual Pro + Dominio Propio
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Editor de landing page de alta conversión, analíticas de tráfico web en vivo y SEO optimizado.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.websiteBuilder} USD/mes
                  </span>
                </label>

                {/* Formularios Pro */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.forms
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.forms}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedOptionalModules((prev) => ({
                          ...prev,
                          forms: isChecked,
                          // Deselecting forms automatically deselects pipelines
                          pipelines: isChecked ? prev.pipelines : false
                        }));
                      }}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Gestor de Formularios & Encuestas Dinámicas
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Crea formularios de contacto, encuestas de satisfacción, pre-matrículas y recolección de firmas.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.forms} USD/mes
                  </span>
                </label>

                {/* Pipelines de Procesos Configurables (Depends on Forms) */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.pipelines
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.pipelines}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedOptionalModules((prev) => ({
                          ...prev,
                          pipelines: isChecked,
                          // Selecting pipelines automatically selects forms as well
                          forms: isChecked ? true : prev.forms
                        }));
                        if (isChecked && !selectedOptionalModules.forms) {
                          toast.info('Se activó automáticamente el Gestor de Formularios (requerido para Pipelines).');
                        }
                      }}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Pipelines de Procesos Configurables
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-forest/10 text-forest dark:text-emerald-400 border border-forest/20">
                          Requiere Formularios
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Crea y personaliza flujos con tableros Kanban por etapas para admisiones, contratación de docentes, graduación, reinscripciones y mucho más.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.pipelines} USD/mes
                  </span>
                </label>

                {/* Newsletters SMTP */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.newsletterSmtp
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.newsletterSmtp}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, newsletterSmtp: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Servidor de Boletines & Newsletters SMTP
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Envío masivo de circulares, plantillas visuales con fotos y registro de aperturas.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.newsletterSmtp} USD/mes
                  </span>
                </label>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior: Ambientes</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToNextStep}
                  className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span>Siguiente: Almacenamiento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: STORAGE SELECTION */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                    Paso 3 de 4 • Almacenamiento Seguro
                  </span>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                    Bóveda de Expedientes & Galería de Fotos
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Espacio seguro en la nube para fotos del diario Montessori, actas y documentos médicos.
                  </p>
                </div>
                <span className="text-xs font-bold font-mono text-forest bg-forest/10 px-3 py-1.5 rounded-xl shrink-0">
                  {storageTier === '2gb_free' || storageTier === 'byos_aws' ? '$0 USD' : storageTier === '12gb' ? '+$5 USD/mes' : storageTier === '22gb' ? '+$10 USD/mes' : '+$25 USD/mes'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: '2gb_free',
                    label: '2 GB Base (Incluido Gratis)',
                    desc: 'Espacio gratuito incluido con tu membresía',
                    price: 'Incluido ($0)'
                  },
                  {
                    id: '12gb',
                    label: '12 GB Cloud (+10 GB)',
                    desc: 'Ideal para bitácoras y fotos cotidianas',
                    price: '+$5 USD/mes'
                  },
                  {
                    id: '22gb',
                    label: '22 GB Cloud (+20 GB)',
                    desc: 'Uso intensivo de fotos y videos de lecciones',
                    price: '+$10 USD/mes'
                  },
                  {
                    id: '52gb',
                    label: '52 GB Cloud (+50 GB)',
                    desc: 'Colegios grandes con múltiples salones',
                    price: '+$25 USD/mes'
                  },
                  {
                    id: 'byos_aws',
                    label: 'Propio AWS S3 (Tu API Key)',
                    desc: 'Conecta tu propio bucket S3 de almacenamiento',
                    price: 'BYOS ($0)'
                  }
                ].map((tier) => {
                  const isSelected = storageTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setStorageTier(tier.id as any)}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs'
                          : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-forest bg-forest text-white'
                            : 'border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${
                            isSelected ? 'text-forest dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {tier.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                            {tier.desc}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 ${
                        isSelected ? 'text-forest dark:text-emerald-400' : 'text-stone-600 dark:text-slate-400'
                      }`}>
                        {tier.price}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior: Módulos</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToNextStep}
                  className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span>Siguiente: Resumen & Confirmación</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: REVIEW & CONFIRMATION */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                  Paso 4 de 4 • Confirmación
                </span>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                  Revisión Final de tu Plan Personalizado
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Verifica el desglose de tu suscripción antes de continuar a la activación y pago.
                </p>
              </div>

              {/* Core Inclusions Info */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Módulos Esenciales Incluidos (100% Gratis con Membresía Base $14 USD)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Incluido
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Portal de Familias
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Portal de Guías
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Seguimiento Montessori
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Pase de Asistencia
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Trackers de Hábitos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Bóveda de Expedientes
                  </span>
                </div>
              </div>

              {/* Configured Environments List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ambientes que se activarán ({totalActiveEnvsCount}):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeEnvironmentsList.map((env, idx) => (
                    <div
                      key={env.id}
                      className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {idx + 1}. {env.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 shrink-0">
                        {env.isExisting ? 'Existente' : 'Nuevo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior: Almacenamiento</span>
                </button>
                <button
                  type="button"
                  disabled={isSaving || totalActiveEnvsCount < 1}
                  onClick={handleProceedToPayment}
                  className="px-7 py-3 bg-forest hover:bg-forest/90 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Activar y Pagar Suscripción'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY (Min-width 320px, visible on xl+ or on all screens at final step 4) */}
        <div className={`w-full xl:w-[360px] xl:min-w-[320px] xl:max-w-[400px] shrink-0 xl:sticky xl:top-6 space-y-4 ${
          currentStep === 4 ? 'block' : 'hidden xl:block'
        }`}>
          <div className="p-6 sm:p-7 rounded-3xl border-2 border-forest bg-white dark:bg-[#162218] shadow-xl space-y-6">
            <div className="flex items-center justify-between gap-2 border-b border-forest/15 pb-4">
              <div>
                <span className="text-[10px] font-bold text-forest dark:text-emerald-400 uppercase tracking-widest block">
                  Resumen de Membresía
                </span>
                <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                  {school?.name || 'Colegio Montessori'}
                </h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                totalActiveEnvsCount === 0 ? 'bg-red-500/15 text-red-600' : 'bg-forest/10 text-forest dark:text-emerald-400'
              }`}>
                {totalActiveEnvsCount} {totalActiveEnvsCount === 1 ? 'ambiente' : 'ambientes'}
              </span>
            </div>

            {/* Total Price Display */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <AnimatedPriceCounter
                  value={billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal}
                  className="text-4xl sm:text-5xl font-display font-black text-forest dark:text-emerald-400"
                />
                <span className="text-xs font-bold text-muted-foreground">
                  USD / mes
                </span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Facturado anualmente: ${pricingSummary.annualBilledTotal} USD (Ahorras 2 meses)</span>
                </p>
              )}
            </div>

            {/* Itemized Line items */}
            <div className="space-y-2.5 text-xs border-t border-stone-200 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Membresía Base (Esenciales)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$14 USD/mes</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>
                    {totalActiveEnvsCount} {totalActiveEnvsCount === 1 ? 'Ambiente' : 'Ambientes'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ${pricingSummary.environmentsCost} USD/mes
                  </span>
                </div>
                {totalActiveEnvsCount > 1 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                    (1er ambiente $25 + {totalActiveEnvsCount - 1} con 50% descuento)
                  </span>
                )}
              </div>

              {pricingSummary.optionalModulesCost > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{pricingSummary.selectedModulesCount} Módulos a la carta</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    +${pricingSummary.optionalModulesCost} USD/mes
                  </span>
                </div>
              )}

              {pricingSummary.storageCost > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Almacenamiento ({storageTier})</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    +${pricingSummary.storageCost} USD/mes
                  </span>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            {currentStep < 4 ? (
              <button
                type="button"
                disabled={totalActiveEnvsCount < 1}
                onClick={handleProceedToNextStep}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  totalActiveEnvsCount < 1
                    ? 'bg-stone-300 dark:bg-slate-800 text-stone-500 cursor-not-allowed opacity-60'
                    : 'bg-forest hover:bg-forest/90 text-white hover:shadow-xl active:scale-98 cursor-pointer'
                }`}
              >
                <span>Continuar al Paso {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving || totalActiveEnvsCount < 1}
                onClick={handleProceedToPayment}
                className="w-full py-4 px-6 bg-forest hover:bg-forest/90 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Activar y Pagar Suscripción'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Support guarantee */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 text-[11px] text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-forest" />
                <span>Garantía de Activación Inmediata</span>
              </div>
              <p className="leading-tight">
                Al activar el plan, se restablece el acceso de escritura completo en todos los salones de forma inmediata.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT STICKY BOTTOM BAR (Visible in single-column mode / mobile / tablet / < xl) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 xl:hidden bg-white/95 dark:bg-[#162218]/95 backdrop-blur-md border-t border-forest/20 shadow-2xl p-3 sm:px-6 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-display font-black text-forest dark:text-emerald-400">
                ${billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">USD/mes</span>
              {billingCycle === 'annual' && (
                <span className="text-[9px] font-bold bg-amber-400 text-slate-900 px-1 py-0.2 rounded font-mono ml-1">
                  -2 MESES
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">
              {totalActiveEnvsCount} {totalActiveEnvsCount === 1 ? 'ambiente' : 'ambientes'} • {pricingSummary.selectedModulesCount} mód. opc.
            </span>
          </div>
        </div>

        <div>
          {currentStep < 4 ? (
            <button
              type="button"
              disabled={totalActiveEnvsCount < 1}
              onClick={handleProceedToNextStep}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                totalActiveEnvsCount < 1
                  ? 'bg-stone-300 dark:bg-slate-800 text-stone-500 cursor-not-allowed opacity-60'
                  : 'bg-forest hover:bg-forest/90 text-white active:scale-95 cursor-pointer'
              }`}
            >
              <span>Paso {currentStep + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving || totalActiveEnvsCount < 1}
              onClick={handleProceedToPayment}
              className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Activar Plan'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolPricingSection;
