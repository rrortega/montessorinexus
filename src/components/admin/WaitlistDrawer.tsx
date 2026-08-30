import React, { useState, useEffect } from 'react';
import {
 X,
 User,
 Baby,
 Users,
 Clock,
 Calendar,
 Phone,
 Mail,
 FileText,
 Check,
 Sparkles,
 Layers,
 AlertCircle,
 Save,
 CheckCircle2,
 BookmarkPlus,
 Building2,
 GraduationCap
} from 'lucide-react';
import {
 WaitlistEntry,
 EnvironmentItem,
 createWaitlistEntry,
 updateWaitlistEntry
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { toast } from 'sonner';

interface WaitlistDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 entry: WaitlistEntry | null; // null for new entry
 environments: EnvironmentItem[];
 onSaved: () => void;
}

const RELATIONSHIP_OPTIONS = [
 { value: 'MOTHER', label: 'Madre' },
 { value: 'FATHER', label: 'Padre' },
 { value: 'GUARDIAN', label: 'Tutor(a) Legal' },
 { value: 'GRANDPARENT', label: 'Abuelo / Abuela' },
 { value: 'OTHER', label: 'Otro Familiar' },
];

const METHODOLOGY_OPTIONS = [
 'Primera experiencia escolar (Sin escuela previa)',
 'Montessori',
 'Tradicional / Convencional',
 'Waldorf',
 'Reggio Emilia',
 'Constructivista / Activo',
 'Homeschooling / En Casa',
 'Otra / Mixta'
];

export const WaitlistDrawer: React.FC<WaitlistDrawerProps> = ({
 isOpen,
 onClose,
 entry,
 environments,
 onSaved,
}) => {
 const [saving, setSaving] = useState(false);

 // Form fields
 const [childName, setChildName] = useState('');
 const [birthDate, setBirthDate] = useState('');
 const [gender, setGender] = useState('NOT_SPECIFIED');
 const [targetEnvironmentIds, setTargetEnvironmentIds] = useState<string[]>([]);
 const [parentName, setParentName] = useState('');
 const [parentEmail, setParentEmail] = useState('');
 const [parentPhone, setParentPhone] = useState('');
 const [relationship, setRelationship] = useState('MOTHER');
 const [preferredStartDate, setPreferredStartDate] = useState('');
 const [previousSchool, setPreviousSchool] = useState('');
 const [previousMethodology, setPreviousMethodology] = useState('');
 const [notes, setNotes] = useState('');
 const [priority, setPriority] = useState<number>(0);
 const [status, setStatus] = useState<'WAITING' | 'IN_ADMISSION' | 'ENROLLED' | 'CANCELLED'>('WAITING');

 useEffect(() => {
 if (isOpen) {
 if (entry) {
 setChildName(entry.child_name || '');
 setBirthDate(entry.birth_date ? entry.birth_date.slice(0, 10) : '');
 setGender(entry.gender || 'NOT_SPECIFIED');
 setTargetEnvironmentIds(entry.target_environment_ids || []);
 setParentName(entry.parent_name || '');
 setParentEmail(entry.parent_email || '');
 setParentPhone(entry.parent_phone || '');
 setRelationship(entry.relationship || 'MOTHER');
 setPreferredStartDate(entry.preferred_start_date ? entry.preferred_start_date.slice(0, 10) : '');
 setPreviousSchool(entry.previous_school || '');
 setPreviousMethodology(entry.previous_methodology || '');
 setNotes(entry.notes || '');
 setPriority(entry.priority || 0);
 setStatus(entry.status || 'WAITING');
 } else {
 setChildName('');
 setBirthDate('');
 setGender('NOT_SPECIFIED');
 setTargetEnvironmentIds([]);
 setParentName('');
 setParentEmail('');
 setParentPhone('');
 setRelationship('MOTHER');
 setPreferredStartDate('');
 setPreviousSchool('');
 setPreviousMethodology('');
 setNotes('');
 setPriority(0);
 setStatus('WAITING');
 }
 }
 }, [isOpen, entry]);

 const toggleEnvironment = (envId: string) => {
 setTargetEnvironmentIds(prev =>
 prev.includes(envId) ? prev.filter(id => id !== envId) : [...prev, envId]
 );
 };

 const calculateAge = (dob: string): string => {
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

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!childName.trim()) {
 toast.error('Ingresa el nombre del infante.');
 return;
 }
 if (!parentName.trim()) {
 toast.error('Ingresa el nombre del padre o tutor de contacto.');
 return;
 }
 if (targetEnvironmentIds.length === 0) {
 toast.error('Selecciona al menos una opción de salón o ambiente deseado.');
 return;
 }

 setSaving(true);
 try {
 if (entry) {
 await updateWaitlistEntry(entry.id, {
 childName: childName.trim(),
 birthDate: birthDate || null,
 gender,
 targetEnvironmentIds,
 parentName: parentName.trim(),
 parentEmail: parentEmail.trim().toLowerCase(),
 parentPhone: parentPhone.trim(),
 relationship,
 preferredStartDate: preferredStartDate || null,
 previousSchool: previousSchool.trim(),
 previousMethodology: previousMethodology.trim(),
 notes: notes.trim(),
 status,
 priority: Number(priority)
 });
 toast.success('Solicitud en lista de espera actualizada.');
 } else {
 await createWaitlistEntry({
 childName: childName.trim(),
 birthDate: birthDate || null,
 gender,
 targetEnvironmentIds,
 parentName: parentName.trim(),
 parentEmail: parentEmail.trim().toLowerCase(),
 parentPhone: parentPhone.trim(),
 relationship,
 preferredStartDate: preferredStartDate || null,
 previousSchool: previousSchool.trim(),
 previousMethodology: previousMethodology.trim(),
 notes: notes.trim(),
 priority: Number(priority)
 });
 toast.success('Infante registrado en la lista de espera.');
 }
 onSaved();
 onClose();
 } catch (err: any) {
 console.error(err);
 toast.error(err.message || 'Error al guardar registro en lista de espera.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <SlideOverDrawer
 isOpen={isOpen}
 onClose={onClose}
 title={entry ? 'Editar Ficha de Aspirante' : 'Registrar Aspirante'}
 subtitle={entry ? `Aspirante: ${entry.child_name}` : 'Postulación y registro inicial del infante'}
 icon={<BookmarkPlus className="w-5 h-5 text-forest" />}
 maxWidthClass="max-w-2xl"
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
 form="waitlist-drawer-form"
 disabled={saving}
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-102 active:scale-98"
 >
 <Save className="w-4 h-4" />
 <span>{saving ? 'Guardando...' : 'Guardar Aspirante'}</span>
 </button>
 </div>
 }
 >
 <form id="waitlist-drawer-form" onSubmit={handleSubmit} className="space-y-6 pb-6 text-foreground text-xs">

 {/* Banner Indicador */}
 <div className="bg-forest/5 rounded-2xl p-4 border border-forest/10 flex items-start gap-3">
 <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
 <Sparkles className="w-4 h-4" />
 </div>
 <div>
 <h4 className="font-bold text-forest text-xs">Postulación y Selección de Salones</h4>
 <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
 Registra los datos de la familia y salones de interés. Desde aquí podrás transferir su expediente directamente al <strong>Proceso de Admisión</strong>.
 </p>
 </div>
 </div>

 {/* SECCIÓN 1: DATOS DEL INFANTE */}
 <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-forest/10 shadow-2xs">
 <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
 <Baby className="w-4 h-4 text-forest/70" />
 <span className="text-sm">Datos del Infante / Aspirante</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
 <div className="sm:col-span-2 space-y-1">
 <label className="block font-semibold text-forest">
 Nombre Completo del Niño(a) *
 </label>
 <input
 type="text"
 required
 value={childName}
 onChange={(e) => setChildName(e.target.value)}
 placeholder="Ej. Mateo Sebastián Morales"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>

 <div className="space-y-1">
 <label className="block font-semibold text-forest flex items-center justify-between">
 <span>Fecha de Nacimiento</span>
 {birthDate && (
 <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
 {calculateAge(birthDate)}
 </span>
 )}
 </label>
 <input
 type="date"
 value={birthDate}
 onChange={(e) => setBirthDate(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>

 <div className="space-y-1">
 <label className="block font-semibold text-forest">
 Género
 </label>
 <select
 value={gender}
 onChange={(e) => setGender(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 >
 <option value="NOT_SPECIFIED">No especificado</option>
 <option value="MALE">Masculino (Niño)</option>
 <option value="FEMALE">Femenino (Niña)</option>
 <option value="OTHER">Otro</option>
 </select>
 </div>
 </div>
 </div>

 {/* SECCIÓN 2: ANTECEDENTES ESCOLARES & PEDAGOGÍA DE ORIGEN */}
 <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-forest/10 shadow-2xs">
 <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
 <Building2 className="w-4 h-4 text-forest/70" />
 <span className="text-sm">Antecedentes Escolares & Pedagogía de Origen</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
 <div className="sm:col-span-2 space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="block font-semibold text-forest">
 Escuela, Guardería o Maternal Previo
 </label>
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() => {
 setPreviousSchool('Ninguna (Primera experiencia escolar / Crianza en casa)');
 setPreviousMethodology('Primera experiencia escolar (Sin escuela previa)');
 }}
 className="text-[10px] font-bold text-forest/80 bg-forest/5 hover:bg-forest/10 px-2 py-0.5 rounded-lg border border-forest/10 transition-colors"
 >
 Sin escuela previa
 </button>
 {previousSchool && (
 <button
 type="button"
 onClick={() => {
 setPreviousSchool('');
 setPreviousMethodology('');
 }}
 className="text-[10px] text-muted-foreground hover:text-destructive px-1.5 py-0.5 rounded transition-colors"
 >
 Limpiar
 </button>
 )}
 </div>
 </div>
 <input
 type="text"
 value={previousSchool}
 onChange={(e) => setPreviousSchool(e.target.value)}
 placeholder="Ej. Guardería Los Pinos, Jardín Infantil Sol, o 'Ninguna'..."
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>

 <div className="sm:col-span-2 space-y-1.5">
 <label className="block font-semibold text-forest">
 Enfoque o Metodología Pedagógica Anterior
 </label>
 <select
 value={previousMethodology}
 onChange={(e) => setPreviousMethodology(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs font-medium"
 >
 <option value="">-- Seleccionar Metodología de Origen --</option>
 {METHODOLOGY_OPTIONS.map((m) => (
 <option key={m} value={m}>{m}</option>
 ))}
 </select>
 </div>
 </div>
 </div>

 {/* SECCIÓN 2: SALONES / AMBIENTES DE INTERÉS */}
 <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-forest/10 shadow-2xs">
 <div className="flex items-center justify-between pb-2 border-b border-forest/10">
 <div className="flex items-center gap-2 text-forest font-bold">
 <Layers className="w-4 h-4 text-forest/70" />
 <span className="text-sm">Opciones de Salón / Ambiente Deseado *</span>
 </div>
 <span className="text-[10px] text-muted-foreground">
 {targetEnvironmentIds.length} seleccionada(s)
 </span>
 </div>

 <p className="text-[11px] text-muted-foreground">
 Marca los salones en los que la familia tiene interés o disponibilidad de ingresar:
 </p>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
 {environments.map((env) => {
 const isSelected = targetEnvironmentIds.includes(env.id);
 const envColor = env.color || '#1b3b2b';
 return (
 <button
 type="button"
 key={env.id}
 onClick={() => toggleEnvironment(env.id)}
 className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${isSelected
 ? 'bg-forest/5 border-forest text-forest shadow-2xs font-bold'
 : 'bg-white border-forest/15 hover:border-forest/30 text-muted-foreground'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span
 className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
 style={{ backgroundColor: envColor }}
 />
 <div className="truncate">
 <span className="text-xs truncate block">{env.name}</span>
 <span className="text-[10px] text-muted-foreground font-normal">
 {env.stage || `${env.min_age_years || 0} - ${env.max_age_years || 0} años`}
 </span>
 </div>
 </div>

 <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-forest border-forest text-white' : 'border-forest/20 bg-white'
 }`}>
 {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* SECCIÓN 3: DATOS DEL TUTOR / CONTACTO */}
 <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-forest/10 shadow-2xs">
 <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
 <Users className="w-4 h-4 text-forest/70" />
 <span className="text-sm">Padre, Madre o Tutor de Contacto</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
 <div className="space-y-1">
 <label className="block font-semibold text-forest">
 Nombre del Tutor / Contacto *
 </label>
 <input
 type="text"
 required
 value={parentName}
 onChange={(e) => setParentName(e.target.value)}
 placeholder="Ej. Valeria Domínguez"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>

 <div className="space-y-1">
 <label className="block font-semibold text-forest">
 Parentesco
 </label>
 <select
 value={relationship}
 onChange={(e) => setRelationship(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 >
 {RELATIONSHIP_OPTIONS.map((opt) => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1">
 <label className="block font-semibold text-forest">
 Teléfono / WhatsApp de Contacto
 </label>
 <input
 type="tel"
 value={parentPhone}
 onChange={(e) => setParentPhone(e.target.value)}
 placeholder="Ej. +52 998 123 4567"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>

 <div className="space-y-1">
 <label className="block font-semibold text-forest">
 Correo Electrónico
 </label>
 <input
 type="email"
 value={parentEmail}
 onChange={(e) => setParentEmail(e.target.value)}
 placeholder="ej. valeria.dominguez@gmail.com"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>
 </div>
 </div>

 {/* SECCIÓN 4: FECHA DESEADA, PRIORIDAD Y ESTADO */}
 <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-forest/10 shadow-2xs">
 <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
 <Clock className="w-4 h-4 text-forest/70" />
 <span className="text-sm">Expectativa de Ingreso & Prioridad</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
 <div className="space-y-1">
 <label className="block font-semibold text-forest">
 Fecha Tentativa de Ingreso
 </label>
 <input
 type="date"
 value={preferredStartDate}
 onChange={(e) => setPreferredStartDate(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>

 <div className="space-y-1">
 <label className="block font-semibold text-forest">
 Prioridad de Asignación
 </label>
 <select
 value={priority}
 onChange={(e) => setPriority(Number(e.target.value))}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs font-medium"
 >
 <option value={0}>0 - Normal / General</option>
 <option value={1}>1 - Alta (Hijo de ex-alumnos)</option>
 <option value={2}>2 - Máxima (Hermano de alumno activo)</option>
 </select>
 </div>

 <div className="space-y-1">
 <label className="block font-semibold text-forest">
 Estado de la Solicitud
 </label>
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value as any)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs font-semibold"
 >
 <option value="WAITING">En Espera Activa</option>
 <option value="IN_ADMISSION">En Proceso de Admisión</option>
 <option value="ENROLLED">Matriculado Oficial</option>
 <option value="CANCELLED">Cancelado / Retirado</option>
 </select>
 </div>

 <div className="sm:col-span-3 space-y-1">
 <label className="block font-semibold text-forest">
 Notas y Antecedentes de la Postulación
 </label>
 <textarea
 rows={3}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="Ej. Interés por pedagogía activa, hermanito de Sofía en Taller 1. Horario preferente matutino..."
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest text-xs"
 />
 </div>
 </div>
 </div>

 </form>
 </SlideOverDrawer>
 );
};
