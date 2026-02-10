import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ isAdmin: false, reason: "not_authenticated" });
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's email from profiles
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.email) {
      return NextResponse.json({ isAdmin: false, reason: "not_authenticated" });
    }

    const userEmail = profile.email.toLowerCase();

    // Check if user email exists in platform_admins table
    const { data: adminRecord, error } = await serviceClient
      .from("platform_admins")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (error) {
      console.error("Error checking admin status:", error);
      return NextResponse.json({ isAdmin: false, reason: "db_error" });
    }

    if (!adminRecord) {
      return NextResponse.json({ isAdmin: false, reason: "not_admin" });
    }

    return NextResponse.json({ isAdmin: true, email: userEmail });
  } catch (err) {
    console.error("Admin check error:", err);
    return NextResponse.json({ isAdmin: false, reason: "error" });
  }
}
