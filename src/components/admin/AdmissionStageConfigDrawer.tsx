import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Save,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FileText,
  Bell,
  Lock,
  Mail,
  Calendar,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Users,
  PenTool,
  ExternalLink,
  Settings,
  Zap,
  Globe,
  Clock,
  UserCheck,
  Sliders,
  Copy,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Filter,
  ArrowRight,
  ArrowLeft,
  Search,
  Folder
} from 'lucide-react';
import {
  AdmissionStageItem,
  StageRequiredFormItem,
  AdmissionFormTemplateItem,
  getAdmissionFormTemplates,
  createAdmissionStage,
  updateAdmissionStage,
  deleteAdmissionStage,
  reorderAdmissionStages
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { AdmissionFormsManagerDrawer } from './AdmissionFormsManagerDrawer';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';

export interface StageFieldMapping {
  id: string;
  targetExpedienteField: string;
  sourceFormFieldIds: string[]; // List of form question IDs to concatenate with space
  formFieldId?: string; // Single field compatibility
}

export interface ExpedienteTargetFieldItem {
  key: string;
  label: string;
  dataType: 'string' | 'date' | 'number';
}

export const EXPEDIENTE_TARGET_FIELDS: Array<{
  group: string;
  fields: ExpedienteTargetFieldItem[];
}> = [
    {
      group: 'Expediente del Estudiante (Tabla `Student`)',
      fields: [
        { key: 'Student.fullName', label: 'Nombre Completo del Alumno (Student.fullName)', dataType: 'string' },
        { key: 'Student.nationalId', label: 'CURP / DNI / Pasaporte / Cédula (Student.nationalId)', dataType: 'string' },
        { key: 'Student.dateOfBirth', label: 'Fecha de Nacimiento (Student.dateOfBirth)', dataType: 'date' },
        { key: 'Student.gender', label: 'Género / Sexo (Student.gender)', dataType: 'string' },
        { key: 'Student.grade', label: 'Grado Escolar (Student.grade)', dataType: 'string' },
        { key: 'Student.avatarUrl', label: 'Fotografía / Avatar URL (Student.avatarUrl)', dataType: 'string' },
        { key: 'Student.idDocumentUrl', label: 'Documento Identidad / Acta URL (Student.idDocumentUrl)', dataType: 'string' },
        { key: 'Student.bloodType', label: 'Tipo de Sangre (Student.bloodType)', dataType: 'string' },
        { key: 'Student.allergies', label: 'Alergias (Student.allergies)', dataType: 'string' },
        { key: 'Student.foodAllergies', label: 'Alergias Alimentarias (Student.foodAllergies)', dataType: 'string' },
        { key: 'Student.dietaryRestrictions', label: 'Restricciones Dietéticas (Student.dietaryRestrictions)', dataType: 'string' },
        { key: 'Student.medicalNotes', label: 'Notas Médicas / Padecimientos (Student.medicalNotes)', dataType: 'string' },
        { key: 'Student.previousSchool', label: 'Escuela de Procedencia (Student.previousSchool)', dataType: 'string' },
        { key: 'Student.previousMethodology', label: 'Metodología Previa (Student.previousMethodology)', dataType: 'string' },
        { key: 'Student.authorizedContacts', label: 'Contactos Autorizados / Recoger (Student.authorizedContacts)', dataType: 'string' },
        { key: 'Student.consents', label: 'Consentimientos / Autorizaciones (Student.consents)', dataType: 'string' },
        { key: 'Student.internalNotes', label: 'Notas Internas del Expediente (Student.internalNotes)', dataType: 'string' },
      ]
    },
    {
      group: 'Solicitud de Admisión (Tabla `AdmissionApplication`)',
      fields: [
        { key: 'AdmissionApplication.childName', label: 'Nombre Completo del Aspirante (childName)', dataType: 'string' },
        { key: 'AdmissionApplication.childFirstName', label: 'Nombres del Aspirante (childFirstName)', dataType: 'string' },
        { key: 'AdmissionApplication.childLastName', label: 'Apellidos del Aspirante (childLastName)', dataType: 'string' },
        { key: 'AdmissionApplication.birthDate', label: 'Fecha de Nacimiento (birthDate)', dataType: 'date' },
        { key: 'AdmissionApplication.gender', label: 'Género (gender)', dataType: 'string' },
        { key: 'AdmissionApplication.tutorName', label: 'Nombre del Tutor Principal (tutorName)', dataType: 'string' },
        { key: 'AdmissionApplication.tutorRelationship', label: 'Parentesco del Tutor (tutorRelationship)', dataType: 'string' },
        { key: 'AdmissionApplication.tutorPhone', label: 'Teléfono / WhatsApp del Tutor (tutorPhone)', dataType: 'string' },
        { key: 'AdmissionApplication.tutorEmail', label: 'Correo Electrónico del Tutor (tutorEmail)', dataType: 'string' },
        { key: 'AdmissionApplication.secondaryTutorName', label: 'Nombre Tutor Secundario (secondaryTutorName)', dataType: 'string' },
        { key: 'AdmissionApplication.secondaryTutorPhone', label: 'Teléfono Tutor Secundario (secondaryTutorPhone)', dataType: 'string' },
        { key: 'AdmissionApplication.address', label: 'Domicilio / Dirección Familiar (address)', dataType: 'string' },
        { key: 'AdmissionApplication.previousSchool', label: 'Escuela Previa (previousSchool)', dataType: 'string' },
        { key: 'AdmissionApplication.previousMethodology', label: 'Metodología Previa (previousMethodology)', dataType: 'string' },
        { key: 'AdmissionApplication.internalNotes', label: 'Notas Internas de Admisión (internalNotes)', dataType: 'string' },
      ]
    }
  ];

export interface StageAutomationCondition {
  id: string;
  type: 'ON_ENTER_STAGE' | 'ON_EXIT_STAGE' | 'FORM_SUBMITTED' | 'TIME_ELAPSED' | 'SUPERVISOR_APPROVAL' | 'ALL_FORMS_SUBMITTED' | 'ALL_DOCS_APPROVED' | 'SPECIFIC_FORM_FIELD';
  timeValue?: number;
  timeUnit?: 'HOURS' | 'DAYS' | 'WEEKS';
  supervisorRole?: 'ADMIN' | 'DIRECTOR' | 'COORDINATOR' | 'ANY_STAFF';
  formTemplateId?: string;
  fieldKey?: string;
  operator?: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IS_FILLED';
  expectedValue?: string;
}

export interface StageAutomationEvent {
  id: string;
  name: string;
  enabled: boolean;
  formTemplateId?: string;
  fieldMappings?: StageFieldMapping[];
  trigger: 'STAGE_ENTER' | 'STAGE_EXIT' | 'DOCS_COMPLETED' | 'SUPERVISOR_APPROVED' | 'MANUAL_BUTTON' | 'TIME_DELAY' | 'FORM_SUBMITTED';
  conditions: StageAutomationCondition[];
  actions: {
    sendEmail?: boolean;
    emailTemplate?: string;
    emailRecipient?: string;
    sendWhatsapp?: boolean;
    whatsappMessage?: string;
    changeStatusTo?: string;
    createStudentCard?: boolean;
    grantAccessPortal?: boolean;
    sendPaymentLink?: boolean;
    webhookUrl?: string;
  };
}

export interface AdmissionStageConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stages: AdmissionStageItem[];
  onUpdated: () => void;
  stageToEdit?: AdmissionStageItem | null;
  processId?: string;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#d97706', // Amber
  '#059669', // Emerald
  '#0d9488', // Teal
  '#1b3b2b', // Forest
  '#e11d48', // Rose
  '#475569'  // Custom Searchable Dropdown Choice Component using Radix Popover Portal
];

interface SearchableOption {
  value: string;
  label: string;
  parentLabel?: string;
  metaLabel?: string;
  sublabel?: string;
  badge?: string;
  isMetadata?: boolean;
}

interface SearchableGroup {
  group: string;
  icon?: React.ReactNode;
  fields: SearchableOption[];
}

interface SearchableChoiceSelectProps {
  value?: string;
  placeholder?: string;
  buttonLabel?: string;
  groups: SearchableGroup[];
  onSelect: (val: string) => void;
  clearOnSelect?: boolean;
  variant?: 'source' | 'target';
}

function SearchableChoiceSelect({
  value,
  placeholder = 'Seleccionar...',
  buttonLabel,
  groups,
  onSelect,
  clearOnSelect = false,
  variant = 'target'
}: SearchableChoiceSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const allOptions = groups.flatMap(g => g.fields);
  const selectedOption = allOptions.find(opt => opt.value === value);

  const term = searchTerm.toLowerCase().trim();
  const filteredGroups = groups.map(grp => ({
    ...grp,
    fields: grp.fields.filter(opt =>
      !term ||
      opt.label.toLowerCase().includes(term) ||
      (opt.parentLabel && opt.parentLabel.toLowerCase().includes(term)) ||
      (opt.metaLabel && opt.metaLabel.toLowerCase().includes(term)) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term)) ||
      opt.value.toLowerCase().includes(term) ||
      (opt.badge && opt.badge.toLowerCase().includes(term))
    )
  })).filter(grp => grp.fields.length > 0);

  const totalFilteredCount = filteredGroups.reduce((acc, g) => acc + g.fields.length, 0);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setSearchTerm('');
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`w-full p-2.5 text-left rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer border ${open
            ? 'bg-white border-forest ring-2 ring-forest/20 shadow-xs'
            : variant === 'source'
              ? 'bg-stone-50/80 border-forest/20 hover:bg-stone-100 text-forest shadow-2xs'
              : 'bg-stone-50/80 border-forest/25 hover:bg-white text-forest shadow-2xs font-bold'
            }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {variant === 'source' ? (
              <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-forest/70 shrink-0" />
            )}
            <span className={`truncate ${!selectedOption && variant !== 'source' ? 'text-muted-foreground' : ''}`}>
              {buttonLabel || (selectedOption ? (selectedOption.parentLabel ? `${selectedOption.parentLabel} ➔ ${selectedOption.metaLabel || selectedOption.label}` : selectedOption.label) : placeholder)}
            </span>
            {selectedOption?.badge && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-forest/10 text-forest shrink-0">
                {selectedOption.badge === 'date' ? 'Fecha' : selectedOption.badge === 'number' ? 'Número' : 'Texto'}
              </span>
            )}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-forest/60 transition-transform duration-200 shrink-0 ${open ? 'rotate-180 text-forest' : ''}`} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-[99999] p-0 w-[420px] sm:w-[540px] max-w-[95vw] bg-white border border-forest/25 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
      >
        <div className="p-3 border-b border-forest/10 bg-stone-50 flex items-center gap-2">
          <Search className="w-4 h-4 text-forest/60 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por nombre de campo, metadato o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-forest placeholder:text-muted-foreground/60 outline-none font-medium py-0.5"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-stone-200/60 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3 divide-y divide-forest/5">
          {totalFilteredCount === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No se encontraron campos que coincidan con <span className="font-bold text-forest">"{searchTerm}"</span>
            </div>
          ) : (
            filteredGroups.map((grp, gIdx) => (
              <div key={gIdx} className={gIdx > 0 ? 'pt-2.5' : ''}>
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-forest/80">
                    {grp.icon}
                    {grp.group}
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 font-mono">
                    {grp.fields.length}
                  </span>
                </div>

                <div className="space-y-1 mt-1">
                  {grp.fields.map((opt) => {
                    const isSelected = !clearOnSelect && opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onSelect(opt.value);
                          setOpen(false);
                          setSearchTerm('');
                        }}
                        className={`w-full p-2.5 rounded-lg text-left text-xs transition-all flex items-center justify-between gap-3 cursor-pointer border ${isSelected
                          ? 'bg-forest text-white font-bold border-forest shadow-2xs'
                          : opt.isMetadata
                            ? 'bg-emerald-50/40 hover:bg-emerald-100/60 text-slate-800 border-emerald-200/60'
                            : 'bg-white hover:bg-stone-100/80 text-slate-800 border-stone-200/70'
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          {opt.isMetadata || opt.parentLabel ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-semibold flex items-center gap-1 ${isSelected ? 'text-white/80' : 'text-slate-500'
                                  }`}>
                                  <FileText className="w-3 h-3 shrink-0" />
                                  <span>{opt.parentLabel || 'Campo Formulario'}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-300' : 'text-amber-600'
                                  }`} />
                                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-forest'
                                  }`}>
                                  {opt.metaLabel || opt.label}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold leading-tight">
                                {opt.label}
                              </div>
                              {opt.sublabel && (
                                <p className={`text-[10.5px] truncate ${isSelected ? 'text-white/80' : 'text-muted-foreground'
                                  }`}>
                                  {opt.sublabel}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {opt.badge && (
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${isSelected
                                ? 'bg-white/20 text-white'
                                : opt.isMetadata
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300/80 font-mono'
                                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                                }`}
                            >
                              {opt.badge === 'date' ? 'Fecha' : opt.badge === 'number' ? 'Número' : opt.badge}
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const AdmissionStageConfigDrawer: React.FC<AdmissionStageConfigDrawerProps> = ({
  isOpen,
  onClose,
  stages,
  onUpdated,
  stageToEdit,
  processId
}) => {
  const confirm = useConfirm();
  const [editingStage, setEditingStage] = useState<AdmissionStageItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'forms' | 'automations'>('general');

  // Available Form Templates
  const [formTemplates, setFormTemplates] = useState<AdmissionFormTemplateItem[]>([]);
  const [formsManagerOpen, setFormsManagerOpen] = useState(false);

  // General tab fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563eb');

  // Forms & Docs tab fields
  const [requiredDocsText, setRequiredDocsText] = useState('');
  const [stageForms, setStageForms] = useState<StageRequiredFormItem[]>([]);

  // List of all forms attached to this stage (pulls from stageForms and enriches with formTemplates)
  const stageAssociatedForms = React.useMemo(() => {
    const list: Array<{ id: string; title: string; category?: string; schema?: any }> = [];
    const seenIds = new Set<string>();

    // 1. Map directly from stageForms
    (stageForms || []).forEach((sf: any) => {
      const tplId = sf.formTemplateId || sf.form_template_id || sf.templateId || sf.id || (typeof sf === 'string' ? sf : '');
      if (!tplId || seenIds.has(tplId)) return;
      seenIds.add(tplId);

      const foundTpl = formTemplates.find(t => t.id === tplId);
      list.push({
        id: tplId,
        title: sf.formTitle || sf.title || foundTpl?.title || `Formulario (${tplId.substring(0, 8)})`,
        category: foundTpl?.category || sf.category || 'GENERAL',
        schema: foundTpl?.schema || sf.schema || []
      });
    });

    // 2. Also match any template in formTemplates that corresponds to stageForms
    (formTemplates || []).forEach((t) => {
      if (seenIds.has(t.id)) return;
      const isAttached = (stageForms || []).some((sf: any) => {
        const sfId = sf.formTemplateId || sf.form_template_id || sf.templateId || sf.id || (typeof sf === 'string' ? sf : '');
        return sfId === t.id;
      });
      if (isAttached) {
        seenIds.add(t.id);
        list.push({
          id: t.id,
          title: t.title,
          category: t.category || 'GENERAL',
          schema: t.schema || []
        });
      }
    });

    return list;
  }, [stageForms, formTemplates]);

  // Advanced Automations & Events
  const [automationEvents, setAutomationEvents] = useState<StageAutomationEvent[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [expandedMappingId, setExpandedMappingId] = useState<string | null>(null);

  // Built-in hooks configuration
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [notifyTutorOnEnter, setNotifyTutorOnEnter] = useState(false);
  const [requestDocsReminder, setRequestDocsReminder] = useState(false);
  const [calendarSync, setCalendarSync] = useState(false);
  const [autoGenerateEnrollmentCode, setAutoGenerateEnrollmentCode] = useState(false);

  const loadTemplates = async () => {
    try {
      const tpls = await getAdmissionFormTemplates();
      setFormTemplates(tpls);
    } catch (e) {
      console.error('Error loading form templates:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (stageToEdit) {
        startEdit(stageToEdit);
      } else {
        cancelEdit();
      }
    }
  }, [isOpen, stageToEdit]);

  const startCreateNew = () => {
    setEditingStage(null);
    setIsCreatingNew(true);
    setActiveTab('general');
    setName('');
    setDescription('');
    setColor('#4f46e5');
    setRequiredDocsText('');
    setStageForms([]);
    setAutomationEvents([]);
    setExpandedEventId(null);
    setWelcomeMessage('');
    setNotifyTutorOnEnter(true);
    setRequestDocsReminder(false);
    setCalendarSync(false);
    setAutoGenerateEnrollmentCode(false);
  };

  const startEdit = (stage: AdmissionStageItem) => {
    setIsCreatingNew(false);
    setEditingStage(stage);
    setActiveTab('general');
    setName(stage.name);
    setDescription(stage.description || '');
    setColor(stage.color || '#2563eb');
    setRequiredDocsText((stage.required_documents || []).join('\n'));
    setStageForms(Array.isArray(stage.required_forms) ? stage.required_forms : []);

    // Load custom automations if present
    const existingEvents: StageAutomationEvent[] = stage.hooks_config?.custom_automations || stage.hooks_config?.automations || [];
    setAutomationEvents(existingEvents);
    // Expand only the first rule by default, rest collapsed
    setExpandedEventId(existingEvents[0]?.id || null);

    setWelcomeMessage(stage.hooks_config?.welcomeMessage || '');
    setNotifyTutorOnEnter(!!stage.hooks_config?.notifyTutorOnEnter);
    setRequestDocsReminder(!!stage.hooks_config?.requestDocumentsReminder);
    setCalendarSync(!!stage.hooks_config?.calendarSync);
    setAutoGenerateEnrollmentCode(!!stage.hooks_config?.autoGenerateEnrollmentCode);
  };

  const cancelEdit = () => {
    setIsCreatingNew(false);
    setEditingStage(null);
    if (stageToEdit) {
      onClose();
    }
  };

  const handleAddFormToStage = (tplId: string) => {
    const tpl = formTemplates.find(t => t.id === tplId);
    if (!tpl) return;
    if (stageForms.some(f => f.formTemplateId === tpl.id)) {
      toast.info('Este formulario ya está agregado a la fase');
      return;
    }
    const newReq: StageRequiredFormItem = {
      formTemplateId: tpl.id,
      formTitle: tpl.title,
      assignedRole: tpl.category === 'INTERVIEW' ? 'INTERNAL_STAFF' : 'ANY_TUTOR',
      isMandatory: true
    };
    setStageForms([...stageForms, newReq]);
  };

  const handleRemoveFormFromStage = (tplId: string) => {
    setStageForms(stageForms.filter(f => f.formTemplateId !== tplId));
  };

  const handleUpdateStageForm = (tplId: string, updates: Partial<StageRequiredFormItem>) => {
    setStageForms(stageForms.map(f => f.formTemplateId === tplId ? { ...f, ...updates } : f));
  };

  // ================= AUTOMATION EVENT HANDLERS =================
  const handleAddAutomationEvent = (preset: 'EMAIL' | 'MAPPING' = 'MAPPING') => {
    if (preset === 'MAPPING') {
      const defaultTplObj = stageAssociatedForms[0];
      const defaultTpl = defaultTplObj?.id || stageForms[0]?.formTemplateId || '';
      const formTitle = defaultTplObj?.title || (stageForms[0] as any)?.formTitle || '';
      const newEvent: StageAutomationEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: formTitle ? `Mapeo: ${formTitle}` : 'Mapeo de Formulario a Expediente',
        enabled: true,
        trigger: 'ON_FORM_SUBMITTED',
        actionType: 'MAP_EXPEDIENTE_FIELDS',
        formTemplateId: defaultTpl,
        fieldMappings: [],
        conditionsMatch: 'ALL',
        conditions: [
          {
            id: `cond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'FORM_SUBMITTED',
            formTemplateId: defaultTpl
          }
        ]
      };
      setAutomationEvents([...automationEvents, newEvent]);
      setExpandedEventId(newEvent.id);
      toast.success('Nueva regla de mapeo añadida');
      return;
    }

    const newEvent: StageAutomationEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Notificación (${name || 'Fase'})`,
      enabled: true,
      trigger: 'ON_CONDITIONS_MET',
      actionType: 'SEND_EMAIL',
      emailTarget: 'PRIMARY_TUTOR',
      emailSubject: `Actualización de Proceso de Admisión: ${name || 'Fase'}`,
      emailBody: `Estimados tutores,\n\nLes informamos que se ha completado la etapa ${name || ''} en el proceso de admisión de {nombre_aspirante}.\n\nPueden dar seguimiento en el portal: {link_portal}`,
      conditionsMatch: 'ALL',
      conditions: [
        {
          id: `cond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'ON_ENTER_STAGE'
        }
      ]
    };
    setAutomationEvents([...automationEvents, newEvent]);
    setExpandedEventId(newEvent.id);
    toast.success('Nueva regla de automatización añadida');
  };

  const handleUpdateAutomationEvent = (eventId: string, updates: Partial<StageAutomationEvent>) => {
    setAutomationEvents(automationEvents.map(evt => evt.id === eventId ? { ...evt, ...updates } : evt));
  };

  const handleRemoveAutomationEvent = (eventId: string) => {
    const remaining = automationEvents.filter(evt => evt.id !== eventId);
    setAutomationEvents(remaining);
    if (expandedEventId === eventId) {
      setExpandedEventId(remaining[0]?.id || null);
    }
    toast.info('Regla de automatización eliminada');
  };

  const handleDuplicateAutomationEvent = (evt: StageAutomationEvent) => {
    const cloned: StageAutomationEvent = {
      ...evt,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${evt.name} (Copia)`,
      fieldMappings: evt.fieldMappings ? evt.fieldMappings.map(m => ({ ...m, id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` })) : undefined,
      conditions: evt.conditions.map(c => ({
        ...c,
        id: `cond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      }))
    };
    setAutomationEvents([...automationEvents, cloned]);
    setExpandedEventId(cloned.id);
    toast.success('Regla duplicada');
  };

  const handleAddFieldMapping = (eventId: string) => {
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    const currentMappings = targetEvt.fieldMappings || [];
    const usedTargetKeys = new Set(currentMappings.map(m => m.targetExpedienteField));

    // Find the first target field that is not already mapped in this rule
    const allTargetFields = EXPEDIENTE_TARGET_FIELDS.flatMap(g => g.fields);
    const firstAvailableTarget = allTargetFields.find(f => !usedTargetKeys.has(f.key)) || allTargetFields[0];

    const questions = getTemplateQuestions(targetEvt.formTemplateId);
    const targetDataType = firstAvailableTarget?.dataType || 'string';
    const compatibleQuestions = questions.filter(q => q.dataType === targetDataType);
    const defaultSource = compatibleQuestions[0]?.id || questions[0]?.id || '';

    const newMapping: StageFieldMapping = {
      id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      targetExpedienteField: firstAvailableTarget?.key || 'Student.fullName',
      sourceFormFieldIds: defaultSource ? [defaultSource] : [],
      formFieldId: defaultSource
    };
    handleUpdateAutomationEvent(eventId, {
      fieldMappings: [...currentMappings, newMapping]
    });
    setExpandedMappingId(newMapping.id);
  };

  const handleUpdateFieldMapping = (eventId: string, mappingId: string, updates: Partial<StageFieldMapping>) => {
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    const currentMappings = targetEvt.fieldMappings || [];
    handleUpdateAutomationEvent(eventId, {
      fieldMappings: currentMappings.map(m => m.id === mappingId ? { ...m, ...updates } : m)
    });
  };

  const handleAddSourceFieldToMapping = (eventId: string, mappingId: string, formFieldId: string) => {
    if (!formFieldId) return;
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    const currentMappings = targetEvt.fieldMappings || [];
    handleUpdateAutomationEvent(eventId, {
      fieldMappings: currentMappings.map(m => {
        if (m.id !== mappingId) return m;
        const currentSources = Array.isArray(m.sourceFormFieldIds)
          ? m.sourceFormFieldIds
          : m.formFieldId
            ? [m.formFieldId]
            : [];
        const nextSources = [...currentSources, formFieldId];
        return {
          ...m,
          sourceFormFieldIds: nextSources,
          formFieldId: nextSources[0] || ''
        };
      })
    });
  };

  const handleRemoveSourceFieldFromMapping = (eventId: string, mappingId: string, sourceIndex: number) => {
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    const currentMappings = targetEvt.fieldMappings || [];
    handleUpdateAutomationEvent(eventId, {
      fieldMappings: currentMappings.map(m => {
        if (m.id !== mappingId) return m;
        const currentSources = Array.isArray(m.sourceFormFieldIds)
          ? m.sourceFormFieldIds
          : m.formFieldId
            ? [m.formFieldId]
            : [];
        const nextSources = currentSources.filter((_, idx) => idx !== sourceIndex);
        return {
          ...m,
          sourceFormFieldIds: nextSources,
          formFieldId: nextSources[0] || ''
        };
      })
    });
  };

  const handleReorderSourceFields = (eventId: string, mappingId: string, fromIndex: number, toIndex: number) => {
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    const currentMappings = targetEvt.fieldMappings || [];
    handleUpdateAutomationEvent(eventId, {
      fieldMappings: currentMappings.map(m => {
        if (m.id !== mappingId) return m;
        const currentSources = Array.isArray(m.sourceFormFieldIds)
          ? [...m.sourceFormFieldIds]
          : m.formFieldId
            ? [m.formFieldId]
            : [];
        if (toIndex < 0 || toIndex >= currentSources.length) return m;
        const [moved] = currentSources.splice(fromIndex, 1);
        currentSources.splice(toIndex, 0, moved);
        return {
          ...m,
          sourceFormFieldIds: currentSources,
          formFieldId: currentSources[0] || ''
        };
      })
    });
  };

  const handleRemoveFieldMapping = (eventId: string, mappingId: string) => {
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    const currentMappings = targetEvt.fieldMappings || [];
    const remaining = currentMappings.filter(m => m.id !== mappingId);
    handleUpdateAutomationEvent(eventId, {
      fieldMappings: remaining
    });
    if (expandedMappingId === mappingId) {
      setExpandedMappingId(remaining[0]?.id || null);
    }
  };

  const handleAddConditionToEvent = (eventId: string) => {
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    const newCond: StageAutomationCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'SUPERVISOR_APPROVAL',
      supervisorRole: 'ADMIN'
    };
    handleUpdateAutomationEvent(eventId, {
      conditions: [...targetEvt.conditions, newCond]
    });
  };

  const handleUpdateCondition = (eventId: string, conditionId: string, updates: Partial<StageAutomationCondition>) => {
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    handleUpdateAutomationEvent(eventId, {
      conditions: targetEvt.conditions.map(c => c.id === conditionId ? { ...c, ...updates } : c)
    });
  };

  const handleRemoveCondition = (eventId: string, conditionId: string) => {
    const targetEvt = automationEvents.find(e => e.id === eventId);
    if (!targetEvt) return;
    handleUpdateAutomationEvent(eventId, {
      conditions: targetEvt.conditions.filter(c => c.id !== conditionId)
    });
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre de la etapa es obligatorio');
      return;
    }

    const docs: string[] = [];

    const isInitial = editingStage?.is_initial ?? false;
    const isFinal = editingStage?.is_final ?? false;
    const finalStageName = isInitial ? 'Proceso Iniciado' : isFinal ? 'Proceso Finalizado' : name.trim();
    const finalStageSlug = isInitial ? 'process_started' : isFinal ? 'process_completed' : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    setSubmitting(true);
    try {
      if (editingStage) {
        await updateAdmissionStage(editingStage.id, {
          name: finalStageName,
          slug: finalStageSlug,
          description: description.trim(),
          color,
          isInitial,
          isFinal,
          isTerminalRejected: false,
          requiredDocuments: docs,
          requiredForms: stageForms,
          hooksConfig: {
            welcomeMessage: welcomeMessage.trim() || undefined,
            notifyTutorOnEnter,
            requestDocumentsReminder: requestDocsReminder,
            calendarSync,
            autoGenerateEnrollmentCode,
            custom_automations: automationEvents
          }
        });
        toast.success('Fase del proceso actualizada');
      } else {
        // Create new intermediate stage
        await createAdmissionStage({
          name: finalStageName,
          slug: finalStageSlug,
          description: description.trim(),
          color,
          isInitial: false,
          isFinal: false,
          isTerminalRejected: false,
          requiredDocuments: docs,
          requiredForms: stageForms,
          hooksConfig: {
            notifyTutorOnEnter,
            requestDocumentsReminder: requestDocsReminder,
            calendarSync,
            custom_automations: automationEvents
          },
          processId
        });
        toast.success('Nueva etapa intermedia agregada al pipeline');
      }
      if (stageToEdit) {
        onClose();
      } else {
        cancelEdit();
      }
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar etapa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIntermediateStage = async (stage: AdmissionStageItem) => {
    if (stage.is_initial || stage.is_final) {
      toast.error('Las fases inicial y final no pueden ser eliminadas');
      return;
    }

    const ok = await confirm({
      title: '¿Eliminar fase intermedia?',
      description: `¿Estás seguro de eliminar la fase "${stage.name}"? Los aspirantes que se encuentren en esta fase pasarán a la etapa previa.`,
      confirmText: 'Sí, eliminar fase',
      variant: 'danger'
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      await deleteAdmissionStage(stage.id);
      toast.success('Etapa intermedia eliminada');
      if (editingStage?.id === stage.id) cancelEdit();
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar etapa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveIntermediateOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 1 || targetIndex > stages.length - 2) return;

    const newStages = [...stages];
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    const stageOrders = newStages.map((s, idx) => ({ id: s.id, orderIndex: idx }));
    try {
      await reorderAdmissionStages(stageOrders);
      toast.success('Orden de fases intermedias actualizado');
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Error al reordenar');
    }
  };

  // Helper to get questions and RENAPO/CURP metadata from template for condition and mapping dropdowns
  const getTemplateQuestions = (tplId?: string) => {
    if (!tplId) return [];
    let tpl: any = stageAssociatedForms.find(t => t.id === tplId) || formTemplates.find(t => t.id === tplId);
    if (!tpl || !tpl.schema || (Array.isArray(tpl.schema) && tpl.schema.length === 0)) {
      const sf = (stageForms || []).find((f: any) => {
        const sfId = f.formTemplateId || f.form_template_id || f.templateId || f.id || (typeof f === 'string' ? f : '');
        return sfId === tplId;
      });
      if (sf && (sf as any).schema) {
        tpl = { id: tplId, title: sf.formTitle, schema: (sf as any).schema };
      }
    }
    if (!tpl || !tpl.schema) return [];
    try {
      const parsed = typeof tpl.schema === 'string' ? JSON.parse(tpl.schema) : tpl.schema;
      const questions: Array<{
        id: string;
        label: string;
        type: string;
        dataType: 'string' | 'date' | 'number';
        isMetadata?: boolean;
      }> = [];
      const sections = Array.isArray(parsed) ? parsed : Array.isArray(parsed.sections) ? parsed.sections : [];

      const processField = (f: any, secTitle?: string) => {
        const fLabel = f.label || f.name || f.id;
        const displayLabel = `${fLabel}${secTitle ? ` (${secTitle})` : ''}`;
        const isCurp = f.type === 'curp' || f.verifyCurp;

        // Base field item
        const baseDataType: 'string' | 'date' | 'number' = f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'string';
        questions.push({
          id: f.id,
          label: displayLabel,
          type: f.type || 'text',
          dataType: baseDataType,
          isMetadata: false
        });

        // If field is CURP (generates official RENAPO and demographic metadata)
        if (isCurp) {
          questions.push(
            { id: `${f.id}:nombreCompleto`, label: `Nombre Completo Oficial (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Nombre Completo Oficial`, type: 'curp_meta', dataType: 'string', isMetadata: true } as any,
            { id: `${f.id}:nombre`, label: `Primer Nombre / Nombres (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Nombre(s)`, type: 'curp_meta', dataType: 'string', isMetadata: true } as any,
            { id: `${f.id}:apellidoPaterno`, label: `Primer Apellido Paterno (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Primer Apellido (Paterno)`, type: 'curp_meta', dataType: 'string', isMetadata: true } as any,
            { id: `${f.id}:apellidoMaterno`, label: `Segundo Apellido Materno (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Segundo Apellido (Materno)`, type: 'curp_meta', dataType: 'string', isMetadata: true } as any,
            { id: `${f.id}:fechaNacimientoIso`, label: `Fecha de Nacimiento ISO (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Fecha de Nacimiento (ISO AAAA-MM-DD)`, type: 'curp_meta', dataType: 'date', isMetadata: true } as any,
            { id: `${f.id}:fechaNacimiento`, label: `Fecha de Nacimiento DD/MM/AAAA (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Fecha de Nacimiento (DD/MM/AAAA)`, type: 'curp_meta', dataType: 'string', isMetadata: true } as any,
            { id: `${f.id}:edad`, label: `Edad Calculada en Años (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Edad en Años`, type: 'curp_meta', dataType: 'number', isMetadata: true } as any,
            { id: `${f.id}:sexo`, label: `Sexo / Género (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Sexo / Género (HOMBRE / MUJER)`, type: 'curp_meta', dataType: 'string', isMetadata: true } as any,
            { id: `${f.id}:estadoNacimiento`, label: `Entidad Federativa de Nacimiento (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Entidad Federativa de Nacimiento`, type: 'curp_meta', dataType: 'string', isMetadata: true } as any,
            { id: `${f.id}:documentoProbatorio`, label: `Datos de Acta de Nacimiento / Folio (RENAPO)`, parentLabel: `Campo: ${fLabel}`, metaLabel: `Datos Acta de Nacimiento / Folio`, type: 'curp_meta', dataType: 'string', isMetadata: true } as any
          );
        }
      };

      if (sections.length > 0) {
        sections.forEach((section: any) => {
          if (Array.isArray(section.fields)) {
            section.fields.forEach((f: any) => processField(f, section.title));
          }
        });
      } else if (Array.isArray(parsed.fields)) {
        parsed.fields.forEach((f: any) => processField(f));
      }
      return questions;
    } catch {
      return [];
    }
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingStage
          ? `Configurar Fase: ${editingStage.name}`
          : isCreatingNew
            ? "Crear Nueva Fase Intermedia"
            : stageToEdit
              ? `Configurar Fase: ${stageToEdit.name}`
              : "Configurador del Proceso de Admisión"
      }
      description={
        (editingStage || isCreatingNew || stageToEdit)
          ? "Edita el nombre, descripción, formularios requeridos y reglas de automatización de esta fase."
          : "Personaliza las fases intermedias del pipeline, requisitos de formularios y automatizaciones."
      }
      icon={<Workflow className="w-5 h-5 text-forest" />}
      maxWidthClass="max-w-xl lg:max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={stageToEdit ? onClose : cancelEdit}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-lg transition-colors cursor-pointer"
          >
            {isCreatingNew || editingStage ? 'Cancelar' : 'Cerrar'}
          </button>

          {(isCreatingNew || editingStage) ? (
            <button
              type="submit"
              form="stage-config-form"
              disabled={submitting}
              className="px-6 py-2 bg-forest hover:bg-forest/90 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Guardando...' : (editingStage ? 'Guardar Cambios' : 'Crear Fase')}</span>
            </button>
          ) : !stageToEdit && (
            <button
              type="button"
              onClick={startCreateNew}
              className="px-4 py-2 bg-forest hover:bg-forest/90 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Fase Intermedia</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6 pb-6 text-xs text-foreground">

        {/* EDIT / CREATE FORM WITH TABS (Rendered directly in drawer) */}
        {(isCreatingNew || editingStage) && (
          <form id="stage-config-form" onSubmit={handleSaveStage} className="space-y-5 animate-in fade-in">

            {/* Top Navigation Back Button when in wizard mode */}
            {!stageToEdit && (
              <div className="flex items-center justify-between border-b border-forest/10 pb-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs font-bold text-forest hover:text-forest/80 flex items-center gap-1.5 cursor-pointer py-1 px-2.5 hover:bg-forest/5 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a la lista de fases</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-2xs" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-xs text-muted-foreground">
                    {isCreatingNew ? 'Nueva Fase' : editingStage?.name}
                  </span>
                </div>
              </div>
            )}

            {/* Position & i18n Note for initial/final stages */}
            {editingStage?.is_initial && (
              <div className="p-3 bg-blue-50/80 border border-blue-200/60 rounded-lg text-blue-900 flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed space-y-1">
                  <div>
                    <strong>Fase Inicial del Sistema (Inmutable):</strong> Entrada oficial de todos los prospectos. El nombre y slug están fijados para internacionalización (i18n).
                  </div>
                  <div className="font-mono text-[10px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md inline-block">
                    slug: process_started
                  </div>
                </div>
              </div>
            )}

            {editingStage?.is_final && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-lg text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed space-y-1">
                  <div>
                    <strong>Fase Final del Sistema (Inmutable):</strong> Representa el egreso exitoso y la formalización de matrícula del aspirante.
                  </div>
                  <div className="font-mono text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block">
                    slug: process_completed
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION TABS */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-lg border border-forest/10 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'general'
                  ? 'bg-forest text-white shadow-2xs'
                  : 'text-forest/70 hover:text-forest hover:bg-forest/5'
                  }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>General</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('forms')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'forms'
                  ? 'bg-forest text-white shadow-2xs'
                  : 'text-forest/70 hover:text-forest hover:bg-forest/5'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Formularios</span>
                {stageForms.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'forms' ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'
                    }`}>
                    {stageForms.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('automations')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'automations'
                  ? 'bg-forest text-white shadow-2xs'
                  : 'text-forest/70 hover:text-forest hover:bg-forest/5'
                  }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Automatización</span>
                {automationEvents.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'automations' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-900 font-extrabold'
                    }`}>
                    {automationEvents.length}
                  </span>
                )}
              </button>
            </div>

            {/* ================= TAB 1: GENERAL ================= */}
            {activeTab === 'general' && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {/* Stage Name */}
                <div>
                  <label className="block text-forest font-semibold mb-1">Nombre de la Fase *</label>
                  <input
                    type="text"
                    required
                    disabled={editingStage?.is_initial || editingStage?.is_final}
                    placeholder="Ej. Entrevista Familiar, Evaluación Inicial, etc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-forest/20 text-forest bg-white text-xs focus:ring-1 focus:ring-forest/30 focus:border-forest/40 focus:outline-none disabled:bg-slate-100 disabled:opacity-70"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-forest font-semibold mb-1">Descripción / Propósito</label>
                  <textarea
                    rows={3}
                    placeholder="Describe qué ocurre durante esta fase del proceso..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-forest/20 text-forest bg-white text-xs focus:ring-1 focus:ring-forest/30 focus:border-forest/40 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Custom Welcome Message for Public Admission Portal (ONLY IN INITIAL STAGE) */}
                {editingStage?.is_initial && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-forest font-bold">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs">Mensaje de Bienvenida al Portal de Admisión (Familias)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Este mensaje cálido se presentará a los padres o tutores apenas ingresen a su enlace de admisión pública, antes de mostrar los formularios o requisitos.
                    </p>
                    <textarea
                      rows={5}
                      placeholder="Ej. # ¡Bienvenidos a {{escuela}}!&#10;&#10;Estimado(a) **{{tutor}}**, nos llena de alegría recibir la postulación de **{{estudiante}}** para integrarse a nuestra comunidad en el ambiente **{{ambiente}}**..."
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="w-full p-3 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:ring-2 focus:ring-forest/20 focus:border-forest focus:outline-none leading-relaxed shadow-2xs font-mono"
                    />

                    {/* Variables Disponibles para Inyectar */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-forest uppercase tracking-wider block">
                        Variables dinámicas (haz clic para insertar):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { tag: '{{nombre_completo_estudiante}}', label: 'Nombre Completo del Niño(a)', example: 'Sofía María Morales Gómez' },
                          { tag: '{{solo_nombres_estudiante}}', label: 'Solo Nombres (Sin apellidos)', example: 'Sofía María' },
                          { tag: '{{escuela}}', label: 'Nombre del Colegio', example: 'Ceiba Montessori' },
                          { tag: '{{tutor}}', label: 'Nombre del Tutor', example: 'Carlos Morales' },
                          { tag: '{{ambiente}}', label: 'Ambiente Solicitado', example: 'Casa de Niños' },
                          { tag: '{{email_tutor}}', label: 'Email del Tutor', example: 'familia@ejemplo.com' }
                        ].map((v) => (
                          <button
                            key={v.tag}
                            type="button"
                            onClick={() => {
                              setWelcomeMessage((prev) => prev ? `${prev} ${v.tag}` : v.tag);
                              toast.info(`Variable ${v.tag} insertada en el mensaje`);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-forest/15 hover:border-forest/40 hover:bg-forest/5 text-forest text-[11px] font-mono shadow-2xs transition-all cursor-pointer group"
                            title={`Insertar ${v.label} (Ej: ${v.example})`}
                          >
                            <span className="font-bold text-forest group-hover:text-emerald-700">{v.tag}</span>
                            <span className="text-[10px] text-muted-foreground font-sans">• {v.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                <div>
                  <label className="block text-forest font-semibold mb-1.5">Color Identificador</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-lg transition-all shadow-2xs cursor-pointer flex items-center justify-center ${color === c ? 'ring-2 ring-forest ring-offset-2 scale-110' : 'hover:scale-105 opacity-80'
                          }`}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2 border-l border-forest/15 pl-3">
                      <span className="text-[11px] text-muted-foreground font-mono">Custom:</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-forest/20 p-0.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: FORMS ================= */}
            {activeTab === 'forms' && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {/* Stage Dynamic Forms */}
                <div className="bg-white p-3.5 rounded-lg border border-forest/15 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-forest/10">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-forest" />
                      <span className="font-bold text-forest text-xs">Formularios Dinámicos Requeridos ({stageForms.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormsManagerOpen(true)}
                      className="text-[11px] font-bold text-forest hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Gestor de Plantillas</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {stageForms.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground/70 bg-forest/5 rounded-lg border border-dashed border-forest/15">
                        No hay formularios asignados a esta fase.
                      </div>
                    ) : (
                      stageForms.map((sf) => (
                        <div
                          key={sf.formTemplateId}
                          className="p-3 bg-forest/5 rounded-lg border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="font-bold text-forest text-xs truncate">{sf.formTitle}</div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>Asignado a: <strong>{sf.assignedRole === 'INTERNAL_STAFF' ? 'Personal Interno' : sf.assignedRole === 'PRIMARY_TUTOR' ? 'Tutor Principal' : 'Cualquier Tutor'}</strong></span>
                              <span>•</span>
                              <span className={sf.isMandatory ? 'text-amber-800 font-bold' : 'text-slate-500'}>
                                {sf.isMandatory ? 'Obligatorio' : 'Opcional'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <select
                              value={sf.assignedRole}
                              onChange={(e) => handleUpdateStageForm(sf.formTemplateId, { assignedRole: e.target.value as any })}
                              className="bg-white border border-forest/20 rounded-lg px-2 py-1 text-[11px] text-forest font-semibold"
                            >
                              <option value="ANY_TUTOR">Cualquier Tutor</option>
                              <option value="PRIMARY_TUTOR">Tutor Principal</option>
                              <option value="SECONDARY_TUTOR">Tutor Secundario</option>
                              <option value="INTERNAL_STAFF">Personal Interno / Guía</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleUpdateStageForm(sf.formTemplateId, { isMandatory: !sf.isMandatory })}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${sf.isMandatory ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                              {sf.isMandatory ? 'Obligatorio' : 'Opcional'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveFormFromStage(sf.formTemplateId)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Quitar formulario de la fase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add form selector */}
                  {formTemplates.filter(t => !stageForms.some(sf => sf.formTemplateId === t.id)).length > 0 && (
                    <div className="pt-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddFormToStage(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="w-full bg-white border border-forest/20 rounded-lg px-3 py-2 text-xs text-forest font-bold focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
                      >
                        <option value="" disabled>+ Asignar un Formulario a esta Fase...</option>
                        {formTemplates
                          .filter(t => !stageForms.some(sf => sf.formTemplateId === t.id))
                          .map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.category})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB 3: AUTOMATION ================= */}
            {activeTab === 'automations' && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {/* Header & Add Rule buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                  <div>
                    <h5 className="font-bold text-forest text-xs flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Motor de Automatización de Fase</span>
                    </h5>
                    <p className="text-[11px] text-muted-foreground">
                      Mapea datos de formularios dinámicos al expediente o dispara correos, webhooks y avances de fase automáticos.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAddAutomationEvent('MAPPING')}
                      className="px-3 py-1.5 bg-forest hover:bg-forest/90 text-white rounded-lg font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mapear a Expediente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddAutomationEvent('EMAIL')}
                      className="px-2.5 py-1.5 bg-forest/10 hover:bg-forest/20 text-forest rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Agregar regla de email, webhook o fase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Otra Acción</span>
                    </button>
                  </div>
                </div>

                {/* Automation Rules List */}
                <div className="space-y-3">
                  {automationEvents.length === 0 ? (
                    <div className="p-6 text-center text-xs bg-white rounded-xl border border-dashed border-forest/20 space-y-3 shadow-2xs">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <div className="font-bold text-forest text-sm">No hay reglas de automatización configuradas en esta fase</div>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Puedes crear una regla para mapear automáticamente los datos capturados en formularios hacia el expediente del alumno (Nombre, CURP, Tipo de Sangre, Tutores, etc.) o disparar correos y webhooks.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAddAutomationEvent('MAPPING')}
                          className="px-4 py-2 bg-forest text-white rounded-xl font-bold text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer hover:bg-forest/90"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Mapear Formulario a Expediente</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddAutomationEvent('EMAIL')}
                          className="px-3.5 py-2 bg-forest/10 hover:bg-forest/20 text-forest rounded-xl font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Notificación por Correo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    automationEvents.map((evt, evtIdx) => {
                      const isExpanded = expandedEventId === evt.id;
                      const isMapping = evt.actionType === 'MAP_EXPEDIENTE_FIELDS';
                      const mappingCount = evt.fieldMappings?.length || 0;
                      const sourceForm = formTemplates.find(t => t.id === evt.formTemplateId);

                      return (
                        <div
                          key={evt.id}
                          className={`bg-white rounded-xl border transition-all shadow-2xs overflow-hidden ${!evt.enabled
                            ? 'border-slate-200 bg-slate-50/50 opacity-75'
                            : isExpanded
                              ? 'border-forest/40 shadow-xs ring-1 ring-forest/15'
                              : 'border-forest/20 hover:border-forest/35'
                            }`}
                        >
                          {/* ACCORDION HEADER BAR (Clickable to toggle expansion) */}
                          <div
                            onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                            className={`p-3 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer select-none transition-colors ${isExpanded ? 'bg-forest/5 border-b border-forest/10' : 'hover:bg-forest/5'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {/* Chevron indicator */}
                              <div className="w-5 h-5 rounded-md flex items-center justify-center text-forest/70 shrink-0">
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-forest font-bold' : 'text-forest/60'
                                    }`}
                                />
                              </div>

                              {/* Enabled Toggle Switch (stops propagation) */}
                              <label
                                className="relative inline-flex items-center cursor-pointer shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={evt.enabled}
                                  onChange={(e) => handleUpdateAutomationEvent(evt.id, { enabled: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-forest"></div>
                              </label>

                              {/* Title & Badges */}
                              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-forest text-xs truncate max-w-[260px] sm:max-w-none">
                                  {isMapping ? (sourceForm ? `Mapeo: ${sourceForm.title}` : evt.name || 'Mapeo de Formulario a Expediente') : (evt.name || `Regla #${evtIdx + 1}`)}
                                </span>

                                {/* Quick Summary Badge */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {isMapping ? (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-amber-600" />
                                      <span>Mapeo ({mappingCount} {mappingCount === 1 ? 'campo' : 'campos'})</span>
                                    </span>
                                  ) : evt.actionType === 'SEND_EMAIL' ? (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-800 border border-blue-500/20 text-[10px] font-bold flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-blue-600" />
                                      <span>Correo Electrónico</span>
                                    </span>
                                  ) : evt.actionType === 'WEBHOOK' ? (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-800 border border-purple-500/20 text-[10px] font-bold flex items-center gap-1">
                                      <Globe className="w-3 h-3 text-purple-600" />
                                      <span>Webhook</span>
                                    </span>
                                  ) : evt.actionType === 'ADVANCE_STAGE' ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                                      <ArrowRight className="w-3 h-3 text-emerald-600" />
                                      <span>Avanzar Fase</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-800 border border-slate-500/20 text-[10px] font-bold flex items-center gap-1">
                                      <Bell className="w-3 h-3 text-slate-600" />
                                      <span>Notificar Staff</span>
                                    </span>
                                  )}

                                  {sourceForm && (
                                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-forest/5 text-forest/80 border border-forest/10 text-[10px] font-medium truncate max-w-[160px]">
                                      📄 {sourceForm.title}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Header Actions */}
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleDuplicateAutomationEvent(evt)}
                                className="p-1.5 text-muted-foreground hover:text-forest hover:bg-forest/10 rounded-md transition-colors cursor-pointer"
                                title="Duplicar regla"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAutomationEvent(evt.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Eliminar regla"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* ACCORDION EXPANDED BODY */}
                          {isExpanded && (
                            <div className="p-3.5 sm:p-4 space-y-4 animate-in fade-in duration-150">
                              {/* Rule Name Editor (Only for general rules, auto-named for mapping) */}
                              {!isMapping && (
                                <div className="space-y-1">
                                  <label className="block text-[10.5px] font-bold text-forest/70">
                                    Nombre Identificador de la Regla
                                  </label>
                                  <input
                                    type="text"
                                    value={evt.name}
                                    onChange={(e) => handleUpdateAutomationEvent(evt.id, { name: e.target.value })}
                                    placeholder="Ej. Notificación por correo..."
                                    className="w-full p-2 bg-stone-50 border border-forest/20 rounded-lg text-xs font-bold text-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
                                  />
                                </div>
                              )}

                              {/* DEDICATED STREAMLINED VIEW FOR MAPPING RULES */}
                              {isMapping ? (
                                <div className="space-y-4">
                                  {/* Step 1: Form Selector */}
                                  <div className="p-3.5 bg-forest/5 rounded-xl border border-forest/15 space-y-2 shadow-2xs">
                                    <label className="block text-xs font-bold text-forest flex items-center gap-1.5">
                                      <FileText className="w-4 h-4 text-forest/70" />
                                      <span>1. Formulario de la Fase a Mapear</span>
                                    </label>
                                    {stageAssociatedForms.length === 0 ? (
                                      <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-lg text-amber-900 text-xs flex items-center justify-between gap-2">
                                        <span>Esta fase no tiene formularios asociados todavía.</span>
                                        <button
                                          type="button"
                                          onClick={() => setActiveTab('forms')}
                                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold cursor-pointer shrink-0"
                                        >
                                          Ir a pestaña Formularios
                                        </button>
                                      </div>
                                    ) : (
                                      <select
                                        value={evt.formTemplateId || ''}
                                        onChange={(e) => {
                                          const newFormId = e.target.value;
                                          const selectedFormTitle = stageAssociatedForms.find(t => t.id === newFormId)?.title || 'Formulario';
                                          handleUpdateAutomationEvent(evt.id, {
                                            formTemplateId: newFormId,
                                            name: `Mapeo: ${selectedFormTitle}`,
                                            conditions: [{
                                              id: `cond_${Date.now()}`,
                                              type: 'FORM_SUBMITTED',
                                              formTemplateId: newFormId
                                            }]
                                          });
                                        }}
                                        className="w-full p-2 bg-white border border-forest/20 rounded-lg text-xs font-bold text-forest cursor-pointer focus:ring-2 focus:ring-forest/20"
                                      >
                                        <option value="" disabled>-- Selecciona el formulario asociado a esta fase --</option>
                                        {stageAssociatedForms.map(t => (
                                          <option key={t.id} value={t.id}>
                                            {t.title} {t.category ? `(${t.category})` : ''}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                                      La condición es directa: se ejecuta en cuanto se envía y firma este formulario. Los campos elegidos abajo se guardarán automáticamente en el expediente oficial del alumno y sus relaciones.
                                    </p>
                                  </div>

                                  {/* Step 2: Field Mappings Builder */}
                                  {evt.formTemplateId ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                          <label className="text-xs font-bold text-forest flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            <span>2. Mapeo de Campos hacia el Expediente ({evt.fieldMappings?.length || 0})</span>
                                          </label>
                                          <span className="text-[10.5px] text-muted-foreground block">
                                            Selecciona el campo a rellenar en el expediente y agrega los campos del formulario que formarán su valor.
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleAddFieldMapping(evt.id)}
                                          className="px-3 py-1.5 bg-forest text-white rounded-lg text-xs font-bold hover:bg-forest/90 transition-all flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
                                        >
                                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                                          <span>Añadir Campo</span>
                                        </button>
                                      </div>

                                      {(!evt.fieldMappings || evt.fieldMappings.length === 0) ? (
                                        <div className="p-6 bg-stone-50/70 border border-dashed border-forest/20 rounded-xl text-center space-y-2">
                                          <p className="text-xs text-muted-foreground font-medium">
                                            No hay campos configurados para mapear en este formulario aún.
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => handleAddFieldMapping(evt.id)}
                                            className="px-3.5 py-1.5 bg-forest/10 hover:bg-forest/20 text-forest rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Configurar primer campo del expediente</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="space-y-2.5">
                                          {evt.fieldMappings.map((mapping, mapIdx) => {
                                            const isMappingExpanded = expandedMappingId === mapping.id || (expandedMappingId === null && mapIdx === 0);
                                            const questions = getTemplateQuestions(evt.formTemplateId);
                                            const targetDef = EXPEDIENTE_TARGET_FIELDS.flatMap(g => g.fields).find(f => f.key === mapping.targetExpedienteField);
                                            const targetLabel = targetDef?.label || mapping.targetExpedienteField;
                                            const targetDataType = targetDef?.dataType || 'string';
                                            const compatibleQuestions = questions.filter(q => q.dataType === targetDataType);
                                            const directFields = compatibleQuestions.filter(q => !q.isMetadata);
                                            const metadataFields = compatibleQuestions.filter(q => q.isMetadata);
                                            const sourceIds = Array.isArray(mapping.sourceFormFieldIds)
                                              ? mapping.sourceFormFieldIds
                                              : mapping.formFieldId
                                                ? [mapping.formFieldId]
                                                : [];

                                            // Filter out target fields already used in other mappings of this same rule
                                            const otherUsedTargets = new Set(
                                              (evt.fieldMappings || [])
                                                .filter(m => m.id !== mapping.id)
                                                .map(m => m.targetExpedienteField)
                                            );
                                            const availableTargetGroups = EXPEDIENTE_TARGET_FIELDS.map(grp => ({
                                              group: grp.group,
                                              fields: grp.fields.filter(f => f.key === mapping.targetExpedienteField || !otherUsedTargets.has(f.key))
                                            })).filter(grp => grp.fields.length > 0);

                                            return (
                                              <div
                                                key={mapping.id}
                                                className={`rounded-xl border transition-all shadow-2xs overflow-hidden ${isMappingExpanded
                                                  ? 'bg-stone-50/90 border-forest/30 shadow-xs'
                                                  : 'bg-white border-forest/15 hover:border-forest/30'
                                                  }`}
                                              >
                                                {/* Header / Clickable Bar for Accordion */}
                                                <div
                                                  onClick={() => setExpandedMappingId(isMappingExpanded ? '__none__' : mapping.id)}
                                                  className="p-3 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                                                >
                                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <ChevronDown
                                                      className={`w-3.5 h-3.5 text-forest/70 transition-transform duration-200 shrink-0 ${isMappingExpanded ? 'rotate-180 text-forest font-bold' : ''
                                                        }`}
                                                    />
                                                    <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                                      {mapIdx + 1}
                                                    </span>

                                                    {/* Visual Summary: Source ➔ Target */}
                                                    <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                                                      {/* Source summary */}
                                                      <span className="font-semibold text-slate-700 text-xs truncate max-w-[260px] flex items-center gap-1">
                                                        <FileText className="w-3.5 h-3.5 text-forest/60 shrink-0" />
                                                        {sourceIds.length === 0 ? (
                                                          <span className="text-rose-500 italic">Sin origen</span>
                                                        ) : (
                                                          sourceIds.map(s => {
                                                            const q = questions.find(item => item.id === s);
                                                            return q ? (q as any).metaLabel || q.label.split('➔')[1]?.trim() || q.label.split('(')[0]?.trim() || q.label : s;
                                                          }).join(' + ')
                                                        )}
                                                      </span>

                                                      {/* Flow Arrow */}
                                                      <ArrowRight className="w-3.5 h-3.5 text-forest/40 shrink-0" />

                                                      {/* Target summary */}
                                                      <span className="font-bold text-forest text-xs truncate max-w-[220px]">
                                                        {targetLabel}
                                                      </span>

                                                      {/* Type Badge */}
                                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-forest/5 text-forest/70 border border-forest/10">
                                                        {targetDataType === 'date' ? 'Fecha' : targetDataType === 'number' ? 'Numérico' : 'Texto'}
                                                      </span>
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleRemoveFieldMapping(evt.id, mapping.id)}
                                                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                                                      title="Eliminar este mapeo"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Expanded Accordion Body (Desktop vertical layout: Source above, Target below) */}
                                                {isMappingExpanded && (
                                                  <div className="px-3.5 pb-3.5 pt-2 border-t border-forest/10 animate-in fade-in duration-150">
                                                    <div className="flex flex-col gap-2.5">
                                                      {/* Source Form Fields */}
                                                      <div className="space-y-2.5 p-3 bg-white rounded-xl border border-forest/15 shadow-2xs">
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-1.5">
                                                            <span className="w-4 h-4 rounded bg-forest/10 text-forest text-[10px] font-black flex items-center justify-center">1</span>
                                                            <label className="block text-xs font-bold text-forest">
                                                              Origen: Campos del Formulario
                                                            </label>
                                                          </div>
                                                          {sourceIds.length > 1 && (
                                                            <span className="text-[10px] text-amber-800 font-bold bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300/60">
                                                              {sourceIds.length} fuentes unidas
                                                            </span>
                                                          )}
                                                        </div>

                                                        {/* Chips */}
                                                        <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
                                                          {sourceIds.length === 0 ? (
                                                            <span className="text-xs text-rose-600 italic">
                                                              ⚠️ Ningún campo seleccionado. Agrega al menos uno abajo.
                                                            </span>
                                                          ) : (
                                                            sourceIds.map((sfId, sIdx) => {
                                                              const qItem = questions.find(q => q.id === sfId);
                                                              const isRenapoMeta = sfId.includes(':') || (qItem as any)?.isMetadata;
                                                              const chipParent = (qItem as any)?.parentLabel ? (qItem as any).parentLabel.replace(/^Campo:\s*/, '') : '';
                                                              const chipMeta = (qItem as any)?.metaLabel || (qItem?.label || sfId);

                                                              return (
                                                                <div
                                                                  key={`${mapping.id}_src_${sIdx}`}
                                                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs border ${isRenapoMeta
                                                                    ? 'bg-emerald-55 text-emerald-950 border-emerald-300/80'
                                                                    : 'bg-stone-50 text-forest border-forest/20'
                                                                    }`}
                                                                >
                                                                  <span className={`w-4 h-4 rounded-full text-[9.5px] font-black flex items-center justify-center shrink-0 ${isRenapoMeta ? 'bg-emerald-200 text-emerald-900' : 'bg-forest/10 text-forest'}`}>
                                                                    {sIdx + 1}
                                                                  </span>
                                                                  <div className="flex flex-col min-w-0 pr-1">
                                                                    {chipParent && (
                                                                      <span className="text-[9.5px] text-emerald-700 font-normal leading-tight truncate max-w-[240px]">
                                                                        {chipParent}
                                                                      </span>
                                                                    )}
                                                                    <span className="font-bold text-xs leading-tight truncate max-w-[280px]" title={chipMeta}>
                                                                      {chipMeta}
                                                                    </span>
                                                                  </div>

                                                                  {/* Reorder Buttons */}
                                                                  {sourceIds.length > 1 && (
                                                                    <div className="flex items-center gap-0.5 ml-1">
                                                                      {sIdx > 0 && (
                                                                        <button
                                                                          type="button"
                                                                          onClick={() => handleReorderSourceFields(evt.id, mapping.id, sIdx, sIdx - 1)}
                                                                          className="p-0.5 text-forest/60 hover:text-forest hover:bg-forest/10 rounded cursor-pointer"
                                                                          title="Mover antes"
                                                                        >
                                                                          <ArrowLeft className="w-3 h-3" />
                                                                        </button>
                                                                      )}
                                                                      {sIdx < sourceIds.length - 1 && (
                                                                        <button
                                                                          type="button"
                                                                          onClick={() => handleReorderSourceFields(evt.id, mapping.id, sIdx, sIdx + 1)}
                                                                          className="p-0.5 text-forest/60 hover:text-forest hover:bg-forest/10 rounded cursor-pointer"
                                                                          title="Mover después"
                                                                        >
                                                                          <ArrowRight className="w-3 h-3" />
                                                                        </button>
                                                                      )}
                                                                    </div>
                                                                  )}

                                                                  <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveSourceFieldFromMapping(evt.id, mapping.id, sIdx)}
                                                                    className="p-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer ml-0.5"
                                                                    title="Quitar campo"
                                                                  >
                                                                    <X className="w-3 h-3" />
                                                                  </button>
                                                                </div>
                                                              );
                                                            })
                                                          )}
                                                        </div>

                                                        {/* Add question searchable choice */}
                                                        <div className="pt-1">
                                                          <SearchableChoiceSelect
                                                            placeholder={sourceIds.length > 0 ? "Concatenar otra fuente..." : `Agregar ${targetDataType === 'date' ? 'campo o metadato de fecha' : targetDataType === 'number' ? 'campo numérico' : 'campo de texto o metadato'}...`}
                                                            buttonLabel={sourceIds.length > 0 ? "Concatenar otra fuente" : `Agregar ${targetDataType === 'date' ? 'campo de fecha' : targetDataType === 'number' ? 'campo numérico' : 'campo de texto o metadato'}...`}
                                                            clearOnSelect={true}
                                                            variant="source"
                                                            groups={[
                                                              ...(directFields.length > 0 ? [{
                                                                group: 'Campos Directos del Formulario',
                                                                icon: <FileText className="w-3.5 h-3.5 text-forest/70" />,
                                                                fields: directFields.map(q => ({
                                                                  value: q.id,
                                                                  label: q.label,
                                                                  sublabel: `Tipo: ${q.type}`,
                                                                  badge: q.dataType,
                                                                  isMetadata: false
                                                                }))
                                                              }] : []),
                                                              ...(metadataFields.length > 0 ? [{
                                                                group: '✨ Metadatos Verificados RENAPO / CURP',
                                                                icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
                                                                fields: metadataFields.map(q => ({
                                                                  value: q.id,
                                                                  label: q.label,
                                                                  parentLabel: (q as any).parentLabel,
                                                                  metaLabel: (q as any).metaLabel,
                                                                  sublabel: 'Extracción oficial RENAPO',
                                                                  badge: q.dataType,
                                                                  isMetadata: true
                                                                }))
                                                              }] : [])
                                                            ]}
                                                            onSelect={(val) => {
                                                              if (val) {
                                                                handleAddSourceFieldToMapping(evt.id, mapping.id, val);
                                                              }
                                                            }}
                                                          />
                                                          {sourceIds.length > 0 && (
                                                            <p className="text-[10.5px] text-muted-foreground mt-1.5 leading-normal">
                                                              Al concatenar varios valores se arma un único valor en forma de cadena separada por espacios para rellenar el campo de destino.
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>

                                                      {/* CENTER CONNECTOR ARROW (Stacked) */}
                                                      <div className="flex items-center justify-center text-forest/40 py-0.5">
                                                        <ArrowDown className="w-4 h-4 text-forest/40" />
                                                      </div>

                                                      {/* Target Expediente Field */}
                                                      <div className="space-y-2.5 p-3 bg-white rounded-xl border border-forest/15 shadow-2xs">
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-1.5">
                                                            <span className="w-4 h-4 rounded bg-forest text-white text-[10px] font-black flex items-center justify-center">2</span>
                                                            <label className="block text-xs font-bold text-forest">
                                                              Destino: Expediente / Alumno
                                                            </label>
                                                          </div>
                                                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-forest/5 text-forest/70 border border-forest/10">
                                                            {targetDataType === 'date' ? 'Fecha' : targetDataType === 'number' ? 'Numérico' : 'Texto'}
                                                          </span>
                                                        </div>

                                                        <div>
                                                          <SearchableChoiceSelect
                                                            value={mapping.targetExpedienteField || 'Student.fullName'}
                                                            placeholder="Seleccionar campo destino en el expediente..."
                                                            clearOnSelect={false}
                                                            variant="target"
                                                            groups={availableTargetGroups.map(grp => ({
                                                              group: grp.group,
                                                              icon: <Folder className="w-3.5 h-3.5 text-forest/70" />,
                                                              fields: grp.fields.map(f => ({
                                                                value: f.key,
                                                                label: f.label,
                                                                sublabel: f.key,
                                                                badge: f.dataType,
                                                                isMetadata: false
                                                              }))
                                                            }))}
                                                            onSelect={(val) => {
                                                              if (val) {
                                                                handleUpdateFieldMapping(evt.id, mapping.id, { targetExpedienteField: val });
                                                              }
                                                            }}
                                                          />
                                                        </div>

                                                        <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                                                          Los datos de origen configurados arriba formarán el valor que se guardará en este campo.
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                      <span>Selecciona un formulario de la fase arriba para configurar los campos.</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* STANDARD RULES VIEW (EMAIL, WEBHOOK, ADVANCE STAGE, NOTIFY) */
                                <div className="space-y-4">
                                  {/* CONDICIONES DE EJECUCIÓN (SI SE CUMPLE...) */}
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <label className="block text-[11px] font-bold text-forest flex items-center gap-1.5">
                                        <Filter className="w-3.5 h-3.5 text-forest/70" />
                                        <span>Condiciones para Ejecutar (Cuándo se dispara)</span>
                                      </label>

                                      <div className="flex items-center gap-1 bg-forest/5 p-0.5 rounded-lg border border-forest/10">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateAutomationEvent(evt.id, { conditionsMatch: 'ALL' })}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${(evt.conditionsMatch || 'ALL') === 'ALL'
                                            ? 'bg-forest text-white shadow-2xs'
                                            : 'text-forest/70 hover:text-forest'
                                            }`}
                                        >
                                          Todas (Y / AND)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateAutomationEvent(evt.id, { conditionsMatch: 'ANY' })}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${evt.conditionsMatch === 'ANY'
                                            ? 'bg-forest text-white shadow-2xs'
                                            : 'text-forest/70 hover:text-forest'
                                            }`}
                                        >
                                          Al menos una (O / OR)
                                        </button>
                                      </div>
                                    </div>

                                    {/* Conditions List */}
                                    <div className="space-y-2">
                                      {evt.conditions.length === 0 ? (
                                        <div className="text-[11px] text-muted-foreground/80 italic p-2.5 bg-forest/5 rounded-md text-center border border-dashed border-forest/10">
                                          Sin condiciones adicionales (se ejecutará de forma directa al disparar el trigger).
                                        </div>
                                      ) : (
                                        evt.conditions.map((cond, condIdx) => (
                                          <div
                                            key={cond.id}
                                            className="p-2.5 bg-stone-50/90 rounded-md border border-forest/15 space-y-2 text-xs"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2 flex-1">
                                                <span className="w-4 h-4 rounded-full bg-forest/10 text-forest text-[10px] font-black flex items-center justify-center shrink-0">
                                                  {condIdx + 1}
                                                </span>
                                                <select
                                                  value={cond.type}
                                                  onChange={(e) => handleUpdateCondition(evt.id, cond.id, { type: e.target.value as any })}
                                                  className="p-1.5 bg-white border border-forest/20 rounded-md text-xs font-bold text-forest flex-1 cursor-pointer"
                                                >
                                                  <option value="ON_ENTER_STAGE">Al ingresar a esta fase</option>
                                                  <option value="ON_EXIT_STAGE">Al salir / ser promovido de esta fase</option>
                                                  <option value="FORM_SUBMITTED">Al enviar un formulario de esta fase</option>
                                                  <option value="TIME_ELAPSED">Tiempo transcurrido en la fase</option>
                                                  <option value="SUPERVISOR_APPROVAL">Visto bueno / Aprobación de supervisor</option>
                                                  <option value="ALL_FORMS_SUBMITTED">Todos los formularios de la fase completados</option>
                                                  <option value="ALL_DOCS_APPROVED">Todos los documentos requeridos aprobados</option>
                                                  <option value="SPECIFIC_FORM_FIELD">Formulario con respuesta que coincide con un valor</option>
                                                </select>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveCondition(evt.id, cond.id)}
                                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors shrink-0"
                                                title="Eliminar condición"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>

                                            {/* Condition Details */}
                                            {cond.type === 'FORM_SUBMITTED' && (
                                              <div className="space-y-1.5 pt-1 pl-6">
                                                <label className="block text-[10px] font-bold text-forest mb-0.5">Formulario que dispara la regla:</label>
                                                {stageAssociatedForms.length === 0 ? (
                                                  <div className="p-2 bg-amber-50/90 border border-amber-200/80 rounded-md text-[11px] text-amber-900 flex items-center justify-between gap-2">
                                                    <span>No hay formularios asociados a esta fase.</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => setActiveTab('forms')}
                                                      className="underline font-bold text-amber-950 hover:text-amber-800"
                                                    >
                                                      Ir a pestaña Formularios
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <select
                                                    value={cond.formTemplateId || evt.formTemplateId || ''}
                                                    onChange={(e) => {
                                                      handleUpdateCondition(evt.id, cond.id, { formTemplateId: e.target.value });
                                                      if (!evt.formTemplateId) {
                                                        handleUpdateAutomationEvent(evt.id, { formTemplateId: e.target.value });
                                                      }
                                                    }}
                                                    className="w-full p-1.5 bg-white border border-forest/20 rounded-md text-xs font-bold text-forest cursor-pointer"
                                                  >
                                                    <option value="" disabled>Selecciona el formulario de esta fase...</option>
                                                    {stageAssociatedForms.map(t => (
                                                      <option key={t.id} value={t.id}>{t.title} {t.category ? `(${t.category})` : ''}</option>
                                                    ))}
                                                  </select>
                                                )}
                                              </div>
                                            )}

                                            {cond.type === 'ON_ENTER_STAGE' && (
                                              <div className="text-[11px] text-forest/80 bg-forest/5 p-2 rounded-md pl-6 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                                                <span>Se ejecuta en el momento exacto en que el aspirante es movido a esta etapa.</span>
                                              </div>
                                            )}

                                            {cond.type === 'ON_EXIT_STAGE' && (
                                              <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-md border border-amber-200/50 pl-6 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                <span>Se ejecuta cuando el aspirante abandona o es promovido a la siguiente fase.</span>
                                              </div>
                                            )}
                                            {cond.type === 'TIME_ELAPSED' && (
                                              <div className="flex items-center gap-2 pt-1 pl-6">
                                                <span className="text-[11px] text-muted-foreground">Transcurridos:</span>
                                                <input
                                                  type="number"
                                                  min={1}
                                                  value={cond.timeValue || 1}
                                                  onChange={(e) => handleUpdateCondition(evt.id, cond.id, { timeValue: parseInt(e.target.value) || 1 })}
                                                  className="w-16 p-1 bg-white border border-forest/20 rounded-md text-xs font-bold text-forest text-center"
                                                />
                                                <select
                                                  value={cond.timeUnit || 'DAYS'}
                                                  onChange={(e) => handleUpdateCondition(evt.id, cond.id, { timeUnit: e.target.value as any })}
                                                  className="p-1 bg-white border border-forest/20 rounded-md text-xs font-semibold text-forest cursor-pointer"
                                                >
                                                  <option value="HOURS">Horas</option>
                                                  <option value="DAYS">Días</option>
                                                  <option value="WEEKS">Semanas</option>
                                                </select>
                                                <span className="text-[11px] text-muted-foreground">desde el ingreso.</span>
                                              </div>
                                            )}

                                            {cond.type === 'SUPERVISOR_APPROVAL' && (
                                              <div className="flex items-center gap-2 pt-1 pl-6">
                                                <span className="text-[11px] text-muted-foreground">Requiere aprobación de:</span>
                                                <select
                                                  value={cond.supervisorRole || 'ADMIN'}
                                                  onChange={(e) => handleUpdateCondition(evt.id, cond.id, { supervisorRole: e.target.value as any })}
                                                  className="p-1 bg-white border border-forest/20 rounded-md text-xs font-bold text-forest cursor-pointer"
                                                >
                                                  <option value="ADMIN">Administrador General</option>
                                                  <option value="DIRECTOR">Director(a) Académico</option>
                                                  <option value="COORDINATOR">Coordinador de Admisiones</option>
                                                  <option value="ANY_STAFF">Cualquier Personal Autorizado</option>
                                                </select>
                                              </div>
                                            )}

                                            {cond.type === 'ALL_FORMS_SUBMITTED' && (
                                              <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-md border border-emerald-200/50 pl-6 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Verifica automáticamente que todos los formularios obligatorios de esta fase estén enviados y firmados.</span>
                                              </div>
                                            )}

                                            {cond.type === 'ALL_DOCS_APPROVED' && (
                                              <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-md border border-emerald-200/50 pl-6 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Verifica que todos los archivos subidos al expediente digital se encuentren con estatus de Aprobado.</span>
                                              </div>
                                            )}

                                            {cond.type === 'SPECIFIC_FORM_FIELD' && (
                                              <div className="space-y-2 pt-1 pl-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                  <div>
                                                    <label className="block text-[10px] font-bold text-forest mb-0.5">Formulario</label>
                                                    <select
                                                      value={cond.formTemplateId || ''}
                                                      onChange={(e) => handleUpdateCondition(evt.id, cond.id, { formTemplateId: e.target.value, fieldKey: '' })}
                                                      className="w-full p-1 bg-white border border-forest/20 rounded-md text-xs text-forest cursor-pointer"
                                                    >
                                                      <option value="" disabled>Selecciona un formulario...</option>
                                                      {stageAssociatedForms.map(t => (
                                                        <option key={t.id} value={t.id}>{t.title}</option>
                                                      ))}
                                                    </select>
                                                  </div>

                                                  <div>
                                                    <label className="block text-[10px] font-bold text-forest mb-0.5">Campo / Pregunta</label>
                                                    <select
                                                      value={cond.fieldKey || ''}
                                                      onChange={(e) => handleUpdateCondition(evt.id, cond.id, { fieldKey: e.target.value })}
                                                      disabled={!cond.formTemplateId}
                                                      className="w-full p-1 bg-white border border-forest/20 rounded-md text-xs text-forest cursor-pointer disabled:bg-slate-100"
                                                    >
                                                      <option value="" disabled>Selecciona la pregunta...</option>
                                                      {getTemplateQuestions(cond.formTemplateId).map(q => (
                                                        <option key={q.id} value={q.id}>{q.label}</option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                  <div>
                                                    <label className="block text-[10px] font-bold text-forest mb-0.5">Operador de Validación</label>
                                                    <select
                                                      value={cond.operator || 'EQUALS'}
                                                      onChange={(e) => handleUpdateCondition(evt.id, cond.id, { operator: e.target.value as any })}
                                                      className="w-full p-1 bg-white border border-forest/20 rounded-md text-xs font-semibold text-forest cursor-pointer"
                                                    >
                                                      <option value="EQUALS">Es igual a</option>
                                                      <option value="NOT_EQUALS">Es diferente de</option>
                                                      <option value="CONTAINS">Contiene texto</option>
                                                      <option value="GREATER_THAN">Mayor que (&gt;)</option>
                                                      <option value="LESS_THAN">Menor que (&lt;)</option>
                                                      <option value="IS_FILLED">Está respondido / No vacío</option>
                                                    </select>
                                                  </div>

                                                  {cond.operator !== 'IS_FILLED' && (
                                                    <div>
                                                      <label className="block text-[10px] font-bold text-forest mb-0.5">Valor Esperado</label>
                                                      <input
                                                        type="text"
                                                        placeholder="Valor a comparar..."
                                                        value={cond.expectedValue || ''}
                                                        onChange={(e) => handleUpdateCondition(evt.id, cond.id, { expectedValue: e.target.value })}
                                                        className="w-full p-1 bg-white border border-forest/20 rounded-md text-xs text-forest"
                                                      />
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleAddConditionToEvent(evt.id)}
                                      className="px-2.5 py-1 text-[11px] font-bold text-forest hover:bg-forest/10 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Añadir Condición</span>
                                    </button>
                                  </div>

                                  {/* ACCIÓN A EJECUTAR (ENTONCES HACER...) */}
                                  <div className="border-t border-forest/10 pt-3 space-y-2.5">
                                    <div className="space-y-1">
                                      <label className="block text-[11px] font-bold text-forest flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Acción a Ejecutar (Entonces hacer...)</span>
                                      </label>
                                      <select
                                        value={evt.actionType}
                                        onChange={(e) => handleUpdateAutomationEvent(evt.id, { actionType: e.target.value as any })}
                                        className="w-full p-2 bg-forest/5 border border-forest/20 rounded-md text-xs text-forest font-bold focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
                                      >
                                        <option value="SEND_EMAIL">✉️ Enviar Correo Electrónico</option>
                                        <option value="WEBHOOK">🌐 Llamada Webhook HTTP</option>
                                        <option value="ADVANCE_STAGE">➡️ Avanzar / Mover de Fase</option>
                                        <option value="NOTIFY_STAFF">🔔 Notificación Interna a Staff</option>
                                      </select>
                                    </div>

                                    {/* Action Details Configuration */}
                                    <div className="p-3 bg-forest/5 rounded-xl border border-forest/15 space-y-2.5 text-xs">
                                      {evt.actionType === 'SEND_EMAIL' && (
                                        <div className="space-y-2.5">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                              <label className="block text-[10px] font-bold text-forest mb-0.5">Destinatario del Correo</label>
                                              <select
                                                value={evt.emailTarget || 'PRIMARY_TUTOR'}
                                                onChange={(e) => handleUpdateAutomationEvent(evt.id, { emailTarget: e.target.value as any })}
                                                className="w-full p-1.5 bg-white border border-forest/20 rounded-md text-xs text-forest font-semibold"
                                              >
                                                <option value="PRIMARY_TUTOR">Tutor Principal</option>
                                                <option value="ALL_TUTORS">Todos los Tutores Registrados</option>
                                                <option value="INTERNAL_STAFF">Personal Interno / Admisiones</option>
                                                <option value="CUSTOM">Correo Personalizado Específico</option>
                                              </select>
                                            </div>
                                            {evt.emailTarget === 'CUSTOM' && (
                                              <div>
                                                <label className="block text-[10px] font-bold text-forest mb-0.5">Dirección de Correo</label>
                                                <input
                                                  type="email"
                                                  placeholder="admisiones@escuela.com"
                                                  value={evt.emailCustomAddress || ''}
                                                  onChange={(e) => handleUpdateAutomationEvent(evt.id, { emailCustomAddress: e.target.value })}
                                                  className="w-full p-1.5 bg-white border border-forest/20 rounded-md text-xs text-forest"
                                                />
                                              </div>
                                            )}
                                          </div>

                                          <div>
                                            <label className="block text-[10px] font-bold text-forest mb-0.5">Asunto del Correo</label>
                                            <input
                                              type="text"
                                              value={evt.emailSubject || ''}
                                              onChange={(e) => handleUpdateAutomationEvent(evt.id, { emailSubject: e.target.value })}
                                              placeholder="Asunto del correo..."
                                              className="w-full p-1.5 bg-white border border-forest/20 rounded-md text-xs text-forest font-medium"
                                            />
                                          </div>

                                          <div>
                                            <div className="flex items-center justify-between mb-0.5">
                                              <label className="block text-[10px] font-bold text-forest">Cuerpo del Mensaje</label>
                                              <span className="text-[9px] text-muted-foreground font-mono">Variables: {'{nombre_aspirante}'}, {'{nombre_fase}'}, {'{link_portal}'}</span>
                                            </div>
                                            <textarea
                                              rows={3}
                                              value={evt.emailBody || ''}
                                              onChange={(e) => handleUpdateAutomationEvent(evt.id, { emailBody: e.target.value })}
                                              placeholder="Escribe el mensaje..."
                                              className="w-full p-2 bg-white border border-forest/20 rounded-md text-xs text-forest leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-forest/30"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {evt.actionType === 'WEBHOOK' && (
                                        <div className="space-y-2">
                                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                            <div className="sm:col-span-1">
                                              <label className="block text-[10px] font-bold text-forest mb-0.5">Método</label>
                                              <select
                                                value={evt.webhookMethod || 'POST'}
                                                onChange={(e) => handleUpdateAutomationEvent(evt.id, { webhookMethod: e.target.value as any })}
                                                className="w-full p-1.5 bg-white border border-forest/20 rounded-lg text-xs font-mono font-bold text-forest"
                                              >
                                                <option value="POST">POST</option>
                                                <option value="GET">GET</option>
                                                <option value="PUT">PUT</option>
                                              </select>
                                            </div>
                                            <div className="sm:col-span-3">
                                              <label className="block text-[10px] font-bold text-forest mb-0.5">URL del Endpoint</label>
                                              <input
                                                type="url"
                                                placeholder="https://api.tu-crm.com/v1/admissions/webhook"
                                                value={evt.webhookUrl || ''}
                                                onChange={(e) => handleUpdateAutomationEvent(evt.id, { webhookUrl: e.target.value })}
                                                className="w-full p-1.5 bg-white border border-forest/20 rounded-lg text-xs text-forest font-mono"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-forest mb-0.5">Payload Preset</label>
                                            <select
                                              value={evt.webhookPayloadPreset || 'FULL_EXPEDIENTE'}
                                              onChange={(e) => handleUpdateAutomationEvent(evt.id, { webhookPayloadPreset: e.target.value as any })}
                                              className="w-full p-1.5 bg-white border border-forest/20 rounded-lg text-xs text-forest"
                                            >
                                              <option value="FULL_EXPEDIENTE">Expediente Completo (Datos del Aspirante, Tutores, Documentos y Respuestas)</option>
                                              <option value="BASIC_INFO">Información Básica (ID, Nombre, Etapa, Contacto)</option>
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {evt.actionType === 'ADVANCE_STAGE' && (
                                        <div>
                                          <label className="block text-[10px] font-bold text-forest mb-1">Mover Aspirante a la Fase:</label>
                                          <select
                                            value={evt.targetStageId || ''}
                                            onChange={(e) => handleUpdateAutomationEvent(evt.id, { targetStageId: e.target.value })}
                                            className="w-full p-2 bg-white border border-forest/20 rounded-lg text-xs text-forest font-bold"
                                          >
                                            <option value="" disabled>Selecciona la fase destino...</option>
                                            {stages
                                              .filter(s => s.id !== editingStage?.id)
                                              .map(s => (
                                                <option key={s.id} value={s.id}>
                                                  {s.name} ({s.is_final ? 'Matrícula Final' : 'Fase Intermedia'})
                                                </option>
                                              ))}
                                          </select>
                                        </div>
                                      )}

                                      {evt.actionType === 'NOTIFY_STAFF' && (
                                        <div>
                                          <label className="block text-[10px] font-bold text-forest mb-0.5">Mensaje de Notificación para el Equipo</label>
                                          <input
                                            type="text"
                                            placeholder="Ej. El aspirante {nombre_aspirante} completó todos los requisitos para agendar cita."
                                            value={evt.staffNotificationText || ''}
                                            onChange={(e) => handleUpdateAutomationEvent(evt.id, { staffNotificationText: e.target.value })}
                                            className="w-full p-2 bg-white border border-forest/20 rounded-lg text-xs text-forest"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* BUILT-IN HOOKS COMPATIBILITY */}
                <div className="bg-white p-3.5 rounded-lg border border-forest/15 space-y-3 shadow-2xs mt-4">
                  <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
                    <Bell className="w-4 h-4 text-forest/70" />
                    <span className="text-xs">Opciones del Sistema para esta Etapa</span>
                  </div>



                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyTutorOnEnter}
                        onChange={(e) => setNotifyTutorOnEnter(e.target.checked)}
                        className="w-4 h-4 rounded text-forest"
                      />
                      <span className="font-semibold text-forest text-xs">
                        Notificar a los tutores por correo al entrar a esta etapa
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requestDocsReminder}
                        onChange={(e) => setRequestDocsReminder(e.target.checked)}
                        className="w-4 h-4 rounded text-forest"
                      />
                      <span className="font-semibold text-forest text-xs">
                        Enviar recordatorio automático de documentos pendientes
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calendarSync}
                        onChange={(e) => setCalendarSync(e.target.checked)}
                        className="w-4 h-4 rounded text-forest"
                      />
                      <span className="font-semibold text-forest text-xs">
                        Sincronizar y habilitar agenda de citas para esta fase
                      </span>
                    </label>

                    {editingStage?.is_final && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoGenerateEnrollmentCode}
                          onChange={(e) => setAutoGenerateEnrollmentCode(e.target.checked)}
                          className="w-4 h-4 rounded text-forest"
                        />
                        <span className="font-semibold text-emerald-800 text-xs">
                          Generar matrícula oficial y activar credenciales familiares al ingresar
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {/* PIPELINE STAGES LIST (Wizard step 1: Shown only when not editing a stage) */}
        {!stageToEdit && !isCreatingNew && !editingStage && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-forest/70" />
                <span>Flujo de Fases ({stages.length} etapas)</span>
              </h4>
            </div>

            <div className="space-y-2">
              {stages.map((stg, idx) => {
                const isInitial = idx === 0 || !!stg.is_initial;
                const isFinal = idx === stages.length - 1 || !!stg.is_final;
                const isIntermediate = !isInitial && !isFinal;

                const canMoveUp = isIntermediate && idx > 1;
                const canMoveDown = isIntermediate && idx < stages.length - 2;

                const stgEventsCount = (stg.hooks_config?.custom_automations || stg.hooks_config?.automations || []).length;

                return (
                  <div
                    key={stg.id}
                    className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isInitial
                      ? 'bg-blue-50/40 border-blue-200/60 shadow-2xs'
                      : isFinal
                        ? 'bg-emerald-50/40 border-emerald-200/60 shadow-2xs'
                        : 'bg-white border-forest/15 shadow-2xs hover:border-forest/30'
                      }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs mt-1"
                        style={{ backgroundColor: stg.color || '#1b3b2b' }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-forest text-xs truncate">{stg.name}</span>
                          {isInitial && (
                            <span className="px-2 py-0.2 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold inline-flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Entrada
                            </span>
                          )}
                          {isFinal && (
                            <span className="px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Matrícula
                            </span>
                          )}
                          {stgEventsCount > 0 && (
                            <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[9px] font-bold inline-flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-amber-600" />
                              {stgEventsCount} auto
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{stg.description || 'Sin descripción'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {/* Reorder Buttons (Only for intermediate stages) */}
                      {isIntermediate && (
                        <div className="flex items-center bg-forest/5 rounded-lg p-0.5 border border-forest/10">
                          <button
                            type="button"
                            onClick={() => handleMoveIntermediateOrder(idx, 'UP')}
                            disabled={!canMoveUp}
                            className="p-1 text-forest/70 hover:text-forest disabled:opacity-20 hover:bg-white rounded-md transition-all cursor-pointer"
                            title="Mover arriba"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveIntermediateOrder(idx, 'DOWN')}
                            disabled={!canMoveDown}
                            className="p-1 text-forest/70 hover:text-forest disabled:opacity-20 hover:bg-white rounded-md transition-all cursor-pointer"
                            title="Mover abajo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => startEdit(stg)}
                        className="px-3 py-1.5 bg-forest/10 hover:bg-forest text-forest hover:text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Configurar</span>
                      </button>

                      {/* Delete button (Only for intermediate stages) */}
                      {isIntermediate && (
                        <button
                          type="button"
                          onClick={() => handleDeleteIntermediateStage(stg)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Eliminar fase intermedia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {formsManagerOpen && (
        <AdmissionFormsManagerDrawer
          isOpen={formsManagerOpen}
          onClose={() => {
            setFormsManagerOpen(false);
            loadTemplates();
          }}
        />
      )}
    </SlideOverDrawer>
  );
};
