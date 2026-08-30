import React, { useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DevToolsNoticePage: React.FC = () => {
  const navigate = useNavigate();

  const handleReturn = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // 1. When window regains focus (user closed DevTools or switched back)
    const handleFocus = () => {
      // Small debounce to allow DOM stabilization
      setTimeout(handleReturn, 300);
    };

    // 2. When user presses any key (Escape, Enter, etc.) or clicks anywhere
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleReturn();
      }
    };

    const handleClick = () => {
      handleReturn();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    // 3. Periodic fallback check to automatically return once devtools closed
    const timer = setTimeout(() => {
      handleReturn();
    }, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
      clearTimeout(timer);
    };
  }, [handleReturn]);

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0c140e] text-stone-900 dark:text-stone-100 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#162218] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C4661F] via-[#DE7424] to-[#FFA05C]" />

        {/* Shield Icon Badge */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#C4661F]/10 dark:bg-[#C4661F]/20 text-[#C4661F] dark:text-[#FFA05C] flex items-center justify-center border border-[#C4661F]/20 shadow-inner">
          <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        {/* Heading & Notice Message */}
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            Restricted Access
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-slate-100">
            Developer Tools Prohibited
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            Browser developer tools and inspection consoles have been restricted on MontessoriNexus.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200/80 dark:border-stone-800 text-left space-y-2 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2 font-semibold text-stone-700 dark:text-stone-200">
            <AlertTriangle className="w-4 h-4 text-[#C4661F]" />
            Intellectual Property Protection
          </div>
          <p>
            Editorial content, signed photographic assets, and pedagogical materials are strictly protected against unauthorized extraction and inspection.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2.5">
          <Button 
            onClick={handleReturn}
            className="w-full h-11 bg-[#C4661F] hover:bg-[#a85215] text-white font-medium rounded-xl shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Article
          </Button>

          <p className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center justify-center gap-1.5 pt-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Closing developer tools will automatically restore your reading session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevToolsNoticePage;
