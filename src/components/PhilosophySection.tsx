import { motion, useTransform } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { FadeInScroll } from './ui/fade-in-scroll';
import { Magnetic } from './ui/magnetic';
import { useMouseParallax } from '@/hooks/use-mouse-parallax';
import casaNinosImage from '@/assets/salon.jpeg';
import { useCTA } from '@/hooks/use-cta';

const points = [
  'Respeto por el ritmo individual',
  'Desarrollo de la autonomía',
  'Educación para la vida',
  'Aprendizaje significativo y consciente',
];

export function PhilosophySection() {
  const { t } = useI18n();
  const { handleCTA } = useCTA();
  const { x: mouseX, y: mouseY } = useMouseParallax(15);

  return (
    <section id="metodo" className="section-padding bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <FadeInScroll direction="left">
              <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-card relative z-10">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                  src={casaNinosImage}
                  alt="Ambiente Montessori preparado"
                  className="w-full h-full object-cover"
                />
              </div>
            </FadeInScroll>
            <motion.div
              style={{ x: useTransform(mouseX, (v) => v * 1.2), y: useTransform(mouseY, (v) => v * 1.2) }}
              className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent/20 blob-shape -z-0 animate-pulse"
            />
            <motion.div
              style={{ x: useTransform(mouseX, (v) => -v * 0.8), y: useTransform(mouseY, (v) => -v * 0.8) }}
              className="absolute -top-10 -left-10 w-32 h-32 bg-forest/10 blob-shape-alt -z-0"
            />
          </div>

          {/* Content */}
          <div className="space-y-6">
            <FadeInScroll direction="right">
              <span className="text-accent font-medium text-sm uppercase tracking-wider">
                {t('Acompañamos la intención, guiando su dirección.')}
              </span>
              <h2 className="heading-section text-foreground mt-2 mb-6 text-2xl md:text-3xl">
                {t('Aspiramos a que cada niño crezca como un ser autónomo, consciente y comprometido con su comunidad y el planeta.')}
              </h2>
              <div className="space-y-4 text-muted-foreground mb-8 leading-relaxed text-balance">
                <p>
                  {t('En Ceiba, como extensión de la familia, acompañamos emociones y fortalecemos vínculos.')}
                </p>
                <p>
                  {t('Construimos una comunidad para caminar con seguridad y contribuir a un futuro más justo, sostenible y humano.')}
                </p>
              </div>
            </FadeInScroll>

            <ul className="space-y-4 mb-8">
              {points.map((point, index) => (
                <FadeInScroll
                  key={point}
                  delay={index * 0.1}
                  direction="right"
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{t(point)}</span>
                </FadeInScroll>
              ))}
            </ul>

            <FadeInScroll delay={0.4} direction="up">
              <Magnetic strength={0.15}>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => handleCTA('method')}
                  className="rounded-full px-8 overflow-hidden shadow-lg hover:shadow-primary/20 transition-all"
                >
                  {t('Nuestro Método Montessori')}
                </Button>
              </Magnetic>
            </FadeInScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
