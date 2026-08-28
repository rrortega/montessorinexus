import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FormFieldItem } from '@/lib/sqlite';
import {
  BookOpen,
  Maximize2,
  X,
  Check,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ArrowDown,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export interface TermsConsentWidgetProps {
  field: FormFieldItem;
  checked: boolean;
  onChange: (checked: boolean) => void;
  themeColor?: string;
  isDark?: boolean;
  borderRadius?: string;
}

const getRadiusClass = (rad: string = 'lg', elem: 'card' | 'button' | 'input' | 'badge' | 'icon' = 'card') => {
  if (!rad) return elem === 'card' ? 'rounded-2xl' : 'rounded-xl';
  const cleanRadius = typeof rad === 'string' ? rad.replace(/^rounded-/, '') : 'lg';

  if (cleanRadius === 'none' || rad === 'rounded-none' || rad === 'none') {
    return 'rounded-none';
  }

  switch (cleanRadius) {
    case 'sm':
      return elem === 'badge' ? 'rounded-xs' : elem === 'button' || elem === 'icon' ? 'rounded-sm' : elem === 'input' ? 'rounded-sm' : 'rounded-md';
    case 'md':
      return elem === 'badge' ? 'rounded-sm' : elem === 'button' || elem === 'icon' ? 'rounded-md' : elem === 'input' ? 'rounded-md' : 'rounded-lg';
    case 'xl':
      return elem === 'badge' ? 'rounded-md' : elem === 'button' || elem === 'icon' ? 'rounded-xl' : elem === 'input' ? 'rounded-xl' : 'rounded-2xl';
    case '2xl':
      return elem === 'badge' ? 'rounded-lg' : elem === 'button' || elem === 'icon' ? 'rounded-2xl' : elem === 'input' ? 'rounded-2xl' : 'rounded-3xl';
    case '3xl':
      return elem === 'badge' ? 'rounded-xl' : elem === 'button' || elem === 'icon' ? 'rounded-3xl' : elem === 'input' ? 'rounded-3xl' : 'rounded-3xl';
    case 'full':
      return elem === 'card' ? 'rounded-3xl' : 'rounded-full';
    case 'lg':
    default:
      return elem === 'badge' ? 'rounded-sm' : elem === 'button' || elem === 'icon' ? 'rounded-xl' : elem === 'input' ? 'rounded-xl' : 'rounded-2xl';
  }
};

export const TermsConsentWidget: React.FC<TermsConsentWidgetProps> = ({
  field,
  checked,
  onChange,
  themeColor = '#1b3b2b',
  isDark = false,
  borderRadius = 'lg',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(() => checked);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync scroll state if checked externally
  useEffect(() => {
    if (checked) {
      setHasScrolledToBottom(true);
    }
  }, [checked]);

  // Check if content is already short enough on modal open
  useEffect(() => {
    if (isModalOpen) {
      // Small timeout to allow DOM to layout
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          const { scrollHeight, clientHeight } = scrollContainerRef.current;
          if (scrollHeight <= clientHeight + 35) {
            setHasScrolledToBottom(true);
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight <= 35) {
      setHasScrolledToBottom(true);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleAttemptCheck = () => {
    if (!hasScrolledToBottom && !checked) {
      toast.info('Debes abrir el documento y leerlo hasta el final para poder aceptar los términos.', {
        action: {
          label: 'Abrir Documento',
          onClick: handleOpenModal,
        },
      });
      setIsModalOpen(true);
      return;
    }
    onChange(!checked);
  };

  const termsHtml = field.termsContent || '<p class="text-muted-foreground italic">Términos y condiciones del formulario.</p>';
  const consentText = field.consentLabel || 'He leído, comprendo y acepto los términos y condiciones anteriores';

  return (
    <div className="w-full space-y-3 pt-1">
      {/* Document Preview Card */}
      <div
        className={`group relative overflow-hidden transition-all duration-200 border shadow-xs ${isDark
          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          : 'bg-white/95 border-stone-200/90 hover:border-forest/30'
          } ${getRadiusClass(borderRadius, 'card')}`}
      >
        {/* Card Header Bar */}
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b text-xs font-semibold ${isDark
            ? 'bg-slate-950/60 border-slate-800 text-slate-300'
            : 'bg-stone-50/80 border-stone-100 text-stone-700'
            }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`p-1 text-white shrink-0 shadow-2xs ${getRadiusClass(borderRadius, 'icon')}`}
              style={{ backgroundColor: themeColor }}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <span className="truncate font-bold text-xs">
              {field.label || 'Documento de Términos y Condiciones'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold transition-all shadow-2xs hover:scale-102 active:scale-98 cursor-pointer shrink-0 ${getRadiusClass(borderRadius, 'button')}`}
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(27,59,43,0.08)',
              color: isDark ? '#ffffff' : themeColor,
            }}
          >
            <Maximize2 className="w-3 h-3" />
            <span>Abrir documento</span>
          </button>
        </div>

        {/* Truncated Document Body with Gradient Fade */}
        <div
          onClick={handleOpenModal}
          className="relative px-4 sm:px-5 py-3.5 cursor-pointer select-none"
          style={{
            maxHeight: field.maxHeight && field.maxHeight !== 'none' ? field.maxHeight : '130px',
            overflow: 'hidden',
          }}
        >
          <div
            className={`prose prose-xs sm:prose-sm max-w-none text-xs sm:text-sm leading-relaxed pointer-events-none line-clamp-4 ${isDark ? 'prose-invert text-slate-300' : 'text-stone-700'
              }`}
            dangerouslySetInnerHTML={{ __html: termsHtml }}
          />

          {/* Fade-out Overlay */}
          <div
            className={`absolute inset-x-0 bottom-0 h-16 flex items-end justify-center pb-2.5 transition-opacity ${isDark
              ? 'bg-gradient-to-t from-slate-900 via-slate-900/85 to-transparent'
              : 'bg-gradient-to-t from-white via-white/85 to-transparent'
              }`}
          >
            <span
              className={`text-[11px] sm:text-xs font-bold flex items-center gap-1.5 px-3 py-1 shadow-2xs border backdrop-blur-xs ${getRadiusClass(borderRadius, 'badge')}`}
              style={{
                backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)',
                color: themeColor,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(27,59,43,0.15)',
              }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Haz clic aquí para abrir y leer el documento</span>
            </span>
          </div>
        </div>
      </div>

      {/* Acceptance Status & Checkbox */}
      {!hasScrolledToBottom && !checked ? (
        <div
          onClick={handleOpenModal}
          className={`flex items-center justify-between gap-3 p-3.5 border transition-all cursor-pointer select-none ${isDark
            ? 'bg-slate-900/50 border-amber-500/30 hover:bg-slate-900 hover:border-amber-500/50'
            : 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300'
            } ${getRadiusClass(borderRadius, 'card')}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 ${getRadiusClass(borderRadius, 'icon')}`}>
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <span>Lectura obligatoria requerida</span>
                {field.required && <span className="text-rose-500 font-bold">*</span>}
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 truncate">
                Abre el documento y desplázate hasta el final para habilitar la casilla de aceptación.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal();
            }}
            className={`px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:scale-102 active:scale-98 transition-all shrink-0 flex items-center gap-1 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
            style={{ backgroundColor: themeColor }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leer y Aceptar</span>
            <span className="sm:hidden">Leer</span>
          </button>
        </div>
      ) : (
        <label
          className={`flex items-start gap-3 p-3.5 border cursor-pointer select-none transition-all ${checked
            ? isDark
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-2xs'
              : 'bg-emerald-50/90 border-emerald-300 shadow-2xs'
            : isDark
              ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900'
              : 'bg-white border-stone-200 hover:bg-stone-50/80'
            } ${getRadiusClass(borderRadius, 'card')}`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={`w-4 h-4 mt-0.5 cursor-pointer shrink-0 ${getRadiusClass(borderRadius, 'badge')}`}
            style={{ accentColor: themeColor }}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <span
              className={`text-xs sm:text-sm font-semibold leading-snug block ${checked
                ? isDark
                  ? 'text-emerald-300'
                  : 'text-emerald-950 font-bold'
                : isDark
                  ? 'text-slate-200'
                  : 'text-stone-800'
                }`}
            >
              {consentText}
              {field.required && <span className="text-rose-500 font-bold ml-1">*</span>}
            </span>

            {checked ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Documento leído y consentimiento otorgado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <span>Lectura completada. Marca la casilla para confirmar.</span>
              </span>
            )}
          </div>
        </label>
      )}

      {/* Fullscreen Document Reader Modal Portal */}
      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
          >
            <div
              className={`w-full max-w-4xl h-[92vh] max-h-[860px] flex flex-col shadow-2xl overflow-hidden border transition-all animate-in zoom-in-95 duration-200 ${isDark
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-white border-stone-200 text-stone-900'
                } ${getRadiusClass(borderRadius, 'card')}`}
            >
              {/* Modal Header */}
              <div
                className={`px-5 sm:px-8 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-stone-50 border-stone-200'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 flex items-center justify-center text-white shrink-0 shadow-2xs ${getRadiusClass(borderRadius, 'icon')}`}
                    style={{ backgroundColor: themeColor }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Documento Oficial / Lectura Requerida
                    </span>
                    <h2
                      id="terms-modal-title"
                      className="text-base sm:text-lg font-bold font-display truncate text-forest dark:text-emerald-400"
                    >
                      {field.label || 'Términos y Condiciones'}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`p-2 border transition-colors cursor-pointer shrink-0 ${isDark
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                    : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700 shadow-2xs'
                    } ${getRadiusClass(borderRadius, 'button')}`}
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Notice Banner under header */}
              <div
                className={`px-5 sm:px-8 py-2.5 border-b text-xs flex items-center justify-between gap-3 shrink-0 transition-colors ${hasScrolledToBottom
                  ? isDark
                    ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : isDark
                    ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {hasScrolledToBottom ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="font-medium truncate">
                    {hasScrolledToBottom
                      ? 'Has llegado al final del documento. Ya puedes marcar la casilla y confirmar tu aceptación.'
                      : 'Desplázate con el scroll hasta el final del documento para desbloquear el botón de aceptación.'}
                  </span>
                </div>

                {!hasScrolledToBottom && (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 shrink-0 animate-bounce">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desplázate hacia abajo</span>
                  </span>
                )}
              </div>

              {/* Modal Document Body (Scrollable Reader) */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto px-6 sm:px-12 py-6 sm:py-8 overscroll-contain relative custom-scrollbar ${isDark ? 'bg-slate-900/60' : 'bg-[#fafaf9]'
                  }`}
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Rendered Rich Document Content */}
                  <div
                    className={`prose sm:prose-base max-w-none leading-relaxed break-words ${isDark ? 'prose-invert text-slate-200' : 'text-stone-800'
                      }`}
                    dangerouslySetInnerHTML={{ __html: termsHtml }}
                  />

                  {/* End of Document Mark */}
                  <div className="pt-8 pb-4 text-center border-t border-forest/10 mt-10">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold ${getRadiusClass(borderRadius, 'badge')}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Fin del documento</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Action Bar */}
              <div
                className={`p-4 sm:px-8 sm:py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-stone-200'
                  }`}
              >
                {/* Modal Checkbox */}
                <label
                  className={`flex items-center gap-2.5 select-none text-xs sm:text-sm font-semibold transition-opacity ${!hasScrolledToBottom ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                >
                  <input
                    type="checkbox"
                    disabled={!hasScrolledToBottom}
                    checked={checked}
                    onChange={(e) => {
                      if (!hasScrolledToBottom) return;
                      onChange(e.target.checked);
                    }}
                    className={`w-4 h-4 cursor-pointer shrink-0 disabled:cursor-not-allowed ${getRadiusClass(borderRadius, 'badge')}`}
                    style={{ accentColor: themeColor }}
                  />
                  <span className={checked ? (isDark ? 'text-emerald-400' : 'text-emerald-900 font-bold') : ''}>
                    {consentText}
                  </span>
                </label>

                {/* Buttons */}
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={!hasScrolledToBottom}
                    onClick={() => {
                      if (!hasScrolledToBottom) return;
                      onChange(true);
                      setIsModalOpen(false);
                      toast.success('Has aceptado los términos y condiciones');
                    }}
                    className={`px-5 py-2 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed ${getRadiusClass(borderRadius, 'button')}`}
                    style={{ backgroundColor: themeColor }}
                    title={!hasScrolledToBottom ? 'Debes desplazarte hasta el final del documento' : 'Aceptar y Continuar'}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Aceptar y Continuar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

