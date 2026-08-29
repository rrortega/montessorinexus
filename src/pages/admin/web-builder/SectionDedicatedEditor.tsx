import React, { useState } from 'react';
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
  MousePointerClick
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
  { id: 'cinzel', name: 'Cinzel', category: 'Serif / Clásica', family: "'Cinzel', serif" },
  { id: 'merriweather', name: 'Merriweather', category: 'Serif / Literaria', family: "'Merriweather', serif" },
  { id: 'outfit', name: 'Outfit', category: 'Moderna / Geométrica', family: "'Outfit', sans-serif" },
  { id: 'jakarta', name: 'Plus Jakarta Sans', category: 'Vanguardista / Tech', family: "'Plus Jakarta Sans', sans-serif" },
  { id: 'lexend', name: 'Lexend', category: 'Educativa / Legible', family: "'Lexend', sans-serif" },
  { id: 'poppins', name: 'Poppins', category: 'Publicitaria / Geométrica', family: "'Poppins', sans-serif" },
  { id: 'montserrat', name: 'Montserrat', category: 'Corporativa', family: "'Montserrat', sans-serif" },
  { id: 'inter', name: 'Inter', category: 'Neutra / UI Moderna', family: "'Inter', sans-serif" },
  { id: 'quicksand', name: 'Quicksand', category: 'Amigable / Redonda', family: "'Quicksand', sans-serif" },
  { id: 'comfortaa', name: 'Comfortaa', category: 'Suave / Redonda', family: "'Comfortaa', cursive" },
  { id: 'fredoka', name: 'Fredoka', category: 'Lúdica / Infantil', family: "'Fredoka', cursive" },
  { id: 'caveat', name: 'Caveat', category: 'Manuscrita / Cálida', family: "'Caveat', cursive" },
  { id: 'dancing', name: 'Dancing Script', category: 'Caligráfica / Elegante', family: "'Dancing Script', cursive" }
];

export const getSectionFontFamily = (fontId?: string): string | undefined => {
  if (!fontId || fontId === 'inherit') return undefined;
  const found = SECTION_FONTS.find(f => f.id === fontId);
  return found ? found.family : undefined;
};

interface FieldTypographyAndColorBarProps {
  fontValue?: string;
  onChangeFont: (fontId: string) => void;
  colorLight?: string;
  onChangeColorLight: (hex: string) => void;
  colorDark?: string;
  onChangeColorDark: (hex: string) => void;
  defaultColorLight?: string;
  defaultColorDark?: string;
}

const FieldTypographyAndColorBar: React.FC<FieldTypographyAndColorBarProps> = ({
  fontValue = 'inherit',
  onChangeFont,
  colorLight,
  onChangeColorLight,
  colorDark,
  onChangeColorDark,
  defaultColorLight = '#1b3b2b',
  defaultColorDark = '#ffffff'
}) => {
  const activeLight = colorLight || defaultColorLight;
  const activeDark = colorDark || defaultColorDark;

  return (
    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-3xs space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
        {/* Font Family Choice */}
        <div className="flex items-center gap-1.5 min-w-[200px] flex-1">
          <Type className="w-3.5 h-3.5 text-forest shrink-0" />
          <span className="text-[10px] font-bold text-slate-600 shrink-0">Fuente:</span>
          <select
            value={fontValue || 'inherit'}
            onChange={(e) => onChangeFont(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-forest/20 focus:border-forest"
          >
            {SECTION_FONTS.map(f => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.family }}>
                {f.name} ({f.category})
              </option>
            ))}
          </select>
        </div>

        {/* Color Light & Dark Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Light Color */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-3xs">
            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Color en Modo Claro" />
            <div className="relative flex items-center">
              <input
                type="color"
                value={activeLight.startsWith('#') && activeLight.length === 7 ? activeLight : '#1b3b2b'}
                onChange={(e) => onChangeColorLight(e.target.value)}
                className="w-5 h-5 rounded-md border border-slate-300 cursor-pointer p-0 appearance-none bg-transparent"
                title="Elegir color claro"
              />
            </div>
            <input
              type="text"
              value={colorLight || ''}
              onChange={(e) => onChangeColorLight(e.target.value)}
              placeholder={defaultColorLight}
              className="w-16 text-[10px] font-mono uppercase text-slate-700 bg-transparent border-0 focus:outline-none"
            />
          </div>

          {/* Dark Color */}
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2 py-1 rounded-lg border border-slate-800 shadow-3xs">
            <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Color en Modo Oscuro" />
            <div className="relative flex items-center">
              <input
                type="color"
                value={activeDark.startsWith('#') && activeDark.length === 7 ? activeDark : '#ffffff'}
                onChange={(e) => onChangeColorDark(e.target.value)}
                className="w-5 h-5 rounded-md border border-slate-600 cursor-pointer p-0 appearance-none bg-transparent"
                title="Elegir color oscuro"
              />
            </div>
            <input
              type="text"
              value={colorDark || ''}
              onChange={(e) => onChangeColorDark(e.target.value)}
              placeholder={defaultColorDark}
              className="w-16 text-[10px] font-mono uppercase text-slate-200 bg-transparent border-0 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface SectionDedicatedEditorProps {
  section: WebSectionItem;
  enabledLangsStr?: string;
  onUpdateSection: (updates: Partial<WebSectionItem>) => void;
  onDuplicateSection?: () => void;
  onDeleteSection?: () => void;
}

export const SectionDedicatedEditor: React.FC<SectionDedicatedEditorProps> = ({
  section,
  enabledLangsStr = 'es,en',
  onUpdateSection,
  onDuplicateSection,
  onDeleteSection
}) => {
  const activeCodes = enabledLangsStr
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const activeLanguages = activeCodes.map(code => getLanguageByCode(code));
  const [editorLang, setEditorLang] = useState<string>(activeCodes[0] || 'es');
  const currentLangObj = getLanguageByCode(editorLang);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 text-xs text-slate-800 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER PROFILE & STATUS */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-3xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center shadow-3xs shrink-0">
            <IconComp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900 truncate">
                {getLangValue('name') || section.name}
              </h3>
              {template?.tag && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-forest/10 text-forest border border-forest/20">
                  {template.tag}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {template?.description || 'Personalizá todos los parámetros de este bloque.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onUpdateSection({ isEnabled: !section.isEnabled })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              section.isEnabled
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-3xs'
                : 'bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {section.isEnabled ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{section.isEnabled ? 'Activa' : 'Oculta'}</span>
          </button>
        </div>
      </div>

      {/* LANGUAGE SELECTOR SWITCH (DYNAMIC TO ALL ENABLED SITE LANGUAGES) */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-forest/5 via-forest/10 to-amber-500/5 border border-forest/20 shadow-3xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest text-white flex items-center justify-center shadow-3xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 block">Idioma de Edición</span>
              <span className="text-[10px] text-muted-foreground">Configurando textos para {currentLangObj.name}</span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 shadow-3xs">
            {currentLangObj.flag} {currentLangObj.code.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-3xs flex-wrap">
          {activeLanguages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setEditorLang(l.code)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                editorLang === l.code
                  ? 'bg-forest text-white shadow-3xs scale-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. GENERAL HEADINGS & TEXTS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">1</div>
            <h4 className="font-bold text-forest text-xs sm:text-sm">
              Titulares & Textos ({currentLangObj.name})
            </h4>
          </div>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            {currentLangObj.flag} {currentLangObj.name}
          </span>
        </div>

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
      </div>

      {/* 2. ENLACE EN EL MENÚ DE NAVEGACIÓN (HEADER) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">
              <PanelTop className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-forest text-xs sm:text-sm">
                Enlace en el Menú de Navegación (Header)
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Crea un ítem en la barra superior para saltar a esta sección
              </p>
            </div>
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
      </div>

      {/* 3. BOTÓN CTA / LLAMADO A LA ACCIÓN */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">
              <MousePointerClick className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-forest text-xs sm:text-sm">
                Botón de Acción CTA
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Habilita un botón principal para guiar a los visitantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              {section.config?.showCta !== false && (Boolean(section.ctaText) || section.config?.showCta === true) ? 'Activado' : 'Desactivado'}
            </span>
            <Switch
              checked={section.config?.showCta !== false && (Boolean(section.ctaText) || section.config?.showCta === true)}
              onCheckedChange={(checked) => handleConfigChange('showCta', checked)}
            />
          </div>
        </div>

        {section.config?.showCta !== false && (Boolean(section.ctaText) || section.config?.showCta === true) && (
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
      </div>

      {/* 4. TEMPLATE SPECIFIC CUSTOM CONTROLS */}
      {section.type === 'split_media_benefits' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">3</div>
            <h4 className="font-bold text-forest text-xs sm:text-sm">Configuración de Media & Beneficios</h4>
          </div>

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
        <div className="space-y-6">
          {/* 4.1 FONDO Y DISPOSICIÓN DE COLUMNAS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">
                <Layout className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-forest text-xs sm:text-sm">
                  Fondo & Disposición de la Sección
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Personalizá la cuadrícula de columnas y el fondo general del mosaico
                </p>
              </div>
            </div>

            {/* Disposición de Columnas */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
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
              <label className="text-[11px] font-bold text-slate-700 block">
                Fondo de Toda la Sección:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'secondary', label: 'Sand Suave', bg: 'bg-secondary' },
                  { id: 'white', label: 'Blanco Puro', bg: 'bg-white' },
                  { id: 'cream', label: 'Crema Cálido', bg: 'bg-[#faf8f5]' },
                  { id: 'forest-subtle', label: 'Menta Bosque', bg: 'bg-[#f2f7f4]' },
                  { id: 'dark', label: 'Oscuro Elegante', bg: 'bg-slate-950 text-white' },
                  { id: 'gradient', label: 'Degradado Orgánico', bg: 'bg-gradient-to-b from-[#faf8f5] to-[#f4f8f5]' },
                  { id: 'custom', label: 'Personalizado', bg: 'bg-slate-100' }
                ].map(bgOpt => {
                  const isSelected = (section.config?.sectionBg || 'secondary') === bgOpt.id;
                  return (
                    <button
                      key={bgOpt.id}
                      type="button"
                      onClick={() => handleConfigChange('sectionBg', bgOpt.id)}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-forest ring-2 ring-forest/20 shadow-3xs font-bold'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border border-slate-300 ${bgOpt.bg} shrink-0`} />
                      <span className="text-xs truncate">{bgOpt.label}</span>
                    </button>
                  );
                })}
              </div>

              {section.config?.sectionBg === 'custom' && (
                <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-150">
                  <span className="text-[11px] font-bold text-slate-600">Color Hex:</span>
                  <input
                    type="color"
                    value={section.config?.sectionBgCustom || '#faf8f5'}
                    onChange={(e) => handleConfigChange('sectionBgCustom', e.target.value)}
                    className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={section.config?.sectionBgCustom || '#faf8f5'}
                    onChange={(e) => handleConfigChange('sectionBgCustom', e.target.value)}
                    placeholder="#faf8f5"
                    className="px-2.5 py-1 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg w-28"
                  />
                </div>
              )}
            </div>

            {/* Bloque Destacado / Banner Informativo */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-xs text-slate-800">
                    Tarjeta Destacada / Banner Informativo
                  </h5>
                  <p className="text-[10px] text-muted-foreground">
                    Banner panorámico para resaltar un mensaje clave, propósito o llamado principal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {section.config?.showMission !== false ? 'Activado' : 'Desactivado'}
                  </span>
                  <Switch
                    checked={section.config?.showMission !== false}
                    onCheckedChange={(checked) => handleConfigChange('showMission', checked)}
                  />
                </div>
              </div>

              {section.config?.showMission !== false && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 animate-in fade-in duration-150">
                  {/* Etiqueta superior opcional */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">
                      Etiqueta Superior del Banner (Opcional - {currentLangObj.name}):
                    </label>
                    <input
                      type="text"
                      value={getConfigLangValue('missionBadgeText', '')}
                      onChange={(e) => setConfigLangValue('missionBadgeText', e.target.value)}
                      placeholder={`Ej: Nuestra Misión, Compromiso, Aviso Especial...`}
                      className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>

                  {/* Texto principal del banner */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">
                      Texto Principal del Mensaje ({currentLangObj.name}):
                    </label>
                    <textarea
                      value={getConfigLangValue('missionText', 'Comprometidos con el desarrollo integral, la excelencia formativa y el máximo potencial de cada estudiante.')}
                      onChange={(e) => setConfigLangValue('missionText', e.target.value)}
                      rows={2}
                      placeholder={`Mensaje o cita destacada en ${currentLangObj.name}...`}
                      className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>

                  {/* Tipografía y Color del Texto */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">
                      Tipografía & Color del Texto:
                    </label>
                    <FieldTypographyAndColorBar
                      fontValue={section.config?.mission_font}
                      onChangeFont={(val) => handleConfigChange('mission_font', val)}
                      colorLight={section.config?.mission_color}
                      onChangeColorLight={(val) => handleConfigChange('mission_color', val)}
                      colorDark={section.config?.mission_color_dark}
                      onChangeColorDark={(val) => handleConfigChange('mission_color_dark', val)}
                      defaultColorLight="#ffffff"
                      defaultColorDark="#ffffff"
                    />
                  </div>

                  {/* Alineación y Redondeo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                    {/* Alineación del Texto */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block">
                        Alineación del Texto:
                      </label>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                        {[
                          { val: 'left', icon: AlignLeft, label: 'Izquierda' },
                          { val: 'center', icon: AlignCenter, label: 'Centrado' },
                          { val: 'right', icon: AlignRight, label: 'Derecha' }
                        ].map(al => {
                          const AlIcon = al.icon;
                          const isSelected = (section.config?.mission_align || 'left') === al.val;
                          return (
                            <button
                              key={al.val}
                              type="button"
                              onClick={() => handleConfigChange('mission_align', al.val)}
                              className={`flex-1 p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-forest text-white shadow-3xs font-bold'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                              title={al.label}
                            >
                              <AlIcon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Redondeo de Esquinas */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block">
                        Redondeo de Esquinas:
                      </label>
                      <select
                        value={section.config?.mission_radius || '3xl'}
                        onChange={(e) => handleConfigChange('mission_radius', e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      >
                        <option value="none">Recto (0px)</option>
                        <option value="md">Medio (12px)</option>
                        <option value="lg">Grande (16px)</option>
                        <option value="xl">Extra (24px)</option>
                        <option value="2xl">2XL (32px)</option>
                        <option value="3xl">3XL (40px - Clásico)</option>
                        <option value="full">Píldora (Cápsula)</option>
                      </select>
                    </div>
                  </div>

                  {/* Color de Fondo de la Tarjeta Destacada */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/70">
                    <label className="text-[10px] font-bold text-slate-700 block">
                      Color de Fondo del Banner:
                    </label>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { hex: 'gradient', label: 'Degradado Bosque', bg: 'bg-gradient-to-r from-forest to-forest-light' },
                        { hex: '#1b3b2b', label: 'Bosque Clásico', bg: 'bg-[#1b3b2b]' },
                        { hex: '#fbf6ee', label: 'Crema Cálido', bg: 'bg-[#fbf6ee]' },
                        { hex: '#064e3b', label: 'Esmeralda', bg: 'bg-[#064e3b]' },
                        { hex: '#0f172a', label: 'Azul Noche', bg: 'bg-[#0f172a]' },
                        { hex: '#7c2d12', label: 'Terracota', bg: 'bg-[#7c2d12]' },
                        { hex: '#3b0764', label: 'Púrpura', bg: 'bg-[#3b0764]' },
                        { hex: '#ffffff', label: 'Blanco', bg: 'bg-white' }
                      ].map(p => {
                        const isSelected = (section.config?.mission_bg_color || 'gradient') === p.hex;
                        return (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => handleConfigChange('mission_bg_color', p.hex)}
                            className={`w-6 h-6 rounded-lg border transition-all cursor-pointer ${p.bg} ${
                              isSelected
                                ? 'border-forest ring-2 ring-forest/30 scale-110 shadow-3xs'
                                : 'border-slate-300 hover:scale-105'
                            }`}
                            title={p.label}
                          />
                        );
                      })}
                    </div>

                    {/* Pickers Claro y Oscuro */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-3xs">
                        <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Modo Claro" />
                        <input
                          type="color"
                          value={section.config?.mission_bg_color?.startsWith('#') ? section.config?.mission_bg_color : '#1b3b2b'}
                          onChange={(e) => handleConfigChange('mission_bg_color', e.target.value)}
                          className="w-5 h-5 rounded border border-slate-300 cursor-pointer p-0 appearance-none bg-transparent"
                        />
                        <input
                          type="text"
                          value={section.config?.mission_bg_color || ''}
                          onChange={(e) => handleConfigChange('mission_bg_color', e.target.value)}
                          placeholder="#1b3b2b"
                          className="w-16 text-[10px] font-mono uppercase bg-transparent border-0 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2 py-1 rounded-lg border border-slate-800 shadow-3xs">
                        <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Modo Oscuro" />
                        <input
                          type="color"
                          value={section.config?.mission_bg_color_dark?.startsWith('#') ? section.config?.mission_bg_color_dark : '#0f1f17'}
                          onChange={(e) => handleConfigChange('mission_bg_color_dark', e.target.value)}
                          className="w-5 h-5 rounded border border-slate-600 cursor-pointer p-0 appearance-none bg-transparent"
                        />
                        <input
                          type="text"
                          value={section.config?.mission_bg_color_dark || ''}
                          onChange={(e) => handleConfigChange('mission_bg_color_dark', e.target.value)}
                          placeholder="#0f1f17"
                          className="w-16 text-[10px] font-mono uppercase text-slate-200 bg-transparent border-0 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4.2 GESTOR DE TARJETAS DE CONTENIDO */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">
                  <Grid className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-forest text-xs sm:text-sm">
                    Tarjetas de Contenido ({currentCards.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Añadí, reordená y personalizá el contenido, iconos o imágenes, formas y colores de cada tarjeta
                  </p>
                </div>
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
            <div className="space-y-3 pt-2 border-t border-slate-100">
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

                        {/* Thumbnail / Icono */}
                        <div
                          style={{ backgroundColor: card.bgColor || '#f4f8f5' }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-forest shadow-3xs shrink-0 border border-slate-200 overflow-hidden"
                        >
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <IconComp className="w-4 h-4" />
                          )}
                        </div>

                        {/* Info Principal */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              #{index + 1}
                            </span>
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {cardTitle || 'Sin título'}
                            </h5>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span className="capitalize">{card.shape || 'rounded'}</span>
                            <span>•</span>
                            <span className="capitalize">Hover: {card.hoverEffect || 'lift'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          disabled={currentCards.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
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
                        <div className="space-y-1 pt-2">
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
                        </div>

                        {/* Subtítulo / Descripción */}
                        <div className="space-y-1">
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
                        </div>

                        {/* Icono o Imagen */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-700 block">
                            Icono o Fotografía de la Tarjeta:
                          </label>
                          <div className="space-y-2">
                            {/* Icon Picker Grid */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground block">Seleccionar Icono:</span>
                              <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 bg-white p-2 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                                {Object.entries(PILLAR_ICONS_MAP).map(([iconName, Icon]) => {
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
                            <select
                              value={card.shape || 'rounded'}
                              onChange={(e) => handleUpdateSingleCard(card.id, { shape: e.target.value as any })}
                              className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-forest/20 focus:border-forest"
                            >
                              <option value="rounded">Redondeado Clásico (3XL)</option>
                              <option value="blob">Orgánico / Blob Shape</option>
                              <option value="arch">Arco Superior Nórdico</option>
                              <option value="squircle">Squircle Suave</option>
                              <option value="minimal">Minimalista Recto</option>
                            </select>
                          </div>

                          {/* Efecto Hover */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">
                              Efecto al Pasar el Mouse (Hover):
                            </label>
                            <select
                              value={card.hoverEffect || 'lift'}
                              onChange={(e) => handleUpdateSingleCard(card.id, { hoverEffect: e.target.value as any })}
                              className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-forest/20 focus:border-forest"
                            >
                              <option value="lift">Elevación 3D (Lift)</option>
                              <option value="scale">Zoom Suave (105%)</option>
                              <option value="glow">Resplandor Brillante (Glow)</option>
                              <option value="tilt">Inclinación Lúdica (Tilt)</option>
                              <option value="border">Borde Acento Dinámico</option>
                            </select>
                          </div>
                        </div>

                        {/* Color de Fondo de la Tarjeta */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <label className="text-[10px] font-bold text-slate-700 block">
                            Color de Fondo de la Tarjeta:
                          </label>

                          {/* Presets */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { hex: '#f4f8f5', label: 'Sage' },
                              { hex: '#fbf6ee', label: 'Crema' },
                              { hex: '#f1f5f9', label: 'Sky' },
                              { hex: '#fef3f2', label: 'Rose' },
                              { hex: '#ecfdf5', label: 'Mint' },
                              { hex: '#faf5ff', label: 'Lavender' },
                              { hex: '#ffffff', label: 'Blanco' },
                              { hex: '#1e293b', label: 'Slate' }
                            ].map(p => (
                              <button
                                key={p.hex}
                                type="button"
                                onClick={() => handleUpdateSingleCard(card.id, { bgColor: p.hex })}
                                style={{ backgroundColor: p.hex }}
                                className={`w-6 h-6 rounded-lg border transition-all cursor-pointer ${
                                  card.bgColor === p.hex
                                    ? 'border-forest ring-2 ring-forest/30 scale-110 shadow-3xs'
                                    : 'border-slate-300 hover:scale-105'
                                }`}
                                title={p.label}
                              />
                            ))}
                          </div>

                          {/* Pickers Claro & Oscuro */}
                          <div className="flex items-center gap-3 pt-1">
                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-3xs">
                              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Modo Claro" />
                              <input
                                type="color"
                                value={card.bgColor?.startsWith('#') && card.bgColor.length === 7 ? card.bgColor : '#f4f8f5'}
                                onChange={(e) => handleUpdateSingleCard(card.id, { bgColor: e.target.value })}
                                className="w-5 h-5 rounded border border-slate-300 cursor-pointer p-0 appearance-none bg-transparent"
                              />
                              <input
                                type="text"
                                value={card.bgColor || ''}
                                onChange={(e) => handleUpdateSingleCard(card.id, { bgColor: e.target.value })}
                                placeholder="#f4f8f5"
                                className="w-16 text-[10px] font-mono uppercase bg-transparent border-0 focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2 py-1 rounded-lg border border-slate-800 shadow-3xs">
                              <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Modo Oscuro" />
                              <input
                                type="color"
                                value={card.bgColorDark?.startsWith('#') && card.bgColorDark.length === 7 ? card.bgColorDark : '#14251c'}
                                onChange={(e) => handleUpdateSingleCard(card.id, { bgColorDark: e.target.value })}
                                className="w-5 h-5 rounded border border-slate-600 cursor-pointer p-0 appearance-none bg-transparent"
                              />
                              <input
                                type="text"
                                value={card.bgColorDark || ''}
                                onChange={(e) => handleUpdateSingleCard(card.id, { bgColorDark: e.target.value })}
                                placeholder="#14251c"
                                className="w-16 text-[10px] font-mono uppercase text-slate-200 bg-transparent border-0 focus:outline-none"
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
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">3</div>
            <h4 className="font-bold text-forest text-xs sm:text-sm">Datos de Ubicación & Mapa</h4>
          </div>

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

      {/* 5. DANGER ZONE / ACTIONS */}
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
  );
};
