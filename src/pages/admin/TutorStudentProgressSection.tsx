import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  FileText, 
  GraduationCap, 
  Calendar, 
  Award, 
  Layers, 
  Users, 
  CheckCircle2, 
  Clock, 
  HeartHandshake,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  Lock,
  HeartPulse,
  Copy,
  Check
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import { 
  StudentItem, 
  getMyTutorStudents, 
  getStudents,
  StudentProgressReportData,
  getStudentProgressReport
} from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';
import { StudentEvolutionTimelineDrawer } from '@/components/admin/StudentEvolutionTimelineDrawer';
import { StudentProgressReportDrawer } from '@/components/admin/StudentProgressReportDrawer';
import { StudentCharacterizationMatrixDrawer } from '@/components/admin/StudentCharacterizationMatrixDrawer';
import { toast } from 'sonner';

interface StudentWithSummary extends StudentItem {
  masteryPct?: number;
  totalMastered?: number;
  totalLessons?: number;
}

export const TutorStudentProgressSection: React.FC = () => {
  const { user, role, activeMembership } = useAuth();
  const [students, setStudents] = useState<StudentWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  const handleCopyCode = (code?: string, id?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedStudentId(id || code);
    toast.success(`Matrícula ${code} copiada al portapapeles`);
    setTimeout(() => setCopiedStudentId(null), 2000);
  };

  // Selected Student for Drawers
  const [selectedStudentForEvolution, setSelectedStudentForEvolution] = useState<StudentItem | null>(null);
  const [evolutionDrawerOpen, setEvolutionDrawerOpen] = useState(false);

  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | null>(null);
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);

  const [selectedStudentForMatrix, setSelectedStudentForMatrix] = useState<StudentItem | null>(null);
  const [matrixDrawerOpen, setMatrixDrawerOpen] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        let studentList: StudentItem[] = [];
        const isTutor = role === 'TUTOR' || activeMembership?.role === 'TUTOR' || user?.staffRole === 'TUTOR';
        if (isTutor) {
          studentList = user?.email ? await getMyTutorStudents(user.email) : [];
        } else {
          studentList = await getStudents();
        }
        
        // Enrich students with quick stats in parallel
        const enriched = await Promise.all(
          studentList.map(async (stu) => {
            try {
              const rep = await getStudentProgressReport(stu.id);
              return {
                ...stu,
                masteryPct: rep.statistics?.overallMasteryPct || 0,
                totalMastered: rep.statistics?.totalMastered || 0,
                totalLessons: rep.statistics?.totalLessonsInCurriculum || 0
              };
            } catch (e) {
              return {
                ...stu,
                masteryPct: 0,
                totalMastered: 0,
                totalLessons: 0
              };
            }
          })
        );

        setStudents(enriched);
      } catch (e: any) {
        console.error(e);
        toast.error('Error al cargar la lista de estudiantes');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [activeMembership?.schoolId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white leading-tight">
                Historia y Evolución
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                Conoce los avances, acuerdos de las reuniones y cómo nuestro equipo acompaña a tu hijo en su día a día escolar.
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-white/90 shrink-0 space-y-0.5">
            <span className="text-[10px] text-white/60 uppercase font-bold block">Estudiantes</span>
            <strong className="text-sm sm:text-base font-bold font-display block text-white">
              {students.length} {students.length === 1 ? 'Hijo / Alumno' : 'Hijos / Alumnos'}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Student Cards List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-muted-foreground bg-white rounded-3xl border border-forest/10 shadow-xs">
          Cargando información de tus hijos...
        </div>
      ) : students.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-forest/10 shadow-xs space-y-3">
          <GraduationCap className="w-12 h-12 text-forest/30 mx-auto" />
          <h3 className="font-bold text-forest text-base font-display">No hay estudiantes vinculados a tu cuenta</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Comunícate con la secretaría o dirección de tu colegio para vincular el expediente de tu hijo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {students.map((student) => {
            const isActive = student.status === 'active';
            const isGraduated = student.status === 'graduated';
            const isInactive = !isActive && !isGraduated;

            const environmentLabel = isGraduated 
              ? 'Sin ambiente / Egreso'
              : isInactive
                ? 'Sin ambiente / Inactivo'
                : student.environment_name || student.grade || 'Ambiente Montessori';

            return (
              <div 
                key={student.id}
                className={`bg-white rounded-3xl border transition-all p-6 md:p-7 space-y-6 ${
                  isGraduated 
                    ? 'border-sky-200/80 shadow-2xs hover:shadow-md bg-gradient-to-b from-sky-50/20 to-white' 
                    : isActive 
                      ? 'border-forest/10 shadow-xs hover:shadow-md'
                      : 'border-amber-200/80 shadow-2xs opacity-90'
                }`}
              >
                {/* Graduated Banner Notice */}
                {isGraduated && (
                  <div className="bg-sky-500/10 border border-sky-300/60 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 text-xs text-sky-950 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 font-medium">
                      <GraduationCap className="w-4 h-4 text-sky-700 shrink-0" />
                      <span>
                        <strong>Alumno Egresado:</strong> {student.full_name} completó satisfactoriamente su ciclo escolar. Puedes consultar su historial y reportes archivados.
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-200/70 text-sky-900 px-2 py-0.5 rounded-md shrink-0">
                      Historial
                    </span>
                  </div>
                )}

                {/* Student Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-forest/10">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-2xl font-display shrink-0 shadow-2xs border ${
                      isGraduated
                        ? 'bg-sky-100 text-sky-900 border-sky-300/60'
                        : 'bg-forest/10 text-forest border-forest/15'
                    }`}>
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                      ) : (
                        student.full_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold font-display text-forest">
                          {student.full_name}
                        </h2>
                        {isGraduated && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-sky-600" />
                            <span>Egresado</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className={`font-semibold flex items-center gap-1 ${
                          isGraduated ? 'text-sky-800 font-bold' : isInactive ? 'text-amber-800' : 'text-forest/90'
                        }`}>
                          {isGraduated && <GraduationCap className="w-3.5 h-3.5 text-sky-600 inline" />}
                          <span>{environmentLabel}</span>
                        </span>
                        {student.blood_type && (
                          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-md border border-red-100 font-bold flex items-center gap-1">
                            <HeartPulse className="w-3 h-3 text-red-600" />
                            <span>{student.blood_type}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Action & Status Corner */}
                  <div className="flex items-center gap-3 self-start sm:self-center flex-wrap justify-end">
                    {/* Copyable Status & Enrollment Badge */}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(student.enrollment_code, student.id)}
                      title={student.enrollment_code ? `Clic para copiar matrícula: ${student.enrollment_code}` : 'Estado escolar'}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs group/copy cursor-pointer active:scale-95 ${
                        isGraduated
                          ? 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100 hover:border-sky-300'
                          : isActive 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' 
                            : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {isGraduated ? (
                        <GraduationCap className="w-3.5 h-3.5 text-sky-700" />
                      ) : isActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                      )}
                      <span>
                        {isGraduated
                          ? `Egresado / Graduado${student.enrollment_code ? ` • ${student.enrollment_code}` : ''}`
                          : isActive 
                            ? `Matrícula Activa${student.enrollment_code ? ` • ${student.enrollment_code}` : ''}`
                            : `Inactivo${student.enrollment_code ? ` • ${student.enrollment_code}` : ''}`}
                      </span>
                      {student.enrollment_code && (
                        copiedStudentId === student.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-50 group-hover/copy:opacity-100 transition-opacity shrink-0" />
                        )
                      )}
                    </button>

                    {/* Mastery Quick Badge */}
                    <div className="flex items-center gap-3 bg-cream/50 p-2 px-3.5 rounded-2xl border border-forest/10">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Avance</span>
                        <strong className="text-forest text-sm font-bold font-mono block">
                          {student.masteryPct || 0}%
                        </strong>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-forest text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {student.totalMastered || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Interactive Tracking Portals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Action Card 1: Mirada del Equipo */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-cream/80 border border-amber-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all group">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-forest text-sm font-display group-hover:text-amber-800 transition-colors">
                          Mirada del Equipo
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          Cómo las guías y el personal ven su autonomía, convivencia y talentos en el colegio.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStudentForMatrix(student);
                        setMatrixDrawerOpen(true);
                      }}
                      className="w-full py-2.5 px-4 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-between group-hover:scale-102"
                    >
                      <span>Échale un vistazo</span>
                      <ChevronRight className="w-4 h-4 text-amber-700" />
                    </button>
                  </div>

                  {/* Action Card 2: Reuniones y Acuerdos */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-cream/80 border border-emerald-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all group">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                        <TrendingUp className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-forest text-sm font-display group-hover:text-emerald-800 transition-colors">
                          Reuniones y Acuerdos
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          Notas de las reuniones familiares, audios, retos conversados y compromisos con las guías.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStudentForEvolution(student);
                        setEvolutionDrawerOpen(true);
                      }}
                      className="w-full py-2.5 px-4 bg-forest hover:bg-forest/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-between group-hover:scale-102"
                    >
                      <span>Échale un vistazo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Card 3: Reporte de Progreso */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50/60 to-cream/80 border border-sky-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:border-sky-300 transition-all group">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-2xs">
                        <FileText className="w-5 h-5 text-sky-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-forest text-sm font-display group-hover:text-sky-800 transition-colors">
                          Reporte de Progreso
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          Ficha interactiva de avance curricular, áreas Montessori y lecciones dominadas en el período.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStudentForReport(student.id);
                        setReportDrawerOpen(true);
                      }}
                      className="w-full py-2.5 px-4 bg-white hover:bg-sky-100/60 text-sky-900 border border-sky-300 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-between group-hover:scale-102"
                    >
                      <span>Échale un vistazo</span>
                      <ChevronRight className="w-4 h-4 text-sky-700" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EVOLUTION TIMELINE DRAWER */}
      <StudentEvolutionTimelineDrawer
        isOpen={evolutionDrawerOpen}
        onClose={() => setEvolutionDrawerOpen(false)}
        student={selectedStudentForEvolution}
      />

      {/* PROGRESS REPORT DRAWER (PDF) */}
      <StudentProgressReportDrawer
        isOpen={reportDrawerOpen}
        onClose={() => setReportDrawerOpen(false)}
        studentId={selectedStudentForReport}
        studentsList={students}
      />

      {/* 360° CHARACTERIZATION MATRIX DRAWER */}
      <StudentCharacterizationMatrixDrawer
        isOpen={matrixDrawerOpen}
        onClose={() => setMatrixDrawerOpen(false)}
        student={selectedStudentForMatrix}
        onOpenCreate={() => {}}
        onOpenEdit={() => {}}
      />

    </div>
  );
};

export default TutorStudentProgressSection;
