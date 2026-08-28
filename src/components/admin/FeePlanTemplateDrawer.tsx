import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  Tag,
  Check,
  AlertCircle,
  Clock,
  Zap,
  Sparkles
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import {
  FeePlanTemplateItem,
  FeeConceptItem,
  saveFeePlanTemplate
} from '@/lib/sqlite';
import { toast } from 'sonner';

interface FeePlanTemplateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  template: Partial<FeePlanTemplateItem> | null;
  concepts: FeeConceptItem[];
  onSaved: () => void;
}

export const FeePlanTemplateDrawer: React.FC<FeePlanTemplateDrawerProps> = ({
  isOpen,
  onClose,
  template,
  concepts,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [environmentStage, setEnvironmentStage] = useState('CASA');
  const [defaultInstallmentsCount, setDefaultInstallmentsCount] = useState<number>(10);
  const [invoiceCutDay, setInvoiceCutDay] = useState<number>(4);
  const [dueDayLimit, setDueDayLimit] = useState<number>(7);
  const [lateFeePct, setLateFeePct] = useState<number>(10);
  const [batchDiscountPct, setBatchDiscountPct] = useState<number>(10);
  const [promptPaymentDiscountPct, setPromptPaymentDiscountPct] = useState<number>(5);
  const [promptPaymentDayLimit, setPromptPaymentDayLimit] = useState<number>(5);

  // Items in template
  const [items, setItems] = useState<Array<{
    conceptId?: string;
    conceptName: string;
    category?: string;
    baseAmount: number;
    quantity: number;
  }>>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.name || '');
        setDescription(template.description || '');
        setSchoolYear(template.schoolYear || '2025-2026');
        setEnvironmentStage(template.environmentStage || 'CASA');
        setDefaultInstallmentsCount(template.defaultInstallmentsCount || 10);
        setInvoiceCutDay(template.invoiceCutDay || 4);
        setDueDayLimit(template.dueDayLimit || 7);
        setLateFeePct(template.lateFeePct !== undefined ? template.lateFeePct : 10);
        setBatchDiscountPct(template.batchDiscountPct !== undefined ? template.batchDiscountPct : 10);
        setPromptPaymentDiscountPct(template.promptPaymentDiscountPct !== undefined ? template.promptPaymentDiscountPct : 5);
        setPromptPaymentDayLimit(template.promptPaymentDayLimit || 5);
        setItems(template.items ? [...template.items] : []);
      } else {
        // Defaults for new template
        setName('');
        setDescription('');
        setSchoolYear('2025-2026');
        setEnvironmentStage('CASA');
        setDefaultInstallmentsCount(10);
        setInvoiceCutDay(4);
        setDueDayLimit(7);
        setLateFeePct(10);
        setBatchDiscountPct(10);
        setPromptPaymentDiscountPct(5);
        setPromptPaymentDayLimit(5);

        // Auto-fill common default items from concepts
        const defaultItems = [];
        const mat = concepts.find(c => c.category === 'ENROLLMENT');
        const mate = concepts.find(c => c.category === 'MATERIALS');
        const col = concepts.find(c => c.category === 'TUITION');

        if (mat) defaultItems.push({ conceptId: mat.id, conceptName: mat.name, category: 'ENROLLMENT', baseAmount: mat.defaultAmount, quantity: 1 });
        if (mate) defaultItems.push({ conceptId: mate.id, conceptName: mate.name, category: 'MATERIALS', baseAmount: mate.defaultAmount, quantity: 1 });
        if (col) defaultItems.push({ conceptId: col.id, conceptName: col.name, category: 'TUITION', baseAmount: col.defaultAmount, quantity: 10 });

        setItems(defaultItems);
      }
    }
  }, [isOpen, template, concepts]);

  const handleAddItemFromConcept = (conceptId: string) => {
    const c = concepts.find(con => con.id === conceptId);
    if (!c) return;

    setItems(prev => [
      ...prev,
      {
        conceptId: c.id,
        conceptName: c.name,
        category: c.category,
        baseAmount: c.defaultAmount,
        quantity: c.category === 'TUITION' ? defaultInstallmentsCount : 1
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre de la plantilla es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await saveFeePlanTemplate({
        id: template?.id,
        name: name.trim(),
        description: description.trim(),
        schoolYear,
        environmentStage,
        isActive: true,
        items,
        defaultInstallmentsCount: Number(defaultInstallmentsCount) || 10,
        invoiceCutDay: Number(invoiceCutDay) || 4,
        dueDayLimit: Number(dueDayLimit) || 7,
        lateFeePct: Number(lateFeePct) || 0,
        batchDiscountPct: Number(batchDiscountPct) || 0,
        promptPaymentDiscountPct: Number(promptPaymentDiscountPct) || 0,
        promptPaymentDayLimit: Number(promptPaymentDayLimit) || 5
      });

      toast.success(template?.id ? 'Plantilla actualizada' : 'Plantilla creada con éxito');
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      icon={<Layers className="w-5 h-5 text-forest" />}
      title={template?.id ? 'Editar Plantilla de Plan' : 'Nueva Plantilla de Cobro'}
      description="Configura los conceptos predeterminados, meses, días de corte y políticas de mora para este ambiente."
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-forest font-bold mb-1">Nombre de la Plantilla</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Plan Estándar Casa de Niños 2025-2026"
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest font-bold bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-forest font-bold mb-1">Ambiente / Nivel</label>
            <select
              value={environmentStage}
              onChange={(e) => setEnvironmentStage(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-forest/20 bg-white font-semibold text-forest focus:outline-none"
            >
              <option value="NIDO">Nido / Comunidad Infantil</option>
              <option value="TODDLER">Toddler</option>
              <option value="CASA">Casa de Niños</option>
              <option value="TALLER_1">Taller I (Primaria Menor)</option>
              <option value="TALLER_2">Taller II (Primaria Mayor)</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-forest font-bold mb-1">Ciclo Escolar</label>
            <input
              type="text"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest font-mono bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-forest font-bold mb-1">Descripción Breve</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle o notas de esta plantilla..."
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Installments / Vacation Period Selection */}
        <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-800" />
              <span>Meses de Colegiatura del Ciclo ({defaultInstallmentsCount} Mensualidades)</span>
            </h4>
            <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-200">
              {defaultInstallmentsCount === 10 && '2 Meses Vacaciones (Estándar)'}
              {defaultInstallmentsCount === 11 && '1 Mes Vacaciones'}
              {defaultInstallmentsCount === 12 && 'Ciclo Continuo (Todo el año)'}
              {defaultInstallmentsCount !== 10 && defaultInstallmentsCount !== 11 && defaultInstallmentsCount !== 12 && `${defaultInstallmentsCount} Meses Custom`}
            </span>
          </div>

          <p className="text-[11px] text-amber-900 leading-snug">
            Define cuántas mensualidades se cobrarán a las familias en este nivel o colegio.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setDefaultInstallmentsCount(10);
                setItems(prev => prev.map(i => i.category === 'TUITION' ? { ...i, quantity: 10 } : i));
              }}
              className={`p-2.5 rounded-2xl border text-left transition-all ${defaultInstallmentsCount === 10
                  ? 'bg-amber-950 text-white border-amber-950 shadow-xs'
                  : 'bg-white text-forest border-amber-200 hover:bg-amber-50'
                }`}
            >
              <strong className="block text-xs">10 Mensualidades</strong>
              <span className={`text-[10px] block ${defaultInstallmentsCount === 10 ? 'text-amber-200' : 'text-muted-foreground'}`}>
                2 meses vacaciones
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDefaultInstallmentsCount(11);
                setItems(prev => prev.map(i => i.category === 'TUITION' ? { ...i, quantity: 11 } : i));
              }}
              className={`p-2.5 rounded-2xl border text-left transition-all ${defaultInstallmentsCount === 11
                  ? 'bg-amber-950 text-white border-amber-950 shadow-xs'
                  : 'bg-white text-forest border-amber-200 hover:bg-amber-50'
                }`}
            >
              <strong className="block text-xs">11 Mensualidades</strong>
              <span className={`text-[10px] block ${defaultInstallmentsCount === 11 ? 'text-amber-200' : 'text-muted-foreground'}`}>
                1 mes vacaciones
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDefaultInstallmentsCount(12);
                setItems(prev => prev.map(i => i.category === 'TUITION' ? { ...i, quantity: 12 } : i));
              }}
              className={`p-2.5 rounded-2xl border text-left transition-all ${defaultInstallmentsCount === 12
                  ? 'bg-amber-950 text-white border-amber-950 shadow-xs'
                  : 'bg-white text-forest border-amber-200 hover:bg-amber-50'
                }`}
            >
              <strong className="block text-xs">12 Mensualidades</strong>
              <span className={`text-[10px] block ${defaultInstallmentsCount === 12 ? 'text-amber-200' : 'text-muted-foreground'}`}>
                Ciclo completo
              </span>
            </button>

            <div className="p-2 rounded-2xl bg-white border border-amber-200 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-amber-900 mb-0.5">Otra Cantidad:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={defaultInstallmentsCount}
                  onChange={(e) => {
                    const cnt = Math.max(1, Number(e.target.value));
                    setDefaultInstallmentsCount(cnt);
                    setItems(prev => prev.map(i => i.category === 'TUITION' ? { ...i, quantity: cnt } : i));
                  }}
                  className="w-full p-1 text-center rounded-lg border border-amber-300 font-bold font-mono text-xs text-forest bg-white focus:outline-none"
                />
                <span className="text-[10px] text-muted-foreground font-semibold">meses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cutoff days & Late Fee Policies */}
        <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-3">
          <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-800" />
            <span>Días de Facturación, Vencimiento & Recargos</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-blue-950 mb-1">Día de Corte</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={invoiceCutDay}
                  onChange={(e) => setInvoiceCutDay(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-blue-300 font-mono font-bold text-blue-950 bg-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground">de c/mes</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-blue-950 mb-1">Día Límite Pago</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={dueDayLimit}
                  onChange={(e) => setDueDayLimit(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-blue-300 font-mono font-bold text-blue-950 bg-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground">de c/mes</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-blue-950 mb-1">% Mora / Tardanza</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={lateFeePct}
                  onChange={(e) => setLateFeePct(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-blue-300 font-mono font-bold text-blue-950 bg-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-blue-950 mb-1">% Desc. Contado</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batchDiscountPct}
                  onChange={(e) => setBatchDiscountPct(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-blue-300 font-mono font-bold text-blue-950 bg-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Included Items List */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-forest uppercase tracking-wider block text-xs">
              Conceptos Incluidos en la Plantilla ({items.length})
            </span>

            {/* Add item dropdown */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddItemFromConcept(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="p-1.5 px-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest font-bold text-xs"
              >
                <option value="">Agregar Concepto...</option>
                {concepts.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (${c.defaultAmount.toLocaleString('es-MX')})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-cream/40 border border-forest/10 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={it.conceptName}
                    onChange={(e) => handleItemChange(idx, 'conceptName', e.target.value)}
                    className="w-full font-bold text-forest bg-transparent border-b border-transparent focus:border-forest/30 focus:outline-none"
                  />
                  <span className="text-[10px] text-muted-foreground font-mono">{it.category}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Cuotas:</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-12 p-1 text-center rounded-lg border border-forest/20 font-bold text-forest bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="0"
                      value={it.baseAmount}
                      onChange={(e) => handleItemChange(idx, 'baseAmount', Number(e.target.value))}
                      className="w-24 p-1 text-right rounded-lg border border-forest/20 font-bold font-mono text-forest bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar concepto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-forest/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-forest/20 font-bold text-forest hover:bg-forest/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Plantilla'}</span>
          </button>
        </div>

      </form>
    </SlideOverDrawer>
  );
};

export default FeePlanTemplateDrawer;
