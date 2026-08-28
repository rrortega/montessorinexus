import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  getAdmissionPortalDossier,
  requestAdmissionPortalOtp,
  verifyAdmissionPortalOtp,
  submitAdmissionPortalForm,
  resetAdmissionPortalForm,
  mapAdmissionFormTemplate,
  AdmissionStageItem,
  AdmissionFormTemplateItem,
  StageRequiredFormItem,
  FormSubmissionItem,
  FormFieldItem,
  FormFieldType,
  KycDocumentVariant,
  evaluateFieldInvalidation,
  extractDocumentDataOcr
} from '@/lib/sqlite';
import { initFormSession, getFormSubmissionTelemetry } from '@/lib/form-telemetry';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  FileText,
  PenTool,
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  BarChart3,
  Baby,
  User,
  Calendar,
  Heart,
  Lock,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Send,
  Download,
  School as SchoolIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Workflow,
  Mail,
  ShieldCheck,
  Key,
  LogOut,
  Eye,
  ZoomIn,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getDeepstreamClient } from '@/lib/deepstream';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { TermsConsentWidget } from '@/components/public/TermsConsentWidget';
import { ScheduleEventWidget, ScheduleEventValue } from '@/components/public/ScheduleEventWidget';
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
  IdentityVerificationWidget,
  IdentityVerificationValue
} from '@/components/public/IdentityVerificationWidget';
import { convertFileToOptimizedDataUrl } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface UserHeaderMenuProps {
  tutorName?: string;
  tutorEmail?: string;
  tutorRelationship?: string;
  onDisconnect: () => void;
}

const UserHeaderMenu: React.FC<UserHeaderMenuProps> = ({
  tutorName,
  tutorEmail,
  tutorRelationship,
  onDisconnect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!tutorName) return null;

  // First name only (without surnames)
  const firstName = tutorName.trim().split(/\s+/)[0] || tutorName;
  const initial = firstName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative shrink-0 z-50" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2.5 py-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all backdrop-blur-sm cursor-pointer shadow-2xs hover:scale-102 active:scale-98 select-none"
        title="Opciones de cuenta"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-forest flex items-center justify-center font-bold text-[11px] sm:text-xs shadow-xs shrink-0">
          {initial}
        </div>
        <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[160px]">
          {firstName}
        </span>
        <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 text-slate-800 z-[100] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start gap-3 p-2 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold text-sm shrink-0 border border-forest/15 shadow-2xs">
              {initial}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {tutorName}
              </div>
              {tutorEmail && (
                <div className="text-[11px] text-muted-foreground truncate">
                  {tutorEmail}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-[10px] font-semibold text-emerald-700">
                  {tutorRelationship || 'Tutor verificado'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDisconnect();
              }}
              className="w-full px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Desconectar / Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
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
    <div className={`relative overflow-hidden w-full max-w-2xl mx-auto mt-4 border shadow-md p-6 transition-all hover:shadow-lg animate-in fade-in duration-300 ${cardRadius} ${isDark
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
          className={`flex items-center gap-1.5 px-2.5 py-0.5 border ${badgeRadius} ${isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
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
          <div className={`flex flex-col items-center justify-center border w-20 h-24 shrink-0 overflow-hidden relative ${innerRadius} ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-stone-100 border-stone-200'
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
              <span className={`text-xs font-mono font-bold tracking-wider px-1.5 py-0.5 border inline-block uppercase ${innerRadius} ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-stone-50 border-stone-200/70 text-stone-800'
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
            <div className={`border p-3 space-y-2 ${innerRadius} ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-stone-50 border-stone-150'
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

export const AdmissionPortalPage: React.FC = () => {
  const confirm = useConfirm();
  const { token, formId } = useParams<{ token: string; formId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [dossierData, setDossierData] = useState<{
    isAuthorized?: boolean;
    application: any;
    stage: any;
    stages?: AdmissionStageItem[];
    school: any;
    requiredForms: Array<StageRequiredFormItem & { template: AdmissionFormTemplateItem | null }>;
    formSubmissions: FormSubmissionItem[];
  } | null>(null);

  // OTP Identity Verification State
  const [authEmail, setAuthEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Subroute Active Form Runner State
  const [activeFormTemplate, setActiveFormTemplate] = useState<AdmissionFormTemplateItem | null>(null);
  const [activeRequiredForm, setActiveRequiredForm] = useState<StageRequiredFormItem | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [typeformIndex, setTypeformIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, Array<{ fileName: string; fileUrl: string; size?: number }>>>({});
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [submissionPollStats, setSubmissionPollStats] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  // CURP official verification state and helper
  const [curpVerificationState, setCurpVerificationState] = useState<Record<string, { success: boolean; message: string; details?: any }>>({});
  const [isVerifyingCurp, setIsVerifyingCurp] = useState(false);
  const [curpStatusMsg, setCurpStatusMsg] = useState('Espere mientras lo validamos con fuentes oficiales');
  const [curpCountdown, setCurpCountdown] = useState<number | null>(null);

  // Compute flat list of questions from the active form template schema
  const currentFormFlatQuestions: FormFieldItem[] = React.useMemo(() => {
    if (!activeFormTemplate?.schema) return [];
    try {
      const parsed = typeof activeFormTemplate.schema === 'string'
        ? JSON.parse(activeFormTemplate.schema)
        : activeFormTemplate.schema;
      const sections = Array.isArray(parsed) ? parsed : Array.isArray(parsed.sections) ? parsed.sections : [];
      if (sections.length > 0) {
        return sections.flatMap((sec: any) => sec.fields || []);
      } else if (Array.isArray(parsed.fields)) {
        return parsed.fields;
      }
      return [];
    } catch {
      return [];
    }
  }, [activeFormTemplate]);

  const handleVerifyCurp = async (fieldId: string, curpVal: string) => {
    if (!curpVal) return;
    const flatQuestions = currentFormFlatQuestions;
    setIsVerifyingCurp(true);
    setCurpVerificationState(prev => ({ ...prev, [fieldId]: undefined }));

    const targetField = flatQuestions.find((f: any) => f.id === fieldId);
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
            if (localDecoded && flatQuestions && flatQuestions.length > 0) {
              setFormData(prev => {
                const updated = { ...prev };
                flatQuestions.forEach((f: any) => {
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
              if (flatQuestions && flatQuestions.length > 0) {
                setFormData(prev => {
                  const updatedData = { ...prev };
                  flatQuestions.forEach((field: any) => {
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

                      setUploadedFiles(filesPrev => ({
                        ...filesPrev,
                        [field.id]: [
                          {
                            fileName: 'curp_oficial.pdf',
                            fileUrl: fileUrl,
                            size: Math.round(info.pdfBase64.length * 0.75)
                          }
                        ]
                      }));
                    }
                  });
                  return updatedData;
                });
              }
            } else {
              const targetField = flatQuestions.find((f: any) => f.id === fieldId);
              const localDecoded = decodeCurp(curpVal);

              if (localDecoded && flatQuestions && flatQuestions.length > 0) {
                setFormData(prev => {
                  const updated = { ...prev };
                  flatQuestions.forEach((f: any) => {
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

      const targetField = flatQuestions.find((f: any) => f.id === fieldId);
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

  // Collapsible Header State (when viewing form subroute - collapsed by default)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Welcome Screen dismissal state
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(`admission_welcome_dismissed_${token}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleStartAdmission = () => {
    setWelcomeDismissed(true);
    try {
      if (token) sessionStorage.setItem(`admission_welcome_dismissed_${token}`, 'true');
    } catch {
      // Ignore
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 340);
  };

  // Pipeline Progression Stages & Global Progress calculation (Must remain at top level before early returns)
  const progressionStages = useMemo(() => {
    if (!dossierData) return [];
    const raw = (dossierData.stages && dossierData.stages.length > 0)
      ? dossierData.stages
      : (dossierData.stage ? [dossierData.stage] : []);
    return raw.filter(s => !s.isTerminalRejected);
  }, [dossierData]);

  const currentStageIndex = useMemo(() => {
    if (!dossierData) return 0;
    const idx = progressionStages.findIndex(s => s.id === dossierData.stage?.id || s.slug === dossierData.stage?.slug);
    return Math.max(0, idx >= 0 ? idx : 0);
  }, [progressionStages, dossierData]);

  const {
    completedFormsCount,
    totalRequiredForms,
    allCompleted,
    overallProgressPercent,
    totalPipelineForms,
    totalCompletedPipelineForms
  } = useMemo(() => {
    if (!dossierData) {
      return {
        completedFormsCount: 0,
        totalRequiredForms: 0,
        allCompleted: false,
        overallProgressPercent: 0,
        totalPipelineForms: 0,
        totalCompletedPipelineForms: 0
      };
    }

    const { stage, requiredForms = [], formSubmissions = [] } = dossierData;
    const completedCount = requiredForms.filter(rf =>
      formSubmissions.some(s => s.formTemplateId === rf.formTemplateId && (s.status === 'SUBMITTED' || s.status === 'APPROVED'))
    ).length;
    const totalReq = requiredForms.length;
    const isAllCompleted = totalReq > 0 && completedCount === totalReq;

    const totalStages = Math.max(1, progressionStages.length);
    let totalForms = 0;
    let completedForms = 0;

    progressionStages.forEach((stg, idx) => {
      const stageForms = Array.isArray(stg.required_forms)
        ? stg.required_forms
        : (Array.isArray((stg as any).requiredForms) ? (stg as any).requiredForms : []);
      const stageFormsCount = idx === currentStageIndex ? totalReq : stageForms.length;
      totalForms += stageFormsCount;

      if (idx < currentStageIndex) {
        // Transited stage
        completedForms += stageFormsCount;
      } else if (idx === currentStageIndex) {
        // Current stage
        completedForms += completedCount;
      }
    });

    if (totalForms === 0) {
      totalForms = totalReq;
      completedForms = completedCount;
    }

    let calculatedPercent = 0;
    if (totalStages === 1) {
      calculatedPercent = totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 100;
    } else {
      const stageProgressFraction = currentStageIndex / totalStages;
      const currentStageFormFraction = totalReq > 0 ? (completedCount / totalReq) : 0;
      const stageWeight = (stageProgressFraction + (currentStageFormFraction / totalStages)) * 100;
      calculatedPercent = Math.round(stageWeight);
    }

    const isFinalStage = progressionStages[currentStageIndex]?.isFinal || currentStageIndex === totalStages - 1;
    if (isFinalStage && (totalReq === 0 || completedCount === totalReq)) {
      calculatedPercent = 100;
    }

    return {
      completedFormsCount: completedCount,
      totalRequiredForms: totalReq,
      allCompleted: isAllCompleted,
      overallProgressPercent: Math.max(0, Math.min(100, calculatedPercent)),
      totalPipelineForms: totalForms,
      totalCompletedPipelineForms: completedForms
    };
  }, [dossierData, progressionStages, currentStageIndex]);

  // Interpolated Welcome Message (Must be declared at top level before early returns)
  const welcomeMessageText = useMemo(() => {
    if (!dossierData) return '';
    const initialStage = progressionStages.find(s => s.is_initial) || (progressionStages.length > 0 ? progressionStages[0] : null);
    const welcomeMessageRaw = dossierData.stage?.is_initial
      ? (dossierData.stage?.hooks_config?.welcomeMessage || initialStage?.hooks_config?.welcomeMessage)
      : (initialStage?.hooks_config?.welcomeMessage || dossierData.stage?.hooks_config?.welcomeMessage);

    if (!welcomeMessageRaw) return '';
    const { application, school, targetEnvironment } = dossierData;

    const childFullName = application?.childName?.trim() || [application?.childFirstName, application?.childLastName].filter(Boolean).join(' ').trim() || 'Aspirante';

    // Extract only first names without surnames
    let childFirstNames = application?.childFirstName?.trim();
    if (!childFirstNames) {
      const lastName = application?.childLastName?.trim();
      let clean = childFullName;
      if (lastName && clean.toLowerCase().endsWith(lastName.toLowerCase())) {
        clean = clean.slice(0, clean.length - lastName.length).trim();
      }
      const parts = clean.split(/\s+/).filter(Boolean);
      if (parts.length <= 1) {
        childFirstNames = clean;
      } else if (parts.length === 2) {
        childFirstNames = parts[0];
      } else {
        // e.g. "Sofía María Morales Gómez" -> "Sofía María"
        childFirstNames = parts.slice(0, Math.max(1, parts.length - 2)).join(' ');
      }
    }
    if (!childFirstNames) childFirstNames = childFullName;

    const schoolName = school?.name || 'Comunidad Montessori';
    const tutorName = application?.tutorName || 'Estimada Familia';
    const environmentName = targetEnvironment?.name || application?.targetEnvironment?.name || 'Ambiente Montessori';
    const tutorEmail = application?.tutorEmail || '';

    const replacements: Record<string, string> = {
      '{{nombre_completo_estudiante}}': childFullName,
      '{{nombre_completo}}': childFullName,
      '{{estudiante}}': childFullName,
      '{{nombre_estudiante}}': childFullName,
      '{{child_name}}': childFullName,
      '{{childname}}': childFullName,
      '{{child_full_name}}': childFullName,

      '{{solo_nombres_estudiante}}': childFirstNames,
      '{{solo_nombres}}': childFirstNames,
      '{{solo_nombre}}': childFirstNames,
      '{{primer_nombre}}': childFirstNames,
      '{{nombres_estudiante}}': childFirstNames,
      '{{child_first_name}}': childFirstNames,
      '{{first_name}}': childFirstNames,

      '{{escuela}}': schoolName,
      '{{nombre_escuela}}': schoolName,
      '{{colegio}}': schoolName,
      '{{school_name}}': schoolName,
      '{{schoolname}}': schoolName,
      '{{tutor}}': tutorName,
      '{{nombre_tutor}}': tutorName,
      '{{tutor_name}}': tutorName,
      '{{tutorname}}': tutorName,
      '{{ambiente}}': environmentName,
      '{{salon}}': environmentName,
      '{{environment}}': environmentName,
      '{{email_tutor}}': tutorEmail,
      '{{tutor_email}}': tutorEmail,
    };

    let result = welcomeMessageRaw;
    Object.entries(replacements).forEach(([tag, val]) => {
      const escaped = tag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'gi'), val);
    });

    return result;
  }, [dossierData, progressionStages]);

  const getPortalBasePath = () => {
    if (location.pathname.includes('/admision/expediente/')) {
      return `/admision/expediente/${token}`;
    }
    if (location.pathname.includes('/admissions/portal/')) {
      return `/admissions/portal/${token}`;
    }
    return `/admision/${token}`;
  };

  const loadPortalData = async (customToken?: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlAuthToken = urlParams?.get('auth_token') || urlParams?.get('auth');
      const effectiveToken = customToken !== undefined 
        ? customToken 
        : (urlAuthToken || (typeof window !== 'undefined' ? sessionStorage.getItem(`portal_auth_${token}`) : null));

      const data = await getAdmissionPortalDossier(token, effectiveToken || undefined);
      setDossierData(data);

      if (data.authToken) {
        sessionStorage.setItem(`portal_auth_${token}`, data.authToken);
      }
      if (data.verifiedEmail) {
        setAuthEmail(data.verifiedEmail);
      }
      if (urlAuthToken && data.isAuthorized) {
        toast.success('Acceso verificado automáticamente mediante enlace seguro de correo.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar expediente de admisión');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !authEmail.trim()) {
      setAuthError('Por favor ingrese el correo electrónico del tutor.');
      return;
    }
    setRequestingOtp(true);
    setAuthError(null);
    try {
      await requestAdmissionPortalOtp(token, authEmail.trim());
      setOtpSent(true);
      setResendCooldown(60);
      toast.success('Código de verificación enviado al correo electrónico.');
    } catch (err: any) {
      const msg = err.message || 'Error al solicitar código de verificación';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !otpCode.trim()) {
      setAuthError('Por favor ingrese el código de 6 dígitos.');
      return;
    }
    setVerifyingOtp(true);
    setAuthError(null);
    try {
      const res = await verifyAdmissionPortalOtp(token, authEmail.trim(), otpCode.trim());
      if (res.authToken) {
        sessionStorage.setItem(`portal_auth_${token}`, res.authToken);
      }
      toast.success('Identidad verificada exitosamente. Acceso concedido.');
      setOtpSent(false);
      await loadPortalData(res.authToken);
    } catch (err: any) {
      const msg = err.message || 'Código incorrecto o expirado';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleDisconnect = async () => {
    if (token) {
      sessionStorage.removeItem(`portal_auth_${token}`);
    }
    setOtpSent(false);
    setOtpCode('');
    setAuthEmail('');
    setAuthError(null);
    toast.info('Has cerrado sesión en el expediente.');
    await loadPortalData('');
  };

  useEffect(() => {
    loadPortalData();
  }, [token]);

  // Sync active form when subroute formId changes or dossierData loads
  useEffect(() => {
    if (!dossierData) return;

    if (formId) {
      setIsHeaderCollapsed(true);
      const match = dossierData.requiredForms.find(
        rf => rf.formTemplateId === formId || rf.id === formId || (rf.template && rf.template.id === formId)
      );

      if (match && match.template) {
        const mappedTemplate = mapAdmissionFormTemplate(match.template);
        setActiveRequiredForm({ ...match, template: mappedTemplate });
        setActiveFormTemplate(mappedTemplate);
        setCurrentStepIndex(0);
        setTypeformIndex(0);

        const isReset = new URLSearchParams(location.search).get('reset') === 'true';

        // Pre-fill existing submission if available and not explicitly reset
        const existingSubmission = dossierData.formSubmissions.find(s => s.formTemplateId === match.formTemplateId);
        if (existingSubmission && !isReset) {
          setFormData(existingSubmission.data || {});
          setSignatureData(existingSubmission.signature || null);
          const filesByField: Record<string, any[]> = {};
          (existingSubmission.files || []).forEach(f => {
            if (!filesByField[f.fieldId]) filesByField[f.fieldId] = [];
            filesByField[f.fieldId].push(f);
          });
          setUploadedFiles(filesByField);
        } else {
          setFormData({});
          setUploadedFiles({});
          setSignatureData(null);
        }
      } else {
        setActiveRequiredForm(null);
        setActiveFormTemplate(null);
      }
    } else {
      setActiveRequiredForm(null);
      setActiveFormTemplate(null);
    }
  }, [formId, dossierData, location.search]);

  // Guarantee help widgets (Asistenxa, WhatsApp, etc.) remain hidden on admissions portal
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

  // Helper to extract sections cleanly
  const getTemplateSections = (template: any): any[] => {
    if (!template) return [];
    let schema = template.schema;
    if (typeof schema === 'string') {
      try {
        schema = JSON.parse(schema);
      } catch {
        schema = [];
      }
    }
    if (Array.isArray(schema)) return schema;
    if (Array.isArray(schema?.sections)) return schema.sections;
    return [];
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1b3b2b';
    ctx.lineTo(x, y);
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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // Redraw signature on canvas if available
  useEffect(() => {
    if (signatureData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = signatureData;
      }
    }
  }, [currentStepIndex, signatureData, activeFormTemplate]);

  // File Upload Handler
  const handleFileUpload = async (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formPayload = new FormData();
      formPayload.append('file', file);
      formPayload.append('folder', 'documents');

      try {
        toast.loading(`Subiendo archivo: ${file.name}...`, { id: `upload_${i}` });
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formPayload
        });
        if (!res.ok) throw new Error('Error al subir archivo');
        const uploadResult = await res.json();
        toast.success(`Archivo cargado: ${file.name}`, { id: `upload_${i}` });

        setUploadedFiles(prev => ({
          ...prev,
          [fieldId]: [
            ...(prev[fieldId] || []),
            {
              fileName: file.name,
              fileUrl: uploadResult.url,
              size: file.size
            }
          ]
        }));
      } catch (e: any) {
        toast.error(`Error al subir ${file.name}`, { id: `upload_${i}` });
      }
    }
  };

  const handleRemoveFile = (fieldId: string, fileUrl: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter(f => f.fileUrl !== fileUrl)
    }));
  };

  // KYC Multi-Variant & 2-Sided Capture Handlers
  const [previewModalData, setPreviewModalData] = useState<{ url: string; title: string; isVideo?: boolean } | null>(null);

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

        return {
          ...prev,
          [fieldId]: updatedDoc
        };
      });

      toast.success(`Fotografía (${side === 'front' ? 'Frente' : 'Reverso'}) capturada`);

      const formPayload = new FormData();
      formPayload.append('file', file);
      formPayload.append('folder', 'kyc_documents');

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formPayload
        });
        if (res.ok) {
          const uploadResult = await res.json();
          if (uploadResult.url) {
            sideInfo.fileUrl = uploadResult.url;
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

              return {
                ...prev,
                [fieldId]: updatedDoc
              };
            });

            // Trigger OCR + LLM Extraction if enabled on field and document is complete
            const activeFormObj = activeForm?.template;
            const targetField = activeFormObj?.fields?.find((f: any) => f.id === fieldId) ||
              activeFormObj?.sections?.flatMap((s: any) => s.fields || [])?.find((f: any) => f.id === fieldId);

            if (targetField && targetField.enableOcrExtraction !== false) {
              const frontUrl = sideInfo.fileUrl;
              const backUrl = updatedDoc.back?.fileUrl;
              if (frontUrl) {
                extractDocumentDataOcr({
                  documentFrontUrl: frontUrl,
                  documentBackUrl: backUrl || null,
                  docType: docType || 'id_card',
                  schoolId: school?.id || null
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
                  console.warn('[ADMISSION PORTAL KYC OCR ERROR]', err.message);
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Background KYC upload to server skipped/failed:', err);
      }
    } catch (err) {
      console.error('Error in handleKycProcessSide:', err);
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
  };

  const handleKycSelectDocType = (fieldId: string, docType: KycDocumentVariant) => {
    setFormData(prev => {
      const prevVal = (prev[fieldId] && typeof prev[fieldId] === 'object') ? { ...prev[fieldId] } : {};
      const updatedDoc: KycDocumentValue = {
        ...prevVal,
        selectedType: docType
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

      if (step === 'step1') toast.success('Foto frontal capturada');
      else if (step === 'step2') toast.success('Prueba de vida capturada');
      else if (step === 'videoClip') toast.success('Clip de liveness generado');

      // Optimistic background upload to server
      const formPayload = new FormData();
      formPayload.append('file', file);
      formPayload.append('folder', 'selfie_biometrics');

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
      console.error('Error in handleSelfieProcessStep:', err);
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

  // Strict Real-Time Input Sanitizer
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
      return rawValue.replace(/[^\d]/g, '');
    }
    if (type === 'fullname') {
      const cleaned = rawValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
      return cleaned
        .toLowerCase()
        .replace(/(^|\s)[a-záéíóúñü]/g, char => char.toUpperCase());
    }
    if (type === 'decimal') {
      let val = rawValue.replace(/[^\d.]/g, '');
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      return val;
    }
    return rawValue;
  };

  const handleFieldChange = (fieldId: string, type: FormFieldType, rawValue: string) => {
    const sanitized = sanitizeFieldValue(type, rawValue);
    setFormData(prev => ({ ...prev, [fieldId]: sanitized }));
  };

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

    return { isValid: true };
  };

  const validateField = (field: FormFieldItem): boolean => {
    const val = formData[field.id];
    if (field.type === 'fullname') {
      const nameVal = val || {};
      const firstName = (nameVal.firstName || '').trim();
      const paternal = (nameVal.paternalLastName || '').trim();
      if (field.required) {
        if (!firstName) {
          toast.error(`${field.label}: El campo "Nombre(s)" es obligatorio`);
          return false;
        }
        if (!paternal) {
          toast.error(`${field.label}: El campo "Apellido Paterno" es obligatorio`);
          return false;
        }
      }
    } else if (field.type === 'composite') {
      const compositeVal = val || {};
      const subfields = field.subfields || [];
      for (const sub of subfields) {
        const subVal = compositeVal[sub.id];
        const isSubMissing = subVal === undefined || subVal === null || subVal === '' || (Array.isArray(subVal) && subVal.length === 0);
        if ((field.required || sub.required) && isSubMissing) {
          toast.error(`${field.label}: "${sub.label}" es obligatorio`);
          return false;
        }
        if (!isSubMissing) {
          const formatCheck = validateFieldFormat(sub.type, `${field.label} - ${sub.label}`, subVal);
          if (!formatCheck.isValid) {
            toast.error(formatCheck.errorMsg);
            return false;
          }
        }
      }
    } else if (field.type === 'file_upload') {
      const files = uploadedFiles[field.id] || [];
      if (field.required && files.length === 0) {
        toast.error(`El archivo "${field.label}" es obligatorio`);
        return false;
      }
    } else if (field.type === 'signature') {
      if (field.required && !signatureData) {
        toast.error(`La firma digital en "${field.label}" es obligatoria`);
        return false;
      }
    } else if (field.type === 'boolean') {
      if (field.required && !val) {
        toast.error(`Debes marcar la casilla obligatoria: "${field.label}"`);
        return false;
      }
    } else if (field.type === 'identity_verification') {
      const idVal = val as IdentityVerificationValue | undefined;
      if (field.required && (!idVal?.isComplete || !idVal?.verification?.isMatch)) {
        toast.error(`Debes completar la verificación de identidad biométrica: "${field.label}"`);
        return false;
      }
    } else if (field.type === 'document_capture') {
      const docVal = val as KycDocumentValue | undefined;
      const reqSides = (docVal?.selectedType || 'id_card') !== 'passport';
      const isDone = reqSides
        ? Boolean(docVal?.front?.fileUrl && docVal?.back?.fileUrl)
        : Boolean(docVal?.front?.fileUrl);
      if (field.required && !isDone) {
        toast.error(`Debes capturar ${reqSides ? 'ambas caras (frente y reverso)' : 'la foto'} de "${field.label}"`);
        return false;
      }
    } else if (field.type === 'selfie_liveness') {
      const selfieVal = val as SelfieLivenessValue | undefined;
      const isDone = Boolean(selfieVal?.step1?.fileUrl && selfieVal?.step2?.fileUrl);
      if (field.required && !isDone) {
        toast.error(`Debes completar la captura facial y prueba de vida en "${field.label}"`);
        return false;
      }
    } else if (field.type === 'terms' || field.type === 'terms_consent') {
      if (field.required && !val) {
        toast.error(`Debes aceptar los términos y condiciones: "${field.label}"`);
        return false;
      }
    } else if (field.type === 'schedule_event') {
      const scheduleVal = val as ScheduleEventValue | undefined;
      if (field.required && (!scheduleVal || (!scheduleVal.slotId && scheduleVal.rsvpStatus !== 'CONFIRMED'))) {
        toast.error(`Debes seleccionar un horario o confirmar asistencia: "${field.label}"`);
        return false;
      }
    } else if (field.type === 'richtext') {
      const stripped = String(val || '').replace(/<[^>]*>/g, '').trim();
      if (field.required && !stripped) {
        toast.error(`El campo "${field.label}" es obligatorio`);
        return false;
      }
    } else {
      if (field.required) {
        if (val === undefined || val === null || String(val).trim() === '' || (Array.isArray(val) && val.length === 0)) {
          toast.error(`El campo "${field.label}" es obligatorio`);
          return false;
        }
      }
      if (val !== undefined && val !== null && val !== '') {
        const formatCheck = validateFieldFormat(field.type, field.label, val);
        if (!formatCheck.isValid) {
          toast.error(formatCheck.errorMsg);
          return false;
        }
      }
    }

    // Evaluate Invalidation Rules ("Invalidar si")
    const invalidationCheck = evaluateFieldInvalidation(field, formData, decodeCurp);
    if (invalidationCheck.isInvalid) {
      toast.error(invalidationCheck.errorMessage || `El valor ingresado en "${field.label}" no cumple con los requisitos.`);
      return false;
    }

    return true;
  };

  // Wizard Step Validation
  const validateCurrentStep = (): boolean => {
    if (!activeFormTemplate) return false;
    const sections = getTemplateSections(activeFormTemplate);
    const currentSection = sections[currentStepIndex];
    if (!currentSection || !Array.isArray(currentSection.fields)) return true;

    for (const field of currentSection.fields) {
      if (!validateField(field)) {
        return false;
      }
    }
    return true;
  };

  const validateAllSections = (): boolean => {
    if (!activeFormTemplate) return false;
    const sections = getTemplateSections(activeFormTemplate);
    for (const section of sections) {
      for (const field of section.fields || []) {
        if (!validateField(field)) {
          return false;
        }
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    const sections = getTemplateSections(activeFormTemplate);
    if (activeFormTemplate && currentStepIndex < sections.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitForm = async () => {
    if (!validateCurrentStep()) return;
    if (!token || !activeFormTemplate) return;

    // Flatten all files
    const flatFiles: Array<{ fieldId: string; fileName: string; fileUrl: string; size?: number }> = [];
    Object.keys(uploadedFiles).forEach(fId => {
      (uploadedFiles[fId] || []).forEach(f => {
        flatFiles.push({
          fieldId: fId,
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          size: f.size
        });
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

    try {
      setSubmittingForm(true);
      const formTelemetry = getFormSubmissionTelemetry(activeFormTemplate.id);

      const result = await submitAdmissionPortalForm(token, {
        formTemplateId: activeFormTemplate.id,
        filledByRole: activeRequiredForm?.assignedRole || 'ANY_TUTOR',
        filledByName: dossierData?.application?.tutorName || 'Familiar / Tutor',
        data: submissionData,
        files: flatFiles,
        signature: signatureData,
        telemetry: formTelemetry
      });

      toast.success('¡Formulario completado y guardado en el expediente!');

      if (result && result.pollStats && Object.keys(result.pollStats).length > 0) {
        setSubmissionPollStats(result.pollStats);
        setIsSubmitted(true);
      } else {
        // Navigate back to portal main route
        navigate(getPortalBasePath());
        // Reload portal data to reflect the updated submission status
        loadPortalData();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar formulario');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSelectForm = async (req: StageRequiredFormItem & { template: AdmissionFormTemplateItem | null }) => {
    if (req.formTemplateId) {
      initFormSession(req.formTemplateId);
    }
    const existingSubmission = dossierData?.formSubmissions?.find(
      s => s.formTemplateId === req.formTemplateId && (s.status === 'SUBMITTED' || s.status === 'APPROVED')
    );

    if (existingSubmission) {
      const isConfirmed = await confirm({
        title: '¿Llenar nuevamente este formulario?',
        description: 'Este formulario ya fue enviado previamente. Si decides volver a llenarlo, se reiniciarán y borrarán todas las respuestas anteriores para que comiences desde cero.',
        confirmText: 'Sí, reiniciar y llenar',
        cancelText: 'Cancelar',
        variant: 'warning',
        icon: 'warning',
        borderRadius: 'lg',
      });

      if (!isConfirmed) return;

      // 1. Delete submission from backend/database
      if (token) {
        try {
          await resetAdmissionPortalForm(token, req.formTemplateId);
        } catch (err: any) {
          console.warn('[RESET FORM WARNING]', err);
        }
      }

      // 2. Reset local state immediately
      setFormData({});
      setUploadedFiles({});
      setSignatureData(null);
      setCurrentStepIndex(0);
      setTypeformIndex(0);

      // 3. Update local dossier data submissions
      if (dossierData) {
        setDossierData({
          ...dossierData,
          formSubmissions: (dossierData.formSubmissions || []).filter(s => s.formTemplateId !== req.formTemplateId)
        });
      }
    }

    const basePath = getPortalBasePath();
    navigate(`${basePath}/${req.formTemplateId}?reset=true`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6 text-forest" />
          </div>
          <p className="text-xs font-bold text-forest uppercase tracking-widest">Cargando expediente de admisión...</p>
        </div>
      </div>
    );
  }

  if (!dossierData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-forest/15 shadow-xl max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-display text-forest">Enlace de Expediente no encontrado</h2>
          <p className="text-xs text-muted-foreground">
            El enlace proporcionado no es válido o ha expirado. Por favor contacta al equipo de admisiones de la escuela.
          </p>
        </div>
      </div>
    );
  }

  const { application, stage, school, requiredForms, formSubmissions } = dossierData;

  // =========================================================================
  // SUBROUTE VIEW: FORM RUNNER (/admision/:token/:formId)
  // =========================================================================
  if (formId) {
    if (!activeFormTemplate) {
      return (
        <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl border border-forest/15 shadow-lg max-w-md space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold font-display text-forest">Formulario no encontrado</h2>
            <p className="text-xs text-muted-foreground">
              El formulario seleccionado no está disponible o no pertenece a la etapa actual de este expediente.
            </p>
            <Link
              to={getPortalBasePath()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Portal de Admisión</span>
            </Link>
          </div>
        </div>
      );
    }

    const activeSections = getTemplateSections(activeFormTemplate);
    const flatQuestions: FormFieldItem[] = activeSections.flatMap(sec => sec.fields || []);
    const currentSection = activeSections[currentStepIndex];
    const totalSteps = activeSections.length || 1;
    const existingSubmission = formSubmissions.find(s => s.formTemplateId === activeFormTemplate.id);
    const isAlreadySubmitted = !!existingSubmission;

    const layoutStyle = activeFormTemplate.layout_style || (activeFormTemplate as any).layoutStyle || 'google_forms';
    const fieldStyle = activeFormTemplate.field_style || (activeFormTemplate as any).fieldStyle || (layoutStyle === 'focus_flow' || layoutStyle === 'typeform' ? 'underlined' : 'bordered');
    const borderRadius = activeFormTemplate.border_radius || (activeFormTemplate as any).borderRadius || 'lg';
    const themeColor = activeFormTemplate.theme_color || (activeFormTemplate as any).themeColor || school?.primaryColor || '#1b3b2b';
    const secondaryColor = activeFormTemplate.secondary_color || (activeFormTemplate as any).secondaryColor || school?.secondaryColor || '#10b981';

    const borderWeight = activeFormTemplate.border_weight || (activeFormTemplate as any).borderWeight || 'thin';
    const shadowStyle = activeFormTemplate.shadow_style || (activeFormTemplate as any).shadowStyle || 'none';

    const getRadiusClass = (radius: string, type: 'button' | 'input' | 'card' | 'avatar' = 'input') => {
      if (radius === 'none') return 'rounded-none';
      if (radius === 'sm') {
        if (type === 'button') return 'rounded-md';
        if (type === 'card') return 'rounded-lg';
        if (type === 'avatar') return 'rounded-md';
        return 'rounded-md';
      }
      if (radius === 'md') {
        if (type === 'button') return 'rounded-lg';
        if (type === 'card') return 'rounded-xl';
        if (type === 'avatar') return 'rounded-lg';
        return 'rounded-lg';
      }
      if (radius === 'lg') {
        if (type === 'button') return 'rounded-xl';
        if (type === 'card') return 'rounded-2xl';
        if (type === 'avatar') return 'rounded-xl';
        return 'rounded-xl';
      }
      if (radius === 'full') {
        if (type === 'button') return 'rounded-full';
        if (type === 'card') return 'rounded-3xl';
        if (type === 'avatar') return 'rounded-full';
        return 'rounded-2xl';
      }
      return 'rounded-xl';
    };

    const getShadowClass = (shadow: string) => {
      if (shadow === 'none') return '';
      if (shadow === 'sm') return 'shadow-xs';
      if (shadow === 'md') return 'shadow-sm';
      if (shadow === 'lg') return 'shadow-md';
      if (shadow === 'xl') return 'shadow-xl';
      return '';
    };

    const getBorderWeightClass = (weight: string) => {
      if (weight === 'none') return 'border-0';
      if (weight === 'thin') return 'border';
      if (weight === 'medium') return 'border-2';
      if (weight === 'thick') return 'border-4';
      return 'border';
    };

    if (isSubmitted) {
      return (
        <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-300">
          <div className={`bg-white border border-forest/15 p-8 shadow-xl max-w-xl w-full space-y-6 text-slate-800 ${getRadiusClass(borderRadius, 'card')}`}>
            <div
              className={`w-20 h-20 flex items-center justify-center mx-auto text-white shadow-xl animate-in zoom-in-50 duration-500 rounded-full`}
              style={{ backgroundColor: themeColor }}
            >
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {school?.name || 'Ceiba Roots'} • Expediente de Admisión
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-display">
                ¡Formulario Completado!
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                Tus respuestas para el formulario "{activeFormTemplate.title}" han sido guardadas y firmadas con éxito en el expediente.
              </p>
            </div>

            {/* Poll Statistics Results (after submission) */}
            {submissionPollStats && Object.keys(submissionPollStats).length > 0 && (
              <div className="p-5 border border-forest/15 bg-slate-50/50 text-left space-y-4 rounded-2xl">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/60">
                  <div className="w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center text-forest">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-forest">Resultados de la Encuesta</h3>
                    <p className="text-[10px] text-muted-foreground">Estadísticas acumuladas de todos los participantes.</p>
                  </div>
                </div>

                {activeFormTemplate.schema && getTemplateSections(activeFormTemplate).flatMap(sec => sec.fields || []).filter(fld => fld.type === 'poll' && fld.pollConfig?.showResultsAfterSubmit).map(fld => {
                  const stats = submissionPollStats[fld.id];
                  if (!stats) return null;

                  const opts = fld.pollConfig?.options || [];
                  return (
                    <div key={fld.id} className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{fld.label}</span>
                        <span className="text-muted-foreground font-semibold text-[10px]">
                          {stats.totalVotes} {stats.totalVotes === 1 ? 'voto' : 'votos'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {opts.map(opt => {
                          const optStat = stats.options?.[opt.id] || { count: 0, pct: 0 };
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 font-display">
                                <span>{opt.title}</span>
                                <span>{optStat.pct}% ({optStat.count})</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden">
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

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setSubmissionPollStats(null);
                navigate(getPortalBasePath());
                loadPortalData();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-forest hover:bg-forest/95 text-white text-xs font-bold transition-all shadow-md hover:scale-[1.01] cursor-pointer"
            >
              <span>Regresar al Expediente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    const getFieldInputStyles = (isFluidMode = false, isSubField = false) => {
      const radClass = getRadiusClass(borderRadius, 'input');
      const shadowClass = getShadowClass(shadowStyle);
      const weightClass = getBorderWeightClass(borderWeight);

      let className = '';
      let style: React.CSSProperties = {};

      if (fieldStyle === 'underlined') {
        className = `w-full bg-transparent border-b-2 ${isFluidMode && !isSubField
            ? 'py-3.5 sm:py-4 px-1 text-base sm:text-2xl'
            : 'py-2.5 sm:py-3 px-1 text-sm sm:text-base'
          } font-medium outline-none transition-all placeholder:text-muted-foreground/35 text-slate-900 border-slate-300 focus:border-slate-900`;
        style = { borderBottomColor: themeColor };
      } else if (fieldStyle === 'filled') {
        className = `w-full ${radClass} ${shadowClass} ${isFluidMode && !isSubField
            ? 'p-4 sm:p-5 text-base sm:text-xl'
            : 'p-3 sm:p-3.5 text-sm sm:text-base'
          } font-medium outline-none transition-all placeholder:text-muted-foreground/35 bg-slate-100/90 text-slate-900 border border-slate-200/80 focus:bg-white focus:border-slate-400`;
      } else {
        // 'bordered'
        className = `w-full bg-white ${radClass} ${shadowClass} ${weightClass} ${isFluidMode && !isSubField
            ? 'p-4 sm:p-5 text-base sm:text-xl'
            : 'p-3 sm:p-3.5 text-sm sm:text-base'
          } font-medium outline-none transition-all placeholder:text-muted-foreground/35 text-slate-900 border border-slate-300 focus:border-slate-800`;
        style = { borderColor: `${themeColor}60` };
      }

      return { className, style };
    };

    const isFluid = layoutStyle === 'focus_flow' || layoutStyle === 'typeform';
    const isWizard = layoutStyle === 'step_wizard' || layoutStyle === 'wizard_liquid';

    const currentFluidField = flatQuestions[typeformIndex];

    const validateFlatQuestion = (index: number) => {
      const field = flatQuestions[index];
      if (!field) return true;

      const val = formData[field.id];

      if (field.type === 'fullname') {
        const nameVal = val || {};
        if (field.required || nameVal.firstName || nameVal.paternalLastName) {
          if (!nameVal.firstName || !nameVal.firstName.trim()) {
            toast.error(`"${field.label}": El campo "Nombre(s)" es obligatorio`);
            triggerShake();
            return false;
          }
          if (!nameVal.paternalLastName || !nameVal.paternalLastName.trim()) {
            toast.error(`"${field.label}": El campo "Apellido Paterno" es obligatorio`);
            triggerShake();
            return false;
          }
        }
        return true;
      }

      if (field.type === 'composite') {
        const compositeVal = val || {};
        const subfields = (field.subfields && field.subfields.length > 0) ? field.subfields : [
          { id: 'fullName', label: 'Nombre Completo', type: 'text' as FormFieldType, required: true },
          { id: 'relationship', label: 'Parentesco / Relación', type: 'single_choice' as FormFieldType, options: ['Padre', 'Madre', 'Tutor Legal', 'Abuelo(a)', 'Familiar', 'Otro'], required: true },
          { id: 'phone', label: 'Teléfono Móvil', type: 'phone' as FormFieldType, required: true },
          { id: 'email', label: 'Correo Electrónico', type: 'email' as FormFieldType, required: false }
        ];
        for (const sub of subfields) {
          const subVal = compositeVal[sub.id];
          const isSubMissing = subVal === undefined || subVal === null || String(subVal).trim() === '';
          if ((field.required || sub.required) && isSubMissing) {
            toast.error(`"${field.label}": El campo "${sub.label}" es obligatorio`);
            triggerShake();
            return false;
          }
          if (!isSubMissing) {
            const formatCheck = validateFieldFormat(sub.type, `${field.label} - ${sub.label}`, subVal);
            if (!formatCheck.isValid) {
              toast.error(formatCheck.errorMsg);
              triggerShake();
              return false;
            }
          }
        }
        return true;
      }

      if (field.required) {
        if (field.type === 'file_upload') {
          const files = uploadedFiles[field.id] || [];
          if (files.length === 0) {
            toast.error(`El archivo "${field.label}" es obligatorio`);
            triggerShake();
            return false;
          }
        } else if (field.type === 'signature') {
          if (!signatureData) {
            toast.error(`La firma digital en "${field.label}" es obligatoria`);
            triggerShake();
            return false;
          }
        } else if (field.type === 'boolean') {
          if (!formData[field.id]) {
            toast.error(`Debes marcar la casilla obligatoria: "${field.label}"`);
            triggerShake();
            return false;
          }
        } else if (field.type === 'document_capture') {
          const docVal = val as KycDocumentValue | undefined;
          const reqSides = (docVal?.selectedType || 'id_card') !== 'passport';
          const isDone = reqSides
            ? Boolean(docVal?.front?.fileUrl && docVal?.back?.fileUrl)
            : Boolean(docVal?.front?.fileUrl);
          if (!isDone) {
            toast.error(`Debes capturar ${reqSides ? 'ambas caras (frente y reverso)' : 'la foto'} de "${field.label}"`);
            triggerShake();
            return false;
          }
        } else if (field.type === 'selfie_liveness') {
          const selfieVal = val as SelfieLivenessValue | undefined;
          const isDone = Boolean(selfieVal?.step1?.fileUrl && selfieVal?.step2?.fileUrl);
          if (!isDone) {
            toast.error(`Debes completar la captura facial y prueba de vida en "${field.label}"`);
            triggerShake();
            return false;
          }
        } else if (field.type === 'terms' || field.type === 'terms_consent') {
          if (!formData[field.id]) {
            toast.error(`Debes aceptar los términos y condiciones: "${field.label}"`);
            triggerShake();
            return false;
          }
        } else if (field.type === 'schedule_event') {
          const scheduleVal = val as ScheduleEventValue | undefined;
          if (!scheduleVal || (!scheduleVal.slotId && scheduleVal.rsvpStatus !== 'CONFIRMED')) {
            toast.error(`Debes seleccionar un horario o confirmar asistencia: "${field.label}"`);
            triggerShake();
            return false;
          }
        } else if (field.type === 'richtext') {
          const stripped = String(val || '').replace(/<[^>]*>/g, '').trim();
          if (!stripped) {
            toast.error(`El campo "${field.label}" es obligatorio`);
            triggerShake();
            return false;
          }
        } else {
          if (val === undefined || val === null || String(val).trim() === '') {
            toast.error(`El campo "${field.label}" es obligatorio`);
            triggerShake();
            return false;
          }
          const formatCheck = validateFieldFormat(field.type, field.label, val);
          if (!formatCheck.isValid) {
            toast.error(formatCheck.errorMsg);
            triggerShake();
            return false;
          }
        }
      } else if (val !== undefined && val !== null && String(val).trim() !== '') {
        const formatCheck = validateFieldFormat(field.type, field.label, val);
        if (!formatCheck.isValid) {
          toast.error(formatCheck.errorMsg);
          triggerShake();
          return false;
        }
      }
      return true;
    };

    const goToTypeformIndex = (newIndex: number, dir: 'left' | 'right' = 'left') => {
      if (newIndex < 0 || newIndex >= flatQuestions.length || newIndex === typeformIndex) return;
      setOutgoingIndex(typeformIndex);
      setSlideDirection(dir);
      setTypeformIndex(newIndex);
      setIsTransitioning(true);
      setTimeout(() => {
        setOutgoingIndex(null);
        setIsTransitioning(false);
      }, 480);
    };

    // Generic Field Component Renderer
    const renderFieldInput = (field: FormFieldItem, autoAdvanceInFluid = false) => {
      const mainInputStyles = getFieldInputStyles(isFluid, false);
      const subInputStyles = getFieldInputStyles(false, true);

      if (field.type === 'fullname') {
        const nameVal = formData[field.id] || {};
        return (
          <div className={`w-full space-y-5 p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xs ${getRadiusClass(borderRadius, 'card')}`}>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold block" style={{ color: themeColor }}>
                Nombre(s) <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Juan Carlos"
                value={nameVal.firstName || ''}
                onChange={(e) => handleCompositeFieldChange(field.id, 'firstName', 'fullname', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isFluid) {
                    e.preventDefault();
                    if (validateFlatQuestion(typeformIndex)) {
                      if (typeformIndex < flatQuestions.length - 1) {
                        goToTypeformIndex(typeformIndex + 1, 'left');
                      } else {
                        handleSubmitForm();
                      }
                    }
                  }
                }}
                className={subInputStyles.className}
                style={subInputStyles.style}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold block" style={{ color: themeColor }}>
                  Apellido Paterno <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pérez"
                  value={nameVal.paternalLastName || ''}
                  onChange={(e) => handleCompositeFieldChange(field.id, 'paternalLastName', 'fullname', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isFluid) {
                      e.preventDefault();
                      if (validateFlatQuestion(typeformIndex)) {
                        if (typeformIndex < flatQuestions.length - 1) {
                          goToTypeformIndex(typeformIndex + 1, 'left');
                        } else {
                          handleSubmitForm();
                        }
                      }
                    }
                  }}
                  className={subInputStyles.className}
                  style={subInputStyles.style}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold block" style={{ color: themeColor }}>
                  Apellido Materno <span className="text-muted-foreground text-[11px] font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Gómez"
                  value={nameVal.maternalLastName || ''}
                  onChange={(e) => handleCompositeFieldChange(field.id, 'maternalLastName', 'fullname', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isFluid) {
                      e.preventDefault();
                      if (validateFlatQuestion(typeformIndex)) {
                        if (typeformIndex < flatQuestions.length - 1) {
                          goToTypeformIndex(typeformIndex + 1, 'left');
                        } else {
                          handleSubmitForm();
                        }
                      }
                    }
                  }}
                  className={subInputStyles.className}
                  style={subInputStyles.style}
                />
              </div>
            </div>
          </div>
        );
      }

      if (field.type === 'composite') {
        const compVal = formData[field.id] || {};
        const subfields = (field.subfields && field.subfields.length > 0) ? field.subfields : [
          { id: 'fullName', label: 'Nombre Completo', type: 'text' as FormFieldType, required: true },
          { id: 'relationship', label: 'Parentesco / Relación', type: 'single_choice' as FormFieldType, options: ['Padre', 'Madre', 'Tutor Legal', 'Abuelo(a)', 'Familiar', 'Otro'], required: true },
          { id: 'phone', label: 'Teléfono Móvil', type: 'phone' as FormFieldType, required: true },
          { id: 'email', label: 'Correo Electrónico', type: 'email' as FormFieldType, required: false }
        ];

        return (
          <div className={`w-full space-y-5 p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xs ${getRadiusClass(borderRadius, 'card')}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {subfields.map((sub) => {
                const subVal = compVal[sub.id] ?? '';
                return (
                  <div key={sub.id} className={`space-y-2 ${sub.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                    <label className="text-xs sm:text-sm font-bold flex items-center justify-between gap-1" style={{ color: themeColor }}>
                      <span>{sub.label}</span>
                      {sub.required && <span className="text-rose-500 font-bold">*</span>}
                    </label>
                    {sub.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        placeholder={sub.placeholder || 'Escribe aquí...'}
                        value={subVal}
                        onChange={(e) => handleCompositeFieldChange(field.id, sub.id, sub.type, e.target.value)}
                        className={subInputStyles.className}
                        style={subInputStyles.style}
                      />
                    ) : sub.type === 'single_choice' ? (
                      <select
                        value={subVal || ''}
                        onChange={(e) => handleCompositeFieldChange(field.id, sub.id, sub.type, e.target.value)}
                        className={subInputStyles.className}
                        style={subInputStyles.style}
                      >
                        <option value="">{sub.placeholder || '-- Seleccionar --'}</option>
                        {(sub.options || []).map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : sub.type === 'boolean' ? (
                      <div className="flex items-center gap-2 pt-1">
                        {['Sí', 'No'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleCompositeFieldChange(field.id, sub.id, sub.type, val === 'Sí' ? 'true' : 'false')}
                            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${subVal === (val === 'Sí') || subVal === (val === 'Sí' ? 'true' : 'false')
                              ? 'text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                              }`}
                            style={subVal === (val === 'Sí') || subVal === (val === 'Sí' ? 'true' : 'false') ? { backgroundColor: themeColor } : {}}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={sub.type === 'phone' ? 'tel' : sub.type === 'email' ? 'email' : sub.type === 'date' ? 'date' : sub.type === 'integer' || sub.type === 'decimal' ? 'number' : 'text'}
                        placeholder={sub.placeholder || (sub.type === 'phone' ? `${sub.defaultCountryCode || field.defaultCountryCode || '+52'} 55 1234 5678` : '')}
                        value={subVal}
                        onFocus={() => {
                          if (sub.type === 'phone' && (!subVal || !subVal.toString().trim())) {
                            const code = (sub.defaultCountryCode || field.defaultCountryCode || '+52') + ' ';
                            handleCompositeFieldChange(field.id, sub.id, 'phone', code);
                          }
                        }}
                        onChange={(e) => handleCompositeFieldChange(field.id, sub.id, sub.type, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && isFluid) {
                            e.preventDefault();
                            if (validateFlatQuestion(typeformIndex)) {
                              if (typeformIndex < flatQuestions.length - 1) {
                                goToTypeformIndex(typeformIndex + 1, 'left');
                              } else {
                                handleSubmitForm();
                              }
                            }
                          }
                        }}
                        className={subInputStyles.className}
                        style={subInputStyles.style}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      if (field.type === 'range') {
        const minVal = field.min !== undefined ? field.min : 0;
        const maxVal = field.max !== undefined ? field.max : 10;
        const stepVal = field.step !== undefined ? field.step : 1;
        const currentVal = formData[field.id] !== undefined ? Number(formData[field.id]) : (field.defaultValue !== undefined ? Number(field.defaultValue) : minVal);

        return (
          <div className={`w-full space-y-4 p-5 sm:p-6 bg-stone-50/70 border border-forest/15 ${getRadiusClass(borderRadius, 'card')}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {field.minLabel || `Mínimo: ${minVal}`}
              </span>
              <div
                className="px-4 py-1.5 rounded-full text-white text-sm font-bold font-mono shadow-xs"
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
                  handleFieldChange(field.id, 'range', String(nextVal));
                }}
                disabled={currentVal <= minVal}
                className={`w-9 h-9 flex items-center justify-center font-bold text-base bg-white border border-forest/20 text-forest hover:bg-forest/5 transition-all cursor-pointer disabled:opacity-30 shadow-2xs ${getRadiusClass(borderRadius, 'button')}`}
              >
                -
              </button>
              <input
                type="range"
                min={minVal}
                max={maxVal}
                step={stepVal}
                value={currentVal}
                onChange={(e) => handleFieldChange(field.id, 'range', e.target.value)}
                className="flex-1 h-3 bg-stone-200 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: themeColor }}
              />
              <button
                type="button"
                onClick={() => {
                  const nextVal = Math.min(maxVal, currentVal + stepVal);
                  handleFieldChange(field.id, 'range', String(nextVal));
                }}
                disabled={currentVal >= maxVal}
                className={`w-9 h-9 flex items-center justify-center font-bold text-base bg-white border border-forest/20 text-forest hover:bg-forest/5 transition-all cursor-pointer disabled:opacity-30 shadow-2xs ${getRadiusClass(borderRadius, 'button')}`}
              >
                +
              </button>
            </div>
          </div>
        );
      }

      if (field.type === 'textarea') {
        return (
          <textarea
            rows={4}
            placeholder={field.placeholder || 'Escribe tu respuesta aquí...'}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            className={inputClass}
          />
        );
      }

      if (field.type === 'single_choice') {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {(field.options || []).map((opt, oIdx) => {
              const isSelected = formData[field.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, [field.id]: opt });
                    if (autoAdvanceInFluid && isFluid && typeformIndex < flatQuestions.length - 1) {
                      setTimeout(() => goToTypeformIndex(typeformIndex + 1, 'left'), 280);
                    }
                  }}
                  className={`p-3.5 sm:p-4 border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${getRadiusClass(borderRadius, 'button')} ${isSelected
                    ? 'text-white shadow-md font-bold scale-[1.01]'
                    : 'bg-white text-forest border-forest/15 hover:bg-forest/5 hover:border-forest/30 shadow-2xs'
                    }`}
                  style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                >
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
                    <span className={`w-6 h-6 sm:w-7 sm:h-7 ${getRadiusClass(borderRadius, 'avatar')} text-[11px] font-bold flex items-center justify-center font-mono ${isSelected ? 'bg-white/25 text-white' : 'bg-forest/10 text-forest'
                      }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        );
      }

      if (field.type === 'multiple_choice') {
        const currentSelected = Array.isArray(formData[field.id]) ? formData[field.id] : [];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {(field.options || []).map((opt) => {
              const isChecked = currentSelected.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-xs sm:text-sm ${getRadiusClass(borderRadius, 'button')} ${isChecked
                    ? 'bg-forest/10 border-forest text-forest font-bold shadow-2xs'
                    : 'bg-white border-forest/15 hover:bg-forest/5 text-forest shadow-2xs'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...currentSelected, opt]
                        : currentSelected.filter((v: string) => v !== opt);
                      setFormData({ ...formData, [field.id]: updated });
                    }}
                    className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        );
      }

      if (field.type === 'poll') {
        const allowMultiple = !!field.pollConfig?.allowMultiple;
        const currentSelected = allowMultiple 
          ? (Array.isArray(formData[field.id]) ? formData[field.id] : [])
          : formData[field.id];

        return (
          <div className="grid grid-cols-1 gap-3 pt-1">
            {(field.pollConfig?.options || []).map((opt, oIdx) => {
              const isSelected = allowMultiple 
                ? currentSelected.includes(opt.id)
                : currentSelected === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (allowMultiple) {
                      const updated = isSelected
                        ? currentSelected.filter((v: string) => v !== opt.id)
                        : [...currentSelected, opt.id];
                      setFormData({ ...formData, [field.id]: updated });
                    } else {
                      setFormData({ ...formData, [field.id]: opt.id });
                      if (autoAdvanceInFluid && isFluid && typeformIndex < flatQuestions.length - 1) {
                        setTimeout(() => goToTypeformIndex(typeformIndex + 1, 'left'), 280);
                      }
                    }
                  }}
                  className={`p-4 border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer gap-2 relative ${getRadiusClass(borderRadius, 'button')} ${
                    isSelected
                      ? 'text-white shadow-md font-bold scale-[1.01]'
                      : 'bg-white text-forest border-forest/15 hover:bg-forest/5 hover:border-forest/30 shadow-2xs'
                  }`}
                  style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                >
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
                    <span className={`w-6 h-6 sm:w-7 sm:h-7 ${getRadiusClass(borderRadius, 'avatar')} text-[11px] font-bold flex items-center justify-center font-mono ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-forest/10 text-forest'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="font-bold">{opt.title}</span>
                  </div>
                  {opt.description && (
                    <p className={`text-xs leading-relaxed pl-9 font-normal ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                      {opt.description}
                    </p>
                  )}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );
      }

      if (field.type === 'dropdown') {
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => {
              setFormData({ ...formData, [field.id]: e.target.value });
              if (autoAdvanceInFluid && isFluid && typeformIndex < flatQuestions.length - 1 && e.target.value) {
                setTimeout(() => goToTypeformIndex(typeformIndex + 1, 'left'), 280);
              }
            }}
            className={inputClass}
          >
            <option value="">-- Seleccionar una opción --</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }

      if (field.type === 'boolean') {
        return (
          <label className={`flex items-center gap-3 p-3.5 bg-white border border-forest/20 cursor-pointer text-xs sm:text-sm text-forest hover:bg-forest/5 transition-colors ${getRadiusClass(borderRadius, 'card')}`}>
            <input
              type="checkbox"
              checked={!!formData[field.id]}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
              className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest shrink-0"
            />
            <span className="font-semibold">{field.label}</span>
          </label>
        );
      }

      if (field.type === 'file_upload') {
        return (
          <div className="space-y-3">
            <div className={`border-2 border-dashed border-forest/25 p-6 text-center bg-white hover:bg-forest/5 transition-colors ${getRadiusClass(borderRadius, 'card')}`}>
              <input
                type="file"
                id={`file_input_${field.id}`}
                multiple={!!field.fileConfig?.multiple}
                accept={field.fileConfig?.accept || '.pdf,.jpg,.jpeg,.png'}
                onChange={(e) => handleFileUpload(field.id, e.target.files)}
                className="hidden"
              />
              <label htmlFor={`file_input_${field.id}`} className="cursor-pointer space-y-2 block">
                <UploadCloud className="w-8 h-8 text-forest/70 mx-auto" />
                <span className="text-xs sm:text-sm font-bold text-forest block">
                  Seleccionar o arrastrar archivos
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Formatos aceptados: {field.fileConfig?.accept || 'PDF, JPG, PNG'} (Máx 10 MB)
                </span>
              </label>
            </div>

            {(uploadedFiles[field.id] || []).length > 0 && (
              <div className="space-y-2 pt-1">
                {(uploadedFiles[field.id] || []).map((f) => (
                  <div key={f.fileUrl} className={`flex items-center justify-between bg-white p-3 border border-forest/15 text-xs shadow-2xs ${getRadiusClass(borderRadius, 'button')}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-forest shrink-0" />
                      <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-forest font-bold hover:underline truncate">
                        {f.fileName}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(field.id, f.fileUrl)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                      title="Quitar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      if (field.type === 'signature') {
        return (
          <div className="space-y-3">
            <div className={`bg-white border border-forest/20 p-3 relative shadow-2xs ${getRadiusClass(borderRadius, 'card')}`}>
              <canvas
                ref={canvasRef}
                width={700}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`w-full h-40 bg-stone-50/60 cursor-crosshair border border-dashed border-forest/20 touch-none ${getRadiusClass(borderRadius, 'input')}`}
              />
              <div className="flex items-center justify-between pt-2.5 px-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-forest/70" />
                  <span>Dibuja tu firma con el dedo, stylus o ratón</span>
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
                >
                  Borrar y Reintentar Firma
                </button>
              </div>
            </div>
            {signatureData && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold px-1">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Firma capturada y lista para adjuntar</span>
              </div>
            )}
          </div>
        );
      }

      if (field.type === 'identity_verification') {
        return (
          <IdentityVerificationWidget
            field={field}
            value={formData[field.id]}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, [field.id]: val }));
            }}
            onOpenPreviewModal={(url, title, isVideo) => setPreviewModalData({ url, title, isVideo })}
            isDark={false}
            themeColor={themeColor}
            borderRadius={getRadiusClass(borderRadius, 'card')}
            layoutVariant={isFluid ? 'focus' : 'standard'}
          />
        );
      }

      if (field.type === 'document_capture') {
        return (
          <DocumentCaptureWidget
            field={field}
            value={formData[field.id]}
            onProcessKycSide={handleKycProcessSide}
            onRemoveKycSide={handleKycRemoveSide}
            onSelectDocType={handleKycSelectDocType}
            onOpenPreviewModal={(url, title, isVideo) => setPreviewModalData({ url, title, isVideo })}
            isDark={false}
            themeColor={themeColor}
            borderRadius={getRadiusClass(borderRadius, 'card')}
            layoutVariant={isFluid ? 'focus' : 'standard'}
          />
        );
      }

      if (field.type === 'selfie_liveness') {
        return (
          <SelfieLivenessWidget
            field={field}
            value={formData[field.id]}
            onProcessSelfieStep={handleSelfieProcessStep}
            onRemoveSelfieStep={handleSelfieRemoveStep}
            onResetSelfie={handleSelfieReset}
            onOpenPreviewModal={(url, title, isVideo) => setPreviewModalData({ url, title, isVideo })}
            isDark={false}
            themeColor={themeColor}
            borderRadius={getRadiusClass(borderRadius, 'card')}
            layoutVariant={isFluid ? 'focus' : 'standard'}
          />
        );
      }

      if (field.type === 'terms' || field.type === 'terms_consent') {
        return (
          <TermsConsentWidget
            field={field}
            checked={!!formData[field.id]}
            onChange={(val) => setFormData({ ...formData, [field.id]: val })}
            themeColor={themeColor}
            borderRadius={getRadiusClass(borderRadius, 'card')}
          />
        );
      }

      if (field.type === 'schedule_event') {
        return (
          <ScheduleEventWidget
            field={field}
            value={formData[field.id]}
            onChange={(val) => setFormData({ ...formData, [field.id]: val })}
            themeColor={themeColor}
            borderRadius={getRadiusClass(borderRadius, 'card')}
            isDark={false}
            layoutVariant={isFluid ? 'focus' : 'standard'}
          />
        );
      }

      if (field.type === 'richtext') {
        return (
          <div className="w-full space-y-1.5">
            <RichTextEditor
              value={formData[field.id] || ''}
              onChange={(html) => setFormData({ ...formData, [field.id]: html })}
              placeholder={field.placeholder || 'Escribe tu respuesta con formato enriquecido (negritas, viñetas, enlaces)...'}
              minHeight={field.maxHeight || '160px'}
            />
          </div>
        );
      }

      if (field.type === 'curp' && field.verifyCurp) {
        const hasVerified = curpVerificationState[field.id]?.success;
        const stateMsg = curpVerificationState[field.id]?.message;

        return (
          <div className="w-full space-y-2">
            <div className="relative w-full">
              <input
                type="text"
                disabled={isVerifyingCurp || curpVerificationState[field.id]?.success}
                placeholder={field.placeholder || '18 caracteres (ej. AAAA000000HAAAAAAA0)'}
                value={formData[field.id] || ''}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 18);
                  setFormData(prev => ({ ...prev, [field.id]: upper }));
                  if (curpVerificationState[field.id]) {
                    setCurpVerificationState(prev => ({ ...prev, [field.id]: undefined }));
                  }
                  if (/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/.test(upper)) {
                    handleVerifyCurp(field.id, upper);
                  }
                }}
                className={`${mainInputStyles.className} pr-10 ${hasVerified ? '!text-emerald-700 font-bold' : ''
                  }`}
                style={hasVerified ? { ...mainInputStyles.style, borderBottomColor: '#10b981', borderColor: '#10b981' } : mainInputStyles.style}
              />
              {formData[field.id] && !isVerifyingCurp && (
                <button
                  type="button"
                  onClick={() => {
                    setCurpVerificationState(prev => ({ ...prev, [field.id]: undefined }));
                    setFormData(prev => ({
                      ...prev,
                      [field.id]: '',
                      [`${field.id}_fallback`]: undefined
                    }));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100/50 transition-all shrink-0 cursor-pointer"
                  title="Limpiar CURP"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isVerifyingCurp && (
              <div className="flex items-center justify-between gap-3 mt-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50/80 text-xs sm:text-sm font-medium animate-in fade-in">
                <div className="flex items-center gap-2 text-stone-700 min-w-0">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-forest" style={{ color: themeColor }} />
                  <span className="truncate">{curpStatusMsg}</span>
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

            {!isVerifyingCurp && stateMsg && (
              hasVerified && curpVerificationState[field.id]?.details ? (
                <CurpIdentityCard
                  details={curpVerificationState[field.id].details}
                  themeColor={themeColor}
                  borderRadius={borderRadius}
                  onClear={() => {
                    setCurpVerificationState(prev => ({ ...prev, [field.id]: undefined }));
                    setFormData(prev => ({ ...prev, [field.id]: '' }));
                  }}
                />
              ) : (
                <p className="text-xs leading-relaxed font-semibold animate-in fade-in slide-in-from-top-1 duration-200 text-rose-500 mt-1">
                  {stateMsg}
                </p>
              )
            )}

            {!isVerifyingCurp && curpVerificationState[field.id]?.fallbackRequired && (() => {
              const curpRaw = formData[field.id] ? String(formData[field.id]).trim() : '';
              const fallbackVal = formData[`${field.id}_fallback`] || {};
              const firstNameCombined = [fallbackVal.firstName, fallbackVal.middleName].filter(Boolean).join(' ');
              const validationCheck = validateNameAgainstCurp(
                firstNameCombined || '',
                fallbackVal.paternalLastName || '',
                fallbackVal.maternalLastName || '',
                curpRaw
              );

              return (
                <div className={`p-5 sm:p-6 border space-y-4 animate-in fade-in duration-200 mt-3 ${borderRadius === 'none' ? 'rounded-none' : 'rounded-2xl'
                  } bg-white border-stone-200 shadow-xs`}>
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-stone-100 text-stone-700 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-stone-850">
                        Completa tus datos personales
                      </h5>
                      <p className="text-xs leading-relaxed text-stone-500 mt-0.5">
                        Ingresa los siguientes nombres y apellidos para continuar con tu registro:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 block">
                        Primer Nombre <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fallbackVal.firstName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const existing = prev[`${field.id}_fallback`] || {};
                            const updatedFallback = { ...existing, firstName: val };
                            const combined = [val, updatedFallback.middleName].filter(Boolean).join(' ');

                            const updatedFormData = {
                              ...prev,
                              [`${field.id}_fallback`]: updatedFallback
                            };

                            flatQuestions.forEach((fq: any) => {
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
                        className={subInputStyles.className}
                        style={subInputStyles.style}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 block">
                        Segundo Nombre <span className="text-stone-400 font-normal text-[10px]">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={fallbackVal.middleName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const existing = prev[`${field.id}_fallback`] || {};
                            const updatedFallback = { ...existing, middleName: val };
                            const combined = [updatedFallback.firstName, val].filter(Boolean).join(' ');

                            const updatedFormData = {
                              ...prev,
                              [`${field.id}_fallback`]: updatedFallback
                            };

                            flatQuestions.forEach((fq: any) => {
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
                        className={subInputStyles.className}
                        style={subInputStyles.style}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 block">
                        Primer Apellido (Paterno) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fallbackVal.paternalLastName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const existing = prev[`${field.id}_fallback`] || {};
                            const updatedFallback = { ...existing, paternalLastName: val };

                            const updatedFormData = {
                              ...prev,
                              [`${field.id}_fallback`]: updatedFallback
                            };

                            flatQuestions.forEach((fq: any) => {
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
                        className={subInputStyles.className}
                        style={subInputStyles.style}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 block">
                        Segundo Apellido (Materno) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fallbackVal.maternalLastName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const existing = prev[`${field.id}_fallback`] || {};
                            const updatedFallback = { ...existing, maternalLastName: val };

                            const updatedFormData = {
                              ...prev,
                              [`${field.id}_fallback`]: updatedFallback
                            };

                            flatQuestions.forEach((fq: any) => {
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
                        className={subInputStyles.className}
                        style={subInputStyles.style}
                      />
                    </div>
                  </div>

                  {!validationCheck.isValid && (
                    <div className="text-[10.5px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200/70 flex flex-col gap-0.5">
                      {validationCheck.warnings.map((w, idx) => (
                        <span key={idx}>⚠️ {w}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      }

      // Default inputs: text, email, phone, number, date
      return (
        <input
          type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'integer' || field.type === 'decimal' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          placeholder={field.placeholder || (field.type === 'phone' ? `${field.defaultCountryCode || '+52'} 55 1234 5678` : field.type === 'curp' ? '18 caracteres (ej. AAAA000000HAAAAAAA0)' : '')}
          value={formData[field.id] || ''}
          onFocus={(e) => {
            if (field.type === 'phone' && !formData[field.id]) {
              setFormData({ ...formData, [field.id]: `${field.defaultCountryCode || '+52'} ` });
            }
          }}
          onChange={(e) => {
            let val = e.target.value;
            if (field.type === 'phone') {
              val = val.replace(/[^\d+ ]/g, '');
              if (!val.startsWith('+')) {
                val = '+' + val.replace(/\+/g, '');
              } else {
                val = '+' + val.slice(1).replace(/\+/g, '');
              }
            } else if (field.type === 'curp') {
              val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 18);
            }
            setFormData({ ...formData, [field.id]: val });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isFluid) {
              e.preventDefault();
              if (validateFlatQuestion(typeformIndex)) {
                if (typeformIndex < flatQuestions.length - 1) {
                  goToTypeformIndex(typeformIndex + 1, 'left');
                } else {
                  handleSubmitForm();
                }
              }
            }
          }}
          className={mainInputStyles.className}
          style={mainInputStyles.style}
        />
      );
    };

    const renderFluidQuestionCard = (field: FormFieldItem, qIndex: number, isOutgoing = false) => {
      if (!field) return null;
      return (
        <div className="space-y-6 sm:space-y-8 w-full max-w-2xl mx-auto my-auto pb-12 sm:pb-4">
          {/* Step Tag */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs font-mono" style={{ color: themeColor }}>
              <span>{String(qIndex + 1).padStart(2, '0')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="uppercase px-2.5 py-0.5 rounded-md bg-forest/10 font-sans text-[11px]">
                {field.sectionTitle}
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-bold font-display text-forest leading-tight">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </h2>

            {field.helpText && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {field.helpText}
              </p>
            )}
          </div>

          {/* Field Input Control */}
          <div className="pt-2 max-w-2xl">
            {renderFieldInput(field, !isOutgoing)}
            {(() => {
              const inv = evaluateFieldInvalidation(field, formData, decodeCurp);
              if (inv.isInvalid) {
                return (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-2 p-2.5 bg-rose-50 rounded-xl border border-rose-200 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{inv.errorMessage}</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Inline Accept Action button (DESKTOP ONLY - hidden on mobile) */}
          {!isOutgoing && (() => {
            const isTermsBlocked = (field.type === 'terms_consent' || field.type === 'terms') && field.required && !formData[field.id];
            const isScheduleBlocked = field.type === 'schedule_event' && field.required && !(formData[field.id]?.slotId || formData[field.id]?.rsvpStatus === 'CONFIRMED');
            const isSigBlocked = field.type === 'signature' && field.required && !signatureData && !formData[field.id];
            const isDocBlocked = field.type === 'document_capture' && field.required && !formData[field.id]?.isComplete;
            const isSelfieBlocked = field.type === 'selfie_liveness' && field.required && !formData[field.id]?.isComplete;

            const curpValue = formData[field.id] ? String(formData[field.id]).trim() : '';
            const isCurpInvalid = field.type === 'curp' && curpValue !== '' && !/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/.test(curpValue);
            const isCurpRequiredBlocked = field.type === 'curp' && field.required && !curpValue;
            const isCurpVerificationBlocked = field.type === 'curp' && field.verifyCurp && !curpVerificationState[field.id]?.success && !isCurpFallbackComplete(field, formData);
            const isCurpBlocked = isCurpInvalid || isCurpRequiredBlocked || isCurpVerificationBlocked;

            const invCheck = evaluateFieldInvalidation(field, formData, decodeCurp);
            const isInvalidationBlocked = invCheck.isInvalid;

            const isBlocked = isTermsBlocked || isScheduleBlocked || isSigBlocked || isDocBlocked || isSelfieBlocked || isCurpBlocked || isInvalidationBlocked;

            return (
              <div className="pt-4 hidden sm:flex items-center gap-3">
                <button
                  type="button"
                  disabled={isBlocked}
                  onClick={() => {
                    if (isBlocked) return;
                    if (validateFlatQuestion(qIndex)) {
                      if (qIndex < flatQuestions.length - 1) {
                        goToTypeformIndex(qIndex + 1, 'left');
                      } else {
                        handleSubmitForm();
                      }
                    }
                  }}
                  className={`px-7 py-3.5 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all ${isBlocked
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:scale-102 active:scale-98 cursor-pointer'
                    } ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                  title={isTermsBlocked ? 'Debes leer y aceptar los términos para continuar' : isDocBlocked ? 'Debes capturar el documento para continuar' : undefined}
                >
                  <span>{qIndex < flatQuestions.length - 1 ? 'Aceptar ↵' : 'Completar y Guardar'}</span>
                  {qIndex < flatQuestions.length - 1 ? <Check className="w-4 h-4 stroke-[3]" /> : <Send className="w-4 h-4" />}
                </button>
                {!isBlocked && ['text', 'email', 'phone', 'integer', 'decimal', 'date', 'fullname', 'curp'].includes(field.type) && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">Presiona <strong>Enter ↵</strong></span>
                )}
              </div>
            );
          })()}
        </div>
      );
    };

    return (
      <div className="h-[100dvh] max-h-[100dvh] bg-[#fbfbfa] text-foreground antialiased selection:bg-forest selection:text-white flex flex-col overflow-hidden relative">

        {/* Full-width Top Fixed Progress Bar for Fluid Layout (Matching standalone form) */}
        {isFluid && (
          <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-stone-200/70 pointer-events-none">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${((typeformIndex + 1) / (flatQuestions.length || 1)) * 100}%`,
                backgroundColor: themeColor
              }}
            />
          </div>
        )}

        {/* ================= COLLAPSIBLE ADMISSION HEADER & BREADCRUMB ================= */}
        <div className="relative z-40 shrink-0">

          {/* Collapsible Area */}
          <div
            className={`transition-all duration-300 ease-in-out bg-white border-b border-forest/10 shadow-2xs ${isHeaderCollapsed
              ? 'max-h-0 opacity-0 pointer-events-none overflow-hidden'
              : 'opacity-100'
              }`}
          >
            {/* Top Brand Banner with School Primary Color */}
            <div
              className="shadow-sm text-white transition-colors relative z-30"
              style={{ backgroundColor: school?.primaryColor || '#1b3b2b' }}
            >
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  {school?.logoUrl ? (
                    <img
                      src={school.logoUrl}
                      alt={school?.name || 'Logo del Colegio'}
                      className="h-8 sm:h-10 md:h-11 w-auto max-w-full max-h-8 sm:max-h-10 md:max-h-11 object-contain shrink min-w-0"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 text-white flex items-center justify-center font-bold shrink-0">
                        <SchoolIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h1 className="text-xs sm:text-sm md:text-base font-bold text-white font-display truncate">
                        {school?.name || 'Ceiba Montessori International'}
                      </h1>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="hidden md:flex flex-col items-end gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                      Portal de Admisión
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-white shadow-2xs flex items-center gap-1.5 border border-white/20 bg-white/15 backdrop-blur-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{stage?.name || 'Proceso de Admisión'}</span>
                    </span>
                  </div>

                  {dossierData?.isAuthorized && application?.tutorName && (
                    <UserHeaderMenu
                      tutorName={application.tutorName}
                      tutorEmail={application.tutorEmail}
                      tutorRelationship={application.tutorRelationship}
                      onDisconnect={handleDisconnect}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Breadcrumb & Applicant Context Bar */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                <Link
                  to={getPortalBasePath()}
                  className="hover:text-forest font-semibold flex items-center gap-1 transition-colors text-forest/80"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Portal</span>
                </Link>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                <span className="text-muted-foreground/80 truncate max-w-[130px] sm:max-w-none">
                  {application.childName}
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                <span className="font-bold text-forest truncate max-w-[180px] sm:max-w-none">
                  {activeRequiredForm?.formTitle || activeFormTemplate.title}
                </span>
              </nav>

              {/* Status / Notice */}
              <div className="flex items-center gap-2 shrink-0">
                {isAlreadySubmitted ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Ya enviado (puedes actualizarlo)</span>
                  </span>
                ) : activeRequiredForm?.isMandatory ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                    ● Requisito Obligatorio
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md bg-forest/5 text-forest text-[11px] font-semibold">
                    Requisito Opcional
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Centered Edge Collapse Handler */}
          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(prev => !prev)}
              className={`absolute z-30 bg-white border border-forest/20 shadow-md text-forest hover:bg-forest hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md flex items-center justify-center ${isHeaderCollapsed
                ? 'top-2 p-1.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold sm:gap-1.5 shadow-sm'
                : '-bottom-3.5 p-1.5 sm:px-3.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold sm:gap-1.5'
                }`}
              title={isHeaderCollapsed ? 'Mostrar cabecera del proceso' : 'Ocultar cabecera'}
            >
              {isHeaderCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mostrar cabecera</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ocultar cabecera</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LAYOUT 1: FLUIDO / FOCUS FLOW (PANTALLA COMPLETA 1 PREGUNTA A LA VEZ)     */}
        {/* ========================================================================= */}
        {isFluid && (
          <div className="flex-1 min-h-0 w-full flex flex-col justify-between overflow-hidden overflow-x-hidden">
            <main className="flex-1 min-h-0 w-full max-w-full flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain py-4 pb-32 sm:py-6 sm:pb-6">
              {/* Tira continua de preguntas (Horizontal Conveyor Belt Stage) */}
              <div className="w-full max-w-full flex flex-col my-auto py-2 relative select-none">
                {isTransitioning && outgoingIndex !== null ? (
                  /* Tira continua de 2 cards adyacentes lado a lado (Cero solapamiento) */
                  <div
                    key={`strip-${outgoingIndex}-to-${typeformIndex}`}
                    className={`w-[200%] flex flex-row items-start sm:items-center shrink-0 ${slideDirection === 'left' ? 'animate-strip-forward' : 'animate-strip-backward'
                      }`}
                  >
                    {/* Slot Izquierdo */}
                    <div className="w-1/2 flex items-start sm:items-center justify-center px-4 sm:px-8 shrink-0">
                      <div className="w-full max-w-2xl mx-auto">
                        {renderFluidQuestionCard(
                          slideDirection === 'left' ? flatQuestions[outgoingIndex] : flatQuestions[typeformIndex],
                          slideDirection === 'left' ? outgoingIndex : typeformIndex,
                          slideDirection === 'left'
                        )}
                      </div>
                    </div>

                    {/* Slot Derecho */}
                    <div className="w-1/2 flex items-start sm:items-center justify-center px-4 sm:px-8 shrink-0">
                      <div className="w-full max-w-2xl mx-auto">
                        {renderFluidQuestionCard(
                          slideDirection === 'left' ? flatQuestions[typeformIndex] : flatQuestions[outgoingIndex],
                          slideDirection === 'left' ? typeformIndex : outgoingIndex,
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
                      {currentFluidField && renderFluidQuestionCard(currentFluidField, typeformIndex, false)}
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Bottom Fixed Navigation & Action Bar */}
            <footer className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-t border-forest/15 px-4 sm:px-8 py-3 sm:py-4 shadow-lg sm:shadow-none flex items-center justify-between gap-3 w-full">
              {/* Dossier & Student Info Badge */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  <span className="font-semibold text-forest truncate">{application.childName}</span>
                  <span className="hidden md:inline text-forest/20">•</span>
                  <span className="hidden md:inline text-muted-foreground truncate">{activeRequiredForm?.formTitle || activeFormTemplate.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {(() => {
                  const activeField = flatQuestions[typeformIndex];
                  const isTermsBlockedActive = activeField && (activeField.type === 'terms_consent' || activeField.type === 'terms') && activeField.required && !formData[activeField.id];
                  const isScheduleBlockedActive = activeField && activeField.type === 'schedule_event' && activeField.required && !(formData[activeField.id]?.slotId || formData[activeField.id]?.rsvpStatus === 'CONFIRMED');
                  const isSigBlockedActive = activeField && activeField.type === 'signature' && activeField.required && !signatureData && !formData[activeField.id];
                  const isDocBlockedActive = activeField && activeField.type === 'document_capture' && activeField.required && !formData[activeField.id]?.isComplete;
                  const isSelfieBlockedActive = activeField && activeField.type === 'selfie_liveness' && activeField.required && !formData[activeField.id]?.isComplete;

                  const curpValueActive = activeField && formData[activeField.id] ? String(formData[activeField.id]).trim() : '';
                  const isCurpInvalidActive = activeField && activeField.type === 'curp' && curpValueActive !== '' && !/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/.test(curpValueActive);
                  const isCurpRequiredBlockedActive = activeField && activeField.type === 'curp' && activeField.required && !curpValueActive;
                  const isCurpVerificationBlockedActive = activeField && activeField.type === 'curp' && activeField.verifyCurp && !curpVerificationState[activeField.id]?.success && !isCurpFallbackComplete(activeField, formData);
                  const isCurpBlockedActive = isCurpInvalidActive || isCurpRequiredBlockedActive || isCurpVerificationBlockedActive;

                  const isStepBlocked = isTermsBlockedActive || isScheduleBlockedActive || isSigBlockedActive || isDocBlockedActive || isSelfieBlockedActive || isCurpBlockedActive;

                  return (
                    <>
                      {/* Prev/Next Nav Arrows */}
                      <div className={`flex items-center gap-1 p-1 border border-forest/15 bg-stone-50/80 shadow-2xs ${getRadiusClass(borderRadius, 'card')}`}>
                        <button
                          type="button"
                          onClick={() => goToTypeformIndex(typeformIndex - 1, 'right')}
                          disabled={typeformIndex === 0}
                          className={`p-1.5 sm:p-2 border border-transparent bg-white text-forest hover:bg-forest/5 disabled:opacity-30 transition-colors cursor-pointer shadow-2xs ${getRadiusClass(borderRadius, 'button')}`}
                          title="Pregunta anterior"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isStepBlocked) return;
                            if (validateFlatQuestion(typeformIndex)) {
                              goToTypeformIndex(typeformIndex + 1, 'left');
                            }
                          }}
                          disabled={typeformIndex >= flatQuestions.length - 1 || isStepBlocked}
                          className={`p-1.5 sm:p-2 border border-transparent bg-white text-forest hover:bg-forest/5 disabled:opacity-30 transition-colors cursor-pointer shadow-2xs ${getRadiusClass(borderRadius, 'button')}`}
                          title={isTermsBlockedActive ? 'Debes leer y aceptar los términos' : 'Siguiente pregunta'}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Action Buttons: Mobile has icon-only in footer; Desktop only shows submit button on final step */}
                      {typeformIndex < flatQuestions.length - 1 ? (
                        /* Mobile-only Next button (sm:hidden) */
                        <button
                          type="button"
                          disabled={isStepBlocked}
                          onClick={() => {
                            if (isStepBlocked) return;
                            if (validateFlatQuestion(typeformIndex)) {
                              goToTypeformIndex(typeformIndex + 1, 'left');
                            }
                          }}
                          className={`sm:hidden h-10 w-10 text-white flex items-center justify-center shadow-lg transition-all shrink-0 ${isStepBlocked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-102 active:scale-98 cursor-pointer'
                            } ${getRadiusClass(borderRadius, 'button')}`}
                          style={{ backgroundColor: themeColor }}
                          title={isTermsBlockedActive ? 'Debes leer y aceptar los términos' : 'Siguiente'}
                        >
                          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      ) : (
                        /* Final Slide: ONLY visible on Mobile (sm:hidden). Desktop already has button inside the form card */
                        <button
                          type="button"
                          onClick={handleSubmitForm}
                          disabled={submittingForm || isStepBlocked}
                          className={`sm:hidden h-10 w-10 text-white flex items-center justify-center shadow-xl transition-all disabled:opacity-40 cursor-pointer shrink-0 ${getRadiusClass(borderRadius, 'button')}`}
                          style={{ backgroundColor: themeColor }}
                          title="Completar y Guardar"
                        >
                          {submittingForm ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[3]" />}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </footer>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYOUT 2: ASISTENTE POR PASOS (STEP WIZARD)                              */}
        {/* ========================================================================= */}
        {isWizard && (
          <div className="flex-1 min-h-0 w-full flex flex-col justify-between overflow-hidden">
            <main className="flex-1 min-h-0 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 sm:pb-8 overflow-y-auto overscroll-contain flex flex-col justify-start">
              {/* Step Progress Header */}
              <div className="mb-6 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      Paso {currentStepIndex + 1} de {totalSteps}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold font-display text-forest">
                      {currentSection?.title || 'Sección'}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-forest/10 text-forest">
                    {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
                  </span>
                </div>

                {/* Progress Steps Dots/Bar */}
                <div className="w-full bg-forest/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
                      backgroundColor: themeColor
                    }}
                  />
                </div>
              </div>

              {/* Step Content Card */}
              <div className={`bg-white border border-forest/15 shadow-sm overflow-hidden flex flex-col flex-1 ${getRadiusClass(borderRadius, 'card')}`}>
                <div className="p-6 sm:p-8 flex-1 space-y-6">
                  {currentSection?.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed border-b border-forest/10 pb-4">
                      {currentSection.description}
                    </p>
                  )}

                  <div className="space-y-6">
                    {(currentSection?.fields || []).map((field: FormFieldItem) => (
                      <div
                        key={field.id}
                        className={`space-y-2 bg-stone-50/60 p-4 sm:p-5 border border-forest/10 transition-colors focus-within:border-forest/30 focus-within:bg-white ${getRadiusClass(borderRadius, 'card')}`}
                      >
                        <label className="text-xs sm:text-sm font-bold text-forest flex items-center gap-1">
                          <span>{field.label}</span>
                          {field.required && <span className="text-destructive font-bold">*</span>}
                        </label>
                        {field.helpText && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{field.helpText}</p>
                        )}
                        {renderFieldInput(field)}
                        {(() => {
                          const inv = evaluateFieldInvalidation(field, formData, decodeCurp);
                          if (inv.isInvalid) {
                            return (
                              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-2 p-2.5 bg-rose-50 rounded-xl border border-rose-200 animate-in fade-in">
                                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                                <span>{inv.errorMessage}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>

            {/* Step Footer Controls (Fixed bottom on Mobile, card footer on Desktop) */}
            <footer className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-t border-forest/15 px-4 py-3 shadow-lg flex items-center justify-between gap-3 max-w-4xl w-full mx-auto sm:px-6">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={handlePrevStep}
                className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-forest bg-white border border-forest/20 hover:bg-forest/5 disabled:opacity-30 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Paso </span><span>Anterior</span>
              </button>

              <div className="sm:hidden text-[11px] font-mono font-bold text-muted-foreground">
                {currentStepIndex + 1} / {totalSteps}
              </div>

              {currentStepIndex < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm hover:scale-102 active:scale-98 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  <span>Siguiente</span><span className="hidden xs:inline"> Paso</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={submittingForm}
                  className={`px-5 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition-colors flex items-center gap-2 shadow-md hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingForm ? 'Guardando...' : 'Completar y Guardar'}</span>
                </button>
              )}
            </footer>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYOUT 3: CLÁSICO / GOOGLE FORMS (TARJETAS VERTICALES CONTINUAS)           */}
        {/* ========================================================================= */}
        {!isFluid && !isWizard && (
          <div className="flex-1 min-h-0 w-full flex flex-col justify-between overflow-hidden">
            <main className="flex-1 min-h-0 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 sm:pb-8 overflow-y-auto overscroll-contain space-y-6">
              {/* Top Brand Strip Header Card */}
              <div className={`bg-white border border-forest/15 shadow-sm overflow-hidden ${getRadiusClass(borderRadius, 'card')}`}>
                <div
                  className="h-3.5 w-full"
                  style={{ backgroundColor: themeColor }}
                />
                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-forest/10 text-[10px] font-bold text-forest uppercase tracking-widest">
                      Formulario Oficial de Admisión
                    </span>
                    <Link
                      to={getPortalBasePath()}
                      className={`px-3 py-1 bg-forest/5 hover:bg-forest/10 text-forest text-xs font-semibold flex items-center gap-1.5 transition-colors ${getRadiusClass(borderRadius, 'button')}`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver</span>
                    </Link>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-bold font-display text-forest">{activeFormTemplate.title}</h2>
                  {activeFormTemplate.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {activeFormTemplate.description}
                    </p>
                  )}
                  <div className="pt-2 text-xs text-muted-foreground border-t border-forest/10 flex items-center gap-1">
                    <span>Expediente de:</span>
                    <strong className="text-forest">{application.childName}</strong>
                  </div>
                </div>
              </div>

              {/* Continuous Section Cards */}
              {activeSections.map((sec: any, sIdx: number) => (
                <div
                  key={sec.id || sIdx}
                  className={`bg-white border border-forest/15 shadow-sm p-6 sm:p-8 space-y-6 ${getRadiusClass(borderRadius, 'card')}`}
                >
                  <div className="space-y-1 pb-3 border-b border-forest/10">
                    <h3 className="text-base sm:text-lg font-bold text-forest font-display flex items-center gap-2">
                      <span className={`w-6 h-6 bg-forest/10 text-forest text-xs font-bold flex items-center justify-center ${getRadiusClass(borderRadius, 'avatar')}`}>
                        {sIdx + 1}
                      </span>
                      <span>{sec.title || `Sección ${sIdx + 1}`}</span>
                    </h3>
                    {sec.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{sec.description}</p>
                    )}
                  </div>

                  <div className="space-y-6">
                    {(sec.fields || []).map((field: FormFieldItem) => (
                      <div
                        key={field.id}
                        className={`space-y-2 bg-stone-50/60 p-4 sm:p-5 border border-forest/10 transition-colors focus-within:border-forest/30 focus-within:bg-white ${getRadiusClass(borderRadius, 'card')}`}
                      >
                        <label className="text-xs sm:text-sm font-bold text-forest flex items-center gap-1">
                          <span>{field.label}</span>
                          {field.required && <span className="text-destructive font-bold">*</span>}
                        </label>
                        {field.helpText && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{field.helpText}</p>
                        )}
                        {renderFieldInput(field)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Submit Action Card (Desktop) */}
              <div className={`bg-white border border-forest/15 shadow-sm p-6 hidden sm:flex sm:flex-row sm:items-center justify-between gap-4 ${getRadiusClass(borderRadius, 'card')}`}>
                <div className="text-xs text-muted-foreground">
                  Asegúrate de haber completado todos los campos obligatorios (*) antes de enviar.
                </div>
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={submittingForm}
                  className={`px-8 py-3.5 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shrink-0 ${getRadiusClass(borderRadius, 'button')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingForm ? 'Guardando...' : 'Completar y Guardar Formulario'}</span>
                </button>
              </div>
            </main>

            {/* Mobile Fixed Action Footer (sm:hidden) */}
            <footer className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-t border-forest/15 px-4 py-3 sm:hidden shadow-lg flex items-center justify-between gap-3">
              <Link
                to={getPortalBasePath()}
                className={`px-3.5 py-2.5 bg-white border border-forest/20 text-forest text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${getRadiusClass(borderRadius, 'button')}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Portal</span>
              </Link>

              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={submittingForm}
                className={`flex-1 py-2.5 px-4 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all disabled:opacity-50 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                style={{ backgroundColor: themeColor }}
              >
                <Send className="w-4 h-4" />
                <span>{submittingForm ? 'Guardando...' : 'Completar y Guardar'}</span>
              </button>
            </footer>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-foreground antialiased selection:bg-forest selection:text-white">

      {/* Top Montessori Brand Banner */}
      <header
        className="sticky top-0 z-30 shadow-md backdrop-blur-md transition-colors text-white"
        style={{ backgroundColor: school?.primaryColor || '#1b3b2b' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            {school?.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={school?.name || 'Logo del Colegio'}
                className="h-8 sm:h-10 md:h-11 w-auto max-w-full max-h-8 sm:max-h-10 md:max-h-11 object-contain shrink min-w-0"
              />
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 text-white flex items-center justify-center font-bold shrink-0">
                  <SchoolIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className="text-xs sm:text-sm md:text-base font-bold text-white font-display truncate">
                  {school?.name || 'Ceiba Montessori International'}
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex flex-col items-end gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                Portal de Admisión
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-white shadow-2xs flex items-center gap-1.5 border border-white/20 bg-white/15 backdrop-blur-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{stage?.name || 'Proceso de Admisión'}</span>
              </span>
            </div>

            {dossierData?.isAuthorized && application?.tutorName && (
              <UserHeaderMenu
                tutorName={application.tutorName}
                tutorEmail={application.tutorEmail}
                tutorRelationship={application.tutorRelationship}
                onDisconnect={handleDisconnect}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* Applicant Header Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-forest/15 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-display text-2xl font-bold border border-forest/20 shadow-2xs">
                {application.childName?.charAt(0) || 'A'}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold font-display text-forest">{application.childName}</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tutor / Responsable: <span className="font-semibold text-forest">{application.tutorName}</span> • {application.tutorEmail}
                </p>
              </div>
            </div>

            {/* Overall Admission Process Circular Progress Badge */}
            {(() => {
              const percent = overallProgressPercent;
              const radius = 18;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (percent / 100) * circumference;

              return (
                <div className="bg-forest/5 p-2.5 px-4 rounded-2xl border border-forest/10 flex items-center gap-3.5 shrink-0 self-start sm:self-auto">
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] font-bold text-muted-foreground block">Progreso del Proceso</span>

                    {totalRequiredForms > 0 && (<span className="text-xs font-bold text-forest">{completedFormsCount} de {totalRequiredForms} formularios de esta fase</span>)}

                  </div>

                  {/* Circular Progress Bar */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 44 44">
                      {/* Background Track */}
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        className="text-forest/10"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      {/* Animated Progress Circle */}
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        className={`transition-all duration-700 ease-out ${percent === 100 ? 'text-emerald-600' : 'text-forest'
                          }`}
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {percent === 100 ? (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      ) : (
                        <span className="text-[10px] font-black font-mono text-forest">
                          {percent}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Stage Description & Guidance */}
          {stage?.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stage.description}
            </p>
          )}

          {/* Active Verified Session Bar */}
          {dossierData.isAuthorized && application?.tutorName && (
            <div className="p-3.5 px-4 sm:px-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-emerald-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                    <span>Conectado como</span>
                    <span className="text-forest font-extrabold underline decoration-emerald-500/50">
                      {application.tutorName}
                    </span>
                    {application.tutorRelationship && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        {application.tutorRelationship}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono flex items-center gap-2 flex-wrap">
                    <span>{application.tutorEmail}</span>
                    <span>•</span>
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Identidad verificada
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="self-end sm:self-auto px-3.5 py-1.5 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border border-red-200/80 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs hover:scale-102 active:scale-98 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Desconectar</span>
              </button>
            </div>
          )}
        </div>

        {/* OTP IDENTITY VERIFICATION GATE (When not authorized / masked state) */}
        {!dossierData.isAuthorized ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="max-w-md mx-auto text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mx-auto shadow-2xs border border-forest/15">
                {otpSent ? <Key className="w-7 h-7 text-forest" /> : <ShieldCheck className="w-7 h-7 text-forest" />}
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-forest">
                {otpSent ? 'Código de Verificación Enviado' : 'Validación de Identidad Requerida'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {otpSent ? (
                  <>
                    Hemos enviado un código de seguridad de 6 dígitos al correo electrónico{' '}
                    <span className="font-bold text-forest">{authEmail}</span>. Ingréselo para desbloquear el expediente.
                  </>
                ) : (
                  'Por motivos de privacidad y protección del aspirante, ingrese el correo electrónico del tutor registrado en la solicitud para recibir el código de acceso.'
                )}
              </p>
            </div>

            {authError && (
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="max-w-md mx-auto space-y-4">
                <div className="space-y-1.5 text-xs text-left">
                  <label className="block font-bold text-forest">
                    Correo Electrónico del Tutor / Responsable
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => {
                      setAuthEmail(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="ejemplo@correo.com"
                    className="w-full p-3 rounded-2xl border border-forest/20 text-forest bg-white text-xs sm:text-sm focus:ring-2 focus:ring-forest/20 focus:border-forest focus:outline-none shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={requestingOtp || !authEmail.trim()}
                  className="w-full py-3.5 px-6 bg-forest hover:bg-forest/90 text-white rounded-2xl text-xs sm:text-sm font-bold font-display flex items-center justify-center gap-2 shadow-md shadow-forest/20 hover:scale-102 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>{requestingOtp ? 'Validando y Enviando...' : 'Enviar Código de Autorización'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="max-w-md mx-auto space-y-4">
                <div className="space-y-1.5 text-xs text-left">
                  <label className="block font-bold text-forest text-center">
                    Código de Seguridad (6 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="123456"
                    className="w-full p-3.5 rounded-2xl border border-forest/20 text-forest bg-white text-center text-2xl font-mono font-bold tracking-[8px] focus:ring-2 focus:ring-forest/20 focus:border-forest focus:outline-none shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.length < 6}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold font-display flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-102 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>{verifyingOtp ? 'Verificando Código...' : 'Verificar y Acceder al Expediente'}</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-2 text-muted-foreground border-t border-forest/10">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setAuthError(null);
                    }}
                    className="hover:text-forest underline cursor-pointer"
                  >
                    Cambiar correo
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || requestingOtp}
                    onClick={() => handleRequestOtp()}
                    className="hover:text-forest underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Reenviar código (${resendCooldown}s)` : 'Reenviar código'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : welcomeMessageText && !welcomeDismissed ? (
          <div className="bg-white rounded-3xl p-6 sm:p-9 border border-forest/15 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="prose prose-stone max-w-none text-forest leading-relaxed prose-headings:font-display prose-headings:text-forest prose-p:text-forest/90 prose-p:leading-relaxed prose-strong:text-forest prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal prose-li:text-forest/90 prose-a:text-forest prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-forest/30 prose-blockquote:italic prose-blockquote:text-forest/80">
              <ReactMarkdown>{welcomeMessageText}</ReactMarkdown>
            </div>

            <div className="pt-4 flex items-center justify-end border-t border-forest/10">
              <button
                type="button"
                onClick={handleStartAdmission}
                className="w-full sm:w-auto px-8 py-3.5 bg-forest hover:bg-forest/90 text-white rounded-2xl font-bold font-display text-sm flex items-center justify-center gap-2.5 shadow-md shadow-forest/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                <span>Comenzar Proceso de Admisión</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* COMPACT PIPELINE STEPPER (Directamente en canvas, limpio y perfectamente centrado) */}
            {progressionStages.length > 0 && (
              <div className="py-2 px-2 sm:px-6">
                {/* Stepper connected line bar */}
                <div className="relative pt-2 pb-10 px-4 sm:px-8">
                  {/* Connected Track Row */}
                  <div className="relative h-10 flex items-center justify-between w-full">
                    {/* Background Connecting Line */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-1 bg-stone-200/80 rounded-full z-0" />

                    {/* Progress Connecting Line */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-4 h-1 bg-emerald-600 rounded-full transition-all duration-500 z-0"
                      style={{
                        width: progressionStages.length > 1
                          ? `calc(${(currentStageIndex / (progressionStages.length - 1)) * 100}% - 8px)`
                          : '0%'
                      }}
                    />

                    {/* Step Points */}
                    {progressionStages.map((stg, idx) => {
                      const isPast = idx < currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      const isFuture = idx > currentStageIndex;
                      const stageKey = stg.id || String(idx);
                      const stageForms = Array.isArray(stg.required_forms)
                        ? stg.required_forms
                        : (Array.isArray((stg as any).requiredForms) ? (stg as any).requiredForms : []);
                      const formsCount = isCurrent ? totalRequiredForms : stageForms.length;

                      return (
                        <div key={stageKey} className="relative flex items-center justify-center z-10">
                          <Tooltip
                            open={openTooltipId === stageKey ? true : undefined}
                            onOpenChange={(isOpen) => {
                              if (!isOpen && openTooltipId === stageKey) {
                                setOpenTooltipId(null);
                              }
                            }}
                          >
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpenTooltipId(prev => prev === stageKey ? null : stageKey);
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${isPast
                                  ? 'bg-emerald-600 text-white shadow-xs hover:scale-105 hover:bg-emerald-700'
                                  : isCurrent
                                    ? 'bg-forest text-white ring-4 ring-forest/20 shadow-md ring-offset-2 ring-offset-[#fbfbfa]'
                                    : 'bg-white border-2 border-stone-300 text-stone-500 hover:border-forest/50 hover:text-forest hover:scale-105 shadow-2xs'
                                  }`}
                                title={`Paso ${idx + 1}: ${stg.name}`}
                              >
                                {isPast ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8} className="max-w-xs p-3 space-y-1.5 bg-forest text-white border-forest shadow-xl text-left z-50 rounded-lg">
                              <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-1">
                                <span className="text-[10px] font-mono text-white/70 uppercase">Paso {idx + 1}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${isPast ? 'bg-emerald-500/30 text-emerald-300' : isCurrent ? 'bg-amber-400/30 text-amber-300' : 'bg-white/20 text-white/80'
                                  }`}>
                                  {isPast ? '✓ Completada' : isCurrent ? '● Fase Actual' : 'Por transitar'}
                                </span>
                              </div>
                              <p className="font-bold text-xs text-white pt-0.5">{stg.name}</p>
                              {stg.description && (
                                <p className="text-[11px] text-white/80 leading-snug">{stg.description}</p>
                              )}
                              <p className="text-[10px] text-white/70 pt-0.5">
                                {isCurrent ? (
                                  formsCount > 0
                                    ? `${completedFormsCount} de ${formsCount} formulario${formsCount !== 1 ? 's' : ''} completados`
                                    : 'Sin formularios requeridos'
                                ) : isPast ? (
                                  formsCount > 0
                                    ? `${formsCount} formulario${formsCount !== 1 ? 's' : ''} completados`
                                    : 'Sin formularios requeridos'
                                ) : (
                                  formsCount > 0
                                    ? `${formsCount} formulario${formsCount !== 1 ? 's' : ''} requeridos`
                                    : 'Sin formularios requeridos'
                                )}
                              </p>
                            </TooltipContent>
                          </Tooltip>

                          {/* Prominent Label ONLY for the active/current stage */}
                          {isCurrent ? (
                            <div className="absolute top-11 flex flex-col items-center text-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                              <span className="text-xs font-bold text-forest font-display">
                                {stg.name}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.2 rounded-full border border-emerald-200 mt-0.5">
                                Fase Actual
                              </span>
                            </div>
                          ) : (
                            <span className="absolute top-11 text-[10px] font-semibold text-stone-400 hidden sm:block whitespace-nowrap">
                              Paso {idx + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Status Card when all forms are completed or no required forms in this phase */}
            {requiredForms.length === 0 || allCompleted ? (
              <div className="space-y-6">
                <div className="p-6 sm:p-7 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 text-forest flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-2xs animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0 text-center sm:text-left">
                    <h4 className="text-sm sm:text-base font-bold font-display text-forest">
                      {allCompleted ? '¡Formularios completados con éxito!' : 'Etapa en curso'}
                    </h4>
                    <p className="text-xs sm:text-sm text-forest/90 leading-relaxed">
                      Nuestro equipo debe pasar a la siguiente fase de forma manual. No se preocupe, cuando eso suceda le llegará una notificación por correo electrónico.
                    </p>
                  </div>
                </div>

                {/* If forms exist and were completed, render them for review/editing */}
                {requiredForms.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-display text-forest uppercase tracking-wider">
                      Formularios enviados ({completedFormsCount} de {totalRequiredForms})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requiredForms.map((req) => {
                        const template = req.template ? mapAdmissionFormTemplate(req.template) : null;
                        const sections = getTemplateSections(template);
                        const submission = formSubmissions.find(s => s.formTemplateId === req.formTemplateId && (s.status === 'SUBMITTED' || s.status === 'APPROVED'));
                        const isCompleted = !!submission;
                        const totalFields = sections.reduce((acc: number, sec: any) => acc + (sec.fields?.length || 0), 0);
                        const totalSteps = sections.length || 1;

                        return (
                          <div
                            key={req.formTemplateId}
                            onClick={() => handleSelectForm(req)}
                            className="p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group hover:scale-[1.01] hover:shadow-md bg-emerald-50/40 border-emerald-200/80 shadow-2xs"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-200">
                                  ✓ Completado
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-forest/50" />
                                  {totalSteps} {totalSteps === 1 ? 'sección' : 'secciones'} • {totalFields} preguntas
                                </span>
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-forest group-hover:text-forest-light transition-colors">
                                  {req.formTitle || template?.title || 'Formulario de Admisión'}
                                </h4>
                                {template?.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                    {template.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Ver / Modificar Respuestas
                              </span>

                              <span className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-emerald-100 text-emerald-700">
                                <Check className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Requirements Grid Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-forest font-display flex items-center gap-2">
                      <FileText className="w-4 h-4 text-forest" />
                      <span>Formularios y Requerimientos de esta Fase</span>
                    </h3>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Haz clic en cada tarjeta para abrir y rellenar el formulario
                    </span>
                  </div>
                </div>

                {/* Requirements Forms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredForms.map((req) => {
                    const template = req.template ? mapAdmissionFormTemplate(req.template) : null;
                    const sections = getTemplateSections(template);
                    const submission = formSubmissions.find(s => s.formTemplateId === req.formTemplateId && (s.status === 'SUBMITTED' || s.status === 'APPROVED'));
                    const isCompleted = !!submission;
                    const totalFields = sections.reduce((acc: number, sec: any) => acc + (sec.fields?.length || 0), 0);
                    const totalSteps = sections.length || 1;

                    return (
                      <div
                        key={req.formTemplateId}
                        onClick={() => handleSelectForm(req)}
                        className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group hover:scale-[1.01] hover:shadow-md ${isCompleted
                          ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                          : 'bg-white border-forest/15 shadow-2xs hover:border-forest/40'
                          }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : req.isMandatory
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-forest/5 text-forest border-forest/10'
                              }`}>
                              {isCompleted ? '✓ Completado' : req.isMandatory ? 'Obligatorio' : 'Opcional'}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 text-forest/50" />
                              {totalSteps} {totalSteps === 1 ? 'sección' : 'secciones'} • {totalFields} preguntas
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-forest group-hover:text-forest-light transition-colors">
                              {req.formTitle || template?.title || 'Formulario de Admisión'}
                            </h4>
                            {template?.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-forest/75 flex items-center gap-1.5">
                            {isCompleted ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Enviado
                              </span>
                            ) : (
                              <span className="text-forest flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                Llenar cuestionario <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </span>

                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-forest/5 text-forest group-hover:bg-forest group-hover:text-white'
                            }`}>
                            {isCompleted ? <Check className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Lightbox / Image Preview Modal */}
      {previewModalData && (
        <div
          className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalData(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950">
              <span className="text-xs font-bold truncate pr-4">{previewModalData.title}</span>
              <button
                type="button"
                onClick={() => setPreviewModalData(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-black/50">
              {previewModalData.isVideo || previewModalData.url.startsWith('data:video') || previewModalData.url.endsWith('.webm') || previewModalData.url.endsWith('.mp4') ? (
                <video
                  src={previewModalData.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <img
                  src={previewModalData.url}
                  alt={previewModalData.title}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
