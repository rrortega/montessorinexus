import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { MessageCircle } from 'lucide-react';
import { useMouseParallax } from '@/hooks/use-mouse-parallax';
import { Magnetic } from '@/components/ui/magnetic';
import heroImage from '@/assets/hero-montessori.png';
import { useEffect } from 'react';
import { useCTA } from '@/hooks/use-cta';

export function HeroSection() {
  const { t } = useI18n();
  const { handleCTA } = useCTA();

  // Mouse Parallax Logic
  const { x: mouseX, y: mouseY } = useMouseParallax(30);
  const bgX = useTransform(mouseX, (v) => -v * 0.5);
  const bgY = useTransform(mouseY, (v) => -v * 0.5);
  
  // Spotlight effect logic
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const springSpotX = useSpring(spotX, { damping: 50, stiffness: 200 });
  const springSpotY = useSpring(spotY, { damping: 50, stiffness: 200 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      spotX.set(e.clientX);
      spotY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [spotX, spotY]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image and Overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ x: bgX, y: bgY, scale: 1.1 }}
          className="absolute inset-[-5%] w-[110%] h-[110%]"
        >
          <img
            src={heroImage}
            alt="Ambiente Montessori"
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Spotlight Overlay */}
        <motion.div 
          style={{ 
            background: useTransform(
              [springSpotX, springSpotY],
              ([x, y]) => `radial-gradient(circle 400px at ${x}px ${y}px, rgba(255,255,255,0.05), transparent)`
            )
          }}
          className="absolute inset-0 z-[1] pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-forest/90 via-forest/70 to-transparent z-[2]" />

        {/* Playful Doodles with Parallax */}
        <motion.div
          style={{ x: useTransform(mouseX, (v) => v * 1.5), y: useTransform(mouseY, (v) => v * 1.5) }}
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-10 md:right-20 pointer-events-none opacity-40 z-[3]"
        >
          <svg width="120" height="120" viewBox="0 0 100 100" className="text-sunshine fill-current">
            <path d="M50 20 L60 40 L80 40 L65 55 L75 75 L50 65 L25 75 L35 55 L20 40 L40 40 Z" />
          </svg>
        </motion.div>

        <motion.div
          style={{ x: useTransform(mouseX, (v) => -v * 1.2), y: useTransform(mouseY, (v) => -v * 1.2) }}
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-10 pointer-events-none opacity-30 z-[3]"
        >
          <svg width="150" height="100" viewBox="0 0 200 100" className="text-sky fill-current">
            <path d="M40 80 Q10 80 10 50 Q10 20 40 20 Q50 20 60 30 Q70 10 100 10 Q140 10 140 40 Q170 40 170 70 Q170 95 140 95 L40 95 Z" />
          </svg>
        </motion.div>

        {/* Organic Blobs with subtle floating */}
        <motion.div 
          style={{ x: useTransform(mouseX, (v) => v * 0.8), y: useTransform(mouseY, (v) => v * 0.8) }}
          className="absolute top-1/4 -left-20 w-64 h-64 bg-sunshine/10 blob-shape animate-pulse z-[2]" 
        />
        <motion.div 
          style={{ x: useTransform(mouseX, (v) => -v * 0.5), y: useTransform(mouseY, (v) => -v * 0.5) }}
          className="absolute bottom-1/4 -right-20 w-80 h-80 bg-leaf/20 blob-shape-alt animate-bounce-slow z-[2]" 
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block text-primary-foreground/80 text-sm font-medium tracking-wider uppercase mb-4"
          >
            {t('Colegio Montessori Bilingüe 100%')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[1.2] mb-8"
          >
            {t('Apasionados por la formación de niños')}{' '}
            <motion.span 
              whileHover={{ scale: 1.05, rotate: 0 }}
              className="inline-block px-4 py-1 rounded-3xl bg-white/80 text-forest -rotate-3 shadow-lg -translate-y-1 transform transition-all duration-300 cursor-default"
            >
              {t('autónomos')}
            </motion.span>{' '}
            <motion.span 
              whileHover={{ scale: 1.05, rotate: 0 }}
              className="inline-block px-4 py-1 rounded-[2rem] bg-terracotta/80 text-white rotate-6 shadow-lg translate-y-2 transform transition-all duration-300 -ml-2 cursor-default"
            >
              {t('conscientes')}
            </motion.span>{' '}
            <motion.span 
              whileHover={{ scale: 1.05, rotate: 0 }}
              className="inline-block px-4 py-1 rounded-full bg-forest border border-white/50 pb-2 text-whote -rotate-2 shadow-lg -translate-y-3 transform transition-all duration-300 -ml-2 cursor-default"
            >
              {t('seguros')}
            </motion.span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl mb-8 leading-relaxed"
          >
            <p className="font-display font-medium text-2xl mb-2">
              {t('Raíces profundas, visión alta, un sinfín de posibilidades por delante.')}
            </p>
            <p className="italic">
              {t('Cada niño crece y deja una huella única, cuando aprende desde su libertad.')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 items-center"
          >
            <Magnetic strength={0.2}>
              <Button 
                variant="accent" 
                size="lg" 
                onClick={() => handleCTA('visit')}
                className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-accent/40 transition-all"
              >
                {t('Agenda una Visita')}
              </Button>
            </Magnetic>
            
            <Magnetic strength={0.2}>
              <Button
                variant="hero-outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg border-2 hover:bg-white/10 transition-all flex items-center gap-2 group"
                onClick={() => handleCTA('info')}
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {t('Informes')}
              </Button>
            </Magnetic>
          </motion.div>
        </div>
      </div>

      {/* Decorative bottom curve */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-[5]">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-[100px]"
          fill="currentColor"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C1.35,31.7,249.36,69.83,321.39,56.44Z"
            className="fill-background"
          ></path>
        </svg>
      </div>
    </section>
  );
}
