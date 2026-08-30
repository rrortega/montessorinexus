const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_AUTHORS = [
  { name: 'Dra. María Elena Rivas', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Prof. Carlos Mendoza', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Dra. Carmen Morales', avatar: 'https://randomuser.me/api/portraits/women/51.jpg' },
  { name: 'Dr. Andrés Villalobos', avatar: 'https://randomuser.me/api/portraits/men/68.jpg' },
  { name: 'Mtra. Sofía Altamirano', avatar: 'https://randomuser.me/api/portraits/women/24.jpg' },
  { name: 'Prof. Roberto Salazar', avatar: 'https://randomuser.me/api/portraits/men/82.jpg' },
  { name: 'Dra. Valentina Navarro', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

const TARGET_LANGUAGES = ['en', 'fr', 'pt', 'de', 'ru'];

async function publishBlogFile(filePath, options = {}) {
  const {
    generateBlogCoverImage,
    generateBlogMetadataWithAi,
    translateBlogContentWithAi,
    calculateReadingTime,
    slugify,
    resolveOrCreateCategoryForBlog
  } = await import('./blog-service.js');

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, 'utf8');
  const titleMatch = rawContent.match(/^# (.*)/);
  const title = options.title || (titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md'));
  const cleanContent = rawContent.replace(/^# .*\n+/, '').trim();

  const author = await prisma.user.findFirst();
  if (!author) throw new Error('No user found in database');

  const assignedAuthor = options.authorName 
    ? { name: options.authorName, avatar: options.authorAvatar || DEFAULT_AUTHORS[0].avatar }
    : DEFAULT_AUTHORS[Math.floor(Math.random() * DEFAULT_AUTHORS.length)];

  console.log(`\n📝 Publishing Blog Post: "${title}"`);
  console.log(`👤 Author: ${assignedAuthor.name}`);

  // Resolve or create appropriate category with AI
  console.log(`🏷️ Aligning with appropriate pedagogical category...`);
  const resolvedCategory = await resolveOrCreateCategoryForBlog({
    title,
    content: cleanContent,
    requestedCategory: options.category || options.categorySlug,
    schoolId: null,
    prisma
  });
  console.log(`✅ Assigned Category: "${resolvedCategory?.name}" (${resolvedCategory?.slug})`);

  // 1. Spanish SEO metadata
  console.log(`🤖 Generating Spanish SEO & OpenGraph metadata...`);
  let esMeta = { slug: slugify(title), excerpt: '', metaTitle: title, metaDescription: '', coverImageAlt: title };
  try {
    esMeta = await generateBlogMetadataWithAi({
      title,
      content: cleanContent,
      locale: 'es',
      schoolId: null,
      prisma
    });
    console.log(`✅ ES Slug: ${esMeta.slug}`);
  } catch (err) {
    console.warn('Metadata generation warning:', err.message);
  }

  // 2. Cover image
  console.log(`🎨 Generating AI cover image (Charcoal + Terracotta crayon style, no text)...`);
  const imagePrompt = `Ilustración artística de portada para artículo de blog Montessori sobre el concepto: "${title}". Estilo de dibujo a carboncillo a mano alzada en color negro y crayón terracota cálido, fondo artesanal texturizado. Sin texto, sin letras, sin tipografía, escena puramente visual.`;
  let coverImageUrl = '';
  try {
    const imgRes = await generateBlogCoverImage({
      prompt: imagePrompt,
      title,
      schoolId: null,
      prisma
    });
    coverImageUrl = imgRes.url || '';
    console.log(`✅ Cover image uploaded: ${coverImageUrl}`);
  } catch (imgErr) {
    console.error('Cover image error:', imgErr.message);
  }

  // 3. Spanish Translation entry
  const translations = [
    {
      locale: 'es',
      title: title,
      slug: esMeta.slug || slugify(title),
      excerpt: esMeta.excerpt || cleanContent.substring(0, 160) + '...',
      content: cleanContent,
      metaTitle: esMeta.metaTitle || title,
      metaDescription: esMeta.metaDescription || esMeta.excerpt || '',
      canonicalUrl: ''
    }
  ];

  // 4. Translate to 5 languages
  for (const lang of TARGET_LANGUAGES) {
    console.log(`🌐 Translating to "${lang}"...`);
    try {
      const transResult = await translateBlogContentWithAi({
        title,
        excerpt: esMeta.excerpt,
        content: cleanContent,
        metaTitle: esMeta.metaTitle,
        metaDescription: esMeta.metaDescription,
        targetLocale: lang,
        sourceLocale: 'es',
        schoolId: null,
        prisma
      });

      translations.push({
        locale: lang,
        title: transResult.title,
        slug: transResult.slug || `${esMeta.slug}-${lang}`,
        excerpt: transResult.excerpt,
        content: transResult.content,
        metaTitle: transResult.metaTitle,
        metaDescription: transResult.metaDescription,
        canonicalUrl: ''
      });
      console.log(`   ✓ [${lang}] Title: "${transResult.title}"`);
    } catch (transErr) {
      console.error(`   ❌ [${lang}] Error:`, transErr.message);
    }
  }

  // 5. Create in DB
  const readingTime = calculateReadingTime(cleanContent);
  const created = await prisma.blogPost.create({
    data: {
      schoolId: null,
      authorId: author.id,
      coverImage: coverImageUrl,
      coverImageAlt: esMeta.coverImageAlt || title,
      customAuthorName: assignedAuthor.name,
      customAuthorAvatar: assignedAuthor.avatar,
      status: 'PUBLISHED',
      isFeatured: false,
      publishedAt: new Date(),
      readingTimeMinutes: readingTime,
      translations: {
        create: translations
      },
      categories: {
        create: resolvedCategory ? [
          { categoryId: resolvedCategory.id }
        ] : []
      }
    },
    include: {
      translations: true
    }
  });

  console.log(`\n🎉 Post published successfully with ID: ${created.id}`);
  console.log(`🔗 Public URL (ES): /blog/${esMeta.slug}`);

  if (options.clean) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🧹 Cleaned up temporary draft: ${filePath}`);
    } catch (e) {}
  }

  return created;
}

// CLI entry
if (require.main === module) {
  const args = process.argv.slice(2);
  const fileArg = args.find(a => a.startsWith('--file='))?.split('=')[1] || args[0];
  const cleanArg = args.includes('--clean');
  const authorArg = args.find(a => a.startsWith('--author='))?.split('=')[1];
  const avatarArg = args.find(a => a.startsWith('--avatar='))?.split('=')[1];

  if (!fileArg) {
    console.error('Usage: node server/publish-blog-cli.cjs --file=<path-to-markdown> [--clean] [--author="Name"] [--avatar="Url"]');
    process.exit(1);
  }

  publishBlogFile(fileArg, {
    clean: cleanArg,
    authorName: authorArg,
    authorAvatar: avatarArg
  })
    .catch(err => {
      console.error('Publication error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}

module.exports = { publishBlogFile };
