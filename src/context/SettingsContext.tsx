import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings as updateDBSettings } from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  type: 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x' | 'linkedin' | 'email';
}

export type ButtonRadiusType = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
export type ButtonHeightType = 'compact' | 'sm' | 'default' | 'md' | 'spacious' | 'lg';

export function getButtonRadiusClass(radius?: string): string {
  switch (radius) {
    case 'none': return 'rounded-none';
    case 'sm': return 'rounded-sm';
    case 'md': return 'rounded-md';
    case 'lg': return 'rounded-lg';
    case 'xl': return 'rounded-xl';
    case '2xl': return 'rounded-2xl';
    case '3xl': return 'rounded-3xl';
    case 'full': return 'rounded-full';
    default: return 'rounded-2xl';
  }
}

export function getAvatarRadiusClass(radius?: string): string {
  switch (radius) {
    case 'none': return 'rounded-none';
    case 'sm': return 'rounded-xs';
    case 'md': return 'rounded-sm';
    case 'lg': return 'rounded-md';
    case 'xl': return 'rounded-lg';
    case '2xl': return 'rounded-xl';
    case '3xl': return 'rounded-2xl';
    case 'full': return 'rounded-full';
    default: return 'rounded-xl';
  }
}

export function getButtonHeightClass(height?: string): string {
  switch (height) {
    case 'sm':
    case 'compact':
      return 'min-h-[38px] py-1.5 px-2.5';
    case 'lg':
    case 'spacious':
      return 'min-h-[54px] py-3.5 px-3.5';
    case 'md':
    case 'default':
    default:
      return 'min-h-[46px] py-2.5 px-3';
  }
}

interface SettingsContextType {
  settings: Record<string, string>;
  ctaMode: 'whatsapp' | 'widget';
  contactPhone: string;
  contactEmail: string;
  schoolName: string;
  schoolTagline: string;
  schoolLogo: string;
  schoolLogoDark: string;
  schoolFavicon: string;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  brandAccentColor: string;
  buttonRadius: string;
  buttonHeight: string;
  schoolCurrency: string;
  schoolCurrencySymbol: string;
  schoolTimezone: string;
  schoolCountry: string;
  schoolProvince: string;
  schoolCity: string;
  schoolAddress: string;
  schoolPostalCode: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  socialTiktok: string;
  socialX: string;
  socialLinkedin: string;
  socialLinks: SocialLink[];
  showDocumentsInMenu: boolean;
  showApplicationsInMenu: boolean;
  isSchoolNotFound: boolean;
  unregisteredHost: string;
  isPlatformRoot: boolean;
  loading: boolean;
  updateSettings: (newSettings: Record<string, string>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  applyBrandingCss: (primaryHex?: string, secondaryHex?: string, accentHex?: string, radius?: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function hexToHsl(hex: string): { h: number, s: number, l: number } | null {
  let cleanHex = hex.trim().replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  if (cleanHex.length !== 6) return null;

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeMembership } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [isSchoolNotFound, setIsSchoolNotFound] = useState(false);
  const [unregisteredHost, setUnregisteredHost] = useState('');
  const [isPlatformRoot, setIsPlatformRoot] = useState(false);

  const applyBrandingCss = (primaryHex?: string, secondaryHex?: string, accentHex?: string, radius?: string) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (primaryHex) {
      const primaryHsl = hexToHsl(primaryHex);
      if (primaryHsl) {
        const { h, s, l } = primaryHsl;

        // Compute deep, high-contrast dark tones for text/menu items on light backgrounds
        // Cap lightness at max 18% to guarantee crisp readability (WCAG AAA contrast)
        const textL = Math.min(l, 18);
        const textS = Math.min(Math.max(s, 30), 85);
        const textLDeep = Math.min(l, 12);
        const lightL = Math.min(Math.max(textL + 8, 22), 28);
        const lightS = Math.max(0, textS - 5);

        root.style.setProperty('--forest', `${h} ${textS}% ${textL}%`);
        root.style.setProperty('--forest-dark', `${h} ${textS}% ${textLDeep}%`);
        root.style.setProperty('--forest-light', `${h} ${lightS}% ${lightL}%`);
        root.style.setProperty('--foreground', `${h} ${textS}% ${textLDeep}%`);
        root.style.setProperty('--card-foreground', `${h} ${textS}% ${textLDeep}%`);
        root.style.setProperty('--popover-foreground', `${h} ${textS}% ${textLDeep}%`);

        // Set exact user primary for buttons/rings/accent highlights
        root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
        root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
        root.style.setProperty('--sidebar-foreground', `${h} ${textS}% ${textL}%`);
        root.style.setProperty('--sidebar-primary', `${h} ${s}% ${l}%`);
        root.style.setProperty('--sidebar-ring', `${h} ${s}% ${l}%`);
      }
    }

    if (secondaryHex) {
      const secondaryHsl = hexToHsl(secondaryHex);
      if (secondaryHsl) {
        const { h, s, l } = secondaryHsl;
        const textL = Math.min(l, 25);
        const textS = Math.min(Math.max(s, 30), 85);
        root.style.setProperty('--terracotta', `${h} ${textS}% ${textL}%`);
        root.style.setProperty('--secondary', `${h} ${s}% ${l}%`);
        const sLight = Math.max(0, s - 5);
        const lLight = Math.min(100, l + 10);
        root.style.setProperty('--terracotta-light', `${h} ${sLight}% ${lLight}%`);
      }
    }

    if (accentHex) {
      const accentHsl = hexToHsl(accentHex);
      if (accentHsl) {
        const { h, s, l } = accentHsl;
        root.style.setProperty('--accent', `${h} ${s}% ${l}%`);
      }
    }

    if (radius) {
      let rVal = '1rem';
      if (radius === 'none') rVal = '0px';
      if (radius === 'sm') rVal = '0.25rem';
      if (radius === 'md') rVal = '0.5rem';
      if (radius === 'lg') rVal = '0.75rem';
      if (radius === 'xl') rVal = '1rem';
      if (radius === '2xl') rVal = '1.25rem';
      if (radius === '3xl') rVal = '1.5rem';
      if (radius === 'full') rVal = '9999px';
      root.style.setProperty('--radius', rVal);
    }
  };

  const loadSettings = async () => {
    try {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const searchParams = new URLSearchParams(window.location.search);
        const schoolQuery = searchParams.get('school') || searchParams.get('colegio');
        const isAdminRoute = window.location.pathname.startsWith('/admin');

        const hostRes = await fetch(`/api/schools/resolve-host?host=${encodeURIComponent(hostname)}`);
        if (hostRes.ok) {
          const hostData = await hostRes.json();
          if (hostData.isPlatformRoot && !schoolQuery && !activeMembership?.schoolId && !isAdminRoute) {
            setIsPlatformRoot(true);
            setIsSchoolNotFound(false);
            setLoading(false);
            return;
          }
          if (hostData.notFound && !schoolQuery && !activeMembership?.schoolId && !isAdminRoute) {
            setIsSchoolNotFound(true);
            setIsPlatformRoot(false);
            setUnregisteredHost(hostData.attemptedHost || hostname);
            setLoading(false);
            return;
          }
          setIsSchoolNotFound(false);
          setIsPlatformRoot(false);
          if (hostData.school?.id) {
            localStorage.setItem('ceiba_active_school_id', hostData.school.id);
            localStorage.setItem('ceiba_active_school_slug', hostData.school.slug);
          }
        }
      }

      const dbData = await getSiteSettings();
      setSettings(dbData);

      applyBrandingCss(
        dbData.brand_primary_color || activeMembership?.school.primaryColor || '#1b3b2b',
        dbData.brand_secondary_color || activeMembership?.school.accentColor || '#10b981',
        dbData.brand_accent_color || activeMembership?.school.accentColor || '#f59e0b',
        dbData.button_radius || '2xl'
      );
    } catch (e) {
      console.error('Error initializing school settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [activeMembership?.schoolId]);

  const updateSettings = async (newSettings: Record<string, string>) => {
    const normalized: Record<string, string> = { ...newSettings };
    if (newSettings.primaryColor && !newSettings.brand_primary_color) {
      normalized.brand_primary_color = newSettings.primaryColor;
    }
    if (newSettings.secondaryColor && !newSettings.brand_secondary_color) {
      normalized.brand_secondary_color = newSettings.secondaryColor;
    }
    if (newSettings.accentColor && !newSettings.brand_accent_color) {
      normalized.brand_accent_color = newSettings.accentColor;
    }
    if (newSettings.schoolName && !newSettings.school_name) {
      normalized.school_name = newSettings.schoolName;
    }
    if (newSettings.schoolTagline && !newSettings.school_tagline) {
      normalized.school_tagline = newSettings.schoolTagline;
    }
    if (newSettings.logoUrl && !newSettings.school_logo) {
      normalized.school_logo = newSettings.logoUrl;
    }
    if (newSettings.buttonRadius && !newSettings.button_radius) {
      normalized.button_radius = newSettings.buttonRadius;
    }
    if (newSettings.buttonHeight && !newSettings.button_height) {
      normalized.button_height = newSettings.buttonHeight;
    }

    await updateDBSettings(normalized);
    setSettings(prev => ({ ...prev, ...normalized }));
    applyBrandingCss(
      normalized.brand_primary_color || settings.brand_primary_color,
      normalized.brand_secondary_color || settings.brand_secondary_color,
      normalized.brand_accent_color || settings.brand_accent_color,
      normalized.button_radius || settings.button_radius
    );
  };

  // School Identity & Branding
  const schoolName = settings.school_name || activeMembership?.school.name || 'Colegio';
  const schoolTagline = settings.school_tagline || activeMembership?.school.legalName || 'Comunidad y Aprendizaje Auténtico';
  const schoolLogo = settings.school_logo || activeMembership?.school.logoUrl || '';
  const schoolLogoDark = settings.school_logo_dark || '';
  const schoolFavicon = settings.school_favicon || '/favicon.png';
  const brandPrimaryColor = settings.brand_primary_color || activeMembership?.school.primaryColor || '#1b3b2b';
  const brandSecondaryColor = settings.brand_secondary_color || activeMembership?.school.accentColor || '#10b981';
  const brandAccentColor = settings.brand_accent_color || activeMembership?.school.accentColor || '#f59e0b';

  // Dynamically update favicon in document head
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (schoolFavicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = schoolFavicon;
    }
  }, [schoolFavicon]);

  // Real-time live preview listener from WebBuilder parent window
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CEIBA_WEB_BUILDER_PREVIEW_UPDATE') {
        const { previewSettings, themeMode } = event.data.payload || {};
        if (previewSettings) {
          setSettings(prev => ({ ...prev, ...previewSettings }));
          
          const primary = themeMode === 'dark'
            ? (previewSettings.brand_primary_dark || previewSettings.brand_primary_color)
            : (previewSettings.brand_primary_color || previewSettings.brand_primary_dark);
            
          const secondary = themeMode === 'dark'
            ? (previewSettings.brand_secondary_dark || previewSettings.brand_secondary_color)
            : (previewSettings.brand_secondary_color || previewSettings.brand_secondary_dark);

          applyBrandingCss(primary, secondary);
        }

        if (themeMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (themeMode === 'light') {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, []);

  // Dynamically inject CSS custom properties based on loaded branding colors
  useEffect(() => {
    applyBrandingCss(brandPrimaryColor, brandSecondaryColor);
  }, [brandPrimaryColor, brandSecondaryColor]);

  // Dynamic values with fallback to .env
  const ctaMode = (settings.cta_mode || import.meta.env.VITE_CTA_MODE || 'whatsapp') as 'whatsapp' | 'widget';
  const contactPhone = settings.contact_phone || activeMembership?.school.phone || import.meta.env.VITE_CONTACT_PHONE || '+52 998 350 2849';
  const contactEmail = settings.contact_email || activeMembership?.school.email || import.meta.env.VITE_CONTACT_EMAIL || 'admin@ceibamontessori.com';

  // School Regional & Financial Configuration
  const schoolCurrency = settings.school_currency || 'MXN';
  const schoolCurrencySymbol = settings.school_currency_symbol || '$';
  const schoolTimezone = settings.school_timezone || 'America/Cancun';
  const schoolCountry = settings.school_country || activeMembership?.school.country || 'México';
  const schoolProvince = settings.school_province || activeMembership?.school.province || 'Quintana Roo';
  const schoolCity = settings.school_city || activeMembership?.school.city || 'Cancún, Quintana Roo';
  const schoolAddress = settings.school_address || activeMembership?.school.address || 'Sm 15, Cancún, Q.R.';
  const schoolPostalCode = settings.school_postal_code || '77505';

  const socialFacebook = settings.social_facebook !== undefined ? settings.social_facebook : (import.meta.env.VITE_SOCIAL_FACEBOOK || '');
  const socialInstagram = settings.social_instagram !== undefined ? settings.social_instagram : (import.meta.env.VITE_SOCIAL_INSTAGRAM || '');
  const socialYoutube = settings.social_youtube || '';
  const socialTiktok = settings.social_tiktok || '';
  const socialX = settings.social_x || '';
  const socialLinkedin = settings.social_linkedin || '';

  // Menu item visibility switches
  const showDocumentsInMenu = settings.show_documents_in_menu !== 'false';
  const showApplicationsInMenu = settings.show_applications_in_menu !== 'false';

  // Build active social links list
  const socialLinks: SocialLink[] = [
    ...(socialFacebook ? [{ id: 'facebook', label: 'Facebook', href: socialFacebook, type: 'facebook' as const }] : []),
    ...(socialInstagram ? [{ id: 'instagram', label: 'Instagram', href: socialInstagram, type: 'instagram' as const }] : []),
    ...(socialYoutube ? [{ id: 'youtube', label: 'YouTube', href: socialYoutube, type: 'youtube' as const }] : []),
    ...(socialTiktok ? [{ id: 'tiktok', label: 'TikTok', href: socialTiktok, type: 'tiktok' as const }] : []),
    ...(socialX ? [{ id: 'x', label: 'X.com', href: socialX, type: 'x' as const }] : []),
    ...(socialLinkedin ? [{ id: 'linkedin', label: 'LinkedIn', href: socialLinkedin, type: 'linkedin' as const }] : []),
    ...(contactEmail ? [{ id: 'email', label: 'Correo', href: `mailto:${contactEmail}`, type: 'email' as const }] : []),
  ];

  // UI Button & Component Styling Configuration
  const buttonRadius = settings.button_radius || settings.ui_button_radius || settings.border_radius || '2xl';
  const buttonHeight = settings.button_height || settings.ui_button_height || 'default';

  return (
    <SettingsContext.Provider
      value={{
        settings,
        schoolName,
        schoolTagline,
        schoolLogo,
        schoolLogoDark,
        schoolFavicon,
        brandPrimaryColor,
        brandSecondaryColor,
        brandAccentColor,
        buttonRadius,
        buttonHeight,
        ctaMode,
        contactPhone,
        contactEmail,
        schoolCurrency,
        schoolCurrencySymbol,
        schoolTimezone,
        schoolCountry,
        schoolProvince,
        schoolCity,
        schoolAddress,
        schoolPostalCode,
        socialFacebook,
        socialInstagram,
        socialYoutube,
        socialTiktok,
        socialX,
        socialLinkedin,
        socialLinks,
        showDocumentsInMenu,
        showApplicationsInMenu,
        isSchoolNotFound,
        unregisteredHost,
        isPlatformRoot,
        loading,
        updateSettings,
        refreshSettings: loadSettings,
        applyBrandingCss,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSiteSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    console.warn('useSiteSettings: Context is undefined (likely during HMR re-eval). Returning default fallback settings.');
    return {
      settings: {},
      schoolName: 'Ceiba Montessori',
      schoolTagline: 'Comunidad y Aprendizaje Auténtico',
      schoolLogo: '',
      schoolLogoDark: '',
      schoolFavicon: '/favicon.png',
      brandPrimaryColor: '#1b3b2b',
      brandSecondaryColor: '#10b981',
      brandAccentColor: '#f59e0b',
      buttonRadius: '2xl',
      buttonHeight: 'default',
      ctaMode: 'whatsapp' as const,
      contactPhone: '+52 998 350 2849',
      contactEmail: 'contacto@ceiba-roots.com',
      schoolCurrency: 'MXN',
      schoolCurrencySymbol: '$',
      schoolTimezone: 'America/Cancun',
      schoolCountry: 'México',
      schoolProvince: 'Quintana Roo',
      schoolCity: 'Cancún',
      schoolAddress: 'Av. Huayacán Km 4.2',
      schoolPostalCode: '77560',
      socialFacebook: 'https://facebook.com',
      socialInstagram: 'https://instagram.com',
      socialYoutube: 'https://youtube.com',
      socialTiktok: 'https://tiktok.com',
      socialX: '',
      socialLinkedin: '',
      socialLinks: [],
      showDocumentsInMenu: true,
      showApplicationsInMenu: true,
      isSchoolNotFound: false,
      unregisteredHost: '',
      isPlatformRoot: false,
      loading: false,
      updateSettings: async () => {},
      refreshSettings: async () => {},
      applyBrandingCss: () => {},
    };
  }
  return context;
};
