import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import casaNinosImage from '@/assets/casa-ninos.jpg';

const points = [
  'Respeto por el ritmo individual',
  'Desarrollo de la autonomía',
  'Educación para la vida',
  'Aprendizaje significativo y consciente',
];

export function PhilosophySection() {
  const { t } = useI18n();
  return (
    <section id="metodo" className="section-padding bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-card relative z-10">
              <img
                src={casaNinosImage}
                alt="Ambiente Montessori preparado"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent/20 blob-shape -z-0 animate-pulse" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-forest/10 blob-shape-alt -z-0" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-medium text-sm uppercase tracking-wider">
              {t('Filosofía Educativa')}
            </span>
            <h2 className="heading-section text-foreground mt-2 mb-6">
              {t('El aprendizaje nace de la curiosidad')}
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {t('En Ceiba Montessori creemos que cada niño posee un potencial único. Nuestra metodología respeta su naturaleza curiosa y le ofrece las herramientas para desarrollar su máximo potencial en un ambiente de respeto, libertad y responsabilidad.')}
            </p>

            <ul className="space-y-4 mb-8">
              {points.map((point, index) => (
                <motion.li
                  key={point}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{t(point)}</span>
                </motion.li>
              ))}
            </ul>

            <Button variant="default" size="lg" className="rounded-full px-8 overflow-hidden shadow-lg hover:shadow-primary/20 transition-all">
              {t('Nuestro Método Montessori')}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
