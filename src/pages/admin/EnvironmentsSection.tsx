import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building,
  Plus,
  Trash2,
  Edit3,
  Users,
  Sparkles,
  Calendar,
  Info,
  Layers,
  Palette,
  Check,
  X,
  BookOpen,
  Image as ImageIcon,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Crown,
  ShieldCheck,
  UserCheck,
  HeartHandshake,
  Settings,
  UserPlus,
  BarChart3,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  Package
} from 'lucide-react';
import { EnvironmentMaterialsManager } from '@/components/admin/EnvironmentMaterialsManager';
import { MobileMenuButton, useAdminDashboard } from './AdminDashboard';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import {
  getEnvironments,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  seedEnvironmentPresets,
  getWaitlistEntries,
  getGuides,
  updateGuide,
  getStudents,
  EnvironmentItem,
  WaitlistEntry,
  GuideUserItem,
  StudentItem
} from '@/lib/sqlite';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import StudentDrawer from '@/components/admin/StudentDrawer';
import GuideDrawer, { STAFF_ROLES } from '@/components/admin/GuideDrawer';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  '#1b3b2b', // Forest Green
  '#0284c7', // Sky Blue
  '#d97706', // Warm Amber
  '#7c3aed', // Soft Purple
  '#059669', // Emerald Green
  '#dc2626', // Crimson Red
  '#ea580c', // Terracotta Orange
  '#0891b2', // Ocean Teal
  '#e11d48', // Rose Pink
  '#475569', // Slate
];

export const ALL_WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export interface GradeYearDef {
  id: string;
  defaultName: string;
  minAge: number;
  maxAge: number;
  description: string;
}

export const DEFAULT_GRADE_YEARS: GradeYearDef[] = [
  { id: 'infant', defaultName: 'Infant', minAge: 0, maxAge: 1.5, description: 'Nido / Bebés (0 - 1.5 años)' },
  { id: 'toddler', defaultName: 'Toddler', minAge: 1.5, maxAge: 3.0, description: 'Comunidad Infantil (1.5 - 3 años)' },
  { id: 'pk1', defaultName: 'PK1', minAge: 3.0, maxAge: 4.0, description: 'Casa de Niños 1 (3 - 4 años)' },
  { id: 'pk2', defaultName: 'PK2', minAge: 4.0, maxAge: 5.0, description: 'Casa de Niños 2 (4 - 5 años)' },
  { id: 'k', defaultName: 'K', minAge: 5.0, maxAge: 6.0, description: 'Kinder / Casa 3 (5 - 6 años)' },
  { id: '1st', defaultName: '1st', minAge: 6.0, maxAge: 7.0, description: 'Taller I - 1º Grado (6 - 7 años)' },
  { id: '2nd', defaultName: '2nd', minAge: 7.0, maxAge: 8.0, description: 'Taller I - 2º Grado (7 - 8 años)' },
  { id: '3rd', defaultName: '3rd', minAge: 8.0, maxAge: 9.0, description: 'Taller I - 3º Grado (8 - 9 años)' },
  { id: '4th', defaultName: '4th', minAge: 9.0, maxAge: 10.0, description: 'Taller II - 4º Grado (9 - 10 años)' },
  { id: '5th', defaultName: '5th', minAge: 10.0, maxAge: 11.0, description: 'Taller II - 5º Grado (10 - 11 años)' },
  { id: '6th', defaultName: '6th', minAge: 11.0, maxAge: 12.0, description: 'Taller II - 6º Grado (11 - 12 años)' },
  { id: '7th', defaultName: '7th', minAge: 12.0, maxAge: 13.0, description: 'Secundaria 1 (12 - 13 años)' },
  { id: '8th', defaultName: '8th', minAge: 13.0, maxAge: 14.0, description: 'Secundaria 2 (13 - 14 años)' },
  { id: '9th', defaultName: '9th', minAge: 14.0, maxAge: 15.0, description: 'Secundaria 3 (14 - 15 años)' },
];

const STORAGE_KEY_CUSTOM_GRADES = 'ceiba_custom_grade_names';

export function getCustomGradeNames(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_GRADES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export function saveCustomGradeNames(customMap: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_GRADES, JSON.stringify(customMap));
  } catch {}
}

export function getStudentGradeYear(student: StudentItem, customMap: Record<string, string>): GradeYearDef & { name: string } {
  // If student has explicit grade id match
  if (student.grade) {
    const matched = DEFAULT_GRADE_YEARS.find(
      (g) => g.id.toLowerCase() === student.grade?.toLowerCase() || g.defaultName.toLowerCase() === student.grade?.toLowerCase()
    );
    if (matched) {
      return { ...matched, name: customMap[matched.id] || matched.defaultName };
    }
  }

  // Calculate age from date_of_birth
  if (student.date_of_birth) {
    const birthDate = new Date(student.date_of_birth);
    const now = new Date();
    const ageYears = (now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const matched = DEFAULT_GRADE_YEARS.find((g) => ageYears >= g.minAge && ageYears < g.maxAge);
    if (matched) {
      return { ...matched, name: customMap[matched.id] || matched.defaultName };
    }
  }

  return {
    id: 'other',
    defaultName: student.grade || 'General',
    minAge: 0,
    maxAge: 99,
    description: 'General',
    name: student.grade || 'General'
  };
}

export function parseScheduleDays(days?: string | string[] | null): string[] {
  if (!days) return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  if (Array.isArray(days)) return days;
  try {
    const parsed = JSON.parse(days);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return days.split(',').map((d) => d.trim()).filter(Boolean);
  }
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
}

export function formatDaysSummary(days: string[]): string {
  if (!days || days.length === 0) return 'Sin días';
  const standardWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const isStandardWeek = standardWeek.every((d) => days.includes(d)) && days.length === 5;
  if (isStandardWeek) return 'Lun - Vie';
  if (days.length === 7) return 'Lunes a Domingo';
  const shortMap: Record<string, string> = {
    Lunes: 'Lun',
    Martes: 'Mar',
    Miércoles: 'Mié',
    Jueves: 'Jue',
    Viernes: 'Vie',
    Sábado: 'Sáb',
    Domingo: 'Dom',
  };
  return days.map((d) => shortMap[d] || d).join(', ');
}

export const EnvironmentsSection: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();

  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [guides, setGuides] = useState<GuideUserItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Grade Names State & Modal
  const [customGradeNames, setCustomGradeNames] = useState<Record<string, string>>(() => getCustomGradeNames());
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [tempCustomGrades, setTempCustomGrades] = useState<Record<string, string>>({});

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<EnvironmentItem | null>(null);
  const [activeEnvSubTab, setActiveEnvSubTab] = useState<'overview' | 'materials'>('overview');

  // Form Fields
  const [name, setName] = useState('');
  const [stage, setStage] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [minAgeYears, setMinAgeYears] = useState('');
  const [maxAgeYears, setMaxAgeYears] = useState('');
  const [capacity, setCapacity] = useState('25');
  const [color, setColor] = useState('#1b3b2b');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('13:30');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);

  // Danger Zone Delete Modal State
  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [dangerConfirmText, setDangerConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Student Detail Drawer State
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<StudentItem | null>(null);
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false);

  // Guide Detail Drawer State (Uses Shared GuideDrawer)
  const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<GuideUserItem | null>(null);

  // Assign Teachers to Environment Drawer State
  const [isAssignTeachersDrawerOpen, setIsAssignTeachersDrawerOpen] = useState(false);
  const [selectedTeacherIdsForEnv, setSelectedTeacherIdsForEnv] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [savingTeacherAssignments, setSavingTeacherAssignments] = useState(false);

  // Determine base prefix (/panel vs /admin vs /console)
  const basePath = useMemo(() => {
    if (location.pathname.startsWith('/console')) return '/console';
    if (location.pathname.startsWith('/admin')) return '/admin';
    return '/panel';
  }, [location.pathname]);

  // Extract selected environment ID from URL (e.g. /panel/environments/env-123)
  const selectedEnvId = useMemo(() => {
    const match = location.pathname.match(/\/environments\/([^/?#]+)/i);
    return match && match[1] && match[1] !== '' ? match[1] : null;
  }, [location.pathname]);

  const fetchAllData = async () => {
    setLoading(true);
    const [envsData, waitlistData, guidesData, studentsData] = await Promise.all([
      getEnvironments(),
      getWaitlistEntries({ status: 'WAITING' }),
      getGuides(),
      getStudents()
    ]);
    setEnvironments(envsData);
    setWaitlistEntries(waitlistData);
    setGuides(guidesData);
    setStudents(studentsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const currentEnv = useMemo(() => {
    if (!selectedEnvId) return null;
    return environments.find((e) => e.id === selectedEnvId) || null;
  }, [selectedEnvId, environments]);

  // Teachers/Guides linked to this environment
  const currentEnvGuides = useMemo(() => {
    if (!selectedEnvId) return [];
    return guides.filter((g) => g.environments?.some((e) => e.id === selectedEnvId));
  }, [selectedEnvId, guides]);

  // Students linked to this environment
  const currentEnvStudents = useMemo(() => {
    if (!selectedEnvId) return [];
    return students.filter(
      (s) => s.environment_id === selectedEnvId || s.environment?.id === selectedEnvId
    );
  }, [selectedEnvId, students]);

  // Predefined grades that fall within this classroom's age range
  const classroomGrades = useMemo(() => {
    if (!currentEnv) return [];
    const min = currentEnv.min_age_years !== null && currentEnv.min_age_years !== undefined ? currentEnv.min_age_years : 0;
    const max = currentEnv.max_age_years !== null && currentEnv.max_age_years !== undefined ? currentEnv.max_age_years : 18;

    return DEFAULT_GRADE_YEARS.filter((g) => {
      return (g.minAge >= min && g.minAge < max) || (g.maxAge > min && g.maxAge <= max) || (g.minAge <= min && g.maxAge >= max);
    }).map((g) => ({
      ...g,
      name: customGradeNames[g.id] || g.defaultName
    }));
  }, [currentEnv, customGradeNames]);

  // Group students by grade / range for this environment (Montessori Compass Style)
  const gradeDistribution = useMemo(() => {
    if (!currentEnv) return [];

    const countsMap: Record<string, { grade: GradeYearDef & { name: string }; count: number }> = {};
    classroomGrades.forEach((g) => {
      countsMap[g.id] = { grade: g, count: 0 };
    });

    currentEnvStudents.forEach((student) => {
      const studentGrade = getStudentGradeYear(student, customGradeNames);
      if (countsMap[studentGrade.id]) {
        countsMap[studentGrade.id].count += 1;
      } else {
        countsMap[studentGrade.id] = { grade: studentGrade, count: 1 };
      }
    });

    return Object.values(countsMap);
  }, [currentEnv, classroomGrades, currentEnvStudents, customGradeNames]);

  // Current operating days parsed
  const currentScheduleDays = useMemo(() => {
    return parseScheduleDays(currentEnv?.schedule_days);
  }, [currentEnv]);

  // Active students in the salon currently being edited in the drawer
  const editingEnvActiveStudentsCount = useMemo(() => {
    if (!editingEnv) return 0;
    return students.filter(
      (s) =>
        (s.environment_id === editingEnv.id || s.environment?.id === editingEnv.id) &&
        (s.status === 'active' || s.status === 'ACTIVE' || !s.status)
    ).length;
  }, [editingEnv, students]);

  const handleOpenAssignTeachers = () => {
    setSelectedTeacherIdsForEnv(currentEnvGuides.map((g) => g.id));
    setTeacherSearch('');
    setIsAssignTeachersDrawerOpen(true);
  };

  const handleToggleTeacherInEnv = (teacherId: string) => {
    setSelectedTeacherIdsForEnv((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
    );
  };

  const handleSaveTeacherAssignments = async () => {
    if (!selectedEnvId) return;
    setSavingTeacherAssignments(true);
    try {
      const promises: Promise<any>[] = [];

      for (const guide of guides) {
        const wasIn = guide.environments?.some((e) => e.id === selectedEnvId);
        const isNowIn = selectedTeacherIdsForEnv.includes(guide.id);

        if (wasIn !== isNowIn) {
          const currentOtherEnvIds = (guide.environments || [])
            .map((e) => e.id)
            .filter((id) => id !== selectedEnvId);

          const updatedEnvIds = isNowIn
            ? [...currentOtherEnvIds, selectedEnvId]
            : currentOtherEnvIds;

          promises.push(updateGuide(guide.id, { environmentIds: updatedEnvIds }));
        }
      }

      await Promise.all(promises);
      toast.success('Equipo docente del salón actualizado correctamente');
      setIsAssignTeachersDrawerOpen(false);
      await fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar asignaciones de docentes');
    } finally {
      setSavingTeacherAssignments(false);
    }
  };

  const handleOpenCreate = () => {
    if (isReadOnly) {
      triggerBlockedAction('Crear nuevos ambientes Montessori');
      return;
    }
    setEditingEnv(null);
    setName('');
    setStage('');
    setDescription('');
    setCoverImage('');
    setMinAgeYears('');
    setMaxAgeYears('');
    setCapacity('25');
    setColor('#1b3b2b');
    setStartTime('08:00');
    setEndTime('13:30');
    setScheduleDays(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (env: EnvironmentItem) => {
    setEditingEnv(env);
    setName(env.name);
    setStage(env.stage || '');
    setDescription(env.description || '');
    setCoverImage(env.cover_image || '');
    setMinAgeYears(env.min_age_years !== null && env.min_age_years !== undefined ? String(env.min_age_years) : '');
    setMaxAgeYears(env.max_age_years !== null && env.max_age_years !== undefined ? String(env.max_age_years) : '');
    setCapacity(String(env.capacity || 25));
    setColor(env.color || '#1b3b2b');
    setStartTime(env.start_time || '08:00');
    setEndTime(env.end_time || '13:30');
    setScheduleDays(parseScheduleDays(env.schedule_days));
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerBlockedAction(editingEnv ? 'Editar ambientes' : 'Crear nuevos ambientes');
      return;
    }
    if (!name.trim()) {
      toast.error('El nombre del ambiente es obligatorio.');
      return;
    }

    try {
      if (editingEnv) {
        await updateEnvironment(editingEnv.id, {
          name: name.trim(),
          stage: stage.trim() || undefined,
          description: description.trim() || undefined,
          coverImage: coverImage.trim() || null,
          minAgeYears: minAgeYears ? parseFloat(minAgeYears) : null,
          maxAgeYears: maxAgeYears ? parseFloat(maxAgeYears) : null,
          capacity: capacity ? parseInt(capacity) : 25,
          color,
          startTime: startTime || null,
          endTime: endTime || null,
          scheduleDays,
        });
        toast.success('Ambiente actualizado con éxito');
      } else {
        await createEnvironment({
          name: name.trim(),
          stage: stage.trim() || undefined,
          description: description.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
          minAgeYears: minAgeYears ? parseFloat(minAgeYears) : null,
          maxAgeYears: maxAgeYears ? parseFloat(maxAgeYears) : null,
          capacity: capacity ? parseInt(capacity) : 25,
          color,
          startTime: startTime || null,
          endTime: endTime || null,
          scheduleDays,
        });
        toast.success('Ambiente creado con éxito');
      }
      setIsDrawerOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const handleDangerDelete = async () => {
    if (!editingEnv) return;
    if (isReadOnly) {
      triggerBlockedAction('Eliminar ambientes');
      return;
    }
    if (dangerConfirmText.trim() !== 'Eliminar de forma definitiva') {
      toast.error('Debes escribir exactamente "Eliminar de forma definitiva" para confirmar.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEnvironment(editingEnv.id);
      toast.success('Ambiente eliminado exitosamente.');
      setIsDangerModalOpen(false);
      setIsDrawerOpen(false);
      setDangerConfirmText('');
      await fetchAllData();
      navigate(`${basePath}/environments`);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar ambiente');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedPresets = async (preset: 'montessori' | 'traditional') => {
    if (isReadOnly) {
      triggerBlockedAction('Cargar plantillas de ambientes');
      return;
    }
    try {
      await seedEnvironmentPresets(preset);
      toast.success(`Plantilla ${preset === 'montessori' ? 'Montessori' : 'Tradicional'} cargada con éxito`);
      fetchAllData();
    } catch (err: any) {
      toast.error('Error al cargar plantilla');
    }
  };

  const handleOpenGuideDrawer = (guide: GuideUserItem) => {
    setSelectedGuide(guide);
    setGuideDrawerOpen(true);
  };

  const getStudentInitials = (fullName: string) => {
    if (!fullName) return 'CE';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const calculateAgeString = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (now.getDate() < dob.getDate()) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years === 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    if (months === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
    return `${years}a ${months}m`;
  };

  // =========================================================================
  // SUBPÁGINA: DETALLE DEL AMBIENTE (/panel/environments/:id)
  // =========================================================================
  if (selectedEnvId && currentEnv) {
    const studentCount = currentEnvStudents.length;
    const capacity = currentEnv.capacity || 25;
    const occupancyPercent = Math.min(100, Math.round((studentCount / capacity) * 100));

    return (
      <div className="relative min-h-[calc(100vh-8rem)] animate-in fade-in duration-200">
        {/* Salon Background Photo with Light Semi-Transparent Layer (Mobile & Desktop) */}
        {currentEnv.cover_image && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <img
              src={currentEnv.cover_image}
              alt={currentEnv.name}
              className="w-full h-full object-cover object-center"
            />
            {/* Calibrated light translucent overlay for balanced photo visibility and text legibility */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.78)' }}
            />
          </div>
        )}

        <div className="relative z-10 space-y-8">
          {/* FULL-WIDTH GREEN HERO BANNER CON BREADCRUMB Y BOTÓN DE EDICIÓN */}
          <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-3 relative overflow-hidden border-b border-forest-light/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Breadcrumb */}
          <nav className="relative z-10 flex items-center gap-2 text-xs font-medium text-white/80">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/environments`)}
              className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Salones</span>
            </button>
            <span className="text-white/40">/</span>
            <span className="text-white font-bold truncate">{currentEnv.name}</span>
          </nav>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="flex items-start sm:items-center gap-3.5">
              <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                    {currentEnv.name}
                  </h1>

                  {/* Stage Tag with Color Dot */}
                  <span
                    className="text-[11px] font-bold px-3 py-0.5 rounded-full text-white shadow-xs flex items-center gap-1.5 backdrop-blur-xs"
                    style={{ backgroundColor: currentEnv.color || '#1b3b2b' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>{currentEnv.stage || 'Montessori'}</span>
                  </span>

                  {/* Age Range Badge */}
                  {currentEnv.min_age_years !== null && currentEnv.max_age_years !== null && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                      {currentEnv.min_age_years} - {currentEnv.max_age_years} años
                    </span>
                  )}

                  {/* Capacity Badge */}
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                    {studentCount} / {capacity} alumnos ({occupancyPercent}%)
                  </span>

                  {/* Schedule Time Badge */}
                  {(currentEnv.start_time || currentEnv.end_time) && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20 flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-3 h-3 text-white/80" />
                      <span>{currentEnv.start_time || '08:00'} - {currentEnv.end_time || '13:30'} hrs</span>
                    </span>
                  )}

                  {/* Schedule Days Badge */}
                  {currentEnv.schedule_days && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20 flex items-center gap-1.5 shadow-2xs">
                      <Calendar className="w-3 h-3 text-white/80" />
                      <span>{formatDaysSummary(parseScheduleDays(currentEnv.schedule_days))}</span>
                    </span>
                  )}
                </div>

                {currentEnv.description && (
                  <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                    {currentEnv.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action: Editar Salón (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenEdit(currentEnv)}
                className="px-4 sm:px-5 py-2.5 bg-white text-forest hover:bg-white/95 rounded-2xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-forest" />
                <span>Editar Salón</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION: RESUMEN & ALUMNOS vs MATERIALES DEL SALÓN */}
        <div className="bg-white p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-forest/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-forest/5 rounded-xl sm:rounded-2xl border border-forest/10 overflow-x-auto [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setActiveEnvSubTab('overview')}
              className={`px-4 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeEnvSubTab === 'overview'
                  ? 'bg-forest text-white shadow-xs scale-[1.01]'
                  : 'text-forest/70 hover:text-forest hover:bg-white/60'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Resumen & Alumnos</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono transition-colors ${
                  activeEnvSubTab === 'overview'
                    ? 'bg-white/20 text-white'
                    : 'bg-forest/10 text-forest'
                }`}
              >
                {studentCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveEnvSubTab('materials')}
              className={`px-4 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeEnvSubTab === 'materials'
                  ? 'bg-[#C4661F] text-white shadow-xs scale-[1.01]'
                  : 'text-forest/70 hover:text-forest hover:bg-white/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Materiales del Salón</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pr-3 text-xs font-semibold text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ambiente Activo: <strong className="text-forest">{currentEnv.name}</strong></span>
          </div>
        </div>

        {activeEnvSubTab === 'materials' ? (
          <EnvironmentMaterialsManager environment={currentEnv} />
        ) : (
          <>
            {/* 1. HUB DE CONFIGURACIÓN & RESUMEN (CLASSROOM SETTINGS PRO MAX) */}
            <section className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-white/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-forest/10 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-forest" />
              <h2 className="text-sm sm:text-base font-bold font-display text-forest uppercase tracking-wider">
                Configuración & Resumen del Ambiente
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleOpenEdit(currentEnv)}
              className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editar Configuración</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Col 1: Docentes Asignados (Teachers) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-display text-forest flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-forest/70" />
                  Equipo Docente ({currentEnvGuides.length})
                </span>
              </div>

              <div className="flex items-start gap-3 overflow-x-auto pt-2.5 pb-2 px-1 [scrollbar-width:none]">
                {/* 1st Position: Add / Manage Guide Round Tile */}
                <button
                  type="button"
                  onClick={handleOpenAssignTeachers}
                  className="flex flex-col items-center text-center group shrink-0 w-24 cursor-pointer"
                  title="Asignar o desvincular docentes de este salón"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-forest/30 flex items-center justify-center text-forest/60 group-hover:border-forest group-hover:text-forest group-hover:bg-forest/5 group-hover:scale-105 transition-all shadow-2xs bg-white/50">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-forest text-[11px] mt-1.5 truncate max-w-full leading-tight group-hover:text-forest-light">
                    + Asignar
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium truncate max-w-full">
                    Docente
                  </span>
                </button>

                {currentEnvGuides.map((guide) => {
                  const isLead = guide.staffRole === 'LEAD_GUIDE';
                  const roleConfig = STAFF_ROLES[guide.staffRole || 'LEAD_GUIDE'];
                  return (
                    <div
                      key={guide.id}
                      onClick={() => handleOpenGuideDrawer(guide)}
                      className="flex flex-col items-center text-center cursor-pointer group shrink-0 w-24"
                      title={guide.fullName}
                    >
                      <div
                        className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-sm font-display text-forest overflow-hidden bg-forest/5 shadow-2xs group-hover:scale-105 transition-transform"
                        style={{ borderColor: currentEnv.color || '#1b3b2b' }}
                      >
                        {guide.avatarUrl ? (
                          <img
                            src={guide.avatarUrl}
                            alt={guide.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${currentEnv.color || '#1b3b2b'} 0%, #1b3b2b 100%)`
                            }}
                          >
                            <span>{getStudentInitials(guide.fullName)}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-forest text-[11px] mt-1.5 truncate max-w-full leading-tight group-hover:text-forest-light">
                        {guide.fullName.split(' ')[0]} {guide.fullName.split(' ')[1]?.[0]}.
                      </span>
                      <span className="text-[9px] text-muted-foreground font-medium truncate max-w-full">
                        {isLead ? 'Guía Titular' : roleConfig?.label || 'Docente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Col 2: Distribución por Rangos de Grados (Grades/Years - Montessori Compass) */}
            <div className="lg:col-span-4 space-y-3 lg:border-l lg:border-r lg:border-forest/10 lg:px-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-display text-forest flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-forest/70" />
                  Grados & Rangos de Edad
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempCustomGrades({ ...customGradeNames });
                    setIsGradeModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-forest/70 hover:text-forest hover:underline flex items-center gap-1 cursor-pointer"
                  title="Configurar nombres personalizados para los grados"
                >
                  <Settings className="w-3 h-3" />
                  <span>Configurar</span>
                </button>
              </div>

              {gradeDistribution.length === 0 ? (
                <div className="p-4 rounded-2xl bg-forest/[0.02] border border-dashed border-forest/15 text-center">
                  <p className="text-xs text-muted-foreground">Sin rangos asignados a este ambiente</p>
                </div>
              ) : (
                <div className={`grid ${gradeDistribution.length <= 2 ? 'grid-cols-2' : gradeDistribution.length === 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4'} gap-2`}>
                  {gradeDistribution.map((item) => (
                    <div
                      key={item.grade.id}
                      className="p-2.5 rounded-2xl bg-forest/[0.03] hover:bg-forest/[0.06] border border-forest/10 text-center flex flex-col items-center justify-center transition-colors group shadow-2xs"
                      title={`${item.grade.name}: ${item.grade.minAge} - ${item.grade.maxAge} años (${item.grade.description})`}
                    >
                      <span className="text-base sm:text-lg font-bold font-display text-forest leading-none group-hover:scale-110 transition-transform">
                        {item.count}
                      </span>
                      <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
                        {item.count === 1 ? 'alumno' : 'alumnos'}
                      </span>
                      <span className="text-[10px] font-bold text-forest-light mt-1.5 px-1.5 py-0.5 rounded-md bg-white border border-forest/10 shadow-2xs w-full truncate block font-mono">
                        {item.grade.name}
                      </span>
                      <span className="text-[8px] text-muted-foreground font-mono mt-0.5 truncate max-w-full">
                        {item.grade.minAge}-{item.grade.maxAge}a
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Col 3: Horario & Días de Operación (Schedule) */}
            <div className="lg:col-span-3 space-y-3">
              <span className="text-xs font-bold font-display text-forest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-forest/70" />
                Horario & Días
              </span>

              {/* Time Pill */}
              <div className="p-3 rounded-2xl bg-forest/[0.04] border border-forest/10 text-center">
                <span className="text-xs font-mono font-bold text-forest">
                  {currentEnv.start_time || '08:00'} - {currentEnv.end_time || '13:30'} hrs
                </span>
              </div>

              {/* Weekday Bubbles L M M J V S D */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[
                  { key: 'Lunes', short: 'L' },
                  { key: 'Martes', short: 'M' },
                  { key: 'Miércoles', short: 'M' },
                  { key: 'Jueves', short: 'J' },
                  { key: 'Viernes', short: 'V' },
                  { key: 'Sábado', short: 'S' },
                  { key: 'Domingo', short: 'D' },
                ].map((day) => {
                  const isActive = currentScheduleDays.includes(day.key);
                  return (
                    <div
                      key={day.key}
                      title={`${day.key}: ${isActive ? 'Abierto' : 'Cerrado'}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-2xs ${
                        isActive
                          ? 'bg-forest text-white shadow-xs scale-105'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {day.short}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 2. ALUMNOS MATRICULADOS (STUDENTS LIST) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-forest/10 pb-3">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-2xs">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-2xs"
                style={{ backgroundColor: currentEnv.color || '#1b3b2b' }}
              >
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-display text-forest leading-tight">
                  Alumnos Matriculados ({studentCount})
                </h2>
                <span className="text-[11px] text-muted-foreground block">
                  {studentCount} {studentCount === 1 ? 'estudiante activo' : 'estudiantes activos'} en este ambiente
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`${basePath}/admissions`)}
              className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Matricular (Admisiones)</span>
            </button>
          </div>

          <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pt-2.5 pb-4 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
            {/* 1st Position: Matricular Alumno Quick Tile -> Leads to Admissions Process */}
            <div
              onClick={() => navigate(`${basePath}/admissions`)}
              className="w-[165px] sm:w-auto shrink-0 sm:shrink snap-start flex flex-col items-center justify-center text-center p-4 sm:p-6 rounded-3xl bg-forest/[0.02] hover:bg-forest/5 border-2 border-dashed border-forest/20 hover:border-forest/40 hover:scale-[1.02] transition-all cursor-pointer group shadow-2xs"
              title="Iniciar proceso de admisión o matricular alumno"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-forest/30 group-hover:border-forest flex items-center justify-center text-forest/60 group-hover:text-forest group-hover:bg-forest/5 transition-all shadow-2xs">
                <UserPlus className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-forest text-xs sm:text-sm mt-3 truncate max-w-full leading-tight font-display group-hover:text-forest-light">
                + Matricular
              </h4>
              <span className="text-[10px] text-muted-foreground font-medium mt-1 block truncate max-w-full">
                Admisiones
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 bg-forest/10 text-forest border border-forest/20">
                Nuevo Alumno
              </span>
            </div>

            {currentEnvStudents.map((student) => {
              const studentAge = calculateAgeString(student.date_of_birth);
              const studentGrade = getStudentGradeYear(student, customGradeNames);

              return (
                <div
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentForDrawer(student);
                    setStudentDrawerOpen(true);
                  }}
                  className="w-[165px] sm:w-auto shrink-0 sm:shrink snap-start flex flex-col items-center text-center p-4 sm:p-6 rounded-3xl bg-white/70 hover:bg-white/95 backdrop-blur-xs border border-white/80 hover:border-forest/20 shadow-2xs hover:shadow-xs transition-all cursor-pointer group hover:scale-[1.02]"
                >
                  {/* Circle Avatar with Salon Border */}
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 flex items-center justify-center font-bold text-xl font-display text-forest overflow-hidden bg-forest/5 shrink-0 shadow-md group-hover:scale-105 group-hover:rotate-1 transition-transform"
                    style={{ borderColor: currentEnv.color || '#1b3b2b' }}
                  >
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-bold text-lg text-white"
                        style={{
                          background: `linear-gradient(135deg, ${currentEnv.color || '#1b3b2b'} 0%, #1b3b2b 100%)`
                        }}
                      >
                        {getStudentInitials(student.full_name)}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h4 className="font-bold text-forest text-xs sm:text-sm mt-3 truncate max-w-full leading-tight group-hover:text-forest/90">
                    {student.full_name}
                  </h4>

                  {/* Grade / Stage Pill */}
                  <span className="text-[10px] font-bold text-forest-light mt-1 px-2 py-0.5 rounded-md bg-forest/5 border border-forest/10 truncate max-w-full font-mono">
                    {studentGrade.name} {studentAge ? `• ${studentAge}` : ''}
                  </span>

                  {/* Status Pill */}
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 truncate max-w-full shadow-2xs ${
                      student.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {student.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. MATRÍCULA SEMANAL POR DÍA (ENROLLMENT BY DAY) */}
        <section className="space-y-4 pt-4 border-t border-forest/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest/10 pb-3">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/70 backdrop-blur-xs border border-white/80 shadow-2xs">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-2xs"
                style={{ backgroundColor: currentEnv.color || '#1b3b2b' }}
              >
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-display text-forest leading-tight">
                  Matrícula & Asistencia Semanal por Día
                </h2>
                <span className="text-[11px] text-muted-foreground block">
                  Distribución de cupos y lista de alumnos por cada día de operación
                </span>
              </div>
            </div>

            {/* Capacity summary pill */}
            <div className="flex items-center gap-2 text-xs font-medium text-forest/80 bg-white/75 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-white/80 shadow-2xs">
              <span>Capacidad: <strong className="font-bold text-forest">{capacity}</strong></span>
              <span className="text-forest/30">•</span>
              <span>Matriculados: <strong className="font-bold text-forest">{studentCount}</strong> ({occupancyPercent}%)</span>
              <span className="text-forest/30">•</span>
              <span className={capacity - studentCount <= 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                {capacity - studentCount > 0 ? `${capacity - studentCount} cupos libres` : 'Cupo completo'}
              </span>
            </div>
          </div>

          {/* Columns per operating day */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {currentScheduleDays.map((day) => {
              const availableSpots = Math.max(0, capacity - studentCount);
              return (
                <div
                  key={day}
                  className="rounded-3xl bg-white/80 hover:bg-white/95 backdrop-blur-xs border border-white/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col"
                >
                  {/* Day Column Header */}
                  <div className="p-4 pb-3 border-b border-forest/10 bg-forest/[0.02]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-sm text-forest">
                        {day}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest font-mono">
                        {studentCount} / {capacity}
                      </span>
                    </div>

                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                      <span>Ocupación: {occupancyPercent}%</span>
                      <span className={availableSpots > 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {availableSpots} {availableSpots === 1 ? 'disponible' : 'disponibles'}
                      </span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, occupancyPercent)}%`,
                          backgroundColor: currentEnv.color || '#1b3b2b'
                        }}
                      />
                    </div>
                  </div>

                  {/* Student List for this day */}
                  <div className="p-2.5 flex-1 divide-y divide-forest/5 max-h-[380px] overflow-y-auto no-scrollbar [scrollbar-width:none]">
                    {currentEnvStudents.length === 0 ? (
                      <div className="py-6 text-center text-muted-foreground text-[11px]">
                        Sin alumnos matriculados
                      </div>
                    ) : (
                      currentEnvStudents.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentForDrawer(student);
                            setStudentDrawerOpen(true);
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-forest/5 transition-colors cursor-pointer group"
                        >
                          <div
                            className="w-7 h-7 rounded-full border flex items-center justify-center font-bold text-[10px] overflow-hidden bg-forest/5 shrink-0 shadow-2xs"
                            style={{ borderColor: currentEnv.color || '#1b3b2b' }}
                          >
                            {student.avatar_url ? (
                              <img
                                src={student.avatar_url}
                                alt={student.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-forest text-[9px] font-bold">
                                {getStudentInitials(student.full_name)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-forest group-hover:text-forest-light truncate block leading-tight">
                              {student.full_name}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </>
        )}
        </div>

        {/* MODAL: CONFIGURAR NOMBRES DE GRADOS (GRADES/YEARS) */}
        {isGradeModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          >
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-forest/10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-forest/10 bg-forest/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-forest text-white flex items-center justify-center shadow-2xs">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-forest font-display">
                      Configuración de Grados (Grades/Years)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Personaliza los nombres que se mostrarán para cada rango de edad
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="w-7 h-7 rounded-xl hover:bg-forest/10 flex items-center justify-center text-muted-foreground hover:text-forest transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3 divide-y divide-forest/5 max-h-[60vh] no-scrollbar">
                {DEFAULT_GRADE_YEARS.map((g) => (
                  <div key={g.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-forest font-mono">{g.defaultName}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {g.minAge} - {g.maxAge} años
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {g.description}
                      </p>
                    </div>

                    <div className="w-36 shrink-0">
                      <input
                        type="text"
                        placeholder={g.defaultName}
                        value={tempCustomGrades[g.id] ?? g.defaultName}
                        onChange={(e) => {
                          setTempCustomGrades({
                            ...tempCustomGrades,
                            [g.id]: e.target.value
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-semibold text-forest"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 px-5 border-t border-forest/10 bg-slate-50/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setTempCustomGrades({});
                    setCustomGradeNames({});
                    saveCustomGradeNames({});
                    setIsGradeModalOpen(false);
                    toast.success('Nombres restablecidos a los valores por defecto');
                  }}
                  className="text-xs font-bold text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Restablecer por Defecto
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGradeModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomGradeNames(tempCustomGrades);
                      saveCustomGradeNames(tempCustomGrades);
                      setIsGradeModalOpen(false);
                      toast.success('Nombres de grados actualizados');
                    }}
                    className="px-5 py-2 text-xs font-bold bg-forest text-white hover:bg-forest/90 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DRAWER: ASIGNACIÓN DE DOCENTES AL SALÓN */}
        <SlideOverDrawer
          isOpen={isAssignTeachersDrawerOpen}
          onClose={() => setIsAssignTeachersDrawerOpen(false)}
          maxWidthClass="max-w-md lg:max-w-lg"
          icon={<GraduationCap className="w-5 h-5 text-forest" />}
          title="Asignar Equipo Docente"
          description={`Selecciona los docentes que pertenecen al salón ${currentEnv?.name || ''}`}
          footer={
            <div className="flex items-center justify-between w-full gap-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {selectedTeacherIdsForEnv.length} {selectedTeacherIdsForEnv.length === 1 ? 'docente asignado' : 'docentes asignados'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignTeachersDrawerOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTeacherAssignments}
                  disabled={savingTeacherAssignments}
                  className="px-5 py-2.5 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {savingTeacherAssignments ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Asignaciones</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-forest/40 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar docente por nombre o correo..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>

            {/* Instruction Banner */}
            <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 flex items-start gap-2.5 text-xs text-forest/90">
              <Info className="w-4 h-4 text-forest/70 shrink-0 mt-0.5" />
              <span>
                Marca o desmarca los docentes que forman parte del equipo pedagógico de <strong>{currentEnv?.name || 'este salón'}</strong>.
              </span>
            </div>

            {/* Teacher Selection List */}
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {guides
                .filter((g) => {
                  if (!teacherSearch) return true;
                  const q = teacherSearch.toLowerCase();
                  return (
                    g.fullName.toLowerCase().includes(q) ||
                    g.email.toLowerCase().includes(q) ||
                    (g.jobTitle && g.jobTitle.toLowerCase().includes(q))
                  );
                })
                .map((guide) => {
                  const isSelected = selectedTeacherIdsForEnv.includes(guide.id);
                  const roleConfig = STAFF_ROLES[guide.staffRole || 'LEAD_GUIDE'];
                  const otherEnvs = (guide.environments || []).filter((e) => e.id !== selectedEnvId);

                  return (
                    <div
                      key={guide.id}
                      onClick={() => handleToggleTeacherInEnv(guide.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-forest/5 border-forest ring-1 ring-forest/20 shadow-2xs'
                          : 'bg-white hover:bg-slate-50/80 border-forest/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Avatar */}
                        <div
                          className="w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold text-xs overflow-hidden bg-forest/5 shrink-0 shadow-2xs"
                          style={{ borderColor: isSelected ? (currentEnv?.color || '#1b3b2b') : '#cbd5e1' }}
                        >
                          {guide.avatarUrl ? (
                            <img src={guide.avatarUrl} alt={guide.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-forest">{getStudentInitials(guide.fullName)}</span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-forest text-xs truncate leading-tight">
                              {guide.fullName}
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-forest/10 text-forest">
                              {roleConfig?.label || 'Docente'}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {guide.email}
                          </p>
                          {otherEnvs.length > 0 && (
                            <p className="text-[10px] text-forest/70 truncate mt-0.5">
                              En otros salones: {otherEnvs.map((e) => e.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Checkbox / Toggle Status */}
                      <div className="shrink-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-forest border-forest text-white shadow-2xs'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </SlideOverDrawer>

        {/* DRAWER DE EDICIÓN DEL SALÓN */}
        {isDrawerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          >
            <div
              className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden transition-transform duration-300 ease-out border-l border-forest/10 animate-in slide-in-from-right"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-forest/10 bg-forest/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: color }}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-forest leading-tight">
                      {editingEnv ? 'Editar Ambiente / Salón' : 'Nuevo Ambiente'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configura el nombre, etapa y capacidad
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-forest/10 text-muted-foreground hover:text-forest transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <form id="environment-drawer-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Nombre del Ambiente *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Casa de Niños 1, Taller I, Erdkinder..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>

                  {/* Etapa */}
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Etapa Pedagógica
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Comunidad Infantil, Casa de Niños, Taller I, Secundaria..."
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>

                  {/* Rango de Edades */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-forest mb-1.5">
                        Edad Mínima (Años)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        placeholder="Ej. 3"
                        value={minAgeYears}
                        onChange={(e) => setMinAgeYears(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-forest mb-1.5">
                        Edad Máxima (Años)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        placeholder="Ej. 6"
                        value={maxAgeYears}
                        onChange={(e) => setMaxAgeYears(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>
                  </div>

                  {/* Capacidad */}
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Capacidad Máxima de Alumnos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="25"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>

                  {/* Horario y Días de Operación */}
                  <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-forest" />
                      <h4 className="font-bold text-xs text-forest uppercase tracking-wider font-display">
                        Horario & Días de Clases
                      </h4>
                    </div>

                    {/* Horas de Inicio y Fin */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-forest mb-1">
                          Hora de Inicio
                        </label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-mono shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-forest mb-1">
                          Hora de Término
                        </label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-mono shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Días de la semana */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[11px] font-bold text-forest">
                          Días en que abre
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setScheduleDays(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'])}
                            className="text-[10px] font-bold text-forest bg-white px-2 py-0.5 rounded-lg border border-forest/15 hover:bg-forest/5 cursor-pointer"
                          >
                            L - V
                          </button>
                          <button
                            type="button"
                            onClick={() => setScheduleDays(ALL_WEEKDAYS)}
                            className="text-[10px] font-bold text-forest bg-white px-2 py-0.5 rounded-lg border border-forest/15 hover:bg-forest/5 cursor-pointer"
                          >
                            Todos
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ALL_WEEKDAYS.map((day) => {
                          const isSelected = scheduleDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  // Don't allow empty
                                  if (scheduleDays.length > 1) {
                                    setScheduleDays(scheduleDays.filter((d) => d !== day));
                                  } else {
                                    toast.error('Debe haber al menos un día seleccionado');
                                  }
                                } else {
                                  setScheduleDays([...scheduleDays, day]);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                                isSelected
                                  ? 'bg-forest text-white'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span>{day}</span>
                              {isSelected && <Check className="w-3 h-3 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Color Preset Selector */}
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Color Distintivo del Ambiente
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setColor(preset)}
                          className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center shadow-2xs ${
                            color === preset ? 'ring-2 ring-forest scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: preset }}
                        >
                          {color === preset && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-7 h-7 rounded-xl border border-slate-200 cursor-pointer overflow-hidden p-0"
                        title="Personalizar color"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Descripción Pedagógica
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enfoque de este ambiente, materiales disponibles o características especiales..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                    />
                  </div>

                  {/* Foto de Portada / Ambiente */}
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Fotografía del Salón
                    </label>
                    <ImageUploadDropzone
                      value={coverImage}
                      onChange={(url) => setCoverImage(url || '')}
                      folder="environments"
                      previewSize="rect"
                      label="Subir foto del ambiente"
                    />
                  </div>

                  {/* Acceso Rápido a Materiales de este Salón */}
                  {editingEnv && (
                    <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-forest block">
                          Inventario de Materiales
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Registra fotos, clasifica y gestiona las habilidades de los materiales de este salón.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveEnvSubTab('materials');
                        }}
                        className="px-3.5 py-2 bg-forest text-white hover:bg-forest/90 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Ver Materiales</span>
                      </button>
                    </div>
                  )}
                </form>

                {/* ZONA DE PELIGRO (DANGER ZONE) - Solo si NO tiene alumnos activos */}
                {editingEnv && (
                  editingEnvActiveStudentsCount > 0 ? (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-amber-900 shadow-2xs">
                        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-[11px] space-y-1 leading-relaxed">
                          <p className="font-bold text-amber-900 text-xs font-display">
                            Salón protegido contra eliminación
                          </p>
                          <p className="text-amber-800/90">
                            Este salón cuenta con <strong className="font-bold text-amber-950">{editingEnvActiveStudentsCount} alumno{editingEnvActiveStudentsCount === 1 ? '' : 's'} en matrícula activa</strong>. Por integridad académica, no es posible eliminar salones con alumnos matriculados. Debes reasignarlos o egresarlos antes de poder eliminar el ambiente.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 pt-6 border-t border-rose-200">
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                        <div className="flex items-center gap-2 text-rose-800">
                          <AlertTriangle className="w-4 h-4" />
                          <h4 className="font-bold text-xs uppercase tracking-wider font-display">
                            Zona de Peligro
                          </h4>
                        </div>
                        <p className="text-[11px] text-rose-700 leading-relaxed">
                          Este salón no tiene estudiantes activos matriculados. Eliminar este ambiente desvinculará a los guías asignados. Esta acción no se puede deshacer.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDangerConfirmText('');
                            setIsDangerModalOpen(true);
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar este Ambiente</span>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Drawer Footer (Sticky) */}
              <div className="p-4 px-6 border-t border-forest/10 bg-white flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="environment-drawer-form"
                  className="px-7 py-2.5 text-xs font-bold bg-forest text-white hover:bg-forest/90 rounded-xl shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEnv ? 'Guardar Cambios' : 'Crear Ambiente'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DESTRUCTIVA CON INPUT ESCRITO (PORTAL EN FRENTE DEL DRAWER) */}
        {isDangerModalOpen &&
          createPortal(
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
              onClick={() => setIsDangerModalOpen(false)}
            >
              <div
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>

                <div className="text-center space-y-1.5">
                  <h3 className="font-bold font-display text-base text-rose-950">
                    ¿Eliminar ambiente definitivamente?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Estás a punto de eliminar el ambiente <strong>"{editingEnv?.name}"</strong>.
                    Esta acción es irreversible y desvinculará sus registros.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs text-slate-700 font-medium">
                    Para confirmar, escribe exactamente: <strong className="text-rose-700 select-all">Eliminar de forma definitiva</strong>
                  </label>
                  <input
                    type="text"
                    placeholder="Eliminar de forma definitiva"
                    value={dangerConfirmText}
                    onChange={(e) => setDangerConfirmText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-mono"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsDangerModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDangerDelete}
                    disabled={dangerConfirmText.trim() !== 'Eliminar de forma definitiva' || isDeleting}
                    className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* STUDENT DETAIL DRAWER */}
        <StudentDrawer
          isOpen={studentDrawerOpen}
          onClose={() => setStudentDrawerOpen(false)}
          student={selectedStudentForDrawer}
          environments={environments}
          onSaved={() => {
            fetchAllData();
            setStudentDrawerOpen(false);
          }}
        />

        {/* GUIDE / TEACHER DETAIL & EDIT DRAWER (SHARED COMPONENT) */}
        <GuideDrawer
          isOpen={guideDrawerOpen}
          onClose={() => setGuideDrawerOpen(false)}
          guide={selectedGuide}
          guidesList={guides}
          environments={environments}
          onSaved={() => {
            fetchAllData();
            setGuideDrawerOpen(false);
          }}
        />

        {/* Mobile Floating Action Button (FAB) for Edit Salon */}
        <button
          type="button"
          onClick={() => handleOpenEdit(currentEnv)}
          className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-forest/30 cursor-pointer"
          aria-label="Editar Salón"
          title="Editar Salón"
        >
          <Edit3 className="w-6 h-6 text-white" />
        </button>

      </div>
    );
  }

  // =========================================================================
  // PÁGINA PRINCIPAL: LISTA DE SALONES (/panel/environments)
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                  Ambientes & Salones
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {environments.length} {environments.length === 1 ? 'ambiente' : 'ambientes'}
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Estructura pedagógica de salones Montessori (Nido, Comunidad Infantil, Casa de Niños, Talleres), edades y capacidades.
              </p>
            </div>
          </div>

          {/* Action Button: Nuevo Ambiente */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="hidden sm:flex px-5 py-2.5 bg-white text-forest hover:bg-white/95 rounded-2xl font-display font-bold text-xs items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-forest" />
              <span>+ Nuevo Ambiente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State with Presets */}
      {!loading && environments.length === 0 && (
        <div className="bg-white/80 rounded-3xl p-8 text-center border border-forest/10 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-forest">No hay ambientes configurados</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Puedes crear tus propios salones desde cero o inicializar rápidamente con una plantilla predefinida:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleSeedPresets('montessori')}
              className="p-4 rounded-2xl border border-forest/20 hover:border-forest bg-forest/5 hover:bg-forest/10 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 font-bold text-forest text-xs mb-1">
                <Sparkles className="w-4 h-4 text-forest" />
                Plantilla Montessori
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Nido, Comunidad Infantil, Casa de Niños, Taller I, Taller II y Erdkinder.
              </p>
            </button>

            <button
              onClick={() => handleSeedPresets('traditional')}
              className="p-4 rounded-2xl border border-forest/20 hover:border-forest bg-forest/5 hover:bg-forest/10 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 font-bold text-forest text-xs mb-1">
                <Building className="w-4 h-4 text-forest" />
                Plantilla Tradicional
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Maternal, Kínder 1-3, Primaria y Secundaria.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Environments Grid (Cards clickeables sin botones de editar/eliminar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {environments.map((env) => {
          const studentCount = env.student_count || 0;
          const capacity = env.capacity || 25;
          const occupancyPercent = Math.min(100, Math.round((studentCount / capacity) * 100));

          return (
            <div
              key={env.id}
              onClick={() => navigate(`${basePath}/environments/${env.id}`)}
              className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-forest/10 shadow-card hover:shadow-md hover:border-forest/30 transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer"
            >
              {/* Color Top Line */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: env.color || '#1b3b2b' }}
              />

              <div>
                {/* Single Image Preview or Default Elegant Placeholder */}
                {env.cover_image ? (
                  <div className="mb-3.5 -mx-5 -mt-5 h-36 relative overflow-hidden bg-forest/5">
                    <img
                      src={env.cover_image}
                      alt={env.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div
                    className="mb-3.5 -mx-5 -mt-5 h-28 relative overflow-hidden flex flex-col items-center justify-center p-3 border-b border-forest/10 transition-colors"
                    style={{
                      background: `linear-gradient(135deg, ${env.color || '#1b3b2b'}18 0%, ${env.color || '#1b3b2b'}06 100%)`
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center mb-1 shadow-2xs border border-white/80 text-white transition-transform group-hover:scale-110 duration-300"
                      style={{ backgroundColor: env.color || '#1b3b2b' }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-forest/70 uppercase tracking-widest">
                      {env.stage || 'Ambiente Pedagógico'}
                    </span>
                  </div>
                )}

                {/* Stage Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: env.color || '#1b3b2b' }}
                  >
                    {env.stage || 'Ambiente'}
                  </span>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-forest group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="font-bold text-forest text-base group-hover:text-forest/90 transition-colors">
                  {env.name}
                </h3>

                {env.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {env.description}
                  </p>
                )}
              </div>

              {/* Meta Stats & Occupancy Bar */}
              <div className="mt-4 pt-3.5 border-t border-forest/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-forest/70" />
                    <span>
                      {env.min_age_years !== null && env.max_age_years !== null
                        ? `${env.min_age_years} - ${env.max_age_years} años`
                        : 'Edades no def.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-forest">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {studentCount} / {capacity}
                    </span>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${occupancyPercent}%`,
                      backgroundColor:
                        occupancyPercent > 90
                          ? '#e11d48'
                          : occupancyPercent > 70
                          ? '#f59e0b'
                          : env.color || '#1b3b2b',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DRAWER DE CREACIÓN */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden transition-transform duration-300 ease-out border-l border-forest/10 animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-forest/10 bg-forest/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: color }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-forest leading-tight">
                    Nuevo Ambiente
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configura el nombre, etapa y capacidad
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-forest/10 text-muted-foreground hover:text-forest transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <form id="environment-create-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Nombre del Ambiente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Casa de Niños 1, Taller I, Erdkinder..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Etapa Pedagógica
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Comunidad Infantil, Casa de Niños, Taller I, Secundaria..."
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Edad Mínima (Años)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      placeholder="Ej. 3"
                      value={minAgeYears}
                      onChange={(e) => setMinAgeYears(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Edad Máxima (Años)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      placeholder="Ej. 6"
                      value={maxAgeYears}
                      onChange={(e) => setMaxAgeYears(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Capacidad Máxima de Alumnos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="25"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Color Distintivo del Ambiente
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setColor(preset)}
                        className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center shadow-2xs ${
                          color === preset ? 'ring-2 ring-forest scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset }}
                      >
                        {color === preset && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-7 h-7 rounded-xl border border-slate-200 cursor-pointer overflow-hidden p-0"
                      title="Personalizar color"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Descripción Pedagógica
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enfoque de este ambiente, materiales disponibles o características especiales..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Fotografía del Salón
                  </label>
                  <ImageUploadDropzone
                    value={coverImage}
                    onChange={(url) => setCoverImage(url || '')}
                    folder="environments"
                    previewSize="rect"
                    label="Subir foto del ambiente"
                  />
                </div>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 px-6 border-t border-forest/10 bg-white flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="environment-create-form"
                className="px-7 py-2.5 text-xs font-bold bg-forest text-white hover:bg-forest/90 rounded-xl shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Crear Ambiente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={handleOpenCreate}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-forest/30"
        aria-label="Nuevo Ambiente"
        title="Nuevo Ambiente"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default EnvironmentsSection;
