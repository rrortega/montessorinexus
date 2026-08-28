import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Calendar,
  Clock,
  Mail,
  Users,
  Building2,
  Layers,
  Sparkles,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Type,
  Heading,
  Quote,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
  Smartphone,
  Monitor,
  Search,
  Check,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  GraduationCap,
  Paperclip,
  UploadCloud,
  FileText,
  Download,
  File as FileIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { RichTextEditor } from './RichTextEditor';
import {
  NewsletterItem,
  NewsletterBlockItem,
  NewsletterAttachment,
  NewsletterTargetType,
  NewsletterAudience,
  NewsletterRecipientPreview,
  EnvironmentItem,
  createNewsletter,
  updateNewsletter,
  calculateNewsletterRecipients,
  sendNewsletterTest,
  sendNewsletterNow,
  getEnvironments,
  getSiteSettings
} from '@/lib/sqlite';

interface NewsletterEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  newsletterToEdit?: NewsletterItem | null;
  schoolInfo?: any;
}

const CALLOUT_PRESETS = [
  { id: 'forest', label: 'Verde Ceiba', bg: '#f2f7f4', border: '#1b3b2b', text: '#133824', dot: 'bg-[#1b3b2b]' },
  { id: 'blue', label: 'Azul Informativo', bg: '#eff6ff', border: '#2563eb', text: '#1e40af', dot: 'bg-blue-600' },
  { id: 'amber', label: 'Ámbar Aviso', bg: '#fffbeb', border: '#d97706', text: '#92400e', dot: 'bg-amber-500' },
  { id: 'purple', label: 'Púrpura Especial', bg: '#faf5ff', border: '#7c3aed', text: '#5b21b6', dot: 'bg-purple-600' },
  { id: 'rose', label: 'Rosa Urgente', bg: '#fff1f2', border: '#e11d48', text: '#9f1239', dot: 'bg-rose-500' },
  { id: 'emerald', label: 'Esmeralda Éxito', bg: '#ecfdf5', border: '#059669', text: '#065f46', dot: 'bg-emerald-500' },
] as const;

const DEFAULT_BLOCKS: NewsletterBlockItem[] = [
  {
    id: 'block_1',
    type: 'heading',
    level: 1,
    content: '¡Bienvenidos al nuevo ciclo escolar!'
  },
  {
    id: 'block_2',
    type: 'text',
    content: 'Estimadas familias de nuestra comunidad,\n\nNos complace compartir con ustedes las actividades, proyectos y fechas clave para las próximas semanas. Nuestro compromiso pedagógico continúa guiando el crecimiento y autonomía de cada uno de nuestros niños.'
  },
  {
    id: 'block_3',
    type: 'callout',
    style: 'forest',
    content: 'Recordatorio: La próxima junta de comunidad y círculos de diálogo se llevará a cabo este viernes a las 18:00 hrs.'
  }
];

export const NewsletterEditorDrawer: React.FC<NewsletterEditorDrawerProps> = ({
  isOpen,
  onClose,
  onSaved,
  newsletterToEdit,
  schoolInfo
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'audience' | 'schedule' | 'preview'>('content');
  const [saving, setSaving] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Environments state
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [loadingEnvironments, setLoadingEnvironments] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [blocks, setBlocks] = useState<NewsletterBlockItem[]>(DEFAULT_BLOCKS);
  const [attachments, setAttachments] = useState<NewsletterAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Audience State
  const [targetType, setTargetType] = useState<NewsletterTargetType>('ALL_SCHOOL');
  const [targetAudience, setTargetAudience] = useState<NewsletterAudience>('PARENTS_AND_STAFF');
  const [targetEnvironmentIds, setTargetEnvironmentIds] = useState<string[]>([]);
  const [specificEmailsText, setSpecificEmailsText] = useState('');

  // Schedule State
  const [sendMode, setSendMode] = useState<'DRAFT' | 'SEND_NOW' | 'SCHEDULED'>('DRAFT');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  // Calculated Recipients Preview State
  const [calculatedCount, setCalculatedCount] = useState<number | null>(null);
  const [calculatedRecipients, setCalculatedRecipients] = useState<NewsletterRecipientPreview[]>([]);
  const [calculatingRecipients, setCalculatingRecipients] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');

  const { activeMembership } = useAuth();
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  // Load environments and site settings
  useEffect(() => {
    if (isOpen) {
      setLoadingEnvironments(true);
      Promise.all([
        getEnvironments().then(envs => setEnvironments(envs || [])).catch(() => { }),
        getSiteSettings().then(s => setSiteSettings(s || {})).catch(() => { })
      ]).finally(() => setLoadingEnvironments(false));
    }
  }, [isOpen]);

  const effectiveLogo = siteSettings.school_logo || schoolInfo?.logoUrl || activeMembership?.school?.logoUrl || '';
  const effectiveSchoolName = siteSettings.school_name || schoolInfo?.name || activeMembership?.school?.name || 'Ceiba Montessori';
  const effectivePrimaryColor = siteSettings.brand_primary_color || schoolInfo?.primaryColor || activeMembership?.school?.primaryColor || '#1b3b2b';
  const effectiveAddress = siteSettings.school_address || schoolInfo?.address || activeMembership?.school?.address || '';

  // Initialize form with existing newsletter or defaults
  useEffect(() => {
    if (!isOpen) return;

    if (newsletterToEdit) {
      setTitle(newsletterToEdit.title || '');
      setSubject(newsletterToEdit.subject || newsletterToEdit.title || '');
      setPreheader(newsletterToEdit.preheader || '');
      setAuthorName(newsletterToEdit.authorName || '');
      setCoverImageUrl(newsletterToEdit.coverImageUrl || '');
      setAttachments(Array.isArray(newsletterToEdit.attachments) ? newsletterToEdit.attachments : []);

      const loadedBlocks = newsletterToEdit.contentJson?.blocks;
      if (Array.isArray(loadedBlocks) && loadedBlocks.length > 0) {
        setBlocks(loadedBlocks);
      } else if (newsletterToEdit.contentHtml) {
        setBlocks([
          {
            id: 'block_html_1',
            type: 'text',
            content: newsletterToEdit.contentHtml
          }
        ]);
      } else {
        setBlocks(DEFAULT_BLOCKS);
      }

      setTargetType(newsletterToEdit.targetType || 'ALL_SCHOOL');
      setTargetAudience(newsletterToEdit.targetAudience || 'PARENTS_AND_STAFF');
      setTargetEnvironmentIds(Array.isArray(newsletterToEdit.targetEnvironmentIds) ? newsletterToEdit.targetEnvironmentIds : []);

      const rawSpecific = newsletterToEdit.specificEmails;
      if (Array.isArray(rawSpecific)) {
        setSpecificEmailsText(
          rawSpecific.map(s => (typeof s === 'string' ? s : `${s.name ? s.name + ' <' : ''}${s.email}${s.name ? '>' : ''}`)).join('\n')
        );
      } else {
        setSpecificEmailsText('');
      }

      if (newsletterToEdit.status === 'SCHEDULED' && newsletterToEdit.scheduledAt) {
        setSendMode('SCHEDULED');
        const d = new Date(newsletterToEdit.scheduledAt);
        setScheduledDate(d.toISOString().split('T')[0]);
        setScheduledTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      } else {
        setSendMode('DRAFT');
        setScheduledDate('');
        setScheduledTime('09:00');
      }
    } else {
      // Defaults for new newsletter
      setTitle('');
      setSubject('');
      setPreheader('');
      setAuthorName(schoolInfo?.name || 'Dirección General');
      setCoverImageUrl('');
      setBlocks(DEFAULT_BLOCKS);
      setAttachments([]);
      setTargetType('ALL_SCHOOL');
      setTargetAudience('PARENTS_AND_STAFF');
      setTargetEnvironmentIds([]);
      setSpecificEmailsText('');
      setSendMode('DRAFT');
      setScheduledDate('');
      setScheduledTime('09:00');
    }
  }, [isOpen, newsletterToEdit, schoolInfo]);

  // Parse specific emails
  const parsedSpecificEmails = useMemo(() => {
    const raw = (specificEmailsText || '').trim();
    if (!raw) return [];
    return raw
      .split('\n')
      .map(line => (line || '').trim())
      .filter(line => line.length > 0)
      .map(line => {
        const match = line.match(/^(.*?)\s*<(.+@.+)>$/);
        if (match) {
          return { name: (match[1] || '').trim(), email: (match[2] || '').trim().toLowerCase() };
        }
        return { name: line, email: line.toLowerCase() };
      })
      .filter(item => item.email && item.email.includes('@'));
  }, [specificEmailsText]);

  // Recalculate recipients when audience settings change
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        setCalculatingRecipients(true);
        const res = await calculateNewsletterRecipients({
          targetType,
          targetAudience,
          targetEnvironmentIds,
          specificEmails: parsedSpecificEmails
        });
        setCalculatedCount(res.count);
        setCalculatedRecipients(res.recipients || []);
      } catch (err) {
        console.error('Error calculating recipients:', err);
      } finally {
        setCalculatingRecipients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, targetType, targetAudience, targetEnvironmentIds, parsedSpecificEmails]);

  // File Upload handler for attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFiles(true);

    try {
      const newAttachments: NewsletterAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`El archivo "${file.name}" supera el límite de 15MB`);
          continue;
        }

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          fileData: base64Data,
          createdAt: new Date().toISOString()
        });
      }

      setAttachments(prev => [...prev, ...newAttachments]);
      toast.success(`${newAttachments.length} archivo(s) adjuntado(s)`);
    } catch (err) {
      console.error('Error uploading files:', err);
      toast.error('Error al procesar archivos');
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Convert blocks to HTML string
  const generatedHtml = useMemo(() => {
    return blocks
      .map(block => {
        switch (block.type) {
          case 'heading': {
            const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
            return `<${Tag} style="color: #1b3b2b; font-weight: bold; margin: 20px 0 10px;">${block.content || ''}</${Tag}>`;
          }
          case 'text': {
            const content = block.content || '';
            if (content.trim().startsWith('<')) {
              return `<div style="line-height: 1.7; color: #334155; margin-bottom: 16px;">${content}</div>`;
            }
            const paras = content
              .split('\n\n')
              .map(p => `<p style="margin: 0 0 14px; line-height: 1.7; color: #334155;">${p.replace(/\n/g, '<br>')}</p>`)
              .join('');
            return paras;
          }
          case 'image': {
            if (!block.url) return '';
            return `
              <div style="margin: 20px 0; text-align: center;">
                <img src="${block.url}" alt="${block.alt || ''}" style="max-width: 100%; border-radius: 16px; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />
                ${block.caption ? `<p style="font-size: 12px; color: #64748b; margin-top: 6px; font-style: italic;">${block.caption}</p>` : ''}
              </div>
            `;
          }
          case 'callout': {
            const st = block.style || 'forest';
            let bg = '#f2f7f4';
            let border = '#1b3b2b';
            let textCol = '#133824';

            if (st === 'blue' || st === 'info') {
              bg = '#eff6ff';
              border = '#2563eb';
              textCol = '#1e40af';
            } else if (st === 'amber' || st === 'warning') {
              bg = '#fffbeb';
              border = '#d97706';
              textCol = '#92400e';
            } else if (st === 'purple') {
              bg = '#faf5ff';
              border = '#7c3aed';
              textCol = '#5b21b6';
            } else if (st === 'rose') {
              bg = '#fff1f2';
              border = '#e11d48';
              textCol = '#9f1239';
            } else if (st === 'emerald' || st === 'success') {
              bg = '#ecfdf5';
              border = '#059669';
              textCol = '#065f46';
            }

            return `
              <div style="background-color: ${bg}; border-left: 4px solid ${border}; padding: 14px 18px; margin: 18px 0; border-radius: 0 12px 12px 0; color: ${textCol}; font-size: 14px; line-height: 1.6;">
                ${block.content || ''}
              </div>
            `;
          }
          case 'quote': {
            return `
              <blockquote style="border-left: 4px solid #10b981; padding: 12px 20px; margin: 20px 0; background-color: #f8fafc; border-radius: 0 12px 12px 0; font-style: italic; color: #334155; font-size: 15px;">
                "${block.content || ''}"
                ${block.caption ? `<footer style="font-size: 12px; color: #64748b; margin-top: 6px; font-style: normal; font-weight: bold;">— ${block.caption}</footer>` : ''}
              </blockquote>
            `;
          }
          case 'button': {
            if (!block.buttonText || !block.buttonUrl) return '';
            return `
              <div style="text-align: center; margin: 24px 0;">
                <a href="${block.buttonUrl}" target="_blank" style="background-color: #1b3b2b; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 10px rgba(27,59,43,0.2);">
                  ${block.buttonText}
                </a>
              </div>
            `;
          }
          case 'divider': {
            return `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;" />`;
          }
          default:
            return '';
        }
      })
      .join('\n');
  }, [blocks]);

  // Block Manipulation Helpers
  const addBlock = (type: NewsletterBlockItem['type']) => {
    const newBlock: NewsletterBlockItem = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      content: type === 'heading' ? 'Nuevo Subtítulo' : type === 'callout' ? 'Información importante...' : type === 'quote' ? 'Frase de María Montessori o reflexión...' : '',
      level: 2,
      style: type === 'callout' ? 'forest' : 'primary',
      buttonText: type === 'button' ? 'Ver Detalles' : undefined,
      buttonUrl: type === 'button' ? 'https://' : undefined
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<NewsletterBlockItem>) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    setBlocks(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Toggle environment selection
  const handleToggleEnvironment = (envId: string) => {
    setTargetEnvironmentIds(prev =>
      prev.includes(envId) ? prev.filter(id => id !== envId) : [...prev, envId]
    );
  };

  // Test Email
  const handleSendTest = async () => {
    const cleanTestEmail = (testEmailInput || '').trim();
    if (!cleanTestEmail) {
      toast.error('Ingresa un correo electrónico para recibir la prueba');
      return;
    }
    setTestingSend(true);
    try {
      let id = newsletterToEdit?.id;
      if (!id) {
        // Save first as draft
        const cleanTitle = (title || '').trim() || 'Borrador de Boletín';
        const cleanSubject = (subject || title || '').trim() || 'Boletín Ceiba';
        const cleanPreheader = (preheader || '').trim() || null;
        const cleanCoverImage = (coverImageUrl || '').trim() || null;
        const cleanAuthorName = (authorName || '').trim() || 'Dirección General';

        const draft = await createNewsletter({
          title: cleanTitle,
          subject: cleanSubject,
          preheader: cleanPreheader,
          contentHtml: generatedHtml,
          contentJson: { blocks },
          coverImageUrl: cleanCoverImage,
          authorName: cleanAuthorName,
          attachments,
          targetType,
          targetAudience,
          targetEnvironmentIds,
          specificEmails: parsedSpecificEmails,
          status: 'DRAFT'
        });
        id = draft.id;
      }
      const res = await sendNewsletterTest(id, cleanTestEmail);
      toast.success(res.message || 'Correo de prueba enviado');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar prueba');
    } finally {
      setTestingSend(false);
    }
  };

  // Save / Dispatch
  const handleSave = async () => {
    const cleanTitle = (title || '').trim();
    if (!cleanTitle) {
      toast.error('El título interno del boletín es obligatorio');
      setActiveTab('content');
      return;
    }

    if (sendMode === 'SCHEDULED' && (!scheduledDate || !scheduledTime)) {
      toast.error('Debes seleccionar fecha y hora para programar el envío');
      setActiveTab('schedule');
      return;
    }

    setSaving(true);
    try {
      let scheduledAt: string | null = null;
      if (sendMode === 'SCHEDULED') {
        const [year, month, day] = scheduledDate.split('-').map(Number);
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const scheduledObj = new Date(year, month - 1, day, hours, minutes);
        scheduledAt = scheduledObj.toISOString();
      }

      const cleanSubject = (subject || title || '').trim();
      const cleanPreheader = (preheader || '').trim() || null;
      const cleanCoverImage = (coverImageUrl || '').trim() || null;
      const cleanAuthorName = (authorName || '').trim() || 'Dirección General';

      const payload = {
        title: cleanTitle,
        subject: cleanSubject,
        preheader: cleanPreheader,
        contentHtml: generatedHtml,
        contentJson: { blocks },
        coverImageUrl: cleanCoverImage,
        authorName: cleanAuthorName,
        attachments,
        targetType,
        targetAudience,
        targetEnvironmentIds,
        specificEmails: parsedSpecificEmails,
        status: sendMode === 'SEND_NOW' ? 'SEND_NOW' : sendMode === 'SCHEDULED' ? 'SCHEDULED' : 'DRAFT',
        scheduledAt
      };

      if (newsletterToEdit) {
        await updateNewsletter(newsletterToEdit.id, payload);
        toast.success(
          sendMode === 'SEND_NOW'
            ? '¡Boletín en proceso de envío!'
            : sendMode === 'SCHEDULED'
              ? 'Boletín programado correctamente'
              : 'Boletín actualizado'
        );
      } else {
        await createNewsletter(payload);
        toast.success(
          sendMode === 'SEND_NOW'
            ? '¡Boletín creado y enviándose!'
            : sendMode === 'SCHEDULED'
              ? 'Boletín programado exitosamente'
              : 'Boletín guardado como borrador'
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el boletín');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="!mt-0 fixed inset-0 z-50 flex justify-end bg-forest/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#fcfcfb] h-full shadow-2xl flex flex-col overflow-hidden border-l border-forest/15 animate-in slide-in-from-right duration-300">

        {/* TOP BAR */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-forest via-forest-light to-forest text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold">
                {newsletterToEdit ? 'Editar Boletín / Comunicado' : 'Nuevo Boletín / Comunicado'}
              </h2>
              <p className="text-[11px] text-white/80">
                Diseñador de boletines, segmentación de audiencia y programación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-white border-b border-forest/10 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${activeTab === 'content'
                ? 'border-forest text-forest font-bold'
                : 'border-transparent text-muted-foreground hover:text-forest'
              }`}
          >
            <Type className="w-4 h-4" />
            <span>Contenido & Diseño Visual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${activeTab === 'preview'
                ? 'border-forest text-forest font-bold'
                : 'border-transparent text-muted-foreground hover:text-forest'
              }`}
          >
            <Eye className="w-4 h-4" />
            <span>Vista Previa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audience')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${activeTab === 'audience'
                ? 'border-forest text-forest font-bold'
                : 'border-transparent text-muted-foreground hover:text-forest'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Audiencia & Destinatarios</span>
            {calculatedCount !== null && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-forest/10 text-forest font-black">
                {calculatedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${activeTab === 'schedule'
                ? 'border-forest text-forest font-bold'
                : 'border-transparent text-muted-foreground hover:text-forest'
              }`}
          >
            <Clock className="w-4 h-4" />
            <span>Programación & Envío</span>
          </button>
        </div>

        {/* BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: CONTENT & MODULAR BLOCKS */}
          {activeTab === 'content' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
              {/* General Metadata Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-forest/10 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-forest/70 border-b border-forest/10 pb-2">
                  Datos de Cabecera del Boletín
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-forest">
                      Título Interno del Boletín <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ej: Boletín Mensual de Septiembre 2026"
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-forest">
                      Asunto del Correo (Subject)
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder={title || 'Ej: Novedades y Circulares de Septiembre'}
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-forest">
                      Pre-encabezado (Snippet de bandeja)
                    </label>
                    <input
                      type="text"
                      value={preheader}
                      onChange={e => setPreheader(e.target.value)}
                      placeholder="Ej: Conoce las fechas de las próximas actividades y salidas"
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-forest">
                      Firma / Autor del Comunicado
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      placeholder="Ej: Dirección General & Guías Montessori"
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-forest">
                      URL de Imagen de Portada / Banner (Opcional)
                    </label>
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={e => setCoverImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/portada-boletin.jpg"
                      className="w-full p-2.5 rounded-xl border border-forest/20 text-forest text-xs focus:outline-none focus:ring-2 focus:ring-forest font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modular Blocks Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-forest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-forest" />
                    <span>Bloques de Contenido</span>
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    {blocks.length} {blocks.length === 1 ? 'bloque' : 'bloques'}
                  </span>
                </div>

                <div className="space-y-3">
                  {blocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className="bg-white rounded-2xl p-4 border border-forest/15 shadow-2xs space-y-3 transition-all hover:border-forest/30"
                    >
                      {/* Block Controls Header */}
                      <div className="flex items-center justify-between border-b border-forest/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-forest/10 text-forest flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-forest uppercase tracking-wider">
                            {block.type === 'heading' && 'Encabezado / Subtítulo'}
                            {block.type === 'text' && 'Párrafo de Texto'}
                            {block.type === 'image' && 'Imagen con Pie'}
                            {block.type === 'callout' && 'Cuadro Destacado (Callout)'}
                            {block.type === 'quote' && 'Cita / Reflexión'}
                            {block.type === 'button' && 'Botón de Acción (CTA)'}
                            {block.type === 'divider' && 'Línea Divisoria'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveBlock(idx, 'up')}
                            className="p-1 text-muted-foreground hover:text-forest disabled:opacity-30 cursor-pointer"
                            title="Subir"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === blocks.length - 1}
                            onClick={() => moveBlock(idx, 'down')}
                            className="p-1 text-muted-foreground hover:text-forest disabled:opacity-30 cursor-pointer"
                            title="Bajar"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md cursor-pointer ml-1"
                            title="Eliminar bloque"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Block Inputs according to type */}
                      {block.type === 'heading' && (
                        <div className="flex gap-2">
                          <select
                            value={block.level || 2}
                            onChange={e => updateBlock(block.id, { level: Number(e.target.value) as any })}
                            className="p-2 rounded-xl border border-forest/20 text-xs text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                          >
                            <option value={1}>H1 Grande</option>
                            <option value={2}>H2 Mediano</option>
                            <option value={3}>H3 Pequeño</option>
                          </select>
                          <input
                            type="text"
                            value={block.content || ''}
                            onChange={e => updateBlock(block.id, { content: e.target.value })}
                            placeholder="Escribe el subtítulo aquí..."
                            className="flex-1 p-2 rounded-xl border border-forest/20 text-xs font-bold text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                          />
                        </div>
                      )}

                      {block.type === 'text' && (
                        <div className="space-y-1.5">
                          <RichTextEditor
                            value={block.content || ''}
                            onChange={html => updateBlock(block.id, { content: html })}
                            placeholder="Escribe el contenido con formato enriquecido (negritas, listas, enlaces, citas)..."
                            minHeight="220px"
                          />
                          <p className="text-[10px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span>
                              Variables dinámicas: <code className="font-mono text-forest font-bold">{'{{nombre_destinatario}}'}</code> y <code className="font-mono text-forest font-bold">{'{{escuela}}'}</code>.
                            </span>
                            <span className="text-[10px] text-forest/70 font-semibold">Editor visual WYSIWYG</span>
                          </p>
                        </div>
                      )}

                      {block.type === 'image' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-forest">URL de la Imagen</label>
                            <input
                              type="url"
                              value={block.url || ''}
                              onChange={e => updateBlock(block.id, { url: e.target.value })}
                              placeholder="https://ejemplo.com/foto.jpg"
                              className="w-full p-2 rounded-xl border border-forest/20 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-forest">Pie de foto (Opcional)</label>
                            <input
                              type="text"
                              value={block.caption || ''}
                              onChange={e => updateBlock(block.id, { caption: e.target.value })}
                              placeholder="Alumnos en el taller de botánica"
                              className="w-full p-2 rounded-xl border border-forest/20 text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'callout' && (
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <label className="text-[11px] font-bold text-forest mr-1">Estilo de color:</label>
                            {CALLOUT_PRESETS.map(preset => {
                              const isSelected =
                                (block.style || 'forest') === preset.id ||
                                (preset.id === 'forest' && (block.style === 'primary' || !block.style)) ||
                                (preset.id === 'emerald' && block.style === 'success') ||
                                (preset.id === 'amber' && block.style === 'warning') ||
                                (preset.id === 'blue' && block.style === 'info');

                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => updateBlock(block.id, { style: preset.id as any })}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                                    isSelected
                                      ? 'border-forest ring-2 ring-forest/20 bg-white font-bold text-forest'
                                      : 'border-forest/15 bg-stone-50/70 hover:bg-white text-slate-700'
                                  }`}
                                >
                                  <span className={`w-2.5 h-2.5 rounded-full ${preset.dot} shrink-0`} />
                                  <span>{preset.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <textarea
                            rows={3}
                            value={block.content || ''}
                            onChange={e => updateBlock(block.id, { content: e.target.value })}
                            placeholder="Texto del cuadro destacado..."
                            className="w-full p-3 rounded-xl border border-forest/20 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
                          />
                        </div>
                      )}

                      {block.type === 'quote' && (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={block.content || ''}
                            onChange={e => updateBlock(block.id, { content: e.target.value })}
                            placeholder="Cita textual o reflexión..."
                            className="w-full p-2.5 rounded-xl border border-forest/20 text-xs italic text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                          />
                          <input
                            type="text"
                            value={block.caption || ''}
                            onChange={e => updateBlock(block.id, { caption: e.target.value })}
                            placeholder="Autor de la cita (ej. María Montessori)"
                            className="w-full p-2.5 rounded-xl border border-forest/20 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                          />
                        </div>
                      )}

                      {block.type === 'button' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-forest">Texto del Botón</label>
                            <input
                              type="text"
                              value={block.buttonText || ''}
                              onChange={e => updateBlock(block.id, { buttonText: e.target.value })}
                              placeholder="Ej. Confirmar Asistencia"
                              className="w-full p-2 rounded-xl border border-forest/20 text-xs font-bold text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-forest">Enlace de Destino (URL)</label>
                            <input
                              type="url"
                              value={block.buttonUrl || ''}
                              onChange={e => updateBlock(block.id, { buttonUrl: e.target.value })}
                              placeholder="https://..."
                              className="w-full p-2 rounded-xl border border-forest/20 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'divider' && (
                        <div className="py-2 text-center text-xs text-muted-foreground border-t border-dashed border-forest/20">
                          Línea de separación horizontal
                        </div>
                      )}

                    </div>
                  ))}

                  {/* Add Block Toolbar */}
                  <div className="pt-2 border-t border-forest/10 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-forest">Agregar Bloque:</span>

                    <button
                      type="button"
                      onClick={() => addBlock('heading')}
                      className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    >
                      <Heading className="w-3.5 h-3.5" />
                      <span>Subtítulo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('text')}
                      className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Párrafo WYSIWYG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('callout')}
                      className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Destacado (Callout)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('button')}
                      className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Botón CTA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('image')}
                      className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Imagen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('quote')}
                      className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    >
                      <Quote className="w-3.5 h-3.5" />
                      <span>Cita</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('divider')}
                      className="px-3 py-1.5 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest text-xs font-bold flex items-center gap-1.5 border border-forest/15 transition-all cursor-pointer"
                    >
                      <span>Línea Divisoria</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Attachments Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-forest/10 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest/10 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display text-sm font-bold text-forest flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-forest" />
                      Archivos Adjuntos & Descargables ({attachments.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Adjunta circulares en PDF, menús escolares, calendarios, fichas o documentos complementarios.
                    </p>
                  </div>

                  <label className="px-4 py-2 bg-forest/10 hover:bg-forest hover:text-white text-forest rounded-2xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 border border-forest/20 shadow-2xs">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingFiles ? 'Cargando archivos...' : 'Adjuntar Archivo'}</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                    />
                  </label>
                </div>

                {attachments.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-forest/15 rounded-2xl text-center space-y-2 bg-stone-50/50">
                    <Paperclip className="w-7 h-7 text-forest/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      No hay archivos adjuntos en este boletín. Puedes adjuntar circulares en PDF, calendarios o fichas informativas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map(att => (
                      <div
                        key={att.id}
                        className="p-3.5 bg-stone-50/80 rounded-2xl border border-forest/15 flex items-center justify-between gap-3 group shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 font-bold">
                            <FileIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-forest block truncate" title={att.fileName}>
                              {att.fileName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round((att.fileSize || 0) / 1024)} KB
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Eliminar archivo adjunto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in">
              {/* Preview Device Controls */}
              <div className="flex items-center justify-between bg-white p-3 px-5 rounded-2xl border border-forest/10 shadow-2xs">
                <span className="text-xs font-bold text-forest">Modo de Visualización:</span>
                <div className="flex items-center gap-2 bg-forest/5 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${previewDevice === 'desktop' ? 'bg-white text-forest shadow-xs' : 'text-muted-foreground'
                      }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Computadora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${previewDevice === 'mobile' ? 'bg-white text-forest shadow-xs' : 'text-muted-foreground'
                      }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Celular</span>
                  </button>
                </div>
              </div>

              {/* Email Envelope Container Mockup */}
              <div className="flex justify-center p-2 sm:p-6 bg-stone-100/70 rounded-3xl border border-stone-200">
                <div
                  className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-300 ${previewDevice === 'mobile' ? 'w-full max-w-sm' : 'w-full max-w-xl'
                    }`}
                >
                  {/* Email Header Mockup */}
                  <div
                    className="p-6 text-white text-center"
                    style={{ backgroundColor: effectivePrimaryColor }}
                  >
                    {effectiveLogo ? (
                      <div className="mb-3 text-center">
                        <img
                          src={effectiveLogo}
                          alt={effectiveSchoolName}
                          className="max-h-14 max-w-[200px] mx-auto rounded-xl bg-white p-1.5 shadow-sm object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-display font-bold text-xl mx-auto mb-2 border border-white/30">
                        {effectiveSchoolName.charAt(0)}
                      </div>
                    )}
                    <h2 className="font-display text-lg font-bold text-white tracking-wide">
                      {effectiveSchoolName}
                    </h2>
                    <span className="text-[10px] uppercase tracking-widest text-white/90 font-bold block mt-0.5">
                      Boletín Informativo & Comunicado Oficial
                    </span>
                  </div>

                  {/* Cover Image */}
                  {coverImageUrl && (
                    <img
                      src={coverImageUrl}
                      alt="Cover"
                      className="w-full max-h-56 object-cover block"
                    />
                  )}

                  {/* Body Content */}
                  <div className="p-6 sm:p-8 space-y-4">
                    {preheader && (
                      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                        {preheader}
                      </div>
                    )}

                    <h1 className="font-display text-xl font-bold text-slate-900 leading-tight">
                      {title || 'Título del Boletín'}
                    </h1>

                    <div
                      className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: generatedHtml }}
                    />

                    {attachments.length > 0 && (
                      <div className="pt-4 mt-4 border-t border-slate-200 space-y-2.5">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-forest" />
                          Archivos Adjuntos ({attachments.length})
                        </div>
                        <div className="space-y-1.5">
                          {attachments.map(att => (
                            <div
                              key={att.id}
                              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-800"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileIcon className="w-3.5 h-3.5 text-forest shrink-0" />
                                <span className="font-semibold truncate">{att.fileName}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                                {Math.round((att.fileSize || 0) / 1024)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {authorName && (
                      <div className="pt-4 mt-6 border-t border-slate-100 text-xs text-slate-500">
                        <strong>Publicado por:</strong> {authorName}
                      </div>
                    )}
                  </div>

                  {/* Email Footer */}
                  <div className="p-5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700 m-0">{effectiveSchoolName}</p>
                    {effectiveAddress && <p className="m-0">{effectiveAddress}</p>}
                    <p className="m-0 text-[10px] text-slate-400 pt-1">
                      Este es un comunicado oficial emitido por la administración escolar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIENCE & RECIPIENTS */}
          {activeTab === 'audience' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">

              {/* Target Type Cards */}
              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold text-forest">
                  ¿A quién va dirigido este boletín?
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1: Toda la Escuela */}
                  <div
                    onClick={() => setTargetType('ALL_SCHOOL')}
                    className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${targetType === 'ALL_SCHOOL'
                        ? 'border-forest bg-forest/5 shadow-sm'
                        : 'border-forest/10 bg-white hover:border-forest/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5 text-forest" />
                      </div>
                      <input
                        type="radio"
                        name="targetType"
                        checked={targetType === 'ALL_SCHOOL'}
                        onChange={() => setTargetType('ALL_SCHOOL')}
                        className="accent-forest w-4 h-4"
                      />
                    </div>
                    <h4 className="font-display font-bold text-forest text-sm">Toda la Escuela</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Llega a todas las familias con matrícula activa y/o a todo el equipo docente del colegio.
                    </p>
                  </div>

                  {/* Card 2: Por Salón / Ambiente */}
                  <div
                    onClick={() => setTargetType('ENVIRONMENTS')}
                    className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${targetType === 'ENVIRONMENTS'
                        ? 'border-forest bg-forest/5 shadow-sm'
                        : 'border-forest/10 bg-white hover:border-forest/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                        <Layers className="w-5 h-5 text-forest" />
                      </div>
                      <input
                        type="radio"
                        name="targetType"
                        checked={targetType === 'ENVIRONMENTS'}
                        onChange={() => setTargetType('ENVIRONMENTS')}
                        className="accent-forest w-4 h-4"
                      />
                    </div>
                    <h4 className="font-display font-bold text-forest text-sm">Por Salón / Ambiente</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Selecciona uno o varios salones (Comunidad Infantil, Casa de Niños, Taller) para comunicar temas específicos de aula.
                    </p>
                  </div>

                  {/* Card 3: Solo Staff */}
                  <div
                    onClick={() => setTargetType('STAFF_ONLY')}
                    className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${targetType === 'STAFF_ONLY'
                        ? 'border-forest bg-forest/5 shadow-sm'
                        : 'border-forest/10 bg-white hover:border-forest/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                        <GraduationCap className="w-5 h-5 text-forest" />
                      </div>
                      <input
                        type="radio"
                        name="targetType"
                        checked={targetType === 'STAFF_ONLY'}
                        onChange={() => setTargetType('STAFF_ONLY')}
                        className="accent-forest w-4 h-4"
                      />
                    </div>
                    <h4 className="font-display font-bold text-forest text-sm">Solo Staff & Guías</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Comunicados internos exclusivamente para maestros, guías, asistentes y directivos.
                    </p>
                  </div>

                  {/* Card 4: Lista Específica */}
                  <div
                    onClick={() => setTargetType('SPECIFIC_CONTACTS')}
                    className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${targetType === 'SPECIFIC_CONTACTS'
                        ? 'border-forest bg-forest/5 shadow-sm'
                        : 'border-forest/10 bg-white hover:border-forest/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                        <Mail className="w-5 h-5 text-forest" />
                      </div>
                      <input
                        type="radio"
                        name="targetType"
                        checked={targetType === 'SPECIFIC_CONTACTS'}
                        onChange={() => setTargetType('SPECIFIC_CONTACTS')}
                        className="accent-forest w-4 h-4"
                      />
                    </div>
                    <h4 className="font-display font-bold text-forest text-sm">Lista de Correos Personalizada</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pega o ingresa una lista personalizada de correos para envíos a comité de padres, proveedores o grupos especiales.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-Filters: Target Audience (Parents vs Staff) */}
              {(targetType === 'ALL_SCHOOL' || targetType === 'ENVIRONMENTS') && (
                <div className="bg-white rounded-3xl p-5 border border-forest/10 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-forest">Filtrar Destinatarios en la Selección:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${targetAudience === 'PARENTS_AND_STAFF'
                        ? 'border-forest bg-forest/5 font-bold text-forest'
                        : 'border-forest/10 bg-white text-muted-foreground'
                      }`}>
                      <span className="text-xs">Padres y Personal (Todos)</span>
                      <input
                        type="radio"
                        name="targetAudience"
                        checked={targetAudience === 'PARENTS_AND_STAFF'}
                        onChange={() => setTargetAudience('PARENTS_AND_STAFF')}
                        className="accent-forest"
                      />
                    </label>

                    <label className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${targetAudience === 'PARENTS'
                        ? 'border-forest bg-forest/5 font-bold text-forest'
                        : 'border-forest/10 bg-white text-muted-foreground'
                      }`}>
                      <span className="text-xs">Solo Padres / Familias</span>
                      <input
                        type="radio"
                        name="targetAudience"
                        checked={targetAudience === 'PARENTS'}
                        onChange={() => setTargetAudience('PARENTS')}
                        className="accent-forest"
                      />
                    </label>

                    <label className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${targetAudience === 'STAFF'
                        ? 'border-forest bg-forest/5 font-bold text-forest'
                        : 'border-forest/10 bg-white text-muted-foreground'
                      }`}>
                      <span className="text-xs">Solo Guías y Staff</span>
                      <input
                        type="radio"
                        name="targetAudience"
                        checked={targetAudience === 'STAFF'}
                        onChange={() => setTargetAudience('STAFF')}
                        className="accent-forest"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Sub-Filters: Environment Multi-Selector */}
              {(targetType === 'ENVIRONMENTS' || targetType === 'STAFF_ONLY') && (
                <div className="bg-white rounded-3xl p-5 border border-forest/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-forest">
                      Selecciona los Salones / Ambientes ({targetEnvironmentIds.length} seleccionados):
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        if (targetEnvironmentIds.length === environments.length) {
                          setTargetEnvironmentIds([]);
                        } else {
                          setTargetEnvironmentIds(environments.map(e => e.id));
                        }
                      }}
                      className="text-xs font-bold text-forest hover:underline cursor-pointer"
                    >
                      {targetEnvironmentIds.length === environments.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {environments.map(env => {
                      const isSelected = targetEnvironmentIds.includes(env.id);
                      return (
                        <label
                          key={env.id}
                          className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${isSelected
                              ? 'border-forest bg-forest/5 font-bold text-forest'
                              : 'border-forest/10 bg-white text-muted-foreground'
                            }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs block">{env.name}</span>
                            <span className="text-[10px] text-muted-foreground block">{env.level || 'Ambiente'}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleEnvironment(env.id)}
                            className="accent-forest w-4 h-4 rounded"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-Filters: Specific Emails list */}
              {targetType === 'SPECIFIC_CONTACTS' && (
                <div className="bg-white rounded-3xl p-5 border border-forest/10 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-forest">
                    Ingresa los correos electrónicos (uno por línea):
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Formato: <code className="font-mono text-forest">correo@ejemplo.com</code> o <code className="font-mono text-forest">Juan Pérez &lt;juan@ejemplo.com&gt;</code>
                  </p>
                  <textarea
                    rows={6}
                    value={specificEmailsText}
                    onChange={e => setSpecificEmailsText(e.target.value)}
                    placeholder="padre1@ejemplo.com&#10;María López <maria@ejemplo.com>&#10;comite@ceibamontessori.edu.mx"
                    className="w-full p-3 rounded-xl border border-forest/20 text-xs font-mono text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              )}

              {/* Live Calculated Recipients Card */}
              <div className="bg-gradient-to-br from-forest/5 to-forest/10 rounded-3xl p-5 border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-forest" />
                    <span className="font-display font-bold text-forest text-sm">
                      {calculatingRecipients ? (
                        'Calculando destinatarios...'
                      ) : (
                        `${calculatedCount ?? 0} destinatarios calculados`
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Los correos duplicados son filtrados automáticamente para garantizar un solo envío por tutor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRecipientsModal(true)}
                  disabled={!calculatedRecipients.length}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-forest/10 border border-forest/20 text-forest text-xs font-bold shadow-2xs flex items-center justify-center gap-2 shrink-0 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Ver lista detallada ({calculatedRecipients.length})</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: SCHEDULE & DISPATCH */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 border border-forest/10 shadow-xs space-y-4">
                <h3 className="font-display text-sm font-bold text-forest border-b border-forest/10 pb-3">
                  Modalidad de Envío
                </h3>

                <div className="space-y-3">
                  {/* Option 1: Draft */}
                  <label className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${sendMode === 'DRAFT'
                      ? 'border-forest bg-forest/5 shadow-2xs'
                      : 'border-forest/10 bg-white hover:border-forest/20'
                    }`}>
                    <input
                      type="radio"
                      name="sendMode"
                      checked={sendMode === 'DRAFT'}
                      onChange={() => setSendMode('DRAFT')}
                      className="accent-forest mt-1"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-forest block">Guardar como Borrador</span>
                      <span className="text-xs text-muted-foreground block">
                        Guarda el diseño y la segmentación sin enviar correos. Podrás retomarlo o editarlo cuando quieras.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Send Now */}
                  <label className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${sendMode === 'SEND_NOW'
                      ? 'border-forest bg-forest/5 shadow-2xs'
                      : 'border-forest/10 bg-white hover:border-forest/20'
                    }`}>
                    <input
                      type="radio"
                      name="sendMode"
                      checked={sendMode === 'SEND_NOW'}
                      onChange={() => setSendMode('SEND_NOW')}
                      className="accent-forest mt-1"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-forest block">Enviar Inmediatamente</span>
                      <span className="text-xs text-muted-foreground block">
                        El servidor procesará el envío a todos los destinatarios calculados vía SMTP tan pronto como presiones "Guardar y Despachar".
                      </span>
                    </div>
                  </label>

                  {/* Option 3: Schedule */}
                  <label className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${sendMode === 'SCHEDULED'
                      ? 'border-forest bg-forest/5 shadow-2xs'
                      : 'border-forest/10 bg-white hover:border-forest/20'
                    }`}>
                    <input
                      type="radio"
                      name="sendMode"
                      checked={sendMode === 'SCHEDULED'}
                      onChange={() => setSendMode('SCHEDULED')}
                      className="accent-forest mt-1"
                    />
                    <div className="space-y-2 flex-1">
                      <div>
                        <span className="text-xs font-bold text-forest block">Programar para una Fecha y Hora</span>
                        <span className="text-xs text-muted-foreground block">
                          El sistema despachará automáticamente el boletín en la fecha y hora seleccionada.
                        </span>
                      </div>

                      {sendMode === 'SCHEDULED' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-forest">Fecha de Envío</label>
                            <input
                              type="date"
                              value={scheduledDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={e => setScheduledDate(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-forest">Hora de Envío</label>
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={e => setScheduledTime(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-forest/20 text-xs font-semibold text-forest bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Test Send Card */}
              <div className="bg-white rounded-3xl p-6 border border-forest/10 shadow-xs space-y-3">
                <h3 className="font-display text-sm font-bold text-forest flex items-center gap-2 border-b border-forest/10 pb-3">
                  <Mail className="w-4 h-4 text-forest" />
                  <span>Enviar Correo de Prueba a mi Bandeja</span>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Verifica cómo se visualiza el boletín en una bandeja de entrada real antes del despacho masivo.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <input
                    type="email"
                    value={testEmailInput}
                    onChange={e => setTestEmailInput(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full sm:flex-1 p-2.5 rounded-xl border border-forest/20 text-xs font-mono text-forest focus:outline-none focus:ring-2 focus:ring-forest shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={testingSend || !testEmailInput.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testingSend ? 'Enviando prueba...' : 'Enviar Prueba'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 sm:p-5 bg-white border-t border-forest/10 flex items-center justify-between shrink-0 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-forest transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-forest/20 hover:scale-102 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {saving
                  ? 'Procesando...'
                  : sendMode === 'SEND_NOW'
                    ? 'Guardar y Despachar Ahora'
                    : sendMode === 'SCHEDULED'
                      ? 'Guardar y Programar Envío'
                      : 'Guardar Borrador'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* DETAILED RECIPIENTS MODAL */}
      {showRecipientsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-forest/15 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-forest text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5" />
                <h3 className="font-display font-bold text-sm sm:text-base">
                  Destinatarios Calculados ({calculatedRecipients.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecipientsModal(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-forest/10 bg-forest/5">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={e => setRecipientSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo o salón..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-forest/20 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-forest/10">
              {calculatedRecipients
                .filter(r => {
                  if (!recipientSearch) return true;
                  const q = recipientSearch.toLowerCase();
                  return (
                    r.name.toLowerCase().includes(q) ||
                    r.email.toLowerCase().includes(q) ||
                    (r.environmentName && r.environmentName.toLowerCase().includes(q)) ||
                    (r.studentName && r.studentName.toLowerCase().includes(q))
                  );
                })
                .map((r, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-forest block">{r.name}</span>
                      <span className="text-muted-foreground font-mono text-[11px] block">{r.email}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-md bg-forest/10 text-forest text-[10px] font-bold block">
                        {r.role === 'TUTOR' ? 'Tutor / Familiar' : r.role === 'STAFF' ? 'Equipo / Guía' : 'Contacto'}
                      </span>
                      {r.environmentName && (
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {r.environmentName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 bg-white border-t border-forest/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRecipientsModal(false)}
                className="px-5 py-2 bg-forest text-white rounded-xl text-xs font-bold cursor-pointer"
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
