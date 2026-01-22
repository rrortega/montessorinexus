import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import ceibaTree from '@/assets/ceiba-tree.jpg';

export function HistorySection() {
  const { t } = useI18n();
  return (
    <section id="comunidad" className="section-padding bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-medium text-sm uppercase tracking-wider">
              {t('Nuestra Historia')}
            </span>
            <h2 className="heading-section text-foreground mt-2 mb-6">
              {t('Crecer con raíces fuertes')}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t('La Ceiba, árbol sagrado de la cultura maya, representa la conexión entre el cielo, la tierra y el inframundo. Sus raíces profundas y su copa majestuosa simbolizan el crecimiento equilibrado que buscamos para cada niño.')}
            </p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t('Inspirados en esta poderosa metáfora, Ceiba Montessori International nace en Cancún con la visión de ofrecer una educación que nutra las raíces emocionales, sociales e intelectuales de los niños, preparándolos para florecer en un mundo global.')}
            </p>
            <p className="text-foreground font-medium">
              {t('Una visión local con enfoque internacional.')}
            </p>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square rounded-[4rem] overflow-hidden shadow-card relative z-10">
              <img
                src={ceibaTree}
                alt={t('Árbol Ceiba - símbolo de crecimiento')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary blob-shape -z-0 animate-bounce-slow" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-forest/10 blob-shape-alt -z-0" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
