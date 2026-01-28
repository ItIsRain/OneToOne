/**
 * URL utilities for handling tenant subdomain URLs across local and production environments.
 *
 * Uses NEXT_PUBLIC_APP_URL to determine the environment:
 *   - Local:      http://localhost:3000    → no subdomain routing
 *   - Production: https://1i1.ae           → subdomain routing (lunar.1i1.ae)
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function parseAppUrl() {
  try {
    return new URL(APP_URL);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function isLocalDev(): boolean {
  const url = parseAppUrl();
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

/** Base domain without protocol, e.g. "1i1.ae" or "localhost" */
export function getBaseDomain(): string {
  return parseAppUrl().hostname;
}

/**
 * Build a full URL for a tenant subdomain.
 *   Production: https://lunar.1i1.ae/dashboard
 *   Local:      http://localhost:3000/dashboard  (subdomains skipped)
 */
export function getTenantUrl(subdomain: string, path: string = "/"): string {
  const url = parseAppUrl();
  if (isLocalDev()) {
    return `${url.origin}${path}`;
  }
  return `${url.protocol}//${subdomain}.${url.host}${path}`;
}

/** Main site URL (no subdomain), e.g. https://1i1.ae/signup */
export function getMainUrl(path: string = "/"): string {
  return `${parseAppUrl().origin}${path}`;
}

/** Display suffix for subdomain input fields: ".1i1.ae" or ".localhost" */
export function getSubdomainSuffix(): string {
  return `.${getBaseDomain()}`;
}

/**
 * Cookie domain for cross-subdomain auth.
 *   Production: ".1i1.ae"  (shared across subdomains)
 *   Local:      undefined  (default browser behavior)
 */
export function getCookieDomain(hostname: string): string | undefined {
  const base = getBaseDomain();
  if (isLocalDev()) return undefined;
  const host = hostname.split(":")[0];
  if (host === base || host.endsWith(`.${base}`)) {
    return `.${base}`;
  }
  return undefined;
}

/**
 * Main domains that should NOT be treated as tenant subdomains.
 * Used by middleware for routing decisions.
 */
export function getMainDomains(): string[] {
  const base = getBaseDomain();
  if (isLocalDev()) {
    return ["localhost"];
  }
  return [base, `www.${base}`, `app.${base}`];
}

/**
 * Check if a hostname is a subdomain of the base domain.
 * Returns the subdomain part or null.
 */
export function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0];
  const base = getBaseDomain();

  // Check .1i1.ae subdomains (production)
  if (!isLocalDev() && host.endsWith(`.${base}`)) {
    const sub = host.replace(`.${base}`, "");
    const reserved = ["www", "app", "api", "portal"];
    if (reserved.includes(sub)) return null;
    return sub;
  }

  // Check .localhost subdomains (local dev)
  if (isLocalDev() && host.endsWith(".localhost")) {
    const sub = host.replace(".localhost", "");
    return sub;
  }

  return null;
}
