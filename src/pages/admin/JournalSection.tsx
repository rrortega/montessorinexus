import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
 BookOpen,
 CheckSquare,
 TrendingUp,
 Search,
 Filter,
 ArrowUpDown,
 Calendar as CalendarIcon,
 ChevronRight,
 ChevronDown,
 Sparkles,
 Layers,
 Clock,
 Eye,
 Check,
 RotateCcw,
 Sliders,
 CheckCircle2,
 PlayCircle,
 Award,
 Star,
 User,
 Activity,
 HeartHandshake,
 Download,
 Info,
 Maximize2,
 Minimize2,
 Compass,
 ShieldCheck,
 HelpCircle,
 Play,
 Pause,
 Plus,
 Flame,
 Zap,
 Heart,
 Target,
 Mic
} from 'lucide-react';
import { MobileMenuButton, useAdminDashboard } from './AdminDashboard';
import {
 EnvironmentItem,
 StudentItem,
 MontessoriAreaItem,
 StudentProgressItem,
 AssessmentScaleItem,
 AssessmentDisplayMode,
 DEFAULT_ASSESSMENT_SCALES,
 getAssessmentSettings,
 getEnvironments,
 getStudents,
 getMontessoriCurriculum,
 getMontessoriProgress,
 saveMontessoriProgress,
 TrackerCategoryItem,
 getTrackerCategories,
 getMontessoriObservations,
 parseTrackerLogsFromObservations
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { VoiceNoteTextarea } from '@/components/ui/VoiceNoteTextarea';
import { MontessoriVoiceLoggerDrawer } from '@/components/admin/MontessoriVoiceLoggerDrawer';
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

type JournalTab = 'work_cycle' | 'lessons' | 'trackers' | 'growth';
type SortOrder = 'alpha_asc' | 'alpha_desc' | 'progress_desc' | 'progress_asc';
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

// PERSONAL GROWTH SKILLS MONTESSORI FRAMEWORK
interface GrowthSkillItem {
 id: string;
 category: string;
 name: string;
 description: string;
 color: string;
}

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

export const JournalSection: React.FC = () => {
 const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
 const [activeTab, setActiveTab] = useState<JournalTab>('work_cycle');
 const [loading, setLoading] = useState(true);

 // Work Cycle Live State (Off by default if trial expired)
 const [cycleRunning, setCycleRunning] = useState<boolean>(() => !isReadOnly);
 const [cycleSeconds, setCycleSeconds] = useState<number>(3900); // 1h 05m in
 const [studentCycleMap, setStudentCycleMap] = useState<Record<string, StudentCycleState>>({});
 const [cycleFilterState, setCycleFilterState] = useState<string>('all');
 const [cycleFilterArea, setCycleFilterArea] = useState<string>('all');

 // Core Data
 const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
 const [selectedEnvId, setSelectedEnvId] = useState<string>('');
 const [students, setStudents] = useState<StudentItem[]>([]);
 const [curriculum, setCurriculum] = useState<MontessoriAreaItem[]>([]);
 const [progressRecords, setProgressRecords] = useState<StudentProgressItem[]>([]);
 const [trackerCategories, setTrackerCategories] = useState<TrackerCategoryItem[]>([]);
 const [assessmentScales, setAssessmentScales] = useState<AssessmentScaleItem[]>(DEFAULT_ASSESSMENT_SCALES);
 const [displayMode, setDisplayMode] = useState<AssessmentDisplayMode>('circles');

 // Interactive UI State
 const [searchQuery, setSearchQuery] = useState('');
 const [sortOrder, setSortOrder] = useState<SortOrder>('alpha_asc');
 const [filterStatus, setFilterStatus] = useState<string>('all');
 const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
 const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

 // Trackers In-Memory Daily State: trackerId_studentId -> value
 const [dailyTrackerLogs, setDailyTrackerLogs] = useState<Record<string, { value: any; notes?: string }>>({});
 // Growth Skills In-Memory State: skillId_studentId -> level (1..4)
 const [dailyGrowthLogs, setDailyGrowthLogs] = useState<Record<string, { level: number; notes?: string }>>({});

 // SlideOver Quick Action Drawer
 const [cellDrawerOpen, setCellDrawerOpen] = useState(false);
 const [voiceLoggerOpen, setVoiceLoggerOpen] = useState(false);
 const [voiceLoggerStudentId, setVoiceLoggerStudentId] = useState<string | undefined>(undefined);
 const [drawerStudent, setDrawerStudent] = useState<StudentItem | null>(null);
 const [drawerItem, setDrawerItem] = useState<{
 type: 'lesson' | 'tracker' | 'growth';
 title: string;
 subtitle: string;
 description?: string;
 id: string;
 } | null>(null);
 const [drawerStatus, setDrawerStatus] = useState<string>('PRESENTED');
 const [drawerNotes, setDrawerNotes] = useState<string>('');
 const [savingProgress, setSavingProgress] = useState(false);

 const tableScrollRef = useRef<HTMLDivElement>(null);

 // Load All Primary Data
 const loadInitialData = async () => {
 setLoading(true);
 try {
 const [envsData, studentsData, curData, assessmentData, trackersData, obsData] = await Promise.all([
 getEnvironments(),
 getStudents(),
 getMontessoriCurriculum(),
 getAssessmentSettings(),
 getTrackerCategories(),
 getMontessoriObservations()
 ]);

 setEnvironments(envsData);
 setStudents(studentsData);
 setCurriculum(curData);
 setTrackerCategories(trackersData);

 const parsedLogs = parseTrackerLogsFromObservations(obsData, trackersData);
 setDailyTrackerLogs(parsedLogs);

 if (assessmentData?.scales && assessmentData.scales.length > 0) {
 setAssessmentScales(assessmentData.scales);
 }
 if (assessmentData?.displayMode) {
 setDisplayMode(assessmentData.displayMode);
 }

 const defaultEnv = envsData.length > 0 ? envsData[0].id : '';
 setSelectedEnvId(defaultEnv);

 if (defaultEnv) {
 const [progData, obsData] = await Promise.all([
 getMontessoriProgress({ environmentId: defaultEnv }),
 getMontessoriObservations()
 ]);
 setProgressRecords(progData);
 setDailyTrackerLogs(parseTrackerLogsFromObservations(obsData, trackersData));
 }
 } catch (e) {
 console.error('Error loading journal initial data:', e);
 toast.error('Error al cargar datos del Diario Pedagógico.');
 } finally {
 setLoading(false);
 }
 };

 // Reload progress and observations when environment, date or categories change
 useEffect(() => {
 if (selectedEnvId) {
 getMontessoriProgress({ environmentId: selectedEnvId }).then(setProgressRecords);
 getMontessoriObservations().then(obsData => {
 setDailyTrackerLogs(parseTrackerLogsFromObservations(obsData, trackerCategories));
 });
 }
 }, [selectedEnvId, selectedDate, trackerCategories]);

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

 // Seed default student cycle data when students load
 useEffect(() => {
 if (students.length > 0 && Object.keys(studentCycleMap).length === 0) {
 const sampleMaterials = [
 { area: 'Sensorial', material: 'Torre Rosa (10 cubos)', state: 'deep_flow' as CycleStateKey, min: 42 },
 { area: 'Lenguaje', material: 'Alfabeto Móvil (Fonemas)', state: 'presentation' as CycleStateKey, min: 18 },
 { area: 'Vida Práctica', material: 'Lavado de Manos', state: 'autonomous' as CycleStateKey, min: 25 },
 { area: 'Matemáticas', material: 'Cuentas Doradas (Sistema Decimal)', state: 'deep_flow' as CycleStateKey, min: 35 },
 { area: 'Sensorial', material: 'Cilindros con Botón', state: 'autonomous' as CycleStateKey, min: 20 },
 { area: 'Lenguaje', material: 'Letras de Lija', state: 'presentation' as CycleStateKey, min: 15 },
 { area: 'Vida Práctica', material: 'Arreglo Floral y Gracia', state: 'grace_courtesy' as CycleStateKey, min: 12 },
 { area: 'Ciencias / Cósmica', material: 'Gabinete de Botánica', state: 'deep_flow' as CycleStateKey, min: 28 },
 { area: 'Sensorial', material: 'Escalera Marrón', state: 'autonomous' as CycleStateKey, min: 22 },
 { area: 'Matemáticas', material: 'Barras Numéricas', state: 'deep_flow' as CycleStateKey, min: 31 }
 ];

 const initial: Record<string, StudentCycleState> = {};
 students.forEach((st, idx) => {
 const sample = sampleMaterials[idx % sampleMaterials.length];
 initial[st.id] = {
 state: sample.state,
 areaName: sample.area,
 materialName: sample.material,
 minutesInFlow: sample.min,
 notes: ''
 };
 });
 setStudentCycleMap(initial);
 }
 }, [students]);

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
 title: 'Fase 3: Gran Trabajo Concentración Máxima',
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

 // Compute Normalization & Area Statistics in Environment
 const cycleMetrics = useMemo(() => {
 const total = currentStudents.length || 1;
 let inFlowCount = 0;
 const areasCount: Record<string, number> = {
 'Vida Práctica': 0,
 'Sensorial': 0,
 'Lenguaje': 0,
 'Matemáticas': 0,
 'Ciencias / Cósmica': 0
 };

 currentStudents.forEach(st => {
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
 }, [currentStudents, studentCycleMap]);

 // Update specific student cycle state
 const handleUpdateStudentCycle = (studentId: string, updates: Partial<StudentCycleState>) => {
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

 // Open drawer from cycle card for real progress saving
 const handleOpenCycleDrawer = (student: StudentItem) => {
 const entry = studentCycleMap[student.id];
 setDrawerStudent(student);
 setDrawerItem({
 type: 'lesson',
 id: entry?.lessonId || `cycle_obs_${student.id}`,
 title: entry?.materialName || 'Observación del Ciclo de 3h',
 subtitle: `${entry?.areaName || 'Montessori'} • Estado: ${CYCLE_STATE_CONFIG[entry?.state || 'deep_flow'].label}`,
 description: `Observación registrada en el Ciclo Matutino (${formatCycleTime(cycleSeconds)} transcurrido).`
 });
 setDrawerStatus('PRESENTED');
 setDrawerNotes(entry?.notes || `Observado en ${entry?.materialName || 'material'} durante ${entry?.minutesInFlow || 20} minutos.`);
 setCellDrawerOpen(true);
 };

 // Reload progress when active environment changes
 useEffect(() => {
 if (selectedEnvId) {
 getMontessoriProgress({ environmentId: selectedEnvId })
 .then(setProgressRecords)
 .catch(console.error);
 }
 }, [selectedEnvId]);

 // Students in selected environment
 const currentStudents = useMemo(() => {
 let list = students.filter(s => s.environment_id === selectedEnvId || (!s.environment_id && !selectedEnvId));

 switch (sortOrder) {
 case 'alpha_asc':
 list.sort((a, b) => a.full_name.localeCompare(b.full_name));
 break;
 case 'alpha_desc':
 list.sort((a, b) => b.full_name.localeCompare(a.full_name));
 break;
 default:
 break;
 }
 return list;
 }, [students, selectedEnvId, sortOrder]);

 const activeEnv = useMemo(() => {
 return environments.find(e => e.id === selectedEnvId) || environments[0];
 }, [environments, selectedEnvId]);

 // Lookup progress record helper
 const getStudentRecord = (studentId: string, lessonId: string) => {
 return progressRecords.find(p => p.studentId === studentId && p.lessonId === lessonId);
 };

 // Resolve scale config
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

 // Render Visual for Lesson Cell
 const renderVisual = (scale: AssessmentScaleItem | null) => {
 if (!scale) {
 return <span className="w-2.5 h-2.5 rounded-full bg-forest/15 inline-block mx-auto" />;
 }

 const IconComp = (scale.icon && ICON_MAP[scale.icon]) ? ICON_MAP[scale.icon] : Sparkles;

 switch (displayMode) {
 case 'circles':
 return (
 <div
 className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-2xs mx-auto transition-transform hover:scale-125"
 style={{ backgroundColor: scale.color }}
 title={`${scale.label} (${scale.acronym})`}
 />
 );
 case 'letters':
 return (
 <span
 className="font-mono font-black text-xs sm:text-sm inline-flex items-center justify-center transition-transform hover:scale-125"
 style={{ color: scale.color }}
 title={`${scale.label} (${scale.acronym})`}
 >
 {scale.acronym}
 </span>
 );
 case 'icons':
 return (
 <span
 className="inline-flex items-center justify-center transition-transform hover:scale-125"
 style={{ color: scale.color }}
 title={`${scale.label} (${scale.acronym})`}
 >
 <IconComp className="w-4 h-4 stroke-[2.5]" />
 </span>
 );
 case 'badges':
 return (
 <span
 className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white shadow-2xs whitespace-nowrap"
 style={{ backgroundColor: scale.color }}
 title={`${scale.label} (${scale.acronym})`}
 >
 <IconComp className="w-2.5 h-2.5 shrink-0" />
 <span>{scale.acronym}</span>
 </span>
 );
 }
 };

 // Toggle Area Expansion
 const toggleAreaExpand = (areaId: string) => {
 setExpandedAreas(prev => ({
 ...prev,
 [areaId]: !prev[areaId]
 }));
 };

 // Expand / Collapse all areas
 const toggleExpandAll = () => {
 const allExpanded = curriculum.every(a => expandedAreas[a.id]);
 const nextState: Record<string, boolean> = {};
 curriculum.forEach(a => {
 nextState[a.id] = !allExpanded;
 });
 setExpandedAreas(nextState);
 };

 // Filtered Curriculum
 const filteredCurriculum = useMemo(() => {
 const q = searchQuery.toLowerCase().trim();
 if (!q) return curriculum;

 return curriculum
 .map(area => {
 const matchesArea = area.name.toLowerCase().includes(q);
 const filteredCategories = area.categories
 .map(cat => {
 const matchesCat = cat.name.toLowerCase().includes(q);
 const filteredLessons = cat.lessons.filter(l =>
 matchesArea || matchesCat || l.name.toLowerCase().includes(q)
 );
 return { ...cat, lessons: filteredLessons };
 })
 .filter(cat => cat.lessons.length > 0);

 return { ...area, categories: filteredCategories };
 })
 .filter(area => area.categories.length > 0);
 }, [curriculum, searchQuery]);

 // Filtered Tracker Categories for Search
 const filteredTrackerCategories = useMemo(() => {
 const q = searchQuery.toLowerCase().trim();
 if (!q) return trackerCategories;

 const matchesAnyStudent = currentStudents.some(s => s.full_name.toLowerCase().includes(q));

 return trackerCategories
 .map(cat => {
 const matchesCat = cat.name.toLowerCase().includes(q);
 const filteredSubs = (cat.subcategories || [])
 .map(sub => {
 const matchesSub = sub.name.toLowerCase().includes(q);
 const filteredItems = (sub.items || []).filter(item => {
 if (matchesCat || matchesSub || matchesAnyStudent) return true;
 if (item.name.toLowerCase().includes(q)) return true;
 // Check if any student has a note in dailyTrackerLogs containing search query
 return currentStudents.some(st => {
 const keyWithDate = `${item.id}_${st.id}_${selectedDate}`;
 const keyFallback = `${item.id}_${st.id}`;
 const log = dailyTrackerLogs[keyWithDate] || (dailyTrackerLogs[keyFallback]?.date === selectedDate ? dailyTrackerLogs[keyFallback] : undefined);
 return (
 log?.notes?.toLowerCase().includes(q) ||
 log?.publicNotes?.toLowerCase().includes(q) ||
 log?.privateNotes?.toLowerCase().includes(q)
 );
 });
 });
 return { ...sub, items: filteredItems };
 })
 .filter(sub => (sub.items || []).length > 0);

 return { ...cat, subcategories: filteredSubs };
 })
 .filter(cat => cat.subcategories.length > 0);
 }, [trackerCategories, searchQuery, currentStudents, dailyTrackerLogs, selectedDate]);

 // Calculate percentage of lessons mastered / presented in an area for a student
 const calculateAreaPercentage = (area: MontessoriAreaItem, studentId: string) => {
 let totalLessons = 0;
 let completedLessons = 0;

 for (const cat of area.categories) {
 for (const les of cat.lessons) {
 totalLessons++;
 const record = getStudentRecord(studentId, les.id);
 if (record && (record.status === 'MASTERED' || record.status === 'SUPERIOR' || record.status === 'PRACTICING' || record.status === 'PRESENTED')) {
 completedLessons += record.status === 'MASTERED' || record.status === 'SUPERIOR' ? 1 : 0.5;
 }
 }
 }

 if (totalLessons === 0) return 0;
 return Math.round((completedLessons / totalLessons) * 100);
 };

 // Open Cell Drawer for Lesson
 const handleOpenLessonCell = (student: StudentItem, lesson: any, areaName: string) => {
 const record = getStudentRecord(student.id, lesson.id);
 setDrawerStudent(student);
 setDrawerItem({
 type: 'lesson',
 id: lesson.id,
 title: lesson.name,
 subtitle: `${areaName} • ${lesson.categoryName || 'Material Montessori'}`,
 description: lesson.description || 'Presentación pedagógica del método Montessori.'
 });
 setDrawerStatus(record?.status || 'PRESENTED');
 setDrawerNotes(record?.notes || '');
 setCellDrawerOpen(true);
 };

 // Open Cell Drawer for Tracker
 const handleOpenTrackerCell = (student: StudentItem, tracker: any, categoryName: string) => {
 const keyWithDate = `${tracker.id}_${student.id}_${selectedDate}`;
 const keyFallback = `${tracker.id}_${student.id}`;
 const current = dailyTrackerLogs[keyWithDate] || (dailyTrackerLogs[keyFallback]?.date === selectedDate ? dailyTrackerLogs[keyFallback] : undefined);
 setDrawerStudent(student);
 setDrawerItem({
 type: 'tracker',
 id: tracker.id,
 title: tracker.name,
 subtitle: `Tracker Diario • ${categoryName}`,
 description: tracker.description || 'Registro de hábitos y rutinas pedagógicas.'
 });
 setDrawerStatus(current?.value || 'YES');
 setDrawerNotes(current?.notes || current?.publicNotes || '');
 setCellDrawerOpen(true);
 };

 // Open Cell Drawer for Growth Skill
 const handleOpenGrowthCell = (student: StudentItem, skill: GrowthSkillItem) => {
 const key = `${skill.id}_${student.id}`;
 const current = dailyGrowthLogs[key];
 setDrawerStudent(student);
 setDrawerItem({
 type: 'growth',
 id: skill.id,
 title: skill.name,
 subtitle: `Habilidad de Crecimiento • ${skill.category}`,
 description: skill.description
 });
 setDrawerStatus(String(current?.level || '2'));
 setDrawerNotes(current?.notes || '');
 setCellDrawerOpen(true);
 };

 // Save changes from drawer
 const handleSaveDrawer = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!drawerStudent || !drawerItem) return;

 setSavingProgress(true);
 try {
 if (drawerItem.type === 'lesson') {
 await saveMontessoriProgress({
 studentId: drawerStudent.id,
 lessonId: drawerItem.id,
 status: drawerStatus,
 notes: drawerNotes.trim(),
 presentedAt: `${selectedDate}T12:00:00.000Z`
 });
 const updated = await getMontessoriProgress({ environmentId: selectedEnvId });
 setProgressRecords(updated);
 toast.success(`Progreso actualizado para ${drawerStudent.full_name}`);
 } else if (drawerItem.type === 'tracker') {
 const keyWithDate = `${drawerItem.id}_${drawerStudent.id}_${selectedDate}`;
 const key = `${drawerItem.id}_${drawerStudent.id}`;
 const newLog = { value: drawerStatus, notes: drawerNotes.trim(), publicNotes: drawerNotes.trim(), date: selectedDate };
 setDailyTrackerLogs(prev => ({
 ...prev,
 [key]: newLog,
 [keyWithDate]: newLog
 }));
 await saveStructuredMontessoriObservation({
 studentId: drawerStudent.id,
 content: `[${drawerItem.title}]: ${drawerStatus === 'YES' ? 'Realizado' : drawerStatus === 'PARTIAL' ? 'En proceso' : 'No realizado'}${drawerNotes ? `\n\nFamilias: ${drawerNotes}` : ''}`,
 date: `${selectedDate}T12:00:00.000Z`,
 createdAt: `${selectedDate}T12:00:00.000Z`
 });
 toast.success(`Tracker guardado para ${drawerStudent.full_name}`);
 } else if (drawerItem.type === 'growth') {
 const key = `${drawerItem.id}_${drawerStudent.id}`;
 setDailyGrowthLogs(prev => ({
 ...prev,
 [key]: { level: Number(drawerStatus) || 2, notes: drawerNotes.trim() }
 }));
 toast.success(`Habilidad guardada para ${drawerStudent.full_name}`);
 }

 setCellDrawerOpen(false);
 } catch (err: any) {
 toast.error(err.message || 'Error al guardar registro');
 } finally {
 setSavingProgress(false);
 }
 };

 return (
 <div className="space-y-6 font-body animate-in fade-in duration-300 pb-16">
 
 {/* FULL-WIDTH HERO BANNER */}
 <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
 <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-start sm:items-center gap-3.5">
 <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
 <div className="space-y-1">
 <div className="flex items-center gap-2 flex-wrap">
 <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
 Diario Pedagógico (Journal)
 </h1>
 <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
 {currentStudents.length} alumnos • {activeEnv?.name || 'Ambiente'}
 </span>
 </div>
 <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
 Matriz interactiva de control diario: lecciones Montessori, hábitos de vida práctica y habilidades socioemocionales.
 </p>
 </div>
 </div>

 {/* ENVIRONMENT & DATE CONTROLS */}
 <div className="flex items-center gap-2 flex-wrap shrink-0">
 <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/20 backdrop-blur-md">
 <span className="text-[11px] font-bold text-white/80 px-2 flex items-center gap-1">
 <Layers className="w-3.5 h-3.5 text-white" />
 <span className="hidden sm:inline">Ambiente:</span>
 </span>
 <select
 value={selectedEnvId}
 onChange={(e) => setSelectedEnvId(e.target.value)}
 className="bg-forest text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 focus:outline-none cursor-pointer"
 >
 {environments.map(env => (
 <option key={env.id} value={env.id} className="bg-forest text-white">
 {env.name}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/20 backdrop-blur-md">
 <CalendarIcon className="w-3.5 h-3.5 text-white ml-2" />
 <input
 type="date"
 value={selectedDate}
 onChange={(e) => setSelectedDate(e.target.value)}
 className="bg-transparent text-white text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer"
 />
 </div>
 </div>
 </div>
 </div>

 {/* TOP NAVIGATION TABS (MONTESSORI COMPASS ELEVATED STYLE) */}
 <div className="flex items-center justify-between gap-4 flex-wrap border-b border-forest/10 pb-1">
 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
 {/* Work Cycle 3-Hour Live Tab */}
 <button
 type="button"
 onClick={() => setActiveTab('work_cycle')}
 className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
 activeTab === 'work_cycle'
 ? 'bg-[#C4661F] text-white shadow-md scale-105'
 : 'bg-white text-forest/80 hover:bg-[#C4661F]/10 border border-[#C4661F]/30'
 }`}
 >
 <Compass className="w-4 h-4 text-inherit" />
 <span>Ciclo de Trabajo (3h)</span>
 <span
 className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight shadow-2xs ${
 activeTab === 'work_cycle'
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
 onClick={() => setActiveTab('lessons')}
 className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
 activeTab === 'lessons'
 ? 'bg-forest text-white shadow-md scale-105'
 : 'bg-white text-forest/70 hover:bg-forest/5 border border-forest/10'
 }`}
 >
 <BookOpen className="w-4 h-4" />
 <span>Lecciones</span>
 <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-inherit font-mono">
 {curriculum.length} áreas
 </span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('trackers')}
 className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
 activeTab === 'trackers'
 ? 'bg-forest text-white shadow-md scale-105'
 : 'bg-white text-forest/70 hover:bg-forest/5 border border-forest/10'
 }`}
 >
 <CheckSquare className="w-4 h-4" />
 <span>Trackers & Hábitos</span>
 <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-inherit font-mono">
 {trackerCategories.length} cat.
 </span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('growth')}
 className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
 activeTab === 'growth'
 ? 'bg-forest text-white shadow-md scale-105'
 : 'bg-white text-forest/70 hover:bg-forest/5 border border-forest/10'
 }`}
 >
 <TrendingUp className="w-4 h-4" />
 <span>Habilidades de Crecimiento</span>
 <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-inherit font-mono">
 {DEFAULT_GROWTH_SKILLS.length} dim.
 </span>
 </button>
 </div>

 {/* MATRIX TOOLBAR CONTROLS */}
 <div className="flex items-center gap-2 flex-wrap">
 {/* Date Selector */}
 <div className="flex items-center gap-1.5 bg-white border border-forest/15 rounded-xl px-2.5 py-1.5 shadow-2xs">
 <CalendarIcon className="w-3.5 h-3.5 text-forest shrink-0" />
 <input
 type="date"
 value={selectedDate}
 onChange={(e) => setSelectedDate(e.target.value)}
 className="text-xs font-bold text-forest bg-transparent focus:outline-none cursor-pointer"
 />
 </div>

 {/* Search Box */}
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Buscar lección, tracker o alumno..."
 className="pl-8 pr-3 py-1.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-forest w-44 sm:w-56"
 />
 </div>

 {/* Sort Menu */}
 <div className="flex items-center gap-1 bg-white border border-forest/10 rounded-xl p-1 shadow-2xs">
 <ArrowUpDown className="w-3 h-3 text-forest ml-1.5" />
 <select
 value={sortOrder}
 onChange={(e) => setSortOrder(e.target.value as SortOrder)}
 className="text-[11px] font-bold text-forest bg-transparent focus:outline-none cursor-pointer pr-1"
 >
 <option value="alpha_asc">Alumnos (A-Z)</option>
 <option value="alpha_desc">Alumnos (Z-A)</option>
 </select>
 </div>

 {/* Expand / Collapse All (Lessons tab only) */}
 {activeTab === 'lessons' && (
 <button
 type="button"
 onClick={toggleExpandAll}
 className="px-3 py-1.5 bg-white hover:bg-forest/5 text-forest border border-forest/15 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
 >
 {curriculum.every(a => expandedAreas[a.id]) ? (
 <>
 <Minimize2 className="w-3.5 h-3.5" />
 <span>Colapsar</span>
 </>
 ) : (
 <>
 <Maximize2 className="w-3.5 h-3.5" />
 <span>Expandir Todo</span>
 </>
 )}
 </button>
 )}
 </div>
 </div>

 {/* RENDER VIEW: LIVE WORK CYCLE */}
 {activeTab === 'work_cycle' && (
 <div className="space-y-6">
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
 <span className="text-[#C4661F] font-bold">11:15 (Gran Trabajo )</span>
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
 {currentStudents
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
 <span className="text-[10px] text-muted-foreground block">
 {student.gender ? `${student.gender} • ` : ''}{entry.areaName}
 </span>
 </div>
 </div>

 <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 shrink-0 ${stateConfig.bgLight} ${stateConfig.textLight} ${stateConfig.border}`}>
 <StateIcon className="w-3 h-3 shrink-0" />
 <span>{stateConfig.shortLabel}</span>
 </div>
 </div>

 {/* State Selector Buttons */}
 <div className="grid grid-cols-5 gap-1 p-1 bg-forest/5 rounded-xl border border-forest/10">
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
 className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
 isSelected
 ? 'bg-white shadow-2xs font-bold'
 : 'opacity-60 hover:opacity-100 hover:bg-white/50'
 }`}
 style={{ color: isSelected ? cfg.color : undefined }}
 >
 <Icon className="w-3.5 h-3.5" />
 </button>
 );
 })}
 </div>

 {/* Active Montessori Material & Area */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-forest/70 uppercase tracking-wider block">
 Material Activo:
 </label>
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={entry.materialName}
 onChange={(e) => handleUpdateStudentCycle(student.id, { materialName: e.target.value })}
 placeholder="Ej. Torre Rosa, Alfabeto Móvil..."
 className="flex-1 px-3 py-1.5 rounded-xl border border-forest/15 text-forest bg-forest/5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-forest"
 />
 <select
 value={entry.areaName}
 onChange={(e) => handleUpdateStudentCycle(student.id, { areaName: e.target.value })}
 className="px-2 py-1.5 rounded-xl border border-forest/15 text-forest bg-white text-[11px] font-bold focus:outline-none cursor-pointer"
 >
 <option value="Sensorial">Sensorial</option>
 <option value="Lenguaje">Lenguaje</option>
 <option value="Vida Práctica">Vida Práctica</option>
 <option value="Matemáticas">Matemáticas</option>
 <option value="Ciencias / Cósmica">Cósmica</option>
 </select>
 </div>
 </div>

 {/* Flow timer and Quick Action */}
 <div className="flex items-center justify-between pt-2 border-t border-forest/10 text-[11px]">
 <span className="flex items-center gap-1 font-mono text-muted-foreground">
 <Clock className="w-3.5 h-3.5 text-[#C4661F]" />
 <span className="font-bold text-[#C4661F]">{entry.minutesInFlow} min</span> en flujo
 </span>

 <button
 type="button"
 onClick={() => handleOpenCycleDrawer(student)}
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

 {/* RENDER VIEW: CROSS-TAB MATRIX TABLE */}
 {activeTab !== 'work_cycle' && (
 currentStudents.length === 0 ? (
 <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 text-xs text-muted-foreground space-y-2">
 <User className="w-10 h-10 text-forest/30 mx-auto" />
 <p className="font-bold text-forest text-sm">No hay alumnos asignados a este ambiente</p>
 <p className="text-xs">Asigna alumnos al salón "{activeEnv?.name}" desde la sección de Estudiantes.</p>
 </div>
 ) : (
 <div className="bg-white rounded-3xl border border-forest/15 shadow-xs overflow-hidden">
 <div
 ref={tableScrollRef}
 className="overflow-x-auto max-h-[72vh] custom-horizontal-scrollbar scroll-smooth"
 >
 <table className="w-full text-left border-collapse">
 {/* STICKY TABLE HEADER: STUDENTS COLUMNS */}
 <thead className="sticky top-0 z-30 bg-forest text-white shadow-sm">
 <tr>
 {/* Intersection Header */}
 <th className="p-3.5 px-4 text-xs font-bold sticky left-0 z-40 bg-forest w-56 sm:w-72 min-w-[200px] sm:min-w-[260px] border-r border-white/10 shadow-sm">
 <div className="flex items-center justify-between">
 <span className="uppercase tracking-wider text-[11px] text-white/90">
 {activeTab === 'lessons' ? 'Áreas & Lecciones' : activeTab === 'trackers' ? 'Parámetros / Hábitos' : 'Dimensiones Montessori'}
 </span>
 <span className="text-[10px] text-white/60 font-mono">
 {currentStudents.length} niños
 </span>
 </div>
 </th>

 {/* Student Header Columns */}
 {currentStudents.map(student => (
 <th
 key={student.id}
 className="p-2 sm:p-2.5 min-w-[70px] max-w-[85px] sm:min-w-[85px] sm:max-w-[100px] border-r border-white/10 text-center font-bold text-xs"
 >
 <div className="flex flex-col items-center gap-1.5 py-1">
 {/* Student Avatar */}
 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-[10px] text-white font-bold shrink-0 border border-white/20 shadow-2xs">
 {student.avatar_url ? (
 <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
 ) : (
 student.full_name.charAt(0)
 )}
 </div>

 {/* Student Name */}
 <span
 className="text-[10px] sm:text-[11px] font-bold text-white/95 leading-tight truncate w-full text-center"
 title={student.full_name}
 >
 {student.full_name.split(' ')[0]}
 </span>
 </div>
 </th>
 ))}
 </tr>
 </thead>

 {/* TABLE BODY BASED ON ACTIVE TAB */}
 <tbody className="divide-y divide-forest/10 text-xs">
 {/* 1. LESSONS TAB VIEW */}
 {activeTab === 'lessons' && (
 <>
 {filteredCurriculum.map(area => {
 const isExpanded = !!expandedAreas[area.id];

 return (
 <React.Fragment key={area.id}>
 {/* AREA SUMMARY ROW (MONTESSORI COMPASS STYLE: SHOWS % PER STUDENT) */}
 <tr
 onClick={() => toggleAreaExpand(area.id)}
 className="bg-forest/[0.03] hover:bg-forest/10 transition-colors cursor-pointer group"
 >
 <td className="p-3 px-4 font-bold text-forest sticky left-0 z-20 bg-forest/[0.04] group-hover:bg-forest/[0.08] border-r border-forest/10 shadow-xs">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 min-w-0">
 <span
 className="w-3 h-3 rounded-full shrink-0"
 style={{ backgroundColor: area.color || '#1b3b2b' }}
 />
 <span className="truncate font-display text-xs sm:text-sm font-bold text-forest">
 {area.name}
 </span>
 </div>
 <div className="flex items-center gap-1 shrink-0 text-forest/70">
 <span className="text-[10px] font-mono font-semibold">
 {area.categories.reduce((s, c) => s + c.lessons.length, 0)} lecc.
 </span>
 {isExpanded ? (
 <ChevronDown className="w-4 h-4 text-forest" />
 ) : (
 <ChevronRight className="w-4 h-4 text-forest/60" />
 )}
 </div>
 </div>
 </td>

 {/* Percentage column per student */}
 {currentStudents.map(student => {
 const pct = calculateAreaPercentage(area, student.id);
 return (
 <td
 key={student.id}
 className="p-2 border-r border-forest/5 text-center font-bold text-forest text-[11px]"
 >
 <div className="flex flex-col items-center justify-center">
 <span className={pct > 0 ? 'text-forest font-bold font-mono' : 'text-muted-foreground/60 font-mono'}>
 {pct}%
 </span>
 {pct > 0 && (
 <div className="w-8 h-1 bg-forest/10 rounded-full overflow-hidden mt-0.5">
 <div
 className="h-full rounded-full"
 style={{
 width: `${pct}%`,
 backgroundColor: area.color || '#1b3b2b'
 }}
 />
 </div>
 )}
 </div>
 </td>
 );
 })}
 </tr>

 {/* EXPANDED LESSONS UNDER THIS AREA */}
 {isExpanded &&
 area.categories.map(category => (
 <React.Fragment key={category.id}>
 {/* Category Subheader */}
 <tr className="bg-forest/[0.01]">
 <td className="py-1.5 px-6 font-semibold text-forest/70 text-[11px] sticky left-0 z-20 bg-forest/[0.02] border-r border-forest/10 uppercase tracking-wider">
 ↳ {category.name}
 </td>
 {currentStudents.map(student => (
 <td key={student.id} className="border-r border-forest/5 bg-forest/[0.01]" />
 ))}
 </tr>

 {/* Individual Lessons */}
 {category.lessons.map(lesson => (
 <tr key={lesson.id} className="hover:bg-forest/5 transition-colors">
 <td className="py-2 pl-9 pr-4 text-xs text-forest sticky left-0 z-20 bg-white border-r border-forest/10 shadow-xs">
 <span className="block truncate font-medium" title={lesson.name}>
 {lesson.name}
 </span>
 </td>

 {currentStudents.map(student => {
 const record = getStudentRecord(student.id, lesson.id);
 const scale = record ? getScaleConfig(record.status) : null;

 return (
 <td
 key={student.id}
 onClick={() => handleOpenLessonCell(student, lesson, area.name)}
 className="p-1.5 border-r border-forest/5 text-center cursor-pointer hover:bg-forest/10 transition-colors"
 >
 <div className="flex justify-center items-center">
 {renderVisual(scale)}
 </div>
 </td>
 );
 })}
 </tr>
 ))}
 </React.Fragment>
 ))}
 </React.Fragment>
 );
 })}
 </>
 )}

 {/* 2. TRACKERS TAB VIEW */}
 {activeTab === 'trackers' && (
 <>
 {filteredTrackerCategories.map(cat => (
 <React.Fragment key={cat.id}>
 {/* Category Row */}
 <tr className="bg-forest/[0.04] font-bold text-forest">
 <td className="p-3 px-4 sticky left-0 z-20 bg-forest/[0.06] border-r border-forest/10 uppercase tracking-wider text-xs">
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#1b3b2b' }} />
 <span>{cat.name}</span>
 </div>
 </td>
 {currentStudents.map(student => (
 <td key={student.id} className="border-r border-forest/5 bg-forest/[0.04]" />
 ))}
 </tr>

 {/* Tracker Subcategory Items */}
 {cat.subcategories.map(sub => (
 <React.Fragment key={sub.id}>
 {(sub.items || []).map(item => (
 <tr key={item.id} className="hover:bg-forest/5 transition-colors">
 <td className="py-2.5 pl-8 pr-4 text-xs font-medium text-forest sticky left-0 z-20 bg-white border-r border-forest/10 shadow-xs">
 <div className="truncate">
 <span className="block truncate font-bold text-forest">{item.name}</span>
 <span className="block text-[10px] text-muted-foreground truncate">{sub.name}</span>
 </div>
 </td>

 {currentStudents.map(student => {
 const keyWithDate = `${item.id}_${student.id}_${selectedDate}`;
 const keyFallback = `${item.id}_${student.id}`;
 const log = dailyTrackerLogs[keyWithDate] || (dailyTrackerLogs[keyFallback]?.date === selectedDate ? dailyTrackerLogs[keyFallback] : undefined);
 const isYes = log?.value === 'YES';
 const isNo = log?.value === 'NO';
 const isPartial = log?.value === 'PARTIAL';
 const hasNotesOrPhoto = Boolean(log?.photoUrl || log?.publicNotes || log?.privateNotes || log?.notes);

 const trackerTooltip = `${student.full_name} • ${item.name}\nEstado: ${isYes ? 'Realizado (Sí)' : isNo ? 'No realizado' : isPartial ? 'En proceso' : 'Sin registrar'}${log?.publicNotes ? `\n Familias: "${log.publicNotes}"` : ''}${log?.privateNotes ? `\n Interno Guía: "${log.privateNotes}"` : ''}${log?.photoUrl ? '\n Foto adjunta' : ''}\n(Clic para registrar o ver detalles)`;

 return (
 <td
 key={student.id}
 onClick={() => handleOpenTrackerCell(student, item, cat.name)}
 title={trackerTooltip}
 className="p-2 border-r border-forest/5 text-center cursor-pointer hover:bg-forest/10 transition-colors"
 >
 <div className="flex justify-center items-center">
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
 ) : isPartial ? (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs flex items-center gap-1">
 <span>Proceso</span>
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

 {/* 3. PERSONAL GROWTH SKILLS VIEW */}
 {activeTab === 'growth' && (
 <>
 {DEFAULT_GROWTH_SKILLS.map(skill => (
 <tr key={skill.id} className="hover:bg-forest/5 transition-colors">
 <td className="p-3 px-4 font-bold text-forest sticky left-0 z-20 bg-white border-r border-forest/10 shadow-xs">
 <div className="space-y-0.5">
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: skill.color }} />
 <span className="font-bold text-forest text-xs truncate">{skill.name}</span>
 </div>
 <span className="block text-[10px] text-muted-foreground truncate">{skill.category}</span>
 </div>
 </td>

 {currentStudents.map(student => {
 const key = `${skill.id}_${student.id}`;
 const log = dailyGrowthLogs[key];
 const lvl = log?.level || 0;

 return (
 <td
 key={student.id}
 onClick={() => handleOpenGrowthCell(student, skill)}
 className="p-2 border-r border-forest/5 text-center cursor-pointer hover:bg-forest/10 transition-colors"
 >
 <div className="flex flex-col items-center justify-center">
 {lvl > 0 ? (
 <span
 className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-2xs"
 style={{ backgroundColor: skill.color }}
 >
 Nivel {lvl}
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
 )
 )}

 {/* QUICK EVALUATION / DETAIL SLIDEOVER DRAWER */}
 {drawerStudent && drawerItem && (
 <SlideOverDrawer
 isOpen={cellDrawerOpen}
 onClose={() => setCellDrawerOpen(false)}
 title={drawerItem.title}
 description={drawerItem.subtitle}
 maxWidthClass="max-w-md"
 icon={<Compass className="w-5 h-5 text-forest" />}
 footer={
 <div className="grid grid-cols-2 gap-3 w-full">
 <button
 type="button"
 onClick={() => setCellDrawerOpen(false)}
 disabled={savingProgress}
 className="w-full py-2.5 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-xl transition-all"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleSaveDrawer}
 disabled={savingProgress}
 className="w-full py-2.5 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
 >
 <Check className="w-4 h-4" />
 <span>{savingProgress ? 'Guardando...' : 'Guardar'}</span>
 </button>
 </div>
 }
 >
 <div className="space-y-5 p-4 text-xs font-body">
 {/* Student Card */}
 <div className="flex items-center gap-3 p-3 bg-forest/5 rounded-2xl border border-forest/10">
 <div className="w-9 h-9 rounded-xl overflow-hidden bg-forest/10 flex items-center justify-center font-bold text-forest text-xs shrink-0">
 {drawerStudent.avatar_url ? (
 <img src={drawerStudent.avatar_url} alt={drawerStudent.full_name} className="w-full h-full object-cover" />
 ) : (
 drawerStudent.full_name.charAt(0)
 )}
 </div>
 <div className="truncate">
 <h4 className="font-bold text-forest text-sm truncate">{drawerStudent.full_name}</h4>
 <span className="text-[10px] text-muted-foreground block truncate">
 Ambiente: {activeEnv?.name} • Fecha: {selectedDate}
 </span>
 </div>
 </div>

 {/* If Lesson: Choose Assessment Scale */}
 {drawerItem.type === 'lesson' && (
 <div className="space-y-2">
 <label className="block text-forest font-bold">Estado de Dominio de la Lección:</label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {assessmentScales.map(scale => {
 const isSelected = drawerStatus === scale.code || drawerStatus === scale.id;
 const IconComp = (scale.icon && ICON_MAP[scale.icon]) ? ICON_MAP[scale.icon] : Sparkles;
 return (
 <button
 key={scale.id}
 type="button"
 onClick={() => setDrawerStatus(scale.code || scale.id)}
 className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
 isSelected
 ? 'bg-white ring-2 ring-forest shadow-2xs font-bold border-transparent'
 : 'bg-white/80 border-forest/10 hover:bg-forest/5 text-forest/70'
 }`}
 >
 <div className="flex items-center gap-2 min-w-0">
 <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: scale.color }} />
 <IconComp className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" style={{ color: scale.color }} />
 <span className="text-xs font-bold text-forest truncate">{scale.label}</span>
 </div>
 <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-forest/5 text-forest/80 font-bold uppercase">
 {scale.acronym}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* If Tracker: Choose Option (Yes / No / Note) */}
 {drawerItem.type === 'tracker' && (
 <div className="space-y-2">
 <label className="block text-forest font-bold">Registro del Hábito:</label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setDrawerStatus('YES')}
 className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer ${
 drawerStatus === 'YES'
 ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
 : 'bg-white text-forest/70 border-forest/15 hover:bg-forest/5'
 }`}
 >
 <Check className="w-4 h-4 stroke-[3]" />
 <span>Realizado (Sí)</span>
 </button>
 <button
 type="button"
 onClick={() => setDrawerStatus('NO')}
 className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer ${
 drawerStatus === 'NO'
 ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
 : 'bg-white text-forest/70 border-forest/15 hover:bg-forest/5'
 }`}
 >
 <span>No realizado</span>
 </button>
 </div>
 </div>
 )}

 {/* If Growth Skill: Choose Level */}
 {drawerItem.type === 'growth' && (
 <div className="space-y-2">
 <label className="block text-forest font-bold">Nivel de Desarrollo Observado:</label>
 <div className="grid grid-cols-2 gap-2">
 {[
 { lvl: '1', label: '1. Incipiente / Inicio' },
 { lvl: '2', label: '2. En Desarrollo' },
 { lvl: '3', label: '3. Consolidado' },
 { lvl: '4', label: '4. Líder / Modelo' },
 ].map(item => (
 <button
 key={item.lvl}
 type="button"
 onClick={() => setDrawerStatus(item.lvl)}
 className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
 drawerStatus === item.lvl
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-white text-forest/70 border-forest/15 hover:bg-forest/5'
 }`}
 >
 {item.label}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Observation Notes with Voice Dictation */}
 <VoiceNoteTextarea
 label="Notas de Observación / Guía:"
 value={drawerNotes}
 onChange={setDrawerNotes}
 rows={3}
 placeholder="Escribe o dicta observaciones cualitativas, desafíos o logros del infante..."
 />
 </div>
 </SlideOverDrawer>
 )}

 {/* Floating Action Button (FAB) for Instant Voice Observation */}
 <div className="fixed bottom-6 right-6 z-40">
 <button
 type="button"
 onClick={() => {
 setVoiceLoggerStudentId(undefined);
 if (activeTab !== 'trackers') {
 setActiveTab('lessons');
 }
 setVoiceLoggerOpen(true);
 }}
 className="group relative flex items-center gap-2 px-4 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-indigo-600/30 ring-4 ring-white/50 dark:ring-gray-900/50 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
 title="Dictar bitácora u observación con IA"
 >
 <span className="relative flex h-3 w-3">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
 <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
 </span>
 <Mic className="w-5 h-5" />
 <span className="font-bold text-xs tracking-wide pr-1">Dictado IA</span>
 </button>
 </div>

 {/* Montessori AI Voice Logger Drawer */}
 <MontessoriVoiceLoggerDrawer
 isOpen={voiceLoggerOpen}
 onClose={() => {
 setVoiceLoggerOpen(false);
 setVoiceLoggerStudentId(undefined);
 }}
 initialTargetType={activeTab === 'trackers' ? 'tracker' : 'lesson'}
 environmentId={selectedEnvId}
 preselectedStudentId={voiceLoggerStudentId}
 selectedDate={selectedDate}
 onTargetTypeChange={(target) => {
 setActiveTab(target === 'tracker' ? 'trackers' : 'lessons');
 }}
 onSaved={(target) => {
 setActiveTab(target === 'tracker' ? 'trackers' : 'lessons');
 loadInitialData();
 }}
 />

 </div>
 );
};
