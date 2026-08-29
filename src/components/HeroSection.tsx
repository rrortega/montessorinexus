import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import {
  MessageCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Heart,
  Calendar,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Globe,
  Mail,
  PhoneCall,
  ArrowRight
} from 'lucide-react';
import { useMouseParallax } from '@/hooks/use-mouse-parallax';
import { Magnetic } from '@/components/ui/magnetic';
import { useSiteSettings } from '@/context/SettingsContext';
import heroImageDefault from '@/assets/hero-montessori.jpeg';
import React, { useState, useEffect } from 'react';
import { useCTA } from '@/hooks/use-cta';

// Multi-layered Composite Sticker Animation Wrapper
function AnimatedSticker({
  effects = [],
  children,
  className = ''
}: {
  effects: string[];
  children: React.ReactNode;
  className?: string;
}) {
  let content = <>{children}</>;

  if (effects.includes('wiggle')) {
    content = (
      <motion.div
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {content}
      </motion.div>
    );
  }

  if (effects.includes('pulse')) {
    content = (
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {content}
      </motion.div>
    );
  }

  if (effects.includes('rotate-slow')) {
    content = (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        {content}
      </motion.div>
    );
  }

  if (effects.includes('float')) {
    content = (
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={className}>{content}</div>;
}

export function HeroSection() {
  const { t, locale } = useI18n();
  const { handleCTA } = useCTA();
  const {
    settings,
    schoolName,
    brandPrimaryColor: defaultBrandPrimary,
    brandSecondaryColor: defaultBrandSecondary,
    brandAccentColor: defaultBrandAccent,
    socialLinks
  } = useSiteSettings();

  const isEn = locale === 'en';

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const brandPrimaryColor = isDarkMode
    ? (settings?.brand_primary_dark || settings?.brand_primary_color || defaultBrandPrimary || '#10b981')
    : (settings?.brand_primary_color || settings?.brand_primary_dark || defaultBrandPrimary || '#1b3b2b');

  const brandSecondaryColor = isDarkMode
    ? (settings?.brand_secondary_dark || settings?.brand_secondary_color || defaultBrandSecondary || '#064e3b')
    : (settings?.brand_secondary_color || settings?.brand_secondary_dark || defaultBrandSecondary || '#2d5a40');

  const brandAccentColor = isDarkMode
    ? (settings?.brand_accent_dark || settings?.brand_accent_color || defaultBrandAccent || '#fbbf24')
    : (settings?.brand_accent_color || settings?.brand_accent_dark || defaultBrandAccent || '#d97706');

  const brandTextColor = isDarkMode
    ? (settings?.brand_text_dark || '#f9fafb')
    : (settings?.brand_text_light || settings?.brand_text_color || '#111827');

  const brandBgColor = isDarkMode
    ? (settings?.brand_bg_dark || '#09130e')
    : (settings?.brand_bg_light || settings?.brand_background_color || '#f8f5ee');

  const brandSurfaceColor = isDarkMode
    ? (settings?.brand_surface_dark || '#11231a')
    : (settings?.brand_surface_light || settings?.brand_surface_color || '#ffffff');

  // Palette Color Resolution Helper
  const resolvePaletteColor = (token: string | undefined, defaultColor: string) => {
    if (!token) return defaultColor;
    if (token === 'primary') return brandPrimaryColor;
    if (token === 'secondary') return brandSecondaryColor;
    if (token === 'accent') return brandAccentColor;
    if (token === 'text') return brandTextColor;
    if (token === 'background') return brandBgColor;
    if (token === 'surface') return brandSurfaceColor;
    if (token === 'white') return '#ffffff';
    if (token === 'dark') return '#0f172a';
    if (token.startsWith('#') || token.startsWith('rgb')) return token;
    return defaultColor;
  };

  // Custom Content Texts (Bilingual resolution: English setting -> translated fallback -> default)
  const showBadge = settings?.hero_badge_show !== 'false';
  const badgeText = showBadge
    ? (isEn && settings?.hero_badge_en !== undefined && settings.hero_badge_en !== ''
        ? settings.hero_badge_en.trim()
        : (settings?.hero_badge !== undefined
            ? (isEn ? t(settings.hero_badge.trim()) : settings.hero_badge.trim())
            : (isEn ? '100% Bilingual Montessori School' : 'Colegio Montessori 100% Bilingüe')))
    : '';

  // Determine Title text (Bilingual resolution)
  const hasSpecificTitleParts =
    settings?.hero_title_part1 !== undefined ||
    settings?.hero_title_part2 !== undefined ||
    settings?.hero_title_part1_en !== undefined ||
    settings?.hero_title_part2_en !== undefined;

  const rawTitlePart1 = isEn && settings?.hero_title_part1_en !== undefined && settings.hero_title_part1_en !== ''
    ? settings.hero_title_part1_en.trim()
    : (settings?.hero_title_part1 !== undefined
        ? (isEn ? t(settings.hero_title_part1.trim()) : settings.hero_title_part1.trim())
        : undefined);

  const rawTitlePart2 = isEn && settings?.hero_title_part2_en !== undefined && settings.hero_title_part2_en !== ''
    ? settings.hero_title_part2_en.trim()
    : (settings?.hero_title_part2 !== undefined
        ? (isEn ? t(settings.hero_title_part2.trim()) : settings.hero_title_part2.trim())
        : undefined);

  const titlePart1Text = hasSpecificTitleParts
    ? (rawTitlePart1 !== undefined ? rawTitlePart1 : '')
    : (settings?.hero_title !== undefined
        ? (settings.hero_title.trim()
            ? (isEn ? t(settings.hero_title.trim()).split(' ').slice(0, 2).join(' ') : settings.hero_title.trim().split(' ').slice(0, 2).join(' '))
            : '')
        : (isEn ? 'Every child' : 'Cada niño'));

  const titlePart2Text = hasSpecificTitleParts
    ? (rawTitlePart2 !== undefined ? rawTitlePart2 : '')
    : (settings?.hero_title !== undefined
        ? (settings.hero_title.trim()
            ? (isEn ? (t(settings.hero_title.trim()).split(' ').slice(2).join(' ') || t(settings.hero_title.trim()).split(' ')[1] || '') : (settings.hero_title.trim().split(' ').slice(2).join(' ') || settings.hero_title.trim().split(' ')[1] || ''))
            : '')
        : (isEn ? 'leaves a unique mark' : 'deja una huella única'));

  const hasTitle = Boolean(titlePart1Text) || Boolean(titlePart2Text);

  const subtitleText = isEn && settings?.hero_subtitle_en !== undefined && settings.hero_subtitle_en !== ''
    ? settings.hero_subtitle_en.trim()
    : (settings?.hero_subtitle !== undefined
        ? (isEn ? t(settings.hero_subtitle.trim()) : settings.hero_subtitle.trim())
        : (isEn ? 'We guide children in their development based on respect, independence, and Montessori philosophy.' : 'Acompañamos a los niños en su desarrollo desde el respeto, la independencia y con base en la filosofía Montessori.'));

  const ctaPrimaryText = isEn && settings?.hero_cta_text_en !== undefined && settings.hero_cta_text_en !== ''
    ? settings.hero_cta_text_en.trim()
    : (settings?.hero_cta_text !== undefined
        ? (isEn ? t(settings.hero_cta_text.trim()) : settings.hero_cta_text.trim())
        : (isEn ? 'Request Info' : 'Quiero informes'));

  const ctaSecondaryText = isEn && settings?.hero_secondary_cta_text_en !== undefined && settings.hero_secondary_cta_text_en !== ''
    ? settings.hero_secondary_cta_text_en.trim()
    : (settings?.hero_secondary_cta_text !== undefined
        ? (isEn ? t(settings.hero_secondary_cta_text.trim()) : settings.hero_secondary_cta_text.trim())
        : (isEn ? 'Info' : 'Informes'));

  const ctaSubtext = isEn && settings?.hero_cta_subtext_en !== undefined && settings.hero_cta_subtext_en !== ''
    ? settings.hero_cta_subtext_en.trim()
    : (settings?.hero_cta_subtext !== undefined
        ? (isEn ? t(settings.hero_cta_subtext.trim()) : settings.hero_cta_subtext.trim())
        : '');

  const showSecondaryCta = settings?.hero_show_secondary_cta !== 'false' && Boolean(ctaSecondaryText);
  const hasAnyCTA = Boolean(ctaPrimaryText) || showSecondaryCta;

  const badgeColor = resolvePaletteColor(settings?.hero_badge_color, brandPrimaryColor);
  const titleColor1 = resolvePaletteColor(settings?.hero_title_color_1, brandPrimaryColor);
  const titleColor2 = resolvePaletteColor(settings?.hero_title_color_2, brandSecondaryColor || brandAccentColor || '#d97706');
  const subtitleColor = resolvePaletteColor(settings?.hero_subtitle_color, brandTextColor || '#334155');
  const ctaBgColor = resolvePaletteColor(settings?.hero_cta_bg_color, brandPrimaryColor);

  // Hero Configuration Settings
  const template = settings?.hero_template || 'image-overlay-waves'; // 'organic-montessori-stickers' | 'curved-contrast-bubble' | 'geometric-rhombus' | 'curved-cutout-student' | 'image-overlay-waves' | 'split-2-col' | 'centered-capsule' | 'gradient-organic'
  const align = (settings?.hero_align as 'left' | 'center' | 'right') || 'left';
  const bottomShape = settings?.hero_bottom_shape || 'waves-1'; // 'waves-1' | 'waves-2' | 'curve-arch' | 'slant' | 'triangle' | 'none'
  const shapeHeight = Number(settings?.hero_shape_height) || 90;
  const shapeInverted = settings?.hero_shape_inverted === 'true';

  const patternOverlay = settings?.hero_pattern_overlay || 'none'; // 'none' | 'dots' | 'grid' | 'cross' | 'diagonal' | 'mesh' | 'doodles'
  const patternOpacity = settings?.hero_pattern_opacity !== undefined && !isNaN(Number(settings?.hero_pattern_opacity))
    ? Number(settings.hero_pattern_opacity) / 100
    : 0.25;
  const patternSize = settings?.hero_pattern_size !== undefined && !isNaN(Number(settings?.hero_pattern_size))
    ? Number(settings.hero_pattern_size)
    : 32;

  const bgImageUrl = settings?.hero_image_url || heroImageDefault;
  const overlayOpacity = settings?.hero_overlay_opacity ? Number(settings.hero_overlay_opacity) / 100 : 0.65;

  // Spacing & Typography for Hero Text Blocks
  const textPaddingTop = Number(settings?.hero_text_padding_top) || 0;
  const textPaddingBottom = Number(settings?.hero_text_padding_bottom) || 0;

  const resolveFontFamily = (fontKey?: string, fallback: string = 'inherit'): string => {
    switch (fontKey) {
      case 'new-kansas':
        return "'New Kansas', 'Fraunces', 'Cooper Black', serif";
      case 'articulat-cf':
        return "'Articulat CF', 'Articulat', 'Plus Jakarta Sans', sans-serif";
      case 'outfit':
        return "'Outfit', sans-serif";
      case 'lexend':
        return "'Lexend', sans-serif";
      case 'fredoka':
        return "'Fredoka', cursive, sans-serif";
      case 'caveat':
        return "'Caveat', cursive";
      case 'dancing':
        return "'Dancing Script', cursive";
      case 'comfortaa':
        return "'Comfortaa', cursive, sans-serif";
      case 'playfair':
        return "'Playfair Display', serif";
      case 'merriweather':
        return "'Merriweather', serif";
      case 'cinzel':
        return "'Cinzel', serif";
      case 'jakarta':
        return "'Plus Jakarta Sans', sans-serif";
      case 'poppins':
        return "'Poppins', sans-serif";
      case 'montserrat':
        return "'Montserrat', sans-serif";
      case 'quicksand':
        return "'Quicksand', sans-serif";
      case 'nunito':
        return "'Nunito', sans-serif";
      case 'raleway':
        return "'Raleway', sans-serif";
      case 'inter':
        return "'Inter', sans-serif";
      case 'mono':
        return "monospace";
      case 'serif':
        return "Georgia, serif";
      case 'display':
        return "'Outfit', system-ui, sans-serif";
      case 'sans':
        return "system-ui, sans-serif";
      default:
        return fallback;
    }
  };

  const badgeFont = resolveFontFamily(settings?.hero_badge_font, 'inherit');
  const badgeSize = Number(settings?.hero_badge_size) || 0;
  const badgeMarginTop = Number(settings?.hero_badge_margin_top) || 0;
  const badgeMarginBottom = settings?.hero_badge_margin_bottom !== undefined && !isNaN(Number(settings?.hero_badge_margin_bottom))
    ? Number(settings.hero_badge_margin_bottom)
    : 16;

  const titleFont = resolveFontFamily(settings?.hero_title_font, 'inherit');
  const titleSize = Number(settings?.hero_title_size) || 0;
  const titleMarginTop = Number(settings?.hero_title_margin_top) || 0;
  const titleMarginBottom = settings?.hero_title_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_margin_bottom))
    ? Number(settings.hero_title_margin_bottom)
    : 20;

  const titlePart1Tag = (settings?.hero_title_part1_tag || 'h1').toLowerCase();
  const TitlePart1Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'span', 'div'].includes(titlePart1Tag) ? titlePart1Tag : 'h1') as any;
  const titlePart1Font = resolveFontFamily(settings?.hero_title_part1_font || settings?.hero_title_font, 'inherit');
  const titlePart1Size = Number(settings?.hero_title_part1_size !== undefined ? settings.hero_title_part1_size : settings?.hero_title_size) || 0;
  const titlePart1MarginTop = Number(settings?.hero_title_part1_margin_top !== undefined ? settings.hero_title_part1_margin_top : settings?.hero_title_margin_top) || 0;
  const titlePart1MarginBottom = settings?.hero_title_part1_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_part1_margin_bottom))
    ? Number(settings.hero_title_part1_margin_bottom)
    : 0;

  const titlePart2Tag = (settings?.hero_title_part2_tag || 'h1').toLowerCase();
  const TitlePart2Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'span', 'div'].includes(titlePart2Tag) ? titlePart2Tag : 'h1') as any;
  const titlePart2Font = resolveFontFamily(settings?.hero_title_part2_font || settings?.hero_title_font, 'inherit');
  const titlePart2Size = Number(settings?.hero_title_part2_size !== undefined ? settings.hero_title_part2_size : settings?.hero_title_size) || 0;
  const titlePart2MarginTop = Number(settings?.hero_title_part2_margin_top) || 0;
  const titlePart2MarginBottom = settings?.hero_title_part2_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_part2_margin_bottom))
    ? Number(settings.hero_title_part2_margin_bottom)
    : (settings?.hero_title_margin_bottom !== undefined && !isNaN(Number(settings?.hero_title_margin_bottom)) ? Number(settings.hero_title_margin_bottom) : 20);

  const subtitleFont = resolveFontFamily(settings?.hero_subtitle_font, 'inherit');
  const subtitleSize = Number(settings?.hero_subtitle_size) || 0;
  const subtitleMarginTop = Number(settings?.hero_subtitle_margin_top) || 0;
  const subtitleMarginBottom = settings?.hero_subtitle_margin_bottom !== undefined && !isNaN(Number(settings?.hero_subtitle_margin_bottom))
    ? Number(settings.hero_subtitle_margin_bottom)
    : 24;

  const ctaFont = resolveFontFamily(settings?.hero_cta_font, 'inherit');
  const ctaSize = Number(settings?.hero_cta_size) || 0;
  const ctaMarginTop = settings?.hero_cta_margin_top !== undefined && !isNaN(Number(settings?.hero_cta_margin_top))
    ? Number(settings.hero_cta_margin_top)
    : 8;
  const ctaMarginBottom = Number(settings?.hero_cta_margin_bottom) || 0;
  const ctaSubtextSize = Number(settings?.hero_cta_subtext_size) || 0;
  const cta2Font = resolveFontFamily(settings?.hero_cta2_font, 'inherit');
  const cta2Size = Number(settings?.hero_cta2_size) || 0;

  // Parameters for Curved Cutout Student & Bubble Templates
  const studentImageUrl = settings?.hero_student_image_url || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80';
  const circleY = Number(settings?.hero_circle_y) || 0;
  const circleSize = Number(settings?.hero_circle_size) || 520;
  const waveY = Number(settings?.hero_wave_y) || 40;
  const curveIntensity = Number(settings?.hero_curve_intensity) || 60;
  const borderWidth = settings?.hero_border_width !== undefined && !isNaN(Number(settings?.hero_border_width))
    ? Number(settings?.hero_border_width)
    : 10;
  const layoutInverted = settings?.hero_layout_inverted === 'true';
  const showSocial = settings?.hero_show_social !== 'false';

  // Specific Fine Tuning Parameters for Dark Bubble Template
  const studentScale = Number(settings?.hero_student_scale) || 100;
  const studentX = Number(settings?.hero_student_x) || 0;
  const studentY = Number(settings?.hero_student_y) || 0;

  const circleScale = Number(settings?.hero_circle_scale) || 100;
  const circleX = Number(settings?.hero_circle_x) || 0;
  const circleY2 = Number(settings?.hero_circle_y2) || 0;
  const classroomImageUrl = settings?.hero_classroom_image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=80';

  // Parameters for Organic Montessori & Multi-effect Animated Stickers / Floating Elements
  const blobScale = Number(settings?.hero_blob_scale) || 100;
  const blobRotate = settings?.hero_blob_rotate !== undefined && !isNaN(Number(settings?.hero_blob_rotate))
    ? Number(settings.hero_blob_rotate)
    : -4;
  const blobRadiusType = settings?.hero_blob_radius_type || 'blob-1'; // 'none' | 'mosaic' | 'blob-1' | 'blob-2' | 'circle' | 'egg' | 'arch' | 'squircle' | 'leaf'
  const blobAnimateMorph = settings?.hero_blob_animate_morph === 'true';
  const blobMorphShapes = (settings?.hero_blob_morph_shapes || 'blob-1,blob-2,leaf')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const showWhatsappPulse = settings?.hero_show_whatsapp_pulse !== 'false';
  const buttonRadius = settings?.hero_button_radius || 'pill'; // 'pill' | 'rounded' | 'square'

  const parseEffects = (raw: string | undefined, defaultVal: string[]): string[] => {
    if (raw === undefined || raw === null) return defaultVal;
    if (!raw.trim()) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  };

  // Sticker 1 (Desktop, Tablet & Mobile Responsive Positions and Visibility)
  const sticker1Show = settings?.hero_sticker_1_show !== 'false';
  const sticker1ShowDesktop = settings?.hero_sticker_1_show_desktop !== 'false' && sticker1Show;
  const sticker1ShowTablet = settings?.hero_sticker_1_show_tablet !== 'false' && sticker1Show;
  const sticker1ShowMobile = settings?.hero_sticker_1_show_mobile !== 'false' && sticker1Show;
  const sticker1ImageUrl = settings?.hero_sticker_1_image_url || '';
  
  // Desktop
  const sticker1X = settings?.hero_sticker_1_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_x))
    ? Number(settings.hero_sticker_1_x)
    : 18;
  const sticker1Y = settings?.hero_sticker_1_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_y))
    ? Number(settings.hero_sticker_1_y)
    : 18;
  const sticker1Size = settings?.hero_sticker_1_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_size))
    ? Number(settings.hero_sticker_1_size)
    : 110;

  // Tablet
  const sticker1TabletX = settings?.hero_sticker_1_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_x))
    ? Number(settings.hero_sticker_1_tablet_x)
    : sticker1X;
  const sticker1TabletY = settings?.hero_sticker_1_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_y))
    ? Number(settings.hero_sticker_1_tablet_y)
    : sticker1Y;
  const sticker1TabletSize = settings?.hero_sticker_1_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_tablet_size))
    ? Number(settings.hero_sticker_1_tablet_size)
    : Math.round(sticker1Size * 0.85);

  // Mobile
  const sticker1MobileX = settings?.hero_sticker_1_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_x))
    ? Number(settings.hero_sticker_1_mobile_x)
    : sticker1X;
  const sticker1MobileY = settings?.hero_sticker_1_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_y))
    ? Number(settings.hero_sticker_1_mobile_y)
    : sticker1Y;
  const sticker1MobileSize = settings?.hero_sticker_1_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_1_mobile_size))
    ? Number(settings.hero_sticker_1_mobile_size)
    : Math.round(sticker1Size * 0.72);
  const sticker1Effects = parseEffects(settings?.hero_sticker_1_effects, ['float']);

  // Sticker 2 (Desktop, Tablet & Mobile Responsive Positions and Visibility)
  const sticker2Show = settings?.hero_sticker_2_show !== 'false';
  const sticker2ShowDesktop = settings?.hero_sticker_2_show_desktop !== 'false' && sticker2Show;
  const sticker2ShowTablet = settings?.hero_sticker_2_show_tablet !== 'false' && sticker2Show;
  const sticker2ShowMobile = settings?.hero_sticker_2_show_mobile !== 'false' && sticker2Show;
  const sticker2ImageUrl = settings?.hero_sticker_2_image_url || '';
  
  // Desktop
  const sticker2X = settings?.hero_sticker_2_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_x))
    ? Number(settings.hero_sticker_2_x)
    : 82;
  const sticker2Y = settings?.hero_sticker_2_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_y))
    ? Number(settings.hero_sticker_2_y)
    : 78;
  const sticker2Size = settings?.hero_sticker_2_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_size))
    ? Number(settings.hero_sticker_2_size)
    : 120;

  // Tablet
  const sticker2TabletX = settings?.hero_sticker_2_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_x))
    ? Number(settings.hero_sticker_2_tablet_x)
    : sticker2X;
  const sticker2TabletY = settings?.hero_sticker_2_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_y))
    ? Number(settings.hero_sticker_2_tablet_y)
    : sticker2Y;
  const sticker2TabletSize = settings?.hero_sticker_2_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_tablet_size))
    ? Number(settings.hero_sticker_2_tablet_size)
    : Math.round(sticker2Size * 0.85);

  // Mobile
  const sticker2MobileX = settings?.hero_sticker_2_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_x))
    ? Number(settings.hero_sticker_2_mobile_x)
    : sticker2X;
  const sticker2MobileY = settings?.hero_sticker_2_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_y))
    ? Number(settings.hero_sticker_2_mobile_y)
    : sticker2Y;
  const sticker2MobileSize = settings?.hero_sticker_2_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_2_mobile_size))
    ? Number(settings.hero_sticker_2_mobile_size)
    : Math.round(sticker2Size * 0.72);
  const sticker2Effects = parseEffects(settings?.hero_sticker_2_effects, ['float']);

  // Sticker 3 (Desktop, Tablet & Mobile Responsive Positions and Visibility)
  const sticker3Show = settings?.hero_sticker_3_show !== 'false';
  const sticker3ShowDesktop = settings?.hero_sticker_3_show_desktop !== 'false' && sticker3Show;
  const sticker3ShowTablet = settings?.hero_sticker_3_show_tablet !== 'false' && sticker3Show;
  const sticker3ShowMobile = settings?.hero_sticker_3_show_mobile !== 'false' && sticker3Show;
  const sticker3ImageUrl = settings?.hero_sticker_3_image_url || '';
  
  // Desktop
  const sticker3X = settings?.hero_sticker_3_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_x))
    ? Number(settings.hero_sticker_3_x)
    : 10;
  const sticker3Y = settings?.hero_sticker_3_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_y))
    ? Number(settings.hero_sticker_3_y)
    : 36;
  const sticker3Size = settings?.hero_sticker_3_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_size))
    ? Number(settings.hero_sticker_3_size)
    : 48;

  // Tablet
  const sticker3TabletX = settings?.hero_sticker_3_tablet_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_x))
    ? Number(settings.hero_sticker_3_tablet_x)
    : sticker3X;
  const sticker3TabletY = settings?.hero_sticker_3_tablet_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_y))
    ? Number(settings.hero_sticker_3_tablet_y)
    : sticker3Y;
  const sticker3TabletSize = settings?.hero_sticker_3_tablet_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_tablet_size))
    ? Number(settings.hero_sticker_3_tablet_size)
    : Math.round(sticker3Size * 0.85);

  // Mobile
  const sticker3MobileX = settings?.hero_sticker_3_mobile_x !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_x))
    ? Number(settings.hero_sticker_3_mobile_x)
    : sticker3X;
  const sticker3MobileY = settings?.hero_sticker_3_mobile_y !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_y))
    ? Number(settings.hero_sticker_3_mobile_y)
    : sticker3Y;
  const sticker3MobileSize = settings?.hero_sticker_3_mobile_size !== undefined && !isNaN(Number(settings?.hero_sticker_3_mobile_size))
    ? Number(settings.hero_sticker_3_mobile_size)
    : Math.round(sticker3Size * 0.72);
  const sticker3Effects = parseEffects(settings?.hero_sticker_3_effects, ['pulse', 'rotate-slow']);

  // Parameters for Geometric Rhombus & Promo Badge Template (Diagonales & Promoción)
  const frameRotateZ = settings?.hero_frame_rotate_z !== undefined && !isNaN(Number(settings?.hero_frame_rotate_z))
    ? Number(settings.hero_frame_rotate_z)
    : (layoutInverted ? 4 : -4);
  const frameRotateX = Number(settings?.hero_frame_rotate_x) || 0;
  const frameRotateY = Number(settings?.hero_frame_rotate_y) || 0;
  const framePerspective = settings?.hero_frame_perspective !== undefined && !isNaN(Number(settings?.hero_frame_perspective))
    ? Number(settings.hero_frame_perspective)
    : 1000;
  const frameBorderWidth = settings?.hero_frame_border_width !== undefined && !isNaN(Number(settings?.hero_frame_border_width))
    ? Number(settings.hero_frame_border_width)
    : 14;
  const frameBorderColor = resolvePaletteColor(settings?.hero_frame_border_color, brandSecondaryColor || '#1b3b2b');
  const frameRadiusTl = Number(settings?.hero_frame_radius_tl) || 42;
  const frameRadiusTr = Number(settings?.hero_frame_radius_tr) || 42;
  const frameRadiusBr = Number(settings?.hero_frame_radius_br) || 42;
  const frameRadiusBl = Number(settings?.hero_frame_radius_bl) || 42;

  const frameHoverEffects = parseEffects(
    settings?.hero_frame_hover_effects || settings?.hero_hover_effects,
    settings?.hero_hover_effect !== undefined
      ? [settings.hero_hover_effect, ...(settings?.hero_hover_glow !== 'false' ? ['glow'] : []), ...(settings?.hero_hover_shimmer !== 'false' ? ['shimmer'] : [])]
      : ['zoom', 'glow', 'shimmer']
  );

  // Decorative Rings (Aros)
  const ring0Show = settings?.hero_ring_0_show !== 'false';
  const ring0X = settings?.hero_ring_0_x !== undefined && !isNaN(Number(settings?.hero_ring_0_x)) ? Number(settings.hero_ring_0_x) : -16;
  const ring0Y = settings?.hero_ring_0_y !== undefined && !isNaN(Number(settings?.hero_ring_0_y)) ? Number(settings.hero_ring_0_y) : -16;
  const ring0Size = settings?.hero_ring_0_size !== undefined && !isNaN(Number(settings?.hero_ring_0_size)) ? Number(settings.hero_ring_0_size) : 112;
  const ring0BorderWidth = settings?.hero_ring_0_border_width !== undefined && !isNaN(Number(settings?.hero_ring_0_border_width)) ? Number(settings.hero_ring_0_border_width) : 8;
  const ring0Color = resolvePaletteColor(settings?.hero_ring_0_color, brandPrimaryColor);
  const ring0Opacity = settings?.hero_ring_0_opacity !== undefined && !isNaN(Number(settings?.hero_ring_0_opacity)) ? Number(settings.hero_ring_0_opacity) : 100;

  const ring1Show = settings?.hero_ring_1_show !== 'false';
  const ring1X = settings?.hero_ring_1_x !== undefined && !isNaN(Number(settings?.hero_ring_1_x)) ? Number(settings.hero_ring_1_x) : 40;
  const ring1Y = settings?.hero_ring_1_y !== undefined && !isNaN(Number(settings?.hero_ring_1_y)) ? Number(settings.hero_ring_1_y) : -40;
  const ring1Size = settings?.hero_ring_1_size !== undefined && !isNaN(Number(settings?.hero_ring_1_size)) ? Number(settings.hero_ring_1_size) : 160;
  const ring1BorderWidth = settings?.hero_ring_1_border_width !== undefined && !isNaN(Number(settings?.hero_ring_1_border_width)) ? Number(settings.hero_ring_1_border_width) : 10;
  const ring1Color = resolvePaletteColor(settings?.hero_ring_1_color, brandAccentColor || '#fbbf24');
  const ring1Dashed = settings?.hero_ring_1_dashed === 'true';
  const ring1Opacity = settings?.hero_ring_1_opacity !== undefined && !isNaN(Number(settings?.hero_ring_1_opacity)) ? Number(settings.hero_ring_1_opacity) : 100;

  const ring2Show = settings?.hero_ring_2_show === 'true';
  const ring2X = settings?.hero_ring_2_x !== undefined && !isNaN(Number(settings?.hero_ring_2_x)) ? Number(settings.hero_ring_2_x) : -30;
  const ring2Y = settings?.hero_ring_2_y !== undefined && !isNaN(Number(settings?.hero_ring_2_y)) ? Number(settings.hero_ring_2_y) : 60;
  const ring2Size = settings?.hero_ring_2_size !== undefined && !isNaN(Number(settings?.hero_ring_2_size)) ? Number(settings.hero_ring_2_size) : 90;
  const ring2BorderWidth = settings?.hero_ring_2_border_width !== undefined && !isNaN(Number(settings?.hero_ring_2_border_width)) ? Number(settings.hero_ring_2_border_width) : 6;
  const ring2Color = resolvePaletteColor(settings?.hero_ring_2_color, brandSecondaryColor);
  const ring2Dashed = settings?.hero_ring_2_dashed === 'true';
  const ring2Opacity = settings?.hero_ring_2_opacity !== undefined && !isNaN(Number(settings?.hero_ring_2_opacity)) ? Number(settings.hero_ring_2_opacity) : 100;

  const ring3Show = settings?.hero_ring_3_show === 'true';
  const ring3X = settings?.hero_ring_3_x !== undefined && !isNaN(Number(settings?.hero_ring_3_x)) ? Number(settings.hero_ring_3_x) : 70;
  const ring3Y = settings?.hero_ring_3_y !== undefined && !isNaN(Number(settings?.hero_ring_3_y)) ? Number(settings.hero_ring_3_y) : 80;
  const ring3Size = settings?.hero_ring_3_size !== undefined && !isNaN(Number(settings?.hero_ring_3_size)) ? Number(settings.hero_ring_3_size) : 130;
  const ring3BorderWidth = settings?.hero_ring_3_border_width !== undefined && !isNaN(Number(settings?.hero_ring_3_border_width)) ? Number(settings.hero_ring_3_border_width) : 8;
  const ring3Color = resolvePaletteColor(settings?.hero_ring_3_color, brandPrimaryColor);
  const ring3Dashed = settings?.hero_ring_3_dashed === 'true';
  const ring3Opacity = settings?.hero_ring_3_opacity !== undefined && !isNaN(Number(settings?.hero_ring_3_opacity)) ? Number(settings.hero_ring_3_opacity) : 100;

  const [rhombusHover, setRhombusHover] = useState(false);
  const [rhombusMouse, setRhombusMouse] = useState({ x: 0, y: 0 });

  const promoShow = settings?.hero_promo_show !== 'false';
  const promoTitle = settings?.hero_promo_title !== undefined ? settings.hero_promo_title.trim() : '30%';
  const promoSubtitle = settings?.hero_promo_subtitle !== undefined ? settings.hero_promo_subtitle.trim() : 'DESCUENTO';
  const showPhoneCta = settings?.hero_show_phone_cta !== 'false';
  const phoneLabel = settings?.hero_phone_label !== undefined ? settings.hero_phone_label.trim() : 'Informes e Inscripciones';
  const phoneNumber = settings?.hero_phone_number !== undefined && settings.hero_phone_number.trim()
    ? settings.hero_phone_number.trim()
    : (settings?.contact_phone || '+52 55 1234 5678');

  // Parameters for Split 2 Column (Editorial & Framed Photo) Template
  const splitShowBadge = settings?.hero_split_show_badge !== 'false';
  const splitBadgeTitle = settings?.hero_split_badge_title || 'Admisiones Abiertas';
  const splitBadgeSubtitle = settings?.hero_split_badge_subtitle || 'Ciclo Escolar 2026 - Cupos Limitados';
  const splitBadgePosition = settings?.hero_split_badge_position || 'bottom-right'; // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  const splitImageAlign = settings?.hero_split_image_align || 'center'; // 'center' | 'top' | 'bottom'
  const splitFrameStyle = settings?.hero_split_frame_style || 'glass-card'; // 'glass-card' | 'iphone-mockup' | 'studio-canvas' | 'organic-curve'
  const splitPerspective = settings?.hero_split_perspective || 'isometric-left'; // 'none' | 'isometric-left' | 'isometric-right' | 'tilted-deep'
  const splitRotateZ = settings?.hero_split_rotate_z !== undefined && !isNaN(Number(settings?.hero_split_rotate_z))
    ? Number(settings.hero_split_rotate_z)
    : 0;
  const splitHoverEffect = settings?.hero_split_hover_effect || 'zoom'; // 'zoom' | 'perspective-shift' | 'float-glow' | 'shimmer-reveal'



  // Top-Level Unconditional Mouse Parallax & Transforms (Rules of Hooks)
  const { x: mouseX, y: mouseY } = useMouseParallax(30);
  const bgX = useTransform(mouseX, (v) => -v * 0.5);
  const bgY = useTransform(mouseY, (v) => -v * 0.5);
  const blob1X = useTransform(mouseX, (v) => v * 0.6);
  const blob1Y = useTransform(mouseY, (v) => v * 0.6);
  const blob2X = useTransform(mouseX, (v) => -v * 0.4);
  const blob2Y = useTransform(mouseY, (v) => -v * 0.4);

  // Spotlight effect logic
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const springSpotX = useSpring(spotX, { damping: 50, stiffness: 200 });
  const springSpotY = useSpring(spotY, { damping: 50, stiffness: 200 });
  const spotlightBg = useTransform(
    [springSpotX, springSpotY],
    ([x, y]) => `radial-gradient(circle 450px at ${x}px ${y}px, rgba(255,255,255,0.09), transparent)`
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      spotX.set(e.clientX);
      spotY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [spotX, spotY]);

  // Universal Floating Elements / Stickers Renderer (Desktop, Tablet & Mobile Responsive)
  const renderFloatingElements = () => {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
        {/* ELEMENT 1 */}
        {sticker1Show && (
          <>
            {/* Mobile View (< 640px) */}
            {sticker1ShowMobile && (
              <div
                className="block sm:hidden absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker1MobileX}%`,
                  top: `${sticker1MobileY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker1MobileSize}px`
                }}
              >
                <AnimatedSticker effects={sticker1Effects}>
                  {sticker1ImageUrl ? (
                    <img
                      src={sticker1ImageUrl}
                      alt="Elemento Flotante 1"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-center gap-2 drop-shadow-md w-full justify-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-10 bg-rose-200/90 rounded-t-full rounded-b-lg -rotate-12 border-2 border-white/60" />
                        <div className="w-6 h-6 bg-emerald-500 rounded-sm rotate-45 border-2 border-white/80 shadow-xs" />
                        <div className="w-6 h-6 bg-amber-400 rounded-full border-2 border-white/80 shadow-xs" />
                        <div className="w-6 h-7 bg-teal-500 rounded-md rotate-12 border-2 border-white/80 shadow-xs" />
                        <div className="w-8 h-10 bg-rose-200/90 rounded-t-full rounded-b-lg rotate-12 border-2 border-white/60" />
                      </div>
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}

            {/* Tablet View (640px to 1023px) */}
            {sticker1ShowTablet && (
              <div
                className="hidden sm:block lg:hidden absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker1TabletX}%`,
                  top: `${sticker1TabletY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker1TabletSize}px`
                }}
              >
                <AnimatedSticker effects={sticker1Effects}>
                  {sticker1ImageUrl ? (
                    <img
                      src={sticker1ImageUrl}
                      alt="Elemento Flotante 1"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-center gap-2 drop-shadow-md w-full justify-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-10 bg-rose-200/90 rounded-t-full rounded-b-lg -rotate-12 border-2 border-white/60" />
                        <div className="w-6 h-6 bg-emerald-500 rounded-sm rotate-45 border-2 border-white/80 shadow-xs" />
                        <div className="w-6 h-6 bg-amber-400 rounded-full border-2 border-white/80 shadow-xs" />
                        <div className="w-6 h-7 bg-teal-500 rounded-md rotate-12 border-2 border-white/80 shadow-xs" />
                        <div className="w-8 h-10 bg-rose-200/90 rounded-t-full rounded-b-lg rotate-12 border-2 border-white/60" />
                      </div>
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}

            {/* Desktop View (>= 1024px) */}
            {sticker1ShowDesktop && (
              <div
                className="hidden lg:block absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker1X}%`,
                  top: `${sticker1Y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker1Size}px`
                }}
              >
                <AnimatedSticker effects={sticker1Effects}>
                  {sticker1ImageUrl ? (
                    <img
                      src={sticker1ImageUrl}
                      alt="Elemento Flotante 1"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-center gap-2 drop-shadow-md w-full justify-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-10 bg-rose-200/90 rounded-t-full rounded-b-lg -rotate-12 border-2 border-white/60" />
                        <div className="w-6 h-6 bg-emerald-500 rounded-sm rotate-45 border-2 border-white/80 shadow-xs" />
                        <div className="w-6 h-6 bg-amber-400 rounded-full border-2 border-white/80 shadow-xs" />
                        <div className="w-6 h-7 bg-teal-500 rounded-md rotate-12 border-2 border-white/80 shadow-xs" />
                        <div className="w-8 h-10 bg-rose-200/90 rounded-t-full rounded-b-lg rotate-12 border-2 border-white/60" />
                      </div>
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}
          </>
        )}

        {/* ELEMENT 2 */}
        {sticker2Show && (
          <>
            {/* Mobile View (< 640px) */}
            {sticker2ShowMobile && (
              <div
                className="block sm:hidden absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker2MobileX}%`,
                  top: `${sticker2MobileY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker2MobileSize}px`
                }}
              >
                <AnimatedSticker effects={sticker2Effects}>
                  {sticker2ImageUrl ? (
                    <img
                      src={sticker2ImageUrl}
                      alt="Elemento Flotante 2"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-end gap-1.5 w-full justify-center">
                      <div className="w-10 h-10 rounded-xl bg-cyan-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[-12deg] border-2 border-white">
                        a
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-rose-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[4deg] border-2 border-white -translate-y-2">
                        b
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[16deg] border-2 border-white">
                        c
                      </div>
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}

            {/* Tablet View (640px to 1023px) */}
            {sticker2ShowTablet && (
              <div
                className="hidden sm:block lg:hidden absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker2TabletX}%`,
                  top: `${sticker2TabletY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker2TabletSize}px`
                }}
              >
                <AnimatedSticker effects={sticker2Effects}>
                  {sticker2ImageUrl ? (
                    <img
                      src={sticker2ImageUrl}
                      alt="Elemento Flotante 2"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-end gap-1.5 w-full justify-center">
                      <div className="w-10 h-10 rounded-xl bg-cyan-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[-12deg] border-2 border-white">
                        a
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-rose-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[4deg] border-2 border-white -translate-y-2">
                        b
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[16deg] border-2 border-white">
                        c
                      </div>
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}

            {/* Desktop View (>= 1024px) */}
            {sticker2ShowDesktop && (
              <div
                className="hidden lg:block absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker2X}%`,
                  top: `${sticker2Y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker2Size}px`
                }}
              >
                <AnimatedSticker effects={sticker2Effects}>
                  {sticker2ImageUrl ? (
                    <img
                      src={sticker2ImageUrl}
                      alt="Elemento Flotante 2"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-end gap-1.5 w-full justify-center">
                      <div className="w-10 h-10 rounded-xl bg-cyan-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[-12deg] border-2 border-white">
                        a
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-rose-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[4deg] border-2 border-white -translate-y-2">
                        b
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-white font-serif font-black flex items-center justify-center text-lg shadow-lg rotate-[16deg] border-2 border-white">
                        c
                      </div>
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}
          </>
        )}

        {/* ELEMENT 3 */}
        {sticker3Show && (
          <>
            {/* Mobile View (< 640px) */}
            {sticker3ShowMobile && (
              <div
                className="block sm:hidden absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker3MobileX}%`,
                  top: `${sticker3MobileY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker3MobileSize}px`
                }}
              >
                <AnimatedSticker effects={sticker3Effects}>
                  {sticker3ImageUrl ? (
                    <img
                      src={sticker3ImageUrl}
                      alt="Elemento Flotante 3"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <Sparkles className="w-full h-auto text-amber-400 fill-amber-400/30 drop-shadow-xs" />
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}

            {/* Tablet View (640px to 1023px) */}
            {sticker3ShowTablet && (
              <div
                className="hidden sm:block lg:hidden absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker3TabletX}%`,
                  top: `${sticker3TabletY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker3TabletSize}px`
                }}
              >
                <AnimatedSticker effects={sticker3Effects}>
                  {sticker3ImageUrl ? (
                    <img
                      src={sticker3ImageUrl}
                      alt="Elemento Flotante 3"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <Sparkles className="w-full h-auto text-amber-400 fill-amber-400/30 drop-shadow-xs" />
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}

            {/* Desktop View (>= 1024px) */}
            {sticker3ShowDesktop && (
              <div
                className="hidden lg:block absolute pointer-events-none transition-all duration-200"
                style={{
                  left: `${sticker3X}%`,
                  top: `${sticker3Y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${sticker3Size}px`
                }}
              >
                <AnimatedSticker effects={sticker3Effects}>
                  {sticker3ImageUrl ? (
                    <img
                      src={sticker3ImageUrl}
                      alt="Elemento Flotante 3"
                      className="w-full h-auto object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <Sparkles className="w-full h-auto text-amber-400 fill-amber-400/30 drop-shadow-xs" />
                    </div>
                  )}
                </AnimatedSticker>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Pattern Overlay Renderer
  const renderPatternOverlay = (forceTheme?: 'dark' | 'light') => {
    if (patternOverlay === 'none') return null;

    const isLightTemplate = forceTheme === 'light' || (!isDarkMode && forceTheme !== 'dark' && (template === 'organic-montessori-stickers' || template === 'curved-contrast-bubble' || template === 'geometric-rhombus' || template === 'curved-cutout-student'));
    const dotColor = isLightTemplate ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.8)';
    const gridColor = isLightTemplate ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)';
    const meshColor = isLightTemplate ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)';
    const crossColor = isLightTemplate ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.55)';
    const diagonalColor = isLightTemplate ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.25)';

    const size = Math.max(10, Math.min(120, patternSize || 32));

    if (patternOverlay === 'dots') {
      return (
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            opacity: patternOpacity,
            backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
            backgroundSize: `${size}px ${size}px`,
          }}
        />
      );
    }

    if (patternOverlay === 'grid') {
      return (
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            opacity: patternOpacity,
            backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
            backgroundSize: `${size}px ${size}px`,
          }}
        />
      );
    }

    if (patternOverlay === 'cross') {
      return (
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            opacity: patternOpacity,
            backgroundImage: `radial-gradient(circle, ${crossColor} 12%, transparent 13%), radial-gradient(circle at 0 0, ${crossColor} 12%, transparent 13%), radial-gradient(circle at 100% 100%, ${crossColor} 12%, transparent 13%)`,
            backgroundSize: `${size}px ${size}px`,
          }}
        />
      );
    }

    if (patternOverlay === 'diagonal') {
      return (
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            opacity: patternOpacity,
            backgroundImage: `repeating-linear-gradient(45deg, ${diagonalColor}, ${diagonalColor} 1px, transparent 0, transparent ${Math.max(6, Math.round(size / 2))}px)`,
            backgroundSize: `${size}px ${size}px`,
          }}
        />
      );
    }

    if (patternOverlay === 'mesh') {
      return (
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            opacity: patternOpacity,
            backgroundImage: `repeating-radial-gradient(${meshColor} 0, ${meshColor} 1px, transparent 1px, transparent ${size}px)`,
          }}
        />
      );
    }

    if (patternOverlay === 'doodles') {
      return (
        <div
          className="absolute inset-0 pointer-events-none z-[3] overflow-hidden"
          style={{ opacity: patternOpacity }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
            className={`absolute -top-12 right-10 border-2 border-dashed rounded-full ${isLightTemplate ? 'border-black/20' : 'border-white/30'}`}
            style={{ width: `${size * 6}px`, height: `${size * 6}px` }}
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, 6, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute bottom-20 left-10 border-2 rounded-3xl ${isLightTemplate ? 'border-black/15' : 'border-white/25'}`}
            style={{ width: `${size * 4.5}px`, height: `${size * 4.5}px` }}
          />
        </div>
      );
    }

    return null;
  };

  // Bottom Shape Divider Renderer
  const renderBottomShape = () => {
    if (bottomShape === 'none') return null;

    return (
      <div
        className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-[5] ${
          shapeInverted ? 'scale-x-[-1]' : ''
        }`}
        style={{ height: `${shapeHeight}px` }}
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-full"
        >
          {bottomShape === 'waves-1' && (
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C1.35,31.7,249.36,69.83,321.39,56.44Z"
              className="fill-background"
            />
          )}
          {bottomShape === 'waves-2' && (
            <path
              d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"
              className="fill-background"
            />
          )}
          {bottomShape === 'curve-arch' && (
            <path
              d="M0,35 Q600,120 1200,35 L1200,120 L0,120 Z"
              className="fill-background"
            />
          )}
          {bottomShape === 'slant' && (
            <path
              d="M0,120 L1200,30 L1200,120 L0,120 Z"
              className="fill-background"
            />
          )}
          {bottomShape === 'triangle' && (
            <path
              d="M0,120 L600,20 L1200,120 L1200,120 L0,120 Z"
              className="fill-background"
            />
          )}
        </svg>
      </div>
    );
  };

  const alignmentClasses = {
    left: 'text-left items-start justify-start',
    center: 'text-center items-center justify-center mx-auto',
    right: 'text-right items-end justify-end ml-auto'
  }[align];

  // Button radius classes
  const buttonRadiusClass = {
    pill: 'rounded-full',
    rounded: 'rounded-2xl',
    square: 'rounded-md'
  }[buttonRadius] || 'rounded-full';

  // Organic & Geometric Blob Radii Dictionary
  const blobRadiusDictionary: Record<string, string> = {
    'none': '0px',
    'mosaic': '0px',
    'mosaic-capsules': '0px',
    'blob-1': '52% 48% 68% 32% / 42% 58% 42% 58%',
    'blob-2': '60% 40% 30% 70% / 60% 30% 70% 40%',
    'egg': '50% 50% 50% 50% / 60% 60% 40% 40%',
    'circle': '9999px',
    'arch': '50% 50% 16px 16px / 50% 50% 16px 16px',
    'squircle': '28% 28% 28% 28% / 28% 28% 28% 28%',
    'leaf': '80% 20% 80% 20% / 20% 80% 20% 80%'
  };

  const blobRadiusStyle = blobRadiusDictionary[blobRadiusType] || blobRadiusDictionary['blob-1'];

  const activeMorphKeyframes = blobMorphShapes
    .filter((s) => s !== 'none' && blobRadiusDictionary[s])
    .map((s) => blobRadiusDictionary[s]);

  // =========================================================================
  // TEMPLATE 1: MONTESSORI CÁLIDO & STICKERS LÚDICOS
  // =========================================================================
  if (template === 'organic-montessori-stickers') {
    return (
      <section
        className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-16 transition-colors duration-300"
        style={{
          backgroundColor: brandBgColor || '#f8f5ee',
          color: brandTextColor || '#111827'
        }}
      >
        
        {/* Pattern Texture Overlay */}
        {renderPatternOverlay('light')}

        {/* Top Floating Cloud Silhouettes */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />

        {/* Universal Floating Elements */}
        {renderFloatingElements()}

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center min-h-[75vh]">
            
            {/* TEXT COLUMN */}
            <div
              className={`lg:col-span-6 flex flex-col ${alignmentClasses} py-4 ${layoutInverted ? 'lg:order-2' : 'lg:order-1'}`}
              style={{
                paddingTop: textPaddingTop ? `${textPaddingTop}px` : undefined,
                paddingBottom: textPaddingBottom ? `${textPaddingBottom}px` : undefined
              }}
            >
              
              {Boolean(badgeText) && (
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xs"
                  style={{
                    backgroundColor: `${badgeColor}15`,
                    borderColor: `${badgeColor}30`,
                    color: badgeColor,
                    fontFamily: badgeFont !== 'inherit' ? badgeFont : undefined,
                    fontSize: badgeSize > 0 ? `${badgeSize}px` : undefined,
                    marginTop: badgeMarginTop ? `${badgeMarginTop}px` : undefined,
                    marginBottom: `${badgeMarginBottom}px`
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: badgeColor }} />
                  <span>{t(badgeText)}</span>
                </div>
              )}

              {hasTitle && (
                <div className="w-full">
                  {Boolean(titlePart1Text) && (
                    <TitlePart1Tag
                      className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] block"
                      style={{
                        color: titleColor1,
                        fontFamily: titlePart1Font !== 'inherit' ? titlePart1Font : undefined,
                        fontSize: titlePart1Size > 0 ? `${titlePart1Size}px` : undefined,
                        marginTop: titlePart1MarginTop ? `${titlePart1MarginTop}px` : undefined,
                        marginBottom: `${titlePart1MarginBottom}px`
                      }}
                    >
                      {t(titlePart1Text)}
                    </TitlePart1Tag>
                  )}
                  {Boolean(titlePart2Text) && (
                    <TitlePart2Tag
                      className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] block"
                      style={{
                        color: titleColor2,
                        fontFamily: titlePart2Font !== 'inherit' ? titlePart2Font : undefined,
                        fontSize: titlePart2Size > 0 ? `${titlePart2Size}px` : undefined,
                        marginTop: titlePart2MarginTop ? `${titlePart2MarginTop}px` : undefined,
                        marginBottom: `${titlePart2MarginBottom}px`
                      }}
                    >
                      {t(titlePart2Text)}
                    </TitlePart2Tag>
                  )}
                </div>
              )}

              {Boolean(subtitleText) && (
                <p
                  className="text-base sm:text-lg max-w-lg font-medium leading-relaxed"
                  style={{
                    color: subtitleColor,
                    opacity: 0.88,
                    fontFamily: subtitleFont !== 'inherit' ? subtitleFont : undefined,
                    fontSize: subtitleSize > 0 ? `${subtitleSize}px` : undefined,
                    marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
                    marginBottom: `${subtitleMarginBottom}px`
                  }}
                >
                  {t(subtitleText)}
                </p>
              )}

              {/* ACTION AREA: CTA Button + Pulsing WhatsApp Radar */}
              <div
                className="flex flex-wrap items-center gap-5 pt-2"
                style={{
                  marginTop: ctaMarginTop ? `${ctaMarginTop}px` : undefined,
                  marginBottom: ctaMarginBottom ? `${ctaMarginBottom}px` : undefined
                }}
              >
                {Boolean(ctaPrimaryText) && (
                  <button
                    type="button"
                    onClick={() => handleCTA('visit')}
                    className={`w-full sm:w-auto px-5 sm:px-8 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg font-bold text-white shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: ctaBgColor,
                      fontFamily: ctaFont !== 'inherit' ? ctaFont : undefined,
                      fontSize: ctaSize > 0 ? `${ctaSize}px` : undefined
                    }}
                  >
                    <span>{t(ctaPrimaryText)}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  </button>
                )}

                {/* WhatsApp Button with Pulsing Wave Radar */}
                <div className="relative flex items-center justify-center">
                  {showWhatsappPulse && (
                    <>
                      <span
                        className="absolute inline-flex h-16 w-16 rounded-full animate-ping pointer-events-none opacity-40"
                        style={{ backgroundColor: brandSecondaryColor || '#10b981' }}
                      />
                      <span
                        className="absolute inline-flex h-20 w-20 rounded-full animate-pulse pointer-events-none opacity-20"
                        style={{ backgroundColor: brandSecondaryColor || '#10b981' }}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCTA('info')}
                    className="relative z-10 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl hover:scale-110 transition-all cursor-pointer border-2 border-white/60"
                    style={{ backgroundColor: brandSecondaryColor || '#10b981' }}
                    title="Contacto WhatsApp"
                  >
                    <MessageCircle className="w-6 h-6 fill-current" />
                  </button>
                </div>
              </div>

            </div>

            {/* ORGANIC / GEOMETRIC PHOTO CARD COLUMN */}
            <div className={`lg:col-span-6 relative flex justify-center items-center ${layoutInverted ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="relative w-full max-w-lg aspect-[4/4] sm:aspect-[4/3.8] flex items-center justify-center">
                
                {!blobAnimateMorph && (blobRadiusType === 'mosaic' || blobRadiusType === 'mosaic-capsules') ? (
                  /* MOSAIC OF PILL CAPSULES / COLLAGE GRID */
                  <div
                    className="w-full h-full flex items-center justify-center transition-all duration-500"
                    style={{
                      transform: `scale(${blobScale / 100}) rotate(${blobRotate}deg)`
                    }}
                  >
                    <svg
                      viewBox="0 0 500 580"
                      className="w-full h-full max-h-[580px] drop-shadow-2xl overflow-visible pointer-events-none"
                      style={{
                        filter: 'drop-shadow(0 20px 35px rgba(0, 0, 0, 0.14))'
                      }}
                    >
                      <defs>
                        <mask id="heroCapsuleMosaicMask" maskUnits="userSpaceOnUse">
                          <rect width="500" height="580" fill="black" />
                          
                          {/* Columna 1 (Izquierda) */}
                          <rect x="100" y="55" width="92" height="80" rx="30" ry="30" fill="white" />
                          <rect x="42" y="145" width="150" height="130" rx="38" ry="38" fill="white" />
                          <rect x="100" y="285" width="92" height="98" rx="30" ry="30" fill="white" />
                          <rect x="100" y="393" width="92" height="90" rx="30" ry="30" fill="white" />

                          {/* Columna 2 (Centro - Protagonista / Vertical) */}
                          <rect x="202" y="44" width="108" height="195" rx="36" ry="36" fill="white" />
                          <rect x="202" y="249" width="108" height="98" rx="32" ry="32" fill="white" />
                          <rect x="202" y="357" width="108" height="165" rx="36" ry="36" fill="white" />

                          {/* Columna 3 (Derecha) */}
                          <rect x="320" y="98" width="78" height="98" rx="28" ry="28" fill="white" />
                          <rect x="319" y="206" width="118" height="122" rx="34" ry="34" fill="white" />
                          <rect x="319" y="338" width="132" height="98" rx="34" ry="34" fill="white" />
                          <rect x="319" y="446" width="56" height="48" rx="24" ry="24" fill="white" />
                        </mask>
                      </defs>

                      <image
                        href={bgImageUrl}
                        x="0"
                        y="0"
                        width="500"
                        height="580"
                        preserveAspectRatio="xMidYMid slice"
                        mask="url(#heroCapsuleMosaicMask)"
                      />
                    </svg>
                  </div>
                ) : !blobAnimateMorph && blobRadiusType === 'none' ? (
                  /* NATURAL DIRECT IMAGE: SIN BORDE, SIN SOMBRA, PURO / TRANSPARENTE */
                  <div
                    className="w-full h-full flex items-center justify-center transition-all duration-500"
                    style={{
                      transform: `scale(${blobScale / 100}) rotate(${blobRotate}deg)`
                    }}
                  >
                    <img
                      src={bgImageUrl}
                      alt={schoolName || 'Estudiante Montessori'}
                      className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-none"
                    />
                  </div>
                ) : blobAnimateMorph && activeMorphKeyframes.length > 1 ? (
                  /* ANIMATED MORPHING GEOMETRIC / ORGANIC BLOB */
                  <motion.div
                    animate={{
                      borderRadius: activeMorphKeyframes
                    }}
                    transition={{
                      duration: Math.max(6, activeMorphKeyframes.length * 3.5),
                      repeat: Infinity,
                      repeatType: 'mirror',
                      ease: 'easeInOut'
                    }}
                    className="w-full h-full shadow-2xl overflow-hidden border-4 border-white/60"
                    style={{
                      transform: `scale(${blobScale / 100}) rotate(${blobRotate}deg)`,
                      boxShadow: '0 25px 60px rgba(0,0,0,0.12)'
                    }}
                  >
                    <img
                      src={bgImageUrl}
                      alt={schoolName || 'Estudiante Montessori'}
                      className="w-full h-full object-cover scale-105"
                    />
                  </motion.div>
                ) : (
                  /* STATIC GEOMETRIC / ORGANIC BLOB FRAME */
                  <div
                    className="w-full h-full shadow-2xl overflow-hidden transition-all duration-500 border-4 border-white/60"
                    style={{
                      borderRadius: blobRadiusStyle,
                      transform: `scale(${blobScale / 100}) rotate(${blobRotate}deg)`,
                      boxShadow: '0 25px 60px rgba(0,0,0,0.12)'
                    }}
                  >
                    <img
                      src={bgImageUrl}
                      alt={schoolName || 'Estudiante Montessori'}
                      className="w-full h-full object-cover scale-105"
                    />
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {renderBottomShape()}
      </section>
    );
  }

  // =========================================================================
  // TEMPLATE 2: CONTRASTE DARK & CÍRCULOS DINÁMICOS
  // =========================================================================
  if (template === 'curved-contrast-bubble') {
    return (
      <section
        className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12 transition-colors duration-300"
        style={{
          backgroundColor: isDarkMode ? (brandBgColor || '#070f0b') : '#181a1b',
          color: brandTextColor
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent opacity-40" />
        </div>

        {/* Pattern Texture Overlay */}
        {renderPatternOverlay()}

        {/* Universal Floating Elements */}
        {renderFloatingElements()}

        <div
          className={`absolute inset-y-0 w-full lg:w-[60%] shadow-2xl z-[2] transition-all duration-500 ${
            layoutInverted
              ? 'right-0 lg:rounded-l-[450px]'
              : 'left-0 lg:rounded-r-[450px]'
          }`}
          style={{
            backgroundColor: isDarkMode ? (brandSurfaceColor || '#111d17') : '#ffffff',
            boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
          }}
        />

        {/* Circular Ambient Bubble - Visible on Desktop only */}
        <div
          className="hidden lg:block absolute z-[3] rounded-full overflow-hidden border-[10px] sm:border-[14px] border-emerald-500/20 shadow-2xl transition-all duration-300 pointer-events-none"
          style={{
            width: `${480 * (circleScale / 100)}px`,
            height: `${480 * (circleScale / 100)}px`,
            transform: `translate(${circleX}px, ${circleY2}px)`,
            right: layoutInverted ? 'auto' : '2%',
            left: layoutInverted ? '2%' : 'auto',
            top: '12%'
          }}
        >
          <img
            src={classroomImageUrl}
            alt="Ambiente"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 transition-colors duration-300"
            style={{
              backgroundColor: brandPrimaryColor || '#10b981',
              opacity: 0.82,
              mixBlendMode: 'multiply'
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center min-h-[75vh]">
            
            {/* TEXT COLUMN: Always order-1 on mobile/tablet */}
            <div
              className={`order-1 ${layoutInverted ? 'lg:order-2 lg:pl-10' : 'lg:order-1 lg:pr-10'} lg:col-span-6 flex flex-col ${alignmentClasses} py-6 lg:py-8 relative z-20 w-full`}
              style={{
                paddingTop: textPaddingTop ? `${textPaddingTop}px` : undefined,
                paddingBottom: textPaddingBottom ? `${textPaddingBottom}px` : undefined
              }}
            >
              {Boolean(badgeText) && (
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${badgeColor}15`,
                    borderColor: `${badgeColor}30`,
                    color: badgeColor,
                    fontFamily: badgeFont !== 'inherit' ? badgeFont : undefined,
                    fontSize: badgeSize > 0 ? `${badgeSize}px` : undefined,
                    marginTop: badgeMarginTop ? `${badgeMarginTop}px` : undefined,
                    marginBottom: `${badgeMarginBottom}px`
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: badgeColor }} />
                  <span>{t(badgeText)}</span>
                </div>
              )}

              {hasTitle && (
                <div className="w-full">
                  {Boolean(titlePart1Text) && (
                    <TitlePart1Tag
                      className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] uppercase block"
                      style={{
                        color: titleColor1,
                        fontFamily: titlePart1Font !== 'inherit' ? titlePart1Font : undefined,
                        fontSize: titlePart1Size > 0 ? `${titlePart1Size}px` : undefined,
                        marginTop: titlePart1MarginTop ? `${titlePart1MarginTop}px` : undefined,
                        marginBottom: `${titlePart1MarginBottom}px`
                      }}
                    >
                      {t(titlePart1Text)}
                    </TitlePart1Tag>
                  )}
                  {Boolean(titlePart2Text) && (
                    <TitlePart2Tag
                      className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] uppercase block"
                      style={{
                        color: titleColor2,
                        fontFamily: titlePart2Font !== 'inherit' ? titlePart2Font : undefined,
                        fontSize: titlePart2Size > 0 ? `${titlePart2Size}px` : undefined,
                        marginTop: titlePart2MarginTop ? `${titlePart2MarginTop}px` : undefined,
                        marginBottom: `${titlePart2MarginBottom}px`
                      }}
                    >
                      {t(titlePart2Text)}
                    </TitlePart2Tag>
                  )}
                </div>
              )}

              {Boolean(subtitleText) && (
                <p
                  className="text-base sm:text-lg max-w-lg font-medium leading-relaxed"
                  style={{
                    color: subtitleColor,
                    opacity: 0.9,
                    fontFamily: subtitleFont !== 'inherit' ? subtitleFont : undefined,
                    fontSize: subtitleSize > 0 ? `${subtitleSize}px` : undefined,
                    marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
                    marginBottom: `${subtitleMarginBottom}px`
                  }}
                >
                  {t(subtitleText)}
                </p>
              )}

              <div
                className="flex flex-wrap items-center gap-6 pt-2"
                style={{
                  marginTop: ctaMarginTop ? `${ctaMarginTop}px` : undefined,
                  marginBottom: ctaMarginBottom ? `${ctaMarginBottom}px` : undefined
                }}
              >
                {Boolean(ctaPrimaryText) && (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleCTA('visit')}
                      className="relative text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-xl uppercase tracking-wider text-sm sm:text-base flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
                      style={{
                        backgroundColor: ctaBgColor,
                        fontFamily: ctaFont !== 'inherit' ? ctaFont : undefined,
                        fontSize: ctaSize > 0 ? `${ctaSize}px` : undefined
                      }}
                    >
                      <span>{t(ctaPrimaryText)}</span>
                      <div
                        className="absolute -bottom-2 left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[9px]"
                        style={{ borderTopColor: ctaBgColor }}
                      />
                    </button>

                    {Boolean(ctaSubtext) && (
                      <span
                        className="text-xs font-bold uppercase tracking-wider pt-1"
                        style={{
                          color: brandSecondaryColor || brandPrimaryColor,
                          fontSize: ctaSubtextSize > 0 ? `${ctaSubtextSize}px` : undefined
                        }}
                      >
                        {t(ctaSubtext)}
                      </span>
                    )}
                  </div>
                )}

                {showSocial && socialLinks && socialLinks.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    {socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full text-white hover:opacity-90 transition-all flex items-center justify-center shadow-md hover:scale-110"
                        style={{ backgroundColor: brandPrimaryColor || '#10b981' }}
                        title={link.label}
                      >
                        {link.type === 'facebook' && <Facebook className="w-4 h-4" />}
                        {link.type === 'instagram' && <Instagram className="w-4 h-4" />}
                        {link.type === 'youtube' && <Youtube className="w-4 h-4" />}
                        {link.type === 'linkedin' && <Linkedin className="w-4 h-4" />}
                        {link.type === 'email' && <Mail className="w-4 h-4" />}
                        {link.type !== 'facebook' && link.type !== 'instagram' && link.type !== 'youtube' && link.type !== 'linkedin' && link.type !== 'email' && (
                          <Globe className="w-4 h-4" />
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* STUDENT IMAGE COLUMN: Always order-2 on mobile/tablet, centered and below */}
            <div className={`order-2 ${layoutInverted ? 'lg:order-1' : 'lg:order-2'} lg:col-span-6 relative flex justify-center items-center lg:items-end w-full z-30 pt-2 pb-4 lg:py-0`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative flex justify-center items-center lg:items-end w-full"
              >
                <div
                  className="relative transition-transform duration-200 will-change-transform flex justify-center items-center lg:items-end mx-auto"
                  style={{
                    transform: `translate(${studentX}px, ${studentY}px) scale(${studentScale / 100})`,
                    transformOrigin: 'bottom center'
                  }}
                >
                  <img
                    src={studentImageUrl}
                    alt={schoolName || 'Estudiante'}
                    className="max-h-[48vh] sm:max-h-[55vh] lg:max-h-[85vh] w-auto max-w-[85vw] sm:max-w-md lg:max-w-none object-contain drop-shadow-2xl pointer-events-none mx-auto"
                    style={{
                      filter: 'drop-shadow(0 20px 45px rgba(0,0,0,0.5))'
                    }}
                  />
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // TEMPLATE 3: CURVAS DIAGONALES & MEDALLÓN PROMOCIONAL
  // =========================================================================
  if (template === 'geometric-rhombus') {
    return (
      <section
        className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-16 transition-colors duration-300"
        style={{
          backgroundColor: isDarkMode ? (brandBgColor || '#070f0b') : '#ffffff',
          color: brandTextColor
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Pattern Texture Overlay */}
          {renderPatternOverlay()}

          <div
            className={`absolute top-0 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
              layoutInverted ? 'left-0 bg-accent' : 'right-0 bg-forest'
            }`}
          />
          <div
            className={`absolute top-12 w-40 h-40 rounded-full border-[12px] pointer-events-none ${
              layoutInverted ? '-left-10' : '-right-10'
            }`}
            style={{
              borderColor: `${brandPrimaryColor}25`
            }}
          />
        </div>

        {/* Universal Floating Elements */}
        {renderFloatingElements()}

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center min-h-[75vh]">
            
            <div
              className={`lg:col-span-6 flex flex-col ${alignmentClasses} py-4 ${layoutInverted ? 'lg:order-2' : 'lg:order-1'}`}
              style={{
                paddingTop: textPaddingTop ? `${textPaddingTop}px` : undefined,
                paddingBottom: textPaddingBottom ? `${textPaddingBottom}px` : undefined
              }}
            >
              {Boolean(badgeText) && (
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${badgeColor}15`,
                    borderColor: `${badgeColor}30`,
                    color: badgeColor,
                    fontFamily: badgeFont !== 'inherit' ? badgeFont : undefined,
                    fontSize: badgeSize > 0 ? `${badgeSize}px` : undefined,
                    marginTop: badgeMarginTop ? `${badgeMarginTop}px` : undefined,
                    marginBottom: `${badgeMarginBottom}px`
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: badgeColor }} />
                  <span>{t(badgeText)}</span>
                </div>
              )}

              {hasTitle && (
                <div className="w-full">
                  {Boolean(titlePart1Text) && (
                    <TitlePart1Tag
                      className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] uppercase block"
                      style={{
                        color: titleColor1,
                        fontFamily: titlePart1Font !== 'inherit' ? titlePart1Font : undefined,
                        fontSize: titlePart1Size > 0 ? `${titlePart1Size}px` : undefined,
                        marginTop: titlePart1MarginTop ? `${titlePart1MarginTop}px` : undefined,
                        marginBottom: `${titlePart1MarginBottom}px`
                      }}
                    >
                      {t(titlePart1Text)}
                    </TitlePart1Tag>
                  )}
                  {Boolean(titlePart2Text) && (
                    <TitlePart2Tag
                      className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] uppercase block"
                      style={{
                        color: titleColor2,
                        fontFamily: titlePart2Font !== 'inherit' ? titlePart2Font : undefined,
                        fontSize: titlePart2Size > 0 ? `${titlePart2Size}px` : undefined,
                        marginTop: titlePart2MarginTop ? `${titlePart2MarginTop}px` : undefined,
                        marginBottom: `${titlePart2MarginBottom}px`
                      }}
                    >
                      {t(titlePart2Text)}
                    </TitlePart2Tag>
                  )}
                </div>
              )}

              {Boolean(subtitleText) && (
                <p
                  className="text-base sm:text-lg max-w-lg font-medium leading-relaxed"
                  style={{
                    color: subtitleColor,
                    opacity: 0.9,
                    fontFamily: subtitleFont !== 'inherit' ? subtitleFont : undefined,
                    fontSize: subtitleSize > 0 ? `${subtitleSize}px` : undefined,
                    marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
                    marginBottom: `${subtitleMarginBottom}px`
                  }}
                >
                  {t(subtitleText)}
                </p>
              )}

              <div
                className="flex flex-wrap items-center gap-6 pt-2"
                style={{
                  marginTop: ctaMarginTop ? `${ctaMarginTop}px` : undefined,
                  marginBottom: ctaMarginBottom ? `${ctaMarginBottom}px` : undefined
                }}
              >
                {Boolean(ctaPrimaryText) && (
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() => handleCTA('visit')}
                    className="w-full sm:w-auto rounded-full px-6 sm:px-9 py-3.5 sm:py-5 text-sm sm:text-base font-extrabold uppercase tracking-wider text-white shadow-xl hover:scale-105 transition-all text-center justify-center"
                    style={{
                      backgroundColor: ctaBgColor,
                      fontFamily: ctaFont !== 'inherit' ? ctaFont : undefined,
                      fontSize: ctaSize > 0 ? `${ctaSize}px` : undefined
                    }}
                  >
                    {t(ctaPrimaryText)}
                  </Button>
                )}

                {showPhoneCta && Boolean(phoneNumber) && (
                  <a
                    href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                    className="flex items-center gap-3 group transition-transform hover:translate-x-1"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all group-hover:scale-110"
                      style={{ backgroundColor: brandPrimaryColor || '#1b3b2b' }}
                    >
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        {phoneLabel}
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-forest transition-colors">
                        {phoneNumber}
                      </span>
                    </div>
                  </a>
                )}
              </div>
            </div>

            <div className={`lg:col-span-6 relative flex justify-center items-center ${layoutInverted ? 'lg:order-1' : 'lg:order-2'}`}>
              <div
                className="relative w-full max-w-lg aspect-[4/4.2] sm:aspect-[4/4.2]"
                style={{ perspective: `${framePerspective}px` }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
                  const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
                  setRhombusMouse({ x, y });
                }}
                onMouseEnter={() => setRhombusHover(true)}
                onMouseLeave={() => {
                  setRhombusHover(false);
                  setRhombusMouse({ x: 0, y: 0 });
                }}
              >
                {/* 1. DECORATIVE RINGS (AROS) */}
                
                {/* Aro 1 (Fondo / Superior) */}
                {ring1Show && (
                  <div
                    className="absolute rounded-full pointer-events-none z-10 transition-all duration-300"
                    style={{
                      top: `${ring1Y}px`,
                      [layoutInverted ? 'right' : 'left']: `${ring1X}px`,
                      width: `${ring1Size}px`,
                      height: `${ring1Size}px`,
                      borderWidth: `${ring1BorderWidth}px`,
                      borderStyle: ring1Dashed ? 'dashed' : 'solid',
                      borderColor: ring1Color,
                      backgroundColor: `${ring1Color}15`,
                      opacity: ring1Opacity / 100,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                    }}
                  />
                )}

                {/* Aro 2 (Inferior Opuesto) */}
                {ring2Show && (
                  <div
                    className="absolute rounded-full pointer-events-none z-10 transition-all duration-300"
                    style={{
                      bottom: `${ring2Y}px`,
                      [layoutInverted ? 'right' : 'left']: `${ring2X}px`,
                      width: `${ring2Size}px`,
                      height: `${ring2Size}px`,
                      borderWidth: `${ring2BorderWidth}px`,
                      borderStyle: ring2Dashed ? 'dashed' : 'solid',
                      borderColor: ring2Color,
                      backgroundColor: `${ring2Color}15`,
                      opacity: ring2Opacity / 100
                    }}
                  />
                )}

                {/* Aro 3 (Flotante Exterior) */}
                {ring3Show && (
                  <div
                    className="absolute rounded-full pointer-events-none z-10 transition-all duration-300"
                    style={{
                      bottom: `${ring3Y}px`,
                      [layoutInverted ? 'left' : 'right']: `${ring3X}px`,
                      width: `${ring3Size}px`,
                      height: `${ring3Size}px`,
                      borderWidth: `${ring3BorderWidth}px`,
                      borderStyle: ring3Dashed ? 'dashed' : 'solid',
                      borderColor: ring3Color,
                      backgroundColor: `${ring3Color}15`,
                      opacity: ring3Opacity / 100
                    }}
                  />
                )}

                {/* 2. MARCO PRINCIPAL CON TRANSFORMACIONES 3D, ROTACIÓN, BORDES Y HOVER COMBINABLES */}
                {(() => {
                  let transX = 0;
                  let transY = 0;
                  let rotX = frameRotateX;
                  let rotY = frameRotateY;
                  let scale = 1;

                  if (rhombusHover) {
                    if (frameHoverEffects.includes('zoom')) {
                      scale *= 1.05;
                    }
                    if (frameHoverEffects.includes('float')) {
                      transY -= 12;
                    }
                    if (frameHoverEffects.includes('magnet-attract')) {
                      transX += rhombusMouse.x * 24;
                      transY += rhombusMouse.y * 24;
                      rotX += -rhombusMouse.y * 12;
                      rotY += rhombusMouse.x * 12;
                    } else if (frameHoverEffects.includes('magnet-repel')) {
                      transX += -rhombusMouse.x * 24;
                      transY += -rhombusMouse.y * 24;
                      rotX += rhombusMouse.y * 12;
                      rotY += -rhombusMouse.x * 12;
                    }
                    if (frameHoverEffects.includes('tilt-3d')) {
                      rotX += -rhombusMouse.y * 16;
                      rotY += rhombusMouse.x * 16;
                    }
                  }

                  const hasGlow = frameHoverEffects.includes('glow');
                  const hasShimmer = frameHoverEffects.includes('shimmer');

                  const dynamicGlow = hasGlow && rhombusHover
                    ? `0 25px 60px -12px rgba(0,0,0,0.4), 0 0 35px ${frameBorderColor}80`
                    : '0 25px 50px -12px rgba(0,0,0,0.3)';

                  return (
                    <motion.div
                      animate={{
                        x: transX,
                        y: transY,
                        rotateZ: frameRotateZ,
                        rotateX: rotX,
                        rotateY: rotY,
                        scale: scale
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute inset-0 overflow-hidden shadow-2xl transition-shadow duration-300"
                      style={{
                        borderRadius: `${frameRadiusTl}px ${frameRadiusTr}px ${frameRadiusBr}px ${frameRadiusBl}px`,
                        borderWidth: `${frameBorderWidth}px`,
                        borderColor: frameBorderColor,
                        borderStyle: 'solid',
                        boxShadow: dynamicGlow,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      <img
                        src={bgImageUrl}
                        alt={schoolName || 'Estudiante'}
                        className={`w-full h-full object-cover transition-transform duration-700 ${
                          rhombusHover && frameHoverEffects.includes('zoom') ? 'scale-110' : 'scale-100'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* Hover Shimmer Light Sweep */}
                      {hasShimmer && (
                        <motion.div
                          animate={rhombusHover ? { x: ['-100%', '200%'], opacity: [0, 0.45, 0] } : { x: '-100%', opacity: 0 }}
                          transition={{ duration: 1.1, ease: 'easeInOut' }}
                          className="absolute inset-0 w-3/4 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none z-10"
                        />
                      )}
                    </motion.div>
                  );
                })()}

                {/* 3. ARO 0 (Aro de Esquina Original) */}
                {ring0Show && (
                  <div
                    className={`absolute rounded-full pointer-events-none z-20 transition-all duration-300 ${
                      layoutInverted ? '-left-4' : '-right-4'
                    }`}
                    style={{
                      top: `${ring0Y}px`,
                      [layoutInverted ? 'left' : 'right']: `${ring0X}px`,
                      width: `${ring0Size}px`,
                      height: `${ring0Size}px`,
                      borderWidth: `${ring0BorderWidth}px`,
                      borderColor: ring0Color,
                      backgroundColor: `${ring0Color}20`,
                      opacity: ring0Opacity / 100,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }}
                  />
                )}

                {/* 4. MEDALLÓN PROMOCIONAL FLOTANTE */}
                {promoShow && Boolean(promoTitle) && (
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className={`absolute z-30 top-1/3 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-2xl border-4 ${
                      layoutInverted ? '-right-6 sm:-right-8' : '-left-6 sm:-left-8'
                    }`}
                    style={{ borderColor: brandPrimaryColor || '#1b3b2b' }}
                  >
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center text-center p-2 text-white shadow-inner"
                      style={{ backgroundColor: brandPrimaryColor || '#1b3b2b' }}
                    >
                      <span className="text-xl sm:text-2xl font-black leading-none tracking-tight">
                        {promoTitle}
                      </span>
                      {Boolean(promoSubtitle) && (
                        <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest mt-0.5 text-white/95">
                          {promoSubtitle}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // TEMPLATE 4: CURVAS GEOMÉTRICAS & ESTUDIANTE (Banner Admisiones)
  // =========================================================================
  if (template === 'curved-cutout-student') {
    return (
      <section
        className="relative min-h-[90vh] lg:min-h-screen flex flex-col justify-between overflow-hidden pt-24 sm:pt-28 transition-colors duration-300"
        style={{
          backgroundColor: isDarkMode ? (brandBgColor || '#070f0b') : '#ffffff',
          color: brandTextColor
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Pattern Texture Overlay */}
          {renderPatternOverlay()}

          <div
            className="hidden lg:block absolute rounded-full transition-all duration-300 pointer-events-none"
            style={{
              backgroundColor: brandSecondaryColor || '#0e3a24',
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              right: layoutInverted ? 'auto' : '-8%',
              left: layoutInverted ? '-8%' : 'auto',
              top: `calc(10% + ${circleY}px)`,
              border: `${borderWidth}px solid #ffffff`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
            }}
          />

          {(() => {
            const baseWaveY = 560 - (waveY * 4.6);
            return (
              <svg
                viewBox="0 0 1440 600"
                preserveAspectRatio="none"
                className={`absolute bottom-0 left-0 right-0 w-full h-[65%] pointer-events-none transition-all duration-300 ${
                  layoutInverted ? 'scale-x-[-1]' : ''
                }`}
                style={{
                  filter: 'drop-shadow(0 -4px 12px rgba(0,0,0,0.06))'
                }}
              >
                <path
                  d={`M0,${baseWaveY + 20} Q${420 + curveIntensity * 2},${baseWaveY - curveIntensity * 1.4} ${820 + curveIntensity * 1.5},${baseWaveY + curveIntensity * 0.8} T1440,${baseWaveY - curveIntensity * 0.5} L1440,600 L0,600 Z`}
                  fill={brandPrimaryColor || '#1b3b2b'}
                  stroke="#ffffff"
                  strokeWidth={borderWidth * 1.5}
                />
              </svg>
            );
          })()}
        </div>

        {/* Universal Floating Elements */}
        {renderFloatingElements()}

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full min-h-[70vh]">
            
            <div
              className={`lg:col-span-7 flex flex-col ${alignmentClasses} py-6 ${layoutInverted ? 'lg:order-2' : 'lg:order-1'}`}
              style={{
                paddingTop: textPaddingTop ? `${textPaddingTop}px` : undefined,
                paddingBottom: textPaddingBottom ? `${textPaddingBottom}px` : undefined
              }}
            >
              {Boolean(badgeText) && (
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${badgeColor}15`,
                    borderColor: `${badgeColor}30`,
                    color: badgeColor,
                    fontFamily: badgeFont !== 'inherit' ? badgeFont : undefined,
                    fontSize: badgeSize > 0 ? `${badgeSize}px` : undefined,
                    marginTop: badgeMarginTop ? `${badgeMarginTop}px` : undefined,
                    marginBottom: `${badgeMarginBottom}px`
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: badgeColor }} />
                  <span>{t(badgeText)}</span>
                </div>
              )}

              {hasTitle && (
                <div className="w-full">
                  {Boolean(titlePart1Text) && (
                    <TitlePart1Tag
                      className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] uppercase block"
                      style={{
                        color: titleColor1,
                        fontFamily: titlePart1Font !== 'inherit' ? titlePart1Font : undefined,
                        fontSize: titlePart1Size > 0 ? `${titlePart1Size}px` : undefined,
                        marginTop: titlePart1MarginTop ? `${titlePart1MarginTop}px` : undefined,
                        marginBottom: `${titlePart1MarginBottom}px`
                      }}
                    >
                      {t(titlePart1Text)}
                    </TitlePart1Tag>
                  )}
                  {Boolean(titlePart2Text) && (
                    <TitlePart2Tag
                      className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] uppercase block"
                      style={{
                        color: titleColor2,
                        fontFamily: titlePart2Font !== 'inherit' ? titlePart2Font : undefined,
                        fontSize: titlePart2Size > 0 ? `${titlePart2Size}px` : undefined,
                        marginTop: titlePart2MarginTop ? `${titlePart2MarginTop}px` : undefined,
                        marginBottom: `${titlePart2MarginBottom}px`
                      }}
                    >
                      {t(titlePart2Text)}
                    </TitlePart2Tag>
                  )}
                </div>
              )}

              {Boolean(subtitleText) && (
                <p
                  className="text-base sm:text-lg max-w-lg font-medium leading-relaxed"
                  style={{
                    color: subtitleColor,
                    opacity: 0.9,
                    fontFamily: subtitleFont !== 'inherit' ? subtitleFont : undefined,
                    fontSize: subtitleSize > 0 ? `${subtitleSize}px` : undefined,
                    marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
                    marginBottom: `${subtitleMarginBottom}px`
                  }}
                >
                  {t(subtitleText)}
                </p>
              )}
            </div>

            <div className={`lg:col-span-5 relative flex ${layoutInverted ? 'justify-center lg:justify-start lg:order-1' : 'justify-center lg:justify-end lg:order-2'} items-end h-full`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-20 flex justify-center items-end"
              >
                <div
                  className="relative transition-transform duration-200 will-change-transform flex justify-center items-end"
                  style={{
                    transform: `translate(${studentX}px, ${studentY}px) scale(${studentScale / 100})`,
                    transformOrigin: 'bottom center'
                  }}
                >
                  <img
                    src={studentImageUrl}
                    alt={schoolName || 'Estudiante'}
                    className="max-h-[65vh] lg:max-h-[82vh] w-auto object-contain drop-shadow-2xl pointer-events-none"
                    style={{
                      filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.25))'
                    }}
                  />
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-2">
          <div className={`flex flex-wrap items-center justify-between gap-6 text-white ${layoutInverted ? 'flex-row-reverse' : ''}`}>
            {Boolean(ctaPrimaryText) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => handleCTA('visit')}
                  className="w-full sm:w-auto rounded-full px-6 sm:px-8 py-3.5 sm:py-5 text-sm sm:text-base font-extrabold uppercase tracking-wide bg-white shadow-xl hover:scale-105 transition-all text-center justify-center"
                  style={{
                    color: brandPrimaryColor || '#1b3b2b',
                    fontSize: ctaSize > 0 ? `${ctaSize}px` : undefined
                  }}
                >
                  {t(ctaPrimaryText)}
                </Button>
                {Boolean(ctaSubtext) && (
                  <span
                    className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white/95 drop-shadow-xs"
                    style={{
                      fontSize: ctaSubtextSize > 0 ? `${ctaSubtextSize}px` : undefined
                    }}
                  >
                    {t(ctaSubtext)}
                  </span>
                )}
              </div>
            )}

            {showSocial && socialLinks && socialLinks.length > 0 && (
              <div className="flex items-center gap-2.5">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white text-white hover:text-forest transition-all flex items-center justify-center border border-white/30 backdrop-blur-xs shadow-xs"
                    title={link.label}
                  >
                    {link.type === 'facebook' && <Facebook className="w-4 h-4" />}
                    {link.type === 'instagram' && <Instagram className="w-4 h-4" />}
                    {link.type === 'youtube' && <Youtube className="w-4 h-4" />}
                    {link.type === 'linkedin' && <Linkedin className="w-4 h-4" />}
                    {link.type === 'email' && <Mail className="w-4 h-4" />}
                    {link.type !== 'facebook' && link.type !== 'instagram' && link.type !== 'youtube' && link.type !== 'linkedin' && link.type !== 'email' && (
                      <Globe className="w-4 h-4" />
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // TEMPLATE 5: IMAGEN INMERSIVA CON ONDAS / CURVAS
  // =========================================================================
  if (template === 'image-overlay-waves') {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            style={{ x: bgX, y: bgY, scale: 1.1 }}
            className="absolute inset-[-5%] w-[110%] h-[110%]"
          >
            <img
              src={bgImageUrl}
              alt={schoolName || 'Ambiente Montessori'}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 transition-colors duration-300"
              style={{
                backgroundColor: brandPrimaryColor || '#1b3b2b',
                opacity: overlayOpacity
              }}
            />
          </motion.div>

          <motion.div
            style={{ background: spotlightBg }}
            className="absolute inset-0 z-[1] pointer-events-none"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-forest/50 via-transparent to-forest/80 z-[2]" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest/70 via-forest/20 to-transparent z-[2]" />

          {renderPatternOverlay()}

          <motion.div
            style={{ x: blob1X, y: blob1Y }}
            className="absolute top-1/3 -left-32 w-96 h-96 bg-sunshine/15 blur-3xl blob-shape z-[2]"
          />
          <motion.div
            style={{ x: blob2X, y: blob2Y }}
            className="absolute bottom-1/4 -right-32 w-[30rem] h-[30rem] bg-leaf/20 blur-3xl blob-shape-alt z-[2]"
          />
        </div>

        {/* Universal Floating Elements */}
        {renderFloatingElements()}

        <div
          className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex items-center min-h-screen pt-24 pb-16"
          style={{
            paddingTop: textPaddingTop ? `calc(6rem + ${textPaddingTop}px)` : undefined,
            paddingBottom: textPaddingBottom ? `calc(4rem + ${textPaddingBottom}px)` : undefined
          }}
        >
          <div className={`max-w-4xl flex flex-col ${alignmentClasses}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`flex flex-col ${alignmentClasses}`}
            >
              {Boolean(badgeText) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm"
                  style={{
                    backgroundColor: `${badgeColor}25`,
                    borderColor: `${badgeColor}40`,
                    color: badgeColor,
                    fontFamily: badgeFont !== 'inherit' ? badgeFont : undefined,
                    fontSize: badgeSize > 0 ? `${badgeSize}px` : undefined,
                    marginTop: badgeMarginTop ? `${badgeMarginTop}px` : undefined,
                    marginBottom: `${badgeMarginBottom}px`
                  }}
                >
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: badgeColor }} />
                  <span>{t(badgeText)}</span>
                </motion.div>
              )}

              {hasTitle && (
                <div className="w-full">
                  {Boolean(titlePart1Text) && (
                    <TitlePart1Tag
                      className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight [text-shadow:_0_4px_16px_rgba(14,38,23,0.95),_0_2px_6px_rgba(14,38,23,0.8)] block"
                      style={{
                        color: titleColor1,
                        fontFamily: titlePart1Font !== 'inherit' ? titlePart1Font : undefined,
                        fontSize: titlePart1Size > 0 ? `${titlePart1Size}px` : undefined,
                        marginTop: titlePart1MarginTop ? `${titlePart1MarginTop}px` : undefined,
                        marginBottom: `${titlePart1MarginBottom}px`
                      }}
                    >
                      {t(titlePart1Text)}
                    </TitlePart1Tag>
                  )}
                  {Boolean(titlePart2Text) && (
                    <TitlePart2Tag
                      className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight [text-shadow:_0_4px_16px_rgba(14,38,23,0.95),_0_2px_6px_rgba(14,38,23,0.8)] block"
                      style={{
                        color: titleColor2,
                        fontFamily: titlePart2Font !== 'inherit' ? titlePart2Font : undefined,
                        fontSize: titlePart2Size > 0 ? `${titlePart2Size}px` : undefined,
                        marginTop: titlePart2MarginTop ? `${titlePart2MarginTop}px` : undefined,
                        marginBottom: `${titlePart2MarginBottom}px`
                      }}
                    >
                      {t(titlePart2Text)}
                    </TitlePart2Tag>
                  )}
                </div>
              )}

              {Boolean(subtitleText) && (
                <p
                  className="text-lg sm:text-2xl max-w-2xl font-display font-medium leading-relaxed drop-shadow-md"
                  style={{
                    color: subtitleColor,
                    fontFamily: subtitleFont !== 'inherit' ? subtitleFont : undefined,
                    fontSize: subtitleSize > 0 ? `${subtitleSize}px` : undefined,
                    marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
                    marginBottom: `${subtitleMarginBottom}px`
                  }}
                >
                  {t(subtitleText)}
                </p>
              )}

              {hasAnyCTA && (
                <div
                  className={`flex flex-wrap gap-4 items-center ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}
                  style={{
                    marginTop: ctaMarginTop ? `${ctaMarginTop}px` : undefined,
                    marginBottom: ctaMarginBottom ? `${ctaMarginBottom}px` : undefined
                  }}
                >
                  {Boolean(ctaPrimaryText) && (
                    <Magnetic strength={0.1}>
                      <Button
                        variant="accent"
                        size="lg"
                        onClick={() => handleCTA('visit')}
                        className="w-full sm:w-auto rounded-full px-6 sm:px-9 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg font-bold shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl text-white text-center justify-center"
                        style={{
                          backgroundColor: ctaBgColor,
                          fontFamily: ctaFont !== 'inherit' ? ctaFont : undefined,
                          fontSize: ctaSize > 0 ? `${ctaSize}px` : undefined
                        }}
                      >
                        {t(ctaPrimaryText)}
                      </Button>
                    </Magnetic>
                  )}

                  {showSecondaryCta && Boolean(ctaSecondaryText) && (
                    <Magnetic strength={0.1}>
                      <Button
                        variant="hero-outline"
                        size="lg"
                        className="w-full sm:w-auto rounded-full px-6 sm:px-9 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg border-white/40 hover:bg-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2.5 group text-center"
                        onClick={() => handleCTA('info')}
                        style={{
                          fontFamily: cta2Font !== 'inherit' ? cta2Font : undefined,
                          fontSize: cta2Size > 0 ? `${cta2Size}px` : undefined
                        }}
                      >
                        <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform shrink-0" />
                        {t(ctaSecondaryText)}
                      </Button>
                    </Magnetic>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {renderBottomShape()}
      </section>
    );
  }

  // =========================================================================
  // TEMPLATE 6: SPLIT 2 COLUMNAS
  // =========================================================================
  if (template === 'split-2-col') {
    return (
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden text-white pt-24 pb-20 transition-colors duration-300"
        style={{
          background: `linear-gradient(135deg, ${brandPrimaryColor} 0%, ${brandSecondaryColor} 100%)`
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-85"
            style={{
              background: `linear-gradient(to bottom right, ${brandPrimaryColor}, ${brandSecondaryColor})`
            }}
          />
          {renderPatternOverlay()}
          <div
            className="absolute top-1/4 -right-20 w-96 h-96 blur-3xl rounded-full opacity-20"
            style={{ backgroundColor: brandAccentColor || '#fbbf24' }}
          />
          <div
            className="absolute bottom-10 -left-20 w-96 h-96 blur-3xl rounded-full opacity-15"
            style={{ backgroundColor: brandSecondaryColor || '#10b981' }}
          />
        </div>

        {/* Universal Floating Elements */}
        {renderFloatingElements()}

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[75vh]">
            
            <div
              className={`lg:col-span-6 flex flex-col ${alignmentClasses} ${layoutInverted ? 'lg:order-2' : 'lg:order-1'}`}
              style={{
                paddingTop: textPaddingTop ? `${textPaddingTop}px` : undefined,
                paddingBottom: textPaddingBottom ? `${textPaddingBottom}px` : undefined
              }}
            >
              {Boolean(badgeText) && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border text-xs sm:text-sm font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${badgeColor}25`,
                    borderColor: `${badgeColor}40`,
                    color: badgeColor,
                    fontFamily: badgeFont !== 'inherit' ? badgeFont : undefined,
                    fontSize: badgeSize > 0 ? `${badgeSize}px` : undefined,
                    marginTop: badgeMarginTop ? `${badgeMarginTop}px` : undefined,
                    marginBottom: `${badgeMarginBottom}px`
                  }}
                >
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: badgeColor }} />
                  <span>{t(badgeText)}</span>
                </div>
              )}

              {hasTitle && (
                <div className="w-full">
                  {Boolean(titlePart1Text) && (
                    <TitlePart1Tag
                      className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight block"
                      style={{
                        color: titleColor1,
                        fontFamily: titlePart1Font !== 'inherit' ? titlePart1Font : undefined,
                        fontSize: titlePart1Size > 0 ? `${titlePart1Size}px` : undefined,
                        marginTop: titlePart1MarginTop ? `${titlePart1MarginTop}px` : undefined,
                        marginBottom: `${titlePart1MarginBottom}px`
                      }}
                    >
                      {t(titlePart1Text)}
                    </TitlePart1Tag>
                  )}
                  {Boolean(titlePart2Text) && (
                    <TitlePart2Tag
                      className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight block"
                      style={{
                        color: titleColor2,
                        fontFamily: titlePart2Font !== 'inherit' ? titlePart2Font : undefined,
                        fontSize: titlePart2Size > 0 ? `${titlePart2Size}px` : undefined,
                        marginTop: titlePart2MarginTop ? `${titlePart2MarginTop}px` : undefined,
                        marginBottom: `${titlePart2MarginBottom}px`
                      }}
                    >
                      {t(titlePart2Text)}
                    </TitlePart2Tag>
                  )}
                </div>
              )}

              {Boolean(subtitleText) && (
                <p
                  className="text-base sm:text-xl max-w-xl leading-relaxed font-sans"
                  style={{
                    color: subtitleColor,
                    opacity: 0.9,
                    fontFamily: subtitleFont !== 'inherit' ? subtitleFont : undefined,
                    fontSize: subtitleSize > 0 ? `${subtitleSize}px` : undefined,
                    marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
                    marginBottom: `${subtitleMarginBottom}px`
                  }}
                >
                  {t(subtitleText)}
                </p>
              )}

              {hasAnyCTA && (
                <div
                  className={`flex flex-wrap gap-4 items-center mb-8 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}
                  style={{
                    marginTop: ctaMarginTop ? `${ctaMarginTop}px` : undefined,
                    marginBottom: ctaMarginBottom ? `${ctaMarginBottom}px` : undefined
                  }}
                >
                  {Boolean(ctaPrimaryText) && (
                    <Button
                      variant="accent"
                      size="lg"
                      onClick={() => handleCTA('visit')}
                      className="w-full sm:w-auto rounded-2xl px-6 sm:px-8 py-3.5 sm:py-5 text-sm sm:text-base font-bold shadow-lg hover:-translate-y-0.5 text-white text-center justify-center"
                      style={{
                        backgroundColor: ctaBgColor,
                        fontFamily: ctaFont !== 'inherit' ? ctaFont : undefined,
                        fontSize: ctaSize > 0 ? `${ctaSize}px` : undefined
                      }}
                    >
                      {t(ctaPrimaryText)}
                    </Button>
                  )}

                  {showSecondaryCta && Boolean(ctaSecondaryText) && (
                    <Button
                      variant="hero-outline"
                      size="lg"
                      className="w-full sm:w-auto rounded-2xl px-6 sm:px-8 py-3.5 sm:py-5 text-sm sm:text-base border-white/30 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center text-center"
                      onClick={() => handleCTA('info')}
                      style={{
                        fontFamily: cta2Font !== 'inherit' ? cta2Font : undefined,
                        fontSize: cta2Size > 0 ? `${cta2Size}px` : undefined
                      }}
                    >
                      <MessageCircle className="w-5 h-5 mr-2 shrink-0" />
                      {t(ctaSecondaryText)}
                    </Button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-6 text-xs sm:text-sm text-white/80 border-t border-white/10 pt-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Certificación AMI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-300" />
                  <span>Ambientes Preparados</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Comunidad Bilingüe</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DYNAMIC ENHANCED FRAMED PHOTO WITH 4 MOCKUPS & 3D PERSPECTIVE */}
            <div
              className={`lg:col-span-5 relative flex justify-center ${
                splitImageAlign === 'top'
                  ? 'items-start pt-2 sm:pt-4'
                  : splitImageAlign === 'bottom'
                  ? 'items-end pb-2 sm:pb-4'
                  : 'items-center'
              } ${layoutInverted ? 'lg:order-1' : 'lg:order-2'}`}
              style={{ perspective: splitPerspective !== 'none' ? '1200px' : 'none' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative w-full max-w-[480px] will-change-transform"
              >
                {/* 3D Perspective + Hover Interactive Container */}
                <div
                  className={`relative w-full transition-all duration-500 ease-out [transform-style:preserve-3d] ${
                    splitHoverEffect === 'zoom'
                      ? 'hover:scale-[1.03]'
                      : splitHoverEffect === 'perspective-shift'
                      ? 'hover:!transform-none hover:scale-[1.02]'
                      : splitHoverEffect === 'float-glow'
                      ? 'hover:-translate-y-4 hover:shadow-[0_35px_80px_rgba(0,0,0,0.6),0_0_50px_rgba(255,255,255,0.25)]'
                      : 'hover:scale-[1.02]'
                  }`}
                  style={{
                    transform:
                      splitPerspective === 'isometric-left'
                        ? `rotateY(-12deg) rotateX(4deg) rotate(${splitRotateZ}deg)`
                        : splitPerspective === 'isometric-right'
                        ? `rotateY(12deg) rotateX(4deg) rotate(${splitRotateZ}deg)`
                        : splitPerspective === 'tilted-deep'
                        ? `rotateY(-18deg) rotateX(8deg) scale(0.96) rotate(${splitRotateZ}deg)`
                        : `rotateY(0deg) rotateX(0deg) rotate(${splitRotateZ}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  {/* Calculate badge position & exact 3D translate3d transform */}
                  {(() => {
                    const getBadgeProps = () => {
                      switch (splitBadgePosition) {
                        case 'top-left':
                          return {
                            className: 'top-6 left-6 max-w-[calc(100%-3rem)] sm:max-w-[280px]',
                            style: { transform: 'translate3d(0, 0, 42px)' }
                          };
                        case 'top-center':
                          return {
                            className: 'top-6 left-1/2 max-w-[calc(100%-3rem)] sm:max-w-[290px]',
                            style: { transform: 'translate3d(-50%, 0, 42px)' }
                          };
                        case 'top-right':
                          return {
                            className: 'top-6 right-6 max-w-[calc(100%-3rem)] sm:max-w-[280px]',
                            style: { transform: 'translate3d(0, 0, 42px)' }
                          };
                        case 'center':
                          return {
                            className: 'top-1/2 left-1/2 max-w-[calc(100%-3rem)] sm:max-w-[290px]',
                            style: { transform: 'translate3d(-50%, -50%, 42px)' }
                          };
                        case 'bottom-left':
                          return {
                            className: 'bottom-6 left-6 max-w-[calc(100%-3rem)] sm:max-w-[280px]',
                            style: { transform: 'translate3d(0, 0, 42px)' }
                          };
                        case 'bottom-center':
                          return {
                            className: 'bottom-6 left-1/2 max-w-[calc(100%-3rem)] sm:max-w-[290px]',
                            style: { transform: 'translate3d(-50%, 0, 42px)' }
                          };
                        case 'bottom-right':
                        default:
                          return {
                            className: 'bottom-6 right-6 max-w-[calc(100%-3rem)] sm:max-w-[280px]',
                            style: { transform: 'translate3d(0, 0, 42px)' }
                          };
                      }
                    };

                    const getIphoneBadgeProps = () => {
                      switch (splitBadgePosition) {
                        case 'top-left':
                        case 'top-center':
                        case 'top-right':
                          return {
                            className: 'top-16 left-4 right-4',
                            style: { transform: 'translate3d(0, 0, 42px)' }
                          };
                        case 'center':
                          return {
                            className: 'top-1/2 left-4 right-4',
                            style: { transform: 'translate3d(0, -50%, 42px)' }
                          };
                        case 'bottom-left':
                        case 'bottom-center':
                        case 'bottom-right':
                        default:
                          return {
                            className: 'bottom-10 left-4 right-4',
                            style: { transform: 'translate3d(0, 0, 42px)' }
                          };
                      }
                    };

                    const bProps = getBadgeProps();
                    const ipProps = getIphoneBadgeProps();

                    const renderFloatingBadge = (isIphone = false) => {
                      if (!splitShowBadge) return null;
                      const activeProps = isIphone ? ipProps : bProps;
                      return (
                        <div
                          className={`absolute ${activeProps.className} p-3 sm:p-3.5 rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 shadow-[0_20px_45px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.25)] border border-white/60 flex items-center gap-3 z-20 transition-all`}
                          style={activeProps.style}
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-forest text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-forest uppercase block truncate">
                              {t(splitBadgeTitle)}
                            </span>
                            <span className="text-[11px] text-slate-600 font-medium block truncate">
                              {t(splitBadgeSubtitle)}
                            </span>
                          </div>
                        </div>
                      );
                    };

                    if (splitFrameStyle === 'none') {
                      /* FRAME STYLE 0: SIN MARCO / TRANSPARENTE */
                      return (
                        <div className="relative w-full max-w-[460px] aspect-[4/5] flex items-center justify-center group [transform-style:preserve-3d]">
                          <img
                            src={bgImageUrl}
                            alt={schoolName || 'Colegio'}
                            className={`w-full h-full object-contain filter drop-shadow-[0_30px_40px_rgba(0,0,0,0.4)] transition-transform duration-700 ${
                              splitHoverEffect === 'zoom' ? 'group-hover:scale-108' : 'group-hover:scale-105'
                            }`}
                          />
                          {renderFloatingBadge(false)}
                        </div>
                      );
                    }

                    if (splitFrameStyle === 'iphone-mockup') {
                      /* FRAME STYLE 1: IPHONE MOCKUP */
                      return (
                        <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[365px] aspect-[9/19] bg-[#1a1c1e] rounded-[52px] p-3.5 shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_0_2px_rgba(255,255,255,0.18)] border-[4px] border-[#2e3235] ring-1 ring-black/80 flex flex-col group overflow-hidden [transform-style:preserve-3d]">
                          {/* Dynamic Island */}
                          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3 shadow-md">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#151515] border border-white/10" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 animate-pulse" />
                          </div>
                          
                          {/* Screen */}
                          <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-slate-900 border border-white/10 [transform-style:preserve-3d]">
                            <img
                              src={bgImageUrl}
                              alt={schoolName || 'Colegio'}
                              className={`w-full h-full object-cover transition-transform duration-700 ${
                                splitHoverEffect === 'zoom' ? 'group-hover:scale-110' : 'group-hover:scale-105'
                              }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30 pointer-events-none" />
                            {renderFloatingBadge(true)}

                            {/* Home Indicator */}
                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/70 rounded-full z-20" />
                          </div>
                        </div>
                      );
                    }

                    if (splitFrameStyle === 'studio-canvas') {
                      /* FRAME STYLE 2: STUDIO GALLERY CANVAS */
                      return (
                        <div className="relative rounded-2xl overflow-hidden shadow-[0_35px_80px_rgba(0,0,0,0.65)] p-4 sm:p-6 bg-white border-8 border-slate-900/10 ring-2 ring-black/25 aspect-[4/5] group [transform-style:preserve-3d]">
                          <div className="relative w-full h-full rounded-lg overflow-hidden ring-1 ring-black/15 shadow-inner [transform-style:preserve-3d]">
                            <img
                              src={bgImageUrl}
                              alt={schoolName || 'Colegio'}
                              className={`w-full h-full object-cover transition-transform duration-700 ${
                                splitHoverEffect === 'zoom' ? 'group-hover:scale-108' : 'group-hover:scale-105'
                              }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            {renderFloatingBadge(false)}
                          </div>
                        </div>
                      );
                    }

                    if (splitFrameStyle === 'organic-curve') {
                      /* FRAME STYLE 3: ASYMMETRICAL ORGANIC CURVE */
                      return (
                        <div className="relative rounded-[56px_16px_56px_16px] overflow-hidden shadow-2xl border-4 border-amber-300/30 ring-2 ring-white/20 aspect-[4/5] group bg-white/5 [transform-style:preserve-3d]">
                          <img
                            src={bgImageUrl}
                            alt={schoolName || 'Colegio'}
                            className={`w-full h-full object-cover transition-transform duration-700 ${
                              splitHoverEffect === 'zoom' ? 'group-hover:scale-108' : 'group-hover:scale-105'
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                          {renderFloatingBadge(false)}
                        </div>
                      );
                    }

                    if (splitFrameStyle === 'polaroid-tape') {
                      /* FRAME STYLE 5: FOTO POLAROID CON CINTA WASHI */
                      return (
                        <div className="relative mx-auto w-full max-w-[420px] aspect-[4/5] bg-[#faf8f5] p-3.5 pb-12 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,0,0,0.08)] border border-stone-200/80 group [transform-style:preserve-3d]">
                          {/* Washi tape header */}
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-6 bg-amber-100/85 backdrop-blur-xs border border-amber-300/40 rotate-[-1.5deg] shadow-sm z-30 pointer-events-none rounded-xs opacity-90" />
                          
                          {/* Inner photo container */}
                          <div className="relative w-full h-full rounded-lg overflow-hidden bg-slate-900 shadow-inner">
                            <img
                              src={bgImageUrl}
                              alt={schoolName || 'Colegio'}
                              className={`w-full h-full object-cover transition-transform duration-700 ${
                                splitHoverEffect === 'zoom' ? 'group-hover:scale-108' : 'group-hover:scale-105'
                              }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                          </div>

                          {/* Polaroid Bottom Title */}
                          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-bold text-slate-600 tracking-wider uppercase font-sans">
                            <span className="truncate max-w-[70%]">{schoolName || 'Escuela Montessori'}</span>
                            <span className="text-[10px] text-amber-700/80 font-mono">2026</span>
                          </div>

                          {renderFloatingBadge(false)}
                        </div>
                      );
                    }

                    if (splitFrameStyle === 'arch-window') {
                      /* FRAME STYLE 6: ARCO EDITORIAL NÓRDICO (ARCH) */
                      return (
                        <div className="relative mx-auto w-full max-w-[440px] aspect-[4/5] rounded-t-full rounded-b-3xl overflow-hidden shadow-[0_35px_80px_rgba(0,0,0,0.6)] border-4 border-white/30 ring-2 ring-white/10 group bg-white/5 [transform-style:preserve-3d]">
                          <img
                            src={bgImageUrl}
                            alt={schoolName || 'Colegio'}
                            className={`w-full h-full object-cover transition-transform duration-700 ${
                              splitHoverEffect === 'zoom' ? 'group-hover:scale-108' : 'group-hover:scale-105'
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                          {renderFloatingBadge(false)}
                        </div>
                      );
                    }

                    /* FRAME STYLE 4 (DEFAULT): MODERN FLOATING GLASS CARD */
                    return (
                      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/25 aspect-[4/5] group bg-white/10 backdrop-blur-xs [transform-style:preserve-3d]">
                        <img
                          src={bgImageUrl}
                          alt={schoolName || 'Colegio'}
                          className={`w-full h-full object-cover transition-transform duration-700 ${
                            splitHoverEffect === 'zoom' ? 'group-hover:scale-108' : 'group-hover:scale-105'
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        {renderFloatingBadge(false)}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        {renderBottomShape()}
      </section>
    );
  }

  // =========================================================================
  // TEMPLATE 7: MINIMALISTA CENTRADO
  // =========================================================================
  if (template === 'centered-capsule') {
    return (
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-white pt-28 pb-16 transition-colors duration-300"
        style={{
          backgroundColor: brandPrimaryColor
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${brandPrimaryColor}, ${brandSecondaryColor}90, ${brandPrimaryColor})`
            }}
          />
          {renderPatternOverlay()}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] blur-3xl rounded-full opacity-20"
            style={{ backgroundColor: brandAccentColor || '#fbbf24' }}
          />
        </div>

        {/* Universal Floating Elements */}
        {renderFloatingElements()}

        <div
          className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl"
          style={{
            paddingTop: textPaddingTop ? `${textPaddingTop}px` : undefined,
            paddingBottom: textPaddingBottom ? `${textPaddingBottom}px` : undefined
          }}
        >
          {Boolean(badgeText) && (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border text-xs sm:text-sm font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${badgeColor}25`,
                borderColor: `${badgeColor}40`,
                color: badgeColor,
                fontFamily: badgeFont !== 'inherit' ? badgeFont : undefined,
                fontSize: badgeSize > 0 ? `${badgeSize}px` : undefined,
                marginTop: badgeMarginTop ? `${badgeMarginTop}px` : undefined,
                marginBottom: `${badgeMarginBottom}px`
              }}
            >
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: badgeColor }} />
              <span>{t(badgeText)}</span>
            </div>
          )}

          {hasTitle && (
            <div className="w-full">
              {Boolean(titlePart1Text) && (
                <TitlePart1Tag
                  className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight block"
                  style={{
                    color: titleColor1,
                    fontFamily: titlePart1Font !== 'inherit' ? titlePart1Font : undefined,
                    fontSize: titlePart1Size > 0 ? `${titlePart1Size}px` : undefined,
                    marginTop: titlePart1MarginTop ? `${titlePart1MarginTop}px` : undefined,
                    marginBottom: `${titlePart1MarginBottom}px`
                  }}
                >
                  {t(titlePart1Text)}
                </TitlePart1Tag>
              )}
              {Boolean(titlePart2Text) && (
                <TitlePart2Tag
                  className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight block"
                  style={{
                    color: titleColor2,
                    fontFamily: titlePart2Font !== 'inherit' ? titlePart2Font : undefined,
                    fontSize: titlePart2Size > 0 ? `${titlePart2Size}px` : undefined,
                    marginTop: titlePart2MarginTop ? `${titlePart2MarginTop}px` : undefined,
                    marginBottom: `${titlePart2MarginBottom}px`
                  }}
                >
                  {t(titlePart2Text)}
                </TitlePart2Tag>
              )}
            </div>
          )}

          {Boolean(subtitleText) && (
            <p
              className="text-lg sm:text-2xl max-w-2xl mx-auto leading-relaxed font-sans"
              style={{
                color: subtitleColor,
                opacity: 0.9,
                fontFamily: subtitleFont !== 'inherit' ? subtitleFont : undefined,
                fontSize: subtitleSize > 0 ? `${subtitleSize}px` : undefined,
                marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
                marginBottom: `${subtitleMarginBottom}px`
              }}
            >
              {t(subtitleText)}
            </p>
          )}

          {hasAnyCTA && (
            <div
              className="flex flex-wrap gap-4 items-center justify-center mb-12"
              style={{
                marginTop: ctaMarginTop ? `${ctaMarginTop}px` : undefined,
                marginBottom: ctaMarginBottom ? `${ctaMarginBottom}px` : undefined
              }}
            >
              {Boolean(ctaPrimaryText) && (
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => handleCTA('visit')}
                  className="w-full sm:w-auto rounded-full px-6 sm:px-10 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg font-bold shadow-xl hover:scale-105 transition-all text-white text-center justify-center"
                  style={{
                    backgroundColor: ctaBgColor,
                    fontFamily: ctaFont !== 'inherit' ? ctaFont : undefined,
                    fontSize: ctaSize > 0 ? `${ctaSize}px` : undefined
                  }}
                >
                  {t(ctaPrimaryText)}
                </Button>
              )}

              {showSecondaryCta && Boolean(ctaSecondaryText) && (
                <Button
                  variant="hero-outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-6 sm:px-9 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg border-white/30 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center text-center"
                  onClick={() => handleCTA('info')}
                  style={{
                    fontFamily: cta2Font !== 'inherit' ? cta2Font : undefined,
                    fontSize: cta2Size > 0 ? `${cta2Size}px` : undefined
                  }}
                >
                  <MessageCircle className="w-5 h-5 mr-2 shrink-0" />
                  {t(ctaSecondaryText)}
                </Button>
              )}
            </div>
          )}

          <div className="relative mx-auto max-w-4xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white/15 aspect-[21/9]">
            <img
              src={bgImageUrl}
              alt={schoolName || 'Colegio'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </div>

        {renderBottomShape()}
      </section>
    );
  }

  // =========================================================================
  // TEMPLATE 8: GRADIENTE DINÁMICO
  // =========================================================================
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden text-white pt-24 pb-16 transition-colors duration-300"
      style={{
        background: `linear-gradient(135deg, ${brandPrimaryColor} 0%, ${brandSecondaryColor} 60%, #0f172a 100%)`
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {renderPatternOverlay()}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-[35rem] h-[35rem] blur-3xl rounded-full opacity-20"
          style={{ backgroundColor: brandSecondaryColor || '#10b981' }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-20 -right-20 w-[40rem] h-[40rem] blur-3xl rounded-full opacity-20"
          style={{ backgroundColor: brandAccentColor || '#f59e0b' }}
        />
      </div>

      {/* Universal Floating Elements */}
      {renderFloatingElements()}

      <div
        className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          paddingTop: textPaddingTop ? `${textPaddingTop}px` : undefined,
          paddingBottom: textPaddingBottom ? `${textPaddingBottom}px` : undefined
        }}
      >
        <div className={`max-w-4xl flex flex-col ${alignmentClasses}`}>
          {Boolean(badgeText) && (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border text-xs sm:text-sm font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${badgeColor}25`,
                borderColor: `${badgeColor}40`,
                color: badgeColor,
                fontFamily: badgeFont !== 'inherit' ? badgeFont : undefined,
                fontSize: badgeSize > 0 ? `${badgeSize}px` : undefined,
                marginTop: badgeMarginTop ? `${badgeMarginTop}px` : undefined,
                marginBottom: `${badgeMarginBottom}px`
              }}
            >
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: badgeColor }} />
              <span>{t(badgeText)}</span>
            </div>
          )}

          {hasTitle && (
            <div className="w-full">
              {Boolean(titlePart1Text) && (
                <TitlePart1Tag
                  className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight block"
                  style={{
                    color: titleColor1,
                    fontFamily: titlePart1Font !== 'inherit' ? titlePart1Font : undefined,
                    fontSize: titlePart1Size > 0 ? `${titlePart1Size}px` : undefined,
                    marginTop: titlePart1MarginTop ? `${titlePart1MarginTop}px` : undefined,
                    marginBottom: `${titlePart1MarginBottom}px`
                  }}
                >
                  {t(titlePart1Text)}
                </TitlePart1Tag>
              )}
              {Boolean(titlePart2Text) && (
                <TitlePart2Tag
                  className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight block"
                  style={{
                    color: titleColor2,
                    fontFamily: titlePart2Font !== 'inherit' ? titlePart2Font : undefined,
                    fontSize: titlePart2Size > 0 ? `${titlePart2Size}px` : undefined,
                    marginTop: titlePart2MarginTop ? `${titlePart2MarginTop}px` : undefined,
                    marginBottom: `${titlePart2MarginBottom}px`
                  }}
                >
                  {t(titlePart2Text)}
                </TitlePart2Tag>
              )}
            </div>
          )}

          {Boolean(subtitleText) && (
            <p
              className="text-lg sm:text-2xl max-w-2xl leading-relaxed font-sans"
              style={{
                color: subtitleColor,
                opacity: 0.9,
                fontFamily: subtitleFont !== 'inherit' ? subtitleFont : undefined,
                fontSize: subtitleSize > 0 ? `${subtitleSize}px` : undefined,
                marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
                marginBottom: `${subtitleMarginBottom}px`
              }}
            >
              {t(subtitleText)}
            </p>
          )}

          {hasAnyCTA && (
            <div
              className={`flex flex-wrap gap-4 items-center ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}
              style={{
                marginTop: ctaMarginTop ? `${ctaMarginTop}px` : undefined,
                marginBottom: ctaMarginBottom ? `${ctaMarginBottom}px` : undefined
              }}
            >
              {Boolean(ctaPrimaryText) && (
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => handleCTA('visit')}
                  className="w-full sm:w-auto rounded-full px-6 sm:px-10 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg font-bold shadow-xl hover:-translate-y-1 transition-all text-white text-center justify-center"
                  style={{
                    backgroundColor: ctaBgColor,
                    fontFamily: ctaFont !== 'inherit' ? ctaFont : undefined,
                    fontSize: ctaSize > 0 ? `${ctaSize}px` : undefined
                  }}
                >
                  {t(ctaPrimaryText)}
                </Button>
              )}

              {showSecondaryCta && Boolean(ctaSecondaryText) && (
                <Button
                  variant="hero-outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-6 sm:px-9 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg border-white/30 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center text-center"
                  onClick={() => handleCTA('info')}
                  style={{
                    fontFamily: cta2Font !== 'inherit' ? cta2Font : undefined,
                    fontSize: cta2Size > 0 ? `${cta2Size}px` : undefined
                  }}
                >
                  <MessageCircle className="w-5 h-5 mr-2 shrink-0" />
                  {t(ctaSecondaryText)}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {renderBottomShape()}
    </section>
  );
}
