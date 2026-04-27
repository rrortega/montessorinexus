import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { useCTA, CTAIntent } from '@/hooks/use-cta';

interface FeaturedQuoteProps {
  quoteKey?: string;
  quoteKeys?: string[];
  authorKey?: string;
  className?: string;
  image?: string;
  ctaText?: string;
  ctaHref?: string;
  intent?: CTAIntent;
}

export function FeaturedQuote({ 
  quoteKey, 
  quoteKeys,
  authorKey, 
  className = "", 
  image, 
  ctaText, 
  ctaHref, 
  intent
}: FeaturedQuoteProps) {
  const { t } = useI18n();
  const { handleCTA } = useCTA();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (quoteKeys && quoteKeys.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % quoteKeys.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [quoteKeys]);

  const handleClick = (e: React.MouseEvent) => {
    if (intent) {
      e.preventDefault();
      handleCTA(intent);
    }
  };

  return (
    <section className={`py-12 md:py-16 bg-white relative overflow-hidden ${className}`}>
      {/* Background Image (Subtle) */}
      {image && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={image} className="w-full h-full object-cover opacity-[0.25] grayscale contrast-125" alt="Background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--terracotta)_/_0.25),transparent_85%)]" />
        </div>
      )}

      {/* Decorative background elements */}
      {!image && (
        <>
          <div className="absolute top-0 left-0 w-64 h-64 bg-forest/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-terracotta/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        </>
      )}

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        <div className="relative inline-block w-full max-w-4xl">
          <span className="text-forest/10 text-7xl md:text-9xl font-serif absolute -left-4 md:-left-12 -top-10 select-none z-0">“</span>
          
          <div className="min-h-[140px] md:min-h-[180px] flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.h3
                key={quoteKeys ? currentIndex : 'single'}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-handwriting text-3xl md:text-4xl lg:text-5xl font-medium text-forest leading-tight text-balance relative z-10"
              >
                {quoteKeys ? t(quoteKeys[currentIndex]) : (quoteKey && t(quoteKey))}
              </motion.h3>
            </AnimatePresence>
          </div>

          <span className="text-forest/10 text-7xl md:text-9xl font-serif absolute -right-4 md:-right-12 -bottom-10 select-none z-0">”</span>
        </div>

        {authorKey && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-terracotta font-medium tracking-widest uppercase text-xs md:text-sm mt-6"
          >
            — {t(authorKey)}
          </motion.p>
        )}

        {ctaText && (ctaHref || intent) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleClick}
              asChild={!!ctaHref && !intent}
              className="rounded-full px-8 py-6 text-sm shadow-xl shadow-forest/5 hover:shadow-forest/15 hover:-translate-y-0.5 transition-all font-bold"
            >
              {ctaHref && !intent ? (
                <a href={ctaHref}>{t(ctaText)}</a>
              ) : (
                t(ctaText)
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Organic Hand-drawn Bottom Border - Shifted down for subtlety */}
      <div className="absolute -bottom-3 left-0 right-0 w-full overflow-hidden leading-[0] z-20">
        <svg viewBox="0 0 1200 30" preserveAspectRatio="none" className="relative block w-full h-[30px]">
          {/* Green Line (Forest) - More subtle and sketchy */}
          <path 
            d="M-50,10 C200,5 400,15 600,10 C800,5 1000,15 1250,10" 
            fill="none" 
            stroke="hsl(var(--forest))" 
            strokeWidth="6" 
            strokeLinecap="round"
            className="opacity-60"
          />
          {/* Terracotta Line - Increased visibility */}
          <path 
            d="M-50,20 C150,25 350,15 600,20 C850,25 1050,15 1250,20" 
            fill="none" 
            stroke="hsl(var(--terracotta))" 
            strokeWidth="5" 
            strokeLinecap="round"
            className="opacity-90"
          />
        </svg>
      </div>
    </section>
  );
}
