import React from 'react';

/**
 * Extracts a readable candidate school name from query params, pathname, subdomain, or custom domain.
 */
export function getSchoolNameFromUrl(): string {
  if (typeof window === 'undefined') return '';

  try {
    // 1. Check query parameter: ?school=ceiba or ?colegio=ceiba
    const searchParams = new URLSearchParams(window.location.search);
    const querySchool = searchParams.get('school') || searchParams.get('colegio');
    if (querySchool) {
      return formatSchoolName(querySchool);
    }

    // 2. Check path: /colegio/ceiba or /school/ceiba
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/(?:colegio|school)\/([^/]+)/i);
    if (match && match[1]) {
      return formatSchoolName(match[1]);
    }

    // 3. Check hostname (subdomain or custom domain)
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const cachedSlug = localStorage.getItem('ceiba_active_school_slug');
      if (cachedSlug) return formatSchoolName(cachedSlug);
      return '';
    }

    // 3a. Subdomain on platform domain (e.g. ceiba.montessorinexus.com or ceiba.localhost)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const sub = parts[0];
      const ignoredSubs = ['www', 'api', 'app', 'panel', 'admin', 'console', 'staging', 'dev'];
      if (!ignoredSubs.includes(sub) && (hostname.endsWith('montessorinexus.com') || hostname.endsWith('localhost'))) {
        return formatSchoolName(sub);
      }
    }

    // 3b. Custom domain (e.g. colegioceiba.edu.mx, lacumbre.com)
    if (!hostname.endsWith('montessorinexus.com') && !hostname.endsWith('localhost')) {
      const cleanHost = hostname.replace(/^www\./, '');
      const withoutCompoundTld = cleanHost.replace(/\.(edu|com|gob|org|net)\.[a-z]{2,}$/i, '');
      const baseName = withoutCompoundTld.replace(/\.[a-z0-9-]+$/i, '');
      if (baseName && baseName !== 'montessorinexus') {
        return formatSchoolName(baseName);
      }
    }
  } catch (e) {
    // Silent fallback
  }

  return '';
}

function formatSchoolName(raw: string): string {
  if (!raw) return '';
  const words = decodeURIComponent(raw)
    .replace(/[-_.]+/g, ' ')
    .trim()
    .split(/\s+/);
  return words
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const PageLoadingIndicator: React.FC<{ schoolName?: string }> = ({ schoolName: propSchoolName }) => {
  const schoolName = propSchoolName || getSchoolNameFromUrl();

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden select-none z-50">
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center gap-4 z-10 px-4 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Minimalist Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-emerald-500 animate-spin" />
        </div>

        {/* Dynamic Loading Message without SaaS branding */}
        <div className="space-y-1">
          <span className="font-display font-medium text-sm tracking-tight text-white block">
            {schoolName ? `${schoolName} está cargando...` : 'Espere un momento mientras cargamos...'}
          </span>
          <span className="text-[11px] text-slate-400 font-normal tracking-wide block">
            Preparando la información...
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageLoadingIndicator;

