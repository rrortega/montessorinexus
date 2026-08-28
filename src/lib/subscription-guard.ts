import { School } from './sqlite';

export interface SchoolSubscriptionInfo {
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isPaid: boolean;
  daysRemaining: number;
  trialEndsAt: string | null;
  status: string; // 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'ACTIVE_PAID'
  isReadOnly: boolean;
  enabledModules: Record<string, boolean>;
}

/**
 * Computes live subscription and module enablement status for a school.
 */
export function getSchoolSubscriptionInfo(school: School | any): SchoolSubscriptionInfo {
  if (!school) {
    return {
      isTrialActive: true,
      isTrialExpired: false,
      isPaid: false,
      daysRemaining: 90,
      trialEndsAt: null,
      status: 'TRIAL_ACTIVE',
      isReadOnly: false,
      enabledModules: {
        core: true,
        montessori: true,
        attendance: true,
        environments: true,
        students: true,
        guides: true,
        tutors: true,
        settings: true,
        account: true
      }
    };
  }

  const feat = (school.features && typeof school.features === 'object') ? school.features : {};
  const isPaid = feat.subscriptionStatus === 'ACTIVE_PAID';

  const createdDate = school.createdAt ? new Date(school.createdAt) : new Date();
  const trialEndsAtDate = feat.trialEndsAt
    ? new Date(feat.trialEndsAt)
    : new Date(createdDate.getTime() + (90 + (feat.trialExtendedDays || 0)) * 24 * 60 * 60 * 1000);

  const now = new Date();
  const diffMs = trialEndsAtDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isTrialActive = diffMs > 0 && feat.subscriptionStatus !== 'TRIAL_EXPIRED';
  const isTrialExpired = !isPaid && !isTrialActive;

  const status = feat.subscriptionStatus || (isPaid ? 'ACTIVE_PAID' : (isTrialActive ? 'TRIAL_ACTIVE' : 'TRIAL_EXPIRED'));
  const isReadOnly = isTrialExpired;

  // Custom add-on modules check
  // When trial is expired and school has not paid, all add-on modules are deactivated
  const enabledModules: Record<string, boolean> = {
    // Core base features (viewable in read-only mode during expired trial)
    dashboard: true,
    montessori: true,
    attendance: true,
    environments: true,
    students: true,
    graduated_students: true,
    tutors: true,
    guides: true,
    account: true,
    settings: true,

    // Custom add-on / a la carte modules (deactivated when expired or not selected)
    finances: isPaid ? !!feat.finances : (isTrialActive && (feat.finances !== false)),
    'web-builder': isPaid ? (!!feat.webBuilder || !!feat.website) : (isTrialActive && (feat.webBuilder !== false && feat.website !== false)),
    webBuilder: isPaid ? (!!feat.webBuilder || !!feat.website) : (isTrialActive && (feat.webBuilder !== false && feat.website !== false)),
    gallery: isPaid ? (!!feat.webBuilder || !!feat.website || !!feat.gallery) : (isTrialActive && (feat.gallery !== false)),
    traffic: isPaid ? (!!feat.webBuilder || !!feat.website || !!feat.traffic) : (isTrialActive && (feat.traffic !== false)),
    forms: isPaid ? !!feat.forms : (isTrialActive && (feat.forms !== false)),
    processes: isPaid ? !!feat.pipelines : (isTrialActive && (feat.pipelines !== false)),
    admissions: isPaid ? (feat.admissions !== false && feat.pipelines !== false) : (isTrialActive && (feat.admissions !== false)),
    newsletters: isPaid ? !!feat.newsletters : (isTrialActive && (feat.newsletters !== false)),
    announcements: isPaid ? !!feat.announcements : (isTrialActive && (feat.announcements !== false)),
    waitlist: isPaid ? !!feat.waitlist : (isTrialActive && (feat.waitlist !== false)),
    documents: isPaid ? (feat.documents !== false) : (isTrialActive && (feat.documents !== false)),
    curriculum: isPaid ? (feat.curriculum !== false) : (isTrialActive && (feat.curriculum !== false)),
    trackers: isPaid ? (feat.trackers !== false) : (isTrialActive && (feat.trackers !== false)),
    allergies: isPaid ? (feat.allergies !== false) : (isTrialActive && (feat.allergies !== false)),
    assessments: isPaid ? (feat.assessments !== false) : (isTrialActive && (feat.assessments !== false)),
    consents: isPaid ? (feat.consents !== false) : (isTrialActive && (feat.consents !== false)),
  };

  return {
    isTrialActive,
    isTrialExpired,
    isPaid,
    daysRemaining,
    trialEndsAt: trialEndsAtDate.toISOString(),
    status,
    isReadOnly,
    enabledModules
  };
}
