import React, { useState, useEffect } from 'react';
import { 
  AppWindow, 
  ExternalLink, 
  Sparkles, 
  PlayCircle, 
  Smartphone, 
  Globe, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getApplications, ApplicationItem } from '@/lib/sqlite';
import { useI18n } from '@/context/I18nContext';
import docsHeroImage from '@/assets/ceiba-docs-hero.png';

export const PublicApplicationsSection: React.FC = () => {
  const { locale } = useI18n();
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getApplications();
        setApps(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getActionIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('video') || l.includes('tutorial') || l.includes('youtube')) {
      return <PlayCircle className="w-4 h-4 text-red-500" />;
    }
    if (l.includes('app') || l.includes('descargar') || l.includes('download') || l.includes('instalar')) {
      return <Smartphone className="w-4 h-4 text-emerald-600" />;
    }
    return <Globe className="w-4 h-4 text-forest" />;
  };

  return (
    <div className="bg-[#f7f4ed] min-h-screen font-body text-foreground pb-0 flex flex-col justify-between">
      
      {/* Hero Header Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        
        {/* Floating Animated Decorative Assets */}
        <motion.img
          src="/star-blue.png"
          alt="Estrella fugaz"
          className="absolute top-1 left-2 sm:left-8 w-32 sm:w-44 md:w-52 h-auto pointer-events-none z-10 opacity-90 drop-shadow-sm"
          animate={{ y: [0, -10, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.img
          src="/planeta.png"
          alt="Planeta flotante"
          className="absolute -bottom-4 right-4 sm:right-10 w-24 sm:w-32 h-auto pointer-events-none z-20 opacity-90 drop-shadow-md"
          animate={{ y: [0, 10, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-4">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-forest leading-tight">
                {locale === 'en' ? (
                  <>
                    School Applications & <br />
                    <span className="text-[#a38060]">Parent Resources</span>
                  </>
                ) : (
                  <>
                    Aplicativos y <br />
                    Recursos Digitales para <br />
                    <span className="text-[#a38060]">Padres de Familia</span>
                  </>
                )}
              </h1>

              <div className="space-y-1 text-sm sm:text-base text-forest/80 max-w-xl leading-relaxed">
                <p className="font-bold text-forest">
                  {locale === 'en' ? 'Official tools for the Ceiba community.' : 'Herramientas oficiales para la comunidad Ceiba.'}
                </p>
                <p className="text-[#8c6b4e] font-medium text-xs sm:text-sm">
                  {locale === 'en'
                    ? 'Here you will find access links, video tutorials, and mobile apps recommended by the school for payments, attendance, and student tracking.'
                    : 'En este portal encontrarán los enlaces de acceso, video tutoriales y aplicaciones móviles recomendadas por el colegio para pagos, seguimiento y comunicados.'}
                </p>
              </div>
            </div>

            {/* Right Hero Image Frame */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white max-w-md w-full aspect-[4/3] bg-white">
                <img
                  src={docsHeroImage}
                  alt="Aplicativos y tecnología Montessori Ceiba"
                  className="w-full h-full object-cover rounded-[2.25rem] transform hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Section: CEIBA APPS Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-16 sm:mb-24 md:mb-32">
        
        {/* Section Header */}
        <div className="text-center mb-10 max-w-2xl mx-auto space-y-3">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest tracking-wider uppercase">
            CEIBA APPS & RECURSOS
          </h2>
          <div className="w-16 h-1 bg-terracotta mx-auto rounded-full" />
          <p className="text-xs sm:text-sm text-forest/80 leading-relaxed font-medium pt-1">
            {locale === 'en'
              ? 'Official applications and digital tools for parents to stay up to date, track tuition status, and follow all school activities.'
              : 'Aplicaciones y recursos digitales que los padres de familia deben utilizar para mantenerse al día, dar seguimiento a las colegiaturas de sus hijos y consultar las actividades de la comunidad escolar.'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {locale === 'en' ? 'Loading applications...' : 'Cargando aplicativos...'}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-16 bg-white/70 rounded-3xl border border-forest/10 shadow-xs text-muted-foreground text-sm max-w-xl mx-auto">
            {locale === 'en' ? 'No applications registered at this moment.' : 'No hay aplicativos registrados en este momento.'}
          </div>
        ) : (
          <div className="space-y-6 w-full">
            {apps.map((app) => {
              const displayTitle = locale === 'en' && app.title_en ? app.title_en : app.title;
              const displayDesc = locale === 'en' && app.description_en ? app.description_en : app.description;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-forest/10 hover:border-forest/30 transition-all group hover:shadow-md w-full flex flex-col md:flex-row gap-6 md:gap-8 items-stretch"
                >
                  {/* Left Side: Large Logo / Image Container */}
                  <div className="w-full md:w-56 lg:w-64 shrink-0 bg-cream/70 rounded-2xl border border-forest/10 p-4 sm:p-6 flex items-center justify-center min-h-[160px] md:min-h-full">
                    {app.icon_url ? (
                      <img
                        src={app.icon_url}
                        alt={displayTitle}
                        className="w-full max-h-40 md:max-h-48 object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-forest/40">
                        <AppWindow className="w-16 h-16" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-forest/50">App Logo</span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Title, Description, and Action Buttons */}
                  <div className="flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] text-terracotta font-semibold uppercase tracking-wider block mb-1">
                          {locale === 'en' ? 'Official Resource' : 'Recurso Oficial'}
                        </span>
                        <h3 className="font-display font-bold text-forest text-2xl sm:text-3xl leading-snug">
                          {displayTitle}
                        </h3>
                      </div>

                      {displayDesc && (
                        <p className="text-xs sm:text-sm text-forest/80 leading-relaxed">
                          {displayDesc}
                        </p>
                      )}
                    </div>

                    {/* Actions / Links */}
                    <div className="pt-4 border-t border-forest/10 space-y-3">
                      <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
                        {locale === 'en' ? 'Available Actions & Portals' : 'Acciones y Enlaces Disponibles'}
                      </span>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                        {app.links.map((link) => {
                          const linkText = locale === 'en' && link.label_en ? link.label_en : link.label;
                          return (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-forest hover:bg-forest/90 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center sm:justify-start gap-2.5 group/btn"
                            >
                              {getActionIcon(linkText)}
                              <span>{linkText}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover/btn:translate-x-0.5 transition-transform shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* Full Width Footer Banner with Horizontal Repeat & Flush Bottom */}
      <div 
        className="w-full h-20 sm:h-28 md:h-32 bg-repeat-x bg-bottom mt-auto pointer-events-none -mb-1" 
        style={{ 
          backgroundImage: "url('/footer-ceiba.png')", 
          backgroundSize: "auto 100%" 
        }} 
      />

    </div>
  );
};

export default PublicApplicationsSection;
