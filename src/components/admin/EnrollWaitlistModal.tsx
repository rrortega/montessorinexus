import React, { useState, useEffect } from 'react';
import { 
 X, 
 Check, 
 Sparkles, 
 Baby, 
 GraduationCap, 
 Calendar, 
 IdCard, 
 HeartPulse, 
 FileText, 
 Layers, 
 Users, 
 Phone, 
 Mail,
 Building2,
 CheckCircle2,
 BookmarkCheck,
 Clock
} from 'lucide-react';
import { 
 WaitlistEntry, 
 EnvironmentItem, 
 enrollWaitlistChild 
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { toast } from 'sonner';

interface EnrollWaitlistModalProps {
 isOpen: boolean;
 onClose: () => void;
 entry: WaitlistEntry | null;
 environments: EnvironmentItem[];
 onEnrolled: () => void;
}

export const EnrollWaitlistModal: React.FC<EnrollWaitlistModalProps> = ({
 isOpen,
 onClose,
 entry,
 environments,
 onEnrolled,
}) => {
 const [submitting, setSubmitting] = useState(false);

 // Form states
 const [environmentId, setEnvironmentId] = useState('');
 const [enrollmentCode, setEnrollmentCode] = useState('');
 const [enrollmentDate, setEnrollmentDate] = useState('');
 const [grade, setGrade] = useState('');
 const [previousSchool, setPreviousSchool] = useState('');
 const [previousMethodology, setPreviousMethodology] = useState('');
 const [bloodType, setBloodType] = useState('No especificado');
 const [allergies, setAllergies] = useState('');
 const [medicalNotes, setMedicalNotes] = useState('');
 const [internalNotes, setInternalNotes] = useState('');

 useEffect(() => {
 if (isOpen && entry) {
 // Pick first target environment if available, or first available environment
 const defaultEnv = (entry.target_environment_ids && entry.target_environment_ids.length > 0)
 ? entry.target_environment_ids[0]
 : (environments.length > 0 ? environments[0].id : '');

 setEnvironmentId(defaultEnv);
 setEnrollmentCode(`MAT-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`);
 setEnrollmentDate(entry.preferred_start_date ? entry.preferred_start_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
 setGrade('');
 setPreviousSchool(entry.previous_school || '');
 setPreviousMethodology(entry.previous_methodology || '');
 setBloodType('No especificado');
 setAllergies('');
 setMedicalNotes('');
 setInternalNotes(entry.notes ? `Procedente de Lista de Espera: ${entry.notes}` : 'Ingreso oficial desde Lista de Espera');
 }
 }, [isOpen, entry, environments]);

 if (!entry) return null;

 const calculateAge = (dob?: string | null): string => {
 if (!dob) return '';
 const birth = new Date(dob);
 if (isNaN(birth.getTime())) return '';
 const now = new Date();
 let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
 if (now.getDate() < birth.getDate()) months--;
 if (months < 0) return 'Por nacer';
 const years = Math.floor(months / 12);
 const remMonths = months % 12;
 if (years === 0) return `${months} meses`;
 return `${years} año${years > 1 ? 's' : ''} ${remMonths > 0 ? `${remMonths} m` : ''}`.trim();
 };

 const handleEnroll = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!environmentId) {
 toast.error('Selecciona el salón/ambiente de destino.');
 return;
 }

 setSubmitting(true);
 try {
 await enrollWaitlistChild(entry.id, {
 environmentId,
 enrollmentCode: enrollmentCode.trim(),
 enrollmentDate: enrollmentDate || new Date().toISOString(),
 grade: grade.trim(),
 previousSchool: previousSchool.trim(),
 previousMethodology: previousMethodology.trim(),
 bloodType,
 allergies: allergies.trim(),
 medicalNotes: medicalNotes.trim(),
 internalNotes: internalNotes.trim()
 });

 toast.success(`¡${entry.child_name} ha sido admitido(a) y matriculado(a) con éxito!`);
 onEnrolled();
 onClose();
 } catch (err: any) {
 console.error(err);
 toast.error(err.message || 'Error al procesar la matrícula.');
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <SlideOverDrawer
 isOpen={isOpen}
 onClose={onClose}
 title="Admitir y Convertir en Matrícula"
 description={`Asignar salón y formalizar el ingreso de ${entry.child_name}`}
 icon={<GraduationCap className="w-5 h-5 text-forest" />}
 maxWidthClass="max-w-xl lg:max-w-2xl"
 footer={
 <div className="flex items-center justify-between w-full">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-xl transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 form="enroll-waitlist-form"
 disabled={submitting || !environmentId}
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-102 active:scale-98"
 >
 <GraduationCap className="w-4 h-4" />
 <span>{submitting ? 'Formalizando...' : 'Confirmar Matrícula e Ingreso'}</span>
 </button>
 </div>
 }
 >
 <form id="enroll-waitlist-form" onSubmit={handleEnroll} className="space-y-6 pb-6 text-xs text-foreground">
 
 {/* Child & Parent Summary Card */}
 <div className="bg-forest/5 rounded-2xl p-4 border border-forest/10 space-y-2.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="w-10 h-10 rounded-2xl bg-forest text-white flex items-center justify-center font-bold text-sm shadow-2xs">
 <Baby className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-bold text-forest text-sm leading-tight">{entry.child_name}</h4>
 <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
 {entry.birth_date && <span>Edad: <strong>{calculateAge(entry.birth_date)}</strong></span>}
 {entry.birth_date && <span>•</span>}
 <span>Solicitud: {new Date(entry.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 </div>

 <span className="px-2.5 py-1 bg-amber-500/10 text-amber-800 border border-amber-500/20 rounded-full font-semibold text-[10px] inline-flex items-center gap-1">
 <Clock className="w-3 h-3 text-amber-700" />
 <span>De Lista de Espera</span>
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-forest/10 text-muted-foreground">
 <div>
 <span className="font-semibold text-forest">Tutor:</span> {entry.parent_name} ({entry.relationship === 'MOTHER' ? 'Madre' : entry.relationship === 'FATHER' ? 'Padre' : 'Tutor'})
 </div>
 <div>
 <span className="font-semibold text-forest">Teléfono:</span> {entry.parent_phone || 'No registrado'}
 </div>
 </div>
 </div>

 {/* 1. SELECCIÓN DEL SALÓN DE INGRESO */}
 <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-forest/10 shadow-2xs">
 <div className="flex items-center justify-between pb-2 border-b border-forest/10">
 <div className="flex items-center gap-2 text-forest font-bold">
 <Layers className="w-4 h-4 text-forest/70" />
 <span className="text-sm">Salón / Ambiente Asignado para Ingreso *</span>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-2 pt-1">
 {environments.map((env) => {
 const isSelected = environmentId === env.id;
 const isPreferred = entry.target_environment_ids?.includes(env.id);
 const envColor = env.color || '#1b3b2b';

 return (
 <button
 type="button"
 key={env.id}
 onClick={() => setEnvironmentId(env.id)}
 className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
 isSelected 
 ? 'bg-forest/10 border-forest text-forest shadow-xs font-bold ring-1 ring-forest' 
 : 'bg-white border-forest/15 hover:border-forest/30 text-muted-foreground'
 }`}
 >
 <div className="flex items-center gap-3">
 <span 
 className="w-4 h-4 rounded-full shrink-0 shadow-2xs" 
 style={{ backgroundColor: envColor }}
 />
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-forest">{env.name}</span>
 {isPreferred && (
 <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
 Solicitado por la familia
 </span>
 )}
 </div>
 <span className="text-[10px] text-muted-foreground font-normal">
 {env.stage || 'Montessori'} • Capacidad: {env.capacity || 25} niños
 </span>
 </div>
 </div>

 <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
 isSelected ? 'bg-forest border-forest text-white' : 'border-forest/20 bg-white'
 }`}>
 {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* 2. DATOS DE MATRÍCULA Y ANTECEDENTES */}
 <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-forest/10 shadow-2xs">
 <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
 <GraduationCap className="w-4 h-4 text-forest/70" />
 <span className="text-sm">Datos de Matrícula & Antecedentes Oficiales</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
 <div className="space-y-1.5">
 <label className="block font-semibold text-forest">
 Código / Folio de Matrícula *
 </label>
 <input
 type="text"
 required
 value={enrollmentCode}
 onChange={(e) => setEnrollmentCode(e.target.value)}
 placeholder="MAT-26001"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs font-mono font-bold"
 />
 </div>

 <div className="space-y-1.5">
 <label className="block font-semibold text-forest">
 Fecha Oficial de Matrícula / Inicio
 </label>
 <input
 type="date"
 value={enrollmentDate}
 onChange={(e) => setEnrollmentDate(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>

 <div className="space-y-1.5">
 <label className="block font-semibold text-forest">
 Escuela o Guardería Anterior
 </label>
 <input
 type="text"
 value={previousSchool}
 onChange={(e) => setPreviousSchool(e.target.value)}
 placeholder="Ej. Guardería Los Pinos o 'Ninguna'..."
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>

 <div className="space-y-1.5">
 <label className="block font-semibold text-forest">
 Metodología Pedagógica de Origen
 </label>
 <select
 value={previousMethodology}
 onChange={(e) => setPreviousMethodology(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs font-medium"
 >
 <option value="">-- No especificada --</option>
 <option value="Primera experiencia escolar (Sin escuela previa)">Primera experiencia escolar (Sin escuela previa)</option>
 <option value="Montessori">Montessori</option>
 <option value="Tradicional / Convencional">Tradicional / Convencional</option>
 <option value="Waldorf">Waldorf</option>
 <option value="Reggio Emilia">Reggio Emilia</option>
 <option value="Constructivista / Activo">Constructivista / Activo</option>
 <option value="Homeschooling / En Casa">Homeschooling / En Casa</option>
 <option value="Otra / Mixta">Otra / Mixta</option>
 </select>
 </div>

 <div className="sm:col-span-2 space-y-1.5">
 <label className="block font-semibold text-forest">
 Observaciones Internas del Expediente
 </label>
 <textarea
 rows={3}
 value={internalNotes}
 onChange={(e) => setInternalNotes(e.target.value)}
 placeholder="Notas pedagógicas o administrativas de ingreso..."
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>
 </div>
 </div>

 </form>
 </SlideOverDrawer>
 );
};
