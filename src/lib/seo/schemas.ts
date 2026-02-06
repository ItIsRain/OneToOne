/**
 * JSON-LD Schema generators for SEO
 */

import { SITE_URL, SITE_NAME, COMPANY_INFO, SOCIAL_HANDLES } from './constants';

// Type definitions for JSON-LD schemas
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface EventSchemaInput {
  name: string;
  description?: string;
  url: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isVirtual?: boolean;
  image?: string;
  organizer?: string;
  ticketPrice?: number;
  currency?: string;
  maxAttendees?: number;
}

export interface ServiceSchemaInput {
  name: string;
  description?: string;
  url: string;
  provider: string;
  providerUrl?: string;
  price?: number;
  currency?: string;
  duration?: number; // in minutes
  locationType?: 'video' | 'phone' | 'in_person' | 'custom';
}

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Organization schema for the main site
 */
export function generateOrganizationSchema(customData?: {
  name?: string;
  url?: string;
  logo?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: customData?.name || COMPANY_INFO.name,
    alternateName: ['One To One', '1i1', 'CloudLynq', 'Lunar Limited', 'Lunar Labs'],
    url: customData?.url || SITE_URL,
    logo: customData?.logo || COMPANY_INFO.logo,
    description: 'All-in-one business management platform for CRM, projects, events, finance, team, and documents.',
    founder: COMPANY_INFO.founders.map(f => ({
      '@type': 'Person',
      name: f.name,
      url: f.url,
    })),
    foundingDate: COMPANY_INFO.foundingDate,
    sameAs: [SOCIAL_HANDLES.instagram],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: SITE_URL,
    },
  };
}

/**
 * WebSite schema with SearchAction for sitelinks searchbox
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['1i1', 'One To One'],
    url: SITE_URL,
    description: 'All-in-one business management platform',
    publisher: {
      '@type': 'Organization',
      name: COMPANY_INFO.legalName,
      logo: {
        '@type': 'ImageObject',
        url: COMPANY_INFO.logo,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    alternateName: ['1i1', 'CloudLynq'],
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'All-in-one business management platform for CRM, projects, events, finance, team, and documents.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available',
    },
    author: {
      '@type': 'Organization',
      name: COMPANY_INFO.legalName,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

/**
 * Breadcrumb schema for navigation
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Event schema for event pages
 */
export function generateEventSchema(event: EventSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || `${event.name} - Event`,
    url: event.url,
    eventAttendanceMode: event.isVirtual
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: {
      '@type': 'Organization',
      name: event.organizer || SITE_NAME,
      url: SITE_URL,
    },
    image: event.image || COMPANY_INFO.logo,
  };

  if (event.startDate) schema.startDate = event.startDate;
  if (event.endDate) schema.endDate = event.endDate;

  if (event.location && !event.isVirtual) {
    schema.location = {
      '@type': 'Place',
      name: event.location,
      address: event.location,
    };
  } else if (event.isVirtual) {
    schema.location = {
      '@type': 'VirtualLocation',
      url: event.url,
    };
  }

  if (event.ticketPrice !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: String(event.ticketPrice),
      priceCurrency: event.currency || 'USD',
      url: event.url,
      availability: 'https://schema.org/InStock',
    };
  }

  if (event.maxAttendees) {
    schema.maximumAttendeeCapacity = event.maxAttendees;
  }

  return schema;
}

/**
 * Service schema for booking pages
 */
export function generateServiceSchema(service: ServiceSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description || `Book ${service.name}`,
    url: service.url,
    provider: {
      '@type': 'Organization',
      name: service.provider,
      url: service.providerUrl || SITE_URL,
    },
    serviceType: 'Appointment',
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
  };

  if (service.price !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: String(service.price),
      priceCurrency: service.currency || 'USD',
      url: service.url,
    };
  }

  if (service.duration) {
    schema.duration = `PT${service.duration}M`;
  }

  // Add location type info
  if (service.locationType) {
    const locationMap: Record<string, string> = {
      video: 'Online/Video Call',
      phone: 'Phone Call',
      in_person: 'In-Person Meeting',
      custom: 'Custom Location',
    };
    schema.availableChannel = {
      '@type': 'ServiceChannel',
      serviceType: locationMap[service.locationType] || 'Appointment',
    };
  }

  return schema;
}

/**
 * FAQ schema for FAQ sections
 */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * ItemList schema for event listings
 */
export function generateEventListSchema(events: Array<{ name: string; url: string; image?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: event.name,
        url: event.url,
        image: event.image || COMPANY_INFO.logo,
      },
    })),
  };
}

/**
 * Local Business schema for tenants with physical locations
 */
export function generateLocalBusinessSchema(business: {
  name: string;
  url: string;
  logo?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    url: business.url,
    logo: business.logo || COMPANY_INFO.logo,
    ...(business.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address,
        addressLocality: business.city,
        addressCountry: business.country,
      },
    }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.email && { email: business.email }),
  };
}
