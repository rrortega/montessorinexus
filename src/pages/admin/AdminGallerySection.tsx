import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
 Images,
 Plus,
 Trash2,
 Edit3,
 FolderPlus,
 Image as ImageIcon,
 Tag,
 Filter,
 Search,
 X,
 RefreshCw,
 Eye,
 EyeOff,
 Sparkles,
 Lock,
 Wand2,
 Loader2,
 Languages,
 CheckCircle2,
 Folder,
 Layers,
 Bot,
 Globe,
 Users,
 AlertTriangle,
 ScanFace,
 ShieldAlert,
 ShieldCheck,
 UserCheck,
 UserX
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import {
 getGalleryCategories,
 getGalleryImages,
 createGalleryCategory,
 updateGalleryCategory,
 deleteGalleryCategory,
 createGalleryImage,
 updateGalleryImage,
 deleteGalleryImage,
 migrateHardcodedGallery,
 retryGalleryImageAi,
 retryAllFailedGalleryAi,
 verifyGalleryImageConsent,
 scanAllGalleryConsents,
 GalleryCategory,
 GalleryImageItem,
 DetectedFaceItem,
 getStudents,
 StudentItem
} from '@/lib/sqlite';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { uploadPhysicalFile, deletePhysicalFile, generateGalleryMetadata } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectLabel,
 SelectSeparator,
 SelectTrigger,
 SelectValue
} from '@/components/ui/select';
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger
} from '@/components/ui/tooltip';
import { useSiteSettings } from '@/context/SettingsContext';
import { getLanguageByCode } from './web-builder/languages';

// Dynamic Face Crop Avatar: Renders the precise facial tile extracted directly from the photo
const FaceCropAvatar: React.FC<{
 imageSrc: string;
 box?: DetectedFaceItem['box'];
 avatarUrl?: string | null;
 fallbackText?: string;
 className?: string;
}> = ({ imageSrc, box, avatarUrl, fallbackText = '?', className = '' }) => {
 // If we have box percentages, crop the exact face tile directly from the photo
 if (box && typeof box.wPercent === 'number' && typeof box.hPercent === 'number' && box.wPercent > 0 && box.hPercent > 0) {
 const pad = 6;
 const w = Math.min(100, Math.max(1, box.wPercent + pad * 2));
 const h = Math.min(100, Math.max(1, box.hPercent + pad * 2));
 const x = Math.max(0, box.xPercent - pad);
 const y = Math.max(0, box.yPercent - pad);

 const widthPercent = (100 / w) * 100;
 const heightPercent = (100 / h) * 100;
 const leftPercent = -(x / w) * 100;
 const topPercent = -(y / h) * 100;

 return (
 <div className={`relative overflow-hidden bg-slate-900 select-none ${className}`}>
 <img
 src={imageSrc}
 alt=""
 className="absolute pointer-events-none max-w-none max-h-none object-cover transition-transform duration-300"
 style={{
 width: `${widthPercent}%`,
 height: `${heightPercent}%`,
 left: `${leftPercent}%`,
 top: `${topPercent}%`
 }}
 />
 </div>
 );
 }

 // If student has a profile avatar
 if (avatarUrl) {
 return (
 <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
 <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
 </div>
 );
 }

 // Fallback icon / initials
 return (
 <div className={`relative overflow-hidden bg-slate-200 text-slate-600 flex items-center justify-center font-bold ${className}`}>
 {fallbackText && fallbackText !== '?' ? (
 <span className="text-[10px] uppercase">{fallbackText}</span>
 ) : (
 <Users className="w-1/2 h-1/2 text-slate-400" />
 )}
 </div>
 );
};

// Helper function to compress high-res image files to ~100-200 KB for fast storage
const compressImageFile = (file: File, maxWidth = 1200, quality = 0.82): Promise<string> => {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = (e) => {
 const img = new Image();
 img.onload = () => {
 const canvas = document.createElement('canvas');
 let width = img.width;
 let height = img.height;

 if (width > maxWidth || height > maxWidth) {
 if (width > height) {
 height = Math.round((height * maxWidth) / width);
 width = maxWidth;
 } else {
 width = Math.round((width * maxWidth) / height);
 height = maxWidth;
 }
 }

 canvas.width = width;
 canvas.height = height;

 const ctx = canvas.getContext('2d');
 if (!ctx) {
 resolve(e.target?.result as string);
 return;
 }

 ctx.drawImage(img, 0, 0, width, height);
 resolve(canvas.toDataURL('image/jpeg', quality));
 };
 img.onerror = () => reject(new Error('Failed to load image for compression'));
 img.src = e.target?.result as string;
 };
 reader.onerror = (err) => reject(err);
 reader.readAsDataURL(file);
 });
};

export const AdminGallerySection: React.FC = () => {
  const { role, activeMembership } = useAuth();
  const { settings } = useSiteSettings();
  const isOwnerOrSuperAdmin = role === 'OWNER' || role === 'SUPERADMIN' || activeMembership?.role === 'OWNER';
  const isOwnerOrAdmin = isOwnerOrSuperAdmin || role === 'ADMIN' || activeMembership?.role === 'ADMIN';

 // Configured languages from Web Builder
 const activeLangs = useMemo(() => {
 const raw = settings?.header_enabled_langs || 'es,en';
 const codes = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
 if (codes.length === 0) codes.push('es', 'en');
 if (!codes.includes('es')) codes.unshift('es');
 return codes.map(getLanguageByCode);
 }, [settings?.header_enabled_langs]);

 const [categories, setCategories] = useState<GalleryCategory[]>([]);
 const [images, setImages] = useState<GalleryImageItem[]>([]);
 const [activeCat, setActiveCat] = useState<string>('all');
 const [loading, setLoading] = useState(true);

 // Lightbox / Image Preview Modal for non-admin viewers and admins alike
 const [previewImage, setPreviewImage] = useState<GalleryImageItem | null>(null);

 // Mobile Action Sheet State & Gesture (Only for Admins)
 const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
 const [sheetDragY, setSheetDragY] = useState(0);
 const [isSheetDragging, setIsSheetDragging] = useState(false);
 const sheetTouchStartY = useRef(0);

 useEffect(() => {
 if (!mobileActionsOpen) {
 setSheetDragY(0);
 setIsSheetDragging(false);
 return;
 }

 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';

 const stateId = 'gallery-actions-sheet-' + Date.now();
 window.history.pushState({ modalId: stateId }, '');

 const handlePopState = () => {
 setMobileActionsOpen(false);
 };

 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 setMobileActionsOpen(false);
 }
 };

 window.addEventListener('popstate', handlePopState);
 window.addEventListener('keydown', handleKeyDown);

 return () => {
 document.body.style.overflow = originalOverflow;
 window.removeEventListener('popstate', handlePopState);
 window.removeEventListener('keydown', handleKeyDown);
 };
 }, [mobileActionsOpen]);

 const handleSheetTouchStart = (e: React.TouchEvent) => {
 sheetTouchStartY.current = e.touches[0].clientY;
 setIsSheetDragging(true);
 };

 const handleSheetTouchMove = (e: React.TouchEvent) => {
 const currentY = e.touches[0].clientY;
 const diff = currentY - sheetTouchStartY.current;
 if (diff > 0) {
 setSheetDragY(diff);
 }
 };

 const handleSheetTouchEnd = () => {
 setIsSheetDragging(false);
 if (sheetDragY > 40) {
 setMobileActionsOpen(false);
 }
 setSheetDragY(0);
 };

 // Search Bar State
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');

 // Image Modal State (Only for Admins)
 const [isImageModalOpen, setIsImageModalOpen] = useState(false);
 const [editingImage, setEditingImage] = useState<GalleryImageItem | null>(null);
 const [selectedCatId, setSelectedCatId] = useState<string>('');
 const [title, setTitle] = useState('');
 const [titleEn, setTitleEn] = useState('');
 const [description, setDescription] = useState('');
 const [descriptionEn, setDescriptionEn] = useState('');
 const [translations, setTranslations] = useState<Record<string, { title: string; description: string }>>({});
 const [srcUrl, setSrcUrl] = useState('');
 const [srcFile, setSrcFile] = useState<File | null>(null);
 const [langTab, setLangTab] = useState<string>('es');

 // Helpers for reading/writing dynamic language fields
 const getTitleForLang = (code: string) => {
 if (translations[code]?.title) return translations[code].title;
 if (code === 'es') return title;
 if (code === 'en') return titleEn;
 return '';
 };

 const getDescriptionForLang = (code: string) => {
 if (translations[code]?.description) return translations[code].description;
 if (code === 'es') return description;
 if (code === 'en') return descriptionEn;
 return '';
 };

 const setFieldForLang = (code: string, field: 'title' | 'description', value: string) => {
 setTranslations(prev => {
 const current = prev[code] || {
 title: code === 'es' ? title : (code === 'en' ? titleEn : ''),
 description: code === 'es' ? description : (code === 'en' ? descriptionEn : '')
 };
 return {
 ...prev,
 [code]: {
 ...current,
 [field]: value
 }
 };
 });

 if (code === 'es') {
 if (field === 'title') setTitle(value);
 if (field === 'description') setDescription(value);
 } else if (code === 'en') {
 if (field === 'title') setTitleEn(value);
 if (field === 'description') setDescriptionEn(value);
 }
 };

 // Category Modal State (Multilingual & Edit/Create Support)
 const [isCatModalOpen, setIsCatModalOpen] = useState(false);
 const [editingCat, setEditingCat] = useState<GalleryCategory | null>(null);
 const [catIdInput, setCatIdInput] = useState('');
 const [catTranslations, setCatTranslations] = useState<Record<string, string>>({});
 const [catLangTab, setCatLangTab] = useState<string>('es');

 const getCatLabelForLang = (code: string) => {
 if (catTranslations[code]) return catTranslations[code];
 if (code === 'es') return editingCat?.label || '';
 if (code === 'en') return editingCat?.label_en || '';
 return '';
 };

 const setCatLabelForLang = (code: string, value: string) => {
 setCatTranslations(prev => ({
 ...prev,
 [code]: value
 }));
 };

 const handleOpenCatModal = (cat?: GalleryCategory) => {
 if (!isOwnerOrAdmin) return;
 if (cat) {
 setEditingCat(cat);
 setCatIdInput(cat.id);
 const initial: Record<string, string> = {
 es: cat.label,
 en: cat.label_en || '',
 ...(cat.translations || {})
 };
 setCatTranslations(initial);
 } else {
 setEditingCat(null);
 setCatIdInput('');
 setCatTranslations({});
 }
 setCatLangTab(activeLangs[0]?.code || 'es');
 setIsCatModalOpen(true);
 };

 // Delete Confirm Dialog (Only for Admins)
 const [confirmDelete, setConfirmDelete] = useState<{
 isOpen: boolean;
 type: 'image' | 'category';
 id: string;
 title: string;
 }>({ isOpen: false, type: 'image', id: '', title: '' });

 const [isRetryingAll, setIsRetryingAll] = useState(false);
 const [retryingImageId, setRetryingImageId] = useState<string | null>(null);

 const loadData = async (silent = false) => {
 if (!silent) setLoading(true);
 try {
 const cats = await getGalleryCategories();
 setCategories(cats);
 const imgs = await getGalleryImages(activeCat);
 setImages(imgs);
 } catch (e) {
 console.error('Error loading gallery', e);
 if (!silent) toast.error('Error al cargar la galería');
 } finally {
 if (!silent) setLoading(false);
 }
 };

 useEffect(() => {
 loadData();
 }, [activeCat]);

 // Polling for images currently processing AI metadata
 useEffect(() => {
 const hasPending = images.some(i => i.ai_status === 'PENDING');
 if (!hasPending) return;

 const interval = setInterval(() => {
 loadData(true);
 }, 3000);

 return () => clearInterval(interval);
 }, [images, activeCat]);

 const handleRetryAllFailed = async () => {
 setIsRetryingAll(true);
 try {
 const res = await retryAllFailedGalleryAi();
 toast.success(` Reintentando generación con IA para ${res.count} fotografía(s)`);
 loadData(true);
 } catch (e: any) {
 toast.error(e.message || 'Error al reintentar');
 } finally {
 setIsRetryingAll(false);
 }
 };

 const handleRetrySingle = async (imgId: string, e?: React.MouseEvent) => {
 if (e) e.stopPropagation();
 setRetryingImageId(imgId);
 try {
 await retryGalleryImageAi(imgId);
 toast.success(' Reintentando generación con IA...');
 loadData(true);
 } catch (err: any) {
 toast.error(err.message || 'Error al reintentar');
 } finally {
 setRetryingImageId(null);
 }
 };

 const [isScanningConsents, setIsScanningConsents] = useState(false);
 const [scanningImageId, setScanningImageId] = useState<string | null>(null);
 const [previewConsentMode, setPreviewConsentMode] = useState<'original' | 'blurred'>('original');
 const [hoveredFaceIndex, setHoveredFaceIndex] = useState<number | null>(null);

 const handleScanAllConsents = async () => {
 setIsScanningConsents(true);
 try {
 const res = await scanAllGalleryConsents();
 toast.success(` Escaneo de consentimientos completado para ${res.total} fotografía(s)`);
 loadData(true);
 } catch (e: any) {
 toast.error(e.message || 'Error al escanear consentimientos');
 } finally {
 setIsScanningConsents(false);
 }
 };

 const handleScanSingleConsent = async (imgId: string, e?: React.MouseEvent) => {
 if (e) e.stopPropagation();
 setScanningImageId(imgId);
 try {
 const res = await verifyGalleryImageConsent(imgId);
 if (res.hasConsentIssues) {
 toast.warning(` Se detectaron alumnos sin consentimiento. Se generó versión difuminada.`);
 } else {
 toast.success(` Consentimientos verificados. ${res.facesCount || 0} rostro(s) analizado(s).`);
 }
 loadData(true);
 } catch (err: any) {
 toast.error(err.message || 'Error al verificar consentimiento');
 } finally {
 setScanningImageId(null);
 }
 };

 const handleRunMigration = async () => {
 if (!isOwnerOrAdmin) return;
 try {
 const res = await migrateHardcodedGallery(true);
 if (res.success) {
 toast.success(`Migración completada: ${res.insertedCount} imágenes cargadas`);
 loadData();
 } else {
 toast.error(res.message);
 }
 } catch (e: any) {
 toast.error(e.message || 'Error en migración');
 }
 };

 const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
 const [schoolStudents, setSchoolStudents] = useState<StudentItem[]>([]);
 const [cardConsentMode, setCardConsentMode] = useState<Record<string, 'original' | 'blurred'>>({});

 useEffect(() => {
 getStudents().then(res => setSchoolStudents(res || [])).catch(() => {});
 }, []);

 const failedImages = useMemo(() => {
 return images.filter(img => img.ai_status === 'FAILED');
 }, [images]);

 const consentViolationImages = useMemo(() => {
 return images.filter(img => img.has_consent_issues || img.consent_status === 'has_violations');
 }, [images]);

 // Extract all students referenced in detected faces across all gallery images
 const detectedStudentsMap = useMemo(() => {
 const map = new Map<string, { id: string; name: string; avatarUrl?: string | null; environmentName?: string | null; count: number }>();
 
 images.forEach(img => {
 if (Array.isArray(img.detected_faces)) {
 img.detected_faces.forEach(face => {
 if (face.isIdentified && face.studentId && face.studentName) {
 const existing = map.get(face.studentId);
 if (existing) {
 existing.count += 1;
 if (!existing.avatarUrl && face.avatarUrl) existing.avatarUrl = face.avatarUrl;
 if (!existing.environmentName && face.environmentName) existing.environmentName = face.environmentName;
 } else {
 map.set(face.studentId, {
 id: face.studentId,
 name: face.studentName,
 avatarUrl: face.avatarUrl,
 environmentName: face.environmentName,
 count: 1
 });
 }
 }
 });
 }
 });

 return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
 }, [images]);

 const countUnidentifiedPhotos = useMemo(() => {
 return images.filter(img => img.detected_faces?.some(f => !f.isIdentified)).length;
 }, [images]);

 const filteredImages = useMemo(() => {
 let result = images;
 if (activeCat !== 'all') {
 result = result.filter(img => img.category_id === activeCat);
 }
 if (selectedStudentFilter !== 'all') {
 if (selectedStudentFilter === 'unidentified') {
 result = result.filter(img => img.detected_faces?.some(f => !f.isIdentified));
 } else {
 result = result.filter(img => img.detected_faces?.some(f => f.studentId === selectedStudentFilter));
 }
 }
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase().trim();
 result = result.filter(img =>
 img.title.toLowerCase().includes(q) ||
 (img.title_en && img.title_en.toLowerCase().includes(q)) ||
 img.description.toLowerCase().includes(q) ||
 (img.description_en && img.description_en.toLowerCase().includes(q)) ||
 img.detected_faces?.some(f => f.studentName?.toLowerCase().includes(q))
 );
 }
 return result;
 }, [images, activeCat, selectedStudentFilter, searchQuery]);

 const [isAiAutoGenerate, setIsAiAutoGenerate] = useState<boolean>(true);
 const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
 const [aiGeneratedBadge, setAiGeneratedBadge] = useState<boolean>(false);

 // Audience & Visibility State
 const [showOnWeb, setShowOnWeb] = useState<boolean>(true);
 const [showOnPortal, setShowOnPortal] = useState<boolean>(true);

 const handleGenerateMetadata = async (targetUrl?: string) => {
 const urlToUse = targetUrl || srcUrl;
 if (!urlToUse && !selectedCatId) {
 toast.error('Selecciona una categoría o sube una imagen primero.');
 return;
 }

 setIsGeneratingAi(true);
 const catObj = categories.find(c => c.id === selectedCatId);
 try {
 const res = await generateGalleryMetadata({
 imageUrl: urlToUse || undefined,
 categoryId: selectedCatId,
 categoryLabel: catObj?.label,
 existingTitle: getTitleForLang(langTab) || undefined,
 languages: activeLangs.map(l => l.code),
 });

 if (res.translations && Object.keys(res.translations).length > 0) {
 setTranslations(res.translations);
 if (res.translations.es?.title) setTitle(res.translations.es.title);
 if (res.translations.es?.description) setDescription(res.translations.es.description);
 if (res.translations.en?.title) setTitleEn(res.translations.en.title);
 if (res.translations.en?.description) setDescriptionEn(res.translations.en.description);
 } else {
 if (res.title) setTitle(res.title);
 if (res.titleEn) setTitleEn(res.titleEn);
 if (res.description) setDescription(res.description);
 if (res.descriptionEn) setDescriptionEn(res.descriptionEn);
 }
 setAiGeneratedBadge(true);
 toast.success(' Metadatos multilingües generados con IA');
 } catch (err: any) {
 toast.error(err.message || 'No se pudo generar con IA.');
 } finally {
 setIsGeneratingAi(false);
 }
 };

 const handleOpenImageModal = (img?: GalleryImageItem) => {
 if (!isOwnerOrAdmin) {
 if (img) setPreviewImage(img);
 return;
 }

 setAiGeneratedBadge(false);

 if (img) {
 setEditingImage(img);
 setSelectedCatId(img.category_id);
 setTitle(img.title);
 setTitleEn(img.title_en || '');
 setDescription(img.description);
 setDescriptionEn(img.description_en || '');

 const initialTrans: Record<string, { title: string; description: string }> = {
 es: { title: img.title, description: img.description },
 en: { title: img.title_en || '', description: img.description_en || '' },
 ...(img.translations || {})
 };
 setTranslations(initialTrans);

 setSrcUrl(img.src);
 setShowOnWeb(img.show_on_web ?? true);
 setShowOnPortal(img.show_on_portal ?? true);
 setSrcFile(null);
 setIsAiAutoGenerate(false); // Default to manual when editing existing
 } else {
 setEditingImage(null);
 const defaultCategory = (activeCat !== 'all' && activeCat)
 ? activeCat
 : (categories.length > 0 ? categories[0].id : 'practical');
 setSelectedCatId(defaultCategory);
 setTitle('');
 setTitleEn('');
 setDescription('');
 setDescriptionEn('');
 setTranslations({});
 setSrcUrl('');
 setShowOnWeb(true);
 setShowOnPortal(true);
 setSrcFile(null);
 setIsAiAutoGenerate(true); // Default to AI background generation for new uploads
 }
 setLangTab(activeLangs[0]?.code || 'es');
 setIsImageModalOpen(true);
 };

 const handleFileSelected = async (file: File | null) => {
 setSrcFile(file);
 if (file) {
 try {
 const compressedBase64 = await compressImageFile(file);
 setSrcUrl(compressedBase64);
 } catch (err) {
 console.error('Error compressing image', err);
 const reader = new FileReader();
 reader.onloadend = () => {
 if (typeof reader.result === 'string') {
 setSrcUrl(reader.result);
 }
 };
 reader.readAsDataURL(file);
 }
 }
 };

 const handleSaveImage = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores tienen permisos para agregar o editar fotografías.');
 return;
 }

 if (!selectedCatId) {
 toast.error('Selecciona una categoría.');
 return;
 }

 const primaryTitle = getTitleForLang('es') || getTitleForLang(activeLangs[0]?.code || 'es') || title.trim();

 // If manual mode, require at least title
 if (!isAiAutoGenerate && !primaryTitle) {
 toast.error('Ingresa al menos el título de la fotografía.');
 return;
 }

 // Process image file: upload physically to /public/gallery/ on server disk
 let finalSrc = srcUrl.trim();
 if (srcFile) {
 try {
 const uploadRes = await uploadPhysicalFile(srcFile, 'gallery', primaryTitle || 'Fotografia');
 finalSrc = uploadRes.url;
 } catch (err) {
 console.warn('Physical file upload failed, falling back to base64 data URI', err);
 if (!finalSrc || finalSrc.startsWith('blob:')) {
 finalSrc = await compressImageFile(srcFile);
 }
 }
 }

 if (!finalSrc) {
 toast.error('Selecciona un archivo de imagen o escribe la URL.');
 return;
 }

 // Build consolidated translations map
 const finalTranslations: Record<string, { title: string; description: string }> = { ...translations };
 if (!isAiAutoGenerate) {
 activeLangs.forEach(lang => {
 const tVal = getTitleForLang(lang.code);
 const dVal = getDescriptionForLang(lang.code);
 if (tVal || dVal) {
 finalTranslations[lang.code] = {
 title: tVal || primaryTitle,
 description: dVal || ''
 };
 }
 });
 }

 if (editingImage) {
 const previousSrc = editingImage.src;
 await updateGalleryImage(editingImage.id, {
 category_id: selectedCatId,
 src: finalSrc,
 title: finalTranslations.es?.title || primaryTitle,
 title_en: finalTranslations.en?.title || primaryTitle,
 description: finalTranslations.es?.description || description.trim(),
 description_en: finalTranslations.en?.description || descriptionEn.trim(),
 translations: finalTranslations,
 show_on_web: showOnWeb,
 show_on_portal: showOnPortal,
 });
 if (previousSrc && previousSrc !== finalSrc) {
 deletePhysicalFile(previousSrc).catch(() => { });
 }
 toast.success('Fotografía actualizada.');
 } else {
 await createGalleryImage({
 category_id: selectedCatId,
 src: finalSrc,
 title: isAiAutoGenerate ? 'Procesando con IA...' : (finalTranslations.es?.title || primaryTitle),
 title_en: isAiAutoGenerate ? 'Processing with AI...' : (finalTranslations.en?.title || primaryTitle),
 description: isAiAutoGenerate ? '' : (finalTranslations.es?.description || description.trim()),
 description_en: isAiAutoGenerate ? '' : (finalTranslations.en?.description || descriptionEn.trim()),
 translations: isAiAutoGenerate ? {} : finalTranslations,
 aiAutoGenerate: isAiAutoGenerate,
 ai_status: isAiAutoGenerate ? 'PENDING' : 'COMPLETED',
 showOnWeb: showOnWeb,
 showOnPortal: showOnPortal,
 });
 if (isAiAutoGenerate) {
 toast.success(' Fotografía subida. Generando metadatos con IA en segundo plano...');
 } else {
 toast.success('Fotografía agregada a la galería.');
 }
 }

 loadData(true);
 if (activeCat !== 'all' && activeCat !== selectedCatId) {
 setActiveCat(selectedCatId);
 }

 setIsImageModalOpen(false);
 };

 const handleSaveCategory = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden gestionar categorías.');
 return;
 }

 const firstNonEmpty = Object.values(catTranslations).find(v => typeof v === 'string' && v.trim().length > 0) || '';
 const primaryLabel = (getCatLabelForLang('es') || getCatLabelForLang(activeLangs[0]?.code || 'es') || firstNonEmpty || '').trim();

 if (!primaryLabel) {
 toast.error('Ingresa al menos el nombre de la categoría en un idioma.');
 return;
 }

 const finalTranslations: Record<string, string> = { ...catTranslations };
 activeLangs.forEach(lang => {
 const val = getCatLabelForLang(lang.code);
 if (val && typeof val === 'string' && val.trim()) {
 finalTranslations[lang.code] = val.trim();
 }
 });

 try {
 if (editingCat) {
 await updateGalleryCategory(editingCat.id, {
 label: finalTranslations.es || primaryLabel,
 label_en: finalTranslations.en || primaryLabel,
 translations: finalTranslations,
 });
 toast.success('Categoría actualizada exitosamente.');
 } else {
 const customId = (catIdInput || '').trim();
 const catIdToUse = customId || primaryLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
 await createGalleryCategory({
 id: catIdToUse,
 label: finalTranslations.es || primaryLabel,
 label_en: finalTranslations.en || primaryLabel,
 translations: finalTranslations,
 });
 toast.success('Categoría creada exitosamente.');
 }

 setCatIdInput('');
 setCatTranslations({});
 setEditingCat(null);
 setIsCatModalOpen(false);
 await loadData();
 } catch (err: any) {
 console.error('Error al guardar categoría', err);
 toast.error(err.message || 'Error al guardar la categoría');
 }
 };

 const promptDelete = (type: 'image' | 'category', id: string, titleStr: string) => {
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores tienen permisos para eliminar elementos.');
 return;
 }
 setConfirmDelete({
 isOpen: true,
 type,
 id,
 title: titleStr
 });
 };

 const handleExecuteDelete = async () => {
 if (!isOwnerOrAdmin) return;
 if (confirmDelete.type === 'image') {
 const targetImg = images.find(img => img.id === confirmDelete.id);
 if (targetImg?.is_reported_by_parent && !isOwnerOrSuperAdmin) {
 toast.error('Esta imagen está bloqueada por un reporte de privacidad del padre. Solo el Owner o Superadmin pueden eliminarla.');
 return;
 }
 try {
 await deleteGalleryImage(confirmDelete.id);
 toast.success('Fotografía eliminada.');
 } catch (err: any) {
 toast.error(err.message || 'Error al eliminar fotografía');
 }
 } else {
 await deleteGalleryCategory(confirmDelete.id);
 toast.success('Categoría y sus fotografías eliminadas.');
 if (activeCat === confirmDelete.id) setActiveCat('all');
 }
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
 Galería Web & Fotografías
 </h1>
 <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
 {images.length} {images.length === 1 ? 'foto' : 'fotos'}
 </span>
 </div>
 <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
 {isOwnerOrAdmin
 ? 'Administra las fotografías, categorías temáticas y descripciones pedagógicas de la galería escolar.'
 : 'Explora las fotografías y momentos pedagógicos de los ambientes Montessori del colegio.'}
 </p>
 </div>
 </div>

 <div className="relative z-10 flex items-center gap-2 flex-wrap shrink-0">
 {isOwnerOrAdmin ? (
 <>
 <button
 type="button"
 onClick={handleScanAllConsents}
 disabled={isScanningConsents}
 className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-white/20 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
 title="Escanear todas las fotos con IA local para detectar rostros y validar consentimientos"
 >
 {isScanningConsents ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <ScanFace className="w-4 h-4" />
 )}
 <span>{isScanningConsents ? 'Escaneando...' : 'Verificar Consentimientos (IA)'}</span>
 </button>

 <button
 type="button"
 onClick={() => handleOpenCatModal()}
 className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-white/20 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
 >
 <FolderPlus className="w-4 h-4" />
 <span>Nueva Categoría</span>
 </button>

 <button
 type="button"
 onClick={() => handleOpenImageModal()}
 className="px-4 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
 >
 <Plus className="w-4 h-4 text-forest" />
 <span>Subir Foto</span>
 </button>
 </>
 ) : (
 <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-white/90 space-y-0.5 shrink-0">
 <span className="text-[10px] text-white/60 uppercase font-bold block">Colegio Activo</span>
 <strong className="text-sm sm:text-base font-bold font-display block text-white">
 {activeMembership?.school.name || 'Escuela Montessori'}
 </strong>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Banner de Advertencia para Fotografías con Alumnos sin Consentimiento (Auto-Difuminado) */}
 {consentViolationImages.length > 0 && isOwnerOrAdmin && (
 <div className="bg-rose-500/10 border-2 border-rose-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-2">
 <div className="flex items-start gap-3.5">
 <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-800 dark:text-rose-300 shrink-0">
 <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className="text-sm font-bold text-rose-950 dark:text-rose-200">
 {consentViolationImages.length === 1
 ? 'Guardrail de Privacidad: 1 fotografía con rostro de alumno sin consentimiento'
 : `Guardrail de Privacidad: ${consentViolationImages.length} fotografías con rostros de alumnos sin consentimiento`}
 </h4>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white uppercase tracking-wider">
 Auto-Difuminado en Web
 </span>
 </div>
 <p className="text-xs text-rose-900/80 dark:text-rose-300/80 mt-1 leading-relaxed max-w-3xl">
 La IA detectó alumnos cuyos padres o tutores no otorgaron consentimiento de imagen. El sistema generó automáticamente una copia con el rostro difuminado para la web pública. En el panel admin puedes inspeccionar los rostros detectados y comparar ambas versiones.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={handleScanAllConsents}
 disabled={isScanningConsents}
 className="px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
 title="Re-escanear consentimientos en toda la galería"
 >
 {isScanningConsents ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>Escaneando...</span>
 </>
 ) : (
 <>
 <ScanFace className="w-4 h-4" />
 <span>Re-escanear ({consentViolationImages.length})</span>
 </>
 )}
 </button>
 </div>
 )}

 {/* Banner de Advertencia para Imágenes con Fallo en Generación IA */}
 {failedImages.length > 0 && isOwnerOrAdmin && (
 <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-2">
 <div className="flex items-start gap-3.5">
 <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
 <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
 {failedImages.length === 1
 ? '1 fotografía requiere título y descripción manual (Fallo de IA)'
 : `${failedImages.length} fotografías requieren título y descripción manual (Fallo de IA)`}
 </h4>
 <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5 leading-relaxed max-w-3xl">
 La IA no pudo autogenerar los metadatos porque no se ha configurado la API Key o el proveedor LLM en los ajustes del colegio (<strong>Ajustes → Inteligencia Artificial</strong>). Puedes ingresar los textos pedagógicos manualmente haciendo clic en la foto o reintentar una vez configurada la IA.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={handleRetryAllFailed}
 disabled={isRetryingAll}
 className="px-4 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
 title="Reintentar generación de metadatos con IA para todas las imágenes fallidas"
 >
 {isRetryingAll ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>Reintentando...</span>
 </>
 ) : (
 <>
 <RefreshCw className="w-4 h-4" />
 <span>Reintentar con IA ({failedImages.length})</span>
 </>
 )}
 </button>
 </div>
 )}

 {/* Dynamic Filter Bar: Custom Category Select + Custom Student Select + Search */}
 <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-forest/10 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 flex-wrap">
 
 {/* 1. Custom Category Select */}
 <div className="min-w-[210px] flex-1 sm:flex-initial">
 <Select
 value={activeCat}
 onValueChange={(val) => setActiveCat(val)}
 >
 <SelectTrigger className="w-full h-10 rounded-2xl bg-forest/5 border-forest/15 text-forest font-semibold text-xs px-3 shadow-2xs hover:bg-forest/10 transition-colors cursor-pointer">
 <div className="flex items-center gap-2 truncate">
 <Tag className="w-3.5 h-3.5 text-forest shrink-0" />
 <span className="truncate">
 {activeCat === 'all'
 ? `Todas las Categorías (${images.length})`
 : categories.find(c => c.id === activeCat)?.label || 'Seleccionar Categoría'}
 </span>
 </div>
 </SelectTrigger>
 <SelectContent className="rounded-2xl border-forest/15 shadow-xl bg-white text-slate-800 p-1 min-w-[240px]">
 <SelectGroup>
 <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
 Filtrar por Categoría
 </SelectLabel>
 <SelectItem value="all" className="rounded-xl text-xs font-semibold py-2 cursor-pointer">
 <div className="flex items-center justify-between w-full gap-2">
 <div className="flex items-center gap-2">
 <Folder className="w-3.5 h-3.5 text-forest" />
 <span>Todas las fotos</span>
 </div>
 <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full font-bold">
 {images.length}
 </span>
 </div>
 </SelectItem>
 <SelectSeparator />
 {categories.map((cat) => {
 const count = images.filter(img => img.category_id === cat.id).length;
 return (
 <SelectItem key={cat.id} value={cat.id} className="rounded-xl text-xs font-medium py-2 cursor-pointer">
 <div className="flex items-center justify-between w-full gap-2">
 <div className="flex items-center gap-2 truncate">
 <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
 <span className="truncate">{cat.label}</span>
 </div>
 <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
 {count}
 </span>
 </div>
 </SelectItem>
 );
 })}
 </SelectGroup>
 </SelectContent>
 </Select>
 </div>

 {/* 2. Custom Student Select */}
 <div className="min-w-[240px] flex-1 sm:flex-initial">
 <Select
 value={selectedStudentFilter}
 onValueChange={(val) => setSelectedStudentFilter(val)}
 >
 <SelectTrigger className="w-full h-10 rounded-2xl bg-forest/5 border-forest/15 text-forest font-semibold text-xs px-3 shadow-2xs hover:bg-forest/10 transition-colors cursor-pointer">
 <div className="flex items-center gap-2 truncate">
 <UserCheck className="w-3.5 h-3.5 text-forest shrink-0" />
 <span className="truncate">
 {selectedStudentFilter === 'all'
 ? 'Todos los Estudiantes'
 : selectedStudentFilter === 'unidentified'
 ? 'Rostros No Identificados'
 : detectedStudentsMap.find(s => s.id === selectedStudentFilter)?.name ||
 schoolStudents.find(s => s.id === selectedStudentFilter)?.full_name || 'Filtrar por Estudiante'}
 </span>
 </div>
 </SelectTrigger>
 <SelectContent className="rounded-2xl border-forest/15 shadow-xl bg-white text-slate-800 p-1 min-w-[280px] max-h-72">
 <SelectGroup>
 <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
 Filtrar por Alumno en Foto
 </SelectLabel>
 <SelectItem value="all" className="rounded-xl text-xs font-semibold py-2 cursor-pointer">
 <div className="flex items-center justify-between w-full gap-2">
 <div className="flex items-center gap-2">
 <Users className="w-3.5 h-3.5 text-forest" />
 <span>Todos los alumnos</span>
 </div>
 <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full font-bold">
 {images.length} fotos
 </span>
 </div>
 </SelectItem>
 
 {countUnidentifiedPhotos > 0 && (
 <SelectItem value="unidentified" className="rounded-xl text-xs font-medium py-2 cursor-pointer text-slate-700">
 <div className="flex items-center justify-between w-full gap-2">
 <div className="flex items-center gap-2">
 <Users className="w-3.5 h-3.5 text-slate-400" />
 <span>Rostros sin identificar</span>
 </div>
 <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
 {countUnidentifiedPhotos}
 </span>
 </div>
 </SelectItem>
 )}

 <SelectSeparator />

 {detectedStudentsMap.length > 0 ? (
 detectedStudentsMap.map((stud) => (
 <SelectItem key={stud.id} value={stud.id} className="rounded-xl text-xs font-medium py-2 cursor-pointer">
 <div className="flex items-center justify-between w-full gap-3">
 <div className="flex items-center gap-2 truncate">
 <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden border border-emerald-300">
 {stud.avatarUrl ? (
 <img src={stud.avatarUrl} alt="" className="w-full h-full object-cover" />
 ) : (
 stud.name.slice(0, 2).toUpperCase()
 )}
 </div>
 <div className="flex flex-col text-left truncate">
 <span className="font-semibold text-slate-800 truncate">{stud.name}</span>
 {stud.environmentName && (
 <span className="text-[10px] text-muted-foreground">{stud.environmentName}</span>
 )}
 </div>
 </div>
 <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold shrink-0">
 {stud.count} {stud.count === 1 ? 'foto' : 'fotos'}
 </span>
 </div>
 </SelectItem>
 ))
 ) : (
 <div className="px-3 py-2 text-[11px] text-muted-foreground italic">
 Aún no se han detectado alumnos en las fotos.
 </div>
 )}
 </SelectGroup>
 </SelectContent>
 </Select>
 </div>

 {/* Quick Active Filter Badges with Reset */}
 {(activeCat !== 'all' || selectedStudentFilter !== 'all' || searchQuery.trim()) && (
 <button
 type="button"
 onClick={() => {
 setActiveCat('all');
 setSelectedStudentFilter('all');
 setSearchQuery('');
 }}
 className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
 title="Restablecer todos los filtros"
 >
 <X className="w-3 h-3" />
 <span>Limpiar Filtros</span>
 </button>
 )}

 </div>

 {/* 3. Search Bar & Category Actions */}
 <div className="flex items-center gap-2">
 <div className="relative flex-1 sm:w-64">
 <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Buscar fotos o alumnos..."
 className="w-full h-10 pl-8 pr-7 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest/20 transition-all font-medium"
 />
 {searchQuery && (
 <button
 type="button"
 onClick={() => setSearchQuery('')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {isOwnerOrAdmin && (
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => handleOpenCatModal()}
 className="h-10 px-3.5 bg-forest/5 hover:bg-forest/10 text-forest border border-forest/15 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
 title="Gestionar o agregar categorías de galería"
 >
 <FolderPlus className="w-3.5 h-3.5 text-forest" />
 <span className="hidden sm:inline">Categoría</span>
 </button>
 </div>
 )}
 </div>

 </div>

 {/* Gallery Images Grid */}
 {loading ? (
 <div className="text-center py-16 text-muted-foreground text-sm">
 Cargando fotografías...
 </div>
 ) : filteredImages.length === 0 ? (
 <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest/10 shadow-xs space-y-3">
 <Images className="w-12 h-12 text-forest/30 mx-auto" />
 <h3 className="font-display font-bold text-forest text-lg">
 {searchQuery ? 'No se encontraron fotografías para la búsqueda' : 'No hay fotografías en esta categoría'}
 </h3>
 <p className="text-xs text-muted-foreground max-w-md mx-auto">
 {searchQuery
 ? `No hay resultados que coincidan con "${searchQuery}". Intenta con otros términos.`
 : isOwnerOrAdmin
 ? 'Agrega imágenes Montessori con su título y descripción pedagógica, o ejecuta la migración inicial.'
 : 'Aún no se han publicado fotografías en esta sección.'}
 </p>
 {isOwnerOrAdmin && !searchQuery && (
 <div className="flex justify-center gap-2 pt-2">

 <button
 type="button"
 onClick={() => handleOpenImageModal()}
 className="px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 inline-flex items-center gap-1.5 cursor-pointer"
 >
 <Plus className="w-4 h-4" />
 Subir Foto
 </button>
 </div>
 )}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredImages.map((img) => {
 const catObj = categories.find(c => c.id === img.category_id);
 const isFailed = img.ai_status === 'FAILED';
 const isPending = img.ai_status === 'PENDING';
 const isRetryingThis = retryingImageId === img.id;
 const hasBlurred = Boolean(img.has_consent_issues && img.blurred_src);
 const viewMode = cardConsentMode[img.id] || (hasBlurred ? 'blurred' : 'original');
 const displaySrc = viewMode === 'blurred' && img.blurred_src ? img.blurred_src : img.src;

 return (
 <div
 key={img.id}
 onClick={() => {
 if (isOwnerOrAdmin) {
 handleOpenImageModal(img);
 } else {
 setPreviewImage(img);
 setPreviewConsentMode(hasBlurred ? 'blurred' : 'original');
 }
 }}
 className={`bg-white rounded-3xl overflow-hidden transition-all flex flex-col justify-between group cursor-pointer ${isFailed
 ? 'border-2 border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
 : isPending
 ? 'border-2 border-amber-400/80 ring-2 ring-amber-400/30 shadow-xs'
 : 'border border-forest/10 shadow-xs hover:shadow-md'
 }`}
 >
 {/* Photo Preview Container */}
 <div className="relative aspect-[4/3] bg-cream overflow-hidden">
 <img
 src={displaySrc}
 alt={img.title}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
 <div className="bg-forest/80 backdrop-blur-md text-white text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border border-white/20">
 {catObj?.label || img.category_id}
 </div>

 {hasBlurred && isOwnerOrAdmin && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setCardConsentMode(prev => ({
 ...prev,
 [img.id]: viewMode === 'blurred' ? 'original' : 'blurred'
 }));
 }}
 className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md transition-all shadow-xs flex items-center gap-1 cursor-pointer border ${
 viewMode === 'blurred'
 ? 'bg-rose-600/90 hover:bg-rose-700 text-white border-rose-400/40'
 : 'bg-emerald-600/90 hover:bg-emerald-700 text-white border-emerald-400/40'
 }`}
 title={viewMode === 'blurred' ? 'Ver foto original sin difuminar (Admin)' : 'Ver foto protegida con rostros difuminados (Web)'}
 >
 {viewMode === 'blurred' ? ' Difuminada' : ' Original'}
 </button>
 )}
 </div>

 {/* AI Processing Status Overlay Badges */}
 {isPending && (
 <div className="absolute bottom-3 left-3 right-3 bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-between gap-1.5 animate-pulse">
 <div className="flex items-center gap-1.5">
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 <span>Generando con IA...</span>
 </div>
 </div>
 )}

 {isFailed && (
 <div className="absolute bottom-3 left-3 right-3 bg-amber-600/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-between gap-1.5">
 <div className="flex items-center gap-1.5">
 <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
 <span>Falló generación con IA</span>
 </div>
 {isOwnerOrAdmin && (
 <button
 type="button"
 onClick={(e) => handleRetrySingle(img.id, e)}
 disabled={isRetryingThis}
 className="px-2 py-0.5 bg-white text-amber-900 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
 >
 {isRetryingThis ? (
 <Loader2 className="w-2.5 h-2.5 animate-spin" />
 ) : (
 <RefreshCw className="w-2.5 h-2.5" />
 )}
 <span>Reintentar</span>
 </button>
 )}
 </div>
 )}

 {isOwnerOrAdmin ? (
 <div
 className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-xs"
 onClick={(e) => e.stopPropagation()}
 >
 <button
 type="button"
 onClick={(e) => handleScanSingleConsent(img.id, e)}
 disabled={scanningImageId === img.id}
 className="p-1.5 text-forest/80 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
 title="Verificar rostros y consentimientos con IA"
 >
 {scanningImageId === img.id ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />
 ) : (
 <ScanFace className="w-3.5 h-3.5" />
 )}
 </button>
 <button
 type="button"
 onClick={() => handleOpenImageModal(img)}
 className="p-1.5 text-forest/80 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer"
 title="Editar Foto"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => promptDelete('image', img.id, img.title)}
 className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
 title="Eliminar Foto"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 ) : (
 <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
 <Eye className="w-4 h-4 text-forest" />
 </div>
 )}
 </div>

 {/* Details */}
 <div className="p-5 space-y-2.5">
 {/* Audience & AI & Consent Badges */}
 <div className="flex items-center gap-1.5 flex-wrap">
 {img.show_on_web && (
 <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1">
 <Globe className="w-2.5 h-2.5" /> Web
 </span>
 )}
 {img.show_on_portal && (
 <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200/60 inline-flex items-center gap-1">
 <Users className="w-2.5 h-2.5" /> Padres
 </span>
 )}
 {!img.show_on_web && !img.show_on_portal && (
 <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1">
 <Lock className="w-2.5 h-2.5" /> Oculto
 </span>
 )}

 {/* Face Consent Status Badge */}
 {img.has_consent_issues ? (
 <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1">
 <EyeOff className="w-2.5 h-2.5 text-rose-600" /> Rostro Difuminado
 </span>
 ) : img.consent_status === 'verified_clean' ? (
 <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1">
 <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Consentimiento OK
 </span>
 ) : img.consent_status === 'no_faces' ? (
 <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1">
 <Users className="w-2.5 h-2.5 text-slate-500" /> Sin Rostros
 </span>
 ) : (
 <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
 <ScanFace className="w-2.5 h-2.5 text-amber-600" /> Sin Escanear
 </span>
 )}

 {img.detected_faces && img.detected_faces.length > 0 && (
 <span className="text-[10px] bg-forest/10 text-forest font-bold px-2 py-0.5 rounded-md border border-forest/15 inline-flex items-center gap-1">
 <Users className="w-2.5 h-2.5" /> {img.detected_faces.length} {img.detected_faces.length === 1 ? 'rostro' : 'rostros'}
 </span>
 )}
 </div>

  {/* Parent Privacy Report Alert Banner */}
  {img.is_reported_by_parent && (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1.5 shadow-2xs">
      <div className="flex items-center gap-1.5 font-bold text-rose-700">
        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
        <span>Retirada por reporte de padre/tutor</span>
      </div>
      {img.parent_report && (
        <div className="text-[11px] text-rose-800 space-y-1">
          <p className="leading-tight">
            <strong>Tutor:</strong> {img.parent_report.tutorName || img.parent_report.tutorEmail}
            {img.parent_report.studentName ? ` (Alumno: ${img.parent_report.studentName})` : ''}
          </p>
          {img.parent_report.comment && (
            <p className="italic bg-white/80 p-2 rounded-lg border border-rose-200 text-slate-700 leading-snug">
              "{img.parent_report.comment}"
            </p>
          )}
          <p className="text-[10px] text-rose-600/90 font-semibold">
            🔒 Desactivada permanentemente. Solo el Owner o Superadmin pueden eliminarla.
          </p>
        </div>
      )}
    </div>
  )}

  <h3 className="font-display font-bold text-forest text-base leading-snug group-hover:text-forest-light transition-colors">
  {img.title}
  </h3>
 {img.title_en && (
 <span className="text-[10px] text-terracotta font-semibold uppercase tracking-wider block">
 EN: {img.title_en}
 </span>
 )}

 {img.description && (
 <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed pt-1 border-t border-forest/5">
 "{img.description}"
 </p>
 )}

 {/* Personas / Alumnos Detectados en la Fotografía */}
 {img.detected_faces && img.detected_faces.length > 0 && (
 <div className="pt-2.5 border-t border-forest/5 flex flex-col gap-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
 <Users className="w-3 h-3 text-forest/70" />
 <span>Personas ({img.detected_faces.length}):</span>
 </span>
 {img.detected_faces.some(f => !f.hasConsent) && (
 <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
 1+ sin consentimiento
 </span>
 )}
 </div>

 <div className="flex items-center gap-1.5 flex-wrap">
 {img.detected_faces.map((face, fIdx) => {
 const initials = face.studentName && face.isIdentified
 ? face.studentName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
 : '?';

 return (
 <TooltipProvider key={fIdx} delayDuration={50}>
 <Tooltip>
 <TooltipTrigger asChild>
 <div
 className={`relative flex items-center justify-center rounded-full border-2 transition-all duration-200 ease-out hover:scale-140 hover:z-30 cursor-pointer shadow-xs ${
 face.isIdentified
 ? face.hasConsent
 ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
 : 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-300/60'
 : 'border-slate-400 bg-slate-100 text-slate-600'
 } w-8 h-8 shrink-0 overflow-hidden group/avatar`}
 onClick={(e) => {
 e.stopPropagation();
 if (face.studentId) {
 setSelectedStudentFilter(face.studentId);
 }
 }}
 >
 <FaceCropAvatar
 imageSrc={img.src}
 box={face.box}
 avatarUrl={face.avatarUrl}
 fallbackText={initials}
 className="w-full h-full"
 />

 {/* Mini indicator dot */}
 <span
 className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
 face.isIdentified
 ? face.hasConsent ? 'bg-emerald-500' : 'bg-rose-500'
 : 'bg-slate-500'
 }`}
 />
 </div>
 </TooltipTrigger>
 <TooltipContent side="top" className="p-3 max-w-sm bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl text-xs z-50 animate-in fade-in zoom-in-95 border border-slate-800">
 <div className="flex items-start gap-3">
 {/* Enlarged Facial Tile Preview */}
 <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-700 shadow-md bg-slate-900">
 <FaceCropAvatar
 imageSrc={img.src}
 box={face.box}
 avatarUrl={face.avatarUrl}
 fallbackText={initials}
 className="w-full h-full"
 />
 </div>

 {/* Face Details */}
 <div className="flex-1 space-y-1 min-w-0">
 <div className="flex items-center gap-1.5 font-bold">
 {face.isIdentified ? (
 <>
 <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
 <span className="truncate">{face.studentName}</span>
 </>
 ) : (
 <>
 <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
 <span>Persona no identificada</span>
 </>
 )}
 </div>

 {face.isIdentified && face.environmentName && (
 <p className="text-[11px] text-slate-300 flex items-center gap-1">
 <span></span>
 <span className="font-semibold text-emerald-300">{face.environmentName}</span>
 </p>
 )}

 {face.isIdentified && (
 <p className="text-[10px] text-slate-300 flex items-center gap-1">
 <span></span>
 <span className={face.hasConsent ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
 {face.hasConsent ? 'Autorizado' : 'Sin Consentimiento (Difuminado)'}
 </span>
 </p>
 )}

 {!face.isIdentified && (
 <p className="text-[10px] text-slate-400 leading-tight">
 Rostro detectado por IA en la foto.
 </p>
 )}

 {face.confidence && (
 <p className="text-[9px] text-slate-400">
 Coincidencia: {(face.confidence * 100).toFixed(0)}%
 </p>
 )}

 {face.studentId && (
 <p className="text-[9px] text-emerald-400 font-medium pt-0.5 border-t border-slate-800">
 Clic para filtrar fotos de este alumno
 </p>
 )}
 </div>
 </div>
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 );
 })}
 </div>
 </div>
 )}
 </div>

 </div>
 );
 })}
 </div>
 )}

 {/* LIGHTBOX / IMAGE PREVIEW & FACE INSPECTION MODAL */}
 {previewImage && (
 <ResponsiveModal
 isOpen={Boolean(previewImage)}
 onClose={() => {
 setPreviewImage(null);
 setPreviewConsentMode('original');
 }}
 maxWidthClass="max-w-3xl"
 title={previewImage.title}
 >
 <div className="space-y-4">

 {/* Toggle Original (Admin) vs Difuminada (Web) */}
 {previewImage.blurred_src && isOwnerOrAdmin && (
 <div className="flex items-center justify-between p-2.5 rounded-2xl bg-forest/5 border border-forest/15 flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
 <span className="text-xs font-bold text-forest">
 Esta imagen contiene alumnos sin consentimiento de foto
 </span>
 </div>
 <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-forest/15 shadow-3xs">
 <button
 type="button"
 onClick={() => setPreviewConsentMode('original')}
 className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${previewConsentMode === 'original'
 ? 'bg-forest text-white shadow-xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 Vista Original (Admin)
 </button>
 <button
 type="button"
 onClick={() => setPreviewConsentMode('blurred')}
 className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${previewConsentMode === 'blurred'
 ? 'bg-rose-600 text-white shadow-xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 Vista Web Protegida (Difuminada)
 </button>
 </div>
 </div>
 )}

 {/* Interactive Image Container with Face Bounding Boxes */}
 <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-forest/5 border border-forest/10 select-none">
 <img
 src={previewConsentMode === 'blurred' && previewImage.blurred_src ? previewImage.blurred_src : previewImage.src}
 alt={previewImage.title}
 className="w-full h-full object-cover"
 />

 {/* Render Face Overlays when viewing original mode */}
 {previewConsentMode === 'original' && previewImage.detected_faces && previewImage.detected_faces.map((face, fIdx) => {
 const box = face.box;
 if (!box) return null;
 const isHovered = hoveredFaceIndex === fIdx;

 return (
 <div
 key={fIdx}
 onMouseEnter={() => setHoveredFaceIndex(fIdx)}
 onMouseLeave={() => setHoveredFaceIndex(null)}
 style={{
 left: `${box.xPercent}%`,
 top: `${box.yPercent}%`,
 width: `${box.wPercent}%`,
 height: `${box.hPercent}%`
 }}
 className={`absolute rounded-2xl transition-all cursor-pointer pointer-events-auto ${face.hasConsent
 ? 'border-2 border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 shadow-sm'
 : 'border-2 border-dashed border-rose-500 bg-rose-500/20 hover:bg-rose-500/35 ring-2 ring-rose-500/40 shadow-md'
 } ${isHovered ? 'scale-105 z-20 ring-4' : 'z-10'}`}
 >
 {/* Tooltip badge floating on the face */}
 <div
 className={`absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1 transition-all pointer-events-none ${face.hasConsent
 ? 'bg-emerald-700 text-white'
 : 'bg-rose-700 text-white'
 }`}
 >
 {face.hasConsent ? (
 <CheckCircle2 className="w-3 h-3 text-emerald-300" />
 ) : (
 <EyeOff className="w-3 h-3 text-rose-300" />
 )}
 <span>{face.studentName || 'Persona'}</span>
 {face.confidence && (
 <span className="opacity-75 font-normal">({Math.round(face.confidence * 100)}%)</span>
 )}
 </div>
 </div>
 );
 })}
 </div>

 {/* List of Detected Students with Consents Breakdown */}
 {previewImage.detected_faces && previewImage.detected_faces.length > 0 && (
 <div className="p-4 rounded-2xl bg-white border border-forest/15 shadow-3xs space-y-3">
 <div className="flex items-center justify-between pb-2 border-b border-forest/10">
 <div className="flex items-center gap-2">
 <ScanFace className="w-4 h-4 text-forest" />
 <span className="text-xs font-bold text-forest uppercase tracking-wider">
 Alumnos Detectados & Consentimiento ({previewImage.detected_faces.length})
 </span>
 </div>
 {previewImage.has_consent_issues ? (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
 <ShieldAlert className="w-3 h-3 text-rose-600" /> Alumnos sin consentimiento
 </span>
 ) : (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
 <ShieldCheck className="w-3 h-3 text-emerald-600" /> Todos autorizados
 </span>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {previewImage.detected_faces.map((face, fIdx) => (
 <div
 key={fIdx}
 className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${face.hasConsent
 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
 : 'bg-rose-50/80 border-rose-300 text-rose-950 ring-1 ring-rose-200'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 {/* Face Crop Tile */}
 <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-300 shadow-2xs bg-slate-900">
 <FaceCropAvatar
 imageSrc={previewImage.src}
 box={face.box}
 avatarUrl={face.avatarUrl}
 className="w-full h-full"
 />
 </div>

 <div className="min-w-0">
 <div className="flex items-center gap-1.5">
 {face.hasConsent ? (
 <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
 ) : (
 <UserX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
 )}
 <strong className="truncate block font-bold text-slate-900">
 {face.studentName || 'Persona no identificada'}
 </strong>
 </div>
 {face.environmentName && (
 <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded inline-block mt-0.5">
 {face.environmentName}
 </span>
 )}
 {face.consentNotes && (
 <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
 {face.consentNotes}
 </span>
 )}
 </div>
 </div>

 <div className="shrink-0 text-right">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${face.hasConsent
 ? 'bg-emerald-200 text-emerald-900'
 : 'bg-rose-600 text-white'
 }`}>
 {face.hasConsent ? ' Autorizado' : ' Difuminado'}
 </span>
 {face.confidence && (
 <span className="text-[9px] text-muted-foreground block mt-0.5 font-mono">
 {Math.round(face.confidence * 100)}% coincidencia
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 <div className="space-y-2">
 <div className="flex items-center justify-between gap-2">
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-forest/10 text-forest border border-forest/15">
 {categories.find(c => c.id === previewImage.category_id)?.label || previewImage.category_id}
 </span>
 {previewImage.title_en && (
 <span className="text-xs text-muted-foreground font-semibold">
 {previewImage.title_en}
 </span>
 )}
 </div>

 {previewImage.description ? (
 <p className="text-xs sm:text-sm text-forest/90 leading-relaxed italic bg-forest/5 p-4 rounded-2xl border border-forest/10">
 "{previewImage.description}"
 </p>
 ) : (
 <p className="text-xs text-muted-foreground italic">
 Fotografía pedagógica de las actividades y ambientes Montessori.
 </p>
 )}
 </div>

 <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
 {isOwnerOrAdmin ? (
 <button
 type="button"
 onClick={() => {
 const img = previewImage;
 setPreviewImage(null);
 handleOpenImageModal(img);
 }}
 className="px-4 py-2 bg-forest/10 hover:bg-forest/20 text-forest rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
 >
 <Edit3 className="w-3.5 h-3.5" />
 <span>Editar Datos</span>
 </button>
 ) : <div />}

 <button
 type="button"
 onClick={() => {
 setPreviewImage(null);
 setPreviewConsentMode('original');
 }}
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>
 </ResponsiveModal>
 )}

 {/* CREATE / EDIT IMAGE MODAL (Only for Admins) */}
 {isOwnerOrAdmin && (
 <ResponsiveModal
 isOpen={isImageModalOpen}
 onClose={() => setIsImageModalOpen(false)}
 maxWidthClass="max-w-2xl"
 title={editingImage ? 'Editar Fotografía de Galería' : 'Agregar Fotografía a la Galería'}
 >
 <form onSubmit={handleSaveImage} className="space-y-5">

 {/* SECCIÓN 1: CATEGORÍA & ARCHIVO */}
 <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5">
 <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
 <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center">
 1
 </span>
 <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
 Categoría & Archivo de Imagen
 </span>
 </div>

 {/* Category Selection */}
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
 <Folder className="w-3.5 h-3.5 text-forest" />
 <span>Categoría de la Galería *</span>
 </label>
 <select
 value={selectedCatId}
 onChange={(e) => {
 setSelectedCatId(e.target.value);
 if (isAiAutoGenerate && srcUrl) {
 handleGenerateMetadata();
 }
 }}
 required
 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer shadow-3xs"
 >
 {categories.map((c) => (
 <option key={c.id} value={c.id}>
 {c.label} ({c.id})
 </option>
 ))}
 </select>
 </div>

 {/* Photo Upload via ImageUploadDropzone */}
 <div>
 <ImageUploadDropzone
 value={srcUrl}
 onChange={(url) => {
 setSrcUrl(url);
 if (url && isAiAutoGenerate) {
 handleGenerateMetadata(url);
 }
 }}
 label="Fotografía para la Galería"
 helperText="Arrastra y suelta tu archivo aquí (PNG, JPG, WEBP - se optimizará en MinIO público)"
 folder="gallery"
 maxSizeMB={25}
 />
 </div>
 </div>

 {/* SECCIÓN 2: INFORMACIÓN & METADATOS (MANUAL / IA) */}
 <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-3xs space-y-4">
 <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
 <div className="flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center">
 2
 </span>
 <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
 Información & Metadatos
 </span>
 </div>

 {aiGeneratedBadge && (
 <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Generado con IA
 </span>
 )}
 </div>

 {/* Failed AI Status Alert Box */}
 {editingImage?.ai_status === 'FAILED' && (
 <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs space-y-1.5 animate-in fade-in">
 <div className="flex items-center gap-2 font-bold text-amber-900">
 <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
 <span>Falló la generación automática de metadatos con IA</span>
 </div>
 <p className="text-[11px] text-amber-800 leading-relaxed">
 {editingImage.ai_error || 'No se ha configurado la API Key o el proveedor LLM en los ajustes del colegio (Ajustes → Inteligencia Artificial).'}
 </p>
 <p className="text-[11px] text-amber-900 font-semibold pt-0.5">
 Por favor escribe los títulos y descripciones manualmente abajo, o configura la clave de IA en Ajustes.
 </p>
 </div>
 )}

 {/* AI Auto-Generation Toggle Switch */}
 <div className="flex items-center justify-between p-3.5 rounded-2xl bg-forest/5 border border-forest/15">
 <div className="flex items-center gap-3 pr-2">
 <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
 <Sparkles className="w-4.5 h-4.5" />
 </div>
 <div>
 <span className="text-xs font-bold text-slate-800 block">
 Autogenerar con Inteligencia Artificial (IA)
 </span>
 <span className="text-[11px] text-slate-500 block leading-tight">
 Genera títulos y descripciones Montessori automáticamente en segundo plano para todos los idiomas
 </span>
 </div>
 </div>
 <Switch
 checked={isAiAutoGenerate}
 onCheckedChange={(val) => {
 setIsAiAutoGenerate(val);
 }}
 />
 </div>

 {/* Contenido condicional: Explicación de Queue (si IA está activa) vs Inputs Manuales (si IA está inactiva) */}
 {isAiAutoGenerate ? (
 <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 space-y-2 animate-in fade-in duration-150">
 <div className="flex items-center gap-2 text-forest">
 <Bot className="w-4 h-4" />
 <span className="text-xs font-bold">Generación en segundo plano</span>
 </div>
 <p className="text-xs text-slate-600 leading-relaxed">
 No necesitas escribir títulos ni descripciones manualmente. Al guardar la imagen, se iniciará una cola de procesamiento en segundo plano con IA para generar los metadatos pedagógicos en todos los idiomas configurados ({activeLangs.map(l => l.flag).join(' ')}).
 </p>
 <div className="flex items-center gap-2 pt-1 text-[11px] text-forest/90 font-medium">
 <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
 <span>La fotografía aparecerá con estado "Generando con IA..." mientras procesa.</span>
 </div>
 </div>
 ) : (
 <div className="space-y-4 animate-in fade-in duration-150">
 {/* Language Selector Tabs & Manual/AI Assist Bar */}
 <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
 <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
 {activeLangs.map((lang) => {
 const hasTitle = Boolean(getTitleForLang(lang.code)?.trim());
 const isSelected = langTab === lang.code;
 return (
 <button
 key={lang.code}
 type="button"
 onClick={() => setLangTab(lang.code)}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${isSelected
 ? 'bg-white text-forest shadow-xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 <span>{lang.flag}</span>
 <span>{lang.nativeName}</span>
 {hasTitle && (
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Información completada" />
 )}
 </button>
 );
 })}
 </div>

 <button
 type="button"
 onClick={() => handleGenerateMetadata()}
 disabled={isGeneratingAi}
 className="px-3.5 py-1.5 text-xs font-bold text-forest bg-forest/10 hover:bg-forest/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
 title="Generar o regenerar título y descripción con Inteligencia Artificial para todos los idiomas"
 >
 {isGeneratingAi ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />
 <span>Analizando imagen...</span>
 </>
 ) : (
 <>
 <Wand2 className="w-3.5 h-3.5 text-forest" />
 <span>{aiGeneratedBadge ? 'Regenerar con IA' : 'Generar con IA'}</span>
 </>
 )}
 </button>
 </div>

 {/* Dynamic Multilingual Text Fields for Selected Tab */}
 {(() => {
 const currentLangObj = activeLangs.find(l => l.code === langTab) || getLanguageByCode(langTab);
 const isPrimary = langTab === 'es' || langTab === (activeLangs[0]?.code || 'es');
 return (
 <div className="space-y-3 animate-in fade-in duration-150" key={langTab}>
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <span>{currentLangObj.flag}</span>
 <span>Título de la Fotografía ({currentLangObj.nativeName})</span>
 {isPrimary && <span className="text-red-500">*</span>}
 </span>
 </label>
 <input
 type="text"
 value={getTitleForLang(langTab)}
 onChange={(e) => setFieldForLang(langTab, 'title', e.target.value)}
 placeholder={`ej. Título en ${currentLangObj.nativeName}`}
 required={isPrimary}
 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-3xs"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
 <span>{currentLangObj.flag}</span>
 <span>Descripción Pedagógica Montessoriana ({currentLangObj.nativeName})</span>
 </label>
 <textarea
 value={getDescriptionForLang(langTab)}
 onChange={(e) => setFieldForLang(langTab, 'description', e.target.value)}
 placeholder={`Explicación pedagógica sobre el desarrollo y aprendizaje en ${currentLangObj.nativeName}...`}
 rows={3}
 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-3xs"
 />
 </div>
 </div>
 );
 })()}
 </div>
 )}

 {/* Audiencia & Visibilidad (Web Pública vs Portal de Padres) */}
 <div className="pt-3 border-t border-slate-200/60 space-y-2.5">
 {editingImage?.is_reported_by_parent && (
   <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-xs text-rose-900 space-y-2 mb-3">
     <div className="flex items-center gap-2 font-bold text-rose-700 text-sm">
       <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
       <span>Fotografía Bloqueada por Privacidad Familiar</span>
     </div>
     <p className="text-[11px] text-rose-800 leading-relaxed">
       Esta fotografía fue retirada y bloqueada automáticamente a solicitud del padre/tutor. <strong>No puede reactivarse en la web ni en el portal</strong>. Solo el Director/Owner o el Superadmin tienen autorización para eliminarla.
     </p>
     {editingImage.parent_report?.comment && (
       <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200 space-y-1">
         <span className="text-[10px] uppercase tracking-wider font-bold text-rose-800 block">
           Motivo expresado por {editingImage.parent_report.tutorName || 'el tutor'}:
         </span>
         <p className="italic text-slate-700">"{editingImage.parent_report.comment}"</p>
       </div>
     )}
   </div>
 )}

 <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
 <Eye className="w-3.5 h-3.5 text-forest" />
 <span>¿Quién puede ver esta fotografía? (Audiencia & Canales)</span>
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

 {/* Toggle Web Pública */}
 <div
 onClick={() => {
   if (editingImage?.is_reported_by_parent) {
     toast.error('Esta imagen está bloqueada por privacidad del padre y no puede reactivarse.');
     return;
   }
   setShowOnWeb(!showOnWeb);
 }}
 className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 select-none ${
   editingImage?.is_reported_by_parent 
     ? 'opacity-60 bg-slate-100 border-slate-200 cursor-not-allowed'
     : showOnWeb
       ? 'bg-emerald-50/50 border-emerald-300/80 shadow-3xs cursor-pointer'
       : 'bg-slate-50 border-slate-200 hover:border-slate-300 cursor-pointer'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${showOnWeb ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-slate-200/60 text-slate-400 border-transparent'
 }`}>
 <Globe className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-bold text-slate-800 block">Sitio Web Público</span>
 <span className="text-[10px] text-slate-500 block">
   {editingImage?.is_reported_by_parent ? 'Bloqueado permanentemente' : 'Landing page y visitantes'}
 </span>
 </div>
 </div>
 <Switch
 checked={showOnWeb}
 disabled={editingImage?.is_reported_by_parent}
 onCheckedChange={(val) => {
   if (editingImage?.is_reported_by_parent) {
     toast.error('Esta imagen está bloqueada por privacidad del padre.');
     return;
   }
   setShowOnWeb(val);
 }}
 onClick={(e) => e.stopPropagation()}
 />
 </div>

 {/* Toggle Portal de Padres */}
 <div
 onClick={() => {
   if (editingImage?.is_reported_by_parent) {
     toast.error('Esta imagen está bloqueada por privacidad del padre y no puede reactivarse.');
     return;
   }
   setShowOnPortal(!showOnPortal);
 }}
 className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 select-none ${
   editingImage?.is_reported_by_parent 
     ? 'opacity-60 bg-slate-100 border-slate-200 cursor-not-allowed'
     : showOnPortal
       ? 'bg-blue-50/50 border-blue-300/80 shadow-3xs cursor-pointer'
       : 'bg-slate-50 border-slate-200 hover:border-slate-300 cursor-pointer'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${showOnPortal ? 'bg-white text-blue-700 border-blue-200' : 'bg-slate-200/60 text-slate-400 border-transparent'
 }`}>
 <Users className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-bold text-slate-800 block">Portal de Padres</span>
 <span className="text-[10px] text-slate-500 block">
   {editingImage?.is_reported_by_parent ? 'Bloqueado permanentemente' : 'Comunidad de familias'}
 </span>
 </div>
 </div>
 <Switch
 checked={showOnPortal}
 disabled={editingImage?.is_reported_by_parent}
 onCheckedChange={(val) => {
   if (editingImage?.is_reported_by_parent) {
     toast.error('Esta imagen está bloqueada por privacidad del padre.');
     return;
   }
   setShowOnPortal(val);
 }}
 onClick={(e) => e.stopPropagation()}
 />
 </div>

 </div>
 </div>
 </div>

 {/* Modal Actions */}
 <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
 <button
 type="button"
 onClick={() => setIsImageModalOpen(false)}
 className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5"
 >
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>{editingImage ? 'Guardar Cambios' : 'Publicar en Galería'}</span>
 </button>
 </div>

 </form>
 </ResponsiveModal>
 )}

 {/* CREATE / EDIT CATEGORY MODAL (Only for Admins) */}
 {isOwnerOrAdmin && (
 <ResponsiveModal
 isOpen={isCatModalOpen}
 onClose={() => setIsCatModalOpen(false)}
 maxWidthClass="max-w-md"
 title={editingCat ? `Editar Categoría: ${editingCat.label}` : 'Nueva Categoría de Galería'}
 >
 <form onSubmit={handleSaveCategory} className="space-y-4">

 {/* Slug / ID Interno */}
 <div>
 <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
 ID / Slug Interno {editingCat ? '(No editable)' : '(Opcional)'}
 </label>
 <input
 type="text"
 value={catIdInput}
 onChange={(e) => setCatIdInput(e.target.value)}
 disabled={Boolean(editingCat)}
 placeholder="ej. practical, art (se auto-genera si se deja vacío)"
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest disabled:bg-slate-100 disabled:text-slate-500 shadow-3xs"
 />
 </div>

 {/* Language Tabs Bar for Category */}
 <div>
 <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
 <span>Nombres de la Categoría por Idioma</span>
 <span className="text-[10px] text-muted-foreground font-normal">({activeLangs.length} idiomas)</span>
 </label>

 <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full mb-3">
 {activeLangs.map((lang) => {
 const hasVal = Boolean(getCatLabelForLang(lang.code)?.trim());
 const isSelected = catLangTab === lang.code;
 return (
 <button
 key={lang.code}
 type="button"
 onClick={() => setCatLangTab(lang.code)}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${isSelected
 ? 'bg-white text-forest shadow-xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 <span>{lang.flag}</span>
 <span>{lang.nativeName}</span>
 {hasVal && (
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Nombre completado" />
 )}
 </button>
 );
 })}
 </div>

 {/* Dynamic Input for Selected Language Tab */}
 {(() => {
 const currentLangObj = activeLangs.find(l => l.code === catLangTab) || getLanguageByCode(catLangTab);
 const isPrimary = catLangTab === 'es' || catLangTab === (activeLangs[0]?.code || 'es');
 return (
 <div className="space-y-1 animate-in fade-in duration-150" key={catLangTab}>
 <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
 <span>{currentLangObj.flag}</span>
 <span>Nombre en {currentLangObj.nativeName}</span>
 {isPrimary && <span className="text-red-500">*</span>}
 </label>
 <input
 type="text"
 value={getCatLabelForLang(catLangTab)}
 onChange={(e) => setCatLabelForLang(catLangTab, e.target.value)}
 placeholder={`ej. Nombre en ${currentLangObj.nativeName}`}
 required={isPrimary}
 autoFocus
 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest bg-white shadow-3xs"
 />
 </div>
 );
 })()}
 </div>

 <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
 <button
 type="button"
 onClick={() => setIsCatModalOpen(false)}
 className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white font-display font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
 >
 {editingCat ? 'Guardar Cambios' : 'Crear Categoría'}
 </button>
 </div>
 </form>
 </ResponsiveModal>
 )}

 {/* CONFIRM DELETE DIALOG (Only for Admins) */}
 {isOwnerOrAdmin && (
 <ConfirmDialog
 isOpen={confirmDelete.isOpen}
 onClose={() => setConfirmDelete({ isOpen: false, type: 'image', id: '', title: '' })}
 onConfirm={handleExecuteDelete}
 title={confirmDelete.type === 'image' ? '¿Eliminar Fotografía?' : '¿Eliminar Categoría?'}
 description={
 confirmDelete.type === 'image'
 ? `¿Estás seguro de eliminar "${confirmDelete.title}" de la galería pública?`
 : `¿Estás seguro de eliminar la categoría "${confirmDelete.title}"? También se eliminarán las fotografías asociadas.`
 }
 confirmText="Sí, eliminar"
 variant="danger"
 />
 )}

 </div>
 );
};

export default AdminGallerySection;
