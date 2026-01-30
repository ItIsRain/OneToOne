import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getMainDomains, extractSubdomain, getCookieDomain, getMainUrl, isLocalDev } from "@/lib/url";

// Parse hostname and detect tenant context
function parseHostname(hostname: string): {
  isMainDomain: boolean;
  subdomain: string | null;
  isCustomDomain: boolean;
} {
  const host = hostname.split(":")[0];
  const mainDomains = getMainDomains();

  // Check if it's a main domain
  if (mainDomains.includes(host)) {
    return { isMainDomain: true, subdomain: null, isCustomDomain: false };
  }

  // Check for subdomain (handles both production .1i1.ae and local .localhost)
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    return { isMainDomain: false, subdomain, isCustomDomain: false };
  }

  // If hostname wasn't recognized as main or subdomain, it's a custom domain
  // (but skip localhost without subdomain)
  if (host === "localhost" || host === "127.0.0.1") {
    return { isMainDomain: true, subdomain: null, isCustomDomain: false };
  }

  return { isMainDomain: false, subdomain: null, isCustomDomain: true };
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Parse the hostname to detect tenant context
  const { isMainDomain, subdomain, isCustomDomain } = parseHostname(hostname);

  // Create a service client for tenant lookup (only when needed)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isSupabaseConfigured = supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http");

  // Handle subdomain or custom domain routing
  if (!isMainDomain && isSupabaseConfigured) {
    const serviceClient = createClient(supabaseUrl!, supabaseServiceKey!);

    let tenant = null;

    if (subdomain) {
      // Lookup tenant by subdomain
      const { data } = await serviceClient
        .from("tenants")
        .select("id, subdomain, name, logo_url, primary_color, custom_domain, custom_domain_verified")
        .eq("subdomain", subdomain)
        .single();
      tenant = data;
    } else if (isCustomDomain) {
      // Lookup tenant by custom domain
      const customDomain = hostname.split(":")[0]; // Remove port
      const { data } = await serviceClient
        .from("tenants")
        .select("id, subdomain, name, logo_url, primary_color, custom_domain, custom_domain_verified")
        .eq("custom_domain", customDomain)
        .single();
      tenant = data;

      // If domain exists but not verified, redirect to unverified page
      if (tenant && !tenant.custom_domain_verified) {
        return NextResponse.redirect(new URL("/unverified-domain", request.url));
      }
    }

    // If no tenant found for subdomain, redirect to invalid subdomain page
    if (!tenant) {
      if (subdomain || isCustomDomain) {
        return NextResponse.redirect(new URL("/invalid-subdomain", getMainUrl()));
      }
    }

    // Inject tenant context headers for downstream use
    if (tenant) {
      requestHeaders.set("x-tenant-id", tenant.id);
      requestHeaders.set("x-tenant-subdomain", tenant.subdomain);
      requestHeaders.set("x-tenant-name", tenant.name);
      if (tenant.logo_url) {
        requestHeaders.set("x-tenant-logo", tenant.logo_url);
      }
      if (tenant.primary_color) {
        requestHeaders.set("x-tenant-color", tenant.primary_color);
      }

      // Portal pages (/, /events) are public on tenant subdomains — no redirect
    }
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Determine cookie domain for cross-subdomain auth
  const cookieDomain = getCookieDomain(hostname);

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
            request: {
              headers: requestHeaders,
            },
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

  // Local dev: auto-detect tenant from authenticated user so localhost:3000/ shows the portal
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

          // Preserve existing cookies (including refreshed auth tokens) before
          // replacing the response object with one that has updated headers.
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

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
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
    "/form",
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/") || pathname.startsWith("/api/auth")
  );

  // API routes that should bypass subscription check
  const bypassApiRoutes = [
    "/api/settings/billing",
    "/api/subscription",
    "/api/discount-codes",
    "/api/events/public",
  ];

  const isBypassApiRoute = bypassApiRoutes.some((route) => pathname.startsWith(route));

  // Allow public routes
  if (isPublicRoute) {
    return response;
  }

  // Redirect to signin if not authenticated
  if (!user) {
    // For API routes, return JSON instead of HTML redirect
    if (pathname.startsWith("/api/")) {
      const apiResponse = NextResponse.json(
        { error: "Unauthorized", redirect: "/signin" },
        { status: 401 }
      );
      // Carry over any cookie-clearing headers from failed token refresh
      response.cookies.getAll().forEach((c) =>
        apiResponse.cookies.set(c.name, c.value, {
          domain: cookieDomain ?? undefined,
          path: "/",
        })
      );
      return apiResponse;
    }
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(signinUrl);
    // Carry over any cookie-clearing headers from failed token refresh
    response.cookies.getAll().forEach((c) =>
      redirectResponse.cookies.set(c.name, c.value, {
        domain: cookieDomain ?? undefined,
        path: "/",
      })
    );
    return redirectResponse;
  }

  // Allow bypass API routes (used for subscription management)
  if (isBypassApiRoute) {
    return response;
  }

  // Check subscription for protected routes (dashboard, etc.)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/")) {
    try {
      // Get user's profile to find tenant_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.tenant_id) {
        // Check subscription status
        const { data: subscription } = await supabase
          .from("tenant_subscriptions")
          .select("plan_type, status")
          .eq("tenant_id", profile.tenant_id)
          .single();

        // If no subscription or inactive, redirect to subscribe page
        // Note: "free" plan is allowed - only require subscription selection for new users
        if (!subscription || subscription.status !== "active") {
          // For API routes, return 403
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              { error: "Subscription required", redirect: "/subscribe" },
              { status: 403 }
            );
          }
          // For pages, redirect to subscribe
          return NextResponse.redirect(new URL("/subscribe", request.url));
        }
      } else {
        // No profile/tenant - redirect to subscribe
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Account setup required", redirect: "/subscribe" },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/subscribe", request.url));
      }
    } catch (error) {
      console.error("Middleware subscription check error:", error);
      // On error, allow access but log it
    }
  }

  return response;
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
