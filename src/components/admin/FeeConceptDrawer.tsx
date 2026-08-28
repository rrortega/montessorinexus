import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  DollarSign, 
  FileText, 
  Check, 
  Sparkles,
  Layers,
  Calendar,
  Key
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { 
  FeeConceptItem, 
  saveFeeConcept 
} from '@/lib/sqlite';
import { toast } from 'sonner';

interface FeeConceptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concept: Partial<FeeConceptItem> | null;
  onSaved: () => void;
}

export const FeeConceptDrawer: React.FC<FeeConceptDrawerProps> = ({
  isOpen,
  onClose,
  concept,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<FeeConceptItem['category']>('TUITION');
  const [frequency, setFrequency] = useState<FeeConceptItem['frequency']>('MONTHLY');
  const [defaultAmount, setDefaultAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (concept) {
        setName(concept.name || '');
        setCode(concept.code || '');
        setCategory(concept.category || 'TUITION');
        setFrequency(concept.frequency || 'MONTHLY');
        setDefaultAmount(concept.defaultAmount || 0);
        setDescription(concept.description || '');
      } else {
        setName('');
        setCode('');
        setCategory('TUITION');
        setFrequency('MONTHLY');
        setDefaultAmount(0);
        setDescription('');
      }
    }
  }, [isOpen, concept]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del concepto es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await saveFeeConcept({
        id: concept?.id,
        name: name.trim(),
        code: code.trim(),
        category,
        frequency,
        defaultAmount: Number(defaultAmount) || 0,
        description: description.trim(),
        isActive: true
      });

      toast.success(concept?.id ? 'Concepto de cobro actualizado' : 'Concepto de cobro creado con éxito');
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al guardar concepto');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      icon={<Tag className="w-5 h-5 text-forest" />}
      title={concept?.id ? 'Editar Concepto de Cobro' : 'Nuevo Concepto de Cobro'}
      description="Define rubros del catálogo escolar para reutilizarlos en las plantillas y planes de pago."
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        
        {/* Concept Name */}
        <div className="space-y-1.5">
          <label className="block text-forest font-bold">Nombre del Concepto</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Colegiatura Mensual, Cuota de Materiales, Taller de Arte..."
            className="w-full p-3 rounded-2xl border border-forest/20 text-forest font-bold bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
            required
          />
        </div>

        {/* Code & Base Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Código / Clave Corta</label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="COL-01"
                className="w-full p-2.5 rounded-xl border border-forest/20 font-mono font-bold text-forest bg-white uppercase text-xs focus:outline-none"
              />
              <Key className="w-3.5 h-3.5 text-forest/30 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Monto Base Sugerido (MXN)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(Number(e.target.value))}
                className="w-full p-2.5 pr-8 rounded-xl border border-forest/20 font-mono font-bold text-forest bg-white text-xs focus:outline-none"
                required
              />
              <DollarSign className="w-3.5 h-3.5 text-forest/40 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category & Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Categoría Institucional</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-forest/20 bg-white font-semibold text-forest text-xs focus:outline-none shadow-2xs"
            >
              <option value="TUITION">Colegiatura Mensual</option>
              <option value="ENROLLMENT">Matrícula / Admisión</option>
              <option value="MATERIALS">Materiales & Libros</option>
              <option value="WORKSHOP">Taller Extracurricular</option>
              <option value="MEALS">Comedor Escolar</option>
              <option value="TRANSPORT">Transporte Escolar</option>
              <option value="OTHER">Otro Servicio / Cuota</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Periodicidad de Cobro</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-forest/20 bg-white font-semibold text-forest text-xs focus:outline-none shadow-2xs"
            >
              <option value="MONTHLY">Mensual (x Meses de clase)</option>
              <option value="ONE_TIME">Única Vez (Al ingreso)</option>
              <option value="ANNUAL">Anual (Por ciclo)</option>
              <option value="PER_EVENT">Por Evento / Ocasional</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-forest font-bold">Descripción / Políticas del Concepto</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles sobre lo que cubre este concepto, fechas recomendadas de pago, etc..."
            className="w-full p-3 rounded-2xl border border-forest/20 text-forest text-xs bg-white focus:outline-none resize-none shadow-2xs"
          />
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
            <span>{saving ? 'Guardando...' : 'Guardar Concepto'}</span>
          </button>
        </div>

      </form>
    </SlideOverDrawer>
  );
};

export default FeeConceptDrawer;
