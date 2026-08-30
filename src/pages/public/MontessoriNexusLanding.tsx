import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, animate } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Activity,
  Menu,
  GripVertical,
  MapPin,
  ScanFace,
  Camera,
  FileCheck,
  Fingerprint,
  Smartphone,
  Smile,
  Heart,
  Mic,
  Volume2,
  Radio,
  Play,
  RotateCcw,
  MousePointer,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MontessoriNexusLogo } from '@/components/MontessoriNexusLogo';
import { toast } from 'sonner';
import salonImg from '@/assets/salon.jpeg';

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
    <path fill="#bd3d44" d="M0 0h640v480H0z" />
    <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640" />
    <path fill="#192f5d" d="M0 0h260v258.5H0z" />
    <g fill="#fff">
      <circle cx="35" cy="35" r="9" /><circle cx="85" cy="35" r="9" /><circle cx="135" cy="35" r="9" /><circle cx="185" cy="35" r="9" /><circle cx="225" cy="35" r="9" />
      <circle cx="60" cy="70" r="9" /><circle cx="110" cy="70" r="9" /><circle cx="160" cy="70" r="9" /><circle cx="210" cy="70" r="9" />
      <circle cx="35" cy="105" r="9" /><circle cx="85" cy="105" r="9" /><circle cx="135" cy="105" r="9" /><circle cx="185" cy="105" r="9" /><circle cx="225" cy="105" r="9" />
      <circle cx="60" cy="140" r="9" /><circle cx="110" cy="140" r="9" /><circle cx="160" cy="140" r="9" /><circle cx="210" cy="140" r="9" />
      <circle cx="35" cy="175" r="9" /><circle cx="85" cy="175" r="9" /><circle cx="135" cy="175" r="9" /><circle cx="185" cy="175" r="9" /><circle cx="225" cy="175" r="9" />
      <circle cx="60" cy="210" r="9" /><circle cx="110" cy="210" r="9" /><circle cx="160" cy="210" r="9" /><circle cx="210" cy="210" r="9" />
    </g>
  </svg>
);

export const FlagES: React.FC<{ className?: string }> = ({ className = "w-4 h-3 rounded-xs shrink-0 shadow-xs" }) => (
  <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
    <path fill="#c60b1e" d="M0 0h640v480H0z" />
    <path fill="#ffc400" d="M0 120h640v240H0z" />
    <g transform="translate(140, 175) scale(0.9)">
      <rect x="0" y="0" width="48" height="60" rx="6" fill="#c60b1e" stroke="#ffc400" strokeWidth="4" />
      <path d="M12 0v60 M36 0v60 M0 30h48" stroke="#ffc400" strokeWidth="3" />
      <circle cx="24" cy="-8" r="10" fill="#c60b1e" stroke="#ffc400" strokeWidth="3" />
    </g>
  </svg>
);

export const FlagBR: React.FC<{ className?: string }> = ({ className = "w-4 h-3 rounded-xs shrink-0 shadow-xs" }) => (
  <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
    <path fill="#009c3b" d="M0 0h640v480H0z" />
    <path fill="#ffdf00" d="m320 55 260 185-260 185L60 240z" />
    <circle cx="320" cy="240" r="90" fill="#002776" />
    <path fill="#fff" d="M230 240c40-35 140-35 180 0-20-4-160-4-180 0z" />
  </svg>
);

export const FlagFR: React.FC<{ className?: string }> = ({ className = "w-4 h-3 rounded-xs shrink-0 shadow-xs" }) => (
  <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
    <path fill="#002654" d="M0 0h213.3v480H0z" />
    <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
    <path fill="#ce1126" d="M426.7 0H640v480H426.7z" />
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
      titlePrefix: 'The same peace that lives in your classrooms,',
      titleScriptWord: 'in the management',
      titleSuffix: 'of your school',
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
          tag: 'Voice Dictation & Real-Time AI',
          title: 'Voice-to-Observation & Pedagogical Structuring',
          desc: 'Guides speak freely about one or multiple children during the work cycle. AI recognizes student names phonetically, maps lessons to the 3-Period Séguin hierarchy (Presented, Practicing, Mastered), separates Public family narratives from Confidential internal notes, and links photo evidence without friction.',
          icon: 'mic',
          highlight: 'Cuts observation logging from minutes to seconds'
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
          title: 'Pro Form Builder & Smart KYC',
          desc: 'Build forms in 3 presentation modes: Traditional, Fluid Conversational, and Step Wizard. Features smart fields: official government registry validation (CURP / ID) in the background, biometric KYC with liveliness check & ID document comparison, and instant synchronization into student files.',
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
          title: 'Institutional Drag & Drop Web Builder',
          desc: 'Build and edit your school official website with zero code: drag-and-drop pre-configured blocks (Montessori Philosophy, Admissions, Smart Calendar, Parent Portal, Contact Forms, Maps & conversion CTAs). Includes native multi-language support, custom domain with SSL, and real-time school OS synchronization.',
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
      text: '{modI18n.webbuilder.badge1} con catálogo de estilos y secciones adaptables a tu marca, Pipelines Dinámicos y Suite de IA Ética ya disponible.',
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
      titlePrefix: 'La misma paz que se respira en tus ambientes,',
      titleScriptWord: 'en la gestión',
      titleSuffix: 'de tu escuela',
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
          tag: 'Dictado por Voz & IA en Tiempo Real',
          title: '{modI18n.tracking.simModal.badge}',
          desc: 'Las guías hablan libremente durante el ciclo de trabajo. La IA identifica fonéticamente a los alumnos, clasifica el avance en los 3 Tiempos de Séguin (Presentado, Practicando, Dominado), separa Notas Públicas familiares de Notas Internas confidenciales y adjunta evidencia fotográfica en segundos.',
          icon: 'mic',
          highlight: 'Reduce el registro de observaciones de minutos a segundos'
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
          title: 'Gestor de Formularios Pro & KYC Inteligente',
          desc: 'Crea formularios en 3 formatos de presentación: Tradicional, Conversacional Fluid y Wizard por pasos. Integra campos inteligentes de validación oficial de CURP ante RENAPO en segundo plano, verificación biométrica / KYC con prueba de vida y comparación de documento de identidad, y sincronización en tiempo real al expediente del alumno.',
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
          title: 'Web Builder Institucional Drag-and-Drop',
          desc: 'Construye y edita el sitio oficial de tu escuela sin código: arrastra y suelta secciones prediseñadas (Filosofía Montessori, Admisiones, Calendario, Portal de Padres, Formulario de Contacto, Mapa Interactivo y CTAs de conversión). Con soporte multiidioma nativo, dominio propio con SSL y sincronización en tiempo real.',
          icon: 'globe'
        },
        {
          title: 'Portal Familiar Exclusivo',
          desc: 'Canal directo y elegante para las familias sin la invasión de grupos de WhatsApp. Circulares oficiales, calendario y confirmación de lectura.',
          icon: 'chat'
        },
        {
          title: '{modI18n.staff.title}',
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
      titlePrefix: 'A mesma paz que se respira em seus ambientes,',
      titleScriptWord: 'na gestão',
      titleSuffix: 'da sua escola',
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
          tag: 'Ditado por Voz & IA em Tempo Real',
          title: 'Ditado por Voz & Estruturação Pedagógica com IA',
          desc: 'As guias falam livremente durante o ciclo de trabalho. A IA identifica foneticamente os alunos, classifica o progresso nos 3 Tempos de Séguin, separa Notas Públicas familiares de Notas Internas confidenciais e anexa fotos de evidência.',
          icon: 'mic',
          highlight: 'Reduz o tempo de registro de observações para segundos'
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
          title: 'Construtor de Formulários Pro & KYC Inteligente',
          desc: 'Crie formulários em 3 formatos: Tradicional, Conversacional Fluid e Wizard por etapas. Inclui campos inteligentes com validação oficial de documento em segundo plano, verificação biométrica / KYC com prova de vida e comparação facial de documento, e sincronização em tempo real no prontuário do aluno.',
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
          title: 'Web Builder Institucional Drag-and-Drop',
          desc: 'Construa e edite o site oficial da sua escola sem programar: arraste e solte seções pré-configuradas (Filosofia Montessori, Matrículas, Calendário, Portal de Pais, Formulários, Mapa e CTAs). Suporte multilíngue nativo, domínio próprio com SSL e sincronização em tempo real.',
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
      titlePrefix: 'La même sérénité qui règne dans vos ambiances,',
      titleScriptWord: 'dans la gestion',
      titleSuffix: 'de votre école',
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
          tag: 'Dictée Vocale & IA en Temps Réel',
          title: 'Dictée Vocale & Structuration Pédagogique par IA',
          desc: 'Les éducatrices dictent librement leurs observations pendant le cycle de travail. L’IA identifie phonétiquement les élèves, classe les leçons selon les 3 Temps de Séguin, sépare Notes Publiques et Notes Internes confidentielles, et associe des photos instantanément.',
          icon: 'mic',
          highlight: 'Réduit la saisie des observations de quelques minutes à quelques secondes'
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
          title: 'Générateur de Formulaires Pro & KYC Intelligent',
          desc: 'Créez des formulaires en 3 formats de présentation : Traditionnel, Conversationnel Fluid et Wizard par étapes. Comprend des champs intelligents avec vérification officielle d’identité en arrière-plan, contrôle biométrique / KYC avec preuve de vie et comparaison de pièce d’identité, et synchronisation instantanée dans le dossier scolaire.',
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
          title: 'Web Builder Institutionnel Drag-and-Drop',
          desc: 'Créez et personnalisez le site officiel de votre établissement sans code : glissez-déposez des sections préconçues (Philosophie Montessori, Admissions, Calendrier, Portail Parents, Formulaire de Contact, Carte et CTAs). Support multilingue natif, domaine personnalisé avec SSL et synchronisation en temps réel.',
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

// =========================================================================
// SPECIALIZED MODULES SHOWCASE MULTI-LANGUAGE DICTIONARY (ES, EN, PT, IT, FR)
// =========================================================================
const MODULES_SHOWCASE_I18N: Record<string, any> = {
  es: {
    tabs: [
      { id: 'tracking', label: 'Registro & Seguimiento', subtitle: 'Lecciones, Trackers & Dictado IA' },
      { id: 'forms', label: 'Formularios & KYC', subtitle: 'RENAPO & Biometría' },
      { id: 'gallery', label: 'Galería Inteligente', subtitle: 'IA Narrativa & Blur Facial' },
      { id: 'webbuilder', label: 'Web Builder Institucional', subtitle: 'Drag & Drop Modular' },
      { id: 'finances', label: 'Cobranza & Facturación', subtitle: 'Stripe · Mercado Pago · SPEI' },
      { id: 'pipelines', label: 'Pipelines Kanban', subtitle: 'Admisiones por Etapas' },
      { id: 'calendar', label: 'Calendario & Citas', subtitle: 'Google & Apple Sync' },
      { id: 'family', label: 'Portal de Familias', subtitle: 'Privado sin WhatsApp' },
      { id: 'staff', label: 'Guías & Roles de Equipo', subtitle: 'Permisos por Ambiente' },
    ],
    tracking: {
      badge1: 'Matriz en Tiempo Real',
      badge2: 'Dictado IA por Voz',
      title: 'Registro, Seguimiento Pedagógico & Dictado por Voz',
      subtitle: 'Captura observaciones de aula al instante con tu propia voz. La IA identifica al alumno, asocia la lección del currículo y actualiza la matriz en segundos.',
      liveBadge: 'Matriz Pedagógica en Directo',
      demoBtn: 'Ver demo animado',
      demoBtnPlaying: 'Reproduciendo demo...',
      syncBadge: '100% Sync en Vivo',
      videoOverlay: {
        badge: 'Demostración Guiada • Dictado por Voz & Matriz',
        title: 'Observación en Vivo, Transcripción IA & Registro en Matriz',
        desc: 'Observa cómo una guía graba una nota de voz sobre Elena R. y la IA estructura la observación pedagógica actualizando la matriz curricular en tiempo real.',
        playCta: 'Haz clic para reproducir demo interactivo',
        skipCta: 'O explorar matriz libremente →'
      },
      matrixTitle: 'Casa de los Niños 3-6 • Lenguaje & Vida Práctica',
      matrixSubtitle: 'Ciclo de Trabajo Matutino • 24 Alumnos',
      cols: {
        student: 'Alumno',
        activity: 'Actividad Actual',
        area: 'Área',
        status: 'Estado Pedagógico',
        action: 'Acción'
      },
      statuses: {
        mastered: 'Dominado (3er Tiempo)',
        in_progress: 'En Proceso (2do Tiempo)',
        presented: 'Presentado (1er Tiempo)'
      },
      dictateBtn: 'Dictar',
      detailsBtn: 'Detalles',
      simModal: {
        badge: 'Dictado por Voz & Estructuración Pedagógica con IA',
        status: 'GRABANDO EN VIVO',
        speechText: 'Elena armó palabras con el alfabeto móvil durante 30 minutos... fonemas /m/ /a/ /s/ /a/ consolidados y autorregulación espontánea.',
        audioDetect: 'Sensor de Onda Sonora • Procesamiento gpt-5.6-luna',
        cancelBtn: 'Cancelar',
        finishBtn: 'Finalizar & Estructurar IA'
      },
      flashToast: 'Observación sincronizada con éxito en el expediente de Elena R.',
      cellDetail: {
        publicTitle: 'Narrativa Pedagógica Familiar (Boletín / Diario):',
        publicNote: '«Elena demostró un periodo de concentración prolongada en el área de lenguaje, interiorizando con entusiasmo la correspondencia fonética y la construcción de palabras.»',
        privateTitle: 'Bitácora Interna de la Guía (Expediente Escolar):',
        privateNote: '«Consolidó fonemas /m/ /a/ /s/ /a/ sin error espontáneo. Lista para letras de lija serie azul la próxima semana.»',
        badgeSynced: 'Sincronizado con Expediente & Diario Familiar'
      },
      pillars: [
        { title: 'Dictado Natural por Voz', desc: 'Habla libremente y la IA estructura la observación con rigor AMI.' },
        { title: 'Matriz Montessori Viva', desc: 'Seguimiento visual de lecciones, 3 tiempos y periodos sensibles.' },
        { title: 'Boletín Familiar Instantáneo', desc: 'Narrativas cálidas para padres sin horas extras en casa.' }
      ]
    },
    gallery: {
      badge1: 'IA Pedagógica & Narrativa',
      badge2: 'Protección Facial Automática & GDPR / LFPDPPP',
      title: 'Galería Inteligente & Privacidad con IA',
      subtitle: 'Sube fotografías de actividades escolares: la IA redacta la observación pedagógica en lenguaje Montessori y reemplaza automáticamente la imagen por su versión con difuminado facial si algún estudiante no cuenta con consentimiento legal de sus tutores.',
      liveBadge: 'Galería Segura en Directo',
      demoBtn: 'Ver demo animado',
      demoBtnPlaying: 'Reproduciendo demo...',
      protectionBadge: 'Protección Facial 100%',
      videoOverlay: {
        badge: 'Demostración Guiada • Galería & Privacidad IA',
        title: 'Subida de Foto, Narrativa AMI & Blur Facial Automático',
        desc: 'Observa cómo la IA procesa una foto de 3 alumnos en el patio: genera la observación pedagógica y difumina automáticamente en círculo el rostro del alumno central sin consentimiento.',
        playCta: 'Haz clic para reproducir demo interactivo',
        skipCta: 'O explorar galería libremente →'
      },
      dropzone: {
        title: 'Tomar o Subir Fotografía del Aula',
        desc: 'Haz clic o arrastra una imagen desde el ambiente Montessori (JPG, PNG, HEIC)',
        button: 'Seleccionar Fotografía'
      },
      uploading: {
        title: 'Subiendo fotografía de alta resolución...',
        file: 'IMG_20260829_PatioExterior.jpg • 4.2 MB'
      },
      photoBadges: {
        obs: '#OBS-519 • Patio Exterior',
        detected: '3 Alumnos Detectados',
        blurred: 'Difuminado Facial Aplicado (GDPR)',
        original: 'Foto Original',
        sync: '100% Sync'
      },
      narrative: {
        header: 'Narrativa Pedagógica Montessori',
        model: 'Modelo AMI',
        students: 'Alumnos: Lucas M. (6a) • Mateo V. (6a • Centro) • Sofía R. (6a)',
        text: '“Observación de grupo en patio exterior: Tres infantes en movimiento libre y coordinación dinámica sobre malla elástica. Demuestran autorregulación motriz, sincronía y alegría espontánea en comunidad.”',
        placeholder: 'Sube o captura una fotografía para que la IA reconozca el ambiente didáctico y redacte la observación pedagógica en tiempo real...',
        footer: 'Registro automático en diario escolar AMI'
      },
      privacyBar: {
        lucasTooltip: 'Lucas M. (6a) • Consentimiento Autorizado OK',
        mateoTooltip: 'Mateo V. (6a • Centro) • Sin Consentimiento de Imagen (Rostro Difuminado)',
        sofiaTooltip: 'Sofía R. (6a) • Consentimiento Autorizado OK',
        summary: 'Protección Facial Activa: Mateo V. (centro) no cuenta con consentimiento legal. Rostro difuminado automáticamente antes de publicar (GDPR).',
        viewOriginal: 'Ver Original',
        viewBlurred: 'Ver con Blur',
        safePublication: 'Publicación Segura'
      },
      pillars: [
        { title: 'Difuminado Facial Automático', desc: 'Protección selectiva de menores sin alterar al resto de los alumnos.' },
        { title: 'Filosofía AMI Integrada', desc: 'Narrativa descriptiva enfocada en movimiento y vida comunitaria.' },
        { title: 'Portafolio Familiar Seguro', desc: 'Cumplimiento estricto de privacidad antes de cada publicación.' }
      ]
    },
    forms: {
      badge1: 'Formularios & KYC Inteligente',
      badge2: 'Validación RENAPO en Vivo',
      title: 'Gestor de Formularios Pro & Biometría',
      subtitle: 'Crea formularios con validación oficial de CURP ante RENAPO en segundo plano, biometría KYC para tutores y 3 modos de presentación interactiva.',
      modes: {
        smartFields: 'Campos Inteligentes',
        wizard: 'Modo Wizard',
        fluid: 'Modo Fluid'
      },
      curpTitle: 'Campo Inteligente: CURP Oficial (México)',
      curpStatus: 'Conexión RENAPO en segundo plano',
      curpInputLabel: 'Entrada de la Familia:',
      curpVerifiedLabel: 'Datos Verificados Automáticamente:',
      kycTitle: 'Validación Biométrica KYC de Tutores Legales',
      kycStatus: 'Liveness Detectado 99.8%',
      docLabel: 'Foto de Identificación Oficial (INE / Pasaporte):',
      selfieLabel: 'Selfie de Prueba de Vida (Anti-Spoofing):',
      matchLabel: 'Coincidencia Facial Biométrica: 99.4% Verificado',
      pillars: [
        { title: 'Validación Oficial', desc: 'Conexión directa con registros gubernamentales.' },
        { title: 'Cero Fricción para Padres', desc: 'Autocompletado inteligente y carga ágil.' },
        { title: 'Sincronización Total', desc: 'Respuestas directo al expediente del alumno.' }
      ]
    },
    webbuilder: {
      badge1: 'Web Builder Institucional',
      badge2: 'Multiidioma & SSL Incluido',
      title: 'Constructor Web Modular para tu Escuela',
      subtitle: 'Crea y actualiza la página oficial de tu colegio con bloques modulares Montessori sin necesidad de diseñadores ni programadores.',
      tabs: {
        sections: 'Secciones Modulares',
        style: 'Paleta & Marca',
        integrations: 'Integraciones'
      },
      themeLabel: 'Tema y Tipografía Institucional Activa:',
      themes: {
        terracotta: 'Alloy Orange & Serif Clásica',
        sage: 'Olive Sage & Minimalista',
        navy: 'Camel Terra & Orgánico'
      },
      integrations: [
        { title: 'Pipeline de Admisiones Directo', desc: 'Las solicitudes del formulario web ingresan automáticamente al Kanban.' },
        { title: 'Portal de Familias & Calendario', desc: 'Acceso autenticado y agenda de visitas sincronizada.' }
      ],
      pillars: [
        { title: 'Arrastra & Publica', desc: 'Bloques modulares listos para usar.' },
        { title: 'Identidad Única', desc: 'Paletas y tipografías a tu medida.' },
        { title: 'Conexión al Sistema', desc: 'Admisiones directo al expediente.' }
      ]
    },
    finances: {
      badge1: 'Finanzas Escolares',
      badge2: 'Conciliación Automática',
      title: 'Cobranza, Facturación & Conciliación Automática',
      subtitle: 'Automatiza colegiaturas recurrentes, emite recibos fiscales y concilia pagos bancarios sin perder tiempo en hojas de cálculo.',
      balanceCard: 'Balance Mensual Recaudado',
      methodsLabel: 'Métodos de Pago Habilitados:',
      methods: 'Stripe · Mercado Pago · Transferencia SPEI · Domiciliación',
      recentTx: 'Últimas Transacciones Conciliadas:',
      pillars: [
        { title: 'Cobranza Automatizada', desc: 'Recordatorios amables por correo y portal.' },
        { title: 'Pasarelas Múltiples', desc: 'Tarjetas, transferencias bancarias y efectivo.' },
        { title: 'Reportes en Tiempo Real', desc: 'Flujo de caja y proyecciones al instante.' }
      ]
    },
    pipelines: {
      badge1: 'Gestión Visual de Procesos',
      badge2: 'Kanban Automatizado',
      title: 'Pipelines Kanban para Cada Proceso Escolar',
      subtitle: 'Modela admisiones, reingresos, contrataciones de guías y soporte pedagógico con etapas visuales y transiciones automáticas.',
      stages: {
        new: 'Nueva Solicitud',
        interview: 'Entrevista Familiar',
        visit: 'Observación en Aula',
        approved: 'Admitido / Inscrito'
      },
      pillars: [
        { title: 'Etapas Personalizadas', desc: 'Adapta los pasos al flujo único de tu escuela.' },
        { title: 'Automatizaciones Ágiles', desc: 'Envío de correos y citas al avanzar de etapa.' },
        { title: 'Historial Completo', desc: 'Trazabilidad de cada familia en su expediente.' }
      ]
    },
    calendar: {
      badge1: 'Agenda Inteligente',
      badge2: 'Sincronización Bidireccional',
      title: 'Calendario & Citas Escolares',
      subtitle: 'Agenda entrevistas de admisión, citas de retroalimentación y eventos comunitarios sin traslapes ni fricciones.',
      syncLabel: 'Sincronización con Google Calendar y Apple Calendar en tiempo real.',
      pillars: [
        { title: 'Citas sin Traslapes', desc: 'Disponibilidad real de guías y dirección.' },
        { title: 'Confirmaciones Automáticas', desc: 'Recordatorios por email y portal.' },
        { title: 'Eventos del Salón', desc: 'Calendario pedagógico compartido con familias.' }
      ]
    },
    family: {
      badge1: 'Comunidad Escolar',
      badge2: 'Privacidad Absoluta',
      title: 'Portal de Familias Respetuoso & Privado',
      subtitle: 'Comunicación oficial, bitácora pedagógica y calendario sin grupos invasivos de WhatsApp ni sobreexposición de menores.',
      pillars: [
        { title: 'Sin Grupos de WhatsApp', desc: 'Canal oficial, sereno y estructurado.' },
        { title: 'Diario Pedagógico', desc: 'Fotos y narrativas privadas del ambiente.' },
        { title: 'Firmas Digitales', desc: 'Autorizaciones y documentos en un clic.' }
      ]
    },
    staff: {
      badge1: 'Equipo Montessori',
      badge2: 'Seguridad Granular',
      title: 'Gestión de Guías, Asistentes & Roles',
      subtitle: 'Asigna permisos específicos por ambiente de trabajo, protege la memoria institucional y facilita la colaboración docente.',
      pillars: [
        { title: 'Permisos por Salón', desc: 'Acceso exclusivo a los alumnos asignados.' },
        { title: 'Memoria Institucional', desc: 'Historial pedagógico preservado año tras año.' },
        { title: 'Roles Claros', desc: 'Dirección, Guías, Asistentes y Especialistas.' }
      ]
    }
  },
  en: {
    tabs: [
      { id: 'tracking', label: 'Tracking & Records', subtitle: 'Lessons, Trackers & Voice AI' },
      { id: 'forms', label: 'Forms & Smart KYC', subtitle: 'Official ID & Biometrics' },
      { id: 'gallery', label: 'Smart Gallery', subtitle: 'AI Narrative & Face Blur' },
      { id: 'webbuilder', label: 'Institutional Web Builder', subtitle: 'Modular Drag & Drop' },
      { id: 'finances', label: 'Billing & Tuition', subtitle: 'Stripe · Automated Reconciliation' },
      { id: 'pipelines', label: 'Kanban Pipelines', subtitle: 'Multi-Stage Admissions' },
      { id: 'calendar', label: 'Calendar & Bookings', subtitle: 'Google & Apple Sync' },
      { id: 'family', label: 'Family Portal', subtitle: 'Private without WhatsApp Chats' },
      { id: 'staff', label: 'Guides & Staff Roles', subtitle: 'Classroom Permissions' },
    ],
    tracking: {
      badge1: 'Real-Time Matrix',
      badge2: 'Voice AI Dictation',
      title: 'Progress Tracking, Observations & Voice AI Dictation',
      subtitle: 'Capture classroom observations naturally in real time using your voice. AI identifies students, maps curriculum lessons, and updates the matrix in seconds.',
      liveBadge: 'Live Pedagogical Matrix',
      demoBtn: 'Watch animated demo',
      demoBtnPlaying: 'Playing demo...',
      syncBadge: '100% Live Sync',
      videoOverlay: {
        badge: 'Guided Demo • Voice Dictation & Matrix',
        title: 'Live Observation, AI Transcription & Matrix Sync',
        desc: 'Watch a Montessori guide record a voice note for Elena R. and see how AI structures pedagogical notes while updating the matrix in real time.',
        playCta: 'Click to play interactive demo',
        skipCta: 'Or explore matrix freely →'
      },
      matrixTitle: "Children's House 3-6 • Language & Practical Life",
      matrixSubtitle: 'Morning Work Cycle • 24 Children',
      cols: {
        student: 'Student',
        activity: 'Current Activity',
        area: 'Area',
        status: 'Pedagogical Status',
        action: 'Action'
      },
      statuses: {
        mastered: 'Mastered (3rd Period)',
        in_progress: 'In Progress (2nd Period)',
        presented: 'Presented (1st Period)'
      },
      dictateBtn: 'Dictate',
      detailsBtn: 'Details',
      simModal: {
        badge: 'Voice Dictation & Pedagogical AI Structuring',
        status: 'RECORDING LIVE',
        speechText: 'Elena constructed words with the movable alphabet for 30 minutes... phonemes /m/ /a/ /s/ /a/ consolidated with spontaneous self-regulation.',
        audioDetect: 'Sound Wave Sensor • gpt-5.6-luna Model',
        cancelBtn: 'Cancel',
        finishBtn: 'Finish & Structure with AI'
      },
      flashToast: "Observation successfully synchronized into Elena R.'s student file.",
      cellDetail: {
        publicTitle: 'Family Pedagogical Narrative (Bulletin / Daily Journal):',
        publicNote: '«Elena showed prolonged concentration in the language area, enthusiastically internalizing phonetic correspondence and word construction.»',
        privateTitle: 'Internal Guide Log (School Academic Dossier):',
        privateNote: '«Consolidated phonemes /m/ /a/ /s/ /a/ without spontaneous errors. Ready for blue series sandpaper letters next week.»',
        badgeSynced: 'Synchronized with Student Dossier & Family Journal'
      },
      pillars: [
        { title: 'Natural Voice Dictation', desc: 'Speak freely and AI structures observations with AMI rigor.' },
        { title: 'Living Montessori Matrix', desc: 'Visual tracking of lessons, 3 periods, and sensitive periods.' },
        { title: 'Instant Family Bulletin', desc: 'Heartwarming narratives for parents with zero overtime at home.' }
      ]
    },
    gallery: {
      badge1: 'Pedagogical AI & Narrative',
      badge2: 'Automatic Face Protection & GDPR / Privacy',
      title: 'Smart Gallery & AI Child Privacy',
      subtitle: 'Upload school activity photos: AI writes Montessori pedagogical narratives and automatically swaps in the face-blurred version for any student lacking legal photo consent.',
      liveBadge: 'Live Secure Gallery',
      demoBtn: 'Watch animated demo',
      demoBtnPlaying: 'Playing demo...',
      protectionBadge: '100% Face Protection',
      videoOverlay: {
        badge: 'Guided Demo • Smart Gallery & AI Privacy',
        title: 'Photo Upload, AMI Narrative & Automatic Face Blur',
        desc: 'Watch AI process a photo of 3 children jumping in the courtyard: generates pedagogical observation and automatically applies circular face blur to the center child without consent.',
        playCta: 'Click to play interactive demo',
        skipCta: 'Or explore gallery freely →'
      },
      dropzone: {
        title: 'Capture or Upload Classroom Photo',
        desc: 'Click or drag an image from the Montessori environment (JPG, PNG, HEIC)',
        button: 'Select Photo'
      },
      uploading: {
        title: 'Uploading high-resolution photograph...',
        file: 'IMG_20260829_Courtyard.jpg • 4.2 MB'
      },
      photoBadges: {
        obs: '#OBS-519 • Outdoor Courtyard',
        detected: '3 Students Detected',
        blurred: 'Facial Blur Applied (GDPR)',
        original: 'Original Photo',
        sync: '100% Sync'
      },
      narrative: {
        header: 'Montessori Pedagogical Narrative',
        model: 'AMI Model',
        students: 'Students: Lucas M. (6y) • Mateo V. (6y • Center) • Sofia R. (6y)',
        text: '“Outdoor courtyard group observation: Three children in free movement and dynamic coordination on trampoline net. Demonstrating motor self-regulation, synchrony, and spontaneous joyful community.”',
        placeholder: 'Upload or capture a photo for AI to recognize the learning environment and write pedagogical observations in real time...',
        footer: 'Automatic record into AMI school journal'
      },
      privacyBar: {
        lucasTooltip: 'Lucas M. (6y) • Photo Consent Granted OK',
        mateoTooltip: 'Mateo V. (6y • Center) • No Photo Consent (Face Blurred)',
        sofiaTooltip: 'Sofia R. (6y) • Photo Consent Granted OK',
        summary: 'Active Facial Protection: Mateo V. (center) lacks legal photo consent. Face automatically blurred before publication (GDPR).',
        viewOriginal: 'View Original',
        viewBlurred: 'View with Blur',
        safePublication: 'Safe Publication'
      },
      pillars: [
        { title: 'Automatic Facial Blur', desc: 'Selective protection of minors without altering other classmates.' },
        { title: 'Integrated AMI Philosophy', desc: 'Descriptive narrative focused on movement and community life.' },
        { title: 'Secure Family Portfolio', desc: 'Strict privacy compliance before every publication.' }
      ]
    },
    forms: {
      badge1: 'Smart Forms & KYC',
      badge2: 'Live Government Registry Check',
      title: 'Pro Form Builder & Biometrics',
      subtitle: 'Build forms with official ID registry verification in the background, tutor KYC biometrics, and 3 interactive presentation modes.',
      modes: {
        smartFields: 'Smart Fields',
        wizard: 'Wizard Mode',
        fluid: 'Fluid Mode'
      },
      curpTitle: 'Smart Field: Official National ID / Registry',
      curpStatus: 'Background Registry Connection',
      curpInputLabel: 'Parent Input:',
      curpVerifiedLabel: 'Automatically Verified Data:',
      kycTitle: 'Biometric KYC Validation for Legal Guardians',
      kycStatus: 'Liveness Detected 99.8%',
      docLabel: 'Official ID Photo (Passport / National ID):',
      selfieLabel: 'Liveness Proof Selfie (Anti-Spoofing):',
      matchLabel: 'Biometric Face Match: 99.4% Verified',
      pillars: [
        { title: 'Official Validation', desc: 'Direct connection with government identity databases.' },
        { title: 'Zero Friction for Parents', desc: 'Smart autofill and instant validation.' },
        { title: 'Complete Synchronization', desc: 'Submissions sync straight into student dossiers.' }
      ]
    },
    webbuilder: {
      badge1: 'Institutional Web Builder',
      badge2: 'Multi-language & SSL Included',
      title: 'Modular Website Builder for Your School',
      subtitle: 'Create and update your school official website with Montessori modular blocks without designers or developers.',
      tabs: {
        sections: 'Modular Sections',
        style: 'Palette & Branding',
        integrations: 'Integrations'
      },
      themeLabel: 'Active Institutional Theme & Typography:',
      themes: {
        terracotta: 'Alloy Orange & Classic Serif',
        sage: 'Olive Sage & Minimalist',
        navy: 'Camel Terra & Organic'
      },
      integrations: [
        { title: 'Direct Admissions Pipeline', desc: 'Website form inquiries automatically enter the Kanban pipeline.' },
        { title: 'Family Portal & Calendar', desc: 'Authenticated access and synchronized school tour booking.' }
      ],
      pillars: [
        { title: 'Drag & Publish', desc: 'Ready-to-use modular blocks.' },
        { title: 'Unique Identity', desc: 'Tailored palettes and typography.' },
        { title: 'System-Connected', desc: 'Inquiries go straight into student files.' }
      ]
    },
    finances: {
      badge1: 'School Finances',
      badge2: 'Automated Reconciliation',
      title: 'Tuition Billing, Invoicing & Reconciliation',
      subtitle: 'Automate recurring tuition fees, generate tax receipts, and reconcile bank transfers without spreadsheet headaches.',
      balanceCard: 'Monthly Collected Balance',
      methodsLabel: 'Enabled Payment Gateways:',
      methods: 'Stripe · Direct Bank Transfer · Automated Debit',
      recentTx: 'Recent Reconciled Transactions:',
      pillars: [
        { title: 'Automated Invoicing', desc: 'Gentle email and portal reminders.' },
        { title: 'Multiple Gateways', desc: 'Credit cards, bank transfers, and cash receipts.' },
        { title: 'Real-Time Analytics', desc: 'Instant cash flow and enrollment projections.' }
      ]
    },
    pipelines: {
      badge1: 'Visual Process Management',
      badge2: 'Automated Kanban',
      title: 'Kanban Pipelines for Every School Workflow',
      subtitle: 'Model admissions, re-enrollment, guide hiring, and student support with visual stages and automated transitions.',
      stages: {
        new: 'New Application',
        interview: 'Family Interview',
        visit: 'Classroom Observation',
        approved: 'Admitted / Enrolled'
      },
      pillars: [
        { title: 'Custom Stages', desc: 'Tailor each step to your school unique workflow.' },
        { title: 'Agile Automations', desc: 'Auto-send emails and calendar links on stage move.' },
        { title: 'Full Traceability', desc: 'Complete history in each family dossier.' }
      ]
    },
    calendar: {
      badge1: 'Smart Scheduling',
      badge2: 'Two-Way Synchronization',
      title: 'School Calendar & Visit Bookings',
      subtitle: 'Schedule admission interviews, parent-teacher conferences, and school events with zero double-bookings.',
      syncLabel: 'Live bidirectional sync with Google Calendar and Apple Calendar.',
      pillars: [
        { title: 'No Conflict Booking', desc: 'Real availability of guides and head of school.' },
        { title: 'Automated Reminders', desc: 'Email and portal notifications.' },
        { title: 'Classroom Events', desc: 'Pedagogical calendar shared with parents.' }
      ]
    },
    family: {
      badge1: 'School Community',
      badge2: 'Absolute Privacy',
      title: 'Respectful & Private Family Portal',
      subtitle: 'Official announcements, pedagogical journals, and calendar without noisy WhatsApp group chats or child overexposure.',
      pillars: [
        { title: 'No WhatsApp Groups', desc: 'Calm, official, and structured channel.' },
        { title: 'Pedagogical Journal', desc: 'Private classroom photos and AMI narratives.' },
        { title: 'Digital Signatures', desc: 'Consent forms and authorizations in one click.' }
      ]
    },
    staff: {
      badge1: 'Montessori Team',
      badge2: 'Granular Permissions',
      title: 'Guides, Assistants & Role Management',
      subtitle: 'Assign environment-specific permissions, preserve institutional memory, and foster educator collaboration.',
      pillars: [
        { title: 'Classroom Permissions', desc: 'Access limited strictly to assigned students.' },
        { title: 'Institutional Memory', desc: 'Pedagogical records preserved year after year.' },
        { title: 'Clear Roles', desc: 'Head of School, Lead Guides, Assistants, and Specialists.' }
      ]
    }
  },
  pt: {
    tabs: [
      { id: 'tracking', label: 'Registro & Acompanhamento', subtitle: 'Lições, Rastreadores & Ditado IA' },
      { id: 'forms', label: 'Formulários & KYC', subtitle: 'Validação Oficial & Biometria' },
      { id: 'gallery', label: 'Galeria Inteligente', subtitle: 'IA Narrativa & Desfoque Facial' },
      { id: 'webbuilder', label: 'Criador de Sites Escolar', subtitle: 'Arrastar & Soltar Modular' },
      { id: 'finances', label: 'Cobrança & Mensalidades', subtitle: 'Stripe · Mercado Pago · PIX' },
      { id: 'pipelines', label: 'Pipelines Kanban', subtitle: 'Admissões por Etapas' },
      { id: 'calendar', label: 'Calendário & Agendamentos', subtitle: 'Google & Apple Sync' },
      { id: 'family', label: 'Portal das Famílias', subtitle: 'Privado sem WhatsApp' },
      { id: 'staff', label: 'Guias & Funções de Equipe', subtitle: 'Permissões por Ambiente' },
    ],
    tracking: {
      badge1: 'Matriz em Tempo Real',
      badge2: 'Ditado por Voz com IA',
      title: 'Registro, Acompanhamento Pedagógico & Ditado por Voz',
      subtitle: 'Registre observações de sala de aula instantaneamente com sua própria voz. A IA identifica o aluno, mapeia lições do currículo e atualiza a matriz.',
      liveBadge: 'Matriz Pedagógica ao Vivo',
      demoBtn: 'Ver demo animada',
      demoBtnPlaying: 'Reproduzindo demo...',
      syncBadge: '100% Sync ao Vivo',
      videoOverlay: {
        badge: 'Demonstração Guiada • Ditado por Voz & Matriz',
        title: 'Observação ao Vivo, Transcrição IA & Registro na Matriz',
        desc: 'Veja como uma guia grava uma nota de voz sobre Elena R. e a IA estrutura a observação pedagógica atualizando a matriz curricular em tempo real.',
        playCta: 'Clique para reproduzir demo interativa',
        skipCta: 'Ou explorar matriz livremente →'
      },
      matrixTitle: 'Casa das Crianças 3-6 • Linguagem & Vida Prática',
      matrixSubtitle: 'Ciclo de Trabalho Matutino • 24 Crianças',
      cols: {
        student: 'Aluno',
        activity: 'Atividade Atual',
        area: 'Área',
        status: 'Status Pedagógico',
        action: 'Ação'
      },
      statuses: {
        mastered: 'Dominado (3º Período)',
        in_progress: 'Em Progresso (2º Período)',
        presented: 'Apresentado (1º Período)'
      },
      dictateBtn: 'Ditar',
      detailsBtn: 'Detalhes',
      simModal: {
        badge: 'Ditado por Voz & Estruturação Pedagógica com IA',
        status: 'GRAVANDO AO VIVO',
        speechText: 'Elena montou palavras com o alfabeto móvel durante 30 minutos... fonemas /m/ /a/ /s/ /a/ consolidados e autorregulação espontânea.',
        audioDetect: 'Sensor de Onda Sonora • Modelo gpt-5.6-luna',
        cancelBtn: 'Cancelar',
        finishBtn: 'Finalizar & Estruturar com IA'
      },
      flashToast: 'Observação sincronizada com sucesso no prontuário de Elena R.',
      cellDetail: {
        publicTitle: 'Narrativa Pedagógica Familiar (Boletim / Diário):',
        publicNote: '«Elena demonstrou um período de concentração prolongada na área de linguagem, internalizando com entusiasmo a correspondência fonética.»',
        privateTitle: 'Registro Interno da Guia (Prontuário Escolar):',
        privateNote: '«Consolidou fonemas /m/ /a/ /s/ /a/ sem erro espontâneo. Pronta para lixas série azul na próxima semana.»',
        badgeSynced: 'Sincronizado com Prontuário & Diário Familiar'
      },
      pillars: [
        { title: 'Ditado Natural por Voz', desc: 'Fale livremente e a IA estrutura a observação com rigor AMI.' },
        { title: 'Matriz Montessori Viva', desc: 'Acompanhamento visual de lições, 3 tempos e períodos sensíveis.' },
        { title: 'Boletim Familiar Instantâneo', desc: 'Narrativas acolhedoras para os pais sem horas extras.' }
      ]
    },
    gallery: {
      badge1: 'IA Pedagógica & Narrativa',
      badge2: 'Proteção Facial Automática & LGPD / Privacidade',
      title: 'Galeria Inteligente & Privacidade com IA',
      subtitle: 'Envie fotografias das atividades escolares: a IA redige a observação pedagógica em linguagem Montessori e substitui automaticamente pela versão com desfoque facial caso algum aluno não tenha consentimento assinado.',
      liveBadge: 'Galeria Segura ao Vivo',
      demoBtn: 'Ver demo animada',
      demoBtnPlaying: 'Reproduzindo demo...',
      protectionBadge: 'Proteção Facial 100%',
      videoOverlay: {
        badge: 'Demonstração Guiada • Galeria & Privacidade IA',
        title: 'Upload de Foto, Narrativa AMI & Desfoque Facial Automático',
        desc: 'Veja como a IA processa uma foto de 3 crianças no pátio: gera a observação pedagógica e desfoca automaticamente em círculo o rosto da criança central sem consentimento.',
        playCta: 'Clique para reproduzir demo interativa',
        skipCta: 'Ou explorar galeria livremente →'
      },
      dropzone: {
        title: 'Tirar ou Enviar Fotografia da Sala',
        desc: 'Clique ou arraste uma imagem do ambiente Montessori (JPG, PNG, HEIC)',
        button: 'Selecionar Fotografia'
      },
      uploading: {
        title: 'Enviando fotografia de alta resolução...',
        file: 'IMG_20260829_Patio.jpg • 4.2 MB'
      },
      photoBadges: {
        obs: '#OBS-519 • Pátio Externo',
        detected: '3 Alunos Detectados',
        blurred: 'Desfoque Facial Aplicado (LGPD)',
        original: 'Foto Original',
        sync: '100% Sync'
      },
      narrative: {
        header: 'Narrativa Pedagógica Montessori',
        model: 'Modelo AMI',
        students: 'Alunos: Lucas M. (6a) • Mateo V. (6a • Centro) • Sofia R. (6a)',
        text: '“Observação de grupo no pátio externo: Três crianças em movimento livre e coordenação dinâmica na cama elástica. Demonstram autorregulação motora, sincronia e alegria espontânea em comunidade.”',
        placeholder: 'Envie ou capture uma foto para a IA reconhecer o ambiente didático e redigir a observação pedagógica em tempo real...',
        footer: 'Registro automático no diário escolar AMI'
      },
      privacyBar: {
        lucasTooltip: 'Lucas M. (6a) • Consentimento Autorizado OK',
        mateoTooltip: 'Mateo V. (6a • Centro) • Sem Consentimento de Imagem (Rosto Desfocado)',
        sofiaTooltip: 'Sofia R. (6a) • Consentimento Autorizado OK',
        summary: 'Proteção Facial Ativa: Mateo V. (centro) não possui consentimento legal. Rosto desfocado automaticamente antes de publicar (LGPD).',
        viewOriginal: 'Ver Original',
        viewBlurred: 'Ver com Desfoque',
        safePublication: 'Publicação Segura'
      },
      pillars: [
        { title: 'Desfoque Facial Automático', desc: 'Proteção seletiva de menores sem alterar o restante dos alunos.' },
        { title: 'Filosofia AMI Integrada', desc: 'Narrativa descritiva focada em movimento e vida comunitária.' },
        { title: 'Portfólio Familiar Seguro', desc: 'Cumprimento estrito de privacidade antes de cada publicação.' }
      ]
    },
    forms: {
      badge1: 'Formulários & KYC Inteligente',
      badge2: 'Validação Oficial em Tempo Real',
      title: 'Gestor de Formulários Pro & Biometria',
      subtitle: 'Crie formulários com validação oficial de CPF / Registro em segundo plano, biometria KYC para responsáveis e 3 modos de apresentação interativa.',
      modes: {
        smartFields: 'Campos Inteligentes',
        wizard: 'Modo Wizard',
        fluid: 'Modo Fluido'
      },
      curpTitle: 'Campo Inteligente: Registro Oficial / CPF',
      curpStatus: 'Conexão com Registro Oficial',
      curpInputLabel: 'Entrada da Família:',
      curpVerifiedLabel: 'Dados Verificados Automaticamente:',
      kycTitle: 'Validação Biométrica KYC de Responsáveis Legais',
      kycStatus: 'Liveness Detectado 99.8%',
      docLabel: 'Foto de Documento Oficial (RG / Passaporte):',
      selfieLabel: 'Selfie de Prova de Vida (Anti-Spoofing):',
      matchLabel: 'Correspondência Facial Biométrica: 99.4% Verificado',
      pillars: [
        { title: 'Validação Oficial', desc: 'Conexão direta com bases governamentais.' },
        { title: 'Zero Fricção para Pais', desc: 'Preenchimento inteligente e rápido.' },
        { title: 'Sincronização Total', desc: 'Respostas direto no prontuário do aluno.' }
      ]
    },
    webbuilder: {
      badge1: 'Criador de Sites Escolar',
      badge2: 'Multi-idioma & SSL Incluído',
      title: 'Construtor Web Modular para sua Escola',
      subtitle: 'Crie e atualize a página oficial da sua escola com blocos modulares Montessori sem precisar de designers ou programadores.',
      tabs: {
        sections: 'Seções Modulares',
        style: 'Paleta & Marca',
        integrations: 'Integrações'
      },
      themeLabel: 'Tema e Tipografia Institucional Ativa:',
      themes: {
        terracotta: 'Alloy Orange & Serif Clássica',
        sage: 'Olive Sage & Minimalista',
        navy: 'Camel Terra & Orgânico'
      },
      integrations: [
        { title: 'Pipeline de Admissões Direto', desc: 'Inscrições do site entram automaticamente no Kanban.' },
        { title: 'Portal das Famílias & Calendário', desc: 'Acesso autenticado e agenda sincronizada.' }
      ],
      pillars: [
        { title: 'Arraste & Publique', desc: 'Blocos modulares prontos para uso.' },
        { title: 'Identidade Única', desc: 'Paletas e tipografias sob medida.' },
        { title: 'Conectado ao Sistema', desc: 'Admissões direto no prontuário.' }
      ]
    },
    finances: {
      badge1: 'Finanças Escolares',
      badge2: 'Conciliação Automática',
      title: 'Cobrança, Mensalidades & Conciliação Automática',
      subtitle: 'Automatize mensalidades recorrentes, emita recibos e concilie pagamentos bancários sem planilhas.',
      balanceCard: 'Saldo Mensal Arrecadado',
      methodsLabel: 'Métodos de Pagamento Habilitados:',
      methods: 'Stripe · Mercado Pago · PIX · Débito em Conta',
      recentTx: 'Últimas Transações Conciliadas:',
      pillars: [
        { title: 'Cobrança Automatizada', desc: 'Lembretes amigáveis por e-mail e portal.' },
        { title: 'Múltiplos Meios', desc: 'Cartões, transferências PIX e boleto.' },
        { title: 'Relatórios em Tempo Real', desc: 'Fluxo de caixa e projeções instantâneas.' }
      ]
    },
    pipelines: {
      badge1: 'Gestão Visual de Processos',
      badge2: 'Kanban Automatizado',
      title: 'Pipelines Kanban para Cada Processo Escolar',
      subtitle: 'Modele admissões, rematrículas, contratações e suporte com etapas visuais e automações.',
      stages: {
        new: 'Nova Inscrição',
        interview: 'Entrevista Familiar',
        visit: 'Observação em Sala',
        approved: 'Admitido / Matriculado'
      },
      pillars: [
        { title: 'Etapas Personalizadas', desc: 'Adapte os passos ao fluxo da sua escola.' },
        { title: 'Automações Ágeis', desc: 'Envio de e-mails e agendamentos ao avançar de etapa.' },
        { title: 'Histórico Completo', desc: 'Rastreabilidade de cada família.' }
      ]
    },
    calendar: {
      badge1: 'Agenda Inteligente',
      badge2: 'Sincronização Bidirecional',
      title: 'Calendário & Agendamentos Escolares',
      subtitle: 'Agende entrevistas, reuniões de feedback e eventos da comunidade sem conflitos de horário.',
      syncLabel: 'Sincronização bidirecional com Google Calendar e Apple Calendar.',
      pillars: [
        { title: 'Agendamento sem Conflitos', desc: 'Disponibilidade real de guias e direção.' },
        { title: 'Lembretes Automáticos', desc: 'Notificações por e-mail e portal.' },
        { title: 'Eventos da Sala', desc: 'Calendário pedagógico compartilhado.' }
      ]
    },
    family: {
      badge1: 'Comunidade Escolar',
      badge2: 'Privacidade Absoluta',
      title: 'Portal das Famílias Respeitoso & Privado',
      subtitle: 'Comunicação oficial, diário pedagógico e calendário sem grupos invasivos de WhatsApp.',
      pillars: [
        { title: 'Sem Grupos de WhatsApp', desc: 'Canal oficial, sereno e estruturado.' },
        { title: 'Diário Pedagógico', desc: 'Fotos e narrativas privadas do ambiente.' },
        { title: 'Assinaturas Digitais', desc: 'Autorizações e documentos em um clique.' }
      ]
    },
    staff: {
      badge1: 'Equipe Montessori',
      badge2: 'Segurança Granular',
      title: 'Gestão de Guias, Assistentes & Funções',
      subtitle: 'Atribua permissões específicas por ambiente de trabalho e proteja a memória institucional.',
      pillars: [
        { title: 'Permissões por Sala', desc: 'Acesso restrito aos alunos atribuídos.' },
        { title: 'Memória Institucional', desc: 'Histórico pedagógico preservado ano a ano.' },
        { title: 'Funções Claras', desc: 'Direção, Guias, Assistentes e Especialistas.' }
      ]
    }
  },
  it: {
    tabs: [
      { id: 'tracking', label: 'Registro & Monitoraggio', subtitle: 'Lezioni, Tracker & Dettato IA' },
      { id: 'forms', label: 'Moduli & KYC', subtitle: 'Verifica Ufficiale & Biometria' },
      { id: 'gallery', label: 'Galleria Intelligente', subtitle: 'IA Narrativa & Sfocatura Viso' },
      { id: 'webbuilder', label: 'Web Builder Istituzionale', subtitle: 'Drag & Drop Modulare' },
      { id: 'finances', label: 'Fatturazione & Rette', subtitle: 'Stripe · Riconciliazione Automatica' },
      { id: 'pipelines', label: 'Pipeline Kanban', subtitle: 'Ammissioni a Fasi' },
      { id: 'calendar', label: 'Calendario & Appuntamenti', subtitle: 'Google & Apple Sync' },
      { id: 'family', label: 'Portale Famiglie', subtitle: 'Privato senza WhatsApp' },
      { id: 'staff', label: 'Guide & Ruoli di Squadra', subtitle: 'Permessi per Ambiente' },
    ],
    tracking: {
      badge1: 'Matrice in Tempo Reale',
      badge2: 'Dettato Vocale IA',
      title: 'Registro, Monitoraggio Pedagogico & Dettato Vocale',
      subtitle: 'Registra le osservazioni in tempo reale con la tua voce. L\'IA identifica lo studente, collega la lezione del curriculum e aggiorna la matrice.',
      liveBadge: 'Matrice Pedagogica dal Vivo',
      demoBtn: 'Guarda demo animata',
      demoBtnPlaying: 'Riproduzione demo...',
      syncBadge: '100% Sync dal Vivo',
      videoOverlay: {
        badge: 'Demo Guidata • Dettato Vocale & Matrice',
        title: 'Osservazione dal Vivo, Trascrizione IA & Sincronizzazione Matrice',
        desc: 'Guarda una guida registrare una nota vocale per Elena R. e come l\'IA struttura l\'osservazione aggiornando la matrice in tempo reale.',
        playCta: 'Clicca per riprodurre la demo interattiva',
        skipCta: 'O esplora la matrice liberamente →'
      },
      matrixTitle: 'Casa dei Bambini 3-6 • Linguaggio & Vita Pratica',
      matrixSubtitle: 'Ciclo di Lavoro Mattutino • 24 Bambini',
      cols: {
        student: 'Studente',
        activity: 'Attività Attuale',
        area: 'Area',
        status: 'Stato Pedagogico',
        action: 'Azione'
      },
      statuses: {
        mastered: 'Padroneggiato (3° Tempo)',
        in_progress: 'In Corso (2° Tempo)',
        presented: 'Presentato (1° Tempo)'
      },
      dictateBtn: 'Dettare',
      detailsBtn: 'Dettagli',
      simModal: {
        badge: 'Dettato Vocale & Strutturazione Pedagogica IA',
        status: 'REGISTRAZIONE IN DIRETTA',
        speechText: 'Elena ha composto parole con l\'alfabeto mobile per 30 minuti... fonemi /m/ /a/ /s/ /a/ consolidati e autoregolazione spontanea.',
        audioDetect: 'Sensore Onde Sonore • Modello gpt-5.6-luna',
        cancelBtn: 'Annulla',
        finishBtn: 'Concludi & Struttura con IA'
      },
      flashToast: 'Osservazione sincronizzata con successo nel fascicolo di Elena R.',
      cellDetail: {
        publicTitle: 'Narrativa Pedagogica Familiare (Bollettino / Diario):',
        publicNote: '«Elena ha mostrato un periodo di concentrazione prolungata nell\'area del linguaggio, interiorizzando con entusiasmo la corrispondenza fonetica.»',
        privateTitle: 'Diario Interno della Guida (Fascicolo Scolastico):',
        privateNote: '«Consolidati fonemi /m/ /a/ /s/ /a/ senza errori spontanei. Pronta per lettere smerigliate serie blu la prossima settimana.»',
        badgeSynced: 'Sincronizzato con Fascicolo & Diario Familiare'
      },
      pillars: [
        { title: 'Dettato Vocale Naturale', desc: 'Parla liberamente e l\'IA struttura l\'osservazione con rigore AMI.' },
        { title: 'Matrice Montessori Viva', desc: 'Monitoraggio visivo di lezioni, 3 tempi e periodi sensitivi.' },
        { title: 'Bollettino Familiare Istantaneo', desc: 'Narrative calorose per i genitori senza straordinari a casa.' }
      ]
    },
    gallery: {
      badge1: 'IA Pedagogica & Narrativa',
      badge2: 'Protezione Facciale Automatica & GDPR / Privacy',
      title: 'Galleria Intelligente & Privacy con IA',
      subtitle: 'Carica fotografie delle attività scolastiche: l\'IA redige l\'osservazione pedagogica in linguaggio Montessori e sostituisce automaticamente con la versione sfocata per qualsiasi allievo sprovvisto di consenso.',
      liveBadge: 'Galleria Protetta dal Vivo',
      demoBtn: 'Guarda demo animata',
      demoBtnPlaying: 'Riproduzione demo...',
      protectionBadge: 'Protezione Facciale 100%',
      videoOverlay: {
        badge: 'Demo Guidata • Galleria & Privacy IA',
        title: 'Caricamento Foto, Narrativa AMI & Sfocatura Facciale Automatica',
        desc: 'Guarda come l\'IA elabora una foto di 3 bambini nel cortile: genera l\'osservazione pedagogica e sfoca automaticamente il volto del bambino centrale senza consenso.',
        playCta: 'Clicca per riprodurre la demo interattiva',
        skipCta: 'O esplora la galleria liberamente →'
      },
      dropzone: {
        title: 'Scatta o Carica Fotografia della Classe',
        desc: 'Fai clic o trascina un\'immagine dall\'ambiente Montessori (JPG, PNG, HEIC)',
        button: 'Seleziona Fotografia'
      },
      uploading: {
        title: 'Caricamento fotografia ad alta risoluzione...',
        file: 'IMG_20260829_Cortile.jpg • 4.2 MB'
      },
      photoBadges: {
        obs: '#OBS-519 • Cortile Esterno',
        detected: '3 Alunni Rilevati',
        blurred: 'Sfocatura Facciale Applicata (GDPR)',
        original: 'Foto Originale',
        sync: '100% Sync'
      },
      narrative: {
        header: 'Narrativa Pedagogica Montessori',
        model: 'Modello AMI',
        students: 'Alunni: Lucas M. (6a) • Mateo V. (6a • Centro) • Sofia R. (6a)',
        text: '“Osservazione di gruppo nel cortile esterno: Tre bambini in movimento libero e coordinazione dinamica sul trampolino elastico. Dimostrano autoregolazione motoria, sincronia e gioia spontanea in comunità.”',
        placeholder: 'Carica o scatta una foto per consentire all\'IA di riconoscere l\'ambiente didattico e scrivere l\'osservazione in tempo reale...',
        footer: 'Registrazione automatica nel diario scolastico AMI'
      },
      privacyBar: {
        lucasTooltip: 'Lucas M. (6a) • Consenso Autorizzato OK',
        mateoTooltip: 'Mateo V. (6a • Centro) • Nessun Consenso Foto (Viso Sfocato)',
        sofiaTooltip: 'Sofia R. (6a) • Consenso Autorizzato OK',
        summary: 'Protezione del Viso Attiva: Mateo V. (centro) è sprovvisto di consenso legale. Viso sfocato automaticamente prima della pubblicazione (GDPR).',
        viewOriginal: 'Visualizza Originale',
        viewBlurred: 'Visualizza con Blur',
        safePublication: 'Pubblicazione Sicura'
      },
      pillars: [
        { title: 'Sfocatura Facciale Automatica', desc: 'Protezione selettiva dei minori senza alterare il resto dei compagni.' },
        { title: 'Filosofia AMI Integrata', desc: 'Narrativa descrittiva focalizzata sul movimento e la comunità.' },
        { title: 'Portfolio Familiare Sicuro', desc: 'Rigorosa conformità alla privacy prima di ogni pubblicazione.' }
      ]
    },
    forms: {
      badge1: 'Moduli & KYC Intelligente',
      badge2: 'Verifica Ufficiale dal Vivo',
      title: 'Gestore Moduli Pro & Biometria',
      subtitle: 'Crea moduli con verifica ufficiale dei documenti in background, biometria KYC per tutori e 3 modalità di presentazione interattiva.',
      modes: {
        smartFields: 'Campi Intelligenti',
        wizard: 'Modalità Wizard',
        fluid: 'Modalità Fluida'
      },
      curpTitle: 'Campo Intelligente: Documento di Identità Ufficiale',
      curpStatus: 'Connessione Ufficiale in Background',
      curpInputLabel: 'Dati Inseriti dai Genitori:',
      curpVerifiedLabel: 'Dati Verificati Automaticamente:',
      kycTitle: 'Validazione Biometrica KYC dei Tutori Legali',
      kycStatus: 'Liveness Rilevato 99.8%',
      docLabel: 'Foto del Documento d\'Identità (Passaporto / Carta):',
      selfieLabel: 'Selfie di Prova di Vita (Anti-Spoofing):',
      matchLabel: 'Corrispondenza Biometrica del Viso: 99.4% Verificato',
      pillars: [
        { title: 'Validazione Ufficiale', desc: 'Collegamento diretto con banche dati di identità.' },
        { title: 'Zero Attrito per i Genitori', desc: 'Compilazione intelligente e immediata.' },
        { title: 'Sincronizzazione Completa', desc: 'Risposte direttamente nel fascicolo dell\'allievo.' }
      ]
    },
    webbuilder: {
      badge1: 'Web Builder Istituzionale',
      badge2: 'Multilingua & SSL Incluso',
      title: 'Costruttore Web Modulare per la tua Scuola',
      subtitle: 'Crea e aggiorna il sito ufficiale della tua scuola con blocchi modulari Montessori senza grafici o programmatori.',
      tabs: {
        sections: 'Sezioni Modulari',
        style: 'Tavolozza & Brand',
        integrations: 'Integrazioni'
      },
      themeLabel: 'Tema e Tipografia Istituzionale Attiva:',
      themes: {
        terracotta: 'Alloy Orange & Serif Classica',
        sage: 'Olive Sage & Minimalista',
        navy: 'Camel Terra & Organico'
      },
      integrations: [
        { title: 'Pipeline Ammissioni Diretta', desc: 'Le richieste dal sito entrano automaticamente nel Kanban.' },
        { title: 'Portale Famiglie & Calendario', desc: 'Accesso autenticato e agenda visite sincronizzata.' }
      ],
      pillars: [
        { title: 'Trascina & Pubblica', desc: 'Blocchi modulari pronti all\'uso.' },
        { title: 'Identità Unica', desc: 'Tavolozze e caratteri su misura.' },
        { title: 'Connesso al Sistema', desc: 'Ammissioni direttamente nel fascicolo.' }
      ]
    },
    finances: {
      badge1: 'Finanze Scolastiche',
      badge2: 'Riconciliazione Automatica',
      title: 'Fatturazione Rette & Riconciliazione Bancaria',
      subtitle: 'Automatizza le rette ricorrenti, emetti ricevute fiscali e riconcilia bonifici bancari senza fogli di calcolo.',
      balanceCard: 'Saldo Mensile Incassato',
      methodsLabel: 'Metodi di Pagamento Abilitati:',
      methods: 'Stripe · Bonifico Bancario · Addebito Diretto',
      recentTx: 'Ultime Transazioni Riconciliate:',
      pillars: [
        { title: 'Fatturazione Automatica', desc: 'Solleciti discreti via email e portale.' },
        { title: 'Metodi Multipli', desc: 'Carte di credito, bonifici e contanti.' },
        { title: 'Report in Tempo Reale', desc: 'Flusso di cassa e proiezioni istantanee.' }
      ]
    },
    pipelines: {
      badge1: 'Gestione Visiva dei Processi',
      badge2: 'Kanban Automatizzato',
      title: 'Pipeline Kanban per Ogni Processo Scolastico',
      subtitle: 'Modella ammissioni, reiscrizioni, assunzioni guide e supporto pedagogico con fasi visive e automazioni.',
      stages: {
        new: 'Nuova Richiesta',
        interview: 'Colloquio Familiare',
        visit: 'Osservazione in Classe',
        approved: 'Ammesso / Iscritto'
      },
      pillars: [
        { title: 'Fasi Personalizzate', desc: 'Adatta ogni passaggio al flusso della tua scuola.' },
        { title: 'Automazioni Agili', desc: 'Invio automatico di email e inviti al cambio di fase.' },
        { title: 'Tracciabilità Completa', desc: 'Cronologia dettagliata nel fascicolo.' }
      ]
    },
    calendar: {
      badge1: 'Agenda Intelligente',
      badge2: 'Sincronizzazione Bidirezionale',
      title: 'Calendario & Prenotazione Visite',
      subtitle: 'Pianifica colloqui di ammissione, riunioni con i genitori ed eventi comunitari senza sovrapposizioni.',
      syncLabel: 'Sincronizzazione in tempo reale con Google Calendar e Apple Calendar.',
      pillars: [
        { title: 'Zero Conflitti', desc: 'Disponibilità effettiva di guide e direzione.' },
        { title: 'Promemoria Automatici', desc: 'Notifiche via email e portale.' },
        { title: 'Eventi della Classe', desc: 'Calendario pedagogico condiviso con le famiglie.' }
      ]
    },
    family: {
      badge1: 'Comunità Scolastica',
      badge2: 'Privacy Assoluta',
      title: 'Portale Famiglie Rispettoso & Privato',
      subtitle: 'Comunicazioni ufficiali, diario pedagogico e calendario senza chat di gruppo invasive su WhatsApp.',
      pillars: [
        { title: 'Senza Gruppi WhatsApp', desc: 'Canal official, sereno e strutturato.' },
        { title: 'Diario Pedagogico', desc: 'Foto e narrazioni private dell\'ambiente.' },
        { title: 'Firme Digitali', desc: 'Consensi e autorizzazioni con un clic.' }
      ]
    },
    staff: {
      badge1: 'Team Montessori',
      badge2: 'Sicurezza Granulare',
      title: 'Gestione Guide, Assistenti & Ruoli',
      subtitle: 'Assegna permessi specifici per ambiente di lavoro e preserva la memoria istituzionale della scuola.',
      pillars: [
        { title: 'Permessi per Classe', desc: 'Accesso limitato esclusivamente agli allievi assegnati.' },
        { title: 'Memoria Istituzionale', desc: 'Archivio pedagogico conservato anno dopo anno.' },
        { title: 'Ruoli Trasparenti', desc: 'Direzione, Guide, Assistenti e Specialisti.' }
      ]
    }
  },
  fr: {
    tabs: [
      { id: 'tracking', label: 'Suivi & Registres', subtitle: 'Leçons, Suivi & Dictée IA' },
      { id: 'forms', label: 'Formulaires & KYC', subtitle: 'Vérification Officielle & Biométrie' },
      { id: 'gallery', label: 'Galerie Intelligente', subtitle: 'IA Narrative & Flou Facial' },
      { id: 'webbuilder', label: 'Créateur de Site Web', subtitle: 'Glisser-Déposer Modulaire' },
      { id: 'finances', label: 'Facturation & Frais', subtitle: 'Stripe · Rapprochement Bancaire' },
      { id: 'pipelines', label: 'Pipelines Kanban', subtitle: 'Admissions par Étapes' },
      { id: 'calendar', label: 'Calendrier & Rendez-vous', subtitle: 'Google & Apple Sync' },
      { id: 'family', label: 'Portail Familles', subtitle: 'Privé sans Groupes WhatsApp' },
      { id: 'staff', label: 'Éducateurs & Rôles', subtitle: 'Permissions par Ambiance' },
    ],
    tracking: {
      badge1: 'Matrice en Temps Réel',
      badge2: 'Dictée Vocale IA',
      title: 'Suivi Pédagogique, Observations & Dictée Vocale',
      subtitle: 'Enregistrez les observations de classe à la voix. L\'IA identifie l\'élève, associe la leçon Montessori et met à jour la matrice en quelques secondes.',
      liveBadge: 'Matrice Pédagogique en Direct',
      demoBtn: 'Voir la démo animée',
      demoBtnPlaying: 'Lecture de la démo...',
      syncBadge: '100% Sync en Direct',
      videoOverlay: {
        badge: 'Démo Guidée • Dictée Vocale & Matrice',
        title: 'Observation en Direct, Transcription IA & Registre Matrice',
        desc: 'Observez une éducatrice enregistrer une note vocale pour Elena R. et comment l\'IA structure l\'observation en mettant à jour la matrice en temps réel.',
        playCta: 'Cliquez pour lancer la démo interactive',
        skipCta: 'Ou explorer la matrice librement →'
      },
      matrixTitle: 'Maison des Enfants 3-6 • Langage & Vie Pratique',
      matrixSubtitle: 'Cycle de Travail du Matin • 24 Enfants',
      cols: {
        student: 'Élève',
        activity: 'Activité Actuelle',
        area: 'Domaine',
        status: 'Statut Pédagogique',
        action: 'Action'
      },
      statuses: {
        mastered: 'Maîtrisé (3e Temps)',
        in_progress: 'En Cours (2e Temps)',
        presented: 'Présenté (1er Temps)'
      },
      dictateBtn: 'Dicter',
      detailsBtn: 'Détails',
      simModal: {
        badge: 'Dictée Vocale & Structuration Pédagogique IA',
        status: 'ENREGISTREMENT EN DIRECT',
        speechText: 'Elena a composé des mots avec l\'alphabet mobile pendant 30 minutes... phonèmes /m/ /a/ /s/ /a/ consolidés et autorégulation spontanée.',
        audioDetect: 'Capteur d\'Ondes Sonores • Modèle gpt-5.6-luna',
        cancelBtn: 'Annuler',
        finishBtn: 'Finaliser & Structurer avec l\'IA'
      },
      flashToast: 'Observation synchronisée avec succès dans le dossier d\'Elena R.',
      cellDetail: {
        publicTitle: 'Récit Pédagogique Familial (Bulletin / Journal) :',
        publicNote: '«Elena a fait preuve d\'une concentration prolongée dans le domaine du langage, s\'appropriant avec enthousiasme la correspondance phonétique.»',
        privateTitle: 'Journal Interne de l\'Éducatrice (Dossier Scolaire) :',
        privateNote: '«Phonèmes /m/ /a/ /s/ /a/ consolidés sans erreur spontanée. Prête pour les lettres rugueuses série bleue la semaine prochaine.»',
        badgeSynced: 'Synchronisé avec le Dossier & le Journal Familial'
      },
      pillars: [
        { title: 'Dictée Vocale Naturelle', desc: 'Parlez librement et l\'IA structure l\'observation selon les standards AMI.' },
        { title: 'Matrice Montessori Vivante', desc: 'Suivi visuel des leçons, des 3 temps et des périodes sensibles.' },
        { title: 'Bulletin Familial Instantané', desc: 'Récits chaleureux pour les parents sans heures supplémentaires.' }
      ]
    },
    gallery: {
      badge1: 'IA Pédagogique & Récit',
      badge2: 'Protection Faciale Automatique & RGPD / Vie Privée',
      title: 'Galerie Intelligente & Confidentialité IA',
      subtitle: 'Téléchargez les photos d\'activités de l\'école : l\'IA rédige le récit d\'observation Montessori et applique automatiquement un flou facial pour tout enfant sans consentement.',
      liveBadge: 'Galerie Sécurisée en Direct',
      demoBtn: 'Voir la démo animée',
      demoBtnPlaying: 'Lecture de la démo...',
      protectionBadge: 'Protection Faciale 100%',
      videoOverlay: {
        badge: 'Démo Guidée • Galerie & Confidentialité IA',
        title: 'Import Photo, Récit AMI & Flou Facial Automatique',
        desc: 'Observez comment l\'IA traite une photo de 3 enfants dans la cour : elle rédige le récit d\'observation et floute automatiquement le visage de l\'enfant central sans consentement.',
        playCta: 'Cliquez pour lancer la démo interactive',
        skipCta: 'Ou explorer la galerie librement →'
      },
      dropzone: {
        title: 'Prendre ou Importer une Photo de la Classe',
        desc: 'Cliquez ou glissez une image depuis l\'ambiance Montessori (JPG, PNG, HEIC)',
        button: 'Sélectionner une Photo'
      },
      uploading: {
        title: 'Téléchargement de la photographie haute résolution...',
        file: 'IMG_20260829_Cour.jpg • 4.2 MB'
      },
      photoBadges: {
        obs: '#OBS-519 • Cour Extérieure',
        detected: '3 Élèves Détectés',
        blurred: 'Flou Facial Appliqué (RGPD)',
        original: 'Photo Originale',
        sync: '100% Sync'
      },
      narrative: {
        header: 'Récit Pédagogique Montessori',
        model: 'Modèle AMI',
        students: 'Élèves : Lucas M. (6a) • Mateo V. (6a • Centre) • Sofia R. (6a)',
        text: '“Observation de groupe dans la cour extérieure : Trois enfants en mouvement libre et coordination dynamique sur trampoline. Faisant preuve d\'autorégulation motrice, de synchronie et de joie spontanée en communauté.”',
        placeholder: 'Importez ou prenez une photo pour que l\'IA reconnaisse l\'ambiance et rédige l\'observation pédagogique en temps réel...',
        footer: 'Enregistrement automatique dans le journal scolaire AMI'
      },
      privacyBar: {
        lucasTooltip: 'Lucas M. (6a) • Consentement Autorisé OK',
        mateoTooltip: 'Mateo V. (6a • Centre) • Sans Consentement Photo (Visage Flouté)',
        sofiaTooltip: 'Sofia R. (6a) • Consentement Autorisé OK',
        summary: 'Protection Faciale Active : Mateo V. (centre) n\'a pas de consentement légal. Visage flouté automatiquement avant publication (RGPD).',
        viewOriginal: 'Voir l\'Originale',
        viewBlurred: 'Voir avec Flou',
        safePublication: 'Publication Sécurisée'
      },
      pillars: [
        { title: 'Flou Facial Automatique', desc: 'Protection sélective des mineurs sans altérer les autres camarades.' },
        { title: 'Philosophie AMI Intégrée', desc: 'Récit descriptif axé sur le mouvement et la vie communautaire.' },
        { title: 'Portfolio Familial Sécurisé', desc: 'Respect strict de la vie privée avant chaque publication.' }
      ]
    },
    forms: {
      badge1: 'Formulaires & KYC Intelligent',
      badge2: 'Vérification Officielle en Direct',
      title: 'Gestionnaire de Formulaires Pro & Biométrie',
      subtitle: 'Créez des formulaires avec vérification officielle des pièces d\'identité en arrière-plan, biométrie KYC pour tuteurs et 3 modes de présentation.',
      modes: {
        smartFields: 'Champs Intelligents',
        wizard: 'Mode Assistant',
        fluid: 'Mode Fluide'
      },
      curpTitle: 'Champ Intelligent : Identifiant Officiel / Pièce d\'Identité',
      curpStatus: 'Vérification d\'Identité en Arrière-Plan',
      curpInputLabel: 'Saisie des Parents :',
      curpVerifiedLabel: 'Données Vérifiées Automatiquement :',
      kycTitle: 'Validation Biométrique KYC des Tuteurs Légaux',
      kycStatus: 'Liveness Détecté 99.8%',
      docLabel: 'Photo de Pièce d\'Identité (Passeport / CNI) :',
      selfieLabel: 'Selfie de Preuve de Vie (Anti-Usurpation) :',
      matchLabel: 'Correspondance Biométrique Faciale : 99.4% Vérifié',
      pillars: [
        { title: 'Validation Officielle', desc: 'Connexion directe avec les registres d\'identité.' },
        { title: 'Zéro Friction pour les Parents', desc: 'Remplissage intelligent et instantané.' },
        { title: 'Synchronisation Totale', desc: 'Réponses intégrées au dossier de l\'élève.' }
      ]
    },
    webbuilder: {
      badge1: 'Créateur de Site Web Scolaire',
      badge2: 'Multilingue & SSL Inclus',
      title: 'Constructeur Web Modulaire pour votre École',
      subtitle: 'Créez et actualisez le site officiel de votre école avec des blocs modulaires Montessori sans designers ni développeurs.',
      tabs: {
        sections: 'Sections Modulaires',
        style: 'Palette & Image de Marque',
        integrations: 'Intégrations'
      },
      themeLabel: 'Thème et Typographie Institutionnelle Active :',
      themes: {
        terracotta: 'Alloy Orange & Sérif Classique',
        sage: 'Olive Sage & Minimaliste',
        navy: 'Camel Terra & Organique'
      },
      integrations: [
        { title: 'Pipeline d\'Admissions Direct', desc: 'Les demandes du site web entrent automatiquement dans le Kanban.' },
        { title: 'Portail Familles & Calendrier', desc: 'Accès authentifié et prise de rendez-vous synchronisée.' }
      ],
      pillars: [
        { title: 'Glissez & Publiez', desc: 'Blocs modulaires prêts à l\'emploi.' },
        { title: 'Identité Unique', desc: 'Palettes et typographies sur mesure.' },
        { title: 'Connecté au Système', desc: 'Admissions directement vers le dossier élève.' }
      ]
    },
    finances: {
      badge1: 'Finances Scolaires',
      badge2: 'Rapprochement Automatisé',
      title: 'Facturation des Frais & Rapprochement Bancaire',
      subtitle: 'Automatisez les frais de scolarité récurrents, émettez des reçus fiscaux et rapprochez les virements sans tableurs.',
      balanceCard: 'Solde Mensuel Collecté',
      methodsLabel: 'Moyens de Paiement Activés :',
      methods: 'Stripe · Virement Bancaire · Prélèvement SEPA',
      recentTx: 'Dernières Transactions Rapprochées :',
      pillars: [
        { title: 'Facturation Automatisée', desc: 'Rappels bienveillants par email et portail.' },
        { title: 'Moyens Multiples', desc: 'Cartes bancaires, virements et prélèvements.' },
        { title: 'Rapports en Temps Réel', desc: 'Flux de trésorerie et projections instantanées.' }
      ]
    },
    pipelines: {
      badge1: 'Gestion Visuelle des Processus',
      badge2: 'Kanban Automatisé',
      title: 'Pipelines Kanban pour Chaque Processus Scolaire',
      subtitle: 'Modélisez admissions, réinscriptions, recrutement d\'éducateurs et soutien avec des étapes visuelles.',
      stages: {
        new: 'Nouvelle Candidature',
        interview: 'Entretien Familial',
        visit: 'Observation en Classe',
        approved: 'Admis / Inscrit'
      },
      pillars: [
        { title: 'Étapes Personnalisées', desc: 'Adaptez les étapes au flux unique de votre école.' },
        { title: 'Automatisations Agiles', desc: 'Envoi d\'emails et de rendez-vous lors des transitions.' },
        { title: 'Traçabilité Complète', desc: 'Historique préservé dans chaque dossier.' }
      ]
    },
    calendar: {
      badge1: 'Agenda Intelligent',
      badge2: 'Synchronisation Bidirectionnelle',
      title: 'Calendrier & Prise de Rendez-vous',
      subtitle: 'Planifiez les entretiens d\'admission, réunions pédagogiques et événements communautaires sans chevauchement.',
      syncLabel: 'Synchronisation bidirectionnelle avec Google Calendar et Apple Calendar.',
      pillars: [
        { title: 'Zéro Conflit d\'Horaire', desc: 'Disponibilité réelle des éducateurs et de la direction.' },
        { title: 'Rappels Automatisés', desc: 'Notifications par email et portail.' },
        { title: 'Événements de la Classe', desc: 'Calendrier pédagogique partagé avec les parents.' }
      ]
    },
    family: {
      badge1: 'Communauté Scolaire',
      badge2: 'Confidentialité Absolue',
      title: 'Portail des Familles Respectueux & Privé',
      subtitle: 'Communication officielle, journal pédagogique et calendrier sans groupes WhatsApp envahissants.',
      pillars: [
        { title: 'Sans Groupes WhatsApp', desc: 'Canal officiel, serein et structuré.' },
        { title: 'Journal Pédagogique', desc: 'Photos et récits privés de l\'ambiance.' },
        { title: 'Signatures Électroniques', desc: 'Autorisations et documents en un clic.' }
      ]
    },
    staff: {
      badge1: 'Équipe Montessori',
      badge2: 'Sécurité Granulaire',
      title: 'Gestion des Éducateurs, Assistants & Rôles',
      subtitle: 'Attribuez des permissions par ambiance et préservez la mémoire institutionnelle de l\'école.',
      pillars: [
        { title: 'Permissions par Classe', desc: 'Accès strictement limité aux élèves assignés.' },
        { title: 'Mémoire Institutionnelle', desc: 'Historique pédagogique conservé d\'année en année.' },
        { title: 'Rôles Clairs', desc: 'Direction, Éducateurs, Assistants et Spécialistes.' }
      ]
    }
  }
};

export const MontessoriNexusLanding: React.FC = () => {
  // Theme & Language State (English default)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('montessori_nexus_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang')?.toLowerCase() as Language;
      if (['en', 'es', 'pt', 'fr'].includes(urlLang)) {
        return urlLang;
      }
      const saved = localStorage.getItem('montessori_nexus_lang') as Language;
      if (['en', 'es', 'pt', 'fr'].includes(saved)) {
        return saved;
      }
      const navLang = navigator.language?.toLowerCase() || '';
      if (navLang.startsWith('es')) return 'es';
      if (navLang.startsWith('pt')) return 'pt';
      if (navLang.startsWith('fr')) return 'fr';
      if (navLang.startsWith('en')) return 'en';
    }
    return 'es'; // Default to Spanish
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
  const [aiNarrativeStep, setAiNarrativeStep] = useState<'voice' | 'structured' | 'matrix'>('voice');
  const [activeBuilderTheme, setActiveBuilderTheme] = useState<'terracotta' | 'sage' | 'navy'>('terracotta');
  const [builderActiveTab, setBuilderActiveTab] = useState<'sections' | 'style' | 'integrations'>('sections');
  const [builderSections, setBuilderSections] = useState([
    { id: 'hero', name: 'Hero & Filosofía Montessori', badge: 'CTA Dinámico', active: true },
    { id: 'admissions', name: 'Proceso de Admisión en Línea', badge: 'Sincronizado', active: true },
    { id: 'calendar', name: 'Calendario & Citas de Observación', badge: 'Google / iCal', active: true },
    { id: 'portal', name: 'Portal de Padres & Circulares', badge: 'Acceso Seguro', active: true },
    { id: 'contact', name: 'Formulario de Contacto & Mapa', badge: 'Geolocalizado', active: true },
  ]);

  const toggleBuilderSection = (id: string) => {
    setBuilderSections(prev =>
      prev.map(s => s.id === id ? { ...s, active: !s.active } : s)
    );
  };

  // Master Modules Tabs State & Ref
  const [activeModuleTab, setActiveModuleTab] = useState<string>('tracking');
  const [aiCarouselIndex, setAiCarouselIndex] = useState(0);
  const aiCarouselRef = useRef<HTMLDivElement>(null);
  const [trackingModuleSubView, setTrackingModuleSubView] = useState<'matrix' | 'voice_sim' | 'ai_wizard'>('matrix');
  const [trackingActiveCategory, setTrackingActiveCategory] = useState<'lessons' | 'trackers'>('lessons');
  const [trackingSelectedCell, setTrackingSelectedCell] = useState<{
    student: string;
    studentAge: string;
    activity: string;
    area: string;
    status: string;
    statusColor: string;
    publicNote: string;
    privateNote: string;
    photoUrl?: string;
  }>({
    student: 'Elena R.',
    studentAge: '5a 1m',
    activity: 'Alfabeto Móvil',
    area: 'Lenguaje',
    status: 'Dominado (3er Tiempo)',
    statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    publicNote: '«Elena demostró un periodo de concentración prolongada en el área de lenguaje, interiorizando con entusiasmo la correspondencia fonética y la construcción de palabras.»',
    privateNote: '«Consolidó fonemas /m/ /a/ /s/ /a/ sin error espontáneo. Lista para letras de lija serie azul la próxima semana.»',
    photoUrl: '/images/montessori_child_privacy_demo.jpg'
  });

  // Tracking Module Video-Feel Simulation State
  const [trackingShowVideoOverlay, setTrackingShowVideoOverlay] = useState<boolean>(true);
  const [trackingDemoPlaying, setTrackingDemoPlaying] = useState<boolean>(false);
  const [trackingDemoStep, setTrackingDemoStep] = useState<'idle' | 'cursor_to_btn' | 'recording_typing' | 'cursor_to_check' | 'registered_success' | 'done'>('idle');
  const [trackingSimCursor, setTrackingSimCursor] = useState<{ xPercent: number; yPercent: number; isClicking: boolean }>({ xPercent: 50, yPercent: 50, isClicking: false });
  const [trackingLiveTypedText, setTrackingLiveTypedText] = useState<string>('');
  const [trackingSimRecordingSec, setTrackingSimRecordingSec] = useState<number>(0);
  const [trackingJustRegisteredFlash, setTrackingJustRegisteredFlash] = useState<boolean>(false);
  const demoTimeoutsRef = useRef<any[]>([]);

  const startTrackingVideoDemo = () => {
    demoTimeoutsRef.current.forEach(t => clearTimeout(t));
    demoTimeoutsRef.current = [];

    setTrackingShowVideoOverlay(false);
    setTrackingDemoPlaying(true);
    setTrackingModuleSubView('matrix');
    setTrackingLiveTypedText('');
    setTrackingSimRecordingSec(0);
    setTrackingJustRegisteredFlash(false);
    setTrackingDemoStep('cursor_to_btn');
    setTrackingSimCursor({ xPercent: 50, yPercent: 50, isClicking: false });

    // Step 1: Cursor smoothly moves to Elena's "Dictar" button in the matrix (~58% x, ~42% y)
    const t1 = setTimeout(() => {
      setTrackingSimCursor({ xPercent: 58, yPercent: 42, isClicking: false });
    }, 100);

    // Step 2: Cursor clicks the button
    const t2 = setTimeout(() => {
      setTrackingSimCursor({ xPercent: 58, yPercent: 42, isClicking: true });
    }, 1200);

    // Step 3: Opens live voice recorder modal and begins typing & audio waveform
    const t3 = setTimeout(() => {
      setTrackingSimCursor({ xPercent: 58, yPercent: 42, isClicking: false });
      setTrackingModuleSubView('voice_sim');
      setTrackingDemoStep('recording_typing');

      const currentMod = MODULES_SHOWCASE_I18N[lang] || MODULES_SHOWCASE_I18N.es;
      const fullText = currentMod.tracking.simModal.speechText;
      let charIdx = 0;
      const typeInterval = setInterval(() => {
        charIdx += 3;
        if (charIdx <= fullText.length) {
          setTrackingLiveTypedText(fullText.slice(0, charIdx));
        } else {
          setTrackingLiveTypedText(fullText);
          clearInterval(typeInterval);
        }
      }, 40);

      const secInterval = setInterval(() => {
        setTrackingSimRecordingSec(prev => prev + 1);
      }, 600);

      demoTimeoutsRef.current.push(typeInterval);
      demoTimeoutsRef.current.push(secInterval);
    }, 1600);

    // Step 4: Cursor moves towards the green "Finalizar & Estructurar" button (~56% x, ~84% y)
    const t4 = setTimeout(() => {
      setTrackingDemoStep('cursor_to_check');
      setTrackingSimCursor({ xPercent: 56, yPercent: 84, isClicking: false });
    }, 4600);

    // Step 5: Cursor clicks the Check button
    const t5 = setTimeout(() => {
      setTrackingSimCursor({ xPercent: 56, yPercent: 84, isClicking: true });
    }, 5400);

    // Step 6: Registration & Flash in Matrix
    const t6 = setTimeout(() => {
      setTrackingSimCursor({ xPercent: 56, yPercent: 84, isClicking: false });
      setTrackingDemoStep('registered_success');
      setTrackingModuleSubView('matrix');
      setTrackingJustRegisteredFlash(true);
      setTrackingSelectedCell({
        student: 'Elena R.',
        studentAge: '5a 1m',
        activity: lang === 'en' ? 'Movable Alphabet' : lang === 'pt' ? 'Alfabeto Móvel' : lang === 'it' ? 'Alfabeto Mobile' : lang === 'fr' ? 'Alphabet Mobile' : 'Alfabeto Móvil',
        area: lang === 'en' ? 'Language' : lang === 'pt' ? 'Linguagem' : lang === 'it' ? 'Linguaggio' : lang === 'fr' ? 'Langage' : 'Lenguaje',
        status: currentMod.tracking.statuses.mastered,
        statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        publicNote: currentMod.tracking.cellDetail.publicNote,
        privateNote: currentMod.tracking.cellDetail.privateNote,
        photoUrl: '/images/montessori_child_privacy_demo.jpg'
      });
    }, 6000);

    // Step 7: Done - full interactive control returned to user
    const t7 = setTimeout(() => {
      setTrackingDemoPlaying(false);
      setTrackingDemoStep('done');
    }, 7400);

    demoTimeoutsRef.current.push(t1, t2, t3, t4, t5, t6, t7);
  };

  const skipTrackingDemo = () => {
    demoTimeoutsRef.current.forEach(t => clearTimeout(t));
    demoTimeoutsRef.current = [];
    setTrackingShowVideoOverlay(false);
    setTrackingDemoPlaying(false);
    setTrackingDemoStep('done');
    setTrackingModuleSubView('matrix');
  };

  // Auto-reset video simulations whenever the user switches away and returns
  useEffect(() => {
    demoTimeoutsRef.current.forEach(t => clearTimeout(t));
    demoTimeoutsRef.current = [];
    galleryDemoTimeoutsRef.current.forEach(t => clearTimeout(t));
    galleryDemoTimeoutsRef.current = [];

    if (activeModuleTab === 'tracking' || activeModuleTab === 'observation') {
      setTrackingShowVideoOverlay(true);
      setTrackingDemoPlaying(false);
      setTrackingDemoStep('idle');
      setTrackingModuleSubView('matrix');
      setTrackingLiveTypedText('');
      setTrackingSimRecordingSec(0);
      setTrackingJustRegisteredFlash(false);
      setTrackingSimCursor({ xPercent: 50, yPercent: 50, isClicking: false });
    } else if (activeModuleTab === 'gallery') {
      setGalleryShowVideoOverlay(true);
      setGalleryDemoPlaying(false);
      setGalleryDemoStep('idle');
      setGalleryUploadProgress(0);
      setGalleryLiveTypedNarrative('');
      setGalleryFaceBlurred(false);
      setGalleryLegalConsentApproved(true);
      setGalleryJustSavedFlash(false);
      setGallerySelectedChild('mateo');
      setGallerySimCursor({ xPercent: 50, yPercent: 50, isClicking: false });
    } else {
      setTrackingDemoPlaying(false);
      setTrackingShowVideoOverlay(true);
      setGalleryDemoPlaying(false);
      setGalleryShowVideoOverlay(true);
    }

    return () => {
      demoTimeoutsRef.current.forEach(t => clearTimeout(t));
      galleryDemoTimeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, [activeModuleTab]);
  const moduleTabsRef = useRef<HTMLDivElement>(null);

    const scrollAiCarousel = (direction: 'left' | 'right') => {
    if (aiCarouselRef.current) {
      const scrollAmount = aiCarouselRef.current.clientWidth * (window.innerWidth < 640 ? 0.9 : window.innerWidth < 1024 ? 0.5 : 0.33);
      aiCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollModuleTabs = (direction: 'left' | 'right') => {
    if (moduleTabsRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      moduleTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Pro Form Builder Simulator State
  const [formPresentationMode, setFormPresentationMode] = useState<'wizard' | 'fluid' | 'smart_fields'>('smart_fields');
  const [curpVerificationState, setCurpVerificationState] = useState<'idle' | 'loading' | 'verified'>('verified');
  const [kycVerificationState, setKycVerificationState] = useState<'idle' | 'scanning' | 'verified'>('verified');
  const [formWizardStep, setFormWizardStep] = useState<number>(2);

  // Smart Gallery Simulator State (Auto Montessori AI Narrative + Face Blur Guardrails based on parental consent)
  const [galleryConsentEnabled, setGalleryConsentEnabled] = useState<boolean>(false);
  const [gallerySelectedChild, setGallerySelectedChild] = useState<'santiago' | 'elena' | 'mateo'>('mateo');
  const [galleryShowVideoOverlay, setGalleryShowVideoOverlay] = useState<boolean>(true);
  const [galleryDemoPlaying, setGalleryDemoPlaying] = useState<boolean>(false);
  const [galleryDemoStep, setGalleryDemoStep] = useState<'idle' | 'cursor_to_upload' | 'uploading' | 'ai_scanning' | 'checking_consent' | 'applying_blur' | 'cursor_to_save' | 'registered_success' | 'done'>('idle');
  const [gallerySimCursor, setGallerySimCursor] = useState<{ xPercent: number; yPercent: number; isClicking: boolean }>({ xPercent: 50, yPercent: 50, isClicking: false });
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<number>(0);
  const [galleryLiveTypedNarrative, setGalleryLiveTypedNarrative] = useState<string>('');
  const [galleryFaceBlurred, setGalleryFaceBlurred] = useState<boolean>(false);
  const [galleryLegalConsentApproved, setGalleryLegalConsentApproved] = useState<boolean>(true);
  const [galleryJustSavedFlash, setGalleryJustSavedFlash] = useState<boolean>(false);
  const galleryDemoTimeoutsRef = useRef<any[]>([]);

  const startGalleryVideoDemo = () => {
    galleryDemoTimeoutsRef.current.forEach(t => clearTimeout(t));
    galleryDemoTimeoutsRef.current = [];

    setGalleryShowVideoOverlay(false);
    setGalleryDemoPlaying(true);
    setGalleryDemoStep('cursor_to_upload');
    setGalleryUploadProgress(0);
    setGalleryLiveTypedNarrative('');
    setGalleryFaceBlurred(false);
    setGalleryLegalConsentApproved(true);
    setGalleryJustSavedFlash(false);
    setGallerySimCursor({ xPercent: 42, yPercent: 18, isClicking: false });

    // Step 1: Cursor smoothly moves directly onto 'Seleccionar Fotografia' button (x: 50%, y: 38%)
    const t1 = setTimeout(() => {
      setGallerySimCursor({ xPercent: 50, yPercent: 62, isClicking: false });
    }, 100);

    // Step 2: Cursor clicks 'Seleccionar Fotografia' button
    const t2 = setTimeout(() => {
      setGallerySimCursor({ xPercent: 50, yPercent: 62, isClicking: true });
    }, 1100);

    // Step 3: Dashed box transforms into upload progress bar (0% -> 100%)
    const t3 = setTimeout(() => {
      setGallerySimCursor({ xPercent: 50, yPercent: 62, isClicking: false });
      setGalleryDemoStep('uploading');

      let prog = 0;
      const progInterval = setInterval(() => {
        prog += 25;
        if (prog <= 100) {
          setGalleryUploadProgress(prog);
        } else {
          clearInterval(progInterval);
        }
      }, 70);
      galleryDemoTimeoutsRef.current.push(progInterval);
    }, 1500);

    // Step 4: Progress reaches 100% -> Full width photo reveals -> AI scanning & full width caption starts
    const t4 = setTimeout(() => {
      setGalleryDemoStep('ai_scanning');
      const currentMod = MODULES_SHOWCASE_I18N[lang] || MODULES_SHOWCASE_I18N.es;
      const fullNarrative = currentMod.gallery.narrative.text;
      let charIdx = 0;
      const typeInterval = setInterval(() => {
        charIdx += 3;
        if (charIdx <= fullNarrative.length) {
          setGalleryLiveTypedNarrative(fullNarrative.slice(0, charIdx));
        } else {
          setGalleryLiveTypedNarrative(fullNarrative);
          clearInterval(typeInterval);
        }
      }, 25);
      galleryDemoTimeoutsRef.current.push(typeInterval);
    }, 2500);

    // Step 5: Biometric check completes -> switches image to blurred version & reveals bottom avatars
    const t5 = setTimeout(() => {
      setGalleryDemoStep('applying_blur');
      setGalleryFaceBlurred(true);
      setGalleryLegalConsentApproved(false);
      setGallerySimCursor({ xPercent: 12, yPercent: 92, isClicking: false });
    }, 4800);

    // Step 6: Cursor moves to save/publish confirmation button (x: 88%, y: 92%)
    const t6 = setTimeout(() => {
      setGalleryDemoStep('cursor_to_save');
      setGallerySimCursor({ xPercent: 88, yPercent: 92, isClicking: false });
    }, 6000);

    // Step 7: Cursor clicks save/publish
    const t7 = setTimeout(() => {
      setGallerySimCursor({ xPercent: 88, yPercent: 92, isClicking: true });
    }, 6800);

    // Step 8: Registration flash & success feedback
    const t8 = setTimeout(() => {
      setGallerySimCursor({ xPercent: 88, yPercent: 92, isClicking: false });
      setGalleryDemoStep('registered_success');
      setGalleryJustSavedFlash(true);
    }, 7300);

    // Step 9: Done - return 100% interactive control to user
    const t9 = setTimeout(() => {
      setGalleryDemoPlaying(false);
      setGalleryDemoStep('done');
    }, 8400);

    galleryDemoTimeoutsRef.current.push(t1, t2, t3, t4, t5, t6, t7, t8, t9);
  };

  const skipGalleryDemo = () => {
    galleryDemoTimeoutsRef.current.forEach(t => clearTimeout(t));
    galleryDemoTimeoutsRef.current = [];
    setGalleryShowVideoOverlay(false);
    setGalleryDemoPlaying(false);
    setGalleryDemoStep('done');
  };

  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const modI18n = MODULES_SHOWCASE_I18N[lang] || MODULES_SHOWCASE_I18N.es;

  const SEO_BY_LANG: Record<Language, {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    locale: string;
    keywords: string;
  }> = {
    es: {
      title: 'Montessori Nexus | El Sistema Operativo para Colegios Montessori Auténticos',
      description: 'Software escolar y pedagógico para comunidades Montessori. Registro de tres tiempos, seguimiento visual de materiales, control de asistencias, portal de admisiones y suite de IA ética.',
      ogTitle: 'Montessori Nexus | El Sistema Operativo para Colegios Montessori Auténticos',
      ogDescription: 'Software escolar y pedagógico para comunidades Montessori. Registro de tres tiempos, seguimiento visual de materiales, admisiones y suite de IA ética.',
      ogImage: '/images/og-montessorinexus-es.png',
      locale: 'es_ES',
      keywords: 'montessori, software montessori, colegio montessori, sistema escolar montessori, registro tres tiempos montessori, seguimiento de materiales, portal de admisiones montessori, inteligencia artificial etica montessori',
    },
    en: {
      title: 'Montessori Nexus | The Operating System for Authentic Montessori Schools',
      description: 'Comprehensive pedagogical and operational software for Montessori schools. Three-period lesson tracking, visual material progression, attendance radar, admissions portal and ethical AI suite.',
      ogTitle: 'Montessori Nexus | The Operating System for Authentic Montessori Schools',
      ogDescription: 'Comprehensive pedagogical software for Montessori communities. Three-period lesson tracking, visual material progression, admissions and ethical AI suite.',
      ogImage: '/images/og-montessorinexus-en.png',
      locale: 'en_US',
      keywords: 'montessori software, montessori school system, authentic montessori software, three period lesson tracking, montessori materials tracker, school admissions portal, ethical montessori ai',
    },
    pt: {
      title: 'Montessori Nexus | O Sistema Operacional para Escolas Montessori Autênticas',
      description: 'Software escolar e pedagógico completo para comunidades Montessori. Registro de três tempos, acompanhamento visual de materiais, frequência, portal de matrículas e suíte de IA ética.',
      ogTitle: 'Montessori Nexus | O Sistema Operacional para Escolas Montessori Autênticas',
      ogDescription: 'Software escolar e pedagógico para comunidades Montessori. Registro em três tempos, acompanhamento de materiais, matrículas e suíte de IA ética.',
      ogImage: '/images/og-montessorinexus-pt.png',
      locale: 'pt_BR',
      keywords: 'software montessori, escola montessori, lição em tres tempos montessori, acompanhamento de materiais, gestão escolar montessori, portal de matriculas, ia etica montessori',
    },
    it: {
      title: 'Montessori Nexus | Il Sistema Operativo per Scuole Montessori Autentiche',
      description: 'Software scolastico e pedagogico per comunità Montessori. Lezioni in tre tempi, tracciamento visuale dei materiali, registro presenze, portale iscrizioni e suite di IA etica.',
      ogTitle: 'Montessori Nexus | Il Sistema Operativo per Scuole Montessori Autentiche',
      ogDescription: 'Software scolastico e pedagogico per comunità Montessori. Lezioni in tre tempi, tracciamento materiali, portale iscrizioni e suite di IA etica.',
      ogImage: '/images/og-montessorinexus-it.png',
      locale: 'it_IT',
      keywords: 'software montessori, scuola montessori, lezione in tre tempi, tracciamento materiali montessori, registro presenze montessori, portale iscrizioni, ia etica montessori',
    },
    fr: {
      title: 'Montessori Nexus | Le Système d’Exploitation pour Écoles Montessori Authentiques',
      description: 'Logiciel scolaire et pédagogique pour communautés Montessori. Présentations en trois temps, suivi visuel du matériel, registre des présences, portail d’admissions et suite d’IA éthique.',
      ogTitle: 'Montessori Nexus | Le Système d’Exploitation pour Écoles Montessori Authentiques',
      ogDescription: 'Logiciel pédagogique pour communautés Montessori. Leçons en trois temps, suivi du matériel, admissions et suite d’IA éthique.',
      ogImage: '/images/og-montessorinexus-fr.png',
      locale: 'fr_FR',
      keywords: 'logiciel montessori, ecole montessori, lecon en trois temps, suivi materiel montessori, admissions scolaires montessori, ia ethique montessori',
    },
  };

  useEffect(() => {
    localStorage.setItem('montessori_nexus_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('montessori_nexus_lang', lang);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('lang') !== lang) {
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.toString());
      }
    }

    if (typeof document !== 'undefined') {
      const seo = SEO_BY_LANG[lang] || SEO_BY_LANG.en;
      document.title = seo.title;
      document.documentElement.lang = lang;

      const setMeta = (attr: string, key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      const setLink = (rel: string, href: string, type?: string, sizes?: string) => {
        let el = document.querySelector(`link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`) as HTMLLinkElement | null;
        if (!el) {
          el = document.createElement('link');
          el.setAttribute('rel', rel);
          if (sizes) el.setAttribute('sizes', sizes);
          document.head.appendChild(el);
        }
        el.setAttribute('href', href);
        if (type) el.setAttribute('type', type);
      };

      // Set Favicons
      setLink('icon', '/favicon.svg', 'image/svg+xml');
      setLink('icon', '/favicon-32x32.png', 'image/png', '32x32');
      setLink('icon', '/favicon-16x16.png', 'image/png', '16x16');
      setLink('apple-touch-icon', '/apple-touch-icon.png', 'image/png', '180x180');

      // Meta Description & Keywords
      setMeta('name', 'description', seo.description);
      setMeta('name', 'keywords', seo.keywords);
      setMeta('name', 'theme-color', '#C4661F');

      // OpenGraph
      const origin = window.location.origin;
      const ogFullUrl = `${origin}${seo.ogImage}`;
      setMeta('property', 'og:title', seo.ogTitle);
      setMeta('property', 'og:description', seo.ogDescription);
      setMeta('property', 'og:image', ogFullUrl);
      setMeta('property', 'og:image:width', '1200');
      setMeta('property', 'og:image:height', '630');
      setMeta('property', 'og:locale', seo.locale);
      setMeta('property', 'og:type', 'website');
      setMeta('property', 'og:site_name', 'Montessori Nexus');
      setMeta('property', 'og:url', window.location.href);

      // Twitter Cards
      setMeta('name', 'twitter:card', 'summary_large_image');
      setMeta('name', 'twitter:title', seo.ogTitle);
      setMeta('name', 'twitter:description', seo.ogDescription);
      setMeta('name', 'twitter:image', ogFullUrl);

      // JSON-LD Structured Data
      let script = document.getElementById('montessori-nexus-jsonld') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'montessori-nexus-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            'name': 'Montessori Nexus',
            'operatingSystem': 'Cloud / Web / iOS / Android',
            'applicationCategory': 'EducationalApplication',
            'description': seo.description,
            'image': ogFullUrl,
            'offers': {
              '@type': 'Offer',
              'price': '49',
              'priceCurrency': 'USD',
              'priceValidUntil': '2027-12-31'
            },
            'aggregateRating': {
              '@type': 'AggregateRating',
              'ratingValue': '4.98',
              'ratingCount': '142',
              'bestRating': '5',
              'worstRating': '1'
            }
          },
          {
            '@type': 'Organization',
            'name': 'Montessori Nexus',
            'url': origin,
            'logo': `${origin}/images/montessori-nexus-logo-circle.png`,
            'sameAs': [
              'https://instagram.com/montessorinexus',
              'https://twitter.com/montessorinexus'
            ]
          }
        ]
      });
    }
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
      className={`min-h-screen font-sans transition-colors duration-300 ${isDark
          ? 'bg-[#0e1710] text-[#f1f5f9] selection:bg-[#C4661F]/40 selection:text-white'
          : 'bg-[#FEFAE0] text-[#162218] selection:bg-[#C4661F]/20 selection:text-[#C4661F]'
        }`}
    >
      {/* ========================================================================= */}
      {/* INITIAL TOP HEADER */}
      {/* ========================================================================= */}
      <header className={`w-full py-3.5 sm:py-5 border-b transition-colors ${isDark ? 'bg-[#0e1710]/90 border-slate-800' : 'bg-[#FEFAE0] border-stone-200/60'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0 group">
            <MontessoriNexusLogo size={44} className="group-hover:scale-105 transition-transform duration-200" />
            <div className="flex flex-col">
              <span className={`text-xl font-serif font-black tracking-tight flex items-center gap-1 leading-none ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                Montessori<span className="text-[#C4661F] font-sans font-bold">Nexus</span>
              </span>
              <span className={`text-[10px] font-sans font-bold tracking-widest uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                School OS
              </span>
            </div>
          </a>

          {/* Navigation Links (Desktop) */}
          <nav className={`hidden lg:flex items-center gap-6 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
            <a href="#modulos" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.modules}
            </a>
            <a href="#ia-etica" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.aiSuite}
            </a>
            <a href="/blog" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.blog || 'Blog'}
            </a>
            <a href="#precios" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.pricing}
            </a>
            <a href="#faq" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-[#162218]'}`}>
              {t.nav.faq}
            </a>
          </nav>

          {/* Action & Toggle Controls (Desktop) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {/* Custom Language Dropdown Choice */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-label="Language selector"
                aria-expanded={langMenuOpen}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-xs ${isDark
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
                    className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-xl border p-1.5 z-50 ${isDark ? 'bg-[#162218] border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900 shadow-stone-300/50'
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${lang === item.code
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
              className={`h-10 w-10 rounded-xl text-xs transition-all border flex items-center justify-center cursor-pointer shadow-xs ${isDark
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
              className={`h-10 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all border shrink-0 flex items-center justify-center shadow-xs ${isDark
                  ? 'text-slate-200 hover:bg-slate-800 border-slate-700'
                  : 'text-[#162218] hover:bg-stone-200/60 border-stone-300/80'
                }`}
            >
              {t.nav.login}
            </a>
          </div>

          {/* Mobile Right Controls: Hamburger Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              className={`h-10 px-3 rounded-xl border flex items-center gap-2 cursor-pointer shadow-xs transition-colors ${isDark
                  ? 'bg-slate-800/90 text-white border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                }`}
            >
              <LanguageFlag code={lang} className="w-4 h-3 rounded-[2px] shrink-0 shadow-xs" />
              <span className="font-sans uppercase font-black text-xs">{LANGUAGES.find(l => l.code === lang)?.codeShort}</span>
              <Menu className="w-5 h-5 ml-1 text-stone-500 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-In Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed top-0 right-0 bottom-0 w-[320px] max-w-[85vw] z-50 lg:hidden shadow-2xl p-6 flex flex-col justify-between overflow-y-auto ${isDark ? 'bg-[#121c13] text-white border-l border-slate-800' : 'bg-[#FEFAE0] text-stone-900 border-l border-stone-200'
                }`}
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <MontessoriNexusLogo size={32} />
                    <span className="text-base font-serif font-black">
                      Montessori<span className="text-[#C4661F]">Nexus</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Cerrar menú"
                    className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Links */}
                <nav className="flex flex-col space-y-1 font-serif font-bold text-base">
                  <a
                    href="#modulos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {t.nav.modules}
                  </a>
                  <a
                    href="#ia-etica"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {t.nav.aiSuite}
                  </a>
                  <a
                    href="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {t.nav.blog || 'Blog'}
                  </a>
                  <a
                    href="#precios"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {t.nav.pricing}
                  </a>
                  <a
                    href="#faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {t.nav.faq}
                  </a>
                </nav>

                {/* Language Switcher inside Drawer */}
                <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                    {lang === 'en' ? 'Language / Idioma' : lang === 'es' ? 'Idioma / Language' : lang === 'pt' ? 'Idioma' : lang === 'it' ? 'Lingua' : 'Langue'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-stone-200/50 dark:bg-slate-800/80 border border-stone-300/60 dark:border-slate-700">
                    {LANGUAGES.map((item) => {
                      const isSelected = lang === item.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setLang(item.code);
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${isSelected
                              ? 'bg-[#C4661F] text-white shadow-xs'
                              : 'text-stone-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
                            }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <LanguageFlag code={item.code} className="w-4 h-3 rounded-[2px] shrink-0 shadow-xs" />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="space-y-3 pt-6 border-t border-stone-200 dark:border-slate-800">
                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-white border-stone-300 text-stone-700'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-amber-300" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    {isDark ? 'Modo Oscuro' : 'Modo Claro'}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 uppercase">Cambiar</span>
                </button>

                {/* School Login Button */}
                <a
                  href="/admin"
                  className="w-full py-3 px-4 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-center font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  {t.nav.login}
                </a>

                {/* Request Demo Button */}
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setDemoModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#C4661F] hover:bg-[#783D19] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 text-center"
                >
                  <span>{t.hero.primaryCta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              {/* Logo + Stacked Brand Name */}
              <a
                href="/"
                className="flex items-center gap-3.5 hover:scale-[1.02] transition-transform shrink-0"
                title="MontessoriNexus"
              >
                <MontessoriNexusLogo size={32} />
                <div className="flex flex-col text-left space-y-0.5">
                  <span className="text-[13px] sm:text-sm font-serif font-bold text-white tracking-tight leading-none">
                    Montessori
                  </span>
                  <span className="text-[10.5px] sm:text-[11px] font-serif font-bold text-[#FFA05C] tracking-wider leading-none">
                    Nexus
                  </span>
                </div>
              </a>

              {/* Compact Menu */}
              <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
                <a href="#modulos" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.modules}
                </a>
                <a href="#ia-etica" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.aiSuite}
                </a>
                <a href="/blog" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.blog || 'Blog'}
                </a>
                <a href="#precios" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.pricing}
                </a>
                <a href="#faq" className="hover:text-[#C4661F] transition-colors">
                  {t.nav.faq}
                </a>
              </nav>

              {/* Desktop Controls */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
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
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${lang === item.code
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

              {/* Mobile Floating Header Controls (Logo on left, Login + Hamburger on right) */}
              <div className="flex md:hidden items-center gap-2 shrink-0">
                <a
                  href="/admin"
                  className="h-8 px-3 text-xs font-bold rounded-full bg-[#C4661F] hover:bg-[#783D19] text-white transition-all shadow-xs flex items-center justify-center shrink-0"
                >
                  {t.nav.login}
                </a>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Abrir menú"
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer"
                >
                  <Menu className="w-4 h-4" />
                </button>
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
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isDark
                  ? 'bg-[#C4661F]/20 border border-[#C4661F]/40 text-[#C4661F]'
                  : 'bg-[#C4661F]/10 border border-[#C4661F]/20 text-[#C4661F]'
                }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t.hero.badge}</span>
            </motion.div>

            {/* High-Impact Hero Headline with Cursive Accent Word and Glowing Aura */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-4xl sm:text-6xl lg:text-7xl font-sans font-black tracking-tight leading-[1.12] sm:leading-[1.08] ${isDark ? 'text-white' : 'text-[#162218]'
                }`}
            >
              <span className={`block font-black tracking-tight ${isDark
                  ? 'bg-gradient-to-r from-[#E07A2B] via-emerald-200 to-white bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-[#C4661F] via-[#2A442E] to-[#162218] bg-clip-text text-transparent'
                }`}>
                {t.hero.titlePrefix}
              </span>
              <span className="block mt-2 sm:mt-3">
                <span className="relative inline-block mr-3 sm:mr-4.5 -rotate-6 sm:-rotate-[7deg] origin-bottom-left select-none">
                  {/* Glowing ambient aura behind the script word */}
                  <span className="absolute -inset-2 sm:-inset-2.5 rounded-2xl bg-[#C4661F]/25 dark:bg-[#C4661F]/40 blur-md sm:blur-lg -z-10 pointer-events-none" />
                  <span
                    style={{ fontFamily: "'Dancing Script', 'Caveat', cursive" }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-bold text-[#C4661F] dark:text-[#E07A2B] drop-shadow-[0_2px_14px_rgba(196,102,31,0.45)] tracking-wide"
                  >
                    {t.hero.titleScriptWord}
                  </span>
                </span>
                <span className={`font-black tracking-tight ${isDark
                    ? 'bg-gradient-to-r from-white via-emerald-200 to-[#E07A2B] bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-[#162218] via-[#2A442E] to-[#C4661F] bg-clip-text text-transparent'
                  }`}>
                  {t.hero.titleSuffix}
                </span>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-base sm:text-xl font-sans max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-600'
                }`}
            >
              {t.hero.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 w-full"
            >
              <Button
                onClick={() => setDemoModalOpen(true)}
                size="lg"
                className="w-full sm:w-auto bg-[#C4661F] hover:bg-[#783D19] text-white font-bold text-sm sm:text-base px-6 sm:px-9 py-4 sm:py-6 rounded-2xl shadow-md shadow-[#C4661F]/25 hover:scale-[1.02] transition-all flex items-center justify-center text-center"
              >
                <span>{t.hero.ctaBtn}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 shrink-0" />
              </Button>
            </motion.div>

            {/* Reassurance pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-medium text-center ${isDark ? 'text-slate-400' : 'text-stone-500'
                }`}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C4661F] shrink-0" /> {t.hero.pill1}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C4661F] shrink-0" /> {t.hero.pill2}
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#C4661F] shrink-0" /> {t.hero.pill3}
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
              className={`w-full rounded-3xl p-2 sm:p-4 border shadow-2xl transition-shadow ${isDark ? 'bg-[#0f1711] border-slate-700/80 shadow-black/80' : 'bg-white/95 backdrop-blur-md border-stone-300 shadow-stone-900/15'
                }`}
            >
              <div className={`rounded-2xl border overflow-hidden text-left flex flex-col ${isDark ? 'bg-[#0a100c] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                }`}>
                {/* Top Browser Bar & School Status */}
                <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2 ${isDark ? 'bg-[#060c07] border-slate-800 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400/90" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/90" />
                    <span className={`text-xs font-mono ml-2 font-medium px-2.5 py-0.5 rounded-md ${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-white text-stone-600 border border-stone-200/80'
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
                  <aside className={`w-full md:w-52 p-3 border-b md:border-b-0 md:border-r flex flex-row md:flex-col justify-between shrink-0 ${isDark ? 'bg-[#080e0a] border-slate-800' : 'bg-[#F5F2EC] border-stone-200'
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
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer shrink-0 md:shrink ${heroMockupTab === 'live'
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
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer shrink-0 md:shrink ${heroMockupTab === 'areas'
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
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer shrink-0 md:shrink ${heroMockupTab === 'family'
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
                                <div className={`p-4 rounded-2xl border space-y-2.5 transition-all shadow-xs ${isDark ? 'bg-[#121c13] border-slate-700 hover:border-[#C4661F]/50' : 'bg-white border-stone-200 hover:border-[#C4661F]/40'
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
                                <div className={`p-4 rounded-2xl border space-y-2.5 transition-all shadow-xs ${isDark ? 'bg-[#121c13] border-slate-700 hover:border-emerald-500/50' : 'bg-white border-stone-200 hover:border-emerald-500/40'
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
                                <div className={`p-4 rounded-2xl border space-y-2.5 transition-all shadow-xs ${isDark ? 'bg-[#121c13] border-slate-700 hover:border-teal-500/50' : 'bg-white border-stone-200 hover:border-teal-500/40'
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
                                  <span className="text-[#C4661F] font-bold">10:15 (Gran Trabajo)</span>
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
                                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed italic ${isDark ? 'bg-[#0a120c] border-slate-800 text-slate-300' : 'bg-[#FAF8F5] border-stone-200 text-stone-700'
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
      {/* ========================================================================= */}
      {/* 5. COMPACT ETHICAL AI SUITE CAROUSEL (3 in Desktop, 1 in Mobile) */}
      {/* ========================================================================= */}
      <section id="ia-etica" className="py-16 sm:py-20 bg-[#0c140d] text-white border-y border-slate-800 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-[#C4661F]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header & Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
            <div className="max-w-2xl space-y-2.5 text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/15 px-3.5 py-1 rounded-full border border-[#C4661F]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#C4661F]" />
                {t.aiSuite.badge}
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                {t.aiSuite.title}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                {t.aiSuite.subtitle}
              </p>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2 self-start md:self-end shrink-0">
              <button
                type="button"
                onClick={() => scrollAiCarousel('left')}
                aria-label="Anterior elemento de IA"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-[#C4661F] hover:border-[#C4661F] transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollAiCarousel('right')}
                aria-label="Siguiente elemento de IA"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-[#C4661F] hover:border-[#C4661F] transition-all cursor-pointer shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CAROUSEL TRACK: 1 Card in Mobile, 2 in Tablet, 3 in Desktop */}
          <div
            ref={aiCarouselRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-4 text-left"
          >
            {/* Card 1: Consent-Aware Face Privacy & Watermarking */}
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start rounded-2xl sm:rounded-3xl bg-[#152117] border border-slate-700/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#C4661F]/50 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {t.aiSuite.cards[0].tag}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug">
                  {t.aiSuite.cards[0].title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                  {t.aiSuite.cards[0].desc}
                </p>
              </div>

              {/* Compact Visual Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-[#081009] border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    Difuminado Circular GDPR
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Auto-Protegido
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-700/80 text-[11px] font-semibold flex items-center gap-2 bg-[#081009] text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{t.aiSuite.cards[0].highlight}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Voice Dictation & Real-Time AI Structuring */}
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start rounded-2xl sm:rounded-3xl bg-[#152117] border border-slate-700/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#C4661F]/50 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold">
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {t.aiSuite.cards[1].tag}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug">
                  {lang === 'en' ? 'Voice Dictation & Real-Time Matrix Sync' : lang === 'es' ? 'Dictado por Voz & Sincronización en Matriz' : lang === 'pt' ? 'Ditado por Voz & Sincronização na Matriz' : 'Dictée Vocale & Synchronisation Matrice'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                  {t.aiSuite.cards[1].desc}
                </p>
              </div>

              {/* Compact Visual Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-[#081009] border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C4661F]" />
                    3 Tiempos de Séguin
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Voz a Matriz
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-700/80 text-[11px] font-semibold flex items-center gap-2 bg-[#081009] text-amber-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C4661F] shrink-0" />
                  <span className="truncate">{t.aiSuite.cards[1].highlight}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Pedagogical SWOT Matrix & Presentation Suggestions */}
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start rounded-2xl sm:rounded-3xl bg-[#152117] border border-slate-700/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#C4661F]/50 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold">
                    <Brain className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {t.aiSuite.cards[2].tag}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug">
                  {t.aiSuite.cards[2].title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                  {t.aiSuite.cards[2].desc}
                </p>
              </div>

              {/* Compact Visual Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-[#081009] border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    Currículo AMI
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    Diagnóstico
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-700/80 text-[11px] font-semibold flex items-center gap-2 bg-[#081009] text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{t.aiSuite.cards[2].highlight}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Sensitive Periods & Transition Milestones */}
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start rounded-2xl sm:rounded-3xl bg-[#152117] border border-slate-700/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#C4661F]/50 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    {t.aiSuite.cards[3].tag}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug">
                  {t.aiSuite.cards[3].title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                  {t.aiSuite.cards[3].desc}
                </p>
              </div>

              {/* Compact Visual Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-[#081009] border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-violet-400" />
                    Hitos de Madurez
                  </span>
                  <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                    Ventana Activa
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-700/80 text-[11px] font-semibold flex items-center gap-2 bg-[#081009] text-violet-300">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="truncate">{t.aiSuite.cards[3].highlight}</span>
                </div>
              </div>
            </div>

            {/* Card 5: BYOK Self-Custody API Keys */}
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start rounded-2xl sm:rounded-3xl bg-[#152117] border border-slate-700/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#C4661F]/50 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#C4661F]/20 text-[#C4661F] flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {lang === 'en' ? 'Self-Custody BYOK' : lang === 'es' ? 'Claves Propias BYOK' : lang === 'pt' ? 'Chaves Próprias BYOK' : 'Clés Privées BYOK'}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug">
                  {lang === 'en' ? 'Direct API Key Custody & Zero Markups' : lang === 'es' ? 'Custodia de Claves Propias & Cero Margen' : lang === 'pt' ? 'Custódia de Chaves Próprias & Sem Sobretaxas' : 'Contrôle des Clés API & Zéro Marge'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                  {lang === 'en' ? 'Connect your OpenAI (GPT-4o), Anthropic (Claude 3.5), or Google Gemini key directly with AES-256 encryption. Pay direct provider token prices without hidden markups.' : lang === 'es' ? 'Conecta tu clave de OpenAI (GPT-4o), Anthropic (Claude 3.5) o Google Gemini con cifrado AES-256. Paga tarifas directas de proveedor sin recargos por inferencia.' : lang === 'pt' ? 'Conecte sua chave da OpenAI (GPT-4o), Anthropic (Claude 3.5) ou Google Gemini com criptografia AES-256 direta sem margens ocultas.' : 'Connectez votre clé OpenAI, Claude ou Gemini avec chiffrement AES-256 sans surcoût.'}
                </p>
              </div>

              {/* Compact Visual Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-[#081009] border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    Cifrado AES-256
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                    OpenAI · Claude · Gemini
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-700/80 text-[11px] font-semibold flex items-center gap-2 bg-[#081009] text-rose-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{lang === 'en' ? 'Complete data independence' : lang === 'es' ? 'Independencia total de tus datos' : lang === 'pt' ? 'Independência total de dados' : 'Indépendance totale des données'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. EXPANDED MODULES ECOSYSTEM (INTERACTIVE TABBED SHOWCASE) */}
      {/* ========================================================================= */}
      <section id="modulos" className={`py-24 border-b ${isDark ? 'bg-[#0e1710] border-slate-800' : 'bg-[#FEFAE0] border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
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

          {/* MOBILE ONLY: Horizontal Scrolling Tabs Bar with Scroll Handlers */}
          <div className="block lg:hidden relative mb-8">
            {/* Left Scroll Handler Button */}
            <button
              type="button"
              onClick={() => scrollModuleTabs('left')}
              aria-label="Desplazar pestañas hacia la izquierda"
              className={`absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center border shadow-md backdrop-blur-md transition-all cursor-pointer ${isDark
                  ? 'bg-[#162218]/90 border-slate-700 text-slate-200 hover:bg-[#C4661F] hover:text-white hover:border-[#C4661F]'
                  : 'bg-white/95 border-stone-300 text-stone-700 hover:bg-[#C4661F] hover:text-white hover:border-[#C4661F]'
                }`}
            >
              <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>

            {/* Scrollable Tabs Track */}
            <div
              ref={moduleTabsRef}
              className="px-7 sm:px-9 overflow-x-auto no-scrollbar scroll-smooth"
            >
              <div className="flex items-center gap-2 min-w-max pb-2">
                {modI18n.tabs.map((tab: any) => {
                  const iconMap: Record<string, any> = { tracking: Compass, forms: FileSpreadsheet, gallery: Sparkles, webbuilder: Globe, finances: CreditCard, pipelines: Workflow, calendar: Calendar, family: Users, staff: Layers };
                  const Icon = iconMap[tab.id] || tab.icon || Compass;
                  const isSelected = activeModuleTab === tab.id || (tab.id === 'tracking' && activeModuleTab === 'observation');
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveModuleTab(tab.id)}
                      className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${isSelected
                          ? 'bg-[#C4661F] text-white border-[#C4661F] shadow-lg shadow-[#C4661F]/20'
                          : isDark
                            ? 'bg-[#162218] text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100 hover:text-stone-950 shadow-3xs'
                        }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#C4661F]'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Scroll Handler Button */}
            <button
              type="button"
              onClick={() => scrollModuleTabs('right')}
              aria-label="Desplazar pestañas hacia la derecha"
              className={`absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center border shadow-md backdrop-blur-md transition-all cursor-pointer ${isDark
                  ? 'bg-[#162218]/90 border-slate-700 text-slate-200 hover:bg-[#C4661F] hover:text-white hover:border-[#C4661F]'
                  : 'bg-white/95 border-stone-300 text-stone-700 hover:bg-[#C4661F] hover:text-white hover:border-[#C4661F]'
                }`}
            >
              <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>

          {/* MAIN MODULES WORKSPACE: Desktop 2-Column Sidebar Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* DESKTOP ONLY: Vertical Modules Sidebar (Left 4 Columns) */}
            <div className="hidden lg:flex lg:col-span-4 flex-col gap-2.5 sticky top-28">
              {modI18n.tabs.map((tab: any) => {
                const iconMap: Record<string, any> = { tracking: Compass, forms: FileSpreadsheet, gallery: Sparkles, webbuilder: Globe, finances: CreditCard, pipelines: Workflow, calendar: Calendar, family: Users, staff: Layers };
                const Icon = iconMap[tab.id] || Compass;
                const isSelected = activeModuleTab === tab.id || (tab.id === 'tracking' && activeModuleTab === 'observation');
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModuleTab(tab.id)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer border ${isSelected
                        ? 'bg-[#C4661F] text-white border-[#C4661F] shadow-lg shadow-[#C4661F]/20 translate-x-1 font-bold'
                        : isDark
                          ? 'bg-[#162218] text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white hover:border-slate-700'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-950 hover:border-stone-300 shadow-3xs'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[#C4661F]/10 text-[#C4661F]'
                        }`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-sm block truncate">{tab.label}</span>
                        <span className={`text-[11px] block truncate font-normal ${isSelected ? 'text-white/85' : 'text-stone-400 dark:text-slate-400'}`}>
                          {tab.subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-white translate-x-0.5' : 'text-stone-300 dark:text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* DETAIL SHOWCASE CONTAINER (Desktop Right 8 Columns, Mobile Full Width) */}
            <div className={`col-span-12 lg:col-span-8 p-5 sm:p-7 lg:p-8 rounded-3xl border shadow-xl transition-all min-w-0 overflow-hidden ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300 shadow-stone-200/50'
              }`}>
              <AnimatePresence mode="wait">
                {/* TAB 1: FORMULARIOS & SMART KYC */}
                {activeModuleTab === 'forms' && (
                  <motion.div
                    key="forms"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          {modI18n.forms.badge1}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {modI18n.forms.badge2}
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {modI18n.forms.title}
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        {modI18n.forms.subtitle}
                      </p>
                    </div>

                    {/* Full-Width Interactive Form Simulator */}
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all duration-500 ${galleryJustSavedFlash ? 'ring-2 ring-emerald-500/90 shadow-[0_0_30px_rgba(16,185,129,0.3)] border-emerald-500/60 ' : ''}${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'
                      }`}>
                      {/* Mode Selector Tabs */}
                      <div className={`p-1 rounded-xl border grid grid-cols-3 gap-1 text-xs font-bold ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-stone-200/70 border-stone-300'
                        }`}>
                        <button
                          type="button"
                          onClick={() => setFormPresentationMode('smart_fields')}
                          className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${formPresentationMode === 'smart_fields'
                              ? 'bg-white dark:bg-[#162218] text-[#C4661F] shadow-xs font-bold'
                              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                          Campos Inteligentes
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPresentationMode('wizard')}
                          className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${formPresentationMode === 'wizard'
                              ? 'bg-white dark:bg-[#162218] text-[#C4661F] shadow-xs font-bold'
                              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                          Modo Wizard
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPresentationMode('fluid')}
                          className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${formPresentationMode === 'fluid'
                              ? 'bg-white dark:bg-[#162218] text-[#C4661F] shadow-xs font-bold'
                              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                          Modo Fluid
                        </button>
                      </div>

                      {/* Mode 1: Smart Fields */}
                      {formPresentationMode === 'smart_fields' && (
                        <div className="space-y-3.5">
                          {/* CURP Field */}
                          <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                            }`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                              <span className="font-bold flex items-center gap-1.5 text-stone-900 dark:text-white">
                                <Fingerprint className="w-4 h-4 text-[#C4661F]" />
                                {modI18n.forms.curpTitle}
                              </span>
                              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {modI18n.forms.curpStatus}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <div className={`p-2.5 rounded-xl border font-mono flex-1 ${isDark ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-stone-50 border-stone-200 text-stone-800'
                                }`}>
                                <span className="text-[10px] text-stone-400 block font-sans font-semibold">{modI18n.forms.curpInputLabel}</span>
                                <span className="font-bold text-sm tracking-wider">MOSS180512HDFRRN04</span>
                              </div>
                              <div className={`p-2.5 rounded-xl border flex-1 flex items-center justify-between ${isDark ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                }`}>
                                <div>
                                  <span className="text-[10px] block font-semibold text-emerald-600 dark:text-emerald-400">{modI18n.forms.curpVerifiedLabel}</span>
                                  <span className="font-bold text-xs">Santiago Morales Suárez • 12/05/2018</span>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                              </div>
                            </div>
                          </div>

                          {/* KYC & Biometrics Field */}
                          <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                            }`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                              <span className="font-bold flex items-center gap-1.5 text-stone-900 dark:text-white">
                                <ScanFace className="w-4 h-4 text-[#C4661F]" />
                                Prueba de Vida & Verificación KYC de Tutores
                              </span>
                              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold">
                                Facial Match: 99.4%
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className={`p-3 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-stone-50 border-stone-200 text-stone-700'
                                }`}>
                                <FileCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                                <div>
                                  <span className="font-bold block text-xs">Identificación Oficial (INE)</span>
                                  <span className="text-[11px] text-stone-400">Documento verificado y legible</span>
                                </div>
                              </div>
                              <div className={`p-3 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-stone-50 border-stone-200 text-stone-700'
                                }`}>
                                <Camera className="w-5 h-5 text-[#C4661F] shrink-0" />
                                <div>
                                  <span className="font-bold block text-xs">Selfie / Prueba de Vida</span>
                                  <span className="text-[11px] text-emerald-500 font-semibold">● Coincidencia facial aprobada</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mode 2: Wizard */}
                      {formPresentationMode === 'wizard' && (
                        <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200'
                          }`}>
                          <div className="flex items-center justify-between text-xs font-bold gap-2">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="w-3 h-3 text-emerald-400" />
                              </span>
                              <span>1. Aspirante</span>
                            </div>
                            <div className="h-0.5 flex-1 bg-[#C4661F]" />
                            <div className="flex items-center gap-1.5 text-[#C4661F]">
                              <span className="w-5 h-5 rounded-full bg-[#C4661F] text-white flex items-center justify-center text-[10px]">2</span>
                              <span>2. RENAPO & KYC</span>
                            </div>
                            <div className="h-0.5 flex-1 bg-stone-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-1.5 text-stone-400">
                              <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">3</span>
                              <span>3. Firma Digital</span>
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed pt-1">
                            El modo Wizard divide admisiones complejas en pasos digeribles, reduciendo el abandono de registro en un 42% y validando la identidad antes de almacenar.
                          </p>
                        </div>
                      )}

                      {/* Mode 3: Fluid */}
                      {formPresentationMode === 'fluid' && (
                        <div className={`p-4 rounded-xl border text-xs space-y-3 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200'
                          }`}>
                          <div className="flex items-center justify-between text-[11px] text-[#C4661F] font-bold">
                            <span>Pregunta 3 de 7 • Modo Conversacional</span>
                            <span>45% completado</span>
                          </div>
                          <p className="text-sm font-serif font-bold text-stone-900 dark:text-white">
                            ¿A qué ambiente Montessori deseas postular a tu hijo/a?
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="p-3 rounded-xl border bg-[#C4661F]/10 border-[#C4661F] font-bold text-xs text-[#C4661F] flex items-center justify-between">
                              <span>A) Casa de Niños (3-6 años)</span>
                              <Check className="w-4 h-4" />
                            </div>
                            <div className="p-3 rounded-xl border text-stone-600 dark:text-slate-400 border-stone-200 dark:border-slate-800 text-xs">
                              <span>B) Taller 1 (6-9 años)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Consulta RENAPO</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Autorrellenado sin errores de captura.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Biometría KYC</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Prueba de vida y cotejo de INE.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Sincronización Total</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Directo al expediente del alumno.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                                                                                                                {/* TAB 2: GALERÍA INTELIGENTE CON SIMULADOR VIDEO-FEEL */}
                {activeModuleTab === 'gallery' && (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          {modI18n.gallery.badge1}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {modI18n.gallery.badge2}
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {modI18n.gallery.title}
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        {modI18n.gallery.subtitle}
                      </p>
                    </div>

                    {/* Clean Header Bar & Video Demo Trigger */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-stone-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5 bg-stone-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-800">
                          <Camera className="w-3.5 h-3.5 text-[#C4661F]" />
                          <span>{modI18n.gallery.liveBadge}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={startGalleryVideoDemo}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all shadow-xs ${
                            galleryDemoPlaying
                              ? 'bg-[#C4661F] text-white border-[#C4661F] animate-pulse'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                          title="Ver demostración guiada de galería y blur"
                        >
                          {galleryDemoPlaying ? (
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current text-[#C4661F]" />
                          )}
                          <span>{galleryDemoPlaying ? modI18n.gallery.demoBtnPlaying : modI18n.gallery.demoBtn}</span>
                        </button>

                        <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          {modI18n.gallery.protectionBadge}
                        </span>
                      </div>
                    </div>

                    {/* MAIN INTERACTIVE CONTAINER WITH VIDEO OVERLAY & SIMULATED CURSOR */}
                    <div className="relative rounded-2xl overflow-hidden min-h-[400px]">
                      {/* SIMULATED MOUSE CURSOR */}
                      {galleryDemoPlaying && (
                        <motion.div
                          animate={{
                            left: `${gallerySimCursor.xPercent}%`,
                            top: `${gallerySimCursor.yPercent}%`,
                            scale: gallerySimCursor.isClicking ? 0.8 : 1
                          }}
                          transition={{
                            duration: 0.85,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className="absolute z-50 pointer-events-none -ml-3 -mt-3 drop-shadow-2xl"
                          style={{ position: 'absolute' }}
                        >
                          <div className="relative flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-[#C4661F] text-white flex items-center justify-center shadow-2xl ring-2 ring-white/90 ring-offset-1">
                              <MousePointer className="w-4 h-4 fill-white text-[#C4661F]" />
                            </div>
                            {gallerySimCursor.isClicking && (
                              <span className="absolute -inset-2 rounded-full border-2 border-[#C4661F] animate-ping opacity-90" />
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* VIDEO-FEEL TRANSLUCENT OVERLAY WITH BIG PLAY BUTTON */}
                      <AnimatePresence>
                        {galleryShowVideoOverlay && !galleryDemoPlaying && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="absolute inset-0 z-40 bg-black/55 backdrop-blur-[3px] flex flex-col items-center justify-center p-6 text-center text-white"
                          >
                            <div className="max-w-md space-y-4">
                              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-amber-300 inline-flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                {modI18n.gallery.videoOverlay.badge}
                              </span>

                              <h4 className="text-xl sm:text-2xl font-bold font-serif text-white leading-tight">
                                {modI18n.gallery.videoOverlay.title}
                              </h4>

                              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                                {modI18n.gallery.videoOverlay.desc}
                              </p>

                              {/* Large Pulsing Play Button */}
                              <div className="pt-2 flex flex-col items-center gap-3">
                                <button
                                  type="button"
                                  onClick={startGalleryVideoDemo}
                                  className="group relative flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                                  aria-label="Reproducir video demostración"
                                >
                                  <div className="absolute -inset-4 rounded-full bg-[#C4661F]/40 blur-lg group-hover:bg-[#C4661F]/60 animate-pulse transition-all" />
                                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C4661F] text-white flex items-center justify-center shadow-2xl ring-4 ring-white/30 group-hover:ring-white/50 transition-all">
                                    <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
                                  </div>
                                </button>
                                <span className="text-xs font-mono tracking-wide text-stone-300">
                                  {modI18n.gallery.videoOverlay.playCta}
                                </span>
                              </div>

                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={skipGalleryDemo}
                                  className="text-xs text-stone-400 hover:text-white underline transition-colors cursor-pointer"
                                >
                                  {modI18n.gallery.videoOverlay.skipCta}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* WORKSPACE: GALLERY SIMULATOR */}
                      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all duration-500 ${
                        galleryJustSavedFlash
                          ? 'ring-2 ring-emerald-500/90 shadow-[0_0_30px_rgba(16,185,129,0.3)] border-emerald-500/60 '
                          : ''
                      }${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'}`}>
                        {/* Success Registration Toast Banner */}
                        <AnimatePresence>
                          {galleryJustSavedFlash && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Fotografía procesada: 1 rostro central difuminado automáticamente con protección legal.</span>
                              </div>
                              <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded shrink-0">100% GDPR OK</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action Header & Upload Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-[#C4661F]" />
                              <span>Actividad en Patio: Malla Elástica / Movimiento Libre</span>
                            </span>
                          </div>

                          {/* Quick Reset / Re-upload Button */}
                          <div className="flex items-center gap-2">
                            {galleryDemoStep !== 'idle' && galleryDemoStep !== 'cursor_to_upload' && galleryDemoStep !== 'uploading' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (galleryDemoPlaying) skipGalleryDemo();
                                  setGalleryDemoStep('idle');
                                  setGalleryFaceBlurred(false);
                                  setGalleryLiveTypedNarrative('');
                                }}
                                className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-slate-900 hover:bg-stone-200 dark:hover:bg-slate-800 border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5 text-[#C4661F]" />
                                <span>Subir otra foto</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 1. FULL WIDTH PHOTO / DROPZONE CANVAS */}
                        <div className="w-full">
                          {galleryDemoStep === 'idle' || galleryDemoStep === 'cursor_to_upload' ? (
                            /* State 1: Dashed Upload / Capture Dropzone */
                            <div
                              onClick={() => {
                                if (galleryDemoPlaying) skipGalleryDemo();
                                startGalleryVideoDemo();
                              }}
                              className="w-full relative rounded-2xl border-2 border-dashed border-stone-300 dark:border-slate-700 hover:border-[#C4661F] dark:hover:border-[#C4661F] bg-stone-50/70 dark:bg-slate-900/60 p-8 sm:p-12 aspect-[16/9] sm:aspect-[21/9] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-stone-100/70 dark:hover:bg-slate-800/70 group shadow-xs"
                            >
                              <div className="w-14 h-14 rounded-2xl bg-[#C4661F]/10 dark:bg-[#C4661F]/20 border border-[#C4661F]/30 text-[#C4661F] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                                <Camera className="w-7 h-7" />
                              </div>
                              <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white mb-1">
                                {modI18n.gallery.dropzone.title}
                              </h4>
                              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-sm mb-3.5">
                                {modI18n.gallery.dropzone.desc}
                              </p>
                              <div className={`px-4 py-1.5 rounded-xl bg-[#C4661F] hover:bg-[#b05a1a] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform duration-150 ${galleryDemoStep === 'cursor_to_upload' && gallerySimCursor.isClicking ? 'scale-90 shadow-inner ring-2 ring-white/60' : ''}`}>
                                <Upload className="w-3.5 h-3.5" />
                                <span>{modI18n.gallery.dropzone.button}</span>
                              </div>
                            </div>
                          ) : galleryDemoStep === 'uploading' ? (
                            /* State 2: Upload Progress Card */
                            <div className="w-full relative rounded-2xl border border-stone-200 dark:border-slate-800 bg-stone-950 p-8 sm:p-12 aspect-[16/9] sm:aspect-[21/9] flex flex-col items-center justify-center text-center text-white shadow-md animate-in fade-in duration-200">
                              <div className="w-12 h-12 rounded-full bg-[#C4661F]/20 border border-[#C4661F]/40 text-[#C4661F] flex items-center justify-center mb-3">
                                <RotateCcw className="w-6 h-6 animate-spin" />
                              </div>
                              <h4 className="text-sm font-bold font-mono tracking-wide text-amber-300 mb-1">
                                {modI18n.gallery.uploading.title} {galleryUploadProgress}%
                              </h4>
                              <p className="text-xs text-stone-400 font-mono mb-4">
                                {modI18n.gallery.uploading.file}
                              </p>
                              <div className="w-full max-w-xs bg-stone-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-stone-700">
                                <div
                                  style={{ width: `${galleryUploadProgress}%` }}
                                  className="bg-gradient-to-r from-[#C4661F] to-emerald-400 h-full rounded-full transition-all duration-150"
                                />
                              </div>
                            </div>
                          ) : (
                            /* State 3: Full Width Photo Viewport */
                            <div className="w-full relative rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-800 bg-stone-900 shadow-md aspect-[16/9] sm:aspect-[21/9] flex items-center justify-center animate-in fade-in duration-300">
                              <img
                                src={galleryFaceBlurred ? "/images/gallery/students_trampoline_courtyard_blurred.jpg" : "/images/gallery/students_trampoline_courtyard.jpg"}
                                alt="Estudiantes en malla elástica en el patio"
                                className="w-full h-full object-cover filter brightness-95 contrast-105 transition-all duration-700"
                              />

                              {/* Gradient for badge readability (desktop only) */}
                              <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

                              {/* AI Scanning Laser Line */}
                              {galleryDemoStep === 'ai_scanning' && (
                                <motion.div
                                  initial={{ top: '0%' }}
                                  animate={{ top: ['0%', '100%', '0%'] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20"
                                />
                              )}

                              {/* Top Photo Badges (Hidden on mobile) */}
                              <div className="hidden sm:flex absolute top-3 left-3 right-3 items-center justify-between z-20">
                                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                                  <Camera className="w-3 h-3 text-[#C4661F]" />
                                  {modI18n.gallery.photoBadges.obs}
                                </span>

                                <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-md">
                                  {modI18n.gallery.photoBadges.detected}
                                </span>
                              </div>

                              {/* Status in Photo (Hidden on mobile) */}
                              <div className="hidden sm:flex absolute bottom-3 left-3 right-3 items-center justify-between flex-wrap gap-2 z-20">
                                {galleryFaceBlurred ? (
                                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-950/90 backdrop-blur-md text-amber-200 border border-amber-500/60 flex items-center gap-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    {modI18n.gallery.photoBadges.blurred}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-950/90 backdrop-blur-md text-emerald-200 border border-emerald-500/60 flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    {modI18n.gallery.photoBadges.original}
                                  </span>
                                )}

                                <span className="text-[10px] font-mono text-stone-300 bg-black/70 px-2 py-1 rounded-md border border-white/10">
                                  100% Sync
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. FULL WIDTH MONTESSORI NARRATIVE CAPTION (DIRECTLY BELOW PHOTO) */}
                        <AnimatePresence>
                          {(galleryLiveTypedNarrative || (galleryDemoStep !== 'idle' && galleryDemoStep !== 'cursor_to_upload' && galleryDemoStep !== 'uploading')) && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="w-full p-4 sm:p-5 rounded-2xl border space-y-2.5 bg-white dark:bg-[#162218] border-stone-200 dark:border-slate-800 shadow-xs"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-100 dark:border-slate-800/80 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {modI18n.gallery.narrative.header}
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold">
                                    {modI18n.gallery.narrative.model}
                                  </span>
                                </div>
                                <div className="text-[11px] text-stone-600 dark:text-slate-400">
                                  {modI18n.gallery.narrative.students}
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-slate-900/80 border border-stone-200/80 dark:border-slate-800/80">
                                <p className="text-xs sm:text-sm italic font-serif leading-relaxed text-stone-800 dark:text-slate-200 border-l-2 border-[#C4661F] pl-3 py-1">
                                  {galleryLiveTypedNarrative ? (
                                    <>
                                      <span>{galleryLiveTypedNarrative}</span>
                                      <span className="inline-block w-1.5 h-3.5 bg-[#C4661F] ml-1 animate-pulse align-middle" />
                                    </>
                                  ) : (
                                    modI18n.gallery.narrative.text
                                  )}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* 3. FULL WIDTH PRIVACY & STUDENT PROTECTION BAR */}
                        <AnimatePresence>
                          {(galleryFaceBlurred || galleryDemoStep === 'applying_blur' || galleryDemoStep === 'cursor_to_save' || galleryDemoStep === 'registered_success' || galleryDemoStep === 'done') && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="w-full p-3.5 rounded-xl border bg-stone-100 dark:bg-slate-900/90 border-stone-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap shadow-xs"
                            >
                              {/* Left: 3 Small Circular Avatars with Tooltips (no inline labels) */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase mr-1 hidden sm:inline">{lang === "en" ? "Students:" : lang === "pt" ? "Alunos:" : lang === "it" ? "Alunni:" : lang === "fr" ? "Élèves :" : "Alumnos:"}</span>
                                <div className="flex items-center gap-1.5">
                                  {/* Avatar 1: Lucas M. */}
                                  <div className="relative group" title={modI18n.gallery.privacyBar.lucasTooltip}>
                                    <img
                                      src="/images/gallery/avatar_lucas.jpg"
                                      alt="Lucas M."
                                      className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                                    />
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[7px]">
                                      <Check className="w-2 h-2 stroke-[3]" />
                                    </span>
                                  </div>

                                  {/* Avatar 2: Mateo V. (Center - Warning Border & Blurred Avatar) */}
                                  <div className="relative group" title={modI18n.gallery.privacyBar.mateoTooltip}>
                                    <img
                                      src="/images/gallery/avatar_mateo_blurred.jpg"
                                      alt="Mateo V."
                                      className="w-8 h-8 rounded-full object-cover border-2 border-amber-500 ring-2 ring-amber-400/40 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                    />
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 text-black flex items-center justify-center text-[7px] font-bold">
                                      <EyeOff className="w-2 h-2 text-black stroke-[3]" />
                                    </span>
                                  </div>

                                  {/* Avatar 3: Sofia R. */}
                                  <div className="relative group" title={modI18n.gallery.privacyBar.sofiaTooltip}>
                                    <img
                                      src="/images/gallery/avatar_sofia.jpg"
                                      alt="Sofía R."
                                      className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                                    />
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[7px]">
                                      <Check className="w-2 h-2 stroke-[3]" />
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Center: Concise Protection Summary */}
                              <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 flex-1 min-w-[240px]">
                                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="leading-snug">
                                  {modI18n.gallery.privacyBar.summary}
                                </span>
                              </div>

                              {/* Right: Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (galleryDemoPlaying) skipGalleryDemo();
                                    setGalleryFaceBlurred(prev => !prev);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-600 text-stone-800 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#C4661F]" />
                                  <span>{galleryFaceBlurred ? modI18n.gallery.privacyBar.viewOriginal : modI18n.gallery.privacyBar.viewBlurred}</span>
                                </button>

                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  {modI18n.gallery.privacyBar.safePublication}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'}`}>
                        <span className="font-bold text-stone-900 dark:text-white block">{modI18n.gallery.pillars[0].title}</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">{modI18n.gallery.pillars[0].desc}</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'}`}>
                        <span className="font-bold text-stone-900 dark:text-white block">{modI18n.gallery.pillars[1].title}</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">{modI18n.gallery.pillars[1].desc}</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'}`}>
                        <span className="font-bold text-stone-900 dark:text-white block">{modI18n.gallery.pillars[2].title}</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">{modI18n.gallery.pillars[2].desc}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                

                

                

                

                

                

                {/* TAB 3: WEB BUILDER INSTITUCIONAL */}
                {activeModuleTab === 'webbuilder' && (
                  <motion.div
                    key="webbuilder"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Web Builder Institucional
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {modI18n.webbuilder.badge2}
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {modI18n.webbuilder.title}
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        {modI18n.webbuilder.subtitle}
                      </p>
                    </div>

                    {/* Full-Width Interactive Web Builder Sandbox */}
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'
                      }`}>
                      {/* Navigation Tabs */}
                      <div className={`p-1 rounded-xl border grid grid-cols-3 gap-1 text-xs font-bold ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-stone-200/70 border-stone-300'
                        }`}>
                        <button
                          type="button"
                          onClick={() => setBuilderActiveTab('sections')}
                          className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${builderActiveTab === 'sections'
                              ? 'bg-white dark:bg-[#162218] text-[#C4661F] shadow-xs font-bold'
                              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                          Secciones Modulares
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuilderActiveTab('style')}
                          className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${builderActiveTab === 'style'
                              ? 'bg-white dark:bg-[#162218] text-[#C4661F] shadow-xs font-bold'
                              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                          Paleta & Marca
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuilderActiveTab('integrations')}
                          className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${builderActiveTab === 'integrations'
                              ? 'bg-white dark:bg-[#162218] text-[#C4661F] shadow-xs font-bold'
                              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                          Integraciones
                        </button>
                      </div>

                      {/* Content Area */}
                      {builderActiveTab === 'sections' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {builderSections.map((sec) => (
                            <div
                              key={sec.id}
                              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${sec.active
                                  ? isDark ? 'bg-[#162218] border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-800 shadow-3xs'
                                  : 'opacity-40 bg-stone-100 dark:bg-slate-900 border-dashed border-stone-300 dark:border-slate-800'
                                }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <GripVertical className="w-4 h-4 text-stone-400 shrink-0 cursor-grab" />
                                <span className="font-bold text-xs truncate">{sec.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C4661F]/10 text-[#C4661F] font-bold">
                                  {sec.badge}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleBuilderSection(sec.id)}
                                  className="p-1 text-stone-400 hover:text-[#C4661F] transition-colors cursor-pointer"
                                  title={sec.active ? 'Ocultar sección' : 'Mostrar sección'}
                                >
                                  {sec.active ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-stone-400" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {builderActiveTab === 'style' && (
                        <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200'
                          }`}>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-stone-900 dark:text-white">{modI18n.webbuilder.themeLabel}</span>
                            <span className="text-[11px] font-bold text-[#C4661F] uppercase">{activeBuilderTheme}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setActiveBuilderTheme('terracotta')}
                              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${activeBuilderTheme === 'terracotta'
                                  ? 'bg-[#C4661F] text-white border-[#C4661F] shadow-xs'
                                  : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
                                }`}
                            >
                              <span className="w-3 h-3 rounded-full bg-[#C4661F] border border-white" />
                              Alloy Orange & Serif Clásica
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveBuilderTheme('sage')}
                              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${activeBuilderTheme === 'sage'
                                  ? 'bg-[#5F6F52] text-white border-[#5F6F52] shadow-xs'
                                  : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
                                }`}
                            >
                              <span className="w-3 h-3 rounded-full bg-[#5F6F52] border border-white" />
                              Olive Sage & Minimalista
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveBuilderTheme('navy')}
                              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${activeBuilderTheme === 'navy'
                                  ? 'bg-[#B99470] text-white border-[#B99470] shadow-xs'
                                  : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
                                }`}
                            >
                              <span className="w-3 h-3 rounded-full bg-[#B99470] border border-white" />
                              Camel Terra & Orgánico
                            </button>
                          </div>
                        </div>
                      )}

                      {builderActiveTab === 'integrations' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200'
                            }`}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block text-stone-900 dark:text-white">Pipeline de Admisiones Directo</span>
                              <span className="text-[11px] text-stone-500 dark:text-slate-400">Las solicitudes del formulario web ingresan automáticamente a la etapa "Nueva Solicitud" del Kanban.</span>
                            </div>
                          </div>
                          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200'
                            }`}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block text-stone-900 dark:text-white">Portal de Familias & Calendario</span>
                              <span className="text-[11px] text-stone-500 dark:text-slate-400">Acceso autenticado y agenda de visitas sincronizada con confirmación automática.</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">{modI18n.webbuilder.pillars[0].title}</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">{modI18n.webbuilder.pillars[0].desc}</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">{modI18n.webbuilder.pillars[1].title}</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">{modI18n.webbuilder.pillars[1].desc}</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">{modI18n.webbuilder.pillars[2].title}</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">{modI18n.webbuilder.pillars[2].desc}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: COBRANZA & FACTURACIÓN */}
                {activeModuleTab === 'finances' && (
                  <motion.div
                    key="finances"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          Cobranza & Facturación
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Stripe · Mercado Pago · SPEI
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        Gestión Financiera & Recurrencia Automática
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        Automatiza el cobro de colegiaturas, emite facturas electrónicas y envía recordatorios cordiales por WhatsApp reduciendo la morosidad hasta un 68%.
                      </p>
                    </div>

                    {/* Full-Width Interactive Billing Dashboard */}
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200 dark:border-slate-800">
                        <span className="font-bold text-stone-900 dark:text-white">Tablero de Colegiaturas • Ciclo Escolar Activo</span>
                        <span className="text-emerald-500 font-bold text-[11px]">● Conciliación 95.6%</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                          }`}>
                          <span className="text-stone-400 text-[10px] block font-semibold">Total Cobrado</span>
                          <span className="text-xl font-bold text-emerald-500">$38,250 USD</span>
                        </div>
                        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                          }`}>
                          <span className="text-stone-400 text-[10px] block font-semibold">Pendiente por Cobrar</span>
                          <span className="text-xl font-bold text-amber-500">$1,750 USD</span>
                        </div>
                        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                          }`}>
                          <span className="text-stone-400 text-[10px] block font-semibold">Tasa de Morosidad</span>
                          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">1.8% (Mínima)</span>
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                        }`}>
                        <div className="flex items-center gap-2.5">
                          <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-stone-900 dark:text-white">Recordatorio automático por WhatsApp (3 días antes del vencimiento)</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                          Activo en Piloto
                        </span>
                      </div>
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Cargo Recurrente</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Tarjetas, SPEI y pasarelas globales.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Mensajes Cordiales</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Vía WhatsApp con enlace de pago.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Facturación Instantánea</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Comprobantes y conciliación al día.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 5: PIPELINES & KANBAN */}
                {activeModuleTab === 'pipelines' && (
                  <motion.div
                    key="pipelines"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <Workflow className="w-3.5 h-3.5" />
                          Pipelines & Kanban
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Automatizaciones por Etapa
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        Tableros de Admisiones & Seguimiento
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        Visualiza el flujo de cada familia desde la primera solicitud hasta la bienvenida en el aula, con contratos y fichas de pago automáticas.
                      </p>
                    </div>

                    {/* Full-Width Interactive Kanban Board */}
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200 dark:border-slate-800">
                        <span className="font-bold text-stone-900 dark:text-white">Tablero Kanban • Admisiones Ciclo 2026-2027</span>
                        <span className="text-[#C4661F] text-[11px] font-bold bg-[#C4661F]/10 px-2.5 py-0.5 rounded-full">
                          18 Aspirantes en Proceso
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        {/* Column 1: Solicitud */}
                        <div className={`p-3 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase">
                              1. Solicitud (4)
                            </span>
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          </div>
                          <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-stone-900 dark:text-white">Mateo Luna</span>
                              <span className="text-[10px] text-stone-400">Hace 2h</span>
                            </div>
                            <span className="inline-block text-[10px] font-medium text-stone-600 dark:text-slate-300 bg-stone-200/70 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                              Comunidad Infantil
                            </span>
                            <p className="text-[10px] text-stone-400">Formulario web completado</p>
                          </div>
                        </div>

                        {/* Column 2: Entrevista */}
                        <div className={`p-3 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#C4661F] uppercase">
                              2. Entrevista (2)
                            </span>
                            <span className="w-2 h-2 rounded-full bg-[#C4661F]" />
                          </div>
                          <div className="p-3 rounded-xl bg-[#C4661F]/5 border border-[#C4661F]/30 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#C4661F]">Santiago Morales</span>
                              <span className="text-[10px] text-[#C4661F] font-bold">Mañana</span>
                            </div>
                            <span className="inline-block text-[10px] font-medium text-[#C4661F] bg-[#C4661F]/15 px-2 py-0.5 rounded-md">
                              Casa de Niños
                            </span>
                            <p className="text-[10px] text-stone-500 dark:text-slate-400">Cita confirmada por WhatsApp</p>
                          </div>
                        </div>

                        {/* Column 3: Matriculado */}
                        <div className={`p-3 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                              3. Matriculado (12)
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">Valentina Ruiz</span>
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            </div>
                            <span className="inline-block text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                              Taller 1
                            </span>
                            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Contrato y pago formalizados</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Control Visual</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Seguimiento etapa por etapa.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Disparadores</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Contratos y fichas automáticas.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Múltiples Flujos</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Admisiones, personal o psicopedagógico.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 6: CALENDARIO & CITAS */}
                {activeModuleTab === 'calendar' && (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Calendario & Citas
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Google & Apple Sync
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        Agenda de Observaciones y Entrevistas
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        Permite a las familias reservar visitas al ambiente según la disponibilidad real del equipo docente, eliminando empalmes y cancelaciones.
                      </p>
                    </div>

                    {/* Full-Width Interactive Calendar Simulator */}
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200 dark:border-slate-800">
                        <span className="font-bold text-stone-900 dark:text-white">Visita de Observación al Ambiente</span>
                        <span className="text-emerald-500 font-bold text-[10px]">● 3 Horarios Disponibles</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <button type="button" className={`p-3.5 rounded-xl border text-center font-bold transition-all ${isDark ? 'bg-[#162218] border-slate-700 text-slate-200' : 'bg-white border-stone-200 text-stone-800 shadow-3xs'
                          }`}>
                          09:00 AM
                          <span className="block text-[10px] font-normal text-stone-400 mt-0.5">Casa de Niños 1</span>
                        </button>
                        <button type="button" className="p-3.5 rounded-xl border border-[#C4661F] bg-[#C4661F]/15 text-[#C4661F] text-center font-bold shadow-xs">
                          11:00 AM (Seleccionado)
                          <span className="block text-[10px] font-normal mt-0.5">Casa de Niños 2</span>
                        </button>
                        <button type="button" className={`p-3.5 rounded-xl border text-center font-bold transition-all ${isDark ? 'bg-[#162218] border-slate-700 text-slate-200' : 'bg-white border-stone-200 text-stone-800 shadow-3xs'
                          }`}>
                          02:30 PM
                          <span className="block text-[10px] font-normal text-stone-400 mt-0.5">Taller 1</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Sin Empalmes</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Disponibilidad real por ambiente.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Recordatorio WhatsApp</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">85% menos inasistencias.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Sincronización Móvil</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Google Calendar y Apple iCal.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 7: PORTAL DE FAMILIAS */}
                {activeModuleTab === 'family' && (
                  <motion.div
                    key="family"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Portal de Familias
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sin Grupos Caóticos de WhatsApp
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        Comunicación Institucional y Firmas Digitales
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        Centraliza boletines, permisos escolares y firmas electrónicas de autorización con confirmación de lectura en tiempo real.
                      </p>
                    </div>

                    {/* Full-Width Interactive Family Portal Simulator */}
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200 dark:border-slate-800">
                        <span className="font-bold text-stone-900 dark:text-white">Portal Familiar • Familia Morales</span>
                        <span className="text-emerald-500 font-bold text-[10px]">● Sesión Segura</span>
                      </div>
                      <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                        }`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#C4661F]">Circular Oficial: Salida Pedagógica al Jardín Botánico</span>
                          <span className="text-[10px] text-stone-400">Hoy</span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-slate-300">Autorización de transporte y seguro escolar para Santiago Morales.</p>
                        <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-stone-100 dark:border-slate-800">
                          <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Firmado digitalmente por ambos tutores
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">12/Sep • 08:30 AM</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Privacidad Total</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Sin teléfonos expuestos en grupos.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Firmas Móviles</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Autorizaciones válidas con valor legal.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Boletines Oficiales</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Con acuse de lectura para el colegio.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: REGISTRO & SEGUIMIENTO / LECCIONES Y TRACKERS */}
                {(activeModuleTab === 'tracking' || activeModuleTab === 'observation') && (
                  <motion.div
                    key="tracking"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" />
                          {lang === 'en' ? 'Tracking & Observation' : lang === 'es' ? 'Registro & Seguimiento' : lang === 'pt' ? 'Registro & Acompanhamento' : 'Suivi & Observation'}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5" />
                          {lang === 'en' ? 'Voice Dictation & AI' : lang === 'es' ? 'Dictado por Voz & IA' : lang === 'pt' ? 'Ditado por Voz & IA' : 'Dictée Vocale & IA'}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {lang === 'en' ? '3-Period Séguin' : lang === 'es' ? '3 Tiempos de Séguin' : lang === 'pt' ? '3 Tempos de Séguin' : '3 Temps de Séguin'}
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        {lang === 'en'
                          ? 'Real-Time Pedagogical Matrix • Lessons & Trackers'
                          : lang === 'es'
                            ? 'Matriz Pedagógica en Tiempo Real • Lecciones & Trackers'
                            : lang === 'pt'
                              ? 'Matriz Pedagógica em Tempo Real • Lições & Hábitos'
                              : 'Matrice Pédagogique en Temps Réel • Leçons & Habitudes'}
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        {lang === 'en'
                          ? 'Capture classroom observations, presentation milestones, and daily habits seamlessly. Features contextual 1-click in-cell dictation, batch AI structuring (gpt-5.6-luna), and strict date synchronization.'
                          : lang === 'es'
                            ? 'Registra observaciones de aula, lecciones curriculares y hábitos diarios de forma natural. Incluye dictado contextual celda por celda, estructuración por lotes con IA y sincronización estricta por fecha.'
                            : lang === 'pt'
                              ? 'Registre observações de sala de aula, lições curriculares e hábitos diários. Inclui ditado contextual célula por célula, estruturação por IA em lote e sincronização rigorosa por data.'
                              : 'Enregistrez les observations de classe, les leçons et les habitudes quotidiennes. Inclut la dictée contextuelle en cellule, la structuration IA par lots et la synchronisation stricte par date.'}
                      </p>
                    </div>

                    {/* Clean Header Bar & Video Demo Trigger */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-stone-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5 bg-stone-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-800">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-[#C4661F]" />
                          <span>{lang === 'en' ? 'Live Pedagogical Matrix' : lang === 'es' ? 'Matriz Pedagógica en Directo' : lang === 'pt' ? 'Matriz Pedagógica em Direto' : 'Matrice Pédagogique'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={startTrackingVideoDemo}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all shadow-xs ${
                            trackingDemoPlaying
                              ? 'bg-[#C4661F] text-white border-[#C4661F] animate-pulse'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                          title="Ver demostración interactiva guiada"
                        >
                          {trackingDemoPlaying ? (
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current text-[#C4661F]" />
                          )}
                          <span>{trackingDemoPlaying ? modI18n.tracking.demoBtnPlaying : modI18n.tracking.demoBtn}</span>
                        </button>

                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          29 Ago 2026 • 100% Sync
                        </span>
                      </div>
                    </div>
{/* MAIN INTERACTIVE CONTAINER WITH VIDEO OVERLAY & SIMULATED CURSOR */}
                    <div className="relative rounded-2xl overflow-hidden min-h-[380px]">
                      {/* SIMULATED MOUSE CURSOR */}
                      {trackingDemoPlaying && (
                        <motion.div
                          animate={{
                            left: `${trackingSimCursor.xPercent}%`,
                            top: `${trackingSimCursor.yPercent}%`,
                            scale: trackingSimCursor.isClicking ? 0.8 : 1
                          }}
                          transition={{
                            type: 'spring',
                            damping: 24,
                            stiffness: 160,
                            mass: 0.5
                          }}
                          className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2"
                        >
                          <div className="relative flex items-center justify-center">
                            <div className={`w-8 h-8 rounded-full bg-[#C4661F]/35 border-2 border-[#C4661F] backdrop-blur-xs flex items-center justify-center shadow-xl transition-transform duration-150 ${
                              trackingSimCursor.isClicking ? 'scale-75 bg-[#C4661F]/80' : 'animate-pulse'
                            }`}>
                              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                            </div>
                            {trackingSimCursor.isClicking && (
                              <span className="absolute w-12 h-12 rounded-full border-2 border-[#C4661F] animate-ping" />
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* VIDEO OVERLAY (TRANSLUCENT BACKDROP WITH PLAY BUTTON IN CENTER) */}
                      {trackingShowVideoOverlay && (
                        <div className="absolute inset-0 z-40 bg-black/45 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in duration-300">
                          <button
                            type="button"
                            onClick={startTrackingVideoDemo}
                            className="group relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95"
                          >
                            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C4661F]/50 to-amber-500/50 blur-xl animate-pulse" />
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C4661F] text-white flex items-center justify-center shadow-2xl ring-8 ring-white/20 group-hover:bg-[#b05a1a]">
                              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current ml-1" />
                            </div>
                          </button>

                          <div className="space-y-1 max-w-md">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-black/60 px-3 py-1 rounded-full border border-amber-500/30 inline-block">
                              Demostración Guiada
                            </span>
                            <h4 className="text-lg sm:text-xl font-bold font-serif text-white">
                              Ver Dictado por Voz & Sincronización en Acción
                            </h4>
                            <p className="text-xs text-gray-200">
                              Haz clic para reproducir el recorrido simulado: captura de voz, ondas sonoras y registro automático en la matriz pedagógica.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={skipTrackingDemo}
                            className="text-xs text-stone-300 hover:text-white underline underline-offset-4 cursor-pointer pt-1 transition-colors font-medium"
                          >
                            O explorar la matriz libremente →
                          </button>
                        </div>
                      )}

                      {/* REGISTRATION SUCCESS FLASH BANNER */}
                      <AnimatePresence>
                        {trackingJustRegisteredFlash && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 shadow-md"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>¡Observación estructurada con IA y registrada en la matriz para Elena R.!</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
                              Sync 100%
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* SUB-VIEW 1: INTERACTIVE PEDAGOGICAL MATRIX */}
                      {trackingModuleSubView === 'matrix' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          {/* Matrix Filter & Mode Bar */}
                          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 flex-wrap text-xs ${
                            isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[#C4661F]" />
                                {lang === 'en' ? 'Selected Date:' : lang === 'es' ? 'Fecha Seleccionada:' : lang === 'pt' ? 'Data:' : 'Date :'}
                              </span>
                              <span className="font-mono font-bold text-[#C4661F] bg-[#C4661F]/10 px-2.5 py-0.5 rounded-lg border border-[#C4661F]/20">
                                29 Ago 2026
                              </span>
                              <span className="text-[10px] text-stone-400 dark:text-slate-400">
                                (Casa de Niños 1 • 3-6 años)
                              </span>
                            </div>

                            {/* Mini AMI Legend */}
                            <div className="hidden sm:flex items-center gap-3 text-[11px] text-stone-500 dark:text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-cyan-500" />
                                1er Tiempo
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                2do Tiempo
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                3er Tiempo
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-stone-200 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => setTrackingActiveCategory('lessons')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  trackingActiveCategory === 'lessons'
                                    ? 'bg-[#C4661F] text-white shadow-2xs'
                                    : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                              >
                                {lang === 'en' ? 'AMI Lessons' : lang === 'es' ? 'Lecciones AMI' : lang === 'pt' ? 'Lições AMI' : 'Leçons AMI'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setTrackingActiveCategory('trackers')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  trackingActiveCategory === 'trackers'
                                    ? 'bg-[#C4661F] text-white shadow-2xs'
                                    : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                              >
                                {lang === 'en' ? 'Habits & Trackers' : lang === 'es' ? 'Hábitos & Trackers' : lang === 'pt' ? 'Hábitos & Rotinas' : 'Habitudes'}
                              </button>
                            </div>
                          </div>

                          {/* Interactive Matrix Table */}
                          <div className={`rounded-2xl border overflow-x-auto ${
                            isDark ? 'bg-[#0a120b] border-slate-800' : 'bg-white border-stone-200 shadow-sm'
                          }`}>
                            <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                              <thead>
                                <tr className={`border-b ${isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-stone-100/80 border-stone-200 text-stone-700'}`}>
                                  <th className="p-3 font-bold">{lang === 'en' ? 'Student' : lang === 'es' ? 'Estudiante' : lang === 'pt' ? 'Aluno' : 'Élève'}</th>
                                  <th className="p-3 font-bold text-center">
                                    <div className="flex flex-col items-center">
                                      <span>{lang === 'en' ? 'Pink Tower' : lang === 'fr' ? 'Tour Rose' : 'Torre Rosa'}</span>
                                      <span className="text-[9px] font-normal text-slate-400">{lang === 'en' ? '(Sensorial)' : lang === 'it' ? '(Sensoriale)' : lang === 'fr' ? '(Sensoriel)' : '(Sensorial)'}</span>
                                    </div>
                                  </th>
                                  <th className="p-3 font-bold text-center">
                                    <div className="flex flex-col items-center">
                                      <span>{lang === 'en' ? 'Movable Alphabet' : lang === 'pt' ? 'Alfabeto Móvel' : lang === 'it' ? 'Alfabeto Mobile' : lang === 'fr' ? 'Alphabet Mobile' : 'Alfabeto Móvil'}</span>
                                      <span className="text-[9px] font-normal text-slate-400">{lang === 'en' ? '(Language)' : lang === 'pt' ? '(Linguagem)' : lang === 'it' ? '(Linguaggio)' : lang === 'fr' ? '(Langage)' : '(Lenguaje)'}</span>
                                    </div>
                                  </th>
                                  <th className="p-3 font-bold text-center">
                                    <div className="flex flex-col items-center">
                                      <span>{lang === 'en' ? 'Knobbed Cylinders' : lang === 'pt' ? 'Cilindros c/ Botão' : lang === 'it' ? 'Cilindri con Pomolo' : lang === 'fr' ? 'Cylindres à Bouton' : 'Cilindros c/Botón'}</span>
                                      <span className="text-[9px] font-normal text-slate-400">{lang === 'en' ? '(Sensorial)' : lang === 'it' ? '(Sensoriale)' : lang === 'fr' ? '(Sensoriel)' : '(Sensorial)'}</span>
                                    </div>
                                  </th>
                                  <th className="p-3 font-bold text-center">
                                    <div className="flex flex-col items-center">
                                      <span>{lang === 'en' ? 'Table Washing' : lang === 'pt' ? 'Lavar a Mesa' : lang === 'it' ? 'Lavaggio Tavolo' : lang === 'fr' ? 'Lavage de Table' : 'Cuidado de Mesa'}</span>
                                      <span className="text-[9px] font-normal text-slate-400">{lang === 'en' ? '(Practical Life)' : lang === 'it' ? '(Vita Pratica)' : lang === 'fr' ? '(Vie Pratique)' : '(Vida Práctica)'}</span>
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-200 dark:divide-slate-800/80 font-medium">
                                {/* Row 1: Elena R. */}
                                <tr className={`transition-colors ${
                                  trackingJustRegisteredFlash
                                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                                    : trackingSelectedCell?.student === 'Elena R.'
                                      ? 'bg-[#C4661F]/5 dark:bg-[#C4661F]/10'
                                      : 'hover:bg-stone-50 dark:hover:bg-slate-900/40'
                                }`}>
                                  <td className="p-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-[10px]">
                                        E
                                      </div>
                                      <span className="font-bold text-stone-900 dark:text-white">Elena R. (5a 1m)</span>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="Dominado (3er Tiempo)">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-3xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => setTrackingSelectedCell({
                                          student: 'Elena R.',
                                          studentAge: '5a 1m',
                                          activity: 'Alfabeto Móvil',
                                          area: 'Lenguaje',
                                          status: 'Dominado (3er Tiempo)',
                                          statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                                          publicNote: '«Elena demostró un periodo de concentración prolongada en el área de lenguaje, interiorizando con entusiasmo la correspondencia fonética y la construcción de palabras.»',
                                          privateNote: '«Consolidó fonemas /m/ /a/ /s/ /a/ sin error espontáneo. Lista para letras de lija serie azul la próxima semana.»',
                                          photoUrl: '/images/montessori_child_privacy_demo.jpg'
                                        })}
                                        className={`w-16 h-8 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                          trackingJustRegisteredFlash
                                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50 ring-2 ring-emerald-500/50'
                                            : 'bg-[#C4661F]/15 hover:bg-[#C4661F]/25 text-[#C4661F] border border-[#C4661F]/40 ring-1 ring-[#C4661F]/50'
                                        }`}
                                        title="Dominado (3er Tiempo) • Dictado por voz disponible"
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <Mic className="w-3 h-3 text-[#C4661F] shrink-0" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="Dominado (3er Tiempo)">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-3xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="Hábito Cumplido">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-3xs">
                                        <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                                      </div>
                                    </div>
                                  </td>
                                </tr>

                                {/* Row 2: Santiago M. */}
                                <tr className={`transition-colors ${trackingSelectedCell?.student === 'Santiago M.' ? 'bg-[#C4661F]/5 dark:bg-[#C4661F]/10' : 'hover:bg-stone-50 dark:hover:bg-slate-900/40'}`}>
                                  <td className="p-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                                        S
                                      </div>
                                      <span className="font-bold text-stone-900 dark:text-white">Santiago M. (4a 2m)</span>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => setTrackingSelectedCell({
                                          student: 'Santiago M.',
                                          studentAge: '4a 2m',
                                          activity: 'Torre Rosa',
                                          area: 'Sensorial',
                                          status: 'Dominado (3er Tiempo)',
                                          statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                                          publicNote: '«Santiago completó los 10 cubos de la Torre Rosa por gradación tridimensional con autorregulación espontánea.»',
                                          privateNote: '«Excelente control del error visual en el séptimo cubo. No requirió intervención del adulto.»',
                                          photoUrl: '/images/montessori_child_privacy_demo.jpg'
                                        })}
                                        className="w-16 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-colors"
                                        title="Dominado (3er Tiempo) • Dictado por voz disponible"
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <Mic className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="Practicando (2do Tiempo)">
                                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-3xs">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="Dominado (3er Tiempo)">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-3xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="Hábito Cumplido">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-3xs">
                                        <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                                      </div>
                                    </div>
                                  </td>
                                </tr>

                                {/* Row 3: Mateo V. */}
                                <tr className={`transition-colors ${trackingSelectedCell?.student === 'Mateo V.' ? 'bg-[#C4661F]/5 dark:bg-[#C4661F]/10' : 'hover:bg-stone-50 dark:hover:bg-slate-900/40'}`}>
                                  <td className="p-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                                        M
                                      </div>
                                      <span className="font-bold text-stone-900 dark:text-white">Mateo V. (3a 8m)</span>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="Presentado (1er Tiempo)">
                                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-3xs">
                                        <Eye className="w-4 h-4 text-cyan-500" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="No iniciado">
                                      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex items-center justify-center">
                                        <Minus className="w-3.5 h-3.5 text-stone-400 dark:text-slate-600" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="Practicando (2do Tiempo)">
                                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-3xs">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center" title="En progreso">
                                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-3xs">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Selected Cell Live Detail & 1-Click Dictation Card */}
                          {trackingSelectedCell && (
                            <div className={`p-4 rounded-2xl border space-y-3 ${
                              isDark ? 'bg-[#0f1811] border-slate-700' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'
                            }`}>
                              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-stone-200 dark:border-slate-800 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-stone-900 dark:text-white">
                                    {trackingSelectedCell.student} ({trackingSelectedCell.studentAge})
                                  </span>
                                  <span className="text-[11px] text-stone-400">•</span>
                                  <span className="text-xs font-semibold text-[#C4661F]">
                                    {trackingSelectedCell.activity} ({trackingSelectedCell.area})
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${trackingSelectedCell.statusColor}`}>
                                    {trackingSelectedCell.status}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setTrackingModuleSubView('voice_sim')}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-105 active:scale-95"
                                >
                                  <Mic className="w-3.5 h-3.5" />
                                  <span>{lang === 'en' ? 'Dictate Note in Cell' : lang === 'es' ? 'Dictar Nota en Celda' : lang === 'pt' ? 'Ditar nesta Célula' : 'Dicter dans la Cellule'}</span>
                                </button>
                              </div>

                              {/* Dual Notes Display: Public vs Confidential */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className={`p-3 rounded-xl border space-y-1.5 ${
                                  isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/70 border-emerald-200'
                                }`}>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] uppercase flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    {lang === 'en' ? 'Public Family Note (Parent Portal):' : lang === 'es' ? 'Nota Pública para Familias (Portal de Padres):' : lang === 'pt' ? 'Nota Pública para a Família:' : 'Note Publique Famille :'}
                                  </span>
                                  <p className="text-stone-700 dark:text-slate-300 leading-relaxed text-[11px]">
                                    {trackingSelectedCell.publicNote}
                                  </p>
                                </div>

                                <div className={`p-3 rounded-xl border space-y-1.5 ${
                                  isDark ? 'bg-purple-950/20 border-purple-500/20' : 'bg-purple-50/70 border-purple-200'
                                }`}>
                                  <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px] uppercase flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5" />
                                    {lang === 'en' ? 'Confidential Guide Note (Internal):' : lang === 'es' ? 'Nota Interna Confidencial (Guías & Dirección):' : lang === 'pt' ? 'Nota Interna Confidencial (Guias):' : 'Note Interne Confidentielle :'}
                                  </span>
                                  <p className="text-stone-700 dark:text-slate-300 leading-relaxed text-[11px]">
                                    {trackingSelectedCell.privateNote}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-VIEW 2: LIVE VOICE RECORDER SIMULATOR */}
                      {trackingModuleSubView === 'voice_sim' && (
                        <div className="p-6 rounded-2xl bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white space-y-5 shadow-2xl border border-slate-800 animate-in fade-in duration-300">
                          {/* Status Bar */}
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                              </span>
                              <span className="font-mono font-bold text-red-400 text-xs tracking-wider">
                                {lang === 'en' ? 'LIVE VOICE DICTATION' : lang === 'es' ? 'GRABANDO EN VIVO' : lang === 'pt' ? 'GRAVANDO AO VIVO' : 'ENREGISTREMENT'}
                              </span>
                              <span className="font-mono text-gray-300 font-bold text-sm">
                                00:{trackingSimRecordingSec ? trackingSimRecordingSec.toString().padStart(2, '0') : '18'}
                              </span>
                            </div>

                            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-gray-300 font-semibold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <span>Elena R. • Alfabeto Móvil</span>
                            </span>
                          </div>

                          {/* Center Mic & Waveform Equalizer */}
                          <div className="flex flex-col items-center justify-center space-y-4 py-2 text-center">
                            <div className="relative flex items-center justify-center">
                              <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-indigo-600/30 blur-xl animate-pulse" />
                              <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl ring-4 ring-white/20">
                                <Mic className="w-8 h-8 animate-bounce" />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-base sm:text-lg font-bold font-display text-white">
                                {lang === 'en' ? 'Listening to your observation...' : lang === 'es' ? 'Escuchando tu observación pedagógica...' : lang === 'pt' ? 'Ouvindo sua observação...' : 'Écoute de l’observation...'}
                              </h4>
                              <p className="text-xs text-gray-400 max-w-md mx-auto">
                                {lang === 'en'
                                  ? 'Speak naturally. Real-time transcription captures lessons, concentration milestones, and evidence.'
                                  : lang === 'es'
                                    ? 'Habla con naturalidad. La IA transcribe en directo, detecta el alumno y clasifica los 3 Tiempos de Séguin.'
                                    : lang === 'pt'
                                      ? 'Fale com naturalidade. A IA transcreve em tempo real e classifica os 3 tempos.'
                                      : 'Parlez naturellement. L’IA transcrit en direct et structure l’observation.'}
                              </p>
                            </div>

                            {/* Dynamic Audio Equalizer Bars */}
                            <div className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-center gap-1.5 h-14">
                              {[30, 60, 90, 45, 80, 100, 70, 40, 85, 95, 60, 35, 75, 90, 50, 65, 85, 40].map((h, i) => (
                                <div
                                  key={i}
                                  style={{ height: `${h}%` }}
                                  className="w-1.5 rounded-full bg-gradient-to-t from-pink-500 via-purple-500 to-indigo-500 animate-pulse"
                                />
                              ))}
                            </div>

                            {/* Real-time Transcription Stream */}
                            <div className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-left space-y-1">
                              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                                {lang === 'en' ? 'Live Stream:' : lang === 'es' ? 'Transcripción en Vivo:' : lang === 'pt' ? 'Transcrição:' : 'Transcription :'}
                              </span>
                              <p className="text-xs sm:text-sm text-gray-100 font-medium leading-relaxed">
                                {trackingLiveTypedText ? (
                                  <>
                                    <span>«{trackingLiveTypedText}</span>
                                    <span className="inline-block w-1.5 h-3.5 bg-purple-400 ml-1 animate-pulse align-middle" />
                                  </>
                                ) : (
                                  <>
                                    «Elena armó palabras con el alfabeto móvil durante 30 minutos concentrada...
                                    <span className="text-purple-300 italic"> discriminación fonética clara y autorregulación espontánea.»</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Equal Sized Action Buttons */}
                          <div className="flex items-center justify-center gap-8 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (trackingDemoPlaying) skipTrackingDemo();
                                setTrackingModuleSubView('matrix');
                              }}
                              className="flex flex-col items-center gap-1.5 group cursor-pointer"
                            >
                              <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 group-hover:text-white flex items-center justify-center transition-all shadow-md">
                                <X className="w-5 h-5" />
                              </div>
                              <span className="text-xs text-gray-400 group-hover:text-gray-200">{lang === 'en' ? 'Cancel' : lang === 'es' ? 'Cancelar' : lang === 'pt' ? 'Cancelar' : 'Annuler'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (trackingDemoPlaying) skipTrackingDemo();
                                setTrackingJustRegisteredFlash(true);
                                setTrackingModuleSubView('matrix');
                                setTrackingSelectedCell({
                                  student: 'Elena R.',
                                  studentAge: '5a 1m',
                                  activity: 'Alfabeto Móvil',
                                  area: 'Lenguaje',
                                  status: 'Dominado (3er Tiempo)',
                                  statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                                  publicNote: '«Elena demostró un periodo de concentración prolongada en el área de lenguaje, interiorizando con entusiasmo la correspondencia fonética y la construcción de palabras.»',
                                  privateNote: '«Consolidó fonemas /m/ /a/ /s/ /a/ sin error espontáneo. Lista para letras de lija serie azul la próxima semana.»',
                                  photoUrl: '/images/montessori_child_privacy_demo.jpg'
                                });
                              }}
                              className={`flex flex-col items-center gap-1.5 group cursor-pointer transition-transform ${
                                trackingDemoStep === 'cursor_to_check' ? 'scale-110' : ''
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white flex items-center justify-center transition-all hover:scale-105 shadow-xl shadow-emerald-500/40 ring-4 ring-white/20 ${
                                trackingDemoStep === 'cursor_to_check' ? 'ring-emerald-400 scale-105' : ''
                              }`}>
                                <Check className="w-5 h-5 stroke-[3]" />
                              </div>
                              <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">{lang === 'en' ? 'Structure with AI' : lang === 'es' ? 'Estructurar con IA' : lang === 'pt' ? 'Estruturar' : 'Valider'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'}`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Minutos a Segundos</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Captura natural por voz en el aula.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'}`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Cero Fricción</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Dictado directo celda por celda.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'}`}>
                        <span className="font-bold text-stone-900 dark:text-white block">100% Sync de Fecha</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Sin desfases horarios UTC/Local.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'}`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Doble Registro</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Nota familiar y nota técnica interna.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 9: GUÍAS & ROLES */}
                {activeModuleTab === 'staff' && (
                  <motion.div
                    key="staff"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left min-w-0"
                  >
                    {/* Top Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4661F] bg-[#C4661F]/10 px-3 py-1 rounded-full border border-[#C4661F]/20 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Guías & Roles de Equipo
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Permisos por Ambiente
                        </span>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#162218]'}`}>
                        Matriz de Seguridad & Memoria Institucional
                      </h3>
                      <p className={`text-sm leading-relaxed max-w-2xl ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
                        Asigna permisos por aula preparada y asegura que el historial pedagógico de cada alumno permanezca en la escuela frente a relevos de guías.
                      </p>
                    </div>

                    {/* Full-Width Interactive Roles Matrix */}
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200 dark:border-slate-800">
                        <span className="font-bold text-stone-900 dark:text-white">Matriz de Roles & Ambientes Preparados</span>
                        <span className="text-emerald-500 font-bold text-[10px]">● 4 Roles Activos</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                          }`}>
                          <div>
                            <span className="font-bold block text-stone-900 dark:text-white">Guía Titular AMI</span>
                            <span className="text-[10px] text-stone-400">Observaciones y 3 Tiempos</span>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#C4661F]/15 text-[#C4661F] font-bold">
                            Ambientes 1 & 2
                          </span>
                        </div>
                        <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-200 shadow-3xs'
                          }`}>
                          <div>
                            <span className="font-bold block text-stone-900 dark:text-white">Dirección General</span>
                            <span className="text-[10px] text-stone-400">Finanzas, Admisiones y Auditoría</span>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold">
                            Acceso Global
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Aislamiento por Aula</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Solo ven a sus propios alumnos.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Memoria Viva</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">El historial se queda en la escuela.</span>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#0f1811] border-slate-800' : 'bg-[#FAF8F5] border-stone-200'
                        }`}>
                        <span className="font-bold text-stone-900 dark:text-white block">Relevos Transparentes</span>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400">Continuidad pedagógica garantizada.</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
          <div className={`inline-flex items-center p-1.5 rounded-2xl border mt-4 shadow-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-stone-300'
            }`}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${billingCycle === 'monthly'
                  ? 'bg-[#C4661F] text-white shadow-xs'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
            >
              {t.pricing.monthly}
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${billingCycle === 'annual'
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
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
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
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#0e1710] border-slate-800' : 'bg-[#FEFAE0] border-stone-200'
                }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-stone-800'}`}>
                    {t.pricing.envCountLabel}
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                    {t.pricing.envExample}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setEnvironmentsCount(Math.max(1, environmentsCount - 1))}
                    disabled={environmentsCount <= 1}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-200 dark:bg-slate-700 hover:bg-[#C4661F] hover:text-white disabled:opacity-30 disabled:hover:bg-stone-200 flex items-center justify-center font-bold text-base sm:text-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 sm:w-12 text-center text-xl sm:text-2xl font-serif font-black text-[#C4661F]">
                    {environmentsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnvironmentsCount(environmentsCount + 1)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-200 dark:bg-slate-700 hover:bg-[#C4661F] hover:text-white flex items-center justify-center font-bold text-base sm:text-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className={`text-xs sm:text-sm font-bold font-mono ml-1 sm:ml-2 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                    = ${pricingSummary.environmentsCost} USD/{lang === 'en' ? 'mo' : lang === 'es' ? 'mes' : lang === 'pt' ? 'mês' : 'mois'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Optional Modules Checkboxes */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
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
                <label className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all ${selectedOptionalModules.finances
                    ? 'border-[#C4661F] bg-[#C4661F]/10'
                    : isDark ? 'border-slate-800 bg-[#0e1710]' : 'border-stone-200 bg-[#FEFAE0]'
                  }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.finances}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, finances: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer shrink-0"
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
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap shrink-0 sm:self-center self-end">
                    +${PRICING_CONFIG.finances} USD/mo
                  </span>
                </label>

                {/* Website + Web Builder + Analytics */}
                <label className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all ${selectedOptionalModules.websiteBuilder
                    ? 'border-[#C4661F] bg-[#C4661F]/10'
                    : isDark ? 'border-slate-800 bg-[#0e1710]' : 'border-stone-200 bg-[#FEFAE0]'
                  }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.websiteBuilder}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, websiteBuilder: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer shrink-0"
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
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap shrink-0 sm:self-center self-end">
                    +${PRICING_CONFIG.websiteBuilder} USD/mo
                  </span>
                </label>

                {/* Gestor de Formularios Pro */}
                <label className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all ${selectedOptionalModules.forms
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
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer shrink-0"
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
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap shrink-0 sm:self-center self-end">
                    +${PRICING_CONFIG.forms} USD/mo
                  </span>
                </label>

                {/* Pipelines de Procesos Configurables (Depends on Forms) */}
                <label className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all ${selectedOptionalModules.pipelines
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
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer shrink-0"
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
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap shrink-0 sm:self-center self-end">
                    +${PRICING_CONFIG.pipelines} USD/mo
                  </span>
                </label>

                {/* SMTP / Newsletter Dedicado */}
                <label className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all ${selectedOptionalModules.newsletterSmtp
                    ? 'border-[#C4661F] bg-[#C4661F]/10'
                    : isDark ? 'border-slate-800 bg-[#0e1710]' : 'border-stone-200 bg-[#FEFAE0]'
                  }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.newsletterSmtp}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, newsletterSmtp: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-[#C4661F] mt-0.5 cursor-pointer shrink-0"
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
                  <span className="text-xs font-mono font-bold text-[#C4661F] whitespace-nowrap shrink-0 sm:self-center self-end">
                    +${PRICING_CONFIG.newsletterSmtp} USD/mo
                  </span>
                </label>
              </div>
            </div>

            {/* Step 3: Storage Selection */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
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
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${isSelected
                          ? 'border-[#C4661F] bg-[#C4661F]/15 ring-2 ring-[#C4661F]/30 shadow-xs'
                          : isDark
                            ? 'border-slate-800 bg-[#0e1710] hover:border-slate-700 hover:bg-[#0e1710]/80'
                            : 'border-stone-200 bg-[#FEFAE0] hover:border-stone-400 hover:bg-amber-50/50'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected
                            ? 'border-[#C4661F] bg-[#C4661F]'
                            : isDark ? 'border-slate-600 bg-slate-800' : 'border-stone-300 bg-white'
                          }`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${isSelected
                              ? 'text-[#C4661F] font-black'
                              : isDark ? 'text-slate-100' : 'text-stone-900'
                            }`}>
                            {tier.label}
                          </span>
                          <span className={`text-[10px] block truncate mt-0.5 ${isSelected
                              ? isDark ? 'text-slate-300' : 'text-stone-600'
                              : isDark ? 'text-slate-400' : 'text-stone-500'
                            }`}>
                            {tier.desc}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 ${isSelected
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
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-5 ${isDark ? 'bg-[#162218] border-slate-700' : 'bg-white border-stone-300'
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
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${isDark ? 'bg-[#0e1710] border-slate-800' : 'bg-[#FEFAE0] border-stone-200'
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
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${isDark
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
            <div className={`p-6 rounded-3xl border-2 border-[#C4661F] shadow-lg block lg:hidden ${isDark ? 'bg-[#162218]' : 'bg-white'
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
                className={`p-8 rounded-3xl border-2 border-[#C4661F] shadow-2xl relative transition-all duration-200 ${isDark ? 'bg-[#162218]' : 'bg-white'
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
                    className="w-full py-4 sm:py-5 px-4 sm:px-6 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 border border-white/20 text-center leading-snug"
                    style={{
                      backgroundColor: isDesktopCtaHovered ? '#8D410F' : '#C4661F',
                      cursor: 'pointer',
                      pointerEvents: 'auto'
                    }}
                  >
                    <span>{t.pricing.ctaBtn}</span>
                    <ArrowRight className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isDesktopCtaHovered ? 'translate-x-1' : ''}`} />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Fixed Floating Summary Bar */}
        <div
          className={`fixed bottom-0 inset-x-0 z-50 p-3.5 sm:p-4 bg-white/95 dark:bg-[#142016]/95 backdrop-blur-xl border-t border-stone-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] block lg:hidden transition-all duration-300 transform ${isPricingInView
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
              className="py-2.5 sm:py-3 px-3.5 sm:px-5 bg-[#C4661F] hover:bg-[#9E4D13] active:bg-[#783D19] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg active:scale-[0.97] shrink-0 flex items-center gap-1.5 transition-all duration-200 cursor-pointer border border-white/20 text-center"
              style={{ cursor: 'pointer' }}
            >
              <span>{t.pricing.ctaBtn}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
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
                  className={`rounded-3xl border overflow-hidden shadow-xs transition-all duration-200 ${isOpen
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
                    className={`w-full p-6 text-left flex items-start justify-between gap-4 font-serif font-bold transition-colors cursor-pointer ${isOpen
                        ? 'text-[#C4661F]'
                        : isDark
                          ? 'text-white hover:text-[#C4661F]'
                          : 'text-[#162218] hover:text-[#C4661F]'
                      }`}
                  >
                    <span className="text-base sm:text-lg leading-snug">{faq.q}</span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 mt-0.5 ${isOpen
                        ? 'bg-[#C4661F] text-white rotate-180'
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-stone-100 text-stone-600'
                      }`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  {isOpen && (
                    <div className={`px-6 pb-6 text-sm leading-relaxed border-t pt-4 ${isDark ? 'text-slate-300 border-slate-800/80' : 'text-stone-600 border-stone-200'
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
        <div className="p-8 sm:p-16 rounded-3xl bg-[#162218] text-white border-2 border-[#C4661F]/30 shadow-xl space-y-6">
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
              className="w-full sm:w-auto bg-[#C4661F] hover:bg-[#783D19] text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6 rounded-2xl shadow-lg hover:scale-[1.02] transition-all cursor-pointer justify-center text-center"
            >
              <span>{t.finalCta.button}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 shrink-0" />
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FOOTER */}
      {/* ========================================================================= */}
      <footer className={`pt-14 pb-0 text-xs border-t overflow-hidden ${isDark ? 'bg-[#101811] text-slate-400 border-slate-800' : 'bg-[#121c13] text-stone-400 border-[#243226]'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MontessoriNexusLogo size={32} />
              <span className="text-base font-serif font-bold text-white">MontessoriNexus</span>
            </div>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              {t.footer.tagline}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif font-bold text-white text-sm mb-2">{t.footer.modulesHeader}</h4>
            <p><a href="#modulos" className="hover:text-[#C4661F]">{t.nav.modules}</a></p>
            <p><a href="#ia-etica" className="hover:text-[#C4661F]">{t.nav.aiSuite}</a></p>
            <p><a href="/blog" className="hover:text-[#C4661F]">{t.nav.blog || 'Blog'}</a></p>
            <p><a href="#precios" className="hover:text-[#C4661F]">{t.nav.pricing}</a></p>
            <p><a href="#faq" className="hover:text-[#C4661F]">{t.nav.faq}</a></p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif font-bold text-white text-sm mb-2">{t.footer.schoolsHeader}</h4>
            <p><a href="/admin" className="hover:text-[#C4661F]">{t.nav.login}</a></p>
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

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] ${isDark ? 'border-slate-800/80' : 'border-[#243226]/60'
          }`}>
          <div className="space-y-1 text-center sm:text-left">
            <p>© {new Date().getFullYear()} MontessoriNexus. {t.footer.rights}</p>
            <p className="text-stone-500 dark:text-slate-400">
              Un producto de <span className="font-semibold text-stone-300 dark:text-slate-200">CHAMBAPRO SAPI DE CV</span> •{' '}
              <a
                href="https://chamba.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C4661F] hover:underline font-medium"
              >
                chamba.pro
              </a>
            </p>
          </div>
          <div className="flex gap-4">
            <a href="/privacidad" className="hover:text-[#C4661F] transition-colors">{t.footer.privacy}</a>
            <a href="/terminos" className="hover:text-[#C4661F] transition-colors">{t.footer.terms}</a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BIGFOOTER BRAND SIGNATURE (FULL-WIDTH 100% & BOTTOM-BLEED CROPPED) */}
        {/* ========================================================================= */}
        <div className="w-full overflow-hidden pt-10 pb-0 select-none relative">
          <div className="w-full text-center relative flex justify-center items-end px-3 sm:px-6">
            <div className="inline-flex justify-center items-end flex-nowrap tracking-tight sm:tracking-tighter font-serif font-black text-[9.5vw] sm:text-[9.8vw] md:text-[10vw] lg:text-[10.2vw] xl:text-[136px] leading-[0.72] select-none translate-y-3 sm:translate-y-5">
              {"MontessoriNexus".split("").map((char, index) => (
                <span
                  key={index}
                  className={`inline-block transition-colors duration-200 cursor-pointer ${isDark
                      ? 'text-white/20 hover:text-[#FFA05C] hover:drop-shadow-[0_0_35px_rgba(255,160,92,0.95)]'
                      : 'text-white/25 hover:text-[#FFA05C] hover:drop-shadow-[0_0_35px_rgba(196,102,31,0.95)]'
                    }`}
                >
                  {char}
                </span>
              ))}
            </div>
            {/* Subtle background ambiance */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-4/5 h-24 bg-[#C4661F]/15 blur-3xl rounded-full pointer-events-none" />
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
              className={`border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-left ${isDark ? 'bg-[#162218] border-slate-700 text-white' : 'bg-white border-stone-300 text-[#162218]'
                }`}
            >
              <button
                onClick={() => setDemoModalOpen(false)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
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
                        className={`w-full px-3.5 py-2 rounded-xl text-sm focus:border-[#C4661F] ${isDark
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
                          className={`w-full px-3.5 py-2 rounded-xl text-sm focus:border-[#C4661F] ${isDark
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
                          className={`w-full px-3.5 py-2 rounded-xl text-sm font-semibold focus:border-[#C4661F] ${isDark
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
                          className={`w-full px-3.5 py-2 rounded-xl text-sm focus:border-[#C4661F] ${isDark
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
                          className={`w-full px-3.5 py-2 rounded-xl text-sm focus:border-[#C4661F] ${isDark
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
