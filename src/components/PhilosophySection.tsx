import React, { useState, useEffect } from 'react';
import { motion, useTransform, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Book,
  BookOpen,
  BookMarked,
  Bookmark,
  Library,
  Notebook,
  FileText,
  Award,
  Globe,
  Leaf,
  Heart,
  Sparkles,
  Sun,
  SunMedium,
  Sunrise,
  CloudSun,
  Wind,
  Mountain,
  Users,
  Users2,
  UserCheck,
  UserPlus,
  UserRound,
  PersonStanding,
  HeartHandshake,
  Briefcase,
  BadgeCheck,
  TrendingUp,
  Target,
  ShieldCheck,
  Smile,
  Feather,
  Shield,
  Star,
  Trophy,
  Lightbulb,
  Eye,
  Layers,
  Anchor,
  Trees,
  TreePine,
  TreeDeciduous,
  Palmtree,
  Tent,
  Building,
  Building2,
  Landmark,
  Castle,
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Map,
  MapPin,
  Navigation,
  Luggage,
  Car,
  Bus,
  Ship,
  Rocket,
  Flower2,
  Sprout,
  Music,
  Palette,
  Check,
  GraduationCap,
  Languages,
  Type,
  SpellCheck,
  PenTool,
  Pencil,
  School,
  Atom,
  Microscope,
  Calculator,
  Binary,
  Rainbow,
  Footprints,
  HandHeart,
  Baby,
  Puzzle,
  Shapes,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { FadeInScroll } from './ui/fade-in-scroll';
import { Magnetic } from './ui/magnetic';
import { useMouseParallax } from '@/hooks/use-mouse-parallax';
import casaNinosImage from '@/assets/salon.jpeg';
import { useCTA } from '@/hooks/use-cta';
import { WebSectionItem } from '@/pages/admin/web-builder/SectionsManagerTab';
import { getSectionFontFamily } from '@/pages/admin/web-builder/SectionDedicatedEditor';

export interface PillarCardItem {
  id: string;
  icon?: string;
  imageUrl?: string;
  title: string;
  title_en?: string;
  title_pt?: string;
  title_fr?: string;
  title_de?: string;
  title_ru?: string;
  title_ca?: string;
  subtitle: string;
  subtitle_en?: string;
  subtitle_pt?: string;
  subtitle_fr?: string;
  subtitle_de?: string;
  subtitle_ru?: string;
  subtitle_ca?: string;
  badge?: string;
  badge_en?: string;
  bgColor?: string;
  bgColorDark?: string;
  textColor?: string;
  textColorDark?: string;
  titleFont?: string;
  subtitleFont?: string;
  titleColor?: string;
  titleColorDark?: string;
  subtitleColor?: string;
  subtitleColorDark?: string;
  shape?: 'rounded' | 'blob' | 'arch' | 'squircle' | 'minimal' | 'leaf' | 'pill';
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'tilt' | 'border' | 'none';
  rotateZ?: number | string;
  rotation?: number | string;
}

export const PILLAR_ICONS_MAP: Record<string, React.ElementType> = {
  // 🎓 Idiomas, Libros & Educación
  GraduationCap,
  Languages,
  Type,
  SpellCheck,
  Book,
  BookOpen,
  BookMarked,
  Bookmark,
  Library,
  Notebook,
  FileText,
  School,
  Pencil,
  PenTool,
  Atom,
  Microscope,
  Calculator,
  Binary,

  // 👨‍👩‍👧‍👦 Niños, Familia, Ejecutivos & Comunidad
  Baby,
  Users,
  Users2,
  UserCheck,
  UserPlus,
  UserRound,
  PersonStanding,
  HeartHandshake,
  Briefcase,
  BadgeCheck,
  TrendingUp,
  Target,
  ShieldCheck,
  Heart,
  HandHeart,

  // 🌿 Parque, Naturaleza, Ciudad & Edificios
  TreeDeciduous,
  Trees,
  TreePine,
  Palmtree,
  Tent,
  Sprout,
  Leaf,
  Flower2,
  Sun,
  SunMedium,
  Sunrise,
  CloudSun,
  Wind,
  Mountain,
  Building,
  Building2,
  Landmark,
  Castle,

  // ✈️ Viajes, Vuelos, Mundo & Exploración
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Rocket,
  Luggage,
  Globe,
  Compass,
  Map,
  MapPin,
  Navigation,
  Ship,
  Car,
  Bus,
  Rainbow,
  Footprints,

  // ✨ Creatividad, Arte & Valores
  Sparkles,
  Star,
  Award,
  Trophy,
  Shield,
  Lightbulb,
  Palette,
  Music,
  Smile,
  Puzzle,
  Shapes,
  Clock,
  Anchor,
  Feather,
  Eye,
  Layers
};

export const DEFAULT_PILLAR_CARDS: PillarCardItem[] = [
  {
    id: 'pillar_1',
    icon: 'Compass',
    title: 'Autonomía & Independencia',
    title_en: 'Autonomy & Independence',
    subtitle: 'Fomentamos la toma de decisiones consciente y la capacidad de actuar con libertad responsable.',
    subtitle_en: 'We encourage conscious decision-making and the ability to act with responsible freedom.',
    bgColor: '#f4f8f5',
    bgColorDark: '#14251c',
    shape: 'rounded',
    hoverEffect: 'lift'
  },
  {
    id: 'pillar_2',
    icon: 'BookOpen',
    title: 'Ambiente Preparado',
    title_en: 'Prepared Environment',
    subtitle: 'Mobiliario y materiales diseñados a escala del niño que invitan a la exploración espontánea.',
    subtitle_en: 'Furniture and materials designed to the child\'s scale that invite spontaneous exploration.',
    bgColor: '#fbf6ee',
    bgColorDark: '#282115',
    shape: 'blob',
    hoverEffect: 'scale'
  },
  {
    id: 'pillar_3',
    icon: 'Award',
    title: 'Guías Certificadas AMI',
    title_en: 'Certified AMI Guides',
    subtitle: 'Acompañantes capacitadas que observan y respetan el ritmo individual de cada etapa.',
    subtitle_en: 'Trained guides who observe and respect the individual pace of each developmental stage.',
    bgColor: '#f1f5f9',
    bgColorDark: '#1b2533',
    shape: 'arch',
    hoverEffect: 'glow'
  },
  {
    id: 'pillar_4',
    icon: 'Globe',
    title: 'Comunidad Bilingüe Viva',
    title_en: 'Living Bilingual Community',
    subtitle: 'Inmersión natural en inglés y español durante toda la jornada de trabajo.',
    subtitle_en: 'Natural immersion in English and Spanish throughout the daily work cycle.',
    bgColor: '#fef3f2',
    bgColorDark: '#2c1919',
    shape: 'squircle',
    hoverEffect: 'lift'
  },
  {
    id: 'pillar_5',
    icon: 'Leaf',
    title: 'Conexión con la Naturaleza',
    title_en: 'Connection with Nature',
    subtitle: 'Cuidado de plantas, huertos y espacios abiertos que nutren la sensibilidad ecológica.',
    subtitle_en: 'Plant care, gardens, and open spaces that nurture ecological sensitivity.',
    bgColor: '#ecfdf5',
    bgColorDark: '#083329',
    shape: 'blob',
    hoverEffect: 'scale'
  },
  {
    id: 'pillar_6',
    icon: 'Heart',
    title: 'Desarrollo Socioemocional',
    title_en: 'Socio-Emotional Growth',
    subtitle: 'Resolución pacífica de conflictos y colaboración en un ambiente de gracia y cortesía.',
    subtitle_en: 'Peaceful conflict resolution and collaboration in an environment of grace and courtesy.',
    bgColor: '#faf5ff',
    bgColorDark: '#24123a',
    shape: 'rounded',
    hoverEffect: 'lift'
  }
];

interface PhilosophySectionProps {
  section?: WebSectionItem;
}

export function PhilosophySection({ section }: PhilosophySectionProps) {
  const { locale, t } = useI18n();
  const { handleCTA } = useCTA();
  const { x: mouseX, y: mouseY } = useMouseParallax(15);

  const config = section?.config || {};
  const isCustomPillars = section?.type === 'pillars_mosaic';

  // Section Typography & Colors
  const badgeFontFamily = getSectionFontFamily(config.badge_font);
  const titleFontFamily = getSectionFontFamily(config.title_font);
  const subtitleFontFamily = getSectionFontFamily(config.subtitle_font);
  const missionFontFamily = getSectionFontFamily(config.mission_font);
  const ctaFontFamily = getSectionFontFamily(config.cta_font);

  const badgeColor = config.badge_color || undefined;
  const titleColor = config.title_color || undefined;
  const subtitleColor = config.subtitle_color || undefined;
  const missionColor = config.mission_color || undefined;
  const ctaColor = config.cta_color || undefined;

  // Multi-language text resolution helper
  const getLocalizedText = (obj: any, field: string, defVal: string = '') => {
    if (!obj) return defVal;
    if (locale !== 'es') {
      const locVal = obj[`${field}_${locale}`];
      if (locVal) return locVal;
    }
    return obj[field] ?? defVal;
  };

  const badgeText = getLocalizedText(section, 'badge', 'Nuestros Pilares');
  const titleText = getLocalizedText(section, 'title', 'Quiénes somos y qué nos representa');
  const subtitleText = getLocalizedText(
    section,
    'subtitle',
    'Los principios formativos que guían cada jornada en nuestra escuela.'
  );
  const missionText = getLocalizedText(
    config,
    'missionText',
    'En nuestra escuela nos comprometemos a entender la infancia para ayudar a los niños a desarrollar la grandeza de sus potencialidades.'
  );
  const ctaText = getLocalizedText(section, 'ctaText', 'Conoce Más');
  const isCtaActive = section?.showCta !== false && (config.showCta === true || (config.showCta !== false && (Boolean(section?.ctaText) || Boolean(config.ctaText))));
  const ctaUrl = section?.ctaUrl || config.ctaUrl || '#contacto';

  const handleCtaClick = () => {
    if (ctaUrl) {
      if (ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://') || ctaUrl.startsWith('mailto:') || ctaUrl.startsWith('tel:')) {
        window.open(ctaUrl, '_blank');
      } else if (ctaUrl.startsWith('#')) {
        const el = document.querySelector(ctaUrl);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          handleCTA('method');
        }
      } else {
        window.location.href = ctaUrl;
      }
    } else {
      handleCTA('method');
    }
  };

  const cards: PillarCardItem[] = Array.isArray(config.cards) && config.cards.length > 0
    ? config.cards
    : DEFAULT_PILLAR_CARDS;

  const columns = config.columns || '3'; // '2' | '3' | '4' | 'bento'
  const sectionBg = config.sectionBg || 'secondary'; // 'secondary' | 'white' | 'cream' | 'forest-subtle' | 'gradient' | 'custom'
  const sectionBgCustom = config.sectionBgCustom;
  const sectionBgDark = config.sectionBgDark || 'dark'; // 'dark' | 'forest-dark' | 'slate-dark' | 'zinc-dark' | 'gradient-dark' | 'custom'
  const sectionBgCustomDark = config.sectionBgCustomDark;

  // Background Class or Style
  const getSectionBgStyle = (): React.CSSProperties | undefined => {
    const style: Record<string, string> = {};
    if (sectionBg === 'custom' && sectionBgCustom) {
      style['--sec-bg-light'] = sectionBgCustom;
    }
    if (sectionBgDark === 'custom' && sectionBgCustomDark) {
      style['--sec-bg-dark'] = sectionBgCustomDark;
    }
    return Object.keys(style).length > 0 ? (style as React.CSSProperties) : undefined;
  };

  const getSectionBgClass = () => {
    let lightClass = 'bg-secondary';
    switch (sectionBg) {
      case 'white':
        lightClass = 'bg-white';
        break;
      case 'cream':
        lightClass = 'bg-[#faf8f5]';
        break;
      case 'forest-subtle':
        lightClass = 'bg-[#f2f7f4]';
        break;
      case 'gradient':
        lightClass = 'bg-gradient-to-b from-[#faf8f5] via-[#f2f7f4] to-[#f4f8f5]';
        break;
      case 'custom':
        lightClass = sectionBgCustom ? 'bg-[var(--sec-bg-light)]' : 'bg-secondary';
        break;
      case 'secondary':
      default:
        lightClass = 'bg-secondary';
        break;
    }

    let darkClass = 'dark:bg-slate-950 dark:text-white';
    switch (sectionBgDark) {
      case 'forest-dark':
        darkClass = 'dark:bg-[#0c1811] dark:text-white';
        break;
      case 'slate-dark':
        darkClass = 'dark:bg-slate-900 dark:text-white';
        break;
      case 'zinc-dark':
        darkClass = 'dark:bg-zinc-950 dark:text-white';
        break;
      case 'gradient-dark':
        darkClass = 'dark:bg-gradient-to-b dark:from-slate-950 dark:via-[#0c1811] dark:to-slate-950 dark:text-white';
        break;
      case 'custom':
        darkClass = sectionBgCustomDark ? 'dark:bg-[var(--sec-bg-dark)] dark:text-white' : 'dark:bg-slate-950 dark:text-white';
        break;
      case 'dark':
      default:
        darkClass = 'dark:bg-slate-950 dark:text-white';
        break;
    }

    return `${lightClass} ${darkClass}`;
  };

  // Shape class resolver
  const getShapeClass = (shape?: string) => {
    switch (shape) {
      case 'arch':
        return 'rounded-t-[4rem] rounded-b-2xl';
      case 'leaf':
        return 'rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-xl rounded-bl-xl';
      case 'blob':
        return 'rounded-[3.5rem_1.25rem_3.5rem_1.25rem]';
      case 'squircle':
        return 'rounded-[2.8rem]';
      case 'pill':
        return 'rounded-[4rem]';
      case 'minimal':
        return 'rounded-none border-2 border-slate-300 shadow-none';
      case 'rounded':
      default:
        return 'rounded-3xl';
    }
  };

  // Hover animation resolver
  const getHoverAnimation = (hoverEffect?: string, baseRotate: number = 0) => {
    switch (hoverEffect) {
      case 'scale':
        return { scale: 1.05, rotate: baseRotate, boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.15)', transition: { duration: 0.22, ease: 'easeOut' } };
      case 'glow':
        return { y: -6, rotate: baseRotate, boxShadow: '0 0 35px 3px rgba(27, 59, 43, 0.35)', transition: { duration: 0.22, ease: 'easeOut' } };
      case 'tilt':
        return { rotate: baseRotate + 2.5, scale: 1.04, y: -4, boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.15)', transition: { duration: 0.22, ease: 'easeOut' } };
      case 'border':
        return { scale: 1.02, rotate: baseRotate, y: -4, boxShadow: '0 0 0 3px #1b3b2b, 0 20px 30px -10px rgba(0,0,0,0.15)', transition: { duration: 0.22, ease: 'easeOut' } };
      case 'none':
        return { rotate: baseRotate };
      case 'lift':
      default:
        return { y: -10, rotate: baseRotate, boxShadow: '0 25px 35px -10px rgba(0, 0, 0, 0.18), 0 10px 15px -5px rgba(0, 0, 0, 0.05)', transition: { duration: 0.22, ease: 'easeOut' } };
    }
  };

  // Columns layout class
  const getGridColsClass = () => {
    if (columns === '2') return 'grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8';
    if (columns === '4') return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8';
    if (columns === 'bento') return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8';
  };

  // Fallback to legacy slider if explicitly requested
  const isLegacySlider = config.layoutStyle === 'split_slider';

  // Legacy slides state
  const legacySlides = [
    'Guiamos a cada niño en la construcción de su ser con una educación bilingüe, viva y consciente, basada en Montessori y en las necesidades del mundo actual.',
    'Honramos la niñez con un entorno preparado que impulsa curiosidad, autonomía y decisiones con propósito, desarrollando atención, autorregulación y pensamiento flexible.',
    'Crecemos en conexión con la naturaleza, cultivando conciencia ecológica, y formamos líderes empáticos que colaboran con respeto y contribuyen con responsabilidad.'
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!isLegacySlider) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % legacySlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isLegacySlider]);

  if (isLegacySlider) {
    return (
      <section id="metodo" className="section-padding bg-secondary overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <FadeInScroll direction="left">
                <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-card relative z-10">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    src={casaNinosImage}
                    alt="Ambiente Montessori preparado"
                    className="w-full h-full object-cover"
                  />
                </div>
              </FadeInScroll>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <FadeInScroll direction="right">
                <span className="text-accent font-medium text-sm uppercase tracking-wider block mb-6">
                  {t('Acompañamos la intención, guiando su dirección.')}
                </span>
                
                <div className="relative min-h-[140px] mb-4 overflow-hidden flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentSlide}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="font-display text-xl md:text-2xl font-medium text-foreground leading-relaxed text-balance"
                    >
                      {t(legacySlides[currentSlide])}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 mb-8 justify-start">
                  {legacySlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        currentSlide === idx ? 'bg-accent w-6' : 'bg-accent/30 hover:bg-accent/50'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </FadeInScroll>

              <FadeInScroll delay={0.4} direction="up">
                <Magnetic strength={0.15}>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => handleCTA('method')}
                    className="rounded-full px-8 overflow-hidden shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    {t('Nuestro Método Montessori')}
                  </Button>
                </Magnetic>
              </FadeInScroll>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // MODERN PILLARS MOSAIC RENDERER
  const alignClass = section?.layoutVariant === 'center'
    ? 'text-center mx-auto items-center'
    : section?.layoutVariant === 'right'
    ? 'text-right ml-auto items-end'
    : 'text-left mr-auto items-start';

  // Mission card radius resolver
  const getMissionRadiusClass = (radius?: string) => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'md': return 'rounded-xl';
      case 'lg': return 'rounded-2xl';
      case 'xl': return 'rounded-3xl';
      case '2xl': return 'rounded-[2rem]';
      case 'full': return 'rounded-full';
      case '3xl':
      default: return 'rounded-[2.5rem]';
    }
  };

  const missionAlign = config.mission_align || 'left';
  const missionAlignClass = missionAlign === 'center'
    ? 'text-center items-center md:items-center'
    : missionAlign === 'right'
    ? 'text-right items-end md:items-end'
    : 'text-left items-start md:items-start';

  const missionCardBg = config.mission_bg_color;
  const isMissionGradient = !missionCardBg || missionCardBg === 'gradient';

  return (
    <section
      id={section?.anchor || section?.id || 'metodo'}
      style={getSectionBgStyle()}
      className={`section-padding ${getSectionBgClass()} relative overflow-hidden transition-colors duration-300`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <FadeInScroll
          direction="up"
          className={`space-y-4 mb-12 sm:mb-16 ${
            section?.layoutVariant === 'center'
              ? 'text-center mx-auto max-w-3xl'
              : section?.layoutVariant === 'right'
              ? 'text-right ml-auto max-w-3xl'
              : 'text-left max-w-3xl'
          }`}
        >
          {badgeText && (
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest/10 border border-forest/20 text-xs font-bold uppercase tracking-wider text-forest`}
            >
              <Sparkles className="w-3.5 h-3.5 text-forest" />
              <span style={{ fontFamily: badgeFontFamily, color: badgeColor }}>
                {badgeText}
              </span>
            </div>
          )}

          {titleText && (
            <h2
              style={{ fontFamily: titleFontFamily, color: titleColor }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground leading-[1.15] whitespace-pre-line"
            >
              {titleText}
            </h2>
          )}

          {subtitleText && (
            <p
              style={{ fontFamily: subtitleFontFamily, color: subtitleColor }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-line"
            >
              {subtitleText}
            </p>
          )}
        </FadeInScroll>

        {/* Highlighted Mission Card (if enabled) */}
        {config.showMission !== false && missionText && (
          <FadeInScroll direction="up" className="mb-10 lg:mb-12">
            <div
              style={{
                backgroundColor: isMissionGradient ? undefined : missionCardBg,
                color: missionColor || undefined
              }}
              className={`p-6 sm:p-8 md:p-10 ${getMissionRadiusClass(config.mission_radius)} ${
                isMissionGradient
                  ? 'bg-gradient-to-r from-forest via-forest-light to-forest text-white'
                  : 'shadow-xl'
              } relative overflow-hidden transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className={`space-y-2 flex flex-col ${missionAlignClass} max-w-3xl flex-1`}>
                  {config.missionBadgeText && (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>{getLocalizedText(config, 'missionBadgeText', '')}</span>
                    </div>
                  )}
                  <p
                    style={{ fontFamily: missionFontFamily, color: missionColor }}
                    className="text-base sm:text-lg md:text-xl font-display font-medium leading-relaxed text-balance whitespace-pre-line"
                  >
                    "{missionText}"
                  </p>
                </div>
                {isCtaActive && (
                  <Magnetic strength={0.15}>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleCtaClick}
                      style={{
                        fontFamily: ctaFontFamily,
                        color: ctaColor
                      }}
                      className="rounded-full px-7 bg-white text-forest hover:bg-white/90 shadow-md shrink-0 font-bold"
                    >
                      {ctaText}
                    </Button>
                  </Magnetic>
                )}
              </div>
            </div>
          </FadeInScroll>
        )}

        {/* Dynamic Cards Grid */}
        <div className={getGridColsClass()}>
          {cards.map((card, index) => {
            const cardTitle = getLocalizedText(card, 'title', `Tarjeta ${index + 1}`);
            const cardSubtitle = getLocalizedText(card, 'subtitle', '');
            const IconComponent = card.icon && PILLAR_ICONS_MAP[card.icon] ? PILLAR_ICONS_MAP[card.icon] : Compass;
            const shapeClass = getShapeClass(card.shape);
            const cardRotation = Number(card.rotateZ ?? card.rotation ?? 0) || 0;
            const hoverAnim = getHoverAnimation(card.hoverEffect, cardRotation);

            const cardTitleFont = getSectionFontFamily(card.titleFont || config.card_title_font);
            const cardSubtitleFont = getSectionFontFamily(card.subtitleFont || config.card_subtitle_font);

            return (
              <FadeInScroll
                key={card.id || index}
                delay={index * 0.08}
                direction="up"
              >
                <motion.div
                  animate={{ rotate: cardRotation }}
                  whileHover={hoverAnim}
                  style={{
                    backgroundColor: card.bgColor || undefined,
                    color: card.textColor || undefined
                  }}
                  className={`group p-7 sm:p-8 h-full flex flex-col justify-between shadow-card border border-black/5 relative overflow-hidden cursor-default bg-white dark:bg-slate-900 ${shapeClass}`}
                >
                  <div className="space-y-4">
                    {/* Card Icon or Custom Image */}
                    <div className="flex items-center justify-between">
                      {card.imageUrl ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xs shrink-0 border border-white/40">
                          <img
                            src={card.imageUrl}
                            alt={cardTitle}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-forest/10 text-forest flex items-center justify-center shadow-xs shrink-0 group-hover:scale-110 group-hover:bg-forest group-hover:text-white transition-all duration-500">
                          <IconComponent className="w-7 h-7 transition-colors" />
                        </div>
                      )}

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/5 text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="space-y-2">
                      <h3
                        style={{
                          fontFamily: cardTitleFont,
                          color: card.titleColor || undefined
                        }}
                        className="font-display text-lg sm:text-xl font-bold text-foreground leading-snug whitespace-pre-line"
                      >
                        {cardTitle}
                      </h3>
                      {cardSubtitle && (
                        <p
                          style={{
                            fontFamily: cardSubtitleFont,
                            color: card.subtitleColor || card.textColor || undefined
                          }}
                          className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                        >
                          {cardSubtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Decorative Subtle Indicator */}
                  <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between text-[11px] font-bold text-forest/70 group-hover:text-forest transition-colors">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {card.badge || ''}
                    </span>
                    <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-forest" />
                  </div>
                </motion.div>
              </FadeInScroll>
            );
          })}
        </div>

        {/* Section Bottom CTA Button (when enabled and no mission card or as primary action) */}
        {isCtaActive && (
          <FadeInScroll direction="up" className="mt-12 sm:mt-16 text-center">
            <Magnetic strength={0.15}>
              <Button
                variant="default"
                size="lg"
                onClick={handleCtaClick}
                style={{
                  fontFamily: ctaFontFamily,
                  color: ctaColor
                }}
                className="rounded-full px-9 py-6 text-sm sm:text-base font-bold bg-forest text-white hover:bg-forest/90 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {ctaText}
              </Button>
            </Magnetic>
          </FadeInScroll>
        )}

      </div>
    </section>
  );
}

export default PhilosophySection;
