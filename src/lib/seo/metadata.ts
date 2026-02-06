/**
 * Metadata utility functions for SEO
 */

import { Metadata } from 'next';
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, SOCIAL_HANDLES, COMPANY_INFO } from './constants';

export interface PageMetadataOptions {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tenant?: {
    name: string;
    subdomain: string;
    logoUrl?: string;
  };
}

/**
 * Generate comprehensive page metadata
 */
export function generatePageMetadata(options: PageMetadataOptions): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = [],
    image,
    url,
    noIndex = false,
    noFollow = false,
    type = 'website',
    tenant,
  } = options;

  // Determine base URL and site name based on tenant
  const baseUrl = tenant
    ? `https://${tenant.subdomain}.1i1.ae`
    : SITE_URL;
  const siteName = tenant
    ? `${tenant.name} on ${SITE_NAME}`
    : `${SITE_NAME} by ${COMPANY_INFO.legalName}`;
  const ogImage = image || tenant?.logoUrl || COMPANY_INFO.logo;
  const canonicalUrl = url || baseUrl;

  // Merge keywords
  const allKeywords = [...new Set([...keywords, ...DEFAULT_KEYWORDS.slice(0, 5)])];

  return {
    title,
    description,
    keywords: allKeywords,
    authors: tenant
      ? [{ name: tenant.name }]
      : COMPANY_INFO.founders.map(f => ({ name: f.name, url: f.url })),
    creator: tenant?.name || COMPANY_INFO.legalName,
    publisher: COMPANY_INFO.legalName,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type,
      locale: 'en_US',
      url: canonicalUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: SOCIAL_HANDLES.twitter,
    },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate metadata for booking pages
 */
export function generateBookingMetadata(options: {
  serviceName: string;
  serviceDescription?: string;
  tenantName: string;
  tenantSubdomain: string;
  tenantLogo?: string;
  slug: string;
  duration?: number;
  locationType?: string;
}): Metadata {
  const {
    serviceName,
    serviceDescription,
    tenantName,
    tenantSubdomain,
    tenantLogo,
    slug,
    duration,
    locationType,
  } = options;

  const title = `Book ${serviceName} - ${tenantName}`;
  const url = `https://${tenantSubdomain}.1i1.ae/book/${slug}`;

  let description = serviceDescription || `Schedule your ${serviceName} appointment with ${tenantName}.`;
  if (duration) {
    description += ` ${duration} minute session.`;
  }
  if (locationType) {
    const locationLabels: Record<string, string> = {
      video: 'Video call',
      phone: 'Phone call',
      in_person: 'In-person meeting',
      custom: 'Custom location',
    };
    description += ` ${locationLabels[locationType] || 'Meeting'}.`;
  }

  return generatePageMetadata({
    title,
    description,
    url,
    image: tenantLogo,
    keywords: [
      serviceName,
      tenantName,
      'book appointment',
      'schedule meeting',
      'booking',
      'appointment scheduling',
    ],
    tenant: {
      name: tenantName,
      subdomain: tenantSubdomain,
      logoUrl: tenantLogo,
    },
  });
}

/**
 * Generate metadata for invoice pages (noindex)
 */
export function generateInvoiceMetadata(options: {
  invoiceNumber: string;
  tenantName?: string;
  clientName?: string;
}): Metadata {
  const { invoiceNumber, tenantName, clientName } = options;

  const title = `Invoice ${invoiceNumber}${tenantName ? ` - ${tenantName}` : ''}`;
  const description = clientName
    ? `Invoice ${invoiceNumber} for ${clientName}`
    : `View invoice ${invoiceNumber}`;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

/**
 * Generate metadata for event pages
 */
export function generateEventMetadata(options: {
  eventName: string;
  eventDescription?: string;
  organizer: string;
  eventUrl: string;
  coverImage?: string;
  startDate?: string;
  location?: string;
  isVirtual?: boolean;
  category?: string;
  tags?: string[];
  tenantName?: string;
  tenantSubdomain?: string;
}): Metadata {
  const {
    eventName,
    eventDescription,
    organizer,
    eventUrl,
    coverImage,
    startDate,
    location,
    isVirtual,
    category,
    tags = [],
    tenantName,
    tenantSubdomain,
  } = options;

  let description = eventDescription?.slice(0, 160) || `${eventName} - Event hosted by ${organizer}.`;
  if (location && !isVirtual) {
    description += ` Location: ${location}.`;
  } else if (isVirtual) {
    description += ' Virtual event.';
  }
  if (startDate) {
    const date = new Date(startDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    description += ` Starting ${date}.`;
  }

  const keywords = [
    eventName,
    organizer,
    category,
    location,
    ...tags,
    'event',
    'OneToOne',
  ].filter(Boolean) as string[];

  return generatePageMetadata({
    title: `${eventName} - ${organizer}`,
    description: description.slice(0, 160),
    url: eventUrl,
    image: coverImage,
    keywords,
    tenant: tenantName && tenantSubdomain ? {
      name: tenantName,
      subdomain: tenantSubdomain,
    } : undefined,
  });
}

/**
 * Get canonical URL for a path
 */
export function getCanonicalUrl(path: string, tenantSubdomain?: string): string {
  const baseUrl = tenantSubdomain
    ? `https://${tenantSubdomain}.1i1.ae`
    : SITE_URL;

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
}
