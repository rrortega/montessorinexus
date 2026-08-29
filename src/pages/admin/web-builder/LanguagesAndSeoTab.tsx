import React from 'react';
import {
  Globe,
  Check,
  AlertCircle,
  Search,
  Share2,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';
import { ALL_SUPPORTED_LANGUAGES, SupportedLanguage } from './languages';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { toast } from 'sonner';

interface LanguagesAndSeoTabProps {
  enabledLangsStr: string;
  onChangeEnabledLangs: (newStr: string) => void;
  defaultLocale: string;
  onChangeDefaultLocale: (newLocale: string) => void;
  seoTitle: string;
  onChangeSeoTitle: (val: string) => void;
  seoDescription: string;
  onChangeSeoDescription: (val: string) => void;
  seoKeywords: string;
  onChangeSeoKeywords: (val: string) => void;
  seoCanonicalUrl: string;
  onChangeSeoCanonicalUrl: (val: string) => void;
  seoAllowIndexing: boolean;
  onChangeSeoAllowIndexing: (val: boolean) => void;
  ogTitle: string;
  onChangeOgTitle: (val: string) => void;
  ogDescription: string;
  onChangeOgDescription: (val: string) => void;
  ogImageUrl: string;
  onChangeOgImageUrl: (val: string) => void;
  schoolName: string;
  schoolTagline: string;
  siteUrl: string;
}

export const LanguagesAndSeoTab: React.FC<LanguagesAndSeoTabProps> = ({
  enabledLangsStr,
  onChangeEnabledLangs,
  defaultLocale,
  onChangeDefaultLocale,
  seoTitle,
  onChangeSeoTitle,
  seoDescription,
  onChangeSeoDescription,
  seoKeywords,
  onChangeSeoKeywords,
  seoCanonicalUrl,
  onChangeSeoCanonicalUrl,
  seoAllowIndexing,
  onChangeSeoAllowIndexing,
  ogTitle,
  onChangeOgTitle,
  ogDescription,
  onChangeOgDescription,
  ogImageUrl,
  onChangeOgImageUrl,
  schoolName,
  schoolTagline,
  siteUrl
}) => {
  const activeCodes = enabledLangsStr
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const handleToggleLang = (code: string) => {
    const isCurrentlyActive = activeCodes.includes(code);
    if (isCurrentlyActive) {
      if (activeCodes.length <= 2) {
        toast.error('La web debe tener al menos 2 idiomas activos habilitados.');
        return;
      }
      const updated = activeCodes.filter(c => c !== code);
      onChangeEnabledLangs(updated.join(','));
      if (defaultLocale === code) {
        onChangeDefaultLocale(updated[0] || 'es');
      }
      toast.success(`Idioma desactivado.`);
    } else {
      const updated = [...activeCodes, code];
      onChangeEnabledLangs(updated.join(','));
      toast.success(`Idioma activado.`);
    }
  };

  const previewDisplayTitle = seoTitle.trim() || `${schoolName || 'Colegio Montessori'} | ${schoolTagline || 'Educación Viva y Consciente'}`;
  const previewDisplayDesc = seoDescription.trim() || 'Formamos niños independientes, conscientes y preparados para un mundo global en un entorno natural y preparado.';
  const previewOgTitle = ogTitle.trim() || previewDisplayTitle;
  const previewOgDesc = ogDescription.trim() || previewDisplayDesc;

  return (
    <div className="space-y-6 text-xs text-slate-800 animate-in fade-in duration-200">
      
      {/* 1. SECCIÓN: IDIOMAS ACTIVOS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-forest text-white flex items-center justify-center font-bold shadow-3xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-forest text-xs sm:text-sm">Idiomas Activos de la Web</h4>
              <p className="text-[11px] text-muted-foreground">Mínimo 2 idiomas requeridos</p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-forest/10 text-forest border border-forest/20">
            {activeCodes.length} {activeCodes.length === 1 ? 'Idioma' : 'Idiomas'} Activos
          </span>
        </div>

        {/* Grid de idiomas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ALL_SUPPORTED_LANGUAGES.map((lang) => {
            const isChecked = activeCodes.includes(lang.code);
            const isDefault = defaultLocale === lang.code;

            return (
              <div
                key={lang.code}
                onClick={() => handleToggleLang(lang.code)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isChecked
                    ? 'bg-forest/5 border-forest text-slate-900 shadow-3xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0 select-none">{lang.flag}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-xs truncate ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                        {lang.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        ({lang.code})
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {lang.nativeName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDefault && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                      Principal
                    </span>
                  )}
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                    isChecked ? 'bg-forest text-white shadow-3xs' : 'border border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selector de idioma principal */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-slate-800 block">Idioma Predeterminado:</label>
            <span className="text-[10px] text-muted-foreground">Idioma inicial cuando ingresa un nuevo visitante</span>
          </div>

          <select
            value={defaultLocale}
            onChange={(e) => onChangeDefaultLocale(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl shadow-3xs focus:ring-2 focus:ring-forest/20 focus:border-forest"
          >
            {activeCodes.map(code => {
              const langObj = ALL_SUPPORTED_LANGUAGES.find(l => l.code === code);
              return (
                <option key={code} value={code}>
                  {langObj?.flag} {langObj?.name || code.toUpperCase()} ({code.toUpperCase()})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 2. SECCIÓN: CONFIGURACIÓN DE SEO (GOOGLE SERP) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold shadow-3xs">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-forest text-xs sm:text-sm">Optimización SEO (Google & Buscadores)</h4>
            <p className="text-[11px] text-muted-foreground">Metadatos de indexación y posicionamiento web</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-700">Título SEO de la Página (&lt;title&gt;):</label>
            <span className="text-[10px] text-slate-400 font-mono">{seoTitle.length} caracteres</span>
          </div>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => onChangeSeoTitle(e.target.value)}
            placeholder="Ej: Ceiba Montessori | Escuela Montessori Bilingüe en Cancún"
            className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest shadow-3xs"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-700">Meta Descripción (&lt;meta name="description"&gt;):</label>
            <span className={`text-[10px] font-mono ${seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
              {seoDescription.length}/160 recomendados
            </span>
          </div>
          <textarea
            value={seoDescription}
            onChange={(e) => onChangeSeoDescription(e.target.value)}
            rows={3}
            placeholder="Ej: Educación Montessori viva y bilingüe para niños de 1 a 12 años. Ambientes preparados y guías certificados..."
            className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest shadow-3xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">Palabras Clave (Keywords):</label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => onChangeSeoKeywords(e.target.value)}
              placeholder="montessori, cancun, educacion, bilingue"
              className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">URL Canónica (Opcional):</label>
            <input
              type="text"
              value={seoCanonicalUrl}
              onChange={(e) => onChangeSeoCanonicalUrl(e.target.value)}
              placeholder="https://micolegio.com"
              className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Indexing Switch */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">Permitir Indexación en Buscadores</span>
            <span className="text-[10px] text-muted-foreground block">
              Genera etiquetas robots `index, follow` para aparecer en Google
            </span>
          </div>
          <input
            type="checkbox"
            checked={seoAllowIndexing}
            onChange={(e) => onChangeSeoAllowIndexing(e.target.checked)}
            className="w-4 h-4 accent-forest cursor-pointer"
          />
        </div>

        {/* GOOGLE SERP LIVE PREVIEW */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Previsualización en Resultados de Búsqueda de Google:
          </span>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-3xs space-y-1 font-sans">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="text-slate-400 font-mono text-[10px] truncate max-w-xs">{siteUrl || 'https://tucolegio.com'}</span>
              <span className="text-slate-300">›</span>
            </div>
            <h5 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer truncate">
              {previewDisplayTitle}
            </h5>
            <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
              {previewDisplayDesc}
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN: OPENGRAPH & REDES SOCIALES (WHATSAPP, FACEBOOK, X) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shadow-3xs">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-forest text-xs sm:text-sm">OpenGraph & Redes Sociales (Social Card)</h4>
            <p className="text-[11px] text-muted-foreground">Cómo se ve el enlace al compartirlo en WhatsApp, Facebook y Twitter</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700">Título para Redes Sociales (og:title):</label>
          <input
            type="text"
            value={ogTitle}
            onChange={(e) => onChangeOgTitle(e.target.value)}
            placeholder={previewDisplayTitle}
            className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest shadow-3xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700">Descripción Social (og:description):</label>
          <textarea
            value={ogDescription}
            onChange={(e) => onChangeOgDescription(e.target.value)}
            rows={2}
            placeholder={previewDisplayDesc}
            className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest shadow-3xs"
          />
        </div>

        {/* OG Image Upload */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 block">Imagen de Portada Social (og:image):</label>
          <ImageUploadDropzone
            currentImageUrl={ogImageUrl}
            onImageUploaded={(url) => onChangeOgImageUrl(url)}
            onRemove={() => onChangeOgImageUrl('')}
            label="Subir Imagen de Portada Social (1200x630px)"
            helperText="Formato recomendado: JPG/PNG de 1200x630 píxeles para visualización óptima en WhatsApp y Facebook"
            folder="seo"
            maxSizeMB={5}
          />
        </div>

        {/* SOCIAL SHARE CARD LIVE PREVIEW */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Previsualización de Tarjeta Social (WhatsApp / Facebook / LinkedIn):
          </span>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm max-w-md mx-auto">
            {/* Image Preview Banner */}
            <div className="aspect-[1.91/1] bg-slate-200 relative overflow-hidden flex items-center justify-center">
              {ogImageUrl ? (
                <img src={ogImageUrl} alt="OpenGraph Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4 text-slate-400 flex flex-col items-center gap-1.5">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span className="text-[10px] font-bold">1200 x 630 px</span>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-3.5 bg-white space-y-1 border-t border-slate-200">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                {siteUrl || 'montessorinexus.com'}
              </span>
              <h6 className="font-bold text-xs text-slate-900 line-clamp-1">
                {previewOgTitle}
              </h6>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {previewOgDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
