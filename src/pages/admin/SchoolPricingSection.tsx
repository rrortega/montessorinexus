import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Layers,
  Building,
  Building2,
  HardDrive,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Zap,
  Users,
  UserCheck,
  Calendar,
  Activity,
  Workflow,
  Mail,
  FolderLock,
  Image as ImageIcon,
  Brain,
  HelpCircle,
  ExternalLink,
  Plus,
  Minus,
  AlertTriangle,
  Lock,
  Trash2,
  Tag,
  ShieldAlert,
  Cloud,
  Server,
  Key,
  Database,
  Info,
  Settings,
  Eye,
  EyeOff,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Globe,
  Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SettingsContext';
import { getEnvironments, EnvironmentItem, School, testStorageConnection, testSmtpConnection } from '@/lib/sqlite';
import { toast } from 'sonner';

// PRICING CONSTANTS
export const PRICING_CONFIG = {
  environmentTier1: Number(import.meta.env.VITE_PRICING_ENVIRONMENT_TIER1) || 25,
  environmentTier2: Number(import.meta.env.VITE_PRICING_ENVIRONMENT_TIER2) || 10,
  storage10GbUnit: Number(import.meta.env.VITE_PRICING_STORAGE_10GB) || 5,

  // Core Base Modules (Mandatory in membership)
  waitlist: Number(import.meta.env.VITE_PRICING_WAITLIST) || 1,
  portalParents: Number(import.meta.env.VITE_PRICING_PORTAL_PARENTS) || 5,
  portalGuides: Number(import.meta.env.VITE_PRICING_PORTAL_TEACHERS) || 4,
  montessoriTracking: Number(import.meta.env.VITE_PRICING_PROGRESS) || 2,
  attendanceTracker: Number(import.meta.env.VITE_PRICING_ATTENDANCE) || 1,
  habitTrackers: Number(import.meta.env.VITE_PRICING_CALENDAR) || 1,

  // Optional A-la-carte Modules (USD / mo)
  finances: Number(import.meta.env.VITE_PRICING_FINANCES) || 12,
  websiteBuilder: Number(import.meta.env.VITE_PRICING_WEBSITE_BUILDER) || 18,
  forms: Number(import.meta.env.VITE_PRICING_FORMS) || 9,
  pipelines: Number(import.meta.env.VITE_PRICING_PIPELINES) || 9,
  newsletterSmtp: Number(import.meta.env.VITE_PRICING_NEWSLETTER) || 3.99
};

// EMAIL PACKAGE TIERS FOR NEWSLETTER MODULE
export interface EmailTierOption {
  id: string;
  name: string;
  desc: string;
  extraUnits: number; // 0 for base 500 or SMTP, +1 for 1000 (+500), +3 for 2000 (+1500), +5 for 3000 (+2500)
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

export interface SmtpPreset {
  name: string;
  host: string;
  port: string;
  secure: boolean;
}

export const SMTP_PRESETS: SmtpPreset[] = [
  { name: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: '465', secure: true },
  { name: 'AWS SES (US East)', host: 'email-smtp.us-east-1.amazonaws.com', port: '465', secure: true },
  { name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587', secure: false },
  { name: 'Mailgun', host: 'smtp.mailgun.org', port: '587', secure: false },
  { name: 'Brevo (Sendinblue)', host: 'smtp-relay.brevo.com', port: '587', secure: false },
  { name: 'Resend', host: 'smtp.resend.com', port: '465', secure: true },
  { name: 'Postmark', host: 'smtp.postmarkapp.com', port: '587', secure: false }
];

// AWS S3 STANDARD REGIONS
export interface S3RegionOption {
  id: string;
  name: string;
  loc: string;
  flag: string;
}

export const S3_REGIONS: S3RegionOption[] = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', loc: 'EE.UU. Este (N. Virginia)', flag: '🇺🇸' },
  { id: 'us-east-2', name: 'US East (Ohio)', loc: 'EE.UU. Este (Ohio)', flag: '🇺🇸' },
  { id: 'us-west-1', name: 'US West (N. California)', loc: 'EE.UU. Oeste (N. California)', flag: '🇺🇸' },
  { id: 'us-west-2', name: 'US West (Oregon)', loc: 'EE.UU. Oeste (Oregon)', flag: '🇺🇸' },
  { id: 'mx-central-1', name: 'Mexico (Central)', loc: 'México (Central)', flag: '🇲🇽' },
  { id: 'sa-east-1', name: 'South America (São Paulo)', loc: 'Sudamérica (São Paulo)', flag: '🇧🇷' },
  { id: 'ca-central-1', name: 'Canada (Central)', loc: 'Canadá (Central)', flag: '🇨🇦' },
  { id: 'eu-south-2', name: 'EU (Spain)', loc: 'Europa (España)', flag: '🇪🇸' },
  { id: 'eu-west-1', name: 'EU (Ireland)', loc: 'Europa (Irlanda)', flag: '🇮🇪' },
  { id: 'eu-west-3', name: 'EU (Paris)', loc: 'Europa (París)', flag: '🇫🇷' },
  { id: 'eu-central-1', name: 'EU (Frankfurt)', loc: 'Europa (Frankfurt)', flag: '🇩🇪' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', loc: 'Asia Pacífico (Singapur)', flag: '🇸🇬' },
  { id: 'custom', name: 'Personalizada / Otra región...', loc: 'Ingresar código manual de región', flag: '✨' }
];

export const CustomRegionDropdown: React.FC<{
  value: string;
  driver: 's3' | 'minio';
  isCustomRegion: boolean;
  onChange: (newRegion: string) => void;
  onToggleCustom: (isCustom: boolean) => void;
}> = ({ value, driver, isCustomRegion, onChange, onToggleCustom }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 260)
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownMenuRef.current && !dropdownMenuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = S3_REGIONS.find((r) => r.id === value);

  const filteredRegions = useMemo(() => {
    const regionsList = driver === 'minio'
      ? [
          { id: 'us-east-1', name: 'us-east-1 (Por defecto)', loc: 'Región estándar recomendada para MinIO', flag: '⚡' },
          { id: 'custom', name: 'Personalizada / Otra región...', loc: 'Ingresar región configurada en MinIO', flag: '✨' }
        ]
      : S3_REGIONS;

    if (!search.trim()) return regionsList;
    const q = search.toLowerCase();
    return regionsList.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.loc.toLowerCase().includes(q)
    );
  }, [search, driver]);

  if (isCustomRegion) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Región {driver === 'minio' ? 'MinIO' : 'AWS S3'} (Personalizada) *
          </label>
          <button
            type="button"
            onClick={() => {
              onToggleCustom(false);
              onChange('us-east-1');
            }}
            className="text-[10.5px] text-forest dark:text-emerald-400 hover:underline font-bold cursor-pointer"
          >
            ← Volver a lista
          </button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ej. us-east-1, eu-west-2 o minio-local"
          className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-forest outline-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
        Región {driver === 'minio' ? 'MinIO' : 'AWS S3'} *
      </label>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          updateCoords();
          setIsOpen(!isOpen);
        }}
        className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs flex items-center justify-between gap-2 text-left focus:ring-2 focus:ring-forest outline-none cursor-pointer transition-all hover:border-stone-400 dark:hover:border-slate-600 shadow-2xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">{selectedOption?.flag || '🌐'}</span>
          <div className="min-w-0">
            <span className="font-bold text-xs block truncate">
              {selectedOption ? selectedOption.name : value || 'us-east-1'}
            </span>
            <span className="text-[10px] text-muted-foreground block truncate">
              {selectedOption ? selectedOption.loc : 'Región seleccionada'}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-forest dark:text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Custom Popover Dropdown Menu (Portal into document.body to prevent any overflow clipping) */}
      {isOpen && menuCoords && createPortal(
        <div
          ref={dropdownMenuRef}
          style={{
            position: 'fixed',
            top: `${menuCoords.top}px`,
            left: `${menuCoords.left}px`,
            width: `${menuCoords.width}px`,
            zIndex: 99999
          }}
          className="bg-white dark:bg-[#182a1d] border border-stone-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-64"
        >
          {/* Search Filter Box */}
          <div className="p-2 border-b border-stone-100 dark:border-slate-800 bg-stone-50/90 dark:bg-slate-900/80 backdrop-blur-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar región (ej. Virginia, España, México)..."
                className="w-full pl-8 pr-2.5 py-1.5 text-[11px] rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-forest"
                autoFocus
              />
            </div>
          </div>

          {/* List of Regions */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-48">
            {filteredRegions.map((region) => {
              const isSelected = value === region.id;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => {
                    if (region.id === 'custom') {
                      onToggleCustom(true);
                    } else {
                      onChange(region.id);
                      onToggleCustom(false);
                    }
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-forest/15 text-forest dark:text-emerald-300 font-bold'
                      : 'hover:bg-stone-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{region.flag}</span>
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-semibold">
                        {region.name}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {region.loc}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-forest dark:text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredRegions.length === 0 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No se encontraron regiones con "{search}"
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const AnimatedPriceCounter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ value, prefix = '$', suffix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    const duration = 280; // ms

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const current = Math.round(startValue + (endValue - startValue) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value]);

  return (
    <span className={`inline-flex items-baseline tabular-nums transition-transform ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

export interface NewEnvironmentEntry {
  id: string;
  name: string;
  stage?: string;
}

export const SchoolPricingSection: React.FC = () => {
  const navigate = useNavigate();
  const { activeMembership, user } = useAuth();
  const { settings, updateSettings } = useSiteSettings();
  const school = activeMembership?.school;

  // Storage Modal & Connection State
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageDriver, setStorageDriver] = useState<'s3' | 'minio'>(
    settings?.storage_driver === 'minio' ? 'minio' : 's3'
  );
  const [storageBucket, setStorageBucket] = useState(settings?.s3_bucket || '');
  const [storageRegion, setStorageRegion] = useState(settings?.s3_region || 'us-east-1');
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [storageEndpoint, setStorageEndpoint] = useState(settings?.s3_endpoint || '');
  const [storageAccessKeyId, setStorageAccessKeyId] = useState(settings?.s3_access_key_id || '');
  const [storageSecretAccessKey, setStorageSecretAccessKey] = useState(settings?.s3_secret_access_key || '');
  const [storageForcePathStyle, setStorageForcePathStyle] = useState(
    settings?.s3_force_path_style === 'true' || settings?.storage_driver === 'minio'
  );
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testingStorage, setTestingStorage] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingStorage, setIsSavingStorage] = useState(false);

  // Drawer pull-down on mobile & history/Esc key handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchDelta(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchDelta > 90) {
      setIsStorageModalOpen(false);
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  useEffect(() => {
    if (!isStorageModalOpen) return;

    // Handle ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsStorageModalOpen(false);
      }
    };

    // Push history entry for mobile back button
    window.history.pushState({ storageDrawerOpen: true }, '');

    const handlePopState = () => {
      setIsStorageModalOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isStorageModalOpen]);

  useEffect(() => {
    if (settings) {
      if (settings.storage_driver === 'minio' || settings.storage_driver === 's3') {
        setStorageDriver(settings.storage_driver);
      }
      if (settings.s3_bucket) setStorageBucket(settings.s3_bucket);
      if (settings.s3_region) {
        setStorageRegion(settings.s3_region);
        const isKnown = S3_REGIONS.some((r) => r.id === settings.s3_region && r.id !== 'custom');
        setIsCustomRegion(!isKnown && settings.s3_region !== 'us-east-1');
      }
      if (settings.s3_endpoint) setStorageEndpoint(settings.s3_endpoint);
      if (settings.s3_access_key_id) setStorageAccessKeyId(settings.s3_access_key_id);
      if (settings.s3_secret_access_key) setStorageSecretAccessKey(settings.s3_secret_access_key);
      if (settings.s3_force_path_style !== undefined) {
        setStorageForcePathStyle(settings.s3_force_path_style === 'true');
      }
    }
  }, [settings]);

  // Check if school already has AWS S3 or MinIO credentials configured in system settings
  const hasConfiguredStorage = Boolean(
    settings?.s3_bucket && settings.s3_bucket.trim().length > 0 &&
    settings?.s3_access_key_id && settings.s3_access_key_id.trim().length > 0
  );

  const handleTestStorageConnection = async () => {
    if (!storageBucket.trim()) {
      toast.error('Por favor ingresa el nombre del bucket');
      return false;
    }
    if (!storageAccessKeyId.trim()) {
      toast.error('Por favor ingresa el Access Key ID');
      return false;
    }
    if (!storageSecretAccessKey.trim()) {
      toast.error('Por favor ingresa el Secret Access Key');
      return false;
    }
    if (storageDriver === 'minio' && !storageEndpoint.trim()) {
      toast.error('Por favor ingresa el Endpoint de tu servidor MinIO');
      return false;
    }

    setTestingStorage(true);
    setTestResult(null);
    try {
      const res = await testStorageConnection({
        driver: storageDriver,
        s3Endpoint: storageDriver === 'minio' ? storageEndpoint.trim() : undefined,
        s3Region: storageRegion.trim() || 'us-east-1',
        s3Bucket: storageBucket.trim(),
        s3AccessKeyId: storageAccessKeyId.trim(),
        s3SecretAccessKey: storageSecretAccessKey.trim(),
        s3ForcePathStyle: storageDriver === 'minio' ? true : storageForcePathStyle
      });
      setTestResult({ success: true, message: res.message || '¡Conexión y credenciales verificadas con éxito!' });
      toast.success(res.message || 'Almacenamiento verificado exitosamente');
      return true;
    } catch (err: any) {
      const errMsg = err.message || 'Error al conectar con el bucket de almacenamiento';
      setTestResult({ success: false, message: errMsg });
      toast.error(errMsg);
      return false;
    } finally {
      setTestingStorage(false);
    }
  };

  const handleSaveStorageAndProceed = async () => {
    let passed = testResult?.success;
    if (!passed) {
      passed = await handleTestStorageConnection();
    }
    if (!passed) {
      return;
    }

    setIsSavingStorage(true);
    try {
      await updateSettings({
        storage_driver: storageDriver,
        s3_bucket: storageBucket.trim(),
        s3_region: storageRegion.trim() || 'us-east-1',
        s3_endpoint: storageDriver === 'minio' ? storageEndpoint.trim() : '',
        s3_access_key_id: storageAccessKeyId.trim(),
        s3_secret_access_key: storageSecretAccessKey.trim(),
        s3_force_path_style: storageDriver === 'minio' ? 'true' : (storageForcePathStyle ? 'true' : 'false')
      });
      toast.success('Configuración de almacenamiento verificada y guardada.');
      setIsStorageModalOpen(false);
      setCurrentStep((selectedOptionalModules.newsletterSmtp ? 5 : 4) as any);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar configuración de almacenamiento');
    } finally {
      setIsSavingStorage(false);
    }
  };

  // SMTP Modal & Connection State
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [smtpHost, setSmtpHost] = useState(settings?.smtp_host || '');
  const [smtpPort, setSmtpPort] = useState(settings?.smtp_port || '587');
  const [smtpUser, setSmtpUser] = useState(settings?.smtp_user || '');
  const [smtpPass, setSmtpPass] = useState(settings?.smtp_pass || '');
  const [smtpSecure, setSmtpSecure] = useState(
    settings?.smtp_secure === 'true' || settings?.smtp_port === '465'
  );
  const [smtpFromName, setSmtpFromName] = useState(
    settings?.smtp_from_name || school?.name || 'Colegio Montessori'
  );
  const [smtpFromEmail, setSmtpFromEmail] = useState(
    settings?.smtp_from_email || settings?.smtp_user || ''
  );
  const [smtpTestEmail, setSmtpTestEmail] = useState(user?.email || '');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);

  // SMTP Drawer pull-down on mobile & history/Esc key handling
  const [smtpTouchStart, setSmtpTouchStart] = useState<number | null>(null);
  const [smtpTouchDelta, setSmtpTouchDelta] = useState(0);

  const handleSmtpTouchStart = (e: React.TouchEvent) => {
    setSmtpTouchStart(e.touches[0].clientY);
    setSmtpTouchDelta(0);
  };

  const handleSmtpTouchMove = (e: React.TouchEvent) => {
    if (smtpTouchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - smtpTouchStart;
    if (diff > 0) {
      setSmtpTouchDelta(diff);
    }
  };

  const handleSmtpTouchEnd = () => {
    if (smtpTouchDelta > 90) {
      setIsSmtpModalOpen(false);
    }
    setSmtpTouchStart(null);
    setSmtpTouchDelta(0);
  };

  useEffect(() => {
    if (!isSmtpModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSmtpModalOpen(false);
      }
    };

    window.history.pushState({ smtpDrawerOpen: true }, '');

    const handlePopState = () => {
      setIsSmtpModalOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSmtpModalOpen]);

  useEffect(() => {
    if (settings) {
      if (settings.smtp_host) setSmtpHost(settings.smtp_host);
      if (settings.smtp_port) setSmtpPort(settings.smtp_port);
      if (settings.smtp_user) setSmtpUser(settings.smtp_user);
      if (settings.smtp_pass) setSmtpPass(settings.smtp_pass);
      if (settings.smtp_secure !== undefined) {
        setSmtpSecure(settings.smtp_secure === 'true' || settings.smtp_port === '465');
      }
      if (settings.smtp_from_name) setSmtpFromName(settings.smtp_from_name);
      if (settings.smtp_from_email) setSmtpFromEmail(settings.smtp_from_email);
    }
  }, [settings]);

  // Check if school already has custom SMTP configured in system settings
  const hasConfiguredSmtp = Boolean(
    settings?.smtp_host && settings.smtp_host.trim().length > 0 &&
    settings?.smtp_user && settings.smtp_user.trim().length > 0 &&
    settings?.smtp_pass && settings.smtp_pass.trim().length > 0
  );

  const handleTestSmtpConnection = async () => {
    if (!smtpHost.trim()) {
      toast.error('Por favor ingresa el Host del servidor SMTP');
      return false;
    }
    if (!smtpUser.trim()) {
      toast.error('Por favor ingresa el Usuario SMTP o correo');
      return false;
    }
    if (!smtpPass.trim()) {
      toast.error('Por favor ingresa la Contraseña SMTP o API Key');
      return false;
    }
    const testDest = smtpTestEmail.trim() || user?.email || '';
    if (!testDest) {
      toast.error('Por favor ingresa un correo electrónico de destino para la prueba');
      return false;
    }

    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await testSmtpConnection({
        host: smtpHost.trim(),
        port: smtpPort.trim() || '587',
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        secure: smtpSecure || smtpPort.trim() === '465',
        fromName: smtpFromName.trim() || school?.name || 'Colegio Montessori',
        fromEmail: smtpFromEmail.trim() || smtpUser.trim(),
        testEmail: testDest
      });
      setSmtpTestResult({ success: true, message: res.message || '¡Conexión SMTP verificada y correo de prueba enviado con éxito!' });
      toast.success(res.message || 'Servidor SMTP probado exitosamente');
      return true;
    } catch (err: any) {
      const errMsg = err.message || 'Error al conectar con el servidor SMTP';
      setSmtpTestResult({ success: false, message: errMsg });
      toast.error(errMsg);
      return false;
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSaveSmtpAndProceed = async () => {
    let passed = smtpTestResult?.success;
    if (!passed) {
      passed = await handleTestSmtpConnection();
    }
    if (!passed) {
      return;
    }

    setIsSavingSmtp(true);
    try {
      await updateSettings({
        smtp_host: smtpHost.trim(),
        smtp_port: smtpPort.trim() || '587',
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass.trim(),
        smtp_secure: smtpSecure ? 'true' : 'false',
        smtp_from_name: smtpFromName.trim() || school?.name || 'Colegio Montessori',
        smtp_from_email: smtpFromEmail.trim() || smtpUser.trim()
      });
      toast.success('Configuración SMTP verificada y guardada.');
      setIsSmtpModalOpen(false);
      setCurrentStep(4);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar configuración SMTP');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const getStorageTierLabel = (tier: string) => {
    switch (tier) {
      case 'byos_aws':
        return 'Almacenamiento Propio (AWS S3 / MinIO)';
      case '2gb_free':
        return '2 GB Base (Incluido)';
      case '12gb':
        return '12 GB Cloud (+10 GB)';
      case '22gb':
        return '22 GB Cloud (+20 GB)';
      case '52gb':
        return '52 GB Cloud (+50 GB)';
      default:
        return tier;
    }
  };

  const getEmailTierLabel = (tierId: string) => {
    const t = EMAIL_TIERS.find((item) => item.id === tierId);
    return t ? t.name : '500 Emails / mes';
  };

  const basePath = useMemo(() => {
    const p = window.location.pathname;
    if (p.startsWith('/console')) return '/console';
    if (p.startsWith('/admin')) return '/admin';
    return '/panel';
  }, []);

  // Wizard Step State (1: Ambientes, 2: Módulos, 3: Email Config [opcional], 3|4: Almacenamiento, 4|5: Confirmación & Pago)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Environments State
  const [existingEnvironments, setExistingEnvironments] = useState<EnvironmentItem[]>([]);
  const [selectedExistingEnvIds, setSelectedExistingEnvIds] = useState<string[]>([]);
  const [newEnvironments, setNewEnvironments] = useState<NewEnvironmentEntry[]>([]);
  const [newEnvNameInput, setNewEnvNameInput] = useState('');
  const [loadingEnvs, setLoadingEnvs] = useState(true);

  // Load real existing environments from DB
  useEffect(() => {
    getEnvironments()
      .then((data) => {
        setExistingEnvironments(data);
        if (data && data.length > 0) {
          // Select all existing environments by default
          setSelectedExistingEnvIds(data.map((e) => e.id));
        } else {
          // If 0 environments in DB, prefill with 2 recommended draft environments
          setSelectedExistingEnvIds([]);
          setNewEnvironments([
            { id: 'draft_env_1', name: 'Comunidad Infantil' },
            { id: 'draft_env_2', name: 'Casa de Niños' }
          ]);
        }
      })
      .catch((err) => {
        console.error('Error fetching environments:', err);
        setNewEnvironments([
          { id: 'draft_env_1', name: 'Comunidad Infantil' },
          { id: 'draft_env_2', name: 'Casa de Niños' }
        ]);
      })
      .finally(() => setLoadingEnvs(false));
  }, [school?.id]);

  // Total active environments in configuration
  const totalActiveEnvsCount = useMemo(() => {
    return selectedExistingEnvIds.length + newEnvironments.length;
  }, [selectedExistingEnvIds.length, newEnvironments.length]);

  // Active environments list for summary
  const activeEnvironmentsList = useMemo(() => {
    const existingSelected = existingEnvironments
      .filter((e) => selectedExistingEnvIds.includes(e.id))
      .map((e) => ({ id: e.id, name: e.name, isExisting: true }));
    const newOnes = newEnvironments.map((e) => ({ id: e.id, name: e.name, isExisting: false }));
    return [...existingSelected, ...newOnes];
  }, [existingEnvironments, selectedExistingEnvIds, newEnvironments]);

  const feat = (school?.features && typeof school.features === 'object') ? school.features : {};

  // Calculator state preloaded from school features
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(feat.billingCycle || 'monthly');
  const [storageTier, setStorageTier] = useState<'2gb_free' | '12gb' | '22gb' | '52gb' | 'byos_aws'>(feat.storageTier || '2gb_free');
  const [newsletterEmailTier, setNewsletterEmailTier] = useState<string>(feat.newsletterEmailTier || '500_included');

  const [selectedOptionalModules, setSelectedOptionalModules] = useState<{
    finances: boolean;
    websiteBuilder: boolean;
    forms: boolean;
    pipelines: boolean;
    newsletterSmtp: boolean;
  }>({
    finances: feat.finances ?? false,
    websiteBuilder: feat.webBuilder ?? feat.website ?? false,
    forms: feat.forms ?? false,
    pipelines: feat.pipelines ?? false,
    newsletterSmtp: feat.newsletters ?? false,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Toggle selection of an existing environment
  const toggleExistingEnv = (envId: string) => {
    setSelectedExistingEnvIds((prev) => {
      if (prev.includes(envId)) {
        return prev.filter((id) => id !== envId);
      } else {
        return [...prev, envId];
      }
    });
  };

  // Add a new environment
  const handleAddNewEnvironment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newEnvNameInput.trim();
    if (!trimmed) {
      toast.error('Por favor escribe el nombre del nuevo ambiente.');
      return;
    }

    const newEntry: NewEnvironmentEntry = {
      id: `new_env_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed
    };

    setNewEnvironments((prev) => [...prev, newEntry]);
    setNewEnvNameInput('');
    toast.success(`Ambiente "${trimmed}" agregado.`);
  };

  // Remove a newly added environment
  const handleRemoveNewEnv = (envId: string) => {
    setNewEnvironments((prev) => prev.filter((e) => e.id !== envId));
  };

  // Modular Pricing Real-time Calculation with 50% discount from 2nd environment
  const pricingSummary = useMemo(() => {
    // 1. Mandatory Core Base ($14 USD)
    const coreBaseTotal = 14;

    // 2. Environments Cost:
    // 1st environment = $25 USD
    // 2nd and subsequent = 50% discount ($10 USD each)
    let environmentsCost = 0;
    if (totalActiveEnvsCount === 1) {
      environmentsCost = PRICING_CONFIG.environmentTier1; // $25
    } else if (totalActiveEnvsCount > 1) {
      environmentsCost =
        PRICING_CONFIG.environmentTier1 +
        (totalActiveEnvsCount - 1) * PRICING_CONFIG.environmentTier2;
    }

    // 3. Optional Modules Cost
    let optionalModulesCost = 0;
    let selectedModulesCount = 0;
    if (selectedOptionalModules.finances) {
      optionalModulesCost += PRICING_CONFIG.finances;
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
    let newsletterCost = 0;
    if (selectedOptionalModules.newsletterSmtp) {
      const selectedTier = EMAIL_TIERS.find((t) => t.id === newsletterEmailTier) || EMAIL_TIERS[0];
      const extraCost = selectedTier.extraUnits * PRICING_CONFIG.newsletterSmtp;
      newsletterCost = PRICING_CONFIG.newsletterSmtp + extraCost;
      optionalModulesCost += newsletterCost;
      selectedModulesCount++;
    }

    // 4. Storage Cost
    let storageCost = 0;
    if (storageTier === '12gb') storageCost = PRICING_CONFIG.storage10GbUnit * 1;
    if (storageTier === '22gb') storageCost = PRICING_CONFIG.storage10GbUnit * 2;
    if (storageTier === '52gb') storageCost = PRICING_CONFIG.storage10GbUnit * 5;

    // Monthly Subtotal
    const monthlyTotal = coreBaseTotal + environmentsCost + optionalModulesCost + storageCost;

    // Annual Calculation (Pay 10 months, get 12 = 2 months free)
    const annualEquivalentMonthly = Math.round((monthlyTotal * 10) / 12);
    const annualBilledTotal = monthlyTotal * 10;

    return {
      coreBaseTotal,
      environmentsCost,
      optionalModulesCost,
      newsletterCost,
      selectedModulesCount,
      storageCost,
      monthlyTotal,
      annualEquivalentMonthly,
      annualBilledTotal
    };
  }, [totalActiveEnvsCount, selectedOptionalModules, newsletterEmailTier, storageTier]);

  const maxStep = selectedOptionalModules.newsletterSmtp ? 5 : 4;
  const isEmailStep = selectedOptionalModules.newsletterSmtp && currentStep === 3;
  const isStorageStep =
    (selectedOptionalModules.newsletterSmtp && currentStep === 4) ||
    (!selectedOptionalModules.newsletterSmtp && currentStep === 3);

  const handleProceedToNextStep = () => {
    if (currentStep === 1) {
      if (totalActiveEnvsCount < 1) {
        toast.error('Se requiere como mínimo 1 ambiente configurado para tu colegio.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedOptionalModules.newsletterSmtp) {
        // Step 3 was Email Config -> If byo_smtp is selected, open SMTP drawer
        if (newsletterEmailTier === 'byo_smtp') {
          setIsSmtpModalOpen(true);
          return;
        }
        setCurrentStep(4);
      } else {
        // Step 3 was Storage -> Check BYOS drawer or go to Step 4 (Confirmation)
        if (storageTier === 'byos_aws') {
          setIsStorageModalOpen(true);
          return;
        }
        setCurrentStep(4);
      }
    } else if (currentStep === 4) {
      if (selectedOptionalModules.newsletterSmtp) {
        // Step 4 was Storage -> Check BYOS drawer or go to Step 5 (Confirmation)
        if (storageTier === 'byos_aws') {
          setIsStorageModalOpen(true);
          return;
        }
        setCurrentStep(5);
      }
    }
  };

  const handleProceedToPayment = async () => {
    if (totalActiveEnvsCount < 1) {
      toast.error('No se puede crear un plan con 0 salones. Debes seleccionar al menos 1 ambiente.');
      setCurrentStep(1);
      return;
    }
    if (!school) return;
    setIsSaving(true);
    try {
      // Save desired configuration in features
      const payload = {
        features: {
          ...feat,
          finances: selectedOptionalModules.finances,
          webBuilder: selectedOptionalModules.websiteBuilder,
          website: selectedOptionalModules.websiteBuilder,
          forms: selectedOptionalModules.forms,
          pipelines: selectedOptionalModules.pipelines,
          newsletters: selectedOptionalModules.newsletterSmtp,
          newsletterEmailTier: selectedOptionalModules.newsletterSmtp ? newsletterEmailTier : undefined,
          storageTier,
          billingCycle,
          configuredEnvironmentsCount: totalActiveEnvsCount
        }
      };

      const res = await fetch(`/api/schools/${school.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error al sincronizar configuración del plan');
      }

      toast.success('Configuración de suscripción guardada.');
      toast.info('Redirigiendo a pasarela segura de pago...');

      const environmentsListStr = activeEnvironmentsList.map((e, idx) => `  ${idx + 1}. ${e.name} ${e.isExisting ? '(Existente)' : '(Nuevo)'}`).join('\n');
      const optionalModulesStr = [
        selectedOptionalModules.finances ? 'Finanzas Escolares & Facturación' : null,
        selectedOptionalModules.websiteBuilder ? 'Creador de Sitios Web' : null,
        selectedOptionalModules.forms ? 'Formularios Dinámicos & Encuestas' : null,
        selectedOptionalModules.pipelines ? 'Pipelines de Admisión & CRM' : null,
        selectedOptionalModules.newsletterSmtp ? `Gestión de Boletines (${getEmailTierLabel(newsletterEmailTier)})` : null
      ].filter(Boolean).join(', ') || 'Ninguno';

      const subject = encodeURIComponent(`Activación Suscripción Colegio ${school.name}`);
      const body = encodeURIComponent(
        `Hola Equipo de Montessori Nexus,\n\nDeseo activar la membresía para el colegio: ${school.name} (${school.slug})\n\nConfiguración elegida:\n- Ambientes (${totalActiveEnvsCount}):\n${environmentsListStr}\n\n- Facturación: ${billingCycle === 'annual' ? 'Anual (2 meses gratis)' : 'Mensual'}\n- Módulos opcionales: ${optionalModulesStr}\n- Almacenamiento: ${getStorageTierLabel(storageTier)}\n- Total estimado: $${billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal} USD/mes (Facturado: $${billingCycle === 'annual' ? pricingSummary.annualBilledTotal : pricingSummary.monthlyTotal} USD)\n\nPor favor envíenme el enlace de pago seguro con tarjeta o los datos para transferencia bancaria SPEI.`
      );
      window.location.href = `mailto:soporte@montessorinexus.com?subject=${subject}&body=${body}`;
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar suscripción');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-body animate-in fade-in duration-300 pb-32 xl:pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* TOP HEADER HERO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-forest/10 pb-6 pt-2">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/dashboard`)}
            className="inline-flex items-center gap-2 text-xs font-bold text-forest hover:text-forest/80 hover:underline mb-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center border border-forest/15 shadow-2xs">
              <Sparkles className="w-5 h-5 text-forest" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white">
                Arma tu Suscripción a la Medida
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Configura los salones, herramientas y almacenamiento para tu colegio <strong className="text-slate-900 dark:text-white">{school?.name}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="p-1.5 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-forest shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pago Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-forest text-white shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Pago Anual</span>
            <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full font-black">
              2 MESES GRATIS
            </span>
          </button>
        </div>
      </div>

      {/* STEP INDICATOR BAR */}
      <div className="bg-stone-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        {(selectedOptionalModules.newsletterSmtp
          ? [
              { step: 1, label: '1. Ambientes', icon: Building2 },
              { step: 2, label: '2. Módulos', icon: Layers },
              { step: 3, label: '3. Envío de Emails', icon: Mail },
              { step: 4, label: '4. Almacenamiento', icon: HardDrive },
              { step: 5, label: '5. Resumen y Pago', icon: CreditCard }
            ]
          : [
              { step: 1, label: '1. Ambientes', icon: Building2 },
              { step: 2, label: '2. Módulos Opcionales', icon: Layers },
              { step: 3, label: '3. Almacenamiento', icon: HardDrive },
              { step: 4, label: '4. Resumen y Pago', icon: CreditCard }
            ]
        ).map((s) => {
          const StepIcon = s.icon;
          const isCurrent = currentStep === s.step;
          const isPassed = currentStep > s.step;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                if (s.step > 1 && totalActiveEnvsCount < 1) {
                  toast.error('Configura al menos 1 ambiente en el Paso 1 antes de continuar.');
                  return;
                }
                setCurrentStep(s.step as any);
              }}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-forest text-white shadow-xs'
                  : isPassed
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'text-muted-foreground hover:text-slate-900 hover:bg-stone-200/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isCurrent ? 'bg-white text-forest font-black' : isPassed ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-slate-700 text-stone-600'
              }`}>
                {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : s.step}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN RESPONSIVE WIZARD CONTAINER */}
      <div className="flex flex-col xl:flex-row items-start gap-8">
        {/* LEFT COLUMN: ACTIVE STEP CONTENT */}
        <div className="w-full xl:flex-1 min-w-0 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: AMBIENTES */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                      Paso 1 de {maxStep} • Salones Escolares
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <Tag className="w-3 h-3" />
                      50% OFF a partir del 2º ambiente
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                    Selecciona y agrega los ambientes de tu colegio
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Marca los salones existentes que deseas mantener activos o añade nuevos ambientes. El 1er ambiente cuesta $25 USD y cada ambiente adicional tiene un <strong>50% de descuento ($10 USD)</strong>.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-forest bg-forest/10 px-3 py-1.5 rounded-xl inline-block">
                    ${pricingSummary.environmentsCost} USD/mes
                  </span>
                </div>
              </div>

              {/* Existing Environments Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ambientes Actuales en tu Cuenta ({existingEnvironments.length})
                  </h4>
                  {existingEnvironments.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExistingEnvIds(existingEnvironments.map((e) => e.id))}
                        className="text-[11px] font-bold text-forest hover:underline cursor-pointer"
                      >
                        Marcar todos
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExistingEnvIds([])}
                        className="text-[11px] font-bold text-muted-foreground hover:underline cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    </div>
                  )}
                </div>

                {existingEnvironments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {existingEnvironments.map((env, idx) => {
                      const isSelected = selectedExistingEnvIds.includes(env.id);
                      return (
                        <div
                          key={env.id}
                          onClick={() => toggleExistingEnv(env.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-forest bg-forest/5 ring-1 ring-forest/20 shadow-2xs'
                              : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/40 opacity-60 hover:opacity-100 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-forest border-forest text-white' : 'border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold block truncate text-slate-900 dark:text-white">
                                {env.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {env.stage || 'Ambiente Montessori'} {env.capacity ? `• Capacidad: ${env.capacity}` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-stone-500 dark:text-slate-400 shrink-0">
                            #{idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-stone-300 dark:border-slate-700 text-center text-xs text-muted-foreground">
                    No se encontraron salones registrados previamente. Puedes escribir los nombres de tus ambientes abajo:
                  </div>
                )}
              </div>

              {/* Newly Added Environments List */}
              {newEnvironments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Nuevos Ambientes Agregados al Plan ({newEnvironments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {newEnvironments.map((env, idx) => (
                      <div
                        key={env.id}
                        className="p-4 rounded-2xl border border-forest/40 bg-forest/5 dark:bg-emerald-950/20 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-5 h-5 rounded-md bg-forest text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate text-slate-900 dark:text-white">
                              {env.name}
                            </span>
                            <span className="text-[10px] text-forest dark:text-emerald-400 font-semibold block">
                              Nuevo Salón
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewEnv(env.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                          title="Eliminar ambiente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form to add more environments */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-forest" />
                  <span>Agregar un Nuevo Ambiente al Plan</span>
                </h4>
                <form onSubmit={handleAddNewEnvironment} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={newEnvNameInput}
                    onChange={(e) => setNewEnvNameInput(e.target.value)}
                    placeholder="Ej. Nido / Bebés, Comunidad Infantil II, Taller I..."
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Ambiente</span>
                  </button>
                </form>
              </div>

              {/* Validation Warning & Summary Badge */}
              <div className="pt-2">
                {totalActiveEnvsCount === 0 ? (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center gap-3 text-red-900 dark:text-red-200 text-xs">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">Mínimo 1 ambiente requerido</strong>
                      <span>No se admiten escuelas con 0 salones. Por favor marca al menos un salón existente o agrega un nuevo ambiente para continuar.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-forest/5 dark:bg-emerald-500/10 border border-forest/15 flex items-center justify-between gap-4 flex-wrap text-xs">
                    <div className="flex items-center gap-2 font-bold text-forest dark:text-emerald-400">
                      <Building2 className="w-4 h-4" />
                      <span>{totalActiveEnvsCount} {totalActiveEnvsCount === 1 ? 'Ambiente configurado' : 'Ambientes configurados'}</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {totalActiveEnvsCount === 1 ? (
                        <span>1 salón base = $25 USD/mes</span>
                      ) : (
                        <span>1 salón base ($25) + {totalActiveEnvsCount - 1} adicional{totalActiveEnvsCount - 1 > 1 ? 'es' : ''} con 50% OFF (${(totalActiveEnvsCount - 1) * PRICING_CONFIG.environmentTier2}) = ${pricingSummary.environmentsCost} USD/mes</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="flex justify-end pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={totalActiveEnvsCount < 1}
                  onClick={handleProceedToNextStep}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                    totalActiveEnvsCount < 1
                      ? 'bg-stone-300 dark:bg-slate-800 text-stone-500 cursor-not-allowed opacity-60'
                      : 'bg-forest hover:bg-forest/90 text-white hover:scale-102 active:scale-98 cursor-pointer'
                  }`}
                >
                  <span>Siguiente: Módulos Opcionales</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: OPTIONAL MODULES */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                    Paso 2 de {maxStep} • Módulos a la Carta
                  </span>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                    Selecciona herramientas opcionales
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agrega únicamente las herramientas especializadas que requiere tu equipo administrativo.
                  </p>
                </div>
                <span className="text-xs font-bold font-mono text-forest bg-forest/10 px-3 py-1.5 rounded-xl shrink-0">
                  +${pricingSummary.optionalModulesCost} USD/mes
                </span>
              </div>

              <div className="space-y-3">
                {/* Cobranza & Finanzas */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.finances
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.finances}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, finances: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Cobranza, Colegiaturas & Facturación Electrónica
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Planes de pago flexibles, cargos recurrentes, suscripciones automatizadas, estados de cuenta y recordatorios automáticos.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.finances} USD/mes
                  </span>
                </label>

                {/* Website + Web Builder + Analytics */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.websiteBuilder
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.websiteBuilder}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, websiteBuilder: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Diseñador Web Visual Pro + Dominio Propio
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Editor de landing page de alta conversión, analíticas de tráfico web en vivo y SEO optimizado.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.websiteBuilder} USD/mes
                  </span>
                </label>

                {/* Formularios Pro */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.forms
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.forms}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedOptionalModules((prev) => ({
                          ...prev,
                          forms: isChecked,
                          pipelines: isChecked ? prev.pipelines : false
                        }));
                      }}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Gestor de Formularios & Encuestas Dinámicas
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Crea formularios de contacto, encuestas de satisfacción, pre-matrículas y recolección de firmas.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.forms} USD/mes
                  </span>
                </label>

                {/* Pipelines */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.pipelines
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.pipelines}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedOptionalModules((prev) => ({
                          ...prev,
                          pipelines: isChecked,
                          forms: isChecked ? true : prev.forms
                        }));
                      }}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Pipelines de Procesos Configurables
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-forest/10 text-forest dark:text-emerald-400 border border-forest/20">
                          Requiere Formularios
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Crea y personaliza flujos con tableros Kanban para admisiones, contratación, reinscripciones, etc.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    +${PRICING_CONFIG.pipelines} USD/mes
                  </span>
                </label>

                {/* Modulo de gestion de Boletines */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  selectedOptionalModules.newsletterSmtp
                    ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:bg-stone-100/60'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedOptionalModules.newsletterSmtp}
                      onChange={(e) => setSelectedOptionalModules({ ...selectedOptionalModules, newsletterSmtp: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-forest mt-0.5 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Módulo de gestión de Boletines
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Incluye 500 emails/mes
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Envío masivo de circulares, plantillas visuales con fotos, boletines periódicos y registro de aperturas.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-forest dark:text-emerald-400 whitespace-nowrap">
                    Desde ${PRICING_CONFIG.newsletterSmtp} USD/mes
                  </span>
                </label>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior: Ambientes</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToNextStep}
                  className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span>
                    {selectedOptionalModules.newsletterSmtp
                      ? 'Siguiente: Envío de Emails'
                      : 'Siguiente: Almacenamiento'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3 (DYNAMIC): NEWSLETTER EMAIL PACKAGE CONFIGURATION */}
          {/* ========================================================================= */}
          {selectedOptionalModules.newsletterSmtp && currentStep === 3 && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                    Paso 3 de 5 • Configuración de Envíos
                  </span>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                    Configuración de Envío de Emails y Boletines
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona tu paquete mensual de envíos para boletines o conecta tu propio servidor SMTP sin límites.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-forest bg-forest/10 px-3 py-1.5 rounded-xl inline-block">
                    +${pricingSummary.newsletterCost} USD/mes
                  </span>
                </div>
              </div>

              {/* Email Packages Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EMAIL_TIERS.map((tier) => {
                  const isSelected = newsletterEmailTier === tier.id;
                  const extraCost = tier.extraUnits * PRICING_CONFIG.newsletterSmtp;
                  const totalTierCost = (PRICING_CONFIG.newsletterSmtp + extraCost).toFixed(2);

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setNewsletterEmailTier(tier.id)}
                      className={`p-4 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                        tier.isSmtp ? 'sm:col-span-2' : ''
                      } ${
                        isSelected
                          ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs'
                          : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                          isSelected
                            ? 'border-forest bg-forest text-white'
                            : 'border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold ${
                              isSelected ? 'text-forest dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                            }`}>
                              {tier.name}
                            </span>
                            {tier.id === '500_included' && (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                Incluido
                              </span>
                            )}
                            {tier.isSmtp && (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                                Ilimitado + Externos
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                            {tier.desc}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pt-0.5">
                        {tier.id === '500_included' || tier.isSmtp ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block whitespace-nowrap">
                            100% gratis
                          </span>
                        ) : (
                          <>
                            <span className={`text-xs font-mono font-bold block whitespace-nowrap ${
                              isSelected ? 'text-forest dark:text-emerald-400' : 'text-stone-700 dark:text-slate-300'
                            }`}>
                              ${totalTierCost} USD/mes
                            </span>
                            {extraCost > 0 && (
                              <span className="text-[9.5px] text-muted-foreground font-mono block whitespace-nowrap">
                                (+${extraCost.toFixed(2)} adicional)
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Info / Tutorial Box based on selection */}
              {newsletterEmailTier === 'byo_smtp' ? (
                <div className="space-y-4 pt-1">
                  {hasConfiguredSmtp ? (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                            Servidor SMTP Propio Vinculado y Activo
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                            {settings.smtp_host}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80">
                          Tu colegio ya tiene configurado el host <strong className="font-mono text-emerald-950 dark:text-white">{settings.smtp_host}</strong> ({settings.smtp_user}). Tus boletines escolares se enviarán de forma directa e ilimitada.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 sm:p-6 rounded-3xl border border-sky-300/80 dark:border-sky-500/30 bg-sky-50/70 dark:bg-sky-950/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-xs shrink-0">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-sky-100">
                              Guía Rápida: Conectar tu Servidor SMTP Saliente
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200">
                              Envíos ilimitados a comunidad y destinatarios externos
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                            Envía boletines y comunicados masivos sin límites a padres, docentes y listas de contactos externos conectando tu propio proveedor de correo saliente.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-sky-200/60 dark:border-slate-800 space-y-1.5 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Obtener Credenciales</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Obtén el host, puerto, usuario y contraseña o API Key de tu proveedor de correo (ej: SendGrid, AWS SES o Gmail).
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-sky-200/60 dark:border-slate-800 space-y-1.5 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Ingresar Configuración</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Al hacer clic en <strong>Configurar Envío de Emails</strong> podrás elegir un preset rápido o escribir tus datos manualmente.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-sky-200/60 dark:border-slate-800 space-y-1.5 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Probar y Validar</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            El sistema enviará un correo de prueba en vivo a tu bandeja para validar que todo funcione antes de avanzar.
                          </p>
                        </div>
                      </div>

                      {/* Resend.com Recommendation Callout */}
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-sky-200 dark:border-slate-800 flex items-center gap-2.5 text-xs shadow-2xs">
                        <span className="text-base shrink-0">💡</span>
                        <p className="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
                          <strong className="text-slate-900 dark:text-white font-semibold">Recomendación:</strong> Recomendamos el uso de <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-forest dark:text-emerald-400 font-bold underline underline-offset-2 hover:opacity-80">resend.com</a>, el cual ofrece <strong>3,000 emails transaccionales gratis al mes</strong> con excelente entregabilidad y configuración rápida.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Alcance de los Paquetes Gestionados: Solo Comunidad Escolar</span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                    Los paquetes mensuales gestionados por Montessori Nexus incluyen envíos dirigidos <strong>exclusivamente a los correos registrados de padres de familia, tutores y docentes</strong> del colegio. No incluyen envíos a listas externas.
                  </p>
                  <p className="text-[10.5px] text-muted-foreground pt-0.5">
                    💡 Para enviar circulares o boletines a destinatarios externos, prospectos o exalumnos, selecciona la opción <strong>Servidor SMTP Propio</strong>.
                  </p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior: Módulos</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToNextStep}
                  className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span>
                    {newsletterEmailTier === 'byo_smtp'
                      ? 'Configurar Envío de Emails'
                      : 'Siguiente: Almacenamiento'}
                  </span>
                  {newsletterEmailTier === 'byo_smtp' ? (
                    <Settings className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3 or 4: STORAGE SELECTION */}
          {/* ========================================================================= */}
          {isStorageStep && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                    Paso {selectedOptionalModules.newsletterSmtp ? '4 de 5' : '3 de 4'} • Almacenamiento Seguro
                  </span>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                    Bóveda de Expedientes & Galería de Fotos
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Espacio seguro en la nube para fotos del diario Montessori, actas y documentos médicos.
                  </p>
                </div>
                <span className="text-xs font-bold font-mono text-forest bg-forest/10 px-3 py-1.5 rounded-xl shrink-0">
                  {storageTier === '2gb_free' || storageTier === 'byos_aws' ? '$0 USD' : storageTier === '12gb' ? '+$5 USD/mes' : storageTier === '22gb' ? '+$10 USD/mes' : '+$25 USD/mes'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: '2gb_free', label: '2 GB Base (Incluido Gratis)', desc: 'Espacio gratuito incluido', price: 'Incluido ($0)' },
                  { id: '12gb', label: '12 GB Cloud (+10 GB)', desc: 'Ideal para bitácoras', price: '+$5 USD/mes' },
                  { id: '22gb', label: '22 GB Cloud (+20 GB)', desc: 'Uso intensivo de fotos', price: '+$10 USD/mes' },
                  { id: '52gb', label: '52 GB Cloud (+50 GB)', desc: 'Colegios grandes', price: '+$25 USD/mes' },
                  { id: 'byos_aws', label: 'Tu Propio Almacenamiento (S3)', desc: 'Conecta tu bucket S3 o MinIO', price: 'Sin costo ($0)' }
                ].map((tier) => {
                  const isSelected = storageTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setStorageTier(tier.id as any)}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs' : 'border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-forest bg-forest text-white' : 'border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${isSelected ? 'text-forest dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>{tier.label}</span>
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">{tier.desc}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 ${isSelected ? 'text-forest dark:text-emerald-400' : 'text-stone-600 dark:text-slate-400'}`}>
                        {tier.price}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep((selectedOptionalModules.newsletterSmtp ? 3 : 2) as any)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior: {selectedOptionalModules.newsletterSmtp ? 'Envío de Emails' : 'Módulos'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToNextStep}
                  className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span>
                    {storageTier === 'byos_aws' ? 'Configurar Almacenamiento' : 'Siguiente: Resumen & Confirmación'}
                  </span>
                  {storageTier === 'byos_aws' ? <Settings className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4 or 5: REVIEW & CONFIRMATION */}
          {/* ========================================================================= */}
          {currentStep === maxStep && (
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#162218] shadow-sm space-y-6 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                  Paso {maxStep} de {maxStep} • Confirmación
                </span>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
                  Revisión Final de tu Plan Personalizado
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Verifica el desglose de tu suscripción antes de continuar a la activación y pago.
                </p>
              </div>

              {/* Core Inclusions Info */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Módulos Esenciales Incluidos (100% Gratis con Membresía Base $14 USD)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Incluido
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Portal de Familias</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Portal de Guías</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Seguimiento Montessori</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Pase de Asistencia</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Trackers de Hábitos</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Bóveda de Expedientes</span>
                </div>
              </div>

              {/* Configured Environments List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ambientes que se activarán ({totalActiveEnvsCount}):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeEnvironmentsList.map((env, idx) => (
                    <div
                      key={env.id}
                      className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {idx + 1}. {env.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 shrink-0">
                        {env.isExisting ? 'Existente' : 'Nuevo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Modules Selected List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Módulos Adicionales Seleccionados ({pricingSummary.selectedModulesCount}):
                  </h4>
                  {pricingSummary.optionalModulesCost > 0 && (
                    <span className="text-xs font-bold font-mono text-forest dark:text-emerald-400">
                      +${pricingSummary.optionalModulesCost} USD/mes
                    </span>
                  )}
                </div>

                {pricingSummary.selectedModulesCount > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedOptionalModules.finances && (
                      <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            Finanzas Escolares & Facturación
                          </span>
                        </div>
                        <span className="font-mono font-bold text-forest dark:text-emerald-400 shrink-0">
                          +${PRICING_CONFIG.finances} USD/mes
                        </span>
                      </div>
                    )}

                    {selectedOptionalModules.websiteBuilder && (
                      <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            Creador de Sitios Web Escolar
                          </span>
                        </div>
                        <span className="font-mono font-bold text-forest dark:text-emerald-400 shrink-0">
                          +${PRICING_CONFIG.websiteBuilder} USD/mes
                        </span>
                      </div>
                    )}

                    {selectedOptionalModules.forms && (
                      <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            Formularios Dinámicos & Encuestas
                          </span>
                        </div>
                        <span className="font-mono font-bold text-forest dark:text-emerald-400 shrink-0">
                          +${PRICING_CONFIG.forms} USD/mes
                        </span>
                      </div>
                    )}

                    {selectedOptionalModules.pipelines && (
                      <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            Pipelines de Admisión & CRM
                          </span>
                        </div>
                        <span className="font-mono font-bold text-forest dark:text-emerald-400 shrink-0">
                          +${PRICING_CONFIG.pipelines} USD/mes
                        </span>
                      </div>
                    )}

                    {selectedOptionalModules.newsletterSmtp && (
                      <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 flex items-center justify-between gap-2 text-xs sm:col-span-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              Módulo de Gestión de Boletines
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground block pl-4">
                            Paquete: {getEmailTierLabel(newsletterEmailTier)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-forest dark:text-emerald-400 shrink-0">
                          +${pricingSummary.newsletterCost} USD/mes
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-dashed border-stone-300 dark:border-slate-800 text-xs text-muted-foreground text-center">
                    Sin módulos adicionales (se activarán solo los módulos base incluidos en la membresía).
                  </div>
                )}
              </div>

              {/* Storage Review Card */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400">
                  Almacenamiento en la Nube
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {getStorageTierLabel(storageTier)}
                  </span>
                  <span className="font-mono font-bold text-forest dark:text-emerald-400">
                    {pricingSummary.storageCost > 0 ? `+$${pricingSummary.storageCost} USD/mes` : 'Incluido'}
                  </span>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep((maxStep - 1) as any)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior: Almacenamiento</span>
                </button>
                <button
                  type="button"
                  disabled={isSaving || totalActiveEnvsCount < 1}
                  onClick={handleProceedToPayment}
                  className="px-7 py-3 bg-forest hover:bg-forest/90 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Activar y Pagar Suscripción'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
        <div className={`w-full xl:w-[360px] xl:min-w-[320px] xl:max-w-[400px] shrink-0 xl:sticky xl:top-6 space-y-4 ${
          currentStep === maxStep ? 'block' : 'hidden xl:block'
        }`}>
          <div className="p-6 sm:p-7 rounded-3xl border-2 border-forest bg-white dark:bg-[#162218] shadow-xl space-y-6">
            <div className="flex items-center justify-between gap-2 border-b border-forest/15 pb-4">
              <div>
                <span className="text-[10px] font-bold text-forest dark:text-emerald-400 uppercase tracking-widest block">Resumen de Membresía</span>
                <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white">{school?.name || 'Colegio'}</h4>
              </div>
            </div>

            {/* Total Price Display */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <AnimatedPriceCounter
                  value={billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal}
                  className="text-4xl sm:text-5xl font-display font-black text-forest dark:text-emerald-400"
                />
                <span className="text-xs font-bold text-muted-foreground">USD / mes</span>
              </div>
            </div>

            {/* List items */}
            <div className="space-y-2.5 text-xs border-t border-stone-200 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Ambientes ({totalActiveEnvsCount})</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">${pricingSummary.environmentsCost} USD/mes</span>
              </div>

              {selectedOptionalModules.finances && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="truncate pr-2">Finanzas & Facturación</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                    +${PRICING_CONFIG.finances} USD/mes
                  </span>
                </div>
              )}

              {selectedOptionalModules.websiteBuilder && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="truncate pr-2">Creador de Sitios Web</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                    +${PRICING_CONFIG.websiteBuilder} USD/mes
                  </span>
                </div>
              )}

              {selectedOptionalModules.forms && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="truncate pr-2">Formularios & Encuestas</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                    +${PRICING_CONFIG.forms} USD/mes
                  </span>
                </div>
              )}

              {selectedOptionalModules.pipelines && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="truncate pr-2">Pipelines & CRM</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                    +${PRICING_CONFIG.pipelines} USD/mes
                  </span>
                </div>
              )}

              {selectedOptionalModules.newsletterSmtp && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="truncate pr-2">Gestión de Boletines ({getEmailTierLabel(newsletterEmailTier)})</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                    +${pricingSummary.newsletterCost} USD/mes
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-muted-foreground">
                <span className="truncate pr-2">Almacenamiento ({getStorageTierLabel(storageTier)})</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                  {pricingSummary.storageCost > 0 ? `+$${pricingSummary.storageCost} USD/mes` : '$0 USD/mes'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 xl:hidden bg-white/95 dark:bg-[#162218]/95 backdrop-blur-md border-t border-forest/20 shadow-2xl p-3 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
        <div className="space-y-0.5 min-w-0">
          <span className="text-lg font-display font-black text-forest dark:text-emerald-400">
            ${billingCycle === 'annual' ? pricingSummary.annualEquivalentMonthly : pricingSummary.monthlyTotal} USD/mes
          </span>
        </div>
        <div>
          {currentStep < maxStep ? (
            <button
              type="button"
              disabled={totalActiveEnvsCount < 1}
              onClick={handleProceedToNextStep}
              className="px-4 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>
                {isEmailStep && newsletterEmailTier === 'byo_smtp'
                  ? 'Configurar Emails'
                  : isStorageStep && storageTier === 'byos_aws'
                  ? 'Configurar Storage'
                  : `Paso ${currentStep + 1}`}
              </span>
              {(isEmailStep && newsletterEmailTier === 'byo_smtp') || (isStorageStep && storageTier === 'byos_aws') ? (
                <Settings className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving || totalActiveEnvsCount < 1}
              onClick={handleProceedToPayment}
              className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Activar Plan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STORAGE CONFIGURATION DRAWER */}
      {/* ========================================================================= */}
      {isStorageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsStorageModalOpen(false)}
          className="fixed inset-0 z-50 flex justify-end items-end sm:items-stretch bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={touchDelta > 0 ? { transform: `translateY(${touchDelta}px)` } : undefined}
            className="w-full sm:max-w-xl lg:max-w-2xl bg-white dark:bg-[#162218] border-t sm:border-t-0 sm:border-l border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col h-[90dvh] sm:h-full max-h-[92dvh] sm:max-h-full overflow-hidden transition-transform duration-300 ease-out animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:slide-in-from-right"
          >
            {/* Pull-down Drag Handle for Mobile */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-slate-700" />
            </div>

            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-stone-50/80 dark:bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-forest text-white shadow-xs shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-white leading-tight">
                    Configurar Almacenamiento (AWS S3 o MinIO)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ingresa y valida tus credenciales de almacenamiento cifrado antes de continuar.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(false)}
                className="hidden sm:flex p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Center Content Area */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Driver Type Selector (AWS S3 vs MinIO) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tipo de Proveedor de Almacenamiento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStorageDriver('s3');
                      setTestResult(null);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      storageDriver === 's3'
                        ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs'
                        : 'border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 hover:border-stone-400'
                    }`}
                  >
                    <Cloud className={`w-5 h-5 shrink-0 ${storageDriver === 's3' ? 'text-forest dark:text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-bold text-xs block text-slate-900 dark:text-white">
                        Amazon AWS S3
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Cloud oficial de Amazon Web Services
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStorageDriver('minio');
                      setStorageForcePathStyle(true);
                      setTestResult(null);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      storageDriver === 'minio'
                        ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs'
                        : 'border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40 hover:border-stone-400'
                    }`}
                  >
                    <Server className={`w-5 h-5 shrink-0 ${storageDriver === 'minio' ? 'text-forest dark:text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-bold text-xs block text-slate-900 dark:text-white">
                        MinIO / S3 Compatible
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Servidor propio on-premise o cloud
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* MinIO Endpoint if MinIO */}
              {storageDriver === 'minio' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Endpoint de MinIO / Servidor S3 *
                  </label>
                  <input
                    type="text"
                    value={storageEndpoint}
                    onChange={(e) => {
                      setStorageEndpoint(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="https://minio.tudominio.com o http://192.168.1.50:9000"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-forest outline-none"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    URL completa del servidor MinIO incluyendo protocolo (http:// o https://).
                  </span>
                </div>
              )}

              {/* Bucket & Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Nombre del Bucket Privado *
                  </label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => {
                      setStorageBucket(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="ej. colegio-expedientes-privado"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-forest outline-none"
                  />
                </div>

                <CustomRegionDropdown
                  value={storageRegion}
                  driver={storageDriver}
                  isCustomRegion={isCustomRegion}
                  onChange={(newReg) => {
                    setStorageRegion(newReg);
                    setTestResult(null);
                  }}
                  onToggleCustom={(isCustom) => {
                    setIsCustomRegion(isCustom);
                    setTestResult(null);
                  }}
                />
              </div>

              {/* Access Key ID */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Access Key ID (Clave de Acceso) *
                </label>
                <input
                  type="text"
                  value={storageAccessKeyId}
                  onChange={(e) => {
                    setStorageAccessKeyId(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-forest outline-none"
                />
              </div>

              {/* Secret Access Key */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Secret Access Key (Clave Secreta API) *
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={storageSecretAccessKey}
                    onChange={(e) => {
                      setStorageSecretAccessKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    className="w-full p-2.5 pr-10 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-forest outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer p-1"
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Test Result Message Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-2.5 animate-in fade-in duration-200 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-500/40 text-red-900 dark:text-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span className="font-bold block text-xs">
                      {testResult.success ? 'Conexión Exitosa' : 'Fallo en la Conexión'}
                    </span>
                    <p className="text-[11px] opacity-90 leading-tight">
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Drawer Footer */}
            <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-slate-800 bg-stone-50/90 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                disabled={testingStorage || isSavingStorage}
                onClick={handleTestStorageConnection}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {testingStorage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Probando Conexión...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Probar Conexión</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsStorageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={testingStorage || isSavingStorage}
                  onClick={handleSaveStorageAndProceed}
                  className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSavingStorage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span>Guardar y Continuar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SMTP CONFIGURATION DRAWER (RIGHT DRAWER ON DESKTOP / BOTTOM SHEET ON MOBILE) */}
      {/* ========================================================================= */}
      {isSmtpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsSmtpModalOpen(false)}
          className="fixed inset-0 z-50 flex justify-end items-end sm:items-stretch bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSmtpTouchStart}
            onTouchMove={handleSmtpTouchMove}
            onTouchEnd={handleSmtpTouchEnd}
            style={smtpTouchDelta > 0 ? { transform: `translateY(${smtpTouchDelta}px)` } : undefined}
            className="w-full sm:max-w-xl lg:max-w-2xl bg-white dark:bg-[#162218] border-t sm:border-t-0 sm:border-l border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col h-[90dvh] sm:h-full max-h-[92dvh] sm:max-h-full overflow-hidden transition-transform duration-300 ease-out animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:slide-in-from-right"
          >
            {/* Pull-down Drag Handle for Mobile */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-slate-700" />
            </div>

            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-stone-50/80 dark:bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-sky-600 text-white shadow-xs shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-white leading-tight">
                    Configurar Servidor SMTP Propio
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ingresa las credenciales de tu proveedor de correo saliente para envíos ilimitados.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsSmtpModalOpen(false)}
                className="hidden sm:flex p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Center Content Area */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Quick Fill Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Proveedores Populares (Prellenado Rápido)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SMTP_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setSmtpHost(preset.host);
                        setSmtpPort(preset.port);
                        setSmtpSecure(preset.secure);
                        setSmtpTestResult(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        smtpHost === preset.host
                          ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30'
                          : 'border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-stone-400'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Host del Servidor SMTP *
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => {
                      setSmtpHost(e.target.value);
                      setSmtpTestResult(null);
                    }}
                    placeholder="smtp.gmail.com o smtp.sendgrid.net"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Puerto *
                  </label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSmtpPort(val);
                      if (val === '465') setSmtpSecure(true);
                      if (val === '587') setSmtpSecure(false);
                      setSmtpTestResult(null);
                    }}
                    placeholder="587"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Security / SSL Toggle */}
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Cifrado SSL / TLS Seguro
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Activar para puerto 465 (SSL/TLS directo) o desactivar para 587 (STARTTLS).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smtpSecure}
                  onChange={(e) => {
                    setSmtpSecure(e.target.checked);
                    setSmtpTestResult(null);
                  }}
                  className="w-5 h-5 rounded-md accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Username / Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Usuario SMTP / Correo / API Key *
                </label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => {
                    setSmtpUser(e.target.value);
                    if (!smtpFromEmail) setSmtpFromEmail(e.target.value);
                    setSmtpTestResult(null);
                  }}
                  placeholder="apikey, tu-usuario o tu-correo@colegio.com"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              {/* Password / API Secret Key */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Contraseña SMTP / Secret Key *
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={smtpPass}
                    onChange={(e) => {
                      setSmtpPass(e.target.value);
                      setSmtpTestResult(null);
                    }}
                    placeholder="Contraseña de aplicación o Clave API secreta"
                    className="w-full p-2.5 pr-10 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer p-1"
                  >
                    {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sender Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Nombre del Remitente
                  </label>
                  <input
                    type="text"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    placeholder="ej. Colegio Montessori"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Correo del Remitente (From Email)
                  </label>
                  <input
                    type="email"
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    placeholder="ej. boletines@colegio.edu.mx"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Test Recipient Email */}
              <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-900/40 space-y-2">
                <label className="block text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Correo Destino para Prueba en Vivo</span>
                </label>
                <input
                  type="email"
                  value={smtpTestEmail}
                  onChange={(e) => setSmtpTestEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="w-full p-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <span className="text-[10px] text-sky-800/80 dark:text-sky-300/80 block">
                  Enviaremos un correo de confirmación a esta dirección para verificar la entrega antes de avanzar.
                </span>
              </div>

              {/* Test Result Message Box */}
              {smtpTestResult && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-2.5 animate-in fade-in duration-200 ${
                    smtpTestResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-500/40 text-red-900 dark:text-red-200'
                  }`}
                >
                  {smtpTestResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span className="font-bold block text-xs">
                      {smtpTestResult.success ? 'Conexión SMTP Exitosa' : 'Fallo en la Conexión SMTP'}
                    </span>
                    <p className="text-[11px] opacity-90 leading-tight">
                      {smtpTestResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Drawer Footer */}
            <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-slate-800 bg-stone-50/90 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                disabled={testingSmtp || isSavingSmtp}
                onClick={handleTestSmtpConnection}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {testingSmtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    <span>Probando Envío...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Probar Conexión</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsSmtpModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={testingSmtp || isSavingSmtp}
                  onClick={handleSaveSmtpAndProceed}
                  className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSavingSmtp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span>Guardar y Continuar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolPricingSection;
