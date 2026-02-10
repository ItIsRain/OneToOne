import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// PATCH - Update API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();
    const { name, permissions, is_active, expires_at } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        id,
        name,
        key_prefix,
        permissions,
        last_used_at,
        expires_at,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error("Error updating API key:", error);
      return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      apiKey,
      message: is_active === false ? "API key revoked" : "API key updated successfully",
    });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Error deleting API key:", error);
      return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
