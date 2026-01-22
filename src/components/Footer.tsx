import { Facebook, Instagram, Mail } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

const quickLinks = [
  { label: 'Nuestro Método', href: '#metodo' },
  { label: 'Programas', href: '#programas' },
  { label: 'Admisiones', href: '#admisiones' },
  { label: 'Contacto', href: '#contacto' },
];

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Mail, href: 'mailto:info@ceibamontessori.mx', label: 'Email' },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <a href="#" className="flex items-center gap-3 mb-4">
              <img
                src={logoIcon}
                alt="Ceiba Montessori"
                className="h-12 w-auto brightness-0 invert"
              />
              <div>
                <span className="font-display text-xl font-semibold">
                  Ceiba
                </span>
                <span className="font-display text-sm block opacity-80 -mt-1">
                  Montessori International
                </span>
              </div>
            </a>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Educación Montessori Internacional en Cancún. 
              Formando niños independientes y conscientes desde 2014.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">
              Síguenos
            </h4>
            <div className="flex gap-3 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Av. Huayacán, Cancún<br />
              Quintana Roo, México
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} Ceiba Montessori International. 
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
