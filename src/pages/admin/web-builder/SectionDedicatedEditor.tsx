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
  Languages
} from 'lucide-react';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';

interface SectionDedicatedEditorProps {
  section: WebSectionItem;
  onUpdateSection: (updates: Partial<WebSectionItem>) => void;
  onDuplicateSection?: () => void;
  onDeleteSection?: () => void;
}

export const SectionDedicatedEditor: React.FC<SectionDedicatedEditorProps> = ({
  section,
  onUpdateSection,
  onDuplicateSection,
  onDeleteSection
}) => {
  const [editorLang, setEditorLang] = useState<'es' | 'en'>('es');
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
                {editorLang === 'en' && section.name_en ? section.name_en : section.name}
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

      {/* LANGUAGE SELECTOR SWITCH (ESPAÑOL / ENGLISH) */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-forest/5 via-forest/10 to-amber-500/5 border border-forest/20 shadow-3xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-forest text-white flex items-center justify-center shadow-3xs">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block">Idioma de Edición</span>
            <span className="text-[10px] text-muted-foreground">Configurá textos para cada idioma</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-3xs">
          <button
            type="button"
            onClick={() => setEditorLang('es')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              editorLang === 'es'
                ? 'bg-forest text-white shadow-3xs scale-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🇪🇸</span>
            <span>Español (ES)</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorLang('en')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              editorLang === 'en'
                ? 'bg-forest text-white shadow-3xs scale-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🇺🇸</span>
            <span>English (EN)</span>
          </button>
        </div>
      </div>

      {/* 2. GENERAL HEADINGS & TEXTS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">1</div>
            <h4 className="font-bold text-forest text-xs sm:text-sm">
              Titulares & Textos ({editorLang === 'es' ? 'Español' : 'English'})
            </h4>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
            editorLang === 'es' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {editorLang === 'es' ? '🇪🇸 Idioma Español' : '🇺🇸 Idioma Inglés'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">
              Nombre de la Sección ({editorLang.toUpperCase()}):
            </label>
            <input
              type="text"
              value={editorLang === 'es' ? section.name : (section.name_en || '')}
              onChange={(e) => {
                if (editorLang === 'es') onUpdateSection({ name: e.target.value });
                else onUpdateSection({ name_en: e.target.value });
              }}
              placeholder={editorLang === 'es' ? 'Nombre identificador' : 'Section Name in English'}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">
              Etiqueta Superior (Badge / Eyebrow {editorLang.toUpperCase()}):
            </label>
            <input
              type="text"
              value={editorLang === 'es' ? (section.badge || '') : (section.badge_en || '')}
              onChange={(e) => {
                if (editorLang === 'es') onUpdateSection({ badge: e.target.value });
                else onUpdateSection({ badge_en: e.target.value });
              }}
              placeholder={editorLang === 'es' ? 'Ej: Nuestra Filosofía' : 'Ex: Our Philosophy'}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700">
            Título Principal de la Sección ({editorLang.toUpperCase()}):
          </label>
          <input
            type="text"
            value={editorLang === 'es' ? section.title : (section.title_en || '')}
            onChange={(e) => {
              if (editorLang === 'es') onUpdateSection({ title: e.target.value });
              else onUpdateSection({ title_en: e.target.value });
            }}
            placeholder={editorLang === 'es' ? 'Título principal en español' : 'Main section title in English'}
            className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700">
            Subtítulo / Bajada Descriptiva ({editorLang.toUpperCase()}):
          </label>
          <textarea
            value={editorLang === 'es' ? (section.subtitle || '') : (section.subtitle_en || '')}
            onChange={(e) => {
              if (editorLang === 'es') onUpdateSection({ subtitle: e.target.value });
              else onUpdateSection({ subtitle_en: e.target.value });
            }}
            rows={2}
            placeholder={editorLang === 'es' ? 'Descripción introductoria o propósito...' : 'Introductory description or purpose in English...'}
            className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
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

      {/* 3. BOTÓN CTA / LLAMADO A LA ACCIÓN */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">2</div>
          <h4 className="font-bold text-forest text-xs sm:text-sm">
            Botón de Acción CTA ({editorLang === 'es' ? 'Español' : 'English'})
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">
              Texto del Botón ({editorLang.toUpperCase()}):
            </label>
            <input
              type="text"
              value={editorLang === 'es' ? (section.ctaText || '') : (section.ctaText_en || '')}
              onChange={(e) => {
                if (editorLang === 'es') onUpdateSection({ ctaText: e.target.value });
                else onUpdateSection({ ctaText_en: e.target.value });
              }}
              placeholder={editorLang === 'es' ? 'Ej: Quiero una cita o Más Información' : 'Ex: Book a Tour / Learn More'}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">Enlace / Destino:</label>
            <input
              type="text"
              value={section.ctaUrl || ''}
              onChange={(e) => onUpdateSection({ ctaUrl: e.target.value })}
              placeholder="Ej: /#admisiones o https://wa.me/..."
              className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg"
            />
          </div>
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
              Puntos de Beneficio ({editorLang === 'es' ? 'Español' : 'English'}):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  key: editorLang === 'es' ? 'item1' : 'item1_en',
                  def: editorLang === 'es' ? 'Bilingüe (Inglés vivido naturalmente)' : 'Bilingual (Naturally lived English)'
                },
                {
                  key: editorLang === 'es' ? 'item2' : 'item2_en',
                  def: editorLang === 'es' ? 'Áreas verdes y contacto con la naturaleza' : 'Green areas and connection with nature'
                },
                {
                  key: editorLang === 'es' ? 'item3' : 'item3_en',
                  def: editorLang === 'es' ? 'Actividades de vida práctica y sensorial' : 'Practical life and sensorial activities'
                },
                {
                  key: editorLang === 'es' ? 'item4' : 'item4_en',
                  def: editorLang === 'es' ? 'Desarrollo socioemocional y autonomía' : 'Socio-emotional development & autonomy'
                }
              ].map((item, idx) => (
                <div key={item.key} className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500">
                    Beneficio {idx + 1} ({editorLang.toUpperCase()}):
                  </span>
                  <input
                    type="text"
                    value={section.config?.[item.key] ?? item.def}
                    onChange={(e) => handleConfigChange(item.key, e.target.value)}
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
              Texto Destacado de Misión ({editorLang.toUpperCase()}):
            </label>
            <textarea
              value={editorLang === 'es'
                ? (section.config?.missionText ?? 'En nuestra escuela nos comprometemos a entender la infancia para ayudar a los niños a desarrollar la grandeza de sus potencialidades.')
                : (section.config?.missionText_en ?? 'At our school, we are committed to understanding childhood to help children develop their full human potential.')
              }
              onChange={(e) => {
                if (editorLang === 'es') handleConfigChange('missionText', e.target.value);
                else handleConfigChange('missionText_en', e.target.value);
              }}
              rows={3}
              placeholder={editorLang === 'es' ? 'Texto de misión en español...' : 'Mission statement in English...'}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
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
              Dirección Física Completa ({editorLang.toUpperCase()}):
            </label>
            <input
              type="text"
              value={editorLang === 'es'
                ? (section.config?.address || 'Av. Principal 123, Zona Escolar, Benito Juárez, Quintana Roo')
                : (section.config?.address_en || '123 Main Ave, School District, Benito Juarez, Quintana Roo')
              }
              onChange={(e) => {
                if (editorLang === 'es') handleConfigChange('address', e.target.value);
                else handleConfigChange('address_en', e.target.value);
              }}
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
