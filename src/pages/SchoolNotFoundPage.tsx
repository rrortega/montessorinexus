import React from 'react';
import {
  Globe,
  Sparkles,
  ArrowRight,
  School,
  BrainCircuit,
  Users,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  LayoutDashboard
} from 'lucide-react';

interface SchoolNotFoundPageProps {
  attemptedHost?: string;
  onOpenCreateSchool?: () => void;
}

export const SchoolNotFoundPage: React.FC<SchoolNotFoundPageProps> = ({
  attemptedHost = typeof window !== 'undefined' ? window.location.hostname : 'este-colegio.montessorinexus.com',
  onOpenCreateSchool
}) => {
  const isSubdomain = attemptedHost.includes('montessorinexus.com') || attemptedHost.includes('localhost');
  const cleanSub = attemptedHost.split('.')[0];

  const handleRegisterClick = () => {
    if (onOpenCreateSchool) {
      onOpenCreateSchool();
    } else {
      window.location.href = '/panel';
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md border border-emerald-400/30">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Montessori<span className="text-emerald-400">Nexus</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              AI-Powered Montessori OS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/panel"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all"
          >
            Acceso al Sistema
          </a>
          <button
            type="button"
            onClick={handleRegisterClick}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Dar de Alta Colegio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Center Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center text-center z-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Status Pills */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-300">
            {attemptedHost}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-bold text-amber-400">No Registrado</span>
        </div>

        {/* 404 Headline */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Este colegio aún no está registrado en la red
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
            La dirección <span className="font-mono text-emerald-400 font-semibold px-1.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60">{attemptedHost}</span> está disponible para ser vinculada al sistema oficial de gestión de tu institución.
          </p>
        </div>

        {/* Primary Call to Action Box */}
        <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5 text-left">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">¿Sos el director o fundador del colegio?</h3>
              <p className="text-xs text-slate-400">Comenzá a utilizar MontessoriNexus en menos de 2 minutos.</p>
            </div>
          </div>

          {/* Value props */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sitio web institucional con subdominio propio y certificado SSL</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Inteligencia Artificial para reportes pedagógicos y guías Montessori</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Portal para familias, seguimiento de infantes, admisiones y cobranza</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleRegisterClick}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Dar de Alta mi Colegio en MontessoriNexus.com</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Grid Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-4">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-left space-y-1.5">
            <BrainCircuit className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-xs text-white">IA Pedagógica</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Generá análisis evolutivos y notas de observación alineadas a María Montessori.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-left space-y-1.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-xs text-white">Comunidad y Salones</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Gestión de Comunidad Infantil, Casa de Niños, Taller y guías con salones asignados.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-left space-y-1.5">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h4 className="font-bold text-xs text-white">Multitenant Seguro</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bases de datos aisladas, roles de acceso granular y encriptación de datos.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="h-14 px-6 sm:px-12 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500 z-10">
        <span>© 2026 MontessoriNexus.com • Todos los derechos reservados.</span>
        <div className="flex items-center gap-4 text-[11px]">
          <a href="/panel" className="hover:text-slate-300 transition-colors">Iniciar Sesión</a>
          <span>•</span>
          <span className="text-slate-600">Plataforma de Gestión para Colegios Montessori</span>
        </div>
      </footer>

    </div>
  );
};

export default SchoolNotFoundPage;
