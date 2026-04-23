import { useCallback } from 'react';
import { useI18n } from '@/context/I18nContext';

export type CTAIntent = 
  | 'visit' 
  | 'info' 
  | 'method' 
  | 'program' 
  | 'admission' 
  | 'contact';

export function useCTA() {
  const { locale } = useI18n();
  const ctaMode = import.meta.env.VITE_CTA_MODE || 'whatsapp';
  const phone = import.meta.env.VITE_CONTACT_PHONE?.replace(/\s+/g, '') || '';
  
  const getMessage = useCallback((intent: CTAIntent, extra?: string) => {
    const isEn = locale === 'en';
    
    switch (intent) {
      case 'visit':
        return isEn 
          ? "Hello! I am very interested in Ceiba Montessori and would like to schedule a visit to see the campus and learn about your educational project."
          : "¡Hola! Me interesa mucho Ceiba Montessori y me gustaría agendar una visita para conocer sus instalaciones y proyecto educativo.";
      case 'info':
      case 'contact':
        return isEn
          ? "Hello! I would like to receive more information about Ceiba Montessori and the services you offer."
          : "¡Hola! Me gustaría recibir más información sobre Ceiba Montessori y los servicios que ofrecen.";
      case 'method':
        return isEn
          ? "Hello! I am interested in learning more about your teaching method and Montessori philosophy."
          : "¡Hola! Estoy interesado en conocer más detalles sobre su método de enseñanza y filosofía Montessori.";
      case 'program':
        return isEn
          ? `Hello! I would like to get more information about the ${extra || 'educational'} program.`
          : `¡Hola! Me gustaría obtener más información sobre el programa de ${extra || 'enseñanza'}.`;
      case 'admission':
        return isEn
          ? "Hello! I would like to know the steps to start the admission process at Ceiba Montessori."
          : "¡Hola! Quisiera saber cuáles son los pasos para iniciar el proceso de admisión en Ceiba Montessori.";
      default:
        return "";
    }
  }, [locale]);

  const handleCTA = useCallback((intent: CTAIntent, extra?: string) => {
    const message = getMessage(intent, extra);
    
    if (ctaMode === 'widget' && (window as any).Asistenxa) {
      (window as any).Asistenxa.open({ start_message: message });
    } else {
      // Default to WhatsApp
      const cleanPhone = phone.startsWith('+') ? phone.slice(1) : phone;
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  }, [ctaMode, getMessage, phone]);

  return { handleCTA };
}
