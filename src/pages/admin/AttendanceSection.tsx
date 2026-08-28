import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  CheckCheck,
  UserCheck,
  Layers,
  User,
  X,
  ChevronDown,
  Check,
  Filter,
  FileText,
  Building2,
  AlertCircle
} from 'lucide-react';
import { MobileMenuButton, useAdminDashboard } from './AdminDashboard';
import {
  EnvironmentItem,
  StudentItem,
  StudentAttendanceItem,
  getEnvironments,
  getStudents,
  getMontessoriAttendance,
  saveMontessoriAttendance
} from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'TARDY' | 'EXCUSED';
type FilterStatus = 'ALL' | 'PRESENT' | 'ABSENT' | 'TARDY';

export const AttendanceSection: React.FC = () => {
  const { role, user, activeMembership } = useAuth();
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN';
  const permissions: string[] = (activeMembership as any)?.permissions || [];
  const hasGlobalAttendancePermission = isOwnerOrAdmin || permissions.includes('attendance:write') || permissions.includes('attendance:read');

  const [loading, setLoading] = useState(true);

  // Core data
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);

  // Environments allowed for the active user based on assignments & permissions
  const allowedEnvironments = useMemo(() => {
    if (hasGlobalAttendancePermission) return environments;
    return environments.filter(env => {
      if (!user?.id) return false;
      const inGuides = env.guides?.some(g => g.userId === user.id);
      const inGuideIds = env.guideIds?.includes(user.id);
      return inGuides || inGuideIds;
    });
  }, [environments, hasGlobalAttendancePermission, user?.id]);

  const [selectedEnvId, setSelectedEnvId] = useState<string>('');

  const canChangeAttendance = isOwnerOrAdmin || permissions.includes('attendance:write') || (allowedEnvironments.length > 0 && allowedEnvironments.some(e => e.id === selectedEnvId));
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendances, setAttendances] = useState<StudentAttendanceItem[]>([]);

  // Local state of attendance for active date: studentId -> { status, note }
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >({});

  // Note Modal State
  const [noteModalStudent, setNoteModalStudent] = useState<StudentItem | null>(null);
  const [noteModalText, setNoteModalText] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Status Filter Options
  const STATUS_OPTIONS: {
    id: AttendanceStatus;
    label: string;
    dot: string;
  }[] = [
    { id: 'PRESENT', label: 'Presentes', dot: 'bg-emerald-600' },
    { id: 'ABSENT', label: 'Ausentes', dot: 'bg-rose-600' },
    { id: 'TARDY', label: 'Retardos / Justif.', dot: 'bg-amber-600' }
  ];

  // UI Filters & Selectors (Multi-select statuses with all selected by default)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<AttendanceStatus[]>([
    'PRESENT',
    'ABSENT',
    'TARDY'
  ]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const salonDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileEnvOpen, setIsMobileEnvOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        salonDropdownRef.current &&
        !salonDropdownRef.current.contains(event.target as Node)
      ) {
        setSalonDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
    };
    if (salonDropdownOpen || statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [salonDropdownOpen, statusDropdownOpen]);

  const toggleStatusFilter = (status: AttendanceStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSelectAllStatuses = () => {
    setSelectedStatuses(['PRESENT', 'ABSENT', 'TARDY']);
  };

  const statusButtonLabel = useMemo(() => {
    if (selectedStatuses.length === 3) return 'Todos los estados';
    if (selectedStatuses.length === 0) return 'Ningún estado';
    if (selectedStatuses.length === 1) {
      const found = STATUS_OPTIONS.find((o) => o.id === selectedStatuses[0]);
      return `Solo ${found?.label || selectedStatuses[0]}`;
    }
    return `${selectedStatuses.length} estados`;
  }, [selectedStatuses]);

  // Load Initial Environments and Students
  const loadData = async () => {
    setLoading(true);
    try {
      const [envsData, studentsData] = await Promise.all([
        getEnvironments(),
        getStudents()
      ]);
      setEnvironments(envsData);
      setStudents(studentsData);

      const permittedEnvs = hasGlobalAttendancePermission
        ? envsData
        : envsData.filter((env: any) => {
            if (!user?.id) return false;
            const inGuides = env.guides?.some((g: any) => g.userId === user.id);
            const inGuideIds = env.guideIds?.includes(user.id);
            return inGuides || inGuideIds;
          });

      const initialEnv = permittedEnvs.length > 0 ? permittedEnvs[0].id : '';
      setSelectedEnvId(initialEnv);

      if (initialEnv) {
        const attData = await getMontessoriAttendance({
          environmentId: initialEnv,
          date: attendanceDate
        });
        setAttendances(attData);
        syncAttendanceMap(studentsData, initialEnv, attData);
      } else {
        setAttendances([]);
        setAttendanceMap({});
      }
    } catch (e) {
      console.error('Error loading attendance data:', e);
      toast.error('Error al cargar datos de asistencia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reload attendance records when environment or date changes
  useEffect(() => {
    if (selectedEnvId) {
      getMontessoriAttendance({
        environmentId: selectedEnvId,
        date: attendanceDate
      })
        .then((attData) => {
          setAttendances(attData);
          syncAttendanceMap(students, selectedEnvId, attData);
        })
        .catch(console.error);
    }
  }, [selectedEnvId, attendanceDate]);

  // Sync attendances from API into local map
  const syncAttendanceMap = (
    allStudents: StudentItem[],
    envId: string,
    records: StudentAttendanceItem[]
  ) => {
    if (!envId || allowedEnvironments.length === 0) {
      setAttendanceMap({});
      return;
    }
    const envStudents = allStudents.filter(
      (s) => s.environment_id === envId
    );
    const newMap: Record<string, { status: AttendanceStatus; note: string }> = {};

    envStudents.forEach((student) => {
      const existing = records.find((r) => r.studentId === student.id);
      newMap[student.id] = {
        status: (existing?.status as AttendanceStatus) || 'PRESENT',
        note: existing?.note || ''
      };
    });

    setAttendanceMap(newMap);
  };

  // Filtered Students in current environment
  const currentEnvStudents = useMemo(() => {
    if (!selectedEnvId || allowedEnvironments.length === 0) return [];
    return students.filter((s) => s.environment_id === selectedEnvId);
  }, [students, selectedEnvId, allowedEnvironments]);

  const activeEnv = useMemo(() => {
    if (allowedEnvironments.length === 0) return null;
    return (
      allowedEnvironments.find((e) => e.id === selectedEnvId) || allowedEnvironments[0] || null
    );
  }, [allowedEnvironments, selectedEnvId]);

  // Stats calculation
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let tardyCount = 0;

    currentEnvStudents.forEach((student) => {
      const status = attendanceMap[student.id]?.status || 'PRESENT';
      if (status === 'PRESENT') presentCount++;
      else if (status === 'ABSENT') absentCount++;
      else if (status === 'TARDY' || status === 'EXCUSED') tardyCount++;
    });

    const total = currentEnvStudents.length;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return {
      total,
      presentCount,
      absentCount,
      tardyCount,
      rate
    };
  }, [currentEnvStudents, attendanceMap]);

  // Filtered list of students based on search and selected multi-statuses
  const displayedStudents = useMemo(() => {
    return currentEnvStudents.filter((student) => {
      const matchesSearch =
        !searchQuery ||
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.enrollment_code &&
          student.enrollment_code.toLowerCase().includes(searchQuery.toLowerCase()));

      const status = attendanceMap[student.id]?.status || 'PRESENT';
      const normalizedStatus: AttendanceStatus =
        status === 'EXCUSED' ? 'TARDY' : status;

      const matchesStatus = selectedStatuses.includes(normalizedStatus);

      return matchesSearch && matchesStatus;
    });
  }, [currentEnvStudents, searchQuery, selectedStatuses, attendanceMap]);

  // Handle single status change with INSTANT AUTO-SAVE
  const handleStatusChange = async (
    studentId: string,
    status: AttendanceStatus,
    studentName: string
  ) => {
    if (isReadOnly) {
      triggerBlockedAction('Registrar o modificar la asistencia diaria');
      return;
    }

    if (!canChangeAttendance) {
      toast.error('No tienes permisos para modificar la asistencia de este salón.');
      return;
    }

    const prevItem = attendanceMap[studentId] || { status: 'PRESENT', note: '' };
    const updatedItem = { ...prevItem, status };

    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: updatedItem
    }));

    try {
      await saveMontessoriAttendance(attendanceDate, [
        {
          studentId,
          status,
          note: updatedItem.note
        }
      ]);
      const statusLabels: Record<AttendanceStatus, string> = {
        PRESENT: 'Presente',
        ABSENT: 'Ausente',
        TARDY: 'Retardo',
        EXCUSED: 'Justificado'
      };
      toast.success(`${studentName}: ${statusLabels[status]}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar asistencia');
    }
  };

  // Open Note Modal for Absence / Tardy
  const handleOpenNoteModal = (student: StudentItem) => {
    if (isReadOnly) {
      triggerBlockedAction('Guardar justificantes o notas de asistencia');
      return;
    }

    if (!canChangeAttendance) {
      toast.error('No tienes permisos para modificar la asistencia de este salón.');
      return;
    }
    setNoteModalStudent(student);
    setNoteModalText(attendanceMap[student.id]?.note || '');
    setNoteModalOpen(true);
  };

  // Save Note in Modal with AUTO-SAVE
  const handleSaveNoteModal = async () => {
    if (!noteModalStudent) return;
    if (isReadOnly) {
      triggerBlockedAction('Guardar justificantes o notas de asistencia');
      return;
    }

    if (!canChangeAttendance) {
      toast.error('No tienes permisos para modificar la asistencia de este salón.');
      return;
    }
    setSavingNote(true);
    const studentId = noteModalStudent.id;
    const current = attendanceMap[studentId] || { status: 'ABSENT', note: '' };
    const updated = { ...current, note: noteModalText.trim() };

    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: updated
    }));

    try {
      await saveMontessoriAttendance(attendanceDate, [
        {
          studentId,
          status: updated.status,
          note: updated.note
        }
      ]);
      toast.success(
        updated.note
          ? `Justificante guardado para ${noteModalStudent.full_name}`
          : `Nota eliminada para ${noteModalStudent.full_name}`
      );
      setNoteModalOpen(false);
    } catch (err: any) {
      toast.error('Error al guardar la nota');
    } finally {
      setSavingNote(false);
    }
  };

  // Bulk action: Mark all present with INSTANT AUTO-SAVE
  const handleMarkAllPresent = async () => {
    if (currentEnvStudents.length === 0) return;
    if (isReadOnly) {
      triggerBlockedAction('Registrar asistencia masiva');
      return;
    }

    if (!canChangeAttendance) {
      toast.error('No tienes permisos para modificar la asistencia de este salón.');
      return;
    }

    const newMap = { ...attendanceMap };
    const recordsToSave = currentEnvStudents.map((student) => {
      const currentNote = newMap[student.id]?.note || '';
      newMap[student.id] = {
        status: 'PRESENT',
        note: currentNote
      };
      return {
        studentId: student.id,
        status: 'PRESENT' as const,
        note: currentNote
      };
    });

    setAttendanceMap(newMap);

    try {
      await saveMontessoriAttendance(attendanceDate, recordsToSave);
      toast.success(
        `Todos los alumnos marcados como Presentes (${recordsToSave.length} niños)`
      );
    } catch (err: any) {
      toast.error(err.message || 'Error al marcar todos presentes');
    }
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300 pb-16">
      {/* HEADER HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 pt-6 pb-6 text-white shadow-md space-y-4 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight flex items-center gap-2">
                  <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  <span>Control de Asistencia Diaria</span>
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {stats.presentCount} / {stats.total} presentes ({stats.rate}%)
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Registro de presentismo, ausencias y retardos por salón para guías y equipo directivo.
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
                  className="w-full p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-xs flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/40 shadow-2xs"
                        style={{ backgroundColor: activeEnv?.color || '#fff' }}
                      />
                    </div>
                    <div className="truncate">
                      <span className="block font-bold text-xs text-white truncate">
                        {activeEnv?.name || 'Seleccionar ambiente'}
                      </span>
                      <span className="text-[10px] text-white/75 block truncate">
                        {activeEnv?.stage || 'Montessori'} • {currentEnvStudents.length} {currentEnvStudents.length === 1 ? 'alumno' : 'alumnos'}
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
                      className={`p-3 rounded-2xl text-left transition-all relative border flex items-center justify-between gap-3 group backdrop-blur-md cursor-pointer ${
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

                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-forest text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-white/30 group-hover:border-white/60 flex items-center justify-center opacity-40 group-hover:opacity-100" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* STATS TILES BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Matrícula Salón</span>
            <User className="w-4 h-4 text-forest" />
          </div>
          <p className="text-2xl font-bold font-display text-forest">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Presentes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-display text-emerald-700">{stats.presentCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Ausentes</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-display text-rose-700">{stats.absentCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Retardos / Justif.</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-display text-amber-800">{stats.tardyCount}</p>
        </div>
      </div>

      {/* UNIFIED CONTROLS & CHOICES BAR */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-forest/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left & Middle Elements: Search Icon/Input, Status Choices, Environment Choices, Date Selector */}
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          {/* 1. Collapsed Search Icon / Expandable Search Box */}
          <div className="relative flex items-center shrink-0">
            {isSearchOpen || searchQuery ? (
              <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-150">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar alumno..."
                  className="pl-8 pr-7 py-1.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-forest w-40 sm:w-52"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 text-muted-foreground hover:text-forest p-0.5 cursor-pointer"
                  title="Cerrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-xl bg-forest/5 text-forest/70 hover:text-forest hover:bg-forest/10 border border-forest/10 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-bold shrink-0"
                title="Buscar alumno"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            )}
          </div>

          {/* 2. Attendance Status Filter Multi-Select Custom Choice */}
          <div className="relative shrink-0" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-forest/5 hover:bg-forest/10 text-forest border border-forest/10 transition-all cursor-pointer flex items-center gap-2 shadow-2xs shrink-0"
              title="Filtrar por estado de asistencia"
            >
              <Filter className="w-3.5 h-3.5 text-forest/70" />
              <span className="truncate max-w-[120px] sm:max-w-[150px]">
                {statusButtonLabel}
              </span>
              {selectedStatuses.length < 3 && selectedStatuses.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center">
                  {selectedStatuses.length}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-forest/70 transition-transform duration-200 ${
                  statusDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {statusDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-2xl border border-forest/15 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-forest/5 mb-1 flex items-center justify-between">
                  <span>Estados ({selectedStatuses.length}/3)</span>
                  <button
                    type="button"
                    onClick={handleSelectAllStatuses}
                    className="text-[10px] text-forest font-bold hover:underline cursor-pointer"
                  >
                    Todos
                  </button>
                </div>

                <div className="space-y-0.5 px-1">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = selectedStatuses.includes(opt.id);
                    const count =
                      opt.id === 'PRESENT'
                        ? stats.presentCount
                        : opt.id === 'ABSENT'
                        ? stats.absentCount
                        : stats.tardyCount;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleStatusFilter(opt.id)}
                        className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-forest/10 font-bold text-forest'
                            : 'text-forest/60 hover:bg-forest/5 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-forest border-forest text-white'
                                : 'border-forest/30 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                            <span>{opt.label}</span>
                          </div>
                        </div>

                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-forest/5 text-muted-foreground font-semibold">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>


          {/* 4. Date Picker Choice */}
          <div className="flex items-center gap-1.5 bg-forest/5 px-2.5 py-1.5 rounded-xl border border-forest/10 shadow-2xs shrink-0">
            <CalendarIcon className="w-3.5 h-3.5 text-forest shrink-0" />
            <span className="text-[11px] font-bold text-forest hidden sm:inline">Fecha:</span>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="bg-transparent text-forest text-xs font-bold focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right Group: 5. "Marcar todos como presentes" al final */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Todos Presentes</span>
          </button>
        </div>
      </div>

      {/* STUDENTS ATTENDANCE LIST */}
      {allowedEnvironments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 text-xs text-muted-foreground shadow-sm max-w-xl mx-auto my-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-forest text-base font-display">Sin Salones Asignados</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              No tienes ningún salón o ambiente asignado a tu cargo para el registro de asistencia diaria. Contacta a un administrador para que te asigne a un salón o te otorgue permisos globales de asistencia.
            </p>
          </div>
        </div>
      ) : displayedStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 text-xs text-muted-foreground space-y-2">
          <User className="w-10 h-10 text-forest/30 mx-auto" />
          <p className="font-bold text-forest text-sm">No se encontraron alumnos</p>
          <p className="text-xs">
            {currentEnvStudents.length === 0
              ? `No hay alumnos registrados en el ambiente "${activeEnv?.name}".`
              : 'Ningún alumno coincide con el filtro de búsqueda seleccionado.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-forest/10 shadow-xs overflow-hidden">
          <div className="divide-y divide-forest/10">
            {displayedStudents.map((student) => {
              const current = attendanceMap[student.id] || {
                status: 'PRESENT',
                note: ''
              };

              return (
                <div
                  key={student.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 hover:bg-forest/[0.02] transition-colors"
                >
                  {/* Left: Student Profile Info */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-forest/10 flex items-center justify-center text-forest font-bold text-sm shrink-0 border border-forest/15 shadow-2xs">
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

                    <div className="truncate min-w-0 flex-1">
                      <h4 className="font-bold text-forest text-sm truncate">
                        {student.full_name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 truncate">
                        <span className="font-medium truncate">{activeEnv?.name}</span>
                        {student.enrollment_code && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{student.enrollment_code}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Interactive Status Toggle Buttons & Note Modal Trigger */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Pill Buttons */}
                    <div className="grid grid-cols-3 gap-1 bg-forest/5 p-1 rounded-2xl border border-forest/10 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(student.id, 'PRESENT', student.full_name)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                          current.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-2xs scale-[1.02]'
                            : 'text-forest/70 hover:bg-white/60'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Presente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(student.id, 'ABSENT', student.full_name)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                          current.status === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-2xs scale-[1.02]'
                            : 'text-forest/70 hover:bg-white/60'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Ausente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(student.id, 'TARDY', student.full_name)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                          current.status === 'TARDY' || current.status === 'EXCUSED'
                            ? 'bg-amber-600 text-white shadow-2xs scale-[1.02]'
                            : 'text-forest/70 hover:bg-white/60'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Retardo</span>
                      </button>
                    </div>

                    {/* Note Button (Only visible on Absence or Tardy) */}
                    {(current.status === 'ABSENT' ||
                      current.status === 'TARDY' ||
                      current.status === 'EXCUSED') && (
                      <button
                        type="button"
                        onClick={() => handleOpenNoteModal(student)}
                        title={
                          current.note
                            ? `Justificante: "${current.note}"`
                            : 'Agregar justificante o nota'
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                          current.note
                            ? 'bg-forest text-white shadow-2xs hover:bg-forest/90'
                            : 'bg-forest/5 hover:bg-forest/10 text-forest border border-forest/15'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{current.note ? 'Nota' : '+ Nota'}</span>
                        {current.note && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL JUSTIFICANTE / NOTA DE ASISTENCIA */}
      {noteModalOpen && noteModalStudent && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setNoteModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-forest/15 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-forest/5 border-b border-forest/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl overflow-hidden bg-forest/10 flex items-center justify-center text-forest font-bold text-sm shrink-0 border border-forest/15 shadow-2xs">
                  {noteModalStudent.avatar_url ? (
                    <img
                      src={noteModalStudent.avatar_url}
                      alt={noteModalStudent.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{noteModalStudent.full_name.charAt(0)}</span>
                  )}
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-forest text-sm font-display truncate">
                    {noteModalStudent.full_name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>Fecha: {attendanceDate}</span>
                    <span>•</span>
                    <span
                      className={`font-bold ${
                        attendanceMap[noteModalStudent.id]?.status === 'ABSENT'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {attendanceMap[noteModalStudent.id]?.status === 'ABSENT'
                        ? 'Ausencia'
                        : 'Retardo / Justificante'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-forest rounded-xl hover:bg-forest/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-2">
                  Motivo / Justificante de la falta o retardo:
                </label>
                <textarea
                  autoFocus
                  rows={4}
                  value={noteModalText}
                  onChange={(e) => setNoteModalText(e.target.value)}
                  placeholder="Escribe aquí la justificación (ej. Cita médica, aviso de los padres, viaje familiar, permiso especial)..."
                  className="w-full p-3.5 rounded-2xl border border-forest/15 text-xs focus:ring-1 focus:ring-forest bg-white leading-relaxed focus:outline-none shadow-2xs placeholder:text-muted-foreground/70"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-forest/[0.02] border-t border-forest/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                disabled={savingNote}
                className="px-4 py-2 text-xs font-bold text-forest/70 hover:text-forest hover:bg-forest/5 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveNoteModal}
                disabled={savingNote}
                className="px-5 py-2 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{savingNote ? 'Guardando...' : 'Guardar Justificante'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Root-Level Mobile Salon Selector Bottom Sheet Overlay */}
      {isMobileEnvOpen && (
        <div
          className="!mt-0 fixed inset-0 top-0 left-0 right-0 bottom-0 h-screen h-[100dvh] max-h-[100dvh] z-[100] bg-black/60 backdrop-blur-xs flex items-end sm:hidden animate-in fade-in duration-200 overflow-hidden"
          onClick={() => setIsMobileEnvOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl border-t border-forest/15 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-250 max-h-[80dvh] text-forest animate-duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 pb-3 border-b border-forest/10 shrink-0 bg-white rounded-t-3xl flex items-center justify-between">
              <span className="font-bold text-sm text-forest font-display">Seleccionar ambiente</span>
              <button
                type="button"
                onClick={() => setIsMobileEnvOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-3 space-y-1.5 pb-8">
              {allowedEnvironments.map((env) => {
                const isSelected = selectedEnvId === env.id;
                const envStudentsCount = students.filter(s => s.environment_id === env.id).length;

                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => {
                      setSelectedEnvId(env.id);
                      setIsMobileEnvOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-forest/5 text-forest border-forest/30 font-bold'
                        : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: env.color || '#1b3b2b' }}
                      />
                      <div>
                        <span className="block text-xs font-bold">{env.name}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                          {env.stage || 'Montessori'} • {envStudentsCount} {envStudentsCount === 1 ? 'alumno' : 'alumnos'}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-forest stroke-[3]" />}
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

export default AttendanceSection;
