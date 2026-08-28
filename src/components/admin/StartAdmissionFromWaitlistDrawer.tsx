import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Baby, 
  Users, 
  Calendar, 
  Sparkles, 
  Check, 
  Layers, 
  ArrowRight, 
  Clock, 
  School 
} from 'lucide-react';
import { 
  WaitlistEntry, 
  EnvironmentItem, 
  AdmissionStageItem, 
  startAdmissionFromWaitlist, 
  getAdmissionStages 
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface StartAdmissionFromWaitlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: WaitlistEntry | null;
  environments: EnvironmentItem[];
  onConverted: () => void;
}

export const StartAdmissionFromWaitlistDrawer: React.FC<StartAdmissionFromWaitlistDrawerProps> = ({
  isOpen,
  onClose,
  entry,
  environments,
  onConverted
}) => {
  const navigate = useNavigate();
  const [stages, setStages] = useState<AdmissionStageItem[]>([]);
  const [targetEnvironmentId, setTargetEnvironmentId] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && entry) {
      getAdmissionStages().then(stgs => setStages(stgs)).catch(() => {});
      const initialEnv = (entry.target_environment_ids && entry.target_environment_ids[0]) || environments[0]?.id || '';
      setTargetEnvironmentId(initialEnv);
      setInternalNotes(entry.notes || '');
    }
  }, [isOpen, entry, environments]);

  if (!entry) return null;

  const initialStage = stages.find(s => s.is_initial || s.slug === 'process_started') || stages[0];

  const handleStartAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await startAdmissionFromWaitlist(entry.id, {
        targetEnvironmentId: targetEnvironmentId || undefined,
        internalNotes: internalNotes.trim() || undefined
      });

      toast.success(`¡${entry.child_name} ha ingresado a la fase "Proceso Iniciado"!`, {
        action: {
          label: 'Ver en Kanban',
          onClick: () => {
            navigate('/panel/admissions');
          }
        }
      });

      onConverted();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar proceso de admisión');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAge = (dob?: string | null): string => {
    if (!dob) return '';
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return '';
    const now = new Date();
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) months--;
    if (months < 0) return 'Por nacer';
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    if (years === 0) return `${months} meses`;
    return `${years} año${years > 1 ? 's' : ''} ${remMonths > 0 ? `${remMonths} m` : ''}`.trim();
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Iniciar Proceso de Admisión"
      description="Transfiere al aspirante de la lista de espera al embudo y pipeline de admisiones."
      icon={<Workflow className="w-5 h-5 text-forest" />}
      maxWidthClass="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="start-admission-form"
            disabled={submitting}
            className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-102 active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? 'Transfiriendo...' : 'Pasar a Proceso de Admisión'}</span>
          </button>
        </div>
      }
    >
      <form id="start-admission-form" onSubmit={handleStartAdmission} className="space-y-6 pb-6 text-xs text-foreground">

        {/* Info Banner */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/60 text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Workflow className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Fase de Destino: {initialStage?.name || 'Proceso Iniciado'}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-800">
            El aspirante saldrá de la <strong>Lista de Espera activa</strong> y se creará su expediente de admisión en el <strong>Tablero Kanban</strong>, donde se gestionará la recepción de documentos, entrevistas y formalización final.
          </p>
        </div>

        {/* Child & Family Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-forest/10 shadow-2xs space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-forest/10">
            <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold text-base shrink-0">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-forest text-sm">{entry.child_name}</h4>
              <div className="text-[11px] text-muted-foreground">
                {calculateAge(entry.birth_date)} {entry.previous_school ? `• Escuela previa: ${entry.previous_school}` : ''}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Tutor de Contacto</span>
              <strong className="text-forest">{entry.parent_name}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Teléfono / WhatsApp</span>
              <span className="text-forest font-mono">{entry.parent_phone || 'Sin registrar'}</span>
            </div>
            {entry.parent_email && (
              <div className="col-span-2">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Correo Electrónico</span>
                <span className="text-forest">{entry.parent_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Target Environment */}
        <div className="bg-forest/5 p-4 rounded-2xl border border-forest/10 space-y-2">
          <label className="block text-forest font-bold">
            Ambiente / Salón Asignado para la Admisión *
          </label>
          <select
            value={targetEnvironmentId}
            onChange={(e) => setTargetEnvironmentId(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-semibold"
          >
            <option value="">-- Por determinar durante el proceso --</option>
            {environments.map(env => (
              <option key={env.id} value={env.id}>
                {env.name} ({env.stage || 'Montessori'})
              </option>
            ))}
          </select>
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-forest font-semibold mb-1">
            Notas u Observaciones para el Expediente de Admisión
          </label>
          <textarea
            rows={3}
            placeholder="Comentarios sobre el contacto inicial, necesidades de la familia o fechas estimadas..."
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none resize-none"
          />
        </div>

      </form>
    </SlideOverDrawer>
  );
};
