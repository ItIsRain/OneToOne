import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getMainDomains, extractSubdomain, getCookieDomain, getMainUrl, isLocalDev } from "@/lib/url";

// ── Tenant cache (in-memory with TTL) ──
// Reduces DB queries from every request to once per 2 minutes per subdomain
interface TenantCache {
  data: {
    id: string;
    subdomain: string;
    name: string;
    logo_url: string | null;
    primary_color: string | null;
    custom_domain: string | null;
    custom_domain_verified: boolean | null;
  };
  expiresAt: number;
}
const tenantCache = new Map<string, TenantCache>();
const TENANT_CACHE_TTL = 120000; // 2 minutes

function getCachedTenant(key: string): TenantCache["data"] | null {
  const cached = tenantCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  if (cached) tenantCache.delete(key);
  return null;
}

function setCachedTenant(key: string, data: TenantCache["data"]): void {
  // Limit cache size to prevent memory issues
  if (tenantCache.size > 1000) {
    const firstKey = tenantCache.keys().next().value;
    if (firstKey) tenantCache.delete(firstKey);
  }
  tenantCache.set(key, { data, expiresAt: Date.now() + TENANT_CACHE_TTL });
}

// ── Subscription cache token helpers ──
// Uses HMAC to sign the token so it can't be forged by clients
async function createSubCacheToken(userId: string, tenantId: string, secret: string): Promise<string> {
  const expiresAt = Date.now() + 300000; // 5 minutes
  const payload = `${userId}:${tenantId}:${expiresAt}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${payload}:${sigHex}`;
}

async function verifySubCacheToken(
  token: string,
  userId: string,
  secret: string
): Promise<{ valid: boolean; tenantId?: string }> {
  try {
    const parts = token.split(":");
    if (parts.length !== 4) return { valid: false };
    const [tokenUserId, tokenTenantId, expiresAtStr, sigHex] = parts;

    // Verify user matches (tenant is verified via signature)
    if (tokenUserId !== userId) return { valid: false };

    // Check expiration
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return { valid: false };

    // Verify signature
    const payload = `${tokenUserId}:${tokenTenantId}:${expiresAtStr}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = new Uint8Array(sigHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
    return isValid ? { valid: true, tenantId: tokenTenantId } : { valid: false };
  } catch {
    return { valid: false };
  }
}

// Public routes that NEVER require authentication.
// Checked early so we skip all auth work for these paths.
const PUBLIC_PREFIXES = [
  "/signin",
  "/signup",
  "/subscribe",
  "/reset-password",
  "/update-password",
  "/error-404",
  "/invalid-subdomain",
  "/unverified-domain",
  "/api/auth",
  "/api/stripe/webhook",
  "/api/cron",
  "/events",
  "/event",
  "/judge",
  "/share",
  "/api/portal",
  "/api/events/public",
  "/api/forms/public",
  "/api/proposals/public",
  "/api/contracts/public",
  "/form",
  "/proposal",
  "/contract",
  "/book",
  "/api/book",
  "/invoice",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  // Public invoice view: /api/invoices/{id}/public
  if (/^\/api\/invoices\/[^/]+\/public$/.test(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// API routes that bypass subscription check
const BYPASS_SUBSCRIPTION_PREFIXES = [
  "/api/settings/billing",
  "/api/subscription",
  "/api/discount-codes",
  "/api/events/public",
  "/api/stripe",
  "/api/profile",
  "/api/tenant/info",
];

function isBypassSubscription(pathname: string): boolean {
  return BYPASS_SUBSCRIPTION_PREFIXES.some((route) => pathname.startsWith(route));
}

// Parse hostname and detect tenant context
function parseHostname(hostname: string): {
  isMainDomain: boolean;
  subdomain: string | null;
  isCustomDomain: boolean;
} {
  const host = hostname.split(":")[0];
  const mainDomains = getMainDomains();

  if (mainDomains.includes(host)) {
    return { isMainDomain: true, subdomain: null, isCustomDomain: false };
  }

  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    return { isMainDomain: false, subdomain, isCustomDomain: false };
  }

  if (host === "localhost" || host === "127.0.0.1") {
    return { isMainDomain: true, subdomain: null, isCustomDomain: false };
  }

  return { isMainDomain: false, subdomain: null, isCustomDomain: true };
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );
  if (!isLocalDev()) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  const { isMainDomain, subdomain, isCustomDomain } = parseHostname(hostname);

  // ── CSRF: Origin/Referer check for state-changing requests ──
  // Exempt webhooks, cron jobs, and public endpoints that accept cross-origin requests
  // Public endpoints are protected by rate limiting instead
  const CSRF_EXEMPT = [
    "/api/stripe/webhook",
    "/api/cron",
    "/api/portal/auth",
    "/api/forms/public",    // Public form submissions (rate limited)
    "/api/book",            // Booking submissions (rate limited)
    "/api/events/public",   // Event registration (rate limited)
    "/api/contracts/public", // Contract viewing/signing (rate limited)
    "/api/proposals/public", // Proposal viewing (rate limited)
  ];
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    pathname.startsWith("/api/") &&
    !CSRF_EXEMPT.some((p) => pathname.startsWith(p))
  ) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const sourceUrl = origin || referer;

    if (!sourceUrl) {
      // No Origin or Referer — block the request (browsers always send at least one)
      return applySecurityHeaders(
        NextResponse.json({ error: "Forbidden" }, { status: 403 })
      );
    }

    try {
      const sourceHost = new URL(sourceUrl).hostname;
      const host = hostname.split(":")[0];
      const baseDomain = isLocalDev() ? "localhost" : "1i1.ae";
      const isValidOrigin =
        sourceHost === host ||
        sourceHost === baseDomain ||
        sourceHost.endsWith(`.${baseDomain}`);
      if (!isValidOrigin) {
        return applySecurityHeaders(
          NextResponse.json({ error: "Forbidden" }, { status: 403 })
        );
      }
    } catch {
      return applySecurityHeaders(
        NextResponse.json({ error: "Forbidden" }, { status: 403 })
      );
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isSupabaseConfigured = supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http");

  // ── Step 1: Tenant header injection (subdomain / custom domain) ──
  if (!isMainDomain && isSupabaseConfigured) {
    let tenant = null;
    const cacheKey = subdomain ? `sub:${subdomain}` : isCustomDomain ? `dom:${hostname.split(":")[0]}` : null;

    // Try cache first
    if (cacheKey) {
      tenant = getCachedTenant(cacheKey);
    }

    // Cache miss - query database
    if (!tenant && cacheKey) {
      const serviceClient = createClient(supabaseUrl!, supabaseServiceKey!);

      if (subdomain) {
        const { data } = await serviceClient
          .from("tenants")
          .select("id, subdomain, name, logo_url, primary_color, custom_domain, custom_domain_verified")
          .eq("subdomain", subdomain)
          .single();
        tenant = data;
      } else if (isCustomDomain) {
        const customDomain = hostname.split(":")[0];
        const { data } = await serviceClient
          .from("tenants")
          .select("id, subdomain, name, logo_url, primary_color, custom_domain, custom_domain_verified")
          .eq("custom_domain", customDomain)
          .single();
        tenant = data;
      }

      // Cache the result (even null for invalid subdomains - but with shorter TTL)
      if (tenant) {
        setCachedTenant(cacheKey, tenant);
      }
    }

    if (isCustomDomain && tenant && !tenant.custom_domain_verified) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/unverified-domain", request.url)));
    }

    if (!tenant && (subdomain || isCustomDomain)) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/invalid-subdomain", getMainUrl())));
    }

    if (tenant) {
      requestHeaders.set("x-tenant-id", tenant.id);
      requestHeaders.set("x-tenant-subdomain", tenant.subdomain);
      requestHeaders.set("x-tenant-name", tenant.name);
      if (tenant.logo_url) requestHeaders.set("x-tenant-logo", tenant.logo_url);
      if (tenant.primary_color) requestHeaders.set("x-tenant-color", tenant.primary_color);
    }
  }

  // ── Step 2: Redirect authenticated users away from auth pages ──
  const AUTH_PAGES = ["/signin", "/signup"];
  if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/")) && isSupabaseConfigured) {
    const cookieDomainAuth = getCookieDomain(hostname);
    let authCheckResponse = NextResponse.next({ request: { headers: requestHeaders } });
    const authCheckClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            authCheckResponse = NextResponse.next({ request: { headers: requestHeaders } });
            cookiesToSet.forEach(({ name, value, options }) =>
              authCheckResponse.cookies.set(name, value, {
                ...options,
                domain: cookieDomainAuth ?? options?.domain,
                path: "/",
              })
            );
          },
        },
      }
    );
    const { data: { user: existingUser } } = await authCheckClient.auth.getUser();
    if (existingUser) {
      // Look up tenant subdomain so we redirect to tenantslug.1i1.ae/dashboard
      let dashboardUrl = new URL("/dashboard", request.url);
      if (isSupabaseConfigured) {
        try {
          const svc = createClient(supabaseUrl!, supabaseServiceKey!);
          const { data: prof } = await svc
            .from("profiles")
            .select("tenant_id")
            .eq("id", existingUser.id)
            .single();
          if (prof?.tenant_id) {
            const { data: t } = await svc
              .from("tenants")
              .select("subdomain")
              .eq("id", prof.tenant_id)
              .single();
            if (t?.subdomain && !isLocalDev()) {
              // Check if user is trying to access a different tenant's subdomain
              if (subdomain && subdomain !== t.subdomain) {
                // User is on wrong tenant subdomain - redirect to their own tenant with a hint
                const url = new URL(request.url);
                const redirectUrl = new URL(
                  `${url.protocol}//${t.subdomain}.${url.host.split(":")[0].replace(`${subdomain}.`, "")}${url.port ? ":" + url.port : ""}/dashboard`
                );
                redirectUrl.searchParams.set("from_tenant", subdomain);
                dashboardUrl = redirectUrl;
              } else {
                const url = new URL(request.url);
                dashboardUrl = new URL(`${url.protocol}//${t.subdomain}.${url.host.split(":")[0]}${url.port ? ":" + url.port : ""}/dashboard`);
              }
            }
          }
        } catch {
          // Fall back to /dashboard on current domain
        }
      }
      const redirectResponse = NextResponse.redirect(dashboardUrl);
      authCheckResponse.cookies.getAll().forEach((c) =>
        redirectResponse.cookies.set(c.name, c.value, {
          domain: cookieDomainAuth ?? undefined,
          path: "/",
        })
      );
      return applySecurityHeaders(redirectResponse);
    }
  }

  // ── Step 3: Public routes — return immediately, NO auth work ──
  if (isPublicRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // ── Step 4: Protected routes — create Supabase auth client ──
  const cookieDomain = getCookieDomain(hostname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              domain: cookieDomain ?? options?.domain,
              path: "/",
            })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Pass user ID to downstream routes to avoid redundant getUser() calls
  if (user) {
    requestHeaders.set("x-user-id", user.id);
  }

  // ── Local dev: auto-detect tenant from authenticated user ──
  if (isMainDomain && isLocalDev() && user && !requestHeaders.has("x-tenant-id") && isSupabaseConfigured) {
    try {
      const serviceClient = createClient(supabaseUrl!, supabaseServiceKey!);
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.tenant_id) {
        const { data: tenant } = await serviceClient
          .from("tenants")
          .select("id, subdomain, name, logo_url, primary_color")
          .eq("id", profile.tenant_id)
          .single();

        if (tenant) {
          requestHeaders.set("x-tenant-id", tenant.id);
          requestHeaders.set("x-tenant-subdomain", tenant.subdomain || "");
          requestHeaders.set("x-tenant-name", tenant.name || "");
          if (tenant.logo_url) requestHeaders.set("x-tenant-logo", tenant.logo_url);
          if (tenant.primary_color) requestHeaders.set("x-tenant-color", tenant.primary_color);

          const existingCookies = response.cookies.getAll();
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          existingCookies.forEach((c) => response.cookies.set(c.name, c.value));
        }
      }
    } catch (e) {
      console.error("Local dev tenant auto-detect error:", e);
    }
  }

  // ── Step 5: Redirect to signin if not authenticated ──
  if (!user) {
    if (pathname.startsWith("/api/")) {
      const apiResponse = NextResponse.json(
        { error: "Unauthorized", redirect: "/signin" },
        { status: 401 }
      );
      response.cookies.getAll().forEach((c) =>
        apiResponse.cookies.set(c.name, c.value, {
          domain: cookieDomain ?? undefined,
          path: "/",
        })
      );
      return applySecurityHeaders(apiResponse);
    }
    const signinUrl = new URL("/signin", request.url);
    // Preserve full path including query params so user returns to exact location
    const redirectPath = request.nextUrl.search
      ? `${pathname}${request.nextUrl.search}`
      : pathname;
    signinUrl.searchParams.set("redirect", redirectPath);
    const redirectResponse = NextResponse.redirect(signinUrl);
    response.cookies.getAll().forEach((c) =>
      redirectResponse.cookies.set(c.name, c.value, {
        domain: cookieDomain ?? undefined,
        path: "/",
      })
    );
    return applySecurityHeaders(redirectResponse);
  }

  // ── Step 6: Subscription check (only for dashboard pages, not every API call) ──
  // Uses a short-lived signed cookie cache to avoid querying the DB on every request
  // (including RSC data fetches), which can cause a redirect/refresh loop when
  // the auth token refresh sets new cookies and invalidates the Router Cache.
  // The cookie is HMAC-signed to prevent client-side forgery.
  if (pathname.startsWith("/dashboard") && !isBypassSubscription(pathname)) {
    const subCacheCookie = request.cookies.get("1i1_sub_ok");

    // Try to verify the cached token first (no DB call needed if valid)
    if (subCacheCookie?.value && supabaseServiceKey) {
      const tokenResult = await verifySubCacheToken(
        subCacheCookie.value,
        user.id,
        supabaseServiceKey
      );
      if (tokenResult.valid) {
        // Token is valid and not expired - subscription was recently verified
        return applySecurityHeaders(response);
      }
    }

    // Token missing, invalid, or expired - verify subscription from DB
    try {
      const serviceClient = isSupabaseConfigured
        ? createClient(supabaseUrl!, supabaseServiceKey!)
        : null;
      const queryClient = serviceClient || supabase;

      const { data: profile } = await queryClient
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) {
        const subscribeUrl = new URL("/subscribe", request.url);
        const redirectResponse = NextResponse.redirect(subscribeUrl);
        response.cookies.getAll().forEach((c) =>
          redirectResponse.cookies.set(c.name, c.value, {
            domain: cookieDomain ?? undefined,
            path: "/",
          })
        );
        return applySecurityHeaders(redirectResponse);
      }

      const { data: subscription } = await queryClient
        .from("tenant_subscriptions")
        .select("plan_type, status")
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (!subscription || subscription.status !== "active") {
        const subscribeUrl = new URL("/subscribe", request.url);
        const redirectResponse = NextResponse.redirect(subscribeUrl);
        response.cookies.getAll().forEach((c) =>
          redirectResponse.cookies.set(c.name, c.value, {
            domain: cookieDomain ?? undefined,
            path: "/",
          })
        );
        return applySecurityHeaders(redirectResponse);
      }

      // Subscription is valid — create signed cache token
      if (supabaseServiceKey) {
        const signedToken = await createSubCacheToken(user.id, profile.tenant_id, supabaseServiceKey);
        response.cookies.set("1i1_sub_ok", signedToken, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: !isLocalDev(),
          maxAge: 300, // 5 minutes
          ...(cookieDomain ? { domain: cookieDomain } : {}),
        });
      }
    } catch (error) {
      console.error("Middleware subscription check error:", error);
      // On error, allow through but don't cache — will retry next request
    }
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
