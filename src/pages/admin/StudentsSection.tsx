import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  User, 
  UserPlus, 
  GraduationCap, 
  Search, 
  Edit, 
  Trash2, 
  HeartHandshake, 
  Phone, 
  Mail, 
  Plus, 
  MoreVertical,
  Calendar, 
  Sparkles, 
  Layers, 
  HeartPulse, 
  IdCard, 
  Building2, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  AlertTriangle,
  TrendingUp, 
  Clock, 
  BookmarkPlus, 
  Baby, 
  Filter, 
  Check, 
  ArrowRight, 
  ExternalLink, 
  MessageCircle, 
  ShieldCheck, 
  Car, 
  Workflow, 
  RefreshCw,
  XCircle,
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  List,
  LayoutGrid,
  CalendarDays,
  X,
  Lock,
  CreditCard,
  Copy,
  Eye
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MobileMenuButton } from './AdminDashboard';
import { 
  getStudents, 
  deleteStudent, 
  getEnvironments,
  getGuides,
  GuideUserItem,
  getWaitlistEntries,
  deleteWaitlistEntry,
  updateWaitlistEntry,
  EnvironmentItem,
  StudentItem,
  WaitlistEntry,
  getProcesses,
  startProcessApplication
} from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { StudentDrawer } from '@/components/admin/StudentDrawer';
import { StudentProgressReportDrawer } from '@/components/admin/StudentProgressReportDrawer';
import { StudentEvolutionTimelineDrawer } from '@/components/admin/StudentEvolutionTimelineDrawer';
import { StudentCharacterizationMatrixDrawer } from '@/components/admin/StudentCharacterizationMatrixDrawer';
import { CharacterizationFormDrawer } from '@/components/admin/CharacterizationFormDrawer';
import { InstallmentsManagerDrawer } from '@/components/admin/InstallmentsManagerDrawer';
import { WaitlistDrawer } from '@/components/admin/WaitlistDrawer';
import { StartAdmissionFromWaitlistDrawer } from '@/components/admin/StartAdmissionFromWaitlistDrawer';
import { StudentCharacterizationItem } from '@/lib/sqlite';
import { toast } from 'sonner';

const WAITLIST_STATUS_OPTIONS = [
  { id: 'WAITING', label: 'En Espera', icon: Clock, color: '#f59e0b', dotColor: '#f59e0b' },
  { id: 'IN_ADMISSION', label: 'En Admisión', icon: Workflow, color: '#3b82f6', dotColor: '#3b82f6' },
  { id: 'ENROLLED', label: 'Matriculados', icon: CheckCircle2, color: '#10b981', dotColor: '#10b981' },
  { id: 'CANCELLED', label: 'Cancelados', icon: XCircle, color: '#ef4444', dotColor: '#ef4444' }
] as const;

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

const StudentListSkeleton: React.FC = () => (
  <div className="space-y-3 animate-in fade-in duration-300">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl p-4 border border-forest/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
          <div className="space-y-2 min-w-0">
            <div className="h-4 w-40 sm:w-56 bg-slate-200 rounded-md" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 bg-slate-100 rounded-md" />
              <div className="h-3 w-16 bg-slate-100 rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="h-6 w-24 bg-slate-100 rounded-full" />
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
          <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0" />
        </div>
      </div>
    ))}
  </div>
);

const StudentGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 animate-in fade-in duration-300">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-white rounded-3xl border border-forest/10 shadow-xs overflow-hidden flex flex-col animate-pulse"
      >
        <div className="h-44 sm:h-48 bg-slate-200 relative p-4 flex items-start justify-between">
          <div className="w-20 h-6 bg-slate-300/80 rounded-full" />
          <div className="w-16 h-6 bg-slate-300/80 rounded-full" />
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl">
            <div className="h-8 bg-slate-200/60 rounded-xl" />
            <div className="h-8 bg-slate-200/60 rounded-xl" />
            <div className="h-8 bg-slate-200/60 rounded-xl" />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-100 rounded-md" />
            <div className="w-7 h-7 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const StudentAgeSkeleton: React.FC = () => (
  <div className="space-y-4 animate-in fade-in duration-300">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="rounded-3xl bg-white border border-forest/10 shadow-xs overflow-hidden animate-pulse"
      >
        <div className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-slate-200 rounded-md" />
              <div className="h-3 w-32 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-200" />
        </div>
        <div className="p-6 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {[1, 2, 3, 4, 5, 6].map((j) => (
            <div key={j} className="flex flex-col items-center p-4 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-2.5">
              <div className="w-16 h-16 rounded-full bg-slate-200" />
              <div className="h-3.5 w-20 bg-slate-200 rounded-md" />
              <div className="h-3 w-12 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

interface StudentsSectionProps {
  statusFilter?: 'active' | 'graduated';
}

export const StudentsSection: React.FC<StudentsSectionProps> = ({
  statusFilter = 'active'
}) => {
  const navigate = useNavigate();
  const { role, user, userEmail, activeMembership } = useAuth();
  const isOwner = role === 'OWNER' || activeMembership?.role === 'OWNER';
  const isOwnerOrAdmin = isOwner || role === 'ADMIN' || activeMembership?.role === 'ADMIN';
  const isTutor = role === 'TUTOR';
  const isTeacherOrStaff = role === 'TEACHER' || role === 'STAFF';
  const permissions: string[] = (activeMembership as any)?.permissions || [];
  const hasGlobalStudentsPermission = isOwnerOrAdmin || permissions.includes('students') || permissions.includes('students:read') || permissions.includes('students:write');
  const hasGraduatedPermission = isOwnerOrAdmin || permissions.includes('graduated_students') || permissions.includes('graduated_students:read') || permissions.includes('graduated_students:write');
  const canAccessAdmissions = isOwnerOrAdmin || permissions.includes('admissions') || permissions.includes('admissions:read') || permissions.includes('admissions:write') || permissions.includes('processes') || permissions.includes('waitlist');
  const canViewFinances = isOwnerOrAdmin || permissions.includes('finances') || permissions.includes('finances:read') || permissions.includes('finances:write') || permissions.includes('finances:manage') || isTutor;
  const canManageFinances = isOwnerOrAdmin || permissions.includes('finances:write') || permissions.includes('finances:manage') || permissions.includes('finances');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'enrolled' | 'waitlist'>('enrolled');

  // Enrolled Students State
  const [students, setStudents] = useState<StudentItem[]>([]);
  const statusStudents = useMemo(() => {
    return students.filter(s => s.status === statusFilter);
  }, [students, statusFilter]);
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [guides, setGuides] = useState<GuideUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProcesses, setAllProcesses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudentEnvIds, setSelectedStudentEnvIds] = useState<string[]>([]);
  const [studentEnvDropdownOpen, setStudentEnvDropdownOpen] = useState(false);
  const studentEnvDropdownRef = useRef<HTMLDivElement>(null);
  const [isStudentSearchExpanded, setIsStudentSearchExpanded] = useState(false);
  const studentSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentEnvDropdownRef.current && !studentEnvDropdownRef.current.contains(event.target as Node)) {
        setStudentEnvDropdownOpen(false);
      }
      if (waitlistEnvDropdownRef.current && !waitlistEnvDropdownRef.current.contains(event.target as Node)) {
        setWaitlistEnvDropdownOpen(false);
      }
      if (waitlistStatusDropdownRef.current && !waitlistStatusDropdownRef.current.contains(event.target as Node)) {
        setWaitlistStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Waitlist State
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [isWaitlistSearchExpanded, setIsWaitlistSearchExpanded] = useState(false);
  const waitlistSearchInputRef = useRef<HTMLInputElement>(null);
  const [selectedWaitlistEnvIds, setSelectedWaitlistEnvIds] = useState<string[]>([]);
  const [waitlistEnvDropdownOpen, setWaitlistEnvDropdownOpen] = useState(false);
  const waitlistEnvDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedWaitlistStatuses, setSelectedWaitlistStatuses] = useState<string[]>([]);
  const [waitlistStatusDropdownOpen, setWaitlistStatusDropdownOpen] = useState(false);
  const waitlistStatusDropdownRef = useRef<HTMLDivElement>(null);

  // Waitlist Drawer & Admission Transfer State
  const [waitlistDrawerOpen, setWaitlistDrawerOpen] = useState(false);
  const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState<WaitlistEntry | null>(null);
  const [startAdmissionDrawerOpen, setStartAdmissionDrawerOpen] = useState(false);
  const [waitlistEntryForAdmission, setWaitlistEntryForAdmission] = useState<WaitlistEntry | null>(null);

  // Pagination State (Default 25)
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPageSize, setStudentsPageSize] = useState(25);
  const [waitlistPage, setWaitlistPage] = useState(1);
  const [waitlistPageSize, setWaitlistPageSize] = useState(25);

  // Reset page when filters change
  useEffect(() => {
    setStudentsPage(1);
  }, [search, selectedStudentEnvIds]);

  useEffect(() => {
    setWaitlistPage(1);
  }, [waitlistSearch, selectedWaitlistEnvIds, selectedWaitlistStatuses]);

  // Student Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  // Progress Report Drawer State
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);
  const [reportStudentId, setReportStudentId] = useState<string | null>(null);

  // Evolution Timeline Drawer State
  const [evolutionDrawerOpen, setEvolutionDrawerOpen] = useState(false);
  const [evolutionStudent, setEvolutionStudent] = useState<StudentItem | null>(null);

  // 360° Characterization Drawers State
  const [matrixDrawerOpen, setMatrixDrawerOpen] = useState(false);
  const [matrixStudent, setMatrixStudent] = useState<StudentItem | null>(null);
  const [matrixRefreshTrigger, setMatrixRefreshTrigger] = useState(0);
  const [charFormDrawerOpen, setCharFormDrawerOpen] = useState(false);
  const [charFormStudent, setCharFormStudent] = useState<StudentItem | null>(null);
  const [charEditingItem, setCharEditingItem] = useState<StudentCharacterizationItem | null>(null);

  // Student Finances / Installments Drawer State
  const [financesDrawerOpen, setFinancesDrawerOpen] = useState(false);
  const [financesStudent, setFinancesStudent] = useState<StudentItem | null>(null);

  // Student Delete Confirmation Modal State (Owner only)
  const [studentToDelete, setStudentToDelete] = useState<StudentItem | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [hasCopiedDeleteName, setHasCopiedDeleteName] = useState(false);

  // Dynamic Process Start Confirmation Modal State
  const [processTarget, setProcessTarget] = useState<{ student: StudentItem; proc: any } | null>(null);
  const [isStartingProcess, setIsStartingProcess] = useState(false);

  // View Mode: 'list' | 'grid' | 'by_age'
  type ViewMode = 'list' | 'grid' | 'by_age';
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [openAgeAccordion, setOpenAgeAccordion] = useState<Record<string, boolean>>({
    nido: true,
    comunidad: true,
    casa: true,
    taller1: true,
    taller2: true,
    secundaria: true,
    unspecified: true
  });

  const toggleAgeAccordion = (groupId: string) => {
    setOpenAgeAccordion((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getAgeInMonths = (dobString?: string | null): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
      years--;
      months += 12;
    }
    return years * 12 + months;
  };

  const fetchList = async () => {
    setLoading(true);
    const [studentsData, envsData, waitlistData, guidesData, processesData] = await Promise.all([
      getStudents(),
      getEnvironments(),
      getWaitlistEntries(),
      getGuides(),
      getProcesses().catch(() => [])
    ]);
    setStudents(studentsData);
    setEnvironments(envsData);
    setWaitlistEntries(waitlistData);
    setGuides(guidesData);
    setAllProcesses(processesData);
    setLoading(false);
  };

  const fetchWaitlistOnly = async () => {
    setWaitlistLoading(true);
    const data = await getWaitlistEntries();
    setWaitlistEntries(data);
    setWaitlistLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Find assigned salon for teacher/guide
  const myGuide = useMemo(() => {
    if (!isTeacherOrStaff) return null;
    return guides.find(g => 
      (user?.id && g.id === user.id) || 
      (userEmail && g.email?.toLowerCase() === userEmail.toLowerCase())
    );
  }, [guides, isTeacherOrStaff, user, userEmail]);

  const teacherEnvIds = useMemo(() => {
    if (hasGlobalStudentsPermission) {
      return environments.map(e => e.id);
    }
    if (!isTeacherOrStaff) return [];
    const envIdsFromGuide = myGuide?.environments?.map(e => e.id) || [];
    const envIdsFromEnvs = environments
      .filter(env => 
        env.guideIds?.includes(user?.id) ||
        env.guides?.some(g => g.userId === user?.id) ||
        env.teachers?.some(t => 
          (user?.id && t.id === user.id) || 
          (userEmail && t.email?.toLowerCase() === userEmail.toLowerCase()) ||
          (myGuide?.id && t.id === myGuide.id)
        )
      )
      .map(env => env.id);
    return Array.from(new Set([...envIdsFromGuide, ...envIdsFromEnvs]));
  }, [hasGlobalStudentsPermission, isTeacherOrStaff, myGuide, environments, user, userEmail]);

  const allowedEnvironments = useMemo(() => {
    if (hasGlobalStudentsPermission) return environments;
    return environments.filter(env => teacherEnvIds.includes(env.id));
  }, [environments, hasGlobalStudentsPermission, teacherEnvIds]);

  const handleOpenEdit = (student: StudentItem) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  };

  const handleStartStudentProcess = (student: StudentItem, proc: any) => {
    setProcessTarget({ student, proc });
  };

  const executeStartStudentProcess = async () => {
    if (!processTarget) return;
    const { student, proc } = processTarget;
    setIsStartingProcess(true);
    try {
      await startProcessApplication(proc.id, { studentId: student.id });
      toast.success(`Proceso "${proc.label || proc.name}" iniciado con éxito`);
      const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/panel';
      window.location.href = `${basePath}/process_${proc.slug}`;
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar el proceso');
      setIsStartingProcess(false);
    }
  };

  const getStartableProcessesForStudent = (s: StudentItem) => {
    if (!canAccessAdmissions) return [];
    return allProcesses.filter(p => {
      if (!p.isActive) return false;
      const origins = (p.originSource || '').split(',');
      if (!origins.includes('ACTIVE_ENROLLMENT')) return false;

      // Exclude processes whose resolution action results in the student's current status
      const currentStatus = s.status || 'active';
      if (currentStatus === 'graduated' && p.resolutionAction === 'GRADUATE_STUDENT') {
        return false;
      }
      if (currentStatus === 'active' && p.resolutionAction === 'PROMOTE_TO_ENROLLED') {
        return false;
      }
      return true;
    });
  };

  const promptDeleteStudent = (student: StudentItem) => {
    if (!isOwner) {
      toast.error('Solo el propietario principal (Owner) del colegio puede eliminar alumnos.');
      return;
    }
    setDeleteConfirmationInput('');
    setHasCopiedDeleteName(false);
    setStudentToDelete(student);
  };

  const handleCopyDeleteName = () => {
    if (!studentToDelete) return;
    const upper = studentToDelete.full_name.toUpperCase();
    navigator.clipboard.writeText(upper);
    setHasCopiedDeleteName(true);
    toast.success('Nombre copiado al portapapeles');
    setTimeout(() => setHasCopiedDeleteName(false), 2000);
  };

  const executeDeleteStudent = async () => {
    if (!studentToDelete) return;
    if (deleteConfirmationInput.trim() !== studentToDelete.full_name.trim().toUpperCase()) {
      toast.error('El nombre ingresado no coincide exactamente en mayúsculas.');
      return;
    }
    setIsDeletingStudent(true);
    try {
      await deleteStudent(studentToDelete.id);
      toast.success(`Expediente de ${studentToDelete.full_name} eliminado correctamente.`);
      setStudentToDelete(null);
      setDeleteConfirmationInput('');
      fetchList();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el estudiante');
    } finally {
      setIsDeletingStudent(false);
    }
  };

  // Waitlist Handlers
  const handleOpenCreateWaitlist = () => {
    setSelectedWaitlistEntry(null);
    setWaitlistDrawerOpen(true);
  };

  const handleOpenEditWaitlist = (entry: WaitlistEntry) => {
    setSelectedWaitlistEntry(entry);
    setWaitlistDrawerOpen(true);
  };

  const handleOpenStartAdmission = (entry: WaitlistEntry) => {
    setWaitlistEntryForAdmission(entry);
    setStartAdmissionDrawerOpen(true);
  };

  const handleDeleteWaitlist = async (id: string, name: string) => {
    const ok = await confirm({
      title: '¿Eliminar registro de lista de espera?',
      description: `¿Estás seguro de eliminar la postulación de "${name}" de la lista de espera?`,
      confirmText: 'Sí, eliminar',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteWaitlistEntry(id);
      toast.success('Registro eliminado de la lista de espera');
      fetchWaitlistOnly();
    } catch (err: any) {
      toast.error('Error al eliminar de lista de espera');
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

  const getDaysWaiting = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Filtered Students
  const filteredStudents = students.filter(s => {
    // Status filter
    if (s.status !== statusFilter) return false;

    // 1. If Tutor, ONLY show student if linked to this tutor
    if (isTutor) {
      const isMyChild = s.tutors?.some((t: any) => 
        (user?.id && t.tutor?.id === user.id) ||
        (userEmail && t.tutor?.email?.toLowerCase() === userEmail.toLowerCase())
      );
      if (!isMyChild) return false;
    }

    // 2. If Teacher/Staff without global permission, ONLY show students belonging to their assigned salon(s)
    if (isTeacherOrStaff && !hasGlobalStudentsPermission) {
      const envId = s.environment_id || s.environment?.id;
      if (!envId || !teacherEnvIds.includes(envId)) return false;
    }

    // Environment filter (only when search is not active)
    if (selectedStudentEnvIds.length > 0 && !isStudentSearchExpanded && !search) {
      const envId = s.environment_id || s.environment?.id;
      if (!envId || !selectedStudentEnvIds.includes(envId)) return false;
    }
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = s.full_name.toLowerCase().includes(q);
      const matchCode = (s.enrollment_code || '').toLowerCase().includes(q);
      const matchCurp = (s.national_id || '').toLowerCase().includes(q);
      const matchEnv = (s.environment?.name || '').toLowerCase().includes(q);
      const matchSchool = (s.previous_school || '').toLowerCase().includes(q);
      const matchMethodology = (s.previous_methodology || '').toLowerCase().includes(q);
      const matchAllergies = (s.allergies || '').toLowerCase().includes(q);
      const matchFoodAllergies = (s.food_allergies || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCurp && !matchEnv && !matchSchool && !matchMethodology && !matchAllergies && !matchFoodAllergies) return false;
    }
    return true;
  });

  // Filtered Waitlist
  const filteredWaitlist = waitlistEntries.filter(w => {
    // Environment filter (only when search is not active)
    if (selectedWaitlistEnvIds.length > 0 && !isWaitlistSearchExpanded && !waitlistSearch) {
      const hasMatchingEnv = w.target_environment_ids?.some(id => selectedWaitlistEnvIds.includes(id));
      if (!hasMatchingEnv) return false;
    }
    // Status filter
    if (selectedWaitlistStatuses.length > 0) {
      if (!selectedWaitlistStatuses.includes(w.status)) return false;
    }
    // Search filter
    if (waitlistSearch.trim()) {
      const q = waitlistSearch.toLowerCase();
      const matchName = w.child_name.toLowerCase().includes(q);
      const matchParent = w.parent_name.toLowerCase().includes(q);
      const matchPhone = (w.parent_phone || '').toLowerCase().includes(q);
      const matchEmail = (w.parent_email || '').toLowerCase().includes(q);
      const matchNotes = (w.notes || '').toLowerCase().includes(q);
      const matchSchool = (w.previous_school || '').toLowerCase().includes(q);
      const matchMethodology = (w.previous_methodology || '').toLowerCase().includes(q);
      if (!matchName && !matchParent && !matchPhone && !matchEmail && !matchNotes && !matchSchool && !matchMethodology) return false;
    }
    return true;
  });

  const activeWaitingCount = waitlistEntries.filter(w => w.status === 'WAITING').length;
  const inAdmissionCount = waitlistEntries.filter(w => w.status === 'IN_ADMISSION').length;
  const enrolledFromWaitlistCount = waitlistEntries.filter(w => w.status === 'ENROLLED').length;

  // Age Groups for Accordion View
  const ageGroups = useMemo(() => {
    const groups: {
      id: string;
      label: string;
      description: string;
      badgeColor: string;
      students: StudentItem[];
    }[] = [
      {
        id: 'nido',
        label: 'Nido & Bebés (0 a 18 meses)',
        description: 'Lactantes y primeros pasos (0 a 1.5 años)',
        badgeColor: '#0284c7',
        students: []
      },
      {
        id: 'comunidad',
        label: 'Comunidad Infantil (18 meses a 3 años)',
        description: 'Caminantes y desarrollo del lenguaje (1.5 a 3 años)',
        badgeColor: '#059669',
        students: []
      },
      {
        id: 'casa',
        label: 'Casa de Niños (3 a 6 años)',
        description: 'Preescolar Montessori, vida práctica y sensorial (3 a 6 años)',
        badgeColor: '#d97706',
        students: []
      },
      {
        id: 'taller1',
        label: 'Taller 1 (6 a 9 años)',
        description: 'Primaria baja, mente razonadora (6 a 9 años)',
        badgeColor: '#7c3aed',
        students: []
      },
      {
        id: 'taller2',
        label: 'Taller 2 (9 a 12 años)',
        description: 'Primaria alta, visión cósmica y abstracción (9 a 12 años)',
        badgeColor: '#db2777',
        students: []
      },
      {
        id: 'secundaria',
        label: 'Comunidad de Adolescentes (12+ años)',
        description: 'Secundaria y plan de vida (12 años en adelante)',
        badgeColor: '#4b5563',
        students: []
      },
      {
        id: 'unspecified',
        label: 'Sin Fecha de Nacimiento Registrada',
        description: 'Expedientes pendientes de registrar fecha de nacimiento',
        badgeColor: '#9ca3af',
        students: []
      }
    ];

    filteredStudents.forEach((student) => {
      const months = getAgeInMonths(student.date_of_birth);
      if (months === null) {
        groups[6].students.push(student);
      } else if (months < 18) {
        groups[0].students.push(student);
      } else if (months < 36) {
        groups[1].students.push(student);
      } else if (months < 72) {
        groups[2].students.push(student);
      } else if (months < 108) {
        groups[3].students.push(student);
      } else if (months < 144) {
        groups[4].students.push(student);
      } else {
        groups[5].students.push(student);
      }
    });

    return groups;
  }, [filteredStudents]);

  // Students Pagination Slicing
  const totalStudentsPages = Math.max(1, Math.ceil(filteredStudents.length / studentsPageSize));
  const validStudentsPage = Math.min(studentsPage, totalStudentsPages);
  const paginatedStudents = useMemo(() => {
    const start = (validStudentsPage - 1) * studentsPageSize;
    return filteredStudents.slice(start, start + studentsPageSize);
  }, [filteredStudents, validStudentsPage, studentsPageSize]);

  // Waitlist Pagination Slicing
  const totalWaitlistPages = Math.max(1, Math.ceil(filteredWaitlist.length / waitlistPageSize));
  const validWaitlistPage = Math.min(waitlistPage, totalWaitlistPages);
  const paginatedWaitlist = useMemo(() => {
    const start = (validWaitlistPage - 1) * waitlistPageSize;
    return filteredWaitlist.slice(start, start + waitlistPageSize);
  }, [filteredWaitlist, validWaitlistPage, waitlistPageSize]);

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-background">
      
      {/* 1. FIXED TOP AREA: HERO BANNER + FILTER TOOLBAR */}
      <div className="shrink-0 z-10">
        {/* FULL-WIDTH GREEN HERO BANNER */}
        <div className="bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-5 text-white shadow-md relative overflow-hidden border-b border-forest-light/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white leading-tight">
                {isTutor
                  ? 'Mis Hijos (Estudiantes)'
                  : statusFilter === 'graduated'
                  ? 'Alumnos Graduados'
                  : 'Matrícula Activa'}
              </h1>
              {!isTutor && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25 shadow-2xs">
                  {statusStudents.length} {statusFilter === 'graduated' ? 'graduados' : 'matriculados'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="px-4 sm:px-6 md:px-8 py-2.5 bg-white/70 backdrop-blur-md border-b border-forest/10">
          <div className="flex items-center justify-between gap-2.5 sm:gap-3">
            {/* Left Side: Search Input (when active) OR Search Trigger + Multiselect Choice Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isStudentSearchExpanded || search.length > 0 ? (
                /* Expanded Full-Row Search Input */
                <div className="w-full bg-white rounded-2xl p-2 px-3.5 flex items-center gap-3 border border-forest/15 shadow-xs animate-in fade-in zoom-in-98 duration-200">
                  <Search className="w-4 h-4 text-forest shrink-0" />
                  <input 
                    ref={studentSearchInputRef}
                    type="text" 
                    autoFocus
                    placeholder="Buscar por nombre, matrícula, CURP, salón, escuela previa o notas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearch('');
                        setIsStudentSearchExpanded(false);
                      }
                    }}
                    className="w-full bg-transparent text-xs text-forest focus:outline-none placeholder:text-muted-foreground font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setIsStudentSearchExpanded(false);
                    }}
                    className="p-1 text-muted-foreground hover:text-forest hover:bg-forest/10 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Cerrar búsqueda (Esc)"
                  >
                    <span className="text-[10px] hidden sm:inline font-mono opacity-60">Esc</span>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Search Icon-Only Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsStudentSearchExpanded(true);
                      setTimeout(() => studentSearchInputRef.current?.focus(), 50);
                    }}
                    className="p-2.5 rounded-2xl bg-white hover:bg-forest/5 text-forest border border-forest/15 transition-all flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 shrink-0"
                    title="Buscar alumnos..."
                  >
                    <Search className="w-4 h-4 text-forest" />
                  </button>

                  {/* Multiselect Environment Choice Dropdown */}
                  <div className="relative shrink-0" ref={studentEnvDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setStudentEnvDropdownOpen(!studentEnvDropdownOpen)}
                      className={`px-3 sm:px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs ${
                        selectedStudentEnvIds.length > 0
                          ? 'bg-forest text-white border-forest'
                          : 'bg-white text-forest border-forest/15 hover:bg-forest/5'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {selectedStudentEnvIds.length === 0
                          ? 'Todos los salones'
                          : selectedStudentEnvIds.length === 1
                            ? environments.find(e => e.id === selectedStudentEnvIds[0])?.name || '1 salón'
                            : `${selectedStudentEnvIds.length} salones seleccionados`}
                      </span>
                      {selectedStudentEnvIds.length > 0 ? (
                        <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full font-bold">
                          {selectedStudentEnvIds.length}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-forest/10 text-forest px-1.5 py-0.2 rounded-full font-bold">
                          {statusStudents.length}
                        </span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${studentEnvDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Popover */}
                    {studentEnvDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-2xl border border-forest/15 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-foreground">
                        {/* Header / Quick Actions */}
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-forest/10 text-[11px]">
                          <span className="font-bold text-forest">Filtrar por Salón</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentEnvIds([])}
                              className="text-[10px] text-forest/70 hover:text-forest font-semibold transition-colors"
                            >
                              Ver todos
                            </button>
                            {selectedStudentEnvIds.length > 0 && (
                              <>
                                <span className="text-forest/20">•</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentEnvIds([])}
                                  className="text-[10px] text-destructive hover:underline font-semibold"
                                >
                                  Limpiar
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Salons Checkbox List */}
                        <div className="max-h-60 overflow-y-auto no-scrollbar py-1 space-y-0.5">
                          {allowedEnvironments.map((env) => {
                            const isSelected = selectedStudentEnvIds.includes(env.id);
                            const countForEnv = students.filter(s => (s.environment_id === env.id || s.environment?.id === env.id) && s.status === 'active').length;

                            return (
                              <button
                                key={env.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudentEnvIds(prev =>
                                    prev.includes(env.id)
                                      ? prev.filter(id => id !== env.id)
                                      : [...prev, env.id]
                                  );
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                                  isSelected
                                    ? 'bg-forest/10 text-forest font-bold'
                                    : 'hover:bg-forest/5 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? 'bg-forest border-forest text-white' : 'border-forest/20 bg-white'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: env.color || '#1b3b2b' }} />
                                  <span className="truncate">{env.name}</span>
                                </div>

                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                                  isSelected ? 'bg-forest text-white font-bold' : 'bg-forest/5 text-muted-foreground'
                                }`}>
                                  {countForEnv}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Active Salons Chips */}
                  {selectedStudentEnvIds.length > 0 && (
                    <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
                      {selectedStudentEnvIds.map(envId => {
                        const env = environments.find(e => e.id === envId);
                        if (!env) return null;
                        return (
                          <span
                            key={envId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-white shadow-2xs shrink-0 animate-in fade-in zoom-in-95 duration-150"
                            style={{ backgroundColor: env.color || '#1b3b2b' }}
                          >
                            <span className="truncate max-w-[120px]">{env.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentEnvIds(prev => prev.filter(id => id !== envId))}
                              className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                              title={`Quitar filtro de ${env.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedStudentEnvIds([])}
                        className="text-[11px] text-muted-foreground hover:text-destructive font-semibold px-1.5 py-0.5 rounded-lg transition-colors shrink-0"
                      >
                        Borrar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Side: View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-forest/15 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-forest text-white shadow-2xs'
                    : 'text-forest/70 hover:bg-forest/5 hover:text-forest'
                }`}
                title="Vista en Lista"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-forest text-white shadow-2xs'
                    : 'text-forest/70 hover:bg-forest/5 hover:text-forest'
                }`}
                title="Vista en Cuadrícula (Cards)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('by_age')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'by_age'
                    ? 'bg-forest text-white shadow-2xs'
                    : 'text-forest/70 hover:bg-forest/5 hover:text-forest'
                }`}
                title="Vista por Grupos de Edad (Acordeón)"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Por Edad</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE STUDENTS AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 md:px-8 py-3 space-y-3">
        {/* Students Content Area */}
        {loading ? (
          viewMode === 'grid' ? (
            <StudentGridSkeleton />
          ) : viewMode === 'by_age' ? (
            <StudentAgeSkeleton />
          ) : (
            <StudentListSkeleton />
          )
        ) : !hasGlobalStudentsPermission && isTeacherOrStaff && teacherEnvIds.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3 max-w-xl mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-forest font-display">Sin Salones Asignados</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No tienes salones asignados a tu cargo para visualizar alumnos en matrícula activa. Contacta a un administrador para que te vincule a un salón o te otorgue permisos globales.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3 max-w-xl mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto">
                <Users className="w-7 h-7 text-forest/40" />
              </div>
              <h3 className="text-base font-bold text-forest">No hay alumnos en matrícula activa</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {canAccessAdmissions
                  ? 'Los alumnos ingresan a la matrícula formal tras completar su ciclo en el Proceso de Admisión. Registra primero a tus aspirantes en la lista de espera para iniciar su expediente.'
                  : 'No se encontraron alumnos registrados en este salón o con el criterio de búsqueda seleccionado.'}
              </p>
              {canAccessAdmissions && (
                <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                  <button
                    onClick={() => navigate('/panel/admissions')}
                    className="px-5 py-2.5 bg-forest text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer"
                  >
                    <Workflow className="w-4 h-4" /> Ver Tablero de Admisiones
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === 'by_age' ? (
            /* VISTA 3: POR EDAD (ACCORDION DE RANGOS CON CÍRCULOS) */
            <div className="space-y-4 animate-in fade-in duration-200">
              {ageGroups.map((group) => {
                const isOpen = openAgeAccordion[group.id] ?? true;
                const count = group.students.length;

                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-3xl border border-forest/10 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleAgeAccordion(group.id)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-forest/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: group.badgeColor }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-forest text-sm font-display leading-tight">
                              {group.label}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/5 text-forest border border-forest/10">
                              {count} {count === 1 ? 'alumno' : 'alumnos'}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {group.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-1.5 rounded-xl bg-forest/5 text-forest/70 shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Accordion Content: Student Circles */}
                    {isOpen && (
                      <div className="p-4 sm:p-6 pt-2 border-t border-forest/5 bg-forest/[0.01]">
                        {count === 0 ? (
                          <div className="py-6 text-center text-xs text-muted-foreground italic">
                            No hay alumnos en este rango de edad con los filtros actuales.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 sm:gap-6">
                            {group.students.map((student) => {
                              const env = student.environment;
                              const studentAge = calculateAge(student.date_of_birth);

                              return (
                                <div
                                  key={student.id}
                                  onClick={() => handleOpenEdit(student)}
                                  className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl bg-white border border-forest/10 hover:border-forest/30 shadow-2xs hover:shadow-md hover:scale-105 transition-all cursor-pointer group"
                                >
                                  {/* Circle Avatar */}
                                  <div
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 flex items-center justify-center font-bold text-lg font-display text-forest overflow-hidden bg-forest/5 shrink-0 shadow-sm group-hover:rotate-2 transition-transform"
                                    style={{ borderColor: env?.color || '#1b3b2b' }}
                                  >
                                    {student.avatar_url ? (
                                      <img
                                        src={student.avatar_url}
                                        alt={student.full_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{student.full_name.charAt(0)}</span>
                                    )}
                                  </div>

                                  {/* Name */}
                                  <h5 className="font-bold text-forest text-xs mt-3 truncate max-w-full leading-tight">
                                    {student.full_name}
                                  </h5>

                                  {/* Age */}
                                  <span className="text-[10px] text-muted-foreground font-semibold mt-1 block truncate max-w-full">
                                    {studentAge || 'Edad no reg.'}
                                  </span>

                                  {/* Salon tag */}
                                  <span
                                    className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full mt-2 truncate max-w-full shadow-2xs"
                                    style={{ backgroundColor: env?.color || '#1b3b2b' }}
                                  >
                                    {env?.name || 'Sin Salón'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'grid' ? (
            /* VISTA 2: GRID (3 COLUMNAS MÁXIMO, 2 EN TABLET, 1 EN MÓVIL) */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {paginatedStudents.map((s) => {
                  const env = s.environment;
                  const tutorsCount = s.tutors?.length || 0;
                  let authContacts: any[] = [];
                  try {
                    if (typeof s.authorized_contacts === 'string') {
                      authContacts = JSON.parse(s.authorized_contacts || '[]');
                    } else if (Array.isArray(s.authorized_contacts)) {
                      authContacts = s.authorized_contacts;
                    }
                  } catch {
                    authContacts = [];
                  }
                  const pickupCount = authContacts.filter((c) => c.canPickup).length;
                  const studentAge = calculateAge(s.date_of_birth);

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleOpenEdit(s)}
                      className="bg-white rounded-3xl border border-forest/10 shadow-xs hover:border-forest/30 hover:shadow-md transition-all cursor-pointer flex flex-col group"
                    >
                      {/* Top Header Banner with Student Photo as Background */}
                      <div className="h-44 sm:h-48 relative p-4 flex items-start justify-between overflow-hidden bg-slate-100 border-b border-forest/5 rounded-t-3xl">
                        {s.avatar_url ? (
                          <>
                            <img
                              src={s.avatar_url}
                              alt={s.full_name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Gradient Overlay for Legibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/30 pointer-events-none" />
                          </>
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center font-display font-black text-4xl sm:text-5xl text-white/90 select-none shadow-inner"
                            style={{
                              background: env?.color
                                ? `linear-gradient(135deg, ${env.color} 0%, #1b3b2b 100%)`
                                : 'linear-gradient(135deg, #1b3b2b 0%, #2c5942 100%)'
                            }}
                          >
                            <span className="tracking-wider drop-shadow-md">
                              {s.full_name
                                ? s.full_name.trim().split(/\s+/).filter(Boolean).length === 1
                                  ? s.full_name.trim().substring(0, 2).toUpperCase()
                                  : (s.full_name.trim().split(/\s+/)[0][0] + s.full_name.trim().split(/\s+/)[1][0]).toUpperCase()
                                : 'CE'}
                            </span>
                          </div>
                        )}

                        {/* Top Left Badges: Salón & Code */}
                        <div className="flex flex-col items-start gap-1.5 z-10">
                          {env ? (
                            <span
                              className="text-[10px] font-bold text-white px-2.5 py-1 rounded-xl shadow-md backdrop-blur-md flex items-center gap-1.5"
                              style={{ backgroundColor: env.color || '#1b3b2b' }}
                            >
                              <Layers className="w-3 h-3" />
                              <span>{env.name}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20">
                              Sin Salón
                            </span>
                          )}

                          {s.enrollment_code && (
                            <span className="text-[10px] font-mono font-bold text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20 shadow-xs">
                              {s.enrollment_code}
                            </span>
                          )}
                        </div>

                        {/* Top Right: Status Badge & Age */}
                        <div className="flex flex-col items-end gap-1.5 z-10">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-md backdrop-blur-md border ${
                              s.status === 'active'
                                ? 'bg-emerald-500/90 text-white border-emerald-400/30'
                                : 'bg-slate-700/90 text-white border-slate-500/30'
                            }`}
                          >
                            {s.status === 'active' ? 'Matriculado' : s.status}
                          </span>

                          <span className="text-[10px] font-bold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/20 shadow-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{studentAge || 'Edad N/D'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-forest text-base leading-tight group-hover:text-forest-light transition-colors line-clamp-1">
                              {s.full_name}
                            </h4>
                          </div>

                          {/* Quick Details Subtext */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap font-medium">
                            {s.national_id && (
                              <span className="font-mono text-[11px] bg-forest/5 px-2 py-0.5 rounded-md">
                                CURP: {s.national_id}
                              </span>
                            )}
                            {s.previous_school && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[180px]">Prev: {s.previous_school}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Tutors & Badges */}
                        <div className="space-y-2 pt-2 border-t border-forest/5">
                          {tutorsCount > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="w-3.5 h-3.5 text-forest" />
                              <span className="truncate text-[11px]">
                                {s.tutors && s.tutors[0]?.tutor?.full_name
                                  ? s.tutors[0].tutor.full_name
                                  : `${tutorsCount} Tutores`}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {s.blood_type && (
                              <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-lg border border-red-100 text-[10px]">
                                🩸 {s.blood_type}
                              </span>
                            )}
                            {pickupCount > 0 && (
                              <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-lg border border-emerald-200 text-[10px]">
                                🚗 {pickupCount} pickup
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons Footer */}
                        <div
                          className="pt-3 border-t border-forest/10 flex items-center justify-between gap-1 relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-xs text-muted-foreground font-semibold">
                            {s.environment_name || 'Sin salón asignado'}
                          </div>

                          {/* Dropdown Menu Container */}
                          <div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-[0.95]"
                                  title="Acciones"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                onClick={(e) => e.stopPropagation()}
                                className="w-64 bg-white border border-forest/15 rounded-2xl shadow-xl p-1.5 z-[60] text-foreground space-y-1"
                              >
                                {statusFilter === 'graduated' ? (
                                  <div>
                                    <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      Expediente Graduado
                                    </DropdownMenuLabel>
                                    <div className="space-y-0.5">
                                      <DropdownMenuItem
                                        onClick={() => handleOpenEdit(s)}
                                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Ver Expediente Histórico</span>
                                      </DropdownMenuItem>

                                      {isOwner && (
                                        <DropdownMenuItem
                                          onClick={() => promptDeleteStudent(s)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                          <span>Eliminar Alumno</span>
                                        </DropdownMenuItem>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {/* GRUPO 1: REPORTES */}
                                    {!isTutor && (
                                      <div>
                                        <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                          Reportes & Seguimiento
                                        </DropdownMenuLabel>
                                        <div className="space-y-0.5">
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setMatrixStudent(s);
                                              setMatrixDrawerOpen(true);
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                          >
                                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Caracterización 360°</span>
                                          </DropdownMenuItem>

                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEvolutionStudent(s);
                                              setEvolutionDrawerOpen(true);
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                          >
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Cronología de Evaluaciones</span>
                                          </DropdownMenuItem>

                                          <DropdownMenuItem
                                            onClick={() => {
                                              setReportStudentId(s.id);
                                              setReportDrawerOpen(true);
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Reporte PDF</span>
                                          </DropdownMenuItem>
                                        </div>
                                      </div>
                                    )}

                                    {/* GRUPO 2: FINANZAS */}
                                    {canViewFinances && (
                                      <>
                                        {!isTutor && <DropdownMenuSeparator className="my-1 bg-forest/10" />}
                                        <div>
                                          <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Finanzas
                                          </DropdownMenuLabel>
                                          <div className="space-y-0.5">
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setFinancesStudent(s);
                                                setFinancesDrawerOpen(true);
                                              }}
                                              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>Estado de Cuenta & Cuotas</span>
                                            </DropdownMenuItem>
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {/* GRUPO 3: PROCESOS */}
                                    {!isTutor && getStartableProcessesForStudent(s).length > 0 && (
                                      <>
                                        <DropdownMenuSeparator className="my-1 bg-forest/10" />
                                        <div>
                                          <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-forest/[0.02] rounded-lg">
                                            Procesos
                                          </DropdownMenuLabel>
                                          <div className="space-y-0.5">
                                            {getStartableProcessesForStudent(s).map(proc => (
                                              <DropdownMenuItem
                                                key={proc.id}
                                                onClick={() => handleStartStudentProcess(s, proc)}
                                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                              >
                                                <Workflow className="w-3.5 h-3.5 text-forest/70 animate-pulse" />
                                                <span className="truncate">{proc.label || proc.name}</span>
                                              </DropdownMenuItem>
                                            ))}
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {/* GRUPO 4: GESTIÓN DE EXPEDIENTE */}
                                    <DropdownMenuSeparator className="my-1 bg-forest/10" />
                                    <div>
                                      <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Gestión de Expediente
                                      </DropdownMenuLabel>
                                      <div className="space-y-0.5">
                                        <DropdownMenuItem
                                          onClick={() => handleOpenEdit(s)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-800 hover:bg-amber-50 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                                          <span>{isTutor ? "Ver / Editar Ficha" : "Editar Expediente"}</span>
                                        </DropdownMenuItem>

                                        {isOwner && (
                                          <DropdownMenuItem
                                            onClick={() => promptDeleteStudent(s)}
                                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                            <span>Eliminar Alumno</span>
                                          </DropdownMenuItem>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VISTA 1: LISTA TRADICIONAL */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-3">
                {paginatedStudents.map(s => {
                  const env = s.environment;
                  const tutorsCount = s.tutors?.length || 0;
                  let authContacts: any[] = [];
                  try {
                    if (typeof s.authorized_contacts === 'string') {
                      authContacts = JSON.parse(s.authorized_contacts || '[]');
                    } else if (Array.isArray(s.authorized_contacts)) {
                      authContacts = s.authorized_contacts;
                    }
                  } catch {
                    authContacts = [];
                  }
                  const pickupCount = authContacts.filter(c => c.canPickup).length;
                  const studentAge = s.date_of_birth ? calculateAge(s.date_of_birth) : null;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleOpenEdit(s)}
                      className="bg-white rounded-2xl p-3.5 sm:p-4 border border-forest/10 shadow-2xs hover:border-forest/30 hover:shadow-xs transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-3.5 relative"
                    >
                      {/* Left Color Accent Bar */}
                      <div 
                        className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl"
                        style={{ backgroundColor: env?.color || '#1b3b2b' }}
                      />

                      {/* Left Section: Avatar, Name, Environment, Code, Age */}
                      <div className="flex items-center gap-3 min-w-0 pl-1.5">
                        <div
                          className="w-11 h-11 rounded-2xl overflow-hidden bg-forest/5 border-2 flex items-center justify-center font-bold text-base font-display text-forest shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                          style={{ borderColor: env?.color || '#1b3b2b' }}
                        >
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{s.full_name.charAt(0)}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-forest text-sm truncate group-hover:text-forest-light transition-colors">
                              {s.full_name}
                            </h4>
                            {env ? (
                              <span
                                className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-2xs"
                                style={{ backgroundColor: env.color || '#1b3b2b' }}
                              >
                                {env.name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground bg-forest/5 px-2 py-0.5 rounded-md">
                                Sin Salón
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            {s.enrollment_code && (
                              <span className="font-mono text-[11px] font-semibold text-forest/70">
                                {s.enrollment_code}
                              </span>
                            )}
                            {studentAge && (
                              <>
                                <span>•</span>
                                <span>{studentAge}</span>
                              </>
                            )}
                            {s.national_id && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[11px]">CURP: {s.national_id}</span>
                              </>
                            )}
                            {s.previous_school && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[180px]">Escuela previa: {s.previous_school}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Section: Tutors & Medical/Consents Badges */}
                      <div className="flex items-center gap-2.5 flex-wrap md:justify-end pl-1.5 md:pl-0">
                        {/* Tutors Stack */}
                        {tutorsCount > 0 && (
                          <div className="flex items-center gap-1.5 bg-forest/5 px-2.5 py-1 rounded-xl text-xs text-forest shrink-0">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {(s.tutors || []).slice(0, 2).map((t, tidx) => {
                                const tut = t.tutor;
                                const photo = tut?.avatar_url;
                                return (
                                  <div
                                    key={t.id || tidx}
                                    className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-forest/10 text-forest text-[9px] font-bold overflow-hidden flex items-center justify-center shrink-0"
                                    title={tut?.full_name || tut?.email}
                                  >
                                    {photo ? (
                                      <img src={photo} alt={tut?.full_name} className="h-full w-full object-cover" />
                                    ) : (
                                      <span>{(tut?.full_name || tut?.email || 'T').charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <span className="font-semibold text-[11px] truncate max-w-[120px]">
                              {s.tutors && s.tutors[0]?.tutor?.full_name ? s.tutors[0].tutor.full_name : `${tutorsCount} Tutores`}
                            </span>
                          </div>
                        )}

                        {/* Medical & Pickup badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.blood_type && (
                            <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-lg border border-red-100 text-[10px]">
                              🩸 {s.blood_type}
                            </span>
                          )}
                          {(() => {
                            try {
                              const parsed = s.food_allergies ? JSON.parse(s.food_allergies) : [];
                              if (Array.isArray(parsed) && parsed.length > 0) {
                                return (
                                  <span
                                    className="bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded-lg border border-rose-200 text-[10px] inline-flex items-center gap-1"
                                    title={parsed.map((a: any) => a.name).join(', ')}
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-700" />
                                    <span>{parsed.length} alim.</span>
                                  </span>
                                );
                              }
                            } catch {}
                            return null;
                          })()}
                          {(() => {
                            try {
                              const parsed = s.consents ? JSON.parse(s.consents) : [];
                              if (Array.isArray(parsed)) {
                                const mediaConsent = parsed.find((c: any) => c.templateId?.includes('media'));
                                if (mediaConsent !== undefined) {
                                  return (
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                        mediaConsent.granted
                                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                                          : 'bg-gray-100 text-gray-700 border-gray-200'
                                      }`}
                                      title={mediaConsent.granted ? 'Fotos autorizadas en redes' : 'Sin autorización de fotos'}
                                    >
                                      📷 {mediaConsent.granted ? 'Fotos ✓' : 'Fotos ✕'}
                                    </span>
                                  );
                                }
                              }
                            } catch {}
                            return null;
                          })()}
                          {pickupCount > 0 && (
                            <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-lg border border-emerald-200 text-[10px]">
                              🚗 {pickupCount} pickup
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Section: Status & Quick Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-2xs border ${
                            s.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {s.status === 'active' ? 'Matriculado' : s.status}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-[0.95]"
                              title="Acciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                            className="w-64 bg-white border border-forest/15 rounded-2xl shadow-xl p-1.5 z-[60] text-foreground space-y-1"
                          >
                            {statusFilter === 'graduated' ? (
                              <div>
                                <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Expediente Graduado
                                </DropdownMenuLabel>
                                <div className="space-y-0.5">
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEdit(s)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Ver Expediente Histórico</span>
                                  </DropdownMenuItem>

                                  {isOwner && (
                                    <DropdownMenuItem
                                      onClick={() => promptDeleteStudent(s)}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Eliminar Alumno</span>
                                    </DropdownMenuItem>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* GRUPO 1: REPORTES */}
                                {!isTutor && (
                                  <div>
                                    <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      Reportes & Seguimiento
                                    </DropdownMenuLabel>
                                    <div className="space-y-0.5">
                                      {statusFilter !== 'graduated' && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setMatrixStudent(s);
                                            setMatrixDrawerOpen(true);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Caracterización 360°</span>
                                        </DropdownMenuItem>
                                      )}

                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEvolutionStudent(s);
                                          setEvolutionDrawerOpen(true);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                      >
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Cronología de Evaluaciones</span>
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={() => {
                                          setReportStudentId(s.id);
                                          setReportDrawerOpen(true);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Reporte PDF</span>
                                      </DropdownMenuItem>
                                    </div>
                                  </div>
                                )}

                                {/* GRUPO 2: FINANZAS */}
                                {canViewFinances && (
                                  <>
                                    {!isTutor && <DropdownMenuSeparator className="my-1 bg-forest/10" />}
                                    <div>
                                      <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Finanzas
                                      </DropdownMenuLabel>
                                      <div className="space-y-0.5">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setFinancesStudent(s);
                                            setFinancesDrawerOpen(true);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Estado de Cuenta & Cuotas</span>
                                        </DropdownMenuItem>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* GRUPO 3: PROCESOS */}
                                {!isTutor && getStartableProcessesForStudent(s).length > 0 && (
                                  <>
                                    <DropdownMenuSeparator className="my-1 bg-forest/10" />
                                    <div>
                                      <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-forest/[0.02] rounded-lg">
                                        Procesos
                                      </DropdownMenuLabel>
                                      <div className="space-y-0.5">
                                        {getStartableProcessesForStudent(s).map(proc => (
                                          <DropdownMenuItem
                                            key={proc.id}
                                            onClick={() => handleStartStudentProcess(s, proc)}
                                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-forest hover:bg-forest/5 transition-all flex items-center gap-2 cursor-pointer"
                                          >
                                            <Workflow className="w-3.5 h-3.5 text-forest/70 animate-pulse" />
                                            <span className="truncate">{proc.label || proc.name}</span>
                                          </DropdownMenuItem>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* GRUPO 4: GESTIÓN DE EXPEDIENTE */}
                                <DropdownMenuSeparator className="my-1 bg-forest/10" />
                                <div>
                                  <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Gestión de Expediente
                                  </DropdownMenuLabel>
                                  <div className="space-y-0.5">
                                    <DropdownMenuItem
                                      onClick={() => handleOpenEdit(s)}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-800 hover:bg-amber-50 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-slate-500" />
                                      <span>{isTutor ? "Ver / Editar Ficha" : "Ver / Editar Expediente"}</span>
                                    </DropdownMenuItem>

                                    {isOwner && (
                                      <DropdownMenuItem
                                        onClick={() => promptDeleteStudent(s)}
                                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Eliminar Alumno</span>
                                      </DropdownMenuItem>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* 3. FIXED FOOTER WITH PAGINATION */}
      <div className="shrink-0 px-4 sm:px-6 md:px-8 py-2 bg-white/95 backdrop-blur-md border-t border-forest/10 z-10 shadow-2xs">
        <PaginationControl
          currentPage={validStudentsPage}
          pageSize={studentsPageSize}
          totalItems={filteredStudents.length}
          totalPages={totalStudentsPages}
          onPageChange={setStudentsPage}
          onPageSizeChange={setStudentsPageSize}
          itemLabel={statusFilter === 'graduated' ? 'graduados' : 'alumnos'}
        />
      </div>

      {/* Pro Max Student Drawer (Aside Panel) */}
      <StudentDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        student={selectedStudent}
        environments={environments}
        onSaved={fetchList}
      />

      {/* Progress Report Drawer (PDF) */}
      <StudentProgressReportDrawer
        isOpen={reportDrawerOpen}
        onClose={() => setReportDrawerOpen(false)}
        studentId={reportStudentId}
        studentsList={students}
      />

      {/* Evolution Timeline & Conference Reports Drawer */}
      <StudentEvolutionTimelineDrawer
        isOpen={evolutionDrawerOpen}
        onClose={() => setEvolutionDrawerOpen(false)}
        student={evolutionStudent}
      />

      {/* 360° Characterization Matrix Drawer */}
      <StudentCharacterizationMatrixDrawer
        isOpen={matrixDrawerOpen}
        onClose={() => setMatrixDrawerOpen(false)}
        student={matrixStudent}
        refreshTrigger={matrixRefreshTrigger}
        onOpenCreate={(stu) => {
          setCharFormStudent(stu);
          setCharEditingItem(null);
          setCharFormDrawerOpen(true);
        }}
        onOpenEdit={(entry) => {
          setCharFormStudent(matrixStudent);
          setCharEditingItem(entry);
          setCharFormDrawerOpen(true);
        }}
      />

      {/* 360° Characterization Form Drawer */}
      <CharacterizationFormDrawer
        isOpen={charFormDrawerOpen}
        onClose={() => setCharFormDrawerOpen(false)}
        student={charFormStudent}
        initialData={charEditingItem}
        onSaved={() => {
          setCharFormDrawerOpen(false);
          setMatrixRefreshTrigger(prev => prev + 1);
          fetchList();
        }}
      />

      {/* Student Finances / Installments Drawer */}
      <InstallmentsManagerDrawer
        isOpen={financesDrawerOpen}
        onClose={() => setFinancesDrawerOpen(false)}
        student={financesStudent}
        onPaymentRecorded={() => fetchList()}
        readOnly={!canManageFinances}
      />

      {/* Owner-Only Student Deletion Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Header Banner */}
            <div className="bg-rose-50/90 border-b border-rose-100 px-6 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
                    <span>Eliminar Alumno</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-200/70 px-2 py-0.5 rounded-full">
                      Acción Crítica
                    </span>
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold mt-0.5 truncate">
                    Acción restringida exclusivamente para Owners
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStudentToDelete(null);
                  setDeleteConfirmationInput('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-rose-100/60 rounded-full transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">

              <div className="mt-4 p-3.5 bg-rose-50/60 border border-rose-200/60 rounded-2xl text-xs text-slate-700 space-y-1.5">
                <p className="font-semibold text-rose-900">
                  Esta acción es definitiva e irreversible.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Se eliminarán o desvincularán todos los registros asociados a <strong className="text-slate-800">{studentToDelete.full_name}</strong> (asistencias, cuotas, tutores y seguimientos).
                </p>
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Escribe el nombre en <span className="text-rose-600">MAYÚSCULAS</span>:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyDeleteName}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Copiar nombre en mayúsculas"
                  >
                    {hasCopiedDeleteName ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar con un clic</span>
                      </>
                    )}
                  </button>
                </div>

                <div 
                  onClick={handleCopyDeleteName}
                  className="group px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50/60 border border-slate-300 hover:border-rose-300 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                  title="Clic para copiar"
                >
                  <span className="tracking-wider select-all truncate">{studentToDelete.full_name.toUpperCase()}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-rose-600 font-sans font-medium flex items-center gap-1 shrink-0 ml-2">
                    {hasCopiedDeleteName ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    autoFocus
                    value={deleteConfirmationInput}
                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && deleteConfirmationInput.trim() === studentToDelete.full_name.trim().toUpperCase()) {
                        e.preventDefault();
                        executeDeleteStudent();
                      }
                    }}
                    placeholder={`Escribe ${studentToDelete.full_name.toUpperCase()}`}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 focus:bg-white border-2 border-slate-400 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-hidden transition-all uppercase shadow-inner"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setStudentToDelete(null);
                    setDeleteConfirmationInput('');
                  }}
                  disabled={isDeletingStudent}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeDeleteStudent}
                  disabled={deleteConfirmationInput.trim() !== studentToDelete.full_name.trim().toUpperCase() || isDeletingStudent}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isDeletingStudent ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirmar Eliminación</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Process Start Confirmation Modal */}
      {processTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-forest/15 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green gradient accent bar */}
            <div className="h-2 bg-gradient-to-r from-forest via-emerald-500 to-forest w-full" />

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-forest/10 text-forest rounded-2xl shrink-0">
                  <Workflow className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    ¿Iniciar {processTarget.proc.label || processTarget.proc.name}?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vincular estudiante a este flujo de trabajo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProcessTarget(null)}
                  disabled={isStartingProcess}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Estudiante:</span>
                  <span className="font-bold text-slate-800">{processTarget.student.full_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Salón / Entorno:</span>
                  <span className="font-semibold text-slate-700">{processTarget.student.environment_name || 'Sin asignar'}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                  <span className="text-muted-foreground font-medium">Proceso destino:</span>
                  <span className="font-bold text-forest bg-forest/10 px-2.5 py-0.5 rounded-full">
                    {processTarget.proc.label || processTarget.proc.name}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500 leading-relaxed px-1">
                Al confirmar, se creará la solicitud en el pipeline y se te redirigirá a la vista de seguimiento del proceso.
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setProcessTarget(null)}
                  disabled={isStartingProcess}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeStartStudentProcess}
                  disabled={isStartingProcess}
                  className="px-5 py-2 text-xs font-bold text-white bg-forest hover:bg-forest/90 disabled:opacity-50 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isStartingProcess ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Iniciando...</span>
                    </>
                  ) : (
                    <>
                      <Workflow className="w-3.5 h-3.5" />
                      <span>Sí, iniciar proceso</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentsSection;
