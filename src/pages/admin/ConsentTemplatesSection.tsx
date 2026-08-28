import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Camera,
  Compass,
  HeartPulse,
  Trees,
  FileBadge,
  Pencil
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
  ConsentTemplateItem,
  getConsentTemplates,
  saveConsentTemplates
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const CATEGORY_MAP: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  media: { label: 'Imagen & Redes', icon: Camera, color: '#0284c7' },
  trips: { label: 'Salidas & Excursiones', icon: Compass, color: '#ea580c' },
  medical: { label: 'Salud & Emergencias', icon: HeartPulse, color: '#e11d48' },
  outdoors: { label: 'Huerto & Naturaleza', icon: Trees, color: '#16a34a' },
  general: { label: 'Institucional / General', icon: FileBadge, color: '#1b3b2b' }
};

export const ConsentTemplatesSection: React.FC = () => {
  const { role } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  const [templates, setTemplates] = useState<ConsentTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drawer modal state for consent item
  const [consentDrawerOpen, setConsentDrawerOpen] = useState(false);
  const [editingConsentId, setEditingConsentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'media' | 'trips' | 'medical' | 'outdoors' | 'general'>('general');
  const [description, setDescription] = useState('');
  const [legalText, setLegalText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Delete Confirm Dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({ isOpen: false, id: '', title: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getConsentTemplates();
      setTemplates(data);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar plantillas de consentimiento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    if (!isOwnerOrAdmin) return;
    setEditingConsentId(null);
    setTitle('');
    setCategory('general');
    setDescription('');
    setLegalText('');
    setIsRequired(false);
    setRequiresSignature(true);
    setIsActive(true);
    setConsentDrawerOpen(true);
  };

  const handleOpenEdit = (item: ConsentTemplateItem) => {
    if (!isOwnerOrAdmin) return;
    setEditingConsentId(item.id);
    setTitle(item.title);
    setCategory(item.category || 'general');
    setDescription(item.description || '');
    setLegalText(item.legalText || '');
    setIsRequired(!!item.isRequired);
    setRequiresSignature(item.requiresSignature !== undefined ? item.requiresSignature : true);
    setIsActive(item.isActive !== undefined ? item.isActive : true);
    setConsentDrawerOpen(true);
  };

  const handleSaveConsentDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;
    if (!title.trim()) {
      toast.error('El título del consentimiento es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      let updated: ConsentTemplateItem[] = [];
      if (editingConsentId) {
        updated = templates.map(c =>
          c.id === editingConsentId
            ? {
              ...c,
              title: title.trim(),
              category,
              description: description.trim(),
              legalText: legalText.trim() || undefined,
              isRequired,
              requiresSignature,
              isActive
            }
            : c
        );
      } else {
        const newItem: ConsentTemplateItem = {
          id: `consent_${Date.now()}`,
          title: title.trim(),
          category,
          description: description.trim(),
          legalText: legalText.trim() || undefined,
          isRequired,
          requiresSignature,
          isActive
        };
        updated = [...templates, newItem];
      }

      await saveConsentTemplates(updated);
      setTemplates(updated);
      setConsentDrawerOpen(false);
      toast.success(editingConsentId ? 'Consentimiento actualizado' : 'Nuevo consentimiento creado');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: ConsentTemplateItem) => {
    if (!isOwnerOrAdmin) return;
    try {
      const updated = templates.map(c =>
        c.id === item.id ? { ...c, isActive: c.isActive === undefined ? false : !c.isActive } : c
      );
      await saveConsentTemplates(updated);
      setTemplates(updated);
      toast.success(`Plantilla "${item.title}" actualizada`);
    } catch (err: any) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleExecuteDelete = async () => {
    if (!confirmDelete.id || !isOwnerOrAdmin) return;
    try {
      const updated = templates.filter(c => c.id !== confirmDelete.id);
      await saveConsentTemplates(updated);
      setTemplates(updated);
      toast.success('Plantilla eliminada');
    } catch (err: any) {
      toast.error('Error al eliminar plantilla');
    }
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300 pb-16">

      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                  Plantillas de Consentimientos & Autorizaciones
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {templates.length} {templates.length === 1 ? 'plantilla' : 'plantillas'}
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Gestiona los consentimientos legales y pedagógicos requeridos para los padres de familia durante la matrícula y el ciclo escolar.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 shrink-0">
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-forest" />
                <span>Nueva Plantilla</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONSENTS LIST / CARDS */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Cargando plantillas de consentimiento...
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest/10 space-y-3">
          <FileCheck2 className="w-12 h-12 text-forest/30 mx-auto" />
          <h3 className="font-display font-bold text-forest text-base">No hay plantillas de consentimiento</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Crea la primera plantilla de autorización para salidas, uso de imagen o primeros auxilios.
          </p>
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primera Plantilla</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((item) => {
            const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.general;
            const IconComp = catInfo.icon;
            const itemActive = item.isActive !== false;

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${itemActive
                    ? 'bg-white/95 border-forest/15 shadow-xs'
                    : 'bg-cream/20 border-forest/10 opacity-70'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0"
                        style={{ backgroundColor: catInfo.color }}
                      >
                        <IconComp className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-forest text-sm">{item.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${itemActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                          >
                            {itemActive ? 'Activo' : 'Inactivo'}
                          </span>
                          {item.isRequired && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                              Obligatorio
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground inline-block">
                          Categoría: <strong className="text-forest">{catInfo.label}</strong>
                        </span>
                      </div>
                    </div>

                    {isOwnerOrAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className="p-1.5 text-forest/70 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
                          title={itemActive ? 'Desactivar' : 'Activar'}
                        >
                          {itemActive ? (
                            <ToggleRight className="w-5 h-5 text-forest" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-forest/70 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
                          title="Editar plantilla"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ isOpen: true, id: item.id, title: item.title })}
                          className="p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {item.legalText && (
                    <div className="p-3 bg-forest/5 rounded-2xl border border-forest/10 text-[11px] text-forest/90 leading-relaxed font-mono">
                      {item.legalText}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-forest/10 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                    <span>Firma digital: {item.requiresSignature !== false ? 'Requerida' : 'Opcional'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER FOR CREATING / EDITING CONSENT TEMPLATE */}
      <SlideOverDrawer
        isOpen={consentDrawerOpen}
        onClose={() => setConsentDrawerOpen(false)}
        title={editingConsentId ? 'Editar Plantilla de Consentimiento' : 'Nueva Plantilla de Consentimiento'}
        description="Configura el texto de autorización y los términos para los padres de familia."
        icon={<FileCheck2 className="w-5 h-5 text-forest" />}
      >
        <form onSubmit={handleSaveConsentDrawer} className="space-y-4 p-4 text-xs font-body">
          <div className="space-y-1.5">
            <label className="block text-forest font-bold">
              Título del Consentimiento <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Uso de Imagen en Redes Sociales, Salidas Escolares..."
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Categoría del Consentimiento</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest font-semibold cursor-pointer"
            >
              <option value="media">Imagen, Fotografía & Redes Sociales</option>
              <option value="trips">Salidas Pedagógicas & Excursiones</option>
              <option value="medical">Atención Médica & Primeros Auxilios</option>
              <option value="outdoors">Huerto, Naturaleza & Aire Libre</option>
              <option value="general">Institucional & General</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Descripción Resumida para Padres</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica brevemente qué autoriza el padre de familia..."
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Texto Legal / Declaración Completa</label>
            <textarea
              rows={4}
              value={legalText}
              onChange={(e) => setLegalText(e.target.value)}
              placeholder="Texto legal formal que acepta y firma el tutor..."
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
            />
          </div>

          <div className="p-3 bg-cream/30 rounded-2xl border border-forest/10 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest cursor-pointer"
              />
              <span className="text-forest font-bold">
                Consentimiento Obligatorio para Matrícula
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresSignature}
                onChange={(e) => setRequiresSignature(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest cursor-pointer"
              />
              <span className="text-forest font-bold">
                Requiere Firma Digital del Tutor
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest cursor-pointer"
              />
              <span className="text-forest font-bold">
                Plantilla Activa y Visible en Formularios
              </span>
            </label>
          </div>

          <div className="pt-2 border-t border-forest/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConsentDrawerOpen(false)}
              className="px-4 py-2 bg-forest/5 hover:bg-forest/10 text-forest font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Guardando...' : (editingConsentId ? 'Guardar Cambios' : 'Crear Consentimiento')}
            </button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={confirmDelete.isOpen}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, isOpen: open }))}
        title="¿Eliminar Plantilla de Consentimiento?"
        description={`¿Estás seguro de que deseas eliminar la plantilla "${confirmDelete.title}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        variant="destructive"
        onConfirm={handleExecuteDelete}
      />

    </div>
  );
};
