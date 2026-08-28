import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import {
  Plus,
  Search,
  Camera,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Filter,
  Eye,
  RotateCcw,
  BookOpen,
  SlidersHorizontal,
  Package,
  Zap,
  Award,
  Leaf,
  Palette,
  Calculator,
  Globe,
  AlertTriangle
} from 'lucide-react';
import {
  EnvironmentMaterialItem,
  getEnvironmentMaterials,
  saveEnvironmentMaterial,
  deleteEnvironmentMaterial,
  uploadFile,
  EnvironmentItem
} from '@/lib/sqlite';
import { toast } from 'sonner';

const MONTESSORI_AREAS = [
  { id: 'Vida Práctica', name: 'Vida Práctica', color: '#10b981', icon: Leaf },
  { id: 'Sensorial', name: 'Sensorial', color: '#ec4899', icon: Palette },
  { id: 'Lenguaje', name: 'Lenguaje', color: '#3b82f6', icon: BookOpen },
  { id: 'Matemáticas', name: 'Matemáticas', color: '#f59e0b', icon: Calculator },
  { id: 'Estudios Cósmicos & Ciencias', name: 'Estudios Cósmicos', color: '#8b5cf6', icon: Globe }
];

const SUGGESTED_SKILLS = [
  'Concentración profunda',
  'Control motor fino',
  'Discriminación visual de tamaño y volumen',
  'Coordinación óculo-manual',
  'Autonomía e independencia',
  'Preparación indirecta para la escritura',
  'Preparación indirecta para las matemáticas',
  'Pensamiento lógico-secuencial',
  'Discriminación táctil y térmica',
  'Discriminación auditiva',
  'Autocorrección del error',
  'Cuidado del ambiente y orden',
  'Gracia y cortesía social',
  'Sentido estereognóstico',
  'Conciencia fonológica',
  'Comprensión del sistema decimal'
];

const AREA_CATEGORIES: Record<string, string[]> = {
  'Vida Práctica': [
    'Cuidado de la Persona',
    'Cuidado del Ambiente',
    'Gracia y Cortesía',
    'Control del Movimiento'
  ],
  'Sensorial': [
    'Sentido Visual',
    'Sentido Táctil y Térmico',
    'Sentido Auditivo',
    'Sentido Gustativo y Olfativo',
    'Geometría Sensorial'
  ],
  'Lenguaje': [
    'Enriquecimiento de Vocabulario',
    'Preparación para la Escritura',
    'Alfabeto y Fonemas',
    'Lectura y Comprensión'
  ],
  'Matemáticas': [
    'Introducción al Conteo (1-10)',
    'Sistema Decimal',
    'Operaciones y Tablas',
    'Cadenas y Potencias',
    'Fracciones'
  ],
  'Estudios Cósmicos & Ciencias': [
    'Geografía y Tierra',
    'Biología y Botánica',
    'Zoología y Anatomía',
    'Historia y Tiempo Cósmico',
    'Física y Astronomía'
  ]
};

interface EnvironmentMaterialsManagerProps {
  environment: EnvironmentItem;
  onMaterialsChange?: () => void;
}

export const EnvironmentMaterialsManager: React.FC<EnvironmentMaterialsManagerProps> = ({
  environment,
  onMaterialsChange
}) => {
  const [materials, setMaterials] = useState<EnvironmentMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<EnvironmentMaterialItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formAreaName, setFormAreaName] = useState('Sensorial');
  const [formCategoryName, setFormCategoryName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPedagogicalPurpose, setFormPedagogicalPurpose] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Camera Live Capture State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Photo Zoom Lightbox
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Custom Delete Confirmation Modal State
  const [materialToDelete, setMaterialToDelete] = useState<EnvironmentMaterialItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await getEnvironmentMaterials(environment.id);
      setMaterials(data);
    } catch (e) {
      toast.error('Error al cargar materiales del salón');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [environment.id]);

  // Clean up camera stream when unmounting or closing
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.categoryName && m.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.skillsDeveloped && m.skillsDeveloped.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesArea =
        selectedAreaFilter === 'all' ||
        m.areaName.toLowerCase().includes(selectedAreaFilter.toLowerCase()) ||
        selectedAreaFilter.toLowerCase().includes(m.areaName.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && m.isActive) ||
        (statusFilter === 'inactive' && !m.isActive);

      return matchesSearch && matchesArea && matchesStatus;
    });
  }, [materials, searchQuery, selectedAreaFilter, statusFilter]);

  // Counts
  const activeCount = useMemo(() => materials.filter(m => m.isActive).length, [materials]);
  const inactiveCount = useMemo(() => materials.filter(m => !m.isActive).length, [materials]);

  // Handle open create
  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormName('');
    setFormAreaName('Sensorial');
    setFormCategoryName('');
    setFormDescription('');
    setFormPedagogicalPurpose('');
    setFormSkills([]);
    setSkillInput('');
    setFormPhotoUrl('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Handle open edit
  const handleOpenEdit = (material: EnvironmentMaterialItem) => {
    setEditingMaterial(material);
    setFormName(material.name);
    setFormAreaName(material.areaName || 'Sensorial');
    setFormCategoryName(material.categoryName || '');
    setFormDescription(material.description || '');
    setFormPedagogicalPurpose(material.pedagogicalPurpose || '');
    setFormSkills(
      material.skillsDeveloped
        ? material.skillsDeveloped.split(',').map(s => s.trim()).filter(Boolean)
        : []
    );
    setSkillInput('');
    setFormPhotoUrl(material.photoUrl || '');
    setFormIsActive(material.isActive !== false);
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('El nombre del material es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await saveEnvironmentMaterial(environment.id, {
        id: editingMaterial?.id,
        name: formName.trim(),
        areaName: formAreaName,
        categoryName: formCategoryName.trim(),
        description: formDescription.trim(),
        pedagogicalPurpose: formPedagogicalPurpose.trim(),
        skillsDeveloped: formSkills.join(', '),
        photoUrl: formPhotoUrl,
        isActive: formIsActive
      });

      toast.success(
        editingMaterial
          ? `Material "${formName}" actualizado`
          : `Material "${formName}" registrado en ${environment.name}`
      );
      setIsModalOpen(false);
      await loadMaterials();
      onMaterialsChange?.();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar material');
    } finally {
      setSaving(false);
    }
  };

  // Handle Toggle Active Status
  const handleToggleActive = async (material: EnvironmentMaterialItem) => {
    const updatedStatus = !material.isActive;
    try {
      // Optimistic update
      setMaterials(prev =>
        prev.map(m => (m.id === material.id ? { ...m, isActive: updatedStatus } : m))
      );

      await saveEnvironmentMaterial(environment.id, {
        id: material.id,
        name: material.name,
        isActive: updatedStatus
      });

      toast.success(
        updatedStatus
          ? `"${material.name}" marcado como activo en estantería`
          : `"${material.name}" marcado como inactivo / en rotación`
      );
      onMaterialsChange?.();
    } catch (e) {
      toast.error('Error al actualizar estado del material');
      loadMaterials();
    }
  };

  // Handle Custom Delete Confirmation
  const confirmDelete = async () => {
    if (!materialToDelete) return;

    setDeleting(true);
    try {
      await deleteEnvironmentMaterial(environment.id, materialToDelete.id);
      toast.success(`Material "${materialToDelete.name}" eliminado`);
      setMaterialToDelete(null);
      await loadMaterials();
      onMaterialsChange?.();
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar material');
    } finally {
      setDeleting(false);
    }
  };

  // Skills tag helpers
  const handleAddSkill = (skillText: string) => {
    const trimmed = skillText.trim();
    if (trimmed && !formSkills.includes(trimmed)) {
      setFormSkills([...formSkills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormSkills(formSkills.filter(s => s !== skillToRemove));
  };

  // File Upload Helper
  const handleFileUpload = async (file: File) => {
    try {
      const toastId = toast.loading('Subiendo fotografía...');
      const res = await uploadFile(file, 'materials');
      setFormPhotoUrl(res.url);
      toast.dismiss(toastId);
      toast.success('Fotografía cargada con éxito');
    } catch (e) {
      toast.error('Error al subir imagen');
    }
  };

  // CAMERA LIVE SNAPSHOT
  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('No se pudo acceder a la cámara. Por favor permite los permisos o sube una foto.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhotoFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], `material_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      await handleFileUpload(file);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-6">
      {/* Hidden Canvas for Camera Snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER & METRICS BAR */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-white/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest text-white flex items-center justify-center shadow-2xs">
                <Package className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold font-display text-forest tracking-tight">
                Inventario de Materiales del Ambiente
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registra los materiales montessori propios de <strong className="text-forest">{environment.name}</strong>, sus fotos y habilidades desarrolladas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-2xl font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Material</span>
            </button>
          </div>
        </div>

        {/* METRICS & QUICK COUNTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-1">
            <span className="text-[10px] font-bold text-forest/70 uppercase tracking-wider block">
              Total Materiales
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-forest font-mono">{materials.length}</span>
              <Package className="w-4 h-4 text-forest/50" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              En Estantería (Activos)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-emerald-700 font-mono">{activeCount}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              En Rotación / Inactivos
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-slate-700 font-mono">{inactiveCount}</span>
              <RotateCcw className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60 space-y-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Con Fotografía Real
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-amber-700 font-mono">
                {materials.filter(m => !!m.photoUrl).length}
              </span>
              <Camera className="w-4 h-4 text-amber-600" />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-forest/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, habilidad desarrollada o descripción..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-2xl border border-forest/15 focus:outline-none focus:ring-2 focus:ring-forest/20 text-forest placeholder:text-muted-foreground shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Area Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setSelectedAreaFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedAreaFilter === 'all'
                  ? 'bg-forest text-white shadow-2xs scale-[1.02]'
                  : 'bg-white text-forest/70 hover:bg-forest/5 border border-forest/10'
              }`}
            >
              Todas las Áreas
            </button>
            {MONTESSORI_AREAS.map(a => {
              const isSelected = selectedAreaFilter === a.id;
              const AreaIcon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAreaFilter(a.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'text-white shadow-2xs scale-[1.02]'
                      : 'bg-white text-forest/70 hover:bg-forest/5 border border-forest/10'
                  }`}
                  style={{
                    backgroundColor: isSelected ? a.color : undefined
                  }}
                >
                  <AreaIcon className="w-3.5 h-3.5" />
                  <span>{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MATERIALS GRID */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-forest/60 border border-forest/10">
          Cargando inventario de materiales...
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/15 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-forest/10 text-forest mx-auto flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-forest text-base font-display">
              {materials.length === 0
                ? 'No hay materiales registrados en este salón'
                : 'No se encontraron materiales con esos filtros'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {materials.length === 0
                ? 'Comienza registrando los materiales de las estanterías de este ambiente para llevar un seguimiento pedagógico consistente.'
                : 'Intenta cambiar el término de búsqueda o el filtro de área.'}
            </p>
          </div>
          {materials.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-forest text-white rounded-2xl font-bold text-xs shadow-xs hover:bg-forest/90 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Material</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map(mat => {
            const areaConfig = MONTESSORI_AREAS.find(a => a.name === mat.areaName || a.id === mat.areaName) || MONTESSORI_AREAS[0];
            const skillsList = mat.skillsDeveloped
              ? mat.skillsDeveloped.split(',').map(s => s.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={mat.id}
                className={`bg-white rounded-3xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  mat.isActive ? 'border-forest/15' : 'border-slate-200 opacity-75 bg-slate-50/50'
                }`}
              >
                {/* PHOTO & BADGES */}
                <div className="relative h-44 bg-forest/5 border-b border-forest/10 overflow-hidden group">
                  {mat.photoUrl ? (
                    <img
                      src={mat.photoUrl}
                      alt={mat.name}
                      onClick={() => setPreviewPhotoUrl(mat.photoUrl || null)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-forest/40 space-y-1">
                      <ImageIcon className="w-10 h-10 stroke-1" />
                      <span className="text-[11px] font-medium">Sin fotografía asignada</span>
                    </div>
                  )}

                  {/* Area Badge Top Left */}
                  {(() => {
                    const AreaIcon = areaConfig.icon;
                    return (
                      <div
                        className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-white font-bold text-[10px] shadow-xs flex items-center gap-1.5 backdrop-blur-xs"
                        style={{ backgroundColor: areaConfig.color }}
                      >
                        <AreaIcon className="w-3 h-3" />
                        <span>{mat.areaName}</span>
                      </div>
                    );
                  })()}

                  {/* Active / Inactive Status Switch Top Right */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(mat)}
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      mat.isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                    title={mat.isActive ? 'Activo en estantería (clic para desactivar)' : 'Inactivo / En rotación (clic para activar)'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${mat.isActive ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                    <span>{mat.isActive ? 'En Estantería' : 'En Rotación'}</span>
                  </button>
                </div>

                {/* CONTENT */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-forest text-sm sm:text-base font-display leading-snug">
                        {mat.name}
                      </h4>
                    </div>
              {mat.categoryName && (
                      <span className="text-[11px] font-semibold text-muted-foreground block mt-0.5">
                        {mat.categoryName}
                      </span>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  {mat.description && (
                    <p className="text-xs text-forest/80 line-clamp-2 leading-relaxed font-normal">
                      {mat.description}
                    </p>
                  )}

                  {/* PEDAGOGICAL PURPOSE */}
                  {mat.pedagogicalPurpose && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Propósito Pedagógico:</span>
                      </span>
                      <p className="text-[11px] text-amber-950/90 leading-relaxed line-clamp-2">
                        {mat.pedagogicalPurpose}
                      </p>
                    </div>
                  )}

                  {/* SKILLS DEVELOPED */}
                  {skillsList.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-forest/70 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#C4661F]" />
                        <span>Habilidades que Desarrolla:</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {skillsList.map((skill, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-forest/5 text-forest border border-forest/10"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD FOOTER ACTIONS */}
                <div className="p-3 px-4 sm:px-5 bg-forest/5 border-t border-forest/10 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-foreground">
                    Salón: <strong className="text-forest">{environment.name}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(mat)}
                      className="p-1.5 rounded-xl hover:bg-white text-forest/70 hover:text-forest transition-colors cursor-pointer"
                      title="Editar material"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialToDelete(mat)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER LATERAL DERECHO: REGISTRAR O EDITAR MATERIAL */}
      <SlideOverDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Editar Material Montessori' : 'Registrar Material en Salón'}
        description={`Ambiente: ${environment.name}`}
        maxWidthClass="max-w-lg lg:max-w-xl"
        icon={<Package className="w-5 h-5 text-forest" />}
        footer={
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
              className="w-full py-3 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingMaterial ? 'Guardar Cambios' : 'Registrar Material'}</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* PHOTO CAPTURE & UPLOAD */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-forest uppercase tracking-wider block">
              Fotografía del Material en el Salón:
            </label>

            {formPhotoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-forest/15 h-48 bg-forest/5 group">
                <img
                  src={formPhotoUrl}
                  alt="Material preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-xl bg-white text-forest font-bold text-xs shadow-xs flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tomar Otra</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPhotoUrl('')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Live Camera Snapshot Button */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="p-5 rounded-2xl border-2 border-dashed border-forest/30 hover:border-forest hover:bg-forest/5 flex flex-col items-center justify-center text-center group transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-forest mt-2">
                    Tomar Foto con Cámara
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Captura el material en la estantería
                  </span>
                </button>

                {/* File Upload Input */}
                <label className="p-5 rounded-2xl border-2 border-dashed border-forest/30 hover:border-forest hover:bg-forest/5 flex flex-col items-center justify-center text-center group transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-forest mt-2">
                    Subir Archivo de Imagen
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    JPG, PNG, WEBP hasta 20MB
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* NAME */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-forest uppercase tracking-wider block">
              Nombre del Material: <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Ej. Torre Rosa, Cilindros de Sonido, Alfabeto Móvil..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          {/* CUSTOM CHOICE: ÁREA MONTESSORI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-forest uppercase tracking-wider">
              <span>Área Montessori: <span className="text-rose-600">*</span></span>
              <span
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-2xs transition-all"
                style={{
                  backgroundColor:
                    MONTESSORI_AREAS.find(a => a.name === formAreaName || a.id === formAreaName)?.color || '#1b3b2b'
                }}
              >
                {formAreaName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-forest/5 rounded-2xl border border-forest/10">
              {MONTESSORI_AREAS.map(a => {
                const isSelected = formAreaName === a.name || formAreaName === a.id;
                const AreaIcon = a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setFormAreaName(a.name);
                      if (!formCategoryName && AREA_CATEGORIES[a.name]?.[0]) {
                        setFormCategoryName(AREA_CATEGORIES[a.name][0]);
                      }
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'text-white shadow-xs font-bold scale-[1.02]'
                        : 'text-forest/70 hover:text-forest hover:bg-white/70'
                    }`}
                    style={{
                      backgroundColor: isSelected ? a.color : undefined
                    }}
                  >
                    <AreaIcon className="w-4 h-4" />
                    <span className="truncate w-full text-[10px] leading-tight font-bold">
                      {a.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CUSTOM CHOICE: CATEGORÍA / SUB-ÁREA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-forest uppercase tracking-wider">
              <span>Categoría / Sub-Área:</span>
              {formCategoryName && (
                <span className="text-[10px] font-semibold text-muted-foreground truncate max-w-[200px]">
                  {formCategoryName}
                </span>
              )}
            </div>

            {/* Quick Sub-Area Choices */}
            {AREA_CATEGORIES[formAreaName] && (
              <div className="flex flex-wrap gap-1.5">
                {AREA_CATEGORIES[formAreaName].map(catName => {
                  const isSelected = formCategoryName === catName;
                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setFormCategoryName(catName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-forest text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-forest/10 text-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{catName}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              value={formCategoryName}
              onChange={e => setFormCategoryName(e.target.value)}
              placeholder="O escribe una categoría personalizada..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
          </div>

          {/* DESCRIPTION (CARACTERÍSTICAS Y PRESENTACIÓN) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-forest uppercase tracking-wider block">
              Descripción y Presentación:
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Describe las características físicas, componentes y cómo está estructurado el material..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none leading-relaxed"
            />
          </div>

          {/* PEDAGOGICAL PURPOSE (PROPÓSITO PEDAGÓGICO) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-forest uppercase tracking-wider block">
              Propósito Pedagógico (Directo / Indirecto):
            </label>
            <textarea
              rows={2}
              value={formPedagogicalPurpose}
              onChange={e => setFormPedagogicalPurpose(e.target.value)}
              placeholder="Objetivo educativo, preparación indirecta, periodo sensible o propósito Montessori..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none leading-relaxed"
            />
          </div>

          {/* SKILLS DEVELOPED (HABILIDADES QUE DESARROLLA) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-forest uppercase tracking-wider block">
              Habilidades que Desarrolla el Niño:
            </label>

            {/* Input with Add button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(skillInput);
                  }
                }}
                placeholder="Escribe una habilidad y presiona Enter..."
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(skillInput)}
                className="px-4 py-2 bg-forest text-white rounded-2xl text-xs font-bold shadow-2xs hover:bg-forest/90 cursor-pointer"
              >
                Agregar
              </button>
            </div>

            {/* Selected skills chips */}
            {formSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-forest/5 rounded-2xl border border-forest/10">
                {formSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white text-forest text-xs font-semibold border border-forest/15 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-[#C4661F]" />
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-muted-foreground hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested skills quick pills */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-muted-foreground font-semibold block">
                Sugerencias rápidas (clic para añadir):
              </span>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_SKILLS.filter(s => !formSkills.includes(s)).slice(0, 8).map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-forest/10 hover:text-forest text-slate-700 transition-colors cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CUSTOM CHOICE: ACTIVE AVAILABILITY STATE */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-forest uppercase tracking-wider block">
              Disponibilidad en el Salón:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-forest/5 rounded-2xl border border-forest/10">
              <button
                type="button"
                onClick={() => setFormIsActive(true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formIsActive
                    ? 'bg-emerald-600 text-white shadow-xs scale-[1.01]'
                    : 'text-forest/60 hover:text-forest hover:bg-white/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${formIsActive ? 'bg-white animate-pulse' : 'bg-emerald-600'}`} />
                <span>En Estantería (Activo)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormIsActive(false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !formIsActive
                    ? 'bg-slate-700 text-white shadow-xs scale-[1.01]'
                    : 'text-forest/60 hover:text-forest hover:bg-white/60'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>En Rotación / Taller</span>
              </button>
            </div>
          </div>
        </form>
      </SlideOverDrawer>

      {/* LIVE CAMERA CAPTURE MODAL (PORTALED ON TOP OF EVERYTHING) */}
      {isCameraOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        >
          <div className="bg-slate-900 text-white w-full max-w-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm font-display">
                  Tomar Foto del Material en Salón
                </h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center justify-center space-y-4">
              {cameraError ? (
                <div className="p-6 text-center text-rose-300 space-y-2">
                  <p className="text-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-white/20 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reintentar Acceso
                  </button>
                </div>
              ) : (
                <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-white/10">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none" />
                </div>
              )}

              <div className="flex items-center justify-center gap-4 w-full pt-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar Fotografía</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PHOTO LIGHTBOX ZOOM MODAL (PORTALED) */}
      {previewPhotoUrl && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={previewPhotoUrl}
              alt="Material Zoom"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM CONFIRMATION MODAL: ELIMINAR MATERIAL (PORTALED) */}
      {materialToDelete && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-forest/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200/60 shadow-2xs">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold font-display text-forest">
                  ¿Eliminar Material del Salón?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Estás a punto de eliminar el material <strong className="text-forest">«{materialToDelete.name}»</strong> del inventario de <strong>{environment.name}</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200/70 text-[11px] text-rose-950 text-left space-y-1">
                <span className="font-bold text-rose-800 block">Aviso importante:</span>
                <span className="leading-relaxed block">
                  Esta acción quitará el material de las estanterías del ambiente. Los registros y evaluaciones históricas previas de los alumnos se conservarán.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-forest/10 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                disabled={deleting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-forest bg-white hover:bg-slate-100 border border-forest/15 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-98"
              >
                {deleting ? (
                  <span>Eliminando...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Material</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
