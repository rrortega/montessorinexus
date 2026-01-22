import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { MessageCircle } from 'lucide-react';
import heroImage from '@/assets/hero-montessori.jpg';

export function HeroSection() {
  const { t } = useI18n();
  const phone = import.meta.env.VITE_CONTACT_PHONE?.replace(/\s+/g, '') || '';
  const whatsappUrl = `https://wa.me/${phone.startsWith('+') ? phone.slice(1) : phone}`;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image and Overlays */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          src={heroImage}
          alt="Ambiente Montessori"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest/90 via-forest/70 to-transparent" />

        {/* Playful Doodles */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-10 md:right-20 pointer-events-none opacity-40"
        >
          <svg width="120" height="120" viewBox="0 0 100 100" className="text-sunshine fill-current">
            <path d="M50 20 L60 40 L80 40 L65 55 L75 75 L50 65 L25 75 L35 55 L20 40 L40 40 Z" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-10 pointer-events-none opacity-30"
        >
          <svg width="150" height="100" viewBox="0 0 200 100" className="text-sky fill-current">
            <path d="M40 80 Q10 80 10 50 Q10 20 40 20 Q50 20 60 30 Q70 10 100 10 Q140 10 140 40 Q170 40 170 70 Q170 95 140 95 L40 95 Z" />
          </svg>
        </motion.div>

        {/* Organic Blobs */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-sunshine/10 blob-shape animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-leaf/20 blob-shape-alt animate-bounce-slow" />
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
            📍 {t('Cancún · Av. Huayacán')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[1.2] mb-8"
          >
            {t('Apasionados por la formación de niños')}{' '}
            <span className="inline-block px-4 py-1 rounded-3xl bg-white/80 text-forest -rotate-3 shadow-lg -translate-y-1 transform hover:rotate-0 transition-all duration-300">
              {t('autónomos')}
            </span>{' '}
            <span className="inline-block px-4 py-1 rounded-[2rem] bg-terracotta/80 text-white rotate-6 shadow-lg translate-y-2 transform hover:rotate-0 transition-all duration-300 -ml-2">
              {t('conscientes')}
            </span>{' '}
            <span className="inline-block px-4 py-1 rounded-full bg-sky bg-forest/80 -rotate-2 shadow-lg -translate-y-3 transform hover:rotate-0 transition-all duration-300 -ml-2">
              {t('seguros')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl mb-8 leading-relaxed"
          >
            {t('Educación Montessori Bilingüe en Cancún')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button variant="accent" size="lg" className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-accent/30 transition-all">
              {t('Agenda una Visita')}
            </Button>
            <motion.div
              animate={{
                x: [0, -5, 5, -5, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ x: 0, transition: { duration: 0.1 } }}
            >
              <Button
                variant="hero-outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg border-2 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {t('Informes')}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Decorative bottom curve */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px]">
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
