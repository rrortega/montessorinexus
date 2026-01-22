import { motion } from 'framer-motion';
import { FileText, Home, MessageSquare, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: MessageSquare,
    title: 'Solicita Información',
    description: 'Contáctanos para resolver tus dudas iniciales.',
  },
  {
    icon: Home,
    title: 'Visita Guiada',
    description: 'Conoce nuestros ambientes y metodología.',
  },
  {
    icon: UserCheck,
    title: 'Entrevista Familiar',
    description: 'Conversamos sobre las necesidades de tu hijo.',
  },
  {
    icon: FileText,
    title: 'Inscripción',
    description: 'Formaliza el proceso y únete a nuestra comunidad.',
  },
];

export function AdmissionsSection() {
  return (
    <section id="admisiones" className="section-padding bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            Admisiones
          </span>
          <h2 className="heading-section text-foreground mt-2 mb-4">
            Proceso de Inscripción
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Un proceso sencillo y personalizado para que tu familia forme parte 
            de la comunidad Ceiba.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-2rem)] h-[2px] bg-border" />
              )}
              
              <div className="text-center">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-medium text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button variant="default" size="lg">
            Inicia tu Proceso de Admisión
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
