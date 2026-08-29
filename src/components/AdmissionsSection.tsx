import { motion } from 'framer-motion';
import { FileText, Home, MessageSquare, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { useCTA } from '@/hooks/use-cta';


const steps = [
  {
    icon: MessageSquare,
    title: 'Solicita Información',
    description: 'Contáctanos para resolver tus dudas iniciales.'
  },
  {
    icon: Home,
    title: 'Visita Guiada',
    description: 'Conoce nuestros ambientes y metodología.'
  },
  {
    icon: UserCheck,
    title: 'Entrevista Familiar',
    description: 'Conversamos sobre las necesidades de tu hijo.'
  },
  {
    icon: FileText,
    title: 'Inscripción',
    description: 'Formaliza el proceso y únete a nuestra comunidad.'
  },
];

export function AdmissionsSection() {
  const { t } = useI18n();
  const { handleCTA } = useCTA();
  return (
    <section id="admisiones" className="section-padding bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            {t('Admisiones')}
          </span>
          <h2 className="heading-section text-foreground mt-2 mb-4">
            {t('Proceso de Inscripción')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('Un proceso sencillo y personalizado para que tu familia forme parte de la comunidad Ceiba.')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+2.5rem)] w-[calc(100%-3rem)] h-[3px] border-t-2 border-dashed border-forest/20" />
              )}

              <div className="text-center group">
                <div className="relative inline-flex mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-forest/10 flex items-center justify-center blob-shape group-hover:bg-forest/20 transition-all duration-300">
                    <step.icon className="w-8 h-8 text-forest" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-medium text-foreground mb-2">
                  {t(step.title)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t(step.description)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button 
            variant="default" 
            size="lg" 
            onClick={() => handleCTA('admission')}
            className="w-full sm:w-auto rounded-full px-6 sm:px-10 py-3.5 sm:py-5 text-base sm:text-lg shadow-xl hover:shadow-primary/30 transition-all text-center justify-center"
          >
            {t('Inicia tu Proceso de Admisión')}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
