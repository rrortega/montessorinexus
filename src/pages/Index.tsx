import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { PhilosophySection } from '@/components/PhilosophySection';
import { MetricsSection } from '@/components/MetricsSection';
import { HistorySection } from '@/components/HistorySection';
import { ProgramsSection } from '@/components/ProgramsSection';
import { AdmissionsSection } from '@/components/AdmissionsSection';
import { GallerySection } from '@/components/GallerySection';
import { GuidesSection } from '@/components/GuidesSection';
import { ContactSection } from '@/components/ContactSection';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';
import { FeaturedQuote } from '@/components/FeaturedQuote';
import { SEO } from '@/components/SEO';
import tallerImg from '@/assets/taller-old.jpg';

import mariaCharcoal from '@/assets/maria-charcoal.png';

const Index = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 50, stiffness: 300 });
  const springY = useSpring(mouseY, { damping: 50, stiffness: 300 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen overflow-x-clip selection:bg-primary/30">
      <SEO />
      {/* Global Mouse Follower (Subtle) */}
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-primary/20 pointer-events-none z-[9999] hidden lg:block"
      />

      <Header />
      <main>
        <HeroSection />
        <WhyChooseUs />

        <PhilosophySection />



        <FeaturedQuote
          quoteKeys={[
            "Sigue al niño.",
            "Libera el potencial del niño y lo transformarás en el mundo.",
            "Ayúdame a hacerlo por mí mismo.",
            "El niño es la esperanza y la promesa para la humanidad."
          ]}
          authorKey="Maria Montessori"
          image={mariaCharcoal}
          ctaText="Conoce Nuestro Método"
          variant="artistic"
          borderPosition="both"
        />
        <HistorySection />

        <MetricsSection />
        <ProgramsSection />
        <AdmissionsSection />
        <GallerySection />
        <GuidesSection />
        <ContactSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
