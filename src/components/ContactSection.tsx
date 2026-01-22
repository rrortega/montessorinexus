import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Map } from './Map';

export function ContactSection() {
  const { t } = useI18n();
  return (
    <section id="contacto" className="section-padding bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-medium text-sm uppercase tracking-wider">
              {t('Contacto')}
            </span>
            <h2 className="heading-section text-foreground mt-2 mb-6">
              {t('¿Tienes preguntas?')}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t('Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo.')}
            </p>

            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder={t('Nombre')}
                  className="bg-background"
                />
                <Input
                  type="email"
                  placeholder={t('Email')}
                  className="bg-background"
                />
              </div>
              <Input
                type="tel"
                placeholder={t('Teléfono')}
                className="bg-background"
              />
              <Textarea
                placeholder={t('Mensaje')}
                rows={4}
                className="bg-background resize-none"
              />
              <Button variant="default" size="lg" className="w-full sm:w-auto rounded-full shadow-lg hover:shadow-primary/30 transition-all">
                {t('Enviar Mensaje')}
              </Button>
            </form>
          </motion.div>

          {/* Contact Info & Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
              <h3 className="font-display text-xl font-medium text-foreground mb-6">
                {t('Información de Contacto')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 blob-shape">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t('Ubicación')}</p>
                    <p className="text-muted-foreground text-sm">
                      {t(import.meta.env.VITE_SCHOOL_ADDRESS || 'Av. Huayacán, Cancún, Quintana Roo')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 blob-shape-alt">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t('Teléfono / WhatsApp')}</p>
                    <p className="text-muted-foreground text-sm">
                      {import.meta.env.VITE_CONTACT_PHONE || '+52 998 123 4567'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 blob-shape">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t('Email')}</p>
                    <p className="text-muted-foreground text-sm">
                      {import.meta.env.VITE_CONTACT_EMAIL || 'info@ceibamontessori.mx'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaflet Map */}
            <Map className="aspect-video rounded-2xl overflow-hidden shadow-card" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
