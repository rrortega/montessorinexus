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
import tallerImg from '@/assets/taller-old.jpg';

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main>
        <HeroSection />
        <WhyChooseUs />
        <FeaturedQuote
          quoteKey="Libres para pensar, capaces de transformar."
          image={tallerImg}
          ctaText="Conoce Nuestro Método"
          ctaHref="#metodo"
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
