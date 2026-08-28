import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Layers,
  Check,
  Type,
  Phone,
  Mail,
  AlignLeft,
  Hash,
  UploadCloud,
  PenTool,
  CheckSquare,
  ListOrdered,
  Calendar,
  ToggleLeft,
  Eye,
  Save,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Copy,
  FolderPlus,
  HelpCircle,
  GripVertical,
  Radio,
  FileText,
  FileEdit,
  FileCheck2,
  CornerDownLeft,
  Sliders,
  User,
  Camera,
  ShieldCheck,
  ScanFace,
  BarChart3
} from 'lucide-react';
import {
  AdmissionFormTemplateItem,
  FormSectionItem,
  FormFieldItem,
  FormFieldType,
  FormLayoutStyle,
  createAdmissionFormTemplate,
  updateAdmissionFormTemplate
} from '@/lib/sqlite';
import { toast } from 'sonner';

interface AdmissionFormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  templateToEdit?: AdmissionFormTemplateItem | null;
}

export const FIELD_TYPES: Array<{
  type: FormFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category: 'TEXT' | 'CHOICE' | 'ADVANCED';
}> = [
    { type: 'fullname', label: 'Nombre y Apellidos', icon: User, description: 'Nombre(s), Apellido Paterno y Materno estructurado', category: 'TEXT' },
    { type: 'text', label: 'Respuesta Corta', icon: Type, description: 'CURP, texto de una sola línea', category: 'TEXT' },
    { type: 'textarea', label: 'Párrafo / Texto Largo', icon: AlignLeft, description: 'Observaciones, antecedentes, cartas', category: 'TEXT' },
    { type: 'richtext', label: 'Texto Enriquecido (WYSIWYG)', icon: FileEdit, description: 'Editor con formato para que el solicitante redacte con negritas, listas y enlaces', category: 'ADVANCED' },
    { type: 'composite', label: 'Campo Compuesto / Grupo', icon: Layers, description: 'Grupo de subcampos (Contacto, Dirección, etc.)', category: 'ADVANCED' },
    { type: 'single_choice', label: 'Opción Múltiple (Radio)', icon: Radio, description: 'Selección única entre varias opciones', category: 'CHOICE' },
    { type: 'multiple_choice', label: 'Casillas de Verificación', icon: CheckSquare, description: 'Selección de una o varias alternativas', category: 'CHOICE' },
    { type: 'phone', label: 'Teléfono', icon: Phone, description: 'Número telefónico de contacto', category: 'TEXT' },
    { type: 'email', label: 'Correo Electrónico', icon: Mail, description: 'Validación de dirección de email', category: 'TEXT' },
    { type: 'date', label: 'Fecha', icon: Calendar, description: 'Fechas de nacimiento, citas, registros', category: 'ADVANCED' },
    { type: 'document_capture', label: 'Documento de Identidad / KYC', icon: ShieldCheck, description: 'Captura guiada 2 caras (INE, DNI, Licencia) o 1 cara (Pasaporte)', category: 'ADVANCED' },
    { type: 'selfie_liveness', label: 'Selfie / Prueba de Vida (Biometría)', icon: ScanFace, description: 'Captura facial biométrica interactiva (2 pasos: frontal y proximidad)', category: 'ADVANCED' },
    { type: 'file_upload', label: 'Subida de Archivo', icon: UploadCloud, description: 'Actas, cartillas, PDFs y fotos', category: 'ADVANCED' },
    { type: 'signature', label: 'Firma Digital (Canvas)', icon: PenTool, description: 'Firma electrónica con mouse o touch', category: 'ADVANCED' },
    { type: 'terms_consent', label: 'Términos y Consentimiento', icon: FileCheck2, description: 'Texto legal, términos o acuerdo con editor WYSIWYG y casilla de aceptación', category: 'ADVANCED' },
    { type: 'boolean', label: 'Aceptación (Sí / No)', icon: ToggleLeft, description: 'Consentimiento o declaración jurada', category: 'CHOICE' },
    { type: 'poll', label: 'Encuesta / Votación', icon: BarChart3, description: 'Elementos con título y descripción (selección simple/múltiple)', category: 'CHOICE' },
    { type: 'integer', label: 'Número Entero', icon: Hash, description: 'Cantidades, edades, número de hermanos', category: 'TEXT' },
    { type: 'decimal', label: 'Escala / Calificación', icon: Hash, description: 'Puntajes, valores numéricos o métricas', category: 'ADVANCED' }
  ];

export const AdmissionFormBuilderModal: React.FC<AdmissionFormBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  templateToEdit
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [title, setTitle] = useState(templateToEdit?.title || 'Nuevo Formulario');
  const [description, setDescription] = useState(templateToEdit?.description || '');
  const [category, setCategory] = useState<any>(templateToEdit?.category || 'GENERAL');
  const [isPublished, setIsPublished] = useState(templateToEdit?.is_published ?? true);
  const [layoutStyle, setLayoutStyle] = useState<FormLayoutStyle>(
    templateToEdit?.layout_style || templateToEdit?.schema?.[0]?.layoutStyle || 'google_forms'
  );

  const [sections, setSections] = useState<FormSectionItem[]>(
    templateToEdit?.schema && templateToEdit.schema.length > 0
      ? templateToEdit.schema
      : [
        {
          id: `sec_${Date.now()}_1`,
          title: 'Sección 1: Información General',
          description: 'Por favor complete los siguientes campos requeridos.',
          fields: [
            {
              id: `fld_${Date.now()}_1`,
              type: 'text',
              label: 'Nombre completo del solicitante',
              placeholder: 'Ej. María Pérez González',
              required: true
            },
            {
              id: `fld_${Date.now()}_2`,
              type: 'single_choice',
              label: '¿Tiene hermanos matriculados actualmente en el colegio?',
              required: true,
              options: ['Sí', 'No']
            }
          ]
        }
      ]
  );

  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || '');
  const [activeFieldId, setActiveFieldId] = useState<string>(sections[0]?.fields[0]?.id || '');
  const [saving, setSaving] = useState(false);

  // Preview State
  const [previewLayoutStyle, setPreviewLayoutStyle] = useState<FormLayoutStyle>(layoutStyle);
  const [previewStep, setPreviewStep] = useState(0);
  const [typeformIndex, setTypeformIndex] = useState(0);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewFiles, setPreviewFiles] = useState<Record<string, string>>({});

  // Sync preview layout with builder layout when tab changes
  useEffect(() => {
    if (activeTab === 'preview') {
      setPreviewLayoutStyle(layoutStyle);
      setPreviewStep(0);
      setTypeformIndex(0);
    }
  }, [activeTab, layoutStyle]);

  if (!isOpen) return null;

  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0];

  const handleAddSection = () => {
    const newSecId = `sec_${Date.now()}_${sections.length + 1}`;
    const newSec: FormSectionItem = {
      id: newSecId,
      title: `Sección ${sections.length + 1}: Nueva Sección`,
      description: 'Descripción e instrucciones específicas de esta sección.',
      fields: [
        {
          id: `fld_${Date.now()}_1`,
          type: 'text',
          label: 'Pregunta sin título',
          required: false
        }
      ]
    };
    setSections([...sections, newSec]);
    setActiveSectionId(newSecId);
    setActiveFieldId(newSec.fields[0].id);
    toast.success('Nueva sección añadida');
  };

  const handleRemoveSection = (sectionId: string) => {
    if (sections.length <= 1) {
      toast.error('El formulario debe tener al menos una sección');
      return;
    }
    const filtered = sections.filter(s => s.id !== sectionId);
    setSections(filtered);
    if (activeSectionId === sectionId) {
      setActiveSectionId(filtered[0]?.id || '');
      setActiveFieldId(filtered[0]?.fields[0]?.id || '');
    }
    toast.info('Sección eliminada');
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<FormSectionItem>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const handleAddField = (type: FormFieldType = 'text') => {
    if (!currentSection) return;
    const newFieldId = `fld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const typeMeta = FIELD_TYPES.find(f => f.type === type);

    let defaultOptions: string[] | undefined;
    if (type === 'single_choice' || type === 'multiple_choice') {
      defaultOptions = ['Opción 1', 'Opción 2'];
    }

    const newField: FormFieldItem = {
      id: newFieldId,
      type,
      label: type === 'signature' ? 'Firma Digital de Conformidad' : 'Pregunta sin título',
      placeholder: '',
      required: false,
      options: defaultOptions,
      fileConfig: type === 'file_upload' ? { accept: '.pdf,.jpg,.jpeg,.png', multiple: false, maxSizeMb: 10 } : undefined,
      pollConfig: type === 'poll' ? {
        allowMultiple: false,
        options: [
          { id: `opt_${Date.now()}_1`, title: 'Opción A', description: 'Descripción de la opción A' },
          { id: `opt_${Date.now()}_2`, title: 'Opción B', description: 'Descripción de la opción B' }
        ]
      } : undefined
    };

    handleUpdateSection(currentSection.id, {
      fields: [...currentSection.fields, newField]
    });
    setActiveFieldId(newFieldId);
  };

  const handleDuplicateField = (field: FormFieldItem, index: number) => {
    if (!currentSection) return;
    const duplicated: FormFieldItem = {
      ...field,
      id: `fld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      label: `${field.label} (Copia)`
    };
    const nextFields = [...currentSection.fields];
    nextFields.splice(index + 1, 0, duplicated);
    handleUpdateSection(currentSection.id, { fields: nextFields });
    setActiveFieldId(duplicated.id);
    toast.success('Campo duplicado');
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormFieldItem>) => {
    if (!currentSection) return;
    const updatedFields = currentSection.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
    handleUpdateSection(currentSection.id, { fields: updatedFields });
  };

  const handleRemoveField = (fieldId: string) => {
    if (!currentSection) return;
    if (currentSection.fields.length <= 1) {
      toast.error('La sección debe tener al menos una pregunta');
      return;
    }
    const nextFields = currentSection.fields.filter(f => f.id !== fieldId);
    handleUpdateSection(currentSection.id, { fields: nextFields });
    if (activeFieldId === fieldId) {
      setActiveFieldId(nextFields[0]?.id || '');
    }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!currentSection) return;
    const fields = [...currentSection.fields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;
    handleUpdateSection(currentSection.id, { fields });
  };

  // Choice Options Helpers
  const handleAddOption = (fieldId: string) => {
    const field = currentSection?.fields.find(f => f.id === fieldId);
    if (!field) return;
    const currentOptions = field.options || [];
    const newOptions = [...currentOptions, `Opción ${currentOptions.length + 1}`];
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleUpdateOption = (fieldId: string, optIndex: number, newValue: string) => {
    const field = currentSection?.fields.find(f => f.id === fieldId);
    if (!field || !field.options) return;
    const newOptions = [...field.options];
    newOptions[optIndex] = newValue;
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleRemoveOption = (fieldId: string, optIndex: number) => {
    const field = currentSection?.fields.find(f => f.id === fieldId);
    if (!field || !field.options || field.options.length <= 1) {
      toast.error('Debes mantener al menos una opción');
      return;
    }
    const newOptions = field.options.filter((_, idx) => idx !== optIndex);
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleSaveForm = async () => {
    if (!title.trim()) {
      toast.error('Ingresa un título para el formulario');
      return;
    }
    if (sections.length === 0 || sections.every(s => s.fields.length === 0)) {
      toast.error('Agrega al menos una pregunta en el formulario');
      return;
    }

    try {
      setSaving(true);
      const sectionsWithLayout = sections.map((sec, idx) => ({
        ...sec,
        layoutStyle: idx === 0 ? layoutStyle : sec.layoutStyle
      }));

      if (templateToEdit?.id) {
        await updateAdmissionFormTemplate(templateToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          schema: sectionsWithLayout,
          isPublished
        });
        toast.success('Formulario actualizado con éxito');
      } else {
        await createAdmissionFormTemplate({
          title: title.trim(),
          description: description.trim(),
          category,
          schema: sectionsWithLayout,
          isPublished
        });
        toast.success('Formulario creado con éxito');
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar formulario');
    } finally {
      setSaving(false);
    }
  };

  // Flattened questions for Typeform mode
  const allFlatQuestions = useMemo(() => {
    return sections.flatMap((sec, sIdx) =>
      sec.fields.map((fld, fIdx) => ({
        ...fld,
        sectionId: sec.id,
        sectionTitle: sec.title,
        sectionIndex: sIdx,
        globalIndex: fIdx
      }))
    );
  }, [sections]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#f0f4f0] w-full max-w-5xl rounded-3xl border border-forest/20 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">

        {/* Top App Header (Google Forms Style) */}
        <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-forest/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-forest text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del Formulario..."
                className="font-bold font-display text-sm sm:text-base text-forest bg-transparent hover:bg-forest/5 focus:bg-white focus:ring-2 focus:ring-forest/20 px-2 py-0.5 rounded-lg border-transparent focus:border-forest/20 truncate w-full outline-none transition-all"
              />
              <span className="text-[11px] text-muted-foreground px-2 block truncate">
                Constructor de Formularios & Encuestas • Ceiba Roots
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher: Preguntas / Vista Previa */}
            <div className="bg-forest/5 p-1 rounded-2xl flex items-center gap-1 border border-forest/10">
              <button
                type="button"
                onClick={() => setActiveTab('builder')}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'builder'
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-forest hover:bg-forest/10'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editor</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('preview');
                  setPreviewStep(0);
                  setTypeformIndex(0);
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'preview'
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-forest hover:bg-forest/10'
                  }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Vista Previa</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveForm}
              disabled={saving}
              className="px-4 py-2 bg-forest hover:bg-forest/90 text-white rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-forest/10 text-forest/70 hover:text-forest transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Canvas Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 custom-scrollbar">

          {activeTab === 'builder' ? (
            <div className="max-w-3xl mx-auto space-y-4 pb-12">

              {/* 1. Header Card (Google Forms Top Header Style) */}
              <div className="bg-white rounded-3xl border border-forest/15 shadow-sm overflow-hidden border-t-8 border-t-forest space-y-4 p-5 sm:p-7">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título del Formulario"
                    className="w-full text-xl sm:text-2xl font-bold font-display text-forest bg-transparent border-b border-transparent hover:border-forest/20 focus:border-forest pb-1 outline-none transition-all placeholder:text-muted-foreground"
                  />
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del formulario o instrucciones generales..."
                    className="w-full text-xs text-forest/80 bg-transparent border-b border-transparent hover:border-forest/20 focus:border-forest py-1 outline-none resize-none transition-all placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-forest/10 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-forest block">Categoría de Formulario</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-forest/5 border border-forest/15 rounded-xl px-3 py-1.5 text-xs text-forest font-semibold focus:outline-none focus:ring-2 focus:ring-forest/20"
                    >
                      <option value="GENERAL">General / Encuesta</option>
                      <option value="MEDICAL">Médico y Hábitos</option>
                      <option value="PEDAGOGICAL">Pedagógico y Familiar</option>
                      <option value="LEGAL_CONSENT">Consentimientos y Legal</option>
                      <option value="INTERVIEW">Entrevista y Observación Guía</option>
                      <option value="SOCIOECONOMIC">Socioeconómico</option>
                      <option value="RRHH">Recursos Humanos</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-forest block">Estado de Publicación</label>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-forest/5 border border-forest/10">
                      <span className="text-xs font-semibold text-forest">
                        {isPublished ? 'Publicado (Acepta respuestas)' : 'Borrador (Oculto)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPublished(!isPublished)}
                        className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${isPublished ? 'bg-forest justify-end' : 'bg-slate-300 justify-start'
                          }`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3 Layout Presentation Options Selector */}
                <div className="pt-3 border-t border-forest/10 space-y-2">
                  <label className="text-[11px] font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-forest" />
                    <span>Estilo de Presentación al Llenar el Formulario (3 Opciones)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Option 1: Clásico Continuo */}
                    <button
                      type="button"
                      onClick={() => setLayoutStyle('classic')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${layoutStyle === 'classic' || layoutStyle === 'google_forms'
                        ? 'bg-forest/10 border-forest text-forest shadow-xs font-bold ring-2 ring-forest/20'
                        : 'bg-forest/5 border-forest/15 text-forest/70 hover:bg-forest/10 hover:text-forest'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <FileText className="w-4 h-4 text-forest" />
                          <span>Clásico Continuo</span>
                        </div>
                        {(layoutStyle === 'classic' || layoutStyle === 'google_forms') && <Check className="w-4 h-4 text-forest stroke-[3]" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-normal leading-tight">
                        Tarjetas verticales continuas por secciones.
                      </p>
                    </button>

                    {/* Option 2: Flujo Guiado */}
                    <button
                      type="button"
                      onClick={() => setLayoutStyle('focus_flow')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${layoutStyle === 'focus_flow' || layoutStyle === 'typeform'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-xs font-bold ring-2 ring-purple-500/20'
                        : 'bg-forest/5 border-forest/15 text-forest/70 hover:bg-forest/10 hover:text-forest'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span>Flujo Guiado</span>
                        </div>
                        {(layoutStyle === 'focus_flow' || layoutStyle === 'typeform') && <Check className="w-4 h-4 text-purple-700 stroke-[3]" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-normal leading-tight">
                        1 pregunta a la vez a pantalla completa con navegación ágil.
                      </p>
                    </button>

                    {/* Option 3: Paso a Paso */}
                    <button
                      type="button"
                      onClick={() => setLayoutStyle('step_wizard')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${layoutStyle === 'step_wizard' || layoutStyle === 'wizard_liquid'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs font-bold ring-2 ring-emerald-500/20'
                        : 'bg-forest/5 border-forest/15 text-forest/70 hover:bg-forest/10 hover:text-forest'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span>Paso a Paso</span>
                        </div>
                        {(layoutStyle === 'step_wizard' || layoutStyle === 'wizard_liquid') && <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-normal leading-tight">
                        Navegación secuencial por pasos con indicador de progreso.
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Section Navigation Tabs (Wizard Steps) */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {sections.map((sec, idx) => {
                    const isActive = sec.id === activeSectionId;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => {
                          setActiveSectionId(sec.id);
                          setActiveFieldId(sec.fields[0]?.id || '');
                        }}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${isActive
                          ? 'bg-forest text-white border-forest shadow-xs'
                          : 'bg-white text-forest border-forest/15 hover:bg-forest/5'
                          }`}
                      >
                        <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${isActive ? 'bg-white text-forest' : 'bg-forest/10 text-forest'
                          }`}>
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[140px]">{sec.title || `Sección ${idx + 1}`}</span>
                        <span className="text-[10px] opacity-70">({sec.fields.length})</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3.5 py-2 bg-white hover:bg-forest/5 text-forest border border-forest/15 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                  title="Agregar nueva sección wizard"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-forest" />
                  <span className="hidden sm:inline">Nueva Sección</span>
                </button>
              </div>

              {/* 3. Section Title & Description Card */}
              {currentSection && (
                <div className="bg-white rounded-3xl p-5 border border-forest/15 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={currentSection.title}
                        onChange={(e) => handleUpdateSection(currentSection.id, { title: e.target.value })}
                        placeholder="Título de la Sección"
                        className="w-full font-bold text-base text-forest bg-transparent border-b border-transparent hover:border-forest/20 focus:border-forest pb-0.5 outline-none transition-all"
                      />
                      <input
                        type="text"
                        value={currentSection.description || ''}
                        onChange={(e) => handleUpdateSection(currentSection.id, { description: e.target.value })}
                        placeholder="Descripción de esta sección (opcional)..."
                        className="w-full text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-forest/20 focus:border-forest py-0.5 outline-none transition-all"
                      />
                    </div>

                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(currentSection.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
                        title="Eliminar esta sección"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Google Forms Questions Stack */}
              <div className="space-y-4">
                {currentSection?.fields.map((field, index) => {
                  const isFocused = field.id === activeFieldId;
                  const fieldTypeMeta = FIELD_TYPES.find(f => f.type === field.type) || FIELD_TYPES[0];
                  const FieldIcon = fieldTypeMeta.icon;

                  return (
                    <div
                      key={field.id}
                      onClick={() => setActiveFieldId(field.id)}
                      className={`bg-white rounded-3xl border transition-all p-5 sm:p-6 space-y-4 ${isFocused
                        ? 'border-forest ring-2 ring-forest/20 border-l-8 border-l-forest shadow-md'
                        : 'border-forest/15 shadow-xs hover:border-forest/30'
                        }`}
                    >
                      {/* Top Question Row: Label Input + Type Dropdown */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                            placeholder="Escribe la pregunta..."
                            className="w-full font-bold text-sm text-forest bg-forest/5 hover:bg-forest/10 focus:bg-white px-3 py-2 rounded-xl border border-transparent focus:border-forest/20 focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                          />
                        </div>

                        {/* Question Type Selector */}
                        <div className="relative shrink-0">
                          <select
                            value={field.type}
                            disabled
                            className="w-full sm:w-56 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 cursor-not-allowed opacity-80 focus:outline-none"
                            title="El tipo de campo no se puede modificar. Elimina este campo y crea uno nuevo."
                          >
                            {FIELD_TYPES.map((ft) => (
                              <option key={ft.type} value={ft.type}>
                                {ft.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Helper text input (optional) */}
                      {isFocused && (
                        <div className="animate-in fade-in duration-150">
                          <input
                            type="text"
                            value={field.helpText || ''}
                            onChange={(e) => handleUpdateField(field.id, { helpText: e.target.value })}
                            placeholder="Texto de ayuda o instrucción adicional (opcional)..."
                            className="w-full text-xs text-muted-foreground bg-transparent border-b border-forest/10 hover:border-forest/20 focus:border-forest py-1 outline-none transition-all"
                          />
                        </div>
                      )}

                      {/* Interactive Field Content by Type */}
                      <div className="pt-2">
                        {/* Choice Options Editor (Single Choice or Multiple Choice) */}
                        {(field.type === 'single_choice' || field.type === 'multiple_choice') && (
                          <div className="space-y-2">
                            {(field.options || ['Opción 1']).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 group">
                                {field.type === 'single_choice' ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-forest/40 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-md border-2 border-forest/40 shrink-0" />
                                )}

                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(field.id, optIdx, e.target.value)}
                                  placeholder={`Opción ${optIdx + 1}`}
                                  className="flex-1 text-xs text-forest font-medium bg-transparent border-b border-transparent hover:border-forest/20 focus:border-forest py-1 px-2 outline-none transition-all"
                                />

                                {(field.options?.length || 0) > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(field.id, optIdx)}
                                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Quitar opción"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddOption(field.id)}
                              className="text-xs font-bold text-forest/70 hover:text-forest pl-6 py-1 flex items-center gap-1.5 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Agregar opción</span>
                            </button>
                          </div>
                        )}

                        {field.type === 'poll' && (
                          <div className="space-y-4 p-3 bg-forest/5 border border-forest/15 rounded-2xl text-xs">
                            {/* Options list */}
                            <div className="space-y-2">
                              <span className="font-bold text-forest block">Elementos de la Encuesta:</span>
                              {(field.pollConfig?.options || []).map((opt, optIdx) => (
                                <div key={opt.id || optIdx} className="space-y-1.5 p-2 bg-white rounded-xl border border-forest/10 relative">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={opt.title}
                                      onChange={(e) => {
                                        const newOpts = [...(field.pollConfig?.options || [])];
                                        newOpts[optIdx] = { ...opt, title: e.target.value };
                                        handleUpdateField(field.id, {
                                          pollConfig: {
                                            ...(field.pollConfig || {}),
                                            options: newOpts
                                          }
                                        });
                                      }}
                                      placeholder="Título del elemento"
                                      className="flex-1 text-xs font-bold text-forest bg-forest/5 focus:bg-white border border-forest/10 rounded-lg px-2 py-0.5 outline-none"
                                    />
                                    {(field.pollConfig?.options?.length || 0) > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newOpts = (field.pollConfig?.options || []).filter((_, idx) => idx !== optIdx);
                                          handleUpdateField(field.id, {
                                            pollConfig: {
                                              ...(field.pollConfig || {}),
                                              options: newOpts
                                            }
                                          });
                                        }}
                                        className="p-1 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                        title="Eliminar elemento"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  <textarea
                                    value={opt.description || ''}
                                    onChange={(e) => {
                                      const newOpts = [...(field.pollConfig?.options || [])];
                                      newOpts[optIdx] = { ...opt, description: e.target.value };
                                      handleUpdateField(field.id, {
                                        pollConfig: {
                                          ...(field.pollConfig || {}),
                                          options: newOpts
                                        }
                                      });
                                    }}
                                    placeholder="Descripción del elemento (opcional)"
                                    rows={2}
                                    className="w-full text-[11px] text-slate-600 bg-forest/5 focus:bg-white border border-forest/10 rounded-lg px-2 py-0.5 outline-none resize-none"
                                  />
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => {
                                  const newOpts = [
                                    ...(field.pollConfig?.options || []),
                                    { id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, title: `Nueva opción ${(field.pollConfig?.options?.length || 0) + 1}`, description: '' }
                                  ];
                                  handleUpdateField(field.id, {
                                    pollConfig: {
                                      ...(field.pollConfig || {}),
                                      options: newOpts
                                    }
                                  });
                                }}
                                className="text-xs text-forest font-semibold hover:underline flex items-center gap-1 pt-1"
                              >
                                <Plus className="w-3.5 h-3.5 text-forest" />
                                <span>Agregar elemento de encuesta</span>
                              </button>
                            </div>

                            {/* Configuración de la Encuesta */}
                            <div className="pt-3 border-t border-forest/10 space-y-3">
                              <span className="font-bold text-forest block">Configuración de la Encuesta</span>

                              {/* Selection Mode toggle */}
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700">Modo de Selección:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateField(field.id, {
                                      pollConfig: {
                                        ...(field.pollConfig || {}),
                                        allowMultiple: !field.pollConfig?.allowMultiple
                                      }
                                    });
                                  }}
                                  className={`h-7 px-2.5 rounded-full flex items-center justify-between gap-2.5 transition-all duration-300 cursor-pointer shrink-0 select-none shadow-xs border border-forest/15 ${field.pollConfig?.allowMultiple ? 'bg-forest text-white' : 'bg-slate-200 text-slate-700'
                                    }`}
                                  style={{ minWidth: '95px' }}
                                >
                                  {field.pollConfig?.allowMultiple ? (
                                    <>
                                      <span className="text-[9px] font-extrabold tracking-wide uppercase pl-1">Múltiple</span>
                                      <div className="w-4 h-4 rounded-full bg-white border border-slate-300/80 shadow-xs shrink-0" />
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-4 h-4 rounded-full bg-white border border-slate-300/80 shadow-xs shrink-0" />
                                      <span className="text-[9px] font-extrabold tracking-wide uppercase pr-1">Simple</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Show Results After Submit toggle */}
                              <div className="flex items-center justify-between pb-1 border-b border-forest/5">
                                <span className="font-semibold text-slate-700 font-medium">Ver resultados al enviar:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateField(field.id, {
                                      pollConfig: {
                                        ...(field.pollConfig || {}),
                                        showResultsAfterSubmit: !field.pollConfig?.showResultsAfterSubmit
                                      }
                                    });
                                  }}
                                  className={`h-7 px-2.5 rounded-full flex items-center justify-between gap-3.5 transition-all duration-300 cursor-pointer shrink-0 select-none shadow-xs border border-forest/15 ${field.pollConfig?.showResultsAfterSubmit ? 'bg-forest text-white' : 'bg-slate-200 text-slate-700'
                                    }`}
                                  style={{ minWidth: '60px' }}
                                >
                                  {field.pollConfig?.showResultsAfterSubmit ? (
                                    <>
                                      <span className="text-[9px] font-extrabold tracking-wide uppercase pl-1.5">SÍ</span>
                                      <div className="w-4 h-4 rounded-full bg-white border border-slate-300/80 shadow-xs shrink-0" />
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-4 h-4 rounded-full bg-white border border-slate-300/80 shadow-xs shrink-0" />
                                      <span className="text-[9px] font-extrabold tracking-wide uppercase pr-1.5">NO</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Short Text Preview */}
                        {field.type === 'text' && (
                          <div className="py-2">
                            <div className="w-full sm:w-2/3 border-b border-dashed border-forest/30 text-xs text-muted-foreground/60 py-1 italic">
                              Texto de respuesta corta
                            </div>
                          </div>
                        )}

                        {/* Textarea Preview */}
                        {field.type === 'textarea' && (
                          <div className="py-2">
                            <div className="w-full border-b border-dashed border-forest/30 text-xs text-muted-foreground/60 py-3 italic">
                              Texto de respuesta larga / párrafo
                            </div>
                          </div>
                        )}

                        {/* Phone / Email / Number */}
                        {(field.type === 'phone' || field.type === 'email' || field.type === 'integer' || field.type === 'decimal') && (
                          <div className="py-2">
                            <div className="w-full sm:w-1/2 border-b border-dashed border-forest/30 text-xs text-muted-foreground/60 py-1 italic flex items-center gap-2">
                              <FieldIcon className="w-3.5 h-3.5 text-forest/40" />
                              <span>Entrada validada ({fieldTypeMeta.label})</span>
                            </div>
                          </div>
                        )}

                        {/* Date Preview */}
                        {field.type === 'date' && (
                          <div className="py-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest/5 border border-forest/15 text-xs text-forest font-medium">
                              <Calendar className="w-4 h-4 text-forest" />
                              <span>DD / MM / AAAA</span>
                            </div>
                          </div>
                        )}

                        {/* File Upload Settings */}
                        {field.type === 'file_upload' && (
                          <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-forest">
                              <UploadCloud className="w-4 h-4 text-forest" />
                              <span>Configuración de Carga de Archivos</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground block mb-1">Formatos Permitidos</label>
                                <input
                                  type="text"
                                  value={field.fileConfig?.accept || '.pdf,.jpg,.jpeg,.png'}
                                  onChange={(e) => handleUpdateField(field.id, {
                                    fileConfig: { ...(field.fileConfig || {}), accept: e.target.value }
                                  })}
                                  placeholder=".pdf,.jpg,.png"
                                  className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1 text-xs text-forest font-mono"
                                />
                              </div>
                              <div className="flex items-center gap-2 pt-4">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-forest">
                                  <input
                                    type="checkbox"
                                    checked={!!field.fileConfig?.multiple}
                                    onChange={(e) => handleUpdateField(field.id, {
                                      fileConfig: { ...(field.fileConfig || {}), multiple: e.target.checked }
                                    })}
                                    className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest"
                                  />
                                  <span>Permitir múltiples archivos</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Signature Preview */}
                        {field.type === 'signature' && (
                          <div className="p-4 rounded-2xl bg-forest/5 border border-dashed border-forest/20 text-center space-y-1.5">
                            <PenTool className="w-5 h-5 text-forest/40 mx-auto" />
                            <span className="text-xs font-bold text-forest block">Lienzo de Firma Digital Activo</span>
                            <p className="text-[11px] text-muted-foreground">
                              El tutor podrá trazar su firma con el dedo o puntero en la pantalla.
                            </p>
                          </div>
                        )}

                        {/* Boolean Switch Preview */}
                        {field.type === 'boolean' && (
                          <div className="py-2">
                            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-forest/5 border border-forest/10">
                              <ToggleLeft className="w-5 h-5 text-forest" />
                              <span className="text-xs font-semibold text-forest">Casilla interactiva de aceptación</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Toolbar (Google Forms style) */}
                      <div className="pt-3 border-t border-forest/10 flex items-center justify-end gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => handleMoveField(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-xl hover:bg-forest/10 text-forest disabled:opacity-30 transition-colors"
                          title="Mover arriba"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveField(index, 'down')}
                          disabled={index === (currentSection?.fields.length || 0) - 1}
                          className="p-1.5 rounded-xl hover:bg-forest/10 text-forest disabled:opacity-30 transition-colors"
                          title="Mover abajo"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateField(field, index)}
                          className="p-1.5 rounded-xl hover:bg-forest/10 text-forest transition-colors"
                          title="Duplicar pregunta"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="h-4 w-px bg-forest/15 mx-1" />

                        {/* Obligatorio Switch */}
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-forest text-xs select-none">
                          <span>Obligatorio</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateField(field.id, { required: !field.required })}
                            className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${field.required ? 'bg-forest justify-end' : 'bg-slate-300 justify-start'
                              }`}
                          >
                            <div className="w-3 h-3 rounded-full bg-white shadow-2xs" />
                          </button>
                        </label>
                      </div>
                    </div>
                  );
                })}

                {/* Add Question Button in-line */}
                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddField('text')}
                    className="px-5 py-2.5 bg-white hover:bg-forest/5 text-forest border border-forest/20 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105"
                  >
                    <Plus className="w-4 h-4 text-forest" />
                    <span>Agregar Pregunta</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* ================= INTERACTIVE MULTI-LAYOUT PREVIEW MODE ================= */
            <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">

              {/* Preview Layout Style Switcher Toolbar */}
              <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-forest/15 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-forest">
                  <Eye className="w-4 h-4 text-forest" />
                  <span>Simulador de Vista del Respondiente:</span>
                </div>

                <div className="flex items-center gap-1.5 bg-forest/5 p-1 rounded-xl border border-forest/10 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewLayoutStyle('google_forms');
                      setPreviewStep(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${previewLayoutStyle === 'google_forms'
                      ? 'bg-forest text-white shadow-2xs'
                      : 'text-forest/70 hover:text-forest hover:bg-forest/10'
                      }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>1. Google Forms</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewLayoutStyle('typeform');
                      setTypeformIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${previewLayoutStyle === 'typeform'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-purple-900/70 hover:text-purple-900 hover:bg-purple-50'
                      }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2. Typeform</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewLayoutStyle('wizard_liquid');
                      setPreviewStep(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${previewLayoutStyle === 'wizard_liquid'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-emerald-900/70 hover:text-emerald-900 hover:bg-emerald-50'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>3. Wizard Liquid</span>
                  </button>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* OPTION 1: GOOGLE FORMS LAYOUT (Card Canvas)          */}
              {/* ---------------------------------------------------- */}
              {previewLayoutStyle === 'google_forms' && (
                <div className="space-y-4 animate-in fade-in zoom-in-98 duration-200">
                  {/* Form Hero Preview Card */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-sm border-t-8 border-t-forest space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-forest/70 bg-forest/10 px-3 py-0.8 rounded-full inline-block">
                        Google Forms Canvas • {category}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        Paso {previewStep + 1} de {sections.length}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-display text-forest">{title || 'Sin Título'}</h2>
                    {description && <p className="text-xs text-muted-foreground leading-relaxed pt-1">{description}</p>}

                    {/* Section subtitle if on step > 0 */}
                    {sections[previewStep]?.title && previewStep > 0 && (
                      <div className="pt-2 border-t border-forest/10">
                        <h3 className="font-bold text-sm text-forest font-display">{sections[previewStep].title}</h3>
                        {sections[previewStep].description && (
                          <p className="text-xs text-muted-foreground">{sections[previewStep].description}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Questions Rendered as Stacked Individual Cards (Google Forms Style) */}
                  {sections[previewStep]?.fields.map((field, fIdx) => (
                    <div
                      key={field.id}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-forest/15 shadow-xs space-y-3 transition-all hover:border-forest/30"
                    >
                      <label className="text-xs sm:text-sm font-bold text-forest flex items-start justify-between gap-2">
                        <span>
                          {fIdx + 1}. {field.label} {field.required && <span className="text-destructive font-bold">*</span>}
                        </span>
                      </label>
                      {field.helpText && (
                        <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
                      )}

                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder || 'Tu respuesta...'}
                          value={previewData[field.id] || ''}
                          onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.value })}
                          className="w-full bg-forest/5 border border-forest/15 rounded-2xl p-3 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                        />
                      ) : field.type === 'single_choice' ? (
                        <div className="space-y-2">
                          {(field.options || []).map((opt) => (
                            <label key={opt} className="flex items-center gap-2.5 p-3 rounded-2xl bg-forest/5 hover:bg-forest/10 cursor-pointer text-xs text-forest font-medium transition-colors">
                              <input
                                type="radio"
                                name={`prev_gf_${field.id}`}
                                value={opt}
                                checked={previewData[field.id] === opt}
                                onChange={(e) => setPreviewData({ ...previewData, [field.id]: opt })}
                                className="w-4 h-4 text-forest accent-forest"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'multiple_choice' ? (
                        <div className="space-y-2">
                          {(field.options || []).map((opt) => {
                            const checkedArr = previewData[field.id] || [];
                            const isChecked = checkedArr.includes(opt);
                            return (
                              <label key={opt} className="flex items-center gap-2.5 p-3 rounded-2xl bg-forest/5 hover:bg-forest/10 cursor-pointer text-xs text-forest font-medium transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...checkedArr, opt]
                                      : checkedArr.filter((x: string) => x !== opt);
                                    setPreviewData({ ...previewData, [field.id]: next });
                                  }}
                                  className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : field.type === 'poll' ? (
                        <div className="space-y-3">
                          {(field.pollConfig?.options || []).map((opt) => {
                            const allowMultiple = !!field.pollConfig?.allowMultiple;
                            let isSelected = false;
                            if (allowMultiple) {
                              const arr = previewData[field.id] || [];
                              isSelected = arr.includes(opt.id);
                            } else {
                              isSelected = previewData[field.id] === opt.id;
                            }

                            return (
                              <label
                                key={opt.id}
                                className={`flex items-start gap-3.5 p-4 cursor-pointer text-xs transition-all border-2 relative rounded-2xl ${isSelected
                                  ? 'bg-white shadow-xs font-semibold border-2 border-forest'
                                  : 'bg-forest/5 hover:bg-forest/10 text-forest border-transparent'
                                  }`}
                              >
                                <div className="flex items-center h-5 shrink-0 mt-0.5">
                                  <input
                                    type={allowMultiple ? 'checkbox' : 'radio'}
                                    name={`prev_gf_${field.id}`}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (allowMultiple) {
                                        const arr = previewData[field.id] || [];
                                        if (e.target.checked) {
                                          setPreviewData({ ...previewData, [field.id]: [...arr, opt.id] });
                                        } else {
                                          setPreviewData({ ...previewData, [field.id]: arr.filter((x: string) => x !== opt.id) });
                                        }
                                      } else {
                                        setPreviewData({ ...previewData, [field.id]: opt.id });
                                      }
                                    }}
                                    className={`w-4 h-4 text-forest focus:ring-forest accent-forest ${allowMultiple ? 'rounded' : ''}`}
                                  />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <span className="font-bold text-forest text-sm block leading-tight">{opt.title}</span>
                                  {opt.description && (
                                    <p className="text-xs text-slate-500 font-normal leading-relaxed">{opt.description}</p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : field.type === 'boolean' ? (
                        <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-forest/5 hover:bg-forest/10 cursor-pointer text-xs text-forest font-semibold transition-colors">
                          <input
                            type="checkbox"
                            checked={!!previewData[field.id]}
                            onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.checked })}
                            className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest"
                          />
                          <span>{field.label}</span>
                        </label>
                      ) : field.type === 'file_upload' ? (
                        <div className="p-6 rounded-2xl border-2 border-dashed border-forest/20 bg-forest/5 text-center space-y-2">
                          <UploadCloud className="w-8 h-8 text-forest/40 mx-auto" />
                          <span className="text-xs font-bold text-forest block">Haz clic para subir un archivo</span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            Acepta: {field.fileConfig?.accept || 'Cualquier formato'} (Máx 10MB)
                          </span>
                        </div>
                      ) : field.type === 'signature' ? (
                        <div className="p-6 rounded-2xl border-2 border-dashed border-forest/20 bg-white text-center space-y-2">
                          <PenTool className="w-6 h-6 text-forest/40 mx-auto" />
                          <span className="text-xs font-bold text-forest block">Área de Firma Digital</span>
                          <span className="text-[10px] text-muted-foreground block">
                            Dibuja tu firma en este recuadro para validar el consentimiento.
                          </span>
                        </div>
                      ) : (
                        <input
                          type={field.type === 'date' ? 'date' : field.type === 'integer' || field.type === 'decimal' ? 'number' : 'text'}
                          placeholder={field.placeholder || 'Tu respuesta...'}
                          value={previewData[field.id] || ''}
                          onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.value })}
                          className="w-full bg-forest/5 border border-forest/15 rounded-2xl px-3.5 py-2.5 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                        />
                      )}
                    </div>
                  ))}

                  {/* Google Forms Bottom Stepper Controls */}
                  <div className="bg-white rounded-3xl p-4 sm:p-5 border border-forest/15 shadow-xs flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewStep(Math.max(0, previewStep - 1))}
                      disabled={previewStep === 0}
                      className="px-4 py-2 rounded-2xl text-xs font-bold text-forest hover:bg-forest/10 disabled:opacity-30 transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-36 h-2 bg-forest/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-forest rounded-full transition-all duration-300"
                          style={{ width: `${((previewStep + 1) / sections.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-forest">
                        {Math.round(((previewStep + 1) / sections.length) * 100)}%
                      </span>
                    </div>

                    {previewStep < sections.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setPreviewStep(previewStep + 1)}
                        className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105"
                      >
                        <span>Siguiente</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          toast.success('¡Formulario enviado correctamente (Modo Simulación Google Forms)!');
                        }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Enviar Formulario</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* OPTION 2: TYPEFORM LAYOUT (1 Question at a time)     */}
              {/* ---------------------------------------------------- */}
              {previewLayoutStyle === 'typeform' && (
                <div className="bg-linear-to-b from-white to-purple-50/30 rounded-3xl border border-purple-200/80 shadow-lg p-6 sm:p-10 min-h-[460px] flex flex-col justify-between relative overflow-hidden animate-in fade-in zoom-in-98 duration-200">
                  {/* Typeform Top Progress Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-100">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{
                        width: allFlatQuestions.length > 0
                          ? `${((typeformIndex + 1) / allFlatQuestions.length) * 100}%`
                          : '100%'
                      }}
                    />
                  </div>

                  {/* Header Subtitle */}
                  <div className="flex items-center justify-between text-xs text-purple-900/60 font-semibold pt-1">
                    <span className="truncate max-w-[200px] sm:max-w-none">{title}</span>
                    <span className="font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {typeformIndex + 1} de {allFlatQuestions.length || 1}
                    </span>
                  </div>

                  {/* Active Question Box */}
                  {allFlatQuestions[typeformIndex] ? (
                    <div className="my-auto py-6 space-y-6 max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-3 duration-250">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-purple-700 font-bold text-xs font-mono">
                          <span>{String(typeformIndex + 1).padStart(2, '0')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase tracking-wider bg-purple-100/70 text-purple-900 px-2 py-0.5 rounded-md font-sans">
                            {allFlatQuestions[typeformIndex].sectionTitle}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-2xl font-bold font-display text-purple-950 leading-snug">
                          {allFlatQuestions[typeformIndex].label}
                          {allFlatQuestions[typeformIndex].required && (
                            <span className="text-rose-500 ml-1 font-bold">*</span>
                          )}
                        </h3>

                        {allFlatQuestions[typeformIndex].helpText && (
                          <p className="text-xs text-purple-900/70">{allFlatQuestions[typeformIndex].helpText}</p>
                        )}
                      </div>

                      {/* Typeform Large Inputs */}
                      <div className="pt-2">
                        {allFlatQuestions[typeformIndex].type === 'textarea' ? (
                          <textarea
                            rows={3}
                            autoFocus
                            placeholder="Escribe tu respuesta aquí..."
                            value={previewData[allFlatQuestions[typeformIndex].id] || ''}
                            onChange={(e) => setPreviewData({ ...previewData, [allFlatQuestions[typeformIndex].id]: e.target.value })}
                            className="w-full bg-white border-2 border-purple-200 focus:border-purple-600 rounded-2xl p-4 text-sm text-purple-950 outline-none transition-all shadow-2xs"
                          />
                        ) : allFlatQuestions[typeformIndex].type === 'single_choice' ? (
                          <div className="space-y-2.5">
                            {(allFlatQuestions[typeformIndex].options || []).map((opt, oIdx) => {
                              const isSelected = previewData[allFlatQuestions[typeformIndex].id] === opt;
                              const letter = String.fromCharCode(65 + oIdx);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setPreviewData({ ...previewData, [allFlatQuestions[typeformIndex].id]: opt })}
                                  className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group ${isSelected
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md font-bold scale-101'
                                    : 'bg-white hover:bg-purple-50 text-purple-950 border-purple-200'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center border ${isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-purple-100 text-purple-800 border-purple-200'
                                      }`}>
                                      {letter}
                                    </span>
                                    <span className="text-xs sm:text-sm">{opt}</span>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : allFlatQuestions[typeformIndex].type === 'multiple_choice' ? (
                          <div className="space-y-2.5">
                            {(allFlatQuestions[typeformIndex].options || []).map((opt, oIdx) => {
                              const checkedArr = previewData[allFlatQuestions[typeformIndex].id] || [];
                              const isChecked = checkedArr.includes(opt);
                              const letter = String.fromCharCode(65 + oIdx);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    const next = isChecked
                                      ? checkedArr.filter((x: string) => x !== opt)
                                      : [...checkedArr, opt];
                                    setPreviewData({ ...previewData, [allFlatQuestions[typeformIndex].id]: next });
                                  }}
                                  className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group ${isChecked
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md font-bold scale-101'
                                    : 'bg-white hover:bg-purple-50 text-purple-950 border-purple-200'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center border ${isChecked ? 'bg-white/20 text-white border-white/30' : 'bg-purple-100 text-purple-800 border-purple-200'
                                      }`}>
                                      {letter}
                                    </span>
                                    <span className="text-xs sm:text-sm">{opt}</span>
                                  </div>
                                  {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : allFlatQuestions[typeformIndex].type === 'poll' ? (
                          <div className="space-y-2.5">
                            {(allFlatQuestions[typeformIndex].pollConfig?.options || []).map((opt, oIdx) => {
                              const q = allFlatQuestions[typeformIndex];
                              const allowMultiple = !!q.pollConfig?.allowMultiple;
                              let isSelected = false;
                              if (allowMultiple) {
                                const arr = previewData[q.id] || [];
                                isSelected = arr.includes(opt.id);
                              } else {
                                isSelected = previewData[q.id] === opt.id;
                              }

                              const letter = String.fromCharCode(65 + oIdx);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    if (allowMultiple) {
                                      const arr = previewData[q.id] || [];
                                      const next = isSelected
                                        ? arr.filter((x: string) => x !== opt.id)
                                        : [...arr, opt.id];
                                      setPreviewData({ ...previewData, [q.id]: next });
                                    } else {
                                      setPreviewData({ ...previewData, [q.id]: opt.id });
                                    }
                                  }}
                                  className={`w-full p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group relative ${isSelected
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md font-bold scale-101'
                                    : 'bg-white hover:bg-purple-50 text-purple-950 border-purple-200'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center border ${isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-purple-100 text-purple-800 border-purple-200'
                                      }`}>
                                      {letter}
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold">{opt.title}</span>
                                  </div>
                                  {opt.description && (
                                    <p className={`text-xs leading-relaxed pl-9 font-normal ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                      {opt.description}
                                    </p>
                                  )}
                                  {isSelected && (
                                    <div className="absolute top-4 right-4">
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : allFlatQuestions[typeformIndex].type === 'file_upload' ? (
                          <div className="p-8 rounded-3xl border-2 border-dashed border-purple-300 bg-white text-center space-y-2">
                            <UploadCloud className="w-10 h-10 text-purple-400 mx-auto" />
                            <span className="text-sm font-bold text-purple-950 block">Selecciona o arrastra tu archivo aquí</span>
                            <span className="text-xs text-purple-700 block font-mono">
                              Acepta: {allFlatQuestions[typeformIndex].fileConfig?.accept || 'Formatos estándar'}
                            </span>
                          </div>
                        ) : allFlatQuestions[typeformIndex].type === 'signature' ? (
                          <div className="p-8 rounded-3xl border-2 border-dashed border-purple-300 bg-white text-center space-y-2">
                            <PenTool className="w-8 h-8 text-purple-400 mx-auto" />
                            <span className="text-sm font-bold text-purple-950 block">Trazar Firma en Pantalla</span>
                          </div>
                        ) : (
                          <input
                            type={allFlatQuestions[typeformIndex].type === 'date' ? 'date' : allFlatQuestions[typeformIndex].type === 'integer' || allFlatQuestions[typeformIndex].type === 'decimal' ? 'number' : 'text'}
                            autoFocus
                            placeholder={allFlatQuestions[typeformIndex].placeholder || 'Escribe tu respuesta...'}
                            value={previewData[allFlatQuestions[typeformIndex].id] || ''}
                            onChange={(e) => setPreviewData({ ...previewData, [allFlatQuestions[typeformIndex].id]: e.target.value })}
                            className="w-full bg-white border-b-2 border-purple-300 focus:border-purple-600 px-3 py-3 text-base sm:text-lg text-purple-950 font-medium outline-none transition-all placeholder:text-purple-300"
                          />
                        )}
                      </div>

                      {/* Typeform Advance Button */}
                      <div className="flex items-center gap-3 pt-4">
                        {typeformIndex < allFlatQuestions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setTypeformIndex(typeformIndex + 1)}
                            className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:scale-102"
                          >
                            <span>Aceptar</span>
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono ml-1">
                              Enter ↵
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toast.success('¡Formulario enviado con éxito (Modo Typeform)!')}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:scale-102"
                          >
                            <span>Enviar Todo</span>
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-xs text-muted-foreground">
                      No hay preguntas configuradas en el formulario.
                    </div>
                  )}

                  {/* Typeform Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-purple-100 text-xs text-purple-900/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold">Ceiba Roots Typeform Engine</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-purple-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTypeformIndex(Math.max(0, typeformIndex - 1))}
                        disabled={typeformIndex === 0}
                        className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-900 disabled:opacity-30 transition-colors"
                        title="Pregunta anterior"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeformIndex(Math.min(allFlatQuestions.length - 1, typeformIndex + 1))}
                        disabled={typeformIndex >= allFlatQuestions.length - 1}
                        className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-900 disabled:opacity-30 transition-colors"
                        title="Siguiente pregunta"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* OPTION 3: WIZARD LIQUID LAYOUT (Glassmorphism & Flow)*/}
              {/* ---------------------------------------------------- */}
              {previewLayoutStyle === 'wizard_liquid' && (
                <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
                  {/* Liquid Multi-Step Capsule Header */}
                  <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/60 shadow-md space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-display text-sm">{title}</span>
                      </div>
                      <span className="bg-emerald-100/70 text-emerald-900 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        Paso {previewStep + 1} de {sections.length}
                      </span>
                    </div>

                    {/* Fluid Liquid Step Nodes */}
                    <div className="flex items-center justify-between relative px-2 sm:px-6">
                      {/* Background Connection Track */}
                      <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1.5 bg-emerald-100 rounded-full z-0" />
                      {/* Active Liquid Line */}
                      <div
                        className="absolute top-1/2 left-6 -translate-y-1/2 h-1.5 bg-gradient-to-r from-emerald-500 to-forest rounded-full z-0 transition-all duration-300"
                        style={{ width: `${(previewStep / Math.max(1, sections.length - 1)) * 88}%` }}
                      />

                      {sections.map((sec, sIdx) => {
                        const isDone = sIdx < previewStep;
                        const isCurrent = sIdx === previewStep;

                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => setPreviewStep(sIdx)}
                            className="relative z-10 flex flex-col items-center gap-1.5 group cursor-pointer"
                          >
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-sm ${isCurrent
                              ? 'bg-forest text-white ring-4 ring-forest/20 scale-110'
                              : isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-emerald-950/60 border border-emerald-200'
                              }`}>
                              {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : sIdx + 1}
                            </div>
                            <span className={`text-[10px] hidden sm:block max-w-[80px] truncate font-semibold text-center ${isCurrent ? 'text-forest font-bold' : 'text-muted-foreground'
                              }`}>
                              {sec.title.replace(/^Sección\s*\d+:\s*/i, '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Glassmorphic Active Step Questions Card */}
                  {sections[previewStep] && (
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl space-y-6 animate-in slide-in-from-right-4 duration-200">
                      <div className="border-b border-emerald-900/10 pb-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase tracking-wider font-mono">
                            Fase {previewStep + 1}
                          </span>
                          <h3 className="font-bold font-display text-base sm:text-lg text-emerald-950">
                            {sections[previewStep].title}
                          </h3>
                        </div>
                        {sections[previewStep].description && (
                          <p className="text-xs text-muted-foreground">{sections[previewStep].description}</p>
                        )}
                      </div>

                      <div className="space-y-5">
                        {sections[previewStep].fields.map((field) => (
                          <div key={field.id} className="space-y-2 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60">
                            <label className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                              <span>
                                {field.label} {field.required && <span className="text-rose-600 font-bold">*</span>}
                              </span>
                            </label>
                            {field.helpText && (
                              <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
                            )}

                            {field.type === 'textarea' ? (
                              <textarea
                                rows={3}
                                placeholder={field.placeholder || 'Tu respuesta...'}
                                value={previewData[field.id] || ''}
                                onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.value })}
                                className="w-full bg-white border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            ) : field.type === 'single_choice' ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(field.options || []).map((opt) => (
                                  <label key={opt} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${previewData[field.id] === opt
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-200/80'
                                    }`}>
                                    <input
                                      type="radio"
                                      name={`prev_wl_${field.id}`}
                                      value={opt}
                                      checked={previewData[field.id] === opt}
                                      onChange={(e) => setPreviewData({ ...previewData, [field.id]: opt })}
                                      className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            ) : field.type === 'multiple_choice' ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(field.options || []).map((opt) => {
                                  const checkedArr = previewData[field.id] || [];
                                  const isChecked = checkedArr.includes(opt);
                                  return (
                                    <label key={opt} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${isChecked
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-200/80'
                                      }`}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const next = e.target.checked
                                            ? [...checkedArr, opt]
                                            : checkedArr.filter((x: string) => x !== opt);
                                          setPreviewData({ ...previewData, [field.id]: next });
                                        }}
                                        className="w-3.5 h-3.5 rounded text-emerald-600 accent-emerald-600"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : field.type === 'poll' ? (
                              <div className="space-y-3">
                                {(field.pollConfig?.options || []).map((opt) => {
                                  const allowMultiple = !!field.pollConfig?.allowMultiple;
                                  let isSelected = false;
                                  if (allowMultiple) {
                                    const arr = previewData[field.id] || [];
                                    isSelected = arr.includes(opt.id);
                                  } else {
                                    isSelected = previewData[field.id] === opt.id;
                                  }

                                  return (
                                    <label
                                      key={opt.id}
                                      className={`flex items-start gap-3.5 p-4 cursor-pointer text-xs transition-all border-2 relative rounded-2xl ${isSelected
                                        ? 'bg-white shadow-xs font-semibold border-2 border-emerald-500'
                                        : 'bg-white border border-emerald-200/80 text-emerald-950 hover:bg-emerald-50'
                                        }`}
                                    >
                                      <div className="flex items-center h-5 shrink-0 mt-0.5">
                                        <input
                                          type={allowMultiple ? 'checkbox' : 'radio'}
                                          name={`prev_wl_${field.id}`}
                                          checked={isSelected}
                                          onChange={(e) => {
                                            if (allowMultiple) {
                                              const arr = previewData[field.id] || [];
                                              if (e.target.checked) {
                                                setPreviewData({ ...previewData, [field.id]: [...arr, opt.id] });
                                              } else {
                                                setPreviewData({ ...previewData, [field.id]: arr.filter((x: string) => x !== opt.id) });
                                              }
                                            } else {
                                              setPreviewData({ ...previewData, [field.id]: opt.id });
                                            }
                                          }}
                                          className={`w-3.5 h-3.5 text-emerald-600 accent-emerald-600 ${allowMultiple ? 'rounded' : ''}`}
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <span className="font-bold text-forest text-sm block leading-tight">{opt.title}</span>
                                        {opt.description && (
                                          <p className="text-xs text-slate-500 font-normal leading-relaxed">{opt.description}</p>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : field.type === 'file_upload' ? (
                              <div className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-white text-center space-y-2">
                                <UploadCloud className="w-7 h-7 text-emerald-500 mx-auto" />
                                <span className="text-xs font-bold text-emerald-950 block">Arrastra o sube tus archivos</span>
                                <span className="text-[10px] text-muted-foreground block font-mono">
                                  {field.fileConfig?.accept || 'Formatos permitidos'}
                                </span>
                              </div>
                            ) : field.type === 'signature' ? (
                              <div className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-white text-center space-y-2">
                                <PenTool className="w-6 h-6 text-emerald-500 mx-auto" />
                                <span className="text-xs font-bold text-emerald-950 block">Firma en el Lienzo Digital</span>
                              </div>
                            ) : (
                              <input
                                type={field.type === 'date' ? 'date' : field.type === 'integer' || field.type === 'decimal' ? 'number' : 'text'}
                                placeholder={field.placeholder || 'Tu respuesta...'}
                                value={previewData[field.id] || ''}
                                onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.value })}
                                className="w-full bg-white border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Liquid Glass Bottom Stepper Controls */}
                      <div className="pt-4 border-t border-emerald-900/10 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPreviewStep(Math.max(0, previewStep - 1))}
                          disabled={previewStep === 0}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 hover:bg-emerald-100/60 disabled:opacity-30 transition-all flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Paso Anterior</span>
                        </button>

                        {previewStep < sections.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setPreviewStep(previewStep + 1)}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-forest hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:scale-105"
                          >
                            <span>Continuar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              toast.success('¡Formulario completado y enviado (Modo Wizard Liquid)!');
                            }}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:scale-105"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Completar y Enviar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AdmissionFormBuilderModal;
