import React, { useState, useEffect } from 'react';
import {
 X,
 User,
 Users,
 FileText,
 HeartPulse,
 Plus,
 Trash2,
 Check,
 Sparkles,
 ShieldCheck,
 Key,
 Phone,
 Mail,
 Calendar,
 IdCard,
 GraduationCap,
 Layers,
 AlertCircle,
 Clock,
 Save,
 CheckCircle2,
 Search,
 Eye,
 ShieldAlert,
 Car,
 UserCheck,
 Edit,
 BadgeAlert,
 Utensils,
 Apple,
 Camera,
 Bus,
 HeartHandshake,
 TreePine,
 XCircle,
 Info,
 FileCheck,
 ChevronLeft,
 ChevronRight
} from 'lucide-react';
import {
 StudentItem,
 EnvironmentItem,
 TutorUserItem,
 AuthorizedContactItem,
 FoodAllergyItem,
 ConsentTemplateItem,
 StudentConsentRecord,
 getTutors,
 getConsentTemplates,
 createStudent,
 updateStudent,
 linkTutorToStudent,
 unlinkTutorFromStudent
} from '@/lib/sqlite';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAuth } from '@/context/AuthContext';
import { useAdminDashboard } from '@/pages/admin/AdminDashboard';
import { toast } from 'sonner';

interface StudentDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 student: StudentItem | null; // null for creating new student
 environments: EnvironmentItem[];
 onSaved: () => void;
}

type TabType = 'identity' | 'tutors' | 'authorized_contacts' | 'health';

const RELATIONSHIP_OPTIONS = [
 { value: 'MOTHER', label: 'Madre' },
 { value: 'FATHER', label: 'Padre' },
 { value: 'GUARDIAN', label: 'Tutor(a) Legal' },
 { value: 'GRANDPARENT', label: 'Abuelo / Abuela' },
 { value: 'OTHER', label: 'Otro Familiar / Contacto' },
];

const CONTACT_RELATIONSHIPS = [
 'Abuela materna',
 'Abuelo materno',
 'Abuela paterna',
 'Abuelo paterno',
 'Tía / Tío',
 'Niñera / Cuidadora',
 'Chofer / Transporte Escolar',
 'Hermano / Hermana mayor',
 'Vecino(a) de confianza',
 'Otro familiar'
];

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'No especificado'];

const COMMON_ALLERGENS = [
 'Nueces y Frutos Secos',
 'Lactosa / Lácteos',
 'Gluten / Trigo',
 'Huevo',
 'Maní / Cacahuates',
 'Mariscos',
 'Pescado',
 'Soya',
 'Fresas',
 'Cítricos',
 'Chocolate',
 'Sésamo / Ajonjolí'
];

const DIET_TYPES = [
 'Omnívora Habitual (Sin restricciones)',
 'Vegetariana',
 'Vegana',
 'Ovolactovegetariana',
 'Kosher',
 'Halal',
 'Sin Azúcar Añadida (Diabético / Control glucémico)',
 'Baja en Sodio',
 'Dieta Especial / Personalizada'
];

function parseAuthorizedContacts(stored?: string | AuthorizedContactItem[]): AuthorizedContactItem[] {
 if (!stored) return [];
 if (Array.isArray(stored)) return stored;
 try {
 const parsed = JSON.parse(stored);
 return Array.isArray(parsed) ? parsed : [];
 } catch {
 return [];
 }
}

function parseFoodAllergies(stored?: string | FoodAllergyItem[]): FoodAllergyItem[] {
 if (!stored) return [];
 if (Array.isArray(stored)) return stored;
 try {
 const parsed = JSON.parse(stored);
 return Array.isArray(parsed) ? parsed : [];
 } catch {
 return [];
 }
}

function parseStudentConsents(stored?: string | StudentConsentRecord[]): StudentConsentRecord[] {
 if (!stored) return [];
 if (Array.isArray(stored)) return stored;
 try {
 const parsed = JSON.parse(stored);
 return Array.isArray(parsed) ? parsed : [];
 } catch {
 return [];
 }
}

const calculateAge = (dobString?: string | null): string => {
 if (!dobString) return '';
 const dob = new Date(dobString);
 if (isNaN(dob.getTime())) return '';
 const now = new Date();
 let years = now.getFullYear() - dob.getFullYear();
 let months = now.getMonth() - dob.getMonth();
 if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
 years--;
 months += 12;
 }
 if (years === 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
 return `${years} ${years === 1 ? 'año' : 'años'}${months > 0 ? ` y ${months} ${months === 1 ? 'mes' : 'meses'}` : ''}`;
};

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
 isOpen,
 onClose,
 student,
 environments,
 onSaved,
}) => {
 const confirm = useConfirm();
 const { role } = useAuth();
 const { isReadOnly: isGlobalReadOnly, triggerBlockedAction } = useAdminDashboard();
 const isTutor = role === 'TUTOR';
 const isTeacherOrStaff = role === 'TEACHER' || role === 'STAFF';
 const isGraduated = student?.status === 'GRADUATED' || student?.status === 'graduated';
 const isReadOnly = isTeacherOrStaff || isGraduated || isGlobalReadOnly;

 const [activeTab, setActiveTab] = useState<TabType>('identity');
 const [isMounted, setIsMounted] = useState(isOpen);
 const [isVisible, setIsVisible] = useState(false);
 const isPushedRef = React.useRef(false);
 const [dragY, setDragY] = useState(0);
 const [isDragging, setIsDragging] = useState(false);
 const touchStartY = React.useRef(0);
 const tabContainerRef = React.useRef<HTMLDivElement>(null);

 const scrollTabs = (direction: 'left' | 'right') => {
 if (tabContainerRef.current) {
 const scrollAmount = 150;
 tabContainerRef.current.scrollBy({
 left: direction === 'left' ? -scrollAmount : scrollAmount,
 behavior: 'smooth'
 });
 }
 };

 // Handle open / close animation lifecycle
 useEffect(() => {
 if (isOpen) {
 setIsMounted(true);
 const timer = setTimeout(() => {
 setIsVisible(true);
 }, 20);
 return () => clearTimeout(timer);
 } else {
 setIsVisible(false);
 const timer = setTimeout(() => {
 setIsMounted(false);
 }, 300);
 return () => clearTimeout(timer);
 }
 }, [isOpen]);

 // ESC key and Browser Back (popstate) handlers
 useEffect(() => {
 if (!isOpen) return;

 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 onClose();
 }
 };
 window.addEventListener('keydown', handleKeyDown);

 const stateId = `student_drawer_${Date.now()}`;
 window.history.pushState({ drawerStateId: stateId }, '');
 isPushedRef.current = true;

 const handlePopState = () => {
 if ((window as any).__ignoringDrawerPopstate) return;
 isPushedRef.current = false;
 onClose();
 };
 window.addEventListener('popstate', handlePopState);

 return () => {
 window.removeEventListener('keydown', handleKeyDown);
 window.removeEventListener('popstate', handlePopState);
 if (isPushedRef.current && window.history.state?.drawerStateId === stateId) {
 window.history.back();
 isPushedRef.current = false;
 }
 };
 }, [isOpen, onClose]);

 // Lock body scroll
 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = 'unset';
 }
 return () => {
 document.body.style.overflow = 'unset';
 };
 }, [isOpen]);

 const handleTouchStart = (e: React.TouchEvent) => {
 touchStartY.current = e.touches[0].clientY;
 setIsDragging(true);
 };

 const handleTouchMove = (e: React.TouchEvent) => {
 const currentY = e.touches[0].clientY;
 const diff = currentY - touchStartY.current;
 if (diff > 0) {
 setDragY(diff);
 }
 };

 const handleTouchEnd = () => {
 setIsDragging(false);
 if (dragY > 75) {
 onClose();
 }
 setDragY(0);
 };

 // TAB 1: Identidad del Alumno
 const [fullName, setFullName] = useState('');
 const [avatarUrl, setAvatarUrl] = useState('');
 const [gender, setGender] = useState('M');
 const [dateOfBirth, setDateOfBirth] = useState('');
 const [nationalId, setNationalId] = useState('');
 const [idDocumentUrl, setIdDocumentUrl] = useState('');
 const [previewAvatarModalOpen, setPreviewAvatarModalOpen] = useState(false);

 // TAB 2: Admisión & Salón
 const [environmentId, setEnvironmentId] = useState('');
 const [enrollmentCode, setEnrollmentCode] = useState('');
 const [enrollmentDate, setEnrollmentDate] = useState('');
 const [previousSchool, setPreviousSchool] = useState('');
 const [previousMethodology, setPreviousMethodology] = useState('');
 const [status, setStatus] = useState('active');

 // TAB 3: Tutores (Padres / Tutores Legales con cuenta de acceso)
 const [existingTutorsList, setExistingTutorsList] = useState<TutorUserItem[]>([]);
 const [tutorMode, setTutorMode] = useState<'idle' | 'link_existing' | 'create_new'>('idle');
 const [selectedExistingTutorId, setSelectedExistingTutorId] = useState('');
 const [existingRelationship, setExistingRelationship] = useState('MOTHER');
 const [existingIsPrimary, setExistingIsPrimary] = useState(false);
 const [existingAuthorizedPickUp, setExistingAuthorizedPickUp] = useState(true);

 // New Tutor form fields (incluyendo Foto)
 const [newTutorName, setNewTutorName] = useState('');
 const [newTutorEmail, setNewTutorEmail] = useState('');
 const [newTutorPhone, setNewTutorPhone] = useState('');
 const [newTutorAvatarUrl, setNewTutorAvatarUrl] = useState('');
 const [newTutorPassword, setNewTutorPassword] = useState('ceiba123');
 const [newTutorRelationship, setNewTutorRelationship] = useState('MOTHER');
 const [newTutorIsPrimary, setNewTutorIsPrimary] = useState(true);
 const [newTutorAuthorizedPickUp, setNewTutorAuthorizedPickUp] = useState(true);

 // In-memory staged tutors for NEW students
 const [stagedTutors, setStagedTutors] = useState<any[]>([]);

 // TAB 4: Contactos de Emergencia & Retiro Autorizado (Personas autorizadas a recoger/entregar)
 const [authorizedContacts, setAuthorizedContacts] = useState<AuthorizedContactItem[]>([]);
 const [contactFormOpen, setContactFormOpen] = useState(false);
 const [editingContactId, setEditingContactId] = useState<string | null>(null);
 const [contactName, setContactName] = useState('');
 const [contactRelationship, setContactRelationship] = useState('Abuela materna');
 const [contactPhone, setContactPhone] = useState('');
 const [contactIdNumber, setContactIdNumber] = useState('');
 const [contactPhotoUrl, setContactPhotoUrl] = useState('');
 const [contactCanPickup, setContactCanPickup] = useState(true);
 const [contactCanDropOff, setContactCanDropOff] = useState(true);
 const [contactIsEmergency, setContactIsEmergency] = useState(true);
 const [contactNotes, setContactNotes] = useState('');

 // TAB 5: Salud, Nutrición & Consentimientos
 const [bloodType, setBloodType] = useState('O+');
 const [allergies, setAllergies] = useState('');
 const [medicalNotes, setMedicalNotes] = useState('');
 const [internalNotes, setInternalNotes] = useState('');
 const [foodAllergies, setFoodAllergies] = useState<FoodAllergyItem[]>([]);
 const [dietaryRestrictions, setDietaryRestrictions] = useState('Omnívora Habitual (Sin restricciones)');
 const [foodFormOpen, setFoodFormOpen] = useState(false);
 const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
 const [foodName, setFoodName] = useState('');
 const [foodSeverity, setFoodSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
 const [foodReaction, setFoodReaction] = useState('');
 const [foodActionPlan, setFoodActionPlan] = useState('');
 const [saving, setSaving] = useState(false);

 // School Consent Templates & Student Consents State
 const [schoolConsentTemplates, setSchoolConsentTemplates] = useState<ConsentTemplateItem[]>([]);
 const [studentConsents, setStudentConsents] = useState<StudentConsentRecord[]>([]);
 const [loadingSchoolConsents, setLoadingSchoolConsents] = useState(false);

 // Fetch available school tutors and consent templates
 const loadSchoolData = async () => {
 try {
 const [tutorsData, consentsData] = await Promise.all([
 getTutors(),
 getConsentTemplates()
 ]);
 setExistingTutorsList(tutorsData);
 setSchoolConsentTemplates(consentsData);
 } catch (e) {
 console.error('Error loading school tutors or consents', e);
 }
 };

 useEffect(() => {
 if (isOpen) {
 loadSchoolData();
 if (student) {
 // Populate existing student
 setFullName(student.full_name || '');
 setAvatarUrl(student.avatar_url || '');
 setGender(student.gender || 'M');
 setDateOfBirth(student.date_of_birth ? student.date_of_birth.split('T')[0] : '');
 setNationalId(student.national_id || '');
 setIdDocumentUrl(student.id_document_url || '');
 setEnvironmentId(student.environment_id || (student.environment?.id || ''));
 setEnrollmentCode(student.enrollment_code || '');
 setEnrollmentDate(student.enrollment_date ? student.enrollment_date.split('T')[0] : '');
 setPreviousSchool(student.previous_school || '');
 setPreviousMethodology(student.previous_methodology || '');
 setStatus(student.status || 'active');
 setBloodType(student.blood_type || 'O+');
 setAllergies(student.allergies || '');
 setMedicalNotes(student.medical_notes || '');
 setInternalNotes(student.internal_notes || '');
 setAuthorizedContacts(parseAuthorizedContacts(student.authorized_contacts));
 setFoodAllergies(parseFoodAllergies(student.food_allergies));
 setDietaryRestrictions(student.dietary_restrictions || 'Omnívora Habitual (Sin restricciones)');
 setStudentConsents(parseStudentConsents(student.consents));
 setStagedTutors([]);
 } else {
 // Reset for new student
 setFullName('');
 setAvatarUrl('');
 setGender('M');
 setDateOfBirth('');
 setNationalId('');
 setIdDocumentUrl('');
 setEnvironmentId(environments[0]?.id || '');
 setEnrollmentCode(`ALU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
 setEnrollmentDate(new Date().toISOString().split('T')[0]);
 setPreviousSchool('');
 setPreviousMethodology('');
 setStatus('active');
 setBloodType('O+');
 setAllergies('');
 setMedicalNotes('');
 setInternalNotes('');
 setAuthorizedContacts([]);
 setFoodAllergies([]);
 setDietaryRestrictions('Omnívora Habitual (Sin restricciones)');
 setStudentConsents([]);
 setStagedTutors([]);
 }
 setActiveTab('identity');
 setTutorMode('idle');
 setContactFormOpen(false);
 setFoodFormOpen(false);
 }
 }, [isOpen, student, environments]);

 // Handler for adding tutor to list
 const handleAddExistingTutor = async () => {
 if (!selectedExistingTutorId) {
 toast.error('Selecciona un tutor de la lista.');
 return;
 }

 const foundTutor = existingTutorsList.find(t => t.id === selectedExistingTutorId);
 if (!foundTutor) return;

 if (student) {
 // Direct linking for existing student
 try {
 await linkTutorToStudent(student.id, {
 userId: foundTutor.id,
 relationship: existingRelationship,
 isPrimaryContact: existingIsPrimary,
 authorizedPickUp: existingAuthorizedPickUp,
 });
 toast.success('Tutor vinculado correctamente');
 setTutorMode('idle');
 onSaved();
 } catch (err: any) {
 toast.error(err.message || 'Error al vincular tutor');
 }
 } else {
 // Stage for new student
 setStagedTutors(prev => [
 ...prev,
 {
 userId: foundTutor.id,
 fullName: foundTutor.fullName,
 email: foundTutor.email,
 phone: foundTutor.phone,
 avatarUrl: foundTutor.avatarUrl || '',
 relationship: existingRelationship,
 isPrimaryContact: existingIsPrimary,
 authorizedPickUp: existingAuthorizedPickUp,
 }
 ]);
 setTutorMode('idle');
 setSelectedExistingTutorId('');
 toast.success('Tutor agregado al expediente');
 }
 };

 const handleCreateAndAddTutor = async () => {
 if (!newTutorName.trim() || !newTutorEmail.trim()) {
 toast.error('Nombre y Correo electrónico del tutor son obligatorios.');
 return;
 }

 if (student) {
 // Direct create & link
 try {
 await linkTutorToStudent(student.id, {
 fullName: newTutorName.trim(),
 email: newTutorEmail.trim().toLowerCase(),
 phone: newTutorPhone.trim(),
 avatarUrl: newTutorAvatarUrl.trim(),
 relationship: newTutorRelationship,
 isPrimaryContact: newTutorIsPrimary,
 authorizedPickUp: newTutorAuthorizedPickUp,
 password: newTutorPassword.trim() || 'ceiba123',
 });
 toast.success('Nuevo tutor creado y vinculado');
 setTutorMode('idle');
 setNewTutorName('');
 setNewTutorEmail('');
 setNewTutorPhone('');
 setNewTutorAvatarUrl('');
 onSaved();
 } catch (err: any) {
 toast.error(err.message || 'Error al registrar tutor');
 }
 } else {
 // Stage for new student
 setStagedTutors(prev => [
 ...prev,
 {
 fullName: newTutorName.trim(),
 email: newTutorEmail.trim().toLowerCase(),
 phone: newTutorPhone.trim(),
 avatarUrl: newTutorAvatarUrl.trim(),
 relationship: newTutorRelationship,
 isPrimaryContact: newTutorIsPrimary,
 authorizedPickUp: newTutorAuthorizedPickUp,
 password: newTutorPassword.trim() || 'ceiba123',
 }
 ]);
 setTutorMode('idle');
 setNewTutorName('');
 setNewTutorEmail('');
 setNewTutorPhone('');
 setNewTutorAvatarUrl('');
 toast.success('Nuevo tutor agregado al expediente');
 }
 };

 const handleUnlinkTutor = async (tutorUserId: string, index?: number) => {
 if (isTutor) {
 toast.error('Solo la dirección escolar puede desvincular tutores.');
 return;
 }

 if (student) {
 const ok = await confirm({
 title: '¿Desvincular tutor del estudiante?',
 description: 'El tutor perderá el acceso al expediente y portal familiar de este alumno.',
 confirmText: 'Sí, desvincular',
 variant: 'warning'
 });
 if (!ok) return;

 try {
 await unlinkTutorFromStudent(student.id, tutorUserId);
 toast.success('Tutor desvinculado');
 onSaved();
 } catch (err) {
 toast.error('Error al desvincular tutor');
 }
 } else if (index !== undefined) {
 setStagedTutors(prev => prev.filter((_, i) => i !== index));
 }
 };

 // Handlers for Authorized Contacts
 const handleOpenAddContact = () => {
 setEditingContactId(null);
 setContactName('');
 setContactRelationship('Abuela materna');
 setContactPhone('');
 setContactIdNumber('');
 setContactPhotoUrl('');
 setContactCanPickup(true);
 setContactCanDropOff(true);
 setContactIsEmergency(true);
 setContactNotes('');
 setContactFormOpen(true);
 };

 const handleOpenEditContact = (contact: AuthorizedContactItem) => {
 setEditingContactId(contact.id);
 setContactName(contact.fullName);
 setContactRelationship(contact.relationship || 'Abuela materna');
 setContactPhone(contact.phone || '');
 setContactIdNumber(contact.idNumber || '');
 setContactPhotoUrl(contact.photoUrl || '');
 setContactCanPickup(contact.canPickup ?? true);
 setContactCanDropOff(contact.canDropOff ?? true);
 setContactIsEmergency(contact.isEmergency ?? true);
 setContactNotes(contact.notes || '');
 setContactFormOpen(true);
 };

 const handleSaveContact = (e: React.FormEvent) => {
 e.preventDefault();
 if (!contactName.trim()) {
 toast.error('El nombre de la persona autorizada es obligatorio.');
 return;
 }
 if (!contactPhone.trim()) {
 toast.error('El teléfono o WhatsApp de contacto es obligatorio.');
 return;
 }

 if (editingContactId) {
 setAuthorizedContacts(prev =>
 prev.map(c =>
 c.id === editingContactId
 ? {
 ...c,
 fullName: contactName.trim(),
 relationship: contactRelationship.trim(),
 phone: contactPhone.trim(),
 idNumber: contactIdNumber.trim(),
 photoUrl: contactPhotoUrl.trim(),
 canPickup: contactCanPickup,
 canDropOff: contactCanDropOff,
 isEmergency: contactIsEmergency,
 notes: contactNotes.trim()
 }
 : c
 )
 );
 toast.success('Contacto autorizado actualizado.');
 } else {
 const newContact: AuthorizedContactItem = {
 id: `contact_${Date.now()}_${Math.random()}`,
 fullName: contactName.trim(),
 relationship: contactRelationship.trim(),
 phone: contactPhone.trim(),
 idNumber: contactIdNumber.trim(),
 photoUrl: contactPhotoUrl.trim(),
 canPickup: contactCanPickup,
 canDropOff: contactCanDropOff,
 isEmergency: contactIsEmergency,
 notes: contactNotes.trim()
 };
 setAuthorizedContacts(prev => [...prev, newContact]);
 toast.success('Persona autorizada agregada al expediente.');
 }
 setContactFormOpen(false);
 };

 const handleDeleteContact = (id: string) => {
 setAuthorizedContacts(prev => prev.filter(c => c.id !== id));
 toast.success('Contacto eliminado del expediente.');
 };

 // Handlers for Food Allergies
 const handleOpenAddFoodAllergy = () => {
 setEditingFoodId(null);
 setFoodName('');
 setFoodSeverity('moderate');
 setFoodReaction('');
 setFoodActionPlan('');
 setFoodFormOpen(true);
 };

 const handleOpenEditFoodAllergy = (allergy: FoodAllergyItem) => {
 setEditingFoodId(allergy.id);
 setFoodName(allergy.name);
 setFoodSeverity(allergy.severity);
 setFoodReaction(allergy.reaction || '');
 setFoodActionPlan(allergy.actionPlan || '');
 setFoodFormOpen(true);
 };

 const handleSaveFoodAllergy = (e: React.FormEvent) => {
 e.preventDefault();
 if (!foodName.trim()) {
 toast.error('El nombre del alimento o alérgeno es obligatorio.');
 return;
 }

 if (editingFoodId) {
 setFoodAllergies(prev =>
 prev.map(a =>
 a.id === editingFoodId
 ? {
 ...a,
 name: foodName.trim(),
 severity: foodSeverity,
 reaction: foodReaction.trim(),
 actionPlan: foodActionPlan.trim()
 }
 : a
 )
 );
 toast.success('Alergia alimentaria actualizada.');
 } else {
 const newItem: FoodAllergyItem = {
 id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
 name: foodName.trim(),
 severity: foodSeverity,
 reaction: foodReaction.trim(),
 actionPlan: foodActionPlan.trim()
 };
 setFoodAllergies(prev => [...prev, newItem]);
 toast.success('Alergia alimentaria agregada.');
 }
 setFoodFormOpen(false);
 };

 const handleDeleteFoodAllergy = (id: string) => {
 setFoodAllergies(prev => prev.filter(a => a.id !== id));
 toast.success('Alergia alimentaria eliminada.');
 };

 const handleToggleQuickAllergen = (allergenName: string) => {
 const existing = foodAllergies.find(a => a.name.toLowerCase() === allergenName.toLowerCase());
 if (existing) {
 setFoodAllergies(prev => prev.filter(a => a.id !== existing.id));
 toast.success(`Alergia "${allergenName}" removida`);
 } else {
 const newItem: FoodAllergyItem = {
 id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
 name: allergenName,
 severity: 'moderate',
 reaction: 'Reacción adversa por ingesta o contacto accidental',
 actionPlan: 'Suspender ingesta de inmediato y notificar a tutores'
 };
 setFoodAllergies(prev => [...prev, newItem]);
 toast.success(`Alergia "${allergenName}" agregada`);
 }
 };

 // Handlers for Consents
 const handleToggleConsent = (templateId: string, currentGranted: boolean) => {
 setStudentConsents(prev => {
 const exists = prev.find(c => c.templateId === templateId);
 if (exists) {
 return prev.map(c =>
 c.templateId === templateId
 ? { ...c, granted: !currentGranted, updatedAt: new Date().toISOString() }
 : c
 );
 } else {
 return [
 ...prev,
 { templateId, granted: !currentGranted, updatedAt: new Date().toISOString() }
 ];
 }
 });
 };

 const handleUpdateConsentNotes = (templateId: string, notes: string) => {
 setStudentConsents(prev => {
 const exists = prev.find(c => c.templateId === templateId);
 if (exists) {
 return prev.map(c =>
 c.templateId === templateId
 ? { ...c, notes, updatedAt: new Date().toISOString() }
 : c
 );
 } else {
 return [
 ...prev,
 { templateId, granted: false, notes, updatedAt: new Date().toISOString() }
 ];
 }
 });
 };

 const handleSaveExpediente = async (e: React.FormEvent) => {
 e.preventDefault();
 if (isGlobalReadOnly) {
 triggerBlockedAction('Guardar o modificar expediente de alumno');
 return;
 }
 if (isReadOnly) {
 toast.error('Este expediente se encuentra en modo de solo lectura.');
 return;
 }
 if (!fullName.trim()) {
 toast.error('El nombre completo del alumno es obligatorio.');
 setActiveTab('identity');
 return;
 }

 setSaving(true);
 try {
 if (student) {
 await updateStudent(student.id, {
 fullName: fullName.trim(),
 avatarUrl: avatarUrl.trim() || undefined,
 gender,
 dateOfBirth: dateOfBirth || null,
 nationalId: nationalId.trim() || undefined,
 idDocumentUrl: idDocumentUrl.trim() || undefined,
 environmentId: isTutor ? (student.environment_id || (student.environment?.id || null)) : (environmentId || null),
 enrollmentCode: isTutor ? (student.enrollment_code || undefined) : (enrollmentCode.trim() || undefined),
 enrollmentDate: isTutor ? (student.enrollment_date || null) : (enrollmentDate || null),
 previousSchool: isTutor ? (student.previous_school || undefined) : (previousSchool.trim() || undefined),
 previousMethodology: isTutor ? (student.previous_methodology || undefined) : (previousMethodology.trim() || undefined),
 bloodType,
 allergies: allergies.trim() || undefined,
 foodAllergies: foodAllergies,
 dietaryRestrictions: dietaryRestrictions.trim() || undefined,
 medicalNotes: medicalNotes.trim() || undefined,
 internalNotes: isTutor ? (student.internal_notes || undefined) : (internalNotes.trim() || undefined),
 authorizedContacts: authorizedContacts,
 consents: studentConsents,
 status: isTutor ? (student.status || 'active') : status,
 });
 toast.success('¡Expediente del estudiante actualizado!');
 } else {
 await createStudent({
 fullName: fullName.trim(),
 avatarUrl: avatarUrl.trim() || undefined,
 gender,
 dateOfBirth: dateOfBirth || null,
 nationalId: nationalId.trim() || undefined,
 idDocumentUrl: idDocumentUrl.trim() || undefined,
 environmentId: environmentId || null,
 enrollmentCode: enrollmentCode.trim() || undefined,
 enrollmentDate: enrollmentDate || null,
 previousSchool: previousSchool.trim() || undefined,
 previousMethodology: previousMethodology.trim() || undefined,
 bloodType,
 allergies: allergies.trim() || undefined,
 foodAllergies: foodAllergies,
 dietaryRestrictions: dietaryRestrictions.trim() || undefined,
 medicalNotes: medicalNotes.trim() || undefined,
 internalNotes: internalNotes.trim() || undefined,
 authorizedContacts: authorizedContacts,
 consents: studentConsents,
 status,
 tutors: stagedTutors,
 });
 toast.success('¡Estudiante registrado con éxito!');
 }
 onSaved();
 onClose();
 } catch (err: any) {
 toast.error(err.message || 'Error al guardar expediente');
 } finally {
 setSaving(false);
 }
 };

 const selectedEnv = environments.find(e => e.id === environmentId);
 const currentTutorsList = student ? (student.tutors || []) : stagedTutors;

 if (!isMounted) return null;

 return (
 <div
 className={`fixed inset-0 top-0 left-0 right-0 bottom-0 h-screen h-[100dvh] max-h-[100dvh] z-50 bg-black/60 backdrop-blur-xs flex items-end sm:justify-end overflow-hidden !mt-0 transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
 }`}
 onClick={onClose}
 >
 <div
 className={`w-full max-h-[92vh] sm:max-h-[100dvh] h-auto sm:h-full sm:max-w-2xl lg:max-w-3xl bg-white rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col border-t sm:border-t-0 sm:border-l border-forest/10 top-0 transition-transform duration-300 ease-out ${isVisible
 ? 'translate-y-0 sm:translate-x-0 sm:translate-y-0'
 : 'translate-y-full sm:translate-x-full sm:translate-y-0'
 }`}
 onClick={(e) => e.stopPropagation()}
 style={{
 transform: isVisible
 ? (dragY > 0 ? `translateY(${dragY}px)` : undefined)
 : undefined,
 transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
 }}
 >
 {/* HEADER */}
 <div
 className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-forest/10 shrink-0 bg-white select-none"
 onTouchStart={handleTouchStart}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleTouchEnd}
 >
 {/* Mobile Pull-Down Handle Bar */}
 <div className="sm:hidden w-12 h-1.5 bg-forest/20 rounded-full mx-auto mb-2.5 cursor-grab active:cursor-grabbing shrink-0 transition-colors" />

 <div className="flex items-start justify-between gap-4">
 <div className="flex items-center gap-3.5">
 {/* Avatar Preview */}
 <div
 className="w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] rounded-2xl overflow-hidden bg-forest/5 border-2 flex items-center justify-center shrink-0 shadow-2xs relative group/avatar cursor-pointer"
 style={{ borderColor: selectedEnv?.color || '#1b3b2b' }}
 onClick={() => avatarUrl && setPreviewAvatarModalOpen(true)}
 title={avatarUrl ? "Haz clic para ver foto completa" : undefined}
 >
 {avatarUrl ? (
 <>
 <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform" />
 <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
 <Eye className="w-4 h-4" />
 </div>
 </>
 ) : (
 <User className="w-6 h-6 text-forest/40" />
 )}
 </div>

 <div>
 <div className="flex items-center gap-2">
 <span
 className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
 style={{ backgroundColor: selectedEnv?.color || '#1b3b2b' }}
 >
 {selectedEnv?.name || 'Sin Salón'}
 </span>
 <span className="text-[10px] font-mono font-bold text-muted-foreground bg-forest/5 px-2 py-0.5 rounded-md">
 {enrollmentCode || 'PROSPECTO'}
 </span>
 {isGraduated && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
 <GraduationCap className="w-3 h-3 text-slate-600" />
 <span>Graduado</span>
 </span>
 )}
 </div>
 <h2 className="text-xl font-bold font-display text-forest mt-0.5 truncate max-w-md">
 {fullName || (student ? (isGraduated ? 'Expediente Graduado' : 'Editar Estudiante') : 'Nuevo Ingreso / Onboarding')}
 </h2>
 </div>
 </div>

 <button
 onClick={onClose}
 className="p-2 rounded-full text-muted-foreground hover:text-forest hover:bg-forest/5 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* TABS NAVIGATION */}
 <div className="relative mt-6 border-b border-forest/10 -mb-[1px] flex items-center group/tabs">
 {/* Left Scroll Button */}
 <button
 type="button"
 onClick={() => scrollTabs('left')}
 className="absolute left-0 z-10 p-1 bg-white/95 border border-forest/10 hover:bg-forest/5 text-forest/70 rounded-full shadow-2xs cursor-pointer opacity-0 group-hover/tabs:opacity-100 transition-opacity flex items-center justify-center"
 >
 <ChevronLeft className="w-3.5 h-3.5" />
 </button>

 {/* Scrollable Container */}
 <div
 ref={tabContainerRef}
 className="flex-1 flex items-center gap-5 overflow-x-auto pb-3 no-scrollbar scroll-smooth px-8"
 >
 <button
 type="button"
 onClick={() => setActiveTab('identity')}
 className={`pb-1 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border-b-2 -mb-[13px] ${activeTab === 'identity'
 ? 'border-forest text-forest font-bold'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <User className="w-3.5 h-3.5" />
 <span>{isTeacherOrStaff ? 'Ficha del Infante' : 'Alumno'}</span>
 </button>

 {!isGraduated && (
 <button
 type="button"
 onClick={() => setActiveTab('health')}
 className={`pb-1 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border-b-2 -mb-[13px] ${activeTab === 'health'
 ? 'border-forest text-forest font-bold'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <HeartPulse className="w-3.5 h-3.5" />
 <span>Salud & Alergias ({foodAllergies.length > 0 ? `${foodAllergies.length} alérg.` : 'OK'})</span>
 </button>
 )}

 {!isGraduated && (
 <button
 type="button"
 onClick={() => setActiveTab('consents')}
 className={`pb-1 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border-b-2 -mb-[13px] ${activeTab === 'consents'
 ? 'border-forest text-forest font-bold'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <FileCheck className="w-3.5 h-3.5" />
 <span>Consentimientos</span>
 </button>
 )}

 <button
 type="button"
 onClick={() => setActiveTab('authorized_contacts')}
 className={`pb-1 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border-b-2 -mb-[13px] ${activeTab === 'authorized_contacts'
 ? 'border-forest text-forest font-bold'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <ShieldCheck className="w-3.5 h-3.5" />
 <span>{isTeacherOrStaff ? 'Autorizados para Retiro' : 'Autorizados & Retiro'} ({authorizedContacts.length})</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('tutors')}
 className={`pb-1 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border-b-2 -mb-[13px] ${activeTab === 'tutors'
 ? 'border-forest text-forest font-bold'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <Users className="w-3.5 h-3.5" />
 <span>{isTeacherOrStaff ? 'Familia' : 'Tutores'} ({currentTutorsList.length})</span>
 </button>
 </div>

 {/* Right Scroll Button */}
 <button
 type="button"
 onClick={() => scrollTabs('right')}
 className="absolute right-0 z-10 p-1 bg-white/95 border border-forest/10 hover:bg-forest/5 text-forest/70 rounded-full shadow-2xs cursor-pointer opacity-0 group-hover/tabs:opacity-100 transition-opacity flex items-center justify-center"
 >
 <ChevronRight className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {/* BODY (SCROLLABLE) */}
 <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
 <form id="student-form" onSubmit={handleSaveExpediente} className="space-y-6">

 {/* TAB 1: IDENTIDAD DEL ALUMNO */}
 {activeTab === 'identity' && (
 isReadOnly ? (
 <div className="space-y-5 animate-in fade-in">
 {/* Photo & Identity Banner */}
 <div className="bg-forest/5 p-5 rounded-3xl border border-forest/10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left shadow-2xs">
 <div
 className="w-20 h-20 rounded-3xl bg-white border-2 flex items-center justify-center font-bold text-2xl font-display text-forest shrink-0 overflow-hidden shadow-sm cursor-pointer"
 style={{ borderColor: selectedEnv?.color || '#1b3b2b' }}
 onClick={() => avatarUrl && setPreviewAvatarModalOpen(true)}
 title="Haz clic para ver foto completa"
 >
 {avatarUrl ? (
 <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
 ) : (
 <span>{(fullName || 'A').charAt(0).toUpperCase()}</span>
 )}
 </div>

 <div className="min-w-0 space-y-1.5 flex-1">
 <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
 {selectedEnv ? (
 <span
 className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs flex items-center gap-1.5"
 style={{ backgroundColor: selectedEnv.color || '#1b3b2b' }}
 >
 <Layers className="w-3.5 h-3.5" />
 <span>{selectedEnv.name}</span>
 {selectedEnv.stage && <span className="opacity-80 font-normal">({selectedEnv.stage})</span>}
 </span>
 ) : (
 <span className="text-xs text-muted-foreground bg-forest/10 px-2.5 py-0.5 rounded-full">
 Sin salón asignado
 </span>
 )}

 {enrollmentCode && (
 <span className="text-xs font-mono font-bold text-forest bg-forest/10 px-2.5 py-0.5 rounded-full border border-forest/15">
 Matrícula: {enrollmentCode}
 </span>
 )}

 <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
 {status === 'active' ? 'Matrícula Activa' : status}
 </span>
 </div>

 <h3 className="text-xl font-bold text-forest font-display leading-tight">{fullName}</h3>
 </div>
 </div>

 {/* General Info Grid (NO CURP, NO EDITING) */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
 <div className="p-4 rounded-2xl bg-white border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
 Fecha de Nacimiento & Edad
 </span>
 <strong className="text-xs text-forest block">
 {dateOfBirth ? `${dateOfBirth} (${calculateAge(dateOfBirth)})` : 'No registrada'}
 </strong>
 </div>

 <div className="p-4 rounded-2xl bg-white border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
 Género / Sexo
 </span>
 <strong className="text-xs text-forest block">
 {gender === 'M' ? 'Masculino (Niño)' : gender === 'F' ? 'Femenino (Niña)' : 'No especificado'}
 </strong>
 </div>

 <div className="p-4 rounded-2xl bg-white border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
 Fecha de Ingreso al Colegio
 </span>
 <strong className="text-xs text-forest block">
 {enrollmentDate || 'Ciclo actual'}
 </strong>
 </div>

 <div className="p-4 rounded-2xl bg-white border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
 Escuela / Metodología Previa
 </span>
 <strong className="text-xs text-forest block">
 {previousSchool ? `${previousSchool} (${previousMethodology || 'Montessori'})` : 'Primera experiencia escolar'}
 </strong>
 </div>
 </div>

 {/* Internal Pedagogical Notes */}
 {internalNotes && (
 <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 shadow-2xs space-y-1.5">
 <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70 flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-amber-600" />
 <span>Observaciones del Ambiente</span>
 </h4>
 <p className="text-xs text-forest/90 leading-relaxed italic">
 "{internalNotes}"
 </p>
 </div>
 )}
 </div>
 ) : (
 <div className="space-y-5 animate-in fade-in">
 {/* Photo Dropzone */}
 <ImageUploadDropzone
 value={avatarUrl}
 onChange={setAvatarUrl}
 label="Fotografía del Infante"
 helperText="Sube una foto clara del rostro del alumno/a (PNG, JPG)"
 aspectRatio="square"
 />

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-forest mb-1">
 Nombre Completo del Niño/a *
 </label>
 <input
 type="text"
 required
 placeholder="Ej. Mateo Rossi Martínez"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Ambiente / Salón Asignado
 </label>
 <select
 value={environmentId}
 onChange={(e) => setEnvironmentId(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white font-semibold text-forest"
 >
 <option value="">-- Sin Asignar / En Espera --</option>
 {environments.map((env) => (
 <option key={env.id} value={env.id}>
 {env.name} ({env.stage || 'Ambiente'})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Estatus del Expediente
 </label>
 {isTutor ? (
 <div className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-forest/5 font-bold text-forest flex items-center justify-between shadow-2xs">
 <span>
 {status === 'active' ? 'Activo / Inscrito' :
 status === 'prospect' ? 'Prospecto / En Admisiones' :
 status === 'inactive' ? 'Baja Temporal / Inactivo' :
 status === 'graduated' ? 'Graduado / Egresado' : status}
 </span>
 <span className="text-[10px] text-muted-foreground font-normal bg-white px-2 py-0.5 rounded-md border border-forest/10">
 Oficial
 </span>
 </div>
 ) : (
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white font-bold text-forest"
 >
 <option value="active">Activo / Inscrito</option>
 <option value="prospect">Prospecto / En Admisiones</option>
 <option value="inactive">Baja Temporal / Inactivo</option>
 <option value="graduated">Graduado / Egresado</option>
 </select>
 )}
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Sexo / Género
 </label>
 <select
 value={gender}
 onChange={(e) => setGender(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white"
 >
 <option value="M">Masculino (Niño)</option>
 <option value="F">Femenino (Niña)</option>
 <option value="OTHER">Otro / No especificado</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Fecha de Nacimiento
 </label>
 <input
 type="date"
 value={dateOfBirth}
 onChange={(e) => setDateOfBirth(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white"
 />
 </div>

 <div className="md:col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 CURP / DNI / Pasaporte
 </label>
 <input
 type="text"
 placeholder="Ej. ROMM190412HDF..."
 value={nationalId}
 onChange={(e) => setNationalId(e.target.value.toUpperCase())}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs font-mono bg-white uppercase"
 />
 </div>
 </div>

 {/* Scan Document Dropzone */}
 <div className="pt-2">
 <ImageUploadDropzone
 value={idDocumentUrl}
 onChange={setIdDocumentUrl}
 label="Acta de Nacimiento o Documento de Identidad (Escaneo)"
 helperText="Arrastra y suelta el documento escaneado o foto legible"
 />
 </div>
 </div>
 )
 )}

 {/* TAB 3: FAMILIA & TUTORES (CON FOTO) */}
 {activeTab === 'tutors' && (
 isReadOnly ? (
 <div className="space-y-5 animate-in fade-in">
 <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 flex items-start gap-3 shadow-2xs">
 <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
 <div className="text-xs space-y-0.5">
 <strong className="block font-bold text-emerald-900">Familia & Tutores Legales</strong>
 <p className="text-emerald-900/80 leading-relaxed">
 Nombres y parentescos de los tutores legales del infante. Los teléfonos y correos personales se comunican a través de los canales institucionales de recepción.
 </p>
 </div>
 </div>

 <div className="space-y-3">
 <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70">
 Tutores Registrados ({currentTutorsList.length})
 </h4>

 {currentTutorsList.length === 0 ? (
 <div className="p-8 text-center bg-forest/5 rounded-2xl border border-dashed border-forest/20 text-xs text-muted-foreground">
 <Users className="w-8 h-8 text-forest/40 mx-auto mb-2" />
 <p className="font-bold text-forest">No hay tutores vinculados aún</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {currentTutorsList.map((item: any, idx: number) => {
 const tutorData = item.tutor || item;
 const relLabel = RELATIONSHIP_OPTIONS.find(r => r.value === item.relationship)?.label || item.relationship || 'Tutor';
 const isPrimary = item.isPrimaryContact || item.is_primary_contact;
 const authPickUp = item.authorizedPickUp ?? item.authorized_pick_up ?? true;
 const tutorPhoto = tutorData.avatarUrl || tutorData.avatar_url || item.avatarUrl;

 return (
 <div
 key={item.id || item.userId || idx}
 className="p-4 rounded-2xl bg-white border border-forest/15 shadow-2xs flex flex-col justify-between space-y-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-xl bg-forest/5 border border-forest/15 text-forest font-bold flex items-center justify-center text-base shrink-0 overflow-hidden shadow-2xs">
 {tutorPhoto ? (
 <img src={tutorPhoto} alt={tutorData.fullName || tutorData.full_name} className="w-full h-full object-cover" />
 ) : (
 (tutorData.fullName || tutorData.full_name || 'T').charAt(0).toUpperCase()
 )}
 </div>

 <div className="min-w-0 flex-1 space-y-1">
 <p className="text-xs font-bold text-forest truncate">
 {tutorData.fullName || tutorData.full_name}
 </p>
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-2 py-0.5 rounded-md">
 {relLabel}
 </span>
 {isPrimary && (
 <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
 Principal
 </span>
 )}
 {authPickUp && (
 <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
 Retira
 </span>
 )}
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="space-y-6 animate-in fade-in">
 {isTutor && (
 <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 flex items-start gap-3 shadow-2xs">
 <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
 <div className="text-xs space-y-0.5">
 <strong className="block font-bold text-emerald-900">Vínculos de Tutores Legales</strong>
 <p className="text-emerald-900/80 leading-relaxed">
 Los tutores registrados cuentan con acceso al portal familiar. Por políticas de custodia y seguridad institucional, la asignación y baja de tutores es gestionada por la dirección escolar.
 </p>
 </div>
 </div>
 )}

 {/* List of currently associated tutors */}
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <div>
 <h4 className="text-xs font-bold uppercase tracking-wider text-forest">
 Tutores con Acceso al Portal Familiar
 </h4>
 <p className="text-[11px] text-muted-foreground">
 Padres o tutores legales con cuenta de usuario para ver avisos, fotos y estado del alumno.
 </p>
 </div>

 {!isTutor && tutorMode === 'idle' && (
 <div className="flex items-center gap-2">
 {existingTutorsList.length > 0 && (
 <button
 type="button"
 onClick={() => setTutorMode('link_existing')}
 className="px-3 py-1.5 text-xs font-bold text-forest bg-forest/5 hover:bg-forest/10 rounded-xl transition-all border border-forest/10 flex items-center gap-1"
 >
 <Search className="w-3.5 h-3.5" />
 <span>Vincular Existente</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => setTutorMode('create_new')}
 className="px-3 py-1.5 text-xs font-bold text-white bg-forest hover:bg-forest/90 rounded-xl transition-all shadow-xs flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Nuevo Tutor</span>
 </button>
 </div>
 )}
 </div>

 {currentTutorsList.length === 0 && tutorMode === 'idle' && (
 <div className="p-8 text-center bg-forest/5 rounded-2xl border border-dashed border-forest/20 text-xs text-muted-foreground space-y-2">
 <Users className="w-8 h-8 text-forest/40 mx-auto" />
 <p className="font-bold text-forest">No hay tutores vinculados aún</p>
 <p className="text-[11px] max-w-sm mx-auto">
 Registra a la madre, padre o tutor legal para habilitarles su portal y contacto oficial.
 </p>
 </div>
 )}

 {/* Tutor Cards with Photos */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {currentTutorsList.map((item: any, idx: number) => {
 const tutorData = item.tutor || item;
 const relLabel = RELATIONSHIP_OPTIONS.find(r => r.value === item.relationship)?.label || item.relationship || 'Tutor';
 const isPrimary = item.isPrimaryContact || item.is_primary_contact;
 const authPickUp = item.authorizedPickUp ?? item.authorized_pick_up ?? true;
 const tutorPhoto = tutorData.avatarUrl || tutorData.avatar_url || item.avatarUrl;

 return (
 <div
 key={item.id || item.userId || idx}
 className="p-4 rounded-2xl bg-white border border-forest/15 shadow-2xs flex flex-col justify-between space-y-3 relative group"
 >
 <div>
 <div className="flex items-center justify-between gap-1 mb-2">
 <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-2 py-0.5 rounded-md">
 {relLabel}
 </span>
 <div className="flex items-center gap-1">
 {isPrimary && (
 <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
 Principal
 </span>
 )}
 {authPickUp && (
 <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded" title="Autorizado a recoger">
 Retira
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="w-11 h-11 min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] rounded-xl bg-forest/5 border border-forest/15 text-forest font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-2xs">
 {tutorPhoto ? (
 <img src={tutorPhoto} alt={tutorData.fullName || tutorData.full_name} className="w-full h-full object-cover" />
 ) : (
 (tutorData.fullName || tutorData.full_name || tutorData.email || 'T').charAt(0).toUpperCase()
 )}
 </div>

 <div className="min-w-0 flex-1">
 <p className="text-xs font-bold text-forest truncate">
 {tutorData.fullName || tutorData.full_name || tutorData.email}
 </p>
 <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
 <Mail className="w-3 h-3 shrink-0" />
 <span className="truncate">{tutorData.email}</span>
 </p>
 {tutorData.phone && (
 <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
 <Phone className="w-3 h-3 shrink-0" />
 <span>{tutorData.phone}</span>
 </p>
 )}
 </div>
 </div>
 </div>

 <div className="pt-2 border-t border-forest/5 flex items-center justify-between">
 <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
 <Key className="w-3 h-3 text-emerald-600" /> Acceso activo
 </span>
 {!isTutor && (
 <button
 type="button"
 onClick={() => handleUnlinkTutor(item.tutorUserId || item.userId || item.id, idx)}
 className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
 title="Desvincular tutor"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* FORM: LINK EXISTING TUTOR */}
 {tutorMode === 'link_existing' && (
 <div className="p-5 rounded-2xl bg-forest/5 border border-forest/15 space-y-4 animate-in fade-in">
 <div className="flex items-center justify-between border-b border-forest/10 pb-2">
 <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
 <Search className="w-3.5 h-3.5" /> Vincular Tutor Existente
 </span>
 <button
 type="button"
 onClick={() => setTutorMode('idle')}
 className="text-xs text-muted-foreground hover:text-forest"
 >
 Cancelar
 </button>
 </div>

 <div className="space-y-3">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Seleccionar Tutor Registrado *
 </label>
 <select
 value={selectedExistingTutorId}
 onChange={(e) => setSelectedExistingTutorId(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white font-semibold text-forest"
 >
 <option value="">-- Elige un tutor --</option>
 {existingTutorsList.map((t) => (
 <option key={t.id} value={t.id}>
 {t.fullName} ({t.email})
 </option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Parentesco con el Alumno
 </label>
 <select
 value={existingRelationship}
 onChange={(e) => setExistingRelationship(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white"
 >
 {RELATIONSHIP_OPTIONS.map((r) => (
 <option key={r.value} value={r.value}>{r.label}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5 pt-2">
 <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-forest">
 <input
 type="checkbox"
 checked={existingIsPrimary}
 onChange={(e) => setExistingIsPrimary(e.target.checked)}
 className="w-4 h-4 rounded text-forest"
 />
 <span>Contacto Principal</span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-forest">
 <input
 type="checkbox"
 checked={existingAuthorizedPickUp}
 onChange={(e) => setExistingAuthorizedPickUp(e.target.checked)}
 className="w-4 h-4 rounded text-forest"
 />
 <span>Autorizado a Retirar</span>
 </label>
 </div>
 </div>

 <button
 type="button"
 onClick={handleAddExistingTutor}
 className="w-full py-2.5 text-xs font-bold bg-forest text-white hover:bg-forest/90 rounded-xl transition-all shadow-xs"
 >
 Confirmar Vinculación
 </button>
 </div>
 </div>
 )}

 {/* FORM: CREATE NEW TUTOR (CON FOTO) */}
 {tutorMode === 'create_new' && (
 <div className="p-5 rounded-2xl bg-forest/5 border border-forest/15 space-y-4 animate-in fade-in">
 <div className="flex items-center justify-between border-b border-forest/10 pb-2">
 <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
 <Plus className="w-3.5 h-3.5" /> Registrar Nuevo Tutor (Padre/Madre)
 </span>
 <button
 type="button"
 onClick={() => setTutorMode('idle')}
 className="text-xs text-muted-foreground hover:text-forest"
 >
 Cancelar
 </button>
 </div>

 <div className="space-y-3">
 {/* Tutor Avatar Dropzone */}
 <div>
 <label className="block text-xs font-bold text-forest mb-1">
 Foto de Perfil del Tutor (Opcional)
 </label>
 <ImageUploadDropzone
 value={newTutorAvatarUrl}
 onChange={setNewTutorAvatarUrl}
 label="Fotografía del Tutor"
 helperText="Sube una foto clara del rostro del tutor para identificación"
 aspectRatio="square"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="sm:col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Nombre Completo del Tutor *
 </label>
 <input
 type="text"
 placeholder="Ej. Carlos Rossi"
 value={newTutorName}
 onChange={(e) => setNewTutorName(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Correo Electrónico (Login) *
 </label>
 <input
 type="email"
 placeholder="tutor@ejemplo.com"
 value={newTutorEmail}
 onChange={(e) => setNewTutorEmail(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Teléfono / WhatsApp
 </label>
 <input
 type="tel"
 placeholder="+52 998 000 0000"
 value={newTutorPhone}
 onChange={(e) => setNewTutorPhone(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Parentesco
 </label>
 <select
 value={newTutorRelationship}
 onChange={(e) => setNewTutorRelationship(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white"
 >
 {RELATIONSHIP_OPTIONS.map((r) => (
 <option key={r.value} value={r.value}>{r.label}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Contraseña Inicial de Acceso
 </label>
 <input
 type="text"
 value={newTutorPassword}
 onChange={(e) => setNewTutorPassword(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs font-mono bg-white"
 />
 </div>

 <div className="sm:col-span-2 flex items-center gap-6 pt-1">
 <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-forest">
 <input
 type="checkbox"
 checked={newTutorIsPrimary}
 onChange={(e) => setNewTutorIsPrimary(e.target.checked)}
 className="w-4 h-4 rounded text-forest"
 />
 <span>Contacto Principal de Avisos</span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-forest">
 <input
 type="checkbox"
 checked={newTutorAuthorizedPickUp}
 onChange={(e) => setNewTutorAuthorizedPickUp(e.target.checked)}
 className="w-4 h-4 rounded text-forest"
 />
 <span>Autorizado a Retirar</span>
 </label>
 </div>
 </div>

 <button
 type="button"
 onClick={handleCreateAndAddTutor}
 className="w-full py-2.5 text-xs font-bold bg-forest text-white hover:bg-forest/90 rounded-xl transition-all shadow-xs"
 >
 Crear y Vincular Tutor
 </button>
 </div>
 </div>
 )}
 </div>
 )
 )}

 {/* TAB 4: PERSONAS AUTORIZADAS & EMERGENCIAS (CON FOTO) */}
 {activeTab === 'authorized_contacts' && (
 isReadOnly ? (
 <div className="space-y-5 animate-in fade-in">
 <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 flex items-start gap-3 shadow-2xs">
 <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
 <div className="text-xs space-y-0.5">
 <strong className="block font-bold text-emerald-900">Validación de Retiro y Entrega Escolar</strong>
 <p className="text-emerald-900/80 leading-relaxed">
 Verifica el nombre y parentesco de las personas autorizadas para recoger al infante. Por protección de datos, los teléfonos y documentos fiscales se encuentran resguardados en Dirección.
 </p>
 </div>
 </div>

 <div className="space-y-3">
 {authorizedContacts.length === 0 ? (
 <div className="p-8 text-center bg-forest/5 rounded-2xl border border-dashed border-forest/20 text-xs text-muted-foreground space-y-1">
 <ShieldAlert className="w-8 h-8 text-forest/40 mx-auto" />
 <p className="font-bold text-forest">Solo los tutores registrados están autorizados para el retiro.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {authorizedContacts.map((contact) => (
 <div
 key={contact.id}
 className="p-4 rounded-2xl bg-white border border-forest/15 shadow-2xs space-y-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-11 h-11 min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] rounded-xl bg-forest/5 border border-forest/15 text-forest font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-2xs">
 {contact.photoUrl ? (
 <img src={contact.photoUrl} alt={contact.fullName} className="w-full h-full object-cover" />
 ) : (
 contact.fullName.charAt(0).toUpperCase()
 )}
 </div>
 <div className="min-w-0 flex-1">
 <h5 className="text-xs font-bold text-forest truncate">{contact.fullName}</h5>
 <span className="text-[10px] font-bold text-forest/70 bg-forest/10 px-2 py-0.5 rounded-md inline-block mt-0.5">
 {contact.relationship}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-forest/5 text-[10px]">
 {contact.canPickup && (
 <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
 <Car className="w-3 h-3 text-emerald-600" />
 <span>Autorizado a Retirar</span>
 </span>
 )}
 {contact.canDropOff && (
 <span className="font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
 <UserCheck className="w-3 h-3 text-sky-600" />
 <span>Autorizado a Entregar</span>
 </span>
 )}
 </div>

 {contact.notes && (
 <p className="text-[11px] text-muted-foreground italic bg-forest/5 p-2 rounded-lg">
 "{contact.notes}"
 </p>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="space-y-6 animate-in fade-in">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
 <div className="flex items-start gap-3">
 <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
 <div>
 <h4 className="text-xs font-bold text-forest uppercase tracking-wider">
 Seguridad, Retiro y Contactos de Emergencia
 </h4>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 Personas autorizadas por los tutores para entregar o retirar al alumno del colegio, con fotografía para validación en puerta.
 </p>
 </div>
 </div>

 {!contactFormOpen && (
 <button
 type="button"
 onClick={handleOpenAddContact}
 className="px-4 py-2 text-xs font-bold text-white bg-forest hover:bg-forest/90 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
 >
 <Plus className="w-4 h-4" />
 <span>Agregar Autorizado</span>
 </button>
 )}
 </div>

 {/* FORM: AGREGAR / EDITAR PERSONA AUTORIZADA */}
 {contactFormOpen && (
 <div className="p-5 rounded-3xl bg-forest/5 border border-forest/20 shadow-xs space-y-4 animate-in fade-in">
 <div className="flex items-center justify-between border-b border-forest/10 pb-2.5">
 <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-2">
 <UserCheck className="w-4 h-4 text-forest" />
 <span>{editingContactId ? 'Editar Persona Autorizada' : 'Nueva Persona Autorizada'}</span>
 </span>
 <button
 type="button"
 onClick={() => setContactFormOpen(false)}
 className="text-xs text-muted-foreground hover:text-forest"
 >
 Cancelar
 </button>
 </div>

 <div className="space-y-4">
 {/* Foto Dropzone */}
 <div>
 <label className="block text-xs font-bold text-forest mb-1">
 Fotografía para Identificación en Puerta *
 </label>
 <ImageUploadDropzone
 value={contactPhotoUrl}
 onChange={setContactPhotoUrl}
 label="Foto del Rostro"
 helperText="Sube una foto clara para que recepción y guías identifiquen a la persona"
 aspectRatio="square"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="sm:col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Nombre Completo *
 </label>
 <input
 type="text"
 required
 placeholder="Ej. Rosaura Martínez López"
 value={contactName}
 onChange={(e) => setContactName(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Parentesco / Relación con el Alumno *
 </label>
 <select
 value={contactRelationship}
 onChange={(e) => setContactRelationship(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white font-medium text-forest"
 >
 {CONTACT_RELATIONSHIPS.map((rel) => (
 <option key={rel} value={rel}>{rel}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Teléfono / WhatsApp *
 </label>
 <input
 type="tel"
 required
 placeholder="+52 998 123 4567"
 value={contactPhone}
 onChange={(e) => setContactPhone(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white font-mono"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Documento Oficial / INE / DNI / Pasaporte (Opcional)
 </label>
 <input
 type="text"
 placeholder="Ej. INE: 1234567890123"
 value={contactIdNumber}
 onChange={(e) => setContactIdNumber(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white font-mono"
 />
 </div>

 {/* Checkboxes de Autorizaciones */}
 <div className="sm:col-span-2 p-3 bg-white rounded-2xl border border-forest/15 space-y-2">
 <span className="text-[11px] font-bold text-forest uppercase tracking-wider block mb-1">
 Permisos & Autorizaciones
 </span>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
 <label className="flex items-center gap-2 p-2 rounded-xl border border-forest/10 hover:bg-forest/5 cursor-pointer text-xs font-medium text-forest">
 <input
 type="checkbox"
 checked={contactCanPickup}
 onChange={(e) => setContactCanPickup(e.target.checked)}
 className="w-4 h-4 rounded text-forest"
 />
 <span> Retirar Alumno</span>
 </label>

 <label className="flex items-center gap-2 p-2 rounded-xl border border-forest/10 hover:bg-forest/5 cursor-pointer text-xs font-medium text-forest">
 <input
 type="checkbox"
 checked={contactCanDropOff}
 onChange={(e) => setContactCanDropOff(e.target.checked)}
 className="w-4 h-4 rounded text-forest"
 />
 <span> Entregar Alumno</span>
 </label>

 <label className="flex items-center gap-2 p-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer text-xs font-medium text-amber-900">
 <input
 type="checkbox"
 checked={contactIsEmergency}
 onChange={(e) => setContactIsEmergency(e.target.checked)}
 className="w-4 h-4 rounded text-amber-700"
 />
 <span> Emergencia</span>
 </label>
 </div>
 </div>

 <div className="sm:col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Notas de Seguridad o Restricciones (Opcional)
 </label>
 <textarea
 rows={2}
 placeholder="Ej. Solo autorizado a recoger los viernes o presentando identificación física..."
 value={contactNotes}
 onChange={(e) => setContactNotes(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs bg-white resize-none"
 />
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setContactFormOpen(false)}
 className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleSaveContact}
 className="px-6 py-2 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all"
 >
 {editingContactId ? 'Guardar Cambios' : 'Agregar Contacto'}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* List of Registered Authorized Contacts */}
 {authorizedContacts.length === 0 && !contactFormOpen ? (
 <div className="p-8 text-center bg-forest/5 rounded-2xl border border-dashed border-forest/20 text-xs text-muted-foreground space-y-2">
 <ShieldCheck className="w-8 h-8 text-forest/40 mx-auto" />
 <p className="font-bold text-forest">No hay personas autorizadas registradas</p>
 <p className="text-[11px] max-w-sm mx-auto">
 Registra abuelos, tíos, nanas o choferes autorizados para recoger al alumno en la salida.
 </p>
 <button
 type="button"
 onClick={handleOpenAddContact}
 className="mt-2 px-4 py-2 bg-forest text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
 >
 <Plus className="w-4 h-4" /> Agregar Primer Contacto
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {authorizedContacts.map((contact) => (
 <div
 key={contact.id}
 className="p-4 rounded-3xl bg-white border border-forest/15 shadow-2xs flex flex-col justify-between space-y-3 relative group hover:border-forest/30 transition-all"
 >
 <div>
 {/* Top Badges */}
 <div className="flex items-center justify-between gap-1 mb-2">
 <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-2.5 py-0.5 rounded-full">
 {contact.relationship}
 </span>
 <div className="flex items-center gap-1 flex-wrap justify-end">
 {contact.canPickup && (
 <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
 Retira
 </span>
 )}
 {contact.isEmergency && (
 <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
 Emergencia
 </span>
 )}
 </div>
 </div>

 {/* Contact Info with Photo */}
 <div className="flex items-start gap-3">
 <div className="w-13 h-13 min-w-[52px] min-h-[52px] max-w-[52px] max-h-[52px] rounded-2xl bg-forest/5 border border-forest/15 text-forest font-bold flex items-center justify-center text-base shrink-0 overflow-hidden shadow-2xs">
 {contact.photoUrl ? (
 <img src={contact.photoUrl} alt={contact.fullName} className="w-full h-full object-cover" />
 ) : (
 contact.fullName.charAt(0).toUpperCase()
 )}
 </div>

 <div className="min-w-0 flex-1">
 <h5 className="text-xs font-bold text-forest break-words leading-tight">
 {contact.fullName}
 </h5>
 <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-mono">
 <Phone className="w-3 h-3 text-forest/60 shrink-0" />
 <span>{contact.phone}</span>
 </p>
 {contact.idNumber && (
 <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
 <IdCard className="w-3 h-3 text-forest/60 shrink-0" />
 <span>{contact.idNumber}</span>
 </p>
 )}
 </div>
 </div>

 {/* Notes if any */}
 {contact.notes && (
 <div className="mt-2.5 p-2 bg-forest/5 rounded-xl border border-forest/10 text-[10px] text-forest/80 italic">
 "{contact.notes}"
 </div>
 )}
 </div>

 {/* Action buttons */}
 <div className="pt-2 border-t border-forest/5 flex items-center justify-between">
 <span className="text-[10px] text-muted-foreground">
 {contact.canDropOff ? ' Entrega y Retira' : 'Solo Retiro'}
 </span>
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => handleOpenEditContact(contact)}
 className="p-1.5 text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-lg transition-colors"
 title="Editar contacto"
 >
 <Edit className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => handleDeleteContact(contact.id)}
 className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
 title="Eliminar contacto"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )
 )}

 {/* TAB 5: SALUD & ALERGIAS */}
 {activeTab === 'health' && (
 isReadOnly ? (
 <div className="space-y-5 animate-in fade-in">
 {/* Blood Type & Dietary Card */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
 <div className="p-4 rounded-2xl bg-white border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
 <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
 <span>Grupo Sanguíneo</span>
 </span>
 <strong className="text-base font-bold font-mono text-rose-700 block">
 {bloodType || 'No registrado'}
 </strong>
 </div>

 <div className="p-4 rounded-2xl bg-white border border-forest/10 shadow-2xs space-y-1">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
 <Apple className="w-3.5 h-3.5 text-emerald-600" />
 <span>Régimen Dietético / Alimentario</span>
 </span>
 <strong className="text-xs font-bold text-forest block">
 {dietaryRestrictions || 'Dieta Estándar / Sin restricciones'}
 </strong>
 </div>
 </div>

 {/* General / Environmental / Medical Allergies */}
 {allergies && (
 <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-950 shadow-2xs space-y-1.5">
 <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
 <AlertTriangle className="w-4 h-4 text-rose-600" />
 <span>Alergias Generales / Medicamentosas</span>
 </h4>
 <p className="text-xs font-semibold text-rose-900 leading-relaxed bg-white/70 p-3 rounded-xl border border-rose-200/60">
 {allergies}
 </p>
 </div>
 )}

 {/* Food Allergies */}
 <div className="p-5 rounded-3xl bg-white border border-forest/15 shadow-2xs space-y-3">
 <h4 className="text-xs font-bold uppercase tracking-wider text-forest/80 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-600" />
 <span>Alergias Alimentarias & Cuidados ({foodAllergies.length})</span>
 </h4>

 {foodAllergies.length === 0 ? (
 <p className="text-xs text-muted-foreground bg-forest/5 p-3 rounded-xl border border-forest/10">
 No se han registrado alergias alimentarias para este alumno.
 </p>
 ) : (
 <div className="grid grid-cols-1 gap-2.5">
 {foodAllergies.map((allergy) => {
 const isSevere = allergy.severity === 'severe';
 const isMod = allergy.severity === 'moderate';
 return (
 <div
 key={allergy.id}
 className={`p-3.5 rounded-2xl border space-y-1.5 ${isSevere
 ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-2xs'
 : isMod
 ? 'bg-amber-50/90 border-amber-300 text-amber-950'
 : 'bg-yellow-50/90 border-yellow-300 text-yellow-950'
 }`}
 >
 <div className="flex items-center justify-between gap-2">
 <strong className="text-xs font-bold flex items-center gap-1.5">
 <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
 <span>{allergy.name}</span>
 </strong>
 <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${isSevere
 ? 'bg-rose-200 text-rose-900 font-extrabold'
 : isMod
 ? 'bg-amber-200 text-amber-900'
 : 'bg-yellow-200 text-yellow-900'
 }`}>
 {isSevere ? 'Severa / Anafilaxia' : isMod ? 'Moderada' : 'Leve'}
 </span>
 </div>

 {allergy.reaction && (
 <p className="text-xs leading-relaxed">
 <strong className="font-semibold">Reacción:</strong> {allergy.reaction}
 </p>
 )}

 {allergy.actionPlan && (
 <p className="text-xs leading-relaxed">
 <strong className="font-semibold">Plan de Acción:</strong> {allergy.actionPlan}
 </p>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Medical Notes & General Care */}
 {medicalNotes && (
 <div className="p-4 rounded-2xl bg-white border border-forest/15 shadow-2xs space-y-1.5">
 <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70 flex items-center gap-1.5">
 <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
 <span>Indicaciones Médicas & Cuidados Especiales</span>
 </h4>
 <p className="text-xs text-forest/90 leading-relaxed bg-forest/5 p-3 rounded-xl border border-forest/10">
 {medicalNotes}
 </p>
 </div>
 )}
 </div>
 ) : (
 <div className="space-y-6 animate-in fade-in">
 {/* Visual Summary Alert Banner */}
 <div className="p-4 rounded-2xl bg-gradient-to-r from-forest/5 via-amber-500/5 to-terracotta/5 border border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
 <HeartPulse className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-bold text-xs text-forest">Protocolo de Salud</h4>
 <p className="text-[11px] text-muted-foreground">
 Expediente alimentario y ficha médica.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1.5 flex-wrap">
 <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${foodAllergies.length > 0
 ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold'
 : 'bg-emerald-100 text-emerald-800 border-emerald-300'
 }`}>
 {foodAllergies.length > 0 ? ` ${foodAllergies.length} Alergias alimentarias` : ' Sin alergias'}
 </span>
 <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-forest/10 text-forest border border-forest/15">
 Sangre: {bloodType}
 </span>
 </div>
 </div>

 {/* 1. SECCIÓN: ALERGIAS ALIMENTARIAS & DIETA */}
 <div className="p-5 rounded-3xl bg-white border border-forest/15 shadow-2xs space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-forest/10 pb-3">
 <div className="flex items-center gap-2">
 <Utensils className="w-4 h-4 text-forest" />
 <div>
 <h4 className="font-bold text-xs text-forest font-display">Alergias Alimentarias & Menú del Colegio</h4>
 <p className="text-[11px] text-muted-foreground">Registra alimentos restringidos para el refrigerio, comedor y festejos.</p>
 </div>
 </div>

 <button
 type="button"
 onClick={handleOpenAddFoodAllergy}
 className="px-3.5 py-1.5 bg-forest text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" /> Agregar Alergia
 </button>
 </div>

 {/* Formulario de Alta/Edición de Alergia Alimentaria */}
 {foodFormOpen && (
 <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3.5">
 <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
 <h5 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
 <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
 <span>{editingFoodId ? 'Editar Alergia Alimentaria' : 'Nueva Alergia Alimentaria'}</span>
 </h5>
 <button
 type="button"
 onClick={() => setFoodFormOpen(false)}
 className="text-amber-900/60 hover:text-amber-950 p-0.5"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-amber-900 mb-1">Nombre del Alimento *</label>
 <input
 type="text"
 placeholder="Ej. Cacahuate, Huevo, Leche de vaca..."
 value={foodName}
 onChange={(e) => setFoodName(e.target.value)}
 className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white text-amber-950"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold text-amber-900 mb-1">Nivel de Gravedad *</label>
 <select
 value={foodSeverity}
 onChange={(e) => setFoodSeverity(e.target.value as any)}
 className="w-full p-2 text-xs rounded-xl border border-amber-300 bg-white text-amber-950"
 >
 <option value="mild">Leve (Urticaria leve, picazón)</option>
 <option value="moderate">Moderada (Malestar, inflamación)</option>
 <option value="severe">Severa / Anafilaxia (Riesgo vital)</option>
 </select>
 </div>

 <div className="sm:col-span-2">
 <label className="block text-[10px] font-bold text-amber-900 mb-1">Tipo de Reacción (Síntomas comunes)</label>
 <input
 type="text"
 placeholder="Ej. Urticaria generalizada, dificultad para respirar, dolor abdominal..."
 value={foodReaction}
 onChange={(e) => setFoodReaction(e.target.value)}
 className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white text-amber-950"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="block text-[10px] font-bold text-amber-900 mb-1">Plan de Acción / Medicación (Si se consume por error)</label>
 <textarea
 rows={2}
 placeholder="Ej. Administrar una dosis de antihistamínico y avisar a padres. En caso severo, usar EpiPen y llamar a emergencias."
 value={foodActionPlan}
 onChange={(e) => setFoodActionPlan(e.target.value)}
 className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white text-amber-950 resize-none"
 />
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/30">
 <button
 type="button"
 onClick={() => setFoodFormOpen(false)}
 className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 rounded-xl"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleSaveFoodAllergy}
 className="px-4 py-1.5 bg-amber-800 text-white text-xs font-bold rounded-xl"
 >
 {editingFoodId ? 'Guardar Cambios' : 'Registrar Alergia'}
 </button>
 </div>
 </div>
 )}

 <div className="pt-2 border-t border-forest/10">
 <label className="block text-xs font-bold text-forest mb-1.5 flex items-center gap-1.5">
 <Apple className="w-3.5 h-3.5 text-forest" />
 <span>Régimen Dietético / Alimentación Familiar</span>
 </label>
 <select
 value={dietaryRestrictions}
 onChange={(e) => setDietaryRestrictions(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white shadow-2xs focus:outline-none"
 >
 {DIET_TYPES.map((dt) => (
 <option key={dt} value={dt}>{dt}</option>
 ))}
 </select>
 </div>
 </div>

 {/* 3. SECCIÓN: DATOS MÉDICOS GENERALES */}
 <div className="p-5 rounded-3xl bg-white border border-forest/15 shadow-2xs space-y-4">
 <div className="border-b border-forest/10 pb-3 flex items-center gap-2">
 <HeartPulse className="w-4 h-4 text-forest" />
 <div>
 <h4 className="font-bold text-xs text-forest font-display">Ficha Médica & Tipo de Sangre</h4>
 <p className="text-[11px] text-muted-foreground">Datos clínicos para atención en caso de emergencia escolar.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-forest mb-1">
 Tipo de Sangre *
 </label>
 <select
 value={bloodType}
 onChange={(e) => setBloodType(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white shadow-2xs focus:outline-none"
 >
 {BLOOD_TYPES.map((bt) => (
 <option key={bt} value={bt}>{bt}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Alergias Médicas / Generales (Medicamentos, abejas, polvo, etc.)
 </label>
 <input
 type="text"
 placeholder="Ej. Penicilina, Picadura de abeja, Polvo/Ácaros..."
 value={allergies}
 onChange={(e) => setAllergies(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white text-destructive font-medium"
 />
 </div>

 <div className="md:col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Condiciones Médicas o Indicaciones de Emergencia
 </label>
 <textarea
 rows={2}
 placeholder="Tratamientos activos, uso de inhalador, uso de lentes, restricciones de actividad física..."
 value={medicalNotes}
 onChange={(e) => setMedicalNotes(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white resize-none"
 />
 </div>

 <div className="md:col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Notas Internas del Equipo Guía (Confidencial)
 </label>
 <textarea
 rows={2}
 placeholder="Observaciones de adaptación, acuerdos pedagógicos con padres o acuerdos de pago..."
 value={internalNotes}
 onChange={(e) => setInternalNotes(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-xs bg-white resize-none"
 />
 </div>
 </div>
 </div>
 </div>
 )
 )}

 {/* TAB 6: CONSENTIMIENTOS */}
 {activeTab === 'consents' && (
 isReadOnly ? (
 <div className="space-y-5 animate-in fade-in">
 {/* School Consents & Permissions */}
 <div className="p-5 rounded-3xl bg-white border border-forest/15 shadow-2xs space-y-3">
 <h4 className="text-xs font-bold uppercase tracking-wider text-forest/80 flex items-center gap-2">
 <FileCheck className="w-4 h-4 text-forest" />
 <span>Autorizaciones & Consentimientos Institucionales</span>
 </h4>
 <div className="space-y-2.5">
 {schoolConsentTemplates.map((template) => {
 const studentRecord = studentConsents.find(c => c.templateId === template.id);
 const isGranted = Boolean(studentRecord?.granted);
 const notes = studentRecord?.notes;
 return (
 <div
 key={template.id}
 className={`p-3.5 rounded-2xl border flex flex-col gap-2 text-xs transition-all ${isGranted
 ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
 : 'bg-gray-50 border-gray-200 text-gray-700'
 }`}
 >
 <div className="flex items-center justify-between gap-3">
 <span className="font-bold text-forest">{template.title}</span>
 <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isGranted ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'
 }`}>
 {isGranted ? ' Autorizado' : ' No Autorizado'}
 </span>
 </div>

 {template.description && (
 <p className="text-[11px] text-muted-foreground leading-relaxed">
 {template.description}
 </p>
 )}

 {notes && (
 <p className="text-[11px] bg-white p-2 rounded-xl border border-forest/10 text-forest/90 italic">
 <strong className="font-semibold not-italic">Condición del tutor:</strong> "{notes}"
 </p>
 )}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-6 animate-in fade-in">
 {/* 2. SECCIÓN: CONSENTIMIENTOS INSTITUCIONALES (ESCUELA) */}
 <div className="p-5 rounded-3xl bg-white border border-forest/15 shadow-2xs space-y-4">
 <div className="border-b border-forest/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <FileCheck className="w-4 h-4 text-forest" />
 <div>
 <h4 className="font-bold text-xs text-forest font-display">Consentimientos & Autorizaciones Institucionales</h4>
 <p className="text-[11px] text-muted-foreground">
 Declaraciones y permisos legales configurados para el plantel escolar.
 </p>
 </div>
 </div>

 <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-forest/10 text-forest border border-forest/15 self-start sm:self-auto">
 {studentConsents.filter(c => c.granted).length} de {schoolConsentTemplates.length} Autorizados
 </span>
 </div>

 {loadingSchoolConsents ? (
 <div className="p-4 text-center text-xs text-muted-foreground">Cargando consentimientos...</div>
 ) : schoolConsentTemplates.length === 0 ? (
 <div className="p-4 text-center text-xs text-muted-foreground bg-forest/5 rounded-2xl border border-forest/10">
 No hay plantillas de consentimiento configuradas en los ajustes del colegio.
 </div>
 ) : (
 <div className="space-y-3">
 {schoolConsentTemplates.map((template) => {
 const studentRecord = studentConsents.find(c => c.templateId === template.id);
 const isGranted = Boolean(studentRecord?.granted);
 const notes = studentRecord?.notes || '';

 const getCategoryMeta = (cat: string) => {
 switch (cat) {
 case 'media':
 return { label: ' Fotografía & Redes', icon: Camera, color: 'bg-purple-50 text-purple-800 border-purple-200' };
 case 'trips':
 return { label: ' Salidas Pedagógicas', icon: Bus, color: 'bg-blue-50 text-blue-800 border-blue-200' };
 case 'medical':
 return { label: ' Salud & Primeros Auxilios', icon: HeartHandshake, color: 'bg-rose-50 text-rose-800 border-rose-200' };
 case 'outdoors':
 return { label: ' Huerto & Aire Libre', icon: TreePine, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
 default:
 return { label: ' General', icon: FileCheck, color: 'bg-stone-100 text-stone-800 border-stone-200' };
 }
 };
 const meta = getCategoryMeta(template.category);

 return (
 <div
 key={template.id}
 className={`p-4 rounded-2xl border transition-all ${isGranted
 ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
 : 'bg-gray-50/80 border-gray-200'
 }`}
 >
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
 <div className="space-y-1.5 flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
 {meta.label}
 </span>

 {template.isRequired && (
 <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
 Requerido
 </span>
 )}
 </div>

 <h5 className="font-bold text-xs text-forest leading-tight">
 {template.title}
 </h5>

 <p className="text-[11px] text-muted-foreground leading-relaxed">
 {template.description}
 </p>
 </div>

 {/* Toggle Button */}
 <button
 type="button"
 onClick={() => handleToggleConsent(template.id, isGranted)}
 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 self-start sm:self-auto ${isGranted
 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
 : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
 }`}
 >
 {isGranted ? (
 <>
 <CheckCircle2 className="w-4 h-4" />
 <span> Autorizado</span>
 </>
 ) : (
 <>
 <XCircle className="w-4 h-4 text-gray-500" />
 <span> No Autorizado</span>
 </>
 )}
 </button>
 </div>

 {/* Particular notes/conditions input */}
 <div className="mt-2.5 pt-2 border-t border-forest/5">
 <input
 type="text"
 placeholder="Condiciones o notas particulares (ej. 'Solo fotos grupales o de espalda, no rostro en primer plano')..."
 value={notes}
 onChange={(e) => handleUpdateConsentNotes(template.id, e.target.value)}
 className="w-full px-3 py-1.5 text-[11px] rounded-xl border border-forest/10 bg-white/80 focus:bg-white text-forest placeholder:text-muted-foreground/70"
 />
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )
 )}
 </form>
 </div>

 {/* FOOTER */}
 <div className="p-4 sm:p-6 border-t border-forest/10 bg-white flex items-center justify-between shrink-0">
 {isReadOnly ? (
 <div className="flex items-center justify-between w-full">
 {isGraduated && (
 <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
 <GraduationCap className="w-4 h-4 text-forest" />
 <span>Expediente histórico (Solo Lectura)</span>
 </span>
 )}
 <button
 type="button"
 onClick={onClose}
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer ml-auto"
 >
 <Check className="w-4 h-4" />
 <span>{isGraduated ? 'Cerrar Expediente' : 'Cerrar Ficha'}</span>
 </button>
 </div>
 ) : (
 <>
 <button
 type="button"
 onClick={onClose}
 className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors"
 >
 Cancelar
 </button>

 <button
 type="submit"
 form="student-form"
 disabled={saving}
 className="px-7 py-2.5 text-xs font-bold bg-forest hover:bg-forest/90 text-white rounded-xl shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
 >
 <Check className="w-4 h-4" />
 <span>{saving ? 'Guardando Expediente...' : (student ? 'Guardar Cambios' : 'Completar Registro')}</span>
 </button>
 </>
 )}
 </div>
 </div>

 {/* FULL PHOTO PREVIEW MODAL */}
 {previewAvatarModalOpen && avatarUrl && (
 <div
 className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
 onClick={() => setPreviewAvatarModalOpen(false)}
 >
 <div className="bg-white p-3 rounded-3xl max-w-sm w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
 <button
 onClick={() => setPreviewAvatarModalOpen(false)}
 className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
 >
 <X className="w-4 h-4" />
 </button>
 <img src={avatarUrl} alt={fullName} className="w-full aspect-square object-cover rounded-2xl" />
 <p className="text-center text-xs font-bold text-forest mt-3">{fullName}</p>
 </div>
 </div>
 )}
 </div>
 );
};

export default StudentDrawer;
