import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';

const metrics = [
  { value: '10+', label: 'Años de experiencia' },
  { value: '12', label: 'Alumnos por grupo' },
  { value: '100%', label: 'Guías Certificados' },
  { value: '15+', label: 'Nacionalidades' },
];

export function MetricsSection() {
  const { t } = useI18n();
  return (
    <section className="py-20 bg-forest relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-forest-light/30 blob-shape translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 blob-shape-alt -translate-x-1/3 translate-y-1/3" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-16">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <span className="font-display text-4xl md:text-5xl font-medium text-primary-foreground">
                {metric.value}
              </span>
              <p className="text-primary-foreground/80 mt-2 text-sm md:text-base">
                {t(metric.label)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
