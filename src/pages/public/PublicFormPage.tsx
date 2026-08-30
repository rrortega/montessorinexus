import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getPublicStandaloneForm, 
  requestStandaloneFormOTP, 
  verifyStandaloneFormOTP, 
  submitStandaloneForm,
  deleteStandaloneFormSubmission,
  PublicStandaloneFormItem,
  FormFieldItem,
  FormFieldType,
  KycDocumentVariant,
  evaluateFieldCondition,
  evaluateFieldInvalidation,
  extractDocumentDataOcr
} from '@/lib/sqlite';
import { initFormSession, getFormSubmissionTelemetry } from '@/lib/form-telemetry';
import { 
  DocumentCaptureWidget, 
  KycCaptureSide, 
  KycDocumentValue 
} from '@/components/public/DocumentCaptureWidget';
import {
  SelfieLivenessWidget,
  SelfieLivenessValue,
  SelfieCaptureSide
} from '@/components/public/SelfieLivenessWidget';
import {
  IdentityVerificationWidget
} from '@/components/public/IdentityVerificationWidget';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ChevronUp, 
  ChevronDown, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  RefreshCw, 
  PenTool, 
  Eraser,
  School,
  Send,
  Maximize2,
  Minimize2,
  Trash2,
  X,
  Sun,
  Moon,
  Globe,
  RotateCcw,
  User,
  LogOut,
  MoreVertical,
  Camera,
  ScanLine,
  Eye,
  FileImage,
  ZoomIn,
  CreditCard,
  BookOpen,
  Car,
  Loader2,
  BarChart3
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { TermsConsentWidget } from '@/components/public/TermsConsentWidget';
import { ScheduleEventWidget, ScheduleEventValue } from '@/components/public/ScheduleEventWidget';
import { convertFileToOptimizedDataUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { getDeepstreamClient } from '@/lib/deepstream';

export const FORM_I18N = {
  es: {
    stepOf: (curr: number, total: number) => `Paso ${curr} de ${total}`,
    questionOf: (curr: number, total: number) => `${curr} / ${total}`,
    tapToSign: 'Toca aquí para firmar',
    signatureCaptured: 'Firma Capturada',
    clearSignature: 'Borrar firma',
    resignFullScreen: 'Volver a firmar en Pantalla Completa',
    uploadPrompt: 'Subir documento o fotografía',
    uploadSub: 'Haz clic para seleccionar un archivo desde tu dispositivo',
    fileReady: 'Archivo Listo',
    fileUploadedSuccess: 'Documento cargado correctamente',
    remove: 'Quitar',
    selectFile: 'Seleccionar Archivo',
    changeFile: 'Cambiar archivo',
    browseFile: 'Examinar archivo',
    dragOrSelect: 'Selecciona o arrastra el archivo',
    accept: 'Aceptar ↵',
    continue: 'Continuar ↵',
    pressEnter: 'Presiona Enter ↵',
    next: 'Siguiente',
    back: 'Anterior',
    submit: 'Enviar Formulario',
    submitComplete: 'Enviar Formulario Completo',
    draftAutosaved: 'Borrador guardado automáticamente',
    prevQuestion: 'Pregunta anterior',
    nextQuestion: 'Siguiente pregunta',
    clearCanvas: 'Limpiar Lienzo',
    confirmSignature: 'Confirmar y Guardar Firma',
    fullscreenSig: 'Lienzo de Firma Digital en Pantalla Completa',
    sigInstructions: 'Dibuja tu firma con tu dedo, lápiz táctil o ratón dentro del recuadro blanco',
    sigRequired: (label: string) => `La firma para "${label}" es obligatoria`,
    fileRequired: (label: string) => `El archivo para "${label}" es obligatorio`,
    fieldRequired: (label: string) => `Por favor completa: "${label}"`,
    yes: 'Sí',
    no: 'No',
    officialForm: 'Formulario Oficial',
    senderName: 'Tu nombre y apellidos',
    senderNamePlaceholder: 'Ej. María Elena Morales',
    senderEmail: 'Tu correo electrónico',
    senderEmailPlaceholder: 'ejemplo@correo.com',
    optional: 'Opcional',
    restrictedTitle: 'Acceso Seguro Restringido',
    restrictedDescEmail: 'Este formulario requiere autorización previa. Ingresa tu correo para verificar tu acceso.',
    restrictedDescOtp: (email: string) => `Ingresa el código de 6 dígitos que enviamos a ${email}.`,
    authorizedEmailLabel: 'Correo Electrónico Autorizado',
    verifyAndReceiveCode: 'Verificar Acceso y Recibir Código',
    securityCodeLabel: 'Código de Seguridad (6 Dígitos)',
    validateCodeAndEnter: 'Validar Código y Entrar',
    changeEmail: 'Cambiar correo',
    resendCode: 'Reenviar código',
    protectedBy: 'Protegido por el portal de admisiones y gestión Ceiba Roots',
    notAvailable: 'Formulario no disponible',
    goToHome: 'Ir a la página principal',
    submittedTitle: '¡Formulario Enviado con Éxito!',
    submittedDesc: (title: string) => `Tu respuesta para "${title}" ha sido registrada correctamente en el sistema institucional.`,
    regDate: 'Fecha de registro:',
    regBy: 'Enviado por:',
    statusLabel: 'Estado:',
    statusCompleted: 'Completado y Recibido',
    safeToClose: 'Puedes cerrar esta pestaña de forma segura.',
    resetForm: 'Reiniciar Formulario',
    resetTooltip: 'Reiniciar y borrar respuestas',
    submitAnother: 'Enviar otra respuesta',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    language: 'Idioma',
    cancel: 'Cancelar',
    curpVerifying: 'Espere mientras lo validamos con fuentes oficiales'
  },
  en: {
    stepOf: (curr: number, total: number) => `Step ${curr} of ${total}`,
    questionOf: (curr: number, total: number) => `${curr} / ${total}`,
    tapToSign: 'Tap here to sign',
    signatureCaptured: 'Signature Captured',
    clearSignature: 'Clear signature',
    resignFullScreen: 'Sign again in Full Screen',
    uploadPrompt: 'Upload document or photo',
    uploadSub: 'Click to select a file from your device',
    fileReady: 'File Ready',
    fileUploadedSuccess: 'Document uploaded successfully',
    remove: 'Remove',
    selectFile: 'Select File',
    changeFile: 'Change file',
    browseFile: 'Browse file',
    dragOrSelect: 'Select or drag file',
    accept: 'OK ↵',
    continue: 'Continue ↵',
    pressEnter: 'Press Enter ↵',
    next: 'Next',
    back: 'Back',
    submit: 'Submit Form',
    submitComplete: 'Submit Complete Form',
    draftAutosaved: 'Draft autosaved',
    prevQuestion: 'Previous question',
    nextQuestion: 'Next question',
    clearCanvas: 'Clear Canvas',
    confirmSignature: 'Confirm & Save Signature',
    fullscreenSig: 'Full Screen Digital Signature Canvas',
    sigInstructions: 'Draw your signature with your finger, stylus, or mouse inside the white box',
    sigRequired: (label: string) => `Signature for "${label}" is required`,
    fileRequired: (label: string) => `File for "${label}" is required`,
    fieldRequired: (label: string) => `Please complete: "${label}"`,
    yes: 'Yes',
    no: 'No',
    officialForm: 'Official Form',
    senderName: 'Your Full Name',
    senderNamePlaceholder: 'e.g. Mary Elena Morales',
    senderEmail: 'Your Email Address',
    senderEmailPlaceholder: 'name@example.com',
    optional: 'Optional',
    restrictedTitle: 'Restricted Secure Access',
    restrictedDescEmail: 'This form requires prior authorization. Enter your email to verify your access.',
    restrictedDescOtp: (email: string) => `Enter the 6-digit code sent to ${email}.`,
    authorizedEmailLabel: 'Authorized Email Address',
    verifyAndReceiveCode: 'Verify Access & Send Code',
    securityCodeLabel: 'Security Code (6 Digits)',
    validateCodeAndEnter: 'Validate Code & Enter',
    changeEmail: 'Change email',
    resendCode: 'Resend code',
    protectedBy: 'Protected by Ceiba Roots admissions & management system',
    notAvailable: 'Form not available',
    goToHome: 'Go to Home Page',
    submittedTitle: 'Form Submitted Successfully!',
    submittedDesc: (title: string) => `Your response for "${title}" has been securely recorded in our institutional system.`,
    regDate: 'Registration date:',
    regBy: 'Submitted by:',
    statusLabel: 'Status:',
    statusCompleted: 'Completed & Received',
    safeToClose: 'You may safely close this tab.',
    resetForm: 'Reset Form',
    resetTooltip: 'Reset form and clear answers',
    submitAnother: 'Submit another response',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    cancel: 'Cancel',
    curpVerifying: 'Please wait while we validate it with official sources'
  }
};

export const getFormWidgetRadiusClass = (radius: string, type: 'button' | 'input' | 'card' | 'avatar' = 'input') => {
  switch (radius) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return type === 'avatar' ? 'rounded-xs' : type === 'button' ? 'rounded-sm' : type === 'input' ? 'rounded-sm' : 'rounded-md';
    case 'md':
      return type === 'avatar' ? 'rounded-sm' : type === 'button' ? 'rounded-md' : type === 'input' ? 'rounded-md' : 'rounded-lg';
    case 'xl':
      return type === 'avatar' ? 'rounded-md' : type === 'button' ? 'rounded-xl' : type === 'input' ? 'rounded-xl' : 'rounded-2xl';
    case '2xl':
      return type === 'avatar' ? 'rounded-lg' : type === 'button' ? 'rounded-2xl' : type === 'input' ? 'rounded-2xl' : 'rounded-3xl';
    case '3xl':
      return type === 'avatar' ? 'rounded-xl' : type === 'button' ? 'rounded-3xl' : type === 'input' ? 'rounded-3xl' : 'rounded-3xl';
    case 'full':
      return type === 'card' ? 'rounded-3xl' : 'rounded-full';
    case 'lg':
    default:
      return type === 'avatar' ? 'rounded-sm' : type === 'button' ? 'rounded-lg' : type === 'input' ? 'rounded-lg' : 'rounded-2xl';
  }
};

export const getFormWidgetShadowClass = (shadow: string) => {
  switch (shadow) {
    case 'none': return 'shadow-none';
    case 'medium': return 'shadow-md';
    case 'glow': return 'shadow-lg shadow-forest/20 ring-1 ring-forest/10';
    case 'subtle':
    default:
      return 'shadow-2xs';
  }
};

export const getBorderWeightClass = (weight: string) => {
  switch (weight) {
    case 'thin': return 'border';
    case 'thick': return 'border-[3px]';
    case 'medium':
    default:
      return 'border-2';
  }
};

export const getRadiusClass = getFormWidgetRadiusClass;
export const getShadowClass = getFormWidgetShadowClass;

interface SixDigitOtpBoxesProps {
  value: string;
  onChange: (val: string) => void;
  isDark?: boolean;
  themeColor?: string;
  borderRadius?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

const SixDigitOtpBoxes: React.FC<SixDigitOtpBoxesProps> = ({
  value,
  onChange,
  isDark = false,
  themeColor = '#10b981',
  borderRadius = 'lg',
  autoFocus = true,
  disabled = false
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const safeValue = typeof value === 'string' ? value : String(value ?? '');
  const digits = Array.from({ length: 6 }, (_, i) => safeValue[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('').slice(0, 6);
    onChange(combined);

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, 5);
      inputsRef.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3 my-3 w-full">
      {Array.from({ length: 6 }).map((_, i) => {
        const isFilled = Boolean(digits[i]);
        return (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            value={digits[i]}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-full aspect-square text-center text-2xl sm:text-3xl md:text-4xl font-mono font-bold border-2 transition-all outline-none select-none shadow-xs flex items-center justify-center p-0 ${getRadiusClass(
              borderRadius,
              'input'
            )} ${
              isDark
                ? 'bg-slate-950 text-white border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-300'
            }`}
            style={
              isFilled
                ? {
                    borderColor: themeColor,
                    backgroundColor: isDark ? `${themeColor}15` : `${themeColor}08`
                  }
                : {}
            }
          />
        );
      })}
    </div>
  );
};

interface ResponsiveCustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  isDark?: boolean;
  themeColor?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'box' | 'underlined' | 'bordered' | 'filled';
  borderRadius?: string;
  shadowStyle?: string;
  borderWeight?: string;
}

const ResponsiveCustomSelect: React.FC<ResponsiveCustomSelectProps> = ({
  value,
  onChange,
  options = [],
  placeholder = '-- Seleccionar --',
  label,
  isDark = false,
  themeColor = '#1b3b2b',
  className = '',
  disabled = false,
  variant = 'bordered',
  borderRadius = 'lg',
  shadowStyle = 'subtle',
  borderWeight = 'medium'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [pullOffset, setPullOffset] = useState<number>(0);

  // Handle open / close animation lifecycle on mobile
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on outside click (Desktop)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Pull-down gesture handlers on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setPullOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setPullOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (pullOffset > 60) {
      setIsOpen(false);
    }
    touchStartY.current = null;
    setPullOffset(0);
  };

  const handleSelectOption = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  const getSelectRadiusClass = (r: string) => {
    switch (r) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-lg';
      case 'md': return 'rounded-xl';
      case 'full': return 'rounded-full';
      case 'lg':
      default:
        return 'rounded-2xl';
    }
  };

  const getSelectShadowClass = (s: string) => {
    switch (s) {
      case 'none': return 'shadow-none';
      case 'medium': return 'shadow-md';
      case 'glow': return 'shadow-lg shadow-forest/20 ring-1 ring-forest/10';
      case 'subtle':
      default:
        return 'shadow-2xs';
    }
  };

  const getSelectWeightClass = (w: string) => {
    switch (w) {
      case 'thin': return 'border';
      case 'thick': return 'border-[3px]';
      case 'medium':
      default:
        return 'border-2';
    }
  };

  const getTriggerClassAndStyle = () => {
    if (variant === 'underlined') {
      return {
        className: `w-full bg-transparent border-b-2 px-1 py-2.5 sm:py-3 text-base sm:text-xl font-medium flex items-center justify-between gap-2 transition-all outline-none text-left ${
          isDark 
            ? 'text-white border-slate-700 focus:border-slate-300' 
            : 'text-slate-900 border-slate-300 focus:border-slate-900'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`,
        style: { borderBottomColor: themeColor }
      };
    }
    if (variant === 'filled') {
      return {
        className: `w-full ${getSelectRadiusClass(borderRadius)} ${getSelectShadowClass(shadowStyle)} border border-slate-200/80 p-3 sm:p-3.5 text-sm sm:text-base font-semibold flex items-center justify-between gap-2 transition-all outline-none focus:ring-2 focus:ring-slate-400 text-left ${
          isDark 
            ? 'bg-slate-800/90 text-white border-slate-700/80 hover:bg-slate-800' 
            : 'bg-slate-100/90 text-slate-800 border-slate-200/90 hover:bg-slate-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`,
        style: {}
      };
    }
    // 'bordered' / 'box'
    return {
      className: `w-full bg-white dark:bg-slate-900 ${getSelectRadiusClass(borderRadius)} ${getSelectShadowClass(shadowStyle)} ${getSelectWeightClass(borderWeight)} p-3 sm:p-3.5 text-sm sm:text-base font-semibold flex items-center justify-between gap-2 transition-all outline-none focus:ring-2 focus:ring-slate-400 text-left ${
        isDark 
          ? 'text-white border-slate-700 hover:border-slate-500' 
          : 'text-slate-800 border-slate-300 hover:border-slate-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`,
      style: { borderColor: `${themeColor}60` }
    };
  };

  const triggerConfig = getTriggerClassAndStyle();

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={triggerConfig.className}
        style={triggerConfig.style}
      >
        <span className={`truncate ${!value ? (isDark ? 'text-slate-600' : 'text-slate-400') : ''}`}>
          {value || placeholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
          style={variant === 'underlined' ? { color: themeColor } : {}}
        />
      </button>

      {/* Desktop Dropdown Popover */}
      {isOpen && (
        <div className={`hidden md:block absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border shadow-2xl backdrop-blur-md p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-150 ${
          isDark ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
        }`}>
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">Sin opciones disponibles</div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = value === opt;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between text-left transition-colors cursor-pointer ${
                    isSelected
                      ? isDark ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-900 font-bold'
                      : isDark ? 'hover:bg-slate-800/60 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  style={isSelected ? { color: themeColor } : {}}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" style={{ color: themeColor }} />}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Mobile Drawer / Bottom Sheet via Portal (Always on top of everything) */}
      {isMounted && typeof document !== 'undefined' && createPortal(
        <div 
          className={`md:hidden fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-end justify-center transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={`w-full ${borderRadius === 'none' ? 'rounded-none' : 'rounded-t-3xl'} border-t p-5 pb-8 shadow-2xl space-y-4 max-h-[90dvh] flex flex-col transition-transform duration-300 ease-out transform ${
              isVisible ? 'translate-y-0' : 'translate-y-full'
            } ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
            style={pullOffset > 0 ? { transform: `translateY(${pullOffset}px)`, transition: 'none' } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull-down Drag Handle with isolated touch gesture */}
            <div 
              className="w-full py-1.5 flex justify-center cursor-grab active:cursor-grabbing shrink-0 touch-none select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Sheet Header */}
            <div className="flex items-center justify-between pt-1 border-b pb-3 border-slate-100 dark:border-slate-800 shrink-0">
              <div className="min-w-0 pr-2">
                <h4 className="font-bold text-sm sm:text-base font-display truncate">
                  {label || placeholder || 'Seleccionar opción'}
                </h4>
                <p className="text-[11px] text-muted-foreground">Elige una de las opciones disponibles</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Options List */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 overscroll-contain">
              {options.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Sin opciones disponibles</div>
              ) : (
                options.map((opt, idx) => {
                  const isSelected = value === opt;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-3.5 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-between text-left transition-all border cursor-pointer active:scale-98 ${
                        isSelected
                          ? isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-300 text-slate-900 font-bold shadow-xs'
                          : isDark
                          ? 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/40'
                          : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-100/70'
                      }`}
                      style={isSelected ? { borderColor: themeColor, color: themeColor } : {}}
                    >
                      <span className="truncate pr-2">{opt}</span>
                      {isSelected ? (
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: themeColor }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};


interface FormRangeWidgetProps {
  field: FormFieldItem;
  value: any;
  onChange: (val: string) => void;
  themeColor: string;
  isDark: boolean;
  borderRadius?: string;
  disabled?: boolean;
}

export const FormRangeWidget: React.FC<FormRangeWidgetProps> = ({
  field,
  value,
  onChange,
  themeColor,
  isDark,
  borderRadius = 'lg',
  disabled = false
}) => {
  const minVal = field.min !== undefined ? field.min : 0;
  const maxVal = field.max !== undefined ? field.max : 10;
  const stepVal = field.step !== undefined ? field.step : 1;
  const currentVal = value !== undefined ? Number(value) : (field.defaultValue !== undefined ? Number(field.defaultValue) : minVal);

  return (
    <div className={`p-5 sm:p-6 border space-y-4 shadow-2xs ${getRadiusClass(borderRadius, 'card')} ${
      isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          {field.minLabel || `Mínimo: ${minVal}`}
        </span>
        <div 
          className="px-4 py-1 rounded-full text-white text-xs sm:text-sm font-bold font-mono shadow-xs"
          style={{ backgroundColor: themeColor }}
        >
          {currentVal} {field.unit || ''}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {field.maxLabel || `Máximo: ${maxVal}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const nextVal = Math.max(minVal, currentVal - stepVal);
            onChange(String(nextVal));
          }}
          disabled={disabled || currentVal <= minVal}
          className={`w-8 h-8 flex items-center justify-center font-bold text-sm border transition-all cursor-pointer disabled:opacity-30 ${getRadiusClass(borderRadius, 'button')} ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
          }`}
        >
          -
        </button>
        <input
          type="range"
          disabled={disabled}
          min={minVal}
          max={maxVal}
          step={stepVal}
          value={currentVal}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: themeColor }}
        />
        <button
          type="button"
          onClick={() => {
            const nextVal = Math.min(maxVal, currentVal + stepVal);
            onChange(String(nextVal));
          }}
          disabled={disabled || currentVal >= maxVal}
          className={`w-8 h-8 flex items-center justify-center font-bold text-sm border transition-all cursor-pointer disabled:opacity-30 ${getRadiusClass(borderRadius, 'button')} ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
};

interface FocusRangeWidgetProps {
  field: FormFieldItem;
  value: any;
  onChange: (val: string) => void;
  isOutgoing?: boolean;
  themeColor: string;
  isDark: boolean;
  borderRadius?: string;
}

export const FocusRangeWidget: React.FC<FocusRangeWidgetProps> = ({
  field,
  value,
  onChange,
  isOutgoing = false,
  themeColor,
  isDark,
  borderRadius = 'lg'
}) => {
  const minVal = field.min !== undefined ? field.min : 0;
  const maxVal = field.max !== undefined ? field.max : 10;
  const stepVal = field.step !== undefined ? field.step : 1;
  const currentVal = value !== undefined ? Number(value) : (field.defaultValue !== undefined ? Number(field.defaultValue) : minVal);

  return (
    <div className="w-full max-w-xl mx-auto py-6 sm:py-8 space-y-8">
      {/* Large Value Display */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div 
          className="px-7 sm:px-9 py-3 rounded-2xl text-white text-3xl sm:text-4xl font-black font-mono shadow-xl transition-transform hover:scale-105 flex items-baseline gap-1.5"
          style={{ backgroundColor: themeColor }}
        >
          <span>{currentVal}</span>
          {field.unit && <span className="text-sm sm:text-base font-sans font-bold opacity-80">{field.unit}</span>}
        </div>
      </div>

      {/* Range Slider Track & Step Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isOutgoing) return;
              const nextVal = Math.max(minVal, currentVal - stepVal);
              onChange(String(nextVal));
            }}
            disabled={isOutgoing || currentVal <= minVal}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-base sm:text-lg border transition-all cursor-pointer disabled:opacity-30 ${getRadiusClass(borderRadius, 'button')} ${
              isDark ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            -
          </button>

          <div className="flex-1 relative flex items-center py-2">
            <input
              type="range"
              disabled={isOutgoing}
              min={minVal}
              max={maxVal}
              step={stepVal}
              value={currentVal}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-3.5 bg-slate-200/80 dark:bg-slate-800 rounded-full appearance-none cursor-pointer transition-all"
              style={{ accentColor: themeColor }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (isOutgoing) return;
              const nextVal = Math.min(maxVal, currentVal + stepVal);
              onChange(String(nextVal));
            }}
            disabled={isOutgoing || currentVal >= maxVal}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-base sm:text-lg border transition-all cursor-pointer disabled:opacity-30 ${getRadiusClass(borderRadius, 'button')} ${
              isDark ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            +
          </button>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-muted-foreground px-1">
          <div className="flex flex-col items-start">
            <span className="font-mono">{minVal}</span>
            {field.minLabel && <span className="text-[11px] font-normal">{field.minLabel}</span>}
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono">{maxVal}</span>
            {field.maxLabel && <span className="text-[11px] font-normal">{field.maxLabel}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

import { decodeCurp, validateNameAgainstCurp, DecodedCurp } from '@/lib/curpUtils';

function isCurpFallbackComplete(field: any, formData: Record<string, any>): boolean {
  if (!field || !field.verifyCurp) return true;
  if (field.curpFallbackStrategy === 'silent_pass') return true;
  const fallbackData = formData[`${field.id}_fallback`] || {};
  const firstName = (fallbackData.firstName || '').trim();
  const paternal = (fallbackData.paternalLastName || '').trim();
  const maternal = (fallbackData.maternalLastName || '').trim();
  return firstName.length > 0 && paternal.length > 0 && maternal.length > 0;
}

const CurpIdentityCard = ({ 
  details, 
  onClear,
  themeColor = '#1b3b2b',
  borderRadius = 'lg',
  isDark = false
}: { 
  details: any; 
  onClear?: () => void;
  themeColor?: string;
  borderRadius?: string;
  isDark?: boolean;
}) => {
  const cardRadius = borderRadius === 'none' ? 'rounded-none' : 'rounded-2xl';
  const innerRadius = borderRadius === 'none' ? 'rounded-none' : 'rounded-xl';
  const badgeRadius = borderRadius === 'none' ? 'rounded-none' : 'rounded-full';
  const buttonRadius = borderRadius === 'none' ? 'rounded-none' : 'rounded-lg';

  return (
    <div className={`relative overflow-hidden w-full max-w-2xl mx-auto mt-4 border shadow-md p-6 transition-all hover:shadow-lg animate-in fade-in duration-300 ${cardRadius} ${
      isDark 
        ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
        : 'bg-linear-to-br from-stone-50 via-white to-stone-100/80 border-stone-200 text-stone-850'
    }`}>
      {/* Top accent ribbon using themeColor */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: themeColor }} />
      
      {/* Header */}
      <div className={`flex justify-between items-start mb-5 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-stone-100'}`}>
        <div>
          <span className={`text-[10px] tracking-wider font-bold uppercase block leading-none mb-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
            Estados Unidos Mexicanos
          </span>
          <h4 className={`text-xs font-extrabold uppercase tracking-tight ${isDark ? 'text-slate-200' : 'text-stone-850'}`}>
            Registro Nacional de Población
          </h4>
        </div>
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-0.5 border ${badgeRadius} ${
            isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-bold tracking-wide uppercase">Verificado</span>
        </div>
      </div>
      
      {/* Body content (Grid layout for personal vs registration data) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Side: Avatar and Personal Data */}
        <div className={`md:col-span-7 flex gap-4 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-4 ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
          {/* Profile Avatar */}
          <div className={`flex flex-col items-center justify-center border w-20 h-24 shrink-0 overflow-hidden relative ${innerRadius} ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-stone-100 border-stone-200'
          }`}>
            <svg className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-stone-400'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0 1 12.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
            </svg>
            <div 
              className="absolute bottom-0 left-0 right-0 text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-wider"
              style={{ backgroundColor: themeColor }}
            >
              Oficial
            </div>
          </div>
          
          {/* Personal Data */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>
                Nombre Completo
              </span>
              <span className={`text-sm font-bold uppercase tracking-tight block truncate ${isDark ? 'text-slate-100' : 'text-stone-850'}`}>
                {details.nombre} {details.apellidoPaterno} {details.apellidoMaterno}
              </span>
            </div>
            
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>
                CURP
              </span>
              <span className={`text-xs font-mono font-bold tracking-wider px-1.5 py-0.5 border inline-block uppercase ${innerRadius} ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-stone-50 border-stone-200/70 text-stone-800'
              }`}>
                {details.curp}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-0.5">
              <div>
                <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>Fecha de Nac.</span>
                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-stone-750'}`}>{details.fechaNacimiento}</span>
              </div>
              <div>
                <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>Sexo</span>
                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-stone-750'}`}>{details.sexo}</span>
              </div>
              <div>
                <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>Nacionalidad</span>
                <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-300' : 'text-stone-750'}`}>{details.nacionalidad || 'MEXICANA'}</span>
              </div>
              <div>
                <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>Entidad de Nac.</span>
                <span className={`text-[10px] font-bold uppercase truncate block ${isDark ? 'text-slate-300' : 'text-stone-755'}`}>{details.estadoNacimiento}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Probative Document Details */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-2.5">
          <div>
            <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-stone-450'}`}>
              Datos de Registro
            </span>
            <div className={`border p-3 space-y-2 ${innerRadius} ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-stone-50 border-stone-150'
            }`}>
              <div>
                <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>Doc. Probatorio</span>
                <span className={`text-[10px] font-bold uppercase block truncate ${isDark ? 'text-slate-200' : 'text-stone-700'}`}>
                  {details.documentoProbatorio || 'ACTA DE NACIMIENTO'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>Año de Reg.</span>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-200' : 'text-stone-700'}`}>{details.anioRegistro || 'N/D'}</span>
                </div>
                <div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>Num. Acta / Folio</span>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-200' : 'text-stone-700'}`}>{details.numActa || 'N/D'}</span>
                </div>
              </div>
              <div>
                <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>Entidad / Municipio de Reg.</span>
                <span className={`text-[9px] font-bold uppercase block truncate ${isDark ? 'text-slate-200' : 'text-stone-700'}`}>
                  {details.entidadRegistro ? `${details.entidadRegistro} - ${details.municipioRegistro || ''}` : 'N/D'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Official seal */}
      <div className={`mt-5 border-t pt-3 flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-stone-100'}`}>
        <div className={`flex items-center gap-1 text-[8px] font-medium ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>
          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: themeColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Validación oficial del Registro Civil mexicano (RENAPO)</span>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className={`text-[9px] font-bold text-rose-500 hover:text-rose-600 hover:underline transition-colors cursor-pointer ${buttonRadius}`}
          >
            Modificar CURP
          </button>
        )}
      </div>
    </div>
  );
};

export const PublicFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Dark Mode and Language (I18n) State
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cr_form_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [formLocale, setFormLocale] = useState<'es' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ceiba-locale');
      if (saved === 'en' || saved === 'es') return saved;
    }
    return 'es';
  });

  const isDark = themeMode === 'dark';
  const txt = FORM_I18N[formLocale];

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('cr_form_theme', next);
  };

  const toggleLocale = () => {
    const next = formLocale === 'es' ? 'en' : 'es';
    setFormLocale(next);
    localStorage.setItem('ceiba-locale', next);
  };

  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formItem, setFormItem] = useState<PublicStandaloneFormItem | null>(null);

  // OTP Authentication State (for restricted forms)
  const [authStep, setAuthStep] = useState<'email' | 'otp' | 'authorized'>('email');
  const [emailInput, setEmailInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return user?.email || localStorage.getItem('cr_form_verified_email') || localStorage.getItem('cr_respondent_email') || '';
    }
    return user?.email || '';
  });
  const [otpInput, setOtpInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return user?.email || localStorage.getItem('cr_form_verified_email') || '';
    }
    return user?.email || '';
  });
  const [sessionToken, setSessionToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cr_form_session_token') || '';
    }
    return '';
  });

  // Form Filling State
  const [currentStep, setCurrentStep] = useState(0);
  const [typeformIndex, setTypeformIndex] = useState(0);
  const [outgoingTypeformIndex, setOutgoingTypeformIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 340);
  };
  const [formData, setFormData] = useState<Record<string, any>>({});

  // CURP official verification state and helper
  const [curpVerificationState, setCurpVerificationState] = useState<Record<string, { success: boolean; message: string; details?: any }>>({});
  const [isVerifyingCurp, setIsVerifyingCurp] = useState(false);
  const [curpStatusMsg, setCurpStatusMsg] = useState('Espere mientras lo validamos con fuentes oficiales');
  const [curpCountdown, setCurpCountdown] = useState<number | null>(null);

  const handleVerifyCurp = async (fieldId: string, curpVal: string) => {
    if (!curpVal) return;
    setIsVerifyingCurp(true);
    setCurpVerificationState(prev => ({ ...prev, [fieldId]: undefined }));

    const targetField = allFlatQuestions.find((f: any) => f.id === fieldId);
    const timeoutSeconds = targetField?.curpTimeoutSeconds || 20;
    const timeoutMs = timeoutSeconds * 1000;
    setCurpCountdown(timeoutSeconds);

    const countdownInterval = setInterval(() => {
      setCurpCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const CURP_STEPS_MSGS = [
      'Iniciando consulta oficial...',
      'Buscando registro en RENAPO...',
      'Validando con el Registro Civil...',
      'Verificando autenticidad...',
      'Cargando datos del ciudadano...',
      'Procesando información...'
    ];
    setCurpStatusMsg(CURP_STEPS_MSGS[0]);
    let msgIdx = 0;
    const intervalId = setInterval(() => {
      msgIdx = (msgIdx + 1) % CURP_STEPS_MSGS.length;
      setCurpStatusMsg(CURP_STEPS_MSGS[msgIdx]);
    }, 3000);

    try {
      const response = await fetch('/api/kyc/verify-curp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curp: curpVal })
      });
      const data = await response.json();

      if (data.success && data.jobId) {
        const dsClient = getDeepstreamClient();
        if (dsClient) {
          const jobId = data.jobId;
          const eventName = `kyc-curp-result:${jobId}`;

          console.log(`[CURP VERIFICATION] Enqueued Job ID: ${jobId}. Subscribing to event: ${eventName}`);

          // Parameterized timeout fallback
          const fallbackTimeout = setTimeout(() => {
            console.warn(`[CURP VERIFICATION] Verification timed out after ${timeoutSeconds}s.`);
            clearInterval(intervalId);
            clearInterval(countdownInterval);
            setCurpCountdown(null);
            dsClient.event.unsubscribe(eventName);
            setIsVerifyingCurp(false);
            
            const localDecoded = decodeCurp(curpVal);

            // Auto-fill derivable fields (DOB, Age, Gender, State)
            if (localDecoded && allFlatQuestions && allFlatQuestions.length > 0) {
              setFormData(prev => {
                const updated = { ...prev };
                allFlatQuestions.forEach((f: any) => {
                  const lLower = (f.label || '').toLowerCase();
                  const iLower = (f.id || '').toLowerCase();
                  if (f.type === 'date' && (lLower.includes('nacimiento') || iLower.includes('nacimiento') || lLower.includes('birth') || iLower.includes('birth'))) {
                    updated[f.id] = localDecoded.fechaNacimientoIso;
                  }
                  if ((f.type === 'integer' || f.type === 'decimal' || f.type === 'text') && (lLower.includes('edad') || iLower.includes('edad') || lLower.includes('age') || iLower.includes('age'))) {
                    updated[f.id] = String(localDecoded.edad);
                  }
                  if ((f.type === 'select' || f.type === 'radio' || f.type === 'text') && (lLower.includes('sexo') || iLower.includes('sexo') || lLower.includes('genero'))) {
                    updated[f.id] = localDecoded.sexo === 'HOMBRE' ? 'Masculino' : 'Femenino';
                  }
                  if ((f.type === 'select' || f.type === 'text') && (lLower.includes('entidad') || iLower.includes('entidad') || lLower.includes('estado')) && (lLower.includes('nacimiento') || iLower.includes('nacimiento'))) {
                    updated[f.id] = localDecoded.estadoNacimiento;
                  }
                });
                return updated;
              });
            }

            if (targetField?.curpFallbackStrategy === 'silent_pass') {
              setCurpVerificationState(prev => ({
                ...prev,
                [fieldId]: {
                  success: true,
                  isFallback: true,
                  message: 'Formato de CURP validado correctamente.'
                }
              }));
              toast.info('Formato de CURP validado');
            } else {
              setCurpVerificationState(prev => ({
                ...prev,
                [fieldId]: {
                  success: false,
                  fallbackRequired: true,
                  decoded: localDecoded,
                  message: 'No pudimos conectar con RENAPO en el tiempo estimado. Por favor ingresa los datos faltantes para continuar.'
                }
              }));
            }
          }, timeoutMs);

          dsClient.event.subscribe(eventName, (eventData: any) => {
            clearTimeout(fallbackTimeout);
            clearInterval(intervalId);
            clearInterval(countdownInterval);
            setCurpCountdown(null);
            console.log('[CURP VERIFICATION] Event received:', eventData);
            
            setIsVerifyingCurp(false);
            if (eventData.success && eventData.details && eventData.details.status !== 'FALLBACK_LOCAL') {
              const info = eventData.details;
              const detailMsg = `Verificado: ${info.nombre || ''} ${info.apellidoPaterno || ''} ${info.apellidoMaterno || ''} (${info.sexo || ''}, Nació el ${info.fechaNacimiento || ''} en ${info.estadoNacimiento || ''})`.trim();
              setCurpVerificationState(prev => {
                const wasAlreadyVerified = prev[fieldId]?.success;
                if (!wasAlreadyVerified) {
                  toast.success('CURP verificado con éxito ante RENAPO');
                } else if (info.pdfBase64 && !prev[fieldId]?.details?.pdfBase64) {
                  console.log('[CURP] PDF oficial de RENAPO recibido en segundo plano.');
                }
                return {
                  ...prev,
                  [fieldId]: {
                    success: true,
                    message: detailMsg || prev[fieldId]?.message || 'CURP Verificado',
                    details: {
                      ...(prev[fieldId]?.details || {}),
                      ...info
                    }
                  }
                };
              });

              // Auto-fill other fields on the form
              if (allFlatQuestions && allFlatQuestions.length > 0) {
                setFormData(prev => {
                  const updatedData = { ...prev };
                  allFlatQuestions.forEach((field: any) => {
                    const labelLower = (field.label || '').toLowerCase();
                    const idLower = (field.id || '').toLowerCase();
                    
                    // 1. Full name field
                    if (field.type === 'fullname') {
                      updatedData[field.id] = {
                        firstName: info.nombre || '',
                        paternalLastName: info.apellidoPaterno || '',
                        maternalLastName: info.apellidoMaterno || ''
                      };
                    }
                    
                    // 2. Date of Birth field
                    if (field.type === 'date' && (labelLower.includes('nacimiento') || idLower.includes('nacimiento') || labelLower.includes('birth') || idLower.includes('birth'))) {
                      if (info.fechaNacimiento && info.fechaNacimiento.includes('/')) {
                        const parts = info.fechaNacimiento.split('/');
                        if (parts.length === 3) {
                          const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
                          updatedData[field.id] = formattedDate;
                        }
                      }
                    }
                    
                    // 3. Gender / Sex field
                    if ((field.type === 'select' || field.type === 'radio' || field.type === 'buttonGroup' || field.type === 'text') && 
                        (labelLower.includes('sexo') || idLower.includes('sexo') || labelLower.includes('genero') || labelLower.includes('género'))) {
                      const valSex = info.sexo; // HOMBRE or MUJER
                      if (field.options && field.options.length > 0) {
                        const matchedOpt = field.options.find((opt: any) => {
                          const optVal = (typeof opt === 'string' ? opt : opt.value || opt.label || '').toLowerCase();
                          return optVal === valSex.toLowerCase() || 
                                 (valSex === 'HOMBRE' && (optVal === 'h' || optVal === 'm' || optVal === 'hombre' || optVal === 'masculino')) ||
                                 (valSex === 'MUJER' && (optVal === 'm' || optVal === 'f' || optVal === 'mujer' || optVal === 'femenino'));
                        });
                        if (matchedOpt) {
                          updatedData[field.id] = typeof matchedOpt === 'string' ? matchedOpt : matchedOpt.value || matchedOpt.label;
                        } else {
                          updatedData[field.id] = valSex === 'HOMBRE' ? 'Masculino' : 'Femenino';
                        }
                      } else {
                        updatedData[field.id] = valSex === 'HOMBRE' ? 'HOMBRE' : 'MUJER';
                      }
                    }
                    
                    // 4. State of birth field
                    if ((field.type === 'select' || field.type === 'text') && 
                        (labelLower.includes('entidad') || idLower.includes('entidad') || labelLower.includes('estado') || idLower.includes('estado')) && 
                        (labelLower.includes('nacimiento') || idLower.includes('nacimiento') || labelLower.includes('origen') || idLower.includes('origen'))) {
                      updatedData[field.id] = info.estadoNacimiento;
                    }

                    // 5. File upload field for the CURP PDF
                    if (info.pdfBase64 && 
                        (field.type === 'file_upload' || field.type === 'document' || field.type === 'file') && 
                        (labelLower.includes('curp') || idLower.includes('curp') || labelLower.includes('documento') || idLower.includes('documento'))) {
                      const fileUrl = `data:application/pdf;base64,${info.pdfBase64}`;
                      updatedData[field.id] = fileUrl;
                      
                      setFilesData(filesPrev => ({
                        ...filesPrev,
                        [field.id]: {
                          fileName: 'curp_oficial.pdf',
                          fileUrl: fileUrl,
                          isImage: false,
                          fileSize: `${(info.pdfBase64.length * 0.75 / 1024).toFixed(1)} KB`
                        }
                      }));
                    }
                  });
                  return updatedData;
                });
              }
            } else {
              const targetField = allFlatQuestions.find((f: any) => f.id === fieldId);
              const localDecoded = decodeCurp(curpVal);

              if (localDecoded && allFlatQuestions && allFlatQuestions.length > 0) {
                setFormData(prev => {
                  const updated = { ...prev };
                  allFlatQuestions.forEach((f: any) => {
                    const lLower = (f.label || '').toLowerCase();
                    const iLower = (f.id || '').toLowerCase();
                    if (f.type === 'date' && (lLower.includes('nacimiento') || iLower.includes('nacimiento') || lLower.includes('birth') || iLower.includes('birth'))) {
                      updated[f.id] = localDecoded.fechaNacimientoIso;
                    }
                    if ((f.type === 'integer' || f.type === 'decimal' || f.type === 'text') && (lLower.includes('edad') || iLower.includes('edad') || lLower.includes('age') || iLower.includes('age'))) {
                      updated[f.id] = String(localDecoded.edad);
                    }
                    if ((f.type === 'select' || f.type === 'radio' || f.type === 'text') && (lLower.includes('sexo') || iLower.includes('sexo') || lLower.includes('genero'))) {
                      updated[f.id] = localDecoded.sexo === 'HOMBRE' ? 'Masculino' : 'Femenino';
                    }
                    if ((f.type === 'select' || f.type === 'text') && (lLower.includes('entidad') || iLower.includes('entidad') || lLower.includes('estado')) && (lLower.includes('nacimiento') || iLower.includes('nacimiento'))) {
                      updated[f.id] = localDecoded.estadoNacimiento;
                    }
                  });
                  return updated;
                });
              }

              if (targetField?.curpFallbackStrategy === 'silent_pass') {
                setCurpVerificationState(prev => ({
                  ...prev,
                  [fieldId]: {
                    success: true,
                    isFallback: true,
                    message: 'Formato de CURP validado correctamente.'
                  }
                }));
                toast.info('Formato de CURP validado');
              } else {
                setCurpVerificationState(prev => ({
                  ...prev,
                  [fieldId]: {
                    success: false,
                    fallbackRequired: true,
                    decoded: localDecoded,
                    message: 'No pudimos validar ante RENAPO. Por favor ingresa los datos faltantes.'
                  }
                }));
              }
            }
            
            dsClient.event.unsubscribe(eventName);
          });
        } else {
          clearInterval(intervalId);
          throw new Error('Deepstream client not initialized');
        }
      } else {
        clearInterval(intervalId);
        throw new Error(data.error || 'Failed to enqueue job');
      }
    } catch (err: any) {
      clearInterval(intervalId);
      clearInterval(countdownInterval);
      setCurpCountdown(null);
      console.error('[CURP VERIFICATION ERROR]', err);
      setIsVerifyingCurp(false);
      
      const targetField = allFlatQuestions.find((f: any) => f.id === fieldId);
      const localDecoded = decodeCurp(curpVal);

      if (targetField?.curpFallbackStrategy === 'silent_pass') {
        setCurpVerificationState(prev => ({
          ...prev,
          [fieldId]: {
            success: true,
            isFallback: true,
            message: 'Formato de CURP validado correctamente.'
          }
        }));
        toast.info('Formato de CURP validado');
      } else {
        setCurpVerificationState(prev => ({
          ...prev,
          [fieldId]: {
            success: false,
            fallbackRequired: true,
            decoded: localDecoded,
            message: 'No pudimos conectar con RENAPO. Por favor completa los datos solicitados.'
          }
        }));
      }
    }
  };

  const [filesData, setFilesData] = useState<Record<string, { fileName: string; fileUrl: string; isImage?: boolean; fileSize?: string }>>({});
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string; isVideo?: boolean } | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [respondentName, setRespondentName] = useState(() => {
    if (typeof window !== 'undefined') {
      return user?.fullName || localStorage.getItem('cr_respondent_name') || '';
    }
    return user?.fullName || '';
  });
  const [inlineVerifyStep, setInlineVerifyStep] = useState<'idle' | 'details' | 'otp'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionPollStats, setSubmissionPollStats] = useState<any>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  // Sync user details if session changes
  useEffect(() => {
    if (user && user.fullName) {
      setRespondentName(user.fullName);
    }
    if (user && user.email) {
      setEmailInput(user.email);
    }
  }, [user, isAuthenticated]);

  // Signature Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Fullscreen Signature Modal State
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [activeSigningFieldId, setActiveSigningFieldId] = useState<string | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isModalDrawing, setIsModalDrawing] = useState(false);
  const [hasModalStrokes, setHasModalStrokes] = useState(false);

  // Change Respondent Identity Modal State
  const [isChangeIdentityModalOpen, setIsChangeIdentityModalOpen] = useState(false);
  const [isIdentityMounted, setIsIdentityMounted] = useState(false);
  const [isIdentityVisible, setIsIdentityVisible] = useState(false);
  const [tempRespondentName, setTempRespondentName] = useState('');
  const [tempEmailInput, setTempEmailInput] = useState('');
  const [identityDragY, setIdentityDragY] = useState(0);
  const [isIdentityDragging, setIsIdentityDragging] = useState(false);
  const identityTouchStartY = useRef(0);
  const identityIsPushedRef = useRef(false);
  const sigIsPushedRef = useRef(false);

  useEffect(() => {
    if (isChangeIdentityModalOpen) {
      setIsIdentityMounted(true);
      const timer = setTimeout(() => {
        setIsIdentityVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsIdentityVisible(false);
      const timer = setTimeout(() => {
        setIsIdentityMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isChangeIdentityModalOpen]);

  // Load Form Metadata
  const loadForm = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const activeEmail = verifiedEmail || user?.email || emailInput || '';
      const data = await getPublicStandaloneForm(id, activeEmail || undefined);
      setFormItem(data);
      if (id) {
        initFormSession(id);
      }

      // If already submitted and multiple responses are not allowed, block and set success/submitted state
      if (data.hasSubmitted && !data.allowMultipleResponses) {
        setIsSubmitted(true);
        if (data.pollStats) {
          setSubmissionPollStats(data.pollStats);
        }
      }

      // If access is public, authorize automatically
      if (data.accessType === 'PUBLIC') {
        setAuthStep('authorized');
      } else {
        // If restricted whitelist, check if the currently authenticated user's email is allowed
        const userEmailLower = user?.email?.toLowerCase();
        const isRestricted = data.accessType === 'RESTRICTED';
        const allowedEmails: string[] = (data.allowedEmails || []).map((e: string) => e.toLowerCase().trim());

        if (isRestricted && userEmailLower && allowedEmails.includes(userEmailLower)) {
          setAuthStep('authorized');
          setVerifiedEmail(userEmailLower);
          if (user?.name) setRespondentName(user.name);
        } else if (isRestricted) {
          setAuthStep('email_input');
        } else {
          setAuthStep('authorized');
        }
      }
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar el formulario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
  }, [id, isAuthenticated, user?.email, verifiedEmail]);

  useEffect(() => {
    if (formItem?.title) {
      const schoolName = formItem.school?.name || 'Comunidad Montessori';
      const pageTitle = `${formItem.title} | ${schoolName}`;
      document.title = pageTitle;

      const setMeta = (attr: string, key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      const rawDesc = formItem.description ? String(formItem.description).replace(/<[^>]*>?/gm, '').trim() : '';
      const desc = rawDesc 
        ? (rawDesc.length > 200 ? rawDesc.slice(0, 197) + '...' : rawDesc)
        : `Formulario oficial de ${schoolName}. Completa tu información de forma segura en línea a través de Montessori Nexus.`;
      const ogImg = `/api/og/forms/${formItem.id}.png`;

      setMeta('name', 'description', desc);
      setMeta('property', 'og:title', pageTitle);
      setMeta('property', 'og:description', desc);
      setMeta('property', 'og:image', ogImg);
      setMeta('property', 'og:type', 'website');
      setMeta('property', 'og:site_name', `${schoolName} • Montessori Nexus`);
      setMeta('name', 'twitter:card', 'summary_large_image');
      setMeta('name', 'twitter:title', pageTitle);
      setMeta('name', 'twitter:description', desc);
      setMeta('name', 'twitter:image', ogImg);
    }
  }, [formItem]);

  // Browser History & Navigation Synchronization (Back / Forward button support)
  useEffect(() => {
    // Initial replaceState to establish base entry
    window.history.replaceState(
      { authStep: 'initial', step: 0, typeformIndex: 0 },
      ''
    );

    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.identityModalStateId || e.state?.sigModalStateId || e.state?.confirmStateId) {
        return;
      }
      if (e.state) {
        if (typeof e.state.typeformIndex === 'number') {
          const nextIdx = e.state.typeformIndex;
          setTypeformIndex(prev => {
            if (nextIdx !== prev) {
              setOutgoingTypeformIndex(prev);
              setSlideDirection(nextIdx < prev ? 'right' : 'left');
              setIsTransitioning(true);
              setTimeout(() => {
                setOutgoingTypeformIndex(null);
                setIsTransitioning(false);
              }, 480);
            }
            return nextIdx;
          });
        }
        if (typeof e.state.step === 'number') {
          setCurrentStep(e.state.step);
        }
        if (e.state.authStep) {
          if (formItem?.accessType === 'PUBLIC') {
            setAuthStep('authorized');
          } else {
            setAuthStep(e.state.authStep);
          }
        }
      } else {
        // Popped to beginning
        setTypeformIndex(prev => {
          if (prev > 0) setSlideDirection('right');
          return 0;
        });
        setCurrentStep(0);
        if (formItem?.accessType === 'PUBLIC') {
          setAuthStep('authorized');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard Escape and Browser Back support for Change Identity Modal
  useEffect(() => {
    if (!isChangeIdentityModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsChangeIdentityModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    const stateId = `identity_drawer_${Date.now()}`;
    window.history.pushState({ identityModalStateId: stateId }, '');
    identityIsPushedRef.current = true;

    const handlePopState = () => {
      identityIsPushedRef.current = false;
      setIsChangeIdentityModalOpen(false);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('popstate', handlePopState);
      if (identityIsPushedRef.current && window.history.state?.identityModalStateId === stateId) {
        identityIsPushedRef.current = false;
        window.history.back();
      }
    };
  }, [isChangeIdentityModalOpen]);

  // Keyboard Escape and Browser Back support for Fullscreen Signature Modal
  useEffect(() => {
    if (!isSignatureModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsSignatureModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    const stateId = `sig_modal_${Date.now()}`;
    window.history.pushState({ sigModalStateId: stateId }, '');
    sigIsPushedRef.current = true;

    const handlePopState = () => {
      sigIsPushedRef.current = false;
      setIsSignatureModalOpen(false);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('popstate', handlePopState);
      if (sigIsPushedRef.current && window.history.state?.sigModalStateId === stateId) {
        sigIsPushedRef.current = false;
        window.history.back();
      }
    };
  }, [isSignatureModalOpen]);

  // Guarantee all help widgets (Asistenxa, WhatsApp, etc.) remain hidden on forms
  useEffect(() => {
    const hideWidgets = () => {
      const widgetElements = document.querySelectorAll(
        '#asistenxa-root, #asistenxa-widget, [id^="asistenxa"], [class*="asistenxa"], iframe[src*="asistenxa"], .asistenxa-launcher, .asistenxa-bubble'
      );
      widgetElements.forEach((el) => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
      });

      if (typeof (window as any).Asistenxa !== 'undefined') {
        try {
          (window as any).Asistenxa.close?.();
          (window as any).Asistenxa.hide?.();
        } catch {
          // Ignore
        }
      }
    };

    hideWidgets();
    const interval = setInterval(hideWidgets, 400);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const goToTypeformIndex = (nextIndex: number, direction: 'left' | 'right' = 'left') => {
    if (nextIndex < 0 || nextIndex >= visibleFlatQuestions.length || nextIndex === typeformIndex) return;
    setOutgoingTypeformIndex(typeformIndex);
    setSlideDirection(direction);
    setTypeformIndex(nextIndex);
    setIsTransitioning(true);
    setTimeout(() => {
      setOutgoingTypeformIndex(null);
      setIsTransitioning(false);
    }, 480);
    window.history.pushState(
      { authStep: 'authorized', step: currentStep, typeformIndex: nextIndex },
      ''
    );
  };

  const goBackTypeform = () => {
    if (typeformIndex > 0) {
      goToTypeformIndex(typeformIndex - 1, 'right');
    }
  };

  const goToStep = (nextStep: number) => {
    setCurrentStep(nextStep);
    window.history.pushState(
      { authStep: 'authorized', step: nextStep, typeformIndex },
      ''
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBackStep = () => {
    if (currentStep > 0) {
      window.history.back();
    }
  };

  // Request OTP Handler
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !emailInput.trim()) {
      setAuthError('Ingresa tu correo electrónico');
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError(null);
      await requestStandaloneFormOTP(id, emailInput.trim());
      setAuthStep('otp');
      window.history.pushState({ authStep: 'otp', step: 0, typeformIndex: 0 }, '');
      toast.success(`Código de seguridad de 6 dígitos enviado a ${emailInput.trim()}`);
    } catch (e: any) {
      setAuthError(e.message || 'Error al validar correo');
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify OTP Handler
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !emailInput.trim() || !otpInput.trim()) {
      setAuthError('Ingresa el código de 6 dígitos');
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError(null);
      const res = await verifyStandaloneFormOTP(id, emailInput.trim(), otpInput.trim());
      setSessionToken(res.sessionToken);
      setVerifiedEmail(res.verifiedEmail);
      try {
        localStorage.setItem('cr_form_session_token', res.sessionToken);
        localStorage.setItem('cr_form_verified_email', res.verifiedEmail);
        localStorage.setItem('cr_respondent_email', res.verifiedEmail);
      } catch (e) {
        // ignore
      }
      setAuthStep('authorized');
      window.history.pushState({ authStep: 'authorized', step: 0, typeformIndex: 0 }, '');
      toast.success('¡Identidad verificada con éxito!');
    } catch (e: any) {
      setAuthError(e.message || 'Código incorrecto');
    } finally {
      setAuthLoading(false);
    }
  };

  // Flattened questions for Typeform
  const allFlatQuestions = useMemo(() => {
    if (!formItem) return [];
    return formItem.schema.flatMap((sec, sIdx) => 
      sec.fields.map((fld, fIdx) => ({
        ...fld,
        sectionId: sec.id,
        sectionTitle: sec.title,
        sectionIndex: sIdx,
        globalIndex: fIdx
      }))
    );
  }, [formItem]);

  // Questions currently visible according to conditional logic rules
  const visibleFlatQuestions = useMemo(() => {
    return allFlatQuestions.filter(q => evaluateFieldCondition(q.condition, formData));
  }, [allFlatQuestions, formData]);

  // Draft Auto-Restore from LocalStorage on mount
  useEffect(() => {
    if (!id || loading || !formItem) return;
    try {
      const draftKey = `cr_form_draft_${id}`;
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.formData && Object.keys(parsed.formData).length > 0) {
            const cleanedFormData = { ...parsed.formData };
            const restoredFilesData: Record<string, any> = parsed.filesData ? { ...parsed.filesData } : {};
            
            for (const key of Object.keys(cleanedFormData)) {
              const val = cleanedFormData[key];
              if (typeof val === 'string' && val.startsWith('blob:')) {
                delete cleanedFormData[key];
                delete restoredFilesData[key];
              } else if (val && typeof val === 'object') {
                if (val.front?.fileUrl?.startsWith('blob:')) {
                  val.front = undefined;
                }
                if (val.back?.fileUrl?.startsWith('blob:')) {
                  val.back = undefined;
                }
                const requiresTwoSides = val.selectedType !== 'passport';
                val.isComplete = requiresTwoSides 
                  ? Boolean(val.front?.fileUrl && val.back?.fileUrl)
                  : Boolean(val.front?.fileUrl);
                
                if (val.front?.fileUrl) {
                  restoredFilesData[`${key}_front`] = val.front;
                  restoredFilesData[key] = val.front;
                }
                if (val.back?.fileUrl) {
                  restoredFilesData[`${key}_back`] = val.back;
                }
              }
            }
            setFormData(cleanedFormData);
            if (Object.keys(restoredFilesData).length > 0) {
              setFilesData(restoredFilesData);
            }
          }
          if (parsed.signatureData) {
            setSignatureData(parsed.signatureData);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load draft:', e);
    }
  }, [id, loading, formItem]);

  // Draft Auto-Save to LocalStorage on changes
  useEffect(() => {
    if (!id || loading || !formItem || isSubmitted) return;
    try {
      const draftKey = `cr_form_draft_${id}`;
      const hasContent = Object.keys(formData).length > 0 || !!signatureData || Object.keys(filesData).length > 0;
      if (hasContent) {
        localStorage.setItem(draftKey, JSON.stringify({
          formData,
          filesData,
          signatureData,
          currentStep,
          typeformIndex,
          updatedAt: Date.now()
        }));
      }
    } catch (e) {
      console.warn('Could not save draft:', e);
    }
  }, [id, formData, filesData, signatureData, currentStep, typeformIndex, isSubmitted, loading, formItem]);

  // Canvas Signature Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  // Fullscreen Signature Modal Handlers
  const openSignatureModal = (fieldId?: string) => {
    setActiveSigningFieldId(fieldId || null);
    setIsSignatureModalOpen(true);
  };

  useEffect(() => {
    if (isSignatureModalOpen && modalCanvasRef.current) {
      const canvas = modalCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
      setHasModalStrokes(false);
    }
  }, [isSignatureModalOpen, isDark]);

  const startModalDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsModalDrawing(true);
    setHasModalStrokes(true);
  };

  const drawModal = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isModalDrawing) return;
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopModalDrawing = () => {
    if (!isModalDrawing) return;
    setIsModalDrawing(false);
  };

  const clearModalCanvas = () => {
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      setHasModalStrokes(false);
    }
  };

  const saveModalSignature = () => {
    const canvas = modalCanvasRef.current;
    if (!canvas || !hasModalStrokes) {
      toast.info('Por favor realiza tu firma antes de guardar');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData(dataUrl);
    if (activeSigningFieldId) {
      setFormData(prev => ({ ...prev, [activeSigningFieldId]: dataUrl }));
    }
    setIsSignatureModalOpen(false);
    toast.success('Firma guardada correctamente');
  };

  // File & Document Processing
  const handleProcessFile = async (fieldId: string, file: File) => {
    if (!file) return;
    try {
      const dataUrl = await convertFileToOptimizedDataUrl(file);
      const isImage = file.type.startsWith('image/') || dataUrl.startsWith('data:image');
      const fileSizeFormatted = file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      
      const fileInfo = {
        fileName: file.name,
        fileUrl: dataUrl,
        isImage,
        fileSize: fileSizeFormatted
      };

      setFilesData(prev => ({
        ...prev,
        [fieldId]: fileInfo
      }));
      setFormData(prev => ({
        ...prev,
        [fieldId]: dataUrl
      }));
      toast.success(isImage ? `Fotografía capturada: ${file.name}` : `Documento adjunto: ${file.name}`);
    } catch (e) {
      console.error('Error processing file:', e);
      toast.error('Error al procesar el archivo');
    }
  };

  const handleFileUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(fieldId, file);
    }
  };

  const handleRemoveFile = (fieldId: string) => {
    setFilesData(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setFormData(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    toast.info('Documento eliminado');
  };

  // KYC Multi-Variant & 2-Sided Capture Handlers
  const handleKycProcessSide = async (fieldId: string, side: 'front' | 'back', file: File, docType: KycDocumentVariant) => {
    if (!file) return;
    try {
      const dataUrl = await convertFileToOptimizedDataUrl(file);
      const isImage = file.type.startsWith('image/') || dataUrl.startsWith('data:image');
      const fileSizeFormatted = file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      
      const sideInfo: KycCaptureSide = {
        fileName: file.name,
        fileUrl: dataUrl,
        isImage,
        fileSize: fileSizeFormatted,
        capturedAt: new Date().toISOString()
      };

      let isDocComplete = false;
      let finalDocObj: KycDocumentValue | null = null;

      setFormData(prev => {
        const prevVal = (prev[fieldId] && typeof prev[fieldId] === 'object') ? { ...prev[fieldId] } : {};
        const updatedDoc: KycDocumentValue = {
          selectedType: docType || prevVal.selectedType || 'id_card',
          front: side === 'front' ? sideInfo : prevVal.front,
          back: side === 'back' ? sideInfo : prevVal.back,
        };
        const requiresTwoSides = updatedDoc.selectedType !== 'passport';
        updatedDoc.isComplete = requiresTwoSides 
          ? Boolean(updatedDoc.front?.fileUrl && updatedDoc.back?.fileUrl)
          : Boolean(updatedDoc.front?.fileUrl);

        isDocComplete = Boolean(updatedDoc.isComplete);
        finalDocObj = updatedDoc;

        return {
          ...prev,
          [fieldId]: updatedDoc
        };
      });

      setFilesData(prev => ({
        ...prev,
        [`${fieldId}_${side}`]: sideInfo,
        [fieldId]: sideInfo
      }));

      toast.success(`Fotografía (${side === 'front' ? 'Frente' : 'Reverso'}) capturada correctamente`);

      // Trigger OCR + LLM Extraction if enabled on field and document is complete
      const targetField = allQuestions.find(q => q.id === fieldId);
      if (isDocComplete && targetField && targetField.enableOcrExtraction !== false) {
        const frontUrl = side === 'front' ? sideInfo.fileUrl : finalDocObj?.front?.fileUrl;
        const backUrl = side === 'back' ? sideInfo.fileUrl : finalDocObj?.back?.fileUrl;
        if (frontUrl) {
          extractDocumentDataOcr({
            documentFrontUrl: frontUrl,
            documentBackUrl: backUrl || null,
            docType: docType || 'id_card',
            schoolId: form?.school_id || null
          }).then(res => {
            if (res?.extractedData) {
              setFormData(prev => {
                const cur = prev[fieldId] || {};
                return {
                  ...prev,
                  [fieldId]: {
                    ...cur,
                    ocrData: res.extractedData,
                    extractedData: res.extractedData,
                    ocr: res.extractedData,
                    quality_assessment: res.extractedData.quality_assessment
                  }
                };
              });

              if (res.extractedData.document_type_matches === false && targetField.ocrFallbackStrategy === 'show_error_invalidate') {
                toast.error(res.extractedData.validation_error || 'El documento presentado no coincide con el tipo seleccionado.');
              }
            }
          }).catch(err => {
            console.warn('[DOCUMENT CAPTURE OCR NOTICE]', err.message);
          });
        }
      }
    } catch (e) {
      console.error('Error processing KYC side:', e);
      toast.error('Error al procesar la fotografía.');
    }
  };

  const handleKycRemoveSide = (fieldId: string, side: 'front' | 'back') => {
    setFormData(prev => {
      const prevVal = (prev[fieldId] && typeof prev[fieldId] === 'object') ? { ...prev[fieldId] } : {};
      const updatedDoc: KycDocumentValue = {
        selectedType: prevVal.selectedType || 'id_card',
        front: side === 'front' ? undefined : prevVal.front,
        back: side === 'back' ? undefined : prevVal.back,
      };
      const requiresTwoSides = updatedDoc.selectedType !== 'passport';
      updatedDoc.isComplete = requiresTwoSides 
        ? Boolean(updatedDoc.front?.fileUrl && updatedDoc.back?.fileUrl)
        : Boolean(updatedDoc.front?.fileUrl);

      return {
        ...prev,
        [fieldId]: updatedDoc
      };
    });

    setFilesData(prev => {
      const next = { ...prev };
      delete next[`${fieldId}_${side}`];
      delete next[fieldId];
      return next;
    });

    toast.info(`Fotografía (${side === 'front' ? 'Frente' : 'Reverso'}) eliminada`);
  };

  const handleKycSelectDocType = (fieldId: string, docType: KycDocumentVariant) => {
    setFormData(prev => {
      const prevVal = (prev[fieldId] && typeof prev[fieldId] === 'object') ? { ...prev[fieldId] } : {};
      const updatedDoc: KycDocumentValue = {
        ...prevVal,
        selectedType: docType,
        back: docType === 'passport' ? undefined : prevVal.back
      };
      const requiresTwoSides = docType !== 'passport';
      updatedDoc.isComplete = requiresTwoSides
        ? Boolean(updatedDoc.front?.fileUrl && updatedDoc.back?.fileUrl)
        : Boolean(updatedDoc.front?.fileUrl);

      return {
        ...prev,
        [fieldId]: updatedDoc
      };
    });
  };

  // Selfie / Liveness Biometric Capture Handlers
  const handleSelfieProcessStep = async (fieldId: string, step: 'step1' | 'step2' | 'videoClip', file: File) => {
    if (!file) return;
    try {
      const dataUrl = await convertFileToOptimizedDataUrl(file);
      const isVideo = file.type.startsWith('video/') || dataUrl.startsWith('data:video');
      const isImage = file.type.startsWith('image/') || dataUrl.startsWith('data:image');
      const fileSizeFormatted = file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const stepInfo: SelfieCaptureSide = {
        fileName: file.name,
        fileUrl: dataUrl,
        isImage,
        isVideo,
        fileSize: fileSizeFormatted,
        capturedAt: new Date().toISOString()
      };

      setFormData(prev => {
        const prevVal = (prev[fieldId] && typeof prev[fieldId] === 'object') ? { ...prev[fieldId] } : {};
        const updatedSelfie: SelfieLivenessValue = {
          step1: step === 'step1' ? stepInfo : prevVal.step1,
          step2: step === 'step2' ? stepInfo : prevVal.step2,
          videoClip: step === 'videoClip' ? stepInfo : prevVal.videoClip,
        };
        updatedSelfie.isComplete = Boolean(updatedSelfie.step1?.fileUrl && updatedSelfie.step2?.fileUrl);

        return {
          ...prev,
          [fieldId]: updatedSelfie
        };
      });

      setFilesData(prev => ({
        ...prev,
        [`${fieldId}_${step}`]: stepInfo,
        [fieldId]: stepInfo
      }));

      if (step === 'step1') {
        toast.success(formLocale === 'es' ? 'Foto frontal capturada' : 'Frontal photo captured');
      } else if (step === 'step2') {
        toast.success(formLocale === 'es' ? 'Prueba de vida capturada' : 'Liveness photo captured');
      } else if (step === 'videoClip') {
        toast.success(formLocale === 'es' ? 'Clip animado generado' : 'Liveness clip generated');
      }

      // Optimistic background upload
      const formPayload = new FormData();
      formPayload.append('file', file);
      formPayload.append('folder', id ? `forms/${id}` : 'forms');
      if (id) formPayload.append('formId', id);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formPayload
        });
        if (res.ok) {
          const uploadResult = await res.json();
          if (uploadResult.url) {
            stepInfo.fileUrl = uploadResult.url;
            setFormData(prev => {
              const prevVal = (prev[fieldId] && typeof prev[fieldId] === 'object') ? { ...prev[fieldId] } : {};
              const updatedSelfie: SelfieLivenessValue = {
                step1: step === 'step1' ? stepInfo : prevVal.step1,
                step2: step === 'step2' ? stepInfo : prevVal.step2,
                videoClip: step === 'videoClip' ? stepInfo : prevVal.videoClip,
              };
              updatedSelfie.isComplete = Boolean(updatedSelfie.step1?.fileUrl && updatedSelfie.step2?.fileUrl);

              return {
                ...prev,
                [fieldId]: updatedSelfie
              };
            });
          }
        }
      } catch (err) {
        console.warn('Background selfie upload to server skipped/failed:', err);
      }
    } catch (err) {
      console.error('Error processing selfie step:', err);
      toast.error('Error al procesar la captura facial.');
    }
  };

  const handleSelfieRemoveStep = (fieldId: string, step: 'step1' | 'step2') => {
    setFormData(prev => {
      const prevVal = (prev[fieldId] && typeof prev[fieldId] === 'object') ? { ...prev[fieldId] } : {};
      const updatedSelfie: SelfieLivenessValue = {
        step1: step === 'step1' ? undefined : prevVal.step1,
        step2: step === 'step2' ? undefined : prevVal.step2,
      };
      updatedSelfie.isComplete = Boolean(updatedSelfie.step1?.fileUrl && updatedSelfie.step2?.fileUrl);

      return {
        ...prev,
        [fieldId]: updatedSelfie
      };
    });

    setFilesData(prev => {
      const next = { ...prev };
      delete next[`${fieldId}_${step}`];
      return next;
    });

    toast.info(formLocale === 'es' ? 'Fotografía eliminada' : 'Photo removed');
  };

  const handleSelfieReset = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: {
        step1: undefined,
        step2: undefined,
        isComplete: false
      }
    }));
  };

  // Theme & Appearance Customization Tokens
  const themeColor = formItem?.themeColor || (formItem as any)?.schema?.[0]?.themeColor || '#1b3b2b';
  const secondaryColor = formItem?.secondaryColor || (formItem as any)?.schema?.[0]?.secondaryColor || '#10b981';
  const fieldStyle = formItem?.fieldStyle || (formItem as any)?.schema?.[0]?.fieldStyle || (formItem?.layoutStyle === 'focus_flow' ? 'underlined' : 'bordered');
  const borderRadius = formItem?.borderRadius || (formItem as any)?.schema?.[0]?.borderRadius || 'lg';
  const shadowStyle = formItem?.shadowStyle || (formItem as any)?.schema?.[0]?.shadowStyle || 'subtle';
  const borderWeight = formItem?.borderWeight || (formItem as any)?.schema?.[0]?.borderWeight || 'medium';

  // Reset Form Handler (Custom Confirm Modal)
  const handleResetForm = async (skipConfirm = false) => {
    if (formItem && !formItem.allowMultipleResponses && formItem.hasSubmitted) {
      toast.error(
        formLocale === 'es'
          ? 'No se permiten envíos múltiples para este formulario.'
          : 'Multiple submissions are not allowed for this form.'
      );
      return;
    }

    if (!skipConfirm) {
      const ok = await confirm({
        title: formLocale === 'es' ? '¿Reiniciar formulario?' : 'Reset Form?',
        description: formLocale === 'es'
          ? '¿Estás seguro de que deseas reiniciar el formulario? Se borrarán todas las respuestas ingresadas, archivos, firmas y borradores guardados.'
          : 'Are you sure you want to reset the form? All entered answers, files, signatures, and saved drafts will be cleared.',
        confirmText: formLocale === 'es' ? 'Sí, reiniciar' : 'Yes, reset',
        cancelText: formLocale === 'es' ? 'Cancelar' : 'Cancel',
        variant: 'warning',
        icon: 'warning',
        borderRadius: borderRadius as any
      });
      if (!ok) return;
    }

    setFormResetKey((prev) => prev + 1);
    setFormData({});
    setFilesData({});
    setSignatureData(null);
    clearCanvas();
    clearModalCanvas();
    setCurrentStep(0);
    setTypeformIndex(0);
    setSlideDirection('left');
    setIsSubmitted(false);
    setInlineVerifyStep('idle');
    setAuthError(null);
    setOtpInput('');

    if (formItem?.accessType === 'PUBLIC') {
      setAuthStep('authorized');
    }

    // Preserve identified sender info so they don't have to re-authenticate or re-type
    const storedName = (typeof window !== 'undefined' ? localStorage.getItem('cr_respondent_name') : '') || respondentName;
    const storedEmail = (typeof window !== 'undefined' ? localStorage.getItem('cr_form_verified_email') || localStorage.getItem('cr_respondent_email') : '') || verifiedEmail || emailInput;
    const storedSession = (typeof window !== 'undefined' ? localStorage.getItem('cr_form_session_token') : '') || sessionToken;

    if (storedName) setRespondentName(storedName);
    if (storedEmail) {
      setEmailInput(storedEmail);
      setVerifiedEmail(storedEmail);
    }
    if (storedSession) {
      setSessionToken(storedSession);
    }

    if (id) {
      try {
        localStorage.removeItem(`cr_form_draft_${id}`);
      } catch (e) {
        // ignore
      }
    }

    // Scroll top in container
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toast.success(
      formLocale === 'es'
        ? 'Formulario reiniciado correctamente'
        : 'Form reset successfully'
    );
  };

  // Theme, Language & Reset Controls Component (Responsive: Full bar on desktop, 3-dots dropdown menu on mobile)
  const ThemeAndLanguageControls = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!isMenuOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    return (
      <div className="relative">
        {/* Desktop View: Full horizontal toolbar */}
        <div 
          className={`hidden sm:flex items-center gap-1 p-1 ${getRadiusClass(borderRadius, 'card')} border backdrop-blur-md shadow-xs transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-700/80 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-700'
          }`}
        >
          <button
            type="button"
            onClick={() => handleResetForm(false)}
            className={`p-1.5 ${getRadiusClass(borderRadius, 'button')} transition-all cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-rose-400' : 'hover:bg-slate-100 text-slate-500 hover:text-rose-600'
            }`}
            title={txt.resetTooltip}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className={`w-[1px] h-4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />

          <button
            type="button"
            onClick={toggleLocale}
            className={`px-2.5 py-1 ${getRadiusClass(borderRadius, 'button')} text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title={formLocale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{formLocale.toUpperCase()}</span>
          </button>

          <div className={`w-[1px] h-4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 ${getRadiusClass(borderRadius, 'button')} transition-all cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title={isDark ? txt.lightMode : txt.darkMode}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile View: 3-dots Menu Button */}
        <div ref={menuRef} className="sm:hidden relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 ${getRadiusClass(borderRadius, 'button')} border backdrop-blur-md shadow-xs transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:bg-slate-800' 
                : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Opciones"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Mobile Popover Menu */}
          {isMenuOpen && (
            <div 
              className={`absolute right-0 top-full mt-2 w-52 ${getRadiusClass(borderRadius, 'card')} border shadow-2xl backdrop-blur-md p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 ${
                isDark ? 'bg-slate-900/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
              }`}
            >
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setIsMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 ${getRadiusClass(borderRadius, 'button')} text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  <span>{isDark ? txt.lightMode : txt.darkMode}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono font-medium">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Language Toggle */}
              <button
                type="button"
                onClick={() => {
                  toggleLocale();
                  setIsMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 ${getRadiusClass(borderRadius, 'button')} text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>{txt.language}</span>
                </div>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 ${getRadiusClass(borderRadius, 'avatar')} bg-slate-100 dark:bg-slate-800`}>
                  {formLocale.toUpperCase()}
                </span>
              </button>

              <div className={`h-[1px] my-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />

              {/* Reset Form */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleResetForm(false);
                }}
                className={`w-full px-3 py-2.5 ${getRadiusClass(borderRadius, 'button')} text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{txt.resetForm}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Strict Real-Time Input Sanitizer (Prevents invalid characters while typing)
  const sanitizeFieldValue = (type: FormFieldType, rawValue: string): string => {
    if (type === 'phone') {
      let val = rawValue.replace(/[^\d+ ]/g, '');
      if (!val) return '';
      const digitsAndSpaces = val.replace(/\+/g, '');
      return '+' + digitsAndSpaces;
    }
    if (type === 'curp') {
      const upper = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return upper.substring(0, 18);
    }
    if (type === 'integer') {
      // Only digits 0-9
      return rawValue.replace(/[^\d]/g, '');
    }
    if (type === 'fullname') {
      // Allow only letters, accents, ñ, ü, and spaces
      const cleaned = rawValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
      // Auto-capitalize first letter of each word
      return cleaned
        .toLowerCase()
        .replace(/(^|\s)[a-záéíóúñü]/g, char => char.toUpperCase());
    }
    if (type === 'decimal') {
      // Digits and at most one decimal point
      let val = rawValue.replace(/[^\d.]/g, '');
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      return val;
    }
    return rawValue;
  };

  // Helper to handle general field changes with sanitization
  const handleFieldChange = (fieldId: string, type: FormFieldType, rawValue: string) => {
    const sanitized = sanitizeFieldValue(type, rawValue);
    setFormData(prev => ({ ...prev, [fieldId]: sanitized }));
  };

  // Helper to handle composite subfield changes with sanitization
  const handleCompositeFieldChange = (fieldId: string, subId: string, subType: FormFieldType, rawValue: string) => {
    const sanitized = sanitizeFieldValue(subType, rawValue);
    setFormData(prev => ({
      ...prev,
      [fieldId]: {
        ...(prev[fieldId] || {}),
        [subId]: sanitized
      }
    }));
  };

  // Format validation function (Email, Phone length, numbers, etc.)
  const validateFieldFormat = (type: FormFieldType, label: string, val: any): { isValid: boolean; errorMsg?: string } => {
    if (val === undefined || val === null || val === '') return { isValid: true };
    const strVal = String(val).trim();
    if (!strVal) return { isValid: true };

    if (type === 'email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(strVal)) {
        return { 
          isValid: false, 
          errorMsg: `"${label}": El correo ingresado no es válido (ej. nombre@dominio.com)` 
        };
      }
    }

    if (type === 'curp') {
      const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/;
      if (!curpRegex.test(strVal)) {
        return { 
          isValid: false, 
          errorMsg: `"${label}": El CURP debe tener un formato válido de 18 caracteres (ej. AAAA000000HAAAAAAA0)` 
        };
      }
    }

    if (type === 'phone') {
      const digits = strVal.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        return { 
          isValid: false, 
          errorMsg: `"${label}": El número de teléfono debe contener entre 7 y 15 dígitos` 
        };
      }
    }

    if (type === 'integer') {
      if (!/^\d+$/.test(strVal)) {
        return { isValid: false, errorMsg: `"${label}": Debe ser un número entero válido` };
      }
    }

    if (type === 'decimal') {
      if (isNaN(Number(strVal))) {
        return { isValid: false, errorMsg: `"${label}": Debe ser un valor numérico válido` };
      }
    }

    return { isValid: true };
  };

  // Validation per section
  const validateCurrentSection = (sectionIndex: number) => {
    if (!formItem) return true;
    const sec = formItem.schema[sectionIndex];
    if (!sec) return true;

    for (const f of sec.fields) {
      const isVisible = evaluateFieldCondition(f.condition, formData);
      if (isVisible) {
        const val = formData[f.id];
        if (f.type === 'fullname') {
          const nameVal = val || {};
          const firstName = (nameVal.firstName || '').trim();
          const paternal = (nameVal.paternalLastName || '').trim();
          if (f.required) {
            if (!firstName) {
              toast.error(`${f.label}: El campo "Nombre(s)" es obligatorio`);
              return false;
            }
            if (!paternal) {
              toast.error(`${f.label}: El campo "Apellido Paterno" es obligatorio`);
              return false;
            }
          }
        } else if (f.type === 'composite') {
          const compositeVal = val || {};
          const subfields = f.subfields || [];
          for (const sub of subfields) {
            const subVal = compositeVal[sub.id];
            const isSubMissing = subVal === undefined || subVal === null || subVal === '' || (Array.isArray(subVal) && subVal.length === 0);
            if ((f.required || sub.required) && isSubMissing) {
              toast.error(`${f.label}: "${sub.label}" es obligatorio`);
              return false;
            }
            if (!isSubMissing) {
              const formatCheck = validateFieldFormat(sub.type, `${f.label} - ${sub.label}`, subVal);
              if (!formatCheck.isValid) {
                toast.error(formatCheck.errorMsg);
                return false;
              }
            }
          }
        } else {
          if (f.type === 'document_capture') {
            const docVal = (val && typeof val === 'object') ? (val as KycDocumentValue) : null;
            const hasLegacy = Boolean(filesData[f.id] || (typeof val === 'string' && val));
            if (f.required) {
              if (!docVal && !hasLegacy) {
                toast.error(txt.fileRequired(f.label));
                return false;
              }
              if (docVal) {
                const isPassport = docVal.selectedType === 'passport';
                if (!docVal.front?.fileUrl) {
                  toast.error(`${f.label}: Debes capturar ${isPassport ? 'la página principal del pasaporte' : 'el frente de tu documento'}`);
                  return false;
                }
                if (!isPassport && !docVal.back?.fileUrl) {
                  toast.error(`${f.label}: Debes capturar el reverso de tu documento`);
                  return false;
                }
              }
            } else if (docVal && docVal.selectedType !== 'passport') {
              if ((docVal.front?.fileUrl || docVal.back?.fileUrl) && (!docVal.front?.fileUrl || !docVal.back?.fileUrl)) {
                toast.error(`${f.label}: Si presentas tu documento de identidad, debes capturar ambas caras (Frente y Reverso)`);
                return false;
              }
            }
          }

          if (f.type === 'selfie_liveness') {
            const selfieVal = (val && typeof val === 'object') ? (val as SelfieLivenessValue) : null;
            if (f.required) {
              if (!selfieVal?.step1?.fileUrl || !selfieVal?.step2?.fileUrl) {
                toast.error(`${f.label}: Debes completar ambos pasos de la verificación facial (Foto frontal y prueba de vida)`);
                return false;
              }
            }
          }

          if (f.type === 'identity_verification') {
            const idVal = (val && typeof val === 'object') ? val : null;
            if (f.required) {
              if (!idVal?.isComplete || !idVal?.verification?.isMatch) {
                toast.error(`${f.label}: Debes completar la verificación de identidad biométrica.`);
                return false;
              }
            }
          }

          if (f.required) {
            if ((f.type === 'terms' || f.type === 'terms_consent') && !val) {
              toast.error(formLocale === 'es' ? `${f.label}: Debes aceptar los términos y condiciones` : `${f.label}: You must accept the terms and conditions`);
              return false;
            }
            if (f.type === 'schedule_event') {
              const scheduleVal = val as ScheduleEventValue | undefined;
              if (!scheduleVal || (!scheduleVal.slotId && scheduleVal.rsvpStatus !== 'CONFIRMED')) {
                toast.error(formLocale === 'es' ? `${f.label}: Debes seleccionar un horario o confirmar asistencia` : `${f.label}: You must choose a time slot or confirm attendance`);
                return false;
              }
            }
            if (f.type === 'file_upload' && !filesData[f.id] && !formData[f.id]) {
              toast.error(txt.fileRequired(f.label));
              return false;
            }
            if (f.type === 'signature' && !signatureData && !formData[f.id]) {
              toast.error(txt.sigRequired(f.label));
              return false;
            }
            if (f.type !== 'file_upload' && f.type !== 'document_capture' && f.type !== 'selfie_liveness' && f.type !== 'signature' && f.type !== 'terms' && f.type !== 'terms_consent' && f.type !== 'schedule_event') {
              if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                toast.error(txt.fieldRequired(f.label));
                return false;
              }
            }
          }
          // Format validation for answered non-composite fields
          if (val !== undefined && val !== null && val !== '') {
            const formatCheck = validateFieldFormat(f.type, f.label, val);
            if (!formatCheck.isValid) {
              toast.error(formatCheck.errorMsg);
              return false;
            }
          }

          // Evaluate Invalidation Rules ("Invalidar si")
          const invalidationCheck = evaluateFieldInvalidation(f, formData, decodeCurp);
          if (invalidationCheck.isInvalid) {
            toast.error(invalidationCheck.errorMessage || `El valor ingresado en "${f.label}" no cumple con los requisitos.`);
            return false;
          }
        }
      }
    }
    return true;
  };

  // Validation per flat question (focus_flow)
  const validateFlatQuestion = (qIndex: number) => {
    const q = visibleFlatQuestions[qIndex];
    if (!q) return true;

    const isVisible = evaluateFieldCondition(q.condition, formData);
    if (!isVisible) return true;

    const val = formData[q.id];

    if (q.type === 'fullname') {
      const nameVal = val || {};
      const firstName = (nameVal.firstName || '').trim();
      const paternal = (nameVal.paternalLastName || '').trim();
      if (q.required) {
        if (!firstName) {
          toast.error(`${q.label}: El campo "Nombre(s)" es obligatorio`);
          triggerShake();
          return false;
        }
        if (!paternal) {
          toast.error(`${q.label}: El campo "Apellido Paterno" es obligatorio`);
          triggerShake();
          return false;
        }
      }
      return true;
    }

    if (q.type === 'composite') {
      const compositeVal = val || {};
      const subfields = q.subfields || [];
      for (const sub of subfields) {
        const subVal = compositeVal[sub.id];
        const isSubMissing = subVal === undefined || subVal === null || subVal === '' || (Array.isArray(subVal) && subVal.length === 0);
        if ((q.required || sub.required) && isSubMissing) {
          toast.error(`${q.label}: "${sub.label}" es obligatorio`);
          triggerShake();
          return false;
        }
        if (!isSubMissing) {
          const formatCheck = validateFieldFormat(sub.type, `${q.label} - ${sub.label}`, subVal);
          if (!formatCheck.isValid) {
            toast.error(formatCheck.errorMsg);
            triggerShake();
            return false;
          }
        }
      }
      return true;
    }

    if (q.required) {
      if ((q.type === 'terms' || q.type === 'terms_consent') && !val) {
        toast.error(formLocale === 'es' ? `${q.label}: Debes aceptar los términos y condiciones para continuar` : `${q.label}: You must accept the terms and conditions to proceed`);
        triggerShake();
        return false;
      }

      if (q.type === 'signature') {
        const hasSig = !!(formData[q.id] || signatureData);
        if (!hasSig) {
          toast.error(txt.sigRequired(q.label));
          triggerShake();
          return false;
        }
        return true;
      }

      if (q.type === 'document_capture') {
        const docVal = (val && typeof val === 'object') ? (val as KycDocumentValue) : null;
        const hasLegacy = Boolean(filesData[q.id] || (typeof val === 'string' && val));
        if (q.required) {
          if (!docVal && !hasLegacy) {
            toast.error(txt.fileRequired(q.label));
            triggerShake();
            return false;
          }
          if (docVal) {
            const isPassport = docVal.selectedType === 'passport';
            if (!docVal.front?.fileUrl) {
              toast.error(`${q.label}: Debes capturar ${isPassport ? 'la página principal del pasaporte' : 'el frente de tu documento'}`);
              triggerShake();
              return false;
            }
            if (!isPassport && !docVal.back?.fileUrl) {
              toast.error(`${q.label}: Debes capturar el reverso de tu documento de identidad`);
              triggerShake();
              return false;
            }
          }
        } else if (docVal && docVal.selectedType !== 'passport') {
          if ((docVal.front?.fileUrl || docVal.back?.fileUrl) && (!docVal.front?.fileUrl || !docVal.back?.fileUrl)) {
            toast.error(`${q.label}: Si presentas tu documento de identidad, debes capturar ambas caras (Frente y Reverso)`);
            triggerShake();
            return false;
          }
        }
        return true;
      }

      if (q.type === 'selfie_liveness') {
        const selfieVal = (val && typeof val === 'object') ? (val as SelfieLivenessValue) : null;
        if (q.required) {
          if (!selfieVal?.step1?.fileUrl || !selfieVal?.step2?.fileUrl) {
            toast.error(`${q.label}: Debes completar ambos pasos de la verificación facial (Foto frontal y prueba de vida)`);
            triggerShake();
            return false;
          }
        }
        return true;
      }

      if (q.type === 'identity_verification') {
        const idVal = (val && typeof val === 'object') ? val : null;
        if (q.required) {
          if (!idVal?.isComplete || !idVal?.verification?.isMatch) {
            toast.error(`${q.label}: Debes completar la verificación de identidad biométrica.`);
            triggerShake();
            return false;
          }
        }
        return true;
      }

      if (q.type === 'file_upload') {
        if (!filesData[q.id] && !formData[q.id]) {
          toast.error(txt.fileRequired(q.label));
          triggerShake();
          return false;
        }
        return true;
      }

      if (q.type === 'richtext') {
        const strVal = typeof val === 'string' ? val : '';
        const plain = strVal.replace(/<[^>]*>/g, '').trim();
        if (!plain && strVal !== '<img') {
          toast.error(txt.fieldRequired(q.label));
          triggerShake();
          return false;
        }
        return true;
      }

      if (q.type === 'schedule_event') {
        const scheduleVal = val as ScheduleEventValue | undefined;
        if (!scheduleVal || (!scheduleVal.slotId && scheduleVal.rsvpStatus !== 'CONFIRMED')) {
          toast.error(formLocale === 'es' ? `${q.label}: Debes seleccionar un horario o confirmar asistencia` : `${q.label}: You must choose a time slot or confirm attendance`);
          triggerShake();
          return false;
        }
        return true;
      }

      if (q.type !== 'terms' && q.type !== 'terms_consent' && q.type !== 'schedule_event') {
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          toast.error(txt.fieldRequired(q.label));
          triggerShake();
          return false;
        }
      }
    }

    // Format validation for answered field
    if (val !== undefined && val !== null && val !== '') {
      const formatCheck = validateFieldFormat(q.type, q.label, val);
      if (!formatCheck.isValid) {
        toast.error(formatCheck.errorMsg);
        triggerShake();
        return false;
      }
    }

    // Evaluate Invalidation Rules ("Invalidar si")
    const invalidationCheck = evaluateFieldInvalidation(q, formData, decodeCurp);
    if (invalidationCheck.isInvalid) {
      toast.error(invalidationCheck.errorMessage || `El valor ingresado en "${q.label}" no cumple con los requisitos.`);
      triggerShake();
      return false;
    }

    return true;
  };

  // Core submission executor
  const executeSubmission = async (email: string, name: string) => {
    if (!formItem || !id) return;

    try {
      setSubmitting(true);
      const filesArray = Object.entries(filesData).map(([fieldId, file]) => ({
        fieldId,
        fileName: file.fileName,
        fileUrl: file.fileUrl
      }));

      const fieldLabelsMap: Record<string, string> = {};
      formItem.schema.forEach(sec => {
        (sec.fields || []).forEach(f => {
          fieldLabelsMap[f.id] = f.label;
        });
      });

      // Merge CURP metadata and verification details
      const submissionData = { ...formData };
      Object.keys(curpVerificationState).forEach(fId => {
        const st = curpVerificationState[fId];
        if (st) {
          const curpVal = typeof formData[fId] === 'string' ? formData[fId] : (formData[fId]?.curp || '');
          const decoded = curpVal ? decodeCurp(curpVal) : null;
          const meta = {
            curp: curpVal,
            ...(decoded || {}),
            ...(st.details || {}),
            verifiedByRenapo: Boolean(st.success && !st.isFallback),
            verifiedAt: new Date().toISOString()
          };
          submissionData[`${fId}_curp_metadata`] = meta;
          if (typeof submissionData[fId] === 'string') {
            submissionData[fId] = {
              curp: submissionData[fId],
              ...meta
            };
          }
        }
      });

      const formTelemetry = id ? getFormSubmissionTelemetry(id) : undefined;

      const result = await submitStandaloneForm(id, {
        data: submissionData,
        fieldLabels: fieldLabelsMap,
        files: filesArray,
        signature: signatureData,
        respondentEmail: email,
        respondentName: name || email,
        telemetry: formTelemetry
      });

      if (result && result.pollStats) {
        setSubmissionPollStats(result.pollStats);
      }

      // Clear draft on successful submission and persist verified respondent identity
      try {
        localStorage.removeItem(`cr_form_draft_${id}`);
        if (email) {
          localStorage.setItem('cr_form_verified_email', email);
          localStorage.setItem('cr_respondent_email', email);
        }
        if (name) {
          localStorage.setItem('cr_respondent_name', name);
        }
      } catch (e) {
        // ignore
      }

      if (email) {
        setVerifiedEmail(email);
      }

      setIsSubmitted(true);
      toast.success(formLocale === 'es' ? '¡Formulario enviado con éxito!' : 'Form submitted successfully!');
    } catch (e: any) {
      toast.error(e.message || (formLocale === 'es' ? 'Error al enviar formulario' : 'Error submitting form'));
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Handler
  const handleSubmitForm = async () => {
    if (!formItem || !id || submitting) return;

    // Validate active layout
    if (formItem.layoutStyle === 'focus_flow' || formItem.layoutStyle === 'typeform') {
      for (let i = 0; i < visibleFlatQuestions.length; i++) {
        if (!validateFlatQuestion(i)) {
          setTypeformIndex(i);
          return;
        }
      }
    } else {
      for (let i = 0; i < formItem.schema.length; i++) {
        if (!validateCurrentSection(i)) {
          setCurrentStep(i);
          return;
        }
      }
    }

    const activeVerifiedEmail = verifiedEmail || (typeof window !== 'undefined' ? localStorage.getItem('cr_form_verified_email') : '') || '';
    const activeRespondentName = respondentName.trim() || (typeof window !== 'undefined' ? localStorage.getItem('cr_respondent_name') : '') || '';

    // Check if identity verification is required for anonymous user
    if (!activeVerifiedEmail && !isAuthenticated) {
      setAuthError(null);
      setInlineVerifyStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Already authenticated or verified
    await executeSubmission(activeVerifiedEmail || emailInput.trim(), activeRespondentName);
  };

  // Inline Verification Handlers
  const handleSendInlineOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const name = respondentName.trim();
    const email = emailInput.trim();

    if (!name) {
      setAuthError(formLocale === 'es' ? 'Por favor ingresa tu nombre y apellidos' : 'Please enter your full name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setAuthError(formLocale === 'es' ? 'Ingresa un correo electrónico válido' : 'Please enter a valid email address');
      return;
    }

    try {
      setAuthLoading(true);
      if (!id) return;
      await requestStandaloneFormOTP(id, email);
      setInlineVerifyStep('otp');
      setOtpInput('');
      toast.success(
        formLocale === 'es' 
          ? `Código de seguridad de 6 dígitos enviado a ${email}` 
          : `6-digit security code sent to ${email}`
      );
    } catch (err: any) {
      setAuthError(err.message || (formLocale === 'es' ? 'Error al enviar código' : 'Error sending security code'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyAndSubmitInline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const email = emailInput.trim();
    const otp = otpInput.trim();

    if (!otp || otp.length < 6) {
      setAuthError(formLocale === 'es' ? 'Ingresa el código completo de 6 dígitos' : 'Please enter the full 6-digit code');
      return;
    }

    try {
      setAuthLoading(true);
      if (!id) return;
      const res = await verifyStandaloneFormOTP(id, email, otp);
      setSessionToken(res.sessionToken);
      setVerifiedEmail(res.verifiedEmail);
      try {
        localStorage.setItem('cr_form_session_token', res.sessionToken);
        localStorage.setItem('cr_form_verified_email', res.verifiedEmail);
        localStorage.setItem('cr_respondent_email', res.verifiedEmail);
        if (respondentName.trim()) {
          localStorage.setItem('cr_respondent_name', respondentName.trim());
        }
      } catch (e) {
        // ignore
      }
      toast.success(formLocale === 'es' ? 'Identidad confirmada con éxito' : 'Identity verified successfully');
      
      // Execute submit right away
      await executeSubmission(res.verifiedEmail, respondentName.trim());
    } catch (err: any) {
      setAuthError(err.message || (formLocale === 'es' ? 'Código incorrecto o expirado' : 'Invalid or expired code'));
    } finally {
      setAuthLoading(false);
    }
  };

  const getInputStyles = (dark = false) => {
    const radiusClass = getRadiusClass(borderRadius, 'input');
    const shadowClass = getShadowClass(shadowStyle);
    const weightClass = getBorderWeightClass(borderWeight);

    let className = '';
    let style: React.CSSProperties = {};

    if (fieldStyle === 'underlined') {
      className = `w-full bg-transparent border-b-2 py-2.5 px-1 text-base sm:text-xl font-medium outline-none transition-all placeholder:text-muted-foreground/35 ${
        dark ? 'text-white border-slate-700 focus:border-white' : 'text-slate-900 border-slate-300 focus:border-slate-900'
      }`;
      style = { borderBottomColor: themeColor };
    } else if (fieldStyle === 'filled') {
      className = `w-full ${radiusClass} ${shadowClass} p-3 sm:p-3.5 text-sm sm:text-base font-medium outline-none transition-all placeholder:text-muted-foreground/35 border border-slate-200/80 ${
        dark 
          ? 'bg-slate-800/90 text-white border-slate-700/80 focus:bg-slate-800 focus:border-slate-500' 
          : 'bg-slate-100 text-slate-900 border-slate-200 focus:bg-white focus:border-slate-400'
      }`;
    } else {
      // 'bordered'
      className = `w-full bg-white dark:bg-slate-900 ${radiusClass} ${shadowClass} ${weightClass} p-3 sm:p-3.5 text-sm sm:text-base font-medium outline-none transition-all placeholder:text-muted-foreground/35 ${
        dark 
          ? 'text-white border-slate-700 focus:border-slate-400' 
          : 'text-slate-900 border-slate-300 focus:border-slate-800'
      }`;
      style = { borderColor: `${themeColor}60` };
    }

    return { className, style };
  };

  const schoolName = formItem?.school?.name || 'Ceiba Roots Montessori';

  // Compact Respondent Footer Badge (Avatar + Name with Modal Trigger)
  const renderRespondentFooterBadge = () => {
    const currentDisplayName = respondentName.trim() || user?.fullName || (user?.email ? user.email.split('@')[0] : '') || (formLocale === 'es' ? 'Anónimo' : 'Anonymous');
    const initial = currentDisplayName.charAt(0).toUpperCase() || 'U';

    return (
      <div className="flex items-center select-none max-w-full">
        <button
          type="button"
          onClick={() => {
            setTempRespondentName(respondentName || user?.fullName || '');
            setTempEmailInput(emailInput || user?.email || '');
            setIsChangeIdentityModalOpen(true);
          }}
          className={`group h-10 sm:h-11 flex items-center gap-2 px-3 border transition-all cursor-pointer max-w-full ${getRadiusClass(borderRadius, 'button')} ${
            isDark 
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800' 
              : 'bg-white/95 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
          }`}
          title={formLocale === 'es' ? 'Clic para cambiar remitente' : 'Click to change respondent'}
        >
          {/* Avatar icon / initial */}
          <div 
            className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-white font-bold text-[11px] sm:text-xs shrink-0 shadow-2xs ${getRadiusClass(borderRadius, 'avatar')}`}
            style={{ backgroundColor: themeColor }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={currentDisplayName} className={`w-full h-full object-cover ${getRadiusClass(borderRadius, 'avatar')}`} />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          {/* Respondent Name */}
          <span className="text-xs font-semibold truncate max-w-[110px] sm:max-w-[180px] text-left">
            {currentDisplayName}
          </span>

          <span className="text-[10px] text-muted-foreground group-hover:text-forest hidden sm:inline-block font-normal">
            ({formLocale === 'es' ? 'Cambiar' : 'Change'})
          </span>
        </button>
      </div>
    );
  };

  const handleDisconnect = () => {
    setVerifiedEmail('');
    setEmailInput('');
    setRespondentName('');
    setSessionToken('');
    setIsSubmitted(false);
    setSubmissionPollStats(null);
    setFormData({});
    setFilesData({});
    setSignatureData(null);
    clearCanvas();
    clearModalCanvas();
    setCurrentStep(0);
    setTypeformIndex(0);

    try {
      localStorage.removeItem('cr_form_verified_email');
      localStorage.removeItem('cr_respondent_email');
      localStorage.removeItem('cr_respondent_name');
      localStorage.removeItem('cr_form_session_token');
      if (id) {
        localStorage.removeItem(`cr_form_draft_${id}`);
      }
    } catch (e) {
      // ignore
    }

    if (formItem?.accessType === 'PUBLIC') {
      setAuthStep('authorized');
    } else if (formItem?.accessType === 'RESTRICTED') {
      setAuthStep('email');
    }

    setIsChangeIdentityModalOpen(false);
    toast.success(formLocale === 'es' ? 'Sesión cerrada correctamente' : 'Logged out successfully');
  };

  const handleDeleteSubmissionAndRestart = async () => {
    const activeEmail = verifiedEmail || (typeof window !== 'undefined' ? localStorage.getItem('cr_form_verified_email') : '') || '';
    if (!activeEmail) {
      toast.error(formLocale === 'es' ? 'No se pudo identificar tu cuenta.' : 'Could not identify your account.');
      return;
    }

    const ok = await confirm({
      title: formLocale === 'es' ? '¿Eliminar tu respuesta?' : 'Delete your response?',
      description: formLocale === 'es'
        ? 'Esta acción eliminará de forma permanente tu respuesta y archivos enviados del sistema. Podrás rellenar el formulario nuevamente desde cero. ¿Deseas continuar?'
        : 'This action will permanently delete your response and files from the system. You will be able to fill out the form again from scratch. Do you want to continue?',
      confirmText: formLocale === 'es' ? 'Sí, eliminar respuesta' : 'Yes, delete response',
      cancelText: formLocale === 'es' ? 'Cancelar' : 'Cancel',
      variant: 'destructive',
      icon: 'warning',
      borderRadius: borderRadius as any
    });
    if (!ok) return;

    try {
      setLoading(true);
      await deleteStandaloneFormSubmission(id!, activeEmail);
      
      // Clear local states
      setIsSubmitted(false);
      setSubmissionPollStats(null);
      setFormData({});
      setFilesData({});
      setSignatureData(null);
      clearCanvas();
      clearModalCanvas();
      setCurrentStep(0);
      setTypeformIndex(0);

      // Clean local storage draft
      try {
        localStorage.removeItem(`cr_form_draft_${id}`);
      } catch (e) {}

      // Re-load form data to update stats & reset state
      await loadForm();

      toast.success(
        formLocale === 'es'
          ? 'Respuesta eliminada con éxito. Ya puedes responder de nuevo.'
          : 'Response successfully deleted. You can now fill it out again.'
      );
    } catch (e: any) {
      toast.error(e.message || (formLocale === 'es' ? 'Error al eliminar respuesta' : 'Error deleting response'));
    } finally {
      setLoading(false);
    }
  };

  // Change Respondent Identity Custom Modal (Responsive Bottom Drawer on Mobile)
  const renderChangeIdentityModal = () => {
    if (!isIdentityMounted) return null;

    const modalRadiusClass = borderRadius === 'none' ? 'rounded-none' : 'rounded-t-3xl sm:rounded-2xl';

    const handleIdentityTouchStart = (e: React.TouchEvent) => {
      identityTouchStartY.current = e.touches[0].clientY;
      setIsIdentityDragging(true);
    };

    const handleIdentityTouchMove = (e: React.TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = currentY - identityTouchStartY.current;
      if (diff > 0) {
        setIdentityDragY(diff);
      }
    };

    const handleIdentityTouchEnd = () => {
      setIsIdentityDragging(false);
      if (identityDragY > 55) {
        setIsChangeIdentityModalOpen(false);
      }
      setIdentityDragY(0);
    };

    return (
      <div 
        className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 ${
          isIdentityVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsChangeIdentityModalOpen(false)}
      >
        <div 
          className={`w-full max-w-md ${modalRadiusClass} p-6 sm:p-7 border shadow-2xl space-y-5 flex flex-col transition-all duration-300 ease-out transform ${
            isIdentityVisible 
              ? 'translate-y-0 opacity-100 sm:scale-100' 
              : 'translate-y-full sm:translate-y-0 opacity-0 sm:scale-95'
          } ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleIdentityTouchStart}
          onTouchMove={handleIdentityTouchMove}
          onTouchEnd={handleIdentityTouchEnd}
          style={{
            transform: identityDragY > 0 ? `translateY(${identityDragY}px)` : undefined,
            transition: isIdentityDragging ? 'none' : undefined
          }}
        >
          {/* Mobile Pull-down Handle Bar (Hidden on Desktop) */}
          <div 
            className="sm:hidden w-full -mt-2 pb-3 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onClick={() => setIsChangeIdentityModalOpen(false)}
          >
            <div className={`w-14 h-1.5 ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-300 hover:bg-slate-400'} rounded-full transition-colors`} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div 
                className={`w-9 h-9 ${getRadiusClass(borderRadius, 'card')} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0`}
                style={{ backgroundColor: themeColor }}
              >
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base font-display">
                  {formLocale === 'es' ? 'Identificación del Remitente' : 'Respondent Identification'}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {formLocale === 'es' ? 'Indica cómo deseas que se registre tu respuesta' : 'Specify how your response should be recorded'}
                </p>
              </div>
            </div>
            {/* Close Button on Desktop Only (Hidden on Mobile) */}
            <button
              type="button"
              onClick={() => setIsChangeIdentityModalOpen(false)}
              className={`hidden sm:flex p-1.5 ${getRadiusClass(borderRadius, 'button')} hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground transition-colors cursor-pointer`}
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold block">
                {txt.senderName} <span className="text-destructive font-bold">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={tempRespondentName}
                onChange={(e) => setTempRespondentName(e.target.value)}
                placeholder={txt.senderNamePlaceholder}
                className={`w-full border ${getRadiusClass(borderRadius, 'input')} p-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-400 font-medium ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block">
                {txt.senderEmail} <span className="text-muted-foreground text-[10px] font-normal">({txt.optional})</span>
              </label>
              <input
                type="email"
                value={tempEmailInput}
                onChange={(e) => setTempEmailInput(e.target.value)}
                placeholder={txt.senderEmailPlaceholder}
                className={`w-full border ${getRadiusClass(borderRadius, 'input')} p-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-400 font-medium ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 flex-wrap sm:flex-nowrap">
            <div>
              {(verifiedEmail || emailInput || respondentName) && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className={`px-3 py-2 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1.5 ${getRadiusClass(borderRadius, 'button')}`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{formLocale === 'es' ? 'Cambiar cuenta' : 'Switch account'}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChangeIdentityModalOpen(false)}
                className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {txt.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!tempRespondentName.trim()) {
                    toast.error(formLocale === 'es' ? 'Por favor ingresa tu nombre y apellidos' : 'Please enter your name');
                    return;
                  }
                  const newName = tempRespondentName.trim();
                  const newEmail = tempEmailInput.trim();
                  setRespondentName(newName);
                  try {
                    localStorage.setItem('cr_respondent_name', newName);
                  } catch (e) {
                    // ignore
                  }

                  if (newEmail) {
                    setEmailInput(newEmail);
                    setVerifiedEmail(newEmail);
                    try {
                      localStorage.setItem('cr_respondent_email', newEmail);
                      localStorage.setItem('cr_form_verified_email', newEmail);
                    } catch (e) {
                      // ignore
                    }
                  }
                  setIsChangeIdentityModalOpen(false);
                  toast.success(formLocale === 'es' ? 'Remitente actualizado' : 'Respondent updated');
                }}
                className={`px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                style={{ backgroundColor: themeColor }}
              >
                {formLocale === 'es' ? 'Guardar Cambios' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <div className="flex flex-col items-center gap-3 text-forest">
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
          <span className="text-sm font-semibold">Cargando...</span>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error || !formItem) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <div className="absolute top-6 right-6">
          <ThemeAndLanguageControls />
        </div>
        <div className={`p-8 border max-w-md w-full text-center space-y-4 ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)} ${getBorderWeightClass(borderWeight)} ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div className={`w-14 h-14 ${getRadiusClass(borderRadius, 'badge')} bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto`}>
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display">{txt.notAvailable}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error || 'El formulario solicitado no existe o no se encuentra publicado actualmente.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`w-full py-3 text-white text-xs font-bold shadow-sm transition-all ${getRadiusClass(borderRadius, 'button')}`}
            style={{ backgroundColor: themeColor }}
          >
            {txt.goToHome}
          </button>
        </div>
      </div>
    );
  }

  // 3. Success Submitted State
  if (isSubmitted) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-98 duration-300 relative ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-800'}`}>
        <div className="absolute top-6 right-6">
          <ThemeAndLanguageControls />
        </div>
        <div className={`p-8 sm:p-10 border max-w-lg w-full text-center space-y-6 ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)} ${getBorderWeightClass(borderWeight)} ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div 
            className={`w-20 h-20 flex items-center justify-center mx-auto text-white shadow-xl animate-in zoom-in-50 duration-500 ${
              borderRadius === 'none' ? 'rounded-none' : 'rounded-full'
            }`}
            style={{ backgroundColor: themeColor }}
          >
            <Check className="w-10 h-10 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {schoolName} • {txt.officialForm}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">
              {txt.submittedTitle}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              {txt.submittedDesc(formItem.title)}
            </p>
          </div>

          <div className={`p-4 border text-left space-y-1.5 text-xs ${getRadiusClass(borderRadius, 'input')} ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{txt.regDate}</span>
              <span className="font-semibold">{new Date().toLocaleString()}</span>
            </div>
            {(verifiedEmail || emailInput) && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{txt.regBy}</span>
                <span className="font-semibold">{verifiedEmail || emailInput}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{txt.statusLabel}</span>
              <span className="font-bold text-emerald-500">{txt.statusCompleted}</span>
            </div>
          </div>

          {/* Poll Statistics Results (after submission) */}
          {submissionPollStats && Object.keys(submissionPollStats).length > 0 && (
            <div className={`p-5 border text-left space-y-4 ${getRadiusClass(borderRadius, 'card')} ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-forest/20 shadow-xs'
            }`}>
              <div className={`flex items-center gap-2 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center text-forest">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-forest'}`}>Resultados de la Encuesta</h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Estadísticas acumuladas de todos los participantes.</p>
                </div>
              </div>

              {formItem.schema?.flatMap(sec => sec.fields || []).filter(fld => fld.type === 'poll' && fld.pollConfig?.showResultsAfterSubmit).map(fld => {
                const stats = submissionPollStats[fld.id];
                if (!stats) return null;

                const opts = fld.pollConfig?.options || [];
                return (
                  <div key={fld.id} className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{fld.label}</span>
                      <span className={`font-semibold text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {stats.totalVotes} {stats.totalVotes === 1 ? 'voto' : 'votos'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {opts.map(opt => {
                        const optStat = stats.options?.[opt.id] || { count: 0, pct: 0 };
                        return (
                          <div key={opt.id} className="space-y-1">
                            <div className={`flex items-center justify-between text-[11px] font-medium font-display ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              <span>{opt.title}</span>
                              <span>{optStat.pct}% ({optStat.count})</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-forest transition-all duration-500"
                                style={{ width: `${optStat.pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!(formItem?.allowMultipleResponses ?? formItem?.schema?.[0]?.allowMultipleResponses ?? true) && (
            <div className={`pt-3 border-t flex flex-col items-center gap-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {formLocale === 'es' ? 'Identidad Registrada' : 'Registered Identity'}
              </span>
              {renderRespondentFooterBadge()}
              
              <button
                type="button"
                onClick={handleDeleteSubmissionAndRestart}
                className={`mt-1.5 px-4 py-2 border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                  isDark 
                    ? 'bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border-rose-900/50 hover:border-rose-500/50' 
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300'
                } ${getRadiusClass(borderRadius, 'button')}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{formLocale === 'es' ? 'Eliminar respuesta y comenzar de nuevo' : 'Delete response & start over'}</span>
              </button>
            </div>
          )}

          {(formItem?.allowMultipleResponses ?? formItem?.schema?.[0]?.allowMultipleResponses ?? true) && (
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full">
              <button
                type="button"
                onClick={() => handleResetForm(true)}
                className={`w-full sm:w-auto px-5 py-2.5 border text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                } ${getRadiusClass(borderRadius, 'button')}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{txt.submitAnother}</span>
              </button>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            {txt.safeToClose}
          </p>
        </div>
        {renderChangeIdentityModal()}
      </div>
    );
  }

  // 4. Restricted Access Verification (Email Whitelist & 6-Digit OTP Gate)
  if (formItem?.accessType === 'RESTRICTED' && authStep !== 'authorized') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-slate-100 to-slate-50 text-slate-800'}`}>
        
        <div className="absolute top-6 right-6">
          <ThemeAndLanguageControls />
        </div>

        {/* School Branding Header */}
        <div className="mb-6 text-center space-y-2 max-w-md">
          <div className="flex items-center justify-center gap-2">
            <div 
              className={`w-10 h-10 ${getRadiusClass(borderRadius, 'badge')} flex items-center justify-center text-white font-bold shadow-md`}
              style={{ backgroundColor: themeColor }}
            >
              <School className="w-5 h-5" />
            </div>
            <span className="text-base font-bold font-display">{schoolName}</span>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{txt.restrictedTitle}</span>
          </span>
        </div>

        <div className={`border p-6 sm:p-8 max-w-md w-full space-y-6 ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)} ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-bold font-display">{formItem.title}</h2>
            <p className="text-xs text-muted-foreground">
              {authStep === 'email' 
                ? txt.restrictedDescEmail
                : txt.restrictedDescOtp(emailInput)}
            </p>
          </div>

          {authError && (
            <div className={`p-3.5 ${getRadiusClass(borderRadius, 'card')} bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2 animate-in fade-in`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {/* Step 4A: Enter Email */}
          {authStep === 'email' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold block">{txt.authorizedEmailLabel}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ejemplo@familia.com"
                    className={`w-full border pl-10 pr-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-400 transition-all font-medium ${getRadiusClass(borderRadius, 'input')} ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className={`w-full py-3.5 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 disabled:opacity-50 ${getRadiusClass(borderRadius, 'button')}`}
                style={{ backgroundColor: themeColor }}
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{txt.verifyAndReceiveCode}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 4B: Enter 6-digit OTP */}
          {authStep === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold block">{txt.securityCodeLabel}</label>
                <SixDigitOtpBoxes
                  value={otpInput}
                  onChange={(val) => {
                    setOtpInput(val);
                    if (authError) setAuthError(null);
                  }}
                  isDark={isDark}
                  themeColor={themeColor}
                  borderRadius={borderRadius}
                  autoFocus={true}
                  disabled={authLoading}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading || otpInput.length < 6}
                className={`w-full py-3.5 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 disabled:opacity-50 ${getRadiusClass(borderRadius, 'button')}`}
                style={{ backgroundColor: themeColor }}
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{txt.validateCodeAndEnter}</span>
                  </>
                )}
              </button>

              <div className={`flex items-center justify-between text-xs pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setAuthStep('email')}
                  className="text-muted-foreground hover:text-slate-300 font-semibold"
                >
                  {txt.changeEmail}
                </button>
                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={authLoading}
                  className="hover:underline font-bold"
                  style={{ color: themeColor }}
                >
                  {txt.resendCode}
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-2">
            <span className="text-[10px] text-muted-foreground">
              {txt.protectedBy}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // FLUJO GUIADO: RENDERER DE PREGUNTA EN FOCUS FLOW
  // ----------------------------------------------------
  const renderFocusQuestionCard = (qIdx: number, isOutgoing: boolean = false) => {
    const currentQ = visibleFlatQuestions[qIdx];
    if (!currentQ) return null;

    return (
      <div className="space-y-6 sm:space-y-8 w-full max-w-2xl mx-auto my-auto pb-12 sm:pb-4">
        {/* Question Step Tag & Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm font-mono" style={{ color: themeColor }}>
            <span>{String(qIdx + 1).padStart(2, '0')}</span>
            <ArrowRight className="w-4 h-4" />
            <span className={`text-xs uppercase px-2.5 py-1 rounded-lg font-sans font-semibold ${
              isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-800'
            }`}>
              {currentQ.sectionTitle}
            </span>
          </div>
          <h2 className={`text-2xl sm:text-4xl font-bold font-display leading-tight tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {currentQ.label}
            {currentQ.required && (
              <span className="text-rose-500 ml-1.5 font-bold">*</span>
            )}
          </h2>
          {currentQ.helpText && (
            <p className="text-sm sm:text-base text-muted-foreground">{currentQ.helpText}</p>
          )}
        </div>

        {/* Question Inputs */}
        {currentQ.type === 'single_choice' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {(currentQ.options || []).map((opt, oIdx) => {
              const isSelected = formData[currentQ.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (isOutgoing) return;
                    setFormData({ ...formData, [currentQ.id]: opt });
                    if (qIdx < visibleFlatQuestions.length - 1) {
                      setTimeout(() => goToTypeformIndex(qIdx + 1, 'left'), 280);
                    }
                  }}
                  className={`p-4 sm:p-5 border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${getShadowClass(shadowStyle)} ${
                    isSelected
                      ? 'text-white shadow-lg font-bold scale-[1.01]'
                      : isDark
                      ? 'bg-slate-900/90 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-xs'
                  }`}
                  style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                >
                  <div className="flex items-center gap-3.5 text-sm sm:text-base font-semibold">
                    <span className={`w-8 h-8 ${getRadiusClass(borderRadius, 'avatar')} text-xs font-bold flex items-center justify-center font-mono ${
                      isSelected ? 'bg-white/20 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        ) : currentQ.type === 'textarea' ? (
          <textarea
            rows={3}
            placeholder={currentQ.placeholder || '...'}
            value={formData[currentQ.id] || ''}
            onChange={(e) => setFormData({ ...formData, [currentQ.id]: e.target.value })}
            className={getInputStyles(isDark).className}
            style={getInputStyles(isDark).style}
          />
        ) : currentQ.type === 'signature' ? (
          <div className="space-y-4 pt-2 w-full">
            {signatureData || formData[currentQ.id] ? (
              <div className={`p-6 sm:p-8 border shadow-sm space-y-4 w-full ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)} ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> {txt.signatureCaptured}
                  </span>
                  {!isOutgoing && (
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureData(null);
                        setFormData(prev => ({ ...prev, [currentQ.id]: null }));
                      }}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {txt.clearSignature}
                    </button>
                  )}
                </div>
                <div className={`p-4 border flex items-center justify-center min-h-[140px] transition-colors ${getRadiusClass(borderRadius, 'input')} ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <img 
                    src={formData[currentQ.id] || signatureData} 
                    alt="Firma" 
                    className="max-h-32 object-contain" 
                  />
                </div>
                {!isOutgoing && (
                  <button
                    type="button"
                    onClick={() => openSignatureModal(currentQ.id)}
                    className={`w-full py-3 border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                      isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> {txt.resignFullScreen}
                  </button>
                )}
              </div>
            ) : (
              <div 
                onClick={() => !isOutgoing && openSignatureModal(currentQ.id)}
                className={`cursor-pointer border-2 border-dashed p-8 sm:p-14 text-center transition-all hover:scale-[1.008] w-full group space-y-3.5 ${getRadiusClass(borderRadius, 'card')} ${
                  isDark 
                    ? 'bg-slate-900/80 border-slate-700 hover:border-slate-500' 
                    : 'bg-white border-slate-300 hover:border-slate-400 hover:shadow-md'
                }`}
              >
                <div className="w-16 h-16 rounded-3xl bg-forest/10 group-hover:bg-forest/20 text-forest flex items-center justify-center mx-auto transition-colors" style={{ color: themeColor }}>
                  <PenTool className="w-8 h-8" />
                </div>
                <h4 className={`font-bold text-base sm:text-xl font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{txt.tapToSign}</h4>
              </div>
            )}
          </div>
        ) : currentQ.type === 'identity_verification' ? (
          <div className="pt-2 w-full">
            <IdentityVerificationWidget
              field={currentQ}
              value={formData[currentQ.id]}
              onChange={(val) => setFormData((prev) => ({ ...prev, [currentQ.id]: val }))}
              onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
              isDark={isDark}
              themeColor={themeColor}
              borderRadius={borderRadius}
              shadowStyle={shadowStyle}
              layoutVariant="focus"
            />
          </div>
        ) : currentQ.type === 'document_capture' ? (
          <div className="pt-2 w-full">
            <DocumentCaptureWidget
              field={currentQ}
              value={formData[currentQ.id]}
              fileInfo={filesData[currentQ.id]}
              onProcessKycSide={handleKycProcessSide}
              onRemoveKycSide={handleKycRemoveSide}
              onSelectDocType={handleKycSelectDocType}
              onProcessFile={handleProcessFile}
              onRemoveFile={handleRemoveFile}
              onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
              isDark={isDark}
              themeColor={themeColor}
              borderRadius={borderRadius}
              shadowStyle={shadowStyle}
              layoutVariant="focus"
            />
          </div>
        ) : currentQ.type === 'selfie_liveness' ? (
          <div className="pt-2 w-full">
            <SelfieLivenessWidget
              field={currentQ}
              value={formData[currentQ.id]}
              onProcessSelfieStep={handleSelfieProcessStep}
              onRemoveSelfieStep={handleSelfieRemoveStep}
              onResetSelfie={handleSelfieReset}
              onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
              isDark={isDark}
              themeColor={themeColor}
              borderRadius={borderRadius}
              shadowStyle={shadowStyle}
              layoutVariant="focus"
            />
          </div>
        ) : currentQ.type === 'file_upload' ? (
          <div className="space-y-4 pt-2 w-full">
            {filesData[currentQ.id] ? (
              <div className={`p-6 sm:p-8 border shadow-sm space-y-4 w-full ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)} ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> {txt.fileReady}
                  </span>
                  {!isOutgoing && (
                    <button
                      type="button"
                      onClick={() => {
                        const copy = { ...filesData };
                        delete copy[currentQ.id];
                        setFilesData(copy);
                      }}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {txt.remove}
                    </button>
                  )}
                </div>
                <div className={`flex items-center gap-4 p-5 border ${getRadiusClass(borderRadius, 'input')} ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <FileText className="w-10 h-10 text-forest shrink-0" style={{ color: themeColor }} />
                  <div className="overflow-hidden">
                    <p className={`text-sm sm:text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{filesData[currentQ.id].fileName}</p>
                    <span className="text-xs text-muted-foreground">{txt.fileUploadedSuccess}</span>
                  </div>
                </div>
              </div>
            ) : (
              <label className={`cursor-pointer border-2 border-dashed p-8 sm:p-14 text-center transition-all hover:scale-[1.008] block group space-y-3.5 w-full ${getRadiusClass(borderRadius, 'card')} ${
                isDark 
                  ? 'bg-slate-900/80 border-slate-700 hover:border-slate-500' 
                  : 'bg-white border-slate-300 hover:border-slate-400 hover:shadow-md'
              }`}>
                <input
                  type="file"
                  className="hidden"
                  disabled={isOutgoing}
                  onChange={(e) => handleFileUpload(currentQ.id, e)}
                />
                <div className="w-16 h-16 rounded-3xl bg-forest/10 group-hover:bg-forest/20 text-forest flex items-center justify-center mx-auto transition-colors" style={{ color: themeColor }}>
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h4 className={`font-bold text-base sm:text-xl font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{txt.uploadPrompt}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{txt.uploadSub}</p>
                </div>
              </label>
            )}
          </div>
        ) : currentQ.type === 'multiple_choice' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {(currentQ.options || []).map((opt, oIdx) => {
              const currentArr = formData[currentQ.id] || [];
              const isChecked = currentArr.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (isOutgoing) return;
                    const next = isChecked ? currentArr.filter((x: string) => x !== opt) : [...currentArr, opt];
                    setFormData({ ...formData, [currentQ.id]: next });
                  }}
                  className={`p-4 sm:p-5 border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${getShadowClass(shadowStyle)} ${
                    isChecked
                      ? 'text-white shadow-lg font-bold scale-[1.01]'
                      : isDark
                      ? 'bg-slate-900/90 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-xs'
                  }`}
                  style={isChecked ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                >
                  <div className="flex items-center gap-3.5 text-sm sm:text-base font-semibold">
                    <span className={`w-8 h-8 ${getRadiusClass(borderRadius, 'avatar')} text-xs font-bold flex items-center justify-center font-mono ${
                      isChecked ? 'bg-white/20 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : currentQ.type === 'poll' ? (
          <div className="space-y-3 pt-2 w-full">
            {(currentQ.pollConfig?.options || []).map((opt, oIdx) => {
              const allowMultiple = !!currentQ.pollConfig?.allowMultiple;
              let isSelected = false;
              if (allowMultiple) {
                const currentArr = formData[currentQ.id] || [];
                isSelected = currentArr.includes(opt.id);
              } else {
                isSelected = formData[currentQ.id] === opt.id;
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (isOutgoing) return;
                    if (allowMultiple) {
                      const currentArr = formData[currentQ.id] || [];
                      const next = isSelected
                        ? currentArr.filter((v: string) => v !== opt.id)
                        : [...currentArr, opt.id];
                      setFormData({ ...formData, [currentQ.id]: next });
                    } else {
                      setFormData({ ...formData, [currentQ.id]: opt.id });
                      if (qIdx < visibleFlatQuestions.length - 1) {
                        setTimeout(() => goToTypeformIndex(qIdx + 1, 'left'), 280);
                      }
                    }
                  }}
                  className={`p-4 sm:p-5 border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer gap-2 relative w-full ${getRadiusClass(borderRadius, 'button')} ${getShadowClass(shadowStyle)} ${
                    isSelected
                      ? 'text-white shadow-lg font-bold scale-[1.01]'
                      : isDark
                      ? 'bg-slate-900/90 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-xs'
                  }`}
                  style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                >
                  <div className="flex items-center gap-3.5 text-sm sm:text-base font-semibold">
                    <span className={`w-8 h-8 ${getRadiusClass(borderRadius, 'avatar')} text-xs font-bold flex items-center justify-center font-mono ${
                      isSelected ? 'bg-white/20 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="font-bold">{opt.title}</span>
                  </div>
                  {opt.description && (
                    <p className={`text-xs leading-relaxed font-normal ${isSelected ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{opt.description}</p>
                  )}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : currentQ.type === 'range' ? (
          <FocusRangeWidget
            field={currentQ}
            value={formData[currentQ.id]}
            onChange={(val) => handleFieldChange(currentQ.id, 'range', val)}
            isOutgoing={isOutgoing}
            themeColor={themeColor}
            isDark={isDark}
            borderRadius={borderRadius}
          />
        ) : currentQ.type === 'composite' ? (
          <div className={`w-full space-y-6 pt-2 p-6 sm:p-8 border ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)} ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-amber-50/60 border-amber-200/70'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {((currentQ.subfields && currentQ.subfields.length > 0)
                ? currentQ.subfields
                : [
                    { id: 'fullName', label: 'Nombre Completo', type: 'text' as FormFieldType, required: true },
                    { id: 'relationship', label: 'Parentesco / Relación', type: 'single_choice' as FormFieldType, options: ['Padre', 'Madre', 'Tutor Legal', 'Abuelo(a)', 'Familiar', 'Otro'], required: true },
                    { id: 'phone', label: 'Teléfono Móvil', type: 'phone' as FormFieldType, required: true },
                    { id: 'email', label: 'Correo Electrónico', type: 'email' as FormFieldType, required: false }
                  ]
              ).map((sub) => {
                const compVal = formData[currentQ.id] || {};
                const subVal = compVal[sub.id] ?? '';

                return (
                  <div key={sub.id} className={`space-y-1.5 ${sub.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                    <label className="text-xs sm:text-sm font-bold flex items-center gap-1 block" style={{ color: themeColor }}>
                      <span>{sub.label}</span>
                      {sub.required && <span className="text-rose-500 font-bold">*</span>}
                    </label>
                    {sub.type === 'single_choice' ? (
                      <ResponsiveCustomSelect
                        value={subVal || ''}
                        onChange={(val) => {
                          if (isOutgoing) return;
                          handleCompositeFieldChange(currentQ.id, sub.id, sub.type, val);
                        }}
                        options={sub.options || []}
                        placeholder={sub.placeholder || '-- Seleccionar --'}
                        label={sub.label}
                        isDark={isDark}
                        themeColor={themeColor}
                        variant={fieldStyle}
                        borderRadius={borderRadius}
                        shadowStyle={shadowStyle}
                        borderWeight={borderWeight}
                      />
                    ) : sub.type === 'boolean' ? (
                      <div className="flex items-center gap-2 pt-1">
                        {['Sí', 'No'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              if (isOutgoing) return;
                              handleCompositeFieldChange(currentQ.id, sub.id, sub.type, val === 'Sí' ? 'true' : 'false');
                            }}
                            className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                              subVal === (val === 'Sí') || subVal === (val === 'Sí' ? 'true' : 'false')
                                ? 'text-white font-bold shadow-xs'
                                : isDark
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            style={subVal === (val === 'Sí') || subVal === (val === 'Sí' ? 'true' : 'false') ? { backgroundColor: themeColor } : {}}
                          >
                            {val === 'Sí' ? txt.yes : txt.no}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={sub.type === 'phone' ? 'tel' : sub.type === 'email' ? 'email' : sub.type === 'date' ? 'date' : sub.type === 'integer' || sub.type === 'decimal' ? 'number' : 'text'}
                        placeholder={sub.placeholder || (sub.type === 'phone' ? `${sub.defaultCountryCode || currentQ.defaultCountryCode || '+52'} 55 1234 5678` : '...')}
                        value={subVal}
                        disabled={isOutgoing}
                        onFocus={() => {
                          if (sub.type === 'phone' && (!subVal || !subVal.toString().trim())) {
                            const code = (sub.defaultCountryCode || currentQ.defaultCountryCode || '+52') + ' ';
                            handleCompositeFieldChange(currentQ.id, sub.id, 'phone', code);
                          }
                        }}
                        onChange={(e) => handleCompositeFieldChange(currentQ.id, sub.id, sub.type, e.target.value)}
                        className={getInputStyles(isDark).className}
                        style={getInputStyles(isDark).style}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : currentQ.type === 'fullname' ? (
          <div className={`w-full space-y-6 pt-2 p-6 sm:p-8 border ${getRadiusClass(borderRadius, 'card')} ${getShadowClass(shadowStyle)} ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold block" style={{ color: themeColor }}>
                Nombre o Nombres <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                disabled={isOutgoing}
                placeholder="Ej. Juan Carlos"
                value={(formData[currentQ.id] || {}).firstName || ''}
                onChange={(e) => handleCompositeFieldChange(currentQ.id, 'firstName', 'fullname', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isOutgoing) {
                    e.preventDefault();
                    if (validateFlatQuestion(qIdx)) {
                      if (qIdx < visibleFlatQuestions.length - 1) {
                        goToTypeformIndex(qIdx + 1, 'left');
                      } else {
                        handleSubmitForm();
                      }
                    }
                  }
                }}
                className={getInputStyles(isDark).className}
                style={getInputStyles(isDark).style}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold block" style={{ color: themeColor }}>
                  Apellido Paterno <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  disabled={isOutgoing}
                  placeholder="Ej. Pérez"
                  value={(formData[currentQ.id] || {}).paternalLastName || ''}
                  onChange={(e) => handleCompositeFieldChange(currentQ.id, 'paternalLastName', 'fullname', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOutgoing) {
                      e.preventDefault();
                      if (validateFlatQuestion(qIdx)) {
                        if (qIdx < visibleFlatQuestions.length - 1) {
                          goToTypeformIndex(qIdx + 1, 'left');
                        } else {
                          handleSubmitForm();
                        }
                      }
                    }
                  }}
                  className={getInputStyles(isDark).className}
                  style={getInputStyles(isDark).style}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold block" style={{ color: themeColor }}>
                  Apellido Materno <span className="text-muted-foreground text-[11px] font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  disabled={isOutgoing}
                  placeholder="Ej. Gómez"
                  value={(formData[currentQ.id] || {}).maternalLastName || ''}
                  onChange={(e) => handleCompositeFieldChange(currentQ.id, 'maternalLastName', 'fullname', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOutgoing) {
                      e.preventDefault();
                      if (validateFlatQuestion(qIdx)) {
                        if (qIdx < visibleFlatQuestions.length - 1) {
                          goToTypeformIndex(qIdx + 1, 'left');
                        } else {
                          handleSubmitForm();
                        }
                      }
                    }
                  }}
                  className={getInputStyles(isDark).className}
                  style={getInputStyles(isDark).style}
                />
              </div>
            </div>
          </div>
        ) : currentQ.type === 'boolean' ? (
          <div className="grid grid-cols-2 gap-4 pt-2 max-w-md">
            {['Sí', 'No'].map((val) => {
              const isSelected = formData[currentQ.id] === val;
              const localizedLabel = val === 'Sí' ? txt.yes : txt.no;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    if (isOutgoing) return;
                    setFormData({ ...formData, [currentQ.id]: val });
                    if (qIdx < visibleFlatQuestions.length - 1) {
                      setTimeout(() => goToTypeformIndex(qIdx + 1, 'left'), 280);
                    }
                  }}
                  className={`p-5 border text-center font-bold text-lg transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${getShadowClass(shadowStyle)} ${
                    isSelected
                      ? 'text-white shadow-lg scale-102'
                      : isDark
                      ? 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800 shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-xs'
                  }`}
                  style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                >
                  {localizedLabel}
                </button>
              );
            })}
          </div>
        ) : currentQ.type === 'terms_consent' ? (
          <div className="pt-2 w-full">
            <TermsConsentWidget
              field={currentQ}
              checked={!!formData[currentQ.id]}
              onChange={(val) => setFormData(prev => ({ ...prev, [currentQ.id]: val }))}
              themeColor={themeColor}
              isDark={isDark}
              borderRadius={borderRadius}
            />
          </div>
        ) : currentQ.type === 'schedule_event' ? (
          <div className="pt-2 w-full">
            <ScheduleEventWidget
              field={currentQ}
              value={formData[currentQ.id]}
              onChange={(val) => setFormData(prev => ({ ...prev, [currentQ.id]: val }))}
              themeColor={themeColor}
              borderRadius={getRadiusClass(borderRadius, 'card')}
              isDark={isDark}
              layoutVariant="focus"
            />
          </div>
        ) : currentQ.type === 'richtext' ? (
          <div className="space-y-1.5 pt-0.5 w-full">
            <RichTextEditor
              value={formData[currentQ.id] || ''}
              onChange={(html) => setFormData(prev => ({ ...prev, [currentQ.id]: html }))}
              placeholder={currentQ.placeholder || (formLocale === 'es' ? 'Escribe tu respuesta con formato enriquecido (negritas, viñetas, enlaces)...' : 'Type your formatted response here...')}
              minHeight={currentQ.maxHeight || '160px'}
            />
          </div>
        ) : currentQ.type === 'curp' && currentQ.verifyCurp ? (
          <div className="w-full space-y-2">
            <div className="relative w-full">
              <input
                type="text"
                disabled={isVerifyingCurp || curpVerificationState[currentQ.id]?.success}
                placeholder={currentQ.placeholder || '18 caracteres (ej. AAAA000000HAAAAAAA0)'}
                value={formData[currentQ.id] || ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 18);
                  setFormData(prev => ({ ...prev, [currentQ.id]: upper }));
                  if (curpVerificationState[currentQ.id]) {
                    setCurpVerificationState(prev => ({ ...prev, [currentQ.id]: undefined }));
                  }
                  if (/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/.test(upper)) {
                    handleVerifyCurp(currentQ.id, upper);
                  }
                }}
                className={`${getInputStyles(isDark).className} pr-10`}
                style={getInputStyles(isDark).style}
              />
              {formData[currentQ.id] && !isVerifyingCurp && (
                <button
                  type="button"
                  onClick={() => {
                    setCurpVerificationState(prev => ({ ...prev, [currentQ.id]: undefined }));
                    setFormData(prev => ({ 
                      ...prev, 
                      [currentQ.id]: '',
                      [`${currentQ.id}_fallback`]: undefined 
                    }));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100/50 transition-all shrink-0 animate-in fade-in cursor-pointer"
                  title="Limpiar CURP"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isVerifyingCurp && (
              <div className={`flex items-center justify-between gap-3 mt-2.5 p-2.5 rounded-xl border text-xs sm:text-sm font-medium animate-in fade-in ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-forest" style={{ color: themeColor }} />
                  <span className="truncate">{curpStatusMsg || txt.curpVerifying}</span>
                </div>
                {curpCountdown !== null && (
                  <span 
                    className="font-mono font-bold text-xs px-2 py-0.5 rounded-full border shrink-0"
                    style={{ color: themeColor, borderColor: `${themeColor}40`, backgroundColor: `${themeColor}10` }}
                  >
                    {curpCountdown}s
                  </span>
                )}
              </div>
            )}

            {!isVerifyingCurp && curpVerificationState[currentQ.id]?.message && (
              curpVerificationState[currentQ.id]?.success && curpVerificationState[currentQ.id]?.details ? (
                <CurpIdentityCard 
                  details={curpVerificationState[currentQ.id].details} 
                  themeColor={themeColor}
                  borderRadius={borderRadius}
                  isDark={isDark}
                  onClear={() => {
                    setCurpVerificationState(prev => ({ ...prev, [currentQ.id]: undefined }));
                    setFormData(prev => ({ ...prev, [currentQ.id]: '' }));
                  }} 
                />
              ) : (
                <p className="text-xs leading-relaxed font-semibold animate-in fade-in slide-in-from-top-1 duration-200 text-rose-500 mt-2">
                  {curpVerificationState[currentQ.id]?.message}
                </p>
              )
            )}

            {!isVerifyingCurp && curpVerificationState[currentQ.id]?.fallbackRequired && (() => {
              const curpRaw = formData[currentQ.id] ? String(formData[currentQ.id]).trim() : '';
              const fallbackVal = formData[`${currentQ.id}_fallback`] || {};
              const firstNameCombined = [fallbackVal.firstName, fallbackVal.middleName].filter(Boolean).join(' ');
              const validationCheck = validateNameAgainstCurp(
                firstNameCombined || '',
                fallbackVal.paternalLastName || '',
                fallbackVal.maternalLastName || '',
                curpRaw
              );

              return (
                <div className={`p-4 sm:p-5 border space-y-3.5 animate-in fade-in duration-200 mt-3 ${
                  borderRadius === 'none' ? 'rounded-none' : 'rounded-2xl'
                } ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Completa tus datos personales
                      </h5>
                      <p className={`text-[11px] leading-relaxed mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Ingresa los siguientes nombres y apellidos para continuar con tu registro:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Col 1 Row 1: Primer Nombre */}
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold block ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                        Primer Nombre <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fallbackVal.firstName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const existing = prev[`${currentQ.id}_fallback`] || {};
                            const updatedFallback = { ...existing, firstName: val };
                            const combined = [val, updatedFallback.middleName].filter(Boolean).join(' ');
                            
                            const updatedFormData = {
                              ...prev,
                              [`${currentQ.id}_fallback`]: updatedFallback
                            };
                            
                            allFlatQuestions.forEach((fq: any) => {
                              if (fq.type === 'fullname') {
                                updatedFormData[fq.id] = {
                                  ...(prev[fq.id] || {}),
                                  firstName: combined,
                                  paternalLastName: updatedFallback.paternalLastName || prev[fq.id]?.paternalLastName || '',
                                  maternalLastName: updatedFallback.maternalLastName || prev[fq.id]?.maternalLastName || ''
                                };
                              }
                            });
                            return updatedFormData;
                          });
                        }}
                        placeholder="Ej. Juan"
                        className={`w-full ${getInputStyles(isDark).className} p-2.5 text-xs sm:text-sm`}
                        style={getInputStyles(isDark).style}
                      />
                    </div>

                    {/* Col 2 Row 1: Segundo Nombre (Opcional) */}
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold block ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                        Segundo Nombre <span className="text-slate-400 font-normal text-[10px]">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={fallbackVal.middleName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const existing = prev[`${currentQ.id}_fallback`] || {};
                            const updatedFallback = { ...existing, middleName: val };
                            const combined = [updatedFallback.firstName, val].filter(Boolean).join(' ');
                            
                            const updatedFormData = {
                              ...prev,
                              [`${currentQ.id}_fallback`]: updatedFallback
                            };
                            
                            allFlatQuestions.forEach((fq: any) => {
                              if (fq.type === 'fullname') {
                                updatedFormData[fq.id] = {
                                  ...(prev[fq.id] || {}),
                                  firstName: combined,
                                  paternalLastName: updatedFallback.paternalLastName || prev[fq.id]?.paternalLastName || '',
                                  maternalLastName: updatedFallback.maternalLastName || prev[fq.id]?.maternalLastName || ''
                                };
                              }
                            });
                            return updatedFormData;
                          });
                        }}
                        placeholder="Ej. Carlos"
                        className={`w-full ${getInputStyles(isDark).className} p-2.5 text-xs sm:text-sm`}
                        style={getInputStyles(isDark).style}
                      />
                    </div>

                    {/* Col 1 Row 2: Primer Apellido (Paterno) */}
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold block ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                        Primer Apellido (Paterno) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fallbackVal.paternalLastName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const existing = prev[`${currentQ.id}_fallback`] || {};
                            const updatedFallback = { ...existing, paternalLastName: val };
                            
                            const updatedFormData = {
                              ...prev,
                              [`${currentQ.id}_fallback`]: updatedFallback
                            };
                            
                            allFlatQuestions.forEach((fq: any) => {
                              if (fq.type === 'fullname') {
                                updatedFormData[fq.id] = {
                                  ...(prev[fq.id] || {}),
                                  firstName: [updatedFallback.firstName, updatedFallback.middleName].filter(Boolean).join(' ') || prev[fq.id]?.firstName || '',
                                  paternalLastName: val,
                                  maternalLastName: updatedFallback.maternalLastName || prev[fq.id]?.maternalLastName || ''
                                };
                              }
                            });
                            return updatedFormData;
                          });
                        }}
                        placeholder="Ej. Pérez"
                        className={`w-full ${getInputStyles(isDark).className} p-2.5 text-xs sm:text-sm`}
                        style={getInputStyles(isDark).style}
                      />
                    </div>

                    {/* Col 2 Row 2: Segundo Apellido (Materno) */}
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold block ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                        Segundo Apellido (Materno) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fallbackVal.maternalLastName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const existing = prev[`${currentQ.id}_fallback`] || {};
                            const updatedFallback = { ...existing, maternalLastName: val };
                            
                            const updatedFormData = {
                              ...prev,
                              [`${currentQ.id}_fallback`]: updatedFallback
                            };
                            
                            allFlatQuestions.forEach((fq: any) => {
                              if (fq.type === 'fullname') {
                                updatedFormData[fq.id] = {
                                  ...(prev[fq.id] || {}),
                                  firstName: [updatedFallback.firstName, updatedFallback.middleName].filter(Boolean).join(' ') || prev[fq.id]?.firstName || '',
                                  paternalLastName: updatedFallback.paternalLastName || prev[fq.id]?.paternalLastName || '',
                                  maternalLastName: val
                                };
                              }
                            });
                            return updatedFormData;
                          });
                        }}
                        placeholder="Ej. Gómez"
                        className={`w-full ${getInputStyles(isDark).className} p-2.5 text-xs sm:text-sm`}
                        style={getInputStyles(isDark).style}
                      />
                    </div>
                  </div>

                  {!validationCheck.isValid && (
                    <div className={`text-[10.5px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${
                      isDark ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200/70 text-amber-800'
                    }`}>
                      {validationCheck.warnings.map((w, idx) => (
                        <span key={idx}>{w}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <input
            type={currentQ.type === 'phone' ? 'tel' : currentQ.type === 'email' ? 'email' : currentQ.type === 'date' ? 'date' : currentQ.type === 'integer' || currentQ.type === 'decimal' ? 'number' : 'text'}
            disabled={isOutgoing}
            placeholder={currentQ.placeholder || (currentQ.type === 'phone' ? `${currentQ.defaultCountryCode || '+52'} 55 1234 5678` : '...')}
            value={formData[currentQ.id] || ''}
            onFocus={() => {
              if (currentQ?.type === 'phone' && (!formData[currentQ.id] || !formData[currentQ.id].toString().trim())) {
                const code = (currentQ.defaultCountryCode || '+52') + ' ';
                handleFieldChange(currentQ.id, 'phone', code);
              }
            }}
            onChange={(e) => handleFieldChange(currentQ.id, currentQ.type, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isOutgoing) {
                e.preventDefault();
                if (validateFlatQuestion(qIdx)) {
                  if (qIdx < visibleFlatQuestions.length - 1) {
                    goToTypeformIndex(qIdx + 1, 'left');
                  } else {
                    handleSubmitForm();
                  }
                }
              }
            }}
            className={getInputStyles(isDark).className}
            style={getInputStyles(isDark).style}
          />
        )}

        {/* Display Invalidation Error Inline */}
        {(() => {
          const inv = evaluateFieldInvalidation(currentQ, formData, decodeCurp);
          if (inv.isInvalid) {
            return (
              <div className={`flex items-center gap-2 mt-2.5 p-2.5 rounded-xl border text-xs font-bold animate-in fade-in ${
                isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{inv.errorMessage}</span>
              </div>
            );
          }
          return null;
        })()}

        {/* Helper shortcut & Inline Accept Action button */}
        {!isOutgoing && (() => {
          const isTermsConsent = currentQ.type === 'terms_consent' || currentQ.type === 'terms';
          const isSignature = currentQ.type === 'signature';
          const isDocCapture = currentQ.type === 'document_capture';
          const isSelfie = currentQ.type === 'selfie_liveness';
          const isIdentity = currentQ.type === 'identity_verification';

          // When field is required, do not show the Accept button until required input is provided
          if (currentQ.required) {
            if (isTermsConsent && !formData[currentQ.id]) return null;
            if (isSignature && !formData[currentQ.id]) return null;
            if (isDocCapture && !formData[currentQ.id]?.isComplete) return null;
            if (isSelfie && !formData[currentQ.id]?.isComplete) return null;
            if (isIdentity && !formData[currentQ.id]?.isComplete) return null;
          }

          const isTermsBlocked = isTermsConsent && currentQ.required && !formData[currentQ.id];
          const isScheduleBlocked = currentQ.type === 'schedule_event' && currentQ.required && !(formData[currentQ.id]?.slotId || formData[currentQ.id]?.rsvpStatus === 'CONFIRMED');
          const isSigBlocked = isSignature && currentQ.required && !formData[currentQ.id];
          const isDocBlocked = isDocCapture && currentQ.required && !formData[currentQ.id]?.isComplete;
          const isSelfieBlocked = isSelfie && currentQ.required && !formData[currentQ.id]?.isComplete;
          const isIdentityBlocked = isIdentity && (currentQ.required ? (!formData[currentQ.id]?.isComplete || !formData[currentQ.id]?.verification?.isMatch) : (formData[currentQ.id]?.document?.front && !formData[currentQ.id]?.isComplete));
          
          const curpValue = formData[currentQ.id] ? String(formData[currentQ.id]).trim() : '';
          const isCurpInvalid = currentQ.type === 'curp' && curpValue !== '' && !/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/.test(curpValue);
          const isCurpRequiredBlocked = currentQ.type === 'curp' && currentQ.required && !curpValue;
          const isCurpVerificationBlocked = currentQ.type === 'curp' && currentQ.verifyCurp && !curpVerificationState[currentQ.id]?.success && !isCurpFallbackComplete(currentQ, formData);
          const isCurpBlocked = isCurpInvalid || isCurpRequiredBlocked || isCurpVerificationBlocked;

          const invCheck = evaluateFieldInvalidation(currentQ, formData, decodeCurp);
          const isInvalidationBlocked = invCheck.isInvalid;

          const isBlocked = isTermsBlocked || isScheduleBlocked || isSigBlocked || isDocBlocked || isSelfieBlocked || isIdentityBlocked || isCurpBlocked || isInvalidationBlocked;

          const isFinalQuestion = qIdx >= visibleFlatQuestions.length - 1;
          const isButtonDisabled = isBlocked || (isFinalQuestion && submitting);

          return (
            <div className="pt-4 hidden sm:flex items-center gap-3">
              <button
                type="button"
                disabled={isButtonDisabled}
                onClick={() => {
                  if (isButtonDisabled) return;
                  if (validateFlatQuestion(qIdx)) {
                    if (!isFinalQuestion) {
                      goToTypeformIndex(qIdx + 1, 'left');
                    } else {
                      handleSubmitForm();
                    }
                  }
                }}
                className={`px-7 py-3.5 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all ${
                  isButtonDisabled
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : 'hover:scale-102 active:scale-98 cursor-pointer'
                } ${getRadiusClass(borderRadius, 'button')}`}
                style={{ backgroundColor: themeColor }}
                title={isTermsBlocked ? 'Debes leer y aceptar los términos para continuar' : isDocBlocked ? 'Debes capturar el documento para continuar' : undefined}
              >
                {isFinalQuestion && submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>{formLocale === 'es' ? 'Enviando Respuestas...' : 'Submitting Answers...'}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {!isFinalQuestion
                        ? (isIdentity || isDocCapture || isSelfie ? txt.continue : txt.accept)
                        : txt.submitComplete}
                    </span>
                    {!isFinalQuestion ? <Check className="w-4 h-4 stroke-[3]" /> : <Send className="w-4 h-4" />}
                  </>
                )}
              </button>
              {!isBlocked && !submitting && ['text', 'email', 'phone', 'integer', 'decimal', 'date', 'fullname', 'curp'].includes(currentQ.type) && (
                <span className="text-xs text-muted-foreground hidden sm:inline">Presiona <strong>Enter ↵</strong></span>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  // ----------------------------------------------------
  // INLINE VERIFICATION CARD (IDENTITY & OTP STEP)
  // ----------------------------------------------------
  const renderInlineVerificationCard = () => {
    return (
      <div 
        key={`inline-verify-${inlineVerifyStep}`}
        className="w-full max-w-xl mx-auto my-auto px-4 sm:px-8 py-4 sm:py-6 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className={`p-6 sm:p-8 border shadow-xl space-y-6 ${getRadiusClass(borderRadius, 'card')} ${
          isDark ? 'bg-slate-900 border-slate-700/80 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-display leading-tight">
              {inlineVerifyStep === 'details'
                ? (formLocale === 'es' ? 'Datos de Contacto para Confirmar Envío' : 'Contact Details to Confirm Submission')
                : (formLocale === 'es' ? 'Ingresa tu Código de Seguridad' : 'Enter Security Code')}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {inlineVerifyStep === 'details'
                ? (formLocale === 'es'
                    ? 'Para registrar formalmente tu respuesta, ingresa tus datos. Te enviaremos un código de seguridad para validar tu correo.'
                    : 'To register your response, please enter your contact details. We will send a security code to verify your email.')
                : (formLocale === 'es'
                    ? <>Hemos enviado un código de 6 dígitos a <strong className="text-foreground">{emailInput}</strong>.</>
                    : <>We have sent a 6-digit code to <strong className="text-foreground">{emailInput}</strong>.</>)}
            </p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {inlineVerifyStep === 'details' ? (
            <form onSubmit={handleSendInlineOtp} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block text-muted-foreground">
                  {formLocale === 'es' ? 'Nombre Completo' : 'Full Name'} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={respondentName}
                  onChange={(e) => {
                    setRespondentName(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder={formLocale === 'es' ? 'Ej. Carlos Mendoza' : 'e.g. John Doe'}
                  autoFocus
                  className={getInputStyles(isDark).className}
                  style={getInputStyles(isDark).style}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block text-muted-foreground">
                  {formLocale === 'es' ? 'Correo Electrónico' : 'Email Address'} <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="tu@correo.com"
                  className={getInputStyles(isDark).className}
                  style={getInputStyles(isDark).style}
                />
              </div>

              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  disabled={authLoading}
                  className={`w-full py-3.5 px-6 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{formLocale === 'es' ? 'Enviar Código de Seguridad' : 'Send Security Code'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setInlineVerifyStep('idle')}
                  className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-center"
                >
                  {formLocale === 'es' ? '← Volver a revisar respuestas' : '← Back to review responses'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndSubmitInline} className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider block text-center text-muted-foreground">
                  {formLocale === 'es' ? 'Código de 6 dígitos' : '6-digit code'}
                </label>
                <SixDigitOtpBoxes
                  value={otpInput}
                  onChange={(val) => {
                    setOtpInput(val);
                    if (authError) setAuthError(null);
                  }}
                  isDark={isDark}
                  themeColor={themeColor}
                  borderRadius={borderRadius}
                  autoFocus={true}
                  disabled={authLoading || submitting}
                />
              </div>

              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  disabled={authLoading || submitting || otpInput.trim().length < 6}
                  className={`w-full py-3.5 px-6 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  {authLoading || submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{formLocale === 'es' ? 'Verificar y Enviar Formulario' : 'Verify & Submit Form'}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => handleSendInlineOtp()}
                    className="hover:underline text-xs cursor-pointer"
                    style={{ color: themeColor }}
                  >
                    {formLocale === 'es' ? 'Reenviar código' : 'Resend code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setInlineVerifyStep('details')}
                    className="hover:underline text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {formLocale === 'es' ? 'Cambiar correo' : 'Change email'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setInlineVerifyStep('idle')}
                  className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-center"
                >
                  {formLocale === 'es' ? '← Volver a revisar respuestas' : '← Back to review responses'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // FLUJO GUIADO (PANTALLA COMPLETA 1 A LA VEZ)
  // ----------------------------------------------------
  if (formItem.layoutStyle === 'focus_flow' || formItem.layoutStyle === 'typeform') {
    return (
      <div className={`fixed inset-0 w-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden z-50 select-none transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        
        {/* Top Fixed Progress Bar */}
        <div className={`fixed top-0 left-0 right-0 h-1.5 z-50 ${isDark ? 'bg-slate-800' : 'bg-slate-200/60'}`}>
          <div 
            className="h-full transition-all duration-500 ease-out"
            style={{ 
              width: inlineVerifyStep !== 'idle' ? '100%' : visibleFlatQuestions.length > 0 ? `${((typeformIndex + 1) / visibleFlatQuestions.length) * 100}%` : '100%',
              backgroundColor: themeColor
            }}
          />
        </div>

        {/* Top Fixed Header Bar */}
        <header className={`w-full px-4 sm:px-12 py-3 sm:py-4 flex items-center justify-between z-40 shrink-0 border-b backdrop-blur-md ${
          isDark ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200/80 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div 
              className={`w-9 h-9 sm:w-10 sm:h-10 ${getRadiusClass(borderRadius, 'card')} flex items-center justify-center text-white font-bold shadow-md shrink-0`}
              style={{ backgroundColor: themeColor }}
            >
              <School className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className={`text-xs sm:text-base font-bold font-display block leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{schoolName}</span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate max-w-[170px] sm:max-w-md">{formItem.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeAndLanguageControls />
          </div>
        </header>

        {/* Center Main Stage (Question Viewport with Internal Scrolling) */}
        <main ref={mainScrollRef} key={`fluid-main-${formResetKey}`} className="flex-1 min-h-0 w-full max-w-full mx-auto flex flex-col relative overflow-y-auto overflow-x-hidden overscroll-contain py-4 pb-32 sm:py-8 sm:pb-8">
          {inlineVerifyStep !== 'idle' ? (
            renderInlineVerificationCard()
          ) : (
            <div className="w-full max-w-full flex flex-col my-auto py-2 relative select-none">
              {isTransitioning && outgoingTypeformIndex !== null ? (
                /* Tira continua de 2 cards adyacentes lado a lado (Cero solapamiento) */
                <div
                  key={`strip-${outgoingTypeformIndex}-to-${typeformIndex}`}
                  className={`w-[200%] flex flex-row items-start sm:items-center shrink-0 ${
                    slideDirection === 'left' ? 'animate-strip-forward' : 'animate-strip-backward'
                  }`}
                >
                  {/* Slot Izquierdo */}
                  <div className="w-1/2 flex items-start sm:items-center justify-center px-4 sm:px-8 shrink-0">
                    <div className="w-full max-w-2xl mx-auto">
                      {visibleFlatQuestions[slideDirection === 'left' ? outgoingTypeformIndex : typeformIndex] &&
                        renderFocusQuestionCard(
                          slideDirection === 'left' ? outgoingTypeformIndex : typeformIndex,
                          slideDirection === 'left'
                        )}
                    </div>
                  </div>

                  {/* Slot Derecho */}
                  <div className="w-1/2 flex items-start sm:items-center justify-center px-4 sm:px-8 shrink-0">
                    <div className="w-full max-w-2xl mx-auto">
                      {visibleFlatQuestions[slideDirection === 'left' ? typeformIndex : outgoingTypeformIndex] &&
                        renderFocusQuestionCard(
                          slideDirection === 'left' ? typeformIndex : outgoingTypeformIndex,
                          slideDirection === 'right'
                        )}
                    </div>
                  </div>
                </div>
                ) : (
                /* Pregunta Activa en Reposo (Estructura idéntica al slot para 0 saltos) */
                <div
                  key={`active-${typeformIndex}`}
                  className={`w-full flex items-start sm:items-center justify-center px-4 sm:px-8 ${isShaking ? 'animate-validation-shake' : ''}`}
                >
                  <div className="w-full max-w-2xl mx-auto">
                    {visibleFlatQuestions[typeformIndex] && renderFocusQuestionCard(typeformIndex, false)}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Bottom Fixed Navigation & Action Bar */}
        <footer className={`w-full px-4 sm:px-12 py-3 sm:py-4 flex items-center justify-between z-40 shrink-0 border-t backdrop-blur-md gap-3 ${
          isDark ? 'border-slate-800 bg-slate-950/90 text-slate-300' : 'border-slate-200 bg-white/90 text-slate-700'
        }`}>
          {/* Respondent identity indicator */}
          <div className="flex-1 min-w-0 pr-2">
            {renderRespondentFooterBadge()}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {(() => {
              const activeQ = visibleFlatQuestions[typeformIndex];
              const isTermsBlockedActive = activeQ && (activeQ.type === 'terms_consent' || activeQ.type === 'terms') && activeQ.required && !formData[activeQ.id];
              const isScheduleBlockedActive = activeQ && activeQ.type === 'schedule_event' && activeQ.required && !(formData[activeQ.id]?.slotId || formData[activeQ.id]?.rsvpStatus === 'CONFIRMED');
              const isSigBlockedActive = activeQ && activeQ.type === 'signature' && activeQ.required && !formData[activeQ.id];
              const isDocBlockedActive = activeQ && activeQ.type === 'document_capture' && activeQ.required && !formData[activeQ.id]?.isComplete;
              const isSelfieBlockedActive = activeQ && activeQ.type === 'selfie_liveness' && activeQ.required && !formData[activeQ.id]?.isComplete;
              const isIdentityBlockedActive = activeQ && activeQ.type === 'identity_verification' && (activeQ.required ? (!formData[activeQ.id]?.isComplete || !formData[activeQ.id]?.verification?.isMatch) : (formData[activeQ.id]?.document?.front && !formData[activeQ.id]?.isComplete));
              
              const curpValueActive = activeQ && formData[activeQ.id] ? String(formData[activeQ.id]).trim() : '';
              const isCurpInvalidActive = activeQ && activeQ.type === 'curp' && curpValueActive !== '' && !/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/.test(curpValueActive);
              const isCurpRequiredBlockedActive = activeQ && activeQ.type === 'curp' && activeQ.required && !curpValueActive;
              const isCurpVerificationBlockedActive = activeQ && activeQ.type === 'curp' && activeQ.verifyCurp && !curpVerificationState[activeQ.id]?.success && !isCurpFallbackComplete(activeQ, formData);
              const isCurpBlockedActive = isCurpInvalidActive || isCurpRequiredBlockedActive || isCurpVerificationBlockedActive;

              const isStepBlocked = isTermsBlockedActive || isSigBlockedActive || isDocBlockedActive || isSelfieBlockedActive || isIdentityBlockedActive || isCurpBlockedActive;

              return (
                <>
                  {/* Desktop Prev/Next Nav Arrows */}
                  <div className={`hidden sm:flex items-center gap-1 p-1 border shadow-2xs ${getRadiusClass(borderRadius, 'card')} ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        if (inlineVerifyStep !== 'idle') {
                          setInlineVerifyStep('idle');
                          return;
                        }
                        goBackTypeform();
                      }}
                      disabled={inlineVerifyStep === 'idle' && typeformIndex === 0}
                      className={`p-1.5 sm:p-2 disabled:opacity-30 transition-colors cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-200 text-slate-700'
                      }`}
                      title={txt.prevQuestion}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (inlineVerifyStep !== 'idle' || isStepBlocked) return;
                        if (typeformIndex < visibleFlatQuestions.length - 1) {
                          if (validateFlatQuestion(typeformIndex)) {
                            goToTypeformIndex(typeformIndex + 1, 'left');
                          }
                        } else {
                          handleSubmitForm();
                        }
                      }}
                      disabled={inlineVerifyStep !== 'idle' || isStepBlocked || (typeformIndex >= visibleFlatQuestions.length - 1 && submitting)}
                      className={`p-1.5 sm:p-2 disabled:opacity-30 transition-colors cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-200 text-slate-700'
                      }`}
                      title={isTermsBlockedActive ? 'Debes leer y aceptar los términos' : txt.nextQuestion}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {inlineVerifyStep === 'idle' && (() => {
                    if (typeformIndex < visibleFlatQuestions.length - 1) {
                      return (
                        /* Footer Next/Accept button: ONLY visible on mobile (sm:hidden), icon only without label */
                        <button
                          type="button"
                          disabled={isStepBlocked}
                          onClick={() => {
                            if (isStepBlocked) return;
                            if (validateFlatQuestion(typeformIndex)) {
                              goToTypeformIndex(typeformIndex + 1, 'left');
                            }
                          }}
                          className={`sm:hidden h-10 w-10 text-white flex items-center justify-center shadow-lg transition-all shrink-0 ${
                            isStepBlocked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-102 active:scale-98 cursor-pointer'
                          } ${getRadiusClass(borderRadius, 'button')}`}
                          style={{ backgroundColor: themeColor }}
                          title={isTermsBlockedActive ? 'Debes leer y aceptar los términos' : 'Siguiente'}
                        >
                          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      );
                    }

                    return (
                      /* Final Slide: ONLY visible on Mobile (sm:hidden). Desktop already has button inside the form card */
                      <button
                        type="button"
                        onClick={handleSubmitForm}
                        disabled={submitting || isStepBlocked}
                        className={`sm:hidden h-10 w-10 text-white flex items-center justify-center shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer shrink-0 ${getRadiusClass(borderRadius, 'button')}`}
                        style={{ backgroundColor: themeColor }}
                        title={submitting ? (formLocale === 'es' ? 'Enviando...' : 'Submitting...') : txt.submitComplete}
                      >
                        {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[3]" />}
                      </button>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        </footer>

        {/* Fullscreen Signature Modal in focus_flow */}
        {isSignatureModalOpen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200 select-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${getRadiusClass(borderRadius, 'badge')} bg-white/10 flex items-center justify-center`}>
                  <PenTool className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-display">{txt.fullscreenSig}</h3>
                  <p className="text-[11px] text-white/60">{txt.sigInstructions}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className={`p-2 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Canvas Box */}
            <div className={`flex-1 my-4 ${borderRadius === 'none' ? 'rounded-none' : getRadiusClass(borderRadius, 'card')} overflow-hidden shadow-2xl relative flex items-center justify-center p-2 border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <canvas
                ref={modalCanvasRef}
                onMouseDown={startModalDrawing}
                onMouseMove={drawModal}
                onMouseUp={stopModalDrawing}
                onMouseLeave={stopModalDrawing}
                onTouchStart={startModalDrawing}
                onTouchMove={drawModal}
                onTouchEnd={stopModalDrawing}
                className="w-full h-full cursor-crosshair touch-none"
              />
              {!hasModalStrokes && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2 select-none ${
                  isDark ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  <PenTool className="w-8 h-8 opacity-40 animate-bounce" />
                  <span className="text-xs font-semibold">{txt.tapToSign}</span>
                </div>
              )}
            </div>

            {/* Modal Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={clearModalCanvas}
                className={`px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
              >
                <Eraser className="w-4 h-4" />
                <span>{txt.clearCanvas}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)}
                  className={`px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                >
                  {txt.cancel}
                </button>
                <button
                  type="button"
                  onClick={saveModalSignature}
                  className={`px-8 py-3.5 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: secondaryColor || themeColor }}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{txt.confirmSignature}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Change Identity Custom Modal */}
        {renderChangeIdentityModal()}

      </div>
    );
  }

  // ----------------------------------------------------
  // GOOGLE FORMS & WIZARD LIQUID CONTAINER EXPERIENCE
  // ----------------------------------------------------
  return (
    <div className={`h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-800'
    }`}>
      
      {/* Top Institutional Header Bar (Fixed at top) */}
      <header className={`w-full shrink-0 z-30 border-b backdrop-blur-md px-4 sm:px-6 py-3 sm:py-3.5 transition-colors ${
        isDark ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-800'
      }`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shrink-0`}
              style={{ backgroundColor: themeColor }}
            >
              <School className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className={`text-xs sm:text-sm font-bold font-display block leading-tight truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{schoolName}</span>
              <span className="text-[10px] text-muted-foreground block font-medium truncate max-w-[170px] sm:max-w-xs">{formItem.title || txt.officialForm}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeAndLanguageControls />
          </div>
        </div>
      </header>

      {/* Main Form Scrollable Area */}
      <main ref={mainScrollRef} key={`classic-main-${formResetKey}`} className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain py-4 sm:py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6 pb-28 sm:pb-12">

        {inlineVerifyStep !== 'idle' ? (
          renderInlineVerificationCard()
        ) : (
          <>
        {/* ---------------------------------------------------- */}
        {/* STYLE 1: CLASICO CONTINUO                            */}
        {/* ---------------------------------------------------- */}
        {(formItem.layoutStyle === 'classic' || formItem.layoutStyle === 'google_forms' || (!formItem.layoutStyle || (formItem.layoutStyle !== 'step_wizard' && formItem.layoutStyle !== 'wizard_liquid'))) && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Main Header Card */}
            <div 
              className={`rounded-3xl p-6 sm:p-8 border shadow-sm space-y-3 border-t-8 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
              style={{ borderTopColor: themeColor }}
            >
              <div className="flex items-center justify-between">
                <span 
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  {formItem.category}
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  {txt.stepOf(currentStep + 1, formItem.schema.length)}
                </span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{formItem.title}</h1>
              {formItem.description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                  {formItem.description}
                </p>
              )}
            </div>

            {/* Questions of current section */}
            {formItem.schema[currentStep]?.fields.filter(field => evaluateFieldCondition(field.condition, formData)).map((field, fIdx) => (
              <div 
                key={field.id} 
                className={`rounded-3xl p-5 sm:p-7 border space-y-3 ${getShadowClass(shadowStyle)} ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <label className={`text-xs sm:text-sm font-bold flex items-start justify-between gap-2 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>
                  <span>{fIdx + 1}. {field.label} {field.required && <span className="text-rose-500 font-bold ml-1">*</span>}</span>
                </label>
                {field.helpText && (
                  <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
                )}

                {/* Field Inputs */}
                {field.type === 'range' ? (
                  <FormRangeWidget
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleFieldChange(field.id, 'range', val)}
                    themeColor={themeColor}
                    isDark={isDark}
                    borderRadius={borderRadius}
                  />
                ) : field.type === 'composite' ? (
                  <div className={`p-4 sm:p-5 border space-y-4 shadow-2xs ${getRadiusClass(borderRadius, 'card')} ${
                    isDark ? 'bg-slate-950/80 border-slate-700/80' : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {((field.subfields && field.subfields.length > 0)
                        ? field.subfields
                        : [
                            { id: 'fullName', label: 'Nombre Completo', type: 'text' as FormFieldType, required: true },
                            { id: 'relationship', label: 'Parentesco / Relación', type: 'single_choice' as FormFieldType, options: ['Padre', 'Madre', 'Tutor Legal', 'Abuelo(a)', 'Familiar', 'Otro'], required: true },
                            { id: 'phone', label: 'Teléfono Móvil', type: 'phone' as FormFieldType, required: true },
                            { id: 'email', label: 'Correo Electrónico', type: 'email' as FormFieldType, required: false }
                          ]
                      ).map((sub) => {
                        const compVal = formData[field.id] || {};
                        const subVal = compVal[sub.id] ?? '';

                        return (
                          <div key={sub.id} className={`space-y-1.5 ${sub.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                            <label className={`text-xs font-bold flex items-center justify-between gap-1 ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}>
                              <span>{sub.label}</span>
                              {sub.required && <span className="text-rose-500 font-bold">*</span>}
                            </label>

                            {sub.type === 'textarea' ? (
                              <textarea
                                rows={2}
                                placeholder={sub.placeholder || '...'}
                                value={subVal}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    [field.id]: {
                                      ...(prev[field.id] || {}),
                                      [sub.id]: e.target.value
                                    }
                                  }));
                                }}
                                className={getInputStyles(isDark).className}
                                style={getInputStyles(isDark).style}
                              />
                            ) : sub.type === 'single_choice' ? (
                              <ResponsiveCustomSelect
                                value={subVal || ''}
                                onChange={(val) => {
                                  handleCompositeFieldChange(field.id, sub.id, sub.type, val);
                                }}
                                options={sub.options || []}
                                placeholder={sub.placeholder || '-- Seleccionar --'}
                                label={sub.label}
                                isDark={isDark}
                                themeColor={themeColor}
                                variant={fieldStyle}
                                borderRadius={borderRadius}
                                shadowStyle={shadowStyle}
                                borderWeight={borderWeight}
                              />
                            ) : sub.type === 'boolean' ? (
                              <div className="flex items-center gap-2 pt-1">
                                {['Sí', 'No'].map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        [field.id]: {
                                          ...(prev[field.id] || {}),
                                          [sub.id]: val === 'Sí'
                                        }
                                      }));
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                                      subVal === (val === 'Sí')
                                        ? 'text-white font-bold shadow-xs'
                                        : isDark
                                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                    style={subVal === (val === 'Sí') ? { backgroundColor: themeColor } : {}}
                                  >
                                    {val === 'Sí' ? txt.yes : txt.no}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <input
                                type={sub.type === 'phone' ? 'tel' : sub.type === 'email' ? 'email' : sub.type === 'date' ? 'date' : sub.type === 'integer' ? 'number' : 'text'}
                                placeholder={sub.placeholder || (sub.type === 'phone' ? `${sub.defaultCountryCode || field.defaultCountryCode || '+52'} 55 1234 5678` : '...')}
                                value={subVal}
                                onFocus={() => {
                                  if (sub.type === 'phone' && (!subVal || !subVal.toString().trim())) {
                                    const code = (sub.defaultCountryCode || field.defaultCountryCode || '+52') + ' ';
                                    handleCompositeFieldChange(field.id, sub.id, 'phone', code);
                                  }
                                }}
                                onChange={(e) => handleCompositeFieldChange(field.id, sub.id, sub.type, e.target.value)}
                                className={getInputStyles(isDark).className}
                                style={getInputStyles(isDark).style}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : field.type === 'fullname' ? (
                  <div className={`p-4 sm:p-5 border space-y-3.5 shadow-2xs ${getRadiusClass(borderRadius, 'card')} ${
                    isDark ? 'bg-slate-950/80 border-slate-700/80' : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div>
                      <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        Nombre(s) <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Carlos"
                        value={(formData[field.id] || {}).firstName || ''}
                        onChange={(e) => handleCompositeFieldChange(field.id, 'firstName', 'fullname', e.target.value)}
                        className={getInputStyles(isDark).className}
                        style={getInputStyles(isDark).style}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          Apellido Paterno <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Pérez"
                          value={(formData[field.id] || {}).paternalLastName || ''}
                          onChange={(e) => handleCompositeFieldChange(field.id, 'paternalLastName', 'fullname', e.target.value)}
                          className={getInputStyles(isDark).className}
                          style={getInputStyles(isDark).style}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          Apellido Materno <span className="text-muted-foreground text-[10px] font-normal">(Opcional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Gómez"
                          value={(formData[field.id] || {}).maternalLastName || ''}
                          onChange={(e) => handleCompositeFieldChange(field.id, 'maternalLastName', 'fullname', e.target.value)}
                          className={getInputStyles(isDark).className}
                          style={getInputStyles(isDark).style}
                        />
                      </div>
                    </div>
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    placeholder={field.placeholder || '...'}
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className={getInputStyles(isDark).className}
                    style={getInputStyles(isDark).style}
                  />
                ) : field.type === 'single_choice' ? (
                  <div className="space-y-2">
                    {(field.options || []).map((opt) => {
                      const isSelected = formData[field.id] === opt;
                      return (
                        <label 
                          key={opt} 
                          className={`flex items-center gap-3 p-3.5 border cursor-pointer text-xs sm:text-sm font-medium transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${
                            isSelected 
                              ? (isDark ? 'bg-slate-800 border-slate-600 font-bold text-white' : 'bg-slate-50 border-slate-400 font-bold') 
                              : (isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800')
                          }`}
                          style={isSelected ? { borderColor: themeColor, borderWidth: '2px' } : {}}
                        >
                          <input
                            type="radio"
                            name={`gf_${field.id}`}
                            value={opt}
                            checked={isSelected}
                            onChange={(e) => setFormData({ ...formData, [field.id]: opt })}
                            className="w-4 h-4"
                            style={{ accentColor: themeColor }}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : field.type === 'multiple_choice' ? (
                  <div className="space-y-2">
                    {(field.options || []).map((opt) => {
                      const currentArr = formData[field.id] || [];
                      const isChecked = currentArr.includes(opt);
                      return (
                        <label 
                          key={opt} 
                          className={`flex items-center gap-3 p-3.5 border cursor-pointer text-xs sm:text-sm font-medium transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${
                            isChecked 
                              ? (isDark ? 'bg-slate-800 border-slate-600 font-bold text-white' : 'bg-slate-50 border-slate-400 font-bold') 
                              : (isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800')
                          }`}
                          style={isChecked ? { borderColor: themeColor, borderWidth: '2px' } : {}}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked ? [...currentArr, opt] : currentArr.filter((x: string) => x !== opt);
                              setFormData({ ...formData, [field.id]: next });
                            }}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: themeColor }}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : field.type === 'poll' ? (
                  <div className="space-y-3 pt-1">
                    {(field.pollConfig?.options || []).map((opt) => {
                      const allowMultiple = !!field.pollConfig?.allowMultiple;
                      let isSelected = false;
                      if (allowMultiple) {
                        const currentArr = formData[field.id] || [];
                        isSelected = currentArr.includes(opt.id);
                      } else {
                        isSelected = formData[field.id] === opt.id;
                      }

                      return (
                        <label 
                          key={opt.id} 
                          className={`flex items-start gap-3.5 p-4 border cursor-pointer text-xs sm:text-sm transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${
                            isSelected 
                              ? (isDark ? 'bg-slate-800 border-slate-600 font-bold text-white shadow-2xs' : 'bg-slate-50 border-slate-400 font-bold shadow-2xs') 
                              : (isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 shadow-2xs' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs')
                          }`}
                          style={isSelected ? { borderColor: themeColor, borderWidth: '2px' } : {}}
                        >
                          <div className="flex items-center h-5 shrink-0 mt-0.5">
                            <input
                              type={allowMultiple ? 'checkbox' : 'radio'}
                              name={`gf_${field.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                if (allowMultiple) {
                                  const currentArr = formData[field.id] || [];
                                  const updated = e.target.checked
                                    ? [...currentArr, opt.id]
                                    : currentArr.filter((v: string) => v !== opt.id);
                                  setFormData({ ...formData, [field.id]: updated });
                                } else {
                                  setFormData({ ...formData, [field.id]: opt.id });
                                }
                              }}
                              className={`w-4 h-4 ${allowMultiple ? 'rounded' : ''}`}
                              style={{ accentColor: themeColor }}
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className={`font-bold block leading-tight ${isDark ? 'text-white' : 'text-forest'}`}>{opt.title}</span>
                            {opt.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed font-normal">{opt.description}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : field.type === 'terms_consent' ? (
                  <TermsConsentWidget
                    field={field}
                    checked={!!formData[field.id]}
                    onChange={(val) => setFormData(prev => ({ ...prev, [field.id]: val }))}
                    themeColor={themeColor}
                    isDark={isDark}
                    borderRadius={borderRadius}
                  />
                ) : field.type === 'schedule_event' ? (
                  <ScheduleEventWidget
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => setFormData(prev => ({ ...prev, [field.id]: val }))}
                    themeColor={themeColor}
                    borderRadius={getRadiusClass(borderRadius, 'card')}
                    isDark={isDark}
                    layoutVariant="standard"
                  />
                ) : field.type === 'richtext' ? (
                  <div className="space-y-1.5 pt-0.5">
                    <RichTextEditor
                      value={formData[field.id] || ''}
                      onChange={(html) => setFormData(prev => ({ ...prev, [field.id]: html }))}
                      placeholder={field.placeholder || (formLocale === 'es' ? 'Escribe tu respuesta con formato enriquecido (negritas, viñetas, enlaces)...' : 'Type your formatted response here...')}
                      minHeight={field.maxHeight || '160px'}
                    />
                  </div>
                ) : field.type === 'signature' ? (
                  <div className="space-y-3">
                    {signatureData || formData[field.id] ? (
                      <div className={`p-4 sm:p-5 border shadow-xs space-y-3 ${getRadiusClass(borderRadius, 'card')} ${
                        isDark ? 'bg-slate-950/80 border-slate-700' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> {txt.signatureCaptured}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSignatureData(null);
                              setFormData(prev => ({ ...prev, [field.id]: null }));
                            }}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> {txt.remove}
                          </button>
                        </div>
                        <div className={`p-3 border flex items-center justify-center min-h-[100px] transition-colors ${getRadiusClass(borderRadius, 'input')} ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <img 
                            src={formData[field.id] || signatureData} 
                            alt="Firma" 
                            className="max-h-24 object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => openSignatureModal(field.id)}
                          className={`w-full py-2 border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                            isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" /> {txt.resignFullScreen}
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => openSignatureModal(field.id)}
                        className={`cursor-pointer border-2 border-dashed p-6 sm:p-8 text-center transition-all group space-y-2.5 shadow-2xs ${getRadiusClass(borderRadius, 'card')} ${
                          isDark ? 'bg-slate-950/60 border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-forest/10 group-hover:bg-forest/20 text-forest flex items-center justify-center mx-auto transition-colors" style={{ color: themeColor }}>
                          <PenTool className="w-6 h-6" />
                        </div>
                        <h4 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{txt.tapToSign}</h4>
                      </div>
                    )}
                  </div>
                ) : field.type === 'identity_verification' ? (
                  <div className="w-full pt-1">
                    <IdentityVerificationWidget
                      field={field}
                      value={formData[field.id]}
                      onChange={(val) => setFormData((prev) => ({ ...prev, [field.id]: val }))}
                      onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
                      isDark={isDark}
                      themeColor={themeColor}
                      borderRadius={borderRadius}
                      shadowStyle={shadowStyle}
                      layoutVariant="standard"
                    />
                  </div>
                ) : field.type === 'document_capture' ? (
                  <div className="w-full pt-1">
                    <DocumentCaptureWidget
                      field={field}
                      value={formData[field.id]}
                      fileInfo={filesData[field.id]}
                      onProcessKycSide={handleKycProcessSide}
                      onRemoveKycSide={handleKycRemoveSide}
                      onSelectDocType={handleKycSelectDocType}
                      onProcessFile={handleProcessFile}
                      onRemoveFile={handleRemoveFile}
                      onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
                      isDark={isDark}
                      themeColor={themeColor}
                      borderRadius={borderRadius}
                      shadowStyle={shadowStyle}
                      layoutVariant="standard"
                    />
                  </div>
                ) : field.type === 'selfie_liveness' ? (
                  <div className="w-full pt-1">
                    <SelfieLivenessWidget
                      field={field}
                      value={formData[field.id]}
                      onProcessSelfieStep={handleSelfieProcessStep}
                      onRemoveSelfieStep={handleSelfieRemoveStep}
                      onResetSelfie={handleSelfieReset}
                      onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
                      isDark={isDark}
                      themeColor={themeColor}
                      borderRadius={borderRadius}
                      shadowStyle={shadowStyle}
                      layoutVariant="standard"
                    />
                  </div>
                ) : field.type === 'file_upload' ? (
                  <div className="space-y-2">
                    <div className={`p-4 border border-dashed text-center space-y-2 ${getRadiusClass(borderRadius, 'card')} ${
                      isDark ? 'bg-slate-950/60 border-slate-700' : 'bg-slate-50 border-slate-300'
                    }`}>
                      <UploadCloud className="w-6 h-6 mx-auto text-muted-foreground" />
                      <div className="text-xs">
                        {filesData[field.id] ? (
                          <span className="font-bold text-emerald-500 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> {filesData[field.id].fileName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{txt.dragOrSelect} ({field.fileConfig?.accept || '.pdf,.jpg,.png'})</span>
                        )}
                      </div>
                      <label className={`inline-block px-4 py-2 border text-xs font-bold cursor-pointer shadow-2xs transition-all ${getRadiusClass(borderRadius, 'button')} ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}>
                        <span>{filesData[field.id] ? txt.changeFile : txt.browseFile}</span>
                        <input
                          type="file"
                          accept={field.fileConfig?.accept || '.pdf,.jpg,.jpeg,.png'}
                          onChange={(e) => handleFileUpload(field.id, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <input
                    type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'integer' || field.type === 'decimal' ? 'number' : 'text'}
                    placeholder={field.placeholder || (field.type === 'phone' ? `${field.defaultCountryCode || '+52'} 55 1234 5678` : '...')}
                    value={formData[field.id] || ''}
                    onFocus={() => {
                      if (field.type === 'phone' && (!formData[field.id] || !formData[field.id].toString().trim())) {
                        const code = (field.defaultCountryCode || '+52') + ' ';
                        handleFieldChange(field.id, 'phone', code);
                      }
                    }}
                    onChange={(e) => handleFieldChange(field.id, field.type, e.target.value)}
                    className={getInputStyles(isDark).className}
                    style={getInputStyles(isDark).style}
                  />
                )}
              </div>
            ))}

            {/* Stepper Footer Controls (Desktop only - Mobile uses bottom fixed footer) */}
            <div className={`hidden sm:flex rounded-3xl p-4 sm:p-5 border shadow-xs items-center justify-between ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={goBackStep}
                disabled={currentStep === 0}
                className={`px-4 py-2.5 text-xs font-bold disabled:opacity-30 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" /> {txt.back}
              </button>

              <div className="flex items-center gap-3">
                <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-medium ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> {txt.draftAutosaved}
                </span>
                <div className={`w-20 sm:w-28 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((currentStep + 1) / formItem.schema.length) * 100}%`,
                      backgroundColor: themeColor
                    }}
                  />
                </div>
                <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {Math.round(((currentStep + 1) / formItem.schema.length) * 100)}%
                </span>
              </div>

              {currentStep < formItem.schema.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateCurrentSection(currentStep)) {
                      goToStep(currentStep + 1);
                    }
                  }}
                  className={`px-6 py-2.5 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  <span>{txt.next}</span> <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={submitting}
                  className={`px-6 py-2.5 text-white text-xs sm:text-sm font-bold shadow-md hover:scale-102 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>{formLocale === 'es' ? 'Enviando...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{txt.submit}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Reset Form Link */}
            <div className="flex items-center justify-between px-2 pt-1 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => handleResetForm(false)}
                className="hover:text-rose-500 transition-colors flex items-center gap-1.5 font-medium py-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{txt.resetForm}</span>
              </button>
              <span className="text-[11px]">{schoolName}</span>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STYLE 2: PASO A PASO (WIZARD)                        */}
        {/* ---------------------------------------------------- */}
        {(formItem.layoutStyle === 'step_wizard' || formItem.layoutStyle === 'wizard_liquid') && (
          <div className="space-y-6 animate-in fade-in">
            {/* Stepper Card */}
            <div className={`rounded-3xl p-5 sm:p-7 border shadow-lg space-y-5 transition-all ${
              isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-forest/15 text-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold border-b border-forest/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: themeColor }} />
                  <span className="font-display font-bold text-sm sm:text-base">{formItem.title}</span>
                  <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 border ${
                    isDark ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60' : 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                  }`}>
                    <Check className="w-3 h-3 stroke-[3]" /> {txt.draftAutosaved}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs">
                    {txt.stepOf(currentStep + 1, formItem.schema.length)}
                  </span>
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-white font-bold text-[10px] font-mono shadow-2xs"
                    style={{ backgroundColor: themeColor }}
                  >
                    {Math.round(((currentStep + 1) / formItem.schema.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Connected Step Nodes Track */}
              <div className="w-full pt-1 px-2">
                <div className="flex items-center justify-between w-full">
                  {formItem.schema.map((sec, sIdx) => {
                    const isDone = sIdx < currentStep;
                    const isCurrent = sIdx === currentStep;
                    const isLast = sIdx === formItem.schema.length - 1;

                    return (
                      <React.Fragment key={sec.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (sIdx <= currentStep) {
                              goToStep(sIdx);
                            } else {
                              for (let step = currentStep; step < sIdx; step++) {
                                if (!validateCurrentSection(step)) {
                                  goToStep(step);
                                  return;
                                }
                              }
                              goToStep(sIdx);
                            }
                          }}
                          className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none transition-transform active:scale-95 shrink-0"
                          style={{ width: '84px' }}
                        >
                          <div 
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-xs ${
                              isCurrent
                                ? 'text-white ring-4 ring-forest/15 scale-110 shadow-md'
                                : isDone
                                ? 'text-white'
                                : isDark
                                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                            style={isCurrent || isDone ? { backgroundColor: themeColor } : {}}
                          >
                            {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="font-mono">{sIdx + 1}</span>}
                          </div>
                          <span className={`mt-2 text-[11px] font-bold text-center leading-tight transition-colors duration-200 line-clamp-2 max-w-[84px] ${
                            isCurrent
                              ? isDark ? 'text-white font-extrabold' : 'text-forest font-extrabold'
                              : isDone
                              ? isDark ? 'text-slate-300' : 'text-forest/80'
                              : isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-muted-foreground group-hover:text-slate-700'
                          }`}>
                            {sec.title}
                          </span>
                        </button>

                        {/* Connecting Line Segment between nodes */}
                        {!isLast && (
                          <div className="flex-1 mx-[-16px] mb-5 relative h-1 rounded-full overflow-hidden bg-slate-200/80 dark:bg-slate-800 z-0">
                            <div 
                              className="h-full transition-all duration-500 ease-out"
                              style={{ 
                                width: sIdx < currentStep ? '100%' : '0%',
                                backgroundColor: themeColor
                              }}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Wizard Content Card */}
            <div className={`backdrop-blur-xl rounded-3xl p-6 sm:p-8 border shadow-xl space-y-5 ${
              isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/90 border-white/80'
            }`}>
              <h2 className={`font-bold text-lg font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{formItem.schema[currentStep]?.title}</h2>
              {formItem.schema[currentStep]?.description && (
                <p className="text-xs text-muted-foreground">{formItem.schema[currentStep].description}</p>
              )}

              {formItem.schema[currentStep]?.fields.filter(field => evaluateFieldCondition(field.condition, formData)).map((field) => (
                <div key={field.id} className={`p-4 sm:p-5 border space-y-2 ${getRadiusClass(borderRadius, 'card')} ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                }`}>
                  <label className={`text-xs sm:text-sm font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {field.label} {field.required && <span className="text-rose-500 font-bold ml-1">*</span>}
                  </label>
                  
                  {field.type === 'signature' ? (
                    <div className="space-y-3 pt-1">
                      {signatureData || formData[field.id] ? (
                        <div className={`p-4 border shadow-xs space-y-3 ${getRadiusClass(borderRadius, 'card')} ${
                          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> {txt.signatureCaptured}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSignatureData(null);
                                setFormData(prev => ({ ...prev, [field.id]: null }));
                              }}
                              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> {txt.remove}
                            </button>
                          </div>
                          <div className={`p-3 border flex items-center justify-center min-h-[90px] transition-colors ${getRadiusClass(borderRadius, 'input')} ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                          }`}>
                            <img 
                              src={formData[field.id] || signatureData} 
                              alt="Firma" 
                              className="max-h-20 object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => openSignatureModal(field.id)}
                            className={`w-full py-2 border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                              isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <Maximize2 className="w-3.5 h-3.5" /> {txt.resignFullScreen}
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => openSignatureModal(field.id)}
                          className={`cursor-pointer border-2 border-dashed p-5 text-center transition-all group space-y-2 shadow-2xs hover:shadow-xs ${getRadiusClass(borderRadius, 'card')} ${
                            isDark ? 'bg-slate-900/80 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-2xl bg-forest/10 group-hover:bg-forest/20 text-forest flex items-center justify-center mx-auto transition-colors" style={{ color: themeColor }}>
                            <PenTool className="w-5 h-5" />
                          </div>
                          <h4 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{txt.tapToSign}</h4>
                        </div>
                      )}
                    </div>
                  ) : field.type === 'terms_consent' ? (
                    <TermsConsentWidget
                      field={field}
                      checked={!!formData[field.id]}
                      onChange={(val) => setFormData(prev => ({ ...prev, [field.id]: val }))}
                      themeColor={themeColor}
                      isDark={isDark}
                      borderRadius={borderRadius}
                    />
                  ) : field.type === 'schedule_event' ? (
                    <ScheduleEventWidget
                      field={field}
                      value={formData[field.id]}
                      onChange={(val) => setFormData(prev => ({ ...prev, [field.id]: val }))}
                      themeColor={themeColor}
                      borderRadius={getRadiusClass(borderRadius, 'card')}
                      isDark={isDark}
                      layoutVariant="standard"
                    />
                  ) : field.type === 'richtext' ? (
                    <div className="space-y-1.5 pt-0.5">
                      <RichTextEditor
                        value={formData[field.id] || ''}
                        onChange={(html) => setFormData(prev => ({ ...prev, [field.id]: html }))}
                        placeholder={field.placeholder || (formLocale === 'es' ? 'Escribe tu respuesta con formato enriquecido (negritas, viñetas, enlaces)...' : 'Type your formatted response here...')}
                        minHeight={field.maxHeight || '160px'}
                      />
                    </div>
                  ) : field.type === 'identity_verification' ? (
                    <div className="w-full pt-1">
                      <IdentityVerificationWidget
                        field={field}
                        value={formData[field.id]}
                        onChange={(val) => setFormData((prev) => ({ ...prev, [field.id]: val }))}
                        onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
                        isDark={isDark}
                        themeColor={themeColor}
                        borderRadius={borderRadius}
                        shadowStyle={shadowStyle}
                        layoutVariant="card"
                      />
                    </div>
                  ) : field.type === 'document_capture' ? (
                    <div className="w-full pt-1">
                      <DocumentCaptureWidget
                        field={field}
                        value={formData[field.id]}
                        fileInfo={filesData[field.id]}
                        onProcessKycSide={handleKycProcessSide}
                        onRemoveKycSide={handleKycRemoveSide}
                        onSelectDocType={handleKycSelectDocType}
                        onProcessFile={handleProcessFile}
                        onRemoveFile={handleRemoveFile}
                        onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
                        isDark={isDark}
                        themeColor={themeColor}
                        borderRadius={borderRadius}
                        shadowStyle={shadowStyle}
                        layoutVariant="card"
                      />
                    </div>
                  ) : field.type === 'selfie_liveness' ? (
                    <div className="w-full pt-1">
                      <SelfieLivenessWidget
                        field={field}
                        value={formData[field.id]}
                        onProcessSelfieStep={handleSelfieProcessStep}
                        onRemoveSelfieStep={handleSelfieRemoveStep}
                        onResetSelfie={handleSelfieReset}
                        onOpenPreviewModal={(url, title, isVideo) => setPreviewImageModal({ url, title, isVideo })}
                        isDark={isDark}
                        themeColor={themeColor}
                        borderRadius={borderRadius}
                        shadowStyle={shadowStyle}
                        layoutVariant="card"
                      />
                    </div>
                  ) : field.type === 'file_upload' ? (
                    <div className="space-y-2">
                      {filesData[field.id] ? (
                        <div className={`p-3.5 border flex items-center justify-between shadow-2xs ${getRadiusClass(borderRadius, 'card')} ${
                          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className="w-5 h-5 text-forest shrink-0" style={{ color: themeColor }} />
                            <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{filesData[field.id].fileName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = { ...filesData };
                              delete copy[field.id];
                              setFilesData(copy);
                            }}
                            className="text-xs text-rose-500 hover:underline shrink-0 ml-2 font-semibold cursor-pointer"
                          >
                            {txt.remove}
                          </button>
                        </div>
                      ) : (
                        <label className={`p-4 border border-dashed text-center cursor-pointer transition-colors block group ${getRadiusClass(borderRadius, 'card')} ${
                          isDark ? 'bg-slate-900/80 border-slate-700 hover:bg-slate-900' : 'bg-white border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(field.id, e)}
                          />
                          <UploadCloud className="w-6 h-6 mx-auto text-muted-foreground transition-colors mb-1" />
                          <span className="text-xs font-semibold" style={{ color: themeColor }}>{txt.uploadPrompt}</span>
                        </label>
                      )}
                    </div>
                  ) : field.type === 'single_choice' ? (
                    <div className="space-y-2">
                      {(field.options || []).map((opt) => {
                        const isSelected = formData[field.id] === opt;
                        return (
                          <label 
                            key={opt} 
                            className={`flex items-center gap-3 p-3.5 border cursor-pointer text-xs font-medium transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${
                              isSelected 
                                ? (isDark ? 'bg-slate-800 border-slate-600 font-bold text-white' : 'bg-white border-slate-400 font-bold') 
                                : (isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60' : 'bg-white/70 border-slate-200 hover:bg-white')
                            }`}
                            style={isSelected ? { borderColor: themeColor, borderWidth: '2px' } : {}}
                          >
                            <input
                              type="radio"
                              name={`wz_${field.id}`}
                              value={opt}
                              checked={isSelected}
                              onChange={(e) => setFormData({ ...formData, [field.id]: opt })}
                              className="w-4 h-4"
                              style={{ accentColor: themeColor }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'multiple_choice' ? (
                    <div className="space-y-2">
                      {(field.options || []).map((opt) => {
                        const currentArr = formData[field.id] || [];
                        const isChecked = currentArr.includes(opt);
                        return (
                          <label 
                            key={opt} 
                            className={`flex items-center gap-3 p-3.5 border cursor-pointer text-xs font-medium transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${
                              isChecked 
                                ? (isDark ? 'bg-slate-800 border-slate-600 font-bold text-white' : 'bg-white border-slate-400 font-bold') 
                                : (isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60' : 'bg-white/70 border-slate-200 hover:bg-white')
                            }`}
                            style={isChecked ? { borderColor: themeColor, borderWidth: '2px' } : {}}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const next = e.target.checked ? [...currentArr, opt] : currentArr.filter((x: string) => x !== opt);
                                setFormData({ ...formData, [field.id]: next });
                              }}
                              className="w-4 h-4 rounded"
                              style={{ accentColor: themeColor }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'poll' ? (
                    <div className="space-y-3 pt-1">
                      {(field.pollConfig?.options || []).map((opt) => {
                        const allowMultiple = !!field.pollConfig?.allowMultiple;
                        let isSelected = false;
                        if (allowMultiple) {
                          const currentArr = formData[field.id] || [];
                          isSelected = currentArr.includes(opt.id);
                        } else {
                          isSelected = formData[field.id] === opt.id;
                        }

                        return (
                          <label 
                            key={opt.id} 
                            className={`flex items-start gap-3.5 p-4 border cursor-pointer text-xs transition-all ${getRadiusClass(borderRadius, 'input')} ${getShadowClass(shadowStyle)} ${
                              isSelected 
                                ? (isDark ? 'bg-slate-800 border-slate-600 font-bold text-white shadow-2xs' : 'bg-white border-slate-400 font-bold shadow-2xs') 
                                : (isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 shadow-2xs' : 'bg-white/70 border-slate-200 hover:bg-white shadow-2xs')
                            }`}
                            style={isSelected ? { borderColor: themeColor, borderWidth: '2px' } : {}}
                          >
                            <div className="flex items-center h-5 shrink-0 mt-0.5">
                              <input
                                type={allowMultiple ? 'checkbox' : 'radio'}
                                name={`wz_${field.id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (allowMultiple) {
                                    const currentArr = formData[field.id] || [];
                                    const updated = e.target.checked
                                      ? [...currentArr, opt.id]
                                      : currentArr.filter((v: string) => v !== opt.id);
                                    setFormData({ ...formData, [field.id]: updated });
                                  } else {
                                    setFormData({ ...formData, [field.id]: opt.id });
                                  }
                                }}
                                className={`w-4 h-4 ${allowMultiple ? 'rounded' : ''}`}
                                style={{ accentColor: themeColor }}
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className={`font-bold block leading-tight ${isDark ? 'text-white' : 'text-forest'}`}>{opt.title}</span>
                              {opt.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed font-normal">{opt.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'boolean' ? (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {['Sí', 'No'].map((val) => {
                        const isSelected = formData[field.id] === val;
                        const localizedLabel = val === 'Sí' ? txt.yes : txt.no;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setFormData({ ...formData, [field.id]: val })}
                            className={`p-3 border text-center font-bold text-sm transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${getShadowClass(shadowStyle)} ${
                              isSelected
                                ? 'text-white shadow-xs'
                                : isDark
                                ? 'bg-slate-950/60 text-slate-200 border-slate-800 hover:bg-slate-800'
                                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-2xs'
                            }`}
                            style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                          >
                            {localizedLabel}
                          </button>
                        );
                      })}
                    </div>
                  ) : field.type === 'range' ? (
                    <FormRangeWidget
                      field={field}
                      value={formData[field.id]}
                      onChange={(val) => handleFieldChange(field.id, 'range', val)}
                      themeColor={themeColor}
                      isDark={isDark}
                      borderRadius={borderRadius}
                    />
                  ) : field.type === 'composite' ? (
                    <div className={`p-4 sm:p-5 border space-y-4 shadow-2xs ${getRadiusClass(borderRadius, 'card')} ${
                      isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200'
                    }`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {((field.subfields && field.subfields.length > 0)
                          ? field.subfields
                          : [
                              { id: 'fullName', label: 'Nombre Completo', type: 'text' as FormFieldType, required: true },
                              { id: 'relationship', label: 'Parentesco / Relación', type: 'single_choice' as FormFieldType, options: ['Padre', 'Madre', 'Tutor Legal', 'Abuelo(a)', 'Familiar', 'Otro'], required: true },
                              { id: 'phone', label: 'Teléfono Móvil', type: 'phone' as FormFieldType, required: true },
                              { id: 'email', label: 'Correo Electrónico', type: 'email' as FormFieldType, required: false }
                            ]
                        ).map((sub) => {
                          const compVal = formData[field.id] || {};
                          const subVal = compVal[sub.id] ?? '';

                          return (
                            <div key={sub.id} className={`space-y-1.5 ${sub.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                              <label className={`text-xs font-bold flex items-center justify-between gap-1 ${
                                isDark ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                <span>{sub.label}</span>
                                {sub.required && <span className="text-rose-500 font-bold">*</span>}
                              </label>

                              {sub.type === 'textarea' ? (
                                <textarea
                                  rows={2}
                                  placeholder={sub.placeholder || '...'}
                                  value={subVal}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.id]: {
                                        ...(prev[field.id] || {}),
                                        [sub.id]: e.target.value
                                      }
                                    }));
                                  }}
                                  className={getInputStyles(isDark).className}
                                  style={getInputStyles(isDark).style}
                                />
                              ) : sub.type === 'single_choice' ? (
                                 <ResponsiveCustomSelect
                                   value={subVal || ''}
                                   onChange={(val) => {
                                     handleCompositeFieldChange(field.id, sub.id, sub.type, val);
                                   }}
                                   options={sub.options || []}
                                   placeholder={sub.placeholder || '-- Seleccionar --'}
                                   label={sub.label}
                                   isDark={isDark}
                                   themeColor={themeColor}
                                   variant={fieldStyle}
                                   borderRadius={borderRadius}
                                   shadowStyle={shadowStyle}
                                   borderWeight={borderWeight}
                                 />
                              ) : sub.type === 'boolean' ? (
                                <div className="flex items-center gap-2 pt-1">
                                  {['Sí', 'No'].map(val => (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          [field.id]: {
                                            ...(prev[field.id] || {}),
                                            [sub.id]: val === 'Sí'
                                          }
                                        }));
                                      }}
                                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                                        subVal === (val === 'Sí')
                                          ? 'text-white font-bold'
                                          : isDark
                                          ? 'bg-slate-800 text-slate-300'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                      style={subVal === (val === 'Sí') ? { backgroundColor: themeColor } : {}}
                                    >
                                      {val === 'Sí' ? txt.yes : txt.no}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  type={sub.type === 'phone' ? 'tel' : sub.type === 'email' ? 'email' : sub.type === 'date' ? 'date' : sub.type === 'integer' ? 'number' : 'text'}
                                  placeholder={sub.placeholder || (sub.type === 'phone' ? `${sub.defaultCountryCode || field.defaultCountryCode || '+52'} 55 1234 5678` : '...')}
                                  value={subVal}
                                  onFocus={() => {
                                    if (sub.type === 'phone' && (!subVal || !subVal.toString().trim())) {
                                      const code = (sub.defaultCountryCode || field.defaultCountryCode || '+52') + ' ';
                                      handleCompositeFieldChange(field.id, sub.id, 'phone', code);
                                    }
                                  }}
                                  onChange={(e) => handleCompositeFieldChange(field.id, sub.id, sub.type, e.target.value)}
                                  className={getInputStyles(isDark).className}
                                  style={getInputStyles(isDark).style}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : field.type === 'fullname' ? (
                    <div className={`p-4 sm:p-5 border space-y-3.5 shadow-2xs ${getRadiusClass(borderRadius, 'card')} ${
                      isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200'
                    }`}>
                      <div>
                        <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          Nombre(s) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Juan Carlos"
                          value={(formData[field.id] || {}).firstName || ''}
                          onChange={(e) => handleCompositeFieldChange(field.id, 'firstName', 'fullname', e.target.value)}
                          className={getInputStyles(isDark).className}
                          style={getInputStyles(isDark).style}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            Apellido Paterno <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Pérez"
                            value={(formData[field.id] || {}).paternalLastName || ''}
                            onChange={(e) => handleCompositeFieldChange(field.id, 'paternalLastName', 'fullname', e.target.value)}
                            className={getInputStyles(isDark).className}
                            style={getInputStyles(isDark).style}
                          />
                        </div>
                        <div>
                          <label className={`text-xs font-bold block mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            Apellido Materno <span className="text-muted-foreground text-[10px] font-normal">(Opcional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Gómez"
                            value={(formData[field.id] || {}).maternalLastName || ''}
                            onChange={(e) => handleCompositeFieldChange(field.id, 'maternalLastName', 'fullname', e.target.value)}
                            className={getInputStyles(isDark).className}
                            style={getInputStyles(isDark).style}
                          />
                        </div>
                      </div>
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder || '...'}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      className={getInputStyles(isDark).className}
                      style={getInputStyles(isDark).style}
                    />
                  ) : (
                    <input
                      type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'integer' || field.type === 'decimal' ? 'number' : 'text'}
                      placeholder={field.placeholder || (field.type === 'phone' ? `${field.defaultCountryCode || '+52'} 55 1234 5678` : '...')}
                      value={formData[field.id] || ''}
                      onFocus={() => {
                        if (field.type === 'phone' && (!formData[field.id] || !formData[field.id].toString().trim())) {
                          const code = (field.defaultCountryCode || '+52') + ' ';
                          handleFieldChange(field.id, 'phone', code);
                        }
                      }}
                      onChange={(e) => handleFieldChange(field.id, field.type, e.target.value)}
                      className={getInputStyles(isDark).className}
                      style={getInputStyles(isDark).style}
                    />
                  )}
                </div>
              ))}

            {/* Stepper Footer Controls (Desktop only - Mobile uses bottom fixed footer) */}
            <div className={`hidden sm:flex pt-4 border-t items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200/60'}`}>
              <button
                type="button"
                onClick={goBackStep}
                disabled={currentStep === 0}
                className={`px-5 py-2.5 text-xs font-bold disabled:opacity-30 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {txt.back}
              </button>
              
              {currentStep < formItem.schema.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateCurrentSection(currentStep)) goToStep(currentStep + 1);
                  }}
                  className={`px-6 py-2.5 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  {txt.next}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={submitting}
                  className={`px-7 py-2.5 text-white text-xs sm:text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: secondaryColor || themeColor }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>{formLocale === 'es' ? 'Enviando Formulario...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{txt.submit}</span>
                    </>
                  )}
                </button>
          )}
        </div>
      </div>

      {/* Reset Form Link */}
      <div className="flex items-center justify-between px-2 pt-1 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => handleResetForm(false)}
          className="hover:text-rose-500 transition-colors flex items-center gap-1.5 font-medium py-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{txt.resetForm}</span>
        </button>
        <span className="text-[11px]">{schoolName}</span>
      </div>
    </div>
  )}

          </>
        )}

        </div>
      </main>

      {/* Bottom Fixed Navigation & Respondent Bar */}
      <footer className={`w-full shrink-0 z-30 border-t backdrop-blur-md px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 ${
        isDark ? 'border-slate-800 bg-slate-950/90 text-slate-300' : 'border-slate-200 bg-white/90 text-slate-700'
      }`}>
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-3">
          {/* Respondent identity indicator */}
          <div className="flex-1 min-w-0 pr-2">
            {renderRespondentFooterBadge()}
          </div>
          
          {/* Action buttons: Only in mobile (sm:hidden) because in desktop they are inside the form */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            {inlineVerifyStep === 'idle' && (
              <>
                {formItem.schema.length > 1 && (
                  <button
                    type="button"
                    onClick={goBackStep}
                    disabled={currentStep === 0}
                    className={`p-2 sm:px-4 sm:py-2 text-xs font-bold disabled:opacity-30 transition-all cursor-pointer border flex items-center gap-1 ${getRadiusClass(borderRadius, 'button')} ${
                      isDark ? 'text-slate-300 border-slate-700 hover:bg-slate-800' : 'text-slate-700 border-slate-200 hover:bg-slate-100 bg-white'
                    }`}
                    title={txt.back}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">{txt.back}</span>
                  </button>
                )}

                {currentStep < formItem.schema.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (validateCurrentSection(currentStep)) goToStep(currentStep + 1);
                    }}
                    className={`px-5 sm:px-6 py-2 sm:py-2.5 text-white text-xs sm:text-sm font-bold shadow-md hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                    style={{ backgroundColor: themeColor }}
                  >
                    <span>{txt.next}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitForm}
                    disabled={submitting}
                    className={`px-5 sm:px-7 py-2 sm:py-2.5 text-white text-xs sm:text-sm font-bold shadow-md hover:scale-102 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                    style={{ backgroundColor: themeColor }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span>{formLocale === 'es' ? 'Enviando...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{txt.submit}</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Fullscreen Signature Modal (for classic and step_wizard) */}
      {isSignatureModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200 select-none">
          {/* Modal Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${getRadiusClass(borderRadius, 'badge')} bg-white/10 flex items-center justify-center text-white shrink-0`}>
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg font-display">{txt.fullscreenSig}</h3>
                <p className="text-xs text-white/70">{txt.sigInstructions}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(false)}
              className={`p-2.5 ${getRadiusClass(borderRadius, 'button')} bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer`}
              title="Cerrar lienzo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fullscreen Canvas Box */}
          <div className={`flex-1 my-4 sm:my-6 relative ${borderRadius === 'none' ? 'rounded-none' : getRadiusClass(borderRadius, 'card')} overflow-hidden shadow-2xl flex flex-col justify-between border-2 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-white/20'
          }`}>
            <div className={`absolute bottom-16 left-8 right-8 border-b-2 border-dashed pointer-events-none flex items-center justify-between px-2 text-xs font-mono select-none ${
              isDark ? 'border-slate-800 text-slate-600' : 'border-slate-300 text-slate-400'
            }`}>
              <span>Línea de Firma</span>
              <span>{schoolName || 'Ceiba Roots'}</span>
            </div>

            <canvas
              ref={modalCanvasRef}
              onMouseDown={startModalDrawing}
              onMouseMove={drawModal}
              onMouseUp={stopModalDrawing}
              onMouseLeave={stopModalDrawing}
              onTouchStart={startModalDrawing}
              onTouchMove={drawModal}
              onTouchEnd={stopModalDrawing}
              className="w-full h-full cursor-crosshair touch-none select-none relative z-10"
            />
          </div>

          {/* Modal Bottom Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={clearModalCanvas}
              className={`px-5 py-3 ${getRadiusClass(borderRadius, 'button')} bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer`}
            >
              <Eraser className="w-4 h-4" />
              <span>{txt.clearCanvas}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className={`px-5 py-3 ${getRadiusClass(borderRadius, 'button')} bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveModalSignature}
                className={`px-8 py-3.5 ${getRadiusClass(borderRadius, 'button')} text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer`}
                style={{ backgroundColor: themeColor }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{txt.confirmSignature}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Change Identity Custom Modal */}
      {renderChangeIdentityModal()}

      {/* Captured Document Photo Fullscreen Preview Modal */}
      {previewImageModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex items-center gap-3 truncate pr-4">
                <div className="w-8 h-8 rounded-xl bg-forest/20 flex items-center justify-center text-emerald-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="font-bold text-sm sm:text-base truncate">{previewImageModal.title}</h4>
                  <p className="text-[11px] text-slate-400">Vista ampliada del documento capturado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image/Video Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-black/60 min-h-[300px]">
              {previewImageModal.isVideo || previewImageModal.url.startsWith('data:video') || previewImageModal.url.endsWith('.webm') || previewImageModal.url.endsWith('.mp4') ? (
                <video
                  src={previewImageModal.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
                />
              ) : (
                <img
                  src={previewImageModal.url}
                  alt={previewImageModal.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="px-6 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default PublicFormPage;
