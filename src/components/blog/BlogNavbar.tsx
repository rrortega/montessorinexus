import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Sun, Moon, ChevronDown, Check } from 'lucide-react';
import { MontessoriNexusLogo } from '@/components/MontessoriNexusLogo';
import { useSiteSettings, getButtonRadiusClass } from '@/context/SettingsContext';
import { ALL_SUPPORTED_LANGUAGES, getLanguageByCode } from '@/pages/admin/web-builder/languages';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogNavbarProps {
  isSaaSBlog: boolean;
  schoolSlug?: string;
  activeLocale: string;
  onLocaleChange?: (locale: string) => void;
  scrollProgress?: number;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  availableLocales?: string[];
}

export const BlogNavbar: React.FC<BlogNavbarProps> = ({
  isSaaSBlog,
  schoolSlug,
  activeLocale = 'es',
  onLocaleChange,
  scrollProgress,
  breadcrumbs = [],
  availableLocales
}) => {
  const { schoolName, schoolLogo, buttonRadius } = useSiteSettings();
  const btnRadiusClass = getButtonRadiusClass(buttonRadius);

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mn_theme') || localStorage.getItem('montessori_nexus_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Keep dark class synced
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('mn_theme', 'dark');
      localStorage.setItem('montessori_nexus_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('mn_theme', 'light');
      localStorage.setItem('montessori_nexus_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const blogRootUrl = schoolSlug ? `/colegio/${schoolSlug}/blog` : '/blog';
  const siteHomeUrl = schoolSlug ? `/colegio/${schoolSlug}` : '/';

  const currentLangObj = getLanguageByCode(activeLocale);

  // Filter languages if specific availableLocales are provided
  const selectableLanguages = availableLocales && availableLocales.length > 0
    ? ALL_SUPPORTED_LANGUAGES.filter(l => availableLocales.includes(l.code))
    : ALL_SUPPORTED_LANGUAGES;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c140e]/95 backdrop-blur-md border-b border-border/80 transition-colors duration-200">
      {/* Dynamic Reading Progress Bar at the bottom border */}
      {typeof scrollProgress === 'number' && scrollProgress > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-0.5 ${
            isSaaSBlog ? 'bg-[#C4661F]' : 'bg-forest'
          } transition-all duration-150 z-50`}
          style={{ width: `${Math.min(100, Math.max(0, scrollProgress))}%` }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link
            to={blogRootUrl}
            className="flex items-center gap-3 shrink-0 group focus:outline-none"
          >
            {isSaaSBlog ? (
              <>
                <MontessoriNexusLogo size={36} className="group-hover:scale-105 transition-transform duration-200" />
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-serif font-black tracking-tight text-[#162218] dark:text-white flex items-center gap-0.5 leading-none">
                    Montessori<span className="text-[#C4661F] font-sans font-bold">Nexus</span>
                  </span>
                  <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#C4661F] mt-0.5">
                    Blog & Pedagogía
                  </span>
                </div>
              </>
            ) : schoolLogo ? (
              <>
                <img src={schoolLogo} alt={schoolName} className="h-8 w-auto object-contain rounded-md" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold font-display tracking-tight text-foreground group-hover:text-forest transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                    {schoolName}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-forest">
                    Blog Institucional
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-forest text-white flex items-center justify-center font-bold font-display text-sm">
                  {schoolName?.charAt(0) || 'M'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold font-display tracking-tight text-foreground group-hover:text-forest transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                    {schoolName || 'Colegio Montessori'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-forest">
                    Blog Institucional
                  </span>
                </div>
              </>
            )}
          </Link>

          {/* Breadcrumb Trail on desktop */}
          {breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border pl-4">
              <Link to={blogRootUrl} className="hover:text-foreground transition-colors font-medium">
                Blog
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                  {crumb.href ? (
                    <Link to={crumb.href} className="hover:text-foreground transition-colors font-medium truncate max-w-[150px]">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-semibold truncate max-w-[200px] lg:max-w-[300px]">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Right Controls: Language Dropdown + Dark Mode Toggle + Home Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Language Selector Dropdown */}
          {onLocaleChange && (
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-label="Selector de idioma del blog"
                aria-expanded={langMenuOpen}
                className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 focus:ring-1 focus:ring-[#C4661F]'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300 focus:ring-1 focus:ring-[#C4661F]'
                }`}
              >
                <span className="text-sm shrink-0 leading-none">{currentLangObj.flag}</span>
                <span className="font-sans font-semibold hidden sm:inline">{currentLangObj.name}</span>
                <span className="font-sans font-semibold uppercase sm:hidden">{currentLangObj.code}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border p-1.5 z-50 ${
                      isDark
                        ? 'bg-[#162218] border-slate-700 text-white'
                        : 'bg-white border-stone-200 text-stone-900 shadow-stone-300/50'
                    }`}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Idioma del Contenido
                    </div>
                    {selectableLanguages.map(item => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          onLocaleChange(item.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          activeLocale === item.code
                            ? (isSaaSBlog ? 'bg-[#C4661F]/15 text-[#C4661F]' : 'bg-forest/15 text-forest')
                            : isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm leading-none">{item.flag}</span>
                          <span>{item.name}</span>
                        </div>
                        {activeLocale === item.code && (
                          <Check className={`w-3.5 h-3.5 ${isSaaSBlog ? 'text-[#C4661F]' : 'text-forest'}`} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`h-9 w-9 rounded-xl text-xs transition-all border flex items-center justify-center cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
            }`}
            title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>

          {/* Action / Return to Main Website */}
          <Link
            to={siteHomeUrl}
            className={`h-9 px-3.5 text-xs font-semibold border border-border hover:bg-muted/60 text-foreground ${btnRadiusClass} transition-all inline-flex items-center gap-1.5`}
          >
            <Home className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">{isSaaSBlog ? 'Sitio Oficial' : 'Colegio'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default BlogNavbar;
