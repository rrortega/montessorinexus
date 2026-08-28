import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Send,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Users,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock3,
  FileText,
  Sparkles,
  Building2,
  Layers,
  MoreVertical,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Copy,
  ChevronRight,
  HelpCircle,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAuth } from '@/context/AuthContext';
import {
  NewsletterItem,
  getNewsletters,
  deleteNewsletter,
  sendNewsletterNow,
  cancelScheduledNewsletter,
  createNewsletter
} from '@/lib/sqlite';
import { NewsletterEditorDrawer } from '@/components/admin/NewsletterEditorDrawer';
import { NewsletterPreviewModal } from '@/components/admin/NewsletterPreviewModal';
import { MobileMenuButton } from './AdminDashboard';

export const NewslettersSection: React.FC = () => {
  const confirm = useConfirm();
  const { activeMembership, role } = useAuth();
  const isSuperAdmin = role === 'OWNER' || role === 'ADMIN';
  const hasWritePermission = isSuperAdmin || activeMembership?.permissions?.includes('newsletters:write') || activeMembership?.permissions?.includes('newsletters');
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'SCHEDULED' | 'DRAFT'>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Drawer and Preview Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newsletterToEdit, setNewsletterToEdit] = useState<NewsletterItem | null>(null);
  const [previewNewsletter, setPreviewNewsletter] = useState<NewsletterItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getNewsletters({
        status: statusFilter,
        search: search.trim() || undefined
      });
      setNewsletters(data || []);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar boletines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = newsletters.length;
    const sent = newsletters.filter(n => n.status === 'SENT').length;
    const scheduled = newsletters.filter(n => n.status === 'SCHEDULED').length;
    const drafts = newsletters.filter(n => n.status === 'DRAFT').length;
    const totalDelivered = newsletters.reduce((acc, n) => acc + (n.deliveredCount || 0), 0);
    return { total, sent, scheduled, drafts, totalDelivered };
  }, [newsletters]);

  const handleCreateNew = () => {
    setNewsletterToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (item: NewsletterItem) => {
    setNewsletterToEdit(item);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (item: NewsletterItem) => {
    const confirmed = await confirm({
      title: '¿Eliminar Boletín?',
      message: `¿Estás seguro de que deseas eliminar permanentemente el boletín "${item.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await deleteNewsletter(item.id);
      toast.success('Boletín eliminado correctamente');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar boletín');
    }
  };

  const handleSendNow = async (item: NewsletterItem) => {
    const confirmed = await confirm({
      title: '¿Despachar Boletín Ahora?',
      message: `¿Deseas iniciar el envío inmediato de "${item.title}" a todos sus destinatarios calculados?`,
      confirmText: 'Sí, enviar ahora',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;

    try {
      await sendNewsletterNow(item.id);
      toast.success('Envío de boletín iniciado en segundo plano.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar boletín');
    }
  };

  const handleCancelSchedule = async (item: NewsletterItem) => {
    try {
      await cancelScheduledNewsletter(item.id);
      toast.success('Programación cancelada. El boletín quedó como borrador.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar programación');
    }
  };

  const handleDuplicate = async (item: NewsletterItem) => {
    try {
      await createNewsletter({
        title: `${item.title} (Copia)`,
        subject: item.subject ? `${item.subject} (Copia)` : undefined,
        preheader: item.preheader,
        contentHtml: item.contentHtml,
        contentJson: item.contentJson,
        coverImageUrl: item.coverImageUrl,
        authorName: item.authorName,
        targetType: item.targetType,
        targetAudience: item.targetAudience,
        targetEnvironmentIds: item.targetEnvironmentIds,
        specificEmails: item.specificEmails,
        status: 'DRAFT'
      });
      toast.success('Boletín duplicado exitosamente.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al duplicar boletín');
    }
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300 pb-16">

      {/* HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 pt-3.5 pb-5 sm:py-6 text-white shadow-md space-y-3 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="hidden md:flex shrink-0 w-12 h-12 rounded-2xl bg-white/10 items-center justify-center border border-white/20 shadow-inner">
              <Mail className="w-6 h-6 text-white " />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                  Boletines & Comunicados
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                Crea, diseña y programa comunicados oficiales y boletines para toda la escuela, salones o listas de contacto.
              </p>
            </div>
          </div>

          {hasWritePermission && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCreateNew}
                className="px-4 py-2.5 bg-white hover:bg-white/90 text-forest rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-forest" />
                <span>Nuevo Boletín</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider block">Total Boletines</span>
            <span className="font-display text-xl sm:text-2xl font-black text-white">{stats.total}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">Enviados</span>
            <span className="font-display text-xl sm:text-2xl font-black text-emerald-300">{stats.sent}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block">Programados</span>
            <span className="font-display text-xl sm:text-2xl font-black text-amber-300">{stats.scheduled}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider block">Borradores</span>
            <span className="font-display text-xl sm:text-2xl font-black text-white">{stats.drafts}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-3xl p-4 border border-forest/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar boletín..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-forest/20 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>

        {/* Status Custom Select */}
        <div className="relative shrink-0 w-full sm:w-48 z-20">
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="w-full px-4 py-2 bg-white border border-forest/20 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-between shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <span>
              Filtrar: {
                statusFilter === 'ALL' ? 'Todos' :
                statusFilter === 'SENT' ? 'Enviados' :
                statusFilter === 'SCHEDULED' ? 'Programados' :
                'Borradores'
              }
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsFilterDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-slate-100 rounded-2xl shadow-lg p-1.5 z-20 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {[
                  { key: 'ALL', label: 'Todos' },
                  { key: 'SENT', label: 'Enviados' },
                  { key: 'SCHEDULED', label: 'Programados' },
                  { key: 'DRAFT', label: 'Borradores' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(opt.key as any);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === opt.key
                        ? 'bg-forest/5 text-forest'
                        : 'text-muted-foreground hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* NEWSLETTERS LIST */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-forest/10 shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-forest mx-auto" />
          <p className="text-xs text-muted-foreground">Cargando boletines...</p>
        </div>
      ) : newsletters.length === 0 ? (
        <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-forest/10 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto border border-forest/10 shadow-2xs">
            <Mail className="w-7 h-7 text-forest" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-display font-bold text-forest text-base">No hay boletines para mostrar</h3>
            <p className="text-xs text-muted-foreground">
              Comienza creando tu primer boletín o comunicado para mantener informada a la comunidad escolar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Boletín</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {newsletters.map(item => {
            const isSent = item.status === 'SENT';
            const isScheduled = item.status === 'SCHEDULED';
            const isDraft = item.status === 'DRAFT';
            const isSending = item.status === 'SENDING';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-forest/15 hover:border-forest/30 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Section: Info & Title */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isSent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1 border border-emerald-200 uppercase tracking-wider">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Enviado</span>
                      </span>
                    )}
                    {isScheduled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold flex items-center gap-1 border border-amber-200 uppercase tracking-wider">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Programado: {item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </span>
                    )}
                    {isDraft && (
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[9px] font-bold flex items-center gap-1 border border-stone-200 uppercase tracking-wider">
                        <FileText className="w-2.5 h-2.5" />
                        <span>Borrador</span>
                      </span>
                    )}
                    {isSending && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-bold flex items-center gap-1 border border-blue-200 animate-pulse uppercase tracking-wider">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Enviando...</span>
                      </span>
                    )}

                    <span className="text-[10px] text-muted-foreground">
                      Por {item.authorName || 'Dirección'} • {new Date(item.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-forest text-sm md:text-base leading-snug">
                    {item.title}
                  </h3>

                  {/* Inline metadata details */}
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-forest">Destinatarios:</span>
                      <span>
                        {item.targetType === 'ALL_SCHOOL' && 'Toda la Escuela'}
                        {item.targetType === 'ENVIRONMENTS' && `${(item.targetEnvironmentIds as any[])?.length || 0} Salones`}
                        {item.targetType === 'STAFF_ONLY' && 'Solo Staff & Guías'}
                        {item.targetType === 'SPECIFIC_CONTACTS' && 'Lista de Contactos'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-forest/70" />
                      <span>
                        <span className="font-bold text-forest">{item.totalRecipients || 0}</span> destinatarios
                        {isSent && (
                          <span className="text-emerald-700 font-bold ml-1">
                            ({item.deliveredCount || 0} ent.)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100 justify-between md:justify-end w-full md:w-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPreviewNewsletter(item)}
                    className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    title="Ver vista previa"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>

                  {hasWritePermission && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{isSent ? 'Ver' : 'Editar'}</span>
                      </button>

                      {(isDraft || isScheduled) && (
                        <button
                          type="button"
                          onClick={() => handleSendNow(item)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>
                      )}

                      {isScheduled && (
                        <button
                          type="button"
                          onClick={() => handleCancelSchedule(item)}
                          className="px-2.5 py-1.5 rounded-xl text-amber-800 hover:bg-amber-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Cancelar programación y regresar a borrador"
                        >
                          <Clock3 className="w-3.5 h-3.5" />
                          <span>Pausar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDuplicate(item)}
                        className="p-2 text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-xl transition-all cursor-pointer"
                        title="Duplicar boletín"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Eliminar boletín"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* PREVIEW MODAL */}
      <NewsletterPreviewModal
        isOpen={!!previewNewsletter}
        onClose={() => setPreviewNewsletter(null)}
        newsletter={previewNewsletter}
        onEdit={handleEdit}
      />

      {/* EDITOR DRAWER */}
      <NewsletterEditorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaved={loadData}
        newsletterToEdit={newsletterToEdit}
      />

    </div>
  );
};
