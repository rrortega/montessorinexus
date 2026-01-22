import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail } from 'lucide-react';

export function ContactSection() {
  return (
    <section id="contacto" className="section-padding bg-secondary">
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
              Contacto
            </span>
            <h2 className="heading-section text-foreground mt-2 mb-6">
              ¿Tienes preguntas?
            </h2>
            <p className="text-muted-foreground mb-8">
              Estamos aquí para ayudarte. Completa el formulario y nos 
              pondremos en contacto contigo.
            </p>

            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Nombre"
                  className="bg-background"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  className="bg-background"
                />
              </div>
              <Input
                type="tel"
                placeholder="Teléfono"
                className="bg-background"
              />
              <Textarea
                placeholder="Mensaje"
                rows={4}
                className="bg-background resize-none"
              />
              <Button variant="default" className="w-full sm:w-auto">
                Enviar Mensaje
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
                Información de Contacto
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Ubicación</p>
                    <p className="text-muted-foreground text-sm">
                      Av. Huayacán, Cancún, Quintana Roo
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Teléfono / WhatsApp</p>
                    <p className="text-muted-foreground text-sm">
                      +52 998 XXX XXXX
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-muted-foreground text-sm">
                      info@ceibamontessori.mx
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="aspect-video rounded-2xl overflow-hidden shadow-card bg-muted">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29824.943959711824!2d-86.87706795!3d21.1318776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f4c2dbc83ce5a91%3A0x1b6ac1e15983a830!2sAv.%20Huayac%C3%A1n%2C%20Canc%C3%BAn%2C%20Q.R.!5e0!3m2!1ses!2smx!4v1700000000000!5m2!1ses!2smx"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Ceiba Montessori"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
