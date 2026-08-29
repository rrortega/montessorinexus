import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  DollarSign, 
  Receipt, 
  Copy, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  Building2, 
  ShieldCheck,
  GraduationCap,
  MessageCircle,
  Phone,
  Lock,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import { 
  getTutorAccountStatement, 
  TutorAccountStatementResponse, 
  TutorStudentStatement 
} from '@/lib/sqlite';
import { toast } from 'sonner';

export const TutorFinancesSection: React.FC = () => {
  const { user, activeMembership } = useAuth();
  const [statementData, setStatementData] = useState<TutorAccountStatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadStatement();
  }, [user?.email, activeMembership?.schoolId]);

  const loadStatement = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await getTutorAccountStatement(user.email);
      setStatementData(data);
    } catch (e: any) {
      console.error(e);
      toast.error('Error al cargar estado de cuenta familiar');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, type: 'clabe' | 'account' | 'matricula', id?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'clabe') {
      setCopiedClabe(true);
      toast.success('CLABE interbancaria copiada al portapapeles');
      setTimeout(() => setCopiedClabe(false), 2000);
    } else if (type === 'account') {
      setCopiedAccount(true);
      toast.success('Número de cuenta copiado al portapapeles');
      setTimeout(() => setCopiedAccount(false), 2000);
    } else if (type === 'matricula') {
      setCopiedStudentId(id || text);
      toast.success(`Matrícula ${text} copiada al portapapeles`);
      setTimeout(() => setCopiedStudentId(null), 2000);
    }
  };

  const bankDetails = {
    bank: 'BBVA Bancomer',
    beneficiary: statementData?.school?.name || activeMembership?.school.legalName || activeMembership?.school.name || 'Escuela Montessori',
    clabe: '012691001928475829',
    account: '0192847582',
    phone: statementData?.school?.phone || activeMembership?.school.phone || '+52 998 350 2849'
  };

  const filteredStudents = statementData?.students.filter(s => {
    if (selectedStudentFilter === 'ALL') return true;
    return s.studentId === selectedStudentFilter;
  }) || [];

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
      
      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40 shrink-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white leading-tight">
                Estado de Cuenta & Pagos
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                Consulta tu plan de colegiaturas acordado, descuentos aplicados, historial de cuotas liquidadas y datos bancarios oficiales del colegio.
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-white/90 shrink-0 space-y-0.5">
            <span className="text-[10px] text-white/60 uppercase font-bold block">Colegio Activo</span>
            <strong className="text-sm sm:text-base font-bold font-display block text-white">
              {statementData?.school?.name || activeMembership?.school.name || 'Escuela Montessori'}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-16 text-center text-xs text-muted-foreground bg-white rounded-3xl border border-forest/10 shadow-xs">
          Cargando estado de cuenta familiar...
        </div>
      ) : !statementData || statementData.students.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-forest/10 shadow-xs space-y-3">
          <GraduationCap className="w-12 h-12 text-forest/30 mx-auto" />
          <h3 className="font-bold text-forest text-base font-display">No hay alumnos vinculados a tu cuenta</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Comunícate con la administración del colegio para vincular a tu estudiante con el correo: <strong>{user?.email}</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Multiple Children Tabs Filter */}
          {statementData.students.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-forest/70 uppercase tracking-wider mr-2 shrink-0">
                Ver estado de:
              </span>
              <button
                onClick={() => setSelectedStudentFilter('ALL')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  selectedStudentFilter === 'ALL'
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-white border border-forest/10 text-forest hover:bg-forest/5'
                }`}
              >
                Todos los hijos ({statementData.students.length})
              </button>
              {statementData.students.map(s => (
                <button
                  key={s.studentId}
                  onClick={() => setSelectedStudentFilter(s.studentId)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                    selectedStudentFilter === s.studentId
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-white border border-forest/10 text-forest hover:bg-forest/5'
                  }`}
                >
                  {s.avatarUrl ? (
                    <img src={s.avatarUrl} alt={s.fullName} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  <span>{s.fullName}</span>
                </button>
              ))}
            </div>
          )}

          {/* Student Statement Cards */}
          {filteredStudents.map((studentStatement) => {
            const plan = studentStatement.activePlan;
            const summary = studentStatement.summary;
            const nextDue = summary.nextDue;
            const nextDueDateFormatted = nextDue 
              ? new Date(nextDue.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) 
              : null;
            const isStudentActive = true; // active in statement

            // Filtered installments for this child
            const displayInstallments = studentStatement.installments.filter(inst => {
              if (statusFilter === 'ALL') return true;
              if (statusFilter === 'PENDING') return inst.status !== 'PAID';
              if (statusFilter === 'PAID') return inst.status === 'PAID';
              return true;
            });

            return (
              <div 
                key={studentStatement.studentId} 
                className="bg-white rounded-3xl border border-forest/10 shadow-xs p-6 md:p-8 space-y-6 relative"
              >
                {/* Student Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-forest/10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-forest/10 border border-forest/15 text-forest font-bold flex items-center justify-center text-2xl font-display shrink-0 shadow-2xs">
                      {studentStatement.avatarUrl ? (
                        <img src={studentStatement.avatarUrl} alt={studentStatement.fullName} className="w-full h-full object-cover" />
                      ) : (
                        studentStatement.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-display text-forest">
                        {studentStatement.fullName}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="font-semibold text-forest/90">
                          {studentStatement.grade || 'Ambiente Montessori'}
                        </span>
                        <span className="text-[10px] bg-cream px-2 py-0.5 rounded-md text-forest font-medium">
                          Rol: {studentStatement.relationship === 'FATHER' ? 'Padre' : studentStatement.relationship === 'MOTHER' ? 'Madre' : 'Tutor'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right Action & Status Corner */}
                  <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    {/* Copyable Status & Enrollment Badge */}
                    <button
                      type="button"
                      onClick={() => handleCopyText(studentStatement.enrollmentCode || '', 'matricula', studentStatement.studentId)}
                      title={studentStatement.enrollmentCode ? `Clic para copiar matrícula: ${studentStatement.enrollmentCode}` : 'Estado escolar'}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs group/copy cursor-pointer active:scale-95 ${
                        isStudentActive 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' 
                          : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Matrícula Activa{studentStatement.enrollmentCode ? ` • ${studentStatement.enrollmentCode}` : ''}
                      </span>
                      {studentStatement.enrollmentCode && (
                        copiedStudentId === studentStatement.studentId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-50 group-hover/copy:opacity-100 transition-opacity shrink-0" />
                        )
                      )}
                    </button>

                    {/* Plan Tag */}
                    {plan && (
                      <div className="px-3.5 py-1.5 bg-forest/5 text-forest border border-forest/15 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                        <span>{plan.planName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!plan ? (
                  <div className="p-8 bg-cream/30 rounded-2xl border border-forest/10 text-center space-y-2">
                    <Clock className="w-8 h-8 text-forest/40 mx-auto" />
                    <h4 className="font-bold text-forest text-sm">Plan de Colegiaturas en Proceso</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      La administración está preparando el plan personalizado para el ciclo escolar de {studentStatement.fullName}. En breve estará disponible aquí.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Next Due Highlight & Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Next Due Hero Card */}
                      <div className="md:col-span-1 p-5 rounded-3xl bg-gradient-to-br from-forest to-forest-light text-white space-y-4 shadow-md flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="space-y-1.5 relative z-10">
                          <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Próximo Vencimiento</span>
                          </span>
                          {nextDue ? (
                            <>
                              <h4 className="text-lg font-bold font-display text-white mt-1 leading-snug">
                                {nextDue.conceptName}
                              </h4>
                              <p className="text-xs text-white/80">
                                Fecha límite: <strong className="text-amber-200">{nextDueDateFormatted}</strong>
                              </p>
                              {nextDue.paymentReference && (
                                <p className="text-[11px] text-white/70 font-mono">
                                  Referencia: {nextDue.paymentReference}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="pt-2">
                              <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>¡Al corriente!</span>
                              </h4>
                              <p className="text-xs text-white/80 mt-0.5">No tienes pagos pendientes en este momento.</p>
                            </div>
                          )}
                        </div>

                        {nextDue && (
                          <div className="pt-3 border-t border-white/15 flex items-center justify-between relative z-10">
                            <span className="text-xs text-white/80">Total a Pagar:</span>
                            <strong className="text-2xl font-bold font-mono font-display text-white">
                              ${nextDue.effectiveTotal ? nextDue.effectiveTotal.toLocaleString('es-MX') : nextDue.netAmount.toLocaleString('es-MX')}
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Summary Metrics */}
                      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-3xl bg-cream/40 border border-forest/10 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Inversión del Ciclo</span>
                          <strong className="text-forest text-xl font-bold font-mono mt-2">
                            ${summary.totalCharged.toLocaleString('es-MX')}
                          </strong>
                          <span className="text-[10px] text-muted-foreground mt-1">Ciclo {plan.schoolYear}</span>
                        </div>

                        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold text-emerald-800">Pagado a la Fecha</span>
                          <strong className="text-emerald-900 text-xl font-bold font-mono mt-2">
                            ${summary.totalPaid.toLocaleString('es-MX')}
                          </strong>
                          <span className="text-[10px] text-emerald-700 font-semibold mt-1">
                            {summary.paidInstallmentsCount} de {summary.totalInstallments} cuotas
                          </span>
                        </div>

                        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col justify-between col-span-2 sm:col-span-1">
                          <span className="text-[10px] uppercase font-bold text-amber-800">Saldo Pendiente</span>
                          <strong className="text-amber-950 text-xl font-bold font-mono mt-2">
                            ${summary.totalPending.toLocaleString('es-MX')}
                          </strong>
                          <span className="text-[10px] text-amber-700 font-semibold mt-1">
                            {summary.totalInstallments - summary.paidInstallmentsCount} cuotas por liquidar
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Discount & Scholarship Agreement Transparency */}
                    {summary.totalDiscount > 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-4 text-xs text-emerald-950">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
                          <div>
                            <strong>Descuento Familiar Aplicado:</strong>
                            <span className="ml-1 text-emerald-900">
                              {plan.notes || 'Beneficio especial por hermanos o beca institucional acordada'}
                            </span>
                          </div>
                        </div>
                        <strong className="font-mono text-emerald-800 text-sm shrink-0">
                          -${summary.totalDiscount.toLocaleString('es-MX')}
                        </strong>
                      </div>
                    )}

                    {/* Detailed Installments Calendar */}
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="font-bold text-forest text-sm font-display flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-forest" />
                          <span>Calendario de Cuotas ({summary.totalInstallments} Mensualidades)</span>
                        </h4>

                        {/* Status Filter Pills */}
                        <div className="flex items-center gap-1.5 bg-cream/70 p-1 rounded-xl border border-forest/10 text-xs">
                          <button
                            type="button"
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all ${
                              statusFilter === 'ALL' 
                                ? 'bg-forest text-white shadow-2xs' 
                                : 'text-forest/70 hover:text-forest'
                            }`}
                          >
                            Todas ({studentStatement.installments.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusFilter('PENDING')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all ${
                              statusFilter === 'PENDING' 
                                ? 'bg-forest text-white shadow-2xs' 
                                : 'text-forest/70 hover:text-forest'
                            }`}
                          >
                            Por Pagar ({studentStatement.installments.filter(i => i.status !== 'PAID').length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusFilter('PAID')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all ${
                              statusFilter === 'PAID' 
                                ? 'bg-forest text-white shadow-2xs' 
                                : 'text-forest/70 hover:text-forest'
                            }`}
                          >
                            Pagadas ({summary.paidInstallmentsCount})
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {displayInstallments.map((inst) => {
                          const isPaid = inst.status === 'PAID';
                          const dueDate = new Date(inst.dueDate);
                          const isOverdue = !isPaid && dueDate < new Date();
                          const cutDate = inst.invoiceCutDate ? new Date(inst.invoiceCutDate) : null;
                          
                          const dueDateFormatted = dueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
                          const cutDateFormatted = cutDate ? cutDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : null;

                          const hasLateFee = inst.isLateFeeApplied;
                          const isWaived = inst.isLateFeeWaived;
                          const finalAmount = hasLateFee ? (inst.netAmount + (inst.lateFeeAmount || 0)) : inst.netAmount;

                          return (
                            <div 
                              key={inst.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                isPaid 
                                  ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/70' 
                                  : isOverdue 
                                    ? 'bg-red-50/50 border-red-200 hover:bg-red-50/80' 
                                    : 'bg-white border-forest/10 hover:border-forest/20 shadow-2xs'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-forest text-sm font-display">
                                    {inst.conceptName}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                    isPaid 
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                      : isOverdue 
                                        ? 'bg-red-100 text-red-900 border border-red-300' 
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}>
                                    {isPaid ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                        <span>Liquidado</span>
                                      </>
                                    ) : isOverdue ? (
                                      <>
                                        <AlertCircle className="w-3 h-3 text-red-700" />
                                        <span>Vencido</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-amber-700" />
                                        <span>Pendiente</span>
                                      </>
                                    )}
                                  </span>

                                  {hasLateFee && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                                      +${inst.lateFeeAmount?.toLocaleString('es-MX')} ({inst.lateFeePct}% recargo)
                                    </span>
                                  )}

                                  {isOverdue && isWaived && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                      <span>Crédito / Sin recargo</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                                  {cutDateFormatted && (
                                    <span>Corte: <strong className="text-forest/70">{cutDateFormatted}</strong></span>
                                  )}
                                  <span>Fecha Límite: <strong className="text-forest/80">{dueDateFormatted}</strong></span>
                                  {inst.discountAmount > 0 && (
                                    <span className="text-emerald-700 font-semibold">
                                      Descuento: -${inst.discountAmount.toLocaleString('es-MX')} ({inst.discountReason})
                                    </span>
                                  )}
                                  {inst.paymentReference && (
                                    <span className="font-mono text-[10px] bg-forest/5 px-2 py-0.5 rounded border border-forest/10 text-forest/80">
                                      Ref: {inst.paymentReference}
                                    </span>
                                  )}
                                  {isPaid && inst.paidAt && (
                                    <span className="text-emerald-800 text-[10px]">
                                      Liquidado el {new Date(inst.paidAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center">
                                <strong className={`font-mono text-sm sm:text-base font-bold ${isPaid ? 'text-emerald-800 line-through opacity-75' : 'text-forest'}`}>
                                  ${finalAmount.toLocaleString('es-MX')}
                                </strong>
                                {isPaid ? (
                                  <div className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs">
                                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Pagado</span>
                                  </div>
                                ) : (
                                  <div className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl text-xs font-bold shadow-2xs">
                                    Por Pagar
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Official Bank Transfer Information Box */}
      <div className="p-6 md:p-7 rounded-3xl bg-cream/50 border border-forest/15 space-y-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-forest" />
          <h3 className="font-bold text-forest text-base font-display">
            Datos Bancarios Oficiales para Transferencias (SPEI)
          </h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Para realizar el pago de colegiaturas o cuotas escolares, por favor utiliza la siguiente cuenta bancaria oficial del colegio. Recuerda colocar como concepto o referencia el <strong>nombre y matrícula de tu hijo</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-forest/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Institución Bancaria</span>
            <strong className="text-forest text-sm font-bold block">{bankDetails.bank}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-forest/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Beneficiario / Razón Social</span>
            <strong className="text-forest text-sm font-bold block truncate">{bankDetails.beneficiary}</strong>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-forest/10 flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">CLABE Interbancaria (SPEI)</span>
              <strong className="text-forest text-sm font-bold font-mono block">{bankDetails.clabe}</strong>
            </div>

            <button
              type="button"
              onClick={() => handleCopyText(bankDetails.clabe, 'clabe')}
              className="p-2.5 bg-forest/5 hover:bg-forest/10 text-forest rounded-xl transition-all shrink-0 cursor-pointer active:scale-95"
              title="Copiar CLABE"
            >
              {copiedClabe ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Financial Support Contact */}
        <div className="pt-2 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>¿Tienes alguna duda con tu estado de cuenta o comprobante fiscal?</span>
          <a
            href={`https://wa.me/${bankDetails.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-forest hover:text-emerald-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Contactar a Administración ({bankDetails.phone})</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>

    </div>
  );
};

export default TutorFinancesSection;
