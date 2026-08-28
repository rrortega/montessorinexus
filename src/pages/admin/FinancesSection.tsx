import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CreditCard,
  Sparkles,
  Calendar,
  DollarSign,
  Percent,
  Tag,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Layers,
  BookOpen,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Search,
  Filter,
  BarChart3,
  Receipt,
  FileText,
  Zap,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  CalendarDays,
  X,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MobileMenuButton } from './AdminDashboard';
import {
  StudentItem,
  getStudents,
  StudentFeePlanItem,
  getStudentFeePlans,
  FeePlanTemplateItem,
  getFeePlanTemplates,
  FeeConceptItem,
  getFeeConcepts,
  FeeInstallmentItem,
  getAllSchoolInstallments,
  cancelInstallmentPayment,
  saveFeeConcept,
  deleteFeeConcept,
  saveFeePlanTemplate,
  deleteFeePlanTemplate,
  deleteStudentFeePlan
} from '@/lib/sqlite';
import { CustomFeePlanDrawer } from '@/components/admin/CustomFeePlanDrawer';
import { InstallmentsManagerDrawer } from '@/components/admin/InstallmentsManagerDrawer';
import { FeePlanTemplateDrawer } from '@/components/admin/FeePlanTemplateDrawer';
import { FeeConceptDrawer } from '@/components/admin/FeeConceptDrawer';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type ActiveTab = 'dashboard' | 'transactions' | 'plans' | 'templates' | 'concepts';
type DatePreset = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export const FinancesSection: React.FC = () => {
  const confirm = useConfirm();
  const { role, activeMembership } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN';
  const permissions: string[] = (activeMembership as any)?.permissions || [];
  const canManageFinances = isOwnerOrAdmin || permissions.includes('finances:write') || permissions.includes('finances:manage') || permissions.includes('finances');

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentPlans, setStudentPlans] = useState<StudentFeePlanItem[]>([]);
  const [templates, setTemplates] = useState<FeePlanTemplateItem[]>([]);
  const [concepts, setConcepts] = useState<FeeConceptItem[]>([]);
  const [allInstallments, setAllInstallments] = useState<FeeInstallmentItem[]>([]);

  // Search & Filters for Plans Tab
  const [searchQuery, setSearchQuery] = useState('');

  // Transactions Tab State (Search, Date Filter, Pagination)
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txMethodFilter, setTxMethodFilter] = useState('ALL');
  const [txDatePreset, setTxDatePreset] = useState<DatePreset>('ALL');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');
  const [txCurrentPage, setTxCurrentPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(15);

  // Drawers
  const [selectedStudentForPlan, setSelectedStudentForPlan] = useState<StudentItem | null>(null);
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

  const [selectedStudentForInstallments, setSelectedStudentForInstallments] = useState<StudentItem | null>(null);
  const [installmentsDrawerOpen, setInstallmentsDrawerOpen] = useState(false);

  // Template Modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<FeePlanTemplateItem> | null>(null);

  // Concept Drawer
  const [conceptDrawerOpen, setConceptDrawerOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Partial<FeeConceptItem> | null>(null);

  // Horizontal Tabs Scroll Navigation State & Handlers
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabsScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkTabsScroll();
    const el = tabsContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkTabsScroll);
    window.addEventListener('resize', checkTabsScroll);
    return () => {
      el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [checkTabsScroll]);

  useEffect(() => {
    const timer = setTimeout(checkTabsScroll, 100);
    return () => clearTimeout(timer);
  }, [checkTabsScroll, activeTab, students.length, templates.length, concepts.length, allInstallments.length]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [studList, plansList, tmplList, concList, instList] = await Promise.all([
        getStudents(),
        getStudentFeePlans(),
        getFeePlanTemplates(),
        getFeeConcepts(),
        getAllSchoolInstallments()
      ]);
      setStudents(studList);
      setStudentPlans(plansList);
      setTemplates(tmplList);
      setConcepts(concList);
      setAllInstallments(instList);
    } catch (e: any) {
      console.error(e);
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPlanDrawer = (student: StudentItem) => {
    if (!canManageFinances) {
      toast.error('No tienes permisos para modificar o asignar planes de pago.');
      return;
    }
    setSelectedStudentForPlan(student);
    setPlanDrawerOpen(true);
  };

  const handleOpenInstallmentsDrawer = (student: StudentItem) => {
    setSelectedStudentForInstallments(student);
    setInstallmentsDrawerOpen(true);
  };

  const handleDeleteConcept = async (id: string, name: string) => {
    if (!canManageFinances) {
      toast.error('No tienes permisos para eliminar conceptos de cobro.');
      return;
    }

    const ok = await confirm({
      title: '¿Eliminar concepto de cobro?',
      description: `¿Estás seguro de eliminar el concepto "${name}"? No se podrá asignar a nuevas plantillas o planes.`,
      confirmText: 'Sí, eliminar concepto',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteFeeConcept(id);
      toast.success('Concepto eliminado');
      const updated = await getFeeConcepts();
      setConcepts(updated);
    } catch (e: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!canManageFinances) {
      toast.error('No tienes permisos para eliminar plantillas.');
      return;
    }

    const ok = await confirm({
      title: '¿Eliminar plantilla de plan?',
      description: `¿Estás seguro de eliminar la plantilla "${name}"? Los planes ya generados para los alumnos mantendrán sus cuotas intactas.`,
      confirmText: 'Sí, eliminar plantilla',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteFeePlanTemplate(id);
      toast.success('Plantilla eliminada');
      const updated = await getFeePlanTemplates();
      setTemplates(updated);
    } catch (e: any) {
      toast.error('Error al eliminar plantilla');
    }
  };

  const handleCancelPaymentFromDashboard = async (inst: FeeInstallmentItem) => {
    if (!canManageFinances) {
      toast.error('No tienes permisos para anular pagos.');
      return;
    }

    const ok = await confirm({
      title: '¿Anular Registro de Pago?',
      message: `¿Estás seguro de anular el pago de $${inst.paidAmount?.toLocaleString('es-MX')} registrado para "${inst.conceptName}" (${inst.student?.fullName})?\n\nLa cuota volverá a estado Pendiente (o Vencida) y se actualizará el estado de cuenta.`,
      confirmText: 'Sí, anular pago',
      cancelText: 'Conservar pago',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await cancelInstallmentPayment(inst.id);
      toast.success('Pago anulado exitosamente');
      loadAllData();
    } catch (e: any) {
      toast.error(e.message || 'Error al anular pago');
    }
  };

  // Map students with their active plan
  const studentRows = useMemo(() => {
    return students.map(stu => {
      const plan = studentPlans.find(p => p.studentId === stu.id && p.status === 'ACTIVE') || null;
      const installments = plan?.installments || [];
      const totalCharged = installments.reduce((s, i) => s + (i.effectiveTotal || i.netAmount), 0);
      const totalPaid = installments.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.paidAmount || i.netAmount), 0);
      const totalPending = Math.max(0, totalCharged - totalPaid);

      return {
        student: stu,
        plan,
        totalCharged,
        totalPaid,
        totalPending,
        totalInstallments: installments.length,
        paidCount: installments.filter(i => i.status === 'PAID').length
      };
    });
  }, [students, studentPlans]);

  const filteredStudentRows = useMemo(() => {
    return studentRows.filter(r =>
      r.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.student.grade && r.student.grade.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [studentRows, searchQuery]);

  // Financial Analytics Calculations
  const analytics = useMemo(() => {
    let totalProjected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let totalLateFees = 0;
    let totalLateFeesWaived = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    // Categories breakdown
    const categoryTotals: Record<string, { label: string; count: number; collected: number; projected: number }> = {
      TUITION: { label: 'Colegiaturas Mensuales', count: 0, collected: 0, projected: 0 },
      ENROLLMENT: { label: 'Matrícula / Inscripción', count: 0, collected: 0, projected: 0 },
      MATERIALS: { label: 'Materiales & Libros', count: 0, collected: 0, projected: 0 },
      WORKSHOP: { label: 'Talleres & Actividades', count: 0, collected: 0, projected: 0 },
      MEALS: { label: 'Comedor & Alimentos', count: 0, collected: 0, projected: 0 },
      OTHER: { label: 'Otros Conceptos', count: 0, collected: 0, projected: 0 }
    };

    // Monthly breakdown map
    const monthMap: Record<string, {
      key: string;
      monthLabel: string;
      projected: number;
      collected: number;
      pending: number;
      overdue: number;
      lateFees: number;
      totalCount: number;
      paidCount: number;
    }> = {};

    allInstallments.forEach(inst => {
      const net = inst.netAmount || 0;
      const effective = inst.effectiveTotal || (inst.isLateFeeApplied ? net + (inst.lateFeeAmount || 0) : net);
      const paid = inst.paidAmount || 0;
      const isPaid = inst.status === 'PAID' || paid >= effective;
      const isOverdue = inst.isOverdue || (!isPaid && new Date(inst.dueDate) < new Date());

      totalProjected += effective;
      totalCollected += paid;
      if (!isPaid) {
        totalPending += Math.max(0, effective - paid);
        if (isOverdue) totalOverdue += Math.max(0, effective - paid);
      }

      if (inst.isLateFeeApplied) totalLateFees += inst.lateFeeAmount || 0;
      if (inst.isLateFeeWaived) totalLateFeesWaived += inst.lateFeeAmount || 0;

      if (isPaid) paidCount++;
      else if (isOverdue) overdueCount++;
      else pendingCount++;

      // Category breakdown
      const catKey = categoryTotals[inst.category] ? inst.category : 'OTHER';
      categoryTotals[catKey].count++;
      categoryTotals[catKey].projected += effective;
      categoryTotals[catKey].collected += paid;

      // Month breakdown
      const d = inst.dueDate ? new Date(inst.dueDate) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          key: monthKey,
          monthLabel,
          projected: 0,
          collected: 0,
          pending: 0,
          overdue: 0,
          lateFees: 0,
          totalCount: 0,
          paidCount: 0
        };
      }

      monthMap[monthKey].projected += effective;
      monthMap[monthKey].collected += paid;
      if (!isPaid) {
        monthMap[monthKey].pending += Math.max(0, effective - paid);
        if (isOverdue) monthMap[monthKey].overdue += Math.max(0, effective - paid);
      }
      if (inst.isLateFeeApplied) monthMap[monthKey].lateFees += inst.lateFeeAmount || 0;
      monthMap[monthKey].totalCount++;
      if (isPaid) monthMap[monthKey].paidCount++;
    });

    const recoveryRate = totalProjected > 0 ? Math.round((totalCollected / totalProjected) * 100) : 0;
    const monthlyList = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));

    return {
      totalProjected,
      totalCollected,
      totalPending,
      totalOverdue,
      totalLateFees,
      totalLateFeesWaived,
      paidCount,
      pendingCount,
      overdueCount,
      recoveryRate,
      categoryTotals: Object.values(categoryTotals).filter(c => c.count > 0 || c.projected > 0),
      monthlyList
    };
  }, [allInstallments]);

  // Total collected transactions raw count
  const allPaidTransactions = useMemo(() => {
    return allInstallments.filter(i => (i.paidAmount > 0 || i.status === 'PAID') && i.paidAt);
  }, [allInstallments]);

  // Filtered Collected / Paid Transactions for the Transactions Tab
  const filteredPaidTransactions = useMemo(() => {
    return allPaidTransactions
      .filter(i => {
        // Payment Method Filter
        if (txMethodFilter !== 'ALL' && i.paymentMethod !== txMethodFilter) return false;

        // Date Filter
        if (i.paidAt) {
          const txDate = new Date(i.paidAt);
          const now = new Date();

          if (txDatePreset === 'TODAY') {
            const isToday =
              txDate.getFullYear() === now.getFullYear() &&
              txDate.getMonth() === now.getMonth() &&
              txDate.getDate() === now.getDate();
            if (!isToday) return false;
          } else if (txDatePreset === 'THIS_WEEK') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            if (txDate < startOfWeek) return false;
          } else if (txDatePreset === 'THIS_MONTH') {
            const isThisMonth =
              txDate.getFullYear() === now.getFullYear() &&
              txDate.getMonth() === now.getMonth();
            if (!isThisMonth) return false;
          } else if (txDatePreset === 'LAST_MONTH') {
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const isLastMonth =
              txDate.getFullYear() === prevMonth.getFullYear() &&
              txDate.getMonth() === prevMonth.getMonth();
            if (!isLastMonth) return false;
          } else if (txDatePreset === 'CUSTOM') {
            if (txDateFrom) {
              const fromD = new Date(txDateFrom + 'T00:00:00');
              if (txDate < fromD) return false;
            }
            if (txDateTo) {
              const toD = new Date(txDateTo + 'T23:59:59.999');
              if (txDate > toD) return false;
            }
          }
        }

        // Search Query (Student name, Grade, Environment, Concept, Reference, Notes, Method)
        if (txSearchQuery.trim()) {
          const q = txSearchQuery.toLowerCase().trim();
          const studentObj = students.find(s => s.id === i.studentId) || i.student;
          const studentName = (studentObj?.fullName || studentObj?.full_name || '').toLowerCase();
          const studentGrade = (studentObj?.grade || '').toLowerCase();
          const envName = (studentObj?.environment?.name || '').toLowerCase();
          const concept = (i.conceptName || '').toLowerCase();
          const ref = (i.paymentReference || '').toLowerCase();
          const notes = (i.notes || '').toLowerCase();
          const method = (i.paymentMethod || '').toLowerCase();

          return (
            studentName.includes(q) ||
            studentGrade.includes(q) ||
            envName.includes(q) ||
            concept.includes(q) ||
            ref.includes(q) ||
            notes.includes(q) ||
            method.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
        const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [allPaidTransactions, students, txSearchQuery, txMethodFilter, txDatePreset, txDateFrom, txDateTo]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setTxCurrentPage(1);
  }, [txSearchQuery, txMethodFilter, txDatePreset, txDateFrom, txDateTo]);

  // Pagination calculations for Transactions
  const totalTxItems = filteredPaidTransactions.length;
  const totalTxPages = Math.max(1, Math.ceil(totalTxItems / txPageSize));
  const validTxPage = Math.min(txCurrentPage, totalTxPages);
  const paginatedTransactions = useMemo(() => {
    const start = (validTxPage - 1) * txPageSize;
    return filteredPaidTransactions.slice(start, start + txPageSize);
  }, [filteredPaidTransactions, validTxPage, txPageSize]);

  const totalFilteredCollected = useMemo(() => {
    return filteredPaidTransactions.reduce((acc, t) => acc + (t.paidAmount || t.netAmount || 0), 0);
  }, [filteredPaidTransactions]);

  const hasActiveTxFilters = txSearchQuery.trim() !== '' || txMethodFilter !== 'ALL' || txDatePreset !== 'ALL' || txDateFrom !== '' || txDateTo !== '';

  const handleResetTxFilters = () => {
    setTxSearchQuery('');
    setTxMethodFilter('ALL');
    setTxDatePreset('ALL');
    setTxDateFrom('');
    setTxDateTo('');
    setTxCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-background animate-in fade-in duration-300">

      {/* 1. FIXED TOP AREA: FULL-WIDTH GREEN HERO BANNER WITH INTEGRATED TAB PANEL */}
      <div className="shrink-0 z-10 bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 pt-5 pb-0 text-white shadow-md relative overflow-hidden border-b border-forest-light/40 space-y-3">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 pt-0.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white leading-tight">
                Finanzas & Cobranza
              </h1>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5 hidden sm:block">
                Dashboard de ingresos en tiempo real, registro de pagos y planes de colegiatura.
              </p>
            </div>
          </div>
        </div>

        {/* Integrated Tab Panel in Header with horizontal scroll handlers */}
        <div className="relative z-10 -mx-4 sm:-mx-6 md:-mx-8 px-3 sm:px-6 md:px-8 flex items-center border-b border-white/20 pt-1">
          {/* Left Scroll Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className="shrink-0 mr-1 p-1 sm:p-1.5 rounded-full bg-white/20 hover:bg-white/35 text-white border border-white/25 backdrop-blur-xs transition-all shadow-xs hover:scale-110 active:scale-95 cursor-pointer z-20 mb-2"
              title="Desplazar pestañas hacia la izquierda"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Tabs Viewport */}
          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap active:cursor-grab select-none touch-pan-x px-1"
          >
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-white text-white font-extrabold shadow-[0_1px_0_0_rgba(255,255,255,0.8)]'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/40 font-medium'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'transactions'
                  ? 'border-white text-white font-extrabold shadow-[0_1px_0_0_rgba(255,255,255,0.8)]'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/40 font-medium'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Transacciones</span>
              {allPaidTransactions.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                  activeTab === 'transactions' ? 'bg-white text-forest shadow-xs' : 'bg-white/20 text-white'
                }`}>
                  {allPaidTransactions.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'plans'
                  ? 'border-white text-white font-extrabold shadow-[0_1px_0_0_rgba(255,255,255,0.8)]'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/40 font-medium'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="sm:hidden">Planes ({students.length})</span>
              <span className="hidden sm:inline">Planes por Estudiante ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'templates'
                  ? 'border-white text-white font-extrabold shadow-[0_1px_0_0_rgba(255,255,255,0.8)]'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/40 font-medium'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="sm:hidden">Plantillas ({templates.length})</span>
              <span className="hidden sm:inline">Plantillas de Planes ({templates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('concepts')}
              className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'concepts'
                  ? 'border-white text-white font-extrabold shadow-[0_1px_0_0_rgba(255,255,255,0.8)]'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/40 font-medium'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span className="sm:hidden">Conceptos ({concepts.length})</span>
              <span className="hidden sm:inline">Conceptos de Cobro ({concepts.length})</span>
            </button>
          </div>

          {/* Right Scroll Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="shrink-0 ml-1 p-1 sm:p-1.5 rounded-full bg-white/20 hover:bg-white/35 text-white border border-white/25 backdrop-blur-xs transition-all shadow-xs hover:scale-110 active:scale-95 cursor-pointer z-20 mb-2"
              title="Desplazar pestañas hacia la derecha"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 0: FINANCIAL DASHBOARD (ANALYTICS & METRICS - SCROLLABLE) */}
      {activeTab === 'dashboard' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 custom-scrollbar animate-in fade-in">

          {/* Top 4 KPI Metrics (2x2 on tablets/laptops, 4x1 on wide desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Total Cobrado */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-forest/10 shadow-2xs flex items-start justify-between gap-3 overflow-hidden">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
                  Total Recaudado / Cobrado
                </span>
                <strong className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 block mt-1 tracking-tight">
                  ${analytics.totalCollected.toLocaleString('es-MX')}
                </strong>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 block truncate">
                  {analytics.paidCount} cuotas liquidadas
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Saldo Pendiente por Cobrar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-forest/10 shadow-2xs flex items-start justify-between gap-3 overflow-hidden">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-forest/70 uppercase tracking-wider block truncate">
                  Saldo por Cobrar (Pendiente)
                </span>
                <strong className="text-xl sm:text-2xl font-bold font-mono text-forest block mt-1 tracking-tight">
                  ${analytics.totalPending.toLocaleString('es-MX')}
                </strong>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 block truncate">
                  {analytics.pendingCount + analytics.overdueCount} cuotas restantes
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Recargo por Mora */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-forest/10 shadow-2xs flex items-start justify-between gap-3 overflow-hidden">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate">
                  Recargos por Mora
                </span>
                <strong className="text-xl sm:text-2xl font-bold font-mono text-amber-600 block mt-1 tracking-tight">
                  +${analytics.totalLateFees.toLocaleString('es-MX')}
                </strong>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 block truncate">
                  {analytics.overdueCount} vencidas • ${analytics.totalLateFeesWaived.toLocaleString('es-MX')} condonados
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            {/* Tasa de Recuperación */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-forest/10 shadow-2xs flex items-start justify-between gap-3 overflow-hidden">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-forest/70 uppercase tracking-wider block truncate">
                  Efectividad de Cobro
                </span>
                <strong className="text-xl sm:text-2xl font-bold font-mono text-forest block mt-1 tracking-tight">
                  {analytics.recoveryRate}%
                </strong>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 block truncate">
                  de ${analytics.totalProjected.toLocaleString('es-MX')} proyectados
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Desglose de Ingresos por Concepto & Matrículas */}
          <div className="bg-white p-6 rounded-3xl border border-forest/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-forest" />
                <div>
                  <h3 className="font-display font-bold text-forest text-base">Desglose de Ingresos por Categoría</h3>
                  <p className="text-xs text-muted-foreground">Comparativa de recaudación entre colegiaturas, inscripciones, materiales y talleres.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.categoryTotals.map(cat => {
                const pct = cat.projected > 0 ? Math.round((cat.collected / cat.projected) * 100) : 0;
                return (
                  <div key={cat.label} className="p-4 rounded-2xl bg-cream/30 border border-forest/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-forest">{cat.label}</span>
                      <span className="text-[10px] font-mono text-muted-foreground font-bold">{cat.count} cuotas</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold font-mono text-emerald-700">
                        ${cat.collected.toLocaleString('es-MX')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        de ${cat.projected.toLocaleString('es-MX')}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-forest/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-forest/70 block text-right">
                      {pct}% recaudado
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analítica por Mes (Desglose Calendario Escolar) */}
          <div className="bg-white p-6 rounded-3xl border border-forest/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-forest" />
                <div>
                  <h3 className="font-display font-bold text-forest text-base">Proyección & Recaudación por Mes</h3>
                  <p className="text-xs text-muted-foreground">Seguimiento mensual de cobranza, saldos pendientes y morosidad.</p>
                </div>
              </div>
            </div>

            {analytics.monthlyList.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">No hay cuotas programadas en el sistema.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-forest/10 text-[11px] font-bold text-forest/70 uppercase tracking-wider bg-forest/5">
                      <th className="p-3.5 px-4">Periodo / Mes</th>
                      <th className="p-3.5">Cuotas</th>
                      <th className="p-3.5">Proyectado</th>
                      <th className="p-3.5">Recaudado</th>
                      <th className="p-3.5">Por Cobrar</th>
                      <th className="p-3.5">Mora Generada</th>
                      <th className="p-3.5 text-right">% Cobranza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest/5">
                    {analytics.monthlyList.map(m => {
                      const pct = m.projected > 0 ? Math.round((m.collected / m.projected) * 100) : 0;
                      return (
                        <tr key={m.key} className="hover:bg-forest/5 transition-colors">
                          <td className="p-3.5 px-4 font-bold text-forest">{m.monthLabel}</td>
                          <td className="p-3.5 text-muted-foreground">{m.paidCount} / {m.totalCount}</td>
                          <td className="p-3.5 font-mono font-bold text-forest">${m.projected.toLocaleString('es-MX')}</td>
                          <td className="p-3.5 font-mono font-bold text-emerald-700">${m.collected.toLocaleString('es-MX')}</td>
                          <td className="p-3.5 font-mono font-semibold text-rose-700">
                            {m.pending > 0 ? `$${m.pending.toLocaleString('es-MX')}` : '—'}
                          </td>
                          <td className="p-3.5 font-mono text-amber-700">
                            {m.lateFees > 0 ? `+$${m.lateFees.toLocaleString('es-MX')}` : '—'}
                          </td>
                          <td className="p-3.5 text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${pct === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : pct >= 70
                                  ? 'bg-forest/10 text-forest'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 1: DEDICATED TRANSACTIONS TAB (FIXED FILTERS + SCROLLABLE TABLE BODY + FIXED BOTTOM PAGINATOR) */}
      {activeTab === 'transactions' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in">

          {/* 1. FIXED TOP AREA: CONTROLS & SEARCH/FILTERS TOOLBAR (NOT SCROLLED) */}
          <div className="shrink-0 z-10 px-4 sm:px-6 md:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-forest/10 space-y-2.5 shadow-2xs">
            
            {/* Top row: Title + Inline Metrics Summary + Reset button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div>
                  <h3 className="font-display font-bold text-forest text-sm sm:text-base flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-forest" />
                    <span>Registro & Control de Transacciones</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Historial de pagos liquidados con comprobantes y referencias.
                  </p>
                </div>

                {/* Inline mini KPI Pills */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase">Total:</span>
                    <strong className="font-mono text-emerald-700 font-bold">${totalFilteredCollected.toLocaleString('es-MX')}</strong>
                  </div>
                  <div className="px-2.5 py-1 bg-forest/5 border border-forest/10 rounded-xl text-xs flex items-center gap-1.5">
                    <span className="text-[10px] text-forest/70 font-bold uppercase">Pagos:</span>
                    <strong className="font-mono text-forest font-bold">{totalTxItems}</strong>
                  </div>
                  <div className="px-2.5 py-1 bg-forest/5 border border-forest/10 rounded-xl text-xs flex items-center gap-1.5">
                    <span className="text-[10px] text-forest/70 font-bold uppercase">Promedio:</span>
                    <strong className="font-mono text-forest font-bold">${totalTxItems > 0 ? Math.round(totalFilteredCollected / totalTxItems).toLocaleString('es-MX') : 0}</strong>
                  </div>
                </div>
              </div>

              {hasActiveTxFilters && (
                <button
                  type="button"
                  onClick={handleResetTxFilters}
                  className="self-start sm:self-auto px-3 py-1 rounded-xl border border-forest/15 bg-forest/5 hover:bg-forest/10 text-xs font-bold text-forest transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Restablecer todos los filtros"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>

            {/* Filter Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {/* 1. Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-forest/40 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  placeholder="Buscar alumno, folio, concepto..."
                  className="w-full h-8 pl-9 pr-8 rounded-xl border border-forest/20 text-xs text-forest placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-forest/20 bg-white shadow-2xs"
                />
                {txSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTxSearchQuery('')}
                    className="absolute right-2.5 top-2 p-0.5 text-forest/40 hover:text-forest"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 2. Date Filter Presets (Custom Select) */}
              <div>
                <Select
                  value={txDatePreset}
                  onValueChange={(val) => setTxDatePreset(val as DatePreset)}
                >
                  <SelectTrigger className="h-8 w-full rounded-xl bg-white border border-forest/20 text-xs font-semibold text-forest shadow-2xs focus:ring-1 focus:ring-forest/20">
                    <SelectValue placeholder="Periodo de Fecha" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-xl border border-forest/15 bg-white shadow-lg p-1 text-xs z-50">
                    <SelectItem value="ALL" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Todas las Fechas</SelectItem>
                    <SelectItem value="TODAY" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Pagos de Hoy</SelectItem>
                    <SelectItem value="THIS_WEEK" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Esta Semana</SelectItem>
                    <SelectItem value="THIS_MONTH" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Este Mes</SelectItem>
                    <SelectItem value="LAST_MONTH" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Mes Anterior</SelectItem>
                    <SelectItem value="CUSTOM" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Rango Personalizado...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Payment Method Filter (Custom Select) */}
              <div>
                <Select
                  value={txMethodFilter}
                  onValueChange={(val) => setTxMethodFilter(val)}
                >
                  <SelectTrigger className="h-8 w-full rounded-xl bg-white border border-forest/20 text-xs font-semibold text-forest shadow-2xs focus:ring-1 focus:ring-forest/20">
                    <SelectValue placeholder="Método de Pago" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-xl border border-forest/15 bg-white shadow-lg p-1 text-xs z-50">
                    <SelectItem value="ALL" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Todos los Métodos</SelectItem>
                    <SelectItem value="TRANSFER" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">SPEI / Transferencia</SelectItem>
                    <SelectItem value="CASH" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Efectivo</SelectItem>
                    <SelectItem value="CARD" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Tarjeta (Débito/Crédito)</SelectItem>
                    <SelectItem value="MERCADOPAGO" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Mercado Pago</SelectItem>
                    <SelectItem value="STRIPE" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Page Size Selector (Custom Select) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Mostrar:</span>
                <Select
                  value={String(txPageSize)}
                  onValueChange={(val) => {
                    setTxPageSize(Number(val));
                    setTxCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-full rounded-xl bg-white border border-forest/20 text-xs font-semibold text-forest shadow-2xs focus:ring-1 focus:ring-forest/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" className="min-w-[7.5rem] rounded-xl border border-forest/15 bg-white shadow-lg p-1 text-xs z-50">
                    <SelectItem value="10" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">10 por página</SelectItem>
                    <SelectItem value="15" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">15 por página</SelectItem>
                    <SelectItem value="25" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">25 por página</SelectItem>
                    <SelectItem value="50" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">50 por página</SelectItem>
                    <SelectItem value="100" className="rounded-lg text-xs font-semibold text-forest focus:bg-forest/10 focus:text-forest cursor-pointer py-1.5">100 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Custom Date Range Inputs (when CUSTOM is selected) */}
            {txDatePreset === 'CUSTOM' && (
              <div className="p-2.5 bg-forest/5 rounded-xl border border-forest/10 flex flex-wrap items-center gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-forest flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Desde:</span>
                  </span>
                  <input
                    type="date"
                    value={txDateFrom}
                    onChange={(e) => setTxDateFrom(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-forest/20 bg-white text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-forest flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Hasta:</span>
                  </span>
                  <input
                    type="date"
                    value={txDateTo}
                    onChange={(e) => setTxDateTo(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-forest/20 bg-white text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 shadow-2xs"
                  />
                </div>

                {(txDateFrom || txDateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTxDateFrom('');
                      setTxDateTo('');
                    }}
                    className="text-[11px] font-semibold text-forest/70 hover:text-forest underline"
                  >
                    Limpiar rango
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. SCROLLABLE TRANSACTIONS LIST AREA (ONLY THIS AREA SCROLLS) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 custom-scrollbar">
            {paginatedTransactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground bg-white rounded-3xl border border-forest/10 shadow-xs space-y-3">
                <Receipt className="w-10 h-10 text-forest/30 mx-auto" />
                <div>
                  <p className="font-bold text-forest text-sm">No se encontraron pagos registrados</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasActiveTxFilters
                      ? 'No hay transacciones que coincidan con los filtros de búsqueda o fecha seleccionados.'
                      : 'Aún no se han registrado pagos en la institución.'}
                  </p>
                </div>
                {hasActiveTxFilters && (
                  <button
                    type="button"
                    onClick={handleResetTxFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-xs hover:bg-forest-light transition-all cursor-pointer mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Filtros</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-forest/10 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-forest/5 backdrop-blur-xs border-b border-forest/10 shadow-2xs">
                      <tr className="text-[11px] font-bold text-forest/70 uppercase tracking-wider">
                        <th className="p-3.5 px-4">Fecha de Pago</th>
                        <th className="p-3.5">Estudiante & Ambiente</th>
                        <th className="p-3.5">Concepto</th>
                        <th className="p-3.5">Método & Referencia</th>
                        <th className="p-3.5">Monto Cobrado</th>
                        <th className="p-3.5">Comprobante</th>
                        <th className="p-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest/5">
                      {paginatedTransactions.map(tx => {
                        const studentObj = students.find(s => s.id === tx.studentId) || tx.student;
                        const paidDateFormatted = tx.paidAt
                          ? new Date(tx.paidAt).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—';

                        return (
                          <tr key={tx.id} className="hover:bg-forest/5 transition-colors">
                            <td className="p-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                              {paidDateFormatted}
                            </td>

                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-xl overflow-hidden bg-forest/10 flex items-center justify-center font-bold text-forest text-xs shrink-0">
                                  {studentObj?.avatar_url || studentObj?.avatarUrl ? (
                                    <img src={studentObj.avatar_url || studentObj.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    (studentObj?.full_name || studentObj?.fullName || 'A').charAt(0)
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-forest block leading-tight">
                                    {studentObj?.full_name || studentObj?.fullName || 'Alumno'}
                                  </span>
                                  {(studentObj?.grade || studentObj?.environment?.name) && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {studentObj.grade || studentObj.environment?.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 font-medium text-forest">
                              {tx.conceptName}
                            </td>

                            <td className="p-3.5">
                              <span className="px-2 py-0.5 bg-forest/5 border border-forest/10 rounded-md text-[10px] font-bold text-forest inline-block mr-1">
                                {tx.paymentMethod === 'TRANSFER'
                                  ? 'SPEI / Transf.'
                                  : tx.paymentMethod === 'CASH'
                                  ? 'Efectivo'
                                  : tx.paymentMethod === 'CARD'
                                  ? 'Tarjeta'
                                  : tx.paymentMethod === 'MERCADOPAGO'
                                  ? 'Mercado Pago'
                                  : tx.paymentMethod === 'STRIPE'
                                  ? 'Stripe'
                                  : tx.paymentMethod || 'Pago'}
                              </span>
                              {tx.paymentReference && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {tx.paymentReference}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 font-mono font-bold text-emerald-700 text-sm">
                              ${(tx.paidAmount || tx.netAmount).toLocaleString('es-MX')}
                            </td>

                            <td className="p-3.5">
                              {tx.receiptUrl ? (
                                <a
                                  href={tx.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-forest/5 hover:bg-forest/10 text-forest rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors border border-forest/10"
                                  title="Ver comprobante de pago subido"
                                >
                                  <FileText className="w-3 h-3 text-forest" />
                                  <span>Recibo</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground/50 text-[11px]">—</span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {studentObj && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInstallmentsDrawer(studentObj as any)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-forest hover:bg-forest/10 rounded-lg transition-colors border border-forest/15 cursor-pointer shadow-2xs"
                                    title="Ver todas las cuotas de este alumno"
                                  >
                                    Ver Cuotas
                                  </button>
                                )}

                                {canManageFinances && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelPaymentFromDashboard(tx)}
                                    className="p-1.5 rounded-lg text-red-600/70 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Anular este registro de pago"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 3. FIXED BOTTOM AREA: PAGINATOR ALWAYS PINNED TO BOTTOM */}
          <div className="shrink-0 px-4 sm:px-6 md:px-8 py-2.5 bg-white/95 backdrop-blur-md border-t border-forest/10 z-10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Items Range Summary */}
            <div className="text-muted-foreground text-[11px]">
              Mostrando <strong className="text-forest font-bold">{totalTxItems === 0 ? 0 : (validTxPage - 1) * txPageSize + 1}</strong> - <strong className="text-forest font-bold">{Math.min(validTxPage * txPageSize, totalTxItems)}</strong> de <strong className="text-forest font-bold">{totalTxItems}</strong> transacciones
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={validTxPage <= 1 || totalTxItems === 0}
                onClick={() => setTxCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 px-2.5 rounded-xl border border-forest/15 bg-white text-forest hover:bg-forest/5 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <span className="px-3 py-1 text-xs font-bold bg-forest/5 rounded-xl border border-forest/10 text-forest font-mono">
                {totalTxItems === 0 ? 1 : validTxPage} / {totalTxPages}
              </span>

              <button
                type="button"
                disabled={validTxPage >= totalTxPages || totalTxItems === 0}
                onClick={() => setTxCurrentPage(prev => Math.min(totalTxPages, prev + 1))}
                className="p-1.5 px-2.5 rounded-xl border border-forest/15 bg-white text-forest hover:bg-forest/5 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Página siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: STUDENT PLANS (SCROLLABLE) */}
      {activeTab === 'plans' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 custom-scrollbar animate-in fade-in">

          {/* Search filter */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o salón..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-forest/15 bg-white text-xs text-forest focus:outline-none shadow-2xs"
              />
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              Mostrando {filteredStudentRows.length} alumnos
            </span>
          </div>

          {/* Student Cards Grid */}
          <div className="space-y-3">
            {filteredStudentRows.map(row => {
              const hasPlan = !!row.plan;

              return (
                <div
                  key={row.student.id}
                  className="bg-white rounded-3xl p-5 border border-forest/10 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-forest/10 border border-forest/15 text-forest font-bold flex items-center justify-center text-lg font-display shrink-0 shadow-2xs">
                      {row.student.avatar_url ? (
                        <img src={row.student.avatar_url} alt={row.student.full_name} className="w-full h-full object-cover" />
                      ) : (
                        row.student.full_name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-forest text-base font-display">{row.student.full_name}</h4>
                        {hasPlan ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Plan Activo: {row.plan?.schoolYear}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            Sin Plan Asignado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span>{row.student.grade || 'Ambiente Montessori'}</span>
                        {row.plan?.totalDiscountAmount && row.plan.totalDiscountAmount > 0 && (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded text-[10px] border border-emerald-100">
                            Descuento: -${row.plan.totalDiscountAmount.toLocaleString('es-MX')} ({row.plan.notes || 'Beca'})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Balance & Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 self-stretch md:self-center shrink-0">
                    {hasPlan ? (
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-xs">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Neto</span>
                          <strong className="text-forest text-sm font-bold font-mono">
                            ${row.totalCharged.toLocaleString('es-MX')}
                          </strong>
                        </div>

                        <div className="text-center sm:text-right">
                          <span className="text-[10px] text-emerald-800 uppercase font-bold block">Pagado ({row.paidCount}/{row.totalInstallments})</span>
                          <strong className="text-emerald-700 text-sm font-bold font-mono">
                            ${row.totalPaid.toLocaleString('es-MX')}
                          </strong>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-amber-800 uppercase font-bold block">Saldo Pendiente</span>
                          <strong className="text-amber-900 text-sm font-bold font-mono">
                            ${row.totalPending.toLocaleString('es-MX')}
                          </strong>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                      {canManageFinances && (
                        <button
                          type="button"
                          onClick={() => handleOpenPlanDrawer(row.student)}
                          className={`w-full sm:w-auto px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer ${!hasPlan ? 'col-span-2' : ''}`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 hidden sm:inline-block" />
                          <span>{hasPlan ? 'Modificar Plan' : 'Generar Plan'}</span>
                        </button>
                      )}

                      {hasPlan && (
                        <button
                          type="button"
                          onClick={() => handleOpenInstallmentsDrawer(row.student)}
                          className="w-full sm:w-auto px-4 py-2 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 text-center cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 hidden sm:inline-block" />
                          <span>Ver Cuotas ({row.paidCount}/{row.totalInstallments})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FEE PLAN TEMPLATES (SCROLLABLE) */}
      {activeTab === 'templates' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 custom-scrollbar animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-forest/10">
            <div>
              <h3 className="font-bold text-forest text-sm font-display">Plantillas Base por Ambiente</h3>
              <p className="text-xs text-muted-foreground">
                Configura los conceptos predeterminados, meses de colegiatura, días de corte y porcentaje de mora.
              </p>
            </div>

            {canManageFinances && (
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateModalOpen(true);
                }}
                className="hidden sm:flex px-4 py-2 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all items-center gap-1.5 hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Plantilla de Plan</span>
              </button>
            )}
          </div>

          {/* Floating Round FAB on Mobile when Plantillas tab is active */}
          {canManageFinances && (
            <button
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setTemplateModalOpen(true);
              }}
              className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-forest text-white shadow-xl hover:bg-forest-light active:scale-95 transition-all flex items-center justify-center border-2 border-white/20 cursor-pointer"
              title="Nueva Plantilla de Plan"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="bg-white rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest/5 text-forest border border-forest/10">
                        Ciclo {tmpl.schoolYear} • {tmpl.environmentStage}
                      </span>
                      <h3 className="font-bold text-forest text-lg font-display mt-1">
                        {tmpl.name}
                      </h3>
                      {tmpl.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tmpl.description}
                        </p>
                      )}
                    </div>

                    {canManageFinances && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplate(tmpl);
                            setTemplateModalOpen(true);
                          }}
                          className="p-2 text-forest/70 hover:text-forest hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
                          title="Editar Plantilla"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar Plantilla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Cutoff & Late Fee Badges */}
                  <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950">
                      <span className="text-[9px] text-amber-800 block uppercase font-bold">Cuotas</span>
                      <strong>{tmpl.defaultInstallmentsCount || 10} meses</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950">
                      <span className="text-[9px] text-blue-700 block uppercase font-bold">Corte</span>
                      <strong>Día {tmpl.invoiceCutDay || 4}</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950">
                      <span className="text-[9px] text-blue-700 block uppercase font-bold">Límite</span>
                      <strong>Día {tmpl.dueDayLimit || 7}</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-red-50/80 border border-red-200 text-red-950">
                      <span className="text-[9px] text-red-700 block uppercase font-bold">Recargo</span>
                      <strong>+{tmpl.lateFeePct || 10}%</strong>
                    </div>
                  </div>

                  {/* Items in Template */}
                  <div className="space-y-2 pt-2 border-t border-forest/10">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Conceptos Incluidos:
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {tmpl.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-cream/40 border border-forest/5">
                          <span className="font-semibold text-forest">
                            {it.conceptName} {it.quantity > 1 && `(${it.quantity} cuotas)`}
                          </span>
                          <strong className="font-mono text-forest">
                            ${(Number(it.baseAmount) || 0).toLocaleString('es-MX')} {it.quantity > 1 ? 'c/u' : ''}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Discounts settings */}
                <div className="grid grid-cols-2 gap-2 pt-3 text-[11px] text-muted-foreground border-t border-forest/10">
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="font-bold text-amber-900 block">Pago Contado Batch:</span>
                    <strong className="text-amber-950 font-bold font-mono">-{tmpl.batchDiscountPct}% descuento</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="font-bold text-emerald-900 block">Pronto Pago:</span>
                    <strong className="text-emerald-950 font-bold font-mono">-{tmpl.promptPaymentDiscountPct}% (Día {tmpl.promptPaymentDayLimit})</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FEE CONCEPTS (SCROLLABLE) */}
      {activeTab === 'concepts' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 custom-scrollbar animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-forest/10">
            <div>
              <h3 className="font-bold text-forest text-sm font-display">Catálogo de Conceptos de Cobro</h3>
              <p className="text-xs text-muted-foreground">
                Rubros y servicios estándar del colegio (Colegiaturas, Matrículas, Materiales, Talleres, Comedor, etc.).
              </p>
            </div>

            {canManageFinances && (
              <button
                type="button"
                onClick={() => {
                  setEditingConcept(null);
                  setConceptDrawerOpen(true);
                }}
                className="hidden sm:flex px-4 py-2 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all items-center gap-1.5 hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Concepto de Cobro</span>
              </button>
            )}
          </div>

          {/* Floating Round FAB on Mobile when Conceptos tab is active */}
          {canManageFinances && (
            <button
              type="button"
              onClick={() => {
                setEditingConcept(null);
                setConceptDrawerOpen(true);
              }}
              className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-forest text-white shadow-xl hover:bg-forest-light active:scale-95 transition-all flex items-center justify-center border-2 border-white/20 cursor-pointer"
              title="Nuevo Concepto de Cobro"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {concepts.map(c => (
              <div key={c.id} className="bg-white rounded-3xl p-5 border border-forest/10 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground font-mono">
                      {c.code || c.category}
                    </span>
                    <span className="text-[10px] bg-forest/5 px-2 py-0.5 rounded text-forest font-semibold">
                      {c.frequency}
                    </span>
                  </div>
                  <h4 className="font-bold text-forest text-base font-display">{c.name}</h4>
                  {c.description && (
                    <p className="text-[11px] text-muted-foreground">{c.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-forest/10">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Monto Base</span>
                    <strong className="text-forest text-base font-bold font-mono">
                      ${c.defaultAmount.toLocaleString('es-MX')}
                    </strong>
                  </div>

                  {canManageFinances && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingConcept(c);
                          setConceptDrawerOpen(true);
                        }}
                        className="p-2 text-forest/70 hover:text-forest hover:bg-forest/5 rounded-lg transition-colors cursor-pointer"
                        title="Editar Concepto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConcept(c.id, c.name)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Concepto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRAWERS & ASIDES */}
      <FeePlanTemplateDrawer
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        template={editingTemplate}
        concepts={concepts}
        onSaved={() => loadAllData()}
      />

      <CustomFeePlanDrawer
        isOpen={planDrawerOpen}
        onClose={() => setPlanDrawerOpen(false)}
        student={selectedStudentForPlan}
        onPlanCreated={() => loadAllData()}
      />

      <InstallmentsManagerDrawer
        isOpen={installmentsDrawerOpen}
        onClose={() => setInstallmentsDrawerOpen(false)}
        student={selectedStudentForInstallments}
        onPaymentRecorded={() => loadAllData()}
        readOnly={!canManageFinances}
      />

      <FeeConceptDrawer
        isOpen={conceptDrawerOpen}
        onClose={() => setConceptDrawerOpen(false)}
        concept={editingConcept}
        onSaved={() => loadAllData()}
      />

    </div>
  );
};

export default FinancesSection;

