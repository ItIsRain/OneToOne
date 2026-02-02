import { NextResponse } from "next/server";
import { getPortalServiceClient, getPortalAuthHeaders, hashSessionToken } from "@/lib/portal-auth";

// POST - Portal client logout (server-side session invalidation)
export async function POST(request: Request) {
  try {
    const { portalClientId, sessionToken } = getPortalAuthHeaders(request);

    if (portalClientId && sessionToken) {
      const supabase = getPortalServiceClient();
      const tokenHash = hashSessionToken(sessionToken);

      // Clear the session token in the database so it can't be reused
      await supabase
        .from("portal_clients")
        .update({
          session_token: null,
          session_token_expires_at: null,
        })
        .eq("id", portalClientId)
        .eq("session_token", tokenHash);
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Portal logout error:", error);
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  }
}
