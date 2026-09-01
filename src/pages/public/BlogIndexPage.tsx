import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSiteSettings, getButtonRadiusClass } from '@/context/SettingsContext';
import {
  BookOpen, Search, Clock, Calendar, Eye, ArrowRight, Sparkles, Tag,
  Folder, ChevronRight, ChevronLeft, User as UserIcon, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogNavbar } from '@/components/blog/BlogNavbar';
import { BlogFooter } from '@/components/blog/BlogFooter';
import { CategoryScrollNav } from '@/components/blog/CategoryScrollNav';
import { useBlogProtection } from '@/hooks/useBlogProtection';

export interface PublicBlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  coverImageAlt?: string;
  readingTimeMinutes: number;
  viewsCount: number;
  publishedAt: string;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
  author?: { fullName: string; jobTitle?: string; avatarUrl?: string };
}

export interface PublicBlogCategoryItem {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export const BlogIndexPage: React.FC = () => {
  useBlogProtection();

  const { schoolSlug: schoolSlugFromUrl } = useParams<{ schoolSlug?: string }>();
  const { isPlatformRoot, schoolName, schoolLogo, buttonRadius } = useSiteSettings();
  const btnRadiusClass = getButtonRadiusClass(buttonRadius);

  const isSaaSBlog = isPlatformRoot || window.location.hostname.startsWith('blog.');

  const [posts, setPosts] = useState<PublicBlogPostItem[]>([]);
  const [categories, setCategories] = useState<PublicBlogCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLocale, setActiveLocale] = useState<string>('es');
  const [loading, setLoading] = useState<boolean>(true);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);

  // Pagination state (18 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPosts, setTotalPosts] = useState<number>(0);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, activeLocale]);

  useEffect(() => {
    const fetchBlogData = async () => {
      const isMdRequest = typeof window !== 'undefined' && (
        window.location.pathname.endsWith('.md') || 
        window.location.pathname.endsWith('/llms.txt') || 
        window.location.pathname === '/llms.txt'
      );

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

        if (isMdRequest) {
          const mdRes = await fetch('/api/blog/index.md', { headers });
          if (mdRes.ok) {
            const mdText = await mdRes.text();
            setRawMarkdown(mdText);
            return;
          }
        }

        const params = new URLSearchParams();
        params.append('page', String(currentPage));
        params.append('limit', '18');

        if (selectedCategory !== 'ALL') {
          params.append('category', selectedCategory);
        }
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        const url = `/api/blog/posts${params.toString() ? `?${params.toString()}` : ''}`;

        const [postsRes, catRes] = await Promise.all([
          fetch(url, { headers }),
          fetch(`/api/blog/categories`, { headers })
        ]);

        if (postsRes.ok) {
          const data = await postsRes.json();
          setPosts(data.data || []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalPosts(data.pagination.total || 0);
          }
        }

        if (catRes.ok) {
          const cats: PublicBlogCategoryItem[] = await catRes.json();
          setCategories((cats || []).filter(c => (c.postCount || 0) > 0));
        }
      } catch (err) {
        console.error('Error fetching blog data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [selectedCategory, searchQuery, activeLocale, isSaaSBlog, schoolSlugFromUrl, currentPage]);

  const indexMdUrl = useMemo(() => {
    if (schoolSlugFromUrl) {
      return `/colegio/${schoolSlugFromUrl}/blog/index.md`;
    }
    if (isSaaSBlog) {
      return `/index.md`;
    }
    return `/blog/index.md`;
  }, [schoolSlugFromUrl, isSaaSBlog]);

  useEffect(() => {
    const siteBrand = isSaaSBlog ? 'MontessoriNexus Blog' : schoolName;
    document.title = `Blog Oficial • ${siteBrand}`;

    let alternateMd = document.querySelector('link[type="text/markdown"]') as HTMLLinkElement;
    if (!alternateMd) {
      alternateMd = document.createElement('link');
      alternateMd.setAttribute('rel', 'alternate');
      alternateMd.setAttribute('type', 'text/markdown');
      alternateMd.setAttribute('title', 'Índice de artículos en Markdown para LLMs y Agentes');
      document.head.appendChild(alternateMd);
    }
    const fullMdUrl = `${window.location.origin}${indexMdUrl}`;
    alternateMd.setAttribute('href', fullMdUrl);

    let llmsMeta = document.querySelector('meta[name="llms-read-url"]') as HTMLMetaElement;
    if (!llmsMeta) {
      llmsMeta = document.createElement('meta');
      llmsMeta.setAttribute('name', 'llms-read-url');
      document.head.appendChild(llmsMeta);
    }
    llmsMeta.setAttribute('content', fullMdUrl);
  }, [isSaaSBlog, schoolName, indexMdUrl]);

  // Featured and regular posts
  const featuredPost = useMemo(() => {
    return posts.find(p => Boolean((p as any).isFeatured)) || null;
  }, [posts]);

  const regularPosts = useMemo(() => {
    if (!featuredPost) return posts;
    return posts.filter(p => p.id !== featuredPost.id);
  }, [posts, featuredPost]);

  const getPostDetailUrl = (postSlug: string) => {
    if (schoolSlugFromUrl) {
      return `/colegio/${schoolSlugFromUrl}/blog/${postSlug}`;
    }
    if (isSaaSBlog) {
      return `/${postSlug}`;
    }
    return `/blog/${postSlug}`;
  };

  if (rawMarkdown) {
    return (
      <pre className="font-mono text-xs sm:text-sm p-6 sm:p-10 whitespace-pre-wrap break-words bg-[#121c13] text-[#e0e7e1] min-h-screen selection:bg-[#C4661F]">
        {rawMarkdown}
      </pre>
    );
  }

  return (
    <div className="blog-root font-bricolage min-h-screen bg-[#faf9f5] dark:bg-[#0c140e] text-foreground flex flex-col selection:bg-[#C4661F] selection:text-white">
      {/* Unified Blog Header */}
      <BlogNavbar
        isSaaSBlog={isSaaSBlog}
        schoolSlug={schoolSlugFromUrl}
        activeLocale={activeLocale}
        onLocaleChange={setActiveLocale}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14 border-b border-border/50 bg-gradient-to-b from-white/60 to-transparent dark:from-card/40">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4"
        >
          <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider uppercase ${
            isSaaSBlog ? 'bg-[#C4661F]/10 text-[#C4661F]' : 'bg-forest/10 text-forest'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reflexiones, Ciencia & Filosofía Montessori</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-stone-900 dark:text-slate-100 max-w-3xl mx-auto leading-tight">
            {isSaaSBlog
              ? 'Conocimiento para transformar la educación del futuro'
              : `Descubre la vida y el aprendizaje en ${schoolName}`}
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
            {isSaaSBlog
              ? 'Artículos, guías pedagógicas y herramientas para líderes escolares y familias comprometidas con el desarrollo del niño.'
              : 'Lecturas diseñadas por nuestras guías para acompañar el desarrollo natural, la autonomía y la creatividad en cada etapa.'}
          </p>

          {/* Search Box */}
          <div className="max-w-lg mx-auto pt-4">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar temas, autonomía, límites, materiales..."
                className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#152418] border border-stone-200 dark:border-stone-700/80 shadow-xs rounded-2xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-400 focus:outline-none focus:ring-2 ${
                  isSaaSBlog ? 'focus:ring-[#C4661F] dark:focus:ring-[#C4661F]' : 'focus:ring-forest dark:focus:ring-forest'
                }`}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Category Pills with Invisible Scroll & Nav Handlers */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <CategoryScrollNav
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isSaaSBlog={isSaaSBlog}
            />
          </motion.div>
        )}

        {/* Loading Skeleton vs Content */}
        {loading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-80 bg-stone-200 dark:bg-slate-800 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-stone-200 dark:bg-slate-800 rounded-3xl" />
              <div className="h-64 bg-stone-200 dark:bg-slate-800 rounded-3xl" />
              <div className="h-64 bg-stone-200 dark:bg-slate-800 rounded-3xl" />
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white dark:bg-card rounded-3xl border border-border p-8">
            <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No se encontraron artículos</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No hay publicaciones disponibles con los filtros seleccionados actualmente.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Featured Post Hero */}
            {featuredPost && (
              <div className="bg-white dark:bg-card rounded-3xl border border-border overflow-hidden shadow-xs hover:shadow-md transition-all group">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {featuredPost.coverImage && (
                    <div className="lg:col-span-7 h-64 sm:h-72 lg:h-auto min-h-[260px] overflow-hidden relative bg-muted/40">
                      <img
                        src={featuredPost.coverImage}
                        alt={featuredPost.coverImageAlt || featuredPost.title}
                        loading="eager"
                        decoding="async"
                        {...{ fetchpriority: 'high' }}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 group-hover:rotate-[0.3deg]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className={`absolute top-4 left-4 ${isSaaSBlog ? 'bg-[#C4661F]' : 'bg-forest'} text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-md z-10`}>
                        ★ Destacado
                      </div>
                    </div>
                  )}

                  <div className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-4 ${
                    featuredPost.coverImage ? 'lg:col-span-5' : 'lg:col-span-12'
                  }`}>
                    <div className="space-y-3">
                      {featuredPost.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {featuredPost.categories.map(c => (
                            <span key={c.id} className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                              isSaaSBlog ? 'text-[#C4661F] bg-[#C4661F]/10' : 'text-forest bg-forest/10'
                            }`}>
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold font-display text-stone-900 dark:text-slate-100 leading-snug ${
                        isSaaSBlog ? 'group-hover:text-[#C4661F] dark:group-hover:text-[#FFA05C]' : 'group-hover:text-forest dark:group-hover:text-emerald-400'
                      } transition-colors`}>
                        <Link to={getPostDetailUrl(featuredPost.slug)}>
                          {featuredPost.title}
                        </Link>
                      </h2>

                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                      <div className="flex items-center gap-2.5">
                        {featuredPost.author?.avatarUrl ? (
                          <img
                            src={featuredPost.author.avatarUrl}
                            alt={featuredPost.author.fullName}
                            width={32}
                            height={32}
                            loading="lazy"
                            decoding="async"
                            className="w-8 h-8 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full ${
                            isSaaSBlog ? 'bg-[#C4661F]/10 text-[#C4661F]' : 'bg-forest/10 text-forest'
                          } flex items-center justify-center font-bold text-xs`}>
                            {featuredPost.author?.fullName?.charAt(0) || 'A'}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-stone-900 dark:text-slate-100">{featuredPost.author?.fullName || 'Equipo Montessori'}</span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">{featuredPost.author?.jobTitle || 'Guía Montessori'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{featuredPost.readingTimeMinutes} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Posts Grid */}
            {regularPosts.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-base font-bold font-display text-stone-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Todas las Publicaciones</span>
                  <span className="text-xs font-normal text-stone-500 dark:text-stone-400 font-mono">({regularPosts.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map(post => (
                    <article
                      key={post.id}
                      className="bg-white dark:bg-card rounded-3xl border border-border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {post.coverImage ? (
                          <Link to={getPostDetailUrl(post.slug)} className="block aspect-video overflow-hidden bg-muted/40 relative">
                            <img
                              src={post.coverImage}
                              alt={post.coverImageAlt || post.title}
                              loading="lazy"
                              decoding="async"
                              {...{ fetchpriority: 'low' }}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-[0.4deg]"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />
                          </Link>
                        ) : (
                          <div className={`aspect-video ${isSaaSBlog ? 'bg-[#C4661F]/5 text-[#C4661F]/30' : 'bg-forest/5 text-forest/30'} flex items-center justify-center`}>
                            <BookOpen className="w-10 h-10" />
                          </div>
                        )}

                        <div className="p-5 space-y-2.5">
                          {post.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {post.categories.map(c => (
                                <span
                                  key={c.id}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    isSaaSBlog ? 'text-[#C4661F] bg-[#C4661F]/10' : 'text-forest bg-forest/10'
                                  }`}
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <h4 className={`text-base font-bold font-display text-stone-900 dark:text-slate-100 line-clamp-2 ${
                            isSaaSBlog ? 'group-hover:text-[#C4661F] dark:group-hover:text-[#FFA05C]' : 'group-hover:text-forest dark:group-hover:text-emerald-400'
                          } transition-colors leading-snug`}>
                            <Link to={getPostDetailUrl(post.slug)}>
                              {post.title}
                            </Link>
                          </h4>

                          <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 border-t border-border/60 mt-2 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span className="font-semibold text-stone-900 dark:text-slate-100">
                          {post.author?.fullName || 'Equipo Montessori'}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-stone-500 dark:text-stone-400">
                          <Clock className="w-3.5 h-3.5" /> {post.readingTimeMinutes} min
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination Controls (18 items per page) */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60">
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      Mostrando página <span className="font-semibold text-stone-900 dark:text-slate-100">{currentPage}</span> de <span className="font-semibold text-stone-900 dark:text-slate-100">{totalPages}</span> ({totalPosts} artículos en total)
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(p => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-xs font-semibold text-stone-700 dark:text-slate-200 hover:text-stone-900 dark:hover:text-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Anterior</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                          const isCurrent = page === currentPage;
                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isCurrent
                                  ? (isSaaSBlog ? 'bg-[#C4661F] text-white shadow-xs' : 'bg-forest text-white shadow-xs')
                                  : 'bg-white dark:bg-card border border-border text-stone-600 dark:text-stone-300 hover:bg-muted hover:text-stone-900 dark:hover:text-white'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(p => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-xl border border-border bg-white dark:bg-card text-xs font-semibold text-stone-700 dark:text-slate-200 hover:text-stone-900 dark:hover:text-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Contextual CTA Box */}
        <div className={`rounded-3xl ${
          isSaaSBlog ? 'bg-[#162218] border border-stone-800' : 'bg-forest'
        } text-white p-8 sm:p-12 relative overflow-hidden shadow-lg space-y-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6`}>
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C4661F] font-mono">
              {isSaaSBlog ? 'MontessoriNexus Software' : 'Comunidad Educativa'}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-display leading-tight">
              {isSaaSBlog
                ? 'Digitaliza la gestión pedagógica y administrativa de tu colegio'
                : `¿Te gustaría conocer los salones y ambientes de ${schoolName}?`}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {isSaaSBlog
                ? 'Plataforma todo-en-uno diseñada para salones Montessori: admisiones, seguimientos, cobros y comunicación escolar.'
                : 'Agenda una visita guiada para experimentar de cerca cómo guiamos la curiosidad y autonomía de los niños.'}
            </p>
          </div>

          <a
            href={isSaaSBlog ? '/' : (schoolSlugFromUrl ? `/colegio/${schoolSlugFromUrl}#contacto` : '/#contacto')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold ${
              isSaaSBlog ? 'bg-[#C4661F] hover:bg-[#DE7424] text-white' : 'bg-white text-forest hover:bg-emerald-50'
            } ${btnRadiusClass} shadow-md shrink-0 text-center transition-all cursor-pointer`}
          >
            {isSaaSBlog ? 'Conoce más sobre MontessoriNexus' : 'Agendar Visita al Colegio'}
          </a>
        </div>
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
