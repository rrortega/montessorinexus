import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Users, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  CalendarDays,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Layers
} from 'lucide-react';
import { 
  FormFieldItem, 
  getPublicSchoolEvent, 
  PublicSchoolEventSummary 
} from '@/lib/sqlite';

export interface ScheduleEventValue {
  eventId: string;
  eventTitle: string;
  eventType: 'OPEN_MASSIVE' | 'SLOT_BOOKING';
  slotId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  formattedTime?: string;
  formattedDate?: string;
  rsvpStatus?: 'CONFIRMED' | 'DECLINED';
  confirmedAt?: string;
  // Multi-event container support
  bookings?: Record<string, ScheduleEventValue>;
}

interface ScheduleEventWidgetProps {
  field: FormFieldItem;
  value?: ScheduleEventValue;
  onChange: (val: ScheduleEventValue | undefined) => void;
  themeColor?: string;
  borderRadius?: string;
  isDark?: boolean;
  layoutVariant?: 'standard' | 'focus';
}

const getRadiusClass = (rad: string = 'lg', elem: 'card' | 'button' | 'input' | 'badge' | 'icon' = 'card') => {
  if (!rad) return elem === 'card' ? 'rounded-2xl' : elem === 'button' ? 'rounded-xl' : 'rounded-lg';
  const cleanRadius = typeof rad === 'string' ? rad.replace(/^rounded-/, '') : 'lg';

  if (cleanRadius === 'none' || rad === 'rounded-none' || rad === 'none') {
    return 'rounded-none';
  }

  switch (cleanRadius) {
    case 'sm':
      return elem === 'badge' ? 'rounded-xs' : elem === 'button' || elem === 'icon' ? 'rounded-sm' : elem === 'input' ? 'rounded-sm' : 'rounded-md';
    case 'md':
      return elem === 'badge' ? 'rounded-sm' : elem === 'button' || elem === 'icon' ? 'rounded-md' : elem === 'input' ? 'rounded-md' : 'rounded-lg';
    case 'xl':
      return elem === 'badge' ? 'rounded-md' : elem === 'button' || elem === 'icon' ? 'rounded-xl' : elem === 'input' ? 'rounded-xl' : 'rounded-2xl';
    case '2xl':
      return elem === 'badge' ? 'rounded-lg' : elem === 'button' || elem === 'icon' ? 'rounded-2xl' : elem === 'input' ? 'rounded-2xl' : 'rounded-3xl';
    case '3xl':
      return elem === 'badge' ? 'rounded-xl' : elem === 'button' || elem === 'icon' ? 'rounded-3xl' : elem === 'input' ? 'rounded-3xl' : 'rounded-3xl';
    case 'full':
      return elem === 'card' ? 'rounded-3xl' : 'rounded-full';
    case 'lg':
    default:
      return elem === 'badge' ? 'rounded-sm' : elem === 'button' || elem === 'icon' ? 'rounded-xl' : elem === 'input' ? 'rounded-xl' : 'rounded-2xl';
  }
};

const getDateKeyFromIso = (isoStr?: string): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

const formatSlotTime = (isoStr?: string): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  } catch {
    return isoStr;
  }
};

const formatDateLabel = (dateKeyOrIso?: string): string => {
  if (!dateKeyOrIso) return '';
  try {
    if (dateKeyOrIso.includes('-') && dateKeyOrIso.length === 10) {
      const [y, m, d] = dateKeyOrIso.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    const date = new Date(dateKeyOrIso);
    if (isNaN(date.getTime())) return dateKeyOrIso;
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateKeyOrIso;
  }
};

const slideTransition = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1] as const
};

export const ScheduleEventWidget: React.FC<ScheduleEventWidgetProps> = ({
  field,
  value,
  onChange,
  themeColor = '#1b3b2b',
  borderRadius = 'lg',
  isDark = false,
  layoutVariant = 'standard'
}) => {
  const [eventsData, setEventsData] = useState<PublicSchoolEventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Multi-event active tab index
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);

  // Step state: 'calendar' (view 1: choose day) | 'slots' (view 2: choose time slot)
  const [activeStep, setActiveStep] = useState<'calendar' | 'slots'>('calendar');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isChangingSlot, setIsChangingSlot] = useState(false);

  // Month navigation in calendar
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // Resolved list of event IDs
  const targetEventIds: string[] = useMemo(() => {
    if (Array.isArray(field.eventIds) && field.eventIds.length > 0) {
      return field.eventIds;
    }
    if (field.eventId) {
      return [field.eventId];
    }
    return [];
  }, [field.eventIds, field.eventId]);

  useEffect(() => {
    if (targetEventIds.length === 0) {
      setEventsData([]);
      return;
    }

    let isMounted = true;
    const fetchEvents = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const results = await Promise.all(
          targetEventIds.map(id => getPublicSchoolEvent(id))
        );
        if (!isMounted) return;
        const validEvents = results.filter((ev): ev is PublicSchoolEventSummary => ev !== null);
        if (validEvents.length === 0) {
          setLoadError('Los eventos vinculados no están disponibles o han sido archivados.');
        } else {
          setEventsData(validEvents);
          // Set initial calendar month
          const firstWithSlots = validEvents[0];
          if (firstWithSlots?.slots && firstWithSlots.slots.length > 0) {
            const d = new Date(firstWithSlots.slots[0].startTime);
            if (!isNaN(d.getTime())) {
              setCurrentMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
            }
          }
        }
      } catch (err: any) {
        if (isMounted) setLoadError(err.message || 'Error al cargar información de los eventos.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvents();
    return () => { isMounted = false; };
  }, [targetEventIds.join(',')]);

  // Current active event in multi-event list
  const activeEvent = eventsData[selectedEventIndex] || eventsData[0];

  // When changing active event tab, update initial month if necessary
  useEffect(() => {
    if (activeEvent?.slots && activeEvent.slots.length > 0) {
      const d = new Date(activeEvent.slots[0].startTime);
      if (!isNaN(d.getTime())) {
        setCurrentMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
    setActiveStep('calendar');
    setSelectedDateKey(null);
    setIsChangingSlot(false);
  }, [selectedEventIndex, activeEvent?.id]);

  // Group slots by parsed DateKey (YYYY-MM-DD) for active event
  const slotsByDate = useMemo(() => {
    if (!activeEvent?.slots || !Array.isArray(activeEvent.slots)) return {};
    const groups: Record<string, typeof activeEvent.slots> = {};
    activeEvent.slots.forEach(slot => {
      const dateKey = getDateKeyFromIso(slot.startTime) || 'sin_fecha';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(slot);
    });
    return groups;
  }, [activeEvent]);

  const uniqueDates = useMemo(() => Object.keys(slotsByDate).filter(k => k !== 'sin_fecha').sort(), [slotsByDate]);

  // Calendar month calculation
  const calendarGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = (firstDayIndex + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateKey: ''
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        isCurrentMonth: true,
        dateKey
      });
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateKey: ''
      });
    }

    return days;
  }, [currentMonthDate]);

  const monthLabel = currentMonthDate.toLocaleDateString('es-MX', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Helper to extract booking value for a specific event
  const getEventBookingValue = (evId: string): ScheduleEventValue | undefined => {
    if (!value) return undefined;
    if (value.bookings && value.bookings[evId]) {
      return value.bookings[evId];
    }
    if (value.eventId === evId) {
      return value;
    }
    return undefined;
  };

  // Helper to update a booking for a specific event
  const setEventBooking = (evId: string, bookingData: ScheduleEventValue | undefined) => {
    const currentBookings = { ...(value?.bookings || {}) };
    if (value?.eventId && !currentBookings[value.eventId]) {
      currentBookings[value.eventId] = value;
    }

    if (bookingData) {
      currentBookings[evId] = bookingData;
    } else {
      delete currentBookings[evId];
    }

    const firstBooking = Object.values(currentBookings)[0];

    if (Object.keys(currentBookings).length === 0) {
      onChange(undefined);
    } else {
      onChange({
        ...(firstBooking || bookingData),
        bookings: currentBookings
      });
    }
  };

  // 1. Unconfigured State
  if (targetEventIds.length === 0) {
    return (
      <div className={`p-6 text-center border border-dashed ${getRadiusClass(borderRadius, 'card')} space-y-2.5 ${
        isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-stone-50/70 border-stone-300 text-stone-600'
      }`}>
        <CalendarIcon className="w-8 h-8 mx-auto opacity-40 text-forest" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Agenda del Calendario No Vinculada
          </p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            El administrador del formulario aún no ha seleccionado qué eventos asignar a este campo.
          </p>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (loading) {
    return (
      <div className={`p-8 border ${getRadiusClass(borderRadius, 'card')} flex flex-col items-center justify-center gap-3 animate-pulse ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-stone-200 text-slate-700'
      }`}>
        <RefreshCw className="w-6 h-6 animate-spin text-forest" style={{ color: themeColor }} />
        <div className="text-center space-y-0.5">
          <span className="text-xs font-bold block">Consultando disponibilidad de citas...</span>
          <span className="text-[11px] text-muted-foreground">Sincronizando con el calendario escolar</span>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (loadError || eventsData.length === 0 || !activeEvent) {
    return (
      <div className={`p-5 border ${getRadiusClass(borderRadius, 'card')} flex items-start gap-3.5 ${
        isDark ? 'bg-rose-950/30 border-rose-900/50 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}>
        <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Información de agenda no disponible</p>
          <p className="text-[11px] opacity-90">{loadError || 'No se pudo obtener la información de disponibilidad.'}</p>
        </div>
      </div>
    );
  }

  const activeBookingValue = getEventBookingValue(activeEvent.id);
  const isSlotSelected = Boolean(activeBookingValue?.slotId && activeBookingValue.eventId === activeEvent.id);
  const isRsvpConfirmed = Boolean(activeBookingValue?.rsvpStatus === 'CONFIRMED' && activeBookingValue.eventId === activeEvent.id);
  const isEventCompleted = isSlotSelected || isRsvpConfirmed;

  const totalEventsCount = eventsData.length;
  const completedEventsCount = eventsData.filter(ev => {
    const b = getEventBookingValue(ev.id);
    return Boolean(b?.slotId || b?.rsvpStatus === 'CONFIRMED');
  }).length;

  return (
    <div className="space-y-3">
      {/* Multi-Event Tabs / Stepper (Shown only when 2+ events are configured) */}
      {totalEventsCount > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-forest" />
              <span>Eventos a agendar ({completedEventsCount} de {totalEventsCount} listos)</span>
            </span>
            {completedEventsCount === totalEventsCount && (
              <span className={`text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 ${getRadiusClass(borderRadius, 'badge')}`}>
                ✓ Todos completados
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {eventsData.map((ev, idx) => {
              const isTabActive = idx === selectedEventIndex;
              const evBooking = getEventBookingValue(ev.id);
              const isDone = Boolean(evBooking?.slotId || evBooking?.rsvpStatus === 'CONFIRMED');

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedEventIndex(idx)}
                  className={`px-3 py-2 border text-left transition-all shrink-0 cursor-pointer flex items-center gap-2.5 min-w-[150px] sm:min-w-[180px] ${getRadiusClass(borderRadius, 'button')} ${
                    isTabActive
                      ? 'bg-forest text-white border-forest shadow-xs ring-2 ring-forest/20'
                      : isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-forest hover:bg-emerald-500/20'
                        : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                  style={isTabActive ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isTabActive
                      ? 'bg-white/20 text-white'
                      : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-forest/10 text-forest'
                  }`}>
                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold font-display truncate block leading-tight">
                      {ev.title}
                    </span>
                    <span className={`text-[9.5px] truncate block ${isTabActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {isDone ? (evBooking?.formattedTime || 'Agendado') : (ev.eventType === 'SLOT_BOOKING' ? 'Elegir horario' : 'Confirmar')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE EVENT CONTAINER */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {/* A. SLOT BOOKING EVENT TYPE */}
          {activeEvent.eventType === 'SLOT_BOOKING' && (() => {
            const selectedSlotObj = activeEvent.slots?.find(s => s.id === activeBookingValue?.slotId);
            const formattedSelectedDate = activeBookingValue?.formattedDate || (selectedSlotObj ? formatDateLabel(getDateKeyFromIso(selectedSlotObj.startTime)) : '');
            const formattedSelectedStart = activeBookingValue?.formattedTime || (selectedSlotObj ? `${formatSlotTime(selectedSlotObj.startTime)} - ${formatSlotTime(selectedSlotObj.endTime)}` : '');

            const currentScreen = isSlotSelected && !isChangingSlot ? 'confirmed' : activeStep;

            return (
              <React.Fragment key={`slot-container-${activeEvent.id}`}>
                {/* 1. CONFIRMED STATE */}
                {currentScreen === 'confirmed' && (
                  <motion.div
                    key={`confirmed-${activeEvent.id}`}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={slideTransition}
                    className={`border p-5 space-y-4 ${getRadiusClass(borderRadius, 'card')} shadow-sm ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-stone-200/90 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <motion.div 
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className={`w-11 h-11 flex items-center justify-center text-white shadow-xs shrink-0 ${
                            borderRadius === 'none' ? 'rounded-none' : borderRadius === 'full' ? 'rounded-full' : getRadiusClass(borderRadius, 'icon')
                          }`}
                          style={{ backgroundColor: themeColor }}
                        >
                          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                        </motion.div>
                        <div>
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-block mb-1 ${getRadiusClass(borderRadius, 'badge')}`}>
                            Turno Seleccionado
                          </span>
                          <h4 className="text-sm sm:text-base font-bold font-display text-forest line-clamp-1">
                            {activeEvent.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setDirection('backward');
                          setIsChangingSlot(true);
                          setActiveStep('calendar');
                        }}
                        className="text-xs font-bold text-forest hover:underline px-2 py-1 cursor-pointer transition-colors shrink-0"
                      >
                        Cambiar horario
                      </button>
                    </div>

                    <div 
                      className={`p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${getRadiusClass(borderRadius, 'input')} ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-stone-50/90 border-stone-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                        <CalendarDays className="w-4 h-4 text-forest shrink-0" />
                        <span className="capitalize">{formattedSelectedDate}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold font-mono text-forest">
                        <Clock className="w-4 h-4 text-forest shrink-0" />
                        <span>{formattedSelectedStart}</span>
                      </div>
                    </div>

                    {activeEvent.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{activeEvent.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-slate-100 dark:border-slate-800">
                      <Info className="w-3.5 h-3.5 text-forest/80 shrink-0" />
                      <span>Este horario quedará reservado a tu nombre al enviar el formulario.</span>
                    </div>
                  </motion.div>
                )}

                {/* 2. SLOTS VIEW FOR SELECTED DAY */}
                {currentScreen === 'slots' && selectedDateKey && (() => {
                  const daySlots = slotsByDate[selectedDateKey] || [];
                  const availableCount = daySlots.filter(s => s.isAvailable).length;

                  return (
                    <motion.div
                      key={`slots-${activeEvent.id}-${selectedDateKey}`}
                      initial={{ opacity: 0, x: direction === 'forward' ? 24 : -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction === 'forward' ? -24 : 24 }}
                      transition={slideTransition}
                      className={`border p-5 space-y-4 ${getRadiusClass(borderRadius, 'card')} shadow-xs ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-stone-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setDirection('backward');
                            setActiveStep('calendar');
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-forest hover:bg-forest/10 transition-all cursor-pointer hover:-translate-x-0.5 active:scale-95 ${getRadiusClass(borderRadius, 'button')}`}
                        >
                          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                          <span>Volver al calendario</span>
                        </button>

                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {availableCount} horarios disponibles
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                          Horarios para {activeEvent.title}:
                        </span>
                        <h3 className="text-sm sm:text-base font-bold font-display text-forest capitalize">
                          {formatDateLabel(selectedDateKey)}
                        </h3>
                        {activeEvent.slotDurationMinutes && (
                          <span className="text-[11px] text-muted-foreground block">
                            Citas individuales de <strong>{activeEvent.slotDurationMinutes} minutos</strong>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                        {daySlots.map((slot, idx) => {
                          const isCurrentChosen = activeBookingValue?.slotId === slot.id;
                          const isAvailable = slot.isAvailable;
                          const startTimeFormatted = formatSlotTime(slot.startTime);
                          const endTimeFormatted = formatSlotTime(slot.endTime);

                          return (
                            <motion.button
                              key={slot.id}
                              type="button"
                              disabled={!isAvailable}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02, duration: 0.2 }}
                              whileHover={isAvailable ? { scale: 1.02 } : {}}
                              whileTap={isAvailable ? { scale: 0.97 } : {}}
                              onClick={() => {
                                setDirection('forward');
                                setEventBooking(activeEvent.id, {
                                  eventId: activeEvent.id,
                                  eventTitle: activeEvent.title,
                                  eventType: 'SLOT_BOOKING',
                                  slotId: slot.id,
                                  date: selectedDateKey,
                                  startTime: slot.startTime,
                                  endTime: slot.endTime,
                                  formattedTime: `${startTimeFormatted} - ${endTimeFormatted}`,
                                  formattedDate: formatDateLabel(selectedDateKey),
                                  confirmedAt: new Date().toISOString()
                                });
                                setIsChangingSlot(false);
                              }}
                              className={`p-3 border text-center transition-colors relative flex flex-col items-center justify-center gap-1.5 ${getRadiusClass(borderRadius, 'button')} ${
                                isCurrentChosen
                                  ? 'bg-forest text-white shadow-sm ring-2 ring-forest/30 border-forest'
                                  : isAvailable
                                    ? isDark
                                      ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200 cursor-pointer shadow-2xs'
                                      : 'bg-stone-50/80 hover:bg-forest/10 hover:border-forest/40 border-stone-200 text-slate-800 cursor-pointer shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-muted-foreground opacity-40 cursor-not-allowed'
                              }`}
                              style={isCurrentChosen ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                            >
                              {slot.name && (
                                <span className="font-bold text-[11px] truncate max-w-full block leading-tight">
                                  {slot.name}
                                </span>
                              )}
                              <span className="font-mono font-bold text-xs sm:text-sm">
                                {startTimeFormatted} - {endTimeFormatted}
                              </span>

                              <div className="flex items-center gap-1 text-[10px] font-semibold">
                                {isCurrentChosen ? (
                                  <span className="flex items-center gap-1 text-white">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Seleccionado</span>
                                  </span>
                                ) : isAvailable ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Disponible
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Agotado
                                  </span>
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })()}

                {/* 3. MONTH CALENDAR VIEW */}
                {currentScreen === 'calendar' && (
                  <motion.div
                    key={`calendar-${activeEvent.id}`}
                    initial={{ opacity: 0, x: direction === 'backward' ? -24 : 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction === 'forward' ? -24 : 24 }}
                    transition={slideTransition}
                    className={`border p-5 space-y-4 ${getRadiusClass(borderRadius, 'card')} shadow-xs ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-stone-200 text-slate-900'
                    }`}
                  >
                    <div className="space-y-1 pb-2 border-b border-stone-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className={`w-8 h-8 flex items-center justify-center text-white shadow-2xs shrink-0 ${getRadiusClass(borderRadius, 'icon')}`}
                            style={{ backgroundColor: themeColor }}
                          >
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold font-display text-forest truncate">
                              {activeEvent.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground">
                              Selecciona un día en el calendario para ver los horarios disponibles
                            </span>
                          </div>
                        </div>

                        {isChangingSlot && (
                          <button
                            type="button"
                            onClick={() => setIsChangingSlot(false)}
                            className="text-[11px] font-bold text-muted-foreground hover:text-slate-900 dark:hover:text-white cursor-pointer px-2 py-1"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Calendar Widget */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs sm:text-sm font-bold font-display capitalize text-forest">
                          {monthLabel}
                        </h4>

                        <div className="flex items-center gap-1">
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            type="button"
                            onClick={() => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            className={`p-1.5 border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                            title="Mes anterior"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            type="button"
                            onClick={() => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            className={`p-1.5 border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer ${getRadiusClass(borderRadius, 'button')}`}
                            title="Mes siguiente"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dName => (
                          <div key={dName} className="py-1">{dName}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {calendarGrid.map((item, idx) => {
                          if (!item.isCurrentMonth) {
                            return (
                              <div key={idx} className="h-12 sm:h-14 p-1 opacity-20 text-[11px] font-mono flex items-center justify-center text-muted-foreground">
                                {item.day}
                              </div>
                            );
                          }

                          const dateKey = item.dateKey;
                          const hasSlots = Boolean(slotsByDate[dateKey] && slotsByDate[dateKey].length > 0);
                          const daySlots = slotsByDate[dateKey] || [];
                          const availableCount = daySlots.filter(s => s.isAvailable).length;
                          const isAvailableDay = hasSlots && availableCount > 0;

                          return (
                            <motion.button
                              key={idx}
                              type="button"
                              disabled={!isAvailableDay}
                              whileHover={isAvailableDay ? { scale: 1.05 } : {}}
                              whileTap={isAvailableDay ? { scale: 0.94 } : {}}
                              onClick={() => {
                                setDirection('forward');
                                setSelectedDateKey(dateKey);
                                setActiveStep('slots');
                              }}
                              className={`h-12 sm:h-14 p-1 border transition-colors flex flex-col items-center justify-between ${getRadiusClass(borderRadius, 'button')} ${
                                isAvailableDay
                                  ? isDark
                                    ? 'bg-slate-800/90 hover:bg-forest/30 border-forest/40 text-slate-100 cursor-pointer shadow-2xs'
                                    : 'bg-forest/5 hover:bg-forest hover:text-white border-forest/30 text-forest cursor-pointer shadow-2xs group'
                                  : hasSlots
                                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 text-rose-400 opacity-60 cursor-not-allowed'
                                    : 'border-transparent text-slate-400 opacity-40 cursor-not-allowed'
                              }`}
                            >
                              <span className="text-xs font-bold font-mono leading-none pt-1">
                                {item.day}
                              </span>

                              {isAvailableDay ? (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-white group-hover:text-forest transition-colors mb-0.5 ${getRadiusClass(borderRadius, 'badge')}`}>
                                  {availableCount} disp.
                                </span>
                              ) : hasSlots ? (
                                <span className="text-[8.5px] font-semibold text-rose-500 mb-0.5">
                                  Lleno
                                </span>
                              ) : (
                                <span className="h-2" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-stone-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        <span>Días con horarios disponibles</span>
                      </div>
                      <span>{uniqueDates.length} días configurados</span>
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            );
          })()}

          {/* B. OPEN MASSIVE EVENT TYPE */}
          {activeEvent.eventType === 'OPEN_MASSIVE' && (
            <motion.div 
              key={`massive-${activeEvent.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={slideTransition}
              className={`border p-5 space-y-4 ${getRadiusClass(borderRadius, 'card')} shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-stone-200 text-slate-900'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div 
                  className={`w-11 h-11 flex items-center justify-center text-white shadow-xs shrink-0 ${getRadiusClass(borderRadius, 'icon')}`}
                  style={{ backgroundColor: themeColor }}
                >
                  <CalendarDays className="w-5 h-5" />
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-forest/10 text-forest border border-forest/20 inline-block mb-0.5 ${getRadiusClass(borderRadius, 'badge')}`}>
                    Evento Escolar
                  </span>
                  <h4 className="text-sm sm:text-base font-bold font-display text-forest leading-tight truncate">
                    {activeEvent.title}
                  </h4>
                  {activeEvent.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                      {activeEvent.description}
                    </p>
                  )}
                </div>
              </div>

              <div className={`p-3.5 border space-y-2 text-xs ${getRadiusClass(borderRadius, 'input')} ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-stone-50/90 border-stone-200/80'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  <CalendarIcon className="w-4 h-4 text-forest shrink-0" />
                  <span className="capitalize">{formatDateLabel(activeEvent.startDateTime)}</span>
                </div>

                {activeEvent.location && (
                  <div className="flex items-center gap-2 font-medium text-muted-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{activeEvent.location}</span>
                  </div>
                )}
              </div>

              <div className="pt-1">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    if (isRsvpConfirmed) {
                      setEventBooking(activeEvent.id, undefined);
                    } else {
                      setEventBooking(activeEvent.id, {
                        eventId: activeEvent.id,
                        eventTitle: activeEvent.title,
                        eventType: 'OPEN_MASSIVE',
                        rsvpStatus: 'CONFIRMED',
                        formattedDate: formatDateLabel(activeEvent.startDateTime),
                        confirmedAt: new Date().toISOString()
                      });
                    }
                  }}
                  className={`w-full p-3 border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs ${getRadiusClass(borderRadius, 'button')} ${
                    isRsvpConfirmed
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-forest/5 hover:bg-forest/10 text-forest border-forest/20'
                  }`}
                  style={isRsvpConfirmed ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                >
                  {isRsvpConfirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Asistencia Confirmada (Clic para cancelar)</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Confirmar Mi Asistencia a este Evento</span>
                    </>
                  )}
                </motion.button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-slate-100 dark:border-slate-800">
                <Info className="w-3.5 h-3.5 text-forest/80 shrink-0" />
                <span>Tu lugar quedará registrado en la lista oficial al enviar el formulario.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
