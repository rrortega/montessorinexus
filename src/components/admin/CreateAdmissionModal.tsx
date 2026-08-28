import React, { useState } from 'react';
import { 
  Baby, 
  Users, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Layers, 
  Save, 
  Sparkles, 
  Workflow 
} from 'lucide-react';
import { 
  AdmissionStageItem, 
  EnvironmentItem, 
  createAdmissionApplication 
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { useAdminDashboard } from '@/pages/admin/AdminDashboard';
import { toast } from 'sonner';
import { useSiteSettings } from '@/context/SettingsContext';

interface CreateAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: AdmissionStageItem[];
  environments: EnvironmentItem[];
  onCreated: () => void;
  processId?: string;
  processName?: string;
  targetType?: string;
}

export interface CountryIdLabels {
  personalLabel: string;
  personalPlaceholder: string;
  fiscalLabel: string;
  fiscalPlaceholder: string;
}

export const getCountryIdLabels = (country: string): CountryIdLabels => {
  const norm = country?.trim().toLowerCase();
  if (norm === 'méxico' || norm === 'mexico') {
    return {
      personalLabel: 'CURP',
      personalPlaceholder: 'Ej. VECJ880326HDFGRS09',
      fiscalLabel: 'RFC',
      fiscalPlaceholder: 'Ej. VECJ880326XXX'
    };
  }
  if (norm === 'colombia') {
    return {
      personalLabel: 'Cédula de Ciudadanía (CC)',
      personalPlaceholder: 'Ej. 1018459321',
      fiscalLabel: 'NIT / RUT',
      fiscalPlaceholder: 'Ej. 900.123.456-7'
    };
  }
  if (norm === 'españa' || norm === 'espana') {
    return {
      personalLabel: 'DNI / NIE',
      personalPlaceholder: 'Ej. 12345678Z',
      fiscalLabel: 'NIF',
      fiscalPlaceholder: 'Ej. B12345678'
    };
  }
  if (norm === 'estados unidos' || norm === 'united states' || norm === 'us' || norm === 'usa') {
    return {
      personalLabel: 'SSN (Social Security Number)',
      personalPlaceholder: 'Ej. 000-00-0000',
      fiscalLabel: 'EIN / TIN',
      fiscalPlaceholder: 'Ej. 12-3456789'
    };
  }
  return {
    personalLabel: 'Número de Identificación Personal',
    personalPlaceholder: 'Ej. Pasaporte, Cédula o ID Oficial',
    fiscalLabel: 'Número de Identificación Fiscal',
    fiscalPlaceholder: 'Ej. Código fiscal local'
  };
};

export const CreateAdmissionModal: React.FC<CreateAdmissionModalProps> = ({
  isOpen,
  onClose,
  stages,
  environments,
  onCreated,
  processId,
  processName,
  targetType
}) => {
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
  const { schoolCountry } = useSiteSettings();
  const isStaff = targetType === 'STAFF';
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('NOT_SPECIFIED');
  const [stageId, setStageId] = useState('');
  const [targetEnvironmentId, setTargetEnvironmentId] = useState('');
  const [preferredStartDate, setPreferredStartDate] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [previousMethodology, setPreviousMethodology] = useState('');

  // Tutor states
  const [tutorName, setTutorName] = useState('');
  const [tutorRelationship, setTutorRelationship] = useState('MOTHER');
  const [tutorPhone, setTutorPhone] = useState('');
  const [tutorEmail, setTutorEmail] = useState('');
  const [secondaryTutorName, setSecondaryTutorName] = useState('');
  const [secondaryTutorPhone, setSecondaryTutorPhone] = useState('');
  const [address, setAddress] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Fiscal & Identification states
  const [rfc, setRfc] = useState('');
  const [curp, setCurp] = useState('');

  // Initialize initial stage
  React.useEffect(() => {
    if (isOpen) {
      const initial = stages.find(s => s.is_initial) || stages[0];
      setStageId(initial?.id || '');
      setTargetEnvironmentId(environments[0]?.id || '');
      setChildFirstName('');
      setChildLastName('');
      setBirthDate('');
      setGender('NOT_SPECIFIED');
      setPreferredStartDate('');
      setPreviousSchool('');
      setPreviousMethodology('');
      setTutorName('');
      setTutorRelationship('MOTHER');
      setTutorPhone('');
      setTutorEmail('');
      setSecondaryTutorName('');
      setSecondaryTutorPhone('');
      setAddress('');
      setInternalNotes('');
      setRfc('');
      setCurp('');
    }
  }, [isOpen, stages, environments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerBlockedAction('Registrar e iniciar un nuevo proceso o admisión');
      return;
    }

    const fullName = `${childFirstName} ${childLastName}`.trim();
    if (!childFirstName.trim() || !childLastName.trim()) {
      toast.error(isStaff ? 'El nombre y apellido son obligatorios' : 'El nombre del aspirante es obligatorio');
      return;
    }

    if (isStaff) {
      if (!tutorPhone.trim()) {
        toast.error('El teléfono del colaborador es obligatorio');
        return;
      }
      if (!tutorEmail.trim()) {
        toast.error('El correo electrónico del colaborador es obligatorio');
        return;
      }
    } else {
      if (!tutorName.trim()) {
        toast.error('El nombre del tutor es obligatorio');
        return;
      }
    }

    setSubmitting(true);
    try {
      const finalTutorName = isStaff ? fullName : tutorName.trim();
      const finalRelationship = isStaff ? 'STAFF' : tutorRelationship;

      await createAdmissionApplication({
        stageId: stageId || undefined,
        childFirstName: childFirstName.trim(),
        childLastName: childLastName.trim(),
        childName: fullName,
        birthDate: birthDate || null,
        gender,
        targetEnvironmentId: targetEnvironmentId || null,
        targetEnvironmentIds: targetEnvironmentId ? [targetEnvironmentId] : [],
        preferredStartDate: preferredStartDate || null,
        previousSchool: previousSchool.trim(),
        previousMethodology: previousMethodology.trim(),
        tutorName: finalTutorName,
        tutorEmail: tutorEmail.trim().toLowerCase(),
        tutorPhone: tutorPhone.trim(),
        tutorRelationship: finalRelationship,
        secondaryTutorName: isStaff ? '' : secondaryTutorName.trim(),
        secondaryTutorPhone: isStaff ? '' : secondaryTutorPhone.trim(),
        address: address.trim(),
        internalNotes: internalNotes.trim(),
        processId,
        customFormResponses: isStaff ? {
          rfc: rfc.trim().toUpperCase(),
          curp: curp.trim().toUpperCase()
        } : undefined
      });

      toast.success(isStaff 
        ? `¡Colaborador ${fullName} registrado en el proceso de ${processName || 'selección'}!`
        : `¡Expediente de ${fullName} creado en el proceso de admisión!`
      );
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || (isStaff ? 'Error al registrar colaborador' : 'Error al registrar aspirante'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isStaff ? `Iniciar ${processName || 'Proceso'}` : "Nuevo Aspirante / Prospecto de Admisión"}
      description={isStaff ? "Registra los datos iniciales del colaborador/docente para incorporarlo al pipeline del proceso." : "Registra los datos iniciales del niño y tutor para incorporarlo al pipeline del proceso."}
      icon={<Workflow className="w-5 h-5 text-forest" />}
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
            form="create-admission-form"
            disabled={submitting}
            className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-102 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Registrando...' : (isStaff ? 'Iniciar Proceso' : 'Ingresar al Pipeline')}</span>
          </button>
        </div>
      }
    >
      <form id="create-admission-form" onSubmit={handleSubmit} className="space-y-6 pb-6 text-xs text-foreground">

        {/* Etapa inicial */}
        <div className="bg-forest/5 p-4 rounded-2xl border border-forest/10 space-y-2">
          <label className="block text-forest font-bold">
            Etapa de Entrada en el Proceso *
          </label>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-semibold"
          >
            {stages.map(stg => (
              <option key={stg.id} value={stg.id}>
                {stg.name} {stg.is_initial ? '(Inicial recomendada)' : ''}
              </option>
            ))}
          </select>
        </div>

        {isStaff ? (
          /* Datos del Colaborador / Docente */
          <div className="bg-white p-5 rounded-2xl border border-forest/10 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
              <Users className="w-4 h-4 text-forest/70" />
              <span className="text-sm">Datos del Colaborador / Personal Docente</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-forest font-semibold mb-1">
                  Nombre(s) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ana María"
                  value={childFirstName}
                  onChange={(e) => setChildFirstName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-forest font-semibold mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Martínez Ortega"
                  value={childLastName}
                  onChange={(e) => setChildLastName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-forest font-semibold mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-semibold text-forest"
                />
              </div>

              <div>
                <label className="block text-forest font-semibold mb-1">
                  Género
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                >
                  <option value="NOT_SPECIFIED">No especificado</option>
                  <option value="FEMALE">Femenino</option>
                  <option value="MALE">Masculino</option>
                </select>
              </div>

              <div>
                <label className="block text-forest font-semibold mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+52 998 123 4567"
                  value={tutorPhone}
                  onChange={(e) => setTutorPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium text-forest"
                />
              </div>

              <div>
                <label className="block text-forest font-semibold mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="colaborador@colegio.com"
                  value={tutorEmail}
                  onChange={(e) => setTutorEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium text-forest"
                />
              </div>

              <div>
                <label className="block text-forest font-semibold mb-1">
                  Puesto / Cargo de Interés
                </label>
                <input
                  type="text"
                  placeholder="Ej. Guía Montessori de Taller I, Administración..."
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium text-forest"
                />
              </div>

              <div>
                <label className="block text-forest font-semibold mb-1">
                  Ambiente / Salón de Destino (Opcional)
                </label>
                <select
                  value={targetEnvironmentId}
                  onChange={(e) => setTargetEnvironmentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                >
                  <option value="">-- Por definir --</option>
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.stage || 'Montessori'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-forest font-semibold mb-1">
                  Dirección Residencial
                </label>
                <input
                  type="text"
                  placeholder="Calle, Número, Colonia, Ciudad..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium text-forest"
                />
              </div>

              {isStaff && (
                <div className="sm:col-span-2 border-t border-forest/10 pt-4 mt-2 space-y-3">
                  <h4 className="font-bold text-forest text-[11px] uppercase tracking-wider">
                    Datos de Identificación y Fiscalidad
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-forest font-semibold mb-1">
                        {getCountryIdLabels(schoolCountry).fiscalLabel} (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder={getCountryIdLabels(schoolCountry).fiscalPlaceholder}
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-forest font-semibold mb-1">
                        {getCountryIdLabels(schoolCountry).personalLabel} (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder={getCountryIdLabels(schoolCountry).personalPlaceholder}
                        value={curp}
                        onChange={(e) => setCurp(e.target.value.toUpperCase())}
                        className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-forest font-semibold mb-1">
                  Notas / Observaciones de la Postulación
                </label>
                <textarea
                  rows={3}
                  placeholder="Certificaciones AMI, disponibilidad de horarios, experiencia anterior..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none resize-none font-medium text-forest"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Datos del Infante */}
            <div className="bg-white p-5 rounded-2xl border border-forest/10 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
                <Baby className="w-4 h-4 text-forest/70" />
                <span className="text-sm">Datos del Infante / Aspirante</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Nombre(s) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mateo"
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. González Solís"
                    value={childLastName}
                    onChange={(e) => setChildLastName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Género
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                  >
                    <option value="NOT_SPECIFIED">No especificado</option>
                    <option value="MALE">Niño (Masculino)</option>
                    <option value="FEMALE">Niña (Femenino)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Ambiente / Salón de Interés
                  </label>
                  <select
                    value={targetEnvironmentId}
                    onChange={(e) => setTargetEnvironmentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                  >
                    <option value="">-- Por definir según edad --</option>
                    {environments.map(env => (
                      <option key={env.id} value={env.id}>
                        {env.name} ({env.stage || 'Montessori'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Fecha Estimada de Ingreso
                  </label>
                  <input
                    type="date"
                    value={preferredStartDate}
                    onChange={(e) => setPreferredStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Escuela / Guardería Anterior
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Guardería Los Pinos o 'Ninguna'..."
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Metodología de Origen
                  </label>
                  <select
                    value={previousMethodology}
                    onChange={(e) => setPreviousMethodology(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
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
              </div>
            </div>

            {/* 2. Datos del Tutor y Familia */}
            <div className="bg-white p-5 rounded-2xl border border-forest/10 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-forest font-bold pb-2 border-b border-forest/10">
                <Users className="w-4 h-4 text-forest/70" />
                <span className="text-sm">Datos de Contacto de los Padres / Tutores</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Nombre del Tutor Principal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carmen Solís"
                    value={tutorName}
                    onChange={(e) => setTutorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Parentesco *
                  </label>
                  <select
                    value={tutorRelationship}
                    onChange={(e) => setTutorRelationship(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none font-medium"
                  >
                    <option value="MOTHER">Madre</option>
                    <option value="FATHER">Padre</option>
                    <option value="GUARDIAN">Tutor Legal / Guardian</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    placeholder="+52 998 123 4567"
                    value={tutorPhone}
                    onChange={(e) => setTutorPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="familia@ejemplo.com"
                    value={tutorEmail}
                    onChange={(e) => setTutorEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Nombre de Tutor Secundario (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Roberto González"
                    value={secondaryTutorName}
                    onChange={(e) => setSecondaryTutorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest font-semibold mb-1">
                    Teléfono Secundario
                  </label>
                  <input
                    type="tel"
                    placeholder="+52 998 765 4321"
                    value={secondaryTutorPhone}
                    onChange={(e) => setSecondaryTutorPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-forest font-semibold mb-1">
                    Dirección Residencial
                  </label>
                  <input
                    type="text"
                    placeholder="Calle, Número, Colonia, Ciudad..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-forest font-semibold mb-1">
                    Notas Iniciales del Contacto
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Cómo conocieron la escuela, necesidades específicas, horarios preferidos..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:ring-2 focus:ring-forest/20 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}

      </form>
    </SlideOverDrawer>
  );
};
