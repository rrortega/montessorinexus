import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  FileText,
  Sparkles,
  Layers,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  HeartPulse,
  GraduationCap,
  Scale,
  Users,
  Search,
  X,
  ExternalLink,
  Check,
  Share2,
  Eye,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import {
  AdmissionFormTemplateItem,
  getAdmissionFormTemplates,
  deleteAdmissionFormTemplate,
  createAdmissionFormTemplate,
  updateAdmissionFormTemplate,
  seedDefaultAdmissionFormTemplates
} from '@/lib/sqlite';
import { FormEditorPage } from './FormEditorPage';
import { MobileMenuButton } from './AdminDashboard';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

const CATEGORY_MAP: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  MEDICAL: { label: 'Médico y Hábitos', icon: HeartPulse, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  PEDAGOGICAL: { label: 'Pedagógico y Familiar', icon: GraduationCap, color: 'text-forest', bg: 'bg-forest/5 border-forest/20' },
  LEGAL_CONSENT: { label: 'Consentimientos y Legal', icon: Scale, color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
  INTERVIEW: { label: 'Entrevista y Guías', icon: Users, color: 'text-indigo-800', bg: 'bg-indigo-50 border-indigo-200' },
  SOCIOECONOMIC: { label: 'Socioeconómico', icon: FileText, color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
  GENERAL: { label: 'General / Encuesta', icon: Layers, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
  RRHH: { label: 'Recursos Humanos', icon: Layers, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
};

interface PaginationControlProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel: string;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  itemLabel
}) => {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-white rounded-2xl p-3 sm:px-4 sm:py-3 border border-forest/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-forest">
      {/* Items count */}
      <div className="text-muted-foreground text-[11px] font-medium">
        Mostrando <strong className="text-forest font-bold">{start}</strong> - <strong className="text-forest font-bold">{end}</strong> de <strong className="text-forest font-bold">{totalItems}</strong> {itemLabel}
      </div>

      {/* Controls: Page size selector + Page navigation */}
      <div className="flex items-center gap-3.5 flex-wrap">
        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-forest/5 border border-forest/15 rounded-xl px-2.5 py-1 text-forest font-bold text-xs focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer shadow-2xs"
          >
            <option value={4}>4</option>
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Page Nav Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1.5 rounded-xl border border-forest/15 text-forest hover:bg-forest/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 text-[11px] font-bold bg-forest/5 rounded-xl border border-forest/10">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1.5 rounded-xl border border-forest/15 text-forest hover:bg-forest/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const FormsSection: React.FC = () => {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState<AdmissionFormTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drag-and-drop delete state
  const [draggingForm, setDraggingForm] = useState<AdmissionFormTemplateItem | null>(null);
  const [isOverDropTrash, setIsOverDropTrash] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Full Page Form Editor State
  const [editingFormId, setEditingFormId] = useState<string | 'new' | null>(() => {
    const urlFormId = searchParams.get('edit') || searchParams.get('id');
    return urlFormId || null;
  });

  const handleOpenEditor = (id: string | 'new') => {
    setEditingFormId(id);
    setSearchParams({ tab: 'forms', edit: id });
  };

  const handleCloseEditor = () => {
    setEditingFormId(null);
    setSearchParams({ tab: 'forms' });
    loadTemplates();
  };

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAdmissionFormTemplates();
      setTemplates(data);
    } catch (e: any) {
      toast.error('Error al cargar formularios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTemplates = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, validCurrentPage, pageSize]);

  const handleTogglePublish = async (tpl: AdmissionFormTemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const previousTemplates = [...templates];
    const newStatus = !tpl.is_published;
    setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, is_published: newStatus, isPublished: newStatus } : t));
    try {
      await updateAdmissionFormTemplate(tpl.id, {
        isPublished: newStatus
      });
      toast.success(newStatus ? 'Formulario publicado' : 'Formulario guardado como borrador');
    } catch (e: any) {
      setTemplates(previousTemplates);
      toast.error('Error al actualizar estado del formulario');
    }
  };

  const handleDelete = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await confirm({
      title: '¿Eliminar formulario?',
      description: `¿Estás seguro de eliminar el formulario "${name}"? Dejará de estar disponible para admisiones y encuestas públicas.`,
      confirmText: 'Sí, eliminar formulario',
      variant: 'danger'
    });
    if (!ok) return;

    // Optimistic UI removal: immediately hide/remove item from state
    const previousTemplates = [...templates];
    setTemplates(prev => prev.filter(t => t.id !== id));

    try {
      await deleteAdmissionFormTemplate(id);
      toast.success('Formulario eliminado');
    } catch (e: any) {
      // Rollback if deletion fails
      setTemplates(previousTemplates);
      toast.error(e.message || 'Error al eliminar formulario');
    }
  };

  const handleDuplicate = async (tpl: AdmissionFormTemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: '¿Duplicar formulario?',
      description: `¿Deseas crear una copia de "${tpl.title}"? Se generará un nuevo formulario en modo borrador con todas las secciones, preguntas y configuraciones del original.`,
      confirmText: 'Sí, duplicar formulario',
      cancelText: 'Cancelar'
    });
    if (!ok) return;

    try {
      await createAdmissionFormTemplate({
        title: `${tpl.title} (Copia)`,
        description: tpl.description,
        category: tpl.category,
        schema: tpl.schema,
        isPublished: false
      });
      toast.success('Formulario duplicado con éxito');
      loadTemplates();
    } catch (e: any) {
      toast.error(e.message || 'Error al duplicar formulario');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setLoading(true);
      await seedDefaultAdmissionFormTemplates();
      toast.success('Plantillas de formularios creadas correctamente');
      loadTemplates();
    } catch (e: any) {
      toast.error(e.message || 'Error al generar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (tpl: AdmissionFormTemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/forms/${tpl.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(tpl.id);
    toast.success('Enlace público del formulario copiado');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (editingFormId) {
    return (
      <FormEditorPage
        templateId={editingFormId}
        onBack={handleCloseEditor}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner (Ceiba Standard) */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-8 sm:-mt-6 md:-mt-8 bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 pt-6 pb-4 sm:py-6 text-white shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                  Gestión de Formularios
                </h1>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Diseña encuestas, expedientes de admisión y consentimientos con el constructor interactivo Ceiba Roots.
              </p>
            </div>
          </div>

          {/* Desktop Actions on the Right */}
          <div className="hidden sm:flex items-center gap-2">
            {templates.length === 0 && (
              <button
                type="button"
                onClick={handleSeedDefaults}
                className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 shadow-xs"
                title="Cargar plantillas prediseñadas (Médico, Pedagógico, Consentimientos, etc.)"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                <span>Plantillas Predeterminadas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenEditor('new')}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 bg-white text-forest hover:bg-white/90 shadow-md font-extrabold"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-forest" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>

        {/* Mobile Header Action (Templates seed button if empty) */}
        {templates.length === 0 && (
          <div className="sm:hidden relative z-10 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap active:cursor-grab select-none touch-pan-x pt-1">
            <button
              type="button"
              onClick={handleSeedDefaults}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-xs"
              title="Cargar plantillas prediseñadas"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Plantillas Predeterminadas</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Toolbar: Search & Category Choice (No outer container) */}
      <div className="space-y-3">
        {isSearchExpanded || search.length > 0 ? (
          /* Expanded Full-Row Search Input */
          <div className="w-full bg-white rounded-2xl p-2.5 px-4 flex items-center gap-3 border border-forest/15 shadow-xs animate-in fade-in zoom-in-98 duration-200">
            <Search className="w-4 h-4 text-forest shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              placeholder="Buscar por título de formulario o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearch('');
                  setIsSearchExpanded(false);
                }
              }}
              className="w-full bg-transparent text-xs text-forest focus:outline-none placeholder:text-muted-foreground font-medium"
            />
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setIsSearchExpanded(false);
              }}
              className="p-1 text-muted-foreground hover:text-forest hover:bg-forest/10 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
              title="Cerrar búsqueda (Esc)"
            >
              <span className="text-[10px] hidden sm:inline font-mono opacity-60">Esc</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Collapsed Search Icon + Multiselect Category Choice */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full animate-in fade-in duration-150">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              {/* Search Icon Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="p-2.5 rounded-2xl bg-white hover:bg-forest/5 text-forest border border-forest/15 transition-all flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 shrink-0"
                title="Buscar formularios..."
              >
                <Search className="w-4 h-4 text-forest" />
              </button>

              {/* Category Dropdown Choice */}
              <div className="relative shrink-0" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs ${selectedCategory !== 'ALL'
                    ? 'bg-forest text-white border-forest'
                    : 'bg-white text-forest border-forest/15 hover:bg-forest/5'
                    }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    {selectedCategory === 'ALL'
                      ? 'Todas las categorías'
                      : CATEGORY_MAP[selectedCategory]?.label || selectedCategory}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-2xl border border-forest/15 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-foreground">
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-forest/10 text-[11px]">
                      <span className="font-bold text-forest">Filtrar por Categoría</span>
                      {selectedCategory !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('ALL');
                            setCategoryDropdownOpen(false);
                          }}
                          className="text-[10px] text-destructive hover:underline font-semibold"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('ALL');
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${selectedCategory === 'ALL' ? 'bg-forest/10 text-forest font-bold' : 'hover:bg-forest/5 text-foreground'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-forest" />
                          <span>Todas las categorías</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-forest/5 text-muted-foreground font-bold">
                          {templates.length}
                        </span>
                      </button>

                      {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
                        const countForCat = templates.filter(t => t.category === key).length;
                        const IconComp = cat.icon;
                        const isSelected = selectedCategory === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(key);
                              setCategoryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${isSelected ? 'bg-forest/10 text-forest font-bold' : 'hover:bg-forest/5 text-foreground'
                              }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <IconComp className={`w-3.5 h-3.5 shrink-0 ${cat.color}`} />
                              <span className="truncate">{cat.label}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-forest/5 text-muted-foreground font-bold">
                              {countForCat}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Chip */}
              {selectedCategory !== 'ALL' && (
                <div className="hidden lg:flex items-center gap-1.5 py-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-forest bg-forest/10 border border-forest/20 shadow-2xs shrink-0">
                    <span>{CATEGORY_MAP[selectedCategory]?.label || selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('ALL')}
                      className="p-0.5 hover:bg-forest/10 rounded-full transition-colors text-forest/70 hover:text-forest"
                      title="Quitar filtro"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-forest/10 shadow-xs space-y-4 animate-pulse">
              <div className="flex items-center justify-between gap-2">
                <div className="h-6 w-24 bg-slate-100 rounded-xl" />
                <div className="h-4 w-4 bg-slate-100 rounded-md" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-2/3 bg-slate-200 rounded-md" />
                <div className="h-3 w-full bg-slate-100 rounded-md" />
                <div className="h-3 w-5/6 bg-slate-100 rounded-md" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="h-5 w-16 bg-slate-100 rounded-lg" />
                <div className="h-5 w-16 bg-slate-100 rounded-lg" />
              </div>
              <div className="border-t border-forest/5 pt-3.5 flex items-center justify-between">
                <div className="h-3 w-28 bg-slate-100 rounded-md" />
                <div className="h-6 w-16 bg-slate-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-forest/40" />
          </div>
          <h3 className="text-base font-bold text-forest">No se encontraron formularios</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Crea un nuevo formulario dinámico con el constructor tipo Google Forms o genera el paquete de plantillas predeterminadas de Ceiba Roots.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => handleOpenEditor('new')}
              className="px-5 py-2.5 bg-forest text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Crear Formulario
            </button>
            <button
              onClick={handleSeedDefaults}
              className="px-5 py-2.5 bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold rounded-xl inline-flex items-center gap-2 border border-forest/15 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Generar Plantillas Predeterminadas
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedTemplates.map((tpl) => {
              const cat = CATEGORY_MAP[tpl.category] || CATEGORY_MAP.GENERAL;
              const IconComp = cat.icon;
              const sectionsCount = tpl.schema?.length || 0;
              const fieldsCount = (tpl.schema || []).reduce((acc, sec) => acc + (sec.fields?.length || 0), 0);
              const isBeingDragged = draggingForm?.id === tpl.id;

              return (
                <div
                  key={tpl.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', tpl.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingForm(tpl);
                  }}
                  onDragEnd={() => {
                    setDraggingForm(null);
                    setIsOverDropTrash(false);
                  }}
                  onClick={() => handleOpenEditor(tpl.id)}
                  className={`bg-white rounded-3xl p-5 border border-forest/10 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group flex flex-col justify-between space-y-4 hover:border-forest/30 select-none ${isBeingDragged ? 'opacity-40 scale-95 border-dashed border-forest/50 ring-2 ring-forest/30' : ''
                    }`}
                >
                  <div className="space-y-3">
                    {/* Top Bar: Category Badge + Status + Drag Grip */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${cat.bg} ${cat.color}`}>
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </span>

                      <div className="flex items-center gap-1 text-muted-foreground/40 group-hover:text-forest/70 transition-colors" title="Arrastra este formulario para eliminarlo">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-sm text-forest group-hover:text-forest-light transition-colors line-clamp-1">
                        {tpl.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {tpl.description || 'Sin descripción orientativa.'}
                      </p>
                    </div>

                    {/* Schema Summary pills */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-semibold text-forest/70 bg-forest/5 px-2 py-0.5 rounded-lg border border-forest/10 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-forest" />
                        <span>{sectionsCount} {sectionsCount === 1 ? 'paso' : 'pasos'}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-forest/70 bg-forest/5 px-2 py-0.5 rounded-lg border border-forest/10 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-forest" />
                        <span>{fieldsCount} {fieldsCount === 1 ? 'campo' : 'campos'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions Toolbar */}
                  <div className="pt-3 border-t border-forest/5 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditor(tpl.id);
                        }}
                        className="px-3 py-1.5 bg-forest/5 hover:bg-forest text-forest hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 group-hover:bg-forest group-hover:text-white"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(tpl, e)}
                        className="p-1.5 text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-lg transition-colors"
                        title="Copiar enlace"
                      >
                        {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(tpl, e)}
                        className="p-1.5 text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-lg transition-colors"
                        title="Duplicar formulario"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(tpl.id, tpl.title, e)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Eliminar formulario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleTogglePublish(tpl, e)}
                      className={`text-[8px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${tpl.is_published
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      title={tpl.is_published ? 'Click para cambiar a borrador' : 'Click para publicar'}
                    >
                      {tpl.is_published ? 'Publicado' : 'Borrador'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Control */}
          <PaginationControl
            currentPage={validCurrentPage}
            pageSize={pageSize}
            totalItems={filteredTemplates.length}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="formularios"
          />

          {/* FIXED BOTTOM DRAG-AND-DROP TRASH ZONE (DESKTOP ONLY) */}
          {draggingForm && (
            <div
              className={`hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg transition-all duration-200 ease-out animate-in slide-in-from-bottom-8 fade-in ${isOverDropTrash ? 'scale-105' : 'scale-100'
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setIsOverDropTrash(true);
              }}
              onDragLeave={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (
                  e.clientX < rect.left ||
                  e.clientX > rect.right ||
                  e.clientY < rect.top ||
                  e.clientY > rect.bottom
                ) {
                  setIsOverDropTrash(false);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const target = draggingForm;
                setDraggingForm(null);
                setIsOverDropTrash(false);
                if (target) {
                  handleDelete(target.id, target.title);
                }
              }}
            >
              <div
                className={`p-4 sm:p-5 rounded-3xl border-2 shadow-2xl backdrop-blur-md flex items-center justify-center gap-3.5 transition-all text-center ${isOverDropTrash
                  ? 'bg-rose-600 border-rose-300 text-white shadow-rose-900/60 ring-4 ring-rose-400/40'
                  : 'bg-stone-900/90 border-rose-500/50 text-rose-100 shadow-stone-950/60'
                  }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform ${isOverDropTrash ? 'bg-white text-rose-600 scale-110 rotate-12 shadow-md' : 'bg-rose-500/20 text-rose-400'
                    }`}
                >
                  <Trash2 className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold tracking-tight">
                    {isOverDropTrash ? '¡Soltá aquí para Eliminar!' : 'Arrastrá aquí para eliminar formulario'}
                  </p>
                  <p className={`text-[11px] truncate max-w-xs sm:max-w-sm ${isOverDropTrash ? 'text-rose-100' : 'text-rose-300/80'}`}>
                    "{draggingForm.title}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MOBILE FLOATING ACTION BUTTON (ROUND) */}
      <button
        type="button"
        onClick={() => handleOpenEditor('new')}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl shadow-forest/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-2 border-white/20"
        title="Crear Nuevo Formulario"
        aria-label="Crear Nuevo Formulario"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

    </div>
  );
};

export default FormsSection;
