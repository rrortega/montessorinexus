import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { MobileMenuButton } from './AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import { 
  getMyTutorStudents, 
  getDocuments, 
  getApplications, 
  getTutorNewsletters,
  StudentItem, 
  DocumentItem, 
  ApplicationItem,
  NewsletterItem
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
  const [readingNewsletter, setReadingNewsletter] = useState<NewsletterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  const handleCopyCode = (code?: string, id?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedStudentId(id || code);
    toast.success(`Matrícula ${code} copiada al portapapeles`);
    setTimeout(() => setCopiedStudentId(null), 2000);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;
      setLoading(true);
      const [studs, docs, apps, news] = await Promise.all([
        getMyTutorStudents(user.email),
        getDocuments(),
        getApplications(),
        getTutorNewsletters().catch(() => [])
      ]);
      setStudents(studs);
      if (studs.length > 0) {
        setSelectedStudentId(studs[0].id);
      }
      setDocuments(docs);
      setApplications(apps);
      setNewsletters(news);
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
              {students.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                    selectedStudentId === s.id
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-white border border-forest/10 text-forest hover:bg-forest/5'
                  }`}
                >
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt={s.full_name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  <span>{s.full_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Active Student Card */}
          {activeStudent && (
            <div className="bg-white rounded-3xl p-6 border border-forest/10 shadow-xs relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-forest/10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-forest/10 border border-forest/15 text-forest font-bold flex items-center justify-center text-2xl font-display shadow-2xs shrink-0">
                    {activeStudent.avatar_url ? (
                      <img src={activeStudent.avatar_url} alt={activeStudent.full_name} className="w-full h-full object-cover" />
                    ) : (
                      activeStudent.full_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-forest text-lg font-display">{activeStudent.full_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {activeStudent.grade || 'Ambiente Montessori'}
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
                      activeStudent.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                        : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {activeStudent.status === 'active' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                      <Lock className="w-3 h-3 text-amber-700" />
                    )}
                    <span>
                      {activeStudent.status === 'active'
                        ? `Matrícula Activa${activeStudent.enrollment_code ? ` • ${activeStudent.enrollment_code}` : ''}`
                        : 'Inactivo / Archivo Histórico'}
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
                  <span className="text-sm font-bold text-forest mt-1 block">
                    {activeStudent.grade || 'Ambiente Montessori'}
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
          )}

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
        </>
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
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {readingNewsletter.coverImageUrl && (
                <img
                  src={readingNewsletter.coverImageUrl}
                  alt={readingNewsletter.title}
                  className="w-full max-h-64 object-cover rounded-2xl shadow-xs"
                />
              )}

              {readingNewsletter.preheader && (
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  {readingNewsletter.preheader}
                </div>
              )}

              <h1 className="font-display text-xl sm:text-2xl font-bold text-forest leading-tight">
                {readingNewsletter.title}
              </h1>

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
