import React from 'react';
import { AlertTriangle, Lock, CreditCard, X, ShieldAlert, ArrowRight } from 'lucide-react';

interface TrialExpiredBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle?: string;
  onConfigurePlan?: () => void;
}

export const TrialExpiredBlockedModal: React.FC<TrialExpiredBlockedModalProps> = ({
  isOpen,
  onClose,
  actionTitle = 'Esta acción',
  onConfigurePlan
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#162218] rounded-3xl border border-amber-300 dark:border-amber-900/50 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 animate-in zoom-in-95 duration-200 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
          <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
            Modo Solo Lectura • Prueba Finalizada
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
            Período de Pruebas Concluido
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {actionTitle} no puede completarse porque el período de prueba gratuita de 3 meses de este colegio ha finalizado.
          </p>
        </div>

        {/* Details Box */}
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-left text-xs text-amber-950 dark:text-amber-200 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Estado actual de la cuenta:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-muted-foreground dark:text-slate-300">
            <li>Puedes consultar y revisar todo el historial pedagógico y registros anteriores.</li>
            <li>Para registrar nuevos seguimientos, tomar asistencia, crear ambientes o matricular alumnos, se requiere activar un plan de membresía.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Entendido, seguir explorando
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onConfigurePlan) onConfigurePlan();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Configurar Plan de Pagos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
