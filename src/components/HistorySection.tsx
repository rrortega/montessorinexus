import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import raicesCeiba from '@/assets/raices-ceiba.webp';
import camaDeMalla from '@/assets/amaca-en-la-ceiba.jpeg'
import camaDeMalla2 from '@/assets/camma-malla2.jpg';

export function HistorySection() {
  const { t } = useI18n();
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    { src: camaDeMalla, alt: t('Nińos disfrutando de la cama hamaca en la Ceiba') },
    { src: camaDeMalla2, alt: t('Dos niñós disfrutando de la hamaca en la Ceiba') }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

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

          {/* Image Succession */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square rounded-[4rem] overflow-hidden shadow-card relative z-10 bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  src={images[currentImage].src}
                  alt={images[currentImage].alt}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="w-full h-full object-cover absolute inset-0"
                />
              </AnimatePresence>

              {/* Overlay gradient for dots visibility */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none" />

              {/* Dots indicator */}
              <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${currentImage === idx ? 'bg-white w-6' : 'bg-white/50 w-2 hover:bg-white/80'
                      }`}
                    aria-label={`Ver imagen ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary blob-shape -z-0 animate-bounce-slow" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-forest/10 blob-shape-alt -z-0" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
