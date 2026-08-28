import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Sparkles, 
  FileText, 
  Layers, 
  Edit, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  HeartPulse, 
  GraduationCap, 
  Scale, 
  Users, 
  HelpCircle,
  Clock,
  Eye
} from 'lucide-react';
import { 
  AdmissionFormTemplateItem, 
  getAdmissionFormTemplates, 
  deleteAdmissionFormTemplate,
  createAdmissionFormTemplate,
  seedDefaultAdmissionFormTemplates 
} from '@/lib/sqlite';
import { AdmissionFormBuilderModal } from './AdmissionFormBuilderModal';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';

interface AdmissionFormsManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  MEDICAL: { label: 'Médico y Hábitos', icon: HeartPulse, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  PEDAGOGICAL: { label: 'Pedagógico y Familiar', icon: GraduationCap, color: 'text-forest', bg: 'bg-forest/5 border-forest/20' },
  LEGAL_CONSENT: { label: 'Consentimientos y Legal', icon: Scale, color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
  INTERVIEW: { label: 'Entrevista y Observación Guía', icon: Users, color: 'text-indigo-800', bg: 'bg-indigo-50 border-indigo-200' },
  SOCIOECONOMIC: { label: 'Socioeconómico', icon: FileText, color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
  GENERAL: { label: 'General / Administrativo', icon: Layers, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' }
};

export const AdmissionFormsManagerDrawer: React.FC<AdmissionFormsManagerDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const confirm = useConfirm();
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [templates, setTemplates] = useState<AdmissionFormTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  const [builderModalOpen, setBuilderModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AdmissionFormTemplateItem | null>(null);

  // Handle open / close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAdmissionFormTemplates();
      setTemplates(data);
    } catch (e: any) {
      toast.error('Error al cargar formularios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const handleDeleteTemplate = async (templateId: string, name: string) => {
    const isConfirmed = await confirm({
      title: '¿Eliminar Plantilla?',
      description: `¿Estás seguro de que deseas eliminar la plantilla "${name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    // Optimistic UI deletion
    const previousTemplates = [...templates];
    setTemplates(prev => prev.filter(t => t.id !== templateId));

    try {
      await deleteAdmissionFormTemplate(templateId);
      toast.success('Plantilla eliminada correctamente');
    } catch (e: any) {
      // Rollback on failure
      setTemplates(previousTemplates);
      toast.error(e.message || 'Error al eliminar plantilla');
    }
  };

  const handleCreateDefaultTemplates = async () => {
    try {
      const isConfirmed = await confirm({
        title: '¿Crear Plantillas Oficiales?',
        description: 'Se agregarán las plantillas estándar del método Montessori (Ficha Médica, Hábitos, Entrevista Inicial y Carta de Consentimiento).',
        confirmLabel: 'Crear Plantillas',
        cancelLabel: 'Cancelar',
      });

      if (!isConfirmed) return;

      await seedDefaultAdmissionFormTemplates();
      toast.success('Plantillas oficiales creadas');
      loadTemplates();
    } catch (e: any) {
      toast.error('Error al generar plantillas');
    }
  };

  const handleDuplicate = async (tpl: AdmissionFormTemplateItem) => {
    try {
      await createAdmissionFormTemplate({
        title: `${tpl.title} (Copia)`,
        description: tpl.description,
        category: tpl.category,
        schema: tpl.schema,
        isPublished: tpl.is_published
      });
      toast.success('Formulario duplicado con éxito');
      loadTemplates();
    } catch (e: any) {
      toast.error(e.message || 'Error al duplicar');
    }
  };

  if (!isMounted) return null;

  const filteredTemplates = selectedCategory === 'ALL'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-end sm:justify-end overflow-hidden transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      >
        <div 
          className={`bg-white w-full max-h-[92vh] sm:max-h-[100dvh] h-auto sm:h-full sm:max-w-2xl shadow-2xl flex flex-col rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-forest/20 transition-transform duration-300 ease-out ${
            isVisible 
              ? 'translate-y-0 sm:translate-x-0 sm:translate-y-0' 
              : 'translate-y-full sm:translate-x-full sm:translate-y-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="p-4 sm:p-6 bg-forest text-white flex items-center justify-between shrink-0 rounded-t-3xl sm:rounded-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
                <FileText className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display">Catálogo de Formularios de Admisión</h2>
                <p className="text-xs text-white/70">
                  Crea y gestiona cuestionarios dinámicos para tutores y el equipo interno.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-forest/5 border-b border-forest/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-white text-forest/70 hover:bg-forest/10 border border-forest/10'
                }`}
              >
                Todos ({templates.length})
              </button>
              {Object.keys(CATEGORY_MAP).map(catKey => {
                const count = templates.filter(t => t.category === catKey).length;
                if (count === 0 && selectedCategory !== catKey) return null;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === catKey
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-white text-forest/70 hover:bg-forest/10 border border-forest/10'
                    }`}
                  >
                    {CATEGORY_MAP[catKey]?.label || catKey} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateDefaultTemplates}
                className="px-3 py-1.5 bg-white border border-forest/20 text-forest hover:bg-forest/5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Generar formularios estándar de Ceiba"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Plantillas Montessori</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTemplate(null);
                  setBuilderModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-forest hover:bg-forest/90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:scale-102 active:scale-98 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Formulario</span>
              </button>
            </div>
          </div>

          {/* Body: Form Cards List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {loading ? (
              <div className="py-20 text-center text-xs text-muted-foreground">
                Cargando formularios de admisión...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-forest/15 rounded-lg p-6 space-y-3">
                <FileText className="w-8 h-8 text-forest/40 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-forest">No hay formularios configurados</h3>
                  <p className="text-xs text-muted-foreground">
                    Comienza creando un formulario dinámico o genera las plantillas Montessori predeterminadas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateDefaultTemplates}
                  className="px-4 py-2 bg-forest text-white rounded-lg text-xs font-bold shadow-xs hover:bg-forest/90 transition-colors cursor-pointer"
                >
                  Generar Plantillas Montessori
                </button>
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const catMeta = CATEGORY_MAP[tpl.category] || CATEGORY_MAP.GENERAL;
                const CatIcon = catMeta.icon;
                const totalFields = (tpl.schema || []).reduce((acc, sec) => acc + (sec.fields?.length || 0), 0);
                const totalSteps = tpl.schema?.length || 0;

                return (
                  <div
                    key={tpl.id}
                    className="bg-white rounded-lg border border-forest/15 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.bg} ${catMeta.color}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{catMeta.label}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {totalSteps} paso{totalSteps !== 1 ? 's' : ''} • {totalFields} campo{totalFields !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-forest font-display truncate">{tpl.title}</h4>
                        {tpl.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(tpl);
                            setBuilderModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-forest/5 hover:bg-forest/15 text-forest transition-colors cursor-pointer"
                          title="Editar estructura del formulario"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(tpl)}
                          className="p-2 rounded-lg bg-forest/5 hover:bg-forest/15 text-forest transition-colors cursor-pointer"
                          title="Duplicar formulario"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                          className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors cursor-pointer"
                          title="Eliminar formulario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step summary preview pills */}
                    <div className="pt-2 border-t border-forest/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {(tpl.schema || []).map((sec, sIdx) => (
                        <span 
                          key={sec.id || sIdx}
                          className="text-[10px] font-semibold bg-forest/5 text-forest/80 px-2 py-0.5 rounded-lg whitespace-nowrap"
                        >
                          {sec.title || `Paso ${sIdx + 1}`} ({sec.fields?.length || 0})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Builder Modal */}
      {builderModalOpen && (
        <AdmissionFormBuilderModal
          isOpen={builderModalOpen}
          onClose={() => {
            setBuilderModalOpen(false);
            setSelectedTemplate(null);
          }}
          onSaved={loadTemplates}
          templateToEdit={selectedTemplate}
        />
      )}
    </>
  );
};
