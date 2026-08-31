/**
 * Returns the absolute URL for the SaaS blog subdomain.
 *
 * - In production: https://blog.montessorinexus.com
 * - In development (localhost): http://blog.localhost:<port>
 *
 * Accepts an optional path (e.g. "/mi-articulo") to append.
 */
export function getSaaSBlogUrl(path: string = ''): string {
  const { hostname, port, protocol } = window.location;

  // Development: localhost or 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//blog.localhost${portSuffix}${path}`;
  }

  // Production: montessorinexus.com or www.montessorinexus.com
  return `https://blog.montessorinexus.com${path}`;
}

/**
 * Returns the absolute URL for the main platform site.
 *
 * - In production: https://montessorinexus.com
 * - In development (localhost): http://localhost:<port>
 *
 * Used by the blog navbar Home button to navigate back to the main site.
 */
export function getPlatformHomeUrl(): string {
  const { hostname, port, protocol } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//localhost${portSuffix}`;
  }

  return 'https://montessorinexus.com';
}

/**
 * Returns the canonical absolute URL for a school's shared gallery link.
 *
 * Priority:
 * 1. custom_domain (e.g. https://colegioceiba.edu.mx/gallery/:id)
 * 2. subdomain (e.g. https://ceiba.montessorinexus.com/gallery/:id or http://ceiba.localhost:8080/gallery/:id)
 * 3. school.slug (e.g. https://ceiba.montessorinexus.com/gallery/:id or http://ceiba.localhost:8080/gallery/:id)
 * 4. Fallback to current window.location.origin
 */
export function getSchoolGalleryUrl(
  galleryId: string,
  school?: { slug?: string; custom_domain?: string; subdomain?: string } | null
): string {
  if (typeof window === 'undefined') return `/gallery/${galleryId}`;
  const { hostname, port, protocol } = window.location;
  const portSuffix = port ? `:${port}` : '';

  const customDomain = school?.custom_domain?.trim();
  if (customDomain) {
    const cleanDomain = customDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `https://${cleanDomain}/gallery/${galleryId}`;
  }

  const sub = (school?.subdomain?.trim() || school?.slug?.trim() || '').toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    if (sub) {
      return `${protocol}//${sub}.localhost${portSuffix}/gallery/${galleryId}`;
    }
    return `${window.location.origin}/gallery/${galleryId}`;
  }

  if (sub) {
    return `https://${sub}.montessorinexus.com/gallery/${galleryId}`;
  }

  return `${window.location.origin}/gallery/${galleryId}`;
}
