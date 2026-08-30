import express from 'express';
import {
  slugify,
  calculateReadingTime,
  checkSchoolBlogEntitlement,
  generateBlogMetadataWithAi,
  translateBlogContentWithAi,
  assistBlogDraftWithAi,
  generateBlogCoverImage,
  deleteStorageMediaUrl,
  cleanupBlogPostMedia,
  extractImageUrls
} from './blog-service.js';

export function createBlogRouter(prisma) {
  const router = express.Router();

  /**
   * Helper to resolve target schoolId:
   * Returns null for SaaS platform, or school UUID for a specific school.
   */
  async function resolveTargetSchoolId(req) {
    const rawSchoolId = req.headers['x-school-id'] || req.query.schoolId;
    const rawSchoolSlug = req.headers['x-school-slug'] || req.query.schoolSlug;
    const isPlatform = req.headers['x-is-platform'] === 'true' || req.query.isPlatform === 'true';

    if (isPlatform || (!rawSchoolId && !rawSchoolSlug && req.school?.slug === 'nexus')) {
      return null;
    }

    if (rawSchoolId && rawSchoolId !== 'undefined' && rawSchoolId !== 'null' && rawSchoolId !== 'platform' && rawSchoolId !== 'saas') {
      return rawSchoolId;
    }

    if (rawSchoolSlug && rawSchoolSlug !== 'platform' && rawSchoolSlug !== 'saas' && rawSchoolSlug !== 'nexus') {
      const s = await prisma.school.findUnique({ where: { slug: rawSchoolSlug }, select: { id: true } });
      if (s) return s.id;
    }

    if (req.school?.id && req.school.slug !== 'nexus' && req.school.id !== 'platform') {
      return req.school.id;
    }

    return null;
  }

  // ==========================================
  // PUBLIC BLOG ENDPOINTS
  // ==========================================

  // Check School Blog Entitlement
  router.get('/blog/entitlement', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      if (!targetSchoolId) {
        return res.json({ allowed: true, inTrial: false, daysLeft: 0, isPlatform: true });
      }

      const school = await prisma.school.findUnique({ where: { id: targetSchoolId } });
      const entitlement = checkSchoolBlogEntitlement(school);
      res.json(entitlement);
    } catch (err) {
      console.error('Error in /api/blog/entitlement:', err);
      res.status(500).json({ error: 'Error checking blog entitlement' });
    }
  });

  // List published posts
  router.get('/blog/posts', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const locale = String(req.query.locale || 'es').toLowerCase();
      const categorySlug = req.query.category ? String(req.query.category).trim() : null;
      const tagSlug = req.query.tag ? String(req.query.tag).trim() : null;
      const search = req.query.search ? String(req.query.search).trim() : null;
      const featured = req.query.featured === 'true';
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
      const skip = (page - 1) * limit;

      const whereClause = {
        schoolId: targetSchoolId,
        status: 'PUBLISHED'
      };

      if (featured) {
        whereClause.isFeatured = true;
      }

      if (categorySlug) {
        whereClause.categories = {
          some: {
            category: {
              slug: categorySlug
            }
          }
        };
      }

      if (tagSlug) {
        whereClause.tags = {
          some: {
            tag: {
              slug: tagSlug
            }
          }
        };
      }

      if (search) {
        whereClause.translations = {
          some: {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { excerpt: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } }
            ]
          }
        };
      }

      const [total, posts] = await Promise.all([
        prisma.blogPost.count({ where: whereClause }),
        prisma.blogPost.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: [
            { isFeatured: 'desc' },
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
          ],
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                jobTitle: true
              }
            },
            translations: true,
            categories: {
              include: {
                category: true
              }
            },
            tags: {
              include: {
                tag: true
              }
            }
          }
        })
      ]);

      // Normalize post response with active translation
      const formattedPosts = posts.map(post => {
        const activeTranslation = post.translations.find(t => t.locale === locale) || post.translations[0] || {};
        const availableLocales = post.translations.map(t => t.locale);

        return {
          id: post.id,
          schoolId: post.schoolId,
          slug: activeTranslation.slug || '',
          title: activeTranslation.title || '',
          excerpt: activeTranslation.excerpt || '',
          coverImage: post.coverImage,
          coverImageAlt: post.coverImageAlt,
          status: post.status,
          isFeatured: post.isFeatured,
          readingTimeMinutes: post.readingTimeMinutes,
          viewsCount: post.viewsCount,
          publishedAt: post.publishedAt || post.createdAt,
          createdAt: post.createdAt,
          author: {
            ...(post.author || {}),
            fullName: post.customAuthorName || post.author?.fullName || '',
            avatarUrl: post.customAuthorAvatar || post.author?.avatarUrl || ''
          },
          locale: activeTranslation.locale || locale,
          availableLocales,
          categories: post.categories.map(c => c.category),
          tags: post.tags.map(t => t.tag)
        };
      });

      res.json({
        data: formattedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      console.error('Error in /api/blog/posts:', err);
      res.status(500).json({ error: 'Error fetching blog posts' });
    }
  });

  // Get single post by slug
  router.get('/blog/posts/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const targetSchoolId = await resolveTargetSchoolId(req);
      const requestedLocale = String(req.query.locale || 'es').toLowerCase();

      // Find translation by slug
      const translation = await prisma.blogPostTranslation.findFirst({
        where: {
          slug,
          post: {
            schoolId: targetSchoolId,
            status: 'PUBLISHED'
          }
        },
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  jobTitle: true,
                  bio: true
                }
              },
              translations: true,
              categories: {
                include: {
                  category: true
                }
              },
              tags: {
                include: {
                  tag: true
                }
              },
              school: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                  primaryColor: true
                }
              }
            }
          }
        }
      });

      if (!translation) {
        return res.status(404).json({ error: 'Artículo no encontrado' });
      }

      const post = translation.post;

      // Increment view count asynchronously
      prisma.blogPost.update({
        where: { id: post.id },
        data: { viewsCount: { increment: 1 } }
      }).catch(e => console.warn('Failed to increment post views count', e.message));

      // Fetch related posts from same categories
      const categoryIds = post.categories.map(c => c.categoryId);
      let relatedPosts = [];
      if (categoryIds.length > 0) {
        const rawRelated = await prisma.blogPost.findMany({
          where: {
            schoolId: targetSchoolId,
            status: 'PUBLISHED',
            id: { not: post.id },
            categories: {
              some: {
                categoryId: { in: categoryIds }
              }
            }
          },
          take: 3,
          orderBy: { publishedAt: 'desc' },
          include: {
            translations: true,
            author: { select: { fullName: true, avatarUrl: true } }
          }
        });

        relatedPosts = rawRelated.map(r => {
          const trans = r.translations.find(t => t.locale === requestedLocale) || r.translations[0] || {};
          return {
            id: r.id,
            slug: trans.slug,
            title: trans.title,
            excerpt: trans.excerpt,
            coverImage: r.coverImage,
            readingTimeMinutes: r.readingTimeMinutes,
            publishedAt: r.publishedAt || r.createdAt,
            author: {
              ...(r.author || {}),
              fullName: r.customAuthorName || r.author?.fullName || '',
              avatarUrl: r.customAuthorAvatar || r.author?.avatarUrl || ''
            }
          };
        });
      }

      res.json({
        id: post.id,
        schoolId: post.schoolId,
        school: post.school,
        slug: translation.slug,
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        metaTitle: translation.metaTitle || translation.title,
        metaDescription: translation.metaDescription || translation.excerpt,
        canonicalUrl: translation.canonicalUrl || '',
        locale: translation.locale,
        coverImage: post.coverImage,
        coverImageAlt: post.coverImageAlt,
        readingTimeMinutes: post.readingTimeMinutes,
        viewsCount: post.viewsCount + 1,
        publishedAt: post.publishedAt || post.createdAt,
        createdAt: post.createdAt,
        author: {
          ...(post.author || {}),
          fullName: post.customAuthorName || post.author?.fullName || '',
          avatarUrl: post.customAuthorAvatar || post.author?.avatarUrl || ''
        },
        translations: post.translations.map(t => ({
          locale: t.locale,
          slug: t.slug,
          title: t.title
        })),
        categories: post.categories.map(c => c.category),
        tags: post.tags.map(t => t.tag),
        relatedPosts
      });
    } catch (err) {
      console.error('Error in /api/blog/posts/:slug:', err);
      res.status(500).json({ error: 'Error fetching blog post' });
    }
  });

  // Get categories
  router.get('/blog/categories', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const categories = await prisma.blogCategory.findMany({
        where: { schoolId: targetSchoolId },
        include: {
          _count: {
            select: { posts: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        postCount: c._count.posts
      })));
    } catch (err) {
      console.error('Error in /api/blog/categories:', err);
      res.status(500).json({ error: 'Error fetching categories' });
    }
  });

  // Get tags
  router.get('/blog/tags', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const tags = await prisma.blogTag.findMany({
        where: { schoolId: targetSchoolId },
        include: {
          _count: {
            select: { posts: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        postCount: t._count.posts
      })));
    } catch (err) {
      console.error('Error in /api/blog/tags:', err);
      res.status(500).json({ error: 'Error fetching tags' });
    }
  });

  // ==========================================
  // ADMIN BLOG ENDPOINTS
  // ==========================================

  // Admin list all posts
  router.get('/admin/blog/posts', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const status = req.query.status ? String(req.query.status).toUpperCase() : null;
      const search = req.query.search ? String(req.query.search).trim() : null;

      const whereClause = {
        schoolId: targetSchoolId
      };

      if (status && ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.translations = {
          some: {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } }
            ]
          }
        };
      }

      const posts = await prisma.blogPost.findMany({
        where: whereClause,
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true
            }
          },
          translations: true,
          categories: {
            include: { category: true }
          },
          tags: {
            include: { tag: true }
          }
        }
      });

      res.json(posts.map(p => ({
        id: p.id,
        schoolId: p.schoolId,
        coverImage: p.coverImage,
        coverImageAlt: p.coverImageAlt,
        status: p.status,
        isFeatured: p.isFeatured,
        readingTimeMinutes: p.readingTimeMinutes,
        viewsCount: p.viewsCount,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        author: p.author,
        customAuthorName: p.customAuthorName,
        customAuthorAvatar: p.customAuthorAvatar,
        translations: p.translations,
        categories: p.categories.map(c => c.category),
        tags: p.tags.map(t => t.tag)
      })));
    } catch (err) {
      console.error('Error in /api/admin/blog/posts:', err);
      res.status(500).json({ error: 'Error fetching admin blog posts' });
    }
  });

  // Admin get single post by id
  router.get('/admin/blog/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const targetSchoolId = await resolveTargetSchoolId(req);

      const post = await prisma.blogPost.findFirst({
        where: {
          id,
          schoolId: targetSchoolId
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true
            }
          },
          translations: true,
          categories: {
            include: { category: true }
          },
          tags: {
            include: { tag: true }
          }
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Artículo no encontrado' });
      }

      res.json({
        id: post.id,
        schoolId: post.schoolId,
        coverImage: post.coverImage,
        coverImageAlt: post.coverImageAlt,
        status: post.status,
        isFeatured: post.isFeatured,
        readingTimeMinutes: post.readingTimeMinutes,
        viewsCount: post.viewsCount,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        customAuthorName: post.customAuthorName,
        customAuthorAvatar: post.customAuthorAvatar,
        translations: post.translations,
        categories: post.categories.map(c => c.category),
        tags: post.tags.map(t => t.tag)
      });
    } catch (err) {
      console.error('Error in /api/admin/blog/posts/:id:', err);
      res.status(500).json({ error: 'Error fetching admin blog post' });
    }
  });

  // Admin create post
  router.post('/admin/blog/posts', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);

      // Entitlement guard for schools
      if (targetSchoolId) {
        const school = await prisma.school.findUnique({ where: { id: targetSchoolId } });
        const entitlement = checkSchoolBlogEntitlement(school);
        if (!entitlement.allowed) {
          return res.status(403).json({ error: entitlement.reason });
        }
      }

      const {
        authorId,
        customAuthorName = null,
        customAuthorAvatar = null,
        coverImage = '',
        coverImageAlt = '',
        status = 'DRAFT',
        isFeatured = false,
        publishedAt,
        translations = [],
        categoryIds = [],
        tagIds = []
      } = req.body;

      // Determine author ID fallback if not provided
      let finalAuthorId = authorId;
      if (!finalAuthorId) {
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        finalAuthorId = firstUser?.id;
      }

      if (!finalAuthorId) {
        return res.status(400).json({ error: 'No se encontró un usuario autor válido' });
      }

      // Ensure at least one translation exists
      if (!Array.isArray(translations) || translations.length === 0) {
        return res.status(400).json({ error: 'El artículo debe contener al menos un idioma (traducción)' });
      }

      // Calculate reading time based on primary translation content
      const primaryTrans = translations[0];
      const readingTime = calculateReadingTime(primaryTrans.content || '');

      const post = await prisma.blogPost.create({
        data: {
          schoolId: targetSchoolId,
          authorId: finalAuthorId,
          customAuthorName,
          customAuthorAvatar,
          coverImage,
          coverImageAlt,
          status,
          isFeatured: Boolean(isFeatured),
          publishedAt: publishedAt ? new Date(publishedAt) : (status === 'PUBLISHED' ? new Date() : null),
          readingTimeMinutes: readingTime,
          translations: {
            create: translations.map(t => ({
              locale: t.locale || 'es',
              slug: slugify(t.slug || t.title),
              title: t.title || 'Sin título',
              excerpt: t.excerpt || '',
              content: t.content || '',
              metaTitle: t.metaTitle || t.title || '',
              metaDescription: t.metaDescription || t.excerpt || '',
              canonicalUrl: t.canonicalUrl || ''
            }))
          },
          categories: {
            create: categoryIds.map(catId => ({ categoryId: catId }))
          },
          tags: {
            create: tagIds.map(tagId => ({ tagId }))
          }
        },
        include: {
          translations: true,
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          author: { select: { fullName: true, avatarUrl: true } }
        }
      });

      res.status(201).json(post);
    } catch (err) {
      console.error('Error in POST /api/admin/blog/posts:', err);
      res.status(500).json({ error: 'Error creating blog post: ' + err.message });
    }
  });

  // Admin update post
  router.put('/admin/blog/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const targetSchoolId = await resolveTargetSchoolId(req);

      const existing = await prisma.blogPost.findFirst({
        where: { id, schoolId: targetSchoolId },
        include: { translations: true }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Artículo no encontrado' });
      }

      const {
        authorId,
        customAuthorName,
        customAuthorAvatar,
        coverImage,
        coverImageAlt,
        status,
        isFeatured,
        publishedAt,
        translations = [],
        categoryIds,
        tagIds
      } = req.body;

      // 1. Si se cambió o eliminó la portada, borrar la imagen anterior físicamente del storage
      if (coverImage !== undefined && existing.coverImage && existing.coverImage !== coverImage) {
        await deleteStorageMediaUrl(existing.coverImage, targetSchoolId, prisma);
      }

      // 2. Si se actualizaron las traducciones, detectar imágenes eliminadas del contenido y borrarlas del storage
      if (Array.isArray(translations) && translations.length > 0 && Array.isArray(existing.translations)) {
        const oldUrls = new Set();
        existing.translations.forEach(t => {
          extractImageUrls(t.content).forEach(url => oldUrls.add(url));
        });

        const newUrls = new Set();
        translations.forEach(t => {
          extractImageUrls(t.content).forEach(url => newUrls.add(url));
        });

        for (const oldUrl of oldUrls) {
          if (!newUrls.has(oldUrl)) {
            await deleteStorageMediaUrl(oldUrl, targetSchoolId, prisma);
          }
        }
      }

      // Update post core data
      const updateData = {};
      if (authorId) updateData.authorId = authorId;
      if (customAuthorName !== undefined) updateData.customAuthorName = customAuthorName;
      if (customAuthorAvatar !== undefined) updateData.customAuthorAvatar = customAuthorAvatar;
      if (coverImage !== undefined) updateData.coverImage = coverImage;
      if (coverImageAlt !== undefined) updateData.coverImageAlt = coverImageAlt;
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'PUBLISHED' && !existing.publishedAt && !publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
      if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
      if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;

      if (translations.length > 0) {
        const primaryTrans = translations[0];
        updateData.readingTimeMinutes = calculateReadingTime(primaryTrans.content || '');
      }

      // Perform transaction to sync translations, categories and tags cleanly
      const updatedPost = await prisma.$transaction(async (tx) => {
        // 1. Update basic post fields
        await tx.blogPost.update({
          where: { id },
          data: updateData
        });

        // 2. Sync translations
        if (Array.isArray(translations) && translations.length > 0) {
          for (const t of translations) {
            const cleanSlug = slugify(t.slug || t.title);
            await tx.blogPostTranslation.upsert({
              where: {
                postId_locale: {
                  postId: id,
                  locale: t.locale || 'es'
                }
              },
              create: {
                postId: id,
                locale: t.locale || 'es',
                slug: cleanSlug,
                title: t.title || 'Sin título',
                excerpt: t.excerpt || '',
                content: t.content || '',
                metaTitle: t.metaTitle || t.title || '',
                metaDescription: t.metaDescription || t.excerpt || '',
                canonicalUrl: t.canonicalUrl || ''
              },
              update: {
                slug: cleanSlug,
                title: t.title || 'Sin título',
                excerpt: t.excerpt || '',
                content: t.content || '',
                metaTitle: t.metaTitle || t.title || '',
                metaDescription: t.metaDescription || t.excerpt || '',
                canonicalUrl: t.canonicalUrl || ''
              }
            });
          }
        }

        // 3. Sync categories
        if (Array.isArray(categoryIds)) {
          await tx.blogPostCategory.deleteMany({ where: { postId: id } });
          if (categoryIds.length > 0) {
            await tx.blogPostCategory.createMany({
              data: categoryIds.map(catId => ({ postId: id, categoryId: catId }))
            });
          }
        }

        // 4. Sync tags
        if (Array.isArray(tagIds)) {
          await tx.blogPostTag.deleteMany({ where: { postId: id } });
          if (tagIds.length > 0) {
            await tx.blogPostTag.createMany({
              data: tagIds.map(tagId => ({ postId: id, tagId }))
            });
          }
        }

        return tx.blogPost.findUnique({
          where: { id },
          include: {
            translations: true,
            categories: { include: { category: true } },
            tags: { include: { tag: true } },
            author: { select: { fullName: true, avatarUrl: true } }
          }
        });
      });

      res.json(updatedPost);
    } catch (err) {
      console.error('Error in PUT /api/admin/blog/posts/:id:', err);
      res.status(500).json({ error: 'Error updating blog post: ' + err.message });
    }
  });

  // Admin delete post
  router.delete('/admin/blog/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const targetSchoolId = await resolveTargetSchoolId(req);

      const existing = await prisma.blogPost.findFirst({
        where: { id, schoolId: targetSchoolId },
        include: { translations: true }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Artículo no encontrado' });
      }

      // Borrar físicamente del storage la imagen de portada y todas las imágenes insertadas en el contenido
      await cleanupBlogPostMedia(existing, targetSchoolId, prisma);

      await prisma.blogPost.delete({ where: { id } });
      res.json({ success: true, message: 'Artículo e imágenes eliminados correctamente' });
    } catch (err) {
      console.error('Error in DELETE /api/admin/blog/posts/:id:', err);
      res.status(500).json({ error: 'Error deleting blog post: ' + err.message });
    }
  });

  // Admin Category Management
  router.post('/admin/blog/categories', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const { name, description = '', slug } = req.body;

      if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
      const cleanSlug = slugify(slug || name);

      const category = await prisma.blogCategory.create({
        data: {
          schoolId: targetSchoolId,
          name,
          slug: cleanSlug,
          description
        }
      });
      res.status(201).json(category);
    } catch (err) {
      console.error('Error creating category:', err);
      res.status(500).json({ error: 'Error creating category: ' + err.message });
    }
  });

  router.delete('/admin/blog/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const targetSchoolId = await resolveTargetSchoolId(req);
      await prisma.blogCategory.deleteMany({
        where: { id, schoolId: targetSchoolId }
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting category' });
    }
  });

  // Admin Tag Management
  router.post('/admin/blog/tags', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const { name, slug } = req.body;

      if (!name) return res.status(400).json({ error: 'El nombre de la etiqueta es obligatorio' });
      const cleanSlug = slugify(slug || name);

      const tag = await prisma.blogTag.create({
        data: {
          schoolId: targetSchoolId,
          name,
          slug: cleanSlug
        }
      });
      res.status(201).json(tag);
    } catch (err) {
      console.error('Error creating tag:', err);
      res.status(500).json({ error: 'Error creating tag: ' + err.message });
    }
  });

  router.delete('/admin/blog/tags/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const targetSchoolId = await resolveTargetSchoolId(req);
      await prisma.blogTag.deleteMany({
        where: { id, schoolId: targetSchoolId }
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting tag' });
    }
  });

  // ==========================================
  // AI COPILOT ENDPOINTS
  // ==========================================

  // Generate SEO, slug, excerpt & alt_text
  router.post('/admin/blog/ai/generate-metadata', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const { title, content, locale = 'es' } = req.body;

      if (!title && !content) {
        return res.status(400).json({ error: 'Se requiere título o contenido para analizar' });
      }

      const meta = await generateBlogMetadataWithAi({
        title: title || '',
        content: content || '',
        locale,
        schoolId: targetSchoolId,
        prisma
      });

      res.json(meta);
    } catch (err) {
      console.error('Error in /api/admin/blog/ai/generate-metadata:', err);
      res.status(500).json({ error: err.message || 'Error generando metadatos con IA' });
    }
  });

  // Translate article content
  router.post('/admin/blog/ai/translate', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const { title, excerpt, content, metaTitle, metaDescription, targetLocale, sourceLocale = 'es' } = req.body;

      if (!title || !content || !targetLocale) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (title, content, targetLocale)' });
      }

      const translated = await translateBlogContentWithAi({
        title,
        excerpt,
        content,
        metaTitle,
        metaDescription,
        targetLocale,
        sourceLocale,
        schoolId: targetSchoolId,
        prisma
      });

      res.json(translated);
    } catch (err) {
      console.error('Error in /api/admin/blog/ai/translate:', err);
      res.status(500).json({ error: err.message || 'Error traduciendo con IA' });
    }
  });

  // Assist writing / outline
  router.post('/admin/blog/ai/assist', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const { topic, targetAudience = 'families', locale = 'es', outlineOnly = false } = req.body;

      if (!topic) {
        return res.status(400).json({ error: 'Falta el tema del artículo' });
      }

      const draft = await assistBlogDraftWithAi({
        topic,
        targetAudience,
        locale,
        outlineOnly: Boolean(outlineOnly),
        schoolId: targetSchoolId,
        prisma
      });

      res.json(draft);
    } catch (err) {
      console.error('Error in /api/admin/blog/ai/assist:', err);
      res.status(500).json({ error: err.message || 'Error asistiendo borrador con IA' });
    }
  });

  // Generate cover image with AI
  router.post('/admin/blog/ai/generate-image', async (req, res) => {
    try {
      const targetSchoolId = await resolveTargetSchoolId(req);
      const { prompt, title } = req.body;

      if (!prompt && !title) {
        return res.status(400).json({ error: 'Se requiere un prompt o titulo para generar la imagen' });
      }

      const result = await generateBlogCoverImage({
        prompt: prompt || title,
        title,
        schoolId: targetSchoolId,
        prisma
      });

      res.json(result);
    } catch (err) {
      console.error('Error in /api/admin/blog/ai/generate-image:', err);
      res.status(500).json({ error: err.message || 'Error generando imagen con IA' });
    }
  });

  return router;
}
