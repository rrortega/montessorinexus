import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Star, Compass, Sun, Moon, Cloud, Flower2, Sprout, BookOpen, GraduationCap, Baby, Smile } from 'lucide-react';

export interface SectionFloatingStickerConfig {
  id: string;
  show?: boolean;
  imageUrl?: string;
  icon?: string;
  text?: string;
  effects?: string[]; // 'float' | 'pulse' | 'spin' | 'tilt' | 'glow'
  // Desktop
  desktopX: number;
  desktopY: number;
  desktopSize: number;
  desktopRotate: number;
  desktopShow?: boolean;
  // Tablet
  tabletX?: number;
  tabletY?: number;
  tabletSize?: number;
  tabletRotate?: number;
  tabletShow?: boolean;
  // Mobile
  mobileX?: number;
  mobileY?: number;
  mobileSize?: number;
  mobileRotate?: number;
  mobileShow?: boolean;
}

const STICKER_ICONS_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Heart,
  Star,
  Compass,
  Sun,
  Moon,
  Cloud,
  Flower2,
  Sprout,
  BookOpen,
  GraduationCap,
  Baby,
  Smile
};

interface AnimatedStickerProps {
  effects?: string[];
  baseRotate?: number;
  children: React.ReactNode;
}

const AnimatedSticker: React.FC<AnimatedStickerProps> = ({ effects = ['float'], baseRotate = 0, children }) => {
  const hasFloat = effects.includes('float');
  const hasPulse = effects.includes('pulse');
  const hasSpin = effects.includes('spin');
  const hasTilt = effects.includes('tilt');
  const hasGlow = effects.includes('glow');

  let animateProps: any = {
    rotate: baseRotate
  };

  let transitionProps: any = {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut'
  };

  if (hasSpin) {
    animateProps.rotate = [baseRotate, baseRotate + 360];
    transitionProps.duration = 12;
    transitionProps.ease = 'linear';
  } else if (hasTilt) {
    animateProps.rotate = [baseRotate - 6, baseRotate + 6, baseRotate - 6];
    transitionProps.duration = 3.5;
  }

  if (hasFloat) {
    animateProps.y = [0, -12, 0];
    transitionProps.duration = 3.8;
  }

  if (hasPulse) {
    animateProps.scale = [1, 1.08, 1];
    transitionProps.duration = 2.8;
  }

  return (
    <motion.div
      animate={animateProps}
      transition={transitionProps}
      className={`relative w-full h-full select-none ${
        hasGlow ? 'filter drop-shadow-[0_0_15px_rgba(27,59,43,0.35)]' : 'filter drop-shadow-md'
      }`}
    >
      {children}
    </motion.div>
  );
};

export const SectionFloatingStickers: React.FC<{
  config?: Record<string, any>;
}> = ({ config }) => {
  if (!config) return null;

  const stickers: SectionFloatingStickerConfig[] = [1, 2, 3].map((num) => {
    const show = config[`sticker_${num}_show`] === 'true' || config[`sticker_${num}_show`] === true;
    const imageUrl = config[`sticker_${num}_image_url`] || '';
    const icon = config[`sticker_${num}_icon`] || '';
    const text = config[`sticker_${num}_text`] || '';
    
    // Effects
    let effects: string[] = ['float'];
    const rawEffects = config[`sticker_${num}_effects`];
    if (typeof rawEffects === 'string') {
      try {
        effects = JSON.parse(rawEffects);
      } catch {
        effects = rawEffects.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(rawEffects)) {
      effects = rawEffects;
    }

    // Desktop
    const desktopX = config[`sticker_${num}_desktop_x`] !== undefined && !isNaN(Number(config[`sticker_${num}_desktop_x`]))
      ? Number(config[`sticker_${num}_desktop_x`])
      : (num === 1 ? 8 : num === 2 ? 92 : 88);
    const desktopY = config[`sticker_${num}_desktop_y`] !== undefined && !isNaN(Number(config[`sticker_${num}_desktop_y`]))
      ? Number(config[`sticker_${num}_desktop_y`])
      : (num === 1 ? 15 : num === 2 ? 20 : 80);
    const desktopSize = config[`sticker_${num}_desktop_size`] !== undefined && !isNaN(Number(config[`sticker_${num}_desktop_size`]))
      ? Number(config[`sticker_${num}_desktop_size`])
      : 72;
    const desktopRotate = config[`sticker_${num}_desktop_rotate`] !== undefined && !isNaN(Number(config[`sticker_${num}_desktop_rotate`]))
      ? Number(config[`sticker_${num}_desktop_rotate`])
      : (num === 1 ? -8 : num === 2 ? 10 : -4);
    const desktopShow = config[`sticker_${num}_desktop_show`] !== 'false';

    // Tablet
    const tabletX = config[`sticker_${num}_tablet_x`] !== undefined && !isNaN(Number(config[`sticker_${num}_tablet_x`]))
      ? Number(config[`sticker_${num}_tablet_x`])
      : desktopX;
    const tabletY = config[`sticker_${num}_tablet_y`] !== undefined && !isNaN(Number(config[`sticker_${num}_tablet_y`]))
      ? Number(config[`sticker_${num}_tablet_y`])
      : desktopY;
    const tabletSize = config[`sticker_${num}_tablet_size`] !== undefined && !isNaN(Number(config[`sticker_${num}_tablet_size`]))
      ? Number(config[`sticker_${num}_tablet_size`])
      : Math.round(desktopSize * 0.85);
    const tabletRotate = config[`sticker_${num}_tablet_rotate`] !== undefined && !isNaN(Number(config[`sticker_${num}_tablet_rotate`]))
      ? Number(config[`sticker_${num}_tablet_rotate`])
      : desktopRotate;
    const tabletShow = config[`sticker_${num}_tablet_show`] !== 'false';

    // Mobile
    const mobileX = config[`sticker_${num}_mobile_x`] !== undefined && !isNaN(Number(config[`sticker_${num}_mobile_x`]))
      ? Number(config[`sticker_${num}_mobile_x`])
      : desktopX;
    const mobileY = config[`sticker_${num}_mobile_y`] !== undefined && !isNaN(Number(config[`sticker_${num}_mobile_y`]))
      ? Number(config[`sticker_${num}_mobile_y`])
      : desktopY;
    const mobileSize = config[`sticker_${num}_mobile_size`] !== undefined && !isNaN(Number(config[`sticker_${num}_mobile_size`]))
      ? Number(config[`sticker_${num}_mobile_size`])
      : Math.round(desktopSize * 0.7);
    const mobileRotate = config[`sticker_${num}_mobile_rotate`] !== undefined && !isNaN(Number(config[`sticker_${num}_mobile_rotate`]))
      ? Number(config[`sticker_${num}_mobile_rotate`])
      : desktopRotate;
    const mobileShow = config[`sticker_${num}_mobile_show`] !== 'false';

    return {
      id: `sticker_${num}`,
      show,
      imageUrl,
      icon,
      text,
      effects,
      desktopX,
      desktopY,
      desktopSize,
      desktopRotate,
      desktopShow,
      tabletX,
      tabletY,
      tabletSize,
      tabletRotate,
      tabletShow,
      mobileX,
      mobileY,
      mobileSize,
      mobileRotate,
      mobileShow
    };
  });

  const activeStickers = stickers.filter(s => s.show && (s.imageUrl || s.icon || s.text));
  if (activeStickers.length === 0) return null;

  const renderStickerContent = (s: SectionFloatingStickerConfig) => {
    if (s.imageUrl) {
      return (
        <img
          src={s.imageUrl}
          alt="Adorno flotante"
          className="w-full h-full object-contain pointer-events-none"
        />
      );
    }
    if (s.icon && STICKER_ICONS_MAP[s.icon]) {
      const Icon = STICKER_ICONS_MAP[s.icon];
      return (
        <div className="w-full h-full rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-forest/20 shadow-lg flex items-center justify-center text-forest dark:text-emerald-400 p-2">
          <Icon className="w-full h-full" />
        </div>
      );
    }
    if (s.text) {
      return (
        <div className="w-full h-full rounded-2xl bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center text-xs shadow-lg border-2 border-white px-2 py-1 text-center">
          {s.text}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {activeStickers.map((s) => (
        <React.Fragment key={s.id}>
          {/* Mobile View (< 640px) */}
          {s.mobileShow && (
            <div
              className="block sm:hidden absolute pointer-events-none"
              style={{
                left: `${s.mobileX}%`,
                top: `${s.mobileY}%`,
                width: `${s.mobileSize}px`,
                height: `${s.mobileSize}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <AnimatedSticker effects={s.effects} baseRotate={s.mobileRotate}>
                {renderStickerContent(s)}
              </AnimatedSticker>
            </div>
          )}

          {/* Tablet View (640px - 1024px) */}
          {s.tabletShow && (
            <div
              className="hidden sm:block lg:hidden absolute pointer-events-none"
              style={{
                left: `${s.tabletX}%`,
                top: `${s.tabletY}%`,
                width: `${s.tabletSize}px`,
                height: `${s.tabletSize}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <AnimatedSticker effects={s.effects} baseRotate={s.tabletRotate}>
                {renderStickerContent(s)}
              </AnimatedSticker>
            </div>
          )}

          {/* Desktop View (>= 1024px) */}
          {s.desktopShow && (
            <div
              className="hidden lg:block absolute pointer-events-none"
              style={{
                left: `${s.desktopX}%`,
                top: `${s.desktopY}%`,
                width: `${s.desktopSize}px`,
                height: `${s.desktopSize}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <AnimatedSticker effects={s.effects} baseRotate={s.desktopRotate}>
                {renderStickerContent(s)}
              </AnimatedSticker>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
