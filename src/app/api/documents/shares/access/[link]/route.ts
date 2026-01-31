import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for public access (no auth required)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Access a share by link (public)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ link: string }> }
) {
  try {
    const { link } = await params;

    // Find share by link
    const { data: share, error } = await supabase
      .from("file_shares")
      .select(`
        *,
        file:files(id, name, file_url, file_type, file_size, mime_type, thumbnail_url, description)
      `)
      .eq("share_link", link)
      .single();

    if (error || !share) {
      return NextResponse.json(
        { error: "Share not found or has been removed" },
        { status: 404 }
      );
    }

    // Check if share is revoked
    if (share.status === "revoked") {
      return NextResponse.json(
        { error: "This share has been revoked by the owner" },
        { status: 403 }
      );
    }

    // Check if share is expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      // Update status to expired if not already
      if (share.status !== "expired") {
        await supabase
          .from("file_shares")
          .update({ status: "expired", is_expired: true })
          .eq("id", share.id);
      }
      return NextResponse.json(
        { error: "This share link has expired" },
        { status: 403 }
      );
    }

    // Check max views limit
    if (share.max_views && share.view_count >= share.max_views) {
      return NextResponse.json(
        { error: "This share has reached its maximum view limit" },
        { status: 403 }
      );
    }

    // Return share info (without incrementing view count yet - that happens on actual view)
    return NextResponse.json({
      share: {
        id: share.id,
        file_name: share.file?.name,
        file_type: share.file?.file_type,
        file_size: share.file?.file_size,
        thumbnail_url: share.file?.thumbnail_url,
        description: share.file?.description,
        permission_level: share.permission_level,
        is_password_protected: share.is_password_protected,
        requires_authentication: share.requires_authentication,
        message: share.message,
        expires_at: share.expires_at,
        max_views: share.max_views,
        view_count: share.view_count,
        max_downloads: share.max_downloads,
        download_count: share.download_count,
      },
    });
  } catch (error) {
    console.error("Access share error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Verify password and/or get file URL
export async function POST(
  request: Request,
  { params }: { params: Promise<{ link: string }> }
) {
  try {
    const { link } = await params;
    const body = await request.json();
    const { password, action } = body; // action: "view" | "download"

    // Find share by link
    const { data: share, error } = await supabase
      .from("file_shares")
      .select(`
        *,
        file:files(id, name, file_url, file_type, file_size, mime_type, thumbnail_url)
      `)
      .eq("share_link", link)
      .single();

    if (error || !share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    // Check status
    if (share.status !== "active") {
      return NextResponse.json(
        { error: `This share is ${share.status}` },
        { status: 403 }
      );
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This share link has expired" },
        { status: 403 }
      );
    }

    // Check password if protected
    if (share.is_password_protected) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required", requires_password: true },
          { status: 401 }
        );
      }

      const { verifyPassword } = await import("../../route");

      if (!verifyPassword(password, share.password_hash)) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }
    }

    // Check limits based on action
    if (action === "view") {
      if (share.max_views && share.view_count >= share.max_views) {
        return NextResponse.json(
          { error: "Maximum view limit reached" },
          { status: 403 }
        );
      }

      // Increment view count
      await supabase
        .from("file_shares")
        .update({
          view_count: share.view_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", share.id);

    } else if (action === "download") {
      // Check download permission
      if (share.permission_level === "view") {
        return NextResponse.json(
          { error: "Download not permitted for this share" },
          { status: 403 }
        );
      }

      if (share.max_downloads && share.download_count >= share.max_downloads) {
        return NextResponse.json(
          { error: "Maximum download limit reached" },
          { status: 403 }
        );
      }

      // Increment download count
      await supabase
        .from("file_shares")
        .update({
          download_count: share.download_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", share.id);
    }

    // Return file URL
    return NextResponse.json({
      file_url: share.file?.file_url,
      file_name: share.file?.name,
      file_type: share.file?.file_type,
      mime_type: share.file?.mime_type,
      permission_level: share.permission_level,
    });
  } catch (error) {
    console.error("Verify share error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
