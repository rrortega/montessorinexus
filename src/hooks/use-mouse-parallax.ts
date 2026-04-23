import { useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

/**
 * Hook to create a mouse parallax effect.
 * Returns spring-smoothed X and Y motion values normalized between -100 and 100 
 * (or custom range) based on mouse position relative to the center of the screen.
 */
export function useMouseParallax(strength = 20) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 100 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate position relative to center (-0.5 to 0.5)
      const nx = (clientX / innerWidth) - 0.5;
      const ny = (clientY / innerHeight) - 0.5;
      
      x.set(nx * strength);
      y.set(ny * strength);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [strength, x, y]);

  return { x: springX, y: springY };
}
