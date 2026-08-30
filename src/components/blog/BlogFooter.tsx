import React from 'react';
import { Link } from 'react-router-dom';
import { MontessoriNexusLogo } from '@/components/MontessoriNexusLogo';

interface BlogFooterProps {
  isSaaSBlog?: boolean;
  schoolName?: string;
  schoolSlug?: string | null;
}

export const BlogFooter: React.FC<BlogFooterProps> = ({
  isSaaSBlog = true,
  schoolName = 'MontessoriNexus',
  schoolSlug = null
}) => {
  return (
    <footer className="pt-14 pb-0 text-xs border-t overflow-hidden bg-[#121c13] text-stone-400 border-[#243226]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-left">
        {/* Col 1: Brand & Tagline */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MontessoriNexusLogo size={32} />
            <span className="text-base font-serif font-bold text-white">MontessoriNexus</span>
          </div>
          <p className="text-stone-400 leading-relaxed text-[11px]">
            {isSaaSBlog
              ? 'Plataforma integral de gestión pedagógica y administrativa para colegios y ambientes Montessori.'
              : `Espacio de divulgación pedagógica y noticias oficiales de ${schoolName}, impulsado por MontessoriNexus.`}
          </p>
        </div>

        {/* Col 2: Plataforma / Recursos */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-white text-sm mb-2">Plataforma</h4>
          <p>
            <a href="/#modulos" className="hover:text-[#C4661F] transition-colors">
              Módulos Pedagógicos
            </a>
          </p>
          <p>
            <a href="/#ia-etica" className="hover:text-[#C4661F] transition-colors">
              IA Ética Montessori
            </a>
          </p>
          <p>
            <Link to="/blog" className="hover:text-[#C4661F] transition-colors">
              Blog & Artículos
            </Link>
          </p>
          <p>
            <a href="/#faq" className="hover:text-[#C4661F] transition-colors">
              Preguntas Frecuentes
            </a>
          </p>
        </div>

        {/* Col 3: Colegios & Comunidad */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-white text-sm mb-2">Colegios</h4>
          <p>
            <Link to="/admin" className="hover:text-[#C4661F] transition-colors">
              Acceso a la Plataforma
            </Link>
          </p>
          {schoolSlug && (
            <p>
              <Link to={`/colegio/${schoolSlug}`} className="hover:text-[#C4661F] transition-colors">
                Portal de {schoolName}
              </Link>
            </p>
          )}
          <p>
            <a href="/#metodologia" className="hover:text-[#C4661F] transition-colors">
              Acompañamiento a Guías
            </a>
          </p>
        </div>

        {/* Col 4: Contacto */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-white text-sm mb-2">Contacto</h4>
          <p className="text-stone-300">soporte@montessorinexus.com</p>
          <p className="text-stone-300">+52 998 350 2849</p>
          <p className="text-stone-400">Cancún, Quintana Roo • México</p>
        </div>
      </div>

      {/* Copyright & Legal & ChambaPro Credits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#243226]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <div className="space-y-1 text-center sm:text-left">
          <p>© {new Date().getFullYear()} MontessoriNexus. Todos los derechos reservados.</p>
          <p className="text-stone-500">
            Un producto de <span className="font-semibold text-stone-300">CHAMBAPRO SAPI DE CV</span> •{' '}
            <a
              href="https://chamba.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C4661F] hover:underline font-medium"
            >
              chamba.pro
            </a>
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/privacidad" className="hover:text-[#C4661F] transition-colors">
            Privacidad
          </Link>
          <Link to="/terminos" className="hover:text-[#C4661F] transition-colors">
            Términos de Servicio
          </Link>
        </div>
      </div>

      {/* BIGFOOTER BRAND SIGNATURE (FULL-WIDTH 100% & BOTTOM-BLEED CROPPED) */}
      <div className="w-full overflow-hidden pt-10 pb-0 select-none relative">
        <div className="w-full text-center relative flex justify-center items-end px-3 sm:px-6">
          <div className="inline-flex justify-center items-end flex-nowrap tracking-tight sm:tracking-tighter font-serif font-black text-[9.5vw] sm:text-[9.8vw] md:text-[10vw] lg:text-[10.2vw] xl:text-[136px] leading-[0.72] select-none translate-y-3 sm:translate-y-5">
            {'MontessoriNexus'.split('').map((char, index) => (
              <span
                key={index}
                className="inline-block transition-colors duration-200 cursor-pointer text-white/25 hover:text-[#FFA05C] hover:drop-shadow-[0_0_35px_rgba(196,102,31,0.95)]"
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BlogFooter;
