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

import { useSiteSettings } from '@/context/SettingsContext';
import { WebSectionItem, DEFAULT_PAGE_SECTIONS } from '@/pages/admin/web-builder/SectionsManagerTab';

const Index = () => {
  const { settings } = useSiteSettings();
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

  // Parse dynamic section order from settings
  const sections: WebSectionItem[] = (() => {
    if (settings?.page_sections_order) {
      try {
        const parsed = JSON.parse(settings.page_sections_order);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_PAGE_SECTIONS;
  })();

  const renderSectionByType = (section: WebSectionItem) => {
    switch (section.type) {
      case 'split_media_benefits':
        return <WhyChooseUs key={section.id} />;
      case 'pillars_mosaic':
        return <PhilosophySection key={section.id} />;
      case 'feature_list_media':
      case 'feature_cards_row':
        return <WhyChooseUs key={section.id} />;
      case 'quote_banner_artistic':
        return (
          <FeaturedQuote
            key={section.id}
            quoteKeys={[
              section.title || "Sigue al niño.",
              "Libera el potencial del niño y lo transformarás en el mundo.",
              "Ayúdame a hacerlo por mí mismo.",
              "El niño es la esperanza y la promesa para la humanidad."
            ]}
            authorKey={section.subtitle || "Maria Montessori"}
            image={mariaCharcoal}
            ctaText={section.ctaText || "Conoce Nuestro Método"}
            variant="artistic"
            borderPosition="both"
          />
        );
      case 'story_split_slider':
        return <HistorySection key={section.id} />;
      case 'metrics_stats_banner':
        return <MetricsSection key={section.id} />;
      case 'programs_showcase':
      case 'program_levels_cards':
        return <ProgramsSection key={section.id} />;
      case 'timeline_steps':
        return <AdmissionsSection key={section.id} />;
      case 'gallery_masonry_tabs':
        return <GallerySection key={section.id} />;
      case 'teachers_team':
        return <GuidesSection key={section.id} />;
      case 'location_map_cta':
      case 'quick_contact_form':
        return <ContactSection key={section.id} />;
      case 'cta_banner_contrast':
        return <CTASection key={section.id} />;
      default:
        return null;
    }
  };

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
        
        {/* DYNAMIC SECTIONS RENDERED IN CONFIGURED ORDER */}
        {sections
          .filter(sec => sec.isEnabled !== false)
          .map((section) => renderSectionByType(section))}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
