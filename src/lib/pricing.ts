/**
 * MontessoriNexus - Single Source of Truth for SaaS Modular Pricing
 *
 * Configurable via environment variables (VITE_PRICING_*) with sensible defaults.
 * Used by both public landing page and authenticated admin school pricing sections.
 */

// =========================================================================
// 1. CONFIGURABLE PRICING CONSTANTS
// =========================================================================
export const PRICING_CONFIG = {
  // Environments tiered pricing (Tier 1: 1-3 salones, Tier 2: 4+ salones)
  environmentTier1: Number(import.meta.env.VITE_PRICING_ENVIRONMENT_TIER1 ?? 25),
  environmentTier2: Number(import.meta.env.VITE_PRICING_ENVIRONMENT_TIER2 ?? 10),
  environmentTier1Limit: 3,
  storage10GbUnit: Number(import.meta.env.VITE_PRICING_STORAGE_10GB ?? 5),

  // Core Base Modules (Mandatory in base membership: $14 USD/mo)
  waitlist: Number(import.meta.env.VITE_PRICING_WAITLIST ?? 1),
  portalParents: Number(import.meta.env.VITE_PRICING_PORTAL_PARENTS ?? 5),
  portalTeachers: Number(import.meta.env.VITE_PRICING_PORTAL_TEACHERS ?? 5),
  portalGuides: Number(import.meta.env.VITE_PRICING_PORTAL_TEACHERS ?? 5),
  progressTracking: Number(import.meta.env.VITE_PRICING_PROGRESS ?? 1),
  montessoriTracking: Number(import.meta.env.VITE_PRICING_PROGRESS ?? 1),
  attendance: Number(import.meta.env.VITE_PRICING_ATTENDANCE ?? 1),
  attendanceTracker: Number(import.meta.env.VITE_PRICING_ATTENDANCE ?? 1),
  calendar: Number(import.meta.env.VITE_PRICING_CALENDAR ?? 1),
  habitTrackers: Number(import.meta.env.VITE_PRICING_CALENDAR ?? 1),
  internalAnnouncements: 0,
  documentManagement: 0,
  webGallery: 0,
  baseStorageGb: 2, // 2 GB included for free

  // Optional Add-on Modules (USD / month)
  finances: Number(import.meta.env.VITE_PRICING_FINANCES ?? 12),
  websiteBuilder: Number(import.meta.env.VITE_PRICING_WEBSITE_BUILDER ?? 18),
  blog: Number(import.meta.env.VITE_PRICING_BLOG ?? 3.99),
  forms: Number(import.meta.env.VITE_PRICING_FORMS ?? 9),
  pipelines: Number(import.meta.env.VITE_PRICING_PIPELINES ?? 9),
  newsletterSmtp: Number(import.meta.env.VITE_PRICING_NEWSLETTER ?? 3.99),
};

// =========================================================================
// 2. DATA TYPES & INTERFACES
// =========================================================================
export interface OptionalModulesSelection {
  finances: boolean;
  websiteBuilder: boolean;
  blog: boolean;
  forms: boolean;
  pipelines: boolean;
  newsletterSmtp: boolean;
}

export type StorageTierId = '2gb_free' | '12gb' | '22gb' | '52gb' | 'byos_aws';
export type BillingCycle = 'monthly' | 'annual';

export interface EmailTierOption {
  id: string;
  name: string;
  desc: string;
  extraUnits: number;
  emailsCountLabel: string;
  isSmtp?: boolean;
}

export const EMAIL_TIERS: EmailTierOption[] = [
  {
    id: '500_included',
    name: '500 Emails / mes',
    desc: 'Solo comunidad escolar (Padres y Docentes registrados)',
    extraUnits: 0,
    emailsCountLabel: '500 emails/mes'
  },
  {
    id: '1000_emails',
    name: '1,000 Emails / mes',
    desc: '+500 adicionales • Solo comunidad escolar (Padres y Docentes)',
    extraUnits: 1,
    emailsCountLabel: '1,000 emails/mes'
  },
  {
    id: '2000_emails',
    name: '2,000 Emails / mes',
    desc: '+1,500 adicionales • Solo comunidad escolar (Padres y Docentes)',
    extraUnits: 3,
    emailsCountLabel: '2,000 emails/mes'
  },
  {
    id: '3000_emails',
    name: '3,000 Emails / mes',
    desc: '+2,500 adicionales • Solo comunidad escolar (Padres y Docentes)',
    extraUnits: 5,
    emailsCountLabel: '3,000 emails/mes'
  },
  {
    id: 'byo_smtp',
    name: 'Servidor SMTP Propio',
    desc: 'Envíos ilimitados a comunidad y destinatarios externos (AWS SES, SendGrid, etc.)',
    extraUnits: 0,
    emailsCountLabel: 'SMTP Propio (Ilimitado + Externos)',
    isSmtp: true
  }
];

export interface CalculatePricingInput {
  environmentsCount: number;
  optionalModules: OptionalModulesSelection;
  storageTier: StorageTierId;
  billingCycle?: BillingCycle;
  newsletterEmailTierId?: string;
  fxRate?: number;
}

export interface PricingCalculationResult {
  coreBaseTotalUsd: number;
  coreBaseTotal: number;
  environmentsCostUsd: number;
  environmentsCost: number;
  optionalModulesCostUsd: number;
  optionalModulesCost: number;
  selectedModulesCount: number;
  storageCostUsd: number;
  storageCost: number;
  newsletterCostUsd: number;
  monthlyTotalUsd: number;
  annualEquivalentMonthlyUsd: number;
  annualBilledTotalUsd: number;
  // Converted fields if fxRate is given (or USD values by default)
  monthlyTotal: number;
  annualEquivalentMonthly: number;
  annualBilledTotal: number;
}

// =========================================================================
// 3. PURE CALCULATION SERVICE
// =========================================================================
export function calculatePricingSummary(input: CalculatePricingInput): PricingCalculationResult {
  const {
    environmentsCount,
    optionalModules,
    storageTier,
    newsletterEmailTierId = '500_included',
    fxRate = 1
  } = input;

  // 1. Core Base membership ($14 USD)
  const coreBaseTotalUsd =
    PRICING_CONFIG.waitlist +
    PRICING_CONFIG.portalParents +
    PRICING_CONFIG.portalTeachers +
    PRICING_CONFIG.progressTracking +
    PRICING_CONFIG.attendance +
    PRICING_CONFIG.calendar;

  // 2. Environments tiered pricing
  let environmentsCostUsd = 0;
  if (environmentsCount <= PRICING_CONFIG.environmentTier1Limit) {
    environmentsCostUsd = environmentsCount * PRICING_CONFIG.environmentTier1;
  } else {
    environmentsCostUsd =
      PRICING_CONFIG.environmentTier1Limit * PRICING_CONFIG.environmentTier1 +
      (environmentsCount - PRICING_CONFIG.environmentTier1Limit) * PRICING_CONFIG.environmentTier2;
  }

  // 3. Optional Modules Cost
  let optionalModulesCostUsd = 0;
  let selectedModulesCount = 0;

  if (optionalModules.finances) {
    optionalModulesCostUsd += PRICING_CONFIG.finances;
    selectedModulesCount++;
  }
  if (optionalModules.websiteBuilder) {
    optionalModulesCostUsd += PRICING_CONFIG.websiteBuilder;
    selectedModulesCount++;
  }
  if (optionalModules.blog) {
    optionalModulesCostUsd += PRICING_CONFIG.blog;
    selectedModulesCount++;
  }
  if (optionalModules.forms) {
    optionalModulesCostUsd += PRICING_CONFIG.forms;
    selectedModulesCount++;
  }
  if (optionalModules.pipelines) {
    optionalModulesCostUsd += PRICING_CONFIG.pipelines;
    selectedModulesCount++;
  }

  let newsletterCostUsd = 0;
  if (optionalModules.newsletterSmtp) {
    const selectedTier = EMAIL_TIERS.find((t) => t.id === newsletterEmailTierId) || EMAIL_TIERS[0];
    const extraCost = selectedTier.extraUnits * PRICING_CONFIG.newsletterSmtp;
    newsletterCostUsd = PRICING_CONFIG.newsletterSmtp + extraCost;
    optionalModulesCostUsd += newsletterCostUsd;
    selectedModulesCount++;
  }

  // 4. Storage Cost
  let storageCostUsd = 0;
  if (storageTier === '12gb') storageCostUsd = PRICING_CONFIG.storage10GbUnit * 1;
  if (storageTier === '22gb') storageCostUsd = PRICING_CONFIG.storage10GbUnit * 2;
  if (storageTier === '52gb') storageCostUsd = PRICING_CONFIG.storage10GbUnit * 5;

  // Monthly Subtotal (USD)
  const monthlyTotalUsd = coreBaseTotalUsd + environmentsCostUsd + optionalModulesCostUsd + storageCostUsd;

  // Annual Calculation (Pay 10 months, get 12 = 2 months free)
  const annualEquivalentMonthlyUsd = Math.round((monthlyTotalUsd * 10) / 12);
  const annualBilledTotalUsd = monthlyTotalUsd * 10;

  // Converted totals with fxRate
  const monthlyTotal = Math.round(monthlyTotalUsd * fxRate);
  const annualEquivalentMonthly = Math.round(annualEquivalentMonthlyUsd * fxRate);
  const annualBilledTotal = Math.round(annualBilledTotalUsd * fxRate);

  return {
    coreBaseTotalUsd,
    coreBaseTotal: coreBaseTotalUsd,
    environmentsCostUsd,
    environmentsCost: environmentsCostUsd,
    optionalModulesCostUsd,
    optionalModulesCost: optionalModulesCostUsd,
    selectedModulesCount,
    storageCostUsd,
    storageCost: storageCostUsd,
    newsletterCostUsd,
    monthlyTotalUsd,
    annualEquivalentMonthlyUsd,
    annualBilledTotalUsd,
    monthlyTotal,
    annualEquivalentMonthly,
    annualBilledTotal
  };
}
