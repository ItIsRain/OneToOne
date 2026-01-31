import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://1i1.ae';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static marketing & auth pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/signin`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/subscribe`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [];

  // Query public content from Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Public published events — include the /event/[slug] route (primary event page)
      const { data: events } = await supabase
        .from('events')
        .select('slug, updated_at, tenant_id')
        .neq('is_public', false)
        .neq('is_published', false);

      // Fetch all tenants with subdomains for building tenant-scoped URLs
      const { data: allTenants } = await supabase
        .from('tenants')
        .select('id, slug, name, updated_at, portal_enabled');

      const tenantMap = new Map<string, { slug: string; name: string }>();
      if (allTenants) {
        for (const t of allTenants) {
          if (t.slug) tenantMap.set(t.id, { slug: t.slug, name: t.name });
        }
      }

      if (events) {
        for (const event of events) {
          // Main event page on the primary domain
          dynamicPages.push({
            url: `${BASE_URL}/event/${event.slug}`,
            lastModified: new Date(event.updated_at),
            changeFrequency: 'weekly',
            priority: 0.8,
          });

          // Tenant subdomain event page (e.g. acme.1i1.ae/event/slug)
          const tenant = tenantMap.get(event.tenant_id);
          if (tenant) {
            dynamicPages.push({
              url: `https://${tenant.slug}.1i1.ae/event/${event.slug}`,
              lastModified: new Date(event.updated_at),
              changeFrequency: 'weekly',
              priority: 0.8,
            });
          }
        }
      }

      // Active booking pages
      const { data: bookingPages } = await supabase
        .from('booking_pages')
        .select('slug, updated_at')
        .eq('is_active', true);

      if (bookingPages) {
        for (const page of bookingPages) {
          dynamicPages.push({
            url: `${BASE_URL}/book/${page.slug}`,
            lastModified: new Date(page.updated_at),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }

      // Tenant portal landing pages + their /events listing
      if (allTenants) {
        for (const tenant of allTenants) {
          if (!tenant.slug) continue;

          // Portal page on main domain
          if (tenant.portal_enabled) {
            dynamicPages.push({
              url: `${BASE_URL}/portal/${tenant.slug}`,
              lastModified: new Date(tenant.updated_at),
              changeFrequency: 'weekly',
              priority: 0.6,
            });
          }

          // Tenant subdomain root + events page
          dynamicPages.push({
            url: `https://${tenant.slug}.1i1.ae`,
            lastModified: new Date(tenant.updated_at),
            changeFrequency: 'daily',
            priority: 0.7,
          });
          dynamicPages.push({
            url: `https://${tenant.slug}.1i1.ae/events`,
            lastModified: new Date(tenant.updated_at),
            changeFrequency: 'daily',
            priority: 0.7,
          });
        }
      }
    } catch (error) {
      console.error('Sitemap generation error:', error);
    }
  }

  return [...staticPages, ...dynamicPages];
}
