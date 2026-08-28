import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  HeartHandshake,
  Search,
  Phone,
  Mail,
  MessageCircle,
  GraduationCap,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Filter,
  Star,
  Car,
  User,
  ExternalLink,
  ChevronDown,
  Edit,
  Save,
  KeyRound,
  Lock,
  Sparkles,
  Check,
  FileText,
  EyeOff,
  Building2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MobileMenuButton, useAdminDashboard } from './AdminDashboard';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { useAuth } from '@/context/AuthContext';
import { 
  TutorUserItem, 
  EnvironmentItem, 
  GuideUserItem,
  getTutors, 
  getEnvironments,
  getGuides,
  updateTutor 
} from '@/lib/sqlite';
import { toast } from 'sonner';

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

const RELATIONSHIP_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  MOTHER: {
    label: 'Madre',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200'
  },
  FATHER: {
    label: 'Padre',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200'
  },
  GUARDIAN: {
    label: 'Tutor Legal',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
  OTHER: {
    label: 'Familiar / Contacto',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200'
  }
};

export const TutorsSection: React.FC = () => {
  const { role, user, userEmail, activeMembership } = useAuth();
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN';
  const isTutor = role === 'TUTOR';
  const isTeacherOrStaff = role === 'TEACHER' || role === 'STAFF';
  const permissions: string[] = (activeMembership as any)?.permissions || [];
  const hasGlobalTutorsPermission = isOwnerOrAdmin || permissions.includes('tutors') || permissions.includes('tutors:read') || permissions.includes('tutors:write');

  const [tutors, setTutors] = useState<TutorUserItem[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [guides, setGuides] = useState<GuideUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState<string>('ALL');
  const [relFilter, setRelFilter] = useState<string>('ALL');

  // Detail & Edit Drawer State
  const [selectedTutor, setSelectedTutor] = useState<TutorUserItem | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStudentLinks, setEditStudentLinks] = useState<{
    id: string;
    studentId: string;
    relationship: string;
    isPrimaryContact: boolean;
    authorizedPickUp: boolean;
    student: any;
  }[]>([]);

  const fetchList = async () => {
    setLoading(true);
    const [tutorsData, envsData, guidesData] = await Promise.all([
      getTutors(),
      getEnvironments(),
      getGuides()
    ]);
    setTutors(tutorsData);
    setEnvironments(envsData);
    setGuides(guidesData);
    setLoading(false);
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
    if (hasGlobalTutorsPermission) return environments.map(e => e.id);
    if (!isTeacherOrStaff) return [];
    const envIdsFromGuide = myGuide?.environments?.map(e => e.id) || [];
    const envIdsFromEnvs = environments
      .filter(env => 
        env.guideIds?.includes(user?.id) ||
        env.guides?.some((g: any) => g.userId === user?.id) ||
        env.teachers?.some(t => 
          (user?.id && t.id === user.id) || 
          (userEmail && t.email?.toLowerCase() === userEmail.toLowerCase()) ||
          (myGuide?.id && t.id === myGuide.id)
        )
      )
      .map(env => env.id);
    return Array.from(new Set([...envIdsFromGuide, ...envIdsFromEnvs]));
  }, [hasGlobalTutorsPermission, isTeacherOrStaff, myGuide, environments, user, userEmail]);

  // Find children of current tutor if role is TUTOR
  const myTutorRecord = useMemo(() => {
    if (!isTutor) return null;
    return tutors.find(t => 
      (user?.id && t.id === user.id) || 
      (userEmail && t.email?.toLowerCase() === userEmail.toLowerCase())
    );
  }, [tutors, isTutor, user, userEmail]);

  const myChildrenStudentIds = useMemo(() => {
    if (!isTutor) return [];
    return (myTutorRecord?.studentLinks || []).map(l => l.student?.id).filter(Boolean);
  }, [isTutor, myTutorRecord]);

  const visibleEnvironments = useMemo(() => {
    if (isTeacherOrStaff) {
      if (teacherEnvIds.length === 0) return [];
      return environments.filter(e => teacherEnvIds.includes(e.id));
    }
    return environments;
  }, [environments, isTeacherOrStaff, teacherEnvIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tutors.filter(t => {
      // 1. If TUTOR, only show parents of the tutor's children (self + co-parent)
      if (isTutor) {
        const isMe = (user?.id && t.id === user.id) || (userEmail && t.email?.toLowerCase() === userEmail.toLowerCase());
        const sharesChild = t.studentLinks?.some(link => myChildrenStudentIds.includes(link.student?.id || ''));
        if (!isMe && !sharesChild) return false;
      }

      // 2. If teacher or staff, ONLY show tutors whose children belong to their assigned salon(s)
      if (isTeacherOrStaff) {
        if (teacherEnvIds.length === 0) {
          return false;
        }
        const hasChildInMySalon = t.studentLinks?.some(link => 
          teacherEnvIds.includes(link.student?.environment?.id || '')
        );
        if (!hasChildInMySalon) return false;
      }

      // 3. Search match
      const matchName = t.fullName?.toLowerCase().includes(q);
      const matchEmail = (isOwnerOrAdmin || (isTutor && t.id === user?.id)) && t.email?.toLowerCase().includes(q);
      const matchPhone = (isOwnerOrAdmin || (isTutor && t.id === user?.id)) && t.phone?.toLowerCase().includes(q);
      const matchStudents = t.studentLinks?.some(link => 
        link.student?.fullName?.toLowerCase().includes(q) ||
        link.student?.enrollmentCode?.toLowerCase().includes(q)
      );

      const matchSearch = !q || matchName || matchEmail || matchPhone || matchStudents;

      // 4. Environment filter
      const matchEnv = envFilter === 'ALL' || t.studentLinks?.some(link => 
        link.student?.environment?.id === envFilter
      );

      // 5. Relationship match
      const matchRel = relFilter === 'ALL' || t.studentLinks?.some(link => 
        link.relationship === relFilter
      );

        return matchSearch && matchEnv && matchRel;
      });
    }, [tutors, search, envFilter, relFilter, isTeacherOrStaff, teacherEnvIds, isOwnerOrAdmin, isTutor, user, userEmail, myChildrenStudentIds]);

  const mothersCount = filtered.filter(t => t.studentLinks?.some(l => l.relationship === 'MOTHER')).length;
  const fathersCount = filtered.filter(t => t.studentLinks?.some(l => l.relationship === 'FATHER')).length;

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, envFilter, relFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTutors = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, validCurrentPage, pageSize]);

  const handleOpenDetail = (tutor: TutorUserItem, startInEditMode = false) => {
    setSelectedTutor(tutor);
    const isSelf = isTutor && ((user?.id && tutor.id === user.id) || (userEmail && tutor.email?.toLowerCase() === userEmail.toLowerCase()));
    setIsEditing((isOwnerOrAdmin || isSelf) ? startInEditMode : false);
    setEditFullName(tutor.fullName || '');
    setEditEmail(tutor.email || '');
    setEditPhone(tutor.phone || '');
    setEditAvatarUrl(tutor.avatarUrl || '');
    setEditPassword('');
    setEditStudentLinks(
      (tutor.studentLinks || []).map(link => ({
        id: link.id,
        studentId: link.student?.id || '',
        relationship: link.relationship || 'GUARDIAN',
        isPrimaryContact: Boolean(link.isPrimaryContact),
        authorizedPickUp: link.authorizedPickUp !== false,
        student: link.student
      }))
    );
    setDetailDrawerOpen(true);
  };

  const handleSaveTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerBlockedAction('Guardar o modificar datos de tutores');
      return;
    }
    if (!selectedTutor) return;
    const isSelf = isTutor && ((user?.id && selectedTutor.id === user.id) || (userEmail && selectedTutor.email?.toLowerCase() === userEmail.toLowerCase()));
    if (!isOwnerOrAdmin && !isSelf) return;

    if (!editFullName.trim()) {
      toast.error('El nombre completo es obligatorio.');
      return;
    }
    if (!editEmail.trim()) {
      toast.error('El correo electrónico es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      await updateTutor(selectedTutor.id, {
        fullName: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim(),
        avatarUrl: editAvatarUrl.trim(),
        ...(editPassword.trim() && { password: editPassword.trim() }),
        ...(isOwnerOrAdmin ? {
          studentLinks: editStudentLinks.map(l => ({
            id: l.id,
            studentId: l.studentId,
            relationship: l.relationship,
            isPrimaryContact: l.isPrimaryContact,
            authorizedPickUp: l.authorizedPickUp
          }))
        } : {})
      });

      // Update in local state
      setTutors(prev => prev.map(t => {
        if (t.id === selectedTutor.id) {
          return {
            ...t,
            fullName: editFullName.trim(),
            email: editEmail.trim().toLowerCase(),
            phone: editPhone.trim(),
            avatarUrl: editAvatarUrl.trim(),
            ...(isOwnerOrAdmin ? {
              studentLinks: editStudentLinks.map(l => ({
                ...l,
                student: l.student
              }))
            } : {})
          };
        }
        return t;
      }));

      setSelectedTutor(prev => prev ? {
        ...prev,
        fullName: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim(),
        avatarUrl: editAvatarUrl.trim()
      } : null);

      toast.success(isSelf ? 'Tu perfil ha sido actualizado exitosamente.' : 'Datos del tutor actualizados con éxito.');
      setIsEditing(false);
      fetchList();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-background">
      
      {/* 1. FIXED TOP AREA: HERO BANNER + FILTER TOOLBAR */}
      <div className="shrink-0 z-10">
        {/* FULL-WIDTH GREEN HERO BANNER */}
        <div className="bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-5 text-white shadow-md relative overflow-hidden border-b border-forest-light/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                    {isTutor ? 'Familias & Tutores' : 'Padres & Tutores'}
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                    {filtered.length} {filtered.length === 1 ? 'familia' : 'familias'}
                  </span>
                  {isTeacherOrStaff && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-300/30 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>Mi Salón</span>
                    </span>
                  )}
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                  {isTutor
                    ? 'Directorio familiar vinculado a tus hijos, contactos y autorizaciones de retiro.'
                    : isTeacherOrStaff
                    ? 'Directorio de familias vinculadas a tu salón y autorizaciones de retiro.'
                    : 'Directorio de padres, tutores legales, autorizaciones de retiro y contactos de emergencia.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher No Environment Warning Banner */}
        {isTeacherOrStaff && teacherEnvIds.length === 0 && (
          <div className="mx-4 sm:mx-6 md:mx-8 mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center gap-3 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="text-xs">
              <strong className="font-bold">Sin salón asignado: </strong>
              <span className="text-amber-900/80">
                No tienes salones asignados actualmente en el sistema. Solicita al administrador o coordinador pedagógico que te vincule a tu ambiente Montessori.
              </span>
            </div>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="px-4 sm:px-6 md:px-8 py-2.5 bg-white/70 backdrop-blur-md border-b border-forest/10">
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            
            {/* Search Input */}
            <div className="flex-1 bg-white rounded-2xl px-3.5 py-2 flex items-center gap-2.5 border border-forest/15 shadow-xs">
              <Search className="w-4 h-4 text-forest/50 shrink-0" />
              <input
                type="text"
                placeholder={
                  isTeacherOrStaff
                    ? "Buscar por nombre del padre/madre o nombre del alumno..."
                    : "Buscar por nombre de padre/madre, correo, teléfono o nombre del alumno..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 hover:bg-forest/10 rounded-full text-muted-foreground hover:text-forest cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Controls: Environment Dropdown & Relationship Segmented Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Environment Filter */}
              {visibleEnvironments.length > 0 && (
                <div className="relative">
                  <select
                    value={envFilter}
                    onChange={(e) => setEnvFilter(e.target.value)}
                    className="h-8 px-3 pr-8 rounded-xl border border-forest/15 text-xs bg-white text-forest font-medium focus:outline-none focus:ring-1 focus:ring-forest appearance-none cursor-pointer shadow-xs"
                  >
                    <option value="ALL">
                      {isTeacherOrStaff ? `Mis Salones (${visibleEnvironments.length})` : `Todos los Salones (${environments.length})`}
                    </option>
                    {visibleEnvironments.map(env => (
                      <option key={env.id} value={env.id}>
                        {env.name} ({env.stage || 'Salón'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-forest/50 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              )}

              {/* Relationship Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-forest/15 shadow-xs overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setRelFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    relFilter === 'ALL'
                      ? 'bg-forest text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-forest hover:bg-white/60'
                  }`}
                >
                  Todos ({filtered.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRelFilter('MOTHER')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    relFilter === 'MOTHER'
                      ? 'bg-rose-700 text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-rose-700 hover:bg-white/60'
                  }`}
                >
                  Madres ({mothersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRelFilter('FATHER')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    relFilter === 'FATHER'
                      ? 'bg-sky-700 text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-sky-700 hover:bg-white/60'
                  }`}
                >
                  Padres ({fathersCount})
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE TUTORS AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 md:px-8 py-3 space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground">Cargando directorio de familias...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto">
              <HeartHandshake className="w-7 h-7 text-forest/40" />
            </div>
            <h3 className="text-base font-bold text-forest">No se encontraron padres o tutores</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || envFilter !== 'ALL' || relFilter !== 'ALL'
                ? 'Prueba modificando los filtros de búsqueda o salón.'
                : isTeacherOrStaff
                  ? 'No hay familias asociadas a los estudiantes de tu salón actualmente.'
                  : 'Los tutores se vinculan automáticamente al matricular estudiantes o invitar a las familias.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {paginatedTutors.map(tutor => {
              const links = tutor.studentLinks || [];
              // Filter links to show relevant students for teacher
              const visibleLinks = isTeacherOrStaff
                ? links.filter(l => teacherEnvIds.includes(l.student?.environment?.id || ''))
                : links;

              const primaryLink = visibleLinks[0] || links[0];
              const primaryRel = primaryLink?.relationship || 'GUARDIAN';
              const relCfg = RELATIONSHIP_CONFIG[primaryRel] || RELATIONSHIP_CONFIG.GUARDIAN;
              const primaryEnv = primaryLink?.student?.environment;
              const accentColor = primaryEnv?.color || (
                relCfg.text.includes('rose') ? '#e11d48' :
                relCfg.text.includes('sky') ? '#0284c7' :
                relCfg.text.includes('purple') ? '#7e22ce' :
                '#1b3b2b'
              );

              const hasPickupAuth = visibleLinks.some(l => l.authorizedPickUp);
              const isPrimaryContact = visibleLinks.some(l => l.isPrimaryContact);

              return (
                <div
                  key={tutor.id}
                  onClick={() => handleOpenDetail(tutor, false)}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-forest/10 shadow-2xs hover:border-forest/30 hover:shadow-xs transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative overflow-hidden"
                >
                  {/* Left Color Accent Bar */}
                  <div
                    className="absolute top-0 bottom-0 left-0 w-1.5"
                    style={{ backgroundColor: accentColor }}
                  />

                  {/* Left Section: Avatar + Identity + Relationship Badges */}
                  <div className="flex items-center gap-3.5 min-w-0 pl-1.5 flex-1">
                    <div
                      className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-2xl bg-forest/5 border-2 flex items-center justify-center font-bold text-base font-display text-forest shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform"
                      style={{ borderColor: accentColor }}
                    >
                      {tutor.avatarUrl ? (
                        <img src={tutor.avatarUrl} alt={tutor.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(tutor.fullName || 'T').charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-forest text-sm truncate leading-tight group-hover:text-forest/90">
                        {tutor.fullName || 'Tutor sin nombre registrado'}
                      </h4>

                    {/* Relationship Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${relCfg.bg} ${relCfg.text} ${relCfg.border}`}>
                      {relCfg.label}
                    </span>

                    {/* Primary Contact Badge */}
                    {isPrimaryContact && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                        Contacto Principal
                      </span>
                    )}

                    {/* Authorized Pickup Tag */}
                    {hasPickupAuth && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-0.5 shrink-0">
                        <Car className="w-2.5 h-2.5 text-emerald-600" />
                        Retiro Autorizado
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Section: Associated Students / Children Chips */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 pl-1.5 lg:pl-0 lg:max-w-md xl:max-w-lg">
                  {visibleLinks.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground bg-forest/5 px-2.5 py-1 rounded-xl border border-forest/10 font-medium">
                      Sin alumnos vinculados a tu salón
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-forest/60 uppercase tracking-wider hidden xl:inline">
                        Infante:
                      </span>
                      {visibleLinks.map(link => {
                        const st = link.student;
                        const env = st?.environment;
                        return (
                          <div
                            key={link.id}
                            className="inline-flex items-center gap-1.5 bg-forest/5 hover:bg-forest/10 border border-forest/10 px-2.5 py-1 rounded-xl text-xs text-forest transition-colors shrink-0 shadow-2xs"
                            title={`Estudiante: ${st?.fullName} (${env?.name || 'Salón'})`}
                          >
                            <div className="w-4 h-4 rounded-full bg-forest/15 text-forest font-bold text-[8px] flex items-center justify-center overflow-hidden shrink-0">
                              {st?.avatarUrl ? (
                                <img src={st.avatarUrl} alt={st.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{(st?.fullName || 'A').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="font-bold text-xs truncate max-w-[130px]">
                              {st?.fullName}
                            </span>
                            {env && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded-md text-white shrink-0"
                                style={{ backgroundColor: env.color || '#1b3b2b' }}
                              >
                                {env.name}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Section: Chevron Arrow */}
                <div className="flex items-center justify-end shrink-0 pl-1.5 lg:pl-0">
                  <div className="w-8 h-8 rounded-xl bg-forest/5 group-hover:bg-forest group-hover:text-white text-forest/40 flex items-center justify-center transition-all shadow-2xs">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* 3. FIXED FOOTER WITH PAGINATION */}
      <div className="shrink-0 px-4 sm:px-6 md:px-8 py-2 bg-white/95 backdrop-blur-md border-t border-forest/10 z-10 shadow-2xs">
        <PaginationControl
          currentPage={validCurrentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="padres/tutores"
        />
      </div>

      {/* DETAIL & EDIT DRAWER */}
      <SlideOverDrawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        maxWidthClass="max-w-xl"
        icon={<HeartHandshake className="w-5 h-5 text-forest" />}
        title={isEditing ? (isTutor ? 'Editar Mis Datos' : 'Editar Perfil del Tutor') : (selectedTutor?.fullName || 'Ficha de Familia / Tutor')}
        description={
          isEditing 
            ? 'Actualiza los datos personales, contactos y contraseña' 
            : isTutor
              ? 'Datos de contacto y ficha familiar vinculada a tus hijos'
              : isTeacherOrStaff
                ? 'Expediente del estudiante vinculado y permisos de retiro escolar'
                : (selectedTutor?.email || 'Información de contacto y expedientes vinculados')
        }
        footer={
          selectedTutor ? (
            isEditing ? (
              <div className="flex items-center justify-between w-full gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl border border-forest/15 text-forest text-xs font-bold hover:bg-forest/5 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  form="tutor-edit-form"
                  disabled={saving}
                  className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end w-full">
                <button
                  type="button"
                  onClick={() => setDetailDrawerOpen(false)}
                  className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  Cerrar Ficha
                </button>
              </div>
            )
          ) : null
        }
      >
        {selectedTutor && (
          <div className="space-y-6 pb-6 text-forest">
            
            {/* Mode Switcher Buttons (Admin / Owner or Tutor editing their own profile) */}
            {(isOwnerOrAdmin || (isTutor && (selectedTutor.id === user?.id || selectedTutor.email?.toLowerCase() === userEmail?.toLowerCase()))) && (
              <div className="flex items-center gap-2 border-b border-forest/10 pb-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    !isEditing
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-forest/5 hover:bg-forest/10 text-forest'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Expediente Familiar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isEditing
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-forest/5 hover:bg-forest/10 text-forest'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isTutor ? 'Editar Mis Datos' : 'Editar Información'}</span>
                </button>
              </div>
            )}

            {/* VIEW MODE */}
            {!isEditing && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* Tutor Identity Card */}
                <div className="bg-forest/5 rounded-3xl p-5 border border-forest/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-forest/20 flex items-center justify-center font-bold text-xl text-forest shrink-0 overflow-hidden shadow-sm">
                      {selectedTutor.avatarUrl ? (
                        <img src={selectedTutor.avatarUrl} alt={selectedTutor.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(selectedTutor.fullName || 'T').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base font-display text-forest leading-tight">
                        {selectedTutor.fullName || 'Tutor Registrado'}
                      </h3>

                      {/* Contact display: Plain for Admin and Tutors / Masked for Guide */}
                      {(isOwnerOrAdmin || isTutor) ? (
                        <>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {selectedTutor.email}
                          </p>
                          {selectedTutor.phone && (
                            <p className="text-xs font-mono font-semibold text-forest/80 mt-1">
                              📞 {selectedTutor.phone}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="space-y-1 mt-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Mail className="w-3 h-3 text-forest/40" />
                            <span className="tracking-widest select-none">•••••••••••••</span>
                            <span className="text-[9px] font-sans font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-md">
                              Protegido
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Phone className="w-3 h-3 text-forest/40" />
                            <span className="tracking-widest select-none">•••• ••• ••••</span>
                            <span className="text-[9px] font-sans font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-md">
                              Protegido
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(isOwnerOrAdmin || (isTutor && (selectedTutor.id === user?.id || selectedTutor.email?.toLowerCase() === userEmail?.toLowerCase()))) && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-2.5 rounded-xl bg-white hover:bg-forest hover:text-white border border-forest/15 text-forest transition-all shadow-2xs shrink-0"
                      title="Editar datos"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Direct Contact Actions (Admin only) vs Privacy Notice (Guide) */}
                {isOwnerOrAdmin ? (
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`mailto:${selectedTutor.email}`}
                      className="p-3 rounded-2xl bg-white hover:bg-forest/5 border border-forest/15 text-forest text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
                    >
                      <Mail className="w-4 h-4 text-forest/70" />
                      <span>Enviar Email</span>
                    </a>
                    {selectedTutor.phone ? (
                      <a
                        href={`https://wa.me/${selectedTutor.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <div className="p-3 rounded-2xl bg-stone-100 text-muted-foreground text-xs font-medium flex items-center justify-center text-center">
                        Sin teléfono registrado
                      </div>
                    )}
                  </div>
                ) : isTeacherOrStaff ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-2.5 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <strong className="block font-bold text-amber-950">
                        Canales de Contacto Protegidos
                      </strong>
                      <span className="text-amber-900/80 text-[11px] block mt-0.5">
                        Por política de privacidad institucional, los correos y teléfonos de las familias están reservados para la dirección escolar. Como guía tienes acceso al nombre del responsable y la autorización para retiro de tu salón.
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Linked Students & Permissions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-forest/70">
                      {isTeacherOrStaff ? 'Infantes de tu Salón' : 'Estudiantes Vinculados'} ({selectedTutor.studentLinks?.length || 0})
                    </h4>
                  </div>

                  {(!selectedTutor.studentLinks || selectedTutor.studentLinks.length === 0) ? (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-medium">
                      Este usuario no tiene estudiantes asociados formalmente en la base de datos.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedTutor.studentLinks
                        .filter(link => !isTeacherOrStaff || teacherEnvIds.includes(link.student?.environment?.id || ''))
                        .map((link) => {
                          const st = link.student;
                          const env = st?.environment;
                          const relCfg = RELATIONSHIP_CONFIG[link.relationship] || RELATIONSHIP_CONFIG.GUARDIAN;

                          return (
                            <div
                              key={link.id}
                              className="bg-white rounded-2xl p-4 border border-forest/15 shadow-2xs space-y-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-forest/5 border border-forest/10 flex items-center justify-center font-bold text-sm text-forest shrink-0 overflow-hidden">
                                    {st?.avatarUrl ? (
                                      <img src={st.avatarUrl} alt={st.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{(st?.fullName || 'A').charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-sm text-forest leading-tight truncate">
                                      {st?.fullName}
                                    </h5>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {env && (
                                        <span
                                          className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                                          style={{ backgroundColor: env.color || '#1b3b2b' }}
                                        >
                                          {env.name}
                                        </span>
                                      )}
                                      {st?.enrollmentCode && (
                                        <span className="text-[10px] font-mono text-muted-foreground bg-forest/5 px-1.5 py-0.2 rounded">
                                          {st.enrollmentCode}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${relCfg.bg} ${relCfg.text} ${relCfg.border}`}>
                                  {relCfg.label}
                                </span>
                              </div>

                              {/* Badges / Permissions */}
                              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-forest/5 text-[11px]">
                                <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 font-semibold ${
                                  link.isPrimaryContact 
                                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                                  : 'bg-stone-50 border-stone-200 text-muted-foreground'
                                }`}>
                                  <Star className="w-3 h-3" />
                                  <span>{link.isPrimaryContact ? 'Contacto Principal' : 'Contacto Secundario'}</span>
                                </div>

                                <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 font-semibold ${
                                  link.authorizedPickUp 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                  : 'bg-rose-50 border-rose-200 text-rose-900'
                                }`}>
                                  <Car className="w-3 h-3" />
                                  <span>{link.authorizedPickUp ? 'Autorizado para Retiro' : 'No Autorizado para Retiro'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EDIT MODE FORM */}
            {isEditing && (isOwnerOrAdmin || (isTutor && (selectedTutor.id === user?.id || selectedTutor.email?.toLowerCase() === userEmail?.toLowerCase()))) && (
              <form id="tutor-edit-form" onSubmit={handleSaveTutor} className="space-y-5 animate-in fade-in duration-150">
                
                {/* Avatar Dropzone */}
                <div>
                  <ImageUploadDropzone
                    label="Fotografía del Tutor / Padre"
                    helperText="Foto de perfil o avatar oficial de la familia"
                    value={editAvatarUrl}
                    onChange={(url) => setEditAvatarUrl(url)}
                    aspectRatio="square"
                    folder="gallery"
                  />
                </div>

                {/* Personal Information */}
                <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-forest/15 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Datos Personales</span>
                  </h4>

                  <div>
                    <label className="text-xs font-bold text-forest block mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Ej. María Elena Pérez González"
                      className="w-full h-10 px-3 rounded-xl border border-forest/15 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest bg-forest/5"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-forest block mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        disabled={!isOwnerOrAdmin}
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full h-10 px-3 rounded-xl border border-forest/15 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest bg-forest/5 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      {!isOwnerOrAdmin && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          Para modificar tu correo oficial, contacta a la administración.
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest block mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+52 998 123 4567"
                        className="w-full h-10 px-3 rounded-xl border border-forest/15 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest bg-forest/5"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-forest flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-forest/70" />
                        <span>Nueva Contraseña de Acceso</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Dejar en blanco para conservar la actual"
                        className="w-full h-10 px-3 pl-8 rounded-xl border border-forest/15 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest bg-forest/5 placeholder:text-muted-foreground/60"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-forest/40 absolute left-2.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Linked Students Parentesco & Permissions (Owner / Admin only) */}
                {isOwnerOrAdmin && editStudentLinks.length > 0 && (
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-forest/15 shadow-2xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Parentesco y Permisos con Estudiantes</span>
                    </h4>

                    <div className="space-y-3">
                      {editStudentLinks.map((link, idx) => {
                        const st = link.student;
                        return (
                          <div
                            key={link.id || idx}
                            className="p-3.5 rounded-xl border border-forest/15 bg-forest/5 space-y-3"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-white border border-forest/15 text-forest font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                                {st?.avatarUrl ? (
                                  <img src={st.avatarUrl} alt={st?.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(st?.fullName || 'A').charAt(0)}</span>
                                )}
                              </div>
                              <span className="font-bold text-xs text-forest truncate">
                                {st?.fullName}
                              </span>
                            </div>

                            {/* Relationship Dropdown */}
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                                Parentesco:
                              </label>
                              <select
                                value={link.relationship}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditStudentLinks(prev => prev.map((l, i) => i === idx ? { ...l, relationship: val } : l));
                                }}
                                className="w-full h-9 px-2.5 rounded-xl border border-forest/15 text-xs text-forest bg-white focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer"
                              >
                                <option value="MOTHER">Madre</option>
                                <option value="FATHER">Padre</option>
                                <option value="GUARDIAN">Tutor Legal</option>
                                <option value="OTHER">Familiar / Contacto Autorizado</option>
                              </select>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-forest/10 text-xs font-semibold text-forest cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={link.isPrimaryContact}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEditStudentLinks(prev => prev.map((l, i) => i === idx ? { ...l, isPrimaryContact: checked } : l));
                                  }}
                                  className="rounded text-forest focus:ring-forest w-3.5 h-3.5"
                                />
                                <span>Contacto Principal</span>
                              </label>

                              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-forest/10 text-xs font-semibold text-forest cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={link.authorizedPickUp}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEditStudentLinks(prev => prev.map((l, i) => i === idx ? { ...l, authorizedPickUp: checked } : l));
                                  }}
                                  className="rounded text-forest focus:ring-forest w-3.5 h-3.5"
                                />
                                <span>Retiro Autorizado</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </form>
            )}

          </div>
        )}
      </SlideOverDrawer>

    </div>
  );
};
export default TutorsSection;
