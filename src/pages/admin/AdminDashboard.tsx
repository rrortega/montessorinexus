import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings, getButtonRadiusClass, getAvatarRadiusClass, getButtonHeightClass } from '@/context/SettingsContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart2,
  Folder,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  AppWindow,
  Images,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Building2,
  ChevronDown,
  Check,
  Plus,
  Sparkles,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock,
  BookOpen,
  Target,
  FileCheck2,
  LayoutDashboard,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { WebTrafficSection } from './WebTrafficSection';
import { DocumentsSection } from './DocumentsSection';
import { ApplicationsSection } from './ApplicationsSection';
import { AdminGallerySection } from './AdminGallerySection';
import { AdminSettings } from './AdminSettings';
import { AdminSystemSettings } from './AdminSystemSettings';
import { AllergiesSection } from './AllergiesSection';
import { AssessmentScalesSection } from './AssessmentScalesSection';
import { ConsentTemplatesSection } from './ConsentTemplatesSection';
import { StudentsSection } from './StudentsSection';
import { TutorsSection } from './TutorsSection';
import { MainDashboardSection } from './MainDashboardSection';
import { EnvironmentsSection } from './EnvironmentsSection';
import { TutorPortalSection } from './TutorPortalSection';
import { TutorStudentProgressSection } from './TutorStudentProgressSection';
import { FinancesSection } from './FinancesSection';
import { TutorFinancesSection } from './TutorFinancesSection';
import { GuidesSection } from './GuidesSection';
import { MontessoriSection } from './MontessoriSection';
import { JournalSection } from './JournalSection';
import { AttendanceSection } from './AttendanceSection';
import { CurriculumSection } from './CurriculumSection';
import { TrackersSection } from './TrackersSection';
import { AdmissionsProcessSection } from './AdmissionsProcessSection';
import { ProcessesConfigSection } from './ProcessesConfigSection';
import { WaitlistSection } from './WaitlistSection';
import { FormsSection } from './FormsSection';
import { EventsSection } from './EventsSection';
import { NewslettersSection } from './NewslettersSection';
import { AnnouncementsSection } from './AnnouncementsSection';
import { AdminAccountSection } from './AdminAccountSection';
import { WebBuilderSection } from './WebBuilderSection';
import { SchoolPricingSection } from './SchoolPricingSection';
import { SuperAdminSchoolsSection } from './superadmin/SuperAdminSchoolsSection';
import { SuperAdminBillingSection } from './superadmin/SuperAdminBillingSection';
import { SuperAdminInfraSection } from './superadmin/SuperAdminInfraSection';
import { CreateSchoolModal } from '@/components/admin/CreateSchoolModal';
import { getActiveAnnouncements, markAnnouncementAsViewed, AnnouncementItem, getEnvironments, EnvironmentItem, School } from '@/lib/sqlite';
import { Layers, Compass, Calendar as CalendarIcon, TrendingUp, CreditCard, Workflow, FileText, Activity, BookOpenCheck, UserCheck, Clock, Mail as MailIcon, BrainCircuit, ClipboardList, UserPlus, Award, CheckSquare, Heart, Shield, Star, Globe, Sliders, PieChart, Bell, Phone, MapPin, Bookmark, ListTodo, Lightbulb, Send, Smile, Trophy, Server, Eye } from 'lucide-react';
import { toast } from 'sonner';

export type ActiveTab =
  | 'schools-hub'
  | 'global-billing'
  | 'platform-infra'
  | 'web-builder'
  | 'attendance'
  | 'journal'
  | 'montessori'
  | 'curriculum'
  | 'trackers'
  | 'allergies'
  | 'assessments'
  | 'consents'
  | 'finances'
  | 'students'
  | 'tutors'
  | 'admissions'
  | 'waitlist'
  | 'forms'
  | 'newsletters'
  | 'announcements'
  | 'environments'
  | 'guides'
  | 'events'
  | 'documents'
  | 'applications'
  | 'gallery'
  | 'traffic'
  | 'settings'
  | 'system-settings'
  | 'portal'
  | 'progress'
  | 'account'
  | 'pricing'
  | 'subscription'
  | string;

export interface NavItem {
  id: ActiveTab;
  label: string;
  subLabel: string;
  icon: any;
  locked?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

import { getSchoolSubscriptionInfo } from '@/lib/subscription-guard';
import { TrialExpiredBlockedModal } from '@/components/admin/TrialExpiredBlockedModal';
import { SubscriptionUpgradeModal } from '@/components/admin/SubscriptionUpgradeModal';

export interface AdminDashboardContextType {
  openMobileMenu: () => void;
  isReadOnly: boolean;
  isTrialExpired: boolean;
  triggerBlockedAction: (actionTitle?: string) => boolean;
  openSubscriptionModal: () => void;
}

export const AdminDashboardContext = React.createContext<AdminDashboardContextType>({
  openMobileMenu: () => { },
  isReadOnly: false,
  isTrialExpired: false,
  triggerBlockedAction: () => true,
  openSubscriptionModal: () => { },
});

export const useAdminDashboard = () => React.useContext(AdminDashboardContext);

export const MobileMenuButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`md:hidden w-10 h-10 shrink-0 pointer-events-none opacity-0 ${className}`}
      aria-hidden="true"
    />
  );
};

export const AdminDashboard: React.FC = () => {
  const {
    logout,
    user,
    userEmail,
    role,
    memberships,
    activeMembership,
    switchSchool
  } = useAuth();

  const { buttonRadius, buttonHeight, brandPrimaryColor, schoolName } = useSiteSettings();
  const btnRadiusClass = getButtonRadiusClass(buttonRadius);
  const avatarRadiusClass = getAvatarRadiusClass(buttonRadius);
  const btnHeightClass = getButtonHeightClass(buttonHeight);

  const hasBackupSession = !!localStorage.getItem('ceiba_impersonation_original_session');

  const handleExitImpersonation = () => {
    const backupStr = localStorage.getItem('ceiba_impersonation_original_session');
    if (!backupStr) return;

    try {
      const backup = JSON.parse(backupStr);

      localStorage.setItem('ceiba_user_session', JSON.stringify(backup.user));
      localStorage.setItem('ceiba_user_email', backup.email);
      localStorage.setItem('ceiba_user_memberships', JSON.stringify(backup.memberships));
      localStorage.setItem('ceiba_active_membership', JSON.stringify(backup.activeMembership));

      localStorage.removeItem('ceiba_impersonation_original_session');

      toast.success('Regresando a tu cuenta de Administrador...');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error exiting impersonation:', err);
      toast.error('No se pudo restaurar la sesión original.');
    }
  };

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isGlobalSuperAdmin = user?.email === 'admin@montessorinexus.com' || user?.email === 'admin@ceibamontessori.com';
  const [isGhostMode, setIsGhostMode] = useState<boolean>(() => {
    if (user?.email === 'admin@montessorinexus.com' || user?.email === 'admin@ceibamontessori.com') {
      return localStorage.getItem('nexus_superadmin_ghost_mode') === 'true';
    }
    return false;
  });

  const handleEnterGhostMode = (school: School) => {
    localStorage.setItem('nexus_superadmin_ghost_mode', 'true');
    setIsGhostMode(true);
    switchSchool(school.id);
    toast.success(`Entraste como Ghost Owner al colegio: ${school.name}`);
    navigate(`${basePath}/montessori`);
  };

  const handleExitGhostMode = () => {
    localStorage.removeItem('nexus_superadmin_ghost_mode');
    setIsGhostMode(false);
    toast.info('Regresando al Centro de Control Global Superadmin...');
    navigate(`${basePath}/schools`);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [createSchoolModalOpen, setCreateSchoolModalOpen] = useState(false);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedActionTitle, setBlockedActionTitle] = useState('Esta acción');
  const [subscriptionUpgradeModalOpen, setSubscriptionUpgradeModalOpen] = useState(false);

  const subscriptionInfo = useMemo(() => {
    return getSchoolSubscriptionInfo(activeMembership?.school);
  }, [activeMembership?.school]);

  const isReadOnly = Boolean((!isGlobalSuperAdmin || isGhostMode) && subscriptionInfo.isReadOnly);
  const isTrialExpired = Boolean((!isGlobalSuperAdmin || isGhostMode) && subscriptionInfo.isTrialExpired);

  const triggerBlockedAction = (actionTitle = 'Esta acción'): boolean => {
    if (isReadOnly) {
      setBlockedActionTitle(actionTitle);
      setBlockedModalOpen(true);
      return false;
    }
    return true;
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('ceiba_admin_sidebar_collapsed') === 'true';
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    'Configuración': true
  });

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const [processes, setProcesses] = useState<any[]>([]);

  const loadProcesses = React.useCallback(() => {
    if (activeMembership?.schoolId) {
      fetch('/api/processes', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setProcesses(data);
          }
        })
        .catch((err) => console.error('Error fetching processes:', err));
    }
  }, [activeMembership?.schoolId]);

  React.useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);

  React.useEffect(() => {
    if (activeMembership?.schoolId) {
      getEnvironments()
        .then((data) => setEnvironments(data || []))
        .catch(console.error);
    }
  }, [activeMembership?.schoolId]);

  const [activeAnnouncements, setActiveAnnouncements] = useState<AnnouncementItem[]>([]);

  const loadActiveAnnouncements = React.useCallback(async () => {
    try {
      const data = await getActiveAnnouncements();
      setActiveAnnouncements(data || []);
    } catch (err) {
      console.error('Failed to load active announcements:', err);
    }
  }, []);

  React.useEffect(() => {
    if (isGlobalSuperAdmin && !isGhostMode) return;
    loadActiveAnnouncements();
    // Poll every 60 seconds to get fresh announcements
    const interval = setInterval(loadActiveAnnouncements, 60000);
    return () => clearInterval(interval);
  }, [loadActiveAnnouncements, isGlobalSuperAdmin, isGhostMode]);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [viewingAnnListOpen, setViewingAnnListOpen] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number>(() => {
    const val = localStorage.getItem('ceiba_announcements_dismissed_until');
    return val ? Number(val) : 0;
  });

  const handleOpenAnnouncements = () => {
    if (activeAnnouncements.length === 1) {
      const singleAnn = activeAnnouncements[0];
      setSelectedAnnouncement(singleAnn);
      markAnnouncementAsViewed(singleAnn.id).catch(err => console.error(err));
    } else {
      setViewingAnnListOpen(true);
    }
  };

  const handleSelectAnnouncement = (ann: AnnouncementItem) => {
    setSelectedAnnouncement(ann);
    setViewingAnnListOpen(false);
    markAnnouncementAsViewed(ann.id).catch(err => console.error(err));
  };



  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Workflow,
      Layers,
      ClipboardList,
      UserPlus,
      Compass,
      Folder,
      Calendar: CalendarIcon,
      Settings,
      BookOpen,
      Users,
      Award,
      CheckSquare,
      FileText,
      Activity,
      Heart,
      Target,
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
      Mail: MailIcon,
      Phone,
      MapPin,
      CreditCard,
      Bookmark,
      ListTodo,
      Lightbulb,
      Send,
      FileCheck2,
      UserCheck,
      Smile,
      Trophy
    };
    return icons[iconName] || Layers;
  };

  const toggleSidebarCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('ceiba_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const isOwner = role === 'OWNER' || activeMembership?.role === 'OWNER';
  const isTutor = role === 'TUTOR';
  const isTeacher = role === 'TEACHER';
  const isSuperAdmin = role === 'OWNER' || role === 'ADMIN' || isGlobalSuperAdmin;
  const isTutorActive = !isTutor || activeMembership?.hasActiveEnrollment !== false;

  const userAssignedEnvs = useMemo(() => {
    if (!user?.id) return [];
    return environments.filter(env => {
      const inGuideIds = env.guideIds?.includes(user.id);
      const inGuides = env.guides?.some((g: any) => g.userId === user.id);
      const inTeachers = env.teachers?.some((t: any) => (user.id && t.id === user.id) || (userEmail && t.email?.toLowerCase() === userEmail.toLowerCase()));
      return inGuideIds || inGuides || inTeachers;
    });
  }, [environments, user?.id, userEmail]);

  const hasAssignedEnvs = userAssignedEnvs.length > 0;

  const isAllowedTab = React.useCallback((tabId: string): boolean => {
    if (isGlobalSuperAdmin) return true;
    if (tabId === 'web-builder') {
      return isOwner;
    }

    if (isSuperAdmin) return true;

    if (isTutor) {
      if (!isTutorActive && tabId !== 'portal' && tabId !== 'progress' && tabId !== 'finances' && tabId !== 'account') {
        return false;
      }
      return ['portal', 'progress', 'finances', 'events', 'documents', 'applications', 'account', 'students', 'tutors', 'guides'].includes(tabId);
    }

    const permissions = activeMembership?.permissions || [];
    if (
      permissions.includes(tabId) ||
      permissions.includes(`${tabId}:read`) ||
      permissions.includes(`${tabId}:write`)
    ) return true;

    if (tabId === 'admissions' || tabId.startsWith('process_')) {
      return permissions.includes('admissions') ||
        permissions.includes('admissions:read') ||
        permissions.includes('admissions:write') ||
        permissions.includes('processes') ||
        permissions.includes(tabId);
    }

    // Tutors directory requires explicit permission or at least one assigned salon
    if (tabId === 'tutors') {
      return (isTeacher || role === 'STAFF') && hasAssignedEnvs;
    }

    if (isTeacher) {
      const teacherAllowed = ['montessori', 'attendance', 'students', 'guides', 'events', 'documents', 'applications', 'account'];
      return teacherAllowed.includes(tabId);
    }

    if (role === 'STAFF') {
      const staffAllowed = ['dashboard', 'montessori', 'attendance', 'students', 'guides', 'account'];
      return staffAllowed.includes(tabId);
    }

    return false;
  }, [isGlobalSuperAdmin, isGhostMode, isSuperAdmin, isTutor, isTutorActive, activeMembership, isTeacher, role, hasAssignedEnvs]);

  // Navigation groups and items configured by role and permissions
  const navGroupsList: NavGroup[] = useMemo(() => {
    if (isGlobalSuperAdmin && !isGhostMode) {
      return [
        {
          title: 'Control Global Multi-Tenant',
          items: [
            { id: 'schools-hub', label: 'Directorio de Colegios', subLabel: 'Workspaces & Acceso Ghost', icon: Building2 },
            { id: 'global-billing', label: 'Facturación Global', subLabel: 'MRR & Suscripciones', icon: CreditCard },
            { id: 'platform-infra', label: 'Infraestructura & Colas', subLabel: 'PostgreSQL, Redis & KYC', icon: Server },
          ]
        },
        {
          title: 'Configuración Central',
          items: [
            { id: 'system-settings', label: 'Ajustes del Sistema', subLabel: 'AI, SMTP & Webhooks', icon: Sliders },
            { id: 'account', label: 'Mi Cuenta', subLabel: 'Superadmin Profile', icon: UserIcon },
          ]
        }
      ];
    }

    if (isTutor) {
      if (!isTutorActive) {
        return [
          {
            title: 'Portal Familiar',
            items: [
              { id: 'portal', label: 'Portal Familiar', subLabel: 'Mis Hijos y Accesos', icon: HeartHandshake },
              { id: 'progress', label: 'Historia y Evolución', subLabel: 'Avances y Perfil del Niño', icon: TrendingUp },
              { id: 'finances', label: 'Estado de Cuenta', subLabel: 'Colegiaturas & Pagos', icon: CreditCard },
            ]
          },
          {
            title: 'Servicios',
            items: [
              { id: 'events', label: 'Calendario & Citas', subLabel: 'Matrícula Inactiva', icon: Lock, locked: true },
              { id: 'documents', label: 'Documentos', subLabel: 'Matrícula Inactiva', icon: Lock, locked: true },
              { id: 'applications', label: 'Aplicativos', subLabel: 'Matrícula Inactiva', icon: Lock, locked: true },
            ]
          }
        ];
      }

      return [
        {
          title: 'Portal Familiar',
          items: [
            { id: 'portal', label: 'Portal Familiar', subLabel: 'Mis Hijos y Accesos', icon: HeartHandshake },
            { id: 'students', label: 'Mis Hijos (Estudiantes)', subLabel: 'Ficha de Infantes', icon: Users },
            { id: 'tutors', label: 'Padres & Familia', subLabel: 'Mis Datos y Contactos', icon: HeartHandshake },
            { id: 'guides', label: 'Equipo Docente', subLabel: 'Guías de Mis Hijos', icon: GraduationCap },
            { id: 'progress', label: 'Historia y Evolución', subLabel: 'Avances y Perfil del Niño', icon: TrendingUp },
            { id: 'finances', label: 'Estado de Cuenta', subLabel: 'Colegiaturas & Pagos', icon: CreditCard },
          ]
        },
        {
          title: 'Servicios & Recursos',
          items: [
            { id: 'events', label: 'Calendario & Citas', subLabel: 'Eventos y Turnos', icon: CalendarIcon },
            { id: 'documents', label: 'Documentos', subLabel: 'Circulares y Guías', icon: Folder },
            { id: 'applications', label: 'Aplicativos', subLabel: 'Portales y Enlaces', icon: AppWindow },
          ]
        }
      ];
    }

    const masterGroups = [
      {
        title: 'Inicio',
        items: [
          { id: 'dashboard', label: 'Dashboard', subLabel: 'Resumen & Métricas Escolares', icon: LayoutDashboard },
        ]
      },
      {
        title: 'Pedagogía & Ambientes',
        items: [
          { id: 'montessori', label: 'Seguimiento de Progreso', subLabel: 'Diario, Lecciones & Trackers', icon: Compass },
          { id: 'attendance', label: 'Asistencia Diaria', subLabel: 'Control de Presentismo', icon: UserCheck },
          { id: 'environments', label: 'Ambientes & Niveles', subLabel: 'Salones y Edades', icon: Layers },
        ]
      },
      {
        title: 'Personas',
        items: [
          { id: 'students', label: 'Matrícula activa', subLabel: 'Alumnos y Familias', icon: Users },
          { id: 'graduated_students', label: 'Graduados', subLabel: 'Alumnos Egresados', icon: Award },
          { id: 'tutors', label: 'Padres & Tutores', subLabel: 'Familias y Contactos', icon: HeartHandshake },
          { id: 'guides', label: 'Equipo Docente', subLabel: 'Guías, Asistentes & Perfiles', icon: GraduationCap },
          { id: 'waitlist', label: 'Lista de Espera', subLabel: 'Prematrícula & Reserva de Cupos', icon: Clock },
        ]
      },
      {
        title: 'Procesos Administrativos',
        items: [
          ...(processes.length > 0
            ? processes.filter(p => p.isActive).map(p => ({
                id: `process_${p.slug}`,
                label: p.label || p.name,
                subLabel: p.description || 'Pipeline, Fases & Expedientes',
                icon: getIconComponent(p.icon)
              }))
            : [
                { id: 'admissions', label: 'Proceso de Admisión', subLabel: 'Pipeline, Fases & Expedientes', icon: Workflow }
              ]),
          { id: 'forms', label: 'Formularios', subLabel: 'Constructor & Encuestas', icon: FileText },
        ]
      },
      {
        title: 'Difusión',
        items: [
          { id: 'events', label: 'Calendario & Eventos', subLabel: 'Programaciones y Citas', icon: CalendarIcon },
          { id: 'newsletters', label: 'Boletines & Comunicados', subLabel: 'Creador, Difusión & Envíos', icon: MailIcon },
          { id: 'announcements', label: 'Anuncios & Banners', subLabel: 'Alertas y Marquesinas', icon: Bell },
        ]
      },
      {
        title: 'Administración & Finanzas',
        items: [
          { id: 'finances', label: 'Finanzas & Cobranza', subLabel: 'Planes y Colegiaturas', icon: CreditCard },
          { id: 'documents', label: 'Documentos', subLabel: 'Gestión de Archivos', icon: Folder },
          { id: 'applications', label: 'Aplicativos', subLabel: 'Recursos y Links', icon: AppWindow },
        ]
      },
      {
        title: 'Sitio Web',
        items: [
          { id: 'web-builder', label: 'Diseñador Web', subLabel: 'Editor Visual del Sitio', icon: Globe },
          { id: 'gallery', label: 'Galería Web', subLabel: 'Fotografías y Pedagogía', icon: Images },
          { id: 'traffic', label: 'Tráfico Web', subLabel: 'Métricas y Analíticas', icon: BarChart2 },
        ]
      },
      {
        title: 'Configuración',
        items: [
          { id: 'settings', label: 'Configuración del Colegio', subLabel: 'Identidad, Sede & Redes', icon: Settings },
          { id: 'processes', label: 'Configurar Procesos', subLabel: 'Fases, Automatizaciones & Pipeline', icon: Workflow },
          { id: 'curriculum', label: 'Fichas de Trabajo', subLabel: 'Áreas, Categorías & Lecciones', icon: BookOpen },
          { id: 'trackers', label: 'Rastreadores Diarios', subLabel: 'Categorías & Cuidados Diarios', icon: Activity },
          { id: 'allergies', label: 'Catálogo de Alergias', subLabel: 'Ficha Médica & Comedor', icon: AlertTriangle },
          { id: 'assessments', label: 'Evaluadores de Progreso', subLabel: 'Escalas & Rúbricas Montessori', icon: Target },
          { id: 'consents', label: 'Plantillas de Consentimiento', subLabel: 'Autorizaciones & Firmas', icon: FileCheck2 },
          { id: 'system-settings', label: 'Configuración del Sistema', subLabel: 'Inteligencia Artificial & Motor', icon: BrainCircuit },
        ]
      }
    ];

    return masterGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => isAllowedTab(item.id))
      }))
      .filter(group => group.items.length > 0);
  }, [isGlobalSuperAdmin, isGhostMode, isTutor, isTutorActive, isAllowedTab, processes]);

  // Determine base prefix (/panel vs /admin vs /console)
  const basePath = useMemo(() => {
    if (location.pathname.startsWith('/console')) return '/console';
    if (location.pathname.startsWith('/admin')) return '/admin';
    return '/panel';
  }, [location.pathname]);

  // Determine current active tab from pathname
  const activeTab: ActiveTab = useMemo(() => {
    const path = location.pathname.toLowerCase();
    
    if (isGlobalSuperAdmin && !isGhostMode) {
      if (path.includes('/billing') || path.includes('/facturacion')) return 'global-billing';
      if (path.includes('/infra') || path.includes('/servicios') || path.includes('/colas')) return 'platform-infra';
      if (path.includes('/system-settings') || path.includes('/sistema')) return 'system-settings';
      if (path.includes('/account') || path.includes('/cuenta') || path.includes('/perfil')) return 'account';
      if (path.includes('/schools') || path.includes('/colegios')) return 'schools-hub';
      return 'schools-hub';
    }

    if (path.endsWith('/dashboard') || path.endsWith('/inicio')) return 'dashboard';

    if (isTutor) {
      if (path.includes('/progress') || path.includes('/progreso')) return 'progress';
      if (path.includes('/finances') || path.includes('/finanzas') || path.includes('/pagos') || path.includes('/estado-de-cuenta')) return 'finances';
      if (path.includes('/students') || path.includes('/alumnos') || path.includes('/hijos')) return 'students';
      if (path.includes('/tutors') || path.includes('/tutores') || path.includes('/padres') || path.includes('/familia')) return 'tutors';
      if (path.includes('/guides') || path.includes('/guias') || path.includes('/docentes')) return 'guides';
      if (!isTutorActive) return 'portal';
      if (path.includes('/events') || path.includes('/calendario')) return 'events';
      if (path.includes('/documents')) return 'documents';
      if (path.includes('/applications') || path.includes('/aplicativos')) return 'applications';
      return 'portal';
    }

    if (path.includes('/curriculum') || path.includes('/lecciones') || path.includes('/fichas')) return isSuperAdmin ? 'curriculum' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/trackers') || path.includes('/rastreadores')) return isSuperAdmin ? 'trackers' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/allergies') || path.includes('/alergias')) return isSuperAdmin ? 'allergies' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/assessments') || path.includes('/evaluadores')) return isSuperAdmin ? 'assessments' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/consents') || path.includes('/consentimientos')) return isSuperAdmin ? 'consents' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/attendance') || path.includes('/asistencia')) return 'attendance';
    if (path.includes('/montessori')) return 'montessori';
    if (path.includes('/finances') || path.includes('/finanzas') || path.includes('/cobranza') || path.includes('/planes-de-pago')) return 'finances';
    if (path.includes('/events') || path.includes('/calendario') || path.includes('/programaciones')) return 'events';
    if (path.includes('/environments') || path.includes('/ambientes') || path.includes('/salones')) return 'environments';
    // Check if path matches any dynamic process
    const matchedProcess = processes.find(p => path.includes(`/process_${p.slug}`));
    if (matchedProcess) return `process_${matchedProcess.slug}`;
    if (path.includes('/processes') || path.includes('/configurar-procesos')) return 'processes';

    if (path.includes('/admissions') || path.includes('/admision') || path.includes('/proceso-de-admision')) return 'admissions';
    if (path.includes('/waitlist') || path.includes('/lista-de-espera') || path.includes('/prematricula')) return 'waitlist';
    if (path.includes('/forms') || path.includes('/formularios')) return 'forms';
     if (path.includes('/newsletters') || path.includes('/boletines') || path.includes('/comunicados')) return 'newsletters';
     if (path.includes('/announcements') || path.includes('/anuncios')) return 'announcements';
     if (path.includes('/tutors') || path.includes('/tutores') || path.includes('/padres')) return 'tutors';
    if (path.includes('/graduated_students') || path.includes('/graduados')) return 'graduated_students';
    if (path.includes('/students') || path.includes('/alumnos')) return 'students';
    if (path.includes('/guides') || path.includes('/guias') || path.includes('/docentes')) return 'guides';
    if (path.includes('/documents')) return 'documents';
    if (path.includes('/applications') || path.includes('/aplicativos')) return 'applications';
    if (path.includes('/web-builder') || path.includes('/disenador-web') || path.includes('/editor-web')) return isOwner ? 'web-builder' : 'dashboard';
    if (path.includes('/gallery') || path.includes('/galeria')) return isSuperAdmin ? 'gallery' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/traffic') || path.includes('/webtrafic') || path.includes('/trafico')) return isSuperAdmin ? 'traffic' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/pricing') || path.includes('/suscripcion') || path.includes('/plan') || path.includes('/membership')) return 'pricing';
    if (path.includes('/system-settings') || path.includes('/sistema')) return isSuperAdmin ? 'system-settings' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/settings') || path.includes('/configuracion')) return isSuperAdmin ? 'settings' : (isTeacher ? 'montessori' : 'portal');
    if (path.includes('/account') || path.includes('/cuenta') || path.includes('/perfil') || path.includes('/mi-cuenta')) return 'account';
    if (path.endsWith('/panel') || path.endsWith('/admin') || path.endsWith('/console') || path.endsWith('/')) {
      return isTeacher ? 'montessori' : 'dashboard';
    }
    return isTeacher ? 'montessori' : 'montessori';
  }, [location.pathname, isGlobalSuperAdmin, isGhostMode, isTutor, isTeacher, isTutorActive, isSuperAdmin, processes]);

  // Auto-expand group containing active item
  React.useEffect(() => {
    if (!activeTab) return;
    const groupToExpand = navGroupsList.find(group => 
      group.items.some(item => item.id === activeTab || (item.id.startsWith('process_') && activeTab.startsWith('process_')))
    );
    if (groupToExpand && collapsedGroups[groupToExpand.title]) {
      setCollapsedGroups(prev => ({
        ...prev,
        [groupToExpand.title]: false
      }));
    }
  }, [activeTab, navGroupsList, collapsedGroups]);

  const isEditingForm = activeTab === 'forms' && (searchParams.has('edit') || searchParams.has('id'));
  const isWebBuilder = activeTab === 'web-builder';
  const isPricingPage = activeTab === 'pricing' || activeTab === 'subscription';

  const isMarqueeVisible = useMemo(() => {
    if (isGlobalSuperAdmin && !isGhostMode) return false;
    if (activeTab === 'web-builder' || isPricingPage) return false;
    if (activeAnnouncements.length === 0) return false;

    const latestCreatedTime = activeAnnouncements.length > 0
      ? Math.max(...activeAnnouncements.map(ann => new Date(ann.createdAt || Date.now()).getTime()))
      : 0;

    const dismissedAt = Number(localStorage.getItem('ceiba_announcements_dismissed_at') || '0');

    // If there is any announcement created/modified after the last snooze, ignore the snooze
    if (latestCreatedTime > dismissedAt) {
      return true;
    }

    return Date.now() > dismissedUntil;
  }, [activeAnnouncements, dismissedUntil, activeTab, isGlobalSuperAdmin, isGhostMode]);

  const handleDismissMarquee = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const until = now + 8 * 60 * 60 * 1000;
    localStorage.setItem('ceiba_announcements_dismissed_until', String(until));
    localStorage.setItem('ceiba_announcements_dismissed_at', String(now));
    setDismissedUntil(until);
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (isTutor && !isTutorActive && tab !== 'portal' && tab !== 'progress' && tab !== 'finances' && tab !== 'account') {
      toast.error('Este módulo requiere que tu hijo tenga una matrícula activa en este colegio. Solo tienes acceso al portal histórico, seguimiento y estado de cuenta.');
      return;
    }

    if (!isAllowedTab(tab)) {
      toast.error('No tienes permisos asignados para acceder a este módulo.');
      return;
    }

    // Check if custom module is disabled in subscription
    if ((!isGlobalSuperAdmin || isGhostMode) && subscriptionInfo.enabledModules && subscriptionInfo.enabledModules[tab] === false) {
      triggerBlockedAction('Este módulo adicional');
      return;
    }

    let subPath = isTutor ? 'portal' : 'montessori';
    if (tab === 'schools-hub') subPath = 'schools';
    if (tab === 'global-billing') subPath = 'billing';
    if (tab === 'platform-infra') subPath = 'infra';
    if (tab === 'montessori') subPath = 'montessori';
    if (tab === 'attendance') subPath = 'attendance';
    if (tab === 'curriculum') subPath = 'curriculum';
    if (tab === 'trackers') subPath = 'trackers';
    if (tab === 'allergies') subPath = 'allergies';
    if (tab === 'assessments') subPath = 'assessments';
    if (tab === 'consents') subPath = 'consents';
    if (tab === 'finances') subPath = 'finances';
    if (tab === 'events') subPath = 'events';
    if (tab === 'environments') subPath = 'environments';
    if (tab === 'students') subPath = 'students';
    if (tab === 'graduated_students') subPath = 'graduated_students';
    if (tab === 'tutors') subPath = 'tutors';
    if (tab === 'admissions') subPath = 'admissions';
    if (tab === 'processes') subPath = 'processes';
    if (tab.startsWith('process_')) subPath = tab;
    if (tab === 'waitlist') subPath = 'waitlist';
    if (tab === 'forms') subPath = 'forms';
    if (tab === 'newsletters') subPath = 'newsletters';
    if (tab === 'announcements') subPath = 'announcements';
    if (tab === 'guides') subPath = 'guides';
    if (tab === 'documents') subPath = 'documents';
    if (tab === 'applications') subPath = 'applications';
    if (tab === 'web-builder') subPath = 'web-builder';
    if (tab === 'pricing' || tab === 'subscription') subPath = 'pricing';
    if (tab === 'gallery') subPath = 'gallery';
    if (tab === 'traffic') subPath = 'webtrafic';
    if (tab === 'settings') subPath = 'settings';
    if (tab === 'system-settings') subPath = 'system-settings';
    if (tab === 'portal') subPath = 'portal';
    if (tab === 'dashboard') subPath = 'dashboard';
    if (tab === 'progress') subPath = 'progress';
    if (tab === 'account') subPath = 'account';

    navigate(`${basePath}/${subPath}`);
    setMobileMenuOpen(false);
  };

  // Auto-redirect if URL lands directly on a deactivated custom module
  React.useEffect(() => {
    if ((!isGlobalSuperAdmin || isGhostMode) && subscriptionInfo.enabledModules && subscriptionInfo.enabledModules[activeTab] === false) {
      triggerBlockedAction('Este módulo adicional');
      navigate(`${basePath}/dashboard`, { replace: true });
    }
  }, [activeTab, subscriptionInfo.enabledModules, isGlobalSuperAdmin, isGhostMode, basePath, navigate]);

  const currentSchoolName = schoolName || activeMembership?.school.name || 'Ceiba Montessori';
  const primaryColor = brandPrimaryColor || activeMembership?.school.primaryColor || '#1b3b2b';

  return (
    <AdminDashboardContext.Provider
      value={{
        openMobileMenu: () => setMobileMenuOpen(true),
        isReadOnly,
        isTrialExpired,
        triggerBlockedAction,
        openSubscriptionModal: () => navigate(`${basePath}/pricing`)
      }}
    >
      {/* TOP FIXED ANNOUNCEMENTS MARQUEE BANNER */}
      {isMarqueeVisible && (
        <div 
          onClick={handleOpenAnnouncements}
          className="fixed top-0 left-0 right-0 z-[100] h-9 text-yellow-300 border-b flex items-center justify-between overflow-hidden px-4 select-none shadow-md cursor-pointer transition-colors"
          style={{
            backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, #09090b)`,
            borderColor: `color-mix(in srgb, ${primaryColor} 30%, #1c1c1f)`
          }}
        >
          <div className="flex items-center flex-1 overflow-hidden min-w-0">
            <div 
              className="flex items-center gap-2 shrink-0 pr-3 z-10"
              style={{
                backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, #09090b)`
              }}
            >
              <Bell className="w-4 h-4 text-yellow-300 animate-bell-ring" />
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded border border-yellow-300/30">
                Aviso
              </span>
            </div>
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-marquee-bounce font-bold text-xs uppercase tracking-wide">
                {activeAnnouncements.map(ann => ann.title).join(' \u00a0\u00a0\u2022\u00a0\u00a0 ')}
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleDismissMarquee}
            className="p-1 hover:bg-white/10 rounded-lg text-yellow-300 hover:text-white transition-all duration-200 shrink-0 z-10 ml-2 cursor-pointer flex items-center justify-center active:scale-90"
            title="Ocultar avisos por 8 horas"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GLOBAL SUPERADMIN GHOST MODE TOP BANNER */}
      {isGlobalSuperAdmin && isGhostMode && (
        <div className="fixed top-0 left-0 right-0 z-[105] h-10 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between px-4 select-none shadow-lg border-b border-amber-500/40 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-pulse shrink-0">
              <Eye className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="truncate">
              <strong>MODO FANTASMA ACTIVO:</strong> Estás administrando como Owner el colegio{' '}
              <strong className="underline underline-offset-2">{activeMembership?.school.name}</strong> ({activeMembership?.school.slug})
            </span>
          </div>
          <button
            type="button"
            onClick={handleExitGhostMode}
            className="py-1 px-3 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ml-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Hub Global</span>
          </button>
        </div>
      )}

      <div className={`h-screen max-h-screen overflow-hidden bg-cream flex flex-col md:flex-row font-body text-foreground transition-all duration-300 ${(isGlobalSuperAdmin && isGhostMode) ? 'pt-10' : isMarqueeVisible ? 'pt-9' : ''} ${isTrialExpired && !isPricingPage ? 'pb-16' : ''}`}>

        {/* FLOATING FIXED MOBILE MENU BUTTON (< md) */}
        {!isPricingPage && !mobileMenuOpen && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden fixed top-3 left-3 z-40 p-2.5 bg-forest text-white rounded-2xl shadow-lg border border-white/20 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* BACKDROP FOR MOBILE (< md) */}
        {!isPricingPage && mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
            aria-hidden="true"
          />
        )}

        {/* SIDEBAR CONTAINER (Hidden on Pricing Page for maximum focus and width) */}
        {!isPricingPage && (
          <aside
            aria-label="Menú principal de navegación"
            className={`
              fixed md:relative inset-y-0 left-0 z-50 md:z-auto
              h-full max-h-screen
              bg-white/80 backdrop-blur-md border-r border-forest/10
              flex flex-col shadow-xl md:shadow-none
              transition-all duration-300 ease-in-out shrink-0
              ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
              ${isCollapsed ? 'md:w-20' : 'md:w-72'}
            `}
          >
          {/* Top Logo & School Selector Area */}
          <div className={`shrink-0 border-b border-forest/10 flex flex-col gap-2 relative ${isCollapsed ? 'md:p-2 p-4' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed ? 'md:justify-center w-full' : ''}`}>
                <div className={`w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold font-display text-sm shrink-0 border border-forest/15 shadow-2xs`}>
                  M
                </div>
                <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>
                  <span className="font-display font-bold text-forest text-sm block leading-tight tracking-tight">
                    Montessori Nexus
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-body">
                    School OS
                  </span>
                </div>
              </div>

              {!isCollapsed ? (
                <>
                  <button
                    onClick={toggleSidebarCollapsed}
                    className="hidden md:flex p-1.5 text-forest/60 hover:text-forest hover:bg-forest/10 rounded-xl transition-colors"
                    title="Colapsar menú lateral"
                  >
                    <PanelLeftClose className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="md:hidden p-1.5 text-forest/60 hover:text-forest hover:bg-forest/10 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleSidebarCollapsed}
                  className="hidden md:flex p-1.5 text-forest/60 hover:text-forest hover:bg-forest/10 rounded-xl transition-colors mx-auto"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* School Selector Dropdown / Button (Hidden for Global Superadmin when in global hub mode) */}
            {(!isGlobalSuperAdmin || isGhostMode) && (
              <>
                <div className="relative group/school">
                  <button
                    onClick={() => setSchoolDropdownOpen(!schoolDropdownOpen)}
                    className={`w-full bg-cream/70 hover:bg-cream border border-forest/15 ${btnRadiusClass} flex items-center transition-all group ${isCollapsed ? 'md:p-1.5 md:justify-center p-2.5 justify-between' : `${btnHeightClass} justify-between`
                      }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden pr-1">
                      <div
                        className={`w-8 h-8 ${avatarRadiusClass} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {currentSchoolName.charAt(0) || 'C'}
                      </div>
                      <div className={`overflow-hidden text-left ${isCollapsed ? 'md:hidden' : 'block'}`}>
                        <span className="font-bold text-forest text-xs block truncate leading-tight">
                          {currentSchoolName}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          slug: {activeMembership?.school.slug || 'ceiba'}
                        </span>
                      </div>
                    </div>

                    <div className={isCollapsed ? 'md:hidden' : 'block'}>
                      {(memberships.length > 1 || isSuperAdmin) && (
                        <ChevronDown className={`w-4 h-4 text-forest/60 transition-transform ${schoolDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </button>

                  {/* Collapsed Mode Tooltip for School */}
                  {isCollapsed && (
                    <div className={`hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-forest text-white text-xs font-bold ${btnRadiusClass} shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/school:opacity-100 transition-opacity z-50`}>
                      <span>{currentSchoolName}</span>
                      <span className="text-[10px] text-white/70 block font-normal">Rol: {role}</span>
                    </div>
                  )}
                </div>

                {/* School Selection & Creation Dropdown Menu */}
                {schoolDropdownOpen && (
                  <div className={`absolute top-full mt-2 bg-white rounded-2xl shadow-xl border border-forest/15 p-2.5 z-50 animate-in fade-in zoom-in-95 space-y-1.5 ${isCollapsed ? 'md:left-full md:ml-3 md:w-72 left-4 right-4' : 'left-4 right-4'
                    }`}>
                    {isGlobalSuperAdmin ? (
                      <div className="px-2 py-1 flex items-center justify-between border-b border-stone-100 pb-1.5 mb-1">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>Colegios (Acceso Ghost)</span>
                        </span>
                        {isGhostMode && (
                          <button
                            type="button"
                            onClick={() => {
                              setSchoolDropdownOpen(false);
                              handleExitGhostMode();
                            }}
                            className="text-[10px] font-bold text-forest hover:underline cursor-pointer"
                          >
                            Salir de Ghost
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 block">
                        Colegios Registrados:
                      </span>
                    )}

                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                      {memberships.map((m) => {
                        const isInactiveTutorSchool = m.role === 'TUTOR' && m.hasActiveEnrollment === false;
                        const isCurrentActive = isGhostMode && m.schoolId === activeMembership?.schoolId;

                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              if (isGlobalSuperAdmin) {
                                handleEnterGhostMode(m.school);
                              } else {
                                switchSchool(m.schoolId);
                              }
                              setSchoolDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-all cursor-pointer group/schoolitem ${
                              isCurrentActive
                                ? 'bg-amber-500/10 font-bold text-amber-900 border border-amber-500/30'
                                : m.schoolId === activeMembership?.schoolId && !isGlobalSuperAdmin
                                ? 'bg-forest/10 font-bold text-forest'
                                : 'hover:bg-forest/5 text-foreground'
                            }`}
                          >
                            <div className="truncate pr-2 min-w-0 flex-1">
                              <span className="block truncate font-semibold">{m.school.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isGlobalSuperAdmin ? (
                                  <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                                    <Eye className="w-3 h-3 text-amber-600" />
                                    <span>Entrar como Ghost (Owner)</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">
                                    Rol: {m.role === 'TUTOR' ? 'Tutor' : m.role === 'TEACHER' ? 'Guía' : m.role}
                                  </span>
                                )}
                                {isInactiveTutorSchool && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                    🔒 Matrícula Inactiva
                                  </span>
                                )}
                              </div>
                            </div>
                            {isGlobalSuperAdmin ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white opacity-0 group-hover/schoolitem:opacity-100 transition-opacity shrink-0">
                                Ghost
                              </span>
                            ) : (
                              m.schoolId === activeMembership?.schoolId && (
                                <Check className="w-4 h-4 text-forest shrink-0" />
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Superadmin Create School Item */}
                    {isSuperAdmin && (
                      <div className="pt-1.5 mt-1 border-t border-forest/10">
                        <button
                          onClick={() => {
                            setSchoolDropdownOpen(false);
                            setCreateSchoolModalOpen(true);
                          }}
                          className="w-full p-2.5 rounded-xl bg-forest/5 hover:bg-forest hover:text-white text-forest text-xs font-bold transition-all flex items-center justify-center gap-2 group shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-forest group-hover:text-white" />
                          <span>REGISTRAR NUEVO COLEGIO</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation Menu Links */}
          <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-4 ${isCollapsed ? 'md:p-2 p-3 no-scrollbar' : 'p-3 custom-scrollbar'}`}>
            {navGroupsList.map((group, groupIdx) => {
              const isGroupCollapsed = !isCollapsed && Boolean(collapsedGroups[group.title]);

              return (
                <div key={group.title || groupIdx} className="space-y-1">
                  {/* Group Header (Collapsible button) */}
                  {group.title && !isCollapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className="w-full flex items-center justify-between px-3 pt-2 pb-1 group/title text-left cursor-pointer select-none"
                    >
                      <span className="text-[10px] font-bold text-forest/50 uppercase tracking-widest block group-hover/title:text-forest">
                        {group.title}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-forest/30 group-hover/title:text-forest transition-transform duration-200 ${
                          isGroupCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                    </button>
                  )}
                  {/* Divider in collapsed mode between groups */}
                  {isCollapsed && groupIdx > 0 && (
                    <div className="border-t border-forest/10 my-2 mx-1" />
                  )}

                  {!isGroupCollapsed && (
                    <nav className="space-y-1 transition-all duration-200">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const isLocked = Boolean(item.locked);
                        const isModuleDisabled = Boolean((!isGlobalSuperAdmin || isGhostMode) && subscriptionInfo.enabledModules && subscriptionInfo.enabledModules[item.id] === false);

                        return (
                          <div key={item.id} className="relative group/nav">
                            <button
                              onClick={() => {
                                if (isModuleDisabled) {
                                  triggerBlockedAction(`El módulo "${item.label}"`);
                                  return;
                                }
                                handleTabChange(item.id);
                              }}
                              className={`w-full ${btnRadiusClass} text-left transition-all flex items-center justify-between group ${isActive
                                  ? 'bg-forest text-white shadow-sm font-semibold'
                                  : isLocked
                                    ? 'text-muted-foreground/60 hover:bg-amber-50/50 hover:text-amber-900 cursor-not-allowed opacity-75'
                                    : isModuleDisabled
                                      ? 'text-stone-400 dark:text-slate-500 opacity-60 hover:bg-stone-100/50 cursor-not-allowed'
                                      : 'text-forest/80 hover:bg-forest/5 hover:text-forest'
                                } ${isCollapsed ? 'md:p-2 md:justify-center p-2.5' : `${btnHeightClass}`
                                }`}
                            >
                              <div className={`flex items-center ${isCollapsed ? 'md:gap-0 gap-2.5' : 'gap-2.5'} min-w-0 flex-1`}>
                                <div className={`p-2 ${avatarRadiusClass} transition-colors shrink-0 ${isActive
                                    ? 'bg-white/20 text-white'
                                    : isLocked
                                      ? 'bg-amber-100/60 text-amber-800'
                                      : isModuleDisabled
                                        ? 'bg-stone-100 dark:bg-slate-800 text-stone-400'
                                        : 'bg-forest/5 text-forest group-hover:bg-forest/10'
                                  }`}>
                                  <Icon className="w-4 h-4" />
                                </div>

                                <div className={isCollapsed ? 'md:hidden block' : 'block truncate flex-1 min-w-0 pr-1'}>
                                  <div className="flex items-center gap-1.5 justify-between">
                                    <span className={`text-xs font-bold block leading-tight truncate ${isModuleDisabled ? 'text-stone-400 dark:text-slate-500' : ''}`}>
                                      {item.label}
                                    </span>
                                    {isModuleDisabled && (
                                      <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-stone-200 dark:bg-slate-800 text-stone-500 dark:text-slate-400 shrink-0 uppercase tracking-tighter">
                                        Desactivado
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] block truncate ${isActive ? 'text-white/80' : isLocked ? 'text-amber-800/80 font-medium' : isModuleDisabled ? 'text-stone-400 dark:text-slate-600' : 'text-muted-foreground'
                                    }`}>
                                    {isModuleDisabled ? 'Módulo no incluido' : item.subLabel}
                                  </span>
                                </div>
                              </div>

                              <div className={isCollapsed ? 'md:hidden block' : 'block shrink-0'}>
                                {isLocked ? (
                                  <Lock className="w-3.5 h-3.5 text-amber-700/60" />
                                ) : isModuleDisabled ? (
                                  <Lock className="w-3 h-3 text-stone-400 dark:text-slate-600" />
                                ) : (
                                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'opacity-100 translate-x-0.5' : 'opacity-30 group-hover:opacity-70'
                                    }`} />
                                )}
                              </div>
                            </button>

                            {/* Floating Tooltip in Collapsed Mode */}
                            {isCollapsed && (
                              <div className="hidden md:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-forest text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity z-50 flex-col">
                                <span>{item.label}</span>
                                <span className="text-[10px] text-white/70 font-normal">
                                  {isModuleDisabled ? 'Módulo desactivado en suscripción' : item.subLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Sidebar User Info & Actions */}
          <div className={`border-t border-forest/10 bg-forest/5 space-y-2 shrink-0 overflow-hidden ${isCollapsed ? 'md:p-2 p-4' : 'p-4'}`}>
            <div className="relative group/user">
              <button
                type="button"
                onClick={() => handleTabChange('account')}
                className={`w-full text-left flex items-center ${btnRadiusClass} border transition-all cursor-pointer ${activeTab === 'account'
                    ? 'bg-forest text-white border-forest shadow-xs'
                    : 'bg-white/80 hover:bg-white hover:border-forest/30 border-forest/10 text-forest shadow-2xs'
                  } ${isCollapsed ? 'md:p-1.5 md:justify-center p-3 justify-between' : `${btnHeightClass} justify-between`
                  }`}
                title="Mi Cuenta & Seguridad"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className={`w-8 h-8 ${avatarRadiusClass} flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${activeTab === 'account'
                      ? 'bg-white/20 text-white'
                      : 'bg-forest/10 text-forest'
                    }`}>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user?.fullName || 'Avatar'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(user?.fullName || userEmail || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={`overflow-hidden ${isCollapsed ? 'md:hidden block' : 'block'}`}>
                    <span className={`text-xs font-bold block truncate leading-tight ${activeTab === 'account' ? 'text-white' : 'text-forest'}`}>
                      {user?.fullName || userEmail || 'Usuario'}
                    </span>
                    <span className={`text-[10px] block truncate ${activeTab === 'account' ? 'text-white/80' : 'text-muted-foreground'}`}>
                      Mi Cuenta & Seguridad
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className={`p-1.5 ${avatarRadiusClass} shrink-0 ${activeTab === 'account' ? 'text-white/80 hover:text-white' : 'text-forest/50 hover:text-forest'
                    }`}>
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Collapsed Tooltip for User */}
              {isCollapsed && (
                <div className={`hidden md:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-forest text-white text-xs font-bold ${btnRadiusClass} shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/user:opacity-100 transition-opacity z-50 flex-col`}>
                  <span>{user?.fullName || userEmail || 'Usuario'}</span>
                  <span className="text-[10px] text-white/70 font-normal">Mi Cuenta & Seguridad</span>
                </div>
              )}
            </div>

            {hasBackupSession && (
              <div className="relative group/exit-impersonate mb-2">
                <button
                  onClick={handleExitImpersonation}
                  className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white ${btnRadiusClass} font-display font-semibold text-xs flex items-center justify-center transition-all shadow-md ${isCollapsed ? 'md:p-2 md:gap-0 p-2.5 gap-2' : `${btnHeightClass} gap-2`
                    }`}
                  title="Regresar a Admin"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className={isCollapsed ? 'md:hidden block' : 'block'}>Regresar a Admin</span>
                </button>

                {/* Collapsed Tooltip for Exit Impersonate */}
                {isCollapsed && (
                  <div className={`hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold ${btnRadiusClass} shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/exit-impersonate:opacity-100 transition-opacity z-50`}>
                    <span>Regresar a Admin</span>
                  </div>
                )}
              </div>
            )}

            <div className="relative group/logout">
              <button
                onClick={logout}
                className={`w-full bg-white/80 hover:bg-destructive/10 text-destructive border border-destructive/20 ${btnRadiusClass} font-display font-semibold text-xs flex items-center justify-center transition-all shadow-2xs ${isCollapsed ? 'md:p-2 md:gap-0 p-2.5 gap-2' : `${btnHeightClass} gap-2`
                  }`}
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className={isCollapsed ? 'md:hidden block' : 'block'}>Cerrar Sesión</span>
              </button>

              {/* Collapsed Tooltip for Logout */}
              {isCollapsed && (
                <div className={`hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-destructive text-white text-xs font-bold ${btnRadiusClass} shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/logout:opacity-100 transition-opacity z-50`}>
                  <span>Cerrar Sesión</span>
                </div>
              )}
            </div>
          </div>

        </aside>
        )}

        {/* MAIN CONTENT AREA */}
        <main className={`flex-1 h-full min-h-0 w-full min-w-0 ${
          isPricingPage
            ? 'p-3 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#fdfbf7] dark:bg-[#0c140e]'
            : isWebBuilder
            ? 'p-0 overflow-hidden flex flex-col'
            : ['guides', 'waitlist', 'students', 'graduated_students', 'tutors', 'finances'].includes(activeTab)
              ? 'p-0 overflow-hidden flex flex-col'
              : isEditingForm
                ? 'p-0 overflow-y-auto overflow-x-hidden custom-scrollbar'
                : 'p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar'
        }`}>
          {/* Inactive Tutor Enrollment Notice */}
          {isTutor && !isTutorActive && (
            <div className="mb-6 p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start sm:items-center gap-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-2xl bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-xs leading-relaxed">
                <strong className="block font-bold text-amber-950 font-display text-sm">
                  Matrícula no activa en {currentSchoolName}
                </strong>
                <span className="text-amber-900/80 mt-0.5 block">
                  Tu acceso en este colegio está restringido a la consulta de la cronología evolutiva, informes de progreso y expedientes históricos de tu hijo. Las actividades escolares, calendarios y servicios vigentes se encuentran inactivos.
                </span>
              </div>
            </div>
          )}

          {isGlobalSuperAdmin && !isGhostMode ? (
            <>
              {(activeTab === 'schools-hub' || activeTab === 'dashboard') && (
                <SuperAdminSchoolsSection
                  onEnterGhostMode={handleEnterGhostMode}
                  onOpenCreateSchool={() => setCreateSchoolModalOpen(true)}
                  onNavigateToBilling={() => handleTabChange('global-billing')}
                />
              )}
              {activeTab === 'global-billing' && (
                <SuperAdminBillingSection />
              )}
              {activeTab === 'platform-infra' && (
                <SuperAdminInfraSection />
              )}
              {activeTab === 'system-settings' && <AdminSystemSettings />}
              {activeTab === 'account' && <AdminAccountSection />}
            </>
          ) : !isAllowedTab(activeTab) ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-8 h-8 text-amber-600" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold font-display text-forest">Acceso Restringido</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Has accedido a un módulo del sistema al que no tienes privilegios ni permisos asignados para acceder.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTabChange(isTutor ? 'portal' : (isTeacher ? 'montessori' : 'dashboard'))}
                  className="px-5 py-2.5 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver al módulo principal</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'portal' && <TutorPortalSection />}
              {activeTab === 'dashboard' && <MainDashboardSection onNavigateTab={handleTabChange} />}
              {activeTab === 'progress' && <TutorStudentProgressSection />}
              {activeTab === 'finances' && (isTutor ? <TutorFinancesSection /> : <FinancesSection />)}
              {activeTab === 'journal' && <JournalSection />}
              {activeTab === 'attendance' && <AttendanceSection />}
              {activeTab === 'montessori' && <MontessoriSection />}
              {activeTab === 'curriculum' && <CurriculumSection />}
              {activeTab === 'events' && <EventsSection />}
              {activeTab === 'environments' && <EnvironmentsSection />}
              {activeTab === 'students' && <StudentsSection statusFilter="active" />}
              {activeTab === 'graduated_students' && <StudentsSection statusFilter="graduated" />}
              {activeTab === 'tutors' && <TutorsSection />}
              {activeTab === 'admissions' && <AdmissionsProcessSection />}
              {activeTab.startsWith('process_') && (
                <AdmissionsProcessSection processSlug={activeTab.replace('process_', '')} />
              )}
              {activeTab === 'processes' && <ProcessesConfigSection onProcessesUpdated={loadProcesses} />}
              {activeTab === 'waitlist' && <WaitlistSection />}
              {activeTab === 'forms' && <FormsSection />}
              {activeTab === 'newsletters' && <NewslettersSection />}
              {activeTab === 'announcements' && <AnnouncementsSection />}
              {activeTab === 'guides' && <GuidesSection />}
              {activeTab === 'traffic' && <WebTrafficSection />}
              {activeTab === 'documents' && <DocumentsSection />}
              {activeTab === 'applications' && <ApplicationsSection />}
              {activeTab === 'web-builder' && isOwner && <WebBuilderSection />}
              {activeTab === 'gallery' && <AdminGallerySection />}
              {activeTab === 'settings' && <AdminSettings />}
              {activeTab === 'system-settings' && isSuperAdmin && <AdminSystemSettings />}
              {activeTab === 'trackers' && <TrackersSection />}
              {activeTab === 'allergies' && <AllergiesSection />}
              {activeTab === 'assessments' && <AssessmentScalesSection />}
              {activeTab === 'consents' && <ConsentTemplatesSection />}
              {activeTab === 'account' && <AdminAccountSection />}
              {activeTab === 'pricing' && <SchoolPricingSection />}
            </>
          )}
        </main>

        {/* CREATE NEW SCHOOL MODAL (SUPERADMIN WIZARD) */}
        <CreateSchoolModal
          isOpen={createSchoolModalOpen}
          onClose={() => setCreateSchoolModalOpen(false)}
        />

        {/* VIEW ACTIVE ANNOUNCEMENTS LIST MODAL */}
        {viewingAnnListOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 max-w-md w-full relative shadow-xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-forest animate-bell-ring" />
                  <h3 className="font-display font-bold text-forest text-base">Anuncios del Colegio</h3>
                </div>
                <button
                  onClick={() => setViewingAnnListOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar space-y-2.5 flex-1 pr-1">
                {activeAnnouncements.map(ann => {
                  let styleClass = 'border-blue-100 bg-blue-50/30 text-blue-900';
                  if (ann.style === 'warning') styleClass = 'border-amber-100 bg-amber-50/30 text-amber-950';
                  if (ann.style === 'danger') styleClass = 'border-red-100 bg-red-50/30 text-red-950';
                  if (ann.style === 'success') styleClass = 'border-emerald-100 bg-emerald-50/30 text-emerald-950';

                  return (
                    <button
                      key={ann.id}
                      onClick={() => handleSelectAnnouncement(ann)}
                      className={`w-full p-3.5 border rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col gap-1 cursor-pointer ${styleClass}`}
                    >
                      <span className="font-bold text-xs font-display">{ann.title}</span>
                      <span className="text-[10px] opacity-80 block truncate">
                        {ann.content.replace(/<[^>]*>/g, ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* DETAILED ANNOUNCEMENT CONTENT MODAL */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full relative shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Header de Color Entero que representa la urgencia */}
              <div className={`w-full py-6 flex flex-col items-center justify-center relative text-white ${
                selectedAnnouncement.style === 'warning' ? 'bg-amber-500' :
                selectedAnnouncement.style === 'danger' ? 'bg-red-600' :
                selectedAnnouncement.style === 'success' ? 'bg-emerald-600' :
                'bg-blue-600'
              }`}>
                {/* Close Button placed absolutely on top right of the banner */}
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="absolute top-4 right-4 p-1.5 bg-black/10 hover:bg-black/20 rounded-full text-white/90 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                </button>

                {/* Centered Icon */}
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs border border-white/30 shadow-inner mb-2">
                  {selectedAnnouncement.style === 'warning' && <AlertCircle className="w-7 h-7 text-white" />}
                  {selectedAnnouncement.style === 'danger' && <AlertTriangle className="w-7 h-7 text-white" />}
                  {selectedAnnouncement.style === 'success' && <CheckCircle2 className="w-7 h-7 text-white" />}
                  {selectedAnnouncement.style === 'info' && <Bell className="w-7 h-7 text-white" />}
                </div>

                <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2.5 py-0.5 rounded-full border border-white/20">
                  {selectedAnnouncement.style === 'warning' && 'Aviso Importante'}
                  {selectedAnnouncement.style === 'danger' && 'Alerta de Emergencia'}
                  {selectedAnnouncement.style === 'success' && 'Aviso de Éxito'}
                  {selectedAnnouncement.style === 'info' && 'Comunicado'}
                </span>
              </div>

              {/* Content Area with custom padding */}
              <div className="p-6 flex flex-col flex-1 overflow-hidden">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-display font-black text-forest text-lg leading-snug">
                    {selectedAnnouncement.title}
                  </h3>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 min-h-[150px]">
                  <div 
                    className="text-sm sm:text-base text-slate-700 leading-relaxed rich-text-preview space-y-3 whitespace-pre-wrap font-medium"
                    dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer hover:scale-102"
                  >
                    Entendido
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TRIAL EXPIRED BOTTOM NOTIFICATION BAR (Hidden when already on pricing page) */}
        {isTrialExpired && activeTab !== 'pricing' && activeTab !== 'subscription' && (
          <div className="fixed bottom-0 left-0 right-0 z-[110] bg-gradient-to-r from-[#2a1309] via-[#3d1a0e] to-[#2a1309] text-white border-t border-amber-500/40 p-3 sm:px-6 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-300 block">
                  Período de prueba gratuita finalizado ({currentSchoolName})
                </span>
                <span className="text-[11px] text-stone-300 block leading-tight">
                  El período de prueba ha concluido. El sistema se encuentra en <strong>modo solo lectura</strong>. Configura un plan de membresía para continuar registrando información.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`${basePath}/pricing`)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer shrink-0 flex items-center justify-center gap-2 border border-amber-400/30"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Configurar Plan de Membresía</span>
            </button>
          </div>
        )}

        {/* Trial Expired Action Blocked Modal */}
        <TrialExpiredBlockedModal
          isOpen={blockedModalOpen}
          onClose={() => setBlockedModalOpen(false)}
          actionTitle={blockedActionTitle}
          onConfigurePlan={() => navigate(`${basePath}/pricing`)}
        />

        {/* Subscription Upgrade Modal */}
        <SubscriptionUpgradeModal
          isOpen={subscriptionUpgradeModalOpen}
          onClose={() => setSubscriptionUpgradeModalOpen(false)}
          school={activeMembership?.school || null}
        />

      </div>
    </AdminDashboardContext.Provider>
  );
};

export default AdminDashboard;
