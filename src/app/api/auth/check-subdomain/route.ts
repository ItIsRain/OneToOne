import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const reservedSubdomains = [
  "admin", "api", "www", "mail", "smtp", "ftp", "blog", "shop", "store",
  "app", "dashboard", "portal", "support", "help", "docs", "status",
  "billing", "account", "login", "signup", "register", "auth",
  "cdn", "assets", "static", "media", "images", "files",
  "test", "staging", "dev", "demo", "sandbox",
];

export async function POST(request: Request) {
  try {
    // Rate limit: 20 checks per IP per minute
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit({
      key: "check-subdomain",
      identifier: ip,
      maxRequests: 20,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds!);
    }

    const { subdomain } = await request.json();

    if (!subdomain) {
      return NextResponse.json({ available: false, error: "Subdomain is required" });
    }

    // Must be at least 3 characters
    if (subdomain.length < 3) {
      return NextResponse.json({ available: false, error: "Must be at least 3 characters" });
    }

    // Format check
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)) {
      return NextResponse.json({ available: false, error: "Only lowercase letters, numbers, and hyphens allowed" });
    }

    // Reserved check
    if (reservedSubdomains.includes(subdomain)) {
      return NextResponse.json({ available: false, error: "This subdomain is reserved" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isSupabaseConfigured = supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http");

    if (!isSupabaseConfigured) {
      return NextResponse.json({ available: true });
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check reserved_subdomains table
    const { data: reserved } = await supabase
      .from("reserved_subdomains")
      .select("subdomain")
      .eq("subdomain", subdomain.toLowerCase())
      .single();

    if (reserved) {
      return NextResponse.json({ available: false, error: "This subdomain is not available" });
    }

    // Check existing tenants
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (existingTenant) {
      return NextResponse.json({ available: false, error: "This subdomain is already taken" });
    }

    return NextResponse.json({ available: true });
  } catch {
    return NextResponse.json({ available: false, error: "Unable to verify" }, { status: 500 });
  }
}
