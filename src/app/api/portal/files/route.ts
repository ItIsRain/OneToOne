import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function validatePortalClient(supabase: ReturnType<typeof getServiceClient>, portalClientId: string) {
  const { data, error } = await supabase
    .from("portal_clients")
    .select("id, client_id, tenant_id, name, email, is_active")
    .eq("id", portalClientId)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

// GET - List files for portal client
export async function GET(request: Request) {
  try {
    const portalClientId = request.headers.get("x-portal-client-id");
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId);
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
    const portalClientId = request.headers.get("x-portal-client-id");
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId);
    if (!portalClient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { file_name, file_url, file_size, file_type, project_id } = body;

    if (!file_name || !file_url) {
      return NextResponse.json({ error: "File name and URL are required" }, { status: 400 });
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
