import React, { useState, useEffect, useRef } from 'react';
import {
 Building2,
 MapPin,
 Globe,
 Palette,
 Upload,
 Save,
 DollarSign,
 Clock,
 MessageCircle,
 Share2,
 Sliders,
 Check,
 Sparkles,
 Eye,
 EyeOff,
 CheckCircle2,
 Radio,
 Activity,
 ChevronsUpDown
} from 'lucide-react';
import { useSiteSettings } from '@/context/SettingsContext';
import { MobileMenuButton } from './AdminDashboard';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';

type SettingsTab = 'identity' | 'website';

const COUNTRIES_AND_STATES: Record<string, string[]> = {
 'México': [
 'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
 'Chihuahua', 'Coahuila', 'Colima', 'Ciudad de México', 'Durango', 'Guanajuato',
 'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de México', 'Michoacán', 'Morelos',
 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
 'Veracruz', 'Yucatán', 'Zacatecas'
 ],
 'Colombia': [
 'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas',
 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
 ],
 'Estados Unidos': [
 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
 'Wisconsin', 'Wyoming'
 ],
 'España': [
 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Baleares',
 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real',
 'Córdoba', 'La Coruña', 'Cuenca', 'Gerona', 'Granada', 'Guadalajara', 'Guipúzcoa',
 'Huelva', 'Huesca', 'Jaén', 'León', 'Lérida', 'Lugo', 'Madrid', 'Málaga', 'Murcia',
 'Navarra', 'Orense', 'Palencia', 'Las Palmas', 'Pontevedra', 'La Rioja', 'Salamanca',
 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Santa Cruz de Tenerife', 'Teruel',
 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'
 ],
 'Otro': []
};

const ALL_COUNTRIES = [
 { name: 'Afganistán', flag: '🇦🇫' },
 { name: 'Albania', flag: '🇦🇱' },
 { name: 'Alemania', flag: '🇩🇪' },
 { name: 'Andorra', flag: '🇦🇩' },
 { name: 'Angola', flag: '🇦🇴' },
 { name: 'Antigua y Barbuda', flag: '🇦🇬' },
 { name: 'Arabia Saudita', flag: '🇸🇦' },
 { name: 'Argelia', flag: '🇩🇿' },
 { name: 'Argentina', flag: '🇦🇷' },
 { name: 'Armenia', flag: '🇦🇲' },
 { name: 'Australia', flag: '🇦🇺' },
 { name: 'Austria', flag: '🇦🇹' },
 { name: 'Azerbaiyán', flag: '🇦🇿' },
 { name: 'Bahamas', flag: '🇧🇸' },
 { name: 'Bangladés', flag: '🇧🇩' },
 { name: 'Barbados', flag: '🇧🇧' },
 { name: 'Baréin', flag: '🇧🇭' },
 { name: 'Bélgica', flag: '🇧🇪' },
 { name: 'Belice', flag: '🇧🇿' },
 { name: 'Benín', flag: '🇧🇯' },
 { name: 'Bielorrusia', flag: '🇧🇾' },
 { name: 'Birmania / Myanmar', flag: '🇲🇲' },
 { name: 'Bolivia', flag: '🇧🇴' },
 { name: 'Bosnia y Herzegovina', flag: '🇧🇦' },
 { name: 'Botsuana', flag: '🇧🇼' },
 { name: 'Brasil', flag: '🇧🇷' },
 { name: 'Brunéi', flag: '🇧🇳' },
 { name: 'Bulgaria', flag: '🇧🇬' },
 { name: 'Burkina Faso', flag: '🇧🇫' },
 { name: 'Burundi', flag: '🇧🇮' },
 { name: 'Bután', flag: '🇧🇹' },
 { name: 'Cabo Verde', flag: '🇨🇻' },
 { name: 'Camboya', flag: '🇰🇭' },
 { name: 'Camerún', flag: '🇨🇲' },
 { name: 'Canadá', flag: '🇨🇦' },
 { name: 'Catar', flag: '🇶🇦' },
 { name: 'Chad', flag: '🇹🇩' },
 { name: 'Chile', flag: '🇨🇱' },
 { name: 'China', flag: '🇨🇳' },
 { name: 'Chipre', flag: '🇨🇾' },
 { name: 'Ciudad del Vaticano', flag: '🇻🇦' },
 { name: 'Colombia', flag: '🇨🇴' },
 { name: 'Comoras', flag: '🇰🇲' },
 { name: 'Corea del Norte', flag: '🇰🇵' },
 { name: 'Corea del Sur', flag: '🇰🇷' },
 { name: 'Costa de Marfil', flag: '🇨🇮' },
 { name: 'Costa Rica', flag: '🇨🇷' },
 { name: 'Croacia', flag: '🇭🇷' },
 { name: 'Cuba', flag: '🇨🇺' },
 { name: 'Dinamarca', flag: '🇩🇰' },
 { name: 'Dominica', flag: '🇩🇲' },
 { name: 'Ecuador', flag: '🇪🇨' },
 { name: 'Egipto', flag: '🇪🇬' },
 { name: 'El Salvador', flag: '🇸🇻' },
 { name: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
 { name: 'Eritrea', flag: '🇪🇷' },
 { name: 'Eslovaquia', flag: '🇸🇰' },
 { name: 'Eslovenia', flag: '🇸🇮' },
 { name: 'España', flag: '🇪🇸' },
 { name: 'Estados Unidos', flag: '🇺🇸' },
 { name: 'Estonia', flag: '🇪🇪' },
 { name: 'Etiopía', flag: '🇪🇹' },
 { name: 'Filipinas', flag: '🇵🇭' },
 { name: 'Finlandia', flag: '🇫🇮' },
 { name: 'Fiyi', flag: '🇫🇯' },
 { name: 'Francia', flag: '🇫🇷' },
 { name: 'Gabón', flag: '🇬🇦' },
 { name: 'Gambia', flag: '🇬🇲' },
 { name: 'Georgia', flag: '🇬🇪' },
 { name: 'Ghana', flag: '🇬🇭' },
 { name: 'Granada', flag: '🇬🇩' },
 { name: 'Grecia', flag: '🇬🇷' },
 { name: 'Guatemala', flag: '🇬🇹' },
 { name: 'Guinea', flag: '🇬🇳' },
 { name: 'Guinea-Bisáu', flag: '🇬🇼' },
 { name: 'Guinea Ecuatorial', flag: '🇬🇶' },
 { name: 'Guyana', flag: '🇬🇾' },
 { name: 'Haití', flag: '🇭🇹' },
 { name: 'Honduras', flag: '🇭🇳' },
 { name: 'Hungría', flag: '🇭🇺' },
 { name: 'India', flag: '🇮🇳' },
 { name: 'Indonesia', flag: '🇮🇩' },
 { name: 'Irak', flag: '🇮🇶' },
 { name: 'Irán', flag: '🇮🇷' },
 { name: 'Irlanda', flag: '🇮🇪' },
 { name: 'Islandia', flag: '🇮🇸' },
 { name: 'Islas Marshall', flag: '🇲🇭' },
 { name: 'Islas Salomón', flag: '🇸🇧' },
 { name: 'Israel', flag: '🇮🇱' },
 { name: 'Italia', flag: '🇮🇹' },
 { name: 'Jamaica', flag: '🇯🇲' },
 { name: 'Japón', flag: '🇯🇵' },
 { name: 'Jordania', flag: '🇯🇴' },
 { name: 'Kazajistán', flag: '🇰🇿' },
 { name: 'Kenia', flag: '🇰🇪' },
 { name: 'Kirguistán', flag: '🇰🇬' },
 { name: 'Kiribati', flag: '🇰🇮' },
 { name: 'Kuwait', flag: '🇰🇼' },
 { name: 'Laos', flag: '🇱🇦' },
 { name: 'Lesoto', flag: '🇱🇸' },
 { name: 'Letonia', flag: '🇱🇻' },
 { name: 'Líbano', flag: '🇱🇧' },
 { name: 'Liberia', flag: '🇱🇷' },
 { name: 'Libia', flag: '🇱🇾' },
 { name: 'Liechtenstein', flag: '🇱🇮' },
 { name: 'Lituania', flag: '🇱🇹' },
 { name: 'Luxemburgo', flag: '🇱🇺' },
 { name: 'Macedonia del Norte', flag: '🇲🇰' },
 { name: 'Madagascar', flag: '🇲🇬' },
 { name: 'Malasia', flag: '🇲🇾' },
 { name: 'Malaui', flag: '🇲🇼' },
 { name: 'Maldivas', flag: '🇲🇻' },
 { name: 'Malí', flag: '🇲🇱' },
 { name: 'Malta', flag: '🇲🇹' },
 { name: 'Marruecos', flag: '🇲🇦' },
 { name: 'Mauricio', flag: '🇲🇺' },
 { name: 'Mauritania', flag: '🇲🇷' },
 { name: 'México', flag: '🇲🇽' },
 { name: 'Micronesia', flag: '🇫🇲' },
 { name: 'Moldavia', flag: '🇲🇩' },
 { name: 'Mónaco', flag: '🇲🇨' },
 { name: 'Mongolia', flag: '🇲🇳' },
 { name: 'Montenegro', flag: '🇲🇪' },
 { name: 'Mozambique', flag: '🇲🇿' },
 { name: 'Namibia', flag: '🇳🇦' },
 { name: 'Nauru', flag: '🇳🇷' },
 { name: 'Nepal', flag: '🇳🇵' },
 { name: 'Nicaragua', flag: '🇳🇮' },
 { name: 'Níger', flag: '🇳🇪' },
 { name: 'Nigeria', flag: '🇳🇬' },
 { name: 'Noruega', flag: '🇳🇴' },
 { name: 'Nueva Zelanda', flag: '🇳🇿' },
 { name: 'Omán', flag: '🇴🇲' },
 { name: 'Países Bajos', flag: '🇳🇱' },
 { name: 'Pakistán', flag: '🇵🇰' },
 { name: 'Palaos', flag: '🇵🇼' },
 { name: 'Panamá', flag: '🇵🇦' },
 { name: 'Papúa Nueva Guinea', flag: '🇵🇬' },
 { name: 'Paraguay', flag: '🇵🇾' },
 { name: 'Perú', flag: '🇵🇪' },
 { name: 'Polonia', flag: '🇵🇱' },
 { name: 'Portugal', flag: '🇵🇹' },
 { name: 'Reino Unido', flag: '🇬🇧' },
 { name: 'República Centroafricana', flag: 'CF' },
 { name: 'República Checa', flag: '🇨🇿' },
 { name: 'República del Congo', flag: '🇨🇬' },
 { name: 'República Democrática del Congo', flag: '🇨🇩' },
 { name: 'República Dominicana', flag: '🇩🇴' },
 { name: 'Ruanda', flag: '🇷🇼' },
 { name: 'Rumania', flag: '🇷🇴' },
 { name: 'Rusia', flag: '🇷🇺' },
 { name: 'Samoa', flag: '🇼🇸' },
 { name: 'San Cristóbal y Nieves', flag: '🇰🇳' },
 { name: 'San Marino', flag: '🇸🇲' },
 { name: 'San Vicente y las Granadinas', flag: '🇻🇨' },
 { name: 'Santa Lucía', flag: '🇱🇨' },
 { name: 'Santo Tomé y Príncipe', flag: '🇸🇹' },
 { name: 'Senegal', flag: '🇸🇳' },
 { name: 'Serbia', flag: '🇷🇸' },
 { name: 'Seychelles', flag: '🇸🇨' },
 { name: 'Sierra Leona', flag: '🇸🇱' },
 { name: 'Singapur', flag: '🇸🇬' },
 { name: 'Siria', flag: '🇸🇾' },
 { name: 'Somalia', flag: '🇸🇴' },
 { name: 'Sri Lanka', flag: '🇱🇰' },
 { name: 'Suazilandia / Esuatini', flag: '🇸🇿' },
 { name: 'Sudáfrica', flag: '🇿🇦' },
 { name: 'Sudán', flag: '🇸🇩' },
 { name: 'Sudán del Sur', flag: '🇸🇸' },
 { name: 'Suecia', flag: '🇸🇪' },
 { name: 'Suiza', flag: '🇨🇭' },
 { name: 'Surinam', flag: '🇸🇷' },
 { name: 'Tailandia', flag: '🇹🇭' },
 { name: 'Tanzania', flag: '🇹🇿' },
 { name: 'Tayikistán', flag: '🇹🇯' },
 { name: 'Timor Oriental', flag: '🇹🇱' },
 { name: 'Togo', flag: '🇹🇬' },
 { name: 'Tonga', flag: '🇹🇴' },
 { name: 'Trinidad y Tobago', flag: '🇹🇹' },
 { name: 'Túnez', flag: '🇹🇳' },
 { name: 'Turkmenistán', flag: '🇹🇲' },
 { name: 'Turquía', flag: '🇹🇷' },
 { name: 'Tuvalu', flag: '🇹🇻' },
 { name: 'Ucrania', flag: '🇺🇦' },
 { name: 'Uganda', flag: '🇺🇬' },
 { name: 'Uruguay', flag: '🇺🇾' },
 { name: 'Uzbekistán', flag: '🇺🇿' },
 { name: 'Vanuatu', flag: '🇻🇺' },
 { name: 'Venezuela', flag: '🇻🇪' },
 { name: 'Vietnam', flag: '🇻🇳' },
 { name: 'Yemen', flag: '🇾🇪' },
 { name: 'Yibuti', flag: '🇩🇯' },
 { name: 'Zambia', flag: '🇿🇲' },
 { name: 'Zimbabue', flag: '🇿🇼' }
];

export const AdminSettings: React.FC = () => {
 const { role, user, activeMembership } = useAuth();
 const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

 const { settings, updateSettings, applyBrandingCss, loading } = useSiteSettings();
 const [formData, setFormData] = useState<any>(settings);
 const [saving, setSaving] = useState(false);
 const [openCountryPopover, setOpenCountryPopover] = useState(false);
 const [openProvincePopover, setOpenProvincePopover] = useState(false);
 const [searchParams, setSearchParams] = useSearchParams();

 const activeTab = (searchParams.get('tab') as SettingsTab) || 'identity';

 useEffect(() => {
 if (settings) {
 setFormData({
 ...settings,
 schoolName: settings.school_name || settings.schoolName || activeMembership?.school.name || '',
 schoolTagline: settings.school_tagline || settings.schoolTagline || activeMembership?.school.legalName || '',
 logoUrl: settings.school_logo || settings.logoUrl || activeMembership?.school.logoUrl || '',
 primaryColor: settings.brand_primary_color || settings.primaryColor || activeMembership?.school.primaryColor || '#1b3b2b',
 secondaryColor: settings.brand_secondary_color || settings.secondaryColor || activeMembership?.school.accentColor || '#2d5a3f',
 accentColor: settings.brand_accent_color || settings.accentColor || activeMembership?.school.accentColor || '#c89550',
 buttonRadius: settings.button_radius || settings.buttonRadius || 'full',
 buttonHeight: settings.button_height || settings.buttonHeight || 'md',
 school_country: settings.school_country || activeMembership?.school.country || 'México',
 school_province: settings.school_province || activeMembership?.school.province || '',
 school_city: settings.school_city || activeMembership?.school.city || '',
 school_address: settings.school_address || activeMembership?.school.address || '',
 school_postal_code: settings.school_postal_code || '',
 school_currency: settings.school_currency || activeMembership?.school.currency || 'MXN',
 school_currency_symbol: settings.school_currency_symbol || '$',
 school_timezone: settings.school_timezone || 'America/Cancun',
 contact_phone: settings.contact_phone || settings.contactPhone || activeMembership?.school.phone || '',
 contact_email: settings.contact_email || settings.contactEmail || activeMembership?.school.email || '',
 });
 }
 }, [settings, activeMembership]);

 const handleTabChange = (tab: SettingsTab) => {
 setSearchParams({ tab });
 };

 const handleInputChange = (field: string, value: any) => {
 setFormData((prev: any) => {
 const next = { ...prev, [field]: value };
 if (field === 'primaryColor') next.brand_primary_color = value;
 if (field === 'secondaryColor') next.brand_secondary_color = value;
 if (field === 'accentColor') next.brand_accent_color = value;
 if (field === 'buttonRadius') next.button_radius = value;
 if (field === 'buttonHeight') next.button_height = value;
 if (field === 'schoolName') next.school_name = value;
 if (field === 'schoolTagline') next.school_tagline = value;
 if (field === 'logoUrl') next.school_logo = value;

 // Real-time live styling feedback across the entire panel
 if (['primaryColor', 'secondaryColor', 'accentColor', 'buttonRadius', 'brand_primary_color', 'brand_secondary_color', 'brand_accent_color', 'button_radius'].includes(field)) {
 applyBrandingCss(
 next.primaryColor || next.brand_primary_color,
 next.secondaryColor || next.brand_secondary_color,
 next.accentColor || next.brand_accent_color,
 next.buttonRadius || next.button_radius
 );
 }
 return next;
 });
 };

 const handleSocialChange = (network: string, value: string) => {
 setFormData((prev: any) => ({
 ...prev,
 socialLinks: {
 ...prev.socialLinks,
 [network]: value
 }
 }));
 };

 const handlePublicMenuToggle = (menuKey: string) => {
 setFormData((prev: any) => ({
 ...prev,
 publicMenus: {
 ...prev.publicMenus,
 [menuKey]: !prev.publicMenus?.[menuKey]
 }
 }));
 };

 const fileInputRef = useRef<HTMLInputElement>(null);
 const [uploadingLogo, setUploadingLogo] = useState(false);

 const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (!file.type.startsWith('image/')) {
 toast.error('El archivo seleccionado debe ser una imagen (PNG, JPG, SVG, WebP)');
 return;
 }

 if (file.size > 2 * 1024 * 1024) {
 toast.error('La imagen no debe superar los 2MB de tamaño');
 return;
 }

 setUploadingLogo(true);
 const reader = new FileReader();
 reader.onload = (event) => {
 const base64 = event.target?.result as string;
 handleInputChange('logoUrl', base64);
 setUploadingLogo(false);
 toast.success('Logotipo cargado correctamente (recuerda Guardar Cambios)');
 };
 reader.onerror = () => {
 setUploadingLogo(false);
 toast.error('Error al procesar la imagen');
 };
 reader.readAsDataURL(file);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!isOwnerOrAdmin) return;
 setSaving(true);
 try {
 const payload: Record<string, string> = {
 ...formData,
 school_name: formData.schoolName || formData.school_name || '',
 school_tagline: formData.schoolTagline || formData.school_tagline || '',
 school_logo: formData.logoUrl || formData.school_logo || '',
 brand_primary_color: formData.primaryColor || formData.brand_primary_color || '#1b3b2b',
 brand_secondary_color: formData.secondaryColor || formData.brand_secondary_color || '#2d5a3f',
 brand_accent_color: formData.accentColor || formData.brand_accent_color || '#c89550',
 button_radius: formData.buttonRadius || formData.button_radius || 'full',
 button_height: formData.buttonHeight || formData.button_height || 'md',
 };
 await updateSettings(payload);
 toast.success('Configuración y estilos del colegio guardados exitosamente');
 } catch (error: any) {
 toast.error(error.message || 'Error al guardar configuración');
 } finally {
 setSaving(false);
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
 Configuración del Colegio
 </h1>
 <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
 {formData.schoolName || 'Mi Colegio'}
 </span>
 </div>
 <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
 Administra la identidad institucional, logotipo, paleta de colores, sede física, contacto y presencia web.
 </p>
 </div>
 </div>

 <div className="relative z-10 flex items-center gap-2 shrink-0">
 {isOwnerOrAdmin && (
 <button
 type="button"
 onClick={handleSubmit}
 disabled={saving}
 className="px-5 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
 >
 <Save className="w-4 h-4 text-forest" />
 <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
 </button>
 )}
 </div>
 </div>
 </div>

 {/* TOP NAVIGATION TABS */}
 <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex items-center gap-1 sm:gap-2 border-b border-forest/10 pb-px overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap active:cursor-grab select-none touch-pan-x">
 <button
 type="button"
 onClick={() => handleTabChange('identity')}
 className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-none sm:rounded-t-2xl transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'identity'
 ? 'border-forest text-forest bg-transparent font-bold'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <Building2 className="w-4 h-4" />
 <span>Identidad, Colores & Dirección</span>
 </button>

 <button
 type="button"
 onClick={() => handleTabChange('website')}
 className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-none sm:rounded-t-2xl transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'website'
 ? 'border-forest text-forest bg-transparent font-bold'
 : 'border-transparent text-muted-foreground hover:text-forest'
 }`}
 >
 <Globe className="w-4 h-4" />
 <span>Sitio Web, Contacto & Redes</span>
 </button>
 </div>

 {/* TAB 1: IDENTIDAD, COLORES & DIRECCIÓN */}
 {activeTab === 'identity' && (
 <div className="space-y-6 animate-in fade-in">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

 {/* Identity & Logo */}
 <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
 <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
 <Building2 className="w-4 h-4 text-forest" />
 <span>Identidad Institucional</span>
 </h3>

 <div className="space-y-3 text-xs">
 <div className="space-y-1">
 <label className="block text-forest font-bold">Nombre Oficial del Colegio</label>
 <input
 type="text"
 value={formData.schoolName}
 onChange={(e) => handleInputChange('schoolName', e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Lema / Razón Social</label>
 <input
 type="text"
 value={formData.schoolTagline || ''}
 onChange={(e) => handleInputChange('schoolTagline', e.target.value)}
 placeholder="Ej. Comunidad de Aprendizaje Montessori"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>

 {/* Logo Uploader Dropzone */}
 <div className="space-y-1.5 pt-2">
 <label className="block text-forest font-bold">Logotipo del Colegio</label>
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-forest/20 bg-cream/40 flex items-center justify-center overflow-hidden shrink-0">
 {formData.logoUrl ? (
 <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
 ) : (
 <Building2 className="w-6 h-6 text-forest/40" />
 )}
 </div>
 <div className="space-y-1 flex-1">
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleLogoUpload}
 accept="image/*"
 className="hidden"
 />
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 disabled={uploadingLogo}
 className="px-3 py-1.5 bg-forest/10 hover:bg-forest/20 text-forest rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
 >
 <Upload className="w-3.5 h-3.5" />
 <span>{uploadingLogo ? 'Cargando...' : 'Subir Logotipo'}</span>
 </button>
 <p className="text-[10px] text-muted-foreground">PNG, JPG, SVG o WebP (Máx. 2MB)</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Colors & UI Styles */}
 <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
 <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
 <Palette className="w-4 h-4 text-forest" />
 <span>Paleta de Colores & Estilos Visuales</span>
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
 <div className="space-y-1.5">
 <label className="block text-forest font-bold">Primario</label>
 <div className="flex items-center gap-2">
 <input
 type="color"
 value={formData.primaryColor || '#1b3b2b'}
 onChange={(e) => handleInputChange('primaryColor', e.target.value)}
 className="w-8 h-8 rounded-lg cursor-pointer border border-forest/20 p-0.5 bg-white shrink-0"
 />
 <input
 type="text"
 value={formData.primaryColor || '#1b3b2b'}
 onChange={(e) => handleInputChange('primaryColor', e.target.value)}
 className="w-full p-2 rounded-xl border border-forest/20 font-mono text-[11px] text-forest"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="block text-forest font-bold">Secundario</label>
 <div className="flex items-center gap-2">
 <input
 type="color"
 value={formData.secondaryColor || '#2d5a3f'}
 onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
 className="w-8 h-8 rounded-lg cursor-pointer border border-forest/20 p-0.5 bg-white shrink-0"
 />
 <input
 type="text"
 value={formData.secondaryColor || '#2d5a3f'}
 onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
 className="w-full p-2 rounded-xl border border-forest/20 font-mono text-[11px] text-forest"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="block text-forest font-bold">Acento</label>
 <div className="flex items-center gap-2">
 <input
 type="color"
 value={formData.accentColor || '#c89550'}
 onChange={(e) => handleInputChange('accentColor', e.target.value)}
 className="w-8 h-8 rounded-lg cursor-pointer border border-forest/20 p-0.5 bg-white shrink-0"
 />
 <input
 type="text"
 value={formData.accentColor || '#c89550'}
 onChange={(e) => handleInputChange('accentColor', e.target.value)}
 className="w-full p-2 rounded-xl border border-forest/20 font-mono text-[11px] text-forest"
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
 <div className="space-y-1">
 <label className="block text-forest font-bold">Redondeo de Botones</label>
 <select
 value={formData.buttonRadius || 'full'}
 onChange={(e) => handleInputChange('buttonRadius', e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs cursor-pointer focus:outline-none"
 >
 <option value="none">Cuadrado (0px)</option>
 <option value="sm">Suave (4px)</option>
 <option value="md">Medio (8px)</option>
 <option value="lg">Pronunciado (12px)</option>
 <option value="full">Píldora (Redondo Completo)</option>
 </select>
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Altura de Botones</label>
 <select
 value={formData.buttonHeight || 'md'}
 onChange={(e) => handleInputChange('buttonHeight', e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs cursor-pointer focus:outline-none"
 >
 <option value="sm">Compacto</option>
 <option value="md">Estándar</option>
 <option value="lg">Grande</option>
 </select>
 </div>
 </div>
 </div>

 {/* Location & Physical Address */}
 <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
 <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
 <MapPin className="w-4 h-4 text-forest" />
 <span>Ubicación & Sede Física</span>
 </h3>

 <div className="space-y-3 text-xs">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="space-y-1">
 <label className="block text-forest font-bold">País</label>
 <Popover open={openCountryPopover} onOpenChange={setOpenCountryPopover}>
 <PopoverTrigger asChild>
 <button
 type="button"
 className="w-full h-[38px] px-3 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer font-semibold shadow-2xs flex items-center justify-between"
 >
 <span className="flex items-center gap-2">
 {(() => {
 const selected = ALL_COUNTRIES.find(c => c.name === (formData.school_country || 'México'));
 return selected ? `${selected.flag} ${selected.name}` : formData.school_country || 'México';
 })()}
 </span>
 <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 text-forest" />
 </button>
 </PopoverTrigger>
 <PopoverContent className="w-[260px] p-0 bg-white border border-forest/15 rounded-2xl shadow-xl z-50 overflow-hidden" align="start">
 <Command className="bg-white">
 <CommandInput placeholder="Buscar país..." className="h-9 text-xs border-b border-forest/10 focus:ring-0 focus:outline-none placeholder:text-muted-foreground bg-transparent w-full text-forest py-2 px-3 font-medium" />
 <CommandList className="max-h-60 overflow-y-auto">
 <CommandEmpty className="py-4 text-center text-xs text-muted-foreground font-semibold">
 No se encontraron países.
 </CommandEmpty>
 <CommandGroup className="p-1">
 {ALL_COUNTRIES.map((c) => (
 <CommandItem
 key={c.name}
 value={c.name}
 onSelect={(currentValue) => {
 handleInputChange('school_country', currentValue);
 const states = COUNTRIES_AND_STATES[currentValue] || [];
 handleInputChange('school_province', states[0] || '');
 setOpenCountryPopover(false);
 }}
 className="flex items-center justify-between text-xs text-forest cursor-pointer rounded-xl font-semibold px-3 py-2 data-[selected='true']:bg-forest data-[selected='true']:text-white group transition-colors"
 >
 <span className="flex items-center gap-2">
 <span>{c.flag}</span>
 <span>{c.name}</span>
 </span>
 {formData.school_country === c.name && (
 <Check className="h-3.5 w-3.5 font-bold text-forest group-data-[selected='true']:text-white" />
 )}
 </CommandItem>
 ))}
 </CommandGroup>
 </CommandList>
 </Command>
 </PopoverContent>
 </Popover>
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Estado / Provincia</label>
 {COUNTRIES_AND_STATES[formData.school_country || 'México']?.length > 0 ? (
 <Popover open={openProvincePopover} onOpenChange={setOpenProvincePopover}>
 <PopoverTrigger asChild>
 <button
 type="button"
 className="w-full h-[38px] px-3 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer font-semibold shadow-2xs flex items-center justify-between"
 >
 <span>{formData.school_province || 'Selecciona un estado'}</span>
 <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 text-forest" />
 </button>
 </PopoverTrigger>
 <PopoverContent className="w-[260px] p-0 bg-white border border-forest/15 rounded-2xl shadow-xl z-50 overflow-hidden" align="start">
 <Command className="bg-white">
 <CommandInput placeholder="Buscar estado..." className="h-9 text-xs border-b border-forest/10 focus:ring-0 focus:outline-none placeholder:text-muted-foreground bg-transparent w-full text-forest py-2 px-3 font-medium" />
 <CommandList className="max-h-60 overflow-y-auto">
 <CommandEmpty className="py-4 text-center text-xs text-muted-foreground font-semibold">
 No se encontraron estados.
 </CommandEmpty>
 <CommandGroup className="p-1">
 {(COUNTRIES_AND_STATES[formData.school_country || 'México'] || []).map((st) => (
 <CommandItem
 key={st}
 value={st}
 onSelect={(currentValue) => {
 const matchedState = (COUNTRIES_AND_STATES[formData.school_country || 'México'] || []).find(
 s => s.toLowerCase() === currentValue.toLowerCase()
 ) || currentValue;
 handleInputChange('school_province', matchedState);
 setOpenProvincePopover(false);
 }}
 className="flex items-center justify-between text-xs text-forest cursor-pointer rounded-xl font-semibold px-3 py-2 data-[selected='true']:bg-forest data-[selected='true']:text-white group transition-colors"
 >
 <span>{st}</span>
 {formData.school_province === st && (
 <Check className="h-3.5 w-3.5 font-bold text-forest group-data-[selected='true']:text-white" />
 )}
 </CommandItem>
 ))}
 </CommandGroup>
 </CommandList>
 </Command>
 </PopoverContent>
 </Popover>
 ) : (
 <input
 type="text"
 value={formData.school_province || ''}
 onChange={(e) => handleInputChange('school_province', e.target.value)}
 placeholder="Ingresa el Estado o Provincia"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest font-medium"
 />
 )}
 </div>
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Dirección Física</label>
 <input
 type="text"
 value={formData.school_address || ''}
 onChange={(e) => handleInputChange('school_address', e.target.value)}
 placeholder="Calle, Número y Colonia"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest font-medium"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="space-y-1">
 <label className="block text-forest font-bold">Ciudad / Municipio</label>
 <input
 type="text"
 value={formData.school_city || ''}
 onChange={(e) => handleInputChange('school_city', e.target.value)}
 placeholder="Ej. Mérida o Cancún"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest font-medium"
 />
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Código Postal</label>
 <input
 type="text"
 value={formData.school_postal_code || ''}
 onChange={(e) => handleInputChange('school_postal_code', e.target.value)}
 placeholder="Ej. 97000"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest font-medium"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Regional & Currency */}
 <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
 <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
 <DollarSign className="w-4 h-4 text-forest" />
 <span>Moneda & Parámetros Regionales</span>
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div className="space-y-1">
 <label className="block text-forest font-bold">Código de Moneda (ISO)</label>
 <input
 type="text"
 value={formData.currency || 'MXN'}
 onChange={(e) => handleInputChange('currency', e.target.value.toUpperCase())}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest uppercase"
 />
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Símbolo de Moneda</label>
 <input
 type="text"
 value={formData.currencySymbol || '$'}
 onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>

 <div className="space-y-1 sm:col-span-2">
 <label className="block text-forest font-bold">Zona Horaria</label>
 <select
 value={formData.timezone || 'America/Merida'}
 onChange={(e) => handleInputChange('timezone', e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs cursor-pointer focus:outline-none"
 >
 <option value="America/Merida">America/Merida (CST - UTC-6)</option>
 <option value="America/Mexico_City">America/Mexico_City (CST - UTC-6)</option>
 <option value="America/Cancun">America/Cancun (EST - UTC-5)</option>
 <option value="America/Tijuana">America/Tijuana (PST - UTC-8)</option>
 <option value="America/Monterrey">America/Monterrey (CST - UTC-6)</option>
 </select>
 </div>
 </div>
 </div>

 </div>
 </div>
 )}

 {/* TAB 2: SITIO WEB, CONTACTO & REDES */}
 {activeTab === 'website' && (
 <div className="space-y-6 animate-in fade-in">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

 {/* Floating Action Button / CTA Contact */}
 <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
 <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
 <MessageCircle className="w-4 h-4 text-forest" />
 <span>Botón Flotante de Contacto en Web Pública</span>
 </h3>

 <div className="space-y-3 text-xs">
 <div className="space-y-1">
 <label className="block text-forest font-bold">Modo del Botón Flotante</label>
 <select
 value={formData.floatingCtaMode || 'whatsapp'}
 onChange={(e) => handleInputChange('floatingCtaMode', e.target.value)}
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs cursor-pointer focus:outline-none"
 >
 <option value="whatsapp"> WhatsApp Directo</option>
 <option value="widget"> Widget de Preguntas Rápidas (FAQ)</option>
 <option value="hidden"> Ocultar botón flotante</option>
 </select>
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Número de WhatsApp (con lada)</label>
 <input
 type="text"
 value={formData.whatsappNumber || ''}
 onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
 placeholder="+52 999 123 4567"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Mensaje Predefinido de WhatsApp</label>
 <textarea
 rows={2}
 value={formData.whatsappMessage || ''}
 onChange={(e) => handleInputChange('whatsappMessage', e.target.value)}
 placeholder="Hola, me gustaría recibir informes sobre las admisiones..."
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>
 </div>
 </div>

 {/* Social Media Links */}
 <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
 <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
 <Share2 className="w-4 h-4 text-forest" />
 <span>Redes Sociales Oficiales</span>
 </h3>

 <div className="space-y-3 text-xs">
 <div className="space-y-1">
 <label className="block text-forest font-bold">Instagram (URL o @usuario)</label>
 <input
 type="text"
 value={formData.socialLinks?.instagram || ''}
 onChange={(e) => handleSocialChange('instagram', e.target.value)}
 placeholder="https://instagram.com/ceibaroots"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">Facebook (URL)</label>
 <input
 type="text"
 value={formData.socialLinks?.facebook || ''}
 onChange={(e) => handleSocialChange('facebook', e.target.value)}
 placeholder="https://facebook.com/ceibaroots"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>

 <div className="space-y-1">
 <label className="block text-forest font-bold">YouTube (Canal o URL)</label>
 <input
 type="text"
 value={formData.socialLinks?.youtube || ''}
 onChange={(e) => handleSocialChange('youtube', e.target.value)}
 placeholder="https://youtube.com/@ceibaroots"
 className="w-full p-2.5 rounded-xl border border-forest/20 text-forest bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
 />
 </div>
 </div>
 </div>

 {/* Public Menus Visibility */}
 <div className="bg-white/90 rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4 lg:col-span-2">
 <h3 className="font-display font-bold text-forest text-sm flex items-center gap-2 border-b border-forest/10 pb-3">
 <Globe className="w-4 h-4 text-forest" />
 <span>Visibilidad de Secciones en la Barra de Navegación Pública</span>
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
 {[
 { key: 'showPedagogy' as const, label: ' Pedagogía & Método' },
 { key: 'showEnvironments' as const, label: ' Ambientes & Salones' },
 { key: 'showAdmissions' as const, label: ' Proceso de Admisión' },
 { key: 'showGallery' as const, label: ' Galería Web' },
 { key: 'showContact' as const, label: ' Contacto & Sede' },
 ].map(item => {
 const isChecked = !!formData.publicMenus?.[item.key];
 return (
 <label
 key={item.key}
 className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${isChecked
 ? 'border-forest bg-forest/5 font-bold text-forest'
 : 'border-forest/10 bg-white text-muted-foreground'
 }`}
 >
 <span>{item.label}</span>
 <input
 type="checkbox"
 checked={isChecked}
 onChange={() => handlePublicMenuToggle(item.key)}
 className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest"
 />
 </label>
 );
 })}
 </div>
 </div>

 </div>
 </div>
 )}

 </div>
 );
};

