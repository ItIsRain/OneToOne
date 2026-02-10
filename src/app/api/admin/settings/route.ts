import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(request: Request): Promise<{ authorized: boolean; error?: string; email?: string }> {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return { authorized: false, error: "Unauthorized" };
  }

  const serviceClient = getServiceClient();

  // Get user's email from profiles
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email) {
    return { authorized: false, error: "Unauthorized" };
  }

  const { data: adminRecord } = await serviceClient
    .from("platform_admins")
    .select("id")
    .eq("email", profile.email.toLowerCase())
    .maybeSingle();

  if (!adminRecord) {
    return { authorized: false, error: "Forbidden" };
  }

  return { authorized: true, email: profile.email };
}

export async function GET(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const serviceClient = getServiceClient();

  try {
    const { data: admins, error } = await serviceClient
      .from("platform_admins")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ admins: admins || [], currentUserEmail: authCheck.email });
  } catch (err) {
    console.error("Error fetching admins:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const serviceClient = getServiceClient();

  try {
    const { email, name } = await request.json();

    const { error } = await serviceClient
      .from("platform_admins")
      .insert({
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This email is already an admin" }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error adding admin:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const serviceClient = getServiceClient();

  try {
    const { id, email } = await request.json();

    // Prevent removing yourself
    if (email.toLowerCase() === authCheck.email?.toLowerCase()) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    // Check if this is the last admin
    const { count } = await serviceClient
      .from("platform_admins")
      .select("*", { count: "exact", head: true });

    if (count && count <= 1) {
      return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
    }

    const { error } = await serviceClient
      .from("platform_admins")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing admin:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
