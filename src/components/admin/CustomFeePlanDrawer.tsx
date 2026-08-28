import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Percent, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  Zap,
  Package,
  GraduationCap
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { 
  StudentItem, 
  FeePlanTemplateItem, 
  FeeConceptItem,
  getFeePlanTemplates, 
  getFeeConcepts,
  generateStudentFeePlan, 
  StudentFeePlanItem 
} from '@/lib/sqlite';
import { toast } from 'sonner';

interface CustomFeePlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentItem | null;
  onPlanCreated?: (plan: StudentFeePlanItem) => void;
}

interface PlanItemConfig {
  conceptId?: string;
  conceptName: string;
  category: string; // 'ENROLLMENT' | 'MATERIALS' | 'TUITION' | 'MEALS' | 'OTHER'
  scheduleType: 'UPFRONT_SINGLE' | 'MONTHLY_RECURRING'; // Pago único a la entrada vs mensualidad
  baseAmount: number;
  quantity: number;
  enabled: boolean;
}

export const CustomFeePlanDrawer: React.FC<CustomFeePlanDrawerProps> = ({
  isOpen,
  onClose,
  student,
  onPlanCreated
}) => {
  const [templates, setTemplates] = useState<FeePlanTemplateItem[]>([]);
  const [concepts, setConcepts] = useState<FeeConceptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [paymentModality, setPaymentModality] = useState<'MONTHLY_CUSTOM' | 'ANNUAL_BATCH' | 'SEMIANNUAL'>('MONTHLY_CUSTOM');
  
  // Custom Installments Count for Tuition
  const [installmentsCount, setInstallmentsCount] = useState<number>(10);
  
  // Cutoff & Due Day Policies
  const [invoiceCutDay, setInvoiceCutDay] = useState<number>(4); // Día 4 se genera la factura
  const [dueDayLimit, setDueDayLimit] = useState<number>(7);     // Día 7 fecha límite
  
  // Late Fee / Impuntuality & Credit Policy
  const [lateFeePct, setLateFeePct] = useState<number>(10);     // 10% recargo por mora
  const [allowLateFeeExemption, setAllowLateFeeExemption] = useState<boolean>(false); // Exención total / Crédito flexible

  // Discount State
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Customizable Items for this student
  const [customItems, setCustomItems] = useState<PlanItemConfig[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      setDiscountPct(0);
      setDiscountReason('');
      setNotes('');
      setInstallmentsCount(10);
      setInvoiceCutDay(4);
      setDueDayLimit(7);
      setLateFeePct(10);
      setAllowLateFeeExemption(false);
      setPaymentModality('MONTHLY_CUSTOM');
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [tmplList, concList] = await Promise.all([
        getFeePlanTemplates(),
        getFeeConcepts()
      ]);
      setTemplates(tmplList);
      setConcepts(concList);

      if (tmplList.length > 0) {
        setSelectedTemplateId(tmplList[0].id);
        populateItemsFromTemplate(tmplList[0]);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const populateItemsFromTemplate = (tmpl: FeePlanTemplateItem) => {
    if (tmpl.defaultInstallmentsCount) setInstallmentsCount(tmpl.defaultInstallmentsCount);
    if (tmpl.invoiceCutDay) setInvoiceCutDay(tmpl.invoiceCutDay);
    if (tmpl.dueDayLimit) setDueDayLimit(tmpl.dueDayLimit);
    if (tmpl.lateFeePct !== undefined) setLateFeePct(tmpl.lateFeePct);

    const tmplItems = tmpl.items || [];
    const formatted: PlanItemConfig[] = tmplItems.map(it => ({
      conceptId: it.conceptId,
      conceptName: it.conceptName,
      category: it.category || 'OTHER',
      scheduleType: it.category === 'TUITION' ? 'MONTHLY_RECURRING' : 'UPFRONT_SINGLE',
      baseAmount: Number(it.baseAmount) || 0,
      quantity: Number(it.quantity) || 1,
      enabled: true
    }));

    setCustomItems(formatted);
  };

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl) populateItemsFromTemplate(tmpl);
  };

  const handleItemToggle = (index: number) => {
    setCustomItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], enabled: !copy[index].enabled };
      return copy;
    });
  };

  const handleItemAmountChange = (index: number, amount: number) => {
    setCustomItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], baseAmount: Math.max(0, amount) };
      return copy;
    });
  };

  const handleItemScheduleChange = (index: number, scheduleType: 'UPFRONT_SINGLE' | 'MONTHLY_RECURRING') => {
    setCustomItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], scheduleType };
      return copy;
    });
  };

  // Real-time calculation preview
  const calculatePreview = () => {
    const activeItems = customItems.filter(i => i.enabled);
    
    // 1. Upfront / Entry Items (Matrícula, Materiales en 1 solo pago)
    const upfrontItems = activeItems.filter(i => i.scheduleType === 'UPFRONT_SINGLE');
    let upfrontTotal = 0;
    upfrontItems.forEach(it => {
      upfrontTotal += it.baseAmount * (it.quantity || 1);
    });

    // 2. Monthly Recurring Items (Colegiaturas x N meses)
    const monthlyItems = activeItems.filter(i => i.scheduleType === 'MONTHLY_RECURRING');
    const months = installmentsCount > 0 ? installmentsCount : 10;
    
    let rawMonthlyBaseTotal = 0;
    monthlyItems.forEach(it => {
      rawMonthlyBaseTotal += it.baseAmount;
    });

    const rawTuitionCycleTotal = rawMonthlyBaseTotal * months;
    let tuitionDiscountTotal = 0;
    let netTuitionCycleTotal = 0;

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    if (paymentModality === 'ANNUAL_BATCH') {
      const batchDisc = (rawTuitionCycleTotal * (selectedTemplate?.batchDiscountPct || 10)) / 100;
      const customDisc = ((rawTuitionCycleTotal - batchDisc) * (discountPct || 0)) / 100;
      tuitionDiscountTotal = batchDisc + customDisc;
      netTuitionCycleTotal = rawTuitionCycleTotal - tuitionDiscountTotal;
    } else {
      tuitionDiscountTotal = (rawTuitionCycleTotal * (discountPct || 0)) / 100;
      netTuitionCycleTotal = rawTuitionCycleTotal - tuitionDiscountTotal;
    }

    const netMonthlyPerInstallment = months > 0 ? Number((netTuitionCycleTotal / months).toFixed(2)) : 0;
    const grandGross = upfrontTotal + rawTuitionCycleTotal;
    const grandNet = upfrontTotal + netTuitionCycleTotal;

    return {
      upfrontItems,
      upfrontTotal,
      monthlyItems,
      months,
      rawMonthlyBaseTotal,
      rawTuitionCycleTotal,
      tuitionDiscountTotal,
      netTuitionCycleTotal,
      netMonthlyPerInstallment,
      grandGross,
      grandNet
    };
  };

  const preview = calculatePreview();
  const graceDays = Math.max(0, dueDayLimit - invoiceCutDay);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    // Filter and prepare active custom items
    const payloadItems = customItems.filter(i => i.enabled).map(i => ({
      conceptId: i.conceptId,
      conceptName: i.conceptName,
      category: i.category,
      baseAmount: i.baseAmount,
      quantity: i.scheduleType === 'MONTHLY_RECURRING' ? installmentsCount : 1
    }));

    if (payloadItems.length === 0) {
      toast.error('Debes incluir al menos un concepto de cobro');
      return;
    }

    setSaving(true);
    try {
      const plan = await generateStudentFeePlan({
        studentId: student.id,
        templateId: selectedTemplateId || undefined,
        schoolYear,
        paymentModality,
        installmentsCount: Number(installmentsCount) || 10,
        invoiceCutDay: Number(invoiceCutDay) || 4,
        dueDayLimit: Number(dueDayLimit) || 7,
        lateFeePct: allowLateFeeExemption ? 0 : Number(lateFeePct),
        allowLateFeeExemption: Boolean(allowLateFeeExemption),
        discountPct: Number(discountPct) || 0,
        discountReason: discountReason.trim(),
        customItems: payloadItems,
        notes: notes.trim()
      });

      toast.success(`Plan personalizado generado para ${student.full_name}`);
      if (onPlanCreated) onPlanCreated(plan);
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al generar plan personalizado');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      icon={
        student.avatar_url ? (
          <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <span className="font-bold text-forest text-base font-display">{student.full_name.charAt(0)}</span>
        )
      }
      title={`Personalizar Plan Financiero • ${student.full_name}`}
      description="Separa pagos únicos de entrada (Matrícula/Materiales) de las mensualidades y cuotas personalizadas."
      footer={
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-full py-3 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-xl transition-all flex items-center justify-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="custom-fee-plan-form"
            disabled={saving}
            className="w-full py-3 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{saving ? 'Generando...' : 'Generar Plan'}</span>
          </button>
        </div>
      }
    >
      <form id="custom-fee-plan-form" onSubmit={handleGenerate} className="space-y-6">
        
        {/* Student Quick Header */}
        <div className="p-4 rounded-2xl bg-cream/40 border border-forest/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-forest/70 block">Estudiante</span>
            <strong className="text-forest text-sm font-bold block">{student.full_name}</strong>
            <span className="text-xs text-muted-foreground">{student.grade || 'Ambiente Montessori'}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-forest/70 block">Ciclo Escolar</span>
            <span className="font-mono text-xs font-bold text-forest bg-white px-2.5 py-1 rounded-lg border border-forest/15 inline-block mt-0.5">
              {schoolYear}
            </span>
          </div>
        </div>

        {/* 1. Base Template Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-forest uppercase tracking-wider">
            1. Plantilla Base de Partida
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full p-3 rounded-2xl border border-forest/20 text-xs bg-white font-semibold text-forest shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.environmentStage || 'General'})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Concept Breakdown & Custom Scheduling (Entry vs Monthly) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-forest uppercase tracking-wider">
              2. Desglose de Conceptos: Entrada vs Mensualidades
            </label>
            <span className="text-[10px] text-muted-foreground">
              Define si se cobra en 1 solo pago o en mensualidades
            </span>
          </div>

          <div className="space-y-2.5">
            {customItems.map((it, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                  it.enabled 
                    ? 'bg-white border-forest/15 shadow-2xs' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={it.enabled}
                      onChange={() => handleItemToggle(idx)}
                      className="w-4 h-4 rounded text-forest focus:ring-forest border-gray-300 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-forest text-xs block">{it.conceptName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{it.category}</span>
                    </div>
                  </label>

                  {it.enabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">$</span>
                      <input
                        type="number"
                        min="0"
                        value={it.baseAmount}
                        onChange={(e) => handleItemAmountChange(idx, Number(e.target.value))}
                        className="w-28 p-1.5 px-2 text-right rounded-xl border border-forest/20 font-bold font-mono text-forest bg-white focus:outline-none text-xs"
                      />
                    </div>
                  )}
                </div>

                {it.enabled && (
                  <div className="flex items-center justify-between pt-2 border-t border-forest/5 text-[11px]">
                    <span className="text-muted-foreground">Forma de Cobro:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleItemScheduleChange(idx, 'UPFRONT_SINGLE')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          it.scheduleType === 'UPFRONT_SINGLE'
                            ? 'bg-forest text-white shadow-2xs'
                            : 'bg-forest/5 text-forest hover:bg-forest/10'
                        }`}
                      >
                        1 Pago al Ingreso (Agosto)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemScheduleChange(idx, 'MONTHLY_RECURRING')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          it.scheduleType === 'MONTHLY_RECURRING'
                            ? 'bg-forest text-white shadow-2xs'
                            : 'bg-forest/5 text-forest hover:bg-forest/10'
                        }`}
                      >
                        Mensualidad ({installmentsCount} cuotas)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Custom Installments Count & Payment Modality */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-forest uppercase tracking-wider">
              3. Número de Mensualidades de Colegiatura
            </label>
            <span className="text-[11px] font-bold text-forest/80 font-mono">
              {installmentsCount} Mensualidades
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <button
              type="button"
              onClick={() => setPaymentModality('MONTHLY_CUSTOM')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                paymentModality === 'MONTHLY_CUSTOM'
                  ? 'border-forest bg-forest text-white shadow-xs'
                  : 'border-forest/15 bg-white text-forest hover:bg-forest/5'
              }`}
            >
              <span className="font-bold block">Mensualidades</span>
              <span className={`text-[10px] block mt-0.5 ${paymentModality === 'MONTHLY_CUSTOM' ? 'text-white/80' : 'text-muted-foreground'}`}>
                {installmentsCount} cuotas mensuales
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentModality('ANNUAL_BATCH')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                paymentModality === 'ANNUAL_BATCH'
                  ? 'border-forest bg-forest text-white shadow-xs'
                  : 'border-forest/15 bg-white text-forest hover:bg-forest/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold block">Pago Anual Contado</span>
                <span className="text-[9px] bg-amber-300 text-forest font-bold px-1.5 py-0.2 rounded">
                  -10%
                </span>
              </div>
              <span className={`text-[10px] block mt-0.5 ${paymentModality === 'ANNUAL_BATCH' ? 'text-white/80' : 'text-muted-foreground'}`}>
                1 solo pago anticipado
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentModality('SEMIANNUAL')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                paymentModality === 'SEMIANNUAL'
                  ? 'border-forest bg-forest text-white shadow-xs'
                  : 'border-forest/15 bg-white text-forest hover:bg-forest/5'
              }`}
            >
              <span className="font-bold block">Semestral (2 Pagos)</span>
              <span className={`text-[10px] block mt-0.5 ${paymentModality === 'SEMIANNUAL' ? 'text-white/80' : 'text-muted-foreground'}`}>
                Agosto y Enero
              </span>
            </button>
          </div>

          {/* Number of installments selector / presets */}
          <div className="p-3.5 rounded-2xl bg-cream/30 border border-forest/10 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-forest block">¿Cuántas mensualidades se cobrarán a este papá?</span>
              <span className="text-[11px] text-muted-foreground">Ajusta 8, 10, 11 o cualquier cantidad custom.</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {[8, 10, 11, 12].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setInstallmentsCount(cnt)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    installmentsCount === cnt
                      ? 'bg-forest text-white shadow-xs scale-105'
                      : 'bg-white border border-forest/20 text-forest hover:bg-forest/5'
                  }`}
                >
                  {cnt}
                </button>
              ))}
              <div className="relative w-16">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(Math.max(1, Number(e.target.value)))}
                  className="w-full p-1.5 text-center rounded-xl border border-forest/20 text-xs font-bold text-forest bg-white focus:outline-none"
                  title="Cantidad personalizada"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Invoice Cut Day & Due Day Limit (Grace Margins) */}
        <div className="p-4 rounded-3xl bg-blue-50/60 border border-blue-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-800" />
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                4. Días de Facturación & Margen de Vencimiento
              </h4>
            </div>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200">
              {graceDays} días de margen
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-blue-950 mb-1">
                Día de Corte / Emisión de Factura
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={invoiceCutDay}
                  onChange={(e) => setInvoiceCutDay(Math.min(28, Math.max(1, Number(e.target.value))))}
                  className="w-full p-2.5 rounded-xl border border-blue-300 font-bold font-mono text-blue-950 bg-white focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-muted-foreground">de c/mes</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-blue-950 mb-1">
                Día Límite para Pagar a Tiempo
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={dueDayLimit}
                  onChange={(e) => setDueDayLimit(Math.min(28, Math.max(1, Number(e.target.value))))}
                  className="w-full p-2.5 rounded-xl border border-blue-300 font-bold font-mono text-blue-950 bg-white focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-muted-foreground">de c/mes</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Late Fee / Impuntuality Policy & Credit Exemption Toggle */}
        <div className={`p-4 rounded-3xl border space-y-3.5 transition-all ${
          allowLateFeeExemption 
            ? 'bg-emerald-50/70 border-emerald-300' 
            : 'bg-red-50/50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${allowLateFeeExemption ? 'text-emerald-700' : 'text-red-700'}`} />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${allowLateFeeExemption ? 'text-emerald-950' : 'text-red-950'}`}>
                5. Recargo por Tardanza / Crédito Flexible
              </h4>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowLateFeeExemption}
                onChange={(e) => setAllowLateFeeExemption(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-emerald-900">
                Dar Crédito / Sin Recargo
              </span>
            </label>
          </div>

          {allowLateFeeExemption ? (
            <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <strong>Acuerdo de Crédito Otorgado:</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  A este tutor no se le cobrará recargo por mora aunque pague después del día {dueDayLimit}.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-red-950 mb-1">
                  % de Fee por Impuntualidad / Tardanza
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={lateFeePct}
                    onChange={(e) => setLateFeePct(Number(e.target.value))}
                    className="w-full p-2.5 pr-8 rounded-xl border border-red-300 font-bold font-mono text-red-950 bg-white focus:outline-none"
                    placeholder="10"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-red-900 font-bold">%</span>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[11px] text-muted-foreground">
                  Si paga después del día <strong>{dueDayLimit}</strong>, el sistema sumará automáticamente un <strong>{lateFeePct}%</strong> de recargo a la cuota (${((preview.netMonthlyPerInstallment * (lateFeePct / 100)) || 0).toLocaleString('es-MX')}).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 6. Custom Discounts & Scholarship */}
        <div className="p-4 rounded-3xl bg-amber-50/60 border border-amber-200/80 space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-700" />
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              6. Descuento Especial en Colegiatura
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-forest mb-1">% Descuento</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                  className="w-full p-2.5 pr-8 rounded-xl border border-amber-300 text-xs bg-white font-bold text-forest focus:outline-none"
                  placeholder="0"
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">%</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-forest mb-1">Motivo del Descuento</label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Ej. Descuento Segundo Hermano (15%), Beca Dirección..."
                className="w-full p-2.5 rounded-xl border border-amber-300 text-xs bg-white text-forest focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 7. Clear Financial Simulation & Breakdown Card */}
        <div className="p-5 rounded-3xl bg-forest text-white space-y-3.5 shadow-md">
          <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
            <div>
              <span className="text-xs text-white/80 font-bold uppercase tracking-wider block">Calendario de Pagos Simulado</span>
              <span className="text-[11px] text-amber-300 font-semibold">
                {preview.upfrontItems.length} Cobros Iniciales + {preview.months} Colegiaturas Mensuales
              </span>
            </div>
            <span className="text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              MXN
            </span>
          </div>

          {/* Upfront Block */}
          {preview.upfrontItems.length > 0 && (
            <div className="p-3 rounded-2xl bg-white/10 space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-amber-300 block">
                1. Cobro Inicial Único (Entrada / Admisión):
              </span>
              {preview.upfrontItems.map((it, idx) => (
                <div key={idx} className="flex justify-between text-white/90">
                  <span>{it.conceptName} (Pago único):</span>
                  <span className="font-mono font-bold">${it.baseAmount.toLocaleString('es-MX')}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-white border-t border-white/10 pt-1">
                <span>Subtotal Entrada:</span>
                <span className="font-mono">${preview.upfrontTotal.toLocaleString('es-MX')}</span>
              </div>
            </div>
          )}

          {/* Monthly Block */}
          <div className="p-3 rounded-2xl bg-white/10 space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">
              2. Mensualidades Programadas ({preview.months} Cuotas):
            </span>
            <div className="flex justify-between text-white/90">
              <span>Importe neto por mes:</span>
              <strong className="font-mono font-bold text-emerald-300 text-sm">
                ${preview.netMonthlyPerInstallment.toLocaleString('es-MX')} / mes
              </strong>
            </div>
            <div className="flex justify-between text-white/70 text-[11px]">
              <span>Fechas de cobro mensual:</span>
              <span>Corte día {invoiceCutDay} • Límite día {dueDayLimit}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/15">
            <span>Gran Total del Ciclo Escolar:</span>
            <span className="font-mono font-display text-lg">${preview.grandNet.toLocaleString('es-MX')}</span>
          </div>
        </div>

      </form>
    </SlideOverDrawer>
  );
};

export default CustomFeePlanDrawer;
