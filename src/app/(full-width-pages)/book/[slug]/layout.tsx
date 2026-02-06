import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';
import { generateBookingMetadata } from '@/lib/seo';
import { generateServiceSchema, generateBreadcrumbSchema } from '@/lib/seo/schemas';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://1i1.ae';

interface BookingPageData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  location_type: 'video' | 'phone' | 'in_person' | 'custom';
  tenant_id: string;
}

interface TenantData {
  name: string | null;
  subdomain: string | null;
  logo_url: string | null;
}

async function getBookingPageBySlug(
  slug: string
): Promise<{ bookingPage: BookingPageData | null; tenant: TenantData | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { bookingPage: null, tenant: null };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: bookingPage } = await supabase
    .from('booking_pages')
    .select('id, name, slug, description, duration_minutes, location_type, tenant_id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!bookingPage) return { bookingPage: null, tenant: null };

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, subdomain, logo_url')
    .eq('id', bookingPage.tenant_id)
    .single();

  return { bookingPage, tenant };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { bookingPage, tenant } = await getBookingPageBySlug(slug);

  if (!bookingPage || !tenant) {
    return {
      title: 'Booking Page Not Found',
      robots: { index: false, follow: false },
    };
  }

  return generateBookingMetadata({
    serviceName: bookingPage.name,
    serviceDescription: bookingPage.description || undefined,
    tenantName: tenant.name || 'Business',
    tenantSubdomain: tenant.subdomain || '',
    tenantLogo: tenant.logo_url || undefined,
    slug: bookingPage.slug,
    duration: bookingPage.duration_minutes,
    locationType: bookingPage.location_type,
  });
}

export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return [];
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: bookingPages } = await supabase
      .from('booking_pages')
      .select('slug')
      .eq('is_active', true)
      .not('slug', 'is', null)
      .limit(100);

    if (!bookingPages) return [];

    return bookingPages
      .filter((page) => page.slug)
      .map((page) => ({
        slug: page.slug,
      }));
  } catch (error) {
    console.error('Error generating static params for booking pages:', error);
    return [];
  }
}

export default async function BookingPageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { bookingPage, tenant } = await getBookingPageBySlug(slug);

  // Generate JSON-LD only if we have the data
  if (!bookingPage || !tenant) {
    return <>{children}</>;
  }

  const tenantSubdomain = tenant.subdomain || '';
  const bookingUrl = tenantSubdomain
    ? `https://${tenantSubdomain}.1i1.ae/book/${slug}`
    : `${BASE_URL}/book/${slug}`;

  // Service schema
  const serviceSchema = generateServiceSchema({
    name: bookingPage.name,
    description: bookingPage.description || undefined,
    url: bookingUrl,
    provider: tenant.name || 'Business',
    providerUrl: tenantSubdomain ? `https://${tenantSubdomain}.1i1.ae` : BASE_URL,
    duration: bookingPage.duration_minutes,
    locationType: bookingPage.location_type,
  });

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: tenantSubdomain ? `https://${tenantSubdomain}.1i1.ae` : BASE_URL },
    { name: 'Book', url: `${tenantSubdomain ? `https://${tenantSubdomain}.1i1.ae` : BASE_URL}/book` },
    { name: bookingPage.name, url: bookingUrl },
  ]);

  return (
    <>
      <Script
        id={`booking-service-jsonld-${slug}`}
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(serviceSchema)}
      </Script>
      <Script
        id={`booking-breadcrumb-jsonld-${slug}`}
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(breadcrumbSchema)}
      </Script>
      {children}
    </>
  );
}
