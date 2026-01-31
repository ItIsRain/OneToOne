import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getMainDomains, extractSubdomain, getCookieDomain, getMainUrl, isLocalDev } from "@/lib/url";

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
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
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

  // ── CSRF: Origin check for state-changing requests ──
  const CSRF_EXEMPT = ["/api/stripe/webhook", "/api/cron"];
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    pathname.startsWith("/api/") &&
    !CSRF_EXEMPT.some((p) => pathname.startsWith(p))
  ) {
    const origin = request.headers.get("origin");
    if (origin) {
      const originHost = new URL(origin).hostname;
      const host = hostname.split(":")[0];
      const baseDomain = isLocalDev() ? "localhost" : "1i1.ae";
      const isValidOrigin =
        originHost === host ||
        originHost === baseDomain ||
        originHost.endsWith(`.${baseDomain}`);
      if (!isValidOrigin) {
        return applySecurityHeaders(
          NextResponse.json({ error: "Forbidden" }, { status: 403 })
        );
      }
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isSupabaseConfigured = supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http");

  // ── Step 1: Tenant header injection (subdomain / custom domain) ──
  if (!isMainDomain && isSupabaseConfigured) {
    const serviceClient = createClient(supabaseUrl!, supabaseServiceKey!);

    let tenant = null;

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

      if (tenant && !tenant.custom_domain_verified) {
        return applySecurityHeaders(NextResponse.redirect(new URL("/unverified-domain", request.url)));
      }
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

  // ── Step 2: Public routes — return immediately, NO auth work ──
  if (isPublicRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // ── Step 3: Protected routes — create Supabase auth client ──
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

  // ── Step 4: Redirect to signin if not authenticated ──
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
    signinUrl.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(signinUrl);
    response.cookies.getAll().forEach((c) =>
      redirectResponse.cookies.set(c.name, c.value, {
        domain: cookieDomain ?? undefined,
        path: "/",
      })
    );
    return applySecurityHeaders(redirectResponse);
  }

  // ── Step 5: Subscription check (only for dashboard pages, not every API call) ──
  if (pathname.startsWith("/dashboard") && !isBypassSubscription(pathname)) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.tenant_id) {
        const { data: subscription } = await supabase
          .from("tenant_subscriptions")
          .select("plan_type, status")
          .eq("tenant_id", profile.tenant_id)
          .single();

        if (!subscription || subscription.status !== "active") {
          return NextResponse.redirect(new URL("/subscribe", request.url));
        }
      } else {
        return NextResponse.redirect(new URL("/subscribe", request.url));
      }
    } catch (error) {
      console.error("Middleware subscription check error:", error);
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
