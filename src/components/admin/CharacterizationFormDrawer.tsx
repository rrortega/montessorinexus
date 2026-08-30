import React, { useState, useEffect, useRef } from 'react';
import { 
 Sparkles, 
 Check, 
 X, 
 Users, 
 HeartHandshake, 
 Compass, 
 Smile, 
 Tag, 
 MapPin, 
 Calendar,
 MessageSquare,
 Award,
 ShieldCheck,
 Coffee,
 Palette,
 Bot,
 SlidersHorizontal,
 ArrowRight,
 Send,
 Loader2,
 RefreshCw,
 HelpCircle,
 TreePine,
 GraduationCap,
 Building2,
 FileCheck,
 CheckCircle2,
 ChevronLeft,
 AlertCircle,
 Clock,
 BookOpen,
 Target,
 Lightbulb,
 Briefcase
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { 
 StudentCharacterizationItem, 
 AuthorRoleType, 
 ContextAreaType,
 saveStudentCharacterization,
 sendCharacterizationAiInterview,
 StudentItem 
} from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface CharacterizationFormDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 student: StudentItem | null;
 initialData?: StudentCharacterizationItem | null;
 onSaved: () => void;
}

type DrawerMode = 'choice' | 'manual' | 'ai_chat';

interface ChatMessage {
 id: string;
 role: 'user' | 'assistant';
 content: string;
 timestamp: string;
 isComplete?: boolean;
}

interface QuickSuggestionItem {
 text: string;
 type: 'strength' | 'growth' | 'neutral';
 icon: React.ComponentType<{ className?: string }>;
}

const PRESET_TAGS = [
 'Líder Natural',
 'Protector de los Pequeños',
 'Amor por la Naturaleza',
 'Pensamiento Lógico',
 'Sensibilidad Musical',
 'Expresión Artística',
 'Muy Colaborador',
 'Perfeccionista en el Orden',
 'Cuidado Exquisito del Material',
 'Empatía Espontánea',
 'Curiosidad Científica',
 'Alta Concentración',
 'En desarrollo de autorregulación',
 'Requiere acompañamiento en límites',
 'Sensible a la frustración',
 'En transición hacia la concentración',
 'Necesita apoyo al cerrar ciclos'
];

export const CharacterizationFormDrawer: React.FC<CharacterizationFormDrawerProps> = ({
 isOpen,
 onClose,
 student,
 initialData,
 onSaved
}) => {
 const { user, role } = useAuth();

 // Mode state
 const [mode, setMode] = useState<DrawerMode>('choice');

 // Form Fields
 const [authorName, setAuthorName] = useState('');
 const [authorRole, setAuthorRole] = useState<AuthorRoleType>('LEAD_GUIDE');
 const [contextArea, setContextArea] = useState<ContextAreaType>('SALON');
 const [period, setPeriod] = useState('Ciclo Actual 2025-2026');
 const [observationDate, setObservationDate] = useState(new Date().toISOString().split('T')[0]);

 // Dimension Levels (1-5)
 const [independenceLevel, setIndependenceLevel] = useState(3);
 const [socialGraceLevel, setSocialGraceLevel] = useState(3);
 const [focusRegulationLevel, setFocusRegulationLevel] = useState(3);
 const [curiosityEngagementLevel, setCuriosityEngagementLevel] = useState(3);

 // Qualitative Notes
 const [autonomyCareNotes, setAutonomyCareNotes] = useState('');
 const [socialGraceNotes, setSocialGraceNotes] = useState('');
 const [focusRegulationNotes, setFocusRegulationNotes] = useState('');
 const [interestsPassionsNotes, setInterestsPassionsNotes] = useState('');
 const [anecdoteHighlight, setAnecdoteHighlight] = useState('');
 const [selectedTags, setSelectedTags] = useState<string[]>([]);
 const [saving, setSaving] = useState(false);

 // AI Chat States
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [inputMessage, setInputMessage] = useState('');
 const [aiLoading, setAiLoading] = useState(false);
 const [aiProgress, setAiProgress] = useState(15);
 const [aiStepName, setAiStepName] = useState('context');
 const [extractedData, setExtractedData] = useState<any>(null);
 const [interviewComplete, setInterviewComplete] = useState(false);
 const [chatFontSize, setChatFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
 const messagesEndRef = useRef<HTMLDivElement | null>(null);

 const toggleFontSize = () => {
 setChatFontSize(prev => {
 if (prev === 'normal') return 'large';
 if (prev === 'large') return 'xlarge';
 return 'normal';
 });
 };

 // Reset or Populate on Open
 useEffect(() => {
 if (isOpen) {
 if (initialData) {
 setMode('manual');
 setAuthorName(initialData.authorName || '');
 setAuthorRole(initialData.authorRole || 'LEAD_GUIDE');
 setContextArea(initialData.contextArea || 'SALON');
 setPeriod(initialData.period || 'Ciclo Actual 2025-2026');
 setObservationDate(initialData.observationDate ? new Date(initialData.observationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
 setIndependenceLevel(initialData.independenceLevel || 3);
 setSocialGraceLevel(initialData.socialGraceLevel || 3);
 setFocusRegulationLevel(initialData.focusRegulationLevel || 3);
 setCuriosityEngagementLevel(initialData.curiosityEngagementLevel || 3);
 setAutonomyCareNotes(initialData.autonomyCareNotes || '');
 setSocialGraceNotes(initialData.socialGraceNotes || '');
 setFocusRegulationNotes(initialData.focusRegulationNotes || '');
 setInterestsPassionsNotes(initialData.interestsPassionsNotes || '');
 setAnecdoteHighlight(initialData.anecdoteHighlight || '');
 setSelectedTags(initialData.tags || []);
 } else {
 setMode('choice');
 setAuthorName(user?.fullName || '');
 if (role === 'TEACHER') setAuthorRole('LEAD_GUIDE');
 else if (role === 'STAFF') setAuthorRole('SUPPORT_STAFF');
 else setAuthorRole('LEAD_GUIDE');
 setContextArea('SALON');
 setPeriod('Ciclo Actual 2025-2026');
 setObservationDate(new Date().toISOString().split('T')[0]);
 setIndependenceLevel(3);
 setSocialGraceLevel(3);
 setFocusRegulationLevel(3);
 setCuriosityEngagementLevel(3);
 setAutonomyCareNotes('');
 setSocialGraceNotes('');
 setFocusRegulationNotes('');
 setInterestsPassionsNotes('');
 setAnecdoteHighlight('');
 setSelectedTags([]);
 
 // Reset AI interview
 setMessages([]);
 setInputMessage('');
 setAiProgress(15);
 setAiStepName('context');
 setExtractedData(null);
 setInterviewComplete(false);
 }
 }
 }, [initialData, user, role, isOpen]);

 // Scroll to bottom when messages update
 useEffect(() => {
 if (mode === 'ai_chat') {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }
 }, [messages, mode, aiLoading]);

 if (!isOpen || !student) return null;

 const handleStartAiChat = () => {
 setMode('ai_chat');
 if (messages.length === 0) {
 const initialGreeting: ChatMessage = {
 id: 'msg-init',
 role: 'assistant',
 content: `Hola ${authorName || 'estimada guía'}. Te acompañaré a construir una caracterización holística 360° para ${student.full_name}.\n\nPara empezar: ¿desde qué rol y en qué espacio o momentos de la jornada escolar sueles observarlo con mayor frecuencia? (ej. Salón Montessori durante ciclos de trabajo, Comedor / refrigerio, Patio y jardín, Talleres especiales o Áreas comunes).`,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 };
 setMessages([initialGreeting]);
 }
 };

 const handleSendAiMessage = async (textToSend?: string) => {
 const text = (textToSend || inputMessage).trim();
 if (!text || aiLoading) return;

 const userMsg: ChatMessage = {
 id: `msg-${Date.now()}`,
 role: 'user',
 content: text,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 };

 const newMessages = [...messages, userMsg];
 setMessages(newMessages);
 setInputMessage('');
 setAiLoading(true);

 try {
 const apiPayloadMessages = newMessages.map(m => ({
 role: m.role,
 content: m.content
 }));

 const res = await sendCharacterizationAiInterview({
 studentId: student.id,
 studentName: student.full_name,
 authorName: authorName.trim(),
 authorRole,
 messages: apiPayloadMessages,
 currentExtractedData: extractedData || {}
 });

 if (res && res.reply) {
 const assistantMsg: ChatMessage = {
 id: `msg-${Date.now() + 1}`,
 role: 'assistant',
 content: res.reply,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 isComplete: res.isComplete
 };

 setMessages(prev => [...prev, assistantMsg]);
 if (res.progress) {
 setAiProgress(res.progress.percent);
 setAiStepName(res.progress.step);
 }
 if (res.extractedData) {
 setExtractedData(res.extractedData);
 }
 if (res.isComplete) {
 setInterviewComplete(true);
 }
 }
 } catch (err: any) {
 console.error('Error during AI interview:', err);
 toast.error('Ocurrió un detalle al procesar la respuesta con la IA. Puedes continuar o pasar al modo manual.');
 } finally {
 setAiLoading(false);
 }
 };

 const handleApplyAiDataToForm = () => {
 if (!extractedData) {
 toast.error('No hay datos estructurados listos aún.');
 return;
 }

 if (extractedData.authorRole) setAuthorRole(extractedData.authorRole);
 if (extractedData.contextArea) setContextArea(extractedData.contextArea);
 if (extractedData.independenceLevel) setIndependenceLevel(extractedData.independenceLevel);
 if (extractedData.socialGraceLevel) setSocialGraceLevel(extractedData.socialGraceLevel);
 if (extractedData.focusRegulationLevel) setFocusRegulationLevel(extractedData.focusRegulationLevel);
 if (extractedData.curiosityEngagementLevel) setCuriosityEngagementLevel(extractedData.curiosityEngagementLevel);

 if (extractedData.autonomyCareNotes) setAutonomyCareNotes(extractedData.autonomyCareNotes);
 if (extractedData.socialGraceNotes) setSocialGraceNotes(extractedData.socialGraceNotes);
 if (extractedData.focusRegulationNotes) setFocusRegulationNotes(extractedData.focusRegulationNotes);
 if (extractedData.interestsPassionsNotes) setInterestsPassionsNotes(extractedData.interestsPassionsNotes);
 if (extractedData.anecdoteHighlight) setAnecdoteHighlight(extractedData.anecdoteHighlight);
 if (Array.isArray(extractedData.tags) && extractedData.tags.length > 0) {
 setSelectedTags(extractedData.tags);
 }

 setMode('manual');
 toast.success('¡Caracterización cargada en el formulario! Revisa los campos y presiona Guardar cuando estés listo.');
 };

 const handleToggleTag = (tag: string) => {
 setSelectedTags(prev => 
 prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
 );
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!authorName.trim()) {
 toast.error('Por favor ingresa el nombre de quien realiza la caracterización');
 return;
 }

 setSaving(true);
 try {
 await saveStudentCharacterization({
 id: initialData?.id,
 studentId: student.id,
 authorUserId: user?.id,
 authorName: authorName.trim(),
 authorRole,
 contextArea,
 period,
 observationDate: new Date(observationDate).toISOString(),
 independenceLevel,
 socialGraceLevel,
 focusRegulationLevel,
 curiosityEngagementLevel,
 autonomyCareNotes: autonomyCareNotes.trim(),
 socialGraceNotes: socialGraceNotes.trim(),
 focusRegulationNotes: focusRegulationNotes.trim(),
 interestsPassionsNotes: interestsPassionsNotes.trim(),
 anecdoteHighlight: anecdoteHighlight.trim(),
 tags: selectedTags
 });

 toast.success('¡Caracterización 360° registrada con éxito!');
 onSaved();
 onClose();
 } catch (e: any) {
 toast.error(e.message || 'Error al guardar caracterización');
 } finally {
 setSaving(false);
 }
 };

 // Chips suggestions based on current step with clean Lucide icons (No raw emojis)
 const getSuggestedReplies = (): QuickSuggestionItem[] => {
 if (aiStepName === 'context') {
 return [
 { text: 'En el Salón Montessori (Ciclos de Trabajo)', type: 'neutral', icon: BookOpen },
 { text: 'En el Comedor durante el refrigerio o almuerzo', type: 'neutral', icon: Coffee },
 { text: 'En el Patio, Jardín exterior y áreas verdes', type: 'neutral', icon: TreePine },
 { text: 'En los momentos de transición y cambios de actividad', type: 'neutral', icon: Clock },
 { text: 'En Talleres Especializados (Arte, Música o Huerto)', type: 'neutral', icon: Palette }
 ];
 }
 if (aiStepName === 'autonomy') {
 return [
 { text: 'Muy autónomo: elige y regresa su material con cuidado', type: 'strength', icon: CheckCircle2 },
 { text: 'Le cuesta ordenar y suele dejar tareas o materiales inconclusos', type: 'growth', icon: AlertCircle },
 { text: 'Depende con frecuencia del recordatorio del adulto para iniciar rutinas', type: 'growth', icon: AlertCircle },
 { text: 'Colabora con iniciativa en el cuidado y limpieza del espacio', type: 'strength', icon: HeartHandshake },
 { text: 'En proceso de aprender a cerrar ciclos de trabajo', type: 'growth', icon: Clock }
 ];
 }
 if (aiStepName === 'social') {
 return [
 { text: 'Muy empático, solidario y protector con los compañeros pequeños', type: 'strength', icon: HeartHandshake },
 { text: 'Le cuesta regular la frustración cuando algo no sale a la primera', type: 'growth', icon: AlertCircle },
 { text: 'Dificultad ocasional para respetar el espacio personal o turnos', type: 'growth', icon: AlertCircle },
 { text: 'Tiende al retraimiento o a aislarse en dinámicas de grupo grande', type: 'growth', icon: AlertCircle },
 { text: 'Resuelve los desacuerdos dialogando pacíficamente', type: 'strength', icon: ShieldCheck }
 ];
 }
 if (aiStepName === 'interests' || aiStepName === 'focus') {
 return [
 { text: 'Mantiene ciclos prolongados de alta concentración', type: 'strength', icon: Target },
 { text: 'Se distrae con facilidad ante estímulos del salón y cambia rápido', type: 'growth', icon: AlertCircle },
 { text: 'Muestra resistencia o desinterés ante tareas que percibe complejas', type: 'growth', icon: AlertCircle },
 { text: 'Fascinación por la naturaleza, seres vivos y exploración sensorial', type: 'strength', icon: TreePine },
 { text: 'Gran afinidad por actividades lógico-matemáticas y construcción', type: 'strength', icon: Compass }
 ];
 }
 if (aiStepName === 'anecdote' || aiStepName === 'complete') {
 return [
 { text: 'Mostró un gesto espontáneo de apoyo a un compañero en dificultad', type: 'strength', icon: Lightbulb },
 { text: 'Tuvo un momento de frustración pero aceptó el acompañamiento para calmarse', type: 'growth', icon: Lightbulb },
 { text: 'Descubrió un material nuevo y mantuvo la atención toda la sesión', type: 'strength', icon: Lightbulb },
 { text: 'Tuvo dificultad para compartir pero reflexionó y rectificó con calma', type: 'growth', icon: Lightbulb }
 ];
 }
 return [];
 };

 return (
 <SlideOverDrawer
 isOpen={isOpen}
 onClose={onClose}
 maxWidthClass="max-w-full sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
 icon={<Sparkles className="w-5 h-5 text-amber-500" />}
 title={
 mode === 'choice'
 ? 'Nueva Caracterización 360°'
 : mode === 'ai_chat'
 ? 'Entrevista con Asistente IA'
 : initialData
 ? 'Editar Caracterización del Alumno'
 : 'Registro de Caracterización 360°'
 }
 description={`Mirada holística e integral de ${student.full_name}`}
 footer={
 mode === 'manual' ? (
 <div className="flex items-center justify-between w-full">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
 >
 Cancelar
 </button>

 <button
 type="button"
 onClick={handleSave}
 disabled={saving}
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer ml-auto"
 >
 <Check className="w-4 h-4" />
 <span>{saving ? 'Guardando...' : 'Guardar Caracterización'}</span>
 </button>
 </div>
 ) : mode === 'ai_chat' ? (
 <div className="w-full">
 {interviewComplete && extractedData ? (
 <button
 type="button"
 onClick={handleApplyAiDataToForm}
 className="w-full py-3 px-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-700 hover:from-purple-800 hover:to-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer"
 >
 <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
 <span>Ver Caracterización y Cargar al Formulario</span>
 <ArrowRight className="w-4 h-4 ml-1" />
 </button>
 ) : (
 <div className="relative w-full rounded-2xl bg-white border border-forest/20 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-purple-600 shadow-sm transition-all">
 <textarea
 rows={2}
 value={inputMessage}
 onChange={(e) => {
 setInputMessage(e.target.value);
 e.target.style.height = 'auto';
 e.target.style.height = `${Math.max(72, Math.min(e.target.scrollHeight, 160))}px`;
 }}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSendAiMessage();
 const target = e.target as HTMLTextAreaElement;
 target.style.height = '72px';
 }
 }}
 placeholder="Escribe tu observación o respuesta aquí (Enter para enviar, Shift+Enter para salto de línea)..."
 disabled={aiLoading}
 style={{ minHeight: '72px' }}
 className={`w-full pt-3 pb-3 pl-3.5 pr-12 bg-transparent focus:outline-none text-forest placeholder:text-muted-foreground resize-none max-h-40 overflow-y-auto leading-relaxed ${
 chatFontSize === 'xlarge'
 ? 'text-base font-medium'
 : chatFontSize === 'large'
 ? 'text-sm font-medium'
 : 'text-xs'
 }`}
 />
 <div className="absolute right-2.5 bottom-2.5">
 <button
 type="button"
 onClick={(e) => {
 handleSendAiMessage();
 const form = (e.currentTarget.closest('.relative')?.querySelector('textarea')) as HTMLTextAreaElement;
 if (form) form.style.height = '72px';
 }}
 disabled={!inputMessage.trim() || aiLoading}
 className="p-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
 title="Enviar respuesta (Enter)"
 >
 {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
 </button>
 </div>
 </div>
 )}
 </div>
 ) : null
 }
 >
 {/* ========================================================= */}
 {/* VISTA 1: PANTALLA DE SELECCIÓN DE MÉTODO (CHOICE) */}
 {/* ========================================================= */}
 {mode === 'choice' && (
 <div className="space-y-6 animate-in fade-in duration-300 py-2">
 {/* Student Header */}
 <div className="p-4 rounded-3xl bg-gradient-to-br from-cream/90 via-white to-forest/5 border border-forest/10 flex items-center gap-4 shadow-2xs">
 <div className="w-14 h-14 rounded-2xl bg-forest text-white font-bold flex items-center justify-center text-xl font-display shrink-0 shadow-xs border-2 border-white">
 {student.avatar_url ? (
 <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover rounded-2xl" />
 ) : (
 student.full_name.charAt(0)
 )}
 </div>
 <div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-forest/70 bg-forest/5 px-2 py-0.5 rounded-md inline-block mb-1">
 Mirada del Equipo 360°
 </span>
 <h3 className="font-bold text-forest text-base font-display">{student.full_name}</h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {student.grade || 'Ambiente Montessori'} • Registra tu observación pedagógica
 </p>
 </div>
 </div>

 <div className="text-center space-y-1">
 <h4 className="font-bold text-forest text-sm font-display">
 ¿Cómo deseas registrar tu observación?
 </h4>
 <p className="text-xs text-muted-foreground">
 Elige entre el formulario tradicional o una entrevista guiada con Inteligencia Artificial.
 </p>
 </div>

 {/* 2 Options Cards - Stacked Vertically Full Width */}
 <div className="flex flex-col gap-3.5 pt-1">
 {/* CARD 1: FORMULARIO MANUAL */}
 <div
 onClick={() => setMode('manual')}
 className="group p-5 rounded-3xl bg-white border-2 border-forest/15 hover:border-forest shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:-translate-y-0.5 active:translate-y-0"
 >
 <div className="flex items-start sm:items-center gap-4 flex-1">
 <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center shrink-0 group-hover:bg-forest group-hover:text-white transition-colors shadow-2xs">
 <SlidersHorizontal className="w-6 h-6" />
 </div>
 <div className="space-y-1">
 <h5 className="font-bold text-forest text-sm font-display group-hover:text-forest-light transition-colors">
 Formulario Manual
 </h5>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Completa directamente los sliders del 1 al 5, notas cualitativas por dimensión y anécdotas en el formulario clásico.
 </p>
 </div>
 </div>

 <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest/5 group-hover:bg-forest group-hover:text-white text-forest text-xs font-bold transition-all shadow-2xs">
 <span>Abrir Formulario</span>
 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>

 {/* CARD 2: ASISTENTE IA CONVERSACIONAL */}
 <div
 onClick={handleStartAiChat}
 className="group relative p-5 rounded-3xl bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white border-2 border-purple-200 hover:border-purple-600 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
 >
 <div className="flex items-start sm:items-center gap-4 flex-1">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
 <Bot className="w-6 h-6" />
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-2 flex-wrap">
 <h5 className="font-bold text-purple-950 text-sm font-display group-hover:text-purple-700 transition-colors">
 Asistente IA (Entrevista Guiada)
 </h5>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs flex items-center gap-1">
 <Sparkles className="w-2.5 h-2.5 text-amber-300" />
 <span>Recomendado</span>
 </span>
 </div>
 <p className="text-xs text-purple-900/80 leading-relaxed">
 Conversa fluidamente con la IA. Te guiará con preguntas sencillas y redactará toda la caracterización automáticamente.
 </p>
 </div>
 </div>

 <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100 group-hover:bg-purple-700 group-hover:text-white text-purple-900 text-xs font-bold transition-all shadow-2xs">
 <span>Iniciar Entrevista IA</span>
 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ========================================================= */}
 {/* VISTA 2: ASISTENTE CONVERSACIONAL IA (AI CHAT) */}
 {/* ========================================================= */}
 {mode === 'ai_chat' && (
 <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300">
 {/* AI Interview Header & Progress */}
 <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-forest text-white shadow-md space-y-3 shrink-0">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
 <Bot className="w-5 h-5 text-amber-300" />
 </div>
 <div>
 <h4 className="font-bold text-xs font-display">Entrevista Pedagógica Guiada</h4>
 <span className="text-[11px] text-white/80 block">
 Observando a: <strong>{student.full_name}</strong>
 </span>
 </div>
 </div>

 {/* Controls: Aa Font Size Scaler & Progress % */}
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={toggleFontSize}
 className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
 chatFontSize === 'normal'
 ? 'bg-white/15 hover:bg-white/25 text-white border-white/20'
 : chatFontSize === 'large'
 ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black border-amber-300 scale-105'
 : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black border-emerald-300 scale-110'
 }`}
 title={`Tamaño de letra: ${
 chatFontSize === 'normal' ? 'Normal (clic para ampliar)' : chatFontSize === 'large' ? 'Grande (clic para muy grande)' : 'Muy Grande (clic para tamaño normal)'
 }`}
 >
 <span className="font-serif text-sm font-black tracking-tighter">Aa</span>
 <span className="text-[10px] font-mono opacity-90 font-bold">
 {chatFontSize === 'normal' ? '1x' : chatFontSize === 'large' ? '2x' : '3x'}
 </span>
 </button>

 <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-xl bg-white/20 backdrop-blur-md">
 {aiProgress}%
 </span>
 </div>
 </div>

 {/* Progress bar */}
 <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
 <div 
 className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-500 ease-out"
 style={{ width: `${aiProgress}%` }}
 />
 </div>
 </div>

 {/* Messages Container */}
 <div className="space-y-3.5 overflow-y-auto max-h-[50vh] pr-1 py-1">
 {messages.map((m) => {
 const isUser = m.role === 'user';
 return (
 <div
 key={m.id}
 className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
 >
 <div
 className={`rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
 chatFontSize === 'xlarge' ? 'w-9 h-9' : chatFontSize === 'large' ? 'w-8 h-8' : 'w-7 h-7'
 } ${
 isUser
 ? 'bg-forest text-white'
 : 'bg-gradient-to-tr from-purple-700 to-indigo-700 text-white'
 }`}
 >
 {isUser ? <Users className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-amber-300" />}
 </div>

 <div
 className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 shadow-2xs space-y-1 ${
 isUser
 ? 'bg-forest text-white rounded-tr-none'
 : 'bg-white border border-purple-150 text-foreground rounded-tl-none'
 }`}
 >
 <p
 className={`whitespace-pre-line ${
 chatFontSize === 'xlarge'
 ? 'text-base sm:text-lg leading-relaxed font-medium'
 : chatFontSize === 'large'
 ? 'text-sm sm:text-base leading-relaxed font-medium'
 : 'text-xs sm:text-sm leading-relaxed'
 }`}
 >
 {m.content}
 </p>
 <span
 className={`text-[9px] block text-right font-mono ${
 isUser ? 'text-white/60' : 'text-muted-foreground/60'
 }`}
 >
 {m.timestamp}
 </span>
 </div>
 </div>
 );
 })}

 {aiLoading && (
 <div className="flex items-center gap-2 text-xs text-purple-900 bg-purple-50 border border-purple-100 p-3 rounded-2xl max-w-xs animate-pulse">
 <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
 <span>El asistente está analizando tu observación...</span>
 </div>
 )}

 <div ref={messagesEndRef} />
 </div>

 {/* Celebratory Extracted Summary Card when complete */}
 {extractedData && interviewComplete && (
 <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-300 shadow-md space-y-3 animate-in zoom-in-95 duration-300">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs font-display">
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 <span>Caracterización lista para montar en el formulario</span>
 </div>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
 100% Recopilado
 </span>
 </div>

 {/* Levels Pill Matrix Preview */}
 <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center font-bold">
 <div className="p-1.5 rounded-xl bg-white border border-emerald-200">
 <span className="text-muted-foreground block text-[8px] uppercase">Autonomía</span>
 <span className="text-emerald-800 font-mono text-xs">{extractedData.independenceLevel || 4}/5</span>
 </div>
 <div className="p-1.5 rounded-xl bg-white border border-emerald-200">
 <span className="text-muted-foreground block text-[8px] uppercase">Convivencia</span>
 <span className="text-amber-800 font-mono text-xs">{extractedData.socialGraceLevel || 4}/5</span>
 </div>
 <div className="p-1.5 rounded-xl bg-white border border-emerald-200">
 <span className="text-muted-foreground block text-[8px] uppercase">Concentración</span>
 <span className="text-purple-800 font-mono text-xs">{extractedData.focusRegulationLevel || 4}/5</span>
 </div>
 <div className="p-1.5 rounded-xl bg-white border border-emerald-200">
 <span className="text-muted-foreground block text-[8px] uppercase">Curiosidad</span>
 <span className="text-sky-800 font-mono text-xs">{extractedData.curiosityEngagementLevel || 5}/5</span>
 </div>
 </div>

 <button
 type="button"
 onClick={handleApplyAiDataToForm}
 className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
 >
 <Sparkles className="w-4 h-4 text-amber-300" />
 <span>Ver Caracterización y Cargar al Formulario</span>
 <ArrowRight className="w-4 h-4 ml-1" />
 </button>
 </div>
 )}

 {/* Quick Suggestions Chips with Icons */}
 {!interviewComplete && getSuggestedReplies().length > 0 && !aiLoading && (
 <div className="space-y-2 pt-1">
 <span className={`font-bold uppercase tracking-wider text-muted-foreground block ${
 chatFontSize === 'xlarge' ? 'text-xs' : 'text-[10px]'
 }`}>
 Sugerencias rápidas:
 </span>
 <div className="flex flex-wrap gap-1.5">
 {getSuggestedReplies().map((item, idx) => {
 const Icon = item.icon;
 const isStrength = item.type === 'strength';
 const isGrowth = item.type === 'growth';

 const styleClass = isStrength
 ? 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 border-emerald-200/80'
 : isGrowth
 ? 'bg-amber-50/80 hover:bg-amber-100 text-amber-950 border-amber-200/80'
 : 'bg-purple-50/80 hover:bg-purple-100 text-purple-950 border-purple-200/80';

 const iconColor = isStrength
 ? 'text-emerald-700'
 : isGrowth
 ? 'text-amber-700'
 : 'text-purple-700';

 return (
 <button
 key={idx}
 type="button"
 onClick={() => handleSendAiMessage(item.text)}
 className={`rounded-xl border transition-all text-left hover:scale-[1.01] active:scale-95 cursor-pointer shadow-2xs flex items-center gap-2 ${styleClass} ${
 chatFontSize === 'xlarge'
 ? 'text-sm py-2 px-3.5 font-bold leading-snug'
 : chatFontSize === 'large'
 ? 'text-xs py-1.5 px-3 font-semibold leading-snug'
 : 'text-[11px] py-1 px-2.5 font-medium leading-snug'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
 <span>{item.text}</span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 </div>
 )}

 {/* ========================================================= */}
 {/* VISTA 3: FORMULARIO MANUAL CLÁSICO */}
 {/* ========================================================= */}
 {mode === 'manual' && (
 <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
 
 {/* Top Banner with Student Info */}
 <div className="p-4 rounded-2xl bg-cream/60 border border-forest/10 flex items-center gap-3.5 shadow-2xs">
 <div className="w-12 h-12 rounded-2xl bg-forest text-white font-bold flex items-center justify-center text-lg font-display shrink-0 shadow-2xs">
 {student.avatar_url ? (
 <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover rounded-2xl" />
 ) : (
 student.full_name.charAt(0)
 )}
 </div>
 <div>
 <h3 className="font-bold text-forest text-sm font-display">{student.full_name}</h3>
 <span className="text-[11px] text-muted-foreground block">
 {student.grade || 'Ambiente Montessori'} • Caracterización Multirrol
 </span>
 </div>
 </div>

 {/* 1. Author & Context Section */}
 <div className="p-4 rounded-2xl bg-white border border-forest/10 space-y-3.5 shadow-2xs">
 <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
 1. Perfil del Observador & Entorno
 </span>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Nombre del Observador *
 </label>
 <input
 type="text"
 value={authorName}
 onChange={(e) => setAuthorName(e.target.value)}
 placeholder="ej. Laura Gómez / Carlos (Comedor)"
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest text-forest font-semibold"
 required
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Rol en la Comunidad *
 </label>
 <select
 value={authorRole}
 onChange={(e) => setAuthorRole(e.target.value as AuthorRoleType)}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest text-forest font-semibold"
 >
 <option value="LEAD_GUIDE">Guía Titular / Principal</option>
 <option value="ASSISTANT_GUIDE">Guía Asistente / Co-guía</option>
 <option value="SUPPORT_STAFF">Personal de Apoyo (Comedor / Limpieza / Mantenimiento)</option>
 <option value="SPECIALIST">Especialista / Tallerista (Música / Arte / Huerto)</option>
 <option value="ADMIN">Dirección Pedagógica</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Ambiente o Espacio de Observación
 </label>
 <select
 value={contextArea}
 onChange={(e) => setContextArea(e.target.value as ContextAreaType)}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest text-forest"
 >
 <option value="SALON">Salón Montessori (Ciclos de Trabajo)</option>
 <option value="COMEDOR">Comedor / Momento de Alimento</option>
 <option value="PATIO_JARDIN">Patio, Jardín & Aire Libre</option>
 <option value="TALLER_ESPECIAL">Taller Especializado</option>
 <option value="AREAS_COMUNES">Áreas Comunes y Pasillos</option>
 <option value="GENERAL">Observación General / Transversal</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1">
 Fecha de Observación
 </label>
 <input
 type="date"
 value={observationDate}
 onChange={(e) => setObservationDate(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest text-forest font-mono"
 />
 </div>
 </div>
 </div>

 {/* 2. Montessori Holistic Dimension Sliders (1-5) */}
 <div className="p-4 rounded-2xl bg-white border border-forest/10 space-y-4 shadow-2xs">
 <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
 2. Apreciación en Dimensiones Montessori (Nivel 1 al 5)
 </span>

 <div className="space-y-3">
 {/* Independence */}
 <div>
 <div className="flex items-center justify-between text-xs mb-1">
 <span className="font-semibold text-forest flex items-center gap-1.5">
 <TreePine className="w-3.5 h-3.5 text-emerald-700" />
 <span>Autonomía & Cuidado del Entorno</span>
 </span>
 <strong className="font-mono text-forest px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
 {independenceLevel} / 5
 </strong>
 </div>
 <input
 type="range"
 min={1}
 max={5}
 value={independenceLevel}
 onChange={(e) => setIndependenceLevel(parseInt(e.target.value))}
 className="w-full accent-forest cursor-pointer"
 />
 </div>

 {/* Social Grace */}
 <div>
 <div className="flex items-center justify-between text-xs mb-1">
 <span className="font-semibold text-forest flex items-center gap-1.5">
 <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
 <span>Gracia, Cortesía & Empatía Social</span>
 </span>
 <strong className="font-mono text-forest px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
 {socialGraceLevel} / 5
 </strong>
 </div>
 <input
 type="range"
 min={1}
 max={5}
 value={socialGraceLevel}
 onChange={(e) => setSocialGraceLevel(parseInt(e.target.value))}
 className="w-full accent-forest cursor-pointer"
 />
 </div>

 {/* Focus & Regulation */}
 <div>
 <div className="flex items-center justify-between text-xs mb-1">
 <span className="font-semibold text-forest flex items-center gap-1.5">
 <Target className="w-3.5 h-3.5 text-purple-700" />
 <span>Concentración & Autorregulación</span>
 </span>
 <strong className="font-mono text-forest px-2 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200">
 {focusRegulationLevel} / 5
 </strong>
 </div>
 <input
 type="range"
 min={1}
 max={5}
 value={focusRegulationLevel}
 onChange={(e) => setFocusRegulationLevel(parseInt(e.target.value))}
 className="w-full accent-forest cursor-pointer"
 />
 </div>

 {/* Curiosity & Engagement */}
 <div>
 <div className="flex items-center justify-between text-xs mb-1">
 <span className="font-semibold text-forest flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-sky-700" />
 <span>Curiosidad & Pasión por el Trabajo</span>
 </span>
 <strong className="font-mono text-forest px-2 py-0.5 rounded-lg bg-sky-50 text-sky-900 border border-sky-200">
 {curiosityEngagementLevel} / 5
 </strong>
 </div>
 <input
 type="range"
 min={1}
 max={5}
 value={curiosityEngagementLevel}
 onChange={(e) => setCuriosityEngagementLevel(parseInt(e.target.value))}
 className="w-full accent-forest cursor-pointer"
 />
 </div>
 </div>
 </div>

 {/* 3. Qualitative Montessori Notes */}
 <div className="p-4 rounded-2xl bg-white border border-forest/10 space-y-4 shadow-2xs">
 <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
 3. Rasgos Cualitativos & Observaciones
 </span>

 <div className="space-y-3">
 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1 flex items-center gap-1.5">
 <TreePine className="w-3 h-3 text-emerald-700" />
 <span>Autonomía, Cuidado de Sí Mismo y del Espacio</span>
 </label>
 <textarea
 value={autonomyCareNotes}
 onChange={(e) => setAutonomyCareNotes(e.target.value)}
 placeholder="ej. Ordena sus pertenencias espontáneamente, ayuda a limpiar su mesa..."
 rows={2}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest text-forest leading-relaxed"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1 flex items-center gap-1.5">
 <HeartHandshake className="w-3 h-3 text-amber-700" />
 <span>Relación con Adultos, Pares y Resolución de Conflictos</span>
 </label>
 <textarea
 value={socialGraceNotes}
 onChange={(e) => setSocialGraceNotes(e.target.value)}
 placeholder="ej. Saluda cordialmente al personal, pide las cosas con amabilidad, muy solidario..."
 rows={2}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest text-forest leading-relaxed"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1 flex items-center gap-1.5">
 <Sparkles className="w-3 h-3 text-purple-700" />
 <span>Pasiones, Intereses Vivos y Motivación</span>
 </label>
 <textarea
 value={interestsPassionsNotes}
 onChange={(e) => setInterestsPassionsNotes(e.target.value)}
 placeholder="ej. Muestra una fascinación especial por los insectos, las plantas y los rompecabezas..."
 rows={2}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest text-forest leading-relaxed"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase mb-1 flex items-center gap-1.5">
 <Lightbulb className="w-3 h-3 text-amber-600" />
 <span>Anécdota / Momento Revelador</span>
 </label>
 <textarea
 value={anecdoteHighlight}
 onChange={(e) => setAnecdoteHighlight(e.target.value)}
 placeholder="ej. Hoy en el huerto vio que una planta estaba marchita y fue corriendo por la regadera sin que nadie se lo pidiera..."
 rows={2}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest text-forest leading-relaxed font-serif italic"
 />
 </div>
 </div>
 </div>

 {/* 4. Trait Tags */}
 <div className="p-4 rounded-2xl bg-white border border-forest/10 space-y-2.5 shadow-2xs">
 <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
 4. Etiquetas de Carácter & Talentos
 </span>
 <div className="flex flex-wrap gap-1.5">
 {PRESET_TAGS.map(tag => {
 const isSelected = selectedTags.includes(tag);
 return (
 <button
 type="button"
 key={tag}
 onClick={() => handleToggleTag(tag)}
 className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
 isSelected
 ? 'bg-forest text-white shadow-2xs font-bold'
 : 'bg-cream/70 text-forest/80 hover:bg-forest/10 border border-forest/15'
 }`}
 >
 {isSelected ? ` ${tag}` : `+ ${tag}`}
 </button>
 );
 })}
 </div>
 </div>

 </form>
 )}
 </SlideOverDrawer>
 );
};

export default CharacterizationFormDrawer;
