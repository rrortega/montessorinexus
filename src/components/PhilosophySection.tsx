import React, { useState, useEffect } from 'react';
import { motion, useTransform, AnimatePresence } from 'framer-motion';
import {
  Compass,
  BookOpen,
  Award,
  Globe,
  Leaf,
  Heart,
  Sparkles,
  Sun,
  Users,
  Smile,
  Feather,
  Shield,
  Star,
  Lightbulb,
  Eye,
  Layers,
  Anchor,
  Trees,
  Flower2,
  Music,
  Palette,
  Check,
  GraduationCap
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
  bgColor?: string;
  bgColorDark?: string;
  textColor?: string;
  textColorDark?: string;
  shape?: 'rounded' | 'blob' | 'arch' | 'squircle' | 'minimal';
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'tilt' | 'border';
}

export const PILLAR_ICONS_MAP: Record<string, React.ElementType> = {
  Compass,
  BookOpen,
  Award,
  Globe,
  Leaf,
  Heart,
  Sparkles,
  Sun,
  Users,
  Smile,
  Feather,
  Shield,
  Star,
  Lightbulb,
  Eye,
  Layers,
  Anchor,
  Trees,
  Flower2,
  Music,
  Palette,
  GraduationCap
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

  const badgeColor = config.badge_color || undefined;
  const titleColor = config.title_color || undefined;
  const subtitleColor = config.subtitle_color || undefined;
  const missionColor = config.mission_color || undefined;

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

  const cards: PillarCardItem[] = Array.isArray(config.cards) && config.cards.length > 0
    ? config.cards
    : DEFAULT_PILLAR_CARDS;

  const columns = config.columns || '3'; // '2' | '3' | '4' | 'bento'
  const sectionBg = config.sectionBg || 'secondary'; // 'secondary' | 'white' | 'cream' | 'forest-subtle' | 'dark' | 'gradient' | 'custom'
  const sectionBgCustom = config.sectionBgCustom;

  // Background Class or Style
  const getSectionBgStyle = () => {
    if (sectionBg === 'custom' && sectionBgCustom) {
      return { backgroundColor: sectionBgCustom };
    }
    return undefined;
  };

  const getSectionBgClass = () => {
    switch (sectionBg) {
      case 'white':
        return 'bg-white';
      case 'cream':
        return 'bg-[#faf8f5]';
      case 'forest-subtle':
        return 'bg-[#f2f7f4]';
      case 'dark':
        return 'bg-slate-950 text-white';
      case 'gradient':
        return 'bg-gradient-to-b from-[#faf8f5] via-[#f2f7f4] to-[#f4f8f5]';
      case 'secondary':
      default:
        return 'bg-secondary';
    }
  };

  // Shape class resolver
  const getShapeClass = (shape?: string) => {
    switch (shape) {
      case 'blob':
        return 'rounded-[2.5rem_1rem_2.5rem_1rem]';
      case 'arch':
        return 'rounded-t-[3.5rem] rounded-b-2xl';
      case 'squircle':
        return 'rounded-[2rem]';
      case 'minimal':
        return 'rounded-2xl border border-slate-200/80 shadow-xs';
      case 'rounded':
      default:
        return 'rounded-3xl';
    }
  };

  // Hover animation resolver
  const getHoverAnimation = (hoverEffect?: string) => {
    switch (hoverEffect) {
      case 'scale':
        return { scale: 1.04, transition: { duration: 0.25, ease: 'easeOut' } };
      case 'glow':
        return { y: -6, boxShadow: '0 16px 36px -8px rgba(27, 59, 43, 0.22)', transition: { duration: 0.25 } };
      case 'tilt':
        return { rotate: 1.5, scale: 1.03, transition: { duration: 0.25 } };
      case 'border':
        return { scale: 1.02, borderColor: '#1b3b2b', transition: { duration: 0.25 } };
      case 'lift':
      default:
        return { y: -8, boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.1)', transition: { duration: 0.25 } };
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

  return (
    <section
      id="metodo"
      style={getSectionBgStyle()}
      className={`section-padding overflow-hidden transition-colors duration-300 relative ${getSectionBgClass()}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Block */}
        <FadeInScroll className={`mb-12 md:mb-16 flex flex-col ${alignClass} max-w-3xl`}>
          {badgeText && (
            <span
              style={{ fontFamily: badgeFontFamily, color: badgeColor }}
              className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-primary mb-3 px-3.5 py-1 rounded-full bg-primary/10 inline-block"
            >
              {badgeText}
            </span>
          )}

          {titleText && (
            <h2
              style={{ fontFamily: titleFontFamily, color: titleColor }}
              className="heading-section text-foreground mb-4 leading-tight text-balance"
            >
              {titleText}
            </h2>
          )}

          {subtitleText && (
            <p
              style={{ fontFamily: subtitleFontFamily, color: subtitleColor }}
              className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed"
            >
              {subtitleText}
            </p>
          )}
        </FadeInScroll>

        {/* Highlighted Mission Card (if enabled) */}
        {config.showMission !== false && missionText && (
          <FadeInScroll direction="up" className="mb-10 lg:mb-12">
            <div className="p-6 sm:p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-r from-forest via-forest-light to-forest text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="space-y-2 text-center md:text-left max-w-3xl">
                  <div className="flex items-center gap-2 justify-center md:justify-start text-white/80 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Nuestra Misión & Compromiso Pedagógico</span>
                  </div>
                  <p
                    style={{ fontFamily: missionFontFamily, color: missionColor }}
                    className="text-base sm:text-lg md:text-xl font-display font-medium text-white leading-relaxed text-balance"
                  >
                    "{missionText}"
                  </p>
                </div>
                {section?.ctaText && (
                  <Magnetic strength={0.15}>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => handleCTA('method')}
                      className="rounded-full px-7 bg-white text-forest hover:bg-white/90 shadow-md shrink-0 font-bold"
                    >
                      {getLocalizedText(section, 'ctaText', 'Conoce Más')}
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
            const cardTitle = getLocalizedText(card, 'title', `Pilar ${index + 1}`);
            const cardSubtitle = getLocalizedText(card, 'subtitle', '');
            const IconComponent = card.icon && PILLAR_ICONS_MAP[card.icon] ? PILLAR_ICONS_MAP[card.icon] : Compass;
            const shapeClass = getShapeClass(card.shape);
            const hoverAnim = getHoverAnimation(card.hoverEffect);

            return (
              <FadeInScroll
                key={card.id || index}
                delay={index * 0.08}
                direction="up"
              >
                <motion.div
                  whileHover={hoverAnim}
                  style={{
                    backgroundColor: card.bgColor || '#ffffff',
                    color: card.textColor || undefined
                  }}
                  className={`group p-7 sm:p-8 h-full flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all duration-300 border border-black/5 relative overflow-hidden cursor-default ${shapeClass}`}
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
                        0{index + 1}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="space-y-2">
                      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground leading-snug">
                        {cardTitle}
                      </h3>
                      {cardSubtitle && (
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {cardSubtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Decorative Subtle Accent Indicator */}
                  <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between text-[11px] font-bold text-forest/70 group-hover:text-forest transition-colors">
                    <span className="text-[10px] uppercase tracking-wider">Esencia Montessori</span>
                    <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              </FadeInScroll>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default PhilosophySection;
