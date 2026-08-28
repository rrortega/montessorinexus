import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  BookOpen,
  Layers,
  Clock,
  FileText,
  Trash2,
  AlertCircle,
  HeartHandshake,
  Image,
  Video,
  FileDown,
  Plus,
  Link,
  Upload,
  ExternalLink,
  Lock,
  Users
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import {
  MontessoriAreaItem,
  MontessoriLessonItem,
  LessonMediaAsset,
  saveMontessoriLesson,
  deleteMontessoriLesson
} from '@/lib/sqlite';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';

interface MontessoriLessonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: MontessoriAreaItem[];
  initialLesson?: any | null;
  defaultCategoryId?: string;
  defaultAreaId?: string;
  onSaved: () => void;
}

export const MontessoriLessonDrawer: React.FC<MontessoriLessonDrawerProps> = ({
  isOpen,
  onClose,
  curriculum,
  initialLesson,
  defaultCategoryId,
  defaultAreaId,
  onSaved,
}) => {
  const confirm = useConfirm();

  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [name, setName] = useState('');
  const [pedagogicalPurpose, setPedagogicalPurpose] = useState('');
  const [parentInfo, setParentInfo] = useState('');
  const [description, setDescription] = useState('');
  const [minAgeYears, setMinAgeYears] = useState<string>('3');
  const [maxAgeYears, setMaxAgeYears] = useState<string>('6');
  const [mediaAssets, setMediaAssets] = useState<LessonMediaAsset[]>([]);

  // New Asset input modal / form
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [assetType, setAssetType] = useState<'image' | 'video' | 'document'>('image');
  const [assetTitle, setAssetTitle] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetDescription, setAssetDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available categories for selected area
  const availableCategories = React.useMemo(() => {
    const area = curriculum.find(a => a.id === selectedAreaId);
    return area ? area.categories : [];
  }, [curriculum, selectedAreaId]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialLesson) {
      // Find area of this lesson's category
      let foundAreaId = '';
      for (const area of curriculum) {
        if (area.categories.some(c => c.id === initialLesson.categoryId || c.lessons.some(l => l.id === initialLesson.id))) {
          foundAreaId = area.id;
          break;
        }
      }
      setSelectedAreaId(foundAreaId || curriculum[0]?.id || '');
      setSelectedCategoryId(initialLesson.categoryId || '');
      setName(initialLesson.name || '');
      setPedagogicalPurpose(initialLesson.pedagogicalPurpose || '');
      setParentInfo(initialLesson.parentInfo || '');
      setDescription(initialLesson.description || '');
      setMinAgeYears(initialLesson.minAgeYears?.toString() || '3');
      setMaxAgeYears(initialLesson.maxAgeYears?.toString() || '6');

      // Parse media assets
      if (Array.isArray(initialLesson.mediaAssets)) {
        setMediaAssets(initialLesson.mediaAssets);
      } else if (typeof initialLesson.mediaAssets === 'string') {
        try {
          setMediaAssets(JSON.parse(initialLesson.mediaAssets || '[]'));
        } catch {
          setMediaAssets([]);
        }
      } else {
        setMediaAssets([]);
      }
    } else {
      const areaId = defaultAreaId || curriculum[0]?.id || '';
      setSelectedAreaId(areaId);
      const area = curriculum.find(a => a.id === areaId);
      setSelectedCategoryId(defaultCategoryId || area?.categories[0]?.id || '');
      setName('');
      setPedagogicalPurpose('');
      setParentInfo('');
      setDescription('');
      setMinAgeYears('3');
      setMaxAgeYears('6');
      setMediaAssets([]);
    }

    setIsAddingAsset(false);
    setAssetTitle('');
    setAssetUrl('');
    setAssetDescription('');
  }, [isOpen, initialLesson, defaultAreaId, defaultCategoryId, curriculum]);

  // When area changes, update category selection if invalid
  const handleAreaChange = (newAreaId: string) => {
    setSelectedAreaId(newAreaId);
    const area = curriculum.find(a => a.id === newAreaId);
    if (area && area.categories.length > 0) {
      setSelectedCategoryId(area.categories[0].id);
    } else {
      setSelectedCategoryId('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAssetUrl(base64);
      if (!assetTitle) {
        setAssetTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      toast.success('Archivo cargado exitosamente');
    };
    reader.readAsDataURL(file);
  };

  const handleAddAsset = () => {
    if (!assetTitle.trim() || !assetUrl.trim()) {
      toast.error('Ingresa el título y la URL o archivo del recurso');
      return;
    }

    const newAsset: LessonMediaAsset = {
      id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: assetType,
      title: assetTitle.trim(),
      url: assetUrl.trim(),
      description: assetDescription.trim() || undefined
    };

    setMediaAssets(prev => [...prev, newAsset]);
    setIsAddingAsset(false);
    setAssetTitle('');
    setAssetUrl('');
    setAssetDescription('');
    toast.success('Recurso añadido a la ficha');
  };

  const handleRemoveAsset = (id: string) => {
    setMediaAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Ingresa el nombre de la ficha de trabajo');
      return;
    }
    if (!selectedCategoryId) {
      toast.error('Selecciona una categoría para esta ficha');
      return;
    }

    setSaving(true);
    try {
      await saveMontessoriLesson({
        id: initialLesson?.id,
        categoryId: selectedCategoryId,
        name: name.trim(),
        pedagogicalPurpose: pedagogicalPurpose.trim(),
        parentInfo: parentInfo.trim(),
        mediaAssets: mediaAssets,
        description: description.trim(),
        minAgeYears: minAgeYears ? parseFloat(minAgeYears) : null,
        maxAgeYears: maxAgeYears ? parseFloat(maxAgeYears) : null,
      });

      toast.success(initialLesson ? '¡Ficha de trabajo actualizada!' : '¡Nueva ficha de trabajo creada con éxito!');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la ficha de trabajo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialLesson?.id) return;

    const ok = await confirm({
      title: '¿Eliminar Ficha de Trabajo?',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${initialLesson.name}" del currículum? Se eliminarán los registros asociados de progreso de los alumnos.`,
      confirmText: 'Sí, eliminar ficha',
      cancelText: 'Cancelar',
      variant: 'danger'
    });

    if (!ok) return;

    setDeleting(true);
    try {
      await deleteMontessoriLesson(initialLesson.id);
      toast.success('Ficha de trabajo eliminada del currículum');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar ficha de trabajo');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialLesson ? 'Editar Ficha de Trabajo' : 'Nueva Ficha de Trabajo'}
      description="Personaliza los materiales, propósitos pedagógicos, información para familias y recursos multimedia."
      width="max-w-2xl"
      icon={<BookOpen className="w-5 h-5 text-forest" />}
      footer={
        <div className="w-full space-y-2">
          {initialLesson?.id && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="w-full py-2.5 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>{deleting ? 'Eliminando...' : 'Eliminar Ficha de Trabajo'}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="w-full py-3 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              form="montessori-lesson-form"
              disabled={saving || deleting}
              className="w-full py-3 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : (initialLesson ? 'Guardar Cambios' : 'Crear Ficha')}</span>
            </button>
          </div>
        </div>
      }
    >
      <form id="montessori-lesson-form" onSubmit={handleSave} className="space-y-6">

        {/* 1. ÁREA & CATEGORÍA */}
        <div className="p-5 rounded-3xl bg-forest/5 border border-forest/10 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-forest/10">
            <Layers className="w-4 h-4 text-forest" />
            <h4 className="font-display font-bold text-forest text-xs uppercase tracking-wider">
              Ubicación en el Currículum
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1.5">
                Área Montessori *
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => handleAreaChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-white text-forest text-xs font-bold focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
              >
                {curriculum.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1.5">
                Categoría *
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-white text-forest text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
              >
                {availableCategories.length === 0 ? (
                  <option value="">(Sin categorías en esta área)</option>
                ) : (
                  availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      📂 {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* 2. NOMBRE DE LA FICHA & RANGO DE EDAD */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5">
              Nombre de la Ficha de Trabajo / Presentación *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Torre Rosa, Cilindros con Botón, Lavado de Manos..."
              required
              className="w-full px-4 py-3 rounded-2xl border border-forest/20 text-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest/20 bg-white shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-forest/80 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-forest" />
                <span>Edad Mínima (Años)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="18"
                value={minAgeYears}
                onChange={(e) => setMinAgeYears(e.target.value)}
                placeholder="2.5"
                className="w-full px-3 py-2 rounded-xl border border-forest/20 bg-white text-xs font-bold text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-forest/80 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-forest" />
                <span>Edad Máxima (Años)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="18"
                value={maxAgeYears}
                onChange={(e) => setMaxAgeYears(e.target.value)}
                placeholder="6"
                className="w-full px-3 py-2 rounded-xl border border-forest/20 bg-white text-xs font-bold text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>
          </div>
        </div>

        {/* 3. PROPÓSITO PEDAGÓGICO (EXCLUSIVO PARA GUÍAS / STAFF DOCENTE) */}
        <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider">
                Propósito Pedagógico (Guías & Docentes)
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Solo Guías</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="block text-amber-950 font-bold">
                Propósitos Directos & Indirectos
              </label>
              <textarea
                value={pedagogicalPurpose}
                onChange={(e) => setPedagogicalPurpose(e.target.value)}
                rows={3}
                placeholder="Ej. Discriminación visual de dimensiones 3D, desarrollo de pinza trípode, preparación indirecta para el sistema decimal y refinamiento sensorio-motor..."
                className="w-full p-3 rounded-xl border border-amber-200/80 text-amber-950 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-amber-950 font-bold">
                Materiales & Control de Error (Puntos de Interés)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ej. 10 cubos de madera en gradación cúbica. Control de error: estabilidad física de la torre, orden visual de mayor a menor."
                className="w-full p-3 rounded-xl border border-amber-200/80 text-amber-950 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* 4. INFORMACIÓN PARA PADRES DE FAMILIA (PORTAL FAMILIAR) */}
        <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider">
                Información para Padres de Familia
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              <span>Visible en Portal Familiar</span>
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-[11px] text-emerald-900/80 leading-relaxed">
              Redacta una explicación cálida y comprensible sobre qué desarrolla su hijo con este material y sugerencias para comprenderlo o acompañarlo en casa.
            </p>
            <textarea
              value={parentInfo}
              onChange={(e) => setParentInfo(e.target.value)}
              rows={3}
              placeholder="Ej. Tu hijo está trabajando con la Torre Rosa. Esta actividad ayuda a su mente a comprender tamaños, pesos y equilibrio de forma natural mientras fortalece la coordinación de sus manitas y su capacidad de concentración. En casa puedes invitarlo a ordenar objetos de mayor a menor..."
              className="w-full p-3 rounded-xl border border-emerald-200/80 text-emerald-950 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs"
            />
          </div>
        </div>

        {/* 5. ASSETS & RECURSOS MULTIMEDIA (IMÁGENES, VIDEO, DOCUMENTOS) */}
        <div className="p-5 rounded-3xl bg-white border border-forest/15 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-forest/10 pb-2">
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4 text-forest" />
              <h4 className="font-bold text-forest text-xs uppercase tracking-wider">
                Recursos Multimedia & Guías ({mediaAssets.length})
              </h4>
            </div>

            {!isAddingAsset && (
              <button
                type="button"
                onClick={() => setIsAddingAsset(true)}
                className="px-2.5 py-1 text-xs font-bold text-forest bg-forest/10 hover:bg-forest/20 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Recurso</span>
              </button>
            )}
          </div>

          {/* ADD ASSET FORM */}
          {isAddingAsset && (
            <div className="p-4 rounded-2xl bg-cream/40 border border-forest/20 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-1 border-b border-forest/10">
                <span className="font-bold text-forest text-xs">Nuevo Recurso</span>
                <button
                  type="button"
                  onClick={() => setIsAddingAsset(false)}
                  className="text-muted-foreground hover:text-forest text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image', label: '📸 Imagen / Foto', icon: Image },
                  { id: 'video', label: '🎥 Video Demostrativo', icon: Video },
                  { id: 'document', label: '📄 Documento / PDF', icon: FileDown },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAssetType(opt.id as any)}
                    className={`p-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${assetType === opt.id
                        ? 'bg-forest text-white border-forest shadow-2xs'
                        : 'bg-white text-forest/70 border-forest/15 hover:bg-forest/5'
                      }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="block text-forest font-bold">Título del Recurso *</label>
                  <input
                    type="text"
                    value={assetTitle}
                    onChange={(e) => setAssetTitle(e.target.value)}
                    placeholder="Ej. Foto de la presentación completa, Video paso a paso, Guía descargable PDF"
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-forest font-bold">URL del Recurso o Subida Directa *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={assetUrl}
                      onChange={(e) => setAssetUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o https://drive.google.com/..."
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2.5 bg-forest/10 hover:bg-forest/20 text-forest rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      title="Subir archivo desde el equipo"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-forest font-bold">Descripción Adicional (Opcional)</label>
                  <input
                    type="text"
                    value={assetDescription}
                    onChange={(e) => setAssetDescription(e.target.value)}
                    placeholder="Ej. Recomendado para guías de Casa de Niños..."
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleAddAsset}
                    className="px-4 py-2 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    Guardar Recurso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ASSETS LIST */}
          {mediaAssets.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No hay recursos multimedia adjuntos a esta ficha de trabajo.
            </p>
          ) : (
            <div className="space-y-2">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 rounded-2xl bg-forest/5 border border-forest/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-2 rounded-xl bg-white text-forest shadow-2xs shrink-0">
                      {asset.type === 'image' && <Image className="w-4 h-4" />}
                      {asset.type === 'video' && <Video className="w-4 h-4 text-rose-600" />}
                      {asset.type === 'document' && <FileDown className="w-4 h-4 text-blue-600" />}
                    </span>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <strong className="text-forest font-bold truncate">{asset.title}</strong>
                        <span className="text-[10px] uppercase font-bold text-forest/60 px-1.5 py-0.2 bg-forest/10 rounded">
                          {asset.type}
                        </span>
                      </div>
                      {asset.description && (
                        <p className="text-[11px] text-muted-foreground truncate">{asset.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {asset.url && (
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-forest/70 hover:text-forest hover:bg-forest/10 transition-colors"
                        title="Abrir recurso"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Eliminar recurso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </form>
    </SlideOverDrawer>
  );
};
