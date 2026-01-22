import { motion } from 'framer-motion';

const metrics = [
  { value: '10+', label: 'Años de experiencia' },
  { value: '12', label: 'Alumnos por grupo' },
  { value: '100%', label: 'Guías certificados' },
  { value: '15+', label: 'Nacionalidades' },
];

export function MetricsSection() {
  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
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
                {metric.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
