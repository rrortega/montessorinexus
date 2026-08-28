import React, { useState, useEffect } from 'react';
import {
  AppWindow,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  ApplicationItem,
  ApplicationLink
} from '@/lib/sqlite';
import { toast } from 'sonner';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/AuthContext';

export const ApplicationsSection: React.FC = () => {
  const { role, activeMembership } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [links, setLinks] = useState<{ label: string; label_en: string; url: string }[]>([]);
  const [langTab, setLangTab] = useState<'es' | 'en'>('es');

  // Confirm Delete Dialog state
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({ isOpen: false, id: '', title: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getApplications();
      setApps(data);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar aplicativos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (app?: ApplicationItem) => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores pueden crear o editar aplicativos.');
      return;
    }
    if (app) {
      setEditingApp(app);
      setTitle(app.title);
      setDescription(app.description);
      setTitleEn(app.title_en || '');
      setDescriptionEn(app.description_en || '');
      setIconUrl(app.icon_url || '');
      setIconFile(null);
      setLinks(app.links.map(l => ({ label: l.label, label_en: l.label_en || '', url: l.url })));
    } else {
      setEditingApp(null);
      setTitle('');
      setDescription('');
      setTitleEn('');
      setDescriptionEn('');
      setIconUrl('');
      setIconFile(null);
      setLinks([{ label: 'Ir a la Plataforma', label_en: 'Open Platform', url: '' }]);
    }
    setLangTab('es');
    setIsModalOpen(true);
  };

  const handleAddLinkRow = () => {
    setLinks(prev => [...prev, { label: '', label_en: '', url: '' }]);
  };

  const handleRemoveLinkRow = (index: number) => {
    setLinks(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleLinkChange = (index: number, field: 'label' | 'label_en' | 'url', value: string) => {
    setLinks(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores pueden crear o editar aplicativos.');
      return;
    }
    if (!title.trim()) {
      toast.error('Ingresa el nombre del aplicativo en español.');
      return;
    }

    // Process icon file if uploaded
    let finalIconUrl = iconUrl;
    if (iconFile) {
      finalIconUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(iconFile);
      });
    }

    // Filter valid links (must have url and at least one label)
    const validLinks = links.filter(l => (l.label.trim() || l.label_en.trim()) && l.url.trim());

    if (editingApp) {
      await updateApplication(editingApp.id, {
        title: title.trim(),
        description: description.trim(),
        title_en: titleEn.trim(),
        description_en: descriptionEn.trim(),
        icon_url: finalIconUrl,
        links: validLinks,
      });
      toast.success('Aplicativo actualizado.');
    } else {
      await createApplication({
        title: title.trim(),
        description: description.trim(),
        title_en: titleEn.trim(),
        description_en: descriptionEn.trim(),
        icon_url: finalIconUrl,
        links: validLinks,
      });
      toast.success('Aplicativo creado correctamente.');
    }

    setIsModalOpen(false);
    loadData();
  };

  const promptDeleteApp = (id: string, appTitle: string) => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores pueden eliminar aplicativos.');
      return;
    }
    setConfirmDelete({
      isOpen: true,
      id,
      title: appTitle
    });
  };

  const handleExecuteDeleteApp = async () => {
    if (!isOwnerOrAdmin) {
      toast.error('Solo los administradores pueden eliminar aplicativos.');
      return;
    }
    await deleteApplication(confirmDelete.id);
    toast.success('Aplicativo eliminado.');
    loadData();
  };

  return (
    <div className="space-y-6 font-body animate-in fade-in duration-300">

      {/* FULL-WIDTH GREEN HERO BANNER */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 rounded-none bg-gradient-to-r from-forest via-forest-light to-forest px-4 sm:px-6 md:px-8 py-6 text-white shadow-md space-y-2 relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                  Aplicativos & Plataformas Escolares
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {apps.length} {apps.length === 1 ? 'aplicativo' : 'aplicativos'}
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                {isOwnerOrAdmin
                  ? 'Administra los accesos directos, plataformas educativas, portales de pago y recursos externos del colegio.'
                  : 'Accede a los portales escolares oficiales, plataformas educativas y herramientas recomendadas.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 flex-wrap shrink-0">
            {isOwnerOrAdmin ? (
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="px-4 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 text-forest" />
                <span>Agregar Aplicativo</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-white/90 space-y-0.5 shrink-0">
                <span className="text-[10px] text-white/60 uppercase font-bold block">Colegio Activo</span>
                <strong className="text-sm sm:text-base font-bold font-display block text-white">
                  {activeMembership?.school.name || 'Ceiba Montessori'}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applications Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Cargando aplicativos...
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest/10 shadow-sm space-y-3">
          <AppWindow className="w-12 h-12 text-forest/30 mx-auto" />
          <h3 className="font-display font-bold text-forest text-lg">No hay aplicativos registrados</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Registra aplicaciones como el portal de pagos, seguimiento de transporte, plataformas educativas y sus enlaces de acción.
          </p>
          {isOwnerOrAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              Crear Primer Aplicativo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-forest/10 shadow-sm hover:border-forest/30 transition-all flex flex-col justify-between space-y-4 w-full"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-cream border border-forest/10 overflow-hidden flex items-center justify-center shrink-0">
                      {app.icon_url ? (
                        <img src={app.icon_url} alt={app.title} className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <AppWindow className="w-7 h-7 text-forest/40" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-forest text-base leading-snug">
                        {app.title}
                      </h3>
                      {app.title_en && (
                        <span className="text-[10px] bg-forest/10 text-forest px-1.5 py-0.2 rounded font-semibold uppercase block w-fit mt-0.5">
                          EN: {app.title_en}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOwnerOrAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenModal(app)}
                        className="p-2 text-forest/80 hover:bg-forest/10 rounded-xl transition-colors"
                        title="Editar Aplicativo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => promptDeleteApp(app.id, app.title)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                        title="Eliminar Aplicativo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {app.description && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                    ES: {app.description}
                  </p>
                )}
                {app.description_en && (
                  <p className="text-xs text-muted-foreground/80 italic mt-0.5 line-clamp-2">
                    EN: {app.description_en}
                  </p>
                )}
              </div>

              {/* Action Links List */}
              <div className="pt-4 border-t border-forest/10 space-y-2">
                <span className="text-[11px] font-semibold text-forest uppercase tracking-wider block">
                  Acciones / Enlaces ({app.links.length})
                </span>

                <div className="flex flex-wrap gap-2">
                  {app.links.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">Sin enlaces configurados.</span>
                  ) : (
                    app.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 border border-forest/10 text-forest text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SlideOverDrawer: Crear / Editar Aplicativo */}
      <SlideOverDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        icon={<AppWindow className="w-5 h-5 text-forest" />}
        title={editingApp ? 'Editar Aplicativo' : 'Crear / Vincular Aplicativo'}
        description="Agrega un portal, recurso o herramienta con sus respectivos enlaces de acceso."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="app-drawer-form"
              className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{editingApp ? 'Guardar Cambios' : 'Crear Aplicativo'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center justify-end pb-2">
            {/* Language Selector Tabs */}
            <div className="flex items-center gap-1 bg-cream/80 p-1 rounded-xl border border-forest/10">
              <button
                type="button"
                onClick={() => setLangTab('es')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${langTab === 'es' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:text-forest'
                  }`}
              >
                🇪🇸 Español
              </button>
              <button
                type="button"
                onClick={() => setLangTab('en')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${langTab === 'en' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:text-forest'
                  }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <form id="app-drawer-form" onSubmit={handleSaveApp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5">
                Logotipo / Icono del Aplicativo
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-cream border border-forest/20 overflow-hidden flex items-center justify-center shrink-0">
                  {iconFile ? (
                    <span className="text-[10px] text-forest font-semibold text-center px-1">Nueva Imagen</span>
                  ) : iconUrl ? (
                    <img src={iconUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-forest/40" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-forest file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20"
                  />
                  <input
                    type="url"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="O pega la URL directa de la imagen..."
                    className="w-full px-3 py-1.5 rounded-xl border border-forest/20 text-xs font-mono text-forest bg-white focus:outline-none focus:ring-1 focus:ring-forest"
                  />
                </div>
              </div>
            </div>

            {/* Bilingual Title & Description */}
            {langTab === 'es' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                    Nombre del Aplicativo (Español) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ej. Portal de Pagos y Facturación"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                    Descripción (Español)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Instrucciones para los padres sobre el uso del aplicativo..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white leading-relaxed"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                    Application Title (English)
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. Payment & Billing Portal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Instructions for parents on how to use the app..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white leading-relaxed"
                  />
                </div>
              </>
            )}

            {/* Dynamic External Links & Action Buttons Manager */}
            <div className="space-y-3 pt-2 border-t border-forest/10">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-forest uppercase tracking-wider">
                  Acciones & Enlaces Externos
                </label>
                <button
                  type="button"
                  onClick={handleAddLinkRow}
                  className="px-2.5 py-1 bg-forest/10 hover:bg-forest/20 text-forest rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Enlace</span>
                </button>
              </div>

              {links.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Agrega al menos una acción (ej. "Ver Video", "Ir a la Plataforma").</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {links.map((link, idx) => (
                    <div key={idx} className="p-3 bg-cream/40 rounded-2xl border border-forest/10 space-y-2 relative group">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-forest uppercase">Acción #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLinkRow(idx)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded-lg transition-colors"
                          title="Eliminar este enlace"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {langTab === 'es' ? (
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => handleLinkChange(idx, 'label', e.target.value)}
                            placeholder="Etiqueta del botón (Español)"
                            required
                            className="px-3 py-1.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                          />
                        ) : (
                          <input
                            type="text"
                            value={link.label_en}
                            onChange={(e) => handleLinkChange(idx, 'label_en', e.target.value)}
                            placeholder="Button label (English)"
                            className="px-3 py-1.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                          />
                        )}

                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                          placeholder="https://..."
                          required
                          className="px-3 py-1.5 rounded-xl border border-forest/20 text-xs font-mono text-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
      </SlideOverDrawer>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDeleteApp}
        title="¿Eliminar Aplicativo?"
        message={`¿Estás seguro de eliminar el aplicativo "${confirmDelete.title}" y todas sus acciones configuradas? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        onClick={() => handleOpenModal()}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-forest/30"
        aria-label="Agregar Aplicativo"
        title="Agregar Aplicativo"
      >
        <Plus className="w-7 h-7" />
      </button>

    </div>
  );
};

export default ApplicationsSection;
