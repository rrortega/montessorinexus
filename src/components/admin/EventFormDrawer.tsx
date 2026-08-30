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
 Tag,
 CalendarDays,
 Lock,
 Unlock,
 AlertCircle,
 ChevronRight,
 ChevronLeft,
 Wand2
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import {
 SchoolEventItem,
 EventCategoryItem,
 EnvironmentItem,
 StudentItem,
 EventSlotItem,
 createSchoolEvent,
 updateSchoolEvent,
 deleteSchoolEvent,
 getEventCategories,
 getEnvironments,
 getStudents
} from '@/lib/sqlite';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { VoiceNoteTextarea } from '@/components/ui/VoiceNoteTextarea';
import { toast } from 'sonner';

interface FormSlot {
 id?: string;
 name: string;
 date: string;
 startTime: string;
 endTime: string;
 maxCapacity: number;
 isLocked: boolean;
 bookingsCount?: number;
}

interface EventFormDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 event: SchoolEventItem | null;
 guidesList: Array<{ id: string; fullName: string; email: string }>;
 tutorsList: Array<{ id: string; fullName: string; email: string; phone?: string }>;
 onSaved: () => void;
 onDelete?: (id: string, title: string) => Promise<void> | void;
}

type TabKey = 'general' | 'audience' | 'schedule';

export const EventFormDrawer: React.FC<EventFormDrawerProps> = ({
 isOpen,
 onClose,
 event,
 guidesList,
 tutorsList,
 onSaved,
 onDelete
}) => {
 const confirm = useConfirm();
 const [activeTab, setActiveTab] = useState<TabKey>('general');
 const [categories, setCategories] = useState<EventCategoryItem[]>([]);
 const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
 const [students, setStudents] = useState<StudentItem[]>([]);
 const [loading, setLoading] = useState(false);
 const [deleting, setDeleting] = useState(false);

 // Tab 1: General Form State
 const [title, setTitle] = useState('');
 const [categoryId, setCategoryId] = useState('');
 const [description, setDescription] = useState('');
 const [location, setLocation] = useState('');
 const [coverImage, setCoverImage] = useState('');
 const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'>('PUBLISHED');
 const [isClosed, setIsClosed] = useState(false);

 // Tab 2: Audience & Staff
 const [targetScope, setTargetScope] = useState<'ALL_SCHOOL' | 'ENVIRONMENTS' | 'STUDENTS' | 'EXTERNAL_GUESTS'>('ALL_SCHOOL');
 const [selectedHostIds, setSelectedHostIds] = useState<string[]>([]);
 const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
 const [selectedEnvIds, setSelectedEnvIds] = useState<string[]>([]);
 const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

 // Tab 3: Modality & Schedule
 const [eventType, setEventType] = useState<'OPEN_MASSIVE' | 'SLOT_BOOKING'>('OPEN_MASSIVE');
 const [startDate, setStartDate] = useState('');
 const [startTime, setStartTime] = useState('09:00');
 const [endDate, setEndDate] = useState('');
 const [endTime, setEndTime] = useState('13:00');

 // Slot Generator & List
 const [slotDurationMinutes, setSlotDurationMinutes] = useState(45);
 const [defaultMaxBookings, setDefaultMaxBookings] = useState(1);
 const [slotsList, setSlotsList] = useState<FormSlot[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, envs, studs] = await Promise.all([
          getEventCategories(),
          getEnvironments(),
          getStudents()
        ]);
        setCategories(cats);
        setEnvironments(envs);
        setStudents(studs);
      } catch (e) {
        console.error('Error fetching event drawer metadata:', e);
      }
    };
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      setTitle(event.title || '');
      setCategoryId(event.categoryId || '');
      setDescription(event.description || '');
      setLocation(event.location || '');
      setCoverImage(event.coverImage || '');
      setEventType(event.eventType || 'OPEN_MASSIVE');
      setTargetScope(event.targetScope || 'ALL_SCHOOL');
      setIsClosed(Boolean(event.isClosed));
      setStatus(event.status || 'PUBLISHED');
      setSlotDurationMinutes(event.slotDurationMinutes || 45);
      setDefaultMaxBookings(event.maxBookingsPerSlot || 1);

      if (event.startDateTime) {
        const d = new Date(event.startDateTime);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setStartDate(`${yyyy}-${mm}-${dd}`);
        setStartTime(d.toTimeString().slice(0, 5));
      }
      if (event.endDateTime) {
        const d = new Date(event.endDateTime);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setEndDate(`${yyyy}-${mm}-${dd}`);
        setEndTime(d.toTimeString().slice(0, 5));
      }

      setSelectedHostIds(event.hosts?.map(h => h.userId) || []);
      setSelectedVolunteerIds(event.volunteers?.map(v => v.tutorUserId) || []);
      setSelectedEnvIds(event.targetEnvironments?.map(te => te.environment.id) || []);
      setSelectedStudentIds(event.targetStudents?.map(ts => ts.student.id) || []);

      // Load existing slots
      if (event.slots && event.slots.length > 0) {
        const mappedSlots: FormSlot[] = event.slots.map(s => {
          const sStart = new Date(s.startTime);
          const sEnd = new Date(s.endTime);
          const yyyy = sStart.getFullYear();
          const mm = String(sStart.getMonth() + 1).padStart(2, '0');
          const dd = String(sStart.getDate()).padStart(2, '0');
          return {
            id: s.id,
            name: s.name || '',
            date: `${yyyy}-${mm}-${dd}`,
            startTime: sStart.toTimeString().slice(0, 5),
            endTime: sEnd.toTimeString().slice(0, 5),
            maxCapacity: s.maxCapacity || 1,
            isLocked: Boolean(s.isLocked),
            bookingsCount: s.bookings?.length || 0
          };
        });
        setSlotsList(mappedSlots);
      } else {
        setSlotsList([]);
      }
    } else {
      // Default new event
      setTitle('');
      setCategoryId(categories[0]?.id || '');
      setDescription('');
      setLocation('Campus Ceiba Roots');
      setCoverImage('');
      setEventType('OPEN_MASSIVE');
      setTargetScope('ALL_SCHOOL');
      setIsClosed(false);
      setStatus('PUBLISHED');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const tomStr = `${yyyy}-${mm}-${dd}`;
      setStartDate(tomStr);
      setStartTime('09:00');
      setEndDate(tomStr);
      setEndTime('13:00');
      setSlotDurationMinutes(45);
      setDefaultMaxBookings(1);
      setSlotsList([]);

      setSelectedHostIds(guidesList.slice(0, 1).map(g => g.id));
      setSelectedVolunteerIds([]);
      setSelectedEnvIds([]);
      setSelectedStudentIds([]);
    }
    setActiveTab('general');
  }, [event, isOpen]);

  // Set default category if categories loaded after modal opened and none was set
  useEffect(() => {
    if (categories.length > 0 && !categoryId && !event) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId, event]);

 // Generate slots from general date & time
 const handleAutoGenerateSlots = () => {
 if (!startDate || !endDate || !startTime || !endTime) {
 toast.error('Define primero las fechas y horas de inicio y fin.');
 return;
 }

 const startObj = new Date(`${startDate}T${startTime}:00`);
 const endObj = new Date(`${endDate}T${endTime}:00`);

 if (endObj <= startObj) {
 toast.error('La fecha y hora de fin debe ser posterior a la de inicio.');
 return;
 }

 const durationMs = (slotDurationMinutes || 45) * 60 * 1000;
 const generated: FormSlot[] = [];
 let current = new Date(startObj.getTime());
 let counter = 1;

 while (current.getTime() + durationMs <= endObj.getTime()) {
 const slotEnd = new Date(current.getTime() + durationMs);
 const curDateStr = current.toISOString().split('T')[0];
 const curStartTimeStr = current.toTimeString().slice(0, 5);
 const curEndTimeStr = slotEnd.toTimeString().slice(0, 5);

 generated.push({
 id: `temp_${Date.now()}_${counter}`,
 name: `Turno ${counter}`,
 date: curDateStr,
 startTime: curStartTimeStr,
 endTime: curEndTimeStr,
 maxCapacity: defaultMaxBookings || 1,
 isLocked: false,
 bookingsCount: 0
 });

 current = new Date(slotEnd.getTime());
 counter++;
 }

 if (generated.length === 0) {
 toast.error('El rango de horas es menor a la duración del turno.');
 return;
 }

 setSlotsList(generated);
 toast.success(`Se generaron ${generated.length} turnos automáticamente.`);
 };

 // Add individual custom slot
 const handleAddCustomSlot = () => {
 const defaultDate = startDate || new Date().toISOString().split('T')[0];
 const newSlot: FormSlot = {
 id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
 name: `Turno ${slotsList.length + 1}`,
 date: defaultDate,
 startTime: '09:00',
 endTime: '09:45',
 maxCapacity: defaultMaxBookings || 1,
 isLocked: false,
 bookingsCount: 0
 };
 setSlotsList(prev => [...prev, newSlot]);
 };

 // Update specific slot field
 const handleUpdateSlot = (index: number, field: keyof FormSlot, value: any) => {
 setSlotsList(prev => {
 const next = [...prev];
 next[index] = { ...next[index], [field]: value };
 return next;
 });
 };

  // Remove specific slot
  const handleRemoveSlot = (index: number) => {
    const slot = slotsList[index];
    if (slot.bookingsCount && slot.bookingsCount > 0) {
      const confirmed = window.confirm(`Este turno tiene ${slot.bookingsCount} reserva(s) registradas. ¿Seguro que deseas eliminarlo?`);
      if (!confirmed) return;
    }
    setSlotsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (activeTab === 'general') {
      if (!title.trim()) {
        toast.error('Ingresa el título del evento antes de continuar.');
        return;
      }
      if (!categoryId) {
        toast.error('Selecciona una categoría para el evento.');
        return;
      }
      setActiveTab('audience');
    } else if (activeTab === 'audience') {
      setActiveTab('schedule');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Ingresa el título del evento.');
      setActiveTab('general');
      return;
    }
    if (!categoryId) {
      toast.error('Selecciona una categoría para el evento.');
      setActiveTab('general');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Define las fechas de inicio y fin del evento.');
      setActiveTab('schedule');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${endDate}T${endTime}:00`).toISOString();

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      toast.error('La fecha/hora de fin debe ser posterior a la de inicio.');
      setActiveTab('schedule');
      return;
    }

    // Format slots payload if SLOT_BOOKING
    let formattedSlotsPayload: Array<{
      id?: string;
      name?: string;
      startTime: string;
      endTime: string;
      maxCapacity: number;
      isLocked: boolean;
    }> = [];

    if (eventType === 'SLOT_BOOKING') {
      if (slotsList.length === 0) {
        toast.error('Por favor agrega o genera al menos un turno para la modalidad por turnos.');
        setActiveTab('schedule');
        return;
      }

      formattedSlotsPayload = slotsList.map(s => {
        const slotStart = new Date(`${s.date}T${s.startTime}:00`).toISOString();
        const slotEnd = new Date(`${s.date}T${s.endTime}:00`).toISOString();
        return {
          id: s.id && !s.id.startsWith('temp_') ? s.id : undefined,
          name: s.name?.trim() || '',
          startTime: slotStart,
          endTime: slotEnd,
          maxCapacity: Number(s.maxCapacity) || 1,
          isLocked: Boolean(s.isLocked)
        };
      });
    }

    setLoading(true);
    try {
      const payload = {
        categoryId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        coverImage,
        eventType,
        targetScope,
        status,
        isClosed,
        startDateTime,
        endDateTime,
        slotDurationMinutes: Number(slotDurationMinutes) || 45,
        maxBookingsPerSlot: Number(defaultMaxBookings) || 1,
        hostUserIds: selectedHostIds,
        volunteerTutorIds: selectedVolunteerIds,
        environmentIds: selectedEnvIds,
        studentIds: selectedStudentIds,
        slots: eventType === 'SLOT_BOOKING' ? formattedSlotsPayload : undefined
      };

      if (event) {
        await updateSchoolEvent(event.id, payload);
        toast.success('¡Evento actualizado exitosamente!');
      } else {
        await createSchoolEvent(payload);
        toast.success('¡Evento programado y publicado!');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving event:', err);
      toast.error(err.message || 'Error al guardar evento');
    } finally {
      setLoading(false);
    }
  };

  const toggleHost = (id: string) => {
    setSelectedHostIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleVolunteer = (id: string) => {
    setSelectedVolunteerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleEnv = (id: string) => {
    setSelectedEnvIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDelete = async () => {
    if (!event) return;

    const activeBookings = event.bookings?.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING') || [];
    if (activeBookings.length > 0) {
      toast.error(`No se puede eliminar el evento porque tiene ${activeBookings.length} reserva(s) activa(s). Primero cancela todas las reservas asociadas y luego elimina el evento.`);
      return;
    }

    const ok = await confirm({
      title: '¿Eliminar evento?',
      message: `¿Estás seguro de eliminar "${event.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar evento',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!ok) return;

    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(event.id, event.title);
      } else {
        await deleteSchoolEvent(event.id);
        toast.success('Evento eliminado correctamente');
        onSaved();
      }
      onClose();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      toast.error(err.message || 'Error al eliminar evento');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl lg:max-w-3xl"
      icon={<CalendarIcon className="w-5 h-5 text-forest" />}
      title={event ? 'Editar Programación / Evento' : 'Nueva Programación / Evento Escolar'}
      description="Planifica actividades masivas, salidas, o turnos de citas familiares y entrevistas."
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {event && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Eliminar este evento"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Eliminando...' : 'Eliminar Evento'}</span>
              </button>
            )}

            {activeTab === 'audience' && (
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className="px-3.5 py-2 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior: Datos</span>
              </button>
            )}
            {activeTab === 'schedule' && (
              <button
                type="button"
                onClick={() => setActiveTab('audience')}
                className="px-3.5 py-2 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior: Audiencia</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest cursor-pointer"
            >
              Cancelar
            </button>

            {activeTab === 'general' && (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Siguiente: Audiencia</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {activeTab === 'audience' && (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Siguiente: Horarios</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {activeTab === 'schedule' && (
              <button
                type="submit"
                form="event-drawer-form"
                disabled={loading}
                className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{event ? 'Guardar Cambios' : 'Publicar Evento'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      <form id="event-drawer-form" onSubmit={handleSubmit} className="space-y-6">

        {/* TABS HEADER STRIP */}
        <div className="grid grid-cols-3 gap-2 bg-stone-100/80 p-1 rounded-2xl border border-forest/10">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'general'
              ? 'bg-white text-forest shadow-xs border border-forest/10'
              : 'text-muted-foreground hover:text-forest'
            }`}
          >
 <FileText className="w-3.5 h-3.5 shrink-0" />
 <span className="truncate">1. Datos Generales</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('audience')}
 className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'audience'
 ? 'bg-white text-forest shadow-xs border border-forest/10'
 : 'text-muted-foreground hover:text-forest'
 }`}
 >
 <Users className="w-3.5 h-3.5 shrink-0" />
 <span className="truncate">2. Audiencia & Staff</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('schedule')}
 className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'schedule'
 ? 'bg-white text-forest shadow-xs border border-forest/10'
 : 'text-muted-foreground hover:text-forest'
 }`}
 >
 <Clock className="w-3.5 h-3.5 shrink-0" />
 <span className="truncate">3. Horarios & Slots</span>
 </button>
 </div>

 {/* ========================================================================= */}
 {/* TAB 1: INFORMACIÓN GENERAL */}
 {/* ========================================================================= */}
 {activeTab === 'general' && (
 <div className="space-y-4 animate-in fade-in duration-200">
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Título de la Actividad o Evento *
 </label>
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="ej. Outdoor School: Exploración del Bosque y Huerto"
 required
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs font-semibold text-forest focus:outline-hidden focus:ring-2 focus:ring-forest bg-white"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Categoría *
 </label>
 <select
 value={categoryId}
 onChange={(e) => setCategoryId(e.target.value)}
 required
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs font-bold text-forest focus:outline-hidden focus:ring-2 focus:ring-forest bg-white cursor-pointer"
 >
 <option value="">Selecciona Categoría...</option>
 {categories.map(c => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Lugar / Ubicación
 </label>
 <div className="relative">
 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 placeholder="ej. Patio Principal / Parque La Ceiba"
 className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-hidden focus:ring-2 focus:ring-forest bg-white"
 />
 </div>
 </div>
 </div>

 <div>
            <VoiceNoteTextarea
              label="Descripción & Objetivos de la Actividad"
              value={description}
              onChange={setDescription}
              placeholder="Detalla qué aprenderán los niños, qué deben traer (ropa, alimentos, herramientas) o instrucciones para los padres..."
              rows={3}
              context="event"
              className="space-y-1"
            />
          </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Estado del Evento
 </label>
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value as any)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs font-bold text-forest focus:outline-hidden focus:ring-2 focus:ring-forest bg-white cursor-pointer"
 >
 <option value="PUBLISHED">Publicado (Visible)</option>
 <option value="DRAFT">Borrador (Oculto)</option>
 <option value="COMPLETED">Finalizado</option>
 <option value="CANCELLED">Cancelado</option>
 </select>
 </div>

 <div className="flex items-center gap-3 pt-5">
 <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-forest">
 <input
 type="checkbox"
 checked={isClosed}
 onChange={(e) => setIsClosed(e.target.checked)}
 className="w-4 h-4 rounded text-forest"
 />
 <span>Evento Privado (Solo por invitación)</span>
 </label>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Foto de Portada del Evento (Opcional)
 </label>
 <ImageUploadDropzone
 value={coverImage}
 onChange={setCoverImage}
 folder="gallery"
 aspectRatio="video"
 placeholderText="Sube una foto representativa de la actividad..."
 />
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* TAB 2: AUDIENCIA & ANFITRIONES */}
 {/* ========================================================================= */}
 {activeTab === 'audience' && (
 <div className="space-y-5 animate-in fade-in duration-200">
 {/* Target Scope */}
 <div className="space-y-3">
 <span className="text-xs font-bold text-forest uppercase tracking-wider block">
 Audiencia y Salones Involucrados
 </span>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
 <button
 type="button"
 onClick={() => setTargetScope('ALL_SCHOOL')}
 className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${targetScope === 'ALL_SCHOOL'
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-white border-forest/20 text-forest/70 hover:text-forest'
 }`}
 >
 Toda la Escuela
 </button>

 <button
 type="button"
 onClick={() => setTargetScope('ENVIRONMENTS')}
 className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${targetScope === 'ENVIRONMENTS'
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-white border-forest/20 text-forest/70 hover:text-forest'
 }`}
 >
 Salones Específicos
 </button>

 <button
 type="button"
 onClick={() => setTargetScope('STUDENTS')}
 className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${targetScope === 'STUDENTS'
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-white border-forest/20 text-forest/70 hover:text-forest'
 }`}
 >
 Alumnos Específicos
 </button>

 <button
 type="button"
 onClick={() => setTargetScope('EXTERNAL_GUESTS')}
 className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${targetScope === 'EXTERNAL_GUESTS'
 ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
 : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
 }`}
 >
 Aspirantes / Externos
 </button>
 </div>

 {/* Informative banner if EXTERNAL_GUESTS */}
 {targetScope === 'EXTERNAL_GUESTS' && (
 <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1 animate-in fade-in">
 <div className="flex items-center gap-1.5 font-bold text-xs">
 <Sparkles className="w-4 h-4 text-purple-700" />
 <span>Destinado Exclusivamente para Formularios y Citas de Admisión</span>
 </div>
 <p className="text-[11px] text-purple-800 leading-relaxed">
 Este evento está configurado para que aspirantes e invitados externos agenden citas o confirmen asistencia mediante formularios web públicos. <strong>No se publicará en el calendario general de los padres matriculados actualmente.</strong>
 </p>
 </div>
 )}

 {/* Environment Pills Selector */}
 {targetScope === 'ENVIRONMENTS' && (
 <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-2 animate-in fade-in">
 <span className="text-xs font-bold text-forest block">
 Selecciona los salones participantes:
 </span>
 <div className="flex flex-wrap gap-2">
 {environments.map(env => {
 const isSelected = selectedEnvIds.includes(env.id);
 return (
 <button
 key={env.id}
 type="button"
 onClick={() => toggleEnv(env.id)}
 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${isSelected
 ? 'bg-forest text-white border-forest shadow-2xs'
 : 'bg-white text-forest/70 border-forest/15 hover:bg-forest/5'
 }`}
 >
 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: env.color || '#1b3b2b' }} />
 <span>{env.name}</span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Student Selector */}
 {targetScope === 'STUDENTS' && (
 <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-2 animate-in fade-in">
 <span className="text-xs font-bold text-forest block">
 Selecciona los estudiantes:
 </span>
 <div className="max-h-48 overflow-y-auto divide-y divide-forest/5 bg-white rounded-xl border border-forest/10 p-2">
 {students.map(st => {
 const isSelected = selectedStudentIds.includes(st.id);
 return (
 <label key={st.id} className="flex items-center gap-2 p-1.5 hover:bg-forest/5 rounded-lg cursor-pointer text-xs">
 <input
 type="checkbox"
 checked={isSelected}
 onChange={() => toggleStudent(st.id)}
 className="w-4 h-4 rounded text-forest"
 />
 <span className="font-bold text-forest">{st.full_name}</span>
 <span className="text-[10px] text-muted-foreground">({st.environment_name || 'Sin salón'})</span>
 </label>
 );
 })}
 </div>
 </div>
 )}
 </div>

 {/* Staff Hosts */}
 <div className="space-y-2 pt-3 border-t border-forest/10">
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider">
 Docentes / Guías Anfitriones (Staff)
 </label>
 <div className="flex flex-wrap gap-2">
 {guidesList.map(g => {
 const isSelected = selectedHostIds.includes(g.id);
 return (
 <button
 key={g.id}
 type="button"
 onClick={() => toggleHost(g.id)}
 className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${isSelected
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-white text-forest/70 border-forest/15 hover:bg-forest/5'
 }`}
 >
 {g.fullName}
 </button>
 );
 })}
 </div>
 </div>

 {/* Tutor Volunteers */}
 <div className="space-y-2 pt-3 border-t border-forest/10">
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider">
 Tutores / Padres Voluntarios (Opcional)
 </label>
 <div className="flex flex-wrap gap-2">
 {tutorsList.map(t => {
 const isSelected = selectedVolunteerIds.includes(t.id);
 return (
 <button
 key={t.id}
 type="button"
 onClick={() => toggleVolunteer(t.id)}
 className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${isSelected
 ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
 : 'bg-white text-forest/70 border-forest/15 hover:bg-forest/5'
 }`}
 >
 {t.fullName}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* TAB 3: HORARIOS, MODALIDAD Y TURNOS / SLOTS */}
 {/* ========================================================================= */}
 {activeTab === 'schedule' && (
 <div className="space-y-5 animate-in fade-in duration-200">
 {/* Event Type Cards */}
 <div className="space-y-2">
 <span className="text-xs font-bold text-forest uppercase tracking-wider block">
 Modalidad del Evento
 </span>

 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setEventType('OPEN_MASSIVE')}
 className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${eventType === 'OPEN_MASSIVE'
 ? 'bg-forest/10 border-forest ring-2 ring-forest/20 shadow-xs'
 : 'bg-white border-forest/15 hover:bg-forest/5'
 }`}
 >
 <div className="flex items-center gap-2 font-bold text-xs text-forest">
 <Users className="w-4 h-4 text-forest" />
 <span>Evento Masivo (RSVP)</span>
 </div>
 <p className="text-[11px] text-muted-foreground mt-1">
 Todos asisten simultáneamente en el horario general.
 </p>
 </button>

 <button
 type="button"
 onClick={() => setEventType('SLOT_BOOKING')}
 className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${eventType === 'SLOT_BOOKING'
 ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-200 shadow-xs'
 : 'bg-white border-forest/15 hover:bg-forest/5'
 }`}
 >
 <div className="flex items-center gap-2 font-bold text-xs text-purple-900">
 <Clock className="w-4 h-4 text-purple-600" />
 <span>Por Turnos / Citas (Slots)</span>
 </div>
 <p className="text-[11px] text-muted-foreground mt-1">
 Fracciona el día en citas individuales o grupales personalizadas.
 </p>
 </button>
 </div>
 </div>

 {/* General Date & Time Range */}
 <div className="p-4 rounded-2xl bg-stone-50/80 border border-forest/10 space-y-3">
 <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
 Rango General de Fechas y Horas del Evento
 </span>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Fecha Inicio *
 </label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => {
 setStartDate(e.target.value);
 if (!endDate) setEndDate(e.target.value);
 }}
 required
 className="w-full px-2.5 py-2 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Hora Inicio *
 </label>
 <input
 type="time"
 value={startTime}
 onChange={(e) => setStartTime(e.target.value)}
 required
 className="w-full px-2.5 py-2 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Fecha Fin *
 </label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 required
 className="w-full px-2.5 py-2 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Hora Fin *
 </label>
 <input
 type="time"
 value={endTime}
 onChange={(e) => setEndTime(e.target.value)}
 required
 className="w-full px-2.5 py-2 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white"
 />
 </div>
 </div>
 </div>

 {/* SLOT BOOKING CONFIGURATION & CUSTOM SLOTS LIST */}
 {eventType === 'SLOT_BOOKING' && (
 <div className="space-y-4 pt-2 border-t border-forest/10 animate-in fade-in">
 {/* Auto generator bar */}
 <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
 <Wand2 className="w-4 h-4 text-purple-700" />
 <span>Generador Rápido de Turnos</span>
 </span>
 <button
 type="button"
 onClick={handleAutoGenerateSlots}
 className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
 >
 <Sparkles className="w-3.5 h-3.5" />
 <span>Generar Turnos Automáticos</span>
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-purple-900 uppercase mb-1">
 Duración por Turno
 </label>
 <select
 value={slotDurationMinutes}
 onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
 className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold text-purple-950 bg-white cursor-pointer"
 >
 <option value={15}>15 minutos</option>
 <option value={30}>30 minutos</option>
 <option value={45}>45 minutos (Recomendado)</option>
 <option value={60}>1 hora (60 minutos)</option>
 <option value={90}>1 hora y media (90 minutos)</option>
 <option value={120}>2 horas (120 minutos)</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-bold text-purple-900 uppercase mb-1">
 Capacidad / Familias por Turno
 </label>
 <input
 type="number"
 min={1}
 max={50}
 value={defaultMaxBookings}
 onChange={(e) => setDefaultMaxBookings(Number(e.target.value))}
 className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold text-purple-950 bg-white"
 />
 </div>
 </div>
 </div>

 {/* Custom Slots Header & Add Action */}
 <div className="flex items-center justify-between pt-2">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-forest uppercase tracking-wider">
 Turnos y Franjas Horarias Definidas ({slotsList.length})
 </span>
 </div>

 <button
 type="button"
 onClick={handleAddCustomSlot}
 className="px-3 py-1.5 bg-forest/10 hover:bg-forest/15 text-forest rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Agregar Turno Manual</span>
 </button>
 </div>

 {/* Slots Items List */}
 {slotsList.length === 0 ? (
 <div className="p-8 rounded-2xl bg-stone-50 border border-dashed border-forest/20 text-center space-y-2">
 <Clock className="w-8 h-8 text-forest/40 mx-auto" />
 <p className="text-xs text-muted-foreground">
 No has generado turnos todavía. Usa el generador rápido de arriba o agrega turnos manualmente.
 </p>
 </div>
 ) : (
 <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
 {slotsList.map((slot, idx) => (
 <div
 key={slot.id || idx}
 className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${slot.isLocked
 ? 'bg-stone-100 border-stone-300 opacity-75'
 : 'bg-white border-forest/15 shadow-2xs hover:border-forest/30'
 }`}
 >
 <div className="flex items-center justify-between gap-2">
 {/* Slot Name / Label */}
 <div className="flex-1 min-w-0">
 <input
 type="text"
 value={slot.name}
 onChange={(e) => handleUpdateSlot(idx, 'name', e.target.value)}
 placeholder={`Nombre de turno (ej. Sección Matutina, Horario Deportes)`}
 className="w-full px-2.5 py-1 text-xs font-bold text-forest placeholder:text-muted-foreground/60 border border-forest/10 rounded-lg bg-stone-50/60 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-forest"
 />
 </div>

 {/* Booking Count Badge if already has bookings */}
 {slot.bookingsCount !== undefined && slot.bookingsCount > 0 && (
 <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
 {slot.bookingsCount} {slot.bookingsCount === 1 ? 'reserva' : 'reservas'}
 </span>
 )}

 {/* Lock / Unlock Toggle */}
 <button
 type="button"
 onClick={() => handleUpdateSlot(idx, 'isLocked', !slot.isLocked)}
 className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${slot.isLocked
 ? 'bg-amber-100 text-amber-800 border-amber-300'
 : 'bg-stone-50 text-stone-500 border-stone-200 hover:text-stone-800'
 }`}
 title={slot.isLocked ? 'Turno Bloqueado (No reservable)' : 'Turno Abierto'}
 >
 {slot.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
 </button>

 {/* Remove Slot */}
 <button
 type="button"
 onClick={() => handleRemoveSlot(idx)}
 className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
 title="Eliminar este turno"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Slot Inputs Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
 <div>
 <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
 Fecha
 </label>
 <input
 type="date"
 value={slot.date}
 onChange={(e) => handleUpdateSlot(idx, 'date', e.target.value)}
 required
 className="w-full px-2 py-1 rounded-lg border border-forest/15 text-xs font-semibold text-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
 Hora Inicio
 </label>
 <input
 type="time"
 value={slot.startTime}
 onChange={(e) => handleUpdateSlot(idx, 'startTime', e.target.value)}
 required
 className="w-full px-2 py-1 rounded-lg border border-forest/15 text-xs font-semibold text-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
 Hora Fin
 </label>
 <input
 type="time"
 value={slot.endTime}
 onChange={(e) => handleUpdateSlot(idx, 'endTime', e.target.value)}
 required
 className="w-full px-2 py-1 rounded-lg border border-forest/15 text-xs font-semibold text-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
 Cupo / Familias
 </label>
 <input
 type="number"
 min={1}
 max={50}
 value={slot.maxCapacity}
 onChange={(e) => handleUpdateSlot(idx, 'maxCapacity', Number(e.target.value))}
 required
 className="w-full px-2 py-1 rounded-lg border border-forest/15 text-xs font-bold text-forest bg-white"
 />
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 )}

 </form>
 </SlideOverDrawer>
 );
};

export default EventFormDrawer;
