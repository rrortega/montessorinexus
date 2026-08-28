import React, { useState, useEffect } from 'react';
import {
  FileText,
  Lock,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFolders, getDocuments, validateGlobalAccessCode, Folder, DocumentItem } from '@/lib/sqlite';
import { useI18n } from '@/context/I18nContext';
import { toast } from 'sonner';
import docsHeroImage from '@/assets/ceiba-docs-hero.png';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

export const PublicDocumentsSection: React.FC = () => {
  const { locale } = useI18n();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Access Verification modal state
  const [activeAccessDoc, setActiveAccessDoc] = useState<DocumentItem | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [unlockedDocIds, setUnlockedDocIds] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const fList = await getFolders();
        const dList = await getDocuments();
        setFolders(fList);
        setDocuments(dList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadAttempt = (doc: DocumentItem) => {
    // If public or already unlocked in session
    if (doc.access_type === 'public' || unlockedDocIds.includes(doc.id)) {
      triggerDownload(doc);
      return;
    }

    // Otherwise open access prompt modal
    setActiveAccessDoc(doc);
    setCodeInput('');
  };

  const triggerDownload = (doc: DocumentItem) => {
    const isExternal = doc.file_data.startsWith('http://') || doc.file_data.startsWith('https://') || doc.file_type === 'external';
    const displayTitle = locale === 'en' && doc.title_en ? doc.title_en : doc.title;

    if (isExternal) {
      window.open(doc.file_data, '_blank', 'noopener,noreferrer');
      toast.success(locale === 'en' ? `Opening ${displayTitle}...` : `Abriendo ${displayTitle}...`);
    } else {
      const a = document.createElement('a');
      a.href = doc.file_data;
      a.download = doc.file_name || `${displayTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(locale === 'en' ? `Downloading ${displayTitle}...` : `Descargando ${displayTitle}...`);
    }
  };

  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccessDoc) return;

    if (!codeInput.trim()) {
      toast.error(locale === 'en' ? 'Please enter the access code.' : 'Ingresa el código de autorización.');
      return;
    }

    setVerifying(true);
    try {
      const res = await validateGlobalAccessCode(codeInput);
      if (res.valid) {
        setUnlockedDocIds(prev => [...prev, activeAccessDoc.id]);
        toast.success(locale === 'en' ? 'Authorization code verified. Access granted.' : 'Código de autorización verificado. Acceso concedido.');
        triggerDownload(activeAccessDoc);
        setActiveAccessDoc(null);
      } else {
        toast.error(res.error || (locale === 'en' ? 'Invalid authorization code.' : 'Código de autorización no válido.'));
      }
    } catch (err) {
      console.error(err);
      toast.error(locale === 'en' ? 'Error verifying code.' : 'Error al verificar el código.');
    } finally {
      setVerifying(false);
    }
  };

  // Helper to detect document format label
  const getFormatBadge = (doc: DocumentItem) => {
    if (doc.file_data.startsWith('http://') || doc.file_data.startsWith('https://') || doc.file_type === 'external') {
      return 'GOOGLE DRIVE';
    }
    const name = doc.file_name.toLowerCase();
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'PNG';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'DOC';
    return 'PDF';
  };

  return (
    <div className="bg-[#f7f4ed] min-h-screen font-body text-foreground pb-0 flex flex-col justify-between">
      
      {/* Hero Header Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        
        {/* Floating Animated Decorative Assets */}
        <motion.img
          src="/star-blue.png"
          alt="Estrella fugaz"
          className="absolute top-1 left-2 sm:left-8 w-32 sm:w-44 md:w-52 h-auto pointer-events-none z-10 opacity-90 drop-shadow-sm"
          animate={{ y: [0, -10, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.img
          src="/planeta.png"
          alt="Planeta flotante"
          className="absolute -bottom-4 right-4 sm:right-10 w-24 sm:w-32 h-auto pointer-events-none z-20 opacity-90 drop-shadow-md"
          animate={{ y: [0, 10, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-4">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-forest leading-tight">
                {locale === 'en' ? (
                  <>
                    Document Portal & <br />
                    <span className="text-[#a38060]">Family Information</span>
                  </>
                ) : (
                  <>
                    Portal de <br />
                    Documentos e <br />
                    <span className="text-[#a38060]">Información para Familias</span>
                  </>
                )}
              </h1>

              <div className="space-y-1 text-sm sm:text-base text-forest/80 max-w-xl leading-relaxed">
                <p className="font-bold text-forest">
                  {locale === 'en' ? 'Welcome Ceiba community families.' : 'Bienvenidas familias de la comunidad Ceiba.'}
                </p>
                <p className="text-[#8c6b4e] font-medium text-xs sm:text-sm">
                  {locale === 'en'
                    ? 'In this space you will find all official forms, school policies, and monthly updates ready for your review and download.'
                    : 'En este espacio encontrarán todos los formatos oficiales, reglamentos institucionales y actualizaciones mensuales listos para su consulta y descarga.'}
                </p>
              </div>
            </div>

            {/* Right Hero Image Frame */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white max-w-md w-full aspect-[4/3] bg-white">
                <img
                  src={docsHeroImage}
                  alt="Niños trabajando en aula Montessori Ceiba"
                  className="w-full h-full object-cover rounded-[2.25rem] transform hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Section: CEIBA DOCS Tables */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-16 sm:mb-24 md:mb-32">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest tracking-wider uppercase">
            CEIBA DOCS
          </h2>
          <div className="w-16 h-1 bg-terracotta mx-auto mt-2 rounded-full" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {locale === 'en' ? 'Loading documents...' : 'Cargando documentos...'}
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-16 bg-white/70 rounded-3xl border border-forest/10 shadow-xs text-muted-foreground text-sm">
            {locale === 'en' ? 'No document categories available at this moment.' : 'No hay categorías de documentos disponibles por el momento.'}
          </div>
        ) : (
          <div className="space-y-12">
            {folders.map((folder) => {
              const folderDocs = documents.filter(d => d.folder_id === folder.id);
              const folderTitleStr = (locale === 'en' && folder.title_en ? folder.title_en : folder.title).toUpperCase();
              const folderDescStr = locale === 'en' && folder.description_en ? folder.description_en : folder.description;

              return (
                <div key={folder.id} className="space-y-3">
                  
                  {/* Category Folder Title */}
                  <div>
                    <h3 className="font-display font-bold text-[#8c6b4e] text-xs sm:text-sm tracking-wider uppercase">
                      {folderTitleStr}
                    </h3>
                    {folderDescStr && (
                      <p className="text-[11px] text-muted-foreground italic mt-0.5 font-medium">
                        *{folderDescStr}
                      </p>
                    )}
                  </div>

                  {/* Documents Table */}
                  {folderDocs.length === 0 ? (
                    <div className="p-4 bg-white/50 rounded-2xl text-xs text-muted-foreground italic border border-forest/10">
                      {locale === 'en' ? 'No files in this section.' : 'No hay archivos en esta sección.'}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-forest/10 overflow-hidden">
                      
                      {/* Table Header Bar */}
                      <div className="bg-[#967756] text-white px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-wider grid grid-cols-12 items-center gap-2">
                        <div className="col-span-7 sm:col-span-8">
                          {locale === 'en' ? 'Document Name' : 'Nombre del Documento'}
                        </div>
                        <div className="col-span-2 sm:col-span-2 text-center">
                          {locale === 'en' ? 'Format' : 'Formato'}
                        </div>
                        <div className="col-span-3 sm:col-span-2 text-right pr-2">
                          {locale === 'en' ? 'Action' : 'Acción'}
                        </div>
                      </div>

                      {/* Table Rows */}
                      <div className="divide-y divide-forest/5">
                        {folderDocs.map((doc, idx) => {
                          const isUnlocked = doc.access_type === 'public' || unlockedDocIds.includes(doc.id);
                          const isExternal = doc.file_data.startsWith('http://') || doc.file_data.startsWith('https://') || doc.file_type === 'external';
                          const formatLabel = getFormatBadge(doc);

                          const docTitleStr = locale === 'en' && doc.title_en ? doc.title_en : doc.title;
                          const docDescStr = locale === 'en' && doc.description_en ? doc.description_en : doc.description;

                          return (
                            <div
                              key={doc.id}
                              className={`px-4 sm:px-6 py-3.5 grid grid-cols-12 items-center gap-2 transition-colors ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfaf7]'
                              }`}
                            >
                              {/* Document Name & Description */}
                              <div className="col-span-7 sm:col-span-8 pr-2">
                                <span className="font-display font-bold text-forest text-xs sm:text-sm block uppercase leading-snug">
                                  {docTitleStr}
                                </span>
                                {docDescStr && (
                                  <span className="text-[11px] text-muted-foreground block mt-0.5 line-clamp-1">
                                    {docDescStr}
                                  </span>
                                )}
                              </div>

                              {/* Format */}
                              <div className="col-span-2 sm:col-span-2 text-center">
                                <span className="text-xs font-mono font-semibold text-muted-foreground uppercase">
                                  {formatLabel}
                                </span>
                              </div>

                              {/* Action Button */}
                              <div className="col-span-3 sm:col-span-2 flex justify-end">
                                <button
                                  onClick={() => handleDownloadAttempt(doc)}
                                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                                    isUnlocked
                                      ? 'bg-forest hover:bg-forest/90 text-white'
                                      : 'bg-terracotta hover:bg-terracotta/90 text-white'
                                  }`}
                                >
                                  {isUnlocked ? (
                                    isExternal ? (
                                      <span>{locale === 'en' ? 'Open Link' : 'Ver Archivo'}</span>
                                    ) : (
                                      <span>{locale === 'en' ? 'Download' : 'Descargar'}</span>
                                    )
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Lock className="w-3 h-3" />
                                      {locale === 'en' ? 'Access' : 'Acceso'}
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* Full Width Footer Banner with Horizontal Repeat & Flush Bottom */}
      <div 
        className="w-full h-20 sm:h-28 md:h-32 bg-repeat-x bg-bottom mt-auto pointer-events-none -mb-1" 
        style={{ 
          backgroundImage: "url('/footer-ceiba.png')", 
          backgroundSize: "auto 100%" 
        }} 
      />

      {/* ACCESS VERIFICATION RESPONSIVE MODAL / MOBILE DRAWER */}
      <ResponsiveModal
        isOpen={!!activeAccessDoc}
        onClose={() => setActiveAccessDoc(null)}
        maxWidthClass="max-w-md"
        showCloseButton={true}
      >
        {activeAccessDoc && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-terracotta/10 text-terracotta rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-forest text-lg">
                {locale === 'en' ? 'Protected Document Access' : 'Protección de Acceso a Documento'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === 'en' && activeAccessDoc.title_en ? activeAccessDoc.title_en : activeAccessDoc.title}
              </p>
            </div>

            <form onSubmit={handleVerifyAccess} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5">
                  {locale === 'en' ? 'Global Authorization Code' : 'Código de Autorización Global'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. CEIBA2026"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-forest/20 text-sm font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-forest bg-white"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
                  {locale === 'en'
                    ? 'Enter the official authorization code provided by the school administration to download this document.'
                    : 'Introduce el código de autorización otorgado por la administración escolar para descargar este documento.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-forest/10">
                <button
                  type="button"
                  onClick={() => setActiveAccessDoc(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-forest"
                >
                  {locale === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span>
                    {verifying 
                      ? (locale === 'en' ? 'Verifying...' : 'Verificando...') 
                      : (locale === 'en' ? 'Unlock Access' : 'Desbloquear Acceso')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </ResponsiveModal>

    </div>
  );
};

export default PublicDocumentsSection;
