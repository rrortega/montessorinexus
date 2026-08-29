import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Layers,
  Mail,
  Phone,
  Key,
  Trash2,
  Edit,
  Check,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Building2,
  Lock,
  Search,
  Award,
  Clock,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  Star,
  Plus,
  Eye,
  MoreVertical,
  X,
  Calendar,
  ChevronRight,
  ChevronLeft,
  User,
  Shield,
  GitFork,
  ArrowDown,
  UserCheck,
  Crown,
  ChevronDown,
  School,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ChevronsUpDown
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MobileMenuButton, useAdminDashboard } from './AdminDashboard';
import {
  GuideUserItem,
  EnvironmentItem,
  School as SchoolType,
  StudentItem,
  getGuides,
  deleteGuide,
  getEnvironments,
  getStudents,
  getCurrentSchool
} from '@/lib/sqlite';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useSiteSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import GuideDrawer, {
  STAFF_ROLES,
  StaffRoleType,
  parseCertifications
} from '@/components/admin/GuideDrawer';

interface PaginationControlProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel: string;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  itemLabel
}) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-forest">
      {/* Items count */}
      <div className="text-muted-foreground text-[11px] font-medium">
        Mostrando <strong className="text-forest font-bold">{start}</strong> - <strong className="text-forest font-bold">{end}</strong> de <strong className="text-forest font-bold">{totalItems}</strong> {itemLabel}
      </div>

      {/* Controls: Page size selector + Page navigation */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Page Size Selector (Custom Choice) */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Por página:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              onPageSizeChange(Number(val));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-6 w-14 rounded-lg bg-forest/5 border border-forest/15 px-2 text-[11px] font-bold text-forest hover:bg-forest/10 focus:ring-0 focus:ring-offset-0 shadow-2xs gap-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="min-w-[4.5rem] rounded-xl border border-forest/15 bg-white shadow-lg p-1 text-xs z-50">
              <SelectItem value="8" className="rounded-lg text-[11px] font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1">8</SelectItem>
              <SelectItem value="15" className="rounded-lg text-[11px] font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1">15</SelectItem>
              <SelectItem value="25" className="rounded-lg text-[11px] font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1">25</SelectItem>
              <SelectItem value="50" className="rounded-lg text-[11px] font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1 || totalItems === 0}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1 rounded-lg border border-forest/15 bg-white text-forest hover:bg-forest/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            title="Página anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 py-0.5 text-[11px] font-bold bg-forest/5 rounded-lg border border-forest/10 text-forest">
            {totalItems === 0 ? 1 : currentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || totalItems === 0}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1 rounded-lg border border-forest/15 bg-white text-forest hover:bg-forest/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            title="Página siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const GuidesSection: React.FC = () => {
  const confirm = useConfirm();
  const { schoolName, schoolLogo, brandPrimaryColor, schoolTagline } = useSiteSettings();
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
  const currentYear = new Date().getFullYear();
  const { role, user, userEmail, activeMembership } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN';
  const permissions: string[] = (activeMembership as any)?.permissions || [];
  const canManageGuides = isOwnerOrAdmin || permissions.includes('guides:write') || permissions.includes('guides:manage') || permissions.includes('guides');
  const isTutor = role === 'TUTOR';

  const handleImpersonate = (guide: any) => {
    try {
      // 1. Safely back up current session details
      let savedUser = null;
      try {
        const u = localStorage.getItem('ceiba_user_session');
        savedUser = u ? JSON.parse(u) : null;
      } catch (err) {
        savedUser = { email: localStorage.getItem('ceiba_user_email') || '' };
      }

      let savedMemberships = [];
      try {
        const m = localStorage.getItem('ceiba_user_memberships');
        savedMemberships = m ? JSON.parse(m) : [];
      } catch (err) {}

      let savedActiveMembership = null;
      try {
        const am = localStorage.getItem('ceiba_active_membership');
        savedActiveMembership = am ? JSON.parse(am) : null;
      } catch (err) {}

      const backup = {
        user: savedUser,
        email: localStorage.getItem('ceiba_user_email') || '',
        memberships: savedMemberships,
        activeMembership: savedActiveMembership
      };

      localStorage.setItem('ceiba_impersonation_original_session', JSON.stringify(backup));

      // 2. Build target employee session
      const targetUser = {
        id: guide.id,
        email: guide.email,
        fullName: guide.fullName,
        phone: guide.phone
      };

      const targetMembership = {
        id: `mem_employee_${guide.id}`,
        userId: guide.id,
        schoolId: activeMembership?.schoolId || '',
        role: guide.role || 'TEACHER',
        permissions: guide.permissions || [],
        hasActiveEnrollment: true,
        school: activeMembership?.school || null
      };

      // 3. Set active session localStorage keys
      localStorage.setItem('ceiba_user_session', JSON.stringify(targetUser));
      localStorage.setItem('ceiba_user_email', guide.email);
      localStorage.setItem('ceiba_user_memberships', JSON.stringify([targetMembership]));
      localStorage.setItem('ceiba_active_membership', JSON.stringify(targetMembership));

      toast.success(`Accediendo como ${guide.fullName}...`);

      // 4. Reload window to initialize the new session
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      console.error('Impersonation error:', e);
      toast.error('Error al iniciar sesión como este usuario.');
    }
  };

  const [guides, setGuides] = useState<GuideUserItem[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [currentSchool, setCurrentSchool] = useState<SchoolType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'organigram'>('list');
  const [activeDropdownGuideId, setActiveDropdownGuideId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [envFilter, setEnvFilter] = useState<string>('ALL');
  const [openEnvPopover, setOpenEnvPopover] = useState(false);
  const [openRolePopover, setOpenRolePopover] = useState(false);

  // Fullscreen Organigram Modal
  const [organigramModalOpen, setOrganigramModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Ficha de docente modal (organigrama)
  const [selectedGuideForFicha, setSelectedGuideForFicha] = useState<GuideUserItem | null>(null);

  // Drawer State (Shared GuideDrawer)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<GuideUserItem | null>(null);

  const fetchList = async () => {
    setLoading(true);
    const [guidesData, envsData, schoolData, studentsData] = await Promise.all([
      getGuides(),
      getEnvironments(),
      getCurrentSchool().catch(() => null),
      getStudents()
    ]);
    setGuides(guidesData);
    setEnvironments(envsData);
    setCurrentSchool(schoolData);
    setStudents(studentsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, []);


  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.cursor-pointer') || target.closest('label') || target.closest('input')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Reset pan and zoom when opening the organigram modal
  useEffect(() => {
    if (organigramModalOpen) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [organigramModalOpen]);

  // Set up wheel zoom listener with passive: false to prevent browser scroll
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !organigramModalOpen) return;

    const handleWheelZoom = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      setZoomLevel(prev => Math.max(0.4, Math.min(2.0, Number((prev * zoomFactor).toFixed(2)))));
    };

    container.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelZoom);
  }, [organigramModalOpen]);

  // Escape key & Browser Back button (popstate) listener for the Organigram modal
  useEffect(() => {
    if (!organigramModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOrganigramModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const modalState = 'modal-organigram-' + Date.now();
    window.history.pushState({ modal: modalState }, '');

    const handlePopState = () => {
      setOrganigramModalOpen(false);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);

      if (window.history.state?.modal === modalState) {
        window.history.back();
      }
    };
  }, [organigramModalOpen]);

  // Find tutor's children and their associated salons
  const myChildren = useMemo(() => {
    if (!isTutor) return [];
    return students.filter(s =>
      s.tutors?.some((t: any) =>
        (user?.id && t.tutor?.id === user.id) ||
        (userEmail && t.tutor?.email?.toLowerCase() === userEmail.toLowerCase())
      )
    );
  }, [students, isTutor, user, userEmail]);

  const myChildrenEnvIds = useMemo(() => {
    if (!isTutor) return [];
    return Array.from(
      new Set(
        myChildren
          .map(s => s.environment_id || s.environment?.id)
          .filter(Boolean)
      )
    ) as string[];
  }, [myChildren, isTutor]);

  const handleOpenCreate = () => {
    if (isReadOnly) {
      triggerBlockedAction('Registrar nuevos docentes o miembros del equipo');
      return;
    }
    if (!canManageGuides) {
      toast.error('No tienes permisos para registrar nuevos docentes.');
      return;
    }
    setEditingGuide(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (guide: GuideUserItem) => {
    if (!canManageGuides) {
      setSelectedGuideForFicha(guide);
      return;
    }
    setEditingGuide(guide);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) {
      triggerBlockedAction('Desvincular o eliminar docentes');
      return;
    }
    if (!canManageGuides) {
      toast.error('No tienes permisos para desvincular docentes.');
      return;
    }

    const targetGuide = guides.find(g => g.id === id);
    if (targetGuide?.isOwner || targetGuide?.role === 'OWNER') {
      toast.error('El propietario del colegio no puede ser desvinculado.');
      return;
    }

    const ok = await confirm({
      title: '¿Desvincular Docente?',
      description: `¿Estás seguro de desvincular a "${name}" de este colegio? Perderá el acceso a sus salones y expedientes.`,
      confirmText: 'Sí, desvincular',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteGuide(id);
      toast.success('Docente desvinculado del colegio.');
      fetchList();
    } catch (err) {
      toast.error('Error al desvincular');
    }
  };

  const filtered = useMemo(() => {
    return guides.filter(g => {
      // 1. If TUTOR, ONLY show guides involved with their children's salons
      if (isTutor) {
        if (myChildrenEnvIds.length === 0) return false;
        const teachesMyChild = g.environments.some(e => myChildrenEnvIds.includes(e.id));
        if (!teachesMyChild) return false;
      }

      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        g.fullName.toLowerCase().includes(q) ||
        (!isTutor && g.email.toLowerCase().includes(q)) ||
        (g.jobTitle && g.jobTitle.toLowerCase().includes(q)) ||
        (g.certifications && g.certifications.toLowerCase().includes(q)) ||
        g.environments.some(e => e.name.toLowerCase().includes(q));

      const matchRole =
        roleFilter === 'ALL' || (g.staffRole || 'LEAD_GUIDE') === roleFilter;

      const matchEnv =
        envFilter === 'ALL' || g.environments.some(e => e.id === envFilter);

      return matchSearch && matchRole && matchEnv;
    });
  }, [guides, search, roleFilter, envFilter, isTutor, myChildrenEnvIds]);

  // Pagination State & Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, envFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedGuides = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, validCurrentPage, pageSize]);



  // Potential supervisors for select (exclude self)
  const availableSupervisors = useMemo(() => {
    return guides.filter(g => !editingGuide || g.id !== editingGuide.id);
  }, [guides, editingGuide]);

  // Hierarchy Tree for Organigram View
  const hierarchyTree = useMemo(() => {
    const guideMap = new Map<string, GuideUserItem>();
    guides.forEach(g => guideMap.set(g.id, g));

    const childrenMap = new Map<string, GuideUserItem[]>();
    guides.forEach(g => {
      if (g.supervisorId && guideMap.has(g.supervisorId)) {
        const list = childrenMap.get(g.supervisorId) || [];
        list.push(g);
        childrenMap.set(g.supervisorId, list);
      }
    });

    const executives = guides.filter(g => g.staffRole === 'EXECUTIVE');
    const pedagogical = guides.filter(g => g.staffRole !== 'EXECUTIVE');

    // Root executives: executives who don't report to another executive
    const rootExecutives = executives.filter(
      e => !e.supervisorId || !executives.some(ex => ex.id === e.supervisorId)
    );

    // Root pedagogical nodes: pedagogical staff who don't report to another pedagogical staff and don't report to an executive
    const pedagogicalRoots = pedagogical.filter(
      p => !p.supervisorId || (!pedagogical.some(pg => pg.id === p.supervisorId) && !executives.some(ex => ex.id === p.supervisorId))
    );

    // Sort order for root level nodes
    const sortByRole = (list: GuideUserItem[]) => {
      const order = { COORDINATOR: 1, LEAD_GUIDE: 2, SPECIALIST: 3, ASSISTANT: 4, SUPPORT: 5, EXECUTIVE: 6, OTHER: 7 };
      return [...list].sort((a, b) => {
        return (order[a.staffRole as StaffRoleType] || 99) - (order[b.staffRole as StaffRoleType] || 99);
      });
    };

    return {
      rootExecutives: sortByRole(rootExecutives),
      pedagogicalRoots: sortByRole(pedagogicalRoots),
      childrenMap
    };
  }, [guides]);

  const schoolDisplayName = schoolName || currentSchool?.name || 'Escuela Montessori';

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-background">

      {/* 1. FIXED HEADER (HERO BANNER + SEARCH & FILTERS) */}
      <div className="shrink-0 space-y-4 bg-background z-10">
        {/* FULL-WIDTH GREEN HERO BANNER */}
        <div className="bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                    {isTutor ? 'Equipo Docente (Guías de Mis Hijos)' : 'Equipo Docente'}
                  </h1>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                  {isTutor
                    ? 'Guías titulares y asistentes que acompañan el día a día y aprendizaje de tus hijos.'
                    : 'Guías titulares, asistentes y perfiles con trayectoria y certificaciones.'}
                </p>
              </div>
            </div>

            {!isTutor && (
              <div className="relative z-10 flex items-center gap-2 shrink-0">
                {/* Organigram Fullscreen Trigger (Icon Only) */}
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setOrganigramModalOpen(true);
                  }}
                  className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Ver Organigrama Institucional en Pantalla Completa"
                  aria-label="Ver Organigrama"
                >
                  <GitFork className="w-4 h-4 text-white" />
                </button>

                {canManageGuides && (
                  <button
                    onClick={handleOpenCreate}
                    className="hidden sm:flex px-4 py-2.5 bg-white text-forest hover:bg-white/90 text-xs font-bold rounded-xl shadow-xs transition-all items-center gap-2 hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-forest" />
                    <span>+ Registrar Docente</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modern Floating Filter Toolbar */}
        <div className="px-4 sm:px-6 md:px-8 pb-1 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">

          {/* Search Input */}
          <div className="flex-1 bg-white rounded-2xl px-3.5 py-2 flex items-center gap-2.5 border border-forest/15 shadow-xs">
            <Search className="w-4 h-4 text-forest/50 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, especialidad, certificación (AMI, AMS) o salón..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 hover:bg-forest/10 rounded-full text-muted-foreground hover:text-forest"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Controls: Environment Dropdown & Role Segmented Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Environment Filter (Custom Searchable Combobox if > 4 environments) */}
            {environments.length > 0 && (
              <Popover open={openEnvPopover} onOpenChange={setOpenEnvPopover}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-9 px-3.5 rounded-2xl border border-forest/15 text-xs bg-white text-forest font-semibold focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer shadow-xs flex items-center justify-between gap-2 min-w-[170px]"
                  >
                    <span className="truncate">
                      {envFilter === 'ALL'
                        ? `Todos los Salones (${environments.length})`
                        : environments.find(e => e.id === envFilter)?.name || 'Salón'}
                    </span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-forest/50 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[230px] p-0 bg-white border border-forest/15 rounded-2xl shadow-xl z-50 overflow-hidden" align="start">
                  <Command className="bg-white">
                    {environments.length > 4 && (
                      <CommandInput
                        placeholder="Buscar salón..."
                        className="h-9 text-xs border-b border-forest/10 focus:ring-0 focus:outline-none placeholder:text-muted-foreground bg-transparent w-full text-forest py-2 px-3 font-semibold"
                      />
                    )}
                    <CommandList className="max-h-60 overflow-y-auto">
                      <CommandEmpty className="py-4 text-center text-xs text-muted-foreground font-semibold">
                        No se encontraron salones.
                      </CommandEmpty>
                      <CommandGroup className="p-1">
                        <CommandItem
                          value="ALL"
                          onSelect={() => {
                            setEnvFilter('ALL');
                            setOpenEnvPopover(false);
                          }}
                          className="flex items-center justify-between text-xs text-forest cursor-pointer rounded-xl font-semibold px-3 py-2 data-[selected='true']:bg-forest data-[selected='true']:text-white group transition-colors"
                        >
                          <span>Todos los Salones</span>
                          {envFilter === 'ALL' && (
                            <Check className="h-3.5 w-3.5 font-bold text-forest group-data-[selected='true']:text-white" />
                          )}
                        </CommandItem>
                        {environments.map((env) => (
                          <CommandItem
                            key={env.id}
                            value={env.name}
                            onSelect={() => {
                              setEnvFilter(env.id);
                              setOpenEnvPopover(false);
                            }}
                            className="flex items-center justify-between text-xs text-forest cursor-pointer rounded-xl font-semibold px-3 py-2 data-[selected='true']:bg-forest data-[selected='true']:text-white group transition-colors"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: env.color || '#1b3b2b' }} />
                              <span className="truncate">{env.name}</span>
                            </span>
                            {envFilter === env.id && (
                              <Check className="h-3.5 w-3.5 font-bold text-forest group-data-[selected='true']:text-white" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            {/* Role Filter (Custom Searchable Combobox) */}
            <Popover open={openRolePopover} onOpenChange={setOpenRolePopover}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-9 px-3.5 rounded-2xl border border-forest/15 text-xs bg-white text-forest font-semibold focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer shadow-xs flex items-center justify-between gap-2 min-w-[170px]"
                >
                  <span className="truncate">
                    {roleFilter === 'ALL'
                      ? 'Todos los Roles'
                      : STAFF_ROLES[roleFilter as StaffRoleType]?.label || roleFilter}
                  </span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-forest/50 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[230px] p-0 bg-white border border-forest/15 rounded-2xl shadow-xl z-50 overflow-hidden" align="start">
                <Command className="bg-white">
                  <CommandInput
                    placeholder="Buscar rol..."
                    className="h-9 text-xs border-b border-forest/10 focus:ring-0 focus:outline-none placeholder:text-muted-foreground bg-transparent w-full text-forest py-2 px-3 font-semibold"
                  />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty className="py-4 text-center text-xs text-muted-foreground font-semibold">
                      No se encontraron roles.
                    </CommandEmpty>
                    <CommandGroup className="p-1">
                      <CommandItem
                        value="ALL"
                        onSelect={() => {
                          setRoleFilter('ALL');
                          setOpenRolePopover(false);
                        }}
                        className="flex items-center justify-between text-xs text-forest cursor-pointer rounded-xl font-semibold px-3 py-2 data-[selected='true']:bg-forest data-[selected='true']:text-white group transition-colors"
                      >
                        <span>Todos los Roles</span>
                        {roleFilter === 'ALL' && (
                          <Check className="h-3.5 w-3.5 font-bold text-forest group-data-[selected='true']:text-white" />
                        )}
                      </CommandItem>
                      {Object.entries(STAFF_ROLES).map(([key, config]) => (
                        <CommandItem
                          key={key}
                          value={config.label}
                          onSelect={() => {
                            setRoleFilter(key);
                            setOpenRolePopover(false);
                          }}
                          className="flex items-center justify-between text-xs text-forest cursor-pointer rounded-xl font-semibold px-3 py-2 data-[selected='true']:bg-forest data-[selected='true']:text-white group transition-colors"
                        >
                          <span className="truncate">{config.label}</span>
                          {roleFilter === key && (
                            <Check className="h-3.5 w-3.5 font-bold text-forest group-data-[selected='true']:text-white" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE CARDS AREA (ONLY THIS AREA SCROLLS) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 md:px-8 py-2">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Cargando equipo docente...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3 my-4">
              <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto">
                <GraduationCap className="w-7 h-7 text-forest/40" />
              </div>
              <h3 className="text-base font-bold text-forest">
                {isTutor ? 'No hay docentes vinculados a los salones de tus hijos' : 'No se encontraron docentes'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isTutor
                  ? 'Las guías y asistentes aparecerán aquí cuando estén asignadas al salón Montessori de tus hijos.'
                  : search || roleFilter !== 'ALL' || envFilter !== 'ALL'
                    ? 'Prueba con otros términos de búsqueda o filtros.'
                    : 'Registra a tus guías titulares y asistentes para asignarles salones y permisos.'}
              </p>
              {canManageGuides && (
                <button
                  onClick={handleOpenCreate}
                  className="px-5 py-2.5 bg-forest text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Registrar Primer Docente
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {paginatedGuides.map(guide => {
                const roleCfg = STAFF_ROLES[(guide.staffRole as StaffRoleType) || 'LEAD_GUIDE'] || STAFF_ROLES.LEAD_GUIDE;
                const certs = parseCertifications(guide.certifications);

                // Dynamic experience computation
                const startYr = guide.practiceStartYear || (guide.yearsOfExperience ? currentYear - guide.yearsOfExperience : null);
                const calculatedYears = startYr ? Math.max(0, currentYear - startYr) : (guide.yearsOfExperience || 0);

                const primaryEnv = guide.environments[0];
                const accentColor = primaryEnv?.color || (
                  roleCfg.badgeText.includes('amber') ? '#d97706' :
                    roleCfg.badgeText.includes('emerald') ? '#059669' :
                      roleCfg.badgeText.includes('sky') ? '#0284c7' :
                        roleCfg.badgeText.includes('purple') ? '#7e22ce' :
                          '#1b3b2b'
                );

                const isOwnerGuide = guide.isOwner || guide.role === 'OWNER';

                return (
                  <div
                    key={guide.id}
                    onClick={() => canManageGuides ? handleOpenEdit(guide) : setSelectedGuideForFicha(guide)}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border border-forest/10 shadow-2xs hover:border-forest/30 hover:shadow-xs transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative"
                  >
                    {/* Left Color Accent Bar */}
                    <div
                      className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl"
                      style={{ backgroundColor: isOwnerGuide ? '#059669' : accentColor }}
                    />

                    {/* Left Section: Avatar + Identity + Role + Contact */}
                    <div className="flex items-center gap-3.5 min-w-0 pl-1.5 flex-1">
                      <div
                        className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-2xl bg-forest/5 border-2 flex items-center justify-center font-bold text-base font-display text-forest shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform"
                        style={{ borderColor: isOwnerGuide ? '#10b981' : accentColor }}
                      >
                        {guide.avatarUrl ? (
                          <img src={guide.avatarUrl} alt={guide.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{guide.fullName.charAt(0)}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-forest text-sm truncate leading-tight group-hover:text-forest/90">
                            {guide.fullName}
                          </h4>

                          {isOwnerGuide ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600 fill-emerald-500" />
                              <span>Propietario & Guía</span>
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}>
                              {roleCfg.label}
                            </span>
                          )}

                          {startYr ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-0.5 shrink-0">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                              Desde {startYr} ({calculatedYears} {calculatedYears === 1 ? 'año' : 'años'})
                            </span>
                          ) : null}
                        </div>

                        {isTutor ? (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {guide.jobTitle || 'Guía Montessori'} • {guide.environments.map(e => e.name).join(', ') || 'Sin salón asignado'}
                          </p>
                        ) : (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <Mail className="w-3.5 h-3.5 text-forest/40" />
                              <span className="truncate max-w-[180px] sm:max-w-[240px]">{guide.email}</span>
                            </span>

                            {guide.phone && (
                              <span className="hidden sm:flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-forest/40" />
                                <span>{guide.phone}</span>
                              </span>
                            )}

                            {guide.jobTitle && (
                              <span className="hidden md:inline-block text-[11px] text-forest/80 font-medium px-2 py-0.5 bg-forest/5 rounded-md border border-forest/10">
                                {guide.jobTitle}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Assigned Environments Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pl-1.5 lg:pl-0 shrink-0">
                      {guide.environments.length > 0 ? (
                        guide.environments.map(env => (
                          <span
                            key={env.id}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-xl text-white shadow-2xs flex items-center gap-1 shrink-0"
                            style={{ backgroundColor: env.color || '#1b3b2b' }}
                          >
                            <Building2 className="w-3 h-3 text-white/80" />
                            <span>{env.name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 italic font-medium px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg">
                          Sin salones asignados
                        </span>
                      )}
                    </div>

                    {/* Right Section: Badges & Action Buttons */}
                    <div className="flex items-center justify-between lg:justify-end gap-2 pl-1.5 lg:pl-0 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-forest/5">
                      {/* Certifications Preview Count */}
                      {certs.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/80 flex items-center gap-1">
                            <Award className="w-3 h-3 text-emerald-600" />
                            <span>{certs[0].title}</span>
                            {certs.length > 1 && (
                              <span className="ml-0.5 bg-emerald-200 text-emerald-950 px-1 rounded-full text-[9px]">
                                +{certs.length - 1}
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="hidden sm:block text-[11px] text-muted-foreground/40">
                          —
                        </div>
                      )}

                      {/* Tutor Quick Actions (Email & Phone) */}
                      {isTutor ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`mailto:${guide.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-xl bg-forest/5 hover:bg-forest text-forest hover:text-white border border-forest/10 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            title="Enviar correo"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          {guide.phone && (
                            <a
                              href={`tel:${guide.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 rounded-xl bg-forest/5 hover:bg-forest text-forest hover:text-white border border-forest/10 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                              title="Llamar"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGuideForFicha(guide);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest text-forest hover:text-white border border-forest/10 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ver Ficha</span>
                          </button>
                        </div>
                      ) : (
                        /* Admin 3-Dots Dropdown Trigger */
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownGuideId(activeDropdownGuideId === guide.id ? null : guide.id);
                            }}
                            className="w-8 h-8 rounded-xl bg-forest/5 hover:bg-forest/15 text-forest flex items-center justify-center transition-colors border border-forest/10 cursor-pointer"
                            title="Opciones del docente"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Floating Action Menu */}
                          {activeDropdownGuideId === guide.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-50 cursor-default" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownGuideId(null);
                                }} 
                              />
                              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-forest/15 rounded-2xl shadow-xl py-1.5 z-[60] animate-in fade-in zoom-in-95 duration-100 text-foreground">
                                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-forest/5 mb-1">
                                  Acciones Docente
                                </div>
                                <div className="space-y-0.5 px-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedGuideForFicha(guide);
                                      setActiveDropdownGuideId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Ver Ficha Completa</span>
                                  </button>

                                  {canManageGuides && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEdit(guide);
                                        setActiveDropdownGuideId(null);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Editar Perfil</span>
                                    </button>
                                  )}

                                  {isOwnerOrAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleImpersonate(guide);
                                        setActiveDropdownGuideId(null);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Acceder como {guide.fullName.split(' ')[0]}</span>
                                    </button>
                                  )}

                                  {canManageGuides && (
                                    isOwnerGuide ? (
                                      <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>Propietario (Inmutable)</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(guide.id, guide.fullName);
                                          setActiveDropdownGuideId(null);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Desvincular Docente</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* 3. FIXED FOOTER WITH PAGINATOR (NEVER ENTERS SCROLL) */}
      <div className="shrink-0 px-4 sm:px-6 md:px-8 py-2 bg-white/95 backdrop-blur-md border-t border-forest/10 z-10 shadow-2xs">
        <PaginationControl
          currentPage={validCurrentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="docentes"
        />
      </div>

      {/* ==================================================== */}
      {/* FULLSCREEN MODAL: ORGANIGRAMA INSTITUCIONAL & PEDAGÓGICO */}
      {/* ==================================================== */}
      {organigramModalOpen && (
        <div className="!mt-0 fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen h-[100dvh] max-h-[100dvh] z-50 bg-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Modal Header (Floating & Transparent, Stretched to Top and Sides) */}
          <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between gap-4 bg-transparent border-none shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-forest text-white flex items-center justify-center shadow-xs shrink-0">
                <GitFork className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-forest text-base sm:text-lg leading-tight font-display truncate">
                  Organigrama Institucional & Pedagógico
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {schoolDisplayName} • Estructura jerárquica y supervisión docente
                </p>
              </div>
            </div>

            {/* Controls: Zoom In / Zoom Out / Reset / Close */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-forest/5 p-1 rounded-xl border border-forest/10">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                  className="p-1.5 text-muted-foreground hover:text-forest hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Reducir zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-2 text-forest select-none min-w-[40px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(2.0, Number((prev + 0.1).toFixed(2))))}
                  className="p-1.5 text-muted-foreground hover:text-forest hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1.5 text-muted-foreground hover:text-forest hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Restablecer al 100%"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setOrganigramModalOpen(false)}
                className="p-2.5 rounded-2xl bg-forest/5 hover:bg-forest/15 text-forest font-bold transition-all shadow-2xs hover:scale-105 active:scale-95"
                title="Cerrar Organigrama"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas Body with Dotted Pattern (Occupies 100% space) */}
          <div
            ref={canvasContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="absolute inset-0 w-full h-full overflow-hidden bg-[radial-gradient(#1b3b2b18_1.2px,transparent_1.2px)] [background-size:20px_20px] select-none"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div
              className="min-w-fit flex flex-col items-center gap-10 mx-auto origin-top pt-28 pb-20"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
            >

              {/* 1. NODO ROOT SUPREMO: EL COLEGIO / DIRECCIÓN GENERAL */}
              <div className="flex flex-col items-center">
                <div
                  className="w-80 bg-white text-forest rounded-3xl p-5 shadow-xl border-2 relative text-center transition-all"
                  style={{ borderColor: brandPrimaryColor || '#1b3b2b' }}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-forest text-[10px] font-black tracking-wider flex items-center gap-1 shadow-md uppercase">
                    <Crown className="w-3 h-3 fill-forest" />
                    <span>Rectoría & Dirección</span>
                  </div>

                  {/* School Logo */}
                  <div className="max-w-[240px] h-16 px-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/60 flex items-center justify-center mx-auto mb-2.5 shadow-sm p-2 overflow-hidden mt-1">
                    {schoolLogo ? (
                      <img src={schoolLogo} alt={schoolDisplayName} className="max-w-full max-h-full object-contain" />
                    ) : currentSchool?.logoUrl ? (
                      <img src={currentSchool.logoUrl} alt={schoolDisplayName} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <School className="w-8 h-8 text-forest" />
                    )}
                  </div>

                  {/* School Name below Logo */}
                  <h4 className="font-bold text-base text-forest leading-tight font-display tracking-tight">
                    {schoolDisplayName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    {schoolTagline || 'Consejo Directivo & Coordinación General'}
                  </p>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-semibold bg-slate-50 rounded-xl py-1.5 px-3">
                    <Users className="w-3.5 h-3.5 text-forest/70" />
                    <span>{guides.length} Miembros en el Equipo Pedagógico</span>
                  </div>
                </div>

                {/* Vertical Line down from School Node */}
                {(hierarchyTree.rootExecutives.length > 0 || hierarchyTree.pedagogicalRoots.length > 0) && (
                  <div
                    className="w-0.5 h-8 opacity-60"
                    style={{ backgroundColor: brandPrimaryColor || '#1b3b2b' }}
                  />
                )}
              </div>

              {/* 2. DIRECCIÓN / EJECUTIVOS */}
              {hierarchyTree.rootExecutives.length > 0 && (
                <div className="flex flex-col items-center w-full">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-2xs mb-2">
                    Dirección Ejecutiva
                  </div>
                  <div className="relative flex justify-center items-start gap-8 pt-8">
                    {hierarchyTree.rootExecutives.map((execNode, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === hierarchyTree.rootExecutives.length - 1;
                      const isOnly = hierarchyTree.rootExecutives.length === 1;
                      return (
                        <div key={execNode.id} className="flex flex-col items-center relative">
                          {!isOnly && (
                            <div className="absolute -top-8 left-0 right-0 h-8 pointer-events-none">
                              {isFirst && (
                                <div className="absolute top-0 -right-4 left-1/2 h-full border-t border-l border-forest/30 rounded-tl-2xl" />
                              )}
                              {isLast && (
                                <div className="absolute top-0 -left-4 right-1/2 h-full border-t border-r border-forest/30 rounded-tr-2xl" />
                              )}
                              {!isFirst && !isLast && (
                                <>
                                  <div className="absolute top-0 -left-4 -right-4 h-px bg-forest/30" />
                                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-forest/30 -translate-x-1/2" />
                                </>
                              )}
                            </div>
                          )}
                          {isOnly && (
                            <div className="absolute -top-8 left-1/2 w-px h-8 bg-forest/30 -translate-x-1/2" />
                          )}
                          <OrganigramTreeNode
                            node={execNode}
                            childrenMap={hierarchyTree.childrenMap}
                            onEdit={(g) => {
                              setSelectedGuideForFicha(g);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Connective line down to Pedagogical Block */}
                  {hierarchyTree.pedagogicalRoots.length > 0 && (
                    <div
                      className="w-0.5 h-10 opacity-60 mt-6"
                      style={{ backgroundColor: brandPrimaryColor || '#1b3b2b' }}
                    />
                  )}
                </div>
              )}

              {/* 3. EQUIPO PEDAGÓGICO / DOCENTES */}
              {hierarchyTree.pedagogicalRoots.length > 0 && (
                <div className="flex flex-col items-center w-full">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-forest bg-forest/5 px-3 py-1 rounded-full border border-forest/10 shadow-2xs mb-2">
                    Equipo Pedagógico & Docente
                  </div>
                  <div className="relative flex justify-center items-start gap-8 pt-8">
                    {hierarchyTree.pedagogicalRoots.map((pedNode, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === hierarchyTree.pedagogicalRoots.length - 1;
                      const isOnly = hierarchyTree.pedagogicalRoots.length === 1;
                      return (
                        <div key={pedNode.id} className="flex flex-col items-center relative">
                          {!isOnly && (
                            <div className="absolute -top-8 left-0 right-0 h-8 pointer-events-none">
                              {isFirst && (
                                <div className="absolute top-0 -right-4 left-1/2 h-full border-t border-l border-forest/30 rounded-tl-2xl" />
                              )}
                              {isLast && (
                                <div className="absolute top-0 -left-4 right-1/2 h-full border-t border-r border-forest/30 rounded-tr-2xl" />
                              )}
                              {!isFirst && !isLast && (
                                <>
                                  <div className="absolute top-0 -left-4 -right-4 h-px bg-forest/30" />
                                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-forest/30 -translate-x-1/2" />
                                </>
                              )}
                            </div>
                          )}
                          {isOnly && (
                            <div className="absolute -top-8 left-1/2 w-px h-8 bg-forest/30 -translate-x-1/2" />
                          )}
                          <OrganigramTreeNode
                            node={pedNode}
                            childrenMap={hierarchyTree.childrenMap}
                            onEdit={(g) => {
                              setOrganigramModalOpen(false);
                              handleOpenEdit(g);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {hierarchyTree.rootExecutives.length === 0 && hierarchyTree.pedagogicalRoots.length === 0 && (
                <div className="bg-white p-6 rounded-3xl border border-forest/15 text-center text-xs text-muted-foreground shadow-sm">
                  No hay miembros registrados aún en el colegio.
                </div>
              )}

            </div>
          </div>

          {/* Modal Footer Note (Fixed to bottom with Glassmorphism) */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-3 bg-white/75 backdrop-blur-md border-t border-forest/10 flex items-center justify-between text-xs text-muted-foreground shadow-lg select-none">
            <span className="flex items-center gap-1.5 text-forest/80 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Haz clic en cualquier tarjeta para ver la ficha completa.</span>
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Presiona <kbd className="px-1.5 py-0.5 rounded bg-forest/5 border border-forest/15 font-mono text-[10px]">ESC</kbd> para salir
            </span>
          </div>

        </div>
      )}

      {/* GuideDrawer Component (Unified Drawer for Creating & Editing Guides) */}
      <GuideDrawer
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGuide(null);
        }}
        guide={editingGuide}
        guidesList={guides}
        environments={environments}
        onSaved={() => {
          fetchList();
        }}
      />

      {/* ResponsiveModal for Ficha de Docente */}
      {selectedGuideForFicha && (
        <ResponsiveModal
          isOpen={!!selectedGuideForFicha}
          onClose={() => setSelectedGuideForFicha(null)}
          title="Ficha Pedagógica del Docente"
          borderRadius="full"
        >
          <div className="space-y-6">
            {/* Photo and Primary Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-forest/5">
              <div className="w-20 h-20 rounded-2xl bg-forest/5 border border-forest/15 text-forest font-bold flex items-center justify-center text-3xl shrink-0 overflow-hidden shadow-sm">
                {selectedGuideForFicha.avatarUrl ? (
                  <img src={selectedGuideForFicha.avatarUrl} alt={selectedGuideForFicha.fullName} className="w-full h-full object-cover" />
                ) : (
                  selectedGuideForFicha.fullName.charAt(0)
                )}
              </div>
              <div className="text-center sm:text-left min-w-0 flex-1 space-y-1">
                <h3 className="text-lg font-bold text-forest leading-tight">
                  {selectedGuideForFicha.fullName}
                </h3>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 mt-1">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STAFF_ROLES[(selectedGuideForFicha.staffRole as StaffRoleType) || 'LEAD_GUIDE']?.badgeBg || 'bg-slate-100'
                    } ${STAFF_ROLES[(selectedGuideForFicha.staffRole as StaffRoleType) || 'LEAD_GUIDE']?.badgeText || 'text-slate-700'
                    } ${STAFF_ROLES[(selectedGuideForFicha.staffRole as StaffRoleType) || 'LEAD_GUIDE']?.badgeBorder || 'border-slate-200'
                    }`}>
                    {selectedGuideForFicha.jobTitle || STAFF_ROLES[(selectedGuideForFicha.staffRole as StaffRoleType) || 'LEAD_GUIDE']?.label || 'Docente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Mail className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Correo Electrónico</span>
                  <a href={`mailto:${selectedGuideForFicha.email}`} className="text-xs text-forest hover:underline truncate block font-medium">
                    {selectedGuideForFicha.email}
                  </a>
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Phone className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Teléfono</span>
                  <span className="text-xs text-slate-700 block truncate font-medium">
                    {selectedGuideForFicha.phone || 'No registrado'}
                  </span>
                </div>
              </div>

              {/* Años de Experiencia */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Clock className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Experiencia</span>
                  <span className="text-xs text-slate-700 block truncate font-medium">
                    {selectedGuideForFicha.yearsOfExperience ? `${selectedGuideForFicha.yearsOfExperience} años` : 'No registrado'}
                  </span>
                </div>
              </div>

              {/* Supervisor */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <User className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Supervisor directo</span>
                  <span className="text-xs text-slate-700 block truncate font-medium">
                    {selectedGuideForFicha.supervisor?.fullName || 'Sin supervisor asignado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio (optional) */}
            {selectedGuideForFicha.bio && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Biografía / Perfil profesional</span>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{selectedGuideForFicha.bio}"
                </p>
              </div>
            )}

             {/* Certifications */}
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
               <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1.5 font-display">
                 <Award className="w-4 h-4 text-forest" />
                 <span>Certificaciones & Credenciales</span>
               </span>
               <div className="flex flex-wrap gap-2 pl-1">
                 {(() => {
                   const certList = parseCertifications(selectedGuideForFicha.certifications);
                   if (certList.length === 0) {
                     return <span className="text-xs text-slate-500 italic">Sin certificaciones registradas.</span>;
                   }
                   return certList.map((c, idx) => (
                     <span
                       key={idx}
                       className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white text-forest border border-forest/10 shadow-2xs flex items-center gap-1.5 shrink-0"
                     >
                       <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                       <span>{c.name}</span>
                       {c.year && (
                         <span className="text-[10px] text-forest/70 font-mono font-bold bg-forest/10 px-1.5 py-0.2 rounded">
                           {c.year}
                         </span>
                       )}
                     </span>
                   ));
                 })()}
               </div>
             </div>

            {/* Environments / Salones */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Building2 className="w-4 h-4 text-forest" />
                <span>Ambientes / Salones Asignados</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pl-1">
                {selectedGuideForFicha.environments && selectedGuideForFicha.environments.length > 0 ? (
                  selectedGuideForFicha.environments.map(env => (
                    <span
                      key={env.id}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg text-white shadow-2xs"
                      style={{ backgroundColor: env.color || '#1b3b2b' }}
                    >
                      {env.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Ningún ambiente asignado.</span>
                )}
              </div>
            </div>

            {isOwnerOrAdmin && (
              <div className="pt-3 border-t border-forest/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    handleImpersonate(selectedGuideForFicha);
                    setSelectedGuideForFicha(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Acceder como {selectedGuideForFicha.fullName.split(' ')[0]}</span>
                </button>
              </div>
            )}
          </div>
        </ResponsiveModal>
      )}

      {/* Mobile Floating Action Buttons (FABs Stack) */}
      <div className="sm:hidden fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        {/* Floating Organigram Button (Above) */}
        <button
          type="button"
          onClick={() => {
            setZoomLevel(1);
            setOrganigramModalOpen(true);
          }}
          className="w-13 h-13 min-w-[52px] min-h-[52px] max-w-[52px] max-h-[52px] rounded-full bg-white hover:bg-forest/5 text-forest border-2 border-forest/15 shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-forest/10"
          aria-label="Ver Organigrama Institucional"
          title="Ver Organigrama Institucional"
        >
          <GitFork className="w-5 h-5 text-forest" />
        </button>

        {/* Floating Add Teacher Button (Below) */}
        <button
          type="button"
          onClick={handleOpenCreate}
          className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-forest/30"
          aria-label="Registrar Nuevo Docente"
          title="Registrar Nuevo Docente"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

// ====================================================
// COMPONENTE: NODO DEL ORGANIGRAMA JERÁRQUICO
// ====================================================
interface OrganigramTreeNodeProps {
  node: GuideUserItem;
  childrenMap: Map<string, GuideUserItem[]>;
  onEdit: (guide: GuideUserItem) => void;
}

const OrganigramTreeNode: React.FC<OrganigramTreeNodeProps> = ({ node, childrenMap, onEdit }) => {
  const children = childrenMap.get(node.id) || [];
  const roleCfg = STAFF_ROLES[(node.staffRole as StaffRoleType) || 'LEAD_GUIDE'] || STAFF_ROLES.LEAD_GUIDE;
  const isLeader = !node.supervisorId;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        onClick={() => onEdit(node)}
        className={`w-72 bg-white rounded-3xl p-4 border-2 transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-102 relative group ${node.staffRole === 'EXECUTIVE'
            ? 'border-indigo-300 hover:border-indigo-500'
            : isLeader
              ? 'border-amber-400 ring-2 ring-amber-100'
              : 'border-slate-300 hover:border-forest'
          }`}
      >
        {/* Floating Cargo Badge on top of each teacher card */}
        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-[9px] font-bold tracking-wider flex items-center gap-1 shadow-2xs whitespace-nowrap z-20 max-w-[90%] truncate ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}>
          {node.staffRole === 'EXECUTIVE' && <Crown className="w-2.5 h-2.5 shrink-0" />}
          <span>{node.jobTitle || roleCfg.label}</span>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-2xl bg-forest/5 border border-forest/15 text-forest font-bold flex items-center justify-center text-base shrink-0 overflow-hidden shadow-2xs">
            {node.avatarUrl ? (
              <img src={node.avatarUrl} alt={node.fullName} className="w-full h-full object-cover" />
            ) : (
              node.fullName.charAt(0)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-forest text-xs truncate leading-tight group-hover:text-forest/80">
              {node.fullName}
            </h4>
            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block mt-1">
              {roleCfg.label}
            </span>
          </div>
        </div>

        {/* Environments chips */}
        {node.environments.length > 0 && (
          <div className="mt-3 pt-2 border-t border-forest/5 flex flex-wrap gap-1">
            {node.environments.map(env => (
              <span
                key={env.id}
                className="text-[9px] font-bold px-2 py-0.5 rounded-md text-white shadow-2xs truncate max-w-[120px]"
                style={{ backgroundColor: env.color || '#1b3b2b' }}
              >
                {env.name}
              </span>
            ))}
          </div>
        )}

        {/* Subordinates count badge */}
        {children.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-forest/5 flex items-center justify-between text-[10px] text-forest/70 font-semibold">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-forest" />
              <span>{children.length} {children.length === 1 ? 'docente a cargo' : 'docentes a cargo'}</span>
            </span>
            <span className="text-[9px] text-forest font-bold bg-forest/10 px-1.5 py-0.2 rounded-md">
              Supervisor
            </span>
          </div>
        )}
      </div>

      {/* Children Tree Branch */}
      {children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical Connecting Line down from parent */}
          <div className="w-px h-6 bg-forest/30" />

          {/* Children container */}
          <div className="relative flex justify-center items-start gap-8 pt-8">
            {children.map((childGuide, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === children.length - 1;
              const isOnly = children.length === 1;
              return (
                <div key={childGuide.id} className="flex flex-col items-center relative">
                  {!isOnly && (
                    <div className="absolute -top-8 left-0 right-0 h-8 pointer-events-none">
                      {isFirst && (
                        <div className="absolute top-0 -right-4 left-1/2 h-full border-t border-l border-forest/30 rounded-tl-2xl" />
                      )}
                      {isLast && (
                        <div className="absolute top-0 -left-4 right-1/2 h-full border-t border-r border-forest/30 rounded-tr-2xl" />
                      )}
                      {!isFirst && !isLast && (
                        <>
                          <div className="absolute top-0 -left-4 -right-4 h-px bg-forest/30" />
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-forest/30 -translate-x-1/2" />
                        </>
                      )}
                    </div>
                  )}
                  {isOnly && (
                    <div className="absolute -top-8 left-1/2 w-px h-8 bg-forest/30 -translate-x-1/2" />
                  )}
                  <OrganigramTreeNode
                    node={childGuide}
                    childrenMap={childrenMap}
                    onEdit={onEdit}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidesSection;
