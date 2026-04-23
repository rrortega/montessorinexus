import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Send, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Map } from './Map';
import { toast } from 'sonner';

const ctaMode = import.meta.env.VITE_CTA_MODE;

function openAsistenxaWithLead(data: { name: string; email: string; phone: string; message: string }, locale: string) {
  try {
    const asistenxa = (window as any).Asistenxa;
    if (!asistenxa || typeof asistenxa.open !== 'function') return;

    const startMessage = locale === 'en'
      ? `Hello! I just filled out the contact form. My name is ${data.name} and I would like to receive more information.`
      : `¡Hola! Acabo de completar el formulario de contacto. Mi nombre es ${data.name} y me gustaría recibir más información.`;

    asistenxa.open({
      data: {
        full_name: data.name,
        email: data.email,
        phone: data.phone,
      },
      start_message: startMessage,
    });
  } catch (err) {
    console.warn('[Asistenxa] Could not open widget after form submit:', err);
  }
}

export function ContactSection() {
  const { t, locale } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const endpoint = import.meta.env.VITE_CONTACT_EMAIL_ENDPOINT;
    
    if (!endpoint) {
      toast.error(t('Configuración incompleta: Endpoint de contacto no definido.'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al enviar el mensaje');

      toast.success(t('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.'));

      // When in widget mode, hand off the lead to Asistenxa chat
      if (ctaMode === 'widget') {
        openAsistenxaWithLead(formData, locale);
      }

      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error(t('Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('Nombre')}
                  className="bg-background"
                  required
                />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('Email')}
                  className="bg-background"
                  required
                />
              </div>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('Teléfono')}
                className="bg-background"
                required
              />
              <Textarea
                id="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t('Mensaje')}
                rows={4}
                className="bg-background resize-none"
                required
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                variant="default" 
                size="lg" 
                className="w-full sm:w-auto rounded-full shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('Enviando...')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('Enviar Mensaje')}
                  </>
                )}
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
