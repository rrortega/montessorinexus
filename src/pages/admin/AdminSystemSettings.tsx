import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  BrainCircuit,
  Bot,
  Sparkles,
  Key,
  ShieldCheck,
  Cpu,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Webhook,
  Activity,
  Layers,
  Check,
  Mail,
  Send,
  HardDrive,
  Cloud,
  Database,
  FolderCheck,
  Folder,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  ScanEye,
  ListFilter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  X
} from 'lucide-react';
import { useSiteSettings } from '@/context/SettingsContext';
import {
  fetchAiModels,
  testSmtpConnection,
  testStorageConnection,
  testStorageWebhook,
  testCalendarWebhook
} from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { findModelPricing, isModelCompatibleWithType, ModelPricingEntry } from '@/lib/ai-model-pricing';

type SystemTab = 'ai' | 'email' | 'storage' | 'webhooks';

interface AiPreset {
  name: string;
  baseUrl: string;
  defaultVision: string;
  defaultText: string;
  defaultImage: string;
}

const AI_PRESETS: AiPreset[] = [
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultVision: 'gpt-4o-mini',
    defaultText: 'gpt-4o-mini',
    defaultImage: 'dall-e-3'
  },
  {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultVision: 'gemini-2.0-flash',
    defaultText: 'gemini-2.0-flash',
    defaultImage: 'imagen-3.0-generate-002'
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultVision: 'deepseek-chat',
    defaultText: 'deepseek-chat',
    defaultImage: 'deepseek-chat'
  },
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultVision: 'llama-3.2-11b-vision-preview',
    defaultText: 'llama-3.3-70b-versatile',
    defaultImage: ''
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultVision: 'openai/gpt-4o-mini',
    defaultText: 'openai/gpt-4o-mini',
    defaultImage: ''
  },
  {
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    defaultVision: 'llava',
    defaultText: 'llama3.2',
    defaultImage: ''
  },
  {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultVision: '',
    defaultText: 'claude-3-5-sonnet',
    defaultImage: ''
  }
];

const renderPricingBadge = (pricing: ModelPricingEntry | null, isSelected: boolean = false) => {
  if (!pricing) {
    return (
      <span
        title="Modelo personalizado o tarifa no catalogada en la tabla oficial"
        className={`px-1.5 py-0.5 rounded text-[9.5px] font-sans shrink-0 flex items-center gap-1 ${
          isSelected
            ? 'bg-white/20 text-white border border-white/30'
            : 'bg-slate-100/90 text-slate-500 border border-slate-200'
        }`}
      >
        <span className="opacity-75 text-[9px] font-semibold">?</span>
        <span className="opacity-30">·</span>
        <span className="opacity-75 text-[9px]">In:</span>
        <strong className={isSelected ? 'text-white' : 'text-slate-600 font-bold'}>?</strong>
        <span className="opacity-30">|</span>
        <span className="opacity-75 text-[9px]">Out:</span>
        <strong className={isSelected ? 'text-white' : 'text-slate-600 font-bold'}>?</strong>
      </span>
    );
  }

  if (pricing.type === 'image') {
    const formattedPrice = pricing.pricePerUnit !== undefined ? `$${pricing.pricePerUnit.toFixed(3)}/${pricing.priceUnit || 'img'}` : '$0.030/img';
    return (
      <span
        title={`Coste oficial por imagen generada: ${formattedPrice} (${pricing.provider})`}
        className={`px-1.5 py-0.5 rounded text-[9.5px] font-sans font-semibold shrink-0 ${
          isSelected
            ? 'bg-white/20 text-white border border-white/30'
            : 'bg-purple-50 text-purple-700 border border-purple-200/60'
        }`}
      >
        {formattedPrice}
      </span>
    );
  }

  const inFormatted = pricing.inputPricePerMillion !== undefined ? `$${pricing.inputPricePerMillion.toFixed(2)}` : '$0.00';
  const outFormatted = pricing.outputPricePerMillion !== undefined ? `$${pricing.outputPricePerMillion.toFixed(2)}` : '$0.00';

  return (
    <span
      title={`Ventana: ${pricing.contextLabel || '128K'} | Coste oficial por 1M tokens: Entrada ${inFormatted} / Salida ${outFormatted} (${pricing.provider})`}
      className={`px-1.5 py-0.5 rounded text-[9.5px] font-sans shrink-0 flex items-center gap-1 ${
        isSelected
          ? 'bg-white/20 text-white border border-white/30'
          : 'bg-slate-100/90 text-slate-600 border border-slate-200'
      }`}
    >
      <span className="opacity-75 text-[9px] font-semibold">{pricing.contextLabel || '128K'}</span>
      <span className="opacity-30">·</span>
      <span className="opacity-75 text-[9px]">In:</span>
      <strong className={isSelected ? 'text-white' : 'text-slate-800 font-bold'}>{inFormatted}</strong>
      <span className="opacity-30">|</span>
      <span className="opacity-75 text-[9px]">Out:</span>
      <strong className={isSelected ? 'text-white' : 'text-slate-800 font-bold'}>{outFormatted}</strong>
    </span>
  );
};

interface SearchableProviderSelectProps {
  selectedPresetName: string;
  onSelectPreset: (preset: AiPreset) => void;
  onSelectCustom: () => void;
  presets: AiPreset[];
}

const SearchableProviderSelect: React.FC<SearchableProviderSelectProps> = ({
  selectedPresetName,
  onSelectPreset,
  onSelectCustom,
  presets
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPresets = presets.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      p.baseUrl.toLowerCase().includes(search.toLowerCase().trim())
  );

  const isCustomMatch =
    'proveedor personalizado custom manual'.toLowerCase().includes(search.toLowerCase().trim());

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const width = Math.max(rect.width, 320);
    let left = rect.left;
    if (left + width > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - width - 16);
    }

    setDropdownPos({
      top: openUpwards ? Math.max(8, rect.top - dropdownHeight - 6) : rect.bottom + 6,
      left: Math.max(8, left),
      width: Math.min(width, window.innerWidth - 16)
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, updatePosition]);

  const activePreset = presets.find((p) => p.name === selectedPresetName);
  const isCustom = selectedPresetName === 'custom' || !activePreset;

  return (
    <>
      <div className="relative w-full">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }}
          className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs flex items-center justify-between gap-2 text-left transition-all cursor-pointer shadow-2xs ${
            isOpen
              ? 'border-forest ring-2 ring-forest/20'
              : 'border-forest/20 hover:border-forest/40'
          }`}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <div className="p-1.5 rounded-lg bg-forest/5 text-forest shrink-0">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="font-bold text-forest block truncate">
                {isCustom ? 'Proveedor personalizado / Custom' : activePreset.name}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono block truncate">
                {isCustom ? 'Endpoint manual' : activePreset.baseUrl}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground ml-auto">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-forest' : ''}`} />
          </div>
        </button>
      </div>

      {/* Floating Dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 2147483647
            }}
            className="bg-white border border-forest/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Search Header */}
            <div className="p-2.5 border-b border-forest/10 bg-slate-50/95 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proveedor o endpoint..."
                className="w-full bg-transparent border-none text-xs focus:outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 text-muted-foreground hover:text-forest rounded-md cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Presets List */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 text-xs divide-y divide-slate-100/80">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPresetName === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-forest text-white'
                        : 'hover:bg-forest/5 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`font-bold ${isSelected ? 'text-white' : 'text-forest'}`}>
                        {preset.name}
                      </p>
                      <p className={`text-[10.5px] font-mono truncate ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {preset.baseUrl}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}

              {/* Custom Option */}
              {(isCustomMatch || filteredPresets.length === 0) && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustom();
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isCustom
                      ? 'bg-forest text-white'
                      : 'hover:bg-forest/5 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`font-bold ${isCustom ? 'text-white' : 'text-forest'}`}>
                      Proveedor personalizado / Manual
                    </p>
                    <p className={`text-[10.5px] ${isCustom ? 'text-white/80' : 'text-muted-foreground'}`}>
                      Configurar URL base y modelos manualmente
                    </p>
                  </div>
                  {isCustom && <Check className="w-4 h-4 text-white shrink-0" />}
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

interface SearchableModelSelectProps {
  value: string;
  onChange: (val: string) => void;
  models: string[];
  placeholder?: string;
  fallbackPresets?: string[];
  modelType?: 'vision' | 'text' | 'image';
}

const SearchableModelSelect: React.FC<SearchableModelSelectProps> = ({
  value,
  onChange,
  models,
  placeholder = 'Seleccionar o escribir modelo...',
  fallbackPresets = [],
  modelType
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine available models with fallback presets, filter duplicates, and filter by functional type compatibility
  const allRawModels = Array.from(new Set([...(models || []), ...fallbackPresets])).filter(Boolean);
  const compatibleModels = allRawModels.filter((m) => isModelCompatibleWithType(m, modelType));

  // Always keep current value visible in options if set
  if (value && !compatibleModels.includes(value)) {
    compatibleModels.unshift(value);
  }

  const filteredModels = compatibleModels.filter((m) =>
    m.toLowerCase().includes(search.toLowerCase().trim())
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 330;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const width = Math.max(rect.width, 340);
    let left = rect.left;
    if (left + width > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - width - 16);
    }

    setDropdownPos({
      top: openUpwards ? Math.max(8, rect.top - dropdownHeight - 6) : rect.bottom + 6,
      left: Math.max(8, left),
      width: Math.min(width, window.innerWidth - 16)
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, updatePosition]);

  const handleSelect = (modelName: string) => {
    onChange(modelName);
    setIsOpen(false);
    setSearch('');
  };

  const getModelBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (/vision|vl|llava|4o|flash/i.test(lower)) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">Vision</span>;
    }
    if (/dall-e|imagen|flux|image/i.test(lower)) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">Image</span>;
    }
    if (/o1|o3|reason/i.test(lower)) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">Reason</span>;
    }
    if (/flash|turbo|mini|speed/i.test(lower)) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">Fast</span>;
    }
    return null;
  };

  const isCustomInput =
    search.trim().length > 0 &&
    !allModels.some((m) => m.toLowerCase() === search.trim().toLowerCase());

  const selectedPricing = value ? findModelPricing(value) : null;

  return (
    <>
      <div className="relative w-full">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }}
          className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono flex items-center justify-between gap-2 text-left transition-all cursor-pointer shadow-2xs ${
            isOpen
              ? 'border-forest ring-2 ring-forest/20'
              : 'border-forest/20 hover:border-forest/40'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate min-w-0 flex-wrap sm:flex-nowrap">
            <span className="font-semibold text-forest truncate block">
              {value || <span className="text-muted-foreground font-sans font-normal">{placeholder}</span>}
            </span>
            {value && getModelBadge(value)}
            {selectedPricing && renderPricingBadge(selectedPricing, false)}
          </div>
          <div className="flex items-center gap-1 shrink-0 text-muted-foreground ml-auto">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-forest' : ''}`} />
          </div>
        </button>
      </div>

      {/* Floating Portal Dropdown (Renders to body to escape all parent containers and accordions) */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 2147483647
            }}
            className="bg-white border border-forest/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Sticky Search Header */}
            <div className="p-2.5 border-b border-forest/10 bg-slate-50/95 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar modelo o escribir personalizado..."
                className="w-full bg-transparent border-none text-xs font-mono focus:outline-none placeholder:text-muted-foreground placeholder:font-sans"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 text-muted-foreground hover:text-forest rounded-md cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List of Models (Two-line Layout) */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 text-xs font-mono divide-y divide-slate-100/80">
              {/* Direct Custom Value Option if user typed something new */}
              {isCustomInput && (
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 transition-colors cursor-pointer"
                >
                  <span className="truncate font-bold">
                    Usar: <span className="text-emerald-700 underline">{search.trim()}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 shrink-0">
                    Manual
                  </span>
                </button>
              )}

              {filteredModels.map((m) => {
                const isSelected = m === value;
                const pricing = findModelPricing(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelect(m)}
                    className={`group w-full px-3 py-2.5 rounded-xl text-left flex flex-col gap-1.5 transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-forest text-white shadow-xs border border-forest'
                        : 'border border-transparent bg-slate-50/40 hover:bg-emerald-50/90 hover:border-emerald-200/80 hover:shadow-xs text-slate-800'
                    }`}
                  >
                    {/* Top Line: Model name + Capability Badges + Selection Check */}
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <span
                          className={`font-mono font-bold text-xs truncate transition-colors ${
                            isSelected ? 'text-white' : 'text-forest group-hover:text-emerald-950'
                          }`}
                        >
                          {m}
                        </span>
                        {!isSelected && getModelBadge(m)}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-300 shrink-0" />}
                    </div>

                    {/* Bottom Line: Context Window & Cost Breakdown */}
                    <div
                      className={`flex items-center justify-between gap-2 text-[10.5px] font-sans pt-1 border-t transition-colors ${
                        isSelected
                          ? 'border-white/15 text-emerald-100'
                          : 'border-slate-200/60 group-hover:border-emerald-200/60 text-muted-foreground group-hover:text-emerald-900/80'
                      }`}
                    >
                      {pricing ? (
                        pricing.type === 'tokens' ? (
                          <>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="opacity-75">Ventana:</span>
                              <span
                                className={`font-bold px-1.5 py-0.2 rounded text-[9.5px] transition-colors ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200/60 group-hover:bg-emerald-100/80 text-slate-700 group-hover:text-emerald-900 font-mono'
                                }`}
                              >
                                {pricing.contextLabel || '128K'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                              <span className="opacity-75">In:</span>
                              <strong className={isSelected ? 'text-white' : 'text-slate-800 group-hover:text-emerald-950 font-bold'}>
                                {pricing.inputPricePerMillion !== undefined ? `$${pricing.inputPricePerMillion.toFixed(2)}` : '$0.00'}
                              </strong>
                              <span className="opacity-30">|</span>
                              <span className="opacity-75">Out:</span>
                              <strong className={isSelected ? 'text-white' : 'text-slate-800 group-hover:text-emerald-950 font-bold'}>
                                {pricing.outputPricePerMillion !== undefined ? `$${pricing.outputPricePerMillion.toFixed(2)}` : '$0.00'}
                              </strong>
                              <span className="opacity-60 text-[8.5px]">/1M</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="opacity-75">Generación de imágenes</span>
                            <strong className={isSelected ? 'text-white' : 'text-purple-700 group-hover:text-purple-800 font-semibold'}>
                              {pricing.pricePerUnit !== undefined
                                ? `$${pricing.pricePerUnit.toFixed(3)}/${pricing.priceUnit || 'img'}`
                                : '$0.030/img'}
                            </strong>
                          </div>
                        )
                      ) : (
                        <>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="opacity-75">Ventana:</span>
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded text-[9.5px] transition-colors ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-200/60 group-hover:bg-emerald-100/80 text-slate-600 group-hover:text-emerald-900 font-mono'
                              }`}
                            >
                              ?
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] shrink-0 text-slate-500">
                            <span className="opacity-75">In:</span>
                            <strong className={isSelected ? 'text-white' : 'text-slate-600 group-hover:text-emerald-950 font-bold'}>
                              ?
                            </strong>
                            <span className="opacity-30">|</span>
                            <span className="opacity-75">Out:</span>
                            <strong className={isSelected ? 'text-white' : 'text-slate-600 group-hover:text-emerald-950 font-bold'}>
                              ?
                            </strong>
                            <span className="opacity-60 text-[8.5px]">/1M</span>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredModels.length === 0 && !isCustomInput && (
                <div className="p-4 text-center text-xs text-muted-foreground font-sans">
                  No se encontraron modelos coincidentes.
                </div>
              )}
            </div>

            {/* Footer Info / Count & Legend */}
            <div className="p-2.5 border-t border-forest/10 bg-slate-50 text-[10px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-3 font-sans">
              <span>
                <strong>{filteredModels.length}</strong> modelos listados
              </span>
              <span className="text-slate-500 font-medium">Tarifas estimadas en USD por 1M tokens</span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export const AdminSystemSettings: React.FC = () => {
  const { role, user } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  const { settings, updateSettings } = useSiteSettings();
  const [formData, setFormData] = useState<Record<string, any>>(settings);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // AI Provider & Dynamic Models State
  const [fetchingModels, setFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // SMTP Testing State
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Storage Testing & Visibility State
  const [testingStorage, setTestingStorage] = useState(false);
  const [showS3Secret, setShowS3Secret] = useState(false);
  const [testingStorageWebhook, setTestingStorageWebhook] = useState(false);

  // Calendar Webhook State
  const [testingCalendarWebhook, setTestingCalendarWebhook] = useState(false);

  // Webhooks Accordion State (Only one panel expanded at a time)
  const [openAccordion, setOpenAccordion] = useState<string | null>('storage');

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  const activeTab = (searchParams.get('tab') as SystemTab) || 'ai';

  // Horizontal Tabs Scroll Navigation State
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabsScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkTabsScroll();
    const el = tabsContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkTabsScroll);
    window.addEventListener('resize', checkTabsScroll);
    return () => {
      el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [checkTabsScroll]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  useEffect(() => {
    setFormData(settings);
    if (settings.ai_api_key || settings.openai_api_key) {
      setModelsLoaded(true);
    }
  }, [settings]);

  const handleTabChange = (tab: SystemTab) => {
    setSearchParams({ tab });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (
      field === 'ai_base_url' ||
      field === 'openai_base_url' ||
      field === 'ai_api_key' ||
      field === 'openai_api_key'
    ) {
      setModelsLoaded(false);
      setAvailableModels([]);
    }
  };

  const handleApplyPreset = (preset: AiPreset) => {
    setAvailableModels([]);
    setModelsLoaded(false);
    setFormData((prev) => ({
      ...prev,
      ai_base_url: preset.baseUrl,
      openai_base_url: preset.baseUrl,
      ai_model_vision: preset.defaultVision || '',
      openai_model: preset.defaultVision || '',
      ai_model_text: preset.defaultText || '',
      ai_model_image: preset.defaultImage || ''
    }));
    toast.info(`Proveedor seleccionado: ${preset.name}. Haz clic en "Conectar y Cargar Modelos" para validar.`);
  };

  const handleFetchModels = async () => {
    const apiKey = (formData.ai_api_key || formData.openai_api_key || '').trim();
    const baseUrl = (formData.ai_base_url || formData.openai_base_url || 'https://api.openai.com/v1').trim();

    if (!apiKey) {
      toast.error('Ingresa la API Key del proveedor antes de conectar.');
      return;
    }

    setFetchingModels(true);
    try {
      const res = await fetchAiModels({ baseUrl, apiKey });
      const newModels = res.models || [];
      setAvailableModels(newModels);
      setModelsLoaded(true);
      toast.success(`¡Conexión exitosa con el proveedor! Se cargaron ${res.count} modelos.`);

      // Sincronizar o mantener selecciones si existen
      setFormData((prev) => {
        const next = { ...prev };

        const currentVision = (next.ai_model_vision || next.openai_model || '').trim();
        if (currentVision && newModels.length > 0 && !newModels.includes(currentVision)) {
          const matchVision = newModels.find(m => /gpt-4o|gemini-2\.0-flash|vision|llava/i.test(m)) || newModels[0];
          next.ai_model_vision = matchVision;
          next.openai_model = matchVision;
        } else if (!currentVision && newModels.length > 0) {
          const matchVision = newModels.find(m => /gpt-4o|gemini-2\.0-flash|vision|llava/i.test(m)) || newModels[0];
          next.ai_model_vision = matchVision;
          next.openai_model = matchVision;
        }

        const currentText = (next.ai_model_text || '').trim();
        if (currentText && newModels.length > 0 && !newModels.includes(currentText)) {
          const matchText = newModels.find(m => /gpt-4o-mini|gemini-2\.0-flash|deepseek-chat|llama-3\.3|claude/i.test(m)) || newModels[0];
          next.ai_model_text = matchText;
        } else if (!currentText && newModels.length > 0) {
          const matchText = newModels.find(m => /gpt-4o-mini|gemini-2\.0-flash|deepseek-chat|llama-3\.3|claude/i.test(m)) || newModels[0];
          next.ai_model_text = matchText;
        }

        return next;
      });
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión con el proveedor AI');
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isOwnerOrAdmin) return;
    setSaving(true);
    try {
      // Sync duplicate compatibility keys and default auto OCR and normalization
      const dataToSave = {
        ...formData,
        openai_api_key: formData.ai_api_key || formData.openai_api_key || '',
        openai_model: formData.ai_model_vision || formData.openai_model || 'gpt-4o-mini',
        openai_base_url: formData.ai_base_url || formData.openai_base_url || 'https://api.openai.com/v1',
        ai_auto_ocr: 'true',
        ai_normalize_data: 'true'
      };
      await updateSettings(dataToSave);
      toast.success('Configuración del sistema guardada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar configuración del sistema');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmail || !testEmail.trim()) {
      toast.error('Ingresa un correo electrónico de destino para la prueba');
      return;
    }
    if (!formData.smtp_host || !formData.smtp_user || !formData.smtp_pass) {
      toast.error('Debes completar el Host SMTP, Usuario y Contraseña antes de realizar la prueba');
      return;
    }

    setTestingSmtp(true);
    try {
      const res = await testSmtpConnection({
        host: formData.smtp_host,
        port: formData.smtp_port || '587',
        user: formData.smtp_user,
        pass: formData.smtp_pass,
        secure: formData.smtp_secure === 'true' || formData.smtp_port === '465',
        fromName: formData.smtp_from_name || formData.schoolName || 'Ceiba Roots',
        fromEmail: formData.smtp_from_email || formData.smtp_user,
        testEmail: testEmail.trim()
      });
      toast.success(res.message || 'Prueba de conexión SMTP exitosa');
    } catch (e: any) {
      toast.error(e.message || 'Fallo al probar la conexión SMTP');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTestStorage = async () => {
    setTestingStorage(true);
    try {
      const res = await testStorageConnection({
        driver: formData.storage_driver || 'local',
        localRoot: formData.storage_local_root,
        s3Endpoint: formData.s3_endpoint,
        s3Region: formData.s3_region || 'us-east-1',
        s3Bucket: formData.s3_bucket,
        s3AccessKeyId: formData.s3_access_key_id,
        s3SecretAccessKey: formData.s3_secret_access_key,
        s3ForcePathStyle: formData.s3_force_path_style === 'true' || formData.s3_force_path_style === true
      });
      toast.success(res.message || 'Prueba de almacenamiento exitosa');
    } catch (e: any) {
      toast.error(e.message || 'Error al probar conexión de almacenamiento');
    } finally {
      setTestingStorage(false);
    }
  };

  const handleTestStorageWebhook = async () => {
    if (!formData.storage_webhook_url || !formData.storage_webhook_url.trim()) {
      toast.error('Ingresa la URL del webhook de almacenamiento antes de realizar la prueba');
      return;
    }
    setTestingStorageWebhook(true);
    try {
      const res = await testStorageWebhook({
        webhookUrl: formData.storage_webhook_url.trim(),
        secretToken: formData.storage_webhook_secret,
        includePayload: formData.storage_webhook_include_payload === 'true' || formData.storage_webhook_include_payload === true
      });
      toast.success(res.message || 'Webhook de prueba entregado exitosamente');
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar webhook de prueba');
    } finally {
      setTestingStorageWebhook(false);
    }
  };

  const handleTestCalendarWebhook = async () => {
    if (!formData.calendar_webhook_url || !formData.calendar_webhook_url.trim()) {
      toast.error('Ingresa la URL del webhook de calendario antes de realizar la prueba');
      return;
    }
    setTestingCalendarWebhook(true);
    try {
      const res = await testCalendarWebhook({
        webhookUrl: formData.calendar_webhook_url.trim(),
        secretToken: formData.calendar_webhook_secret,
        eventType: 'calendar.event_created'
      });
      toast.success(res.message || 'Webhook de prueba de calendario entregado exitosamente');
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar webhook de calendario');
    } finally {
      setTestingCalendarWebhook(false);
    }
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300 pb-16">
      {/* FULL-WIDTH HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-xs">
                <BrainCircuit className="w-5 h-5 text-emerald-300" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight">
                Configuración General del Sistema
              </h1>
            </div>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Administra los motores de Inteligencia Artificial (OpenAI Vision & OCR), servidor de correo SMTP, almacenamiento privado y biometría.
            </p>
          </div>

          {isOwnerOrAdmin && (
            <div className="hidden md:flex items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={saving}
                className="px-5 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 text-forest" />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOP NAVIGATION TABS WITH HORIZONTAL HANDLERS */}
      <div className="relative flex items-center border-b border-forest/10 pb-px">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          disabled={!canScrollLeft}
          className={`shrink-0 mr-1 p-2 rounded-xl border transition-all z-10 cursor-pointer ${
            canScrollLeft
              ? 'bg-white hover:bg-forest/5 text-forest border-forest/20 shadow-xs opacity-100 hover:scale-105 active:scale-95'
              : 'bg-slate-50 text-slate-300 border-slate-200/60 opacity-40 cursor-not-allowed'
          }`}
          title="Desplazar pestañas hacia la izquierda"
          aria-label="Desplazar a la izquierda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Tabs Scrollable Viewport */}
        <div
          ref={tabsContainerRef}
          className="flex-1 -mx-2 sm:mx-0 px-2 sm:px-0 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap active:cursor-grab select-none touch-pan-x"
        >
          <button
            type="button"
            onClick={() => handleTabChange('ai')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-none sm:rounded-t-2xl transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? 'border-forest text-forest bg-transparent font-bold'
                : 'border-transparent text-muted-foreground hover:text-forest'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Inteligencia Artificial (OpenAI & OCR)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('email')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-none sm:rounded-t-2xl transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'email'
                ? 'border-forest text-forest bg-transparent font-bold'
                : 'border-transparent text-muted-foreground hover:text-forest'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Servidor de Correo (SMTP)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('storage')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-none sm:rounded-t-2xl transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'storage'
                ? 'border-forest text-forest bg-transparent font-bold'
                : 'border-transparent text-muted-foreground hover:text-forest'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Almacenamiento (S3 / Local)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('webhooks')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-none sm:rounded-t-2xl transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'webhooks'
                ? 'border-forest text-forest bg-transparent font-bold'
                : 'border-transparent text-muted-foreground hover:text-forest'
            }`}
          >
            <Webhook className="w-4 h-4" />
            <span>Webhooks & Integraciones</span>
          </button>
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scrollTabs('right')}
          disabled={!canScrollRight}
          className={`shrink-0 ml-1 p-2 rounded-xl border transition-all z-10 cursor-pointer ${
            canScrollRight
              ? 'bg-white hover:bg-forest/5 text-forest border-forest/20 shadow-xs opacity-100 hover:scale-105 active:scale-95'
              : 'bg-slate-50 text-slate-300 border-slate-200/60 opacity-40 cursor-not-allowed'
          }`}
          title="Desplazar pestañas hacia la derecha"
          aria-label="Desplazar a la derecha"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* TAB CONTENT FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: INTELIGENCIA ARTIFICIAL (OPENAI COMPATIBLE & OCR) */}
        {/* ========================================================================= */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* AI Provider & API Credentials Card */}
            <div className="bg-white rounded-2xl border border-forest/15 shadow-xs">
              <div className="p-4 sm:p-5 border-b border-forest/10 bg-forest/[0.02] rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-forest text-white">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-forest font-heading">
                      Proveedor de Inteligencia Artificial (OpenAI Compatible)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Conecta cualquier proveedor compatible con la API estándar de OpenAI (OpenAI, Google Gemini, DeepSeek, Groq, OpenRouter u Ollama local).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-center">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Multimodal & OCR Ready</span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {/* Provider Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-forest">
                    Proveedor de Inteligencia Artificial:
                  </label>
                  <SearchableProviderSelect
                    selectedPresetName={
                      (AI_PRESETS.find(p => p.baseUrl === (formData.ai_base_url || formData.openai_base_url || '').trim())?.name) || 'custom'
                    }
                    onSelectPreset={(preset) => handleApplyPreset(preset)}
                    onSelectCustom={() => {
                      setFormData((prev) => ({
                        ...prev,
                        ai_base_url: '',
                        openai_base_url: '',
                        ai_model_vision: '',
                        openai_model: '',
                        ai_model_text: '',
                        ai_model_image: ''
                      }));
                    }}
                    presets={AI_PRESETS}
                  />
                  {((formData.ai_base_url || formData.openai_base_url || '').trim() === '' ||
                    !AI_PRESETS.some(p => p.baseUrl === (formData.ai_base_url || formData.openai_base_url || '').trim())) && (
                    <div className="space-y-1.5 mt-2">
                      <label className="block text-xs font-bold text-forest">
                        Compatibilidad:
                      </label>
                      <select
                        className="w-full p-2.5 border border-forest/20 rounded-xl bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                        value={
                          (formData.ai_base_url || formData.openai_base_url || '').includes('anthropic') ? 'Anthropic' : 'OpenAI'
                        }
                        onChange={(e) => {
                          const compat = e.target.value;
                          const url = compat === 'Anthropic' ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1';
                          handleInputChange('ai_base_url', url);
                          handleInputChange('openai_base_url', url);
                        }}
                      >
                        <option value="OpenAI">OpenAI</option>
                        <option value="Anthropic">Anthropic</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Endpoint URL & API Key Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Base URL Endpoint */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-forest">
                      Endpoint Base URL (API Compatible) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://api.openai.com/v1"
                        value={formData.ai_base_url || formData.openai_base_url || 'https://api.openai.com/v1'}
                        onChange={(e) => {
                          handleInputChange('ai_base_url', e.target.value);
                          handleInputChange('openai_base_url', e.target.value);
                        }}
                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-forest/20 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                      <Globe className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Por defecto: <code className="text-forest font-mono">https://api.openai.com/v1</code>
                    </p>
                  </div>

                  {/* API Key */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-forest">
                      API Key de Acceso <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="sk-proj-... / AIzaSy... / dsk-..."
                        value={formData.ai_api_key || formData.openai_api_key || ''}
                        onChange={(e) => {
                          handleInputChange('ai_api_key', e.target.value);
                          handleInputChange('openai_api_key', e.target.value);
                        }}
                        className="w-full pl-3 pr-24 py-2.5 bg-slate-50 border border-forest/20 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title={showApiKey ? 'Ocultar clave' : 'Mostrar clave'}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Clave de autenticación del proveedor (Bearer Token).
                    </p>
                  </div>
                </div>

                {/* Conditional UI: Connect & Load Models vs Model Selectors */}
                {!modelsLoaded ? (
                  /* Not Connected State Card */
                  <div className="p-6 sm:p-8 rounded-2xl bg-forest/[0.03] border-2 border-dashed border-forest/20 flex flex-col items-center justify-center text-center gap-3.5 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-forest/10 text-forest shadow-xs">
                      <BrainCircuit className="w-6 h-6 text-forest" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h4 className="font-bold text-sm text-forest font-heading">
                        Conectar y Cargar Modelos del Proveedor
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Verifica las credenciales en tiempo real y descarga la lista de modelos disponibles en este proveedor para habilitar los selectores de visión OCR, chat e imágenes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFetchModels}
                      disabled={fetchingModels}
                      className="mt-2 px-6 py-2.5 bg-forest text-white hover:bg-forest/90 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <RefreshCw className={`w-4 h-4 text-white ${fetchingModels ? 'animate-spin' : ''}`} />
                      <span>{fetchingModels ? 'Verificando y Conectando...' : 'Conectar y Cargar Modelos'}</span>
                    </button>
                  </div>
                ) : (
                  /* Connected State: Status Header + 3 Model Columns */
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Connected Status Header */}
                    <div className="p-4 rounded-xl bg-forest/[0.04] border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-forest flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Proveedor Conectado con Éxito</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            {availableModels.length > 0 ? `${availableModels.length} modelos detectados` : 'Configuración activa'}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block">
                          Selecciona los modelos que se utilizarán para visión, chat e imágenes entre los ofrecidos por el proveedor.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleFetchModels}
                        disabled={fetchingModels}
                        className="px-3.5 py-1.5 bg-white text-forest hover:bg-forest/5 border border-forest/25 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 cursor-pointer self-start sm:self-center shrink-0 hover:scale-102 active:scale-98"
                        title="Volver a sincronizar modelos del endpoint"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-forest ${fetchingModels ? 'animate-spin' : ''}`} />
                        <span>{fetchingModels ? 'Sincronizando...' : 'Recargar Modelos'}</span>
                      </button>
                    </div>

                    {/* 3 Model Searchable Combobox Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      {/* 1. Vision / OCR Model */}
                      <div className="space-y-1.5 p-4 rounded-xl border border-forest/15 bg-slate-50/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-forest font-bold text-xs pb-1 border-b border-forest/10">
                            <ScanEye className="w-4 h-4 text-emerald-600" />
                            <span>Modelo de Visión / OCR</span>
                          </div>
                          <label className="block text-[11px] text-muted-foreground mt-1 mb-2">
                            Para escaneo de identificaciones (INE/Pasaporte) y cotejo facial.
                          </label>
                        </div>
                        <SearchableModelSelect
                          value={formData.ai_model_vision || formData.openai_model || 'gpt-4o-mini'}
                          onChange={(val) => {
                            handleInputChange('ai_model_vision', val);
                            handleInputChange('openai_model', val);
                          }}
                          models={availableModels}
                          placeholder="Seleccionar modelo de visión..."
                          modelType="vision"
                          fallbackPresets={[
                            'gpt-4o-mini',
                            'gpt-4o',
                            'gemini-2.0-flash',
                            'gemini-1.5-flash',
                            'gemini-1.5-pro',
                            'llama-3.2-11b-vision-preview',
                            'llava'
                          ]}
                        />
                      </div>

                      {/* 2. Text / Chat Generation Model */}
                      <div className="space-y-1.5 p-4 rounded-xl border border-forest/15 bg-slate-50/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-forest font-bold text-xs pb-1 border-b border-forest/10">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span>Modelo de Generación de Texto</span>
                          </div>
                          <label className="block text-[11px] text-muted-foreground mt-1 mb-2">
                            Para respuestas automáticas, análisis y asistentes conversacionales.
                          </label>
                        </div>
                        <SearchableModelSelect
                          value={formData.ai_model_text || 'gpt-4o-mini'}
                          onChange={(val) => handleInputChange('ai_model_text', val)}
                          models={availableModels}
                          placeholder="Seleccionar modelo de texto..."
                          modelType="text"
                          fallbackPresets={[
                            'gpt-4o-mini',
                            'gpt-4o',
                            'gemini-2.0-flash',
                            'deepseek-chat',
                            'deepseek-reasoner',
                            'llama-3.3-70b-versatile',
                            'o1-mini',
                            'o3-mini'
                          ]}
                        />
                      </div>

                      {/* 3. Image Generation Model */}
                      <div className="space-y-1.5 p-4 rounded-xl border border-forest/15 bg-slate-50/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-forest font-bold text-xs pb-1 border-b border-forest/10">
                            <ImageIcon className="w-4 h-4 text-purple-600" />
                            <span>Modelo de Generación de Imagen</span>
                          </div>
                          <label className="block text-[11px] text-muted-foreground mt-1 mb-2">
                            Para creación o retoque de ilustraciones e imágenes del colegio.
                          </label>
                        </div>
                        <SearchableModelSelect
                          value={formData.ai_model_image || 'dall-e-3'}
                          onChange={(val) => handleInputChange('ai_model_image', val)}
                          models={availableModels}
                          placeholder="Seleccionar modelo de imagen..."
                          modelType="image"
                          fallbackPresets={[
                            'dall-e-3',
                            'dall-e-2',
                            'imagen-3.0-generate-002',
                            'flux-schnell',
                            'flux-dev',
                            'stable-diffusion-3.5'
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SERVIDOR DE CORREO (SMTP) */}
        {/* ========================================================================= */}
        {activeTab === 'email' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* SMTP Connection Configuration */}
              <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
                  <Mail className="w-4 h-4 text-forest" />
                  <span>Configuración del Servidor SMTP</span>
                </h3>

                <p className="text-xs text-muted-foreground">
                  Configura las credenciales del servidor de correo para el envío seguro de códigos de verificación OTP para tutores y notificaciones de admisiones.
                </p>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-forest font-bold">Host SMTP *</label>
                      <input
                        type="text"
                        value={formData.smtp_host || ''}
                        onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                        placeholder="smtp.gmail.com o smtp.resend.com"
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Puerto *</label>
                      <input
                        type="text"
                        value={formData.smtp_port || '587'}
                        onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                        placeholder="587 o 465"
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Usuario / Correo *</label>
                      <input
                        type="text"
                        value={formData.smtp_user || ''}
                        onChange={(e) => handleInputChange('smtp_user', e.target.value)}
                        placeholder="contacto@ceibamontessori.edu.mx"
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Contraseña / API Key *</label>
                      <div className="relative">
                        <input
                          type={showSmtpPassword ? 'text' : 'password'}
                          value={formData.smtp_pass || ''}
                          onChange={(e) => handleInputChange('smtp_pass', e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full p-2.5 pr-10 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest cursor-pointer"
                        >
                          {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Nombre del Remitente (From Name)</label>
                      <input
                        type="text"
                        value={formData.smtp_from_name || ''}
                        onChange={(e) => handleInputChange('smtp_from_name', e.target.value)}
                        placeholder={formData.schoolName || 'Escuela Montessori'}
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Email del Remitente (From Email)</label>
                      <input
                        type="email"
                        value={formData.smtp_from_email || ''}
                        onChange={(e) => handleInputChange('smtp_from_email', e.target.value)}
                        placeholder={formData.contactEmail || 'admisiones@ceibamontessori.edu.mx'}
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Test SMTP Connection Diagnostics */}
              <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
                    <ShieldCheck className="w-4 h-4 text-forest" />
                    <span>Diagnóstico y Prueba de Envío</span>
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Realiza una verificación de enlace directo con tu servidor de correo y envía un mensaje de prueba para garantizar que los tutores recibirán sus códigos de acceso.
                  </p>

                  <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 space-y-2 text-xs text-forest">
                    <span className="font-bold block flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-forest" /> Sugerencia de Proveedores:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><strong>Gmail:</strong> Host <code className="font-mono text-forest">smtp.gmail.com</code>, Puerto 587, requiere <em>Contraseña de Aplicación de 16 caracteres</em>.</li>
                      <li><strong>Resend / SendGrid / Postmark:</strong> Host <code className="font-mono text-forest">smtp.resend.com</code>, Puerto 587, Usuario <code className="font-mono text-forest">resend</code>.</li>
                      <li><strong>Outlook / Office 365:</strong> Host <code className="font-mono text-forest">smtp.office365.com</code>, Puerto 587.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-xs pt-2">
                    <label className="block text-forest font-bold">Enviar Correo de Prueba a:</label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-forest/10">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                    className="w-full py-3 px-4 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{testingSmtp ? 'Verificando y Enviando...' : 'Probar Conexión y Enviar Correo de Prueba'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ALMACENAMIENTO (STORAGE DRIVER & CLOUD CONFIG) */}
        {/* ========================================================================= */}
        {activeTab === 'storage' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Storage Driver Selector & Parameters */}
              <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-6">
                <div className="space-y-1 border-b border-forest/10 pb-3">
                  <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-forest" />
                    <span>Proveedor de Almacenamiento (Storage Driver)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Selecciona dónde se almacenarán los expedientes digitales, constancias oficiales de CURP, firmas y documentos adjuntos de admisión.
                  </p>
                </div>

                {/* Driver Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Local Disk Card */}
                  <button
                    type="button"
                    onClick={() => handleInputChange('storage_driver', 'local')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${(formData.storage_driver || 'local') === 'local'
                      ? 'bg-forest/10 border-forest text-forest shadow-xs'
                      : 'bg-white border-forest/15 hover:border-forest/40 text-muted-foreground'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Folder className={`w-6 h-6 ${(formData.storage_driver || 'local') === 'local' ? 'text-forest' : 'text-slate-400'}`} />
                      {(formData.storage_driver || 'local') === 'local' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-forest animate-pulse" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-forest">Disco Local</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Almacenamiento en servidor</span>
                    </div>
                  </button>

                  {/* Amazon S3 Card */}
                  <button
                    type="button"
                    onClick={() => handleInputChange('storage_driver', 's3')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${formData.storage_driver === 's3'
                      ? 'bg-forest/10 border-forest text-forest shadow-xs'
                      : 'bg-white border-forest/15 hover:border-forest/40 text-muted-foreground'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Cloud className={`w-6 h-6 ${formData.storage_driver === 's3' ? 'text-forest' : 'text-slate-400'}`} />
                      {formData.storage_driver === 's3' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-forest animate-pulse" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-forest">Amazon S3</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">AWS Cloud Bucket</span>
                    </div>
                  </button>

                  {/* MinIO Card */}
                  <button
                    type="button"
                    onClick={() => handleInputChange('storage_driver', 'minio')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${formData.storage_driver === 'minio'
                      ? 'bg-forest/10 border-forest text-forest shadow-xs'
                      : 'bg-white border-forest/15 hover:border-forest/40 text-muted-foreground'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Database className={`w-6 h-6 ${formData.storage_driver === 'minio' ? 'text-forest' : 'text-slate-400'}`} />
                      {formData.storage_driver === 'minio' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-forest animate-pulse" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-forest">MinIO / S3 Compat</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Self-hosted / R2 / Wasabi</span>
                    </div>
                  </button>
                </div>

                {/* LOCAL DRIVER CONFIG */}
                {(formData.storage_driver || 'local') === 'local' && (
                  <div className="space-y-4 pt-2 text-xs">
                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Directorio Raíz Local Privado (storage_local_root)</label>
                      <input
                        type="text"
                        value={formData.storage_local_root || './storage'}
                        onChange={(e) => handleInputChange('storage_local_root', e.target.value)}
                        placeholder="./storage"
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                      />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Directorio privado en el servidor (fuera de la carpeta web pública). Solo los usuarios autenticados o autorizados pueden visualizar los archivos a través del proxy seguro del sistema.
                      </p>
                    </div>
                  </div>
                )}

                {/* S3 OR MINIO CONFIG */}
                {(formData.storage_driver === 's3' || formData.storage_driver === 'minio') && (
                  <div className="space-y-4 pt-2 text-xs">
                    {/* MinIO Endpoint if MinIO */}
                    {formData.storage_driver === 'minio' && (
                      <div className="space-y-1">
                        <label className="block text-forest font-bold">Endpoint de MinIO / S3 Compatible *</label>
                        <input
                          type="text"
                          value={formData.s3_endpoint || ''}
                          onChange={(e) => handleInputChange('s3_endpoint', e.target.value)}
                          placeholder="https://minio.tudominio.com o http://192.168.1.50:9000"
                          className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-forest font-bold">Nombre del Bucket Privado *</label>
                        <input
                          type="text"
                          value={formData.s3_bucket || ''}
                          onChange={(e) => handleInputChange('s3_bucket', e.target.value)}
                          placeholder="ceiba-roots-admissions"
                          className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-forest font-bold">Región *</label>
                        <input
                          type="text"
                          value={formData.s3_region || 'us-east-1'}
                          onChange={(e) => handleInputChange('s3_region', e.target.value)}
                          placeholder="us-east-1"
                          className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Access Key ID *</label>
                      <input
                        type="text"
                        value={formData.s3_access_key_id || ''}
                        onChange={(e) => handleInputChange('s3_access_key_id', e.target.value)}
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Secret Access Key *</label>
                      <div className="relative">
                        <input
                          type={showS3Secret ? 'text' : 'password'}
                          value={formData.s3_secret_access_key || ''}
                          onChange={(e) => handleInputChange('s3_secret_access_key', e.target.value)}
                          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                          className="w-full p-2.5 pr-10 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowS3Secret(!showS3Secret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest cursor-pointer"
                        >
                          {showS3Secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-forest font-bold">Forzar Path Style (S3 Force Path Style)</label>
                      <select
                        value={formData.s3_force_path_style === 'true' || formData.s3_force_path_style === true || formData.storage_driver === 'minio' ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('s3_force_path_style', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-semibold focus:outline-none cursor-pointer shadow-2xs"
                      >
                        <option value="true">Activado (Requerido para MinIO)</option>
                        <option value="false">Desactivado (Estándar AWS S3)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Storage Architecture Info & Diagnostics Test */}
              <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
                    <ShieldCheck className="w-4 h-4 text-forest" />
                    <span>Seguridad Privada & Diagnóstico</span>
                  </h3>

                  {/* Privacy Badge */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-amber-800">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Almacenamiento 100% Aislado y Seguro:</span>
                    </span>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      Ningún archivo ni documento sensible (CURP, INE, actas de nacimiento, firmas) se expone a la web pública. El acceso se realiza exclusivamente mediante endpoints con verificación de identidad y pertenencia al colegio.
                    </p>
                  </div>

                  {/* Tree Diagram */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[11px] space-y-1 border border-slate-800 shadow-inner overflow-x-auto">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5 pb-1 border-b border-slate-800">
                      <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Jerarquía de Archivos del Expediente:</span>
                    </div>
                    <div>📁 storage/ [PRIVADO]</div>
                    <div>└── 📁 schools/</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;└── 📁 &#123;schoolId&#125;/</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📁 admissions/</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📁 &#123;admissionApplicationId&#125;/</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📁 forms/</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📁 &#123;formId&#125;/</div>
                    <div className="text-emerald-400 font-bold pl-12">├── 📄 Formulario_Firmado.pdf</div>
                    <div className="text-emerald-400 font-bold pl-12">├── 📄 CURP_Oficial_RENAPO.pdf</div>
                    <div className="text-emerald-400 font-bold pl-12">├── 🖼️ firma_tutor.png</div>
                    <div className="text-emerald-400 font-bold pl-12">└── 📎 [archivos_subidos...]</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                    <span className="font-bold block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Ciclo de Vida & Exportación ZIP:</span>
                    </span>
                    <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                      Los expedientes pueden exportarse en lote como paquetes ZIP firmados. Si se da de baja un proceso de admisión, su carpeta física completa es eliminada automáticamente del disco o bucket.
                    </p>
                  </div>
                </div>

                {/* Diagnostic Test Button */}
                <div className="pt-4 border-t border-forest/10">
                  <button
                    type="button"
                    onClick={handleTestStorage}
                    disabled={testingStorage}
                    className="w-full py-3 px-4 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${testingStorage ? 'animate-spin' : ''}`} />
                    <span>{testingStorage ? 'Verificando Conexión Privada...' : 'Probar Conexión de Almacenamiento'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: WEBHOOKS & INTEGRACIONES (ACCORDION) */}
        {/* ========================================================================= */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header info card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-forest/[0.03] border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-forest text-white">
                  <Webhook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-forest font-heading">
                    Centro de Webhooks & Notificaciones en Tiempo Real
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configura endpoints HTTP POST para sincronizar eventos automáticamente con automatizadores como n8n, Make, Zapier, Google Workspace o tu ERP escolar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-forest bg-white px-3 py-1.5 rounded-xl border border-forest/20 shadow-2xs self-start sm:self-center shrink-0">
                <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Event Dispatcher Activo</span>
              </div>
            </div>

            {/* ACCORDION CONTAINER */}
            <div className="space-y-4">
              {/* ========================================================================= */}
              {/* ACCORDION ITEM 1: STORAGE & EXPEDIENTES WEBHOOK */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-forest/15 shadow-xs overflow-hidden transition-all">
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleAccordion('storage')}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 bg-forest/[0.01] hover:bg-forest/[0.03] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-forest font-heading">
                          1. Webhooks de Almacenamiento & Expedientes
                        </h4>
                        {(formData.storage_webhook_enabled === 'true' || formData.storage_webhook_enabled === true) ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            Activado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Emisión automática cada vez que se sube, firma o elimina un documento en los expedientes de admisión.
                      </p>
                    </div>
                  </div>

                  <div className="p-1 text-forest/70 hover:text-forest">
                    {openAccordion === 'storage' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Accordion Body */}
                {openAccordion === 'storage' && (
                  <div className="p-5 sm:p-6 border-t border-forest/10 space-y-6 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest/10 pb-4">
                      <span className="text-xs font-bold text-forest">
                        Estado del Webhook de Almacenamiento:
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.storage_webhook_enabled === 'true' || formData.storage_webhook_enabled === true;
                          handleInputChange('storage_webhook_enabled', current ? 'false' : 'true');
                        }}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${(formData.storage_webhook_enabled === 'true' || formData.storage_webhook_enabled === true)
                          ? 'bg-forest text-white border-forest shadow-xs'
                          : 'bg-white text-muted-foreground border-forest/20 hover:bg-forest/5'
                          }`}
                      >
                        {(formData.storage_webhook_enabled === 'true' || formData.storage_webhook_enabled === true) ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-emerald-300" />
                            <span>Webhook Activado</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                            <span>Webhook Desactivado</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                      {/* Form inputs */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-forest font-bold">
                            URL del Endpoint Webhook <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="url"
                            value={formData.storage_webhook_url || ''}
                            onChange={(e) => handleInputChange('storage_webhook_url', e.target.value)}
                            placeholder="https://n8n.tudominio.com/webhook/storage-events o https://hook.eu1.make.com/..."
                            className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            URL receptora que recibirá las notificaciones HTTP POST de los archivos.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-forest font-bold">
                            Token de Autenticación / Secret (Opcional)
                          </label>
                          <input
                            type="text"
                            value={formData.storage_webhook_secret || ''}
                            onChange={(e) => handleInputChange('storage_webhook_secret', e.target.value)}
                            placeholder="Bearer token o clave secreta de verificación"
                            className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Se enviará en los encabezados <code className="font-mono text-forest">Authorization: Bearer &lt;token&gt;</code> y <code className="font-mono text-forest">X-Ceiba-Secret</code>.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-forest block">Incluir Archivo en Base64</span>
                            <span className="text-[11px] text-muted-foreground block">
                              Envía el contenido codificado en Base64 en el cuerpo JSON para respaldos automáticos en Google Drive o Dropbox.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const current = formData.storage_webhook_include_payload === 'true' || formData.storage_webhook_include_payload === true || formData.storage_webhook_include_payload === undefined;
                              handleInputChange('storage_webhook_include_payload', current ? 'false' : 'true');
                            }}
                            className="shrink-0 text-forest hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            {(formData.storage_webhook_include_payload === 'true' || formData.storage_webhook_include_payload === true || formData.storage_webhook_include_payload === undefined) ? (
                              <ToggleRight className="w-8 h-8 text-forest" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-400" />
                            )}
                          </button>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleTestStorageWebhook}
                            disabled={testingStorageWebhook || !formData.storage_webhook_url}
                            className="py-2.5 px-4 bg-forest text-white hover:bg-forest/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          >
                            <Send className={`w-3.5 h-3.5 ${testingStorageWebhook ? 'animate-pulse' : ''}`} />
                            <span>{testingStorageWebhook ? 'Enviando Ping de Prueba...' : 'Enviar Webhook de Prueba'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Documentation & Payload Structure */}
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[11px] space-y-1.5 border border-slate-800 shadow-inner overflow-x-auto">
                          <div className="text-slate-400 font-bold flex items-center justify-between pb-1 border-b border-slate-800">
                            <span className="flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Estructura del Payload JSON (Storage):
                            </span>
                            <span className="text-[10px] text-emerald-500">POST application/json</span>
                          </div>
                          <pre className="whitespace-pre-wrap text-[10.5px] leading-relaxed">
                            {`{
  "event": "file.created",
  "timestamp": "2026-08-20T14:15:00Z",
  "schoolId": "ceiba_school_uuid",
  "applicationId": "app_uuid_del_expediente",
  "formId": "form_template_uuid",
  "filename": "CURP_ROOA210225HQRDLLA8.pdf",
  "relativePath": "schools/.../forms/.../CURP_....pdf",
  "size": 184520,
  "mimeType": "application/pdf"
}`}
                          </pre>
                        </div>

                        <div className="p-3 rounded-2xl bg-forest/5 border border-forest/10 text-[11px] text-forest space-y-1">
                          <span className="font-bold block">Eventos soportados:</span>
                          <p className="text-muted-foreground leading-relaxed">
                            <code className="text-forest font-semibold">file.created</code> (archivo o firma creada), <code className="text-forest font-semibold">file.deleted</code> (archivo removido), <code className="text-forest font-semibold">admission.folder_deleted</code> (expediente eliminado).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* ACCORDION ITEM 2: CALENDAR & BOOKINGS WEBHOOK */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-forest/15 shadow-xs overflow-hidden transition-all">
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleAccordion('calendar')}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 bg-forest/[0.01] hover:bg-forest/[0.03] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-700">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-forest font-heading">
                          2. Webhooks de Calendario & Reservas de Citas
                        </h4>
                        {(formData.calendar_webhook_enabled === 'true' || formData.calendar_webhook_enabled === true) ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            Activado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Emisión en tiempo real de eventos creados/modificados, nuevas reservas de citas o tours escolares, y cancelaciones.
                      </p>
                    </div>
                  </div>

                  <div className="p-1 text-forest/70 hover:text-forest">
                    {openAccordion === 'calendar' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Accordion Body */}
                {openAccordion === 'calendar' && (
                  <div className="p-5 sm:p-6 border-t border-forest/10 space-y-6 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest/10 pb-4">
                      <span className="text-xs font-bold text-forest">
                        Estado del Webhook de Calendario:
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.calendar_webhook_enabled === 'true' || formData.calendar_webhook_enabled === true;
                          handleInputChange('calendar_webhook_enabled', current ? 'false' : 'true');
                        }}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${(formData.calendar_webhook_enabled === 'true' || formData.calendar_webhook_enabled === true)
                          ? 'bg-forest text-white border-forest shadow-xs'
                          : 'bg-white text-muted-foreground border-forest/20 hover:bg-forest/5'
                          }`}
                      >
                        {(formData.calendar_webhook_enabled === 'true' || formData.calendar_webhook_enabled === true) ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-emerald-300" />
                            <span>Webhook Activado</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                            <span>Webhook Desactivado</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                      {/* Form inputs */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-forest font-bold">
                            URL del Endpoint Webhook <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="url"
                            value={formData.calendar_webhook_url || ''}
                            onChange={(e) => handleInputChange('calendar_webhook_url', e.target.value)}
                            placeholder="https://n8n.tudominio.com/webhook/calendar-events o https://zapier.com/hooks/catch/..."
                            className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            URL que recibirá las notificaciones de eventos y citas del calendario.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-forest font-bold">
                            Token de Autenticación / Secret (Opcional)
                          </label>
                          <input
                            type="text"
                            value={formData.calendar_webhook_secret || ''}
                            onChange={(e) => handleInputChange('calendar_webhook_secret', e.target.value)}
                            placeholder="Bearer token o firma secreta de validación"
                            className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Se enviará en los encabezados <code className="font-mono text-forest">Authorization: Bearer &lt;token&gt;</code> y <code className="font-mono text-forest">X-Ceiba-Secret</code>.
                          </p>
                        </div>

                        {/* Event Types Subscription Toggles */}
                        <div className="space-y-2 pt-1">
                          <label className="block text-forest font-bold">
                            Tipos de Eventos a Emitir:
                          </label>
                          <div className="space-y-2 p-3.5 rounded-xl bg-forest/[0.02] border border-forest/15">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.calendar_webhook_event_created !== 'false'}
                                onChange={(e) => handleInputChange('calendar_webhook_event_created', e.target.checked ? 'true' : 'false')}
                                className="rounded text-forest focus:ring-forest"
                              />
                              <span className="text-forest font-medium text-xs">
                                <strong>calendar.event_created:</strong> Cuando se publica un nuevo evento o taller.
                              </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.calendar_webhook_event_updated !== 'false'}
                                onChange={(e) => handleInputChange('calendar_webhook_event_updated', e.target.checked ? 'true' : 'false')}
                                className="rounded text-forest focus:ring-forest"
                              />
                              <span className="text-forest font-medium text-xs">
                                <strong>calendar.event_updated:</strong> Cuando se reprograma o modifica un evento.
                              </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.calendar_webhook_event_deleted !== 'false'}
                                onChange={(e) => handleInputChange('calendar_webhook_event_deleted', e.target.checked ? 'true' : 'false')}
                                className="rounded text-forest focus:ring-forest"
                              />
                              <span className="text-forest font-medium text-xs">
                                <strong>calendar.event_deleted:</strong> Cuando se cancela o elimina un evento.
                              </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.calendar_webhook_booking_created !== 'false'}
                                onChange={(e) => handleInputChange('calendar_webhook_booking_created', e.target.checked ? 'true' : 'false')}
                                className="rounded text-forest focus:ring-forest"
                              />
                              <span className="text-forest font-medium text-xs">
                                <strong>calendar.booking_created:</strong> Cuando una familia agenda una cita o reserva un slot.
                              </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.calendar_webhook_booking_cancelled !== 'false'}
                                onChange={(e) => handleInputChange('calendar_webhook_booking_cancelled', e.target.checked ? 'true' : 'false')}
                                className="rounded text-forest focus:ring-forest"
                              />
                              <span className="text-forest font-medium text-xs">
                                <strong>calendar.booking_cancelled:</strong> Cuando se cancela o libera una reserva de cita.
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleTestCalendarWebhook}
                            disabled={testingCalendarWebhook || !formData.calendar_webhook_url}
                            className="py-2.5 px-4 bg-forest text-white hover:bg-forest/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          >
                            <Send className={`w-3.5 h-3.5 ${testingCalendarWebhook ? 'animate-pulse' : ''}`} />
                            <span>{testingCalendarWebhook ? 'Enviando Ping de Prueba...' : 'Enviar Webhook de Prueba de Calendario'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Documentation & Payload Structure */}
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[11px] space-y-1.5 border border-slate-800 shadow-inner overflow-x-auto">
                          <div className="text-slate-400 font-bold flex items-center justify-between pb-1 border-b border-slate-800">
                            <span className="flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Estructura del Payload JSON (Calendario):
                            </span>
                            <span className="text-[10px] text-emerald-500">POST application/json</span>
                          </div>
                          <pre className="whitespace-pre-wrap text-[10.5px] leading-relaxed">
                            {`{
  "event": "calendar.booking_created",
  "timestamp": "2026-08-21T21:00:00Z",
  "schoolId": "ceiba_school_uuid",
  "data": {
    "id": "evt_open_house_123",
    "title": "Visita Guiada Campus Montessori",
    "startDate": "2026-08-25T10:00:00Z",
    "endDate": "2026-08-25T11:30:00Z",
    "location": "Campus Central",
    "booking": {
      "id": "bkg_789",
      "parentName": "Familia Morales",
      "parentEmail": "fam.morales@ejemplo.com",
      "parentPhone": "+52 998 555 1234",
      "status": "CONFIRMED"
    }
  }
}`}
                          </pre>
                        </div>

                        <div className="p-3 rounded-2xl bg-forest/5 border border-forest/10 text-[11px] text-forest space-y-1">
                          <span className="font-bold block">Casos de Uso Principales:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            <li><strong>Sincronización con Google Calendar / Outlook:</strong> Crear eventos en los calendarios del personal escolar.</li>
                            <li><strong>Notificaciones SMS / WhatsApp:</strong> Enviar recordatorios automáticos a las familias interesadas.</li>
                            <li><strong>Integración con CRM:</strong> Registrar el lead y la cita en HubSpot, Salesforce o Zoho CRM.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* MOBILE FLOATING ACTION BUTTON (ROUND, BOTTOM-RIGHT) */}
      {isOwnerOrAdmin && (
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer border-2 border-white/60 ring-4 ring-forest/20 shadow-forest/30"
          title={saving ? 'Guardando...' : 'Guardar Cambios'}
          aria-label="Guardar Cambios"
        >
          {saving ? (
            <RefreshCw className="w-6 h-6 animate-spin text-white" />
          ) : (
            <Save className="w-6 h-6 text-white" />
          )}
        </button>
      )}
    </div>
  );
};
