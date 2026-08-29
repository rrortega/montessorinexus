import React, { useState, useRef, useEffect } from 'react';
import {
  WebSectionItem,
  SECTION_TEMPLATES,
  SectionTemplate
} from './SectionsManagerTab';
import {
  Layers,
  Eye,
  EyeOff,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Type,
  Palette,
  Layout,
  HelpCircle,
  Clock,
  Quote,
  MapPin,
  MessageCircle,
  Award,
  BookOpen,
  Globe,
  Languages,
  PanelTop,
  Sun,
  Moon,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Copy,
  Grid,
  Box,
  Check,
  MousePointerClick,
  RotateCw,
  Laptop,
  Tablet,
  Smartphone,
  Heart,
  Star,
  Smile,
  Flower2,
  Sprout,
  GraduationCap,
  Baby,
  Cloud,
  Compass
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { ALL_SUPPORTED_LANGUAGES, getLanguageByCode } from './languages';
import {
  DEFAULT_PILLAR_CARDS,
  PillarCardItem,
  PILLAR_ICONS_MAP
} from '@/components/PhilosophySection';

export const SECTION_FONTS = [
  { id: 'inherit', name: 'Predeterminada del Tema', category: 'Sistema', family: 'inherit' },
  { id: 'playfair', name: 'Playfair Display', category: 'Serif / Editorial', family: "'Playfair Display', serif" },
  { id: 'cormorant', name: 'Cormorant Garamond', category: 'Serif / Clásica', family: "'Cormorant Garamond', serif" },
  { id: 'cinzel', name: 'Cinzel', category: 'Serif / Monumental', family: "'Cinzel', serif" },
  { id: 'merriweather', name: 'Merriweather', category: 'Serif / Literaria', family: "'Merriweather', serif" },
  { id: 'fraunces', name: 'Fraunces', category: 'Serif / Vintage Moderno', family: "'Fraunces', serif" },
  { id: 'outfit', name: 'Outfit', category: 'Moderna / Geométrica', family: "'Outfit', sans-serif" },
  { id: 'jakarta', name: 'Plus Jakarta Sans', category: 'Vanguardista / Tech', family: "'Plus Jakarta Sans', sans-serif" },
  { id: 'lexend', name: 'Lexend', category: 'Educativa / Legible', family: "'Lexend', sans-serif" },
  { id: 'poppins', name: 'Poppins', category: 'Publicitaria / Geométrica', family: "'Poppins', sans-serif" },
  { id: 'montserrat', name: 'Montserrat', category: 'Corporativa / Elegante', family: "'Montserrat', sans-serif" },
  { id: 'inter', name: 'Inter', category: 'Neutra / UI Moderna', family: "'Inter', sans-serif" },
  { id: 'raleway', name: 'Raleway', category: 'Estilizada / Delgada', family: "'Raleway', sans-serif" },
  { id: 'nunito', name: 'Nunito', category: 'Cálida / Humanista', family: "'Nunito', sans-serif" },
  { id: 'quicksand', name: 'Quicksand', category: 'Amigable / Redonda', family: "'Quicksand', sans-serif" },
  { id: 'comfortaa', name: 'Comfortaa', category: 'Suave / Redonda', family: "'Comfortaa', cursive" },
  { id: 'fredoka', name: 'Fredoka', category: 'Lúdica / Infantil', family: "'Fredoka', cursive" },
  { id: 'caveat', name: 'Caveat', category: 'Manuscrita / Espontánea', family: "'Caveat', cursive" },
  { id: 'dancing', name: 'Dancing Script', category: 'Caligráfica / Elegante', family: "'Dancing Script', cursive" }
];

export const getSectionFontFamily = (fontId?: string): string | undefined => {
  if (!fontId || fontId === 'inherit') return undefined;
  const found = SECTION_FONTS.find(f => f.id === fontId);
  return found ? found.family : undefined;
};

export const CARD_ICON_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'edu', label: '🎓 Libros & Idiomas' },
  { id: 'people', label: '👨‍👩‍👧 Niños & Ejecutivos' },
  { id: 'nature_city', label: '🌿 Parque & Ciudad' },
  { id: 'travel', label: '✈️ Viajes & Vuelos' },
  { id: 'values', label: '✨ Arte & Valores' }
] as const;

export const CARD_ICONS_BY_CAT: Record<string, string[]> = {
  edu: ['GraduationCap', 'Languages', 'Type', 'SpellCheck', 'Book', 'BookOpen', 'BookMarked', 'Bookmark', 'Library', 'Notebook', 'FileText', 'School', 'Pencil', 'PenTool', 'Atom', 'Microscope', 'Calculator', 'Binary'],
  people: ['Baby', 'Users', 'Users2', 'UserCheck', 'UserPlus', 'UserRound', 'PersonStanding', 'HeartHandshake', 'Briefcase', 'BadgeCheck', 'TrendingUp', 'Target', 'ShieldCheck', 'Heart', 'HandHeart'],
  nature_city: ['TreeDeciduous', 'Trees', 'TreePine', 'Palmtree', 'Tent', 'Sprout', 'Leaf', 'Flower2', 'Sun', 'SunMedium', 'Sunrise', 'CloudSun', 'Wind', 'Mountain', 'Building', 'Building2', 'Landmark', 'Castle'],
  travel: ['Plane', 'PlaneTakeoff', 'PlaneLanding', 'Rocket', 'Luggage', 'Globe', 'Compass', 'Map', 'MapPin', 'Navigation', 'Ship', 'Car', 'Bus', 'Rainbow', 'Footprints'],
  values: ['Sparkles', 'Star', 'Award', 'Trophy', 'Shield', 'Lightbulb', 'Palette', 'Music', 'Smile', 'Puzzle', 'Shapes', 'Clock', 'Anchor', 'Feather', 'Eye', 'Layers']
};

export const CustomFontPicker: React.FC<{
  value?: string;
  onChange: (fontId: string) => void;
  className?: string;
}> = ({ value = 'inherit', onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedFont = SECTION_FONTS.find(f => f.id === value) || SECTION_FONTS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs transition-all shadow-3xs cursor-pointer focus:ring-2 focus:ring-forest/20 focus:border-forest"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            style={{ fontFamily: selectedFont.family }}
            className="w-6 h-6 rounded-md bg-forest/10 text-forest flex items-center justify-center font-bold text-xs shrink-0"
          >
            Aa
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span
              style={{ fontFamily: selectedFont.family }}
              className="font-bold text-slate-900 text-xs truncate"
            >
              {selectedFont.name}
            </span>
            <span className="text-[9px] text-muted-foreground truncate">
              {selectedFont.category}
            </span>
          </div>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-forest' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl max-h-72 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Tipografías & Estilos en Vivo
          </div>
          {SECTION_FONTS.map(f => {
            const isSelected = (value || 'inherit') === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onChange(f.id);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-forest/10 text-forest font-bold ring-1 ring-forest/25 shadow-3xs'
                    : 'hover:bg-slate-100/90 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    style={{ fontFamily: f.family }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border ${
                      isSelected
                        ? 'bg-forest text-white border-forest shadow-3xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    Ag
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{ fontFamily: f.family }}
                        className="text-xs font-bold text-slate-900 truncate"
                      >
                        {f.name}
                      </span>
                    </div>
                    <div
                      style={{ fontFamily: f.family }}
                      className="text-[11px] text-slate-600 truncate mt-0.5"
                    >
                      Aa Bb Gg 123 • Tipografía en vivo
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                    {f.category.split('/')[0].trim()}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-forest shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CARD_SHAPES = [
  { id: 'rounded', name: 'Redondeado Moderno (3XL)', desc: 'Esquinas suaves de 24px', previewClass: 'rounded-md' },
  { id: 'arch', name: 'Arco Nórdico', desc: 'Cúpula superior curva y base recta', previewClass: 'rounded-t-lg rounded-b-2xs' },
  { id: 'leaf', name: 'Hoja Botánica', desc: 'Esquinas orgánicas alternadas', previewClass: 'rounded-tl-lg rounded-br-lg rounded-tr-2xs rounded-bl-2xs' },
  { id: 'blob', name: 'Orgánico / Asimétrico', desc: 'Curvaturas asimétricas fluidas', previewClass: 'rounded-[10px_3px_10px_3px]' },
  { id: 'squircle', name: 'Squircle Profundo', desc: 'Curvatura continua de 36px', previewClass: 'rounded-lg' },
  { id: 'pill', name: 'Píldora / Cápsula', desc: 'Curvatura envolvente continua', previewClass: 'rounded-xl' },
  { id: 'minimal', name: 'Minimalista Recto', desc: 'Bordes limpios sin redondeo', previewClass: 'rounded-none border' }
];

export const CARD_HOVER_EFFECTS = [
  { id: 'lift', name: 'Elevación 3D (Lift)', desc: 'Flota hacia arriba con sombra suave', icon: '🚀' },
  { id: 'scale', name: 'Zoom Expansivo (105%)', desc: 'Aumenta suavemente de escala', icon: '🔍' },
  { id: 'tilt', name: 'Inclinación Lúdica (Tilt)', desc: 'Giro dinámico 2.5° con elevación', icon: '🎯' },
  { id: 'glow', name: 'Resplandor Luminoso (Glow)', desc: 'Aura perimetral en color del tema', icon: '✨' },
  { id: 'border', name: 'Marco Dinámico', desc: 'Borde de realce perimetral activo', icon: '🖼️' },
  { id: 'none', name: 'Estático (Sin Efecto)', desc: 'Sin transformaciones interactivas', icon: '⏸️' }
];

export const CustomShapePicker: React.FC<{
  value?: string;
  onChange: (shape: string) => void;
  className?: string;
}> = ({ value = 'rounded', onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = CARD_SHAPES.find(s => s.id === value) || CARD_SHAPES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs transition-all shadow-3xs cursor-pointer focus:ring-2 focus:ring-forest/20 focus:border-forest"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-5 h-5 bg-forest/20 border border-forest/40 ${selected.previewClass} shrink-0`} />
          <div className="flex flex-col text-left min-w-0">
            <span className="font-bold text-slate-900 text-xs truncate">{selected.name}</span>
            <span className="text-[9px] text-muted-foreground truncate">{selected.desc}</span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-forest' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Forma Geométrica de la Tarjeta
          </div>
          {CARD_SHAPES.map((shape) => {
            const isSelected = shape.id === selected.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => {
                  onChange(shape.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected ? 'bg-forest/10 border border-forest/30' : 'hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 bg-forest/20 border-2 border-forest/40 ${shape.previewClass} shrink-0`} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-bold ${isSelected ? 'text-forest' : 'text-slate-800'}`}>
                      {shape.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground truncate">{shape.desc}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-forest shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CustomHoverPicker: React.FC<{
  value?: string;
  onChange: (hoverEffect: string) => void;
  className?: string;
}> = ({ value = 'lift', onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = CARD_HOVER_EFFECTS.find(h => h.id === value) || CARD_HOVER_EFFECTS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs transition-all shadow-3xs cursor-pointer focus:ring-2 focus:ring-forest/20 focus:border-forest"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{selected.icon}</span>
          <div className="flex flex-col text-left min-w-0">
            <span className="font-bold text-slate-900 text-xs truncate">{selected.name}</span>
            <span className="text-[9px] text-muted-foreground truncate">{selected.desc}</span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-forest' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Efecto al Pasar el Mouse (Hover)
          </div>
          {CARD_HOVER_EFFECTS.map((effect) => {
            const isSelected = effect.id === selected.id;
            return (
              <button
                key={effect.id}
                type="button"
                onClick={() => {
                  onChange(effect.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected ? 'bg-forest/10 border border-forest/30' : 'hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg shrink-0">{effect.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-bold ${isSelected ? 'text-forest' : 'text-slate-800'}`}>
                      {effect.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground truncate">{effect.desc}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-forest shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const SectionThemeContext = React.createContext<'light' | 'dark'>('light');

interface FieldTypographyAndColorBarProps {
  fontValue?: string;
  onChangeFont: (fontId: string) => void;
  colorLight?: string;
  onChangeColorLight: (hex: string) => void;
  colorDark?: string;
  onChangeColorDark: (hex: string) => void;
  defaultColorLight?: string;
  defaultColorDark?: string;
  themeMode?: 'light' | 'dark';
}

const FieldTypographyAndColorBar: React.FC<FieldTypographyAndColorBarProps> = ({
  fontValue = 'inherit',
  onChangeFont,
  colorLight,
  onChangeColorLight,
  colorDark,
  onChangeColorDark,
  defaultColorLight = '#1b3b2b',
  defaultColorDark = '#ffffff',
  themeMode: themeModeProp
}) => {
  const contextTheme = React.useContext(SectionThemeContext);
  const themeMode = themeModeProp || contextTheme || 'light';
  const isDark = themeMode === 'dark';

  const currentColor = isDark ? (colorDark || '') : (colorLight || '');
  const currentDefault = isDark ? defaultColorDark : defaultColorLight;
  const activeColorHex = currentColor || currentDefault;
  const onColorChange = isDark ? onChangeColorDark : onChangeColorLight;

  return (
    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-3xs space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
        {/* Custom Font Family Picker with Live Preview */}
        <div className="flex items-center gap-1.5 min-w-[220px] flex-1">
          <Type className="w-3.5 h-3.5 text-forest shrink-0" />
          <span className="text-[10px] font-bold text-slate-600 shrink-0">Fuente:</span>
          <CustomFontPicker
            value={fontValue}
            onChange={onChangeFont}
            className="flex-1"
          />
        </div>

        {/* Dynamic Single Color Control for Active Theme Mode */}
        <div className="flex items-center shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-3xs transition-colors ${
            isDark
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-white text-slate-800 border-slate-200'
          }`}>
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Color para Modo Oscuro (Activo)" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Color para Modo Claro (Activo)" />
            )}
            <div className="relative flex items-center">
              <input
                type="color"
                value={activeColorHex.startsWith('#') && activeColorHex.length === 7 ? activeColorHex : (isDark ? '#ffffff' : '#1b3b2b')}
                onChange={(e) => onColorChange(e.target.value)}
                className={`w-5 h-5 rounded-md border cursor-pointer p-0 appearance-none bg-transparent ${
                  isDark ? 'border-slate-600' : 'border-slate-300'
                }`}
                title={`Elegir color para ${isDark ? 'Modo Oscuro' : 'Modo Claro'}`}
              />
            </div>
            <input
              type="text"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              placeholder={currentDefault}
              className={`w-16 text-[10px] font-mono uppercase bg-transparent border-0 focus:outline-none ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SectionAccordionContext = React.createContext<{
  activeId: string | null;
  toggle: (id: string) => void;
}>({ activeId: 'headings', toggle: () => {} });

export const SectionAccordionItem: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  badge?: string;
  children: React.ReactNode;
}> = ({ id, title, subtitle, icon: Icon, badge, children }) => {
  const { activeId, toggle } = React.useContext(SectionAccordionContext);
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
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-forest/10 text-forest">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-forest' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

const STICKER_PRESET_ICONS = [
  { id: 'Sparkles', label: 'Destellos', icon: Sparkles },
  { id: 'Heart', label: 'Corazón', icon: Heart },
  { id: 'Star', label: 'Estrella', icon: Star },
  { id: 'Compass', label: 'Brújula', icon: Compass },
  { id: 'Sun', label: 'Sol', icon: Sun },
  { id: 'Moon', label: 'Luna', icon: Moon },
  { id: 'Cloud', label: 'Nube', icon: Cloud },
  { id: 'Flower2', label: 'Flor', icon: Flower2 },
  { id: 'Sprout', label: 'Brote', icon: Sprout },
  { id: 'BookOpen', label: 'Libro', icon: BookOpen },
  { id: 'GraduationCap', label: 'Graduación', icon: GraduationCap },
  { id: 'Baby', label: 'Niño / Bebé', icon: Baby },
  { id: 'Smile', label: 'Sonrisa', icon: Smile }
];

const STICKER_ANIMATION_EFFECTS = [
  { id: 'float', name: 'Flotación Suave', icon: '🍃' },
  { id: 'pulse', name: 'Pulso', icon: '💓' },
  { id: 'spin', name: 'Giro 360° Continuo', icon: '🔄' },
  { id: 'tilt', name: 'Balanceo Lúdico', icon: '🎯' },
  { id: 'glow', name: 'Resplandor Luminoso', icon: '✨' }
];

export const SectionFloatingStickersEditor: React.FC<{
  config?: Record<string, any>;
  onChangeConfig: (key: string, value: any) => void;
}> = ({ config = {}, onChangeConfig }) => {
  const [selectedSticker, setSelectedSticker] = useState<number>(1);
  const [deviceTab, setDeviceTab] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const num = selectedSticker;
  const isShow = config[`sticker_${num}_show`] === 'true' || config[`sticker_${num}_show`] === true;
  const currentImageUrl = config[`sticker_${num}_image_url`] || '';
  const currentIcon = config[`sticker_${num}_icon`] || (currentImageUrl ? '' : (num === 1 ? 'Sparkles' : num === 2 ? 'Star' : 'Heart'));

  // parse effects
  let effects: string[] = ['float'];
  const rawEffects = config[`sticker_${num}_effects`];
  if (typeof rawEffects === 'string') {
    try {
      effects = JSON.parse(rawEffects);
    } catch {
      effects = rawEffects.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(rawEffects)) {
    effects = rawEffects;
  }

  const toggleEffect = (effId: string) => {
    const next = effects.includes(effId)
      ? effects.filter(e => e !== effId)
      : [...effects, effId];
    onChangeConfig(`sticker_${num}_effects`, next);
  };

  // Device values
  const deviceShowKey = `sticker_${num}_${deviceTab}_show`;
  const deviceShow = config[deviceShowKey] !== 'false';

  const defaultX = num === 1 ? 8 : num === 2 ? 92 : 88;
  const defaultY = num === 1 ? 15 : num === 2 ? 20 : 80;
  const defaultSize = deviceTab === 'desktop' ? 72 : deviceTab === 'tablet' ? 60 : 48;
  const defaultRotate = num === 1 ? -8 : num === 2 ? 10 : -4;

  const currentX = config[`sticker_${num}_${deviceTab}_x`] !== undefined && !isNaN(Number(config[`sticker_${num}_${deviceTab}_x`]))
    ? Number(config[`sticker_${num}_${deviceTab}_x`])
    : (deviceTab === 'desktop' ? defaultX : (Number(config[`sticker_${num}_desktop_x`]) || defaultX));

  const currentY = config[`sticker_${num}_${deviceTab}_y`] !== undefined && !isNaN(Number(config[`sticker_${num}_${deviceTab}_y`]))
    ? Number(config[`sticker_${num}_${deviceTab}_y`])
    : (deviceTab === 'desktop' ? defaultY : (Number(config[`sticker_${num}_desktop_y`]) || defaultY));

  const currentSize = config[`sticker_${num}_${deviceTab}_size`] !== undefined && !isNaN(Number(config[`sticker_${num}_${deviceTab}_size`]))
    ? Number(config[`sticker_${num}_${deviceTab}_size`])
    : defaultSize;

  const currentRotate = config[`sticker_${num}_${deviceTab}_rotate`] !== undefined && !isNaN(Number(config[`sticker_${num}_${deviceTab}_rotate`]))
    ? Number(config[`sticker_${num}_${deviceTab}_rotate`])
    : (deviceTab === 'desktop' ? defaultRotate : (Number(config[`sticker_${num}_desktop_rotate`]) || defaultRotate));

  return (
    <div className="space-y-4">
      {/* Sticker Selector Tabs */}
      <div className="flex items-center justify-between gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
        {[1, 2, 3].map((sNum) => {
          const isStickerActive = config[`sticker_${sNum}_show`] === 'true' || config[`sticker_${sNum}_show`] === true;
          return (
            <button
              key={sNum}
              type="button"
              onClick={() => setSelectedSticker(sNum)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedSticker === sNum
                  ? 'bg-white text-forest shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adorno {sNum}</span>
              {isStickerActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Enable Switch */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          <span className="text-xs font-bold text-slate-800 block">Habilitar Adorno {num}</span>
          <span className="text-[10px] text-muted-foreground">Muestra este sticker o ilustración flotante en la sección</span>
        </div>
        <Switch
          checked={isShow}
          onCheckedChange={(val) => onChangeConfig(`sticker_${num}_show`, val)}
        />
      </div>

      {isShow && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Icon or Image Picker */}
          <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
            <label className="text-[10px] font-bold text-slate-700 block">
              Icono o Ilustración del Adorno:
            </label>

            {/* Presets */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {STICKER_PRESET_ICONS.map((p) => {
                const Icon = p.icon;
                const isSelected = !currentImageUrl && currentIcon === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChangeConfig(`sticker_${num}_icon`, p.id);
                      onChangeConfig(`sticker_${num}_image_url`, '');
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-forest/10 border-forest text-forest shadow-3xs scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={p.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Upload Custom Image */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-muted-foreground block mb-1">O Subir Ilustración PNG / SVG Personalizada:</span>
              <ImageUploadDropzone
                currentImageUrl={currentImageUrl}
                onImageUploaded={(url) => {
                  onChangeConfig(`sticker_${num}_image_url`, url);
                  onChangeConfig(`sticker_${num}_icon`, '');
                }}
                onRemove={() => onChangeConfig(`sticker_${num}_image_url`, '')}
                label="Subir sticker transparente"
                helperText="PNG con fondo transparente recomendado"
                folder="stickers"
                maxSizeMB={3}
              />
            </div>
          </div>

          {/* Animation Effects */}
          <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200 shadow-3xs">
            <label className="text-[10px] font-bold text-slate-700 block">
              Efectos de Animación Flotante:
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STICKER_ANIMATION_EFFECTS.map((eff) => {
                const active = effects.includes(eff.id);
                return (
                  <button
                    key={eff.id}
                    type="button"
                    onClick={() => toggleEffect(eff.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      active
                        ? 'bg-forest text-white shadow-3xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{eff.icon}</span>
                    <span>{eff.name}</span>
                    {active && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsive Position & Size Controls */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-700">
                Posición & Escala por Dispositivo:
              </label>

              {/* Device Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeviceTab('desktop')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    deviceTab === 'desktop' ? 'bg-white text-forest shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3 h-3" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('tablet')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    deviceTab === 'tablet' ? 'bg-white text-forest shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tablet className="w-3 h-3" />
                  <span>Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('mobile')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    deviceTab === 'mobile' ? 'bg-white text-forest shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Visibility toggle for current device */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
              <span className="font-semibold text-slate-700">Mostrar en {deviceTab.toUpperCase()}:</span>
              <Switch
                checked={deviceShow}
                onCheckedChange={(val) => onChangeConfig(deviceShowKey, val ? 'true' : 'false')}
              />
            </div>

            {deviceShow && (
              <div className="space-y-3 pt-2">
                {/* Horizontal Position X */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-700">Posición Horizontal (X):</span>
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {currentX}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={currentX}
                    onChange={(e) => onChangeConfig(`sticker_${num}_${deviceTab}_x`, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-forest focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>0% (Izq)</span>
                    <span>50% (Centro)</span>
                    <span>100% (Der)</span>
                  </div>
                </div>

                {/* Vertical Position Y */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-700">Posición Vertical (Y):</span>
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {currentY}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={currentY}
                    onChange={(e) => onChangeConfig(`sticker_${num}_${deviceTab}_y`, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-forest focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>0% (Arriba)</span>
                    <span>50% (Medio)</span>
                    <span>100% (Abajo)</span>
                  </div>
                </div>

                {/* Size Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-700">Tamaño del Adorno:</span>
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {currentSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="220"
                    step="2"
                    value={currentSize}
                    onChange={(e) => onChangeConfig(`sticker_${num}_${deviceTab}_size`, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-forest focus:outline-none"
                  />
                </div>

                {/* Rotation Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-700">Rotación del Adorno (°):</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {currentRotate > 0 ? `+${currentRotate}°` : `${currentRotate}°`}
                      </span>
                      {currentRotate !== 0 && (
                        <button
                          type="button"
                          onClick={() => onChangeConfig(`sticker_${num}_${deviceTab}_rotate`, 0)}
                          className="text-[9px] text-slate-400 hover:text-rose-500 font-bold px-1 rounded cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={currentRotate}
                    onChange={(e) => onChangeConfig(`sticker_${num}_${deviceTab}_rotate`, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-forest focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SectionDedicatedEditorProps {
  section: WebSectionItem;
  enabledLangsStr?: string;
  editorLang?: string;
  themeMode?: 'light' | 'dark';
  onSelectEditorLang?: (lang: string) => void;
  onUpdateSection: (updates: Partial<WebSectionItem>) => void;
  onDuplicateSection?: () => void;
  onDeleteSection?: () => void;
}

export const SectionDedicatedEditor: React.FC<SectionDedicatedEditorProps> = ({
  section,
  enabledLangsStr = 'es,en',
  editorLang: editorLangProp,
  themeMode = 'light',
  onSelectEditorLang,
  onUpdateSection,
  onDuplicateSection,
  onDeleteSection
}) => {
  const activeCodes = enabledLangsStr
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const [internalEditorLang, setInternalEditorLang] = useState<string>(activeCodes[0] || 'es');
  const editorLang = editorLangProp || internalEditorLang;
  const setEditorLang = onSelectEditorLang || setInternalEditorLang;
  const currentLangObj = getLanguageByCode(editorLang);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [cardIconCategory, setCardIconCategory] = useState<string>('all');

  const template = SECTION_TEMPLATES.find(t => t.type === section.type);
  const IconComp = template?.icon || Layers;

  // Generic helper to update nested configuration object
  const handleConfigChange = (key: string, value: any) => {
    const currentConfig = section.config || {};
    onUpdateSection({
      config: {
        ...currentConfig,
        [key]: value
      }
    });
  };

  // Pillars Mosaic Cards Handlers
  const currentCards: PillarCardItem[] = Array.isArray(section.config?.cards) && section.config.cards.length > 0
    ? section.config.cards
    : DEFAULT_PILLAR_CARDS;

  const handleUpdateCards = (updatedCards: PillarCardItem[]) => {
    handleConfigChange('cards', updatedCards);
  };

  const handleAddCard = () => {
    const newCard: PillarCardItem = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      icon: 'Sparkles',
      title: 'Nueva Tarjeta',
      subtitle: 'Descripción o detalle informativo del contenido de esta tarjeta.',
      bgColor: '#f4f8f5',
      bgColorDark: '#14251c',
      shape: 'rounded',
      hoverEffect: 'lift'
    };
    handleUpdateCards([...currentCards, newCard]);
    setExpandedCardId(newCard.id);
  };

  const handleUpdateSingleCard = (id: string, updates: Partial<PillarCardItem>) => {
    const updated = currentCards.map(c => c.id === id ? { ...c, ...updates } : c);
    handleUpdateCards(updated);
  };

  const handleDeleteCard = (id: string) => {
    if (currentCards.length <= 1) return;
    const updated = currentCards.filter(c => c.id !== id);
    handleUpdateCards(updated);
    if (expandedCardId === id) setExpandedCardId(null);
  };

  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentCards.length) return;
    const clone = [...currentCards];
    const item = clone.splice(index, 1)[0];
    clone.splice(targetIdx, 0, item);
    handleUpdateCards(clone);
  };

  const getLangValue = (field: 'name' | 'badge' | 'title' | 'subtitle' | 'ctaText' | 'menuLabel'): string => {
    if (editorLang === 'es') return (section[field] as string) || '';
    const key = `${field}_${editorLang}` as keyof WebSectionItem;
    return (section[key] as string) || '';
  };

  const setLangValue = (field: 'name' | 'badge' | 'title' | 'subtitle' | 'ctaText' | 'menuLabel', value: string) => {
    if (editorLang === 'es') {
      onUpdateSection({ [field]: value });
    } else {
      onUpdateSection({ [`${field}_${editorLang}`]: value } as any);
    }
  };

  const getConfigLangValue = (key: string, defVal: string = ''): string => {
const fullKey = editorLang === 'es' ? key : `${key}_${editorLang}`;
    return section.config?.[fullKey] ?? defVal;
  };

  const setConfigLangValue = (key: string, val: any) => {
    const fullKey = editorLang === 'es' ? key : `${key}_${editorLang}`;
    handleConfigChange(fullKey, val);
  };

  const [activeAccordionId, setActiveAccordionId] = useState<string | null>('headings');
  const toggleAccordion = (id: string) => {
    setActiveAccordionId(prev => prev === id ? null : id);
  };

  return (
    <SectionThemeContext.Provider value={themeMode}>
      <SectionAccordionContext.Provider value={{ activeId: activeAccordionId, toggle: toggleAccordion }}>
        <div className="space-y-3.5 text-xs text-slate-800 animate-in fade-in duration-200">
          
          {/* 1. GENERAL HEADINGS & TEXTS */}
          <SectionAccordionItem
            id="headings"
            title={`Titulares & Textos (${currentLangObj.name})`}
            subtitle="Identificador, badge, título, subtítulo, tipografías y alineación"
            icon={Type}
            badge={`${currentLangObj.flag} ${currentLangObj.code.toUpperCase()}`}
          >
          {/* 1.1 Nombre de la Sección */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">
              Nombre Identificador de la Sección ({currentLangObj.code.toUpperCase()}):
            </label>
            <input
              type="text"
              value={getLangValue('name')}
              onChange={(e) => setLangValue('name', e.target.value)}
              placeholder={`Nombre en ${currentLangObj.name}`}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          {/* 1.2 Etiqueta Superior (Badge / Eyebrow) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Etiqueta Superior (Badge / Eyebrow {currentLangObj.code.toUpperCase()}):
              </label>
              <input
                type="text"
                value={getLangValue('badge')}
                onChange={(e) => setLangValue('badge', e.target.value)}
                placeholder={`Ej: Eyebrow en ${currentLangObj.name}`}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <FieldTypographyAndColorBar
              fontValue={section.config?.badge_font}
              onChangeFont={(val) => handleConfigChange('badge_font', val)}
              colorLight={section.config?.badge_color}
              onChangeColorLight={(val) => handleConfigChange('badge_color', val)}
              colorDark={section.config?.badge_color_dark}
              onChangeColorDark={(val) => handleConfigChange('badge_color_dark', val)}
              defaultColorLight="#1b3b2b"
              defaultColorDark="#a7f3d0"
            />
          </div>

          {/* 1.3 Título Principal */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Título Principal de la Sección ({currentLangObj.code.toUpperCase()}):
              </label>
              <input
                type="text"
                value={getLangValue('title')}
                onChange={(e) => setLangValue('title', e.target.value)}
                placeholder={`Título principal en ${currentLangObj.name}`}
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <FieldTypographyAndColorBar
              fontValue={section.config?.title_font}
              onChangeFont={(val) => handleConfigChange('title_font', val)}
              colorLight={section.config?.title_color}
              onChangeColorLight={(val) => handleConfigChange('title_color', val)}
              colorDark={section.config?.title_color_dark}
              onChangeColorDark={(val) => handleConfigChange('title_color_dark', val)}
              defaultColorLight="#1b3b2b"
              defaultColorDark="#ffffff"
            />
          </div>

          {/* 1.4 Subtítulo / Bajada Descriptiva */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Subtítulo / Bajada Descriptiva ({currentLangObj.code.toUpperCase()}):
              </label>
              <textarea
                value={getLangValue('subtitle')}
                onChange={(e) => setLangValue('subtitle', e.target.value)}
                rows={2}
                placeholder={`Descripción introductoria o propósito en ${currentLangObj.name}...`}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <FieldTypographyAndColorBar
              fontValue={section.config?.subtitle_font}
              onChangeFont={(val) => handleConfigChange('subtitle_font', val)}
              colorLight={section.config?.subtitle_color}
              onChangeColorLight={(val) => handleConfigChange('subtitle_color', val)}
              colorDark={section.config?.subtitle_color_dark}
              onChangeColorDark={(val) => handleConfigChange('subtitle_color_dark', val)}
              defaultColorLight="#475569"
              defaultColorDark="#cbd5e1"
            />
          </div>

          {/* Alignment */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <label className="text-[11px] font-bold text-slate-700">Alineación del Encabezado:</label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { val: 'left', icon: AlignLeft, label: 'Izquierda' },
                { val: 'center', icon: AlignCenter, label: 'Centrado' },
                { val: 'right', icon: AlignRight, label: 'Derecha' }
              ].map(al => {
                const AlIcon = al.icon;
                const isSelected = (section.layoutVariant || 'left') === al.val;
                return (
                  <button
                    key={al.val}
                    type="button"
                    onClick={() => onUpdateSection({ layoutVariant: al.val })}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-forest shadow-3xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={al.label}
                  >
                    <AlIcon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </SectionAccordionItem>

        {/* 2. TEMPLATE SPECIFIC CONTENT & CARDS */}
        <SectionAccordionItem
          id="content"
          title="Contenido & Disposición de Elementos"
          subtitle={
            section.type === 'pillars_mosaic'
              ? `Mosaico de ${currentCards.length} tarjetas, formas, fotos e iconos`
              : section.type === 'split_media_benefits'
              ? 'Fotografía principal y lista de beneficios'
              : section.type === 'location_map_cta'
              ? 'Dirección física y mapa interactivo'
              : 'Configuración y elementos de la sección'
          }
          icon={Grid}
        >
          {section.type === 'split_media_benefits' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">Fotografía Principal de la Sección:</label>
                <ImageUploadDropzone
                  currentImageUrl={section.config?.imageUrl || ''}
                  onImageUploaded={(url) => handleConfigChange('imageUrl', url)}
                  onRemove={() => handleConfigChange('imageUrl', '')}
                  label="Foto con marco orgánico"
                  helperText="Formato recomendado 4:3 o 1:1"
                  folder="sections"
                  maxSizeMB={10}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Puntos de Beneficio ({currentLangObj.name}):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'item1', def: 'Bilingüe (Inglés vivido naturalmente)' },
                    { key: 'item2', def: 'Áreas verdes y contacto con la naturaleza' },
                    { key: 'item3', def: 'Actividades de vida práctica y sensorial' },
                    { key: 'item4', def: 'Desarrollo socioemocional y autonomía' }
                  ].map((item, idx) => (
                    <div key={item.key} className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500">
                        Beneficio {idx + 1} ({currentLangObj.code.toUpperCase()}):
                      </span>
                      <input
                        type="text"
                        value={getConfigLangValue(item.key, item.def)}
                        onChange={(e) => setConfigLangValue(item.key, e.target.value)}
                        className="w-full px-2 py-1 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section.type === 'pillars_mosaic' && (
            <div className="space-y-4">
              {/* Disposición de Columnas */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Disposición de Columnas en Pantallas Grandes:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '2', label: '2 Columnas', desc: 'Tarjetas amplias' },
                    { id: '3', label: '3 Columnas', desc: 'Cuadrícula clásica (3x2)' },
                    { id: '4', label: '4 Columnas', desc: 'Cuadrícula compacta' },
                    { id: 'bento', label: 'Bento Mosaico', desc: 'Asimétrico moderno' }
                  ].map(col => {
                    const isSelected = (section.config?.columns || '3') === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => handleConfigChange('columns', col.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-forest bg-forest/5 text-forest ring-2 ring-forest/20 shadow-3xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs block">{col.label}</span>
                        <span className="text-[10px] text-muted-foreground block">{col.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fondo de Toda la Sección */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Fondo de Toda la Sección ({themeMode === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}):
                  </label>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    themeMode === 'dark' ? 'bg-slate-900 text-sky-400 border border-slate-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {themeMode === 'dark' ? <Moon className="w-2.5 h-2.5" /> : <Sun className="w-2.5 h-2.5" />}
                    <span>{themeMode === 'dark' ? 'Oscuro' : 'Claro'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(themeMode === 'dark'
                    ? [
                        { id: 'dark', label: 'Oscuro Elegante', bg: 'bg-slate-950 text-white' },
                        { id: 'forest-dark', label: 'Bosque Nocturno', bg: 'bg-[#0c1811] text-emerald-400' },
                        { id: 'slate-dark', label: 'Slate Profundo', bg: 'bg-slate-900 text-slate-200' },
                        { id: 'zinc-dark', label: 'Zinc Nocturno', bg: 'bg-zinc-950 text-zinc-300' },
                        { id: 'gradient-dark', label: 'Degradado Oscuro', bg: 'bg-gradient-to-b from-slate-950 via-[#0c1811] to-slate-950' },
                        { id: 'custom', label: 'Personalizado', bg: 'bg-slate-800' }
                      ]
                    : [
                        { id: 'secondary', label: 'Sand Suave', bg: 'bg-secondary' },
                        { id: 'white', label: 'Blanco Puro', bg: 'bg-white' },
                        { id: 'cream', label: 'Crema Cálido', bg: 'bg-[#faf8f5]' },
                        { id: 'forest-subtle', label: 'Menta Bosque', bg: 'bg-[#f2f7f4]' },
                        { id: 'gradient', label: 'Degradado Orgánico', bg: 'bg-gradient-to-b from-[#faf8f5] to-[#f4f8f5]' },
                        { id: 'custom', label: 'Personalizado', bg: 'bg-slate-100' }
                      ]
                  ).map(bgOpt => {
                    const currentBgId = themeMode === 'dark'
                      ? (section.config?.sectionBgDark || 'dark')
                      : (section.config?.sectionBg || 'secondary');
                    const isSelected = currentBgId === bgOpt.id;
                    return (
                      <button
                        key={bgOpt.id}
                        type="button"
                        onClick={() => {
                          if (themeMode === 'dark') {
                            handleConfigChange('sectionBgDark', bgOpt.id);
                          } else {
                            handleConfigChange('sectionBg', bgOpt.id);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-forest bg-forest/5 text-forest ring-2 ring-forest/20 shadow-3xs font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border border-slate-300 shrink-0 ${bgOpt.bg}`} />
                        <span className="font-bold text-[11px] truncate">{bgOpt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                {((themeMode === 'dark' ? (section.config?.sectionBgDark === 'custom') : (section.config?.sectionBg === 'custom'))) && (
                  <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-150">
                    <span className="text-[11px] font-bold text-slate-600">
                      Color Hex ({themeMode === 'dark' ? 'Oscuro' : 'Claro'}):
                    </span>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-3xs ${
                      themeMode === 'dark' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-200'
                    }`}>
                      <input
                        type="color"
                        value={
                          themeMode === 'dark'
                            ? (section.config?.sectionBgCustomDark?.startsWith('#') && section.config.sectionBgCustomDark.length === 7 ? section.config.sectionBgCustomDark : '#0c1811')
                            : (section.config?.sectionBgCustom?.startsWith('#') && section.config.sectionBgCustom.length === 7 ? section.config.sectionBgCustom : '#faf8f5')
                        }
                        onChange={(e) => {
                          if (themeMode === 'dark') {
                            handleConfigChange('sectionBgCustomDark', e.target.value);
                          } else {
                            handleConfigChange('sectionBgCustom', e.target.value);
                          }
                        }}
                        className={`w-5 h-5 rounded border cursor-pointer p-0 appearance-none bg-transparent ${
                          themeMode === 'dark' ? 'border-slate-600' : 'border-slate-300'
                        }`}
                      />
                      <input
                        type="text"
                        value={themeMode === 'dark' ? (section.config?.sectionBgCustomDark || '') : (section.config?.sectionBgCustom || '')}
                        onChange={(e) => {
                          if (themeMode === 'dark') {
                            handleConfigChange('sectionBgCustomDark', e.target.value);
                          } else {
                            handleConfigChange('sectionBgCustom', e.target.value);
                          }
                        }}
                        placeholder={themeMode === 'dark' ? '#0c1811' : '#faf8f5'}
                        className={`w-20 text-[10px] font-mono uppercase bg-transparent border-0 focus:outline-none ${
                          themeMode === 'dark' ? 'text-slate-200' : 'text-slate-700'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* GESTOR DE TARJETAS DE CONTENIDO */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      Tarjetas de Contenido ({currentCards.length})
                    </h5>
                    <p className="text-[10px] text-muted-foreground">
                      Añadí, reordená y personalizá formas, iconos, rotación y colores
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="px-3 py-1.5 rounded-xl bg-forest text-white hover:bg-forest/90 font-bold text-xs flex items-center gap-1.5 shadow-3xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Tarjeta</span>
                  </button>
                </div>

                {/* Lista de Tarjetas */}
                <div className="space-y-3">
                  {currentCards.map((card, index) => {
                    const isExpanded = expandedCardId === card.id;
                    const IconComp = card.icon && PILLAR_ICONS_MAP[card.icon] ? PILLAR_ICONS_MAP[card.icon] : Compass;
                    const cardTitle = editorLang !== 'es'
                      ? ((card as any)[`title_${editorLang}`] || card.title)
                      : card.title;
                    const cardSubtitle = editorLang !== 'es'
                      ? ((card as any)[`subtitle_${editorLang}`] || card.subtitle)
                      : card.subtitle;

                    return (
                      <div
                        key={card.id}
                        className={`rounded-2xl border transition-all ${
                          isExpanded
                            ? 'border-forest ring-2 ring-forest/10 bg-slate-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Header de la tarjeta */}
                        <div className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Controles de Reordenamiento */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveCard(index, 'up')}
                                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                title="Mover arriba"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === currentCards.length - 1}
                                onClick={() => handleMoveCard(index, 'down')}
                                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                title="Mover abajo"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Miniatura Foto o Icono */}
                            {card.imageUrl ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                                <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 text-forest"
                                style={{ backgroundColor: card.bgColor || '#f4f8f5' }}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 truncate">{cardTitle || `Tarjeta ${index + 1}`}</span>
                                <span className="text-[9px] font-mono text-slate-400">#{index + 1}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">{cardSubtitle || 'Sin descripción'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.id)}
                              disabled={currentCards.length <= 1}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors cursor-pointer"
                              title="Eliminar tarjeta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <span>{isExpanded ? 'Cerrar' : 'Editar'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Panel de Edición Detallada */}
                        {isExpanded && (
                          <div className="p-4 pt-0 space-y-4 border-t border-slate-200/80 mt-2 animate-in fade-in duration-150">
                            {/* Título de la tarjeta */}
                            <div className="space-y-1.5 pt-2">
                              <label className="text-[10px] font-bold text-slate-700">
                                Título de la Tarjeta ({currentLangObj.name}):
                              </label>
                              <input
                                type="text"
                                value={cardTitle}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (editorLang === 'es') {
                                    handleUpdateSingleCard(card.id, { title: val });
                                  } else {
                                    handleUpdateSingleCard(card.id, { [`title_${editorLang}`]: val } as any);
                                  }
                                }}
                                placeholder={`Título en ${currentLangObj.name}`}
                                className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
                              />
                              <FieldTypographyAndColorBar
                                fontValue={card.titleFont || 'inherit'}
                                onChangeFont={(fId) => handleUpdateSingleCard(card.id, { titleFont: fId })}
                                colorLight={card.titleColor}
                                onChangeColorLight={(hex) => handleUpdateSingleCard(card.id, { titleColor: hex })}
                                colorDark={card.titleColorDark}
                                onChangeColorDark={(hex) => handleUpdateSingleCard(card.id, { titleColorDark: hex })}
                                defaultColorLight="#0f172a"
                                defaultColorDark="#ffffff"
                              />
                            </div>

                            {/* Subtítulo / Descripción */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-700">
                                Descripción / Detalle de la Tarjeta ({currentLangObj.name}):
                              </label>
                              <textarea
                                value={cardSubtitle}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (editorLang === 'es') {
                                    handleUpdateSingleCard(card.id, { subtitle: val });
                                  } else {
                                    handleUpdateSingleCard(card.id, { [`subtitle_${editorLang}`]: val } as any);
                                  }
                                }}
                                rows={2}
                                placeholder={`Detalle informativo en ${currentLangObj.name}...`}
                                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
                              />
                              <FieldTypographyAndColorBar
                                fontValue={card.subtitleFont || 'inherit'}
                                onChangeFont={(fId) => handleUpdateSingleCard(card.id, { subtitleFont: fId })}
                                colorLight={card.subtitleColor || card.textColor}
                                onChangeColorLight={(hex) => handleUpdateSingleCard(card.id, { subtitleColor: hex, textColor: hex })}
                                colorDark={card.subtitleColorDark || card.textColorDark}
                                onChangeColorDark={(hex) => handleUpdateSingleCard(card.id, { subtitleColorDark: hex, textColorDark: hex })}
                                defaultColorLight="#64748b"
                                defaultColorDark="#cbd5e1"
                              />
                            </div>

                            {/* Icono o Imagen */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-700 block">
                                Icono o Fotografía de la Tarjeta:
                              </label>
                              <div className="space-y-2">
                                {/* Icon Picker Grid */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <span className="text-[10px] text-muted-foreground font-semibold">Seleccionar Icono:</span>
                                    <div className="flex items-center gap-1">
                                      {CARD_ICON_CATEGORIES.map(cat => (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => setCardIconCategory(cat.id)}
                                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                                            cardIconCategory === cat.id
                                              ? 'bg-forest text-white shadow-3xs'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          {cat.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 bg-white p-2 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                                    {Object.entries(PILLAR_ICONS_MAP)
                                      .filter(([iconName]) => {
                                        if (cardIconCategory === 'all') return true;
                                        return CARD_ICONS_BY_CAT[cardIconCategory]?.includes(iconName);
                                      })
                                      .map(([iconName, Icon]) => {
                                        const isSelected = !card.imageUrl && (card.icon || 'Compass') === iconName;
                                        return (
                                          <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => handleUpdateSingleCard(card.id, { icon: iconName, imageUrl: '' })}
                                            className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                              isSelected
                                                ? 'bg-forest text-white shadow-3xs scale-105'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                            title={iconName}
                                          >
                                            <Icon className="w-4 h-4" />
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>

                                {/* O Subir Foto Custom */}
                                <div className="space-y-1 pt-1 border-t border-slate-100">
                                  <span className="text-[10px] text-muted-foreground block">O Subir Imagen Personalizada:</span>
                                  <ImageUploadDropzone
                                    currentImageUrl={card.imageUrl || ''}
                                    onImageUploaded={(url) => handleUpdateSingleCard(card.id, { imageUrl: url })}
                                    onRemove={() => handleUpdateSingleCard(card.id, { imageUrl: '' })}
                                    label="Foto miniatura de la tarjeta"
                                    helperText="Recomendado cuadrado 1:1"
                                    folder="pillars"
                                    maxSizeMB={5}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Forma de la Tarjeta & Efecto Hover */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                              {/* Forma */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-700 block">
                                  Forma Geométrica de la Tarjeta:
                                </label>
                                <CustomShapePicker
                                  value={card.shape || 'rounded'}
                                  onChange={(shape) => handleUpdateSingleCard(card.id, { shape: shape as any })}
                                />
                              </div>

                              {/* Efecto Hover */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-700 block">
                                  Efecto al Pasar el Mouse (Hover):
                                </label>
                                <CustomHoverPicker
                                  value={card.hoverEffect || 'lift'}
                                  onChange={(hoverEffect) => handleUpdateSingleCard(card.id, { hoverEffect: hoverEffect as any })}
                                />
                              </div>
                            </div>

                            {/* Rotación Inclinada de la Tarjeta */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <RotateCw className="w-3.5 h-3.5 text-forest" />
                                  <label className="text-[10px] font-bold text-slate-700">
                                    Rotación Inclinada de la Tarjeta (°):
                                  </label>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                    Number(card.rotateZ ?? card.rotation ?? 0) !== 0
                                      ? 'bg-forest text-white shadow-3xs'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {Number(card.rotateZ ?? card.rotation ?? 0) > 0 ? `+${card.rotateZ ?? card.rotation ?? 0}°` : `${card.rotateZ ?? card.rotation ?? 0}°`}
                                  </span>
                                  {Number(card.rotateZ ?? card.rotation ?? 0) !== 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSingleCard(card.id, { rotateZ: 0, rotation: 0 })}
                                      className="text-[9px] text-slate-400 hover:text-rose-500 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Restablecer rotación a 0°"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-mono text-slate-400 font-bold">-15°</span>
                                <input
                                  type="range"
                                  min="-15"
                                  max="15"
                                  step="0.5"
                                  value={Number(card.rotateZ ?? card.rotation ?? 0)}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    handleUpdateSingleCard(card.id, { rotateZ: val, rotation: val });
                                  }}
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-forest focus:outline-none"
                                />
                                <span className="text-[9px] font-mono text-slate-400 font-bold">+15°</span>
                              </div>

                              {/* Presets de Rotación Rápida */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] text-muted-foreground font-semibold">Presets:</span>
                                {[-6, -3, -1.5, 0, 1.5, 3, 6].map((deg) => (
                                  <button
                                    key={deg}
                                    type="button"
                                    onClick={() => handleUpdateSingleCard(card.id, { rotateZ: deg, rotation: deg })}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer ${
                                      Number(card.rotateZ ?? card.rotation ?? 0) === deg
                                        ? 'bg-forest text-white shadow-3xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {deg > 0 ? `+${deg}°` : `${deg}°`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Color de Fondo de la Tarjeta */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-700 block">
                                  Color de Fondo de la Tarjeta ({themeMode === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}):
                                </label>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  themeMode === 'dark' ? 'bg-slate-900 text-sky-400 border border-slate-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {themeMode === 'dark' ? <Moon className="w-2.5 h-2.5" /> : <Sun className="w-2.5 h-2.5" />}
                                  <span>{themeMode === 'dark' ? 'Oscuro' : 'Claro'}</span>
                                </span>
                              </div>

                              {/* Presets */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(themeMode === 'dark'
                                  ? [
                                      { hex: '#14251c', label: 'Bosque Profundo' },
                                      { hex: '#0f172a', label: 'Slate Oscuro' },
                                      { hex: '#18181b', label: 'Zinc Oscuro' },
                                      { hex: '#1e293b', label: 'Azul Noche' },
                                      { hex: '#262626', label: 'Neutral' },
                                      { hex: '#3b0764', label: 'Púrpura Profundo' },
                                      { hex: '#451a03', label: 'Ámbar Oscuro' },
                                      { hex: '#000000', label: 'Negro Puro' }
                                    ]
                                  : [
                                      { hex: '#f4f8f5', label: 'Sage' },
                                      { hex: '#fbf6ee', label: 'Crema' },
                                      { hex: '#f1f5f9', label: 'Sky' },
                                      { hex: '#fef3f2', label: 'Rose' },
                                      { hex: '#ecfdf5', label: 'Mint' },
                                      { hex: '#faf5ff', label: 'Lavender' },
                                      { hex: '#ffffff', label: 'Blanco' },
                                      { hex: '#e2e8f0', label: 'Gris Suave' }
                                    ]
                                ).map(p => {
                                  const activeCardBg = themeMode === 'dark' ? (card.bgColorDark || '#14251c') : (card.bgColor || '#f4f8f5');
                                  return (
                                    <button
                                      key={p.hex}
                                      type="button"
                                      onClick={() => {
                                        if (themeMode === 'dark') {
                                          handleUpdateSingleCard(card.id, { bgColorDark: p.hex });
                                        } else {
                                          handleUpdateSingleCard(card.id, { bgColor: p.hex });
                                        }
                                      }}
                                      style={{ backgroundColor: p.hex }}
                                      className={`w-6 h-6 rounded-lg border transition-all cursor-pointer ${
                                        activeCardBg === p.hex
                                          ? 'border-forest ring-2 ring-forest/30 scale-110 shadow-3xs'
                                          : 'border-slate-300 hover:scale-105'
                                      }`}
                                      title={p.label}
                                    />
                                  );
                                })}
                              </div>

                              {/* Single Dynamic Color Picker */}
                              <div className="flex items-center gap-3 pt-1">
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-3xs ${
                                  themeMode === 'dark' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-200'
                                }`}>
                                  {themeMode === 'dark' ? (
                                    <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Modo Oscuro" />
                                  ) : (
                                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Modo Claro" />
                                  )}
                                  <input
                                    type="color"
                                    value={
                                      themeMode === 'dark'
                                        ? (card.bgColorDark?.startsWith('#') && card.bgColorDark.length === 7 ? card.bgColorDark : '#14251c')
                                        : (card.bgColor?.startsWith('#') && card.bgColor.length === 7 ? card.bgColor : '#f4f8f5')
                                    }
                                    onChange={(e) => {
                                      if (themeMode === 'dark') {
                                        handleUpdateSingleCard(card.id, { bgColorDark: e.target.value });
                                      } else {
                                        handleUpdateSingleCard(card.id, { bgColor: e.target.value });
                                      }
                                    }}
                                    className={`w-5 h-5 rounded border cursor-pointer p-0 appearance-none bg-transparent ${
                                      themeMode === 'dark' ? 'border-slate-600' : 'border-slate-300'
                                    }`}
                                  />
                                  <input
                                    type="text"
                                    value={themeMode === 'dark' ? (card.bgColorDark || '') : (card.bgColor || '')}
                                    onChange={(e) => {
                                      if (themeMode === 'dark') {
                                        handleUpdateSingleCard(card.id, { bgColorDark: e.target.value });
                                      } else {
                                        handleUpdateSingleCard(card.id, { bgColor: e.target.value });
                                      }
                                    }}
                                    placeholder={themeMode === 'dark' ? '#14251c' : '#f4f8f5'}
                                    className={`w-16 text-[10px] font-mono uppercase bg-transparent border-0 focus:outline-none ${
                                      themeMode === 'dark' ? 'text-slate-200' : 'text-slate-700'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {section.type === 'location_map_cta' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Dirección Física Completa ({currentLangObj.name}):
                </label>
                <input
                  type="text"
                  value={getConfigLangValue('address', 'Av. Principal 123, Zona Escolar, Benito Juárez, Quintana Roo')}
                  onChange={(e) => setConfigLangValue('address', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">URL del Mapa Embebido (Google Maps iframe src):</label>
                <input
                  type="text"
                  value={section.config?.mapUrl || ''}
                  onChange={(e) => handleConfigChange('mapUrl', e.target.value)}
                  placeholder="https://maps.google.com/maps?q=..."
                  className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}
        </SectionAccordionItem>

        {/* 3. STICKERS & ADORNOS FLOTANTES */}
        <SectionAccordionItem
          id="stickers"
          title="✨ Stickers & Adornos Flotantes"
          subtitle="Adornos decorativos animados con coordenadas responsive"
          icon={Sparkles}
          badge="Desktop / Tablet / Mobile"
        >
          <SectionFloatingStickersEditor
            config={section.config}
            onChangeConfig={handleConfigChange}
          />
        </SectionAccordionItem>

        {/* 4. ENLACE EN EL MENÚ DE NAVEGACIÓN (HEADER) */}
        <SectionAccordionItem
          id="navigation"
          title="Menú & Navegación (Header)"
          subtitle="Enlace directo en la barra superior pública"
          icon={PanelTop}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-slate-900 text-xs">
                Enlace en la Barra Superior
              </h5>
              <p className="text-[11px] text-muted-foreground">
                Crea un ítem en el menú para saltar directamente a esta sección
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {section.showInMenu !== false ? 'Activado' : 'Desactivado'}
              </span>
              <Switch
                checked={section.showInMenu !== false}
                onCheckedChange={(checked) => onUpdateSection({ showInMenu: checked })}
              />
            </div>
          </div>

          {section.showInMenu !== false && (
            <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-700">
                    Texto del Ítem en el Menú ({currentLangObj.name}):
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {currentLangObj.flag} {currentLangObj.code.toUpperCase()}
                  </span>
                </div>
                <input
                  type="text"
                  value={getLangValue('menuLabel') || (editorLang === 'es' ? section.name : '')}
                  onChange={(e) => setLangValue('menuLabel', e.target.value)}
                  placeholder={`Ej: ${section.name}`}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest shadow-3xs"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Destino de Navegación:</span>
                <span className="font-mono font-bold text-forest bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  /#{section.anchor || section.id}
                </span>
              </div>
            </div>
          )}
        </SectionAccordionItem>

        {/* 5. BOTÓN CTA / LLAMADO A LA ACCIÓN */}
        <SectionAccordionItem
          id="cta"
          title="Botón de Acción (CTA)"
          subtitle="Llamada a la acción, enlace, estilos y colores"
          icon={MousePointerClick}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-slate-900 text-xs">
                Botón de Acción Principal
              </h5>
              <p className="text-[11px] text-muted-foreground">
                Habilita un botón para guiar a los visitantes a una página o WhatsApp
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {section.showCta !== false && (section.config?.showCta === true || (section.config?.showCta !== false && Boolean(getLangValue('ctaText') || section.ctaText))) ? 'Activado' : 'Desactivado'}
              </span>
              <Switch
                checked={section.showCta !== false && (section.config?.showCta === true || (section.config?.showCta !== false && Boolean(getLangValue('ctaText') || section.ctaText)))}
                onCheckedChange={(checked) => {
                  onUpdateSection({ showCta: checked });
                  handleConfigChange('showCta', checked);
                  if (checked && !getLangValue('ctaText') && !section.ctaText) {
                    setLangValue('ctaText', 'Conoce Más');
                  }
                }}
              />
            </div>
          </div>

          {section.showCta !== false && (section.config?.showCta === true || (section.config?.showCta !== false && Boolean(getLangValue('ctaText') || section.ctaText))) && (
            <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Texto del Botón ({currentLangObj.name}):
                </label>
                <input
                  type="text"
                  value={getLangValue('ctaText')}
                  onChange={(e) => setLangValue('ctaText', e.target.value)}
                  placeholder={`Texto del botón en ${currentLangObj.name}...`}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">Enlace / Destino de Acción:</label>
                <input
                  type="text"
                  value={section.ctaUrl || ''}
                  onChange={(e) => onUpdateSection({ ctaUrl: e.target.value })}
                  placeholder="Ej: /#admisiones o https://wa.me/..."
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <FieldTypographyAndColorBar
                fontValue={section.config?.cta_font}
                onChangeFont={(val) => handleConfigChange('cta_font', val)}
                colorLight={section.config?.cta_color}
                onChangeColorLight={(val) => handleConfigChange('cta_color', val)}
                colorDark={section.config?.cta_color_dark}
                onChangeColorDark={(val) => handleConfigChange('cta_color_dark', val)}
                defaultColorLight="#1b3b2b"
                defaultColorDark="#ffffff"
              />
            </div>
          )}
        </SectionAccordionItem>

        {/* 6. DANGER ZONE / ACTIONS */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          {onDuplicateSection && (
            <button
              type="button"
              onClick={onDuplicateSection}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Duplicar Sección
            </button>
          )}

          {onDeleteSection && (
            <button
              type="button"
              onClick={onDeleteSection}
              className="px-3 py-1.5 text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
            >
              Eliminar Sección
            </button>
          )}
        </div>

        </div>
      </SectionAccordionContext.Provider>
    </SectionThemeContext.Provider>
  );
};
