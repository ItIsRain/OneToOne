/**
 * SEO utilities for OneToOne
 *
 * This module provides comprehensive SEO tools including:
 * - Metadata generation for pages
 * - JSON-LD schema generation
 * - Constants and configuration
 */

// Re-export everything from submodules
export * from './constants';
export * from './metadata';
export * from './schemas';

// Default export with commonly used functions
export { generatePageMetadata, generateBookingMetadata, generateInvoiceMetadata, generateEventMetadata, getCanonicalUrl } from './metadata';
export { generateOrganizationSchema, generateWebSiteSchema, generateBreadcrumbSchema, generateEventSchema, generateServiceSchema, generateFAQSchema } from './schemas';
