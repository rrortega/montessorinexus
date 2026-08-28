import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Layers,
  Plus,
  Search,
  Sparkles,
  Pencil,
  Trash2,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  X,
  Eye,
  Folder,
  FolderOpen,
  Filter,
  Check
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
  MontessoriAreaItem,
  MontessoriCategoryItem,
  MontessoriLessonItem,
  getMontessoriCurriculum,
  deleteMontessoriLesson
} from '@/lib/sqlite';
import { MontessoriLessonDrawer } from '@/components/admin/MontessoriLessonDrawer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const CurriculumSection: React.FC = () => {
  const { role } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  const [curriculum, setCurriculum] = useState<MontessoriAreaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state & auto-expand
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Multiple Choice Areas Selection (all selected by default)
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  // Accordion expansion states
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Drawer & Modal states
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [defaultLessonAreaId, setDefaultLessonAreaId] = useState<string>('');
  const [defaultLessonCategoryId, setDefaultLessonCategoryId] = useState<string>('');
  const [selectedLessonForDetail, setSelectedLessonForDetail] = useState<any | null>(null);

  // Confirm delete dialog state
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMontessoriCurriculum();
      setCurriculum(data);

      // Default: select all areas
      setSelectedAreaIds(data.map(a => a.id));

      // Default: expand all areas and categories
      const initialAreas: Record<string, boolean> = {};
      const initialCategories: Record<string, boolean> = {};
      data.forEach((area) => {
        initialAreas[area.id] = true;
        area.categories.forEach(cat => {
          initialCategories[cat.id] = true;
        });
      });
      setExpandedAreas(initialAreas);
      setExpandedCategories(initialCategories);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar catálogo de fichas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats calculation
  const totalLessons = useMemo(() => {
    return curriculum.reduce((acc, area) => {
      return acc + area.categories.reduce((cAcc, cat) => cAcc + cat.lessons.length, 0);
    }, 0);
  }, [curriculum]);

  const totalCategories = useMemo(() => {
    return curriculum.reduce((acc, area) => acc + area.categories.length, 0);
  }, [curriculum]);

  // Filtered curriculum based on Multiple Selected Areas and Search
  const filteredCurriculum = useMemo(() => {
    return curriculum
      .filter(area => selectedAreaIds.includes(area.id))
      .map(area => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return area;

        const filteredCategories = area.categories
          .map(cat => {
            const filteredLessons = cat.lessons.filter(l =>
              l.name.toLowerCase().includes(q) ||
              (l.pedagogicalPurpose && l.pedagogicalPurpose.toLowerCase().includes(q)) ||
              (l.description && l.description.toLowerCase().includes(q))
            );
            const catMatches = cat.name.toLowerCase().includes(q);
            return {
              ...cat,
              lessons: catMatches ? cat.lessons : filteredLessons
            };
          })
          .filter(cat => cat.lessons.length > 0 || cat.name.toLowerCase().includes(q));

        return {
          ...area,
          categories: filteredCategories
        };
      })
      .filter(area => area.categories.length > 0 || area.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [curriculum, selectedAreaIds, searchQuery]);

  // Auto-expand all when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const openAreas: Record<string, boolean> = {};
      const openCats: Record<string, boolean> = {};
      filteredCurriculum.forEach(area => {
        openAreas[area.id] = true;
        area.categories.forEach(cat => {
          openCats[cat.id] = true;
        });
      });
      setExpandedAreas(prev => ({ ...prev, ...openAreas }));
      setExpandedCategories(prev => ({ ...prev, ...openCats }));
    }
  }, [searchQuery, filteredCurriculum]);

  const handleOpenSearch = () => {
    setIsSearchExpanded(true);
    setIsAreaDropdownOpen(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleCloseSearch = () => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  };

  // Toggle individual area in multi-select
  const handleToggleAreaSelection = (areaId: string) => {
    setSelectedAreaIds(prev => {
      if (prev.includes(areaId)) {
        return prev.filter(id => id !== areaId);
      } else {
        return [...prev, areaId];
      }
    });
  };

  // Toggle all areas
  const handleToggleAllAreas = () => {
    if (selectedAreaIds.length === curriculum.length) {
      setSelectedAreaIds([]);
    } else {
      setSelectedAreaIds(curriculum.map(a => a.id));
    }
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const expandAll = () => {
    const allAreas: Record<string, boolean> = {};
    const allCats: Record<string, boolean> = {};
    curriculum.forEach(area => {
      allAreas[area.id] = true;
      area.categories.forEach(cat => {
        allCats[cat.id] = true;
      });
    });
    setExpandedAreas(allAreas);
    setExpandedCategories(allCats);
  };

  const collapseAll = () => {
    setExpandedAreas({});
    setExpandedCategories({});
  };

  const handleOpenAddLesson = (areaId?: string, catId?: string) => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores pueden gestionar fichas de trabajo.');
      return;
    }
    setEditingLesson(null);
    setDefaultLessonAreaId(areaId || curriculum[0]?.id || '');
    setDefaultLessonCategoryId(catId || curriculum[0]?.categories[0]?.id || '');
    setLessonDrawerOpen(true);
  };

  const handleOpenEditLesson = (lesson: any, catId: string) => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores pueden editar fichas de trabajo.');
      return;
    }
    setEditingLesson({ ...lesson, categoryId: catId });
    setLessonDrawerOpen(true);
  };

  const handleExecuteDeleteLesson = async () => {
    if (!confirmDelete.id || !isOwnerOrAdmin) return;
    try {
      await deleteMontessoriLesson(confirmDelete.id);
      toast.success(`Ficha "${confirmDelete.name}" eliminada correctamente.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar ficha');
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
                  Fichas de Trabajo Montessori
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {curriculum.length} áreas • {totalCategories} categorías • {totalLessons} fichas
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Catálogo institucional de áreas curriculares, categorías temáticas y presentaciones pedagógicas.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 shrink-0">
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => handleOpenAddLesson()}
                className="px-4 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-forest" />
                <span>Nueva Ficha de Trabajo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR (DYNAMIC EXPANDABLE SEARCH) */}
      <div className="flex items-center gap-3 min-h-[42px] transition-all">
        {isSearchExpanded ? (
          /* EXPANDED FULL-WIDTH SEARCH INPUT */
          <div className="w-full flex items-center gap-2 bg-white rounded-2xl border-2 border-forest p-1.5 shadow-xs animate-in fade-in zoom-in-95 duration-200">
            <Search className="w-4 h-4 text-forest ml-2 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe para buscar por ficha, categoría o propósito pedagógico..."
              className="w-full text-xs text-forest bg-transparent border-none focus:outline-none placeholder:text-muted-foreground font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-lg text-muted-foreground hover:text-forest transition-colors cursor-pointer text-[10px] font-mono font-bold px-2 bg-forest/5"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseSearch}
              className="p-1.5 rounded-xl text-forest/60 hover:text-forest hover:bg-forest/10 transition-colors cursor-pointer shrink-0"
              title="Cerrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* NORMAL STATE: SEARCH BUTTON ON LEFT, EXPAND CONTROLS & MULTI-CHOICE ON RIGHT */
          <div className="w-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Left: Search Trigger Icon Button & Expand/Collapse shortcuts */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenSearch}
                className="p-2.5 bg-white hover:bg-forest/5 text-forest/80 hover:text-forest rounded-2xl border border-forest/15 shadow-2xs flex items-center gap-2 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Buscar fichas o lecciones"
              >
                <Search className="w-4 h-4 text-forest" />
                <span className="hidden sm:inline text-xs text-forest/70 font-normal">Buscar fichas...</span>
              </button>

              <div className="flex items-center gap-1 bg-white/80 border border-forest/10 p-1 rounded-2xl shadow-2xs">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-1 text-[11px] font-semibold text-forest/80 hover:text-forest hover:bg-forest/10 rounded-xl transition-colors cursor-pointer"
                  title="Desplegar todas las áreas y categorías"
                >
                  Expandir Todo
                </button>
                <span className="text-forest/20 text-xs">|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-1 text-[11px] font-semibold text-forest/80 hover:text-forest hover:bg-forest/10 rounded-xl transition-colors cursor-pointer"
                  title="Colapsar todas las áreas"
                >
                  Colapsar Todo
                </button>
              </div>
            </div>

            {/* Right: Custom Multiple-Choice Dropdown for Areas */}
            <div className="relative" ref={areaDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center justify-between sm:justify-start gap-2.5 shadow-2xs transition-all cursor-pointer ${selectedAreaIds.length === curriculum.length
                  ? 'bg-white text-forest border-forest/20 hover:border-forest/40'
                  : selectedAreaIds.length > 0
                    ? 'bg-forest/5 text-forest border-forest shadow-xs'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-forest shrink-0" />
                  <span>
                    Filtrar Áreas ({selectedAreaIds.length}/{curriculum.length})
                  </span>
                </div>

                {/* Color dots preview */}
                <div className="flex items-center -space-x-1 shrink-0">
                  {curriculum.slice(0, 4).map(a => (
                    <span
                      key={a.id}
                      className={`w-2.5 h-2.5 rounded-full ring-1 ring-white ${selectedAreaIds.includes(a.id) ? 'opacity-100' : 'opacity-30'
                        }`}
                      style={{ backgroundColor: a.color || '#1b3b2b' }}
                    />
                  ))}
                  {curriculum.length > 4 && (
                    <span className="text-[9px] text-muted-foreground font-mono pl-1.5">
                      +{curriculum.length - 4}
                    </span>
                  )}
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-forest/60 transition-transform ${isAreaDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* DROPDOWN MENU */}
              {isAreaDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl p-3 shadow-xl border border-forest/15 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-forest/10 px-1">
                    <span className="text-xs font-bold text-forest">Selección de Áreas</span>
                    <button
                      type="button"
                      onClick={handleToggleAllAreas}
                      className="text-[11px] font-bold text-forest hover:underline cursor-pointer"
                    >
                      {selectedAreaIds.length === curriculum.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </button>
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                    {curriculum.map((area) => {
                      const isSelected = selectedAreaIds.includes(area.id);
                      const areaLessonCount = area.categories.reduce((acc, c) => acc + c.lessons.length, 0);

                      return (
                        <label
                          key={area.id}
                          onClick={() => handleToggleAreaSelection(area.id)}
                          className={`p-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-forest/5 hover:bg-forest/10 font-bold text-forest' : 'hover:bg-forest/5 text-muted-foreground'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-forest border-forest text-white' : 'border-forest/30 bg-white'
                                }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: area.color || '#1b3b2b' }}
                            />

                            <span className="text-xs truncate">{area.name}</span>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground font-normal shrink-0">
                            {areaLessonCount} {areaLessonCount === 1 ? 'ficha' : 'fichas'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULL-WIDTH ACCORDION STRUCTURE */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Cargando catálogo de fichas de trabajo...
        </div>
      ) : filteredCurriculum.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest/10 space-y-3">
          <BookOpen className="w-12 h-12 text-forest/30 mx-auto" />
          <h3 className="font-display font-bold text-forest text-base">No se encontraron fichas de trabajo</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {selectedAreaIds.length === 0
              ? 'Has deseleccionado todas las áreas. Selecciona al menos una en el menú de áreas.'
              : 'Prueba ajustando el término de búsqueda o registra una nueva ficha pedagógica.'}
          </p>
          {selectedAreaIds.length === 0 ? (
            <button
              type="button"
              onClick={() => setSelectedAreaIds(curriculum.map(a => a.id))}
              className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Check className="w-4 h-4" />
              <span>Seleccionar Todas las Áreas</span>
            </button>
          ) : isOwnerOrAdmin ? (
            <button
              type="button"
              onClick={() => handleOpenAddLesson()}
              className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Ficha</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCurriculum.map((area) => {
            const isAreaOpen = !!expandedAreas[area.id];
            const areaLessonsCount = area.categories.reduce((acc, c) => acc + c.lessons.length, 0);

            return (
              <div
                key={area.id}
                className="bg-white/90 backdrop-blur-sm rounded-3xl border border-forest/10 shadow-xs overflow-hidden transition-all"
              >
                {/* LEVEL 1: AREA ACCORDION HEADER (FULL WIDTH) */}
                <div
                  onClick={() => toggleArea(area.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-forest/5 transition-colors border-b border-forest/10 select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-forest/60 hover:text-forest transition-transform"
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${isAreaOpen ? 'rotate-0' : '-rotate-90'
                          }`}
                      />
                    </button>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                        style={{ backgroundColor: area.color || '#1b3b2b' }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{area.name}</span>
                      </span>

                      <span className="text-xs text-muted-foreground font-mono shrink-0 whitespace-nowrap">
                        ({area.categories.length} categorías • {areaLessonsCount} {areaLessonsCount === 1 ? 'ficha' : 'fichas'})
                      </span>
                    </div>

                    {area.description && (
                      <span className="hidden lg:inline-block text-xs text-muted-foreground/80 leading-snug">
                        — {area.description}
                      </span>
                    )}
                  </div>

                  {/* Actions on Area Header */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddLesson(area.id)}
                        className="px-3 py-1.5 bg-forest/10 hover:bg-forest/20 text-forest font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ficha en {area.name}</span>
                        <span className="sm:hidden">Ficha</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* LEVEL 1 BODY: CATEGORIES LIST */}
                {isAreaOpen && (
                  <div className="p-3 sm:p-5 space-y-3 bg-cream/20">
                    {area.categories.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No hay categorías registradas en esta área.
                      </div>
                    ) : (
                      area.categories.map((cat) => {
                        const isCatOpen = !!expandedCategories[cat.id];

                        return (
                          <div
                            key={cat.id}
                            className="bg-white rounded-2xl border border-forest/10 shadow-2xs overflow-hidden transition-all"
                          >
                            {/* LEVEL 2: CATEGORY SUB-ACCORDION HEADER (FULL WIDTH) */}
                            <div
                              onClick={() => toggleCategory(cat.id)}
                              className="p-3.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-forest/5 transition-colors select-none"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  className="p-0.5 rounded text-forest/60 hover:text-forest transition-transform"
                                >
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${isCatOpen ? 'rotate-0' : '-rotate-90'
                                      }`}
                                  />
                                </button>

                                <div className="flex items-center gap-2 min-w-0">
                                  {isCatOpen ? (
                                    <FolderOpen className="w-4 h-4 text-forest/70 shrink-0" />
                                  ) : (
                                    <Folder className="w-4 h-4 text-forest/70 shrink-0" />
                                  )}
                                  <span className="font-bold text-forest text-xs sm:text-sm truncate">
                                    {cat.name}
                                  </span>
                                  <span className="text-[11px] font-mono text-muted-foreground">
                                    ({cat.lessons.length} {cat.lessons.length === 1 ? 'ficha' : 'fichas'})
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {isOwnerOrAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddLesson(area.id, cat.id)}
                                    className="p-1 px-2 rounded-lg text-forest/70 hover:text-forest hover:bg-forest/10 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Agregar ficha a esta categoría"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Ficha</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* LEVEL 3: LESSONS FULL-WIDTH ROWS */}
                            {isCatOpen && (
                              <div className="border-t border-forest/10 divide-y divide-forest/5 bg-cream/10">
                                {cat.lessons.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                                    Sin fichas registradas en esta categoría.
                                  </div>
                                ) : (
                                  cat.lessons.map((les) => (
                                    <div
                                      key={les.id}
                                      className="p-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-forest/5 transition-colors group"
                                    >
                                      {/* Left Info: Name, age range, purpose */}
                                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                        <div
                                          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 sm:mt-0"
                                          style={{ backgroundColor: area.color || '#1b3b2b' }}
                                        />

                                        <div className="space-y-0.5 min-w-0 flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                              onClick={() => setSelectedLessonForDetail({
                                                ...les,
                                                categoryName: cat.name,
                                                areaName: area.name,
                                                areaId: area.id,
                                                areaColor: area.color
                                              })}
                                              className="font-bold text-forest text-xs sm:text-sm hover:underline cursor-pointer"
                                            >
                                              {les.name}
                                            </span>

                                            {(les.minAgeYears || les.maxAgeYears) && (
                                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest/10 text-forest font-mono flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                <span>{les.minAgeYears || '3'} a {les.maxAgeYears || '6'} años</span>
                                              </span>
                                            )}
                                          </div>

                                          {les.pedagogicalPurpose && (
                                            <p className="text-[11px] text-muted-foreground truncate max-w-xl">
                                              <strong className="text-forest/70 font-semibold">Propósito:</strong> {les.pedagogicalPurpose}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Right Actions Toolbar */}
                                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedLessonForDetail({
                                            ...les,
                                            categoryName: cat.name,
                                            areaName: area.name,
                                            areaId: area.id,
                                            areaColor: area.color
                                          })}
                                          className="px-2.5 py-1 rounded-xl text-xs font-semibold text-forest/80 hover:text-forest bg-forest/5 hover:bg-forest/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                                          title="Ver detalle pedagógico completo"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span className="hidden md:inline">Detalle</span>
                                        </button>

                                        {isOwnerOrAdmin && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditLesson(les, cat.id)}
                                              className="p-1.5 rounded-xl text-forest/70 hover:text-forest hover:bg-forest/10 transition-colors cursor-pointer"
                                              title="Editar ficha de trabajo"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setConfirmDelete({ isOpen: true, id: les.id, name: les.name })}
                                              className="p-1.5 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                              title="Eliminar ficha"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER FOR CREATING & EDITING MONTESSORI LESSON */}
      <MontessoriLessonDrawer
        isOpen={lessonDrawerOpen}
        onClose={() => setLessonDrawerOpen(false)}
        curriculum={curriculum}
        initialLesson={editingLesson}
        defaultAreaId={defaultLessonAreaId}
        defaultCategoryId={defaultLessonCategoryId}
        onSaved={() => {
          setLessonDrawerOpen(false);
          loadData();
        }}
      />

      {/* PEDAGOGICAL DETAIL MODAL */}
      {selectedLessonForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-forest/10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-forest/10 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: selectedLessonForDetail.areaColor || '#1b3b2b' }}
                  >
                    {selectedLessonForDetail.areaName || 'Montessori'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {selectedLessonForDetail.categoryName}
                  </span>
                </div>
                <h3 className="font-display font-bold text-forest text-lg leading-tight">
                  {selectedLessonForDetail.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLessonForDetail(null)}
                className="p-1.5 rounded-xl hover:bg-forest/10 text-forest/70 hover:text-forest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {(selectedLessonForDetail.minAgeYears || selectedLessonForDetail.maxAgeYears) && (
                <div className="flex items-center gap-2 text-forest/80 bg-forest/5 p-2.5 rounded-xl">
                  <Clock className="w-4 h-4 text-forest shrink-0" />
                  <span>
                    Rango de edad sugerido: <strong>{selectedLessonForDetail.minAgeYears || '3'} a {selectedLessonForDetail.maxAgeYears || '6'} años</strong>
                  </span>
                </div>
              )}

              {/* PROPÓSITO PEDAGÓGICO (SOLO GUÍAS) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-amber-950 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Propósito Pedagógico (Guías & Docentes)</span>
                  </strong>
                  <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-amber-200 text-amber-900">
                    Solo Guías
                  </span>
                </div>
                <p className="text-amber-950 leading-relaxed">
                  {selectedLessonForDetail.pedagogicalPurpose || 'Sin propósito pedagógico detallado.'}
                </p>
                {selectedLessonForDetail.description && (
                  <div className="pt-2 border-t border-amber-200/60 mt-2">
                    <span className="font-bold text-[10px] uppercase text-amber-900 block">Materiales & Control de Error:</span>
                    <p className="text-amber-900/90 leading-relaxed">{selectedLessonForDetail.description}</p>
                  </div>
                )}
              </div>

              {/* INFORMACIÓN PARA PADRES DE FAMILIA */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-emerald-950 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span>👨‍👩‍👧 Información para Padres de Familia</span>
                  </strong>
                  <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
                    Portal Familiar
                  </span>
                </div>
                <p className="text-emerald-950 leading-relaxed">
                  {selectedLessonForDetail.parentInfo || 'Explicación general sobre cómo este material fortalece el desarrollo, concentración e independencia del infante.'}
                </p>
              </div>

              {/* RECURSOS MULTIMEDIA & ASSETS */}
              {(() => {
                let assets: any[] = [];
                if (Array.isArray(selectedLessonForDetail.mediaAssets)) {
                  assets = selectedLessonForDetail.mediaAssets;
                } else if (typeof selectedLessonForDetail.mediaAssets === 'string') {
                  try { assets = JSON.parse(selectedLessonForDetail.mediaAssets); } catch { }
                }
                if (assets.length === 0) return null;

                return (
                  <div className="p-4 rounded-2xl bg-white border border-forest/15 space-y-2.5">
                    <strong className="text-forest font-bold uppercase tracking-wider text-[10px] block">
                      Recursos & Guías Adjuntas ({assets.length})
                    </strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {assets.map((asset: any) => (
                        <a
                          key={asset.id}
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-forest/5 hover:bg-forest/10 border border-forest/10 flex items-center justify-between gap-2 transition-all hover:scale-[1.01]"
                        >
                          <div className="truncate">
                            <span className="font-bold text-forest block truncate text-xs">{asset.title}</span>
                            <span className="text-[10px] uppercase font-mono text-muted-foreground">{asset.type}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-2 border-t border-forest/10 flex items-center justify-between">
              {isOwnerOrAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    const l = selectedLessonForDetail;
                    setSelectedLessonForDetail(null);
                    handleOpenEditLesson(l, l.categoryId);
                  }}
                  className="px-4 py-2 text-xs font-bold text-forest bg-forest/10 hover:bg-forest/20 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Ficha</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedLessonForDetail(null)}
                className="px-4 py-2 bg-forest text-white font-bold rounded-xl text-xs hover:bg-forest/90 cursor-pointer shadow-2xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={confirmDelete.isOpen}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, isOpen: open }))}
        title="¿Eliminar ficha de trabajo?"
        description={`¿Estás seguro de que deseas eliminar permanentemente la ficha "${confirmDelete.name}"? Los registros históricos asociados se mantendrán pero la ficha ya no aparecerá en el catálogo.`}
        confirmText="Sí, Eliminar Ficha"
        variant="destructive"
        onConfirm={handleExecuteDeleteLesson}
      />

    </div>
  );
};
