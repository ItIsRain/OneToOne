import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://1i1.ae';

interface EventRow {
  slug: string;
  updated_at: string;
  tenant_id: string;
}

interface BookingPageRow {
  slug: string;
  updated_at: string;
  tenant_id: string;
}

interface TenantRow {
  id: string;
  subdomain: string;
  updated_at: string;
}

/**
 * Dynamic sitemap for SEO.
 *
 * Includes:
 * - Static marketing pages (homepage, auth, pricing)
 * - Dynamic public events from all tenants
 * - Dynamic public booking pages from all tenants
 * - Tenant subdomain event listings
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // Static pages - always included
  const staticPages: MetadataRoute.Sitemap = [
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
  ];

  // Dynamic pages from database
  const dynamicPages: MetadataRoute.Sitemap = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch tenants with their subdomains
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, subdomain, updated_at')
        .not('subdomain', 'is', null);

      const tenantMap = new Map<string, TenantRow>();
      if (tenants) {
        for (const tenant of tenants as TenantRow[]) {
          tenantMap.set(tenant.id, tenant);
        }
      }

      // Fetch public events
      const { data: events } = await supabase
        .from('events')
        .select('slug, updated_at, tenant_id')
        .or('is_public.is.null,is_public.eq.true')
        .or('is_published.is.null,is_published.eq.true')
        .not('slug', 'is', null)
        .in('status', ['upcoming', 'in_progress', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(500); // Limit to prevent huge sitemaps

      if (events) {
        for (const event of events as EventRow[]) {
          if (!event.slug) continue;

          const tenant = tenantMap.get(event.tenant_id);
          const eventUrl = tenant?.subdomain
            ? `https://${tenant.subdomain}.1i1.ae/event/${event.slug}`
            : `${BASE_URL}/event/${event.slug}`;

          dynamicPages.push({
            url: eventUrl,
            lastModified: new Date(event.updated_at),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }

      // Fetch active booking pages
      const { data: bookingPages } = await supabase
        .from('booking_pages')
        .select('slug, updated_at, tenant_id')
        .eq('is_active', true)
        .not('slug', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(500);

      if (bookingPages) {
        for (const page of bookingPages as BookingPageRow[]) {
          if (!page.slug) continue;

          const tenant = tenantMap.get(page.tenant_id);
          const bookingUrl = tenant?.subdomain
            ? `https://${tenant.subdomain}.1i1.ae/book/${page.slug}`
            : `${BASE_URL}/book/${page.slug}`;

          dynamicPages.push({
            url: bookingUrl,
            lastModified: new Date(page.updated_at),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      }

      // Add tenant event listing pages
      if (tenants) {
        for (const tenant of tenants as TenantRow[]) {
          if (!tenant.subdomain) continue;

          dynamicPages.push({
            url: `https://${tenant.subdomain}.1i1.ae/events`,
            lastModified: new Date(tenant.updated_at),
            changeFrequency: 'daily',
            priority: 0.8,
          });
        }
      }
    } catch (error) {
      console.error('Error generating dynamic sitemap:', error);
      // Continue with static pages only if dynamic fetch fails
    }
  }

  return [...staticPages, ...dynamicPages];
}
