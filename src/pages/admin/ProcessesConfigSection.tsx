import React, { useState, useEffect, useRef } from 'react';
import { 
  Workflow, 
  Plus, 
  Trash2, 
  Edit3, 
  Settings, 
  Layers, 
  Kanban, 
  ClipboardList, 
  UserPlus, 
  Compass, 
  Folder, 
  Calendar,
  X,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  ChevronDown,
  Search,
  BookOpen,
  Users,
  Award,
  CheckSquare,
  FileText,
  Activity,
  Heart,
  Target,
  Shield,
  Star,
  GraduationCap,
  Building2,
  Globe,
  Sliders,
  PieChart,
  Bell,
  Clock,
  Lock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Bookmark,
  ListTodo,
  Lightbulb,
  Send,
  FileCheck2,
  UserCheck,
  Smile,
  Trophy
} from 'lucide-react';
import { 
  getProcesses, 
  createProcess, 
  updateProcess, 
  deleteProcess, 
  getAdmissionStages,
  ProcessItem 
} from '@/lib/sqlite';
import { MobileMenuButton, useAdminDashboard } from './AdminDashboard';
import { useSiteSettings, getButtonRadiusClass } from '@/context/SettingsContext';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { AdmissionStageConfigDrawer } from '@/components/admin/AdmissionStageConfigDrawer';
import { toast } from 'sonner';

const PRESET_ICONS = [
  { name: 'Workflow', icon: Workflow, label: 'Flujo / Pipeline', searchKeys: ['workflow', 'flujo', 'pipeline', 'proceso', 'pasos'] },
  { name: 'Layers', icon: Layers, label: 'Capas / Fases', searchKeys: ['layers', 'capas', 'fases', 'etapas', 'niveles'] },
  { name: 'ClipboardList', icon: ClipboardList, label: 'Lista de verificación', searchKeys: ['clipboard', 'lista', 'checklist', 'verificacion', 'tareas', 'todo'] },
  { name: 'UserPlus', icon: UserPlus, label: 'Nuevo usuario / Registro', searchKeys: ['userplus', 'usuario', 'registro', 'agregar', 'nuevo', 'alta', 'admission'] },
  { name: 'Compass', icon: Compass, label: 'Progreso / Guía', searchKeys: ['compass', 'brujula', 'guia', 'progreso', 'orientacion', 'navegacion'] },
  { name: 'Folder', icon: Folder, label: 'Archivos / Expedientes', searchKeys: ['folder', 'carpeta', 'archivo', 'documento', 'expediente', 'guardar'] },
  { name: 'Calendar', icon: Calendar, label: 'Calendario / Citas', searchKeys: ['calendar', 'calendario', 'fecha', 'evento', 'cita', 'agenda'] },
  { name: 'Settings', icon: Settings, label: 'Engrane / Configuración', searchKeys: ['settings', 'configuracion', 'ajustes', 'engrane', 'sistema'] },
  { name: 'BookOpen', icon: BookOpen, label: 'Libro / Pedagogía', searchKeys: ['bookopen', 'libro', 'lectura', 'clase', 'cursos', 'pedagogia', 'estudios'] },
  { name: 'Users', icon: Users, label: 'Usuarios / Alumnos', searchKeys: ['users', 'usuarios', 'grupo', 'personas', 'alumnos', 'equipo', 'padres'] },
  { name: 'Award', icon: Award, label: 'Premio / Logro', searchKeys: ['award', 'premio', 'reconocimiento', 'diploma', 'logro', 'merito'] },
  { name: 'CheckSquare', icon: CheckSquare, label: 'Casilla / Completar', searchKeys: ['checksquare', 'casilla', 'verificar', 'completado', 'aprobar'] },
  { name: 'FileText', icon: FileText, label: 'Texto / Formulario', searchKeys: ['filetext', 'archivo', 'texto', 'formulario', 'reporte', 'nota'] },
  { name: 'Activity', icon: Activity, label: 'Actividad / Pulso', searchKeys: ['activity', 'actividad', 'pulso', 'salud', 'rastreador', 'ritmo'] },
  { name: 'Heart', icon: Heart, label: 'Corazón / Bienestar', searchKeys: ['heart', 'corazon', 'amor', 'salud', 'cuidado', 'bienestar'] },
  { name: 'Target', icon: Target, label: 'Objetivo / Meta', searchKeys: ['target', 'meta', 'objetivo', 'blanco', 'proposito'] },
  { name: 'Shield', icon: Shield, label: 'Seguridad / Garantía', searchKeys: ['shield', 'escudo', 'seguridad', 'proteccion', 'permiso', 'garantia'] },
  { name: 'Star', icon: Star, label: 'Estrella / Favorito', searchKeys: ['star', 'estrella', 'favorito', 'destacado', 'calidad', 'calificacion'] },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Birrete / Escuela', searchKeys: ['graduationcap', 'birrete', 'graduacion', 'colegio', 'escuela', 'titulo'] },
  { name: 'Building2', icon: Building2, label: 'Edificio / Sede', searchKeys: ['building2', 'edificio', 'colegio', 'sede', 'campus', 'institucion'] },
  { name: 'Sparkles', icon: Sparkles, label: 'Destellos / IA', searchKeys: ['sparkles', 'destellos', 'magia', 'inteligencia', 'ia', 'novedad'] },
  { name: 'Globe', icon: Globe, label: 'Mundo / Internet', searchKeys: ['globe', 'globo', 'mundo', 'internet', 'idioma', 'geografia', 'web'] },
  { name: 'Sliders', icon: Sliders, label: 'Controles / Filtros', searchKeys: ['sliders', 'controles', 'filtros', 'ajustes', 'personalizacion'] },
  { name: 'PieChart', icon: PieChart, label: 'Gráfico / Métricas', searchKeys: ['piechart', 'grafico', 'pastel', 'reporte', 'estadisticas', 'metricas'] },
  { name: 'Bell', icon: Bell, label: 'Campana / Alerta', searchKeys: ['bell', 'campana', 'notificacion', 'alerta', 'aviso'] },
  { name: 'Clock', icon: Clock, label: 'Reloj / Tiempo', searchKeys: ['clock', 'reloj', 'tiempo', 'espera', 'horario', 'duracion'] },
  { name: 'Lock', icon: Lock, label: 'Candado / Acceso', searchKeys: ['lock', 'candado', 'privacidad', 'bloqueo', 'contraseña', 'seguridad'] },
  { name: 'Mail', icon: Mail, label: 'Correo / Email', searchKeys: ['mail', 'correo', 'email', 'mensaje', 'contacto'] },
  { name: 'Phone', icon: Phone, label: 'Teléfono / Llamada', searchKeys: ['phone', 'telefono', 'contacto', 'llamada', 'celular'] },
  { name: 'MapPin', icon: MapPin, label: 'Ubicación / Dirección', searchKeys: ['mappin', 'ubicacion', 'mapa', 'direccion', 'sede'] },
  { name: 'CreditCard', icon: CreditCard, label: 'Finanzas / Pagos', searchKeys: ['creditcard', 'tarjeta', 'credito', 'pago', 'finanzas', 'cobro'] },
  { name: 'Bookmark', icon: Bookmark, label: 'Marcador / Etiqueta', searchKeys: ['bookmark', 'marcador', 'guardar', 'favorito', 'etiqueta'] },
  { name: 'ListTodo', icon: ListTodo, label: 'Tareas / Pendientes', searchKeys: ['listtodo', 'lista', 'pendientes', 'tareas', 'hacer'] },
  { name: 'Lightbulb', icon: Lightbulb, label: 'Foco / Ideas', searchKeys: ['lightbulb', 'foco', 'idea', 'creatividad', 'sugerencia', 'luz'] },
  { name: 'Send', icon: Send, label: 'Enviar / Avión', searchKeys: ['send', 'enviar', 'mensaje', 'correo', 'avion'] },
  { name: 'FileCheck2', icon: FileCheck2, label: 'Aprobación / Consentimientos', searchKeys: ['filecheck2', 'archivo', 'verificado', 'consentimiento', 'aprobado'] },
  { name: 'UserCheck', icon: UserCheck, label: 'Usuario verificado', searchKeys: ['usercheck', 'usuario', 'verificado', 'asistencia', 'presente'] },
  { name: 'Smile', icon: Smile, label: 'Sonrisa / Carita', searchKeys: ['smile', 'sonrisa', 'feliz', 'satisfaccion', 'emocion'] },
  { name: 'Trophy', icon: Trophy, label: 'Trofeo / Campeón', searchKeys: ['trophy', 'trofeo', 'copa', 'ganador', 'campeon', 'exito'] },
];

function getIconComponent(iconName: string) {
  const found = PRESET_ICONS.find(item => item.name === iconName);
  return found ? found.icon : Layers;
}

export interface ProcessesConfigSectionProps {
  onProcessesUpdated?: () => void;
}

export const ProcessesConfigSection: React.FC<ProcessesConfigSectionProps> = ({
  onProcessesUpdated
}) => {
  const { isReadOnly, triggerBlockedAction } = useAdminDashboard();
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProcessItem | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [isActive, setIsActive] = useState(true);
  const [selectedSources, setSelectedSources] = useState<string[]>(['WAITLIST']);
  const [targetType, setTargetType] = useState('STUDENT');
  const [resolutionAction, setResolutionAction] = useState('NONE');
  const [submitting, setSubmitting] = useState(false);

  // Icon Selector states
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const iconDropdownRef = useRef<HTMLDivElement>(null);

  // Stages Management states
  const [stages, setStages] = useState<any[]>([]);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stageConfigDrawerOpen, setStageConfigDrawerOpen] = useState(false);
  const [selectedProcessForStages, setSelectedProcessForStages] = useState<ProcessItem | null>(null);

  const { buttonRadius } = useSiteSettings();
  const btnRadiusClass = getButtonRadiusClass(buttonRadius);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const data = await getProcesses();
      setProcesses(data);
    } catch (e: any) {
      console.error('Error loading processes:', e);
      toast.error('Error al cargar la lista de procesos');
    } finally {
      setLoading(false);
    }
  };

  const loadStagesForProcess = async (processId: string) => {
    try {
      setStagesLoading(true);
      const data = await getAdmissionStages(processId);
      setStages(data);
    } catch (e) {
      console.error('Error loading stages for process:', e);
    } finally {
      setStagesLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target as Node)) {
        setIconDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCreateModal = () => {
    setEditingProcess(null);
    setName('');
    setSlug('');
    setLabel('');
    setDescription('');
    setIcon('Layers');
    setIsActive(true);
    setSelectedSources(['WAITLIST']);
    setTargetType('STUDENT');
    setResolutionAction('NONE');
    setStages([]);
    setIsModalOpen(true);
  };

  const openEditModal = (proc: ProcessItem) => {
    setEditingProcess(proc);
    setName(proc.name);
    setSlug(proc.slug);
    setLabel(proc.label);
    setDescription(proc.description || '');
    setIcon(proc.icon);
    setIsActive(proc.isActive);
    setSelectedSources((proc.originSource || 'WAITLIST').split(','));
    setTargetType(proc.targetType || 'STUDENT');
    setResolutionAction(proc.resolutionAction || 'NONE');
    setIsModalOpen(true);
    loadStagesForProcess(proc.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerBlockedAction('Crear o modificar procesos administrativos');
      return;
    }
    if (!name.trim()) {
      toast.error('El nombre del proceso es requerido');
      return;
    }
    if (!editingProcess && !slug.trim()) {
      toast.error('El identificador (slug) es requerido');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProcess) {
        await updateProcess(editingProcess.id, {
          name: name.trim(),
          label: label.trim() || name.trim(),
          icon,
          description: description.trim(),
          isActive,
          originSource: selectedSources.join(','),
          targetType,
          resolutionAction
        });
        toast.success('Proceso actualizado exitosamente');
      } else {
        await createProcess({
          name: name.trim(),
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          label: label.trim() || name.trim(),
          icon,
          description: description.trim(),
          isActive,
          originSource: selectedSources.join(','),
          targetType,
          resolutionAction
        });
        toast.success('Proceso creado exitosamente con fases iniciales');
      }
      setIsModalOpen(false);
      loadProcesses();
      onProcessesUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el proceso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (proc: ProcessItem) => {
    if (isReadOnly) {
      triggerBlockedAction('Activar o desactivar procesos');
      return;
    }
    if (proc.slug === 'admissions') {
      return;
    }
    
    const newActiveState = !proc.isActive;
    try {
      await updateProcess(proc.id, {
        isActive: newActiveState
      });
      toast.success(`Proceso ${newActiveState ? 'activado' : 'desactivado'} correctamente`);
      loadProcesses();
      onProcessesUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar el estado del proceso');
    }
  };

  const handleDelete = async (proc: ProcessItem) => {
    if (isReadOnly) {
      triggerBlockedAction('Eliminar procesos');
      return;
    }
    if (proc.slug === 'admissions') {
      toast.error('El proceso de admisión predeterminado es obligatorio y no puede eliminarse.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar el proceso "${proc.name}"? Se eliminarán todas sus etapas asociadas de forma permanente.`)) {
      return;
    }

    try {
      await deleteProcess(proc.id);
      toast.success('Proceso eliminado correctamente');
      loadProcesses();
      onProcessesUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el proceso');
    }
  };

  const handleOpenPipeline = (proc: ProcessItem) => {
    const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/panel';
    window.location.href = `${basePath}/process_${proc.slug}`;
  };

  // Filtered preset icons based on search query
  const filteredIcons = PRESET_ICONS.filter(item => {
    const query = iconSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.label.toLowerCase().includes(query) ||
      item.searchKeys.some(key => key.includes(query))
    );
  });

  const SelectedIconComponent = getIconComponent(icon);
  const selectedIconObj = PRESET_ICONS.find(item => item.name === icon);

  return (
    <div className="w-full font-body space-y-6">
      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-8 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 py-6 text-white shadow-md space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <MobileMenuButton />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white leading-tight">
                Gestión de Procesos
              </h1>
              <p className="text-xs text-white/80 mt-0.5">
                Crea y administra múltiples pipelines de admisiones, inscripciones u otros flujos escolares.
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className={`flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white font-bold text-sm shadow-xs active:scale-98 transition-all shrink-0 ${btnRadiusClass}`}
          >
            <Plus className="w-4 h-4" />
            <span>Crear Proceso</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {processes.map(proc => {
            const IconComponent = getIconComponent(proc.icon);
            const isDefault = proc.slug === 'admissions';
            
            return (
              <div 
                key={proc.id}
                className="bg-white rounded-2xl border border-forest/10 hover:border-forest p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* DEFAULT BADGE BACKGROUND EFFECT */}
                {isDefault && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-forest/5 rounded-bl-full flex items-center justify-center pointer-events-none">
                    <Sparkles className="w-3.5 h-3.5 text-forest/30 translate-x-1 -translate-y-1" />
                  </div>
                )}

                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDefault ? 'bg-forest/10 text-forest' : 'bg-cream text-forest/80'}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold font-display text-base text-forest font-semibold">
                        {proc.label || proc.name}
                      </h3>
                      {isDefault && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-forest/10 text-forest border border-forest/20 shrink-0">
                          Fijo / Admisión
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-forest/40 font-mono mt-0.5 animate-fade-in">
                      slug: {proc.slug} • tipo: {proc.targetType === 'STAFF' ? 'Docente/Personal' : 'Estudiante'} • origen: {
                        proc.originSource.split(',').map(src => {
                          if (src === 'ACTIVE_ENROLLMENT') return 'Matrícula Activa';
                          if (src === 'ACTIVE_STAFF') return 'Docentes Activos';
                          if (src === 'WAITLIST') return 'Lista de Espera';
                          if (src === 'DIRECT_CREATION') return 'Creación Directa';
                          return src;
                        }).join(' o ')
                      }
                    </p>
                    <p className="text-xs text-forest/75 mt-1 line-clamp-1">
                      {proc.description || 'Sin descripción proporcionada.'}
                    </p>
                  </div>
                </div>

                {/* ACTIONS & TOGGLE ALIGNED RIGHT */}
                <div className="flex items-center gap-3.5 shrink-0 justify-end border-t sm:border-t-0 border-forest/5 pt-3 sm:pt-0">
                  {/* PIPELINE NAVIGATION BUTTON (KANBAN ICON) */}
                  <button
                    onClick={() => handleOpenPipeline(proc)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-forest/5 hover:bg-forest hover:text-white text-forest border border-forest/10 hover:border-forest shrink-0 cursor-pointer"
                    title="Ver Tablero / Pipeline"
                  >
                    <Kanban className="w-4 h-4" />
                  </button>

                  {/* CONFIG STAGES BUTTON (LAYERS ICON) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProcessForStages(proc);
                      loadStagesForProcess(proc.id).then(() => {
                        setStageConfigDrawerOpen(true);
                      });
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-forest/5 hover:bg-forest hover:text-white text-forest border border-forest/10 hover:border-forest shrink-0 cursor-pointer"
                    title="Configurar Fases"
                  >
                    <Layers className="w-4 h-4" />
                  </button>

                  {/* EDIT BUTTON (COG ICON) */}
                  <button
                    onClick={() => openEditModal(proc)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-forest/5 hover:bg-forest hover:text-white text-forest border border-forest/10 hover:border-forest shrink-0 cursor-pointer"
                    title="Editar Proceso"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* DELETE BUTTON */}
                  {!isDefault && (
                    <button
                      onClick={() => handleDelete(proc)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-red-50 hover:bg-red-500 hover:text-white text-red-500 border border-red-100 hover:border-red-500 shrink-0 cursor-pointer"
                      title="Eliminar Proceso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* TOGGLE ACTIVE SWITCH - ALIGNED ALL THE WAY TO THE RIGHT */}
                  <button
                    type="button"
                    disabled={isDefault}
                    onClick={() => handleToggleActive(proc)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${
                      proc.isActive ? 'bg-forest' : 'bg-forest/20'
                    } ${isDefault ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} shrink-0`}
                    title={isDefault ? 'El proceso de admisión no se puede desactivar' : 'Activar/Desactivar proceso'}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${proc.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROCESS DIALOG DRAWER */}
      <SlideOverDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProcess ? 'Editar Proceso' : 'Crear Nuevo Proceso'}
        description="Configura los detalles de identidad y estado del proceso."
        icon={<Workflow className="w-5 h-5 text-forest" />}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`px-4 py-2 border border-forest/20 hover:bg-forest/5 text-forest/80 hover:text-forest font-bold text-xs transition-colors ${btnRadiusClass}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-forest/90 text-white font-bold text-xs shadow-md active:scale-98 transition-all disabled:opacity-50 ${btnRadiusClass}`}
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{editingProcess ? 'Guardar Cambios' : 'Crear Proceso'}</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Process Name */}
          <div>
            <label className="block text-xs font-bold text-forest/70 mb-1.5">
              Nombre Interno *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (!editingProcess) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
                  setLabel(e.target.value);
                }
              }}
              placeholder="Ej. Inscripciones Ciclo 2026-2027"
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 focus:border-forest/50 focus:ring-1 focus:ring-forest text-sm bg-white outline-hidden font-body"
            />
          </div>

          {/* Slug / Unique ID */}
          <div>
            <label className="block text-xs font-bold text-forest/70 mb-1.5 flex items-center gap-1">
              Identificador (Slug) *
              <HelpCircle className="w-3.5 h-3.5 text-forest/40" title="Nombre único en URL, no se puede cambiar después." />
            </label>
            <input
              type="text"
              required
              disabled={!!editingProcess}
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'))}
              placeholder="ej. inscripciones_ciclo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 focus:border-forest/50 focus:ring-1 focus:ring-forest text-sm bg-white disabled:bg-cream disabled:text-forest/40 outline-hidden font-mono text-[11px]"
            />
          </div>

          {/* Menu Label */}
          <div>
            <label className="block text-xs font-bold text-forest/70 mb-1.5">
              Etiqueta en Menú *
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej. Inscripciones"
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 focus:border-forest/50 focus:ring-1 focus:ring-forest text-sm bg-white outline-hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-forest/70 mb-1.5">
              Descripción Corta
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe brevemente de qué trata este flujo de trabajo..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 focus:border-forest/50 focus:ring-1 focus:ring-forest text-sm bg-white outline-hidden resize-none"
            />
          </div>

          {/* Custom Icon Choice Selector with Search */}
          <div ref={iconDropdownRef}>
            <label className="block text-xs font-bold text-forest/70 mb-1.5">
              Icono Representativo
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIconDropdownOpen(!iconDropdownOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-forest/20 focus:border-forest/50 focus:ring-1 focus:ring-forest text-sm bg-white outline-hidden text-left"
              >
                <div className="flex items-center gap-2.5">
                  <SelectedIconComponent className="w-5 h-5 text-forest" />
                  <div>
                    <span className="font-semibold text-forest">
                      {selectedIconObj?.label || icon}
                    </span>
                    <span className="text-[10px] text-forest/40 ml-2 font-mono">
                      ({icon})
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-forest/50" />
              </button>

              {iconDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-forest/15 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[300px]">
                  {/* Search Bar */}
                  <div className="p-2.5 border-b border-forest/5 bg-cream flex items-center gap-2">
                    <Search className="w-4 h-4 text-forest/50 shrink-0" />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={e => setIconSearch(e.target.value)}
                      placeholder="Buscar icono por nombre o palabra clave..."
                      className="w-full bg-transparent border-0 p-1 text-xs focus:ring-0 focus:outline-hidden text-forest placeholder-forest/40 font-body outline-hidden"
                      autoFocus
                    />
                    {iconSearch && (
                      <button
                        type="button"
                        onClick={() => setIconSearch('')}
                        className="p-1 hover:bg-forest/10 rounded-md text-forest/50 hover:text-forest"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Icons Scrollable List */}
                  <div className="overflow-y-auto flex-1 p-1 flex flex-col divide-y divide-forest/5">
                    {filteredIcons.length === 0 ? (
                      <div className="p-4 text-center text-xs text-forest/50 font-body">
                        No se encontraron iconos.
                      </div>
                    ) : (
                      filteredIcons.map(item => {
                        const ItemIcon = item.icon;
                        const isSelected = icon === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setIcon(item.name);
                              setIconDropdownOpen(false);
                              setIconSearch('');
                            }}
                            className={`flex items-center justify-between px-3 py-2.5 text-left text-xs transition-colors hover:bg-forest/5 ${
                              isSelected ? 'bg-forest/5 text-forest font-bold font-semibold' : 'text-forest/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <ItemIcon className="w-4 h-4 text-forest" />
                              <div>
                                <span className="font-semibold">{item.label}</span>
                                <span className="text-[10px] text-forest/40 ml-1.5 font-mono">({item.name})</span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-forest" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Target Entity Type Selection */}
          <div>
            <label className="block text-xs font-bold text-forest/70 mb-2">
              Sujeto del Proceso (¿Para quién es?)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTargetType('STUDENT');
                  setSelectedSources(['WAITLIST']); // sensible default for student
                  setResolutionAction('NONE');
                }}
                className={`flex flex-col items-start p-3 text-left border transition-all ${
                  targetType === 'STUDENT'
                    ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                    : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                }`}
                style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
              >
                <span className="font-bold text-xs">Estudiante</span>
                <span className="text-[9px] text-forest/50 mt-1">El proceso se ejecuta sobre un alumno o aspirante.</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetType('STAFF');
                  setSelectedSources(['ACTIVE_STAFF']); // sensible default for staff
                  setResolutionAction('NONE');
                }}
                className={`flex flex-col items-start p-3 text-left border transition-all ${
                  targetType === 'STAFF'
                    ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                    : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                }`}
                style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
              >
                <span className="font-bold text-xs">Docente / Personal</span>
                <span className="text-[9px] text-forest/50 mt-1">El proceso se ejecuta sobre un guía, asistente o staff.</span>
              </button>
            </div>
          </div>

          {/* Origin Source Selection */}
          <div>
            <label className="block text-xs font-bold text-forest/70 mb-2">
              Fuentes de Origen de Datos (Puedes seleccionar varias)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {targetType === 'STUDENT' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const source = 'WAITLIST';
                      if (selectedSources.includes(source)) {
                        if (selectedSources.length > 1) setSelectedSources(selectedSources.filter(s => s !== source));
                      } else {
                        setSelectedSources([...selectedSources, source]);
                      }
                    }}
                    className={`flex flex-col items-start p-3 text-left border transition-all ${
                      selectedSources.includes('WAITLIST')
                        ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                        : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                    }`}
                    style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs">Desde Lista de Espera</span>
                      {selectedSources.includes('WAITLIST') && <Check className="w-3.5 h-3.5 text-forest shrink-0" />}
                    </div>
                    <span className="text-[9px] text-forest/50 mt-1">Los datos ingresan desde la pre-matrícula y lista de espera.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const source = 'ACTIVE_ENROLLMENT';
                      if (selectedSources.includes(source)) {
                        if (selectedSources.length > 1) setSelectedSources(selectedSources.filter(s => s !== source));
                      } else {
                        setSelectedSources([...selectedSources, source]);
                      }
                    }}
                    className={`flex flex-col items-start p-3 text-left border transition-all ${
                      selectedSources.includes('ACTIVE_ENROLLMENT')
                        ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                        : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                    }`}
                    style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs">Desde Matrícula Activa</span>
                      {selectedSources.includes('ACTIVE_ENROLLMENT') && <Check className="w-3.5 h-3.5 text-forest shrink-0" />}
                    </div>
                    <span className="text-[9px] text-forest/50 mt-1">Los datos ingresan desde estudiantes ya inscritos.</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const source = 'ACTIVE_STAFF';
                      if (selectedSources.includes(source)) {
                        if (selectedSources.length > 1) setSelectedSources(selectedSources.filter(s => s !== source));
                      } else {
                        setSelectedSources([...selectedSources, source]);
                      }
                    }}
                    className={`flex flex-col items-start p-3 text-left border transition-all ${
                      selectedSources.includes('ACTIVE_STAFF')
                        ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                        : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                    }`}
                    style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs">Desde Docentes Activos</span>
                      {selectedSources.includes('ACTIVE_STAFF') && <Check className="w-3.5 h-3.5 text-forest shrink-0" />}
                    </div>
                    <span className="text-[9px] text-forest/50 mt-1">El proceso se inicia para un docente del plantel actual.</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  const source = 'DIRECT_CREATION';
                  if (selectedSources.includes(source)) {
                    if (selectedSources.length > 1) setSelectedSources(selectedSources.filter(s => s !== source));
                  } else {
                    setSelectedSources([...selectedSources, source]);
                  }
                }}
                className={`flex flex-col items-start p-3 text-left border transition-all ${
                  selectedSources.includes('DIRECT_CREATION')
                    ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                    : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                }`}
                style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">Creación Directa</span>
                  {selectedSources.includes('DIRECT_CREATION') && <Check className="w-3.5 h-3.5 text-forest shrink-0" />}
                </div>
                <span className="text-[9px] text-forest/50 mt-1">El administrador crea el expediente de forma manual en blanco.</span>
              </button>
            </div>
          </div>

          {/* Resolution Action Selection */}
          <div>
            <label className="block text-xs font-bold text-forest/70 mb-2">
              Acción Automática al Finalizar
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResolutionAction('NONE')}
                className={`flex flex-col items-start p-3 text-left border transition-all col-span-2 ${
                  resolutionAction === 'NONE'
                    ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                    : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                }`}
                style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
              >
                <span className="font-bold text-xs">Ninguna / Solo Bitácora</span>
                <span className="text-[9px] text-forest/50 mt-1">El proceso finaliza sin alterar matrículas ni personal. Ideal para capacitaciones o registro de visitas.</span>
              </button>

              {targetType === 'STUDENT' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setResolutionAction('PROMOTE_TO_ENROLLED')}
                    className={`flex flex-col items-start p-3 text-left border transition-all ${
                      resolutionAction === 'PROMOTE_TO_ENROLLED'
                        ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                        : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                    }`}
                    style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
                  >
                    <span className="font-bold text-xs">Alta de Matrícula Activa</span>
                    <span className="text-[9px] text-forest/50 mt-1">Crea una matrícula regular de estudiante y le asigna un ambiente (admisiones).</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction('UPDATE_ENVIRONMENT')}
                    className={`flex flex-col items-start p-3 text-left border transition-all ${
                      resolutionAction === 'UPDATE_ENVIRONMENT'
                        ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                        : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                    }`}
                    style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
                  >
                    <span className="font-bold text-xs">Actualizar Ambiente</span>
                    <span className="text-[9px] text-forest/50 mt-1">Actualiza el salón del alumno en su matrícula activa (traslados).</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction('GRADUATE_STUDENT')}
                    className={`flex flex-col items-start p-3 text-left border transition-all col-span-2 ${
                      resolutionAction === 'GRADUATE_STUDENT'
                        ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                        : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                    }`}
                    style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
                  >
                    <span className="font-bold text-xs">Graduar / Liberar Cupo</span>
                    <span className="text-[9px] text-forest/50 mt-1">Marca al estudiante como graduado, desactiva su matrícula y libera su vacante.</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setResolutionAction('HIRE_STAFF')}
                    className={`flex flex-col items-start p-3 text-left border transition-all ${
                      resolutionAction === 'HIRE_STAFF'
                        ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                        : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                    }`}
                    style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
                  >
                    <span className="font-bold text-xs">Alta de Contrato</span>
                    <span className="text-[9px] text-forest/50 mt-1">Activa el contrato de la guía y le asigna su ambiente pedagógico en el plantel.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction('TERMINATE_STAFF')}
                    className={`flex flex-col items-start p-3 text-left border transition-all ${
                      resolutionAction === 'TERMINATE_STAFF'
                        ? 'bg-forest/5 border-forest text-forest shadow-xs font-semibold'
                        : 'bg-white border-forest/15 text-forest/70 hover:bg-forest/5'
                    }`}
                    style={{ borderRadius: buttonRadius === 'none' ? '0px' : '12px' }}
                  >
                    <span className="font-bold text-xs">Baja de Personal</span>
                    <span className="text-[9px] text-forest/50 mt-1">Desvincula la guía, remueve su asignación de salones y libera el puesto.</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stages List inside Edit Mode */}
          {editingProcess && (
            <div className="border-t border-forest/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-forest font-display flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-forest" />
                  <span>Fases del Pipeline</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProcessForStages(editingProcess);
                    loadStagesForProcess(editingProcess.id).then(() => {
                      setStageConfigDrawerOpen(true);
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 bg-forest hover:bg-forest/90 text-white font-bold text-[10px] shadow-xs active:scale-98 transition-all ${btnRadiusClass}`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Configurar Fases</span>
                </button>
              </div>

              {stagesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-forest" />
                </div>
              ) : stages.length === 0 ? (
                <p className="text-[11px] text-forest/50 bg-cream p-3 rounded-xl border border-forest/5 text-center font-body">
                  Este proceso no tiene fases configuradas aún.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stages.map(stg => (
                    <div 
                      key={stg.id}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-colors bg-white hover:bg-cream"
                      style={{ 
                        borderColor: stg.color ? `${stg.color}30` : 'rgba(27, 59, 43, 0.15)',
                        color: stg.color || '#1b3b2b'
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stg.color || '#1b3b2b' }} />
                      <span>{stg.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Is Active Status (Only for custom processes) */}
          {(!editingProcess || editingProcess.slug !== 'admissions') && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cream border border-forest/10">
              <div className="pr-4">
                <span className="block text-xs font-bold text-forest">
                  Proceso Activo
                </span>
                <span className="block text-[10px] text-forest/65">
                  Determina si este proceso y su correspondiente pestaña de menú son visibles y utilizables.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${isActive ? 'bg-forest' : 'bg-forest/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}
        </form>
      </SlideOverDrawer>

      {/* STAGE CONFIGURATION DRAWER */}
      {stageConfigDrawerOpen && (
        <AdmissionStageConfigDrawer
          isOpen={stageConfigDrawerOpen}
          onClose={() => {
            setStageConfigDrawerOpen(false);
            setSelectedProcessForStages(null);
            if (editingProcess) {
              loadStagesForProcess(editingProcess.id);
            }
          }}
          stages={stages}
          stageToEdit={null}
          onUpdated={() => {
            if (selectedProcessForStages) {
              loadStagesForProcess(selectedProcessForStages.id);
            } else if (editingProcess) {
              loadStagesForProcess(editingProcess.id);
            }
          }}
          processId={selectedProcessForStages?.id || editingProcess?.id}
        />
      )}
    </div>
  );
};
