import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Main domains that should use normal routing (not tenant subdomain routing)
const MAIN_DOMAINS = ["1i1.ae", "www.1i1.ae", "app.1i1.ae", "localhost"];

// Parse hostname and detect tenant context
function parseHostname(hostname: string): {
  isMainDomain: boolean;
  subdomain: string | null;
  isCustomDomain: boolean;
} {
  // Remove port for local development
  const host = hostname.split(":")[0];

  // Check if it's a main domain
  if (MAIN_DOMAINS.includes(host)) {
    return { isMainDomain: true, subdomain: null, isCustomDomain: false };
  }

  // Check if it's a subdomain of 1i1.ae
  if (host.endsWith(".1i1.ae")) {
    const subdomain = host.replace(".1i1.ae", "");
    // Skip main subdomains (including portal which is the Cloudflare fallback origin)
    if (["www", "app", "api", "portal"].includes(subdomain)) {
      return { isMainDomain: true, subdomain: null, isCustomDomain: false };
    }
    return { isMainDomain: false, subdomain, isCustomDomain: false };
  }

  // Check for localhost subdomains (development)
  if (host.endsWith(".localhost")) {
    const subdomain = host.replace(".localhost", "");
    return { isMainDomain: false, subdomain, isCustomDomain: false };
  }

  // Otherwise, it's a custom domain
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
      if (subdomain) {
        return NextResponse.redirect(new URL("/invalid-subdomain", `https://1i1.ae`));
      } else if (isCustomDomain) {
        return NextResponse.redirect(new URL("/invalid-subdomain", `https://1i1.ae`));
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

      // For tenant subdomains, redirect root path to signin or dashboard
      if (pathname === "/") {
        // Check if user is authenticated
        const supabaseAuth = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll() {
                // No-op for this check
              },
            },
          }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (user) {
          // Authenticated - redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        } else {
          // Not authenticated - redirect to signin
          return NextResponse.redirect(new URL("/signin", request.url));
        }
      }
    }
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
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
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/signin",
    "/signup",
    "/subscribe",
    "/error-404",
    "/invalid-subdomain",
    "/unverified-domain",
    "/api/auth",
    "/api/stripe/webhook",
    "/event",
    "/judge",
    "/share",
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
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signinUrl);
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
