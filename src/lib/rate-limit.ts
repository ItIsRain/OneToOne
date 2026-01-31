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

  // Record this request
  await supabase.from("rate_limits").insert({
    key,
    identifier,
    created_at: now.toISOString(),
  });

  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
  };
}

/**
 * Helper to extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
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
