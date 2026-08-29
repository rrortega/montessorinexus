import galleryData from '@/data/gallery.json';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  phone?: string;
  updated_at: string;
}

export type Role = 'OWNER' | 'ADMIN' | 'STAFF' | 'TEACHER' | 'TUTOR';

export type AccessType = 'public' | 'code_auth';

export interface School {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  country?: string;
  province?: string;
  city?: string;
  address?: string;
  mapLat?: number | null;
  mapLng?: number | null;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  phone?: string;
  email?: string;
  features?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolMembership {
  id: string;
  userId: string;
  schoolId: string;
  role: Role;
  hasActiveEnrollment?: boolean;
  activeStudentsCount?: number;
  totalStudentsCount?: number;
  school: School;
  permissions?: string[] | null;
}

export interface EnvironmentItem {
  id: string;
  school_id: string;
  name: string;
  stage?: string;
  description?: string;
  cover_image?: string | null;
  min_age_years?: number | null;
  max_age_years?: number | null;
  capacity?: number;
  color?: string;
  start_time?: string | null;
  end_time?: string | null;
  schedule_days?: string | null;
  created_at: string;
  updated_at: string;
  student_count?: number;
  guideIds?: string[];
  guides?: Array<{ userId: string; isLead?: boolean }>;
}

export interface AuthorizedContactItem {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  idNumber?: string;
  photoUrl?: string;
  canPickup: boolean;
  canDropOff?: boolean;
  isEmergency: boolean;
  notes?: string;
}

export interface FoodAllergyItem {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  actionPlan?: string;
}

export interface ConsentTemplateItem {
  id: string;
  title: string;
  category: 'media' | 'trips' | 'medical' | 'outdoors' | 'general';
  description: string;
  legalText?: string;
  isRequired?: boolean;
  requiresSignature?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface StudentConsentRecord {
  templateId: string;
  granted: boolean;
  notes?: string;
  updatedAt?: string;
}

export interface StudentItem {
  id: string;
  school_id: string;
  environment_id?: string | null;
  full_name: string;
  avatar_url?: string;
  gender?: string;
  date_of_birth?: string;
  national_id?: string;
  id_document_url?: string;
  grade?: string;
  enrollment_code?: string;
  enrollment_date?: string;
  previous_school?: string;
  previous_methodology?: string;
  blood_type?: string;
  allergies?: string;
  food_allergies?: string;
  dietary_restrictions?: string;
  medical_notes?: string;
  internal_notes?: string;
  authorized_contacts?: string;
  consents?: string;
  status: string;
  created_at: string;
  updated_at: string;
  relationship?: string;
  environment?: EnvironmentItem;
  tutors?: Array<{
    id: string;
    student_id: string;
    tutor_user_id: string;
    relationship: string;
    is_primary_contact?: boolean;
    authorized_pick_up?: boolean;
    tutor: {
      id: string;
      email: string;
      full_name: string;
      phone?: string;
      avatar_url?: string;
    };
  }>;
}

export interface Folder {
  id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  access_type: AccessType;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  folder_id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  access_type: AccessType;
  file_name: string;
  file_type: string;
  file_data: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export interface GlobalAccessCode {
  code: string;
  expires_at: string;
  created_at: string;
}

export interface ApplicationLink {
  id: string;
  app_id: string;
  label: string;
  label_en?: string;
  url: string;
}

export interface ApplicationItem {
  id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  icon_url: string;
  links: ApplicationLink[];
  created_at: string;
  updated_at: string;
}

export interface GalleryCategory {
  id: string;
  label: string;
  label_en?: string;
  translations?: Record<string, string>;
  created_at: string;
}

export interface DetectedFaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  xPercent: number;
  yPercent: number;
  wPercent: number;
  hPercent: number;
}

export interface DetectedFaceItem {
  box: DetectedFaceBox;
  score?: number;
  isIdentified?: boolean;
  studentId?: string | null;
  studentName?: string;
  avatarUrl?: string | null;
  environmentName?: string | null;
  confidence?: number | null;
  hasConsent: boolean;
  consentNotes?: string;
  isBlurred?: boolean;
}

export type FaceConsentStatus = 'unchecked' | 'processing' | 'verified_clean' | 'has_violations' | 'no_faces';

export interface GalleryImageItem {
  id: string;
  category_id: string;
  src: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  translations?: Record<string, { title: string; description: string }>;
  ai_status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'MANUAL';
  ai_error?: string | null;
  consent_status?: FaceConsentStatus;
  detected_faces?: DetectedFaceItem[];
  blurred_src?: string | null;
  has_consent_issues?: boolean;
  show_on_web?: boolean;
  show_on_portal?: boolean;
  created_at: string;
}

export type WaitlistStatus = 'WAITING' | 'IN_ADMISSION' | 'ENROLLED' | 'CANCELLED';

export interface WaitlistEntry {
  id: string;
  school_id: string;
  child_name: string;
  birth_date?: string | null;
  gender?: string;
  target_environment_ids: string[];
  parent_name: string;
  parent_email?: string;
  parent_phone?: string;
  relationship?: string;
  preferred_start_date?: string | null;
  notes?: string;
  previous_school?: string;
  previous_methodology?: string;
  status: WaitlistStatus;
  priority: number;
  enrolled_student_id?: string | null;
  admission_application_id?: string | null;
  admission_application?: any | null;
  enrolled_student?: {
    id: string;
    fullName: string;
    enrollmentCode?: string;
    status: string;
    environment?: {
      id: string;
      name: string;
      color?: string;
    };
  } | null;
  created_at: string;
  updated_at: string;
}

export type FormFieldType = 
  | 'text' 
  | 'phone' 
  | 'email' 
  | 'fullname'
  | 'textarea' 
  | 'decimal' 
  | 'integer' 
  | 'file_upload' 
  | 'signature' 
  | 'single_choice' 
  | 'multiple_choice' 
  | 'date' 
  | 'boolean'
  | 'composite'
  | 'range'
  | 'terms_consent'
  | 'richtext'
  | 'document_capture'
  | 'selfie_liveness'
  | 'identity_verification' 
  | 'curp' 
  | 'schedule_event'
  | 'poll';

export type FieldConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'is_filled' 
  | 'is_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal';

export type ConditionLogic = 'AND' | 'OR';

export interface SingleFieldCondition {
  id?: string;
  dependsOnFieldId: string;
  operator: FieldConditionOperator;
  value?: string;
}

export interface FieldCondition {
  dependsOnFieldId?: string;
  operator?: FieldConditionOperator;
  value?: string;
  logic?: ConditionLogic;
  rules?: SingleFieldCondition[];
}

export type InvalidationTargetType = 'self' | 'field' | 'metadata';

export interface SingleInvalidationRule {
  id?: string;
  targetType: InvalidationTargetType; // 'self' | 'field' | 'metadata'
  dependsOnFieldId?: string; // used when targetType === 'field'
  metadataKey?: string; // used when targetType === 'metadata' (e.g. 'edad', 'sexo', 'estadoNacimiento', 'isExtranjero', 'fechaNacimiento')
  operator: FieldConditionOperator;
  value?: string;
}

export interface FieldInvalidationRule {
  enabled?: boolean;
  rules?: SingleInvalidationRule[];
  logic?: ConditionLogic;
  errorMessage?: string;
}

export type KycDocumentVariant = 'id_card' | 'passport' | 'drivers_license';
export type IdentityVerificationOrder = 'document_first' | 'selfie_first';

export interface SelfieCaptureSide {
  fileName: string;
  fileUrl: string;
  isImage?: boolean;
  isVideo?: boolean;
  fileSize?: string;
  capturedAt?: string;
}

export interface SelfieLivenessValue {
  step1?: SelfieCaptureSide;
  step2?: SelfieCaptureSide;
  videoClip?: SelfieCaptureSide;
  isComplete?: boolean;
}

export interface IdentityVerificationValue {
  front?: SelfieCaptureSide;
  back?: SelfieCaptureSide;
  frontUrl?: string;
  backUrl?: string;
  faceCropUrl?: string;
  selfieUrl?: string;
  document?: {
    front?: SelfieCaptureSide;
    back?: SelfieCaptureSide;
    docType?: string;
    country?: string;
    isComplete?: boolean;
    faceCropUrl?: string;
    ocrData?: Record<string, any>;
    extractedData?: Record<string, any>;
  };
  selfie?: {
    step1?: SelfieCaptureSide;
    videoClip?: SelfieCaptureSide;
    isComplete?: boolean;
  };
  verification?: {
    matchScore: number;
    isMatch: boolean;
    verifiedAt: string;
    status: 'verified' | 'failed' | 'manual_review';
    details?: string;
    ocrData?: Record<string, any>;
    extractedData?: Record<string, any>;
  };
  extractedData?: Record<string, any>;
  ocrData?: Record<string, any>;
  ocr?: Record<string, any>;
  isComplete?: boolean;
}

export interface PollOption {
  id: string;
  title: string;
  description?: string;
}

export interface PollConfig {
  allowMultiple?: boolean; // simple (single select) vs multiple (multi-select)
  options?: PollOption[];
  showResultsAfterSubmit?: boolean; // show results/stats to users after form submission
}

export interface FormFieldItem {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  subfields?: FormFieldItem[];
  defaultCountryCode?: string;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  unit?: string;
  fileConfig?: {
    accept?: string;
    multiple?: boolean;
    maxSizeMb?: number;
  };
  defaultValue?: any;
  condition?: FieldCondition; // "Mostrar si"
  invalidationRule?: FieldInvalidationRule; // "Invalidar si"
  termsContent?: string;
  consentLabel?: string;
  maxHeight?: string;
  documentGuide?: string;
  allowedDocTypes?: string;
  allowedIdTypes?: KycDocumentVariant[];
  allowDirectCameraOnly?: boolean;
  verificationOrder?: IdentityVerificationOrder;
  allowedCountries?: string[];
  requireBackSide?: boolean;
  minMatchScore?: number;
  livenessChallenge?: boolean;
  verifyCurp?: boolean;
  curpTimeoutSeconds?: number;
  curpFallbackStrategy?: 'silent_pass' | 'manual_fields';
  curpFallbackFields?: string[];
  enableOcrExtraction?: boolean;
  ocrFallbackStrategy?: 'manual_fields' | 'show_error_invalidate' | 'silent_pass';
  ocrManualFields?: string[];
  eventId?: string;
  eventIds?: string[];
  eventTitle?: string;
  allowSlotChange?: boolean;
  scheduleSelectionMode?: 'all_required' | 'choose_one';
  pollConfig?: PollConfig;
}

export const normalizeComparisonText = (text: any): string => {
  if (text === undefined || text === null) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const evaluateSingleCondition = (
  rule: SingleFieldCondition | undefined,
  formData: Record<string, any>
): boolean => {
  if (!rule || !rule.dependsOnFieldId) return true;

  const rawVal = formData[rule.dependsOnFieldId];
  const operator = rule.operator || 'equals';
  const targetRaw = rule.value || '';
  const targetNorm = normalizeComparisonText(targetRaw);

  if (operator === 'is_filled') {
    if (rawVal === undefined || rawVal === null || rawVal === '') return false;
    if (Array.isArray(rawVal) && rawVal.length === 0) return false;
    return true;
  }
  if (operator === 'is_empty') {
    if (rawVal === undefined || rawVal === null || rawVal === '') return true;
    if (Array.isArray(rawVal) && rawVal.length === 0) return true;
    return false;
  }

  // Numeric comparisons
  const numVal = parseFloat(String(rawVal));
  const numTarget = parseFloat(String(targetRaw));
  const isNumeric = !isNaN(numVal) && !isNaN(numTarget);

  if (isNumeric) {
    switch (operator) {
      case 'greater_than':
        return numVal > numTarget;
      case 'less_than':
        return numVal < numTarget;
      case 'greater_than_or_equal':
        return numVal >= numTarget;
      case 'less_than_or_equal':
        return numVal <= numTarget;
    }
  }

  if (Array.isArray(rawVal)) {
    const normArray = rawVal.map(normalizeComparisonText);
    if (operator === 'equals' || operator === 'contains') {
      return normArray.some(item => item === targetNorm || item.includes(targetNorm));
    }
    if (operator === 'not_equals' || operator === 'not_contains') {
      return !normArray.some(item => item === targetNorm || item.includes(targetNorm));
    }
  }

  const valNorm = normalizeComparisonText(rawVal);

  switch (operator) {
    case 'equals':
      return valNorm === targetNorm;
    case 'not_equals':
      return valNorm !== targetNorm;
    case 'contains':
      return valNorm.includes(targetNorm);
    case 'not_contains':
      return !valNorm.includes(targetNorm);
    default:
      return true;
  }
};

export const evaluateFieldCondition = (
  condition: FieldCondition | undefined,
  formData: Record<string, any>
): boolean => {
  if (!condition) return true;

  // 1. If compound rules array is provided
  if (Array.isArray(condition.rules) && condition.rules.length > 0) {
    const activeRules = condition.rules.filter(r => r.dependsOnFieldId);
    if (activeRules.length === 0) return true;

    const logic = condition.logic || 'AND';
    if (logic === 'OR') {
      return activeRules.some(r => evaluateSingleCondition(r, formData));
    }
    // Default 'AND'
    return activeRules.every(r => evaluateSingleCondition(r, formData));
  }

  // 2. Legacy single rule support
  if (condition.dependsOnFieldId) {
    return evaluateSingleCondition({
      dependsOnFieldId: condition.dependsOnFieldId,
      operator: condition.operator || 'equals',
      value: condition.value
    }, formData);
  }

  return true;
};

export interface InvalidationEvaluationResult {
  isInvalid: boolean;
  errorMessage?: string;
}

export const evaluateSingleInvalidationRule = (
  rule: SingleInvalidationRule,
  currentField: FormFieldItem,
  formData: Record<string, any>,
  curpMetadataExtractor?: (curp: string) => any
): boolean => {
  if (!rule) return false;

  let rawVal: any;

  if (rule.targetType === 'self') {
    rawVal = formData[currentField.id];
  } else if (rule.targetType === 'field') {
    if (!rule.dependsOnFieldId) return false;
    rawVal = formData[rule.dependsOnFieldId];
  } else if (rule.targetType === 'metadata') {
    const curpVal = formData[currentField.id];
    if (!curpVal || typeof curpVal !== 'string') return false;
    
    // Extract metadata from CURP if provided
    let meta: any = null;
    if (curpMetadataExtractor) {
      meta = curpMetadataExtractor(curpVal);
    }
    if (!meta) return false;

    const key = rule.metadataKey || 'edad';
    rawVal = meta[key];
  }

  const operator = rule.operator || 'equals';
  const targetRaw = rule.value || '';
  const targetNorm = normalizeComparisonText(targetRaw);

  if (operator === 'is_filled') {
    if (rawVal === undefined || rawVal === null || rawVal === '') return false;
    if (Array.isArray(rawVal) && rawVal.length === 0) return false;
    return true;
  }
  if (operator === 'is_empty') {
    if (rawVal === undefined || rawVal === null || rawVal === '') return true;
    if (Array.isArray(rawVal) && rawVal.length === 0) return true;
    return false;
  }

  // Numeric comparisons
  const numVal = parseFloat(String(rawVal));
  const numTarget = parseFloat(String(targetRaw));
  const isNumeric = !isNaN(numVal) && !isNaN(numTarget);

  if (isNumeric) {
    switch (operator) {
      case 'greater_than':
        return numVal > numTarget;
      case 'less_than':
        return numVal < numTarget;
      case 'greater_than_or_equal':
        return numVal >= numTarget;
      case 'less_than_or_equal':
        return numVal <= numTarget;
    }
  }

  if (Array.isArray(rawVal)) {
    const normArray = rawVal.map(normalizeComparisonText);
    if (operator === 'equals' || operator === 'contains') {
      return normArray.some(item => item === targetNorm || item.includes(targetNorm));
    }
    if (operator === 'not_equals' || operator === 'not_contains') {
      return !normArray.some(item => item === targetNorm || item.includes(targetNorm));
    }
  }

  const valNorm = normalizeComparisonText(rawVal);

  switch (operator) {
    case 'equals':
      return valNorm === targetNorm;
    case 'not_equals':
      return valNorm !== targetNorm;
    case 'contains':
      return valNorm.includes(targetNorm);
    case 'not_contains':
      return !valNorm.includes(targetNorm);
    default:
      return false;
  }
};

export const evaluateFieldInvalidation = (
  field: FormFieldItem | undefined,
  formData: Record<string, any>,
  curpMetadataExtractor?: (curp: string) => any
): InvalidationEvaluationResult => {
  if (!field || !field.invalidationRule || !field.invalidationRule.enabled) {
    return { isInvalid: false };
  }

  const { rules, logic = 'AND', errorMessage } = field.invalidationRule;
  if (!Array.isArray(rules) || rules.length === 0) {
    return { isInvalid: false };
  }

  // A field value must exist or be non-empty to evaluate self/metadata invalidation, unless checking is_empty
  const selfVal = formData[field.id];
  const hasSelfVal = selfVal !== undefined && selfVal !== null && String(selfVal).trim() !== '';

  const activeRules = rules.filter(r => {
    if (r.targetType === 'self' || r.targetType === 'metadata') {
      return hasSelfVal;
    }
    return Boolean(r.dependsOnFieldId);
  });

  if (activeRules.length === 0) {
    return { isInvalid: false };
  }

  let triggered = false;
  if (logic === 'OR') {
    triggered = activeRules.some(r => evaluateSingleInvalidationRule(r, field, formData, curpMetadataExtractor));
  } else {
    triggered = activeRules.every(r => evaluateSingleInvalidationRule(r, field, formData, curpMetadataExtractor));
  }

  if (triggered) {
    return {
      isInvalid: true,
      errorMessage: errorMessage || 'Este valor no cumple con los criterios requeridos para continuar.'
    };
  }

  return { isInvalid: false };
};

export type FormLayoutStyle = 'classic' | 'focus_flow' | 'step_wizard' | 'google_forms' | 'typeform' | 'wizard_liquid';

export interface FormSectionItem {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldItem[];
  layoutStyle?: FormLayoutStyle;
  themeColor?: string;
  accessType?: 'PUBLIC' | 'RESTRICTED_WHITELIST';
  allowedEmails?: string[];
  allowMultipleResponses?: boolean;
}

export interface AdmissionFormTemplateItem {
  id: string;
  school_id: string;
  title: string;
  description?: string;
  category: 'GENERAL' | 'MEDICAL' | 'PEDAGOGICAL' | 'LEGAL_CONSENT' | 'SOCIOECONOMIC' | 'INTERVIEW';
  schema: FormSectionItem[];
  layout_style?: FormLayoutStyle;
  theme_color?: string;
  secondary_color?: string;
  field_style?: 'underlined' | 'bordered' | 'filled';
  border_radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow_style?: 'none' | 'subtle' | 'medium' | 'glow';
  border_weight?: 'thin' | 'medium' | 'thick';
  access_type?: 'PUBLIC' | 'RESTRICTED_WHITELIST';
  allowed_emails?: string[];
  allow_multiple_responses?: boolean;
  allowMultipleResponses?: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface StageRequiredFormItem {
  formTemplateId: string;
  formTitle: string;
  assignedRole: 'ANY_TUTOR' | 'PRIMARY_TUTOR' | 'SECONDARY_TUTOR' | 'INTERNAL_STAFF';
  isMandatory: boolean;
}

export interface FormSubmissionItem {
  id: string;
  formTemplateId: string;
  stageId?: string;
  stageName?: string;
  title: string;
  category?: string;
  filledByRole?: string;
  filledByName?: string;
  respondentName?: string;
  respondentEmail?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  data: Record<string, any>;
  fieldLabels?: Record<string, string>;
  files: Array<{
    fieldId: string;
    fileName: string;
    fileUrl: string;
    fileType?: string;
    size?: number;
  }>;
  signature?: string | null;
  submittedAt: string;
  ip?: string;
  telemetry?: {
    ip?: string;
    fingerprint?: string;
    browser?: { name: string; version: string; major: string; full: string } | string;
    os?: { name: string; version: string; full: string } | string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    screen?: string;
    timezone?: string;
    language?: string;
    userAgent?: string;
    startedAt?: string;
    submittedAt?: string;
    durationSeconds?: number;
    durationFormatted?: string;
    deviceSwitched?: boolean;
    initialFingerprint?: string;
  };
  metadata?: Record<string, any>;
  isReviewed?: boolean;
  is_reviewed?: boolean;
  viewedAt?: string | null;
  viewed_at?: string | null;
}

export interface AdmissionStageItem {
  id: string;
  school_id: string;
  slug?: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  is_initial: boolean;
  is_final: boolean;
  is_terminal_rejected: boolean;
  required_documents: string[];
  required_forms: StageRequiredFormItem[];
  form_questions: Array<{ id: string; label: string; type: string; options?: string[] }>;
  hooks_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  _count?: {
    applications: number;
  };
}

export interface AdmissionDocumentItem {
  id: string;
  name: string;
  file_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploaded_at?: string;
  notes?: string;
}

export interface AdmissionHistoryEntry {
  fromStageId?: string;
  fromStageName?: string;
  toStageId: string;
  toStageName: string;
  timestamp: string;
  actor: string;
  notes?: string;
}

export interface AdmissionApplicationItem {
  id: string;
  school_id: string;
  stage_id: string;
  portal_token?: string;
  child_first_name?: string;
  child_last_name?: string;
  child_name: string;
  birth_date?: string | null;
  gender?: string;
  target_environment_id?: string | null;
  target_environment_ids: string[];
  preferred_start_date?: string | null;
  previous_school?: string;
  previous_methodology?: string;
  tutor_name: string;
  tutor_email?: string;
  tutor_phone?: string;
  tutor_relationship?: string;
  secondary_tutor_name?: string;
  secondary_tutor_phone?: string;
  address?: string;
  status: 'IN_PROGRESS' | 'ENROLLED' | 'WITHDRAWN' | 'REJECTED';
  submitted_documents: AdmissionDocumentItem[];
  form_submissions: FormSubmissionItem[];
  custom_form_responses: Record<string, any>;
  internal_notes?: string;
  enrolled_student_id?: string | null;
  history: AdmissionHistoryEntry[];
  created_at: string;
  updated_at: string;
  stage?: AdmissionStageItem;
  target_environment?: {
    id: string;
    name: string;
    stage?: string;
    color?: string;
  };
  enrolled_student?: {
    id: string;
    fullName: string;
    enrollmentCode?: string;
    status: string;
  };
}

// Multi-tenant header helper
export const getActiveSchoolId = (): string => {
  const saved = localStorage.getItem('ceiba_active_school_id') || '';
  return saved === 'school_ceiba' ? '' : saved;
};

export const getActiveSchoolSlug = (): string => {
  return localStorage.getItem('ceiba_active_school_slug') || 'ceiba';
};

export const getAuthHeaders = (): Record<string, string> => {
  const schoolId = getActiveSchoolId();
  const schoolSlug = getActiveSchoolSlug();
  const userEmail = localStorage.getItem('ceiba_user_email') || '';
  return {
    'Content-Type': 'application/json',
    ...(schoolId ? { 'x-school-id': schoolId } : {}),
    ...(schoolSlug ? { 'x-school-slug': schoolSlug } : {}),
    ...(userEmail ? { 'x-user-email': userEmail } : {})
  };
};

// Map Prisma camelCase models to snake_case frontend interfaces
const mapFolder = (f: any): Folder => ({
  id: f.id,
  title: f.title,
  description: f.description || '',
  title_en: f.titleEn || '',
  description_en: f.descriptionEn || '',
  access_type: f.accessType as AccessType,
  created_at: f.createdAt,
  updated_at: f.updatedAt,
});

const mapDocument = (d: any): DocumentItem => ({
  id: d.id,
  folder_id: d.folderId,
  title: d.title,
  description: d.description || '',
  title_en: d.titleEn || '',
  description_en: d.descriptionEn || '',
  access_type: d.accessType as AccessType,
  file_name: d.fileName,
  file_type: d.fileType,
  file_data: d.fileData,
  created_at: d.createdAt,
  updated_at: d.updatedAt,
});

const mapApplication = (a: any): ApplicationItem => ({
  id: a.id,
  title: a.title,
  description: a.description || '',
  title_en: a.titleEn || '',
  description_en: a.descriptionEn || '',
  icon_url: a.iconUrl || '',
  created_at: a.createdAt,
  updated_at: a.updatedAt,
  links: (a.links || []).map((l: any) => ({
    id: l.id,
    app_id: a.id,
    label: l.label,
    label_en: l.labelEn || l.label_en || '',
    url: l.url,
  })),
});

const mapGalleryCategory = (c: any): GalleryCategory => {
  let parsedTranslations: Record<string, string> = {};
  if (c.translations) {
    try {
      parsedTranslations = typeof c.translations === 'string' ? JSON.parse(c.translations) : c.translations;
    } catch {}
  }
  return {
    id: c.id,
    label: c.label,
    label_en: c.labelEn || c.label_en || '',
    translations: parsedTranslations,
    created_at: c.createdAt,
  };
};

const mapGalleryImage = (i: any): GalleryImageItem => {
  let parsedTranslations: Record<string, { title: string; description: string }> = {};
  if (i.translations) {
    try {
      parsedTranslations = typeof i.translations === 'string' ? JSON.parse(i.translations) : i.translations;
    } catch {}
  }
  let parsedFaces: DetectedFaceItem[] = [];
  if (i.detectedFaces || i.detected_faces) {
    const rawFaces = i.detectedFaces || i.detected_faces;
    try {
      parsedFaces = typeof rawFaces === 'string' ? JSON.parse(rawFaces) : rawFaces;
    } catch {}
  }
  return {
    id: i.id,
    category_id: i.categoryId || i.category_id,
    src: i.src,
    title: i.title,
    title_en: i.titleEn || i.title_en || '',
    description: i.description || '',
    description_en: i.descriptionEn || i.description_en || '',
    translations: parsedTranslations,
    ai_status: i.aiStatus || i.ai_status || 'COMPLETED',
    ai_error: i.aiError || i.ai_error || null,
    consent_status: (i.consentStatus || i.consent_status || 'unchecked') as FaceConsentStatus,
    detected_faces: Array.isArray(parsedFaces) ? parsedFaces : [],
    blurred_src: i.blurredSrc || i.blurred_src || null,
    has_consent_issues: Boolean(i.hasConsentIssues ?? i.has_consent_issues ?? false),
    show_on_web: i.showOnWeb ?? i.show_on_web ?? true,
    show_on_portal: i.showOnPortal ?? i.show_on_portal ?? true,
    created_at: i.createdAt || i.created_at,
  };
};

const mapWaitlistEntry = (w: any): WaitlistEntry => ({
  id: w.id,
  school_id: w.schoolId,
  child_name: w.childName,
  birth_date: w.birthDate,
  gender: w.gender || 'NOT_SPECIFIED',
  target_environment_ids: w.targetEnvironmentIds || [],
  parent_name: w.parentName,
  parent_email: w.parentEmail || '',
  parent_phone: w.parentPhone || '',
  relationship: w.relationship || 'MOTHER',
  preferred_start_date: w.preferredStartDate,
  notes: w.notes || '',
  previous_school: w.previousSchool || w.previous_school || '',
  previous_methodology: w.previousMethodology || w.previous_methodology || '',
  status: w.status as WaitlistStatus,
  priority: w.priority || 0,
  enrolled_student_id: w.enrolledStudentId || w.enrolled_student_id || null,
  admission_application_id: w.admissionApplicationId || w.admission_application_id || null,
  admission_application: w.admissionApplication || w.admission_application || null,
  enrolled_student: w.enrolledStudent || w.enrolled_student || null,
  created_at: w.createdAt || w.created_at,
  updated_at: w.updatedAt || w.updated_at,
});

// SCHOOLS API
export interface SuperAdminSchoolItem extends School {
  trial?: {
    startDate: string;
    trialEndsAt: string;
    daysRemaining: number;
    isTrialActive: boolean;
    status: string;
  };
  billing?: {
    subscriptionStatus: string;
    totalPaid: number;
    lastPaymentDate: string | null;
    paymentHistory: Array<{
      id: string;
      amount: number;
      date: string;
      method: string;
      reference?: string;
      notes?: string;
    }>;
    billingCycle?: string;
  };
  stats?: {
    studentsCount: number;
    environmentsCount: number;
    membershipsCount: number;
    applicationsCount: number;
    documentsCount: number;
    estimatedMrr: number;
    modulesCost: number;
    envCost: number;
  };
  environments?: Array<{ id: string; name: string; stage?: string | null }>;
}

export async function getSuperAdminSchoolsSummary(): Promise<SuperAdminSchoolItem[]> {
  try {
    const res = await fetch('/api/superadmin/schools-summary', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getSuperAdminSchoolsSummary error', e);
    return [];
  }
}

export async function recordSchoolSubscriptionPayment(schoolId: string, data: {
  status?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentNotes?: string;
  extendTrialDays?: number;
}): Promise<boolean> {
  try {
    const res = await fetch(`/api/superadmin/schools/${schoolId}/subscription`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (e) {
    console.error('recordSchoolSubscriptionPayment error', e);
    return false;
  }
}

export async function eradicateSchool(schoolId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/superadmin/schools/${schoolId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Error al erradicar colegio' };
    }
    return { success: true, message: data.message };
  } catch (e: any) {
    console.error('eradicateSchool error', e);
    return { success: false, error: e.message || 'Error de conexión' };
  }
}

export async function getSuperAdminInfrastructureStatus(): Promise<any> {
  try {
    const res = await fetch('/api/superadmin/infrastructure-status', { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('getSuperAdminInfrastructureStatus error', e);
    return null;
  }
}

export async function getSchools(): Promise<School[]> {
  try {
    const res = await fetch('/api/schools', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getSchools error', e);
    return [];
  }
}

export async function getCurrentSchool(): Promise<School | null> {
  try {
    const res = await fetch('/api/schools/current', { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('getCurrentSchool error', e);
    return null;
  }
}

export async function createSchool(data: Partial<School>): Promise<School> {
  const res = await fetch('/api/schools', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear colegio' }));
    throw new Error(err.error || 'Error al crear colegio');
  }
  return await res.json();
}

// ENVIRONMENTS (SALONES / NIVELES) API
export async function getEnvironments(): Promise<EnvironmentItem[]> {
  try {
    const res = await fetch('/api/environments', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((e: any) => ({
      id: e.id,
      school_id: e.schoolId,
      name: e.name,
      stage: e.stage || '',
      description: e.description || '',
      cover_image: e.coverImage || null,
      min_age_years: e.minAgeYears,
      max_age_years: e.maxAgeYears,
      capacity: e.capacity,
      color: e.color || '#1b3b2b',
      created_at: e.createdAt,
      updated_at: e.updatedAt,
      student_count: e._count?.students || 0,
      guides: e.guides || [],
      guideIds: (e.guides || []).map((g: any) => g.userId),
    }));
  } catch (err) {
    console.error('getEnvironments error', err);
    return [];
  }
}

export async function getEnvironment(id: string): Promise<EnvironmentItem | null> {
  try {
    const res = await fetch(`/api/environments/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const e = await res.json();
    return {
      id: e.id,
      school_id: e.schoolId,
      name: e.name,
      stage: e.stage || '',
      description: e.description || '',
      cover_image: e.coverImage || null,
      min_age_years: e.minAgeYears,
      max_age_years: e.maxAgeYears,
      capacity: e.capacity,
      color: e.color || '#1b3b2b',
      created_at: e.createdAt,
      updated_at: e.updatedAt,
      student_count: e._count?.students || 0,
      guides: e.guides || [],
      guideIds: (e.guides || []).map((g: any) => g.userId),
    };
  } catch (err) {
    console.error('getEnvironment error', err);
    return null;
  }
}

export async function createEnvironment(data: {
  name: string;
  stage?: string;
  description?: string;
  coverImage?: string;
  minAgeYears?: number | null;
  maxAgeYears?: number | null;
  capacity?: number;
  color?: string;
  startTime?: string | null;
  endTime?: string | null;
  scheduleDays?: string[] | string | null;
}): Promise<EnvironmentItem> {
  const res = await fetch('/api/environments', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear ambiente' }));
    throw new Error(err.error || 'Error al crear ambiente');
  }
  return await res.json();
}

export async function updateEnvironment(id: string, data: {
  name?: string;
  stage?: string;
  description?: string;
  coverImage?: string | null;
  minAgeYears?: number | null;
  maxAgeYears?: number | null;
  capacity?: number;
  color?: string;
  startTime?: string | null;
  endTime?: string | null;
  scheduleDays?: string[] | string | null;
}): Promise<EnvironmentItem> {
  const res = await fetch(`/api/environments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar ambiente' }));
    throw new Error(err.error || 'Error al actualizar ambiente');
  }
  return await res.json();
}

export async function deleteEnvironment(id: string): Promise<void> {
  await fetch(`/api/environments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
}

export async function seedEnvironmentPresets(preset: 'montessori' | 'traditional'): Promise<void> {
  await fetch('/api/environments/seed-presets', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ preset })
  });
}

// STUDENTS & TUTORS API
export interface TutorStudentLink {
  id: string;
  relationship: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER' | string;
  isPrimaryContact: boolean;
  authorizedPickUp: boolean;
  student: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    enrollmentCode?: string;
    grade?: string;
    environment?: {
      id: string;
      name: string;
      color?: string;
      stage?: string;
    };
  };
}

export interface TutorUserItem {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  studentLinks?: TutorStudentLink[];
}

export async function getTutors(): Promise<TutorUserItem[]> {
  try {
    const res = await fetch('/api/tutors', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getTutors error', e);
    return [];
  }
}

export async function updateTutor(id: string, data: {
  fullName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  password?: string;
  studentLinks?: {
    id?: string;
    studentId?: string;
    relationship?: string;
    isPrimaryContact?: boolean;
    authorizedPickUp?: boolean;
  }[];
}): Promise<void> {
  const res = await fetch(`/api/tutors/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar información del tutor');
  }
}

export async function getStudents(): Promise<StudentItem[]> {
  try {
    const res = await fetch('/api/students', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((s: any) => ({
      id: s.id,
      school_id: s.schoolId,
      environment_id: s.environmentId,
      full_name: s.fullName,
      avatar_url: s.avatarUrl || '',
      gender: s.gender || '',
      date_of_birth: s.dateOfBirth,
      national_id: s.nationalId || '',
      id_document_url: s.idDocumentUrl || '',
      grade: s.grade || s.environment?.name || '',
      enrollment_code: s.enrollmentCode || '',
      enrollment_date: s.enrollmentDate,
      previous_school: s.previousSchool || '',
      previous_methodology: s.previousMethodology || '',
      blood_type: s.bloodType || '',
      allergies: s.allergies || '',
      food_allergies: s.foodAllergies || '[]',
      dietary_restrictions: s.dietaryRestrictions || '',
      medical_notes: s.medicalNotes || '',
      internal_notes: s.internalNotes || '',
      authorized_contacts: s.authorizedContacts || '[]',
      consents: s.consents || '[]',
      status: s.status,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
      environment: s.environment ? {
        id: s.environment.id,
        school_id: s.environment.schoolId,
        name: s.environment.name,
        stage: s.environment.stage || '',
        description: s.environment.description || '',
        cover_image: s.environment.coverImage || null,
        min_age_years: s.environment.minAgeYears,
        max_age_years: s.environment.maxAgeYears,
        capacity: s.environment.capacity,
        color: s.environment.color,
        created_at: s.environment.createdAt,
        updated_at: s.environment.updatedAt,
      } : undefined,
      tutors: (s.tutors || []).map((t: any) => ({
        id: t.id,
        student_id: t.studentId,
        tutor_user_id: t.tutorUserId,
        relationship: t.relationship,
        is_primary_contact: Boolean(t.isPrimaryContact),
        authorized_pick_up: t.authorizedPickUp !== undefined ? Boolean(t.authorizedPickUp) : true,
        tutor: {
          id: t.tutor.id,
          email: t.tutor.email,
          full_name: t.tutor.fullName || t.tutor.email,
          phone: t.tutor.phone,
          avatar_url: t.tutor.avatarUrl || ''
        }
      }))
    }));
  } catch (e) {
    console.error('getStudents error', e);
    return [];
  }
}

export async function createStudent(data: {
  fullName: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string | null;
  nationalId?: string;
  idDocumentUrl?: string;
  grade?: string;
  enrollmentCode?: string;
  enrollmentDate?: string | null;
  previousSchool?: string;
  previousMethodology?: string;
  bloodType?: string;
  allergies?: string;
  foodAllergies?: FoodAllergyItem[] | string;
  dietaryRestrictions?: string;
  medicalNotes?: string;
  internalNotes?: string;
  authorizedContacts?: AuthorizedContactItem[] | string;
  consents?: StudentConsentRecord[] | string;
  environmentId?: string | null;
  status?: string;
  tutors?: Array<{
    userId?: string;
    tutorUserId?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    relationship?: string;
    isPrimaryContact?: boolean;
    authorizedPickUp?: boolean;
    password?: string;
  }>;
}): Promise<StudentItem> {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear estudiante' }));
    throw new Error(err.error || 'Error al crear estudiante');
  }
  return await res.json();
}

export async function updateStudent(id: string, data: {
  fullName?: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string | null;
  nationalId?: string;
  idDocumentUrl?: string;
  grade?: string;
  enrollmentCode?: string;
  enrollmentDate?: string | null;
  previousSchool?: string;
  previousMethodology?: string;
  bloodType?: string;
  allergies?: string;
  foodAllergies?: FoodAllergyItem[] | string;
  dietaryRestrictions?: string;
  medicalNotes?: string;
  internalNotes?: string;
  authorizedContacts?: AuthorizedContactItem[] | string;
  consents?: StudentConsentRecord[] | string;
  environmentId?: string | null;
  status?: string;
}): Promise<StudentItem> {
  const res = await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar estudiante' }));
    throw new Error(err.error || 'Error al actualizar estudiante');
  }
  return await res.json();
}

export async function deleteStudent(id: string): Promise<void> {
  await fetch(`/api/students/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
}

// CONSENT TEMPLATES (SCHOOL MULTI-TENANT API)
export interface ConsentTemplateItem {
  id: string;
  title: string;
  category: 'media' | 'trips' | 'medical' | 'outdoors' | 'general';
  description: string;
  legalText?: string;
  isRequired?: boolean;
  requiresSignature?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
}

export async function getConsentTemplates(): Promise<ConsentTemplateItem[]> {
  try {
    const res = await fetch('/api/consent-templates', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getConsentTemplates error', e);
    return [];
  }
}

export async function saveConsentTemplates(templates: ConsentTemplateItem[]): Promise<void> {
  const res = await fetch('/api/consent-templates', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ templates })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar plantillas de consentimiento' }));
    throw new Error(err.error || 'Error al guardar plantillas de consentimiento');
  }
}

// ==========================================
// ALLERGIES CATALOGUE CLIENT API
// ==========================================
export type AllergyCategory = 'food' | 'medication' | 'environmental' | 'insects' | 'contact' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe';

export interface AllergyCatalogueItem {
  id: string;
  name: string;
  nameEn?: string;
  category: AllergyCategory;
  severity: AllergySeverity;
  description: string;
  descriptionEn?: string;
  emergencyAction?: string;
  isDefault?: boolean;
}

export async function getAllergiesCatalogue(): Promise<AllergyCatalogueItem[]> {
  try {
    const res = await fetch('/api/allergies', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getAllergiesCatalogue error', e);
    return [];
  }
}

export async function saveAllergiesCatalogue(allergies: AllergyCatalogueItem[]): Promise<void> {
  const res = await fetch('/api/allergies', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ allergies })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar catálogo de alergias' }));
    throw new Error(err.error || 'Error al guardar catálogo de alergias');
  }
}

// ==========================================
// ASSESSMENT SCALES & EVALUATORS CLIENT API
// ==========================================
export type AssessmentDisplayMode = 'circles' | 'letters' | 'icons' | 'badges';

export interface AssessmentScaleItem {
  id: string;
  code: string;
  label: string;
  name?: string;
  nameEn?: string;
  acronym: string;
  shortCode?: string;
  color: string;
  icon: string;
  description: string;
  descriptionEn?: string;
  order?: number;
  isDefault?: boolean;
}

export const DEFAULT_ASSESSMENT_SCALES: AssessmentScaleItem[] = [
  {
    id: 'scale_presented',
    code: 'PRESENTED',
    label: 'Presentado',
    name: 'Presentado',
    acronym: 'P',
    shortCode: 'P',
    color: '#f59e0b',
    icon: 'Sparkles',
    description: 'El material fue presentado formalmente al alumno.',
    order: 1,
    isDefault: true
  },
  {
    id: 'scale_practicing',
    code: 'PRACTICING',
    label: 'En Práctica',
    name: 'En Práctica',
    acronym: 'EP',
    shortCode: 'EP',
    color: '#ea580c',
    icon: 'PlayCircle',
    description: 'El alumno trabaja activamente en el desarrollo de la habilidad.',
    order: 2,
    isDefault: true
  },
  {
    id: 'scale_mastered',
    code: 'MASTERED',
    label: 'Dominado',
    name: 'Dominado',
    acronym: 'D',
    shortCode: 'D',
    color: '#10b981',
    icon: 'CheckCircle2',
    description: 'El alumno demuestra dominio y precisión independiente.',
    order: 3,
    isDefault: true
  },
  {
    id: 'scale_needs_review',
    code: 'NEEDS_REVIEW',
    label: 'Refuerzo',
    name: 'Refuerzo',
    acronym: 'R',
    shortCode: 'R',
    color: '#0284c7',
    icon: 'RotateCcw',
    description: 'Requiere nueva presentación o práctica guiada adicional.',
    order: 4,
    isDefault: true
  }
];

export interface AssessmentSettings {
  scales: AssessmentScaleItem[];
  displayMode: AssessmentDisplayMode;
}

export async function getAssessmentSettings(): Promise<AssessmentSettings> {
  try {
    const res = await fetch('/api/assessment-scales', { headers: getAuthHeaders() });
    if (!res.ok) {
      return {
        scales: DEFAULT_ASSESSMENT_SCALES,
        displayMode: 'badges'
      };
    }
    const data = await res.json();
    const rawScales = data?.scales || [];
    const normalizedScales: AssessmentScaleItem[] = (rawScales.length > 0 ? rawScales : DEFAULT_ASSESSMENT_SCALES).map((s: any) => ({
      ...s,
      label: s.label || s.name || s.code || 'Escala',
      acronym: s.acronym || s.shortCode || (s.label || s.name || s.code || 'E').substring(0, 2).toUpperCase()
    }));

    return {
      scales: normalizedScales,
      displayMode: data?.displayMode || 'circles'
    };
  } catch (e) {
    console.error('getAssessmentSettings error', e);
    return {
      scales: DEFAULT_ASSESSMENT_SCALES,
      displayMode: 'circles'
    };
  }
}

export async function saveAssessmentSettings(data: Partial<AssessmentSettings>): Promise<void> {
  const res = await fetch('/api/assessment-scales', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar configuración de evaluaciones' }));
    throw new Error(err.error || 'Error al guardar configuración de evaluaciones');
  }
}

// ==========================================
// WAITLIST (LISTA DE ESPERA) CLIENT API
// ==========================================

export async function getWaitlistEntries(filters?: {
  status?: string;
  environmentId?: string;
  search?: string;
}): Promise<WaitlistEntry[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.environmentId) params.set('environmentId', filters.environmentId);
    if (filters?.search) params.set('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/waitlist${qs}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapWaitlistEntry);
  } catch (e) {
    console.error('getWaitlistEntries error', e);
    return [];
  }
}

export async function getWaitlistEntry(id: string): Promise<WaitlistEntry | null> {
  try {
    const res = await fetch(`/api/waitlist/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return mapWaitlistEntry(data);
  } catch (e) {
    console.error('getWaitlistEntry error', e);
    return null;
  }
}

export async function createWaitlistEntry(data: {
  childName: string;
  birthDate?: string | null;
  gender?: string;
  targetEnvironmentIds?: string[];
  parentName: string;
  parentEmail?: string;
  parentPhone?: string;
  relationship?: string;
  preferredStartDate?: string | null;
  notes?: string;
  previousSchool?: string;
  previousMethodology?: string;
  priority?: number;
}): Promise<WaitlistEntry> {
  const res = await fetch('/api/waitlist', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al registrar en lista de espera' }));
    throw new Error(err.error || 'Error al registrar en lista de espera');
  }
  const result = await res.json();
  return mapWaitlistEntry(result);
}

export async function updateWaitlistEntry(id: string, data: {
  childName?: string;
  birthDate?: string | null;
  gender?: string;
  targetEnvironmentIds?: string[];
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  relationship?: string;
  preferredStartDate?: string | null;
  notes?: string;
  previousSchool?: string;
  previousMethodology?: string;
  status?: WaitlistStatus;
  priority?: number;
}): Promise<WaitlistEntry> {
  const res = await fetch(`/api/waitlist/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar registro de lista de espera' }));
    throw new Error(err.error || 'Error al actualizar registro de lista de espera');
  }
  const result = await res.json();
  return mapWaitlistEntry(result);
}

export async function deleteWaitlistEntry(id: string): Promise<void> {
  const res = await fetch(`/api/waitlist/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar registro de lista de espera' }));
    throw new Error(err.error || 'Error al eliminar registro de lista de espera');
  }
}

export async function enrollWaitlistChild(id: string, data: {
  environmentId: string;
  enrollmentCode?: string;
  enrollmentDate?: string;
  grade?: string;
  bloodType?: string;
  allergies?: string;
  previousSchool?: string;
  previousMethodology?: string;
  medicalNotes?: string;
  internalNotes?: string;
}): Promise<{ student: StudentItem; waitlistEntry: WaitlistEntry }> {
  const res = await fetch(`/api/waitlist/${id}/enroll`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al admitir y matricular infante' }));
    throw new Error(err.error || 'Error al admitir y matricular infante');
  }
  const result = await res.json();
  return {
    student: result.student,
    waitlistEntry: mapWaitlistEntry(result.waitlistEntry)
  };
}
export async function startAdmissionFromWaitlist(id: string, data?: {
  targetEnvironmentId?: string;
  internalNotes?: string;
}): Promise<{ application: AdmissionApplicationItem; waitlistEntry: WaitlistEntry }> {
  const res = await fetch(`/api/waitlist/${id}/start-admission`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data || {})
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al iniciar proceso de admisión' }));
    throw new Error(err.error || 'Error al iniciar proceso de admisión');
  }
  const result = await res.json();
  return {
    application: mapAdmissionApplication(result.application),
    waitlistEntry: mapWaitlistEntry(result.waitlistEntry)
  };
}

export async function reorderWaitlistEntries(orderedIds: string[]): Promise<void> {
  const res = await fetch('/api/waitlist/reorder', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderedIds })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al reordenar lista de espera' }));
    throw new Error(err.error || 'Error al reordenar lista de espera');
  }
}

export async function returnApplicationToWaitlist(applicationId: string, data?: {
  preferredStartDate?: string;
  notes?: string;
}): Promise<{ application: AdmissionApplicationItem; waitlistEntry: WaitlistEntry }> {
  const res = await fetch(`/api/admissions/applications/${applicationId}/return-to-waitlist`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data || {})
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al regresar a lista de espera' }));
    throw new Error(err.error || 'Error al regresar a lista de espera');
  }
  const result = await res.json();
  return {
    application: mapAdmissionApplication(result.application),
    waitlistEntry: mapWaitlistEntry(result.waitlistEntry)
  };
}

export const mapAdmissionFormTemplate = (t: any): AdmissionFormTemplateItem => {
  if (!t) return null as any;
  let parsedSchema = t.schema;
  if (typeof parsedSchema === 'string') {
    try {
      parsedSchema = JSON.parse(parsedSchema);
    } catch {
      parsedSchema = [];
    }
  }
  const sections = Array.isArray(parsedSchema)
    ? parsedSchema
    : (Array.isArray(parsedSchema?.sections) ? parsedSchema.sections : []);

  return {
    id: t.id,
    school_id: t.schoolId || t.school_id,
    title: t.title || '',
    description: t.description || '',
    category: t.category || 'GENERAL',
    schema: sections,
    layout_style: t.layoutStyle || t.layout_style || sections?.[0]?.layoutStyle || 'google_forms',
    theme_color: t.themeColor || t.theme_color || sections?.[0]?.themeColor || '#1b3b2b',
    secondary_color: t.secondaryColor || t.secondary_color || sections?.[0]?.secondaryColor || '#10b981',
    field_style: t.fieldStyle || t.field_style || sections?.[0]?.fieldStyle || 'underlined',
    border_radius: t.borderRadius || t.border_radius || sections?.[0]?.borderRadius || 'lg',
    shadow_style: t.shadowStyle || t.shadow_style || sections?.[0]?.shadowStyle || 'subtle',
    border_weight: t.borderWeight || t.border_weight || sections?.[0]?.borderWeight || 'medium',
    access_type: t.accessType || t.access_type || sections?.[0]?.accessType || 'PUBLIC',
    allowed_emails: Array.isArray(t.allowedEmails) ? t.allowedEmails : (Array.isArray(t.allowed_emails) ? t.allowed_emails : (sections?.[0]?.allowedEmails || [])),
    is_published: t.isPublished !== undefined ? t.isPublished : (t.is_published !== undefined ? t.is_published : true),
    created_at: t.createdAt || t.created_at || new Date().toISOString(),
    updated_at: t.updatedAt || t.updated_at || new Date().toISOString()
  };
};

export const mapAdmissionStage = (s: any): AdmissionStageItem => ({
  id: s.id,
  school_id: s.schoolId || s.school_id,
  slug: s.slug || '',
  name: s.name,
  description: s.description || '',
  color: s.color || '#1b3b2b',
  order_index: s.orderIndex !== undefined ? s.orderIndex : (s.order_index || 0),
  is_initial: s.isInitial !== undefined ? s.isInitial : (s.is_initial || false),
  is_final: s.isFinal !== undefined ? s.isFinal : (s.is_final || false),
  is_terminal_rejected: s.isTerminalRejected !== undefined ? s.isTerminalRejected : (s.is_terminal_rejected || false),
  required_documents: Array.isArray(s.requiredDocuments) ? s.requiredDocuments : (s.required_documents || []),
  required_forms: Array.isArray(s.requiredForms) ? s.requiredForms : (Array.isArray(s.required_forms) ? s.required_forms : []),
  form_questions: Array.isArray(s.formQuestions) ? s.formQuestions : (s.form_questions || []),
  hooks_config: s.hooksConfig || s.hooks_config || {},
  created_at: s.createdAt || s.created_at || new Date().toISOString(),
  updated_at: s.updatedAt || s.updated_at || new Date().toISOString(),
  _count: s._count
});

export const mapAdmissionApplication = (a: any): AdmissionApplicationItem => ({
  id: a.id,
  school_id: a.schoolId || a.school_id,
  stage_id: a.stageId || a.stage_id,
  portal_token: a.portalToken || a.portal_token || a.id,
  child_first_name: a.childFirstName || a.child_first_name || '',
  child_last_name: a.childLastName || a.child_last_name || '',
  child_name: a.childName || a.child_name || '',
  birth_date: a.birthDate || a.birth_date || null,
  gender: a.gender || 'NOT_SPECIFIED',
  target_environment_id: a.targetEnvironmentId || a.target_environment_id || null,
  target_environment_ids: Array.isArray(a.targetEnvironmentIds) ? a.targetEnvironmentIds : (a.target_environment_ids || []),
  preferred_start_date: a.preferredStartDate || a.preferred_start_date || null,
  previous_school: a.previousSchool || a.previous_school || '',
  previous_methodology: a.previousMethodology || a.previous_methodology || '',
  tutor_name: a.tutorName || a.tutor_name || '',
  tutor_email: a.tutorEmail || a.tutor_email || '',
  tutor_phone: a.tutorPhone || a.tutor_phone || '',
  tutor_relationship: a.tutorRelationship || a.tutor_relationship || 'MOTHER',
  secondary_tutor_name: a.secondaryTutorName || a.secondary_tutor_name || '',
  secondary_tutor_phone: a.secondaryTutorPhone || a.secondary_tutor_phone || '',
  address: a.address || '',
  status: a.status || 'IN_PROGRESS',
  submitted_documents: Array.isArray(a.submittedDocuments) ? a.submittedDocuments : (a.submitted_documents || []),
  form_submissions: Array.isArray(a.formSubmissions) ? a.formSubmissions : (Array.isArray(a.form_submissions) ? a.form_submissions : []),
  custom_form_responses: a.customFormResponses || a.custom_form_responses || {},
  internal_notes: a.internalNotes || a.internal_notes || '',
  enrolled_student_id: a.enrolledStudentId || a.enrolled_student_id || null,
  history: Array.isArray(a.history) ? a.history : [],
  created_at: a.createdAt || a.created_at || new Date().toISOString(),
  updated_at: a.updatedAt || a.updated_at || new Date().toISOString(),
  stage: a.stage ? mapAdmissionStage(a.stage) : undefined,
  target_environment: a.targetEnvironment || a.target_environment ? {
    id: (a.targetEnvironment || a.target_environment).id,
    name: (a.targetEnvironment || a.target_environment).name,
    stage: (a.targetEnvironment || a.target_environment).stage,
    color: (a.targetEnvironment || a.target_environment).color
  } : undefined,
  enrolled_student: a.enrolledStudent || a.enrolled_student ? {
    id: (a.enrolledStudent || a.enrolled_student).id,
    fullName: (a.enrolledStudent || a.enrolled_student).fullName || (a.enrolledStudent || a.enrolled_student).full_name,
    enrollmentCode: (a.enrolledStudent || a.enrolled_student).enrollmentCode || (a.enrolledStudent || a.enrolled_student).enrollment_code,
    status: (a.enrolledStudent || a.enrolled_student).status
  } : undefined
});

// ================= ADMISSION FORM TEMPLATES APIS =================

export async function getAdmissionFormTemplates(): Promise<AdmissionFormTemplateItem[]> {
  const res = await fetch('/api/admissions/forms', { credentials: 'include', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener plantillas de formularios de admisión');
  const data = await res.json();
  return data.map(mapAdmissionFormTemplate);
}

export async function getAdmissionFormTemplate(id: string): Promise<AdmissionFormTemplateItem> {
  const res = await fetch(`/api/admissions/forms/${id}`, { credentials: 'include', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener plantilla de formulario');
  const data = await res.json();
  return mapAdmissionFormTemplate(data);
}

export interface AdmissionFormResponseItem {
  id: string;
  respondentName: string;
  respondentEmail?: string;
  respondentPhone?: string;
  submittedAt: string;
  status: string;
  processType?: 'STANDALONE' | 'ADMISSION' | 'PROMOTION' | 'SURVEY' | string;
  processLabel?: string;
  data: Record<string, any>;
  fieldLabels?: Record<string, string>;
  files: Array<{ fieldId: string; fileName: string; fileUrl: string }>;
  signature?: string | null;
  ip?: string;
  telemetry?: any;
  metadata?: any;
  isReviewed?: boolean;
  is_reviewed?: boolean;
  viewedAt?: string | null;
  viewed_at?: string | null;
}

export async function getAdmissionFormResponses(id: string): Promise<{
  form: AdmissionFormTemplateItem;
  totalResponses: number;
  responses: AdmissionFormResponseItem[];
}> {
  const res = await fetch(`/api/admissions/forms/${id}/responses`, { credentials: 'include', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener respuestas del formulario');
  const result = await res.json();
  return {
    form: mapAdmissionFormTemplate(result.form),
    totalResponses: result.totalResponses || 0,
    responses: (result.responses || []).map((r: any) => ({
      id: r.id,
      respondentName: r.respondentName || r.tutorName || r.filledByName || 'Anónimo',
      respondentEmail: r.respondentEmail || r.tutorEmail || '',
      respondentPhone: r.respondentPhone || r.tutorPhone || '',
      submittedAt: r.submittedAt || new Date().toISOString(),
      status: r.status || 'SUBMITTED',
      processType: r.processType || (r.applicationId ? 'ADMISSION' : 'STANDALONE'),
      processLabel: r.processLabel || (r.applicationId ? 'Proceso de Admisión' : 'Directo / Público'),
      data: r.data || {},
      fieldLabels: r.fieldLabels || {},
      files: Array.isArray(r.files) ? r.files : [],
      signature: r.signature || null,
      isReviewed: Boolean(r.isReviewed ?? r.is_reviewed),
      is_reviewed: Boolean(r.isReviewed ?? r.is_reviewed),
      viewedAt: r.viewedAt || r.viewed_at || null,
      ip: r.ip || r.telemetry?.ip || r.metadata?.ip || null,
      telemetry: r.telemetry || r.metadata || null,
      metadata: r.metadata || r.telemetry || null
    }))
  };
}

export async function markAdmissionFormResponseViewed(formId: string, responseId: string): Promise<{ success: boolean; isReviewed: boolean; viewedAt: string }> {
  const res = await fetch(`/api/admissions/forms/${formId}/responses/${responseId}/mark-viewed`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al marcar respuesta como revisada');
  }
  return res.json();
}

export async function deleteAdmissionFormResponse(formId: string, responseId: string): Promise<void> {
  const res = await fetch(`/api/admissions/forms/${formId}/responses/${responseId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar respuesta del formulario');
  }
}

export async function createAdmissionFormTemplate(data: {
  title: string;
  description?: string;
  category?: string;
  schema?: FormSectionItem[];
  isPublished?: boolean;
}): Promise<AdmissionFormTemplateItem> {
  const res = await fetch('/api/admissions/forms', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear formulario' }));
    throw new Error(err.error || 'Error al crear formulario');
  }
  const result = await res.json();
  return mapAdmissionFormTemplate(result);
}

export async function updateAdmissionFormTemplate(id: string, data: Partial<{
  title: string;
  description: string;
  category: string;
  schema: FormSectionItem[];
  isPublished: boolean;
}>): Promise<AdmissionFormTemplateItem> {
  const res = await fetch(`/api/admissions/forms/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar formulario' }));
    throw new Error(err.error || 'Error al actualizar formulario');
  }
  const result = await res.json();
  return mapAdmissionFormTemplate(result);
}

export async function deleteAdmissionFormTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/admissions/forms/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar formulario' }));
    throw new Error(err.error || 'Error al eliminar formulario');
  }
}

export async function seedDefaultAdmissionFormTemplates(): Promise<AdmissionFormTemplateItem[]> {
  const res = await fetch('/api/admissions/forms/seed-defaults', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al generar formularios predeterminados');
  const result = await res.json();
  return (result.forms || []).map(mapAdmissionFormTemplate);
}

export interface PublicStandaloneFormItem {
  id: string;
  title: string;
  description: string;
  category: string;
  schema: FormSectionItem[];
  layoutStyle: FormLayoutStyle;
  themeColor: string;
  accessType: 'PUBLIC' | 'RESTRICTED_WHITELIST';
  requiresWhitelist: boolean;
  allowMultipleResponses?: boolean;
  hasSubmitted?: boolean;
  pollStats?: any;
  school: {
    id?: string;
    name: string;
    slug?: string;
    logo?: string | null;
    primaryColor?: string;
  };
}

export async function getPublicStandaloneForm(id: string, email?: string): Promise<PublicStandaloneFormItem> {
  const url = email 
    ? `/api/admissions/public/standalone-forms/${id}?email=${encodeURIComponent(email)}`
    : `/api/admissions/public/standalone-forms/${id}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al cargar formulario' }));
    throw new Error(err.error || 'Error al cargar formulario');
  }
  const data = await res.json();
  if (typeof data.schema === 'string') {
    try {
      data.schema = JSON.parse(data.schema);
    } catch (e) {
      data.schema = [];
    }
  }
  if (!Array.isArray(data.schema)) {
    if (data.schema && Array.isArray(data.schema.sections)) {
      data.schema = data.schema.sections;
    } else if (data.schema && Array.isArray(data.schema.schema)) {
      data.schema = data.schema.schema;
    } else {
      data.schema = [];
    }
  }
  const firstSec = Array.isArray(data.schema) ? (data.schema[0] || {}) : {};
  if (data.allowMultipleResponses === undefined) {
    data.allowMultipleResponses = firstSec.allowMultipleResponses !== undefined ? Boolean(firstSec.allowMultipleResponses) : true;
  }
  return data;
}

export async function requestStandaloneFormOTP(id: string, email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/admissions/public/standalone-forms/${id}/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al solicitar código de verificación' }));
    throw new Error(err.error || 'Error al solicitar código de verificación');
  }
  return await res.json();
}

export async function verifyStandaloneFormOTP(id: string, email: string, otp: string): Promise<{ success: boolean; sessionToken: string; verifiedEmail: string }> {
  const res = await fetch(`/api/admissions/public/standalone-forms/${id}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Código de seguridad incorrecto o expirado' }));
    throw new Error(err.error || 'Código de seguridad incorrecto o expirado');
  }
  return await res.json();
}

export async function deleteStandaloneFormSubmission(id: string, email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/admissions/public/standalone-forms/${id}/submissions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar la respuesta' }));
    throw new Error(err.error || 'Error al eliminar la respuesta');
  }
  return await res.json();
}

export async function submitStandaloneForm(id: string, payload: {
  data: Record<string, any>;
  fieldLabels?: Record<string, string>;
  files?: Array<{ fieldId: string; fileName: string; fileUrl: string }>;
  signature?: string | null;
  respondentEmail?: string;
  respondentName?: string;
  childName?: string;
  telemetry?: any;
}): Promise<{ success: boolean; submissionId: string; message: string }> {
  const res = await fetch(`/api/admissions/public/standalone-forms/${id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al enviar formulario' }));
    throw new Error(err.error || 'Error al enviar formulario');
  }
  return await res.json();
}

export async function verifyIdentityBiometrics(payload: {
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
  signatureImage?: string | null;
  docType?: string;
  country?: string;
  minScore?: number;
  matchScore?: number;
  isMatch?: boolean;
  errorMessage?: string;
}): Promise<{
  success: boolean;
  isMatch: boolean;
  matchScore: number;
  threshold: number;
  status: 'verified' | 'failed';
  verifiedAt: string;
  docType?: string;
  ocrData?: Record<string, any>;
  message: string;
}> {
  const res = await fetch('/api/admissions/public/verify-identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al realizar verificación biométrica' }));
    throw new Error(err.error || 'Error al realizar verificación biométrica');
  }
  return await res.json();
}

export async function extractDocumentDataOcr(payload: {
  documentFrontUrl: string;
  documentBackUrl?: string | null;
  signatureImage?: string | null;
  docType?: string;
  schoolId?: string | null;
}): Promise<{
  success: boolean;
  extractedData: Record<string, any>;
  modelUsed?: string;
  processedAt?: string;
}> {
  const res = await fetch('/api/admissions/public/extract-document-ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al extraer OCR del documento' }));
    throw new Error(err.error || 'Error al extraer OCR del documento');
  }
  return await res.json();
}

// ================= PUBLIC EXPEDIENTE PORTAL APIS =================

export async function getAdmissionPortalDossier(token: string, customAuthToken?: string): Promise<{
  isAuthorized: boolean;
  application: any;
  stage: any;
  stages: AdmissionStageItem[];
  school: any;
  requiredForms: Array<StageRequiredFormItem & { template: AdmissionFormTemplateItem | null }>;
  formSubmissions: FormSubmissionItem[];
  isAuthorized?: boolean;
  authToken?: string;
  verifiedEmail?: string;
}> {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlToken = urlParams?.get('auth_token') || urlParams?.get('auth');
  const authToken = customAuthToken !== undefined
    ? customAuthToken
    : (urlToken || (typeof window !== 'undefined' ? sessionStorage.getItem(`portal_auth_${token}`) : null));

  const headers: Record<string, string> = {};
  if (authToken && authToken.trim()) {
    headers['x-portal-auth'] = authToken.trim();
  }

  const qs = (authToken && authToken.trim()) ? `?auth_token=${encodeURIComponent(authToken.trim())}` : '';
  const res = await fetch(`/api/admissions/public/portal/${token}${qs}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al cargar expediente' }));
    throw new Error(err.error || 'Error al cargar expediente');
  }
  const data = await res.json();
  if (data.authToken && typeof window !== 'undefined') {
    sessionStorage.setItem(`portal_auth_${token}`, data.authToken);
  }
  return {
    ...data,
    stages: (data.stages || []).map(mapAdmissionStage),
    requiredForms: (data.requiredForms || []).map((rf: any) => ({
      ...rf,
      template: rf.template ? mapAdmissionFormTemplate(rf.template) : null
    }))
  };
}

export async function requestAdmissionPortalOtp(token: string, email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetch(`/api/admissions/public/portal/${token}/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al solicitar código de verificación' }));
    throw new Error(err.error || 'Error al solicitar código de verificación');
  }
  return await res.json();
}

export async function verifyAdmissionPortalOtp(token: string, email: string, code: string): Promise<{
  success: boolean;
  authToken: string;
  message: string;
}> {
  const res = await fetch(`/api/admissions/public/portal/${token}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al verificar código' }));
    throw new Error(err.error || 'Error al verificar código');
  }
  return await res.json();
}

export async function testSmtpConnection(data: {
  host: string;
  port: string | number;
  user: string;
  pass: string;
  secure?: boolean | string;
  fromName?: string;
  fromEmail?: string;
  testEmail: string;
  verificationCode?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/settings/test-smtp', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al probar conexión SMTP' }));
    throw new Error(err.error || 'Error al probar conexión SMTP');
  }
  return await res.json();
}

export async function testStorageConnection(data: {
  driver: string;
  localRoot?: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3ForcePathStyle?: boolean;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/settings/test-storage', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al probar almacenamiento' }));
    throw new Error(err.error || 'Error al probar almacenamiento');
  }
  return await res.json();
}

export interface SchoolUsageStats {
  emails: {
    isByos: boolean;
    smtpHost?: string;
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
    startOfMonth?: string;
    endOfMonth?: string;
  };
  storage: {
    isByos: boolean;
    limitGb: number;
    limitBytes: number;
    usedBytes: number;
    usedMb: number;
    usedGb: number;
    remainingGb: number;
    percentage: number;
  };
}

export async function getSchoolUsage(): Promise<SchoolUsageStats> {
  const res = await fetch('/api/schools/current/usage', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al obtener consumo de recursos' }));
    throw new Error(err.error || 'Error al obtener consumo de recursos');
  }
  return await res.json();
}

export async function testStorageWebhook(data: {
  webhookUrl: string;
  secretToken?: string;
  includePayload?: boolean;
}): Promise<{ success: boolean; message: string; httpStatus?: number }> {
  const res = await fetch('/api/settings/test-storage-webhook', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al enviar webhook de prueba' }));
    throw new Error(err.error || 'Error al enviar webhook de prueba');
  }
  return await res.json();
}

export async function testCalendarWebhook(data: {
  webhookUrl: string;
  secretToken?: string;
  eventType?: string;
}): Promise<{ success: boolean; message: string; payloadSample?: any }> {
  const res = await fetch('/api/settings/test-calendar-webhook', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al enviar webhook de prueba de calendario' }));
    throw new Error(err.error || 'Error al enviar webhook de prueba de calendario');
  }
  return await res.json();
}

export async function fetchAiModels(data: {
  baseUrl?: string;
  apiKey?: string;
}): Promise<{ success: boolean; count: number; models: string[] }> {
  const res = await fetch('/api/settings/fetch-ai-models', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al consultar modelos del proveedor' }));
    throw new Error(err.error || 'Error al consultar modelos del proveedor');
  }
  return await res.json();
}

export async function testOpenAiConnection(data: {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}): Promise<{ success: boolean; message: string; reply?: string }> {
  const res = await fetch('/api/settings/test-openai', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al probar conexión con el proveedor AI' }));
    throw new Error(err.error || 'Error al probar conexión con el proveedor AI');
  }
  return await res.json();
}

export async function submitAdmissionPortalForm(token: string, data: {
  formTemplateId: string;
  filledByRole?: string;
  filledByName?: string;
  data: Record<string, any>;
  files?: Array<{ fieldId: string; fileName: string; fileUrl: string; fileType?: string; size?: number }>;
  signature?: string | null;
  telemetry?: any;
}): Promise<{
  success: boolean;
  submission: FormSubmissionItem;
  formSubmissions: FormSubmissionItem[];
}> {
  const authToken = typeof window !== 'undefined' ? sessionStorage.getItem(`portal_auth_${token}`) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['x-portal-auth'] = authToken;
  }

  const res = await fetch(`/api/admissions/public/portal/${token}/submit-form`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al enviar formulario' }));
    throw new Error(err.error || 'Error al enviar formulario');
  }
  return await res.json();
}

export async function resetAdmissionPortalForm(token: string, formTemplateId: string): Promise<{ success: boolean; message: string }> {
  const authToken = typeof window !== 'undefined' ? sessionStorage.getItem(`portal_auth_${token}`) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['x-portal-auth'] = authToken;
  }

  const res = await fetch(`/api/admissions/public/portal/${token}/reset-form`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ formTemplateId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al reiniciar formulario' }));
    throw new Error(err.error || 'Error al reiniciar formulario');
  }
  return await res.json();
}

export async function getAdmissionApplicationDossier(id: string): Promise<{
  application: AdmissionApplicationItem;
  submissions: FormSubmissionItem[];
  templates: AdmissionFormTemplateItem[];
}> {
  const res = await fetch(`/api/admissions/applications/${id}/dossier`, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al cargar expediente completo');
  const result = await res.json();
  return {
    application: mapAdmissionApplication(result.application),
    submissions: result.submissions || [],
    templates: (result.templates || []).map(mapAdmissionFormTemplate)
  };
}

// DYNAMIC PROCESSES APIS
export interface ProcessItem {
  id: string;
  schoolId: string;
  name: string;
  slug: string;
  label: string;
  icon: string;
  description?: string;
  isActive: boolean;
  originSource: string;
  targetType: string;
  resolutionAction: string;
  createdAt: string;
  updatedAt: string;
}

export async function getProcesses(): Promise<ProcessItem[]> {
  const res = await fetch('/api/processes', { credentials: 'include', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener los procesos');
  return res.json();
}

export async function createProcess(data: {
  name: string;
  slug: string;
  label?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  originSource?: string;
  targetType?: string;
  resolutionAction?: string;
}): Promise<ProcessItem> {
  const res = await fetch('/api/processes', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear el proceso' }));
    throw new Error(err.error || 'Error al crear el proceso');
  }
  return res.json();
}

export async function updateProcess(id: string, data: Partial<{
  name: string;
  label: string;
  icon: string;
  description: string;
  isActive: boolean;
  originSource: string;
  targetType: string;
  resolutionAction: string;
}>): Promise<ProcessItem> {
  const res = await fetch(`/api/processes/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar el proceso' }));
    throw new Error(err.error || 'Error al actualizar el proceso');
  }
  return res.json();
}

export async function startProcessApplication(processId: string, payload: {
  waitlistEntryId?: string;
  studentId?: string;
  membershipId?: string;
  targetEnvironmentId?: string;
  internalNotes?: string;
}): Promise<any> {
  const res = await fetch(`/api/processes/${processId}/start-application`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al iniciar el proceso' }));
    throw new Error(err.error || 'Error al iniciar el proceso');
  }
  return res.json();
}

export async function deleteProcess(id: string): Promise<void> {
  const res = await fetch(`/api/processes/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar el proceso' }));
    throw new Error(err.error || 'Error al eliminar el proceso');
  }
}

// ADMISSION STAGES APIS
export async function getAdmissionStages(processId?: string): Promise<AdmissionStageItem[]> {
  const url = processId ? `/api/admissions/stages?processId=${processId}` : '/api/admissions/stages';
  const res = await fetch(url, { credentials: 'include', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener etapas de admisión');
  const data = await res.json();
  return data.map(mapAdmissionStage);
}

export async function createAdmissionStage(data: {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  isTerminalRejected?: boolean;
  requiredDocuments?: string[];
  requiredForms?: StageRequiredFormItem[];
  formQuestions?: any[];
  hooksConfig?: Record<string, any>;
  processId?: string;
}): Promise<AdmissionStageItem> {
  const res = await fetch('/api/admissions/stages', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear etapa de admisión' }));
    throw new Error(err.error || 'Error al crear etapa de admisión');
  }
  const result = await res.json();
  return mapAdmissionStage(result);
}

export async function updateAdmissionStage(id: string, data: Partial<{
  name: string;
  slug: string;
  description: string;
  color: string;
  orderIndex: number;
  isInitial: boolean;
  isFinal: boolean;
  isTerminalRejected: boolean;
  requiredDocuments: string[];
  requiredForms: StageRequiredFormItem[];
  formQuestions: any[];
  hooksConfig: Record<string, any>;
}>): Promise<AdmissionStageItem> {
  const res = await fetch(`/api/admissions/stages/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar etapa' }));
    throw new Error(err.error || 'Error al actualizar etapa');
  }
  const result = await res.json();
  return mapAdmissionStage(result);
}

export async function deleteAdmissionStage(id: string): Promise<void> {
  const res = await fetch(`/api/admissions/stages/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar etapa' }));
    throw new Error(err.error || 'Error al eliminar etapa');
  }
}

export async function reorderAdmissionStages(stageOrders: Array<{ id: string; orderIndex: number }>): Promise<void> {
  const res = await fetch('/api/admissions/stages/reorder', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify({ stageOrders })
  });
  if (!res.ok) throw new Error('Error al reordenar etapas');
}

// ADMISSION APPLICATIONS APIS
export async function getAdmissionApplications(filters?: {
  stageId?: string;
  status?: string;
  environmentId?: string;
  search?: string;
  processId?: string;
}): Promise<AdmissionApplicationItem[]> {
  const params = new URLSearchParams();
  if (filters?.stageId) params.append('stageId', filters.stageId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.environmentId) params.append('environmentId', filters.environmentId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.processId) params.append('processId', filters.processId);

  const res = await fetch(`/api/admissions/applications?${params.toString()}`, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener expedientes de admisión');
  const data = await res.json();
  return data.map(mapAdmissionApplication);
}

export async function getAdmissionApplication(id: string): Promise<AdmissionApplicationItem> {
  const res = await fetch(`/api/admissions/applications/${id}`, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener expediente de admisión');
  const data = await res.json();
  return mapAdmissionApplication(data);
}

export async function createAdmissionApplication(data: {
  stageId?: string;
  childFirstName?: string;
  childLastName?: string;
  childName: string;
  birthDate?: string | null;
  gender?: string;
  targetEnvironmentId?: string | null;
  targetEnvironmentIds?: string[];
  preferredStartDate?: string | null;
  previousSchool?: string;
  previousMethodology?: string;
  tutorName: string;
  tutorEmail?: string;
  tutorPhone?: string;
  tutorRelationship?: string;
  secondaryTutorName?: string;
  secondaryTutorPhone?: string;
  address?: string;
  internalNotes?: string;
  submittedDocuments?: AdmissionDocumentItem[];
  customFormResponses?: Record<string, any>;
  processId?: string;
}): Promise<AdmissionApplicationItem> {
  const res = await fetch('/api/admissions/applications', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al registrar aspirante' }));
    throw new Error(err.error || 'Error al registrar aspirante');
  }
  const result = await res.json();
  return mapAdmissionApplication(result);
}

export async function updateAdmissionApplication(id: string, data: Partial<{
  childFirstName: string;
  childLastName: string;
  childName: string;
  birthDate: string | null;
  gender: string;
  targetEnvironmentId: string | null;
  targetEnvironmentIds: string[];
  preferredStartDate: string | null;
  previousSchool: string;
  previousMethodology: string;
  tutorName: string;
  tutorEmail: string;
  tutorPhone: string;
  tutorRelationship: string;
  secondaryTutorName: string;
  secondaryTutorPhone: string;
  address: string;
  status: string;
  internalNotes: string;
  submittedDocuments: AdmissionDocumentItem[];
  customFormResponses: Record<string, any>;
}>): Promise<AdmissionApplicationItem> {
  const res = await fetch(`/api/admissions/applications/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar expediente' }));
    throw new Error(err.error || 'Error al actualizar expediente');
  }
  const result = await res.json();
  return mapAdmissionApplication(result);
}

export async function moveAdmissionApplicationStage(id: string, targetStageId: string, transitionNotes?: string): Promise<{
  application: AdmissionApplicationItem;
  hooksTriggered: any;
}> {
  const res = await fetch(`/api/admissions/applications/${id}/move-stage`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify({ targetStageId, transitionNotes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al cambiar etapa del aspirante' }));
    throw new Error(err.error || 'Error al cambiar etapa del aspirante');
  }
  const result = await res.json();
  return {
    application: mapAdmissionApplication(result.application),
    hooksTriggered: result.hooksTriggered
  };
}

export async function enrollAdmissionApplication(id: string, data: {
  environmentId?: string;
  enrollmentCode?: string;
  enrollmentDate?: string;
  grade?: string;
  bloodType?: string;
  allergies?: string;
  foodAllergies?: string[];
  medicalNotes?: string;
  internalNotes?: string;
}): Promise<{ student: StudentItem; application: AdmissionApplicationItem }> {
  const res = await fetch(`/api/admissions/applications/${id}/enroll`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al formalizar matrícula' }));
    throw new Error(err.error || 'Error al formalizar matrícula');
  }
  const result = await res.json();
  return {
    student: result.student,
    application: mapAdmissionApplication(result.application)
  };
}

export async function deleteAdmissionApplication(id: string): Promise<void> {
  const res = await fetch(`/api/admissions/applications/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar expediente de admisión' }));
    throw new Error(err.error || 'Error al eliminar expediente de admisión');
  }
}

export async function linkTutorToStudent(studentId: string, tutor: {
  userId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  relationship: string;
  isPrimaryContact?: boolean;
  authorizedPickUp?: boolean;
  password?: string;
}): Promise<any> {
  const res = await fetch(`/api/students/${studentId}/tutors`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tutor)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al vincular tutor' }));
    throw new Error(err.error || 'Error al vincular tutor');
  }
  return await res.json();
}

export async function unlinkTutorFromStudent(studentId: string, tutorUserId: string): Promise<void> {
  await fetch(`/api/students/${studentId}/tutors/${tutorUserId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
}

export async function getMyTutorStudents(email: string): Promise<StudentItem[]> {
  try {
    const res = await fetch(`/api/tutor/my-students?email=${encodeURIComponent(email)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((s: any) => ({
      id: s.id,
      school_id: s.schoolId,
      full_name: s.fullName,
      grade: s.grade || '',
      enrollment_code: s.enrollmentCode || '',
      date_of_birth: s.dateOfBirth,
      status: s.status,
      relationship: s.relationship,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));
  } catch (e) {
    console.error('getMyTutorStudents error', e);
    return [];
  }
}

// FOLDERS API
export async function getFolders(): Promise<Folder[]> {
  try {
    const res = await fetch('/api/folders', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapFolder);
  } catch (e) {
    console.error('getFolders error', e);
    return [];
  }
}

export async function createFolder(
  title: string, 
  description: string, 
  accessType: AccessType,
  title_en?: string,
  description_en?: string
): Promise<Folder> {
  const res = await fetch('/api/folders', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title,
      description,
      titleEn: title_en || '',
      descriptionEn: description_en || '',
      accessType,
    }),
  });
  const data = await res.json();
  return mapFolder(data);
}

export async function updateFolder(
  id: string, 
  title: string, 
  description: string, 
  accessType: AccessType,
  title_en?: string,
  description_en?: string
): Promise<void> {
  await fetch(`/api/folders/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title,
      description,
      titleEn: title_en || '',
      descriptionEn: description_en || '',
      accessType,
    }),
  });
}

export async function deleteFolder(id: string): Promise<void> {
  await fetch(`/api/folders/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
}

// DOCUMENTS API
export async function getDocuments(folderId?: string): Promise<DocumentItem[]> {
  try {
    const url = folderId ? `/api/documents?folderId=${encodeURIComponent(folderId)}` : '/api/documents';
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapDocument);
  } catch (e) {
    console.error('getDocuments error', e);
    return [];
  }
}

export async function createDocument(doc: {
  folder_id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  access_type: AccessType;
  file_name: string;
  file_type: string;
  file_data: string;
}): Promise<DocumentItem> {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      folderId: doc.folder_id,
      title: doc.title,
      description: doc.description,
      titleEn: doc.title_en || '',
      descriptionEn: doc.description_en || '',
      accessType: doc.access_type,
      fileName: doc.file_name,
      fileType: doc.file_type,
      fileData: doc.file_data,
    }),
  });
  const data = await res.json();
  return mapDocument(data);
}

export async function updateDocument(id: string, doc: {
  folder_id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  access_type: AccessType;
  file_name?: string;
  file_type?: string;
  file_data?: string;
}): Promise<void> {
  const payload: any = {
    folderId: doc.folder_id,
    title: doc.title,
    description: doc.description,
    titleEn: doc.title_en || '',
    descriptionEn: doc.description_en || '',
    accessType: doc.access_type,
  };
  if (doc.file_name) payload.fileName = doc.file_name;
  if (doc.file_type) payload.fileType = doc.file_type;
  if (doc.file_data) payload.fileData = doc.file_data;

  await fetch(`/api/documents/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await fetch(`/api/documents/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
}

// APPLICATIONS API
export async function getApplications(): Promise<ApplicationItem[]> {
  try {
    const res = await fetch('/api/applications', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapApplication);
  } catch (e) {
    console.error('getApplications error', e);
    return [];
  }
}

export async function createApplication(app: {
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  icon_url: string;
  links: { label: string; label_en?: string; url: string }[];
}): Promise<ApplicationItem> {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: app.title,
      description: app.description,
      titleEn: app.title_en || '',
      descriptionEn: app.description_en || '',
      iconUrl: app.icon_url,
      links: app.links.map(l => ({
        label: l.label,
        labelEn: l.label_en || '',
        url: l.url,
      })),
    }),
  });
  const data = await res.json();
  return mapApplication(data);
}

export async function updateApplication(id: string, app: {
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  icon_url: string;
  links: { label: string; label_en?: string; url: string }[];
}): Promise<void> {
  await fetch(`/api/applications/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: app.title,
      description: app.description,
      titleEn: app.title_en || '',
      descriptionEn: app.description_en || '',
      iconUrl: app.icon_url,
      links: app.links.map(l => ({
        label: l.label,
        labelEn: l.label_en || '',
        url: l.url,
      })),
    }),
  });
}

export async function deleteApplication(id: string): Promise<void> {
  await fetch(`/api/applications/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
}

// GALLERY API
export async function getGalleryCategories(): Promise<GalleryCategory[]> {
  try {
    const res = await fetch('/api/gallery/categories', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapGalleryCategory);
  } catch (e) {
    console.error('getGalleryCategories error', e);
    return [];
  }
}

export async function createGalleryCategory(cat: {
  id?: string;
  label: string;
  label_en?: string;
  translations?: Record<string, string>;
}): Promise<GalleryCategory> {
  const res = await fetch('/api/gallery/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      id: cat.id,
      label: cat.label,
      labelEn: cat.label_en || '',
      translations: cat.translations || {},
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al crear la categoría');
  }
  return mapGalleryCategory(data);
}

export async function updateGalleryCategory(id: string, cat: {
  label?: string;
  label_en?: string;
  translations?: Record<string, string>;
}): Promise<GalleryCategory> {
  const res = await fetch(`/api/gallery/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      label: cat.label,
      labelEn: cat.label_en || '',
      translations: cat.translations || {},
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al actualizar la categoría');
  }
  return mapGalleryCategory(data);
}

export async function deleteGalleryCategory(id: string): Promise<void> {
  await fetch(`/api/gallery/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
}

export async function getGalleryImages(categoryId?: string, target?: 'web' | 'portal'): Promise<GalleryImageItem[]> {
  try {
    const params = new URLSearchParams();
    if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
    if (target) params.append('target', target);
    const qs = params.toString();
    const url = qs ? `/api/gallery/images?${qs}` : '/api/gallery/images';
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapGalleryImage);
  } catch (e) {
    console.error('getGalleryImages error', e);
    return [];
  }
}

export async function createGalleryImage(img: {
  category_id: string;
  src: string;
  title?: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  translations?: Record<string, { title: string; description: string }>;
  ai_status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'MANUAL';
  aiAutoGenerate?: boolean;
  show_on_web?: boolean;
  show_on_portal?: boolean;
}): Promise<GalleryImageItem> {
  const res = await fetch('/api/gallery/images', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      categoryId: img.category_id,
      src: img.src,
      title: img.title || '',
      titleEn: img.title_en || '',
      description: img.description || '',
      descriptionEn: img.description_en || '',
      translations: img.translations || {},
      aiStatus: img.ai_status,
      aiAutoGenerate: img.aiAutoGenerate,
      showOnWeb: img.show_on_web !== false,
      showOnPortal: img.show_on_portal !== false,
    }),
  });
  const data = await res.json();
  return mapGalleryImage(data);
}

export async function updateGalleryImage(id: string, img: {
  category_id: string;
  src?: string;
  title?: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  translations?: Record<string, { title: string; description: string }>;
  ai_status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'MANUAL';
  show_on_web?: boolean;
  show_on_portal?: boolean;
}): Promise<void> {
  const payload: any = {
    categoryId: img.category_id,
  };
  if (img.title !== undefined) payload.title = img.title;
  if (img.title_en !== undefined) payload.titleEn = img.title_en;
  if (img.description !== undefined) payload.description = img.description;
  if (img.description_en !== undefined) payload.descriptionEn = img.description_en;
  if (img.src) payload.src = img.src;
  if (img.translations) payload.translations = img.translations;
  if (img.ai_status) payload.aiStatus = img.ai_status;
  if (img.show_on_web !== undefined) payload.showOnWeb = img.show_on_web;
  if (img.show_on_portal !== undefined) payload.showOnPortal = img.show_on_portal;

  await fetch(`/api/gallery/images/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function retryGalleryImageAi(id: string): Promise<{ success: boolean; image?: GalleryImageItem }> {
  const res = await fetch(`/api/gallery/images/${id}/retry-ai`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return {
    success: data.success,
    image: data.image ? mapGalleryImage(data.image) : undefined
  };
}

export async function retryAllFailedGalleryAi(): Promise<{ success: boolean; count: number }> {
  const res = await fetch('/api/gallery/images/retry-failed-ai', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return {
    success: data.success,
    count: data.count || 0
  };
}

export async function verifyGalleryImageConsent(id: string): Promise<any> {
  const res = await fetch(`/api/gallery/images/${id}/verify-consent`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al verificar consentimiento facial');
  }
  return {
    ...data,
    image: data.image ? mapGalleryImage(data.image) : undefined
  };
}

export async function scanAllGalleryConsents(): Promise<{ total: number; results: any[] }> {
  const res = await fetch('/api/gallery/scan-all-consents', {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al escanear consentimientos de la galería');
  }
  return data;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await fetch(`/api/gallery/images/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
}

export async function migrateHardcodedGallery(force: boolean = false): Promise<{ categoriesCount: number; imagesCount: number }> {
  try {
    const res = await fetch('/api/gallery/migrate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ force }),
    });
    return await res.json();
  } catch (e) {
    console.error('migrateHardcodedGallery error', e);
    return { categoriesCount: 0, imagesCount: 0 };
  }
}

// GLOBAL ACCESS CODE API
export async function getGlobalAccessCode(): Promise<GlobalAccessCode | null> {
  try {
    const res = await fetch('/api/access-code', { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    return {
      code: data.code,
      expires_at: data.expiresAt,
      created_at: data.createdAt,
    };
  } catch (e) {
    console.error('getGlobalAccessCode error', e);
    return null;
  }
}

export async function setGlobalAccessCode(code: string, expiresAt: string): Promise<GlobalAccessCode> {
  const res = await fetch('/api/access-code', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code, expiresAt }),
  });
  const data = await res.json();
  return {
    code: data.code,
    expires_at: data.expiresAt,
    created_at: data.createdAt,
  };
}

export async function validateGlobalAccessCode(inputCode: string): Promise<{ valid: boolean; error?: string }> {
  const current = await getGlobalAccessCode();
  if (!current) {
    return { valid: false, error: 'No se ha configurado ningún código de autorización global.' };
  }

  if (current.code.trim().toUpperCase() !== inputCode.trim().toUpperCase()) {
    return { valid: false, error: 'El código de autorización ingresado es incorrecto.' };
  }

  const now = new Date();
  const expDate = new Date(current.expires_at);
  if (now > expDate) {
    return { 
      valid: false, 
      error: `El código de autorización caducó el ${expDate.toLocaleDateString()} a las ${expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` 
    };
  }

  return { valid: true };
}

// SITE SETTINGS API
export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch('/api/settings', { headers: getAuthHeaders() });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('getSiteSettings error', e);
    return {};
  }
}

export async function updateSiteSettings(newSettings: Record<string, string>): Promise<void> {
  await fetch('/api/settings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(newSettings),
  });
}

// AUTH API
export async function loginUser(email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  memberships?: SchoolMembership[];
  activeMembership?: SchoolMembership;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: e.message || 'Error de conexión' };
  }
}

export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.valid;
  } catch (e) {
    console.error('verifyUserPassword error', e);
    return false;
  }
}

export async function updateAdminPassword(email: string, newPassword: string): Promise<void> {
  await fetch('/api/auth/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
}

export async function getAuthUserProfile(email?: string): Promise<{
  user: any;
  membership: any;
}> {
  const schoolId = localStorage.getItem('ceiba_active_school_id') || '';
  const schoolSlug = localStorage.getItem('ceiba_active_school_slug') || 'ceiba';
  const userEmail = email || localStorage.getItem('ceiba_user_email') || '';

  const headers: Record<string, string> = {};
  if (schoolId) headers['x-school-id'] = schoolId;
  if (schoolSlug) headers['x-school-slug'] = schoolSlug;
  if (userEmail) headers['x-user-email'] = userEmail;

  const res = await fetch(`/api/auth/profile${userEmail ? `?email=${encodeURIComponent(userEmail)}` : ''}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error('Error al obtener perfil');
  }
  return await res.json();
}

export async function updateUserProfile(
  email: string, 
  fullName: string, 
  phone?: string,
  extra?: {
    jobTitle?: string;
    staffRole?: string;
    certifications?: string;
    practiceStartYear?: number | null;
    yearsOfExperience?: number;
    bio?: string;
    isTeachingStaff?: boolean;
  }
): Promise<{ id: string; email: string; fullName: string; phone?: string; user?: any; membership?: any }> {
  const schoolId = localStorage.getItem('ceiba_active_school_id') || '';
  const schoolSlug = localStorage.getItem('ceiba_active_school_slug') || 'ceiba';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (schoolId) headers['x-school-id'] = schoolId;
  if (schoolSlug) headers['x-school-slug'] = schoolSlug;
  if (email) headers['x-user-email'] = email;

  const res = await fetch('/api/auth/profile', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, fullName, phone, ...extra }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar perfil' }));
    throw new Error(err.error || 'Error al actualizar perfil');
  }
  const data = await res.json();
  return { ...data.user, user: data.user, membership: data.membership };
}

export async function uploadFile(file: File, folder: string = 'gallery'): Promise<{ url: string; fileName: string; size: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const schoolId = localStorage.getItem('ceiba_active_school_id') || '';
  const schoolSlug = localStorage.getItem('ceiba_active_school_slug') || 'ceiba';
  const userEmail = localStorage.getItem('ceiba_user_email') || '';

  const headers: Record<string, string> = {};
  if (schoolId) headers['x-school-id'] = schoolId;
  if (schoolSlug) headers['x-school-slug'] = schoolSlug;
  if (userEmail) headers['x-user-email'] = userEmail;

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al subir archivo' }));
    throw new Error(err.error || 'Error al subir archivo');
  }

  return await res.json();
}

export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) return false;
  // Skip data URLs or external CDN assets that don't belong to our storage
  const isLocalStorageUrl = fileUrl.includes('/api/storage') || fileUrl.includes('/gallery/') || fileUrl.startsWith('schools/');
  if (!isLocalStorageUrl) return false;

  const schoolId = localStorage.getItem('ceiba_active_school_id') || '';
  const schoolSlug = localStorage.getItem('ceiba_active_school_slug') || 'ceiba';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (schoolId) headers['x-school-id'] = schoolId;
  if (schoolSlug) headers['x-school-slug'] = schoolSlug;

  try {
    const res = await fetch('/api/storage', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ url: fileUrl }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[STORAGE DELETE] Failed to delete file:', err);
    return false;
  }
}

// GUIDES & DOCENTES (EQUIPO DOCENTE) API
export interface GuideUserItem {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  staffRole?: 'LEAD_GUIDE' | 'ASSISTANT' | 'SPECIALIST' | 'COORDINATOR' | 'SUPPORT' | 'EXECUTIVE' | 'OTHER';
  certifications?: string;
  practiceStartYear?: number | null;
  yearsOfExperience?: number;
  bio?: string;
  socialLinkedin?: string;
  socialX?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  supervisorId?: string | null;
  supervisor?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    staffRole?: string;
    jobTitle?: string;
  } | null;
  role: 'TEACHER' | 'STAFF' | 'OWNER' | 'ADMIN';
  isOwner?: boolean;
  environments: Array<{
    id: string;
    name: string;
    stage?: string;
    color?: string;
    isLead?: boolean;
  }>;
  supervisors?: Array<{
    id: string;
    fullName: string;
    avatarUrl?: string;
    staffRole?: string;
    jobTitle?: string;
  }> | null;
  supervisorIds?: string[];
  permissions?: string[] | Record<string, any> | null;
}

export async function getGuides(): Promise<GuideUserItem[]> {
  try {
    const res = await fetch('/api/guides', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getGuides error', e);
    return [];
  }
}

export async function createGuide(data: {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  staffRole?: 'LEAD_GUIDE' | 'ASSISTANT' | 'SPECIALIST' | 'COORDINATOR' | 'SUPPORT' | 'EXECUTIVE' | 'OTHER';
  certifications?: string;
  practiceStartYear?: number | null;
  yearsOfExperience?: number;
  bio?: string;
  rfc?: string;
  curp?: string;
  socialLinkedin?: string;
  socialX?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  supervisorId?: string | null;
  supervisorIds?: string[];
  password?: string;
  role?: 'TEACHER' | 'STAFF';
  environmentIds?: string[];
  permissions?: string[] | null;
}): Promise<any> {
  const res = await fetch('/api/guides', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al registrar miembro del equipo docente' }));
    throw new Error(err.error || 'Error al registrar miembro del equipo docente');
  }
  return await res.json();
}

export async function updateGuide(id: string, data: {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  staffRole?: 'LEAD_GUIDE' | 'ASSISTANT' | 'SPECIALIST' | 'COORDINATOR' | 'SUPPORT' | 'EXECUTIVE' | 'OTHER';
  certifications?: string;
  practiceStartYear?: number | null;
  yearsOfExperience?: number;
  bio?: string;
  rfc?: string;
  curp?: string;
  socialLinkedin?: string;
  socialX?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  supervisorId?: string | null;
  supervisorIds?: string[];
  role?: 'TEACHER' | 'STAFF';
  environmentIds?: string[];
  permissions?: string[] | null;
}): Promise<any> {
  const res = await fetch(`/api/guides/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar información docente' }));
    throw new Error(err.error || 'Error al actualizar información docente');
  }
  return await res.json();
}

export async function deleteGuide(id: string): Promise<void> {
  await fetch(`/api/guides/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
}

export interface UserDocumentItem {
  id: string;
  userId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export async function getGuideDocuments(guideId: string): Promise<UserDocumentItem[]> {
  const res = await fetch(`/api/guides/${guideId}/documents`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener documentos del docente');
  return await res.json();
}

export async function addGuideDocument(guideId: string, data: {
  name: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}): Promise<UserDocumentItem> {
  const res = await fetch(`/api/guides/${guideId}/documents`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al agregar documento' }));
    throw new Error(err.error || 'Error al agregar documento');
  }
  return await res.json();
}

export async function updateGuideDocument(guideId: string, docId: string, data: { name: string }): Promise<UserDocumentItem> {
  const res = await fetch(`/api/guides/${guideId}/documents/${docId}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar documento' }));
    throw new Error(err.error || 'Error al actualizar documento');
  }
  return await res.json();
}

export async function deleteGuideDocument(guideId: string, docId: string): Promise<void> {
  const res = await fetch(`/api/guides/${guideId}/documents/${docId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar documento' }));
    throw new Error(err.error || 'Error al eliminar documento');
  }
}

// MONTESSORI SCOPE & SEQUENCE API
export interface LessonMediaAsset {
  id: string;
  type: 'image' | 'video' | 'document';
  title: string;
  url: string;
  description?: string;
}

export interface MontessoriLessonItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  pedagogicalPurpose?: string; // Solo visible para Guías y Staff Docente
  parentInfo?: string; // Información comprensible y recomendaciones para Padres de Familia
  mediaAssets?: LessonMediaAsset[] | string; // Assets: fotos del material, videos demostrativos, PDFs de guía
  minAgeYears?: number;
  maxAgeYears?: number;
  sortOrder?: number;
}

export interface MontessoriCategoryItem {
  id: string;
  areaId: string;
  name: string;
  description?: string;
  sortOrder?: number;
  lessons: MontessoriLessonItem[];
}

export interface MontessoriAreaItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
  sortOrder?: number;
  categories: MontessoriCategoryItem[];
}

export interface StudentProgressItem {
  id: string;
  studentId: string;
  lessonId: string;
  guideUserId?: string;
  status: 'PRESENTED' | 'PRACTICING' | 'MASTERED' | 'NEEDS_REVIEW';
  presentedAt?: string;
  masteredAt?: string;
  notes?: string;
  lesson?: MontessoriLessonItem & {
    category?: MontessoriCategoryItem & {
      area?: MontessoriAreaItem;
    };
  };
}

export async function getMontessoriCurriculum(): Promise<MontessoriAreaItem[]> {
  try {
    const res = await fetch('/api/montessori/curriculum', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getMontessoriCurriculum error', e);
    return [];
  }
}

export async function saveMontessoriLesson(data: {
  id?: string;
  categoryId: string;
  name: string;
  pedagogicalPurpose?: string;
  parentInfo?: string;
  mediaAssets?: LessonMediaAsset[] | string;
  description?: string;
  minAgeYears?: number | null;
  maxAgeYears?: number | null;
  sortOrder?: number;
}): Promise<MontessoriLessonItem> {
  const res = await fetch('/api/montessori/lessons', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar ficha de trabajo' }));
    throw new Error(err.error || 'Error al guardar ficha de trabajo');
  }
  return await res.json();
}

export async function deleteMontessoriLesson(id: string): Promise<boolean> {
  const res = await fetch(`/api/montessori/lessons/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar ficha de trabajo' }));
    throw new Error(err.error || 'Error al eliminar ficha de trabajo');
  }
  return true;
}

export async function saveMontessoriCategory(data: {
  id?: string;
  areaId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}): Promise<any> {
  const res = await fetch('/api/montessori/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar categoría' }));
    throw new Error(err.error || 'Error al guardar categoría');
  }
  return await res.json();
}

export async function deleteMontessoriCategory(id: string): Promise<boolean> {
  const res = await fetch(`/api/montessori/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar categoría' }));
    throw new Error(err.error || 'Error al eliminar categoría');
  }
  return true;
}

export interface EnvironmentMaterialItem {
  id: string;
  environmentId: string;
  name: string;
  areaName: string;
  categoryName?: string;
  description?: string;
  pedagogicalPurpose?: string;
  skillsDeveloped?: string;
  photoUrl?: string;
  isActive: boolean;
  sortOrder?: number;
  lessonId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function getEnvironmentMaterials(environmentId: string): Promise<EnvironmentMaterialItem[]> {
  try {
    const res = await fetch(`/api/environments/${environmentId}/materials`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getEnvironmentMaterials error', e);
    return [];
  }
}

export async function saveEnvironmentMaterial(environmentId: string, data: Partial<EnvironmentMaterialItem>): Promise<EnvironmentMaterialItem> {
  const res = await fetch(`/api/environments/${environmentId}/materials`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar material' }));
    throw new Error(err.error || 'Error al guardar material');
  }
  return await res.json();
}

export async function deleteEnvironmentMaterial(environmentId: string, materialId: string): Promise<boolean> {
  const res = await fetch(`/api/environments/${environmentId}/materials/${materialId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al eliminar material' }));
    throw new Error(err.error || 'Error al eliminar material');
  }
  return true;
}

export async function getMontessoriProgress(params?: { studentId?: string; environmentId?: string }): Promise<StudentProgressItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.environmentId) query.set('environmentId', params.environmentId);

    const res = await fetch(`/api/montessori/progress?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getMontessoriProgress error', e);
    return [];
  }
}

export async function saveMontessoriProgress(data: {
  studentId: string;
  lessonId: string;
  status: string;
  notes?: string;
  presentedAt?: string;
  masteredAt?: string;
}): Promise<StudentProgressItem> {
  const res = await fetch('/api/montessori/progress', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al registrar progreso' }));
    throw new Error(err.error || 'Error al registrar progreso');
  }
  return await res.json();
}

export interface StudentObservationItem {
  id: string;
  schoolId: string;
  studentId: string;
  guideUserId: string;
  content: string;
  photoUrl?: string;
  isPublic: boolean;
  createdAt: string;
  student?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    grade?: string;
  };
}

export async function getMontessoriObservations(studentId?: string): Promise<StudentObservationItem[]> {
  try {
    const url = studentId ? `/api/montessori/observations?studentId=${studentId}` : '/api/montessori/observations';
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getMontessoriObservations error', e);
    return [];
  }
}

export async function createMontessoriObservation(data: {
  studentId: string;
  content: string;
  photoUrl?: string;
  isPublic?: boolean;
}): Promise<StudentObservationItem> {
  const res = await fetch('/api/montessori/observations', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar observación' }));
    throw new Error(err.error || 'Error al guardar observación');
  }
  return await res.json();
}

export interface StudentAttendanceItem {
  id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'TARDY' | 'EXCUSED';
  note?: string;
  student?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export async function getMontessoriAttendance(params: { environmentId?: string; date?: string }): Promise<StudentAttendanceItem[]> {
  try {
    const query = new URLSearchParams();
    if (params.environmentId) query.set('environmentId', params.environmentId);
    if (params.date) query.set('date', params.date);

    const res = await fetch(`/api/montessori/attendance?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getMontessoriAttendance error', e);
    return [];
  }
}

export async function saveMontessoriAttendance(date: string, records: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' | 'TARDY' | 'EXCUSED'; note?: string }>): Promise<any> {
  const res = await fetch('/api/montessori/attendance', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ date, records })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar asistencia' }));
    throw new Error(err.error || 'Error al guardar asistencia');
  }
  return await res.json();
}

// ==========================================
// MONTESSORI PROGRESS REPORT TYPES & API
// ==========================================
export interface ReportLessonItem {
  id: string;
  name: string;
  categoryName: string;
  pedagogicalPurpose?: string;
  masteredAt?: string;
  presentedAt?: string;
  notes?: string;
}

export interface ReportCategoryLesson {
  id: string;
  name: string;
  criteria: string;
  status: 'MASTERED' | 'PRACTICING' | 'PRESENTED' | 'NEEDS_REVIEW' | 'NOT_STARTED';
  presentedAt?: string | null;
  masteredAt?: string | null;
  notes?: string | null;
}

export interface ReportCategoryItem {
  id: string;
  name: string;
  lessons: ReportCategoryLesson[];
}

export interface ReportAreaBreakdown {
  areaId: string;
  areaName: string;
  color: string;
  description: string;
  totalLessons: number;
  masteryPercentage: number;
  masteredCount: number;
  practicingCount: number;
  presentedCount: number;
  needsReviewCount: number;
  categories?: ReportCategoryItem[];
  masteredLessons: ReportLessonItem[];
  practicingLessons: ReportLessonItem[];
}

export interface StudentProgressReportData {
  reportTitle: string;
  termName: string;
  generatedAt: string;
  school: {
    id: string;
    name: string;
    slug: string;
    address?: string;
    website?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  student: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    grade?: string;
    dateOfBirth?: string;
    ageString?: string;
    enrollmentCode?: string;
    environmentName: string;
    environmentStage: string;
    environmentColor: string;
    tutors: Array<{
      name: string;
      email: string;
      phone?: string;
      relationship?: string;
    }>;
  };
  leadGuides: Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
  statistics: {
    totalCurriculumLessons: number;
    totalMastered: number;
    totalPracticing: number;
    totalPresented: number;
    overallMasteryPct: number;
  };
  areaBreakdown: ReportAreaBreakdown[];
  studentReflection?: string;
  academicSummary?: string;
  skillsSummary?: string;
  workHabits?: Array<{
    category: string;
    skill: string;
  }>;
  observations: StudentObservationItem[];
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    tardyDays: number;
    attendanceRate: number;
    records?: Array<{
      date: string;
      status: 'PRESENT' | 'ABSENT' | 'TARDY' | 'EXCUSED';
      note?: string;
    }>;
  };
}

export async function getStudentProgressReport(
  studentId: string, 
  params?: { startDate?: string; endDate?: string; termName?: string }
): Promise<StudentProgressReportData> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.termName) query.set('termName', params.termName);

  const res = await fetch(`/api/montessori/reports/student/${studentId}?${query.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al generar reporte de progreso' }));
    throw new Error(err.error || 'Error al generar reporte de progreso');
  }

  return await res.json();
}

// ==========================================
// SCHOOL EVENTS & SCHEDULING (CALENDARIO) TYPES & API
// ==========================================

export interface EventCategoryItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description?: string;
  isDefault: boolean;
}

export interface EventHostItem {
  id: string;
  userId: string;
  roleTitle?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface EventVolunteerItem {
  id: string;
  tutorUserId: string;
  roleDescription?: string;
  tutor: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

export interface EventSlotItem {
  id: string;
  name?: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isLocked: boolean;
  bookings?: EventBookingItem[];
}

export interface EventBookingItem {
  id: string;
  eventId?: string;
  slotId?: string;
  studentId?: string;
  tutorUserId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestsCount: number;
  status: 'CONFIRMED' | 'DECLINED' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt: string;
  student?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    status?: string;
    grade?: string;
    environment?: {
      id: string;
      name: string;
      stage?: string;
      color?: string;
    };
  };
  tutor?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  slot?: {
    id: string;
    startTime: string;
    endTime: string;
  };
}

export interface SchoolEventItem {
  id: string;
  schoolId: string;
  categoryId: string;
  title: string;
  description?: string;
  location?: string;
  coverImage?: string;
  eventType: 'OPEN_MASSIVE' | 'SLOT_BOOKING';
  targetScope: 'ALL_SCHOOL' | 'ENVIRONMENTS' | 'STUDENTS' | 'EXTERNAL_GUESTS';
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  isClosed: boolean;
  startDateTime: string;
  endDateTime: string;
  slotDurationMinutes?: number;
  maxBookingsPerSlot?: number;
  summaryNotes?: string;
  photoUrls?: string[];
  attachments?: Array<{ title: string; url: string; type?: string; size?: number }>;
  createdAt: string;
  category?: EventCategoryItem;
  hosts?: EventHostItem[];
  volunteers?: EventVolunteerItem[];
  targetEnvironments?: Array<{ environment: { id: string; name: string; color?: string; stage?: string } }>;
  targetStudents?: Array<{ student: { id: string; fullName: string; avatarUrl?: string; environmentId?: string } }>;
  slots?: EventSlotItem[];
  bookings?: EventBookingItem[];
}

export async function getEventCategories(): Promise<EventCategoryItem[]> {
  try {
    const res = await fetch('/api/events/categories', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getEventCategories error', e);
    return [];
  }
}

export async function createEventCategory(data: { name: string; color?: string; icon?: string; description?: string }): Promise<EventCategoryItem> {
  const res = await fetch('/api/events/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al crear categoría');
  return await res.json();
}

export async function getSchoolEvents(params?: {
  startDate?: string;
  endDate?: string;
  environmentId?: string;
  categoryId?: string;
  status?: string;
}): Promise<SchoolEventItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.environmentId) query.set('environmentId', params.environmentId);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`/api/events?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getSchoolEvents error', e);
    return [];
  }
}

export async function getSchoolEvent(id: string): Promise<SchoolEventItem> {
  const res = await fetch(`/api/events/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Evento no encontrado');
  return await res.json();
}

export async function createSchoolEvent(data: any): Promise<SchoolEventItem> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear evento' }));
    throw new Error(err.error || 'Error al crear evento');
  }
  return await res.json();
}

export async function updateSchoolEvent(id: string, data: any): Promise<SchoolEventItem> {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar evento' }));
    throw new Error(err.error || 'Error al actualizar evento');
  }
  return await res.json();
}

export async function deleteSchoolEvent(id: string): Promise<void> {
  const res = await fetch(`/api/events/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar evento');
}

export async function rsvpSchoolEvent(eventId: string, data: {
  studentId?: string;
  tutorUserId?: string;
  guestName?: string;
  guestEmail?: string;
  guestsCount?: number;
  status: 'CONFIRMED' | 'DECLINED';
  notes?: string;
}): Promise<EventBookingItem> {
  const res = await fetch(`/api/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al confirmar RSVP' }));
    throw new Error(err.error || 'Error al confirmar RSVP');
  }
  return await res.json();
}

export const confirmSchoolEventRSVP = rsvpSchoolEvent;

export async function bookSchoolEventSlot(eventId: string, data: {
  slotId: string;
  studentId?: string;
  tutorUserId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  notes?: string;
}): Promise<EventBookingItem> {
  const res = await fetch(`/api/events/${eventId}/book-slot`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al reservar horario' }));
    throw new Error(err.error || 'Error al reservar horario');
  }
  return await res.json();
}

export async function cancelSchoolEventBooking(eventId: string, bookingId: string): Promise<void> {
  const res = await fetch(`/api/events/${eventId}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al cancelar reserva');
}

export async function updateSchoolEventBooking(
  eventId: string,
  bookingId: string,
  data: { status?: string; notes?: string }
): Promise<EventBookingItem> {
  const res = await fetch(`/api/events/${eventId}/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar reserva');
  return await res.json();
}

export async function savePostEventData(eventId: string, data: {
  summaryNotes?: string;
  photoUrls?: string[];
  attachments?: any[];
}): Promise<SchoolEventItem> {
  const res = await fetch(`/api/events/${eventId}/post-event`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al guardar datos post-evento');
  return await res.json();
}

export interface PublicSchoolEventSummary {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  location?: string;
  coverImage?: string;
  eventType: 'OPEN_MASSIVE' | 'SLOT_BOOKING';
  status: string;
  isClosed: boolean;
  startDateTime: string;
  endDateTime: string;
  slotDurationMinutes?: number;
  maxBookingsPerSlot?: number;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  slots?: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    isLocked: boolean;
    bookingsCount: number;
    isAvailable: boolean;
  }>;
}

export async function getPublicSchoolEvent(eventId: string): Promise<PublicSchoolEventSummary | null> {
  try {
    const res = await fetch(`/api/events/public/${eventId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('getPublicSchoolEvent error', e);
    return null;
  }
}

// ==========================================
// PROGRESS CONFERENCE REPORTS & EVOLUTION TIMELINE
// ==========================================

export interface ProgressConferenceReportItem {
  id: string;
  schoolId: string;
  studentId: string;
  guideUserId?: string;
  termName: string;
  conferenceDate: string;
  status: string;
  executiveSummary: string;
  strengths: string;
  challenges: string;
  recommendationsHome: string;
  agreements: string;
  masterySnapshot?: {
    computedAt?: string;
    totalLessons?: number;
    totalMastered?: number;
    totalPracticing?: number;
    overallPercentage?: number;
    areas?: Array<{
      areaId: string;
      areaName: string;
      color: string;
      totalLessons: number;
      masteredCount: number;
      practicingCount: number;
      percentage: number;
    }>;
  };
  audioRecordingUrl?: string;
  audioTranscription?: string;
  attachments?: Array<{ title: string; url: string; type?: string; size?: number }>;
  attendees?: string;
  createdAt: string;
  guide?: {
    id: string;
    fullName: string;
    email: string;
  };
  student?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    grade?: string;
  };
}

export interface ProgressConferenceComparisonData {
  studentId: string;
  reportsCount: number;
  timeline: Array<{
    reportId: string;
    termName: string;
    conferenceDate: string;
    guideName: string;
    executiveSummary: string;
    strengths: string;
    challenges: string;
    recommendationsHome: string;
    agreements: string;
    audioRecordingUrl?: string;
    overallPercentage: number;
    totalMastered: number;
    growthPercentageFromPrevious: number;
    areas: Array<{
      areaId: string;
      areaName: string;
      color: string;
      totalLessons: number;
      masteredCount: number;
      practicingCount: number;
      percentage: number;
    }>;
  }>;
}

export async function getStudentConferenceReports(studentId: string): Promise<ProgressConferenceReportItem[]> {
  try {
    const res = await fetch(`/api/montessori/conferences/student/${studentId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getStudentConferenceReports error', e);
    return [];
  }
}

export async function getConferenceReport(id: string): Promise<ProgressConferenceReportItem> {
  const res = await fetch(`/api/montessori/conferences/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Informe no encontrado');
  return await res.json();
}

export async function createConferenceReport(data: any): Promise<ProgressConferenceReportItem> {
  const res = await fetch('/api/montessori/conferences', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear informe de reunión' }));
    throw new Error(err.error || 'Error al crear informe');
  }
  return await res.json();
}

export async function updateConferenceReport(id: string, data: any): Promise<ProgressConferenceReportItem> {
  const res = await fetch(`/api/montessori/conferences/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar informe' }));
    throw new Error(err.error || 'Error al actualizar informe');
  }
  return await res.json();
}

export async function deleteConferenceReport(id: string): Promise<void> {
  const res = await fetch(`/api/montessori/conferences/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar informe');
}

export async function requestAIConferenceAssist(data: {
  rawNotes: string;
  studentName?: string;
  termName?: string;
}): Promise<{
  executiveSummary: string;
  strengths: string;
  challenges: string;
  recommendationsHome: string;
  agreements: string;
}> {
  const res = await fetch('/api/montessori/conferences/ai-assist', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al procesar notas con el Asistente IA');
  return await res.json();
}

export async function getStudentConferenceComparison(studentId: string): Promise<ProgressConferenceComparisonData> {
  const res = await fetch(`/api/montessori/conferences/compare/student/${studentId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener comparativa de progreso');
  return await res.json();
}

// ==========================================
// 360° STUDENT CHARACTERIZATION & MULTI-PERSPECTIVE TYPES & API
// ==========================================

export type AuthorRoleType = 'LEAD_GUIDE' | 'ASSISTANT_GUIDE' | 'SUPPORT_STAFF' | 'SPECIALIST' | 'ADMIN';
export type ContextAreaType = 'SALON' | 'COMEDOR' | 'PATIO_JARDIN' | 'TALLER_ESPECIAL' | 'AREAS_COMUNES' | 'GENERAL';

export interface StudentCharacterizationItem {
  id: string;
  schoolId: string;
  studentId: string;
  authorUserId?: string | null;
  authorName: string;
  authorRole: AuthorRoleType;
  contextArea: ContextAreaType;
  period: string;
  observationDate: string;
  independenceLevel: number;
  socialGraceLevel: number;
  focusRegulationLevel: number;
  curiosityEngagementLevel: number;
  autonomyCareNotes: string;
  socialGraceNotes: string;
  focusRegulationNotes: string;
  interestsPassionsNotes: string;
  anecdoteHighlight: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  authorUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface CharacterizationRoleSummary {
  role: string;
  count: number;
  authors: string[];
  avgIndependence: number;
  avgSocialGrace: number;
  avgFocusRegulation: number;
  avgCuriosity: number;
}

export interface CharacterizationComparisonData {
  student: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    grade?: string;
  };
  totalEntries: number;
  averageDimensions: {
    independence: number;
    socialGrace: number;
    focusRegulation: number;
    curiosityEngagement: number;
    overallAverage: number;
  };
  roleBreakdown: CharacterizationRoleSummary[];
  entries: StudentCharacterizationItem[];
  commonTags: string[];
  consensusProfile?: CharacterizationConsensusProfile | null;
}

export interface CharacterizationConsensusProfile {
  title: string;
  contributingRoles: string;
  participatingAuthors: string;
  overallConsensus: string;
  independenceSynthesis: string;
  socialGraceSynthesis: string;
  focusSynthesis: string;
  interestsSynthesis: string;
  anecdotesSummary: string;
  pedagogicalStrategy: string;
}

export async function getStudentCharacterizations(studentId: string): Promise<StudentCharacterizationItem[]> {
  const res = await fetch(`/api/montessori/characterizations/student/${studentId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al cargar caracterizaciones del estudiante');
  return await res.json();
}

export async function saveStudentCharacterization(data: Partial<StudentCharacterizationItem>): Promise<StudentCharacterizationItem> {
  const method = data.id ? 'PUT' : 'POST';
  const url = data.id 
    ? `/api/montessori/characterizations/${data.id}` 
    : '/api/montessori/characterizations';

  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar caracterización' }));
    throw new Error(err.error || 'Error al guardar caracterización');
  }
  return await res.json();
}

export async function deleteStudentCharacterization(id: string): Promise<void> {
  const res = await fetch(`/api/montessori/characterizations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar caracterización');
}

export async function getStudentCharacterizationComparison(studentId: string): Promise<CharacterizationComparisonData> {
  const res = await fetch(`/api/montessori/characterizations/compare/student/${studentId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener matriz comparativa 360°');
  return await res.json();
}

export async function generateCharacterizationConsensus(studentId: string): Promise<CharacterizationConsensusProfile> {
  const res = await fetch(`/api/montessori/characterizations/ai-consensus/student/${studentId}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al sintetizar consenso' }));
    throw new Error(err.error || 'Error al sintetizar consenso');
  }
  return await res.json();
}

export interface AiCharacterizationInterviewResponse {
  success: boolean;
  reply: string;
  isComplete: boolean;
  progress: {
    percent: number;
    step: string;
  };
  extractedData?: {
    authorRole?: AuthorRoleType;
    contextArea?: ContextAreaType;
    independenceLevel?: number;
    socialGraceLevel?: number;
    focusRegulationLevel?: number;
    curiosityEngagementLevel?: number;
    autonomyCareNotes?: string;
    socialGraceNotes?: string;
    focusRegulationNotes?: string;
    interestsPassionsNotes?: string;
    anecdoteHighlight?: string;
    tags?: string[];
  };
  error?: string;
}

export async function sendCharacterizationAiInterview(payload: {
  studentId: string;
  studentName: string;
  authorName: string;
  authorRole: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentExtractedData?: any;
}): Promise<AiCharacterizationInterviewResponse> {
  const res = await fetch('/api/montessori/characterizations/ai-interview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error en la entrevista IA' }));
    throw new Error(err.error || 'Error en la entrevista IA');
  }
  return await res.json();
}

// ==========================================
// SCHOOL FINANCES & TUITION PLANS TYPES & API
// ==========================================

export interface FeeConceptItem {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  category: 'ENROLLMENT' | 'TUITION' | 'MATERIALS' | 'WORKSHOP' | 'MEALS' | 'TRANSPORT' | 'OTHER';
  frequency: 'ONE_TIME' | 'MONTHLY' | 'ANNUAL' | 'PER_EVENT';
  defaultAmount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeePlanTemplateItem {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  schoolYear: string;
  environmentStage?: string;
  isActive: boolean;
  items: Array<{
    conceptId?: string;
    conceptName: string;
    category?: string;
    baseAmount: number;
    quantity: number;
    dueMonthOffset?: number;
  }>;
  batchDiscountPct: number;
  promptPaymentDiscountPct: number;
  promptPaymentDayLimit: number;
  defaultInstallmentsCount?: number;
  invoiceCutDay?: number;
  dueDayLimit?: number;
  lateFeePct?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeInstallmentItem {
  id: string;
  studentFeePlanId: string;
  studentId: string;
  schoolId: string;
  conceptName: string;
  category: string;
  installmentNumber: number;
  totalInstallments: number;
  invoiceCutDate?: string;
  dueDate: string;
  originalAmount: number;
  discountAmount: number;
  discountReason?: string;
  netAmount: number;
  lateFeePct?: number;
  lateFeeAmount?: number;
  isLateFeeApplied?: boolean;
  isLateFeeWaived?: boolean;
  isOverdue?: boolean;
  effectiveTotal?: number;
  paidAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'WAIVED';
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFeePlanItem {
  id: string;
  schoolId: string;
  studentId: string;
  templateId?: string;
  planName: string;
  schoolYear: string;
  paymentModality: 'ANNUAL_BATCH' | 'SEMIANNUAL' | 'MONTHLY_10' | 'MONTHLY_11' | 'MONTHLY_12' | 'CUSTOM';
  currency: string;
  installmentsCount?: number;
  invoiceCutDay?: number;
  dueDayLimit?: number;
  lateFeePct?: number;
  allowLateFeeExemption?: boolean;
  totalGrossAmount: number;
  totalDiscountAmount: number;
  totalNetAmount: number;
  notes?: string;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    grade?: string;
    enrollmentCode?: string;
  };
  template?: {
    id: string;
    name: string;
    batchDiscountPct?: number;
    promptPaymentDiscountPct?: number;
    promptPaymentDayLimit?: number;
  };
  installments?: FeeInstallmentItem[];
}

export interface TutorStudentStatement {
  studentId: string;
  fullName: string;
  avatarUrl?: string;
  grade?: string;
  enrollmentCode?: string;
  relationship: string;
  activePlan: StudentFeePlanItem | null;
  summary: {
    totalGross: number;
    totalDiscount: number;
    totalCharged: number;
    totalPaid: number;
    totalPending: number;
    totalInstallments: number;
    paidInstallmentsCount: number;
    nextDue: FeeInstallmentItem | null;
  };
  installments: FeeInstallmentItem[];
}

export interface TutorAccountStatementResponse {
  school: {
    id: string;
    name: string;
    primaryColor?: string;
    phone?: string;
    email?: string;
  };
  students: TutorStudentStatement[];
}

// 1. Concepts
export async function getFeeConcepts(): Promise<FeeConceptItem[]> {
  const res = await fetch('/api/finance/concepts', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al cargar conceptos de cobro');
  return await res.json();
}

export async function saveFeeConcept(data: Partial<FeeConceptItem>): Promise<FeeConceptItem> {
  const method = data.id ? 'PUT' : 'POST';
  const url = data.id ? `/api/finance/concepts/${data.id}` : '/api/finance/concepts';
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al guardar concepto');
  return await res.json();
}

export async function deleteFeeConcept(id: string): Promise<void> {
  const res = await fetch(`/api/finance/concepts/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al eliminar concepto');
}

// 2. Templates
export async function getFeePlanTemplates(): Promise<FeePlanTemplateItem[]> {
  const res = await fetch('/api/finance/templates', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al cargar plantillas de planes');
  return await res.json();
}

export async function saveFeePlanTemplate(data: Partial<FeePlanTemplateItem>): Promise<FeePlanTemplateItem> {
  const method = data.id ? 'PUT' : 'POST';
  const url = data.id ? `/api/finance/templates/${data.id}` : '/api/finance/templates';
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al guardar plantilla');
  return await res.json();
}

export async function deleteFeePlanTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/finance/templates/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al eliminar plantilla');
}

// 3. Student Plans
export async function getStudentFeePlans(): Promise<StudentFeePlanItem[]> {
  const res = await fetch('/api/finance/student-plans', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al cargar planes de estudiantes');
  return await res.json();
}

export async function getStudentFeePlan(studentId: string): Promise<StudentFeePlanItem | null> {
  const res = await fetch(`/api/finance/student-plans/student/${studentId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener plan del estudiante');
  return await res.json();
}

export async function generateStudentFeePlan(payload: {
  studentId: string;
  templateId?: string;
  planName?: string;
  schoolYear?: string;
  paymentModality?: string;
  installmentsCount?: number;
  invoiceCutDay?: number;
  dueDayLimit?: number;
  lateFeePct?: number;
  allowLateFeeExemption?: boolean;
  discountPct?: number;
  discountReason?: string;
  customItems?: any[];
  notes?: string;
}): Promise<StudentFeePlanItem> {
  const res = await fetch('/api/finance/student-plans/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al generar plan' }));
    throw new Error(err.error || 'Error al generar plan');
  }
  return await res.json();
}

export async function deleteStudentFeePlan(id: string): Promise<void> {
  const res = await fetch(`/api/finance/student-plans/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al eliminar plan');
}

// 4. Installments & Payments
export async function getAllSchoolInstallments(): Promise<FeeInstallmentItem[]> {
  const res = await fetch(`/api/finance/installments`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener transacciones financieras');
  return await res.json();
}

export async function getStudentInstallments(studentId: string): Promise<FeeInstallmentItem[]> {
  const res = await fetch(`/api/finance/installments/student/${studentId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener cuotas');
  return await res.json();
}

export async function recordInstallmentPayment(id: string, payload: {
  paidAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  receiptUrl?: string;
  notes?: string;
  markAsPaid?: boolean;
}): Promise<FeeInstallmentItem> {
  const res = await fetch(`/api/finance/installments/${id}/pay`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al registrar pago');
  return await res.json();
}

export async function cancelInstallmentPayment(id: string): Promise<FeeInstallmentItem> {
  const res = await fetch(`/api/finance/installments/${id}/cancel-payment`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al anular registro de pago');
  return await res.json();
}

export async function toggleInstallmentLateFeeWaiver(id: string): Promise<FeeInstallmentItem> {
  const res = await fetch(`/api/finance/installments/${id}/toggle-late-fee-waiver`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al modificar condonación de recargo');
  return await res.json();
}

export async function updateInstallment(id: string, payload: Partial<FeeInstallmentItem>): Promise<FeeInstallmentItem> {
  const res = await fetch(`/api/finance/installments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar cuota');
  return await res.json();
}

export async function getTutorAccountStatement(email: string): Promise<TutorAccountStatementResponse> {
  const res = await fetch(`/api/finance/tutor/account-statement?email=${encodeURIComponent(email)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener estado de cuenta familiar');
  return await res.json();
}

// ==========================================
// TRACKERS & DAILY CARE LOGS CONFIGURATION
// ==========================================
export interface TrackerItem {
  id: string;
  subcategoryId: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface TrackerSubcategoryItem {
  id: string;
  categoryId: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  fields?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  items?: TrackerItem[];
}

export interface TrackerCategoryItem {
  id: string;
  schoolId?: string | null;
  name: string;
  nameEn?: string | null;
  slug: string;
  icon?: string;
  color?: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  subcategories: TrackerSubcategoryItem[];
}

export async function getTrackerCategories(): Promise<TrackerCategoryItem[]> {
  try {
    const res = await fetch('/api/trackers/categories', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('getTrackerCategories error', e);
    return [];
  }
}

export async function saveTrackerCategory(data: Partial<TrackerCategoryItem>): Promise<TrackerCategoryItem> {
  const res = await fetch('/api/trackers/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar categoría de rastreador' }));
    throw new Error(err.error || 'Error al guardar categoría de rastreador');
  }
  return await res.json();
}

export async function deleteTrackerCategory(id: string): Promise<boolean> {
  const res = await fetch(`/api/trackers/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar categoría de rastreador');
  return true;
}

export async function saveTrackerSubcategory(data: Partial<TrackerSubcategoryItem>): Promise<TrackerSubcategoryItem> {
  const res = await fetch('/api/trackers/subcategories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar subcategoría de rastreador' }));
    throw new Error(err.error || 'Error al guardar subcategoría de rastreador');
  }
  return await res.json();
}

export async function deleteTrackerSubcategory(id: string): Promise<boolean> {
  const res = await fetch(`/api/trackers/subcategories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar subcategoría de rastreador');
  return true;
}

export async function saveTrackerItem(data: Partial<TrackerItem>): Promise<TrackerItem> {
  const res = await fetch('/api/trackers/items', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar tracker' }));
    throw new Error(err.error || 'Error al guardar tracker');
  }
  return await res.json();
}

export async function deleteTrackerItem(id: string): Promise<boolean> {
  const res = await fetch(`/api/trackers/items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar tracker');
  return true;
}

export async function toggleTrackerItemActive(id: string): Promise<TrackerItem> {
  const res = await fetch(`/api/trackers/items/${id}/toggle-active`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al cambiar estado del tracker');
  return await res.json();
}

// ================= NEWSLETTERS & COMUNICADOS =================

export type NewsletterTargetType = 'ALL_SCHOOL' | 'ENVIRONMENTS' | 'STAFF_ONLY' | 'SPECIFIC_CONTACTS';
export type NewsletterAudience = 'PARENTS' | 'STAFF' | 'PARENTS_AND_STAFF';
export type NewsletterStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'ARCHIVED';

export type NewsletterCalloutStyle =
  | 'forest'
  | 'blue'
  | 'amber'
  | 'purple'
  | 'rose'
  | 'emerald'
  | 'info'
  | 'success'
  | 'warning'
  | 'primary';

export interface NewsletterBlockItem {
  id: string;
  type: 'heading' | 'text' | 'image' | 'callout' | 'quote' | 'button' | 'divider';
  content?: string;
  level?: 1 | 2 | 3;
  url?: string;
  alt?: string;
  caption?: string;
  style?: NewsletterCalloutStyle;
  buttonText?: string;
  buttonUrl?: string;
}

export interface NewsletterAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileData: string;
  createdAt?: string;
}

export interface NewsletterItem {
  id: string;
  schoolId: string;
  title: string;
  subject?: string | null;
  preheader?: string | null;
  contentHtml: string;
  contentJson?: { blocks?: NewsletterBlockItem[] } | any;
  coverImageUrl?: string | null;
  authorName?: string | null;
  attachments?: NewsletterAttachment[] | null;
  targetType: NewsletterTargetType;
  targetAudience: NewsletterAudience;
  targetEnvironmentIds?: string[] | null;
  specificEmails?: Array<{ email: string; name?: string }> | string[] | null;
  status: NewsletterStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  logs?: Array<{ email: string; name?: string; status: string; error?: string; timestamp: string }> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterRecipientPreview {
  email: string;
  name: string;
  role: 'TUTOR' | 'STAFF' | 'MANUAL';
  studentName?: string;
  environmentName?: string;
}

export async function getNewsletters(params?: { status?: string; search?: string }): Promise<NewsletterItem[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.append('status', params.status);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`/api/newsletters?${query.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener boletines');
  }
  return await res.json();
}

export async function getNewsletter(id: string): Promise<NewsletterItem> {
  const res = await fetch(`/api/newsletters/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener boletín');
  }
  return await res.json();
}

export async function createNewsletter(data: Partial<NewsletterItem> & { status?: string }): Promise<NewsletterItem> {
  const res = await fetch('/api/newsletters', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear boletín');
  }
  return await res.json();
}

export async function updateNewsletter(id: string, data: Partial<NewsletterItem> & { status?: string }): Promise<NewsletterItem> {
  const res = await fetch(`/api/newsletters/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar boletín');
  }
  return await res.json();
}

export async function deleteNewsletter(id: string): Promise<void> {
  const res = await fetch(`/api/newsletters/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar boletín');
  }
}

export async function calculateNewsletterRecipients(data: {
  targetType: string;
  targetAudience: string;
  targetEnvironmentIds?: string[];
  specificEmails?: any[];
}): Promise<{ count: number; recipients: NewsletterRecipientPreview[] }> {
  const res = await fetch('/api/newsletters/calculate-recipients', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al calcular destinatarios');
  }
  return await res.json();
}

export async function sendNewsletterNow(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/newsletters/${id}/send-now`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al iniciar envío');
  }
  return await res.json();
}

export async function sendNewsletterTest(id: string, testEmail: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/newsletters/${id}/send-test`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ testEmail })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al enviar correo de prueba');
  }
  return await res.json();
}

export async function cancelScheduledNewsletter(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/newsletters/${id}/cancel-schedule`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al cancelar programación');
  }
  return await res.json();
}

export async function getTutorNewsletters(): Promise<NewsletterItem[]> {
  const res = await fetch('/api/tutor/newsletters', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener comunicados');
  }
  return await res.json();
}

export interface AnnouncementItem {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'PARENTS' | 'STAFF';
  targetEnvironmentIds: string[] | null;
  sendEmail: boolean;
  style: 'info' | 'warning' | 'danger' | 'success';
  isMarquee: boolean;
  isPeriodic: boolean;
  periodicity: 'daily' | 'weekly' | 'monthly' | null;
  displayDurationHours: number | null;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  views?: Array<{
    viewedAt: string;
    user: {
      id: string;
      fullName: string | null;
      email: string;
    };
  }>;
}

export async function getAnnouncements(): Promise<AnnouncementItem[]> {
  const res = await fetch('/api/announcements', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener anuncios');
  }
  return await res.json();
}

export async function getActiveAnnouncements(): Promise<AnnouncementItem[]> {
  const res = await fetch('/api/announcements/active', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener anuncios activos');
  }
  return await res.json();
}

export async function createAnnouncement(data: Partial<AnnouncementItem>): Promise<AnnouncementItem> {
  const res = await fetch('/api/announcements', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear anuncio');
  }
  return await res.json();
}

export async function updateAnnouncement(id: string, data: Partial<AnnouncementItem>): Promise<AnnouncementItem> {
  const res = await fetch(`/api/announcements/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar anuncio');
  }
  return await res.json();
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/announcements/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar anuncio');
  }
  return await res.json();
}

export async function markAnnouncementAsViewed(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/announcements/${id}/view`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al registrar vista de anuncio');
  }
  return await res.json();
}








