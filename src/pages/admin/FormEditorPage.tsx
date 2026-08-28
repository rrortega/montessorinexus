import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  Eye,
  Layers,
  MessageSquare,
  Share2,
  Plus,
  Trash2,
  Copy,
  Check,
  Type,
  Phone,
  Mail,
  AlignLeft,
  Hash,
  UploadCloud,
  PenTool,
  CheckSquare,
  Calendar,
  ToggleLeft,
  Sparkles,
  Palette,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Radio,
  FileText,
  Sliders,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  FileCheck2,
  FileEdit,
  X,
  ShieldCheck,
  Globe,
  Lock,
  UserPlus,
  KeyRound,
  Link2,
  GripVertical,
  GitBranch,
  Sun,
  Moon,
  User,
  Contact,
  Camera,
  ScanLine,
  FileImage,
  Image as ImageIcon,
  CreditCard,
  BookOpen,
  Car,
  ScanFace,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronsUpDown,
  Film,
  ShieldAlert,
  Info,
  MapPin,
  Code2,
  Printer,
  BarChart3
} from 'lucide-react';
import {
  AdmissionFormTemplateItem,
  AdmissionFormResponseItem,
  FormSectionItem,
  FormFieldItem,
  FormFieldType,
  KycDocumentVariant,
  FieldCondition,
  SingleFieldCondition,
  ConditionLogic,
  FieldConditionOperator,
  FieldInvalidationRule,
  SingleInvalidationRule,
  evaluateFieldCondition,
  evaluateFieldInvalidation,
  FormLayoutStyle,
  getAdmissionFormTemplate,
  getAdmissionFormResponses,
  markAdmissionFormResponseViewed,
  deleteAdmissionFormResponse,
  createAdmissionFormTemplate,
  updateAdmissionFormTemplate,
  getSchoolEvents,
  SchoolEventItem
} from '@/lib/sqlite';
import { getDeepstreamClient } from '@/lib/deepstream';
import { decodeCurp } from '@/lib/curpUtils';
import { ScheduleEventWidget } from '@/components/public/ScheduleEventWidget';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { AdmissionFormResponseDrawer } from '@/components/admin/AdmissionFormResponseDrawer';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { FIELD_TYPES } from '@/components/admin/AdmissionFormBuilderModal';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { TermsConsentWidget } from '@/components/public/TermsConsentWidget';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

const THEME_PALETTES = [
  { name: 'Ceiba Forest', hex: '#1b3b2b' },
  { name: 'Montessori Terra', hex: '#8c5024' },
  { name: 'Midnight Violet', hex: '#6b21a8' },
  { name: 'Ocean Blue', hex: '#0284c7' },
  { name: 'Sunset Coral', hex: '#e11d48' },
  { name: 'Emerald Mint', hex: '#059669' },
  { name: 'Deep Slate', hex: '#334155' },
  { name: 'Amber Gold', hex: '#d97706' },
];

export interface FieldPaletteItem {
  type: FormFieldType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface FieldPaletteGroup {
  id: string;
  group: string;
  items: FieldPaletteItem[];
}

export const FIELD_TYPE_GROUPS: FieldPaletteGroup[] = [
  {
    id: 'BASIC',
    group: 'Texto y Respuestas Básicas',
    items: [
      { type: 'text', label: 'Respuesta Corta', description: 'Una sola línea para nombres, cargos o respuestas breves', icon: Type },
      { type: 'fullname', label: 'Nombre y Apellidos', description: 'Estructurado con Nombre(s), Paterno y Materno', icon: User },
      { type: 'textarea', label: 'Párrafo / Texto Largo', description: 'Caja multilínea para explicaciones y motivos', icon: AlignLeft },
      { type: 'richtext', label: 'Texto Enriquecido (WYSIWYG)', description: 'Editor con negritas, listas, viñetas y formato', icon: FileEdit },
      { type: 'email', label: 'Correo Electrónico', description: 'Validación de email institucional o personal', icon: Mail },
      { type: 'phone', label: 'Teléfono Móvil', description: 'Selector de código internacional + número', icon: Phone },
      { type: 'curp', label: 'CURP Mexicano', description: 'Clave Única de Registro de Población (18 caracteres)', icon: CreditCard },
    ]
  },
  {
    id: 'NUMERIC',
    group: 'Numéricos y Escalas',
    items: [
      { type: 'integer', label: 'Número Entero', description: 'Cantidades exactas, edades o conteos', icon: Hash },
      { type: 'decimal', label: 'Número Decimal', description: 'Valores con decimales o moneda', icon: Hash },
      { type: 'range', label: 'Rango / Deslizador', description: 'Control deslizante con límites mín. y máx.', icon: Sliders },
    ]
  },
  {
    id: 'CHOICE',
    group: 'Opciones y Selección',
    items: [
      { type: 'single_choice', label: 'Opción Única (Radio)', description: 'Selección exclusiva de una única opción', icon: Radio },
      { type: 'multiple_choice', label: 'Casillas de Selección', description: 'Permite seleccionar una o más alternativas', icon: CheckSquare },
      { type: 'boolean', label: 'Aceptación (Sí / No)', description: 'Interruptor binario o confirmación', icon: ToggleLeft },
      { type: 'poll', label: 'Encuesta / Votación', description: 'Elementos con título y descripción (selección simple/múltiple)', icon: BarChart3 },
    ]
  },
  {
    id: 'ADVANCED',
    group: 'Avanzados, Biometría & Legal',
    items: [
      { type: 'identity_verification', label: 'Verificación de Identidad (KYC)', description: 'Flujo completo 3 pasos: Doc + Selfie Liveness + Face Match', icon: ShieldCheck, badge: 'KYC Biométrico' },
      { type: 'document_capture', label: 'Doc. Identidad', description: 'Captura guiada de 2 caras (INE, Pasaporte, Licencia)', icon: CreditCard, badge: 'Captura Guiada' },
      { type: 'selfie_liveness', label: 'Selfie / Prueba de Vida', description: 'Prueba biométrica facial interactiva con reto', icon: ScanFace, badge: 'Liveness IA' },
      { type: 'signature', label: 'Firma Digital (Lienzo)', description: 'Lienzo táctil para firma manuscrita con comprobación', icon: PenTool, badge: 'Firma Digital' },
      { type: 'terms_consent', label: 'Términos y Consentimiento', description: 'Lector modal de acuerdos legales + Checkbox obligatorio', icon: FileCheck2 },
      { type: 'schedule_event', label: 'Agendar Cita / Evento', description: 'Vincula un evento del calendario o agenda de citas por turnos', icon: Calendar, badge: 'Citas & Turnos' },
      { type: 'date', label: 'Fecha / Calendario', description: 'Selector de día, mes y año', icon: Calendar },
      { type: 'file_upload', label: 'Subida de Archivos', description: 'Carga de documentos PDF o imágenes adjuntas', icon: UploadCloud },
      { type: 'composite', label: 'Ficha de Contacto', description: 'Grupo estructurado reutilizable de subcampos', icon: Contact },
    ]
  }
];

export const getCurrentFieldTypeItem = (type: FormFieldType) => {
  for (const group of FIELD_TYPE_GROUPS) {
    const found = group.items.find(i => i.type === type);
    if (found) return found;
  }
  return { type, label: type, description: '', icon: Type };
};

interface FormEditorPageProps {
  templateId: string | 'new';
  onBack: () => void;
}

export const FormEditorPage: React.FC<FormEditorPageProps> = ({
  templateId,
  onBack
}) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [, setSearchParams] = useSearchParams();
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(templateId);
  const isNew = currentTemplateId === 'new';

  const [activeTab, setActiveTab] = useState<'general' | 'builder' | 'preview' | 'responses'>('general');
  const [loading, setLoading] = useState(templateId !== 'new');
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setCurrentTemplateId(templateId);
    setLoading(templateId !== 'new');
  }, [templateId]);

  // Form Basic Info
  const [title, setTitle] = useState(templateId === 'new' ? 'Nuevo Formulario' : '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<any>('GENERAL');
  const [isPublished, setIsPublished] = useState(true);
  const [layoutStyle, setLayoutStyle] = useState<FormLayoutStyle>('google_forms');
  const [themeColor, setThemeColor] = useState<string>('#1b3b2b');
  const [secondaryColor, setSecondaryColor] = useState<string>('#10b981');
  const [fieldStyle, setFieldStyle] = useState<'underlined' | 'bordered' | 'filled'>('underlined');
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'full'>('lg');
  const [shadowStyle, setShadowStyle] = useState<'none' | 'subtle' | 'medium' | 'glow'>('subtle');
  const [borderWeight, setBorderWeight] = useState<'thin' | 'medium' | 'thick'>('medium');

  // Sharing & Access Level State (Google Forms / Workspace style)
  const [showShareModal, setShowShareModal] = useState(false);
  const [accessType, setAccessType] = useState<'PUBLIC' | 'RESTRICTED_WHITELIST'>('PUBLIC');
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [allowMultipleResponses, setAllowMultipleResponses] = useState<boolean>(true);

  const [sections, setSections] = useState<FormSectionItem[]>([]);

  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [activeFieldId, setActiveFieldId] = useState<string>('');

  // Preview Simulator State (Rendered strictly according to configured layoutStyle)
  const [previewStep, setPreviewStep] = useState(0);
  const [typeformIndex, setTypeformIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  // Drag and drop reordering state
  const [draggedFieldIdx, setDraggedFieldIdx] = useState<number | null>(null);
  const [dragOverFieldIdx, setDragOverFieldIdx] = useState<number | null>(null);
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [dragOverSectionIdx, setDragOverSectionIdx] = useState<number | null>(null);
  const [draggableFieldIdx, setDraggableFieldIdx] = useState<number | null>(null);
  const [isOverDropTrash, setIsOverDropTrash] = useState(false);
  const [insertingAtIndex, setInsertingAtIndex] = useState<number | null>(null);

  // Left Palette Drawer State
  const [isPaletteDrawerOpen, setIsPaletteDrawerOpen] = useState(false);
  const [paletteTargetIndex, setPaletteTargetIndex] = useState<number | null>(null);
  const [paletteSearchQuery, setPaletteSearchQuery] = useState('');
  const [selectedPaletteCategory, setSelectedPaletteCategory] = useState<string>('ALL');

  const openPaletteDrawer = (targetIndex?: number) => {
    setPaletteTargetIndex(targetIndex !== undefined ? targetIndex : null);
    setPaletteSearchQuery('');
    setSelectedPaletteCategory('ALL');
    setIsPaletteDrawerOpen(true);
  };

  const filteredPaletteGroups = useMemo(() => {
    return FIELD_TYPE_GROUPS.map((grp) => {
      if (selectedPaletteCategory !== 'ALL' && grp.id !== selectedPaletteCategory) {
        return null;
      }
      const matchingItems = grp.items.filter((item) => {
        if (!paletteSearchQuery.trim()) return true;
        const q = paletteSearchQuery.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
        );
      });
      if (matchingItems.length === 0) return null;
      return {
        ...grp,
        items: matchingItems
      };
    }).filter(Boolean) as FieldPaletteGroup[];
  }, [paletteSearchQuery, selectedPaletteCategory]);

  // Live Form Template Object for Submissions & Previews
  const currentTemplate: AdmissionFormTemplateItem = useMemo(() => ({
    id: currentTemplateId,
    school_id: '',
    title,
    description,
    category,
    schema: sections,
    layout_style: layoutStyle,
    theme_color: themeColor,
    secondary_color: secondaryColor,
    field_style: fieldStyle,
    border_radius: borderRadius,
    shadow_style: shadowStyle,
    border_weight: borderWeight,
    access_type: accessType,
    allowed_emails: allowedEmails,
    allow_multiple_responses: allowMultipleResponses,
    allowMultipleResponses,
    is_published: isPublished,
    created_at: '',
    updated_at: ''
  }), [
    currentTemplateId,
    title,
    description,
    category,
    sections,
    layoutStyle,
    themeColor,
    secondaryColor,
    fieldStyle,
    borderRadius,
    shadowStyle,
    borderWeight,
    accessType,
    allowedEmails,
    allowMultipleResponses,
    isPublished
  ]);

  // Responses State
  const [responsesData, setResponsesData] = useState<{
    totalResponses: number;
    responses: AdmissionFormResponseItem[];
  }>({ totalResponses: 0, responses: [] });
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responseSearch, setResponseSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [isPollStatsExpanded, setIsPollStatsExpanded] = useState(false);

  // Admin Submissions Photo Preview / Lightbox State
  const [adminPreviewPhoto, setAdminPreviewPhoto] = useState<{
    url: string;
    title: string;
    fileName?: string;
    fileSize?: string;
    capturedAt?: string;
  } | null>(null);
  const [adminPreviewPdf, setAdminPreviewPdf] = useState<{
    url: string;
    title: string;
    filename: string;
  } | null>(null);
  const [adminPreviewZoom, setAdminPreviewZoom] = useState(1);
  const [adminPreviewRotation, setAdminPreviewRotation] = useState(0);

  const openAdminPhotoPreview = (photo: {
    url: string;
    title: string;
    fileName?: string;
    fileSize?: string;
    capturedAt?: string;
  }) => {
    setAdminPreviewPhoto(photo);
    setAdminPreviewZoom(1);
    setAdminPreviewRotation(0);
  };

  const handleDownloadFile = (url: string, filename: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'documento.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (!adminPreviewPhoto && !adminPreviewPdf) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAdminPreviewPhoto(null);
        setAdminPreviewPdf(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminPreviewPhoto, adminPreviewPdf]);

  // Autosave State
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const initialLoadRef = useRef(true);

  // Conditional Logic & Invalidation Panel State
  const [expandedLogicPanel, setExpandedLogicPanel] = useState<{ fieldId: string; type: 'showIf' | 'invalidateIf' } | null>(null);

  // Simulator Preview Controls (Theme & Locale)
  const [previewDarkMode, setPreviewDarkMode] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<'es' | 'en'>('es');

  // Collapsible Field Cards State (Only ONE expanded at a time, all collapsed by default)
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [showCurpMetaMap, setShowCurpMetaMap] = useState<Record<string, boolean>>({});

  const toggleFieldCollapse = (fieldId: string) => {
    setExpandedFieldId(prev => (prev === fieldId ? null : fieldId));
  };

  // Custom Field Type Dropdown State
  const [openFieldTypeDropdownId, setOpenFieldTypeDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-field-type-dropdown]')) {
        setOpenFieldTypeDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  // Horizontal Section Tabs Scroll State & Handlers
  const sectionTabsRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Top Main Header Tabs Scroll State & Handlers (General / Builder / Preview / Responses)
  const headerTabsRef = useRef<HTMLDivElement | null>(null);
  const [canScrollHeaderLeft, setCanScrollHeaderLeft] = useState(false);
  const [canScrollHeaderRight, setCanScrollHeaderRight] = useState(false);

  const checkHeaderTabsScroll = useCallback(() => {
    const el = headerTabsRef.current;
    if (!el) return;
    setCanScrollHeaderLeft(el.scrollLeft > 4);
    setCanScrollHeaderRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkHeaderTabsScroll();
    const el = headerTabsRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkHeaderTabsScroll, { passive: true });
    window.addEventListener('resize', checkHeaderTabsScroll);

    const resizeObserver = new ResizeObserver(() => {
      checkHeaderTabsScroll();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkHeaderTabsScroll);
      window.removeEventListener('resize', checkHeaderTabsScroll);
      resizeObserver.disconnect();
    };
  }, [checkHeaderTabsScroll, activeTab]);

  const scrollHeaderTabs = (direction: 'left' | 'right') => {
    const el = headerTabsRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const checkSectionTabsScroll = useCallback(() => {
    const el = sectionTabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkSectionTabsScroll();
    const el = sectionTabsRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkSectionTabsScroll);
    window.addEventListener('resize', checkSectionTabsScroll);
    return () => {
      el.removeEventListener('scroll', checkSectionTabsScroll);
      window.removeEventListener('resize', checkSectionTabsScroll);
    };
  }, [checkSectionTabsScroll, sections]);

  const scrollSectionTabs = (direction: 'left' | 'right') => {
    const el = sectionTabsRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -240 : 240;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Helper classes for visual appearance preview and simulators
  const getRadiusClass = (radius: string, type: 'button' | 'input' | 'card' = 'input') => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'sm': return type === 'button' ? 'rounded-md' : 'rounded-lg';
      case 'md': return type === 'button' ? 'rounded-lg' : 'rounded-xl';
      case 'full': return type === 'button' ? 'rounded-full' : 'rounded-3xl';
      case 'lg':
      default:
        return type === 'button' ? 'rounded-xl' : 'rounded-2xl';
    }
  };

  const getShadowClass = (shadow: string) => {
    switch (shadow) {
      case 'none': return 'shadow-none';
      case 'medium': return 'shadow-md';
      case 'glow': return 'shadow-lg shadow-forest/20 ring-1 ring-forest/10';
      case 'subtle':
      default:
        return 'shadow-2xs';
    }
  };

  const getBorderWeightClass = (weight: string) => {
    switch (weight) {
      case 'thin': return 'border';
      case 'thick': return 'border-[3px]';
      case 'medium':
      default:
        return 'border-2';
    }
  };

  const getInputStyles = (isDark = false) => {
    const radiusClass = getRadiusClass(borderRadius, 'input');
    const shadowClass = getShadowClass(shadowStyle);
    const weightClass = getBorderWeightClass(borderWeight);

    let className = '';
    let style: React.CSSProperties = {};

    if (fieldStyle === 'underlined') {
      className = `w-full bg-transparent border-b-2 py-2 px-1 text-sm sm:text-base font-medium outline-none transition-all placeholder:text-muted-foreground/40 ${isDark ? 'text-white border-slate-700 focus:border-white' : 'text-slate-900 border-slate-300 focus:border-slate-900'
        }`;
      style = { borderBottomColor: themeColor };
    } else if (fieldStyle === 'filled') {
      className = `w-full ${radiusClass} ${shadowClass} p-3 sm:p-3.5 text-sm sm:text-base font-medium outline-none transition-all placeholder:text-muted-foreground/40 border border-slate-200/80 ${isDark
        ? 'bg-slate-800/90 text-white border-slate-700 focus:bg-slate-800 focus:border-slate-500'
        : 'bg-slate-100 text-slate-900 border-slate-200 focus:bg-white focus:border-slate-400'
        }`;
    } else {
      // 'bordered'
      className = `w-full bg-white dark:bg-slate-900 ${radiusClass} ${shadowClass} ${weightClass} p-3 sm:p-3.5 text-sm sm:text-base font-medium outline-none transition-all placeholder:text-muted-foreground/40 ${isDark
        ? 'text-white border-slate-700 focus:border-slate-400'
        : 'text-slate-900 border-slate-300 focus:border-slate-800'
        }`;
      style = { borderColor: `${themeColor}60` };
    }

    return { className, style };
  };

  // Helper to list all prior fields before targetFieldId
  const getPriorFields = useCallback((targetFieldId: string) => {
    const list: Array<{ id: string; label: string; type: FormFieldType; options?: string[]; sectionTitle: string }> = [];
    let found = false;
    for (const sec of sections) {
      for (const f of sec.fields) {
        if (f.id === targetFieldId) {
          found = true;
          break;
        }
        list.push({
          id: f.id,
          label: f.label || `Pregunta (${f.type})`,
          type: f.type,
          options: f.options,
          sectionTitle: sec.title
        });
      }
      if (found) break;
    }
    return list;
  }, [sections]);

  // Load Template
  const loadTemplate = async () => {
    if (currentTemplateId === 'new') {
      setActiveSectionId(sections[0].id);
      setActiveFieldId(sections[0].fields[0].id);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const tpl = await getAdmissionFormTemplate(currentTemplateId);
      setTitle(tpl.title);
      setDescription(tpl.description || '');
      setCategory(tpl.category || 'GENERAL');
      setIsPublished(tpl.is_published);
      const activeLayout = tpl.layout_style || tpl.schema?.[0]?.layoutStyle || 'google_forms';
      const activeColor = tpl.theme_color || tpl.schema?.[0]?.themeColor || '#1b3b2b';
      const activeSecondaryColor = tpl.secondary_color || tpl.schema?.[0]?.secondaryColor || '#10b981';
      const activeFieldStyle = tpl.field_style || tpl.schema?.[0]?.fieldStyle || 'underlined';
      const activeBorderRadius = tpl.border_radius || tpl.schema?.[0]?.borderRadius || 'lg';
      const activeShadowStyle = tpl.shadow_style || tpl.schema?.[0]?.shadowStyle || 'subtle';
      const activeBorderWeight = tpl.border_weight || tpl.schema?.[0]?.borderWeight || 'medium';
      const activeAccess = tpl.access_type || tpl.schema?.[0]?.accessType || 'PUBLIC';
      const activeWhitelist = tpl.allowed_emails || tpl.schema?.[0]?.allowedEmails || [];
      const activeAllowMultiple = tpl.allow_multiple_responses !== undefined
        ? tpl.allow_multiple_responses
        : (tpl.allowMultipleResponses !== undefined
          ? tpl.allowMultipleResponses
          : (tpl.schema?.[0]?.allowMultipleResponses !== undefined
            ? tpl.schema[0].allowMultipleResponses
            : true));

      setLayoutStyle(activeLayout);
      setThemeColor(activeColor);
      setSecondaryColor(activeSecondaryColor);
      setFieldStyle(activeFieldStyle);
      setBorderRadius(activeBorderRadius);
      setShadowStyle(activeShadowStyle);
      setBorderWeight(activeBorderWeight);
      setAccessType(activeAccess);
      setAllowedEmails(activeWhitelist);
      setAllowMultipleResponses(activeAllowMultiple);

      if (tpl.schema && tpl.schema.length > 0) {
        setSections(tpl.schema);
        setActiveSectionId(tpl.schema[0].id);
        setActiveFieldId(tpl.schema[0].fields[0]?.id || '');
      }
    } catch (e: any) {
      toast.error('Error al cargar formulario');
    } finally {
      setLoading(false);
    }
  };

  // Load Responses
  const loadResponses = async () => {
    if (currentTemplateId === 'new') return;
    try {
      setResponsesLoading(true);
      const res = await getAdmissionFormResponses(currentTemplateId);
      setResponsesData({
        totalResponses: res.totalResponses,
        responses: res.responses
      });
    } catch (e: any) {
      console.warn('Error loading form responses:', e);
    } finally {
      setResponsesLoading(false);
    }
  };

  const [schoolEvents, setSchoolEvents] = useState<SchoolEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadSchoolEventsList = async () => {
    setLoadingEvents(true);
    try {
      const evts = await getSchoolEvents();
      setSchoolEvents(evts || []);
    } catch (e) {
      console.error('Error loading school events:', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadSchoolEventsList();
  }, []);

  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);

  const handleDeleteResponse = async (responseId: string, respondentName: string) => {
    if (currentTemplateId === 'new') return;

    const isConfirmed = await confirm({
      title: '¿Eliminar respuesta del formulario?',
      description: `¿Estás seguro de que deseas eliminar permanentemente la respuesta enviada por "${respondentName || 'este usuario'}"? Esta acción borrará todas sus respuestas, firmas digitales y archivos adjuntos y no se puede deshacer.`,
      confirmText: 'Sí, eliminar respuesta',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash'
    });

    if (!isConfirmed) return;

    // 1. Optimistic UI update: Remove response immediately and close drawer
    const previousResponsesData = responsesData;
    setDeletingResponseId(responseId);
    setResponsesData(prev => ({
      totalResponses: Math.max(0, prev.totalResponses - 1),
      responses: prev.responses.filter(r => r.id !== responseId)
    }));

    if (selectedSubmission?.id === responseId) {
      setSelectedSubmission(null);
    }

    try {
      // 2. Perform backend deletion in background
      await deleteAdmissionFormResponse(currentTemplateId, responseId);
      toast.success('Respuesta eliminada correctamente');
    } catch (e: any) {
      // 3. Rollback state if server request fails
      setResponsesData(previousResponsesData);
      toast.error(e.message || 'Error al eliminar la respuesta');
    } finally {
      setDeletingResponseId(null);
    }
  };

  useEffect(() => {
    loadTemplate();
    loadResponses();
  }, [currentTemplateId]);

  // Realtime Deepstream WebSockets listener for new form submissions & view status updates
  useEffect(() => {
    if (!currentTemplateId || currentTemplateId === 'new') return;

    let dsClient: any = null;
    const createdEvent = `form-submission-created:${currentTemplateId}`;
    const viewedEvent = `form-submission-viewed:${currentTemplateId}`;

    const handleNewSubmission = (payload: any) => {
      if (!payload?.submission) return;
      const newSub = payload.submission;
      setResponsesData(prev => {
        if (prev.responses.some(r => r.id === newSub.id)) return prev;
        return {
          totalResponses: prev.totalResponses + 1,
          responses: [{
            ...newSub,
            isReviewed: false,
            is_reviewed: false,
            data: newSub.data || {},
            files: newSub.files || []
          }, ...prev.responses]
        };
      });
      toast.info(`¡Nueva respuesta recibida de "${newSub.respondentName || 'un usuario'}"!`, {
        description: 'La lista se ha actualizado automáticamente en tiempo real.'
      });
    };

    const handleViewedSubmission = (payload: any) => {
      if (!payload?.responseId) return;
      setResponsesData(prev => ({
        ...prev,
        responses: prev.responses.map(r => r.id === payload.responseId ? { ...r, isReviewed: true, is_reviewed: true } : r)
      }));
    };

    try {
      dsClient = getDeepstreamClient();
      if (dsClient?.event) {
        dsClient.event.subscribe(createdEvent, handleNewSubmission);
        dsClient.event.subscribe(viewedEvent, handleViewedSubmission);
      }
    } catch (err) {
      console.warn('[DEEPSTREAM REALTIME ERROR]', err);
    }

    return () => {
      try {
        if (dsClient?.event) {
          dsClient.event.unsubscribe(createdEvent, handleNewSubmission);
          dsClient.event.unsubscribe(viewedEvent, handleViewedSubmission);
        }
      } catch { }
    };
  }, [currentTemplateId]);

  // Handler to open response and mark it as reviewed optimistically
  const handleOpenResponse = (res: FormSubmissionItem) => {
    setSelectedSubmission(res);
    if (!res.isReviewed) {
      setResponsesData(prev => ({
        ...prev,
        responses: prev.responses.map(r => r.id === res.id ? { ...r, isReviewed: true, is_reviewed: true } : r)
      }));
      if (currentTemplateId && currentTemplateId !== 'new') {
        markAdmissionFormResponseViewed(currentTemplateId, res.id).catch(err => {
          console.warn('Could not mark response as reviewed on server:', err);
        });
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'responses') {
      loadResponses();
    } else if (activeTab === 'preview') {
      setPreviewStep(0);
      setTypeformIndex(0);
    }
  }, [activeTab]);

  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0];

  // Section Handlers
  const handleAddSection = () => {
    const newSecId = `sec_${Date.now()}_${sections.length + 1}`;
    const newSec: FormSectionItem = {
      id: newSecId,
      title: `Sección ${sections.length + 1}: Nueva Sección`,
      description: 'Descripción e instrucciones de esta sección.',
      fields: []
    };
    setSections([...sections, newSec]);
    setActiveSectionId(newSecId);
    setActiveFieldId('');

    // Automatically scroll horizontal section tabs container to the far right to bring the new section into view
    setTimeout(() => {
      if (sectionTabsRef.current) {
        sectionTabsRef.current.scrollTo({
          left: sectionTabsRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }
    }, 60);

    toast.success('Nueva sección añadida');
  };

  // Helper to validate and clean up any conditions whose dependency is no longer prior to the field
  const validateAndCleanConditions = useCallback((candidateSections: FormSectionItem[]) => {
    const allLabels = new Map<string, string>();
    candidateSections.forEach(sec => {
      sec.fields.forEach(f => {
        allLabels.set(f.id, f.label || `Pregunta (${f.type})`);
      });
    });

    const seenFieldIds = new Set<string>();
    const removedList: Array<{ fieldLabel: string; refLabel: string }> = [];

    const cleanedSections = candidateSections.map(sec => {
      const cleanedFields = sec.fields.map(f => {
        if (f.condition) {
          if (Array.isArray(f.condition.rules) && f.condition.rules.length > 0) {
            const validRules: SingleFieldCondition[] = [];
            f.condition.rules.forEach(rule => {
              if (rule.dependsOnFieldId && seenFieldIds.has(rule.dependsOnFieldId)) {
                validRules.push(rule);
              } else if (rule.dependsOnFieldId) {
                const refLabel = allLabels.get(rule.dependsOnFieldId) || 'pregunta de referencia';
                removedList.push({
                  fieldLabel: f.label || `Pregunta (${f.type})`,
                  refLabel
                });
              }
            });

            if (validRules.length === 0) {
              const { condition, ...rest } = f;
              seenFieldIds.add(f.id);
              return rest;
            } else if (validRules.length !== f.condition.rules.length) {
              seenFieldIds.add(f.id);
              return {
                ...f,
                condition: {
                  ...f.condition,
                  rules: validRules,
                  dependsOnFieldId: validRules[0]?.dependsOnFieldId,
                  operator: validRules[0]?.operator,
                  value: validRules[0]?.value
                }
              };
            }
          } else if (f.condition.dependsOnFieldId) {
            if (!seenFieldIds.has(f.condition.dependsOnFieldId)) {
              const refLabel = allLabels.get(f.condition.dependsOnFieldId) || 'pregunta de referencia';
              removedList.push({
                fieldLabel: f.label || `Pregunta (${f.type})`,
                refLabel
              });
              const { condition, ...rest } = f;
              seenFieldIds.add(f.id);
              return rest;
            }
          }
        }
        seenFieldIds.add(f.id);
        return f;
      });
      return { ...sec, fields: cleanedFields };
    });

    if (removedList.length > 0) {
      removedList.forEach(item => {
        toast.warning(
          `La condición de "${item.fieldLabel}" se actualizó o eliminó porque la pregunta de referencia "${item.refLabel}" cambió de posición y ya no está antes.`,
          { duration: 6000 }
        );
      });
    }

    return cleanedSections;
  }, []);

  const handleRemoveSection = async (sectionId: string) => {
    if (sections.length <= 1) {
      toast.error('El formulario debe tener al menos una sección');
      return;
    }

    const sectionToDelete = sections.find(s => s.id === sectionId);
    const sectionTitle = sectionToDelete?.title?.trim() || 'esta sección';

    const isConfirmed = await confirm({
      title: '¿Eliminar sección?',
      description: `¿Estás seguro de que deseas eliminar la sección "${sectionTitle}" junto con todas sus preguntas asociadas? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar sección',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash'
    });

    if (!isConfirmed) return;

    const filtered = sections.filter(s => s.id !== sectionId);
    const cleaned = validateAndCleanConditions(filtered);
    setSections(cleaned);
    if (activeSectionId === sectionId) {
      setActiveSectionId(cleaned[0]?.id || '');
      setActiveFieldId(cleaned[0]?.fields[0]?.id || '');
    }
    toast.info('Sección eliminada');
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<FormSectionItem>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const handleDropSection = (targetIdx: number) => {
    if (draggedSectionIdx === null || draggedSectionIdx === targetIdx) {
      setDraggedSectionIdx(null);
      setDragOverSectionIdx(null);
      return;
    }

    const newSections = [...sections];
    const [draggedItem] = newSections.splice(draggedSectionIdx, 1);
    newSections.splice(targetIdx, 0, draggedItem);

    const cleaned = validateAndCleanConditions(newSections);
    setSections(cleaned);
    setActiveSectionId(draggedItem.id);
    setDraggedSectionIdx(null);
    setDragOverSectionIdx(null);
    toast.success(`Paso movido a la posición ${targetIdx + 1}`);
  };

  // Field Handlers
  const handleAddField = (type: FormFieldType = 'text', targetIndex?: number) => {
    if (!currentSection) return;
    const newFieldId = `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newField: FormFieldItem = {
      id: newFieldId,
      type,
      label: type === 'fullname' ? 'Nombre y Apellidos' : type === 'composite' ? 'Persona de Contacto' : type === 'range' ? 'Nivel de Satisfacción / Escala' : 'Pregunta sin título',
      helpText: type === 'fullname' ? 'Nombre(s), Apellido Paterno y Materno' : type === 'composite' ? 'Información de contacto en caso de emergencia o trámites institucionales' : type === 'range' ? 'Mueve el control para seleccionar el valor deseado' : undefined,
      required: false,
      min: type === 'range' ? 0 : undefined,
      max: type === 'range' ? 10 : undefined,
      step: type === 'range' ? 1 : undefined,
      minLabel: type === 'range' ? 'Bajo' : undefined,
      maxLabel: type === 'range' ? 'Alto' : undefined,
      unit: type === 'range' ? 'pts' : undefined,
      defaultValue: type === 'range' ? 5 : undefined,
      options: type === 'single_choice' || type === 'multiple_choice' ? ['Opción 1', 'Opción 2'] : undefined,
      pollConfig: type === 'poll' ? {
        allowMultiple: false,
        options: [
          { id: `opt_${Date.now()}_1`, title: 'Opción A', description: 'Descripción de la opción A' },
          { id: `opt_${Date.now()}_2`, title: 'Opción B', description: 'Descripción de la opción B' }
        ]
      } : undefined,
      subfields: type === 'composite' ? [
        { id: `sub_${Date.now()}_1`, type: 'text', label: 'Nombre Completo', required: true, placeholder: 'Ej. María Pérez' },
        { id: `sub_${Date.now()}_2`, type: 'phone', label: 'Teléfono Celular', required: true, placeholder: '+52 998 000 0000' },
        { id: `sub_${Date.now()}_3`, type: 'email', label: 'Correo Electrónico', required: false, placeholder: 'contacto@ejemplo.com' },
        { id: `sub_${Date.now()}_4`, type: 'single_choice', label: 'Parentesco / Relación', required: true, options: ['Madre', 'Padre', 'Tutor Legal', 'Abuelo/a', 'Tío/a', 'Familiar', 'Otro'] }
      ] : undefined
    };

    const updatedSections = sections.map(s => {
      if (s.id === currentSection.id) {
        const nextFields = [...s.fields];
        if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= nextFields.length) {
          nextFields.splice(targetIndex, 0, newField);
        } else {
          nextFields.push(newField);
        }
        return { ...s, fields: nextFields };
      }
      return s;
    });

    const cleaned = validateAndCleanConditions(updatedSections);
    setSections(cleaned);
    setActiveFieldId(newFieldId);
    setExpandedFieldId(newFieldId);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormFieldItem>) => {
    if (!currentSection) return;
    const updatedSections = sections.map(s => {
      if (s.id === currentSection.id) {
        const updatedFields = s.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
        return { ...s, fields: updatedFields };
      }
      return s;
    });
    setSections(updatedSections);
  };

  const handleRemoveField = async (fieldId: string) => {
    if (!currentSection) return;
    if (currentSection.fields.length <= 1) {
      toast.error('La sección debe tener al menos una pregunta');
      return;
    }

    const fieldToDelete = currentSection.fields.find(f => f.id === fieldId);
    const fieldLabel = fieldToDelete?.label?.trim() || 'esta pregunta';

    const isConfirmed = await confirm({
      title: '¿Eliminar pregunta?',
      description: `¿Estás seguro de que deseas eliminar la pregunta "${fieldLabel}"? Se borrará su configuración y cualquier lógica condicional que dependa de ella.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash'
    });

    if (!isConfirmed) return;

    const updatedSections = sections.map(s => {
      if (s.id === currentSection.id) {
        const updatedFields = s.fields.filter(f => f.id !== fieldId);
        return { ...s, fields: updatedFields };
      }
      return s;
    });
    const cleaned = validateAndCleanConditions(updatedSections);
    setSections(cleaned);
    toast.success('Pregunta eliminada');
  };

  const handleDuplicateField = (field: FormFieldItem, index: number) => {
    if (!currentSection) return;
    const newField: FormFieldItem = {
      ...field,
      id: `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: `${field.label} (Copia)`,
      condition: undefined // New duplicate starts without condition
    };
    const updatedFields = [...currentSection.fields];
    updatedFields.splice(index + 1, 0, newField);

    setSections(sections.map(s => s.id === currentSection.id ? { ...s, fields: updatedFields } : s));
    setActiveFieldId(newField.id);
    toast.success('Pregunta duplicada');
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!currentSection) return;
    const newFields = [...currentSection.fields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newFields.length) return;
    const temp = newFields[index];
    newFields[index] = newFields[targetIdx];
    newFields[targetIdx] = temp;
    const candidate = sections.map(s => s.id === currentSection.id ? { ...s, fields: newFields } : s);
    const cleaned = validateAndCleanConditions(candidate);
    setSections(cleaned);
  };

  const handleDropField = (targetIdx: number) => {
    if (draggedFieldIdx === null || draggedFieldIdx === targetIdx || !currentSection) {
      setDraggedFieldIdx(null);
      setDragOverFieldIdx(null);
      return;
    }

    const newFields = [...currentSection.fields];
    const [draggedItem] = newFields.splice(draggedFieldIdx, 1);
    newFields.splice(targetIdx, 0, draggedItem);

    const candidate = sections.map(s => s.id === currentSection.id ? { ...s, fields: newFields } : s);
    const cleaned = validateAndCleanConditions(candidate);
    setSections(cleaned);
    setActiveFieldId(draggedItem.id);
    setDraggedFieldIdx(null);
    setDragOverFieldIdx(null);
    toast.success(`Pregunta movida a la posición ${targetIdx + 1}`);
  };

  const handleMoveFieldToSection = (fieldIndex: number, targetSectionId: string) => {
    if (!currentSection || currentSection.id === targetSectionId) {
      setDraggedFieldIdx(null);
      setDragOverFieldIdx(null);
      setDragOverSectionIdx(null);
      return;
    }

    const fieldToMove = currentSection.fields[fieldIndex];
    if (!fieldToMove) {
      setDraggedFieldIdx(null);
      setDragOverFieldIdx(null);
      setDragOverSectionIdx(null);
      return;
    }

    // Remove field from source section and append to target section
    const newSections = sections.map(sec => {
      if (sec.id === currentSection.id) {
        return {
          ...sec,
          fields: sec.fields.filter((_, idx) => idx !== fieldIndex)
        };
      }
      if (sec.id === targetSectionId) {
        return {
          ...sec,
          fields: [...sec.fields, fieldToMove]
        };
      }
      return sec;
    });

    const cleaned = validateAndCleanConditions(newSections);
    setSections(cleaned);
    setActiveSectionId(targetSectionId);
    setActiveFieldId(fieldToMove.id);
    setDraggedFieldIdx(null);
    setDragOverFieldIdx(null);
    setDragOverSectionIdx(null);
    setDraggableFieldIdx(null);

    const targetSec = sections.find(s => s.id === targetSectionId);
    toast.success(`Campo "${fieldToMove.label || 'sin título'}" movido a "${targetSec?.title || 'la fase seleccionada'}" al final.`);
  };

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

  // Save Form Handler (Manual)
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Ingresa un título para el formulario');
      return;
    }
    if (sections.length === 0) {
      toast.error('Crea al menos una sección en el formulario antes de guardar.');
      return;
    }
    if (sections.some(s => s.fields.length === 0)) {
      toast.error('Cada sección debe contener al menos una pregunta o campo antes de guardar.');
      return;
    }

    try {
      setSaving(true);
      const sectionsWithLayout = sections.map((sec, idx) => ({
        ...sec,
        layoutStyle: idx === 0 ? layoutStyle : sec.layoutStyle,
        themeColor: idx === 0 ? themeColor : sec.themeColor,
        secondaryColor: idx === 0 ? secondaryColor : sec.secondaryColor,
        fieldStyle: idx === 0 ? fieldStyle : sec.fieldStyle,
        borderRadius: idx === 0 ? borderRadius : sec.borderRadius,
        shadowStyle: idx === 0 ? shadowStyle : sec.shadowStyle,
        borderWeight: idx === 0 ? borderWeight : sec.borderWeight,
        accessType: idx === 0 ? accessType : sec.accessType,
        allowedEmails: idx === 0 ? allowedEmails : sec.allowedEmails,
        allowMultipleResponses: idx === 0 ? allowMultipleResponses : sec.allowMultipleResponses
      }));

      if (isNew || currentTemplateId === 'new') {
        const created = await createAdmissionFormTemplate({
          title: title.trim(),
          description: description.trim(),
          category,
          schema: sectionsWithLayout,
          isPublished
        });
        setCurrentTemplateId(created.id);
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('id', created.id);
          return next;
        });
        initialLoadRef.current = false;
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHasPendingChanges(false);
        toast.success('Formulario creado y guardado con éxito. Ahora se encuentra en modo edición con autoguardado.');
      } else {
        await updateAdmissionFormTemplate(currentTemplateId, {
          title: title.trim(),
          description: description.trim(),
          category,
          schema: sectionsWithLayout,
          isPublished
        });
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHasPendingChanges(false);
        toast.success('Formulario guardado con éxito');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar formulario');
    } finally {
      setSaving(false);
    }
  };

  // Background Autosave Handler (Active ONLY in edit mode, disabled on brand new forms)
  const handleAutoSave = useCallback(async () => {
    if (isNew || currentTemplateId === 'new') return; // NEVER autosave new forms before first explicit save!
    if (loading || initialLoadRef.current) return;
    if (!title.trim() || sections.length === 0 || sections.some(s => s.fields.length === 0)) return;

    try {
      setAutoSaving(true);
      const sectionsWithLayout = sections.map((sec, idx) => ({
        ...sec,
        layoutStyle: idx === 0 ? layoutStyle : sec.layoutStyle,
        themeColor: idx === 0 ? themeColor : sec.themeColor,
        secondaryColor: idx === 0 ? secondaryColor : sec.secondaryColor,
        fieldStyle: idx === 0 ? fieldStyle : sec.fieldStyle,
        borderRadius: idx === 0 ? borderRadius : sec.borderRadius,
        shadowStyle: idx === 0 ? shadowStyle : sec.shadowStyle,
        borderWeight: idx === 0 ? borderWeight : sec.borderWeight,
        accessType: idx === 0 ? accessType : sec.accessType,
        allowedEmails: idx === 0 ? allowedEmails : sec.allowedEmails,
        allowMultipleResponses: idx === 0 ? allowMultipleResponses : sec.allowMultipleResponses
      }));

      await updateAdmissionFormTemplate(currentTemplateId, {
        title: title.trim(),
        description: description.trim(),
        category,
        schema: sectionsWithLayout,
        isPublished
      });

      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setHasPendingChanges(false);
    } catch (e) {
      console.warn('Autosave background warning:', e);
    } finally {
      setAutoSaving(false);
    }
  }, [isNew, currentTemplateId, loading, title, description, category, sections, isPublished, allowMultipleResponses, layoutStyle, themeColor, secondaryColor, fieldStyle, borderRadius, shadowStyle, borderWeight, accessType, allowedEmails]);

  // Effect to trigger debounced autosave when form changes (Only in edit mode)
  useEffect(() => {
    if (isNew || currentTemplateId === 'new') return; // Do NOT autosave new forms

    if (initialLoadRef.current) {
      if (!loading) {
        const timer = setTimeout(() => {
          initialLoadRef.current = false;
        }, 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    setHasPendingChanges(true);
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 1500);

    return () => clearTimeout(timer);
  }, [isNew, currentTemplateId, title, description, category, sections, isPublished, allowMultipleResponses, layoutStyle, themeColor, secondaryColor, fieldStyle, borderRadius, shadowStyle, borderWeight, accessType, allowedEmails, handleAutoSave, loading]);

  const handleCopyPublicLink = () => {
    const url = `${window.location.origin}/forms/${currentTemplateId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Enlace de formulario copiado al portapapeles');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddWhitelistEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = newEmailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }
    if (allowedEmails.includes(email)) {
      toast.error('Este correo ya se encuentra en la lista');
      return;
    }
    setAllowedEmails([...allowedEmails, email]);
    setNewEmailInput('');
    toast.success(`Correo añadido: ${email}`);
  };

  const handleRemoveWhitelistEmail = (emailToRemove: string) => {
    setAllowedEmails(allowedEmails.filter(e => e !== emailToRemove));
    toast.success('Correo removido de la lista');
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

  // Dynamic Union of Current Schema Fields + Historical/Deleted Fields from Responses
  const allReportingQuestions = useMemo(() => {
    const knownMap = new Map<string, FormFieldItem & { isLegacy?: boolean }>();
    allFlatQuestions.forEach(q => knownMap.set(q.id, q));

    // Discover any keys present in responses that are not in current schema
    responsesData.responses.forEach(r => {
      if (r.data && typeof r.data === 'object') {
        Object.keys(r.data).forEach(key => {
          if (!knownMap.has(key) && key !== 'signature' && key !== 'files') {
            const legacyLabel = (r as any).fieldLabels?.[key] || `Campo (${key})`;
            knownMap.set(key, {
              id: key,
              type: 'text',
              label: legacyLabel,
              required: false,
              isLegacy: true
            } as any);
          }
        });
      }
    });

    return Array.from(knownMap.values());
  }, [allFlatQuestions, responsesData.responses]);

  // Tallies and statistics for each poll field type
  const pollStats = useMemo(() => {
    const stats: Record<string, {
      totalVotes: number;
      options: Record<string, { count: number; pct: number }>;
    }> = {};

    const pollFields = allFlatQuestions.filter(q => q.type === 'poll');
    pollFields.forEach(fld => {
      const opts = fld.pollConfig?.options || [];
      const counts: Record<string, number> = {};
      opts.forEach(opt => {
        counts[opt.id] = 0;
      });

      let totalVotes = 0;
      responsesData.responses.forEach(res => {
        const val = res.data[fld.id];
        if (val) {
          if (Array.isArray(val)) {
            val.forEach((id: string) => {
              if (counts[id] !== undefined) {
                counts[id]++;
              }
            });
            totalVotes += val.length;
          } else if (typeof val === 'string') {
            if (counts[val] !== undefined) {
              counts[val]++;
              totalVotes++;
            }
          }
        }
      });

      let respondentsCount = 0;
      responsesData.responses.forEach(res => {
        const val = res.data[fld.id];
        if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
          respondentsCount++;
        }
      });

      const optionsStats: Record<string, { count: number; pct: number }> = {};
      opts.forEach(opt => {
        const count = counts[opt.id] || 0;
        const divisor = fld.pollConfig?.allowMultiple ? respondentsCount : totalVotes;
        const pct = divisor > 0 ? Math.round((count / divisor) * 100) : 0;
        optionsStats[opt.id] = { count, pct };
      });

      stats[fld.id] = {
        totalVotes: fld.pollConfig?.allowMultiple ? respondentsCount : totalVotes,
        options: optionsStats
      };
    });

    return stats;
  }, [allFlatQuestions, responsesData.responses]);

  // Visible questions in preview simulator based on conditions
  const visiblePreviewFlatQuestions = useMemo(() => {
    return allFlatQuestions.filter(q => evaluateFieldCondition(q.condition, previewData));
  }, [allFlatQuestions, previewData]);

  // Strict Real-Time Input Sanitizer
  const sanitizeFieldValue = (type: FormFieldType, rawValue: string): string => {
    if (type === 'phone') {
      let val = rawValue.replace(/[^\d+ ]/g, '');
      if (!val) return '';
      const digitsAndSpaces = val.replace(/\+/g, '');
      return '+' + digitsAndSpaces;
    }
    if (type === 'curp') {
      const upper = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return upper.substring(0, 18);
    }
    if (type === 'integer') {
      return rawValue.replace(/[^\d]/g, '');
    }
    if (type === 'fullname') {
      const cleaned = rawValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
      return cleaned
        .toLowerCase()
        .replace(/(^|\s)[a-záéíóúñü]/g, char => char.toUpperCase());
    }
    if (type === 'decimal') {
      let val = rawValue.replace(/[^\d.]/g, '');
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      return val;
    }
    return rawValue;
  };

  const handlePreviewFieldChange = (fieldId: string, type: FormFieldType, rawValue: string) => {
    const sanitized = sanitizeFieldValue(type, rawValue);
    setPreviewData(prev => ({ ...prev, [fieldId]: sanitized }));
  };

  const handlePreviewCompositeFieldChange = (fieldId: string, subId: string, subType: FormFieldType, rawValue: string) => {
    const sanitized = sanitizeFieldValue(subType, rawValue);
    setPreviewData(prev => ({
      ...prev,
      [fieldId]: {
        ...(prev[fieldId] || {}),
        [subId]: sanitized
      }
    }));
  };

  // Filtered responses
  const filteredResponses = useMemo(() => {
    const q = responseSearch.trim().toLowerCase();
    if (!q) return responsesData.responses;
    return responsesData.responses.filter(r =>
      (r.respondentName || '').toLowerCase().includes(q) ||
      (r.respondentEmail || '').toLowerCase().includes(q) ||
      (r.respondentPhone || '').toLowerCase().includes(q) ||
      (r.processLabel || '').toLowerCase().includes(q) ||
      Object.values(r.data || {}).some(v => String(v).toLowerCase().includes(q))
    );
  }, [responsesData.responses, responseSearch]);

  const handleExportCSV = () => {
    if (responsesData.responses.length === 0) {
      toast.error('No hay respuestas para exportar');
      return;
    }

    const questionHeaders = allReportingQuestions.map(q => {
      const tag = (q as any).isLegacy ? ' (Histórico)' : '';
      return `"${((q.label || q.id) + tag).replace(/"/g, '""')}"`;
    });
    const headers = [
      'ID',
      'Enviado por',
      'Email',
      'Teléfono',
      'Origen / Proceso',
      'Fecha de Envío',
      'Dirección IP',
      'Navegador',
      'Sistema Operativo',
      'Tipo Dispositivo',
      'Tiempo Llenado',
      'Huella Digital (Hardware ID)',
      'Firma Capturada',
      ...questionHeaders
    ];

    const rows = responsesData.responses.map(r => {
      const tel = r.telemetry || (r.metadata as any) || {};
      const clientIp = tel.ip || r.ip || (r as any).clientIp || (r.metadata as any)?.ip || '';
      const browserStr = typeof tel.browser === 'object' ? tel.browser?.full || tel.browser?.name || '' : (tel.browser || '');
      const osStr = typeof tel.os === 'object' ? tel.os?.full || tel.os?.name || '' : (tel.os || '');
      const deviceType = tel.deviceType || '';
      const duration = tel.durationFormatted || (tel.durationSeconds ? `${tel.durationSeconds}s` : '');
      const fp = tel.fingerprint || '';

      const answersCols = allReportingQuestions.map(q => {
        const val = r.data[q.id];
        if (val === undefined || val === null || val === '') return '""';
        if (Array.isArray(val)) return `"${val.join('; ').replace(/"/g, '""')}"`;
        if (q.type === 'fullname' && typeof val === 'object' && val !== null) {
          const full = [val.firstName, val.paternalLastName, val.maternalLastName].filter(Boolean).join(' ');
          return `"${full.replace(/"/g, '""')}"`;
        }
        if (typeof val === 'object' && val !== null) {
          if (q.subfields && q.subfields.length > 0) {
            const parts = q.subfields.map(sub => `${sub.label}: ${val[sub.id] ?? ''}`);
            return `"${parts.join(' | ').replace(/"/g, '""')}"`;
          }
          if (val.firstName || val.paternalLastName) {
            const full = [val.firstName, val.paternalLastName, val.maternalLastName].filter(Boolean).join(' ');
            return `"${full.replace(/"/g, '""')}"`;
          }
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      return [
        r.id,
        `"${(r.respondentName || '').replace(/"/g, '""')}"`,
        r.respondentEmail || '',
        r.respondentPhone || '',
        `"${(r.processLabel || 'Directo / Público').replace(/"/g, '""')}"`,
        new Date(r.submittedAt).toLocaleString(),
        `"${clientIp}"`,
        `"${browserStr.replace(/"/g, '""')}"`,
        `"${osStr.replace(/"/g, '""')}"`,
        `"${deviceType}"`,
        `"${duration}"`,
        `"${fp}"`,
        r.signature ? 'SÍ' : 'NO',
        ...answersCols
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `respuestas_${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV descargado');
  };

  const INSERTABLE_FIELD_TYPES = useMemo(() => [
    { type: 'text' as FormFieldType, label: 'Texto Corto', description: 'Respuesta breve en una sola línea', icon: Type },
    { type: 'fullname' as FormFieldType, label: 'Nombre y Apellidos', description: 'Nombre completo del solicitante', icon: User },
    { type: 'textarea' as FormFieldType, label: 'Párrafo', description: 'Área para textos y explicaciones largas', icon: AlignLeft },
    { type: 'richtext' as FormFieldType, label: 'Texto WYSIWYG', description: 'Editor con negritas, listas y formato', icon: FileEdit },
    { type: 'email' as FormFieldType, label: 'Correo Electrónico', description: 'Validación de email institucional', icon: Mail },
    { type: 'phone' as FormFieldType, label: 'Teléfono Móvil', description: 'Número telefónico con selector de país', icon: Phone },
    { type: 'curp' as FormFieldType, label: 'CURP Mexicano', description: 'Clave Única de Registro de Población (18 caracteres)', icon: CreditCard },
    { type: 'integer' as FormFieldType, label: 'Número Entero', description: 'Cantidad numérica, edad o conteos', icon: Hash },
    { type: 'range' as FormFieldType, label: 'Rango / Slider', description: 'Deslizador numérico con min y max', icon: Sliders },
    { type: 'single_choice' as FormFieldType, label: 'Opción Única', description: 'Radio buttons o selección exclusiva', icon: Radio },
    { type: 'multiple_choice' as FormFieldType, label: 'Casillas Múltiples', description: 'Selección de varias opciones a la vez', icon: CheckSquare },
    { type: 'boolean' as FormFieldType, label: 'Sí / No', description: 'Interruptor o confirmación booleana', icon: ToggleLeft },
    { type: 'date' as FormFieldType, label: 'Fecha', description: 'Selector de día, mes y año', icon: Calendar },
    { type: 'file_upload' as FormFieldType, label: 'Archivo Adjunto', description: 'Subida de documentos PDF o imágenes', icon: UploadCloud },
    { type: 'identity_verification' as FormFieldType, label: 'Verificación de Identidad (KYC)', description: 'Flujo compuesto: Documento + Selfie Liveness + Face Match', icon: ShieldCheck },
    { type: 'document_capture' as FormFieldType, label: 'Doc. Identidad', description: 'Captura guiada de 2 caras (INE, Pasaporte, Licencia)', icon: CreditCard },
    { type: 'selfie_liveness' as FormFieldType, label: 'Selfie / Prueba de Vida', description: 'Prueba biométrica facial interactiva (Liveness)', icon: ScanFace },
    { type: 'signature' as FormFieldType, label: 'Firma Digital', description: 'Lienzo táctil para firma manuscrita', icon: PenTool },
    { type: 'terms_consent' as FormFieldType, label: 'Términos y Consentimiento', description: 'Lectura de acuerdos legales + Checkbox', icon: FileCheck2 },
    { type: 'composite' as FormFieldType, label: 'Ficha de Contacto', description: 'Grupo de subcampos estructurados', icon: Contact },
    { type: 'poll' as FormFieldType, label: 'Encuesta / Votación', description: 'Elementos con título y descripción (selección simple/múltiple)', icon: BarChart3 }
  ], []);

  const renderInlineInserter = (targetIndex: number) => {
    return (
      <div className="py-1">
        <button
          type="button"
          onClick={() => openPaletteDrawer(targetIndex)}
          className="w-full py-2 px-4 rounded-2xl border-2 border-dashed border-forest/15 hover:border-forest/40 hover:bg-forest/5 text-forest/60 hover:text-forest transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-2xs group cursor-pointer"
        >
          <div className="w-4 h-4 rounded-full bg-forest/10 group-hover:bg-forest group-hover:text-white text-forest flex items-center justify-center transition-colors">
            <Plus className="w-3 h-3 stroke-[2.5]" />
          </div>
          <span>Insertar campo aquí (posición {targetIndex + 1})</span>
        </button>
      </div>
    );
  };

  // Sample Realistic Avatar for Face Match Mock
  const MOCK_FACE_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';

  const renderMockPreviewSpecialField = (field: FormFieldItem, layoutVariant: 'classic' | 'focus' | 'wizard' = 'classic') => {
    // 1. SIGNATURE MOCK VIEW (Autographed realistic cursive signature, read-only)
    if (field.type === 'signature') {
      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-white border border-forest/20 shadow-2xs space-y-3 ${previewDarkMode ? 'bg-slate-900 border-slate-700' : ''}`}>
          <div className="flex items-center justify-between gap-2 border-b border-forest/10 pb-2">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-forest" />
              <span className="text-xs font-bold text-forest">Firma Autógrafa Digital</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              <span>Firma Registrada</span>
            </span>
          </div>

          <div className="relative h-28 w-full bg-slate-50/80 rounded-xl border border-dashed border-forest/25 overflow-hidden flex items-center justify-center select-none">
            {/* Background baseline */}
            <div className="absolute bottom-6 left-8 right-8 border-b border-slate-300/80 border-dashed" />
            <div className="absolute bottom-2 right-4 text-[9px] text-muted-foreground font-mono">
              x _________________________
            </div>

            {/* Realistic Autographed SVG Signature in Dark Royal Blue Ink */}
            <svg
              viewBox="0 0 400 120"
              className="w-full h-full max-w-[340px] px-4 pointer-events-none drop-shadow-xs"
              style={{ filter: 'drop-shadow(0 1px 1px rgba(30,58,138,0.15))' }}
            >
              <path
                d="M 40 85 C 65 20, 85 10, 105 75 C 120 110, 135 40, 160 65 Q 185 85, 210 45 T 255 70 Q 285 30, 310 80 M 80 85 C 140 90, 240 80, 350 82"
                fill="none"
                stroke="#1d4ed8"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Verification Stamp */}
            <div className="absolute top-2 right-2 bg-emerald-50/90 backdrop-blur-xs border border-emerald-300/80 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-[9px] font-bold text-emerald-800 font-mono">SHA-256 Verificado</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Lienzo sellado y vinculado al postulante</span>
            </span>
            <span className="font-mono text-[10px] opacity-75">
              ID: {field.id.substring(0, 8)}
            </span>
          </div>
        </div>
      );
    }

    // 2. IDENTITY VERIFICATION / DOCUMENT CAPTURE / SELFIE LIVENESS MOCK VIEW (Face Match with Sepia ID Crop)
    if (
      field.type === 'identity_verification' ||
      field.type === 'document_capture' ||
      field.type === 'selfie_liveness'
    ) {
      const docTypeLabel =
        field.allowedIdTypes?.includes('passport') && !field.allowedIdTypes?.includes('id_card')
          ? 'Pasaporte'
          : 'Identificación Oficial / INE';

      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-white border border-forest/20 shadow-2xs space-y-3.5 ${previewDarkMode ? 'bg-slate-900 border-slate-700' : ''}`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-forest/15">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-forest text-xs">
                Verificación de Identidad Biométrica ({docTypeLabel})
              </span>
            </div>
            <span className="px-2.5 py-0.8 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1 self-start sm:self-auto shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Face Match Aprobado (98.4%)</span>
            </span>
          </div>

          {/* Biometric Result Banner */}
          <div className="p-3 rounded-xl bg-forest/[0.04] border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <ScanFace className="w-4 h-4 text-forest" />
              <span className="text-xs font-bold text-forest">Cotejo Facial 1:1:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold text-[11px]">
                98.4% de Coincidencia
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              Validación biométrica exitosa
            </span>
          </div>

          {/* Dual Photos: Left = Sepia/Opaque ID Document Face, Right = Vivid Live Selfie */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 pt-1">
            {/* Foto Izquierda: Documento Oficial (Opaca y Sepia) */}
            <div className="space-y-1.5 flex flex-col items-center text-center">
              <div className="relative w-full aspect-square max-w-[160px] rounded-2xl overflow-hidden border-2 border-amber-600/40 shadow-sm bg-amber-50">
                <img
                  src={MOCK_FACE_AVATAR}
                  alt="Rostro Documento Oficial"
                  className="w-full h-full object-cover"
                  style={{ filter: 'sepia(0.85) contrast(1.15) brightness(0.88) grayscale(0.15)' }}
                />
                <div className="absolute inset-0 bg-amber-900/10 pointer-events-none" />
                <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-amber-300" />
                  <span>Rostro ID</span>
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-amber-500/90 text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono">
                  Sepia / ID Scan
                </div>
              </div>
              <span className="text-[11px] font-bold text-forest block">1. Documento Oficial</span>
              <span className="text-[9.5px] text-muted-foreground">Recorte extraído del ID</span>
            </div>

            {/* Foto Derecha: Selfie en Vivo */}
            <div className="space-y-1.5 flex flex-col items-center text-center">
              <div className="relative w-full aspect-square max-w-[160px] rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-slate-100 ring-2 ring-emerald-400/20">
                <img
                  src={MOCK_FACE_AVATAR}
                  alt="Selfie Biométrica en Vivo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ScanFace className="w-3 h-3 text-white" />
                  <span>Selfie Viva</span>
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-emerald-500/90 text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono">
                  Liveness OK
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 block">2. Selfie Biométrica</span>
              <span className="text-[9.5px] text-muted-foreground">Prueba de vida superada</span>
            </div>
          </div>

          {/* OCR Extracted Data Preview Table */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
              <span className="font-bold text-forest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Datos Extraídos por OCR + LLM</span>
              </span>
              <span className="text-[9.5px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                Calidad: Excelente
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-slate-700 pt-0.5">
              <div><span className="text-muted-foreground">Nombre:</span> <strong>CARLOS EDUARDO MENDOZA</strong></div>
              <div><span className="text-muted-foreground">CURP:</span> <strong className="font-mono">MEHC920415HDFRNR09</strong></div>
              <div><span className="text-muted-foreground">Nacimiento:</span> <strong>15/04/1992</strong></div>
              <div><span className="text-muted-foreground">Vigencia:</span> <strong>2024 - 2034</strong></div>
            </div>
          </div>
        </div>
      );
    }

    // 3. TERMS & CONSENT MOCK VIEW (Already accepted / signed state with rich HTML preview)
    if (field.type === 'terms_consent' || field.type === 'terms') {
      const termsHtml = field.termsContent || field.description || '<p>El solicitante acepta expresamente las políticas del colegio, el aviso de privacidad integral y las condiciones del proceso de admisión institucional.</p>';

      return (
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs space-y-3.5 ${previewDarkMode ? 'bg-slate-900/90 border-emerald-800/80 text-slate-100' : 'bg-emerald-50/40 border-emerald-300/80 text-slate-800'
          }`}>
          {/* Card Header Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span className={`text-xs font-bold font-display ${previewDarkMode ? 'text-white' : 'text-emerald-950'}`}>
                {field.label || 'Términos y Condiciones de Admisión'}
              </span>
            </div>
            <span className="px-2.5 py-0.8 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Aceptado</span>
            </span>
          </div>

          {/* Rendered HTML Document Body */}
          <div className={`p-3.5 rounded-xl border max-h-40 overflow-y-auto leading-relaxed shadow-2xs ${previewDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-white border-emerald-200/70 text-slate-700'
            }`}>
            <div
              className="prose prose-xs max-w-none text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: termsHtml }}
            />
          </div>

          {/* Checked Checkbox row */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border shadow-2xs ${previewDarkMode ? 'bg-slate-950 border-emerald-700/60' : 'bg-white border-emerald-300'
            }`}>
            <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className={`text-xs font-bold ${previewDarkMode ? 'text-emerald-300' : 'text-emerald-950'}`}>
              {field.consentLabel || field.consentText || 'He leído, comprendo y acepto los términos y condiciones anteriores'}
            </span>
          </div>

          {/* Audit signature note */}
          <div className={`flex items-center justify-between text-[10px] font-mono px-1 ${previewDarkMode ? 'text-emerald-400/80' : 'text-emerald-800/80'
            }`}>
            <span>✓ Consentimiento registrado electrónicamente</span>
            <span>IP: 187.190.*** (Sellado)</span>
          </div>
        </div>
      );
    }

    // 4. FILE UPLOAD MOCK VIEW
    if (field.type === 'file_upload') {
      return (
        <div className={`p-4 rounded-2xl bg-white border border-forest/20 shadow-2xs space-y-2.5 ${previewDarkMode ? 'bg-slate-900 border-slate-700' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-forest" />
              <span className="text-xs font-bold text-forest">Archivo Adjunto</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              ✓ Cargado
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                PDF
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-slate-800 truncate">comprobante_oficial.pdf</p>
                <p className="text-[10px] text-muted-foreground">1.4 MB • Subido correctamente</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 shrink-0">Verificado</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-200">

      {/* 1. TOP HEADER BANNER (FULL LAYOUT HEADER) */}
      <div className="w-full bg-gradient-to-r from-forest via-forest-light to-forest text-white shadow-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">

          {/* Top Control Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 sm:pt-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/15 shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
                title="Volver a lista de formularios"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                {loading ? (
                  <span className="font-bold font-display text-lg sm:text-xl text-white block px-2 py-0.5 truncate w-full animate-pulse select-none">
                    Cargando formulario...
                  </span>
                ) : (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título del Formulario..."
                    className="font-bold font-display text-lg sm:text-xl text-white bg-transparent hover:bg-white/10 focus:bg-white/15 px-2 py-0.5 rounded-xl border border-transparent focus:border-white/30 truncate w-full outline-none transition-all"
                  />
                )}
                <span className="text-[11px] text-emerald-200 px-2 block truncate">
                  Constructor Ceiba Roots • {loading ? 'Cargando...' : (isPublished ? 'Publicado' : 'Borrador')}
                </span>
              </div>
            </div>

            {/* Top Actions (Desktop) */}
            <div className="hidden sm:flex items-center gap-2.5 shrink-0">
              {!loading && (
                isNew ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-white text-forest hover:bg-white/95 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Guardar formulario para habilitar autoguardado"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-forest" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-forest" />
                        <span>Guardar Formulario</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    {/* Autosave Status Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white/90 text-xs font-medium border border-white/15 backdrop-blur-xs select-none">
                      {autoSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                          <span className="text-emerald-200 text-[11px] font-semibold">Autoguardando...</span>
                        </>
                      ) : hasPendingChanges ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-amber-200 text-[11px] font-semibold">Cambios sin guardar</span>
                        </>
                      ) : lastSavedTime ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                          <span className="text-white/85 text-[11px]">Guardado auto {lastSavedTime}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="text-white/85 text-[11px]">Autoguardado activo</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-white text-forest hover:bg-white/90 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                      title="Compartir enlace y configurar privacidad"
                    >
                      <Share2 className="w-3.5 h-3.5 text-forest" />
                      <span>Compartir</span>
                    </button>
                  </>
                )
              )}
            </div>
          </div>

          {/* 4 Main Header Tabs: General & Apariencia / Secciones y Preguntas / Vista Previa / Respuestas */}
          <div className="relative pt-2 border-t border-white/10 flex items-center min-w-0">
            {/* Left scroll handler button */}
            {canScrollHeaderLeft && (
              <div className="absolute left-0 top-2 bottom-0 z-20 flex items-center pr-3 bg-gradient-to-r from-forest via-forest/90 to-transparent">
                <button
                  type="button"
                  onClick={() => scrollHeaderTabs('left')}
                  className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white text-white hover:text-forest flex items-center justify-center shadow-lg transition-all cursor-pointer border border-white/20 backdrop-blur-xs hover:scale-105 active:scale-95"
                  title="Desplazar pestañas a la izquierda"
                  aria-label="Desplazar pestañas a la izquierda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Tabs Track */}
            <div
              ref={headerTabsRef}
              onScroll={checkHeaderTabsScroll}
              className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth w-full pt-1"
            >
              <button
                type="button"
                onClick={loading ? undefined : () => setActiveTab('general')}
                disabled={loading}
                className={`px-3 py-2.5 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 ${loading
                  ? 'border-transparent text-white/40 cursor-not-allowed opacity-50'
                  : activeTab === 'general'
                    ? 'border-white text-white font-extrabold cursor-pointer'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/10 cursor-pointer'
                  }`}
              >
                <Palette className="w-4 h-4" />
                <span>General y Apariencia</span>
              </button>

              <button
                type="button"
                onClick={loading ? undefined : () => setActiveTab('builder')}
                disabled={loading}
                className={`px-3 py-2.5 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 ${loading
                  ? 'border-transparent text-white/40 cursor-not-allowed opacity-50'
                  : activeTab === 'builder'
                    ? 'border-white text-white font-extrabold cursor-pointer'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/10 cursor-pointer'
                  }`}
              >
                <Layers className="w-4 h-4" />
                <span>Secciones y Preguntas</span>
              </button>

              <button
                type="button"
                onClick={loading ? undefined : () => setActiveTab('preview')}
                disabled={loading}
                className={`px-3 py-2.5 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 ${loading
                  ? 'border-transparent text-white/40 cursor-not-allowed opacity-50'
                  : activeTab === 'preview'
                    ? 'border-white text-white font-extrabold cursor-pointer'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/10 cursor-pointer'
                  }`}
              >
                <Eye className="w-4 h-4" />
                <span>Vista Previa</span>
              </button>

              <button
                type="button"
                onClick={loading ? undefined : () => setActiveTab('responses')}
                disabled={loading}
                className={`px-3 py-2.5 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 ${loading
                  ? 'border-transparent text-white/40 cursor-not-allowed opacity-50'
                  : activeTab === 'responses'
                    ? 'border-white text-white font-extrabold cursor-pointer'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/10 cursor-pointer'
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Respuestas</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${loading
                  ? 'bg-white/10 text-white/40'
                  : activeTab === 'responses'
                    ? 'bg-white text-forest shadow-xs animate-in zoom-in-50 duration-200'
                    : 'bg-white/20 text-white'
                  }`}>
                  {responsesData.totalResponses}
                </span>
              </button>
            </div>

            {/* Right scroll handler button */}
            {canScrollHeaderRight && (
              <div className="absolute right-0 top-2 bottom-0 z-20 flex items-center pl-3 bg-gradient-to-l from-forest via-forest/90 to-transparent">
                <button
                  type="button"
                  onClick={() => scrollHeaderTabs('right')}
                  className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white text-white hover:text-forest flex items-center justify-center shadow-lg transition-all cursor-pointer border border-white/20 backdrop-blur-xs hover:scale-105 active:scale-95"
                  title="Desplazar pestañas a la derecha"
                  aria-label="Desplazar pestañas a la derecha"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT BODY */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {loading && (
          <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
            {/* Skeleton Section Card 1 */}
            <div className="bg-white rounded-3xl border border-forest/30 shadow-sm p-6 sm:p-8 space-y-4 animate-pulse">
              <div className="flex items-center gap-3 border-b border-forest/5 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded-md" />
                  <div className="h-3 w-48 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-9 w-full bg-slate-100 rounded-xl" />
                <div className="h-16 w-full bg-slate-50 rounded-xl" />
              </div>
            </div>

            {/* Skeleton Section Card 2 */}
            <div className="bg-white rounded-3xl border border-forest/30 shadow-sm p-6 sm:p-8 space-y-4 animate-pulse">
              <div className="flex items-center gap-3 border-b border-forest/5 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-200 rounded-md" />
                  <div className="h-3 w-64 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="h-20 bg-slate-100/50 rounded-2xl border border-slate-100" />
                <div className="h-20 bg-slate-100/50 rounded-2xl border border-slate-100" />
                <div className="h-20 bg-slate-100/50 rounded-2xl border border-slate-100" />
              </div>
            </div>

            {/* Skeleton Section Card 3 */}
            <div className="bg-white rounded-3xl border border-forest/30 shadow-sm p-6 sm:p-8 space-y-4 animate-pulse">
              <div className="flex items-center gap-3 border-b border-forest/5 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-slate-200 rounded-md" />
                  <div className="h-3 w-36 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="h-12 w-full bg-slate-100 rounded-2xl" />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: INFORMACIÓN GENERAL Y APARIENCIA                  */}
        {/* ======================================================== */}
        {!loading && activeTab === 'general' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-150">

            {/* Card 1: Información Básica del Formulario */}
            <div
              className="bg-white rounded-3xl border border-forest/30 shadow-sm overflow-hidden space-y-5 p-6 sm:p-8 border-t-8"
              style={{ borderTopColor: themeColor }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-forest/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: themeColor }}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-forest">Información Principal</h2>
                    <p className="text-xs text-muted-foreground">Define el nombre, descripción y categoría del formulario.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-forest bg-forest/5 hover:bg-forest hover:text-white border border-forest/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Ir a Preguntas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-forest block mb-1.5">
                    Título del Formulario <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Solicitud de Admisión Ciclo 2026 - 2027"
                    className="w-full text-base sm:text-lg font-bold text-forest bg-forest/5 border border-forest/20 focus:border-forest rounded-2xl p-3.5 outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest block mb-1.5">
                    Descripción o Instrucciones Generales
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explica a las familias el propósito de este formulario, documentos necesarios o instrucciones previas..."
                    className="w-full text-xs sm:text-sm text-forest/90 bg-forest/5 border border-forest/20 focus:border-forest rounded-2xl p-3.5 outline-none resize-none transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-forest/10 text-xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-forest block">Categoría de Formulario</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-forest/5 border border-forest/20 rounded-2xl px-3.5 py-3 text-xs sm:text-sm text-forest font-semibold focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-forest block">Estado de Publicación</label>
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-forest/5 border border-forest/20 min-h-[46px]">
                    <span className="text-xs font-bold text-forest truncate pr-2">
                      {isPublished ? 'Publicado (Activo)' : 'Borrador (Oculto)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPublished(!isPublished)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${isPublished ? 'bg-forest justify-end' : 'bg-slate-300 justify-start'
                        }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-forest block">Respuestas Múltiples</label>
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-forest/5 border border-forest/20 min-h-[46px]">
                    <span className="text-xs font-bold text-forest truncate pr-2">
                      {allowMultipleResponses ? 'Permitidas (Reenviar)' : 'Única respuesta (No repetir)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAllowMultipleResponses(!allowMultipleResponses)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${allowMultipleResponses ? 'bg-forest justify-end' : 'bg-slate-300 justify-start'
                        }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Experiencia y Flujo de Llenado */}
            <div className="bg-white rounded-3xl border border-forest/30 shadow-sm overflow-hidden p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-forest/10 pb-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: themeColor }}
                >
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-forest">Flujo y Experiencia de Llenado</h2>
                  <p className="text-xs text-muted-foreground">Selecciona cómo interactuarán las familias con este formulario.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => setLayoutStyle('classic')}
                  className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${layoutStyle === 'classic' || layoutStyle === 'google_forms'
                    ? 'border-2 shadow-sm font-bold ring-4 ring-forest/15'
                    : 'border-forest/15 bg-forest/5 text-forest/70 hover:bg-forest/10 hover:text-forest'
                    }`}
                  style={layoutStyle === 'classic' || layoutStyle === 'google_forms' ? { borderColor: themeColor, backgroundColor: `${themeColor}10` } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm" style={{ color: themeColor }}>
                      <FileText className="w-4 h-4" />
                      <span>Clásico Continuo</span>
                    </div>
                    {(layoutStyle === 'classic' || layoutStyle === 'google_forms') && <Check className="w-4 h-4 stroke-[3]" style={{ color: themeColor }} />}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
                    Todas las secciones en tarjetas verticales continuas estilo Google Forms.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutStyle('focus_flow')}
                  className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${layoutStyle === 'focus_flow' || layoutStyle === 'typeform'
                    ? 'border-2 shadow-sm font-bold ring-4 ring-purple-500/15 bg-purple-50/50'
                    : 'border-forest/15 bg-forest/5 text-forest/70 hover:bg-forest/10 hover:text-forest'
                    }`}
                  style={layoutStyle === 'focus_flow' || layoutStyle === 'typeform' ? { borderColor: themeColor } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm" style={{ color: themeColor }}>
                      <Sparkles className="w-4 h-4" />
                      <span>Flujo Guiado (1 a 1)</span>
                    </div>
                    {(layoutStyle === 'focus_flow' || layoutStyle === 'typeform') && <Check className="w-4 h-4 stroke-[3]" style={{ color: themeColor }} />}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
                    1 pregunta a la vez a pantalla completa con navegación ágil estilo Typeform.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutStyle('step_wizard')}
                  className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${layoutStyle === 'step_wizard' || layoutStyle === 'wizard_liquid'
                    ? 'border-2 shadow-sm font-bold ring-4 ring-emerald-500/15 bg-emerald-50/50'
                    : 'border-forest/15 bg-forest/5 text-forest/70 hover:bg-forest/10 hover:text-forest'
                    }`}
                  style={layoutStyle === 'step_wizard' || layoutStyle === 'wizard_liquid' ? { borderColor: themeColor } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm" style={{ color: themeColor }}>
                      <Layers className="w-4 h-4" />
                      <span>Paso a Paso (Wizard)</span>
                    </div>
                    {(layoutStyle === 'step_wizard' || layoutStyle === 'wizard_liquid') && <Check className="w-4 h-4 stroke-[3]" style={{ color: themeColor }} />}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
                    Navegación secuencial por fases con barra superior de pasos y progreso.
                  </p>
                </button>
              </div>
            </div>

            {/* Card 3: Paleta de Colores Personalizada */}
            <div className="bg-white rounded-3xl border border-forest/30 shadow-sm overflow-hidden p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-forest/10 pb-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: themeColor }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-forest">Colores del Formulario</h2>
                  <p className="text-xs text-muted-foreground">Elige el color principal de identidad y el color secundario de acento.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-1">
                {/* Color Principal */}
                <div className="p-4 sm:p-5 rounded-3xl bg-forest/5 border border-forest/15 space-y-2.5 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <label className="text-xs font-bold text-forest truncate">Color Principal (Primario)</label>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white text-forest border border-forest/10 uppercase shrink-0">
                      {themeColor}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    Se usa en encabezados, botones activos, líneas de enfoque e iconos.
                  </p>
                  <div className="flex items-center gap-2.5 sm:gap-3 pt-1 min-w-0">
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 cursor-pointer">
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="absolute inset-0 w-full h-full scale-150 cursor-pointer border-0 p-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#1b3b2b"
                      className="flex-1 min-w-0 w-full bg-white border border-forest/15 rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm font-mono font-bold text-forest outline-none uppercase focus:ring-2 focus:ring-forest/20"
                    />
                  </div>
                </div>

                {/* Color Secundario */}
                <div className="p-4 sm:p-5 rounded-3xl bg-forest/5 border border-forest/15 space-y-2.5 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <label className="text-xs font-bold text-forest truncate">Color Secundario (Acento)</label>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white text-forest border border-forest/10 uppercase shrink-0">
                      {secondaryColor}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    Se usa en botones secundarios, estados completados y distintivos.
                  </p>
                  <div className="flex items-center gap-2.5 sm:gap-3 pt-1 min-w-0">
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 cursor-pointer">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="absolute inset-0 w-full h-full scale-150 cursor-pointer border-0 p-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#10b981"
                      className="flex-1 min-w-0 w-full bg-white border border-forest/15 rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm font-mono font-bold text-forest outline-none uppercase focus:ring-2 focus:ring-forest/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Estilos de Campos, Redondeo, Sombras y Bordes */}
            <div className="bg-white rounded-3xl border border-forest/30 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-forest/10 pb-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: themeColor }}
                >
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-forest">Estilo de Campos, Redondeo y Sombras</h2>
                  <p className="text-xs text-muted-foreground">Personaliza la geometría, los bordes y el aspecto de todas las preguntas.</p>
                </div>
              </div>

              {/* 3 Opciones de Estilo de Campos */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-forest block">
                  1. Estilo de los Campos de Entrada (Inputs)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'underlined',
                      title: 'Línea Inferior',
                      desc: 'Fondo transparente y borde únicamente abajo. Fluido y minimalista.',
                      preview: 'border-b-2 bg-transparent'
                    },
                    {
                      id: 'bordered',
                      title: 'Contorno Completo',
                      desc: 'Caja perimetral clásica con borde 360° en los 4 lados.',
                      preview: 'border-2 bg-white'
                    },
                    {
                      id: 'filled',
                      title: 'Relleno Suave',
                      desc: 'Fondo sólido suave con borde sutil o sin contorno duro.',
                      preview: 'bg-slate-100 border border-slate-200'
                    }
                  ].map((st) => {
                    const isSelected = fieldStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setFieldStyle(st.id as any)}
                        className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${isSelected
                          ? 'border-2 shadow-sm font-bold ring-4 ring-forest/15'
                          : 'border-forest/15 bg-forest/5 text-forest/70 hover:bg-forest/10 hover:text-forest'
                          }`}
                        style={isSelected ? { borderColor: themeColor, backgroundColor: `${themeColor}08` } : {}}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm" style={{ color: themeColor }}>
                            {st.title}
                          </span>
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" style={{ color: themeColor }} />}
                        </div>

                        {/* Mini preview */}
                        <div className="w-full pt-1 pb-1">
                          <div
                            className={`w-full py-1.5 px-2.5 text-[11px] text-muted-foreground font-medium rounded-lg ${st.preview}`}
                            style={isSelected ? { borderColor: themeColor } : {}}
                          >
                            Texto de ejemplo...
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
                          {st.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opciones de Redondeo de Bordes */}
              <div className="space-y-2.5 pt-2 border-t border-forest/10">
                <label className="text-xs font-bold text-forest block">
                  2. Redondeo de Bordes (Border Radius)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'none', label: 'Recto (0px)', class: 'rounded-none' },
                    { id: 'sm', label: 'Sutil (8px)', class: 'rounded-lg' },
                    { id: 'md', label: 'Clásico (12px)', class: 'rounded-xl' },
                    { id: 'lg', label: 'Moderno (18px)', class: 'rounded-2xl' },
                    { id: 'full', label: 'Píldora / Total', class: 'rounded-full' }
                  ].map((r) => {
                    const isSelected = borderRadius === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setBorderRadius(r.id as any)}
                        className={`p-3 border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${r.class} ${isSelected
                          ? 'border-2 text-forest font-bold shadow-xs'
                          : 'border-forest/15 bg-forest/5 text-forest/70 hover:bg-forest/10'
                          }`}
                        style={isSelected ? { borderColor: themeColor, backgroundColor: `${themeColor}12` } : {}}
                      >
                        <div className={`w-6 h-6 border-2 border-forest/40 ${r.class} bg-white shadow-2xs`} />
                        <span className="text-[11px] font-bold">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sombra y Grosor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-forest/10">
                {/* Sombra */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-forest block">3. Sombra y Elevación</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'Plano (Sin sombra)' },
                      { id: 'subtle', label: 'Sutil' },
                      { id: 'medium', label: 'Elevada' },
                      { id: 'glow', label: 'Resplandor' }
                    ].map((s) => {
                      const isSelected = shadowStyle === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setShadowStyle(s.id as any)}
                          className={`p-2.5 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer ${isSelected
                            ? 'border-2 text-forest shadow-xs'
                            : 'border-forest/15 bg-forest/5 text-forest/70 hover:bg-forest/10'
                            }`}
                          style={isSelected ? { borderColor: themeColor, backgroundColor: `${themeColor}12` } : {}}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grosor de Borde */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-forest block">4. Grosor de Borde</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'thin', label: 'Fino (1px)' },
                      { id: 'medium', label: 'Medio (2px)' },
                      { id: 'thick', label: 'Grueso (3px)' }
                    ].map((w) => {
                      const isSelected = borderWeight === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setBorderWeight(w.id as any)}
                          className={`p-2.5 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer ${isSelected
                            ? 'border-2 text-forest shadow-xs'
                            : 'border-forest/15 bg-forest/5 text-forest/70 hover:bg-forest/10'
                            }`}
                          style={isSelected ? { borderColor: themeColor, backgroundColor: `${themeColor}12` } : {}}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Demostración Interactiva en Vivo */}
            <div className="bg-white rounded-3xl border border-forest/30 shadow-sm overflow-hidden p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-forest/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-forest">Vista Previa de Componentes en Vivo</h2>
                    <p className="text-xs text-muted-foreground">Así es como verán los usuarios los elementos del formulario.</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-forest/5 text-forest border border-forest/15">
                  Modo: {fieldStyle.toUpperCase()}
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-6">
                {/* Input Demo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block" style={{ color: themeColor }}>
                    Nombre Completo <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Carlos Alberto Mendoza"
                    className={`w-full py-2.5 px-3 text-sm font-medium outline-none transition-all ${fieldStyle === 'underlined'
                      ? 'bg-transparent border-b-2'
                      : fieldStyle === 'filled'
                        ? `bg-white ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} border border-slate-200`
                        : `bg-white ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${getBorderWeightClass(borderWeight)}`
                      }`}
                    style={
                      fieldStyle === 'underlined'
                        ? { borderBottomColor: themeColor }
                        : fieldStyle === 'bordered'
                          ? { borderColor: themeColor }
                          : {}
                    }
                  />
                </div>

                {/* Select Demo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block" style={{ color: themeColor }}>
                    Grado de Interés
                  </label>
                  <div
                    className={`w-full py-2.5 px-3 text-sm font-medium flex items-center justify-between outline-none cursor-pointer transition-all ${fieldStyle === 'underlined'
                      ? 'bg-transparent border-b-2'
                      : fieldStyle === 'filled'
                        ? `bg-white ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} border border-slate-200`
                        : `bg-white ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${getBorderWeightClass(borderWeight)}`
                      }`}
                    style={
                      fieldStyle === 'underlined'
                        ? { borderBottomColor: themeColor }
                        : fieldStyle === 'bordered'
                          ? { borderColor: themeColor }
                          : {}
                    }
                  >
                    <span>Casa de Niños (3 - 6 años)</span>
                    <ChevronDown className="w-4 h-4" style={{ color: themeColor }} />
                  </div>
                </div>

                {/* Textarea Demo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block" style={{ color: themeColor }}>
                    Motivación / Comentarios
                  </label>
                  <textarea
                    rows={2}
                    readOnly
                    value="Buscamos una educación respetuosa con los ritmos de nuestro hijo."
                    className={`w-full py-2.5 px-3 text-sm font-medium outline-none resize-none transition-all ${fieldStyle === 'underlined'
                      ? 'bg-transparent border-b-2'
                      : fieldStyle === 'filled'
                        ? `bg-white ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} border border-slate-200`
                        : `bg-white ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${getBorderWeightClass(borderWeight)}`
                      }`}
                    style={
                      fieldStyle === 'underlined'
                        ? { borderBottomColor: themeColor }
                        : fieldStyle === 'bordered'
                          ? { borderColor: themeColor }
                          : {}
                    }
                  />
                </div>

                {/* Action Buttons Demo */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    className={`px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                    style={{ backgroundColor: themeColor }}
                  >
                    <span>Botón Primario</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    className={`px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <span>Botón Secundario</span>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('builder')}
                    className={`px-5 py-2.5 text-xs font-bold text-forest bg-white border border-forest/20 shadow-2xs hover:bg-forest/5 transition-all flex items-center gap-1.5 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  >
                    <span>Continuar a Preguntas</span>
                    <Layers className="w-3.5 h-3.5 text-forest" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SECCIONES Y PREGUNTAS (CONSTRUCTOR CANVAS)        */}
        {/* ======================================================== */}
        {!loading && activeTab === 'builder' && (
          <div className="max-w-4xl mx-auto space-y-5 pb-16 animate-in fade-in duration-150">

            {/* Quick Header Banner */}
            <div
              className="bg-white rounded-3xl border border-forest/30 shadow-sm p-4 sm:p-5 flex items-center justify-between gap-3 border-l-6"
              style={{ borderLeftColor: themeColor }}
            >
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-forest truncate">{title || 'Formulario sin título'}</h2>
                <p className="text-xs text-muted-foreground truncate">{description || 'Sin descripción'}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-forest bg-forest/5 hover:bg-forest hover:text-white border border-forest/15 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Editar Apariencia</span>
              </button>
            </div>

            {/* Section Navigation Tabs with Left/Right Scroll Handlers */}
            <div className="flex items-center gap-1.5 pt-1">
              {/* Scroll Left Button */}
              <button
                type="button"
                onClick={() => scrollSectionTabs('left')}
                disabled={!canScrollLeft}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-forest/15 flex items-center justify-center text-forest transition-all shrink-0 shadow-2xs ${canScrollLeft
                  ? 'bg-white hover:bg-forest hover:text-white cursor-pointer active:scale-95'
                  : 'bg-white/40 text-forest/25 border-forest/10 cursor-not-allowed opacity-40'
                  }`}
                title="Desplazar fases a la izquierda"
                aria-label="Desplazar fases a la izquierda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Scrollable Tabs List */}
              <div
                ref={sectionTabsRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1 scroll-smooth"
              >
                {sections.map((sec, idx) => {
                  const isActive = sec.id === activeSectionId;
                  const isBeingDragged = draggedSectionIdx === idx;
                  const isSectionDragOver = dragOverSectionIdx === idx && draggedSectionIdx !== null && draggedSectionIdx !== idx;
                  const isFieldDragOver = dragOverSectionIdx === idx && draggedFieldIdx !== null && sec.id !== activeSectionId;

                  return (
                    <div
                      key={sec.id}
                      draggable={draggedFieldIdx === null}
                      onDragStart={(e) => {
                        if (draggedFieldIdx !== null) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.setData('text/plain', `sec_${idx}`);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedSectionIdx(idx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverSectionIdx !== idx) {
                          setDragOverSectionIdx(idx);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverSectionIdx === idx) {
                          setDragOverSectionIdx(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedFieldIdx !== null) {
                          handleMoveFieldToSection(draggedFieldIdx, sec.id);
                        } else if (draggedSectionIdx !== null) {
                          handleDropSection(idx);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggedSectionIdx(null);
                        setDragOverSectionIdx(null);
                        setDraggedFieldIdx(null);
                        setIsOverDropTrash(false);
                      }}
                      onClick={(e) => {
                        setActiveSectionId(sec.id);
                        setActiveFieldId(sec.fields[0]?.id || '');
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 shadow-2xs border select-none ${isFieldDragOver
                        ? 'bg-emerald-700 text-white border-emerald-600 ring-4 ring-emerald-300 scale-105 shadow-md cursor-copy animate-pulse'
                        : isSectionDragOver
                          ? 'border-forest ring-4 ring-forest/20 bg-forest/10 scale-105 shadow-md cursor-grabbing'
                          : isBeingDragged
                            ? 'opacity-35 scale-95 border-dashed border-forest bg-forest/5 cursor-grabbing'
                            : isActive
                              ? 'bg-forest text-white border-forest shadow-xs cursor-pointer'
                              : 'bg-white text-forest hover:bg-forest/5 border-forest/15 cursor-pointer'
                        }`}
                      title={
                        draggedFieldIdx !== null
                          ? sec.id === activeSectionId
                            ? 'Fase actual de la pregunta'
                            : `Soltar aquí para mover la pregunta a ${sec.title} (al final)`
                          : 'Arrastrar y soltar para reorganizar fase / paso'
                      }
                    >
                      {isFieldDragOver ? (
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 text-white animate-bounce" />
                      ) : (
                        <GripVertical className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white/60' : 'text-forest/40'}`} />
                      )}
                      <span>Paso {idx + 1}: {sec.title}</span>
                      {isFieldDragOver ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-emerald-800 shrink-0 shadow-2xs">
                          + Soltar al final
                        </span>
                      ) : (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'
                          }`}>
                          {sec.fields.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scroll Right Button */}
              <button
                type="button"
                onClick={() => scrollSectionTabs('right')}
                disabled={!canScrollRight}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-forest/15 flex items-center justify-center text-forest transition-all shrink-0 shadow-2xs ${canScrollRight
                  ? 'bg-white hover:bg-forest hover:text-white cursor-pointer active:scale-95'
                  : 'bg-white/40 text-forest/25 border-forest/10 cursor-not-allowed opacity-40'
                  }`}
                title="Desplazar fases a la derecha"
                aria-label="Desplazar fases a la derecha"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Add Section Button */}
              <button
                type="button"
                onClick={handleAddSection}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-forest/5 hover:bg-forest hover:text-white text-forest border border-forest/15 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                title="Nueva sección / paso"
                aria-label="Nueva sección / paso"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Active Section Editor */}
            {currentSection && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-forest/30 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={currentSection.title}
                      onChange={(e) => handleUpdateSection(currentSection.id, { title: e.target.value })}
                      placeholder="Título de la Sección"
                      className="font-bold font-display text-base text-forest bg-transparent border-b border-transparent hover:border-forest/20 focus:border-forest pb-0.5 outline-none w-full"
                    />
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(currentSection.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
                        title="Eliminar esta sección"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={currentSection.description || ''}
                    onChange={(e) => handleUpdateSection(currentSection.id, { description: e.target.value })}
                    placeholder="Descripción o instrucciones específicas de esta sección (opcional)..."
                    className="text-xs text-forest/70 bg-transparent border-b border-transparent hover:border-forest/20 focus:border-forest pb-0.5 outline-none w-full"
                  />
                </div>

                {/* Section Questions Subheader Toolbar */}
                <div className="flex items-center justify-between gap-3 px-2 py-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-forest">
                      {currentSection.fields.length} {currentSection.fields.length === 1 ? 'Pregunta' : 'Preguntas'} en este paso
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPaletteDrawer(currentSection.fields.length)}
                      className="px-3.5 py-1.5 bg-forest text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-forest/90 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Agregar Campo</span>
                    </button>

                    {currentSection.fields.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedFieldId(prev => (prev === null ? currentSection.fields[0]?.id || null : null));
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-forest/5 text-forest border border-forest/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                        title={expandedFieldId === null ? 'Expandir primera pregunta' : 'Colapsar todas las preguntas'}
                      >
                        <ChevronsUpDown className="w-3.5 h-3.5 text-forest/70" />
                        <span>
                          {expandedFieldId === null
                            ? 'Expandir'
                            : 'Colapsar Todo'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stacked Question Cards */}
                <div className="space-y-2">
                  {currentSection.fields.map((field, index) => {
                    const isActive = field.id === activeFieldId;
                    const isBeingDragged = draggedFieldIdx === index;
                    const isOver = dragOverFieldIdx === index && draggedFieldIdx !== index;
                    const isCollapsed = expandedFieldId !== field.id;
                    const currentTypeInfo = getCurrentFieldTypeItem(field.type);
                    const CurrentIcon = currentTypeInfo.icon;
                    const hasCondition = Boolean(
                      (Array.isArray(field.condition?.rules) && field.condition.rules.length > 0) ||
                      field.condition?.dependsOnFieldId
                    );
                    const conditionCount = Array.isArray(field.condition?.rules) && field.condition.rules.length > 0
                      ? field.condition.rules.length
                      : (field.condition?.dependsOnFieldId ? 1 : 0);
                    const hasInvalidation = Boolean(
                      field.invalidationRule?.enabled !== false &&
                      Array.isArray(field.invalidationRule?.rules) &&
                      field.invalidationRule.rules.length > 0
                    );
                    const invalidationCount = field.invalidationRule?.rules?.length || 0;

                    return (
                      <React.Fragment key={field.id}>
                        {renderInlineInserter(index)}
                        <div
                          draggable={draggableFieldIdx === index}
                          onDragStart={(e) => {
                            if (draggableFieldIdx !== index) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.setData('text/plain', index.toString());
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedFieldIdx(index);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverFieldIdx !== index) {
                              setDragOverFieldIdx(index);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverFieldIdx === index) {
                              setDragOverFieldIdx(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropField(index);
                          }}
                          onDragEnd={() => {
                            setDraggedFieldIdx(null);
                            setDragOverFieldIdx(null);
                            setDragOverSectionIdx(null);
                            setDraggableFieldIdx(null);
                            setIsOverDropTrash(false);
                          }}
                          onClick={() => {
                            setActiveFieldId(field.id);
                            if (isCollapsed) {
                              setExpandedFieldId(field.id);
                            }
                          }}
                          className={`bg-white rounded-3xl border transition-all relative ${isCollapsed ? 'p-3.5 sm:p-4' : 'p-5 sm:p-6 space-y-4'
                            } ${isBeingDragged
                              ? 'opacity-35 scale-[0.98] border-dashed border-forest shadow-none bg-forest/5'
                              : isOver
                                ? 'border-forest ring-4 ring-forest/20 bg-forest/[0.03] -translate-y-1 shadow-lg'
                                : isActive
                                  ? 'border-forest shadow-md ring-2 ring-forest/10 border-l-8'
                                  : 'border-forest/15 shadow-2xs hover:border-forest/30'
                            }`}
                          style={isActive && !isBeingDragged ? { borderLeftColor: themeColor } : {}}
                        >
                          {isCollapsed ? (
                            /* Compact Collapsed Row */
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <div
                                  onMouseEnter={() => setDraggableFieldIdx(index)}
                                  onMouseLeave={() => {
                                    if (draggedFieldIdx === null) setDraggableFieldIdx(null);
                                  }}
                                  onTouchStart={() => setDraggableFieldIdx(index)}
                                  className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-forest/40 hover:text-forest transition-colors rounded-lg hover:bg-forest/5 flex items-center justify-center shrink-0"
                                  title="Arrastrar para reorganizar pregunta"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-forest/40 font-mono shrink-0">{index + 1}.</span>
                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold text-forest truncate block">
                                    {field.label || 'Pregunta sin título'}
                                  </span>
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                                  <span className="px-2.5 py-1 rounded-xl bg-forest/5 border border-forest/15 text-forest font-semibold text-[11px] flex items-center gap-1.5">
                                    <CurrentIcon className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                                    <span>{currentTypeInfo.label}</span>
                                  </span>
                                  {field.required && (
                                    <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                                      Obligatorio
                                    </span>
                                  )}
                                  {hasCondition && (
                                    <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      {conditionCount} Mostrar si
                                    </span>
                                  )}
                                  {hasInvalidation && (
                                    <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3" />
                                      {invalidationCount} Invalidar si
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quick Actions in Collapsed Row */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveField(index, 'up');
                                  }}
                                  disabled={index === 0}
                                  className="p-1.5 rounded-xl hover:bg-forest/10 text-forest disabled:opacity-30 transition-colors"
                                  title="Mover arriba"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveField(index, 'down');
                                  }}
                                  disabled={index === currentSection.fields.length - 1}
                                  className="p-1.5 rounded-xl hover:bg-forest/10 text-forest disabled:opacity-30 transition-colors"
                                  title="Mover abajo"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateField(field, index);
                                  }}
                                  className="p-1.5 rounded-xl hover:bg-forest/10 text-forest transition-colors"
                                  title="Duplicar pregunta"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveField(field.id);
                                  }}
                                  className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                                  title="Eliminar pregunta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFieldCollapse(field.id);
                                  }}
                                  className="p-1.5 rounded-xl bg-forest/5 hover:bg-forest/15 text-forest transition-all flex items-center justify-center cursor-pointer ml-0.5"
                                  title="Expandir configuración de la pregunta"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Top Row: Drag Handle, Question Title & Field Type Selector */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <div
                                    onMouseEnter={() => setDraggableFieldIdx(index)}
                                    onMouseLeave={() => {
                                      if (draggedFieldIdx === null) setDraggableFieldIdx(null);
                                    }}
                                    onTouchStart={() => setDraggableFieldIdx(index)}
                                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-forest/40 hover:text-forest transition-colors rounded-lg hover:bg-forest/5 flex items-center justify-center shrink-0"
                                    title="Arrastrar para reorganizar pregunta"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-bold text-forest/40 font-mono shrink-0">{index + 1}.</span>
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                    placeholder="Escribe la pregunta o texto del campo..."
                                    className="w-full text-sm font-bold text-forest bg-transparent border-b border-transparent hover:border-forest/20 focus:border-forest pb-0.5 outline-none"
                                  />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Custom Field Type Choice Popover */}
                                  <div className="relative shrink-0" data-field-type-dropdown>
                                    {(() => {
                                      const isOpen = openFieldTypeDropdownId === field.id;

                                      return (
                                        <>
                                          <button
                                            type="button"
                                            disabled
                                            className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-400 font-semibold flex items-center gap-2 cursor-not-allowed opacity-80"
                                            title="El tipo de campo no se puede modificar. Elimina este campo y crea uno nuevo."
                                          >
                                            <CurrentIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{currentTypeInfo.label}</span>
                                          </button>

                                          {isOpen && (
                                            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-forest/15 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto custom-scrollbar space-y-2">
                                              {FIELD_TYPE_GROUPS.map((grp) => (
                                                <div key={grp.group} className="space-y-0.5">
                                                  <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    {grp.group}
                                                  </div>
                                                  {grp.items.map((item) => {
                                                    const ItemIcon = item.icon;
                                                    const isSelected = field.type === item.type;
                                                    return (
                                                      <button
                                                        key={item.type}
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleUpdateField(field.id, {
                                                            type: item.type,
                                                            options: (item.type === 'single_choice' || item.type === 'multiple_choice') && (!field.options || field.options.length === 0)
                                                              ? ['Opción 1', 'Opción 2']
                                                              : field.options
                                                          });
                                                          setOpenFieldTypeDropdownId(null);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${isSelected
                                                          ? 'bg-forest text-white shadow-xs'
                                                          : 'text-slate-700 hover:bg-forest/5 hover:text-forest'
                                                          }`}
                                                      >
                                                        <div className="flex items-center gap-2">
                                                          <ItemIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-forest/70'}`} />
                                                          <span>{item.label}</span>
                                                        </div>
                                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* Collapse Button in expanded view */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFieldCollapse(field.id);
                                    }}
                                    className="p-1.5 rounded-xl hover:bg-forest/10 text-forest transition-all cursor-pointer"
                                    title="Colapsar pregunta"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Field Input Content & Specific Configurations */}
                              <div className="space-y-3">
                                {/* Options Manager (for radio/check) */}
                                {(field.type === 'single_choice' || field.type === 'multiple_choice') && (
                                  <div className="space-y-2 pt-1">
                                    {(field.options || []).map((opt, optIdx) => (
                                      <div key={optIdx} className="flex items-center gap-2.5">
                                        {field.type === 'single_choice' ? (
                                          <Radio className="w-4 h-4 text-forest/40 shrink-0" />
                                        ) : (
                                          <CheckSquare className="w-4 h-4 text-forest/40 shrink-0" />
                                        )}
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleUpdateOption(field.id, optIdx, e.target.value)}
                                          className="w-full text-xs text-forest bg-forest/5 hover:bg-forest/10 focus:bg-white border border-forest/10 rounded-xl px-3 py-1.5 outline-none focus:ring-1 focus:ring-forest/30"
                                        />
                                        {(field.options?.length || 0) > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveOption(field.id, optIdx)}
                                            className="p-1 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}

                                    <button
                                      type="button"
                                      onClick={() => handleAddOption(field.id)}
                                      className="text-xs text-forest font-semibold hover:underline flex items-center gap-1 pt-1"
                                    >
                                      <Plus className="w-3 h-3 text-forest" />
                                      <span>Agregar otra opción</span>
                                    </button>
                                  </div>
                                )}

                                {/* Poll Config Editor */}
                                {field.type === 'poll' && (
                                  <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-4 text-xs">
                                    {/* Options list */}
                                    <div className="space-y-2.5">
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
                                              className="w-full text-xs font-bold text-forest bg-forest/5 focus:bg-white border border-forest/10 rounded-lg px-2.5 py-1 outline-none"
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
                                            className="w-full text-[11px] text-slate-600 bg-forest/5 focus:bg-white border border-forest/10 rounded-lg px-2.5 py-1 outline-none resize-none"
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
                                        <Plus className="w-3 h-3 text-forest" />
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
                                        <span className="font-semibold text-slate-700">Ver resultados al enviar:</span>
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

                                {/* Phone Country Code Config */}
                                {field.type === 'phone' && (
                                  <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-forest block">Máscara y Código de País por Defecto</span>
                                      <span className="text-[10px] font-mono text-muted-foreground">Inicia con +</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <select
                                        value={field.defaultCountryCode || '+52'}
                                        onChange={(e) => handleUpdateField(field.id, {
                                          defaultCountryCode: e.target.value
                                        })}
                                        className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1.5 text-xs text-forest font-semibold"
                                      >
                                        <option value="+52">🇲🇽 México (+52)</option>
                                        <option value="+1">🇺🇸 Estados Unidos (+1)</option>
                                        <option value="+1">🇨🇦 Canadá (+1)</option>
                                        <option value="+57">🇨🇴 Colombia (+57)</option>
                                        <option value="+54">🇦🇷 Argentina (+54)</option>
                                        <option value="+34">🇪🇸 España (+34)</option>
                                        <option value="+56">🇨🇱 Chile (+56)</option>
                                        <option value="+51">🇵🇪 Perú (+51)</option>
                                        <option value="+593">🇪🇨 Ecuador (+593)</option>
                                        <option value="+502">🇬🇹 Guatemala (+502)</option>
                                        <option value="+506">🇨🇷 Costa Rica (+506)</option>
                                        <option value="+507">🇵🇦 Panamá (+507)</option>
                                        <option value="+598">🇺🇾 Uruguay (+598)</option>
                                        <option value="+58">🇻🇪 Venezuela (+58)</option>
                                        <option value="+55">🇧🇷 Brasil (+55)</option>
                                        <option value="+">🌐 Solo prefijo (+)</option>
                                      </select>
                                      <input
                                        type="text"
                                        value={field.defaultCountryCode || '+52'}
                                        onChange={(e) => {
                                          let val = e.target.value.replace(/[^\d+]/g, '');
                                          if (!val.startsWith('+')) val = '+' + val.replace(/\+/g, '');
                                          handleUpdateField(field.id, { defaultCountryCode: val });
                                        }}
                                        placeholder="Código personalizado ej. +52"
                                        className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1.5 text-xs text-forest font-mono"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* CURP Official Verification Config */}
                                {field.type === 'curp' && (
                                  <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-3 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-forest block">Verificación Oficial</span>
                                      <span className="text-[10px] font-mono text-muted-foreground">RENAPO / GOB.mx</span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                      <input
                                        type="checkbox"
                                        checked={!!field.verifyCurp}
                                        onChange={(e) => handleUpdateField(field.id, {
                                          verifyCurp: e.target.checked,
                                          curpTimeoutSeconds: field.curpTimeoutSeconds || 20,
                                          curpFallbackStrategy: field.curpFallbackStrategy || 'manual_fields',
                                          curpFallbackFields: field.curpFallbackFields || ['firstName', 'paternalLastName', 'maternalLastName']
                                        })}
                                        className="rounded-sm border-forest/30 text-forest focus:ring-forest-light"
                                      />
                                      <span>Verificar contra fuentes oficiales del gobierno (GOB.mx)</span>
                                    </label>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                      Autocompleta los datos del ciudadano y descarga el PDF oficial. Tiempo de espera configurable (Recomendado: 20 seg).
                                    </p>

                                    {field.verifyCurp && (
                                      <div className="mt-3 pt-3 border-t border-forest/10 space-y-3.5">
                                        <div>
                                          <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                              <label className="font-bold text-forest block text-[11px]">
                                                Tiempo de espera límite:
                                              </label>
                                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded-md">
                                                Recomendado: 20s
                                              </span>
                                            </div>
                                            <span className="font-mono font-bold text-[11px] text-forest bg-forest/10 px-2 py-0.5 rounded-md">
                                              {field.curpTimeoutSeconds || 20} segundos
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2.5">
                                            <input
                                              type="range"
                                              min={5}
                                              max={60}
                                              step={1}
                                              value={field.curpTimeoutSeconds || 20}
                                              onChange={(e) => handleUpdateField(field.id, { curpTimeoutSeconds: Number(e.target.value) })}
                                              className="flex-1 accent-forest cursor-pointer"
                                            />
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="number"
                                                min={5}
                                                max={60}
                                                value={field.curpTimeoutSeconds || 20}
                                                onChange={(e) => handleUpdateField(field.id, { curpTimeoutSeconds: Math.max(5, Math.min(60, Number(e.target.value))) })}
                                                className="w-14 bg-white border border-forest/20 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-forest"
                                              />
                                              <span className="text-[10px] text-muted-foreground font-semibold">seg</span>
                                            </div>
                                          </div>
                                          <p className="text-[9.5px] text-muted-foreground mt-1">
                                            💡 <strong>Nota:</strong> Los servidores de RENAPO suelen responder aproximadamente entre 20 y 60 segundos. Si la consulta tarda más de este tiempo, se activará la estrategia de captura asistida seleccionada abajo.
                                          </p>
                                        </div>

                                        <div>
                                          <label className="font-bold text-forest block mb-1.5 text-[11px]">
                                            Estrategia en caso de fallo o tiempo excedido:
                                          </label>
                                          <div className="space-y-1.5">
                                            <label className="flex items-start gap-2 cursor-pointer text-slate-700">
                                              <input
                                                type="radio"
                                                name={`curpFallback_${field.id}`}
                                                checked={field.curpFallbackStrategy !== 'silent_pass'}
                                                onChange={() => handleUpdateField(field.id, { curpFallbackStrategy: 'manual_fields' })}
                                                className="mt-0.5 text-forest focus:ring-forest-light"
                                              />
                                              <div>
                                                <span className="font-semibold block text-[11px]">Llenado asistido de datos faltantes (Recomendado)</span>
                                                <span className="text-[10px] text-muted-foreground block">
                                                  Calcula fecha/sexo/estado del CURP y pide al usuario rellenar los nombres configurados.
                                                </span>
                                              </div>
                                            </label>

                                            <label className="flex items-start gap-2 cursor-pointer text-slate-700">
                                              <input
                                                type="radio"
                                                name={`curpFallback_${field.id}`}
                                                checked={field.curpFallbackStrategy === 'silent_pass'}
                                                onChange={() => handleUpdateField(field.id, { curpFallbackStrategy: 'silent_pass' })}
                                                className="mt-0.5 text-forest focus:ring-forest-light"
                                              />
                                              <div>
                                                <span className="font-semibold block text-[11px]">Avanzar silenciosamente si el formato es válido</span>
                                                <span className="text-[10px] text-muted-foreground block">
                                                  Solo verifica la estructura de 18 caracteres y permite continuar sin bloquear ni pedir nombres.
                                                </span>
                                              </div>
                                            </label>
                                          </div>
                                        </div>

                                        {field.curpFallbackStrategy !== 'silent_pass' && (
                                          <div className="bg-white/70 p-3 rounded-xl border border-forest/10 space-y-2.5">
                                            <div>
                                              <label className="font-bold text-forest block text-[10.5px]">
                                                Campos a solicitar manualmente en fallback:
                                              </label>
                                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[11px] text-slate-700">
                                                {[
                                                  { key: 'firstName', label: 'Nombre(s)' },
                                                  { key: 'paternalLastName', label: 'Primer Apellido' },
                                                  { key: 'maternalLastName', label: 'Segundo Apellido' }
                                                ].map((fItem) => {
                                                  const activeFields = field.curpFallbackFields || ['firstName', 'paternalLastName', 'maternalLastName'];
                                                  const isChecked = activeFields.includes(fItem.key);
                                                  return (
                                                    <label key={fItem.key} className="flex items-center gap-1.5 cursor-pointer font-medium">
                                                      <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                          const newFields = e.target.checked
                                                            ? [...activeFields, fItem.key]
                                                            : activeFields.filter(k => k !== fItem.key);
                                                          handleUpdateField(field.id, { curpFallbackFields: newFields });
                                                        }}
                                                        className="rounded-sm text-forest focus:ring-forest-light"
                                                      />
                                                      <span>{fItem.label}</span>
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            <div className="pt-2 border-t border-forest/10">
                                              <span className="text-[10px] font-bold text-forest block mb-1">
                                                Datos inferidos automáticamente del CURP (No se preguntan):
                                              </span>
                                              <div className="flex flex-wrap gap-1.5">
                                                {[
                                                  'Fecha de Nacimiento',
                                                  'Edad Calculada',
                                                  'Sexo / Género',
                                                  'Entidad de Nacimiento'
                                                ].map((tag) => (
                                                  <span key={tag} className="text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                                    ✓ {tag}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Range / Slider Config */}
                                {field.type === 'range' && (
                                  <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-3 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-forest block">Configuración de Rango (Slider)</span>
                                      <span className="text-[10px] font-mono text-muted-foreground">Mínimo / Máximo / Paso</span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <div>
                                        <label className="text-[10px] font-bold text-forest block mb-1">Mínimo</label>
                                        <input
                                          type="number"
                                          value={field.min !== undefined ? field.min : 0}
                                          onChange={(e) => handleUpdateField(field.id, { min: Number(e.target.value) })}
                                          className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1.5 text-xs font-mono text-forest font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-forest block mb-1">Máximo</label>
                                        <input
                                          type="number"
                                          value={field.max !== undefined ? field.max : 10}
                                          onChange={(e) => handleUpdateField(field.id, { max: Number(e.target.value) })}
                                          className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1.5 text-xs font-mono text-forest font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-forest block mb-1">Paso (Step)</label>
                                        <input
                                          type="number"
                                          step="any"
                                          value={field.step !== undefined ? field.step : 1}
                                          onChange={(e) => handleUpdateField(field.id, { step: Number(e.target.value) || 1 })}
                                          className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1.5 text-xs font-mono text-forest font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-forest block mb-1">Unidad (ej. %, pts)</label>
                                        <input
                                          type="text"
                                          placeholder="pts, %, años..."
                                          value={field.unit || ''}
                                          onChange={(e) => handleUpdateField(field.id, { unit: e.target.value })}
                                          className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1.5 text-xs text-forest font-semibold"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-forest/10">
                                      <div>
                                        <label className="text-[10px] font-bold text-forest block mb-1">Etiqueta Mínimo (Opcional)</label>
                                        <input
                                          type="text"
                                          placeholder="Ej. Nada satisfecho / Bajo"
                                          value={field.minLabel || ''}
                                          onChange={(e) => handleUpdateField(field.id, { minLabel: e.target.value })}
                                          className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1.5 text-xs text-forest"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-forest block mb-1">Etiqueta Máximo (Opcional)</label>
                                        <input
                                          type="text"
                                          placeholder="Ej. Muy satisfecho / Alto"
                                          value={field.maxLabel || ''}
                                          onChange={(e) => handleUpdateField(field.id, { maxLabel: e.target.value })}
                                          className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1.5 text-xs text-forest"
                                        />
                                      </div>
                                    </div>

                                    <div className="pt-2">
                                      <div className="p-3 bg-white rounded-xl border border-forest/10 space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-forest">
                                          <span>Vista previa del control</span>
                                          <span className="px-2 py-0.5 rounded-md bg-forest/10 text-forest font-mono">
                                            {field.defaultValue ?? (field.min ?? 0)} {field.unit || ''}
                                          </span>
                                        </div>
                                        <input
                                          type="range"
                                          min={field.min ?? 0}
                                          max={field.max ?? 10}
                                          step={field.step ?? 1}
                                          value={field.defaultValue ?? (field.min ?? 0)}
                                          draggable={false}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onTouchStart={(e) => e.stopPropagation()}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onChange={(e) => handleUpdateField(field.id, { defaultValue: Number(e.target.value) })}
                                          className="w-full accent-forest cursor-pointer"
                                        />
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                                          <span>{field.minLabel || `${field.min ?? 0}`}</span>
                                          <span>{field.maxLabel || `${field.max ?? 10}`}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* File Upload Config */}
                                {field.type === 'file_upload' && (
                                  <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-2 text-xs">
                                    <span className="font-bold text-forest block">Configuración de Archivos</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={field.fileConfig?.accept || '.pdf,.jpg,.jpeg,.png'}
                                        onChange={(e) => handleUpdateField(field.id, {
                                          fileConfig: { ...(field.fileConfig || {}), accept: e.target.value }
                                        })}
                                        placeholder=".pdf,.jpg,.png"
                                        className="w-full bg-white border border-forest/15 rounded-xl px-3 py-1 text-xs text-forest font-mono"
                                      />
                                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-forest">
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
                                )}

                                {/* Signature Preview Mock */}
                                {field.type === 'signature' && (
                                  <div className="p-4 rounded-2xl bg-forest/5 border border-dashed border-forest/20 text-center space-y-1">
                                    <PenTool className="w-5 h-5 text-forest/40 mx-auto" />
                                    <span className="text-xs font-bold text-forest block">Lienzo de Firma Digital Activo</span>
                                  </div>
                                )}

                                {/* Terms & Conditions WYSIWYG Builder */}
                                {field.type === 'terms_consent' && (
                                  <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-forest/20 space-y-4 text-xs">
                                    <div className="flex items-center justify-between gap-2 border-b border-forest/10 pb-2.5">
                                      <div className="flex items-center gap-2">
                                        <FileCheck2 className="w-4 h-4 text-forest" />
                                        <span className="font-bold text-forest text-xs font-display">
                                          Contenido de Términos, Políticas o Consentimiento Legal
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                                        Editor WYSIWYG
                                      </span>
                                    </div>

                                    {/* WYSIWYG Editor for Terms Content */}
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-bold text-forest block">
                                        Redacción del Contenido a Leer:
                                      </label>
                                      <div className="bg-white rounded-xl border border-forest/20 overflow-hidden shadow-2xs">
                                        <RichTextEditor
                                          value={field.termsContent || ''}
                                          onChange={(html) => handleUpdateField(field.id, { termsContent: html })}
                                          placeholder="Escribe o pega aquí los términos y condiciones, política de privacidad, consentimiento de uso de imagen, reglamento institucional..."
                                          minHeight="180px"
                                        />
                                      </div>
                                    </div>

                                    {/* Checkbox Consent Label & Display Height */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                      <div className="sm:col-span-2 space-y-1">
                                        <label className="text-[11px] font-bold text-forest block">
                                          Texto de la casilla de aceptación:
                                        </label>
                                        <input
                                          type="text"
                                          value={field.consentLabel || ''}
                                          onChange={(e) => handleUpdateField(field.id, { consentLabel: e.target.value })}
                                          placeholder="He leído, comprendo y acepto los términos y condiciones anteriores"
                                          className="w-full bg-white border border-forest/20 rounded-xl px-3 py-2 text-xs text-forest focus:outline-none focus:ring-1 focus:ring-forest font-medium shadow-2xs"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-forest block">
                                          Altura de la caja con scroll:
                                        </label>
                                        <select
                                          value={field.maxHeight || '220px'}
                                          onChange={(e) => handleUpdateField(field.id, { maxHeight: e.target.value })}
                                          className="w-full bg-white border border-forest/20 rounded-xl px-3 py-2 text-xs text-forest font-semibold cursor-pointer shadow-2xs"
                                        >
                                          <option value="160px">Compacto (160px scroll)</option>
                                          <option value="220px">Estándar (220px scroll)</option>
                                          <option value="340px">Extendido (340px scroll)</option>
                                          <option value="none">Sin scroll (Texto completo)</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Richtext Field Builder Configuration */}
                                {field.type === 'richtext' && (
                                  <div className="p-4 sm:p-5 rounded-2xl bg-forest/5 border border-forest/20 space-y-3.5 text-xs">
                                    <div className="flex items-center justify-between gap-2 border-b border-forest/10 pb-2">
                                      <div className="flex items-center gap-2">
                                        <FileEdit className="w-4 h-4 text-forest" />
                                        <span className="font-bold text-forest text-xs font-display">
                                          Editor WYSIWYG para el Solicitante
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-forest bg-forest/10 px-2 py-0.5 rounded-md font-bold">
                                        Respuesta Enriquecida del Cliente
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-forest block">
                                          Placeholder / Guía visual:
                                        </label>
                                        <input
                                          type="text"
                                          value={field.placeholder || ''}
                                          onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                                          placeholder="Ej. Redacta tu ensayo o carta de motivos..."
                                          className="w-full bg-white border border-forest/20 rounded-xl px-3 py-2 text-xs text-forest focus:outline-none focus:ring-1 focus:ring-forest font-medium shadow-2xs"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-forest block">
                                          Altura mínima del editor:
                                        </label>
                                        <select
                                          value={field.maxHeight || '180px'}
                                          onChange={(e) => handleUpdateField(field.id, { maxHeight: e.target.value })}
                                          className="w-full bg-white border border-forest/20 rounded-xl px-3 py-2 text-xs text-forest font-semibold cursor-pointer shadow-2xs"
                                        >
                                          <option value="120px">Compacto (120px)</option>
                                          <option value="180px">Estándar (180px)</option>
                                          <option value="260px">Amplio (260px)</option>
                                          <option value="360px">Ensayo / Extenso (360px)</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Identity Verification (Compound KYC Flow) Builder Configuration */}
                                {field.type === 'identity_verification' && (() => {
                                  const currentAllowed: KycDocumentVariant[] = field.allowedIdTypes && field.allowedIdTypes.length > 0
                                    ? field.allowedIdTypes
                                    : ['id_card', 'passport', 'drivers_license'];
                                  const currentOrder = field.verificationOrder || 'document_first';
                                  const minScore = field.minMatchScore || 80;

                                  const toggleVariant = (variant: KycDocumentVariant) => {
                                    let next: KycDocumentVariant[];
                                    if (currentAllowed.includes(variant)) {
                                      if (currentAllowed.length === 1) return;
                                      next = currentAllowed.filter(v => v !== variant);
                                    } else {
                                      next = [...currentAllowed, variant];
                                    }
                                    handleUpdateField(field.id, { allowedIdTypes: next });
                                  };

                                  return (
                                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-4 text-xs">
                                      <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                          <span className="font-bold text-forest text-xs font-display">
                                            Flujo Compuesto de Verificación de Identidad (KYC)
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-emerald-900 bg-white border border-emerald-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shadow-2xs">
                                          <Sparkles className="w-3 h-3 text-emerald-600" /> 3 Pasos Integrados
                                        </span>
                                      </div>

                                      {/* Order selection */}
                                      <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-forest block">
                                          Orden de los Pasos de Verificación:
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateField(field.id, { verificationOrder: 'document_first' })}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${currentOrder === 'document_first'
                                              ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20 font-bold text-forest'
                                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100 text-slate-700'
                                              }`}
                                          >
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs">1° Documento ➔ 2° Selfie</span>
                                              {currentOrder === 'document_first' && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-normal">Captura primero el documento y luego la selfie con liveness.</p>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleUpdateField(field.id, { verificationOrder: 'selfie_first' })}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${currentOrder === 'selfie_first'
                                              ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20 font-bold text-forest'
                                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100 text-slate-700'
                                              }`}
                                          >
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs">1° Selfie ➔ 2° Documento</span>
                                              {currentOrder === 'selfie_first' && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-normal">Realiza primero la prueba de vida y luego el documento.</p>
                                          </button>
                                        </div>
                                      </div>

                                      {/* Document Type Variants Allowed */}
                                      <div className="space-y-2 pt-1">
                                        <label className="text-[11px] font-bold text-forest block">
                                          Documentos Aceptados:
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                          <button
                                            type="button"
                                            onClick={() => toggleVariant('id_card')}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${currentAllowed.includes('id_card')
                                              ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20 font-bold text-forest'
                                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100 text-slate-700'
                                              }`}
                                          >
                                            <p className="text-xs">Cédula / DNI / INE</p>
                                            {currentAllowed.includes('id_card') && (
                                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => toggleVariant('passport')}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${currentAllowed.includes('passport')
                                              ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20 font-bold text-forest'
                                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100 text-slate-700'
                                              }`}
                                          >
                                            <p className="text-xs">Pasaporte</p>
                                            {currentAllowed.includes('passport') && (
                                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => toggleVariant('drivers_license')}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${currentAllowed.includes('drivers_license')
                                              ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20 font-bold text-forest'
                                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100 text-slate-700'
                                              }`}
                                          >
                                            <p className="text-xs">Licencia Conducir</p>
                                            {currentAllowed.includes('drivers_license') && (
                                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Match threshold slider */}
                                      <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[11px] font-bold text-forest block">
                                            Umbral de Coincidencia Facial Mínimo:
                                          </label>
                                          <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                                            {minScore}%
                                          </span>
                                        </div>
                                        <input
                                          type="range"
                                          min="65"
                                          max="95"
                                          step="5"
                                          value={minScore}
                                          draggable={false}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onTouchStart={(e) => e.stopPropagation()}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onChange={(e) => handleUpdateField(field.id, { minMatchScore: Number(e.target.value) })}
                                          className="w-full accent-forest cursor-pointer"
                                        />
                                      </div>

                                      {/* OCR + LLM Data Extraction Configuration */}
                                      <div className="pt-3 border-t border-forest/10 space-y-3">
                                        {/* Toggle Header */}
                                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-forest/15 shadow-2xs">
                                          <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                                              <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-forest font-heading">
                                                  Extracción Inteligente de Datos (OCR + LLM)
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                                  IA
                                                </span>
                                              </div>
                                              <p className="text-[10.5px] text-muted-foreground">
                                                Extrae automáticamente nombres, CURP, fecha de nacimiento y documento tras la validación biométrica.
                                              </p>
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleUpdateField(field.id, {
                                              enableOcrExtraction: field.enableOcrExtraction === false ? true : false,
                                              ocrFallbackStrategy: field.ocrFallbackStrategy || 'manual_fields',
                                              ocrManualFields: field.ocrManualFields || ['full_name', 'birth_date', 'gender', 'curp', 'id_number']
                                            })}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${field.enableOcrExtraction !== false ? 'bg-forest' : 'bg-slate-300'
                                              }`}
                                          >
                                            <span
                                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${field.enableOcrExtraction !== false ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                          </button>
                                        </div>

                                        {/* Scenarios / Fallback Strategy Config when OCR is enabled */}
                                        {field.enableOcrExtraction !== false && (
                                          <div className="p-3.5 rounded-xl bg-white/80 border border-forest/15 space-y-3 animate-in fade-in duration-150">
                                            <div>
                                              <label className="font-bold text-forest block text-[11px] font-heading">
                                                Estrategia si falla la extracción OCR + LLM:
                                              </label>
                                              <p className="text-[10px] text-muted-foreground mb-2">
                                                Selecciona qué hacer cuando los datos no puedan ser extraídos del documento oficial presentado:
                                              </p>

                                              <div className="space-y-2">
                                                {/* Scenario 1: Mostrar campos para capturar manualmente */}
                                                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${(field.ocrFallbackStrategy || 'manual_fields') === 'manual_fields'
                                                  ? 'bg-forest/5 border-forest ring-1 ring-forest/20'
                                                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                                                  }`}>
                                                  <input
                                                    type="radio"
                                                    name={`ocrFallback_${field.id}`}
                                                    checked={(field.ocrFallbackStrategy || 'manual_fields') === 'manual_fields'}
                                                    onChange={() => handleUpdateField(field.id, { ocrFallbackStrategy: 'manual_fields' })}
                                                    className="mt-0.5 text-forest focus:ring-forest-light cursor-pointer"
                                                  />
                                                  <div className="space-y-0.5 min-w-0">
                                                    <span className="font-bold block text-xs text-forest">
                                                      1. Mostrar campos para capturar manualmente (Recomendado)
                                                    </span>
                                                    <span className="text-[10.5px] text-muted-foreground block leading-snug">
                                                      Despliega formularios en pantalla para que el usuario capture manualmente los datos faltantes o no legibles.
                                                    </span>
                                                  </div>
                                                </label>

                                                {/* Sub-options for manual fields if Scenario 1 is selected */}
                                                {(field.ocrFallbackStrategy || 'manual_fields') === 'manual_fields' && (
                                                  <div className="ml-6 p-2.5 rounded-lg bg-slate-50 border border-forest/10 space-y-1.5 animate-in fade-in duration-100">
                                                    <label className="font-bold text-forest block text-[10px]">
                                                      Campos que se solicitarán manualmente en fallback:
                                                    </label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                                                      {[
                                                        { key: 'full_name', label: 'Nombre y Apellidos' },
                                                        { key: 'birth_date', label: 'Fecha de Nacimiento' },
                                                        { key: 'gender', label: 'Género' },
                                                        { key: 'curp', label: 'CURP' },
                                                        { key: 'id_number', label: 'No. de Identificación Oficial' }
                                                      ].map((fItem) => {
                                                        const activeFields = field.ocrManualFields || ['full_name', 'birth_date', 'gender', 'curp', 'id_number'];
                                                        const isChecked = activeFields.includes(fItem.key);
                                                        return (
                                                          <label key={fItem.key} className="flex items-center gap-1.5 cursor-pointer font-medium">
                                                            <input
                                                              type="checkbox"
                                                              checked={isChecked}
                                                              onChange={(e) => {
                                                                const newFields = e.target.checked
                                                                  ? [...activeFields, fItem.key]
                                                                  : activeFields.filter(k => k !== fItem.key);
                                                                handleUpdateField(field.id, { ocrManualFields: newFields });
                                                              }}
                                                              className="rounded-sm text-forest focus:ring-forest cursor-pointer"
                                                            />
                                                            <span>{fItem.label}</span>
                                                          </label>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Scenario 2: Mostrar mensaje de error e invalidar verificación */}
                                                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${field.ocrFallbackStrategy === 'show_error_invalidate'
                                                  ? 'bg-forest/5 border-forest ring-1 ring-forest/20'
                                                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                                                  }`}>
                                                  <input
                                                    type="radio"
                                                    name={`ocrFallback_${field.id}`}
                                                    checked={field.ocrFallbackStrategy === 'show_error_invalidate'}
                                                    onChange={() => handleUpdateField(field.id, { ocrFallbackStrategy: 'show_error_invalidate' })}
                                                    className="mt-0.5 text-forest focus:ring-forest-light cursor-pointer"
                                                  />
                                                  <div className="space-y-0.5 min-w-0">
                                                    <span className="font-bold block text-xs text-forest">
                                                      2. Mostrar mensaje de error e invalidar verificación
                                                    </span>
                                                    <span className="text-[10.5px] text-muted-foreground block leading-snug">
                                                      Rechaza el paso y pide al usuario volver a capturar el documento con mejor iluminación o enfoque.
                                                    </span>
                                                  </div>
                                                </label>

                                                {/* Scenario 3: No hacer nada, fallo invisible y dejar pasar */}
                                                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${field.ocrFallbackStrategy === 'silent_pass'
                                                  ? 'bg-forest/5 border-forest ring-1 ring-forest/20'
                                                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                                                  }`}>
                                                  <input
                                                    type="radio"
                                                    name={`ocrFallback_${field.id}`}
                                                    checked={field.ocrFallbackStrategy === 'silent_pass'}
                                                    onChange={() => handleUpdateField(field.id, { ocrFallbackStrategy: 'silent_pass' })}
                                                    className="mt-0.5 text-forest focus:ring-forest-light cursor-pointer"
                                                  />
                                                  <div className="space-y-0.5 min-w-0">
                                                    <span className="font-bold block text-xs text-forest">
                                                      3. No hacer nada (Fallo invisible pero deja pasar)
                                                    </span>
                                                    <span className="text-[10.5px] text-muted-foreground block leading-snug">
                                                      No emite error ni interrumpe el flujo; el aspirante continúa con la verificación biométrica completada.
                                                    </span>
                                                  </div>
                                                </label>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Document Capture & Biometric KYC Builder Configuration */}
                                {field.type === 'document_capture' && (() => {
                                  const currentAllowed: KycDocumentVariant[] = field.allowedIdTypes && field.allowedIdTypes.length > 0
                                    ? field.allowedIdTypes
                                    : ['id_card', 'passport', 'drivers_license'];

                                  const toggleVariant = (variant: KycDocumentVariant) => {
                                    let next: KycDocumentVariant[];
                                    if (currentAllowed.includes(variant)) {
                                      if (currentAllowed.length === 1) {
                                        // Prevent unchecking all - keep at least one
                                        return;
                                      }
                                      next = currentAllowed.filter(v => v !== variant);
                                    } else {
                                      next = [...currentAllowed, variant];
                                    }
                                    handleUpdateField(field.id, { allowedIdTypes: next });
                                  };

                                  return (
                                    <div className="p-4 sm:p-5 rounded-2xl bg-forest/5 border border-forest/20 space-y-4 text-xs">
                                      <div className="flex items-center justify-between gap-2 border-b border-forest/10 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                          <span className="font-bold text-forest text-xs font-display">
                                            Captura de Documentos de Identidad / KYC
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-emerald-600" />
                                          {currentAllowed.length > 1 ? `${currentAllowed.length} Tipos Habilitados` : '1 Tipo Fijo'}
                                        </span>
                                      </div>

                                      {/* Document Type Variants Allowed */}
                                      <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-forest block">
                                          Documentos Aceptados (si marcas más de uno, el usuario elegirá cuál presentar):
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                          {/* ID Card / Cédula / DNI */}
                                          <button
                                            type="button"
                                            onClick={() => toggleVariant('id_card')}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${currentAllowed.includes('id_card')
                                              ? 'bg-white border-forest shadow-xs ring-1 ring-forest/20'
                                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100'
                                              }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                                <CreditCard className="w-4 h-4" />
                                              </div>
                                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${currentAllowed.includes('id_card')
                                                ? 'bg-forest border-forest text-white'
                                                : 'border-slate-300'
                                                }`}>
                                                {currentAllowed.includes('id_card') && <Check className="w-3 h-3 stroke-[3]" />}
                                              </div>
                                            </div>
                                            <div>
                                              <p className="font-bold text-slate-800 text-xs">INE / DNI / Cédula</p>
                                              <p className="text-[10px] text-muted-foreground">Requiere 2 caras (Frente y Reverso)</p>
                                            </div>
                                          </button>

                                          {/* Passport */}
                                          <button
                                            type="button"
                                            onClick={() => toggleVariant('passport')}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${currentAllowed.includes('passport')
                                              ? 'bg-white border-forest shadow-xs ring-1 ring-forest/20'
                                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100'
                                              }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                                                <BookOpen className="w-4 h-4" />
                                              </div>
                                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${currentAllowed.includes('passport')
                                                ? 'bg-forest border-forest text-white'
                                                : 'border-slate-300'
                                                }`}>
                                                {currentAllowed.includes('passport') && <Check className="w-3 h-3 stroke-[3]" />}
                                              </div>
                                            </div>
                                            <div>
                                              <p className="font-bold text-slate-800 text-xs">Pasaporte</p>
                                              <p className="text-[10px] text-muted-foreground">Requiere 1 cara (Página principal)</p>
                                            </div>
                                          </button>

                                          {/* Driver's License */}
                                          <button
                                            type="button"
                                            onClick={() => toggleVariant('drivers_license')}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${currentAllowed.includes('drivers_license')
                                              ? 'bg-white border-forest shadow-xs ring-1 ring-forest/20'
                                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100'
                                              }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                                                <Car className="w-4 h-4" />
                                              </div>
                                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${currentAllowed.includes('drivers_license')
                                                ? 'bg-forest border-forest text-white'
                                                : 'border-slate-300'
                                                }`}>
                                                {currentAllowed.includes('drivers_license') && <Check className="w-3 h-3 stroke-[3]" />}
                                              </div>
                                            </div>
                                            <div>
                                              <p className="font-bold text-slate-800 text-xs">Licencia de Conducir</p>
                                              <p className="text-[10px] text-muted-foreground">Requiere 2 caras (Frente y Reverso)</p>
                                            </div>
                                          </button>
                                        </div>
                                        <p className="text-[11px] text-forest/80 italic">
                                          💡 {currentAllowed.length > 1
                                            ? `El postulante verá un selector elegante con ${currentAllowed.length} opciones y se activará la captura correspondiente.`
                                            : `Se abrirá directamente la captura guiada para el tipo seleccionado.`}
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div className="space-y-1 sm:col-span-2">
                                          <label className="text-[11px] font-bold text-forest block">
                                            Instrucciones / Guía para la Fotografía:
                                          </label>
                                          <input
                                            type="text"
                                            value={field.documentGuide || ''}
                                            onChange={(e) => handleUpdateField(field.id, { documentGuide: e.target.value })}
                                            placeholder="Ej. Coloca el documento sobre una superficie plana, sin reflejos y con buena luz."
                                            className="w-full bg-white border border-forest/20 rounded-xl px-3 py-2 text-xs text-forest focus:outline-none focus:ring-1 focus:ring-forest font-medium shadow-2xs"
                                          />
                                        </div>
                                      </div>

                                      {/* OCR + LLM Data Extraction Configuration for Document Capture */}
                                      <div className="pt-3 border-t border-forest/10 space-y-3">
                                        {/* Toggle Header */}
                                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-forest/15 shadow-2xs">
                                          <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                                              <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-forest font-heading">
                                                  Extracción Inteligente de Datos (OCR + LLM)
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                                  IA
                                                </span>
                                              </div>
                                              <p className="text-[10.5px] text-muted-foreground">
                                                Extrae automáticamente nombres, CURP, fecha de nacimiento, calidad física y documento tras capturar la fotografía.
                                              </p>
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleUpdateField(field.id, {
                                              enableOcrExtraction: field.enableOcrExtraction === false ? true : false,
                                              ocrFallbackStrategy: field.ocrFallbackStrategy || 'manual_fields',
                                              ocrManualFields: field.ocrManualFields || ['full_name', 'birth_date', 'gender', 'curp', 'id_number']
                                            })}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${field.enableOcrExtraction !== false ? 'bg-forest' : 'bg-slate-300'
                                              }`}
                                          >
                                            <span
                                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${field.enableOcrExtraction !== false ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                          </button>
                                        </div>

                                        {/* Scenarios / Fallback Strategy Config when OCR is enabled */}
                                        {field.enableOcrExtraction !== false && (
                                          <div className="p-3.5 rounded-xl bg-white/80 border border-forest/15 space-y-3 animate-in fade-in duration-150">
                                            <div>
                                              <label className="font-bold text-forest block text-[11px] font-heading">
                                                Estrategia si falla la extracción OCR + LLM:
                                              </label>
                                              <p className="text-[10px] text-muted-foreground mb-2">
                                                Selecciona qué hacer cuando los datos no puedan ser extraídos del documento oficial capturado:
                                              </p>

                                              <div className="space-y-2">
                                                {/* Scenario 1: Mostrar campos para capturar manualmente */}
                                                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${(field.ocrFallbackStrategy || 'manual_fields') === 'manual_fields'
                                                  ? 'bg-forest/5 border-forest ring-1 ring-forest/20'
                                                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                                                  }`}>
                                                  <input
                                                    type="radio"
                                                    name={`ocrFallbackDoc_${field.id}`}
                                                    checked={(field.ocrFallbackStrategy || 'manual_fields') === 'manual_fields'}
                                                    onChange={() => handleUpdateField(field.id, { ocrFallbackStrategy: 'manual_fields' })}
                                                    className="mt-0.5 text-forest focus:ring-forest-light cursor-pointer"
                                                  />
                                                  <div className="space-y-0.5 min-w-0">
                                                    <span className="font-bold block text-xs text-forest">
                                                      1. Mostrar campos para capturar manualmente (Recomendado)
                                                    </span>
                                                    <span className="text-[10.5px] text-muted-foreground block leading-snug">
                                                      Despliega formularios en pantalla para que el usuario capture manualmente los datos faltantes o no legibles.
                                                    </span>
                                                  </div>
                                                </label>

                                                {/* Sub-options for manual fields if Scenario 1 is selected */}
                                                {(field.ocrFallbackStrategy || 'manual_fields') === 'manual_fields' && (
                                                  <div className="ml-6 p-2.5 rounded-lg bg-slate-50 border border-forest/10 space-y-1.5 animate-in fade-in duration-100">
                                                    <label className="font-bold text-forest block text-[10px]">
                                                      Campos que se solicitarán manualmente en fallback:
                                                    </label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                                                      {[
                                                        { key: 'full_name', label: 'Nombre y Apellidos' },
                                                        { key: 'birth_date', label: 'Fecha de Nacimiento' },
                                                        { key: 'gender', label: 'Género' },
                                                        { key: 'curp', label: 'CURP' },
                                                        { key: 'id_number', label: 'No. de Identificación Oficial' }
                                                      ].map((fItem) => {
                                                        const activeFields = field.ocrManualFields || ['full_name', 'birth_date', 'gender', 'curp', 'id_number'];
                                                        const isChecked = activeFields.includes(fItem.key);
                                                        return (
                                                          <label key={fItem.key} className="flex items-center gap-1.5 cursor-pointer font-medium">
                                                            <input
                                                              type="checkbox"
                                                              checked={isChecked}
                                                              onChange={(e) => {
                                                                const newFields = e.target.checked
                                                                  ? [...activeFields, fItem.key]
                                                                  : activeFields.filter(k => k !== fItem.key);
                                                                handleUpdateField(field.id, { ocrManualFields: newFields });
                                                              }}
                                                              className="rounded-sm text-forest focus:ring-forest cursor-pointer"
                                                            />
                                                            <span>{fItem.label}</span>
                                                          </label>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Scenario 2: Mostrar mensaje de error e invalidar verificación */}
                                                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${field.ocrFallbackStrategy === 'show_error_invalidate'
                                                  ? 'bg-forest/5 border-forest ring-1 ring-forest/20'
                                                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                                                  }`}>
                                                  <input
                                                    type="radio"
                                                    name={`ocrFallbackDoc_${field.id}`}
                                                    checked={field.ocrFallbackStrategy === 'show_error_invalidate'}
                                                    onChange={() => handleUpdateField(field.id, { ocrFallbackStrategy: 'show_error_invalidate' })}
                                                    className="mt-0.5 text-forest focus:ring-forest-light cursor-pointer"
                                                  />
                                                  <div className="space-y-0.5 min-w-0">
                                                    <span className="font-bold block text-xs text-forest">
                                                      2. Mostrar mensaje de error e invalidar captura
                                                    </span>
                                                    <span className="text-[10.5px] text-muted-foreground block leading-snug">
                                                      Rechaza la captura y pide al usuario volver a fotografiar el documento con mejor iluminación o enfoque.
                                                    </span>
                                                  </div>
                                                </label>

                                                {/* Scenario 3: No hacer nada, fallo invisible y dejar pasar */}
                                                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${field.ocrFallbackStrategy === 'silent_pass'
                                                  ? 'bg-forest/5 border-forest ring-1 ring-forest/20'
                                                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                                                  }`}>
                                                  <input
                                                    type="radio"
                                                    name={`ocrFallbackDoc_${field.id}`}
                                                    checked={field.ocrFallbackStrategy === 'silent_pass'}
                                                    onChange={() => handleUpdateField(field.id, { ocrFallbackStrategy: 'silent_pass' })}
                                                    className="mt-0.5 text-forest focus:ring-forest-light cursor-pointer"
                                                  />
                                                  <div className="space-y-0.5 min-w-0">
                                                    <span className="font-bold block text-xs text-forest">
                                                      3. No hacer nada (Fallo invisible pero deja pasar)
                                                    </span>
                                                    <span className="text-[10.5px] text-muted-foreground block leading-snug">
                                                      No emite error ni interrumpe el flujo; el postulante continúa con el documento capturado.
                                                    </span>
                                                  </div>
                                                </label>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Composite Subfields Builder */}
                                {field.type === 'composite' && (
                                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4 text-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-amber-800" />
                                        <span className="font-bold text-amber-950 text-xs font-display">
                                          Estructura de Subcampos ({field.subfields?.length || 0})
                                        </span>
                                      </div>

                                      {/* Preset Buttons */}
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] text-amber-800 font-bold">Plantillas:</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateField(field.id, {
                                              label: 'Persona de Contacto',
                                              helpText: 'Datos de contacto para notificaciones y emergencias',
                                              subfields: [
                                                { id: `sub_${Date.now()}_1`, type: 'text', label: 'Nombre Completo', required: true, placeholder: 'Ej. María Pérez' },
                                                { id: `sub_${Date.now()}_2`, type: 'phone', label: 'Teléfono Celular', required: true, placeholder: '+52 998 000 0000' },
                                                { id: `sub_${Date.now()}_3`, type: 'email', label: 'Correo Electrónico', required: false, placeholder: 'contacto@ejemplo.com' },
                                                { id: `sub_${Date.now()}_4`, type: 'single_choice', label: 'Parentesco / Relación', required: true, options: ['Madre', 'Padre', 'Tutor Legal', 'Abuelo/a', 'Tío/a', 'Familiar', 'Otro'] }
                                              ]
                                            });
                                            toast.success('Plantilla "Persona de Contacto" aplicada');
                                          }}
                                          className="px-2 py-1 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 font-semibold text-[10px] shadow-2xs transition-colors"
                                        >
                                          👤 Contacto
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateField(field.id, {
                                              label: 'Dirección Domiciliaria',
                                              helpText: 'Ubicación física de residencia del alumno o tutor',
                                              subfields: [
                                                { id: `sub_${Date.now()}_1`, type: 'text', label: 'Calle y Número Ext / Int', required: true, placeholder: 'Av. Tulum 123, Mza 4' },
                                                { id: `sub_${Date.now()}_2`, type: 'text', label: 'Colonia / Fraccionamiento / SM', required: true, placeholder: 'SM 15' },
                                                { id: `sub_${Date.now()}_3`, type: 'text', label: 'Ciudad / Municipio', required: true, placeholder: 'Cancún, Benito Juárez' },
                                                { id: `sub_${Date.now()}_4`, type: 'text', label: 'Código Postal', required: false, placeholder: '77500' }
                                              ]
                                            });
                                            toast.success('Plantilla "Dirección Domiciliaria" aplicada');
                                          }}
                                          className="px-2 py-1 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 font-semibold text-[10px] shadow-2xs transition-colors"
                                        >
                                          📍 Dirección
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateField(field.id, {
                                              label: 'Información Laboral',
                                              helpText: 'Ocupación y lugar de trabajo del tutor responsable',
                                              subfields: [
                                                { id: `sub_${Date.now()}_1`, type: 'text', label: 'Empresa o Institución', required: true, placeholder: 'Nombre de la empresa' },
                                                { id: `sub_${Date.now()}_2`, type: 'text', label: 'Puesto u Ocupación', required: true, placeholder: 'Ej. Ingeniero de Software' },
                                                { id: `sub_${Date.now()}_3`, type: 'phone', label: 'Teléfono de Oficina / Ext.', required: false, placeholder: '+52 998 000 0000 ext 12' }
                                              ]
                                            });
                                            toast.success('Plantilla "Información Laboral" aplicada');
                                          }}
                                          className="px-2 py-1 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 font-semibold text-[10px] shadow-2xs transition-colors"
                                        >
                                          💼 Laboral
                                        </button>
                                      </div>
                                    </div>

                                    {/* Subfields list */}
                                    <div className="space-y-2.5">
                                      {(field.subfields || []).map((sub, subIdx) => (
                                        <div key={sub.id || subIdx} className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2.5">
                                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">

                                            {/* Label input */}
                                            <div className="sm:col-span-4 space-y-1">
                                              <label className="text-[10px] font-bold text-amber-950 block">Etiqueta del subcampo</label>
                                              <input
                                                type="text"
                                                value={sub.label}
                                                onChange={(e) => {
                                                  const updated = [...(field.subfields || [])];
                                                  updated[subIdx] = { ...updated[subIdx], label: e.target.value };
                                                  handleUpdateField(field.id, { subfields: updated });
                                                }}
                                                placeholder="Nombre del subcampo"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
                                              />
                                            </div>

                                            {/* Type selector */}
                                            <div className="sm:col-span-3 space-y-1">
                                              <label className="text-[10px] font-bold text-amber-950 block">Tipo</label>
                                              <select
                                                value={sub.type}
                                                disabled
                                                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 font-semibold cursor-not-allowed opacity-80 focus:outline-none"
                                                title="El tipo de subcampo no se puede modificar. Elimina este subcampo y crea uno nuevo."
                                              >
                                                <option value="text">Texto Corto</option>
                                                <option value="phone">Teléfono</option>
                                                <option value="email">Email</option>
                                                <option value="textarea">Texto Largo</option>
                                                <option value="single_choice">Selección Única (Dropdown/Radio)</option>
                                                <option value="multiple_choice">Casillas Múltiples</option>
                                                <option value="date">Fecha</option>
                                                <option value="integer">Número Entero</option>
                                                <option value="boolean">Sí / No</option>
                                              </select>
                                            </div>

                                            {/* Placeholder input */}
                                            <div className="sm:col-span-3 space-y-1">
                                              <label className="text-[10px] font-bold text-amber-950 block">Placeholder / Guía</label>
                                              <input
                                                type="text"
                                                value={sub.placeholder || ''}
                                                onChange={(e) => {
                                                  const updated = [...(field.subfields || [])];
                                                  updated[subIdx] = { ...updated[subIdx], placeholder: e.target.value };
                                                  handleUpdateField(field.id, { subfields: updated });
                                                }}
                                                placeholder="Ej. Escribe aquí..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
                                              />
                                            </div>

                                            {/* Required & Actions */}
                                            <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-4 sm:pt-4">
                                              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-amber-950 select-none">
                                                <input
                                                  type="checkbox"
                                                  checked={!!sub.required}
                                                  onChange={(e) => {
                                                    const updated = [...(field.subfields || [])];
                                                    updated[subIdx] = { ...updated[subIdx], required: e.target.checked };
                                                    handleUpdateField(field.id, { subfields: updated });
                                                  }}
                                                  className="w-3.5 h-3.5 rounded text-amber-700 accent-amber-700"
                                                />
                                                <span>Req.</span>
                                              </label>

                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  const subLabel = sub.label?.trim() || 'este subcampo';
                                                  const isConfirmed = await confirm({
                                                    title: '¿Eliminar subcampo?',
                                                    description: `¿Estás seguro de que deseas eliminar el subcampo "${subLabel}"?`,
                                                    confirmText: 'Sí, eliminar',
                                                    cancelText: 'Cancelar',
                                                    variant: 'danger',
                                                    icon: 'trash'
                                                  });
                                                  if (!isConfirmed) return;
                                                  const updated = (field.subfields || []).filter((_, idx) => idx !== subIdx);
                                                  handleUpdateField(field.id, { subfields: updated });
                                                }}
                                                className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="Eliminar subcampo"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Options editor if subfield is single_choice or multiple_choice */}
                                          {(sub.type === 'single_choice' || sub.type === 'multiple_choice') && (
                                            <div className="pt-2 pl-1 border-t border-slate-100 space-y-1.5">
                                              <span className="text-[10px] font-bold text-amber-950 block">Opciones del menú:</span>
                                              <div className="flex flex-wrap gap-1.5">
                                                {(sub.options || []).map((opt, optIdx) => (
                                                  <div key={optIdx} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                                    <input
                                                      type="text"
                                                      value={opt}
                                                      onChange={(e) => {
                                                        const updatedOpts = [...(sub.options || [])];
                                                        updatedOpts[optIdx] = e.target.value;
                                                        const updatedSubfields = [...(field.subfields || [])];
                                                        updatedSubfields[subIdx] = { ...updatedSubfields[subIdx], options: updatedOpts };
                                                        handleUpdateField(field.id, { subfields: updatedSubfields });
                                                      }}
                                                      className="bg-transparent text-[11px] text-slate-800 font-semibold focus:outline-none w-24"
                                                    />
                                                    {(sub.options?.length || 0) > 1 && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const updatedOpts = (sub.options || []).filter((_, idx) => idx !== optIdx);
                                                          const updatedSubfields = [...(field.subfields || [])];
                                                          updatedSubfields[subIdx] = { ...updatedSubfields[subIdx], options: updatedOpts };
                                                          handleUpdateField(field.id, { subfields: updatedSubfields });
                                                        }}
                                                        className="text-slate-400 hover:text-rose-600"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const currentOpts = sub.options || [];
                                                    const updatedOpts = [...currentOpts, `Opción ${currentOpts.length + 1}`];
                                                    const updatedSubfields = [...(field.subfields || [])];
                                                    updatedSubfields[subIdx] = { ...updatedSubfields[subIdx], options: updatedOpts };
                                                    handleUpdateField(field.id, { subfields: updatedSubfields });
                                                  }}
                                                  className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] flex items-center gap-1 transition-colors"
                                                >
                                                  <Plus className="w-3 h-3" />
                                                  <span>Opción</span>
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentSubs = field.subfields || [];
                                        const newSub: FormFieldItem = {
                                          id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                                          type: 'text',
                                          label: `Subcampo ${currentSubs.length + 1}`,
                                          required: false,
                                          placeholder: 'Escribe aquí...'
                                        };
                                        handleUpdateField(field.id, { subfields: [...currentSubs, newSub] });
                                      }}
                                      className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Agregar Subcampo</span>
                                    </button>
                                  </div>
                                )}

                                {/* Schedule Event Configuration */}
                                {field.type === 'schedule_event' && (() => {
                                  const currentEventIds: string[] = Array.isArray(field.eventIds) && field.eventIds.length > 0
                                    ? field.eventIds
                                    : (field.eventId ? [field.eventId] : []);

                                  const linkedEvents = schoolEvents.filter(ev => currentEventIds.includes(ev.id));
                                  const unlinkedEvents = schoolEvents.filter(ev => !currentEventIds.includes(ev.id));

                                  const handleAddEvent = (evId: string) => {
                                    if (!evId) return;
                                    const nextIds = Array.from(new Set([...currentEventIds, evId]));
                                    const firstEv = schoolEvents.find(e => e.id === nextIds[0]);
                                    handleUpdateField(field.id, {
                                      eventIds: nextIds,
                                      eventId: nextIds[0],
                                      eventTitle: firstEv?.title,
                                      label: field.label === 'Pregunta sin título' || !field.label ? (firstEv?.title ? `Agendar: ${firstEv.title}` : field.label) : field.label
                                    });
                                  };

                                  const handleRemoveEvent = (evId: string) => {
                                    const nextIds = currentEventIds.filter(id => id !== evId);
                                    const firstEv = schoolEvents.find(e => e.id === nextIds[0]);
                                    handleUpdateField(field.id, {
                                      eventIds: nextIds,
                                      eventId: nextIds[0] || undefined,
                                      eventTitle: firstEv?.title || undefined
                                    });
                                  };

                                  return (
                                    <div className="p-4 sm:p-5 rounded-2xl bg-forest/5 border border-forest/20 space-y-3.5 text-xs">
                                      <div className="flex items-center justify-between gap-2 border-b border-forest/10 pb-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-forest" />
                                          <span className="font-bold text-forest text-xs font-display">
                                            Vinculación con Calendario Escolar ({linkedEvents.length} {linkedEvents.length === 1 ? 'evento vinculado' : 'eventos vinculados'})
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={loadSchoolEventsList}
                                          className="text-[10px] text-forest bg-forest/10 hover:bg-forest/20 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                          title="Recargar eventos del calendario"
                                        >
                                          <RefreshCw className={`w-3 h-3 ${loadingEvents ? 'animate-spin' : ''}`} />
                                          <span>Actualizar Lista</span>
                                        </button>
                                      </div>

                                      {/* Linked Events List */}
                                      <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-forest block">
                                          Eventos Vinculados a esta Agenda: <span className="text-rose-500 font-bold">*</span>
                                        </label>

                                        {linkedEvents.length > 0 ? (
                                          <div className="space-y-2">
                                            {linkedEvents.map((ev, idx) => {
                                              const isSlots = ev.eventType === 'SLOT_BOOKING';
                                              return (
                                                <div key={ev.id} className="bg-white p-3.5 rounded-xl border border-forest/15 space-y-2 text-xs shadow-2xs">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <span className="w-5 h-5 rounded-full bg-forest/10 text-forest text-[10px] font-bold flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                      </span>
                                                      <span className="font-bold text-forest line-clamp-1">{ev.title}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSlots ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                        {isSlots ? `📅 Por Turnos (${ev.slots?.length || 0} turnos)` : '📢 Evento Abierto'}
                                                      </span>

                                                      <button
                                                        type="button"
                                                        onClick={() => handleRemoveEvent(ev.id)}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Desvincular este evento"
                                                      >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    </div>
                                                  </div>

                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-forest/10">
                                                    <div>
                                                      <span className="font-bold text-slate-700">Fecha: </span>
                                                      <span>{new Date(ev.startDateTime).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    </div>
                                                    {ev.location && (
                                                      <div>
                                                        <span className="font-bold text-slate-700">Ubicación: </span>
                                                        <span className="truncate">{ev.location}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 flex items-center gap-2">
                                            <Info className="w-4 h-4 shrink-0 text-amber-700" />
                                            <span>Selecciona al menos un evento para vincularlo a esta agenda.</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Add another event selector */}
                                      {unlinkedEvents.length > 0 && (
                                        <div className="space-y-1 pt-1">
                                          <label className="text-[10.5px] font-bold text-forest block">
                                            Agregar otro evento al mismo campo de agenda:
                                          </label>
                                          <select
                                            value=""
                                            onChange={(e) => {
                                              if (e.target.value) handleAddEvent(e.target.value);
                                            }}
                                            className="w-full bg-white border border-forest/20 rounded-xl px-3 py-2 text-xs text-forest font-semibold focus:outline-hidden focus:ring-2 focus:ring-forest/20 cursor-pointer shadow-2xs"
                                          >
                                            <option value="">-- Seleccionar evento para vincular --</option>
                                            {unlinkedEvents.map((ev) => (
                                              <option key={ev.id} value={ev.id}>
                                                + {ev.title} {ev.eventType === 'SLOT_BOOKING' ? `[Por Turnos - ${ev.slots?.length || 0} turnos]` : '[Evento Abierto]'} ({new Date(ev.startDateTime).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })})
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}

                                      {/* Selection Mode Option (When multiple events are linked) */}
                                      {linkedEvents.length > 1 && (
                                        <div className="pt-2 border-t border-forest/10 space-y-1.5">
                                          <label className="text-[11px] font-bold text-forest block">
                                            Modalidad de Agendamiento Múltiple:
                                          </label>
                                          <div className="space-y-1 text-slate-700 text-xs">
                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-forest/5 transition-colors">
                                              <input
                                                type="radio"
                                                name={`schedule_mode_${field.id}`}
                                                checked={field.scheduleSelectionMode !== 'choose_one'}
                                                onChange={() => handleUpdateField(field.id, { scheduleSelectionMode: 'all_required' })}
                                                className="text-forest focus:ring-forest"
                                              />
                                              <div>
                                                <span className="font-bold block text-[11px]">Agendar en TODOS los eventos vinculados (Recomendado)</span>
                                                <span className="text-[10px] text-muted-foreground block">El aspirante agendará su turno para cada uno de los eventos incluidos (ej. Entrevista + Taller).</span>
                                              </div>
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-forest/5 transition-colors">
                                              <input
                                                type="radio"
                                                name={`schedule_mode_${field.id}`}
                                                checked={field.scheduleSelectionMode === 'choose_one'}
                                                onChange={() => handleUpdateField(field.id, { scheduleSelectionMode: 'choose_one' })}
                                                className="text-forest focus:ring-forest"
                                              />
                                              <div>
                                                <span className="font-bold block text-[11px]">Elegir UNO de los eventos disponibles</span>
                                                <span className="text-[10px] text-muted-foreground block">El aspirante elige una de las alternativas disponibles según su conveniencia.</span>
                                              </div>
                                            </label>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Card Bottom Row: Left = Mostrar si y Invalidar si, Right = Actions & Required */}
                              <div className="pt-3 border-t border-forest/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                                {/* Left: Logic Triggers (Mostrar si / Invalidar si) */}
                                {(() => {
                                  const hasCondition = Boolean(
                                    (Array.isArray(field.condition?.rules) && field.condition.rules.length > 0) ||
                                    field.condition?.dependsOnFieldId
                                  );
                                  const conditionCount = Array.isArray(field.condition?.rules) && field.condition.rules.length > 0
                                    ? field.condition.rules.length
                                    : (field.condition?.dependsOnFieldId ? 1 : 0);

                                  const hasInvalidation = Boolean(
                                    field.invalidationRule?.enabled !== false &&
                                    Array.isArray(field.invalidationRule?.rules) &&
                                    field.invalidationRule.rules.length > 0
                                  );
                                  const invalidationCount = field.invalidationRule?.rules?.length || 0;

                                  return (
                                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                                      {/* Button 1: Mostrar si */}
                                      <button
                                        type="button"
                                        onClick={() => setExpandedLogicPanel(
                                          expandedLogicPanel?.fieldId === field.id && expandedLogicPanel?.type === 'showIf'
                                            ? null
                                            : { fieldId: field.id, type: 'showIf' }
                                        )}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${hasCondition
                                          ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 ring-2 ring-purple-500/20'
                                          : 'bg-forest/5 text-forest/70 border-forest/10 hover:bg-forest/10 hover:text-forest'
                                          }`}
                                        title="Configurar cuándo mostrar u ocultar esta pregunta"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>
                                          {hasCondition
                                            ? `${conditionCount} Mostrar si`
                                            : 'Mostrar si'}
                                        </span>
                                      </button>

                                      {/* Button 2: Invalidar si */}
                                      <button
                                        type="button"
                                        onClick={() => setExpandedLogicPanel(
                                          expandedLogicPanel?.fieldId === field.id && expandedLogicPanel?.type === 'invalidateIf'
                                            ? null
                                            : { fieldId: field.id, type: 'invalidateIf' }
                                        )}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${hasInvalidation
                                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 ring-2 ring-rose-500/20'
                                          : 'bg-forest/5 text-forest/70 border-forest/10 hover:bg-forest/10 hover:text-forest'
                                          }`}
                                        title="Configurar reglas para invalidar este campo y bloquear el avance con mensaje de error"
                                      >
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span>
                                          {hasInvalidation
                                            ? `${invalidationCount} Invalidar si`
                                            : 'Invalidar si'}
                                        </span>
                                      </button>
                                    </div>
                                  );
                                })()}

                                {/* Right: Actions & Required Toggle */}
                                <div className="flex items-center gap-1.5 sm:gap-2">
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
                                    disabled={index === currentSection.fields.length - 1}
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

                              {/* PANEL 1: "Mostrar si" (Visibility Logic) */}
                              {expandedLogicPanel?.fieldId === field.id && expandedLogicPanel?.type === 'showIf' && (() => {
                                const prior = getPriorFields(field.id);
                                const currentRules: SingleFieldCondition[] = Array.isArray(field.condition?.rules) && field.condition.rules.length > 0
                                  ? field.condition.rules
                                  : (field.condition?.dependsOnFieldId ? [{
                                    id: 'r_legacy',
                                    dependsOnFieldId: field.condition.dependsOnFieldId,
                                    operator: field.condition.operator || 'equals',
                                    value: field.condition.value
                                  }] : []);
                                const currentLogic: ConditionLogic = field.condition?.logic || 'AND';

                                return (
                                  <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-4 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 font-bold text-purple-900">
                                        <Eye className="w-4 h-4 text-purple-700" />
                                        <span>Reglas para "Mostrar si" (Visibilidad)</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedLogicPanel(null)}
                                        className="p-1 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {prior.length === 0 ? (
                                      <p className="text-xs text-purple-800 bg-white/80 p-3 rounded-xl border border-purple-100">
                                        Esta es la primera pregunta del formulario. Para condicionar su visibilidad deben existir preguntas previas en el flujo.
                                      </p>
                                    ) : (
                                      <div className="space-y-3.5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                          <p className="text-xs text-purple-900 font-medium">
                                            Mostrar <strong>"{field.label || 'esta pregunta'}"</strong> cuando:
                                          </p>

                                          {/* Logic Selector Toggle (AND / OR) */}
                                          {currentRules.length > 1 && (
                                            <div className="inline-flex items-center p-0.5 rounded-xl bg-purple-200/70 text-[11px] font-bold self-start sm:self-auto shadow-2xs">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  handleUpdateField(field.id, {
                                                    condition: {
                                                      logic: 'AND',
                                                      rules: currentRules,
                                                      dependsOnFieldId: currentRules[0]?.dependsOnFieldId,
                                                      operator: currentRules[0]?.operator,
                                                      value: currentRules[0]?.value
                                                    }
                                                  });
                                                }}
                                                className={`px-2.5 py-1 rounded-lg transition-all ${currentLogic === 'AND'
                                                  ? 'bg-purple-700 text-white shadow-xs'
                                                  : 'text-purple-900 hover:bg-purple-300/50'
                                                  }`}
                                              >
                                                Cumplir TODAS (AND)
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  handleUpdateField(field.id, {
                                                    condition: {
                                                      logic: 'OR',
                                                      rules: currentRules,
                                                      dependsOnFieldId: currentRules[0]?.dependsOnFieldId,
                                                      operator: currentRules[0]?.operator,
                                                      value: currentRules[0]?.value
                                                    }
                                                  });
                                                }}
                                                className={`px-2.5 py-1 rounded-lg transition-all ${currentLogic === 'OR'
                                                  ? 'bg-purple-700 text-white shadow-xs'
                                                  : 'text-purple-900 hover:bg-purple-300/50'
                                                  }`}
                                              >
                                                Cumplir CUALQUIERA (OR)
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {currentRules.length === 0 ? (
                                          <div className="p-4 rounded-xl bg-white/80 border border-purple-100 text-center space-y-2">
                                            <p className="text-xs text-purple-800">
                                              Esta pregunta se muestra siempre. Agrega reglas para condicionar cuándo debe aparecer.
                                            </p>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const firstPrior = prior[0];
                                                const newRule: SingleFieldCondition = {
                                                  id: `r_${Date.now()}`,
                                                  dependsOnFieldId: firstPrior.id,
                                                  operator: 'equals',
                                                  value: firstPrior.type === 'boolean' ? 'Sí' : (firstPrior.options?.[0] || '')
                                                };
                                                handleUpdateField(field.id, {
                                                  condition: {
                                                    logic: 'AND',
                                                    rules: [newRule],
                                                    dependsOnFieldId: newRule.dependsOnFieldId,
                                                    operator: newRule.operator,
                                                    value: newRule.value
                                                  }
                                                });
                                              }}
                                              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                              <span>Agregar Regla de Visibilidad</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            {currentRules.map((rule, rIdx) => {
                                              const refField = prior.find(f => f.id === rule.dependsOnFieldId) || prior[0];
                                              const refType = refField?.type;

                                              return (
                                                <div key={rule.id || rIdx} className="space-y-2">
                                                  {rIdx > 0 && (
                                                    <div className="flex items-center justify-center -my-1">
                                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${currentLogic === 'AND'
                                                        ? 'bg-purple-700 text-white'
                                                        : 'bg-amber-600 text-white'
                                                        }`}>
                                                        {currentLogic === 'AND' ? 'Y (AND)' : 'O (OR)'}
                                                      </span>
                                                    </div>
                                                  )}

                                                  <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-2">
                                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                                      <div className="sm:col-span-5 space-y-1">
                                                        <label className="text-[10px] font-bold text-purple-900 block">
                                                          {rIdx === 0 ? 'Si la pregunta' : 'Y si la pregunta'}
                                                        </label>
                                                        <select
                                                          value={rule.dependsOnFieldId}
                                                          onChange={(e) => {
                                                            const targetId = e.target.value;
                                                            const targetRef = prior.find(f => f.id === targetId);
                                                            const defaultVal = targetRef?.type === 'boolean'
                                                              ? 'Sí'
                                                              : (targetRef?.options && targetRef.options.length > 0 ? targetRef.options[0] : '');

                                                            const updated = [...currentRules];
                                                            updated[rIdx] = {
                                                              ...updated[rIdx],
                                                              dependsOnFieldId: targetId,
                                                              operator: 'equals',
                                                              value: defaultVal
                                                            };
                                                            handleUpdateField(field.id, {
                                                              condition: {
                                                                logic: currentLogic,
                                                                rules: updated,
                                                                dependsOnFieldId: updated[0]?.dependsOnFieldId,
                                                                operator: updated[0]?.operator,
                                                                value: updated[0]?.value
                                                              }
                                                            });
                                                          }}
                                                          className="w-full bg-slate-50 border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-purple-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-300 cursor-pointer truncate"
                                                        >
                                                          {prior.map((pf) => (
                                                            <option key={pf.id} value={pf.id}>
                                                              {pf.label} ({pf.type})
                                                            </option>
                                                          ))}
                                                        </select>
                                                      </div>

                                                      <div className="sm:col-span-3 space-y-1">
                                                        <label className="text-[10px] font-bold text-purple-900 block">Operador</label>
                                                        <select
                                                          value={rule.operator}
                                                          onChange={(e) => {
                                                            const updated = [...currentRules];
                                                            updated[rIdx] = {
                                                              ...updated[rIdx],
                                                              operator: e.target.value as FieldConditionOperator
                                                            };
                                                            handleUpdateField(field.id, {
                                                              condition: {
                                                                logic: currentLogic,
                                                                rules: updated,
                                                                dependsOnFieldId: updated[0]?.dependsOnFieldId,
                                                                operator: updated[0]?.operator,
                                                                value: updated[0]?.value
                                                              }
                                                            });
                                                          }}
                                                          className="w-full bg-slate-50 border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-purple-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-300 cursor-pointer"
                                                        >
                                                          <option value="equals">Es igual a</option>
                                                          <option value="not_equals">No es igual a</option>
                                                          <option value="contains">Contiene</option>
                                                          <option value="not_contains">No contiene</option>
                                                          <option value="greater_than">&gt; Mayor que</option>
                                                          <option value="less_than">&lt; Menor que</option>
                                                          <option value="greater_than_or_equal">&ge; Mayor o igual que</option>
                                                          <option value="less_than_or_equal">&le; Menor o igual que</option>
                                                          <option value="is_filled">Tiene respuesta</option>
                                                          <option value="is_empty">Está vacía</option>
                                                        </select>
                                                      </div>

                                                      {rule.operator !== 'is_filled' && rule.operator !== 'is_empty' ? (
                                                        <div className="sm:col-span-3 space-y-1">
                                                          <label className="text-[10px] font-bold text-purple-900 block">Valor</label>
                                                          {refType === 'boolean' ? (
                                                            <select
                                                              value={rule.value || 'Sí'}
                                                              onChange={(e) => {
                                                                const updated = [...currentRules];
                                                                updated[rIdx] = { ...updated[rIdx], value: e.target.value };
                                                                handleUpdateField(field.id, {
                                                                  condition: {
                                                                    logic: currentLogic,
                                                                    rules: updated,
                                                                    dependsOnFieldId: updated[0]?.dependsOnFieldId,
                                                                    operator: updated[0]?.operator,
                                                                    value: updated[0]?.value
                                                                  }
                                                                });
                                                              }}
                                                              className="w-full bg-slate-50 border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-purple-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-300 cursor-pointer"
                                                            >
                                                              <option value="Sí">Sí</option>
                                                              <option value="No">No</option>
                                                            </select>
                                                          ) : refField?.options && refField.options.length > 0 ? (
                                                            <select
                                                              value={rule.value || refField.options[0]}
                                                              onChange={(e) => {
                                                                const updated = [...currentRules];
                                                                updated[rIdx] = { ...updated[rIdx], value: e.target.value };
                                                                handleUpdateField(field.id, {
                                                                  condition: {
                                                                    logic: currentLogic,
                                                                    rules: updated,
                                                                    dependsOnFieldId: updated[0]?.dependsOnFieldId,
                                                                    operator: updated[0]?.operator,
                                                                    value: updated[0]?.value
                                                                  }
                                                                });
                                                              }}
                                                              className="w-full bg-slate-50 border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-purple-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-300 cursor-pointer"
                                                            >
                                                              {refField.options.map((opt) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                              ))}
                                                            </select>
                                                          ) : (
                                                            <input
                                                              type="text"
                                                              value={rule.value || ''}
                                                              onChange={(e) => {
                                                                const updated = [...currentRules];
                                                                updated[rIdx] = { ...updated[rIdx], value: e.target.value };
                                                                handleUpdateField(field.id, {
                                                                  condition: {
                                                                    logic: currentLogic,
                                                                    rules: updated,
                                                                    dependsOnFieldId: updated[0]?.dependsOnFieldId,
                                                                    operator: updated[0]?.operator,
                                                                    value: updated[0]?.value
                                                                  }
                                                                });
                                                              }}
                                                              placeholder="Valor esperado..."
                                                              className="w-full bg-slate-50 border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-purple-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-300"
                                                            />
                                                          )}
                                                        </div>
                                                      ) : (
                                                        <div className="sm:col-span-3 flex items-center h-8 text-[11px] text-purple-700 italic font-medium">
                                                          (No requiere valor)
                                                        </div>
                                                      )}

                                                      <div className="sm:col-span-1 flex items-center justify-end pb-1">
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const updated = currentRules.filter((_, idx) => idx !== rIdx);
                                                            if (updated.length === 0) {
                                                              handleUpdateField(field.id, { condition: undefined });
                                                            } else {
                                                              handleUpdateField(field.id, {
                                                                condition: {
                                                                  logic: currentLogic,
                                                                  rules: updated,
                                                                  dependsOnFieldId: updated[0]?.dependsOnFieldId,
                                                                  operator: updated[0]?.operator,
                                                                  value: updated[0]?.value
                                                                }
                                                              });
                                                            }
                                                          }}
                                                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                                          title="Eliminar regla"
                                                        >
                                                          <Trash2 className="w-4 h-4" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}

                                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const firstPrior = prior[0];
                                                  const newRule: SingleFieldCondition = {
                                                    id: `r_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                                                    dependsOnFieldId: firstPrior.id,
                                                    operator: 'equals',
                                                    value: firstPrior.type === 'boolean' ? 'Sí' : (firstPrior.options?.[0] || '')
                                                  };
                                                  const updated = [...currentRules, newRule];
                                                  handleUpdateField(field.id, {
                                                    condition: {
                                                      logic: currentLogic,
                                                      rules: updated,
                                                      dependsOnFieldId: updated[0]?.dependsOnFieldId,
                                                      operator: updated[0]?.operator,
                                                      value: updated[0]?.value
                                                    }
                                                  });
                                                }}
                                                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Agregar otra regla ({currentLogic === 'AND' ? 'Y / AND' : 'O / OR'})</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  handleUpdateField(field.id, { condition: undefined });
                                                  setExpandedLogicPanel(null);
                                                }}
                                                className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                                              >
                                                Eliminar reglas de visibilidad
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* PANEL 2: "Invalidar si" (Invalidation & Blocking Logic) */}
                              {expandedLogicPanel?.fieldId === field.id && expandedLogicPanel?.type === 'invalidateIf' && (() => {
                                const prior = getPriorFields(field.id);
                                const currentRules: SingleInvalidationRule[] = field.invalidationRule?.rules || [];
                                const currentLogic: ConditionLogic = field.invalidationRule?.logic || 'AND';
                                const isCurp = field.type === 'curp';

                                return (
                                  <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-200 space-y-4 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 font-bold text-rose-950">
                                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                                        <span>Reglas para "Invalidar si" (Condiciones de Rechazo y Bloqueo)</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedLogicPanel(null)}
                                        className="p-1 rounded-lg text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <p className="text-xs text-rose-900/80 leading-relaxed">
                                      Si se cumplen estas reglas, el campo se marcará en color rojo como inválido, mostrará el mensaje de error y bloqueará el avance del aspirante.
                                    </p>

                                    <div className="space-y-3.5">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <p className="text-xs text-rose-950 font-bold">
                                          Invalidar y bloquear cuando:
                                        </p>

                                        {/* Logic Toggle */}
                                        {currentRules.length > 1 && (
                                          <div className="inline-flex items-center p-0.5 rounded-xl bg-rose-200/70 text-[11px] font-bold self-start sm:self-auto shadow-2xs">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleUpdateField(field.id, {
                                                  invalidationRule: {
                                                    ...field.invalidationRule,
                                                    enabled: true,
                                                    logic: 'AND'
                                                  }
                                                });
                                              }}
                                              className={`px-2.5 py-1 rounded-lg transition-all ${currentLogic === 'AND'
                                                ? 'bg-rose-700 text-white shadow-xs'
                                                : 'text-rose-900 hover:bg-rose-300/50'
                                                }`}
                                            >
                                              Cumplir TODAS (AND)
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleUpdateField(field.id, {
                                                  invalidationRule: {
                                                    ...field.invalidationRule,
                                                    enabled: true,
                                                    logic: 'OR'
                                                  }
                                                });
                                              }}
                                              className={`px-2.5 py-1 rounded-lg transition-all ${currentLogic === 'OR'
                                                ? 'bg-rose-700 text-white shadow-xs'
                                                : 'text-rose-900 hover:bg-rose-300/50'
                                                }`}
                                            >
                                              Cumplir CUALQUIERA (OR)
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {currentRules.length === 0 ? (
                                        <div className="p-4 rounded-xl bg-white/80 border border-rose-200 text-center space-y-2">
                                          <p className="text-xs text-rose-800">
                                            No hay reglas de invalidación configuradas. Agrega una regla para condicionar la validez (ej. edad mínima, estado, sexo o valor).
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newRule: SingleInvalidationRule = isCurp
                                                ? {
                                                  id: `inv_${Date.now()}`,
                                                  targetType: 'metadata',
                                                  metadataKey: 'edad',
                                                  operator: 'less_than',
                                                  value: '18'
                                                }
                                                : {
                                                  id: `inv_${Date.now()}`,
                                                  targetType: 'self',
                                                  operator: 'equals',
                                                  value: ''
                                                };
                                              handleUpdateField(field.id, {
                                                invalidationRule: {
                                                  enabled: true,
                                                  logic: 'AND',
                                                  rules: [newRule],
                                                  errorMessage: isCurp
                                                    ? 'Solo se admiten aspirantes mayores de 18 años.'
                                                    : 'El valor ingresado no cumple con el criterio requerido.'
                                                }
                                              });
                                            }}
                                            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Agregar Primera Regla de Invalidación</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          {currentRules.map((rule, rIdx) => {
                                            return (
                                              <div key={rule.id || rIdx} className="space-y-2">
                                                {rIdx > 0 && (
                                                  <div className="flex items-center justify-center -my-1">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-700 text-white shadow-2xs">
                                                      {currentLogic === 'AND' ? 'Y (AND)' : 'O (OR)'}
                                                    </span>
                                                  </div>
                                                )}

                                                <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs space-y-2">
                                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">

                                                    {/* 1. Target Selector (sm:col-span-5) */}
                                                    <div className="sm:col-span-5 space-y-1">
                                                      <label className="text-[10px] font-bold text-rose-950 block">Evaluar</label>
                                                      <select
                                                        value={
                                                          rule.targetType === 'metadata'
                                                            ? `meta:${rule.metadataKey || 'edad'}`
                                                            : rule.targetType === 'field'
                                                              ? `field:${rule.dependsOnFieldId}`
                                                              : 'self'
                                                        }
                                                        onChange={(e) => {
                                                          const val = e.target.value;
                                                          let updatedRule: SingleInvalidationRule;

                                                          if (val.startsWith('meta:')) {
                                                            const mKey = val.replace('meta:', '');
                                                            updatedRule = {
                                                              ...rule,
                                                              targetType: 'metadata',
                                                              metadataKey: mKey,
                                                              dependsOnFieldId: undefined,
                                                              operator: mKey === 'edad' ? 'less_than' : 'equals',
                                                              value: mKey === 'edad' ? '18' : (mKey === 'sexo' ? 'HOMBRE' : (mKey === 'isExtranjero' ? 'true' : ''))
                                                            };
                                                          } else if (val.startsWith('field:')) {
                                                            const fId = val.replace('field:', '');
                                                            updatedRule = {
                                                              ...rule,
                                                              targetType: 'field',
                                                              dependsOnFieldId: fId,
                                                              metadataKey: undefined,
                                                              operator: 'equals',
                                                              value: ''
                                                            };
                                                          } else {
                                                            updatedRule = {
                                                              ...rule,
                                                              targetType: 'self',
                                                              metadataKey: undefined,
                                                              dependsOnFieldId: undefined,
                                                              operator: 'equals',
                                                              value: ''
                                                            };
                                                          }

                                                          const updatedRules = [...currentRules];
                                                          updatedRules[rIdx] = updatedRule;
                                                          handleUpdateField(field.id, {
                                                            invalidationRule: {
                                                              ...field.invalidationRule,
                                                              enabled: true,
                                                              rules: updatedRules
                                                            }
                                                          });
                                                        }}
                                                        className="w-full bg-slate-50 border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-300 cursor-pointer truncate"
                                                      >
                                                        {isCurp && (
                                                          <optgroup label="Metadatos deducidos del CURP">
                                                            <option value="meta:edad">Metadato: Edad (Años)</option>
                                                            <option value="meta:fechaNacimiento">Metadato: Fecha de Nacimiento</option>
                                                            <option value="meta:sexo">Metadato: Sexo (HOMBRE / MUJER)</option>
                                                            <option value="meta:estadoNacimiento">Metadato: Estado de Nacimiento</option>
                                                            <option value="meta:isExtranjero">Metadato: ¿Nacido en el Extranjero?</option>
                                                          </optgroup>
                                                        )}
                                                        <optgroup label="Este mismo campo">
                                                          <option value="self">Su propio valor ingresado</option>
                                                        </optgroup>
                                                        {prior.length > 0 && (
                                                          <optgroup label="Campos previos en el flujo">
                                                            {prior.map((pf) => (
                                                              <option key={pf.id} value={`field:${pf.id}`}>
                                                                {pf.label} ({pf.type})
                                                              </option>
                                                            ))}
                                                          </optgroup>
                                                        )}
                                                      </select>
                                                    </div>

                                                    {/* 2. Operator Dropdown (sm:col-span-3) */}
                                                    <div className="sm:col-span-3 space-y-1">
                                                      <label className="text-[10px] font-bold text-rose-950 block">Condición</label>
                                                      <select
                                                        value={rule.operator}
                                                        onChange={(e) => {
                                                          const updatedRules = [...currentRules];
                                                          updatedRules[rIdx] = {
                                                            ...updatedRules[rIdx],
                                                            operator: e.target.value as FieldConditionOperator
                                                          };
                                                          handleUpdateField(field.id, {
                                                            invalidationRule: {
                                                              ...field.invalidationRule,
                                                              enabled: true,
                                                              rules: updatedRules
                                                            }
                                                          });
                                                        }}
                                                        className="w-full bg-slate-50 border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-300 cursor-pointer"
                                                      >
                                                        {rule.metadataKey === 'edad' ? (
                                                          <>
                                                            <option value="less_than">&lt; Menor a</option>
                                                            <option value="less_than_or_equal">&le; Menor o igual a</option>
                                                            <option value="greater_than">&gt; Mayor a</option>
                                                            <option value="greater_than_or_equal">&ge; Mayor o igual a</option>
                                                            <option value="equals">Es igual a</option>
                                                            <option value="not_equals">No es igual a</option>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <option value="equals">Es igual a</option>
                                                            <option value="not_equals">No es igual a</option>
                                                            <option value="contains">Contiene</option>
                                                            <option value="not_contains">No contiene</option>
                                                            <option value="greater_than">&gt; Mayor a</option>
                                                            <option value="less_than">&lt; Menor a</option>
                                                            <option value="greater_than_or_equal">&ge; Mayor o igual a</option>
                                                            <option value="less_than_or_equal">&le; Menor o igual a</option>
                                                            <option value="is_filled">Está lleno</option>
                                                            <option value="is_empty">Está vacío</option>
                                                          </>
                                                        )}
                                                      </select>
                                                    </div>

                                                    {/* 3. Value Matcher (sm:col-span-3) */}
                                                    {rule.operator !== 'is_filled' && rule.operator !== 'is_empty' ? (
                                                      <div className="sm:col-span-3 space-y-1">
                                                        <label className="text-[10px] font-bold text-rose-950 block">Valor</label>
                                                        {rule.metadataKey === 'sexo' ? (
                                                          <select
                                                            value={rule.value || 'HOMBRE'}
                                                            onChange={(e) => {
                                                              const updatedRules = [...currentRules];
                                                              updatedRules[rIdx] = { ...updatedRules[rIdx], value: e.target.value };
                                                              handleUpdateField(field.id, {
                                                                invalidationRule: {
                                                                  ...field.invalidationRule,
                                                                  enabled: true,
                                                                  rules: updatedRules
                                                                }
                                                              });
                                                            }}
                                                            className="w-full bg-slate-50 border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-300 cursor-pointer"
                                                          >
                                                            <option value="HOMBRE">Hombre (H)</option>
                                                            <option value="MUJER">Mujer (M)</option>
                                                          </select>
                                                        ) : rule.metadataKey === 'isExtranjero' ? (
                                                          <select
                                                            value={rule.value || 'true'}
                                                            onChange={(e) => {
                                                              const updatedRules = [...currentRules];
                                                              updatedRules[rIdx] = { ...updatedRules[rIdx], value: e.target.value };
                                                              handleUpdateField(field.id, {
                                                                invalidationRule: {
                                                                  ...field.invalidationRule,
                                                                  enabled: true,
                                                                  rules: updatedRules
                                                                }
                                                              });
                                                            }}
                                                            className="w-full bg-slate-50 border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-300 cursor-pointer"
                                                          >
                                                            <option value="true">Sí (Extranjero)</option>
                                                            <option value="false">No (Nacido en México)</option>
                                                          </select>
                                                        ) : rule.metadataKey === 'edad' ? (
                                                          <input
                                                            type="number"
                                                            value={rule.value || ''}
                                                            onChange={(e) => {
                                                              const updatedRules = [...currentRules];
                                                              updatedRules[rIdx] = { ...updatedRules[rIdx], value: e.target.value };
                                                              handleUpdateField(field.id, {
                                                                invalidationRule: {
                                                                  ...field.invalidationRule,
                                                                  enabled: true,
                                                                  rules: updatedRules
                                                                }
                                                              });
                                                            }}
                                                            placeholder="Ej. 18"
                                                            className="w-full bg-slate-50 border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-300"
                                                          />
                                                        ) : (
                                                          <input
                                                            type="text"
                                                            value={rule.value || ''}
                                                            onChange={(e) => {
                                                              const updatedRules = [...currentRules];
                                                              updatedRules[rIdx] = { ...updatedRules[rIdx], value: e.target.value };
                                                              handleUpdateField(field.id, {
                                                                invalidationRule: {
                                                                  ...field.invalidationRule,
                                                                  enabled: true,
                                                                  rules: updatedRules
                                                                }
                                                              });
                                                            }}
                                                            placeholder="Valor de invalidación..."
                                                            className="w-full bg-slate-50 border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-300"
                                                          />
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <div className="sm:col-span-3 flex items-center h-8 text-[11px] text-rose-700 italic font-medium">
                                                        (No requiere valor)
                                                      </div>
                                                    )}

                                                    <div className="sm:col-span-1 flex items-center justify-end pb-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const updatedRules = currentRules.filter((_, idx) => idx !== rIdx);
                                                          if (updatedRules.length === 0) {
                                                            handleUpdateField(field.id, { invalidationRule: undefined });
                                                          } else {
                                                            handleUpdateField(field.id, {
                                                              invalidationRule: {
                                                                ...field.invalidationRule,
                                                                rules: updatedRules
                                                              }
                                                            });
                                                          }
                                                        }}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Eliminar regla"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* Custom Invalidation Error Message */}
                                          <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-1.5 mt-2">
                                            <label className="text-[11px] font-bold text-rose-950 block">
                                              Mensaje de error que verá el aspirante al invalidarse:
                                            </label>
                                            <input
                                              type="text"
                                              value={field.invalidationRule?.errorMessage || ''}
                                              onChange={(e) => {
                                                handleUpdateField(field.id, {
                                                  invalidationRule: {
                                                    enabled: true,
                                                    logic: currentLogic,
                                                    rules: currentRules,
                                                    errorMessage: e.target.value
                                                  }
                                                });
                                              }}
                                              placeholder="Ej. Solo se admiten aspirantes con al menos 18 años cumplidos para continuar."
                                              className="w-full bg-slate-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-950 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-300"
                                            />
                                          </div>

                                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newRule: SingleInvalidationRule = {
                                                  id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                                                  targetType: isCurp ? 'metadata' : 'self',
                                                  metadataKey: isCurp ? 'edad' : undefined,
                                                  operator: isCurp ? 'less_than' : 'equals',
                                                  value: isCurp ? '18' : ''
                                                };
                                                const updatedRules = [...currentRules, newRule];
                                                handleUpdateField(field.id, {
                                                  invalidationRule: {
                                                    ...field.invalidationRule,
                                                    enabled: true,
                                                    rules: updatedRules
                                                  }
                                                });
                                              }}
                                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                              <span>Agregar otra regla ({currentLogic === 'AND' ? 'Y / AND' : 'O / OR'})</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleUpdateField(field.id, { invalidationRule: undefined });
                                                setExpandedLogicPanel(null);
                                              }}
                                              className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                                            >
                                              Eliminar reglas de invalidación
                                            </button>
                                          </div>

                                          <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-700/80">
                                            <span>* Si la condición se cumple, el formulario impedirá continuar.</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* Final Inserter at the bottom of the section */}
                  {renderInlineInserter(currentSection.fields.length)}

                  {/* Bottom Add Field Card Button */}
                  <button
                    type="button"
                    onClick={() => openPaletteDrawer(currentSection.fields.length)}
                    className="w-full py-4 px-6 rounded-3xl border-2 border-dashed border-forest/25 hover:border-forest hover:bg-forest/5 text-forest transition-all flex items-center justify-center gap-3 text-xs sm:text-sm font-bold shadow-2xs group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-forest text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span>Agregar Pregunta o Campo a esta Sección</span>
                  </button>
                </div>
              </div>
            )}

            {!currentSection && (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-forest/30 shadow-2xs space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-forest/5 flex items-center justify-center text-forest">
                  <Layers className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-sm font-bold text-forest uppercase tracking-wider">Sin Secciones</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Este formulario no tiene ninguna sección. Haz clic en el botón de agregar para crear tu primer paso o sección.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-4 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:scale-102 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primera Sección</span>
                </button>
              </div>
            )}

            {/* FIXED BOTTOM DRAG-AND-DROP TRASH ZONE (DESKTOP ONLY) */}
            {((draggedFieldIdx !== null && currentSection?.fields[draggedFieldIdx]) || (draggedSectionIdx !== null && sections[draggedSectionIdx])) && (
              <div
                className={`hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg transition-all duration-200 ease-out animate-in slide-in-from-bottom-8 fade-in ${isOverDropTrash ? 'scale-105' : 'scale-100'
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setIsOverDropTrash(true);
                }}
                onDragLeave={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (
                    e.clientX < rect.left ||
                    e.clientX > rect.right ||
                    e.clientY < rect.top ||
                    e.clientY > rect.bottom
                  ) {
                    setIsOverDropTrash(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fIdx = draggedFieldIdx;
                  const sIdx = draggedSectionIdx;
                  setDraggedFieldIdx(null);
                  setDragOverFieldIdx(null);
                  setDraggedSectionIdx(null);
                  setDragOverSectionIdx(null);
                  setIsOverDropTrash(false);

                  if (fIdx !== null && currentSection) {
                    if (currentSection.fields.length <= 1) {
                      toast.error('La sección debe tener al menos una pregunta');
                      return;
                    }
                    const fieldToDelete = currentSection.fields[fIdx];
                    if (fieldToDelete) {
                      const updatedSections = sections.map(s => {
                        if (s.id === currentSection.id) {
                          return { ...s, fields: s.fields.filter((_, idx) => idx !== fIdx) };
                        }
                        return s;
                      });
                      const cleaned = validateAndCleanConditions(updatedSections);
                      setSections(cleaned);
                      toast.success(`Pregunta "${fieldToDelete.label || 'Campo'}" eliminada`);
                    }
                  } else if (sIdx !== null) {
                    if (sections.length <= 1) {
                      toast.error('El formulario debe tener al menos una sección');
                      return;
                    }
                    const secToDelete = sections[sIdx];
                    if (secToDelete) {
                      const updatedSections = sections.filter((_, idx) => idx !== sIdx);
                      const cleaned = validateAndCleanConditions(updatedSections);
                      setSections(cleaned);
                      if (activeSectionId === secToDelete.id) {
                        setActiveSectionId(cleaned[0]?.id || '');
                      }
                      toast.success(`Sección "${secToDelete.title || 'Sección'}" eliminada`);
                    }
                  }
                }}
              >
                <div
                  className={`p-4 sm:p-5 rounded-3xl border-2 shadow-2xl backdrop-blur-md flex items-center justify-center gap-3.5 transition-all text-center ${isOverDropTrash
                    ? 'bg-rose-600 border-rose-300 text-white shadow-rose-900/60 ring-4 ring-rose-400/40'
                    : 'bg-stone-900/90 border-rose-500/50 text-rose-100 shadow-stone-950/60'
                    }`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform ${isOverDropTrash ? 'bg-white text-rose-600 scale-110 rotate-12 shadow-md' : 'bg-rose-500/20 text-rose-400'
                      }`}
                  >
                    <Trash2 className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold tracking-tight">
                      {isOverDropTrash
                        ? (draggedFieldIdx !== null ? '¡Soltá aquí para Eliminar Pregunta!' : '¡Soltá aquí para Eliminar Sección!')
                        : (draggedFieldIdx !== null ? 'Arrastrá aquí para eliminar pregunta' : 'Arrastrá aquí para eliminar sección')}
                    </p>
                    <p className={`text-[11px] truncate max-w-xs sm:max-w-sm ${isOverDropTrash ? 'text-rose-100' : 'text-rose-300/80'}`}>
                      {draggedFieldIdx !== null
                        ? `"${currentSection?.fields[draggedFieldIdx]?.label || 'Pregunta sin título'}"`
                        : `"${sections[draggedSectionIdx!]?.title || 'Sección sin título'}"`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: VISTA PREVIA (RENDERED ACCORDING TO CONFIGURED LAYOUT & THEME) */}
        {/* ======================================================== */}
        {!loading && activeTab === 'preview' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">

            {/* Header Info Status (Displays the active configured experience & color) */}
            <div className="bg-white rounded-2xl p-3 sm:px-5 border border-forest/30 shadow-xs flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 text-xs font-bold text-forest">
                <Eye className="w-4 h-4 text-forest" />
                <span>Vista Previa del Formulario</span>
              </div>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                {/* Language Simulator Toggle */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setPreviewLocale('es')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${previewLocale === 'es' ? 'bg-white text-forest shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLocale('en')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${previewLocale === 'en' ? 'bg-white text-forest shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    EN
                  </button>
                </div>

                {/* Theme Simulator Toggle */}
                <button
                  type="button"
                  onClick={() => setPreviewDarkMode(prev => !prev)}
                  className={`p-1.5 rounded-xl border flex items-center gap-1 text-[11px] font-bold transition-all ${previewDarkMode
                    ? 'bg-slate-900 text-amber-300 border-slate-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  title={previewDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {previewDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  <span className="hidden sm:inline">{previewDarkMode ? 'Oscuro' : 'Claro'}</span>
                </button>

                <span className="px-2.5 py-1 rounded-xl bg-forest/5 text-forest border border-forest/10 font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>
                    {layoutStyle === 'focus_flow' || layoutStyle === 'typeform'
                      ? 'Flujo Guiado'
                      : layoutStyle === 'step_wizard' || layoutStyle === 'wizard_liquid'
                        ? 'Paso a Paso'
                        : 'Clásico'}
                  </span>
                </span>

                <div
                  className="w-5 h-5 rounded-full border border-black/10 shadow-2xs shrink-0"
                  style={{ backgroundColor: themeColor }}
                  title={`Tema activo: ${themeColor}`}
                />
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* OPTION 1: CLASICO CONTINUO                           */}
            {/* ---------------------------------------------------- */}
            {(layoutStyle === 'classic' || layoutStyle === 'google_forms') && (
              <div className="space-y-4 animate-in fade-in zoom-in-98 duration-200">
                <div
                  className={`rounded-3xl p-6 sm:p-8 border shadow-sm space-y-2 border-t-8 transition-all duration-300 ${previewDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-forest/30 text-slate-800'
                    }`}
                  style={{ borderTopColor: themeColor }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-0.8 rounded-full inline-block text-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      {category}
                    </span>
                    <span className={`text-[11px] font-semibold ${previewDarkMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      Paso {previewStep + 1} de {sections.length}
                    </span>
                  </div>
                  <h2 className={`text-xl sm:text-2xl font-bold font-display ${previewDarkMode ? 'text-white' : 'text-forest'}`}>{title || 'Sin Título'}</h2>
                  {description && <p className={`text-xs leading-relaxed pt-1 ${previewDarkMode ? 'text-slate-400' : 'text-muted-foreground'}`}>{description}</p>}

                  {sections[previewStep]?.title && previewStep > 0 && (
                    <div className={`pt-2 border-t ${previewDarkMode ? 'border-slate-800' : 'border-forest/10'}`}>
                      <h3 className={`font-bold text-sm font-display ${previewDarkMode ? 'text-emerald-400' : 'text-forest'}`}>{sections[previewStep].title}</h3>
                      {sections[previewStep].description && (
                        <p className={`text-xs ${previewDarkMode ? 'text-slate-400' : 'text-muted-foreground'}`}>{sections[previewStep].description}</p>
                      )}
                    </div>
                  )}
                </div>

                {sections[previewStep]?.fields.filter(field => evaluateFieldCondition(field.condition, previewData)).map((field, fIdx) => (
                  <div
                    key={field.id}
                    className={`rounded-3xl p-5 sm:p-6 border space-y-3 transition-all duration-300 ${previewDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-forest/15 text-slate-800'
                      } ${getShadowClass(shadowStyle)}`}
                  >
                    <label className={`text-xs sm:text-sm font-bold flex items-start justify-between gap-2 ${previewDarkMode ? 'text-emerald-400' : 'text-forest'}`}>
                      <span>{fIdx + 1}. {field.label} {field.required && <span className="text-destructive font-bold">*</span>}</span>
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder || 'Tu respuesta...'}
                        value={previewData[field.id] || ''}
                        onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.value })}
                        className={getInputStyles(previewDarkMode).className}
                        style={getInputStyles(previewDarkMode).style}
                      />
                    ) : field.type === 'single_choice' ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt) => {
                          const isSelected = previewData[field.id] === opt;
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2.5 p-3 cursor-pointer text-xs font-medium transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${isSelected
                                ? (previewDarkMode ? 'bg-slate-800 border-2 text-white font-bold' : 'bg-white shadow-xs font-bold border-2')
                                : (previewDarkMode ? 'bg-slate-950/60 border border-slate-800 text-slate-300 hover:bg-slate-800/60' : 'bg-forest/5 hover:bg-forest/10 text-forest border border-transparent')
                                }`}
                              style={isSelected ? { borderColor: themeColor } : {}}
                            >
                              <input
                                type="radio"
                                name={`prev_gf_${field.id}`}
                                value={opt}
                                checked={isSelected}
                                onChange={(e) => setPreviewData({ ...previewData, [field.id]: opt })}
                                className="w-4 h-4"
                                style={{ accentColor: themeColor }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : field.type === 'multiple_choice' ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt) => {
                          const arr = previewData[field.id] || [];
                          const isChecked = arr.includes(opt);
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2.5 p-3 cursor-pointer text-xs font-medium transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${isChecked
                                ? (previewDarkMode ? 'bg-slate-800 border-2 text-white font-bold' : 'bg-white shadow-xs font-bold border-2')
                                : (previewDarkMode ? 'bg-slate-950/60 border border-slate-800 text-slate-300 hover:bg-slate-800/60' : 'bg-forest/5 hover:bg-forest/10 text-forest border border-transparent')
                                }`}
                              style={isChecked ? { borderColor: themeColor } : {}}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPreviewData({ ...previewData, [field.id]: [...arr, opt] });
                                  } else {
                                    setPreviewData({ ...previewData, [field.id]: arr.filter((x: string) => x !== opt) });
                                  }
                                }}
                                className="w-4 h-4 rounded"
                                style={{ accentColor: themeColor }}
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
                              className={`flex items-start gap-3.5 p-4 cursor-pointer text-xs transition-all border-2 relative ${getRadiusClass(borderRadius, 'input')
                                } ${getShadowClass(shadowStyle)} ${isSelected
                                  ? 'bg-white shadow-xs font-semibold'
                                  : 'bg-forest/5 hover:bg-forest/10 text-forest border-transparent'
                                }`}
                              style={isSelected ? { borderColor: themeColor } : {}}
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
                                  className={`w-4 h-4 ${allowMultiple ? 'rounded' : ''}`}
                                  style={{ accentColor: themeColor }}
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
                      <div className="flex items-center gap-3">
                        {['Sí', 'No'].map((opt) => {
                          const isSelected = previewData[field.id] === opt;
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2 p-3 cursor-pointer text-xs font-medium flex-1 transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${isSelected
                                ? 'bg-white shadow-xs font-bold border-2'
                                : 'bg-forest/5 hover:bg-forest/10 text-forest border border-transparent'
                                }`}
                              style={isSelected ? { borderColor: themeColor } : {}}
                            >
                              <input
                                type="radio"
                                name={`prev_gf_${field.id}`}
                                value={opt}
                                checked={isSelected}
                                onChange={(e) => setPreviewData({ ...previewData, [field.id]: opt })}
                                className="w-4 h-4"
                                style={{ accentColor: themeColor }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : field.type === 'range' ? (
                      <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">
                            {field.minLabel || `Mínimo: ${field.min ?? 0}`}
                          </span>
                          <div
                            className="px-3.5 py-1 rounded-full text-white text-xs font-bold font-mono shadow-xs"
                            style={{ backgroundColor: themeColor }}
                          >
                            {previewData[field.id] !== undefined ? previewData[field.id] : (field.defaultValue ?? field.min ?? 0)} {field.unit || ''}
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {field.maxLabel || `Máximo: ${field.max ?? 10}`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={field.min ?? 0}
                          max={field.max ?? 10}
                          step={field.step ?? 1}
                          value={previewData[field.id] !== undefined ? previewData[field.id] : (field.defaultValue ?? field.min ?? 0)}
                          onChange={(e) => setPreviewData({ ...previewData, [field.id]: Number(e.target.value) })}
                          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-forest transition-all"
                          style={{ accentColor: themeColor }}
                        />
                      </div>
                    ) : field.type === 'composite' ? (
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(field.subfields || []).map((sub) => {
                            const compVal = previewData[field.id] || {};
                            const subVal = compVal[sub.id] ?? '';
                            return (
                              <div key={sub.id} className={`space-y-1 ${sub.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                                <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                                  <span>{sub.label}</span>
                                  {sub.required && <span className="text-rose-500 font-bold">*</span>}
                                </label>
                                {sub.type === 'single_choice' ? (
                                  <select
                                    value={subVal}
                                    onChange={(e) => {
                                      setPreviewData(prev => ({
                                        ...prev,
                                        [field.id]: { ...(prev[field.id] || {}), [sub.id]: e.target.value }
                                      }));
                                    }}
                                    className={getInputStyles(previewDarkMode).className}
                                    style={getInputStyles(previewDarkMode).style}
                                  >
                                    <option value="">{sub.placeholder || '-- Seleccionar --'}</option>
                                    {(sub.options || []).map((opt, oIdx) => (
                                      <option key={oIdx} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={sub.type === 'phone' ? 'tel' : sub.type === 'email' ? 'email' : sub.type === 'date' ? 'date' : sub.type === 'integer' ? 'number' : 'text'}
                                    placeholder={sub.placeholder || '...'}
                                    value={subVal}
                                    onChange={(e) => handlePreviewCompositeFieldChange(field.id, sub.id, sub.type, e.target.value)}
                                    className={getInputStyles(previewDarkMode).className}
                                    style={getInputStyles(previewDarkMode).style}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : field.type === 'fullname' ? (
                      <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-forest block mb-1">Nombre(s)</label>
                          <input
                            type="text"
                            placeholder="Ej. Juan Carlos"
                            value={(previewData[field.id] || {}).firstName || ''}
                            onChange={(e) => handlePreviewCompositeFieldChange(field.id, 'firstName', 'fullname', e.target.value)}
                            className={getInputStyles(previewDarkMode).className}
                            style={getInputStyles(previewDarkMode).style}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-forest block mb-1">Apellido Paterno</label>
                            <input
                              type="text"
                              placeholder="Ej. Pérez"
                              value={(previewData[field.id] || {}).paternalLastName || ''}
                              onChange={(e) => handlePreviewCompositeFieldChange(field.id, 'paternalLastName', 'fullname', e.target.value)}
                              className={getInputStyles(previewDarkMode).className}
                              style={getInputStyles(previewDarkMode).style}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-forest block mb-1">Apellido Materno</label>
                            <input
                              type="text"
                              placeholder="Ej. Gómez"
                              value={(previewData[field.id] || {}).maternalLastName || ''}
                              onChange={(e) => handlePreviewCompositeFieldChange(field.id, 'maternalLastName', 'fullname', e.target.value)}
                              className={getInputStyles(previewDarkMode).className}
                              style={getInputStyles(previewDarkMode).style}
                            />
                          </div>
                        </div>
                      </div>
                    ) : renderMockPreviewSpecialField(field, 'classic') ? (
                      renderMockPreviewSpecialField(field, 'classic')
                    ) : field.type === 'schedule_event' ? (
                      <ScheduleEventWidget
                        field={field}
                        value={previewData[field.id]}
                        onChange={(val) => handlePreviewFieldChange(field.id, 'schedule_event', val)}
                        themeColor={themeColor}
                        isDark={previewDarkMode}
                        borderRadius={borderRadius}
                      />
                    ) : field.type === 'richtext' ? (
                      <div className="space-y-1.5 pt-0.5">
                        <RichTextEditor
                          value={previewData[field.id] || ''}
                          onChange={(html) => handlePreviewFieldChange(field.id, 'richtext', html)}
                          placeholder={field.placeholder || 'Escribe tu respuesta con formato enriquecido (negrita, viñetas, enlaces)...'}
                          minHeight={field.maxHeight || '160px'}
                        />
                      </div>
                    ) : (
                      <input
                        type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'integer' || field.type === 'decimal' ? 'number' : 'text'}
                        placeholder={field.placeholder || (field.type === 'phone' ? `${field.defaultCountryCode || '+52'} 55 1234 5678` : 'Tu respuesta...')}
                        value={previewData[field.id] || ''}
                        onFocus={() => {
                          if (field.type === 'phone' && (!previewData[field.id] || !previewData[field.id].toString().trim())) {
                            const initialCode = (field.defaultCountryCode || '+52') + ' ';
                            handlePreviewFieldChange(field.id, 'phone', initialCode);
                          }
                        }}
                        onChange={(e) => handlePreviewFieldChange(field.id, field.type, e.target.value)}
                        className={getInputStyles(previewDarkMode).className}
                        style={getInputStyles(previewDarkMode).style}
                      />
                    )}
                  </div>
                ))}

                {/* Classic Navigation Footer */}
                <div className={`flex items-center justify-between pt-2 border-t mt-4 ${previewDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => setPreviewStep(Math.max(0, previewStep - 1))}
                    disabled={previewStep === 0}
                    className={`px-4 py-2 border text-xs font-bold disabled:opacity-30 transition-colors shadow-2xs ${previewDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      : 'bg-white border-forest/15 text-forest hover:bg-slate-50'
                      } ${getRadiusClass(borderRadius, 'button')}`}
                  >
                    {previewLocale === 'en' ? 'Back' : 'Anterior'}
                  </button>
                  {previewStep < sections.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setPreviewStep(previewStep + 1)}
                      className={`px-5 py-2.5 text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-102 ${getRadiusClass(borderRadius, 'button')}`}
                      style={{ backgroundColor: themeColor }}
                    >
                      {previewLocale === 'en' ? 'Next' : 'Siguiente'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toast.success(previewLocale === 'en' ? 'Preview completed!' : '¡Vista previa completada!')}
                      className={`px-5 py-2.5 text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-102 ${getRadiusClass(borderRadius, 'button')}`}
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {previewLocale === 'en' ? 'Submit' : 'Enviar Formulario'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* OPTION 2: FLUJO GUIADO                               */}
            {/* ---------------------------------------------------- */}
            {(layoutStyle === 'focus_flow' || layoutStyle === 'typeform') && (
              <div className={`rounded-3xl border shadow-sm p-6 sm:p-12 min-h-[580px] flex flex-col justify-between relative overflow-hidden overflow-x-hidden max-w-full animate-in fade-in transition-all duration-300 ${previewDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-200/70">
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                      width: visiblePreviewFlatQuestions.length > 0 ? `${((typeformIndex + 1) / visiblePreviewFlatQuestions.length) * 100}%` : '100%',
                      backgroundColor: themeColor
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold pt-1">
                  <span className={`font-display font-bold text-sm ${previewDarkMode ? 'text-white' : 'text-slate-800'}`}>{title || 'Formulario'}</span>
                </div>

                {visiblePreviewFlatQuestions[typeformIndex] && (
                  <div
                    key={typeformIndex}
                    className={`my-auto py-8 space-y-6 sm:space-y-8 max-w-2xl mx-auto w-full max-w-full overflow-x-hidden transition-all duration-300 ${slideDirection === 'left' ? 'animate-liquid-slide-left' : 'animate-liquid-slide-right'
                      }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm font-mono" style={{ color: themeColor }}>
                        <span>{String(typeformIndex + 1).padStart(2, '0')}</span>
                        <ArrowRight className="w-4 h-4" />
                        <span className={`text-xs uppercase px-2.5 py-1 rounded-lg font-sans font-semibold ${previewDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-800'}`}>
                          {visiblePreviewFlatQuestions[typeformIndex].sectionTitle}
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-bold font-display leading-tight tracking-tight ${previewDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {visiblePreviewFlatQuestions[typeformIndex].label}
                        {visiblePreviewFlatQuestions[typeformIndex].required && (
                          <span className="text-rose-500 ml-1.5 font-bold">*</span>
                        )}
                      </h3>
                    </div>

                    {renderMockPreviewSpecialField(visiblePreviewFlatQuestions[typeformIndex], 'focus') ? (
                      <div className="w-full">
                        {renderMockPreviewSpecialField(visiblePreviewFlatQuestions[typeformIndex], 'focus')}
                      </div>
                    ) : visiblePreviewFlatQuestions[typeformIndex].type === 'single_choice' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(visiblePreviewFlatQuestions[typeformIndex].options || []).map((opt, oIdx) => {
                          const isSelected = previewData[visiblePreviewFlatQuestions[typeformIndex].id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setPreviewData({ ...previewData, [visiblePreviewFlatQuestions[typeformIndex].id]: opt });
                                if (typeformIndex < visiblePreviewFlatQuestions.length - 1) {
                                  setSlideDirection('left');
                                  setTimeout(() => setTypeformIndex(typeformIndex + 1), 320);
                                }
                              }}
                              className={`p-4 border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${getShadowClass(shadowStyle)} ${isSelected
                                ? 'text-white shadow-lg font-bold scale-[1.01]'
                                : (previewDarkMode
                                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200 shadow-xs'
                                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-xs')
                                }`}
                              style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                            >
                              <div className="flex items-center gap-3 text-sm font-semibold">
                                <span className={`w-7 h-7 ${getRadiusClass(borderRadius, 'avatar')} text-xs font-bold flex items-center justify-center font-mono ${isSelected ? 'bg-white/20 text-white' : (previewDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                                  }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isSelected && <Check className="w-5 h-5 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : visiblePreviewFlatQuestions[typeformIndex].type === 'poll' ? (
                      <div className="space-y-3 w-full">
                        {(visiblePreviewFlatQuestions[typeformIndex].pollConfig?.options || []).map((opt, oIdx) => {
                          const q = visiblePreviewFlatQuestions[typeformIndex];
                          const allowMultiple = !!q.pollConfig?.allowMultiple;
                          let isSelected = false;
                          if (allowMultiple) {
                            const arr = previewData[q.id] || [];
                            isSelected = arr.includes(opt.id);
                          } else {
                            isSelected = previewData[q.id] === opt.id;
                          }

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (allowMultiple) {
                                  const arr = previewData[q.id] || [];
                                  if (isSelected) {
                                    setPreviewData({ ...previewData, [q.id]: arr.filter((x: string) => x !== opt.id) });
                                  } else {
                                    setPreviewData({ ...previewData, [q.id]: [...arr, opt.id] });
                                  }
                                } else {
                                  setPreviewData({ ...previewData, [q.id]: opt.id });
                                  if (typeformIndex < visiblePreviewFlatQuestions.length - 1) {
                                    setSlideDirection('left');
                                    setTimeout(() => setTypeformIndex(typeformIndex + 1), 320);
                                  }
                                }
                              }}
                              className={`p-4 border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer gap-2 relative w-full ${getRadiusClass(borderRadius, 'button')} ${getShadowClass(shadowStyle)} ${isSelected
                                ? 'text-white shadow-lg font-bold scale-[1.01]'
                                : (previewDarkMode
                                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200 shadow-xs'
                                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-xs')
                                }`}
                              style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                            >
                              <div className="flex items-center gap-3 text-sm font-semibold">
                                <span className={`w-7 h-7 ${getRadiusClass(borderRadius, 'avatar')} text-xs font-bold flex items-center justify-center font-mono ${isSelected ? 'bg-white/20 text-white' : (previewDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                                  }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="font-bold">{opt.title}</span>
                              </div>
                              {opt.description && (
                                <p className={`text-xs leading-relaxed font-normal ${isSelected ? 'text-white/80' : (previewDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>{opt.description}</p>
                              )}
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : visiblePreviewFlatQuestions[typeformIndex].type === 'range' ? (
                      (() => {
                        const q = visiblePreviewFlatQuestions[typeformIndex];
                        const minVal = q.min ?? 0;
                        const maxVal = q.max ?? 10;
                        const stepVal = q.step ?? 1;
                        const currentVal = previewData[q.id] !== undefined ? Number(previewData[q.id]) : (q.defaultValue !== undefined ? Number(q.defaultValue) : minVal);
                        return (
                          <div className="w-full max-w-xl mx-auto py-6 space-y-6">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div
                                className="px-6 py-2.5 rounded-2xl text-white text-3xl font-black font-mono shadow-lg transition-transform scale-105 flex items-baseline gap-1"
                                style={{ backgroundColor: themeColor }}
                              >
                                <span>{currentVal}</span>
                                {q.unit && <span className="text-sm font-sans font-bold opacity-80">{q.unit}</span>}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setPreviewData({ ...previewData, [q.id]: Math.max(minVal, currentVal - stepVal) })}
                                  disabled={currentVal <= minVal}
                                  className={`w-9 h-9 flex items-center justify-center font-bold text-base border rounded-xl shadow-2xs disabled:opacity-30 cursor-pointer transition-all ${previewDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                                >
                                  -
                                </button>
                                <input
                                  type="range"
                                  min={minVal}
                                  max={maxVal}
                                  step={stepVal}
                                  value={currentVal}
                                  onChange={(e) => setPreviewData({ ...previewData, [q.id]: Number(e.target.value) })}
                                  className="flex-1 h-3.5 bg-slate-200 rounded-full appearance-none cursor-pointer transition-all"
                                  style={{ accentColor: themeColor }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewData({ ...previewData, [q.id]: Math.min(maxVal, currentVal + stepVal) })}
                                  disabled={currentVal >= maxVal}
                                  className={`w-9 h-9 flex items-center justify-center font-bold text-base border rounded-xl shadow-2xs disabled:opacity-30 cursor-pointer transition-all ${previewDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                                >
                                  +
                                </button>
                              </div>
                              <div className={`flex items-center justify-between text-xs font-bold px-1 ${previewDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                <span className="flex flex-col items-start">
                                  <span className="font-mono">{minVal}</span>
                                  {q.minLabel && <span className="text-[11px] text-muted-foreground font-normal">{q.minLabel}</span>}
                                </span>
                                <span className="flex flex-col items-end">
                                  <span className="font-mono">{maxVal}</span>
                                  {q.maxLabel && <span className="text-[11px] text-muted-foreground font-normal">{q.maxLabel}</span>}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : visiblePreviewFlatQuestions[typeformIndex].type === 'composite' ? (
                      <div className={`p-6 border space-y-4 w-full transition-all duration-300 ${previewDarkMode ? 'bg-slate-900 border-slate-850 text-slate-100' : 'bg-amber-50/80 border-amber-200/80 text-slate-850'
                        } ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {(visiblePreviewFlatQuestions[typeformIndex].subfields || []).map((sub) => {
                            const compVal = previewData[visiblePreviewFlatQuestions[typeformIndex].id] || {};
                            const subVal = compVal[sub.id] ?? '';
                            return (
                              <div key={sub.id} className={`space-y-1 ${sub.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                                <label className={`text-xs font-bold flex items-center justify-between gap-1 ${previewDarkMode ? 'text-slate-350' : 'text-amber-950'}`}>
                                  <span>{sub.label}</span>
                                  {sub.required && <span className="text-rose-500 font-bold">*</span>}
                                </label>
                                {sub.type === 'single_choice' ? (
                                  <select
                                    value={subVal}
                                    onChange={(e) => {
                                      setPreviewData(prev => ({
                                        ...prev,
                                        [visiblePreviewFlatQuestions[typeformIndex].id]: {
                                          ...(prev[visiblePreviewFlatQuestions[typeformIndex].id] || {}),
                                          [sub.id]: e.target.value
                                        }
                                      }));
                                    }}
                                    className={getInputStyles(previewDarkMode).className}
                                    style={getInputStyles(previewDarkMode).style}
                                  >
                                    <option value="">{sub.placeholder || '-- Seleccionar --'}</option>
                                    {(sub.options || []).map((opt, oIdx) => (
                                      <option key={oIdx} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={sub.type === 'phone' ? 'tel' : sub.type === 'email' ? 'email' : sub.type === 'date' ? 'date' : sub.type === 'integer' ? 'number' : 'text'}
                                    placeholder={sub.placeholder || '...'}
                                    value={subVal}
                                    onChange={(e) => handlePreviewCompositeFieldChange(visiblePreviewFlatQuestions[typeformIndex].id, sub.id, sub.type, e.target.value)}
                                    className={getInputStyles(previewDarkMode).className}
                                    style={getInputStyles(previewDarkMode).style}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : visiblePreviewFlatQuestions[typeformIndex].type === 'fullname' ? (
                      <div className={`p-6 border space-y-4 w-full transition-all duration-300 ${previewDarkMode ? 'bg-slate-900 border-slate-850 text-slate-100' : 'bg-white border-slate-200 text-slate-850'
                        } ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)}`}>
                        <div>
                          <label className={`text-xs font-bold block mb-1.5 ${previewDarkMode ? 'text-slate-350' : 'text-slate-700'}`}>Nombre o Nombres</label>
                          <input
                            type="text"
                            placeholder="Ej. Juan Carlos"
                            value={(previewData[visiblePreviewFlatQuestions[typeformIndex].id] || {}).firstName || ''}
                            onChange={(e) => handlePreviewCompositeFieldChange(visiblePreviewFlatQuestions[typeformIndex].id, 'firstName', 'fullname', e.target.value)}
                            className={getInputStyles(previewDarkMode).className}
                            style={getInputStyles(previewDarkMode).style}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className={`text-xs font-bold block mb-1.5 ${previewDarkMode ? 'text-slate-350' : 'text-slate-700'}`}>Apellido Paterno</label>
                            <input
                              type="text"
                              placeholder="Ej. Pérez"
                              value={(previewData[visiblePreviewFlatQuestions[typeformIndex].id] || {}).paternalLastName || ''}
                              onChange={(e) => handlePreviewCompositeFieldChange(visiblePreviewFlatQuestions[typeformIndex].id, 'paternalLastName', 'fullname', e.target.value)}
                              className={getInputStyles(previewDarkMode).className}
                              style={getInputStyles(previewDarkMode).style}
                            />
                          </div>
                          <div>
                            <label className={`text-xs font-bold block mb-1.5 ${previewDarkMode ? 'text-slate-350' : 'text-slate-700'}`}>Apellido Materno</label>
                            <input
                              type="text"
                              placeholder="Ej. Gómez"
                              value={(previewData[visiblePreviewFlatQuestions[typeformIndex].id] || {}).maternalLastName || ''}
                              onChange={(e) => handlePreviewCompositeFieldChange(visiblePreviewFlatQuestions[typeformIndex].id, 'maternalLastName', 'fullname', e.target.value)}
                              className={getInputStyles(previewDarkMode).className}
                              style={getInputStyles(previewDarkMode).style}
                            />
                          </div>
                        </div>
                      </div>
                    ) : visiblePreviewFlatQuestions[typeformIndex].type === 'schedule_event' ? (
                      <div className="pt-2 w-full">
                        <ScheduleEventWidget
                          field={visiblePreviewFlatQuestions[typeformIndex]}
                          value={previewData[visiblePreviewFlatQuestions[typeformIndex].id]}
                          onChange={(val) => setPreviewData(prev => ({ ...prev, [visiblePreviewFlatQuestions[typeformIndex].id]: val }))}
                          themeColor={themeColor}
                          isDark={previewDarkMode}
                          borderRadius={borderRadius}
                          layoutVariant="focus"
                        />
                      </div>
                    ) : visiblePreviewFlatQuestions[typeformIndex].type === 'richtext' ? (
                      <div className="space-y-1.5 pt-0.5 w-full">
                        <RichTextEditor
                          value={previewData[visiblePreviewFlatQuestions[typeformIndex].id] || ''}
                          onChange={(html) => setPreviewData(prev => ({ ...prev, [visiblePreviewFlatQuestions[typeformIndex].id]: html }))}
                          placeholder={visiblePreviewFlatQuestions[typeformIndex].placeholder || 'Escribe tu respuesta con formato enriquecido...'}
                          minHeight={visiblePreviewFlatQuestions[typeformIndex].maxHeight || '160px'}
                        />
                      </div>
                    ) : visiblePreviewFlatQuestions[typeformIndex].type === 'textarea' ? (
                      <textarea
                        rows={3}
                        placeholder={visiblePreviewFlatQuestions[typeformIndex].placeholder || 'Escribe tu respuesta...'}
                        value={previewData[visiblePreviewFlatQuestions[typeformIndex].id] || ''}
                        onChange={(e) => setPreviewData({ ...previewData, [visiblePreviewFlatQuestions[typeformIndex].id]: e.target.value })}
                        className={getInputStyles(previewDarkMode).className}
                        style={getInputStyles(previewDarkMode).style}
                      />
                    ) : (
                      <input
                        type={visiblePreviewFlatQuestions[typeformIndex].type === 'phone' ? 'tel' : visiblePreviewFlatQuestions[typeformIndex].type === 'email' ? 'email' : visiblePreviewFlatQuestions[typeformIndex].type === 'date' ? 'date' : visiblePreviewFlatQuestions[typeformIndex].type === 'integer' || visiblePreviewFlatQuestions[typeformIndex].type === 'decimal' ? 'number' : 'text'}
                        placeholder={visiblePreviewFlatQuestions[typeformIndex].placeholder || (visiblePreviewFlatQuestions[typeformIndex].type === 'phone' ? `${visiblePreviewFlatQuestions[typeformIndex].defaultCountryCode || '+52'} 55 1234 5678` : 'Escribe tu respuesta...')}
                        value={previewData[visiblePreviewFlatQuestions[typeformIndex].id] || ''}
                        onFocus={() => {
                          const curField = visiblePreviewFlatQuestions[typeformIndex];
                          if (curField?.type === 'phone' && (!previewData[curField.id] || !previewData[curField.id].toString().trim())) {
                            const initialCode = (curField.defaultCountryCode || '+52') + ' ';
                            handlePreviewFieldChange(curField.id, 'phone', initialCode);
                          }
                        }}
                        onChange={(e) => handlePreviewFieldChange(visiblePreviewFlatQuestions[typeformIndex].id, visiblePreviewFlatQuestions[typeformIndex].type, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && typeformIndex < visiblePreviewFlatQuestions.length - 1) {
                            setSlideDirection('left');
                            setTypeformIndex(typeformIndex + 1);
                          }
                        }}
                        className={getInputStyles(previewDarkMode).className}
                        style={getInputStyles(previewDarkMode).style}
                      />
                    )}

                    {(() => {
                      return (
                        <div className="pt-4 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (typeformIndex < visiblePreviewFlatQuestions.length - 1) {
                                setSlideDirection('left');
                                setTypeformIndex(typeformIndex + 1);
                              } else {
                                toast.success(previewLocale === 'en' ? 'You have reached the end of the preview!' : '¡Has llegado al final de la vista previa!');
                              }
                            }}
                            className={`px-7 py-3.5 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                            style={{ backgroundColor: themeColor }}
                          >
                            <span>
                              {typeformIndex < visiblePreviewFlatQuestions.length - 1
                                ? (previewLocale === 'en' ? 'OK ↵' : 'Aceptar ↵')
                                : (previewLocale === 'en' ? 'Finish Preview' : 'Finalizar Vista Previa')}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200/70 text-xs text-muted-foreground">
                  <span className="font-semibold">{title || 'Formulario Oficial'}</span>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeformIndex > 0) {
                          setSlideDirection('right');
                          setTypeformIndex(typeformIndex - 1);
                        }
                      }}
                      disabled={typeformIndex === 0}
                      className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeformIndex < visiblePreviewFlatQuestions.length - 1) {
                          setSlideDirection('left');
                          setTypeformIndex(typeformIndex + 1);
                        }
                      }}
                      disabled={typeformIndex >= visiblePreviewFlatQuestions.length - 1}
                      className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* OPTION 3: PASO A PASO (STEP WIZARD)                  */}
            {/* ---------------------------------------------------- */}
            {(layoutStyle === 'step_wizard' || layoutStyle === 'wizard_liquid') && (
              <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
                {/* Step Progress Timeline Card */}
                <div className={`rounded-3xl p-5 sm:p-7 border shadow-sm space-y-5 transition-all duration-300 ${previewDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-forest/15'
                  }`}>
                  <div className={`flex items-center justify-between text-xs border-b pb-3 ${previewDarkMode ? 'border-slate-800' : 'border-forest/10'}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: themeColor }} />
                      <span className={`font-bold font-display text-sm sm:text-base ${previewDarkMode ? 'text-white' : 'text-forest'}`}>{title || 'Formulario'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold text-xs ${previewDarkMode ? 'text-slate-400' : 'text-forest'}`}>
                        Paso {previewStep + 1} de {sections.length}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold font-mono shadow-2xs"
                        style={{ backgroundColor: themeColor }}
                      >
                        {Math.round(((previewStep + 1) / sections.length) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Connected Step Nodes Track */}
                  <div className="w-full pt-1 px-2">
                    <div className="flex items-center justify-between w-full">
                      {sections.map((sec, sIdx) => {
                        const isDone = sIdx < previewStep;
                        const isCurrent = sIdx === previewStep;
                        const isLast = sIdx === sections.length - 1;

                        return (
                          <React.Fragment key={sec.id}>
                            {/* Step Node */}
                            <button
                              type="button"
                              onClick={() => setPreviewStep(sIdx)}
                              className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none transition-transform active:scale-95 shrink-0"
                              style={{ width: '84px' }}
                            >
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-xs ${isCurrent
                                  ? 'text-white ring-4 ring-forest/15 scale-110 shadow-md'
                                  : isDone
                                    ? 'text-white'
                                    : previewDarkMode
                                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                  }`}
                                style={isCurrent || isDone ? { backgroundColor: themeColor } : {}}
                              >
                                {isDone ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  <span className="font-mono">{sIdx + 1}</span>
                                )}
                              </div>

                              {/* Step Label Underneath */}
                              <span
                                className={`mt-2 text-[11px] font-bold text-center leading-tight transition-colors duration-200 line-clamp-2 max-w-[84px] ${isCurrent
                                  ? (previewDarkMode ? 'text-emerald-400 font-extrabold' : 'text-forest font-extrabold')
                                  : isDone
                                    ? (previewDarkMode ? 'text-emerald-400/80' : 'text-forest/80')
                                    : 'text-muted-foreground group-hover:text-slate-400'
                                  }`}
                              >
                                {sec.title}
                              </span>
                            </button>

                            {/* Connecting Line Segment between nodes */}
                            {!isLast && (
                              <div className={`flex-1 mx-[-16px] mb-5 relative h-1 rounded-full overflow-hidden z-0 ${previewDarkMode ? 'bg-slate-800' : 'bg-slate-200/80'}`}>
                                <div
                                  className="h-full transition-all duration-500 ease-out"
                                  style={{
                                    width: sIdx < previewStep ? '100%' : '0%',
                                    backgroundColor: themeColor
                                  }}
                                />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm space-y-5 transition-all duration-300 ${previewDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-forest/15 text-slate-800'
                  }`}>
                  <div className={`border-b pb-3 ${previewDarkMode ? 'border-slate-800' : 'border-forest/10'}`}>
                    <h3 className={`font-bold text-base font-display ${previewDarkMode ? 'text-emerald-400' : 'text-forest'}`}>{sections[previewStep]?.title}</h3>
                    {sections[previewStep]?.description && (
                      <p className={`text-xs mt-1 leading-relaxed ${previewDarkMode ? 'text-slate-400' : 'text-muted-foreground'}`}>{sections[previewStep].description}</p>
                    )}
                  </div>
                  {sections[previewStep]?.fields.filter(field => evaluateFieldCondition(field.condition, previewData)).map((field) => (
                    <div key={field.id} className={`p-4 rounded-2xl border space-y-2 transition-all duration-300 ${previewDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
                      }`}>
                      <label className={`text-xs font-bold block ${previewDarkMode ? 'text-slate-300' : 'text-forest'}`}>{field.label}</label>

                      {renderMockPreviewSpecialField(field, 'wizard') ? (
                        renderMockPreviewSpecialField(field, 'wizard')
                      ) : field.type === 'schedule_event' ? (
                        <ScheduleEventWidget
                          field={field}
                          value={previewData[field.id]}
                          onChange={(val) => handlePreviewFieldChange(field.id, 'schedule_event', val)}
                          themeColor={themeColor}
                          isDark={previewDarkMode}
                          borderRadius={borderRadius}
                        />
                      ) : field.type === 'richtext' ? (
                        <div className="space-y-1.5 pt-0.5">
                          <RichTextEditor
                            value={previewData[field.id] || ''}
                            onChange={(html) => setPreviewData({ ...previewData, [field.id]: html })}
                            placeholder={field.placeholder || 'Escribe tu respuesta con formato enriquecido (negrita, viñetas, enlaces)...'}
                            minHeight={field.maxHeight || '160px'}
                          />
                        </div>
                      ) : field.type === 'single_choice' ? (
                        <div className="space-y-1.5">
                          {(field.options || []).map((opt) => {
                            const isSelected = previewData[field.id] === opt;
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-2 p-2.5 text-xs font-medium cursor-pointer transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${isSelected
                                  ? (previewDarkMode ? 'bg-slate-800 text-white font-bold border-2' : 'bg-white shadow-xs font-bold border-2')
                                  : (previewDarkMode ? 'bg-slate-950 border border-slate-800 text-slate-350 hover:bg-slate-900' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')
                                  }`}
                                style={isSelected ? { borderColor: themeColor } : {}}
                              >
                                <input
                                  type="radio"
                                  name={`prev_wz_${field.id}`}
                                  checked={isSelected}
                                  onChange={() => setPreviewData({ ...previewData, [field.id]: opt })}
                                  className="w-3.5 h-3.5"
                                  style={{ accentColor: themeColor }}
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : field.type === 'multiple_choice' ? (
                        <div className="space-y-1.5">
                          {(field.options || []).map((opt) => {
                            const arr = previewData[field.id] || [];
                            const isChecked = arr.includes(opt);
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-2 p-2.5 text-xs font-medium cursor-pointer transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${isChecked
                                  ? (previewDarkMode ? 'bg-slate-800 text-white font-bold border-2' : 'bg-white shadow-xs font-bold border-2')
                                  : (previewDarkMode ? 'bg-slate-950 border border-slate-800 text-slate-355 hover:bg-slate-900' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')
                                  }`}
                                style={isChecked ? { borderColor: themeColor } : {}}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const next = e.target.checked ? [...arr, opt] : arr.filter((x: string) => x !== opt);
                                    setPreviewData({ ...previewData, [field.id]: next });
                                  }}
                                  className="w-3.5 h-3.5 rounded"
                                  style={{ accentColor: themeColor }}
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
                                className={`flex items-start gap-3.5 p-4 cursor-pointer text-xs transition-all border-2 relative ${getRadiusClass(borderRadius, 'input')
                                  } ${getShadowClass(shadowStyle)} ${isSelected
                                    ? (previewDarkMode ? 'bg-slate-800 text-white font-semibold' : 'bg-white shadow-xs font-semibold')
                                    : (previewDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900' : 'bg-white/70 border border-slate-200 text-slate-700 hover:bg-white')
                                  }`}
                                style={isSelected ? { borderColor: themeColor } : {}}
                              >
                                <div className="flex items-center h-5 shrink-0 mt-0.5">
                                  <input
                                    type={allowMultiple ? 'checkbox' : 'radio'}
                                    name={`prev_wz_${field.id}`}
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
                                    className={`w-4 h-4 ${allowMultiple ? 'rounded' : ''}`}
                                    style={{ accentColor: themeColor }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <span className={`font-bold text-sm block leading-tight ${previewDarkMode ? 'text-emerald-400' : 'text-forest'}`}>{opt.title}</span>
                                  {opt.description && (
                                    <p className={`text-xs font-normal leading-relaxed ${previewDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{opt.description}</p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : field.type === 'range' ? (
                        <div className="space-y-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">
                              {field.minLabel || `Mín: ${field.min ?? 0}`}
                            </span>
                            <div
                              className="px-3 py-1 rounded-full text-white text-xs font-bold font-mono shadow-xs"
                              style={{ backgroundColor: themeColor }}
                            >
                              {previewData[field.id] !== undefined ? previewData[field.id] : (field.defaultValue ?? field.min ?? 0)} {field.unit || ''}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              {field.maxLabel || `Máx: ${field.max ?? 10}`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={field.min ?? 0}
                            max={field.max ?? 10}
                            step={field.step ?? 1}
                            value={previewData[field.id] !== undefined ? previewData[field.id] : (field.defaultValue ?? field.min ?? 0)}
                            onChange={(e) => setPreviewData({ ...previewData, [field.id]: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-forest transition-all"
                            style={{ accentColor: themeColor }}
                          />
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          placeholder={field.placeholder || 'Tu respuesta...'}
                          value={previewData[field.id] || ''}
                          onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.value })}
                          className={getInputStyles(previewDarkMode).className}
                          style={getInputStyles(previewDarkMode).style}
                        />
                      ) : (
                        <input
                          type={field.type === 'date' ? 'date' : field.type === 'integer' || field.type === 'decimal' ? 'number' : 'text'}
                          placeholder={field.placeholder || 'Tu respuesta...'}
                          value={previewData[field.id] || ''}
                          onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.value })}
                          className={getInputStyles(previewDarkMode).className}
                          style={getInputStyles(previewDarkMode).style}
                        />
                      )}
                    </div>
                  ))}

                  <div className={`pt-3 border-t flex items-center justify-between ${previewDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button
                      type="button"
                      onClick={() => setPreviewStep(Math.max(0, previewStep - 1))}
                      disabled={previewStep === 0}
                      className={`px-4 py-2 text-xs font-bold disabled:opacity-30 cursor-pointer transition-all ${previewDarkMode ? 'text-emerald-400 hover:bg-slate-800/60' : 'text-forest hover:bg-slate-100'
                        } ${getRadiusClass(borderRadius, 'button')}`}
                    >
                      {previewLocale === 'en' ? 'Previous Step' : 'Paso Anterior'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (previewStep < sections.length - 1) setPreviewStep(previewStep + 1);
                        else toast.success(previewLocale === 'en' ? 'Preview completed!' : '¡Vista previa completada!');
                      }}
                      className={`px-5 py-2.5 text-white text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                      style={{ backgroundColor: previewStep < sections.length - 1 ? themeColor : secondaryColor }}
                    >
                      {previewStep < sections.length - 1
                        ? (previewLocale === 'en' ? 'Continue' : 'Continuar')
                        : (previewLocale === 'en' ? 'Complete & Submit' : 'Completar y Enviar')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: RESPUESTAS (RESPONSES & ANALYTICS)                */}
        {/* ======================================================== */}
        {!loading && activeTab === 'responses' && (
          <div className="space-y-6 pb-16 animate-in fade-in duration-150">

            {/* Summary Metrics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Total de Respuestas</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-forest font-display">{responsesData.totalResponses}</span>
                  <div className="w-9 h-9 rounded-2xl bg-forest/5 text-forest flex items-center justify-center shadow-2xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Estado del Formulario</span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-emerald-700 font-display">
                    {isPublished ? 'Aceptando Respuestas' : 'Pausado (Borrador)'}
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Exportación de Datos</span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={responsesData.responses.length === 0}
                    className="px-3.5 py-1.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar CSV</span>
                  </button>
                  <div className="w-9 h-9 rounded-2xl bg-forest/5 text-forest flex items-center justify-center shadow-2xs">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Poll Statistics Section */}
            {allFlatQuestions.some(q => q.type === 'poll') && (
              <div className="bg-white rounded-3xl p-6 border border-forest/10 shadow-2xs space-y-6">
                <button
                  type="button"
                  onClick={() => setIsPollStatsExpanded(!isPollStatsExpanded)}
                  className="flex items-center justify-between w-full text-left cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-forest/5 text-forest flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-forest group-hover:underline">Estadísticas de Encuestas</h3>
                      <p className="text-[11px] text-muted-foreground">Distribución de votos y preferencias en tiempo real.</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-forest/55 transition-transform duration-300 ${isPollStatsExpanded ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {isPollStatsExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200 slide-in-from-top-2">
                    {allFlatQuestions.filter(q => q.type === 'poll').map(fld => {
                      const stats = pollStats[fld.id] || { totalVotes: 0, options: {} };
                      const opts = fld.pollConfig?.options || [];

                      return (
                        <div key={fld.id} className="space-y-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-forest/60 tracking-wider font-mono">
                              {fld.pollConfig?.allowMultiple ? 'Selección Múltiple' : 'Selección Única'}
                            </span>
                            <h4 className="text-xs font-bold text-forest leading-snug">{fld.label}</h4>
                            <p className="text-[10px] text-muted-foreground">
                              {stats.totalVotes} {stats.totalVotes === 1 ? 'respuesta registrada' : 'respuestas registradas'}
                            </p>
                          </div>

                          <div className="space-y-3">
                            {opts.map(opt => {
                              const optStat = stats.options[opt.id] || { count: 0, pct: 0 };
                              return (
                                <div key={opt.id} className="space-y-1.5">
                                  <div className="flex items-start justify-between text-xs gap-3">
                                    <div className="min-w-0 flex-1">
                                      <span className="font-semibold text-forest text-xs block truncate leading-tight">{opt.title}</span>
                                      {opt.description && (
                                        <span className="text-[10px] text-slate-500 block truncate font-normal leading-tight mt-0.5">{opt.description}</span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-bold text-forest/80 shrink-0 whitespace-nowrap">
                                      {optStat.count} {optStat.count === 1 ? 'voto' : 'votos'} ({optStat.pct}%)
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden relative shadow-inner">
                                    <div
                                      className="h-full rounded-full transition-all duration-500 bg-forest"
                                      style={{ width: `${optStat.pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="bg-white rounded-2xl px-3.5 py-2 flex items-center gap-2.5 border border-forest/15 shadow-xs flex-1 max-w-md">
                <Search className="w-4 h-4 text-forest/50 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por remitente, correo, origen o respuestas..."
                  value={responseSearch}
                  onChange={(e) => setResponseSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-forest focus:outline-none placeholder:text-muted-foreground"
                />
                {responseSearch && (
                  <button type="button" onClick={() => setResponseSearch('')} className="p-1 text-muted-foreground hover:text-forest">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="text-xs font-semibold text-muted-foreground">
                Mostrando {filteredResponses.length} de {responsesData.totalResponses} registros
              </div>
            </div>

            {/* Responses Table / List */}
            {responsesLoading ? (
              <div className="bg-white rounded-3xl border border-forest/35 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-forest/5 text-forest font-bold uppercase text-[10px] tracking-wider border-b border-forest/10">
                      <tr>
                        <th className="px-4 py-3">Enviado por</th>
                        <th className="px-4 py-3">Fecha y Hora</th>
                        <th className="px-4 py-3">Progreso / Respuestas</th>
                        <th className="px-4 py-3">Firma / Adjuntos</th>
                        <th className="px-4 py-3">Origen / Proceso</th>
                        <th className="px-4 py-3 text-right">Ficha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest/5">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-forest/10 shrink-0" />
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="h-3 w-28 bg-forest/10 rounded-md" />
                                <div className="h-2.5 w-36 bg-forest/5 rounded-md" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-1.5">
                              <div className="h-3 w-20 bg-forest/10 rounded-md" />
                              <div className="h-2.5 w-14 bg-forest/5 rounded-md" />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-1.5 w-32">
                              <div className="flex justify-between">
                                <div className="h-2.5 w-16 bg-forest/10 rounded-md" />
                                <div className="h-2.5 w-8 bg-forest/5 rounded-md" />
                              </div>
                              <div className="h-1.5 w-full bg-forest/10 rounded-full" />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-14 bg-forest/10 rounded-full" />
                              <div className="h-5 w-16 bg-forest/5 rounded-full" />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="h-5 w-24 bg-forest/10 rounded-full" />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="h-7 w-20 bg-forest/10 rounded-xl ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-forest/5 text-forest flex items-center justify-center mx-auto shadow-2xs">
                  <MessageSquare className="w-7 h-7 text-forest/40" />
                </div>
                <h4 className="font-bold text-sm text-forest font-display">Aún no hay respuestas registradas</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Comparte el enlace del formulario para recibir respuestas en modo público o vincúlalo a cualquier proceso de la institución.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-forest/35 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-forest/5 text-forest font-bold uppercase text-[10px] tracking-wider border-b border-forest/10">
                      <tr>
                        <th className="px-4 py-3">Enviado por</th>
                        <th className="px-4 py-3">Fecha y Hora</th>
                        <th className="px-4 py-3">Progreso / Respuestas</th>
                        <th className="px-4 py-3">Firma / Adjuntos</th>
                        <th className="px-4 py-3">Origen / Proceso</th>
                        <th className="px-4 py-3 text-right">Ficha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest/5 text-forest/90">
                      {filteredResponses.map((res) => {
                        const answeredCount = allFlatQuestions.filter(q => {
                          const val = res.data[q.id];
                          return val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0);
                        }).length;
                        const totalQ = allFlatQuestions.length;
                        const pct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 100;
                        const initial = (res.respondentName || res.respondentEmail || 'R').charAt(0).toUpperCase();

                        return (
                          <tr
                            key={res.id}
                            onClick={() => handleOpenResponse(res)}
                            className="hover:bg-forest/5 transition-colors cursor-pointer group"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-forest/10 text-forest font-bold text-xs flex items-center justify-center shrink-0 border border-forest/20">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-forest block text-xs group-hover:underline decoration-forest/30">
                                      {res.respondentName || 'Anónimo'}
                                    </span>
                                    {!res.isReviewed && (
                                      <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-2xs shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        Sin revisar
                                      </span>
                                    )}
                                  </div>
                                  {res.respondentEmail && (
                                    <span className="text-[11px] text-muted-foreground block truncate max-w-[180px]">
                                      {res.respondentEmail}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">
                              <div className="font-medium text-slate-700">
                                {new Date(res.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(res.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-bold ${pct === 100 ? 'text-emerald-700' : 'text-forest'}`}>
                                    {answeredCount} / {totalQ} ({pct}%)
                                  </span>
                                </div>
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-forest transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: themeColor }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {res.signature && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200/60 flex items-center gap-1">
                                    <Check className="w-3 h-3 stroke-[3]" /> Firma
                                  </span>
                                )}
                                {res.files && res.files.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200/60 flex items-center gap-1">
                                    <UploadCloud className="w-3 h-3" /> {res.files.length}
                                  </span>
                                )}
                                {!res.signature && (!res.files || res.files.length === 0) && (
                                  <span className="text-muted-foreground text-[11px]">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.8 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${res.processType === 'ADMISSION'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-forest/10 text-forest'
                                }`}>
                                {res.processType === 'ADMISSION' ? <Users className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                <span className="truncate max-w-[150px]">{res.processLabel || 'Directo / Público'}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenResponse(res);
                                  }}
                                  className="px-3 py-1.5 bg-forest/10 hover:bg-forest hover:text-white text-forest rounded-xl font-bold transition-all text-xs flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Ficha</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteResponse(res.id, res.respondentName);
                                  }}
                                  disabled={deletingResponseId === res.id}
                                  className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all disabled:opacity-40"
                                  title="Eliminar respuesta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reusable Submission Details SlideOver Drawer */}
            <AdmissionFormResponseDrawer
              isOpen={!!selectedSubmission}
              onClose={() => setSelectedSubmission(null)}
              submission={selectedSubmission}
              template={currentTemplate}
              onDelete={(id, name) => handleDeleteResponse(id, name)}
              isDeleting={deletingResponseId === selectedSubmission?.id}
            />
          </div>
        )}

        {/* MOBILE FLOATING SAVE OR SHARE BUTTON */}
        {!loading && (
          <div className="sm:hidden fixed bottom-6 right-6 z-40">
            {isNew ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="h-14 px-5 rounded-full bg-forest text-white shadow-2xl shadow-forest/40 border-2 border-white/20 flex items-center gap-2 font-bold text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Guardar nuevo formulario"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin text-white" /> : <Save className="w-5 h-5 text-white" />}
                <span>Guardar Formulario</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="w-14 h-14 rounded-full bg-forest text-white shadow-2xl shadow-forest/40 border-2 border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Compartir enlace y configurar privacidad"
                aria-label="Compartir enlace del formulario"
              >
                <Share2 className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        )}

        {/* Close 2. MAIN CONTENT BODY */}
      </div>

      {/* ======================================================== */}
      {/* MODAL: COMPARTIR FORMULARIO (ESTILO GOOGLE WORKSPACE)    */}
      {/* ======================================================== */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-forest/10 space-y-6 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-forest-dark">Compartir Formulario</h3>
                  <p className="text-xs text-muted-foreground">Configura los permisos de acceso y obtén el enlace público</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Link Copy Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Enlace Directo
              </label>
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
                <Link2 className="w-4 h-4 text-forest/70 ml-2 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/forms/${currentTemplateId}`}
                  className="bg-transparent text-xs font-medium text-slate-800 flex-1 outline-hidden select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="px-3 py-1.5 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest-light transition-all flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Access Mode Selector */}
            <div className="space-y-3 pt-2 border-t border-forest/10">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Acceso General
              </label>

              <div className="space-y-2">
                {/* Public Option */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${accessType === 'PUBLIC'
                    ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50/70'
                    }`}
                >
                  <input
                    type="radio"
                    name="accessMode"
                    value="public"
                    checked={accessType === 'PUBLIC'}
                    onChange={() => setAccessType('PUBLIC')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cualquier persona con el enlace</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Cualquier usuario puede ver y responder este formulario sin necesidad de iniciar sesión.
                    </p>
                  </div>
                </label>

                {/* Restricted Option */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${accessType === 'RESTRICTED_WHITELIST'
                    ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-400/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50/70'
                    }`}
                >
                  <input
                    type="radio"
                    name="accessMode"
                    value="restricted"
                    checked={accessType === 'RESTRICTED_WHITELIST'}
                    onChange={() => setAccessType('RESTRICTED_WHITELIST')}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Restringido (Solo correos autorizados)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Solo los usuarios cuyos correos electrónicos estén en la lista blanca podrán acceder y responder.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Whitelist Management (Only when Restricted) */}
            {accessType === 'RESTRICTED_WHITELIST' && (
              <div className="space-y-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Personas Autorizadas ({allowedEmails.length})</span>
                  </span>
                </div>

                {/* Add Email Input */}
                <form onSubmit={handleAddWhitelistEmail} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-400/30 font-medium placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL / LIGHTBOX: VISOR INTERACTIVO DE FOTOS Y DOCUMENTOS */}
      {/* ======================================================== */}
      {adminPreviewPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/92 backdrop-blur-md flex flex-col animate-in fade-in duration-200 select-none"
          onClick={() => setAdminPreviewPhoto(null)}
        >
          {/* Top Bar Header */}
          <div
            className="p-4 bg-black/60 border-b border-white/10 flex items-center justify-between gap-4 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <FileImage className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate">
                  {adminPreviewPhoto.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {adminPreviewPhoto.fileName && (
                    <span className="truncate max-w-[200px] sm:max-w-xs">{adminPreviewPhoto.fileName}</span>
                  )}
                  {adminPreviewPhoto.fileSize && (
                    <span>• {(adminPreviewPhoto.fileSize / 1024).toFixed(1)} KB</span>
                  )}
                  {adminPreviewPhoto.capturedAt && (
                    <span>• {new Date(adminPreviewPhoto.capturedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setAdminPreviewZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAdminPreviewZoom((z) => Math.min(3, z + 0.25))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAdminPreviewRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Girar 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminPreviewZoom(1);
                  setAdminPreviewRotation(0);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer hidden sm:block"
                title="Restablecer vista"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => handleDownloadFile(adminPreviewPhoto.url, adminPreviewPhoto.fileName || 'captura.jpg')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                title="Descargar imagen"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Descargar</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminPreviewPhoto(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer ml-1"
                title="Cerrar visor (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Viewport Container */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
              style={{
                transform: `scale(${adminPreviewZoom}) rotate(${adminPreviewRotation}deg)`,
              }}
            >
              <img
                src={adminPreviewPhoto.url}
                alt={adminPreviewPhoto.title}
                className="max-w-[90vw] max-h-[75vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PALETTE LEFT DRAWER (SLIDE-IN MODAL)                     */}
      {/* ======================================================== */}
      {isPaletteDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsPaletteDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl border-r border-forest/15 flex flex-col animate-in slide-in-from-left duration-250 ease-out">
              {/* Drawer Header */}
              <div className="p-5 border-b border-forest/10 flex items-center justify-between bg-forest/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-forest text-white flex items-center justify-center shadow-xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-forest font-display">
                      Paleta de Campos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {paletteTargetIndex !== null
                        ? `Insertando en la posición ${paletteTargetIndex + 1}`
                        : 'Selecciona o arrastra el campo que deseas añadir'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaletteDrawerOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-forest hover:bg-white transition-colors cursor-pointer"
                  title="Cerrar paleta"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="p-4 border-b border-forest/10 space-y-3 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-forest/40 pointer-events-none" />
                  <input
                    type="text"
                    value={paletteSearchQuery}
                    onChange={(e) => setPaletteSearchQuery(e.target.value)}
                    placeholder="Buscar tipo de campo (ej. selfie, firma, kyc)..."
                    className="w-full pl-10 pr-9 py-2.5 bg-forest/5 border border-forest/15 rounded-xl text-xs font-semibold text-forest placeholder:text-forest/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/20 shadow-2xs"
                  />
                  {paletteSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPaletteSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {[
                    { id: 'ALL', label: 'Todos' },
                    { id: 'BASIC', label: 'Texto' },
                    { id: 'NUMERIC', label: 'Numéricos' },
                    { id: 'CHOICE', label: 'Opciones' },
                    { id: 'ADVANCED', label: 'Avanzados / KYC' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedPaletteCategory(cat.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${selectedPaletteCategory === cat.id
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-forest/5 hover:bg-forest/10 text-forest border border-forest/10'
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Fields List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                {filteredPaletteGroups.map((grp) => (
                  <div key={grp.id} className="space-y-2">
                    <span className="text-[11px] font-bold text-forest/60 uppercase tracking-wider block px-1">
                      {grp.group}
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {grp.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', `palette_${item.type}`);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onClick={() => {
                              handleAddField(item.type, paletteTargetIndex ?? currentSection?.fields.length);
                              setIsPaletteDrawerOpen(false);
                              setPaletteTargetIndex(null);
                              toast.success(`Campo "${item.label}" agregado.`);
                            }}
                            className="p-3 bg-white hover:bg-forest hover:text-white border border-forest/15 hover:border-forest rounded-2xl transition-all text-left group shadow-2xs hover:shadow-md flex items-start gap-3 cursor-pointer select-none"
                          >
                            <div className="w-10 h-10 rounded-xl bg-forest/5 group-hover:bg-white/20 border border-forest/10 group-hover:border-white/30 text-forest group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                              <ItemIcon className="w-5 h-5 text-forest group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-bold text-forest group-hover:text-white block truncate">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 group-hover:bg-white/20 text-emerald-800 group-hover:text-white text-[9px] font-extrabold border border-emerald-200 group-hover:border-white/30 shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground group-hover:text-white/80 leading-relaxed mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-white transition-opacity shrink-0 self-center" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredPaletteGroups.length === 0 && (
                  <div className="p-8 text-center space-y-2 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto text-forest/20" />
                    <p className="text-xs font-semibold">No se encontraron tipos de campo coincidentes.</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3.5 border-t border-forest/10 bg-forest/5 flex items-center justify-between text-xs text-forest font-semibold">
                <span className="text-[11px] text-forest/70">18 tipos de campos disponibles</span>
                <button
                  type="button"
                  onClick={() => setIsPaletteDrawerOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-forest/15 hover:bg-forest/10 text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official PDF Document Viewer Modal / Drawer */}
      {adminPreviewPdf && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setAdminPreviewPdf(null)}
        >
          <div
            className="relative w-full max-w-5xl h-[92vh] max-h-[950px] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3 sm:p-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm sm:text-base truncate">
                    {adminPreviewPdf.title}
                  </h3>
                  <p className="text-slate-400 text-xs truncate">
                    Documento Oficial RENAPO • {adminPreviewPdf.filename}
                  </p>
                </div>
              </div>

              {/* Action Toolbar (Viewer handles native print & download) */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setAdminPreviewPdf(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded PDF Viewer Frame */}
            <div className="flex-1 w-full bg-slate-950 p-2 sm:p-3 relative overflow-hidden">
              <iframe
                id="curp-pdf-preview-frame"
                src={adminPreviewPdf.url}
                className="w-full h-full border-0 rounded-2xl bg-white shadow-inner"
                title={adminPreviewPdf.title}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FormEditorPage;
