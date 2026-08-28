import { Award, Globe, Leaf, Users } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { FadeInScroll } from './ui/fade-in-scroll';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Award,
    text: 'La Filosofía Montessori con Directivos y Docentes certificados AMI'
  },
  {
    icon: Globe,
    text: 'Comunidad bilingüe donde el inglés se vive naturalmente.'
  },
  {
    icon: Leaf,
    text: 'Aprendizaje activo y experiencial. Enfoque en autonomía, responsabilidad, respeto al niño y autonomía emocional.'
  },
  {
    icon: Users,
    text: 'Preparación para la vida social, emocional, académica y profesional.'
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
            {t('Ofrecemos una educación que respeta el ritmo natural del niño a través de:')}
          </p>
        </FadeInScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FadeInScroll
              key={feature.text || index}
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
                <p className="font-display text-lg font-medium text-foreground/90 leading-relaxed">
                  {t(feature.text)}
                </p>
              </motion.div>
            </FadeInScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
