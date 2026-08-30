import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HeartHandshake, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Download, 
  UserCheck, 
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Mail,
  Paperclip,
  X,
  Camera,
  Loader2,
  Images,
  Maximize2,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { MobileMenuButton } from './AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import { uploadPhysicalFile } from '@/lib/api';
import { 
  getMyTutorStudents, 
  getDocuments, 
  getApplications, 
  getTutorNewsletters,
  getGalleryImages,
  updateStudent,
  reportGalleryImageByParent,
  StudentItem, 
  DocumentItem, 
  ApplicationItem,
  NewsletterItem,
  GalleryImageItem
} from '@/lib/sqlite';

export const TutorPortalSection: React.FC = () => {
  const { user, activeMembership } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>([]);
  const [readingNewsletter, setReadingNewsletter] = useState<NewsletterItem | null>(null);
  const [previewGalleryImage, setPreviewGalleryImage] = useState<GalleryImageItem | null>(null);
  const [reportingImage, setReportingImage] = useState<GalleryImageItem | null>(null);
  const [reportComment, setReportComment] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleCopyCode = (code?: string, id?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedStudentId(id || code);
    toast.success(`Matrícula ${code} copiada al portapapeles`);
    setTimeout(() => setCopiedStudentId(null), 2000);
  };

  const loadGallery = async () => {
    setLoadingGallery(true);
    try {
      const imgs = await getGalleryImages(undefined, 'portal');
      setGalleryImages(imgs);
    } catch {
      setGalleryImages([]);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStudent) return;

    try {
      setIsUploadingAvatar(true);
      toast.loading('Subiendo y optimizando nueva foto de perfil...', { id: 'upload-avatar' });
      
      const uploadRes = await uploadPhysicalFile(file, 'gallery', `Avatar-${activeStudent.full_name}`);
      
      await updateStudent(activeStudent.id, {
        avatarUrl: uploadRes.url
      });

      // Update in local state
      setStudents(prev => prev.map(s => s.id === activeStudent.id ? { ...s, avatar_url: uploadRes.url } : s));

      toast.success('Foto de perfil actualizada exitosamente.', { id: 'upload-avatar' });
      toast.info('Se están reprocesando las fotos de la galería para identificar automáticamente a tu hijo.', { duration: 5000 });

      // Refresh gallery after a few seconds to reflect newly identified photos
      setTimeout(() => {
        loadGallery();
      }, 4000);
    } catch (err: any) {
      console.error('Error updating child avatar:', err);
      toast.error(err.message || 'Error al actualizar la foto de perfil', { id: 'upload-avatar' });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;
      setLoading(true);
      const [studs, docs, apps, news, imgs] = await Promise.all([
        getMyTutorStudents(user.email),
        getDocuments(),
        getApplications(),
        getTutorNewsletters().catch(() => []),
        getGalleryImages(undefined, 'portal').catch(() => [])
      ]);
      setStudents(studs);
      if (studs.length > 0) {
        setSelectedStudentId(studs[0].id);
      }
      setDocuments(docs);
      setApplications(apps);
      setNewsletters(news);
      setGalleryImages(imgs);
      setLoading(false);
    };

    loadData();
  }, [user]);

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Full-width Header Banner without rounded corners */}
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 px-4 sm:px-6 md:px-8 py-6 md:py-8 bg-gradient-to-r from-forest via-forest-light to-forest text-white shadow-sm relative overflow-hidden border-b border-forest-light/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <MobileMenuButton className="!bg-white/20 !border-white/20 !text-white hover:!bg-white/30" />
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white leading-tight">
                ¡Hola, {user?.fullName || 'Familia'}!
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                Bienvenido a tu espacio personal. Aquí puedes consultar la información de tus hijos, comunicados oficiales, documentos y herramientas educativas.
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-white/90 shrink-0 space-y-0.5">
            <span className="text-[10px] text-white/60 uppercase font-bold block">Colegio Activo</span>
            <strong className="text-sm sm:text-base font-bold font-display block text-white">
              {activeMembership?.school.name || 'Escuela Montessori'}
            </strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Cargando información familiar...</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-xs">
          <HeartHandshake className="w-12 h-12 text-forest/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-forest">No hay estudiantes vinculados a tu cuenta</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Comunícate con la administración del colegio para que vinculen a tu hijo(a) con tu correo: <strong>{user?.email}</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* Multiple Children Switcher Tabs */}
          {students.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-forest/70 uppercase tracking-wider mr-2">
                Hijos registrados:
              </span>
              {students.map(s => {
                const isGrad = s.status === 'graduated';
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                      selectedStudentId === s.id
                        ? isGrad
                          ? 'bg-sky-900 text-white shadow-xs'
                          : 'bg-forest text-white shadow-xs'
                        : isGrad
                          ? 'bg-sky-50/70 border border-sky-200 text-sky-900 hover:bg-sky-100/70'
                          : 'bg-white border border-forest/10 text-forest hover:bg-forest/5'
                    }`}
                  >
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.full_name} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <GraduationCap className="w-4 h-4" />
                    )}
                    <span>{s.full_name}</span>
                    {isGrad && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        selectedStudentId === s.id ? 'bg-white/20 text-white' : 'bg-sky-200/80 text-sky-950'
                      }`}>
                        Egreso
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Student Card */}
          {activeStudent && (() => {
            const isGraduated = activeStudent.status === 'graduated';
            const isActive = activeStudent.status === 'active';
            const environmentDisplay = isGraduated 
              ? 'Sin ambiente / Egreso' 
              : !isActive 
                ? 'Sin ambiente / Inactivo' 
                : activeStudent.environment_name || activeStudent.grade || 'Ambiente Montessori';

            return (
              <div className={`bg-white rounded-3xl p-6 border shadow-xs relative transition-all ${
                isGraduated 
                  ? 'border-sky-200 bg-gradient-to-b from-sky-50/20 to-white' 
                  : 'border-forest/10'
              }`}>
                {/* Notice for graduated student */}
                {isGraduated && (
                  <div className="mb-4 bg-sky-500/10 border border-sky-300/60 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 text-xs text-sky-950">
                    <div className="flex items-center gap-2 font-medium">
                      <GraduationCap className="w-4 h-4 text-sky-700 shrink-0" />
                      <span>
                        <strong>Expediente Histórico:</strong> {activeStudent.full_name} completó su ciclo escolar (Graduado/Egreso). Puedes revisar sus evaluaciones y constancias emitidas.
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-200/70 text-sky-900 px-2 py-0.5 rounded-md shrink-0">
                      Egreso
                    </span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-forest/10">
                  <div className="flex items-center gap-4">
                    {/* Hidden input for changing child avatar */}
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />

                    {/* Interactive Avatar with Hover Camera Overlay */}
                    <div 
                      onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                      className={`group relative w-16 h-16 rounded-2xl overflow-hidden border font-bold flex items-center justify-center text-2xl font-display shadow-2xs shrink-0 cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-forest/30 ${
                        isGraduated 
                          ? 'bg-sky-100 border-sky-300/60 text-sky-900' 
                          : 'bg-forest/10 border-forest/15 text-forest'
                      }`}
                      title="Clic para cambiar la foto de perfil de tu hijo"
                    >
                      {isUploadingAvatar ? (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-forest" />
                        </div>
                      ) : activeStudent.avatar_url ? (
                        <img src={activeStudent.avatar_url} alt={activeStudent.full_name} className="w-full h-full object-cover" />
                      ) : (
                        activeStudent.full_name.charAt(0)
                      )}

                      {/* Camera icon on hover */}
                      {!isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4" />
                          <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wider">Cambiar</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-forest text-lg font-display">{activeStudent.full_name}</h3>
                        {isGraduated && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-sky-600" />
                            <span>Egresado</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                          className="text-[10px] text-forest/70 hover:text-forest hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Cambiar foto</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          isGraduated 
                            ? 'text-sky-800 bg-sky-50 border-sky-200 font-bold' 
                            : isActive 
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                              : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}>
                          {environmentDisplay}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    {/* Copyable Status & Enrollment Badge (Top Right) */}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(activeStudent.enrollment_code, activeStudent.id)}
                      title={activeStudent.enrollment_code ? `Clic para copiar matrícula: ${activeStudent.enrollment_code}` : 'Estado escolar'}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs group/copy cursor-pointer active:scale-95 ${
                        isGraduated
                          ? 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100 hover:border-sky-300'
                          : isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                            : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {isGraduated ? (
                        <GraduationCap className="w-3.5 h-3.5 text-sky-700" />
                      ) : isActive ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      ) : (
                        <Lock className="w-3 h-3 text-amber-700" />
                      )}
                      <span>
                        {isGraduated
                          ? `Egresado / Graduado${activeStudent.enrollment_code ? ` • ${activeStudent.enrollment_code}` : ''}`
                          : isActive
                            ? `Matrícula Activa${activeStudent.enrollment_code ? ` • ${activeStudent.enrollment_code}` : ''}`
                            : `Inactivo${activeStudent.enrollment_code ? ` • ${activeStudent.enrollment_code}` : ''}`}
                      </span>
                      {activeStudent.enrollment_code && (
                        copiedStudentId === activeStudent.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-50 group-hover/copy:opacity-100 transition-opacity shrink-0" />
                        )
                      )}
                    </button>

                    <div className="flex items-center gap-2 text-xs text-forest/80 bg-cream/70 px-3.5 py-1.5 rounded-xl border border-forest/10">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Tu rol: <strong>{activeStudent.relationship === 'FATHER' ? 'Padre' : activeStudent.relationship === 'MOTHER' ? 'Madre' : 'Tutor'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-cream/40 p-4 rounded-2xl border border-forest/5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ambiente Asignado</span>
                    <span className={`text-sm font-bold mt-1 block ${isGraduated ? 'text-sky-900' : 'text-forest'}`}>
                      {environmentDisplay}
                    </span>
                  </div>

                  <div className="bg-cream/40 p-4 rounded-2xl border border-forest/5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Colegio / Campus</span>
                    <span className="text-sm font-bold text-forest mt-1 block">
                      {activeMembership?.school.name}
                    </span>
                  </div>

                  <div className="bg-cream/40 p-4 rounded-2xl border border-forest/5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Atención Familiar</span>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {activeMembership?.school.phone || '+52 998 350 2849'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Applications & Portals */}
          {applications.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-forest text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-forest" />
                Plataformas y Accesos Escolares
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-white p-5 rounded-3xl border border-forest/10 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-forest text-base">{app.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{app.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-forest/5 flex flex-wrap gap-2">
                      {app.links.map(l => (
                        <a
                          key={l.id}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 bg-forest/5 hover:bg-forest hover:text-white text-forest text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                        >
                          {l.label}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Newsletters & Official Bulletins */}
          {newsletters.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-forest text-base flex items-center gap-2">
                <Mail className="w-5 h-5 text-forest" />
                Boletines & Comunicados Oficiales
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsletters.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setReadingNewsletter(item)}
                    className="bg-white p-5 rounded-3xl border border-forest/10 shadow-xs hover:border-forest/30 transition-all flex flex-col justify-between cursor-pointer space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-forest/10 text-forest font-bold">
                          Comunicado Oficial
                        </span>
                        <span>
                          {item.sentAt ? new Date(item.sentAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </span>
                      </div>

                      <h4 className="font-bold font-display text-forest text-base leading-snug line-clamp-2">
                        {item.title}
                      </h4>

                      {item.preheader && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.preheader}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-forest/5 flex items-center justify-between text-xs font-bold text-forest">
                      <span>Leer comunicado</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents & Circulars */}
          <div className="space-y-3">
            <h3 className="font-bold text-forest text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-forest" />
              Documentos Institucionales y Circulares
            </h3>
            {documents.length === 0 ? (
              <div className="bg-white p-6 rounded-3xl border border-forest/10 text-center text-xs text-muted-foreground">
                No hay documentos publicados actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-white p-4 rounded-2xl border border-forest/10 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-forest/5 text-forest flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-forest text-xs leading-snug">{doc.title}</h5>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{doc.description}</p>
                      </div>
                    </div>

                    {doc.file_data && (
                      <a
                        href={doc.file_data}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.file_name}
                        className="px-3 py-1.5 bg-cream text-forest hover:bg-forest hover:text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Ver
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Identified Gallery Photos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-forest text-base flex items-center gap-2">
                <Images className="w-5 h-5 text-forest" />
                Fotografías Escolares de {activeStudent.full_name}
              </h3>
              {galleryImages.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/15">
                  {galleryImages.length} {galleryImages.length === 1 ? 'fotografía' : 'fotografías'}
                </span>
              )}
            </div>

            {loadingGallery ? (
              <div className="bg-white p-8 rounded-3xl border border-forest/10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-forest" />
                <span>Cargando fotografías identificadas...</span>
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="bg-white p-6 rounded-3xl border border-forest/10 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Aún no hay fotografías donde se haya identificado a <strong>{activeStudent.full_name}</strong>.
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  💡 Tip: Puedes subir o cambiar su foto de perfil arriba para que el sistema inteligente escanee y etiquete automáticamente a tu hijo en las fotos de la escuela.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map(img => (
                  <div
                    key={img.id}
                    onClick={() => setPreviewGalleryImage(img)}
                    className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-forest/10 bg-slate-100 shadow-xs cursor-pointer hover:shadow-md hover:border-forest/30 transition-all"
                  >
                    <img
                      src={img.src}
                      alt={img.title || 'Foto de galería'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                      <div className="flex justify-end">
                        <span className="p-1 rounded-lg bg-black/40 text-white backdrop-blur-xs">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div>
                        {img.title && (
                          <h6 className="text-white text-xs font-bold truncate">{img.title}</h6>
                        )}
                        {img.created_at && (
                          <span className="text-[10px] text-white/80 block">
                            {new Date(img.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* GALLERY PHOTO LIGHTBOX MODAL */}
      {previewGalleryImage && (
        <div 
          onClick={() => setPreviewGalleryImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 cursor-default"
          >
            <div className="relative bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={previewGalleryImage.src}
                alt={previewGalleryImage.title || 'Foto'}
                className="max-h-[65vh] w-auto object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => setPreviewGalleryImage(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-forest text-base">{previewGalleryImage.title || 'Fotografía Escolar'}</h4>
                {previewGalleryImage.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{previewGalleryImage.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setReportingImage(previewGalleryImage);
                    setReportComment('');
                  }}
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  title="Solicitar retiro inmediato de esta foto de la galería"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Reportar / Retirar</span>
                </button>
                <a
                  href={previewGalleryImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-4 py-2 bg-forest text-white hover:bg-forest/90 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARENT PRIVACY REPORT MODAL */}
      {reportingImage && (
        <div 
          onClick={() => !isSubmittingReport && setReportingImage(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-forest text-base">Solicitar Retiro de Fotografía</h3>
                  <p className="text-xs text-muted-foreground">Privacidad y protección de imagen del alumno</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingReport}
                onClick={() => setReportingImage(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-forest hover:bg-forest/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 text-xs text-rose-900 space-y-1">
              <p className="font-semibold">⚠️ Acción Inmediata de Protección</p>
              <p className="text-[11px] text-rose-800/90 leading-relaxed">
                Al enviar este reporte, la imagen se <strong>desactivará automáticamente y de forma permanente</strong> de la galería pública y del portal escolar. Quedará registrada con tu comentario y nadie podrá reactivarla (solo el Owner o Superadmin podrán eliminarla).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-forest block">
                Motivo del retiro / Comentario familiar: <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                placeholder="Ej. Solicito retirar esta imagen por privacidad de mi hijo / No autorizo la difusión de esta foto."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-forest/20 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 bg-white"
              />
            </div>

            <div className="pt-2 border-t border-forest/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmittingReport}
                onClick={() => setReportingImage(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingReport || !reportComment.trim()}
                onClick={async () => {
                  if (!reportComment.trim() || !reportingImage) return;
                  try {
                    setIsSubmittingReport(true);
                    await reportGalleryImageByParent(reportingImage.id, {
                      comment: reportComment.trim(),
                      studentId: activeStudent?.id,
                      studentName: activeStudent?.full_name
                    });
                    toast.success('La fotografía fue retirada y bloqueada de la galería exitosamente.');
                    setReportingImage(null);
                    setPreviewGalleryImage(null);
                    loadGallery();
                  } catch (err: any) {
                    toast.error(err.message || 'Error al reportar imagen');
                  } finally {
                    setIsSubmittingReport(false);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isSubmittingReport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Retirando imagen...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Confirmar Retiro Inmediato</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEWSLETTER READER MODAL */}
      {readingNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-forest/15 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 bg-forest text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {activeMembership?.school.logoUrl && (
                  <img
                    src={activeMembership.school.logoUrl}
                    alt={activeMembership.school.name}
                    className="w-10 h-10 rounded-xl bg-white p-1 object-contain shrink-0 shadow-xs"
                  />
                )}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold block">
                    {activeMembership?.school.name || 'Escuela Montessori'}
                  </span>
                  <h3 className="font-display font-bold text-base sm:text-lg text-white line-clamp-1">
                    {readingNewsletter.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReadingNewsletter(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-3 border-b border-forest/10">
                <span>
                  Publicado: {readingNewsletter.sentAt ? new Date(readingNewsletter.sentAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Reciente'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-forest/10 text-forest font-bold text-[10px]">
                  Boletín Oficial
                </span>
              </div>

              <div
                className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: readingNewsletter.contentHtml }}
              />

              {Array.isArray(readingNewsletter.attachments) && readingNewsletter.attachments.length > 0 && (
                <div className="pt-4 border-t border-forest/10 space-y-3">
                  <h4 className="font-bold text-forest text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-forest" />
                    Archivos Adjuntos & Circulares ({readingNewsletter.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {readingNewsletter.attachments.map(att => (
                      <a
                        key={att.id}
                        href={att.fileData}
                        download={att.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-cream/40 hover:bg-cream border border-forest/15 rounded-2xl flex items-center justify-between gap-3 text-xs text-forest transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-forest/70 shrink-0 group-hover:text-forest" />
                          <div className="truncate">
                            <span className="font-bold block truncate">{att.fileName}</span>
                            <span className="text-[10px] text-muted-foreground">{Math.round((att.fileSize || 0) / 1024)} KB</span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-forest/60 group-hover:text-forest shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {readingNewsletter.authorName && (
                <div className="pt-4 border-t border-forest/10 text-xs text-muted-foreground">
                  <strong>Emitido por:</strong> {readingNewsletter.authorName}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-forest/5 border-t border-forest/10 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setReadingNewsletter(null)}
                className="px-5 py-2 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
