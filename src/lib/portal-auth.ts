import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";

export function getPortalServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Hash a session token for storage (one-way).
 * We use SHA-256 since session tokens are high-entropy (UUIDs).
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validate a portal client by ID and session token.
 * Both must match for authentication to succeed.
 */
export async function validatePortalClient(
  supabase: ReturnType<typeof getPortalServiceClient>,
  portalClientId: string,
  sessionToken: string | null
) {
  if (!sessionToken) return null;

  const tokenHash = hashSessionToken(sessionToken);

  const { data, error } = await supabase
    .from("portal_clients")
    .select("id, client_id, tenant_id, name, email, is_active, session_token_expires_at")
    .eq("id", portalClientId)
    .eq("is_active", true)
    .eq("session_token", tokenHash)
    .single();

  if (error || !data) return null;

  // Check session token expiry
  if (data.session_token_expires_at && new Date(data.session_token_expires_at) < new Date()) {
    return null;
  }

  return data;
}

/**
 * Extract portal auth headers from a request.
 */
export function getPortalAuthHeaders(request: Request) {
  return {
    portalClientId: request.headers.get("x-portal-client-id"),
    sessionToken: request.headers.get("x-portal-session-token"),
  };
}
