import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSiteSettings, getButtonRadiusClass } from '@/context/SettingsContext';
import {
  BookOpen, Clock, Calendar, ArrowLeft, ArrowRight, Share2, Tag, Folder,
  CheckCircle2, Sparkles, User as UserIcon, Copy, Check, MessageCircle,
  ExternalLink, ChevronRight, ChevronLeft, ListOrdered, ArrowUpRight, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogNavbar } from '@/components/blog/BlogNavbar';
import { BlogMetaSEO } from '@/components/blog/BlogMetaSEO';
import { SocialShareBar } from '@/components/blog/SocialShareBar';
import { BlogFooter } from '@/components/blog/BlogFooter';
import { MermaidDiagram } from '@/components/blog/MermaidDiagram';
import { AsciiTableRenderer, parseBoxTable } from '@/components/blog/AsciiTableRenderer';
import { ChatRenderer, parseChatDialogue } from '@/components/blog/ChatRenderer';
import { useBlogProtection } from '@/hooks/useBlogProtection';
import { getPlatformHomeUrl } from '@/lib/urls';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

const I18N_DETAIL: Record<string, {
  aiIllustration: string;
  expandedView: string;
  minRead: string;
  backToAll: string;
  backToHome: string;
  aboutAuthor: string;
  toc: string;
  relatedReads: string;
  readMore: string;
  relatedSectionTitle: string;
  dateLocale: string;
}> = {
  es: {
    aiIllustration: 'Ilustración generada por IA',
    expandedView: 'Vista ampliada',
    minRead: 'min de lectura',
    backToAll: 'Volver a todas las publicaciones',
    backToHome: 'Volver a la portada del Blog',
    aboutAuthor: 'Sobre el autor',
    toc: 'Índice del Artículo',
    relatedReads: 'Lecturas Recomendadas',
    readMore: 'Leer →',
    relatedSectionTitle: 'Artículos Relacionados y Novedades',
    dateLocale: 'es-ES'
  },
  en: {
    aiIllustration: 'AI-generated illustration',
    expandedView: 'Expanded view',
    minRead: 'min read',
    backToAll: 'Back to all publications',
    backToHome: 'Back to Blog home',
    aboutAuthor: 'About the author',
    toc: 'Table of Contents',
    relatedReads: 'Recommended Reads',
    readMore: 'Read →',
    relatedSectionTitle: 'Related Articles & Updates',
    dateLocale: 'en-US'
  },
  fr: {
    aiIllustration: 'Illustration générée par IA',
    expandedView: 'Vue agrandie',
    minRead: 'min de lecture',
    backToAll: 'Retour à toutes les publications',
    backToHome: 'Retour à l\'accueil du Blog',
    aboutAuthor: 'À propos de l\'auteur',
    toc: 'Sommaire de l\'article',
    relatedReads: 'Lectures Recommandées',
    readMore: 'Lire →',
    relatedSectionTitle: 'Articles Connexes et Nouveautés',
    dateLocale: 'fr-FR'
  },
  pt: {
    aiIllustration: 'Ilustração gerada por IA',
    expandedView: 'Visualização ampliada',
    minRead: 'min de leitura',
    backToAll: 'Voltar a todas as publicações',
    backToHome: 'Voltar à página inicial do Blog',
    aboutAuthor: 'Sobre o autor',
    toc: 'Índice do Artigo',
    relatedReads: 'Leituras Recomendadas',
    readMore: 'Ler →',
    relatedSectionTitle: 'Artigos Relacionados e Novidades',
    dateLocale: 'pt-BR'
  },
  de: {
    aiIllustration: 'KI-generierte Illustration',
    expandedView: 'Vergrößerte Ansicht',
    minRead: 'Min. Lesezeit',
    backToAll: 'Zurück zu allen Beiträgen',
    backToHome: 'Zurück zur Blog-Startseite',
    aboutAuthor: 'Über den Autor',
    toc: 'Inhaltsverzeichnis',
    relatedReads: 'Empfohlene Lektüre',
    readMore: 'Lesen →',
    relatedSectionTitle: 'Ähnliche Artikel & Neuigkeiten',
    dateLocale: 'de-DE'
  },
  ru: {
    aiIllustration: 'Иллюстрация создана ИИ',
    expandedView: 'Увеличенный просмотр',
    minRead: 'мин чтения',
    backToAll: 'Назад ко всем публикациям',
    backToHome: 'Назад на главную блога',
    aboutAuthor: 'Об авторе',
    toc: 'Содержание статьи',
    relatedReads: 'Рекомендуемое чтение',
    readMore: 'Читать →',
    relatedSectionTitle: 'Похожие статьи и новости',
    dateLocale: 'ru-RU'
  },
  it: {
    aiIllustration: "Illustrazione generata dall'IA",
    expandedView: 'Vista ingrandita',
    minRead: 'min di lettura',
    backToAll: 'Torna a tutti gli articoli',
    backToHome: 'Torna alla home del Blog',
    aboutAuthor: 'Sull\'autore',
    toc: 'Indice dell\'Articolo',
    relatedReads: 'Letture Consigliate',
    readMore: 'Leggi →',
    relatedSectionTitle: 'Articoli Correlati e Novità',
    dateLocale: 'it-IT'
  }
};

function getBlogI18n(locale: string) {
  const norm = (locale || 'es').toLowerCase().slice(0, 2);
  return I18N_DETAIL[norm] || I18N_DETAIL.es;
}

export const BlogPostDetailPage: React.FC = () => {
  useBlogProtection();

  const { slug, schoolSlug: schoolSlugFromUrl } = useParams<{ slug: string; schoolSlug?: string }>();
  const { isPlatformRoot, schoolName, schoolLogo, buttonRadius } = useSiteSettings();
  const btnRadiusClass = getButtonRadiusClass(buttonRadius);
  const navigate = useNavigate();
  const location = useLocation();

  const isSaaSBlog = isPlatformRoot || window.location.hostname.startsWith('blog.');

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeLocale, setActiveLocale] = useState<string>('es');
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt?: string } | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openLightbox = (src: string, alt?: string) => {
    setLightboxImage({ src, alt });
    window.history.pushState({ lightbox: true }, '');
  };

  const closeLightbox = () => {
    if (lightboxImage) {
      setLightboxImage(null);
      if (window.history.state?.lightbox) {
        window.history.back();
      }
    }
  };

  // Close lightbox on browser Back (popstate) or ESC key
  useEffect(() => {
    const handlePopState = () => {
      setLightboxImage(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        closeLightbox();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImage]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [lightboxImage]);

  // Scroll Progress listener throttled with requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    let lastProgress = -1;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (totalHeight > 0) {
            const current = Math.round((window.scrollY / totalHeight) * 100);
            if (Math.abs(current - lastProgress) >= 1) {
              lastProgress = current;
              setScrollProgress(current);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Post Detail
  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      const isMdRequest = slug.endsWith('.md') || (typeof window !== 'undefined' && window.location.pathname.endsWith('.md'));

      try {
        const headers: Record<string, string> = {
          'x-locale': activeLocale,
        };
        if (isSaaSBlog) {
          headers['x-is-platform'] = 'true';
        } else if (schoolSlugFromUrl) {
          headers['x-school-slug'] = schoolSlugFromUrl;
        }

        if (isMdRequest) {
          const res = await fetch(`/api/blog/posts/${slug}`, { headers });
          if (!res.ok) throw new Error('Artículo no encontrado');
          const text = await res.text();
          setRawMarkdown(text);
          return;
        }

        const res = await fetch(`/api/blog/posts/${slug}`, { headers });
        if (!res.ok) {
          throw new Error('Artículo no encontrado');
        }

        const data = await res.json();
        setPost(data);
        if (data.locale && data.locale !== activeLocale) {
          setActiveLocale(data.locale);
        }
      } catch (err: any) {
        console.error('Error fetching blog post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, isSaaSBlog, schoolSlugFromUrl, activeLocale]);

  const handleLocaleChange = (newLocale: string) => {
    setActiveLocale(newLocale);
    if (post && post.translations && post.translations.length > 0) {
      const match = post.translations.find((t: any) => t.locale === newLocale);
      if (match && match.slug && match.slug !== slug) {
        navigate(getPostUrl(match.slug));
      }
    }
  };

function extractTextFromChildren(children: any): string {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (typeof children === 'object' && children.props && children.props.children) {
    return extractTextFromChildren(children.props.children);
  }
  return '';
}

function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents (e.g. á -> a)
    .toLowerCase()
    .replace(/[*_`~#]/g, '')
    .replace(/[^a-z0-9\s-]/g, '') // Keep alphanumeric and spaces
    .trim()
    .replace(/\s+/g, '-');
}

  // Extract headings for Table of Contents
  const tableOfContents: HeadingItem[] = useMemo(() => {
    if (!post?.content) return [];
    const lines = post.content.split('\n');
    const headings: HeadingItem[] = [];
    lines.forEach((line: string) => {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);
      if (h2Match) {
        const text = h2Match[1].replace(/[*_`]/g, '').trim();
        const id = slugifyHeading(text);
        if (id) headings.push({ id, text, level: 2 });
      } else if (h3Match) {
        const text = h3Match[1].replace(/[*_`]/g, '').trim();
        const id = slugifyHeading(text);
        if (id) headings.push({ id, text, level: 3 });
      }
    });
    return headings;
  }, [post?.content]);

  // Track active heading on scroll
  useEffect(() => {
    if (tableOfContents.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0% -60% 0%' }
    );

    tableOfContents.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tableOfContents]);

  const handleScrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveHeadingId(id);
      window.history.pushState(null, '', `#${id}`);
    }
  };

  // Base URLs
  const blogRootUrl = schoolSlugFromUrl ? `/colegio/${schoolSlugFromUrl}/blog` : (isSaaSBlog ? '/' : '/blog');
  const getPostUrl = (targetSlug: string) => {
    if (schoolSlugFromUrl) {
      return `/colegio/${schoolSlugFromUrl}/blog/${targetSlug}`;
    }
    if (isSaaSBlog) {
      return `/${targetSlug}`;
    }
    return `/blog/${targetSlug}`;
  };

  const isAiGeneratedImage = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('ai-cover-') ||
      lower.includes('ai-img-') ||
      lower.includes('ai-image-') ||
      lower.includes('ai-generated') ||
      lower.includes('/ai-') ||
      lower.includes('dall-e') ||
      lower.includes('oaidalle') ||
      lower.includes('openai')
    );
  };

  const breadcrumbs = useMemo(() => {
    if (!post) return [];
    const crumbs = [];
    if (post.categories && post.categories.length > 0) {
      crumbs.push({ label: post.categories[0].name });
    }
    crumbs.push({ label: post.title });
    return crumbs;
  }, [post]);

  const t = useMemo(() => getBlogI18n(activeLocale), [activeLocale]);

  const markdownComponents = useMemo(() => {
    const aiIllustrationText = t.aiIllustration;
    return {
      img: ({ node, src, alt, ...props }: any) => {
        const isAi = isAiGeneratedImage(src);
        return (
          <figure className="my-8 space-y-2 group/figure">
            <div 
              onClick={() => src && openLightbox(src, alt)}
              className="rounded-3xl overflow-hidden border border-border bg-muted/20 relative shadow-xs cursor-zoom-in group/imgwrapper"
            >
              <img
                src={src}
                alt={alt || ''}
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover/figure:scale-[1.02]"
                {...props}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/figure:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
            {(alt || isAi) && (
              <figcaption className="text-center text-xs text-stone-500 dark:text-stone-400 italic pt-1 flex items-center justify-center gap-2 flex-wrap">
                {alt && <span>{alt}</span>}
                {isAi && (
                  <span className="inline-flex items-center gap-1 not-italic font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-border/80 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {aiIllustrationText}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        );
      },
    p: ({ node, children, ...props }: any) => (
      <p className="text-stone-800 dark:text-stone-100 leading-relaxed my-4 text-base sm:text-[17.5px]" {...props}>
        {children}
      </p>
    ),
    strong: ({ node, children, ...props }: any) => (
      <strong className="font-bold text-stone-900 dark:text-white" {...props}>
        {children}
      </strong>
    ),
    em: ({ node, children, ...props }: any) => (
      <em className="italic text-stone-800 dark:text-stone-200" {...props}>
        {children}
      </em>
    ),
    ul: ({ node, children, ...props }: any) => (
      <ul className="list-disc list-outside pl-6 my-4 space-y-2 text-stone-800 dark:text-stone-100 text-base sm:text-[17px]" {...props}>
        {children}
      </ul>
    ),
    ol: ({ node, children, ...props }: any) => (
      <ol className="list-decimal list-outside pl-6 my-4 space-y-2 text-stone-800 dark:text-stone-100 text-base sm:text-[17px]" {...props}>
        {children}
      </ol>
    ),
    li: ({ node, children, ...props }: any) => (
      <li className="text-stone-800 dark:text-stone-100 leading-relaxed pl-1" {...props}>
        {children}
      </li>
    ),
    hr: ({ node, ...props }: any) => (
      <hr className="my-8 border-stone-200 dark:border-stone-800" {...props} />
    ),
    h1: ({ node, children, ...props }: any) => {
      const text = extractTextFromChildren(children);
      const id = slugifyHeading(text);
      return (
        <h1
          id={id}
          className="text-2xl sm:text-3xl font-bold font-display text-stone-900 dark:text-slate-50 mt-8 mb-4 border-b border-border/60 pb-2"
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2: ({ node, children, ...props }: any) => {
      const text = extractTextFromChildren(children);
      const id = slugifyHeading(text);
      return (
        <h2
          id={id}
          className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-slate-50 mt-8 mb-4 scroll-mt-28 border-b border-border/60 pb-2"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      const text = extractTextFromChildren(children);
      const id = slugifyHeading(text);
      return (
        <h3
          id={id}
          className="text-lg sm:text-xl font-bold font-display text-stone-900 dark:text-slate-50 mt-6 mb-3 scroll-mt-28"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ node, children, ...props }: any) => (
      <h4 className="text-base sm:text-lg font-bold font-display text-stone-900 dark:text-slate-50 mt-5 mb-2" {...props}>
        {children}
      </h4>
    ),
    h5: ({ node, children, ...props }: any) => (
      <h5 className="text-sm sm:text-base font-bold font-display text-stone-900 dark:text-slate-50 mt-4 mb-2" {...props}>
        {children}
      </h5>
    ),
    h6: ({ node, children, ...props }: any) => (
      <h6 className="text-xs sm:text-sm font-bold font-display uppercase tracking-wider text-stone-700 dark:text-slate-300 mt-3 mb-1" {...props}>
        {children}
      </h6>
    ),
    blockquote: ({ node, ...props }: any) => (
      <blockquote
        className={`border-l-4 ${
          isSaaSBlog ? 'border-[#C4661F] bg-[#C4661F]/10 dark:bg-[#C4661F]/15' : 'border-forest bg-forest/5 dark:bg-forest/15'
        } p-4 rounded-r-2xl my-6 italic text-stone-800 dark:text-stone-100`}
        {...props}
      />
    ),
    a: ({ node, ...props }: any) => (
      <a
        className={`font-semibold underline ${
          isSaaSBlog ? 'text-[#C4661F] dark:text-[#DE7424] hover:text-[#DE7424]' : 'text-forest dark:text-emerald-400 hover:text-emerald-700'
        } transition-colors`}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    table: ({ node, ...props }: any) => (
      <div className="my-8 w-full overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xs shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm m-0 min-w-[480px]" {...props} />
        </div>
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead
        className={`border-b border-border text-xs uppercase tracking-wider font-display font-bold ${
          isSaaSBlog
            ? 'bg-[#C4661F]/10 text-stone-900 dark:text-stone-100'
            : 'bg-forest/10 text-forest dark:text-emerald-300'
        }`}
        {...props}
      />
    ),
    tbody: ({ node, ...props }: any) => (
      <tbody className="divide-y divide-border/60 bg-background/40" {...props} />
    ),
    tr: ({ node, ...props }: any) => (
      <tr className="transition-colors hover:bg-muted/40 even:bg-muted/15" {...props} />
    ),
    th: ({ node, ...props }: any) => (
      <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider align-middle border-b border-border text-stone-900 dark:text-stone-100" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td className="py-3 px-4 text-stone-700 dark:text-stone-200 align-middle text-sm leading-relaxed" {...props} />
    ),
    pre: ({ node, children, ...props }: any) => {
      return <>{children}</>;
    },
    code: ({ node, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const rawCode = String(children).replace(/\n$/, '');

      if (language === 'mermaid') {
        return <MermaidDiagram chart={rawCode} />;
      }

      if (language === 'chat' || language === 'dialogue' || language === 'dialog') {
        const chatMessages = parseChatDialogue(rawCode);
        if (chatMessages) {
          return <ChatRenderer messages={chatMessages} isSaaSBlog={isSaaSBlog} />;
        }
      }

      const parsedBoxTable = parseBoxTable(rawCode);
      if (parsedBoxTable) {
        return <AsciiTableRenderer data={parsedBoxTable} isSaaSBlog={isSaaSBlog} />;
      }

      const isInline = !match && !rawCode.includes('\n');
      if (isInline) {
        return (
          <span className="px-1.5 py-0.5 rounded-md bg-muted/70 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-[0.9em] font-medium border border-border/40" {...props}>
            {children}
          </span>
        );
      }

      return (
        <div className="my-6 rounded-2xl border border-border/80 bg-muted/30 dark:bg-stone-900 p-4 sm:p-5 overflow-x-auto text-stone-900 dark:text-stone-100 text-sm leading-relaxed shadow-2xs">
          {children}
        </div>
      );
    }
  };
}, [isSaaSBlog, activeLocale, t]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (rawMarkdown) {
    return (
      <pre className="font-mono text-xs sm:text-sm p-6 sm:p-10 whitespace-pre-wrap break-words bg-[#121c13] text-[#e0e7e1] min-h-screen selection:bg-[#C4661F]">
        {rawMarkdown}
      </pre>
    );
  }

  return (
    <div className="blog-root font-bricolage min-h-screen bg-[#faf9f5] dark:bg-[#0c140e] text-foreground flex flex-col selection:bg-[#C4661F] selection:text-white">
      {/* Dynamic SEO Meta Injection */}
      {post && (
        <BlogMetaSEO
          title={post.metaTitle || post.title}
          description={post.metaDescription || post.excerpt}
          url={currentUrl}
          image={post.coverImage}
          publishedTime={post.publishedAt || post.createdAt}
          modifiedTime={post.updatedAt || post.createdAt}
          authorName={post.author?.fullName}
          authorJobTitle={post.author?.jobTitle}
          schoolName={post.school?.name || schoolName}
          schoolLogo={post.school?.logoUrl || schoolLogo}
          keywords={post.tags?.map((t: any) => t.name)}
          isSaaSBlog={isSaaSBlog}
        />
      )}

      {/* Unified Blog Header matching Index */}
      <BlogNavbar
        isSaaSBlog={isSaaSBlog}
        schoolSlug={schoolSlugFromUrl}
        activeLocale={activeLocale}
        onLocaleChange={handleLocaleChange}
        scrollProgress={scrollProgress}
        breadcrumbs={breadcrumbs}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {loading ? (
          /* Smooth Skeleton Loader preventing visual jumps */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-pulse">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-6 w-32 bg-stone-200 dark:bg-slate-800 rounded-full" />
              <div className="h-12 w-4/5 bg-stone-200 dark:bg-slate-800 rounded-2xl" />
              <div className="h-6 w-1/2 bg-stone-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-96 w-full bg-stone-200 dark:bg-slate-800 rounded-3xl" />
              <div className="space-y-3 pt-4">
                <div className="h-4 w-full bg-stone-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-full bg-stone-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-3/4 bg-stone-200 dark:bg-slate-800 rounded-md" />
              </div>
            </div>
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              <div className="h-48 bg-stone-200 dark:bg-slate-800 rounded-3xl" />
              <div className="h-64 bg-stone-200 dark:bg-slate-800 rounded-3xl" />
            </div>
          </div>
        ) : !post ? (
          /* Not Found State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground">Artículo no encontrado</h2>
            <p className="text-xs text-muted-foreground">
              El artículo que buscas ha sido removido o el enlace no es válido.
            </p>
            <Link
              to={blogRootUrl}
              className={`px-5 py-2.5 text-xs font-bold ${
                isSaaSBlog ? 'bg-[#C4661F] text-white hover:bg-[#DE7424]' : 'bg-forest text-white'
              } ${btnRadiusClass} inline-flex items-center gap-2 shadow-xs transition-all`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToHome}</span>
            </Link>
          </div>
        ) : (
          /* Full Article Magazine View */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
          >
            {/* Left Main Article Column */}
            <article 
              itemScope 
              itemType="https://schema.org/BlogPosting" 
              className="lg:col-span-8 space-y-8 min-w-0"
            >
              {/* Back to Blog quick link */}
              <div className="flex items-center justify-between gap-4">
                <Link
                  to={blogRootUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors group cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>{t.backToAll}</span>
                </Link>
              </div>

              {/* Title & Metadata Header */}
              <div className="space-y-4">
                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((c: any) => (
                      <span
                        key={c.id}
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          isSaaSBlog ? 'text-[#C4661F] bg-[#C4661F]/10' : 'text-forest bg-forest/10'
                        }`}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}

                <h1 
                  itemProp="headline"
                  className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-bold font-display text-stone-900 dark:text-slate-100 leading-[1.2] tracking-tight"
                >
                  {post.title}
                </h1>

                {/* Excerpt Lead */}
                {post.excerpt && (
                  <p 
                    itemProp="description"
                    className={`text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed italic border-l-3 ${
                      isSaaSBlog ? 'border-[#C4661F]' : 'border-forest'
                    } pl-4 py-0.5`}
                  >
                    {post.excerpt}
                  </p>
                )}

                {/* Author Info & Date */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div 
                    itemProp="author" 
                    itemScope 
                    itemType="https://schema.org/Person" 
                    className="flex items-center gap-3"
                  >
                    {post.author?.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.fullName}
                        width={40}
                        height={40}
                        loading="eager"
                        decoding="async"
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${
                        isSaaSBlog ? 'bg-[#C4661F]/10 text-[#C4661F]' : 'bg-forest/10 text-forest'
                      } flex items-center justify-center font-bold text-sm`}>
                        {post.author?.fullName?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div>
                      <span itemProp="name" className="font-bold text-stone-900 dark:text-slate-100 block text-sm">{post.author?.fullName || 'Equipo Pedagógico'}</span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">{post.author?.jobTitle || 'Guía Montessori'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {post.readingTimeMinutes} {t.minRead}
                    </span>
                    <time 
                      itemProp="datePublished" 
                      dateTime={(post.publishedAt || post.createdAt).toString()} 
                      className="flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString(t.dateLocale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </time>
                  </div>
                </div>
              </div>

              {/* Cover Image (Full width, natural proportional height with Lightbox Zoom) */}
              {post.coverImage && (
                <figure className="space-y-2 group/figure">
                  <div 
                    onClick={() => openLightbox(post.coverImage, post.coverImageAlt || post.title)}
                    className="rounded-3xl overflow-hidden border border-border shadow-xs bg-muted/20 relative group/hero cursor-zoom-in"
                  >
                    <img
                      src={post.coverImage}
                      alt={post.coverImageAlt || post.title}
                      loading="eager"
                      decoding="async"
                      {...{ fetchpriority: 'high' }}
                      className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover/hero:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                  {(post.coverImageAlt || isAiGeneratedImage(post.coverImage)) && (
                    <figcaption className="text-center text-xs text-stone-500 dark:text-stone-400 italic pt-1 flex items-center justify-center gap-2 flex-wrap">
                      {post.coverImageAlt && <span>{post.coverImageAlt}</span>}
                      {isAiGeneratedImage(post.coverImage) && (
                        <span className="inline-flex items-center gap-1 not-italic font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-border/80 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {t.aiIllustration}
                        </span>
                      )}
                    </figcaption>
                  )}
                </figure>
              )}

              {/* In-Article Top Social Share Bar */}
              <SocialShareBar
                title={post.title}
                url={currentUrl}
                isSaaSBlog={isSaaSBlog}
              />

              {/* Markdown Content Body with Clean Typography */}
              <div 
                itemProp="articleBody"
                className="prose prose-stone dark:prose-invert max-w-none text-stone-800 dark:text-stone-100 text-base sm:text-[17px] leading-relaxed space-y-5 pt-2"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {post.content || ''}
                </ReactMarkdown>
              </div>

              {/* Tags Section */}
              {post.tags && post.tags.length > 0 && (
                <div className="pt-6 border-t border-border flex items-center gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  {post.tags.map((t: any) => (
                    <span key={t.id} className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* In-Article Bottom Social Share Bar */}
              <SocialShareBar
                title={post.title}
                url={currentUrl}
                isSaaSBlog={isSaaSBlog}
              />

              {/* Author Bio Box */}
              {post.author && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-card border border-border shadow-xs flex flex-col sm:flex-row items-start gap-5">
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.fullName}
                      className="w-14 h-14 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-full ${
                      isSaaSBlog ? 'bg-[#C4661F]/10 text-[#C4661F]' : 'bg-forest/10 text-forest'
                    } flex items-center justify-center font-bold text-lg shrink-0`}>
                      {post.author.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{t.aboutAuthor}</span>
                    <h4 className="text-base font-bold text-stone-900 dark:text-slate-100">{post.author.fullName}</h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {post.author.bio || 'Especialista en educación infantil, desarrollo socioemocional y metodología Montessori aplicada.'}
                    </p>
                  </div>
                </div>
              )}
            </article>

            {/* Right Sticky Rail (Desktop) */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="sticky top-20 space-y-6">
                {/* Table of Contents Widget */}
                {tableOfContents.length > 0 && (
                  <div className="p-5 rounded-3xl bg-white dark:bg-card border border-border shadow-xs space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-[#C4661F]" />
                      <span>{t.toc}</span>
                    </h4>
                    <nav className="space-y-1 text-xs">
                      {tableOfContents.map((h, i) => {
                        const isActive = activeHeadingId === h.id;
                        return (
                          <a
                            key={i}
                            href={`#${h.id}`}
                            onClick={(e) => handleScrollToHeading(e, h.id)}
                            className={`block py-1.5 px-2 rounded-lg transition-all truncate cursor-pointer ${
                              isActive
                                ? (isSaaSBlog ? 'bg-[#C4661F]/10 text-[#C4661F] font-bold' : 'bg-forest/10 text-forest font-bold')
                                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-muted/50'
                            } ${
                              h.level === 3 ? 'pl-4 text-[11px]' : 'text-xs'
                            }`}
                          >
                            {h.text}
                          </a>
                        );
                      })}
                    </nav>
                  </div>
                )}

                {/* Related Posts Widget */}
                {post.relatedPosts && post.relatedPosts.length > 0 && (
                  <div className="p-5 rounded-3xl bg-white dark:bg-card border border-border shadow-xs space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      {t.relatedReads}
                    </h4>
                    <div className="space-y-3">
                      {post.relatedPosts.map((rel: any) => (
                        <Link
                          key={rel.id}
                          to={getPostUrl(rel.slug)}
                          className="block group p-2.5 rounded-2xl hover:bg-muted/50 transition-colors"
                        >
                          <h5 className={`text-xs font-bold text-stone-900 dark:text-[#DE7424] ${
                            isSaaSBlog ? 'group-hover:text-[#C4661F] dark:group-hover:text-[#FFA05C]' : 'group-hover:text-forest dark:group-hover:text-emerald-400'
                          } transition-colors line-clamp-2 leading-snug`}>
                            {rel.title}
                          </h5>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono mt-1 flex items-center justify-between">
                            <span>{rel.readingTimeMinutes} {t.minRead}</span>
                            <span className={`${isSaaSBlog ? 'text-[#C4661F]' : 'text-forest'} font-bold`}>{t.readMore}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contextual CTA Card */}
                <div className={`p-6 rounded-3xl ${
                  isSaaSBlog ? 'bg-[#162218] border border-stone-800' : 'bg-forest'
                } text-white space-y-3 shadow-md`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C4661F] font-mono block">
                    {isSaaSBlog ? 'MontessoriNexus' : 'Comunidad Escolar'}
                  </span>
                  <h4 className="text-base font-bold font-display leading-tight">
                    {isSaaSBlog
                      ? 'Transforma la gestión de tu colegio Montessori'
                      : `Conoce los ambientes de ${schoolName}`}
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {isSaaSBlog
                      ? 'Herramienta integral para observación pedagógica, admisiones y comunicación familiar.'
                      : 'Agenda una visita guiada para ver a los niños trabajando con plena concentración.'}
                  </p>
                  <a
                    href={isSaaSBlog ? getPlatformHomeUrl() : (schoolSlugFromUrl ? `/colegio/${schoolSlugFromUrl}#contacto` : '/#contacto')}
                    className={`block w-full py-2.5 text-center text-xs font-bold ${
                      isSaaSBlog ? 'bg-[#C4661F] hover:bg-[#DE7424] text-white' : 'bg-white text-forest hover:bg-emerald-50'
                    } ${btnRadiusClass} transition-all shadow-xs`}
                  >
                    {isSaaSBlog ? 'Conoce más sobre MontessoriNexus' : 'Solicitar Información'}
                  </a>
                </div>
              </div>
            </aside>
          </motion.div>
        )}
      </main>

      {/* Related & Latest Articles Carousel Section */}
      {post && post.relatedPosts && post.relatedPosts.length > 0 && (
        <section className="w-full border-t border-border/80 bg-stone-100/60 dark:bg-stone-900/40 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with Title and Nav Controls */}
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${isSaaSBlog ? 'bg-[#C4661F]' : 'bg-forest'} animate-pulse`} />
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {t.relatedReads}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                  {t.relatedSectionTitle}
                </h3>
              </div>

              {/* Navigation Arrow Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  className="h-10 w-10 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs active:scale-95"
                  aria-label="Desplazar a la izquierda"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  className="h-10 w-10 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs active:scale-95"
                  aria-label="Desplazar a la derecha"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Cards Container with CSS Snap */}
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {post.relatedPosts.map((rel: any) => (
                <Link
                  key={rel.id}
                  to={getPostUrl(rel.slug)}
                  className={`group/card min-w-[280px] sm:min-w-[320px] md:min-w-[350px] max-w-[360px] snap-start shrink-0 rounded-3xl bg-card border border-border/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1 ${
                    isSaaSBlog ? 'hover:border-[#C4661F]/40' : 'hover:border-forest/40'
                  }`}
                >
                  {/* Card Cover Image */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-muted/30">
                    {rel.coverImage ? (
                      <img
                        src={rel.coverImage}
                        alt={rel.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/40 text-muted-foreground">
                        <BookOpen className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    {/* Category Tag pill */}
                    {rel.categories && rel.categories.length > 0 && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-md shadow-xs ${
                          isSaaSBlog
                            ? 'bg-[#C4661F]/90 text-white'
                            : 'bg-forest/90 text-white'
                        }`}>
                          {rel.categories[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {rel.readingTimeMinutes || 3} {t.minRead}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(rel.publishedAt).toLocaleDateString(t.dateLocale, {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>

                      <h4 className={`text-base font-bold font-display text-foreground leading-snug line-clamp-2 ${
                        isSaaSBlog ? 'group-hover/card:text-[#C4661F]' : 'group-hover/card:text-forest'
                      } transition-colors`}>
                        {rel.title}
                      </h4>

                      {rel.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {rel.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Author & Read more link */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {rel.author?.avatarUrl ? (
                          <img
                            src={rel.author.avatarUrl}
                            alt={rel.author.fullName}
                            className="w-6 h-6 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full ${
                            isSaaSBlog ? 'bg-[#C4661F]/10 text-[#C4661F]' : 'bg-forest/10 text-forest'
                          } flex items-center justify-center text-[10px] font-bold`}>
                            {rel.author?.fullName?.charAt(0) || 'A'}
                          </div>
                        )}
                        <span className="text-stone-700 dark:text-stone-300 font-medium truncate max-w-[130px]">
                          {rel.author?.fullName || 'Equipo Pedagógico'}
                        </span>
                      </div>

                      <span className={`font-bold flex items-center gap-1 text-xs ${
                        isSaaSBlog ? 'text-[#C4661F]' : 'text-forest'
                      }`}>
                        {t.readMore} <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BigFooter matching landing page with ChambaPro credits */}
      <BlogFooter
        isSaaSBlog={isSaaSBlog}
        schoolName={schoolName}
        schoolSlug={schoolSlugFromUrl}
      />

      {/* High-Resolution Responsive Image Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeLightbox();
              }
            }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none"
          >
            {/* Top Bar with Close Button */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={closeLightbox}
                className="h-10 w-10 p-0 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg border border-white/20 hover:scale-105"
                title="Cerrar imagen (ESC / Atrás)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Centered Image with Smooth Zoom-in Animation */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[95vw] max-h-[88vh] flex flex-col items-center justify-center relative"
            >
              <img
                src={lightboxImage.src}
                alt={lightboxImage.alt || t.expandedView}
                className="max-w-[95vw] max-h-[82vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              {(lightboxImage.alt || isAiGeneratedImage(lightboxImage.src)) && (
                <div className="mt-3 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white/90 text-xs sm:text-sm text-center max-w-xl border border-white/10 flex items-center justify-center gap-2 flex-wrap">
                  {lightboxImage.alt && <span>{lightboxImage.alt}</span>}
                  {isAiGeneratedImage(lightboxImage.src) && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-300">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {t.aiIllustration}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
