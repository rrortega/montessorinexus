import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Receipt, 
  Tag, 
  Plus, 
  Check, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Edit2,
  ShieldCheck,
  Zap,
  RotateCcw,
  FileText
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { 
  StudentItem, 
  FeeInstallmentItem, 
  getStudentInstallments, 
  recordInstallmentPayment,
  cancelInstallmentPayment,
  updateInstallment,
  toggleInstallmentLateFeeWaiver
} from '@/lib/sqlite';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';

interface InstallmentsManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentItem | null;
  onPaymentRecorded?: () => void;
  readOnly?: boolean;
}

export const InstallmentsManagerDrawer: React.FC<InstallmentsManagerDrawerProps> = ({
  isOpen,
  onClose,
  student,
  onPaymentRecorded,
  readOnly = false
}) => {
  const confirm = useConfirm();
  const [installments, setInstallments] = useState<FeeInstallmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Payment Recording Modal State inside Drawer
  const [selectedInstallment, setSelectedInstallment] = useState<FeeInstallmentItem | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('TRANSFER');
  const [payReference, setPayReference] = useState('');
  const [payReceiptUrl, setPayReceiptUrl] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      loadInstallments();
    }
  }, [isOpen, student]);

  const loadInstallments = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const list = await getStudentInstallments(student.id);
      setInstallments(list);
    } catch (e: any) {
      console.error(e);
      toast.error('Error al cargar cuotas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayModal = (inst: FeeInstallmentItem) => {
    setSelectedInstallment(inst);
    const effectiveTotal = inst.isLateFeeApplied ? inst.netAmount + (inst.lateFeeAmount || 0) : inst.netAmount;
    setPayAmount(effectiveTotal - (inst.paidAmount || 0));
    setPayMethod('TRANSFER');
    setPayReference(inst.paymentReference || '');
    setPayReceiptUrl(inst.receiptUrl || '');
    setPayNotes('');
    setPayModalOpen(true);
  };

  const handleToggleWaiver = async (inst: FeeInstallmentItem) => {
    const isWaived = inst.isLateFeeWaived;
    const quotaLabel = inst.conceptName ? `Cuota "${inst.conceptName}"` : 'esta cuota';
    const lateFeeStr = inst.lateFeeAmount ? `$${inst.lateFeeAmount.toLocaleString('es-MX')}` : 'el recargo';

    if (!isWaived) {
      // Intending to WAIVE (condonar)
      const ok = await confirm({
        title: '¿Condonar Recargo por Mora?',
        message: `Al condonar el recargo de ${quotaLabel} para ${student?.full_name}, el saldo pendiente se reducirá automáticamente excluyendo los +${lateFeeStr} (${inst.lateFeePct || 10}% de mora).\n\nEsto le otorgará una excepción/crédito especial al tutor para que pueda liquidar únicamente el importe base neto sin penalización.`,
        confirmText: 'Sí, condonar recargo',
        cancelText: 'Cancelar',
        variant: 'info'
      });
      if (!ok) return;
    } else {
      // Intending to REACTIVATE
      const ok = await confirm({
        title: '¿Reactivar Recargo por Mora?',
        message: `Se volverá a aplicar la penalización por mora (+${inst.lateFeePct || 10}% = +${lateFeeStr}) sobre ${quotaLabel} de ${student?.full_name}.\n\nEl tutor verá reflejado de nuevo el recargo por retraso de pago en su estado de cuenta del portal escolar.`,
        confirmText: 'Sí, reactivar recargo',
        cancelText: 'Cancelar',
        variant: 'danger'
      });
      if (!ok) return;
    }

    try {
      await toggleInstallmentLateFeeWaiver(inst.id);
      toast.success(inst.isLateFeeWaived ? 'Recargo reactivado' : 'Recargo condonado / crédito otorgado');
      loadInstallments();
      if (onPaymentRecorded) onPaymentRecorded();
    } catch (e: any) {
      toast.error('Error al modificar recargo');
    }
  };

  const handleCancelPayment = async (inst: FeeInstallmentItem) => {
    const quotaLabel = inst.conceptName ? `"${inst.conceptName}"` : 'esta cuota';
    const paidAmountStr = inst.paidAmount ? `$${inst.paidAmount.toLocaleString('es-MX')}` : 'el pago';

    const ok = await confirm({
      title: '¿Anular Registro de Pago?',
      message: `¿Estás seguro de que deseas anular el pago de ${paidAmountStr} registrado para ${quotaLabel} (${student?.full_name})?\n\nLa cuota volverá a estado Pendiente (o Vencida si ya pasó su fecha límite) y se actualizará automáticamente el saldo en el portal del tutor.`,
      confirmText: 'Sí, anular pago',
      cancelText: 'Conservar pago',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await cancelInstallmentPayment(inst.id);
      toast.success('Registro de pago anulado correctamente');
      loadInstallments();
      if (onPaymentRecorded) onPaymentRecorded();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al anular pago');
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;

    setSavingPayment(true);
    try {
      await recordInstallmentPayment(selectedInstallment.id, {
        paidAmount: Number(payAmount),
        paymentMethod: payMethod,
        paymentReference: payReference.trim(),
        receiptUrl: payReceiptUrl.trim(),
        notes: payNotes.trim(),
        markAsPaid: true
      });

      toast.success('Pago registrado exitosamente');
      setPayModalOpen(false);
      loadInstallments();
      if (onPaymentRecorded) onPaymentRecorded();
    } catch (e: any) {
      console.error(e);
      toast.error('Error al registrar pago');
    } finally {
      setSavingPayment(false);
    }
  };

  if (!isOpen || !student) return null;

  const totalCharged = installments.reduce((s, i) => s + (i.effectiveTotal || i.netAmount), 0);
  const totalPaid = installments.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.paidAmount || i.netAmount), 0);
  const totalPending = Math.max(0, totalCharged - totalPaid);

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      icon={
        payModalOpen ? (
          <Receipt className="w-5 h-5 text-forest" />
        ) : student.avatar_url ? (
          <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <span className="font-bold text-forest text-base font-display">{student.full_name.charAt(0)}</span>
        )
      }
      title={
        payModalOpen 
          ? `Registrar Pago • ${selectedInstallment?.conceptName || 'Cuota'}`
          : `Calendario de Cuotas & Pagos • ${student.full_name}`
      }
      description={
        payModalOpen
          ? `Ingresa el importe recibido, método y comprobante para ${student.full_name}.`
          : 'Seguimiento de cortes, fechas límites, recargos por mora y condonaciones.'
      }
      footerClassName={payModalOpen ? 'flex' : 'hidden sm:flex'}
      footer={
        payModalOpen ? (
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={() => setPayModalOpen(false)}
              className="w-full py-3 rounded-xl border border-forest/20 font-bold text-forest hover:bg-forest/5 text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a Cuotas</span>
            </button>
            <button
              type="submit"
              form="mobile-pay-installment-form"
              disabled={savingPayment}
              className="w-full py-3 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold shadow-xs flex items-center justify-center gap-1.5 text-xs transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{savingPayment ? 'Guardando...' : 'Confirmar Pago'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {installments.length} cuotas programadas
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-cream hover:bg-cream/80 text-forest border border-forest/20 rounded-xl text-xs font-bold transition-colors"
            >
              Cerrar
            </button>
          </div>
        )
      }
    >
      <div className="space-y-6">

        {/* MOBILE WIZARD: PAYMENT FORM STEP */}
        {payModalOpen && selectedInstallment && (
          <div className="sm:hidden space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="p-4 rounded-2xl bg-cream/40 border border-forest/10 space-y-2">
              <span className="text-[10px] uppercase font-bold text-forest/70 block">Concepto a Liquidar</span>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-forest font-bold text-base font-display">{selectedInstallment.conceptName}</strong>
                <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {selectedInstallment.status === 'PAID' ? 'Liquidado' : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-forest/10 text-muted-foreground">
                <span>Fecha Límite: {new Date(selectedInstallment.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <strong className="text-forest font-bold font-mono text-sm">
                  ${(selectedInstallment.isLateFeeApplied ? selectedInstallment.netAmount + (selectedInstallment.lateFeeAmount || 0) : selectedInstallment.netAmount).toLocaleString('es-MX')}
                </strong>
              </div>
            </div>

            <form id="mobile-pay-installment-form" onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-forest font-bold mb-1">Monto Recibido (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-forest/20 font-mono font-bold text-forest text-base focus:outline-none bg-white shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-forest font-bold mb-1">Método de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-3 rounded-xl border border-forest/20 bg-white font-medium text-forest text-sm focus:outline-none shadow-2xs"
                >
                  <option value="TRANSFER">Transferencia Bancaria (SPEI)</option>
                  <option value="CASH">Efectivo en Caja / Recepción</option>
                  <option value="CARD">Tarjeta de Débito / Crédito</option>
                  <option value="MERCADOPAGO">Mercado Pago / Enlace</option>
                  <option value="STRIPE">Stripe Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-forest font-bold mb-1">Folio / Referencia</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="Ej. SPEI-849202, Recibo 0042..."
                  className="w-full p-3 rounded-xl border border-forest/20 font-mono text-forest text-sm focus:outline-none bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-forest font-bold mb-1.5">
                  Comprobante / Recibo de Pago (Opcional)
                </label>
                <ImageUploadDropzone
                  currentImageUrl={payReceiptUrl}
                  onImageUploaded={(url) => setPayReceiptUrl(url)}
                  folder="receipts"
                  label="Subir foto del comprobante o captura de transferencia"
                />
              </div>

              <div>
                <label className="block text-forest font-bold mb-1">Notas Administrativas</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  className="w-full p-3 rounded-xl border border-forest/20 text-forest text-sm focus:outline-none resize-none bg-white shadow-2xs"
                />
              </div>
            </form>
          </div>
        )}

        {/* REGULAR LIST VIEW (Visible on mobile if NOT paying, and always on desktop) */}
        <div className={`space-y-6 animate-in fade-in slide-in-from-left-4 duration-200 ${payModalOpen ? 'hidden sm:block' : 'block'}`}>
          {/* Financial Summary Top Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-cream/40 border border-forest/10 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Programado</span>
              <strong className="text-forest text-lg font-bold font-mono block mt-0.5">
                ${totalCharged.toLocaleString('es-MX')}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Pagado</span>
              <strong className="text-emerald-900 text-lg font-bold font-mono block mt-0.5">
                ${totalPaid.toLocaleString('es-MX')}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Saldo Pendiente</span>
              <strong className="text-amber-950 text-lg font-bold font-mono block mt-0.5">
                ${totalPending.toLocaleString('es-MX')}
              </strong>
            </div>
          </div>

          {/* Installments List */}
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              Cargando cuotas programadas...
            </div>
          ) : installments.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-forest/10 space-y-2">
              <CreditCard className="w-10 h-10 text-forest/30 mx-auto" />
              <h4 className="font-bold text-forest text-sm">No hay plan de pagos generado para este estudiante</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Asigna o genera un plan personalizado para crear las cuotas del ciclo escolar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {installments.map((inst) => {
                const isPaid = inst.status === 'PAID';
                const dueDate = new Date(inst.dueDate);
                const isOverdue = !isPaid && dueDate < new Date();
                const cutDate = inst.invoiceCutDate ? new Date(inst.invoiceCutDate) : null;
                
                const dueDateFormatted = dueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
                const cutDateFormatted = cutDate ? cutDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : null;

                const hasLateFee = inst.isLateFeeApplied;
                const isWaived = inst.isLateFeeWaived;
                const displayAmount = hasLateFee ? (inst.netAmount + (inst.lateFeeAmount || 0)) : inst.netAmount;

                return (
                  <div 
                    key={inst.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPaid 
                        ? 'bg-emerald-50/40 border-emerald-200/70' 
                        : isOverdue 
                          ? 'bg-red-50/40 border-red-200' 
                          : 'bg-white border-forest/10 shadow-2xs hover:border-forest/20'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-forest text-sm font-display">
                          {inst.conceptName}
                        </h5>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isPaid 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                            : isOverdue 
                              ? 'bg-red-100 text-red-900 border border-red-300' 
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          ) : isOverdue ? (
                            <AlertTriangle className="w-3 h-3 text-red-700" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-700" />
                          )}
                          <span>{isPaid ? 'Pagado' : isOverdue ? 'Vencido' : 'Pendiente'}</span>
                        </span>

                        {/* Late fee badge or waiver pill */}
                        {hasLateFee && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-red-600" />
                            <span>+${inst.lateFeeAmount?.toLocaleString('es-MX')} ({inst.lateFeePct}% mora)</span>
                          </span>
                        )}

                        {isOverdue && isWaived && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Crédito / Sin recargo</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {cutDateFormatted && (
                          <span>Corte: <strong className="text-forest/80">{cutDateFormatted}</strong></span>
                        )}
                        <span>Límite: <strong className="text-forest/90">{dueDateFormatted}</strong></span>
                        
                        {inst.paidAt && (
                          <span className="text-emerald-700 font-semibold">
                            Pagado el {new Date(inst.paidAt).toLocaleDateString('es-MX')} ({inst.paymentMethod})
                          </span>
                        )}
                      </div>

                      {inst.paymentReference && (
                        <div className="text-[11px] font-mono text-muted-foreground">
                          Ref: {inst.paymentReference}
                        </div>
                      )}
                    </div>

                    {/* Right side Amount and Actions */}
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                          {isPaid ? 'Monto Pagado' : 'Monto a Pagar'}
                        </span>
                        <strong className={`text-base font-bold font-mono block ${isPaid ? 'text-emerald-700' : isOverdue ? 'text-red-600' : 'text-forest'}`}>
                          ${displayAmount.toLocaleString('es-MX')}
                        </strong>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {!isPaid && !readOnly ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(inst)}
                            className="px-3.5 py-1.5 rounded-xl bg-forest hover:bg-forest/90 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-amber-300" />
                            <span>Registrar Pago</span>
                          </button>
                        ) : isPaid ? (
                          <div className="flex items-center gap-1">
                            {inst.receiptUrl && (
                              <a
                                href={inst.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                title="Ver Comprobante de Pago"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleCancelPayment(inst)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Anular Registro de Pago"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : null}

                        {/* Late Fee Waiver Button (If overdue or active) */}
                        {isOverdue && !readOnly && (
                          <button
                            type="button"
                            onClick={() => handleToggleWaiver(inst)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isWaived 
                                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                                : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                            }`}
                            title={isWaived ? 'Reactivar Recargo por Mora' : 'Condonar Recargo por Mora (Crédito Especial)'}
                          >
                            {isWaived ? <Zap className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DESKTOP-ONLY MODAL / DIALOG TO RECORD PAYMENT */}
        {payModalOpen && selectedInstallment && (
          <div className="hidden sm:flex fixed inset-0 bg-black/50 z-60 items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-forest/10 space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-forest/10 pb-3">
                <h4 className="font-bold text-forest text-base font-display">
                  Registrar Pago de Cuota
                </h4>
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="text-muted-foreground hover:text-forest"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Concepto:</span>
                  <strong className="text-forest text-sm">{selectedInstallment.conceptName}</strong>
                </div>

                <div>
                  <label className="block text-forest font-bold mb-1">Monto Recibido (MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-forest/20 font-mono font-bold text-forest focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-forest font-bold mb-1">Método de Pago</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 bg-white font-medium text-forest focus:outline-none"
                  >
                    <option value="TRANSFER">Transferencia Bancaria (SPEI)</option>
                    <option value="CASH">Efectivo en Caja / Recepción</option>
                    <option value="CARD">Tarjeta de Débito / Crédito</option>
                    <option value="MERCADOPAGO">Mercado Pago / Enlace</option>
                    <option value="STRIPE">Stripe Portal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-forest font-bold mb-1">Folio / Referencia de Transferencia</label>
                  <input
                    type="text"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    placeholder="Ej. SPEI-849202, Recibo 0042..."
                    className="w-full p-2.5 rounded-xl border border-forest/20 font-mono text-forest focus:outline-none"
                  />
                </div>

                {/* Comprobante / Recibo de Pago */}
                <div>
                  <label className="block text-forest font-bold mb-1.5">
                    Comprobante / Recibo de Pago (Opcional)
                  </label>
                  <ImageUploadDropzone
                    currentImageUrl={payReceiptUrl}
                    onImageUploaded={(url) => setPayReceiptUrl(url)}
                    folder="receipts"
                    label="Subir foto del comprobante o captura de transferencia"
                  />
                </div>

                <div>
                  <label className="block text-forest font-bold mb-1">Notas Administrativas</label>
                  <textarea
                    rows={2}
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Observaciones adicionales..."
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-forest/20 font-bold text-forest hover:bg-forest/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="px-5 py-2 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingPayment ? 'Guardando...' : 'Confirmar Pago'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </SlideOverDrawer>
  );
};

export default InstallmentsManagerDrawer;
