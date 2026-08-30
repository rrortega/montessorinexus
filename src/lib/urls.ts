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
