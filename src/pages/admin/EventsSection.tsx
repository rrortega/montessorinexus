import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
 Calendar as CalendarIcon,
 Clock,
 MapPin,
 Users,
 Sparkles,
 Plus,
 Search,
 Filter,
 Layers,
 ChevronLeft,
 ChevronRight,
 Building2,
 GraduationCap,
 HeartHandshake,
 Image as ImageIcon,
 CheckCircle2,
 Trash2,
 Edit,
 Tag,
 X,
 CalendarCheck,
 UserCheck,
 UserPlus,
 Phone,
 Mail,
 MessageCircle,
 ExternalLink,
 RotateCcw,
 Check,
 AlertCircle,
 XCircle,
 UserX,
 CalendarDays
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
 SchoolEventItem,
 EventCategoryItem,
 EnvironmentItem,
 EventBookingItem,
 getSchoolEvents,
 getEventCategories,
 getEnvironments,
 getGuides,
 getTutors,
 deleteSchoolEvent,
 cancelSchoolEventBooking,
 updateSchoolEventBooking
} from '@/lib/sqlite';
import { EventFormDrawer } from '@/components/admin/EventFormDrawer';
import { EventDetailDrawer } from '@/components/admin/EventDetailDrawer';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';

type ViewMode = 'calendar' | 'bookings';

interface AggregatedBooking {
 booking: EventBookingItem;
 event: SchoolEventItem;
 slot?: {
 id: string;
 startTime: string;
 endTime: string;
 };
 isEnrolledFamily: boolean;
}

export const EventsSection: React.FC = () => {
 const { role, user, userEmail, activeMembership } = useAuth();
 const confirm = useConfirm();
 const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN';
 const isStaff = role === 'OWNER' || role === 'ADMIN' || role === 'TEACHER' || role === 'STAFF';
 const isTeacherOrStaff = role === 'TEACHER' || role === 'STAFF';
 const isTutor = role === 'TUTOR';
 const permissions: string[] = (activeMembership as any)?.permissions || [];

 const canCreateEvents = isOwnerOrAdmin || permissions.includes('events:write') || permissions.includes('events');
 const canViewAllBookings = isOwnerOrAdmin || permissions.includes('events:write') || permissions.includes('bookings:read') || permissions.includes('bookings:write') || permissions.includes('events:read_all');
 const hasGlobalEventsPermission = isOwnerOrAdmin || permissions.includes('events:read') || permissions.includes('events:write') || permissions.includes('events');

 const [events, setEvents] = useState<SchoolEventItem[]>([]);
 const [categories, setCategories] = useState<EventCategoryItem[]>([]);
 const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
 const [guides, setGuides] = useState<any[]>([]);
 const [tutors, setTutors] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 // View Mode: 'calendar' | 'bookings'
 const [viewMode, setViewMode] = useState<ViewMode>('calendar');

 // Filters for Calendar
 const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
 const [selectedEnvId, setSelectedEnvId] = useState<string>('ALL');
 const [search, setSearch] = useState('');
 const [isSearchExpanded, setIsSearchExpanded] = useState(false);
 const searchInputRef = useRef<HTMLInputElement>(null);

 // Filters for Bookings View
 const [bookingSearch, setBookingSearch] = useState('');
 const [bookingEventFilter, setBookingEventFilter] = useState<string>('ALL');
 const [bookingParticipantFilter, setBookingParticipantFilter] = useState<'ALL' | 'ENROLLED' | 'GUEST'>('ALL');
 const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');

 // Calendar Navigation & Selected Day for Mobile
 const [currentDate, setCurrentDate] = useState(new Date());
 const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

 // Drawers
 const [formDrawerOpen, setFormDrawerOpen] = useState(false);
 const [editingEvent, setEditingEvent] = useState<SchoolEventItem | null>(null);

 const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
 const [selectedDetailEvent, setSelectedDetailEvent] = useState<SchoolEventItem | null>(null);

 const myGuide = useMemo(() => {
 if (!isStaff) return null;
 return guides.find(g => 
 (user?.id && g.id === user.id) || 
 (userEmail && g.email?.toLowerCase() === userEmail.toLowerCase())
 );
 }, [guides, isStaff, user, userEmail]);

 const teacherEnvIds = useMemo(() => {
 if (hasGlobalEventsPermission) return environments.map(e => e.id);
 if (!isStaff) return [];
 const envIdsFromGuide = myGuide?.environments?.map((e: any) => e.id) || [];
 const envIdsFromEnvs = environments
 .filter(env => 
 env.guideIds?.includes(user?.id) ||
 env.guides?.some((g: any) => g.userId === user?.id) ||
 env.teachers?.some(t => 
 (user?.id && t.id === user.id) || 
 (userEmail && t.email?.toLowerCase() === userEmail.toLowerCase()) ||
 (myGuide?.id && t.id === myGuide.id)
 )
 )
 .map(env => env.id);
 return Array.from(new Set([...envIdsFromGuide, ...envIdsFromEnvs]));
 }, [hasGlobalEventsPermission, isStaff, myGuide, environments, user, userEmail]);

 const allowedEnvironments = useMemo(() => {
 if (hasGlobalEventsPermission) return environments;
 return environments.filter(env => teacherEnvIds.includes(env.id));
 }, [environments, hasGlobalEventsPermission, teacherEnvIds]);

 const loadAll = async () => {
 setLoading(true);
 try {
 const [evs, cats, envs, gds, tuts] = await Promise.all([
 getSchoolEvents(),
 getEventCategories(),
 getEnvironments(),
 getGuides().catch(() => []),
 getTutors().catch(() => [])
 ]);
 setEvents(evs);
 setCategories(cats);
 setEnvironments(envs);
 setGuides(gds);
 setTutors(tuts);

 // Keep selected detail event in sync with fresh data
 setSelectedDetailEvent(prev => {
 if (!prev) return null;
 return evs.find(e => e.id === prev.id) || null;
 });
 } catch (e: any) {
 console.error('Error loading events:', e);
 toast.error('Error al cargar eventos');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadAll();
 }, []);

 const handleOpenCreate = () => {
 if (!canCreateEvents) {
 toast.error('No tienes permisos asignados para programar eventos.');
 return;
 }
 setEditingEvent(null);
 setFormDrawerOpen(true);
 };

 const handleOpenEdit = (event: SchoolEventItem) => {
 setDetailDrawerOpen(false);
 setSelectedDetailEvent(null);
 setEditingEvent(event);
 setTimeout(() => {
 setFormDrawerOpen(true);
 }, 50);
 };

 const handleOpenDetail = (event: SchoolEventItem) => {
 setSelectedDetailEvent(event);
 setDetailDrawerOpen(true);
 };

  const handleDelete = async (id: string, title: string) => {
    const targetEvent = events.find(e => e.id === id);
    const activeBookings = targetEvent?.bookings?.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING') || [];
    
    if (activeBookings.length > 0) {
      toast.error(`No se puede eliminar el evento porque tiene ${activeBookings.length} reserva(s) activa(s). Primero cancela todas las reservas asociadas y luego elimina el evento.`);
      return;
    }

    // Confirmation is already handled by the child components (EventFormDrawer / EventDetailDrawer)
    // before they call this onDelete callback.

    try {
      await deleteSchoolEvent(id);
      toast.success('Evento eliminado correctamente');
      loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar evento');
    }
  };

 // Handle Cancel Booking
 const handleCancelBooking = async (eventId: string, bookingId: string, guestOrTutorName: string) => {
 const ok = await confirm({
 title: '¿Cancelar reserva?',
 message: `¿Estás seguro de cancelar la reserva de "${guestOrTutorName}"? Se liberará el horario en el calendario.`,
 confirmText: 'Sí, cancelar reserva',
 cancelText: 'Volver',
 variant: 'danger'
 });
 if (!ok) return;

 try {
 await cancelSchoolEventBooking(eventId, bookingId);
 toast.success('Reserva cancelada correctamente');
 loadAll();
 } catch (e: any) {
 toast.error(e.message || 'Error al cancelar la reserva');
 }
 };

 // Handle Change Booking Status
 const handleUpdateBookingStatus = async (eventId: string, bookingId: string, newStatus: string) => {
 try {
 await updateSchoolEventBooking(eventId, bookingId, { status: newStatus });
 toast.success(`Estado actualizado a ${newStatus}`);
 loadAll();
 } catch (e: any) {
 toast.error(e.message || 'Error al actualizar el estado');
 }
 };

 // Filtered Events for Calendar
 const filteredEvents = useMemo(() => {
 return events.filter(ev => {
 // 1. Teacher/Staff scoped salon filtering:
 if (!hasGlobalEventsPermission && isTeacherOrStaff) {
 const isGeneralOrStaff = ev.targetScope === 'ALL_SCHOOL' || ev.targetScope === 'STAFF' || (ev as any).targetScope === 'ALL' || (ev as any).targetScope === 'INTERNAL' || !ev.targetScope;
 const isHost = ev.hosts?.some(h => h.userId === user?.id || (userEmail && h.user?.email?.toLowerCase() === userEmail.toLowerCase()));
 const hasMyEnv = ev.targetScope === 'ENVIRONMENTS' && ev.targetEnvironments?.some(te => teacherEnvIds.includes(te.environment?.id));
 const hasMyStudent = ev.targetScope === 'STUDENTS' && ev.targetStudents?.some(ts => teacherEnvIds.includes(ts.student?.environmentId || ''));

 if (!isGeneralOrStaff && !isHost && !hasMyEnv && !hasMyStudent) {
 return false;
 }
 }

 if (selectedCategoryId !== 'ALL' && ev.categoryId !== selectedCategoryId) return false;
 if (selectedEnvId !== 'ALL') {
 if (ev.targetScope === 'ENVIRONMENTS') {
 const hasEnv = ev.targetEnvironments?.some(te => te.environment.id === selectedEnvId);
 if (!hasEnv) return false;
 }
 }
 if (search.trim()) {
 const q = search.toLowerCase();
 const matchTitle = ev.title.toLowerCase().includes(q);
 const matchDesc = ev.description?.toLowerCase().includes(q) || false;
 const matchLoc = ev.location?.toLowerCase().includes(q) || false;
 if (!matchTitle && !matchDesc && !matchLoc) return false;
 }
 return true;
 });
 }, [events, hasGlobalEventsPermission, isTeacherOrStaff, user?.id, userEmail, teacherEnvIds, selectedCategoryId, selectedEnvId, search]);

 // Flatten all bookings across all visible events into AggregatedBooking list
 const allAggregatedBookings = useMemo(() => {
 const list: AggregatedBooking[] = [];
 filteredEvents.forEach(ev => {
 // 1. Direct event bookings (Open massive or parent bookings)
 (ev.bookings || []).forEach(b => {
 const slot = ev.slots?.find(s => s.id === b.slotId);
 const isEnrolled = Boolean(b.studentId || b.tutorUserId || b.student?.fullName || b.tutor?.fullName);
 
 // Filter by user bookings if not allowed to view all
 if (!canViewAllBookings) {
 const isMyBooking = (user?.id && b.tutorUserId === user.id) ||
 (userEmail && b.tutor?.email?.toLowerCase() === userEmail.toLowerCase()) ||
 (userEmail && b.guestEmail?.toLowerCase() === userEmail.toLowerCase());
 const isMyHostEvent = ev.hosts?.some(h => h.userId === user?.id || (userEmail && h.user?.email?.toLowerCase() === userEmail.toLowerCase()));
 const isMyEnvStudent = Boolean(b.student?.environment?.id && teacherEnvIds.includes(b.student.environment.id));

 if (!isMyBooking && !isMyHostEvent && !isMyEnvStudent) {
 return;
 }
 }

 list.push({
 booking: b,
 event: ev,
 slot: slot ? { id: slot.id, startTime: slot.startTime, endTime: slot.endTime } : undefined,
 isEnrolledFamily: isEnrolled
 });
 });

 // 2. Slot bookings (if any slot booking wasn't in event.bookings)
 (ev.slots || []).forEach(slot => {
 (slot.bookings || []).forEach(sb => {
 if (!list.some(item => item.booking.id === sb.id)) {
 const isEnrolled = Boolean(sb.studentId || sb.tutorUserId || sb.student?.fullName || sb.tutor?.fullName);
 
 // Filter by user bookings if not allowed to view all
 if (!canViewAllBookings) {
 const isMyBooking = (user?.id && sb.tutorUserId === user.id) ||
 (userEmail && sb.tutor?.email?.toLowerCase() === userEmail.toLowerCase()) ||
 (userEmail && sb.guestEmail?.toLowerCase() === userEmail.toLowerCase());
 const isMyHostEvent = ev.hosts?.some(h => h.userId === user?.id || (userEmail && h.user?.email?.toLowerCase() === userEmail.toLowerCase()));
 const isMyEnvStudent = Boolean(sb.student?.environment?.id && teacherEnvIds.includes(sb.student.environment.id));

 if (!isMyBooking && !isMyHostEvent && !isMyEnvStudent) {
 return;
 }
 }

 list.push({
 booking: sb,
 event: ev,
 slot: { id: slot.id, startTime: slot.startTime, endTime: slot.endTime },
 isEnrolledFamily: isEnrolled
 });
 }
 });
 });
 });

 // Sort by slot time or event start time descending/ascending
 return list.sort((a, b) => {
 const timeA = new Date(a.slot?.startTime || a.event.startDateTime).getTime();
 const timeB = new Date(b.slot?.startTime || b.event.startDateTime).getTime();
 return timeB - timeA;
 });
 }, [filteredEvents, canViewAllBookings, user?.id, userEmail, teacherEnvIds]);

 // Filtered Bookings for the "Reservas" view
 const filteredBookings = useMemo(() => {
 return allAggregatedBookings.filter(item => {
 // Event filter
 if (bookingEventFilter !== 'ALL' && item.event.id !== bookingEventFilter) return false;

 // Participant filter
 if (bookingParticipantFilter === 'ENROLLED' && !item.isEnrolledFamily) return false;
 if (bookingParticipantFilter === 'GUEST' && item.isEnrolledFamily) return false;

 // Status filter
 if (bookingStatusFilter !== 'ALL' && item.booking.status !== bookingStatusFilter) return false;

 // Search filter
 if (bookingSearch.trim()) {
 const q = bookingSearch.toLowerCase();
 const b = item.booking;
 const ev = item.event;
 const hostNames = (ev.hosts || []).map(h => h.user?.fullName || '').join(' ').toLowerCase();
 const tutorName = (b.tutor?.fullName || '').toLowerCase();
 const studentName = (b.student?.fullName || '').toLowerCase();
 const guestName = (b.guestName || '').toLowerCase();
 const email = (b.guestEmail || b.tutor?.email || '').toLowerCase();
 const phone = (b.guestPhone || b.tutor?.phone || '').toLowerCase();
 const eventTitle = ev.title.toLowerCase();
 const location = (ev.location || '').toLowerCase();
 const notes = (b.notes || '').toLowerCase();

 const matches = tutorName.includes(q) ||
 studentName.includes(q) ||
 guestName.includes(q) ||
 email.includes(q) ||
 phone.includes(q) ||
 eventTitle.includes(q) ||
 location.includes(q) ||
 hostNames.includes(q) ||
 notes.includes(q);

 if (!matches) return false;
 }

 return true;
 });
 }, [allAggregatedBookings, bookingEventFilter, bookingParticipantFilter, bookingStatusFilter, bookingSearch]);

 // Metrics for Bookings View
 const bookingMetrics = useMemo(() => {
 const total = allAggregatedBookings.length;
 const confirmed = allAggregatedBookings.filter(b => b.booking.status === 'CONFIRMED').length;
 const slotsCount = allAggregatedBookings.filter(b => b.event.eventType === 'SLOT_BOOKING').length;
 const massiveCount = allAggregatedBookings.filter(b => b.event.eventType === 'OPEN_MASSIVE').length;
 const enrolledCount = allAggregatedBookings.filter(b => b.isEnrolledFamily).length;
 const guestsCount = allAggregatedBookings.filter(b => !b.isEnrolledFamily).length;
 return { total, confirmed, slotsCount, massiveCount, enrolledCount, guestsCount };
 }, [allAggregatedBookings]);

 // Calendar Math
 const year = currentDate.getFullYear();
 const month = currentDate.getMonth();
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const firstDayIndex = new Date(year, month, 1).getDay();

 const monthNames = [
 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
 ];

 const prevMonth = () => {
 setCurrentDate(new Date(year, month - 1, 1));
 };

 const nextMonth = () => {
 setCurrentDate(new Date(year, month + 1, 1));
 };

 const today = () => {
 const now = new Date();
 setCurrentDate(now);
 setSelectedCalendarDate(now);
 };

 // Selected date events for mobile view
 const selectedDateKey = selectedCalendarDate.toISOString().split('T')[0];
 const selectedDateEvents = filteredEvents.filter(ev => {
 const evStart = new Date(ev.startDateTime).toISOString().split('T')[0];
 const evEnd = new Date(ev.endDateTime).toISOString().split('T')[0];
 return selectedDateKey >= evStart && selectedDateKey <= evEnd;
 });

 const selectedDateFormatted = selectedCalendarDate.toLocaleDateString('es-MX', {
 weekday: 'long',
 day: 'numeric',
 month: 'long'
 });

 return (
 <div className="space-y-6 font-body animate-in fade-in duration-300 pb-16">

 {/* FULL-WIDTH GREEN HERO BANNER */}
 <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
 <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
 <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-start sm:items-center gap-3.5">
 <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
 <div className="space-y-1">
 <div className="flex items-center gap-2 flex-wrap">
 <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
 Calendario y Reservas
 </h1>
 <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
 {events.length} eventos • {bookingMetrics.total} reservas
 </span>
 </div>
 <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
 Planificación de eventos escolares, citas individuales por turnos y control de asistencia de familias y aspirantes.
 </p>
 </div>
 </div>

 <div className="relative z-10 flex items-center gap-3 shrink-0">
 {/* View Mode Toggle: Calendario vs Reservas */}
 <div className="bg-white/15 p-1 rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-1 shadow-xs">
 <button
 onClick={() => setViewMode('calendar')}
 className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
 viewMode === 'calendar' ? 'bg-white text-forest shadow-xs' : 'text-white/80 hover:bg-white/10'
 }`}
 >
 <CalendarIcon className="w-3.5 h-3.5" />
 <span>Calendario</span>
 </button>
 <button
 onClick={() => setViewMode('bookings')}
 className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
 viewMode === 'bookings' ? 'bg-white text-forest shadow-xs' : 'text-white/80 hover:bg-white/10'
 }`}
 >
 <CalendarCheck className="w-3.5 h-3.5" />
 <span>Reservas</span>
 {bookingMetrics.total > 0 && (
 <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
 viewMode === 'bookings' ? 'bg-forest/15 text-forest' : 'bg-white/20 text-white'
 }`}>
 {bookingMetrics.total}
 </span>
 )}
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* ========================================================================= */}
 {/* 1. CALENDAR VIEW */}
 {/* ========================================================================= */}
 {viewMode === 'calendar' && (
 <div className="space-y-4">
 {/* FILTER & EXPANDABLE SEARCH BAR FOR CALENDAR (Directly on layout) */}
 <div className="transition-all duration-300">
 {isSearchExpanded ? (
 <div className="bg-white px-3.5 py-2 rounded-2xl border border-forest/15 shadow-2xs flex items-center gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
 <Search className="w-4 h-4 text-forest shrink-0" />
 <input
 ref={searchInputRef}
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Escape') {
 setSearch('');
 setIsSearchExpanded(false);
 }
 }}
 placeholder="Buscar eventos por título, lugar, anfitrión..."
 className="w-full text-xs sm:text-sm text-forest placeholder:text-forest/40 focus:outline-hidden bg-transparent"
 autoFocus
 />
 {search && (
 <button
 type="button"
 onClick={() => setSearch('')}
 className="px-2 py-0.5 text-[11px] font-bold text-muted-foreground hover:text-forest shrink-0 cursor-pointer"
 >
 Limpiar
 </button>
 )}
 <button
 type="button"
 onClick={() => {
 setSearch('');
 setIsSearchExpanded(false);
 }}
 className="p-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest/70 hover:text-forest shrink-0 transition-colors cursor-pointer"
 title="Cerrar buscador"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 ) : (
 <div className="flex items-center gap-2.5">
 <button
 type="button"
 onClick={() => {
 setIsSearchExpanded(true);
 setTimeout(() => searchInputRef.current?.focus(), 50);
 }}
 className={`p-2.5 rounded-2xl border transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-2xs ${
 search.trim()
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-white hover:bg-forest/5 text-forest border-forest/10 hover:border-forest/20'
 }`}
 title="Buscar eventos"
 >
 <Search className="w-4 h-4" />
 </button>

 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap active:cursor-grab select-none touch-pan-x flex-1 py-0.5">
 <button
 onClick={() => setSelectedCategoryId('ALL')}
 className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border cursor-pointer shadow-2xs ${
 selectedCategoryId === 'ALL'
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-white text-forest/80 border-forest/10 hover:bg-forest/5'
 }`}
 >
 Todas las Categorías
 </button>
 {categories.map(cat => (
 <button
 key={cat.id}
 onClick={() => setSelectedCategoryId(cat.id)}
 className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer shadow-2xs ${
 selectedCategoryId === cat.id
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-white text-forest/80 border-forest/10 hover:bg-forest/5'
 }`}
 >
 <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
 <span>{cat.name}</span>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* CALENDAR MONTH GRID */}
 <div className="bg-white rounded-3xl border border-forest/10 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 sm:gap-3">
 <h3 className="text-base sm:text-xl font-bold font-display text-forest capitalize">
 {monthNames[month]} {year}
 </h3>
 <button
 onClick={today}
 className="px-2.5 py-1 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 rounded-xl transition-colors cursor-pointer"
 >
 Hoy
 </button>
 </div>

 <div className="flex items-center gap-1">
 <button
 onClick={prevMonth}
 className="p-2 text-forest/70 hover:text-forest hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
 title="Mes anterior"
 >
 <ChevronLeft className="w-5 h-5" />
 </button>
 <button
 onClick={nextMonth}
 className="p-2 text-forest/70 hover:text-forest hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
 title="Mes siguiente"
 >
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Desktop Calendar Grid */}
 <div className="hidden sm:grid grid-cols-7 gap-px bg-forest/10 rounded-2xl overflow-hidden border border-forest/10 shadow-2xs">
 {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
 <div key={idx} className="bg-forest/5 p-2 text-center text-xs font-bold text-forest uppercase tracking-wider">
 {day}
 </div>
 ))}

 {Array.from({ length: firstDayIndex }).map((_, idx) => (
 <div key={`empty-${idx}`} className="bg-stone-50/50 p-2 min-h-[100px] opacity-40" />
 ))}

 {Array.from({ length: daysInMonth }).map((_, idx) => {
 const day = idx + 1;
 const d = new Date(year, month, day);
 const isCurrentToday = new Date().toDateString() === d.toDateString();
 const dKey = d.toISOString().split('T')[0];

 const dayEvents = filteredEvents.filter(ev => {
 const evStart = new Date(ev.startDateTime).toISOString().split('T')[0];
 const evEnd = new Date(ev.endDateTime).toISOString().split('T')[0];
 return dKey >= evStart && dKey <= evEnd;
 });

 return (
 <div
 key={`day-${day}`}
 className={`bg-white p-2 min-h-[110px] space-y-1 transition-colors hover:bg-forest/5 flex flex-col justify-between ${
 isCurrentToday ? 'ring-2 ring-forest/30 ring-inset bg-forest/5' : ''
 }`}
 >
 <div className="flex items-center justify-between">
 <span className={`text-xs font-bold font-mono ${
 isCurrentToday
 ? 'w-6 h-6 rounded-full bg-forest text-white flex items-center justify-center'
 : 'text-forest'
 }`}>
 {day}
 </span>
 {dayEvents.length > 0 && (
 <span className="text-[10px] text-muted-foreground font-semibold">
 {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
 </span>
 )}
 </div>

 <div className="space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
 {dayEvents.map(ev => {
 const confirmedCount = (ev.bookings || []).filter(b => b.status === 'CONFIRMED').length;
 return (
 <div
 key={ev.id}
 onClick={() => handleOpenDetail(ev)}
 className="p-1.5 rounded-lg text-[11px] font-medium leading-tight cursor-pointer shadow-2xs hover:scale-102 transition-all truncate border border-black/5"
 style={{
 backgroundColor: `${ev.category?.color || '#1b3b2b'}15`,
 color: ev.category?.color || '#1b3b2b',
 borderLeft: `3px solid ${ev.category?.color || '#1b3b2b'}`
 }}
 title={`${ev.title} (${confirmedCount} reservas)`}
 >
 <span className="font-bold block truncate">{ev.title}</span>
 <span className="text-[9.5px] opacity-80 block truncate">
 {ev.eventType === 'SLOT_BOOKING' ? ` ${confirmedCount} turnos` : ` ${confirmedCount} confirmados`}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>

 {/* Mobile Calendar List View */}
 <div className="sm:hidden space-y-4">
 <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-forest">
 {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
 <div key={i} className="py-1">{d}</div>
 ))}
 </div>

 <div className="grid grid-cols-7 gap-1 text-center">
 {Array.from({ length: firstDayIndex }).map((_, idx) => (
 <div key={`mob-empty-${idx}`} className="h-9 opacity-20" />
 ))}

 {Array.from({ length: daysInMonth }).map((_, idx) => {
 const day = idx + 1;
 const d = new Date(year, month, day);
 const isCurrentToday = new Date().toDateString() === d.toDateString();
 const isSelected = selectedCalendarDate.toDateString() === d.toDateString();
 const dKey = d.toISOString().split('T')[0];

 const hasEvents = filteredEvents.some(ev => {
 const evStart = new Date(ev.startDateTime).toISOString().split('T')[0];
 const evEnd = new Date(ev.endDateTime).toISOString().split('T')[0];
 return dKey >= evStart && dKey <= evEnd;
 });

 return (
 <button
 key={`mob-day-${day}`}
 onClick={() => setSelectedCalendarDate(d)}
 className={`h-9 rounded-xl text-xs font-bold font-mono transition-all relative flex items-center justify-center ${
 isSelected
 ? 'bg-forest text-white shadow-xs'
 : isCurrentToday
 ? 'bg-forest/15 text-forest border border-forest/30'
 : 'text-forest hover:bg-forest/5'
 }`}
 >
 <span>{day}</span>
 {hasEvents && (
 <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
 isSelected ? 'bg-white' : 'bg-forest'
 }`} />
 )}
 </button>
 );
 })}
 </div>

 {/* Selected Day Events List on Mobile */}
 <div className="pt-3 border-t border-forest/10 space-y-2">
 <span className="text-xs font-bold text-forest capitalize block">
 {selectedDateFormatted}:
 </span>
 {selectedDateEvents.length === 0 ? (
 <p className="text-xs text-muted-foreground italic py-2">
 No hay eventos programados para este día.
 </p>
 ) : (
 <div className="space-y-2">
 {selectedDateEvents.map(ev => (
 <div
 key={ev.id}
 onClick={() => handleOpenDetail(ev)}
 className="p-3 rounded-2xl border border-forest/10 bg-forest/5 flex items-center justify-between gap-3 cursor-pointer"
 >
 <div className="min-w-0">
 <h4 className="text-xs font-bold text-forest truncate">{ev.title}</h4>
 <span className="text-[10px] text-muted-foreground">
 {ev.location || 'Campus'} • {new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-forest border border-forest/10 shrink-0">
 Ver detalle
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* 2. RESERVAS / CITAS & ASISTENCIA VIEW */}
 {/* ========================================================================= */}
 {viewMode === 'bookings' && (
 <div className="space-y-4">
 {/* METRICS OVERVIEW */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
 <div className="bg-white p-3.5 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
 Total Reservas
 </span>
 <div className="flex items-center gap-2">
 <CalendarCheck className="w-4 h-4 text-forest" />
 <span className="text-lg font-bold font-mono text-forest">
 {bookingMetrics.total}
 </span>
 </div>
 </div>

 <div className="bg-white p-3.5 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
 Confirmadas
 </span>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-600" />
 <span className="text-lg font-bold font-mono text-emerald-700">
 {bookingMetrics.confirmed}
 </span>
 </div>
 </div>

 <div className="bg-white p-3.5 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
 Citas por Turno
 </span>
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-purple-600" />
 <span className="text-lg font-bold font-mono text-purple-800">
 {bookingMetrics.slotsCount}
 </span>
 </div>
 </div>

 <div className="bg-white p-3.5 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
 Eventos Masivos
 </span>
 <div className="flex items-center gap-2">
 <Users className="w-4 h-4 text-blue-600" />
 <span className="text-lg font-bold font-mono text-blue-800">
 {bookingMetrics.massiveCount}
 </span>
 </div>
 </div>

 <div className="bg-white p-3.5 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold text-forest uppercase tracking-wider block">
 Familias Activas
 </span>
 <div className="flex items-center gap-2">
 <UserCheck className="w-4 h-4 text-forest" />
 <span className="text-lg font-bold font-mono text-forest">
 {bookingMetrics.enrolledCount}
 </span>
 </div>
 </div>

 <div className="bg-white p-3.5 rounded-2xl border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
 Aspirantes / Invitados
 </span>
 <div className="flex items-center gap-2">
 <UserPlus className="w-4 h-4 text-amber-600" />
 <span className="text-lg font-bold font-mono text-amber-800">
 {bookingMetrics.guestsCount}
 </span>
 </div>
 </div>
 </div>

 {/* FILTER CONTROLS BAR */}
 <div className="bg-white p-4 rounded-3xl border border-forest/10 shadow-2xs space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
 {/* Search */}
 <div className="relative">
 <Search className="w-4 h-4 text-forest/60 absolute left-3 top-3" />
 <input
 type="text"
 value={bookingSearch}
 onChange={(e) => setBookingSearch(e.target.value)}
 placeholder="Buscar por nombre, alumno, email o evento..."
 className="w-full pl-9 pr-3 py-2 bg-stone-50/80 border border-forest/15 rounded-xl text-xs text-forest placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-forest/20"
 />
 {bookingSearch && (
 <button
 type="button"
 onClick={() => setBookingSearch('')}
 className="absolute right-2.5 top-2.5 text-slate-400 hover:text-forest text-xs font-bold"
 >
 ×
 </button>
 )}
 </div>

 {/* Event Filter */}
 <div>
 <select
 value={bookingEventFilter}
 onChange={(e) => setBookingEventFilter(e.target.value)}
 className="w-full px-3 py-2 bg-stone-50/80 border border-forest/15 rounded-xl text-xs text-forest font-semibold focus:outline-hidden focus:ring-2 focus:ring-forest/20 cursor-pointer"
 >
 <option value="ALL">-- Todos los Eventos ({events.length}) --</option>
 {events.map(ev => (
 <option key={ev.id} value={ev.id}>
 {ev.title} {ev.eventType === 'SLOT_BOOKING' ? '[Citas]' : '[Masivo]'}
 </option>
 ))}
 </select>
 </div>

 {/* Participant Type Filter */}
 <div>
 <select
 value={bookingParticipantFilter}
 onChange={(e) => setBookingParticipantFilter(e.target.value as any)}
 className="w-full px-3 py-2 bg-stone-50/80 border border-forest/15 rounded-xl text-xs text-forest font-semibold focus:outline-hidden focus:ring-2 focus:ring-forest/20 cursor-pointer"
 >
 <option value="ALL">Todos los Participantes</option>
 <option value="ENROLLED"> Familias Ceiba Activas ({bookingMetrics.enrolledCount})</option>
 <option value="GUEST"> Aspirantes / Invitados ({bookingMetrics.guestsCount})</option>
 </select>
 </div>

 {/* Status Filter */}
 <div>
 <select
 value={bookingStatusFilter}
 onChange={(e) => setBookingStatusFilter(e.target.value)}
 className="w-full px-3 py-2 bg-stone-50/80 border border-forest/15 rounded-xl text-xs text-forest font-semibold focus:outline-hidden focus:ring-2 focus:ring-forest/20 cursor-pointer"
 >
 <option value="ALL">Todos los Estados</option>
 <option value="CONFIRMED">Confirmada</option>
 <option value="ATTENDED">Asistió</option>
 <option value="NO_SHOW">No Asistió</option>
 <option value="CANCELLED">Cancelada</option>
 </select>
 </div>
 </div>
 </div>

 {/* BOOKINGS LIST */}
 <div className="space-y-3">
 {filteredBookings.length === 0 ? (
 <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-2xs space-y-3">
 <CalendarCheck className="w-10 h-10 mx-auto text-forest/40" />
 <div className="space-y-1">
 <h4 className="text-sm font-bold text-forest">No hay reservas encontradas</h4>
 <p className="text-xs text-muted-foreground max-w-sm mx-auto">
 No se encontraron registros de citas o asistencias con los filtros aplicados.
 </p>
 </div>
 </div>
 ) : (
 <div className="space-y-3">
 {filteredBookings.map((item) => {
 const b = item.booking;
 const ev = item.event;
 const isEnrolled = item.isEnrolledFamily;

 // Determine display contact details
 const contactName = b.tutor?.fullName || b.guestName || 'Participante';
 const contactEmail = b.tutor?.email || b.guestEmail || '';
 const contactPhone = b.tutor?.phone || b.guestPhone || '';

 const cleanPhone = contactPhone.replace(/\D/g, '');
 const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`}` : null;

 // Host names
 const hostNames = (ev.hosts || []).map(h => h.user?.fullName).filter(Boolean);

 // Date and time formatting
 const slotDateStr = item.slot?.startTime || ev.startDateTime;
 const formattedDate = new Date(slotDateStr).toLocaleDateString('es-MX', {
 weekday: 'short',
 day: 'numeric',
 month: 'short',
 year: 'numeric'
 });

 const formattedTime = item.slot
 ? `${new Date(item.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(item.slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
 : new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

 return (
 <div
 key={b.id}
 className="bg-white rounded-3xl p-4 sm:p-5 border border-forest/10 shadow-2xs hover:shadow-xs transition-all space-y-3"
 >
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-forest/10">
 {/* Participant Identification */}
 <div className="flex items-start gap-3 min-w-0">
 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs ${
 isEnrolled ? 'bg-forest' : 'bg-purple-700'
 }`}>
 {isEnrolled ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
 </div>

 <div className="space-y-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
 isEnrolled
 ? 'bg-emerald-100 text-emerald-800'
 : 'bg-purple-100 text-purple-800'
 }`}>
 {isEnrolled ? ' Familia Ceiba Activa' : ' Aspirante / Nuevo Ingreso'}
 </span>

 <span className="text-[10px] text-muted-foreground font-mono">
 Reg: {new Date(b.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
 </span>
 </div>

 <h4 className="text-sm sm:text-base font-bold font-display text-forest leading-snug">
 {contactName}
 </h4>

 {/* Linked Student / Enrolled child */}
 {b.student?.fullName && (
 <div className="flex items-center gap-1.5 text-xs text-forest font-semibold pt-0.5">
 <GraduationCap className="w-3.5 h-3.5 text-forest/70 shrink-0" />
 <span>Alumno: <strong>{b.student.fullName}</strong></span>
 {b.student.environment?.name && (
 <span
 className="text-[10px] font-bold px-1.5 py-0.2 rounded-md text-white shadow-2xs ml-1"
 style={{ backgroundColor: b.student.environment.color || '#1b3b2b' }}
 >
 {b.student.environment.name}
 </span>
 )}
 </div>
 )}

 {/* Contact Links */}
 <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5 flex-wrap">
 {contactEmail && (
 <a
 href={`mailto:${contactEmail}`}
 className="flex items-center gap-1 hover:text-forest transition-colors"
 >
 <Mail className="w-3 h-3 text-forest/60" />
 <span>{contactEmail}</span>
 </a>
 )}
 {contactPhone && (
 <div className="flex items-center gap-2">
 <a
 href={`tel:${contactPhone}`}
 className="flex items-center gap-1 hover:text-forest transition-colors"
 >
 <Phone className="w-3 h-3 text-forest/60" />
 <span>{contactPhone}</span>
 </a>
 {waLink && (
 <a
 href={waLink}
 target="_blank"
 rel="noreferrer"
 className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
 title="Abrir WhatsApp"
 >
 <MessageCircle className="w-3 h-3" />
 </a>
 )}
 </div>
 )}
 {b.guestsCount > 1 && (
 <span className="flex items-center gap-1 font-semibold text-slate-700">
 <Users className="w-3 h-3" />
 <span>{b.guestsCount} personas</span>
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Status & Actions */}
 <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
 <select
 value={b.status}
 onChange={(e) => handleUpdateBookingStatus(ev.id, b.id, e.target.value)}
 className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
 b.status === 'CONFIRMED'
 ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
 : b.status === 'ATTENDED'
 ? 'bg-blue-50 text-blue-800 border-blue-200'
 : b.status === 'NO_SHOW'
 ? 'bg-rose-50 text-rose-800 border-rose-200'
 : 'bg-slate-100 text-slate-600 border-slate-200'
 }`}
 >
 <option value="CONFIRMED"> Confirmada</option>
 <option value="ATTENDED">Asistió</option>
 <option value="NO_SHOW">No Asistió</option>
 <option value="CANCELLED">Cancelada</option>
 </select>

 {isStaff && (
 <button
 type="button"
 onClick={() => handleCancelBooking(ev.id, b.id, contactName)}
 className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
 title="Cancelar y eliminar reserva"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>

 {/* Event Details and Schedule Info Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-stone-50/70 p-3 rounded-2xl border border-forest/5">
 {/* Event Title & Type */}
 <div className="space-y-0.5 min-w-0">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
 Evento
 </span>
 <button
 type="button"
 onClick={() => handleOpenDetail(ev)}
 className="font-bold text-forest hover:underline text-left truncate block max-w-full cursor-pointer"
 >
 {ev.title}
 </button>
 <span className="text-[10.5px] text-muted-foreground flex items-center gap-1">
 <Tag className="w-3 h-3 text-forest/60" />
 <span>{ev.category?.name || 'General'}</span>
 </span>
 </div>

 {/* Schedule & Location */}
 <div className="space-y-0.5">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
 Cita / Horario
 </span>
 <div className="flex items-center gap-1.5 font-bold font-mono text-forest">
 <Clock className="w-3.5 h-3.5 text-forest/70 shrink-0" />
 <span>{formattedDate} • {formattedTime}</span>
 </div>
 {ev.location && (
 <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
 <MapPin className="w-3 h-3 text-forest/60 shrink-0" />
 <span className="truncate">{ev.location}</span>
 </span>
 )}
 </div>

 {/* Host / Guides & Notes */}
 <div className="space-y-0.5 sm:col-span-2 lg:col-span-1">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
 Anfitrión / Responsable
 </span>
 <div className="flex items-center gap-1 text-slate-800 font-semibold truncate">
 <GraduationCap className="w-3.5 h-3.5 text-forest/70 shrink-0" />
 <span className="truncate">{hostNames.length > 0 ? hostNames.join(', ') : 'Equipo Directivo Ceiba'}</span>
 </div>
 {b.notes && (
 <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
 "{b.notes}"
 </p>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )}

 {/* CREATE / EDIT EVENT DRAWER */}
 <EventFormDrawer
 isOpen={formDrawerOpen}
 onClose={() => setFormDrawerOpen(false)}
 event={editingEvent}
 guidesList={guides}
 tutorsList={tutors}
 onSaved={loadAll}
 onDelete={handleDelete}
 />

 {/* EVENT DETAIL & BOOKING SLOTS DRAWER */}
 <EventDetailDrawer
 isOpen={detailDrawerOpen}
 onClose={() => setDetailDrawerOpen(false)}
 event={selectedDetailEvent}
 onEdit={handleOpenEdit}
 onDelete={handleDelete}
 onRefresh={loadAll}
 />

 {/* Floating Action Button (Always Round FAB - Authorized users only) */}
 {canCreateEvents && (
 <button
 type="button"
 onClick={handleOpenCreate}
 className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl shadow-forest/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 border-white/25 cursor-pointer group"
 title="Programar Evento"
 aria-label="Programar Evento"
 >
 <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300 stroke-[2.5]" />
 <span className="sr-only">Programar Evento</span>
 </button>
 )}

 </div>
 );
};

export default EventsSection;
