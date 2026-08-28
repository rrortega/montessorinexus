import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Target, 
  Lightbulb, 
  HeartHandshake, 
  Mic, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  ChevronRight, 
  ArrowUpRight, 
  Layers, 
  Printer, 
  X,
  Volume2
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { 
  StudentItem, 
  ProgressConferenceReportItem, 
  ProgressConferenceComparisonData, 
  getStudentConferenceReports, 
  getStudentConferenceComparison, 
  deleteConferenceReport 
} from '@/lib/sqlite';
import { ConferenceReportFormDrawer } from './ConferenceReportFormDrawer';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';

interface StudentEvolutionTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentItem | null;
}

type ViewTab = 'timeline' | 'comparison';

export const StudentEvolutionTimelineDrawer: React.FC<StudentEvolutionTimelineDrawerProps> = ({
  isOpen,
  onClose,
  student
}) => {
  const { role } = useAuth();
  const confirm = useConfirm();
  const isStaff = role === 'OWNER' || role === 'ADMIN' || role === 'TEACHER' || role === 'STAFF';
  const canCreateReport = isStaff && student?.status === 'active';

  const [reports, setReports] = useState<ProgressConferenceReportItem[]>([]);
  const [comparisonData, setComparisonData] = useState<ProgressConferenceComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>('timeline');

  // Form Drawer
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ProgressConferenceReportItem | null>(null);

  const loadData = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const [reps, comp] = await Promise.all([
        getStudentConferenceReports(student.id),
        getStudentConferenceComparison(student.id).catch(() => null)
      ]);
      setReports(reps);
      setComparisonData(comp);
    } catch (e: any) {
      toast.error('Error al cargar la cronología evolutiva');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      loadData();
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const handleOpenCreate = () => {
    setEditingReport(null);
    setFormDrawerOpen(true);
  };

  const handleOpenEdit = (rep: ProgressConferenceReportItem) => {
    setEditingReport(rep);
    setFormDrawerOpen(true);
  };

  const handleDelete = async (id: string, term: string) => {
    const ok = await confirm({
      title: '¿Eliminar informe de reunión?',
      description: `¿Estás seguro de eliminar el informe de reunión "${term}"? Esta acción borrará las percepciones y acuerdos registrados.`,
      confirmText: 'Sí, eliminar informe',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteConferenceReport(id);
      toast.success('Informe eliminado');
      loadData();
    } catch (e: any) {
      toast.error('Error al eliminar informe');
    }
  };

  return (
    <>
      <SlideOverDrawer
        isOpen={isOpen}
        onClose={onClose}
        maxWidthClass="max-w-4xl"
        icon={
          student.avatar_url ? (
            <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="font-bold text-forest text-base font-display">{student.full_name.charAt(0)}</span>
          )
        }
        title={`Historia y Evolución • ${student.full_name}`}
        description="Reuniones familiares, acuerdos con las guías y avances a lo largo del tiempo."
        footer={
          <div className="flex items-center justify-between w-full">
            {canCreateReport ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full sm:w-auto px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Nueva Reunión</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:flex px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest"
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          
          {/* Header Summary & View Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-cream/40 border border-forest/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-forest/10 flex items-center justify-center font-bold text-forest text-base shrink-0 shadow-2xs">
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                ) : (
                  student.full_name.charAt(0)
                )}
              </div>
              <div>
                <h4 className="font-bold font-display text-forest text-sm">{student.full_name}</h4>
                <span className="text-xs text-muted-foreground block">
                  {student.environment_name || 'Ambiente Montessori'} • {reports.length} {reports.length === 1 ? 'Reunión registrada' : 'Reuniones registradas'}
                </span>
              </div>
            </div>

            {/* Toggle Tabs */}
            <div className="bg-white p-1 rounded-2xl border border-forest/10 shadow-2xs flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewTab('timeline')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewTab === 'timeline' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:bg-forest/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reuniones y Acuerdos</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('comparison')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewTab === 'comparison' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:bg-forest/5'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Avance en el Tiempo</span>
              </button>
            </div>
          </div>

          {/* TAB 1: CHRONOLOGICAL TIMELINE */}
          {viewTab === 'timeline' && (
            <div className="space-y-6 animate-in fade-in">
              {loading ? (
                <div className="py-16 text-center text-xs text-muted-foreground">
                  Cargando informes históricos...
                </div>
              ) : reports.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-forest/15 rounded-3xl text-center space-y-3 bg-white">
                  <Clock className="w-8 h-8 text-forest/40 mx-auto" />
                  <div>
                    <h5 className="font-bold text-forest text-sm">
                      {isStaff 
                        ? 'Aún no hay reuniones ni reportes registrados' 
                        : 'Aún no hay informes de progreso publicados'}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isStaff
                        ? 'Comienza registrando la primera reunión de evaluación y progreso del estudiante.'
                        : 'Las guías y el equipo pedagógico publicarán aquí los informes de progreso y acuerdos de evaluación de tu hijo.'}
                    </p>
                  </div>
                  {canCreateReport && (
                    <button
                      onClick={handleOpenCreate}
                      className="px-4 py-2 bg-forest text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear Primer Progress Report</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-forest/20">
                  {reports.map((rep, idx) => {
                    const snap = rep.masterySnapshot;
                    const dateFormatted = new Date(rep.conferenceDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

                    return (
                      <div key={rep.id} className="relative space-y-3 group">
                        {/* Timeline Bullet Node */}
                        <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-4 border-forest shadow-xs flex items-center justify-center" />

                        {/* Report Card */}
                        <div className="p-5 md:p-6 rounded-3xl bg-white border border-forest/10 shadow-sm hover:shadow-md transition-all space-y-4">
                          
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-forest/10">
                            <div>
                              <span className="text-[10px] font-bold text-forest/70 uppercase tracking-widest block font-mono">
                                {dateFormatted}
                              </span>
                              <h4 className="font-bold font-display text-forest text-base">
                                {rep.termName}
                              </h4>
                              {rep.attendees && (
                                <span className="text-[11px] text-muted-foreground block">
                                  Asistentes: <strong>{rep.attendees}</strong>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {snap && snap.overallPercentage !== undefined && (
                                <div className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Dominio:</span>
                                  <strong>{snap.overallPercentage}%</strong>
                                </div>
                              )}

                              {canCreateReport && (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(rep)}
                                    className="p-1.5 text-muted-foreground hover:text-forest rounded-lg hover:bg-forest/5 transition-colors"
                                    title="Editar Informe"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(rep.id, rep.termName)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                                    title="Eliminar Informe"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Executive Summary */}
                          {rep.executiveSummary && (
                            <p className="text-xs text-forest/90 leading-relaxed italic bg-forest/5 p-3 rounded-2xl border border-forest/10">
                              "{rep.executiveSummary}"
                            </p>
                          )}

                          {/* Audio Player if recorded */}
                          {rep.audioRecordingUrl && (
                            <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between gap-3 text-xs text-indigo-950">
                              <span className="font-bold flex items-center gap-1.5">
                                <Volume2 className="w-4 h-4 text-indigo-600" />
                                <span>Grabación de la Reunión</span>
                              </span>
                              <audio src={rep.audioRecordingUrl} controls className="h-8 max-w-[240px]" />
                            </div>
                          )}

                          {/* Core 4 Pillars Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Strengths */}
                            {rep.strengths && (
                              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
                                <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Fortalezas Observadas</span>
                                </span>
                                <pre className="font-body text-xs text-emerald-950/90 whitespace-pre-line leading-relaxed">
                                  {rep.strengths}
                                </pre>
                              </div>
                            )}

                            {/* Challenges */}
                            {rep.challenges && (
                              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                                <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                  <Target className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Retos & Áreas de Oportunidad</span>
                                </span>
                                <pre className="font-body text-xs text-amber-950/90 whitespace-pre-line leading-relaxed">
                                  {rep.challenges}
                                </pre>
                              </div>
                            )}

                            {/* Home recommendations */}
                            {rep.recommendationsHome && (
                              <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-1">
                                <span className="font-bold text-sky-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                  <Lightbulb className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Consejos para Casa</span>
                                </span>
                                <pre className="font-body text-xs text-sky-950/90 whitespace-pre-line leading-relaxed">
                                  {rep.recommendationsHome}
                                </pre>
                              </div>
                            )}

                            {/* Agreements */}
                            {rep.agreements && (
                              <div className="p-3.5 rounded-2xl bg-cream/80 border border-forest/15 space-y-1">
                                <span className="font-bold text-forest flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                  <HeartHandshake className="w-3.5 h-3.5 text-forest" />
                                  <span>Acuerdos Guía-Familia</span>
                                </span>
                                <pre className="font-body text-xs text-forest/90 whitespace-pre-line leading-relaxed">
                                  {rep.agreements}
                                </pre>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVOLUTION COMPARATOR */}
          {viewTab === 'comparison' && (
            <div className="space-y-6 animate-in fade-in">
              {(() => {
                const timeline = comparisonData?.timeline || (comparisonData as any)?.comparison || [];
                if (timeline.length < 2) {
                  return (
                    <div className="p-12 border-2 border-dashed border-forest/15 rounded-3xl text-center space-y-2 bg-white">
                      <TrendingUp className="w-8 h-8 text-forest/40 mx-auto" />
                      <h5 className="font-bold text-forest text-sm">Se necesitan al menos 2 reportes para generar la comparativa</h5>
                      <p className="text-xs text-muted-foreground">
                        Registra un segundo Progress Report para visualizar el crecimiento cuantitativo y superación de retos en el tiempo.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    
                    {/* Global Progress Evolution Bar */}
                    <div className="p-5 rounded-3xl bg-white border border-forest/10 shadow-sm space-y-4">
                      <span className="text-xs font-bold text-forest uppercase tracking-wider block border-b border-forest/10 pb-2">
                        📈 Evolución del Dominio Curricular Montessori por Período
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {timeline.map((item, idx) => (
                          <div key={item.reportId} className="p-4 rounded-2xl bg-cream/40 border border-forest/10 space-y-2 text-center">
                            <span className="text-[10px] font-bold text-forest/70 uppercase block truncate">
                              {item.termName}
                            </span>
                            <strong className="text-2xl font-bold font-display text-forest block">
                              {item.overallPercentage}%
                            </strong>
                            <span className="text-[10px] text-muted-foreground block">
                              {item.totalMastered} lecciones dominadas
                            </span>
                            {idx > 0 && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                item.growthPercentageFromPrevious >= 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.growthPercentageFromPrevious >= 0 ? `+${item.growthPercentageFromPrevious}% avance` : `${item.growthPercentageFromPrevious}%`}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Side-by-Side Qualitative Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {timeline.map((item, idx) => (
                        <div key={item.reportId} className="p-5 rounded-3xl bg-white border border-forest/10 shadow-sm space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-forest/10">
                            <span className="font-bold text-forest text-xs">{item.termName}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {new Date(item.conferenceDate).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-0.5">🌟 Fortalezas:</span>
                            <p className="text-forest/80 whitespace-pre-line text-[11px] leading-relaxed">{item.strengths || 'Sin registro'}</p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">🎯 Retos Planteados:</span>
                            <p className="text-forest/80 whitespace-pre-line text-[11px] leading-relaxed">{item.challenges || 'Sin registro'}</p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-forest uppercase block mb-0.5">🤝 Acuerdos Establecidos:</span>
                            <p className="text-forest/80 whitespace-pre-line text-[11px] leading-relaxed">{item.agreements || 'Sin registro'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })()}
            </div>
          )}

        </div>
      </SlideOverDrawer>

      {/* FORM DRAWER */}
      <ConferenceReportFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        report={editingReport}
        student={student}
        onSaved={loadData}
      />
    </>
  );
};

export default StudentEvolutionTimelineDrawer;
