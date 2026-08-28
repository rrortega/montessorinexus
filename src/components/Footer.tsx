import { Facebook, Instagram, Youtube, Linkedin, Mail } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { useSiteSettings, SocialLink } from '@/context/SettingsContext';
import logoLetras from '@/assets/ceiba-letras.svg';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 1 1-2.896-2.896c.156 0 .308.016.457.045V9.347a6.34 6.34 0 0 0-.457-.016 6.341 6.341 0 1 0 6.341 6.341V8.98a8.214 8.214 0 0 0 4.77 1.526V7.06a4.78 4.78 0 0 1-1.000-.374z"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const renderSocialIcon = (type: SocialLink['type']) => {
  switch (type) {
    case 'facebook':
      return <Facebook className="w-5 h-5" />;
    case 'instagram':
      return <Instagram className="w-5 h-5" />;
    case 'youtube':
      return <Youtube className="w-5 h-5" />;
    case 'tiktok':
      return <TikTokIcon className="w-5 h-5" />;
    case 'x':
      return <XIcon className="w-5 h-5" />;
    case 'linkedin':
      return <Linkedin className="w-5 h-5" />;
    case 'email':
      return <Mail className="w-5 h-5" />;
  }
};

const quickLinks = [
  { label: 'Nuestro Método', href: '#metodo' },
  { label: 'Programas', href: '#programas' },
  { label: 'Admisiones', href: '#admisiones' },
  { label: 'Contacto', href: '#contacto' },
];

export function Footer() {
  const { t } = useI18n();
  const { socialLinks } = useSiteSettings();

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <a href="#" className="flex items-center mb-6">
              <img
                src={logoLetras}
                alt="Ceiba Montessori"
                className="h-8 w-auto brightness-0 invert"
              />
            </a>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              {t('Educación Montessori Internacional en Cancún. Formando niños independientes y conscientes desde 2014.')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">
              {t('Enlaces Rápidos')}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {t(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">
              {t('Síguenos')}
            </h4>

            {socialLinks.length === 0 ? (
              <p className="text-primary-foreground/50 text-xs italic mb-6">
                No hay redes sociales configuradas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5 mb-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="w-10 h-10 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/20 text-white flex items-center justify-center transition-all hover:scale-110"
                  >
                    {renderSocialIcon(social.type)}
                  </a>
                ))}
              </div>
            )}

            <p className="text-primary-foreground/70 text-sm">
              {import.meta.env.VITE_SCHOOL_ADDRESS || 'Av. Huayacán, Cancún, Quintana Roo'}
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} Ceiba Montessori International. {t('Todos los derechos reservados.')}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-primary-foreground/40 font-bold tracking-[0.15em] uppercase">
            <a href="https://chamba.pro" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground/80 transition-colors">
              Powered by ChambaPRO S.A.P.I de C.V
            </a>
            <span className="hidden sm:block opacity-20 h-3 w-px bg-white/50" />
            <a href="https://asistenxa.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground/80 transition-colors">
              Potenciado por Asistenxa.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
