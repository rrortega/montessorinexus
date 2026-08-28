import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Trash2,
  Utensils,
  Pill,
  Wind,
  Bug,
  ShieldAlert,
  ShieldCheck,
  Filter,
  X
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
  AllergyCatalogueItem,
  AllergyCategory,
  AllergySeverity,
  getAllergiesCatalogue,
  saveAllergiesCatalogue
} from '@/lib/sqlite';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const AllergiesSection: React.FC = () => {
  const { role } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

  const [allergies, setAllergies] = useState<AllergyCatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<AllergyCategory>('food');
  const [severity, setSeverity] = useState<AllergySeverity>('moderate');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [emergencyAction, setEmergencyAction] = useState('');

  // Delete Confirm Dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllergiesCatalogue();
      setAllergies(data);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar catálogo de alergias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAllergies = useMemo(() => {
    return allergies.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        item.name.toLowerCase().includes(q) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
        item.description.toLowerCase().includes(q) ||
        (item.emergencyAction && item.emergencyAction.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [allergies, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    if (!isOwnerOrAdmin) return;
    setEditingId(null);
    setName('');
    setNameEn('');
    setCategory('food');
    setSeverity('moderate');
    setDescription('');
    setDescriptionEn('');
    setEmergencyAction('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: AllergyCatalogueItem) => {
    if (!isOwnerOrAdmin) return;
    setEditingId(item.id);
    setName(item.name);
    setNameEn(item.nameEn || '');
    setCategory(item.category);
    setSeverity(item.severity);
    setDescription(item.description);
    setDescriptionEn(item.descriptionEn || '');
    setEmergencyAction(item.emergencyAction || '');
    setModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;
    if (!name.trim()) {
      toast.error('El nombre de la alergia es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      let updated: AllergyCatalogueItem[] = [];
      if (editingId) {
        updated = allergies.map(a =>
          a.id === editingId
            ? {
              ...a,
              name: name.trim(),
              nameEn: nameEn.trim() || undefined,
              category,
              severity,
              description: description.trim(),
              descriptionEn: descriptionEn.trim() || undefined,
              emergencyAction: emergencyAction.trim() || undefined,
            }
            : a
        );
      } else {
        const newItem: AllergyCatalogueItem = {
          id: `allergy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: name.trim(),
          nameEn: nameEn.trim() || undefined,
          category,
          severity,
          description: description.trim(),
          descriptionEn: descriptionEn.trim() || undefined,
          emergencyAction: emergencyAction.trim() || undefined,
          isDefault: false
        };
        updated = [newItem, ...allergies];
      }

      await saveAllergiesCatalogue(updated);
      setAllergies(updated);
      setModalOpen(false);
      toast.success(editingId ? 'Alergia actualizada' : 'Nueva alergia agregada al catálogo');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar alergia');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!confirmDelete.id || !isOwnerOrAdmin) return;
    try {
      const updated = allergies.filter(a => a.id !== confirmDelete.id);
      await saveAllergiesCatalogue(updated);
      setAllergies(updated);
      toast.success('Alergia eliminada del catálogo');
    } catch (err: any) {
      toast.error('Error al eliminar alergia');
    }
  };

  const getCategoryBadge = (cat: AllergyCategory) => {
    switch (cat) {
      case 'food':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20"><Utensils className="w-3 h-3" /> Alimentaria</span>;
      case 'medication':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-800 border border-rose-500/20"><Pill className="w-3 h-3" /> Medicamento</span>;
      case 'environmental':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20"><Wind className="w-3 h-3" /> Ambiental</span>;
      case 'insects':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-800 border border-orange-500/20"><Bug className="w-3 h-3" /> Picadura</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-800 border border-slate-500/20"><ShieldAlert className="w-3 h-3" /> Contacto / Otra</span>;
    }
  };

  const getSeverityBadge = (sev: AllergySeverity) => {
    switch (sev) {
      case 'severe':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white shadow-2xs">Severa / Anafiláctica</span>;
      case 'moderate':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Moderada</span>;
      case 'mild':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Leve</span>;
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
                  Catálogo Institucional de Alergias
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
                  {allergies.length} {allergies.length === 1 ? 'alergia' : 'alergias'} registradas
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Gestiona las alergias alimentarias, medicamentosas y ambientales oficiales para el control médico, nutricional y de comedor escolar.
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
                <span>Nueva Alergia</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todas las Alergias' },
            { id: 'food', label: 'Alimentarias' },
            { id: 'medication', label: 'Medicamentos' },
            { id: 'environmental', label: 'Ambientales' },
            { id: 'insects', label: 'Picaduras' },
            { id: 'contact', label: 'Contacto / Otras' },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${selectedCategory === cat.id
                  ? 'bg-forest text-white shadow-2xs font-bold'
                  : 'bg-white/80 text-forest/70 hover:bg-forest/5 border border-forest/10'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, descripción o plan..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-forest/15 text-xs text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* ALLERGIES GRID */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Cargando catálogo de alergias...
        </div>
      ) : filteredAllergies.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest/10 space-y-3">
          <AlertTriangle className="w-12 h-12 text-amber-500/40 mx-auto" />
          <h3 className="font-display font-bold text-forest text-base">No se encontraron alergias</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Prueba ajustando el término de búsqueda o registra una nueva alergia en el catálogo médico.
          </p>
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Alergia</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAllergies.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white/90 border border-forest/10 shadow-2xs hover:border-forest/30 transition-all flex flex-col justify-between space-y-3.5"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-forest text-sm">{item.name}</h4>
                      {item.nameEn && (
                        <span className="text-[10px] bg-forest/10 text-forest px-1.5 py-0.2 rounded font-semibold uppercase">
                          EN: {item.nameEn}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                      {getCategoryBadge(item.category)}
                      {getSeverityBadge(item.severity)}
                    </div>
                  </div>

                  {isOwnerOrAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-forest/70 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
                        title="Editar alergia"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ isOpen: true, id: item.id, name: item.name })}
                        className="p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar alergia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {item.emergencyAction && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/70 text-[11px] text-amber-900 space-y-0.5">
                  <strong className="block font-bold text-amber-950 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-700" />
                    <span>Plan de Acción / Protocolo:</span>
                  </strong>
                  <p className="leading-snug text-amber-900/90">{item.emergencyAction}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DRAWER FOR CREATING / EDITING ALLERGY */}
      <SlideOverDrawer
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Alergia' : 'Nueva Alergia'}
        description="Registra la información médica, categoría y protocolo escolar de atención."
        icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
      >
        <form onSubmit={handleSaveModal} className="space-y-4 p-4 text-xs font-body">
          <div className="space-y-1.5">
            <label className="block text-forest font-bold">
              Nombre de la Alergia (Español) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cacahuates / Maní"
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Nombre en Inglés (Opcional)</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Ej. Peanuts"
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-forest font-bold">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AllergyCategory)}
                className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="food">Alimentaria</option>
                <option value="medication">Medicamento</option>
                <option value="environmental">Ambiental / Polen</option>
                <option value="insects">Picaduras de Insectos</option>
                <option value="contact">Contacto / Látex</option>
                <option value="other">Otra</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-forest font-bold">Severidad Sugerida</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AllergySeverity)}
                className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="mild">Leve</option>
                <option value="moderate">Moderada</option>
                <option value="severe">Severa / Anafiláctica</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Descripción Médica / Síntomas Comunes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe síntomas característicos, alimentos o factores desencadenantes..."
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-forest font-bold">Protocolo de Emergencia / Plan de Acción Escolar</label>
            <textarea
              rows={3}
              value={emergencyAction}
              onChange={(e) => setEmergencyAction(e.target.value)}
              placeholder="Acciones inmediatas: uso de EpiPen, antihistamínicos, llamada a emergencias o aislamiento..."
              className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-forest/10">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-forest/70 hover:bg-forest/5 rounded-xl font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-forest hover:bg-forest/90 text-white rounded-xl font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Alergia'}
            </button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={confirmDelete.isOpen}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, isOpen: open }))}
        title="¿Eliminar alergia del catálogo?"
        description={`¿Estás seguro de que deseas eliminar "${confirmDelete.name}" del catálogo institucional?`}
        confirmText="Sí, Eliminar"
        variant="destructive"
        onConfirm={handleExecuteDelete}
      />

    </div>
  );
};
