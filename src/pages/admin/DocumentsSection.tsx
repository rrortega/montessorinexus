import React, { useState, useEffect, useRef } from 'react';
import {
 FolderPlus,
 FilePlus,
 Folder as FolderIcon,
 FileText,
 Globe,
 KeyRound,
 Trash2,
 Edit3,
 Download,
 Link as LinkIcon,
 ExternalLink,
 ChevronRight,
 Upload,
 Calendar,
 ShieldCheck,
 Check,
 Plus
} from 'lucide-react';
import { MobileMenuButton } from './AdminDashboard';
import {
 getFolders,
 createFolder,
 updateFolder,
 deleteFolder,
 getDocuments,
 createDocument,
 updateDocument,
 deleteDocument,
 getGlobalAccessCode,
 setGlobalAccessCode,
 Folder,
 DocumentItem,
 AccessType,
 GlobalAccessCode
} from '@/lib/sqlite';
import { toast } from 'sonner';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { uploadPhysicalFile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const DocumentsSection: React.FC = () => {
 const { role, activeMembership } = useAuth();
 const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';

 const [folders, setFolders] = useState<Folder[]>([]);
 const [documents, setDocuments] = useState<DocumentItem[]>([]);
 const [loading, setLoading] = useState<boolean>(true);
 const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

 // Global Access Code state
 const [globalCodeInfo, setGlobalCodeInfo] = useState<GlobalAccessCode | null>(null);
 const [globalCodeInput, setGlobalCodeInput] = useState('');
 const [globalExpiresInput, setGlobalExpiresInput] = useState('');
 const [savingGlobalCode, setSavingGlobalCode] = useState(false);

 // Folder Modal state
 const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
 const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
 const [folderTitle, setFolderTitle] = useState('');
 const [folderDesc, setFolderDesc] = useState('');
 const [folderTitleEn, setFolderTitleEn] = useState('');
 const [folderDescEn, setFolderDescEn] = useState('');
 const [folderAccess, setFolderAccess] = useState<AccessType>('public');
 const [folderLangTab, setFolderLangTab] = useState<'es' | 'en'>('es');

 // Document Modal state
 const [isDocModalOpen, setIsDocModalOpen] = useState(false);
 const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
 const [docTitle, setDocTitle] = useState('');
 const [docDesc, setDocDesc] = useState('');
 const [docTitleEn, setDocTitleEn] = useState('');
 const [docDescEn, setDocDescEn] = useState('');
 const [docAccess, setDocAccess] = useState<AccessType>('public');
 const [docFolderId, setDocFolderId] = useState<string>('');
 const [docSourceType, setDocSourceType] = useState<'upload' | 'external'>('upload');
 const [externalUrl, setExternalUrl] = useState('');
 const [docFile, setDocFile] = useState<File | null>(null);
 const [docLangTab, setDocLangTab] = useState<'es' | 'en'>('es');

 // Confirm Delete Dialog state
 const [confirmDelete, setConfirmDelete] = useState<{
 isOpen: boolean;
 type: 'folder' | 'document';
 id: string;
 title: string;
 }>({ isOpen: false, type: 'folder', id: '', title: '' });

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

 const stateId = 'doc-actions-sheet-' + Date.now();
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

 const loadData = async () => {
 setLoading(true);
 try {
 const fList = await getFolders();
 const dList = await getDocuments();
 const gCode = await getGlobalAccessCode();

 setFolders(fList);
 setDocuments(dList);
 setGlobalCodeInfo(gCode);

 if (gCode) {
 setGlobalCodeInput(gCode.code);
 const dt = new Date(gCode.expires_at);
 if (!isNaN(dt.getTime())) {
 const tzOffset = dt.getTimezoneOffset() * 60000;
 const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16);
 setGlobalExpiresInput(localISOTime);
 }
 }

 if (fList.length > 0 && !selectedFolderId) {
 setSelectedFolderId(fList[0].id);
 }
 } catch (e) {
 console.error(e);
 toast.error('Error al cargar datos desde SQLite.');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadData();
 }, []);

 const handleSaveGlobalCode = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden configurar códigos de autorización.');
 return;
 }
 if (!globalCodeInput.trim() || !globalExpiresInput) {
 toast.error('Ingresa el código y la fecha de caducidad.');
 return;
 }
 setSavingGlobalCode(true);
 try {
 const expIso = new Date(globalExpiresInput).toISOString();
 await setGlobalAccessCode(globalCodeInput.trim(), expIso);
 toast.success('Código de autorización global actualizado correctamente.');
 loadData();
 } catch (err) {
 console.error(err);
 toast.error('Error al actualizar el código global.');
 } finally {
 setSavingGlobalCode(false);
 }
 };

 // Open Folder Modal for create / edit
 const handleOpenFolderModal = (folder?: Folder) => {
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden crear o editar carpetas.');
 return;
 }
 if (folder) {
 setEditingFolder(folder);
 setFolderTitle(folder.title);
 setFolderDesc(folder.description);
 setFolderTitleEn(folder.title_en || '');
 setFolderDescEn(folder.description_en || '');
 setFolderAccess(folder.access_type === 'code_auth' ? 'code_auth' : 'public');
 } else {
 setEditingFolder(null);
 setFolderTitle('');
 setFolderDesc('');
 setFolderTitleEn('');
 setFolderDescEn('');
 setFolderAccess('public');
 }
 setFolderLangTab('es');
 setIsFolderModalOpen(true);
 };

 const handleSaveFolder = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden crear o editar carpetas.');
 return;
 }
 if (!folderTitle.trim()) {
 toast.error('Por favor ingresa un título en español para la carpeta.');
 return;
 }

 if (editingFolder) {
 await updateFolder(editingFolder.id, folderTitle.trim(), folderDesc.trim(), folderAccess, folderTitleEn.trim(), folderDescEn.trim());
 toast.success('Carpeta actualizada correctamente.');
 } else {
 const newF = await createFolder(folderTitle.trim(), folderDesc.trim(), folderAccess, folderTitleEn.trim(), folderDescEn.trim());
 setSelectedFolderId(newF.id);
 toast.success('Carpeta creada exitosamente.');
 }

 setIsFolderModalOpen(false);
 loadData();
 };

 const promptDeleteFolder = (id: string, title: string) => {
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden eliminar carpetas.');
 return;
 }
 setConfirmDelete({
 isOpen: true,
 type: 'folder',
 id,
 title
 });
 };

 // Open Document Modal for create / edit
 const handleOpenDocModal = (doc?: DocumentItem) => {
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden crear o editar documentos.');
 return;
 }
 if (doc) {
 setEditingDoc(doc);
 setDocTitle(doc.title);
 setDocDesc(doc.description);
 setDocTitleEn(doc.title_en || '');
 setDocDescEn(doc.description_en || '');
 setDocAccess(doc.access_type === 'code_auth' ? 'code_auth' : 'public');
 setDocFolderId(doc.folder_id);
 setDocFile(null);
 const isExt = doc.file_data.startsWith('http://') || doc.file_data.startsWith('https://') || doc.file_type === 'external';
 setDocSourceType(isExt ? 'external' : 'upload');
 setExternalUrl(isExt ? doc.file_data : '');
 } else {
 setEditingDoc(null);
 setDocTitle('');
 setDocDesc('');
 setDocTitleEn('');
 setDocDescEn('');
 setDocAccess(selectedFolderId ? (folders.find(f => f.id === selectedFolderId)?.access_type === 'code_auth' ? 'code_auth' : 'public') : 'public');
 setDocFolderId(selectedFolderId || (folders[0]?.id || ''));
 setDocFile(null);
 setDocSourceType('upload');
 setExternalUrl('');
 }
 setDocLangTab('es');
 setIsDocModalOpen(true);
 };

 const handleSaveDocument = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden crear o editar documentos.');
 return;
 }
 if (!docTitle.trim()) {
 toast.error('Ingresa el título del documento en español.');
 return;
 }

 if (!docFolderId) {
 toast.error('Selecciona una carpeta para el documento.');
 return;
 }

 let fileDataUrl = '';
 let fileName = 'Documento';
 let fileType = 'application/pdf';

 if (docSourceType === 'external') {
 if (!externalUrl.trim()) {
 toast.error('Ingresa la URL del enlace externo (ej. Google Drive).');
 return;
 }
 fileDataUrl = externalUrl.trim();
 fileName = 'Enlace a Google Drive';
 fileType = 'external';
 } else {
 if (docFile) {
 fileName = docFile.name;
 fileType = docFile.type || 'application/octet-stream';
 try {
 const uploadRes = await uploadPhysicalFile(docFile, 'documents');
 fileDataUrl = uploadRes.url;
 } catch (err) {
 console.warn('Physical document upload failed, fallback to base64', err);
 fileDataUrl = await new Promise<string>((resolve) => {
 const reader = new FileReader();
 reader.onloadend = () => resolve(reader.result as string);
 reader.readAsDataURL(docFile);
 });
 }
 } else if (editingDoc && !editingDoc.file_data.startsWith('http')) {
 fileDataUrl = editingDoc.file_data;
 fileName = editingDoc.file_name;
 fileType = editingDoc.file_type;
 } else {
 fileDataUrl = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwvTGVuZ3RoIDIgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nCs2MFMwVDAyUDBWACJDBRMAHtcDNwplbmRzdHJlYW0KZW5kb2JqCjIgMCBvYmoKMTkKZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXMgPDw+Pi9BDQo=';
 fileName = 'documento.pdf';
 }
 }

 if (editingDoc) {
 await updateDocument(editingDoc.id, {
 title: docTitle.trim(),
 description: docDesc.trim(),
 title_en: docTitleEn.trim(),
 description_en: docDescEn.trim(),
 access_type: docAccess,
 file_name: fileName,
 file_type: fileType,
 file_data: fileDataUrl,
 });
 toast.success('Documento actualizado.');
 } else {
 await createDocument({
 folder_id: docFolderId,
 title: docTitle.trim(),
 description: docDesc.trim(),
 title_en: docTitleEn.trim(),
 description_en: docDescEn.trim(),
 access_type: docAccess,
 file_name: fileName,
 file_type: fileType,
 file_data: fileDataUrl,
 });
 toast.success('Documento guardado correctamente.');
 }

 setIsDocModalOpen(false);
 loadData();
 };

 const promptDeleteDocument = (id: string, title: string) => {
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden eliminar documentos.');
 return;
 }
 setConfirmDelete({
 isOpen: true,
 type: 'document',
 id,
 title
 });
 };

 const handleConfirmExecuteDelete = async () => {
 if (!isOwnerOrAdmin) {
 toast.error('Solo los administradores pueden eliminar elementos.');
 return;
 }
 if (confirmDelete.type === 'folder') {
 await deleteFolder(confirmDelete.id);
 toast.success('Carpeta eliminada.');
 if (selectedFolderId === confirmDelete.id) setSelectedFolderId(null);
 } else {
 await deleteDocument(confirmDelete.id);
 toast.success('Documento eliminado.');
 }
 loadData();
 };

 const selectedFolder = folders.find(f => f.id === selectedFolderId);
 const activeFolderDocs = documents.filter(d => d.folder_id === selectedFolderId);

 const isGlobalCodeActive = globalCodeInfo ? new Date() <= new Date(globalCodeInfo.expires_at) : false;

 const getAccessBadge = (access: AccessType) => {
 if (access === 'public') {
 return (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
 <Globe className="w-3.5 h-3.5" />
 Público
 </span>
 );
 }
 return (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/20">
 <KeyRound className="w-3.5 h-3.5" />
 Código Global
 </span>
 );
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
 Documentos & Circulares
 </h1>
 <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white font-mono border border-white/20">
 {folders.length} {folders.length === 1 ? 'carpeta' : 'carpetas'} • {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
 </span>
 </div>
 <p className="hidden sm:block text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
 {isOwnerOrAdmin
 ? 'Gestiona carpetas, comunicados institucionales y reglamentos con soporte bilingüe y enlaces externos.'
 : 'Consulta y descarga los comunicados oficiales, guías pedagógicas y reglamentos institucionales del colegio.'}
 </p>
 </div>
 </div>

 <div className="relative z-10 flex items-center gap-2 flex-wrap shrink-0">
 {isOwnerOrAdmin ? (
 <>
 <button
 type="button"
 onClick={() => handleOpenFolderModal()}
 className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-white/20 shadow-xs transition-all hover:scale-105 active:scale-95"
 >
 <FolderPlus className="w-4 h-4" />
 <span>Nueva Carpeta</span>
 </button>

 <button
 type="button"
 onClick={() => handleOpenDocModal()}
 disabled={folders.length === 0}
 className="px-4 py-2.5 bg-white text-forest hover:bg-white/90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
 >
 <FilePlus className="w-4 h-4 text-forest" />
 <span>Subir / Enlazar</span>
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

 {/* Global Access Code Configuration Card (ADMIN ONLY) */}
 {isOwnerOrAdmin && (
 <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-amber-500/20 shadow-sm space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/10 pb-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0">
 <KeyRound className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-display font-bold text-forest text-base flex items-center gap-2">
 Código de Autorización Global para Documentos
 </h3>
 <p className="text-xs text-muted-foreground">
 Este código único desbloquea todos los documentos restringidos de la plataforma hasta su fecha de caducidad.
 </p>
 </div>
 </div>

 {globalCodeInfo && (
 <span className={`px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-center border ${isGlobalCodeActive
 ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
 : 'bg-destructive/10 text-destructive border-destructive/20'
 }`}>
 {isGlobalCodeActive ? '● Código Activo' : ' Código Caducado'}
 </span>
 )}
 </div>

 <form onSubmit={handleSaveGlobalCode} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Código de Autorización Global *
 </label>
 <div className="relative">
 <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 value={globalCodeInput}
 onChange={(e) => setGlobalCodeInput(e.target.value.toUpperCase())}
 placeholder="ej. CEIBA2026"
 required
 className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-forest/20 text-sm font-mono tracking-widest font-bold text-forest focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Fecha y Hora de Caducidad *
 </label>
 <div className="relative">
 <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="datetime-local"
 value={globalExpiresInput}
 onChange={(e) => setGlobalExpiresInput(e.target.value)}
 required
 className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-forest/20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest bg-white text-forest"
 />
 </div>
 </div>

 <div>
 <button
 type="submit"
 disabled={savingGlobalCode}
 className="w-full px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
 >
 <ShieldCheck className="w-4 h-4" />
 <span>{savingGlobalCode ? 'Guardando...' : 'Guardar Código Global'}</span>
 </button>
 </div>
 </form>

 {globalCodeInfo && (
 <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-between pt-1">
 <span>
 Código actual: <code className="font-mono font-bold text-forest">{globalCodeInfo.code}</code>
 </span>
 <span>
 Caducidad: <span className="font-medium text-forest">{new Date(globalCodeInfo.expires_at).toLocaleString()}</span>
 </span>
 </div>
 )}
 </div>
 )}

 {/* Main Grid: Left Folders Sidebar + Right Folder Content */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

 {/* Folders List */}
 <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-forest/10 shadow-sm space-y-4">
 <div className="flex items-center justify-between border-b border-forest/10 pb-3">
 <h3 className="font-display font-bold text-forest text-base flex items-center gap-2">
 <FolderIcon className="w-4 h-4 text-terracotta" />
 Carpetas ({folders.length})
 </h3>
 {isOwnerOrAdmin && (
 <button
 onClick={() => handleOpenFolderModal()}
 className="text-xs font-bold text-forest hover:text-terracotta transition-colors flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Nueva</span>
 </button>
 )}
 </div>

 {folders.length === 0 ? (
 <div className="text-center py-8 text-xs text-muted-foreground">
 No hay carpetas creadas aún.
 </div>
 ) : (
 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
 {folders.map((f) => {
 const isSelected = selectedFolderId === f.id;
 const docCount = documents.filter(d => d.folder_id === f.id).length;
 return (
 <div
 key={f.id}
 onClick={() => setSelectedFolderId(f.id)}
 className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${isSelected
 ? 'bg-forest/10 border-forest text-forest shadow-sm'
 : 'bg-white/60 border-forest/10 hover:bg-forest/5 text-muted-foreground hover:text-forest'
 }`}
 >
 <div className="flex items-center gap-3 overflow-hidden">
 <FolderIcon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-forest' : 'text-forest/60'}`} />
 <div className="truncate">
 <div className="flex items-center gap-1.5">
 <span className="font-semibold text-sm block truncate text-forest">
 {f.title}
 </span>
 {f.title_en && (
 <span className="text-[10px] bg-forest/10 text-forest px-1.5 py-0.2 rounded font-semibold uppercase">
 EN
 </span>
 )}
 </div>
 <div className="flex items-center gap-2 text-xs mt-0.5">
 <span>{docCount} {docCount === 1 ? 'doc' : 'docs'}</span>
 <span>•</span>
 {getAccessBadge(f.access_type)}
 </div>
 </div>
 </div>

 {isOwnerOrAdmin && (
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={(e) => { e.stopPropagation(); handleOpenFolderModal(f); }}
 className="p-1.5 hover:bg-forest/10 rounded-lg text-forest"
 title="Editar Carpeta"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); promptDeleteFolder(f.id, f.title); }}
 className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"
 title="Eliminar Carpeta"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Folder Content / Document List */}
 <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-forest/10 shadow-sm space-y-4">

 {selectedFolder ? (
 <>
 {/* Selected Folder Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest/10 pb-4">
 <div>
 <div className="flex items-center gap-2 text-xs font-semibold text-forest/70 uppercase">
 <span>Carpeta Activa</span>
 <ChevronRight className="w-3 h-3" />
 {getAccessBadge(selectedFolder.access_type)}
 </div>
 <div className="flex items-center gap-2 mt-1">
 <h3 className="font-display font-bold text-forest text-xl">
 {selectedFolder.title}
 </h3>
 {selectedFolder.title_en && (
 <span className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded-md font-semibold">
 EN: {selectedFolder.title_en}
 </span>
 )}
 </div>
 {selectedFolder.description && (
 <p className="text-xs text-muted-foreground mt-0.5">
 ES: {selectedFolder.description}
 </p>
 )}
 {selectedFolder.description_en && (
 <p className="text-xs text-muted-foreground italic">
 EN: {selectedFolder.description_en}
 </p>
 )}
 </div>

 {isOwnerOrAdmin && (
 <div className="flex items-center gap-2 self-start sm:self-center">
 <button
 onClick={() => handleOpenFolderModal(selectedFolder)}
 className="px-3 py-1.5 border border-forest/20 text-forest rounded-xl text-xs font-semibold hover:bg-forest/5"
 >
 Editar Carpeta
 </button>
 <button
 onClick={() => handleOpenDocModal()}
 className="px-3.5 py-1.5 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest/90 flex items-center gap-1.5 shadow-sm"
 >
 <FilePlus className="w-3.5 h-3.5" />
 Crear / Enlazar
 </button>
 </div>
 )}
 </div>

 {/* Documents List inside Folder */}
 {activeFolderDocs.length === 0 ? (
 <div className="text-center py-12 border-2 border-dashed border-forest/15 rounded-2xl">
 <FileText className="w-10 h-10 text-forest/30 mx-auto mb-2" />
 <p className="font-semibold text-forest text-sm">Carpeta vacía</p>
 <p className="text-xs text-muted-foreground mt-1">No hay documentos guardados en esta carpeta aún.</p>
 {isOwnerOrAdmin && (
 <button
 onClick={() => handleOpenDocModal()}
 className="mt-4 px-4 py-2 bg-terracotta text-white rounded-xl text-xs font-semibold hover:bg-terracotta/90 inline-flex items-center gap-1.5"
 >
 <FilePlus className="w-3.5 h-3.5" />
 Agregar Primer Documento
 </button>
 )}
 </div>
 ) : (
 <div className="space-y-3">
 {activeFolderDocs.map((doc) => {
 const isExternal = doc.file_data.startsWith('http://') || doc.file_data.startsWith('https://') || doc.file_type === 'external';
 return (
 <div
 key={doc.id}
 className="p-4 rounded-2xl bg-white border border-forest/10 shadow-sm hover:border-forest/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
 >
 <div className="flex items-start gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isExternal ? 'bg-sky-500/10 text-sky-700' : 'bg-forest/10 text-forest'
 }`}>
 {isExternal ? <LinkIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h4 className="font-semibold text-forest text-sm">{doc.title}</h4>
 {doc.title_en && (
 <span className="text-[10px] bg-forest/10 text-forest px-1.5 py-0.2 rounded font-semibold uppercase">
 EN: {doc.title_en}
 </span>
 )}
 </div>
 {doc.description && (
 <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
 ES: {doc.description}
 </p>
 )}
 {doc.description_en && (
 <p className="text-xs text-muted-foreground/80 italic line-clamp-1">
 EN: {doc.description_en}
 </p>
 )}
 <div className="flex flex-wrap items-center gap-2 mt-2">
 {isExternal ? (
 <span className="text-[11px] font-semibold text-sky-700 bg-sky-500/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
 <ExternalLink className="w-3 h-3" />
 Google Drive / Externo
 </span>
 ) : (
 <span className="text-[11px] text-muted-foreground bg-forest/5 px-2 py-0.5 rounded font-mono">
 {doc.file_name}
 </span>
 )}
 {getAccessBadge(doc.access_type)}
 </div>
 </div>
 </div>

 {/* Action buttons per document */}
 <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
 {isExternal ? (
 <a
 href={doc.file_data}
 target="_blank"
 rel="noreferrer"
 className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-sky-200 shadow-2xs"
 title="Abrir Enlace Externo"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 <span>Abrir</span>
 </a>
 ) : (
 <a
 href={doc.file_data}
 download={doc.file_name}
 className="px-3 py-1.5 bg-forest/10 hover:bg-forest/20 text-forest rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-forest/15 shadow-2xs"
 title="Descargar Documento"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Descargar</span>
 </a>
 )}

 {isOwnerOrAdmin && (
 <>
 <button
 onClick={() => handleOpenDocModal(doc)}
 className="p-2 text-forest/80 hover:bg-forest/10 rounded-xl transition-colors"
 title="Editar Documento"
 >
 <Edit3 className="w-4 h-4" />
 </button>

 <button
 onClick={() => promptDeleteDocument(doc.id, doc.title)}
 className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
 title="Eliminar Documento"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </>
 ) : (
 <div className="text-center py-12 text-muted-foreground text-sm">
 Selecciona una carpeta para ver o descargar sus documentos.
 </div>
 )}
 </div>

 </div>

 {/* SlideOverDrawer: Crear / Editar Carpeta */}
 <SlideOverDrawer
 isOpen={isFolderModalOpen}
 onClose={() => setIsFolderModalOpen(false)}
 maxWidthClass="max-w-lg"
 icon={<FolderIcon className="w-5 h-5 text-forest" />}
 title={editingFolder ? 'Editar Carpeta' : 'Nueva Carpeta'}
 description="Organiza tus circulares, formatos o guías en categorías claras."
 footer={
 <>
 <button
 type="button"
 onClick={() => setIsFolderModalOpen(false)}
 className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest"
 >
 Cancelar
 </button>
 <button
 type="submit"
 form="folder-drawer-form"
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
 >
 <Check className="w-4 h-4" />
 <span>{editingFolder ? 'Guardar Cambios' : 'Crear Carpeta'}</span>
 </button>
 </>
 }
 >
 <div className="space-y-4">
 <div className="flex items-center justify-end pb-2">
 {/* Language Selector Tabs */}
 <div className="flex items-center gap-1 bg-cream/80 p-1 rounded-xl border border-forest/10">
 <button
 type="button"
 onClick={() => setFolderLangTab('es')}
 className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${folderLangTab === 'es' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:text-forest'
 }`}
 >
 🇪🇸 Español
 </button>
 <button
 type="button"
 onClick={() => setFolderLangTab('en')}
 className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${folderLangTab === 'en' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:text-forest'
 }`}
 >
 🇬🇧 English
 </button>
 </div>
 </div>

 <form id="folder-drawer-form" onSubmit={handleSaveFolder} className="space-y-4">
 {folderLangTab === 'es' ? (
 <>
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Título de la Carpeta (Español) *
 </label>
 <input
 type="text"
 value={folderTitle}
 onChange={(e) => setFolderTitle(e.target.value)}
 placeholder="ej. Formularios de Admisión"
 required
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Descripción (Español)
 </label>
 <textarea
 value={folderDesc}
 onChange={(e) => setFolderDesc(e.target.value)}
 placeholder="Breve descripción en español..."
 rows={3}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white leading-relaxed"
 />
 </div>
 </>
 ) : (
 <>
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Folder Title (English)
 </label>
 <input
 type="text"
 value={folderTitleEn}
 onChange={(e) => setFolderTitleEn(e.target.value)}
 placeholder="e.g. Admission Forms"
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Description (English)
 </label>
 <textarea
 value={folderDescEn}
 onChange={(e) => setFolderDescEn(e.target.value)}
 placeholder="Short description in English..."
 rows={3}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white leading-relaxed"
 />
 </div>
 </>
 )}

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Control de Acceso Predeterminado *
 </label>
 <select
 value={folderAccess}
 onChange={(e) => setFolderAccess(e.target.value as AccessType)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 >
 <option value="public">Público (Acceso / Descarga Directa)</option>
 <option value="code_auth">Código de Autorización Global</option>
 </select>
 </div>
 </form>
 </div>
 </SlideOverDrawer>

 {/* SlideOverDrawer: Crear / Editar Documento */}
 <SlideOverDrawer
 isOpen={isDocModalOpen}
 onClose={() => setIsDocModalOpen(false)}
 maxWidthClass="max-w-lg lg:max-w-xl"
 icon={<FileText className="w-5 h-5 text-forest" />}
 title={editingDoc ? 'Editar Documento' : 'Crear / Enlazar Documento'}
 description="Publica circulares, menús o reglamentos para las familias."
 footer={
 <>
 <button
 type="button"
 onClick={() => setIsDocModalOpen(false)}
 className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest"
 >
 Cancelar
 </button>
 <button
 type="submit"
 form="doc-drawer-form"
 className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
 >
 <Check className="w-4 h-4" />
 <span>{editingDoc ? 'Guardar Cambios' : 'Guardar Documento'}</span>
 </button>
 </>
 }
 >
 <div className="space-y-4">
 <div className="flex items-center justify-end pb-2">
 {/* Language Selector Tabs */}
 <div className="flex items-center gap-1 bg-cream/80 p-1 rounded-xl border border-forest/10">
 <button
 type="button"
 onClick={() => setDocLangTab('es')}
 className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${docLangTab === 'es' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:text-forest'
 }`}
 >
 🇪🇸 Español
 </button>
 <button
 type="button"
 onClick={() => setDocLangTab('en')}
 className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${docLangTab === 'en' ? 'bg-forest text-white shadow-xs' : 'text-forest/70 hover:text-forest'
 }`}
 >
 🇬🇧 English
 </button>
 </div>
 </div>

 <form id="doc-drawer-form" onSubmit={handleSaveDocument} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Carpeta de Destino *
 </label>
 <select
 value={docFolderId}
 onChange={(e) => setDocFolderId(e.target.value)}
 required
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 >
 {folders.map(f => (
 <option key={f.id} value={f.id}>{f.title}</option>
 ))}
 </select>
 </div>

 {/* Source Type Selector */}
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5">
 Tipo de Origen del Documento *
 </label>
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => setDocSourceType('upload')}
 className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${docSourceType === 'upload'
 ? 'bg-forest text-white border-forest shadow-xs'
 : 'bg-cream/40 border-forest/20 text-forest/70 hover:text-forest'
 }`}
 >
 <Upload className="w-4 h-4" />
 <span>Subir Archivo</span>
 </button>

 <button
 type="button"
 onClick={() => setDocSourceType('external')}
 className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${docSourceType === 'external'
 ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
 : 'bg-cream/40 border-forest/20 text-forest/70 hover:text-forest'
 }`}
 >
 <LinkIcon className="w-4 h-4" />
 <span>Enlace (Google Drive)</span>
 </button>
 </div>
 </div>

 {docLangTab === 'es' ? (
 <>
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Título del Documento (Español) *
 </label>
 <input
 type="text"
 value={docTitle}
 onChange={(e) => setDocTitle(e.target.value)}
 placeholder="ej. Reglamento Escolar 2026"
 required
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Descripción del Documento (Español)
 </label>
 <textarea
 value={docDesc}
 onChange={(e) => setDocDesc(e.target.value)}
 placeholder="Información relevante o instrucciones del archivo en español..."
 rows={3}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white leading-relaxed"
 />
 </div>
 </>
 ) : (
 <>
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Document Title (English)
 </label>
 <input
 type="text"
 value={docTitleEn}
 onChange={(e) => setDocTitleEn(e.target.value)}
 placeholder="e.g. School Handbook 2026"
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Document Description (English)
 </label>
 <textarea
 value={docDescEn}
 onChange={(e) => setDocDescEn(e.target.value)}
 placeholder="Relevant information or file instructions in English..."
 rows={3}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white leading-relaxed"
 />
 </div>
 </>
 )}

 {docSourceType === 'external' ? (
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 URL del Enlace Externo (Google Drive, Dropbox, etc.) *
 </label>
 <div className="relative">
 <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="url"
 value={externalUrl}
 onChange={(e) => setExternalUrl(e.target.value)}
 placeholder="https://drive.google.com/file/d/..."
 required
 className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest font-mono bg-white"
 />
 </div>
 <span className="text-[11px] text-muted-foreground block mt-1">
 Asegúrate de que el enlace en Google Drive esté configurado como "Cualquier persona con el enlace puede ver".
 </span>
 </div>
 ) : (
 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Archivo adjunto (PDF, Doc, Imagen)
 </label>
 <input
 type="file"
 onChange={(e) => setDocFile(e.target.files?.[0] || null)}
 className="w-full px-3 py-2 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 />
 {editingDoc && !docFile && !editingDoc.file_data.startsWith('http') && (
 <span className="text-[11px] text-muted-foreground block mt-1">
 Archivo actual: <code className="font-mono">{editingDoc.file_name}</code> (Déjalo vacío para no cambiarlo)
 </span>
 )}
 </div>
 )}

 <div>
 <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1">
 Control de Acceso Específico *
 </label>
 <select
 value={docAccess}
 onChange={(e) => setDocAccess(e.target.value as AccessType)}
 className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
 >
 <option value="public">Público (Acceso / Descarga Directa)</option>
 <option value="code_auth">Código de Autorización Global</option>
 </select>
 </div>
 </form>
 </div>
 </SlideOverDrawer>

 {/* CONFIRM DELETE DIALOG */}
 <ConfirmDialog
 isOpen={confirmDelete.isOpen}
 onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
 onConfirm={handleConfirmExecuteDelete}
 title={confirmDelete.type === 'folder' ? '¿Eliminar Carpeta?' : '¿Eliminar Documento?'}
 message={
 confirmDelete.type === 'folder'
 ? `¿Estás seguro de eliminar la carpeta "${confirmDelete.title}" y todos sus documentos vinculados? Esta acción no se puede deshacer.`
 : `¿Estás seguro de eliminar el documento "${confirmDelete.title}"? Esta acción no se puede deshacer.`
 }
 confirmText="Sí, Eliminar"
 cancelText="Cancelar"
 variant="danger"
 />

 {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
 <button
 type="button"
 onClick={() => setMobileActionsOpen(true)}
 className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-forest/30"
 aria-label="Crear carpeta o documento"
 title="Crear carpeta o documento"
 >
 <Plus className="w-7 h-7" />
 </button>

 {/* MOBILE BOTTOM ACTION DRAWER / SHEET */}
 {mobileActionsOpen && (
 <div
 className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end animate-in fade-in duration-200"
 onClick={() => setMobileActionsOpen(false)}
 >
 <div
 className="w-full bg-white rounded-t-3xl p-6 shadow-2xl border-t border-forest/10 space-y-4 animate-in slide-in-from-bottom duration-300 pb-8 select-none"
 onClick={(e) => e.stopPropagation()}
 onTouchStart={handleSheetTouchStart}
 onTouchMove={handleSheetTouchMove}
 onTouchEnd={handleSheetTouchEnd}
 style={{
 transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : undefined,
 transition: isSheetDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
 }}
 >
 {/* Handle pill (touch friendly) */}
 <div className="py-2 -my-2 cursor-grab active:cursor-grabbing">
 <div className="w-12 h-1.5 bg-forest/20 rounded-full mx-auto mb-1 transition-colors" />
 </div>

 <div className="text-left">
 <h3 className="font-display font-bold text-forest text-lg leading-tight">
 ¿Qué deseas crear?
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Selecciona una acción para organizar el repositorio escolar.
 </p>
 </div>

 <div className="space-y-2.5 pt-1">
 {/* Option 1: Nueva Carpeta */}
 <button
 type="button"
 onClick={() => {
 setMobileActionsOpen(false);
 handleOpenFolderModal();
 }}
 className="w-full p-4 rounded-2xl bg-forest/5 hover:bg-forest/10 border border-forest/10 flex items-center gap-3.5 text-left transition-all active:scale-98"
 >
 <div className="w-11 h-11 rounded-xl bg-forest text-white flex items-center justify-center shrink-0 shadow-xs">
 <FolderPlus className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-bold text-forest text-sm">Nueva Carpeta</h4>
 <span className="text-xs text-muted-foreground block">
 Agrupa circulares, formatos o guías por categorías
 </span>
 </div>
 </button>

 {/* Option 2: Crear / Enlazar Documento */}
 <button
 type="button"
 onClick={() => {
 setMobileActionsOpen(false);
 handleOpenDocModal();
 }}
 disabled={folders.length === 0}
 className="w-full p-4 rounded-2xl bg-forest/5 hover:bg-forest/10 border border-forest/10 flex items-center gap-3.5 text-left transition-all active:scale-98 disabled:opacity-50"
 >
 <div className="w-11 h-11 rounded-xl bg-terracotta text-white flex items-center justify-center shrink-0 shadow-xs">
 <FilePlus className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-bold text-forest text-sm">Crear / Enlazar Documento</h4>
 <span className="text-xs text-muted-foreground block">
 Sube un archivo PDF/imagen o vincula un enlace de Google Drive
 </span>
 </div>
 </button>
 </div>

 {/* Cancel Button */}
 <button
 type="button"
 onClick={() => setMobileActionsOpen(false)}
 className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-forest hover:bg-forest/5 rounded-2xl transition-colors"
 >
 Cancelar
 </button>
 </div>
 </div>
 )}

 </div>
 );
};
