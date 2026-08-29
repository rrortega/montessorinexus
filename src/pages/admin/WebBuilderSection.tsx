import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Palette,
  Layout,
  Smartphone,
  Laptop,
  Tablet,
  ExternalLink,
  Layers,
  MessageCircle,
  X,
  RefreshCw,
  Save,
  Check,
  Sparkles,
  Link2,
  Copy,
  ShieldCheck,
  Server,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Sliders,
  Eye,
  ImageIcon,
  Compass,
  PanelTop,
  Languages,
  ToggleLeft,
  ToggleRight,
  Maximize2,
  MoveHorizontal,
  ChevronDown,
  ChevronLeft,
  Layers2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid,
  Waves,
  Shapes,
  Calendar,
  CircleDot,
  Magnet
} from 'lucide-react';
import { useSiteSettings, ButtonRadiusType, ButtonHeightType } from '@/context/SettingsContext';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { toast } from 'sonner';
import { SectionsManagerTab, WebSectionItem, DEFAULT_PAGE_SECTIONS, SECTION_TEMPLATES } from './web-builder/SectionsManagerTab';
import { SectionDedicatedEditor } from './web-builder/SectionDedicatedEditor';
import { LanguagesAndSeoTab } from './web-builder/LanguagesAndSeoTab';
import { getLanguageByCode } from './web-builder/languages';

export interface TopBarItem {
  id: string;
  icon?: 'phone' | 'mail' | 'pin' | 'sparkles' | 'link';
  text: string;
  url?: string;
}

export const DEFAULT_TOP_BAR_ITEMS: TopBarItem[] = [
  { id: '1', icon: 'sparkles', text: 'Admisiones Ciclo 2026-2027 Abiertas', url: '/#admisiones' },
  { id: '2', icon: 'phone', text: '+52 998 123 4567', url: 'tel:+529981234567' }
];

type ViewportMode = 'desktop' | 'tablet' | 'mobile';
type DesignerTab = 'domain' | 'branding' | 'header' | 'hero' | 'sections' | 'navigation' | 'cta' | string;

export function generateDefaultSubdomain(name: string): string {
  if (!name) return 'colegio';
  const clean = name.replace(/\bmontessori\b/gi, '').trim();
  let slug = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'colegio';
}

export function sanitizeDomainInput(val: string): string {
  if (!val) return '';
  return val
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.-]/g, '');
}

export function isCustomDomainInput(val: string): boolean {
  const clean = sanitizeDomainInput(val);
  return clean.includes('.') && clean.split('.').filter(Boolean).length >= 2;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  tagline: string;
  isCustom?: boolean;
  light: ThemeColors;
  dark: ThemeColors;
}

export const CURATED_PALETTES: ColorPalette[] = [
  {
    id: 'ceiba-forest',
    name: 'Ceiba Bosque Vivo',
    tagline: 'Orgánico, cálido y natural',
    light: {
      primary: '#1b3b2b',
      secondary: '#2d5a40',
      accent: '#d97706',
      background: '#fbfbf9',
      surface: '#ffffff',
      text: '#111827'
    },
    dark: {
      primary: '#10b981',
      secondary: '#064e3b',
      accent: '#fbbf24',
      background: '#09130e',
      surface: '#11231a',
      text: '#f9fafb'
    }
  },
  {
    id: 'montessori-terra',
    name: 'Nogal & Montessori Terra',
    tagline: 'Maderas nobles, terracota y lino',
    light: {
      primary: '#452c1e',
      secondary: '#784f33',
      accent: '#c25e2e',
      background: '#faf7f2',
      surface: '#ffffff',
      text: '#271c16'
    },
    dark: {
      primary: '#d97736',
      secondary: '#3a2216',
      accent: '#f97316',
      background: '#140d09',
      surface: '#241710',
      text: '#fdfaf7'
    }
  },
  {
    id: 'deep-ocean',
    name: 'Océano Índigo & Zafiro',
    tagline: 'Serenidad, sabiduría y amplitud',
    light: {
      primary: '#0f2b48',
      secondary: '#1b4965',
      accent: '#0284c7',
      background: '#f4f8fb',
      surface: '#ffffff',
      text: '#0c1e33'
    },
    dark: {
      primary: '#38bdf8',
      secondary: '#0f2942',
      accent: '#60a5fa',
      background: '#07111c',
      surface: '#0f2136',
      text: '#f0f8ff'
    }
  },
  {
    id: 'botanical-sage',
    name: 'Botánica & Salvia Silvestre',
    tagline: 'Calma sensorial y frescura botánica',
    light: {
      primary: '#2b4c3f',
      secondary: '#4a7c68',
      accent: '#854d6d',
      background: '#f5f9f6',
      surface: '#ffffff',
      text: '#1a2e26'
    },
    dark: {
      primary: '#5eead4',
      secondary: '#1a382d',
      accent: '#f472b6',
      background: '#081410',
      surface: '#13261f',
      text: '#f2fbf7'
    }
  },
  {
    id: 'solar-ochre',
    name: 'Ocre Solar & Arcilla',
    tagline: 'Calidez radiante y energía infantil',
    light: {
      primary: '#7c3a1d',
      secondary: '#b45309',
      accent: '#ea580c',
      background: '#fdf8f4',
      surface: '#ffffff',
      text: '#331508'
    },
    dark: {
      primary: '#fb923c',
      secondary: '#451a03',
      accent: '#facc15',
      background: '#170b04',
      surface: '#291508',
      text: '#fff7ed'
    }
  },
  {
    id: 'nordic-slate',
    name: 'Pizarra & Menta Nórdica',
    tagline: 'Líneas limpias, moderno y sereno',
    light: {
      primary: '#1e293b',
      secondary: '#334155',
      accent: '#0d9488',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a'
    },
    dark: {
      primary: '#2dd4bf',
      secondary: '#1e293b',
      accent: '#14b8a6',
      background: '#0b0f17',
      surface: '#151e2d',
      text: '#f8fafc'
    }
  },
  {
    id: 'matcha-zen',
    name: 'Té Matcha & Bambú Zen',
    tagline: 'Concentración profunda y balance',
    light: {
      primary: '#283618',
      secondary: '#606c38',
      accent: '#bc6c25',
      background: '#fcfbf7',
      surface: '#ffffff',
      text: '#1c2611'
    },
    dark: {
      primary: '#a7c957',
      secondary: '#222e14',
      accent: '#dda15e',
      background: '#0c1206',
      surface: '#18230d',
      text: '#f7f9f3'
    }
  },
  {
    id: 'obsidian-copper',
    name: 'Obsidiana & Cobre Puro',
    tagline: 'Elegancia institucional y prestigio',
    light: {
      primary: '#18181b',
      secondary: '#27272a',
      accent: '#b45309',
      background: '#fafafa',
      surface: '#ffffff',
      text: '#09090b'
    },
    dark: {
      primary: '#fbbf24',
      secondary: '#27272a',
      accent: '#f59e0b',
      background: '#09090b',
      surface: '#18181b',
      text: '#fafafa'
    }
  },
  {
    id: 'burgundy-velvet',
    name: 'Borgoña Real & Terciopelo',
    tagline: 'Tradición humanista y distinción',
    light: {
      primary: '#4c1d28',
      secondary: '#702235',
      accent: '#c2410c',
      background: '#faf5f6',
      surface: '#ffffff',
      text: '#2d0b13'
    },
    dark: {
      primary: '#fb7185',
      secondary: '#3d0c17',
      accent: '#f97316',
      background: '#140407',
      surface: '#240a10',
      text: '#fff1f2'
    }
  },
  {
    id: 'custom',
    name: 'Personalizada (A Medida)',
    tagline: 'Definí tus propios códigos HEX',
    isCustom: true,
    light: {
      primary: '#334155',
      secondary: '#475569',
      accent: '#0284c7',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a'
    },
    dark: {
      primary: '#94a3b8',
      secondary: '#334155',
      accent: '#38bdf8',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc'
    }
  }
];

const HeroAccordionContext = React.createContext<{
  activeId: string;
  toggle: (id: string) => void;
}>({ activeId: '', toggle: () => {} });

interface HeroAccordionItemProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  badge?: string;
  children: React.ReactNode;
}

const HeroAccordionItem: React.FC<HeroAccordionItemProps> = ({
  id,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}) => {
  const { activeId, toggle } = React.useContext(HeroAccordionContext);
  const isOpen = activeId === id;
  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isOpen
        ? 'bg-white border-forest/30 shadow-xs ring-1 ring-forest/15'
        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
    }`}>
      <button
        type="button"
        onClick={() => toggle(id)}
        className={`w-full p-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
          isOpen ? 'bg-slate-50/70 border-b border-slate-100' : 'hover:bg-slate-50/50'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isOpen ? 'bg-forest text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-xs truncate ${isOpen ? 'text-forest' : 'text-slate-800'}`}>
                {title}
              </span>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-forest/10 text-forest shrink-0">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-slate-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180 text-forest' : ''
        }`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className="p-5 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const HERO_FONTS = [
  { id: 'default', name: 'Predeterminada del Tema', category: 'Sistema', family: 'inherit', sample: 'Escuela Montessori' },
  { id: 'new-kansas', name: 'New Kansas', category: 'Display Serif / Retro Bold', family: "'New Kansas', 'Fraunces', 'Cooper Black', serif", sample: 'Educación Transformadora & Consciente' },
  { id: 'articulat-cf', name: 'Articulat CF', category: 'Neo-Grotesque / Mid-Century', family: "'Articulat CF', 'Articulat', 'Plus Jakarta Sans', sans-serif", sample: 'Ambiente Montessori Bilingüe' },
  { id: 'outfit', name: 'Outfit', category: 'Moderna / Geométrica', family: "'Outfit', sans-serif", sample: 'Educación Montessori Internacional' },
  { id: 'lexend', name: 'Lexend', category: 'Educativa / Legible', family: "'Lexend', sans-serif", sample: 'Desarrollo Humano & Independencia' },
  { id: 'fredoka', name: 'Fredoka', category: 'Lúdica / Redonda', family: "'Fredoka', cursive, sans-serif", sample: 'Aprender Jugando & Explorando' },
  { id: 'comfortaa', name: 'Comfortaa', category: 'Suave / Redonda', family: "'Comfortaa', cursive, sans-serif", sample: 'Ambientes Preparados y Cálidos' },
  { id: 'caveat', name: 'Caveat', category: 'Manuscrita / Cálida', family: "'Caveat', cursive", sample: 'Guiando con Amor y Paciencia' },
  { id: 'dancing', name: 'Dancing Script', category: 'Caligráfica / Elegante', family: "'Dancing Script', cursive", sample: 'Comunidad Viva & Creativa' },
  { id: 'playfair', name: 'Playfair Display', category: 'Serif / Editorial', family: "'Playfair Display', serif", sample: 'Excelencia Académica y Tradición' },
  { id: 'merriweather', name: 'Merriweather', category: 'Serif / Literaria', family: "'Merriweather', serif", sample: 'Pensamiento Crítico y Reflexivo' },
  { id: 'cinzel', name: 'Cinzel', category: 'Serif / Clásica', family: "'Cinzel', serif", sample: 'Valores, Historia & Dignidad' },
  { id: 'jakarta', name: 'Plus Jakarta Sans', category: 'Vanguardista / Tech', family: "'Plus Jakarta Sans', sans-serif", sample: 'Innovación en el Aprendizaje' },
  { id: 'poppins', name: 'Poppins', category: 'Publicitaria / Geométrica', family: "'Poppins', sans-serif", sample: 'Formando Líderes del Futuro' },
  { id: 'montserrat', name: 'Montserrat', category: 'Corporativa / Urbana', family: "'Montserrat', sans-serif", sample: 'Colegio Bilingüe de Cancún' },
  { id: 'quicksand', name: 'Quicksand', category: 'Amigable / Geométrica', family: "'Quicksand', sans-serif", sample: 'Libertad con Responsabilidad' },
  { id: 'nunito', name: 'Nunito', category: 'Cálida / Equilibrada', family: "'Nunito', sans-serif", sample: 'Niños Felices y Autónomos' },
  { id: 'raleway', name: 'Raleway', category: 'Elegante / Fina', family: "'Raleway', sans-serif", sample: 'Descubrimiento & Curiosidad' },
  { id: 'inter', name: 'Inter', category: 'Neutra / UI Moderna', family: "'Inter', sans-serif", sample: 'Portal Educativo Institucional' },
  { id: 'mono', name: 'Monoespaciada', category: 'Técnica / Código', family: 'monospace', sample: 'Escuela-Montessori-v2.0' }
];

const CustomFontPicker = ({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (fontId: string) => void;
  label?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedFont = HERO_FONTS.find((f) => f.id === value) || HERO_FONTS[0];

  const filteredFonts = HERO_FONTS.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="text-[10px] font-bold text-slate-700 block mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-800 shadow-xs flex items-center justify-between gap-1.5 focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all text-left cursor-pointer"
      >
        <div className="flex items-center justify-between gap-1.5 truncate min-w-0 flex-1">
          <span
            className="text-xs font-bold truncate block"
            style={{ fontFamily: selectedFont.family !== 'inherit' ? selectedFont.family : undefined }}
          >
            {selectedFont.name}
          </span>
          <span className="text-[9px] text-slate-500 font-medium shrink-0 bg-slate-100 px-1.5 py-0.5 rounded-md">
            {selectedFont.category.split('/')[0].trim()}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-forest' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-[100] bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1.5 max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-150 w-full ring-1 ring-slate-900/10">
          {/* Header del dropdown */}
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-700">Tipografía</span>
            <span className="text-[9px] text-slate-400 font-mono">{filteredFonts.length}</span>
          </div>

          {/* Buscador interactivo */}
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar fuente..."
              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-forest/20 focus:border-forest font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lista renderizada ajustada exactamente al ancho del contenedor */}
          <div className="overflow-y-auto max-h-52 space-y-1 pr-0.5 custom-scrollbar">
            {filteredFonts.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Sin resultados
              </div>
            ) : (
              filteredFonts.map((font) => {
                const isSelected = font.id === value;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => {
                      onChange(font.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-forest/10 border border-forest/30 text-forest shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-xs font-bold block truncate"
                          style={{ fontFamily: font.family !== 'inherit' ? font.family : undefined }}
                        >
                          {font.name}
                        </span>
                        <span className="text-[8px] text-slate-400 font-medium shrink-0">
                          {font.category.split('/')[0].trim()}
                        </span>
                      </div>
                      {font.sample && (
                        <span
                          className="text-[10px] text-slate-500 block truncate"
                          style={{ fontFamily: font.family !== 'inherit' ? font.family : undefined }}
                        >
                          {font.sample}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-forest text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const HERO_FRAME_SHAPES: Array<{
  id: 'none' | 'mosaic' | 'blob-1' | 'blob-2' | 'arch' | 'squircle' | 'leaf' | 'egg' | 'circle';
  name: string;
  desc: string;
  previewClass: string;
}> = [
  { id: 'none', name: 'Sin Forma', desc: 'Directo / PNG transparente sin marco', previewClass: 'rounded-none border-dashed' },
  { id: 'mosaic', name: 'Mosaico Cápsulas', desc: 'Collage en cuadrícula de cápsulas verticales', previewClass: 'rounded-md bg-forest/30' },
  { id: 'blob-1', name: 'Orgánica Suave', desc: 'Curvatura fluida asimétrica', previewClass: 'rounded-[52%_48%_68%_32%/42%_58%_42%_58%]' },
  { id: 'blob-2', name: 'Gota Asimétrica', desc: 'Curva orgánica pronunciada', previewClass: 'rounded-[60%_40%_30%_70%/60%_30%_70%_40%]' },
  { id: 'arch', name: 'Arco Nórdico', desc: 'Cúpula superior con base recta', previewClass: 'rounded-t-full rounded-b-none' },
  { id: 'squircle', name: 'Superelipse', desc: 'Cuadrado suavizado armónico', previewClass: 'rounded-[28%]' },
  { id: 'leaf', name: 'Hoja Botánica', desc: 'Esquinas alternadas agudas y suaves', previewClass: 'rounded-[80%_20%_80%_20%/20%_80%_20%_80%]' },
  { id: 'egg', name: 'Cápsula Oval', desc: 'Forma ovalada continua', previewClass: 'rounded-[50%/60%_60%_40%_40%]' },
  { id: 'circle', name: 'Circular', desc: 'Círculo geométrico simétrico', previewClass: 'rounded-full' },
];

const HeroFrameShapeCustomSelect = ({
  value,
  onChange,
  isMorphMode = false,
  morphShapes = [],
  onToggleMorphShape,
}: {
  value: string;
  onChange: (shapeId: string) => void;
  isMorphMode?: boolean;
  morphShapes?: string[];
  onToggleMorphShape?: (shapeId: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedShape = HERO_FRAME_SHAPES.find((s) => s.id === value) || HERO_FRAME_SHAPES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-800 shadow-xs flex items-center justify-between gap-2 focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-5 h-5 bg-forest/20 border-2 border-forest/50 ${selectedShape.previewClass} shrink-0`} />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs truncate">
                {isMorphMode ? `${morphShapes.length} Formas en Ciclo` : selectedShape.name}
              </span>
              {isMorphMode && (
                <span className="text-[9px] font-bold text-forest bg-forest/10 px-1.5 py-0.5 rounded-full">
                  Morphing
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground truncate">
              {isMorphMode
                ? morphShapes.map((id) => HERO_FRAME_SHAPES.find((s) => s.id === id)?.name).filter(Boolean).join(', ')
                : selectedShape.desc}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-forest' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-[100] bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 w-full ring-1 ring-slate-900/10">
          <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>{isMorphMode ? 'Seleccionar Formas de Morphing' : 'Forma del Marco'}</span>
            <span className="text-slate-400 font-normal lowercase">
              {isMorphMode ? 'clic para activar/desactivar' : 'selección única'}
            </span>
          </div>

          {HERO_FRAME_SHAPES.map((shape) => {
            const isSelected = isMorphMode
              ? morphShapes.includes(shape.id)
              : shape.id === value;

            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => {
                  if (isMorphMode && onToggleMorphShape) {
                    onToggleMorphShape(shape.id);
                  } else {
                    onChange(shape.id);
                    setIsOpen(false);
                  }
                }}
                className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-forest/10 border border-forest/30 text-forest font-bold shadow-3xs'
                    : 'hover:bg-slate-50 border border-transparent text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-5 h-5 bg-forest/20 border-2 border-forest/40 ${shape.previewClass} shrink-0`} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs ${isSelected ? 'font-bold text-forest' : 'font-semibold text-slate-800'}`}>
                      {shape.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {shape.desc}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-forest shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MultilingualTextareaField = ({
  label,
  valueEs,
  onChangeEs,
  valueEn,
  onChangeEn,
  placeholderEs = 'Escribe el texto en español...',
  placeholderEn = 'Type text in English...',
  rows = 2
}: {
  label: string;
  valueEs: string;
  onChangeEs: (val: string) => void;
  valueEn: string;
  onChangeEn: (val: string) => void;
  placeholderEs?: string;
  placeholderEn?: string;
  rows?: number;
}) => {
  const [lang, setLang] = useState<'es' | 'en'>('es');

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 block">{label}</label>
        <div className="inline-flex p-0.5 rounded-lg bg-slate-200/80 border border-slate-300/70 text-[10px] font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setLang('es')}
            className={`px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              lang === 'es'
                ? 'bg-white text-forest shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🇪🇸</span>
            <span>ES</span>
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              lang === 'en'
                ? 'bg-white text-forest shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🇺🇸</span>
            <span>EN</span>
            {valueEn ? <span className="w-1.5 h-1.5 rounded-full bg-forest inline-block" /> : null}
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={rows}
          value={lang === 'es' ? valueEs : valueEn}
          onChange={(e) => {
            if (lang === 'es') {
              onChangeEs(e.target.value);
            } else {
              onChangeEn(e.target.value);
            }
          }}
          placeholder={lang === 'es' ? placeholderEs : placeholderEn}
          className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest resize-y leading-relaxed placeholder:text-slate-400 font-medium shadow-xs"
        />
        <div className="absolute right-2.5 bottom-2.5 pointer-events-none text-[9px] font-mono font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded-md">
          {lang === 'es' ? 'ES' : 'EN'}
        </div>
      </div>
    </div>
  );
};

export const WebBuilderSection: React.FC = () => {
  const navigate = useNavigate();
  const handleClose = () => navigate('/panel');
  const {
    settings,
    updateSettings,
    schoolName,
    schoolTagline,
    schoolLogo,
    schoolLogoDark,
    schoolFavicon,
    brandPrimaryColor,
    brandSecondaryColor,
    brandAccentColor,
    buttonRadius,
    buttonHeight,
    ctaMode,
    contactPhone,
    showDocumentsInMenu,
    showApplicationsInMenu
  } = useSiteSettings();

  const [activeTab, setActiveTab] = useState<DesignerTab>('domain');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [builderEditorLang, setBuilderEditorLang] = useState<string>('es');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [saving, setSaving] = useState(false);
  const [verifyingDns, setVerifyingDns] = useState(false);

  // Form State initialized from settings
  const [name, setName] = useState(schoolName || '');
  const [tagline, setTagline] = useState(schoolTagline || '');
  const [logoUrl, setLogoUrl] = useState(schoolLogo || '');
  const [logoDarkUrl, setLogoDarkUrl] = useState(schoolLogoDark || '');
  const [faviconUrl, setFaviconUrl] = useState(schoolFavicon || '');

  // Palette & Color Theme State (Unified Theme Mode)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(settings?.brand_palette_id || 'ceiba-forest');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const [lightColors, setLightColors] = useState<ThemeColors>({
    primary: settings?.brand_primary_color || brandPrimaryColor || '#1b3b2b',
    secondary: settings?.brand_secondary_color || brandSecondaryColor || '#2d5a40',
    accent: settings?.brand_accent_color || brandAccentColor || '#d97706',
    background: settings?.brand_bg_light || '#fbfbf9',
    surface: settings?.brand_surface_light || '#ffffff',
    text: settings?.brand_text_light || '#111827'
  });

  const [darkColors, setDarkColors] = useState<ThemeColors>({
    primary: settings?.brand_primary_dark || '#10b981',
    secondary: settings?.brand_secondary_dark || '#064e3b',
    accent: settings?.brand_accent_dark || '#fbbf24',
    background: settings?.brand_bg_dark || '#09130e',
    surface: settings?.brand_surface_dark || '#11231a',
    text: settings?.brand_text_dark || '#f9fafb'
  });

  // ==========================================
  // HEADER DESIGNER STATE
  // ==========================================
  const [headerViewSubtab, setHeaderViewSubtab] = useState<'default' | 'scroll' | 'mobile'>('default');

  // A. Header Default
  const [headerLayoutType, setHeaderLayoutType] = useState<'full' | 'floating'>(
    (settings?.header_layout_type as 'full' | 'floating') || 'floating'
  );
  const [headerHeight, setHeaderHeight] = useState<number>(Number(settings?.header_height) || 72);
  const [headerRadius, setHeaderRadius] = useState<ButtonRadiusType>(
    (settings?.header_radius as ButtonRadiusType) || '2xl'
  );
  const [headerMarginTop, setHeaderMarginTop] = useState<number>(Number(settings?.header_margin_top) || 16);
  const [headerMarginSide, setHeaderMarginSide] = useState<number>(Number(settings?.header_margin_side) || 24);
  const [headerBgMode, setHeaderBgMode] = useState<'transparent' | 'solid' | 'glass'>(
    (settings?.header_bg_mode as 'transparent' | 'solid' | 'glass') || 'glass'
  );
  const [headerBgColor, setHeaderBgColor] = useState<string>(settings?.header_bg_color || '');
  const [headerHasBorder, setHeaderHasBorder] = useState<boolean>(settings?.header_has_border !== 'false');
  const [headerBorderColor, setHeaderBorderColor] = useState<string>(settings?.header_border_color || '');
  const [headerShadow, setHeaderShadow] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>(
    (settings?.header_shadow as 'none' | 'sm' | 'md' | 'lg' | 'xl') || 'md'
  );

  // Header Transparent Menu Text Colors
  const [headerNavTextColorMode, setHeaderNavTextColorMode] = useState<'auto' | 'brand' | 'custom' | 'white'>(
    (settings?.header_nav_text_color_mode as 'auto' | 'brand' | 'custom' | 'white') || 'auto'
  );
  const [headerNavTextColorLight, setHeaderNavTextColorLight] = useState<string>(
    settings?.header_nav_text_color_light || ''
  );
  const [headerNavTextColorDark, setHeaderNavTextColorDark] = useState<string>(
    settings?.header_nav_text_color_dark || ''
  );

  // Header Top Bar
  const [headerShowTopBar, setHeaderShowTopBar] = useState<boolean>(settings?.header_show_top_bar === 'true');
  const [headerTopBarText, setHeaderTopBarText] = useState<string>(
    settings?.header_top_bar_text || '📍 Admisiones Ciclo 2026-2027 Abiertas • Cupos Limitados'
  );
  const [headerTopBarBg, setHeaderTopBarBg] = useState<string>(settings?.header_top_bar_bg || '');
  const [headerTopBarColor, setHeaderTopBarColor] = useState<string>(settings?.header_top_bar_color || '');

  const [headerTopBarItems, setHeaderTopBarItems] = useState<TopBarItem[]>(() => {
    if (settings?.header_top_bar_items) {
      try {
        const parsed = JSON.parse(settings.header_top_bar_items);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (settings?.header_top_bar_text) {
      return [{ id: '1', icon: 'sparkles', text: settings.header_top_bar_text, url: '' }];
    }
    return DEFAULT_TOP_BAR_ITEMS;
  });

  const handleAddTopBarItem = () => {
    const newItem: TopBarItem = {
      id: Date.now().toString(),
      icon: 'sparkles',
      text: 'Nuevo aviso o enlace',
      url: ''
    };
    setHeaderTopBarItems(prev => [...prev, newItem]);
  };

  const handleRemoveTopBarItem = (id: string) => {
    setHeaderTopBarItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateTopBarItem = (id: string, updates: Partial<TopBarItem>) => {
    setHeaderTopBarItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Header Logo & Branding Name
  const [headerLogoPosition, setHeaderLogoPosition] = useState<'left' | 'center' | 'right' | 'hidden'>(
    (settings?.header_logo_position as 'left' | 'center' | 'right' | 'hidden') || 'left'
  );
  const [headerShowName, setHeaderShowName] = useState<boolean>(settings?.header_show_name !== 'false');
  const [headerNameSplit, setHeaderNameSplit] = useState<boolean>(settings?.header_name_split !== 'false');
  const [headerNamePart1, setHeaderNamePart1] = useState<string>(settings?.header_name_part1 || 'Escuela');
  const [headerNamePart2, setHeaderNamePart2] = useState<string>(settings?.header_name_part2 || 'Montessori');
  const [headerNameColor1, setHeaderNameColor1] = useState<string>(settings?.header_name_color1 || '');
  const [headerNameColor2, setHeaderNameColor2] = useState<string>(settings?.header_name_color2 || '');
  const [headerLogoHeight, setHeaderLogoHeight] = useState<number>(Number(settings?.header_logo_height) || 36);

  // Header Menu & Extras
  const [headerMenuPosition, setHeaderMenuPosition] = useState<'left' | 'center' | 'right'>(
    (settings?.header_menu_position as 'left' | 'center' | 'right') || 'center'
  );
  const [headerShowLangSwitcher, setHeaderShowLangSwitcher] = useState<boolean>(settings?.header_show_lang_switcher !== 'false');
  const [headerEnabledLangs, setHeaderEnabledLangs] = useState<string>(settings?.header_enabled_langs || 'es,en');
  const [defaultLocale, setDefaultLocale] = useState<string>(settings?.default_locale || 'es');
  const [seoTitle, setSeoTitle] = useState<string>(settings?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState<string>(settings?.seo_description || '');
  const [seoKeywords, setSeoKeywords] = useState<string>(settings?.seo_keywords || '');
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState<string>(settings?.seo_canonical_url || '');
  const [seoAllowIndexing, setSeoAllowIndexing] = useState<boolean>(settings?.seo_allow_indexing !== 'false');
  const [ogTitle, setOgTitle] = useState<string>(settings?.og_title || '');
  const [ogDescription, setOgDescription] = useState<string>(settings?.og_description || '');
  const [ogImageUrl, setOgImageUrl] = useState<string>(settings?.og_image_url || '');
  const [headerShowThemeToggle, setHeaderShowThemeToggle] = useState<boolean>(settings?.header_show_theme_toggle !== 'false');
  const [headerCtaText, setHeaderCtaText] = useState<string>(settings?.header_cta_text || 'Admisiones');
  const [headerCtaStyle, setHeaderCtaStyle] = useState<'accent' | 'secondary' | 'outline'>(
    (settings?.header_cta_style as 'accent' | 'secondary' | 'outline') || 'accent'
  );

  // B. Header on Scroll
  const [headerScrollEnabled, setHeaderScrollEnabled] = useState<boolean>(settings?.header_scroll_enabled !== 'false');
  const [headerScrollType, setHeaderScrollType] = useState<'floating' | 'sticky-full'>(
    (settings?.header_scroll_type as 'floating' | 'sticky-full') || 'floating'
  );
  const [headerScrollHeight, setHeaderScrollHeight] = useState<number>(Number(settings?.header_scroll_height) || 58);
  const [headerScrollRadius, setHeaderScrollRadius] = useState<ButtonRadiusType>(
    (settings?.header_scroll_radius as ButtonRadiusType) || 'full'
  );
  const [headerScrollBg, setHeaderScrollBg] = useState<string>(settings?.header_scroll_bg || '');
  const [headerScrollOpacity, setHeaderScrollOpacity] = useState<number>(
    settings?.header_scroll_opacity ? Number(settings.header_scroll_opacity) : 95
  );
  const [headerScrollBlur, setHeaderScrollBlur] = useState<boolean>(settings?.header_scroll_blur !== 'false');

  // C. Header Mobile
  const [headerMobileLogoPosition, setHeaderMobileLogoPosition] = useState<'left' | 'center'>(
    (settings?.header_mobile_logo_pos as 'left' | 'center') || 'left'
  );
  const [headerMobileShowCta, setHeaderMobileShowCta] = useState<boolean>(settings?.header_mobile_show_cta !== 'false');

  // Other Design Settings
  const [radius, setRadius] = useState<ButtonRadiusType>((buttonRadius as ButtonRadiusType) || '2xl');
  const [height, setHeight] = useState<ButtonHeightType>((buttonHeight as ButtonHeightType) || 'md');
  const [cta, setCta] = useState<'whatsapp' | 'widget'>(ctaMode || 'whatsapp');
  const [phone, setPhone] = useState(contactPhone || '');
  const [showDocs, setShowDocs] = useState(showDocumentsInMenu);
  const [showApps, setShowApps] = useState(showApplicationsInMenu);

  // Dynamic Web Page Sections Order & Visibility
  const [pageSections, setPageSections] = useState<WebSectionItem[]>(() => {
    if (settings?.page_sections_order) {
      try {
        const parsed = JSON.parse(settings.page_sections_order);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_PAGE_SECTIONS;
  });

  // Unified Domain State
  const [domainInput, setDomainInput] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);

  // Hero custom fields & templates wizard
  const [heroWizardStep, setHeroWizardStep] = useState<'catalog' | 'config'>('catalog');
  const [heroActiveAccordion, setHeroActiveAccordion] = useState<string>('layout');
  const [heroTemplate, setHeroTemplate] = useState<'image-overlay-waves' | 'organic-montessori-stickers' | 'curved-contrast-bubble' | 'curved-cutout-student' | 'geometric-rhombus' | 'split-2-col' | 'centered-capsule' | 'gradient-organic'>(
    (settings?.hero_template as any) || 'image-overlay-waves'
  );
  const [heroAlign, setHeroAlign] = useState<'left' | 'center' | 'right'>((settings?.hero_align as any) || 'left');
  const [heroBottomShape, setHeroBottomShape] = useState<'waves-1' | 'waves-2' | 'curve-arch' | 'slant' | 'triangle' | 'none'>(
    (settings?.hero_bottom_shape as any) || 'waves-1'
  );
  const [heroShapeHeight, setHeroShapeHeight] = useState<number>(Number(settings?.hero_shape_height) || 90);
  const [heroShapeInverted, setHeroShapeInverted] = useState<boolean>(settings?.hero_shape_inverted === 'true');

  const [heroPatternOverlay, setHeroPatternOverlay] = useState<
    'none' | 'dots' | 'grid' | 'cross' | 'diagonal' | 'mesh' | 'doodles'
  >((settings?.hero_pattern_overlay as any) || 'none');
  const [heroPatternOpacity, setHeroPatternOpacity] = useState<number>(
    settings?.hero_pattern_opacity !== undefined && !isNaN(Number(settings?.hero_pattern_opacity))
      ? Number(settings.hero_pattern_opacity)
      : 25
  );
  const [heroPatternSize, setHeroPatternSize] = useState<number>(
    settings?.hero_pattern_size !== undefined && !isNaN(Number(settings?.hero_pattern_size))
      ? Number(settings.hero_pattern_size)
      : 32
  );
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState<number>(
    settings?.hero_overlay_opacity ? Number(settings.hero_overlay_opacity) : 65
  );

  // Specific parameters for curved-cutout-student template
  const [heroStudentImageUrl, setHeroStudentImageUrl] = useState<string>(settings?.hero_student_image_url || '');
  const [heroCircleY, setHeroCircleY] = useState<number>(Number(settings?.hero_circle_y) || 0);
  const [heroCircleSize, setHeroCircleSize] = useState<number>(Number(settings?.hero_circle_size) || 520);
  const [heroWaveY, setHeroWaveY] = useState<number>(Number(settings?.hero_wave_y) || 40);
  const [heroCurveIntensity, setHeroCurveIntensity] = useState<number>(Number(settings?.hero_curve_intensity) || 60);
  const [heroBorderWidth, setHeroBorderWidth] = useState<number>(
    settings?.hero_border_width !== undefined && !isNaN(Number(settings?.hero_border_width))
      ? Number(settings.hero_border_width)
      : 10
  );
  const [heroLayoutInverted, setHeroLayoutInverted] = useState<boolean>(settings?.hero_layout_inverted === 'true');
  const [heroShowSocial, setHeroShowSocial] = useState<boolean>(settings?.hero_show_social !== 'false');
  const [heroCtaSubtext, setHeroCtaSubtext] = useState<string>(
    settings?.hero_cta_subtext !== undefined ? settings.hero_cta_subtext : 'Inscripciones Abiertas'
  );

  // Specific parameters for geometric-rhombus template
  const [heroPromoShow, setHeroPromoShow] = useState<boolean>(settings?.hero_promo_show !== 'false');
  const [heroPromoTitle, setHeroPromoTitle] = useState<string>(
    settings?.hero_promo_title !== undefined ? settings.hero_promo_title : '30%'
  );
  const [heroPromoSubtitle, setHeroPromoSubtitle] = useState<string>(
    settings?.hero_promo_subtitle !== undefined ? settings.hero_promo_subtitle : 'DESCUENTO'
  );
  const [heroShowPhoneCta, setHeroShowPhoneCta] = useState<boolean>(settings?.hero_show_phone_cta !== 'false');
  const [heroPhoneLabel, setHeroPhoneLabel] = useState<string>(
    settings?.hero_phone_label !== undefined ? settings.hero_phone_label : 'Informes e Inscripciones'
  );
  const [heroPhoneNumber, setHeroPhoneNumber] = useState<string>(settings?.hero_phone_number || '');

  // Specific fine tuning parameters for curved-contrast-bubble template
  const [heroStudentScale, setHeroStudentScale] = useState<number>(Number(settings?.hero_student_scale) || 100);
  const [heroStudentX, setHeroStudentX] = useState<number>(Number(settings?.hero_student_x) || 0);
  const [heroStudentY, setHeroStudentY] = useState<number>(Number(settings?.hero_student_y) || 0);
  const [heroCircleScale, setHeroCircleScale] = useState<number>(Number(settings?.hero_circle_scale) || 100);
  const [heroCircleX, setHeroCircleX] = useState<number>(Number(settings?.hero_circle_x) || 0);
  const [heroCircleY2, setHeroCircleY2] = useState<number>(Number(settings?.hero_circle_y2) || 0);
  const [heroClassroomImageUrl, setHeroClassroomImageUrl] = useState<string>(settings?.hero_classroom_image_url || '');

  // Specific fine tuning parameters for organic-montessori-stickers template
  const [heroBlobScale, setHeroBlobScale] = useState<number>(Number(settings?.hero_blob_scale) || 100);
  const [heroBlobRotate, setHeroBlobRotate] = useState<number>(
    settings?.hero_blob_rotate !== undefined && !isNaN(Number(settings?.hero_blob_rotate))
      ? Number(settings.hero_blob_rotate)
      : -4
  );
  const [heroBlobRadiusType, setHeroBlobRadiusType] = useState<
    'none' | 'mosaic' | 'blob-1' | 'blob-2' | 'circle' | 'egg' | 'arch' | 'squircle' | 'leaf'
  >((settings?.hero_blob_radius_type as any) || 'blob-1');
  const [heroBlobAnimateMorph, setHeroBlobAnimateMorph] = useState<boolean>(
    settings?.hero_blob_animate_morph === 'true'
  );
  const [heroBlobMorphShapes, setHeroBlobMorphShapes] = useState<string[]>(() => {
    const raw = settings?.hero_blob_morph_shapes;
    if (raw) return raw.split(',').map((s) => s.trim()).filter(Boolean);
    return ['blob-1', 'blob-2', 'leaf'];
  });
  const [heroShowWhatsappPulse, setHeroShowWhatsappPulse] = useState<boolean>(settings?.hero_show_whatsapp_pulse !== 'false');
  const [heroButtonRadius, setHeroButtonRadius] = useState<'pill' | 'rounded' | 'square'>(
    (settings?.hero_button_radius as any) || 'pill'
  );
  const parseEffectsArray = (raw: string | undefined, defaultVal: string[]): string[] => {
    if (raw === undefined || raw === null) return defaultVal;
    if (!raw.trim()) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  };

  // Sticker 1 (Desktop, Tablet & Mobile Responsive)
  const [heroSticker1Show, setHeroSticker1Show] = useState<boolean>(settings?.hero_sticker_1_show !== 'false');
  const [heroSticker1ShowDesktop, setHeroSticker1ShowDesktop] = useState<boolean>(settings?.hero_sticker_1_show_desktop !== 'false');
  const [heroSticker1ShowTablet, setHeroSticker1ShowTablet] = useState<boolean>(settings?.hero_sticker_1_show_tablet !== 'false');
  const [heroSticker1ShowMobile, setHeroSticker1ShowMobile] = useState<boolean>(settings?.hero_sticker_1_show_mobile !== 'false');
  const [heroSticker1ImageUrl, setHeroSticker1ImageUrl] = useState<string>(settings?.hero_sticker_1_image_url || '');
  
  // Sticker 1 - Desktop
  const [heroSticker1X, setHeroSticker1X] = useState<number>(
    settings?.hero_sticker_1_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_x))
      ? Number(settings.hero_sticker_1_x)
      : 18
  );
  const [heroSticker1Y, setHeroSticker1Y] = useState<number>(
    settings?.hero_sticker_1_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_y))
      ? Number(settings.hero_sticker_1_y)
      : 18
  );
  const [heroSticker1Size, setHeroSticker1Size] = useState<number>(
    settings?.hero_sticker_1_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_size))
      ? Number(settings.hero_sticker_1_size)
      : 110
  );

  // Sticker 1 - Tablet
  const [heroSticker1TabletX, setHeroSticker1TabletX] = useState<number>(
    settings?.hero_sticker_1_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_x))
      ? Number(settings.hero_sticker_1_tablet_x)
      : (settings?.hero_sticker_1_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_x)) ? Number(settings.hero_sticker_1_x) : 18)
  );
  const [heroSticker1TabletY, setHeroSticker1TabletY] = useState<number>(
    settings?.hero_sticker_1_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_y))
      ? Number(settings.hero_sticker_1_tablet_y)
      : (settings?.hero_sticker_1_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_y)) ? Number(settings.hero_sticker_1_y) : 18)
  );
  const [heroSticker1TabletSize, setHeroSticker1TabletSize] = useState<number>(
    settings?.hero_sticker_1_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_size))
      ? Number(settings.hero_sticker_1_tablet_size)
      : 95
  );

  // Sticker 1 - Mobile
  const [heroSticker1MobileX, setHeroSticker1MobileX] = useState<number>(
    settings?.hero_sticker_1_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_x))
      ? Number(settings.hero_sticker_1_mobile_x)
      : (settings?.hero_sticker_1_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_x)) ? Number(settings.hero_sticker_1_x) : 18)
  );
  const [heroSticker1MobileY, setHeroSticker1MobileY] = useState<number>(
    settings?.hero_sticker_1_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_y))
      ? Number(settings.hero_sticker_1_mobile_y)
      : (settings?.hero_sticker_1_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_y)) ? Number(settings.hero_sticker_1_y) : 18)
  );
  const [heroSticker1MobileSize, setHeroSticker1MobileSize] = useState<number>(
    settings?.hero_sticker_1_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_size))
      ? Number(settings.hero_sticker_1_mobile_size)
      : 80
  );
  const [heroSticker1Effects, setHeroSticker1Effects] = useState<string[]>(
    parseEffectsArray(settings?.hero_sticker_1_effects, ['float'])
  );

  // Sticker 2 (Desktop, Tablet & Mobile Responsive)
  const [heroSticker2Show, setHeroSticker2Show] = useState<boolean>(settings?.hero_sticker_2_show !== 'false');
  const [heroSticker2ShowDesktop, setHeroSticker2ShowDesktop] = useState<boolean>(settings?.hero_sticker_2_show_desktop !== 'false');
  const [heroSticker2ShowTablet, setHeroSticker2ShowTablet] = useState<boolean>(settings?.hero_sticker_2_show_tablet !== 'false');
  const [heroSticker2ShowMobile, setHeroSticker2ShowMobile] = useState<boolean>(settings?.hero_sticker_2_show_mobile !== 'false');
  const [heroSticker2ImageUrl, setHeroSticker2ImageUrl] = useState<string>(settings?.hero_sticker_2_image_url || '');
  
  // Sticker 2 - Desktop
  const [heroSticker2X, setHeroSticker2X] = useState<number>(
    settings?.hero_sticker_2_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_x))
      ? Number(settings.hero_sticker_2_x)
      : 82
  );
  const [heroSticker2Y, setHeroSticker2Y] = useState<number>(
    settings?.hero_sticker_2_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_y))
      ? Number(settings.hero_sticker_2_y)
      : 78
  );
  const [heroSticker2Size, setHeroSticker2Size] = useState<number>(
    settings?.hero_sticker_2_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_size))
      ? Number(settings.hero_sticker_2_size)
      : 120
  );

  // Sticker 2 - Tablet
  const [heroSticker2TabletX, setHeroSticker2TabletX] = useState<number>(
    settings?.hero_sticker_2_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_x))
      ? Number(settings.hero_sticker_2_tablet_x)
      : (settings?.hero_sticker_2_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_x)) ? Number(settings.hero_sticker_2_x) : 82)
  );
  const [heroSticker2TabletY, setHeroSticker2TabletY] = useState<number>(
    settings?.hero_sticker_2_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_y))
      ? Number(settings.hero_sticker_2_tablet_y)
      : (settings?.hero_sticker_2_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_y)) ? Number(settings.hero_sticker_2_y) : 78)
  );
  const [heroSticker2TabletSize, setHeroSticker2TabletSize] = useState<number>(
    settings?.hero_sticker_2_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_size))
      ? Number(settings.hero_sticker_2_tablet_size)
      : 105
  );

  // Sticker 2 - Mobile
  const [heroSticker2MobileX, setHeroSticker2MobileX] = useState<number>(
    settings?.hero_sticker_2_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_x))
      ? Number(settings.hero_sticker_2_mobile_x)
      : (settings?.hero_sticker_2_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_x)) ? Number(settings.hero_sticker_2_x) : 82)
  );
  const [heroSticker2MobileY, setHeroSticker2MobileY] = useState<number>(
    settings?.hero_sticker_2_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_y))
      ? Number(settings.hero_sticker_2_mobile_y)
      : (settings?.hero_sticker_2_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_y)) ? Number(settings.hero_sticker_2_y) : 78)
  );
  const [heroSticker2MobileSize, setHeroSticker2MobileSize] = useState<number>(
    settings?.hero_sticker_2_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_size))
      ? Number(settings.hero_sticker_2_mobile_size)
      : 90
  );
  const [heroSticker2Effects, setHeroSticker2Effects] = useState<string[]>(
    parseEffectsArray(settings?.hero_sticker_2_effects, ['float'])
  );

  // Sticker 3 (Desktop, Tablet & Mobile Responsive)
  const [heroSticker3Show, setHeroSticker3Show] = useState<boolean>(settings?.hero_sticker_3_show !== 'false');
  const [heroSticker3ShowDesktop, setHeroSticker3ShowDesktop] = useState<boolean>(settings?.hero_sticker_3_show_desktop !== 'false');
  const [heroSticker3ShowTablet, setHeroSticker3ShowTablet] = useState<boolean>(settings?.hero_sticker_3_show_tablet !== 'false');
  const [heroSticker3ShowMobile, setHeroSticker3ShowMobile] = useState<boolean>(settings?.hero_sticker_3_show_mobile !== 'false');
  const [heroSticker3ImageUrl, setHeroSticker3ImageUrl] = useState<string>(settings?.hero_sticker_3_image_url || '');
  
  // Sticker 3 - Desktop
  const [heroSticker3X, setHeroSticker3X] = useState<number>(
    settings?.hero_sticker_3_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_x))
      ? Number(settings.hero_sticker_3_x)
      : 10
  );
  const [heroSticker3Y, setHeroSticker3Y] = useState<number>(
    settings?.hero_sticker_3_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_y))
      ? Number(settings.hero_sticker_3_y)
      : 36
  );
  const [heroSticker3Size, setHeroSticker3Size] = useState<number>(
    settings?.hero_sticker_3_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_size))
      ? Number(settings.hero_sticker_3_size)
      : 48
  );

  // Sticker 3 - Tablet
  const [heroSticker3TabletX, setHeroSticker3TabletX] = useState<number>(
    settings?.hero_sticker_3_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_x))
      ? Number(settings.hero_sticker_3_tablet_x)
      : (settings?.hero_sticker_3_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_x)) ? Number(settings.hero_sticker_3_x) : 10)
  );
  const [heroSticker3TabletY, setHeroSticker3TabletY] = useState<number>(
    settings?.hero_sticker_3_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_y))
      ? Number(settings.hero_sticker_3_tablet_y)
      : (settings?.hero_sticker_3_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_y)) ? Number(settings.hero_sticker_3_y) : 36)
  );
  const [heroSticker3TabletSize, setHeroSticker3TabletSize] = useState<number>(
    settings?.hero_sticker_3_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_size))
      ? Number(settings.hero_sticker_3_tablet_size)
      : 42
  );

  // Sticker 3 - Mobile
  const [heroSticker3MobileX, setHeroSticker3MobileX] = useState<number>(
    settings?.hero_sticker_3_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_x))
      ? Number(settings.hero_sticker_3_mobile_x)
      : (settings?.hero_sticker_3_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_x)) ? Number(settings.hero_sticker_3_x) : 10)
  );
  const [heroSticker3MobileY, setHeroSticker3MobileY] = useState<number>(
    settings?.hero_sticker_3_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_y))
      ? Number(settings.hero_sticker_3_mobile_y)
      : (settings?.hero_sticker_3_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_y)) ? Number(settings.hero_sticker_3_y) : 36)
  );
  const [heroSticker3MobileSize, setHeroSticker3MobileSize] = useState<number>(
    settings?.hero_sticker_3_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_size))
      ? Number(settings.hero_sticker_3_mobile_size)
      : 36
  );
  const [heroSticker3Effects, setHeroSticker3Effects] = useState<string[]>(
    parseEffectsArray(settings?.hero_sticker_3_effects, ['pulse', 'rotate-slow'])
  );

  // Specific fine tuning parameters for split-2-col template
  const [heroSplitShowBadge, setHeroSplitShowBadge] = useState<boolean>(settings?.hero_split_show_badge !== 'false');
  const [heroSplitBadgeTitle, setHeroSplitBadgeTitle] = useState<string>(settings?.hero_split_badge_title || 'Admisiones Abiertas');
  const [heroSplitBadgeSubtitle, setHeroSplitBadgeSubtitle] = useState<string>(settings?.hero_split_badge_subtitle || 'Ciclo Escolar 2026 - Cupos Limitados');
  const [heroSplitBadgePosition, setHeroSplitBadgePosition] = useState<
    'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left' | 'top-center' | 'center'
  >((settings?.hero_split_badge_position as any) || 'bottom-right');
  const [heroSplitImageAlign, setHeroSplitImageAlign] = useState<'center' | 'top' | 'bottom'>(
    (settings?.hero_split_image_align as any) || 'center'
  );
  const [heroSplitFrameStyle, setHeroSplitFrameStyle] = useState<
    'none' | 'glass-card' | 'iphone-mockup' | 'polaroid-tape' | 'arch-window' | 'studio-canvas' | 'organic-curve'
  >((settings?.hero_split_frame_style as any) || 'glass-card');
  const [heroSplitPerspective, setHeroSplitPerspective] = useState<'none' | 'isometric-left' | 'isometric-right' | 'tilted-deep'>(
    (settings?.hero_split_perspective as any) || 'isometric-left'
  );
  const [heroSplitRotateZ, setHeroSplitRotateZ] = useState<number>(
    settings?.hero_split_rotate_z !== undefined && !isNaN(Number(settings?.hero_split_rotate_z))
      ? Number(settings.hero_split_rotate_z)
      : 0
  );
  const [heroSplitHoverEffect, setHeroSplitHoverEffect] = useState<'zoom' | 'perspective-shift' | 'float-glow' | 'shimmer-reveal'>(
    (settings?.hero_split_hover_effect as any) || 'zoom'
  );

  // Specific fine tuning parameters for geometric-rhombus (Diagonales & Promoción)
  const [heroFrameRotateZ, setHeroFrameRotateZ] = useState<number>(
    settings?.hero_frame_rotate_z !== undefined && !isNaN(Number(settings?.hero_frame_rotate_z))
      ? Number(settings.hero_frame_rotate_z)
      : -4
  );
  const [heroFrameRotateX, setHeroFrameRotateX] = useState<number>(
    settings?.hero_frame_rotate_x !== undefined && !isNaN(Number(settings?.hero_frame_rotate_x))
      ? Number(settings.hero_frame_rotate_x)
      : 0
  );
  const [heroFrameRotateY, setHeroFrameRotateY] = useState<number>(
    settings?.hero_frame_rotate_y !== undefined && !isNaN(Number(settings?.hero_frame_rotate_y))
      ? Number(settings.hero_frame_rotate_y)
      : 0
  );
  const [heroFramePerspective, setHeroFramePerspective] = useState<number>(
    settings?.hero_frame_perspective !== undefined && !isNaN(Number(settings?.hero_frame_perspective))
      ? Number(settings.hero_frame_perspective)
      : 1000
  );
  const [heroFrameBorderWidth, setHeroFrameBorderWidth] = useState<number>(
    settings?.hero_frame_border_width !== undefined && !isNaN(Number(settings?.hero_frame_border_width))
      ? Number(settings.hero_frame_border_width)
      : 14
  );
  const [heroFrameBorderColor, setHeroFrameBorderColor] = useState<string>(settings?.hero_frame_border_color || 'secondary');
  const [heroFrameRadiusSync, setHeroFrameRadiusSync] = useState<boolean>(settings?.hero_frame_radius_sync !== 'false');
  const [heroFrameRadiusTl, setHeroFrameRadiusTl] = useState<number>(
    settings?.hero_frame_radius_tl !== undefined && !isNaN(Number(settings?.hero_frame_radius_tl))
      ? Number(settings.hero_frame_radius_tl)
      : 42
  );
  const [heroFrameRadiusTr, setHeroFrameRadiusTr] = useState<number>(
    settings?.hero_frame_radius_tr !== undefined && !isNaN(Number(settings?.hero_frame_radius_tr))
      ? Number(settings.hero_frame_radius_tr)
      : 42
  );
  const [heroFrameRadiusBr, setHeroFrameRadiusBr] = useState<number>(
    settings?.hero_frame_radius_br !== undefined && !isNaN(Number(settings?.hero_frame_radius_br))
      ? Number(settings.hero_frame_radius_br)
      : 42
  );
  const [heroFrameRadiusBl, setHeroFrameRadiusBl] = useState<number>(
    settings?.hero_frame_radius_bl !== undefined && !isNaN(Number(settings?.hero_frame_radius_bl))
      ? Number(settings.hero_frame_radius_bl)
      : 42
  );

  const [heroFrameHoverEffects, setHeroFrameHoverEffects] = useState<string[]>(
    parseEffectsArray(
      settings?.hero_frame_hover_effects || settings?.hero_hover_effects,
      ['zoom', 'glow', 'shimmer']
    )
  );

  const toggleFrameHoverEffect = (effectId: string) => {
    setHeroFrameHoverEffects((prev) => {
      let updated = prev.includes(effectId)
        ? prev.filter((id) => id !== effectId)
        : [...prev, effectId];
      if (effectId === 'magnet-attract' && updated.includes('magnet-attract')) {
        updated = updated.filter((id) => id !== 'magnet-repel');
      }
      if (effectId === 'magnet-repel' && updated.includes('magnet-repel')) {
        updated = updated.filter((id) => id !== 'magnet-attract');
      }
      return updated;
    });
  };

  // Decorative Rings (Aros)
  const [heroRing0Show, setHeroRing0Show] = useState<boolean>(settings?.hero_ring_0_show !== 'false');
  const [heroRing0X, setHeroRing0X] = useState<number>(
    settings?.hero_ring_0_x !== undefined && !isNaN(Number(settings?.hero_ring_0_x)) ? Number(settings.hero_ring_0_x) : -16
  );
  const [heroRing0Y, setHeroRing0Y] = useState<number>(
    settings?.hero_ring_0_y !== undefined && !isNaN(Number(settings?.hero_ring_0_y)) ? Number(settings.hero_ring_0_y) : -16
  );
  const [heroRing0Size, setHeroRing0Size] = useState<number>(
    settings?.hero_ring_0_size !== undefined && !isNaN(Number(settings?.hero_ring_0_size)) ? Number(settings.hero_ring_0_size) : 112
  );
  const [heroRing0BorderWidth, setHeroRing0BorderWidth] = useState<number>(
    settings?.hero_ring_0_border_width !== undefined && !isNaN(Number(settings?.hero_ring_0_border_width)) ? Number(settings.hero_ring_0_border_width) : 8
  );
  const [heroRing0Color, setHeroRing0Color] = useState<string>(settings?.hero_ring_0_color || 'primary');
  const [heroRing0Opacity, setHeroRing0Opacity] = useState<number>(
    settings?.hero_ring_0_opacity !== undefined && !isNaN(Number(settings?.hero_ring_0_opacity)) ? Number(settings.hero_ring_0_opacity) : 100
  );

  const [heroRing1Show, setHeroRing1Show] = useState<boolean>(settings?.hero_ring_1_show !== 'false');
  const [heroRing1X, setHeroRing1X] = useState<number>(
    settings?.hero_ring_1_x !== undefined && !isNaN(Number(settings?.hero_ring_1_x)) ? Number(settings.hero_ring_1_x) : 40
  );
  const [heroRing1Y, setHeroRing1Y] = useState<number>(
    settings?.hero_ring_1_y !== undefined && !isNaN(Number(settings?.hero_ring_1_y)) ? Number(settings.hero_ring_1_y) : -40
  );
  const [heroRing1Size, setHeroRing1Size] = useState<number>(
    settings?.hero_ring_1_size !== undefined && !isNaN(Number(settings?.hero_ring_1_size)) ? Number(settings.hero_ring_1_size) : 160
  );
  const [heroRing1BorderWidth, setHeroRing1BorderWidth] = useState<number>(
    settings?.hero_ring_1_border_width !== undefined && !isNaN(Number(settings?.hero_ring_1_border_width)) ? Number(settings.hero_ring_1_border_width) : 10
  );
  const [heroRing1Color, setHeroRing1Color] = useState<string>(settings?.hero_ring_1_color || 'accent');
  const [heroRing1Dashed, setHeroRing1Dashed] = useState<boolean>(settings?.hero_ring_1_dashed === 'true');
  const [heroRing1Opacity, setHeroRing1Opacity] = useState<number>(
    settings?.hero_ring_1_opacity !== undefined && !isNaN(Number(settings?.hero_ring_1_opacity)) ? Number(settings.hero_ring_1_opacity) : 100
  );

  const [heroRing2Show, setHeroRing2Show] = useState<boolean>(settings?.hero_ring_2_show === 'true');
  const [heroRing2X, setHeroRing2X] = useState<number>(
    settings?.hero_ring_2_x !== undefined && !isNaN(Number(settings?.hero_ring_2_x)) ? Number(settings.hero_ring_2_x) : -30
  );
  const [heroRing2Y, setHeroRing2Y] = useState<number>(
    settings?.hero_ring_2_y !== undefined && !isNaN(Number(settings?.hero_ring_2_y)) ? Number(settings.hero_ring_2_y) : 60
  );
  const [heroRing2Size, setHeroRing2Size] = useState<number>(
    settings?.hero_ring_2_size !== undefined && !isNaN(Number(settings?.hero_ring_2_size)) ? Number(settings.hero_ring_2_size) : 90
  );
  const [heroRing2BorderWidth, setHeroRing2BorderWidth] = useState<number>(
    settings?.hero_ring_2_border_width !== undefined && !isNaN(Number(settings?.hero_ring_2_border_width)) ? Number(settings.hero_ring_2_border_width) : 6
  );
  const [heroRing2Color, setHeroRing2Color] = useState<string>(settings?.hero_ring_2_color || 'secondary');
  const [heroRing2Dashed, setHeroRing2Dashed] = useState<boolean>(settings?.hero_ring_2_dashed === 'true');
  const [heroRing2Opacity, setHeroRing2Opacity] = useState<number>(
    settings?.hero_ring_2_opacity !== undefined && !isNaN(Number(settings?.hero_ring_2_opacity)) ? Number(settings.hero_ring_2_opacity) : 100
  );

  const [heroRing3Show, setHeroRing3Show] = useState<boolean>(settings?.hero_ring_3_show === 'true');
  const [heroRing3X, setHeroRing3X] = useState<number>(
    settings?.hero_ring_3_x !== undefined && !isNaN(Number(settings?.hero_ring_3_x)) ? Number(settings.hero_ring_3_x) : 70
  );
  const [heroRing3Y, setHeroRing3Y] = useState<number>(
    settings?.hero_ring_3_y !== undefined && !isNaN(Number(settings?.hero_ring_3_y)) ? Number(settings.hero_ring_3_y) : 80
  );
  const [heroRing3Size, setHeroRing3Size] = useState<number>(
    settings?.hero_ring_3_size !== undefined && !isNaN(Number(settings?.hero_ring_3_size)) ? Number(settings.hero_ring_3_size) : 130
  );
  const [heroRing3BorderWidth, setHeroRing3BorderWidth] = useState<number>(
    settings?.hero_ring_3_border_width !== undefined && !isNaN(Number(settings?.hero_ring_3_border_width)) ? Number(settings.hero_ring_3_border_width) : 8
  );
  const [heroRing3Color, setHeroRing3Color] = useState<string>(settings?.hero_ring_3_color || 'primary');
  const [heroRing3Dashed, setHeroRing3Dashed] = useState<boolean>(settings?.hero_ring_3_dashed === 'true');
  const [heroRing3Opacity, setHeroRing3Opacity] = useState<number>(
    settings?.hero_ring_3_opacity !== undefined && !isNaN(Number(settings?.hero_ring_3_opacity)) ? Number(settings.hero_ring_3_opacity) : 100
  );

  const [heroBadgeShow, setHeroBadgeShow] = useState<boolean>(settings?.hero_badge_show !== 'false');
  const [heroBadge, setHeroBadge] = useState(
    settings?.hero_badge !== undefined ? settings.hero_badge : 'Colegio Montessori 100% Bilingüe'
  );
  const [heroBadgeEn, setHeroBadgeEn] = useState<string>(settings?.hero_badge_en || '');
  const [heroBadgeColor, setHeroBadgeColor] = useState<string>(settings?.hero_badge_color || 'primary');
  const [heroTitlePart1, setHeroTitlePart1] = useState<string>(
    settings?.hero_title_part1 !== undefined
      ? settings.hero_title_part1
      : (settings?.hero_title ? settings.hero_title.split(' ').slice(0, 2).join(' ') : 'Cada niño')
  );
  const [heroTitlePart1En, setHeroTitlePart1En] = useState<string>(settings?.hero_title_part1_en || '');
  const [heroTitlePart2, setHeroTitlePart2] = useState<string>(
    settings?.hero_title_part2 !== undefined
      ? settings.hero_title_part2
      : (settings?.hero_title ? settings.hero_title.split(' ').slice(2).join(' ') : 'deja una huella única cuando aprende desde su libertad.')
  );
  const [heroTitlePart2En, setHeroTitlePart2En] = useState<string>(settings?.hero_title_part2_en || '');
  const [heroTitleColor1, setHeroTitleColor1] = useState<string>(settings?.hero_title_color_1 || 'primary');
  const [heroTitleColor2, setHeroTitleColor2] = useState<string>(settings?.hero_title_color_2 || 'secondary');
  const [heroTitle, setHeroTitle] = useState(
    settings?.hero_title !== undefined ? settings.hero_title : 'Cada niño deja una huella única cuando aprende desde su libertad.'
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    settings?.hero_subtitle !== undefined ? settings.hero_subtitle : 'Fundada con conciencia educativa y responsabilidad hacia los niños de 6 a 12 años de edad.'
  );
  const [heroSubtitleEn, setHeroSubtitleEn] = useState<string>(settings?.hero_subtitle_en || '');
  const [heroSubtitleColor, setHeroSubtitleColor] = useState<string>(settings?.hero_subtitle_color || 'text');
  const [heroCtaText, setHeroCtaText] = useState(
    settings?.hero_cta_text !== undefined ? settings.hero_cta_text : 'Agenda una Visita'
  );
  const [heroCtaTextEn, setHeroCtaTextEn] = useState<string>(settings?.hero_cta_text_en || '');
  const [heroCtaBgColor, setHeroCtaBgColor] = useState<string>(settings?.hero_cta_bg_color || 'primary');
  const [heroCtaSubtextEn, setHeroCtaSubtextEn] = useState<string>(settings?.hero_cta_subtext_en || '');
  const [heroSecondaryCtaText, setHeroSecondaryCtaText] = useState<string>(
    settings?.hero_secondary_cta_text !== undefined ? settings.hero_secondary_cta_text : 'Informes'
  );
  const [heroSecondaryCtaTextEn, setHeroSecondaryCtaTextEn] = useState<string>(settings?.hero_secondary_cta_text_en || '');
  const [heroShowSecondaryCta, setHeroShowSecondaryCta] = useState<boolean>(settings?.hero_show_secondary_cta !== 'false');

  // Spacing & Typography for Hero Text Blocks
  const [heroTextPaddingTop, setHeroTextPaddingTop] = useState<number>(
    settings?.hero_text_padding_top !== undefined && !isNaN(Number(settings?.hero_text_padding_top))
      ? Number(settings.hero_text_padding_top)
      : 0
  );
  const [heroTextPaddingBottom, setHeroTextPaddingBottom] = useState<number>(
    settings?.hero_text_padding_bottom !== undefined && !isNaN(Number(settings?.hero_text_padding_bottom))
      ? Number(settings.hero_text_padding_bottom)
      : 0
  );

  // 1. Badge Font, Size & Margins
  const [heroBadgeFont, setHeroBadgeFont] = useState<string>(settings?.hero_badge_font || 'default');
  const [heroBadgeSize, setHeroBadgeSize] = useState<number>(
    settings?.hero_badge_size !== undefined && !isNaN(Number(settings?.hero_badge_size))
      ? Number(settings.hero_badge_size)
      : 0
  );
  const [heroBadgeMarginTop, setHeroBadgeMarginTop] = useState<number>(
    settings?.hero_badge_margin_top !== undefined && !isNaN(Number(settings?.hero_badge_margin_top))
      ? Number(settings.hero_badge_margin_top)
      : 0
  );
  const [heroBadgeMarginBottom, setHeroBadgeMarginBottom] = useState<number>(
    settings?.hero_badge_margin_bottom !== undefined && !isNaN(Number(settings?.hero_badge_margin_bottom))
      ? Number(settings.hero_badge_margin_bottom)
      : 16
  );

  // 2. Title Font, Size, Tags & Margins (Part 1 and Part 2)
  const [heroTitleFont, setHeroTitleFont] = useState<string>(settings?.hero_title_font || 'default');
  const [heroTitleSize, setHeroTitleSize] = useState<number>(
    settings?.hero_title_size !== undefined && !isNaN(Number(settings?.hero_title_size))
      ? Number(settings.hero_title_size)
      : 0
  );
  const [heroTitleMarginTop, setHeroTitleMarginTop] = useState<number>(
    settings?.hero_title_margin_top !== undefined && !isNaN(Number(settings?.hero_title_margin_top))
      ? Number(settings.hero_title_margin_top)
      : 0
  );
  const [heroTitleMarginBottom, setHeroTitleMarginBottom] = useState<number>(
    settings?.hero_title_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_margin_bottom))
      ? Number(settings.hero_title_margin_bottom)
      : 20
  );

  const [heroTitlePart1Tag, setHeroTitlePart1Tag] = useState<string>(settings?.hero_title_part1_tag || 'h1');
  const [heroTitlePart1Font, setHeroTitlePart1Font] = useState<string>(settings?.hero_title_part1_font || settings?.hero_title_font || 'default');
  const [heroTitlePart1Size, setHeroTitlePart1Size] = useState<number>(
    settings?.hero_title_part1_size !== undefined && !isNaN(Number(settings?.hero_title_part1_size))
      ? Number(settings.hero_title_part1_size)
      : (settings?.hero_title_size !== undefined && !isNaN(Number(settings?.hero_title_size)) ? Number(settings.hero_title_size) : 0)
  );
  const [heroTitlePart1MarginTop, setHeroTitlePart1MarginTop] = useState<number>(
    settings?.hero_title_part1_margin_top !== undefined && !isNaN(Number(settings?.hero_title_part1_margin_top))
      ? Number(settings.hero_title_part1_margin_top)
      : 0
  );
  const [heroTitlePart1MarginBottom, setHeroTitlePart1MarginBottom] = useState<number>(
    settings?.hero_title_part1_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_part1_margin_bottom))
      ? Number(settings.hero_title_part1_margin_bottom)
      : 0
  );

  const [heroTitlePart2Tag, setHeroTitlePart2Tag] = useState<string>(settings?.hero_title_part2_tag || 'h1');
  const [heroTitlePart2Font, setHeroTitlePart2Font] = useState<string>(settings?.hero_title_part2_font || settings?.hero_title_font || 'default');
  const [heroTitlePart2Size, setHeroTitlePart2Size] = useState<number>(
    settings?.hero_title_part2_size !== undefined && !isNaN(Number(settings?.hero_title_part2_size))
      ? Number(settings.hero_title_part2_size)
      : (settings?.hero_title_size !== undefined && !isNaN(Number(settings?.hero_title_size)) ? Number(settings.hero_title_size) : 0)
  );
  const [heroTitlePart2MarginTop, setHeroTitlePart2MarginTop] = useState<number>(
    settings?.hero_title_part2_margin_top !== undefined && !isNaN(Number(settings?.hero_title_part2_margin_top))
      ? Number(settings.hero_title_part2_margin_top)
      : 0
  );
  const [heroTitlePart2MarginBottom, setHeroTitlePart2MarginBottom] = useState<number>(
    settings?.hero_title_part2_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_part2_margin_bottom))
      ? Number(settings.hero_title_part2_margin_bottom)
      : 20
  );

  // 3. Subtitle Font, Size & Margins
  const [heroSubtitleFont, setHeroSubtitleFont] = useState<string>(settings?.hero_subtitle_font || 'default');
  const [heroSubtitleSize, setHeroSubtitleSize] = useState<number>(
    settings?.hero_subtitle_size !== undefined && !isNaN(Number(settings?.hero_subtitle_size))
      ? Number(settings.hero_subtitle_size)
      : 0
  );
  const [heroSubtitleMarginTop, setHeroSubtitleMarginTop] = useState<number>(
    settings?.hero_subtitle_margin_top !== undefined && !isNaN(Number(settings?.hero_subtitle_margin_top))
      ? Number(settings.hero_subtitle_margin_top)
      : 0
  );
  const [heroSubtitleMarginBottom, setHeroSubtitleMarginBottom] = useState<number>(
    settings?.hero_subtitle_margin_bottom !== undefined && !isNaN(Number(settings?.hero_subtitle_margin_bottom))
      ? Number(settings.hero_subtitle_margin_bottom)
      : 24
  );

  // 4. CTA Buttons Font, Size & Margins
  const [heroCtaFont, setHeroCtaFont] = useState<string>(settings?.hero_cta_font || 'default');
  const [heroCtaSize, setHeroCtaSize] = useState<number>(
    settings?.hero_cta_size !== undefined && !isNaN(Number(settings?.hero_cta_size))
      ? Number(settings.hero_cta_size)
      : 0
  );
  const [heroCtaMarginTop, setHeroCtaMarginTop] = useState<number>(
    settings?.hero_cta_margin_top !== undefined && !isNaN(Number(settings?.hero_cta_margin_top))
      ? Number(settings.hero_cta_margin_top)
      : 8
  );
  const [heroCtaMarginBottom, setHeroCtaMarginBottom] = useState<number>(
    settings?.hero_cta_margin_bottom !== undefined && !isNaN(Number(settings?.hero_cta_margin_bottom))
      ? Number(settings.hero_cta_margin_bottom)
      : 0
  );
  const [heroCtaSubtextSize, setHeroCtaSubtextSize] = useState<number>(
    settings?.hero_cta_subtext_size !== undefined && !isNaN(Number(settings?.hero_cta_subtext_size))
      ? Number(settings.hero_cta_subtext_size)
      : 0
  );
  const [heroCta2Font, setHeroCta2Font] = useState<string>(settings?.hero_cta2_font || 'default');
  const [heroCta2Size, setHeroCta2Size] = useState<number>(
    settings?.hero_cta2_size !== undefined && !isNaN(Number(settings?.hero_cta2_size))
      ? Number(settings.hero_cta2_size)
      : 0
  );
  const [heroImageUrl, setHeroImageUrl] = useState(settings?.hero_image_url || '');

  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const port = typeof window !== 'undefined' && window.location.port ? window.location.port : '8080';

  const cleanDomain = sanitizeDomainInput(domainInput);
  const isCustom = isCustomDomainInput(cleanDomain);
  const cleanSubdomain = cleanDomain || generateDefaultSubdomain(name);

  const displayUrl = isLocalhost
    ? (isCustom ? `${cleanDomain}.localhost:${port}` : `${cleanSubdomain}.localhost:${port}`)
    : (isCustom ? cleanDomain : `${cleanSubdomain}.montessorinexus.com`);

  const activeHostPreview = isCustom
    ? cleanDomain
    : `${cleanSubdomain}.montessorinexus.com`;

  const iframeSrc = isLocalhost
    ? `http://${isCustom ? cleanDomain : cleanSubdomain}.localhost:${port}/?preview=1&t=${previewKey}`
    : `https://${activeHostPreview}/?preview=1&t=${previewKey}`;

  // Real-time live preview message dispatcher to embedded iframe
  const emitLivePreviewUpdate = () => {
    if (!iframeRef.current?.contentWindow) return;

    const isCustomVal = isCustomDomainInput(cleanDomain);
    const subVal = isCustomVal ? generateDefaultSubdomain(name) : (cleanDomain || generateDefaultSubdomain(name));
    const customDomainVal = isCustomVal ? cleanDomain : '';

    const previewSettings: Record<string, string> = {
      school_name: name.trim(),
      school_tagline: tagline.trim(),
      school_logo: logoUrl.trim(),
      school_logo_dark: logoDarkUrl.trim(),
      school_favicon: faviconUrl.trim(),
      subdomain: subVal,
      custom_domain: customDomainVal,
      brand_palette_id: selectedPaletteId,
      brand_primary_color: themeMode === 'dark' ? darkColors.primary.trim() : lightColors.primary.trim(),
      brand_secondary_color: themeMode === 'dark' ? darkColors.secondary.trim() : lightColors.secondary.trim(),
      brand_accent_color: themeMode === 'dark' ? darkColors.accent.trim() : lightColors.accent.trim(),
      brand_background_color: themeMode === 'dark' ? darkColors.background.trim() : lightColors.background.trim(),
      brand_surface_color: themeMode === 'dark' ? darkColors.surface.trim() : lightColors.surface.trim(),
      brand_text_color: themeMode === 'dark' ? darkColors.text.trim() : lightColors.text.trim(),
      brand_bg_light: lightColors.background.trim(),
      brand_surface_light: lightColors.surface.trim(),
      brand_text_light: lightColors.text.trim(),
      brand_primary_dark: darkColors.primary.trim(),
      brand_secondary_dark: darkColors.secondary.trim(),
      brand_accent_dark: darkColors.accent.trim(),
      brand_bg_dark: darkColors.background.trim(),
      brand_surface_dark: darkColors.surface.trim(),
      brand_text_dark: darkColors.text.trim(),

      header_layout_type: headerLayoutType,
      header_height: String(headerHeight),
      header_radius: headerRadius,
      header_margin_top: String(headerMarginTop),
      header_margin_side: String(headerMarginSide),
      header_bg_mode: headerBgMode,
      header_bg_color: headerBgColor,
      header_has_border: headerHasBorder ? 'true' : 'false',
      header_border_color: headerBorderColor,
      header_shadow: headerShadow,

      header_nav_text_color_mode: headerNavTextColorMode,
      header_nav_text_color_light: headerNavTextColorLight.trim(),
      header_nav_text_color_dark: headerNavTextColorDark.trim(),

      header_show_top_bar: headerShowTopBar ? 'true' : 'false',
      header_top_bar_text: headerTopBarText.trim(),
      header_top_bar_bg: headerTopBarBg.trim(),
      header_top_bar_color: headerTopBarColor.trim(),
      header_top_bar_items: JSON.stringify(headerTopBarItems),

      header_logo_position: headerLogoPosition,
      header_show_name: headerShowName ? 'true' : 'false',
      header_name_split: headerNameSplit ? 'true' : 'false',
      header_name_part1: headerNamePart1.trim(),
      header_name_part2: headerNamePart2.trim(),
      header_name_color1: headerNameColor1.trim(),
      header_name_color2: headerNameColor2.trim(),
      header_logo_height: String(headerLogoHeight),

      header_menu_position: headerMenuPosition,
      header_show_lang_switcher: headerShowLangSwitcher ? 'true' : 'false',
      header_enabled_langs: headerEnabledLangs,
      default_locale: defaultLocale,
      seo_title: seoTitle.trim(),
      seo_description: seoDescription.trim(),
      seo_keywords: seoKeywords.trim(),
      seo_canonical_url: seoCanonicalUrl.trim(),
      seo_allow_indexing: seoAllowIndexing ? 'true' : 'false',
      og_title: ogTitle.trim(),
      og_description: ogDescription.trim(),
      og_image_url: ogImageUrl.trim(),
      header_show_theme_toggle: headerShowThemeToggle ? 'true' : 'false',
      header_cta_text: headerCtaText.trim(),
      header_cta_style: headerCtaStyle,

      header_scroll_enabled: headerScrollEnabled ? 'true' : 'false',
      header_scroll_type: headerScrollType,
      header_scroll_height: String(headerScrollHeight),
      header_scroll_radius: headerScrollRadius,
      header_scroll_bg: headerScrollBg.trim(),
      header_scroll_opacity: String(headerScrollOpacity),
      header_scroll_blur: headerScrollBlur ? 'true' : 'false',

      header_mobile_logo_pos: headerMobileLogoPosition,
      header_mobile_show_cta: headerMobileShowCta ? 'true' : 'false',

      button_radius: radius,
      button_height: height,
      cta_mode: cta,
      contact_phone: phone.trim(),
      show_documents_in_menu: showDocs ? 'true' : 'false',
      show_applications_in_menu: showApps ? 'true' : 'false',
      page_sections_order: JSON.stringify(pageSections),
      hero_template: heroTemplate,
      hero_align: heroAlign,
      hero_bottom_shape: heroBottomShape,
      hero_shape_height: String(heroShapeHeight),
      hero_shape_inverted: heroShapeInverted ? 'true' : 'false',
      hero_pattern_overlay: heroPatternOverlay,
      hero_pattern_opacity: String(heroPatternOpacity),
      hero_pattern_size: String(heroPatternSize),
      hero_overlay_opacity: String(heroOverlayOpacity),
      hero_student_image_url: heroStudentImageUrl.trim(),
      hero_circle_y: String(heroCircleY),
      hero_circle_size: String(heroCircleSize),
      hero_wave_y: String(heroWaveY),
      hero_curve_intensity: String(heroCurveIntensity),
      hero_border_width: String(heroBorderWidth),
      hero_layout_inverted: heroLayoutInverted ? 'true' : 'false',
      hero_show_social: heroShowSocial ? 'true' : 'false',
      hero_promo_show: heroPromoShow ? 'true' : 'false',
      hero_promo_title: heroPromoTitle.trim(),
      hero_promo_subtitle: heroPromoSubtitle.trim(),
      hero_show_phone_cta: heroShowPhoneCta ? 'true' : 'false',
      hero_phone_label: heroPhoneLabel.trim(),
      hero_phone_number: heroPhoneNumber.trim(),
      hero_student_scale: String(heroStudentScale),
      hero_student_x: String(heroStudentX),
      hero_student_y: String(heroStudentY),
      hero_circle_scale: String(heroCircleScale),
      hero_circle_x: String(heroCircleX),
      hero_circle_y2: String(heroCircleY2),
      hero_classroom_image_url: heroClassroomImageUrl.trim(),
      hero_blob_scale: String(heroBlobScale),
      hero_blob_rotate: String(heroBlobRotate),
      hero_blob_radius_type: heroBlobRadiusType,
      hero_blob_animate_morph: heroBlobAnimateMorph ? 'true' : 'false',
      hero_blob_morph_shapes: heroBlobMorphShapes.join(','),
      hero_show_whatsapp_pulse: heroShowWhatsappPulse ? 'true' : 'false',
      hero_button_radius: heroButtonRadius,
      hero_sticker_1_show: heroSticker1Show ? 'true' : 'false',
      hero_sticker_1_show_desktop: heroSticker1ShowDesktop ? 'true' : 'false',
      hero_sticker_1_show_tablet: heroSticker1ShowTablet ? 'true' : 'false',
      hero_sticker_1_show_mobile: heroSticker1ShowMobile ? 'true' : 'false',
      hero_sticker_1_image_url: heroSticker1ImageUrl.trim(),
      hero_sticker_1_x: String(heroSticker1X),
      hero_sticker_1_y: String(heroSticker1Y),
      hero_sticker_1_size: String(heroSticker1Size),
      hero_sticker_1_tablet_x: String(heroSticker1TabletX),
      hero_sticker_1_tablet_y: String(heroSticker1TabletY),
      hero_sticker_1_tablet_size: String(heroSticker1TabletSize),
      hero_sticker_1_mobile_x: String(heroSticker1MobileX),
      hero_sticker_1_mobile_y: String(heroSticker1MobileY),
      hero_sticker_1_mobile_size: String(heroSticker1MobileSize),
      hero_sticker_1_effects: heroSticker1Effects.join(','),
      hero_sticker_2_show: heroSticker2Show ? 'true' : 'false',
      hero_sticker_2_show_desktop: heroSticker2ShowDesktop ? 'true' : 'false',
      hero_sticker_2_show_tablet: heroSticker2ShowTablet ? 'true' : 'false',
      hero_sticker_2_show_mobile: heroSticker2ShowMobile ? 'true' : 'false',
      hero_sticker_2_image_url: heroSticker2ImageUrl.trim(),
      hero_sticker_2_x: String(heroSticker2X),
      hero_sticker_2_y: String(heroSticker2Y),
      hero_sticker_2_size: String(heroSticker2Size),
      hero_sticker_2_tablet_x: String(heroSticker2TabletX),
      hero_sticker_2_tablet_y: String(heroSticker2TabletY),
      hero_sticker_2_tablet_size: String(heroSticker2TabletSize),
      hero_sticker_2_mobile_x: String(heroSticker2MobileX),
      hero_sticker_2_mobile_y: String(heroSticker2MobileY),
      hero_sticker_2_mobile_size: String(heroSticker2MobileSize),
      hero_sticker_2_effects: heroSticker2Effects.join(','),
      hero_sticker_3_show: heroSticker3Show ? 'true' : 'false',
      hero_sticker_3_show_desktop: heroSticker3ShowDesktop ? 'true' : 'false',
      hero_sticker_3_show_tablet: heroSticker3ShowTablet ? 'true' : 'false',
      hero_sticker_3_show_mobile: heroSticker3ShowMobile ? 'true' : 'false',
      hero_sticker_3_image_url: heroSticker3ImageUrl.trim(),
      hero_sticker_3_x: String(heroSticker3X),
      hero_sticker_3_y: String(heroSticker3Y),
      hero_sticker_3_size: String(heroSticker3Size),
      hero_sticker_3_tablet_x: String(heroSticker3TabletX),
      hero_sticker_3_tablet_y: String(heroSticker3TabletY),
      hero_sticker_3_tablet_size: String(heroSticker3TabletSize),
      hero_sticker_3_mobile_x: String(heroSticker3MobileX),
      hero_sticker_3_mobile_y: String(heroSticker3MobileY),
      hero_sticker_3_mobile_size: String(heroSticker3MobileSize),
      hero_sticker_3_effects: heroSticker3Effects.join(','),
      hero_badge: heroBadge.trim(),
      hero_badge_en: heroBadgeEn.trim(),
      hero_badge_color: heroBadgeColor,
      hero_title: heroTitle.trim(),
      hero_title_part1: heroTitlePart1.trim(),
      hero_title_part1_en: heroTitlePart1En.trim(),
      hero_title_part2: heroTitlePart2.trim(),
      hero_title_part2_en: heroTitlePart2En.trim(),
      hero_title_color_1: heroTitleColor1,
      hero_title_color_2: heroTitleColor2,
      hero_subtitle: heroSubtitle.trim(),
      hero_subtitle_en: heroSubtitleEn.trim(),
      hero_subtitle_color: heroSubtitleColor,
      hero_text_padding_top: String(heroTextPaddingTop),
      hero_text_padding_bottom: String(heroTextPaddingBottom),
      hero_badge_show: heroBadgeShow ? 'true' : 'false',
      hero_badge_font: heroBadgeFont,
      hero_badge_size: String(heroBadgeSize),
      hero_badge_margin_top: String(heroBadgeMarginTop),
      hero_badge_margin_bottom: String(heroBadgeMarginBottom),
      hero_title_font: heroTitleFont,
      hero_title_size: String(heroTitleSize),
      hero_title_margin_top: String(heroTitleMarginTop),
      hero_title_margin_bottom: String(heroTitleMarginBottom),
      hero_title_part1_tag: heroTitlePart1Tag,
      hero_title_part1_font: heroTitlePart1Font,
      hero_title_part1_size: String(heroTitlePart1Size),
      hero_title_part1_margin_top: String(heroTitlePart1MarginTop),
      hero_title_part1_margin_bottom: String(heroTitlePart1MarginBottom),
      hero_title_part2_tag: heroTitlePart2Tag,
      hero_title_part2_font: heroTitlePart2Font,
      hero_title_part2_size: String(heroTitlePart2Size),
      hero_title_part2_margin_top: String(heroTitlePart2MarginTop),
      hero_title_part2_margin_bottom: String(heroTitlePart2MarginBottom),
      hero_subtitle_font: heroSubtitleFont,
      hero_subtitle_size: String(heroSubtitleSize),
      hero_subtitle_margin_top: String(heroSubtitleMarginTop),
      hero_subtitle_margin_bottom: String(heroSubtitleMarginBottom),
      hero_cta_font: heroCtaFont,
      hero_cta_size: String(heroCtaSize),
      hero_cta_margin_top: String(heroCtaMarginTop),
      hero_cta_margin_bottom: String(heroCtaMarginBottom),
      hero_cta_subtext_size: String(heroCtaSubtextSize),
      hero_cta2_font: heroCta2Font,
      hero_cta2_size: String(heroCta2Size),
      hero_cta_text: heroCtaText.trim(),
      hero_cta_text_en: heroCtaTextEn.trim(),
      hero_cta_bg_color: heroCtaBgColor,
      hero_cta_subtext: heroCtaSubtext.trim(),
      hero_cta_subtext_en: heroCtaSubtextEn.trim(),
      hero_secondary_cta_text: heroSecondaryCtaText.trim(),
      hero_secondary_cta_text_en: heroSecondaryCtaTextEn.trim(),
      hero_show_secondary_cta: heroShowSecondaryCta ? 'true' : 'false',
      hero_image_url: heroImageUrl.trim()
    };

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'CEIBA_WEB_BUILDER_PREVIEW_UPDATE',
        payload: {
          previewSettings,
          themeMode
        }
      },
      '*'
    );
  };

  // Emit instantaneous live preview whenever ANY design state changes
  useEffect(() => {
    emitLivePreviewUpdate();
  }, [
    name, tagline, logoUrl, logoDarkUrl, faviconUrl, selectedPaletteId, themeMode,
    lightColors, darkColors, headerLayoutType, headerHeight, headerRadius, headerMarginTop,
    headerMarginSide, headerBgMode, headerBgColor, headerHasBorder, headerBorderColor,
    headerShadow, headerNavTextColorMode, headerNavTextColorLight, headerNavTextColorDark,
    headerShowTopBar, headerTopBarText, headerTopBarBg, headerTopBarColor,
    headerTopBarItems,
    headerLogoPosition, headerShowName, headerNameSplit, headerNamePart1, headerNamePart2,
    headerNameColor1, headerNameColor2, headerLogoHeight, headerMenuPosition,
    headerShowLangSwitcher, headerEnabledLangs, headerShowThemeToggle, headerCtaText,
    headerCtaStyle, headerScrollEnabled, headerScrollType, headerScrollHeight, headerScrollRadius,
    headerScrollBg, headerScrollOpacity, headerScrollBlur, headerMobileLogoPosition, headerMobileShowCta,
    radius, height, cta, phone, showDocs, showApps, pageSections,
    heroTemplate, heroAlign, heroBottomShape, heroShapeHeight, heroShapeInverted,
    heroPatternOverlay, heroPatternOpacity, heroPatternSize, heroOverlayOpacity,
    heroStudentImageUrl, heroCircleY, heroCircleSize, heroWaveY, heroCurveIntensity, heroBorderWidth, heroLayoutInverted, heroShowSocial, heroCtaSubtext,
    heroPromoShow, heroPromoTitle, heroPromoSubtitle, heroShowPhoneCta, heroPhoneLabel, heroPhoneNumber,
    heroStudentScale, heroStudentX, heroStudentY, heroCircleScale, heroCircleX, heroCircleY2, heroClassroomImageUrl,
    heroBlobScale, heroBlobRotate, heroBlobRadiusType, heroBlobAnimateMorph, heroBlobMorphShapes, heroShowWhatsappPulse, heroButtonRadius,
    heroSticker1Show, heroSticker1ShowDesktop, heroSticker1ShowTablet, heroSticker1ShowMobile, heroSticker1ImageUrl, heroSticker1X, heroSticker1Y, heroSticker1Size, heroSticker1TabletX, heroSticker1TabletY, heroSticker1TabletSize, heroSticker1MobileX, heroSticker1MobileY, heroSticker1MobileSize, heroSticker1Effects,
    heroSticker2Show, heroSticker2ShowDesktop, heroSticker2ShowTablet, heroSticker2ShowMobile, heroSticker2ImageUrl, heroSticker2X, heroSticker2Y, heroSticker2Size, heroSticker2TabletX, heroSticker2TabletY, heroSticker2TabletSize, heroSticker2MobileX, heroSticker2MobileY, heroSticker2MobileSize, heroSticker2Effects,
    heroSticker3Show, heroSticker3ShowDesktop, heroSticker3ShowTablet, heroSticker3ShowMobile, heroSticker3ImageUrl, heroSticker3X, heroSticker3Y, heroSticker3Size, heroSticker3TabletX, heroSticker3TabletY, heroSticker3TabletSize, heroSticker3MobileX, heroSticker3MobileY, heroSticker3MobileSize, heroSticker3Effects,
    heroSplitShowBadge, heroSplitBadgeTitle, heroSplitBadgeSubtitle, heroSplitBadgePosition, heroSplitImageAlign, heroSplitFrameStyle, heroSplitPerspective, heroSplitRotateZ, heroSplitHoverEffect,
    heroFrameRotateZ, heroFrameRotateX, heroFrameRotateY, heroFramePerspective, heroFrameBorderWidth, heroFrameBorderColor, heroFrameRadiusSync, heroFrameRadiusTl, heroFrameRadiusTr, heroFrameRadiusBr, heroFrameRadiusBl,
    heroFrameHoverEffects,
    heroRing0Show, heroRing0X, heroRing0Y, heroRing0Size, heroRing0BorderWidth, heroRing0Color, heroRing0Opacity,
    heroRing1Show, heroRing1X, heroRing1Y, heroRing1Size, heroRing1BorderWidth, heroRing1Color, heroRing1Dashed, heroRing1Opacity,
    heroRing2Show, heroRing2X, heroRing2Y, heroRing2Size, heroRing2BorderWidth, heroRing2Color, heroRing2Dashed, heroRing2Opacity,
    heroRing3Show, heroRing3X, heroRing3Y, heroRing3Size, heroRing3BorderWidth, heroRing3Color, heroRing3Dashed, heroRing3Opacity,
    heroTextPaddingTop, heroTextPaddingBottom,
    heroBadgeShow, heroBadge, heroBadgeEn, heroBadgeColor, heroBadgeFont, heroBadgeSize, heroBadgeMarginTop, heroBadgeMarginBottom,
    heroTitle, heroTitlePart1, heroTitlePart1En, heroTitlePart2, heroTitlePart2En, heroTitleColor1, heroTitleColor2,
    heroTitleFont, heroTitleSize, heroTitleMarginTop, heroTitleMarginBottom,
    heroTitlePart1Tag, heroTitlePart1Font, heroTitlePart1Size, heroTitlePart1MarginTop, heroTitlePart1MarginBottom,
    heroTitlePart2Tag, heroTitlePart2Font, heroTitlePart2Size, heroTitlePart2MarginTop, heroTitlePart2MarginBottom,
    heroSubtitle, heroSubtitleEn, heroSubtitleColor, heroSubtitleFont, heroSubtitleSize, heroSubtitleMarginTop, heroSubtitleMarginBottom,
    heroCtaFont, heroCtaSize, heroCtaMarginTop, heroCtaMarginBottom, heroCtaSubtextSize, heroCta2Font, heroCta2Size,
    heroCtaText, heroCtaTextEn, heroCtaBgColor, heroCtaSubtext, heroCtaSubtextEn,
    heroSecondaryCtaText, heroSecondaryCtaTextEn, heroShowSecondaryCta, heroImageUrl,
    cleanDomain
  ]);

  // Auto-scroll inside drawer to the currently active hero card when opening the Hero tab or catalog
  useEffect(() => {
    if (drawerOpen && activeTab === 'hero' && heroWizardStep === 'catalog') {
      const timer = setTimeout(() => {
        const activeCard = document.getElementById(`hero-card-${heroTemplate}`);
        if (activeCard) {
          activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [drawerOpen, activeTab, heroWizardStep, heroTemplate]);

  const resetToPersistedSettings = () => {
    setName(schoolName || '');
    setTagline(schoolTagline || '');
    setLogoUrl(schoolLogo || '');
    setLogoDarkUrl(settings?.school_logo_dark || schoolLogoDark || '');
    setFaviconUrl(settings?.school_favicon || schoolFavicon || '');
    setRadius((buttonRadius as ButtonRadiusType) || '2xl');
    setHeight((buttonHeight as ButtonHeightType) || 'md');
    setCta(ctaMode || 'whatsapp');
    setPhone(contactPhone || '');
    setShowDocs(showDocumentsInMenu);
    setShowApps(showApplicationsInMenu);

    const initialDomain = settings?.custom_domain || settings?.subdomain || generateDefaultSubdomain(schoolName || '');
    setDomainInput(initialDomain);
    setDomainVerified(settings?.domain_verified === 'true');

    setSelectedPaletteId(settings?.brand_palette_id || 'ceiba-forest');

    setLightColors({
      primary: settings?.brand_primary_color || brandPrimaryColor || '#1b3b2b',
      secondary: settings?.brand_secondary_color || brandSecondaryColor || '#2d5a40',
      accent: settings?.brand_accent_color || brandAccentColor || '#d97706',
      background: settings?.brand_bg_light || '#fbfbf9',
      surface: settings?.brand_surface_light || '#ffffff',
      text: settings?.brand_text_light || '#111827'
    });

    setDarkColors({
      primary: settings?.brand_primary_dark || '#10b981',
      secondary: settings?.brand_secondary_dark || '#064e3b',
      accent: settings?.brand_accent_dark || '#fbbf24',
      background: settings?.brand_bg_dark || '#09130e',
      surface: settings?.brand_surface_dark || '#11231a',
      text: settings?.brand_text_dark || '#f9fafb'
    });

    setHeroWizardStep('catalog');
    setHeroTemplate((settings?.hero_template as any) || 'image-overlay-waves');
    setHeroAlign((settings?.hero_align as any) || 'left');
    setHeroBottomShape((settings?.hero_bottom_shape as any) || 'waves-1');
    setHeroShapeHeight(Number(settings?.hero_shape_height) || 90);
    setHeroShapeInverted(settings?.hero_shape_inverted === 'true');
    setHeroPatternOverlay((settings?.hero_pattern_overlay as any) || 'none');
    setHeroPatternOpacity(
      settings?.hero_pattern_opacity !== undefined && !isNaN(Number(settings?.hero_pattern_opacity))
        ? Number(settings.hero_pattern_opacity)
        : 25
    );
    setHeroPatternSize(
      settings?.hero_pattern_size !== undefined && !isNaN(Number(settings?.hero_pattern_size))
        ? Number(settings.hero_pattern_size)
        : 32
    );
    setHeroOverlayOpacity(settings?.hero_overlay_opacity ? Number(settings.hero_overlay_opacity) : 65);

    setHeroStudentImageUrl(settings?.hero_student_image_url || '');
    setHeroCircleY(Number(settings?.hero_circle_y) || 0);
    setHeroCircleSize(Number(settings?.hero_circle_size) || 520);
    setHeroWaveY(Number(settings?.hero_wave_y) || 40);
    setHeroCurveIntensity(Number(settings?.hero_curve_intensity) || 60);
    setHeroBorderWidth(
      settings?.hero_border_width !== undefined && !isNaN(Number(settings?.hero_border_width))
        ? Number(settings.hero_border_width)
        : 10
    );
    setHeroLayoutInverted(settings?.hero_layout_inverted === 'true');
    setHeroShowSocial(settings?.hero_show_social !== 'false');
    setHeroCtaSubtext(
      settings?.hero_cta_subtext !== undefined ? settings.hero_cta_subtext : 'Inscripciones Abiertas'
    );
    setHeroPromoShow(settings?.hero_promo_show !== 'false');
    setHeroPromoTitle(settings?.hero_promo_title !== undefined ? settings.hero_promo_title : '30%');
    setHeroPromoSubtitle(settings?.hero_promo_subtitle !== undefined ? settings.hero_promo_subtitle : 'DESCUENTO');
    setHeroShowPhoneCta(settings?.hero_show_phone_cta !== 'false');
    setHeroPhoneLabel(settings?.hero_phone_label !== undefined ? settings.hero_phone_label : 'Informes e Inscripciones');
    setHeroPhoneNumber(settings?.hero_phone_number || '');

    setHeroStudentScale(Number(settings?.hero_student_scale) || 100);
    setHeroStudentX(Number(settings?.hero_student_x) || 0);
    setHeroStudentY(Number(settings?.hero_student_y) || 0);
    setHeroCircleScale(Number(settings?.hero_circle_scale) || 100);
    setHeroCircleX(Number(settings?.hero_circle_x) || 0);
    setHeroCircleY2(Number(settings?.hero_circle_y2) || 0);
    setHeroClassroomImageUrl(settings?.hero_classroom_image_url || '');

    setHeroBlobScale(Number(settings?.hero_blob_scale) || 100);
    setHeroBlobRotate(
      settings?.hero_blob_rotate !== undefined && !isNaN(Number(settings?.hero_blob_rotate))
        ? Number(settings.hero_blob_rotate)
        : -4
    );
    setHeroBlobRadiusType((settings?.hero_blob_radius_type as any) || 'blob-1');
    setHeroBlobAnimateMorph(settings?.hero_blob_animate_morph === 'true');
    setHeroBlobMorphShapes(
      settings?.hero_blob_morph_shapes
        ? settings.hero_blob_morph_shapes.split(',').map((s) => s.trim()).filter(Boolean)
        : ['blob-1', 'blob-2', 'leaf']
    );
    setHeroShowWhatsappPulse(settings?.hero_show_whatsapp_pulse !== 'false');
    setHeroButtonRadius((settings?.hero_button_radius as any) || 'pill');

    // Sticker 1 Reset
    setHeroSticker1Show(settings?.hero_sticker_1_show !== 'false');
    setHeroSticker1ShowDesktop(settings?.hero_sticker_1_show_desktop !== 'false');
    setHeroSticker1ShowTablet(settings?.hero_sticker_1_show_tablet !== 'false');
    setHeroSticker1ShowMobile(settings?.hero_sticker_1_show_mobile !== 'false');
    setHeroSticker1ImageUrl(settings?.hero_sticker_1_image_url || '');
    setHeroSticker1X(
      settings?.hero_sticker_1_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_x))
        ? Number(settings.hero_sticker_1_x)
        : 18
    );
    setHeroSticker1Y(
      settings?.hero_sticker_1_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_y))
        ? Number(settings.hero_sticker_1_y)
        : 18
    );
    setHeroSticker1Size(
      settings?.hero_sticker_1_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_size))
        ? Number(settings.hero_sticker_1_size)
        : 110
    );
    setHeroSticker1TabletX(
      settings?.hero_sticker_1_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_x))
        ? Number(settings.hero_sticker_1_tablet_x)
        : (settings?.hero_sticker_1_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_x)) ? Number(settings.hero_sticker_1_x) : 18)
    );
    setHeroSticker1TabletY(
      settings?.hero_sticker_1_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_y))
        ? Number(settings.hero_sticker_1_tablet_y)
        : (settings?.hero_sticker_1_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_y)) ? Number(settings.hero_sticker_1_y) : 18)
    );
    setHeroSticker1TabletSize(
      settings?.hero_sticker_1_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_size))
        ? Number(settings.hero_sticker_1_tablet_size)
        : 95
    );
    setHeroSticker1MobileX(
      settings?.hero_sticker_1_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_x))
        ? Number(settings.hero_sticker_1_mobile_x)
        : (settings?.hero_sticker_1_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_x)) ? Number(settings.hero_sticker_1_x) : 18)
    );
    setHeroSticker1MobileY(
      settings?.hero_sticker_1_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_y))
        ? Number(settings.hero_sticker_1_mobile_y)
        : (settings?.hero_sticker_1_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_y)) ? Number(settings.hero_sticker_1_y) : 18)
    );
    setHeroSticker1MobileSize(
      settings?.hero_sticker_1_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_size))
        ? Number(settings.hero_sticker_1_mobile_size)
        : 80
    );
    setHeroSticker1Effects(parseEffectsArray(settings?.hero_sticker_1_effects, ['float']));

    // Sticker 2 Reset
    setHeroSticker2Show(settings?.hero_sticker_2_show !== 'false');
    setHeroSticker2ShowDesktop(settings?.hero_sticker_2_show_desktop !== 'false');
    setHeroSticker2ShowTablet(settings?.hero_sticker_2_show_tablet !== 'false');
    setHeroSticker2ShowMobile(settings?.hero_sticker_2_show_mobile !== 'false');
    setHeroSticker2ImageUrl(settings?.hero_sticker_2_image_url || '');
    setHeroSticker2X(
      settings?.hero_sticker_2_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_x))
        ? Number(settings.hero_sticker_2_x)
        : 82
    );
    setHeroSticker2Y(
      settings?.hero_sticker_2_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_y))
        ? Number(settings.hero_sticker_2_y)
        : 78
    );
    setHeroSticker2Size(
      settings?.hero_sticker_2_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_size))
        ? Number(settings.hero_sticker_2_size)
        : 120
    );
    setHeroSticker2TabletX(
      settings?.hero_sticker_2_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_x))
        ? Number(settings.hero_sticker_2_tablet_x)
        : (settings?.hero_sticker_2_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_x)) ? Number(settings.hero_sticker_2_x) : 82)
    );
    setHeroSticker2TabletY(
      settings?.hero_sticker_2_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_y))
        ? Number(settings.hero_sticker_2_tablet_y)
        : (settings?.hero_sticker_2_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_y)) ? Number(settings.hero_sticker_2_y) : 78)
    );
    setHeroSticker2TabletSize(
      settings?.hero_sticker_2_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_size))
        ? Number(settings.hero_sticker_2_tablet_size)
        : 105
    );
    setHeroSticker2MobileX(
      settings?.hero_sticker_2_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_x))
        ? Number(settings.hero_sticker_2_mobile_x)
        : (settings?.hero_sticker_2_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_x)) ? Number(settings.hero_sticker_2_x) : 82)
    );
    setHeroSticker2MobileY(
      settings?.hero_sticker_2_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_y))
        ? Number(settings.hero_sticker_2_mobile_y)
        : (settings?.hero_sticker_2_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_y)) ? Number(settings.hero_sticker_2_y) : 78)
    );
    setHeroSticker2MobileSize(
      settings?.hero_sticker_2_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_size))
        ? Number(settings.hero_sticker_2_mobile_size)
        : 90
    );
    setHeroSticker2Effects(parseEffectsArray(settings?.hero_sticker_2_effects, ['float']));

    // Sticker 3 Reset
    setHeroSticker3Show(settings?.hero_sticker_3_show !== 'false');
    setHeroSticker3ShowDesktop(settings?.hero_sticker_3_show_desktop !== 'false');
    setHeroSticker3ShowTablet(settings?.hero_sticker_3_show_tablet !== 'false');
    setHeroSticker3ShowMobile(settings?.hero_sticker_3_show_mobile !== 'false');
    setHeroSticker3ImageUrl(settings?.hero_sticker_3_image_url || '');
    setHeroSticker3X(
      settings?.hero_sticker_3_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_x))
        ? Number(settings.hero_sticker_3_x)
        : 10
    );
    setHeroSticker3Y(
      settings?.hero_sticker_3_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_y))
        ? Number(settings.hero_sticker_3_y)
        : 36
    );
    setHeroSticker3Size(
      settings?.hero_sticker_3_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_size))
        ? Number(settings.hero_sticker_3_size)
        : 48
    );
    setHeroSticker3TabletX(
      settings?.hero_sticker_3_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_x))
        ? Number(settings.hero_sticker_3_tablet_x)
        : (settings?.hero_sticker_3_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_x)) ? Number(settings.hero_sticker_3_x) : 10)
    );
    setHeroSticker3TabletY(
      settings?.hero_sticker_3_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_y))
        ? Number(settings.hero_sticker_3_tablet_y)
        : (settings?.hero_sticker_3_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_y)) ? Number(settings.hero_sticker_3_y) : 36)
    );
    setHeroSticker3TabletSize(
      settings?.hero_sticker_3_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_size))
        ? Number(settings.hero_sticker_3_tablet_size)
        : 42
    );
    setHeroSticker3MobileX(
      settings?.hero_sticker_3_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_x))
        ? Number(settings.hero_sticker_3_mobile_x)
        : (settings?.hero_sticker_3_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_x)) ? Number(settings.hero_sticker_3_x) : 10)
    );
    setHeroSticker3MobileY(
      settings?.hero_sticker_3_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_y))
        ? Number(settings.hero_sticker_3_mobile_y)
        : (settings?.hero_sticker_3_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_y)) ? Number(settings.hero_sticker_3_y) : 36)
    );
    setHeroSticker3MobileSize(
      settings?.hero_sticker_3_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_size))
        ? Number(settings.hero_sticker_3_mobile_size)
        : 36
    );
    setHeroSticker3Effects(parseEffectsArray(settings?.hero_sticker_3_effects, ['pulse', 'rotate-slow']));

    setHeroSplitShowBadge(settings?.hero_split_show_badge !== 'false');
    setHeroSplitBadgeTitle(settings?.hero_split_badge_title || 'Admisiones Abiertas');
    setHeroSplitBadgeSubtitle(settings?.hero_split_badge_subtitle || 'Ciclo Escolar 2026 - Cupos Limitados');
    setHeroSplitBadgePosition((settings?.hero_split_badge_position as any) || 'bottom-right');
    setHeroSplitImageAlign((settings?.hero_split_image_align as any) || 'center');
    setHeroSplitFrameStyle((settings?.hero_split_frame_style as any) || 'glass-card');
    setHeroSplitPerspective((settings?.hero_split_perspective as any) || 'isometric-left');
    setHeroSplitRotateZ(
      settings?.hero_split_rotate_z !== undefined && !isNaN(Number(settings?.hero_split_rotate_z))
        ? Number(settings.hero_split_rotate_z)
        : 0
    );
    setHeroSplitHoverEffect((settings?.hero_split_hover_effect as any) || 'zoom');

    setHeroFrameRotateZ(
      settings?.hero_frame_rotate_z !== undefined && !isNaN(Number(settings?.hero_frame_rotate_z))
        ? Number(settings.hero_frame_rotate_z)
        : -4
    );
    setHeroFrameRotateX(
      settings?.hero_frame_rotate_x !== undefined && !isNaN(Number(settings?.hero_frame_rotate_x))
        ? Number(settings.hero_frame_rotate_x)
        : 0
    );
    setHeroFrameRotateY(
      settings?.hero_frame_rotate_y !== undefined && !isNaN(Number(settings?.hero_frame_rotate_y))
        ? Number(settings.hero_frame_rotate_y)
        : 0
    );
    setHeroFramePerspective(
      settings?.hero_frame_perspective !== undefined && !isNaN(Number(settings?.hero_frame_perspective))
        ? Number(settings.hero_frame_perspective)
        : 1000
    );
    setHeroFrameBorderWidth(
      settings?.hero_frame_border_width !== undefined && !isNaN(Number(settings?.hero_frame_border_width))
        ? Number(settings.hero_frame_border_width)
        : 14
    );
    setHeroFrameBorderColor(settings?.hero_frame_border_color || 'secondary');
    setHeroFrameRadiusSync(settings?.hero_frame_radius_sync !== 'false');
    setHeroFrameRadiusTl(
      settings?.hero_frame_radius_tl !== undefined && !isNaN(Number(settings?.hero_frame_radius_tl))
        ? Number(settings.hero_frame_radius_tl)
        : 42
    );
    setHeroFrameRadiusTr(
      settings?.hero_frame_radius_tr !== undefined && !isNaN(Number(settings?.hero_frame_radius_tr))
        ? Number(settings.hero_frame_radius_tr)
        : 42
    );
    setHeroFrameRadiusBr(
      settings?.hero_frame_radius_br !== undefined && !isNaN(Number(settings?.hero_frame_radius_br))
        ? Number(settings.hero_frame_radius_br)
        : 42
    );
    setHeroFrameRadiusBl(
      settings?.hero_frame_radius_bl !== undefined && !isNaN(Number(settings?.hero_frame_radius_bl))
        ? Number(settings.hero_frame_radius_bl)
        : 42
    );
    setHeroFrameHoverEffects(
      parseEffectsArray(
        settings?.hero_frame_hover_effects || settings?.hero_hover_effects,
        ['zoom', 'glow', 'shimmer']
      )
    );

    setHeroRing0Show(settings?.hero_ring_0_show !== 'false');
    setHeroRing0X(
      settings?.hero_ring_0_x !== undefined && !isNaN(Number(settings?.hero_ring_0_x)) ? Number(settings.hero_ring_0_x) : -16
    );
    setHeroRing0Y(
      settings?.hero_ring_0_y !== undefined && !isNaN(Number(settings?.hero_ring_0_y)) ? Number(settings.hero_ring_0_y) : -16
    );
    setHeroRing0Size(
      settings?.hero_ring_0_size !== undefined && !isNaN(Number(settings?.hero_ring_0_size)) ? Number(settings.hero_ring_0_size) : 112
    );
    setHeroRing0BorderWidth(
      settings?.hero_ring_0_border_width !== undefined && !isNaN(Number(settings?.hero_ring_0_border_width)) ? Number(settings.hero_ring_0_border_width) : 8
    );
    setHeroRing0Color(settings?.hero_ring_0_color || 'primary');
    setHeroRing0Opacity(
      settings?.hero_ring_0_opacity !== undefined && !isNaN(Number(settings?.hero_ring_0_opacity)) ? Number(settings.hero_ring_0_opacity) : 100
    );

    setHeroRing1Show(settings?.hero_ring_1_show !== 'false');
    setHeroRing1X(
      settings?.hero_ring_1_x !== undefined && !isNaN(Number(settings?.hero_ring_1_x)) ? Number(settings.hero_ring_1_x) : 40
    );
    setHeroRing1Y(
      settings?.hero_ring_1_y !== undefined && !isNaN(Number(settings?.hero_ring_1_y)) ? Number(settings.hero_ring_1_y) : -40
    );
    setHeroRing1Size(
      settings?.hero_ring_1_size !== undefined && !isNaN(Number(settings?.hero_ring_1_size)) ? Number(settings.hero_ring_1_size) : 160
    );
    setHeroRing1BorderWidth(
      settings?.hero_ring_1_border_width !== undefined && !isNaN(Number(settings?.hero_ring_1_border_width)) ? Number(settings.hero_ring_1_border_width) : 10
    );
    setHeroRing1Color(settings?.hero_ring_1_color || 'accent');
    setHeroRing1Dashed(settings?.hero_ring_1_dashed === 'true');
    setHeroRing1Opacity(
      settings?.hero_ring_1_opacity !== undefined && !isNaN(Number(settings?.hero_ring_1_opacity)) ? Number(settings.hero_ring_1_opacity) : 100
    );

    setHeroRing2Show(settings?.hero_ring_2_show === 'true');
    setHeroRing2X(
      settings?.hero_ring_2_x !== undefined && !isNaN(Number(settings?.hero_ring_2_x)) ? Number(settings.hero_ring_2_x) : -30
    );
    setHeroRing2Y(
      settings?.hero_ring_2_y !== undefined && !isNaN(Number(settings?.hero_ring_2_y)) ? Number(settings.hero_ring_2_y) : 60
    );
    setHeroRing2Size(
      settings?.hero_ring_2_size !== undefined && !isNaN(Number(settings?.hero_ring_2_size)) ? Number(settings.hero_ring_2_size) : 90
    );
    setHeroRing2BorderWidth(
      settings?.hero_ring_2_border_width !== undefined && !isNaN(Number(settings?.hero_ring_2_border_width)) ? Number(settings.hero_ring_2_border_width) : 6
    );
    setHeroRing2Color(settings?.hero_ring_2_color || 'secondary');
    setHeroRing2Dashed(settings?.hero_ring_2_dashed === 'true');
    setHeroRing2Opacity(
      settings?.hero_ring_2_opacity !== undefined && !isNaN(Number(settings?.hero_ring_2_opacity)) ? Number(settings.hero_ring_2_opacity) : 100
    );

    setHeroRing3Show(settings?.hero_ring_3_show === 'true');
    setHeroRing3X(
      settings?.hero_ring_3_x !== undefined && !isNaN(Number(settings?.hero_ring_3_x)) ? Number(settings.hero_ring_3_x) : 70
    );
    setHeroRing3Y(
      settings?.hero_ring_3_y !== undefined && !isNaN(Number(settings?.hero_ring_3_y)) ? Number(settings.hero_ring_3_y) : 80
    );
    setHeroRing3Size(
      settings?.hero_ring_3_size !== undefined && !isNaN(Number(settings?.hero_ring_3_size)) ? Number(settings.hero_ring_3_size) : 130
    );
    setHeroRing3BorderWidth(
      settings?.hero_ring_3_border_width !== undefined && !isNaN(Number(settings?.hero_ring_3_border_width)) ? Number(settings.hero_ring_3_border_width) : 8
    );
    setHeroRing3Color(settings?.hero_ring_3_color || 'primary');
    setHeroRing3Dashed(settings?.hero_ring_3_dashed === 'true');
    setHeroRing3Opacity(
      settings?.hero_ring_3_opacity !== undefined && !isNaN(Number(settings?.hero_ring_3_opacity)) ? Number(settings.hero_ring_3_opacity) : 100
    );

    setHeroBadge(
      settings?.hero_badge !== undefined ? settings.hero_badge : 'Colegio Montessori 100% Bilingüe'
    );
    setHeroBadgeEn(settings?.hero_badge_en || '');
    setHeroBadgeColor(settings?.hero_badge_color || 'primary');
    setHeroTitlePart1(
      settings?.hero_title_part1 !== undefined
        ? settings.hero_title_part1
        : (settings?.hero_title ? settings.hero_title.split(' ').slice(0, 2).join(' ') : 'Cada niño')
    );
    setHeroTitlePart1En(settings?.hero_title_part1_en || '');
    setHeroTitlePart2(
      settings?.hero_title_part2 !== undefined
        ? settings.hero_title_part2
        : (settings?.hero_title ? settings.hero_title.split(' ').slice(2).join(' ') : 'deja una huella única cuando aprende desde su libertad.')
    );
    setHeroTitlePart2En(settings?.hero_title_part2_en || '');
    setHeroTitleColor1(settings?.hero_title_color_1 || 'primary');
    setHeroTitleColor2(settings?.hero_title_color_2 || 'secondary');
    setHeroTitle(
      settings?.hero_title !== undefined ? settings.hero_title : 'Cada niño deja una huella única cuando aprende desde su libertad.'
    );
    setHeroSubtitle(
      settings?.hero_subtitle !== undefined ? settings.hero_subtitle : 'Fundada con conciencia educativa y responsabilidad hacia los niños de 6 a 12 años de edad.'
    );
    setHeroSubtitleEn(settings?.hero_subtitle_en || '');
    setHeroSubtitleColor(settings?.hero_subtitle_color || 'text');
    setHeroCtaText(
      settings?.hero_cta_text !== undefined ? settings.hero_cta_text : 'Agenda una Visita'
    );
    setHeroCtaTextEn(settings?.hero_cta_text_en || '');
    setHeroCtaBgColor(settings?.hero_cta_bg_color || 'primary');
    setHeroCtaSubtext(settings?.hero_cta_subtext !== undefined ? settings.hero_cta_subtext : '');
    setHeroCtaSubtextEn(settings?.hero_cta_subtext_en || '');
    setHeroSecondaryCtaText(
      settings?.hero_secondary_cta_text !== undefined ? settings.hero_secondary_cta_text : 'Informes'
    );
    setHeroSecondaryCtaTextEn(settings?.hero_secondary_cta_text_en || '');
    setHeroShowSecondaryCta(settings?.hero_show_secondary_cta !== 'false');
    setHeroTextPaddingTop(
      settings?.hero_text_padding_top !== undefined && !isNaN(Number(settings?.hero_text_padding_top))
        ? Number(settings.hero_text_padding_top)
        : 0
    );
    setHeroTextPaddingBottom(
      settings?.hero_text_padding_bottom !== undefined && !isNaN(Number(settings?.hero_text_padding_bottom))
        ? Number(settings.hero_text_padding_bottom)
        : 0
    );
    setHeroBadgeShow(settings?.hero_badge_show !== 'false');
    setHeroBadgeFont(settings?.hero_badge_font || 'default');
    setHeroBadgeSize(
      settings?.hero_badge_size !== undefined && !isNaN(Number(settings?.hero_badge_size))
        ? Number(settings.hero_badge_size)
        : 0
    );
    setHeroBadgeMarginTop(
      settings?.hero_badge_margin_top !== undefined && !isNaN(Number(settings?.hero_badge_margin_top))
        ? Number(settings.hero_badge_margin_top)
        : 0
    );
    setHeroBadgeMarginBottom(
      settings?.hero_badge_margin_bottom !== undefined && !isNaN(Number(settings?.hero_badge_margin_bottom))
        ? Number(settings.hero_badge_margin_bottom)
        : 16
    );
    setHeroTitleFont(settings?.hero_title_font || 'default');
    setHeroTitleSize(
      settings?.hero_title_size !== undefined && !isNaN(Number(settings?.hero_title_size))
        ? Number(settings.hero_title_size)
        : 0
    );
    setHeroTitleMarginTop(
      settings?.hero_title_margin_top !== undefined && !isNaN(Number(settings?.hero_title_margin_top))
        ? Number(settings.hero_title_margin_top)
        : 0
    );
    setHeroTitleMarginBottom(
      settings?.hero_title_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_margin_bottom))
        ? Number(settings.hero_title_margin_bottom)
        : 20
    );
    setHeroTitlePart1Tag(settings?.hero_title_part1_tag || 'h1');
    setHeroTitlePart1Font(settings?.hero_title_part1_font || settings?.hero_title_font || 'default');
    setHeroTitlePart1Size(
      settings?.hero_title_part1_size !== undefined && !isNaN(Number(settings?.hero_title_part1_size))
        ? Number(settings.hero_title_part1_size)
        : (settings?.hero_title_size !== undefined && !isNaN(Number(settings?.hero_title_size)) ? Number(settings.hero_title_size) : 0)
    );
    setHeroTitlePart1MarginTop(
      settings?.hero_title_part1_margin_top !== undefined && !isNaN(Number(settings?.hero_title_part1_margin_top))
        ? Number(settings.hero_title_part1_margin_top)
        : 0
    );
    setHeroTitlePart1MarginBottom(
      settings?.hero_title_part1_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_part1_margin_bottom))
        ? Number(settings.hero_title_part1_margin_bottom)
        : 0
    );
    setHeroTitlePart2Tag(settings?.hero_title_part2_tag || 'h1');
    setHeroTitlePart2Font(settings?.hero_title_part2_font || settings?.hero_title_font || 'default');
    setHeroTitlePart2Size(
      settings?.hero_title_part2_size !== undefined && !isNaN(Number(settings?.hero_title_part2_size))
        ? Number(settings.hero_title_part2_size)
        : (settings?.hero_title_size !== undefined && !isNaN(Number(settings?.hero_title_size)) ? Number(settings.hero_title_size) : 0)
    );
    setHeroTitlePart2MarginTop(
      settings?.hero_title_part2_margin_top !== undefined && !isNaN(Number(settings?.hero_title_part2_margin_top))
        ? Number(settings.hero_title_part2_margin_top)
        : 0
    );
    setHeroTitlePart2MarginBottom(
      settings?.hero_title_part2_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_part2_margin_bottom))
        ? Number(settings.hero_title_part2_margin_bottom)
        : 20
    );
    setHeroSubtitleFont(settings?.hero_subtitle_font || 'default');
    setHeroSubtitleSize(
      settings?.hero_subtitle_size !== undefined && !isNaN(Number(settings?.hero_subtitle_size))
        ? Number(settings.hero_subtitle_size)
        : 0
    );
    setHeroSubtitleMarginTop(
      settings?.hero_subtitle_margin_top !== undefined && !isNaN(Number(settings?.hero_subtitle_margin_top))
        ? Number(settings.hero_subtitle_margin_top)
        : 0
    );
    setHeroSubtitleMarginBottom(
      settings?.hero_subtitle_margin_bottom !== undefined && !isNaN(Number(settings?.hero_subtitle_margin_bottom))
        ? Number(settings.hero_subtitle_margin_bottom)
        : 24
    );
    setHeroCtaFont(settings?.hero_cta_font || 'default');
    setHeroCtaSize(
      settings?.hero_cta_size !== undefined && !isNaN(Number(settings?.hero_cta_size))
        ? Number(settings.hero_cta_size)
        : 0
    );
    setHeroCtaMarginTop(
      settings?.hero_cta_margin_top !== undefined && !isNaN(Number(settings?.hero_cta_margin_top))
        ? Number(settings.hero_cta_margin_top)
        : 8
    );
    setHeroCtaMarginBottom(
      settings?.hero_cta_margin_bottom !== undefined && !isNaN(Number(settings?.hero_cta_margin_bottom))
        ? Number(settings.hero_cta_margin_bottom)
        : 0
    );
    setHeroCtaSubtextSize(
      settings?.hero_cta_subtext_size !== undefined && !isNaN(Number(settings?.hero_cta_subtext_size))
        ? Number(settings.hero_cta_subtext_size)
        : 0
    );
    setHeroCta2Font(settings?.hero_cta2_font || 'default');
    setHeroCta2Size(
      settings?.hero_cta2_size !== undefined && !isNaN(Number(settings?.hero_cta2_size))
        ? Number(settings.hero_cta2_size)
        : 0
    );
    setHeroCtaText(
      settings?.hero_cta_text !== undefined ? settings.hero_cta_text : 'Agenda una Visita'
    );
    setHeroCtaBgColor(settings?.hero_cta_bg_color || 'primary');
    setHeroSecondaryCtaText(
      settings?.hero_secondary_cta_text !== undefined ? settings.hero_secondary_cta_text : 'Informes'
    );
    setHeroShowSecondaryCta(settings?.hero_show_secondary_cta !== 'false');
    setHeroImageUrl(settings?.hero_image_url || '');

    setHeaderLayoutType((settings?.header_layout_type as 'full' | 'floating') || 'floating');
    setHeaderHeight(Number(settings?.header_height) || 72);
    setHeaderRadius((settings?.header_radius as ButtonRadiusType) || '2xl');
    setHeaderMarginTop(Number(settings?.header_margin_top) || 16);
    setHeaderMarginSide(Number(settings?.header_margin_side) || 24);
    setHeaderBgMode((settings?.header_bg_mode as 'transparent' | 'solid' | 'glass') || 'glass');
    setHeaderBgColor(settings?.header_bg_color || '');
    setHeaderHasBorder(settings?.header_has_border !== 'false');
    setHeaderBorderColor(settings?.header_border_color || '');
    setHeaderShadow((settings?.header_shadow as any) || 'md');

    setHeaderNavTextColorMode((settings?.header_nav_text_color_mode as any) || 'auto');
    setHeaderNavTextColorLight(settings?.header_nav_text_color_light || '');
    setHeaderNavTextColorDark(settings?.header_nav_text_color_dark || '');

    setHeaderShowTopBar(settings?.header_show_top_bar === 'true');
    setHeaderTopBarText(settings?.header_top_bar_text || '📍 Admisiones Ciclo 2026-2027 Abiertas • Cupos Limitados');
    setHeaderTopBarBg(settings?.header_top_bar_bg || '');
    setHeaderTopBarColor(settings?.header_top_bar_color || '');

    if (settings?.header_top_bar_items) {
      try {
        const parsed = JSON.parse(settings.header_top_bar_items);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHeaderTopBarItems(parsed);
        } else {
          setHeaderTopBarItems(DEFAULT_TOP_BAR_ITEMS);
        }
      } catch (e) {
        setHeaderTopBarItems(DEFAULT_TOP_BAR_ITEMS);
      }
    } else if (settings?.header_top_bar_text) {
      setHeaderTopBarItems([{ id: '1', icon: 'sparkles', text: settings.header_top_bar_text, url: '' }]);
    } else {
      setHeaderTopBarItems(DEFAULT_TOP_BAR_ITEMS);
    }

    setHeaderLogoPosition((settings?.header_logo_position as any) || 'left');
    setHeaderShowName(settings?.header_show_name !== 'false');
    setHeaderNameSplit(settings?.header_name_split !== 'false');
    setHeaderNamePart1(settings?.header_name_part1 || 'Escuela');
    setHeaderNamePart2(settings?.header_name_part2 || 'Montessori');
    setHeaderNameColor1(settings?.header_name_color1 || '');
    setHeaderNameColor2(settings?.header_name_color2 || '');
    setHeaderLogoHeight(Number(settings?.header_logo_height) || 36);

    setHeaderMenuPosition((settings?.header_menu_position as any) || 'center');
    setHeaderShowLangSwitcher(settings?.header_show_lang_switcher !== 'false');
    setHeaderEnabledLangs(settings?.header_enabled_langs || 'es,en');
    setDefaultLocale(settings?.default_locale || 'es');
    setSeoTitle(settings?.seo_title || '');
    setSeoDescription(settings?.seo_description || '');
    setSeoKeywords(settings?.seo_keywords || '');
    setSeoCanonicalUrl(settings?.seo_canonical_url || '');
    setSeoAllowIndexing(settings?.seo_allow_indexing !== 'false');
    setOgTitle(settings?.og_title || '');
    setOgDescription(settings?.og_description || '');
    setOgImageUrl(settings?.og_image_url || '');
    setHeaderShowThemeToggle(settings?.header_show_theme_toggle !== 'false');
    setHeaderCtaText(settings?.header_cta_text || 'Admisiones');
    setHeaderCtaStyle((settings?.header_cta_style as any) || 'accent');

    setHeaderScrollEnabled(settings?.header_scroll_enabled !== 'false');
    setHeaderScrollType((settings?.header_scroll_type as any) || 'floating');
    setHeaderScrollHeight(Number(settings?.header_scroll_height) || 58);
    setHeaderScrollRadius((settings?.header_scroll_radius as ButtonRadiusType) || 'full');
    setHeaderScrollBg(settings?.header_scroll_bg || '');
    setHeaderScrollOpacity(settings?.header_scroll_opacity ? Number(settings.header_scroll_opacity) : 95);
    setHeaderScrollBlur(settings?.header_scroll_blur !== 'false');

    setHeaderMobileLogoPosition((settings?.header_mobile_logo_pos as any) || 'left');
    setHeaderMobileShowCta(settings?.header_mobile_show_cta !== 'false');

    if (settings?.page_sections_order) {
      try {
        const parsed = JSON.parse(settings.page_sections_order);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPageSections(parsed);
        } else {
          setPageSections(DEFAULT_PAGE_SECTIONS);
        }
      } catch (e) {
        setPageSections(DEFAULT_PAGE_SECTIONS);
      }
    } else {
      setPageSections(DEFAULT_PAGE_SECTIONS);
    }
  };

  const handleCloseDrawerWithoutSaving = () => {
    resetToPersistedSettings();
    setDrawerOpen(false);
  };

  useEffect(() => {
    resetToPersistedSettings();
  }, [settings, schoolName, schoolTagline, schoolLogo, brandPrimaryColor, brandSecondaryColor, brandAccentColor, buttonRadius, buttonHeight, ctaMode, contactPhone, showDocumentsInMenu, showApplicationsInMenu]);

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeDomainInput(e.target.value);
    setDomainInput(sanitized);
    setDomainVerified(false);
  };

  const handleSelectPalette = (palette: ColorPalette) => {
    setSelectedPaletteId(palette.id);
    setLightColors({ ...palette.light });
    setDarkColors({ ...palette.dark });
    toast.success(`Paleta aplicada: ${palette.name}`);
  };

  const handleOpenConfigTab = (tab: DesignerTab) => {
    setActiveTab(tab);
    setDrawerOpen(true);
  };

  // Automatically scroll the iframe preview to the section being edited when drawer opens
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;

    if (!drawerOpen) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SET_CURRENTLY_EDITING_SECTION',
          sectionId: null
        },
        '*'
      );
      return;
    }

    let targetSectionId = '';
    if (activeTab === 'header') targetSectionId = 'header';
    else if (activeTab === 'hero') targetSectionId = 'hero';
    else if (activeTab === 'cta') targetSectionId = 'footer';
    else if (typeof activeTab === 'string' && activeTab.startsWith('section:')) {
      targetSectionId = activeTab.replace('section:', '');
    }

    if (targetSectionId) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SET_CURRENTLY_EDITING_SECTION',
          sectionId: targetSectionId
        },
        '*'
      );

      const timer = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'SCROLL_TO_SECTION',
            sectionId: targetSectionId
          },
          '*'
        );
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, drawerOpen]);

  useEffect(() => {
    const handleChildMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OPEN_SECTION_DRAWER') {
        const targetTab = event.data.targetTab as DesignerTab;
        if (targetTab) {
          handleOpenConfigTab(targetTab);
        }
      }
    };
    window.addEventListener('message', handleChildMessage);
    return () => window.removeEventListener('message', handleChildMessage);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleVerifyDns = async () => {
    if (!isCustom) return;
    setVerifyingDns(true);
    setTimeout(() => {
      setVerifyingDns(false);
      setDomainVerified(true);
      toast.success('¡Dominio verificado con éxito y conectado al servidor!');
    }, 1200);
  };

  const handleSaveDesigner = async () => {
    setSaving(true);
    try {
      let payloadToSave: Record<string, string> = {};

      if (activeTab.startsWith('section:') || activeTab === 'sections') {
        payloadToSave = {
          page_sections_order: JSON.stringify(pageSections)
        };
      } else if (activeTab === 'domain') {
        const isCustomVal = isCustomDomainInput(cleanDomain);
        const subVal = isCustomVal ? generateDefaultSubdomain(name) : (cleanDomain || generateDefaultSubdomain(name));
        const customDomainVal = isCustomVal ? cleanDomain : '';
        payloadToSave = {
          school_name: name.trim(),
          subdomain: subVal,
          custom_domain: customDomainVal,
          domain_verified: isCustomVal && domainVerified ? 'true' : 'false'
        };
      } else if (activeTab === 'branding') {
        payloadToSave = {
          school_logo: logoUrl.trim(),
          school_logo_dark: logoDarkUrl.trim(),
          school_favicon: faviconUrl.trim(),
          brand_palette_id: selectedPaletteId,
          brand_primary_color: lightColors.primary.trim(),
          brand_secondary_color: lightColors.secondary.trim(),
          brand_accent_color: lightColors.accent.trim(),
          brand_bg_light: lightColors.background.trim(),
          brand_surface_light: lightColors.surface.trim(),
          brand_text_light: lightColors.text.trim(),
          brand_primary_dark: darkColors.primary.trim(),
          brand_secondary_dark: darkColors.secondary.trim(),
          brand_accent_dark: darkColors.accent.trim(),
          brand_bg_dark: darkColors.background.trim(),
          brand_surface_dark: darkColors.surface.trim(),
          brand_text_dark: darkColors.text.trim(),
          button_radius: radius,
          button_height: height
        };
      } else if (activeTab === 'languages_seo') {
        payloadToSave = {
          header_show_lang_switcher: headerShowLangSwitcher ? 'true' : 'false',
          header_enabled_langs: headerEnabledLangs,
          default_locale: defaultLocale,
          seo_title: seoTitle.trim(),
          seo_description: seoDescription.trim(),
          seo_keywords: seoKeywords.trim(),
          seo_canonical_url: seoCanonicalUrl.trim(),
          seo_allow_indexing: seoAllowIndexing ? 'true' : 'false',
          og_title: ogTitle.trim(),
          og_description: ogDescription.trim(),
          og_image_url: ogImageUrl.trim()
        };
      } else if (activeTab === 'header') {
        payloadToSave = {
          header_layout_type: headerLayoutType,
          header_height: String(headerHeight),
          header_radius: headerRadius,
          header_margin_top: String(headerMarginTop),
          header_margin_side: String(headerMarginSide),
          header_bg_mode: headerBgMode,
          header_bg_color: headerBgColor,
          header_has_border: headerHasBorder ? 'true' : 'false',
          header_border_color: headerBorderColor,
          header_shadow: headerShadow,
          header_nav_text_color_mode: headerNavTextColorMode,
          header_nav_text_color_light: headerNavTextColorLight.trim(),
          header_nav_text_color_dark: headerNavTextColorDark.trim(),
          header_show_top_bar: headerShowTopBar ? 'true' : 'false',
          header_top_bar_text: headerTopBarText.trim(),
          header_top_bar_bg: headerTopBarBg.trim(),
          header_top_bar_color: headerTopBarColor.trim(),
          header_top_bar_items: JSON.stringify(headerTopBarItems),
          header_logo_position: headerLogoPosition,
          header_show_name: headerShowName ? 'true' : 'false',
          header_name_split: headerNameSplit ? 'true' : 'false',
          header_name_part1: headerNamePart1.trim(),
          header_name_part2: headerNamePart2.trim(),
          header_name_color1: headerNameColor1.trim(),
          header_name_color2: headerNameColor2.trim(),
          header_logo_height: String(headerLogoHeight),
          header_menu_position: headerMenuPosition,
          header_show_theme_toggle: headerShowThemeToggle ? 'true' : 'false',
          header_cta_text: headerCtaText.trim(),
          header_cta_style: headerCtaStyle,
          header_scroll_enabled: headerScrollEnabled ? 'true' : 'false',
          header_scroll_type: headerScrollType,
          header_scroll_height: String(headerScrollHeight),
          header_scroll_radius: headerScrollRadius,
          header_scroll_bg: headerScrollBg.trim(),
          header_scroll_opacity: String(headerScrollOpacity),
          header_scroll_blur: headerScrollBlur ? 'true' : 'false',
          header_mobile_logo_pos: headerMobileLogoPosition,
          header_mobile_show_cta: headerMobileShowCta ? 'true' : 'false'
        };
      } else if (activeTab === 'navigation') {
        payloadToSave = {
          show_documents_in_menu: showDocs ? 'true' : 'false',
          show_applications_in_menu: showApps ? 'true' : 'false'
        };
      } else if (activeTab === 'cta') {
        payloadToSave = {
          cta_mode: cta,
          contact_phone: phone.trim()
        };
      } else if (activeTab === 'hero') {
        payloadToSave = {
          hero_template: heroTemplate,
          hero_align: heroAlign,
          hero_bottom_shape: heroBottomShape,
          hero_shape_height: String(heroShapeHeight),
          hero_shape_inverted: heroShapeInverted ? 'true' : 'false',
          hero_pattern_overlay: heroPatternOverlay,
          hero_pattern_opacity: String(heroPatternOpacity),
          hero_pattern_size: String(heroPatternSize),
          hero_overlay_opacity: String(heroOverlayOpacity),
          hero_student_image_url: heroStudentImageUrl.trim(),
          hero_circle_y: String(heroCircleY),
          hero_circle_size: String(heroCircleSize),
          hero_wave_y: String(heroWaveY),
          hero_curve_intensity: String(heroCurveIntensity),
          hero_border_width: String(heroBorderWidth),
          hero_layout_inverted: heroLayoutInverted ? 'true' : 'false',
          hero_show_social: heroShowSocial ? 'true' : 'false',
          hero_promo_show: heroPromoShow ? 'true' : 'false',
          hero_promo_title: heroPromoTitle.trim(),
          hero_promo_subtitle: heroPromoSubtitle.trim(),
          hero_show_phone_cta: heroShowPhoneCta ? 'true' : 'false',
          hero_phone_label: heroPhoneLabel.trim(),
          hero_phone_number: heroPhoneNumber.trim(),
          hero_student_scale: String(heroStudentScale),
          hero_student_x: String(heroStudentX),
          hero_student_y: String(heroStudentY),
          hero_circle_scale: String(heroCircleScale),
          hero_circle_x: String(heroCircleX),
          hero_circle_y2: String(heroCircleY2),
          hero_classroom_image_url: heroClassroomImageUrl.trim(),
          hero_blob_scale: String(heroBlobScale),
          hero_blob_rotate: String(heroBlobRotate),
          hero_blob_radius_type: heroBlobRadiusType,
          hero_blob_animate_morph: heroBlobAnimateMorph ? 'true' : 'false',
          hero_blob_morph_shapes: heroBlobMorphShapes.join(','),
          hero_show_whatsapp_pulse: heroShowWhatsappPulse ? 'true' : 'false',
          hero_button_radius: heroButtonRadius,
          hero_sticker_1_show: heroSticker1Show ? 'true' : 'false',
          hero_sticker_1_show_desktop: heroSticker1ShowDesktop ? 'true' : 'false',
          hero_sticker_1_show_tablet: heroSticker1ShowTablet ? 'true' : 'false',
          hero_sticker_1_show_mobile: heroSticker1ShowMobile ? 'true' : 'false',
          hero_sticker_1_image_url: heroSticker1ImageUrl.trim(),
          hero_sticker_1_x: String(heroSticker1X),
          hero_sticker_1_y: String(heroSticker1Y),
          hero_sticker_1_size: String(heroSticker1Size),
          hero_sticker_1_tablet_x: String(heroSticker1TabletX),
          hero_sticker_1_tablet_y: String(heroSticker1TabletY),
          hero_sticker_1_tablet_size: String(heroSticker1TabletSize),
          hero_sticker_1_mobile_x: String(heroSticker1MobileX),
          hero_sticker_1_mobile_y: String(heroSticker1MobileY),
          hero_sticker_1_mobile_size: String(heroSticker1MobileSize),
          hero_sticker_1_effects: heroSticker1Effects.join(','),
          hero_sticker_2_show: heroSticker2Show ? 'true' : 'false',
          hero_sticker_2_show_desktop: heroSticker2ShowDesktop ? 'true' : 'false',
          hero_sticker_2_show_tablet: heroSticker2ShowTablet ? 'true' : 'false',
          hero_sticker_2_show_mobile: heroSticker2ShowMobile ? 'true' : 'false',
          hero_sticker_2_image_url: heroSticker2ImageUrl.trim(),
          hero_sticker_2_x: String(heroSticker2X),
          hero_sticker_2_y: String(heroSticker2Y),
          hero_sticker_2_size: String(heroSticker2Size),
          hero_sticker_2_tablet_x: String(heroSticker2TabletX),
          hero_sticker_2_tablet_y: String(heroSticker2TabletY),
          hero_sticker_2_tablet_size: String(heroSticker2TabletSize),
          hero_sticker_2_mobile_x: String(heroSticker2MobileX),
          hero_sticker_2_mobile_y: String(heroSticker2MobileY),
          hero_sticker_2_mobile_size: String(heroSticker2MobileSize),
          hero_sticker_2_effects: heroSticker2Effects.join(','),
          hero_sticker_3_show: heroSticker3Show ? 'true' : 'false',
          hero_sticker_3_show_desktop: heroSticker3ShowDesktop ? 'true' : 'false',
          hero_sticker_3_show_tablet: heroSticker3ShowTablet ? 'true' : 'false',
          hero_sticker_3_show_mobile: heroSticker3ShowMobile ? 'true' : 'false',
          hero_sticker_3_image_url: heroSticker3ImageUrl.trim(),
          hero_sticker_3_x: String(heroSticker3X),
          hero_sticker_3_y: String(heroSticker3Y),
          hero_sticker_3_size: String(heroSticker3Size),
          hero_sticker_3_tablet_x: String(heroSticker3TabletX),
          hero_sticker_3_tablet_y: String(heroSticker3TabletY),
          hero_sticker_3_tablet_size: String(heroSticker3TabletSize),
          hero_sticker_3_mobile_x: String(heroSticker3MobileX),
          hero_sticker_3_mobile_y: String(heroSticker3MobileY),
          hero_sticker_3_mobile_size: String(heroSticker3MobileSize),
          hero_sticker_3_effects: heroSticker3Effects.join(','),
          hero_split_show_badge: heroSplitShowBadge ? 'true' : 'false',
          hero_split_badge_title: heroSplitBadgeTitle.trim(),
          hero_split_badge_subtitle: heroSplitBadgeSubtitle.trim(),
          hero_split_badge_position: heroSplitBadgePosition,
          hero_split_image_align: heroSplitImageAlign,
          hero_split_frame_style: heroSplitFrameStyle,
          hero_split_perspective: heroSplitPerspective,
          hero_split_rotate_z: String(heroSplitRotateZ),
          hero_split_hover_effect: heroSplitHoverEffect,
          hero_frame_rotate_z: String(heroFrameRotateZ),
          hero_frame_rotate_x: String(heroFrameRotateX),
          hero_frame_rotate_y: String(heroFrameRotateY),
          hero_frame_perspective: String(heroFramePerspective),
          hero_frame_border_width: String(heroFrameBorderWidth),
          hero_frame_border_color: heroFrameBorderColor,
          hero_frame_radius_sync: heroFrameRadiusSync ? 'true' : 'false',
          hero_frame_radius_tl: String(heroFrameRadiusTl),
          hero_frame_radius_tr: String(heroFrameRadiusTr),
          hero_frame_radius_br: String(heroFrameRadiusBr),
          hero_frame_radius_bl: String(heroFrameRadiusBl),
          hero_frame_hover_effects: heroFrameHoverEffects.join(','),
          hero_ring_0_show: heroRing0Show ? 'true' : 'false',
          hero_ring_0_x: String(heroRing0X),
          hero_ring_0_y: String(heroRing0Y),
          hero_ring_0_size: String(heroRing0Size),
          hero_ring_0_border_width: String(heroRing0BorderWidth),
          hero_ring_0_color: heroRing0Color,
          hero_ring_0_opacity: String(heroRing0Opacity),
          hero_ring_1_show: heroRing1Show ? 'true' : 'false',
          hero_ring_1_x: String(heroRing1X),
          hero_ring_1_y: String(heroRing1Y),
          hero_ring_1_size: String(heroRing1Size),
          hero_ring_1_border_width: String(heroRing1BorderWidth),
          hero_ring_1_color: heroRing1Color,
          hero_ring_1_dashed: heroRing1Dashed ? 'true' : 'false',
          hero_ring_1_opacity: String(heroRing1Opacity),
          hero_ring_2_show: heroRing2Show ? 'true' : 'false',
          hero_ring_2_x: String(heroRing2X),
          hero_ring_2_y: String(heroRing2Y),
          hero_ring_2_size: String(heroRing2Size),
          hero_ring_2_border_width: String(heroRing2BorderWidth),
          hero_ring_2_color: heroRing2Color,
          hero_ring_2_dashed: heroRing2Dashed ? 'true' : 'false',
          hero_ring_2_opacity: String(heroRing2Opacity),
          hero_ring_3_show: heroRing3Show ? 'true' : 'false',
          hero_ring_3_x: String(heroRing3X),
          hero_ring_3_y: String(heroRing3Y),
          hero_ring_3_size: String(heroRing3Size),
          hero_ring_3_border_width: String(heroRing3BorderWidth),
          hero_ring_3_color: heroRing3Color,
          hero_ring_3_dashed: heroRing3Dashed ? 'true' : 'false',
          hero_ring_3_opacity: String(heroRing3Opacity),
          hero_badge: heroBadge.trim(),
          hero_badge_en: heroBadgeEn.trim(),
          hero_badge_color: heroBadgeColor,
          hero_title: heroTitle.trim(),
          hero_title_part1: heroTitlePart1.trim(),
          hero_title_part1_en: heroTitlePart1En.trim(),
          hero_title_part2: heroTitlePart2.trim(),
          hero_title_part2_en: heroTitlePart2En.trim(),
          hero_title_color_1: heroTitleColor1,
          hero_title_color_2: heroTitleColor2,
          hero_subtitle: heroSubtitle.trim(),
          hero_subtitle_en: heroSubtitleEn.trim(),
          hero_subtitle_color: heroSubtitleColor,
          hero_text_padding_top: String(heroTextPaddingTop),
          hero_text_padding_bottom: String(heroTextPaddingBottom),
          hero_badge_show: heroBadgeShow ? 'true' : 'false',
          hero_badge_font: heroBadgeFont,
          hero_badge_size: String(heroBadgeSize),
          hero_badge_margin_top: String(heroBadgeMarginTop),
          hero_badge_margin_bottom: String(heroBadgeMarginBottom),
          hero_title_font: heroTitleFont,
          hero_title_size: String(heroTitleSize),
          hero_title_margin_top: String(heroTitleMarginTop),
          hero_title_margin_bottom: String(heroTitleMarginBottom),
          hero_title_part1_tag: heroTitlePart1Tag,
          hero_title_part1_font: heroTitlePart1Font,
          hero_title_part1_size: String(heroTitlePart1Size),
          hero_title_part1_margin_top: String(heroTitlePart1MarginTop),
          hero_title_part1_margin_bottom: String(heroTitlePart1MarginBottom),
          hero_title_part2_tag: heroTitlePart2Tag,
          hero_title_part2_font: heroTitlePart2Font,
          hero_title_part2_size: String(heroTitlePart2Size),
          hero_title_part2_margin_top: String(heroTitlePart2MarginTop),
          hero_title_part2_margin_bottom: String(heroTitlePart2MarginBottom),
          hero_subtitle_font: heroSubtitleFont,
          hero_subtitle_size: String(heroSubtitleSize),
          hero_subtitle_margin_top: String(heroSubtitleMarginTop),
          hero_subtitle_margin_bottom: String(heroSubtitleMarginBottom),
          hero_cta_font: heroCtaFont,
          hero_cta_size: String(heroCtaSize),
          hero_cta_margin_top: String(heroCtaMarginTop),
          hero_cta_margin_bottom: String(heroCtaMarginBottom),
          hero_cta_subtext_size: String(heroCtaSubtextSize),
          hero_cta2_font: heroCta2Font,
          hero_cta2_size: String(heroCta2Size),
          hero_cta_text: heroCtaText.trim(),
          hero_cta_text_en: heroCtaTextEn.trim(),
          hero_cta_bg_color: heroCtaBgColor,
          hero_cta_subtext: heroCtaSubtext.trim(),
          hero_cta_subtext_en: heroCtaSubtextEn.trim(),
          hero_secondary_cta_text: heroSecondaryCtaText.trim(),
          hero_secondary_cta_text_en: heroSecondaryCtaTextEn.trim(),
          hero_show_secondary_cta: heroShowSecondaryCta ? 'true' : 'false',
          hero_image_url: heroImageUrl.trim()
        };
      } else {
        // Full payload for hero and general saves
        const isCustomVal = isCustomDomainInput(cleanDomain);
        const subVal = isCustomVal ? generateDefaultSubdomain(name) : (cleanDomain || generateDefaultSubdomain(name));
        const customDomainVal = isCustomVal ? cleanDomain : '';

        payloadToSave = {
          school_name: name.trim(),
          school_tagline: tagline.trim(),
          school_logo: logoUrl.trim(),
          school_logo_dark: logoDarkUrl.trim(),
          school_favicon: faviconUrl.trim(),
          subdomain: subVal,
          custom_domain: customDomainVal,
          domain_verified: isCustomVal && domainVerified ? 'true' : 'false',
          brand_palette_id: selectedPaletteId,
          brand_primary_color: lightColors.primary.trim(),
          brand_secondary_color: lightColors.secondary.trim(),
          brand_accent_color: lightColors.accent.trim(),
          brand_bg_light: lightColors.background.trim(),
          brand_surface_light: lightColors.surface.trim(),
          brand_text_light: lightColors.text.trim(),
          brand_primary_dark: darkColors.primary.trim(),
          brand_secondary_dark: darkColors.secondary.trim(),
          brand_accent_dark: darkColors.accent.trim(),
          brand_bg_dark: darkColors.background.trim(),
          brand_surface_dark: darkColors.surface.trim(),
          brand_text_dark: darkColors.text.trim(),
          header_layout_type: headerLayoutType,
          header_height: String(headerHeight),
          header_radius: headerRadius,
          header_margin_top: String(headerMarginTop),
          header_margin_side: String(headerMarginSide),
          header_bg_mode: headerBgMode,
          header_bg_color: headerBgColor,
          header_has_border: headerHasBorder ? 'true' : 'false',
          header_border_color: headerBorderColor,
          header_shadow: headerShadow,
          header_nav_text_color_mode: headerNavTextColorMode,
          header_nav_text_color_light: headerNavTextColorLight.trim(),
          header_nav_text_color_dark: headerNavTextColorDark.trim(),
          header_show_top_bar: headerShowTopBar ? 'true' : 'false',
          header_top_bar_text: headerTopBarText.trim(),
          header_top_bar_bg: headerTopBarBg.trim(),
          header_top_bar_color: headerTopBarColor.trim(),
          header_top_bar_items: JSON.stringify(headerTopBarItems),
          header_logo_position: headerLogoPosition,
          header_show_name: headerShowName ? 'true' : 'false',
          header_name_split: headerNameSplit ? 'true' : 'false',
          header_name_part1: headerNamePart1.trim(),
          header_name_part2: headerNamePart2.trim(),
          header_name_color1: headerNameColor1.trim(),
          header_name_color2: headerNameColor2.trim(),
          header_logo_height: String(headerLogoHeight),
          header_menu_position: headerMenuPosition,
          header_show_lang_switcher: headerShowLangSwitcher ? 'true' : 'false',
          header_enabled_langs: headerEnabledLangs,
          default_locale: defaultLocale,
          seo_title: seoTitle.trim(),
          seo_description: seoDescription.trim(),
          seo_keywords: seoKeywords.trim(),
          seo_canonical_url: seoCanonicalUrl.trim(),
          seo_allow_indexing: seoAllowIndexing ? 'true' : 'false',
          og_title: ogTitle.trim(),
          og_description: ogDescription.trim(),
          og_image_url: ogImageUrl.trim(),
          header_show_theme_toggle: headerShowThemeToggle ? 'true' : 'false',
          header_cta_text: headerCtaText.trim(),
          header_cta_style: headerCtaStyle,
          header_scroll_enabled: headerScrollEnabled ? 'true' : 'false',
          header_scroll_type: headerScrollType,
          header_scroll_height: String(headerScrollHeight),
          header_scroll_radius: headerScrollRadius,
          header_scroll_bg: headerScrollBg.trim(),
          header_scroll_opacity: String(headerScrollOpacity),
          header_scroll_blur: headerScrollBlur ? 'true' : 'false',
          header_mobile_logo_pos: headerMobileLogoPosition,
          header_mobile_show_cta: headerMobileShowCta ? 'true' : 'false',
          button_radius: radius,
          button_height: height,
          cta_mode: cta,
          contact_phone: phone.trim(),
          show_documents_in_menu: showDocs ? 'true' : 'false',
          show_applications_in_menu: showApps ? 'true' : 'false',
          page_sections_order: JSON.stringify(pageSections),
          hero_template: heroTemplate,
          hero_align: heroAlign,
          hero_bottom_shape: heroBottomShape,
          hero_shape_height: String(heroShapeHeight),
          hero_shape_inverted: heroShapeInverted ? 'true' : 'false',
          hero_pattern_overlay: heroPatternOverlay,
          hero_pattern_opacity: String(heroPatternOpacity),
          hero_pattern_size: String(heroPatternSize),
          hero_overlay_opacity: String(heroOverlayOpacity),
          hero_student_image_url: heroStudentImageUrl.trim(),
          hero_circle_y: String(heroCircleY),
          hero_circle_size: String(heroCircleSize),
          hero_wave_y: String(heroWaveY),
          hero_curve_intensity: String(heroCurveIntensity),
          hero_border_width: String(heroBorderWidth),
          hero_layout_inverted: heroLayoutInverted ? 'true' : 'false',
          hero_show_social: heroShowSocial ? 'true' : 'false',
          hero_promo_show: heroPromoShow ? 'true' : 'false',
          hero_promo_title: heroPromoTitle.trim(),
          hero_promo_subtitle: heroPromoSubtitle.trim(),
          hero_show_phone_cta: heroShowPhoneCta ? 'true' : 'false',
          hero_phone_label: heroPhoneLabel.trim(),
          hero_phone_number: heroPhoneNumber.trim(),
          hero_student_scale: String(heroStudentScale),
          hero_student_x: String(heroStudentX),
          hero_student_y: String(heroStudentY),
          hero_circle_scale: String(heroCircleScale),
          hero_circle_x: String(heroCircleX),
          hero_circle_y2: String(heroCircleY2),
          hero_classroom_image_url: heroClassroomImageUrl.trim(),
          hero_blob_scale: String(heroBlobScale),
          hero_blob_rotate: String(heroBlobRotate),
          hero_blob_radius_type: heroBlobRadiusType,
          hero_blob_animate_morph: heroBlobAnimateMorph ? 'true' : 'false',
          hero_blob_morph_shapes: heroBlobMorphShapes.join(','),
          hero_show_whatsapp_pulse: heroShowWhatsappPulse ? 'true' : 'false',
          hero_button_radius: heroButtonRadius,
          hero_sticker_1_show: heroSticker1Show ? 'true' : 'false',
          hero_sticker_1_show_desktop: heroSticker1ShowDesktop ? 'true' : 'false',
          hero_sticker_1_show_tablet: heroSticker1ShowTablet ? 'true' : 'false',
          hero_sticker_1_show_mobile: heroSticker1ShowMobile ? 'true' : 'false',
          hero_sticker_1_image_url: heroSticker1ImageUrl.trim(),
          hero_sticker_1_x: String(heroSticker1X),
          hero_sticker_1_y: String(heroSticker1Y),
          hero_sticker_1_size: String(heroSticker1Size),
          hero_sticker_1_tablet_x: String(heroSticker1TabletX),
          hero_sticker_1_tablet_y: String(heroSticker1TabletY),
          hero_sticker_1_tablet_size: String(heroSticker1TabletSize),
          hero_sticker_1_mobile_x: String(heroSticker1MobileX),
          hero_sticker_1_mobile_y: String(heroSticker1MobileY),
          hero_sticker_1_mobile_size: String(heroSticker1MobileSize),
          hero_sticker_1_effects: heroSticker1Effects.join(','),
          hero_sticker_2_show: heroSticker2Show ? 'true' : 'false',
          hero_sticker_2_show_desktop: heroSticker2ShowDesktop ? 'true' : 'false',
          hero_sticker_2_show_tablet: heroSticker2ShowTablet ? 'true' : 'false',
          hero_sticker_2_show_mobile: heroSticker2ShowMobile ? 'true' : 'false',
          hero_sticker_2_image_url: heroSticker2ImageUrl.trim(),
          hero_sticker_2_x: String(heroSticker2X),
          hero_sticker_2_y: String(heroSticker2Y),
          hero_sticker_2_size: String(heroSticker2Size),
          hero_sticker_2_tablet_x: String(heroSticker2TabletX),
          hero_sticker_2_tablet_y: String(heroSticker2TabletY),
          hero_sticker_2_tablet_size: String(heroSticker2TabletSize),
          hero_sticker_2_mobile_x: String(heroSticker2MobileX),
          hero_sticker_2_mobile_y: String(heroSticker2MobileY),
          hero_sticker_2_mobile_size: String(heroSticker2MobileSize),
          hero_sticker_2_effects: heroSticker2Effects.join(','),
          hero_sticker_3_show: heroSticker3Show ? 'true' : 'false',
          hero_sticker_3_show_desktop: heroSticker3ShowDesktop ? 'true' : 'false',
          hero_sticker_3_show_tablet: heroSticker3ShowTablet ? 'true' : 'false',
          hero_sticker_3_show_mobile: heroSticker3ShowMobile ? 'true' : 'false',
          hero_sticker_3_image_url: heroSticker3ImageUrl.trim(),
          hero_sticker_3_x: String(heroSticker3X),
          hero_sticker_3_y: String(heroSticker3Y),
          hero_sticker_3_size: String(heroSticker3Size),
          hero_sticker_3_tablet_x: String(heroSticker3TabletX),
          hero_sticker_3_tablet_y: String(heroSticker3TabletY),
          hero_sticker_3_tablet_size: String(heroSticker3TabletSize),
          hero_sticker_3_mobile_x: String(heroSticker3MobileX),
          hero_sticker_3_mobile_y: String(heroSticker3MobileY),
          hero_sticker_3_mobile_size: String(heroSticker3MobileSize),
          hero_sticker_3_effects: heroSticker3Effects.join(','),
          hero_split_show_badge: heroSplitShowBadge ? 'true' : 'false',
          hero_split_badge_title: heroSplitBadgeTitle.trim(),
          hero_split_badge_subtitle: heroSplitBadgeSubtitle.trim(),
          hero_split_badge_position: heroSplitBadgePosition,
          hero_split_image_align: heroSplitImageAlign,
          hero_split_frame_style: heroSplitFrameStyle,
          hero_split_perspective: heroSplitPerspective,
          hero_split_rotate_z: String(heroSplitRotateZ),
          hero_split_hover_effect: heroSplitHoverEffect,
          hero_frame_rotate_z: String(heroFrameRotateZ),
          hero_frame_rotate_x: String(heroFrameRotateX),
          hero_frame_rotate_y: String(heroFrameRotateY),
          hero_frame_perspective: String(heroFramePerspective),
          hero_frame_border_width: String(heroFrameBorderWidth),
          hero_frame_border_color: heroFrameBorderColor,
          hero_frame_radius_sync: heroFrameRadiusSync ? 'true' : 'false',
          hero_frame_radius_tl: String(heroFrameRadiusTl),
          hero_frame_radius_tr: String(heroFrameRadiusTr),
          hero_frame_radius_br: String(heroFrameRadiusBr),
          hero_frame_radius_bl: String(heroFrameRadiusBl),
          hero_frame_hover_effects: heroFrameHoverEffects.join(','),
          hero_ring_0_show: heroRing0Show ? 'true' : 'false',
          hero_ring_0_x: String(heroRing0X),
          hero_ring_0_y: String(heroRing0Y),
          hero_ring_0_size: String(heroRing0Size),
          hero_ring_0_border_width: String(heroRing0BorderWidth),
          hero_ring_0_color: heroRing0Color,
          hero_ring_0_opacity: String(heroRing0Opacity),
          hero_ring_1_show: heroRing1Show ? 'true' : 'false',
          hero_ring_1_x: String(heroRing1X),
          hero_ring_1_y: String(heroRing1Y),
          hero_ring_1_size: String(heroRing1Size),
          hero_ring_1_border_width: String(heroRing1BorderWidth),
          hero_ring_1_color: heroRing1Color,
          hero_ring_1_dashed: heroRing1Dashed ? 'true' : 'false',
          hero_ring_1_opacity: String(heroRing1Opacity),
          hero_ring_2_show: heroRing2Show ? 'true' : 'false',
          hero_ring_2_x: String(heroRing2X),
          hero_ring_2_y: String(heroRing2Y),
          hero_ring_2_size: String(heroRing2Size),
          hero_ring_2_border_width: String(heroRing2BorderWidth),
          hero_ring_2_color: heroRing2Color,
          hero_ring_2_dashed: heroRing2Dashed ? 'true' : 'false',
          hero_ring_2_opacity: String(heroRing2Opacity),
          hero_ring_3_show: heroRing3Show ? 'true' : 'false',
          hero_ring_3_x: String(heroRing3X),
          hero_ring_3_y: String(heroRing3Y),
          hero_ring_3_size: String(heroRing3Size),
          hero_ring_3_border_width: String(heroRing3BorderWidth),
          hero_ring_3_color: heroRing3Color,
          hero_ring_3_dashed: heroRing3Dashed ? 'true' : 'false',
          hero_ring_3_opacity: String(heroRing3Opacity),
          hero_badge: heroBadge.trim(),
          hero_badge_en: heroBadgeEn.trim(),
          hero_badge_color: heroBadgeColor,
          hero_title: heroTitle.trim(),
          hero_title_part1: heroTitlePart1.trim(),
          hero_title_part1_en: heroTitlePart1En.trim(),
          hero_title_part2: heroTitlePart2.trim(),
          hero_title_part2_en: heroTitlePart2En.trim(),
          hero_title_color_1: heroTitleColor1,
          hero_title_color_2: heroTitleColor2,
          hero_subtitle: heroSubtitle.trim(),
          hero_subtitle_en: heroSubtitleEn.trim(),
          hero_subtitle_color: heroSubtitleColor,
          hero_text_padding_top: String(heroTextPaddingTop),
          hero_text_padding_bottom: String(heroTextPaddingBottom),
          hero_badge_show: heroBadgeShow ? 'true' : 'false',
          hero_badge_font: heroBadgeFont,
          hero_badge_size: String(heroBadgeSize),
          hero_badge_margin_top: String(heroBadgeMarginTop),
          hero_badge_margin_bottom: String(heroBadgeMarginBottom),
          hero_title_font: heroTitleFont,
          hero_title_size: String(heroTitleSize),
          hero_title_margin_top: String(heroTitleMarginTop),
          hero_title_margin_bottom: String(heroTitleMarginBottom),
          hero_title_part1_tag: heroTitlePart1Tag,
          hero_title_part1_font: heroTitlePart1Font,
          hero_title_part1_size: String(heroTitlePart1Size),
          hero_title_part1_margin_top: String(heroTitlePart1MarginTop),
          hero_title_part1_margin_bottom: String(heroTitlePart1MarginBottom),
          hero_title_part2_tag: heroTitlePart2Tag,
          hero_title_part2_font: heroTitlePart2Font,
          hero_title_part2_size: String(heroTitlePart2Size),
          hero_title_part2_margin_top: String(heroTitlePart2MarginTop),
          hero_title_part2_margin_bottom: String(heroTitlePart2MarginBottom),
          hero_subtitle_font: heroSubtitleFont,
          hero_subtitle_size: String(heroSubtitleSize),
          hero_subtitle_margin_top: String(heroSubtitleMarginTop),
          hero_subtitle_margin_bottom: String(heroSubtitleMarginBottom),
          hero_cta_font: heroCtaFont,
          hero_cta_size: String(heroCtaSize),
          hero_cta_margin_top: String(heroCtaMarginTop),
          hero_cta_margin_bottom: String(heroCtaMarginBottom),
          hero_cta_subtext_size: String(heroCtaSubtextSize),
          hero_cta2_font: heroCta2Font,
          hero_cta2_size: String(heroCta2Size),
          hero_cta_text: heroCtaText.trim(),
          hero_cta_text_en: heroCtaTextEn.trim(),
          hero_cta_bg_color: heroCtaBgColor,
          hero_cta_subtext: heroCtaSubtext.trim(),
          hero_cta_subtext_en: heroCtaSubtextEn.trim(),
          hero_secondary_cta_text: heroSecondaryCtaText.trim(),
          hero_secondary_cta_text_en: heroSecondaryCtaTextEn.trim(),
          hero_show_secondary_cta: heroShowSecondaryCta ? 'true' : 'false',
          hero_image_url: heroImageUrl.trim()
        };
      }

      await updateSettings(payloadToSave);
      toast.success('¡Cambios guardados y publicados exitosamente!');
      setDrawerOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const renderPaletteColorSelect = (
    value: string,
    onChange: (newVal: string) => void
  ) => {
    const activePalette = themeMode === 'dark' ? darkColors : lightColors;

    const colorOptions = [
      { id: 'primary', label: 'Primario', hex: activePalette.primary },
      { id: 'secondary', label: 'Secundario', hex: activePalette.secondary },
      { id: 'accent', label: 'Acento', hex: activePalette.accent },
      { id: 'text', label: 'Texto', hex: activePalette.text },
      { id: 'background', label: 'Fondo', hex: activePalette.background },
      { id: 'surface', label: 'Superficie', hex: activePalette.surface },
      { id: 'white', label: 'Blanco', hex: '#ffffff' },
      { id: 'dark', label: 'Oscuro', hex: '#0f172a' }
    ];

    const currentOpt = colorOptions.find((c) => c.id === value) || {
      id: value,
      label: 'Personalizado',
      hex: value.startsWith('#') ? value : activePalette.primary
    };

    return (
      <div className="relative inline-block w-full sm:w-44 shrink-0">
        <div className="relative flex items-center">
          <span
            className="absolute left-2.5 w-3.5 h-3.5 rounded-full border border-black/15 shadow-xs pointer-events-none z-10"
            style={{ backgroundColor: currentOpt.hex }}
          />
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-8 pr-7 py-2 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-800 shadow-xs focus:ring-2 focus:ring-forest/20 focus:border-forest appearance-none cursor-pointer transition-all"
          >
            {colorOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-slate-400 text-[10px]">
            ▼
          </div>
        </div>
      </div>
    );
  };

  const renderHeroTextConfigAccordion = ({
    showCtaSubtext = false,
    showSecondaryCta = false
  }: {
    showCtaSubtext?: boolean;
    showSecondaryCta?: boolean;
  } = {}) => (
    <HeroAccordionItem
      id="content"
      title="Textos, Tipografía y Botones"
      subtitle="Insignia, título H1, subtítulo, edición bilingüe (ES/EN), tipografías independientes y márgenes"
      icon={Sparkles}
    >
      <div className="space-y-3.5">
        {/* ========================================================================= */}
        {/* 1. SUBSECCIÓN: INSIGNIA SUPERIOR (BADGE) */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-forest/10 text-forest flex items-center justify-center font-bold text-[11px]">
                1
              </span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Insignia Superior (Badge)</span>
                <span className="text-[10px] text-slate-500">Píldora destacada arriba del título</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Badge
            </span>
          </div>

          {/* Switch para mostrar u ocultar la Insignia */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-800 block">Mostrar Insignia (Badge)</span>
              <span className="text-[10px] text-slate-500">Activa o desactiva la píldora superior sobre el título</span>
            </div>
            <input
              type="checkbox"
              checked={heroBadgeShow}
              onChange={(e) => setHeroBadgeShow(e.target.checked)}
              className="w-4 h-4 accent-forest cursor-pointer"
            />
          </div>

          {heroBadgeShow && (
            <div className="space-y-3 pt-1 border-t border-slate-200/60">
              {/* Textarea Multilingüe a todo lo ancho */}
              <MultilingualTextareaField
                label="Texto de la Insignia:"
                valueEs={heroBadge}
                onChangeEs={setHeroBadge}
                valueEn={heroBadgeEn}
                onChangeEn={setHeroBadgeEn}
                placeholderEs="Ej. Desde 0 a 6 años / Colegio 100% Bilingüe"
                placeholderEn="e.g. Ages 0 to 6 / 100% Bilingual School"
                rows={2}
              />

              {/* Fila debajo: Tipografía a la izquierda, Color a la derecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <CustomFontPicker
                    label="Tipografía de la Insignia:"
                    value={heroBadgeFont}
                    onChange={setHeroBadgeFont}
                  />
                </div>

                <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-700 block">Color de la Insignia:</label>
                  {renderPaletteColorSelect(heroBadgeColor, setHeroBadgeColor)}
                </div>
              </div>

              {/* Control de Tamaño de Fuente */}
              <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span>Tamaño de Fuente (Badge):</span>
                  <span className="font-mono text-forest">
                    {heroBadgeSize === 0 ? 'Automático' : `${heroBadgeSize}px`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={28}
                  step={1}
                  value={heroBadgeSize}
                  onChange={(e) => setHeroBadgeSize(Number(e.target.value))}
                  className="w-full accent-forest cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>0 (Auto)</span>
                  <span>14px</span>
                  <span>28px</span>
                </div>
              </div>

              {/* Márgenes Arriba / Abajo del Badge */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
                  <div className="flex justify-between text-[10px] font-bold text-slate-700">
                    <span>Margen Arriba:</span>
                    <span className="font-mono text-forest">{heroBadgeMarginTop}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={2}
                    value={heroBadgeMarginTop}
                    onChange={(e) => setHeroBadgeMarginTop(Number(e.target.value))}
                    className="w-full accent-forest cursor-pointer mt-1"
                  />
                </div>

                <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
                  <div className="flex justify-between text-[10px] font-bold text-slate-700">
                    <span>Margen Abajo:</span>
                    <span className="font-mono text-forest">{heroBadgeMarginBottom}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={2}
                    value={heroBadgeMarginBottom}
                    onChange={(e) => setHeroBadgeMarginBottom(Number(e.target.value))}
                    className="w-full accent-forest cursor-pointer mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. SUBSECCIÓN: TÍTULOS (PARTE 1 Y PARTE 2) */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-forest/10 text-forest flex items-center justify-center font-bold text-[11px]">
                2
              </span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Textos del Título (Parte 1 y Parte 2)</span>
                <span className="text-[10px] text-slate-500">Configuración independiente de etiquetas HTML (H1-H5, p), fuentes, tamaños y colores</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Headings
            </span>
          </div>

          {/* PARTE 1 CARD */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-forest" />
                Parte 1 (Inicio / Principal)
              </span>

              {/* Selector de Etiqueta HTML */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['h1', 'h2', 'h3', 'h4', 'h5', 'p'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setHeroTitlePart1Tag(tag)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      heroTitlePart1Tag === tag
                        ? 'bg-forest text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <MultilingualTextareaField
              label="Texto Parte 1:"
              valueEs={heroTitlePart1}
              onChangeEs={(val) => {
                setHeroTitlePart1(val);
                setHeroTitle([val, heroTitlePart2].filter(Boolean).join(' '));
              }}
              valueEn={heroTitlePart1En}
              onChangeEn={setHeroTitlePart1En}
              placeholderEs="Ej. Cada niño"
              placeholderEn="e.g. Every child"
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <CustomFontPicker
                  label="Tipografía Parte 1:"
                  value={heroTitlePart1Font}
                  onChange={setHeroTitlePart1Font}
                />
              </div>

              <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-700 block">Color Parte 1:</label>
                {renderPaletteColorSelect(heroTitleColor1, setHeroTitleColor1)}
              </div>
            </div>

            <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Tamaño de Fuente (Parte 1):</span>
                <span className="font-mono text-forest">
                  {heroTitlePart1Size === 0 ? 'Automático' : `${heroTitlePart1Size}px`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={96}
                step={2}
                value={heroTitlePart1Size}
                onChange={(e) => setHeroTitlePart1Size(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>0 (Auto)</span>
                <span>48px</span>
                <span>96px</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span>Margen Arriba:</span>
                  <span className="font-mono text-forest">{heroTitlePart1MarginTop}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={2}
                  value={heroTitlePart1MarginTop}
                  onChange={(e) => setHeroTitlePart1MarginTop(Number(e.target.value))}
                  className="w-full accent-forest cursor-pointer mt-1"
                />
              </div>

              <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span>Margen Abajo:</span>
                  <span className="font-mono text-forest">{heroTitlePart1MarginBottom}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={2}
                  value={heroTitlePart1MarginBottom}
                  onChange={(e) => setHeroTitlePart1MarginBottom(Number(e.target.value))}
                  className="w-full accent-forest cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>

          {/* PARTE 2 CARD */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Parte 2 (Texto Destacado / Continuación)
              </span>

              {/* Selector de Etiqueta HTML */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['h1', 'h2', 'h3', 'h4', 'h5', 'p'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setHeroTitlePart2Tag(tag)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      heroTitlePart2Tag === tag
                        ? 'bg-forest text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <MultilingualTextareaField
              label="Texto Parte 2:"
              valueEs={heroTitlePart2}
              onChangeEs={(val) => {
                setHeroTitlePart2(val);
                setHeroTitle([heroTitlePart1, val].filter(Boolean).join(' '));
              }}
              valueEn={heroTitlePart2En}
              onChangeEn={setHeroTitlePart2En}
              placeholderEs="Ej. deja una huella única cuando aprende desde su libertad."
              placeholderEn="e.g. leaves a unique mark when learning with freedom."
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <CustomFontPicker
                  label="Tipografía Parte 2:"
                  value={heroTitlePart2Font}
                  onChange={setHeroTitlePart2Font}
                />
              </div>

              <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-700 block">Color Parte 2:</label>
                {renderPaletteColorSelect(heroTitleColor2, setHeroTitleColor2)}
              </div>
            </div>

            <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Tamaño de Fuente (Parte 2):</span>
                <span className="font-mono text-forest">
                  {heroTitlePart2Size === 0 ? 'Automático' : `${heroTitlePart2Size}px`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={96}
                step={2}
                value={heroTitlePart2Size}
                onChange={(e) => setHeroTitlePart2Size(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>0 (Auto)</span>
                <span>48px</span>
                <span>96px</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span>Margen Arriba:</span>
                  <span className="font-mono text-forest">{heroTitlePart2MarginTop}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={2}
                  value={heroTitlePart2MarginTop}
                  onChange={(e) => setHeroTitlePart2MarginTop(Number(e.target.value))}
                  className="w-full accent-forest cursor-pointer mt-1"
                />
              </div>

              <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span>Margen Abajo:</span>
                  <span className="font-mono text-forest">{heroTitlePart2MarginBottom}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={2}
                  value={heroTitlePart2MarginBottom}
                  onChange={(e) => setHeroTitlePart2MarginBottom(Number(e.target.value))}
                  className="w-full accent-forest cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SUBSECCIÓN: SUBTÍTULO DESCRIPTIVO */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-forest/10 text-forest flex items-center justify-center font-bold text-[11px]">
                3
              </span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Subtítulo Descriptivo</span>
                <span className="text-[10px] text-slate-500">Texto de apoyo bilingüe, tamaño, color, fuente y márgenes</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Subtitle
            </span>
          </div>

          {/* Textarea Multilingüe a todo lo ancho */}
          <MultilingualTextareaField
            label="Texto del Subtítulo:"
            valueEs={heroSubtitle}
            onChangeEs={setHeroSubtitle}
            valueEn={heroSubtitleEn}
            onChangeEn={setHeroSubtitleEn}
            placeholderEs="Descripción de la propuesta educativa en español..."
            placeholderEn="Educational proposal description in English..."
            rows={3}
          />

          {/* Fila debajo: Tipografía a la izquierda, Color a la derecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <div className="p-2 bg-white rounded-xl border border-slate-200">
              <CustomFontPicker
                label="Tipografía del Subtítulo:"
                value={heroSubtitleFont}
                onChange={setHeroSubtitleFont}
              />
            </div>

            <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
              <label className="text-[10px] font-bold text-slate-700 block">Color del Subtítulo:</label>
              {renderPaletteColorSelect(heroSubtitleColor, setHeroSubtitleColor)}
            </div>
          </div>

          {/* Control de Tamaño de Fuente del Subtítulo */}
          <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
            <div className="flex justify-between text-[10px] font-bold text-slate-700">
              <span>Tamaño de Fuente (Subtítulo):</span>
              <span className="font-mono text-forest">
                {heroSubtitleSize === 0 ? 'Automático' : `${heroSubtitleSize}px`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={44}
              step={1}
              value={heroSubtitleSize}
              onChange={(e) => setHeroSubtitleSize(Number(e.target.value))}
              className="w-full accent-forest cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>0 (Auto)</span>
              <span>22px</span>
              <span>44px</span>
            </div>
          </div>

          {/* Márgenes Arriba / Abajo del Subtítulo */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Margen Arriba:</span>
                <span className="font-mono text-forest">{heroSubtitleMarginTop}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={2}
                value={heroSubtitleMarginTop}
                onChange={(e) => setHeroSubtitleMarginTop(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
            </div>

            <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Margen Abajo:</span>
                <span className="font-mono text-forest">{heroSubtitleMarginBottom}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={2}
                value={heroSubtitleMarginBottom}
                onChange={(e) => setHeroSubtitleMarginBottom(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. SUBSECCIÓN: BOTONES DE ACCIÓN (CTAs) */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-forest/10 text-forest flex items-center justify-center font-bold text-[11px]">
                4
              </span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Botones de Acción (CTAs)</span>
                <span className="text-[10px] text-slate-500">Botón principal, secundario, edición bilingüe y márgenes</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Buttons
            </span>
          </div>

          {/* Botón Principal */}
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
            <MultilingualTextareaField
              label="Texto del Botón Principal (CTA 1):"
              valueEs={heroCtaText}
              onChangeEs={setHeroCtaText}
              valueEn={heroCtaTextEn}
              onChangeEn={setHeroCtaTextEn}
              placeholderEs="Ej. Quiero informes →"
              placeholderEn="e.g. Request Info →"
              rows={2}
            />

            {/* Fila debajo: Tipografía a la izquierda, Color a la derecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <CustomFontPicker
                  label="Tipografía del Botón Principal:"
                  value={heroCtaFont}
                  onChange={setHeroCtaFont}
                />
              </div>

              <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-700 block">Color de Fondo:</label>
                {renderPaletteColorSelect(heroCtaBgColor, setHeroCtaBgColor)}
              </div>
            </div>

            {/* Control de Tamaño de Fuente del Botón Principal */}
            <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Tamaño de Fuente (CTA Principal):</span>
                <span className="font-mono text-forest">
                  {heroCtaSize === 0 ? 'Automático' : `${heroCtaSize}px`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={32}
                step={1}
                value={heroCtaSize}
                onChange={(e) => setHeroCtaSize(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>0 (Auto)</span>
                <span>16px</span>
                <span>32px</span>
              </div>
            </div>
          </div>

          {/* Márgenes Arriba / Abajo del Bloque de Botones */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Margen Arriba (Botones):</span>
                <span className="font-mono text-forest">{heroCtaMarginTop}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={2}
                value={heroCtaMarginTop}
                onChange={(e) => setHeroCtaMarginTop(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
            </div>

            <div className="space-y-1 p-2 bg-white rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Margen Abajo (Botones):</span>
                <span className="font-mono text-forest">{heroCtaMarginBottom}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={2}
                value={heroCtaMarginBottom}
                onChange={(e) => setHeroCtaMarginBottom(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Subtexto opcional */}
          {showCtaSubtext && (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <MultilingualTextareaField
                label="Subtexto del Botón Principal (Opcional):"
                valueEs={heroCtaSubtext}
                onChangeEs={setHeroCtaSubtext}
                valueEn={heroCtaSubtextEn}
                onChangeEn={setHeroCtaSubtextEn}
                placeholderEs="Ej. INSCRIPCIONES ABIERTAS 2026"
                placeholderEn="e.g. ADMISSIONS OPEN 2026"
                rows={2}
              />

              <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span>Tamaño de Fuente (Subtexto):</span>
                  <span className="font-mono text-forest">
                    {heroCtaSubtextSize === 0 ? 'Automático' : `${heroCtaSubtextSize}px`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={heroCtaSubtextSize}
                  onChange={(e) => setHeroCtaSubtextSize(Number(e.target.value))}
                  className="w-full accent-forest cursor-pointer mt-1"
                />
              </div>
            </div>
          )}

          {/* Botón Secundario */}
          {showSecondaryCta && (
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-800 block">Habilitar Botón Secundario (CTA 2)</span>
                  <span className="text-[10px] text-slate-500">Segundo botón de acción (ej. Informes / WhatsApp)</span>
                </div>
                <input
                  type="checkbox"
                  checked={heroShowSecondaryCta}
                  onChange={(e) => setHeroShowSecondaryCta(e.target.checked)}
                  className="w-4 h-4 accent-forest cursor-pointer"
                />
              </div>

              {heroShowSecondaryCta && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <MultilingualTextareaField
                    label="Texto del Botón Secundario:"
                    valueEs={heroSecondaryCtaText}
                    onChangeEs={setHeroSecondaryCtaText}
                    valueEn={heroSecondaryCtaTextEn}
                    onChangeEn={setHeroSecondaryCtaTextEn}
                    placeholderEs="Ej. Informes"
                    placeholderEn="e.g. Inquire"
                    rows={2}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <CustomFontPicker
                        label="Tipografía del Botón Secundario:"
                        value={heroCta2Font}
                        onChange={setHeroCta2Font}
                      />
                    </div>

                    <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between text-[10px] font-bold text-slate-700">
                        <span>Tamaño de Fuente:</span>
                        <span className="font-mono text-forest">
                          {heroCta2Size === 0 ? 'Automático' : `${heroCta2Size}px`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={32}
                        step={1}
                        value={heroCta2Size}
                        onChange={(e) => setHeroCta2Size(Number(e.target.value))}
                        className="w-full accent-forest cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. SUBSECCIÓN: ESPACIADO GENERAL DEL BLOQUE */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-forest/10 text-forest flex items-center justify-center font-bold text-[11px]">
                5
              </span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Espaciado General del Bloque (Padding)</span>
                <span className="text-[10px] text-slate-500">Respiro superior e inferior de la columna de texto</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-forest bg-forest/10 px-2 py-0.5 rounded-md border border-forest/20">
              Padding
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1 p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Espacio Arriba (Top):</span>
                <span className="font-mono text-forest">{heroTextPaddingTop}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={120}
                step={4}
                value={heroTextPaddingTop}
                onChange={(e) => setHeroTextPaddingTop(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
            </div>

            <div className="space-y-1 p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Espacio Abajo (Bottom):</span>
                <span className="font-mono text-forest">{heroTextPaddingBottom}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={120}
                step={4}
                value={heroTextPaddingBottom}
                onChange={(e) => setHeroTextPaddingBottom(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </HeroAccordionItem>
  );

  const renderPatternConfigAccordion = () => (
    <HeroAccordionItem
      id="pattern"
      title="Patrón de Fondo & Textura"
      subtitle={
        heroPatternOverlay === 'none' ? 'Sin patrón activo' :
        heroPatternOverlay === 'dots' ? `Puntos (${heroPatternSize}px, ${heroPatternOpacity}%)` :
        heroPatternOverlay === 'grid' ? `Cuadrícula (${heroPatternSize}px, ${heroPatternOpacity}%)` :
        heroPatternOverlay === 'cross' ? `Cruces Plus (${heroPatternSize}px, ${heroPatternOpacity}%)` :
        heroPatternOverlay === 'diagonal' ? `Rayas Diagonales (${heroPatternSize}px, ${heroPatternOpacity}%)` :
        heroPatternOverlay === 'mesh' ? `Malla Radial (${heroPatternSize}px, ${heroPatternOpacity}%)` :
        `Garabatos (${heroPatternSize}px, ${heroPatternOpacity}%)`
      }
      icon={Shapes}
      badge={heroPatternOverlay !== 'none' ? `${heroPatternOpacity}%` : undefined}
    >
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-2">Tipo de Patrón Superpuesto:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'none', label: 'Sin Patrón', icon: '🚫' },
              { id: 'dots', label: 'Puntos', icon: '⁖' },
              { id: 'grid', label: 'Cuadrícula', icon: '▦' },
              { id: 'cross', label: 'Cruces (+)', icon: '✚' },
              { id: 'diagonal', label: 'Diagonales', icon: '▨' },
              { id: 'mesh', label: 'Malla Radial', icon: '◎' },
              { id: 'doodles', label: 'Garabatos', icon: '✨' }
            ].map((pat) => (
              <button
                key={pat.id}
                type="button"
                onClick={() => setHeroPatternOverlay(pat.id as any)}
                className={`py-2 px-2 text-[11px] font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                  heroPatternOverlay === pat.id
                    ? 'border-forest bg-forest text-white shadow-xs'
                    : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span>{pat.icon}</span>
                <span className="truncate">{pat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {heroPatternOverlay !== 'none' && (
          <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
            {/* Separación / Espaciado (Pattern Size) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Separación / Espaciado del Patrón:</label>
                <span className="text-[11px] font-mono text-forest font-bold">{heroPatternSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={96}
                step={4}
                value={heroPatternSize}
                onChange={(e) => setHeroPatternSize(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 pt-1">
                {[
                  { label: 'Denso (16px)', val: 16 },
                  { label: 'Normal (32px)', val: 32 },
                  { label: 'Espaciado (56px)', val: 56 },
                  { label: 'Amplio (80px)', val: 80 }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setHeroPatternSize(preset.val)}
                    className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all cursor-pointer ${
                      heroPatternSize === preset.val
                        ? 'border-forest bg-forest/10 text-forest font-bold'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacidad */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Opacidad del Patrón:</label>
                <span className="text-[11px] font-mono text-forest font-bold">{heroPatternOpacity}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={heroPatternOpacity}
                onChange={(e) => setHeroPatternOpacity(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </HeroAccordionItem>
  );

  const renderFloatingStickersUniversalConfig = () => (
    <HeroAccordionItem
      id="stickers"
      title="Elementos Flotantes & Stickers"
      subtitle="Subí imágenes transparentes, posiciónalas por dispositivo (Escritorio, Tablet, Móvil) y activá efectos"
      icon={Shapes}
      badge="Universal"
    >
      <div className="space-y-4">
        {/* Device Dimension Indicator (controlled from drawer header) */}
        <div className="flex items-center justify-between p-3 bg-slate-100/90 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${
              viewport === 'desktop'
                ? 'bg-forest/10 text-forest'
                : viewport === 'tablet'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {viewport === 'desktop' && <Laptop className="w-4 h-4" />}
              {viewport === 'tablet' && <Tablet className="w-4 h-4" />}
              {viewport === 'mobile' && <Smartphone className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {viewport === 'desktop' ? 'Configurando: Escritorio' : viewport === 'tablet' ? 'Configurando: Tablet' : 'Configurando: Móvil'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                  viewport === 'desktop'
                    ? 'bg-slate-200 text-slate-700'
                    : viewport === 'tablet'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {viewport === 'desktop' ? '≥ 1024px' : viewport === 'tablet' ? '640px – 1023px' : '< 640px'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Cambiá de dispositivo desde los botones en el encabezado del panel lateral.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-200/60 shadow-3xs">
            <span className={`w-2 h-2 rounded-full transition-all ${viewport === 'desktop' ? 'bg-forest scale-125' : 'bg-slate-300'}`} title="Escritorio" />
            <span className={`w-2 h-2 rounded-full transition-all ${viewport === 'tablet' ? 'bg-indigo-600 scale-125' : 'bg-slate-300'}`} title="Tablet" />
            <span className={`w-2 h-2 rounded-full transition-all ${viewport === 'mobile' ? 'bg-emerald-600 scale-125' : 'bg-slate-300'}`} title="Móvil" />
          </div>
        </div>

        {/* Elemento 1 */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Elemento Flotante 1</span>
            <input
              type="checkbox"
              checked={heroSticker1Show}
              onChange={(e) => setHeroSticker1Show(e.target.checked)}
              className="w-4 h-4 accent-forest cursor-pointer"
            />
          </div>
          {heroSticker1Show && (
            <div className="space-y-3 pt-1 border-t border-slate-200/80">
              <ImageUploadDropzone
                value={heroSticker1ImageUrl}
                onChange={(url) => setHeroSticker1ImageUrl(url)}
                label="Imagen Personalizada (PNG/SVG transparente)"
                helperText="Opcional: Si no subís ninguna, se muestra la ilustración por defecto"
                folder="hero-stickers"
                maxSizeMB={8}
              />

              {/* 1. Desktop Controls */}
              {viewport === 'desktop' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-forest" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Pantallas de Escritorio</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker1ShowDesktop}
                      onChange={(e) => setHeroSticker1ShowDesktop(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker1ShowDesktop ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal (Eje X):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker1X}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker1X}
                          onChange={(e) => setHeroSticker1X(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical (Eje Y):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker1Y}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker1Y}
                          onChange={(e) => setHeroSticker1Y(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño / Ancho:</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker1Size}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={300}
                          step={5}
                          value={heroSticker1Size}
                          onChange={(e) => setHeroSticker1Size(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en pantallas de escritorio (&ge; 1024px).
                    </p>
                  )}
                </div>
              )}

              {/* 2. Tablet Controls */}
              {viewport === 'tablet' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-indigo-200/80 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Tablet className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Tablets (640px - 1023px)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker1ShowTablet}
                      onChange={(e) => setHeroSticker1ShowTablet(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker1ShowTablet ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal Tablet (Eje X):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker1TabletX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker1TabletX}
                          onChange={(e) => setHeroSticker1TabletX(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical Tablet (Eje Y):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker1TabletY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker1TabletY}
                          onChange={(e) => setHeroSticker1TabletY(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño Tablet (Ancho):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker1TabletSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={300}
                          step={5}
                          value={heroSticker1TabletSize}
                          onChange={(e) => setHeroSticker1TabletSize(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en tablets (640px a 1023px).
                    </p>
                  )}
                </div>
              )}

              {/* 3. Mobile Controls */}
              {viewport === 'mobile' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-forest" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Dispositivos Móviles</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker1ShowMobile}
                      onChange={(e) => setHeroSticker1ShowMobile(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker1ShowMobile ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal Móvil (Eje X):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker1MobileX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker1MobileX}
                          onChange={(e) => setHeroSticker1MobileX(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical Móvil (Eje Y):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker1MobileY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker1MobileY}
                          onChange={(e) => setHeroSticker1MobileY(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño Móvil (Ancho):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker1MobileSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={250}
                          step={5}
                          value={heroSticker1MobileSize}
                          onChange={(e) => setHeroSticker1MobileSize(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en celulares y pantallas pequeñas (&lt; 640px).
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-slate-600 block">Efectos Activos (Universal):</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'float', label: '🌊 Flotación' },
                    { id: 'rotate-slow', label: '🔄 Rotación' },
                    { id: 'pulse', label: '💓 Zoom / Pulso' },
                    { id: 'wiggle', label: '📳 Vibración' },
                  ].map((eff) => {
                    const isActive = heroSticker1Effects.includes(eff.id);
                    return (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setHeroSticker1Effects(heroSticker1Effects.filter((e) => e !== eff.id));
                          } else {
                            setHeroSticker1Effects([...heroSticker1Effects, eff.id]);
                          }
                        }}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-left flex items-center justify-between ${
                          isActive
                            ? 'border-forest bg-forest text-white shadow-xs'
                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
                        }`}
                      >
                        <span>{eff.label}</span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Elemento 2 */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Elemento Flotante 2</span>
            <input
              type="checkbox"
              checked={heroSticker2Show}
              onChange={(e) => setHeroSticker2Show(e.target.checked)}
              className="w-4 h-4 accent-forest cursor-pointer"
            />
          </div>
          {heroSticker2Show && (
            <div className="space-y-3 pt-1 border-t border-slate-200/80">
              <ImageUploadDropzone
                value={heroSticker2ImageUrl}
                onChange={(url) => setHeroSticker2ImageUrl(url)}
                label="Imagen Personalizada (PNG/SVG transparente)"
                helperText="Opcional: Si no subís ninguna, se muestra la ilustración por defecto"
                folder="hero-stickers"
                maxSizeMB={8}
              />

              {/* 1. Desktop Controls */}
              {viewport === 'desktop' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-forest" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Pantallas de Escritorio</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker2ShowDesktop}
                      onChange={(e) => setHeroSticker2ShowDesktop(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker2ShowDesktop ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal (Eje X):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker2X}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker2X}
                          onChange={(e) => setHeroSticker2X(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical (Eje Y):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker2Y}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker2Y}
                          onChange={(e) => setHeroSticker2Y(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño / Ancho:</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker2Size}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={300}
                          step={5}
                          value={heroSticker2Size}
                          onChange={(e) => setHeroSticker2Size(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en pantallas de escritorio (&ge; 1024px).
                    </p>
                  )}
                </div>
              )}

              {/* 2. Tablet Controls */}
              {viewport === 'tablet' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-indigo-200/80 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Tablet className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Tablets (640px - 1023px)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker2ShowTablet}
                      onChange={(e) => setHeroSticker2ShowTablet(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker2ShowTablet ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal Tablet (Eje X):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker2TabletX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker2TabletX}
                          onChange={(e) => setHeroSticker2TabletX(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical Tablet (Eje Y):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker2TabletY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker2TabletY}
                          onChange={(e) => setHeroSticker2TabletY(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño Tablet (Ancho):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker2TabletSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={300}
                          step={5}
                          value={heroSticker2TabletSize}
                          onChange={(e) => setHeroSticker2TabletSize(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en tablets (640px a 1023px).
                    </p>
                  )}
                </div>
              )}

              {/* 3. Mobile Controls */}
              {viewport === 'mobile' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-forest" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Dispositivos Móviles</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker2ShowMobile}
                      onChange={(e) => setHeroSticker2ShowMobile(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker2ShowMobile ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal Móvil (Eje X):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker2MobileX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker2MobileX}
                          onChange={(e) => setHeroSticker2MobileX(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical Móvil (Eje Y):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker2MobileY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker2MobileY}
                          onChange={(e) => setHeroSticker2MobileY(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño Móvil (Ancho):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker2MobileSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={250}
                          step={5}
                          value={heroSticker2MobileSize}
                          onChange={(e) => setHeroSticker2MobileSize(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en celulares y pantallas pequeñas (&lt; 640px).
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-slate-600 block">Efectos Activos (Universal):</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'float', label: '🌊 Flotación' },
                    { id: 'rotate-slow', label: '🔄 Rotación' },
                    { id: 'pulse', label: '💓 Zoom / Pulso' },
                    { id: 'wiggle', label: '📳 Vibración' },
                  ].map((eff) => {
                    const isActive = heroSticker2Effects.includes(eff.id);
                    return (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setHeroSticker2Effects(heroSticker2Effects.filter((e) => e !== eff.id));
                          } else {
                            setHeroSticker2Effects([...heroSticker2Effects, eff.id]);
                          }
                        }}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-left flex items-center justify-between ${
                          isActive
                            ? 'border-forest bg-forest text-white shadow-xs'
                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
                        }`}
                      >
                        <span>{eff.label}</span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Elemento 3 */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Elemento Flotante 3</span>
            <input
              type="checkbox"
              checked={heroSticker3Show}
              onChange={(e) => setHeroSticker3Show(e.target.checked)}
              className="w-4 h-4 accent-forest cursor-pointer"
            />
          </div>
          {heroSticker3Show && (
            <div className="space-y-3 pt-1 border-t border-slate-200/80">
              <ImageUploadDropzone
                value={heroSticker3ImageUrl}
                onChange={(url) => setHeroSticker3ImageUrl(url)}
                label="Imagen Personalizada (PNG/SVG transparente)"
                helperText="Opcional: Si no subís ninguna, se muestra el destello por defecto"
                folder="hero-stickers"
                maxSizeMB={8}
              />

              {/* 1. Desktop Controls */}
              {viewport === 'desktop' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-forest" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Pantallas de Escritorio</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker3ShowDesktop}
                      onChange={(e) => setHeroSticker3ShowDesktop(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker3ShowDesktop ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal (Eje X):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker3X}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker3X}
                          onChange={(e) => setHeroSticker3X(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical (Eje Y):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker3Y}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker3Y}
                          onChange={(e) => setHeroSticker3Y(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño / Ancho:</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker3Size}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={300}
                          step={5}
                          value={heroSticker3Size}
                          onChange={(e) => setHeroSticker3Size(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en pantallas de escritorio (&ge; 1024px).
                    </p>
                  )}
                </div>
              )}

              {/* 2. Tablet Controls */}
              {viewport === 'tablet' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-indigo-200/80 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Tablet className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Tablets (640px - 1023px)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker3ShowTablet}
                      onChange={(e) => setHeroSticker3ShowTablet(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker3ShowTablet ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal Tablet (Eje X):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker3TabletX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker3TabletX}
                          onChange={(e) => setHeroSticker3TabletX(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical Tablet (Eje Y):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker3TabletY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker3TabletY}
                          onChange={(e) => setHeroSticker3TabletY(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño Tablet (Ancho):</label>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{heroSticker3TabletSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={300}
                          step={5}
                          value={heroSticker3TabletSize}
                          onChange={(e) => setHeroSticker3TabletSize(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en tablets (640px a 1023px).
                    </p>
                  )}
                </div>
              )}

              {/* 3. Mobile Controls */}
              {viewport === 'mobile' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-forest" />
                      <span className="text-[11px] font-bold text-slate-800">Mostrar en Dispositivos Móviles</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={heroSticker3ShowMobile}
                      onChange={(e) => setHeroSticker3ShowMobile(e.target.checked)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </div>

                  {heroSticker3ShowMobile ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Horizontal Móvil (Eje X):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker3MobileX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker3MobileX}
                          onChange={(e) => setHeroSticker3MobileX(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Posición Vertical Móvil (Eje Y):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker3MobileY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={heroSticker3MobileY}
                          onChange={(e) => setHeroSticker3MobileY(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600">Tamaño Móvil (Ancho):</label>
                          <span className="text-[10px] font-mono text-forest font-bold">{heroSticker3MobileSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={250}
                          step={5}
                          value={heroSticker3MobileSize}
                          onChange={(e) => setHeroSticker3MobileSize(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 font-medium">
                      🚫 Este elemento estará oculto en celulares y pantallas pequeñas (&lt; 640px).
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-slate-600 block">Efectos Activos (Universal):</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'float', label: '🌊 Flotación' },
                    { id: 'rotate-slow', label: '🔄 Rotación' },
                    { id: 'pulse', label: '💓 Zoom / Pulso' },
                    { id: 'wiggle', label: '📳 Vibración' },
                  ].map((eff) => {
                    const isActive = heroSticker3Effects.includes(eff.id);
                    return (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setHeroSticker3Effects(heroSticker3Effects.filter((e) => e !== eff.id));
                          } else {
                            setHeroSticker3Effects([...heroSticker3Effects, eff.id]);
                          }
                        }}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-left flex items-center justify-between ${
                          isActive
                            ? 'border-forest bg-forest text-white shadow-xs'
                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
                        }`}
                      >
                        <span>{eff.label}</span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </HeroAccordionItem>
  );

  const activeSectionId = activeTab.startsWith('section:') ? activeTab.replace('section:', '') : null;
  const activeSection = activeSectionId ? pageSections.find(s => s.id === activeSectionId) : null;
  const activeSectionTemplate = activeSection ? SECTION_TEMPLATES.find(t => t.type === activeSection.type) : null;
  const ActiveSectionIcon = activeSectionTemplate?.icon || Layers;

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-white overflow-hidden relative select-none">
      
      {/* 1. SLIM & MINIMAL TOP HEADER BAR */}
      <header className="h-12 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-forest text-white flex items-center justify-center shadow-2xs border border-forest/30">
            <Globe className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-white text-sm tracking-tight">
            Diseñador Web
          </span>
          <span className="hidden sm:inline-block text-slate-600">•</span>
          <span className="hidden sm:inline-block text-xs text-slate-400 font-medium truncate max-w-xs font-mono">
            {activeHostPreview}
          </span>
        </div>

        {/* Right: Actions (External live site icon + Close icon button) */}
        <div className="flex items-center gap-1.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Abrir sitio web en vivo en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            title="Cerrar Diseñador Web"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE WITH FLOATING TOOLBARS & CENTERED BROWSER PREVIEW */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden [perspective:1100px]">
        

        {/* 2B. FLOATING RIGHT PALETTE (WIDGET / SECTION QUICK ACCESS) */}
        <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
          <button
            type="button"
            onClick={() => handleOpenConfigTab('domain')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              drawerOpen && activeTab === 'domain'
                ? 'bg-forest text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Configurar Dominio y URL"
          >
            <Globe className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenConfigTab('languages_seo')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              drawerOpen && activeTab === 'languages_seo'
                ? 'bg-forest text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Idiomas de la Web, SEO & OpenGraph"
          >
            <Languages className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenConfigTab('branding')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              drawerOpen && activeTab === 'branding'
                ? 'bg-forest text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Identidad de Marca y Paleta de Colores"
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenConfigTab('header')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              drawerOpen && activeTab === 'header'
                ? 'bg-forest text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Diseño del Header & Barra Superior"
          >
            <PanelTop className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenConfigTab('hero')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              drawerOpen && activeTab === 'hero'
                ? 'bg-forest text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Hero Banner (Portada Principal)"
          >
            <Layout className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenConfigTab('sections')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              drawerOpen && activeTab === 'sections'
                ? 'bg-forest text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Estructura & Gestión de Secciones"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* DIVIDER FOR SECTIONS */}
          {pageSections.length > 0 && (
            <div className="w-6 h-px bg-slate-800 my-0.5" />
          )}

          {/* DYNAMIC SECTION BUTTONS (IN THE SAME SEQUENCE AS LAYOUT) */}
          {pageSections.map((section, idx) => {
            const template = SECTION_TEMPLATES.find(t => t.type === section.type);
            const IconComp = template?.icon || Layers;
            const isTabActive = drawerOpen && activeTab === `section:${section.id}`;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleOpenConfigTab(`section:${section.id}`)}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative group cursor-pointer ${
                  isTabActive
                    ? 'bg-forest text-white shadow-md font-bold ring-2 ring-white/20'
                    : section.isEnabled
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/60 opacity-60'
                }`}
                title={`Editar Sección #${idx + 1}: ${section.name}`}
              >
                <IconComp className="w-4 h-4" />
                <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center ${
                  isTabActive
                    ? 'bg-amber-400 text-slate-950 font-extrabold'
                    : section.isEnabled
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-slate-900 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
              </button>
            );
          })}

          {pageSections.length > 0 && (
            <div className="w-6 h-px bg-slate-800 my-0.5" />
          )}

          <button
            type="button"
            onClick={() => handleOpenConfigTab('navigation')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              drawerOpen && activeTab === 'navigation'
                ? 'bg-forest text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Módulos de Navegación"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenConfigTab('cta')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              drawerOpen && activeTab === 'cta'
                ? 'bg-forest text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Botones de Contacto & WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>

        {/* 2C. CENTER BROWSER MOCKUP CANVAS WITH 3D PERSPECTIVE ROTATION */}
        <div
          className={`bg-white rounded-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border border-slate-800 flex flex-col text-slate-900 origin-left will-change-transform ${
            viewport === 'mobile'
              ? 'w-[360px] max-w-[92%] h-[92%]'
              : viewport === 'tablet'
              ? 'w-[768px] max-w-[92%] h-[92%]'
              : 'w-full h-full'
          }`}
          style={{
            transform: drawerOpen
              ? (viewport === 'mobile'
                  ? 'rotateY(10deg) scale(0.84) translateX(0px) translateZ(-30px)'
                  : viewport === 'tablet'
                  ? 'rotateY(8deg) scale(0.88) translateX(0px) translateZ(-20px)'
                  : 'rotateY(4deg) scale(0.92) translateX(0px) translateZ(-10px)')
              : 'rotateY(0deg) scale(1) translateX(0px) translateZ(0px)',
            transformOrigin: 'left center',
            boxShadow: drawerOpen
              ? '0 30px 60px -15px rgba(0, 0, 0, 0.7), 15px 15px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* Simulated Browser Chrome Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 shrink-0 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/90" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
            </div>

            <div className="flex-1 max-w-sm bg-white rounded-lg px-3 py-1 text-[10px] text-slate-600 text-center truncate font-mono border border-slate-200/80 shadow-3xs flex items-center justify-center gap-1.5">
              <span className="text-emerald-600">🔒</span>
              <span>{isLocalhost ? 'http://' : 'https://'}{displayUrl}</span>
            </div>

            <div className="text-[10px] font-mono text-slate-400 hidden sm:block">
              {viewport === 'desktop' ? '1440 × 900' : viewport === 'tablet' ? '768 × 1024' : '375 × 667'}
            </div>
          </div>

          {/* Real Live Website Iframe Render with Real-Time Communication */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-white">
            <iframe
              ref={iframeRef}
              key={`${iframeSrc}-${previewKey}`}
              src={iframeSrc}
              onLoad={emitLivePreviewUpdate}
              title="Previsualización del Sitio Web"
              className="w-full h-full border-0 bg-white"
            />
          </div>
        </div>

      </div>

      {/* 3. RIGHT CONFIGURATION DRAWER (SLIDEOVER) */}
      {(() => {
        const activeDrawerLangsList = headerEnabledLangs
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean)
          .map(code => getLanguageByCode(code));

        return (
          <SlideOverDrawer
            isOpen={drawerOpen}
            onClose={handleCloseDrawerWithoutSaving}
            maxWidthClass="max-w-md lg:max-w-xl"
            hideBackdrop
            icon={
              activeTab === 'domain' ? <Globe className="w-5 h-5 text-forest" /> :
              activeTab === 'languages_seo' ? <Languages className="w-5 h-5 text-forest" /> :
              activeTab === 'branding' ? <Palette className="w-5 h-5 text-forest" /> :
              activeTab === 'header' ? <PanelTop className="w-5 h-5 text-forest" /> :
              activeTab === 'hero' ? <Layout className="w-5 h-5 text-forest" /> :
              activeTab === 'sections' ? <Layers className="w-5 h-5 text-forest" /> :
              activeTab.startsWith('section:') ? <ActiveSectionIcon className="w-5 h-5 text-forest" /> :
              activeTab === 'navigation' ? <Compass className="w-5 h-5 text-forest" /> :
              <MessageCircle className="w-5 h-5 text-forest" />
            }
            title={
              activeTab === 'domain' ? 'Registro del Dominio' :
              activeTab === 'languages_seo' ? 'Idiomas de la Web, SEO & OpenGraph' :
              activeTab === 'branding' ? 'Marca, Paletas & Colores' :
              activeTab === 'header' ? 'Diseño del Header & Barra Superior' :
              activeTab === 'hero' ? 'Hero Banner' :
              activeTab === 'sections' ? 'Estructura & Posición de Secciones' :
              activeTab.startsWith('section:') ? (activeSection?.name || 'Sección') :
              activeTab === 'navigation' ? 'Menú & Navegación' :
              'Contacto & CTA'
            }
            description={
              activeTab === 'domain' ? 'Escribí el subdominio deseado o tu dominio propio con TLD.' :
              activeTab === 'languages_seo' ? 'Definí los idiomas activos de la web, optimización para Google (SEO) y tarjeta de redes sociales.' :
              activeTab === 'branding' ? 'Elegí entre 9 paletas armónicas Montessori o definí colores a medida en modo claro y oscuro.' :
              activeTab === 'header' ? 'Personalizá el header inicial, flotante, transformación en scroll y diseño móvil.' :
              activeTab === 'hero' ? 'Editá los textos de impacto e imagen principal de portada.' :
              activeTab === 'sections' ? 'Reordená, encendé/apagá visibilidad y editá las secciones de la página entre el Hero y el Footer.' :
              activeTab.startsWith('section:') ? 'Personalizá los contenidos, titulares, disposición y elementos de esta sección.' :
              activeTab === 'navigation' ? 'Gestioná la visibilidad de enlaces en la barra pública.' :
              'Configurá el modo de atención por WhatsApp o formulario.'
            }
            headerActions={
              <div className="flex items-center gap-2">
                {/* 1. Device Viewport Mode: Desktop, Tablet, Mobile */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shadow-3xs">
                  <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewport === 'desktop'
                        ? 'bg-white text-forest shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Vista de Escritorio (Desktop)"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('tablet')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewport === 'tablet'
                        ? 'bg-white text-forest shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Vista de Tableta (Tablet)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewport === 'mobile'
                        ? 'bg-white text-forest shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Vista Móvil (Mobile)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 2. Light / Dark Theme Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = themeMode === 'light' ? 'dark' : 'light';
                    setThemeMode(nextMode);
                    setTimeout(() => emitLivePreviewUpdate(), 0);
                  }}
                  className={`flex items-center justify-center p-1.5 rounded-xl border transition-all shadow-3xs cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-sky-400 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-amber-500 hover:bg-slate-50'
                  }`}
                  title={themeMode === 'dark' ? 'Modo Oscuro Activo (Click para Modo Claro)' : 'Modo Claro Activo (Click para Modo Oscuro)'}
                >
                  {themeMode === 'dark' ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : (
                    <Sun className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* 3. Language Selector */}
                {activeDrawerLangsList.length > 1 && (
                  <div className="relative flex items-center shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl pl-2 pr-1.5 py-1 shadow-3xs transition-all focus-within:ring-2 focus-within:ring-forest/20 focus-within:border-forest">
                      <Globe className="w-3.5 h-3.5 text-forest shrink-0" />
                      <select
                        value={builderEditorLang}
                        onChange={(e) => setBuilderEditorLang(e.target.value)}
                        className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer pr-3.5 appearance-none font-sans"
                        title="Seleccionar idioma de edición"
                      >
                        {activeDrawerLangsList.map(lang => (
                          <option key={lang.code} value={lang.code} className="text-slate-900 font-semibold py-1">
                            {lang.flag} {lang.name} ({lang.code.toUpperCase()})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2 shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            }
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <button
              type="button"
              onClick={handleCloseDrawerWithoutSaving}
              className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveDesigner}
              disabled={saving}
              className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar y Publicar</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-6 text-slate-900">

          {/* TAB 0: UNIFIED DOMAIN & SUBDOMAIN MANAGEMENT */}
          {activeTab === 'domain' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* UNIFIED INPUT CARD */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                
                {/* Header & Status Indicator */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 flex items-center justify-center shadow-3xs shrink-0">
                      <Globe className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-forest text-sm">Dirección Web del Colegio</h4>
                      <span className="text-[11px] text-muted-foreground block">
                        {isCustom ? 'Dominio Propio Institucional' : 'Subdominio en MontessoriNexus'}
                      </span>
                    </div>
                  </div>

                  {isCustom ? (
                    domainVerified ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1 shadow-3xs">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>DNS Conectado</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-3xs">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Requiere DNS</span>
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1 shadow-3xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>SSL Automático</span>
                    </span>
                  )}
                </div>

                {/* The Single Unified Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Ingresá el nombre o dominio:
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl border border-slate-300 px-3 py-2.5 shadow-inner focus-within:ring-2 focus-within:ring-forest/20 focus-within:border-forest focus-within:bg-white transition-all">
                    <span className="text-xs font-mono text-slate-400 select-none">https://</span>
                    <input
                      type="text"
                      value={domainInput}
                      onChange={handleDomainChange}
                      placeholder="escuela o colegio.edu.mx"
                      className="w-full text-xs font-mono font-bold text-forest focus:outline-none bg-transparent placeholder:font-normal placeholder:text-slate-400"
                    />
                    {!isCustom && (
                      <span className="text-xs font-mono text-emerald-800 font-semibold select-none whitespace-nowrap bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        .montessorinexus.com
                      </span>
                    )}
                  </div>
                </div>

                {/* Dynamic Explanatory Helper */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-forest text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Detección Automática:</span>
                  </div>
                  {isCustom ? (
                    <p className="leading-relaxed">
                      Detectamos una extensión (TLD). El sistema tratará <strong>{cleanDomain}</strong> como tu <strong>dominio propio</strong>.
                    </p>
                  ) : (
                    <p className="leading-relaxed">
                      Texto sin punto detectado. Tu colegio utilizará el subdominio gratuito <strong>https://{cleanDomain || generateDefaultSubdomain(name)}.montessorinexus.com</strong>. Si querés usar un dominio propio, simplemente agregale la extensión (ej. <code>.com</code> o <code>.edu.mx</code>).
                    </p>
                  )}
                </div>

                {/* URL Direct Copy Bar */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-forest truncate font-bold">
                    https://{activeHostPreview}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`https://${activeHostPreview}`, 'Enlace')}
                    className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-3xs cursor-pointer"
                    title="Copiar enlace completo"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Copiar</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC DNS CONFIGURATION CARD */}
              {isCustom && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-forest text-white flex items-center justify-center shadow-xs shrink-0">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-forest text-xs sm:text-sm">Apuntamiento DNS del Dominio</h4>
                      <span className="text-[10px] text-muted-foreground font-medium">Configurá en tu proveedor para {cleanDomain}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Podés apuntar tu dominio <strong>directamente por IP</strong> o mediante <strong>CNAME</strong> en tu proveedor (Cloudflare, GoDaddy, Namecheap, Google Domains, etc.):
                  </p>

                  <div className="space-y-3 font-mono text-[10px]">
                    {/* Método 1: IP Directa (A Record) */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-forest text-xs flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">A</span>
                          <span>Opción 1: Directo por IP (Recomendado)</span>
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between font-mono text-[11px]">
                        <div>
                          <span className="text-slate-500 mr-2">Host:</span>
                          <span className="font-bold text-forest">@</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">IP:</span>
                          <span className="text-forest font-bold">76.76.21.21</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('76.76.21.21', 'Dirección IP')}
                            className="p-1 rounded text-slate-400 hover:text-forest hover:bg-forest/5 transition-all"
                            title="Copiar IP"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Método 2: CNAME */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">CNAME</span>
                          <span>Opción 2: Registro por Nombre (CNAME)</span>
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between font-mono text-[11px]">
                        <div>
                          <span className="text-slate-500 mr-2">Host:</span>
                          <span className="font-bold text-forest">www</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Destino:</span>
                          <span className="text-forest font-bold">cname.montessorinexus.com</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('cname.montessorinexus.com', 'Destino CNAME')}
                            className="p-1 rounded text-slate-400 hover:text-forest hover:bg-forest/5 transition-all"
                            title="Copiar CNAME"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DNS Verify Action */}
                  <button
                    type="button"
                    onClick={handleVerifyDns}
                    disabled={verifyingDns}
                    className="w-full py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {verifyingDns ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Comprobando Registros DNS...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Verificar Conexión DNS</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 1B: LANGUAGES, SEO & OPENGRAPH */}
          {activeTab === 'languages_seo' && (
            <LanguagesAndSeoTab
              enabledLangsStr={headerEnabledLangs}
              onChangeEnabledLangs={(str) => setHeaderEnabledLangs(str)}
              defaultLocale={defaultLocale}
              onChangeDefaultLocale={(loc) => setDefaultLocale(loc)}
              seoTitle={seoTitle}
              onChangeSeoTitle={(val) => setSeoTitle(val)}
              seoDescription={seoDescription}
              onChangeSeoDescription={(val) => setSeoDescription(val)}
              seoKeywords={seoKeywords}
              onChangeSeoKeywords={(val) => setSeoKeywords(val)}
              seoCanonicalUrl={seoCanonicalUrl}
              onChangeSeoCanonicalUrl={(val) => setSeoCanonicalUrl(val)}
              seoAllowIndexing={seoAllowIndexing}
              onChangeSeoAllowIndexing={(val) => setSeoAllowIndexing(val)}
              ogTitle={ogTitle}
              onChangeOgTitle={(val) => setOgTitle(val)}
              ogDescription={ogDescription}
              onChangeOgDescription={(val) => setOgDescription(val)}
              ogImageUrl={ogImageUrl}
              onChangeOgImageUrl={(val) => setOgImageUrl(val)}
              schoolName={name}
              schoolTagline={tagline}
              siteUrl={`https://${activeHostPreview}`}
            />
          )}

          {/* TAB 1: BRANDING, PALETTES & LOGOS */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-xs">
              
              {/* 1. MASTER UNIFIED THEME SWITCHER AT THE TOP */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                    {themeMode === 'light' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs block">Modo de Identidad Activo</span>
                    <span className="text-[10px] text-slate-400">
                      {themeMode === 'light' ? 'Configurando y previsualizando versión Claro' : 'Configurando y previsualizando versión Oscuro'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      themeMode === 'light'
                        ? 'bg-white text-forest shadow-md font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Claro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-slate-950 text-emerald-400 shadow-md font-extrabold border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Oscuro</span>
                  </button>
                </div>
              </div>

              {/* 2. 9 + 1 PALETTES (NATURAL FULL LENGTH) */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Paletas de Identidad Visual
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    9 combinaciones armónicas + 1 personalizable (mostradas en modo {themeMode === 'light' ? 'Claro' : 'Oscuro'})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CURATED_PALETTES.map((pal) => {
                    const isSelected = selectedPaletteId === pal.id;
                    const preview = themeMode === 'light' ? pal.light : pal.dark;

                    return (
                      <div
                        key={pal.id}
                        onClick={() => handleSelectPalette(pal)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative overflow-hidden group ${
                          isSelected
                            ? 'border-forest ring-2 ring-forest/30 bg-forest/5 shadow-md'
                            : pal.isCustom
                            ? 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/70'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-forest text-white flex items-center justify-center shadow-xs z-10">
                            <Check className="w-3 h-3" />
                          </div>
                        )}

                        <div className="pr-6">
                          <div className="flex items-center gap-1.5">
                            {pal.isCustom && <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                            <h5 className="font-bold text-xs text-forest truncate">{pal.name}</h5>
                          </div>
                          <span className="text-[10px] text-muted-foreground block truncate">{pal.tagline}</span>
                        </div>

                        <div
                          className="rounded-xl p-2.5 border transition-all space-y-2 shadow-2xs"
                          style={{
                            backgroundColor: preview.background,
                            borderColor: `${preview.primary}33`,
                            color: preview.text
                          }}
                        >
                          <div
                            className="h-3.5 rounded-md px-2 flex items-center justify-between text-[8px] font-bold text-white shadow-3xs"
                            style={{ backgroundColor: preview.primary }}
                          >
                            <span className="truncate max-w-[70px]">Colegio</span>
                            <span
                              className="w-2 h-2 rounded-full shadow-3xs"
                              style={{ backgroundColor: preview.accent }}
                            />
                          </div>

                          <div
                            className="p-2.5 rounded-lg border flex items-center justify-between gap-1 shadow-3xs"
                            style={{
                              backgroundColor: preview.surface,
                              borderColor: `${preview.primary}20`
                            }}
                          >
                            <div className="space-y-1 flex-1">
                              <div
                                className="h-1.5 rounded-full w-3/4"
                                style={{ backgroundColor: preview.primary }}
                              />
                              <div
                                className="h-1 rounded-full w-1/2 opacity-50"
                                style={{ backgroundColor: preview.text }}
                              />
                            </div>

                            <div
                              className="px-2 py-0.5 rounded text-[8px] font-bold text-white shadow-3xs shrink-0"
                              style={{ backgroundColor: preview.accent }}
                            >
                              CTA
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px] text-slate-500">
                          <span className="font-medium">
                            {themeMode === 'light' ? 'Modo Claro' : 'Modo Oscuro'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-3xs"
                              style={{ backgroundColor: preview.primary }}
                              title={`Primario: ${preview.primary}`}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-3xs"
                              style={{ backgroundColor: preview.secondary }}
                              title={`Secundario: ${preview.secondary}`}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-3xs"
                              style={{ backgroundColor: preview.accent }}
                              title={`Acento: ${preview.accent}`}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-3xs"
                              style={{ backgroundColor: preview.background }}
                              title={`Fondo: ${preview.background}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. INDIVIDUAL COLOR PICKER & ADVANCED CUSTOMIZER */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-forest" />
                    <div>
                      <h4 className="font-bold text-forest text-xs">
                        Ajuste Fino de Colores ({themeMode === 'light' ? 'Modo Claro' : 'Modo Oscuro'})
                      </h4>
                      <span className="text-[10px] text-muted-foreground">Personalizá cada tono individualmente</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                    {themeMode === 'light' ? '☀️ Editando Claro' : '🌙 Editando Oscuro'}
                  </span>
                </div>

                {themeMode === 'light' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Primario (Claro)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={lightColors.primary}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, primary: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={lightColors.primary}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, primary: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Secundario (Claro)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={lightColors.secondary}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, secondary: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={lightColors.secondary}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, secondary: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Acento / Botones</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={lightColors.accent}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, accent: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={lightColors.accent}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, accent: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Fondo (Canvas)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={lightColors.background}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, background: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={lightColors.background}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, background: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Superficie / Card</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={lightColors.surface}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, surface: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={lightColors.surface}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, surface: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Texto Principal</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={lightColors.text}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, text: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={lightColors.text}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setLightColors({ ...lightColors, text: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Primario (Oscuro)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={darkColors.primary}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, primary: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={darkColors.primary}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, primary: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Secundario (Oscuro)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={darkColors.secondary}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, secondary: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={darkColors.secondary}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, secondary: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Acento / Botones</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={darkColors.accent}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, accent: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={darkColors.accent}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, accent: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Fondo Oscuro</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={darkColors.background}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, background: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={darkColors.background}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, background: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Superficie Oscura</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={darkColors.surface}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, surface: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={darkColors.surface}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, surface: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block truncate">Texto Oscuro</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={darkColors.text}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, text: e.target.value });
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={darkColors.text}
                          onChange={(e) => {
                            setSelectedPaletteId('custom');
                            setDarkColors({ ...darkColors, text: e.target.value });
                          }}
                          className="w-full px-1.5 py-1 text-[10px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. LOGOTIPOS Y FAVICON - FULL WIDTH INDIVIDUAL ELEMENTS */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-forest" />
                  <div>
                    <h4 className="font-bold text-forest text-xs">Identidad Gráfica: Logos & Favicon</h4>
                    <span className="text-[10px] text-muted-foreground">Archivos de imagen oficiales a todo el ancho</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 block">
                      Logo por Defecto (Principal / Modo Claro)
                    </label>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Requerido
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Utilizado en la cabecera principal, portal de familias y fondos claros.
                  </p>
                  <ImageUploadDropzone
                    value={logoUrl}
                    onChange={(url) => setLogoUrl(url)}
                    label="Logo Principal del Colegio"
                    helperText="Formato PNG transparente recomendado (resolución mínima 400x120px)"
                    folder="branding"
                    maxSizeMB={5}
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 block">
                      Logo Modo Oscuro (Variante de Alto Contraste)
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Opcional
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Versión con tipografía blanca o tonos claros para barras de navegación oscuras o modo nocturno.
                  </p>
                  <ImageUploadDropzone
                    value={logoDarkUrl}
                    onChange={(url) => setLogoDarkUrl(url)}
                    label="Logo para Fondos Oscuros"
                    helperText="Formato PNG transparente con elementos claros"
                    folder="branding"
                    maxSizeMB={5}
                  />
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block">Favicon del Navegador</label>
                      <span className="text-[11px] text-muted-foreground">Icono que aparece en la pestaña del explorador</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
                      {faviconUrl ? (
                        <img src={faviconUrl} alt="Favicon Preview" className="w-3.5 h-3.5 object-contain rounded-xs" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-forest" />
                      )}
                      <span className="text-[10px] font-semibold text-slate-800 truncate max-w-[110px]">
                        {name || 'Colegio'}
                      </span>
                    </div>
                  </div>

                  <ImageUploadDropzone
                    value={faviconUrl}
                    onChange={(url) => setFaviconUrl(url)}
                    label="Subir Favicon del Colegio"
                    helperText="Icono cuadrado (.ico o .png de 32x32 / 64x64 / 180x180px)"
                    folder="branding"
                    maxSizeMB={2}
                  />
                </div>
              </div>

              {/* 5. BUTTON RADIUS AND STYLING */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Estilo de Bordes y Redondeo</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'md', '2xl', 'full'] as ButtonRadiusType[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadius(r)}
                      className={`py-2 px-1.5 text-xs font-bold border transition-all text-center cursor-pointer ${
                        radius === r
                          ? 'border-forest bg-forest/10 text-forest shadow-xs font-extrabold'
                          : 'border-slate-200 hover:border-forest/20 text-slate-600 bg-white'
                      } ${r === 'none' ? 'rounded-none' : r === 'md' ? 'rounded-md' : r === '2xl' ? 'rounded-2xl' : 'rounded-full'}`}
                    >
                      {r === 'none' ? 'Recto' : r === 'md' ? 'Medio' : r === '2xl' ? 'Suave' : 'Píldora'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: HEADER DESIGNER (NEW) */}
          {activeTab === 'header' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-xs">
              
              {/* SUBTAB SELECTOR PILLS */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setHeaderViewSubtab('default')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    headerViewSubtab === 'default'
                      ? 'bg-white text-forest shadow-xs'
                      : 'text-slate-600 hover:text-forest'
                  }`}
                >
                  <PanelTop className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Por Defecto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHeaderViewSubtab('scroll')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    headerViewSubtab === 'scroll'
                      ? 'bg-white text-forest shadow-xs'
                      : 'text-slate-600 hover:text-forest'
                  }`}
                >
                  <Layers2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>En Scroll</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHeaderViewSubtab('mobile')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    headerViewSubtab === 'mobile'
                      ? 'bg-white text-forest shadow-xs'
                      : 'text-slate-600 hover:text-forest'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Móvil</span>
                </button>
              </div>

              {/* ==================================================== */}
              {/* A. HEADER POR DEFECTO / ESTADO INICIAL */}
              {/* ==================================================== */}
              {headerViewSubtab === 'default' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* 1. DISPOSICIÓN Y GEOMETRÍA */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">1</div>
                      <h4 className="font-bold text-forest text-xs sm:text-sm">Disposición y Estructura</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setHeaderLayoutType('full')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          headerLayoutType === 'full'
                            ? 'border-forest bg-forest/5 text-forest shadow-xs font-bold ring-2 ring-forest/20'
                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs">A todo lo ancho (Full Width)</span>
                        <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                          Extendido de borde a borde en la pantalla.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHeaderLayoutType('floating')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          headerLayoutType === 'floating'
                            ? 'border-forest bg-forest/5 text-forest shadow-xs font-bold ring-2 ring-forest/20'
                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs">Flotante (Cápsula / Isla)</span>
                        <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                          Separado con márgenes y bordes redondeados.
                        </span>
                      </button>
                    </div>

                    {/* Sliders de Altura y Márgenes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700">Altura del Header:</label>
                          <span className="text-[11px] font-mono text-forest font-bold">{headerHeight}px</span>
                        </div>
                        <input
                          type="range"
                          min={56}
                          max={96}
                          step={2}
                          value={headerHeight}
                          onChange={(e) => setHeaderHeight(Number(e.target.value))}
                          className="w-full accent-forest cursor-pointer"
                        />
                      </div>

                      {headerLayoutType === 'floating' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Margen Superior:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{headerMarginTop}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={32}
                            step={2}
                            value={headerMarginTop}
                            onChange={(e) => setHeaderMarginTop(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {headerLayoutType === 'floating' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Margen Lateral:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{headerMarginSide}px</span>
                          </div>
                          <input
                            type="range"
                            min={12}
                            max={48}
                            step={4}
                            value={headerMarginSide}
                            onChange={(e) => setHeaderMarginSide(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">Redondeo de Cápsula:</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['none', 'md', '2xl', 'full'] as ButtonRadiusType[]).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setHeaderRadius(r)}
                                className={`py-1 text-[10px] font-bold border transition-all text-center cursor-pointer ${
                                  headerRadius === r
                                    ? 'border-forest bg-forest text-white'
                                    : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                } rounded-lg`}
                              >
                                {r === 'none' ? '0px' : r === 'md' ? '8px' : r === '2xl' ? '16px' : '99px'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. FONDO Y ESTILO VISUAL */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">2</div>
                      <h4 className="font-bold text-forest text-xs sm:text-sm">Fondo, Transparencia y Bordes</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setHeaderBgMode('transparent')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          headerBgMode === 'transparent'
                            ? 'border-forest bg-forest/5 text-forest font-bold shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block">Transparente</span>
                        <span className="text-[9px] text-muted-foreground">Sobre el Hero</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHeaderBgMode('glass')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          headerBgMode === 'glass'
                            ? 'border-forest bg-forest/5 text-forest font-bold shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block">Vidrio (Blur)</span>
                        <span className="text-[9px] text-muted-foreground">Efecto Glaseado</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHeaderBgMode('solid')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          headerBgMode === 'solid'
                            ? 'border-forest bg-forest/5 text-forest font-bold shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block">Sólido</span>
                        <span className="text-[9px] text-muted-foreground">Color de Marca</span>
                      </button>
                    </div>

                    {/* CONFIGURACIÓN DE COLORES DE TEXTO PARA HEADER TRANSPARENTE */}
                    {headerBgMode === 'transparent' && (
                      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3 animate-in fade-in duration-200">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-amber-700" />
                            <span>Color de Textos del Menú (Header Transparente)</span>
                          </label>
                          <p className="text-[10px] text-amber-800 leading-snug">
                            Define el color de los enlaces, logotipo y controles del menú cuando el fondo es transparente, con adaptación automática según el modo claro u oscuro.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setHeaderNavTextColorMode('auto')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                              headerNavTextColorMode === 'auto' || headerNavTextColorMode === 'brand'
                                ? 'border-forest bg-white text-forest font-bold shadow-xs ring-2 ring-forest/20'
                                : 'border-amber-200/80 text-slate-700 bg-white/70 hover:bg-white'
                            }`}
                          >
                            <span className="text-[11px] flex items-center gap-1">
                              <span>🌓</span>
                              <span>Contraste Automático</span>
                            </span>
                            <span className="text-[9px] text-muted-foreground font-normal">
                              Oscuro ({lightColors.primary}) en Claro / Blanco en Oscuro.
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHeaderNavTextColorMode('white')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                              headerNavTextColorMode === 'white'
                                ? 'border-forest bg-white text-forest font-bold shadow-xs ring-2 ring-forest/20'
                                : 'border-amber-200/80 text-slate-700 bg-white/70 hover:bg-white'
                            }`}
                          >
                            <span className="text-[11px] flex items-center gap-1">
                              <span>⚪</span>
                              <span>Blanco Fijo</span>
                            </span>
                            <span className="text-[9px] text-muted-foreground font-normal">
                              Siempre blanco (para fotos oscuras en el Hero).
                            </span>
                          </button>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setHeaderNavTextColorMode(headerNavTextColorMode === 'custom' ? 'auto' : 'custom')}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              headerNavTextColorMode === 'custom'
                                ? 'border-forest bg-white text-forest font-bold shadow-xs ring-2 ring-forest/20'
                                : 'border-amber-200/80 text-slate-700 bg-white/70 hover:bg-white'
                            }`}
                          >
                            <span className="text-[11px] flex items-center gap-1.5 font-bold">
                              <span>🎨</span>
                              <span>Personalizar Colores (Modo Claro & Modo Oscuro)</span>
                            </span>
                            <span className="text-[10px] text-forest font-mono font-bold">
                              {headerNavTextColorMode === 'custom' ? 'Activo' : 'Elegir'}
                            </span>
                          </button>

                          {headerNavTextColorMode === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 pt-3 mt-2 border-t border-amber-200 animate-in fade-in duration-200">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-700 block">
                                  ☀️ Modo Claro (Fondo Claro):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={headerNavTextColorLight || lightColors.primary}
                                    onChange={(e) => setHeaderNavTextColorLight(e.target.value)}
                                    className="w-7 h-7 rounded-lg border border-slate-300 p-0.5 bg-white cursor-pointer shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={headerNavTextColorLight || lightColors.primary}
                                    onChange={(e) => setHeaderNavTextColorLight(e.target.value)}
                                    placeholder={lightColors.primary}
                                    className="w-full px-2 py-1 text-[11px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-700 block">
                                  🌙 Modo Oscuro (Fondo Oscuro):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={headerNavTextColorDark || '#ffffff'}
                                    onChange={(e) => setHeaderNavTextColorDark(e.target.value)}
                                    className="w-7 h-7 rounded-lg border border-slate-300 p-0.5 bg-white cursor-pointer shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={headerNavTextColorDark || '#ffffff'}
                                    onChange={(e) => setHeaderNavTextColorDark(e.target.value)}
                                    placeholder="#ffffff"
                                    className="w-full px-2 py-1 text-[11px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-forest block">Borde / Contorno</span>
                          <span className="text-[10px] text-muted-foreground">Línea de contraste inferior</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={headerHasBorder}
                          onChange={(e) => setHeaderHasBorder(e.target.checked)}
                          className="w-4 h-4 accent-forest cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">Sombra (Elevación):</label>
                        <select
                          value={headerShadow}
                          onChange={(e) => setHeaderShadow(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800"
                        >
                          <option value="none">Sin Sombra</option>
                          <option value="sm">Sutil (sm)</option>
                          <option value="md">Media (md)</option>
                          <option value="lg">Elevada (lg)</option>
                          <option value="xl">Flotante Profunda (xl)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. BARRA SUPERIOR DINÁMICA (PRE-HEADER) */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">3</div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Barra Superior Dinámica (Pre-Header)</h4>
                          <span className="text-[10px] text-slate-500">Franja con enlaces, avisos, teléfonos y datos</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={headerShowTopBar}
                        onChange={(e) => setHeaderShowTopBar(e.target.checked)}
                        className="w-5 h-5 accent-forest cursor-pointer"
                      />
                    </div>

                    {headerShowTopBar && (
                      <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                        {/* Colores de Fondo y Texto */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">Color de Fondo:</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={headerTopBarBg || lightColors.primary}
                                onChange={(e) => setHeaderTopBarBg(e.target.value)}
                                className="w-7 h-7 rounded-lg border border-slate-300 p-0.5 bg-white cursor-pointer"
                              />
                              <input
                                type="text"
                                value={headerTopBarBg || lightColors.primary}
                                onChange={(e) => setHeaderTopBarBg(e.target.value)}
                                placeholder="#1b3b2b"
                                className="flex-1 px-2 py-1 text-[11px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">Color de Texto:</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={headerTopBarColor || '#ffffff'}
                                onChange={(e) => setHeaderTopBarColor(e.target.value)}
                                className="w-7 h-7 rounded-lg border border-slate-300 p-0.5 bg-white cursor-pointer"
                              />
                              <input
                                type="text"
                                value={headerTopBarColor || '#ffffff'}
                                onChange={(e) => setHeaderTopBarColor(e.target.value)}
                                placeholder="#ffffff"
                                className="flex-1 px-2 py-1 text-[11px] font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg uppercase"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Items Dinámicos */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-800">
                              Elementos de la Barra ({headerTopBarItems.length}):
                            </label>
                            <button
                              type="button"
                              onClick={handleAddTopBarItem}
                              className="px-2.5 py-1 text-[11px] font-bold bg-forest text-white hover:bg-forest/90 rounded-lg shadow-3xs flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar Item</span>
                            </button>
                          </div>

                          {headerTopBarItems.length === 0 ? (
                            <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                              No hay elementos en la barra superior. Hacé click en "+ Agregar Item".
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {headerTopBarItems.map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group hover:border-slate-300 transition-all shadow-3xs text-slate-900"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                      {/* Icon Selector */}
                                      <div className="flex items-center gap-1">
                                        {[
                                          { val: 'sparkles', label: 'Aviso', icon: Sparkles },
                                          { val: 'phone', label: 'Teléfono', icon: Phone },
                                          { val: 'mail', label: 'Email', icon: Mail },
                                          { val: 'pin', label: 'Ubicación', icon: MapPin },
                                          { val: 'link', label: 'Enlace', icon: Link2 },
                                        ].map((ic) => {
                                          const IconComponent = ic.icon;
                                          const isSelected = item.icon === ic.val;
                                          return (
                                            <button
                                              key={ic.val}
                                              type="button"
                                              onClick={() => handleUpdateTopBarItem(item.id, { icon: ic.val as any })}
                                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                                isSelected
                                                  ? 'bg-forest text-white border-forest shadow-3xs'
                                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                              }`}
                                              title={ic.label}
                                            >
                                              <IconComponent className="w-3.5 h-3.5" />
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTopBarItem(item.id)}
                                      className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                      title="Eliminar elemento"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="space-y-0.5">
                                      <label className="text-[10px] font-bold text-slate-600">Texto a mostrar:</label>
                                      <input
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => handleUpdateTopBarItem(item.id, { text: e.target.value })}
                                        placeholder="Ej: +52 998 123 4567"
                                        className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:ring-2 focus:ring-forest/20 focus:border-forest"
                                      />
                                    </div>

                                    <div className="space-y-0.5">
                                      <label className="text-[10px] font-bold text-slate-600">Enlace / URL (opcional):</label>
                                      <input
                                        type="text"
                                        value={item.url || ''}
                                        onChange={(e) => handleUpdateTopBarItem(item.id, { url: e.target.value })}
                                        placeholder="Ej: tel:+52998... o /#contacto"
                                        className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:ring-2 focus:ring-forest/20 focus:border-forest"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. LOGOTIPO & NOMBRE DEL COLEGIO */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">4</div>
                      <h4 className="font-bold text-forest text-xs sm:text-sm">Logotipo y Nombre del Colegio</h4>
                    </div>

                    {/* Posición del Logo */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">Posición del Logo:</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['left', 'center', 'right', 'hidden'] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setHeaderLogoPosition(pos)}
                            className={`py-2 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl ${
                              headerLogoPosition === pos
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            {pos === 'left' ? 'Izquierda' : pos === 'center' ? 'Centro' : pos === 'right' ? 'Derecha' : 'Oculto'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nombre del Colegio al lado del Logo */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">
                          Mostrar nombre del colegio junto al logo:
                        </label>
                        <input
                          type="checkbox"
                          checked={headerShowName}
                          onChange={(e) => setHeaderShowName(e.target.checked)}
                          className="w-4 h-4 accent-forest cursor-pointer"
                        />
                      </div>

                      {headerShowName && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-forest">
                              Dividir en dos palabras con colores independientes:
                            </label>
                            <input
                              type="checkbox"
                              checked={headerNameSplit}
                              onChange={(e) => setHeaderNameSplit(e.target.checked)}
                              className="w-4 h-4 accent-forest cursor-pointer"
                            />
                          </div>

                          {headerNameSplit ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600">Palabra 1:</label>
                                <input
                                  type="text"
                                  value={headerNamePart1}
                                  onChange={(e) => setHeaderNamePart1(e.target.value)}
                                  placeholder="Escuela"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                                />
                                <div className="flex items-center gap-1.5 pt-1">
                                  <input
                                    type="color"
                                    value={headerNameColor1 || lightColors.primary}
                                    onChange={(e) => setHeaderNameColor1(e.target.value)}
                                    className="w-5 h-5 rounded cursor-pointer border p-0 bg-white"
                                  />
                                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                                    {headerNameColor1 || lightColors.primary}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600">Palabra 2:</label>
                                <input
                                  type="text"
                                  value={headerNamePart2}
                                  onChange={(e) => setHeaderNamePart2(e.target.value)}
                                  placeholder="Montessori"
                                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                                />
                                <div className="flex items-center gap-1.5 pt-1">
                                  <input
                                    type="color"
                                    value={headerNameColor2 || lightColors.accent}
                                    onChange={(e) => setHeaderNameColor2(e.target.value)}
                                    className="w-5 h-5 rounded cursor-pointer border p-0 bg-white"
                                  />
                                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                                    {headerNameColor2 || lightColors.accent}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600">Nombre Completo:</label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Escuela Montessori"
                                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. MENÚ, IDIOMAS, TEMA Y CTA */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">5</div>
                      <h4 className="font-bold text-forest text-xs sm:text-sm">Menú, Idiomas y Botón de Acción</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-forest block">Cambio de Idioma</span>
                          <span className="text-[10px] text-muted-foreground">Selector de idiomas (ES, EN, etc.)</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={headerShowLangSwitcher}
                          onChange={(e) => setHeaderShowLangSwitcher(e.target.checked)}
                          className="w-4 h-4 accent-forest cursor-pointer"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-forest block">Modo Claro / Oscuro</span>
                          <span className="text-[10px] text-muted-foreground">Botón de tema en el header</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={headerShowThemeToggle}
                          onChange={(e) => setHeaderShowThemeToggle(e.target.checked)}
                          className="w-4 h-4 accent-forest cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Botón CTA del Header */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Texto del Botón CTA en Header:
                      </label>
                      <input
                        type="text"
                        value={headerCtaText}
                        onChange={(e) => setHeaderCtaText(e.target.value)}
                        placeholder="Ej. Admisiones o Conocer Salones"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* ==================================================== */}
              {/* B. HEADER EN SCROLL / TRANSFORMACIÓN DINÁMICA */}
              {/* ==================================================== */}
              {headerViewSubtab === 'scroll' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                          <Layers2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-forest text-sm">Transformación al Hacer Scroll</h4>
                          <span className="text-[11px] text-muted-foreground">Animación y comportamiento al deslizar la página</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={headerScrollEnabled}
                        onChange={(e) => setHeaderScrollEnabled(e.target.checked)}
                        className="w-5 h-5 accent-forest cursor-pointer"
                      />
                    </div>

                    {headerScrollEnabled ? (
                      <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">Comportamiento en Scroll:</label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setHeaderScrollType('floating')}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                headerScrollType === 'floating'
                                  ? 'border-forest bg-forest/5 text-forest font-bold ring-2 ring-forest/20 shadow-xs'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="text-xs block">Cápsula Flotante Compacta</span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                Se reduce y flota suavemente con blur.
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setHeaderScrollType('sticky-full')}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                headerScrollType === 'sticky-full'
                                  ? 'border-forest bg-forest/5 text-forest font-bold ring-2 ring-forest/20 shadow-xs'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="text-xs block">Pegado a Todo lo Ancho</span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                Se fija al borde superior de la pantalla.
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Altura reducida en scroll:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{headerScrollHeight}px</span>
                          </div>
                          <input
                            type="range"
                            min={48}
                            max={72}
                            step={2}
                            value={headerScrollHeight}
                            onChange={(e) => setHeaderScrollHeight(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        {/* Redondeo de la Cápsula Flotante en Scroll */}
                        {headerScrollType === 'floating' && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                            <label className="text-[11px] font-bold text-slate-700 block">Redondeo de la Cápsula en Scroll:</label>
                            <div className="grid grid-cols-4 gap-2">
                              {(['none', 'md', '2xl', 'full'] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setHeaderScrollRadius(r as ButtonRadiusType)}
                                  className={`py-2 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl ${
                                    headerScrollRadius === r
                                      ? 'border-forest bg-forest text-white shadow-xs'
                                      : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                  }`}
                                >
                                  {r === 'none' ? 'Recto' : r === 'md' ? 'Medio' : r === '2xl' ? 'Curvo' : 'Píldora'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Opacidad del Fondo en Scroll */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Opacidad del Fondo en Scroll:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{headerScrollOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={100}
                            step={5}
                            value={headerScrollOpacity}
                            onChange={(e) => setHeaderScrollOpacity(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-forest block">Desenfoque de Fondo (Backdrop Blur)</span>
                            <span className="text-[10px] text-muted-foreground">Efecto de cristal al pasar sobre contenido</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={headerScrollBlur}
                            onChange={(e) => setHeaderScrollBlur(e.target.checked)}
                            className="w-4 h-4 accent-forest cursor-pointer"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-muted-foreground text-center">
                        La transformación en scroll está desactivada. El header mantendrá su diseño inicial fijado o estático.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* C. HEADER COMPACTO MÓVIL */}
              {/* ==================================================== */}
              {headerViewSubtab === 'mobile' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-forest text-sm">Comportamiento en Dispositivos Móviles</h4>
                        <span className="text-[11px] text-muted-foreground">Ajustes para pantallas pequeñas</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <label className="text-[11px] font-bold text-slate-700 block">Posición del Logo en Móvil:</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setHeaderMobileLogoPosition('left')}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            headerMobileLogoPosition === 'left'
                              ? 'border-forest bg-forest text-white font-bold shadow-xs'
                              : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          A la Izquierda
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderMobileLogoPosition('center')}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            headerMobileLogoPosition === 'center'
                              ? 'border-forest bg-forest text-white font-bold shadow-xs'
                              : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          Centrado
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-forest block">Botón CTA Visible en Móvil</span>
                        <span className="text-[10px] text-muted-foreground">Muestra el botón de acción en la barra móvil</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={headerMobileShowCta}
                        onChange={(e) => setHeaderMobileShowCta(e.target.checked)}
                        className="w-4 h-4 accent-forest cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: HERO BANNER WIZARD */}
          {activeTab === 'hero' && (
            <HeroAccordionContext.Provider
              value={{
                activeId: heroActiveAccordion,
                toggle: (id) => setHeroActiveAccordion((prev) => (prev === id ? '' : id))
              }}
            >
              <div className="space-y-6 animate-in fade-in duration-200 text-xs text-slate-900">
              
              {/* ========================================================= */}
              {/* PASO 1: CATÁLOGO DE ESTILOS DE HERO (CARDS A TODO LO ANCHO) */}
              {/* ========================================================= */}
              {heroWizardStep === 'catalog' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-forest shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-forest text-xs">Catálogo de Estilos de Portada (Hero)</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Elegí la plantilla visual para la cabecera de tu colegio. Al hacer clic en un estilo avanzarás al configurador específico de sus variables.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'organic-montessori-stickers',
                        title: 'Montessori Cálido & Stickers Lúdicos (Organic Blobs)',
                        badge: 'Montessori Warm & Lúdico',
                        desc: 'Diseño cálido y sensorial con fotografía en marco orgánico rotable, botón de WhatsApp con efecto de ondas expansivas (radar) y stickers lúdicos flotantes animados.',
                        tags: ['Foto Orgánica Rotable', 'WhatsApp Pulso', 'Stickers Flotantes', 'Bordes Configurables', 'Invertible'],
                        accentColor: 'bg-amber-100 text-amber-900 border-amber-300'
                      },
                      {
                        id: 'curved-contrast-bubble',
                        title: 'Contraste Dark & Círculos Dinámicos (Clase & Estudiante)',
                        badge: 'Editorial Dark & Silueta',
                        desc: 'Fondo oscuro con burbuja convexa blanca para textos, círculo escénico con foto de aula y silueta de estudiante con control total de traslación (X, Y) y escala.',
                        tags: ['Fondo Dark', 'Burbuja Convexa', 'Estudiante X/Y/Scale', 'Círculo X/Y/Scale', 'Speech Bubble CTA'],
                        accentColor: 'bg-slate-900 text-slate-100 border-slate-700'
                      },
                      {
                        id: 'geometric-rhombus',
                        title: 'Curvas Diagonales & Medallón Promocional (Back to School)',
                        badge: 'Promoción & Descuentos',
                        desc: 'Composición dinámica con marco diagonal para fotografía de estudiantes, medallón circular flotante de descuento/beca y botón rápido de llamada telefónica.',
                        tags: ['Marco Diagonal', 'Medallón Promocional', 'CTA Llamada Directa', 'Invertible'],
                        accentColor: 'bg-rose-50 text-rose-800 border-rose-200'
                      },
                      {
                        id: 'curved-cutout-student',
                        title: 'Curvas Geométricas & Estudiante (Banner Admisiones)',
                        badge: 'Moderno & Dinámico',
                        desc: 'Composición de alto impacto con silueta transparente de estudiante, círculo de contraste posterior, curva divisoria de color de marca y enlaces sociales.',
                        tags: ['Estudiante PNG', 'Círculo Dinámico', 'Borde Separador', 'Redes Sociales'],
                        accentColor: 'bg-teal-50 text-teal-800 border-teal-200'
                      },
                      {
                        id: 'image-overlay-waves',
                        title: 'Inmersivo con Ondas & Parallax',
                        badge: 'Clásico Montessori',
                        desc: 'Fotografía a pantalla completa con efecto spotlight interactivo, siluetas de ondas personalizables, patrones de textura SVG y garabatos lúdicos.',
                        tags: ['Foto Full-Bleed', 'Curvas SVG', 'Patrones de Textura', 'Spotlight'],
                        accentColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      },
                      {
                        id: 'split-2-col',
                        title: 'Split 2 Columnas (Editorial & Tarjeta Flotante)',
                        badge: 'Editorial & Trust',
                        desc: 'Composición moderna a dos columnas: textos, sellos de confianza e insignia a la izquierda, y tarjeta de imagen flotante con badge dinámico a la derecha.',
                        tags: ['2 Columnas', 'Sellos AMI', 'Tarjeta Flotante', 'Badge Admisiones'],
                        accentColor: 'bg-blue-50 text-blue-800 border-blue-200'
                      },
                      {
                        id: 'centered-capsule',
                        title: 'Cápsula Centrada (Minimalista Moderno)',
                        badge: 'Minimalista',
                        desc: 'Titulares y botones con alineación central de alto impacto y una cápsula panorámica elevada en la parte inferior.',
                        tags: ['Centrado', 'Cápsula Panorámica', 'Limpio & Elegante'],
                        accentColor: 'bg-amber-50 text-amber-800 border-amber-200'
                      },
                      {
                        id: 'gradient-organic',
                        title: 'Gradiente & Formas Orgánicas (Blobs Animados)',
                        badge: 'Abstracto & Color',
                        desc: 'Fondo fluido con gradiente de marca y esferas animadas interactivas. Ideal para un estilo moderno sin depender obligatoriamente de una foto.',
                        tags: ['Color de Marca', 'Blobs Flotantes', 'Foco Tipográfico'],
                        accentColor: 'bg-purple-50 text-purple-800 border-purple-200'
                      }
                    ].map((style) => {
                      const isActive = heroTemplate === style.id;
                      return (
                        <div
                          key={style.id}
                          id={`hero-card-${style.id}`}
                          onClick={() => {
                            setHeroTemplate(style.id as any);
                            setHeroActiveAccordion('layout');
                            setHeroWizardStep('config');
                          }}
                          className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                            isActive
                              ? 'bg-slate-900 text-white border-2 border-emerald-500 ring-4 ring-emerald-500/20 shadow-xl shadow-slate-950/30'
                              : 'bg-white text-slate-900 border-slate-200 hover:border-forest/50 hover:shadow-md'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                          )}

                          <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isActive
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                  : style.accentColor
                              }`}
                            >
                              {style.badge}
                            </span>
                            {isActive && (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Activo en tu web
                              </span>
                            )}
                          </div>

                          <h5
                            className={`font-bold text-sm mb-1.5 transition-colors relative z-10 ${
                              isActive
                                ? 'text-white'
                                : 'text-forest group-hover:text-emerald-800'
                            }`}
                          >
                            {style.title}
                          </h5>

                          <p
                            className={`text-xs leading-relaxed mb-3 relative z-10 ${
                              isActive ? 'text-slate-300' : 'text-slate-600'
                            }`}
                          >
                            {style.desc}
                          </p>

                          <div
                            className={`flex flex-wrap items-center justify-between gap-2 pt-3 border-t relative z-10 ${
                              isActive ? 'border-slate-800' : 'border-slate-100'
                            }`}
                          >
                            <div className="flex flex-wrap gap-1.5">
                              {style.tags.map((t, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                                    isActive
                                      ? 'bg-slate-800 text-emerald-300 border border-slate-700/80'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHeroTemplate(style.id as any);
                                setHeroActiveAccordion('layout');
                                setHeroWizardStep('config');
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                                  : 'bg-slate-100 text-slate-800 hover:bg-forest hover:text-white'
                              }`}
                            >
                              <span>Configurar estilo</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* PASO 2: CONFIGURACIÓN ESPECÍFICA DEL ESTILO SELECCIONADO */}
              {/* ========================================================= */}
              {heroWizardStep === 'config' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* BARRA SUPERIOR DEL WIZARD: VOLVER */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setHeroWizardStep('catalog');
                        setHeroActiveAccordion('layout');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Elegir otro estilo</span>
                    </button>

                    <span className="text-[11px] font-bold text-forest bg-forest/5 px-2.5 py-1 rounded-full border border-forest/15">
                      {heroTemplate === 'organic-montessori-stickers' && 'Montessori Cálido & Stickers'}
                      {heroTemplate === 'curved-contrast-bubble' && 'Contraste Dark & Burbuja'}
                      {heroTemplate === 'geometric-rhombus' && 'Diagonales & Promoción'}
                      {heroTemplate === 'curved-cutout-student' && 'Curvas & Estudiante'}
                      {heroTemplate === 'image-overlay-waves' && 'Inmersivo con Ondas'}
                      {heroTemplate === 'split-2-col' && 'Split 2 Columnas'}
                      {heroTemplate === 'centered-capsule' && 'Cápsula Centrada'}
                      {heroTemplate === 'gradient-organic' && 'Gradiente & Blobs'}
                    </span>
                  </div>

                  {/* ========================================================= */}
                  {/* PANEL EXCLUSIVO PARA: MONTESSORI CÁLIDO & STICKERS LÚDICOS */}
                  {/* ========================================================= */}
                  {heroTemplate === 'organic-montessori-stickers' ? (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      
                      {/* 0. Orientación de la Composición */}
                      <HeroAccordionItem
                        id="layout"
                        title="Disposición y Orientación"
                        subtitle={heroLayoutInverted ? 'Foto Izquierda • Texto Derecha' : 'Texto Izquierda • Foto Derecha'}
                        icon={MoveHorizontal}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setHeroLayoutInverted(false)}
                            className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                              !heroLayoutInverted
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span>Texto Izq • Foto Der</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHeroLayoutInverted(true)}
                            className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                              heroLayoutInverted
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span>Foto Izq • Texto Der</span>
                          </button>
                        </div>
                      </HeroAccordionItem>

                      {/* 1. Fotografía & Marco Orgánico */}
                      <HeroAccordionItem
                        id="frame"
                        title="Fotografía & Marco Orgánico"
                        subtitle="Forma geométrica, escala y rotación del marco"
                        icon={ImageIcon}
                      >
                        <ImageUploadDropzone
                          value={heroImageUrl}
                          onChange={(url) => setHeroImageUrl(url)}
                          label="Fotografía del Estudiante / Aula"
                          helperText="Se muestra recortada dentro del marco orgánico"
                          folder="hero"
                          maxSizeMB={15}
                        />

                        {/* Toggle de Morphing / Animación de Formas */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-bold text-slate-800 block">
                                Transición Animada entre Formas (Morphing)
                              </span>
                              <span className="text-[10px] text-muted-foreground block mt-0.5 leading-tight">
                                {heroBlobAnimateMorph
                                  ? 'Activado: Seleccioná múltiples formas para crear la secuencia de transición continua.'
                                  : 'Desactivado: El marco mantiene una sola forma fija.'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const next = !heroBlobAnimateMorph;
                                setHeroBlobAnimateMorph(next);
                                if (next && heroBlobMorphShapes.length < 2) {
                                  setHeroBlobMorphShapes(['blob-1', 'blob-2', 'leaf']);
                                }
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                heroBlobAnimateMorph ? 'bg-forest' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  heroBlobAnimateMorph ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Selector de Forma Orgánica / Geométrica (Custom Select) */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {heroBlobAnimateMorph
                              ? 'Formas en el Ciclo de Animación (Morphing):'
                              : 'Forma Geométrica del Marco:'}
                          </label>
                          <HeroFrameShapeCustomSelect
                            value={heroBlobRadiusType}
                            onChange={(sId) => setHeroBlobRadiusType(sId as any)}
                            isMorphMode={heroBlobAnimateMorph}
                            morphShapes={heroBlobMorphShapes}
                            onToggleMorphShape={(sId) => {
                              if (heroBlobMorphShapes.includes(sId)) {
                                if (heroBlobMorphShapes.length > 1) {
                                  setHeroBlobMorphShapes(heroBlobMorphShapes.filter((x) => x !== sId));
                                } else {
                                  toast.error('Debes mantener al menos una forma seleccionada.');
                                }
                              } else {
                                setHeroBlobMorphShapes([...heroBlobMorphShapes, sId]);
                              }
                            }}
                          />
                        </div>

                        {/* Slider de Escala */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Tamaño / Escala del Marco:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroBlobScale}%</span>
                          </div>
                          <input
                            type="range"
                            min={70}
                            max={140}
                            step={5}
                            value={heroBlobScale}
                            onChange={(e) => setHeroBlobScale(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        {/* Slider de Rotación */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Ángulo de Rotación:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroBlobRotate}°</span>
                          </div>
                          <input
                            type="range"
                            min={-30}
                            max={30}
                            step={1}
                            value={heroBlobRotate}
                            onChange={(e) => setHeroBlobRotate(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 2. Botón CTA & Radar WhatsApp */}
                      <HeroAccordionItem
                        id="whatsapp"
                        title="Botón de Acción & WhatsApp"
                        subtitle="Estilo de bordes y efecto radar concéntrico"
                        icon={MessageCircle}
                      >
                        {/* Selector de Redondeo */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">Estilo de Bordes del Botón:</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'pill', label: 'Píldora', sub: 'Redondeado Full' },
                              { id: 'rounded', label: 'Suave', sub: 'Curvas 2XL' },
                              { id: 'square', label: 'Recto', sub: 'Bordes Med' },
                            ].map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setHeroButtonRadius(r.id as any)}
                                className={`py-2 px-2 text-xs font-bold border rounded-xl transition-all cursor-pointer text-center ${
                                  heroButtonRadius === r.id
                                    ? 'border-forest bg-forest text-white shadow-xs'
                                    : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                }`}
                              >
                                <div>{r.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Toggle de Pulso WhatsApp */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-forest block">Efecto Radar de Onda en WhatsApp</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Emite anillos concéntricos expansivos llamativos alrededor del icono.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={heroShowWhatsappPulse}
                            onChange={(e) => setHeroShowWhatsappPulse(e.target.checked)}
                            className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 3. Textos y Botón Principal */}
                      {renderHeroTextConfigAccordion()}

                      {/* 4. Elementos Flotantes / Stickers */}
                      {renderFloatingStickersUniversalConfig()}

                      {/* 5. Patrón de Fondo & Textura */}
                      {renderPatternConfigAccordion()}

                    </div>
                  ) : heroTemplate === 'curved-contrast-bubble' ? (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      
                      {/* 0. Orientación de la Composición */}
                      <HeroAccordionItem
                        id="layout"
                        title="Disposición y Orientación"
                        subtitle={heroLayoutInverted ? 'Estudiante Izquierda • Texto Derecha' : 'Texto Izquierda • Estudiante Derecha'}
                        icon={MoveHorizontal}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setHeroLayoutInverted(false)}
                            className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                              !heroLayoutInverted
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span>Texto Izq • Estudiante Der</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHeroLayoutInverted(true)}
                            className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                              heroLayoutInverted
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span>Estudiante Izq • Texto Der</span>
                          </button>
                        </div>
                      </HeroAccordionItem>

                      {/* 1. Silueta del Estudiante */}
                      <HeroAccordionItem
                        id="student"
                        title="Silueta del Estudiante (PNG Transparente)"
                        subtitle="Escala y coordenadas de posición X / Y"
                        icon={ImageIcon}
                      >
                        <ImageUploadDropzone
                          value={heroStudentImageUrl}
                          onChange={(url) => setHeroStudentImageUrl(url)}
                          label="Fotografía con Fondo Transparente"
                          helperText="Recomendado: PNG recortado sin fondo"
                          folder="hero"
                          maxSizeMB={15}
                        />

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Tamaño / Escala del Estudiante:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroStudentScale}%</span>
                          </div>
                          <input
                            type="range"
                            min={70}
                            max={150}
                            step={5}
                            value={heroStudentScale}
                            onChange={(e) => setHeroStudentScale(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Mover Horizontal (Eje X):</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroStudentX}px</span>
                          </div>
                          <input
                            type="range"
                            min={-150}
                            max={150}
                            step={5}
                            value={heroStudentX}
                            onChange={(e) => setHeroStudentX(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Mover Vertical (Eje Y):</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroStudentY}px</span>
                          </div>
                          <input
                            type="range"
                            min={-100}
                            max={100}
                            step={5}
                            value={heroStudentY}
                            onChange={(e) => setHeroStudentY(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 2. Círculo Escénico de Fondo */}
                      <HeroAccordionItem
                        id="bubble"
                        title="Círculo Escénico de Fondo (Aula)"
                        subtitle="Foto de fondo, escala y posición X / Y"
                        icon={Shapes}
                      >
                        <ImageUploadDropzone
                          value={heroClassroomImageUrl}
                          onChange={(url) => setHeroClassroomImageUrl(url)}
                          label="Fotografía del Aula / Instalación"
                          helperText="Se muestra dentro del círculo con tinte del color de marca"
                          folder="hero"
                          maxSizeMB={15}
                        />

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Tamaño / Escala del Círculo:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroCircleScale}%</span>
                          </div>
                          <input
                            type="range"
                            min={70}
                            max={160}
                            step={5}
                            value={heroCircleScale}
                            onChange={(e) => setHeroCircleScale(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Mover Círculo Horizontal (Eje X):</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroCircleX}px</span>
                          </div>
                          <input
                            type="range"
                            min={-150}
                            max={150}
                            step={5}
                            value={heroCircleX}
                            onChange={(e) => setHeroCircleX(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Mover Círculo Vertical (Eje Y):</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroCircleY2}px</span>
                          </div>
                          <input
                            type="range"
                            min={-100}
                            max={100}
                            step={5}
                            value={heroCircleY2}
                            onChange={(e) => setHeroCircleY2(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 3. Barra de Redes Sociales */}
                      <HeroAccordionItem
                        id="social"
                        title="Barra de Redes Sociales"
                        subtitle="Iconos circulares con enlaces directos"
                        icon={Globe}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-forest block">Mostrar Redes Sociales</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Muestra los iconos circulares con enlaces oficiales al lado del botón.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={heroShowSocial}
                            onChange={(e) => setHeroShowSocial(e.target.checked)}
                            className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 4. Textos y Botón Speech Bubble */}
                      {renderHeroTextConfigAccordion({ showCtaSubtext: true })}

                      {/* Elementos Flotantes / Stickers */}
                      {renderFloatingStickersUniversalConfig()}

                      {/* Patrón de Fondo & Textura */}
                      {renderPatternConfigAccordion()}

                    </div>
                  ) : heroTemplate === 'curved-cutout-student' ? (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      
                      {/* 0. Orientación de la Composición */}
                      <HeroAccordionItem
                        id="layout"
                        title="Disposición y Orientación"
                        subtitle={heroLayoutInverted ? 'Imagen Izquierda • Texto Derecha' : 'Texto Izquierda • Imagen Derecha'}
                        icon={MoveHorizontal}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setHeroLayoutInverted(false)}
                            className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                              !heroLayoutInverted
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span>Texto Izq • Imagen Der</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHeroLayoutInverted(true)}
                            className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                              heroLayoutInverted
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span>Imagen Izq • Texto Der</span>
                          </button>
                        </div>
                      </HeroAccordionItem>

                      {/* 1. Imagen Transparente del Estudiante */}
                      <HeroAccordionItem
                        id="student"
                        title="Fotografía del Estudiante (PNG Transparente)"
                        subtitle="Cargar imagen sin fondo, ajustar tamaño y posición"
                        icon={ImageIcon}
                      >
                        <ImageUploadDropzone
                          value={heroStudentImageUrl}
                          onChange={(url) => setHeroStudentImageUrl(url)}
                          label="Fotografía con Fondo Transparente"
                          helperText="Recomendado: PNG recortado sin fondo del estudiante"
                          folder="hero"
                          maxSizeMB={15}
                        />

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Tamaño / Escala del Estudiante:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroStudentScale}%</span>
                          </div>
                          <input
                            type="range"
                            min={50}
                            max={160}
                            step={5}
                            value={heroStudentScale}
                            onChange={(e) => setHeroStudentScale(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Mover Horizontal (Eje X):</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroStudentX}px</span>
                          </div>
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            step={5}
                            value={heroStudentX}
                            onChange={(e) => setHeroStudentX(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Mover Vertical (Eje Y):</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroStudentY}px</span>
                          </div>
                          <input
                            type="range"
                            min={-150}
                            max={150}
                            step={5}
                            value={heroStudentY}
                            onChange={(e) => setHeroStudentY(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 2. Círculo Trasero de Contraste */}
                      <HeroAccordionItem
                        id="circle"
                        title="Círculo de Fondo (Acento de Color)"
                        subtitle="Posición vertical y diámetro del círculo"
                        icon={Shapes}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Posición Vertical (Subir / Bajar):</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroCircleY}px</span>
                          </div>
                          <input
                            type="range"
                            min={-80}
                            max={120}
                            step={5}
                            value={heroCircleY}
                            onChange={(e) => setHeroCircleY(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Tamaño del Círculo:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroCircleSize}px</span>
                          </div>
                          <input
                            type="range"
                            min={320}
                            max={700}
                            step={10}
                            value={heroCircleSize}
                            onChange={(e) => setHeroCircleSize(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 3. Curva Inferior y Separación */}
                      <HeroAccordionItem
                        id="waves"
                        title="Curva Inferior & Borde de Separación"
                        subtitle="Altura de ola, intensidad de curva y grosor"
                        icon={Waves}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Altura / Elevación de la Curva:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroWaveY}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={2}
                            value={heroWaveY}
                            onChange={(e) => setHeroWaveY(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-400 block">
                            (0% = franja mínima en el fondo, 100% = curva alta dramática)
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Intensidad de la Curva (Ondulación):</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroCurveIntensity}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={120}
                            step={5}
                            value={heroCurveIntensity}
                            onChange={(e) => setHeroCurveIntensity(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Grosor del Borde Separador Blanco:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroBorderWidth}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={24}
                            step={2}
                            value={heroBorderWidth}
                            onChange={(e) => setHeroBorderWidth(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 4. Barra de Redes Sociales */}
                      <HeroAccordionItem
                        id="social"
                        title="Redes Sociales en el Banner"
                        subtitle="Mostrar u ocultar enlaces oficiales"
                        icon={Globe}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-forest block">Mostrar Redes Sociales en el Banner</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Muestra los iconos circulares con enlaces a tus redes oficiales.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={heroShowSocial}
                            onChange={(e) => setHeroShowSocial(e.target.checked)}
                            className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                          />
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600">
                          💡 Los enlaces de redes se configuran de forma global para todo el sitio.
                        </div>
                      </HeroAccordionItem>

                      {/* 5. Textos y Botón Principal con Subtexto */}
                      {renderHeroTextConfigAccordion({ showCtaSubtext: true })}

                      {/* Elementos Flotantes / Stickers */}
                      {renderFloatingStickersUniversalConfig()}

                      {/* Patrón de Fondo & Textura */}
                      {renderPatternConfigAccordion()}

                    </div>
                  ) : heroTemplate === 'geometric-rhombus' ? (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      
                      {/* 0. Orientación de la Composición */}
                      <HeroAccordionItem
                        id="layout"
                        title="Disposición y Orientación"
                        subtitle={heroLayoutInverted ? 'Foto Izquierda • Texto Derecha' : 'Texto Izquierda • Foto Derecha'}
                        icon={MoveHorizontal}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setHeroLayoutInverted(false)}
                            className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                              !heroLayoutInverted
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span>Texto Izq • Foto Der</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHeroLayoutInverted(true)}
                            className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                              heroLayoutInverted
                                ? 'border-forest bg-forest text-white shadow-xs'
                                : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span>Foto Izq • Texto Der</span>
                          </button>
                        </div>
                      </HeroAccordionItem>

                      {/* 1. Fotografía, Rotación & Perspectiva 3D */}
                      <HeroAccordionItem
                        id="frame"
                        title="Fotografía, Rotación & Perspectiva 3D"
                        subtitle="Foto principal, ángulo de giro y profundidad 3D"
                        icon={ImageIcon}
                      >
                        <ImageUploadDropzone
                          value={heroImageUrl}
                          onChange={(url) => setHeroImageUrl(url)}
                          label="Fotografía del Estudiante / Colegio"
                          helperText="Formato recomendado: Cuadrado o Retrato de alta calidad"
                          folder="hero"
                          maxSizeMB={15}
                        />

                        <div className="space-y-3 pt-3 border-t border-slate-100 mt-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700">Rotación del Marco (Giro 2D):</label>
                              <span className="text-[11px] font-mono text-forest font-bold">{heroFrameRotateZ}°</span>
                            </div>
                            <input
                              type="range"
                              min={-45}
                              max={45}
                              step={1}
                              value={heroFrameRotateZ}
                              onChange={(e) => setHeroFrameRotateZ(Number(e.target.value))}
                              className="w-full accent-forest cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                              <span>-45° Izq</span>
                              <span className="cursor-pointer font-bold text-forest" onClick={() => setHeroFrameRotateZ(0)}>0° Plano</span>
                              <span>+45° Der</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Inclinación 3D (X):</label>
                                <span className="text-[10px] font-mono text-forest font-bold">{heroFrameRotateX}°</span>
                              </div>
                              <input
                                type="range"
                                min={-30}
                                max={30}
                                step={1}
                                value={heroFrameRotateX}
                                onChange={(e) => setHeroFrameRotateX(Number(e.target.value))}
                                className="w-full accent-forest cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Inclinación 3D (Y):</label>
                                <span className="text-[10px] font-mono text-forest font-bold">{heroFrameRotateY}°</span>
                              </div>
                              <input
                                type="range"
                                min={-30}
                                max={30}
                                step={1}
                                value={heroFrameRotateY}
                                onChange={(e) => setHeroFrameRotateY(Number(e.target.value))}
                                className="w-full accent-forest cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700">Profundidad de Perspectiva:</label>
                              <span className="text-[11px] font-mono text-forest font-bold">{heroFramePerspective}px</span>
                            </div>
                            <input
                              type="range"
                              min={400}
                              max={2000}
                              step={50}
                              value={heroFramePerspective}
                              onChange={(e) => setHeroFramePerspective(Number(e.target.value))}
                              className="w-full accent-forest cursor-pointer"
                            />
                          </div>
                        </div>
                      </HeroAccordionItem>

                      {/* 2. Bordes y Redondeo de las 4 Esquinas */}
                      <HeroAccordionItem
                        id="corners"
                        title="Bordes & Redondeo de las 4 Esquinas"
                        subtitle="Grosor de borde, color y radio por cada esquina"
                        icon={Shapes}
                      >
                        <div className="space-y-3.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Ancho del Borde:</label>
                                <span className="text-[11px] font-mono text-forest font-bold">{heroFrameBorderWidth}px</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={32}
                                step={1}
                                value={heroFrameBorderWidth}
                                onChange={(e) => setHeroFrameBorderWidth(Number(e.target.value))}
                                className="w-full accent-forest cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 block">Color del Borde:</label>
                              {renderPaletteColorSelect(heroFrameBorderColor, setHeroFrameBorderColor)}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-forest block">Redondeo de Esquinas</span>
                                <span className="text-[10px] text-muted-foreground block">
                                  {heroFrameRadiusSync ? 'Todas las esquinas iguales' : 'Control individual por cada una de las 4 esquinas'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSync = !heroFrameRadiusSync;
                                  setHeroFrameRadiusSync(nextSync);
                                  if (nextSync) {
                                    setHeroFrameRadiusTr(heroFrameRadiusTl);
                                    setHeroFrameRadiusBr(heroFrameRadiusTl);
                                    setHeroFrameRadiusBl(heroFrameRadiusTl);
                                  }
                                }}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  heroFrameRadiusSync
                                    ? 'border-forest bg-forest text-white'
                                    : 'border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200'
                                }`}
                              >
                                {heroFrameRadiusSync ? 'Sincronizadas' : 'Independientes'}
                              </button>
                            </div>

                            {heroFrameRadiusSync ? (
                              <div className="space-y-1.5 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                  <label className="text-[11px] font-bold text-slate-700">Radio de Todas las Esquinas:</label>
                                  <span className="text-[11px] font-mono text-forest font-bold">{heroFrameRadiusTl}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={120}
                                  step={2}
                                  value={heroFrameRadiusTl}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setHeroFrameRadiusTl(val);
                                    setHeroFrameRadiusTr(val);
                                    setHeroFrameRadiusBr(val);
                                    setHeroFrameRadiusBl(val);
                                  }}
                                  className="w-full accent-forest cursor-pointer"
                                />
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in duration-200">
                                <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-700">↖ Sup. Izquierda</label>
                                    <span className="text-[10px] font-mono text-forest font-bold">{heroFrameRadiusTl}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={120}
                                    step={2}
                                    value={heroFrameRadiusTl}
                                    onChange={(e) => setHeroFrameRadiusTl(Number(e.target.value))}
                                    className="w-full accent-forest cursor-pointer"
                                  />
                                </div>

                                <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-700">↗ Sup. Derecha</label>
                                    <span className="text-[10px] font-mono text-forest font-bold">{heroFrameRadiusTr}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={120}
                                    step={2}
                                    value={heroFrameRadiusTr}
                                    onChange={(e) => setHeroFrameRadiusTr(Number(e.target.value))}
                                    className="w-full accent-forest cursor-pointer"
                                  />
                                </div>

                                <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-700">↙ Inf. Izquierda</label>
                                    <span className="text-[10px] font-mono text-forest font-bold">{heroFrameRadiusBl}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={120}
                                    step={2}
                                    value={heroFrameRadiusBl}
                                    onChange={(e) => setHeroFrameRadiusBl(Number(e.target.value))}
                                    className="w-full accent-forest cursor-pointer"
                                  />
                                </div>

                                <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-700">↘ Inf. Derecha</label>
                                    <span className="text-[10px] font-mono text-forest font-bold">{heroFrameRadiusBr}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={120}
                                    step={2}
                                    value={heroFrameRadiusBr}
                                    onChange={(e) => setHeroFrameRadiusBr(Number(e.target.value))}
                                    className="w-full accent-forest cursor-pointer"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </HeroAccordionItem>

                      {/* 3. Efectos Hover Interactivos Combinables del Marco */}
                      <HeroAccordionItem
                        id="hover"
                        title="Efectos Hover Interactivos (Combinables)"
                        subtitle="Selecciona uno, varios o ningún efecto al pasar el mouse"
                        icon={Magnet}
                      >
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">Efectos Activos ({heroFrameHoverEffects.length}):</span>
                            <div className="flex items-center gap-2">
                              {heroFrameHoverEffects.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setHeroFrameHoverEffects([])}
                                  className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                  Desactivar todos
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setHeroFrameHoverEffects(['zoom', 'glow', 'shimmer'])}
                                className="text-[10px] font-bold text-forest hover:underline transition-colors cursor-pointer"
                              >
                                Recomendados
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { id: 'zoom', label: '🔍 Zoom Dinámico', desc: 'Aumenta el tamaño con fluidez' },
                              { id: 'magnet-attract', label: '🧲 Magneto Positivo', desc: 'Atrae e inclina hacia el mouse' },
                              { id: 'magnet-repel', label: '⚡ Magneto Invertido', desc: 'Repele y se aleja del mouse' },
                              { id: 'tilt-3d', label: '📐 Inclinación 3D Tilt', desc: 'Giroscopio y profundidad 3D' },
                              { id: 'float', label: '☁️ Levitación Flotante', desc: 'Se eleva hacia arriba suavemente' },
                              { id: 'glow', label: '✨ Resplandor Neón (Glow)', desc: 'Halo luminoso con color de paleta' },
                              { id: 'shimmer', label: '⚡ Ráfaga de Brillo (Shimmer)', desc: 'Destello diagonal de luz animado' }
                            ].map((opt) => {
                              const isChecked = heroFrameHoverEffects.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => toggleFrameHoverEffect(opt.id)}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                                    isChecked
                                      ? 'border-forest bg-forest/10 ring-1 ring-forest/60 text-slate-900 shadow-xs'
                                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // handled by button click
                                    className="mt-0.5 w-4 h-4 accent-forest cursor-pointer shrink-0 rounded"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                                    <span className="text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-center gap-1.5">
                            <span>💡</span>
                            <span>Puedes marcar múltiples efectos a la vez para combinarlos en tiempo real.</span>
                          </div>
                        </div>
                      </HeroAccordionItem>

                      {/* 4. Aros Decorativos y Anillos Flotantes (Hasta 4 aros) */}
                      <HeroAccordionItem
                        id="rings"
                        title="Aros Decorativos & Anillos Flotantes"
                        subtitle="Activa, posiciona y personaliza hasta 4 aros"
                        icon={CircleDot}
                      >
                        <div className="space-y-4">
                          
                          {/* ARO 0: Aro de Esquina Original */}
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-forest block">Aro 0: Aro de Esquina Principal</span>
                                <span className="text-[10px] text-muted-foreground block">
                                  Aro anclado sobre la esquina superior del marco
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={heroRing0Show}
                                onChange={(e) => setHeroRing0Show(e.target.checked)}
                                className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                              />
                            </div>

                            {heroRing0Show && (
                              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 animate-in fade-in duration-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Posición X</span>
                                      <span className="font-mono text-forest">{heroRing0X}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-100}
                                      max={100}
                                      value={heroRing0X}
                                      onChange={(e) => setHeroRing0X(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Posición Y</span>
                                      <span className="font-mono text-forest">{heroRing0Y}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-100}
                                      max={100}
                                      value={heroRing0Y}
                                      onChange={(e) => setHeroRing0Y(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Diámetro</span>
                                      <span className="font-mono text-forest">{heroRing0Size}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={40}
                                      max={200}
                                      value={heroRing0Size}
                                      onChange={(e) => setHeroRing0Size(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Grosor Borde</span>
                                      <span className="font-mono text-forest">{heroRing0BorderWidth}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={2}
                                      max={20}
                                      value={heroRing0BorderWidth}
                                      onChange={(e) => setHeroRing0BorderWidth(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-700 block">Color de Paleta:</label>
                                    {renderPaletteColorSelect(heroRing0Color, setHeroRing0Color)}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Opacidad / Transparencia</span>
                                      <span className="font-mono text-forest">{heroRing0Opacity}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={0}
                                      max={100}
                                      step={5}
                                      value={heroRing0Opacity}
                                      onChange={(e) => setHeroRing0Opacity(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ARO 1: Aro Decorativo Superior / Acento */}
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-forest block">Aro 1: Anillo Superior Flotante</span>
                                <span className="text-[10px] text-muted-foreground block">
                                  Anillo decorativo de contraste en el fondo
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={heroRing1Show}
                                onChange={(e) => setHeroRing1Show(e.target.checked)}
                                className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                              />
                            </div>

                            {heroRing1Show && (
                              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 animate-in fade-in duration-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Posición X</span>
                                      <span className="font-mono text-forest">{heroRing1X}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-150}
                                      max={150}
                                      value={heroRing1X}
                                      onChange={(e) => setHeroRing1X(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Posición Y</span>
                                      <span className="font-mono text-forest">{heroRing1Y}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-150}
                                      max={150}
                                      value={heroRing1Y}
                                      onChange={(e) => setHeroRing1Y(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Diámetro</span>
                                      <span className="font-mono text-forest">{heroRing1Size}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={40}
                                      max={260}
                                      value={heroRing1Size}
                                      onChange={(e) => setHeroRing1Size(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Grosor Borde</span>
                                      <span className="font-mono text-forest">{heroRing1BorderWidth}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={2}
                                      max={24}
                                      value={heroRing1BorderWidth}
                                      onChange={(e) => setHeroRing1BorderWidth(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 items-center">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-700 block">Color de Paleta:</label>
                                    {renderPaletteColorSelect(heroRing1Color, setHeroRing1Color)}
                                  </div>
                                  <div className="flex items-center gap-2 pt-4">
                                    <input
                                      type="checkbox"
                                      id="ring1Dashed"
                                      checked={heroRing1Dashed}
                                      onChange={(e) => setHeroRing1Dashed(e.target.checked)}
                                      className="w-3.5 h-3.5 accent-forest cursor-pointer"
                                    />
                                    <label htmlFor="ring1Dashed" className="text-[10px] font-bold text-slate-700 cursor-pointer">
                                      Borde Punteado
                                    </label>
                                  </div>
                                </div>

                                <div className="space-y-1 pt-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                    <span>Opacidad / Transparencia</span>
                                    <span className="font-mono text-forest">{heroRing1Opacity}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={heroRing1Opacity}
                                    onChange={(e) => setHeroRing1Opacity(Number(e.target.value))}
                                    className="w-full accent-forest cursor-pointer"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ARO 2: Aro Decorativo Inferior Opuesto */}
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-forest block">Aro 2: Anillo Inferior Dinámico</span>
                                <span className="text-[10px] text-muted-foreground block">
                                  Anillo decorativo para balance visual inferior
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={heroRing2Show}
                                onChange={(e) => setHeroRing2Show(e.target.checked)}
                                className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                              />
                            </div>

                            {heroRing2Show && (
                              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 animate-in fade-in duration-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Posición X</span>
                                      <span className="font-mono text-forest">{heroRing2X}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-150}
                                      max={150}
                                      value={heroRing2X}
                                      onChange={(e) => setHeroRing2X(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Posición Y</span>
                                      <span className="font-mono text-forest">{heroRing2Y}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-150}
                                      max={150}
                                      value={heroRing2Y}
                                      onChange={(e) => setHeroRing2Y(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Diámetro</span>
                                      <span className="font-mono text-forest">{heroRing2Size}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={40}
                                      max={240}
                                      value={heroRing2Size}
                                      onChange={(e) => setHeroRing2Size(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Grosor Borde</span>
                                      <span className="font-mono text-forest">{heroRing2BorderWidth}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={2}
                                      max={20}
                                      value={heroRing2BorderWidth}
                                      onChange={(e) => setHeroRing2BorderWidth(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 items-center">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-700 block">Color de Paleta:</label>
                                    {renderPaletteColorSelect(heroRing2Color, setHeroRing2Color)}
                                  </div>
                                  <div className="flex items-center gap-2 pt-4">
                                    <input
                                      type="checkbox"
                                      id="ring2Dashed"
                                      checked={heroRing2Dashed}
                                      onChange={(e) => setHeroRing2Dashed(e.target.checked)}
                                      className="w-3.5 h-3.5 accent-forest cursor-pointer"
                                    />
                                    <label htmlFor="ring2Dashed" className="text-[10px] font-bold text-slate-700 cursor-pointer">
                                      Borde Punteado
                                    </label>
                                  </div>
                                </div>

                                <div className="space-y-1 pt-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                    <span>Opacidad / Transparencia</span>
                                    <span className="font-mono text-forest">{heroRing2Opacity}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={heroRing2Opacity}
                                    onChange={(e) => setHeroRing2Opacity(Number(e.target.value))}
                                    className="w-full accent-forest cursor-pointer"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ARO 3: Aro Decorativo Exterior */}
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-forest block">Aro 3: Anillo Flotante Exterior</span>
                                <span className="text-[10px] text-muted-foreground block">
                                  Anillo libre para crear profundidad multidimensional
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={heroRing3Show}
                                onChange={(e) => setHeroRing3Show(e.target.checked)}
                                className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                              />
                            </div>

                            {heroRing3Show && (
                              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 animate-in fade-in duration-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Posición X</span>
                                      <span className="font-mono text-forest">{heroRing3X}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-150}
                                      max={150}
                                      value={heroRing3X}
                                      onChange={(e) => setHeroRing3X(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Posición Y</span>
                                      <span className="font-mono text-forest">{heroRing3Y}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-150}
                                      max={150}
                                      value={heroRing3Y}
                                      onChange={(e) => setHeroRing3Y(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Diámetro</span>
                                      <span className="font-mono text-forest">{heroRing3Size}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={40}
                                      max={240}
                                      value={heroRing3Size}
                                      onChange={(e) => setHeroRing3Size(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                      <span>Grosor Borde</span>
                                      <span className="font-mono text-forest">{heroRing3BorderWidth}px</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={2}
                                      max={20}
                                      value={heroRing3BorderWidth}
                                      onChange={(e) => setHeroRing3BorderWidth(Number(e.target.value))}
                                      className="w-full accent-forest cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 items-center">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-700 block">Color de Paleta:</label>
                                    {renderPaletteColorSelect(heroRing3Color, setHeroRing3Color)}
                                  </div>
                                  <div className="flex items-center gap-2 pt-4">
                                    <input
                                      type="checkbox"
                                      id="ring3Dashed"
                                      checked={heroRing3Dashed}
                                      onChange={(e) => setHeroRing3Dashed(e.target.checked)}
                                      className="w-3.5 h-3.5 accent-forest cursor-pointer"
                                    />
                                    <label htmlFor="ring3Dashed" className="text-[10px] font-bold text-slate-700 cursor-pointer">
                                      Borde Punteado
                                    </label>
                                  </div>
                                </div>

                                <div className="space-y-1 pt-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                    <span>Opacidad / Transparencia</span>
                                    <span className="font-mono text-forest">{heroRing3Opacity}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={heroRing3Opacity}
                                    onChange={(e) => setHeroRing3Opacity(Number(e.target.value))}
                                    className="w-full accent-forest cursor-pointer"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </HeroAccordionItem>

                      {/* 5. Medallón Promocional Flotante */}
                      <HeroAccordionItem
                        id="promo"
                        title="Medallón Promocional Flotante"
                        subtitle="Insignia circular con porcentaje o texto de descuento"
                        icon={Sparkles}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-forest block">Medallón Promocional Flotante</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Muestra una insignia circular flotante con porcentaje o texto de descuento.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={heroPromoShow}
                            onChange={(e) => setHeroPromoShow(e.target.checked)}
                            className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                          />
                        </div>

                        {heroPromoShow && (
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 block">Texto Destacado</label>
                              <input
                                type="text"
                                value={heroPromoTitle}
                                onChange={(e) => setHeroPromoTitle(e.target.value)}
                                placeholder="Ej. 30% / AMI / 2026"
                                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest placeholder:text-slate-400 font-bold uppercase"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 block">Subtexto Inferior</label>
                              <input
                                type="text"
                                value={heroPromoSubtitle}
                                onChange={(e) => setHeroPromoSubtitle(e.target.value)}
                                placeholder="Ej. DESCUENTO / BECA"
                                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest placeholder:text-slate-400 font-bold uppercase"
                              />
                            </div>
                          </div>
                        )}
                      </HeroAccordionItem>

                      {/* 6. Acceso Directo de Contacto Telefónico */}
                      <HeroAccordionItem
                        id="phone"
                        title="Contacto Telefónico Directo"
                        subtitle="Acceso directo de llamada junto al botón CTA"
                        icon={Phone}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-forest block">Botón de Contacto Telefónico</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Muestra un acceso directo de llamada al lado del botón CTA principal.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={heroShowPhoneCta}
                            onChange={(e) => setHeroShowPhoneCta(e.target.checked)}
                            className="w-4 h-4 accent-forest cursor-pointer shrink-0"
                          />
                        </div>

                        {heroShowPhoneCta && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 block">Etiqueta</label>
                              <input
                                type="text"
                                value={heroPhoneLabel}
                                onChange={(e) => setHeroPhoneLabel(e.target.value)}
                                placeholder="Ej. Informes al:"
                                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest placeholder:text-slate-400 font-medium"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 block">Número de Teléfono</label>
                              <input
                                type="text"
                                value={heroPhoneNumber}
                                onChange={(e) => setHeroPhoneNumber(e.target.value)}
                                placeholder="Ej. 55 1234 5678"
                                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest placeholder:text-slate-400 font-medium"
                              />
                            </div>
                          </div>
                        )}
                      </HeroAccordionItem>

                      {/* 7. Textos y Botón Principal con Subtexto */}
                      {renderHeroTextConfigAccordion({ showCtaSubtext: true, showSecondaryCta: true })}

                      {/* 8. Elementos Flotantes / Stickers */}
                      {renderFloatingStickersUniversalConfig()}

                      {/* 9. Patrón de Fondo & Textura */}
                      {renderPatternConfigAccordion()}

                    </div>
                  ) : heroTemplate === 'split-2-col' ? (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      
                      {/* 0. DISPOSICIÓN Y ALINEACIÓN DE COLUMNA */}
                      <HeroAccordionItem
                        id="layout"
                        title="Disposición & Alineación Vertical"
                        subtitle={heroLayoutInverted ? 'Foto Izquierda • Texto Derecha' : 'Texto Izquierda • Foto Derecha'}
                        icon={MoveHorizontal}
                      >
                        <div className="space-y-4">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Orden de Columnas</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setHeroLayoutInverted(false)}
                                className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                                  !heroLayoutInverted
                                    ? 'border-forest bg-forest text-white shadow-xs'
                                    : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                }`}
                              >
                                <span>Texto Izq • Foto Der</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setHeroLayoutInverted(true)}
                                className={`py-2 px-3 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                                  heroLayoutInverted
                                    ? 'border-forest bg-forest text-white shadow-xs'
                                    : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                }`}
                              >
                                <span>Foto Izq • Texto Der</span>
                              </button>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Posición Vertical del Marco</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'top', label: 'Arriba' },
                                { id: 'center', label: 'Centrado' },
                                { id: 'bottom', label: 'Abajo' }
                              ].map((pos) => (
                                <button
                                  key={pos.id}
                                  type="button"
                                  onClick={() => setHeroSplitImageAlign(pos.id as any)}
                                  className={`py-2 px-2 text-xs font-bold border transition-all text-center cursor-pointer rounded-xl ${
                                    heroSplitImageAlign === pos.id
                                      ? 'border-forest bg-forest text-white shadow-xs'
                                      : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                  }`}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </HeroAccordionItem>

                      {/* 1. ESTILO DE MARCO Y FOTOGRAFÍA */}
                      <HeroAccordionItem
                        id="frame"
                        title="Tipo de Marco & Fotografía"
                        subtitle={
                          heroSplitFrameStyle === 'none' ? '✨ Sin Marco (Transparente)' :
                          heroSplitFrameStyle === 'polaroid-tape' ? '📸 Polaroid Vintage' :
                          heroSplitFrameStyle === 'arch-window' ? '🏛️ Arco Editorial' :
                          heroSplitFrameStyle === 'iphone-mockup' ? '📱 iPhone Mockup' :
                          heroSplitFrameStyle === 'studio-canvas' ? '🖼️ Canvas de Galería' :
                          heroSplitFrameStyle === 'organic-curve' ? '✨ Curvas Orgánicas' :
                          '🪟 Card Vidrio (Glass)'
                        }
                        icon={Smartphone}
                        badge="7 Opciones"
                      >
                        <div className="space-y-4">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-2">Seleccioná el Tipo de Marco:</label>
                            <div className="grid grid-cols-2 gap-2.5">
                              {[
                                {
                                  id: 'none',
                                  label: 'Sin Marco (PNG)',
                                  icon: ImageIcon,
                                  desc: 'Limpia transparente con sombra 3D'
                                },
                                {
                                  id: 'polaroid-tape',
                                  label: 'Polaroid Vintage',
                                  icon: ImageIcon,
                                  desc: 'Foto clásica con cinta y pie de foto'
                                },
                                {
                                  id: 'arch-window',
                                  label: 'Arco Editorial',
                                  icon: Shapes,
                                  desc: 'Arco nórdico elegante superior'
                                },
                                {
                                  id: 'iphone-mockup',
                                  label: 'iPhone Mockup',
                                  icon: Smartphone,
                                  desc: 'Smartphone con Dynamic Island y bisel'
                                },
                                {
                                  id: 'glass-card',
                                  label: 'Card Vidrio',
                                  icon: Layout,
                                  desc: 'Borde suave traslúcido y sombras'
                                },
                                {
                                  id: 'studio-canvas',
                                  label: 'Canvas Galería',
                                  icon: Shapes,
                                  desc: 'Cuadro de arte con marco biselado'
                                },
                                {
                                  id: 'organic-curve',
                                  label: 'Curvas Orgánicas',
                                  icon: Sparkles,
                                  desc: 'Esquinas redondeadas asimétricas'
                                }
                              ].map((f) => {
                                const isSelected = heroSplitFrameStyle === f.id;
                                return (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setHeroSplitFrameStyle(f.id as any)}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                      isSelected
                                        ? 'border-forest bg-forest/5 ring-2 ring-forest/20 shadow-xs'
                                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <f.icon className={`w-4 h-4 ${isSelected ? 'text-forest' : 'text-slate-500'}`} />
                                      {isSelected && <span className="w-2 h-2 rounded-full bg-forest" />}
                                    </div>
                                    <div>
                                      <span className={`text-xs font-bold block ${isSelected ? 'text-forest' : 'text-slate-800'}`}>
                                        {f.label}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">
                                        {f.desc}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <ImageUploadDropzone
                              value={heroImageUrl}
                              onChange={(url) => setHeroImageUrl(url)}
                              label="Fotografía del Marco"
                              helperText="Formato recomendado: Vertical u horizontal de alta calidad"
                              folder="hero"
                              maxSizeMB={15}
                            />
                          </div>
                        </div>
                      </HeroAccordionItem>

                      {/* 2. PERSPECTIVA & ROTACIÓN 3D */}
                      <HeroAccordionItem
                        id="perspective"
                        title="Perspectiva & Rotación 3D"
                        subtitle={`${
                          heroSplitPerspective === 'none' ? 'Plano (2D)' :
                          heroSplitPerspective === 'isometric-left' ? 'Isométrica Izq' :
                          heroSplitPerspective === 'isometric-right' ? 'Isométrica Der' :
                          '3D Profundo'
                        } • Rotación ${heroSplitRotateZ > 0 ? `+${heroSplitRotateZ}` : heroSplitRotateZ}°`}
                        icon={Layers}
                      >
                        <div className="space-y-4">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-2">Preset de Perspectiva 3D:</label>
                            <div className="grid grid-cols-2 gap-2.5">
                              {[
                                { id: 'none', label: 'Plano (2D)', desc: 'Sin giro / Vista frontal' },
                                { id: 'isometric-left', label: 'Isométrica Izq', desc: 'Inclinación 3D natural a la izquierda' },
                                { id: 'isometric-right', label: 'Isométrica Der', desc: 'Inclinación 3D a la derecha' },
                                { id: 'tilted-deep', label: '3D Profundo', desc: 'Perspectiva dramática volumétrica' }
                              ].map((p) => {
                                const isSelected = heroSplitPerspective === p.id;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setHeroSplitPerspective(p.id as any)}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                                      isSelected
                                        ? 'border-forest bg-forest/5 ring-2 ring-forest/20 shadow-xs'
                                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className={`text-xs font-bold ${isSelected ? 'text-forest' : 'text-slate-800'}`}>
                                        {p.label}
                                      </span>
                                      {isSelected && <span className="w-2 h-2 rounded-full bg-forest" />}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                      {p.desc}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* ROTATION SLIDER (Z-AXIS) */}
                          <div className="pt-3 border-t border-slate-100 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                <span>Rotación Angular (Inclinación)</span>
                              </label>
                              <div className="flex items-center gap-2">
                                {heroSplitRotateZ !== 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setHeroSplitRotateZ(0)}
                                    className="text-[10px] font-semibold text-forest hover:underline cursor-pointer"
                                  >
                                    Restablecer (0°)
                                  </button>
                                )}
                                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-forest/10 text-forest border border-forest/20">
                                  {heroSplitRotateZ > 0 ? `+${heroSplitRotateZ}` : heroSplitRotateZ}°
                                </span>
                              </div>
                            </div>

                            <input
                              type="range"
                              min="-30"
                              max="30"
                              step="1"
                              value={heroSplitRotateZ}
                              onChange={(e) => setHeroSplitRotateZ(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-forest"
                            />

                            {/* Quick angle presets */}
                            <div className="flex items-center justify-between gap-1 pt-1">
                              {[-15, -6, 0, 6, 15].map((deg) => (
                                <button
                                  key={deg}
                                  type="button"
                                  onClick={() => setHeroSplitRotateZ(deg)}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    heroSplitRotateZ === deg
                                      ? 'bg-forest text-white border-forest shadow-xs'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {deg > 0 ? `+${deg}°` : `${deg}°`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </HeroAccordionItem>

                      {/* 3. EFECTOS AL PASAR EL MOUSE (HOVER) */}
                      <HeroAccordionItem
                        id="hover"
                        title="Efecto al Pasar el Mouse (Hover)"
                        subtitle={
                          heroSplitHoverEffect === 'zoom' ? '🔍 Zoom Suave' :
                          heroSplitHoverEffect === 'perspective-shift' ? '🔄 Enderezar Perspectiva 3D' :
                          heroSplitHoverEffect === 'float-glow' ? '✨ Flotar & Resplandor' :
                          '⚡ Barrido de Brillo (Shimmer)'
                        }
                        icon={Sparkles}
                        badge="4 Efectos"
                      >
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { id: 'zoom', label: 'Zoom Suave', desc: 'Aumenta suavemente la escala fotográfica' },
                            { id: 'perspective-shift', label: 'Enderezar 3D', desc: 'Alinea la perspectiva a vista frontal plana' },
                            { id: 'float-glow', label: 'Flotar & Glow', desc: 'Se eleva verticalmente con resplandor' },
                            { id: 'shimmer-reveal', label: 'Barrido Brillo', desc: 'Destello luminoso reflectante sutil' }
                          ].map((h) => {
                            const isSelected = heroSplitHoverEffect === h.id;
                            return (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() => setHeroSplitHoverEffect(h.id as any)}
                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                                  isSelected
                                    ? 'border-forest bg-forest/5 ring-2 ring-forest/20 shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-bold ${isSelected ? 'text-forest' : 'text-slate-800'}`}>
                                    {h.label}
                                  </span>
                                  {isSelected && <span className="w-2 h-2 rounded-full bg-forest" />}
                                </div>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                  {h.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </HeroAccordionItem>

                      {/* 4. BANNER / MEDALLÓN FLOTANTE */}
                      <HeroAccordionItem
                        id="badge"
                        title="Banner Flotante de Admisiones"
                        subtitle={heroSplitShowBadge ? 'Visible sobre la fotografía' : 'Oculto'}
                        icon={Calendar}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Mostrar Banner Flotante</span>
                              <span className="text-[10px] text-muted-foreground block">Tarjeta con fecha/aviso sobre la fotografía</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={heroSplitShowBadge}
                              onChange={(e) => setHeroSplitShowBadge(e.target.checked)}
                              className="w-4 h-4 accent-forest cursor-pointer"
                            />
                          </div>

                          {heroSplitShowBadge && (
                            <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                              <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Posición en el Marco</label>
                                <div className="space-y-1.5">
                                  {/* Top positions */}
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                      { id: 'top-left', label: 'Arriba Izq' },
                                      { id: 'top-center', label: 'Arriba Centro' },
                                      { id: 'top-right', label: 'Arriba Der' }
                                    ].map((b) => (
                                      <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => setHeroSplitBadgePosition(b.id as any)}
                                        className={`py-2 px-1 text-[11px] font-bold border transition-all text-center cursor-pointer rounded-xl ${
                                          heroSplitBadgePosition === b.id
                                            ? 'border-forest bg-forest text-white shadow-xs'
                                            : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                        }`}
                                      >
                                        {b.label}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Middle center */}
                                  <div className="grid grid-cols-1">
                                    <button
                                      type="button"
                                      onClick={() => setHeroSplitBadgePosition('center')}
                                      className={`py-2 px-2 text-[11px] font-bold border transition-all text-center cursor-pointer rounded-xl ${
                                        heroSplitBadgePosition === 'center'
                                          ? 'border-forest bg-forest text-white shadow-xs'
                                          : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                      }`}
                                    >
                                      Centro / Al Medio
                                    </button>
                                  </div>

                                  {/* Bottom positions */}
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                      { id: 'bottom-left', label: 'Abajo Izq' },
                                      { id: 'bottom-center', label: 'Abajo Centro' },
                                      { id: 'bottom-right', label: 'Abajo Der' }
                                    ].map((b) => (
                                      <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => setHeroSplitBadgePosition(b.id as any)}
                                        className={`py-2 px-1 text-[11px] font-bold border transition-all text-center cursor-pointer rounded-xl ${
                                          heroSplitBadgePosition === b.id
                                            ? 'border-forest bg-forest text-white shadow-xs'
                                            : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                                        }`}
                                      >
                                        {b.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-700 block">Título del Banner</label>
                                <input
                                  type="text"
                                  value={heroSplitBadgeTitle}
                                  onChange={(e) => setHeroSplitBadgeTitle(e.target.value)}
                                  placeholder="Ej. Admisiones Abiertas"
                                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest font-medium"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-700 block">Subtítulo / Ciclo</label>
                                <input
                                  type="text"
                                  value={heroSplitBadgeSubtitle}
                                  onChange={(e) => setHeroSplitBadgeSubtitle(e.target.value)}
                                  placeholder="Ej. Ciclo Escolar 2026 - Cupos Limitados"
                                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest font-medium"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </HeroAccordionItem>

                      {/* 5. TEXTOS Y BOTONES CTAS */}
                      {renderHeroTextConfigAccordion({ showSecondaryCta: true })}

                      {/* 6. ELEMENTOS FLOTANTES / STICKERS */}
                      {renderFloatingStickersUniversalConfig()}

                      {/* 7. PATRÓN DE FONDO & TEXTURA */}
                      {renderPatternConfigAccordion()}

                    </div>
                  ) : (
                    <div className="space-y-3.5 animate-in fade-in duration-200">

                      {/* 1. DISPOSICIÓN Y ALINEACIÓN DE TEXTOS */}
                      <HeroAccordionItem
                        id="layout"
                        title="Disposición de Textos"
                        subtitle="Alineación horizontal de los contenidos (Izq, Centro, Der)"
                        icon={AlignLeft}
                      >
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'left', label: 'Izquierda', icon: AlignLeft },
                            { id: 'center', label: 'Centro', icon: AlignCenter },
                            { id: 'right', label: 'Derecha', icon: AlignRight }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setHeroAlign(item.id as any)}
                              className={`py-2 px-3 text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-xl ${
                                heroAlign === item.id
                                  ? 'border-forest bg-forest text-white shadow-xs'
                                  : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                              }`}
                            >
                              <item.icon className="w-3.5 h-3.5" />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </HeroAccordionItem>

                      {/* 2. CURVAS Y DIVISOR INFERIOR */}
                      <HeroAccordionItem
                        id="curves"
                        title="Curvas y Divisor Inferior"
                        subtitle="Ondas suaves, dobles, diagonales, arco o sin curva"
                        icon={Waves}
                      >
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'waves-1', label: 'Onda Suave' },
                            { id: 'waves-2', label: 'Doble Onda' },
                            { id: 'curve-arch', label: 'Arco Cóncavo' },
                            { id: 'slant', label: 'Diagonal' },
                            { id: 'triangle', label: 'Punta' },
                            { id: 'none', label: 'Sin Curva' }
                          ].map((shape) => (
                            <button
                              key={shape.id}
                              type="button"
                              onClick={() => setHeroBottomShape(shape.id as any)}
                              className={`py-2 px-2 text-[11px] font-bold border transition-all text-center cursor-pointer rounded-xl ${
                                heroBottomShape === shape.id
                                  ? 'border-forest bg-forest text-white shadow-xs'
                                  : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                              }`}
                            >
                              {shape.label}
                            </button>
                          ))}
                        </div>

                        {heroBottomShape !== 'none' && (
                          <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Altura de la Curva:</label>
                                <span className="text-[11px] font-mono text-forest font-bold">{heroShapeHeight}px</span>
                              </div>
                              <input
                                type="range"
                                min={40}
                                max={160}
                                step={5}
                                value={heroShapeHeight}
                                onChange={(e) => setHeroShapeHeight(Number(e.target.value))}
                                className="w-full accent-forest cursor-pointer"
                              />
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700">Invertir silueta horizontalmente</span>
                              <input
                                type="checkbox"
                                checked={heroShapeInverted}
                                onChange={(e) => setHeroShapeInverted(e.target.checked)}
                                className="w-4 h-4 accent-forest cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </HeroAccordionItem>

                      {/* 3. PATRÓN DE FONDO & TEXTURA */}
                      {renderPatternConfigAccordion()}

                      {/* 4. FOTOGRAFÍA DE FONDO & OPACIDAD */}
                      <HeroAccordionItem
                        id="photo"
                        title="Fotografía de Fondo & Capa de Color"
                        subtitle="Subida de foto panorámica y opacidad"
                        icon={ImageIcon}
                      >
                        <ImageUploadDropzone
                          value={heroImageUrl}
                          onChange={(url) => setHeroImageUrl(url)}
                          label="Imagen Hero Banner"
                          helperText="Formato horizontal panorámico (1920x1080px)"
                          folder="hero"
                          maxSizeMB={15}
                        />

                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">Opacidad de Capa de Color:</label>
                            <span className="text-[11px] font-mono text-forest font-bold">{heroOverlayOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={90}
                            step={5}
                            value={heroOverlayOpacity}
                            onChange={(e) => setHeroOverlayOpacity(Number(e.target.value))}
                            className="w-full accent-forest cursor-pointer"
                          />
                        </div>
                      </HeroAccordionItem>

                      {/* 5. CONTENIDO & LLAMADAS A LA ACCIÓN (CTAs) */}
                      {renderHeroTextConfigAccordion({ showSecondaryCta: true })}

                      {/* 6. Elementos Flotantes / Stickers */}
                      {renderFloatingStickersUniversalConfig()}

                    </div>
                  )}

                </div>
              )}

              </div>
            </HeroAccordionContext.Provider>
          )}

          {/* TAB: SECTIONS MANAGER */}
          {activeTab === 'sections' && (
            <SectionsManagerTab
              sections={pageSections}
              onChangeSections={setPageSections}
              onNavigateToTab={(tab) => handleOpenConfigTab(tab as any)}
              onSelectSectionForEdit={(secId) => handleOpenConfigTab(`section:${secId}`)}
            />
          )}

          {/* TAB: DEDICATED INDIVIDUAL SECTION EDITOR */}
          {activeTab.startsWith('section:') && (() => {
            const secId = activeTab.replace('section:', '');
            const targetSection = pageSections.find(s => s.id === secId);
            if (!targetSection) {
              return (
                <div className="p-6 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">La sección seleccionada ya no existe o fue eliminada.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenConfigTab('sections')}
                    className="px-3 py-1.5 rounded-xl bg-forest text-white font-bold text-xs cursor-pointer"
                  >
                    Volver a Secciones
                  </button>
                </div>
              );
            }

            return (
              <SectionDedicatedEditor
                section={targetSection}
                enabledLangsStr={headerEnabledLangs}
                editorLang={builderEditorLang}
                themeMode={themeMode}
                onSelectEditorLang={setBuilderEditorLang}
                onUpdateSection={(updates) => {
                  setPageSections(prev => prev.map(s => s.id === targetSection.id ? { ...s, ...updates } : s));
                }}
                onDuplicateSection={() => {
                  const targetIdx = pageSections.findIndex(s => s.id === targetSection.id);
                  if (targetIdx === -1) return;
                  const clone: WebSectionItem = {
                    ...targetSection,
                    id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    name: `${targetSection.name} (Copia)`
                  };
                  const newSections = [...pageSections];
                  newSections.splice(targetIdx + 1, 0, clone);
                  setPageSections(newSections);
                  handleOpenConfigTab(`section:${clone.id}`);
                }}
                onDeleteSection={() => {
                  if (pageSections.length <= 1) return;
                  setPageSections(prev => prev.filter(s => s.id !== targetSection.id));
                  handleOpenConfigTab('sections');
                }}
              />
            );
          })()}

          {/* TAB 4: NAVIGATION */}
          {activeTab === 'navigation' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-slate-900">
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-forest block">Sección Documentos Públicos</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Permite a las familias descargar reglamentos y circulares.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDocs}
                    onChange={(e) => setShowDocs(e.target.checked)}
                    className="w-5 h-5 accent-forest rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-forest block">Sección Aplicativos y Enlaces</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Muestra accesos directos a plataformas externas.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showApps}
                    onChange={(e) => setShowApps(e.target.checked)}
                    className="w-5 h-5 accent-forest rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CTA & CONTACT */}
          {activeTab === 'cta' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-slate-900">
              <div className="space-y-3">
                <label className="font-bold text-slate-700 block">Modo de Atención Principal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCta('whatsapp')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      cta === 'whatsapp'
                        ? 'border-forest bg-forest/10 text-forest shadow-xs font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageCircle className="w-3.5 h-3.5 text-forest" />
                      <span className="text-xs">WhatsApp Directo</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal block leading-tight">
                      Abre chat con número configurado.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCta('widget')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      cta === 'widget'
                        ? 'border-forest bg-forest/10 text-forest shadow-xs font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Layout className="w-3.5 h-3.5 text-forest" />
                      <span className="text-xs">Widget Modal</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal block leading-tight">
                      Abre ventana con formulario.
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 block">Teléfono / WhatsApp de Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 1 999 123 4567"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

        </div>
      </SlideOverDrawer>
    );
  })()}

    </div>
  );
};

export default WebBuilderSection;
