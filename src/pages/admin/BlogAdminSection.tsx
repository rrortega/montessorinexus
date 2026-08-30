import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings, getButtonRadiusClass } from '@/context/SettingsContext';
import {
  BookOpen, Plus, Search, Filter, Sparkles, Globe, Eye, Trash2, Edit3,
  Calendar, Clock, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight,
  Share2, Image as ImageIcon, Tag, Folder, Languages, Check, RefreshCw,
  ChevronRight, ExternalLink, X, Wand2, Bot, Layers, ChevronDown,
  MessageSquare, Send, Lightbulb, ArrowLeft, FileText, Sparkle, Paintbrush, Loader2
} from 'lucide-react';
import { MarkdownWysiwygEditor } from './MarkdownWysiwygEditor';
import { toast } from 'sonner';
import { uploadPhysicalFile } from '@/lib/api';
import { ALL_SUPPORTED_LANGUAGES, getLanguageByCode, SupportedLanguage } from '@/pages/admin/web-builder/languages';
import { useConfirm } from '@/context/ConfirmDialogContext';

export interface BlogChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  timestamp: string;
  generatedArticle?: {
    suggestedTitle: string;
    slug: string;
    suggestedExcerpt: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    suggestedTags: string[];
  };
}

export interface BlogPostTranslationData {
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
}

export interface BlogItem {
  id: string;
  schoolId: string | null;
  coverImage?: string;
  coverImageAlt?: string;
  customAuthorName?: string;
  customAuthorAvatar?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  readingTimeMinutes: number;
  viewsCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    email?: string;
  };
  translations: BlogPostTranslationData[];
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
}

interface BlogAdminSectionProps {
  isPlatformMode?: boolean;
}

export const BlogAdminSection: React.FC<BlogAdminSectionProps> = ({ isPlatformMode }) => {
  const { user, activeMembership } = useAuth();
  const { settings, buttonRadius, schoolName } = useSiteSettings();
  const confirm = useConfirm();
  const btnRadiusClass = getButtonRadiusClass(buttonRadius);

  const superAdminEmail = (import.meta.env.VITE_SUPERADMIN_EMAIL || 'admin@montessorinexus.com').trim().toLowerCase();
  const isGlobalSuperAdmin = user?.email?.toLowerCase() === superAdminEmail;
  const isGhostMode = typeof window !== 'undefined' && localStorage.getItem('ceiba_ghost_mode_active') === 'true';

  const isPlatformBlog = isPlatformMode !== undefined ? isPlatformMode : (isGlobalSuperAdmin && !isGhostMode);
  const currentSchoolId = isPlatformBlog ? null : activeMembership?.schoolId;

  // Available languages according to context (Platform gets all 7 languages, School gets configured languages)
  const availableLanguages: SupportedLanguage[] = useMemo(() => {
    if (isPlatformBlog) {
      return ALL_SUPPORTED_LANGUAGES;
    }
    const schoolLangsRaw = (settings?.header_enabled_langs || 'es,en')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    const list = schoolLangsRaw.map(code => getLanguageByCode(code));
    return list.length > 0 ? list : [getLanguageByCode('es'), getLanguageByCode('en')];
  }, [isPlatformBlog, settings?.header_enabled_langs]);

  // State
  const [posts, setPosts] = useState<BlogItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; postCount?: number }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; slug: string; postCount?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Entitlement info
  const [entitlement, setEntitlement] = useState<{
    allowed: boolean;
    inTrial: boolean;
    daysLeft: number;
    isSubscribed?: boolean;
    reason?: string;
  } | null>(null);

  // Drawer & View State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'form' | 'ai-chat'>('form');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [activeLocaleTab, setActiveLocaleTab] = useState<string>('es');
  const [addLangDropdownOpen, setAddLangDropdownOpen] = useState(false);
  const [translateDropdownOpen, setTranslateDropdownOpen] = useState(false);

  // AI Chat Copilot States
  const [chatMessages, setChatMessages] = useState<BlogChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [chatAudience, setChatAudience] = useState<'families' | 'guides' | 'general'>('families');
  const [isChatThinking, setIsChatThinking] = useState(false);

  // Editor Form Fields
  const [coverImage, setCoverImage] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [customAuthorName, setCustomAuthorName] = useState('');
  const [customAuthorAvatar, setCustomAuthorAvatar] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [isFeatured, setIsFeatured] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [translations, setTranslations] = useState<BlogPostTranslationData[]>([
    {
      locale: 'es',
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: ''
    }
  ]);

  // AI Assistant In-Form States
  const [isAiGeneratingMeta, setIsAiGeneratingMeta] = useState(false);
  const [isAiTranslating, setIsAiTranslating] = useState(false);
  const [translatingLocale, setTranslatingLocale] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPromptStyle, setAiPromptStyle] = useState('');
  const [aiPromptText, setAiPromptText] = useState('');

  const AI_STYLES = [
    { id: 'carboncillo', label: 'Carboncillo y Terracota (Oficial)', prompt: 'Dibujo a mano alzada con carboncillo negro y crayón terracota cálido, estilo bosquejo artístico sobre papel artesanal. Sin texto, sin letras, sin tipografía.' },
    { id: 'fotorrealista', label: 'Fotorrealista', prompt: 'Fotografía profesional de alta calidad, iluminación natural suave, ambiente preparado Montessori. Sin texto, sin letras, sin tipografía.' },
    { id: 'acuarela', label: 'Acuarela', prompt: 'Ilustración artística en acuarela, pinceladas suaves, tonos cálidos y orgánicos, atmósfera serena. Sin texto, sin letras, sin tipografía.' },
    { id: 'minimalista', label: 'Minimalista', prompt: 'Diseño minimalista moderno, formas limpias y elegantes, composición visual despejada. Sin texto, sin letras, sin tipografía.' },
    { id: '3d', label: 'Animación 3D', prompt: 'Render 3D suave estilo editorial/Pixar, iluminación cálida, texturas ricas. Sin texto, sin letras, sin tipografía.' }
  ];

  const PRESET_AUTHORS = [
    { name: 'Dra. María Elena Rivas', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', role: 'Guía Montessori & Pedagoga' },
    { name: 'Prof. Carlos Mendoza', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'Especialista en Neuroeducación' },
    { name: 'Dra. Valentina Navarro', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', role: 'Catedrática en Desarrollo Infantil' },
    { name: 'Dr. Andrés Villalobos', avatar: 'https://randomuser.me/api/portraits/men/68.jpg', role: 'Investigador en Psicología Educativa' },
    { name: 'Mtra. Sofía Altamirano', avatar: 'https://randomuser.me/api/portraits/women/24.jpg', role: 'Guía de Casa de Niños' },
    { name: 'Prof. Roberto Salazar', avatar: 'https://randomuser.me/api/portraits/men/82.jpg', role: 'Educador & Filosofía Montessori' },
    { name: 'Dra. Carmen Morales', avatar: 'https://randomuser.me/api/portraits/women/51.jpg', role: 'Especialista en Educación Emocional' },
    { name: 'Dr. Fernando Ortiz', avatar: 'https://randomuser.me/api/portraits/men/51.jpg', role: 'Docente e Investigador' },
    { name: 'Lic. Mariana Herrera', avatar: 'https://randomuser.me/api/portraits/women/12.jpg', role: 'Psicopedagoga Infantil' },
    { name: 'Prof. Gabriel Lozano', avatar: 'https://randomuser.me/api/portraits/men/29.jpg', role: 'Consultor Pedagógico' }
  ];

  const [isSaving, setIsSaving] = useState(false);

  // Category/Tag Manager Modals
  const [isTaxonomyModalOpen, setIsTaxonomyModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Headers helper
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (isPlatformBlog) {
      headers['x-is-platform'] = 'true';
    } else if (currentSchoolId) {
      headers['x-school-id'] = currentSchoolId;
    }
    return headers;
  };

  // Load Data
  const loadBlogData = async () => {
    setLoading(true);
    try {
      const headers = getHeaders();

      // 1. Fetch Entitlement
      try {
        const entRes = await fetch('/api/blog/entitlement', { headers });
        if (entRes.ok) {
          const entData = await entRes.json();
          setEntitlement(entData);
        }
      } catch (e) {
        console.warn('Entitlement check warning:', e);
      }

      // 2. Fetch Posts
      try {
        const postsRes = await fetch('/api/admin/blog/posts', { headers });
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          if (Array.isArray(postsData)) {
            setPosts(postsData);
          }
        }
      } catch (e) {
        console.error('Error fetching admin posts:', e);
      }

      // 3. Fetch Categories & Tags
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/blog/categories', { headers }),
          fetch('/api/blog/tags', { headers })
        ]);

        if (catRes.ok) {
          const cData = await catRes.json();
          if (Array.isArray(cData)) setCategories(cData);
        }
        if (tagRes.ok) {
          const tData = await tagRes.json();
          if (Array.isArray(tData)) setTags(tData);
        }
      } catch (e) {
        console.warn('Taxonomies fetch warning:', e);
      }
    } catch (err: any) {
      console.error('Error loading blog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogData();
  }, [currentSchoolId, isPlatformBlog]);

  // Current active translation in editor
  const currentTranslation = useMemo(() => {
    const curLoc = typeof activeLocaleTab === 'string' && activeLocaleTab ? activeLocaleTab : 'es';
    return translations.find(t => (t?.locale || 'es') === curLoc) || {
      locale: curLoc,
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: ''
    };
  }, [translations, activeLocaleTab]);

  const updateCurrentTranslation = (fields: Partial<BlogPostTranslationData>) => {
    const curLoc = typeof activeLocaleTab === 'string' && activeLocaleTab ? activeLocaleTab : 'es';
    setTranslations(prev => {
      const exists = prev.some(t => (t?.locale || 'es') === curLoc);
      if (exists) {
        return prev.map(t => (t?.locale || 'es') === curLoc ? { ...t, ...fields } : t);
      } else {
        return [
          ...prev,
          {
            locale: curLoc,
            slug: '',
            title: '',
            excerpt: '',
            content: '',
            metaTitle: '',
            metaDescription: '',
            canonicalUrl: '',
            ...fields
          }
        ];
      }
    });
  };

  // Add new translation tab
  const handleAddTranslationLocale = (localeCode: string) => {
    if (translations.some(t => t.locale === localeCode)) {
      setActiveLocaleTab(localeCode);
      setAddLangDropdownOpen(false);
      return;
    }
    setTranslations(prev => [
      ...prev,
      {
        locale: localeCode,
        slug: '',
        title: '',
        excerpt: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        canonicalUrl: ''
      }
    ]);
    setActiveLocaleTab(localeCode);
    setAddLangDropdownOpen(false);
    toast.success(`Pestaña en ${getLanguageByCode(localeCode).name} añadida`);
  };

  // Remove a translation tab
  const handleRemoveTranslationLocale = (localeCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (translations.length <= 1) {
      toast.warning('El artículo debe tener al menos un idioma.');
      return;
    }
    const remaining = translations.filter(t => t.locale !== localeCode);
    setTranslations(remaining);
    if (activeLocaleTab === localeCode) {
      setActiveLocaleTab(remaining[0].locale);
    }
    toast.success(`Traducción en ${getLanguageByCode(localeCode).name} eliminada.`);
  };

  // Open Create with user's preferred initial language
  const handleOpenCreate = (initialLang?: any) => {
    if (!isPlatformBlog && entitlement && !entitlement.allowed) {
      toast.error(entitlement.reason || 'Módulo de blog bloqueado por suscripción');
      return;
    }

    const startLang = (typeof initialLang === 'string' && initialLang.trim())
      ? initialLang.trim()
      : (availableLanguages[0]?.code || 'es');

    setEditingPostId(null);
    setCoverImage('');
    setCoverImageAlt('');
    setCustomAuthorName('');
    setCustomAuthorAvatar('');
    setStatus('DRAFT');
    setIsFeatured(false);
    setPublishedAt('');
    setSelectedCategoryIds([]);
    setSelectedTagIds([]);
    setActiveLocaleTab(startLang);
    setTranslations([
      {
        locale: startLang,
        slug: '',
        title: '',
        excerpt: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        canonicalUrl: ''
      }
    ]);
    setDrawerView('form');
    setIsDrawerOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (post: BlogItem) => {
    setEditingPostId(post.id);
    setCoverImage(post.coverImage || '');
    setCoverImageAlt(post.coverImageAlt || '');
    setCustomAuthorName(post.customAuthorName || '');
    setCustomAuthorAvatar(post.customAuthorAvatar || '');
    setStatus(post.status);
    setIsFeatured(post.isFeatured);
    setPublishedAt(post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : '');
    setSelectedCategoryIds(post.categories.map(c => c.id));
    setSelectedTagIds(post.tags.map(t => t.id));

    if (post.translations && post.translations.length > 0) {
      setTranslations(post.translations.map(t => ({
        locale: typeof t?.locale === 'string' ? t.locale : 'es',
        slug: t.slug || '',
        title: t.title || '',
        excerpt: t.excerpt || '',
        content: t.content || '',
        metaTitle: t.metaTitle || '',
        metaDescription: t.metaDescription || '',
        canonicalUrl: t.canonicalUrl || ''
      })));
      const firstLocale = post.translations[0]?.locale;
      setActiveLocaleTab(typeof firstLocale === 'string' && firstLocale ? firstLocale : 'es');
    } else {
      const startLang = availableLanguages[0]?.code || 'es';
      setTranslations([
        {
          locale: startLang,
          slug: '',
          title: '',
          excerpt: '',
          content: '',
          metaTitle: '',
          metaDescription: '',
          canonicalUrl: ''
        }
      ]);
      setActiveLocaleTab(startLang);
    }
    setDrawerView('form');
    setIsDrawerOpen(true);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await uploadPhysicalFile(file, 'gallery', 'blog-cover');
      setCoverImage(res.url);
      if (!coverImageAlt && currentTranslation.title) {
        setCoverImageAlt(currentTranslation.title);
      }
      toast.success('Imagen de portada subida correctamente');
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove Cover Image Handler (deletes physically from storage if editing)
  const handleRemoveCoverImage = async () => {
    const oldCover = coverImage;
    setCoverImage('');
    setCoverImageAlt('');
    if (editingPostId && oldCover) {
      try {
        await fetch(`/api/admin/blog/posts/${editingPostId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ coverImage: '', coverImageAlt: '' })
        });
        setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, coverImage: '', coverImageAlt: '' } : p));
        toast.success('Imagen de portada eliminada');
      } catch (err: any) {
        console.warn('Error clearing cover in backend:', err);
      }
    }
  };

  // AI Image Generation Handler
  const buildAiImagePrompt = (title: string, stylePrompt?: string) => {
    return `Ilustración artística y visual para portada de blog Montessori sobre el concepto: "${title}". ${stylePrompt || ''} Estrictamente SIN texto, SIN títulos, SIN letras, SIN carteles ni palabras escritas, escena puramente visual.`;
  };

  const openAiModal = () => {
    const title = currentTranslation?.title;
    if (!title) {
      toast.warning('Escribe primero un titulo para generar una imagen relacionada.');
      return;
    }
    const defaultStyle = isPlatformBlog
      ? AI_STYLES.find(s => s.id === 'carboncillo')
      : AI_STYLES.find(s => s.id === 'fotorrealista');

    setAiPromptStyle(defaultStyle?.id || '');
    setAiPromptText(buildAiImagePrompt(title, defaultStyle?.prompt));
    setIsAiModalOpen(true);
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const styleId = e.target.value;
    setAiPromptStyle(styleId);
    const style = AI_STYLES.find(s => s.id === styleId);
    const title = currentTranslation?.title || '';
    setAiPromptText(buildAiImagePrompt(title, style?.prompt));
  };

  const handleAiGenerateImageSubmit = async () => {
    setIsAiModalOpen(false);
    const title = currentTranslation?.title;
    if (!title) {
      toast.warning('Escribe primero un titulo para generar una imagen relacionada.');
      return;
    }

    setIsGeneratingAiImage(true);
    try {
      const res = await fetch('/api/admin/blog/ai/generate-image', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title: String(currentTranslation?.title), prompt: aiPromptText })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al generar imagen con IA');
      }

      const data = await res.json();

      if (!data.url) {
        throw new Error(data.error || 'No se recibió la URL de la imagen generada');
      }

      setCoverImage(data.url);
      const newAlt = coverImageAlt || title;
      setCoverImageAlt(newAlt);

      // Si estamos editando un artículo existente, persistimos la imagen en DB en segundo plano sin cerrar el panel
      if (editingPostId) {
        try {
          await fetch(`/api/admin/blog/posts/${editingPostId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ coverImage: data.url, coverImageAlt: newAlt })
          });
          setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, coverImage: data.url, coverImageAlt: newAlt } : p));
        } catch (saveErr) {
          console.warn('Error persistiendo imagen en post existente:', saveErr);
        }
      }

      toast.success('Imagen generada y asignada exitosamente');
    } catch (err: any) {
      toast.error('Error al generar imagen: ' + err.message);
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  // AI Copilot: Generate SEO & Metadata
  const handleAiGenerateMetadata = async () => {
    if (!currentTranslation.title && !currentTranslation.content) {
      toast.warning('Ingresa un título o contenido para que la IA pueda analizarlo');
      return;
    }

    setIsAiGeneratingMeta(true);
    try {
      const res = await fetch('/api/admin/blog/ai/generate-metadata', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: currentTranslation.title,
          content: currentTranslation.content,
          locale: activeLocaleTab
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al generar metadatos');
      }

      const meta = await res.json();
      updateCurrentTranslation({
        slug: currentTranslation.slug || meta.slug,
        metaTitle: meta.metaTitle,
        metaDescription: meta.metaDescription,
        excerpt: currentTranslation.excerpt || meta.excerpt
      });
      if (!coverImageAlt && meta.coverImageAlt) {
        setCoverImageAlt(meta.coverImageAlt);
      }
      toast.success('✨ Metadatos SEO generados con éxito por la IA');
    } catch (err: any) {
      toast.error('Error de IA: ' + err.message);
    } finally {
      setIsAiGeneratingMeta(false);
    }
  };

  // AI Copilot: Translate to another language
  const handleAiTranslate = async (targetLocale: string, fromLocale?: string) => {
    // Determine source translation: fromLocale, or one that has content, or first translation
    const sourceTrans = fromLocale
      ? (translations.find(t => t.locale === fromLocale) || translations[0])
      : (translations.find(t => t.locale !== targetLocale && t.title && t.content) ||
        translations.find(t => t.title && t.content) ||
        translations[0]);

    if (!sourceTrans || !sourceTrans.title || !sourceTrans.content) {
      toast.warning('Primero redacta el título y contenido en el idioma base antes de traducir.');
      return;
    }

    // Immediately create or switch to the target tab with spinner
    setTranslations(prev => {
      if (prev.some(t => t.locale === targetLocale)) return prev;
      return [
        ...prev,
        {
          locale: targetLocale,
          slug: '',
          title: '',
          excerpt: '',
          content: '',
          metaTitle: '',
          metaDescription: '',
          canonicalUrl: ''
        }
      ];
    });
    setActiveLocaleTab(targetLocale);
    setTranslateDropdownOpen(false);
    setTranslatingLocale(targetLocale);
    setIsAiTranslating(true);

    try {
      const res = await fetch('/api/admin/blog/ai/translate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: sourceTrans.title,
          excerpt: sourceTrans.excerpt,
          content: sourceTrans.content,
          metaTitle: sourceTrans.metaTitle || sourceTrans.title,
          metaDescription: sourceTrans.metaDescription || sourceTrans.excerpt,
          targetLocale,
          sourceLocale: sourceTrans.locale
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al traducir');
      }

      const transData = await res.json();

      setTranslations(prev => {
        const filtered = prev.filter(t => t.locale !== targetLocale);
        return [
          ...filtered,
          {
            locale: targetLocale,
            slug: transData.slug || '',
            title: transData.title || '',
            excerpt: transData.excerpt || '',
            content: transData.content || '',
            metaTitle: transData.metaTitle || transData.title || '',
            metaDescription: transData.metaDescription || transData.excerpt || '',
            canonicalUrl: ''
          }
        ];
      });

      setActiveLocaleTab(targetLocale);
      toast.success(`✨ Artículo traducido automáticamente al ${getLanguageByCode(targetLocale).name}`);
    } catch (err: any) {
      toast.error('Error al traducir con IA: ' + err.message);
    } finally {
      setIsAiTranslating(false);
      setTranslatingLocale(null);
    }
  };

  // AI Copilot: Send Message in Chat Assistant
  const handleSendChatMessage = async (overridePrompt?: string | any) => {
    const rawPrompt = typeof overridePrompt === 'string'
      ? overridePrompt
      : (typeof chatInput === 'string' ? chatInput : '');
    const promptToSend = rawPrompt.trim();
    if (!promptToSend) return;

    const userMsgId = `msg_${Date.now()}`;
    const newUserMsg: BlogChatMessage = {
      id: userMsgId,
      role: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    if (typeof overridePrompt !== 'string') {
      setChatInput('');
      if (chatInputRef.current) {
        chatInputRef.current.style.height = 'auto';
      }
    }
    setIsChatThinking(true);

    try {
      const res = await fetch('/api/admin/blog/ai/assist', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          topic: String(promptToSend),
          targetAudience: String(chatAudience || 'families'),
          locale: String(activeLocaleTab || 'es'),
          outlineOnly: false
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al redactar con IA');
      }

      const data = await res.json();

      const assistantMsg: BlogChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: `He estructurado y redactado la propuesta de artículo pedagógico en ${getLanguageByCode(activeLocaleTab).name}. Revisa los detalles a continuación y aplícala para incrustarla en el formulario:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generatedArticle: data
      };

      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error('Error de IA: ' + err.message);
      const errorMsg: BlogChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: `Ocurrió un error al generar el borrador: ${err.message}. Por favor intenta de nuevo.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatThinking(false);
    }
  };

  // AI Copilot: Apply generated article and switch back to 'form' view
  const handleApplyGeneratedArticle = (article: NonNullable<BlogChatMessage['generatedArticle']>) => {
    updateCurrentTranslation({
      title: article.suggestedTitle,
      slug: article.slug,
      excerpt: article.suggestedExcerpt,
      content: article.content,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription
    });

    if (!coverImageAlt) {
      setCoverImageAlt(article.suggestedTitle);
    }

    setDrawerView('form');
    toast.success('✨ ¡Contenido generado incrustado en el formulario con éxito!');
  };

  // Save Post
  const handleSavePost = async (overridePayload?: any) => {
    // Normalize translations and ensure clean strings
    const cleanTranslations = translations
      .filter(t => t && typeof t.locale === 'string' && t.locale.trim())
      .map(t => ({
        ...t,
        locale: t.locale.trim(),
        title: (t.title || '').trim(),
        excerpt: t.excerpt || '',
        content: t.content || '',
        slug: (t.slug || t.title || '').trim(),
        metaTitle: t.metaTitle || '',
        metaDescription: t.metaDescription || '',
        canonicalUrl: t.canonicalUrl || ''
      }));

    const primaryTrans = cleanTranslations.find(t => t.title) || cleanTranslations[0];
    if (!primaryTrans || !primaryTrans.title) {
      toast.error('El artículo debe tener al menos un título en su idioma principal');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        coverImage,
        coverImageAlt,
        customAuthorName,
        customAuthorAvatar,
        status,
        isFeatured,
        ...overridePayload,
        publishedAt: publishedAt || null,
        translations: cleanTranslations,
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
        authorId: user?.id
      };

      const url = editingPostId
        ? `/api/admin/blog/posts/${editingPostId}`
        : '/api/admin/blog/posts';
      const method = editingPostId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar artículo');
      }

      toast.success(editingPostId ? 'Artículo actualizado con éxito' : 'Artículo creado con éxito');
      setIsDrawerOpen(false);
      loadBlogData();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar articulo',
      description: 'Esta accion eliminara el articulo permanentemente. No se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!res.ok) throw new Error('Error al eliminar articulo');
      toast.success('Articulo eliminado');
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Category Add
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newCatName.trim() })
      });
      if (!res.ok) throw new Error('Error al crear categoría');
      const created = await res.json();
      setCategories(prev => [...prev, created]);
      setNewCatName('');
      toast.success('Categoría agregada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Tag Add
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch('/api/admin/blog/tags', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newTagName.trim() })
      });
      if (!res.ok) throw new Error('Error al crear etiqueta');
      const created = await res.json();
      setTags(prev => [...prev, created]);
      setNewTagName('');
      toast.success('Etiqueta agregada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
      const matchesCat = categoryFilter === 'ALL' || post.categories.some(c => c.slug === categoryFilter);
      const titleMatch = post.translations.some(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesSearch = !searchQuery || titleMatch;
      return matchesStatus && matchesCat && matchesSearch;
    });
  }, [posts, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 dark:bg-forest/20 text-forest flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                {isPlatformBlog ? 'Blog Oficial MontessoriNexus' : `Blog de ${schoolName}`}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-forest/10 text-forest">
                  Multi-tenant & SEO
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Publica artículos pedagógicos, optimiza con IA y posiciona tu institución en buscadores.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTaxonomyModalOpen(true)}
            className={`px-4 py-2 text-xs font-semibold border border-border hover:bg-muted/50 text-foreground ${btnRadiusClass} flex items-center gap-1.5 transition-all`}
          >
            <Folder className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Categorías & Tags</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className={`px-4 py-2 text-xs font-bold bg-forest hover:bg-forest-light text-white ${btnRadiusClass} shadow-xs flex items-center gap-1.5 transition-all cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* Trial Alert Banner for Schools */}
      {!isPlatformBlog && entitlement && (
        <>
          {entitlement.inTrial && (
            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="font-bold font-display block">Período de prueba activo (3 meses gratis)</strong>
                  <span>Te quedan <strong>{entitlement.daysLeft} días</strong> de prueba gratuita en el módulo de Blog escolar.</span>
                </div>
              </div>
            </div>
          )}

          {!entitlement.allowed && (
            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="font-bold font-display block">Módulo de Blog inactivo</strong>
                  <span>{entitlement.reason}</span>
                </div>
              </div>
              <a
                href="/pricing"
                className={`px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white ${btnRadiusClass} shadow-xs`}
              >
                Activar Módulo
              </a>
            </div>
          )}
        </>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o slug..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-forest"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Borradores</option>
            <option value="SCHEDULED">Programados</option>
            <option value="ARCHIVED">Archivados</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-forest"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts List / Table */}
      <div className="bg-white dark:bg-card rounded-3xl border border-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest" />
            <span>Cargando artículos...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">No hay artículos que coincidan</h3>
              <p className="text-xs text-muted-foreground">Comienza creando tu primera publicación con asistencia de IA.</p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenCreate()}
              className={`px-4 py-2 text-xs font-bold bg-forest text-white ${btnRadiusClass} shadow-xs inline-flex items-center gap-1.5`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Artículo</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPosts.map(post => {
              const primaryTrans = post.translations[0] || { title: 'Sin título', slug: '' };
              return (
                <div key={post.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-all">
                  <div className="flex items-start gap-4">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.coverImageAlt || primaryTrans.title}
                        className="w-16 h-16 rounded-xl object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-forest/5 text-forest/40 border border-border flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.status === 'PUBLISHED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : post.status === 'DRAFT'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : post.status === 'SCHEDULED'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                          {post.status === 'PUBLISHED' ? 'Publicado' : post.status === 'DRAFT' ? 'Borrador' : post.status === 'SCHEDULED' ? 'Programado' : 'Archivado'}
                        </span>

                        {post.isFeatured && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta">
                            ★ Destacado
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {(post.translations || []).map((t, idx) => {
                            const loc = t?.locale || 'es';
                            const lang = getLanguageByCode(loc);
                            return (
                              <span key={loc || idx} className="text-[9px] font-mono uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <span>{lang.flag}</span>
                                <span>{loc}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-foreground line-clamp-1">{primaryTrans.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 font-mono">/blog/{primaryTrans.slug}</p>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {post.readingTimeMinutes} min lectura
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {post.viewsCount} vistas
                        </span>
                        {post.author && (
                          <span>Por {post.author.fullName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(post)}
                      className={`p-2 text-xs font-semibold border border-border hover:bg-muted text-foreground ${btnRadiusClass} flex items-center gap-1.5`}
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className={`p-2 text-xs font-semibold hover:bg-destructive/10 text-destructive ${btnRadiusClass} flex items-center justify-center`}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-in Drawer Container (Minimum 1024px width on desktop) */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => {
          if (!isSaving && !isGeneratingAiImage && !isAiTranslating) {
            setIsDrawerOpen(false);
          }
        }}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full lg:w-[1024px] xl:w-[1140px] max-w-full bg-white dark:bg-card shadow-2xl flex flex-col border-l border-border transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Drawer Top Navigation Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
              {drawerView === 'ai-chat' ? <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" /> : <Edit3 className="w-5 h-5 text-forest" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-display text-foreground">
                  {editingPostId ? 'Editar Artículo' : 'Nuevo Artículo de Blog'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold uppercase">
                  {isPlatformBlog ? 'SaaS Oficial' : schoolName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {drawerView === 'ai-chat' ? 'Asistente de Redacción Montessori IA' : `/blog/${currentTranslation.slug || 'sin-slug'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher Pills */}
            <div className="bg-muted p-1 rounded-2xl flex items-center gap-1 border border-border">
              <button
                type="button"
                onClick={() => setDrawerView('form')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${drawerView === 'form'
                  ? 'bg-white dark:bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Formulario</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerView('ai-chat')}
                disabled={isGeneratingAiImage || isAiTranslating || isSaving}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${drawerView === 'ai-chat'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-600 dark:text-purple-400 hover:text-purple-700'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Asistente IA</span>
                <span className="text-[9px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-1 py-0.2 rounded font-bold">
                  Chat
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSaving || isGeneratingAiImage || isAiTranslating}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* ========================================================================= */}
          {/* VIEW 1: INTERACTIVE AI CHAT ASSISTANT (Hides the form)                   */}
          {/* ========================================================================= */}
          {drawerView === 'ai-chat' ? (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-background overflow-hidden">
              {/* Chat Context & Options Bar */}
              <div className="px-6 py-3 border-b border-border bg-white dark:bg-card flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Audiencia objetivo:</span>
                  <select
                    value={chatAudience}
                    onChange={e => setChatAudience(e.target.value as any)}
                    className="px-2.5 py-1 text-xs bg-muted/50 border border-border rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="families">Familias / Padres de Familia</option>
                    <option value="guides">Guías y Educadores Montessori</option>
                    <option value="general">Comunidad General y Futuros Alumnos</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Idioma de redacción:</span>
                  <div className="flex items-center gap-1">
                    {availableLanguages.map(l => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setActiveLocaleTab(l.code);
                          if (!translations.some(t => t.locale === l.code)) {
                            handleAddTranslationLocale(l.code);
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-lg transition-all font-semibold flex items-center gap-1 cursor-pointer ${activeLocaleTab === l.code
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                          }`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Message Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Welcome Card & Starter Prompts */}
                {chatMessages.length === 0 && (
                  <div className="max-w-2xl mx-auto text-center space-y-6 pt-4 pb-8 animate-in fade-in zoom-in-95">
                    <div className="w-14 h-14 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-xs">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold font-display text-foreground">
                        Asistente Editorial Montessori con IA
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        Pídeme estructurar un tema, redactar un artículo completo o generar ideas de contenido pedagógico. Cuando te guste el resultado, podrás incrustarlo en el formulario en un solo clic.
                      </p>
                    </div>

                    <div className="space-y-2 text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block text-center">
                        Sugerencias rápidas para comenzar:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          '🌿 Cómo preparar un ambiente Montessori en el hogar para fomentar la autonomía',
                          '👶 La mente absorbente y los periodos sensibles en la primera infancia (0 a 6 años)',
                          '🧘‍♀️ El rol del guía Montessori: observar sin interrumpir el autoaprendizaje',
                          '🍎 Actividades de vida práctica que desarrollan la concentración y psicomotricidad'
                        ].map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendChatMessage(prompt)}
                            className="p-3 text-left text-xs bg-white dark:bg-card border border-border hover:border-purple-300 dark:hover:border-purple-800 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-start gap-2.5 group cursor-pointer"
                          >
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-foreground font-medium">{prompt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages List */}
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {msg.role === 'user' ? 'Tú' : 'Copilot Montessori'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">{msg.timestamp}</span>
                    </div>

                    {/* Speech Bubble */}
                    {msg.text && (
                      <div
                        className={`p-4 rounded-3xl max-w-2xl text-xs leading-relaxed ${msg.role === 'user'
                          ? 'bg-forest text-white rounded-tr-xs'
                          : 'bg-white dark:bg-card border border-border text-foreground rounded-tl-xs shadow-xs'
                          }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* Render Rich Generated Article Card */}
                    {msg.generatedArticle && (
                      <div className="w-full max-w-3xl bg-white dark:bg-card border border-purple-200 dark:border-purple-900 rounded-3xl p-5 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Propuesta Generada ({getLanguageByCode(activeLocaleTab).name})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyGeneratedArticle(msg.generatedArticle!)}
                            className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>⚡ Aplicar e Incrustar en el Artículo</span>
                          </button>
                        </div>

                        {/* Suggested Title & Slug */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Título sugerido</span>
                          <h4 className="text-base font-bold font-display text-foreground">
                            {msg.generatedArticle.suggestedTitle}
                          </h4>
                          <span className="text-xs text-muted-foreground font-mono">
                            Slug: /blog/{msg.generatedArticle.slug}
                          </span>
                        </div>

                        {/* Excerpt */}
                        {msg.generatedArticle.suggestedExcerpt && (
                          <div className="p-3 rounded-xl bg-muted/40 text-xs text-foreground italic border-l-2 border-purple-500">
                            "{msg.generatedArticle.suggestedExcerpt}"
                          </div>
                        )}

                        {/* Markdown Content Preview */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              Cuerpo del artículo (Markdown generado)
                            </span>
                          </div>
                          <div className="max-h-60 overflow-y-auto p-4 rounded-2xl bg-muted/30 border border-border font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                            {msg.generatedArticle.content}
                          </div>
                        </div>

                        {/* SEO Metadata Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Meta Title SEO</span>
                            <span className="font-semibold text-foreground">{msg.generatedArticle.metaTitle}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Meta Description</span>
                            <span className="text-muted-foreground">{msg.generatedArticle.metaDescription}</span>
                          </div>
                        </div>

                        {/* Bottom Apply Action */}
                        <div className="pt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleApplyGeneratedArticle(msg.generatedArticle!)}
                            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold bg-forest hover:bg-forest-light text-white rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Incrustar contenido en el formulario y continuar editando</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Thinking / Drafting Indicator */}
                {isChatThinking && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-card border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 w-fit shadow-xs animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-xs font-semibold">
                      Redactando artículo pedagógico con citas y SEO...
                    </span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-border bg-white dark:bg-card shrink-0">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="relative flex flex-col bg-muted/40 hover:bg-muted/60 focus-within:bg-white dark:focus-within:bg-card border border-border focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 rounded-2xl transition-all shadow-2xs">
                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={e => {
                        setChatInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (chatInput.trim() && !isChatThinking) {
                            handleSendChatMessage();
                          }
                        }
                      }}
                      rows={1}
                      placeholder="Escribe el tema o pide un artículo (ej: Beneficios del trabajo con materiales de madera en Casa de Niños)..."
                      disabled={isChatThinking}
                      className="w-full resize-none bg-transparent px-4 pt-3.5 pb-11 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed max-h-44 overflow-y-auto disabled:opacity-50"
                    />

                    {/* Bottom toolbar inside textarea container */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:inline-block pr-1 font-mono select-none">
                        Shift + Enter para nueva línea
                      </span>
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatThinking}
                        className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:hover:bg-purple-600 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
                        title="Enviar al Asistente IA (Enter)"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: FULL ARTICLE FORM (With multi-language tabs and Markdown editor) */
            /* ========================================================================= */
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Content & Translations */}
              <div className="lg:col-span-2 space-y-4">
                {/* AI Copilot Invitation Banner */}


                {/* Header above languages with Translation Dropdown on the right */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-forest" />
                    <span className="text-xs font-bold text-foreground">Idiomas y Traducciones</span>
                  </div>

                  {/* AI Translation Action Dropdown (Always on top right above languages) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTranslateDropdownOpen(!translateDropdownOpen)}
                      disabled={isAiTranslating || isGeneratingAiImage || isSaving}
                      className="px-3 py-1.5 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/70 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isAiTranslating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      )}
                      <span>{isAiTranslating ? 'Traduciendo...' : 'Traducir con IA'}</span>
                      <ChevronDown className="w-3 h-3 text-purple-500" />
                    </button>

                    {translateDropdownOpen && (
                      <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-card rounded-2xl border border-border shadow-xl p-2 z-50 space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 block uppercase tracking-wider">
                          Auto-traducir a otro idioma
                        </span>
                        {availableLanguages
                          .filter(l => l.code !== activeLocaleTab)
                          .map(l => (
                            <button
                              key={l.code}
                              type="button"
                              onClick={() => handleAiTranslate(l.code, activeLocaleTab)}
                              className="w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center justify-between text-foreground font-medium transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <span>{l.flag}</span>
                                <span>{l.name}</span>
                              </span>
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold font-mono">
                                {translations.some(t => t.locale === l.code && t.title) ? 'Actualizar' : '+ Generar'}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Language Tabs Row */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
                  {translations.map((t, idx) => {
                    const locale = t?.locale || 'es';
                    const langObj = getLanguageByCode(locale);
                    const hasContent = Boolean(t?.title && t?.content);
                    const isActive = activeLocaleTab === locale;
                    const isThisTranslating = isAiTranslating && translatingLocale === locale;

                    return (
                      <div
                        key={locale || idx}
                        className={`group/tab inline-flex items-center rounded-xl transition-all ${isActive
                          ? (isPlatformBlog ? 'bg-[#C4661F] text-white shadow-xs' : 'bg-forest text-white shadow-xs')
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                      >
                        <button
                          type="button"
                          onClick={() => !isAiTranslating && setActiveLocaleTab(locale)}
                          disabled={isAiTranslating}
                          className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <span>{langObj.flag}</span>
                          <span>{langObj.name}</span>
                          {isThisTranslating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${hasContent
                                ? (isActive ? 'bg-white' : 'bg-emerald-500')
                                : (isActive ? 'bg-white/40' : 'bg-stone-300 dark:bg-slate-600')
                                }`}
                              title={hasContent ? 'Contenido redactado' : 'Sin contenido aún'}
                            />
                          )}
                        </button>

                        {translations.length > 1 && !isAiTranslating && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveTranslationLocale(locale, e)}
                            className={`pr-2 pl-0.5 py-1.5 text-[10px] opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${isActive ? 'text-white hover:text-red-200' : 'text-muted-foreground hover:text-destructive'
                              }`}
                            title={`Eliminar traducción en ${langObj.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Language Dropdown */}
                  {availableLanguages.some(l => !translations.some(t => (t?.locale || 'es') === l.code)) && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAddLangDropdownOpen(!addLangDropdownOpen)}
                        disabled={isAiTranslating || isGeneratingAiImage || isSaving}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-dashed border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Idioma</span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
                      </button>

                      {addLangDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-card rounded-2xl border border-border shadow-lg p-1.5 z-50 space-y-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 block uppercase tracking-wider">
                            Añadir traducción
                          </span>
                          {availableLanguages
                            .filter(l => !translations.some(t => (t?.locale || 'es') === l.code))
                            .map(l => (
                              <button
                                key={l.code}
                                type="button"
                                onClick={() => handleAddTranslationLocale(l.code)}
                                className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted flex items-center gap-2 text-foreground font-medium transition-colors cursor-pointer"
                              >
                                <span>{l.flag}</span>
                                <span>{l.name}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Active Translating Indicator Callout */}
                {isAiTranslating && translatingLocale === activeLocaleTab && (
                  <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center gap-3 text-xs text-purple-900 dark:text-purple-200">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
                    <div className="space-y-0.5">
                      <strong className="block font-bold">Traduciendo artículo al {getLanguageByCode(translatingLocale).name} con IA...</strong>
                      <span className="text-[11px] text-purple-700 dark:text-purple-300">Generando título, extracto, contenido completo y metadatos SEO. Por favor espera unos segundos.</span>
                    </div>
                  </div>
                )}

                {/* Empty Translation Assistant Callout */}
                {!isAiTranslating && !currentTranslation.title && !currentTranslation.content && translations.length > 1 && (
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-950 dark:text-purple-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>
                        Pestaña en <strong>{getLanguageByCode(activeLocaleTab).name}</strong> vacía. Puedes redactarla manualmente o auto-traducirla desde otra versión.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAiTranslate(activeLocaleTab)}
                      disabled={isAiTranslating}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isAiTranslating ? 'Traduciendo...' : 'Auto-traducir con IA ahora'}
                    </button>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Título del Artículo ({String(activeLocaleTab || 'es').toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={currentTranslation.title}
                    onChange={e => updateCurrentTranslation({ title: e.target.value })}
                    placeholder="Ej: La importancia de los periodos sensibles en casa"
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest font-semibold"
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Resumen / Extracto</label>
                  <textarea
                    value={currentTranslation.excerpt}
                    onChange={e => updateCurrentTranslation({ excerpt: e.target.value })}
                    rows={2}
                    placeholder="Breve introducción para tarjetas y previews de redes sociales..."
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>

                {/* Content Editor */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Cuerpo del Artículo</label>
                  </div>
                  <MarkdownWysiwygEditor
                    value={currentTranslation.content}
                    onChange={val => updateCurrentTranslation({ content: val })}
                    placeholder="Escribe tu artículo aquí..."
                  />
                </div>

                {/* SEO Accordion */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-forest" />
                      <span className="text-xs font-bold text-foreground">Optimización SEO & Metadatos</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiGenerateMetadata}
                      disabled={isAiGeneratingMeta || isAiTranslating || isGeneratingAiImage || isSaving}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAiGeneratingMeta ? 'Generando SEO...' : 'Generar SEO con IA'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">URL Slug</label>
                      <input
                        type="text"
                        value={currentTranslation.slug}
                        onChange={e => updateCurrentTranslation({ slug: e.target.value })}
                        placeholder="periodos-sensibles-montessori"
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-card border border-border rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Meta Title</label>
                      <input
                        type="text"
                        value={currentTranslation.metaTitle}
                        onChange={e => updateCurrentTranslation({ metaTitle: e.target.value })}
                        placeholder="Título para Google (50-60 car.)"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-card border border-border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Meta Description</label>
                    <textarea
                      value={currentTranslation.metaDescription}
                      onChange={e => updateCurrentTranslation({ metaDescription: e.target.value })}
                      rows={2}
                      placeholder="Descripción para buscadores (130-155 car.)..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-card border border-border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Right Col: Publishing Settings */}
              <div className="space-y-4">
                {/* Cover Image Box */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <label className="text-xs font-bold text-foreground block">Imagen Principal de Portada</label>

                  {isGeneratingAiImage ? (
                    <div className="relative h-36 rounded-xl overflow-hidden border-2 border-dashed border-purple-400/80 bg-gradient-to-br from-amber-50/80 via-purple-50/50 to-orange-50/80 dark:from-purple-950/40 dark:via-zinc-900 dark:to-orange-950/20 flex flex-col items-center justify-center p-3 shadow-inner select-none">
                      {/* Artistic canvas texture overlay */}
                      <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[radial-gradient(#9333ea_1px,transparent_1px)] [background-size:10px_10px]" />

                      {/* Moving Paintbrush track */}
                      <div className="relative w-48 h-14 flex items-center justify-center">
                        {/* Dynamic paint stroke on the canvas */}
                        <div
                          className="absolute h-3.5 rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-purple-500 blur-[1px] opacity-70"
                          style={{
                            width: '130px',
                            animation: 'paintStrokeSweep 2s ease-in-out infinite alternate'
                          }}
                        />
                        <div
                          className="absolute h-1.5 rounded-full bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600 opacity-80"
                          style={{
                            width: '90px',
                            animation: 'paintStrokeSweep 2s ease-in-out infinite alternate-reverse'
                          }}
                        />

                        {/* Moving Paintbrush */}
                        <div
                          className="absolute z-10 flex items-center justify-center"
                          style={{
                            animation: 'brushSideToSide 2s ease-in-out infinite alternate'
                          }}
                        >
                          <div className="relative">
                            <Paintbrush className="w-8 h-8 text-purple-700 dark:text-purple-300 drop-shadow-lg transform -rotate-45" />
                            {/* Glowing sparkle at the tip of the brush */}
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="relative z-10 mt-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-500" />
                        <span>Pintando e ilustrando portada...</span>
                      </div>

                      <style>{`
                        @keyframes brushSideToSide {
                          0% { transform: translateX(-55px) translateY(-3px) rotate(-15deg); }
                          50% { transform: translateX(0px) translateY(3px) rotate(12deg); }
                          100% { transform: translateX(55px) translateY(-3px) rotate(35deg); }
                        }
                        @keyframes paintStrokeSweep {
                          0% { transform: scaleX(0.3) translateX(-35px); opacity: 0.3; }
                          50% { transform: scaleX(1.1) translateX(0px); opacity: 0.85; }
                          100% { transform: scaleX(0.3) translateX(35px); opacity: 0.4; }
                        }
                      `}</style>
                    </div>
                  ) : coverImage ? (
                    <div className="relative group rounded-xl overflow-hidden border border-border">
                      <img src={coverImage} alt="Cover" className="w-full h-36 object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
                        <ImageIcon className="w-5 h-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground font-semibold">
                          {isUploadingImage ? 'Subiendo...' : 'Subir imagen'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={openAiModal}
                        disabled={isGeneratingAiImage || !currentTranslation?.title}
                        className="flex items-center justify-center gap-2 h-10 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                          {isGeneratingAiImage ? 'Generando con IA...' : 'Generar con IA'}
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Texto Alternativo (Alt Text Accesible)</label>
                    <input
                      type="text"
                      value={coverImageAlt}
                      onChange={e => setCoverImageAlt(e.target.value)}
                      placeholder="Descripción accesible de la imagen..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-card border border-border rounded-lg"
                    />
                  </div>
                </div>

                {/* Status & Date */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground">Estado de Publicación</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[
                        { value: 'DRAFT', label: 'Borrador', icon: <FileText className="w-3.5 h-3.5" /> },
                        { value: 'PUBLISHED', label: 'Publicado', icon: <Globe className="w-3.5 h-3.5" /> },
                        { value: 'SCHEDULED', label: 'Programado', icon: <Calendar className="w-3.5 h-3.5" /> },
                        { value: 'ARCHIVED', label: 'Archivado', icon: <Folder className="w-3.5 h-3.5" /> }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatus(opt.value as any)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-2.5 text-xs font-semibold rounded-xl border transition-all ${status === opt.value
                            ? 'bg-forest text-white border-forest shadow-sm ring-1 ring-forest/20'
                            : 'bg-white dark:bg-card border-border text-muted-foreground hover:border-forest/40 hover:text-foreground'
                            }`}
                        >
                          {opt.icon}
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {status === 'SCHEDULED' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Fecha y Hora Programada</label>
                      <input
                        type="datetime-local"
                        value={publishedAt}
                        onChange={e => setPublishedAt(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-card border border-border rounded-lg"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={e => setIsFeatured(e.target.checked)}
                      className="rounded text-forest focus:ring-forest"
                    />
                    <span className="text-xs font-semibold text-foreground">Destacar en la portada del blog</span>
                  </label>
                </div>

                {/* Custom Author */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Autor del Artículo (Opcional)</label>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      Por defecto se usará tu perfil. Puedes usar un nombre y avatar distinto aquí.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Nombre del Autor</label>
                    <input
                      type="text"
                      value={customAuthorName}
                      onChange={e => setCustomAuthorName(e.target.value)}
                      placeholder="Ej. Dra. María Montessori..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-card border border-border rounded-lg"
                    />
                  </div>

                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-muted-foreground">Avatar de Profesional</label>
                      <span className="text-[10px] text-muted-foreground">Clic para auto-llenar autor</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomAuthorAvatar('');
                          setCustomAuthorName('');
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${!customAuthorAvatar ? 'border-forest bg-forest/10 text-forest' : 'border-dashed border-border text-muted-foreground hover:bg-muted'
                          }`}
                        title="Limpiar autor / avatar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {PRESET_AUTHORS.map(author => (
                        <button
                          key={author.avatar}
                          type="button"
                          onClick={() => {
                            setCustomAuthorAvatar(author.avatar);
                            setCustomAuthorName(author.name);
                            toast.info(`Autor seleccionado: ${author.name}`);
                          }}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${customAuthorAvatar === author.avatar ? 'border-forest ring-2 ring-forest/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                            }`}
                          title={`${author.name} (${author.role})`}
                        >
                          <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Taxonomies: Categories & Tags */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Categorías</label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {categories.map(c => {
                        const isSel = selectedCategoryIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCategoryIds(prev =>
                              isSel ? prev.filter(id => id !== c.id) : [...prev, c.id]
                            )}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${isSel ? 'bg-forest text-white' : 'bg-white dark:bg-card text-muted-foreground border border-border'
                              }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Etiquetas (Tags)</label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {tags.map(t => {
                        const isSel = selectedTagIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTagIds(prev =>
                              isSel ? prev.filter(id => id !== t.id) : [...prev, t.id]
                            )}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${isSel ? 'bg-terracotta text-white' : 'bg-white dark:bg-card text-muted-foreground border border-border'
                              }`}
                          >
                            #{t.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Bottom Bar (Only on Form View) */}
        {drawerView === 'form' && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20 shrink-0">
            <button
              type="button"
              onClick={() => setDrawerView('ai-chat')}
              disabled={isGeneratingAiImage || isAiTranslating || isSaving}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Asistente de Redacción IA</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                disabled={isSaving || isGeneratingAiImage || isAiTranslating}
                className={`px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed ${btnRadiusClass}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSavePost()}
                disabled={isSaving || isGeneratingAiImage || isAiTranslating}
                className={`px-5 py-2 text-xs font-bold bg-forest hover:bg-forest-light text-white ${btnRadiusClass} shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
              >
                {isSaving || isAiTranslating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>
                  {isSaving
                    ? 'Guardando...'
                    : (isGeneratingAiImage
                      ? 'Generando imagen...'
                      : (isAiTranslating
                        ? 'Traduciendo...'
                        : 'Guardar Artículo'))}
                </span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Taxonomies Modal */}
      {isTaxonomyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Folder className="w-4 h-4 text-forest" />
                <span>Gestión de Categorías y Etiquetas</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTaxonomyModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Categorías</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Nueva categoría..."
                  className="flex-1 px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className={`px-3 py-1.5 text-xs font-bold bg-forest text-white ${btnRadiusClass}`}
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categories.map(c => (
                  <span key={c.id} className="text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground border border-border">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Add Tag */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Etiquetas (Tags)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Nueva etiqueta..."
                  className="flex-1 px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className={`px-3 py-1.5 text-xs font-bold bg-terracotta text-white ${btnRadiusClass}`}
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map(t => (
                  <span key={t.id} className="text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground border border-border">
                    #{t.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Image Generation Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-foreground">Generar Imagen con IA</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!isPlatformBlog && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Estilo de Imagen</label>
                  <select
                    value={aiPromptStyle}
                    onChange={handleStyleChange}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {AI_STYLES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Prompt de Generación (Instrucciones para la IA)</label>
                  <span className="text-[10px] text-muted-foreground">Puedes modificar este texto</span>
                </div>
                <textarea
                  value={aiPromptText}
                  onChange={e => setAiPromptText(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
                  placeholder="Instrucciones para la imagen..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/20">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAiGenerateImageSubmit}
                disabled={!aiPromptText.trim()}
                className="px-6 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Generar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

