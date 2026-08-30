import React, { useState, useEffect } from 'react';
import {
 Calendar as CalendarIcon,
 Clock,
 MapPin,
 Users,
 Sparkles,
 Check,
 X,
 Layers,
 FileText,
 Plus,
 Trash2,
 Building2,
 GraduationCap,
 HeartHandshake,
 Image as ImageIcon,
 CheckCircle2,
 XCircle,
 Clock3,
 Edit,
 Upload,
 Download,
 Share2,
 AlertCircle,
 AlertTriangle,
 Star
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import {
  SchoolEventItem,
  EventSlotItem,
  EventBookingItem,
  confirmSchoolEventRSVP,
  bookSchoolEventSlot,
  cancelSchoolEventBooking,
  savePostEventData,
  deleteSchoolEvent,
  getSchoolEvent
} from '@/lib/sqlite';
import { uploadPhysicalFile } from '@/lib/api';
import { VoiceNoteTextarea } from '@/components/ui/VoiceNoteTextarea';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';

interface EventDetailDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 event: SchoolEventItem | null;
 onEdit: (event: SchoolEventItem) => void;
 onDelete?: (id: string, title: string) => Promise<void> | void;
 onRefresh: () => void;
}

type TabType = 'attendees' | 'resources' | 'post_event';

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
 isOpen,
 onClose,
 event,
 onEdit,
 onDelete,
 onRefresh
}) => {
 const confirm = useConfirm();
 const [currentEvent, setCurrentEvent] = useState<SchoolEventItem | null>(event);
 const [activeTab, setActiveTab] = useState<TabType>('attendees');
 const [postNotes, setPostNotes] = useState(event?.summaryNotes || '');
 const [photoUrls, setPhotoUrls] = useState<string[]>(event?.photoUrls || []);
 const [savingPost, setSavingPost] = useState(false);
 const [deletingEvent, setDeletingEvent] = useState(false);

 const { role, user, activeMembership } = useAuth();
 const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN';
 const isStaff = role === 'OWNER' || role === 'ADMIN' || role === 'TEACHER' || role === 'STAFF';
 const isTutor = role === 'TUTOR';
 const permissions: string[] = (activeMembership as any)?.permissions || [];
 
 const isCreatorOrHost = Boolean(
    (currentEvent?.createdById && user?.id && currentEvent.createdById === user.id) ||
    ((currentEvent as any)?.createdByUserId && user?.id && (currentEvent as any).createdByUserId === user.id) ||
    ((currentEvent as any)?.userId && user?.id && (currentEvent as any).userId === user.id) ||
    (currentEvent?.hosts?.some(h => h.userId === user?.id))
  );

 const canEdit = isOwnerOrAdmin || permissions.includes('events:write') || permissions.includes('events') || isCreatorOrHost;
 const canDelete = isOwnerOrAdmin || permissions.includes('events:write') || permissions.includes('events') || permissions.includes('events:delete') || isCreatorOrHost;

 // Sync event prop with currentEvent
 useEffect(() => {
 setCurrentEvent(event);
 if (event) {
 setPostNotes(event.summaryNotes || '');
 setPhotoUrls(event.photoUrls || []);
 }
 }, [event]);

 // RSVP Form State for Tutor (Massive Events)
 const [rsvpGuestsCount, setRsvpGuestsCount] = useState<number>(1);
 const [rsvpNotes, setRsvpNotes] = useState('');
 const [rsvpLoading, setRsvpLoading] = useState(false);

 // Slot Booking State for Tutor (Custom Confirmation Modal)
 const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<EventSlotItem | null>(null);
 const [slotNotes, setSlotNotes] = useState('');
 const [bookingLoading, setBookingLoading] = useState(false);
 const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null);

 if (!isOpen || !currentEvent) return null;

 // Check if current user has a booking in this event
 const myBooking = currentEvent.bookings?.find(b =>
 (user?.id && b.tutorUserId === user.id) ||
 (user?.email && b.guestEmail === user.email)
 );

 // If the booking is tied to a slot, find the matching slot
 const myBookedSlot = myBooking?.slotId
 ? currentEvent.slots?.find(s => s.id === myBooking.slotId)
 : (myBooking?.slot || null);

 const handleCancelBooking = async (bookingId: string) => {
 try {
 await cancelSchoolEventBooking(currentEvent.id, bookingId);
 toast.success('Reserva cancelada con éxito. Ya puedes elegir otro turno si lo deseas.');
 setCancelModalBookingId(null);

 // Immediately refresh local state
 const fresh = await getSchoolEvent(currentEvent.id).catch(() => null);
 if (fresh) setCurrentEvent(fresh);
 onRefresh();
 } catch (e: any) {
 toast.error('Error al cancelar reserva');
 }
 };

 const handleConfirmRSVP = async () => {
 setRsvpLoading(true);
 try {
 await confirmSchoolEventRSVP(currentEvent.id, {
 tutorUserId: user?.id,
 guestName: user?.fullName || 'Familia',
 guestEmail: user?.email || '',
 guestsCount: Number(rsvpGuestsCount) || 1,
 notes: rsvpNotes.trim(),
 status: 'CONFIRMED'
 });
 toast.success('¡Asistencia confirmada con éxito!');
 const fresh = await getSchoolEvent(currentEvent.id).catch(() => null);
 if (fresh) setCurrentEvent(fresh);
 onRefresh();
 } catch (e: any) {
 toast.error(e.message || 'Error al confirmar asistencia');
 } finally {
 setRsvpLoading(false);
 }
 };

 const handleExecuteBookSlot = async () => {
 if (!selectedSlotForBooking) return;
 setBookingLoading(true);
 try {
 await bookSchoolEventSlot(currentEvent.id, {
 slotId: selectedSlotForBooking.id,
 tutorUserId: user?.id,
 guestName: user?.fullName || 'Familia',
 guestEmail: user?.email || '',
 notes: slotNotes.trim()
 });
 toast.success('¡Turno reservado exitosamente!');
 setSelectedSlotForBooking(null);
 setSlotNotes('');
 const fresh = await getSchoolEvent(currentEvent.id).catch(() => null);
 if (fresh) setCurrentEvent(fresh);
 onRefresh();
 } catch (e: any) {
 toast.error(e.message || 'Error al reservar horario');
 } finally {
 setBookingLoading(false);
 }
 };

 const handleSavePostEvent = async () => {
 setSavingPost(true);
 try {
 await savePostEventData(currentEvent.id, {
 summaryNotes: postNotes,
 photoUrls
 });
 toast.success('¡Memoria y fotos del evento guardadas!');
 const fresh = await getSchoolEvent(currentEvent.id).catch(() => null);
 if (fresh) setCurrentEvent(fresh);
 onRefresh();
 } catch (e: any) {
 toast.error('Error al guardar memoria del evento');
 } finally {
 setSavingPost(false);
 }
 };

 const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 try {
 const res = await uploadPhysicalFile(file, 'gallery');
 if (res.url) {
 setPhotoUrls(prev => [...prev, res.url]);
 toast.success('Foto agregada a la galería del evento');
 }
 } catch (e: any) {
 toast.error('Error al subir imagen');
 }
 };

  const handleDeleteEvent = async () => {
    if (!currentEvent) return;

    const activeBookings = currentEvent.bookings?.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING') || [];
    if (activeBookings.length > 0) {
      toast.error(`No se puede eliminar el evento porque tiene ${activeBookings.length} reserva(s) activa(s). Primero cancela todas las reservas asociadas y luego elimina el evento.`);
      return;
    }

    const ok = await confirm({
      title: '¿Eliminar evento?',
      message: `¿Estás seguro de eliminar "${currentEvent.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar evento',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!ok) return;

    setDeletingEvent(true);
    try {
      if (onDelete) {
        await onDelete(currentEvent.id, currentEvent.title);
      } else {
        await deleteSchoolEvent(currentEvent.id);
        toast.success('Evento eliminado correctamente');
        onRefresh();
      }
      onClose();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      toast.error(err.message || 'Error al eliminar evento');
    } finally {
      setDeletingEvent(false);
    }
  };

 const confirmedBookings = currentEvent.bookings?.filter(b => b.status === 'CONFIRMED') || [];
 const totalAttendeesCount = confirmedBookings.reduce((sum, b) => sum + (b.guestsCount || 1), 0);

 return (
 <SlideOverDrawer
 isOpen={isOpen}
 onClose={onClose}
 maxWidthClass="max-w-2xl lg:max-w-3xl"
 icon={<CalendarIcon className="w-5 h-5 text-forest" />}
 title={currentEvent.title}
 description={`${currentEvent.category?.name || 'Evento'} • ${new Date(currentEvent.startDateTime).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
 footer={
 <div className="flex items-center justify-between w-full">
   <div className="flex items-center gap-2">
     {canDelete && (
       <button
         type="button"
         onClick={handleDeleteEvent}
         disabled={deletingEvent}
         className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
         title="Eliminar este evento"
       >
         <Trash2 className="w-3.5 h-3.5" />
         <span>{deletingEvent ? 'Eliminando...' : 'Eliminar Evento'}</span>
       </button>
     )}

     {canEdit && (
       <button
         type="button"
         onClick={() => onEdit(currentEvent)}
         className="px-4 py-2 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
       >
         <Edit className="w-3.5 h-3.5" />
         <span>Editar Evento</span>
       </button>
     )}
   </div>

 <button
 type="button"
 onClick={onClose}
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 }
 >
 <div className="space-y-6 relative">

 {/* Event Header Banner */}
 {currentEvent.coverImage && (
 <div className="w-full h-44 rounded-2xl overflow-hidden shadow-xs border border-forest/10 relative">
 <img src={currentEvent.coverImage} alt={currentEvent.title} className="w-full h-full object-cover" />
 <span
 className="absolute top-3 left-3 px-3 py-1 rounded-xl text-[11px] font-bold text-white shadow-xs backdrop-blur-xs"
 style={{ backgroundColor: currentEvent.category?.color || '#1b3b2b' }}
 >
 {currentEvent.category?.name}
 </span>
 </div>
 )}

 {/* Metadata Summary Pill Bar */}
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-cream/40 border border-forest/10 text-xs">
 <div>
 <span className="text-[10px] uppercase font-bold text-forest/60 block">Fecha y Horario</span>
 <strong className="text-forest font-bold block mt-0.5">
 {new Date(currentEvent.startDateTime).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
 </strong>
 <span className="text-[11px] text-muted-foreground block font-mono">
 {new Date(currentEvent.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(currentEvent.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>

 <div>
 <span className="text-[10px] uppercase font-bold text-forest/60 block">Ubicación</span>
 <span className="text-forest font-semibold block mt-0.5 truncate">{currentEvent.location || 'Campus Escolar'}</span>
 <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
 {currentEvent.eventType === 'OPEN_MASSIVE' ? (
 <>
 <Users className="w-3 h-3 text-forest/70" />
 <span>Evento Masivo (RSVP)</span>
 </>
 ) : (
 <>
 <Clock className="w-3 h-3 text-forest/70" />
 <span>Citas por Turnos</span>
 </>
 )}
 </span>
 </div>

 <div>
 <span className="text-[10px] uppercase font-bold text-forest/60 block">Audiencia</span>
 <span className="text-forest font-semibold block mt-0.5">
 {currentEvent.targetScope === 'ALL_SCHOOL'
 ? 'Toda la Escuela'
 : currentEvent.targetScope === 'ENVIRONMENTS'
 ? (currentEvent.targetEnvironments?.map(te => te.environment.name).join(', ') || 'Salones')
 : currentEvent.targetScope === 'STUDENTS'
 ? `${currentEvent.targetStudents?.length || 0} Alumnos`
 : ' Aspirantes / Externos'}
 </span>
 <span className="text-[10px] text-muted-foreground block">
 {currentEvent.isClosed ? 'Privado' : 'Abierto'}
 </span>
 </div>
 </div>

 {/* Description */}
 {currentEvent.description && (
 <div className="space-y-1">
 <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
 Descripción & Pautas
 </span>
 <p className="text-xs text-forest/90 leading-relaxed bg-white p-3.5 rounded-2xl border border-forest/10">
 {currentEvent.description}
 </p>
 </div>
 )}

 {/* Hosts & Volunteers Pills */}
 <div className="flex flex-wrap gap-2 text-xs">
 {currentEvent.hosts && currentEvent.hosts.length > 0 && (
 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest/5 border border-forest/15 text-forest font-semibold">
 <span>Anfitrión(es):</span>
 <strong>{currentEvent.hosts.map(h => h.user.fullName).join(', ')}</strong>
 </div>
 )}

 {currentEvent.volunteers && currentEvent.volunteers.length > 0 && (
 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
 <span>Voluntarios:</span>
 <strong>{currentEvent.volunteers.map(v => v.tutor.fullName).join(', ')}</strong>
 </div>
 )}
 </div>

 {/* ========================================= */}
 {/* TUTOR RESERVATION / RSVP ACTIONS SECTION */}
 {/* ========================================= */}
 {isTutor && (
 <div className="p-5 rounded-3xl bg-gradient-to-r from-forest/10 via-emerald-50 to-forest/10 border border-forest/20 shadow-xs space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold font-display text-forest uppercase tracking-wider flex items-center gap-1.5">
 <HeartHandshake className="w-4 h-4 text-forest" />
 <span>Tu Participación Familiar</span>
 </span>
 <span className="text-[10px] font-bold text-muted-foreground font-mono">
 {user?.fullName || user?.email}
 </span>
 </div>

 {/* If event is OPEN_MASSIVE */}
 {currentEvent.eventType === 'OPEN_MASSIVE' && (
 <>
 {myBooking ? (
 <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
 </div>
 <div>
 <strong className="text-emerald-950 font-bold text-xs block">
 ¡Tu asistencia está confirmada!
 </strong>
 <span className="text-[11px] text-emerald-800 block">
 Asistirán <strong>{myBooking.guestsCount} persona(s)</strong> de tu familia.
 </span>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setCancelModalBookingId(myBooking.id)}
 className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors shrink-0"
 >
 Cancelar mi asistencia
 </button>
 </div>
 ) : (
 <div className="p-4 rounded-2xl bg-white border border-forest/15 space-y-3">
 <p className="text-xs text-forest/80">
 Este es un evento abierto de la escuela. Por favor confirma cuántas personas de tu familia asistirán:
 </p>
 <div className="flex items-center gap-3">
 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Nº de Personas / Acompañantes:
 </label>
 <input
 type="number"
 min={1}
 max={10}
 value={rsvpGuestsCount}
 onChange={(e) => setRsvpGuestsCount(Math.max(1, parseInt(e.target.value) || 1))}
 className="w-24 px-3 py-1.5 rounded-xl border border-forest/20 text-xs font-bold text-forest bg-cream/30 text-center"
 />
 </div>

 <div className="flex-1">
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Notas / Comentarios (opcional):
 </label>
 <input
 type="text"
 value={rsvpNotes}
 onChange={(e) => setRsvpNotes(e.target.value)}
 placeholder="ej. Llegamos a las 10:30am..."
 className="w-full px-3 py-1.5 rounded-xl border border-forest/20 text-xs text-forest bg-cream/30"
 />
 </div>
 </div>

 <button
 type="button"
 onClick={handleConfirmRSVP}
 disabled={rsvpLoading}
 className="w-full py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-102 active:scale-98 disabled:opacity-50"
 >
 <Check className="w-4 h-4" />
 <span>{rsvpLoading ? 'Confirmando...' : 'Confirmar Mi Asistencia (RSVP)'}</span>
 </button>
 </div>
 )}
 </>
 )}

 {/* If event is SLOT_BOOKING */}
 {currentEvent.eventType === 'SLOT_BOOKING' && (
 <>
 {myBooking ? (
 <div className="p-4 rounded-2xl bg-white border-2 border-emerald-400 shadow-xs space-y-3">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
 <Clock className="w-6 h-6 text-emerald-700" />
 </div>
 <div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
 <Star className="w-3 h-3 text-emerald-700 fill-emerald-700" />
 <span>Turno Confirmado</span>
 </span>
 <strong className="text-emerald-950 font-bold font-display text-sm block mt-0.5">
 {myBookedSlot ? (
 `${new Date(myBookedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(myBookedSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
 ) : 'Horario registrado'}
 </strong>
 <span className="text-[11px] text-muted-foreground block">
 {myBookedSlot ? new Date(myBookedSlot.startTime).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
 </span>
 </div>
 </div>

 <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl shrink-0">
 Confirmado
 </span>
 </div>

 <div className="p-3 bg-cream/40 rounded-xl border border-forest/10 flex items-center justify-between text-xs">
 <div>
 <span className="text-[10px] text-muted-foreground block font-bold uppercase">Titular de la Cita:</span>
 <strong className="text-forest">{myBooking.guestName || user?.fullName}</strong>
 </div>

 <button
 type="button"
 onClick={() => setCancelModalBookingId(myBooking.id)}
 className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
 >
 <Trash2 className="w-3.5 h-3.5 text-red-600" />
 <span>Cancelar / Liberar mi Turno</span>
 </button>
 </div>
 </div>
 ) : (
 <p className="text-xs text-forest/90">
 Elige tu horario de preferencia en la sección de turnos abajo. Se abrirá una confirmación previa para asegurar tu elección.
 </p>
 )}
 </>
 )}
 </div>
 )}

 {/* TABS NAVIGATION */}
 <div className="border-b border-forest/10 flex items-center gap-2 pt-2">
 <button
 type="button"
 onClick={() => setActiveTab('attendees')}
 className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'attendees'
 ? 'border-forest text-forest bg-forest/5'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <Users className="w-4 h-4" />
 <span>
 {currentEvent.eventType === 'OPEN_MASSIVE'
 ? `Asistentes (${confirmedBookings.length})`
 : isTutor && myBooking
 ? 'Mi Reserva de Turno (1)'
 : `Turnos Disponibles (${currentEvent.slots?.length || 0})`}
 </span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('post_event')}
 className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'post_event'
 ? 'border-forest text-forest bg-forest/5'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <FileText className="w-4 h-4" />
 <span>Bitácora & Materiales ({currentEvent.photoUrls?.length || 0})</span>
 </button>
 </div>

 {/* TAB 1: ATTENDEES / SLOTS */}
 {activeTab === 'attendees' && (
 <div className="space-y-4 animate-in fade-in">
 {currentEvent.eventType === 'OPEN_MASSIVE' ? (
 // Open Massive RSVP View
 <div className="space-y-3">
 <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs">
 <span className="font-bold text-emerald-900 flex items-center gap-1.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-600" />
 <span>Total Personas Confirmadas: <strong>{totalAttendeesCount}</strong></span>
 </span>
 <span className="text-[11px] text-emerald-700 font-mono">
 {confirmedBookings.length} familias
 </span>
 </div>

 <div className="divide-y divide-forest/10 border border-forest/10 rounded-2xl bg-white overflow-hidden max-h-72 overflow-y-auto">
 {confirmedBookings.length === 0 ? (
 <div className="p-8 text-center text-xs text-muted-foreground">
 Aún no hay familias confirmadas para este evento.
 </div>
 ) : (
 confirmedBookings.map(b => {
 const isMyRecord = (user?.id && b.tutorUserId === user.id) || (user?.email && b.guestEmail === user.email);

 return (
 <div key={b.id} className="p-3 px-4 flex items-center justify-between hover:bg-forest/5 transition-colors text-xs">
 <div>
 <strong className="text-forest block">
 {b.tutor?.fullName || b.guestName || 'Tutor de familia'}
 {isMyRecord && <span className="ml-1 text-[10px] text-emerald-700 font-normal font-sans">(Tú)</span>}
 </strong>
 <span className="text-[11px] text-muted-foreground block">
 Infante: {b.student?.fullName || 'General'} • {b.guestsCount} persona(s)
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200">
 Confirmado
 </span>

 {/* Staff can remove any; Tutors can remove only theirs */}
 {(isStaff || isMyRecord) && (
 <button
 onClick={() => setCancelModalBookingId(b.id)}
 className="p-1 text-muted-foreground hover:text-destructive transition-colors"
 title="Eliminar registro"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 ) : (
 // Slot Booking Grid View
 <div className="space-y-3">
 {/* For Tutors who ALREADY BOOKED: Hide other slots and show their reservation */}
 {isTutor && myBooking ? (
 <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-xs text-center space-y-4">
 <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
 <CheckCircle2 className="w-8 h-8 text-emerald-600" />
 </div>

 <div>
 <h4 className="font-bold text-forest text-base font-display">
 ¡Tu Horario está Reservado Exclusivamente para Ti!
 </h4>
 <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
 Para evitar confusiones, el resto de los turnos se mantienen ocultos. Puedes ver tu turno asignado arriba o liberarlo si necesitas cancelarlo o escoger otro horario.
 </p>
 </div>

 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950">
 <Clock className="w-4 h-4 text-emerald-700" />
 <span>
 {myBookedSlot ? (
 `${new Date(myBookedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(myBookedSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
 ) : 'Horario asignado'}
 </span>
 </div>

 <div className="pt-2">
 <button
 type="button"
 onClick={() => setCancelModalBookingId(myBooking.id)}
 className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 hover:scale-105 active:scale-95"
 >
 <Trash2 className="w-3.5 h-3.5 text-red-600" />
 <span>Cancelar mi Reserva</span>
 </button>
 </div>
 </div>
 ) : (
 <>
 <span className="text-[11px] text-muted-foreground block">
 Citas individuales de <strong>{currentEvent.slotDurationMinutes} minutos</strong>. Cada familia reserva un horario exclusivo.
 </span>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
 {currentEvent.slots?.map((slot) => {
 const booking = slot.bookings?.[0];
 const isBooked = Boolean(booking);
 const isMySlot = booking && ((user?.id && booking.tutorUserId === user.id) || (user?.email && booking.guestEmail === user.email));

 const startStr = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 const endStr = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 const dateStr = new Date(slot.startTime).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

 return (
 <div
 key={slot.id}
 className={`p-3 rounded-2xl border transition-all text-xs flex flex-col justify-between gap-2 ${isMySlot
 ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200'
 : isBooked
 ? 'bg-emerald-50/60 border-emerald-200'
 : 'bg-white border-forest/15 hover:border-forest/30'
 }`}
 >
 <div className="flex items-center justify-between gap-1">
 <div className="min-w-0">
 {slot.name && (
 <span className="font-bold text-forest text-[11px] block truncate">
 {slot.name}
 </span>
 )}
 <span className="font-mono font-bold text-forest text-xs">
 {startStr} - {endStr}
 </span>
 </div>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isMySlot
 ? 'bg-amber-100 text-amber-900 border border-amber-300'
 : isBooked
 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
 : 'bg-forest/5 text-forest/70 border border-forest/10'
 }`}>
 {isMySlot ? (
 <>
 <Star className="w-2.5 h-2.5 text-amber-700 fill-amber-700" />
 <span>Tu Turno</span>
 </>
 ) : isBooked ? (
 <>
 <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
 <span>Ocupado</span>
 </>
 ) : (
 <>
 <Clock className="w-2.5 h-2.5 text-forest/60" />
 <span>Disponible</span>
 </>
 )}
 </span>
 </div>

 <span className="text-[10px] text-muted-foreground capitalize">
 {dateStr}
 </span>

 {isBooked ? (
 <div className="p-2 rounded-xl bg-white/80 border border-emerald-100 text-[11px] flex items-center justify-between">
 <div>
 <strong className="text-emerald-950 block">{booking?.student?.fullName || 'Familia'}</strong>
 <span className="text-[10px] text-muted-foreground">{booking?.tutor?.fullName || booking?.guestName}</span>
 </div>

 {(isStaff || isMySlot) && (
 <button
 onClick={() => setCancelModalBookingId(booking.id)}
 className="p-1 text-muted-foreground hover:text-destructive transition-colors"
 title="Liberar este horario"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 ) : (
 <div className="pt-1">
 {isTutor ? (
 <button
 type="button"
 onClick={() => {
 setSelectedSlotForBooking(slot);
 setSlotNotes('');
 }}
 className="w-full py-1.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-[11px] font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 hover:scale-102"
 >
 <CalendarIcon className="w-3 h-3" />
 <span>Reservar Turno</span>
 </button>
 ) : (
 <span className="text-[11px] text-muted-foreground italic">
 Libre para reservar
 </span>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </>
 )}
 </div>
 )}
 </div>
 )}

 {/* TAB 2: BITACORA & MATERIALES */}
 {activeTab === 'post_event' && (
 <div className="space-y-4 animate-in fade-in">
 {/* Pedagogical notes & preparations: Staff can edit, Tutors read */}
 <div>
 {isStaff ? (
 <VoiceNoteTextarea
 label="Bitácora, Preparativos & Conclusiones Pedagógicas"
 value={postNotes}
 onChange={setPostNotes}
 placeholder="Registra información clave: indicaciones previas, materiales que deben traer, guías pedagógicas o conclusiones posteriores a la actividad..."
 rows={3}
 context="event"
 className="space-y-1"
 />
 ) : (
 <>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Bitácora, Preparativos & Conclusiones Pedagógicas
 </label>
 <div className="p-3.5 rounded-2xl bg-white border border-forest/10 text-xs text-forest/90 leading-relaxed italic">
 {postNotes ? `"${postNotes}"` : 'La bitácora e indicaciones pedagógicas de este evento aún no han sido redactadas por el equipo docente.'}
 </div>
 </>
 )}
 </div>

 {/* Photo & Material Gallery Grid */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-forest uppercase tracking-wider">
 Materiales Visuales & Galería ({photoUrls.length})
 </span>

 {isStaff && (
 <label className="px-3 py-1.5 bg-forest hover:bg-forest/90 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95">
 <Upload className="w-3.5 h-3.5" />
 <span>Subir Foto / Material</span>
 <input
 type="file"
 accept="image/*"
 onChange={handleUploadPhoto}
 className="hidden"
 />
 </label>
 )}
 </div>

 {photoUrls.length === 0 ? (
 <div className="p-8 text-center border-2 border-dashed border-forest/15 rounded-2xl bg-cream/20 text-xs text-muted-foreground">
 Aún no se han adjuntado fotos ni materiales gráficos a la bitácora.
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
 {photoUrls.map((url, idx) => (
 <div key={idx} className="relative group rounded-2xl overflow-hidden border border-forest/10 shadow-2xs aspect-video bg-slate-100">
 <img src={url} alt={`Material ${idx + 1}`} className="w-full h-full object-cover" />
 {isStaff && (
 <button
 type="button"
 onClick={() => setPhotoUrls(prev => prev.filter((_, i) => i !== idx))}
 className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-destructive text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
 title="Eliminar material"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 )}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Save Bitacora Button: Staff only */}
 {isStaff && (
 <div className="pt-2 flex justify-end">
 <button
 type="button"
 onClick={handleSavePostEvent}
 disabled={savingPost}
 className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
 >
 <Check className="w-4 h-4" />
 <span>{savingPost ? 'Guardando...' : 'Guardar Bitácora del Evento'}</span>
 </button>
 </div>
 )}
 </div>
 )}

 {/* ========================================================= */}
 {/* CUSTOM CONFIRMATION MODAL FOR BOOKING A SLOT */}
 {/* ========================================================= */}
 {selectedSlotForBooking && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
 <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-forest/20 space-y-4 animate-in zoom-in-95">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
 <CalendarIcon className="w-6 h-6 text-forest" />
 </div>
 <div>
 <h3 className="font-bold text-forest text-base font-display">
 Confirmar Reserva de Turno
 </h3>
 <span className="text-xs text-muted-foreground">
 Verifica la información antes de apartar tu horario.
 </span>
 </div>
 </div>

 {/* Summary Card */}
 <div className="p-4 rounded-2xl bg-cream/50 border border-forest/10 space-y-2 text-xs">
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Evento:</span>
 <strong className="text-forest font-bold">{currentEvent.title}</strong>
 </div>

 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Fecha:</span>
 <strong className="text-forest">
 {new Date(selectedSlotForBooking.startTime).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
 </strong>
 </div>

 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Horario:</span>
 <strong className="text-forest font-mono text-xs px-2 py-0.5 rounded-lg bg-forest/10">
 {new Date(selectedSlotForBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedSlotForBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </strong>
 </div>

 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Familia / Titular:</span>
 <strong className="text-forest">{user?.fullName || 'Familia'}</strong>
 </div>
 </div>

 {/* Optional Notes */}
 <div>
 <label className="block text-[11px] font-bold text-forest uppercase mb-1">
 Notas o Temas a tratar (opcional):
 </label>
 <input
 type="text"
 value={slotNotes}
 onChange={(e) => setSlotNotes(e.target.value)}
 placeholder="ej. Conversar sobre el área de lenguaje..."
 className="w-full px-3.5 py-2 rounded-xl border border-forest/20 text-xs text-forest bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>

 {/* Action Buttons */}
 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setSelectedSlotForBooking(null)}
 disabled={bookingLoading}
 className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-forest/5 transition-colors"
 >
 Cancelar
 </button>

 <button
 type="button"
 onClick={handleExecuteBookSlot}
 disabled={bookingLoading}
 className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
 >
 <Check className="w-4 h-4" />
 <span>{bookingLoading ? 'Reservando...' : 'Sí, Confirmar mi Turno'}</span>
 </button>
 </div>
 </div>
 </div>
 )}

 {/* ========================================================= */}
 {/* CUSTOM CONFIRMATION MODAL FOR CANCELLING A BOOKING */}
 {/* ========================================================= */}
 {cancelModalBookingId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
 <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-200 space-y-4 animate-in zoom-in-95">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center shrink-0">
 <AlertTriangle className="w-5 h-5 text-red-600" />
 </div>
 <div>
 <h3 className="font-bold text-forest text-sm font-display">
 ¿Liberar este Turno / Reserva?
 </h3>
 <span className="text-[11px] text-muted-foreground block mt-0.5">
 El espacio quedará disponible para que otra familia pueda reservarlo.
 </span>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setCancelModalBookingId(null)}
 className="px-3.5 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-forest/5 transition-colors"
 >
 Volver
 </button>

 <button
 type="button"
 onClick={() => handleCancelBooking(cancelModalBookingId)}
 className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span>Sí, Liberar Horario</span>
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 </SlideOverDrawer>
 );
};

export default EventDetailDrawer;
