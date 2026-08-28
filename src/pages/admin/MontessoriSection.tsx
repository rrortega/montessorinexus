import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  Eye,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Save,
  User,
  X,
  Filter,
  HeartHandshake,
  FileText,
  Camera,
  Check,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoveHorizontal,
  ChevronDown,
  Info,
  TrendingUp,
  Pencil,
  UserCheck,
  UserX,
  CheckCheck,
  PlayCircle,
  RotateCcw,
  Percent,
  Star,
  Award,
  Flame,
  Zap,
  Heart,
  Target,
  ShieldCheck,
  CheckSquare,
  Play,
  Pause
} from 'lucide-react';
import { MobileMenuButton, useAdminDashboard } from './AdminDashboard';
import {
  EnvironmentItem,
  StudentItem,
  MontessoriAreaItem,
  StudentProgressItem,
  StudentObservationItem,
  StudentAttendanceItem,
  AssessmentScaleItem,
  AssessmentDisplayMode,
  DEFAULT_ASSESSMENT_SCALES,
  getAssessmentSettings,
  getEnvironments,
  getStudents,
  getMontessoriCurriculum,
  getMontessoriProgress,
  saveMontessoriProgress,
  getMontessoriObservations,
  createMontessoriObservation,
  getMontessoriAttendance,
  saveMontessoriAttendance,
  uploadFile,
  TrackerCategoryItem,
  getTrackerCategories,
  EnvironmentMaterialItem,
  getEnvironmentMaterials
} from '@/lib/sqlite';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { StudentProgressReportDrawer } from '@/components/admin/StudentProgressReportDrawer';
import { StudentEvolutionTimelineDrawer } from '@/components/admin/StudentEvolutionTimelineDrawer';
import { StudentCharacterizationMatrixDrawer } from '@/components/admin/StudentCharacterizationMatrixDrawer';
import { CharacterizationFormDrawer } from '@/components/admin/CharacterizationFormDrawer';
import { MontessoriLessonDrawer } from '@/components/admin/MontessoriLessonDrawer';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { StudentCharacterizationItem } from '@/lib/sqlite';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// MONTESSORI COMPASS PROGRESSION GLYPHS
const MontessoriSlash: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="7" y1="17" x2="17" y2="7" />
  </svg>
);

const MontessoriCaret: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 15 12 7 18 15" />
  </svg>
);

const MontessoriTriangleOutline: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 4 20 19 4 19" />
  </svg>
);

const MontessoriTriangleFilled: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" className={className}>
    <polygon points="12 4 20 19 4 19" />
  </svg>
);

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MontessoriSlash,
  MontessoriCaret,
  MontessoriTriangleOutline,
  MontessoriTriangleFilled,
  Sparkles,
  PlayCircle,
  CheckCircle2,
  RotateCcw,
  Eye,
  Star,
  Award,
  Flame,
  Zap,
  Heart,
  Target,
  Compass,
  BookOpen,
  Check,
  ShieldCheck,
  Clock
};

type ActiveView = 'record_keeping' | 'observations';
type TrackingType = 'work_cycle' | 'lessons' | 'trackers' | 'growth';
type CycleStateKey = 'deep_flow' | 'presentation' | 'autonomous' | 'grace_courtesy' | 'exploring';

interface StudentCycleState {
  state: CycleStateKey;
  areaName: string;
  materialName: string;
  lessonId?: string;
  minutesInFlow: number;
  notes?: string;
}

const CYCLE_STATE_CONFIG: Record<CycleStateKey, {
  label: string;
  shortLabel: string;
  color: string;
  bgLight: string;
  textLight: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}> = {
  deep_flow: {
    label: 'Concentración Profunda',
    shortLabel: 'En Flujo',
    color: '#C4661F',
    bgLight: 'bg-[#C4661F]/15',
    textLight: 'text-[#C4661F]',
    border: 'border-[#C4661F]/30',
    icon: Flame,
    desc: 'Abstraído en material, repetición y gozo intrínseco'
  },
  presentation: {
    label: 'Lección / Presentación',
    shortLabel: 'Presentación',
    color: '#059669',
    bgLight: 'bg-emerald-500/15',
    textLight: 'text-emerald-700',
    border: 'border-emerald-500/30',
    icon: PlayCircle,
    desc: 'Lección de 3 tiempos individual o en pequeño grupo'
  },
  autonomous: {
    label: 'Trabajo Autónomo',
    shortLabel: 'Autónomo',
    color: '#0284c7',
    bgLight: 'bg-sky-500/15',
    textLight: 'text-sky-700',
    border: 'border-sky-500/30',
    icon: CheckCircle2,
    desc: 'Secuencia completa con control de error independiente'
  },
  grace_courtesy: {
    label: 'Gracia y Cortesía',
    shortLabel: 'Gracia & Cortesía',
    color: '#d97706',
    bgLight: 'bg-amber-500/15',
    textLight: 'text-amber-800',
    border: 'border-amber-500/30',
    icon: HeartHandshake,
    desc: 'Merienda, conversación respetuosa, cuidado comunitario'
  },
  exploring: {
    label: 'Eligiendo Trabajo',
    shortLabel: 'Observando',
    color: '#64748b',
    bgLight: 'bg-slate-500/15',
    textLight: 'text-slate-700',
    border: 'border-slate-500/30',
    icon: Compass,
    desc: 'Caminando por el ambiente seleccionando material'
  }
};

interface GrowthSkillItem {
  id: string;
  category: string;
  name: string;
  description: string;
  color: string;
}

const getStudentShortGivenName = (fullName: string): string => {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return fullName;
  if (words.length === 2) return words[0]; // e.g. "Mateo Garcia" -> "Mateo"
  // If 3 or more words (e.g. "Raul Jesus Perez Gomez" or "Juana de la Caridad Garcia Lopez"),
  // remove the last 2 words (typically paternal & maternal surnames) and keep the given names.
  return words.slice(0, words.length - 2).join(' ');
};

const DEFAULT_GROWTH_SKILLS: GrowthSkillItem[] = [
  {
    id: 'growth_autonomy',
    category: 'Independencia & Voluntad',
    name: 'Autonomía en la Elección de Trabajo',
    description: 'El niño selecciona espontáneamente materiales con propósito y trabaja con concentración sostenida.',
    color: '#10b981'
  },
  {
    id: 'growth_focus',
    category: 'Concentración & Flujo',
    name: 'Período de Concentración Profunda',
    description: 'Capacidad de abstraerse en una tarea constructiva repitiendo el ciclo de actividad sin distraerse.',
    color: '#0284c7'
  },
  {
    id: 'growth_grace_courtesy',
    category: 'Socialización & Comunidad',
    name: 'Gracia y Cortesía / Empatía',
    description: 'Trato respetuoso, modulación de voz, cuidado de las interacciones con sus pares y respeto por el trabajo ajeno.',
    color: '#f59e0b'
  },
  {
    id: 'growth_self_regulation',
    category: 'Autorregulación Emocional',
    name: 'Gestión de la Frustración y Esfuerzo',
    description: 'Reconoce sus emociones, acepta el control de error sin desánimo y pide ayuda oportunamente.',
    color: '#8b5cf6'
  },
  {
    id: 'growth_environment_care',
    category: 'Cuidado del Entorno',
    name: 'Restauración del Ambiente',
    description: 'Guarda cada objeto en su lugar exacto, limpia su espacio y mantiene el orden estético del salón.',
    color: '#14b8a6'
  },
  {
    id: 'growth_collaboration',
    category: 'Socialización & Comunidad',
    name: 'Iniciativa y Ayuda Mutua',
    description: 'Muestra disposición solidaria para apoyar a compañeros más pequeños o colaborar en proyectos grupales.',
    color: '#ec4899'
  }
];

export const MontessoriSection: React.FC = () => {
  const { role, user, activeMembership } = useAuth();
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN';
  const permissions: string[] = (activeMembership as any)?.permissions || [];
  const hasGlobalProgressPermission = isOwnerOrAdmin || permissions.includes('montessori:write') || permissions.includes('montessori:read') || permissions.includes('trackers:write') || permissions.includes('trackers:read');
  const isAdmin = isOwnerOrAdmin;
  const confirm = useConfirm();
  const [activeView, setActiveView] = useState<ActiveView>('record_keeping');
  const [trackingType, setTrackingType] = useState<TrackingType>('work_cycle');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Work Cycle Live State (Off by default if trial expired / read only)
  const [cycleRunning, setCycleRunning] = useState<boolean>(() => !isReadOnly);
  const [cycleSeconds, setCycleSeconds] = useState<number>(3900); // 1h 05m in
  const [studentCycleMap, setStudentCycleMap] = useState<Record<string, StudentCycleState>>({});
  const [cycleFilterState, setCycleFilterState] = useState<string>('all');
  const [cycleFilterArea, setCycleFilterArea] = useState<string>('all');
  const [materialPickerStudentId, setMaterialPickerStudentId] = useState<string | null>(null);
  const [materialPickerSearch, setMaterialPickerSearch] = useState<string>('');

  // Assessment Scales Configuration
  const [assessmentScales, setAssessmentScales] = useState<AssessmentScaleItem[]>(DEFAULT_ASSESSMENT_SCALES);
  const [displayMode, setDisplayMode] = useState<AssessmentDisplayMode>('circles');

  // Core Data
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);

  // Environments allowed for the active user based on assignments & permissions
  const allowedEnvironments = useMemo(() => {
    if (hasGlobalProgressPermission) return environments;
    return environments.filter(env => {
      if (!user?.id) return false;
      const inGuides = env.guides?.some(g => g.userId === user.id);
      const inGuideIds = env.guideIds?.includes(user.id);
      return inGuides || inGuideIds;
    });
  }, [environments, hasGlobalProgressPermission, user?.id]);
  const [selectedEnvId, setSelectedEnvId] = useState<string>('');
  const [isMobileEnvOpen, setIsMobileEnvOpen] = useState(false);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [curriculum, setCurriculum] = useState<MontessoriAreaItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [progressRecords, setProgressRecords] = useState<StudentProgressItem[]>([]);
  const [trackerCategories, setTrackerCategories] = useState<TrackerCategoryItem[]>([]);
  const [observations, setObservations] = useState<StudentObservationItem[]>([]);
  const [attendances, setAttendances] = useState<StudentAttendanceItem[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [environmentMaterials, setEnvironmentMaterials] = useState<EnvironmentMaterialItem[]>([]);

  useEffect(() => {
    if (selectedEnvId) {
      getEnvironmentMaterials(selectedEnvId).then(setEnvironmentMaterials);
    } else {
      setEnvironmentMaterials([]);
    }
  }, [selectedEnvId]);

  // Work Cycle Live Timer
  useEffect(() => {
    if (isReadOnly) {
      setCycleRunning(false);
    }
  }, [isReadOnly]);

  useEffect(() => {
    let interval: any = null;
    if (cycleRunning && !isReadOnly) {
      interval = setInterval(() => {
        setCycleSeconds(prev => (prev < 10800 ? prev + 1 : prev));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cycleRunning, isReadOnly]);

  // Seed student cycle state based on real classroom materials
  useEffect(() => {
    if (students.length > 0) {
      setStudentCycleMap(prev => {
        const updated = { ...prev };
        const activeEnvMats = environmentMaterials.filter(m => m.isActive !== false);

        students.forEach((st, idx) => {
          if (!updated[st.id]) {
            const defaultMat = activeEnvMats.length > 0 ? activeEnvMats[idx % activeEnvMats.length] : null;
            updated[st.id] = {
              state: 'autonomous',
              areaName: defaultMat?.areaName || 'Sensorial',
              materialName: defaultMat?.name || '',
              lessonId: defaultMat?.id,
              minutesInFlow: 0,
              notes: ''
            };
          }
        });
        return updated;
      });
    }
  }, [students, environmentMaterials]);

  // Format seconds to HH:MM:SS
  const formatCycleTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Compute Active Montessori Work Cycle Phase
  const cyclePhaseInfo = useMemo(() => {
    if (cycleSeconds < 3600) {
      return {
        number: 1,
        title: 'Fase 1: Integración & Calentamiento',
        desc: 'Llegada, saludos y primeros trabajos conocidos de Vida Práctica.',
        color: '#0284c7',
        badgeBg: 'bg-sky-500/15 text-sky-700 border-sky-500/25',
        progressPercent: (cycleSeconds / 3600) * 33
      };
    }
    if (cycleSeconds < 5400) {
      return {
        number: 2,
        title: 'Fase 2: Falsa Fatiga Normalizada',
        desc: 'Inquietud temporal documentada por María Montessori. La guía observa sin interrumpir.',
        color: '#d97706',
        badgeBg: 'bg-amber-500/15 text-amber-800 border-amber-500/25',
        progressPercent: 33 + ((cycleSeconds - 3600) / 1800) * 17
      };
    }
    if (cycleSeconds < 9900) {
      return {
        number: 3,
        title: 'Fase 3: Gran Trabajo ★ Concentración Máxima',
        desc: 'Pico de máxima concentración profunda y elección de materiales desafiantes.',
        color: '#C4661F',
        badgeBg: 'bg-[#C4661F]/15 text-[#C4661F] border-[#C4661F]/30',
        progressPercent: 50 + ((cycleSeconds - 5400) / 4500) * 41
      };
    }
    return {
      number: 4,
      title: 'Fase 4: Orden, Gracia y Cortesía',
      desc: 'Restauración completa del ambiente, guardado de materiales y serenidad comunitaria.',
      color: '#059669',
      badgeBg: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25',
      progressPercent: 91 + ((cycleSeconds - 9900) / 900) * 9
    };
  }, [cycleSeconds]);



  // Trackers & Growth in-memory logs
  const [dailyTrackerLogs, setDailyTrackerLogs] = useState<Record<string, {
    value: 'YES' | 'NO';
    date?: string;
    photoUrl?: string;
    publicNotes?: string;
    privateNotes?: string;
    updatedAt?: string;
  }>>({});
  const [dailyGrowthLogs, setDailyGrowthLogs] = useState<Record<string, { level: number; notes?: string }>>({});

  // Modal: Update Progress Cell
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [modalStudent, setModalStudent] = useState<StudentItem | null>(null);
  const [modalLesson, setModalLesson] = useState<any | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('PRESENTED');
  const [modalNotes, setModalNotes] = useState('');
  const [modalDate, setModalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savingProgress, setSavingProgress] = useState(false);

  // Modal: Trackers Entry Drawer
  const [trackerDrawerOpen, setTrackerDrawerOpen] = useState(false);
  const [modalTrackerStudent, setModalTrackerStudent] = useState<StudentItem | null>(null);
  const [modalTrackerItem, setModalTrackerItem] = useState<any | null>(null);
  const [modalTrackerCategory, setModalTrackerCategory] = useState<string>('');
  const [modalTrackerValue, setModalTrackerValue] = useState<'YES' | 'NO'>('YES');
  const [modalTrackerDate, setModalTrackerDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [modalTrackerPhotoUrl, setModalTrackerPhotoUrl] = useState('');
  const [modalTrackerPublicNote, setModalTrackerPublicNote] = useState('');
  const [modalTrackerPrivateNote, setModalTrackerPrivateNote] = useState('');
  const [savingTracker, setSavingTracker] = useState(false);

  // Modal: Create Observation
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsStudentId, setObsStudentId] = useState('');
  const [obsContent, setObsContent] = useState('');
  const [obsPhotoUrl, setObsPhotoUrl] = useState('');
  const [obsIsPublic, setObsIsPublic] = useState(false);
  const [savingObs, setSavingObs] = useState(false);

  // Lesson Detail / Purpose Modal
  const [selectedLessonForDetail, setSelectedLessonForDetail] = useState<any | null>(null);

  // Progress Report Drawer State
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);
  const [reportStudentId, setReportStudentId] = useState<string | null>(null);

  // Student Evolution Timeline State
  const [evolutionDrawerOpen, setEvolutionDrawerOpen] = useState(false);
  const [evolutionStudent, setEvolutionStudent] = useState<StudentItem | null>(null);

  // 360° Characterization Drawers State
  const [matrixDrawerOpen, setMatrixDrawerOpen] = useState(false);
  const [matrixStudent, setMatrixStudent] = useState<StudentItem | null>(null);
  const [matrixRefreshTrigger, setMatrixRefreshTrigger] = useState(0);
  const [charFormDrawerOpen, setCharFormDrawerOpen] = useState(false);
  const [charFormStudent, setCharFormStudent] = useState<StudentItem | null>(null);
  const [charEditingItem, setCharEditingItem] = useState<StudentCharacterizationItem | null>(null);

  // Montessori Lesson (Ficha de Trabajo) Drawer State
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [defaultLessonAreaId, setDefaultLessonAreaId] = useState<string>('');
  const [defaultLessonCategoryId, setDefaultLessonCategoryId] = useState<string>('');

  // Mobile Student Actions Bottom Sheet State
  const [mobileStudentSheet, setMobileStudentSheet] = useState<StudentItem | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetTouchStartY, setSheetTouchStartY] = useState<number | null>(null);

  // Mobile Salon Selector Drawer Drag State & Handlers
  const [envSheetDragY, setEnvSheetDragY] = useState(0);
  const [isEnvDragging, setIsEnvDragging] = useState(false);
  const envTouchStartYRef = React.useRef(0);

  // Horizontal Matrix Table Drag-to-Scroll State (Desktop Mouse Drag & Mobile Touch)
  const matrixTableRef = React.useRef<HTMLDivElement>(null);
  const [isMatrixPanning, setIsMatrixPanning] = useState(false);
  const matrixPanStartX = React.useRef(0);
  const matrixPanScrollLeft = React.useRef(0);
  const hasDraggedRef = React.useRef(false);

  const handleMatrixMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;
    if (!matrixTableRef.current) return;
    setIsMatrixPanning(true);
    hasDraggedRef.current = false;
    matrixPanStartX.current = e.pageX - matrixTableRef.current.offsetLeft;
    matrixPanScrollLeft.current = matrixTableRef.current.scrollLeft;
  };

  const handleMatrixMouseMove = (e: React.MouseEvent) => {
    if (!isMatrixPanning || !matrixTableRef.current) return;
    const x = e.pageX - matrixTableRef.current.offsetLeft;
    const walk = (x - matrixPanStartX.current) * 1.2;
    if (Math.abs(x - matrixPanStartX.current) > 5) {
      hasDraggedRef.current = true;
    }
    matrixTableRef.current.scrollLeft = matrixPanScrollLeft.current - walk;
  };

  const handleMatrixMouseUpOrLeave = () => {
    setIsMatrixPanning(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 80);
  };

  const handleEnvTouchStart = (e: React.TouchEvent) => {
    envTouchStartYRef.current = e.touches[0].clientY;
    setIsEnvDragging(true);
  };

  const handleEnvTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - envTouchStartYRef.current;
    if (diff > 0) {
      setEnvSheetDragY(diff);
    }
  };

  const handleEnvTouchEnd = () => {
    setIsEnvDragging(false);
    if (envSheetDragY > 40) {
      setIsMobileEnvOpen(false);
    }
    setEnvSheetDragY(0);
  };

  const loadData = async () => {
    setLoading(true);
    const [envsData, studentsData, curData, assessmentData, trackersData] = await Promise.all([
      getEnvironments(),
      getStudents(),
      getMontessoriCurriculum(),
      getAssessmentSettings(),
      getTrackerCategories()
    ]);
    setEnvironments(envsData);
    setStudents(studentsData);
    setCurriculum(curData);
    setTrackerCategories(trackersData);
    if (assessmentData?.scales && assessmentData.scales.length > 0) {
      setAssessmentScales(assessmentData.scales);
    }
    if (assessmentData?.displayMode) {
      setDisplayMode(assessmentData.displayMode);
    }

    const permittedEnvs = hasGlobalProgressPermission
      ? envsData
      : envsData.filter((env: any) => {
          if (!user?.id) return false;
          const inGuides = env.guides?.some((g: any) => g.userId === user.id);
          const inGuideIds = env.guideIds?.includes(user.id);
          return inGuides || inGuideIds;
        });

    const initialEnv = permittedEnvs.length > 0 ? permittedEnvs[0].id : '';
    setSelectedEnvId(initialEnv);
    if (curData.length > 0) setSelectedAreaId(curData[0].id);

    if (initialEnv) {
      const [progData, obsData, attData] = await Promise.all([
        getMontessoriProgress({ environmentId: initialEnv }),
        getMontessoriObservations(),
        getMontessoriAttendance({ environmentId: initialEnv, date: attendanceDate })
      ]);
      setProgressRecords(progData);
      setObservations(obsData);
      setAttendances(attData);
    } else {
      setProgressRecords([]);
      setObservations([]);
      setAttendances([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentEnvStudents = useMemo(() => {
    if (!selectedEnvId || allowedEnvironments.length === 0) return [];
    return students.filter(s => s.environment_id === selectedEnvId);
  }, [students, selectedEnvId, allowedEnvironments]);

  const selectedArea = useMemo(() => {
    return curriculum.find(a => a.id === selectedAreaId) || curriculum[0];
  }, [curriculum, selectedAreaId]);

  const flatLessonsInSelectedArea = useMemo(() => {
    if (!selectedArea) return [];
    const list: any[] = [];

    // 1. Add active custom materials registered for this specific environment
    const customAreaMats = environmentMaterials.filter(m =>
      m.isActive !== false &&
      (m.areaName.toLowerCase() === selectedArea.name.toLowerCase() ||
       selectedArea.name.toLowerCase().includes(m.areaName.toLowerCase()) ||
       m.areaName.toLowerCase().includes(selectedArea.slug.toLowerCase()))
    );

    for (const mat of customAreaMats) {
      list.push({
        id: mat.id,
        name: mat.name,
        categoryName: mat.categoryName || 'Material del Salón',
        photoUrl: mat.photoUrl,
        description: mat.description,
        pedagogicalPurpose: mat.pedagogicalPurpose,
        skillsDeveloped: mat.skillsDeveloped,
        isCustomMaterial: true
      });
    }

    // 2. Add standard curriculum lessons
    for (const cat of selectedArea.categories || []) {
      for (const les of cat.lessons || []) {
        if (!list.some(item => item.name.toLowerCase() === les.name.toLowerCase())) {
          list.push({
            ...les,
            categoryName: cat.name
          });
        }
      }
    }
    return list;
  }, [selectedArea, environmentMaterials]);



  // Reload progress when selected environment changes
  useEffect(() => {
    if (selectedEnvId) {
      getMontessoriProgress({ environmentId: selectedEnvId }).then(setProgressRecords);
      getMontessoriAttendance({ environmentId: selectedEnvId, date: attendanceDate }).then(setAttendances);
    }
  }, [selectedEnvId, attendanceDate]);

  // Lookup progress record
  const getStudentLessonRecord = (studentId: string, lessonId: string) => {
    return progressRecords.find(p => p.studentId === studentId && p.lessonId === lessonId);
  };

  // Resolve scale config by status code, id or acronym
  const getScaleConfig = (status: string): AssessmentScaleItem | null => {
    if (!status) return null;
    const found = assessmentScales.find(
      s => s.code === status || s.id === status || s.label.toLowerCase() === status.toLowerCase() || s.acronym === status
    );
    if (found) return found;

    const fallback = DEFAULT_ASSESSMENT_SCALES.find(s => s.code === status || s.id === status);
    if (fallback) return fallback;

    return {
      id: status,
      code: status,
      label: status,
      acronym: status.substring(0, 2).toUpperCase(),
      color: '#0284c7',
      icon: 'Sparkles',
      description: ''
    };
  };

  // Render visual indicator based on active displayMode
  const renderProgressVisual = (scale: AssessmentScaleItem | null, size: 'sm' | 'md' = 'sm') => {
    if (!scale) {
      return <span className="w-2 h-2 rounded-full bg-forest/15 inline-block mx-auto" />;
    }

    const IconComp = (scale.icon && ICON_MAP[scale.icon]) ? ICON_MAP[scale.icon] : Sparkles;

    switch (displayMode) {
      case 'circles':
        return (
          <div
            className={`${size === 'sm' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5'} rounded-full shadow-2xs mx-auto transition-transform hover:scale-110`}
            style={{ backgroundColor: scale.color }}
            title={`${scale.label} (${scale.acronym})`}
          />
        );
      case 'letters':
        return (
          <span
            className={`font-mono font-black ${size === 'sm' ? 'text-xs' : 'text-sm'} inline-flex items-center justify-center transition-transform hover:scale-110`}
            style={{ color: scale.color }}
            title={`${scale.label} (${scale.acronym})`}
          >
            {scale.acronym}
          </span>
        );
      case 'icons':
        return (
          <span
            className="inline-flex items-center justify-center transition-transform hover:scale-110"
            style={{ color: scale.color }}
            title={`${scale.label} (${scale.acronym})`}
          >
            <IconComp className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} stroke-[2.5]`} />
          </span>
        );
      case 'badges':
        return (
          <span
            className={`inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl ${size === 'sm' ? 'text-[9px] sm:text-[10px]' : 'text-xs'} font-bold text-white shadow-2xs whitespace-nowrap`}
            style={{ backgroundColor: scale.color }}
            title={`${scale.label} (${scale.acronym})`}
          >
            <IconComp className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">{scale.label}</span>
          </span>
        );
    }
  };

  const handleOpenCell = (student: StudentItem, lesson: any) => {
    const existing = getStudentLessonRecord(student.id, lesson.id);

    // Enrich lesson with environment material data if matched
    const matchedEnvMat = environmentMaterials.find(
      m => m.id === lesson.id || m.name.toLowerCase() === lesson.name?.toLowerCase()
    );
    const enrichedLesson = matchedEnvMat
      ? {
          ...lesson,
          photoUrl: matchedEnvMat.photoUrl || lesson.photoUrl,
          description: matchedEnvMat.description || lesson.description,
          pedagogicalPurpose: matchedEnvMat.pedagogicalPurpose || lesson.pedagogicalPurpose,
          skillsDeveloped: matchedEnvMat.skillsDeveloped || lesson.skillsDeveloped,
          categoryName: matchedEnvMat.categoryName || lesson.categoryName
        }
      : lesson;

    setModalStudent(student);
    setModalLesson(enrichedLesson);
    setModalStatus(existing?.status || 'PRESENTED');
    setModalNotes(existing?.notes || '');
    if (existing?.presentedAt) {
      setModalDate(new Date(existing.presentedAt).toISOString().split('T')[0]);
    } else {
      setModalDate(attendanceDate);
    }
    setProgressModalOpen(true);
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerBlockedAction('Registrar presentaciones o avances de lecciones');
      return;
    }
    if (!modalStudent || !modalLesson) return;

    setSavingProgress(true);
    try {
      await saveMontessoriProgress({
        studentId: modalStudent.id,
        lessonId: modalLesson.id,
        status: modalStatus,
        notes: modalNotes.trim(),
        presentedAt: modalDate ? new Date(`${modalDate}T12:00:00.000Z`).toISOString() : undefined
      });
      toast.success(`Progreso actualizado para ${modalStudent.full_name}`);
      setProgressModalOpen(false);
      // Refresh
      const updated = await getMontessoriProgress({ environmentId: selectedEnvId });
      setProgressRecords(updated);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar progreso');
    } finally {
      setSavingProgress(false);
    }
  };

  // Compute Normalization & Area Statistics in Environment
  const cycleMetrics = useMemo(() => {
    const total = currentEnvStudents.length || 1;
    let inFlowCount = 0;
    const areasCount: Record<string, number> = {
      'Vida Práctica': 0,
      'Sensorial': 0,
      'Lenguaje': 0,
      'Matemáticas': 0,
      'Estudios Cósmicos & Ciencias': 0
    };

    currentEnvStudents.forEach(st => {
      const entry = studentCycleMap[st.id];
      if (entry) {
        if (entry.state === 'deep_flow' || entry.state === 'autonomous' || entry.state === 'presentation') {
          inFlowCount++;
        }
        if (areasCount[entry.areaName] !== undefined) {
          areasCount[entry.areaName]++;
        } else {
          areasCount['Vida Práctica']++;
        }
      }
    });

    const normalizationRate = Math.round((inFlowCount / total) * 100);
    return {
      total,
      inFlowCount,
      normalizationRate,
      areasCount
    };
  }, [currentEnvStudents, studentCycleMap]);

  // Update specific student cycle state
  const handleUpdateStudentCycle = (studentId: string, updates: Partial<StudentCycleState>) => {
    if (isReadOnly) {
      triggerBlockedAction('Actualizar el ciclo de trabajo en vivo');
      return;
    }
    setStudentCycleMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          state: 'deep_flow',
          areaName: 'Sensorial',
          materialName: 'Torre Rosa',
          minutesInFlow: 15
        }),
        ...updates
      }
    }));
  };

  // Open drawer/modal from cycle card for real progress saving
  const handleOpenCycleModal = (student: StudentItem) => {
    const entry = studentCycleMap[student.id];
    let targetLesson: any = null;

    // 0. Match by environment material of this salon first
    const envMat = environmentMaterials.find(
      m => m.id === entry?.lessonId || m.name.toLowerCase() === entry?.materialName?.toLowerCase()
    );
    if (envMat) {
      targetLesson = {
        id: envMat.id,
        name: envMat.name,
        categoryName: envMat.categoryName || 'Material del Salón',
        areaName: envMat.areaName,
        photoUrl: envMat.photoUrl,
        description: envMat.description,
        pedagogicalPurpose: envMat.pedagogicalPurpose,
        skillsDeveloped: envMat.skillsDeveloped,
        isCustomMaterial: true
      };
    }

    // 1. Match by exact lessonId from pre-registered materials
    if (!targetLesson && entry?.lessonId) {
      for (const area of curriculum) {
        for (const cat of area.categories || []) {
          for (const les of cat.lessons || []) {
            if (les.id === entry.lessonId) {
              targetLesson = { ...les, categoryName: cat.name, areaName: area.name };
              break;
            }
          }
          if (targetLesson) break;
        }
        if (targetLesson) break;
      }
    }

    // 2. Fallback match by materialName in curriculum
    if (!targetLesson && entry?.materialName) {
      for (const area of curriculum) {
        for (const cat of area.categories || []) {
          for (const les of cat.lessons || []) {
            if (les.name.toLowerCase().includes(entry.materialName.toLowerCase())) {
              targetLesson = { ...les, categoryName: cat.name, areaName: area.name };
              break;
            }
          }
          if (targetLesson) break;
        }
        if (targetLesson) break;
      }
    }

    // 3. Fallback to first available lesson in curriculum
    if (!targetLesson && curriculum[0]?.categories?.[0]?.lessons?.[0]) {
      const firstCat = curriculum[0].categories[0];
      targetLesson = { ...firstCat.lessons[0], categoryName: firstCat.name };
    }

    if (targetLesson) {
      handleOpenCell(student, targetLesson);
    } else {
      setObsStudentId(student.id);
      setObsContent(`Observación de Ciclo de 3h: ${entry?.materialName || 'Material activo'} (${entry?.areaName || 'Área Montessori'}) durante ${entry?.minutesInFlow || 15} minutos.`);
      setObsModalOpen(true);
    }
  };

  const handleOpenTrackerCell = (student: StudentItem, item: any, categoryName: string) => {
    const targetDate = attendanceDate;
    const key = `${item.id}_${student.id}_${targetDate}`;
    const existing = dailyTrackerLogs[key];
    setModalTrackerStudent(student);
    setModalTrackerItem(item);
    setModalTrackerCategory(categoryName);
    setModalTrackerValue(existing?.value === 'NO' ? 'NO' : 'YES');
    setModalTrackerDate(existing?.date || targetDate);
    setModalTrackerPhotoUrl(existing?.photoUrl || '');
    setModalTrackerPublicNote(existing?.publicNotes || '');
    setModalTrackerPrivateNote(existing?.privateNotes || '');
    setTrackerDrawerOpen(true);
  };

  const handleSaveTrackerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerBlockedAction('Registrar hábitos o trackers diarios');
      return;
    }
    if (!modalTrackerStudent || !modalTrackerItem) return;
    const targetDate = modalTrackerDate || attendanceDate;
    const key = `${modalTrackerItem.id}_${modalTrackerStudent.id}_${targetDate}`;

    setDailyTrackerLogs(prev => ({
      ...prev,
      [key]: {
        value: modalTrackerValue,
        date: targetDate,
        photoUrl: modalTrackerPhotoUrl,
        publicNotes: modalTrackerPublicNote.trim(),
        privateNotes: modalTrackerPrivateNote.trim(),
        updatedAt: new Date().toISOString()
      }
    }));

    toast.success(`Hábito "${modalTrackerItem.name}" registrado para ${modalTrackerStudent.full_name}`);
    setTrackerDrawerOpen(false);
  };

  const handleDeleteTrackerEntry = () => {
    if (isReadOnly) {
      triggerBlockedAction('Eliminar o modificar registros de trackers');
      return;
    }
    if (!modalTrackerStudent || !modalTrackerItem) return;
    const targetDate = modalTrackerDate || attendanceDate;
    const key = `${modalTrackerItem.id}_${modalTrackerStudent.id}_${targetDate}`;

    setDailyTrackerLogs(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    toast.info(`Registro de tracker eliminado para ${modalTrackerStudent.full_name}`);
    setTrackerDrawerOpen(false);
  };

  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerBlockedAction('Registrar nuevas observaciones en la bitácora');
      return;
    }
    if (!obsStudentId || !obsContent.trim()) {
      toast.error('Selecciona el alumno y escribe la observación.');
      return;
    }

    setSavingObs(true);
    try {
      await createMontessoriObservation({
        studentId: obsStudentId,
        content: obsContent.trim(),
        photoUrl: obsPhotoUrl,
        isPublic: obsIsPublic,
      });
      toast.success('¡Observación registrada en la bitácora!');
      setObsModalOpen(false);
      setObsContent('');
      setObsPhotoUrl('');
      const updated = await getMontessoriObservations();
      setObservations(updated);
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar observación');
    } finally {
      setSavingObs(false);
    }
  };

  const attendanceStats = useMemo(() => {
    let presentCount = 0;
    let tardyCount = 0;
    let absentCount = 0;

    currentEnvStudents.forEach(student => {
      const att = attendances.find(a => a.studentId === student.id);
      const status = att?.status || 'PRESENT';
      if (status === 'PRESENT') presentCount++;
      else if (status === 'TARDY') tardyCount++;
      else if (status === 'ABSENT') absentCount++;
    });

    const total = currentEnvStudents.length;
    const rate = total > 0 ? Math.round(((presentCount + tardyCount) / total) * 100) : 100;

    return {
      total,
      presentCount,
      tardyCount,
      absentCount,
      rate
    };
  }, [currentEnvStudents, attendances]);

  const handleSetAttendanceStatus = async (studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'TARDY') => {
    if (isReadOnly) {
      triggerBlockedAction('Registrar o modificar asistencia diaria');
      return;
    }
    try {
      await saveMontessoriAttendance(attendanceDate, [
        { studentId, status: newStatus }
      ]);
      const updated = await getMontessoriAttendance({ environmentId: selectedEnvId, date: attendanceDate });
      setAttendances(updated);
    } catch (err) {
      toast.error('Error al actualizar asistencia');
    }
  };

  const handleMarkAllPresent = async () => {
    if (isReadOnly) {
      triggerBlockedAction('Registrar asistencia masiva');
      return;
    }
    if (currentEnvStudents.length === 0) return;
    const isConfirmed = await confirm({
      title: '¿Marcar asistencia masiva?',
      description: `¿Deseas marcar a todos los alumnos como Presentes para la fecha ${attendanceDate}?`,
      confirmText: 'Sí, marcar todos presentes',
      variant: 'warning'
    });
    if (!isConfirmed) return;

    try {
      const records = currentEnvStudents.map(s => ({ studentId: s.id, status: 'PRESENT' as const }));
      await saveMontessoriAttendance(attendanceDate, records);
      const updated = await getMontessoriAttendance({ environmentId: selectedEnvId, date: attendanceDate });
      setAttendances(updated);
      toast.success('Todos los alumnos fueron marcados como Presentes');
    } catch (err) {
      toast.error('Error al registrar asistencia');
    }
  };

  const handleQuickAttendanceToggle = async (studentId: string, currentStatus?: string) => {
    if (isReadOnly) {
      triggerBlockedAction('Registrar asistencia diaria');
      return;
    }
    const nextStatus = currentStatus === 'PRESENT' ? 'ABSENT' : currentStatus === 'ABSENT' ? 'TARDY' : 'PRESENT';

    try {
      await saveMontessoriAttendance(attendanceDate, [
        { studentId, status: nextStatus as any }
      ]);
      const updated = await getMontessoriAttendance({ environmentId: selectedEnvId, date: attendanceDate });
      setAttendances(updated);
    } catch (err) {
      toast.error('Error al actualizar asistencia');
    }
  };

  const selectedEnvObj = environments.find(e => e.id === selectedEnvId);

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER - FULL WIDTH EDGE-TO-EDGE WITH INTEGRATED SALÓN SELECTOR */}
      <div className="relative overflow-hidden -mx-4 sm:-mx-6 md:-mx-8 -mt-8 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 pt-6 pb-4 sm:py-6 text-white shadow-md space-y-4">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top title and info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3">
            <MobileMenuButton />

            <div>

              <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight">Seguimiento de Progreso Montessori</h2>
              <p className="hidden sm:block text-white/80 text-xs sm:text-sm mt-0.5 max-w-xl">
                Registro de avances por fichas de trabajo, bitácora de observaciones y asistencia escolar.
              </p>
            </div>
          </div>


        </div>

        {/* Internal Salón Choice Selector in Header */}
        <div className="relative z-20">
          {allowedEnvironments.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs flex items-center gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>No tienes salones asignados a tu cargo actualmente.</span>
            </div>
          ) : (
            <>
              {/* Mobile Select Button */}
              <div className="sm:hidden relative">
                <button
                  type="button"
                  onClick={() => setIsMobileEnvOpen(!isMobileEnvOpen)}
                  className="w-full p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-xs flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/40 shadow-2xs"
                        style={{ backgroundColor: selectedEnvObj?.color || '#fff' }}
                      />
                    </div>
                    <div className="truncate">
                      <span className="block font-bold text-xs text-white truncate">
                        {selectedEnvObj?.name || 'Seleccionar ambiente'}
                      </span>
                      <span className="text-[10px] text-white/75 block truncate">
                        {selectedEnvObj?.min_age_years && selectedEnvObj?.max_age_years
                          ? `${selectedEnvObj.min_age_years} - ${selectedEnvObj.max_age_years} años`
                          : selectedEnvObj?.stage || 'Montessori'} • {currentEnvStudents.length} {currentEnvStudents.length === 1 ? 'alumno' : 'alumnos'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white transition-transform shrink-0 ${isMobileEnvOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Desktop Choice Pills Grid inside Header */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {allowedEnvironments.map((env) => {
                  const isSelected = selectedEnvId === env.id;
                  const envStudentsCount = students.filter(s => s.environment_id === env.id).length;
                  const ageLabel = env.min_age_years && env.max_age_years
                    ? `${env.min_age_years} - ${env.max_age_years} años`
                    : env.stage || 'Montessori';

                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setSelectedEnvId(env.id)}
                      className={`p-3 rounded-2xl text-left transition-all relative border flex items-center justify-between gap-3 group backdrop-blur-md ${
                        isSelected
                          ? 'bg-white text-forest border-white shadow-md scale-[1.02]'
                          : 'bg-white/10 hover:bg-white/15 text-white border-white/15 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                          <span
                            className={`w-3 h-3 rounded-full shrink-0 transition-transform shadow-2xs ${
                              isSelected ? 'ring-2 ring-forest' : 'ring-1 ring-white/40'
                            }`}
                            style={{ backgroundColor: env.color || '#1b3b2b' }}
                          />
                        </div>
                        <div className="truncate flex-1 min-w-0">
                          <span className={`block font-bold text-xs truncate leading-tight ${isSelected ? 'text-forest' : 'text-white'}`}>
                            {env.name}
                          </span>
                          <span className={`text-[10px] block truncate mt-0.5 ${isSelected ? 'text-muted-foreground' : 'text-white/70'}`}>
                            {ageLabel} • {envStudentsCount} {envStudentsCount === 1 ? 'alumno' : 'alumnos'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>

      {/* RECORD KEEPING MATRIX (DIARIO & SEGUIMIENTO) */}
      <div className="space-y-4 animate-in fade-in">

        {/* TOP NAVIGATION TABS: CICLO DE TRABAJO, LECCIONES, TRACKERS, ÁREAS DE CRECIMIENTO */}
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-forest/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Tabs Container */}
          <div className="flex items-center gap-1.5 p-1 bg-forest/5 rounded-xl sm:rounded-2xl border border-forest/10 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setTrackingType('work_cycle')}
              className={`px-3.5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                trackingType === 'work_cycle'
                  ? 'bg-[#C4661F] text-white shadow-xs scale-[1.01]'
                  : 'text-forest/70 hover:text-forest hover:bg-white/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Ciclo de Trabajo (3h)</span>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight shadow-2xs ${
                  trackingType === 'work_cycle'
                    ? 'bg-white text-[#783D19]'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>EN VIVO</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTrackingType('lessons')}
              className={`px-3.5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                trackingType === 'lessons'
                  ? 'bg-forest text-white shadow-xs scale-[1.01]'
                  : 'text-forest/70 hover:text-forest hover:bg-white/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Lecciones</span>
            </button>

            <button
              type="button"
              onClick={() => setTrackingType('trackers')}
              className={`px-3.5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                trackingType === 'trackers'
                  ? 'bg-forest text-white shadow-xs scale-[1.01]'
                  : 'text-forest/70 hover:text-forest hover:bg-white/60'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Trackers</span>
            </button>

            <button
              type="button"
              onClick={() => setTrackingType('growth')}
              className={`px-3.5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                trackingType === 'growth'
                  ? 'bg-forest text-white shadow-xs scale-[1.01]'
                  : 'text-forest/70 hover:text-forest hover:bg-white/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Áreas de Crecimiento</span>
            </button>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 px-1 shrink-0">
            <div className="flex items-center gap-2 bg-forest/5 px-3 py-1.5 rounded-xl border border-forest/10 shadow-2xs">
              <Calendar className="w-4 h-4 text-forest shrink-0" />
              <span className="text-xs font-bold text-forest hidden sm:inline">Fecha:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-transparent text-forest text-xs font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* AREAS SUB-FILTER BAR (WHEN IN LESSONS MODE) */}
        {trackingType === 'lessons' && (
          <div className="flex items-center justify-between gap-4 flex-wrap bg-transparent sm:bg-white p-0 sm:p-2.5 rounded-none sm:rounded-2xl border-0 sm:border border-forest/10 shadow-none sm:shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar scroll-smooth whitespace-nowrap active:cursor-grab select-none touch-pan-x">
              {curriculum.map(area => (
                <button
                  key={area.id}
                  onClick={() => setSelectedAreaId(area.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${selectedAreaId === area.id
                      ? 'text-white shadow-2xs'
                      : 'bg-forest/5 text-forest/70 hover:bg-forest/10'
                    }`}
                  style={{ backgroundColor: selectedAreaId === area.id ? (area.color || '#1b3b2b') : undefined }}
                >
                  <span>{area.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RENDER VIEW: LIVE WORK CYCLE */}
        {trackingType === 'work_cycle' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* WORK CYCLE HUD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-forest/15 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Timer & Phase */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-mono font-black text-forest">
                      {formatCycleTime(cycleSeconds)}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">/ 03:00:00</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cyclePhaseInfo.badgeBg}`}>
                      {cyclePhaseInfo.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                    {cyclePhaseInfo.desc}
                  </p>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (isReadOnly) {
                        triggerBlockedAction('Iniciar o activar el ciclo de trabajo de 3 horas');
                        return;
                      }
                      setCycleRunning(!cycleRunning);
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                      cycleRunning
                        ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30 hover:bg-amber-500/25'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {cycleRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pausar Ciclo</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Reanudar Ciclo</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isReadOnly) {
                        triggerBlockedAction('Reiniciar el ciclo de trabajo de 3 horas');
                        return;
                      }
                      setCycleSeconds(0);
                    }}
                    className="px-3 py-2.5 rounded-2xl text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Reiniciar a 08:30 AM"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reiniciar</span>
                  </button>
                </div>
              </div>

              {/* Montessori Work Cycle 3-Hour Curve Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-forest/10">
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>08:30 (Inicio)</span>
                  <span className="text-sky-700 font-bold">09:30 (Calentamiento)</span>
                  <span className="text-amber-700 font-bold">10:00 (Falsa Fatiga)</span>
                  <span className="text-[#C4661F] font-bold">11:15 (Gran Trabajo ★)</span>
                  <span>11:30 (Cierre)</span>
                </div>

                <div className="w-full h-3 rounded-full bg-forest/10 overflow-hidden flex shadow-inner">
                  <div className="h-full bg-sky-500 w-[33%]" title="Fase 1: Integración & Calentamiento" />
                  <div className="h-full bg-amber-500 w-[17%]" title="Fase 2: Falsa Fatiga" />
                  <div className="h-full bg-[#C4661F] w-[41%] animate-pulse" title="Fase 3: Gran Trabajo (Concentración Máxima)" />
                  <div className="h-full bg-emerald-500 w-[9%]" title="Fase 4: Orden y Gracia" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-forest/70 pt-1">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Índice de Normalización del Ambiente: {cycleMetrics.normalizationRate}%
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {cycleMetrics.inFlowCount} de {cycleMetrics.total} niños en concentración constructiva
                  </span>
                </div>
              </div>

              {/* Curricular Areas Distribution Bar */}
              <div className="pt-2 border-t border-forest/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-forest text-xs">Distribución Curricular en Vivo:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(cycleMetrics.areasCount).map(([area, count]) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setCycleFilterArea(cycleFilterArea === area ? 'all' : area)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        cycleFilterArea === area
                          ? 'bg-forest text-white shadow-2xs'
                          : 'bg-forest/5 text-forest/80 hover:bg-forest/10 border border-forest/10'
                      }`}
                    >
                      <span>{area}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-white/30 text-[10px] font-mono font-bold">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STUDENTS WORK CYCLE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentEnvStudents
                .filter(st => {
                  const entry = studentCycleMap[st.id];
                  if (!entry) return true;
                  if (cycleFilterArea !== 'all' && entry.areaName !== cycleFilterArea) return false;
                  if (cycleFilterState !== 'all' && entry.state !== cycleFilterState) return false;
                  if (searchQuery && !st.full_name.toLowerCase().includes(searchQuery.toLowerCase()) && !entry.materialName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                  return true;
                })
                .map(student => {
                  const entry = studentCycleMap[student.id] || {
                    state: 'deep_flow',
                    areaName: 'Sensorial',
                    materialName: 'Torre Rosa',
                    minutesInFlow: 15
                  };
                  const stateConfig = CYCLE_STATE_CONFIG[entry.state];
                  const StateIcon = stateConfig.icon;

                  // Find matching area in curriculum
                  const matchedArea = curriculum.find(a =>
                    a.name.toLowerCase() === entry.areaName.toLowerCase() ||
                    entry.areaName.toLowerCase().includes(a.slug.toLowerCase()) ||
                    a.slug.toLowerCase().includes(entry.areaName.toLowerCase())
                  ) || curriculum[0];

                  // Flatten pre-registered materials / lessons for this student
                  const areaLessons: Array<{
                    id: string;
                    name: string;
                    categoryName?: string;
                    areaName?: string;
                    photoUrl?: string;
                    isCustomMaterial?: boolean;
                    description?: string;
                    skillsDeveloped?: string;
                  }> = [];

                  // 1. First, include active custom classroom materials registered for this environment in this area
                  const customAreaMats = environmentMaterials.filter(m =>
                    m.isActive !== false &&
                    matchedArea &&
                    (m.areaName.toLowerCase() === matchedArea.name.toLowerCase() ||
                     matchedArea.name.toLowerCase().includes(m.areaName.toLowerCase()) ||
                     m.areaName.toLowerCase().includes(matchedArea.slug.toLowerCase()))
                  );

                  for (const mat of customAreaMats) {
                    areaLessons.push({
                      id: mat.id,
                      name: mat.name,
                      categoryName: mat.categoryName || 'Material del Salón',
                      areaName: mat.areaName,
                      photoUrl: mat.photoUrl,
                      description: mat.description,
                      skillsDeveloped: mat.skillsDeveloped,
                      isCustomMaterial: true
                    });
                  }

                  // 2. Also include any other active custom classroom materials in other areas
                  const otherCustomMats = environmentMaterials.filter(m =>
                    m.isActive !== false &&
                    !areaLessons.some(a => a.id === m.id)
                  );
                  for (const mat of otherCustomMats) {
                    areaLessons.push({
                      id: mat.id,
                      name: mat.name,
                      categoryName: mat.categoryName || 'Material del Salón',
                      areaName: mat.areaName,
                      photoUrl: mat.photoUrl,
                      description: mat.description,
                      skillsDeveloped: mat.skillsDeveloped,
                      isCustomMaterial: true
                    });
                  }

                  // 3. Fallback: add standard curriculum lessons if no custom materials or to supplement
                  if (matchedArea) {
                    for (const cat of matchedArea.categories || []) {
                      for (const les of cat.lessons || []) {
                        if (!areaLessons.some(a => a.name.toLowerCase() === les.name.toLowerCase())) {
                          areaLessons.push({
                            id: les.id,
                            name: les.name,
                            categoryName: cat.name,
                            areaName: matchedArea.name
                          });
                        }
                      }
                    }
                  }

                  // Active matched lesson
                  const activeLesson = areaLessons.find(l =>
                    l.id === entry.lessonId || l.name.toLowerCase() === entry.materialName.toLowerCase()
                  ) || areaLessons[0];

                  return (
                    <div
                      key={student.id}
                      className={`p-4 rounded-3xl border bg-white shadow-xs transition-all hover:shadow-md space-y-3.5 relative ${
                        entry.state === 'deep_flow' ? 'border-[#C4661F]/40 ring-1 ring-[#C4661F]/20' : 'border-forest/15'
                      }`}
                    >
                      {/* Header: Student Info + State Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-forest/10 flex items-center justify-center font-bold text-forest text-xs shrink-0 border border-forest/15 shadow-2xs">
                            {student.avatar_url ? (
                              <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                            ) : (
                              student.full_name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-forest text-xs sm:text-sm truncate" title={student.full_name}>
                              {student.full_name}
                            </h4>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {student.gender ? `${student.gender} • ` : ''}{matchedArea?.name || entry.areaName}
                            </span>
                          </div>
                        </div>

                        <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 shrink-0 ${stateConfig.bgLight} ${stateConfig.textLight} ${stateConfig.border}`}>
                          <StateIcon className="w-3 h-3 shrink-0" />
                          <span>{stateConfig.shortLabel}</span>
                        </div>
                      </div>

                      {/* State Selector Buttons */}
                      <div className="p-1 bg-[#f6f8f6] rounded-2xl border border-forest/10 shadow-inner flex items-center justify-between gap-1">
                        {(Object.keys(CYCLE_STATE_CONFIG) as CycleStateKey[]).map(key => {
                          const isSelected = entry.state === key;
                          const cfg = CYCLE_STATE_CONFIG[key];
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleUpdateStudentCycle(student.id, { state: key })}
                              title={cfg.label}
                              className={`flex-1 py-1.5 px-1 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'shadow-xs font-bold text-white scale-[1.03]'
                                  : 'text-forest/50 hover:text-forest hover:bg-white/80'
                              }`}
                              style={{
                                backgroundColor: isSelected ? cfg.color : undefined
                              }}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>

                      {/* CUSTOM CHOICE: ÁREA MONTESSORI */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-forest/70 uppercase tracking-wider">
                          <span>Área Curricular:</span>
                          <span className="text-[9px] font-semibold text-muted-foreground">
                            {areaLessons.length} materiales
                          </span>
                        </div>

                        {/* Segmented Custom Area Chips */}
                        <div className="grid grid-cols-5 gap-1 p-1 bg-[#f6f8f6] rounded-2xl border border-forest/10 shadow-inner">
                          {curriculum.map(area => {
                            const isSelected = matchedArea?.id === area.id;
                            return (
                              <button
                                key={area.id}
                                type="button"
                                onClick={() => {
                                  // Look for first active material in this area from the classroom
                                  const envMatInArea = environmentMaterials.find(m =>
                                    m.isActive !== false &&
                                    (m.areaName.toLowerCase() === area.name.toLowerCase() ||
                                     area.name.toLowerCase().includes(m.areaName.toLowerCase()) ||
                                     m.areaName.toLowerCase().includes(area.slug.toLowerCase()))
                                  );
                                  const firstCurriculumLesson = area.categories?.[0]?.lessons?.[0];

                                  handleUpdateStudentCycle(student.id, {
                                    areaName: area.name,
                                    materialName: envMatInArea?.name || firstCurriculumLesson?.name || '',
                                    lessonId: envMatInArea?.id || firstCurriculumLesson?.id
                                  });
                                }}
                                title={area.name}
                                className={`py-1.5 px-1 rounded-xl text-[10px] font-bold truncate transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                                  isSelected
                                    ? 'text-white shadow-xs font-bold scale-[1.03]'
                                    : 'text-forest/70 hover:text-forest hover:bg-white/70'
                                }`}
                                style={{
                                  backgroundColor: isSelected ? (area.color || '#1b3b2b') : undefined
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: isSelected ? '#ffffff' : (area.color || '#1b3b2b')
                                  }}
                                />
                                <span className="truncate text-[9.5px] leading-tight font-bold">
                                  {area.name.split(' ')[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* CUSTOM SEARCHABLE MATERIALS PICKER */}
                      <div className="space-y-1.5 relative">
                        <div className="flex items-center justify-between text-[10px] font-bold text-forest/70 uppercase tracking-wider">
                          <span>Material del Salón:</span>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {areaLessons.length} en área
                          </span>
                        </div>

                        {/* Custom Button Trigger with Real Photo Thumbnail */}
                        <button
                          type="button"
                          onClick={() => {
                            if (materialPickerStudentId === student.id) {
                              setMaterialPickerStudentId(null);
                            } else {
                              setMaterialPickerStudentId(student.id);
                              setMaterialPickerSearch('');
                            }
                          }}
                          className={`w-full p-2.5 rounded-2xl border bg-white text-forest text-xs font-bold flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer text-left ${
                            materialPickerStudentId === student.id
                              ? 'border-forest ring-2 ring-forest/20'
                              : 'border-forest/15 hover:border-forest/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {activeLesson?.photoUrl ? (
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-forest/10 shrink-0 border border-forest/15 shadow-2xs">
                                <img
                                  src={activeLesson.photoUrl}
                                  alt={activeLesson.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: matchedArea?.color || '#1b3b2b' }}
                              />
                            )}
                            <div className="truncate flex-1 min-w-0">
                              <span className="block font-bold text-xs truncate leading-tight text-forest">
                                {entry.materialName || activeLesson?.name || 'Seleccionar material...'}
                              </span>
                              {(activeLesson?.categoryName || activeLesson?.areaName) && (
                                <span className="text-[9.5px] text-muted-foreground block truncate mt-0.5 font-normal">
                                  {activeLesson.areaName ? `${activeLesson.areaName} • ` : ''}{activeLesson.categoryName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 text-forest/60">
                            <Search className="w-3.5 h-3.5" />
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${materialPickerStudentId === student.id ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Custom Searchable Popover Menu */}
                        {materialPickerStudentId === student.id && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-2.5 bg-white rounded-2xl border border-forest/20 shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                            {/* Search Input */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                autoFocus
                                value={materialPickerSearch}
                                onChange={(e) => setMaterialPickerSearch(e.target.value)}
                                placeholder="Buscar material o escribir uno nuevo..."
                                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-forest/15 text-forest bg-forest/5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-forest placeholder:text-muted-foreground/70"
                              />
                              {materialPickerSearch && (
                                <button
                                  type="button"
                                  onClick={() => setMaterialPickerSearch('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Materials List */}
                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
                              {(() => {
                                const filteredLessons = areaLessons.filter(l =>
                                  l.name.toLowerCase().includes(materialPickerSearch.toLowerCase()) ||
                                  (l.categoryName && l.categoryName.toLowerCase().includes(materialPickerSearch.toLowerCase()))
                                );

                                if (filteredLessons.length > 0) {
                                  return filteredLessons.map(les => {
                                    const isCurrent = (entry.lessonId === les.id) || (entry.materialName.toLowerCase() === les.name.toLowerCase());
                                    return (
                                      <button
                                        key={les.id}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateStudentCycle(student.id, {
                                            lessonId: les.id,
                                            materialName: les.name,
                                            areaName: les.areaName || matchedArea?.name || entry.areaName
                                          });
                                          setMaterialPickerStudentId(null);
                                        }}
                                        className={`w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                                          isCurrent
                                            ? 'bg-forest text-white font-bold shadow-2xs'
                                            : 'hover:bg-forest/5 text-forest/90'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          {les.photoUrl ? (
                                            <div className="w-6 h-6 rounded-md overflow-hidden bg-forest/10 shrink-0 border border-forest/15">
                                              <img src={les.photoUrl} alt={les.name} className="w-full h-full object-cover" />
                                            </div>
                                          ) : (
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${isCurrent ? 'bg-white' : 'bg-forest/30'}`} />
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <span className="block truncate font-semibold">
                                              {les.name}
                                            </span>
                                            <span className={`text-[9.5px] block truncate ${isCurrent ? 'text-white/80' : 'text-muted-foreground font-normal'}`}>
                                              {les.areaName ? `${les.areaName} • ` : ''}{les.categoryName}
                                            </span>
                                          </div>
                                        </div>
                                        {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                                      </button>
                                    );
                                  });
                                }

                                return (
                                  <div className="p-3 text-center text-xs text-muted-foreground space-y-2">
                                    <p>No se encontraron lecciones registradas con "{materialPickerSearch}".</p>
                                    {materialPickerSearch.trim() && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleUpdateStudentCycle(student.id, {
                                            materialName: materialPickerSearch.trim(),
                                            lessonId: undefined,
                                            areaName: matchedArea?.name || entry.areaName
                                          });
                                          setMaterialPickerStudentId(null);
                                        }}
                                        className="w-full py-1.5 px-2 bg-forest text-white rounded-xl font-bold text-xs shadow-2xs hover:bg-forest/90 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Usar "{materialPickerSearch.trim()}"</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Flow timer and Quick Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-forest/10 text-[11px]">
                        <span className="flex items-center gap-1 font-mono text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-[#C4661F]" />
                          <span className="font-bold text-[#C4661F]">{entry.minutesInFlow} min</span> en flujo
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenCycleModal(student)}
                          className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold text-[11px] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Registrar en Diario</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* RENDER VIEW: MATRIX TABLE */}
        {trackingType !== 'work_cycle' && (
          allowedEnvironments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 text-xs text-muted-foreground shadow-sm max-w-xl mx-auto my-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-forest text-base font-display">Sin Salones Asignados</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  No tienes ningún salón o ambiente asignado a tu cargo actualmente. Para ver o registrar seguimiento de progreso, un administrador debe asignarte a un salón o habilitar los permisos globales correspondientes.
                </p>
              </div>
            </div>
          ) : currentEnvStudents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 text-xs text-muted-foreground">
              <User className="w-10 h-10 text-forest/30 mx-auto mb-2" />
              <p className="font-bold text-forest text-sm">No hay alumnos asignados a este ambiente</p>
              <p className="text-xs mt-1">Asigna alumnos al salón "{selectedEnvObj?.name}" desde la sección de Estudiantes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="-mx-4 sm:mx-0 bg-white rounded-none sm:rounded-3xl border-x-0 sm:border-x border-y sm:border border-forest/10 shadow-xs overflow-hidden">
                <div
                  ref={matrixTableRef}
                  onMouseDown={handleMatrixMouseDown}
                  onMouseMove={handleMatrixMouseMove}
                onMouseUp={handleMatrixMouseUpOrLeave}
                onMouseLeave={handleMatrixMouseUpOrLeave}
                className={`overflow-x-auto max-h-[72vh] custom-horizontal-scrollbar touch-pan-x touch-pan-y ${isMatrixPanning ? 'cursor-grabbing select-none' : 'cursor-grab'
                  }`}
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <table className="w-full text-left border-collapse">
                  {/* TABLE HEADER: STUDENTS IN COLUMNS (LIGHT / TRANSPARENT THEME WITH DARK TEXT) */}
                  <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-md text-forest border-b border-forest/15 shadow-xs">
                    <tr>
                      {/* Sticky Left Intersection Header: Search Box on Top Space, Title Stuck to Bottom */}
                      <th className="p-2.5 px-3 sm:px-4 text-xs font-bold sticky left-0 z-30 bg-white/95 backdrop-blur-md text-forest w-56 sm:w-72 min-w-[200px] sm:min-w-[260px] border-r border-forest/10 border-b border-forest/15 shadow-xs align-bottom">
                        <div className="flex flex-col justify-between h-20 sm:h-24 pb-0.5">
                          {/* Search Box on Top */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Buscar actividad..."
                              className="w-full pl-8 pr-3 py-1 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-forest placeholder:text-muted-foreground/70"
                            />
                          </div>

                          {/* Bottom Title & Counter */}
                          <div className="flex items-end justify-between gap-2">
                            <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-bold text-forest leading-tight">
                              {trackingType === 'lessons' ? 'Actividades / Lecciones' : trackingType === 'trackers' ? 'Hábitos & Trackers' : 'Habilidades de Crecimiento'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-forest/70 font-mono bg-forest/5 px-2 py-0.5 rounded-full border border-forest/10 shrink-0">
                              {currentEnvStudents.length} niños
                            </span>
                          </div>
                        </div>
                      </th>

                      {/* Each Student as Column Header: Short Given Name Rotated Upwards and Photo Only */}
                      {currentEnvStudents.map(student => (
                        <th
                          key={student.id}
                          onClick={() => {
                            if (!hasDraggedRef.current) {
                              setMobileStudentSheet(student);
                            }
                          }}
                          className="p-1.5 sm:p-2 min-w-[48px] max-w-[60px] sm:min-w-[54px] sm:max-w-[66px] border-r border-forest/10 text-center font-bold text-xs cursor-pointer group hover:bg-forest/5 transition-colors select-none"
                          title={`${student.full_name} • Haz clic para abrir opciones`}
                        >
                          <div className="flex flex-col items-center justify-end h-20 sm:h-24 pb-0.5 gap-1.5">
                            {/* Rotated Upwards Short Given Name */}
                            <div className="flex-1 flex items-end justify-center w-full overflow-hidden">
                              <span
                                className="text-[10px] sm:text-[11px] font-bold text-forest/80 group-hover:text-forest transition-colors whitespace-nowrap tracking-wide leading-none"
                                style={{
                                  writingMode: 'vertical-rl',
                                  transform: 'rotate(180deg)',
                                  maxHeight: '52px'
                                }}
                              >
                                {getStudentShortGivenName(student.full_name)}
                              </span>
                            </div>

                            {/* Student Photo / Avatar ONLY */}
                            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full overflow-hidden bg-forest/10 flex items-center justify-center text-[10px] text-forest font-bold shrink-0 border-2 border-forest/20 shadow-xs group-hover:border-forest group-hover:scale-110 transition-all">
                              {student.avatar_url ? (
                                <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{student.full_name.charAt(0)}</span>
                              )}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* TABLE BODY: ROWS ARE ACTIVITIES / LESSONS / TRACKERS */}
                  <tbody className="divide-y divide-forest/10 text-xs">
                    {/* 1. LESSONS MATRIX ROWS */}
                    {trackingType === 'lessons' && (
                      <>
                        {flatLessonsInSelectedArea
                          .filter(l => !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(lesson => (
                            <tr key={lesson.id} className="hover:bg-forest/5 transition-colors">
                              {/* Sticky Activity Name Cell */}
                              <td
                                onClick={() => {
                                  if (!hasDraggedRef.current) {
                                    setSelectedLessonForDetail(lesson);
                                  }
                                }}
                                className="p-2.5 px-4 font-bold text-forest sticky left-0 z-10 bg-white border-r border-forest/10 shadow-xs cursor-pointer group/lesson"
                                title="Haz clic para ver propósito pedagógico"
                              >
                                <div className="truncate">
                                  <span className="text-[10px] text-muted-foreground block truncate font-medium">
                                    {lesson.categoryName}
                                  </span>
                                  <span className="text-xs font-bold text-forest block truncate group-hover/lesson:text-forest-light">
                                    {lesson.name}
                                  </span>
                                </div>
                              </td>

                              {/* Student Cells */}
                              {currentEnvStudents.map(student => {
                                const record = getStudentLessonRecord(student.id, lesson.id);
                                const scale = record ? getScaleConfig(record.status) : null;
                                const tooltipText = scale
                                  ? `${student.full_name} • ${lesson.name}\nEvaluación: ${scale.label} (${scale.acronym})${record?.notes ? `\nNota: "${record.notes}"` : ''}${record?.presentedAt ? `\nFecha: ${new Date(record.presentedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}\n(Clic para editar evaluación)`
                                  : `${student.full_name} • ${lesson.name}\nSin evaluar • Clic para calificar`;

                                return (
                                  <td
                                    key={student.id}
                                    onClick={() => {
                                      if (!hasDraggedRef.current) {
                                        handleOpenCell(student, lesson);
                                      }
                                    }}
                                    title={tooltipText}
                                    className="p-2 border-r border-forest/5 text-center cursor-pointer hover:bg-forest/10 transition-colors"
                                  >
                                    <div className="flex justify-center items-center">
                                      {renderProgressVisual(scale)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </>
                    )}

                    {/* 2. TRACKERS MATRIX ROWS */}
                    {trackingType === 'trackers' && (
                      <>
                        {trackerCategories.map(cat => (
                          <React.Fragment key={cat.id}>
                            {/* Category Header Row */}
                            <tr className="bg-forest/[0.04] font-bold text-forest">
                              <td className="p-2.5 px-4 sticky left-0 z-10 bg-forest/[0.06] border-r border-forest/10 uppercase tracking-wider text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#1b3b2b' }} />
                                  <span>{cat.name}</span>
                                </div>
                              </td>
                              {currentEnvStudents.map(student => (
                                <td key={student.id} className="border-r border-forest/5 bg-forest/[0.04]" />
                              ))}
                            </tr>

                            {/* Tracker Items */}
                            {cat.subcategories.map(sub => (
                              <React.Fragment key={sub.id}>
                                {(sub.items || []).map(item => (
                                  <tr key={item.id} className="hover:bg-forest/5 transition-colors">
                                    <td className="py-2.5 pl-7 pr-4 text-xs font-medium text-forest sticky left-0 z-10 bg-white border-r border-forest/10 shadow-xs">
                                      <div className="truncate">
                                        <span className="block truncate font-bold text-forest">{item.name}</span>
                                        <span className="block text-[10px] text-muted-foreground truncate">{sub.name}</span>
                                      </div>
                                    </td>

                                    {currentEnvStudents.map(student => {
                                      const key = `${item.id}_${student.id}_${attendanceDate}`;
                                      const log = dailyTrackerLogs[key];
                                      const currentVal = log?.value;
                                      const isYes = currentVal === 'YES';
                                      const isNo = currentVal === 'NO';
                                      const hasNotesOrPhoto = Boolean(log?.photoUrl || log?.publicNotes || log?.privateNotes);

                                      const trackerTooltip = `${student.full_name} • ${item.name}\nEstado: ${isYes ? 'Realizado (Sí)' : isNo ? 'No realizado' : 'Sin registrar'}${log?.publicNotes ? `\n🌐 Nota pública: "${log.publicNotes}"` : ''}${log?.privateNotes ? `\n🔒 Nota interna: "${log.privateNotes}"` : ''}${log?.photoUrl ? '\n📷 Foto adjunta' : ''}\n(Clic para registrar / editar notas y foto)`;

                                      return (
                                        <td
                                          key={student.id}
                                          onClick={() => {
                                            if (!hasDraggedRef.current) {
                                              handleOpenTrackerCell(student, item, sub.name);
                                            }
                                          }}
                                          title={trackerTooltip}
                                          className="p-2 border-r border-forest/5 text-center cursor-pointer hover:bg-forest/10 transition-colors"
                                        >
                                          <div className="flex items-center justify-center gap-1">
                                            {isYes ? (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                                <span>Sí</span>
                                                {hasNotesOrPhoto && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                              </span>
                                            ) : isNo ? (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs flex items-center gap-1">
                                                <span>No</span>
                                                {hasNotesOrPhoto && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                              </span>
                                            ) : (
                                              <span className="w-2.5 h-2.5 rounded-full bg-forest/15 inline-block mx-auto" />
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        ))}
                      </>
                    )}

                    {/* 3. PERSONAL GROWTH MATRIX ROWS */}
                    {trackingType === 'growth' && (
                      <>
                        {DEFAULT_GROWTH_SKILLS.map(skill => (
                          <tr key={skill.id} className="hover:bg-forest/5 transition-colors">
                            <td className="p-3 px-4 font-bold text-forest sticky left-0 z-10 bg-white border-r border-forest/10 shadow-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: skill.color }} />
                                  <span className="font-bold text-forest text-xs truncate">{skill.name}</span>
                                </div>
                                <span className="block text-[10px] text-muted-foreground truncate">{skill.category}</span>
                              </div>
                            </td>

                            {currentEnvStudents.map(student => {
                              const key = `${skill.id}_${student.id}_${attendanceDate}`;
                              const log = dailyGrowthLogs[key];
                              const currentLvl = log?.level || 0;
                              const growthTooltip = `${student.full_name} • ${skill.name}\n${currentLvl > 0 ? `Nivel actual: ${currentLvl} de 4` : 'Sin evaluar'}\n(Clic para avanzar nivel o eliminar al superar nivel 4)`;

                              return (
                                <td
                                  key={student.id}
                                  onClick={() => {
                                    if (!hasDraggedRef.current) {
                                      const nextLvl = currentLvl >= 4 ? 0 : currentLvl + 1;
                                      if (nextLvl === 0) {
                                        setDailyGrowthLogs(prev => {
                                          const copy = { ...prev };
                                          delete copy[key];
                                          return copy;
                                        });
                                        toast.info(`${skill.name}: Evaluación eliminada (${student.full_name})`);
                                      } else {
                                        setDailyGrowthLogs(prev => ({
                                          ...prev,
                                          [key]: { level: nextLvl }
                                        }));
                                        toast.success(`${skill.name}: Nivel ${nextLvl} (${student.full_name})`);
                                      }
                                    }
                                  }}
                                  title={growthTooltip}
                                  className="p-2 border-r border-forest/5 text-center cursor-pointer hover:bg-forest/10 transition-colors"
                                >
                                  <div className="flex flex-col items-center justify-center">
                                    {currentLvl > 0 ? (
                                      <span
                                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-2xs transition-transform hover:scale-110"
                                        style={{ backgroundColor: skill.color }}
                                      >
                                        Nivel {currentLvl}
                                      </span>
                                    ) : (
                                      <span className="w-2.5 h-2.5 rounded-full bg-forest/15 inline-block mx-auto" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )
        )}
      </div>



      {/* DRAWER: ACTUALIZAR PROGRESO / ESTADO DE DOMINIO */}
      {modalStudent && modalLesson && (
        <SlideOverDrawer
          isOpen={progressModalOpen}
          onClose={() => setProgressModalOpen(false)}
          title={modalLesson.name}
          description={modalLesson.categoryName || 'Material Montessori'}
          maxWidthClass="max-w-lg lg:max-w-xl"
          icon={<Layers className="w-5 h-5 text-forest" />}
          footer={
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={() => setProgressModalOpen(false)}
                disabled={savingProgress}
                className="w-full py-3 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-xl transition-all flex items-center justify-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProgress}
                disabled={savingProgress}
                className="w-full py-3 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{savingProgress ? 'Guardando...' : 'Guardar Estado'}</span>
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Student Identification & Assessment Date Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-forest/5 rounded-2xl border border-forest/10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-forest/10 flex items-center justify-center font-bold text-forest text-xs shrink-0 shadow-2xs">
                  {modalStudent.avatar_url ? (
                    <img src={modalStudent.avatar_url} alt={modalStudent.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{modalStudent.full_name.charAt(0)}</span>
                  )}
                </div>
                <div className="truncate min-w-0">
                  <h4 className="font-bold text-forest text-sm truncate">{modalStudent.full_name}</h4>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Ambiente: {selectedEnvObj?.name || 'Salón'} • Matrícula {modalStudent.enrollment_code || 'Activa'}
                  </span>
                </div>
              </div>

              {/* Interactive Date Selector */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-forest/15 shadow-2xs shrink-0">
                <Calendar className="w-3.5 h-3.5 text-forest shrink-0" />
                <span className="text-[11px] font-bold text-forest">Fecha:</span>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-forest focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Classroom Material Context (Photo, Description & Skills) */}
            {(modalLesson.photoUrl || modalLesson.description || modalLesson.pedagogicalPurpose || modalLesson.skillsDeveloped) && (
              <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-2.5">
                <div className="flex items-start gap-3">
                  {modalLesson.photoUrl && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-forest/15 bg-white shrink-0 shadow-2xs">
                      <img
                        src={modalLesson.photoUrl}
                        alt={modalLesson.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest/70 block">
                      {modalLesson.categoryName || 'Material del Salón'}
                    </span>
                    <h5 className="font-bold text-forest text-xs truncate">
                      {modalLesson.name}
                    </h5>
                    {modalLesson.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {modalLesson.description}
                      </p>
                    )}
                  </div>
                </div>

                {modalLesson.pedagogicalPurpose && (
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Propósito Pedagógico:</span>
                    </span>
                    <p className="text-[11px] text-amber-950/90 leading-relaxed">
                      {modalLesson.pedagogicalPurpose}
                    </p>
                  </div>
                )}

                {modalLesson.skillsDeveloped && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-forest/10">
                    {modalLesson.skillsDeveloped.split(',').map((s: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white text-forest border border-forest/10 shadow-2xs"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Status Radio Choices */}
            <div>
              <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-2.5">
                Estado de Dominio Pedagógico:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assessmentScales.map((scale) => {
                  const isSelected = modalStatus === scale.code || modalStatus === scale.id;
                  const IconComp = (scale.icon && ICON_MAP[scale.icon]) ? ICON_MAP[scale.icon] : Sparkles;
                  return (
                    <button
                      key={scale.id}
                      type="button"
                      onClick={() => setModalStatus(scale.code || scale.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${isSelected
                          ? 'bg-white ring-2 ring-forest shadow-2xs font-bold border-transparent'
                          : 'bg-white/80 border-forest/10 hover:bg-forest/5 text-forest/70'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: scale.color }}
                        />
                        <IconComp className="w-4 h-4 shrink-0 stroke-[2.5]" style={{ color: scale.color }} />
                        <span className="text-xs font-bold text-forest truncate">{scale.label}</span>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-forest/5 text-forest/80 font-bold uppercase shrink-0">
                        {scale.acronym}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Internal Observation Notes */}
            <div>
              <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                Notas de Observación / Guía (Opcional):
              </label>
              <textarea
                rows={4}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Escribe observaciones cualitativas, detalles sobre el periodo sensible, interés o retos del niño..."
                className="w-full p-3.5 rounded-2xl border border-forest/15 text-xs focus:ring-1 focus:ring-forest bg-white leading-relaxed focus:outline-none shadow-2xs"
              />
            </div>
          </div>
        </SlideOverDrawer>
      )}

      {/* DRAWER: REGISTRO DE TRACKER / HÁBITO DIARIO */}
      {modalTrackerStudent && modalTrackerItem && (
        <SlideOverDrawer
          isOpen={trackerDrawerOpen}
          onClose={() => setTrackerDrawerOpen(false)}
          title={modalTrackerItem.name}
          description={modalTrackerCategory || 'Hábitos & Trackers Diarios'}
          maxWidthClass="max-w-lg lg:max-w-xl"
          icon={<CheckSquare className="w-5 h-5 text-forest" />}
          footer={
            <div className="flex items-center justify-between gap-3 w-full">
              {dailyTrackerLogs[`${modalTrackerItem.id}_${modalTrackerStudent.id}_${modalTrackerDate || attendanceDate}`] ? (
                <button
                  type="button"
                  onClick={handleDeleteTrackerEntry}
                  disabled={savingTracker}
                  className="px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0"
                >
                  Eliminar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTrackerDrawerOpen(false)}
                  disabled={savingTracker}
                  className="px-4 py-3 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0"
                >
                  Cancelar
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveTrackerEntry}
                disabled={savingTracker}
                className="flex-1 py-3 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Tracker</span>
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Student Banner & Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-forest/5 rounded-2xl border border-forest/10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-forest/10 flex items-center justify-center font-bold text-forest text-xs shrink-0 shadow-2xs">
                  {modalTrackerStudent.avatar_url ? (
                    <img src={modalTrackerStudent.avatar_url} alt={modalTrackerStudent.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{modalTrackerStudent.full_name.charAt(0)}</span>
                  )}
                </div>
                <div className="truncate min-w-0">
                  <h4 className="font-bold text-forest text-sm truncate">{modalTrackerStudent.full_name}</h4>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Ambiente: {selectedEnvObj?.name || 'Salón'} • Matrícula {modalTrackerStudent.enrollment_code || 'Activa'}
                  </span>
                </div>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-forest/15 shadow-2xs shrink-0">
                <Calendar className="w-3.5 h-3.5 text-forest shrink-0" />
                <span className="text-[11px] font-bold text-forest">Fecha:</span>
                <input
                  type="date"
                  value={modalTrackerDate}
                  onChange={(e) => setModalTrackerDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-forest focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Status Choices */}
            <div>
              <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-2">
                Estado del Hábito / Rutina:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModalTrackerValue('YES')}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    modalTrackerValue === 'YES'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 font-bold text-emerald-900 shadow-xs'
                      : 'bg-white border-forest/10 hover:bg-forest/5 text-forest/70'
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span className="text-xs font-bold">Realizado (Sí)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTrackerValue('NO')}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    modalTrackerValue === 'NO'
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500 font-bold text-rose-900 shadow-xs'
                      : 'bg-white border-forest/10 hover:bg-forest/5 text-forest/70'
                  }`}
                >
                  <X className="w-4 h-4 text-rose-600 stroke-[3]" />
                  <span className="text-xs font-bold">No Realizado (No)</span>
                </button>
              </div>
            </div>

            {/* Photo Dropzone */}
            <ImageUploadDropzone
              value={modalTrackerPhotoUrl}
              onChange={setModalTrackerPhotoUrl}
              label="Fotografía de Evidencia (Opcional)"
              helperText="Captura o arrastra una foto del niño realizando la actividad"
            />

            {/* Public Note (For Parents) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nota Pública</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  🌐 Visible a Padres
                </span>
              </div>
              <textarea
                rows={3}
                value={modalTrackerPublicNote}
                onChange={(e) => setModalTrackerPublicNote(e.target.value)}
                placeholder="Comentario o felicitación que los tutores podrán ver en su portal familiar..."
                className="w-full p-3 rounded-2xl border border-forest/15 text-xs focus:ring-1 focus:ring-forest bg-white leading-relaxed focus:outline-none shadow-2xs"
              />
            </div>

            {/* Private Note (Internal Guías & Dirección) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                  <span>Nota Privada</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-forest/10 text-forest">
                  🔒 Solo Guías & Dirección
                </span>
              </div>
              <textarea
                rows={3}
                value={modalTrackerPrivateNote}
                onChange={(e) => setModalTrackerPrivateNote(e.target.value)}
                placeholder="Observaciones confidenciales internas sobre la conducta, apoyo requerido o seguimiento..."
                className="w-full p-3 rounded-2xl border border-forest/15 text-xs focus:ring-1 focus:ring-forest bg-white leading-relaxed focus:outline-none shadow-2xs"
              />
            </div>
          </div>
        </SlideOverDrawer>
      )}

      {/* DRAWER: NUEVA OBSERVACIÓN */}
      <SlideOverDrawer
        isOpen={obsModalOpen}
        onClose={() => setObsModalOpen(false)}
        title="Nueva Observación"
        description="Registra descubrimientos, dinámicas y momentos pedagógicos."
        maxWidthClass="max-w-lg lg:max-w-xl"
        icon={<Eye className="w-5 h-5 text-forest" />}
        footer={
          <div className="flex sm:grid sm:grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={() => setObsModalOpen(false)}
              disabled={savingObs}
              className="hidden sm:flex w-full py-3 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-xl transition-all items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="observation-drawer-form"
              disabled={savingObs}
              className="w-full py-3 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{savingObs ? 'Guardando...' : 'Registrar Observación'}</span>
            </button>
          </div>
        }
      >
        <form id="observation-drawer-form" onSubmit={handleSaveObservation} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-forest mb-1">Alumno Observado *</label>
            <select
              value={obsStudentId}
              onChange={(e) => setObsStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white font-bold text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 shadow-2xs"
            >
              {currentEnvStudents.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-forest mb-1">Detalle de la Observación *</label>
            <textarea
              required
              rows={5}
              placeholder="Describe la interacción del niño con el material, nivel de concentración, dinámicas sociales o logro..."
              value={obsContent}
              onChange={(e) => setObsContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-forest/20 shadow-2xs"
            />
          </div>

          {/* Photo Dropzone */}
          <ImageUploadDropzone
            value={obsPhotoUrl}
            onChange={setObsPhotoUrl}
            label="Fotografía del Trabajo (Opcional)"
            helperText="Captura o arrastra una foto del alumno trabajando en el ambiente"
          />

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-forest pt-2 p-3 rounded-2xl bg-forest/5 border border-forest/10">
            <input
              type="checkbox"
              checked={obsIsPublic}
              onChange={(e) => setObsIsPublic(e.target.checked)}
              className="w-4 h-4 rounded text-forest"
            />
            <div>
              <span className="block">Compartir con los padres en el portal familiar</span>
              <span className="text-[10px] text-muted-foreground font-normal block">
                Los tutores podrán ver esta nota y foto en su resumen de avances.
              </span>
            </div>
          </label>
        </form>
      </SlideOverDrawer>

      {/* DRAWER LATERAL DERECHO: PROPÓSITO PEDAGÓGICO DE LA LECCIÓN */}
      {selectedLessonForDetail && (
        <div
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 h-screen h-[100dvh] max-h-[100dvh] bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200 overflow-hidden !mt-0"
          onClick={() => setSelectedLessonForDetail(null)}
        >
          <div
            className="w-full h-full h-[100dvh] max-h-[100dvh] sm:h-full sm:max-w-lg lg:max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-forest/10 top-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 pb-4 border-b border-forest/10 flex items-start justify-between shrink-0 bg-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-forest/70 tracking-wider block">
                  {selectedLessonForDetail.categoryName || 'Ficha Pedagógica Montessori'}
                </span>
                <h3 className="font-bold text-forest text-lg leading-tight mt-0.5">
                  {selectedLessonForDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLessonForDetail(null)}
                className="p-2 rounded-full text-muted-foreground hover:text-forest hover:bg-forest/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Material Photo */}
              {selectedLessonForDetail.photoUrl && (
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-forest/15 shadow-xs bg-forest/5">
                  <img
                    src={selectedLessonForDetail.photoUrl}
                    alt={selectedLessonForDetail.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              {selectedLessonForDetail.description && (
                <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 space-y-1.5">
                  <span className="font-bold text-forest text-xs uppercase tracking-wider block">
                    Descripción y Presentación:
                  </span>
                  <p className="text-xs text-forest/80 leading-relaxed font-normal">
                    {selectedLessonForDetail.description}
                  </p>
                </div>
              )}

              {/* Pedagogical Purpose */}
              {(selectedLessonForDetail.pedagogicalPurpose || (!selectedLessonForDetail.description && selectedLessonForDetail.pedagogicalPurpose)) && (
                <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-900 flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Propósito Pedagógico</span>
                  </span>
                  <p className="text-xs text-amber-950/90 leading-relaxed">
                    {selectedLessonForDetail.pedagogicalPurpose || 'Desarrollo de la concentración, autonomía y control de error en el ambiente preparado Montessori.'}
                  </p>
                </div>
              )}

              {selectedLessonForDetail.skillsDeveloped && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                    Habilidades que Desarrolla el Niño:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLessonForDetail.skillsDeveloped.split(',').map((s: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-forest/5 text-forest border border-forest/10"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLessonForDetail.minAgeYears && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-forest/5 border border-forest/10 text-xs text-forest">
                  <Clock className="w-4 h-4 text-forest shrink-0" />
                  <span>Rango de edad sugerido: <strong>{selectedLessonForDetail.minAgeYears} a {selectedLessonForDetail.maxAgeYears || 6} años</strong></span>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 px-6 border-t border-forest/10 bg-white flex items-center justify-between shrink-0">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    const lessonToEdit = { ...selectedLessonForDetail };
                    setSelectedLessonForDetail(null);
                    setEditingLesson(lessonToEdit);
                    setLessonDrawerOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold border border-forest/20 text-forest hover:bg-forest/5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Ficha</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedLessonForDetail(null)}
                className="px-6 py-2.5 text-xs font-bold bg-forest text-white rounded-xl shadow-xs transition-all hover:scale-105 cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DRAWER: CREAR O EDITAR FICHA DE TRABAJO MONTESSORI */}
      <MontessoriLessonDrawer
        isOpen={lessonDrawerOpen}
        onClose={() => setLessonDrawerOpen(false)}
        curriculum={curriculum}
        initialLesson={editingLesson}
        defaultAreaId={defaultLessonAreaId}
        defaultCategoryId={defaultLessonCategoryId}
        onSaved={async () => {
          const cur = await getMontessoriCurriculum();
          setCurriculum(cur);
        }}
      />

      {/* DRAWER: GENERADOR DE REPORTE DE PROGRESO Y EVALUACIÓN */}
      <StudentProgressReportDrawer
        isOpen={reportDrawerOpen}
        onClose={() => setReportDrawerOpen(false)}
        studentId={reportStudentId}
        studentsList={students}
      />

      {/* DRAWER: CRONOLOGÍA EVOLUTIVA & COMPARATIVA DE PROGRESS REPORTS */}
      <StudentEvolutionTimelineDrawer
        isOpen={evolutionDrawerOpen}
        onClose={() => setEvolutionDrawerOpen(false)}
        student={evolutionStudent}
      />

      {/* DRAWER: 360° CHARACTERIZATION MATRIX & COMPARATOR */}
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

      {/* DRAWER: 360° CHARACTERIZATION FORM */}
      <CharacterizationFormDrawer
        isOpen={charFormDrawerOpen}
        onClose={() => setCharFormDrawerOpen(false)}
        student={charFormStudent}
        initialData={charEditingItem}
        onSaved={() => {
          setCharFormDrawerOpen(false);
          setMatrixRefreshTrigger(prev => prev + 1);
          loadData();
        }}
      />

      {/* STUDENT ACTIONS OPTIONS MODAL / BOTTOM SHEET */}
      {mobileStudentSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => {
            setMobileStudentSheet(null);
            setSheetDragY(0);
          }}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-forest/15 shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto relative"
            style={{
              transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : undefined,
              transition: sheetDragY > 0 ? 'none' : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              setSheetTouchStartY(e.touches[0].clientY);
              setSheetDragY(0);
            }}
            onTouchMove={(e) => {
              if (sheetTouchStartY !== null) {
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - sheetTouchStartY;
                if (deltaY > 0) {
                  setSheetDragY(deltaY);
                }
              }
            }}
            onTouchEnd={() => {
              if (sheetDragY > 40) {
                setMobileStudentSheet(null);
              }
              setSheetTouchStartY(null);
              setSheetDragY(0);
            }}
          >
            {/* Gesture Pill Handle (Mobile) */}
            <div className="w-12 h-1.5 bg-forest/20 rounded-full mx-auto -mt-1 cursor-grab sm:hidden" />

            {/* Student Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-forest/10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-forest/10 flex items-center justify-center text-forest font-bold font-display text-base shrink-0 shadow-2xs border border-forest/15">
                  {mobileStudentSheet.avatar_url ? (
                    <img src={mobileStudentSheet.avatar_url} alt={mobileStudentSheet.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{mobileStudentSheet.full_name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-forest text-base leading-tight truncate">
                    {mobileStudentSheet.full_name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span className="font-medium">{selectedEnvObj?.name || 'Ambiente Montessori'}</span>
                    {mobileStudentSheet.enrollment_code && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{mobileStudentSheet.enrollment_code}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setMobileStudentSheet(null)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-forest hover:bg-forest/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions List */}
            <div className="space-y-2.5 pb-3">
              {/* Option 1: Caracterización 360° */}
              <button
                type="button"
                onClick={() => {
                  const s = mobileStudentSheet;
                  setMobileStudentSheet(null);
                  setMatrixStudent(s);
                  setMatrixDrawerOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 flex items-center gap-3.5 text-left transition-all active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-950 text-xs">Caracterización 360°</h4>
                  <span className="text-[11px] text-amber-800/80 block">
                    Matriz de habilidades y comparador guía vs tutor
                  </span>
                </div>
              </button>

              {/* Option 2: Cronología de Evaluaciones y Retos */}
              <button
                type="button"
                onClick={() => {
                  const s = mobileStudentSheet;
                  setMobileStudentSheet(null);
                  setEvolutionStudent(s);
                  setEvolutionDrawerOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 flex items-center gap-3.5 text-left transition-all active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">Cronología de Evolución</h4>
                  <span className="text-[11px] text-emerald-800/80 block">
                    Línea de tiempo de conferencias, acuerdos y retos
                  </span>
                </div>
              </button>

              {/* Option 3: Reporte en PDF */}
              <button
                type="button"
                onClick={() => {
                  const sId = mobileStudentSheet.id;
                  setMobileStudentSheet(null);
                  setReportStudentId(sId);
                  setReportDrawerOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-forest/5 hover:bg-forest/10 border border-forest/10 flex items-center gap-3.5 text-left transition-all active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-forest text-xs">Generar Informe en PDF</h4>
                  <span className="text-[11px] text-muted-foreground block">
                    Reporte oficial de progreso pedagógico imprimible
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Root-Level Mobile Salon Selector Bottom Sheet Overlay (z-[100] above everything) */}
      {isMobileEnvOpen && (
        <div
          className="!mt-0 fixed inset-0 top-0 left-0 right-0 bottom-0 h-screen h-[100dvh] max-h-[100dvh] z-[100] bg-black/60 backdrop-blur-xs flex items-end sm:hidden animate-in fade-in duration-200 overflow-hidden"
          onClick={() => {
            setIsMobileEnvOpen(false);
            setEnvSheetDragY(0);
          }}
        >
          <div
            className="w-full bg-white rounded-t-3xl border-t border-forest/15 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-250 max-h-[100dvh] text-forest"
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: envSheetDragY > 0 ? `translateY(${envSheetDragY}px)` : undefined,
              transition: isEnvDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Touch Handle Bar Header */}
            <div
              className="p-5 pb-3 border-b border-forest/10 shrink-0 bg-white select-none rounded-t-3xl"
              onTouchStart={handleEnvTouchStart}
              onTouchMove={handleEnvTouchMove}
              onTouchEnd={handleEnvTouchEnd}
            >
              <div className="w-12 h-1.5 bg-forest/25 rounded-full mx-auto -mt-1 mb-3 cursor-grab active:cursor-grabbing shrink-0 transition-colors" />

              <div className="flex items-center justify-between">
                <span className="font-bold text-forest text-sm font-display">
                  Seleccionar Salón / Ambiente
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {allowedEnvironments.length} {allowedEnvironments.length === 1 ? 'ambiente' : 'ambientes'}
                </span>
              </div>
            </div>

            {/* Scrollable Salones List */}
            <div className="space-y-2 p-5 pt-3 pb-6 overflow-y-auto flex-1 overscroll-contain">
              {allowedEnvironments.map((env) => {
                const isSelected = selectedEnvId === env.id;
                const envStudentsCount = students.filter(s => s.environment_id === env.id).length;
                const ageLabel = env.min_age_years && env.max_age_years
                  ? `${env.min_age_years} - ${env.max_age_years} años`
                  : env.stage || 'Montessori';

                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => {
                      setSelectedEnvId(env.id);
                      setIsMobileEnvOpen(false);
                      setEnvSheetDragY(0);
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left flex items-center justify-between gap-3 transition-all active:scale-[0.99] border ${isSelected
                      ? 'bg-forest text-white font-bold border-forest shadow-sm ring-2 ring-forest/20'
                      : 'bg-forest/5 hover:bg-forest/10 text-forest border-forest/10 shadow-2xs'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`w-3.5 h-3.5 rounded-full shrink-0 ${isSelected ? 'ring-2 ring-white shadow-xs' : 'ring-1 ring-forest/20'}`}
                        style={{ backgroundColor: env.color || '#1b3b2b' }}
                      />
                      <div className="truncate">
                        <span className="text-xs truncate block font-display">{env.name}</span>
                        <span className={`text-[10px] block truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {ageLabel} • {envStudentsCount} {envStudentsCount === 1 ? 'alumno' : 'alumnos'}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}







    </div>
  );
};

export default MontessoriSection;
