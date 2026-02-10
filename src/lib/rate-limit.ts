import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── In-memory rate limit cache ──
// Reduces DB queries by caching recent rate limit checks
// Cache is per-process, so in serverless each instance has its own cache
// This is fine - it just means rate limits might be slightly more lenient
interface RateLimitCacheEntry {
  count: number;
  windowStart: number;
  lastUpdated: number;
}
const rateLimitCache = new Map<string, RateLimitCacheEntry>();
const CACHE_TTL_MS = 5000; // 5 seconds - short TTL to stay accurate

function getCacheKey(key: string, identifier: string): string {
  return `${key}:${identifier}`;
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
 * Check rate limit using in-memory cache + Supabase fallback.
 * Uses cache to reduce DB round-trips for repeated checks.
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { key, identifier, maxRequests, windowSeconds } = config;
  const now = Date.now();
  const windowStartMs = now - windowSeconds * 1000;
  const cacheKey = getCacheKey(key, identifier);

  // Check in-memory cache first
  const cached = rateLimitCache.get(cacheKey);
  if (cached && cached.lastUpdated > now - CACHE_TTL_MS && cached.windowStart >= windowStartMs) {
    // Cache is fresh and within the same window
    if (cached.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((cached.windowStart + windowSeconds * 1000 - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }
    // Optimistically increment cache and allow
    cached.count++;
    cached.lastUpdated = now;
  }

  // Cache miss or stale - query DB
  const supabase = getServiceClient();
  const windowStart = new Date(windowStartMs).toISOString();

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

  // Update cache with DB result
  rateLimitCache.set(cacheKey, {
    count: currentCount,
    windowStart: windowStartMs,
    lastUpdated: now,
  });

  // Limit cache size
  if (rateLimitCache.size > 10000) {
    const firstKey = rateLimitCache.keys().next().value;
    if (firstKey) rateLimitCache.delete(firstKey);
  }

  if (currentCount >= maxRequests) {
    const retryAfterSeconds = Math.ceil(windowSeconds - (now - windowStartMs) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Record this request - fire and forget for speed, but await to ensure it's queued
  supabase.from("rate_limits").insert({
    key,
    identifier,
    created_at: new Date().toISOString(),
  }).then(({ error }) => {
    if (error) console.error("Rate limit insert error:", error);
  });

  // Increment cache optimistically
  const entry = rateLimitCache.get(cacheKey);
  if (entry) {
    entry.count++;
    entry.lastUpdated = now;
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
