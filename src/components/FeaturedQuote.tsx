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
  variant?: 'classic' | 'artistic';
  borderPosition?: 'top' | 'bottom' | 'both';
}

export function FeaturedQuote({ 
  quoteKey, 
  quoteKeys,
  authorKey, 
  className = "", 
  image, 
  ctaText, 
  ctaHref, 
  intent,
  variant = 'classic',
  borderPosition = 'bottom'
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

  if (variant === 'classic') {
    return (
      <section className={`py-20 md:py-32 bg-forest relative overflow-hidden ${className}`}>
        {/* Background blobs for classic - Adjusted for green background */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-terracotta/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Image Column */}
            {image && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2 flex justify-center lg:justify-end"
              >
                <div className="relative group">
                  <div className="absolute -inset-4 bg-white/5 rounded-2xl rotate-3 transition-transform group-hover:rotate-6 duration-500" />
                  <img 
                    src={image} 
                    alt="Featured" 
                    className="relative w-full max-w-md h-[500px] object-cover rounded-2xl shadow-2xl z-10"
                  />
                </div>
              </motion.div>
            )}

            {/* Content Column */}
            <div className={`w-full ${image ? 'lg:w-1/2' : 'max-w-4xl mx-auto text-center'}`}>
              <div className="relative">
                <span className="text-white/10 text-8xl font-serif absolute -left-8 -top-12 select-none z-0">“</span>
                
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight text-balance relative z-10"
                >
                  {quoteKeys ? t(quoteKeys[currentIndex]) : (quoteKey && t(quoteKey))}
                </motion.h3>

                <span className="text-white/10 text-8xl font-serif absolute -right-8 -bottom-12 select-none z-0">”</span>
              </div>

              {authorKey && (
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-terracotta-light font-medium tracking-widest uppercase text-xs md:text-sm mt-8"
                >
                  — {t(authorKey)}
                </motion.p>
              )}

              {ctaText && (ctaHref || intent) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="mt-12"
                >
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    onClick={handleClick}
                    asChild={!!ctaHref && !intent}
                    className="w-full sm:w-auto rounded-full px-6 sm:px-10 py-3.5 sm:py-5 text-sm sm:text-base shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-1 transition-all font-bold bg-white text-forest hover:bg-white/90 text-center justify-center"
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
          </div>
        </div>

        {/* Solid Double Border for Classic - Inverted for dark background */}
        <div className="absolute bottom-0 left-0 right-0 w-full flex flex-col z-20">
          <div className="w-full h-1 bg-white opacity-10" />
          <div className="w-full h-[12px] bg-forest-light" />
          <div className="w-full h-[6px] bg-terracotta" />
        </div>
      </section>
    );
  }

  return (
    <section className={`py-12 md:py-16 bg-forest/[0.03] border-y border-forest/10 relative overflow-hidden ${className}`}>
      {/* Background Image (Subtle) for artistic variant */}
      {image && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={image} className="w-full h-full object-cover opacity-[0.2] grayscale contrast-125" alt="Background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--terracotta)_/_0.15),transparent_85%)]" />
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
                “{quoteKeys ? t(quoteKeys[currentIndex]) : (quoteKey && t(quoteKey))}”
              </motion.h3>
            </AnimatePresence>
          </div>

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
    </section>
  );
}
