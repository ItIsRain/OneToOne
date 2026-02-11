import { createBrowserClient } from "@supabase/ssr";

function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  // For *.1i1.ae subdomains, share cookies across all subdomains
  if (host === "1i1.ae" || host.endsWith(".1i1.ae")) {
    return ".1i1.ae";
  }
  // For *.localhost subdomains, share cookies across all localhost subdomains
  if (host === "localhost" || host.endsWith(".localhost")) {
    return ".localhost";
  }
  return undefined;
}

/**
 * Parse all cookies from document.cookie into an array of { name, value }
 */
function getAllCookies(): Array<{ name: string; value: string }> {
  if (typeof document === "undefined") return [];
  return document.cookie.split(";").map((c) => {
    const [name, ...rest] = c.trim().split("=");
    return { name, value: rest.join("=") };
  }).filter((c) => c.name);
}

/**
 * Set cookies with explicit domain for cross-subdomain sharing
 */
function setAllCookies(
  cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>
) {
  if (typeof document === "undefined") return;

  const domain = getCookieDomain();
  const isSecure = window.location.protocol === "https:";

  cookies.forEach(({ name, value, options }) => {
    const maxAge = options?.maxAge as number | undefined;

    // Build cookie string with explicit domain
    let cookieStr = `${name}=${value}; Path=/; SameSite=Lax`;
    if (domain) cookieStr += `; Domain=${domain}`;
    if (isSecure) cookieStr += "; Secure";
    if (maxAge !== undefined) cookieStr += `; Max-Age=${maxAge}`;

    document.cookie = cookieStr;
  });
}

export function createClient() {
  const cookieDomain = getCookieDomain();
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Use custom cookie handlers to ensure domain is always set correctly
      cookies: {
        getAll: getAllCookies,
        setAll: setAllCookies,
      },
      // Also set cookieOptions as fallback
      cookieOptions: {
        domain: cookieDomain,
        path: "/",
        sameSite: "lax",
        secure: isSecure,
      },
    }
  );

  // Prevent infinite token-refresh loop. When a refresh token is invalid,
  // Supabase's internal Realtime auth listener creates a cycle:
  //   _removeSession → _notifyAllSubscribers → _handleTokenChanged →
  //   realtime.setAuth → _performAuth → getSession → refresh → fail → repeat
  // Neutralizing setAuth breaks this cycle. Safe because we don't use
  // Realtime channels anywhere in this codebase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client.realtime as any).setAuth = () => {};

  return client;
}
