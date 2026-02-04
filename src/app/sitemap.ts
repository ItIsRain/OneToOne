import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://1i1.ae';

/**
 * Static sitemap for SEO.
 *
 * Only includes public-facing marketing pages that should be indexed.
 * Dynamic user-generated content (events, forms, proposals) are intentionally
 * excluded as they:
 * - May be temporary or unpublished at any time
 * - Should use canonical URLs from their respective tenant domains
 * - Create sitemap bloat with auto-generated IDs in slugs
 *
 * Tenant subdomains (e.g., acme.1i1.ae) should implement their own sitemaps
 * with their specific public content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    // Homepage - highest priority
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Core marketing/conversion pages
    {
      url: `${BASE_URL}/signup`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/signin`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/subscribe`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Password recovery (useful for returning users via search)
    {
      url: `${BASE_URL}/reset-password`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
