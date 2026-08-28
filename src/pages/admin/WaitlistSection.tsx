import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  UserPlus,
  Search,
  Layers,
  Users,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  X,
  CalendarDays,
  ArrowUpDown,
  MoreVertical
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MobileMenuButton } from './AdminDashboard';
import {
  WaitlistEntry,
  EnvironmentItem,
  getWaitlistEntries,
  getEnvironments,
  deleteWaitlistEntry,
  reorderWaitlistEntries,
  getProcesses,
  startProcessApplication,
  ProcessItem
} from '@/lib/sqlite';
import { WaitlistDrawer } from '@/components/admin/WaitlistDrawer';
import { StartAdmissionFromWaitlistDrawer } from '@/components/admin/StartAdmissionFromWaitlistDrawer';
import { useConfirm } from '@/context/ConfirmDialogContext';
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

export const WaitlistSection: React.FC = () => {
  const confirm = useConfirm();

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  // Active Context Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedEnvId, setSelectedEnvId] = useState<string>('all');
  const [selectedCycleYear, setSelectedCycleYear] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'intake_date' | 'created_at'>('priority');

  // Drawers State
  const [waitlistDrawerOpen, setWaitlistDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitlistEntry | null>(null);

  const [admissionDrawerOpen, setAdmissionDrawerOpen] = useState(false);
  const [entryForAdmission, setEntryForAdmission] = useState<WaitlistEntry | null>(null);

  // Dynamic Processes State
  const [waitlistProcesses, setWaitlistProcesses] = useState<ProcessItem[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entriesData, envsData] = await Promise.all([
        getWaitlistEntries(),
        getEnvironments()
      ]);
      setEntries(entriesData);
      setEnvironments(envsData);
    } catch (err: any) {
      toast.error('Error al cargar la lista de espera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Fetch active processes with waitlist source
    getProcesses()
      .then(data => {
        setWaitlistProcesses(data.filter(p => p.isActive && (p.originSource || '').split(',').includes('WAITLIST')));
      })
      .catch(err => console.error('Error fetching waitlist processes:', err));
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // ONLY show children actively waiting in this section
  const waitingEntries = useMemo(() => {
    return entries.filter((e) => e.status === 'WAITING' || !e.status);
  }, [entries]);

  // Unique intake cycle years from the entries
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    waitingEntries.forEach((e) => {
      if (e.preferred_start_date) {
        const y = new Date(e.preferred_start_date).getFullYear();
        if (!isNaN(y)) years.add(String(y));
      }
    });
    return Array.from(years).sort();
  }, [waitingEntries]);

  // Filtered & Sorted active waitlist entries
  const displayedEntries = useMemo(() => {
    let result = waitingEntries.filter((entry) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchChild = entry.child_name.toLowerCase().includes(q);
        const matchTutor = entry.parent_name?.toLowerCase().includes(q);
        const matchEmail = entry.parent_email?.toLowerCase().includes(q);
        const matchPhone = entry.parent_phone?.toLowerCase().includes(q);
        const matchNotes = entry.notes?.toLowerCase().includes(q);
        if (!matchChild && !matchTutor && !matchEmail && !matchPhone && !matchNotes) return false;
      }

      // 2. Environment Filter
      if (selectedEnvId !== 'all') {
        const hasEnv = entry.target_environment_ids?.includes(selectedEnvId);
        if (!hasEnv) return false;
      }

      // 3. Intake Cycle Year Filter
      if (selectedCycleYear !== 'ALL') {
        if (!entry.preferred_start_date) return false;
        const entryYear = String(new Date(entry.preferred_start_date).getFullYear());
        if (entryYear !== selectedCycleYear) return false;
      }

      return true;
    });

    // Sort order
    if (sortBy === 'intake_date') {
      result.sort((a, b) => {
        if (!a.preferred_start_date && !b.preferred_start_date) return 0;
        if (!a.preferred_start_date) return 1;
        if (!b.preferred_start_date) return -1;
        return new Date(a.preferred_start_date).getTime() - new Date(b.preferred_start_date).getTime();
      });
    } else if (sortBy === 'created_at') {
      result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB; // First come first served
      });
    } else {
      // Default: By priority ranking (higher priority value at top, then oldest)
      result.sort((a, b) => {
        const prioA = a.priority ?? 0;
        const prioB = b.priority ?? 0;
        if (prioB !== prioA) return prioB - prioA;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });
    }

    return result;
  }, [waitingEntries, search, selectedEnvId, selectedCycleYear, sortBy]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedEnvId, selectedCycleYear, sortBy]);

  const totalItems = displayedEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEntries = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return displayedEntries.slice(start, start + pageSize);
  }, [displayedEntries, validCurrentPage, pageSize]);

  // Reorder Handler (Move Up or Down)
  const handleMove = async (currentIndex: number, direction: 'UP' | 'DOWN') => {
    if (reordering) return;
    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= displayedEntries.length) return;

    const newOrderedList = [...displayedEntries];
    const temp = newOrderedList[currentIndex];
    newOrderedList[currentIndex] = newOrderedList[targetIndex];
    newOrderedList[targetIndex] = temp;

    // Optimistic UI update
    const orderedIds = newOrderedList.map((item) => item.id);
    
    // Update local state priorities immediately
    setEntries((prev) => {
      const updated = [...prev];
      orderedIds.forEach((id, idx) => {
        const found = updated.find((e) => e.id === id);
        if (found) {
          found.priority = (orderedIds.length - idx) * 10;
        }
      });
      return updated;
    });

    setReordering(true);
    try {
      await reorderWaitlistEntries(orderedIds);
      toast.success('Posición en lista de espera actualizada');
    } catch (err: any) {
      toast.error('Error al guardar la nueva posición');
      fetchData();
    } finally {
      setReordering(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setWaitlistDrawerOpen(true);
  };

  const handleOpenEdit = (entry: WaitlistEntry) => {
    setEditingEntry(entry);
    setWaitlistDrawerOpen(true);
  };

  const handleOpenStartAdmission = (entry: WaitlistEntry) => {
    setEntryForAdmission(entry);
    setAdmissionDrawerOpen(true);
  };

  const handleStartProcess = async (entry: WaitlistEntry, proc: ProcessItem) => {
    try {
      const app = await startProcessApplication(proc.id, { waitlistEntryId: entry.id });
      toast.success(`Proceso "${proc.label || proc.name}" iniciado para ${entry.childName}`);
      
      const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/panel';
      window.location.href = `${basePath}/process_${proc.slug}`;
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar el proceso');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: '¿Eliminar de Lista de Espera?',
      description: `¿Estás seguro de eliminar a "${name}" de la lista de espera? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteWaitlistEntry(id);
      toast.success('Aspirante eliminado de la lista de espera');
      fetchData();
    } catch (err: any) {
      toast.error('Error al eliminar');
    }
  };

  const calculateAgeString = (dob?: string | null): string => {
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

  const formatIntakeCycle = (dateStr?: string | null): string => {
    if (!dateStr) return 'Por definir';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const month = date.toLocaleDateString('es-MX', { month: 'long' });
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return `${capitalizedMonth} ${date.getFullYear()}`;
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-background">
      {/* 1. FIXED TOP AREA: HERO BANNER + FILTER TOOLBAR (NEVER ENTERS SCROLL) */}
      <div className="shrink-0 z-10">
        {/* FULL-WIDTH GREEN HERO BANNER */}
        <div className="bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-5 text-white shadow-md relative overflow-hidden border-b border-forest-light/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                    Lista de Espera & Prematrícula
                  </h1>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white border border-white/25 shadow-2xs">
                    {waitingEntries.length} {waitingEntries.length === 1 ? 'aspirante en espera' : 'aspirantes en espera'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                  Registro priorizado de aspirantes por fecha y ciclo escolar tentativo de inicio. Al iniciar admisión, el expediente avanza al embudo activo.
                </p>
              </div>
            </div>

            {/* Action: Registrar en Lista de Espera (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-5 py-2.5 bg-white text-forest hover:bg-white/95 rounded-2xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-forest" />
                <span>+ Registrar en Lista de Espera</span>
              </button>
            </div>
          </div>
        </div>

        {/* FILTER & SORT TOOLBAR */}
        <div className="px-4 sm:px-6 md:px-8 py-2.5 bg-white/70 backdrop-blur-md border-b border-forest/10">
          <div className="bg-white/90 rounded-2xl p-2.5 sm:p-3 border border-forest/10 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
              {/* 1. Search */}
              <div className="sm:col-span-2 lg:col-span-5 relative">
                <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por aspirante, tutor, teléfono o notas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 text-xs bg-forest/[0.02] border border-forest/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-forest text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 2. Environment Filter */}
              <div className="lg:col-span-3">
                <select
                  value={selectedEnvId}
                  onChange={(e) => setSelectedEnvId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-forest/[0.02] border border-forest/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-medium text-forest appearance-none cursor-pointer"
                >
                  <option value="all">Todos los Ambientes</option>
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.stage || 'Ambiente'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Cycle Year Filter */}
              <div className="lg:col-span-2">
                <select
                  value={selectedCycleYear}
                  onChange={(e) => setSelectedCycleYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-forest/[0.02] border border-forest/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-medium text-forest appearance-none cursor-pointer"
                >
                  <option value="ALL">Todos los Ciclos</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Ciclo {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Sort Order */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full pl-7 pr-3 py-2 text-xs bg-forest/[0.02] border border-forest/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-semibold text-forest appearance-none cursor-pointer"
                  >
                    <option value="priority">Por Prioridad / Posición</option>
                    <option value="intake_date">Por Ciclo / Fecha de Inicio</option>
                    <option value="created_at">Por Orden de Registro</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-forest/60 absolute left-2 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE WAITLIST AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 md:px-8 py-3 space-y-3">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Cargando lista de espera...</p>
          </div>
        ) : displayedEntries.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-white/90 shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-forest/5 flex items-center justify-center text-forest/40 mx-auto">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display text-forest">
                No hay aspirantes en lista de espera
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {search || selectedEnvId !== 'all' || selectedCycleYear !== 'ALL'
                  ? 'No se encontraron resultados con los filtros seleccionados.'
                  : 'Registra a los niños y familias interesadas para reservar su cupo según el ciclo escolar de ingreso proyectado.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-bold hover:bg-forest/90 transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Registrar Primer Aspirante</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {paginatedEntries.map((entry, pageIndex) => {
              const actualIndex = (validCurrentPage - 1) * pageSize + pageIndex;
              const position = actualIndex + 1;
              const ageStr = calculateAgeString(entry.child_date_of_birth || entry.birth_date);
              const envs = environments.filter((e) => entry.target_environment_ids?.includes(e.id));
              const intakeCycle = formatIntakeCycle(entry.preferred_start_date || entry.desired_start_date);

              const isFirst = actualIndex === 0;
              const isLast = actualIndex === displayedEntries.length - 1;

              return (
                <div
                  key={entry.id}
                  className="relative bg-white/85 hover:bg-white backdrop-blur-md rounded-3xl p-4 sm:p-5 pr-14 sm:pr-16 border border-white/90 hover:border-forest/20 shadow-2xs hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* 1. Left Block: Position Badge + Arrows + Child Name */}
                  <div className="flex items-center gap-3.5 min-w-0 lg:w-[280px] xl:w-[320px] shrink-0">
                    {/* Position Badge & Up/Down Arrows */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          disabled={isFirst || sortBy !== 'priority'}
                          onClick={() => handleMove(actualIndex, 'UP')}
                          className={`p-1 rounded-lg transition-colors ${
                            isFirst || sortBy !== 'priority'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-forest/60 hover:text-forest hover:bg-forest/10 cursor-pointer active:scale-95'
                          }`}
                          title="Subir prioridad en la lista"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 h-8 rounded-xl bg-forest text-white font-bold font-mono text-xs flex items-center justify-center shadow-2xs">
                          #{position}
                        </span>
                        <button
                          type="button"
                          disabled={isLast || sortBy !== 'priority'}
                          onClick={() => handleMove(actualIndex, 'DOWN')}
                          className={`p-1 rounded-lg transition-colors ${
                            isLast || sortBy !== 'priority'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-forest/60 hover:text-forest hover:bg-forest/10 cursor-pointer active:scale-95'
                          }`}
                          title="Bajar prioridad en la lista"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Child Name Only */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-forest truncate font-display leading-snug" title={entry.child_name}>
                        {entry.child_name}
                      </h3>
                    </div>
                  </div>

                  {/* 2. Middle Block: 3 Uniform Badges (Edad, Ciclo Tentativo, Ambiente) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 min-w-0 items-center">
                    {/* Badge 1: Edad & Género */}
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Edad & Género
                      </span>
                      <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl bg-forest/5 text-forest border border-forest/10 font-bold text-xs shadow-2xs truncate">
                        <span className="truncate">{ageStr || 'Edad no registrada'}</span>
                        {entry.child_gender && (
                          <span className="text-forest/60 font-normal shrink-0">
                            • {entry.child_gender === 'M' ? 'Niño' : entry.child_gender === 'F' ? 'Niña' : entry.child_gender}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge 2: Ciclo de Ingreso Tentativo */}
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Ciclo / Fecha Tentativa
                      </span>
                      <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 font-bold text-xs shadow-2xs truncate">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">{intakeCycle}</span>
                      </div>
                    </div>

                    {/* Badge 3: Ambiente(s) Solicitados */}
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Ambiente Solicitado
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {envs.length === 0 ? (
                          <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs shadow-2xs truncate">
                            <span>Cualquier ambiente</span>
                          </div>
                        ) : (
                          envs.map((env) => (
                            <div
                              key={env.id}
                              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl text-white font-bold text-xs shadow-2xs truncate"
                              style={{ backgroundColor: env.color || '#1b3b2b' }}
                            >
                              <Layers className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{env.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Top-Right Corner: 3-Dots Action Menu */}
                  <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === entry.id ? null : entry.id);
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        activeMenuId === entry.id
                          ? 'bg-forest text-white shadow-2xs'
                          : 'text-forest/60 hover:text-forest hover:bg-forest/10 border border-forest/10 bg-forest/[0.02]'
                      }`}
                      title="Opciones del aspirante"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Floating Dropdown Menu */}
                    {activeMenuId === entry.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1.5 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-forest/15 py-1.5 z-30 animate-in fade-in zoom-in-95"
                      >
                        {/* Dynamic Waitlist-linked Processes */}
                        {waitlistProcesses.map(proc => (
                          <button
                            key={proc.id}
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleStartProcess(entry, proc);
                            }}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-forest hover:bg-forest/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="block leading-tight">Iniciar {proc.label || proc.name}</span>
                              <span className="text-[10px] font-normal text-muted-foreground block truncate">
                                {proc.description || 'Iniciar pipeline del proceso'}
                              </span>
                            </div>
                          </button>
                        ))}

                        {/* Editar Ficha */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenEdit(entry);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-forest hover:bg-forest/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                          <span>Editar Ficha</span>
                        </button>

                        {/* Subir Prioridad (if not first) */}
                        {!isFirst && sortBy === 'priority' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleMove(actualIndex, 'UP');
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-medium text-forest hover:bg-forest/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                            <span>Subir Prioridad (#{position - 1})</span>
                          </button>
                        )}

                        {/* Bajar Prioridad (if not last) */}
                        {!isLast && sortBy === 'priority' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleMove(actualIndex, 'DOWN');
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-medium text-forest hover:bg-forest/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                            <span>Bajar Prioridad (#{position + 1})</span>
                          </button>
                        )}

                        <div className="border-t border-forest/10 my-1" />

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleDelete(entry.id, entry.child_name);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Eliminar de Lista</span>
                        </button>
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
          itemLabel="aspirantes"
        />
      </div>

      {/* DRAWERS */}
      <WaitlistDrawer
        isOpen={waitlistDrawerOpen}
        onClose={() => {
          setWaitlistDrawerOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        environments={environments}
        onSaved={() => {
          fetchData();
        }}
      />

      <StartAdmissionFromWaitlistDrawer
        isOpen={admissionDrawerOpen}
        onClose={() => {
          setAdmissionDrawerOpen(false);
          setEntryForAdmission(null);
        }}
        entry={entryForAdmission}
        environments={environments}
        onConverted={() => {
          fetchData();
        }}
      />

      {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        onClick={handleOpenCreate}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-forest/30 cursor-pointer"
        aria-label="Registrar en Lista de Espera"
        title="Registrar en Lista de Espera"
      >
        <UserPlus className="w-6 h-6" />
      </button>
    </div>
  );
};
