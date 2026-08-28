import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Sparkles,
  Calendar,
  User,
  GraduationCap,
  CheckCircle2,
  Clock,
  Layers,
  X,
  Building2,
  Eye,
  Percent,
  BookOpen,
  Award,
  ChevronDown,
  PlayCircle,
  Printer,
  Edit3,
  Check
} from 'lucide-react';
import {
  StudentItem,
  StudentProgressReportData,
  getStudentProgressReport
} from '@/lib/sqlite';
import { toast } from 'sonner';

interface StudentProgressReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  studentsList: StudentItem[];
}

const TERM_PRESETS = [
  { label: '3er Trimestre (Marzo - Junio)', termName: 'P.R. 3RD TRIMESTER' },
  { label: '1er Trimestre (Septiembre - Noviembre)', termName: 'P.R. 1ST TRIMESTER' },
  { label: '2do Trimestre (Diciembre - Febrero)', termName: 'P.R. 2ND TRIMESTER' },
  { label: 'Ciclo Escolar 2025 - 2026 (Completo)', termName: 'Ciclo Escolar 2025-2026' },
  { label: 'Evaluación Semestral I', termName: 'Semestre I (Otoño-Invierno)' },
  { label: 'Evaluación Semestral II', termName: 'Semestre II (Primavera-Verano)' },
];

export const StudentProgressReportDrawer: React.FC<StudentProgressReportDrawerProps> = ({
  isOpen,
  onClose,
  studentId,
  studentsList
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || (studentsList[0]?.id || ''));
  const [selectedTerm, setSelectedTerm] = useState<string>(TERM_PRESETS[0].termName);
  const [includeObservations, setIncludeObservations] = useState(true);
  const [includeAttendance, setIncludeAttendance] = useState(true);

  const currentStudent = useMemo(() => {
    return studentsList.find(s => s.id === selectedStudentId);
  }, [studentsList, selectedStudentId]);
  const isGraduated = currentStudent?.status === 'graduated';

  // Editable fields in state
  const [studentReflection, setStudentReflection] = useState('');
  const [academicSummary, setAcademicSummary] = useState('');
  const [skillsSummary, setSkillsSummary] = useState('');
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);

  const [reportData, setReportData] = useState<StudentProgressReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const isPushedRef = useRef(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  // Handle open / close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC key and Browser Back (popstate) handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const stateId = `report_drawer_${Date.now()}`;
    window.history.pushState({ drawerStateId: stateId }, '');
    isPushedRef.current = true;

    const handlePopState = () => {
      isPushedRef.current = false;
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      if (isPushedRef.current && window.history.state?.drawerStateId === stateId) {
        window.history.back();
        isPushedRef.current = false;
      }
    };
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 75) {
      onClose();
    }
    setDragY(0);
  };

  useEffect(() => {
    if (studentId) {
      setSelectedStudentId(studentId);
    } else if (studentsList.length > 0 && !selectedStudentId) {
      setSelectedStudentId(studentsList[0].id);
    }
  }, [studentId, studentsList]);

  const loadReport = async (sId: string, term: string) => {
    if (!sId) return;
    setLoading(true);
    try {
      const data = await getStudentProgressReport(sId, { termName: term });
      setReportData(data);
      setStudentReflection(data.studentReflection || '');
      setAcademicSummary(data.academicSummary || '');
      setSkillsSummary(data.skillsSummary || '');
    } catch (e: any) {
      console.error(e);
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedStudentId) {
      loadReport(selectedStudentId, selectedTerm);
    }
  }, [isOpen, selectedStudentId, selectedTerm]);

  // Continuous Horizontal Cal-Heatmap Generator (Full 12-Month Calendar Year)
  const continuousHeatmap = useMemo(() => {
    const records = reportData?.attendance.records || [];
    let targetYear = new Date().getFullYear();

    if (records.length > 0) {
      const timestamps = records
        .map(r => new Date(r.date).getTime())
        .filter(t => !isNaN(t));
      if (timestamps.length > 0) {
        targetYear = new Date(Math.max(...timestamps)).getFullYear();
      }
    }

    // Full 12-month calendar year: January 1 to December 31
    const periodStartDate = new Date(targetYear, 0, 1);
    const periodEndDate = new Date(targetYear, 11, 31);

    // Align start to the preceding Monday
    const gridStartDate = new Date(periodStartDate);
    const startDayOfWeek = (gridStartDate.getDay() + 6) % 7; // Monday = 0
    gridStartDate.setDate(gridStartDate.getDate() - startDayOfWeek);

    // Align end to the following Sunday
    const gridEndDate = new Date(periodEndDate);
    const endDayOfWeek = (gridEndDate.getDay() + 6) % 7;
    if (endDayOfWeek < 6) {
      gridEndDate.setDate(gridEndDate.getDate() + (6 - endDayOfWeek));
    }

    const weeks: Array<{
      weekIndex: number;
      days: Array<{
        date: Date;
        dateKey: string;
        dayNum: number;
        dayOfWeek: number;
        month: number;
        year: number;
        isWithinYear: boolean;
        isMonthStart: boolean;
      }>;
    }> = [];

    const monthLabels: Array<{
      monthIndex: number;
      name: string;
      colStart: number;
      colSpan: number;
    }> = [];

    let curDate = new Date(gridStartDate);
    let currentWeekDays: any[] = [];
    let colIdx = 0;
    let lastMonth = -1;
    let monthStartCol = 0;

    while (curDate <= gridEndDate) {
      const d = new Date(curDate);
      const dayOfWeek = (d.getDay() + 6) % 7;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isWithinYear = d.getFullYear() === targetYear;
      const isMonthStart = d.getDate() === 1;

      if (isWithinYear && d.getMonth() !== lastMonth) {
        if (lastMonth !== -1) {
          const span = colIdx - monthStartCol;
          if (span > 0) {
            const dObj = new Date(targetYear, lastMonth, 1);
            const mName = dObj.toLocaleDateString('en-US', { month: 'short' });
            monthLabels.push({
              monthIndex: lastMonth,
              name: mName,
              colStart: monthStartCol,
              colSpan: span
            });
          }
        }
        lastMonth = d.getMonth();
        monthStartCol = colIdx;
      }

      currentWeekDays.push({
        date: d,
        dateKey,
        dayNum: d.getDate(),
        dayOfWeek,
        month: d.getMonth(),
        year: d.getFullYear(),
        isWithinYear,
        isMonthStart
      });

      if (dayOfWeek === 6) {
        weeks.push({
          weekIndex: colIdx,
          days: currentWeekDays
        });
        currentWeekDays = [];
        colIdx++;
      }

      curDate.setDate(curDate.getDate() + 1);
    }

    if (lastMonth !== -1 && colIdx > monthStartCol) {
      const dObj = new Date(targetYear, lastMonth, 1);
      const mName = dObj.toLocaleDateString('en-US', { month: 'short' });
      monthLabels.push({
        monthIndex: lastMonth,
        name: mName,
        colStart: monthStartCol,
        colSpan: colIdx - monthStartCol
      });
    }

    return {
      weeks,
      monthLabels,
      yearLabel: `${targetYear}`
    };
  }, [selectedTerm, reportData]);

  // Attendance Records Quick Lookup Map (date -> record)
  const attendanceRecordMap = useMemo(() => {
    const map: Record<string, { status: string; note?: string }> = {};
    (reportData?.attendance.records || []).forEach((r) => {
      map[r.date] = { status: r.status, note: r.note };
    });
    return map;
  }, [reportData]);

  const handlePrint = () => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'visible';
    window.print();
    setTimeout(() => {
      document.body.style.overflow = originalOverflow;
    }, 500);
  };

  if (!isMounted) return null;

  return createPortal(
    <div
      id="montessori-report-portal"
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } print:relative print:inset-auto print:z-auto print:block print:w-full print:h-auto print:bg-white print:p-0 print:m-0 print:overflow-visible`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-5xl bg-white shadow-2xl flex flex-col h-full overflow-hidden transition-transform duration-300 ease-out border-l border-forest/10 ${
          isVisible ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
        } print:relative print:inset-auto print:w-full print:max-w-full print:h-auto print:transform-none print:shadow-none print:border-none print:overflow-visible print:bg-white`}
        style={{
          transform: isDragging ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : undefined
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header & Action Toolbar (Non-printable) */}
        <div
          data-print-hidden="true"
          className="p-4 sm:p-5 border-b border-forest/10 bg-forest/5 flex items-center justify-between gap-4 shrink-0 print:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Mobile Pull-Down Handle Bar */}
          <div className="sm:hidden w-12 h-1.5 bg-forest/25 rounded-full mx-auto mb-2 cursor-grab active:cursor-grabbing shrink-0 transition-colors" />

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-white border border-forest/15 text-forest flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              <FileText className="w-5 h-5 text-forest" />
            </div>
            <div className="truncate">
              <h3 className="font-bold font-display text-forest text-base sm:text-lg leading-tight truncate">
                Montessori Progress Report
              </h3>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Formato estándar oficial Montessori Compass con narrativa integral, asistencia y evaluación curricular.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isGraduated && (
              <button
                type="button"
                onClick={() => setIsEditingNarrative(!isEditingNarrative)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isEditingNarrative
                    ? 'bg-forest text-white shadow-2xs'
                    : 'bg-white text-forest border border-forest/15 hover:bg-forest/5'
                }`}
                title="Editar textos del reporte"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingNarrative ? 'Vista Previa' : 'Editar Textos'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-muted-foreground hover:text-forest hover:bg-forest/10 transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Options Bar (Non-printable) */}
        <div
          data-print-hidden="true"
          className="p-3.5 px-6 bg-forest/[0.02] border-b border-forest/10 flex flex-wrap items-center justify-between gap-4 shrink-0 print:hidden text-xs"
        >
          <div className="flex items-center gap-4 flex-wrap">
            {/* Student Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-forest uppercase text-[11px]">Alumno:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-forest/15 text-xs bg-white font-bold text-forest shadow-2xs focus:outline-none"
              >
                {studentsList.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>

            {/* Term Preset Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-forest uppercase text-[11px]">Período:</span>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-forest/15 text-xs bg-white font-semibold text-forest shadow-2xs focus:outline-none"
              >
                {TERM_PRESETS.map((t, idx) => (
                  <option key={idx} value={t.termName}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 font-semibold text-forest">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeObservations}
                onChange={(e) => setIncludeObservations(e.target.checked)}
                className="w-4 h-4 rounded accent-forest text-forest"
              />
              <span>Incluir Observaciones Bitácora</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAttendance}
                onChange={(e) => setIncludeAttendance(e.target.checked)}
                className="w-4 h-4 rounded accent-forest text-forest"
              />
              <span>Incluir Asistencia</span>
            </label>
          </div>
        </div>

        {/* Report Document Sheet (Full White Canvas) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 bg-white flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible">
          {loading ? (
            <div className="py-24 text-center text-xs text-muted-foreground">
              Generando informe pedagógico Montessori Compass...
            </div>
          ) : !reportData ? (
            <div className="py-24 text-center text-xs text-muted-foreground">
              Selecciona un alumno para generar el reporte.
            </div>
          ) : (
            <div
              ref={printAreaRef}
              id="montessori-report-printable"
              className="bg-white w-full max-w-4xl px-2 sm:px-6 py-4 space-y-7 print:p-0 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-full font-sans text-slate-900 print:text-[10pt] leading-normal"
            >
              {/* 1. Header: School Info (Left) & Student Info (Right) */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-black/80">
                <div className="space-y-0.5 text-xs text-slate-800">
                  <h2 className="font-bold text-sm tracking-tight text-black">{reportData.school.name}</h2>
                  <p className="text-[11px] text-slate-600">{reportData.school.address || 'Francisco I. Madero, Cancún 77560'}</p>
                </div>

                <div className="text-left sm:text-right space-y-0.5 text-xs">
                  <h3 className="font-bold text-sm text-black">{reportData.student.fullName}</h3>
                  <div className="text-[11px] text-slate-700 space-y-0.5">
                    <p>
                      DOB: <span className="font-mono">{reportData.student.dateOfBirth ? new Date(reportData.student.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A'}</span>
                    </p>
                    <p>
                      Age: <span className="font-semibold">{reportData.student.ageString || 'N/A'}</span>
                    </p>
                    <p>
                      Grade/Year: <span className="font-semibold">{reportData.student.grade || reportData.student.environmentName}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Report Title & Student Photo Banner */}
              <div className="flex items-center justify-between gap-4 pt-1 pb-4 border-b border-black/80">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black uppercase font-display">
                    {reportData.termName} {reportData.student.environmentName.toUpperCase()}
                  </h1>
                </div>

                {reportData.student.avatarUrl && (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-300 shadow-xs shrink-0 bg-slate-100">
                    <img
                      src={reportData.student.avatarUrl}
                      alt={reportData.student.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* 3. Attendance Summary & Heatmap Matrix */}
              {includeAttendance && (
                <div className="space-y-3.5 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/20 pb-1.5">
                    <h3 className="font-bold text-base text-black font-display tracking-tight">
                      Attendance Summary & Heatmap Matrix
                    </h3>

                    {/* Stats Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold">
                        {reportData.attendance.presentDays} días Presente
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-300 text-rose-800 font-bold">
                        {reportData.attendance.absentDays} Ausencias
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-800 font-bold">
                        {reportData.attendance.tardyDays} Retardos
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-800 font-bold font-mono">
                        {reportData.attendance.attendanceRate}% Asistencia
                      </span>
                    </div>
                  </div>

                  {/* Continuous Horizontal Cal-Heatmap (Minimal Height & Compact Grid) */}
                  <div className="border border-slate-300 rounded-lg p-2 sm:p-2.5 bg-white overflow-x-auto no-scrollbar shadow-2xs">
                    <div className="flex items-stretch gap-2 min-w-[580px]">
                      {/* Vertical Year Label on Left */}
                      <div className="flex items-center justify-center px-1 border-r border-slate-200 shrink-0">
                        <span className="text-base sm:text-lg font-black text-slate-400 tracking-wider [writing-mode:vertical-lr] rotate-180 select-none font-display">
                          {continuousHeatmap.yearLabel}
                        </span>
                      </div>

                      {/* Main Continuous Heatmap Area */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex items-start gap-1.5">
                          {/* Columns of Weeks */}
                          <div className="flex-1 flex gap-[1.5px]">
                            {continuousHeatmap.weeks.map((week) => (
                              <div
                                key={week.weekIndex}
                                className="flex flex-col gap-[1.5px] flex-1"
                              >
                                {week.days.map((day) => {
                                  const record = attendanceRecordMap[day.dateKey];
                                  const isWeekend = day.dayOfWeek === 5 || day.dayOfWeek === 6;

                                  // Default soft cream tile style
                                  let bgStyle = 'bg-[#fef9c3]/80 border border-[#fef08a]';
                                  let tooltip = `${day.dayNum} ${day.date.toLocaleDateString('es-MX', { month: 'short' })}: Sin sesión / No lectivo`;

                                  if (!day.isWithinYear) {
                                    bgStyle = 'bg-transparent border-none opacity-0 pointer-events-none';
                                  } else if (record) {
                                    if (record.status === 'PRESENT') {
                                      bgStyle = 'bg-[#0d9488] border border-[#0f766e] text-white shadow-2xs';
                                      tooltip = `${day.dayNum} ${day.date.toLocaleDateString('es-MX', { month: 'short' })}: Presente ✓`;
                                    } else if (record.status === 'ABSENT') {
                                      bgStyle = 'bg-[#e11d48] border border-[#be123c] text-white shadow-2xs';
                                      tooltip = `${day.dayNum} ${day.date.toLocaleDateString('es-MX', { month: 'short' })}: Ausente ${record.note ? `("${record.note}")` : '✕'}`;
                                    } else if (record.status === 'TARDY' || record.status === 'EXCUSED') {
                                      bgStyle = 'bg-[#f97316] border border-[#c2410c] text-white shadow-2xs';
                                      tooltip = `${day.dayNum} ${day.date.toLocaleDateString('es-MX', { month: 'short' })}: Retardo / Justificante ${record.note ? `("${record.note}")` : '⏱'}`;
                                    }
                                  } else if (isWeekend) {
                                    bgStyle = 'bg-[#fef9c3]/40 border border-[#fef08a]/60 opacity-50';
                                  }

                                  return (
                                    <div
                                      key={day.dateKey}
                                      title={tooltip}
                                      className={`w-full aspect-square max-h-[10px] rounded-[1.5px] transition-transform hover:scale-150 cursor-pointer flex items-center justify-center ${bgStyle} ${
                                        day.isMonthStart && day.dayOfWeek === 0 ? 'border-l-2 border-slate-500' : ''
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            ))}
                          </div>

                          {/* Days of Week Labels on Right */}
                          <div className="flex flex-col gap-[1.5px] pl-1.5 text-[7.5px] font-bold text-slate-500 select-none shrink-0 leading-none">
                            <span className="h-[10px] flex items-center">Mon</span>
                            <span className="h-[10px] flex items-center">Tue</span>
                            <span className="h-[10px] flex items-center">Wed</span>
                            <span className="h-[10px] flex items-center">Thu</span>
                            <span className="h-[10px] flex items-center">Fri</span>
                            <span className="h-[10px] flex items-center text-slate-400">Sat</span>
                            <span className="h-[10px] flex items-center text-slate-400">Sun</span>
                          </div>
                        </div>

                        {/* Month Labels Along the Bottom */}
                        <div className="flex pt-1 text-[8.5px] font-bold text-slate-600 select-none border-t border-slate-200 mt-0.5">
                          {continuousHeatmap.monthLabels.map((m, idx) => (
                            <div
                              key={idx}
                              style={{ flex: m.colSpan }}
                              className="text-center truncate px-0.5"
                            >
                              <span>{m.name}</span>
                            </div>
                          ))}
                          {/* Spacer for Right Row Labels */}
                          <div className="w-6 shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-[9.5px] text-slate-600 pt-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-[1.5px] bg-[#0d9488] shadow-2xs inline-block" />
                        <span>Presente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-[1.5px] bg-[#e11d48] shadow-2xs inline-block" />
                        <span>Ausente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-[1.5px] bg-[#f97316] shadow-2xs inline-block" />
                        <span>Retardo / Justificante</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-[1.5px] bg-[#fef9c3] border border-[#fef08a] inline-block" />
                        <span>Sin registro / Feriado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Student Reflection (Narrativa Integral y Socioemocional) */}
              <div className="space-y-2.5 pt-2">
                <h3 className="font-bold text-base text-black font-display tracking-tight border-b border-black/20 pb-1">
                  Student Reflection
                </h3>
                {isEditingNarrative ? (
                  <textarea
                    rows={6}
                    value={studentReflection}
                    onChange={(e) => setStudentReflection(e.target.value)}
                    className="w-full p-3 rounded-xl border border-forest/20 text-xs leading-relaxed focus:ring-1 focus:ring-forest bg-white"
                  />
                ) : (
                  <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-line space-y-2">
                    {studentReflection}
                  </div>
                )}
              </div>

              {/* 5. Academic Summary (Resumen Académico por Áreas) */}
              <div className="space-y-2.5 pt-2">
                <h3 className="font-bold text-base text-black font-display tracking-tight border-b border-black/20 pb-1">
                  Academic Summary
                </h3>
                {isEditingNarrative ? (
                  <textarea
                    rows={6}
                    value={academicSummary}
                    onChange={(e) => setAcademicSummary(e.target.value)}
                    className="w-full p-3 rounded-xl border border-forest/20 text-xs leading-relaxed focus:ring-1 focus:ring-forest bg-white"
                  />
                ) : (
                  <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-line space-y-2">
                    {academicSummary}
                  </div>
                )}
              </div>

              {/* 6. Curriculum Assessment Tables (Agrupado por Área | Sub-Área) */}
              <div className="space-y-6 pt-2">
                {reportData.areaBreakdown.map((area) => (
                  <div key={area.areaId} className="space-y-4">
                    {(area.categories || []).map((cat) => {
                      if (!cat.lessons || cat.lessons.length === 0) return null;
                      return (
                        <div key={cat.id} className="space-y-1.5 print-avoid-break">
                          <h4 className="font-bold text-xs sm:text-sm text-black tracking-tight">
                            {area.areaName} | {cat.name}
                          </h4>

                          <div className="border border-slate-400/80 rounded-md overflow-hidden shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-700 text-white font-semibold text-[11px]">
                                  <th className="p-2 font-medium">Lesson</th>
                                  <th className="p-2 w-28 text-center font-medium">Assessment</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-300 text-slate-800">
                                {cat.lessons.map((les) => (
                                  <tr key={les.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-2.5 align-top space-y-0.5">
                                      <strong className="block text-slate-900 text-xs font-bold">{les.name}:</strong>
                                      <p className="text-[11px] text-slate-700 pl-2">
                                        • {les.criteria}
                                      </p>
                                    </td>
                                    <td className="p-2.5 align-middle text-center font-mono text-base">
                                      {les.status === 'MASTERED' ? (
                                        <span className="text-sky-700 font-bold inline-block text-lg" title="Dominado / Mastered">▲</span>
                                      ) : les.status === 'PRACTICING' ? (
                                        <span className="text-sky-600 font-bold inline-block text-base" title="Practicando / Practicing">∧</span>
                                      ) : les.status === 'PRESENTED' ? (
                                        <span className="text-sky-600 font-bold inline-block text-lg" title="Presentado / Introduced">△</span>
                                      ) : (
                                        <span className="text-slate-300 text-xs">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* 7. Skills Summary (Metas y Próximos Pasos) */}
              <div className="space-y-2 pt-2 print-avoid-break">
                <h3 className="font-bold text-base text-black font-display tracking-tight border-b border-black/20 pb-1">
                  Skills Summary
                </h3>
                {isEditingNarrative ? (
                  <textarea
                    rows={4}
                    value={skillsSummary}
                    onChange={(e) => setSkillsSummary(e.target.value)}
                    className="w-full p-3 rounded-xl border border-forest/20 text-xs leading-relaxed focus:ring-1 focus:ring-forest bg-white"
                  />
                ) : (
                  <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-line pl-1 space-y-1">
                    {skillsSummary}
                  </div>
                )}
              </div>

              {/* 8. Attention, Concentration, & Work (Rúbrica de Hábitos de Trabajo) */}
              <div className="space-y-2 pt-2 print-avoid-break">
                <h3 className="font-bold text-base text-black font-display tracking-tight">
                  Attention, Concentration, & Work
                </h3>
                <div className="border border-slate-400/80 rounded-md overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-700 text-white font-semibold text-[11px]">
                        <th className="p-2 w-40 font-medium">Category</th>
                        <th className="p-2 font-medium">Skill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 text-slate-800">
                      {(reportData.workHabits || []).map((habit, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-900 align-top text-xs">
                            {habit.category}:
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-700 align-top leading-relaxed">
                            {habit.skill}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 9. Assessment Legend (Simbología Montessori Compass) */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-around text-xs text-slate-700 print-avoid-break">
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-600 text-base font-bold">△</span>
                  <span className="text-[11px]"><strong>Introduced</strong> (Presentado)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-600 text-base font-bold">∧</span>
                  <span className="text-[11px]"><strong>Practicing</strong> (En práctica)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-700 text-base font-bold">▲</span>
                  <span className="text-[11px]"><strong>Mastered</strong> (Dominado)</span>
                </div>
              </div>

              {/* 10. Qualitative Observations Section (Opcional) */}
              {includeObservations && reportData.observations.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-300 print-avoid-break">
                  <h3 className="font-bold text-base text-black font-display tracking-tight flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-700" />
                    <span>Observaciones de la Guía</span>
                  </h3>

                  <div className="space-y-2">
                    {reportData.observations.slice(0, 3).map(obs => (
                      <div key={obs.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground text-[9px]">
                          <span className="font-mono">
                            {new Date(obs.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed italic text-[11px]">
                          "{obs.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default StudentProgressReportDrawer;
