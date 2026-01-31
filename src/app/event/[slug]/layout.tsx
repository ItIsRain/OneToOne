import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://1i1.ae';

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_type: string;
  category: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string | null;
  location: string | null;
  is_virtual: boolean;
  cover_image: string | null;
  organizer_name: string | null;
  contact_email: string | null;
  ticket_price: number | null;
  currency: string | null;
  max_attendees: number | null;
  tags: string[];
  tenant_id: string;
}

interface TenantData {
  name: string | null;
  slug: string | null;
}

async function getEventBySlug(slug: string): Promise<{ event: EventData | null; tenant: TenantData | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { event: null, tenant: null };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: event } = await supabase
    .from('events')
    .select('id, title, slug, description, event_type, category, start_date, end_date, start_time, end_time, timezone, location, is_virtual, cover_image, organizer_name, contact_email, ticket_price, currency, max_attendees, tags, tenant_id')
    .eq('slug', slug)
    .neq('is_public', false)
    .neq('is_published', false)
    .single();

  if (!event) return { event: null, tenant: null };

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', event.tenant_id)
    .single();

  return { event, tenant };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { event, tenant } = await getEventBySlug(slug);

  if (!event) {
    return { title: 'Event Not Found' };
  }

  const organizer = event.organizer_name || tenant?.name || 'OneToOne';
  const title = `${event.title} - ${organizer}`;
  const description = event.description
    ? event.description.slice(0, 160)
    : `${event.title} - ${event.event_type} event hosted by ${organizer}. ${event.location ? `Location: ${event.location}.` : 'Virtual event.'} ${event.start_date ? `Starting ${new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.` : ''}`;

  const eventUrl = `${BASE_URL}/event/${event.slug}`;
  const image = event.cover_image || `${BASE_URL}/Logo.svg`;

  return {
    title,
    description,
    keywords: [
      event.title,
      event.event_type,
      event.category,
      organizer,
      tenant?.name,
      event.location,
      ...(event.tags || []),
      'OneToOne event',
      '1i1.ae',
    ].filter(Boolean) as string[],
    authors: [{ name: organizer, url: BASE_URL }],
    alternates: {
      canonical: eventUrl,
    },
    openGraph: {
      type: 'website',
      url: eventUrl,
      title: event.title,
      description,
      siteName: `OneToOne - ${organizer}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [image],
    },
  };
}

function buildEventJsonLd(event: EventData, tenant: TenantData | null) {
  const organizer = event.organizer_name || tenant?.name || 'OneToOne';
  const eventUrl = `${BASE_URL}/event/${event.slug}`;

  const startDateTime = event.start_date
    ? event.start_time
      ? `${event.start_date}T${event.start_time}`
      : event.start_date
    : undefined;

  const endDateTime = event.end_date
    ? event.end_time
      ? `${event.end_date}T${event.end_time}`
      : event.end_date
    : undefined;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || `${event.title} - ${event.event_type} event by ${organizer}`,
    url: eventUrl,
    eventAttendanceMode: event.is_virtual
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: {
      '@type': 'Organization',
      name: organizer,
      url: BASE_URL,
    },
    image: event.cover_image || `${BASE_URL}/Logo.svg`,
  };

  if (startDateTime) jsonLd.startDate = startDateTime;
  if (endDateTime) jsonLd.endDate = endDateTime;

  if (event.location && !event.is_virtual) {
    jsonLd.location = {
      '@type': 'Place',
      name: event.location,
      address: event.location,
    };
  } else if (event.is_virtual) {
    jsonLd.location = {
      '@type': 'VirtualLocation',
      url: eventUrl,
    };
  }

  if (event.ticket_price !== null && event.ticket_price !== undefined) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: String(event.ticket_price),
      priceCurrency: event.currency || 'USD',
      url: eventUrl,
      availability: 'https://schema.org/InStock',
    };
  }

  if (event.max_attendees) {
    jsonLd.maximumAttendeeCapacity = event.max_attendees;
  }

  return JSON.stringify(jsonLd);
}

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { event, tenant } = await getEventBySlug(slug);

  return (
    <>
      {event && (
        <Script
          id={`event-jsonld-${slug}`}
          type="application/ld+json"
          strategy="afterInteractive"
        >{buildEventJsonLd(event, tenant)}</Script>
      )}
      {children}
    </>
  );
}
