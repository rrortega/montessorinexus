import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { useCTA, CTAIntent } from '@/hooks/use-cta';

interface FeaturedQuoteProps {
  quoteKey: string;
  authorKey?: string;
  className?: string;
  image?: string;
  ctaText?: string;
  ctaHref?: string;
  intent?: CTAIntent;
  curveVariant?: 0 | 1 | 2 | 3 | 4;
}

const curves = {
  1: "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C1.35,31.7,249.36,69.83,321.39,56.44Z",
  2: "M1200,0H0V120H281.94C572.9,116.24,602.45,3.86,902.61,3.86,1041.52,3.86,1130.68,14.65,1200,52.47Z",
  3: "M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z",
  4: "M0,120H1200V0C800,60,400,60,0,0V120Z"
};

export function FeaturedQuote({ quoteKey, authorKey, className = "", image, ctaText, ctaHref, intent, curveVariant = 0 }: FeaturedQuoteProps) {
  const { t } = useI18n();
  const { handleCTA } = useCTA();
  const selectedCurve = curveVariant !== 0 ? curves[curveVariant] : null;

  const handleClick = (e: React.MouseEvent) => {
    if (intent) {
      e.preventDefault();
      handleCTA(intent);
    }
  };

  return (
    <section className={`py-12 md:py-16 lg:py-20 bg-forest relative overflow-hidden ${className}`}>
      {/* Optional Background Image */}
      {image && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={image} className="w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="Quote Context" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/90 via-forest/80 to-forest/95" />
        </div>
      )}

      {/* Decorative background elements */}
      {!image && (
        <>
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        </>
      )}

      <div className="container mx-auto px-4 relative z-10 text-center flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl flex flex-col items-center"
        >
          <div className="relative inline-block max-w-3xl mt-4">
            <h3 className="relative z-10 font-display text-2xl md:text-3xl lg:text-4xl font-medium text-white leading-snug mb-2 text-balance px-6 md:px-8 pb-10">
              <span className="text-accent/60 text-6xl md:text-8xl font-serif absolute  -left-4 md:-left-12 select-none z-0">“</span>
              {t(quoteKey)}
              <span className="text-accent/60 text-6xl md:text-8xl font-serif absolute   -right-2 md:-right-8 select-none z-0">”</span>
            </h3>
          </div>

          {authorKey && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-accent font-medium tracking-widest uppercase text-sm mt-4"
            >
              — {t(authorKey)}
            </motion.p>
          )}

          {ctaText && (ctaHref || intent) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Button 
                variant="accent" 
                size="lg" 
                onClick={handleClick}
                asChild={!!ctaHref && !intent}
                className="rounded-full px-8 py-6 text-[15px] sm:text-lg shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all font-bold"
              >
                {ctaHref && !intent ? (
                  <a href={ctaHref}>{t(ctaText)}</a>
                ) : (
                  t(ctaText)
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Decorative bottom curve - conditionally rendered */}
      {selectedCurve && (
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[2px]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[90px] text-background fill-current">
            <path d={selectedCurve} />
          </svg>
        </div>
      )}
    </section>
  );
}
