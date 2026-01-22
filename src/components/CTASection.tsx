import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';

export function CTASection() {
  const { t } = useI18n();
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-forest-light/20 blob-shape -translate-x-1/3 -translate-y-1/3 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-accent/10 blob-shape-alt translate-x-1/4 translate-y-1/4 animate-bounce-slow" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium text-primary-foreground mb-6 leading-tight">
            {t('Siembra hoy las raíces del futuro de tu hijo')}
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            {t('Únete a una comunidad que valora el desarrollo integral, el respeto por la individualidad y la conexión con la naturaleza.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" className="rounded-full px-10 py-7 text-lg shadow-xl hover:shadow-accent/40 transition-all">
              {t('Agenda una Visita')}
            </Button>
            <Button variant="hero-outline" size="lg" className="rounded-full px-10 py-7 text-lg border-2 hover:bg-white/10 transition-all">
              {t('Contáctanos')}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
