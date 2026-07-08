import { useEffect } from 'react';
import { useCTA } from '@/hooks/use-cta';
import { useI18n } from '@/context/I18nContext';

export function CTAWidget() {
  const { locale } = useI18n();
  const { handleCTA } = useCTA();
  const ctaMode = import.meta.env.VITE_CTA_MODE || 'whatsapp';

  useEffect(() => {
    if (ctaMode !== 'widget') return;

    // Check if script is already added
    const existingScript = document.querySelector('script[aid="69ea4192bccfa50c14e2"]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = "https://asistenxa.com/widget.js";
    script.async = true;
    script.setAttribute('aid', '69ea4192bccfa50c14e2');
    document.body.appendChild(script);

    return () => {
      // Optional: Cleanup script tag if component unmounts
      // We don't remove Asistenxa container elements as they might cause issues if re-mounted,
      // but the script tag cleanup is safe.
    };
  }, [ctaMode]);

  if (ctaMode !== 'whatsapp') {
    return null;
  }

  const handleWhatsAppClick = () => {
    handleCTA('contact');
  };

  const ariaLabel = locale === 'en' ? 'Contact us via WhatsApp' : 'Contactar por WhatsApp';

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center">
      {/* Outer pulsing animation ring */}
      <span className="absolute inline-flex h-16 w-16 rounded-full bg-[#25D366]/40 animate-ping" />
      
      {/* Button */}
      <button
        onClick={handleWhatsAppClick}
        aria-label={ariaLabel}
        className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 fill-current transition-transform duration-300 group-hover:rotate-6"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.13-1.347a9.945 9.945 0 004.877 1.28c5.508 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.178-2.923-7.062A9.925 9.925 0 0012.012 2zm5.726 14.19c-.252.712-1.277 1.307-1.748 1.353-.47.045-.94.062-2.73-.654-2.29-.916-3.77-3.224-3.886-3.377-.115-.153-.94-1.233-.94-2.355 0-1.123.59-1.677.8-1.9.212-.224.471-.28.627-.28.157 0 .314.002.45.008.145.005.34-.022.525.424.19.46.65 1.572.707 1.684.057.113.094.243.019.392-.075.15-.113.243-.226.375-.113.13-.236.294-.338.394-.113.11-.233.23-.1.458.132.228.587.955 1.26 1.55.867.769 1.597 1.008 1.823 1.122.227.113.36.096.495-.06.136-.155.59-.68.747-.912.157-.23.314-.193.53-.113.216.08 1.37.636 1.605.753.236.117.393.175.45.273.057.1.057.578-.195 1.29z" />
        </svg>
      </button>
    </div>
  );
}
