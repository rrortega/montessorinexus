import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Images,
  Plus,
  Trash2,
  Edit3,
  FolderPlus,
  Image as ImageIcon,
  Tag,
  Filter,
  Search,
  X,
  RefreshCw,
  Eye,
  Sparkles,
  Lock
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import {
  getGalleryCategories,
  getGalleryImages,
  createGalleryCategory,
  deleteGalleryCategory,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  migrateHardcodedGallery,
  GalleryCategory,
  GalleryImageItem
} from '@/lib/sqlite';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { uploadPhysicalFile } from '@/lib/api';

// Helper function to compress high-res image files to ~100-200 KB for fast storage
const compressImageFile = (file: File, maxWidth = 1200, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const AdminGallerySection: React.FC = () => {
  const { role, activeMembership } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImageItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Lightbox / Image Preview Modal for non-admin viewers and admins alike
  const [previewImage, setPreviewImage] = useState<GalleryImageItem | null>(null);

  // Mobile Action Sheet State & Gesture (Only for Admins)
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetTouchStartY = useRef(0);

  useEffect(() => {
    if (!mobileActionsOpen) {
      setSheetDragY(0);
      setIsSheetDragging(false);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const stateId = 'gallery-actions-sheet-' + Date.now();
    window.history.pushState({ modalId: stateId }, '');

    const handlePopState = () => {
      setMobileActionsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileActionsOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileActionsOpen]);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
    setIsSheetDragging(true);
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - sheetTouchStartY.current;
    if (diff > 0) {
      setSheetDragY(diff);
    }
  };

  const handleSheetTouchEnd = () => {
    setIsSheetDragging(false);
    if (sheetDragY > 40) {
      setMobileActionsOpen(false);
    }
    setSheetDragY(0);
  };

  // Search Bar State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Image Modal State (Only for Admins)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImageItem | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [srcUrl, setSrcUrl] = useState('');
  const [srcFile, setSrcFile] = useState<File | null>(null);
  const [langTab, setLangTab] = useState<'es' | 'en'>('es');

  // Category Modal State (Only for Admins)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatLabelEn, setNewCatLabelEn] = useState('');

  // Delete Confirm Dialog (Only for Admins)
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: 'image' | 'category';
    id: string;
    title: string;
  }>({ isOpen: false, type: 'image', id: '', title: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getGalleryCategories();
      setCategories(cats);
      const imgs = await getGalleryImages(activeCat);
      setImages(imgs);
    } catch (e) {
      console.error('Error loading gallery', e);
      toast.error('Error al cargar la galería');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCat]);

  const handleRunMigration = async () => {
    if (!isOwnerOrAdmin) return;
    try {
      const res = await migrateHardcodedGallery(true);
      if (res.success) {
        toast.success(`Migración completada: ${res.insertedCount} imágenes cargadas`);
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error en migración');
    }
  };

  const filteredImages = useMemo(() => {
    let result = images;
    if (activeCat !== 'all') {
      result = result.filter(img => img.category_id === activeCat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(img =>
        img.title.toLowerCase().includes(q) ||
        (img.title_en && img.title_en.toLowerCase().includes(q)) ||
        img.description.toLowerCase().includes(q) ||
        (img.description_en && img.description_en.toLowerCase().includes(q))
      );
    }
    return result;
  }, [images, activeCat, searchQuery]);

  const handleOpenImageModal = (img?: GalleryImageItem) => {
    if (!isOwnerOrAdmin) {
      if (img) setPreviewImage(img);
      return;
    }

    if (img) {
      setEditingImage(img);
      setSelectedCatId(img.category_id);
      setTitle(img.title);
      setTitleEn(img.title_en || '');
      setDescription(img.description);
      setDescriptionEn(img.description_en || '');
      setSrcUrl(img.src);
      setSrcFile(null);
    } else {
      setEditingImage(null);
      const defaultCategory = (activeCat !== 'all' && activeCat)
        ? activeCat
        : (categories.length > 0 ? categories[0].id : 'practical');
      setSelectedCatId(defaultCategory);
      setTitle('');
      setTitleEn('');
      setDescription('');
      setDescriptionEn('');
      setSrcUrl('');
      setSrcFile(null);
    }
    setLangTab('es');
    setIsImageModalOpen(true);
  };

  const handleFileSelected = async (file: File | null) => {
    setSrcFile(file);
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file);
        setSrcUrl(compressedBase64);
      } catch (err) {
        console.error('Error compressing image', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setSrcUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores tienen permisos para agregar o editar fotografías.');
      return;
    }

    const finalTitle = title.trim() || titleEn.trim();
    if (!finalTitle) {
      toast.error('Ingresa el título de la fotografía.');
      return;
    }

    if (!selectedCatId) {
      toast.error('Selecciona una categoría.');
      return;
    }

    // Process image file: upload physically to /public/gallery/ on server disk
    let finalSrc = srcUrl.trim();
    if (srcFile) {
      try {
        const uploadRes = await uploadPhysicalFile(srcFile, 'gallery', finalTitle);
        finalSrc = uploadRes.url;
      } catch (err) {
        console.warn('Physical file upload failed, falling back to base64 data URI', err);
        if (!finalSrc || finalSrc.startsWith('blob:')) {
          finalSrc = await compressImageFile(srcFile);
        }
      }
    }

    if (!finalSrc) {
      toast.error('Selecciona un archivo de imagen o escribe la URL.');
      return;
    }

    if (editingImage) {
      await updateGalleryImage(editingImage.id, {
        category_id: selectedCatId,
        src: finalSrc,
        title: finalTitle,
        title_en: titleEn.trim() || finalTitle,
        description: description.trim(),
        description_en: descriptionEn.trim(),
      });
      toast.success('Fotografía actualizada.');
    } else {
      await createGalleryImage({
        category_id: selectedCatId,
        src: finalSrc,
        title: finalTitle,
        title_en: titleEn.trim() || finalTitle,
        description: description.trim(),
        description_en: descriptionEn.trim(),
      });
      toast.success('Fotografía agregada a la galería.');
    }

    if (activeCat !== 'all' && activeCat !== selectedCatId) {
      setActiveCat(selectedCatId);
    }

    setIsImageModalOpen(false);
    loadData();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores pueden crear categorías.');
      return;
    }

    if (!newCatLabel.trim()) {
      toast.error('Ingresa el nombre de la categoría.');
      return;
    }

    const catIdToUse = newCatId.trim() || newCatLabel.trim().toLowerCase().replace(/\s+/g, '_');
    await createGalleryCategory(catIdToUse, newCatLabel.trim(), newCatLabelEn.trim());
    toast.success('Categoría creada exitosamente.');
    setNewCatId('');
    setNewCatLabel('');
    setNewCatLabelEn('');
    setIsCatModalOpen(false);
    loadData();
  };

  const promptDelete = (type: 'image' | 'category', id: string, titleStr: string) => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores tienen permisos para eliminar elementos.');
      return;
    }
    setConfirmDelete({
      isOpen: true,
      type,
      id,
      title: titleStr
    });
  };

  const handleExecuteDelete = async () => {
    if (!isOwnerOrAdmin) return;
    if (confirmDelete.type === 'image') {
      await deleteGalleryImage(confirmDelete.id);
      toast.success('Fotografía eliminada.');
    } else {
      await deleteGalleryCategory(confirmDelete.id);
      toast.success('Categoría y sus fotografías eliminadas.');
      if (activeCat === confirmDelete.id) setActiveCat('all');
    }
    loadData();
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300">

      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                  Galería Web & Fotografías
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {images.length} {images.length === 1 ? 'foto' : 'fotos'}
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                {isOwnerOrAdmin
                  ? 'Administra las fotografías, categorías temáticas y descripciones pedagógicas de la galería escolar.'
                  : 'Explora las fotografías y momentos pedagógicos de los ambientes Montessori del colegio.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 flex-wrap shrink-0">
            {isOwnerOrAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(true)}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-white/20 shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Nueva Categoría</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenImageModal()}
                  className="px-4 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-forest" />
                  <span>+ Subir Foto</span>
                </button>
              </>
            ) : (
              <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-white/90 space-y-0.5 shrink-0">
                <span className="text-[10px] text-white/60 uppercase font-bold block">Colegio Activo</span>
                <strong className="text-sm sm:text-base font-bold font-display block text-white">
                  {activeMembership?.school.name || 'Escuela Montessori'}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Selector Bar with Collapsible Search */}
      {isSearchOpen ? (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-3.5 border border-forest/20 shadow-sm flex items-center gap-3 w-full transition-all animate-in fade-in zoom-in-95 duration-200">
          <Search className="w-4 h-4 text-forest shrink-0 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar fotografías por título, palabra clave o descripción..."
            autoFocus
            className="flex-1 text-xs sm:text-sm text-forest bg-transparent focus:outline-none placeholder:text-muted-foreground font-medium"
          />
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setIsSearchOpen(false);
            }}
            className="p-1.5 text-muted-foreground hover:text-forest hover:bg-forest/10 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Limpiar y cerrar buscador"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-3 sm:p-4 border border-forest/10 shadow-xs flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full">

            {/* Search Icon Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-2xl bg-forest/5 hover:bg-forest/10 text-forest shrink-0 transition-all border border-forest/10 cursor-pointer"
              title="Abrir buscador en la galería"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveCat('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${activeCat === 'all'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-forest/5 text-forest/80 hover:bg-forest/10'
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Todas ({images.length})</span>
            </button>

            {categories.map((cat) => (
              <div key={cat.id} className="relative group shrink-0 flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveCat(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeCat === cat.id
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-forest/5 text-forest/80 hover:bg-forest/10'
                    }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>

                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => promptDelete('category', cat.id, cat.label)}
                    className="ml-1 p-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Images Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Cargando fotografías...
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3">
          <Images className="w-12 h-12 text-forest/30 mx-auto" />
          <h3 className="font-display font-bold text-forest text-lg">
            {searchQuery ? 'No se encontraron fotografías para la búsqueda' : 'No hay fotografías en esta categoría'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? `No hay resultados que coincidan con "${searchQuery}". Intenta con otros términos.`
              : isOwnerOrAdmin
                ? 'Agrega imágenes Montessori con su título y descripción pedagógica, o ejecuta la migración inicial.'
                : 'Aún no se han publicado fotografías en esta sección.'}
          </p>
          {isOwnerOrAdmin && !searchQuery && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleRunMigration}
                className="px-4 py-2 bg-forest/10 text-forest rounded-xl text-xs font-semibold hover:bg-forest/20 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Migrar Galería Hardcodeada
              </button>
              <button
                type="button"
                onClick={() => handleOpenImageModal()}
                className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Subir Foto
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img) => {
            const catObj = categories.find(c => c.id === img.category_id);
            return (
              <div
                key={img.id}
                onClick={() => isOwnerOrAdmin ? handleOpenImageModal(img) : setPreviewImage(img)}
                className="bg-white rounded-3xl overflow-hidden border border-forest/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
              >
                {/* Photo Preview Container */}
                <div className="relative aspect-[4/3] bg-cream overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-forest/80 backdrop-blur-md text-white text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border border-white/20">
                    {catObj?.label || img.category_id}
                  </div>

                  {isOwnerOrAdmin ? (
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenImageModal(img)}
                        className="p-1.5 text-forest/80 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
                        title="Editar Foto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDelete('image', img.id, img.title)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4 text-forest" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 space-y-2">
                  <h3 className="font-display font-bold text-forest text-base leading-snug group-hover:text-forest-light transition-colors">
                    {img.title}
                  </h3>
                  {img.title_en && (
                    <span className="text-[10px] text-terracotta font-semibold uppercase tracking-wider block">
                      EN: {img.title_en}
                    </span>
                  )}

                  {img.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed pt-1 border-t border-forest/5">
                      "{img.description}"
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX / IMAGE PREVIEW MODAL (Available to All Roles) */}
      {previewImage && (
        <ResponsiveModal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          maxWidthClass="max-w-2xl"
          title={previewImage.title}
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-forest/5 border border-forest/10">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-forest/10 text-forest border border-forest/15">
                  {categories.find(c => c.id === previewImage.category_id)?.label || previewImage.category_id}
                </span>
                {previewImage.title_en && (
                  <span className="text-xs text-muted-foreground font-semibold">
                    {previewImage.title_en}
                  </span>
                )}
              </div>

              {previewImage.description ? (
                <p className="text-xs sm:text-sm text-forest/90 leading-relaxed italic bg-forest/5 p-4 rounded-2xl border border-forest/10">
                  "{previewImage.description}"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Fotografía pedagógica de las actividades y ambientes Montessori.
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ResponsiveModal>
      )}

      {/* CREATE / EDIT IMAGE MODAL (Only for Admins) */}
      {isOwnerOrAdmin && (
        <ResponsiveModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          maxWidthClass="max-w-xl"
          title={editingImage ? 'Editar Fotografía' : 'Nueva Fotografía'}
        >
          <div className="space-y-4">

            <div className="flex items-center justify-between pb-2 border-b border-forest/10">
              <span className="text-xs font-semibold text-forest uppercase tracking-wider">Detalles & Pedagogía</span>

              {/* Language Selector Tabs */}
              <div className="flex items-center gap-1 bg-cream/80 p-1 rounded-xl border border-forest/10">
                <button
                  type="button"
                  onClick={() => setLangTab('es')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${langTab === 'es' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:text-forest'
                    }`}
                >
                  🇪🇸 ES
                </button>
                <button
                  type="button"
                  onClick={() => setLangTab('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${langTab === 'en' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:text-forest'
                    }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveImage} className="space-y-4">

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                  Categoría de Galería *
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-sm font-semibold text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Uploader / URL */}
              <div>
                <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                  Archivo de Imagen o URL *
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                    className="w-full text-xs text-forest file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={srcUrl}
                    onChange={(e) => setSrcUrl(e.target.value)}
                    placeholder="o pega una URL directa (ej. /gallery/foto.jpg o https://...)"
                    className="w-full px-3.5 py-2 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>

                {srcUrl && (
                  <div className="mt-2 relative rounded-2xl overflow-hidden aspect-[16/9] max-h-48 bg-cream border border-forest/15">
                    <img src={srcUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Bilingual Fields */}
              {langTab === 'es' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                      Título de la Foto (Español) *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ej. Trabajo en Vida Práctica"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                      Descripción Montessoriana (Español)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explicación pedagógica sobre el desarrollo y aprendizaje en esta actividad..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                      Photo Title (English)
                    </label>
                    <input
                      type="text"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      placeholder="e.g. Practical Life Activity"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                      Montessori Description (English)
                    </label>
                    <textarea
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      placeholder="Pedagogical explanation regarding child development and learning..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-forest/10">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white font-display font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  {editingImage ? 'Guardar Cambios' : 'Publicar Fotografía'}
                </button>
              </div>

            </form>

          </div>
        </ResponsiveModal>
      )}

      {/* CREATE CATEGORY MODAL (Only for Admins) */}
      {isOwnerOrAdmin && (
        <ResponsiveModal
          isOpen={isCatModalOpen}
          onClose={() => setIsCatModalOpen(false)}
          maxWidthClass="max-w-md"
          title="Nueva Categoría de Galería"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                Nombre de Categoría (Español) *
              </label>
              <input
                type="text"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                placeholder="ej. Vida Práctica, Arte, Sensorial..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                Nombre de Categoría (Inglés)
              </label>
              <input
                type="text"
                value={newCatLabelEn}
                onChange={(e) => setNewCatLabelEn(e.target.value)}
                placeholder="ej. Practical Life, Art, Sensorial..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                ID / Slug Interno (Opcional)
              </label>
              <input
                type="text"
                value={newCatId}
                onChange={(e) => setNewCatId(e.target.value)}
                placeholder="ej. practical, art (se auto-genera si se deja vacío)"
                className="w-full px-3.5 py-2 rounded-xl border border-forest/20 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-forest/10">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white font-display font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                Crear Categoría
              </button>
            </div>
          </form>
        </ResponsiveModal>
      )}

      {/* CONFIRM DELETE DIALOG (Only for Admins) */}
      {isOwnerOrAdmin && (
        <ConfirmDialog
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, type: 'image', id: '', title: '' })}
          onConfirm={handleExecuteDelete}
          title={confirmDelete.type === 'image' ? '¿Eliminar Fotografía?' : '¿Eliminar Categoría?'}
          description={
            confirmDelete.type === 'image'
              ? `¿Estás seguro de eliminar "${confirmDelete.title}" de la galería pública?`
              : `¿Estás seguro de eliminar la categoría "${confirmDelete.title}"? También se eliminarán las fotografías asociadas.`
          }
          confirmText="Sí, eliminar"
          variant="danger"
        />
      )}

    </div>
  );
};

export default AdminGallerySection;
