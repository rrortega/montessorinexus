import React, { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Smartphone,
  Calendar,
  User,
  Users,
  Paperclip,
  FileIcon,
  Download,
  Edit,
  Mail,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw
} from 'lucide-react';
import { NewsletterItem, getSiteSettings, NewsletterAttachment } from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';

interface NewsletterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsletter: NewsletterItem | null;
  onEdit?: (newsletter: NewsletterItem) => void;
}

export const NewsletterPreviewModal: React.FC<NewsletterPreviewModalProps> = ({
  isOpen,
  onClose,
  newsletter,
  onEdit
}) => {
  const { activeMembership } = useAuth();
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const loadSettings = async () => {
      try {
        const settings = await getSiteSettings();
        setSiteSettings(settings || {});
      } catch (err) {
        console.error('Error loading site settings:', err);
      }
    };
    loadSettings();
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !newsletter) return null;

  const effectiveLogo = siteSettings.school_logo || activeMembership?.school?.logoUrl || '';
  const effectiveSchoolName = siteSettings.school_name || activeMembership?.school?.name || 'Escuela Montessori';
  const effectivePrimaryColor = siteSettings.brand_primary_color || activeMembership?.school?.primaryColor || '#1b3b2b';
  const effectiveAddress = siteSettings.school_address || activeMembership?.school?.address || '';

  const isSent = newsletter.status === 'SENT';
  const isScheduled = newsletter.status === 'SCHEDULED';
  const isDraft = newsletter.status === 'DRAFT';
  const isSending = newsletter.status === 'SENDING';

  const attachments: NewsletterAttachment[] = Array.isArray(newsletter.attachments)
    ? newsletter.attachments
    : [];

  return (
    <div className="!mt-0 fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-forest/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#fbfbf9] rounded-3xl shadow-2xl border border-forest/15 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-white border-b border-forest/10 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-forest/5 text-forest flex items-center justify-center border border-forest/10 shrink-0 shadow-2xs">
              <Mail className="w-5 h-5 text-forest" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Vista Previa del Boletín
                </span>
                {isSent && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Enviado</span>
                  </span>
                )}
                {isScheduled && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Programado</span>
                  </span>
                )}
                {isDraft && (
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5" />
                    <span>Borrador</span>
                  </span>
                )}
                {isSending && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Enviando...</span>
                  </span>
                )}
              </div>
              <h2 className="font-display font-bold text-forest text-base sm:text-lg truncate">
                {newsletter.title}
              </h2>
            </div>
          </div>

          {/* Controls: Device & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1 bg-forest/5 p-1 rounded-xl border border-forest/10">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  device === 'desktop'
                    ? 'bg-white text-forest shadow-xs'
                    : 'text-muted-foreground hover:text-forest'
                }`}
                title="Vista de Computadora"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  device === 'mobile'
                    ? 'bg-white text-forest shadow-xs'
                    : 'text-muted-foreground hover:text-forest'
                }`}
                title="Vista Móvil"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Celular</span>
              </button>
            </div>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(newsletter);
                }}
                className="px-3 py-1.5 bg-forest/5 hover:bg-forest/10 text-forest rounded-xl font-bold text-xs flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-xl transition-all cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          
          {/* Metadata quick bar */}
          <div className="bg-white p-3.5 px-5 rounded-2xl border border-forest/10 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-forest" />
                <span><strong>Autor:</strong> {newsletter.authorName || 'Dirección General'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-forest" />
                <span>
                  {new Date(newsletter.createdAt).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-forest font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>{newsletter.totalRecipients || 0} destinatarios calculados</span>
            </div>
          </div>

          {/* Device Mockup Container */}
          <div className="flex justify-center p-2 sm:p-6 bg-stone-100/70 rounded-3xl border border-stone-200 shadow-inner">
            <div
              className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 ${
                device === 'mobile' ? 'w-full max-w-sm' : 'w-full max-w-2xl'
              }`}
            >
              {/* Header with School Branding */}
              <div
                className="p-6 text-white text-center"
                style={{ backgroundColor: effectivePrimaryColor }}
              >
                {effectiveLogo ? (
                  <div className="mb-3 text-center">
                    <img
                      src={effectiveLogo}
                      alt={effectiveSchoolName}
                      className="max-h-14 max-w-[200px] mx-auto rounded-xl bg-white p-1.5 shadow-sm object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-display font-bold text-xl mx-auto mb-2 border border-white/30">
                    {effectiveSchoolName.charAt(0)}
                  </div>
                )}
                <h2 className="font-display text-lg font-bold text-white tracking-wide">
                  {effectiveSchoolName}
                </h2>
                <span className="text-[10px] uppercase tracking-widest text-white/90 font-bold block mt-0.5">
                  Boletín Informativo & Comunicado Oficial
                </span>
              </div>

              {/* Cover Image */}
              {newsletter.coverImageUrl && (
                <img
                  src={newsletter.coverImageUrl}
                  alt="Portada"
                  className="w-full max-h-60 object-cover block"
                />
              )}

              {/* Body Content */}
              <div className="p-6 sm:p-8 space-y-4">
                {newsletter.preheader && (
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    {newsletter.preheader}
                  </div>
                )}

                <h1 className="font-display text-xl font-bold text-slate-900 leading-tight">
                  {newsletter.subject || newsletter.title}
                </h1>

                {/* HTML Body */}
                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: newsletter.contentHtml || '<p class="text-slate-400 italic">Sin contenido registrado.</p>' }}
                />

                {/* Attachments Section */}
                {attachments.length > 0 && (
                  <div className="pt-4 mt-6 border-t border-slate-200 space-y-3">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-forest" />
                      Archivos Adjuntos ({attachments.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map(att => (
                        <div
                          key={att.id}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-800 hover:border-forest/30 transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 truncate min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-forest shrink-0">
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="font-semibold truncate text-xs text-slate-800 m-0">{att.fileName}</p>
                              <p className="text-[10px] text-slate-500 m-0">
                                {Math.round((att.fileSize || 0) / 1024)} KB
                              </p>
                            </div>
                          </div>
                          {att.fileData && (
                            <a
                              href={att.fileData}
                              download={att.fileName}
                              className="p-1.5 text-forest hover:bg-forest/10 rounded-lg transition-colors shrink-0 ml-2"
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newsletter.authorName && (
                  <div className="pt-4 mt-6 border-t border-slate-100 text-xs text-slate-500">
                    <strong>Publicado por:</strong> {newsletter.authorName}
                  </div>
                )}
              </div>

              {/* Email Footer Mockup */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700 m-0">{effectiveSchoolName}</p>
                {effectiveAddress && <p className="m-0">{effectiveAddress}</p>}
                <p className="m-0 text-[10px] text-slate-400 pt-1">
                  Este es un comunicado oficial emitido por la administración escolar.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-white border-t border-forest/10 flex items-center justify-between shrink-0 shadow-lg">
          <div className="text-xs text-muted-foreground">
            {isSent && `Enviado a ${newsletter.deliveredCount || 0} destinatarios`}
            {isScheduled && `Programado para ${newsletter.scheduledAt ? new Date(newsletter.scheduledAt).toLocaleString('es-MX') : 'fecha futura'}`}
            {isDraft && 'Guardado como borrador'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-forest transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(newsletter);
                }}
                className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all hover:scale-102 cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Abrir en Editor</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
