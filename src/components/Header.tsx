import { useState, useEffect } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import logoIcon from '@/assets/ceiba-montessori-logo.svg';
import logoLetras from '@/assets/ceiba-letras.svg';
import { useCTA } from '@/hooks/use-cta';

const showGallery = import.meta.env.VITE_SHOW_GALLERY_SECTION === 'true';
const showTeachers = import.meta.env.VITE_SHOW_TEACHERS_SECTION === 'true';

const navItems = [
  { label: 'Nuestro Método', href: '#metodo' },
  { label: 'Programas', href: '#programas' },
  { label: 'Admisiones', href: '#admisiones' },
  ...(showGallery ? [{ label: 'Galería', href: '#galeria' }] : []),
  ...(showTeachers ? [{ label: 'Guías', href: '#guias' }] : []),
  { label: 'Comunidad', href: '#comunidad' },
  { label: 'Contacto', href: '#contacto' },
];

export function Header() {
  const { t, locale, setLocale } = useI18n();
  const { handleCTA } = useCTA();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = locale === 'es' ? 'en' : 'es';
    setLocale(nextLang);
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

  return (
    <header
      className={`fixed z-50 transition-all duration-500 left-0 lg:left-1/2 lg:-translate-x-1/2 ${isScrolled
        ? 'top-0 lg:top-6 w-full lg:w-[95%] max-w-7xl bg-forest/95 backdrop-blur-xl border-b border-white/10 lg:border lg:border-white/30 shadow-2xl rounded-none lg:rounded-full h-16'
        : 'top-0 w-full bg-transparent h-24 border-transparent'
        }`}
    >
      <div className="container h-full mx-auto px-6">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <a href="#" className="flex flex-col items-center lg:items-start group pt-1">
            <motion.div
              whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 1, 0] }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 sm:gap-2"
            >
              <img
                src={logoIcon}
                alt="Ceiba Icon"
                className={`h-8 sm:h-10 w-auto transition-all ${isScrolled ? 'brightness-0 invert' : ''}`}
              />
              <img
                src={logoLetras}
                alt="Ceiba"
                className={`h-6 sm:h-8 w-auto transition-all ${isScrolled ? 'brightness-0 invert' : ''}`}
              />
            </motion.div>
            <AnimatePresence>
              {!isScrolled && (
                <motion.span
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="font-display text-[7.5px] sm:text-[10px] tracking-[0.2em] uppercase text-white/90 group-hover:text-white transition-all mt-0.5 whitespace-nowrap overflow-hidden px-1"
                >
                  Montessori International
                </motion.span>
              )}
            </AnimatePresence>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-all duration-300 text-white/90 hover:text-white"
              >
                {t(item.label)}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="rounded-full px-3 text-xs font-bold transition-all duration-300 text-white hover:bg-white/10"
            >
              <Globe className="w-4 h-4 mr-2" />
              {locale === 'es' ? 'EN' : 'ES'}
            </Button>

            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleCTA('visit')}
              className="rounded-full px-6 text-xs font-bold tracking-wide shadow-lg border-b-4 border-black/10 hover:translate-y-0.5 active:border-b-0 transition-all"
            >
              {t('Agenda una Visita')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 transition-colors rounded-full ${isScrolled ? 'text-white hover:bg-white/10' : 'text-primary hover:bg-primary/5'}`}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-in Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-primary z-50 lg:hidden shadow-2xl p-8 flex flex-col"
            >
              <div className="flex justify-end mb-8">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <nav className="flex flex-col gap-6">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 text-white font-bold text-lg mb-4"
                >
                  <Globe className="w-5 h-5" />
                  {t(locale === 'es' ? 'Cambiar a Inglés' : 'Cambiar a Español')}
                </button>

                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-xl font-medium text-white/90 hover:text-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(item.label)}
                  </a>
                ))}
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleCTA('visit');
                  }}
                  className="mt-4 w-full rounded-full py-6 text-lg font-bold"
                >
                  {t('Agenda una Visita')}
                </Button>
              </nav>

              <div className="mt-auto">
                <div className="h-px bg-white/10 mb-6" />
                <p className="text-sm text-white/60 font-medium">Ceiba Montessori International</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header >
  );
}
