import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Twitter, Linkedin, Facebook } from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareBarProps {
  title: string;
  url?: string;
  variant?: 'floating' | 'inline' | 'compact';
  isSaaSBlog?: boolean;
  className?: string;
}

export const SocialShareBar: React.FC<SocialShareBarProps> = ({
  title,
  url,
  variant = 'inline',
  isSaaSBlog = false,
  className = ''
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Te recomiendo leer este artículo: ${title}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`*${title}*\nLee el artículo completo aquí:\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(title);
    const u = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${u}`, '_blank', 'noopener,noreferrer');
  };

  const shareLinkedIn = () => {
    const u = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`, '_blank', 'noopener,noreferrer');
  };

  const shareFacebook = () => {
    const u = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={shareWhatsApp}
          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
          title="Compartir en WhatsApp"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={shareTwitter}
          className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 transition-colors"
          title="Compartir en X"
          aria-label="X"
        >
          <Twitter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={shareLinkedIn}
          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
          title="Compartir en LinkedIn"
          aria-label="LinkedIn"
        >
          <Linkedin className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
          title="Copiar enlace"
          aria-label="Copiar"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white dark:bg-card border border-border shadow-xs ${className}`}>
      <span className="text-xs font-bold text-stone-900 dark:text-slate-100 flex items-center gap-1.5 mr-2 shrink-0">
        <Share2 className="w-3.5 h-3.5 text-[#C4661F]" />
        <span>Compartir artículo:</span>
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={shareWhatsApp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={shareTwitter}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Twitter className="w-3.5 h-3.5" />
          <span>X</span>
        </button>

        <button
          type="button"
          onClick={shareLinkedIn}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0077b5] hover:bg-[#006396] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Linkedin className="w-3.5 h-3.5" />
          <span>LinkedIn</span>
        </button>

        <button
          type="button"
          onClick={shareFacebook}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1877f2] hover:bg-[#0f66db] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Facebook className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Facebook</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isCopied
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-muted hover:bg-muted/80 text-stone-700 dark:text-slate-200 border-border'
          }`}
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />}
          <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
        </button>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Más opciones de compartir"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Más</span>
          </button>
        )}
      </div>
    </div>
  );
};
