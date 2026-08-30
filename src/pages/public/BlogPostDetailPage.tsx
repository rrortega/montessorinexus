import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSiteSettings, getButtonRadiusClass } from '@/context/SettingsContext';
import {
  BookOpen, Clock, Calendar, ArrowLeft, Share2, Tag, Folder,
  CheckCircle2, Sparkles, User as UserIcon, Copy, Check, MessageCircle,
  ExternalLink, ChevronRight, ListOrdered, ArrowUpRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogNavbar } from '@/components/blog/BlogNavbar';
import { BlogMetaSEO } from '@/components/blog/BlogMetaSEO';
import { SocialShareBar } from '@/components/blog/SocialShareBar';
import { BlogFooter } from '@/components/blog/BlogFooter';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export const BlogPostDetailPage: React.FC = () => {
  const { slug, schoolSlug: schoolSlugFromUrl } = useParams<{ slug: string; schoolSlug?: string }>();
  const { isPlatformRoot, schoolName, schoolLogo, buttonRadius } = useSiteSettings();
  const btnRadiusClass = getButtonRadiusClass(buttonRadius);
  const navigate = useNavigate();

  const isSaaSBlog = isPlatformRoot || window.location.hostname.startsWith('blog.');

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeLocale, setActiveLocale] = useState<string>('es');
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // Scroll Progress listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
      setActiveHeadingId(id);
    }
  };

  // Fetch Post Detail
  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const headers: Record<string, string> = {
          'x-locale': activeLocale,
        };
        if (isSaaSBlog) {
          headers['x-is-platform'] = 'true';
        } else if (schoolSlugFromUrl) {
          headers['x-school-slug'] = schoolSlugFromUrl;
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
  }, [slug, isSaaSBlog, schoolSlugFromUrl]);

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

  // Base URLs
  const blogRootUrl = schoolSlugFromUrl ? `/colegio/${schoolSlugFromUrl}/blog` : '/blog';
  const getPostUrl = (targetSlug: string) => {
    if (schoolSlugFromUrl) {
      return `/colegio/${schoolSlugFromUrl}/blog/${targetSlug}`;
    }
    return `/blog/${targetSlug}`;
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

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0c140e] text-foreground flex flex-col selection:bg-[#C4661F] selection:text-white">
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
              <span>Volver a la portada del Blog</span>
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
            <article className="lg:col-span-8 space-y-8 min-w-0">
              {/* Back to Blog quick link */}
              <div>
                <Link
                  to={blogRootUrl}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground ${
                    isSaaSBlog ? 'hover:text-[#C4661F]' : 'hover:text-forest'
                  } transition-colors`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a todas las publicaciones</span>
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

                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-bold font-display text-foreground leading-[1.2] tracking-tight">
                  {post.title}
                </h1>

                {/* Excerpt Lead */}
                {post.excerpt && (
                  <p className={`text-base sm:text-lg text-muted-foreground leading-relaxed italic border-l-3 ${
                    isSaaSBlog ? 'border-[#C4661F]' : 'border-forest'
                  } pl-4 py-0.5`}>
                    {post.excerpt}
                  </p>
                )}

                {/* Author Info & Date */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
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
                      <span className="font-bold text-foreground block text-sm">{post.author?.fullName || 'Equipo Pedagógico'}</span>
                      <span className="text-[11px] text-muted-foreground">{post.author?.jobTitle || 'Guía Montessori'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {post.readingTimeMinutes} min de lectura
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cover Image (LCP element - eager with high priority & aspect-ratio container) */}
              {post.coverImage && (
                <div className="rounded-3xl overflow-hidden border border-border shadow-xs bg-muted/40 relative aspect-video sm:aspect-[21/9] max-h-[520px]">
                  <img
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="w-full h-full object-cover"
                  />
                  {post.coverImageAlt && (
                    <p className="text-[11px] text-muted-foreground text-center py-2 px-4 bg-muted/20 border-t border-border">
                      {post.coverImageAlt}
                    </p>
                  )}
                </div>
              )}

              {/* In-Article Top Social Share Bar */}
              <SocialShareBar
                title={post.title}
                url={currentUrl}
                isSaaSBlog={isSaaSBlog}
              />

              {/* Markdown Content Body with Clean Typography */}
              <div className="prose prose-stone dark:prose-invert max-w-none text-foreground text-base sm:text-[17px] leading-relaxed space-y-5 pt-2">
                <ReactMarkdown
                  components={{
                    img: ({ node, src, alt, ...props }) => (
                      <figure className="my-6 space-y-2">
                        <div className="rounded-2xl overflow-hidden border border-border bg-muted/30 aspect-video flex items-center justify-center">
                          <img
                            src={src}
                            alt={alt || ''}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            {...props}
                          />
                        </div>
                        {alt && <figcaption className="text-center text-xs text-muted-foreground italic">{alt}</figcaption>}
                      </figure>
                    ),
                    h2: ({ node, children, ...props }) => {
                      const text = extractTextFromChildren(children);
                      const id = slugifyHeading(text);
                      return (
                        <h2
                          id={id}
                          className="text-xl sm:text-2xl font-bold font-display text-foreground mt-8 mb-4 scroll-mt-28 border-b border-border/60 pb-2"
                          {...props}
                        >
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ node, children, ...props }) => {
                      const text = extractTextFromChildren(children);
                      const id = slugifyHeading(text);
                      return (
                        <h3
                          id={id}
                          className="text-lg sm:text-xl font-bold font-display text-foreground mt-6 mb-3 scroll-mt-28"
                          {...props}
                        >
                          {children}
                        </h3>
                      );
                    },
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className={`border-l-4 ${
                          isSaaSBlog ? 'border-[#C4661F] bg-[#C4661F]/5' : 'border-forest bg-forest/5'
                        } p-4 rounded-r-2xl my-6 italic text-stone-800 dark:text-stone-200`}
                        {...props}
                      />
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        className={`font-semibold underline ${
                          isSaaSBlog ? 'text-[#C4661F] hover:text-[#DE7424]' : 'text-forest hover:text-emerald-700'
                        } transition-colors`}
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    )
                  }}
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
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sobre el autor</span>
                    <h4 className="text-base font-bold text-foreground">{post.author.fullName}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
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
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-[#C4661F]" />
                      <span>Índice del Artículo</span>
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
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                      Lecturas Recomendadas
                    </h4>
                    <div className="space-y-3">
                      {post.relatedPosts.map((rel: any) => (
                        <Link
                          key={rel.id}
                          to={getPostUrl(rel.slug)}
                          className="block group p-2.5 rounded-2xl hover:bg-muted/50 transition-colors"
                        >
                          <h5 className={`text-xs font-bold text-foreground ${
                            isSaaSBlog ? 'group-hover:text-[#C4661F]' : 'group-hover:text-forest'
                          } transition-colors line-clamp-2 leading-snug`}>
                            {rel.title}
                          </h5>
                          <span className="text-[10px] text-muted-foreground font-mono mt-1 flex items-center justify-between">
                            <span>{rel.readingTimeMinutes} min</span>
                            <span className={`${isSaaSBlog ? 'text-[#C4661F]' : 'text-forest'} font-bold`}>Leer →</span>
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
                    href={isSaaSBlog ? '/' : (schoolSlugFromUrl ? `/colegio/${schoolSlugFromUrl}#contacto` : '/#contacto')}
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

      {/* BigFooter matching landing page with ChambaPro credits */}
      <BlogFooter
        isSaaSBlog={isSaaSBlog}
        schoolName={schoolName}
        schoolSlug={schoolSlugFromUrl}
      />
    </div>
  );
};
