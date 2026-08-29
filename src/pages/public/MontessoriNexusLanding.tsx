import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, animate } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Compass,
  CreditCard,
  Globe,
  MessageCircle,
  X,
  Check,
  Users,
  Sun,
  Moon,
  ShieldCheck,
  Zap,
  Calendar,
  Layers,
  Eye,
  ShieldAlert,
  Brain,
  Sliders,
  FileSpreadsheet,
  Workflow,
  Sparkle,
  Lock,
  GitBranch,
  Bot,
  Plus,
  Minus,
  HardDrive,
  Mail,
  HelpCircle,
  Layout,
  Calculator,
  UserCheck,
  FolderLock,
  FileText,
  Palette,
  EyeOff,
  Clock,
  TrendingUp,
  Image as ImageIcon,
  LayoutGrid,
  Kanban,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// =========================================================================
// CONFIGURABLE PRICING CONSTANTS (Supports Environment Variables)
// =========================================================================
export const PRICING_CONFIG = {
  // Per-unit environment tiered pricing (1-3: $25, 4+: $10)
  environmentTier1: Number(import.meta.env.VITE_PRICING_ENVIRONMENT_TIER1 ?? 25),
  environmentTier2: Number(import.meta.env.VITE_PRICING_ENVIRONMENT_TIER2 ?? 10),
  environmentTier1Limit: 3,
  storage10GbUnit: Number(import.meta.env.VITE_PRICING_STORAGE_10GB ?? 5),

  // Core Base Modules (Mandatory in membership)
  waitlist: Number(import.meta.env.VITE_PRICING_WAITLIST ?? 1),
  portalParents: Number(import.meta.env.VITE_PRICING_PORTAL_PARENTS ?? 5),
  portalTeachers: Number(import.meta.env.VITE_PRICING_PORTAL_TEACHERS ?? 5),
  progressTracking: Number(import.meta.env.VITE_PRICING_PROGRESS ?? 1),
  attendance: Number(import.meta.env.VITE_PRICING_ATTENDANCE ?? 1),
  calendar: Number(import.meta.env.VITE_PRICING_CALENDAR ?? 1),
  internalAnnouncements: 0,
  documentManagement: 0,
  webGallery: 0,
  baseStorageGb: 2, // 2 GB included for free

  // Optional Add-on Modules
  finances: Number(import.meta.env.VITE_PRICING_FINANCES ?? 12),
  newsletterSmtp: Number(import.meta.env.VITE_PRICING_NEWSLETTER ?? 3),
  websiteBuilder: Number(import.meta.env.VITE_PRICING_WEBSITE_BUILDER ?? 18),
  forms: Number(import.meta.env.VITE_PRICING_FORMS ?? 9),
  pipelines: Number(import.meta.env.VITE_PRICING_PIPELINES ?? 9),
};

// =========================================================================
// ANIMATED PRICING COUNTER (Smooth unit-by-unit acceleration)
// =========================================================================
export const AnimatedPriceCounter: React.FC<{
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}> = ({ value, className = '', prefix = '$', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    prevValueRef.current = value;

    if (start === end) return;

    const distance = Math.abs(end - start);
    // Smooth unit-by-unit count with acceleration/deceleration curve
    const duration = Math.min(0.65, Math.max(0.3, distance * 0.018));

    const controls = animate(start, end, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      }
    });

    return () => controls.stop();
  }, [value]);

  return (
    <span className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// =========================================================================
// VECTOR SVG FLAGS (Pixel-perfect, No emojis)
// =========================================================================
export const FlagUS: React.FC<{ className?: string }> = ({ className = "w-4 h-3 rounded-xs shrink-0 shadow-xs" }) => (
  <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
    <path fill="#bd3d44" d="M0 0h640v480H0z"/>
    <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/>
    <path fill="#192f5d" d="M0 0h260v258.5H0z"/>
    <g fill="#fff">
      <circle cx="35" cy="35" r="9"/><circle cx="85" cy="35" r="9"/><circle cx="135" cy="35" r="9"/><circle cx="185" cy="35" r="9"/><circle cx="225" cy="35" r="9"/>
      <circle cx="60" cy="70" r="9"/><circle cx="110" cy="70" r="9"/><circle cx="160" cy="70" r="9"/><circle cx="210" cy="70" r="9"/>
      <circle cx="35" cy="105" r="9"/><circle cx="85" cy="105" r="9"/><circle cx="135" cy="105" r="9"/><circle cx="185" cy="105" r="9"/><circle cx="225" cy="105" r="9"/>
      <circle cx="60" cy="140" r="9"/><circle cx="110" cy="140" r="9"/><circle cx="160" cy="140" r="9"/><circle cx="210" cy="140" r="9"/>
      <circle cx="35" cy="175" r="9"/><circle cx="85" cy="175" r="9"/><circle cx="135" cy="175" r="9"/><circle cx="185" cy="175" r="9"/><circle cx="225" cy="175" r="9"/>
      <circle cx="60" cy="210" r="9"/><circle cx="110" cy="210" r="9"/><circle cx="160" cy="210" r="9"/><circle cx="210" cy="210" r="9"/>
    </g>
  </svg>
);

export const FlagES: React.FC<{ className?: string }> = ({ className = "w-4 h-3 rounded-xs shrink-0 shadow-xs" }) => (
  <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
    <path fill="#c60b1e" d="M0 0h640v480H0z"/>
    <path fill="#ffc400" d="M0 120h640v240H0z"/>
    <g transform="translate(140, 175) scale(0.9)">
      <rect x="0" y="0" width="48" height="60" rx="6" fill="#c60b1e" stroke="#ffc400" strokeWidth="4"/>
      <path d="M12 0v60 M36 0v60 M0 30h48" stroke="#ffc400" strokeWidth="3"/>
      <circle cx="24" cy="-8" r="10" fill="#c60b1e" stroke="#ffc400" strokeWidth="3"/>
    </g>
  </svg>
);

export const FlagBR: React.FC<{ className?: string }> = ({ className = "w-4 h-3 rounded-xs shrink-0 shadow-xs" }) => (
  <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
    <path fill="#009c3b" d="M0 0h640v480H0z"/>
    <path fill="#ffdf00" d="m320 55 260 185-260 185L60 240z"/>
    <circle cx="320" cy="240" r="90" fill="#002776"/>
    <path fill="#fff" d="M230 240c40-35 140-35 180 0-20-4-160-4-180 0z"/>
  </svg>
);

export const FlagFR: React.FC<{ className?: string }> = ({ className = "w-4 h-3 rounded-xs shrink-0 shadow-xs" }) => (
  <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
    <path fill="#002654" d="M0 0h213.3v480H0z"/>
    <path fill="#fff" d="M213.3 0h213.4v480H213.3z"/>
    <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
  </svg>
);

export const LanguageFlag: React.FC<{ code: Language; className?: string }> = ({ code, className }) => {
  switch (code) {
    case 'en': return <FlagUS className={className} />;
    case 'es': return <FlagES className={className} />;
    case 'pt': return <FlagBR className={className} />;
    case 'fr': return <FlagFR className={className} />;
  }
};

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) - Dólar Estadounidense', defaultTuition: 450 },
  { code: 'MXN', symbol: '$', label: 'MXN ($) - Peso Mexicano', defaultTuition: 8500 },
  { code: 'COP', symbol: '$', label: 'COP ($) - Peso Colombiano', defaultTuition: 1200000 },
  { code: 'CAD', symbol: '$', label: 'CAD ($) - Dólar Canadiense', defaultTuition: 650 },
  { code: 'BRL', symbol: 'R$', label: 'BRL (R$) - Real Brasileño', defaultTuition: 2200 },
  { code: 'PEN', symbol: 'S/.', label: 'PEN (S/.) - Sol Peruano', defaultTuition: 1500 },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro', defaultTuition: 400 },
  { code: 'CLP', symbol: '$', label: 'CLP ($) - Peso Chileno', defaultTuition: 350000 },
  { code: 'ARS', symbol: '$', label: 'ARS ($) - Peso Argentino', defaultTuition: 180000 }
];

export const LANGUAGES: { code: Language; label: string; codeShort: string }[] = [
  { code: 'en', label: 'English', codeShort: 'EN' },
  { code: 'es', label: 'Español', codeShort: 'ES' },
  { code: 'pt', label: 'Português', codeShort: 'PT' },
  { code: 'fr', label: 'Français', codeShort: 'FR' }
];

// Comprehensive 4-Language Dictionary
const translations = {
  en: {
    announcement: {
      badge: 'New',
      text: 'Institutional Web Builder included with a catalog of customizable styles and sections for your brand, Dynamic Pipelines, and Ethical AI Suite now available.',
      link: 'View Ceiba School demo →'
    },
    nav: {
      pedagogy: 'Pedagogy',
      aiSuite: 'Ethical AI',
      modules: 'Modules',
      cycle: 'Work Cycle',
      calculator: 'Calculator',
      pricing: 'Pricing',
      faq: 'FAQ',
      login: 'School Login'
    },
    hero: {
      badge: 'Mindful Technology that Honors the Montessori Method',
      titlePart1: 'The same peace that lives in your classrooms, now',
      titleHighlight: 'in your school’s management',
      subtitle: 'The digital nexus where daily pedagogical observation, family engagement, and school operations coexist in perfect harmony.',
      ctaBtn: 'Start Free Trial (3 Months)',
      pill1: '3-Month Free Trial',
      pill2: 'Values-Driven AI & Child Privacy',
      pill3: '24-Hour Assisted Onboarding',
      mockupUrl: 'my-school.montessorinexus.com/panel',
      mockupLive: 'Morning Cycle • 26 Active Children',
      mockupEnv: 'Children’s House 1 (3 to 6 Years)',
      mockupGuide: 'Lead Guide: María Montessori AMI • Assistant: Ana S.',
      mockupNewObs: '+ New Observation'
    },
    mockupCards: {
      c1Name: 'Santiago M. (4y 2m)',
      c1Status: 'Deep Concentration',
      c1Mat: 'Sensorial: Pink Tower',
      c1Desc: 'Independent work with 10 cubes. Self-correction observed on 7th cube.',
      c1Time: '42 min in flow',
      c2Name: 'Elena R. (5y 1m)',
      c2Status: 'Lesson Presented',
      c2Mat: 'Language: Movable Alphabet',
      c2Desc: 'Word building: phonemes /m/ /a/ /s/ /a/. Guide recorded voice sample.',
      c2Time: 'Stage 2 Complete',
      c3Name: 'Mateo V. (3y 8m)',
      c3Status: 'Independent Exploration',
      c3Mat: 'Practical Life: Hand Washing',
      c3Desc: 'Complete 8-step independent sequence. Pours water into basin with care.',
      c3Time: 'Control of Error: No spills'
    },
    mockupExt: {
      cycleLivePill: 'Cycle in Progress • 26 Active Children',
      navLive: 'Live Classroom',
      navAreas: 'Cycle & Areas (AMI)',
      navFamily: 'Family Portal View',
      navAdmissions: 'Admissions & Forms',
      navBilling: 'Tuition & Invoicing',
      subSummary: '26 children active • 18 in deep flow • 3 in presentation • 5 in grace & courtesy',
      quickPresentation: '+ Record Presentation',
      cycleTimelineTitle: 'Morning 3-Hour Work Cycle Timeline',
      cycleCurrentPhase: 'Current Phase: "Great Work" Peak (Min 75-150)',
      cycleNormalState: '100% of children actively engaged with sensitive period materials',
      areaPracticalLife: 'Practical Life',
      areaSensorial: 'Sensorial',
      areaLanguage: 'Language',
      areaMath: 'Mathematics',
      familyPortalTitle: 'Ceiba Family Portal • Santiago M.',
      familyNotification: 'Daily moment delivered today at 11:30 AM',
      familyNarrative: '“Today Santiago experienced a wonderful 42-minute focus period with the Pink Tower, ordering all 10 blocks by gradation and self-correcting the 7th cube with great joy.”',
      familyPhotoConsent: 'Photo verified with parent privacy consent',
      familyZeroGrades: 'Zero numerical marks • Pure qualitative narrative',
      syncingStatus: 'Syncing live classroom stream • 26 observations loaded'
    },
    aiSuite: {
      badge: 'Ethical & Child-Centered Artificial Intelligence',
      title: 'AI designed to amplify care, child privacy, and your school’s authentic voice',
      subtitle: 'We never replace the guide’s watchful eye: we eliminate administrative burdens, safeguard child data, and enrich family communication.',
      cards: [
        {
          tag: 'Visual Privacy & Child Safety',
          title: 'Consent-Aware Face Blur & Watermarking',
          desc: 'When uploading photos to albums or daily logs, AI cross-references digital guardian consents. If parents did not grant public photo rights, AI automatically applies face blurring or protective watermarks.',
          icon: 'shield',
          highlight: '100% GDPR & Child Data Protection Compliance'
        },
        {
          tag: 'School Voice & Narrative',
          title: 'Montessori Narrative Writing Assistant',
          desc: 'Guides jot down a few bullet notes and AI weaves a warm, eloquent progress narrative respecting Maria Montessori’s authentic terminology and your school’s unique tone.',
          icon: 'brain',
          highlight: 'Saves over 4 hours per guide every week'
        },
        {
          tag: 'Qualitative Diagnostics',
          title: 'Pedagogical SWOT Matrix & Presentation Suggestions',
          desc: 'Synthesizes presentation records, sensitive periods, and focus duration to propose the child’s next ideal materials in harmony with their natural development.',
          icon: 'sparkle',
          highlight: 'Personalized suggestions based on the AMI curriculum'
        },
        {
          tag: 'Human Automation',
          title: 'Sensitive Period & Transition Milestones',
          desc: 'Flags when a child in Toddler Community or Primary is reaching readiness indicators for environment transition, alerting leadership well in advance.',
          icon: 'workflow',
          highlight: 'Thoughtful, well-orchestrated transitions'
        }
      ]
    },
    areas: {
      badge: 'Preloaded Curriculum',
      title: 'Mapped to the 5 Montessori Development Areas',
      subtitle: 'Select an area to explore the materials and presentations built into the software:',
      tabs: {
        practica: 'Practical Life',
        sensorial: 'Sensorial Development',
        lenguaje: 'Language & Phonics',
        mate: 'Concrete Math',
        cosmica: 'Cosmic Education'
      },
      practicaTitle: 'Practical Life Area',
      practicaBadge: '28 Preloaded Materials',
      practicaDesc: 'Nurtures fine motor skills, hand-eye coordination, autonomy, and deep concentration. Tracks lessons in Grace & Courtesy, Care of Self, and Care of Environment.',
      practicaC1T: 'Care of Environment',
      practicaC1D: 'Pouring grains and liquids, table scrubbing, napkin folding, plant care.',
      practicaC2T: 'Care of Self',
      practicaC2D: 'Dressing frames (buttons, zippers, bows), hand washing, teeth brushing.',

      sensorialTitle: 'Sensorial Development Area',
      sensorialBadge: '34 Preloaded Materials',
      sensorialDesc: 'Organizes and refines sensory impressions of the physical world. Each material includes parameterized control of error so guides can record spontaneous self-correction.',
      sensorialC1T: 'Visual Discrimination & Dimension',
      sensorialC1D: 'Pink Tower, Brown Stair, Knobbed & Knobless Cylinders, Geometric Cabinet.',
      sensorialC2T: 'Tactile, Thermal, Baric & Auditory',
      sensorialC2D: 'Sandpaper tablets, sound cylinders, thermal bottles, smelling jars.',

      lenguajeTitle: 'Language & Literacy Area',
      lenguajeBadge: '42 Preloaded Materials',
      lenguajeDesc: 'Natural phonetic progression from the explosion into writing to comprehensive reading. Full bilingual immersion support.',
      lenguajeC1T: 'Hand & Ear Preparation',
      lenguajeC1D: 'Sound game (I Spy), Metal Insets, Sandpaper Letters (print and cursive).',
      lenguajeC2T: 'Word Building & Grammar',
      lenguajeC2D: 'Movable Alphabet, classified nomenclature cards, solid grammar symbols.',

      mateTitle: 'Concrete Mathematics Area',
      mateBadge: '38 Preloaded Materials',
      mateDesc: 'From physical quantities to arithmetic abstraction and the base-ten decimal system.',
      mateC1T: 'Numbers 1 to 10 & Decimal System',
      mateC1D: 'Number rods, sandpaper numerals, spindle boxes, Golden Beads (units, tens, hundreds, thousands).',
      mateC2T: 'Operations & Memorization',
      mateC2D: 'Bank game, addition and subtraction strip boards, small bead frame, square & cube chains.',

      cosmicaTitle: 'Cosmic Education Area',
      cosmicaBadge: '25 Preloaded Materials',
      cosmicaDesc: 'Helping the child discover their place in the universe through geography, botany, zoology, and the 5 Great Lessons.',
      cosmicaC1T: 'Geography & Natural Sciences',
      cosmicaC1D: 'Puzzle maps, land & water forms, botany cabinet, life cycles.',
      cosmicaC2T: 'Great Lessons (Elementary)',
      cosmicaC2D: 'Creation of the Universe, Coming of Life, Story of Writing and Numbers.'
    },
    cycle: {
      badge: 'Authentic Classroom Flow',
      title: 'The 3-Hour Work Cycle, Digitized without Intrusion',
      subtitle: 'Technology must remain invisible to the child and a relief to the guide. See how a morning unfolds in the prepared environment.',
      steps: [
        {
          step: '01',
          title: 'Arrival & Free Choice',
          time: '08:30 — 09:30 AM',
          desc: 'The child enters the prepared environment, greets the guide, stores personal items, and spontaneously selects work on a floor rug or table.',
          software: 'The guide checks in morning attendance in 5 seconds with a single tap.'
        },
        {
          step: '02',
          title: 'Deep Concentration & Normalization',
          time: '09:30 — 11:00 AM',
          desc: 'Peak concentration and polarization of attention. Independent repetition without bells or outside interruptions.',
          software: 'Fast 3-period lesson recording with photo evidence linked directly to student portfolios.'
        },
        {
          step: '03',
          title: 'Community Gathering & Portfolio Report',
          time: '11:00 — 11:30 AM',
          desc: 'Restoration of materials to perfect order, community circle, shared snack, and warm farewell.',
          software: 'Automatic generation of narrative progress portfolios for families with zero overtime at home.'
        }
      ]
    },
    modules: {
      badge: 'Complete Ecosystem',
      title: 'Specialized Modules Connecting Your Entire School',
      subtitle: 'Designed to eliminate isolated spreadsheets, disconnected forms, and chaotic group chats.',
      items: [
        {
          title: 'Pro Form Builder',
          desc: 'Visual form creator for surveys, enrollments, and medical forms. Submissions sync directly into student files with zero copy-pasting.',
          icon: 'form'
        },
        {
          title: 'Flexible Process Pipelines',
          desc: 'Model any school process as a visual Kanban pipeline: Admissions, Graduation, Guide Hiring, Re-enrollment, or Special Support.',
          icon: 'pipeline'
        },
        {
          title: 'Smart Scheduling & Calendars',
          desc: 'Book family interviews, classroom observation visits, and school events without scheduling conflicts, complete with email & WhatsApp confirmations.',
          icon: 'calendar'
        },
        {
          title: 'Observations & Narrative Portfolios',
          desc: 'Environment daily pedagogical journal, photo records with consent safeguards, and qualitative progress reports.',
          icon: 'compass'
        },
        {
          title: 'Automated Tuition, Finance & Invoicing',
          desc: 'Automated recurring tuition billing via Stripe or direct bank transfer with automated ledger reconciliation.',
          icon: 'credit'
        },
        {
          title: 'Included Institutional Web Builder',
          desc: 'If your school does not have a professional website, it is already included in your membership. Features a rich catalog of styles and sections you can easily customize and adapt to your school brand, typography, and colors.',
          icon: 'globe'
        },
        {
          title: 'Exclusive Family Portal',
          desc: 'Private and respectful parent communication without invasive group chats. Official newsletters, school calendar, and read receipts.',
          icon: 'chat'
        },
        {
          title: 'Staff, Guides & Role Management',
          desc: 'Granular permissions by classroom environment, collaborative material planning, and historical institutional memory.',
          icon: 'users'
        }
      ]
    },
    calculator: {
      badge: 'Realistic Savings Calculator',
      title: 'Calculate your actual financial recovery and hours saved',
      subtitle: 'Enter your average monthly tuition, school currency, and student enrollment:',
      currencyLabel: 'School Currency:',
      tuitionLabel: 'Average Monthly Tuition per Student:',
      studentsLabel: 'Active Student Enrollment:',
      students: 'students',
      hSaved: 'Administrative Hours Saved',
      hDesc: 'Less manual paperwork, admissions filing, and weekend report preparation.',
      moraSaved: 'Estimated Delinquent Recovery',
      moraDesc: 'Based on 4.5% delinquent tuition recovery via automated recurring billing.',
      paperSaved: 'Sheets of Paper Eliminated',
      paperDesc: '100% digital student files, forms, invoices, and daily logs.',
      cta: 'Start Free Trial with these results →'
    },
    pricing: {
      badge: 'Transparent & Custom Modular Pricing',
      title: 'Build Your Custom Package for Your School',
      subtitle: 'No rigid tiers or surprise fees. Choose how many environments you manage and select only the modules your school truly needs.',
      monthly: 'Monthly Billing',
      annual: 'Annual Billing',
      discountPill: '2 Months Free (17% Off)',
      usdMonth: 'USD / month',
      environmentsTitle: '1. Classroom Environments to Manage',
      environmentsSubtitle: '$25 USD/mo for each of the first 3 environments, and only $10 USD/mo for each additional environment from the 4th onward.',
      environmentsBadge: '1-3: $25 USD/mo • 4+: $10 USD/mo',
      envCountLabel: 'Active Environments:',
      envExample: 'e.g. Toddler Community (1), Children’s House (1), Elementary I (1) = 3 environments',
      optionalModulesTitle: '2. À la Carte Optional Modules',
      optionalModulesSubtitle: 'Toggle on or off according to your school’s growth.',
      optFinancesTitle: 'Automated Tuition Billing & Invoicing (Stripe, Mercado Pago, Bank Transfer)',
      optFinancesDesc: 'Automated ledger reconciliation, recurring auto-pay, and family financial statements.',
      optWebBuilderTitle: 'Institutional Website + Visual Web Builder + Traffic Analytics',
      optWebBuilderDesc: 'Rich catalog of customizable sections, styles, school brand colors, multilingual and custom domain with SSL.',
      optFormsTitle: 'Pro Form Builder (Typeform / Google Forms Alternative)',
      optFormsDesc: 'Data capture for admissions, health questionnaires, and surveys syncing directly into student records.',
      optPipelinesTitle: 'Customizable Process Pipelines (Kanban Stages)',
      optPipelinesDesc: 'Create flexible stage-by-stage Kanban workflows for student admissions, teacher hiring, graduations, re-enrollments, and more.',
      optNewsletterTitle: 'Email Newsletters & Bulletins (BYOK - Your Own SMTP Credentials)',
      optNewsletterDesc: 'Send official school newsletters from your official school domain with zero markup sending fees.',
      corePortalFamilies: 'Portal for Families',
      corePortalTeachers: 'Portal for Teachers',
      coreWaitlist: 'Waitlist Management',
      coreProgress: 'Progress Tracking',
      coreAttendance: 'Attendance Records',
      coreTrackers: 'Incident Trackers & Reports',
      coreTrackersDesc: 'Health, behavioral logs and incident reports with the child',
      coreCalendar: 'Calendars & Events',
      coreBulletins: 'Internal Bulletins',
      coreVault: 'Document Vault',
      coreGallery: 'Web Photo Gallery',
      freeBadge: 'Free',
      customBadge: 'Custom',
      storageTitle: '3. Cloud Storage & Media',
      storageSubtitle: '2 GB included for free. Add extra storage packs or connect your own AWS S3 bucket.',
      storageFree: '2 GB Base (Included Free)',
      storage12: '12 GB (+10 GB) — $5 USD/mo',
      storage22: '22 GB (+20 GB) — $10 USD/mo',
      storage52: '52 GB (+50 GB) — $25 USD/mo',
      storageByos: 'Own AWS S3 (Using your API Key)',
      coreTitle: '4. Core Modules Included in Base Membership ($14 USD/mo)',
      coreSubtitle: 'Fundamental components active on all accounts to power your school operations:',
      coreAiTitle: 'Montessori Pedagogical AI (BYOK — OpenAI, Anthropic, Gemini)',
      coreAiBadge: 'BYOK • 100% Included',
      coreAiDesc: 'Observation narratives for family reports, lesson recommendations, and bulletin translations using your own OpenAI (GPT-4o), Anthropic (Claude 3.5), or Google Gemini API key with zero inference markups.',
      summaryTitle: 'Your Investment Summary',
      trialNotice: 'Includes 3 Months Free Trial without credit card',
      ctaBtn: 'Start Free Trial'
    },
    faq: {
      badge: 'Frequently Asked Questions',
      title: 'Questions from School Leaders and Guides',
      items: [
        {
          q: 'How does per-environment pricing work and what is included?',
          a: 'Each Montessori classroom environment (e.g. Infant Community, Children’s House, Elementary I) is $25 USD/mo for the first 3 environments. This includes complete guide and assistant portals, presentation tracking, attendance, family portals, waitlist, digital records vault, and bulletins with zero per-student headcount penalties.'
        },
        {
          q: 'How does the tiered pricing discount work from the 4th environment onward?',
          a: 'The first 3 environments are $25 USD/mo each. From your 4th environment onward, each additional classroom is only $10 USD/mo. This ensures medium and large schools can scale their digital operations affordably as new classrooms open.'
        },
        {
          q: 'How does the Artificial Intelligence integration work and what does BYOK mean?',
          a: 'Pedagogical AI is included in all plans via BYOK (Bring Your Own Key). We never charge inflated subscription markups: you connect your own OpenAI (GPT-4o), Anthropic (Claude 3.5), or Google Gemini API key and pay directly to your provider only for actual usage cents, while guaranteeing full privacy and zero public training on your students’ data.'
        },
        {
          q: 'Can I add, remove, or switch modules and environments later?',
          a: 'Yes, anytime with 1-click flexibility. From your school settings console, you can toggle optional modules (such as Invoicing, Institutional Website, Form Builder, or Pipelines) or adjust your active environment count to match your current school term.'
        },
        {
          q: 'Which payment gateways and invoicing features does the Finance module support?',
          a: 'The Finance & Billing module integrates with Stripe (credit and debit cards worldwide), Mercado Pago (for Latin America), SPEI, bank transfers, and automatic tax receipt issuance, reconciliation, and parent financial statements.'
        },
        {
          q: 'Can I connect my school’s custom domain to the Institutional Website Builder?',
          a: 'Yes. The Institutional Website Builder includes custom domain connection (e.g. www.yourschool.edu), automatic SSL encryption, visual drag-and-drop section customization, brand colors, and multilingual SEO optimization.'
        },
        {
          q: 'How does Bring-Your-Own-Storage (AWS S3) and custom SMTP email work?',
          a: 'Every school account includes 2 GB of cloud storage for free. If you manage massive video and photo vaults, you can add cloud storage tiers or connect your own Amazon AWS S3 bucket and custom SMTP credentials with zero markup sending fees.'
        },
        {
          q: 'How does the 3-month free trial work and is a credit card required?',
          a: 'We configure your platform with all your selected modules and environments for 90 full days with zero cost and no credit card required. Our team provides personalized onboarding and data migration from day one.'
        }
      ]
    },
    finalCta: {
      title: 'Ready to elevate your Montessori school management?',
      subtitle: 'Start your 3-month free trial today. No credit card required, with dedicated human onboarding from day one.',
      button: 'Start Free Trial (3 Months)'
    },
    footer: {
      tagline: 'The comprehensive operating system for Montessori schools, guides, and families.',
      modulesHeader: 'Modules',
      schoolsHeader: 'Schools',
      contactHeader: 'Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      rights: 'All rights reserved.'
    },
    modal: {
      badge: '3 Months Free',
      title: 'Start 3-Month Free Trial',
      subtitle: 'We will configure full platform access tailored to your school environments for 3 months at zero cost.',
      nameLabel: 'Full Name *',
      namePlaceholder: 'e.g. Principal Sarah Jenkins',
      schoolLabel: 'School Name *',
      schoolPlaceholder: 'e.g. Sun Montessori House',
      studentsLabel: 'Environments to Test',
      emailLabel: 'Email Address *',
      emailPlaceholder: 'director@school.edu',
      phoneLabel: 'Phone / WhatsApp *',
      phonePlaceholder: '+1 (555) 234-5678',
      submitBtn: 'Start My 3 Months Free',
      successTitle: 'Request Received!',
      successDesc: 'A MontessoriNexus pedagogical specialist will reach out shortly to activate your 3-month trial with your selected configuration.'
    }
  },
  es: {
    announcement: {
      badge: 'Nuevo',
      text: 'Web Builder Institucional con catálogo de estilos y secciones adaptables a tu marca, Pipelines Dinámicos y Suite de IA Ética ya disponible.',
      link: 'Ver demo de Colegio Ceiba →'
    },
    nav: {
      pedagogy: 'Pedagogía',
      aiSuite: 'IA Ética',
      modules: 'Módulos',
      cycle: 'Ciclo de Trabajo',
      calculator: 'Calculadora',
      pricing: 'Precios',
      faq: 'Preguntas',
      login: 'Acceso Colegio'
    },
    hero: {
      badge: 'Tecnología consciente que honra el Método Montessori',
      titlePart1: 'La misma paz que se respira en tus ambientes, ahora',
      titleHighlight: 'en la gestión de tu escuela',
      subtitle: 'El punto de encuentro digital donde la observación pedagógica diaria, la relación con las familias y las operaciones del colegio conviven en perfecta armonía.',
      ctaBtn: 'Comenzar Prueba Gratis (3 Meses)',
      pill1: '3 meses de prueba gratuita',
      pill2: 'IA con valores y privacidad blindada',
      pill3: 'Puesta en marcha en 24 horas',
      mockupUrl: 'mi-escuela.montessorinexus.com/panel',
      mockupLive: 'Ciclo Matutino • 26 Alumnos Activos',
      mockupEnv: 'Casa de Niños 1 (3 a 6 Años)',
      mockupGuide: 'Guía Titular: María Montessori AMI • Asistente: Ana S.',
      mockupNewObs: '+ Nueva Observación'
    },
    mockupCards: {
      c1Name: 'Santiago M. (4a 2m)',
      c1Status: 'Concentración Profunda',
      c1Mat: 'Sensorial: Torre Rosa',
      c1Desc: 'Trabajo autónomo con los 10 cubos. Control de error manifestado en cubo 7.',
      c1Time: '42 min de flujo',
      c2Name: 'Elena R. (5a 1m)',
      c2Status: 'Presentación',
      c2Mat: 'Lenguaje: Alfabeto Móvil',
      c2Desc: 'Composición de palabras: fonemas /m/ /a/ /s/ /a/. Audio registrado por la guía.',
      c2Time: 'Etapa 2 Completa',
      c3Name: 'Mateo V. (3a 8m)',
      c3Status: 'Exploración Autónoma',
      c3Mat: 'Vida Práctica: Lavado de Manos',
      c3Desc: 'Secuencia completa de 8 pasos. Vierte agua en la jofaina con cuidado.',
      c3Time: 'Control de Error: Sin derrames'
    },
    mockupExt: {
      cycleLivePill: 'Ciclo en Curso • 26 Niños Activos',
      navLive: 'Ambiente en Vivo',
      navAreas: 'Ciclo y Áreas AMI',
      navFamily: 'Vista Portal Familias',
      navAdmissions: 'Admisiones y Form.',
      navBilling: 'Cobranza y Facturas',
      subSummary: '26 niños en ambiente • 18 en concentración • 3 en lección • 5 en gracia y cortesía',
      quickPresentation: '+ Registrar Presentación',
      cycleTimelineTitle: 'Curva del Ciclo de Trabajo de 3 Horas',
      cycleCurrentPhase: 'Fase actual: Pico de "Gran Trabajo" (Min 75-150)',
      cycleNormalState: '100% de los niños conectados con su período sensible',
      areaPracticalLife: 'Vida Práctica',
      areaSensorial: 'Sensorial',
      areaLanguage: 'Lenguaje',
      areaMath: 'Matemáticas',
      familyPortalTitle: 'Portal Familia Ceiba • Santiago M.',
      familyNotification: 'Diario actualizado hoy a las 11:30 AM',
      familyNarrative: '«Hoy Santiago experimentó un hermoso período de concentración de 42 minutos con la Torre Rosa, ordenando los 10 bloques por gradación y autorregulando el séptimo cubo con gran satisfacción.»',
      familyPhotoConsent: 'Foto verificada con consentimiento familiar',
      familyZeroGrades: 'Sin exámenes numéricos • Narrativa cualitativa pura',
      syncingStatus: 'Sincronizando ambiente en tiempo real • 26 observaciones activas'
    },
    aiSuite: {
      badge: 'Inteligencia Artificial Ética & Centrada en el Niño',
      title: 'IA diseñada para potenciar el cuidado, la privacidad y la voz de tu colegio',
      subtitle: 'No reemplazamos la mirada de la guía: eliminamos la carga administrativa, blindamos los datos y enriquecemos la comunicación con tecnología consciente.',
      cards: [
        {
          tag: 'Privacidad y Protección Visual',
          title: 'Detección Facial y Blur Automático por Consentimiento',
          desc: 'Al subir fotografías al diario o galería, la IA cruza los consentimientos digitales del tutor. Si una familia no autorizó imagen pública, la IA aplica difuminado facial o marca de agua protectora al instante.',
          icon: 'shield',
          highlight: '100% Blindaje GDPR & Ley de Protección de Datos'
        },
        {
          tag: 'Voz Institucional & Redacción',
          title: 'Asistente de Redacción Narrativa Montessori',
          desc: 'La guía dicta o escribe 3 notas breves y la IA construye un reporte pedagógico elocuente y cálido, respetando el vocabulario oficial de Maria Montessori y la personalidad de tu colegio.',
          icon: 'brain',
          highlight: 'Ahorro de más de 4 horas semanales por guía'
        },
        {
          tag: 'Diagnóstico Cualitativo',
          title: 'Matriz FODA y Recomendación de Presentaciones',
          desc: 'Analiza el historial de materiales trabajados, periodos de concentración e intereses espontáneos para sugerir a la guía las siguientes presentaciones idóneas según el ritmo del niño.',
          icon: 'sparkle',
          highlight: 'Sugerencias personalizadas basadas en el currículo AMI'
        },
        {
          tag: 'Automatización Humana',
          title: 'Alertas de Transición y Periodos Sensitivos',
          desc: 'Detecta cuando un alumno de Comunidad Infantil o Casa de Niños está alcanzando los hitos de madurez para su transición de ambiente, notificando a la dirección pedagógica con tiempo.',
          icon: 'workflow',
          highlight: 'Transiciones respetuosas y bien planificadas'
        }
      ]
    },
    areas: {
      badge: 'Currículo Precargado',
      title: 'Mapeado a las 5 Áreas de Desarrollo Montessori',
      subtitle: 'Selecciona un área para ver los materiales y presentaciones integrados en el sistema:',
      tabs: {
        practica: 'Vida Práctica',
        sensorial: 'Desarrollo Sensorial',
        lenguaje: 'Lenguaje & Fonética',
        mate: 'Matemáticas Concretas',
        cosmica: 'Educación Cósmica'
      },
      practicaTitle: 'Área de Vida Práctica',
      practicaBadge: '28 Materiales Precargados',
      practicaDesc: 'Fomenta la motricidad fina, coordinación visomotriz, autonomía y concentración. El software permite registrar la secuencia de lecciones de gracia y cortesía, cuidado de la persona y cuidado del entorno.',
      practicaC1T: 'Cuidado del Entorno',
      practicaC1D: 'Vertido de granos y líquidos, lavado de mesa, doblado de servilletas, cuidado de plantas.',
      practicaC2T: 'Cuidado de la Persona',
      practicaC2D: 'Bastidores de vestir (botones, cremalleras, lazos), lavado de manos, cepillado.',

      sensorialTitle: 'Área de Desarrollo Sensorial',
      sensorialBadge: '34 Materiales Precargados',
      sensorialDesc: 'Permite ordenar y clasificar impresiones del mundo físico. Cada material cuenta con su control de error parametrizado para que la guía registre si el niño identificó el error de forma autónoma.',
      sensorialC1T: 'Discriminación Visual & Dimensión',
      sensorialC1D: 'Torre Rosa, Escalera Marrón, Cilindros con y sin botón, Gabinete Geométrico.',
      sensorialC2T: 'Táctil, Térmico, Bárico & Auditivo',
      sensorialC2D: 'Tablillas de lija, cilindros de sonido, botellas térmicas, cajas de olores.',

      lenguajeTitle: 'Área de Lenguaje & Lectoescritura',
      lenguajeBadge: '42 Materiales Precargados',
      lenguajeDesc: 'Secuencia fonética natural desde la explosión de la escritura hasta la lectura total. Soporte bilingüe completo (Español / Inglés) para ambientes de inmersión.',
      lenguajeC1T: 'Preparación para la Mano & Oído',
      lenguajeC1D: 'Juego del sonido (I Spy), Resaques Metálicos, Letras de Lija cursivas y de imprenta.',
      lenguajeC2T: 'Composición & Gramática',
      lenguajeC2D: 'Alfabeto Móvil, tarjetas de nomenclatura clasificada, símbolos gramaticales sólidos.',

      mateTitle: 'Área de Matemáticas Concretas',
      mateBadge: '38 Materiales Precargados',
      mateDesc: 'Desde la cantidad concreta hasta la abstracción aritmética y el sistema decimal en base diez.',
      mateC1T: 'Números del 1 al 10 & Sistema Decimal',
      mateC1D: 'Barras numéricas, números de lija, husos, perlas doradas (unidades, decenas, centenas, millar).',
      mateC2T: 'Operaciones & Memorización',
      mateC2D: 'Juego del banco, tablero de la suma y resta, ábaco pequeño, cadenas del cuadrado y cubo.',

      cosmicaTitle: 'Área de Educación Cósmica',
      cosmicaBadge: '25 Materiales Precargados',
      cosmicaDesc: 'El niño comprende su lugar en el universo a través de la geografía, botánica, zoología y las 5 Grandes Lecciones.',
      cosmicaC1T: 'Geografía & Ciencias Naturales',
      cosmicaC1D: 'Mapas rompecabezas, formas de tierra y agua, gabinete de botánica, ciclo vital.',
      cosmicaC2T: 'Grandes Lecciones (Taller)',
      cosmicaC2D: 'La Creación del Universo, La Aparición de la Vida, La Historia de la Escritura y Números.'
    },
    cycle: {
      badge: 'Flujo de Ambiente Real',
      title: 'El Ciclo de Trabajo de 3 Horas, Digitalizado sin Estorbar',
      subtitle: 'La tecnología debe ser invisible para el niño y un alivio para la guía. Mira cómo fluye una mañana en el ambiente.',
      steps: [
        {
          step: '01',
          title: 'Llegada y Elección Libre',
          time: '08:30 — 09:30 AM',
          desc: 'El niño entra al ambiente preparado, saluda a su guía, guarda sus pertenencias y elige de forma espontánea el material sobre el tapete o mesa.',
          software: 'La guía visualiza en 5 segundos las asistencias del día con un toque.'
        },
        {
          step: '02',
          title: 'Concentración y Normalización',
          time: '09:30 — 11:00 AM',
          desc: 'Momento de máxima concentración y polarización de la atención. Repetición del trabajo sin interrupciones del timbre ni clases ajenas.',
          software: 'Registro ágil de presentaciones en 3 tiempos con fotos de evidencia que van directo al expediente.'
        },
        {
          step: '03',
          title: 'Cierre, Comunidad y Reporte',
          time: '11:00 — 11:30 AM',
          desc: 'Restauración del ambiente al orden perfecto, reunión de línea comunitaria, refrigerio compartido y despedida afectuosa.',
          software: 'Generación automática del portafolio narrativo para las familias sin horas de redacción en casa.'
        }
      ]
    },
    modules: {
      badge: 'Ecosistema Completo',
      title: 'Módulos Especializados que Conectan Todo Tu Colegio',
      subtitle: 'Diseñado para eliminar hojas de cálculo aisladas, formularios externos y grupos de chat desorganizados.',
      items: [
        {
          title: 'Gestor de Formularios Pro',
          desc: 'Constructor visual de formularios para encuestas, inscripciones y autorizaciones. Las respuestas se vinculan en tiempo real al expediente del alumno sin copiar y pegar datos.',
          icon: 'form'
        },
        {
          title: 'Pipelines de Procesos Flexibles',
          desc: 'Modela cualquier proceso de tu escuela en etapas visuales tipo Kanban: Admisiones, Graduación, Re-inscripciones, Contratación de Guías o Seguimiento Psicopedagógico.',
          icon: 'pipeline'
        },
        {
          title: 'Calendarización & Agendas Inteligentes',
          desc: 'Agenda entrevistas con familias, visitas de observación al ambiente y eventos escolares sin empalmes, con confirmación por correo y WhatsApp.',
          icon: 'calendar'
        },
        {
          title: 'Observación y Portafolio Narrativo',
          desc: 'Diario pedagógico por ambiente, registro fotográfico con consentimiento protegido y reportes cualitativos semestrales.',
          icon: 'compass'
        },
        {
          title: 'Cobranza, Finanzas & Facturación',
          desc: 'Cobro automatizado de colegiaturas con Mercado Pago, Stripe o SPEI. Conciliación automática y reducción drástica de morosidad.',
          icon: 'credit'
        },
        {
          title: 'Web Builder Institucional Incluido',
          desc: 'Si tu colegio no tiene una web profesional, ya viene incluida en tu membresía. Cuenta con un catálogo de estilos y secciones que puedes modificar y adaptar a la marca, tipografía y colores de tu colegio.',
          icon: 'globe'
        },
        {
          title: 'Portal Familiar Exclusivo',
          desc: 'Canal directo y elegante para las familias sin la invasión de grupos de WhatsApp. Circulares oficiales, calendario y confirmación de lectura.',
          icon: 'chat'
        },
        {
          title: 'Gestión de Guías, Asistentes & Roles',
          desc: 'Permisos granulares por ambiente, planeación colaborativa de materiales y memoria pedagógica histórica de tu institución.',
          icon: 'users'
        }
      ]
    },
    calculator: {
      badge: 'Calculadora de Ahorro Real',
      title: 'Calcula tu retorno financiero y horas de oficina recuperadas',
      subtitle: 'Ingresa la mensualidad promedio de tu colegio, la moneda y la cantidad de alumnos:',
      currencyLabel: 'Moneda del Colegio:',
      tuitionLabel: 'Colegiatura / Mensualidad Promedio:',
      studentsLabel: 'Alumnos Matriculados Activos:',
      students: 'alumnos',
      hSaved: 'Horas Administrativas Ahorradas',
      hDesc: 'Menos tiempo en hojas de cálculo, conciliación bancaria y expedientes en papel.',
      moraSaved: 'Recuperación de Morosidad Estimada',
      moraDesc: 'Basado en 4.5% de recuperación de cartera vencida con cobro recurrente automático.',
      paperSaved: 'Hojas de Papel Eliminadas',
      paperDesc: '100% de expedientes, cobros, cuestionarios y diarios digitales.',
      cta: 'Comenzar Prueba Gratuita con estos resultados →'
    },
    pricing: {
      badge: 'Cotizador Transparente & a la Medida',
      title: 'Arma tu Paquete según las Necesidades de tu Colegio',
      subtitle: 'Sin planes rígidos ni sorpresas. Selecciona cuántos ambientes deseas registrar y los módulos que tu institución realmente necesita.',
      monthly: 'Pago Mensual',
      annual: 'Pago Anual',
      discountPill: '2 Meses Gratis (17% Dcto)',
      usdMonth: 'USD / mes',
      environmentsTitle: '1. Ambientes / Salones a Gestionar',
      environmentsSubtitle: '$25 USD/mes por cada uno de los primeros 3 ambientes, y solo $10 USD/mes por cada ambiente adicional a partir del 4to.',
      environmentsBadge: '1-3: $25 USD/mes • 4+: $10 USD/mes',
      envCountLabel: 'Ambientes Activos:',
      envExample: 'Ej. Nido (1), Casa de Niños (1), Taller I (1) = 3 ambientes',
      optionalModulesTitle: '2. Módulos Adicionales a la Carta',
      optionalModulesSubtitle: 'Activa o desactiva módulos según el crecimiento de tu colegio.',
      optFinancesTitle: 'Cobranza Automatizada de Colegiaturas & Facturación (Stripe, Mercado Pago, SPEI)',
      optFinancesDesc: 'Configura suscripciones automatizadas y cobro recurrente con tu propia cuenta de Stripe o Mercado Pago, conciliación bancaria y estados de cuenta para familias.',
      optWebBuilderTitle: 'Sitio Web Institucional + Creador Web Visual + Analítica de Visitas',
      optWebBuilderDesc: 'Catálogo de secciones y estilos personalizables, colores de tu colegio, soporte multilingüe y dominio propio con SSL.',
      optFormsTitle: 'Gestor de Formularios Pro (Alternativa a Typeform / Google Forms)',
      optFormsDesc: 'Captura de datos para admisiones, cuestionarios médicos y encuestas que alimentan el expediente del niño.',
      optPipelinesTitle: 'Pipelines de Procesos Configurables (Tableros Kanban)',
      optPipelinesDesc: 'Crea y personaliza flujos con tableros Kanban por etapas para admisiones, contratación de docentes, graduación, reinscripciones y mucho más.',
      optNewsletterTitle: 'Boletines & Circulares por Email (Credenciales SMTP Propias)',
      optNewsletterDesc: 'Envía boletines oficiales con el remitente de tu propio colegio sin comisiones por envío.',
      corePortalFamilies: 'Portal para Familias',
      corePortalTeachers: 'Portal para Guías y Docentes',
      coreWaitlist: 'Gestión de Lista de Espera',
      coreProgress: 'Registro de Presentaciones',
      coreAttendance: 'Control de Asistencias',
      coreTrackers: 'Trackers de Incidencias',
      coreTrackersDesc: 'Registro y seguimiento de incidencias, salud y conducta',
      coreCalendar: 'Calendario & Eventos',
      coreBulletins: 'Circulares Internas',
      coreVault: 'Bóveda de Documentos',
      coreGallery: 'Galería Web',
      freeBadge: 'Gratis',
      customBadge: 'Personalizado',
      storageTitle: '3. Almacenamiento en la Nube',
      storageSubtitle: '2 GB incluidos gratis para fotos y documentos. Puedes contratar paquetes adicionales o conectar tu propio AWS S3.',
      storageFree: '2 GB Base (Incluido Gratis)',
      storage12: '12 GB (+10 GB) — $5 USD/mes',
      storage22: '22 GB (+20 GB) — $10 USD/mes',
      storage52: '52 GB (+50 GB) — $25 USD/mes',
      storageByos: 'AWS S3 Propio (Con tu clave API)',
      coreTitle: '4. Módulos Esenciales Incluidos en la Membresía Base ($14 USD/mes)',
      coreSubtitle: 'Componentes fundamentales activos en todas las cuentas para garantizar la operación del colegio:',
      coreAiTitle: 'IA Pedagógica Montessori (BYOK — OpenAI, Anthropic, Gemini)',
      coreAiBadge: 'BYOK • 100% Incluido',
      coreAiDesc: 'Genera narrativas de observación para reportes a familias, redacta sugerencias de presentaciones y traduce circulares conectando tu propia clave API (OpenAI GPT-4o, Anthropic Claude o Google Gemini) sin sobrecostos de inferencia.',
      summaryTitle: 'Resumen de tu Inversión',
      trialNotice: 'Incluye 3 Meses de Prueba Gratis sin tarjeta de crédito',
      ctaBtn: 'Iniciar Prueba Gratuita'
    },
    faq: {
      badge: 'Dudas Frecuentes',
      title: 'Preguntas de Directores y Guías',
      items: [
        {
          q: '¿Cómo funciona el precio por ambientes y qué incluye?',
          a: 'Cada ambiente o salón Montessori (ej. Comunidad Infantil, Casa de Niños 1, Taller I) cuesta $25 USD/mes para los primeros 3 ambientes. Incluye portal de familias, portal de guías, seguimiento de presentaciones Montessori, pase de asistencia, lista de espera, bóveda de expedientes y circulares, sin límite de alumnos ni cobros ocultos.'
        },
        {
          q: '¿Cómo funciona el descuento escalonado a partir del 4to ambiente?',
          a: 'Los primeros 3 ambientes tienen un valor de $25 USD/mes cada uno. Del 4to ambiente en adelante, cada salón adicional cuesta únicamente $10 USD/mes, permitiendo que colegios medianos y grandes escalen con costos decrecientes.'
        },
        {
          q: '¿Cómo funciona la Inteligencia Artificial en la plataforma y qué significa BYOK?',
          a: 'La IA pedagógica está incluida en todos los planes bajo el modelo BYOK (Bring Your Own Key). No cobramos suscripciones infladas por usar IA: conectas tu propia API Key de OpenAI (GPT-4o), Anthropic (Claude 3.5) o Google Gemini y pagas directamente a tu proveedor solo los centavos de tu consumo real, manteniendo la total privacidad y confidencialidad de los datos de tus alumnos.'
        },
        {
          q: '¿Puedo cambiar de módulos o aumentar ambientes más adelante?',
          a: 'Sí, en cualquier momento con total flexibilidad. Desde tu panel de administración puedes activar o desactivar módulos opcionales (ej. Cobranza, Formularios, Website Builder) o agregar nuevos ambientes según el crecimiento de tu matrícula.'
        },
        {
          q: '¿Qué pasarelas de pago y métodos admite el módulo de Cobranza & Facturación?',
          a: 'El módulo de Finanzas se integra con Stripe (tarjetas de crédito y débito internacionales), Mercado Pago (para toda Latinoamérica), transferencias bancarias, SPEI y conciliación automatizada con emisión de estados de cuenta para padres.'
        },
        {
          q: '¿Puedo conectar mi propio dominio institucional en el Website Builder?',
          a: 'Sí. El módulo de Sitio Web Institucional incluye conexión con tu propio dominio (ej. www.tucolegio.edu), certificado de seguridad SSL automático, editor visual de secciones institucionales, colores de marca y optimización SEO multilingüe.'
        },
        {
          q: '¿Cómo funciona la integración de AWS S3 y Correo propio (BYOK)?',
          a: 'Tu cuenta incluye 2 GB de almacenamiento en la nube sin costo. Si requieres espacio masivo para fotos y videos, puedes contratar paquetes adicionales o conectar tu propio bucket de Amazon AWS S3 y servidor SMTP sin pagar tarifas por envío.'
        },
        {
          q: '¿Cómo funciona la prueba gratuita de 3 meses y qué necesito para empezar?',
          a: 'Configuramos tu colegio con todos los módulos y ambientes seleccionados durante 90 días completos sin costo ni compromiso. No pedimos tarjeta de crédito para iniciar y te acompañamos paso a paso en la configuración inicial.'
        }
      ]
    },
    finalCta: {
      title: '¿Listo para transformar la gestión de tu colegio?',
      subtitle: 'Comienza hoy tu prueba gratuita de 3 meses. Sin tarjeta requerida, con acompañamiento humano desde el primer minuto.',
      button: 'Comenzar Prueba Gratis (3 Meses)'
    },
    footer: {
      tagline: 'El sistema operativo integral para colegios, guías y familias Montessori.',
      modulesHeader: 'Módulos',
      schoolsHeader: 'Colegios',
      contactHeader: 'Contacto',
      privacy: 'Aviso de Privacidad',
      terms: 'Términos de Servicio',
      rights: 'Todos los derechos reservados.'
    },
    modal: {
      badge: '3 Meses Sin Costo',
      title: 'Iniciar Prueba Gratis de 3 Meses',
      subtitle: 'Configuraremos el acceso completo a la plataforma para los ambientes de tu colegio durante 3 meses sin costo.',
      nameLabel: 'Nombre Completo *',
      namePlaceholder: 'Ej. Directora Carmen Mendoza',
      schoolLabel: 'Nombre del Colegio *',
      schoolPlaceholder: 'Ej. Casa de Niños Sol',
      studentsLabel: 'Ambientes a Probar',
      emailLabel: 'Correo Electrónico *',
      emailPlaceholder: 'direccion@colegio.edu',
      phoneLabel: 'Teléfono / WhatsApp *',
      phonePlaceholder: '+52 998 123 4567',
      submitBtn: 'Comenzar mis 3 Meses Gratis',
      successTitle: '¡Solicitud Recibida!',
      successDesc: 'Un asesor pedagógico de MontessoriNexus te contactará en breve para activar tus 3 meses de prueba con la configuración elegida.'
    }
  },
  pt: {
    announcement: {
      badge: 'Novo',
      text: 'Web Builder Institucional com catálogo de estilos e seções personalizáveis para sua marca, Pipelines Dinâmicos e Suite de IA Ética já disponíveis.',
      link: 'Ver demonstração da Escola Ceiba →'
    },
    nav: {
      pedagogy: 'Pedagogia',
      aiSuite: 'IA Ética',
      modules: 'Módulos',
      cycle: 'Ciclo de Trabalho',
      calculator: 'Calculadora',
      pricing: 'Preços',
      faq: 'Perguntas',
      login: 'Acesso Escola'
    },
    hero: {
      badge: 'Tecnologia consciente que honra o Método Montessori',
      titlePart1: 'A mesma paz que se respira em seus ambientes, agora',
      titleHighlight: 'na gestão da sua escola',
      subtitle: 'O ponto de encontro digital onde a observação pedagógica diária, a relação com as famílias e as operações da escola convivem em perfeita harmonia.',
      ctaBtn: 'Iniciar Teste Grátis (3 Meses)',
      pill1: '3 meses de teste gratuito',
      pill2: 'IA com valores e privacidade blindada',
      pill3: 'Implantação em 24 horas',
      mockupUrl: 'minha-escola.montessorinexus.com/panel',
      mockupLive: 'Ciclo Matutino • 26 Crianças Ativas',
      mockupEnv: 'Casa das Crianças 1 (3 a 6 Anos)',
      mockupGuide: 'Guia Titular: Maria Montessori AMI • Assistente: Ana S.',
      mockupNewObs: '+ Nova Observação'
    },
    mockupCards: {
      c1Name: 'Santiago M. (4a 2m)',
      c1Status: 'Concentração Profunda',
      c1Mat: 'Sensorial: Torre Rosa',
      c1Desc: 'Trabalho independente com 10 cubos. Autocorreção observada no 7º cubo.',
      c1Time: '42 min de fluxo',
      c2Name: 'Elena R. (5a 1m)',
      c2Status: 'Apresentação Realizada',
      c2Mat: 'Linguagem: Alfabeto Móvel',
      c2Desc: 'Composição de palavras: fonemas /m/ /a/ /s/ /a/. Guia gravou áudio.',
      c2Time: 'Etapa 2 Concluída',
      c3Name: 'Mateo V. (3a 8m)',
      c3Status: 'Exploração Autônoma',
      c3Mat: 'Vida Prática: Lavar as Mãos',
      c3Desc: 'Sequência completa de 8 passos. Despeja água na bacia com cuidado.',
      c3Time: 'Controle de Erro: Sem respingos'
    },
    mockupExt: {
      cycleLivePill: 'Ciclo em Andamento • 26 Crianças Ativas',
      navLive: 'Ambiente ao Vivo',
      navAreas: 'Ciclo e Áreas AMI',
      navFamily: 'Portal das Famílias',
      navAdmissions: 'Admissões e Form.',
      navBilling: 'Mensalidades e Cobrança',
      subSummary: '26 crianças no ambiente • 18 em concentração • 3 em lição • 5 em graça e cortesia',
      quickPresentation: '+ Registrar Apresentação',
      cycleTimelineTitle: 'Curva do Ciclo de Trabalho de 3 Horas',
      cycleCurrentPhase: 'Fase atual: Pico de "Grande Trabalho" (Min 75-150)',
      cycleNormalState: '100% das crianças conectadas com seu período sensível',
      areaPracticalLife: 'Vida Prática',
      areaSensorial: 'Sensorial',
      areaLanguage: 'Linguagem',
      areaMath: 'Matemática',
      familyPortalTitle: 'Portal Família Ceiba • Santiago M.',
      familyNotification: 'Diário atualizado hoje às 11:30',
      familyNarrative: '«Hoje Santiago vivenciou um lindo período de concentração de 42 minutos com a Torre Rosa, ordenando os 10 blocos por gradação com plena autonomia.»',
      familyPhotoConsent: 'Foto verificada com consentimento dos responsáveis',
      familyZeroGrades: 'Sem notas numéricas • Narrativa qualitativa pura',
      syncingStatus: 'Sincronizando ambiente em tempo real • 26 observações ativas'
    },
    aiSuite: {
      badge: 'Inteligência Artificial Ética & Centrada na Criança',
      title: 'IA desenhada para potencializar o cuidado, a privacidade e a voz da sua escola',
      subtitle: 'Nunca substituímos o olhar atento da guia: eliminamos a sobrecarga burocrática, blindamos a privacidade e enriquecemos a comunicação.',
      cards: [
        {
          tag: 'Privacidade Visual e Proteção Infantil',
          title: 'Detecção Facial e Blur Automático por Consentimento',
          desc: 'Ao enviar fotos para os diários ou galerias, a IA cruza os termos digitais dos pais. Se uma família não autorizou imagem pública, a IA aplica desfoque facial ou marca d’água protetora na hora.',
          icon: 'shield',
          highlight: '100% em conformidade com LGPD e Proteção de Dados'
        },
        {
          tag: 'Voz da Escola & Redação',
          title: 'Assistente de Redação Narrativa Montessori',
          desc: 'A guia anota tópicos breves e a IA constrói um relatório pedagógico eloqüente e caloroso, respeitando o vocabulário oficial de Maria Montessori e a identidade da sua escola.',
          icon: 'brain',
          highlight: 'Economia de mais de 4 horas semanais por guia'
        },
        {
          tag: 'Diagnóstico Qualitativo',
          title: 'Matriz SWOT/FOFA e Sugestão de Apresentações',
          desc: 'Analisa o histórico de materiais trabalhados, períodos sensíveis e tempo de concentração para sugerir à guia as próximas apresentações ideais para o ritmo da criança.',
          icon: 'sparkle',
          highlight: 'Sugestões personalizadas baseadas no currículo AMI'
        },
        {
          tag: 'Automação Humanizada',
          title: 'Alertas de Transição e Períodos Sensíveis',
          desc: 'Detecta quando uma criança da Comunidade Infantil ou Casa das Crianças atinge os marcos de prontidão para a transição de ambiente, avisando a coordenação com antecedência.',
          icon: 'workflow',
          highlight: 'Transições respeitosas e bem planejadas'
        }
      ]
    },
    areas: {
      badge: 'Currículo Pré-carregado',
      title: 'Mapeado para as 5 Áreas de Desenvolvimento Montessori',
      subtitle: 'Selecione uma área para ver os materiais e lições integrados na plataforma:',
      tabs: {
        practica: 'Vida Prática',
        sensorial: 'Desenvolvimento Sensorial',
        lenguaje: 'Linguagem & Alfabetização',
        mate: 'Matemática Concreta',
        cosmica: 'Educação Cósmica'
      },
      practicaTitle: 'Área de Vida Prática',
      practicaBadge: '28 Materiais Pré-carregados',
      practicaDesc: 'Desenvolve a coordenação motora fina, autonomia, foco e ordem. Registra lições de Graça e Cortesia, Cuidado de Si e Cuidado com o Ambiente.',
      practicaC1T: 'Cuidado com o Ambiente',
      practicaC1D: 'Transvasar grãos e líquidos, lavar mesa, dobrar guardanapos, cuidar das plantas.',
      practicaC2T: 'Cuidado da Pessoa',
      practicaC2D: 'Molduras de vestir (botões, zíperes, laços), lavar as mãos, escovar os dentes.',

      sensorialTitle: 'Área de Desenvolvimento Sensorial',
      sensorialBadge: '34 Materiais Pré-carregados',
      sensorialDesc: 'Organiza e refina as impressões sensoriais do mundo físico. Cada material conta com controle de erro parametrizado para registrar a autocorreção.',
      sensorialC1T: 'Discriminação Visual & Dimensão',
      sensorialC1D: 'Torre Rosa, Escada Marrom, Cilindros com e sem botão, Gabinete Geométrico.',
      sensorialC2T: 'Tátil, Térmico, Bárico & Auditivo',
      sensorialC2D: 'Placas de lixa, cilindros sonoros, garrafas térmicas, caixas de cheiros.',

      lenguajeTitle: 'Área de Linguagem & Letramento',
      lenguajeBadge: '42 Materiais Pré-carregados',
      lenguajeDesc: 'Progressão fonética natural desde a explosão da escrita até a leitura compreensiva.',
      lenguajeC1T: 'Preparação para Mão e Ouvido',
      lenguajeC1D: 'Jogo dos sons (I Spy), Encaixes Metálicos, Letras de Lixa cursivas e bastão.',
      lenguajeC2T: 'Composição de Palavras & Gramática',
      lenguajeC2D: 'Alfabeto Móvel, cartões de nomenclatura classificada, símbolos gramaticais.',

      mateTitle: 'Área de Matemática Concreta',
      mateBadge: '38 Materiais Pré-carregados',
      mateDesc: 'Da quantidade concreta à abstração aritmética e ao sistema decimal de base dez.',
      mateC1T: 'Números de 1 a 10 & Sistema Decimal',
      mateC1D: 'Barras vermelhas e azuis, numerais de lixa, caixas de fusos, Contas Douradas.',
      mateC2T: 'Operações & Memorização',
      mateC2D: 'Jogo do banco, tábuas da adição e subtração, pequeno ábaco, cadeias de contas.',

      cosmicaTitle: 'Área de Educação Cósmica',
      cosmicaBadge: '25 Materiais Pré-carregados',
      cosmicaDesc: 'A criança compreende seu lugar no universo através da geografia, botânica, zoologia e as 5 Grandes Lições.',
      cosmicaC1T: 'Geografia & Ciências Naturais',
      cosmicaC1D: 'Mapas quebra-cabeça, formas de terra e água, gabinete botânico, ciclos vitais.',
      cosmicaC2T: 'Grandes Lições (Ensino Fundamental)',
      cosmicaC2D: 'O Surgimento do Universo, O Aparecimento da Vida, A História da Escrita.',
    },
    cycle: {
      badge: 'Fluxo Real de Sala',
      title: 'O Ciclo de Trabalho de 3 Horas, Digitalizado sem Interromper',
      subtitle: 'A tecnologia deve ser invisível para a criança e um alívio para a guia.',
      steps: [
        {
          step: '01',
          title: 'Chegada e Livre Escolha',
          time: '08:30 — 09:30 AM',
          desc: 'A criança entra no ambiente preparado, cumprimenta sua guia e escolhe espontaneamente seu material de trabalho.',
          software: 'A guia confere as presenças em 5 segundos com um toque.'
        },
        {
          step: '02',
          title: 'Concentração Profunda & Normalização',
          time: '09:30 — 11:00 AM',
          desc: 'Momento de foco máximo e polarização da atenção sem interrupções de sinos ou aulas externas.',
          software: 'Registro ágil de lições em 3 tempos com fotos que vão direto ao portfólio.'
        },
        {
          step: '03',
          title: 'Círculo Comunitário e Portfólio',
          time: '11:00 — 11:30 AM',
          desc: 'Restauração do ambiente à ordem perfeita, lanche compartilhado e despedida calorosa.',
          software: 'Geração automática de relatórios narrativos para as famílias sem horas extras em casa.'
        }
      ]
    },
    modules: {
      badge: 'Ecossistema Completo',
      title: 'Módulos Especializados que Conectam Toda a sua Escola',
      subtitle: 'Projetado para eliminar planilhas isoladas, formulários externos e grupos de mensagens desorganizados.',
      items: [
        {
          title: 'Construtor de Formulários Pro',
          desc: 'Criador visual de formulários para pesquisas, matrículas e fichas de saúde, sincronizados diretamente ao prontuário do aluno.',
          icon: 'form'
        },
        {
          title: 'Pipelines de Processos Flexíveis',
          desc: 'Modele qualquer processo da escola em etapas tipo Kanban: Admissões, Formatura, Contratação de Guias ou Acompanhamento.',
          icon: 'pipeline'
        },
        {
          title: 'Agendamento & Calendários Inteligentes',
          desc: 'Agende entrevistas com famílias, visitas de observação e eventos escolares sem conflitos de horário.',
          icon: 'calendar'
        },
        {
          title: 'Observação e Portfólio Narrativo',
          desc: 'Diário pedagógico por ambiente, registro de fotos com proteção de consentimento e relatórios qualitativos.',
          icon: 'compass'
        },
        {
          title: 'Cobrança, Finanças & Faturamento',
          desc: 'Cobrança automatizada de mensalidades via Pix, Boleto ou Cartão com conciliação automática.',
          icon: 'credit'
        },
        {
          title: 'Web Builder Institucional Incluído',
          desc: 'Se sua escola não possui um site profissional, ele já está incluído na sua assinatura, com catálogo de estilos e domínio próprio.',
          icon: 'globe'
        },
        {
          title: 'Portal Exclusivo para Famílias',
          desc: 'Canal de comunicação respeitoso e direto para os pais sem invasão de grupos de mensagens.',
          icon: 'chat'
        },
        {
          title: 'Gestão de Equipe, Guias & Funções',
          desc: 'Permissões por sala, planejamento colaborativo de materiais e arquivo histórico institucional.',
          icon: 'users'
        }
      ]
    },
    calculator: {
      badge: 'Calculadora de Economia Real',
      title: 'Calcule seu retorno financeiro e horas administrativas poupadas',
      subtitle: 'Insira a mensalidade média da sua escola, a moeda e a quantidade de alunos:',
      currencyLabel: 'Moeda da Escola:',
      tuitionLabel: 'Mensalidade Média por Aluno:',
      studentsLabel: 'Alunos Matriculados:',
      students: 'alunos',
      hSaved: 'Horas Administrativas Poupadas',
      hDesc: 'Menos papelada manual, cobrança manual e relatórios de fim de semana.',
      moraSaved: 'Recuperação de Inadimplência Estimada',
      moraDesc: 'Estimativa de 4.5% de recuperação com cobrança recorrente automatizada.',
      paperSaved: 'Folhas de Papel Eliminadas',
      paperDesc: '100% dos documentos e portfólios digitalizados.',
      cta: 'Iniciar Teste Gratuito com estes resultados →'
    },
    pricing: {
      badge: 'Precificação Transparente & Sob Medida',
      title: 'Monte seu Pacote de Acordo com as Necessidades da sua Escola',
      subtitle: 'Sem planos engessados ou custos ocultos. Escolha quantos ambientes atende e selecione apenas os módulos necessários.',
      monthly: 'Pagamento Mensal',
      annual: 'Pagamento Anual',
      discountPill: '2 Meses Grátis (17% Off)',
      usdMonth: 'USD / mês',
      environmentsTitle: '1. Ambientes / Salas a Gerenciar',
      environmentsSubtitle: '$25 USD/mês para cada um dos primeiros 3 ambientes, e apenas $10 USD/mês por cada ambiente adicional a partir do 4º.',
      environmentsBadge: '1-3: $25 USD/mês • 4+: $10 USD/mês',
      envCountLabel: 'Ambientes Ativos:',
      envExample: 'Ex. Nido (1), Casa das Crianças (1), Fundamental (1) = 3 ambientes',
      optionalModulesTitle: '2. Módulos Adicionais à La Carte',
      optionalModulesSubtitle: 'Ative ou desative conforme o crescimento da sua instituição.',
      optFinancesTitle: 'Cobrança Automatizada de Mensalidades & Faturas (Stripe, Pix, Boleto)',
      optFinancesDesc: 'Conciliação bancária automática, débito recorrente e extrato financeiro para as famílias.',
      optWebBuilderTitle: 'Site Institucional + Criador Web Visual + Análise de Acessos',
      optWebBuilderDesc: 'Catálogo de seções e estilos personalizáveis, cores da sua escola, suporte multilíngue e domínio próprio com SSL.',
      optFormsTitle: 'Criador de Formulários Pro (Alternativa ao Google Forms / Typeform)',
      optFormsDesc: 'Captação de dados para matrículas, fichas de saúde e pesquisas sincronizadas ao prontuário do aluno.',
      optPipelinesTitle: 'Pipelines de Processos Flexíveis (Etapas Kanban)',
      optPipelinesDesc: 'Modele qualquer fluxo: Admissões, Formatura, Contratação de Guias ou Rematrículas.',
      optNewsletterTitle: 'Boletins & Informativos por E-mail (Servidor SMTP Próprio)',
      optNewsletterDesc: 'Envie comunicados oficiais a partir do domínio da sua escola sem custos adicionais de envio.',
      corePortalFamilies: 'Portal das Famílias',
      corePortalTeachers: 'Portal das Guias e Educadores',
      coreWaitlist: 'Lista de Espera',
      coreProgress: 'Registro de Apresentações',
      coreAttendance: 'Controle de Frequência',
      coreTrackers: 'Trackers de Ocorrências',
      coreTrackersDesc: 'Registro de incidentes, saúde e observações do aluno',
      coreCalendar: 'Calendário & Eventos',
      coreBulletins: 'Informativos Internos',
      coreVault: 'Cofre de Documentos',
      coreGallery: 'Galeria Web',
      freeBadge: 'Grátis',
      customBadge: 'Sob Medida',
      storageTitle: '3. Armazenamento em Nuvem',
      storageSubtitle: '2 GB incluídos para fotos e documentos. Adicione pacotes extras ou conecte seu próprio bucket AWS S3.',
      storageFree: '2 GB Base (Incluído Grátis)',
      storage12: '12 GB (+10 GB) — $5 USD/mês',
      storage22: '22 GB (+20 GB) — $10 USD/mês',
      storage52: '52 GB (+50 GB) — $25 USD/mês',
      storageByos: 'AWS S3 Próprio (Com sua chave API)',
      coreTitle: '4. Módulos Essenciais Incluídos na Assinatura Base ($14 USD/mês)',
      coreSubtitle: 'Componentes essenciais ativos em todas as contas para manter a operação escolar:',
      coreAiTitle: 'IA Pedagógica Montessori (BYOK — OpenAI, Anthropic, Gemini)',
      coreAiBadge: 'BYOK • 100% Incluído',
      coreAiDesc: 'Gere relatórios pedagógicos para as famílias, traduza circulares e receba sugestões de lições conectando sua chave de API da OpenAI, Anthropic Claude ou Google Gemini sem taxas intermediárias de inferência.',
      summaryTitle: 'Resumo do seu Investimento',
      trialNotice: 'Inclui 3 Meses de Teste Grátis sem cartão de crédito',
      ctaBtn: 'Iniciar Teste Gratuito'
    },
    faq: {
      badge: 'Perguntas Frequentes',
      title: 'Dúvidas de Diretores e Guias',
      items: [
        {
          q: 'Como funciona a cobrança por ambiente e o que está incluído?',
          a: 'Cada sala ou ambiente Montessori custa $25 USD/mês para os primeiros 3 ambientes. Inclui portais para famílias e guias, registro de apresentações Montessori, frequência diária, lista de espera e prontuários digitais sem limite de alunos.'
        },
        {
          q: 'Como funciona o desconto a partir da 4ª sala/ambiente?',
          a: 'Os primeiros 3 ambientes custam $25 USD/mês cada. A partir do 4º ambiente, cada sala adicional custa apenas $10 USD/mês, permitindo que escolas em crescimento reduzam seus custos proporcionais.'
        },
        {
          q: 'Como funciona a Inteligência Artificial na plataforma e o que significa BYOK?',
          a: 'A IA pedagógica está incluída em todos os planos no modelo BYOK (Bring Your Own Key). Conecte sua própria chave de API da OpenAI (GPT-4o), Anthropic (Claude 3.5) ou Google Gemini e pague diretamente ao provedor apenas pelo uso real, garantindo total privacidade e sem treinar modelos públicos com os dados da sua escola.'
        },
        {
          q: 'Posso alterar módulos opcionais ou adicionar salas no futuro?',
          a: 'Sim, a qualquer momento pelo painel de controle da escola com total flexibilidade.'
        },
        {
          q: 'Quais formas de pagamento o módulo de Cobrança e Finanças suporta?',
          a: 'Integração completa com Stripe (cartões internacionais), Mercado Pago, transferências bancárias, boletos e conciliação automática com extratos financeiros para as famílias.'
        },
        {
          q: 'Posso usar meu próprio domínio institucional no Criador de Sites?',
          a: 'Sim. Inclui conexão de domínio próprio (ex. www.escola.edu.br), certificado SSL gratuito, personalização visual de seções, identidade visual e SEO multilíngue.'
        },
        {
          q: 'Como funciona a integração com AWS S3 e E-mail SMTP próprio?',
          a: 'Cada conta inclui 2 GB gratuitos na nuvem. Você pode adicionar planos de armazenamento ou conectar seu próprio bucket Amazon AWS S3 e servidor SMTP de e-mail.'
        },
        {
          q: 'Como funciona o teste gratuito de 3 meses?',
          a: 'Configuramos toda a plataforma com os módulos e salas selecionados durante 90 dias sem compromisso nem cartão de crédito.'
        }
      ]
    },
    finalCta: {
      title: 'Pronto para transformar a gestão da sua escola?',
      subtitle: 'Comece seu teste grátis de 3 meses hoje mesmo. Sem necessidade de cartão de crédito e com suporte humano dedicado.',
      button: 'Iniciar Teste Grátis (3 Meses)'
    },
    footer: {
      tagline: 'O sistema operacional completo para escolas, guias e famílias Montessori.',
      modulesHeader: 'Módulos',
      schoolsHeader: 'Escolas',
      contactHeader: 'Contato',
      privacy: 'Privacidade',
      terms: 'Termos de Serviço',
      rights: 'Todos os direitos reservados.'
    },
    modal: {
      badge: '3 Meses Grátis',
      title: 'Iniciar Teste Grátis de 3 Meses',
      subtitle: 'Configuraremos o acesso completo para os ambientes da sua escola por 3 meses sem custo.',
      nameLabel: 'Nome Completo *',
      namePlaceholder: 'Ex. Diretora Camila Souza',
      schoolLabel: 'Nome da Escola *',
      schoolPlaceholder: 'Ex. Escola Montessori Sol',
      studentsLabel: 'Ambientes para Testar',
      emailLabel: 'E-mail *',
      emailPlaceholder: 'direcao@escola.edu.br',
      phoneLabel: 'Telefone / WhatsApp *',
      phonePlaceholder: '+55 11 98765-4321',
      submitBtn: 'Iniciar meus 3 Meses Grátis',
      successTitle: 'Solicitação Recebida!',
      successDesc: 'Um consultor pedagógico entrará em contato para ativar seu período de 3 meses com a configuração selecionada.'
    }
  },
  fr: {
    announcement: {
      badge: 'Nouveau',
      text: 'Web Builder Institutionnel avec catalogue de styles et sections adaptables à votre marque, Pipelines Dynamiques et Suite d’IA Éthique maintenant disponibles.',
      link: 'Voir la démo de l’École Ceiba →'
    },
    nav: {
      pedagogy: 'Pédagogie',
      aiSuite: 'IA Éthique',
      modules: 'Modules',
      cycle: 'Cycle de Travail',
      calculator: 'Calculateur',
      pricing: 'Tarifs',
      faq: 'Questions',
      login: 'Accès École'
    },
    hero: {
      badge: 'Une technologie bienveillante au service de la méthode Montessori',
      titlePart1: 'La même sérénité qui règne dans vos ambiances, désormais',
      titleHighlight: 'au cœur de votre gestion',
      subtitle: 'Le point de rencontre numérique où l’observation pédagogique quotidienne, le lien avec les familles et les opérations de l’école coexistent en parfaite harmonie.',
      ctaBtn: 'Commencer l’Essai Gratuit (3 Mois)',
      pill1: '3 mois d’essai gratuit',
      pill2: 'IA éthique et confidentialité protégée',
      pill3: 'Mise en service en 24h',
      mockupUrl: 'mon-ecole.montessorinexus.com/panel',
      mockupLive: 'Cycle du Matin • 26 Enfants Actifs',
      mockupEnv: 'Maison des Enfants 1 (3 à 6 Ans)',
      mockupGuide: 'Éducatrice Principale: Maria Montessori AMI • Assistante: Ana S.',
      mockupNewObs: '+ Nouvelle Observation'
    },
    mockupCards: {
      c1Name: 'Santiago M. (4a 2m)',
      c1Status: 'Concentration Profonde',
      c1Mat: 'Sensoriel: Tour Rose',
      c1Desc: 'Travail autonome avec 10 cubes. Contrôle de l’erreur au 7e cube.',
      c1Time: '42 min de flow',
      c2Name: 'Elena R. (5a 1m)',
      c2Status: 'Présentation Effectuée',
      c2Mat: 'Langage: Alphabet Mobile',
      c2Desc: 'Composition de mots: phonèmes /m/ /a/ /s/ /a/. Enregistrement audio.',
      c2Time: 'Étape 2 Validée',
      c3Name: 'Mateo V. (3a 8m)',
      c3Status: 'Exploration Libre',
      c3Mat: 'Vie Pratique: Lavage des Mains',
      c3Desc: 'Séquence complète en 8 étapes. Verse l’eau dans la cuvette avec précaution.',
      c3Time: 'Contrôle de l’Erreur: Sans éclaboussure'
    },
    mockupExt: {
      cycleLivePill: 'Cycle en Cours • 26 Enfants Actifs',
      navLive: 'Ambiance en Direct',
      navAreas: 'Cycle & Domaines AMI',
      navFamily: 'Portail Famille',
      navAdmissions: 'Admissions & Form.',
      navBilling: 'Facturation & Frais',
      subSummary: '26 enfants en ambiance • 18 en concentration • 3 en présentation • 5 en grâce et courtoisie',
      quickPresentation: '+ Nouvelle Présentation',
      cycleTimelineTitle: 'Courbe du Grand Cycle de 3 Heures',
      cycleCurrentPhase: 'Phase actuelle: Pic du "Grand Travail" (Min 75-150)',
      cycleNormalState: '100% des enfants connectés à leur période sensible',
      areaPracticalLife: 'Vie Pratique',
      areaSensorial: 'Sensoriel',
      areaLanguage: 'Langage',
      areaMath: 'Mathématiques',
      familyPortalTitle: 'Portail Famille Ceiba • Santiago M.',
      familyNotification: 'Journal mis à jour aujourd’hui à 11h30',
      familyNarrative: '«Aujourd’hui, Santiago a fait l’expérience d’une remarquable période de concentration de 42 minutes avec la Tour Rose, ordonnant les 10 blocs avec grande fierté.»',
      familyPhotoConsent: 'Photo validée selon le consentement parental',
      familyZeroGrades: 'Zéro notation chiffrée • Évaluation narrative pure',
      syncingStatus: 'Synchronisation de l’ambiance en direct • 26 observations actives'
    },
    aiSuite: {
      badge: 'Intelligence Artificielle Éthique & Centrée sur l’Enfant',
      title: 'Une IA conçue pour valoriser la bienveillance, la confidentialité et la voix de votre école',
      subtitle: 'Nous ne remplaçons jamais le regard attentif de l’éducatrice: nous supprimons les lourdeurs administratives et sécurisons les données.',
      cards: [
        {
          tag: 'Confidentialité Visuelle et Protection de l’Enfant',
          title: 'Floutage Facial Automatique selon Consentement',
          desc: 'Lors de l’ajout de photos aux journaux ou galeries, l’IA vérifie les consentements parentaux. Si une famille a refusé la diffusion publique, l’IA applique immédiatement un flou facial ou un filigrane protecteur.',
          icon: 'shield',
          highlight: '100% Conforme RGPD et Protection des Données Enfants'
        },
        {
          tag: 'Voix de l’École & Rédaction',
          title: 'Assistant de Rédaction Pédagogique Montessori',
          desc: 'L’éducatrice note quelques mots clés et l’IA génère un bilan chaleureux et fidèle au vocabulaire officiel de Maria Montessori et au ton de votre établissement.',
          icon: 'brain',
          highlight: 'Plus de 4 heures de travail économisées par semaine'
        },
        {
          tag: 'Diagnostic Qualitatif',
          title: 'Matrice SWOT/SWOT Pédagogique & Suggestions',
          desc: 'Analyse l’historique des matériels, les périodes sensibles et la durée de concentration pour recommander les prochaines présentations adaptées au rythme de l’enfant.',
          icon: 'sparkle',
          highlight: 'Recommandations conformes au cursus AMI'
        },
        {
          tag: 'Automatisation Bienveillante',
          title: 'Alertes de Transition et Périodes Sensibles',
          desc: 'Détecte quand un enfant de la Communauté Enfantine ou de la Maison des Enfants est prêt pour changer d’ambiance, alertant la direction à l’avance.',
          icon: 'workflow',
          highlight: 'Transitions respectueuses et sereines'
        }
      ]
    },
    areas: {
      badge: 'Curriculum Intégré',
      title: 'Cartographié selon les 5 Domaines de Développement Montessori',
      subtitle: 'Sélectionnez un domaine pour explorer les matériels et présentations intégrés dans l’application:',
      tabs: {
        practica: 'Vie Pratique',
        sensorial: 'Développement Sensoriel',
        lenguaje: 'Langage & Écriture',
        mate: 'Mathématiques Concrètes',
        cosmica: 'Éducation Cosmique'
      },
      practicaTitle: 'Domaine de la Vie Pratique',
      practicaBadge: '28 Matériels Intégrés',
      practicaDesc: 'Développe la motricité fine, la coordination œil-main, l’autonomie et la concentration. Suivi de la Grâce et Courtoisie, Soin de la Personne et Soin de l’Environnement.',
      practicaC1T: 'Soin de l’Environnement',
      practicaC1D: 'Verser des graines et liquides, laver la table, plier les serviettes, arroser les plantes.',
      practicaC2T: 'Soin de la Personne',
      practicaC2D: 'Cadres d’habillage (boutons, fermetures éclair, nœuds), lavage des mains, brossage.',

      sensorialTitle: 'Domaine du Développement Sensoriel',
      sensorialBadge: '34 Matériels Intégrés',
      sensorialDesc: 'Ordonne et affine les impressions sensorielles du monde physique. Chaque matériel possède un contrôle de l’erreur paramétré.',
      sensorialC1T: 'Discrimination Visuelle & Dimension',
      sensorialC1D: 'Tour Rose, Escalier Marron, Cylindres avec et sans bouton, Cabinet Géométrique.',
      sensorialC2T: 'Tactile, Thermique, Barique & Auditif',
      sensorialC2D: 'Tablettes rugueuses, cylindres de sons, bouteilles thermiques, boîtes d’odeurs.',

      lenguajeTitle: 'Domaine du Langage & Lecture',
      lenguajeBadge: '42 Matériels Intégrés',
      lenguajeDesc: 'Progression phonétique naturelle depuis l’explosion de l’écriture jusqu’à la lecture totale.',
      lenguajeC1T: 'Préparation de la Main et de l’Oreille',
      lenguajeC1D: 'Jeu des sons (Mon petit œil voit), Formes Métalliques, Lettres Rugueuses.',
      lenguajeC2T: 'Composition & Grammaire',
      lenguajeC2D: 'Alphabet Mobile, cartes de nomenclature classifiée, symboles grammaticaux solides.',

      mateTitle: 'Domaine des Mathématiques Concrètes',
      mateBadge: '38 Matériels Intégrés',
      mateDesc: 'De la quantité concrète à l’abstraction arithmétique et au système décimal en base dix.',
      mateC1T: 'Nombres de 1 à 10 & Système Décimal',
      mateC1D: 'Barres rouges et bleues, chiffres rugueux, boîtes de fuseaux, Perles Dorées.',
      mateC2T: 'Opérations & Mémorisation',
      mateC2D: 'Jeu de la banque, tables de l’addition et soustraction, petit boulier, chaînes de perles.',

      cosmicaTitle: 'Domaine de l’Éducation Cosmique',
      cosmicaBadge: '25 Matériels Intégrés',
      cosmicaDesc: 'L’enfant découvre sa place dans l’univers à travers la géographie, la botanique, la zoologie et les 5 Grands Récits.',
      cosmicaC1T: 'Géographie & Sciences Naturelles',
      cosmicaC1D: 'Puzzles de cartes géographiques, formes de terre et d’eau, cabinet de botanique.',
      cosmicaC2T: 'Grands Récits (Élémentaire)',
      cosmicaC2D: 'L’Histoire de l’Univers, L’Apparition de la Vie, L’Histoire de l’Écriture.',
    },
    cycle: {
      badge: 'Rythme Réel en Classe',
      title: 'Le Cycle de Travail de 3 Heures, Numérisé sans Perturbation',
      subtitle: 'La technologie doit rester invisible pour l’enfant et apporter de la sérénité à l’éducatrice.',
      steps: [
        {
          step: '01',
          title: 'Accueil & Libre Choix',
          time: '08:30 — 09:30 AM',
          desc: 'L’enfant entre dans l’ambiance préparée, salue son éducatrice et choisit librement son activité.',
          software: 'L’éducatrice valide les présences en 5 secondes d’un simple clic.'
        },
        {
          step: '02',
          title: 'Concentration Profonde & Normalisation',
          time: '09:30 — 11:00 AM',
          desc: 'Période d’attention maximale et de répétition du travail sans sonneries ni interruptions extérieures.',
          software: 'Saisie rapide des leçons en 3 temps avec photos enregistrées directement dans le dossier de l’enfant.'
        },
        {
          step: '03',
          title: 'Rassemblement et Bilan',
          time: '11:00 — 11:30 AM',
          desc: 'Rangement ordonné du matériel, collation partagée et au revoir bienveillant.',
          software: 'Génération automatique des bilans narratifs pour les familles sans heures de travail à domicile.'
        }
      ]
    },
    modules: {
      badge: 'Écosystème Global',
      title: 'Des Modules Dédiés Connectant Tout Votre Établissement',
      subtitle: 'Conçu pour remplacer les tableurs isolés, les formulaires éparpillés et les groupes de messagerie désordonnés.',
      items: [
        {
          title: 'Générateur de Formulaires Pro',
          desc: 'Créateur visuel de formulaires pour enquêtes, inscriptions et fiches médicales, liés directement au dossier de l’élève.',
          icon: 'form'
        },
        {
          title: 'Pipelines de Processus Flexibles',
          desc: 'Modélisez tous vos processus en tableaux Kanban: Admissions, Diplômes, Recrutement ou Suivi Psycho-pédagogique.',
          icon: 'pipeline'
        },
        {
          title: 'Planning & Calendriers Intelligents',
          desc: 'Planifiez les entretiens de familles, les visites d’observation et les événements scolaires sans conflits d’horaires.',
          icon: 'calendar'
        },
        {
          title: 'Observation & Bilans Narratifs',
          desc: 'Journal pédagogique d’ambiance, photos avec protection des consentements et bilans qualitatifs semestriels.',
          icon: 'compass'
        },
        {
          title: 'Facturation & Gestion Financière',
          desc: 'Prélèvement automatique des frais de scolarité, virements SEPA / Carte avec rapprochement bancaire automatique.',
          icon: 'credit'
        },
        {
          title: 'Web Builder Institutionnel Inclus',
          desc: 'Si votre école ne dispose pas d’un site web professionnel, il est déjà inclus dans votre abonnement avec domaine personnalisé.',
          icon: 'globe'
        },
        {
          title: 'Portail Dédié aux Familles',
          desc: 'Canal de communication direct et respectueux sans l’intrusion des groupes de discussion.',
          icon: 'chat'
        },
        {
          title: 'Gestion des Éducateurs & Équipe',
          desc: 'Droits d’accès par ambiance, planification du matériel et historique pédagogique de votre établissement.',
          icon: 'users'
        }
      ]
    },
    calculator: {
      badge: 'Calculateur d’Économies Réelles',
      title: 'Calculez votre retour financier et le temps administratif récupéré',
      subtitle: 'Indiquez les frais de scolarité mensuels moyens, la devise et le nombre d’élèves :',
      currencyLabel: 'Devise de l’Établissement :',
      tuitionLabel: 'Frais de Scolarité Mensuels Moyens :',
      studentsLabel: 'Élèves Inscrits :',
      students: 'élèves',
      hSaved: 'Heures Administratives Économisées',
      hDesc: 'Moins de gestion manuelle, suivi des paiements et bilans sur papier.',
      moraSaved: 'Recouvrement d’Impayés Estimé',
      moraDesc: 'Estimé sur 4.5% de récupération grâce aux prélèvements automatiques.',
      paperSaved: 'Feuilles de Papier Évitées',
      paperDesc: '100% des dossiers et livrets dématérialisés.',
      cta: 'Commencer l’Essai Gratuit avec ces résultats →'
    },
    pricing: {
      badge: 'Tarification Transparente & sur Mesure',
      title: 'Composez Votre Formule selon les Besoins de Votre École',
      subtitle: 'Pas d’offres rigides ni de coûts cachés. Choisissez le nombre d’ambiances à gérer et sélectionnez uniquement les modules dont vous avez besoin.',
      monthly: 'Paiement Mensuel',
      annual: 'Paiement Annuel',
      discountPill: '2 Mois Gratuits (17% de Réduction)',
      usdMonth: 'USD / mois',
      environmentsTitle: '1. Ambiances / Classes à Gérer',
      environmentsSubtitle: '25 $ USD/mois pour chacun des 3 premiers environnements, et seulement 10 $ USD/mois par environnement supplémentaire à partir du 4ème.',
      environmentsBadge: '1-3 : 25 $ USD/mois • 4+ : 10 $ USD/mois',
      envCountLabel: 'Ambiances Actives :',
      envExample: 'Ex. Nido (1), Maison des Enfants (1), Élémentaire (1) = 3 ambiances',
      optionalModulesTitle: '2. Modules Optionnels à la Carte',
      optionalModulesSubtitle: 'Activez ou désactivez les modules au rythme de votre croissance.',
      optFinancesTitle: 'Facturation & Prélèvements Automatiques des Frais de Scolarité (Stripe, Prélèvement SEPA)',
      optFinancesDesc: 'Rapprochement bancaire automatique, paiements récurrents et relevés de compte pour les familles.',
      optWebBuilderTitle: 'Site Web Institutionnel + Éditeur Web Visuel + Statistiques de Visite',
      optWebBuilderDesc: 'Catalogue de sections et styles personnalisables, charte graphique de votre école, multilingue et nom de domaine avec SSL.',
      optFormsTitle: 'Générateur de Formulaires Pro (Alternative à Typeform / Google Forms)',
      optFormsDesc: 'Collecte de données pour les admissions, fiches de santé et sondages reliés directement au dossier de l’enfant.',
      optPipelinesTitle: 'Pipelines de Processus Flexibles (Tableau Kanban)',
      optPipelinesDesc: 'Modélisez tous vos flux : Admissions, Passage de Cycle, Recrutement d’Éducateurs ou Réinscriptions.',
      optNewsletterTitle: 'Bulletins & Lettres d’Information par E-mail (Identifiants SMTP Personnels)',
      optNewsletterDesc: 'Envoyez vos communications officielles avec le domaine de votre école sans frais d’envoi additionnels.',
      corePortalFamilies: 'Portail des Familles',
      corePortalTeachers: 'Portail des Éducateurs',
      coreWaitlist: 'Gestion de Liste d’Attente',
      coreProgress: 'Suivi des Présentations',
      coreAttendance: 'Feuille de Présence',
      coreTrackers: 'Trackers d’Incidents',
      coreTrackersDesc: 'Suivi et signalement des incidents, santé et comportement',
      coreCalendar: 'Calendrier & Événements',
      coreBulletins: 'Circulaires Internes',
      coreVault: 'Coffre-fort Documentaire',
      coreGallery: 'Galerie Photos Web',
      freeBadge: 'Gratuit',
      customBadge: 'Sur Mesure',
      storageTitle: '3. Stockage Sécurisé dans le Cloud',
      storageSubtitle: '2 Go inclus pour vos photos et documents. Ajoutez des packs supplémentaires ou connectez votre propre stockage AWS S3.',
      storageFree: '2 Go de Base (Inclus Gratuitement)',
      storage12: '12 Go (+10 Go) — 5 $ USD/mois',
      storage22: '22 Go (+20 Go) — 10 $ USD/mois',
      storage52: '52 Go (+50 Go) — 25 $ USD/mois',
      storageByos: 'AWS S3 Dédié (Avec votre clé API)',
      coreTitle: '4. Modules Essentiels Inclus dans l’Abonnement de Base (14 $ USD/mois)',
      coreSubtitle: 'Composants indispensables actifs sur tous les comptes pour assurer le bon fonctionnement de l’école :',
      coreAiTitle: 'IA Pédagogique Montessori (BYOK — OpenAI, Anthropic, Gemini)',
      coreAiBadge: 'BYOK • 100% Inclus',
      coreAiDesc: 'Générez des comptes-rendus d’observation pour les familles, rédigez des propositions de leçons et traduisez vos circulaires en connectant votre propre clé API OpenAI (GPT-4o), Anthropic (Claude 3.5) ou Google Gemini sans surcoût d’inférence.',
      summaryTitle: 'Récapitulatif de Votre Investissement',
      trialNotice: 'Comprend 3 Mois d’Essai Gratuit sans carte bancaire',
      ctaBtn: 'Commencer l’Essai Gratuit'
    },
    faq: {
      badge: 'Foire Aux Questions',
      title: 'Questions des Directeurs et Éducatrices',
      items: [
        {
          q: 'Comment fonctionne la tarification par ambiance et qu’est-ce qui est inclus ?',
          a: 'Chaque ambiance Montessori coûte 25 $ USD/mois pour les 3 premières ambiances. Cela comprend les portails familles et éducateurs, le suivi des présentations, la présence, la liste d’attente et les dossiers numériques sans limite d’élèves.'
        },
        {
          q: 'Comment fonctionne la réduction dégressive à partir de la 4ème ambiance ?',
          a: 'Les 3 premières ambiances sont à 25 $ USD/mois chacune. À partir de la 4ème ambiance, chaque ambiance supplémentaire ne coûte que 10 $ USD/mois pour accompagner la croissance de votre établissement.'
        },
        {
          q: 'Comment fonctionne l’Intelligence Artificielle et que signifie le modèle BYOK ?',
          a: 'L’IA pédagogique est disponible sur tous les forfaits selon le modèle BYOK (Bring Your Own Key). Vous connectez votre propre clé API OpenAI (GPT-4o), Anthropic (Claude 3.5) ou Google Gemini et payez directement à votre fournisseur sans surcoût d’inférence, garantissant la confidentialité absolue de vos données scolaires.'
        },
        {
          q: 'Puis-je modifier mes modules optionnels ou ajouter des ambiances plus tard ?',
          a: 'Oui, à tout moment en un clic depuis votre tableau de bord administrateur.'
        },
        {
          q: 'Quels moyens de paiement et passerelles sont pris en charge par le module Finances ?',
          a: 'Intégration avec Stripe (cartes internationales), virements bancaires, prélèvements automatiques et rapprochement comptable avec relevés pour les parents.'
        },
        {
          q: 'Puis-je connecter mon propre nom de domaine au Créateur de Site Web ?',
          a: 'Oui. Connexion de nom de domaine personnalisé (ex. www.ecole.fr), certificat SSL automatique, éditeur visuel de sections et optimisation SEO multilingue.'
        },
        {
          q: 'Comment fonctionnent l’intégration AWS S3 et le serveur e-mail SMTP dédié ?',
          a: 'Chaque compte inclut 2 Go de stockage gratuit. Vous pouvez ajouter des packs ou connecter votre propre compartiment Amazon S3 et vos identifiants SMTP sans surcoût.'
        },
        {
          q: 'Comment fonctionne l’essai gratuit de 3 mois et ai-je besoin d’une carte ?',
          a: 'Nous configurons votre école avec tous les modules et ambiances choisis pendant 90 jours complets sans engagement ni carte bancaire.'
        }
      ]
    },
    finalCta: {
      title: 'Prêt à transformer la gestion de votre école ?',
      subtitle: 'Commencez votre essai gratuit de 3 mois dès aujourd’hui. Sans carte bancaire, avec accompagnement humain dès le premier jour.',
      button: 'Commencer l’Essai Gratuit (3 Mois)'
    },
    footer: {
      tagline: 'Le système d’exploitation tout-en-un pour les écoles, éducateurs et familles Montessori.',
      modulesHeader: 'Modules',
      schoolsHeader: 'Écoles',
      contactHeader: 'Contact',
      privacy: 'Politique de Confidentialité',
      terms: 'Conditions Générales',
      rights: 'Tous droits réservés.'
    },
    modal: {
      badge: '3 Mois Gratuits',
      title: 'Démarrer l’Essai Gratuit de 3 Mois',
      subtitle: 'Nous configurons un accès complet pour les ambiances de votre établissement pendant 3 mois sans frais.',
      nameLabel: 'Nom Complet *',
      namePlaceholder: 'Ex. Directrice Claire Martin',
      schoolLabel: 'Nom de l’Établissement *',
      schoolPlaceholder: 'Ex. Maison des Enfants Soleil',
      studentsLabel: 'Ambiances à Tester',
      emailLabel: 'Adresse E-mail *',
      emailPlaceholder: 'direction@ecole.fr',
      phoneLabel: 'Téléphone / WhatsApp *',
      phonePlaceholder: '+33 6 12 34 56 78',
      submitBtn: 'Démarrer mes 3 Mois Gratuits',
      successTitle: 'Demande Reçue !',
      successDesc: 'Un conseiller pédagogique MontessoriNexus vous contactera rapidement pour activer vos 3 mois d’essai avec la configuration choisie.'
    }
  }
};

// =========================================================================
// INTERACTIVE HERO WAVE PATTERN (Dense Concentric Waves -> Subtle Terracotta Spotlight)
// =========================================================================
const HeroInteractiveWaves: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number; isHovered: boolean }>({
    x: 0,
    y: 0,
    isHovered: false
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Global mouse tracking so hover activates over text, badges, mockup, and inputs
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const inBounds =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (inBounds) {
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          isHovered: true
        });
      } else {
        setMousePos((prev) => (prev.isHovered ? { ...prev, isHovered: false } : prev));
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // Dense concentric circle ripples spaced tightly (28px step) spanning full screen width
  const circleRadii = useMemo(() => {
    return Array.from({ length: 65 }, (_, i) => 25 + i * 28);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* 1. Underlying Neutral/Gray Concentric Wave Pattern */}
      <svg
        className="w-full h-full absolute inset-0 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="heroWaveGrayFade" cx="50%" cy="26%" r="75%">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity={isDark ? "0.22" : "0.16"} />
            <stop offset="60%" stopColor="#94a3b8" stopOpacity={isDark ? "0.1" : "0.07"} />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g stroke="url(#heroWaveGrayFade)" fill="none" strokeWidth="1">
          {circleRadii.map((r, i) => (
            <circle
              key={i}
              cx="50%"
              cy="26%"
              r={r}
              strokeDasharray={i % 4 === 0 ? "3 5" : undefined}
            />
          ))}
        </g>
      </svg>

      {/* 2. Subtle & Delicate Terracotta (#C4661F) Spotlight Layer (Follows Mouse smoothly) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: mousePos.isHovered ? 1 : 0,
          WebkitMaskImage: `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0) 100%)`,
          maskImage: `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0) 100%)`
        }}
      >
        <svg
          className="w-full h-full absolute inset-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke="#C4661F" strokeOpacity="0.65" fill="none" strokeWidth="1.2">
            {circleRadii.map((r, i) => (
              <circle
                key={i}
                cx="50%"
                cy="26%"
                r={r}
                strokeDasharray={i % 4 === 0 ? "3 5" : undefined}
              />
            ))}
          </g>
        </svg>

        {/* Very subtle ambient warm warmth at cursor */}
        <div
          className="absolute w-40 h-40 rounded-full bg-[#C4661F]/6 blur-2xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`
          }}
        />
      </div>
    </div>
  );
};

export const MontessoriNexusLanding: React.FC = () => {
  // Theme & Language State (English default)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('montessori_nexus_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('montessori_nexus_lang') as Language;
    if (['en', 'es', 'pt', 'fr'].includes(saved)) {
      return saved;
    }
    return 'en'; // Default English as requested
  });

  // Navigation & Scroll State
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [compactLangMenuOpen, setCompactLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const compactLangMenuRef = useRef<HTMLDivElement>(null);

  // Interactive Previews State
  const [heroMockupTab, setHeroMockupTab] = useState<'live' | 'areas' | 'family'>('live');
  const [mockObservationSuccess, setMockObservationSuccess] = useState<boolean>(false);
  const [mockupBooting, setMockupBooting] = useState<boolean>(true);
  const [aiConsentMode, setAiConsentMode] = useState<boolean>(false);
  const [aiNarrativeStep, setAiNarrativeStep] = useState<'raw' | 'montessori'>('montessori');
  const [activeBuilderTheme, setActiveBuilderTheme] = useState<'terracotta' | 'sage' | 'navy'>('terracotta');

  // Calculator Inputs State
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD');
  const [avgTuition, setAvgTuition] = useState<number>(450);
  const [calculatorStudents, setCalculatorStudents] = useState<number>(85);

  const [activeCycleStep, setActiveCycleStep] = useState<number>(0);
  const [activeArea, setActiveArea] = useState<'practica' | 'sensorial' | 'lenguaje' | 'mate' | 'cosmica'>('sensorial');
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // MODULAR PRICING CUSTOMIZER STATE
  // =========================================================================
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [environmentsCount, setEnvironmentsCount] = useState<number>(2);
  const [selectedOptionalModules, setSelectedOptionalModules] = useState<{
    finances: boolean;
    newsletterSmtp: boolean;
    websiteBuilder: boolean;
    forms: boolean;
    pipelines: boolean;
  }>({
    finances: true,
    newsletterSmtp: false,
    websiteBuilder: true,
    forms: true,
    pipelines: false
  });
  const [storageTier, setStorageTier] = useState<'2gb_free' | '12gb' | '22gb' | '52gb' | 'byos_aws'>('2gb_free');
  const [isDesktopCtaHovered, setIsDesktopCtaHovered] = useState(false);

  const [demoForm, setDemoForm] = useState({
    name: '',
    school: '',
    email: '',
    phone: '',
    environments: '2 environments',
    role: 'Head of School / Pedagogical Director'
  });

  const heroRef = useRef<HTMLElement>(null);
  const pricingSectionRef = useRef<HTMLElement>(null);
  const [isPricingInView, setIsPricingInView] = useState(false);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  // 3D Perspective Scroll Animation: starts tilted backward (16deg) and slightly smaller (0.91),
  // then flattens to 0deg, scales up to 1.02 and focuses as user scrolls down.
  const mockupRotateX = useTransform(heroScrollProgress, [0, 0.45], [16, 0]);
  const mockupScale = useTransform(heroScrollProgress, [0, 0.45], [0.91, 1.02]);
  const mockupTranslateY = useTransform(heroScrollProgress, [0, 0.45], [36, 0]);
  const mockupOpacity = useTransform(heroScrollProgress, [0, 0.15], [0.92, 1]);

  // Interactive 3D Perspective Tilt on Hover for Desktop Pricing Summary Card
  const cardMouseX = useMotionValue(0);
  const cardMouseY = useMotionValue(0);
  const cardRotateX = useSpring(cardMouseY, { damping: 16, stiffness: 260 });
  const cardRotateY = useSpring(cardMouseX, { damping: 16, stiffness: 260 });

  const handlePricingCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    // Pronounced 3D perspective tilt (+/- 15 deg max)
    cardMouseX.set((mouseX / (rect.width / 2)) * 15);
    cardMouseY.set(-(mouseY / (rect.height / 2)) * 15);
  };

  const handlePricingCardMouseLeave = () => {
    cardMouseX.set(0);
    cardMouseY.set(0);
  };

  const t = translations[lang] || translations.en;

  useEffect(() => {
    localStorage.setItem('montessori_nexus_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('montessori_nexus_lang', lang);
  }, [lang]);

  // Initial mockup live boot simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMockupBooting(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, []);

  // Click outside to close language menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (compactLangMenuRef.current && !compactLangMenuRef.current.contains(e.target as Node)) {
        setCompactLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowCompactHeader(window.scrollY > 480);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track if user is scrolling inside the Pricing Section for mobile floating bottom bar
  useEffect(() => {
    const el = pricingSectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPricingInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px 0px 0px 0px',
        threshold: [0, 0.05, 0.1, 0.2, 0.5, 0.8, 1]
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const selectedCurrency = useMemo(() => {
    return CURRENCIES.find((c) => c.code === selectedCurrencyCode) || CURRENCIES[0];
  }, [selectedCurrencyCode]);

  // Dynamic calculations for the Impact Calculator (Realistic & transparent)
  const calculatedSavings = useMemo(() => {
    const annualBilling = calculatorStudents * avgTuition * 10; // 10 school months
    const delinquentRecovery = Math.round(annualBilling * 0.045);
    const hoursSaved = Math.round(calculatorStudents * 1.8);
    const paperSaved = calculatorStudents * 65;
    return { annualBilling, delinquentRecovery, hoursSaved, paperSaved };
  }, [calculatorStudents, avgTuition]);

  // =========================================================================
  // MODULAR PRICING REAL-TIME CALCULATION
  // =========================================================================
  const pricingSummary = useMemo(() => {
    // 1. Mandatory Core Membership Base Total
    const coreBaseTotal =
      PRICING_CONFIG.waitlist +
      PRICING_CONFIG.portalParents +
      PRICING_CONFIG.portalTeachers +
      PRICING_CONFIG.progressTracking +
      PRICING_CONFIG.attendance +
      PRICING_CONFIG.calendar; // $14 USD

    // 2. Environments Tiered Cost (1-3: $25 USD, 4+: $10 USD)
    let environmentsCost = 0;
    if (environmentsCount <= PRICING_CONFIG.environmentTier1Limit) {
      environmentsCost = environmentsCount * PRICING_CONFIG.environmentTier1;
    } else {
      environmentsCost =
        PRICING_CONFIG.environmentTier1Limit * PRICING_CONFIG.environmentTier1 +
        (environmentsCount - PRICING_CONFIG.environmentTier1Limit) * PRICING_CONFIG.environmentTier2;
    }

    // 3. Optional Modules Cost & Count
    let optionalModulesCost = 0;
    let selectedModulesCount = 0;
    if (selectedOptionalModules.finances) {
      optionalModulesCost += PRICING_CONFIG.finances;
      selectedModulesCount++;
    }
    if (selectedOptionalModules.newsletterSmtp) {
      optionalModulesCost += PRICING_CONFIG.newsletterSmtp;
      selectedModulesCount++;
    }
    if (selectedOptionalModules.websiteBuilder) {
      optionalModulesCost += PRICING_CONFIG.websiteBuilder;
      selectedModulesCount++;
    }
    if (selectedOptionalModules.forms) {
      optionalModulesCost += PRICING_CONFIG.forms;
      selectedModulesCount++;
    }
    if (selectedOptionalModules.pipelines) {
      optionalModulesCost += PRICING_CONFIG.pipelines;
      selectedModulesCount++;
    }

    // 4. Storage Cost
    let storageCost = 0;
    if (storageTier === '12gb') storageCost = PRICING_CONFIG.storage10GbUnit * 1;
    if (storageTier === '22gb') storageCost = PRICING_CONFIG.storage10GbUnit * 2;
    if (storageTier === '52gb') storageCost = PRICING_CONFIG.storage10GbUnit * 5;
    // 'byos_aws' & '2gb_free' are $0

    // Monthly Subtotal
    const monthlyTotal = coreBaseTotal + environmentsCost + optionalModulesCost + storageCost;

    // Annual Calculation (Pay 10 months, get 12 = 2 months free)
    const annualEquivalentMonthly = Math.round((monthlyTotal * 10) / 12);
    const annualBilledTotal = monthlyTotal * 10;

    return {
      coreBaseTotal,
      environmentsCost,
      optionalModulesCost,
      selectedModulesCount,
      storageCost,
      monthlyTotal,
      annualEquivalentMonthly,
      annualBilledTotal
    };
  }, [environmentsCount, selectedOptionalModules, storageTier]);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
    setTimeout(() => {
      setDemoSubmitted(false);
      setDemoModalOpen(false);
      setDemoForm({ name: '', school: '', email: '', phone: '', environments: `${environmentsCount} environments`, role: 'Head of School' });
    }, 2500);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${
        isDark
          ? 'bg-[#0e1710] text-[#f1f5f9] selection:bg-[#C4661F]/40 selection:text-white'
          : 'bg-[#FEFAE0] text-[#162218] selection:bg-[#C4661F]/20 selection:text-[#C4661F]'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {/* ========================================================================= */}
      <div className={`${isDark ? 'bg-[#101811] border-[#243226]' : 'bg-[#162218] border-[#243226]'} text-slate-200 text-xs py-2 px-4 text-center border-b`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap font-medium">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C4661F] text-white text-[10px] font-bold uppercase tracking-wider">
            {t.announcement.badge}
          </span>
          <span>{t.announcement.text}</span>
          <a
            href="/colegio/ceiba"
            className="text-[#C4661F] font-bold hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            {t.announcement.link}
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INITIAL TOP HEADER */}
      {/* ========================================================================= */}
      <header className={`w-full py-4 sm:py-5 border-b transition-colors ${isDark ? 'bg-[#0e1710]/90 border-slate-800' : 'bg-[#FEFAE0] border-stone-200/60'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#C4661F] flex items-center justify-center shadow-md shadow-[#C4661F]/25 border border-white/20 p-2 shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/images/montessori-nexus-monogram.png"
                alt="Montessori Nexus Logo"
                className="w-full h-full object-contain filter brightness-0 invert drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-serif font-black tracking-tight flex items-center gap-1 leading-none ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                Montessori<span className="text-[#C4661F] font-sans font-bold">Nexus</span>
              </span>
              <span className={`text-[10px] font-sans font-bold tracking-widest uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                School OS
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className={`hidden lg:flex items-center gap-6 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
            <a href="#pedagogia" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.pedagogy}
            </a>
            <a href="#modulos" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.modules}
            </a>
            <a href="#ciclo" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.cycle}
            </a>
            <a href="#precios" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.pricing}
            </a>
            <a href="#faq" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.faq}
            </a>
          </nav>

          {/* Action & Toggle Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Custom Language Dropdown Choice */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-label="Language selector"
                aria-expanded={langMenuOpen}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 focus:ring-1 focus:ring-[#C4661F]'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300 focus:ring-1 focus:ring-[#C4661F]'
                }`}
              >
                <LanguageFlag code={lang} className="w-4 h-3 rounded-[2px] shrink-0 shadow-xs" />
                <span className="font-sans">{LANGUAGES.find(l => l.code === lang)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-xl border p-1.5 z-50 ${
                      isDark ? 'bg-[#162218] border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900 shadow-stone-300/50'
                    }`}
                  >
                    {LANGUAGES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setLang(item.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          lang === item.code
                            ? 'bg-[#C4661F]/15 text-[#C4661F]'
                            : isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <LanguageFlag code={item.code} className="w-4 h-3 rounded-[2px] shrink-0 shadow-xs" />
                          <span>{item.label}</span>
                        </div>
                        {lang === item.code && <Check className="w-3.5 h-3.5 text-[#C4661F]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`h-10 w-10 rounded-xl text-xs transition-all border flex items-center justify-center cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
              }`}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* School Login */}
            <a
              href="/admin"
              className={`h-10 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all border shrink-0 flex items-center justify-center shadow-xs ${
                isDark
                  ? 'text-slate-200 hover:bg-slate-800 border-slate-700'
                  : 'text-[#162218] hover:bg-stone-200/60 border-stone-300/80'
              }`}
            >
              {t.nav.login}
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. FLOATING COMPACT FIXED HEADER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCompactHeader && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-2.5 rounded-full bg-[#162218]/95 backdrop-blur-xl text-white border border-white/15 shadow-2xl shadow-black/40 max-w-4xl w-full">
              {/* Only Icon Logo */}
              <a
                href="/"
                className="w-9 h-9 rounded-full bg-[#C4661F] text-white flex items-center justify-center shadow-md shadow-[#C4661F]/30 hover:scale-105 transition-transform shrink-0 p-1.5 border border-white/20"
                title="MontessoriNexus"
              >
                <img
                  src="/images/montessori-nexus-monogram.png"
                  alt="Montessori Nexus Logo"
                  className="w-full h-full object-contain filter brightness-0 invert drop-shadow-xs"
                />
              </a>

              {/* Compact Menu */}
              <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
                <a href="#pedagogia" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.pedagogy}
                </a>
                <a href="#modulos" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.modules}
                </a>
                <a href="#ciclo" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.cycle}
                </a>
                <a href="#precios" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.pricing}
                </a>
                <a href="#faq" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.faq}
                </a>
              </nav>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Custom Compact Language Dropdown */}
                <div className="relative" ref={compactLangMenuRef}>
                  <button
                    type="button"
                    onClick={() => setCompactLangMenuOpen(!compactLangMenuOpen)}
                    aria-label="Language selector compact"
                    aria-expanded={compactLangMenuOpen}
                    className="h-8 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LanguageFlag code={lang} className="w-3.5 h-2.5 rounded-[1px] shrink-0 shadow-xs" />
                    <span>{LANGUAGES.find(l => l.code === lang)?.codeShort}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${compactLangMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {compactLangMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-40 rounded-2xl bg-[#162218] border border-white/15 shadow-2xl p-1.5 z-50 text-white"
                      >
                        {LANGUAGES.map((item) => (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                              setLang(item.code);
                              setCompactLangMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              lang === item.code
                                ? 'bg-[#C4661F]/25 text-[#C4661F]'
                                : 'hover:bg-white/10 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <LanguageFlag code={item.code} className="w-3.5 h-2.5 rounded-[1px] shrink-0 shadow-xs" />
                              <span>{item.label}</span>
                            </div>
                            {lang === item.code && <Check className="w-3.5 h-3.5 text-[#C4661F]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-amber-300 text-xs transition-all flex items-center justify-center cursor-pointer"
                  title="Theme toggle"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <a
                  href="/admin"
                  className="h-8 px-3.5 text-xs font-bold rounded-full bg-[#C4661F] hover:bg-[#783D19] text-white transition-all shadow-xs flex items-center justify-center shrink-0"
                >
                  {t.nav.login}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. HERO SECTION */}
      {/* ========================================================================= */}
      <section ref={heroRef} className="relative w-full pt-12 sm:pt-20 pb-20 sm:pb-28 overflow-hidden">
        {/* Interactive Concentric Wave Pattern Background (Full Device Width) */}
        <HeroInteractiveWaves isDark={isDark} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isDark
                  ? 'bg-[#C4661F]/20 border border-[#C4661F]/40 text-[#C4661F]'
                  : 'bg-[#C4661F]/10 border border-[#C4661F]/20 text-[#C4661F]'
              }`}
            >
            <Compass className="w-3.5 h-3.5" />
            <span>{t.hero.badge}</span>
          </motion.div>

          {/* Clean Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight leading-[1.08] ${
              isDark ? 'text-white' : 'text-[#162218]'
            }`}
          >
            {t.hero.titlePart1}{' '}
            <span className="italic font-normal text-[#C4661F] underline decoration-[#C4661F]/30 decoration-wavy decoration-2">
              {t.hero.titleHighlight}
            </span>.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-base sm:text-xl font-sans max-w-2xl mx-auto leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-stone-600'
            }`}
          >
            {t.hero.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Button
              onClick={() => setDemoModalOpen(true)}
              size="lg"
              className="bg-[#C4661F] hover:bg-[#783D19] text-white font-bold text-base px-9 py-6 rounded-2xl shadow-md shadow-[#C4661F]/25 hover:scale-[1.02] transition-all"
            >
              {t.hero.ctaBtn}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Reassurance pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-medium ${
              isDark ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#C4661F]" /> {t.hero.pill1}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C4661F]" /> {t.hero.pill2}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#C4661F]" /> {t.hero.pill3}
            </span>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE SAAS APPLICATION SIMULATOR MOCKUP WITH 3D PERSPECTIVE SCROLL */}
        {/* ========================================================================= */}
        <div className="hidden md:block mt-10 sm:mt-14 max-w-5xl mx-auto [perspective:1200px] relative z-10 px-1 sm:px-0">
          <motion.div
            style={{
              rotateX: mockupRotateX,
              scale: mockupScale,
              y: mockupTranslateY,
              opacity: mockupOpacity,
              transformStyle: 'preserve-3d',
            }}
            className={`w-full rounded-3xl p-2 sm:p-4 border shadow-2xl transition-shadow ${
              isDark ? 'bg-[#0f1711] border-slate-700/80 shadow-black/80' : 'bg-white/95 backdrop-blur-md border-stone-300 shadow-stone-900/15'
            }`}
          >
          <div className={`rounded-2xl border overflow-hidden text-left flex flex-col ${
            isDark ? 'bg-[#0a100c] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
          }`}>
            {/* Top Browser Bar & School Status */}
            <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2 ${
              isDark ? 'bg-[#060c07] border-slate-800 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400/90" />
                <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/90" />
                <span className={`text-xs font-mono ml-2 font-medium px-2.5 py-0.5 rounded-md ${
                  isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-white text-stone-600 border border-stone-200/80'
                }`}>
                  {t.hero.mockupUrl}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t.mockupExt.cycleLivePill}
                </span>
                <span className="hidden sm:inline-flex text-xs font-bold text-white bg-[#C4661F] px-3 py-1 rounded-full shadow-xs">
                  Casa de Niños A
                </span>
              </div>
            </div>

            {/* App Workspace: Interactive Sidebar + Main View Canvas */}
            <div className="flex flex-col md:flex-row min-h-[460px]">
              {/* Mini App Sidebar */}
              <aside className={`w-full md:w-52 p-3 border-b md:border-b-0 md:border-r flex flex-row md:flex-col justify-between shrink-0 ${
                isDark ? 'bg-[#080e0a] border-slate-800' : 'bg-[#F5F2EC] border-stone-200'
              }`}>
                <div className="space-y-1 w-full flex md:block overflow-x-auto gap-1">
                  <div className="hidden md:flex items-center gap-2 px-3 py-2.5 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-[#C4661F] flex items-center justify-center text-white font-serif font-black text-xs">
                      M
                    </div>
                    <div className="leading-tight">
                      <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-stone-900'}`}>MontessoriNexus</span>
                      <span className="text-[10px] text-stone-400 block">Colegio Ceiba</span>
                    </div>
                  </div>

                  {/* Interactive Tab 1: Live Classroom */}
                  <button
                    type="button"
                    onClick={() => setHeroMockupTab('live')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer shrink-0 md:shrink ${
                      heroMockupTab === 'live'
                        ? 'bg-[#C4661F] text-white shadow-xs font-semibold'
                        : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.mockupExt.navLive}</span>
                  </button>

                  {/* Interactive Tab 2: Cycle & Areas */}
                  <button
                    type="button"
                    onClick={() => setHeroMockupTab('areas')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer shrink-0 md:shrink ${
                      heroMockupTab === 'areas'
                        ? 'bg-[#C4661F] text-white shadow-xs font-semibold'
                        : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.mockupExt.navAreas}</span>
                  </button>

                  {/* Interactive Tab 3: Family Portal */}
                  <button
                    type="button"
                    onClick={() => setHeroMockupTab('family')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer shrink-0 md:shrink ${
                      heroMockupTab === 'family'
                        ? 'bg-[#C4661F] text-white shadow-xs font-semibold'
                        : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.mockupExt.navFamily}</span>
                  </button>

                  {/* Ecosystem Modules Preview in Sidebar */}
                  <div className="hidden md:block pt-3 border-t border-stone-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 text-stone-400 block mb-1">Ecosistema</span>
                    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs opacity-60 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                      <Kanban className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.mockupExt.navAdmissions}</span>
                    </div>
                    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs opacity-60 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.mockupExt.navBilling}</span>
                    </div>
                    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs opacity-60 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span>Web Builder</span>
                    </div>
                  </div>
                </div>

                {/* Guide User Profile */}
                <div className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-stone-200/50 dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-700/50 mt-4">
                  <div className="w-7 h-7 rounded-full bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold text-xs">
                    MM
                  </div>
                  <div className="text-[11px] leading-tight overflow-hidden">
                    <span className={`font-bold block truncate ${isDark ? 'text-white' : 'text-stone-800'}`}>María M. (AMI)</span>
                    <span className="text-stone-400 text-[10px] block">Guía Titular</span>
                  </div>
                </div>
              </aside>

              {/* Main View Canvas */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* LIVE BOOT LOADER (Simulation of real live sync) */}
                  {mockupBooting ? (
                    <motion.div
                      key="mockup-booting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-full min-h-[340px] flex flex-col justify-center items-center space-y-5 py-8"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 border border-[#C4661F]/30 flex items-center justify-center text-[#C4661F]">
                          <Compass className="w-6 h-6 animate-spin [animation-duration:3s]" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                      </div>

                      <div className="text-center space-y-1.5 max-w-xs">
                        <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-stone-800'}`}>
                          {t.mockupExt.syncingStatus}
                        </span>
                        <div className="w-48 h-1.5 rounded-full bg-stone-200 dark:bg-slate-800 mx-auto overflow-hidden">
                          <div className="h-full bg-[#C4661F] w-3/4 rounded-full animate-pulse" />
                        </div>
                      </div>

                      {/* Ghost card placeholders shimmering */}
                      <div className="w-full grid grid-cols-3 gap-3 pt-2 opacity-50">
                        <div className="h-24 rounded-xl bg-stone-200/60 dark:bg-slate-800/60 animate-pulse" />
                        <div className="h-24 rounded-xl bg-stone-200/60 dark:bg-slate-800/60 animate-pulse" />
                        <div className="h-24 rounded-xl bg-stone-200/60 dark:bg-slate-800/60 animate-pulse" />
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* TAB 1: LIVE CLASSROOM DASHBOARD */}
                      {heroMockupTab === 'live' && (
                        <motion.div
                          key="tab-live"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-5"
                        >
                      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-lg sm:text-xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                              {t.hero.mockupEnv}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              3 a 6 Años
                            </span>
                          </div>
                          <p className={`text-xs font-sans mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                            {t.mockupExt.subSummary}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setMockObservationSuccess(true);
                            setTimeout(() => setMockObservationSuccess(false), 3000);
                          }}
                          className="bg-[#C4661F] hover:bg-[#783D19] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.mockupExt.quickPresentation}</span>
                        </Button>
                      </div>

                      {/* Toast when quick presentation registered */}
                      {mockObservationSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Observación registrada: Presentación de 3 tiempos vinculada al diario pedagógico de Elena R.</span>
                        </motion.div>
                      )}

                      {/* 3 Real Montessori Live Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {/* Child 1: Santiago */}
                        <div className={`p-4 rounded-2xl border space-y-2.5 transition-all shadow-xs ${
                          isDark ? 'bg-[#121c13] border-slate-700 hover:border-[#C4661F]/50' : 'bg-white border-stone-200 hover:border-[#C4661F]/40'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#C4661F]/15 text-[#C4661F] font-bold text-xs flex items-center justify-center">
                                SM
                              </div>
                              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.mockupCards.c1Name}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-[#C4661F]/20 text-[#C4661F] text-[10px] font-bold">
                              {t.mockupCards.c1Status}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0a120c] border-slate-800' : 'bg-[#FAF8F5] border-stone-200/80'}`}>
                            <span className="font-bold block text-amber-500 dark:text-amber-400">{t.mockupCards.c1Mat}</span>
                            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                              {t.mockupCards.c1Desc}
                            </p>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-stone-400 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#C4661F]" /> 09:14 AM</span>
                            <span className="text-[#C4661F] font-bold">{t.mockupCards.c1Time}</span>
                          </div>
                        </div>

                        {/* Child 2: Elena */}
                        <div className={`p-4 rounded-2xl border space-y-2.5 transition-all shadow-xs ${
                          isDark ? 'bg-[#121c13] border-slate-700 hover:border-emerald-500/50' : 'bg-white border-stone-200 hover:border-emerald-500/40'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                                ER
                              </div>
                              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.mockupCards.c2Name}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              {t.mockupCards.c2Status}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0a120c] border-slate-800' : 'bg-[#FAF8F5] border-stone-200/80'}`}>
                            <span className="font-bold block text-emerald-600 dark:text-emerald-400">{t.mockupCards.c2Mat}</span>
                            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                              {t.mockupCards.c2Desc}
                            </p>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-stone-400 dark:text-slate-400">
                            <span>Lección 3 Tiempos</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.mockupCards.c2Time}</span>
                          </div>
                        </div>

                        {/* Child 3: Mateo */}
                        <div className={`p-4 rounded-2xl border space-y-2.5 transition-all shadow-xs ${
                          isDark ? 'bg-[#121c13] border-slate-700 hover:border-teal-500/50' : 'bg-white border-stone-200 hover:border-teal-500/40'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center">
                                MV
                              </div>
                              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.mockupCards.c3Name}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                              {t.mockupCards.c3Status}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0a120c] border-slate-800' : 'bg-[#FAF8F5] border-stone-200/80'}`}>
                            <span className="font-bold block text-teal-600 dark:text-teal-400">{t.mockupCards.c3Mat}</span>
                            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                              {t.mockupCards.c3Desc}
                            </p>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-stone-400 dark:text-slate-400">
                            <span>Vida Práctica</span>
                            <span className="text-[#C4661F] font-bold">{t.mockupCards.c3Time}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: WORK CYCLE ANALYTICS & AMI AREAS */}
                  {heroMockupTab === 'areas' && (
                    <motion.div
                      key="tab-areas"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div>
                        <h3 className={`text-lg sm:text-xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                          {t.mockupExt.cycleTimelineTitle}
                        </h3>
                        <p className={`text-xs font-sans mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                          {t.mockupExt.cycleCurrentPhase}
                        </p>
                      </div>

                      {/* 3-Hour Cycle Visual Flow Bar */}
                      <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#121c13] border-slate-700' : 'bg-white border-stone-200'}`}>
                        <div className="flex justify-between text-xs font-medium text-stone-500 dark:text-slate-400">
                          <span>08:30 (Inicio)</span>
                          <span className="text-amber-500 font-bold">09:45 (Falsa Fatiga)</span>
                          <span className="text-[#C4661F] font-bold">10:15 (Gran Trabajo ★)</span>
                          <span>11:30 (Cierre)</span>
                        </div>

                        {/* Progress meter */}
                        <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden flex">
                          <div className="h-full bg-amber-400 w-[35%]" title="Inicio e integración" />
                          <div className="h-full bg-amber-500/80 w-[15%]" title="Falsa Fatiga Superada" />
                          <div className="h-full bg-[#C4661F] w-[28%] animate-pulse" title="Pico de Máxima Concentración" />
                          <div className="h-full bg-stone-300 dark:bg-slate-700 w-[22%]" title="Tiempo restante" />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t.mockupExt.cycleNormalState}
                          </span>
                          <span className="font-mono font-bold text-[#C4661F]">Minuto 105 / 180</span>
                        </div>
                      </div>

                      {/* 4 AMI Curriculum Area Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#0a120c] border-slate-800' : 'bg-white border-stone-200'}`}>
                          <span className="text-xs font-bold block text-stone-800 dark:text-white">{t.mockupExt.areaPracticalLife}</span>
                          <span className="text-lg font-serif font-black text-[#C4661F] block my-0.5">6</span>
                          <span className="text-[10px] text-stone-400">23% del ambiente</span>
                        </div>
                        <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#0a120c] border-slate-800' : 'bg-white border-stone-200'}`}>
                          <span className="text-xs font-bold block text-stone-800 dark:text-white">{t.mockupExt.areaSensorial}</span>
                          <span className="text-lg font-serif font-black text-amber-500 block my-0.5">8</span>
                          <span className="text-[10px] text-stone-400">31% del ambiente</span>
                        </div>
                        <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#0a120c] border-slate-800' : 'bg-white border-stone-200'}`}>
                          <span className="text-xs font-bold block text-stone-800 dark:text-white">{t.mockupExt.areaLanguage}</span>
                          <span className="text-lg font-serif font-black text-emerald-500 block my-0.5">7</span>
                          <span className="text-[10px] text-stone-400">27% del ambiente</span>
                        </div>
                        <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#0a120c] border-slate-800' : 'bg-white border-stone-200'}`}>
                          <span className="text-xs font-bold block text-stone-800 dark:text-white">{t.mockupExt.areaMath}</span>
                          <span className="text-lg font-serif font-black text-teal-500 block my-0.5">5</span>
                          <span className="text-[10px] text-stone-400">19% del ambiente</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: FAMILY PORTAL EXPERIENCE */}
                  {heroMockupTab === 'family' && (
                    <motion.div
                      key="tab-family"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4 max-w-xl mx-auto"
                    >
                      <div className="text-center pb-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#C4661F] bg-[#C4661F]/15 px-3 py-0.5 rounded-full border border-[#C4661F]/20 mb-1">
                          <Users className="w-3 h-3" />
                          {t.mockupExt.familyPortalTitle}
                        </span>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                          {t.mockupExt.familyNotification}
                        </p>
                      </div>

                      {/* Parent Mobile Card Simulation */}
                      <div className={`p-5 rounded-2xl border space-y-3.5 shadow-md ${isDark ? 'bg-[#121c13] border-slate-700' : 'bg-white border-stone-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-[#C4661F]/15 text-[#C4661F] font-bold text-xs flex items-center justify-center border border-[#C4661F]/30">
                              SM
                            </div>
                            <div>
                              <span className={`text-sm font-bold block ${isDark ? 'text-white' : 'text-stone-900'}`}>Santiago Morales</span>
                              <span className="text-[11px] text-stone-400 block">Casa de Niños A • Guía: María M.</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> {t.mockupExt.familyPhotoConsent}
                          </span>
                        </div>

                        {/* Warm Narrative Box */}
                        <div className={`p-3.5 rounded-xl border text-xs leading-relaxed italic ${
                          isDark ? 'bg-[#0a120c] border-slate-800 text-slate-300' : 'bg-[#FAF8F5] border-stone-200 text-stone-700'
                        }`}>
                          {t.mockupExt.familyNarrative}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-slate-400 pt-1 border-t border-stone-100 dark:border-slate-800">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {t.mockupExt.familyZeroGrades}
                          </span>
                          <span className="text-[#C4661F] font-bold">Autonomía: 100%</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DEDICATED ETHICAL AI SUITE SECTION */}
      {/* ========================================================================= */}
      <section id="ia-etica" className="py-24 bg-[#0c140d] text-white border-y border-slate-800 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#C4661F]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/15 px-4 py-1 rounded-full border border-[#C4661F]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#C4661F]" />
              {t.aiSuite.badge}
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
              {t.aiSuite.title}
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-slate-300">
              {t.aiSuite.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            {/* Interactive Feature 1: Consent-Aware Face Privacy & Watermarking */}
            <div className="p-7 sm:p-9 rounded-3xl bg-[#152117] border border-slate-700/80 shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {t.aiSuite.cards[0].tag}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white">
                  {t.aiSuite.cards[0].title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  {t.aiSuite.cards[0].desc}
                </p>
              </div>

              {/* LIVE SIMULATOR DEMO */}
              <div className="p-4 rounded-2xl bg-[#081009] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#C4661F]" />
                    {lang === 'en' ? 'Interactive Privacy Simulator:' : lang === 'es' ? 'Simulador de Privacidad en Vivo:' : lang === 'pt' ? 'Simulador de Privacidade em Tempo Real:' : 'Simulateur de Confidentialité en Direct :'}
                  </span>
                  {/* Interactive toggle */}
                  <button
                    type="button"
                    onClick={() => setAiConsentMode(!aiConsentMode)}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer border border-slate-700"
                  >
                    <span className="text-[11px] font-medium text-slate-400">
                      {lang === 'en' ? 'Guardian Consent:' : lang === 'es' ? 'Consentimiento Tutores:' : lang === 'pt' ? 'Consentimento Pais:' : 'Consentement Parental :'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${aiConsentMode ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                      {aiConsentMode
                        ? (lang === 'en' ? 'GRANTED' : lang === 'es' ? 'OTORGADO' : lang === 'pt' ? 'AUTORIZADO' : 'ACCORDÉ')
                        : (lang === 'en' ? 'RESTRICTED' : lang === 'es' ? 'NO OTORGADO' : lang === 'pt' ? 'RESTRITO' : 'REFUSÉ')}
                    </span>
                  </button>
                </div>

                {/* Simulated child work card with real photo */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                  {/* Photo container with localized circular face blur */}
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 border border-slate-700 shadow-xl bg-slate-950">
                    <img
                      src="/images/montessori_child_privacy_demo.jpg"
                      alt="Montessori child working with cylinder block material"
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Transparent Circular Face Blur Lens (only covers child face, leaves hands and material crisp) */}
                    <div
                      className={`absolute top-[24%] left-[34%] w-[33%] h-[34%] rounded-full backdrop-blur-xl bg-black/15 pointer-events-none transition-opacity duration-300 ${
                        !aiConsentMode ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </div>

                  {/* Child information and explanation */}
                  <div className="space-y-2 flex-1 text-left w-full">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-sm font-bold text-white">Sofía V. (3 años 8 meses)</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        Sensorial: Bloque de Cilindros
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {!aiConsentMode
                        ? (lang === 'en'
                          ? '🔒 Facial recognition auto-applies precision blur to the child’s face before publishing or exporting, protecting student privacy by law when parental consent is not granted.'
                          : lang === 'es'
                          ? '🔒 El algoritmo detecta el rostro del niño y aplica difuminado gaussiano automático en el diario escolar cuando los tutores no han autorizado difusión pública.'
                          : lang === 'pt'
                          ? '🔒 O sistema aplica desfoque automático no rosto da criança para proteger a privacidade caso os pais não tenham dado consentimento.'
                          : '🔒 Détection et floutage automatique du visage de l’enfant si le consentement parental n’a pas été accordé.')
                        : (lang === 'en'
                          ? '✓ Guardian consent verified in system. High-resolution observation photos are securely available to authorized family members in their private portal.'
                          : lang === 'es'
                          ? '✓ Consentimiento verificado en el expediente familiar. La fotografía nítida se comparte de manera segura únicamente con los padres autorizados.'
                          : lang === 'pt'
                          ? '✓ Consentimento ativo. Foto nítida e segura disponível exclusivamente no portal da família.'
                          : '✓ Consentement validé. La photo nette est partagée en toute sécurité sur le portail familial privé.')}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        {lang === 'en' ? 'Material in hands:' : lang === 'es' ? 'Material en manos:' : lang === 'pt' ? 'Material em mãos:' : 'Matériel :'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {lang === 'en' ? 'Cylinder Block #1 (Preserved)' : lang === 'es' ? 'Bloque de Cilindros #1 (Visible para la guía)' : lang === 'pt' ? 'Bloco de Cilindros (Visível)' : 'Bloc de Cylindres (Visible)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2 bg-[#081009] text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.aiSuite.cards[0].highlight}</span>
              </div>
            </div>

            {/* Interactive Feature 2: Montessori Narrative Assistant */}
            <div className="p-7 sm:p-9 rounded-3xl bg-[#152117] border border-slate-700/80 shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold shadow-inner">
                    <Brain className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#C4661F]/20 text-[#C4661F] border border-[#C4661F]/30">
                    {t.aiSuite.cards[1].tag}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white">
                  {t.aiSuite.cards[1].title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  {t.aiSuite.cards[1].desc}
                </p>
              </div>

              {/* LIVE SIMULATOR DEMO */}
              <div className="p-4 rounded-2xl bg-[#081009] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C4661F]" />
                    {lang === 'en' ? 'Voice & Tone Transformation:' : lang === 'es' ? 'Transformación de Voz y Tono:' : lang === 'pt' ? 'Transformação de Voz e Tom:' : 'Transformation Pédagogique :'}
                  </span>
                  <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setAiNarrativeStep('raw')}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${aiNarrativeStep === 'raw' ? 'bg-[#C4661F] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {lang === 'en' ? 'Raw Note' : lang === 'es' ? 'Nota Rápida' : lang === 'pt' ? 'Nota Rápida' : 'Note Brute'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiNarrativeStep('montessori')}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${aiNarrativeStep === 'montessori' ? 'bg-[#C4661F] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {lang === 'en' ? 'Montessori AI' : lang === 'es' ? 'Narrativa IA' : lang === 'pt' ? 'Narrativa IA' : 'Rapport IA'}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  {aiNarrativeStep === 'raw' ? (
                    <div className="space-y-1 font-mono text-slate-400">
                      <span className="text-[10px] text-amber-400 font-bold block uppercase">{lang === 'en' ? 'Guide’s dictation:' : lang === 'es' ? 'Dictado rápido de la guía:' : lang === 'pt' ? 'Ditado da guia:' : 'Dictée de l’éducatrice :'}</span>
                      <p className="italic text-slate-300">
                        {lang === 'en'
                          ? '"Elena built words with movable alphabet. 30 mins concentrated, sounded phonemes clearly."'
                          : lang === 'es'
                          ? '"Elena armó masa y sol con el alfabeto móvil. 30 min concentrada, fonemas claros."'
                          : lang === 'pt'
                          ? '"Elena formou masa e sol com alfabeto móvel. 30 min concentrada."'
                          : '"Elena a composé masa avec l’alphabet mobile. 30 min de concentration."'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#C4661F] font-bold block uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#C4661F]" />
                        {lang === 'en' ? 'Polished Narrative for Parents:' : lang === 'es' ? 'Narrativa Montessori para la Familia:' : lang === 'pt' ? 'Narrativa para a Família:' : 'Rapport pour la Famille :'}
                      </span>
                      <p className="text-slate-200 leading-relaxed text-[11px]">
                        {lang === 'en'
                          ? '"Elena displayed sustained intrinsic concentration during language work, successfully associating auditory phonemes with wooden movable typography with deep enthusiasm."'
                          : lang === 'es'
                          ? '"Elena demostró un periodo de concentración prolongada en el área de lenguaje, interiorizando con entusiasmo la correspondencia fonética y la construcción de palabras."'
                          : lang === 'pt'
                          ? '"Elena demonstrou grande concentração na área de linguagem, associando fonemas com entusiasmo."'
                          : '"Elena a fait preuve d’une belle concentration dans l’aire du langage, explorant avec joie la composition phonétique."'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2 bg-[#081009] text-amber-300">
                <CheckCircle2 className="w-4 h-4 text-[#C4661F] shrink-0" />
                <span>{t.aiSuite.cards[1].highlight}</span>
              </div>
            </div>

            {/* Feature 3: Pedagogical SWOT */}
            <div className="p-7 sm:p-9 rounded-3xl bg-[#152117] border border-slate-700/80 shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold shadow-inner">
                    <Sparkle className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {t.aiSuite.cards[2].tag}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white">
                  {t.aiSuite.cards[2].title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  {t.aiSuite.cards[2].desc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-[#081009] border border-slate-800 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Fortalezas:</span>
                  <p className="text-slate-300">Autonomía en ciclo matutino (42m de flujo).</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Próximo Material:</span>
                  <p className="text-slate-300">Gabinete Geométrico (Bandeja 1).</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2 bg-[#081009] text-cyan-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{t.aiSuite.cards[2].highlight}</span>
              </div>
            </div>

            {/* Feature 4: Sensitive Periods */}
            <div className="p-7 sm:p-9 rounded-3xl bg-[#152117] border border-slate-700/80 shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold shadow-inner">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    {t.aiSuite.cards[3].tag}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white">
                  {t.aiSuite.cards[3].title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  {t.aiSuite.cards[3].desc}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#081009] border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Periodo Sensible: Orden & Pequeños Objetos</span>
                  <span className="text-[10px] font-mono text-violet-400 font-bold">Ventana Activa</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="w-3/4 h-full bg-gradient-to-r from-violet-500 to-[#C4661F] rounded-full" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2 bg-[#081009] text-violet-300">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{t.aiSuite.cards[3].highlight}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. EXPANDED MODULES ECOSYSTEM (ASYMMETRIC BENTO GRID) */}
      {/* ========================================================================= */}
      <section id="modulos" className={`py-24 border-b ${isDark ? 'bg-[#0e1710] border-slate-800' : 'bg-[#FEFAE0] border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3.5 py-1 rounded-full border border-[#C4661F]/20">
              {t.modules.badge}
            </span>
            <h2 className={`text-3xl sm:text-5xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
              {t.modules.title}
            </h2>
            <p className={`text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
              {t.modules.subtitle}
            </p>
          </div>

          {/* 12-Column Asymmetric Bento Grid */}
          <div className="grid grid-cols-12 gap-6 text-left">
            {/* Bento Card 1: Featured Pro Form Builder (7 Columns) */}
            <div className={`col-span-12 lg:col-span-7 p-7 sm:p-9 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#C4661F]/15 text-[#C4661F]">
                    Featured Module
                  </span>
                </div>
                <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                  {t.modules.items[0].title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                  {t.modules.items[0].desc}
                </p>
              </div>

              {/* Form Simulator Mini UI */}
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0e1710] border-slate-800' : 'bg-[#F9F8F5] border-stone-200'}`}>
                <div className="flex justify-between items-center text-xs border-b border-stone-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-[#C4661F]">Formulario de Admisión • Casa de Niños</span>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">● Sincronización en vivo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#162218] border-slate-700 text-slate-300' : 'bg-white border-stone-300 text-stone-700'}`}>
                    <span className="text-[10px] text-stone-400 block font-medium">Nombre del Niño:</span>
                    <span className="font-bold">Santiago Morales</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#162218] border-slate-700 text-slate-300' : 'bg-white border-stone-300 text-stone-700'}`}>
                    <span className="text-[10px] text-stone-400 block font-medium">Ambiente Solicitado:</span>
                    <span className="font-bold">Casa de Niños 1 (3-6 años)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Featured Web Builder & Custom Styles (5 Columns) */}
            <div className={`col-span-12 lg:col-span-5 p-7 sm:p-9 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#C4661F]/15 text-[#C4661F]">
                    Catalog & Styles
                  </span>
                </div>
                <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                  {t.modules.items[5].title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                  {t.modules.items[5].desc}
                </p>
              </div>

              {/* Interactive Color Palettes Preview */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'bg-[#0e1710] border-slate-800' : 'bg-[#FEFAE0] border-[#B99470]/30'}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500 dark:text-slate-400">Paleta del Colegio:</span>
                  <span className="text-[10px] font-bold text-[#C4661F] uppercase">{activeBuilderTheme}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveBuilderTheme('terracotta')}
                    className={`h-7 px-3 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${activeBuilderTheme === 'terracotta' ? 'bg-[#C4661F] text-white border-[#C4661F]' : 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-transparent'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C4661F] border border-white" />
                    Alloy Orange
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBuilderTheme('sage')}
                    className={`h-7 px-3 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${activeBuilderTheme === 'sage' ? 'bg-[#5F6F52] text-white border-[#5F6F52]' : 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-transparent'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5F6F52] border border-white" />
                    Olive Green
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBuilderTheme('navy')}
                    className={`h-7 px-3 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${activeBuilderTheme === 'navy' ? 'bg-[#B99470] text-white border-[#B99470]' : 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-transparent'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B99470] border border-white" />
                    Camel
                  </button>
                </div>
              </div>
            </div>

            {/* Standard Bento Cards (4 Columns each) */}
            {/* Cobranza Automatizada */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 p-7 rounded-3xl border shadow-xs hover:border-[#C4661F] transition-all space-y-3 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.modules.items[4].title}</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>{t.modules.items[4].desc}</p>
            </div>

            {/* Pipelines de Admisión */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 p-7 rounded-3xl border shadow-xs hover:border-[#C4661F] transition-all space-y-3 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold">
                <Workflow className="w-6 h-6" />
              </div>
              <h4 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.modules.items[1].title}</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>{t.modules.items[1].desc}</p>
            </div>

            {/* Calendario Institucional */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 p-7 rounded-3xl border shadow-xs hover:border-[#C4661F] transition-all space-y-3 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.modules.items[2].title}</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>{t.modules.items[2].desc}</p>
            </div>

            {/* Portal de Familias */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 p-7 rounded-3xl border shadow-xs hover:border-[#C4661F] transition-all space-y-3 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h4 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.modules.items[7].title}</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>{t.modules.items[7].desc}</p>
            </div>

            {/* Boletines SMTP */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 p-7 rounded-3xl border shadow-xs hover:border-[#C4661F] transition-all space-y-3 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.modules.items[6].title}</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>{t.modules.items[6].desc}</p>
            </div>

            {/* Expedientes & Observaciones */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 p-7 rounded-3xl border shadow-xs hover:border-[#C4661F] transition-all space-y-3 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.modules.items[3].title}</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>{t.modules.items[3].desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. MONTESSORI 5 AREAS CURRICULUM SELECTOR */}
      {/* ========================================================================= */}
      <section id="pedagogia" className={`py-20 sm:py-28 border-b ${isDark ? 'bg-[#111b12] border-slate-800' : 'bg-[#F9EBC7] border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3.5 py-1 rounded-full border border-[#C4661F]/20">
              {t.areas.badge}
            </span>
            <h2 className={`text-3xl sm:text-5xl font-serif font-bold mt-4 mb-3 ${isDark ? 'text-white' : 'text-[#162218]'}`}>
              {t.areas.title}
            </h2>
            <p className={`text-base sm:text-lg ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
              {t.areas.subtitle}
            </p>
          </div>

          {/* Area Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
            {Object.entries(t.areas.tabs).map(([key, label]) => {
              const getAreaIcon = (areaKey: string) => {
                switch (areaKey) {
                  case 'practica': return <Sparkles className="w-4 h-4 mr-1.5 shrink-0" />;
                  case 'sensorial': return <Layers className="w-4 h-4 mr-1.5 shrink-0" />;
                  case 'lenguaje': return <FileText className="w-4 h-4 mr-1.5 shrink-0" />;
                  case 'mate': return <Calculator className="w-4 h-4 mr-1.5 shrink-0" />;
                  case 'cosmica': return <Globe className="w-4 h-4 mr-1.5 shrink-0" />;
                  default: return <Sparkles className="w-4 h-4 mr-1.5 shrink-0" />;
                }
              };
              return (
                <button
                  key={key}
                  onClick={() => setActiveArea(key as any)}
                  className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border flex items-center justify-center ${
                    activeArea === key
                      ? 'bg-[#C4661F] text-white border-[#C4661F] shadow-md scale-105'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {getAreaIcon(key)}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Area Card */}
          <div className={`rounded-3xl p-6 sm:p-10 border shadow-sm max-w-4xl mx-auto text-left space-y-6 ${
            isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
          }`}>
            {activeArea === 'practica' && (
              <div className="space-y-4">
                <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                  <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.practicaTitle}</h3>
                  <span className="text-xs font-bold text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full">
                    {t.areas.practicaBadge}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                  {t.areas.practicaDesc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.practicaC1T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.practicaC1D}</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.practicaC2T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.practicaC2D}</p>
                  </div>
                </div>
              </div>
            )}

            {activeArea === 'sensorial' && (
              <div className="space-y-4">
                <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                  <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.sensorialTitle}</h3>
                  <span className="text-xs font-bold text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full">
                    {t.areas.sensorialBadge}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                  {t.areas.sensorialDesc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.sensorialC1T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.sensorialC1D}</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.sensorialC2T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.sensorialC2D}</p>
                  </div>
                </div>
              </div>
            )}

            {activeArea === 'lenguaje' && (
              <div className="space-y-4">
                <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                  <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.lenguajeTitle}</h3>
                  <span className="text-xs font-bold text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full">
                    {t.areas.lenguajeBadge}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                  {t.areas.lenguajeDesc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.lenguajeC1T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.lenguajeC1D}</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.lenguajeC2T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.lenguajeC2D}</p>
                  </div>
                </div>
              </div>
            )}

            {activeArea === 'mate' && (
              <div className="space-y-4">
                <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                  <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.mateTitle}</h3>
                  <span className="text-xs font-bold text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full">
                    {t.areas.mateBadge}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                  {t.areas.mateDesc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.mateC1T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.mateC1D}</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.mateC2T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.mateC2D}</p>
                  </div>
                </div>
              </div>
            )}

            {activeArea === 'cosmica' && (
              <div className="space-y-4">
                <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                  <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.cosmicaTitle}</h3>
                  <span className="text-xs font-bold text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full">
                    {t.areas.cosmicaBadge}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                  {t.areas.cosmicaDesc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.cosmicaC1T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.cosmicaC1D}</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>{t.areas.cosmicaC2T}</span>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-500'}>{t.areas.cosmicaC2D}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. 3-HOUR WORK CYCLE */}
      {/* ========================================================================= */}
      <section id="ciclo" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3.5 py-1 rounded-full border border-[#C4661F]/20">
            {t.cycle.badge}
          </span>
          <h2 className={`text-3xl sm:text-5xl font-serif font-bold mt-4 mb-3 ${isDark ? 'text-white' : 'text-[#162218]'}`}>
            {t.cycle.title}
          </h2>
          <p className={`text-base sm:text-lg ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
            {t.cycle.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {t.cycle.steps.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveCycleStep(idx)}
              className={`p-8 rounded-3xl border-2 transition-all cursor-pointer ${
                activeCycleStep === idx
                  ? 'bg-[#C4661F]/10 border-[#C4661F] shadow-lg scale-[1.02]'
                  : isDark
                  ? 'bg-[#162218]/60 border-slate-800 hover:bg-[#162218]'
                  : 'bg-[#F9EBC7]/60 border-stone-300/80 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-serif font-bold text-[#C4661F]">{item.step}</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}>
                  {item.time}
                </span>
              </div>
              <h4 className={`text-xl font-serif font-bold mb-2 ${isDark ? 'text-white' : 'text-[#162218]'}`}>{item.title}</h4>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>{item.desc}</p>
              <div className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                isDark ? 'bg-[#0e1710] border-[#C4661F]/30 text-slate-200' : 'bg-[#C4661F]/10 border-[#C4661F]/25 text-[#162218]'
              }`}>
                <Sparkles className="w-4 h-4 text-[#C4661F] shrink-0 mt-0.5" />
                <span><strong>Nexus:</strong> {item.software}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. IMPACT CALCULATOR (REAL FINANCIAL & TIME SAVINGS) */}
      {/* ========================================================================= */}
      <section id="calculadora" className={`py-24 border-y ${isDark ? 'bg-[#111b12] border-slate-800' : 'bg-[#F9EBC7] border-stone-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3.5 py-1 rounded-full border border-[#C4661F]/20">
              {t.calculator.badge}
            </span>
            <h3 className={`text-3xl sm:text-5xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
              {t.calculator.title}
            </h3>
            <p className={`text-sm sm:text-base ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
              {t.calculator.subtitle}
            </p>
          </div>

          <div className={`p-8 sm:p-12 rounded-3xl border shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
            isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
          }`}>
            {/* Left Column: Input Form (Currency, Avg Tuition, Student count) */}
            <div className="lg:col-span-6 space-y-5 text-left">
              {/* Input 1: Currency Selector */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-stone-700'}`}>
                  {t.calculator.currencyLabel}
                </label>
                <div className="relative">
                  <select
                    value={selectedCurrencyCode}
                    onChange={(e) => {
                      const newCode = e.target.value;
                      setSelectedCurrencyCode(newCode);
                      const curr = CURRENCIES.find((c) => c.code === newCode);
                      if (curr) setAvgTuition(curr.defaultTuition);
                    }}
                    aria-label="Calculadora Moneda"
                    className={`w-full appearance-none px-4 py-3 rounded-2xl text-sm font-bold border cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-[#0e1710] text-white border-slate-700 focus:border-[#C4661F]'
                        : 'bg-[#FEFAE0] text-stone-900 border-stone-300 focus:border-[#C4661F]'
                    }`}
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-stone-900'}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Input 2: Average Monthly Tuition Input */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-stone-700'}`}>
                  {t.calculator.tuitionLabel}
                </label>
                <div className="relative flex items-center">
                  <span className={`absolute left-4 text-sm font-mono font-bold ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                    {selectedCurrency.symbol}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={avgTuition}
                    onChange={(e) => setAvgTuition(Math.max(0, Number(e.target.value)))}
                    className={`w-full pl-10 pr-16 py-3 rounded-2xl text-base font-mono font-bold border transition-colors ${
                      isDark
                        ? 'bg-[#0e1710] text-white border-slate-700 focus:border-[#C4661F]'
                        : 'bg-[#FEFAE0] text-stone-900 border-stone-300 focus:border-[#C4661F]'
                    }`}
                  />
                  <span className="absolute right-4 text-xs font-mono font-bold text-stone-400">
                    {selectedCurrency.code}
                  </span>
                </div>
              </div>

              {/* Input 3: Students Slider */}
              <div className="space-y-2 pt-1">
                <div className={`flex justify-between items-center text-xs font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                  <span>{t.calculator.studentsLabel}</span>
                  <span className="text-lg font-serif font-black text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-xl">
                    {calculatorStudents} {t.calculator.students}
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={600}
                  step={5}
                  value={calculatorStudents}
                  onChange={(e) => setCalculatorStudents(Number(e.target.value))}
                  className="w-full accent-[#C4661F] cursor-pointer h-2.5 bg-stone-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-stone-400 font-mono">
                  <span>15</span>
                  <span>300</span>
                  <span>600+</span>
                </div>
              </div>
            </div>

            {/* Right Column: Calculated Results */}
            <div className="lg:col-span-6 space-y-3.5 text-left">
              {/* Metric 1: Financial Recovery */}
              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-400 block">{t.calculator.moraSaved}</span>
                  <div className="text-2xl sm:text-3xl font-serif font-black text-emerald-500">
                    {selectedCurrency.symbol}{calculatedSavings.delinquentRecovery.toLocaleString()} {selectedCurrency.code} <span className="text-xs font-sans font-bold text-stone-400">/ año</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">{t.calculator.moraDesc}</p>
                </div>
              </div>

              {/* Metric 2: Office Hours Saved */}
              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-400 block">{t.calculator.hSaved}</span>
                  <div className={`text-2xl sm:text-3xl font-serif font-black ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                    {calculatedSavings.hoursSaved} hrs <span className="text-xs font-sans font-bold text-stone-400">/ año</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">{t.calculator.hDesc}</p>
                </div>
              </div>

              {/* Metric 3: Paper Saved */}
              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-[#0e1710] border-slate-700' : 'bg-[#FEFAE0] border-stone-200'}`}>
                <div className="w-12 h-12 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-400 block">{t.calculator.paperSaved}</span>
                  <div className={`text-2xl sm:text-3xl font-serif font-black ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                    {calculatedSavings.paperSaved.toLocaleString()} hojas <span className="text-xs font-sans font-bold text-stone-400">/ año</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">{t.calculator.paperDesc}</p>
                </div>
              </div>

              <Button
                onClick={() => setDemoModalOpen(true)}
                className="w-full bg-[#C4661F] hover:bg-[#783D19] text-white font-bold py-6 rounded-2xl shadow-lg transition-transform hover:scale-[1.01] cursor-pointer text-sm"
              >
                {t.calculator.cta}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. MODULAR PRICING CUSTOMIZER (BUILD YOUR OWN PACKAGE) */}
      {/* ========================================================================= */}
      <section
        id="precios"
        ref={pricingSectionRef}
        className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3.5 py-1 rounded-full border border-[#C4661F]/20">
            {t.pricing.badge}
          </span>
          <h2 className={`text-3xl sm:text-5xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
            {t.pricing.title}
          </h2>
          <p className={`text-base ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
            {t.pricing.subtitle}
          </p>

          {/* Toggle Monthly / Annual */}
          <div className={`inline-flex items-center p-1.5 rounded-2xl border mt-4 shadow-xs ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-stone-300'
          }`}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#C4661F] text-white shadow-xs'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t.pricing.monthly}
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-[#C4661F] text-white shadow-xs'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t.pricing.annual}
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {t.pricing.discountPill}
              </span>
            </button>
          </div>
        </div>

        {/* Modular Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {/* Left Column: Configurator Steps (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 text-left">
            {/* Step 1: Environment Stepper */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className={`text-xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                    {t.pricing.environmentsTitle}
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                    {t.pricing.environmentsSubtitle}
                  </p>
                </div>
                <span className="text-xs font-bold font-mono text-[#C4661F] bg-[#C4661F]/10 px-3 py-1.5 rounded-xl shrink-0">
                  {t.pricing.environmentsBadge}
                </span>
              </div>

              {/* Stepper Controls */}
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                isDark ? 'bg-[#0e1710] border-slate-800' : 'bg-[#FEFAE0] border-stone-200'
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-stone-800'}`}>
                    {t.pricing.envCountLabel}
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                    {t.pricing.envExample}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEnvironmentsCount(Math.max(1, environmentsCount - 1))}
                    disabled={environmentsCount <= 1}
                    className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-slate-700 hover:bg-[#C4661F] hover:text-white disabled:opacity-30 disabled:hover:bg-stone-200 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-2xl font-serif font-black text-[#C4661F]">
                    {environmentsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnvironmentsCount(environmentsCount + 1)}
                    className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-slate-700 hover:bg-[#C4661F] hover:text-white flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className={`text-sm font-bold font-mono ml-2 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                    = ${pricingSummary.environmentsCost} USD/{lang === 'en' ? 'mo' : lang === 'es' ? 'mes' : lang === 'pt' ? 'mês' : 'mois'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Optional Modules Checkboxes */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div>
                <h3 className={`text-xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                  {t.pricing.optionalModulesTitle}
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                  {t.pricing.optionalModulesSubtitle}
                </p>
              </div>

              <div className="space-y-3">
                {/* Cobranza & Finanzas */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.finances
                    ? 'border-[#C4661F] bg-[#C4661F]/10'
                    : isDark ? 'border-slate-800 bg-[#0e1710]' : 'border-stone-200 bg-[#FEFAE0]'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.finances}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, finances: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className={`text-sm font-serif font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {t.pricing.optFinancesTitle}
                      </span>
                      <span className={`text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                        {t.pricing.optFinancesDesc}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap">
                    +${PRICING_CONFIG.finances} USD/mo
                  </span>
                </label>

                {/* Website + Web Builder + Analytics */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.websiteBuilder
                    ? 'border-[#C4661F] bg-[#C4661F]/10'
                    : isDark ? 'border-slate-800 bg-[#0e1710]' : 'border-stone-200 bg-[#FEFAE0]'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.websiteBuilder}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, websiteBuilder: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className={`text-sm font-serif font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {t.pricing.optWebBuilderTitle}
                      </span>
                      <span className={`text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                        {t.pricing.optWebBuilderDesc}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap">
                    +${PRICING_CONFIG.websiteBuilder} USD/mo
                  </span>
                </label>

                {/* Gestor de Formularios Pro */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.forms
                    ? 'border-[#C4661F] bg-[#C4661F]/10'
                    : isDark ? 'border-slate-800 bg-[#0e1710]' : 'border-stone-200 bg-[#FEFAE0]'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.forms}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedOptionalModules({
                          ...selectedOptionalModules,
                          forms: isChecked,
                          pipelines: isChecked ? selectedOptionalModules.pipelines : false
                        });
                      }}
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className={`text-sm font-serif font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {t.pricing.optFormsTitle}
                      </span>
                      <span className={`text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                        {t.pricing.optFormsDesc}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap">
                    +${PRICING_CONFIG.forms} USD/mo
                  </span>
                </label>

                {/* Pipelines de Procesos Configurables (Depends on Forms) */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.pipelines
                    ? 'border-[#C4661F] bg-[#C4661F]/10'
                    : isDark ? 'border-slate-800 bg-[#0e1710]' : 'border-stone-200 bg-[#FEFAE0]'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.pipelines}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedOptionalModules({
                          ...selectedOptionalModules,
                          pipelines: isChecked,
                          forms: isChecked ? true : selectedOptionalModules.forms
                        });
                      }}
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                          {t.pricing.optPipelinesTitle}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#C4661F]/15 text-[#C4661F]">
                          Requiere Formularios
                        </span>
                      </div>
                      <span className={`text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                        {t.pricing.optPipelinesDesc}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap">
                    +${PRICING_CONFIG.pipelines} USD/mo
                  </span>
                </label>

                {/* SMTP / Newsletter Dedicado */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.newsletterSmtp
                    ? 'border-[#C4661F] bg-[#C4661F]/10'
                    : isDark ? 'border-slate-800 bg-[#0e1710]' : 'border-stone-200 bg-[#FEFAE0]'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.newsletterSmtp}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, newsletterSmtp: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className={`text-sm font-serif font-bold block ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {t.pricing.optNewsletterTitle}
                      </span>
                      <span className={`text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                        {t.pricing.optNewsletterDesc}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap">
                    +${PRICING_CONFIG.newsletterSmtp} USD/mo
                  </span>
                </label>
              </div>
            </div>

            {/* Step 3: Storage Selection */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className={`text-xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                    {t.pricing.storageTitle}
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                    {t.pricing.storageSubtitle}
                  </p>
                </div>
                <span className="text-xs font-bold font-mono text-[#C4661F] bg-[#C4661F]/10 px-3 py-1.5 rounded-xl shrink-0">
                  {storageTier === '2gb_free' || storageTier === 'byos_aws' ? '$0 USD' : storageTier === '12gb' ? '+$5 USD/mo' : storageTier === '22gb' ? '+$10 USD/mo' : '+$25 USD/mo'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: '2gb_free',
                    label: t.pricing.storageFree || '2 GB Base (Incluido Gratis)',
                    desc: lang === 'en' ? 'Included with core membership' : 'Incluido con tu membresía',
                    price: lang === 'en' ? 'Included ($0)' : lang === 'es' ? 'Incluido ($0)' : lang === 'pt' ? 'Incluído ($0)' : 'Inclus (0 $)'
                  },
                  {
                    id: '12gb',
                    label: '12 GB Cloud (+10 GB)',
                    desc: lang === 'en' ? 'For growing photo & doc vaults' : 'Para archivos y fotos del salón',
                    price: `+$${PRICING_CONFIG.storage10GbUnit} USD/mo`
                  },
                  {
                    id: '22gb',
                    label: '22 GB Cloud (+20 GB)',
                    desc: lang === 'en' ? 'Heavy photo & video journaling' : 'Uso intensivo de fotos y videos',
                    price: `+$${PRICING_CONFIG.storage10GbUnit * 2} USD/mo`
                  },
                  {
                    id: '52gb',
                    label: '52 GB Cloud (+50 GB)',
                    desc: lang === 'en' ? 'Large multi-environment schools' : 'Colegios con múltiples salones',
                    price: `+$${PRICING_CONFIG.storage10GbUnit * 5} USD/mo`
                  },
                  {
                    id: 'byos_aws',
                    label: t.pricing.storageByos || 'Propio AWS S3 (Tu API Key)',
                    desc: lang === 'en' ? 'Connect your own S3 bucket' : 'Conecta tu propio bucket S3',
                    price: lang === 'en' ? 'BYOS ($0)' : lang === 'es' ? 'BYOS ($0)' : lang === 'pt' ? 'BYOS ($0)' : 'BYOS (0 $)'
                  }
                ].map((tier) => {
                  const isSelected = storageTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setStorageTier(tier.id as any)}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#C4661F] bg-[#C4661F]/15 ring-2 ring-[#C4661F]/30 shadow-xs'
                          : isDark
                          ? 'border-slate-800 bg-[#0e1710] hover:border-slate-700 hover:bg-[#0e1710]/80'
                          : 'border-stone-200 bg-[#FEFAE0] hover:border-stone-400 hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-[#C4661F] bg-[#C4661F]'
                            : isDark ? 'border-slate-600 bg-slate-800' : 'border-stone-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${
                            isSelected
                              ? 'text-[#C4661F] font-black'
                              : isDark ? 'text-slate-100' : 'text-stone-900'
                          }`}>
                            {tier.label}
                          </span>
                          <span className={`text-[10px] block truncate mt-0.5 ${
                            isSelected
                              ? isDark ? 'text-slate-300' : 'text-stone-600'
                              : isDark ? 'text-slate-400' : 'text-stone-500'
                          }`}>
                            {tier.desc}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 ${
                        isSelected
                          ? 'text-[#C4661F]'
                          : isDark ? 'text-amber-400' : 'text-[#783D19]'
                      }`}>
                        {tier.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Core Base Included Features */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-5 ${
              isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
            }`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className={`text-xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                    {t.pricing.coreTitle || '4. Módulos Esenciales Incluidos en la Membresía Base ($14 USD/mes)'}
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                    {t.pricing.coreSubtitle || 'Componentes fundamentales activos en todas las cuentas para potenciar la gestión escolar:'}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.pricing.freeBadge || '100% Incluido'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: t.pricing.corePortalFamilies || 'Portal de Familias', desc: 'Web & Móvil para padres y tutores', icon: Users },
                  { label: t.pricing.corePortalTeachers || 'Portal de Guías', desc: 'Gestión pedagógica del salón', icon: UserCheck },
                  { label: t.pricing.coreProgress || 'Seguimiento Montessori', desc: 'Presentaciones, ciclos y notas', icon: Sparkles },
                  { label: t.pricing.coreAttendance || 'Pase de Asistencia', desc: 'Control diario en tiempo real', icon: Calendar },
                  { label: t.pricing.coreTrackers || 'Trackers de Incidencias', desc: t.pricing.coreTrackersDesc || 'Registro y reporte de incidencias con el niño', icon: Activity },
                  { label: t.pricing.coreWaitlist || 'Lista de Espera', desc: 'Admisiones y nuevos prospectos', icon: Workflow },
                  { label: t.pricing.coreCalendar || 'Calendario & Eventos', desc: 'Agenda escolar unificada', icon: Calendar },
                  { label: t.pricing.coreBulletins || 'Circulares Oficiales', desc: 'Comunicación directa con familias', icon: Mail },
                  { label: t.pricing.coreVault || 'Bóveda de Expedientes', desc: 'Fichas médicas y documentos seguros', icon: FolderLock },
                  { label: t.pricing.coreGallery || 'Galería Web del Salón', desc: 'Fotos y momentos del ambiente', icon: ImageIcon }
                ].map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isDark ? 'bg-[#0e1710] border-slate-800' : 'bg-[#FEFAE0] border-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block leading-tight ${isDark ? 'text-slate-100' : 'text-stone-900'}`}>
                            {item.label}
                          </span>
                          <span className={`text-[11px] block mt-0.5 leading-tight ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  );
                })}
              </div>

              {/* AI & BYOK Feature Highlight Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                isDark
                  ? 'bg-linear-to-r from-[#1b2b1e] to-[#142016] border-[#C4661F]/40'
                  : 'bg-linear-to-r from-amber-50 to-[#FEFAE0] border-[#C4661F]/30'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#C4661F]/15 text-[#C4661F] flex items-center justify-center shrink-0 border border-[#C4661F]/30 mt-0.5">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {t.pricing.coreAiTitle || 'IA Pedagógica Montessori'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C4661F]/15 text-[#C4661F] border border-[#C4661F]/25">
                        {t.pricing.coreAiBadge || 'BYOK • 100% Incluido'}
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                      {t.pricing.coreAiDesc}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5 text-[10px] font-semibold text-stone-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" />
                        OpenAI (GPT-4o)
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" />
                        Anthropic (Claude 3.5)
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" />
                        Google Gemini
                      </span>
                      <span className="flex items-center gap-1 text-[#C4661F] font-bold">
                        • {lang === 'en' ? 'Zero inference markup' : lang === 'es' ? 'Sin sobrecostos de inferencia' : lang === 'pt' ? 'Sem taxas extras de inferência' : 'Sans marge d’inférence'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Inline Summary & Action (Visible on small screens before footer) */}
            <div className={`p-6 rounded-3xl border-2 border-[#C4661F] shadow-lg block lg:hidden ${
              isDark ? 'bg-[#162218]' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F]">
                  {t.pricing.summaryTitle}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C4661F]/15 text-[#C4661F]">
                  {environmentsCount} {lang === 'en' ? 'environments' : 'ambientes'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <AnimatedPriceCounter
                  value={billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal}
                  className="text-4xl font-serif font-black text-[#C4661F]"
                />
                <span className="text-xs font-bold text-stone-400">
                  USD / {lang === 'en' ? 'mo' : lang === 'es' ? 'mes' : lang === 'pt' ? 'mês' : 'mois'}
                </span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-[11px] font-semibold text-emerald-500 mb-4">
                  {lang === 'en'
                    ? `Billed annually: $${pricingSummary.annualBilledTotal} USD (Save 2 months)`
                    : lang === 'es'
                    ? `Facturado anualmente: $${pricingSummary.annualBilledTotal} USD (Ahorras 2 meses)`
                    : lang === 'pt'
                    ? `Faturado anualmente: $${pricingSummary.annualBilledTotal} USD (Economize 2 meses)`
                    : `Facturé annuellement : ${pricingSummary.annualBilledTotal} $ USD (Économisez 2 mois)`}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setDemoForm({
                    ...demoForm,
                    environments: `${environmentsCount} ${lang === 'en' ? 'environments' : 'ambientes'} (${billingCycle === 'annual' ? `$${pricingSummary.annualEquivalentMonthly}/mo` : `$${pricingSummary.monthlyTotal}/mo`})`
                  });
                  setDemoModalOpen(true);
                }}
                className="w-full py-5 px-6 bg-[#C4661F] hover:bg-[#8D410F] active:bg-[#783D19] text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border border-white/20"
                style={{ cursor: 'pointer' }}
              >
                <span>{t.pricing.ctaBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Desktop Sticky Summary & Checkout */}
          <div
            className="hidden lg:block lg:col-span-5 xl:col-span-4 relative h-full"
            style={{ perspective: 800 }}
          >
            <div
              className="sticky top-28 space-y-4 text-left z-30"
              style={{ position: 'sticky', top: '7rem' }}
            >
              <motion.div
                style={{
                  rotateX: cardRotateX,
                  rotateY: cardRotateY,
                  transformStyle: 'preserve-3d'
                }}
                onMouseMove={handlePricingCardMouseMove}
                onMouseLeave={handlePricingCardMouseLeave}
                whileHover={{
                  scale: 1.025,
                  boxShadow: isDark
                    ? '0 35px 70px -15px rgba(196, 102, 31, 0.5), 0 0 45px rgba(196, 102, 31, 0.3)'
                    : '0 35px 70px -15px rgba(196, 102, 31, 0.35), 0 20px 40px rgba(0, 0, 0, 0.15)'
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className={`p-8 rounded-3xl border-2 border-[#C4661F] shadow-2xl relative transition-all duration-200 ${
                  isDark ? 'bg-[#162218]' : 'bg-white'
                }`}
              >
              <div className="absolute top-0 right-0 px-4 py-1.5 rounded-tr-[22px] rounded-bl-2xl bg-[#C4661F] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                {lang === 'en' ? 'Custom' : lang === 'es' ? 'Personalizado' : lang === 'pt' ? 'Sob Medida' : 'Sur Mesure'}
              </div>

              <h4 className={`text-2xl font-serif font-bold mb-4 ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                {t.pricing.summaryTitle}
              </h4>

              {/* Price Tag */}
              <div className="pb-6 border-b border-stone-200 dark:border-slate-700">
                <div className="flex items-baseline gap-1.5">
                  <AnimatedPriceCounter
                    value={billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal}
                    className="text-5xl font-serif font-black text-[#C4661F]"
                  />
                  <span className="text-sm font-bold text-stone-400">
                    USD / {lang === 'en' ? 'mo' : lang === 'es' ? 'mes' : lang === 'pt' ? 'mês' : 'mois'}
                  </span>
                </div>
                {billingCycle === 'annual' ? (
                  <p className="text-xs font-semibold text-emerald-500 mt-1.5">
                    {lang === 'en'
                      ? `Billed annually: $${pricingSummary.annualBilledTotal} USD (Save 2 full months)`
                      : lang === 'es'
                      ? `Facturado anualmente: $${pricingSummary.annualBilledTotal} USD (Ahorras 2 meses completos)`
                      : lang === 'pt'
                      ? `Faturado anualmente: $${pricingSummary.annualBilledTotal} USD (Economize 2 meses inteiros)`
                      : `Facturé annuellement : ${pricingSummary.annualBilledTotal} $ USD (Économisez 2 mois)`}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 mt-1.5">
                    {lang === 'en'
                      ? 'Flexible monthly billing. Cancel anytime.'
                      : lang === 'es'
                      ? 'Facturación mensual flexible. Cancela cuando quieras.'
                      : lang === 'pt'
                      ? 'Cobrança mensal flexível. Cancele quando quiser.'
                      : 'Facturation mensuelle flexible. Sans engagement.'}
                  </p>
                )}
              </div>

              {/* Itemized list */}
              <div className="py-5 space-y-2.5 text-xs border-b border-stone-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-stone-500 dark:text-slate-400">
                  <span>{lang === 'en' ? 'Core Base Membership:' : lang === 'es' ? 'Membresía Base Esencial:' : lang === 'pt' ? 'Assinatura Base Essencial:' : 'Abonnement de Base :'}</span>
                  <AnimatedPriceCounter
                    value={pricingSummary.coreBaseTotal}
                    suffix=" USD"
                    className="font-mono font-bold text-stone-800 dark:text-slate-200"
                  />
                </div>
                <div className="flex justify-between items-center text-stone-500 dark:text-slate-400">
                  <span>{environmentsCount} {lang === 'en' ? 'Environments' : lang === 'es' ? 'Ambientes' : lang === 'pt' ? 'Ambientes' : 'Ambiances'}:</span>
                  <AnimatedPriceCounter
                    value={pricingSummary.environmentsCost}
                    suffix=" USD"
                    className="font-mono font-bold text-stone-800 dark:text-slate-200"
                  />
                </div>
                {pricingSummary.optionalModulesCost > 0 && (
                  <div className="flex justify-between items-center text-stone-500 dark:text-slate-400">
                    <span>{lang === 'en' ? 'Optional Modules:' : lang === 'es' ? 'Módulos Opcionales:' : lang === 'pt' ? 'Módulos Opcionais:' : 'Modules Optionnels :'}</span>
                    <AnimatedPriceCounter
                      value={pricingSummary.optionalModulesCost}
                      prefix="+$"
                      suffix=" USD"
                      className="font-mono font-bold text-stone-800 dark:text-slate-200"
                    />
                  </div>
                )}
                {pricingSummary.storageCost > 0 && (
                  <div className="flex justify-between items-center text-stone-500 dark:text-slate-400">
                    <span>{lang === 'en' ? 'Extra Cloud Storage:' : lang === 'es' ? 'Almacenamiento Adicional:' : lang === 'pt' ? 'Armazenamento Extra:' : 'Stockage Supplémentaire :'}</span>
                    <AnimatedPriceCounter
                      value={pricingSummary.storageCost}
                      prefix="+$"
                      suffix=" USD"
                      className="font-mono font-bold text-stone-800 dark:text-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Trial Notice */}
              <div className="py-4">
                <span className="text-xs font-bold text-amber-500 flex items-center justify-center gap-1.5 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  {t.pricing.trialNotice}
                </span>
              </div>

              {/* Action Button */}
              <div className="relative z-30">
                <button
                  type="button"
                  onMouseEnter={() => setIsDesktopCtaHovered(true)}
                  onMouseLeave={() => setIsDesktopCtaHovered(false)}
                  onClick={() => {
                    setDemoForm({
                      ...demoForm,
                      environments: `${environmentsCount} ${lang === 'en' ? 'environments' : 'ambientes'} (${billingCycle === 'annual' ? `$${pricingSummary.annualEquivalentMonthly}/mo` : `$${pricingSummary.monthlyTotal}/mo`})`
                    });
                    setDemoModalOpen(true);
                  }}
                  className="w-full py-5 px-6 text-white font-bold text-base rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 border border-white/20"
                  style={{
                    backgroundColor: isDesktopCtaHovered ? '#8D410F' : '#C4661F',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  }}
                >
                  <span>{t.pricing.ctaBtn}</span>
                  <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${isDesktopCtaHovered ? 'translate-x-1' : ''}`} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

        {/* Mobile Bottom Fixed Floating Summary Bar */}
        <div
          className={`fixed bottom-0 inset-x-0 z-50 p-3.5 sm:p-4 bg-white/95 dark:bg-[#142016]/95 backdrop-blur-xl border-t border-stone-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] block lg:hidden transition-all duration-300 transform ${
            isPricingInView
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <AnimatedPriceCounter
                  value={billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal}
                  className="text-2xl font-serif font-black text-[#C4661F]"
                />
                <span className="text-[11px] font-bold text-stone-400">
                  USD/{lang === 'en' ? 'mo' : lang === 'es' ? 'mes' : lang === 'pt' ? 'mês' : 'mois'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-slate-400 truncate">
                <span>{environmentsCount} {lang === 'en' ? 'amb.' : 'amb.'}</span>
                {pricingSummary.selectedModulesCount > 0 && (
                  <span>• +{pricingSummary.selectedModulesCount} mód.</span>
                )}
                {billingCycle === 'annual' && (
                  <span className="text-emerald-500 font-bold">• 2 meses gratis</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDemoForm({
                  ...demoForm,
                  environments: `${environmentsCount} ${lang === 'en' ? 'environments' : 'ambientes'} (${billingCycle === 'annual' ? `$${pricingSummary.annualEquivalentMonthly}/mo` : `$${pricingSummary.monthlyTotal}/mo`})`
                });
                setDemoModalOpen(true);
              }}
              className="py-3 px-5 bg-[#C4661F] hover:bg-[#9E4D13] active:bg-[#783D19] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg active:scale-[0.97] shrink-0 flex items-center gap-1.5 transition-all duration-200 cursor-pointer border border-white/20"
              style={{ cursor: 'pointer' }}
            >
              <span>{t.pricing.ctaBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FAQ ACCORDION (Aligned to max-w-7xl 2-Column Grid) */}
      {/* ========================================================================= */}
      <section id="faq" className={`py-24 border-t ${isDark ? 'bg-[#111b12] border-slate-800' : 'bg-[#F9EBC7] border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3.5 py-1 rounded-full border border-[#C4661F]/20">
              {t.faq.badge}
            </span>
            <h2 className={`text-3xl sm:text-5xl font-serif font-bold mt-2 ${isDark ? 'text-white' : 'text-[#162218]'}`}>
              {t.faq.title}
            </h2>
            <p className={`text-base ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
              {lang === 'es'
                ? 'Resolvemos las dudas principales sobre licenciamiento modular, ambientes, pasarelas y privacidad de datos.'
                : lang === 'pt'
                ? 'Tire suas principais dúvidas sobre licenciamento modular, ambientes, meios de pagamento e privacidade.'
                : lang === 'fr'
                ? 'Toutes les réponses sur la tarification modulaire, les ambiances, les passerelles et la sécurité.'
                : 'Key answers regarding modular licensing, classroom environments, payment gateways, and data privacy.'}
            </p>
          </div>

          <div className="space-y-4">
            {t.faq.items.map((faq, idx) => {
              const isOpen = openFaqIndices.includes(idx);
              return (
                <div
                  key={idx}
                  className={`rounded-3xl border overflow-hidden shadow-xs transition-all duration-200 ${
                    isOpen
                      ? isDark
                        ? 'bg-[#162218] border-[#C4661F]/60 ring-1 ring-[#C4661F]/30 shadow-md'
                        : 'bg-white border-[#C4661F]/60 ring-1 ring-[#C4661F]/20 shadow-md'
                      : isDark
                      ? 'bg-[#162218]/80 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-stone-300 hover:border-stone-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className={`w-full p-6 text-left flex items-start justify-between gap-4 font-serif font-bold transition-colors cursor-pointer ${
                      isOpen
                        ? 'text-[#C4661F]'
                        : isDark
                        ? 'text-white hover:text-[#C4661F]'
                        : 'text-[#162218] hover:text-[#C4661F]'
                    }`}
                  >
                    <span className="text-base sm:text-lg leading-snug">{faq.q}</span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 mt-0.5 ${
                      isOpen
                        ? 'bg-[#C4661F] text-white rotate-180'
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-stone-100 text-stone-600'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  {isOpen && (
                    <div className={`px-6 pb-6 text-sm leading-relaxed border-t pt-4 ${
                      isDark ? 'text-slate-300 border-slate-800/80' : 'text-stone-600 border-stone-200'
                    }`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FINAL INVITATION CTA */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="p-10 sm:p-16 rounded-3xl bg-[#162218] text-white border-2 border-[#C4661F]/30 shadow-xl space-y-6">
          <span className="w-12 h-12 rounded-2xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6 text-[#C4661F]" />
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            {t.finalCta.title}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {t.finalCta.subtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => setDemoModalOpen(true)}
              size="lg"
              className="bg-[#C4661F] hover:bg-[#783D19] text-white font-bold text-base px-8 py-6 rounded-2xl shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
            >
              {t.finalCta.button}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FOOTER */}
      {/* ========================================================================= */}
      <footer className={`py-14 text-xs border-t ${
        isDark ? 'bg-[#101811] text-slate-400 border-slate-800' : 'bg-[#121c13] text-stone-400 border-[#243226]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#C4661F] flex items-center justify-center p-1 border border-white/20 shadow-xs">
                <img
                  src="/images/montessori-nexus-monogram.png"
                  alt="Montessori Nexus Logo"
                  className="w-full h-full object-contain filter brightness-0 invert"
                />
              </div>
              <span className="text-base font-serif font-bold text-white">MontessoriNexus</span>
            </div>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              {t.footer.tagline}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif font-bold text-white text-sm mb-2">{t.footer.modulesHeader}</h4>
            <p><a href="#ia-etica" className="hover:text-[#C4661F]">{t.nav.aiSuite}</a></p>
            <p><a href="#pedagogia" className="hover:text-[#C4661F]">{t.nav.pedagogy}</a></p>
            <p><a href="#modulos" className="hover:text-[#C4661F]">{t.nav.modules}</a></p>
            <p><a href="#ciclo" className="hover:text-[#C4661F]">{t.nav.cycle}</a></p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif font-bold text-white text-sm mb-2">{t.footer.schoolsHeader}</h4>
            <p><a href="/admin" className="hover:text-[#C4661F]">{t.nav.login}</a></p>
            <p><a href="/colegio/ceiba" className="hover:text-[#C4661F]">Demo Colegio Ceiba</a></p>
            <p><a href="#precios" className="hover:text-[#C4661F]">{t.nav.pricing}</a></p>
            <p><a href="#faq" className="hover:text-[#C4661F]">{t.nav.faq}</a></p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif font-bold text-white text-sm mb-2">{t.footer.contactHeader}</h4>
            <p>soporte@montessorinexus.com</p>
            <p>+52 998 350 2849</p>
            <p>Cancún, Quintana Roo • México</p>
          </div>
        </div>

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t flex flex-wrap items-center justify-between gap-4 text-[11px] ${
          isDark ? 'border-slate-800/80' : 'border-[#243226]/60'
        }`}>
          <p>© {new Date().getFullYear()} MontessoriNexus OS. {t.footer.rights}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#C4661F]">{t.footer.privacy}</a>
            <a href="#" className="hover:text-[#C4661F]">{t.footer.terms}</a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 14. TRIAL REGISTRATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {demoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-left ${
                isDark ? 'bg-[#162218] border-slate-700 text-white' : 'bg-white border-stone-300 text-[#162218]'
              }`}
            >
              <button
                onClick={() => setDemoModalOpen(false)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {demoSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#C4661F]/15 text-[#C4661F] mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                    {t.modal.successTitle}
                  </h3>
                  <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                    {t.modal.successDesc}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C4661F]/10 text-[#C4661F] text-xs font-bold mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.modal.badge}
                    </span>
                    <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                      {t.modal.title}
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                      {t.modal.subtitle}
                    </p>
                  </div>

                  <form onSubmit={handleDemoSubmit} className="space-y-3.5">
                    <div>
                      <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                        {t.modal.nameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={demoForm.name}
                        onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                        placeholder={t.modal.namePlaceholder}
                        className={`w-full px-3.5 py-2 rounded-xl text-sm focus:border-[#C4661F] ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                          {t.modal.schoolLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={demoForm.school}
                          onChange={(e) => setDemoForm({ ...demoForm, school: e.target.value })}
                          placeholder={t.modal.schoolPlaceholder}
                          className={`w-full px-3.5 py-2 rounded-xl text-sm focus:border-[#C4661F] ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                          {t.modal.studentsLabel}
                        </label>
                        <input
                          type="text"
                          value={demoForm.environments}
                          onChange={(e) => setDemoForm({ ...demoForm, environments: e.target.value })}
                          className={`w-full px-3.5 py-2 rounded-xl text-sm font-semibold focus:border-[#C4661F] ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white'
                              : 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                          {t.modal.emailLabel}
                        </label>
                        <input
                          type="email"
                          required
                          value={demoForm.email}
                          onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                          placeholder={t.modal.emailPlaceholder}
                          className={`w-full px-3.5 py-2 rounded-xl text-sm focus:border-[#C4661F] ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                          {t.modal.phoneLabel}
                        </label>
                        <input
                          type="tel"
                          required
                          value={demoForm.phone}
                          onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                          placeholder={t.modal.phonePlaceholder}
                          className={`w-full px-3.5 py-2 rounded-xl text-sm focus:border-[#C4661F] ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full py-5 bg-[#C4661F] hover:bg-[#783D19] text-white font-bold text-sm rounded-xl shadow-md mt-2"
                    >
                      {t.modal.submitBtn}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MontessoriNexusLanding;
