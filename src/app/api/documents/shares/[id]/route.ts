import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch a single share
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { data: share, error } = await supabase
      .from("file_shares")
      .select(`
        *,
        file:files(id, name, file_url, file_type, file_size, thumbnail_url, description),
        client:clients(id, name, email, company)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Fetch share error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    return NextResponse.json({ share });
  } catch (error) {
    console.error("Get share error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a share (revoke, update settings, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Get existing share
    const { data: existing } = await supabase
      .from("file_shares")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Handle revoke action
    if (body.action === "revoke") {
      updateData.status = "revoked";
      updateData.revoked_at = new Date().toISOString();
      updateData.revoked_by = userId;
      updateData.revocation_reason = body.reason || null;

      const { data: share, error } = await supabase
        .from("file_shares")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .select(`
          *,
          file:files(id, name, file_url, file_type, file_size, thumbnail_url),
          client:clients(id, name, email, company)
        `)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ share });
    }

    // Handle reactivate action
    if (body.action === "reactivate") {
      updateData.status = "active";
      updateData.revoked_at = null;
      updateData.revoked_by = null;
      updateData.revocation_reason = null;
      updateData.is_expired = false;

      const { data: share, error } = await supabase
        .from("file_shares")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .select(`
          *,
          file:files(id, name, file_url, file_type, file_size, thumbnail_url),
          client:clients(id, name, email, company)
        `)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ share });
    }

    // Regular field updates
    if (body.permission_level !== undefined) updateData.permission_level = body.permission_level;
    if (body.can_reshare !== undefined) updateData.can_reshare = body.can_reshare;
    if (body.can_comment !== undefined) updateData.can_comment = body.can_comment;
    if (body.expires_at !== undefined) updateData.expires_at = body.expires_at;
    if (body.max_downloads !== undefined) updateData.max_downloads = body.max_downloads;
    if (body.max_views !== undefined) updateData.max_views = body.max_views;
    if (body.message !== undefined) updateData.message = body.message;
    if (body.notify_on_access !== undefined) updateData.notify_on_access = body.notify_on_access;
    if (body.notify_on_download !== undefined) updateData.notify_on_download = body.notify_on_download;
    if (body.shared_with_name !== undefined) updateData.shared_with_name = body.shared_with_name;

    const { data: share, error } = await supabase
      .from("file_shares")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        file:files(id, name, file_url, file_type, file_size, thumbnail_url),
        client:clients(id, name, email, company)
      `)
      .single();

    if (error) {
      console.error("Update share error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ share });
  } catch (error) {
    console.error("Update share error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a share completely
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get share to find file_id
    const { data: share } = await supabase
      .from("file_shares")
      .select("file_id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    // Delete share
    const { error } = await supabase.from("file_shares").delete().eq("id", id).eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete share error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if file has any remaining shares
    const { data: remainingShares } = await supabase
      .from("file_shares")
      .select("id")
      .eq("file_id", share.file_id)
      .eq("tenant_id", profile.tenant_id)
      .limit(1);

    // If no remaining shares, update file's is_shared status
    if (!remainingShares || remainingShares.length === 0) {
      await supabase
        .from("files")
        .update({ is_shared: false })
        .eq("id", share.file_id)
        .eq("tenant_id", profile.tenant_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete share error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
