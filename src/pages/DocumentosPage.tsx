import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import PublicDocumentsSection from '@/components/PublicDocumentsSection';
import { SEO } from '@/components/SEO';

import { useSiteSettings } from '@/context/SettingsContext';

export const DocumentosPage: React.FC = () => {
  const { schoolName } = useSiteSettings();
  const displayName = schoolName || 'Escuela Montessori';

  return (
    <div className="min-h-screen bg-cream flex flex-col font-body">
      <SEO 
        title={`Documentos y Descargas | ${displayName}`}
        description={`Descarga manuales, formularios de inscripción y documentos oficiales de la ${displayName}.`}
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
