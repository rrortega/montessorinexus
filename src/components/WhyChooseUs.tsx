import { motion } from 'framer-motion';
import { Award, Globe, Leaf, Users } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

const features = [
  {
    icon: Award,
    title: 'Método Montessori Auténtico',
    description: 'Filosofía educativa aplicada con fidelidad a los principios de Maria Montessori.'
  },
  {
    icon: Globe,
    title: 'Enfoque Bilingüe e Internacional',
    description: 'Inmersión en inglés y español con perspectiva global y multicultural.'
  },
  {
    icon: Leaf,
    title: 'Ambientes Naturales y Preparados',
    description: 'Espacios diseñados para fomentar la exploración y el aprendizaje autónomo.'
  },
  {
    icon: Users,
    title: 'Guías Certificados',
    description: 'Profesionales formados internacionalmente en pedagogía Montessori.'
  },
];

export function WhyChooseUs() {
  const { t } = useI18n();
  return (
    <section className="section-padding bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading-section text-foreground mb-4">
            {t('¿Por qué elegir Ceiba?')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('Nuestra propuesta educativa combina lo mejor de la pedagogía Montessori con un enfoque internacional adaptado al contexto de Cancún.')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group bg-card rounded-3xl p-8 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-all blob-shape">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-medium text-foreground mb-3">
                {t(feature.title)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(feature.description)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
