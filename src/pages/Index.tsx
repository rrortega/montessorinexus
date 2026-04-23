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
    <div className="min-h-screen overflow-x-hidden selection:bg-primary/30">
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
        <FeaturedQuote
          quoteKey="Libres para pensar, capaces de transformar."
          image={tallerImg}
          ctaText="Conoce Nuestro Método"
          intent="method"
        />
        <PhilosophySection />
        <MetricsSection />
        <FeaturedQuote
          quoteKey="Creciendo con propósito, liderando con empatía."
          className="bg-terracotta"
          curveVariant={4}
        />
        <HistorySection />
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
