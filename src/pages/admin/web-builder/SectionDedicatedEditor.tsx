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
  Moon
} from 'lucide-react';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { ALL_SUPPORTED_LANGUAGES, getLanguageByCode } from './languages';

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
        <div className="flex items-center justify-between">
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

          <button
            type="button"
            onClick={() => onUpdateSection({ showInMenu: section.showInMenu === false ? true : false })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              section.showInMenu !== false
                ? 'bg-forest text-white shadow-3xs'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <span>{section.showInMenu !== false ? 'Visible en Menú' : 'Oculto en Menú'}</span>
          </button>
        </div>

        {section.showInMenu !== false && (
          <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
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
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">3</div>
          <h4 className="font-bold text-forest text-xs sm:text-sm">
            Botón de Acción CTA ({currentLangObj.name})
          </h4>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">
              Texto del Botón ({currentLangObj.code.toUpperCase()}):
            </label>
            <input
              type="text"
              value={getLangValue('ctaText')}
              onChange={(e) => setLangValue('ctaText', e.target.value)}
              placeholder={`Texto del botón en ${currentLangObj.name}`}
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
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">3</div>
            <h4 className="font-bold text-forest text-xs sm:text-sm">Configuración de Tarjetas de Pilares</h4>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 block">
              Texto Destacado de Misión ({currentLangObj.name}):
            </label>
            <textarea
              value={getConfigLangValue('missionText', 'En nuestra escuela nos comprometemos a entender la infancia para ayudar a los niños a desarrollar la grandeza de sus potencialidades.')}
              onChange={(e) => setConfigLangValue('missionText', e.target.value)}
              rows={3}
              placeholder={`Texto de misión en ${currentLangObj.name}...`}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
            <FieldTypographyAndColorBar
              fontValue={section.config?.mission_font}
              onChangeFont={(val) => handleConfigChange('mission_font', val)}
              colorLight={section.config?.mission_color}
              onChangeColorLight={(val) => handleConfigChange('mission_color', val)}
              colorDark={section.config?.mission_color_dark}
              onChangeColorDark={(val) => handleConfigChange('mission_color_dark', val)}
              defaultColorLight="#1b3b2b"
              defaultColorDark="#ffffff"
            />
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
