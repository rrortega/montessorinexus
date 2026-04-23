import { Facebook, Instagram, Mail } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import logoLetras from '@/assets/ceiba-letras.svg';

const quickLinks = [
  { label: 'Nuestro Método', href: '#metodo' },
  { label: 'Programas', href: '#programas' },
  { label: 'Admisiones', href: '#admisiones' },
  { label: 'Contacto', href: '#contacto' },
];

const socialLinks = [
  ...(import.meta.env.VITE_SOCIAL_FACEBOOK ? [{ icon: Facebook, href: import.meta.env.VITE_SOCIAL_FACEBOOK, label: 'Facebook' }] : []),
  ...(import.meta.env.VITE_SOCIAL_INSTAGRAM ? [{ icon: Instagram, href: import.meta.env.VITE_SOCIAL_INSTAGRAM, label: 'Instagram' }] : []),
  ...(import.meta.env.VITE_CONTACT_EMAIL ? [{ icon: Mail, href: `mailto:${import.meta.env.VITE_CONTACT_EMAIL}`, label: 'Email' }] : []),
];

export function Footer() {
  const { t } = useI18n();
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
            <div className="flex gap-3 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-12 h-12 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-all blob-shape hover:-rotate-12"
                >
                  <social.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
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
