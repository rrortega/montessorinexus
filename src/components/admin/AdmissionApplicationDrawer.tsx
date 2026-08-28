import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Baby,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  GraduationCap,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Upload,
  ExternalLink,
  Check,
  X,
  Edit3,
  Save,
  ChevronRight,
  Trash2,
  Send,
  HelpCircle,
  FileCheck2,
  Workflow,
  Eye,
  PenTool,
  Share2,
  Copy,
  MessageCircle
} from 'lucide-react';
import {
  AdmissionApplicationItem,
  AdmissionStageItem,
  EnvironmentItem,
  FormSubmissionItem,
  updateAdmissionApplication,
  moveAdmissionApplicationStage,
  enrollAdmissionApplication,
  deleteAdmissionApplication,
  returnApplicationToWaitlist
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { AdmissionDossierModal } from './AdmissionDossierModal';
import { AdmissionFormResponseDrawer } from './AdmissionFormResponseDrawer';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAdminDashboard } from '@/pages/admin/AdminDashboard';
import { toast } from 'sonner';
import { useSiteSettings } from '@/context/SettingsContext';
import { getCountryIdLabels } from './CreateAdmissionModal';

interface AdmissionApplicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: AdmissionApplicationItem | null;
  stages: AdmissionStageItem[];
  environments: EnvironmentItem[];
  onUpdated: () => void;
}

export const AdmissionApplicationDrawer: React.FC<AdmissionApplicationDrawerProps> = ({
  isOpen,
  onClose,
  application,
  stages,
  environments,
  onUpdated
}) => {
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
  const { schoolCountry } = useSiteSettings();
  const isMexico = schoolCountry?.toLowerCase() === 'méxico' || schoolCountry?.toLowerCase() === 'mexico';
  const isStaff = application?.tutor_relationship === 'STAFF';
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'info' | 'documents' | 'history' | 'enroll'>('pipeline');
  const [loading, setLoading] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);

  // Document state and Viewer modal
  const [submittedDocs, setSubmittedDocs] = useState<any[]>([]);
  const [selectedDocForViewing, setSelectedDocForViewing] = useState<any | null>(null);
  const [selectedSubmissionForViewing, setSelectedSubmissionForViewing] = useState<FormSubmissionItem | null>(null);

  // Editable fields
  const [internalNotes, setInternalNotes] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [selectedTargetStageId, setSelectedTargetStageId] = useState('');

  // Enrollment fields
  const [enrollEnvId, setEnrollEnvId] = useState('');
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollDate, setEnrollDate] = useState('');
  const [enrollGrade, setEnrollGrade] = useState('');
  const [enrollBloodType, setEnrollBloodType] = useState('No especificado');
  const [enrollAllergies, setEnrollAllergies] = useState('');
  const [enrollMedicalNotes, setEnrollMedicalNotes] = useState('');

  // Share Portal Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTab, setShareTab] = useState<'whatsapp' | 'email' | 'link'>('whatsapp');
  const [shareWhatsappPhone, setShareWhatsappPhone] = useState('');
  const [shareEmailTo, setShareEmailTo] = useState('');
  const [shareEmailName, setShareEmailName] = useState('');

  // Document upload state (manual URL or item)
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  useEffect(() => {
    if (application) {
      setSubmittedDocs(application.submitted_documents || []);
      setInternalNotes(application.internal_notes || '');
      setSelectedTargetStageId(application.stage_id);
      setTransitionNotes('');

      setShareWhatsappPhone(application.tutor_phone || '');
      setShareEmailTo(application.tutor_email || '');
      setShareEmailName(application.tutor_name || '');

      const defaultEnv = application.target_environment_id || (application.target_environment_ids && application.target_environment_ids[0]) || (environments[0]?.id || '');
      setEnrollEnvId(defaultEnv);
      setEnrollCode(`MAT-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`);
      setEnrollDate(new Date().toISOString().slice(0, 10));
      setEnrollGrade('');
      setEnrollBloodType('No especificado');
      setEnrollAllergies('');
      setEnrollMedicalNotes('');
    }
  }, [application, environments]);

  if (!application) return null;

  const currentStage = stages.find(s => s.id === application.stage_id) || application.stage;
  const currentStageIndex = stages.findIndex(s => s.id === application.stage_id);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null;
  const prevStage = currentStageIndex > 0 ? stages[currentStageIndex - 1] : null;

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

  const handleAdvanceToNext = async () => {
    if (isReadOnly) {
      triggerBlockedAction('Avanzar o mover de etapa en el proceso');
      return;
    }
    if (!nextStage) return;
    setLoading(true);
    try {
      await moveAdmissionApplicationStage(application.id, nextStage.id, `Avanzado a la etapa ${nextStage.name}`);
      toast.success(`Avanzado a la etapa "${nextStage.name}"`);
      onUpdated();
    } catch (e: any) {
      toast.error(e.message || 'Error al avanzar de etapa');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomMoveStage = async (targetId: string, notes?: string) => {
    if (isReadOnly) {
      triggerBlockedAction('Cambiar etapa en el proceso');
      return;
    }
    if (!targetId || targetId === application.stage_id) return;
    setLoading(true);
    try {
      await moveAdmissionApplicationStage(application.id, targetId, notes || transitionNotes);
      toast.success('Etapa actualizada');
      setTransitionNotes('');
      onUpdated();
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar etapa');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (isReadOnly) {
      triggerBlockedAction('Guardar o modificar notas del expediente');
      return;
    }
    setSavingNotes(true);
    try {
      await updateAdmissionApplication(application.id, { internalNotes });
      toast.success('Notas actualizadas');
      onUpdated();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar notas');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc = {
      id: `doc_${Date.now()}`,
      name: newDocName.trim(),
      file_url: newDocUrl.trim() || undefined,
      status: 'APPROVED' as const,
      uploaded_at: new Date().toISOString(),
      notes: 'Registrado manualmente por administración'
    };

    const nextDocs = [...submittedDocs, newDoc];
    setSubmittedDocs(nextDocs);
    setLoading(true);
    try {
      await updateAdmissionApplication(application.id, {
        submittedDocuments: nextDocs
      });
      toast.success(`Documento "${newDocName}" registrado`);
      setNewDocName('');
      setNewDocUrl('');
      onUpdated();
    } catch (e: any) {
      setSubmittedDocs(application.submitted_documents || []);
      toast.error(e.message || 'Error al agregar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDocStatus = async (docId: string, newStatus: 'APPROVED' | 'PENDING' | 'REJECTED') => {
    const nextDocs = submittedDocs.map(d => d.id === docId ? { ...d, status: newStatus } : d);
    setSubmittedDocs(nextDocs);
    if (selectedDocForViewing?.id === docId) {
      setSelectedDocForViewing((prev: any) => prev ? { ...prev, status: newStatus } : null);
    }

    setLoading(true);
    try {
      await updateAdmissionApplication(application.id, {
        submittedDocuments: nextDocs
      });
      toast.success('Estado del documento actualizado');
      onUpdated();
    } catch (e: any) {
      setSubmittedDocs(application.submitted_documents || []);
      toast.error(e.message || 'Error al actualizar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const nextDocs = submittedDocs.filter(d => d.id !== docId);
    setSubmittedDocs(nextDocs);
    if (selectedDocForViewing?.id === docId) {
      setSelectedDocForViewing(null);
    }

    setLoading(true);
    try {
      await updateAdmissionApplication(application.id, {
        submittedDocuments: nextDocs
      });
      toast.success('Documento eliminado');
      onUpdated();
    } catch (e: any) {
      setSubmittedDocs(application.submitted_documents || []);
      toast.error(e.message || 'Error al eliminar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollEnvId) {
      toast.error('Selecciona el salón/ambiente de destino');
      return;
    }

    setLoading(true);
    try {
      await enrollAdmissionApplication(application.id, {
        environmentId: enrollEnvId,
        enrollmentCode: enrollCode.trim(),
        enrollmentDate: enrollDate,
        grade: enrollGrade.trim(),
        bloodType: enrollBloodType,
        allergies: enrollAllergies.trim(),
        medicalNotes: enrollMedicalNotes.trim(),
        internalNotes: internalNotes.trim()
      });
      toast.success(`¡${application.child_name} ha sido admitido(a) y matriculado(a) oficialmente!`);
      onUpdated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error al formalizar matrícula');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async () => {
    const ok = await confirm({
      title: '¿Eliminar expediente de admisión?',
      description: `¿Estás seguro de eliminar el expediente de admisión de ${application.child_name}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar expediente',
      variant: 'danger'
    });
    if (!ok) return;

    setLoading(true);
    try {
      await deleteAdmissionApplication(application.id);
      toast.success('Expediente de admisión eliminado');
      onUpdated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar expediente');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWaitlist = async () => {
    const ok = await confirm({
      title: '¿Pausar y Regresar a Lista de Espera?',
      description: `¿Deseas pausar el proceso de admisión de ${application.child_name} y regresarlo a la lista de espera? Toda la información recopilada (documentos, notas, cuestionarios) se conservará intacta para cuando la familia decida retomar el ingreso.`,
      confirmText: 'Sí, regresar a lista de espera',
      variant: 'default'
    });
    if (!ok) return;

    setLoading(true);
    try {
      await returnApplicationToWaitlist(application.id, {
        notes: 'Pospuesto por solicitud familiar / cambio de ciclo escolar'
      });
      toast.success(`${application.child_name} regresó a la lista de espera (datos conservados)`);
      onUpdated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error al regresar a lista de espera');
    } finally {
      setLoading(false);
    }
  };

  // Required documents for current stage
  const requiredDocs = currentStage?.required_documents || [];

  return (
    <>
      <SlideOverDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <span>Expediente de Admisión</span>
            {application.status === 'ENROLLED' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Matriculado Oficial
              </span>
            )}
            {application.status === 'REJECTED' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                Declinado / No admitido
              </span>
            )}
          </div>
        }
        description={`Seguimiento, trazabilidad y requisitos para el ingreso de ${application.child_name}`}
        icon={<Workflow className="w-5 h-5 text-forest" />}
        maxWidthClass="max-w-2xl lg:max-w-3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteApplication}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
                title="Eliminar expediente"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>

              {application.status !== 'ENROLLED' && (
                <button
                  type="button"
                  onClick={handleReturnToWaitlist}
                  className="px-3 py-2 text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Pospone el proceso y regresa el aspirante a la lista de espera conservando todos sus datos"
                >
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className="hidden sm:inline">Regresar a Lista de Espera</span>
                  <span className="sm:hidden">A Lista de Espera</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-xl transition-colors"
              >
                Cerrar
              </button>

              {application.status !== 'ENROLLED' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('enroll')}
                  className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-102 active:scale-98"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Formalizar Matrícula</span>
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6 pb-6 text-xs text-foreground">

          {/* 1. HERO APPLICANT CARD */}
          <div className="bg-forest/5 rounded-3xl p-5 border border-forest/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  <Baby className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-forest leading-tight font-display">
                    {application.child_name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground mt-0.5 flex-wrap">
                    {application.birth_date && (
                      <span>Edad: <strong>{calculateAge(application.birth_date)}</strong></span>
                    )}
                    {application.birth_date && <span>•</span>}
                    <span>Solicitud: {new Date(application.created_at).toLocaleDateString()}</span>
                    {application.target_environment && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-forest">
                          Ambiente: {application.target_environment.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Stage Badge - Compact */}
              {currentStage && (
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                  <span
                    className="px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-2xs text-white"
                    style={{ backgroundColor: currentStage.color || '#1b3b2b' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    <span>{currentStage.name}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Quick Contact Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-forest/10 text-muted-foreground">
              <div className="flex items-center gap-1.5 truncate">
                <Users className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                <span className="font-semibold text-forest">{application.tutor_name}</span>
                <span className="text-[10px]">({application.tutor_relationship === 'MOTHER' ? 'Madre' : application.tutor_relationship === 'FATHER' ? 'Padre' : 'Tutor'})</span>
              </div>

              {application.tutor_phone && (
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                  <a
                    href={`https://wa.me/${application.tutor_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-forest font-semibold hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>{application.tutor_phone}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                </div>
              )}

              {application.tutor_email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-forest/70 shrink-0" />
                  <a href={`mailto:${application.tutor_email}`} className="hover:underline text-forest truncate">
                    {application.tutor_email}
                  </a>
                </div>
              )}
            </div>

            {/* Expediente Portal & Dossier Action Bar */}
            <div className="pt-3 border-t border-forest/10 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="px-3.5 py-1.5 bg-white border border-forest/20 text-forest hover:bg-forest/5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer hover:border-forest/40"
                title="Compartir enlace de acceso al portal de admisión (WhatsApp, Correo o Copiar Enlace)"
              >
                <Share2 className="w-3.5 h-3.5 text-forest" />
              </button>

              <button
                type="button"
                onClick={() => setDossierModalOpen(true)}
                className="px-3.5 py-1.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-300" />
                <span>Ver Expediente Completo</span>
              </button>
            </div>
          </div>

          {/* 2. NAVIGATION SUB-TABS */}
          <div className="flex items-center gap-1.5 border-b border-forest/10 pb-2.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${activeTab === 'pipeline'
                ? 'bg-forest text-white shadow-xs'
                : 'text-muted-foreground hover:text-forest hover:bg-forest/5'
                }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>1. Pipeline & Fases</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${activeTab === 'documents'
                ? 'bg-forest text-white shadow-xs'
                : 'text-muted-foreground hover:text-forest hover:bg-forest/5'
                }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>2. Documentación ({submittedDocs.length}/{requiredDocs.length || submittedDocs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${activeTab === 'info'
                ? 'bg-forest text-white shadow-xs'
                : 'text-muted-foreground hover:text-forest hover:bg-forest/5'
                }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>3. Datos & Familia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${activeTab === 'history'
                ? 'bg-forest text-white shadow-xs'
                : 'text-muted-foreground hover:text-forest hover:bg-forest/5'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>4. Trazabilidad ({application.history?.length || 1})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('enroll')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${activeTab === 'enroll'
                ? 'bg-forest text-white shadow-xs'
                : 'text-muted-foreground hover:text-forest hover:bg-forest/5'
                }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>5. Matrícula Oficial</span>
            </button>
          </div>

          {/* TAB 1: PIPELINE & PROGRESSION */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Stage Progression Stepper */}
              <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-forest/70" />
                    <span>Flujo de Admisión & Estado Actual</span>
                  </h4>

                  {nextStage && (
                    <button
                      type="button"
                      onClick={handleAdvanceToNext}
                      disabled={loading}
                      className="px-4 py-2 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs hover:scale-102 active:scale-98"
                    >
                      <span>Avanzar a: {nextStage.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Interactive Stages Pipeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {stages.map((stg, idx) => {
                    const isCurrent = stg.id === application.stage_id;
                    const isPast = idx < currentStageIndex;

                    return (
                      <button
                        key={stg.id}
                        type="button"
                        onClick={() => handleCustomMoveStage(stg.id)}
                        disabled={loading || isCurrent}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 relative overflow-hidden group ${isCurrent
                          ? 'border-forest bg-forest/5 shadow-xs ring-1 ring-forest'
                          : isPast
                            ? 'border-forest/15 bg-white hover:border-forest/40'
                            : 'border-forest/10 bg-white/60 hover:bg-white hover:border-forest/30 opacity-75'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: stg.color || '#1b3b2b' }}
                            />
                            <span className="font-bold text-xs text-forest truncate">
                              {stg.name}
                            </span>
                          </div>

                          {isCurrent ? (
                            <span className="px-2 py-0.5 bg-forest text-white font-bold text-[9px] rounded-md shrink-0">
                              Activo
                            </span>
                          ) : isPast ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[3]" />
                          ) : null}
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {stg.description || 'Sin descripción de etapa.'}
                        </p>

                        {stg.required_documents?.length > 0 && (
                          <div className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-amber-600" />
                            <span>{stg.required_documents.length} doc{stg.required_documents.length > 1 ? 's' : ''} requeridos</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stage Transition Note Card */}
              <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-3">
                <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-forest/70" />
                  <span>Mover a Etapa Específica & Bitácora</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-forest font-semibold mb-1">
                      Seleccionar Etapa de Destino
                    </label>
                    <select
                      value={selectedTargetStageId}
                      onChange={(e) => setSelectedTargetStageId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                    >
                      {stages.map(stg => (
                        <option key={stg.id} value={stg.id}>
                          {stg.name} {stg.id === application.stage_id ? '(Etapa Actual)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-forest font-semibold mb-1">
                      Nota o Motivo del Cambio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Familia asistió a la entrevista y entregó comprobante..."
                      value={transitionNotes}
                      onChange={(e) => setTransitionNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleCustomMoveStage(selectedTargetStageId, transitionNotes)}
                    disabled={loading || selectedTargetStageId === application.stage_id}
                    className="px-5 py-2 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Aplicar Cambio de Etapa</span>
                  </button>
                </div>
              </div>

              {/* Internal Notes & Evaluation */}
              <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-forest/70" />
                    <span>Observaciones Internas del Equipo / Dirección</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3.5 py-1.5 bg-forest/10 hover:bg-forest/20 text-forest font-bold rounded-xl transition-colors flex items-center gap-1 text-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingNotes ? 'Guardando...' : 'Guardar Notas'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Escribe anotaciones pedagógicas, acuerdos verbales, compromisos de la familia o impresiones del Guía..."
                  className="w-full p-3 rounded-2xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Required Documents Checklist for Current Stage */}
              {requiredDocs.length > 0 && (
                <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span>Requisitos Documentales de la Etapa Actual ({currentStage?.name})</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Para que el aspirante continúe con éxito en el proceso, la escuela debe validar la recepción de:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {requiredDocs.map((docName, idx) => {
                      const submitted = submittedDocs.find(d => d.name.toLowerCase() === docName.toLowerCase());
                      const isApproved = submitted?.status === 'APPROVED';

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${isApproved
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-white border-amber-200 text-amber-950'
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isApproved ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span className="font-bold text-xs truncate">{docName}</span>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {isApproved ? 'Entregado' : 'Pendiente'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Admission Form Submissions */}
              <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-forest/70" />
                    <span>Formularios y Cuestionarios Completados ({application.form_submissions?.length || 0})</span>
                  </h4>
                </div>

                {(!application.form_submissions || application.form_submissions.length === 0) ? (
                  <div className="py-6 text-center text-xs text-muted-foreground bg-stone-50/60 rounded-2xl border border-dashed border-forest/10">
                    Aún no se han completado formularios en este expediente.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {application.form_submissions.map((sub, sIdx) => {
                      const answeredCount = Object.keys(sub.data || {}).length;
                      const filesCount = (sub.files || []).length;
                      const hasSignature = !!sub.signature;

                      return (
                        <div
                          key={sub.id || sIdx}
                          onClick={() => setSelectedSubmissionForViewing(sub)}
                          className="p-4 rounded-2xl bg-white border border-forest/15 shadow-2xs hover:border-forest/40 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 truncate">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:scale-105 transition-transform">
                              <FileCheck2 className="w-5 h-5" />
                            </div>
                            <div className="truncate space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-forest text-xs sm:text-sm truncate group-hover:text-forest-light transition-colors">
                                  {sub.title || 'Formulario de Admisión'}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                  {sub.status === 'APPROVED' ? 'Aprobado' : 'Completado'}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                Completado por: <strong className="text-forest font-semibold">{sub.filledByName || 'Familiar / Tutor'}</strong> • {new Date(sub.submittedAt || Date.now()).toLocaleDateString()} a las {new Date(sub.submittedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono bg-forest/5 px-2.5 py-1 rounded-lg">
                              <span>{answeredCount} campos</span>
                              {filesCount > 0 && <span>• {filesCount} adjuntos</span>}
                              {hasSignature && <span>• Firmado</span>}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubmissionForViewing(sub);
                              }}
                              className="px-3.5 py-1.5 bg-forest/10 hover:bg-forest hover:text-white text-forest text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Respuestas</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submitted Documents List */}
              <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-forest/70" />
                    <span>Expediente Documental del Alumno</span>
                  </h4>
                </div>

                {submittedDocs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Aún no se han registrado documentos en el expediente de este aspirante.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submittedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-2xl bg-white border border-forest/15 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-forest/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${doc.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-forest text-xs truncate">{doc.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${doc.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : doc.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                {doc.status === 'APPROVED' ? 'Aprobado' : doc.status === 'REJECTED' ? 'Rechazado' : 'En Revisión'}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              Subido: {new Date(doc.uploaded_at || Date.now()).toLocaleDateString()} {doc.notes ? `• ${doc.notes}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Botón VER que abre en el Visor para inspeccionar y cambiar el estado */}
                          <button
                            type="button"
                            onClick={() => setSelectedDocForViewing(doc)}
                            className="px-3.5 py-1.5 bg-forest/10 hover:bg-forest hover:text-white text-forest text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            title="Abrir visor para inspeccionar y dictaminar documento"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>VER</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar documento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Add Document Form */}
              <div className="bg-forest/5 p-5 rounded-3xl border border-forest/10 space-y-3">
                <h4 className="font-bold text-forest text-xs flex items-center gap-2">
                  <Upload className="w-4 h-4 text-forest/70" />
                  <span>Registrar / Adjuntar Nuevo Documento</span>
                </h4>

                <form onSubmit={handleAddDocument} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-forest font-semibold mb-1 text-[11px]">
                      Nombre del Documento *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Acta de Nacimiento Original"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-forest font-semibold mb-1 text-[11px]">
                      Enlace / URL de Almacenamiento (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !newDocName.trim()}
                      className="px-5 py-2 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>Agregar al Expediente</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: INFO & FAMILIA */}
          {activeTab === 'info' && application && (
            <div className="space-y-6 animate-in fade-in">
              {isStaff ? (
                /* Staff Info Card */
                <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-4">
                  <h4 className="font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-2">
                    <Users className="w-4 h-4 text-forest/70" />
                    <span>Información del Colaborador / Personal Docente</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Nombre Completo</span>
                      <span className="font-bold text-forest">{application.child_name}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">Puesto / Cargo de Interés</span>
                      <span className="font-bold text-forest">{application.previous_school || 'No especificado'}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">Correo Electrónico</span>
                      <span className="font-bold text-forest">{application.tutor_email || 'No registrado'}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">Teléfono / WhatsApp</span>
                      <span className="font-bold text-forest">{application.tutor_phone || 'No registrado'}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">Fecha de Nacimiento</span>
                      <span className="font-bold text-forest">
                        {application.birth_date ? new Date(application.birth_date).toLocaleDateString() : 'No especificada'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">Género</span>
                      <span className="font-bold text-forest">
                        {application.gender === 'FEMALE' ? 'Femenino' : application.gender === 'MALE' ? 'Masculino' : 'No especificado'}
                      </span>
                    </div>

                    {application.address && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-[11px]">Dirección Residencial</span>
                        <span className="font-bold text-forest">{application.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Datos Fiscales y de Identificación */}
                  <div className="mt-4 pt-4 border-t border-forest/10 space-y-3">
                    <h5 className="font-bold text-forest text-[11px] uppercase tracking-wider">
                      Datos de Identificación y Fiscalidad
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">{getCountryIdLabels(schoolCountry).fiscalLabel}</span>
                        <span className="font-bold text-forest font-mono">
                          {application.custom_form_responses?.rfc || 'No proporcionado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">{getCountryIdLabels(schoolCountry).personalLabel}</span>
                        <span className="font-bold text-forest font-mono">
                          {application.custom_form_responses?.curp || 'No proporcionado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Child Info Card */}
                  <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-3">
                    <h4 className="font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-2">
                      <Baby className="w-4 h-4 text-forest/70" />
                      <span>Información del Aspirante</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Nombre Completo</span>
                        <span className="font-bold text-forest">{application.child_name}</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Fecha de Nacimiento</span>
                        <span className="font-bold text-forest">
                          {application.birth_date ? new Date(application.birth_date).toLocaleDateString() : 'No especificada'}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Escuela Anterior</span>
                        <span className="font-bold text-forest">{application.previous_school || 'Sin escuela previa'}</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Metodología Pedagógica de Origen</span>
                        <span className="font-bold text-forest">{application.previous_methodology || 'No especificada'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tutors Info Card */}
                  <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-3">
                    <h4 className="font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-2">
                      <Users className="w-4 h-4 text-forest/70" />
                      <span>Padres & Tutores de Contacto</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Tutor Principal</span>
                        <span className="font-bold text-forest">{application.tutor_name}</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Parentesco</span>
                        <span className="font-bold text-forest">
                          {application.tutor_relationship === 'MOTHER' ? 'Madre' : application.tutor_relationship === 'FATHER' ? 'Padre' : 'Tutor / Guardian'}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Teléfono Principal</span>
                        <span className="font-bold text-forest">{application.tutor_phone || 'No registrado'}</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Correo Electrónico</span>
                        <span className="font-bold text-forest">{application.tutor_email || 'No registrado'}</span>
                      </div>

                      {application.secondary_tutor_name && (
                        <>
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Tutor Secundario</span>
                            <span className="font-bold text-forest">{application.secondary_tutor_name}</span>
                          </div>

                          <div>
                            <span className="text-muted-foreground block text-[11px]">Teléfono Secundario</span>
                            <span className="font-bold text-forest">{application.secondary_tutor_phone || 'No registrado'}</span>
                          </div>
                        </>
                      )}

                      {application.address && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground block text-[11px]">Dirección Familiar</span>
                          <span className="font-bold text-forest">{application.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY & TRACEABILITY */}
          {activeTab === 'history' && (
            <div className="bg-white p-5 rounded-3xl border border-forest/10 shadow-2xs space-y-4 animate-in fade-in">
              <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-forest/70" />
                <span>Bitácora de Trazabilidad del Proceso</span>
              </h4>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-forest/15">
                {(application.history || []).map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3 pl-1 relative">
                    <div className="w-5 h-5 rounded-full bg-forest text-white flex items-center justify-center shrink-0 shadow-2xs z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <div className="bg-forest/5 p-3.5 rounded-2xl border border-forest/10 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-forest text-xs">
                          {entry.toStageName || 'Cambio de etapa'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {entry.notes || 'Transición efectuada'}
                      </p>
                      <div className="text-[10px] text-forest/70 font-semibold pt-0.5">
                        Responsable: {entry.actor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ENROLLMENT FORM */}
          {activeTab === 'enroll' && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-forest/10 shadow-2xs space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2.5 border-b border-forest/10 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-forest text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-forest text-sm">Formalizar Admisión en Matrícula Activa</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Al completar este paso, el infante pasará automáticamente al listado oficial de alumnos activos y se creará el usuario tutor para su portal familiar.
                  </p>
                </div>
              </div>

              <form onSubmit={handleEnrollChild} className="space-y-4">
                <div>
                  <label className="block text-forest font-bold mb-1.5">
                    Salón / Ambiente Montessori Asignado *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {environments.map((env) => {
                      const isSelected = enrollEnvId === env.id;
                      return (
                        <button
                          type="button"
                          key={env.id}
                          onClick={() => setEnrollEnvId(env.id)}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${isSelected
                            ? 'bg-forest/10 border-forest text-forest font-bold ring-1 ring-forest'
                            : 'bg-white border-forest/15 hover:border-forest/30 text-muted-foreground'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: env.color || '#1b3b2b' }} />
                            <span className="truncate text-xs">{env.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-forest shrink-0 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-forest font-semibold mb-1">
                      Código de Matrícula *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollCode}
                      onChange={(e) => setEnrollCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono font-bold shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-forest font-semibold mb-1">
                      Fecha de Ingreso Oficial
                    </label>
                    <input
                      type="date"
                      value={enrollDate}
                      onChange={(e) => setEnrollDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-forest font-semibold mb-1">
                      Grado / Nivel
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Casa de Niños 1"
                      value={enrollGrade}
                      onChange={(e) => setEnrollGrade(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-forest font-semibold mb-1">
                      Tipo de Sangre
                    </label>
                    <select
                      value={enrollBloodType}
                      onChange={(e) => setEnrollBloodType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                    >
                      <option value="No especificado">No especificado</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-forest font-semibold mb-1">
                      Alergias o Condiciones Médicas
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Alergia a nueces o asma leve..."
                      value={enrollAllergies}
                      onChange={(e) => setEnrollAllergies(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-forest/10">
                  <button
                    type="submit"
                    disabled={loading || !enrollEnvId}
                    className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs hover:scale-102 active:scale-98 disabled:opacity-50"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{loading ? 'Formalizando...' : 'Confirmar Matrícula Activa Oficial'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {dossierModalOpen && application && (
          <AdmissionDossierModal
            isOpen={dossierModalOpen}
            onClose={() => setDossierModalOpen(false)}
            applicationId={application.id}
          />
        )}

        {/* ========================================================================= */}
        {/* DRAWER REUTILIZABLE DE RESPUESTAS DEL FORMULARIO                          */}
        {/* ========================================================================= */}
        {selectedSubmissionForViewing && (
          <AdmissionFormResponseDrawer
            isOpen={!!selectedSubmissionForViewing}
            onClose={() => setSelectedSubmissionForViewing(null)}
            submission={selectedSubmissionForViewing}
            titlePrefix={application.child_name}
          />
        )}

      </SlideOverDrawer>

      {/* ========================================================================= */}
      {/* VISOR DE DOCUMENTO A PANTALLA COMPLETA (PORTAL EN DOCUMENT.BODY)          */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' && selectedDocForViewing && createPortal(
        <div className="fixed inset-0 z-[9999999] w-screen h-screen bg-black/85 backdrop-blur-md flex flex-col p-2 sm:p-6 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white w-full h-full max-w-7xl mx-auto rounded-3xl border border-forest/20 shadow-2xl overflow-hidden flex flex-col">
            {/* Top Fullscreen Header */}
            <div className="p-4 sm:p-5 bg-forest text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3.5 truncate">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm sm:text-base font-bold truncate tracking-tight">{selectedDocForViewing.name}</h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${selectedDocForViewing.status === 'APPROVED'
                        ? 'bg-emerald-500 text-white'
                        : selectedDocForViewing.status === 'REJECTED'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-400 text-amber-950'
                      }`}>
                      {selectedDocForViewing.status === 'APPROVED' ? 'Aprobado' : selectedDocForViewing.status === 'REJECTED' ? 'Rechazado' : 'En Revisión'}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 truncate mt-0.5">
                    Expediente de <strong className="text-white">{application.child_name}</strong> • Subido el {new Date(selectedDocForViewing.uploaded_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedDocForViewing.file_url && (
                  <a
                    href={selectedDocForViewing.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors flex items-center justify-center cursor-pointer"
                    title="Abrir original en pestaña nueva o descargar"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDocForViewing(null)}
                  className="p-2 bg-white/10 hover:bg-rose-600 hover:text-white rounded-xl text-white transition-colors cursor-pointer"
                  title="Cerrar visor (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Full-Height Preview Canvas */}
            <div className="flex-1 w-full bg-stone-100 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              {selectedDocForViewing.file_url ? (
                selectedDocForViewing.file_url.startsWith('data:image/') ||
                  /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(selectedDocForViewing.file_url) ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                    <img
                      src={selectedDocForViewing.file_url}
                      alt={selectedDocForViewing.name}
                      className="max-h-full max-w-full object-contain rounded-2xl shadow-xl bg-white p-2"
                    />
                  </div>
                ) : (
                  <iframe
                    src={selectedDocForViewing.file_url}
                    title={selectedDocForViewing.name}
                    className="w-full h-full rounded-2xl border border-forest/10 shadow-md bg-white"
                  />
                )
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-forest/30 mx-auto" />
                  <p className="text-sm sm:text-base font-bold text-forest">No hay enlace directo o archivo descargable disponible</p>
                  {selectedDocForViewing.notes && (
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">{selectedDocForViewing.notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Status Dictamen Footer Toolbar */}
            <div className="p-4 sm:p-5 bg-white border-t border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-lg">
              <div className="text-xs text-muted-foreground">
                Dictamen administrativo para la etapa <strong className="text-forest">{currentStage?.name}</strong>:
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto shrink-0 pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => handleToggleDocStatus(selectedDocForViewing.id, 'APPROVED')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${selectedDocForViewing.status === 'APPROVED'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Aprobado</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleDocStatus(selectedDocForViewing.id, 'PENDING')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${selectedDocForViewing.status === 'PENDING'
                      ? 'bg-amber-500 text-white ring-2 ring-amber-500/30'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">En Revisión</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleDocStatus(selectedDocForViewing.id, 'REJECTED')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${selectedDocForViewing.status === 'REJECTED'
                      ? 'bg-rose-600 text-white ring-2 ring-rose-600/30'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Rechazado</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA COMPARTIR PORTAL DE ADMISIÓN (WHATSAPP, CORREO, COPIAR LINK)   */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' && shareModalOpen && application && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-forest/20 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-forest text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0 shadow-2xs">
                  <Share2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display leading-tight">Compartir Portal de Admisión</h3>
                  <p className="text-xs text-white/75 truncate mt-0.5">
                    Expediente de <strong className="text-white">{application.child_name}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs for Share Channels */}
            <div className="p-2 bg-stone-100 border-b border-forest/10 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShareTab('whatsapp')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${shareTab === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-forest hover:bg-white/60'
                  }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setShareTab('email')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${shareTab === 'email'
                    ? 'bg-forest text-white shadow-xs'
                    : 'text-muted-foreground hover:text-forest hover:bg-white/60'
                  }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Correo</span>
              </button>

              <button
                type="button"
                onClick={() => setShareTab('link')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${shareTab === 'link'
                    ? 'bg-forest text-white shadow-xs'
                    : 'text-muted-foreground hover:text-forest hover:bg-white/60'
                  }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Enlace</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-5 space-y-4">
              {/* WHATSAPP TAB */}
              {shareTab === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-forest block">
                      Número de WhatsApp del Tutor:
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        value={shareWhatsappPhone}
                        onChange={(e) => setShareWhatsappPhone(e.target.value)}
                        placeholder="Ej. +52 999 123 4567"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-forest/20 rounded-xl text-xs font-medium text-forest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Prellenado con el teléfono registrado del tutor principal. Puedes editarlo si deseas enviarlo a otro contacto.
                    </p>
                  </div>

                  {/* Message preview */}
                  <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 space-y-1.5 text-xs text-emerald-950">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Vista previa del mensaje:
                    </span>
                    <p className="leading-relaxed text-[11px] bg-white p-3 rounded-xl border border-emerald-100 text-stone-700">
                      Hola <strong>{shareEmailName || application.tutor_name}</strong>, te compartimos el enlace para ingresar al portal del proceso de admisión de <strong>{application.child_name}</strong> en Ceiba Roots:
                      <span className="block text-emerald-700 font-mono text-[10px] mt-1.5 break-all">
                        {`${window.location.origin}/admision/${application.portal_token || application.id}`}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const cleanPhone = shareWhatsappPhone.replace(/\D/g, '');
                      if (!cleanPhone) {
                        toast.error('Ingresa un número de teléfono válido');
                        return;
                      }
                      const portalUrl = `${window.location.origin}/admision/${application.portal_token || application.id}`;
                      const message = `Hola ${shareEmailName || application.tutor_name}, te compartimos el enlace para ingresar al portal del proceso de admisión de ${application.child_name} en Ceiba Roots:\n\n${portalUrl}`;
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                      toast.success('Abriendo WhatsApp...');
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-101 active:scale-99"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar por WhatsApp</span>
                  </button>
                </div>
              )}

              {/* EMAIL TAB */}
              {shareTab === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-forest block">
                      Nombre del Destinatario:
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={shareEmailName}
                        onChange={(e) => setShareEmailName(e.target.value)}
                        placeholder="Nombre del familiar o tutor"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-forest/20 rounded-xl text-xs font-medium text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-forest block">
                      Correo Electrónico:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={shareEmailTo}
                        onChange={(e) => setShareEmailTo(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-forest/20 rounded-xl text-xs font-medium text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Prellenado con los datos del tutor principal del expediente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!shareEmailTo) {
                        toast.error('Ingresa un correo electrónico válido');
                        return;
                      }
                      const portalUrl = `${window.location.origin}/admision/${application.portal_token || application.id}`;
                      const subject = `Portal de Admisión - ${application.child_name}`;
                      const body = `Hola ${shareEmailName || application.tutor_name},\n\nTe compartimos el enlace para acceder al portal oficial del proceso de admisión de ${application.child_name} en Ceiba Roots:\n\n${portalUrl}\n\nQuedamos a tu entera disposición ante cualquier duda o consulta.\n\nSaludos cordiales,\nEquipo de Admisiones - Ceiba Roots`;
                      window.location.href = `mailto:${shareEmailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      toast.success('Abriendo cliente de correo...');
                    }}
                    className="w-full py-3 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-101 active:scale-99"
                  >
                    <Mail className="w-4 h-4 text-emerald-300" />
                    <span>Enviar Invitación por Correo</span>
                  </button>
                </div>
              )}

              {/* LINK TAB */}
              {shareTab === 'link' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-forest block">
                      Enlace de Acceso al Portal:
                    </label>
                    <div className="p-3 bg-stone-50 border border-forest/20 rounded-2xl flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-forest truncate">
                        {`${window.location.origin}/admision/${application.portal_token || application.id}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const portalUrl = `${window.location.origin}/admision/${application.portal_token || application.id}`;
                          navigator.clipboard.writeText(portalUrl);
                          toast.success('¡Enlace copiado al portapapeles!');
                        }}
                        className="px-3 py-1.5 bg-white border border-forest/20 hover:bg-forest/5 text-forest text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`/admision/${application.portal_token || application.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-forest/5 hover:bg-forest/10 text-forest rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-forest/10 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir Portal en Pestaña Nueva</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
