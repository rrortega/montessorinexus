import React, { useState } from 'react';
import {
  Layers,
  PanelTop,
  Layout,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  Grid,
  CheckCircle2,
  Layers2,
  Quote,
  Clock,
  HelpCircle,
  MapPin,
  MessageCircle,
  Users,
  Video,
  Award,
  BookOpen,
  Compass,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Check,
  Settings2,
  Calendar,
  Phone,
  Mail,
  GripVertical
} from 'lucide-react';

export interface WebSectionItem {
  id: string;
  type: string;
  name: string;
  name_en?: string;
  badge?: string;
  badge_en?: string;
  title: string;
  title_en?: string;
  subtitle?: string;
  subtitle_en?: string;
  isEnabled: boolean;
  ctaText?: string;
  ctaText_en?: string;
  ctaUrl?: string;
  layoutVariant?: string;
  showInMenu?: boolean;
  menuLabel?: string;
  menuLabel_en?: string;
  anchor?: string;
  config?: Record<string, any>;
}

export interface SectionTemplate {
  type: string;
  name: string;
  category: 'methodology' | 'programs' | 'trust' | 'conversion';
  categoryLabel: string;
  description: string;
  icon: React.ElementType;
  badgeDefault?: string;
  titleDefault: string;
  subtitleDefault?: string;
  ctaDefault?: string;
  tag: string;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  // 1. Estructura & Metodología
  {
    type: 'pillars_mosaic',
    name: 'Mosaico de Tarjetas & Pilares',
    category: 'methodology',
    categoryLabel: 'Estructura & Metodología',
    description: 'Cuadrícula de 6 tarjetas de colores con iconos, pilares formativos y bloque destacado de misión.',
    icon: Grid,
    badgeDefault: 'Nuestros Pilares',
    titleDefault: 'Quiénes somos y qué nos representa',
    subtitleDefault: 'Los principios formativos que guían cada jornada en nuestro colegio.',
    ctaDefault: '',
    tag: 'Mosaico 2x3'
  },
  {
    type: 'feature_cards_row',
    name: 'Tarjetas de Valores en Fila',
    category: 'methodology',
    categoryLabel: 'Estructura & Metodología',
    description: '4 tarjetas limpias horizontales con iconos de contorno para valores, filosofía y certificaciones.',
    icon: Layers2,
    badgeDefault: 'Fundamentos',
    titleDefault: 'Somos un equipo de guías y expertos en pedagogía',
    subtitleDefault: 'Ofrecemos un entorno formativo que respeta el ritmo de desarrollo.',
    tag: 'Fila 4 Col'
  },
  {
    type: 'feature_list_media',
    name: 'Diferenciadores con Imagen Lateral',
    category: 'methodology',
    categoryLabel: 'Estructura & Metodología',
    description: 'Fotografía orgánica a la izquierda con stickers + columna de características con iconos.',
    icon: Compass,
    badgeDefault: 'Por Qué Elegirnos',
    titleDefault: '¿Por qué elegir nuestra propuesta educativa?',
    subtitleDefault: 'Respeto al ritmo individual, autodisciplina y ambientes preparados.',
    tag: 'Media + Lista'
  },
  {
    type: 'timeline_steps',
    name: 'Línea de Proceso / Pasos Conectados',
    category: 'methodology',
    categoryLabel: 'Estructura & Metodología',
    description: 'Pasos numerados con iconos y línea conectora para procesos de admisión o etapas.',
    icon: Clock,
    badgeDefault: 'Proceso de Admisión',
    titleDefault: 'Paso a paso para formar parte de nuestra comunidad',
    subtitleDefault: 'Un camino claro, cálido y personalizado para cada familia.',
    ctaDefault: 'Iniciar Proceso de Admisión',
    tag: 'Timeline 4 Pasos'
  },

  // 2. Oferta Educativa & Historia
  {
    type: 'programs_showcase',
    name: 'Tarjetas de Programas con Marco Ondulado',
    category: 'programs',
    categoryLabel: 'Oferta Educativa & Historia',
    description: '3 columnas con fotos onduladas, rangos de edades y botón de acción individual.',
    icon: BookOpen,
    badgeDefault: 'Oferta Educativa',
    titleDefault: 'Un ambiente preparado para cada etapa',
    subtitleDefault: 'Desde los primeros pasos hasta el pensamiento abstracto.',
    ctaDefault: 'Quiero Informes',
    tag: 'Tarjetas 3 Col'
  },
  {
    type: 'program_levels_cards',
    name: 'Tarjetas de Niveles / Etapas Educativas',
    category: 'programs',
    categoryLabel: 'Oferta Educativa & Historia',
    description: '2 a 3 columnas con fotos superiores redondeadas, rango de edad, descripción y botón outline.',
    icon: Award,
    badgeDefault: 'Programas Educativos',
    titleDefault: 'Un camino para cada etapa de desarrollo',
    subtitleDefault: 'Libres de pensar, capaces de transformar.',
    ctaDefault: 'Descubrir Programa',
    tag: 'Niveles 2-3 Col'
  },
  {
    type: 'split_media_benefits',
    name: 'Sección Dividida: Media & Beneficios',
    category: 'programs',
    categoryLabel: 'Oferta Educativa & Historia',
    description: 'Marco fotográfico orgánico + titular + lista de beneficios con checks + doble botón.',
    icon: Sparkles,
    badgeDefault: 'Nuestra Escuela',
    titleDefault: 'Nuestra Escuela y Comunidad Viva',
    subtitleDefault: 'Instalaciones creadas para satisfacer las necesidades formativas.',
    ctaDefault: 'Agendar una Cita',
    tag: 'Split + Checks'
  },
  {
    type: 'story_split_slider',
    name: 'Historia & Narrativa con Slider',
    category: 'programs',
    categoryLabel: 'Oferta Educativa & Historia',
    description: 'Relato institucional a la izquierda + tarjeta con carrusel de fotografías históricas.',
    icon: BookOpen,
    badgeDefault: 'Nuestra Historia',
    titleDefault: 'Creciendo con raíces firmes y visión abierta',
    subtitleDefault: 'Inspirados en una educación que nutre la mente y el corazón.',
    tag: 'Historia + Slider'
  },
  {
    type: 'quote_banner_artistic',
    name: 'Cita Editorial / Frase de Inspiración',
    category: 'programs',
    categoryLabel: 'Oferta Educativa & Historia',
    description: 'Frase inspiradora con tipografía editorial sobre fondo de marca de agua artística.',
    icon: Quote,
    titleDefault: 'Libera el potencial del niño y lo transformarás en el mundo.',
    subtitleDefault: 'Dra. María Montessori',
    ctaDefault: 'Conocer Nuestro Método',
    tag: 'Cita Inspiracional'
  },

  // 3. Prueba Social, Medios & Confianza
  {
    type: 'testimonials_slider',
    name: 'Carrusel de Testimonios & Reseñas',
    category: 'trust',
    categoryLabel: 'Prueba Social & Confianza',
    description: 'Tarjeta orgánica con comillas, relato testimonial, autor y controles interactivos.',
    icon: Quote,
    badgeDefault: 'Testimonios',
    titleDefault: 'Lo que dicen las familias que confían en nosotros',
    subtitleDefault: 'Experiencias reales de padres y alumnos en nuestro colegio.',
    tag: 'Carrusel Citas'
  },
  {
    type: 'metrics_stats_banner',
    name: 'Franja de Métricas & Impacto',
    category: 'trust',
    categoryLabel: 'Prueba Social & Confianza',
    description: 'Cinta de alto contraste con 4 métricas gigantes (ej. 10+ Años, 100% Certificadas).',
    icon: Award,
    titleDefault: 'Cifras que respaldan nuestro compromiso',
    tag: 'Métricas 4x'
  },
  {
    type: 'gallery_masonry_tabs',
    name: 'Galería con Filtros por Categoría',
    category: 'trust',
    categoryLabel: 'Prueba Social & Confianza',
    description: 'Pestañas interactivas de filtrado (Ambientes, Trabajo, Naturaleza) + mosaico dinámico.',
    icon: Grid,
    badgeDefault: 'Galería',
    titleDefault: 'Explorando el mundo: Niños en acción',
    subtitleDefault: 'Ambientes preparados, materiales y vida práctica en el aula.',
    tag: 'Galería con Tabs'
  },
  {
    type: 'teachers_team',
    name: 'Equipo de Guías & Docentes',
    category: 'trust',
    categoryLabel: 'Prueba Social & Confianza',
    description: 'Cuadrícula de perfiles de guías Montessori con credenciales, foto y especialidad.',
    icon: Users,
    badgeDefault: 'Equipo Docente',
    titleDefault: 'Guías preparadas y comprometidas',
    subtitleDefault: 'Acompañantes certificados que facilitan el desarrollo.',
    tag: 'Grid Equipo'
  },
  {
    type: 'video_showcase',
    name: 'Video Promocional / Tour Virtual',
    category: 'trust',
    categoryLabel: 'Prueba Social & Confianza',
    description: 'Marco multimedia con botón play flotante para ver las instalaciones en acción.',
    icon: Video,
    badgeDefault: 'Tour Virtual',
    titleDefault: 'Conocé nuestras instalaciones en video',
    subtitleDefault: 'Un recorrido por los salones y áreas al aire libre.',
    tag: 'Video Showcase'
  },

  // 4. Conversión, Soporte & Cierre
  {
    type: 'cta_banner_contrast',
    name: 'Banner de Llamado a la Acción (CTA)',
    category: 'conversion',
    categoryLabel: 'Conversión & Cierre',
    description: 'Fondo de contraste profundo, titular de gran impacto y doble botón de acción.',
    icon: Sparkles,
    titleDefault: 'Planta hoy las raíces del futuro de tu hijo',
    subtitleDefault: 'Sumate a una comunidad que valora el respeto, la curiosidad y la excelencia.',
    ctaDefault: 'Agendar una Visita Guiada',
    tag: 'Banner CTA'
  },
  {
    type: 'faq_categorized_accordion',
    name: 'Preguntas Frecuentes con Acordeón',
    category: 'conversion',
    categoryLabel: 'Conversión & Cierre',
    description: 'Categorías a la izquierda + preguntas desplegables interactivas a la derecha.',
    icon: HelpCircle,
    badgeDefault: "FAQ's",
    titleDefault: 'Preguntas Frecuentes sobre Nuestro Colegio',
    subtitleDefault: 'Respuestas claras a las consultas más habituales de las familias.',
    tag: 'FAQ Acordeón'
  },
  {
    type: 'location_map_cta',
    name: 'Ubicación en Mapa & Contacto',
    category: 'conversion',
    categoryLabel: 'Conversión & Cierre',
    description: 'Dirección completa, mapa embebido interactivo y botón de contacto directo.',
    icon: MapPin,
    badgeDefault: 'Contacto',
    titleDefault: 'Te dejamos nuestra ubicación y vías de acceso',
    subtitleDefault: 'Fácil acceso y estacionamiento para las familias.',
    ctaDefault: 'Enviar un Mensaje',
    tag: 'Mapa + Contacto'
  },
  {
    type: 'quick_contact_form',
    name: 'Formulario de Contacto Directo',
    category: 'conversion',
    categoryLabel: 'Conversión & Cierre',
    description: 'Campos rápidos para nombre, email, teléfono, nivel escolar de interés y mensaje.',
    icon: MessageCircle,
    badgeDefault: 'Escríbenos',
    titleDefault: '¿Tenés dudas o querés saber más?',
    subtitleDefault: 'Completá tus datos y te responderemos a la brevedad.',
    ctaDefault: 'Enviar Solicitud',
    tag: 'Formulario Directo'
  }
];

export const DEFAULT_PAGE_SECTIONS: WebSectionItem[] = [
  {
    id: 'sec_why_us',
    type: 'split_media_benefits',
    name: 'Sobre Nosotros & Diferenciadores',
    badge: 'Nuestra Escuela',
    title: 'Un entorno preparado para el potencial de cada niño',
    subtitle: 'Instalaciones creadas para el aprendizaje integral y la autonomía.',
    isEnabled: true,
    showInMenu: true,
    menuLabel: 'Sobre Nosotros',
    menuLabel_en: 'About Us',
    ctaText: 'Quiero una cita'
  },
  {
    id: 'sec_pillars',
    type: 'pillars_mosaic',
    name: 'Pilares Pedagógicos & Misión',
    badge: 'Nuestros Pilares',
    title: 'Quiénes somos y qué nos representa',
    subtitle: 'Los principios formativos que guían cada jornada.',
    isEnabled: true,
    showInMenu: true,
    menuLabel: 'Nuestro Método',
    menuLabel_en: 'Our Method'
  },
  {
    id: 'sec_quote',
    type: 'quote_banner_artistic',
    name: 'Frase de Inspiración',
    title: 'Libera el potencial del niño y lo transformarás en el mundo.',
    subtitle: 'Dra. María Montessori',
    isEnabled: true,
    showInMenu: false,
    ctaText: 'Conoce Nuestro Método'
  },
  {
    id: 'sec_history',
    type: 'story_split_slider',
    name: 'Nuestra Historia & Trayectoria',
    badge: 'Nuestra Historia',
    title: 'Creciendo con raíces firmes y visión abierta',
    subtitle: 'Inspirados en una educación que nutre la mente y el corazón.',
    isEnabled: true,
    showInMenu: false,
    menuLabel: 'Historia',
    menuLabel_en: 'History'
  },
  {
    id: 'sec_metrics',
    type: 'metrics_stats_banner',
    name: 'Métricas & Impacto',
    title: 'Cifras que respaldan nuestro compromiso pedagógico',
    isEnabled: true,
    showInMenu: false
  },
  {
    id: 'sec_programs',
    type: 'programs_showcase',
    name: 'Programas Educativos',
    badge: 'Oferta Formativa',
    title: 'Un camino adaptado para cada etapa del desarrollo',
    subtitle: 'Comunidad Infantil, Casa de Niños y Taller Montessori.',
    isEnabled: true,
    showInMenu: true,
    menuLabel: 'Programas',
    menuLabel_en: 'Programs',
    ctaText: 'Quiero informes'
  },
  {
    id: 'sec_process',
    type: 'timeline_steps',
    name: 'Proceso de Admisión',
    badge: 'Admisiones',
    title: 'Paso a paso para formar parte de nuestra comunidad',
    subtitle: 'Un proceso cercano, claro y personalizado para cada familia.',
    isEnabled: true,
    showInMenu: true,
    menuLabel: 'Admisiones',
    menuLabel_en: 'Admissions',
    ctaText: 'Iniciar Proceso de Admisión'
  },
  {
    id: 'sec_gallery',
    type: 'gallery_masonry_tabs',
    name: 'Galería de Ambientes',
    badge: 'Galería',
    title: 'Explorando el mundo: Niños en acción',
    subtitle: 'Ambientes preparados, materiales de desarrollo y vida práctica.',
    isEnabled: true,
    showInMenu: true,
    menuLabel: 'Galería',
    menuLabel_en: 'Gallery'
  },
  {
    id: 'sec_guides',
    type: 'teachers_team',
    name: 'Equipo de Guías Montessori',
    badge: 'Equipo Docente',
    title: 'Guías preparadas y comprometidas con cada niño',
    subtitle: 'Acompañantes certificados que facilitan el desarrollo.',
    isEnabled: true,
    showInMenu: true,
    menuLabel: 'Guías',
    menuLabel_en: 'Guides'
  },
  {
    id: 'sec_contact',
    type: 'location_map_cta',
    name: 'Contacto, Ubicación & Mapa',
    badge: 'Encuéntranos',
    title: 'Te dejamos nuestra ubicación y vías de contacto',
    isEnabled: true,
    showInMenu: true,
    menuLabel: 'Contacto',
    menuLabel_en: 'Contact',
    ctaText: 'Mándanos un mensaje'
  },
  {
    id: 'sec_cta',
    type: 'cta_banner_contrast',
    name: 'Llamado a la Acción Final (CTA)',
    title: 'Planta hoy las raíces del futuro de tu hijo',
    subtitle: 'Agenda una visita guiada y conoce nuestros salones Montessori.',
    isEnabled: true,
    showInMenu: false,
    ctaText: 'Agendar Visita'
  }
];

interface SectionsManagerTabProps {
  sections: WebSectionItem[];
  onChangeSections: (sections: WebSectionItem[]) => void;
  onNavigateToTab?: (tab: 'header' | 'hero' | 'cta') => void;
  onSelectSectionForEdit?: (sectionId: string) => void;
}

export const SectionsManagerTab: React.FC<SectionsManagerTabProps> = ({
  sections,
  onChangeSections,
  onNavigateToTab,
  onSelectSectionForEdit
}) => {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleToggleEnable = (id: string) => {
    const newSections = sections.map(sec =>
      sec.id === id ? { ...sec, isEnabled: !sec.isEnabled } : sec
    );
    onChangeSections(newSections);
  };

  const handleDuplicate = (id: string) => {
    const targetIdx = sections.findIndex(s => s.id === id);
    if (targetIdx === -1) return;
    const original = sections[targetIdx];
    const clone: WebSectionItem = {
      ...original,
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${original.name} (Copia)`
    };
    const newSections = [...sections];
    newSections.splice(targetIdx + 1, 0, clone);
    onChangeSections(newSections);
  };

  const handleDelete = (id: string) => {
    if (sections.length <= 1) return;
    const newSections = sections.filter(s => s.id !== id);
    onChangeSections(newSections);
  };

  const handleAddTemplate = (template: SectionTemplate) => {
    const newSection: WebSectionItem = {
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: template.type,
      name: template.name,
      badge: template.badgeDefault,
      title: template.titleDefault,
      subtitle: template.subtitleDefault,
      ctaText: template.ctaDefault,
      isEnabled: true,
      showInMenu: true,
      menuLabel: template.name
    };
    onChangeSections([...sections, newSection]);
    setIsCatalogOpen(false);
    if (onSelectSectionForEdit) {
      onSelectSectionForEdit(newSection.id);
    }
  };

  const filteredTemplates = SECTION_TEMPLATES.filter(tmpl => {
    const matchesSearch = tmpl.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tmpl.tag.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = selectedCategory === 'all' || tmpl.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 text-xs text-slate-800 animate-in fade-in duration-200">
      
      {/* 1. TOP ANCHOR: HEADER & TOP BAR (FIXED) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-3xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <PanelTop className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 text-xs sm:text-sm">Header & Barra Superior</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-200/80 text-emerald-900 uppercase tracking-wide">
                Fijo Superior
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Logotipo, navegación de menú, idiomas, tema claro/oscuro y botón de acción.
            </p>
          </div>
        </div>

        {onNavigateToTab && (
          <button
            type="button"
            onClick={() => onNavigateToTab('header')}
            className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-xs hover:bg-emerald-100/60 transition-all flex items-center gap-1 shrink-0 shadow-3xs cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Configurar</span>
          </button>
        )}
      </div>

      {/* 2. TOP HERO ANCHOR (FIXED) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-3xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Layout className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-950 text-xs sm:text-sm">Hero Banner (Portada Principal)</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-200/80 text-blue-900 uppercase tracking-wide">
                Fijo Superior
              </span>
            </div>
            <p className="text-[11px] text-blue-800">
              Plantilla visual, titulares de impacto, cortes orgánicos y llamada a la acción inicial.
            </p>
          </div>
        </div>

        {onNavigateToTab && (
          <button
            type="button"
            onClick={() => onNavigateToTab('hero')}
            className="px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-blue-900 font-bold text-xs hover:bg-blue-100/60 transition-all flex items-center gap-1 shrink-0 shadow-3xs cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden sm:inline">Configurar</span>
          </button>
        )}
      </div>

      {/* 3. DYNAMIC BODY SECTIONS CONTAINER */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">3</div>
              <h4 className="font-bold text-forest text-xs sm:text-sm">
                Secciones Intermedias ({sections.length})
              </h4>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Reordená la posición, encendé/apagá visibilidad y editá los contenidos entre el Hero y el Footer.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCatalogOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-forest text-white hover:bg-forest/90 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Sección</span>
          </button>
        </div>

        {/* SECTION REORDER LIST */}
        <div className="space-y-3">
          {sections.map((section, index) => {
            const template = SECTION_TEMPLATES.find(t => t.type === section.type);
            const IconComp = template?.icon || Layers;

            const isBeingDragged = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => {
                  setDraggedIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(index));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverIndex !== index) {
                    setDragOverIndex(index);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIndex === index) {
                    setDragOverIndex(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex === null || draggedIndex === index) {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                    return;
                  }
                  const newSections = [...sections];
                  const [removed] = newSections.splice(draggedIndex, 1);
                  newSections.splice(index, 0, removed);
                  onChangeSections(newSections);
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`rounded-2xl border transition-all ${
                  isBeingDragged
                    ? 'opacity-40 border-dashed border-forest/60 bg-forest/5 scale-[0.98]'
                    : isDragOver
                    ? 'border-forest ring-2 ring-forest/30 bg-forest/5 shadow-md'
                    : !section.isEnabled
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-3xs'
                }`}
              >
                {/* Header Row */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  
                  {/* Left: Drag Handle + Icon + Title */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    
                    {/* DRAG AND DROP HANDLER (LEFT) */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-slate-400 hover:text-forest hover:bg-forest/10 transition-colors shrink-0 flex items-center justify-center"
                      title="Arrastrar y soltar para reordenar"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      section.isEnabled ? 'bg-forest/10 text-forest' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {section.name}
                        </span>
                        {template?.tag && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {template.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate max-w-sm">
                        {section.title}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Visibility, Duplicate, Delete */}
                  <div className="flex items-center gap-1 shrink-0">

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleEnable(section.id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        section.isEnabled
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                      }`}
                      title={section.isEnabled ? 'Sección visible (click para ocultar)' : 'Sección oculta (click para activar)'}
                    >
                      {section.isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(section.id)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer hidden sm:block"
                      title="Duplicar sección"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(section.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                      title="Eliminar sección"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BOTTOM ANCHOR: FOOTER (FIXED) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200/80 border border-slate-300 shadow-3xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">Pie de Página (Footer)</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-300 text-slate-800 uppercase tracking-wide">
                Fijo Inferior
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Datos de contacto, redes sociales, horarios, enlaces legales y derechos de autor.
            </p>
          </div>
        </div>

        {onNavigateToTab && (
          <button
            type="button"
            onClick={() => onNavigateToTab('cta')}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1 shrink-0 shadow-3xs cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Configurar</span>
          </button>
        )}
      </div>

      {/* ==================================================== */}
      {/* 5. VISUAL SECTION CATALOG MODAL / DRAWER */}
      {/* ==================================================== */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/80 shrink-0">
              <div>
                <h3 className="font-bold text-forest text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-forest" />
                  <span>Catálogo de Secciones Web ({SECTION_TEMPLATES.length})</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Elegí una plantilla para insertarla en la página y personalizar su contenido.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar por tipo de sección, palabras clave o formato..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'Todas las Secciones' },
                  { id: 'methodology', label: 'Estructura & Metodología' },
                  { id: 'programs', label: 'Oferta & Historia' },
                  { id: 'trust', label: 'Prueba Social & Medios' },
                  { id: 'conversion', label: 'Conversión & Cierre' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-forest text-white shadow-3xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Templates */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50">
              {filteredTemplates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <div
                    key={template.type}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-forest/40 hover:shadow-md transition-all flex flex-col justify-between gap-3 group text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center group-hover:bg-forest group-hover:text-white transition-colors shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {template.tag}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-forest transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddTemplate(template)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 group-hover:bg-forest group-hover:text-white text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insertar en la Página</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Mostrando {filteredTemplates.length} de {SECTION_TEMPLATES.length} plantillas
              </span>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
