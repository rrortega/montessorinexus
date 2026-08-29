import React from 'react';
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
  BookOpen
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
              <h3 className="font-bold text-sm text-slate-900 truncate">{section.name}</h3>
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

      {/* 2. GENERAL HEADINGS & TEXTS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">1</div>
          <h4 className="font-bold text-forest text-xs sm:text-sm">Titulares & Textos Principales</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">Nombre de la Sección (Interno):</label>
            <input
              type="text"
              value={section.name}
              onChange={(e) => onUpdateSection({ name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">Etiqueta Superior (Badge / Eyebrow):</label>
            <input
              type="text"
              value={section.badge || ''}
              onChange={(e) => onUpdateSection({ badge: e.target.value })}
              placeholder="Ej: Nuestra Filosofía"
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700">Título Principal de la Sección:</label>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdateSection({ title: e.target.value })}
            className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700">Subtítulo / Bajada Descriptiva:</label>
          <textarea
            value={section.subtitle || ''}
            onChange={(e) => onUpdateSection({ subtitle: e.target.value })}
            rows={2}
            placeholder="Descripción introductoria o propósito de la sección..."
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
          <h4 className="font-bold text-forest text-xs sm:text-sm">Botón de Acción (CTA)</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700">Texto del Botón:</label>
            <input
              type="text"
              value={section.ctaText || ''}
              onChange={(e) => onUpdateSection({ ctaText: e.target.value })}
              placeholder="Ej: Quiero una cita o Más Información"
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
            <label className="text-[11px] font-bold text-slate-700 block">Puntos de Beneficio (Checklist):</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: 'item1', def: 'Bilingüe (Inglés vivido naturalmente)' },
                { key: 'item2', def: 'Áreas verdes y contacto con la naturaleza' },
                { key: 'item3', def: 'Actividades de vida práctica y sensorial' },
                { key: 'item4', def: 'Desarrollo socioemocional y autonomía' }
              ].map((item, idx) => (
                <div key={item.key} className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500">Beneficio {idx + 1}:</span>
                  <input
                    type="text"
                    value={section.config?.[item.key] || item.def}
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
            <label className="text-[11px] font-bold text-slate-700 block">Texto Destacado de Misión / Propósito:</label>
            <textarea
              value={section.config?.missionText || 'En nuestra escuela nos comprometemos a entender la infancia para ayudar a los niños a desarrollar la grandeza de sus potencialidades.'}
              onChange={(e) => handleConfigChange('missionText', e.target.value)}
              rows={3}
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
            <label className="text-[10px] font-bold text-slate-700">Dirección Física Completa:</label>
            <input
              type="text"
              value={section.config?.address || 'Av. Principal 123, Zona Escolar, Benito Juárez, Quintana Roo'}
              onChange={(e) => handleConfigChange('address', e.target.value)}
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
