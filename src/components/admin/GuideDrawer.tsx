import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  User,
  Users,
  HeartHandshake,
  FileText,
  Upload,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  Layers,
  Check,
  Plus,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  School,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Workflow,
  Crown,
  Key,
  BookOpen,
  Award,
  AlertCircle,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Bell,
  Globe,
  ClipboardList,
  CheckSquare,
  Settings,
  Activity,
  Compass,
  Heart,
  Shield,
  Star,
  Sliders,
  Smile,
  Trophy,
  CheckCircle2,
  Info,
  UserPlus,
  Folder,
  PieChart,
  Clock,
  Lock,
  MapPin,
  CreditCard,
  Bookmark,
  ListTodo,
  Lightbulb,
  Send
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import {
  GuideUserItem,
  EnvironmentItem,
  createGuide,
  updateGuide,
  getProcesses,
  startProcessApplication,
  getAdmissionApplications,
  getGuideDocuments,
  addGuideDocument,
  updateGuideDocument,
  deleteGuideDocument,
  UserDocumentItem,
  getAuthHeaders
} from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAdminDashboard } from '@/pages/admin/AdminDashboard';
import { toast } from 'sonner';
import { useSiteSettings } from '@/context/SettingsContext';
import { getCountryIdLabels } from './CreateAdmissionModal';

export type StaffRoleType = 'LEAD_GUIDE' | 'ASSISTANT' | 'SPECIALIST' | 'COORDINATOR' | 'SUPPORT' | 'EXECUTIVE' | 'OTHER';

export interface StaffRoleConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const STAFF_ROLES: Record<StaffRoleType, StaffRoleConfig> = {
  COORDINATOR: {
    label: 'Coordinación Pedagógica',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-200',
    description: 'Liderazgo pedagógico y supervisión curricular.'
  },
  LEAD_GUIDE: {
    label: 'Guía Titular',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    description: 'Responsable pedagógica del ambiente y presentaciones.'
  },
  ASSISTANT: {
    label: 'Asistente Montessori',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-200',
    description: 'Acompañamiento, orden y soporte en el salón.'
  },
  SPECIALIST: {
    label: 'Especialista / Terapeuta',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    description: 'Psicopedagogía, lenguaje, motricidad o desarrollo.'
  },
  SUPPORT: {
    label: 'Apoyo Educativo',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-800',
    badgeBorder: 'border-stone-200',
    description: 'Auxiliar educativo o talleres complementarios.'
  },
  EXECUTIVE: {
    label: 'Dirección Ejecutiva',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    description: 'Cargo ejecutivo sobre la gestión del colegio.'
  },
  OTHER: {
    label: 'Otro rol',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-800',
    badgeBorder: 'border-stone-200',
    description: 'Otro desempeño.'
  }
};

const SUGGESTED_CERTS = [
  'AMI 0-3 (Comunidad Infantil)',
  'AMI 3-6 (Casa de Niños)',
  'AMI 6-12 (Taller I y II)',
  'AMS Montessori Certified',
  'NAMC Montessori Diploma',
  'Disciplina Positiva Certificada',
  'Primeros Auxilios Pediátricos',
  'Neurodesarrollo & Inclusión'
];

export interface CertItem {
  id: string;
  name: string;
  year?: number | '';
}

export function parseCertifications(stored?: string): CertItem[] {
  if (!stored || !stored.trim()) return [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => ({
        id: item.id || `cert_${idx}_${Date.now()}`,
        name: typeof item === 'string' ? item : item.name || '',
        year: typeof item === 'object' && item.year ? Number(item.year) : ''
      }));
    }
  } catch {
    return stored.split(',').map((str, idx) => {
      const trimmed = str.trim();
      const match = trimmed.match(/^(.*?)\s*\((\d{4})\)$/);
      if (match) {
        return {
          id: `cert_${idx}_${Date.now()}`,
          name: match[1].trim(),
          year: Number(match[2])
        };
      }
      return {
        id: `cert_${idx}_${Date.now()}`,
        name: trimmed,
        year: ''
      };
    }).filter(c => Boolean(c.name));
  }
  return [];
}

export function stringifyCertifications(items: CertItem[]): string {
  const valid = items.filter(c => c.name.trim());
  return JSON.stringify(valid);
}

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 1 1-2.896-2.896c.156 0 .308.016.457.045V9.347a6.34 6.34 0 0 0-.457-.016 6.341 6.341 0 1 0 6.341 6.341V8.98a8.214 8.214 0 0 0 4.77 1.526V7.06a4.78 4.78 0 0 1-1.000-.374z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export interface GuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  guide: GuideUserItem | null;
  guidesList?: GuideUserItem[];
  environments: EnvironmentItem[];
  onSaved: () => void;
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    Workflow,
    Layers,
    ClipboardList,
    UserPlus,
    Compass,
    Folder,
    Calendar,
    Settings,
    BookOpen,
    User,
    Award,
    CheckSquare,
    FileText,
    Activity,
    Heart,
    Shield,
    Star,
    GraduationCap,
    Building2,
    Sparkles,
    Globe,
    Sliders,
    PieChart,
    Bell,
    Clock,
    Lock,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Bookmark,
    ListTodo,
    Lightbulb,
    Send,
    Smile,
    Trophy
  };
  return icons[iconName] || Layers;
};

const getStandardIcon = (modId: string) => {
  switch (modId) {
    case 'finances': return CreditCard;
    case 'students': return Users;
    case 'graduated_students': return Award;
    case 'tutors': return HeartHandshake;
    case 'guides': return GraduationCap;
    case 'waitlist': return Clock;
    case 'admissions': return Workflow;
    case 'processes': return Sliders;
    case 'montessori': return Compass;
    case 'curriculum': return BookOpen;
    case 'environments': return Layers;
    case 'attendance': return CheckCircle2;
    case 'events': return Calendar;
    case 'newsletters': return Mail;
    case 'announcements': return Bell;
    case 'documents': return FileText;
    case 'forms': return CheckSquare;
    case 'applications': return Globe;
    case 'gallery': return Sparkles;
    case 'traffic': return Activity;
    case 'settings': return Settings;
    default: return Layers;
  }
};

export interface PermissionModuleItem {
  id: string;
  label: string;
  desc: string;
  readDesc: string;
  writeDesc: string;
}

export interface PermissionCategoryGroup {
  category: string;
  icon?: any;
  modules: PermissionModuleItem[];
}

const PERMISSION_GROUPS: PermissionCategoryGroup[] = [
  {
    category: 'Administración & Finanzas',
    modules: [
      {
        id: 'finances',
        label: 'Gestión de Finanzas & Pagos',
        desc: 'Planes de pago, mensualidades, conceptos de cobro, conciliación y estado financiero',
        readDesc: 'Ver balances y pagos',
        writeDesc: 'Cobros, planes y pagos'
      },
    ]
  },
  {
    category: 'Comunidad, Alumnos & Familias',
    modules: [
      {
        id: 'students',
        label: 'Matrícula Activa (Estudiantes)',
        desc: 'Expedientes de alumnos activos, datos médicos, fichas y credenciales',
        readDesc: 'Consultar alumnos',
        writeDesc: 'Crear/editar alumnos'
      },
      {
        id: 'graduated_students',
        label: 'Alumnos Graduados',
        desc: 'Expedientes y archivo histórico de egresados y diplomas',
        readDesc: 'Ver egresados',
        writeDesc: 'Gestionar graduados'
      },
      {
        id: 'tutors',
        label: 'Padres & Tutores (Familias)',
        desc: 'Directorio familiar, autorizaciones de recogida y datos de contacto',
        readDesc: 'Ver directorio familiar',
        writeDesc: 'Editar datos y retiro'
      },
      {
        id: 'guides',
        label: 'Equipo Docente & Staff',
        desc: 'Organigrama, expedientes de guías, asignación de salones y roles',
        readDesc: 'Ver equipo docente',
        writeDesc: 'Crear/editar empleados'
      },
    ]
  },
  {
    category: 'Admisiones & Procesos',
    modules: [
      {
        id: 'admissions',
        label: 'Procesos de Admisión',
        desc: 'Embudo general de admisiones, postulaciones, entrevistas y expedientes',
        readDesc: 'Consultar postulaciones',
        writeDesc: 'Mover etapas y evaluar'
      },
      {
        id: 'processes',
        label: 'Configuración de Procesos / Embudos',
        desc: 'Etapas, automatizaciones, requisitos y diseño de embudos',
        readDesc: 'Ver pipelines',
        writeDesc: 'Crear/editar procesos'
      },
      {
        id: 'waitlist',
        label: 'Lista de Espera',
        desc: 'Fichas y registro de aspirantes e interesados en cupos',
        readDesc: 'Ver interesados',
        writeDesc: 'Gestionar y matricular'
      },
      {
        id: 'forms',
        label: 'Formularios & Fichas',
        desc: 'Constructor y plantillas de formularios dinámicos y encuestas',
        readDesc: 'Ver plantillas',
        writeDesc: 'Crear/editar formularios'
      },
    ]
  },
  {
    category: 'Pedagogía Montessori & Salones',
    modules: [
      {
        id: 'montessori',
        label: 'Seguimiento Montessori & Progreso',
        desc: 'Presentaciones, bitácora evolutiva, informes de progreso y matriz',
        readDesc: 'Ver progreso y lecciones',
        writeDesc: 'Registrar presentaciones'
      },
      {
        id: 'curriculum',
        label: 'Áreas y Currículo Montessori',
        desc: 'Planes curriculares, lecciones y materiales Montessori',
        readDesc: 'Consultar currículo',
        writeDesc: 'Modificar planes'
      },
      {
        id: 'environments',
        label: 'Salones & Ambientes',
        desc: 'Configuración de salones, capacidades y guías asignadas',
        readDesc: 'Ver salones',
        writeDesc: 'Crear/editar ambientes'
      },
      {
        id: 'attendance',
        label: 'Asistencia Diaria',
        desc: 'Pase de lista diario, retardos y ausencias justificadas',
        readDesc: 'Ver asistencia diaria',
        writeDesc: 'Pasar lista y justificar'
      },
    ]
  },
  {
    category: 'Comunicación, Difusión & Archivos',
    modules: [
      {
        id: 'events',
        label: 'Calendario & Eventos',
        desc: 'Agenda institucional, citas pedagógicas y eventos escolares',
        readDesc: 'Ver calendario escolar',
        writeDesc: 'Crear y agendar eventos'
      },
      {
        id: 'newsletters',
        label: 'Boletines & Comunicados',
        desc: 'Diseño y distribución de boletines escolares y comunicados',
        readDesc: 'Ver comunicados enviados',
        writeDesc: 'Diseñar y enviar boletines'
      },
      {
        id: 'announcements',
        label: 'Anuncios & Banners',
        desc: 'Marquesinas y alertas urgentes superiores del sistema',
        readDesc: 'Ver anuncios activos',
        writeDesc: 'Publicar/borrar alertas'
      },
      {
        id: 'documents',
        label: 'Documentación General',
        desc: 'Repositorio institucional, circulares y descargas de guías',
        readDesc: 'Consultar y descargar',
        writeDesc: 'Subir/eliminar archivos'
      },
      {
        id: 'applications',
        label: 'Aplicativos & Enlaces',
        desc: 'Enlaces a portales externos y accesos directos escolares',
        readDesc: 'Ver portales y links',
        writeDesc: 'Configurar enlaces'
      },
      {
        id: 'gallery',
        label: 'Galería de Fotos & Álbumes',
        desc: 'Crear álbumes temáticos, subir fotografías y compartir con salones o familias',
        readDesc: 'Ver fotos y álbumes',
        writeDesc: 'Crear, subir y compartir'
      },
    ]
  },
  {
    category: 'Configuración & Analítica',
    modules: [
      {
        id: 'traffic',
        label: 'Métricas de Tráfico Web',
        desc: 'Estadísticas de visitas y análisis de navegación en el portal',
        readDesc: 'Visualizar métricas',
        writeDesc: 'Gestionar reportes'
      },
      {
        id: 'settings',
        label: 'Configuración Escolar',
        desc: 'Datos del colegio, ciclo lectivo, logotipos y sede',
        readDesc: 'Consultar ajustes',
        writeDesc: 'Editar escuela y ajustes'
      },
    ]
  }
];

export const GuideDrawer: React.FC<GuideDrawerProps> = ({
  isOpen,
  onClose,
  guide,
  guidesList = [],
  environments,
  onSaved
}) => {
  const currentYear = new Date().getFullYear();
  const { role, user, userEmail } = useAuth();
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
  const confirm = useConfirm();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || role === 'SUPERADMIN';
  const isTutor = role === 'TUTOR';
  const { schoolCountry } = useSiteSettings();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [wizardDirection, setWizardDirection] = useState<'forward' | 'backward'>('forward');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRoleType>('LEAD_GUIDE');
  const [selectedSupervisorIds, setSelectedSupervisorIds] = useState<string[]>([]);
  const [practiceStartYear, setPracticeStartYear] = useState<number | ''>('');
  const [certList, setCertList] = useState<CertItem[]>([]);
  const [bio, setBio] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [socialX, setSocialX] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [password, setPassword] = useState('ceiba123');
  const [systemRole, setSystemRole] = useState<'TEACHER' | 'STAFF'>('TEACHER');
  const [selectedEnvIds, setSelectedEnvIds] = useState<string[]>([]);
  const [rfc, setRfc] = useState('');
  const [curp, setCurp] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [availableProcesses, setAvailableProcesses] = useState<any[]>([]);

  const parsePermissions = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string');
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.modules)) {
          return parsed.modules.filter((x): x is string => typeof x === 'string');
        }
      } catch {
        return [];
      }
    }
    if (typeof raw === 'object') {
      if (Array.isArray(raw.modules)) {
        return raw.modules.filter((x): x is string => typeof x === 'string');
      }
    }
    return [];
  };

  useEffect(() => {
    if (isOpen) {
      getProcesses()
        .then(setAvailableProcesses)
        .catch(err => console.error('Failed to load processes in GuideDrawer:', err));
    }
  }, [isOpen]);

  // Documents States
  const [documents, setDocuments] = useState<UserDocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState('');
  const [savingDocName, setSavingDocName] = useState(false);

  // Horizontal scroll for tabs in edit mode
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabsScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkTabsScroll);
    window.addEventListener('resize', checkTabsScroll);
    checkTabsScroll();
    return () => {
      el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [checkTabsScroll, currentStep, guide]);

  useEffect(() => {
    const timer = setTimeout(checkTabsScroll, 100);
    return () => clearTimeout(timer);
  }, [checkTabsScroll, currentStep]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -180 : 180;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const EDIT_TABS = [
    { step: 1, label: 'Identidad & Contacto', icon: User },
    { step: 2, label: 'Currículum', icon: GraduationCap },
    { step: 3, label: 'Rol & Salones', icon: Crown },
    { step: 4, label: 'Documentos', icon: FileText },
    { step: 5, label: 'Permisos (RBAC)', icon: ShieldCheck }
  ];

  // Load documents
  useEffect(() => {
    if (isOpen && guide?.id && currentStep === 4) {
      setLoadingDocs(true);
      getGuideDocuments(guide.id)
        .then(setDocuments)
        .catch(err => toast.error(err.message || 'Error al obtener documentos'))
        .finally(() => setLoadingDocs(false));
    }
  }, [isOpen, guide?.id, currentStep]);

  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0 || !guide?.id) return;

    setUploadingDocs(true);
    let successCount = 0;
    let errorCount = 0;

    const authHeaders: Record<string, string> = { ...getAuthHeaders() };
    delete authHeaders['Content-Type'];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const docName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadProgressText(`Subiendo ${i + 1} de ${fileArray.length}: ${file.name}`);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'documents');
        formData.append('employeeId', guide.id);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: authHeaders,
          body: formData
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.error || `Error al subir ${file.name}`);
        }

        const uploadData = await uploadRes.json();
        if (!uploadData.url) {
          throw new Error(`No se recibió la URL para ${file.name}`);
        }

        const newDoc = await addGuideDocument(guide.id, {
          name: docName,
          fileUrl: uploadData.url,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size
        });

        setDocuments(prev => [newDoc, ...prev]);
        successCount++;
      } catch (err: any) {
        console.error('Error uploading document:', err);
        errorCount++;
      }
    }

    setUploadingDocs(false);
    setUploadProgressText('');

    if (successCount > 0) {
      if (successCount === 1) {
        toast.success('Documento subido correctamente');
      } else {
        toast.success(`Se subieron ${successCount} documentos con éxito`);
      }
    }
    if (errorCount > 0) {
      toast.error(`Hubo un error al subir ${errorCount} archivo(s)`);
    }
  };

  const handleStartEditDoc = (doc: UserDocumentItem) => {
    setEditingDocId(doc.id);
    setEditingDocName(doc.name);
  };

  const handleCancelEditDoc = () => {
    setEditingDocId(null);
    setEditingDocName('');
  };

  const handleSaveDocName = async (docId: string) => {
    if (!guide?.id || !editingDocName.trim()) return;
    setSavingDocName(true);
    try {
      const updated = await updateGuideDocument(guide.id, docId, { name: editingDocName.trim() });
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, name: updated.name } : d));
      setEditingDocId(null);
      setEditingDocName('');
      toast.success('Nombre del documento actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al renombrar el documento');
    } finally {
      setSavingDocName(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName?: string) => {
    if (!guide?.id) return;
    const ok = await confirm({
      title: '¿Eliminar Documento?',
      description: docName
        ? `¿Estás seguro de que deseas eliminar el documento "${docName}"? Esta acción no se puede deshacer.`
        : '¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteGuideDocument(guide.id, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success('Documento eliminado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el documento');
    }
  };


  useEffect(() => {
    if (guide) {
      setFullName(guide.fullName || '');
      setEmail(guide.email || '');
      setPhone(guide.phone || '');
      setAvatarUrl(guide.avatarUrl || '');
      setJobTitle(guide.jobTitle || '');
      setStaffRole((guide.staffRole as StaffRoleType) || 'LEAD_GUIDE');
      const sups = guide.supervisors ? guide.supervisors.map(s => s.id) : (guide.supervisorId ? [guide.supervisorId] : []);
      setSelectedSupervisorIds(sups);
      setPracticeStartYear(guide.practiceStartYear || '');
      setCertList(parseCertifications(guide.certifications));
      setBio(guide.bio || '');
      setRfc(guide.rfc || '');
      setCurp(guide.curp || '');
      setSocialLinkedin(guide.socialLinkedin || '');
      setSocialX(guide.socialX || '');
      setSocialFacebook(guide.socialFacebook || '');
      setSocialInstagram(guide.socialInstagram || '');
      setSocialTiktok(guide.socialTiktok || '');
      setSocialYoutube(guide.socialYoutube || '');
      setPassword('');
      setSystemRole(guide.role || 'TEACHER');
      setSelectedEnvIds(guide.environments ? guide.environments.map(e => e.id) : []);
      setSelectedPermissions(parsePermissions(guide.permissions));
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setAvatarUrl('');
      setJobTitle('');
      setStaffRole('LEAD_GUIDE');
      setSelectedSupervisorIds([]);
      setPracticeStartYear('');
      setCertList([]);
      setBio('');
      setRfc('');
      setCurp('');
      setSocialLinkedin('');
      setSocialX('');
      setSocialFacebook('');
      setSocialInstagram('');
      setSocialTiktok('');
      setSocialYoutube('');
      setPassword('ceiba123');
      setSystemRole('TEACHER');
      setSelectedEnvIds([]);
      setSelectedPermissions([]);
    }
    setCurrentStep(1);
    setWizardDirection('forward');
  }, [guide, isOpen]);

  const goToStep = (targetStep: number) => {
    if (targetStep > currentStep) {
      if (currentStep === 1) {
        if (!fullName.trim()) {
          toast.error('El nombre completo es obligatorio');
          return;
        }
        if (!guide && !email.trim()) {
          toast.error('El correo institucional es obligatorio');
          return;
        }
        if (!guide && !password.trim()) {
          toast.error('La contraseña inicial es obligatoria');
          return;
        }
      }
      setWizardDirection('forward');
    } else {
      setWizardDirection('backward');
    }
    setCurrentStep(targetStep);
  };

  const handleAddCert = (name: string, year?: number | '') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (certList.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Esta certificación ya está agregada');
      return;
    }
    setCertList([...certList, { id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name: trimmed, year: year || '' }]);
  };

  const handleRemoveCert = (id: string) => {
    setCertList(certList.filter(c => c.id !== id));
  };

  const handleUpdateCertYear = (id: string, newYear: number | '') => {
    setCertList(certList.map(c => c.id === id ? { ...c, year: newYear } : c));
  };

  const saveData = async (shouldClose: boolean) => {
    if (isReadOnly) {
      triggerBlockedAction('Registrar o modificar perfil de docente');
      return;
    }
    if (!fullName.trim()) {
      toast.error('El nombre es obligatorio');
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    try {
      const certificationsPayload = stringifyCertifications(certList);
      if (guide) {
        await updateGuide(guide.id, {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          staffRole,
          supervisorId: selectedSupervisorIds[0] || null,
          supervisorIds: selectedSupervisorIds,
          practiceStartYear: practiceStartYear !== '' ? Number(practiceStartYear) : null,
          certifications: certificationsPayload,
          bio: bio.trim() || undefined,
          rfc: rfc.trim().toUpperCase() || '',
          curp: curp.trim().toUpperCase() || '',
          socialLinkedin: socialLinkedin.trim() || undefined,
          socialX: socialX.trim() || undefined,
          socialFacebook: socialFacebook.trim() || undefined,
          socialInstagram: socialInstagram.trim() || undefined,
          socialTiktok: socialTiktok.trim() || undefined,
          socialYoutube: socialYoutube.trim() || undefined,
          role: systemRole,
          environmentIds: selectedEnvIds,
          permissions: selectedPermissions
        });
        toast.success('Docente actualizado con éxito');
      } else {
        await createGuide({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          staffRole,
          supervisorId: selectedSupervisorIds[0] || null,
          supervisorIds: selectedSupervisorIds,
          practiceStartYear: practiceStartYear !== '' ? Number(practiceStartYear) : null,
          certifications: certificationsPayload,
          bio: bio.trim() || undefined,
          rfc: rfc.trim().toUpperCase() || '',
          curp: curp.trim().toUpperCase() || '',
          socialLinkedin: socialLinkedin.trim() || undefined,
          socialX: socialX.trim() || undefined,
          socialFacebook: socialFacebook.trim() || undefined,
          socialInstagram: socialInstagram.trim() || undefined,
          socialTiktok: socialTiktok.trim() || undefined,
          socialYoutube: socialYoutube.trim() || undefined,
          password: password || 'ceiba123',
          role: systemRole,
          environmentIds: selectedEnvIds,
          permissions: selectedPermissions
        });
        toast.success('Docente registrado con éxito');
      }
      onSaved();
      if (shouldClose) {
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar docente');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveData(true);
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-xl lg:max-w-2xl"
      icon={
        avatarUrl ? (
          <div className="w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-2xl overflow-hidden shrink-0 border border-forest/15 shadow-2xs">
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <GraduationCap className="w-5 h-5 text-forest" />
        )
      }
      title={!isOwnerOrAdmin ? (guide?.fullName || 'Ficha del Docente') : (guide ? 'Editar Perfil Docente' : 'Registrar Nuevo Docente')}
      description={
        !isOwnerOrAdmin
          ? (guide?.jobTitle ? `${guide.jobTitle} • Equipo Pedagógico` : 'Perfil pedagógico, trayectoria y salones')
          : guide
            ? 'Edición de datos personales, currículum, asignaciones, documentos y permisos'
            : `Paso ${currentStep} de 3 • ${
                currentStep === 1
                  ? 'Identidad, personal, fiscal y redes sociales'
                  : currentStep === 2
                    ? 'Currículum y trayectoria'
                    : 'Rol, cargo, supervisor y salones asignados'
              }`
      }
      footer={
        !isOwnerOrAdmin ? (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-forest hover:bg-forest/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Cerrar Ficha
          </button>
        ) : guide ? (
          <div className="flex items-center justify-between w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="guide-wizard-form"
              disabled={saving}
              className="px-7 py-2.5 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar y Cerrar</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-3">
            {currentStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-6 py-2.5 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Siguiente: Currículum</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : currentStep === 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-5 py-2.5 text-xs font-bold text-forest hover:bg-forest/5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-6 py-2.5 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Siguiente: Rol / Cargo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-5 py-2.5 text-xs font-bold text-forest hover:bg-forest/5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="submit"
                  form="guide-wizard-form"
                  disabled={saving}
                  className="px-7 py-2.5 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Finalizar Registro</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )
      }
    >
      {!isOwnerOrAdmin && guide ? (
        /* ==================================================== */
        /* READ-ONLY PREVIEW MODE (TUTORS & NON-ADMIN USERS)    */
        /* ==================================================== */
        <div className="space-y-6 animate-in fade-in duration-200 pb-2">
          {/* Identity Card */}
          <div className="bg-forest/5 p-5 rounded-3xl border border-forest/10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-20 h-20 rounded-3xl bg-white border-2 border-forest/20 text-forest font-bold text-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {guide.avatarUrl ? (
                <img src={guide.avatarUrl} alt={guide.fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{guide.fullName.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0 space-y-1.5 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STAFF_ROLES[guide.staffRole as StaffRoleType]?.badgeBg || 'bg-forest/10'
                  } ${STAFF_ROLES[guide.staffRole as StaffRoleType]?.badgeText || 'text-forest'
                  } ${STAFF_ROLES[guide.staffRole as StaffRoleType]?.badgeBorder || 'border-forest/20'
                  }`}>
                  {STAFF_ROLES[guide.staffRole as StaffRoleType]?.label || 'Guía Montessori'}
                </span>
                {guide.practiceStartYear && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                    <span>{Math.max(0, currentYear - Number(guide.practiceStartYear))} años de experiencia</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-forest font-display leading-tight">{guide.fullName}</h3>
              {guide.jobTitle && (
                <p className="text-xs font-medium text-forest/70">{guide.jobTitle}</p>
              )}
              {/* Social Networks inline */}
              {(guide.socialLinkedin || guide.socialX || guide.socialFacebook || guide.socialInstagram || guide.socialTiktok || guide.socialYoutube) && (
                <div className="flex items-center justify-center sm:justify-start gap-3.5 pt-2">
                  {guide.socialLinkedin && (
                    <a href={guide.socialLinkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="text-slate-400 hover:text-[#0A66C2] transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {guide.socialX && (
                    <a href={guide.socialX} target="_blank" rel="noopener noreferrer" title="X (Twitter)" className="text-slate-400 hover:text-black transition-colors">
                      <XIcon className="w-4 h-4" />
                    </a>
                  )}
                  {guide.socialFacebook && (
                    <a href={guide.socialFacebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="text-slate-400 hover:text-[#1877F2] transition-colors">
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {guide.socialInstagram && (
                    <a href={guide.socialInstagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-slate-400 hover:text-[#E1306C] transition-colors">
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {guide.socialTiktok && (
                    <a href={guide.socialTiktok} target="_blank" rel="noopener noreferrer" title="TikTok" className="text-slate-400 hover:text-black transition-colors">
                      <TikTokIcon className="w-4 h-4" />
                    </a>
                  )}
                  {guide.socialYoutube && (
                    <a href={guide.socialYoutube} target="_blank" rel="noopener noreferrer" title="YouTube" className="text-slate-400 hover:text-[#FF0000] transition-colors">
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Privacy Banner for Tutors */}
          {isTutor && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 flex items-start gap-3 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <strong className="font-bold block text-emerald-900">Contacto & Comunicación Institucional</strong>
                <p className="text-emerald-900/80 leading-relaxed">
                  Los datos personales de contacto de los docentes se resguardan por política de privacidad. Para coordinar citas o consultas pedagógicas, por favor utiliza los canales oficiales de recepción del colegio.
                </p>
              </div>
            </div>
          )}

          {/* Supervisor Card */}
          {guide.supervisor && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {guide.supervisor.avatarUrl ? (
                  <img src={guide.supervisor.avatarUrl} alt={guide.supervisor.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{guide.supervisor.fullName.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Bajo la supervisión de
                </span>
                <strong className="text-xs font-bold text-slate-900 block truncate">
                  {guide.supervisor.fullName}
                </strong>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {guide.supervisor.jobTitle || 'Coordinación'}
                </span>
              </div>
            </div>
          )}

          {/* Bio */}
          {guide.bio && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-forest uppercase tracking-wider font-display">Semblanza Pedagógica</h4>
              <div className="p-4 rounded-2xl bg-white border border-forest/10 text-xs text-slate-700 leading-relaxed italic shadow-2xs">
                "{guide.bio}"
              </div>
            </div>
          )}

          {/* Certifications */}
          {parseCertifications(guide.certifications).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-forest uppercase tracking-wider font-display">Certificaciones & Formación</h4>
              <div className="flex flex-wrap gap-2">
                {parseCertifications(guide.certifications).map(c => (
                  <span key={c.id} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50/80 text-amber-950 border border-amber-200/70 flex items-center gap-1.5 shadow-2xs">
                    <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{c.name} {c.year ? `(${c.year})` : ''}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Environments */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-forest uppercase tracking-wider font-display">Salones & Ambientes Asignados</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {guide.environments && guide.environments.length > 0 ? (
                guide.environments.map(e => (
                  <div key={e.id} className="p-3 rounded-2xl bg-white border border-forest/10 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: e.color || '#1b3b2b' }} />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-800 block truncate">{e.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">{e.stage || 'Montessori'}</span>
                      </div>
                    </div>
                    {e.isLead && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Titular</span>
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic col-span-2">Sin salones asignados</span>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ==================================================== */
        /* NAVEGACIÓN: TABS (EDICIÓN) O WIZARD (REGISTRO)       */
        /* ==================================================== */
        <div className="space-y-6">
          {guide ? (
            /* TABS CON SCROLL HORIZONTAL Y HANDLERS PARA EDICIÓN */
            <div className="relative border-b border-forest/15 flex items-center bg-transparent">
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollTabs('left')}
                  className="shrink-0 mr-1.5 p-1 sm:p-1.5 rounded-full bg-white hover:bg-forest/5 text-forest border border-forest/20 transition-all shadow-xs hover:scale-110 active:scale-95 cursor-pointer z-10 -mt-1"
                  title="Desplazar pestañas a la izquierda"
                  aria-label="Desplazar a la izquierda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div
                ref={tabsContainerRef}
                className="flex-1 flex items-center gap-2 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap select-none touch-pan-x px-1"
              >
                {EDIT_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = currentStep === tab.step;
                  return (
                    <button
                      key={tab.step}
                      type="button"
                      onClick={() => goToStep(tab.step)}
                      className={`pb-3 px-1.5 sm:px-2 text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${
                        isActive
                          ? 'border-forest text-forest font-bold font-display'
                          : 'border-transparent text-slate-500 hover:text-forest font-medium hover:border-forest/30'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-forest' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollTabs('right')}
                  className="shrink-0 ml-1.5 p-1 sm:p-1.5 rounded-full bg-white hover:bg-forest/5 text-forest border border-forest/20 transition-all shadow-xs hover:scale-110 active:scale-95 cursor-pointer z-10 -mt-1"
                  title="Desplazar pestañas a la derecha"
                  aria-label="Desplazar a la derecha"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            /* WIZARD DE 3 PASOS PARA REGISTRO NUEVO */
            <div className="bg-forest/5 p-3 rounded-2xl border border-forest/10">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                    currentStep === 1
                      ? 'bg-white text-forest shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-forest hover:bg-white/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      currentStep === 1 ? 'bg-forest text-white' : 'bg-forest/10 text-forest'
                    }`}
                  >
                    1
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <span className="text-[11px] block truncate">Identidad</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                    currentStep === 2
                      ? 'bg-white text-forest shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-forest hover:bg-white/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      currentStep === 2 ? 'bg-forest text-white' : 'bg-forest/10 text-forest'
                    }`}
                  >
                    2
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <span className="text-[11px] block truncate">Currículum</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                    currentStep === 3
                      ? 'bg-white text-forest shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-forest hover:bg-white/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      currentStep === 3 ? 'bg-forest text-white' : 'bg-forest/10 text-forest'
                    }`}
                  >
                    3
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <span className="text-[11px] block truncate">Rol / Cargo</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <form id="guide-wizard-form" onSubmit={handleSave} className="space-y-6">
            {/* PASO 1: IDENTIDAD Y ROL */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 flex flex-col sm:flex-row items-center gap-4">
                  <div className="shrink-0 w-full sm:w-72 min-w-0">
                    <ImageUploadDropzone
                      value={avatarUrl}
                      onChange={(url) => setAvatarUrl(url || '')}
                      folder="avatars/guides"
                      previewSize="circle"
                      label="Foto del docente"
                    />
                  </div>
                  <div className="min-w-0 text-center sm:text-left space-y-1">
                    <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
                      Fotografía Profesional
                    </span>
                    <p className="text-xs text-muted-foreground leading-snug">
                      Recomendada foto clara para identificación de las familias.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. María Montessori"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">Correo Electrónico *</label>
                    <input
                      type="email"
                      disabled={Boolean(guide) && !isOwnerOrAdmin}
                      required
                      placeholder="docente@ceiba.edu.mx"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">Teléfono de Contacto</label>
                    <input
                      type="tel"
                      placeholder="Ej. +52 999 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>
                </div>

                {!guide && (
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">Contraseña Inicial *</label>
                    <input
                      type="text"
                      required
                      placeholder="ceiba123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-mono"
                    />
                  </div>
                )}

                {/* Identificación y Fiscalidad */}
                <div className="pt-4 border-t border-forest/10 space-y-3">
                  <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
                    Datos de Identificación y Fiscalidad
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-forest mb-1.5">
                        {getCountryIdLabels(schoolCountry).fiscalLabel} (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder={getCountryIdLabels(schoolCountry).fiscalPlaceholder}
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-forest mb-1.5">
                        {getCountryIdLabels(schoolCountry).personalLabel} (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder={getCountryIdLabels(schoolCountry).personalPlaceholder}
                        value={curp}
                        onChange={(e) => setCurp(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-forest/10 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
                      Redes Sociales del Docente
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Enlaces opcionales a los perfiles sociales y profesionales del docente.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] shrink-0" /> LinkedIn
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/usuario"
                        value={socialLinkedin}
                        onChange={(e) => setSocialLinkedin(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <XIcon className="w-3.5 h-3.5 text-black shrink-0" /> X (Twitter)
                      </label>
                      <input
                        type="url"
                        placeholder="https://x.com/usuario"
                        value={socialX}
                        onChange={(e) => setSocialX(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5 text-[#1877F2] shrink-0" /> Facebook
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/usuario"
                        value={socialFacebook}
                        onChange={(e) => setSocialFacebook(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-[#E1306C] shrink-0" /> Instagram
                      </label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/usuario"
                        value={socialInstagram}
                        onChange={(e) => setSocialInstagram(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <TikTokIcon className="w-3.5 h-3.5 text-black shrink-0" /> TikTok
                      </label>
                      <input
                        type="url"
                        placeholder="https://tiktok.com/@usuario"
                        value={socialTiktok}
                        onChange={(e) => setSocialTiktok(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-[#FF0000] shrink-0" /> YouTube
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/@canal"
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: TRAYECTORIA, EXPERIENCIA Y FORMACIÓN */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">Año de Inicio de Práctica Educativa</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1970"
                      max={currentYear}
                      placeholder="Ej. 2018"
                      value={practiceStartYear}
                      onChange={(e) => setPracticeStartYear(e.target.value ? Number(e.target.value) : '')}
                      className="w-40 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                    {practiceStartYear && (
                      <span className="text-xs font-bold text-forest bg-forest/10 px-3 py-2 rounded-xl">
                        {Math.max(0, currentYear - Number(practiceStartYear))} años de experiencia
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">Semblanza Profesional & Filosofía Pedagógica</label>
                  <textarea
                    rows={4}
                    placeholder="Describe su trayectoria, experiencia en Montessori, talleres o vocación..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-forest">Certificaciones & Diplomas Montessori</label>
                    <span className="text-[10px] text-muted-foreground">{certList.length} agregadas</span>
                  </div>

                  {/* Cert list */}
                  <div className="space-y-2 mb-3">
                    {certList.map((cert) => (
                      <div key={cert.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <Award className="w-4 h-4 text-forest shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 flex-1 truncate">{cert.name}</span>
                        <input
                          type="number"
                          min="1970"
                          max={currentYear}
                          placeholder="Año"
                          value={cert.year || ''}
                          onChange={(e) => handleUpdateCertYear(cert.id, e.target.value ? Number(e.target.value) : '')}
                          className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCert(cert.id)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Suggested pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-forest/70 uppercase tracking-wider block">Sugerencias rápidas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_CERTS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleAddCert(c)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-forest/5 hover:bg-forest/15 text-forest border border-forest/10 transition-colors"
                        >
                          + {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: ROL / CARGO */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">Rol*</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as StaffRoleType)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    >
                      {Object.entries(STAFF_ROLES).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">Cargo / Título Profesional</label>
                    <input
                      type="text"
                      placeholder="Ej. Guía AMI Comunidad Infantil"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>
                </div>

                {guidesList.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5 font-display">
                      Coordinadores / Supervisores Pedagógicos (Directo o superior)
                    </label>
                    <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 max-h-48 overflow-y-auto space-y-2">
                      {guidesList
                        .filter(g => !guide || g.id !== guide.id)
                        .map(g => {
                          const isChecked = selectedSupervisorIds.includes(g.id);
                          return (
                            <label
                              key={g.id}
                              className={`flex items-center gap-3 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${isChecked
                                ? 'bg-forest/5 border-forest/30 text-forest shadow-2xs'
                                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedSupervisorIds(prev => prev.filter(id => id !== g.id));
                                  } else {
                                    setSelectedSupervisorIds(prev => [...prev, g.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded-md accent-forest cursor-pointer"
                              />
                              <div className="flex items-center gap-2">
                                {g.avatarUrl ? (
                                  <img src={g.avatarUrl} alt={g.fullName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-100" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-forest/10 text-forest font-bold flex items-center justify-center text-[10px] shrink-0">
                                    {g.fullName.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <span className="block font-bold">{g.fullName}</span>
                                  <span className="block text-[9px] text-muted-foreground mt-0.5">
                                    {STAFF_ROLES[g.staffRole as StaffRoleType]?.label || g.jobTitle || 'Docente'}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      {guidesList.filter(g => !guide || g.id !== guide.id).length === 0 && (
                        <div className="text-center text-[11px] text-slate-400 font-semibold py-4">
                          No hay otros docentes registrados para seleccionar como supervisor.
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400/80 mt-1 block">
                      Selecciona uno o más supervisores para definir su jerarquía en el organigrama.
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-forest/10">
                  <label className="block text-xs font-bold text-forest mb-1">Salones & Ambientes en los que trabaja</label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Selecciona los ambientes en los que este docente interactúa o tiene responsabilidad pedagógica.
                  </p>

                  <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50 max-h-60 overflow-y-auto">
                    {environments.map(env => {
                      const isChecked = selectedEnvIds.includes(env.id);
                      return (
                        <label
                          key={env.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white transition-colors cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEnvIds([...selectedEnvIds, env.id]);
                              } else {
                                setSelectedEnvIds(selectedEnvIds.filter(id => id !== env.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest"
                          />
                          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: env.color || '#1b3b2b' }} />
                          <span className="font-semibold text-slate-800 flex-1 truncate">{env.name}</span>
                          <span className="text-[10px] text-muted-foreground">{env.stage || 'Montessori'}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: DOCUMENTOS OFICIALES */}
            {currentStep === 4 && guide && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-forest/5 border border-forest/10 p-4 rounded-2xl">
                  <h4 className="font-bold text-xs text-forest uppercase tracking-wider mb-1">
                    Bitácora & Documentos Oficiales
                  </h4>
                  <p className="text-[11px] text-forest/70">
                    Sube y organiza contratos, certificaciones y otros archivos oficiales de {guide.fullName}.
                  </p>
                </div>

                {/* Full-width Drag & Drop Zone (Multiple Files) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleUploadFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`w-full p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 relative cursor-pointer group ${
                    isDragOver
                      ? 'border-forest bg-forest/10 scale-[1.01] shadow-md'
                      : 'border-forest/20 hover:border-forest/40 bg-slate-50/70 hover:bg-forest/5'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    disabled={uploadingDocs}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleUploadFiles(e.target.files);
                        e.target.value = '';
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx"
                  />

                  <div className="w-14 h-14 rounded-2xl bg-white border border-forest/15 text-forest flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:border-forest/30 transition-transform">
                    {uploadingDocs ? (
                      <Upload className="w-6 h-6 text-forest animate-bounce" />
                    ) : (
                      <Upload className="w-6 h-6 text-forest" />
                    )}
                  </div>

                  <div className="space-y-1 max-w-sm">
                    <h4 className="font-bold text-forest text-sm">
                      {uploadingDocs ? 'Subiendo archivos...' : 'Arrastrá tus documentos aquí o hacé clic para explorar'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {uploadingDocs ? uploadProgressText : 'Soporta subida múltiple de archivos (PDF, Word, Excel, Imágenes)'}
                    </p>
                  </div>

                  {uploadingDocs && (
                    <div className="w-full max-w-xs bg-forest/10 rounded-full h-1.5 overflow-hidden mt-1">
                      <div className="bg-forest h-full w-full animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Listado de archivos */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
                    Documentos Guardados ({documents.length})
                  </span>

                  {loadingDocs ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Cargando documentos...
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground italic bg-white border border-forest/5 rounded-2xl">
                      No hay ningún documento guardado para este usuario.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {documents.map(doc => {
                        const fileExt = doc.fileUrl.split('.').pop()?.toLowerCase() || '';
                        const formattedSize = doc.fileSize
                          ? `${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB`
                          : 'Archivo adjunto';
                        const isEditing = editingDocId === doc.id;

                        return (
                          <div
                            key={doc.id}
                            className="bg-white border border-slate-100 hover:border-forest/20 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-2xs group transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-forest/5 border border-forest/10 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-forest" />
                              </div>
                              <div className="min-w-0 flex-1">
                                {isEditing ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleSaveDocName(doc.id);
                                    }}
                                    className="flex items-center gap-1.5"
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editingDocName}
                                      onChange={(e) => setEditingDocName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') handleCancelEditDoc();
                                      }}
                                      className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-forest/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-forest text-forest shadow-2xs"
                                    />
                                    <button
                                      type="submit"
                                      disabled={savingDocName || !editingDocName.trim()}
                                      className="p-1.5 bg-forest hover:bg-forest/90 text-white rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                      title="Guardar nombre"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditDoc}
                                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </form>
                                ) : (
                                  <>
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-xs text-forest hover:underline block truncate"
                                    >
                                      {doc.name}
                                    </a>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                      {fileExt.toUpperCase()} • {formattedSize} • Subido el {new Date(doc.createdAt).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {!isEditing && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditDoc(doc)}
                                  className="p-2 rounded-xl text-muted-foreground hover:text-forest hover:bg-forest/5 transition-all cursor-pointer"
                                  title="Cambiar nombre del documento"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                  className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0 cursor-pointer"
                                  title="Eliminar documento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASO 5: PERMISOS & ACCESOS */}
            {/* STEP 5: PERMISSIONS (RBAC) */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Permissions Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-forest/5 border border-forest/10 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-forest text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-forest text-xs sm:text-sm">Control de Acceso Granular (RBAC)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Definí con precisión los módulos a los que esta guía puede acceder. Podés otorgar permisos de <strong>solo lectura</strong> o <strong>escritura/gestión completa</strong> por herramienta.
                    </p>
                  </div>
                </div>

                {/* Quick Bulk Actions Toolbar */}
                <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-forest flex items-center gap-1.5 pl-1">
                    <ShieldCheck className="w-4 h-4 text-forest" />
                    <span>Acciones Rápidas:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const allReadKeys: string[] = [];
                        PERMISSION_GROUPS.forEach(g => {
                          g.modules.forEach(m => allReadKeys.push(`${m.id}:read`));
                        });
                        availableProcesses.forEach(p => allReadKeys.push(`process_${p.slug}:read`));
                        const existingWrites = (selectedPermissions || []).filter(p => p.endsWith(':write'));
                        setSelectedPermissions(Array.from(new Set([...allReadKeys, ...existingWrites])));
                      }}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white text-forest border border-forest/15 hover:bg-forest/5 transition-all shadow-3xs cursor-pointer"
                    >
                      + Todo Lectura
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const allKeys: string[] = [];
                        PERMISSION_GROUPS.forEach(g => {
                          g.modules.forEach(m => allKeys.push(`${m.id}:read`, `${m.id}:write`));
                        });
                        availableProcesses.forEach(p => allKeys.push(`process_${p.slug}:read`, `process_${p.slug}:write`));
                        setSelectedPermissions(Array.from(new Set(allKeys)));
                      }}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-forest text-white hover:bg-forest/90 transition-all shadow-3xs cursor-pointer"
                    >
                      + Control Total
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPermissions([])}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all shadow-3xs cursor-pointer"
                    >
                      Limpiar Todo
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions Tables */}
                <div className="space-y-6">
                  {PERMISSION_GROUPS.map(group => (
                    <div key={group.category} className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-forest uppercase tracking-wider block font-display">
                          {group.category}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground bg-forest/5 px-2 py-0.5 rounded-full border border-forest/10">
                          {group.modules.length} {group.modules.length === 1 ? 'módulo' : 'módulos'}
                        </span>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs bg-white">
                        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-2.5 sm:p-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <div className="col-span-6 sm:col-span-6">Módulo / Herramienta</div>
                          <div className="col-span-3 sm:col-span-3 text-center">Lectura</div>
                          <div className="col-span-3 sm:col-span-3 text-center">Escritura</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {group.modules.map(mod => {
                            const safePerms = Array.isArray(selectedPermissions) ? selectedPermissions : [];
                            const readKey = `${mod.id}:read`;
                            const writeKey = `${mod.id}:write`;
                            const hasRead = safePerms.includes(readKey) || safePerms.includes(mod.id);
                            const hasWrite = safePerms.includes(writeKey);
                            const ModIcon = getStandardIcon(mod.id);

                            const handleReadChange = () => {
                              if (hasRead) {
                                setSelectedPermissions(safePerms.filter(p => p !== readKey && p !== writeKey && p !== mod.id));
                              } else {
                                setSelectedPermissions([...safePerms.filter(p => p !== mod.id), readKey]);
                              }
                            };

                            const handleWriteChange = () => {
                              if (hasWrite) {
                                setSelectedPermissions(safePerms.filter(p => p !== writeKey));
                              } else {
                                const listWithoutReadWrite = safePerms.filter(p => p !== readKey && p !== writeKey && p !== mod.id);
                                setSelectedPermissions([...listWithoutReadWrite, readKey, writeKey]);
                              }
                            };

                            return (
                              <div key={mod.id} className="grid grid-cols-12 p-3 sm:p-3.5 items-center hover:bg-slate-50/50 transition-all gap-2">
                                <div className="col-span-6 sm:col-span-6 pr-2 flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-forest/5 text-forest flex items-center justify-center border border-forest/10 shrink-0 shadow-2xs">
                                    <ModIcon className="w-4 h-4 text-forest" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs text-forest block leading-snug truncate">{mod.label}</span>
                                    <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5 truncate">{mod.desc}</span>
                                  </div>
                                </div>

                                {/* Read Column */}
                                <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center">
                                  <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={hasRead}
                                      onChange={handleReadChange}
                                      className="accent-forest rounded w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="text-[9px] text-slate-500 font-medium text-center leading-none mt-1 max-w-[80px] hidden sm:block">
                                      {mod.readDesc}
                                    </span>
                                  </label>
                                </div>

                                {/* Write Column */}
                                <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center">
                                  <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={hasWrite}
                                      onChange={handleWriteChange}
                                      className="accent-forest rounded w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="text-[9px] text-slate-500 font-medium text-center leading-none mt-1 max-w-[80px] hidden sm:block">
                                      {mod.writeDesc}
                                    </span>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Dynamic configured admissions processes / pipelines */}
                  {availableProcesses.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-forest uppercase tracking-wider block font-display">
                          Procesos y Pipelines Configurados
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground bg-forest/5 px-2 py-0.5 rounded-full border border-forest/10">
                          {availableProcesses.length} {availableProcesses.length === 1 ? 'pipeline' : 'pipelines'}
                        </span>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs bg-white">
                        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-2.5 sm:p-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <div className="col-span-6 sm:col-span-6">Proceso / Embudo</div>
                          <div className="col-span-3 sm:col-span-3 text-center">Lectura</div>
                          <div className="col-span-3 sm:col-span-3 text-center">Escritura</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {availableProcesses.map(proc => {
                            const safePerms = Array.isArray(selectedPermissions) ? selectedPermissions : [];
                            const basePermId = `process_${proc.slug}`;
                            const readKey = `${basePermId}:read`;
                            const writeKey = `${basePermId}:write`;
                            const hasRead = safePerms.includes(readKey) || safePerms.includes(basePermId);
                            const hasWrite = safePerms.includes(writeKey);
                            const ProcIcon = getIconComponent(proc.icon);

                            const handleReadChange = () => {
                              if (hasRead) {
                                setSelectedPermissions(safePerms.filter(p => p !== readKey && p !== writeKey && p !== basePermId));
                              } else {
                                setSelectedPermissions([...safePerms.filter(p => p !== basePermId), readKey]);
                              }
                            };

                            const handleWriteChange = () => {
                              if (hasWrite) {
                                setSelectedPermissions(safePerms.filter(p => p !== writeKey));
                              } else {
                                const listWithoutReadWrite = safePerms.filter(p => p !== readKey && p !== writeKey && p !== basePermId);
                                setSelectedPermissions([...listWithoutReadWrite, readKey, writeKey]);
                              }
                            };

                            return (
                              <div key={proc.id} className="grid grid-cols-12 p-3 sm:p-3.5 items-center hover:bg-slate-50/50 transition-all gap-2">
                                <div className="col-span-6 sm:col-span-6 pr-2 flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-forest/5 text-forest flex items-center justify-center border border-forest/10 shrink-0 shadow-2xs">
                                    <ProcIcon className="w-4 h-4 text-forest" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs text-forest block leading-snug truncate">{proc.name || proc.title}</span>
                                    <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5 truncate">Pipeline "{proc.slug}"</span>
                                  </div>
                                </div>

                                {/* Read Column */}
                                <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center">
                                  <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={hasRead}
                                      onChange={handleReadChange}
                                      className="accent-forest rounded w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="text-[9px] text-slate-500 font-medium text-center leading-none mt-1 max-w-[80px] hidden sm:block">
                                      Ver prospectos
                                    </span>
                                  </label>
                                </div>

                                {/* Write Column */}
                                <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center">
                                  <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={hasWrite}
                                      onChange={handleWriteChange}
                                      className="accent-forest rounded w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="text-[9px] text-slate-500 font-medium text-center leading-none mt-1 max-w-[80px] hidden sm:block">
                                      Editar y mover
                                    </span>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>
      )}
    </SlideOverDrawer>
  );
};

export default GuideDrawer;
