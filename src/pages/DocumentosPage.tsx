import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import PublicDocumentsSection from '@/components/PublicDocumentsSection';
import { SEO } from '@/components/SEO';

export const DocumentosPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream flex flex-col font-body">
      <SEO 
        title="Documentos y Descargas | Ceiba Montessori"
        description="Descarga manuales, formularios de inscripción y documentos oficiales de la escuela Ceiba Montessori."
      />
      <Header forceScrolled={true} />
      <main className="flex-1 pt-24 sm:pt-32">
        <PublicDocumentsSection />
      </main>
      <Footer />
    </div>
  );
};

export default DocumentosPage;
