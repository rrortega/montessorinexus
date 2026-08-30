import React from 'react';
import { motion } from 'framer-motion';

export type ReactionType = 'heart' | 'clap' | 'sprout' | 'bulb' | 'smile' | 'star' | string;

export interface ReactionMeta {
  key: string;
  type: string;
  label: string;
  color: string;
  bgGradient: string;
  borderColor: string;
}

export const REACTION_DEFINITIONS: Record<string, ReactionMeta> = {
  '❤️': {
    key: '❤️',
    type: 'heart',
    label: 'Me encanta',
    color: '#ef4444',
    bgGradient: 'from-rose-500/20 to-red-500/10',
    borderColor: 'border-rose-300 dark:border-rose-800'
  },
  '👏': {
    key: '👏',
    type: 'clap',
    label: '¡Bravo!',
    color: '#f59e0b',
    bgGradient: 'from-amber-500/20 to-yellow-500/10',
    borderColor: 'border-amber-300 dark:border-amber-800'
  },
  '🌱': {
    key: '🌱',
    type: 'sprout',
    label: 'Crecimiento',
    color: '#10b981',
    bgGradient: 'from-emerald-500/20 to-teal-500/10',
    borderColor: 'border-emerald-300 dark:border-emerald-800'
  },
  '💡': {
    key: '💡',
    type: 'bulb',
    label: 'Inspirador',
    color: '#eab308',
    bgGradient: 'from-yellow-500/20 to-amber-500/10',
    borderColor: 'border-yellow-300 dark:border-yellow-800'
  },
  '😊': {
    key: '😊',
    type: 'smile',
    label: 'Me alegra',
    color: '#06b6d4',
    bgGradient: 'from-cyan-500/20 to-blue-500/10',
    borderColor: 'border-cyan-300 dark:border-cyan-800'
  },
  '🌟': {
    key: '🌟',
    type: 'star',
    label: 'Excelente',
    color: '#8b5cf6',
    bgGradient: 'from-purple-500/20 to-indigo-500/10',
    borderColor: 'border-purple-300 dark:border-purple-800'
  }
};

export const REACTION_LIST = Object.values(REACTION_DEFINITIONS);

/**
 * Animated SVG Heart
 */
export const AnimatedHeartIcon: React.FC<{ size?: number; isHovered?: boolean; isSelected?: boolean }> = ({
  size = 20,
  isHovered = false,
  isSelected = false
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        scale: isHovered ? [1, 1.25, 1.15] : isSelected ? [1, 1.2, 1] : 1,
        rotate: isHovered ? [0, -8, 8, 0] : 0
      }}
      transition={{
        duration: isHovered ? 0.6 : 0.3,
        repeat: isHovered ? Infinity : 0,
        ease: 'easeInOut'
      }}
      className="shrink-0 drop-shadow-xs"
    >
      <defs>
        <radialGradient id="heartGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ff758c" />
          <stop offset="60%" stopColor="#ff135b" />
          <stop offset="100%" stopColor="#c70039" />
        </radialGradient>
        <filter id="heartGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Heart Shape */}
      <path
        d="M16 28.5C16 28.5 3.5 20.5 3.5 11.5C3.5 6.5 7.5 3 12 3C14.8 3 16 4.8 16 4.8C16 4.8 17.2 3 20 3C24.5 3 28.5 6.5 28.5 11.5C28.5 20.5 16 28.5 16 28.5Z"
        fill="url(#heartGrad)"
        filter={isHovered || isSelected ? 'url(#heartGlow)' : undefined}
      />
      {/* Glossy highlight */}
      <path
        d="M7 10C7 7.5 9 5.5 11.5 5.5C12.2 5.5 12.8 5.7 13.3 6"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Small floating sparkles on hover */}
      {isHovered && (
        <motion.circle
          cx="24"
          cy="7"
          r="1.5"
          fill="#ffffff"
          animate={{ opacity: [0, 1, 0], y: [-2, -6], scale: [0.5, 1.2, 0.2] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.svg>
  );
};

/**
 * Animated SVG Clapping Hands (Bravo)
 */
export const AnimatedClapIcon: React.FC<{ size?: number; isHovered?: boolean; isSelected?: boolean }> = ({
  size = 20,
  isHovered = false,
  isSelected = false
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        scale: isHovered ? [1, 1.2, 1.1] : isSelected ? [1, 1.18, 1] : 1,
        rotate: isHovered ? [0, -12, 4, -8, 0] : 0
      }}
      transition={{
        duration: isHovered ? 0.5 : 0.3,
        repeat: isHovered ? Infinity : 0,
        ease: 'easeInOut'
      }}
      className="shrink-0 drop-shadow-xs"
    >
      <defs>
        <linearGradient id="clapSkin" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Right Hand */}
      <path
        d="M21 13L24 7C24.5 6 26 5.5 27 6.2C28 7 28.2 8.5 27.5 9.5L24 16L27 18C28 18.7 28.2 20.2 27.5 21.2C26.7 22 25.5 22 24.5 21.5L20 19L16 23L11 18L18 11L21 13Z"
        fill="url(#clapSkin)"
      />
      {/* Left Hand Base */}
      <path
        d="M13 15L9 9C8.3 8 6.8 7.7 5.8 8.4C4.8 9.2 4.6 10.7 5.4 11.7L9 18L6 20C5 20.8 4.8 22.3 5.6 23.3C6.4 24.2 7.7 24.3 8.7 23.7L14 20L18 24L22 19L16 13L13 15Z"
        fill="#fbbf24"
      />
      {/* Sparkle energy lines */}
      <motion.path
        d="M16 4V1M22 6L25 3M10 6L7 3"
        stroke="#f59e0b"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{
          opacity: isHovered ? [0.4, 1, 0.4] : 0.7,
          scale: isHovered ? [0.9, 1.2, 0.9] : 1
        }}
        transition={{ duration: 0.4, repeat: Infinity }}
      />
    </motion.svg>
  );
};

/**
 * Animated SVG Sprout (Crecimiento Montessori)
 */
export const AnimatedSproutIcon: React.FC<{ size?: number; isHovered?: boolean; isSelected?: boolean }> = ({
  size = 20,
  isHovered = false,
  isSelected = false
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        scale: isHovered ? [1, 1.25, 1.15] : isSelected ? [1, 1.2, 1] : 1,
        y: isHovered ? [-1, -3, -1] : 0
      }}
      transition={{
        duration: isHovered ? 0.6 : 0.3,
        repeat: isHovered ? Infinity : 0,
        ease: 'easeInOut'
      }}
      className="shrink-0 drop-shadow-xs"
    >
      <defs>
        <linearGradient id="leafGradLeft" x1="0" y1="0" x2="16" y2="16">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="leafGradRight" x1="16" y1="0" x2="32" y2="16">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="stemGrad" x1="16" y1="12" x2="16" y2="28">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      {/* Curved Stem */}
      <path
        d="M16 28C16 21 16 16 16 12"
        stroke="url(#stemGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Ground mound */}
      <path
        d="M11 28C13 27 19 27 21 28"
        stroke="#92400e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left Leaf */}
      <motion.path
        d="M16 16C11 16 6 12 7 6C13 6 16 11 16 16Z"
        fill="url(#leafGradLeft)"
        animate={{
          rotate: isHovered ? [0, -10, 0] : 0
        }}
        style={{ originX: '16px', originY: '16px' }}
        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Right Leaf */}
      <motion.path
        d="M16 14C21 14 26 10 25 4C19 4 16 9 16 14Z"
        fill="url(#leafGradRight)"
        animate={{
          rotate: isHovered ? [0, 10, 0] : 0
        }}
        style={{ originX: '16px', originY: '14px' }}
        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
};

/**
 * Animated SVG Lightbulb (Inspirador / Ideas)
 */
export const AnimatedBulbIcon: React.FC<{ size?: number; isHovered?: boolean; isSelected?: boolean }> = ({
  size = 20,
  isHovered = false,
  isSelected = false
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        scale: isHovered ? [1, 1.25, 1.15] : isSelected ? [1, 1.2, 1] : 1
      }}
      transition={{
        duration: isHovered ? 0.6 : 0.3,
        repeat: isHovered ? Infinity : 0,
        ease: 'easeInOut'
      }}
      className="shrink-0 drop-shadow-xs"
    >
      <defs>
        <radialGradient id="bulbGlass" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#eab308" />
        </radialGradient>
      </defs>
      {/* Bulb Body */}
      <path
        d="M16 4C10.5 4 6 8.5 6 14C6 17.5 8 20.5 11 22.5V25C11 25.6 11.4 26 12 26H20C20.6 26 21 25.6 21 25V22.5C24 20.5 26 17.5 26 14C26 8.5 21.5 4 16 4Z"
        fill="url(#bulbGlass)"
      />
      {/* Base Screw */}
      <path
        d="M12 26H20V28C20 28.6 19.6 29 19 29H13C12.4 29 12 28.6 12 28V26Z"
        fill="#94a3b8"
      />
      <line x1="12" y1="27" x2="20" y2="27" stroke="#64748b" strokeWidth="1.5" />
      {/* Filament */}
      <path
        d="M13 15L15 11L17 15L19 11"
        stroke="#ca8a04"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Radiating Light Beams */}
      <motion.g
        animate={{
          opacity: isHovered || isSelected ? [0.4, 1, 0.4] : 0.6,
          scale: isHovered ? [0.9, 1.15, 0.9] : 1
        }}
        style={{ originX: '16px', originY: '14px' }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <line x1="16" y1="1" x2="16" y2="3" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="8" x2="2" y2="7" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="8" x2="30" y2="7" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <line x1="2" y1="14" x2="0" y2="14" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="14" x2="32" y2="14" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
};

/**
 * Animated SVG Smiling Face (Me alegra)
 */
export const AnimatedSmileIcon: React.FC<{ size?: number; isHovered?: boolean; isSelected?: boolean }> = ({
  size = 20,
  isHovered = false,
  isSelected = false
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        scale: isHovered ? [1, 1.25, 1.15] : isSelected ? [1, 1.2, 1] : 1,
        rotate: isHovered ? [0, -10, 10, 0] : 0
      }}
      transition={{
        duration: isHovered ? 0.6 : 0.3,
        repeat: isHovered ? Infinity : 0,
        ease: 'easeInOut'
      }}
      className="shrink-0 drop-shadow-xs"
    >
      <defs>
        <radialGradient id="smileFace" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="60%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0284c7" />
        </radialGradient>
      </defs>
      {/* Face Circle */}
      <circle cx="16" cy="16" r="13" fill="url(#smileFace)" />
      {/* Eyes (happy curves) */}
      <path
        d="M10 13C10.5 11.5 12.5 11.5 13 13"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 13C19.5 11.5 21.5 11.5 22 13"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Rosy Cheeks */}
      <circle cx="9" cy="18" r="2" fill="#ec4899" opacity="0.6" />
      <circle cx="23" cy="18" r="2" fill="#ec4899" opacity="0.6" />
      {/* Happy Open Smile */}
      <path
        d="M10.5 18C11.5 22.5 20.5 22.5 21.5 18H10.5Z"
        fill="#ffffff"
      />
      <path
        d="M14 21C15 22 17 22 18 21"
        stroke="#fb7185"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
};

/**
 * Animated SVG Glowing Star (Excelente)
 */
export const AnimatedStarIcon: React.FC<{ size?: number; isHovered?: boolean; isSelected?: boolean }> = ({
  size = 20,
  isHovered = false,
  isSelected = false
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        scale: isHovered ? [1, 1.3, 1.15] : isSelected ? [1, 1.2, 1] : 1,
        rotate: isHovered ? [0, 90, 180, 360] : 0
      }}
      transition={{
        duration: isHovered ? 2.5 : 0.3,
        repeat: isHovered ? Infinity : 0,
        ease: 'linear'
      }}
      className="shrink-0 drop-shadow-xs"
    >
      <defs>
        <radialGradient id="starGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#6b21a8" />
        </radialGradient>
      </defs>
      {/* 4-Point Sparkling Star */}
      <path
        d="M16 2C16 9.5 22.5 16 30 16C22.5 16 16 22.5 16 30C16 22.5 9.5 16 2 16C9.5 16 16 9.5 16 2Z"
        fill="url(#starGrad)"
      />
      {/* Center Shine */}
      <circle cx="16" cy="16" r="3" fill="#ffffff" />
      {/* Mini spark lines */}
      <motion.g
        animate={{
          opacity: isHovered || isSelected ? [0.3, 1, 0.3] : 0.5,
          scale: isHovered ? [0.8, 1.2, 0.8] : 1
        }}
        style={{ originX: '16px', originY: '16px' }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        <line x1="7" y1="7" x2="9" y2="9" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="25" y1="7" x2="23" y2="9" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="25" x2="9" y2="23" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="25" y1="25" x2="23" y2="23" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
};

/**
 * Universal Animated Reaction Icon Dispatcher
 */
export const AnimatedReactionIcon: React.FC<{
  reaction: string;
  size?: number;
  isHovered?: boolean;
  isSelected?: boolean;
}> = ({ reaction, size = 18, isHovered = false, isSelected = false }) => {
  switch (reaction) {
    case '❤️':
    case 'heart':
      return <AnimatedHeartIcon size={size} isHovered={isHovered} isSelected={isSelected} />;
    case '👏':
    case 'clap':
      return <AnimatedClapIcon size={size} isHovered={isHovered} isSelected={isSelected} />;
    case '🌱':
    case 'sprout':
      return <AnimatedSproutIcon size={size} isHovered={isHovered} isSelected={isSelected} />;
    case '💡':
    case 'bulb':
      return <AnimatedBulbIcon size={size} isHovered={isHovered} isSelected={isSelected} />;
    case '😊':
    case 'smile':
      return <AnimatedSmileIcon size={size} isHovered={isHovered} isSelected={isSelected} />;
    case '🌟':
    case 'star':
      return <AnimatedStarIcon size={size} isHovered={isHovered} isSelected={isSelected} />;
    default:
      return <AnimatedHeartIcon size={size} isHovered={isHovered} isSelected={isSelected} />;
  }
};
