import React, { useState, useEffect } from 'react';
import { Menu, X, Globe, Sun, Moon, Phone, Mail, MapPin, Sparkles, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import { useCTA } from '@/hooks/use-cta';
import { useSiteSettings } from '@/context/SettingsContext';
import logoCeibaDefault from '@/assets/logo-ceiba.svg';

const showGallery = import.meta.env.VITE_SHOW_GALLERY_SECTION === 'true';
const showTeachers = import.meta.env.VITE_SHOW_TEACHERS_SECTION === 'true';

export interface TopBarItem {
  id: string;
  icon?: 'phone' | 'mail' | 'pin' | 'sparkles' | 'link';
  text: string;
  url?: string;
}

function hexToRgba(hex?: string, alpha = 0.95): string {
  if (!hex) return `rgba(27, 59, 43, ${alpha})`;
  const cleanHex = hex.replace('#', '');
  let r = 27, g = 59, b = 43;
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface HeaderProps {
  forceScrolled?: boolean;
}

export function Header({ forceScrolled = false }: HeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const { handleCTA } = useCTA();
  const {
    settings,
    schoolName,
    schoolLogo,
    schoolLogoDark,
    showDocumentsInMenu,
    showApplicationsInMenu,
    brandPrimaryColor,
    brandAccentColor
  } = useSiteSettings();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Settings mapping
  const layoutType = (settings?.header_layout_type as 'full' | 'floating') || 'floating';
  const initialHeight = Number(settings?.header_height) || 72;
  const radius = settings?.header_radius || '2xl';
  const marginTop = Number(settings?.header_margin_top) || 16;
  const marginSide = Number(settings?.header_margin_side) || 24;
  const bgMode = (settings?.header_bg_mode as 'transparent' | 'solid' | 'glass') || 'glass';
  const hasBorder = settings?.header_has_border !== 'false';
  const shadow = (settings?.header_shadow as 'none' | 'sm' | 'md' | 'lg' | 'xl') || 'md';

  // Top Bar
  const showTopBar = settings?.header_show_top_bar === 'true';
  const topBarText = settings?.header_top_bar_text || '';

  // Top bar items parsing
  const topBarItems: TopBarItem[] = (() => {
    if (settings?.header_top_bar_items) {
      try {
        const parsed = JSON.parse(settings.header_top_bar_items);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (topBarText) {
      return [{ id: '1', icon: 'sparkles', text: topBarText, url: '' }];
    }
    return [
      { id: '1', icon: 'sparkles', text: 'Admisiones Abiertas', url: '/#admisiones' },
      { id: '2', icon: 'phone', text: '+52 998 123 4567', url: 'tel:+529981234567' }
    ];
  })();

  // Logo & Name
  const logoPosition = (settings?.header_logo_position as 'left' | 'center' | 'right' | 'hidden') || 'left';
  const showName = settings?.header_show_name !== 'false';
  const nameSplit = settings?.header_name_split !== 'false';
  const namePart1 = settings?.header_name_part1 || (schoolName ? schoolName.split(' ')[0] : 'Ceiba');
  const namePart2 = settings?.header_name_part2 || (schoolName ? schoolName.split(' ').slice(1).join(' ') : 'Montessori');
  const nameColor1 = settings?.header_name_color1 || '';
  const nameColor2 = settings?.header_name_color2 || '';
  const logoHeight = Number(settings?.header_logo_height) || 36;

  // Navigation & Extras
  const showLangSwitcher = settings?.header_show_lang_switcher !== 'false';
  const showThemeToggle = settings?.header_show_theme_toggle !== 'false';
  const ctaText = settings?.header_cta_text || 'Admisiones';

  // Scroll Transformation
  const scrollEnabled = settings?.header_scroll_enabled !== 'false';
  const scrollType = (settings?.header_scroll_type as 'floating' | 'sticky-full') || 'floating';
  const scrollHeight = Number(settings?.header_scroll_height) || 60;
  const scrollRadius = (settings?.header_scroll_radius as ButtonRadiusType) || 'full';
  const scrollOpacity = settings?.header_scroll_opacity !== undefined && !isNaN(Number(settings?.header_scroll_opacity))
    ? Number(settings?.header_scroll_opacity) / 100
    : 0.95;
  const scrollBlur = settings?.header_scroll_blur !== 'false';

  // Mobile
  const mobileLogoPos = (settings?.header_mobile_logo_pos as 'left' | 'center') || 'left';
  const mobileShowCta = settings?.header_mobile_show_cta !== 'false';

  const activeScrolled = (isScrolled || forceScrolled) && scrollEnabled;

  const navItems = [
    { label: 'Nuestro Método', href: '/#metodo' },
    { label: 'Programas', href: '/#programas' },
    { label: 'Admisiones', href: '/#admisiones' },
    ...(showGallery ? [{ label: 'Galería', href: '/#galeria' }] : []),
    ...(showTeachers ? [{ label: 'Guías', href: '/#guias' }] : []),
    ...(showDocumentsInMenu ? [{ label: 'Documentos', href: '/documentos' }] : []),
    ...(showApplicationsInMenu ? [{ label: 'Aplicativos', href: '/aplicativos' }] : []),
    { label: 'Contacto', href: '/#contacto' },
  ];

  const toggleLanguage = () => {
    const nextLang = locale === 'es' ? 'en' : 'es';
    setLocale(nextLang);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Radius Class Resolver
  const getRadiusClass = (r: string) => {
    if (r === 'none') return 'rounded-none';
    if (r === 'sm') return 'rounded-sm';
    if (r === 'md') return 'rounded-md';
    if (r === 'lg') return 'rounded-lg';
    if (r === 'xl') return 'rounded-xl';
    if (r === '2xl') return 'rounded-2xl';
    if (r === '3xl') return 'rounded-3xl';
    if (r === 'full') return 'rounded-full';
    return 'rounded-full';
  };

  // Shadow Class Resolver
  const getShadowClass = (s: string) => {
    if (s === 'none') return 'shadow-none';
    if (s === 'sm') return 'shadow-xs';
    if (s === 'lg') return 'shadow-lg';
    if (s === 'xl') return 'shadow-2xl';
    return 'shadow-md';
  };

  const isHeaderDarkBg = bgMode === 'solid' || bgMode === 'glass' || activeScrolled || isDarkMode;
  const activeLogo = (isDarkMode || activeScrolled) && schoolLogoDark ? schoolLogoDark : (schoolLogo || logoCeibaDefault);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none">
      
      {/* 1. OPTIONAL PRE-HEADER TOP BAR */}
      {showTopBar && topBarItems.length > 0 && !activeScrolled && (
        <div
          className="w-full py-1.5 px-4 text-xs font-semibold tracking-wide border-b border-black/10 transition-all duration-300 pointer-events-auto shadow-2xs"
          style={{
            backgroundColor: settings?.header_top_bar_bg || brandPrimaryColor || '#1b3b2b',
            color: settings?.header_top_bar_color || '#ffffff'
          }}
        >
          <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center">
            {topBarItems.map((item) => {
              const content = (
                <div key={item.id} className="inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                  {item.icon === 'phone' && <Phone className="w-3.5 h-3.5 shrink-0 opacity-90" />}
                  {item.icon === 'mail' && <Mail className="w-3.5 h-3.5 shrink-0 opacity-90" />}
                  {item.icon === 'pin' && <MapPin className="w-3.5 h-3.5 shrink-0 opacity-90" />}
                  {item.icon === 'sparkles' && <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />}
                  {item.icon === 'link' && <Link2 className="w-3.5 h-3.5 shrink-0 opacity-90" />}
                  <span className="truncate max-w-xs sm:max-w-md">{item.text}</span>
                </div>
              );

              if (item.url) {
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target={item.url.startsWith('http') ? '_blank' : undefined}
                    rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="hover:underline inline-flex items-center"
                    style={{ color: 'inherit' }}
                  >
                    {content}
                  </a>
                );
              }

              return content;
            })}
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER BAR */}
      <header
        className={`pointer-events-auto transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] mx-auto ${
          activeScrolled
            ? scrollType === 'floating'
              ? `w-[94%] max-w-7xl mt-3 ${scrollBlur ? 'backdrop-blur-xl' : ''} text-white border border-white/20 shadow-2xl ${getRadiusClass(scrollRadius)}`
              : `w-full mt-0 ${scrollBlur ? 'backdrop-blur-xl' : ''} text-white border-b border-white/20 shadow-lg rounded-none`
            : layoutType === 'floating'
            ? `w-[94%] max-w-7xl ${bgMode === 'glass' ? 'bg-forest/85 backdrop-blur-xl border border-white/20 text-white' : bgMode === 'solid' ? 'bg-forest text-white' : 'bg-transparent text-white'} ${hasBorder ? 'border border-white/10' : 'border-transparent'} ${getShadowClass(shadow)} ${getRadiusClass(radius)}`
            : `w-full ${bgMode === 'glass' ? 'bg-forest/90 backdrop-blur-xl border-b border-white/20 text-white' : bgMode === 'solid' ? 'bg-forest text-white' : 'bg-transparent text-white'} ${hasBorder ? 'border-b border-white/10' : 'border-transparent'} rounded-none ${getShadowClass(shadow)}`
        }`}
        style={{
          height: `${activeScrolled ? scrollHeight : initialHeight}px`,
          backgroundColor: activeScrolled
            ? hexToRgba(settings?.header_scroll_bg || brandPrimaryColor || '#1b3b2b', scrollOpacity)
            : undefined,
          marginTop: !activeScrolled && layoutType === 'floating' ? `${marginTop}px` : undefined,
          paddingLeft: !activeScrolled && layoutType === 'floating' ? `${marginSide}px` : undefined,
          paddingRight: !activeScrolled && layoutType === 'floating' ? `${marginSide}px` : undefined,
        }}
      >
        <div className="container h-full mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Logo & School Name */}
          {logoPosition !== 'hidden' && (
            <div className={`flex items-center gap-3 ${logoPosition === 'center' ? 'lg:order-2' : logoPosition === 'right' ? 'lg:order-3' : 'lg:order-1'}`}>
              <a href="/" className="flex items-center gap-2.5 group shrink-0">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5"
                >
                  <img
                    src={activeLogo}
                    alt={schoolName || 'Logo'}
                    className={`w-auto min-w-[28px] max-w-[240px] object-contain transition-all duration-300 ${
                      isHeaderDarkBg && (!schoolLogoDark || activeLogo === logoCeibaDefault) ? 'brightness-0 invert' : ''
                    }`}
                    style={{ height: `${activeScrolled ? Math.min(32, logoHeight) : logoHeight}px` }}
                  />

                  {showName && (
                    <div className="flex items-center gap-1 font-display font-bold text-sm sm:text-base tracking-tight leading-none">
                      {nameSplit ? (
                        <>
                          <span style={{ color: nameColor1 || '#ffffff' }}>
                            {namePart1}
                          </span>
                          <span style={{ color: nameColor2 || brandAccentColor || '#fbbf24' }}>
                            {namePart2}
                          </span>
                        </>
                      ) : (
                        <span className="text-white">{schoolName || 'Colegio'}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              </a>
            </div>
          )}

          {/* Desktop Navigation Links */}
          <nav className={`hidden lg:flex items-center gap-5 xl:gap-7 ${logoPosition === 'center' ? 'lg:order-1' : logoPosition === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs sm:text-sm font-medium transition-all duration-200 text-white/90 hover:text-white hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                {t(item.label)}
              </a>
            ))}
          </nav>

          {/* Right Tools (Language Switcher, Theme Toggle, CTA) */}
          <div className={`hidden lg:flex items-center gap-3 ${logoPosition === 'center' ? 'lg:order-3' : logoPosition === 'right' ? 'lg:order-2' : 'lg:order-3'}`}>
            {/* Language Switcher */}
            {showLangSwitcher && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="rounded-full px-2.5 py-1 text-xs font-bold text-white hover:bg-white/10 transition-all"
                title="Cambiar Idioma"
              >
                <Globe className="w-3.5 h-3.5 mr-1 text-amber-300" />
                <span>{locale === 'es' ? 'EN' : 'ES'}</span>
              </Button>
            )}

            {/* Theme Switcher */}
            {showThemeToggle && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Modo Claro / Oscuro"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-200" />}
              </button>
            )}

            {/* CTA Button */}
            {ctaText && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCTA('visit')}
                className="rounded-full px-5 py-2 text-xs font-bold tracking-wide shadow-md border-b-2 border-black/20 hover:scale-105 active:scale-95 transition-all"
              >
                {t(ctaText)}
              </Button>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            {mobileShowCta && ctaText && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCTA('visit')}
                className="rounded-full px-3 py-1 text-[11px] font-bold shadow-xs"
              >
                {t(ctaText)}
              </Button>
            )}

            <button
              type="button"
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* 3. MOBILE MENU SLIDE-IN OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-40 lg:hidden pointer-events-auto"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] max-w-[85%] bg-forest z-50 lg:hidden shadow-2xl p-6 flex flex-col justify-between pointer-events-auto text-white"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <img src={activeLogo} alt="Logo" className="h-7 w-auto object-contain" />
                    <span className="font-display font-bold text-xs truncate max-w-[140px] text-white">
                      {schoolName || 'Colegio'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="text-base font-semibold text-white/90 hover:text-amber-300 py-1.5 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t(item.label)}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                {showLangSwitcher && (
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-amber-300" />
                    <span>{t(locale === 'es' ? 'Cambiar a Inglés (EN)' : 'Cambiar a Español (ES)')}</span>
                  </button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleCTA('visit');
                  }}
                  className="w-full py-3 rounded-xl text-xs font-bold shadow-lg"
                >
                  {t(ctaText)}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Header;
