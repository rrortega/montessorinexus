import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Save,
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
  Compass,
  BookOpen,
  Check,
  ShieldCheck,
  Clock,
  Pencil,
  Trash2,
  HelpCircle,
  Sliders
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
  AssessmentScaleItem,
  AssessmentDisplayMode,
  AssessmentSettings,
  DEFAULT_ASSESSMENT_SCALES,
  getAssessmentSettings,
  saveAssessmentSettings
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// MONTESSORI COMPASS PROGRESSION GLYPHS
const MontessoriSlash: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="7" y1="17" x2="17" y2="7" />
  </svg>
);

const MontessoriCaret: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 15 12 7 18 15" />
  </svg>
);

const MontessoriTriangleOutline: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 4 20 19 4 19" />
  </svg>
);

const MontessoriTriangleFilled: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
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

const COLOR_PRESETS = [
  '#f59e0b', // Amber
  '#ea580c', // Orange
  '#10b981', // Emerald
  '#0284c7', // Sky
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#e11d48', // Rose
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#64748b'  // Slate
];

export const AssessmentScalesSection: React.FC = () => {
  const { role } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN' || !role;

  const [scales, setScales] = useState<any[]>(DEFAULT_ASSESSMENT_SCALES);
  const [displayMode, setDisplayMode] = useState<AssessmentDisplayMode>('circles');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Drawer modal state for scale item
  const [scaleDrawerOpen, setScaleDrawerOpen] = useState(false);
  const [editingScaleId, setEditingScaleId] = useState<string | null>(null);
  const [scaleCode, setScaleCode] = useState('');
  const [scaleLabel, setScaleLabel] = useState('');
  const [scaleAcronym, setScaleAcronym] = useState('');
  const [scaleColor, setScaleColor] = useState('#10b981');
  const [scaleIcon, setScaleIcon] = useState('CheckCircle2');
  const [scaleDescription, setScaleDescription] = useState('');

  // Delete Confirm Dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string;
    label: string;
  }>({ isOpen: false, id: '', label: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAssessmentSettings();
      if (data.scales && data.scales.length > 0) {
        setScales(data.scales);
      }
      if (data.displayMode) {
        setDisplayMode(data.displayMode);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar configuración de evaluadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAll = async (newScales: AssessmentScaleItem[], newMode: AssessmentDisplayMode) => {
    setSavingSettings(true);
    try {
      const payload: AssessmentSettings = {
        scales: newScales,
        displayMode: newMode
      };
      await saveAssessmentSettings(payload);
      setScales(newScales);
      setDisplayMode(newMode);
      toast.success('Configuración de evaluadores guardada exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar configuración');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDisplayModeChange = (mode: AssessmentDisplayMode) => {
    setDisplayMode(mode);
    handleSaveAll(scales, mode);
  };

  const handleOpenAdd = () => {
    if (!isOwnerOrAdmin) return;
    setEditingScaleId(null);
    setScaleCode('');
    setScaleLabel('');
    setScaleAcronym('');
    setScaleColor('#10b981');
    setScaleIcon('CheckCircle2');
    setScaleDescription('');
    setScaleDrawerOpen(true);
  };

  const handleOpenEdit = (scale: AssessmentScaleItem) => {
    if (!isOwnerOrAdmin) return;
    setEditingScaleId(scale.id);
    setScaleCode(scale.code);
    setScaleLabel(scale.label);
    setScaleAcronym(scale.acronym);
    setScaleColor(scale.color);
    setScaleIcon(scale.icon);
    setScaleDescription(scale.description || '');
    setScaleDrawerOpen(true);
  };

  const handleSaveScaleDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = scaleLabel.trim();
    const trimmedAcronym = scaleAcronym.trim();

    if (!trimmedLabel || !trimmedAcronym) {
      toast.error('Nombre y sigla son obligatorios');
      return;
    }

    const words = trimmedLabel.split(/\s+/).filter(Boolean);
    if (words.length > 2) {
      toast.error('El nombre no puede tener más de una palabra y un artículo (máximo 2 palabras).');
      return;
    }

    const code = scaleCode.trim().toUpperCase().replace(/\s+/g, '_') || trimmedAcronym.toUpperCase();

    let updated: AssessmentScaleItem[] = [];
    if (editingScaleId) {
      updated = scales.map(s => {
        if (s.id === editingScaleId) {
          return {
            ...s,
            code,
            label: scaleLabel.trim(),
            acronym: scaleAcronym.trim().toUpperCase(),
            color: scaleColor,
            icon: scaleIcon,
            description: scaleDescription.trim()
          };
        }
        return s;
      });
    } else {
      const newItem: AssessmentScaleItem = {
        id: `scale_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        code,
        label: scaleLabel.trim(),
        acronym: scaleAcronym.trim().toUpperCase(),
        color: scaleColor,
        icon: scaleIcon,
        description: scaleDescription.trim(),
        isDefault: false,
        order: scales.length + 1
      };
      updated = [...scales, newItem];
    }

    setScaleDrawerOpen(false);
    handleSaveAll(updated, displayMode);
  };

  const handleExecuteDelete = () => {
    if (!confirmDelete.id || !isOwnerOrAdmin) return;
    const updated = scales.filter(s => s.id !== confirmDelete.id);
    handleSaveAll(updated, displayMode);
  };

  // Helper render for evaluator visual item based on active displayMode
  const renderEvaluatorVisual = (scale?: AssessmentScaleItem | null) => {
    if (!scale) {
      return (
        <div className="w-7 h-7 rounded-full bg-forest/10 border border-forest/20 animate-pulse" />
      );
    }

    const IconComponent = (scale.icon && ICON_MAP[scale.icon]) ? ICON_MAP[scale.icon] : Sparkles;

    switch (displayMode) {
      case 'circles':
        return (
          <div
            className="w-7 h-7 rounded-full shadow-2xs flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: scale.color }}
            title={`${scale.label} (${scale.acronym})`}
          />
        );
      case 'letters':
        return (
          <span
            className="font-mono font-black text-sm tracking-tight inline-flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ color: scale.color }}
            title={`${scale.label} (${scale.acronym})`}
          >
            {scale.acronym}
          </span>
        );
      case 'icons':
        return (
          <span
            className="inline-flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ color: scale.color }}
            title={scale.label}
          >
            <IconComponent className="w-5 h-5 stroke-[2.5]" />
          </span>
        );
      case 'badges':
        return (
          <div
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 text-white shadow-2xs"
            style={{ backgroundColor: scale.color }}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span>{scale.label}</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300 pb-16">

      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                  Evaluadores & Rúbricas de Progreso
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {scales.length} estados pedagógicos
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Define cómo se evalúan y representan visualmente las presentaciones de lecciones y el avance curricular Montessori.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DISPLAY MODE SELECTOR BOX */}
      <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest/10 pb-4">
          <div className="space-y-0.5">
            <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-forest" />
              <span>Formato de Representación Visual en Matriz de Avances</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Elige cómo deben visualizar las guías y administradores el estado pedagógico en las tablas de seguimiento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'circles' as AssessmentDisplayMode,
              title: 'Círculos de color',
              renderVisual: () => (
                <div className="w-5 h-5 rounded-full bg-forest shadow-2xs shrink-0" />
              )
            },
            {
              id: 'letters' as AssessmentDisplayMode,
              title: 'Letras / Acrónimos',
              renderVisual: () => (
                <span className="font-mono font-black text-base text-forest shrink-0">
                  A
                </span>
              )
            },
            {
              id: 'icons' as AssessmentDisplayMode,
              title: 'Íconos temáticos',
              renderVisual: () => (
                <Sparkles className="w-5 h-5 text-forest shrink-0 stroke-[2.5]" />
              )
            },
            {
              id: 'badges' as AssessmentDisplayMode,
              title: 'Etiquetas (Badges)',
              renderVisual: () => (
                <span className="px-2.5 py-1 rounded-xl bg-forest text-white text-[11px] font-bold shadow-2xs flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-3 h-3" />
                  <span>Badge</span>
                </span>
              )
            }
          ].map(opt => {
            const isSelected = displayMode === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleDisplayModeChange(opt.id)}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                  ? 'border-forest bg-forest/5 shadow-2xs'
                  : 'border-forest/10 bg-white hover:border-forest/30 hover:bg-forest/5'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-forest bg-forest' : 'border-forest/30 bg-white'
                      }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-xs truncate ${isSelected ? 'font-bold text-forest' : 'font-medium text-forest/80'}`}>
                    {opt.title}
                  </span>
                </div>

                {opt.renderVisual()}
              </div>
            );
          })}
        </div>
      </div>

      {/* LIVE SIMULATION MATRIX PREVIEW */}
      <div className="bg-cream/40 rounded-3xl p-6 border border-forest/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-forest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Simulación en Vivo de la Matriz Curricular</span>
          </span>
          <span className="text-[10px] text-muted-foreground italic">
            Visualización con formato: <strong>{displayMode.toUpperCase()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto bg-white rounded-2xl border border-forest/10 p-3 shadow-2xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-forest/10 text-muted-foreground text-[10px] uppercase">
                <th className="p-2 text-left">Alumno</th>
                <th className="p-2 text-center">Torre Rosa</th>
                <th className="p-2 text-center">Escalera Marrón</th>
                <th className="p-2 text-center">Cilindros c/ Botón</th>
                <th className="p-2 text-center">Letras de Lija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/5">
              {[
                { name: 'Mateo Morales', s: [scales[2] || scales[0] || DEFAULT_ASSESSMENT_SCALES[2], scales[1] || scales[0] || DEFAULT_ASSESSMENT_SCALES[1], scales[0] || DEFAULT_ASSESSMENT_SCALES[0], scales[3] || scales[0] || DEFAULT_ASSESSMENT_SCALES[3]] },
                { name: 'Lucía Fernández', s: [scales[2] || scales[0] || DEFAULT_ASSESSMENT_SCALES[2], scales[2] || scales[0] || DEFAULT_ASSESSMENT_SCALES[2], scales[1] || scales[0] || DEFAULT_ASSESSMENT_SCALES[1], scales[0] || DEFAULT_ASSESSMENT_SCALES[0]] },
                { name: 'Santiago Ramos', s: [scales[0] || DEFAULT_ASSESSMENT_SCALES[0], scales[3] || scales[0] || DEFAULT_ASSESSMENT_SCALES[3], scales[0] || DEFAULT_ASSESSMENT_SCALES[0], scales[1] || scales[0] || DEFAULT_ASSESSMENT_SCALES[1]] },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-forest/5">
                  <td className="p-2 font-semibold text-forest">{row.name}</td>
                  {row.s.map((scale, sIdx) => (
                    <td key={sIdx} className="p-2 text-center">
                      <div className="flex justify-center items-center">
                        {renderEvaluatorVisual(scale)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EVALUATORS CATALOGUE (CARDS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-forest uppercase tracking-wider">
            Escalas Pedagógicas Configuradas ({scales.length})
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Cargando escalas pedagógicas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scales.map((scale) => {
              const IconComponent = ICON_MAP[scale.icon] || Sparkles;
              return (
                <div
                  key={scale.id}
                  className="p-5 rounded-3xl bg-white/95 border border-forest/10 shadow-xs hover:border-forest/30 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: scale.color }}
                        >
                          <IconComponent className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-forest text-sm sm:text-base leading-snug truncate">
                            {scale.label}
                          </h4>
                          <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                            Acrónimo: <strong className="text-forest">{scale.acronym}</strong>
                          </span>
                        </div>
                      </div>

                      {isOwnerOrAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(scale)}
                            className="p-1.5 text-forest/70 hover:text-forest hover:bg-forest/10 rounded-xl transition-colors cursor-pointer"
                            title="Editar evaluador"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!scale.isDefault && (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete({ isOpen: true, id: scale.id, label: scale.label })}
                              className="p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                              title="Eliminar evaluador"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {scale.description || 'Sin descripción pedagógica.'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-forest/10 flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-[11px] text-muted-foreground truncate">
                      Código: <code className="text-forest font-bold">{scale.code}</code>
                    </span>
                    {scale.isDefault && (
                      <span className="text-[10px] bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-bold shrink-0">
                        Por defecto
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* DASHED BORDER CARD FOR ADDING A NEW SCALE */}
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="p-6 min-h-[160px] rounded-3xl border-2 border-dashed border-forest/25 hover:border-forest hover:bg-forest/5 transition-all flex flex-col items-center justify-center gap-2.5 group cursor-pointer text-forest/60 hover:text-forest shadow-2xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-forest/10 group-hover:bg-forest group-hover:text-white text-forest flex items-center justify-center transition-all shadow-2xs group-hover:scale-105">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="text-center space-y-0.5">
                  <span className="font-bold text-xs sm:text-sm text-forest block">
                    Agregar Estado
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Nueva escala o nivel de logro
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* DRAWER FOR CREATING / EDITING EVALUATOR SCALE */}
      <SlideOverDrawer
        isOpen={scaleDrawerOpen}
        onClose={() => setScaleDrawerOpen(false)}
        title={editingScaleId ? 'Editar Estado de Logro' : 'Nuevo Estado de Logro'}
        description="Personaliza el nombre, acrónimo, color e ícono del evaluador pedagógico."
        icon={<Target className="w-5 h-5 text-forest" />}
      >
        <form onSubmit={handleSaveScaleDrawer} className="space-y-4 p-4 text-xs font-body">
          <div className="space-y-1.5">
            <label className="block text-forest font-bold">
              Nombre del Estado / Rúbrica <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={scaleLabel}
              onChange={(e) => setScaleLabel(e.target.value)}
              placeholder="Ej. Presentado, En Práctica, Dominado, Refuerzo"
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest font-semibold"
            />
            <p className="text-[10px] text-muted-foreground">
              Máximo una palabra y un artículo (ej: <em>"Presentado"</em>, <em>"En Práctica"</em>, <em>"Dominado"</em>, <em>"Refuerzo"</em>).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-forest font-bold">
                Acrónimo / Sigla <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={scaleAcronym}
                onChange={(e) => setScaleAcronym(e.target.value)}
                placeholder="Ej. P, PR, D, R, EO"
                className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono font-bold shadow-2xs uppercase focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-forest font-bold">Código Identificador</label>
              <input
                type="text"
                value={scaleCode}
                onChange={(e) => setScaleCode(e.target.value)}
                placeholder="Ej. PRESENTED, MASTERED"
                className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono shadow-2xs uppercase focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
          </div>

          {/* COLOR SELECTOR & PALETTE */}
          <div className="space-y-2">
            <label className="block text-forest font-bold">Color Representativo</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={scaleColor}
                onChange={(e) => setScaleColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-forest/20 p-0.5 bg-white"
              />
              <span className="font-mono text-xs font-bold text-forest">{scaleColor}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setScaleColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${scaleColor === color ? 'scale-125 border-forest shadow-2xs' : 'border-transparent hover:scale-110'
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* ICON PICKER */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-forest font-bold">
                Símbolos de Progreso Estandarizados
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'MontessoriSlash', label: 'Introducido (/)' },
                  { key: 'MontessoriCaret', label: 'En Práctica (∧)' },
                  { key: 'MontessoriTriangleOutline', label: 'Dominado (△)' },
                  { key: 'MontessoriTriangleFilled', label: 'Superior (▲)' }
                ].map((item) => {
                  const Icon = ICON_MAP[item.key];
                  const isSelected = scaleIcon === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setScaleIcon(item.key)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${isSelected
                        ? 'border-forest bg-forest text-white shadow-2xs scale-105 font-bold'
                        : 'border-forest/20 bg-forest/5 text-forest hover:bg-forest/10'
                        }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5 stroke-[2.5]" />
                      <span className="text-[9px] truncate max-w-full">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-forest font-bold text-[11px] text-muted-foreground">
                Otros Íconos Temáticos
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {Object.keys(ICON_MAP)
                  .filter(k => !k.startsWith('Montessori'))
                  .map((iconKey) => {
                    const Icon = ICON_MAP[iconKey];
                    const isSelected = scaleIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setScaleIcon(iconKey)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
                          ? 'border-forest bg-forest text-white shadow-2xs scale-105'
                          : 'border-forest/10 bg-white text-forest/70 hover:bg-forest/5'
                          }`}
                        title={iconKey}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Descripción Pedagógica / Criterio de Logro</label>
            <textarea
              rows={3}
              value={scaleDescription}
              onChange={(e) => setScaleDescription(e.target.value)}
              placeholder="Explica qué significa para el alumno estar en este estado de la presentación..."
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-forest/10">
            <button
              type="button"
              onClick={() => setScaleDrawerOpen(false)}
              className="px-4 py-2 text-forest/70 hover:bg-forest/5 rounded-xl font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {savingSettings ? 'Guardando...' : editingScaleId ? 'Guardar Cambios' : 'Crear Evaluador'}
            </button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={confirmDelete.isOpen}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, isOpen: open }))}
        title="¿Eliminar evaluador pedagógico?"
        description={`¿Estás seguro de que deseas eliminar "${confirmDelete.label}"?`}
        confirmText="Sí, Eliminar"
        variant="destructive"
        onConfirm={handleExecuteDelete}
      />

    </div>
  );
};
