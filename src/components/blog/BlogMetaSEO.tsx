import React, { useEffect } from 'react';

interface BlogMetaSEOProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  authorJobTitle?: string;
  schoolName?: string;
  schoolLogo?: string;
  keywords?: string[];
  isSaaSBlog?: boolean;
}

export const BlogMetaSEO: React.FC<BlogMetaSEOProps> = ({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
  authorName = 'Equipo Pedagógico',
  schoolName = 'MontessoriNexus',
  schoolLogo,
  keywords = [],
  isSaaSBlog = false
}) => {
  useEffect(() => {
    // 1. Document Title
    const siteBrand = isSaaSBlog ? 'MontessoriNexus Blog' : schoolName;
    document.title = `${title} | ${siteBrand}`;

    // Helper to safely set meta tag
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Standard SEO Meta Tags
    setMeta('name', 'description', description);
    if (keywords.length > 0) {
      setMeta('name', 'keywords', keywords.join(', '));
    }
    setMeta('name', 'robots', 'index, follow, max-image-preview:large');

    // 3. OpenGraph / Facebook
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:site_name', siteBrand);
    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('property', 'og:image:alt', title);
    }
    if (publishedTime) {
      setMeta('property', 'article:published_time', publishedTime);
    }
    if (modifiedTime) {
      setMeta('property', 'article:modified_time', modifiedTime);
    }
    if (authorName) {
      setMeta('property', 'article:author', authorName);
    }

    // 4. Twitter Cards
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    if (image) {
      setMeta('name', 'twitter:image', image);
      setMeta('name', 'twitter:image:alt', title);
    }

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, url, image, publishedTime, modifiedTime, authorName, schoolName, keywords, isSaaSBlog]);

  // JSON-LD Structured Data Schema for Google
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': title,
    'description': description,
    'image': image ? [image] : [],
    'datePublished': publishedTime,
    'dateModified': modifiedTime || publishedTime,
    'author': [{
      '@type': 'Person',
      'name': authorName
    }],
    'publisher': {
      '@type': 'Organization',
      'name': isSaaSBlog ? 'MontessoriNexus' : schoolName,
      'logo': {
        '@type': 'ImageObject',
        'url': schoolLogo || 'https://montessorinexus.com/logo.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': url
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};
