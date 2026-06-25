import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { FadeInScroll } from './ui/fade-in-scroll';
import { Magnetic } from './ui/magnetic';
import { useCTA } from '@/hooks/use-cta';
import { ProgramModal } from './ProgramModal';

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
  const { handleCTA } = useCTA();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="programas" className="section-padding bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInScroll className="text-center mb-16">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            {t('Programas Educativos')}
          </span>
          <h2 className="heading-section text-foreground mt-2 mb-4">
            {t('Un camino para cada etapa')}
          </h2>

          <p className="font-handwriting text-2xl md:text-3xl text-primary mt-6 tracking-wide select-none">
            “{t('Libres para pensar, capaces de transformar.')}”
          </p>
        </FadeInScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {programs.map((program, index) => (
            <FadeInScroll
              key={program.title}
              delay={index * 0.15}
              direction={index === 0 ? 'left' : 'right'}
            >
              <div className="group bg-card rounded-[2rem] overflow-hidden shadow-card hover:shadow-card-hover border border-transparent hover:border-primary/5 transition-all duration-500 h-full">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                    src={program.image}
                    alt={t(program.title)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-forest/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
                </div>
                <div className="p-8">
                  <span className="text-accent text-sm font-medium">
                    {t(program.age)}
                  </span>
                  <h3 className="font-display text-2xl font-medium text-foreground mt-1 mb-3">
                    {t(program.title)}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {t(program.description)}
                  </p>
                  <Magnetic strength={0.1}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsModalOpen(true)}
                      className="rounded-full border-2 hover:bg-forest hover:text-white transition-all px-6"
                    >
                      {t('Descubrir Programa')}
                    </Button>
                  </Magnetic>
                </div>
              </div>
            </FadeInScroll>
          ))}
        </div>
      </div>

      <ProgramModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
}
