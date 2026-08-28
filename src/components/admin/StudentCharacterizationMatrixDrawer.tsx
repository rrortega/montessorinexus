import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  HeartHandshake,
  Compass,
  Smile,
  Tag,
  MapPin,
  Calendar,
  MessageSquare,
  Award,
  ShieldCheck,
  Coffee,
  Palette,
  Layers,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  Quote,
  Copy,
  Check,
  Star,
  TreePine,
  GraduationCap,
  Building2,
  Target,
  User,
  Lightbulb
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import {
  StudentCharacterizationItem,
  CharacterizationComparisonData,
  CharacterizationConsensusProfile,
  getStudentCharacterizationComparison,
  generateCharacterizationConsensus,
  deleteStudentCharacterization,
  StudentItem
} from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';

interface StudentCharacterizationMatrixDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentItem | null;
  onOpenCreate: (student: StudentItem) => void;
  onOpenEdit: (entry: StudentCharacterizationItem) => void;
  refreshTrigger?: number;
}

type TabType = 'matrix' | 'consensus';

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  LEAD_GUIDE: { label: 'Guía Titular', bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', icon: GraduationCap },
  ASSISTANT_GUIDE: { label: 'Guía Asistente', bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200', icon: TreePine },
  SUPPORT_STAFF: { label: 'Personal de Apoyo', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', icon: HeartHandshake },
  SPECIALIST: { label: 'Especialista / Taller', bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200', icon: Palette },
  ADMIN: { label: 'Dirección Pedagógica', bg: 'bg-sky-50', text: 'text-sky-900', border: 'border-sky-200', icon: Building2 }
};

const AREA_LABELS: Record<string, string> = {
  SALON: 'Salón Montessori',
  COMEDOR: 'Comedor / Refrigerio',
  PATIO_JARDIN: 'Patio & Jardín Exterior',
  TALLER_ESPECIAL: 'Taller Especial',
  AREAS_COMUNES: 'Áreas Comunes',
  GENERAL: 'General / Transversal'
};

export const StudentCharacterizationMatrixDrawer: React.FC<StudentCharacterizationMatrixDrawerProps> = ({
  isOpen,
  onClose,
  student,
  onOpenCreate,
  onOpenEdit,
  refreshTrigger
}) => {
  const { role } = useAuth();
  const confirm = useConfirm();
  const isStaff = role === 'OWNER' || role === 'ADMIN' || role === 'TEACHER' || role === 'STAFF';

  const [activeTab, setActiveTab] = useState<TabType>(isStaff ? 'matrix' : 'consensus');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CharacterizationComparisonData | null>(null);

  // AI Consensus State
  const [consensusProfile, setConsensusProfile] = useState<CharacterizationConsensusProfile | null>(null);
  const [generatingConsensus, setGeneratingConsensus] = useState(false);
  const [copiedConsensus, setCopiedConsensus] = useState(false);

  const loadData = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await getStudentCharacterizationComparison(student.id);
      setData(res);
      if (res.consensusProfile) {
        setConsensusProfile(res.consensusProfile);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Error al cargar caracterizaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      setActiveTab(isStaff ? 'matrix' : 'consensus');
      loadData();
    }
  }, [isOpen, student, isStaff, refreshTrigger]);

  if (!isOpen || !student) return null;

  const handleDeleteEntry = async (id: string, author: string) => {
    const ok = await confirm({
      title: '¿Eliminar caracterización pedagógica?',
      description: `¿Estás seguro de eliminar la caracterización realizada por ${author}?`,
      confirmText: 'Sí, eliminar',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteStudentCharacterization(id);
      toast.success('Caracterización eliminada');
      loadData();
    } catch (e: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleGenerateConsensus = async () => {
    setGeneratingConsensus(true);
    try {
      const profile = await generateCharacterizationConsensus(student.id);
      setConsensusProfile(profile);
      setActiveTab('consensus');
      toast.success('¡Consenso 360° generado con éxito!');
    } catch (e: any) {
      toast.error(e.message || 'Error al generar consenso');
    } finally {
      setGeneratingConsensus(false);
    }
  };

  const handleCopyConsensusText = () => {
    if (!consensusProfile) return;
    const text = `CARACTERIZACIÓN HOLÍSTICA 360° • ${student.full_name}\n\n` +
      `Participantes: ${consensusProfile.participatingAuthors}\n\n` +
      `CONSENSO DEL EQUIPO:\n${consensusProfile.overallConsensus}\n\n` +
      `AUTONOMÍA & AMBIENTE:\n${consensusProfile.independenceSynthesis}\n\n` +
      `GRACIA & RELACIONES SOCIALES:\n${consensusProfile.socialGraceSynthesis}\n\n` +
      `CONCENTRACIÓN & TRABAJO:\n${consensusProfile.focusSynthesis}\n\n` +
      `INTERESES & TALENTOS:\n${consensusProfile.interestsSynthesis}\n\n` +
      `ANÉCDOTAS REVELADORAS:\n${consensusProfile.anecdotesSummary}\n\n` +
      `ESTRATEGIA PEDAGÓGICA:\n${consensusProfile.pedagogicalStrategy}`;

    navigator.clipboard.writeText(text);
    setCopiedConsensus(true);
    toast.success('Consenso copiado al portapapeles');
    setTimeout(() => setCopiedConsensus(false), 2000);
  };

  return (
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
      title={`Mirada del Equipo • ${student.full_name}`}
      description="Cómo las guías y el personal ven su autonomía, convivencia y talentos en el colegio."
      footer={
        <div className="flex items-center justify-between w-full">
          {isStaff && (
            <button
              type="button"
              onClick={() => onOpenCreate(student)}
              className="w-full sm:w-auto px-4 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar mi Observación</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex px-6 py-2.5 bg-cream hover:bg-cream/80 text-forest border border-forest/20 rounded-xl text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Global Dimension Averages Card */}
        {data && data.totalEntries > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-forest/10 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Promedio General (Escala 1 al 5)</span>
              </span>
              <span className="text-xs font-bold font-mono text-forest px-2.5 py-0.5 rounded-lg bg-cream border border-forest/10 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{data.averageDimensions.overallAverage} / 5.0</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                <span className="text-[10px] uppercase font-bold text-emerald-900 flex items-center gap-1">
                  <TreePine className="w-3 h-3 text-emerald-700" />
                  <span>Autonomía</span>
                </span>
                <strong className="text-emerald-950 text-base font-bold font-mono mt-0.5 block">
                  {data.averageDimensions.independence} <span className="text-xs font-normal text-emerald-700">/ 5</span>
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-pink-50/60 border border-pink-200/80">
                <span className="text-[10px] uppercase font-bold text-pink-900 flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3 text-pink-700" />
                  <span>Convivencia</span>
                </span>
                <strong className="text-pink-950 text-base font-bold font-mono mt-0.5 block">
                  {data.averageDimensions.socialGrace} <span className="text-xs font-normal text-pink-700">/ 5</span>
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
                <span className="text-[10px] uppercase font-bold text-indigo-900 flex items-center gap-1">
                  <Target className="w-3 h-3 text-indigo-700" />
                  <span>Concentración</span>
                </span>
                <strong className="text-indigo-950 text-base font-bold font-mono mt-0.5 block">
                  {data.averageDimensions.focusRegulation} <span className="text-xs font-normal text-indigo-700">/ 5</span>
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>Curiosidad</span>
                </span>
                <strong className="text-amber-950 text-base font-bold font-mono mt-0.5 block">
                  {data.averageDimensions.curiosityEngagement} <span className="text-xs font-normal text-amber-700">/ 5</span>
                </strong>
              </div>
            </div>

            {/* Contributing Role Breakdown Badges */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="text-[11px] text-muted-foreground font-bold uppercase self-center mr-1">
                Participaron:
              </span>
              {data.roleBreakdown.map((rb, idx) => {
                const cfg = ROLE_CONFIG[rb.role] || { label: rb.role, bg: 'bg-forest/5', text: 'text-forest', border: 'border-forest/10', icon: User };
                const IconComp = cfg.icon;
                return (
                  <span key={idx} className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span>{cfg.label} ({rb.count}): <strong>{rb.authors.join(', ')}</strong></span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="border-b border-forest/10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('consensus')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'consensus'
                ? 'border-forest text-forest bg-forest/5'
                : 'border-transparent text-muted-foreground hover:text-forest'
              }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Resumen del Equipo {consensusProfile && '✓'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'matrix'
                ? 'border-forest text-forest bg-forest/5'
                : 'border-transparent text-muted-foreground hover:text-forest'
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>Notas Individuales ({data?.entries.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: SIDE-BY-SIDE PERSPECTIVE MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 animate-in fade-in">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                Cargando matriz comparativa del equipo...
              </div>
            ) : !data || data.entries.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-forest/10 shadow-2xs space-y-3">
                <Users className="w-10 h-10 text-forest/30 mx-auto" />
                <h4 className="font-bold text-forest text-sm font-display">
                  Aún no hay caracterizaciones registradas
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  La Guía Titular, Guía Asistente, Personal de Apoyo (comedor/limpieza) o Especialistas pueden registrar cómo observan a {student.full_name} en distintos entornos.
                </p>
                {isStaff && (
                  <button
                    type="button"
                    onClick={() => onOpenCreate(student)}
                    className="mt-2 px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar la Primera Caracterización</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col space-y-4 w-full">
                {data.entries.map((entry) => {
                  const cfg = ROLE_CONFIG[entry.authorRole] || { label: entry.authorRole, bg: 'bg-forest/5', text: 'text-forest', border: 'border-forest/10', icon: User };
                  const IconComp = cfg.icon;

                  return (
                    <div
                      key={entry.id}
                      className="w-full p-5 rounded-3xl bg-white border border-forest/10 shadow-2xs space-y-4 transition-all hover:shadow-xs"
                    >
                      {/* 1. Header: Author, Role, Space & Dimension Scores + Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest/10 pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border} ${cfg.text} shadow-2xs`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-forest font-bold text-sm font-display">{entry.authorName}</strong>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-forest/60 shrink-0" />
                                <span>{AREA_LABELS[entry.contextArea] || entry.contextArea}</span>
                              </span>
                              <span>•</span>
                              <span className="font-mono flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                <span>{new Date(entry.observationDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Scores & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                          {/* Dimension Ratings Quick Bar */}
                          <div className="flex items-center gap-2 bg-cream/40 px-3 py-1.5 rounded-xl border border-forest/5 text-[11px] font-bold">
                            <div title="Autonomía & Cuidado" className="flex items-center gap-1 text-emerald-800">
                              <TreePine className="w-3.5 h-3.5" />
                              <span className="font-mono">{entry.independenceLevel}/5</span>
                            </div>
                            <span className="text-forest/20">|</span>
                            <div title="Gracia & Cortesía" className="flex items-center gap-1 text-pink-800">
                              <HeartHandshake className="w-3.5 h-3.5" />
                              <span className="font-mono">{entry.socialGraceLevel}/5</span>
                            </div>
                            <span className="text-forest/20">|</span>
                            <div title="Concentración & Regulación" className="flex items-center gap-1 text-indigo-800">
                              <Target className="w-3.5 h-3.5" />
                              <span className="font-mono">{entry.focusRegulationLevel}/5</span>
                            </div>
                            <span className="text-forest/20">|</span>
                            <div title="Curiosidad & Pasión" className="flex items-center gap-1 text-amber-800">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="font-mono">{entry.curiosityEngagementLevel}/5</span>
                            </div>
                          </div>

                          {/* Staff Actions */}
                          {isStaff && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenEdit(entry)}
                                className="p-2 text-muted-foreground hover:text-forest rounded-xl hover:bg-forest/5 transition-all cursor-pointer"
                                title="Editar observación"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry.id, entry.authorName)}
                                className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 transition-all cursor-pointer"
                                title="Eliminar observación"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Qualitative Notes Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {entry.autonomyCareNotes && (
                          <div className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100/80 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-900 flex items-center gap-1">
                              <TreePine className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Autonomía & Cuidado:</span>
                            </span>
                            <p className="text-emerald-950 text-[11px] leading-relaxed">
                              {entry.autonomyCareNotes}
                            </p>
                          </div>
                        )}

                        {entry.socialGraceNotes && (
                          <div className="p-3 rounded-2xl bg-amber-50/40 border border-amber-100/80 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1">
                              <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                              <span>Convivencia & Comunidad:</span>
                            </span>
                            <p className="text-amber-950 text-[11px] leading-relaxed">
                              {entry.socialGraceNotes}
                            </p>
                          </div>
                        )}

                        {entry.interestsPassionsNotes && (
                          <div className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100/80 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-purple-900 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                              <span>Intereses & Concentración:</span>
                            </span>
                            <p className="text-purple-950 text-[11px] leading-relaxed">
                              {entry.interestsPassionsNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 3. Anecdote Highlight Box (Full Width) */}
                      {entry.anecdoteHighlight && (
                        <div className="p-3.5 rounded-2xl bg-cream/70 border border-forest/10 font-serif italic text-xs text-forest/90 leading-relaxed flex items-start gap-2.5 shadow-2xs">
                          <Quote className="w-4 h-4 text-forest/40 shrink-0 mt-0.5" />
                          <span>"{entry.anecdoteHighlight}"</span>
                        </div>
                      )}

                      {/* 4. Tags Footer */}
                      {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-forest/5">
                          {entry.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-lg bg-forest/5 text-forest border border-forest/10">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI CONSENSUS SYNTHESIS & INTEGRAL PROFILE */}
        {activeTab === 'consensus' && (
          <div className="space-y-4 animate-in fade-in">
            {!consensusProfile ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-forest/10 shadow-2xs space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto shadow-2xs border border-purple-200">
                  <BrainCircuit className="w-8 h-8 text-purple-700" />
                </div>
                <h4 className="font-bold text-forest text-base font-display">
                  Sintetizar Consenso Multirrol del Niño
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  El Asistente IA analiza y combina todas las observaciones (Guías, Asistentes, Personal de Apoyo y Especialistas) para generar un perfil armónico y equilibrado de {student.full_name}.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateConsensus}
                  disabled={generatingConsensus || !data?.totalEntries}
                  className="px-6 py-3 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-2xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{generatingConsensus ? 'Analizando Observaciones...' : 'Generar Perfil Consensuado'}</span>
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-white border border-purple-200 shadow-sm space-y-5">

                {/* Consensus Top Banner */}
                <div className="flex items-start justify-between gap-4 border-b border-forest/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h4 className="font-bold text-forest text-base font-display">
                        {consensusProfile.title}
                      </h4>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      Perspectivas integradas: <strong>{consensusProfile.contributingRoles}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isStaff && (
                      <button
                        type="button"
                        onClick={handleGenerateConsensus}
                        disabled={generatingConsensus || !data?.totalEntries}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-amber-300" />
                        <span>{generatingConsensus ? 'Actualizando...' : '↻ Actualizar'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyConsensusText}
                      className="px-3.5 py-1.5 bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      {copiedConsensus ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedConsensus ? 'Copiado' : 'Copiar Síntesis'}</span>
                    </button>
                  </div>
                </div>

                {/* Overall Consensus Narrative */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-150 text-xs leading-relaxed text-purple-950 font-medium">
                  {consensusProfile.overallConsensus}
                </div>

                {/* 4 Dimension Consensus Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
                    <strong className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
                      <TreePine className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Autonomía & Cuidado del Entorno</span>
                    </strong>
                    <p className="text-emerald-900 leading-relaxed text-[11px] pt-1">
                      {consensusProfile.independenceSynthesis}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                    <strong className="text-amber-950 font-bold text-xs flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                      <span>Gracia, Cortesía & Vida Comunitaria</span>
                    </strong>
                    <p className="text-amber-900 leading-relaxed text-[11px] pt-1">
                      {consensusProfile.socialGraceSynthesis}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-1">
                    <strong className="text-purple-950 font-bold text-xs flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-purple-700" />
                      <span>Concentración & Autorregulación</span>
                    </strong>
                    <p className="text-purple-900 leading-relaxed text-[11px] pt-1">
                      {consensusProfile.focusSynthesis}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-1">
                    <strong className="text-sky-950 font-bold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                      <span>Intereses Espontáneos & Pasiones</span>
                    </strong>
                    <p className="text-sky-900 leading-relaxed text-[11px] pt-1">
                      {consensusProfile.interestsSynthesis}
                    </p>
                  </div>
                </div>

                {/* Anecdotes & Strategy */}
                <div className="p-4 rounded-2xl bg-cream/70 border border-forest/10 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Anécdotas y Momentos de la Comunidad</span>
                  </span>
                  <div className="whitespace-pre-line text-forest/90 italic font-serif text-[11px] leading-relaxed">
                    {consensusProfile.anecdotesSummary}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-forest" />
                    <span>Estrategia Pedagógica Compartida</span>
                  </span>
                  <p className="text-forest/90 font-medium leading-relaxed">
                    {consensusProfile.pedagogicalStrategy}
                  </p>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </SlideOverDrawer>
  );
};

export default StudentCharacterizationMatrixDrawer;
