import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import PublicApplicationsSection from '@/components/PublicApplicationsSection';
import { SEO } from '@/components/SEO';

export const AplicativosPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream flex flex-col font-body">
      <SEO 
        title="Aplicativos y Recursos Escolares | Ceiba Montessori"
        description="Plataformas oficiales, guías de pago y aplicaciones móviles recomendadas por Ceiba Montessori."
      />
      <Header forceScrolled={true} />
      <main className="flex-1 pt-24 sm:pt-32">
        <PublicApplicationsSection />
      </main>
      <Footer />
    </div>
  );
};

export default AplicativosPage;
