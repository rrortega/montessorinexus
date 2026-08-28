import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Palette, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Upload, 
  Globe, 
  Phone, 
  Mail, 
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { createSchool, School } from '@/lib/sqlite';
import { useAuth } from '@/context/AuthContext';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { toast } from 'sonner';

interface CreateSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PRIMARY_COLORS = [
  { name: 'Forest Green', hex: '#1b3b2b' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Royal Purple', hex: '#581c87' },
  { name: 'Deep Burgundy', hex: '#881337' },
  { name: 'Slate Dark', hex: '#0f172a' },
  { name: 'Warm Chocolate', hex: '#451a03' },
];

const PRESET_ACCENT_COLORS = [
  { name: 'Terracotta', hex: '#c86d51' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Sky Cyan', hex: '#0284c7' },
  { name: 'Rose Pink', hex: '#e11d48' },
  { name: 'Violet', hex: '#7c3aed' },
];

export const CreateSchoolModal: React.FC<CreateSchoolModalProps> = ({ isOpen, onClose }) => {
  const { user, memberships, activeMembership } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic info & Location
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [country, setCountry] = useState('México');
  const [province, setProvince] = useState('Quintana Roo');
  const [city, setCity] = useState('Cancún');
  const [address, setAddress] = useState('');
  const [mapLat, setMapLat] = useState('');
  const [mapLng, setMapLng] = useState('');

  // Step 2: Branding & Brief (Optional)
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1b3b2b');
  const [accentColor, setAccentColor] = useState('#c86d51');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del colegio es obligatorio.');
      return;
    }
    setStep(2);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapLat(pos.coords.latitude.toFixed(6));
          setMapLng(pos.coords.longitude.toFixed(6));
          toast.success('Coordenadas detectadas correctamente.');
        },
        () => {
          toast.error('No se pudo obtener la ubicación actual.');
        }
      );
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload: Partial<School> & { creatorEmail?: string } = {
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        country: country.trim() || undefined,
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        mapLat: mapLat ? parseFloat(mapLat) : null,
        mapLng: mapLng ? parseFloat(mapLng) : null,
        logoUrl: logoUrl.trim() || undefined,
        primaryColor,
        accentColor,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        creatorEmail: user?.email,
      };

      const newSchool = await createSchool(payload);
      toast.success(`¡Colegio "${newSchool.name}" creado con éxito!`);
      
      // Update session localStorage and reload to switch to new workspace
      const newMembership = {
        id: `mem_${newSchool.id}`,
        userId: user?.id || '',
        schoolId: newSchool.id,
        role: 'OWNER' as const,
        school: newSchool
      };

      const updatedMemberships = [...memberships, newMembership];
      localStorage.setItem('ceiba_user_memberships', JSON.stringify(updatedMemberships));
      localStorage.setItem('ceiba_active_membership', JSON.stringify(newMembership));
      localStorage.setItem('ceiba_active_school_id', newSchool.id);
      localStorage.setItem('ceiba_active_school_slug', newSchool.slug);

      onClose();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al crear el colegio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-forest/10 animate-in fade-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-forest p-1.5 rounded-full hover:bg-forest/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Header & Steps */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-forest/70 bg-forest/10 px-2.5 py-0.5 rounded-full">
              Superadmin • Multi-Tenant
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-forest flex items-center gap-2">
            <Building2 className="w-6 h-6 text-forest" />
            Crear Nuevo Colegio
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Registra una nueva institución para generar su espacio de trabajo y base de datos multi-tenant.
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-forest' : 'bg-forest/10'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-forest' : 'bg-forest/10'}`} />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-1 px-1">
            <span className={step === 1 ? 'text-forest' : ''}>1. Datos & Ubicación</span>
            <span className={step === 2 ? 'text-forest' : ''}>2. Branding & Brief (Opcional)</span>
          </div>
        </div>

        {/* STEP 1: Basic Info & Location */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="bg-cream/40 p-4 rounded-2xl border border-forest/10 space-y-3">
              <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                Datos Generales
              </span>

              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Nombre del Colegio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roble Montessori School"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-forest/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Razón Social / Nombre Legal (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Educación Montessori de México S.C."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-forest/15 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 bg-white"
                />
              </div>
            </div>

            <div className="bg-cream/40 p-4 rounded-2xl border border-forest/10 space-y-3">
              <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                Ubicación Geográfica
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">País</label>
                  <input
                    type="text"
                    placeholder="México"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-forest/15 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Estado / Provincia</label>
                  <input
                    type="text"
                    placeholder="Quintana Roo"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-forest/15 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Cancún"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-forest/15 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Dirección del Campus</label>
                <input
                  type="text"
                  placeholder="Ej. Av. Huayacán SM 307 MZ 30 LT 1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-forest/15 text-xs bg-white"
                />
              </div>

              <div className="pt-2 border-t border-forest/5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Coordenadas GPS (Lat / Lng)</label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" /> Auto-detectar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Lat: 21.10039"
                    value={mapLat}
                    onChange={(e) => setMapLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-forest/15 text-xs font-mono bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Lng: -86.85917"
                    value={mapLng}
                    onChange={(e) => setMapLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-forest/15 text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-forest/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold bg-forest text-white hover:bg-forest/90 rounded-xl flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <span>Siguiente: Branding</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Branding & Brief (Optional) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-cream/40 p-4 rounded-2xl border border-forest/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                  Identidad Visual & Colores
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">Paso Opcional</span>
              </div>

              {/* Pro Max Logo Dropzone */}
              <ImageUploadDropzone
                value={logoUrl}
                onChange={setLogoUrl}
                label="Logotipo / Isotipo Institucional"
                helperText="Arrastra y suelta el escudo o logotipo del colegio (PNG, SVG, JPG)"
                aspectRatio="square"
              />

              {/* Color Presets */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-muted-foreground">Color Primario Institucional</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_PRIMARY_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPrimaryColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        primaryColor === c.hex ? 'border-forest scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {primaryColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-forest/15 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground">{primaryColor}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-muted-foreground">Color de Acento / Botones</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_ACCENT_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setAccentColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        accentColor === c.hex ? 'border-forest scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {accentColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-forest/15 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground">{accentColor}</span>
                </div>
              </div>
            </div>

            <div className="bg-cream/40 p-4 rounded-2xl border border-forest/10 space-y-3">
              <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                Canales de Atención y Contacto
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+52 998 350 2849"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-forest/15 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Email Institucional</label>
                  <input
                    type="email"
                    placeholder="contacto@colegio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-forest/15 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Wizard Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-forest/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-forest/5 rounded-xl flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-forest hover:bg-forest/5 rounded-xl"
                >
                  Omitir & Finalizar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-bold bg-forest text-white hover:bg-forest/90 rounded-xl flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {loading ? 'Creando Colegio...' : 'Crear y Activar Colegio'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
