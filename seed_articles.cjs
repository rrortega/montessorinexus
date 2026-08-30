const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const AUTHORS = [
  { name: 'Dra. María Elena Rivas', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Prof. Carlos Mendoza', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Dra. Carmen Morales', avatar: 'https://randomuser.me/api/portraits/women/51.jpg' },
  { name: 'Dr. Andrés Villalobos', avatar: 'https://randomuser.me/api/portraits/men/68.jpg' },
  { name: 'Mtra. Sofía Altamirano', avatar: 'https://randomuser.me/api/portraits/women/24.jpg' },
  { name: 'Prof. Roberto Salazar', avatar: 'https://randomuser.me/api/portraits/men/82.jpg' },
  { name: 'Dra. Valentina Navarro', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

const TARGET_LANGUAGES = ['en', 'fr', 'pt', 'de', 'ru'];

const FILES = [
  'nuevo_articulo_blog.md',
  'segundo_articulo_blog.md',
  'tercer_articulo_blog.md',
  'cuarto_articulo_blog.md',
  'quinto_articulo_blog.md',
  'sexto_articulo_blog.md',
  'septimo_articulo_blog.md',
];

async function main() {
  const {
    generateBlogCoverImage,
    generateBlogMetadataWithAi,
    translateBlogContentWithAi,
    calculateReadingTime,
    slugify
  } = await import('./server/blog-service.js');

  const author = await prisma.user.findFirst();
  if (!author) throw new Error('No author found in database');

  let defaultCategory = await prisma.blogCategory.findFirst({
    where: { schoolId: null, slug: 'pedagogia-montessori' }
  });
  if (!defaultCategory) {
    defaultCategory = await prisma.blogCategory.create({
      data: {
        name: 'Pedagogía Montessori',
        slug: 'pedagogia-montessori',
        schoolId: null
      }
    });
  }

  const brainDir = path.join(process.env.HOME, '.gemini/antigravity/brain/8701d27e-e529-4af3-97b1-ed1f718d7ff4');

  for (let idx = 0; idx < FILES.length; idx++) {
    const filename = FILES[idx];
    const filepath = path.join(brainDir, filename);
    if (!fs.existsSync(filepath)) {
      console.log('Skipping', filename, '- file not found');
      continue;
    }

    const rawContent = fs.readFileSync(filepath, 'utf8');
    const titleMatch = rawContent.match(/^# (.*)/);
    const title = titleMatch ? titleMatch[1].trim() : filename.replace('.md', '');
    const cleanContent = rawContent.replace(/^# .*\n+/, '').trim();
    const assignedAuthor = AUTHORS[idx] || AUTHORS[0];

    console.log(`\n======================================================`);
    console.log(`📝 Processing Article ${idx + 1}/7: "${title}"`);
    console.log(`👤 Author: ${assignedAuthor.name}`);
    console.log(`======================================================`);

    // 1. Generate Spanish SEO & OpenGraph metadata
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
    } catch (metaErr) {
      console.warn(`⚠️ Error generating Spanish metadata:`, metaErr.message);
    }

    // 2. Generate Cover Image (Charcoal + Terracotta crayon style, no text)
    console.log(`🎨 Generating AI cover image (Charcoal & Terracotta, strictly no text)...`);
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
      console.error(`⚠️ Error generating cover image:`, imgErr.message);
    }

    // 3. Prepare translations list starting with Spanish (es)
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

    // 4. Translate into English, French, Portuguese, German, Russian
    for (const lang of TARGET_LANGUAGES) {
      console.log(`🌐 Translating into "${lang}"...`);
      try {
        const transResult = await translateBlogContentWithAi({
          title: title,
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
        console.log(`   ✓ [${lang}] Title: "${transResult.title}" | Slug: "${transResult.slug}"`);
      } catch (transErr) {
        console.error(`   ❌ [${lang}] Translation error:`, transErr.message);
      }
    }

    // 5. Upsert post in Database
    const readingTime = calculateReadingTime(cleanContent);
    const existingPost = await prisma.blogPost.findFirst({
      where: {
        schoolId: null,
        translations: {
          some: {
            locale: 'es',
            title: title
          }
        }
      }
    });

    if (existingPost) {
      console.log(`🔄 Updating existing post (ID: ${existingPost.id})...`);
      await prisma.blogPostTranslation.deleteMany({
        where: { postId: existingPost.id }
      });

      await prisma.blogPost.update({
        where: { id: existingPost.id },
        data: {
          coverImage: coverImageUrl || existingPost.coverImage,
          coverImageAlt: esMeta.coverImageAlt || title,
          customAuthorName: assignedAuthor.name,
          customAuthorAvatar: assignedAuthor.avatar,
          status: 'PUBLISHED',
          isFeatured: false,
          readingTimeMinutes: readingTime,
          translations: {
            create: translations
          }
        }
      });
      console.log(`🎉 Article ${idx + 1} updated successfully!`);
    } else {
      console.log(`✨ Creating new post in database...`);
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
            create: [
              { categoryId: defaultCategory.id }
            ]
          }
        }
      });
      console.log(`🎉 Article ${idx + 1} created with ID: ${created.id}!`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🚀 All 7 articles have been processed with AI covers & 5 translations!`);
  console.log(`======================================================`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
