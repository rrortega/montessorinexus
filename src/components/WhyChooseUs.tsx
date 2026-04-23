import { Award, Globe, Leaf, Users } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { FadeInScroll } from './ui/fade-in-scroll';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Award,
    title: 'Directivos y Docentes certificados AMI',
    description: 'La Filosofía Montessori con Directivos y Docentes certificados AMI (Association Montessori Internationale).'
  },
  {
    icon: Globe,
    title: 'Bilingüe 100%',
    description: 'Acompañamos la intención con una educación bilingüe, viva y consciente.'
  },
  {
    icon: Leaf,
    title: 'Educación biocéntrica',
    description: 'Honramos la niñez desarrollando atención y pensamiento flexible en un entorno preparado.'
  },
  {
    icon: Users,
    title: 'Comunidad Montessori',
    description: 'Como extensión de la familia, acompañamos emociones y fortalecemos vínculos.'
  },
];

export function WhyChooseUs() {
  const { t } = useI18n();
  return (
    <section className="section-padding bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInScroll className="text-center mb-16">
          <h2 className="heading-section text-foreground mb-4">
            {t('Somos un equipo de fundadoras y expertas en colegios Montessori.')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('Acompañamos a cada niño en la construcción de su ser con una educación bilingüe, viva y consciente, basada en Montessori y en las necesidades del mundo actual.')}
          </p>
        </FadeInScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FadeInScroll 
              key={feature.title} 
              delay={index * 0.1}
              direction="up"
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                className="group bg-card rounded-3xl p-8 shadow-card hover:shadow-card-hover border border-transparent hover:border-primary/10 transition-all duration-300 h-full cursor-default"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500 blob-shape">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-medium text-foreground mb-3">
                  {t(feature.title)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(feature.description)}
                </p>
              </motion.div>
            </FadeInScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
