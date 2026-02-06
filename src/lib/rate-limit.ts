import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RateLimitConfig {
  /** Unique identifier for the rate limit (e.g., "send-otp", "login") */
  key: string;
  /** The value to rate limit on (e.g., IP address, email) */
  identifier: string;
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Check rate limit using Supabase.
 * Uses the rate_limits table to track request counts per identifier+key.
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const supabase = getServiceClient();
  const { key, identifier, maxRequests, windowSeconds } = config;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000).toISOString();

  // Count requests in the current window
  const { count, error: countError } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("key", key)
    .eq("identifier", identifier)
    .gte("created_at", windowStart);

  if (countError) {
    // Fail open — allow the request if rate limiting check fails
    return { allowed: true, remaining: maxRequests };
  }

  const currentCount = count || 0;

  if (currentCount >= maxRequests) {
    // Find the oldest request in the window to calculate retry-after
    const { data: oldest } = await supabase
      .from("rate_limits")
      .select("created_at")
      .eq("key", key)
      .eq("identifier", identifier)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    const retryAfterSeconds = oldest
      ? Math.ceil((new Date(oldest.created_at).getTime() + windowSeconds * 1000 - now.getTime()) / 1000)
      : windowSeconds;

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Record this request - must succeed for rate limiting to work
  const { error: insertError } = await supabase.from("rate_limits").insert({
    key,
    identifier,
    created_at: now.toISOString(),
  });

  if (insertError) {
    // Fail closed - if we can't track the request, don't allow it
    // This prevents bypass via database errors
    console.error("Rate limit insert error:", insertError);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 5, // Short retry to allow transient errors to resolve
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
  };
}

// Simple IP address format validation (IPv4 and IPv6)
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false; // Max IPv6 length is 45 chars
  return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
}

/**
 * Helper to extract client IP from request headers.
 *
 * Security notes:
 * - x-forwarded-for is only trusted because we deploy behind Vercel/trusted proxies
 * - IP format is validated to prevent header injection attacks
 * - Fallback uses user-agent hash to prevent all unknown IPs sharing one bucket
 */
export function getClientIp(request: Request): string {
  // Cloudflare connecting IP (most trustworthy when behind Cloudflare)
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp.trim())) {
    return cfIp.trim();
  }

  // x-forwarded-for from trusted proxies (Vercel, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take only the first IP (client IP in a chain)
    const clientIp = forwarded.split(",")[0].trim();
    if (isValidIp(clientIp)) {
      return clientIp;
    }
  }

  // x-real-ip header
  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // Fallback: Create a deterministic identifier from request characteristics
  // This prevents all unknown clients from sharing a single rate limit bucket
  const userAgent = request.headers.get("user-agent") || "";
  const acceptLang = request.headers.get("accept-language") || "";
  // Use a simple hash of stable request characteristics
  const fallback = `unknown:${hashString(userAgent + acceptLang)}`;
  return fallback;
}

/** Simple string hash for fallback identifier */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Returns a 429 Too Many Requests response.
 */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

/**
 * Clean up old rate limit entries. Call from a cron job.
 */
export async function cleanupRateLimits(olderThanHours: number = 1): Promise<void> {
  const supabase = getServiceClient();
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
  await supabase.from("rate_limits").delete().lt("created_at", cutoff);
}
