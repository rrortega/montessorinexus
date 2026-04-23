import { useEffect } from 'react';
import { useI18n } from '@/context/I18nContext';

export function SEO() {
  const { t, locale } = useI18n();

  useEffect(() => {
    const title = t("Ceiba Montessori International | Educación Montessori en Cancún");
    const description = t("Educación Montessori Internacional en Cancún. Formamos niños independientes, conscientes y preparados para un mundo global, en un entorno natural y bilingüe. Av. Huayacán, Cancún.");
    
    document.title = title;
    
    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', t("Ceiba Montessori International | Cancún"));

    // Update OG Description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', t("Educación Montessori Internacional en Cancún. Formamos niños independientes, conscientes y preparados para un mundo global."));

    // Update OG Image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    // Using the new og-image.png from public folder
    ogImage.setAttribute('content', `${window.location.origin}/og-image.png`);

    // Update OG URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', window.location.href);

    // Update Asistenxa locale
    const updateAsistenxa = () => {
      if (typeof (window as any).Asistenxa !== 'undefined') {
        (window as any).Asistenxa.locale(locale);
      }
    };

    // Try immediately
    updateAsistenxa();

    // Also try after a short delay in case script is still initializing
    const timer = setTimeout(updateAsistenxa, 2000);

    return () => clearTimeout(timer);
  }, [t, locale]);

  return null;
}
