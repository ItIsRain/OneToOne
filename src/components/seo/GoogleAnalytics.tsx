'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

/**
 * Google Analytics 4 component
 *
 * Add to your root layout to enable analytics tracking.
 * Set NEXT_PUBLIC_GA_MEASUREMENT_ID in your environment variables.
 *
 * @example
 * // In layout.tsx
 * <GoogleAnalytics measurementId="G-XXXXXXXXXX" />
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Don't render if no measurement ID
  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track custom events in Google Analytics
 *
 * @example
 * trackEvent('sign_up', { method: 'email' });
 * trackEvent('purchase', { value: 99.99, currency: 'USD' });
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag('event', eventName, eventParams);
  }
}

/**
 * Track page views manually (for SPAs)
 */
export function trackPageView(url: string, title?: string) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag('event', 'page_view', {
      page_path: url,
      page_title: title,
    });
  }
}

export default GoogleAnalytics;
