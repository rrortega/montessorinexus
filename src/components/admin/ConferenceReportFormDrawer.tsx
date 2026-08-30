import React, { useState, useEffect, useRef } from 'react';
import { 
 FileText, 
 Mic, 
 Square, 
 Sparkles, 
 Check, 
 X, 
 Calendar, 
 User, 
 Upload, 
 Play, 
 Pause, 
 HeartHandshake, 
 Lightbulb, 
 Target, 
 Layers, 
 Building2,
 Trash2
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { 
 ProgressConferenceReportItem, 
 StudentItem, 
 createConferenceReport, 
 updateConferenceReport,
 requestAIConferenceAssist,
 getGuides
} from '@/lib/sqlite';
import { uploadPhysicalFile } from '@/lib/api';
import { VoiceNoteTextarea } from '@/components/ui/VoiceNoteTextarea';
import { toast } from 'sonner';

interface ConferenceReportFormDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 report: ProgressConferenceReportItem | null;
 student: StudentItem | null;
 onSaved: () => void;
}

const TERM_PRESETS = [
 'Primer Trimestre (Septiembre - Noviembre 2025)',
 'Segundo Trimestre (Diciembre - Febrero 2026)',
 'Tercer Trimestre (Marzo - Junio 2026)',
 'Evaluación Semestral I (Otoño-Invierno)',
 'Evaluación Semestral II (Primavera-Verano)',
 'Evaluación Anual / Cierre de Ciclo'
];

export const ConferenceReportFormDrawer: React.FC<ConferenceReportFormDrawerProps> = ({
 isOpen,
 onClose,
 report,
 student,
 onSaved
}) => {
 const [guides, setGuides] = useState<any[]>([]);
 const [loading, setLoading] = useState(false);
 const [aiLoading, setAiLoading] = useState(false);

 // Form State
 const [termName, setTermName] = useState(TERM_PRESETS[0]);
 const [conferenceDate, setConferenceDate] = useState(new Date().toISOString().split('T')[0]);
 const [guideUserId, setGuideUserId] = useState('');
 const [attendees, setAttendees] = useState('');
 
 // Structured Pillars
 const [executiveSummary, setExecutiveSummary] = useState('');
 const [strengths, setStrengths] = useState('');
 const [challenges, setChallenges] = useState('');
 const [recommendationsHome, setRecommendationsHome] = useState('');
 const [agreements, setAgreements] = useState('');

 // AI Raw notes
 const [rawNotes, setRawNotes] = useState('');
 const [showAiInput, setShowAiInput] = useState(true);

 // Audio Recording
 const [isRecording, setIsRecording] = useState(false);
 const [audioUrl, setAudioUrl] = useState('');
 const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const audioChunksRef = useRef<Blob[]>([]);

 useEffect(() => {
 getGuides().then(setGuides).catch(() => []);
 }, []);

 useEffect(() => {
 if (report) {
 setTermName(report.termName || TERM_PRESETS[0]);
 setConferenceDate(new Date(report.conferenceDate).toISOString().split('T')[0]);
 setGuideUserId(report.guideUserId || '');
 setAttendees(report.attendees || '');
 setExecutiveSummary(report.executiveSummary || '');
 setStrengths(report.strengths || '');
 setChallenges(report.challenges || '');
 setRecommendationsHome(report.recommendationsHome || '');
 setAgreements(report.agreements || '');
 setAudioUrl(report.audioRecordingUrl || '');
 setShowAiInput(false);
 } else {
 setTermName(TERM_PRESETS[0]);
 setConferenceDate(new Date().toISOString().split('T')[0]);
 setGuideUserId('');
 setAttendees('Guía Titular, Mamá y Papá');
 setExecutiveSummary('');
 setStrengths('');
 setChallenges('');
 setRecommendationsHome('');
 setAgreements('');
 setRawNotes('');
 setAudioUrl('');
 setShowAiInput(true);
 }
 }, [report, isOpen]);

 // AI Generator
 const handleGenerateWithAI = async () => {
 if (!rawNotes.trim()) {
 toast.error('Escribe o dicta notas rápidas sobre la reunión primero.');
 return;
 }

 setAiLoading(true);
 try {
 const structured = await requestAIConferenceAssist({
 rawNotes: rawNotes.trim(),
 studentName: student?.full_name,
 termName
 });

 setExecutiveSummary(structured.executiveSummary);
 setStrengths(structured.strengths);
 setChallenges(structured.challenges);
 setRecommendationsHome(structured.recommendationsHome);
 setAgreements(structured.agreements);
 setShowAiInput(false);
 toast.success('¡Reporte estructurado con éxito por el Asistente IA Montessori!');
 } catch (e: any) {
 toast.error(e.message || 'Error al procesar notas con IA');
 } finally {
 setAiLoading(false);
 }
 };

 // Audio Recording Handlers
 const startRecording = async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 const mediaRecorder = new MediaRecorder(stream);
 mediaRecorderRef.current = mediaRecorder;
 audioChunksRef.current = [];

 mediaRecorder.ondataavailable = (event) => {
 if (event.data.size > 0) {
 audioChunksRef.current.push(event.data);
 }
 };

 mediaRecorder.onstop = () => {
 const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
 setAudioBlob(blob);
 const url = URL.createObjectURL(blob);
 setAudioUrl(url);
 toast.success('Grabación de audio lista para adjuntar');
 };

 mediaRecorder.start();
 setIsRecording(true);
 toast.info('Grabando audio de la reunión...');
 } catch (err) {
 toast.error('No se pudo acceder al micrófono');
 }
 };

 const stopRecording = () => {
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
 setIsRecording(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!student) {
 toast.error('Estudiante no especificado');
 return;
 }

 setLoading(true);
 try {
 let finalAudioUrl = audioUrl;

 // If recorded blob, upload to server
 if (audioBlob && !audioUrl.startsWith('/documents/')) {
 const audioFile = new File([audioBlob], `reunion_${student.id}_${Date.now()}.webm`, { type: 'audio/webm' });
 const res = await uploadPhysicalFile(audioFile, 'documents');
 finalAudioUrl = res.url;
 }

 const payload = {
 studentId: student.id,
 guideUserId: guideUserId || undefined,
 termName,
 conferenceDate: new Date(conferenceDate).toISOString(),
 executiveSummary: executiveSummary.trim(),
 strengths: strengths.trim(),
 challenges: challenges.trim(),
 recommendationsHome: recommendationsHome.trim(),
 agreements: agreements.trim(),
 attendees: attendees.trim(),
 audioRecordingUrl: finalAudioUrl,
 status: 'PUBLISHED'
 };

 if (report) {
 await updateConferenceReport(report.id, payload);
 toast.success('¡Informe de reunión actualizado!');
 } else {
 await createConferenceReport(payload);
 toast.success('¡Informe de reunión registrado en la cronología evolutiva!');
 }
 onSaved();
 onClose();
 } catch (e: any) {
 toast.error(e.message || 'Error al guardar informe');
 } finally {
 setLoading(false);
 }
 };

 return (
 <SlideOverDrawer
 isOpen={isOpen}
 onClose={onClose}
 maxWidthClass="max-w-xl lg:max-w-2xl"
 icon={<FileText className="w-5 h-5 text-forest" />}
 title={report ? 'Editar Progress Report & Reunión' : 'Nuevo Progress Report de Evaluación'}
 description={`Alumno: ${student?.full_name || 'Estudiante'} • Cronología y Acuerdos Guía-Familia`}
 footer={
 <>
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest"
 >
 Cancelar
 </button>
 <button
 type="submit"
 form="conference-form"
 disabled={loading}
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
 >
 <Check className="w-4 h-4" />
 <span>{loading ? 'Guardando...' : report ? 'Guardar Cambios' : 'Registrar en Cronología'}</span>
 </button>
 </>
 }
 >
 <form id="conference-form" onSubmit={handleSubmit} className="space-y-6">
 
 {/* Section 1: Metadata */}
 <div className="p-4 rounded-2xl bg-cream/40 border border-forest/10 space-y-3 text-xs">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-forest uppercase tracking-wider mb-1">
 Período Escolar / Trimestre *
 </label>
 <select
 value={termName}
 onChange={(e) => setTermName(e.target.value)}
 required
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs font-bold text-forest bg-white"
 >
 {TERM_PRESETS.map((t, idx) => (
 <option key={idx} value={t}>{t}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase tracking-wider mb-1">
 Fecha de la Reunión *
 </label>
 <input
 type="date"
 value={conferenceDate}
 onChange={(e) => setConferenceDate(e.target.value)}
 required
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-forest uppercase tracking-wider mb-1">
 Guía Titular Responsable
 </label>
 <select
 value={guideUserId}
 onChange={(e) => setGuideUserId(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white"
 >
 <option value="">Selecciona Guía...</option>
 {guides.map(g => (
 <option key={g.id} value={g.id}>{g.fullName || g.email}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-bold text-forest uppercase tracking-wider mb-1">
 Asistentes Presentes
 </label>
 <input
 type="text"
 value={attendees}
 onChange={(e) => setAttendees(e.target.value)}
 placeholder="ej. Guía María, Mamá Laura y Papá Carlos"
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white"
 />
 </div>
 </div>
 </div>

 {/* Section 2: AI Notes Synthesis Assistant */}
 <div className="p-4 rounded-3xl bg-indigo-50/80 border border-indigo-200 space-y-3 animate-in fade-in">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
 <Sparkles className="w-4 h-4 text-indigo-600" />
 <span>Asistente IA: Redacción Inteligente de Reunión</span>
 </span>
 <button
 type="button"
 onClick={() => setShowAiInput(!showAiInput)}
 className="text-[11px] font-bold text-indigo-700 hover:underline"
 >
 {showAiInput ? 'Ocultar Asistente' : 'Mostrar Asistente'}
 </button>
 </div>

 {showAiInput && (
 <div className="space-y-2.5">
 <p className="text-[11px] text-indigo-900 leading-relaxed">
 Escribe notas rápidas o viñetas informales de la reunión. La IA estructurará automáticamente las fortalezas, retos, recomendaciones para casa y acuerdos con vocabulario Montessori AMI:
 </p>
 <textarea
 value={rawNotes}
 onChange={(e) => setRawNotes(e.target.value)}
 placeholder="ej. Mateo avanzó mucho en torre rosa y abrochar botones. Reto: le cuesta concentrarse en transiciones de lección. Sugerencia para casa: no darle pantallas antes de dormir y dejarlo vestirse solo. Quedamos en que la guía le presentará triángulos constructores..."
 rows={3}
 className="w-full p-3 rounded-2xl border border-indigo-200 text-xs bg-white text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
 />

 <div className="flex items-center justify-between gap-3">
 {/* Audio Recording Button */}
 <div className="flex items-center gap-2">
 {isRecording ? (
 <button
 type="button"
 onClick={stopRecording}
 className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-xs"
 >
 <Square className="w-3.5 h-3.5" />
 <span>Detener Grabación</span>
 </button>
 ) : (
 <button
 type="button"
 onClick={startRecording}
 className="px-3 py-1.5 bg-white hover:bg-indigo-100/60 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
 >
 <Mic className="w-3.5 h-3.5 text-indigo-600" />
 <span>{audioUrl ? 'Volver a Grabar' : 'Grabar Dictado / Audio'}</span>
 </button>
 )}

 {audioUrl && !isRecording && (
 <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
 )}
 </div>

 <button
 type="button"
 onClick={handleGenerateWithAI}
 disabled={aiLoading || !rawNotes.trim()}
 className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
 >
 <Sparkles className="w-3.5 h-3.5" />
 <span>{aiLoading ? 'Estructurando...' : ' Estructurar con IA'}</span>
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Section 3: Structured Core Pillars */}
 <div className="space-y-4">
 
 <div>
          <VoiceNoteTextarea
            label={
              <span className="flex items-center gap-1.5 font-bold text-xs text-forest uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-forest" />
                <span>Resumen Ejecutivo de la Evaluación *</span>
              </span>
            }
            value={executiveSummary}
            onChange={setExecutiveSummary}
            placeholder="Visión general del desenvolvimiento del infante durante el ciclo..."
            rows={2}
            context="appointment"
            className="space-y-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Strengths */}
          <div>
            <VoiceNoteTextarea
              label={
                <span className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fortalezas & Logros Observados</span>
                </span>
              }
              value={strengths}
              onChange={setStrengths}
              placeholder="• Autonomía consolidada en vida práctica&#10;• Gran concentración en materiales sensoriales..."
              rows={4}
              context="appointment"
              className="space-y-1"
            />
          </div>

          {/* Challenges */}
          <div>
            <VoiceNoteTextarea
              label={
                <span className="flex items-center gap-1.5 font-bold text-xs text-amber-800 uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                  <span>Retos & Áreas de Oportunidad</span>
                </span>
              }
              value={challenges}
              onChange={setChallenges}
              placeholder="• Transiciones entre actividades sin dispersión&#10;• Tolerancia ante el control de error..."
              rows={4}
              context="appointment"
              className="space-y-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Home Recommendations */}
          <div>
            <VoiceNoteTextarea
              label={
                <span className="flex items-center gap-1.5 font-bold text-xs text-sky-800 uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-sky-600" />
                  <span>Consejos & Pautas para Casa</span>
                </span>
              }
              value={recommendationsHome}
              onChange={setRecommendationsHome}
              placeholder="• Involucrar al niño en tareas cotidianas&#10;• Establecer rutinas de descanso y lectura nocturna..."
              rows={4}
              context="appointment"
              className="space-y-1"
            />
          </div>

          {/* Agreements */}
          <div>
            <VoiceNoteTextarea
              label={
                <span className="flex items-center gap-1.5 font-bold text-xs text-forest uppercase tracking-wider">
                  <HeartHandshake className="w-3.5 h-3.5 text-forest" />
                  <span>Acuerdos & Compromisos Guía-Familia</span>
                </span>
              }
              value={agreements}
              onChange={setAgreements}
              placeholder="• La escuela presentará lecciones de extensión&#10;• La familia enviará registro semanal..."
              rows={4}
              context="appointment"
              className="space-y-1"
            />
          </div>
        </div>

 </div>

 </form>
 </SlideOverDrawer>
 );
};

export default ConferenceReportFormDrawer;
