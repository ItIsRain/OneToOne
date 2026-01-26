import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// Generate a unique share link token
function generateShareLink(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// GET - Fetch all file shares
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const fileId = searchParams.get("file_id");
    const shareType = searchParams.get("share_type");
    const search = searchParams.get("search");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    let query = supabase
      .from("file_shares")
      .select(`
        *,
        file:files(id, name, file_url, file_type, file_size, thumbnail_url),
        client:clients(id, name, email, company)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (fileId) {
      query = query.eq("file_id", fileId);
    }

    if (shareType && shareType !== "all") {
      query = query.eq("share_type", shareType);
    }

    if (search) {
      query = query.or(`shared_with_email.ilike.%${search}%,shared_with_name.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const { data: shares, error } = await query;

    if (error) {
      console.error("Fetch shares error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const allSharesQuery = await supabase
      .from("file_shares")
      .select("status, share_type, view_count, download_count, expires_at")
      .eq("tenant_id", profile.tenant_id);

    const allShares = allSharesQuery.data || [];
    const now = new Date();

    const stats = {
      total: allShares.length,
      active: allShares.filter((s) => s.status === "active").length,
      expired: allShares.filter(
        (s) => s.status === "expired" || (s.expires_at && new Date(s.expires_at) < now)
      ).length,
      revoked: allShares.filter((s) => s.status === "revoked").length,
      total_views: allShares.reduce((sum, s) => sum + (s.view_count || 0), 0),
      total_downloads: allShares.reduce((sum, s) => sum + (s.download_count || 0), 0),
      by_type: {
        link: allShares.filter((s) => s.share_type === "link").length,
        email: allShares.filter((s) => s.share_type === "email").length,
        client: allShares.filter((s) => s.share_type === "client").length,
        team: allShares.filter((s) => s.share_type === "team").length,
      },
    };

    return NextResponse.json({ shares, stats });
  } catch (error) {
    console.error("Get shares error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new file share
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    if (!body.file_id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Verify file exists and belongs to tenant
    const { data: file } = await supabase
      .from("files")
      .select("id, name, tenant_id")
      .eq("id", body.file_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Generate share link
    const shareLink = generateShareLink();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/share/${shareLink}`;

    // Handle password if provided
    let passwordHash = null;
    if (body.password) {
      passwordHash = hashPassword(body.password);
    }

    const shareData = {
      tenant_id: profile.tenant_id,
      file_id: body.file_id,
      share_type: body.share_type || "link",
      share_link: shareLink,
      share_url: shareUrl,
      shared_with_email: body.shared_with_email || null,
      shared_with_client_id: body.shared_with_client_id || null,
      shared_with_user_id: body.shared_with_user_id || null,
      shared_with_name: body.shared_with_name || null,
      permission_level: body.permission_level || "view",
      can_reshare: body.can_reshare || false,
      can_comment: body.can_comment || false,
      password_hash: passwordHash,
      is_password_protected: !!body.password,
      requires_authentication: body.requires_authentication || false,
      expires_at: body.expires_at || null,
      max_downloads: body.max_downloads || null,
      max_views: body.max_views || null,
      message: body.message || null,
      notify_on_access: body.notify_on_access || false,
      notify_on_download: body.notify_on_download || false,
      shared_by: user.id,
    };

    const { data: share, error } = await supabase
      .from("file_shares")
      .insert(shareData)
      .select(`
        *,
        file:files(id, name, file_url, file_type, file_size, thumbnail_url),
        client:clients(id, name, email, company)
      `)
      .single();

    if (error) {
      console.error("Insert share error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update file's is_shared status
    await supabase
      .from("files")
      .update({ is_shared: true })
      .eq("id", body.file_id);

    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    console.error("Create share error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
