import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Building2,
  HelpCircle,
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';
import { School } from '@/lib/sqlite';
import { toast } from 'sonner';

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School | null;
  onPaymentSuccess?: () => void;
}

export const SubscriptionUpgradeModal: React.FC<SubscriptionUpgradeModalProps> = ({
  isOpen,
  onClose,
  school
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  if (!isOpen || !school) return null;

  const envCount = (school as any)?._count?.environments || (school as any)?.stats?.environmentsCount || 1;
  const studentCount = (school as any)?._count?.students || (school as any)?.stats?.studentsCount || 0;

  // Pricing calculation
  const basePrice = 14;
  const envPrice = envCount * 0; // included in core
  const totalPriceMonthly = basePrice;
  const totalPriceAnnual = Math.round(totalPriceMonthly * 12 * 0.85); // 15% discount

  return (
    <div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#162218] rounded-3xl border border-stone-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest dark:text-emerald-400 flex items-center justify-center mx-auto border border-forest/15 shadow-2xs">
            <Sparkles className="w-6 h-6 text-forest dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Activa la Membresía de {school.name}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Continúa disfrutando de todas las herramientas pedagógicas, asistencia en vivo, seguimiento de progreso y módulos avanzados.
          </p>
        </div>

        {/* Cycle Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
            }`}
          >
            Pago Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
            }`}
          >
            <span>Pago Anual</span>
            <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full font-extrabold">
              15% OFF
            </span>
          </button>
        </div>

        {/* Plan Card */}
        <div className="p-6 rounded-3xl border-2 border-forest bg-gradient-to-b from-forest/5 to-transparent relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest/15 pb-4">
            <div>
              <span className="text-[10.5px] font-bold text-forest dark:text-emerald-400 uppercase tracking-wider block">
                Plan Montessori Nexus School OS
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Suscripción Institucional Completa
              </h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-display font-bold text-forest dark:text-emerald-400">
                ${billingCycle === 'monthly' ? totalPriceMonthly : totalPriceAnnual}
              </span>
              <span className="text-xs text-muted-foreground font-sans block">
                USD / {billingCycle === 'monthly' ? 'mes' : 'año'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
              <span>Ambientes configurados: <strong>{envCount} ambientes</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
              <span>Matrícula de alumnos: <strong>{studentCount} alumnos</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
              <span>Seguimiento pedagógico & Diario Montessori</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
              <span>Control de asistencia diaria & Presentismo</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
              <span>Almacenamiento y expedientes seguros</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
              <span>Soporte técnico preferencial & Actualizaciones</span>
            </div>
          </div>
        </div>

        {/* Contact / Payment CTA */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <HelpCircle className="w-4 h-4 text-forest shrink-0" />
            <span>¿Requieres asistencia o pago mediante transferencia bancaria?</span>
          </div>
          <a
            href="mailto:soporte@montessorinexus.com?subject=Suscripcion%20Colegio%20Roble"
            className="text-forest hover:underline font-bold shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Contactar Soporte</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <a
            href="mailto:soporte@montessorinexus.com?subject=Activar%20Plan%20Colegio"
            onClick={() => {
              toast.info('Redirigiendo a pasarela de pago y soporte...');
              onClose();
            }}
            className="py-2.5 px-6 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Proceder al Pago con Tarjeta / SPEI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
