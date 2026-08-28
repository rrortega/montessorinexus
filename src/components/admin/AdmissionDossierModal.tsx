import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  PenTool,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  Copy,
  Code2,
  Eye,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Upload,
  ScanFace,
  AlertTriangle,
  Play,
  Sparkles,
  QrCode
} from 'lucide-react';
import {
  getAdmissionApplicationDossier,
  AdmissionApplicationItem,
  FormSubmissionItem,
  AdmissionFormTemplateItem,
  FormFieldItem,
  FormSectionItem
} from '@/lib/sqlite';
import { toast } from 'sonner';

interface AdmissionDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}

// CURP Decoder Helper
function decodeCurp(curp: string) {
  if (!curp || curp.length < 18) return null;
  const c = curp.toUpperCase();
  const yearDigits = c.substring(4, 6);
  const month = c.substring(6, 8);
  const day = c.substring(8, 10);
  const sexCode = c.charAt(10);
  const stateCode = c.substring(11, 13);

  const numYear = parseInt(yearDigits, 10);
  const fullYear = numYear <= 35 ? 2000 + numYear : 1900 + numYear;
  const formattedDate = `${day}/${month}/${fullYear}`;

  const currentYear = new Date().getFullYear();
  let edad = currentYear - fullYear;
  if (edad < 0) edad = 0;

  const STATE_NAMES: Record<string, string> = {
    AS: 'Aguascalientes', BC: 'Baja California', BS: 'Baja California Sur', CC: 'Campeche',
    CL: 'Coahuila', CM: 'Colima', CS: 'Chiapas', CH: 'Chihuahua', DF: 'Ciudad de México',
    DG: 'Durango', GT: 'Guanajuato', GR: 'Guerrero', HG: 'Hidalgo', JC: 'Jalisco',
    MC: 'México', MN: 'Michoacán', MS: 'Morelos', NT: 'Nayarit', NL: 'Nuevo León',
    OC: 'Oaxaca', PL: 'Puebla', QT: 'Querétaro', QR: 'Quintana Roo', SP: 'San Luis Potosí',
    SL: 'Sinaloa', SR: 'Sonora', TC: 'Tabasco', TS: 'Tamaulipas', TL: 'Tlaxcala',
    VZ: 'Veracruz', YN: 'Yucatán', ZS: 'Zacatecas', NE: 'Nacido en el Extranjero'
  };

  return {
    curp: c,
    fechaNacimiento: formattedDate,
    edad,
    sexo: sexCode === 'H' ? 'HOMBRE' : sexCode === 'M' ? 'MUJER' : 'OTRO',
    estadoNacimiento: STATE_NAMES[stateCode] || stateCode,
    isValidFormat: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i.test(c)
  };
}

// Humanize field keys for structured display
const humanizeKey = (key: string) => {
  const KEY_LABELS: Record<string, string> = {
    firstName: 'Nombre(s)',
    paternalLastName: 'Apellido Paterno',
    maternalLastName: 'Apellido Materno',
    fullName: 'Nombre Completo',
    phone: 'Teléfono',
    mobilePhone: 'Teléfono Celular',
    email: 'Correo Electrónico',
    relationship: 'Parentesco / Relación',
    parentesco: 'Parentesco',
    address: 'Dirección',
    street: 'Calle y Número',
    colony: 'Colonia',
    city: 'Ciudad / Municipio',
    postalCode: 'Código Postal',
    zipCode: 'Código Postal',
    occupation: 'Ocupación / Profesión',
    workplace: 'Lugar de Trabajo',
    docType: 'Tipo de Documento',
    docNumber: 'Número de Documento',
    verified: 'Verificado',
    score: 'Puntuación',
    title: 'Título / Cargo',
    notes: 'Notas Adicionales',
    date: 'Fecha',
    time: 'Hora',
    accepted: 'Consentimiento Aceptado'
  };
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^(field |q |fld )/i, '')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
};

// Copyable Read-Only Input Component
const CopyableReadOnlyInput: React.FC<{
  value: string | number;
  label?: string;
  multiline?: boolean;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}> = ({
  value,
  label,
  multiline = false,
  className = '',
  icon: Icon
}) => {
    const strVal = String(value ?? '').trim();
    if (!strVal) return <span className="text-muted-foreground italic text-[11px]">Sin dato</span>;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(strVal);
          toast.success(label ? `"${label}" copiado` : 'Copiado al portapapeles');
        }}
        className={`group relative bg-white border border-forest/20 hover:border-forest/40 active:scale-[0.99] rounded-xl px-3.5 py-2.5 transition-all flex justify-between gap-2.5 shadow-2xs cursor-pointer select-none hover:bg-forest/[0.02] ${multiline ? 'items-start min-h-[64px]' : 'items-center'
          } ${className}`}
        title="Toca para copiar"
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {Icon && <Icon className="w-3.5 h-3.5 text-forest/70 shrink-0" />}
          <span className={`text-slate-800 font-medium text-xs leading-relaxed select-all ${multiline ? 'whitespace-pre-wrap break-words' : 'truncate'
            }`}>
            {strVal}
          </span>
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="p-1 rounded-lg text-forest/50 group-hover:text-forest group-hover:bg-forest/10 transition-colors shrink-0 flex items-center justify-center pointer-events-none"
          title="Copiar"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

// Individual Submission Card Component
const DossierSubmissionCard: React.FC<{
  sub: FormSubmissionItem;
  template?: AdmissionFormTemplateItem | null;
  onPreviewPhoto: (photo: { url: string; title: string }) => void;
}> = ({ sub, template, onPreviewPhoto }) => {
  const [showCurpMetaMap, setShowCurpMetaMap] = useState<Record<string, boolean>>({});
  const [showEventMetaMap, setShowEventMetaMap] = useState<Record<string, boolean>>({});
  const [showKycMetaMap, setShowKycMetaMap] = useState<Record<string, boolean>>({});

  // Resolve schema sections
  let schemaSections: FormSectionItem[] = [];
  if (template?.schema) {
    if (Array.isArray(template.schema)) {
      schemaSections = template.schema;
    } else if (typeof template.schema === 'object' && (template.schema as any).sections) {
      schemaSections = (template.schema as any).sections;
    } else if (typeof template.schema === 'string') {
      try {
        const parsed = JSON.parse(template.schema);
        schemaSections = Array.isArray(parsed) ? parsed : (parsed.sections || []);
      } catch (e) {
        schemaSections = [];
      }
    }
  }

  const allFlatQuestions: FormFieldItem[] = schemaSections.flatMap(s => s.fields || []);
  const currentFieldIdSet = new Set(allFlatQuestions.map(q => q.id));

  // Identify legacy or unstructured fields that aren't in schema
  const legacyAnswers = Object.entries(sub.data || {}).filter(([k, v]) => {
    return !currentFieldIdSet.has(k) &&
      !k.endsWith('_curp_metadata') &&
      !k.endsWith('_curp_details') &&
      k !== 'signature' &&
      k !== 'files' &&
      v !== undefined &&
      v !== null &&
      v !== '';
  });

  // Render field value
  const renderFieldValue = (ans: any, field?: Partial<FormFieldItem>) => {
    const isSignature = field?.type === 'signature' || (
      typeof ans === 'string' && (ans.startsWith('data:image/') || ans.includes(';base64,'))
    );

    if (ans === undefined || ans === null || ans === '') {
      return <span className="text-muted-foreground italic text-[11px]">Sin respuesta</span>;
    }

    // Signature Canvas Preview
    if (isSignature && typeof ans === 'string') {
      return (
        <div className="mt-1 space-y-2">
          <div className="p-3.5 bg-white rounded-2xl border border-forest/25 shadow-2xs relative overflow-hidden max-w-md">
            <div className="text-[10px] font-mono text-slate-400 pb-1.5 border-b border-dashed border-slate-200 flex items-center justify-between select-none">
              <span className="flex items-center gap-1"><PenTool className="w-3 h-3 text-forest" /> Firma Digital Capturada</span>
              <span className="text-emerald-700 font-semibold">✓ Verificada</span>
            </div>
            <div className="py-2.5 flex items-center justify-center bg-slate-50/70 rounded-xl mt-2 border border-slate-100">
              <img
                src={ans}
                alt={field?.label ? `Firma para ${field.label}` : 'Firma Digital'}
                className="max-h-28 object-contain drop-shadow-2xs"
              />
            </div>
          </div>
        </div>
      );
    }

    // Boolean Check
    if (typeof ans === 'boolean') {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs ${ans ? 'bg-forest/10 text-forest border border-forest/30' : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}>
          {ans ? <Check className="w-3.5 h-3.5 stroke-[3] text-forest" /> : <X className="w-3.5 h-3.5 stroke-[3] text-rose-600" />}
          <span>{ans ? 'Sí (Confirmado)' : 'No'}</span>
        </span>
      );
    }

    // Array of string/items (Multi Choice or Multi Select)
    if (Array.isArray(ans)) {
      if (ans.length === 0) return <span className="text-muted-foreground italic text-[11px]">Sin selección</span>;
      return (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {ans.map((item, i) => {
            let label = typeof item === 'object' ? JSON.stringify(item) : String(item);
            if (field?.type === 'poll') {
              const opt = field.pollConfig?.options?.find(o => o.id === item);
              if (opt) label = opt.title;
            }
            return (
              <span key={i} className="px-3 py-1 rounded-xl bg-forest/10 text-forest font-semibold text-xs border border-forest/20 flex items-center gap-1 shadow-2xs">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>{label}</span>
              </span>
            );
          })}
        </div>
      );
    }

    // CURP Field
    if (field?.type === 'curp' || (typeof ans === 'string' && /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i.test(ans.trim())) || (typeof ans === 'object' && ans !== null && ans.curp)) {
      const curpStr = typeof ans === 'string' ? ans.trim().toUpperCase() : (ans?.curp || '').toUpperCase();
      const metaObj = (typeof ans === 'object' && ans !== null ? ans : {});
      const metaField = (sub.data as any)?.[`${field?.id}_curp_metadata`] || {};
      const metaDetails = (sub.data as any)?.[`${field?.id}_curp_details`] || {};
      const metadata = { ...metaField, ...metaDetails, ...metaObj };
      const decoded = curpStr ? decodeCurp(curpStr) : null;
      const isRenapoVerified = Boolean(metadata.verifiedByRenapo || metadata.status === 'SUCCESS' || (metadata.nombre && metadata.apellidoPaterno));

      const nombreOficial = [metadata.nombre, metadata.apellidoPaterno, metadata.apellidoMaterno].filter(Boolean).join(' ');
      const fechaNac = metadata.fechaNacimiento || decoded?.fechaNacimiento || '—';
      const edad = metadata.edad ?? decoded?.edad;
      const sexo = metadata.sexo || (decoded?.sexo === 'HOMBRE' ? 'Hombre (Masculino)' : decoded?.sexo === 'MUJER' ? 'Mujer (Femenino)' : '—');
      const estadoNac = metadata.estadoNacimiento || decoded?.estadoNacimiento || '—';
      const nacionalidad = metadata.nacionalidad || 'MEXICANA';
      const docProbatorio = metadata.docProbatorioData || metadata.documentoProbatorio;
      const pdfUrl = metadata.fileUrl || metadata.pdfUrl || (metadata.pdfBase64 ? `data:application/pdf;base64,${metadata.pdfBase64}` : null);
      const curpFieldId = field?.id || 'curp';

      return (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-forest/[0.04] via-white to-forest/[0.02] border border-forest/25 shadow-2xs space-y-3.5">
          {/* CURP Hero Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-forest/15">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-forest tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                <span>Clave Única de Registro de Población (CURP)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-forest tracking-wider select-all">
                  {curpStr || '—'}
                </span>
                {curpStr && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(curpStr);
                      toast.success('CURP copiado al portapapeles');
                    }}
                    className="p-1 rounded-md text-forest hover:bg-forest/10 transition-colors cursor-pointer"
                    title="Copiar CURP"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:ml-auto sm:justify-end">
              {isRenapoVerified ? (
                <span className="px-2.5 py-1 rounded-xl bg-forest text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs border border-forest/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verificado RENAPO</span>
                </span>
              ) : decoded?.isValidFormat ? (
                <span className="px-2.5 py-1 rounded-xl bg-forest/10 text-forest border border-forest/30 font-bold text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Algoritmo Oficial Válido</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sin Validación Oficial</span>
                </span>
              )}
            </div>
          </div>

          {/* Grid of Verified Demographic Data with ReadOnly Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {nombreOficial && (
              <div className="sm:col-span-2 space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Nombre Oficial Verificado</span>
                <CopyableReadOnlyInput value={nombreOficial} label="Nombre Oficial" icon={User} />
              </div>
            )}
            <div className="space-y-1">
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Fecha de Nacimiento</span>
              <CopyableReadOnlyInput value={`${fechaNac}${edad !== undefined ? ` (${edad} años)` : ''}`} label="Fecha de Nacimiento" icon={Calendar} />
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Sexo / Género</span>
              <CopyableReadOnlyInput value={sexo} label="Sexo" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Lugar de Nacimiento</span>
              <CopyableReadOnlyInput value={`${estadoNac} • Nacionalidad: ${nacionalidad}`} label="Lugar de Nacimiento" icon={MapPin} />
            </div>

            {docProbatorio && (
              <div className="sm:col-span-2 space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">Documento Probatorio</span>
                <CopyableReadOnlyInput value={docProbatorio} label="Documento Probatorio" icon={FileText} />
              </div>
            )}
          </div>

          {/* Bottom Actions: Constancia PDF & Metadatos (Icon-only, right-aligned) */}
          <div className="pt-2.5 border-t border-forest/15 flex items-center justify-end gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                download={`CURP_${curpStr}.pdf`}
                className="p-2 rounded-xl bg-forest hover:bg-forest/90 text-white transition-colors flex items-center justify-center shadow-2xs cursor-pointer"
                title="Descargar Constancia PDF"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowCurpMetaMap(prev => ({ ...prev, [curpFieldId]: !prev[curpFieldId] }))}
              className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${showCurpMetaMap[curpFieldId]
                  ? 'bg-forest text-white border-forest shadow-2xs'
                  : 'bg-white text-forest border-forest/30 hover:bg-forest/5 shadow-2xs'
                }`}
              title={showCurpMetaMap[curpFieldId] ? "Ocultar metadatos (JSON)" : "Ver metadatos (JSON)"}
            >
              <Code2 className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsible Technical Metadata JSON */}
          {showCurpMetaMap[curpFieldId] && (
            <div className="pt-2 border-t border-forest/15 animate-in fade-in">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-forest font-bold uppercase">Metadatos RENAPO Raw (JSON):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
                    toast.success('Metadatos copiados al portapapeles');
                  }}
                  className="text-[10px] font-bold text-forest hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copiar JSON
                </button>
              </div>
              <pre className="p-3 bg-forest text-emerald-200 rounded-xl text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed border border-forest/30">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    }

    // KYC Identity Verification / Document Capture
    if (
      field?.type === 'identity_verification' ||
      field?.type === 'document_capture' ||
      field?.type === 'selfie_liveness' ||
      (typeof ans === 'object' && ans !== null && (ans.frontUrl || ans.backUrl || ans.selfieUrl || ans.docType || ans.document || ans.selfie || ans.verification || ans.matchScore))
    ) {
      const kyc = typeof ans === 'object' && ans !== null ? ans : {};
      const kycFieldId = field?.id || 'kyc';
      const showKycMeta = Boolean(showKycMetaMap[kycFieldId]);

      const getImgSrc = (item: any): string | null => {
        if (!item) return null;
        if (typeof item === 'string') return item.trim() || null;
        if (typeof item === 'object') {
          return item.fileUrl || item.url || item.base64 || item.cropUrl || item.dataUrl || null;
        }
        return null;
      };

      const frontSrc =
        getImgSrc(kyc.front) ||
        getImgSrc(kyc.frontUrl) ||
        getImgSrc(kyc.frontImage) ||
        getImgSrc(kyc.document?.front) ||
        getImgSrc(kyc.document?.frontUrl) ||
        getImgSrc(kyc.document?.frontImage) ||
        getImgSrc(kyc.documentFrontUrl) ||
        getImgSrc(kyc.docFrontUrl);

      const backSrc =
        getImgSrc(kyc.back) ||
        getImgSrc(kyc.backUrl) ||
        getImgSrc(kyc.backImage) ||
        getImgSrc(kyc.document?.back) ||
        getImgSrc(kyc.document?.backUrl) ||
        getImgSrc(kyc.document?.backImage) ||
        getImgSrc(kyc.documentBackUrl) ||
        getImgSrc(kyc.docBackUrl);

      const cropSrc =
        getImgSrc(kyc.faceCropUrl) ||
        getImgSrc(kyc.faceCropImage) ||
        getImgSrc(kyc.faceCrop) ||
        getImgSrc(kyc.document?.faceCropUrl) ||
        getImgSrc(kyc.document?.faceCrop) ||
        getImgSrc(kyc.cropUrl);

      const selfieStep1Src =
        getImgSrc(kyc.selfie?.step1) ||
        getImgSrc(kyc.step1) ||
        getImgSrc(kyc.selfieUrl) ||
        getImgSrc(kyc.selfieImage) ||
        getImgSrc(kyc.selfie);

      const selfieStep2Src =
        getImgSrc(kyc.selfie?.step2) ||
        getImgSrc(kyc.step2);

      const videoClipSrc =
        getImgSrc(kyc.selfie?.videoClip) ||
        getImgSrc(kyc.videoClip);

      const rawDocType = kyc.docType || kyc.document?.docType || kyc.selectedType || kyc.document?.selectedType || 'id_card';
      const docTypeLabel = rawDocType === 'passport' ? 'Pasaporte' : rawDocType === 'driver_license' ? 'Licencia de Conducir' : 'Identificación Oficial';

      const matchScore = kyc.verification?.matchScore ?? kyc.matchScore;
      const isMatch = kyc.verification?.isMatch ?? kyc.isMatch ?? (kyc.verified !== false && matchScore !== undefined ? matchScore >= 80 : undefined);
      const details = kyc.verification?.details || kyc.details || kyc.message;
      const verifiedAt = kyc.verification?.verifiedAt || kyc.verifiedAt;
      const ocr =
        kyc.ocrData ||
        kyc.verification?.ocrData ||
        kyc.document?.ocrData ||
        kyc.extractedData ||
        kyc.document?.extractedData ||
        kyc.verification?.extractedData ||
        kyc.ocr;

      const signatureCropSrc =
        getImgSrc(ocr?.signature_assessment?.cropped_signature_base64) ||
        getImgSrc(ocr?.signature_assessment?.signature_crop_url) ||
        getImgSrc(ocr?.signature_assessment?.holder_signature?.cropped_signature_base64) ||
        getImgSrc(ocr?.signature_assessment?.holder_signature?.signature_crop_url) ||
        getImgSrc(ocr?.signatureAssessment?.cropped_signature_base64) ||
        getImgSrc(ocr?.signatureAssessment?.signature_crop_url) ||
        getImgSrc(ocr?.signatureCropUrl) ||
        getImgSrc(ocr?.signature_crop_url) ||
        getImgSrc(ocr?.cropped_signature_base64) ||
        getImgSrc(kyc.signatureCropUrl);

      const authoritySignatureCropSrc =
        getImgSrc(ocr?.signature_assessment?.authority_signature_crop_url) ||
        getImgSrc(ocr?.signature_assessment?.authority_signature?.cropped_signature_base64) ||
        getImgSrc(ocr?.signature_assessment?.authority_signature?.signature_crop_url) ||
        getImgSrc(ocr?.signatureAssessment?.authority_signature_crop_url) ||
        getImgSrc(ocr?.authoritySignatureCropUrl) ||
        getImgSrc(ocr?.authority_signature_crop_url);

      const ocrFullName = ocr?.fullName || ocr?.full_name || [ocr?.first_name, ocr?.first_surname, ocr?.second_surname].filter(Boolean).join(' ').trim() || null;
      const ocrBirthDate = ocr?.birthDate || ocr?.date_of_birth || ocr?.birth_date || null;
      const ocrGender = ocr?.gender === 'M' || ocr?.sex === 'male' || ocr?.sex_code === 'H' ? 'Masculino (M)' : ocr?.gender === 'F' || ocr?.sex === 'female' || ocr?.sex_code === 'M' ? 'Femenino (F)' : (ocr?.gender || ocr?.sex || ocr?.sex_code || null);
      const ocrCurp = ocr?.curp || null;
      const ocrDocNum = ocr?.documentNumber || ocr?.document_number || ocr?.passport_number || ocr?.license_number || ocr?.registration_number || ocr?.ocr_code || null;
      const ocrElectorKey = ocr?.electorKey || ocr?.voter_key || null;
      const ocrNationality = ocr?.nationality || ocr?.country || null;
      const ocrAuthority = ocr?.issuingAuthority || ocr?.issuing_authority || null;
      const ocrExpiration = ocr?.expirationDate || ocr?.expiration_date || ocr?.valid_until || null;
      const ocrConfidence = ocr?.confidenceScore ?? ocr?.confidence_score;
      const ocrQuality = ocr?.quality_assessment || ocr?.qualityAssessment;
      const detectedCodes = ocr?.barcode_assessment?.codes || ocr?.barcodeAssessment?.codes || ocr?.qr_codes || ocr?.qrCodes || kyc?.qr_codes || kyc?.barcode_assessment?.codes || [];
      const qrVerified = ocr?.qr_verified || ocr?.qrVerified || kyc?.qr_verified;
      const qrMatchedFields = ocr?.qr_matched_fields || ocr?.qrMatchedFields || kyc?.qr_matched_fields || [];

      return (
        <div className="p-4 rounded-2xl bg-white border border-forest/25 shadow-2xs space-y-3.5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-forest/15">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck className="w-4 h-4 text-forest" />
              <span className="font-bold text-forest text-xs">
                Verificación de Identidad ({docTypeLabel})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
              {isMatch === true ? (
                <span className="px-2.5 py-1 rounded-xl bg-forest text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs border border-forest/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Face Match Aprobado{matchScore !== undefined ? ` (${matchScore}%)` : ''}</span>
                </span>
              ) : isMatch === false ? (
                <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Coincidencia Insuficiente{matchScore !== undefined ? ` (${matchScore}%)` : ''}</span>
                </span>
              ) : kyc.verified !== false ? (
                <span className="px-2.5 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-bold border border-forest/25 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Verificado
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/25 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Pendiente
                </span>
              )}
            </div>
          </div>

          {/* Biometric Face Match & Details Banner */}
          {(matchScore !== undefined || details) && (
            <div className="p-3 rounded-xl bg-forest/[0.04] border border-forest/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-forest tracking-wider flex items-center gap-1">
                    <ScanFace className="w-3.5 h-3.5 text-forest" />
                    <span>Cotejo Facial (Face Match):</span>
                  </span>
                  {matchScore !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black font-mono ${isMatch !== false
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                      }`}>
                      {matchScore}% de Coincidencia
                    </span>
                  )}
                </div>
                {details && (
                  <p className="text-xs text-forest/90 font-medium">
                    {details}
                  </p>
                )}
              </div>
              {verifiedAt && (
                <div className="text-[10px] text-muted-foreground whitespace-nowrap self-start sm:self-center font-mono">
                  {new Date(verifiedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              )}
            </div>
          )}

          {/* Previews Grid: Document, Autocrop, Selfies, Video Clip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {frontSrc && (
              <div className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-forest/20 flex flex-col">
                <span className="text-[10px] font-bold text-forest block truncate">Frente del Documento</span>
                <div
                  className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-forest/20 cursor-pointer group flex-1"
                  onClick={() => onPreviewPhoto({ url: frontSrc, title: `${field?.label || 'Documento'} - Frente` })}
                >
                  <img src={frontSrc} alt="Frente" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ampliar
                  </div>
                </div>
              </div>
            )}

            {backSrc && (
              <div className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-forest/20 flex flex-col">
                <span className="text-[10px] font-bold text-forest block truncate">Reverso del Documento</span>
                <div
                  className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-forest/20 cursor-pointer group flex-1"
                  onClick={() => onPreviewPhoto({ url: backSrc, title: `${field?.label || 'Documento'} - Reverso` })}
                >
                  <img src={backSrc} alt="Reverso" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ampliar
                  </div>
                </div>
              </div>
            )}

            {cropSrc && (
              <div className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-forest/20 flex flex-col">
                <span className="text-[10px] font-bold text-forest block truncate">Rostro Extraído (ID)</span>
                <div
                  className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-forest/20 cursor-pointer group mx-auto w-full flex-1"
                  onClick={() => onPreviewPhoto({ url: cropSrc, title: `${field?.label || 'Documento'} - Rostro Extraído (Autocrop)` })}
                >
                  <img src={cropSrc} alt="Rostro Documento" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ampliar
                  </div>
                </div>
              </div>
            )}

            {signatureCropSrc && (
              <div className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-forest/20 flex flex-col">
                <span className="text-[10px] font-bold text-indigo-700 block truncate flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-indigo-600" /> Firma Titular (ID)
                </span>
                <div
                  className="relative aspect-video rounded-lg overflow-hidden bg-white border border-indigo-200/80 cursor-pointer group mx-auto w-full flex-1 flex items-center justify-center p-1"
                  onClick={() => onPreviewPhoto({ url: signatureCropSrc, title: `${field?.label || 'Documento'} - Firma del Titular / Postulante (Autocrop)` })}
                >
                  <img src={signatureCropSrc} alt="Firma Titular" className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ampliar
                  </div>
                </div>
              </div>
            )}

            {authoritySignatureCropSrc && (
              <div className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-forest/20 flex flex-col">
                <span className="text-[10px] font-bold text-slate-700 block truncate flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-slate-500" /> Firma Autoridad (ID)
                </span>
                <div
                  className="relative aspect-video rounded-lg overflow-hidden bg-white border border-slate-200 cursor-pointer group mx-auto w-full flex-1 flex items-center justify-center p-1"
                  onClick={() => onPreviewPhoto({ url: authoritySignatureCropSrc, title: `${field?.label || 'Documento'} - Firma de la Autoridad Emisora (Autocrop)` })}
                >
                  <img src={authoritySignatureCropSrc} alt="Firma Autoridad" className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ampliar
                  </div>
                </div>
              </div>
            )}

            {selfieStep1Src && (
              <div className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-forest/20 flex flex-col">
                <span className="text-[10px] font-bold text-forest block truncate">Selfie (Foto Frontal)</span>
                <div
                  className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-forest/20 cursor-pointer group mx-auto w-full flex-1"
                  onClick={() => onPreviewPhoto({ url: selfieStep1Src, title: `${field?.label || 'Selfie'} - Foto Frontal` })}
                >
                  <img src={selfieStep1Src} alt="Selfie Frontal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ampliar
                  </div>
                </div>
              </div>
            )}

            {selfieStep2Src && (
              <div className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-forest/20 flex flex-col">
                <span className="text-[10px] font-bold text-forest block truncate">Selfie (Sonrisa / Liveness)</span>
                <div
                  className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-forest/20 cursor-pointer group mx-auto w-full flex-1"
                  onClick={() => onPreviewPhoto({ url: selfieStep2Src, title: `${field?.label || 'Selfie'} - Prueba de Sonrisa` })}
                >
                  <img src={selfieStep2Src} alt="Selfie Sonrisa" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ampliar
                  </div>
                </div>
              </div>
            )}

            {videoClipSrc && (
              <div className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-forest/20 flex flex-col">
                <span className="text-[10px] font-bold text-forest block truncate">Video Prueba de Vida</span>
                <div
                  className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-forest/20 cursor-pointer group mx-auto w-full flex-1 flex items-center justify-center"
                  onClick={() => onPreviewPhoto({ url: videoClipSrc, title: `${field?.label || 'Video'} - Prueba de Vida Anti-Spoofing`, isVideo: true })}
                >
                  <video src={videoClipSrc} className="w-full h-full object-cover opacity-80" muted playsInline />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold gap-1 group-hover:bg-black/60 transition-colors">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Detected 2D Barcodes & QR Codes Thumbnail Cards */}
            {detectedCodes.map((code: any, cIdx: number) => {
              const codeSrc = code.cropped_code_url || code.cropped_code_base64;
              if (!codeSrc) return null;
              const formatLabel = code.format === 'QR_CODE' ? 'Código QR' : code.format === 'PDF_417' ? 'Código PDF417' : 'Código 2D';
              const sideLabel = code.side === 'back' ? 'Reverso' : 'Frente';

              return (
                <div key={`qr-${cIdx}`} className="space-y-1.5 bg-forest/[0.02] p-2.5 rounded-xl border border-emerald-500/20 flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-800 block truncate flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-emerald-600" /> {formatLabel} ({sideLabel})
                  </span>
                  <div
                    className="relative aspect-square rounded-lg overflow-hidden bg-white border border-emerald-200 cursor-pointer group mx-auto w-full flex-1 flex items-center justify-center p-1"
                    onClick={() => onPreviewPhoto({ 
                      url: codeSrc, 
                      title: `${formatLabel} (${sideLabel}) - ${code.data || 'Decodificado'}` 
                    })}
                  >
                    <img src={codeSrc} alt={formatLabel} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                      <Eye className="w-3.5 h-3.5" /> Ampliar
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* OpenAI Document OCR Extracted Data */}
          {ocr && (
            <div className="p-3.5 rounded-xl bg-forest/[0.03] border border-forest/20 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-forest/15">
                <div className="flex items-center gap-1.5 text-forest font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Datos Extraídos del Documento</span>
                </div>
                {ocrConfidence !== undefined && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${ocrConfidence >= 80
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : ocrConfidence >= 60
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}>
                    Confianza: {ocrConfidence}% ({ocrConfidence >= 80 ? 'Alta' : ocrConfidence >= 60 ? 'Media' : 'Baja'})
                  </span>
                )}
              </div>

              {/* Manual Review Alert Banner */}
              {(ocr.requires_manual_review || ocr.requiresManualReview || (ocrConfidence !== undefined && ocrConfidence < 80)) && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Se sugiere validación / captura manual:</span>
                  </div>
                  {Array.isArray(ocr.review_reasons || ocr.reviewReasons) && (ocr.review_reasons || ocr.reviewReasons).length > 0 ? (
                    <ul className="list-disc list-inside text-[11px] text-amber-800/90 pl-1 space-y-0.5">
                      {(ocr.review_reasons || ocr.reviewReasons).map((reason: string, idx: number) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-amber-800/90">
                      La legibilidad o calidad del documento es reducida ({ocrConfidence}%). Verifica los campos manualmente.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                {ocrFullName && (
                  <div className="col-span-2 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Nombre Completo</span>
                    <span className="font-semibold text-foreground">{ocrFullName}</span>
                  </div>
                )}
                {ocrBirthDate && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Fecha Nacimiento</span>
                    <span className="font-semibold text-foreground font-mono">{ocrBirthDate}</span>
                  </div>
                )}
                {ocrGender && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Sexo</span>
                    <span className="font-semibold text-foreground">{ocrGender}</span>
                  </div>
                )}
                {ocrCurp && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">CURP</span>
                    <span className="font-semibold text-foreground font-mono">{ocrCurp}</span>
                  </div>
                )}
                {ocrDocNum && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Nº Documento / Folio</span>
                    <span className="font-semibold text-foreground font-mono">{ocrDocNum}</span>
                  </div>
                )}
                {ocrElectorKey && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Clave Elector</span>
                    <span className="font-semibold text-foreground font-mono">{ocrElectorKey}</span>
                  </div>
                )}
                {ocrNationality && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Nacionalidad</span>
                    <span className="font-semibold text-foreground">{ocrNationality}</span>
                  </div>
                )}
                {ocrAuthority && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Autoridad Emisora</span>
                    <span className="font-semibold text-foreground">{ocrAuthority}</span>
                  </div>
                )}
                {ocrExpiration && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Vigencia</span>
                    <span className="font-semibold text-foreground font-mono">{ocrExpiration}</span>
                  </div>
                )}
                {ocr.address && (
                  <div className="col-span-2 sm:col-span-3 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Domicilio</span>
                    <span className="font-medium text-foreground text-[11px] leading-tight">
                      {typeof ocr.address === 'object' && ocr.address !== null
                        ? [ocr.address.street_address, ocr.address.postal_code ? `C.P. ${ocr.address.postal_code}` : null, ocr.address.municipality, ocr.address.state].filter(Boolean).join(', ')
                        : String(ocr.address)}
                    </span>
                  </div>
                )}
              </div>

              {/* Document Quality Assessment */}
              {ocr.quality_assessment && (
                <div className="pt-2 border-t border-forest/10 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] uppercase font-bold text-forest flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Diagnóstico de Calidad y Estado Físico:
                    </span>
                    <div className="flex items-center gap-1">
                      {ocr.quality_assessment.condition && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ocr.quality_assessment.condition === 'good'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ocr.quality_assessment.condition === 'worn'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                          {ocr.quality_assessment.condition === 'good' ? 'Buen estado' : ocr.quality_assessment.condition === 'worn' ? 'Desgastado' : 'Deteriorado'}
                        </span>
                      )}
                      {ocr.quality_assessment.overall_quality && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ocr.quality_assessment.overall_quality === 'excellent' || ocr.quality_assessment.overall_quality === 'acceptable'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                          {ocr.quality_assessment.overall_quality === 'excellent' ? 'Excelente' : ocr.quality_assessment.overall_quality === 'acceptable' ? 'Aceptable' : 'Baja Calidad'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quality Issues Badges */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {ocr.quality_assessment.has_glare && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 text-[9.5px] font-medium border border-amber-300">
                        ⚡ Reflejo de Luz / Flash
                      </span>
                    )}
                    {ocr.quality_assessment.has_heavy_shadows && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[9.5px] font-medium border border-slate-300">
                        🌑 Sombras Excesivas
                      </span>
                    )}
                    {ocr.quality_assessment.is_blurry && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 text-[9.5px] font-medium border border-amber-300">
                        🔍 Imagen Borrosa / Baja Nitidez
                      </span>
                    )}
                    {ocr.quality_assessment.has_occlusions && (
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[9.5px] font-medium border border-red-300">
                        ✋ Dedos u Objetos Obstruyendo
                      </span>
                    )}
                    {ocr.quality_assessment.is_cropped && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 text-[9.5px] font-medium border border-amber-300">
                        ✂️ Bordes Recortados
                      </span>
                    )}
                    {ocr.quality_assessment.is_photocopy_or_screen && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9.5px] font-medium border border-purple-300">
                        🖥️ Fotocopia / Pantalla Digital
                      </span>
                    )}
                  </div>

                  {ocr.quality_assessment.quality_summary && (
                    <p className="text-[10.5px] text-muted-foreground italic">
                      "{ocr.quality_assessment.quality_summary}"
                    </p>
                  )}
                </div>
              )}

              {/* Handwritten Signature Assessment in Document */}
              {ocr.signature_assessment && (
                <div className="pt-2 border-t border-forest/10 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] uppercase font-bold text-forest flex items-center gap-1">
                      <PenTool className="w-3 h-3 text-indigo-600" />
                      Firma Manuscrita del Titular:
                    </span>
                    <div className="flex items-center gap-1">
                      {ocr.signature_assessment.has_handwritten_signature ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Firma del Titular Presente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Sin Firma del Titular
                        </span>
                      )}
                      {ocr.signature_assessment.multiple_signatures_detected && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          2 Firmas Detectadas
                        </span>
                      )}
                      {ocr.signature_assessment.signature_legibility && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-forest/5 text-forest border border-forest/15">
                          {ocr.signature_assessment.signature_legibility === 'clear' ? 'Legible' : ocr.signature_assessment.signature_legibility === 'partial' ? 'Parcial' : ocr.signature_assessment.signature_legibility}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Authority Signature Note if present */}
                  {ocr.signature_assessment.authority_signature?.detected && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-[10.5px]">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="font-bold">Firma de Autoridad:</span>
                        <span>{ocr.signature_assessment.authority_signature.title_or_official || 'Funcionario Emisor'} (Diferenciada de la del titular)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">Oficial ✓</span>
                    </div>
                  )}

                  {ocr.signature_assessment.signature_description && (
                    <p className="text-[10.5px] text-muted-foreground italic">
                      "{ocr.signature_assessment.signature_description}"
                    </p>
                  )}

                  {ocr.signature_assessment.stroke_match_score !== null && ocr.signature_assessment.stroke_match_score !== undefined && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] font-semibold text-slate-600">Similitud de trazo con firma digital:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {ocr.signature_assessment.stroke_match_score}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 2D Barcode & QR Code Forensic Decoding Section */}
              {detectedCodes.length > 0 && (
                <div className="pt-2.5 border-t border-forest/10 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] uppercase font-bold text-forest flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      Códigos Bidimensionales y QR Detectados ({detectedCodes.length}):
                    </span>
                    {qrVerified && (
                      <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Coincidencia QR vs OCR ({qrMatchedFields.join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {detectedCodes.map((code: any, cIdx: number) => (
                      <div key={cIdx} className="bg-forest/[0.02] p-2.5 rounded-xl border border-emerald-500/20 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span className="font-bold text-emerald-800">{code.format} ({code.side === 'back' ? 'Reverso' : 'Frente'})</span>
                          {code.parsed?.curp && <span className="text-emerald-700 font-bold font-mono">CURP: {code.parsed.curp}</span>}
                          {code.parsed?.electorKey && <span className="text-emerald-700 font-bold font-mono">Clave: {code.parsed.electorKey}</span>}
                        </div>
                        <p className="text-slate-700 font-mono text-[10px] break-all bg-white p-2 rounded-lg border border-emerald-500/10 select-all shadow-2xs">
                          {code.data}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions: Metadatos (Icon-only, right-aligned) */}
          <div className="pt-2.5 border-t border-forest/15 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowKycMetaMap(prev => ({ ...prev, [kycFieldId]: !prev[kycFieldId] }))}
              className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${showKycMeta
                  ? 'bg-forest text-white border-forest shadow-2xs'
                  : 'bg-white text-forest border-forest/30 hover:bg-forest/5 shadow-2xs'
                }`}
              title={showKycMeta ? "Ocultar metadatos (JSON)" : "Ver metadatos (JSON)"}
            >
              <Code2 className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsible Technical Metadata JSON */}
          {showKycMeta && (
            <div className="pt-2 border-t border-forest/15 animate-in fade-in space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-forest font-bold uppercase">Metadatos de Identidad (JSON):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(kyc, null, 2));
                    toast.success('Metadatos de verificación copiados al portapapeles');
                  }}
                  className="text-[10px] font-bold text-forest hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copiar JSON
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
                {JSON.stringify(kyc, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    }

    // Schedule / Appointment Event
    if (field?.type === 'schedule_event' || field?.type === 'booking' || field?.type === 'schedule' || (typeof ans === 'object' && ans !== null && (ans.date || ans.startTime || ans.slotId || ans.eventId))) {
      const bk = typeof ans === 'object' && ans !== null ? ans : {};
      const eventFieldId = field?.id || 'event';
      const showMeta = Boolean(showEventMetaMap[eventFieldId]);

      return (
        <div className="p-3.5 bg-white rounded-2xl border border-forest/25 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-2 font-bold text-forest text-xs truncate">
              <Calendar className="w-4 h-4 text-forest shrink-0" />
              <span className="truncate">{bk.title || bk.eventName || 'Cita / Evento Agendado'}</span>
            </div>
            {bk.duration && <span className="text-[10px] bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-bold border border-forest/20 shrink-0">{bk.duration} min</span>}
          </div>

          {(bk.formattedDate || bk.date || bk.startTime || bk.location || bk.mode || bk.attendeeName) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t border-forest/15">
              {(bk.formattedDate || bk.date) && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Fecha Agendada</span>
                  <CopyableReadOnlyInput value={bk.formattedDate || bk.date} label="Fecha Agendada" icon={Calendar} />
                </div>
              )}
              {(bk.formattedTime || bk.startTime) && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Horario / Turno</span>
                  <CopyableReadOnlyInput value={bk.formattedTime || `${bk.startTime} - ${bk.endTime || ''}`} label="Horario" />
                </div>
              )}
              {bk.location && (
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Ubicación / Modalidad</span>
                  <CopyableReadOnlyInput value={bk.location} label="Ubicación" icon={MapPin} />
                </div>
              )}
              {bk.mode && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Modalidad</span>
                  <CopyableReadOnlyInput value={bk.mode === 'online' ? 'Virtual / En línea' : 'Presencial'} label="Modalidad" />
                </div>
              )}
              {bk.attendeeName && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Asistente</span>
                  <CopyableReadOnlyInput value={bk.attendeeName} label="Asistente" icon={User} />
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions: Metadatos (Icon-only, right-aligned) */}
          <div className="pt-2.5 border-t border-forest/15 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEventMetaMap(prev => ({ ...prev, [eventFieldId]: !prev[eventFieldId] }))}
              className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${showMeta
                  ? 'bg-forest text-white border-forest shadow-2xs'
                  : 'bg-white text-forest border-forest/30 hover:bg-forest/5 shadow-2xs'
                }`}
              title={showMeta ? "Ocultar metadatos (JSON)" : "Ver metadatos (JSON)"}
            >
              <Code2 className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsible Technical Metadata JSON */}
          {showMeta && (
            <div className="pt-2 border-t border-forest/15 animate-in fade-in space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-forest font-bold uppercase">Metadatos de la Cita (JSON):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(bk, null, 2));
                    toast.success('Metadatos de cita copiados al portapapeles');
                  }}
                  className="text-[10px] font-bold text-forest hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copiar JSON
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
                {JSON.stringify(bk, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    }

    // Terms and Consent
    if (field?.type === 'terms_consent') {
      const isAccepted = typeof ans === 'boolean' ? ans : Boolean(ans?.accepted ?? true);
      return (
        <div className="p-3.5 bg-forest/[0.04] rounded-2xl border border-forest/25 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 border border-forest/20">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <span className="font-bold text-xs text-forest block">Términos y Condiciones Aceptados</span>
              <span className="text-[10px] text-forest/80">Consentimiento legal registrado conforme a la política escolar.</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-forest text-white font-bold text-[10px] shrink-0 shadow-2xs">
            Firmado
          </span>
        </div>
      );
    }

    // File or Photo
    if (field?.type === 'file_upload' || field?.type === 'file' || field?.type === 'photo' || (typeof ans === 'object' && ans !== null && ans.fileUrl)) {
      const fileObj = typeof ans === 'object' && ans !== null ? ans : { fileUrl: ans, fileName: 'Archivo Adjunto' };
      const isImg = typeof fileObj.fileUrl === 'string' && (fileObj.fileUrl.startsWith('data:image/') || fileObj.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i));

      return (
        <div className="mt-1 space-y-2">
          {isImg ? (
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-forest/20 shadow-2xs max-w-md">
              <img
                src={fileObj.fileUrl}
                alt={fileObj.fileName || field?.label || 'Imagen'}
                className="w-16 h-16 object-cover rounded-xl border border-forest/15 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                onClick={() => onPreviewPhoto({ url: fileObj.fileUrl, title: fileObj.fileName || field?.label || 'Imagen' })}
              />
              <div className="space-y-1 truncate">
                <span className="text-xs font-bold text-forest block truncate">{fileObj.fileName || field?.label || 'Imagen Adjunta'}</span>
                <button
                  type="button"
                  onClick={() => onPreviewPhoto({ url: fileObj.fileUrl, title: fileObj.fileName || field?.label || 'Imagen' })}
                  className="text-[11px] text-forest font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Imagen en Grande</span>
                </button>
              </div>
            </div>
          ) : (
            <a
              href={fileObj.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 p-3 bg-white rounded-2xl border border-forest/20 text-xs font-bold text-forest hover:bg-forest/5 shadow-2xs transition-colors"
            >
              <FileText className="w-4 h-4 text-forest shrink-0" />
              <span className="truncate">{fileObj.fileName || 'Ver / Descargar Archivo'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
            </a>
          )}
        </div>
      );
    }

    // Composite / Contact / Fullname Structured Card
    if (typeof ans === 'object' && ans !== null) {
      const isPerson = Boolean(ans.firstName || ans.paternalLastName || ans.fullName || ans.phone || ans.email || ans.relationship);
      const fullName = [ans.firstName, ans.paternalLastName, ans.maternalLastName].filter(Boolean).join(' ') || ans.fullName;

      if (isPerson) {
        return (
          <div className="p-4 rounded-2xl bg-white border border-forest/25 shadow-2xs space-y-3">
            {fullName && (
              <div className="space-y-1 pb-2 border-b border-forest/15">
                <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Nombre Completo Registrado</span>
                <CopyableReadOnlyInput value={fullName} label="Nombre Completo" icon={User} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {ans.relationship && (
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Parentesco / Rol</span>
                  <CopyableReadOnlyInput value={ans.relationship} label="Parentesco" />
                </div>
              )}
              {ans.phone && (
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Teléfono Móvil</span>
                  <CopyableReadOnlyInput value={ans.phone} label="Teléfono" icon={Phone} />
                </div>
              )}
              {ans.email && (
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Correo Electrónico</span>
                  <CopyableReadOnlyInput value={ans.email} label="Correo" icon={Mail} />
                </div>
              )}
              {ans.address && (
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Dirección</span>
                  <CopyableReadOnlyInput value={typeof ans.address === 'object' ? JSON.stringify(ans.address) : ans.address} label="Dirección" icon={MapPin} multiline />
                </div>
              )}
              {ans.occupation && (
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Ocupación</span>
                  <CopyableReadOnlyInput value={ans.occupation} label="Ocupación" />
                </div>
              )}
              {ans.workplace && (
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Lugar de Trabajo</span>
                  <CopyableReadOnlyInput value={ans.workplace} label="Lugar de Trabajo" />
                </div>
              )}
            </div>

            {/* Extra subfields if present */}
            {Object.entries(ans).filter(([k]) => !['firstName', 'paternalLastName', 'maternalLastName', 'fullName', 'phone', 'email', 'relationship', 'address', 'occupation', 'workplace'].includes(k)).length > 0 && (
              <div className="pt-2 border-t border-forest/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(ans)
                  .filter(([k]) => !['firstName', 'paternalLastName', 'maternalLastName', 'fullName', 'phone', 'email', 'relationship', 'address', 'occupation', 'workplace'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">{humanizeKey(k)}</span>
                      <CopyableReadOnlyInput value={typeof v === 'object' ? JSON.stringify(v) : String(v)} label={humanizeKey(k)} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      }

      // Generic Structured Object Card (Never raw JSON dumps)
      return (
        <div className="p-3.5 bg-white rounded-2xl border border-forest/25 shadow-2xs space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {Object.entries(ans).map(([k, v]) => (
              <div key={k} className="space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                  {humanizeKey(k)}
                </span>
                {Array.isArray(v) ? (
                  <div className="flex flex-wrap gap-1">
                    {v.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-forest/10 text-forest text-[10px] font-semibold border border-forest/15">
                        {String(item)}
                      </span>
                    ))}
                  </div>
                ) : typeof v === 'boolean' ? (
                  <span className={v ? 'text-forest font-bold' : 'text-rose-600'}>
                    {v ? '✓ Sí' : '✕ No'}
                  </span>
                ) : typeof v === 'object' && v !== null ? (
                  <CopyableReadOnlyInput value={JSON.stringify(v)} label={humanizeKey(k)} />
                ) : (
                  <CopyableReadOnlyInput value={String(v)} label={humanizeKey(k)} />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Rich Text WYSIWYG
    if (field?.type === 'richtext' && typeof ans === 'string') {
      return (
        <div
          className="bg-white p-3.5 rounded-xl border border-forest/20 font-medium text-slate-800 prose prose-xs max-w-none leading-relaxed shadow-2xs"
          dangerouslySetInnerHTML={{ __html: ans }}
        />
      );
    }

    // Textarea / Multiline text
    if (field?.type === 'textarea' || (typeof ans === 'string' && ans.length > 80)) {
      return (
        <CopyableReadOnlyInput
          value={ans}
          label={field?.label}
          multiline
        />
      );
    }

    // Default clean read-only input with copy
    let displayValue = ans;
    if (typeof ans === 'string' && field?.type === 'poll') {
      const opt = field.pollConfig?.options?.find(o => o.id === ans);
      if (opt) displayValue = opt.title;
    }

    return (
      <CopyableReadOnlyInput
        value={displayValue}
        label={field?.label}
      />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-forest/20 p-5 shadow-xs space-y-4">
      {/* Submission Header without Phase tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-forest/10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
            <h5 className="text-base font-bold text-forest font-display">{template?.title || sub.title || 'Formulario de Admisión'}</h5>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
              {sub.status === 'APPROVED' ? 'Aprobado' : 'Completado'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Completado por: <strong className="font-semibold text-forest">{sub.filledByName || 'Tutor Registrado'}</strong>
            {sub.submittedAt && ` • ${new Date(sub.submittedAt).toLocaleDateString()} a las ${new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
      </div>

      {/* Schema Sections Breakdown */}
      {schemaSections.length > 0 ? (
        <div className="space-y-6 pt-1">
          {schemaSections.map((sec, sIdx) => {
            const secFields = sec.fields || [];
            if (secFields.length === 0) return null;

            return (
              <div key={sec.id || sIdx} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-forest pb-1 border-b border-forest/10">
                  <span className="w-5 h-5 rounded-lg bg-forest/10 text-forest flex items-center justify-center text-[10px] shrink-0 font-bold">
                    {sIdx + 1}
                  </span>
                  <span className="font-display text-sm">{sec.title}</span>
                </div>

                <div className="space-y-2.5">
                  {secFields.map((f) => {
                    const ans = sub.data?.[f.id];

                    return (
                      <div key={f.id} className="p-4 rounded-2xl bg-forest/[0.02] border border-forest/20 shadow-2xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 block text-xs leading-snug">
                            {f.label}
                          </span>
                          {f.required && (
                            <span className="px-2 py-0.5 rounded-md bg-forest/10 text-forest text-[10px] font-bold shrink-0">
                              Obligatorio
                            </span>
                          )}
                        </div>

                        {/* Answer Value Rendering */}
                        <div className="text-slate-800 font-medium">
                          {renderFieldValue(ans, f)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback for submissions without loaded template schema */
        <div className="space-y-2.5 pt-1">
          {Object.entries(sub.data || {})
            .filter(([k]) => !k.endsWith('_curp_metadata') && !k.endsWith('_curp_details') && k !== 'signature' && k !== 'files')
            .map(([key, val]) => {
              const label = (sub as any).fieldLabels?.[key] || humanizeKey(key);

              return (
                <div key={key} className="p-4 rounded-2xl bg-forest/[0.02] border border-forest/20 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 block text-xs leading-snug capitalize">
                      {label}
                    </span>
                  </div>

                  <div className="text-slate-800 font-medium">
                    {renderFieldValue(val, { id: key, label })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Additional / Legacy Fields (if any outside schema) */}
      {schemaSections.length > 0 && legacyAnswers.length > 0 && (
        <div className="space-y-3 pt-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-1 border-b border-forest/15">
            <span className="px-2 py-0.5 rounded-md bg-forest/10 text-forest text-[10px] font-bold">
              Campos Adicionales ({legacyAnswers.length})
            </span>
            <span className="font-display text-sm">Respuestas y Datos Adicionales</span>
          </div>

          <div className="space-y-2.5">
            {legacyAnswers.map(([key, val]) => {
              const label = (sub as any).fieldLabels?.[key] || humanizeKey(key);

              return (
                <div key={key} className="p-4 rounded-2xl bg-forest/[0.02] border border-forest/20 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 block text-xs leading-snug capitalize">
                      {label}
                    </span>
                  </div>

                  <div className="text-slate-800 font-medium">
                    {renderFieldValue(val, { id: key, label })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Uploaded Attachments */}
      {(sub.files || []).length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-forest/10">
          <div className="flex items-center gap-2 text-xs font-bold text-forest">
            <Upload className="w-4 h-4 text-forest" />
            <span className="font-display text-sm">Archivos Adjuntos ({sub.files?.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sub.files?.map((file, fIdx) => (
              <a
                key={fIdx}
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-white rounded-2xl border border-forest/20 hover:border-forest/40 transition-all flex items-center justify-between gap-2 shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-xs text-forest block truncate group-hover:text-forest-light">
                      {file.fileName}
                    </span>
                    {file.size && (
                      <span className="text-[10px] text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-forest opacity-50 group-hover:opacity-100 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Digital Signature */}
      {sub.signature && (
        <div className="pt-3 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-forest" />
              <span>Firma Digital Oficial Registrada</span>
            </span>
            <div className="bg-white p-2.5 rounded-xl border border-forest/20 inline-block shadow-2xs">
              <img src={sub.signature} alt="Firma Digital" className="h-12 object-contain" />
            </div>
          </div>

          <div className="text-left sm:text-right text-[10px] text-muted-foreground">
            <span className="text-emerald-700 font-bold flex items-center sm:justify-end gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> Suscrito electrónicamente
            </span>
            <span className="block font-mono text-[9px] opacity-70">
              {new Date(sub.submittedAt).toLocaleDateString()} a las {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdmissionDossierModal: React.FC<AdmissionDossierModalProps> = ({
  isOpen,
  onClose,
  applicationId
}) => {
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState<{
    application: AdmissionApplicationItem;
    submissions: FormSubmissionItem[];
    templates: AdmissionFormTemplateItem[];
  } | null>(null);

  // Photo Lightbox state
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
    isVideo?: boolean;
  } | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);

  useEffect(() => {
    if (isOpen && applicationId) {
      setLoading(true);
      getAdmissionApplicationDossier(applicationId)
        .then(data => setDossier(data))
        .catch(err => toast.error(err.message || 'Error al cargar expediente'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, applicationId]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!dossier) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Expediente_Admision_${dossier.application.child_name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Expediente descargado en formato JSON estructurado');
  };

  const app = dossier?.application;
  const submissions = dossier?.submissions || [];
  const templates = dossier?.templates || [];

  // Build unified list of forms
  const allDossierForms = (() => {
    const list: Array<{ template?: AdmissionFormTemplateItem; sub?: FormSubmissionItem }> = [];
    const usedSubIds = new Set<string>();

    // 1. Templates registered for the process
    templates.forEach(t => {
      const matchingSub = submissions.find(
        s => s.formTemplateId === t.id || (s as any).form_template_id === t.id || (s as any).template_id === t.id
      );
      if (matchingSub && matchingSub.data && Object.keys(matchingSub.data).length > 0) {
        if (matchingSub.id) usedSubIds.add(matchingSub.id);
        list.push({ template: t, sub: matchingSub });
      } else {
        list.push({ template: t });
      }
    });

    // 2. Extra submissions not linked to known template
    submissions.forEach(s => {
      if (s.id && !usedSubIds.has(s.id)) {
        list.push({ sub: s });
      }
    });

    return list;
  })();

  return createPortal(
    <div className="fixed inset-0 z-[9999999] w-screen h-screen bg-black/85 backdrop-blur-md flex flex-col p-2 sm:p-6 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white w-full h-full max-w-7xl mx-auto rounded-3xl border border-forest/20 shadow-2xl overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-forest text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display">Expediente Completo de Admisión</h2>
              <p className="text-xs text-white/70">
                Historial de formularios completados, firmas digitales y documentación adjunta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Imprimir / Guardar como PDF"
            >
              <Printer className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Descargar datos en JSON"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Cerrar Expediente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">
              Cargando expediente completo...
            </div>
          ) : !dossier || !app ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No se pudo cargar la información del expediente.
            </div>
          ) : (
            <>
              {/* Applicant Overview Card */}
              <div className="bg-forest/5 p-5 rounded-2xl border border-forest/15 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-forest/10">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest/70 block">Datos del Aspirante</span>
                    <h3 className="text-lg font-bold font-display text-forest">{app.child_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: app.stage?.color || '#1b3b2b' }}
                    >
                      Fase: {app.stage?.name || 'En Proceso'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${app.status === 'ENROLLED' ? 'bg-emerald-100 text-emerald-800' : 'bg-forest/10 text-forest'
                      }`}>
                      {app.status === 'ENROLLED' ? '✓ Matriculado Oficial' : 'En Admisión'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">Tutor Principal</span>
                    <span className="font-bold text-forest">{app.tutor_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">Teléfono</span>
                    <span className="font-bold text-forest">{app.tutor_phone || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">Correo</span>
                    <span className="font-bold text-forest truncate block">{app.tutor_email || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">Salón Asignado</span>
                    <span className="font-bold text-forest">{app.target_environment?.name || 'Sin salón asignado'}</span>
                  </div>
                </div>
              </div>

              {/* Form Sections */}
              <div className="space-y-6">
                {allDossierForms.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-forest/15 rounded-3xl p-6 text-xs text-muted-foreground">
                    Aún no hay formularios configurados ni completados en este expediente.
                  </div>
                ) : (
                  allDossierForms.map((item, idx) => {
                    if (item.sub) {
                      return (
                        <DossierSubmissionCard
                          key={item.sub.id || item.template?.id || idx}
                          sub={item.sub}
                          template={item.template}
                          onPreviewPhoto={(photo) => {
                            setPreviewPhoto(photo);
                            setPreviewZoom(1);
                            setPreviewRotation(0);
                          }}
                        />
                      );
                    }

                    // Uncompleted Form Template
                    return (
                      <div
                        key={item.template?.id || idx}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 opacity-90"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                              <h5 className="text-base font-bold text-slate-800 font-display">
                                {item.template?.title || 'Formulario'}
                              </h5>
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                                Pendiente
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.template?.description || 'Formulario no completado en este expediente.'}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-muted-foreground italic">
                          Sin datos
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Photos */}
      {typeof document !== 'undefined' && previewPhoto && createPortal(
        <div
          className="fixed inset-0 z-[99999999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between w-full text-white bg-black/40 px-4 py-2 rounded-2xl backdrop-blur-sm">
              <span className="font-bold text-sm truncate">{previewPhoto.title || 'Vista Previa'}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.25))}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono">{Math.round(previewZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(z => Math.min(3, z + 0.25))}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                  title="Rotar 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors ml-2 cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media Box */}
            <div className="relative overflow-hidden rounded-2xl max-h-[75vh] flex items-center justify-center bg-black/50 border border-white/10 p-2">
              {previewPhoto.isVideo ? (
                <video
                  key={previewPhoto.url}
                  src={previewPhoto.url}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="max-h-[70vh] max-w-[85vw] rounded-lg shadow-2xl bg-black"
                >
                  <source src={previewPhoto.url} type="video/webm" />
                  <source src={previewPhoto.url} type="video/mp4" />
                  Tu navegador no soporta la reproducción directa de este video.
                </video>
              ) : (
                <img
                  src={previewPhoto.url}
                  alt={previewPhoto.title}
                  style={{
                    transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                    transition: 'transform 0.2s ease-out'
                  }}
                  className="max-h-[70vh] max-w-[85vw] object-contain rounded-lg select-none shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};
