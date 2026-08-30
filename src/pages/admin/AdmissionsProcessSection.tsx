import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
 Workflow,
 Plus,
 Search,
 Filter,
 Users,
 Baby,
 Calendar,
 ArrowRight,
 ArrowLeft,
 CheckCircle2,
 Clock,
 FileText,
 Sparkles,
 Settings,
 Layers,
 ChevronRight,
 ChevronLeft,
 Kanban,
 List,
 ExternalLink,
 Phone,
 Mail,
 GraduationCap,
 X,
 FileCheck2,
 TrendingUp,
 AlertCircle,
 MoveHorizontal,
 GripVertical,
 ChevronDown,
 Check
} from 'lucide-react';
import * as Icons from 'lucide-react';
import {
 AdmissionStageItem,
 AdmissionApplicationItem,
 EnvironmentItem,
 getAdmissionStages,
 getAdmissionApplications,
 getEnvironments,
 moveAdmissionApplicationStage
} from '@/lib/sqlite';
import { MobileMenuButton, useAdminDashboard } from './AdminDashboard';
import { AdmissionApplicationDrawer } from '@/components/admin/AdmissionApplicationDrawer';
import { AdmissionFormsManagerDrawer } from '@/components/admin/AdmissionFormsManagerDrawer';
import { CreateAdmissionModal } from '@/components/admin/CreateAdmissionModal';
import { toast } from 'sonner';

export interface AdmissionsProcessSectionProps {
 processSlug?: string;
}

export const AdmissionsProcessSection: React.FC<AdmissionsProcessSectionProps> = ({
 processSlug = 'admissions'
}) => {
 const navigate = useNavigate();
 const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
 const [currentProcess, setCurrentProcess] = useState<any>(null);
 const [stages, setStages] = useState<AdmissionStageItem[]>([]);
 const [applications, setApplications] = useState<AdmissionApplicationItem[]>([]);
 const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
 const [loading, setLoading] = useState(true);

 // Fetch current process info
 useEffect(() => {
 fetch('/api/processes', { credentials: 'include' })
 .then(res => res.json())
 .then(data => {
 if (Array.isArray(data)) {
 const proc = data.find(p => p.slug === processSlug) || data.find(p => p.slug === 'admissions');
 setCurrentProcess(proc);
 }
 })
 .catch(err => console.error('Error fetching processes:', err));
 }, [processSlug]);

 // Drag and Drop States
 const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
 const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

 // Filters & Views
 const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
 const [search, setSearch] = useState('');
 const [isSearchExpanded, setIsSearchExpanded] = useState(false);
 const searchInputRef = useRef<HTMLInputElement>(null);
 const [selectedEnvIds, setSelectedEnvIds] = useState<string[]>([]);
 const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
 const envDropdownRef = useRef<HTMLDivElement>(null);
 const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'ENROLLED' | 'REJECTED' | 'DEFERRED'>('IN_PROGRESS');

 // Collapsed Kanban columns state (persisted)
 const [collapsedStageIds, setCollapsedStageIds] = useState<string[]>(() => {
 try {
 return JSON.parse(localStorage.getItem('admissions_collapsed_stages') || '[]');
 } catch {
 return [];
 }
 });

 const toggleCollapseStage = (stageId: string) => {
 setCollapsedStageIds(prev => {
 const next = prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId];
 try {
 localStorage.setItem('admissions_collapsed_stages', JSON.stringify(next));
 } catch { }
 return next;
 });
 };

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (envDropdownRef.current && !envDropdownRef.current.contains(event.target as Node)) {
 setEnvDropdownOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 // Modals & Drawers
 const [selectedApplication, setSelectedApplication] = useState<AdmissionApplicationItem | null>(null);
 const [applicationDrawerOpen, setApplicationDrawerOpen] = useState(false);
 const [createModalOpen, setCreateModalOpen] = useState(false);
 const [formsManagerOpen, setFormsManagerOpen] = useState(false);

 const loadData = async () => {
 if (!currentProcess) return;
 try {
 setLoading(true);
 const [stagesData, appsData, envsData] = await Promise.all([
 getAdmissionStages(currentProcess.id),
 getAdmissionApplications({ processId: currentProcess.id }),
 getEnvironments()
 ]);
 setStages(stagesData);
 setApplications(appsData);
 setEnvironments(envsData);
 setSelectedApplication(prev => {
 if (!prev) return null;
 return appsData.find(a => a.id === prev.id) || prev;
 });
 } catch (e: any) {
 console.error('Error loading admissions data:', e);
 toast.error('Error al cargar datos de admisión');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 if (currentProcess) {
 loadData();
 }
 }, [currentProcess]);

 const handleOpenApplication = (app: AdmissionApplicationItem) => {
 setSelectedApplication(app);
 setApplicationDrawerOpen(true);
 };

 // Quick Stage Shift from Card Controls
 const handleQuickShift = async (e: React.MouseEvent, app: AdmissionApplicationItem, direction: 'PREV' | 'NEXT') => {
 e.stopPropagation();
 if (isReadOnly) {
 triggerBlockedAction('Mover de etapa en el proceso');
 return;
 }
 const currentIdx = stages.findIndex(s => s.id === app.stage_id);
 if (currentIdx === -1) return;

 const targetIdx = direction === 'NEXT' ? currentIdx + 1 : currentIdx - 1;
 if (targetIdx < 0 || targetIdx >= stages.length) return;

 const targetStage = stages[targetIdx];
 try {
 await moveAdmissionApplicationStage(app.id, targetStage.id, `Avanzado a ${targetStage.name}`);
 toast.success(`Aspirante movido a: "${targetStage.name}"`);
 loadData();
 } catch (err: any) {
 toast.error(err.message || 'Error al cambiar etapa');
 }
 };

 const allowsDirectCreation = useMemo(() => {
 if (!currentProcess?.originSource) return false;
 return currentProcess.originSource.split(',').includes('DIRECT_CREATION');
 }, [currentProcess]);

 const ProcessIcon = useMemo(() => {
 if (!currentProcess?.icon) return Icons.Layers;
 return (Icons as any)[currentProcess.icon] || Icons.Layers;
 }, [currentProcess]);

 // Filtered Applications
 const filteredApplications = useMemo(() => {
 return applications.filter(app => {
 // Multiple Environment filter
 if (selectedEnvIds.length > 0 && !isSearchExpanded && !search) {
 const matchesTarget = app.target_environment_id ? selectedEnvIds.includes(app.target_environment_id) : false;
 const matchesList = (app.target_environment_ids || []).some(id => selectedEnvIds.includes(id));
 if (!matchesTarget && !matchesList) return false;
 }

 // Status filter
 if (statusFilter !== 'ALL') {
 if (app.status !== statusFilter) return false;
 }

 // Search query
 if (search.trim()) {
 const q = search.toLowerCase();
 const matchName = (app.child_name || '').toLowerCase().includes(q);
 const matchTutor = (app.tutor_name || '').toLowerCase().includes(q);
 const matchEmail = (app.tutor_email || '').toLowerCase().includes(q);
 const matchPhone = (app.tutor_phone || '').toLowerCase().includes(q);
 const matchSchool = (app.previous_school || '').toLowerCase().includes(q);
 const matchMethodology = (app.previous_methodology || '').toLowerCase().includes(q);
 const matchStage = (app.stage?.name || '').toLowerCase().includes(q);
 if (!matchName && !matchTutor && !matchEmail && !matchPhone && !matchSchool && !matchMethodology && !matchStage) {
 return false;
 }
 }

 return true;
 });
 }, [applications, selectedEnvIds, isSearchExpanded, search, statusFilter]);

 // Summary Metrics
 const activeCount = applications.filter(a => a.status === 'IN_PROGRESS').length;
 const enrolledCount = applications.filter(a => a.status === 'ENROLLED').length;
 const pendingDocsCount = applications.filter(a => {
 if (a.status !== 'IN_PROGRESS') return false;
 const reqs = a.stage?.required_documents || [];
 if (reqs.length === 0) return false;
 const submittedApproved = (a.submitted_documents || []).filter(d => d.status === 'APPROVED');
 return submittedApproved.length < reqs.length;
 }).length;

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

 const getDaysInPipeline = (dateStr?: string): string => {
 if (!dateStr) return '';
 const diff = Date.now() - new Date(dateStr).getTime();
 const days = Math.floor(diff / (1000 * 60 * 60 * 24));
 if (days === 0) return 'Hoy';
 if (days === 1) return 'Ayer';
 return `Hace ${days}d`;
 };

 return (
 <div className="space-y-6">

 {/* FULL-WIDTH GREEN HERO BANNER (MATCHING FINANCES & COBRANZA STYLE) */}
 <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-8 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 pt-6 pb-6 text-white shadow-md space-y-5">
 <div className="flex items-center justify-between gap-4 pt-1 sm:pt-0">
 <div className="flex items-center gap-3">
 <MobileMenuButton />
 <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white leading-tight">
 {currentProcess ? currentProcess.label || currentProcess.name : 'Cargando Proceso...'}
 </h1>
 </div>

 {allowsDirectCreation && (
 <button
 type="button"
 onClick={() => {
 if (isReadOnly) {
 triggerBlockedAction('Iniciar un nuevo proceso');
 return;
 }
 setCreateModalOpen(true);
 }}
 className="hidden sm:flex px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all items-center gap-2 shrink-0 bg-white text-forest hover:bg-white/90 shadow-md font-extrabold cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-forest" />
 <span>Nuevo</span>
 </button>
 )}
 </div>

 {/* Metrics Banner inside Header (Glassmorphic style) */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-200">
 <div className="bg-white/10 border border-white/10 backdrop-blur-xs p-3 px-3.5 rounded-2xl space-y-0.5">
 <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Total</span>
 <div className="flex items-center justify-between">
 <span className="text-lg font-bold text-white font-display">{applications.length}</span>
 <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
 <ProcessIcon className="w-3.5 h-3.5" />
 </div>
 </div>
 </div>

 <div className="bg-white/10 border border-white/10 backdrop-blur-xs p-3 px-3.5 rounded-2xl space-y-0.5">
 <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Activos</span>
 <div className="flex items-center justify-between">
 <span className="text-lg font-bold text-white font-display">{activeCount}</span>
 <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
 <Workflow className="w-3.5 h-3.5" />
 </div>
 </div>
 </div>

 <div className="bg-white/10 border border-white/10 backdrop-blur-xs p-3 px-3.5 rounded-2xl space-y-0.5">
 <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Pendientes</span>
 <div className="flex items-center justify-between">
 <span className="text-lg font-bold text-white font-display">{pendingDocsCount}</span>
 <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
 <Clock className="w-3.5 h-3.5" />
 </div>
 </div>
 </div>

 <div className="bg-white/10 border border-white/10 backdrop-blur-xs p-3 px-3.5 rounded-2xl space-y-0.5">
 <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Finalizados</span>
 <div className="flex items-center justify-between">
 <span className="text-lg font-bold text-white font-display">{enrolledCount}</span>
 <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Toolbar: Search & Choice (Left) + View Mode Switcher (Right) (Floating directly on layout) */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full animate-in fade-in duration-150">
 {/* Left Side: Search Input (when active) OR Search Trigger + Multiselect Choice Dropdown */}
 <div className="flex items-center gap-2 flex-1 min-w-0">
 {isSearchExpanded || search.length > 0 ? (
 /* Search Input (Takes left area only, keeping View Switcher visible) */
 <div className="w-full bg-white rounded-2xl p-2 sm:p-2.5 px-3 sm:px-4 flex items-center gap-2.5 border border-forest/15 shadow-xs animate-in fade-in zoom-in-98 duration-200">
 <Search className="w-4 h-4 text-forest shrink-0" />
 <input
 ref={searchInputRef}
 type="text"
 autoFocus
 placeholder="Buscar aspirante por nombre, tutor, teléfono, correo..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Escape') {
 setSearch('');
 setIsSearchExpanded(false);
 }
 }}
 className="w-full bg-transparent text-xs text-forest focus:outline-none placeholder:text-muted-foreground font-medium"
 />
 <button
 type="button"
 onClick={() => {
 setSearch('');
 setIsSearchExpanded(false);
 }}
 className="p-1 text-muted-foreground hover:text-forest hover:bg-forest/10 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
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
 setIsSearchExpanded(true);
 setTimeout(() => searchInputRef.current?.focus(), 50);
 }}
 className="p-2.5 rounded-2xl bg-white hover:bg-forest/5 text-forest border border-forest/15 transition-all flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 shrink-0"
 title="Buscar aspirantes..."
 >
 <Search className="w-4 h-4 text-forest" />
 </button>

 {/* Multiselect Environment Choice Dropdown */}
 <div className="relative shrink-0" ref={envDropdownRef}>
 <button
 type="button"
 onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
 className={`px-3 sm:px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs ${selectedEnvIds.length > 0
 ? 'bg-forest text-white border-forest'
 : 'bg-white text-forest border-forest/15 hover:bg-forest/5'
 }`}
 >
 <Filter className="w-3.5 h-3.5" />
 <span className="truncate max-w-[140px] sm:max-w-none">
 {selectedEnvIds.length === 0
 ? 'Todos los salones'
 : selectedEnvIds.length === 1
 ? environments.find(e => e.id === selectedEnvIds[0])?.name || '1 salón'
 : `${selectedEnvIds.length} salones seleccionados`}
 </span>
 {selectedEnvIds.length > 0 ? (
 <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full font-bold">
 {selectedEnvIds.length}
 </span>
 ) : (
 <span className="text-[10px] bg-forest/10 text-forest px-1.5 py-0.2 rounded-full font-bold">
 {applications.length}
 </span>
 )}
 <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${envDropdownOpen ? 'rotate-180' : ''}`} />
 </button>

 {/* Dropdown Popover */}
 {envDropdownOpen && (
 <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-2xl border border-forest/15 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-foreground">
 {/* Header / Quick Actions */}
 <div className="flex items-center justify-between px-2 py-1.5 border-b border-forest/10 text-[11px]">
 <span className="font-bold text-forest">Filtrar por Salón</span>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setSelectedEnvIds([])}
 className="text-[10px] text-forest/70 hover:text-forest font-semibold transition-colors"
 >
 Ver todos
 </button>
 {selectedEnvIds.length > 0 && (
 <>
 <span className="text-forest/20">•</span>
 <button
 type="button"
 onClick={() => setSelectedEnvIds([])}
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
 {environments.map((env) => {
 const isSelected = selectedEnvIds.includes(env.id);
 const countForEnv = applications.filter(a => a.target_environment_id === env.id || a.target_environment_ids?.includes(env.id)).length;

 return (
 <button
 key={env.id}
 type="button"
 onClick={() => {
 setSelectedEnvIds(prev =>
 prev.includes(env.id)
 ? prev.filter(id => id !== env.id)
 : [...prev, env.id]
 );
 }}
 className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${isSelected
 ? 'bg-forest/10 text-forest font-bold'
 : 'hover:bg-forest/5 text-foreground'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-forest border-forest text-white' : 'border-forest/20 bg-white'
 }`}>
 {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
 </div>
 <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: env.color || '#1b3b2b' }} />
 <span className="truncate">{env.name}</span>
 </div>

 <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${isSelected ? 'bg-forest text-white font-bold' : 'bg-forest/5 text-muted-foreground'
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
 {selectedEnvIds.length > 0 && (
 <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
 {selectedEnvIds.map(envId => {
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
 onClick={() => setSelectedEnvIds(prev => prev.filter(id => id !== envId))}
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
 onClick={() => setSelectedEnvIds([])}
 className="text-[11px] text-muted-foreground hover:text-destructive font-semibold px-1.5 py-0.5 rounded-lg transition-colors shrink-0"
 >
 Borrar
 </button>
 </div>
 )}
 </>
 )}
 </div>

 {/* Right Side: View Mode Switcher (Always visible, icons-only on mobile) */}
 <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-forest/15 shadow-xs shrink-0 self-end sm:self-auto">
 <button
 type="button"
 onClick={() => setViewMode('kanban')}
 className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'kanban' ? 'bg-forest text-white shadow-2xs' : 'text-forest/70 hover:text-forest'
 }`}
 title="Tablero Kanban"
 >
 <Kanban className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 <span className="hidden sm:inline">Tablero Kanban</span>
 </button>

 <button
 type="button"
 onClick={() => setViewMode('table')}
 className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-forest text-white shadow-2xs' : 'text-forest/70 hover:text-forest'
 }`}
 title="Vista en Lista"
 >
 <List className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 <span className="hidden sm:inline">Lista</span>
 </button>
 </div>
 </div>

 {/* MAIN CONTENT AREA */}
 {loading ? (
 <div className="py-20 text-center text-xs text-muted-foreground">
 Cargando flujo de admisiones y expedientes...
 </div>
 ) : applications.length === 0 ? (
 <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-4">
 <div className="w-16 h-16 rounded-3xl bg-forest/5 text-forest flex items-center justify-center mx-auto shadow-2xs">
 <Workflow className="w-8 h-8 text-forest/50" />
 </div>
 <div className="space-y-1">
 <h3 className="text-base font-bold text-forest">No hay datos este proceso</h3>

 </div>
 <button
 type="button"
 onClick={() => {
 if (isReadOnly) {
 triggerBlockedAction('Iniciar un nuevo proceso');
 return;
 }
 setCreateModalOpen(true);
 }}
 className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2 hover:scale-105"
 >
 <Plus className="w-4 h-4" />
 <span>Iniciar Pipeline</span>
 </button>
 </div>
 ) : viewMode === 'kanban' ? (
 /* ================= INTERACTIVE DRAG-AND-DROP KANBAN VIEW ================= */
 <div className="overflow-x-auto pb-0 mb-0 custom-horizontal-scrollbar flex-1 min-h-[calc(100vh-300px)]">
 <div className="flex items-stretch gap-4 min-w-max min-h-[calc(100vh-320px)] mb-0">
 {stages.map((stage, stageIdx) => {
 const stageApps = filteredApplications.filter(a => a.stage_id === stage.id);
 const isDragOver = dragOverStageId === stage.id;
 const stageColor = stage.color || '#1b3b2b';
 const isCollapsed = collapsedStageIds.includes(stage.id);

 if (isCollapsed) {
 return (
 <div
 key={stage.id}
 onDragOver={(e) => {
 e.preventDefault();
 e.dataTransfer.dropEffect = 'move';
 if (dragOverStageId !== stage.id) setDragOverStageId(stage.id);
 }}
 onDragLeave={(e) => {
 if (!e.currentTarget.contains(e.relatedTarget as Node)) {
 setDragOverStageId(null);
 }
 }}
 onDrop={async (e) => {
 e.preventDefault();
 setDragOverStageId(null);
 if (isReadOnly) {
 triggerBlockedAction('Mover de etapa en el proceso');
 return;
 }
 const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
 if (!appId) return;
 const app = applications.find(a => a.id === appId);
 if (!app || app.stage_id === stage.id) return;
 try {
 await moveAdmissionApplicationStage(app.id, stage.id, `Movido por arrastre a la fase: ${stage.name}`);
 toast.success(`Aspirante "${app.child_name}" movido a "${stage.name}"`);
 loadData();
 } catch (err: any) {
 toast.error(err.message || 'Error al mover aspirante');
 }
 }}
 onClick={() => toggleCollapseStage(stage.id)}
 className={`w-14 min-w-[3.5rem] rounded-3xl p-3 border transition-all duration-300 flex flex-col items-center justify-between select-none relative shrink-0 cursor-pointer group ${isDragOver
 ? 'bg-forest/15 border-forest shadow-md ring-2 ring-forest/40'
 : 'bg-white/80 backdrop-blur-sm border-forest/15 shadow-2xs hover:border-forest/40 hover:bg-forest/5'
 }`}
 title={`Fase: ${stage.name} (${stageApps.length} aspirantes) — Clic para expandir`}
 >
 {/* Top Accent Color, Expand & Edit Buttons */}
 <div className="w-full flex flex-col items-center gap-1.5">
 <div
 className="h-1.5 w-full rounded-full shrink-0 -mt-0.5 mb-0.5"
 style={{ backgroundColor: stageColor }}
 />
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 toggleCollapseStage(stage.id);
 }}
 className="w-7 h-7 rounded-xl bg-forest/5 hover:bg-forest/15 text-forest flex items-center justify-center transition-all cursor-pointer group-hover:scale-110 shadow-2xs"
 title="Expandir columna"
 >
 <ChevronRight className="w-4 h-4" />
 </button>

 </div>

 {/* Vertical Stage Name */}
 <div className="flex-1 flex flex-col items-center justify-center my-4 py-2 overflow-hidden">
 <div className="flex items-center gap-1.5 [writing-mode:vertical-rl] rotate-180">
 <span
 className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs inline-block"
 style={{ backgroundColor: stageColor }}
 />
 <span className="font-bold text-xs text-forest tracking-wide truncate max-h-[320px]">
 {stage.name}
 </span>
 </div>
 </div>

 {/* Bottom Count Badge */}
 <div className="w-full flex flex-col items-center pt-1">
 <span
 className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-2xs transition-transform group-hover:scale-105"
 style={{
 backgroundColor: stageApps.length > 0 ? `${stageColor}20` : '#f1f5f2',
 color: stageApps.length > 0 ? stageColor : '#64748b'
 }}
 >
 {stageApps.length}
 </span>
 </div>
 </div>
 );
 }

 return (
 <div
 key={stage.id}
 onDragOver={(e) => {
 e.preventDefault();
 e.dataTransfer.dropEffect = 'move';
 if (dragOverStageId !== stage.id) setDragOverStageId(stage.id);
 }}
 onDragLeave={(e) => {
 if (!e.currentTarget.contains(e.relatedTarget as Node)) {
 setDragOverStageId(null);
 }
 }}
 onDrop={async (e) => {
 e.preventDefault();
 setDragOverStageId(null);
 if (isReadOnly) {
 triggerBlockedAction('Mover de etapa en el proceso');
 return;
 }
 const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
 if (!appId) return;
 const app = applications.find(a => a.id === appId);
 if (!app || app.stage_id === stage.id) return;
 try {
 await moveAdmissionApplicationStage(app.id, stage.id, `Movido por arrastre a la fase: ${stage.name}`);
 toast.success(`Aspirante "${app.child_name}" movido a "${stage.name}"`);
 loadData();
 } catch (err: any) {
 toast.error(err.message || 'Error al mover aspirante');
 }
 }}
 className={`w-80 rounded-3xl p-3.5 border transition-all flex flex-col relative shrink-0 ${isDragOver
 ? 'bg-forest/15 border-forest shadow-md ring-2 ring-forest/40'
 : 'bg-white/80 backdrop-blur-sm border-forest/15 shadow-2xs hover:border-forest/30'
 }`}
 >
 {/* Top Color Accent Bar */}
 <div
 className="h-1.5 w-full rounded-full shrink-0 -mt-1 mb-2.5"
 style={{ backgroundColor: stageColor }}
 />

 {/* Column Header */}
 <div className="flex items-center justify-between px-1 mb-2">
 <div className="flex items-center gap-2 min-w-0 flex-1">
 <span
 className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
 style={{ backgroundColor: stageColor }}
 />
 <span className="font-bold text-xs text-forest truncate" title={stage.name}>
 {stage.name}
 </span>
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 <span className="px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[11px] font-bold">
 {stageApps.length}
 </span>

 <button
 type="button"
 onClick={() => toggleCollapseStage(stage.id)}
 className="p-1 text-muted-foreground/60 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
 title="Colapsar columna"
 >
 <ChevronLeft className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {/* Required Docs Badge */}
 {stage.required_documents?.length > 0 && (
 <div className="px-2 text-[10px] text-amber-800/90 font-medium bg-amber-50/80 p-1.5 rounded-xl border border-amber-200/50 flex items-center justify-between mb-2">
 <div className="flex items-center gap-1 truncate">
 <FileText className="w-3 h-3 text-amber-600 shrink-0" />
 <span className="truncate">Requiere {stage.required_documents.length} doc{stage.required_documents.length > 1 ? 's' : ''}</span>
 </div>
 </div>
 )}

 {/* Applicant Cards Container (Full Height) */}
 <div className="space-y-3 pt-2 flex-1 flex flex-col overflow-y-auto no-scrollbar pr-0.5 min-h-[180px]">
 {stageApps.length === 0 ? (
 <div className={`flex-1 min-h-[160px] py-10 text-center text-[11px] rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${isDragOver ? 'border-forest text-forest bg-forest/10' : 'border-forest/15 text-muted-foreground/60 bg-forest/5/30'
 }`}>
 <GripVertical className="w-4 h-4 opacity-40" />
 <span>{isDragOver ? 'Soltar aquí para mover' : 'Arrastra aspirantes aquí'}</span>
 </div>
 ) : (
 stageApps.map((app) => {
 const reqDocsCount = stage.required_documents?.length || 0;
 const approvedDocsCount = (app.submitted_documents || []).filter(d => d.status === 'APPROVED').length;
 const docRatio = reqDocsCount > 0 ? (approvedDocsCount / reqDocsCount) * 100 : 100;
 const isBeingDragged = draggedAppId === app.id;

 const hasPrevStage = stageIdx > 0;
 const hasNextStage = stageIdx < stages.length - 1;

 return (
 <div
 key={app.id}
 draggable
 onDragStart={(e) => {
 e.dataTransfer.setData('text/plain', app.id);
 e.dataTransfer.effectAllowed = 'move';
 setDraggedAppId(app.id);
 }}
 onDragEnd={() => {
 setDraggedAppId(null);
 setDragOverStageId(null);
 }}
 onClick={() => handleOpenApplication(app)}
 className={`p-4 rounded-2xl bg-white border border-forest/15 shadow-2xs hover:border-forest/40 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing space-y-3 group relative ${isBeingDragged ? 'opacity-40 scale-95 border-forest ring-1 ring-forest' : 'hover:-translate-y-0.5'
 }`}
 >
 {/* Card Top: Avatar, Name, Age, Status */}
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
 <Baby className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <h4 className="font-bold text-xs text-forest leading-tight truncate group-hover:text-emerald-800 transition-colors">
 {app.child_name}
 </h4>
 <span className="text-[10px] text-muted-foreground">
 {calculateAge(app.birth_date)} {app.previous_school ? `• ${app.previous_school}` : ''}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-1 shrink-0">
 <span className="text-[10px] font-mono text-muted-foreground/70 bg-forest/5 px-1.5 py-0.2 rounded-md">
 {getDaysInPipeline(app.created_at)}
 </span>
 </div>
 </div>

 {/* Target Environment Badge */}
 {app.target_environment && (
 <div className="flex items-center gap-1.5 text-[10px] text-forest/90 font-semibold bg-forest/5 px-2.5 py-1 rounded-xl">
 <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: app.target_environment.color || '#1b3b2b' }} />
 <span className="truncate">{app.target_environment.name}</span>
 </div>
 )}

 {/* Tutor Info + Quick WhatsApp / Phone links */}
 <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-forest/5 gap-2">
 <span className="truncate text-forest/90 font-semibold">
 {app.tutor_name}
 </span>

 {app.tutor_phone && (
 <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
 <a
 href={`https://wa.me/${app.tutor_phone.replace(/\D/g, '')}`}
 target="_blank"
 rel="noreferrer"
 className="p-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
 title="Enviar WhatsApp al tutor"
 >
 <Phone className="w-3 h-3" />
 </a>
 </div>
 )}
 </div>

 {/* Documents Progress Bar */}
 {reqDocsCount > 0 && (
 <div className="space-y-1 pt-0.5">
 <div className="flex items-center justify-between text-[10px]">
 <span className="text-muted-foreground font-medium">Documentos:</span>
 <span className={`font-bold ${approvedDocsCount >= reqDocsCount ? 'text-emerald-700' : 'text-amber-700'}`}>
 {approvedDocsCount}/{reqDocsCount} validados
 </span>
 </div>
 <div className="w-full h-1.5 bg-forest/10 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-300 ${approvedDocsCount >= reqDocsCount ? 'bg-emerald-500' : 'bg-amber-500'
 }`}
 style={{ width: `${Math.min(100, Math.max(0, docRatio))}%` }}
 />
 </div>
 </div>
 )}

 {/* Card Footer: Quick Stage Move Arrows */}
 <div className="pt-2 border-t border-forest/5 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
 {hasPrevStage ? (
 <button
 type="button"
 onClick={(e) => handleQuickShift(e, app, 'PREV')}
 className="p-1 text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-lg transition-colors flex items-center gap-0.5"
 title="Retroceder fase"
 >
 <ArrowLeft className="w-3 h-3" />
 <span className="text-[9px]">Atrás</span>
 </button>
 ) : <div />}

 <span className="text-[9px] text-forest/50 font-semibold group-hover:text-forest transition-colors">
 Ver expediente →
 </span>

 {hasNextStage ? (
 <button
 type="button"
 onClick={(e) => handleQuickShift(e, app, 'NEXT')}
 className="p-1 text-forest font-bold hover:bg-forest/10 rounded-lg transition-colors flex items-center gap-0.5"
 title="Avanzar a la siguiente fase"
 >
 <span className="text-[9px]">Avanzar</span>
 <ArrowRight className="w-3 h-3" />
 </button>
 ) : app.status !== 'ENROLLED' ? (
 <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
 Listo p/ Matrícula
 </span>
 ) : (
 <span className="text-[9px] font-bold text-emerald-700">
 Matriculado
 </span>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ) : (
 /* ================= TABLE LIST VIEW ================= */
 <div className="bg-white rounded-3xl border border-forest/10 shadow-xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-forest/5 border-b border-forest/10 text-forest font-bold">
 <tr>
 <th className="py-3 px-4">Aspirante / Niño</th>
 <th className="py-3 px-4">Ambiente</th>
 <th className="py-3 px-4">Tutor & Contacto</th>
 <th className="py-3 px-4">Etapa del Proceso</th>
 <th className="py-3 px-4">Documentos</th>
 <th className="py-3 px-4">Fecha Solicitud</th>
 <th className="py-3 px-4 text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-forest/5">
 {filteredApplications.map((app) => {
 const stage = stages.find(s => s.id === app.stage_id) || app.stage;
 const reqDocs = stage?.required_documents || [];
 const approvedDocs = (app.submitted_documents || []).filter(d => d.status === 'APPROVED').length;

 return (
 <tr
 key={app.id}
 onClick={() => handleOpenApplication(app)}
 className="hover:bg-forest/5 transition-colors cursor-pointer"
 >
 <td className="py-3.5 px-4">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold text-xs shrink-0">
 <Baby className="w-4 h-4" />
 </div>
 <div>
 <div className="font-bold text-forest text-xs">{app.child_name}</div>
 <div className="text-[10px] text-muted-foreground">
 {calculateAge(app.birth_date)} {app.previous_school ? `• ${app.previous_school}` : ''}
 </div>
 </div>
 </div>
 </td>

 <td className="py-3.5 px-4">
 {app.target_environment ? (
 <div className="flex items-center gap-1.5 font-semibold text-forest text-xs">
 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: app.target_environment.color || '#1b3b2b' }} />
 <span>{app.target_environment.name}</span>
 </div>
 ) : (
 <span className="text-muted-foreground text-[11px]">Por definir</span>
 )}
 </td>

 <td className="py-3.5 px-4">
 <div className="font-semibold text-forest">{app.tutor_name}</div>
 <div className="text-[10px] text-muted-foreground">{app.tutor_phone || app.tutor_email || 'Sin contacto'}</div>
 </td>

 <td className="py-3.5 px-4">
 {stage && (
 <span
 className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-white shadow-2xs inline-flex items-center gap-1"
 style={{ backgroundColor: stage.color || '#1b3b2b' }}
 >
 <span>{stage.name}</span>
 </span>
 )}
 </td>

 <td className="py-3.5 px-4">
 {reqDocs.length > 0 ? (
 <span className={`text-[11px] font-bold ${approvedDocs >= reqDocs.length ? 'text-emerald-700' : 'text-amber-700'}`}>
 {approvedDocs}/{reqDocs.length} validados
 </span>
 ) : (
 <span className="text-muted-foreground text-[11px]">{app.submitted_documents?.length || 0} subidos</span>
 )}
 </td>

 <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
 {new Date(app.created_at).toLocaleDateString()}
 </td>

 <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
 <button
 type="button"
 onClick={() => handleOpenApplication(app)}
 className="p-1.5 text-forest hover:bg-forest/10 rounded-lg transition-colors font-bold text-xs inline-flex items-center gap-1"
 >
 <span>Expediente</span>
 <ChevronRight className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* EXPEDIENTE DRAWER */}
 <AdmissionApplicationDrawer
 isOpen={applicationDrawerOpen}
 onClose={() => setApplicationDrawerOpen(false)}
 application={selectedApplication}
 stages={stages}
 environments={environments}
 onUpdated={loadData}
 />



 {/* ADMISSION FORMS MANAGER DRAWER */}
 {formsManagerOpen && (
 <AdmissionFormsManagerDrawer
 isOpen={formsManagerOpen}
 onClose={() => {
 setFormsManagerOpen(false);
 loadData();
 }}
 />
 )}

 {/* CREATE ADMISSION MODAL */}
 <CreateAdmissionModal
 isOpen={createModalOpen}
 onClose={() => setCreateModalOpen(false)}
 stages={stages}
 environments={environments}
 onCreated={loadData}
 processId={currentProcess?.id}
 processName={currentProcess?.label || currentProcess?.name}
 targetType={currentProcess?.targetType}
 />

 {/* Floating Action Button (FAB) for Mobile */}
 {allowsDirectCreation && (
 <button
 type="button"
 onClick={() => {
 if (isReadOnly) {
 triggerBlockedAction('Iniciar un nuevo proceso');
 return;
 }
 setCreateModalOpen(true);
 }}
 className="sm:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-forest hover:bg-forest-light text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/20"
 title="Nuevo"
 >
 <Plus className="w-6 h-6 text-white" />
 </button>
 )}

 </div>
 );
};
