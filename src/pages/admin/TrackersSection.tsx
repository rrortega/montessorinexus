import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Baby,
  Heart,
  FileText,
  Utensils,
  Moon,
  Clock,
  Sparkles,
  Check,
  X,
  Layers,
  ShieldAlert,
  Info,
  FolderOpen,
  Folder,
  Tag,
  MoreVertical,
  CheckCircle2,
  Sun,
  Droplet,
  Droplets,
  Shirt,
  Scissors,
  Umbrella,
  Zap,
  Camera,
  CreditCard,
  Smile,
  Frown,
  Wind,
  Phone
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
  TrackerCategoryItem,
  TrackerSubcategoryItem,
  TrackerItem,
  getTrackerCategories,
  saveTrackerCategory,
  deleteTrackerCategory,
  saveTrackerSubcategory,
  deleteTrackerSubcategory,
  saveTrackerItem,
  deleteTrackerItem,
  toggleTrackerItemActive
} from '@/lib/sqlite';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Helper to render icon by name
const renderTrackerIcon = (iconName?: string, className = "w-4 h-4") => {
  switch (iconName?.toLowerCase()) {
    case 'alerttriangle':
    case 'shieldalert':
      return <AlertTriangle className={className} />;
    case 'baby':
      return <Baby className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'filetext':
      return <FileText className={className} />;
    case 'utensils':
      return <Utensils className={className} />;
    case 'moon':
      return <Moon className={className} />;
    case 'activity':
    case 'sports':
      return <Activity className={className} />;
    case 'droplet':
    case 'droplets':
      return <Droplets className={className} />;
    case 'shirt':
      return <Shirt className={className} />;
    case 'sun':
      return <Sun className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'zap':
      return <Zap className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

const ICON_OPTIONS = [
  { name: 'AlertTriangle', label: 'Alerta / Accidentes', icon: AlertTriangle },
  { name: 'Baby', label: 'Bebé / Pañales', icon: Baby },
  { name: 'Heart', label: 'Corazón / Convivencia', icon: Heart },
  { name: 'FileText', label: 'Formularios / Expediente', icon: FileText },
  { name: 'Utensils', label: 'Comedor / Alimentos', icon: Utensils },
  { name: 'Moon', label: 'Luna / Siestas', icon: Moon },
  { name: 'Activity', label: 'Actividad / Deportes', icon: Activity },
  { name: 'Sparkles', label: 'General / Especial', icon: Sparkles },
];

export const TrackersSection: React.FC = () => {
  const { role } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  const [categories, setCategories] = useState<TrackerCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  // Category Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<TrackerCategoryItem> | null>(null);
  const [catName, setCatName] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catColor, setCatColor] = useState('#1b3b2b');
  const [catIcon, setCatIcon] = useState('Activity');
  const [catDescription, setCatDescription] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  // Subcategory Modal
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Partial<TrackerSubcategoryItem> | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [subName, setSubName] = useState('');
  const [subNameEn, setSubNameEn] = useState('');
  const [subDescription, setSubDescription] = useState('');
  const [subSaving, setSubSaving] = useState(false);

  // Item Modal (Level 3 Tracker Item)
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<TrackerItem> | null>(null);
  const [targetSubcategoryId, setTargetSubcategoryId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemNameEn, setItemNameEn] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemIcon, setItemIcon] = useState('Sparkles');
  const [itemSaving, setItemSaving] = useState(false);

  // Confirm delete dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: 'category' | 'subcategory' | 'item';
    id: string;
    name: string;
  }>({ isOpen: false, type: 'category', id: '', name: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTrackerCategories();
      setCategories(data);

      // Default: expand all categories and subcategories
      const initialCatExp: Record<string, boolean> = {};
      const initialSubExp: Record<string, boolean> = {};
      data.forEach(cat => {
        initialCatExp[cat.id] = true;
        cat.subcategories?.forEach(sub => {
          initialSubExp[sub.id] = true;
        });
      });
      setExpandedCategories(initialCatExp);
      setExpandedSubcategories(initialSubExp);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar catálogo de rastreadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSubcategories = useMemo(() => {
    return categories.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0);
  }, [categories]);

  const totalItems = useMemo(() => {
    return categories.reduce((acc, cat) => {
      return acc + (cat.subcategories || []).reduce((sAcc, sub) => sAcc + (sub.items?.length || 0), 0);
    }, 0);
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;

    return categories.map(cat => {
      const matchCat = cat.name.toLowerCase().includes(q) ||
        (cat.nameEn && cat.nameEn.toLowerCase().includes(q)) ||
        (cat.description && cat.description.toLowerCase().includes(q));

      const filteredSubs = (cat.subcategories || []).map(sub => {
        const matchSub = sub.name.toLowerCase().includes(q) ||
          (sub.nameEn && sub.nameEn.toLowerCase().includes(q)) ||
          (sub.description && sub.description.toLowerCase().includes(q));

        const filteredItems = (sub.items || []).filter(item =>
          item.name.toLowerCase().includes(q) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
        );

        if (matchSub) return sub;
        return {
          ...sub,
          items: filteredItems
        };
      }).filter(sub => (sub.items && sub.items.length > 0) || sub.name.toLowerCase().includes(q));

      if (matchCat) return cat;

      return {
        ...cat,
        subcategories: filteredSubs
      };
    }).filter(cat => (cat.subcategories && cat.subcategories.length > 0) || cat.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubcategory = (id: string) => {
    setExpandedSubcategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allCats: Record<string, boolean> = {};
    const allSubs: Record<string, boolean> = {};
    categories.forEach(c => {
      allCats[c.id] = true;
      c.subcategories?.forEach(s => {
        allSubs[s.id] = true;
      });
    });
    setExpandedCategories(allCats);
    setExpandedSubcategories(allSubs);
  };

  const collapseAll = () => {
    setExpandedCategories({});
    setExpandedSubcategories({});
  };

  // Toggle Tracker Active State
  const handleToggleItemActive = async (itemId: string) => {
    if (!isOwnerOrAdmin) return;
    try {
      await toggleTrackerItemActive(itemId);
      setCategories(prev => prev.map(cat => ({
        ...cat,
        subcategories: cat.subcategories.map(sub => ({
          ...sub,
          items: sub.items?.map(it => it.id === itemId ? { ...it, isActive: !it.isActive } : it)
        }))
      })));
    } catch (e) {
      toast.error('Error al actualizar estado del tracker');
    }
  };

  // Category Modal Handlers
  const handleOpenCategoryModal = (cat?: TrackerCategoryItem) => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo administradores pueden gestionar categorías de rastreadores.');
      return;
    }
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatNameEn(cat.nameEn || '');
      setCatColor(cat.color || '#1b3b2b');
      setCatIcon(cat.icon || 'Activity');
      setCatDescription(cat.description || '');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatNameEn('');
      setCatColor('#1b3b2b');
      setCatIcon('Activity');
      setCatDescription('');
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Ingresa el nombre de la categoría');
      return;
    }

    setCatSaving(true);
    try {
      await saveTrackerCategory({
        id: editingCategory?.id,
        name: catName.trim(),
        nameEn: catNameEn.trim() || undefined,
        color: catColor,
        icon: catIcon,
        description: catDescription.trim() || undefined,
        isActive: editingCategory?.isActive !== undefined ? editingCategory.isActive : true
      });

      toast.success(editingCategory ? 'Categoría de rastreador actualizada' : 'Nueva categoría de rastreador creada');
      setCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar categoría');
    } finally {
      setCatSaving(false);
    }
  };

  // Subcategory Modal Handlers
  const handleOpenSubcategoryModal = (categoryId: string, sub?: TrackerSubcategoryItem) => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo administradores pueden gestionar subcategorías.');
      return;
    }
    setTargetCategoryId(categoryId);
    if (sub) {
      setEditingSubcategory(sub);
      setSubName(sub.name);
      setSubNameEn(sub.nameEn || '');
      setSubDescription(sub.description || '');
    } else {
      setEditingSubcategory(null);
      setSubName('');
      setSubNameEn('');
      setSubDescription('');
    }
    setSubcategoryModalOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      toast.error('Ingresa el nombre de la subcategoría');
      return;
    }

    setSubSaving(true);
    try {
      await saveTrackerSubcategory({
        id: editingSubcategory?.id,
        categoryId: targetCategoryId,
        name: subName.trim(),
        nameEn: subNameEn.trim() || undefined,
        description: subDescription.trim() || undefined,
        isActive: editingSubcategory?.isActive !== undefined ? editingSubcategory.isActive : true
      });

      toast.success(editingSubcategory ? 'Subcategoría actualizada' : 'Nueva subcategoría agregada');
      setSubcategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar subcategoría');
    } finally {
      setSubSaving(false);
    }
  };

  // Item Modal Handlers (Level 3)
  const handleOpenItemModal = (subcategoryId: string, item?: TrackerItem) => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo administradores pueden gestionar rastreadores.');
      return;
    }
    setTargetSubcategoryId(subcategoryId);
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemNameEn(item.nameEn || '');
      setItemDescription(item.description || '');
      setItemIcon(item.icon || 'Sparkles');
    } else {
      setEditingItem(null);
      setItemName('');
      setItemNameEn('');
      setItemDescription('');
      setItemIcon('Sparkles');
    }
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('Ingresa el nombre del rastreador');
      return;
    }

    setItemSaving(true);
    try {
      await saveTrackerItem({
        id: editingItem?.id,
        subcategoryId: targetSubcategoryId,
        name: itemName.trim(),
        nameEn: itemNameEn.trim() || undefined,
        description: itemDescription.trim() || undefined,
        icon: itemIcon,
        isActive: editingItem?.isActive !== undefined ? editingItem.isActive : true
      });

      toast.success(editingItem ? 'Rastreador actualizado' : 'Nuevo rastreador registrado');
      setItemModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar rastreador');
    } finally {
      setItemSaving(false);
    }
  };

  // Delete Action
  const handleExecuteDelete = async () => {
    if (!confirmDelete.id || !isOwnerOrAdmin) return;
    try {
      if (confirmDelete.type === 'category') {
        await deleteTrackerCategory(confirmDelete.id);
        toast.success(`Categoría "${confirmDelete.name}" eliminada`);
      } else if (confirmDelete.type === 'subcategory') {
        await deleteTrackerSubcategory(confirmDelete.id);
        toast.success(`Subcategoría "${confirmDelete.name}" eliminada`);
      } else {
        await deleteTrackerItem(confirmDelete.id);
        toast.success(`Rastreador "${confirmDelete.name}" eliminado`);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300 pb-16">

      {/* HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                  Rastreadores & Cuidados Diarios (Trackers)
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {categories.length} categorías • {totalSubcategories} subcategorías • {totalItems} trackers
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Catálogo institucional de opciones y campos para el registro diario de incidentes, salud, pañales, alimentación, sueño y convivencias.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 shrink-0">
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => handleOpenCategoryModal()}
                className="px-4 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-forest" />
                <span>Nueva Categoría</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH & SHORTCUT TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-forest/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tracker, categoría o subcategoría..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-forest/15 bg-white text-forest text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest/20 shadow-2xs placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1 bg-white/80 border border-forest/10 p-1 rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 text-[11px] font-semibold text-forest/80 hover:text-forest hover:bg-forest/10 rounded-xl transition-colors cursor-pointer"
            >
              Expandir Todo (Expand All)
            </button>
            <span className="text-forest/20 text-xs">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 text-[11px] font-semibold text-forest/80 hover:text-forest hover:bg-forest/10 rounded-xl transition-colors cursor-pointer"
            >
              Colapsar Todo
            </button>
          </div>
        </div>
      </div>

      {/* 3-LEVEL ACCORDION CATEGORIES LIST */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Cargando catálogo de rastreadores...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest/10 space-y-3">
          <Activity className="w-12 h-12 text-forest/30 mx-auto" />
          <h3 className="font-display font-bold text-forest text-base">No se encontraron rastreadores</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Prueba ajustando el término de búsqueda o registra una nueva categoría.
          </p>
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => handleOpenCategoryModal()}
              className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Categoría Base</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((cat) => {
            const isCatOpen = !!expandedCategories[cat.id];
            const catItemCount = (cat.subcategories || []).reduce((acc, sub) => acc + (sub.items?.length || 0), 0);

            return (
              <div
                key={cat.id}
                className="bg-white/95 backdrop-blur-sm rounded-3xl border border-forest/10 shadow-xs overflow-hidden transition-all"
              >
                {/* LEVEL 1: CATEGORY ACCORDION HEADER (FULL WIDTH) */}
                <div
                  onClick={() => toggleCategory(cat.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-forest/5 transition-colors border-b border-forest/10 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-forest/60 hover:text-forest transition-transform"
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${isCatOpen ? 'rotate-0' : '-rotate-90'
                          }`}
                      />
                    </button>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                        style={{ backgroundColor: cat.color || '#1b3b2b' }}
                      >
                        {renderTrackerIcon(cat.icon, "w-3.5 h-3.5")}
                        <span>{cat.name}</span>
                      </span>

                      {cat.nameEn && (
                        <span className="text-[11px] font-semibold text-muted-foreground/80 px-2 py-0.5 bg-forest/5 rounded-full border border-forest/10 font-mono shrink-0">
                          {cat.nameEn}
                        </span>
                      )}

                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        ({cat.subcategories?.length || 0} subcategorías • {catItemCount} trackers)
                      </span>
                    </div>

                    {cat.description && (
                      <span className="hidden lg:inline-block text-xs text-muted-foreground/80 leading-snug truncate max-w-md">
                        — {cat.description}
                      </span>
                    )}
                  </div>

                  {/* Right Actions on Category Header */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="text-[11px] font-bold text-forest/70 hover:text-forest px-2 py-1 hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
                    >
                      {isCatOpen ? 'Colapsar' : 'Expand All'}
                    </button>

                    {isOwnerOrAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenCategoryModal(cat)}
                          className="p-1.5 rounded-xl text-forest/70 hover:text-forest hover:bg-forest/10 transition-colors cursor-pointer"
                          title="Editar categoría de rastreador"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ isOpen: true, type: 'category', id: cat.id, name: cat.name })}
                          className="p-1.5 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* LEVEL 2 & 3: SUBCATEGORIES ACCORDION AND TRACKER ROWS */}
                {isCatOpen && (
                  <div className="p-3 sm:p-5 space-y-4 bg-cream/15">
                    {!cat.subcategories || cat.subcategories.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground italic">
                        No hay subcategorías registradas en este rastreador.
                      </div>
                    ) : (
                      cat.subcategories.map((sub) => {
                        const isSubOpen = !!expandedSubcategories[sub.id];
                        const items = sub.items || [];

                        return (
                          <div
                            key={sub.id}
                            className="bg-white rounded-2xl border border-forest/10 overflow-hidden shadow-2xs transition-all"
                          >
                            {/* LEVEL 2 HEADER: SUBCATEGORY ACCORDION */}
                            <div
                              onClick={() => toggleSubcategory(sub.id)}
                              className="p-3.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-forest/5 transition-colors select-none border-b border-forest/5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  className="p-0.5 rounded text-forest/60 hover:text-forest transition-transform"
                                >
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${isSubOpen ? 'rotate-0' : '-rotate-90'
                                      }`}
                                  />
                                </button>

                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                  <span className="font-bold text-forest text-xs sm:text-sm">
                                    {sub.name}
                                  </span>

                                  {sub.nameEn && (
                                    <span className="text-[10px] text-muted-foreground/70 font-mono">
                                      ({sub.nameEn})
                                    </span>
                                  )}

                                  <span className="text-[11px] font-mono text-muted-foreground">
                                    • {items.length} {items.length === 1 ? 'tracker' : 'trackers'}
                                  </span>
                                </div>
                              </div>

                              {/* Right Subcategory Actions */}
                              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {isOwnerOrAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenItemModal(sub.id)}
                                      className="p-1 px-2 rounded-lg text-forest hover:bg-forest/10 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Agregar tracker individual a esta subcategoría"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>+ Tracker</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenSubcategoryModal(cat.id, sub)}
                                      className="p-1.5 rounded-lg text-forest/70 hover:text-forest hover:bg-forest/10 transition-colors cursor-pointer"
                                      title="Editar subcategoría"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setConfirmDelete({ isOpen: true, type: 'subcategory', id: sub.id, name: sub.name })}
                                      className="p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                      title="Eliminar subcategoría"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* LEVEL 3 BODY: TRACKER ITEMS TABLE */}
                            {isSubOpen && (
                              <div className="divide-y divide-forest/5 bg-cream/5">
                                {/* Table Sub-header */}
                                <div className="px-4 py-2 bg-forest/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-forest/70 select-none">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-forest/60" />
                                    <span>Trackers Activos ({items.filter(i => i.isActive).length}/{items.length})</span>
                                  </div>
                                  <span>Estado / Acciones</span>
                                </div>

                                {items.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                                    No hay trackers registrados en esta subcategoría.
                                  </div>
                                ) : (
                                  items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-forest/5 transition-colors group"
                                    >
                                      {/* Left info: Name in Spanish & English badge */}
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div
                                          className={`w-2 h-2 rounded-full shrink-0 ${item.isActive ? 'bg-forest' : 'bg-muted-foreground/40'
                                            }`}
                                        />

                                        <div className="space-y-0.5 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs font-semibold ${item.isActive ? 'text-forest' : 'text-muted-foreground line-through'}`}>
                                              {item.name}
                                            </span>

                                            {item.nameEn && (
                                              <span className="text-[10px] font-mono text-muted-foreground/70">
                                                [{item.nameEn}]
                                              </span>
                                            )}
                                          </div>

                                          {item.description && (
                                            <p className="text-[11px] text-muted-foreground truncate max-w-md">
                                              {item.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Right: Active Toggle Switch (Yes/No as in screenshot) & Edit/Delete */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        {/* Toggle Switch */}
                                        <button
                                          type="button"
                                          onClick={() => handleToggleItemActive(item.id)}
                                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer border ${item.isActive
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                              : 'bg-zinc-100 text-zinc-500 border-zinc-300 hover:bg-zinc-200'
                                            }`}
                                          title={item.isActive ? 'Desactivar tracker' : 'Activar tracker'}
                                        >
                                          <span>{item.isActive ? 'Yes' : 'No'}</span>
                                        </button>

                                        {isOwnerOrAdmin && (
                                          <div className="flex items-center gap-0.5">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenItemModal(sub.id, item)}
                                              className="p-1 rounded text-forest/60 hover:text-forest hover:bg-forest/10 transition-colors cursor-pointer"
                                              title="Editar tracker"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setConfirmDelete({ isOpen: true, type: 'item', id: item.id, name: item.name })}
                                              className="p-1 rounded text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                              title="Eliminar tracker"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}

                                {/* Bottom "+ Add Tracker" button inside subcategory */}
                                {isOwnerOrAdmin && (
                                  <div className="p-2.5 bg-white flex justify-start">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenItemModal(sub.id)}
                                      className="px-3 py-1.5 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 border border-forest/15 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-98"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-forest" />
                                      <span>+ Add Tracker</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Quick "+ Add Subcategory" Button at the bottom (matching screenshot design) */}
                    {isOwnerOrAdmin && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenSubcategoryModal(cat.id)}
                          className="px-4 py-2 bg-white hover:bg-forest/5 text-forest border border-forest/20 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
                        >
                          <Plus className="w-3.5 h-3.5 text-forest" />
                          <span>+ Add Subcategory</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CATEGORY CREATE / EDIT */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-forest/10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-forest" />
                <h3 className="font-display font-bold text-forest text-base">
                  {editingCategory ? 'Editar Categoría de Rastreador' : 'Nueva Categoría de Rastreador'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-forest/10 text-forest/70 hover:text-forest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-forest font-bold">Nombre en Español *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej. Pañales y Control de Esfínteres, Alimentación, Siestas..."
                  required
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest font-bold bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-forest font-bold">Nombre en Inglés (Opcional)</label>
                <input
                  type="text"
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  placeholder="Ej. Diapers and Toilet Training, Meals, Naps..."
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-forest font-bold">Color Identificador</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-9 h-9 rounded-xl border border-forest/20 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-full p-2 rounded-xl border border-forest/20 font-mono text-xs text-forest"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-forest font-bold">Ícono</label>
                  <select
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest font-medium bg-white focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-forest font-bold">Descripción / Propósito</label>
                <textarea
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  rows={2}
                  placeholder="Explica qué aspectos o cuidados registra este rastreador..."
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="pt-2 border-t border-forest/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 bg-forest/5 hover:bg-forest/10 text-forest font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="px-4 py-2 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {catSaving ? 'Guardando...' : (editingCategory ? 'Guardar Cambios' : 'Crear Categoría')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBCATEGORY CREATE / EDIT */}
      {subcategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-forest/10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-forest" />
                <h3 className="font-display font-bold text-forest text-base">
                  {editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubcategoryModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-forest/10 text-forest/70 hover:text-forest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-forest font-bold">Categoría Principal *</label>
                <select
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest font-bold bg-white focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.nameEn ? `(${c.nameEn})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-forest font-bold">Nombre de la Subcategoría (Español) *</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Ej. Cambio de Pañal, Malestar / Incomodidad, Cambio de Ropa..."
                  required
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest font-bold bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-forest font-bold">Nombre en Inglés (Opcional)</label>
                <input
                  type="text"
                  value={subNameEn}
                  onChange={(e) => setSubNameEn(e.target.value)}
                  placeholder="Ej. Discomfort/Malestar, Change of clothes, Lunch..."
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-forest font-bold">Descripción (Opcional)</label>
                <textarea
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre qué se reporta o qué datos se recogen..."
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="pt-2 border-t border-forest/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubcategoryModalOpen(false)}
                  className="px-4 py-2 bg-forest/5 hover:bg-forest/10 text-forest font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subSaving}
                  className="px-4 py-2 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {subSaving ? 'Guardando...' : (editingSubcategory ? 'Guardar Cambios' : 'Agregar Subcategoría')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRACKER ITEM CREATE / EDIT (LEVEL 3) */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-forest/10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-forest" />
                <h3 className="font-display font-bold text-forest text-base">
                  {editingItem ? 'Editar Tracker / Opción' : 'Nuevo Tracker / Opción'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-forest/10 text-forest/70 hover:text-forest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-forest font-bold">Nombre del Tracker (Español) *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ej. Mordedura, Pañal mojado, Comió todo, Durmió profundamente..."
                  required
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest font-bold bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-forest font-bold">Nombre en Inglés (Opcional)</label>
                <input
                  type="text"
                  value={itemNameEn}
                  onChange={(e) => setItemNameEn(e.target.value)}
                  placeholder="Ej. Bitten, Diaper change (wet), Ate all, Slept well..."
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-forest font-bold">Descripción o Nota (Opcional)</label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={2}
                  placeholder="Instrucciones adicionales para la guía al marcar este tracker..."
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="pt-2 border-t border-forest/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2 bg-forest/5 hover:bg-forest/10 text-forest font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={itemSaving}
                  className="px-4 py-2 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {itemSaving ? 'Guardando...' : (editingItem ? 'Guardar Cambios' : 'Registrar Tracker')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={confirmDelete.isOpen}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, isOpen: open }))}
        title={
          confirmDelete.type === 'category'
            ? '¿Eliminar Categoría de Rastreador?'
            : confirmDelete.type === 'subcategory'
              ? '¿Eliminar Subcategoría?'
              : '¿Eliminar Tracker?'
        }
        description={`¿Estás seguro de que deseas eliminar permanentemente "${confirmDelete.name}"? Los registros históricos asociados se conservarán.`}
        confirmText="Sí, Eliminar"
        variant="destructive"
        onConfirm={handleExecuteDelete}
      />

    </div>
  );
};
