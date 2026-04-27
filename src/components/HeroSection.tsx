import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { MessageCircle } from 'lucide-react';
import { useMouseParallax } from '@/hooks/use-mouse-parallax';
import { Magnetic } from '@/components/ui/magnetic';
import heroImage from '@/assets/hero-montessori.png';
import { useEffect } from 'react';
import { useCTA } from '@/hooks/use-cta';
import { Typewriter } from '@/components/ui/typewriter';

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
          <div className="absolute inset-0 bg-forest/40 backdrop-blur-[2px]" />
        </motion.div>
        
        {/* Spotlight Overlay */}
        <motion.div 
          style={{ 
            background: useTransform(
              [springSpotX, springSpotY],
              ([x, y]) => `radial-gradient(circle 450px at ${x}px ${y}px, rgba(255,255,255,0.08), transparent)`
            )
          }}
          className="absolute inset-0 z-[1] pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-forest/60 via-transparent to-forest/80 z-[2]" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest/90 via-forest/40 to-transparent z-[2]" />

        {/* Playful Doodles with Parallax */}
        <motion.div
          style={{ x: useTransform(mouseX, (v) => v * 1.5), y: useTransform(mouseY, (v) => v * 1.5) }}
          animate={{ rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-10 md:right-32 pointer-events-none opacity-50 z-[3]"
        >
          <svg width="140" height="140" viewBox="0 0 100 100" className="text-sunshine fill-current filter drop-shadow-xl">
            <path d="M50 20 L60 40 L80 40 L65 55 L75 75 L50 65 L25 75 L35 55 L20 40 L40 40 Z" />
          </svg>
        </motion.div>

        <motion.div
          style={{ x: useTransform(mouseX, (v) => -v * 1.2), y: useTransform(mouseY, (v) => -v * 1.2) }}
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-10 md:left-20 pointer-events-none opacity-40 z-[3]"
        >
          <svg width="180" height="120" viewBox="0 0 200 100" className="text-sky fill-current filter drop-shadow-lg">
            <path d="M40 80 Q10 80 10 50 Q10 20 40 20 Q50 20 60 30 Q70 10 100 10 Q140 10 140 40 Q170 40 170 70 Q170 95 140 95 L40 95 Z" />
          </svg>
        </motion.div>

        {/* Organic Blobs with subtle floating */}
        <motion.div 
          style={{ x: useTransform(mouseX, (v) => v * 0.6), y: useTransform(mouseY, (v) => v * 0.6) }}
          className="absolute top-1/3 -left-32 w-96 h-96 bg-sunshine/15 blur-3xl blob-shape z-[2]" 
        />
        <motion.div 
          style={{ x: useTransform(mouseX, (v) => -v * 0.4), y: useTransform(mouseY, (v) => -v * 0.4) }}
          className="absolute bottom-1/4 -right-32 w-[30rem] h-[30rem] bg-leaf/20 blur-3xl blob-shape-alt z-[2]" 
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-start min-h-screen pt-20">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-8 w-fit bg-forest/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg"
            >
              <div className="h-[2px] w-8 bg-sunshine" />
              <span className="text-white text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
                {t('Colegio Montessori Bilingüe 100%')}
              </span>
            </motion.div>
 
            <div className="mb-8 min-h-[160px] sm:min-h-[120px] md:min-h-[180px] lg:min-h-[220px]">
              <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight drop-shadow-2xl">
                <Typewriter 
                  phrases={[
                    t("Honramos la intención guiando su dirección."),
                    t("Creciendo con propósito, liderando con empatía."),
                    t("Raíces abajo, visión arriba, infinitas posibilidades adelante."),
                    t("Libres para pensar, capaces de transformar.")
                  ]}
                  className="text-white"
                  pauseTime={3500}
                />
              </h1>
            </div>
 
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl sm:text-2xl text-white max-w-2xl mb-12 font-display font-medium leading-relaxed drop-shadow-xl"
            >
              {t('Apasionados por la formación de niños autónomos, conscientes y seguros')}
            </motion.p>
 
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap gap-6 items-center"
            >
              <Magnetic strength={0.1}>
                <Button 
                  variant="accent" 
                  size="lg" 
                  onClick={() => handleCTA('visit')}
                  className="rounded-full px-10 py-7 text-lg font-bold shadow-xl transition-all hover:-translate-y-1"
                >
                  {t('Agenda una Visita')}
                </Button>
              </Magnetic>
              
              <Magnetic strength={0.1}>
                <Button
                  variant="hero-outline"
                  size="lg"
                  className="rounded-full px-10 py-7 text-lg border-white/40 hover:bg-white/10 backdrop-blur-sm transition-all flex items-center gap-3 group"
                  onClick={() => handleCTA('info')}
                >
                  <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {t('Informes')}
                </Button>
              </Magnetic>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Decorative bottom curve */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-[5]">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-[80px] md:h-[120px]"
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
