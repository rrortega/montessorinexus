import { motion } from 'framer-motion';

interface FadeInScrollProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  distance?: number;
}

/**
 * Reveal animation that triggers when an element enters the viewport.
 * Uses a smooth Bezier curve for a premium "Apple-like" feel.
 */
export function FadeInScroll({ 
  children, 
  delay = 0, 
  direction = 'up', 
  className = "",
  distance = 40
}: FadeInScrollProps) {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.8, 
        delay, 
        ease: [0.21, 0.47, 0.32, 0.98] // Custom cubic-bezier for elegant entry
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
