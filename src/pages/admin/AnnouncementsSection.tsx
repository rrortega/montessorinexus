import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Plus,
  Search,
  Check,
  Edit,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Play,
  RotateCcw,
  CheckSquare,
  HelpCircle,
  Eye,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Sliders,
  ChevronLeft,
  ArrowRight,
  X,
  Users,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAuth } from '@/context/AuthContext';
import {
  AnnouncementItem,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getEnvironments
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { MobileMenuButton } from './AdminDashboard';

export const AnnouncementsSection: React.FC = () => {
  const confirm = useConfirm();
  const { activeMembership, role } = useAuth();
  const isSuperAdmin = role === 'OWNER' || role === 'ADMIN';
  const hasWritePermission = isSuperAdmin || activeMembership?.permissions?.includes('announcements:write') || activeMembership?.permissions?.includes('announcements');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'PARENTS' | 'STAFF' | 'ANY'>('ANY');
  const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);

  // Form Drawer wizard states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedViewersAnn, setSelectedViewersAnn] = useState<AnnouncementItem | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<AnnouncementItem | null>(null);

  // Form Fields states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'PARENTS' | 'STAFF'>('ALL');
  const [selectedEnvIds, setSelectedEnvIds] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(false);
  const [style, setStyle] = useState<'info' | 'warning' | 'danger' | 'success'>('info');
  const [isMarquee, setIsMarquee] = useState(false);
  const [isPeriodic, setIsPeriodic] = useState(false);
  const [periodicity, setPeriodicity] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [displayDurationHours, setDisplayDurationHours] = useState<number | null>(24);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [annsData, envsData] = await Promise.all([
        getAnnouncements(),
        getEnvironments()
      ]);
      setAnnouncements(annsData || []);
      setEnvironments(envsData || []);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar los anuncios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered announcements list
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase());

      const matchesAudience =
        audienceFilter === 'ANY' ||
        a.targetAudience === audienceFilter;

      return matchesSearch && matchesAudience;
    });
  }, [announcements, search, audienceFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = announcements.length;
    const active = announcements.filter(a => a.status === 'ACTIVE').length;
    const periodic = announcements.filter(a => a.isPeriodic).length;
    const emailSent = announcements.filter(a => a.sendEmail).length;
    return { total, active, periodic, emailSent };
  }, [announcements]);

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setStep(1);
    setTitle('');
    setContent('');
    setTargetAudience('ALL');
    setSelectedEnvIds([]);
    setSendEmail(false);
    setStyle('info');
    setIsMarquee(false);
    setIsPeriodic(false);
    setPeriodicity(null);
    setDisplayDurationHours(24);

    // Set default dates formatted for datetime-local (YYYY-MM-DDTHH:mm)
    const localNow = new Date();
    localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
    setStartDate(localNow.toISOString().slice(0, 16));
    setEndDate('');

    setStatus('ACTIVE');
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditingAnnouncement(item);
    setStep(1);
    setTitle(item.title);
    setContent(item.content);
    setTargetAudience(item.targetAudience);
    setSelectedEnvIds(item.targetEnvironmentIds || []);
    setSendEmail(item.sendEmail);
    setStyle(item.style);
    setIsMarquee(item.isMarquee);
    setIsPeriodic(item.isPeriodic);
    setPeriodicity(item.periodicity);
    setDisplayDurationHours(item.displayDurationHours || 24);

    const fmtDate = (dStr: string) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    setStartDate(fmtDate(item.startDate));
    setEndDate(item.endDate ? fmtDate(item.endDate) : '');

    setStatus(item.status);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (item: AnnouncementItem) => {
    const ok = await confirm({
      title: '¿Eliminar Anuncio?',
      message: `¿Estás seguro de que deseas eliminar permanentemente el anuncio "${item.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await deleteAnnouncement(item.id);
      toast.success('Anuncio eliminado con éxito');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar anuncio');
    }
  };

  const handleToggleStatus = async (item: AnnouncementItem) => {
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateAnnouncement(item.id, { status: newStatus });
      toast.success(`Anuncio marcado como ${newStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el estado');
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        toast.error('Por favor escribe un título para el anuncio.');
        return;
      }
      // Content can be rich text HTML; make sure it contains text/content
      const textOnly = content.replace(/<[^>]*>/g, '').trim();
      if (!textOnly) {
        toast.error('Por favor escribe un mensaje para el anuncio.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement && step < 3) {
      handleNextStep();
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error('Por favor completa el título y el mensaje del anuncio.');
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<AnnouncementItem> = {
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        targetEnvironmentIds: selectedEnvIds.length > 0 ? selectedEnvIds : null,
        sendEmail,
        style,
        isMarquee,
        isPeriodic,
        periodicity: isPeriodic ? periodicity : null,
        displayDurationHours: isPeriodic ? Number(displayDurationHours) : null,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: (!isPeriodic && endDate) ? new Date(endDate).toISOString() : null,
        status
      };

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, payload);
        toast.success('Anuncio actualizado con éxito');
      } else {
        await createAnnouncement(payload);
        toast.success('Anuncio creado y publicado con éxito');
      }
      setIsDrawerOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el anuncio');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnvironment = (envId: string) => {
    setSelectedEnvIds(prev =>
      prev.includes(envId) ? prev.filter(id => id !== envId) : [...prev, envId]
    );
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
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                  Anuncios & Banners
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                Publica anuncios importantes que aparecerán inmediatamente en el panel superior (marquesinas o banners) según la audiencia.
              </p>
            </div>
          </div>

          {hasWritePermission && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="hidden md:flex px-4 py-2.5 bg-white hover:bg-white/90 text-forest rounded-xl font-bold text-xs items-center shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <span>Nuevo Anuncio</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider block">Total Creados</span>
            <span className="font-display text-xl sm:text-2xl font-black text-white">{stats.total}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">Activos en Pantalla</span>
            <span className="font-display text-xl sm:text-2xl font-black text-emerald-300">{stats.active}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block">Programaciones Periódicas</span>
            <span className="font-display text-xl sm:text-2xl font-black text-amber-300">{stats.periodic}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <span className="text-[11px] font-bold text-sky-200 uppercase tracking-wider block">Notificados x Email</span>
            <span className="font-display text-xl sm:text-2xl font-black text-sky-300">{stats.emailSent}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-3xl p-4 border border-forest/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar anuncio..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-forest/20 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>

        {/* Audience Custom Select Dropdown */}
        <div className="relative shrink-0 w-full sm:w-48 z-20">
          <button
            type="button"
            onClick={() => setIsAudienceDropdownOpen(!isAudienceDropdownOpen)}
            className="w-full px-4 py-2 bg-white border border-forest/20 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-between shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <span>
              Filtrar: {
                audienceFilter === 'ANY' ? 'Todos' :
                audienceFilter === 'ALL' ? 'Toda la Escuela' :
                audienceFilter === 'PARENTS' ? 'Padres / Tutores' :
                'Docentes / Staff'
              }
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isAudienceDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAudienceDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsAudienceDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-slate-100 rounded-2xl shadow-lg p-1.5 z-20 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {[
                  { key: 'ANY', label: 'Todos' },
                  { key: 'ALL', label: 'Toda la Escuela' },
                  { key: 'PARENTS', label: 'Padres / Tutores' },
                  { key: 'STAFF', label: 'Docentes / Staff' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setAudienceFilter(opt.key as any);
                      setIsAudienceDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      audienceFilter === opt.key
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

      {/* LISTING ANNOUNCEMENTS */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-forest/10 shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-forest mx-auto" />
          <p className="text-xs text-muted-foreground">Cargando anuncios...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-forest/10 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto border border-forest/10 shadow-2xs">
            <Bell className="w-7 h-7 text-forest" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-display font-bold text-forest text-base">No hay anuncios configurados</h3>
            <p className="text-xs text-muted-foreground">
              Comienza publicando avisos o anuncios periódicos para mantener a los docentes y padres sintonizados.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Anuncio</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map(ann => {
            const isActive = ann.status === 'ACTIVE';
            const hasEnvironments = ann.targetEnvironmentIds && ann.targetEnvironmentIds.length > 0;

            return (
              <div
                key={ann.id}
                className="bg-white rounded-2xl p-4 border border-forest/15 hover:border-forest/30 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Section: Info & Title */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${ann.targetAudience === 'ALL' ? 'bg-forest/10 text-forest border-forest/20' :
                        ann.targetAudience === 'PARENTS' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                          'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                      {ann.targetAudience === 'ALL' && 'Toda la Escuela'}
                      {ann.targetAudience === 'PARENTS' && 'Padres'}
                      {ann.targetAudience === 'STAFF' && 'Docentes/Staff'}
                    </span>

                    {ann.isPeriodic ? (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Recurrente: {ann.periodicity === 'daily' ? 'Diario' : ann.periodicity === 'weekly' ? 'Semanal' : 'Mensual'} ({ann.displayDurationHours}h)</span>
                      </span>
                    ) : (
                      ann.endDate && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[9px] font-bold">
                          Cierre: {new Date(ann.endDate).toLocaleDateString()}
                        </span>
                      )
                    )}

                    <span className={`text-[10px] ${ann.style === 'info' ? 'text-blue-600' :
                        ann.style === 'success' ? 'text-emerald-600' :
                          ann.style === 'warning' ? 'text-amber-600' :
                            'text-red-600'
                      } font-bold capitalize`}>
                      • {ann.style === 'info' ? 'Informativo' : ann.style === 'success' ? 'Éxito' : ann.style === 'warning' ? 'Aviso' : 'Emergencia'}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-forest text-sm md:text-base leading-snug">
                    {ann.title}
                  </h3>

                  {/* Inline metadata details */}
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-forest/70" />
                      <span>Correo: <span className="font-bold text-forest">{ann.sendEmail ? 'Sí' : 'No'}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-forest/70" />
                      <span>
                        Ambientes:{' '}
                        <span className="font-bold text-forest">
                          {hasEnvironments ? `${ann.targetEnvironmentIds?.length} sel.` : 'Todos'}
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedViewersAnn(ann)}
                      className="flex items-center gap-1 hover:text-purple-800 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-forest/70" />
                      <span>
                        Vistas:{' '}
                        <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 ml-0.5">
                          {ann.views?.length || 0}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Right Section: Status & Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100 justify-between md:justify-end w-full md:w-auto">
                  <button
                    type="button"
                    disabled={!hasWritePermission}
                    onClick={() => handleToggleStatus(ann)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                      } ${!hasWritePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isActive ? 'Activo' : 'Inactivo'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewAnnouncement(ann)}
                      className="px-3.5 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>

                    {hasWritePermission && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ann)}
                          className="px-3.5 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(ann)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Eliminar Anuncio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER FORM */}
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingAnnouncement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
        description="Publica alertas con formato enriquecido, informativos o banners periódicos en los paneles del colegio."
      >
        <div className="space-y-6">

          {/* Stepper indicator progress bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!editingAnnouncement && s > step}
                  onClick={() => setStep(s as any)}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-forest' : 'bg-forest/10'
                    } ${editingAnnouncement ? 'cursor-pointer hover:bg-forest/60' : 'cursor-default'}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {[
                { s: 1, label: '1. Mensaje' },
                { s: 2, label: '2. Destinatarios' },
                { s: 3, label: '3. Publicación' }
              ].map(item => (
                <button
                  key={item.s}
                  type="button"
                  disabled={!editingAnnouncement && item.s > step}
                  onClick={() => setStep(item.s as any)}
                  className={`font-black uppercase tracking-wider transition-colors ${step === item.s ? 'text-forest' : 'text-muted-foreground'
                    } ${editingAnnouncement ? 'cursor-pointer hover:text-forest' : 'cursor-default'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">

            {/* STEP 1: MESSAGE WRITING */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">Título del Anuncio *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Suspensión de Labores por Lluvia"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>

                {/* Message Rich Text Editor */}
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">Contenido del Anuncio (Mensaje corto) *</label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Redacta el contenido con texto enriquecido, negritas, enlaces o listas..."
                      minHeight="200px"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: RECIPIENTS & FILTERS */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">¿Para quién es este Anuncio?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'ALL', label: 'Todos' },
                      { key: 'PARENTS', label: 'Padres / Tutores' },
                      { key: 'STAFF', label: 'Docentes / Staff' }
                    ].map(aud => (
                      <button
                        key={aud.key}
                        type="button"
                        onClick={() => setTargetAudience(aud.key as any)}
                        className={`py-2 px-3 border text-xs font-bold rounded-xl text-center transition-all cursor-pointer ${targetAudience === aud.key
                            ? 'bg-forest border-forest text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        {aud.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Environments Selector */}
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Vincular a Ambientes / Salones Específicos
                  </label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Si no seleccionas ninguno, se mostrará a todos los involucrados de manera global.
                  </p>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-2 bg-slate-50/50">
                    {environments.map(env => {
                      const isChecked = selectedEnvIds.includes(env.id);
                      return (
                        <button
                          key={env.id}
                          type="button"
                          onClick={() => toggleEnvironment(env.id)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60 hover:bg-slate-50 text-left text-xs transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: env.color || '#1b3b2b' }} />
                            <span className="font-semibold text-slate-700 truncate">{env.name}</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-forest border-forest text-white' : 'border-slate-300'
                            }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Send email toggle */}
                <div className="p-3 bg-forest/5 border border-forest/10 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-forest block">Notificación por Correo Electrónico</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Envía una copia de este anuncio al correo de los destinatarios involucrados.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendEmail(!sendEmail)}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${sendEmail ? 'bg-forest' : 'bg-slate-300'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${sendEmail ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PRESENTATION & LIFETIME */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Banner Style */}
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">Estilo Visual (Color de Alerta)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'info', label: 'Informativo', colorClass: 'border-blue-200 bg-blue-50 text-blue-800' },
                      { key: 'success', label: 'Éxito', colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
                      { key: 'warning', label: 'Aviso', colorClass: 'border-amber-200 bg-amber-50 text-amber-900' },
                      { key: 'danger', label: 'Emergencia', colorClass: 'border-red-200 bg-red-50 text-red-800' }
                    ].map(s => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setStyle(s.key as any)}
                        className={`p-2 border text-[10px] font-bold rounded-xl text-center transition-all cursor-pointer ${style === s.key
                            ? 'ring-2 ring-forest/30 scale-102 ' + s.colorClass
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marquee scroll toggle */}
                <div className="p-3 bg-forest/5 border border-forest/10 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-forest block">Marquesina (Texto en Movimiento)</span>
                    <span className="text-[10px] text-muted-foreground block">
                      El banner se desplazará lateralmente como un marquesina dinámica.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMarquee(!isMarquee)}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${isMarquee ? 'bg-forest' : 'bg-slate-300'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${isMarquee ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                  </button>
                </div>

                {/* Periodic/Recurring Toggle */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-200/60 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-indigo-950 block">Anuncio Periódico / Recurrente</span>
                    <span className="text-[10px] text-indigo-900/70 block">
                      Configura si el anuncio corre con ciclos automáticos de presentación.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPeriodic(!isPeriodic);
                      if (!isPeriodic && !periodicity) {
                        setPeriodicity('daily');
                      }
                    }}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${isPeriodic ? 'bg-indigo-700' : 'bg-slate-300'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${isPeriodic ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                  </button>
                </div>

                {/* Periodic settings or date bounds */}
                {isPeriodic ? (
                  <div className="p-4 bg-indigo-50/30 border border-indigo-200/50 rounded-2xl space-y-3.5 animate-in slide-in-from-top duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-950 mb-1.5">Periodicidad</label>
                        <div className="grid grid-cols-3 gap-1 bg-white border border-indigo-100 p-0.5 rounded-xl">
                          {[
                            { key: 'daily', label: 'Diario' },
                            { key: 'weekly', label: 'Semanal' },
                            { key: 'monthly', label: 'Mensual' }
                          ].map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setPeriodicity(opt.key as any)}
                              className={`py-1.5 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${periodicity === opt.key
                                  ? 'bg-indigo-700 text-white shadow-2xs'
                                  : 'text-indigo-950 hover:bg-slate-50'
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-indigo-950 mb-1.5">Tiempo Presentación</label>
                        <div className="grid grid-cols-3 gap-1 bg-white border border-indigo-100 p-0.5 rounded-xl">
                          {[
                            { key: 24, label: '24 Hrs' },
                            { key: 48, label: '48 Hrs' },
                            { key: 72, label: '72 Hrs' }
                          ].map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setDisplayDurationHours(opt.key)}
                              className={`py-1.5 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${(displayDurationHours || 24) === opt.key
                                  ? 'bg-indigo-700 text-white shadow-2xs'
                                  : 'text-indigo-950 hover:bg-slate-50'
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-forest/5 border border-forest/10 rounded-2xl space-y-3.5 animate-in slide-in-from-top duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-forest mb-1">Fecha de Inicio *</label>
                        <input
                          type="datetime-local"
                          required
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-forest"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-forest mb-1">Fecha de Cierre (Cierre definitivo)</label>
                        <input
                          type="datetime-local"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-forest"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status active/inactive toggler */}
                <div className="p-3 bg-forest/5 border border-forest/10 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-forest block">Estado del Anuncio (Publicado)</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Habilita o deshabilita este anuncio en los tableros de manera inmediata.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${status === 'ACTIVE' ? 'bg-forest' : 'bg-slate-300'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                  </button>
                </div>
              </div>
            )}

            {/* Stepper Navigation Footer Buttons */}
            <div className="pt-6 border-t border-forest/10 flex items-center justify-between">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 text-xs font-bold text-forest hover:bg-forest/5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                {editingAnnouncement ? (
                  <>
                    {step < 3 && (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-5 py-2.5 bg-forest/10 hover:bg-forest/20 text-forest rounded-xl font-bold text-xs transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5"
                    >
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Guardar Cambios</span>
                    </button>
                  </>
                ) : (
                  step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5"
                    >
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Publicar Anuncio</span>
                    </button>
                  )
                )}
              </div>
            </div>

          </form>
        </div>
      </SlideOverDrawer>

      {/* VIEWERS MODAL */}
      {selectedViewersAnn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 max-w-md w-full relative shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-forest" />
                <h3 className="font-display font-bold text-forest text-base">Impacto & Vistas</h3>
              </div>
              <button
                onClick={() => setSelectedViewersAnn(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Lista de personas que abrieron y leyeron el anuncio <strong>"{selectedViewersAnn.title}"</strong>.
            </p>

            <div className="overflow-y-auto custom-scrollbar space-y-2 flex-1 pr-1">
              {!selectedViewersAnn.views || selectedViewersAnn.views.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Nadie ha visto este anuncio aún.
                </div>
              ) : (
                selectedViewersAnn.views.map((v, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block">{v.user.fullName || 'Usuario'}</span>
                      <span className="text-[10px] text-muted-foreground block">{v.user.email}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(v.viewedAt).toLocaleDateString()} {new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) on Mobile */}
      {hasWritePermission && (
        <button
          type="button"
          onClick={handleOpenCreate}
          className="md:hidden fixed bottom-6 right-6 w-12 h-12 bg-forest text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer z-40 border border-forest/20"
          title="Nuevo Anuncio"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      )}

      {/* DETAILED ANNOUNCEMENT PREVIEW MODAL */}
      {previewAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full relative shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header de Color Entero que representa la urgencia */}
            <div className={`w-full py-6 flex flex-col items-center justify-center relative text-white ${
              previewAnnouncement.style === 'warning' ? 'bg-amber-500' :
              previewAnnouncement.style === 'danger' ? 'bg-red-600' :
              previewAnnouncement.style === 'success' ? 'bg-emerald-600' :
              'bg-blue-600'
            }`}>
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="absolute top-4 right-4 p-1.5 bg-black/10 hover:bg-black/20 rounded-full text-white/90 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>

              {/* Centered Icon */}
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs border border-white/30 shadow-inner mb-2">
                {previewAnnouncement.style === 'warning' && <AlertCircle className="w-7 h-7 text-white" />}
                {previewAnnouncement.style === 'danger' && <AlertTriangle className="w-7 h-7 text-white" />}
                {previewAnnouncement.style === 'success' && <CheckCircle2 className="w-7 h-7 text-white" />}
                {previewAnnouncement.style === 'info' && <Bell className="w-7 h-7 text-white" />}
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2.5 py-0.5 rounded-full border border-white/20">
                {previewAnnouncement.style === 'warning' && 'Aviso Importante'}
                {previewAnnouncement.style === 'danger' && 'Alerta de Emergencia'}
                {previewAnnouncement.style === 'success' && 'Aviso de Éxito'}
                {previewAnnouncement.style === 'info' && 'Comunicado'}
              </span>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col flex-1 overflow-hidden">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-display font-black text-forest text-lg leading-snug">
                  {previewAnnouncement.title}
                </h3>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 min-h-[150px]">
                <div 
                  className="text-sm sm:text-base text-slate-700 leading-relaxed rich-text-preview space-y-3 whitespace-pre-wrap font-medium"
                  dangerouslySetInnerHTML={{ __html: previewAnnouncement.content }}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                <button
                  onClick={() => setPreviewAnnouncement(null)}
                  className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer hover:scale-102"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
