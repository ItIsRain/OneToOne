import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/signin",
    "/signup",
    "/subscribe",
    "/error-404",
    "/api/auth",
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
