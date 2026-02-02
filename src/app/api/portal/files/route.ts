import { NextResponse } from "next/server";
import { checkTriggers } from "@/lib/workflows/triggers";
import { getPortalServiceClient, validatePortalClient, getPortalAuthHeaders } from "@/lib/portal-auth";

// GET - List files for portal client
export async function GET(request: Request) {
  try {
    const { portalClientId, sessionToken } = getPortalAuthHeaders(request);
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getPortalServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId, sessionToken);
    if (!portalClient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: files, error: filesError } = await supabase
      .from("portal_shared_files")
      .select("id, file_name, file_url, file_size, file_type, uploaded_by, project_id, created_at")
      .eq("portal_client_id", portalClient.id)
      .order("created_at", { ascending: false });

    if (filesError) {
      console.error("Fetch files error:", filesError);
      return NextResponse.json({ error: filesError.message }, { status: 500 });
    }

    return NextResponse.json({ files: files || [] });
  } catch (error) {
    console.error("Portal files error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Upload file metadata
export async function POST(request: Request) {
  try {
    const { portalClientId, sessionToken } = getPortalAuthHeaders(request);
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getPortalServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId, sessionToken);
    if (!portalClient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { file_name, file_url, file_size, file_type, project_id } = body;

    if (!file_name || !file_url) {
      return NextResponse.json({ error: "File name and URL are required" }, { status: 400 });
    }

    // Validate file_url is a legitimate URL (must be HTTPS and from known storage domains)
    try {
      const parsedUrl = new URL(file_url);
      if (parsedUrl.protocol !== "https:") {
        return NextResponse.json({ error: "File URL must use HTTPS" }, { status: 400 });
      }
      const allowedHosts = [
        "res.cloudinary.com",
        "cloudinary.com",
        process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "",
      ].filter(Boolean);
      const isAllowed = allowedHosts.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`));
      if (!isAllowed) {
        return NextResponse.json({ error: "File URL must point to an allowed storage provider" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Validate file_name length
    if (typeof file_name !== "string" || file_name.length > 500) {
      return NextResponse.json({ error: "File name must be under 500 characters" }, { status: 400 });
    }

    // Validate project_id belongs to the portal client's tenant
    if (project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", project_id)
        .eq("tenant_id", portalClient.tenant_id)
        .single();

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    const { data: file, error: insertError } = await supabase
      .from("portal_shared_files")
      .insert({
        portal_client_id: portalClient.id,
        tenant_id: portalClient.tenant_id,
        file_name,
        file_url,
        file_size: file_size || null,
        file_type: file_type || null,
        project_id: project_id || null,
        uploaded_by: "client",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Upload file error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Trigger workflow
    try {
      await checkTriggers("portal_file_uploaded", {
        entity_id: file.id,
        entity_type: "portal_shared_file",
        file_name,
        file_type: file_type || "unknown",
        portal_client_name: portalClient.name,
        portal_client_email: portalClient.email,
        project_id: project_id || null,
      }, supabase, portalClient.tenant_id, portalClient.id);
    } catch (err) {
      console.error("Workflow trigger error:", err);
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error("Portal file upload error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
