import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import comunidadInfantil from '@/assets/comunidad-infantil.jpg';
import casaNinos from '@/assets/casa-ninos.jpg';
import taller1 from '@/assets/taller-1.jpeg';
import taller2 from '@/assets/taller-2.jpeg';

const programs = [
  {
    title: 'Taller 1',
    age: '6 – 9 años',
    description: 'Enfoque educativo centrado en la actividad dirigida por el alumno para desarrollar habilidades cognitivas y motoras de manera científica y efectiva.',
    image: taller1
  },
  {
    title: 'Taller 2',
    age: '9 – 12 años',
    description: 'Consolidación del aprendizaje autónomo, desarrollo de la mente razonadora y pensamiento abstracto para explorar el mundo.',
    image: taller2
  }
];

export function ProgramsSection() {
  const { t } = useI18n();
  return (
    <section id="programas" className="section-padding bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            {t('Programas Educativos')}
          </span>
          <h2 className="heading-section text-foreground mt-2 mb-4">
            {t('Un camino para cada etapa')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('Ofrecemos programas diseñados específicamente para cada etapa del desarrollo, respetando las necesidades únicas de cada edad.')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {programs.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group bg-card rounded-[2rem] overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={program.image}
                  alt={t(program.title)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-forest/20 group-hover:bg-transparent transition-colors duration-500" />
              </div>
              <div className="p-6">
                <span className="text-accent text-sm font-medium">
                  {t(program.age)}
                </span>
                <h3 className="font-display text-xl font-medium text-foreground mt-1 mb-3">
                  {t(program.title)}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t(program.description)}
                </p>
                <Button variant="outline" size="sm" className="w-full rounded-full border-2 hover:bg-forest hover:text-white transition-all">
                  {t('Descubrir Programa')}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
