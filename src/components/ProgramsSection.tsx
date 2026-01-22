import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import comunidadInfantil from '@/assets/comunidad-infantil.jpg';
import casaNinos from '@/assets/casa-ninos.jpg';
import taller from '@/assets/taller.jpg';

const programs = [
  {
    title: 'Comunidad Infantil',
    age: '1.5 – 3 años',
    description: 'Enfoque en autonomía temprana y adaptación al ambiente escolar.',
    image: comunidadInfantil,
  },
  {
    title: 'Casa de Niños',
    age: '3 – 6 años',
    description: 'Bases académicas, emocionales y sociales fundamentales.',
    image: casaNinos,
  },
  {
    title: 'Taller / Elementary',
    age: '6 – 12 años',
    description: 'Pensamiento crítico, responsabilidad y liderazgo.',
    image: taller,
  },
];

export function ProgramsSection() {
  return (
    <section id="programas" className="section-padding bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Programas Educativos
          </span>
          <h2 className="heading-section text-foreground mt-2 mb-4">
            Un camino para cada etapa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ofrecemos programas diseñados específicamente para cada etapa del 
            desarrollo, respetando las necesidades únicas de cada edad.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <span className="text-accent text-sm font-medium">
                  {program.age}
                </span>
                <h3 className="font-display text-xl font-medium text-foreground mt-1 mb-3">
                  {program.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {program.description}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Descubrir Programa
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
