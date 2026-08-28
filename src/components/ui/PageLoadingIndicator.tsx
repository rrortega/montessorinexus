import React from 'react';
import { Sparkles } from 'lucide-react';

export const PageLoadingIndicator: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden select-none z-50">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center gap-4 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xl border border-emerald-400/30 animate-pulse">
            <Sparkles className="w-7 h-7 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="absolute -inset-1 rounded-2xl border border-emerald-500/30 animate-ping pointer-events-none opacity-25" />
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-1">
          <span className="font-display font-bold text-sm tracking-tight text-white block">
            Montessori<span className="text-emerald-400">Nexus</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide">
            Cargando configuración institucional...
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageLoadingIndicator;
