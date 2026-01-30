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

// GET - List approvals for portal client
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

    // Fetch approvals where portal_client_id matches OR project is linked to their client_id
    const { data: directApprovals, error: directError } = await supabase
      .from("portal_approvals")
      .select("*")
      .eq("portal_client_id", portalClient.id)
      .order("created_at", { ascending: false });

    if (directError) {
      console.error("Fetch approvals error:", directError);
      return NextResponse.json({ error: directError.message }, { status: 500 });
    }

    // Also fetch approvals linked to projects that belong to the client
    const { data: projectApprovals, error: projectError } = await supabase
      .from("portal_approvals")
      .select("*, projects!inner(client_id)")
      .eq("projects.client_id", portalClient.client_id)
      .is("portal_client_id", null)
      .order("created_at", { ascending: false });

    if (projectError) {
      // Non-critical - may fail if join doesn't exist, just use direct approvals
      console.error("Fetch project approvals error:", projectError);
    }

    // Merge and deduplicate
    const allApprovals = [...(directApprovals || [])];
    const existingIds = new Set(allApprovals.map((a) => a.id));

    if (projectApprovals) {
      for (const approval of projectApprovals) {
        if (!existingIds.has(approval.id)) {
          allApprovals.push(approval);
        }
      }
    }

    return NextResponse.json({ approvals: allApprovals });
  } catch (error) {
    console.error("Portal approvals error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Submit approval response
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
    const { approval_id, status, client_comment } = body;

    if (!approval_id || !status) {
      return NextResponse.json({ error: "Approval ID and status are required" }, { status: 400 });
    }

    if (!["approved", "rejected", "revision_requested"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be approved, rejected, or revision_requested" }, { status: 400 });
    }

    // Verify the approval belongs to this portal client or their projects
    const { data: approval, error: approvalError } = await supabase
      .from("portal_approvals")
      .select("*")
      .eq("id", approval_id)
      .single();

    if (approvalError || !approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    // Check ownership: either directly assigned or via project
    if (approval.portal_client_id !== portalClient.id) {
      if (approval.project_id) {
        const { data: project } = await supabase
          .from("projects")
          .select("client_id")
          .eq("id", approval.project_id)
          .single();

        if (!project || project.client_id !== portalClient.client_id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Update approval record
    const { data: updatedApproval, error: updateError } = await supabase
      .from("portal_approvals")
      .update({
        status,
        client_comment: client_comment || null,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", approval_id)
      .select()
      .single();

    if (updateError) {
      console.error("Update approval error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Trigger workflow based on status
    try {
      const triggerType = status === "approved" ? "deliverable_approved" : "deliverable_rejected";
      await checkTriggers(triggerType, {
        entity_id: approval_id,
        entity_type: "portal_approval",
        approval_title: approval.title,
        approval_status: status,
        client_comment: client_comment || "",
        portal_client_name: portalClient.name,
        portal_client_email: portalClient.email,
        project_id: approval.project_id,
      }, supabase, portalClient.tenant_id, portalClient.id);
    } catch (err) {
      console.error("Workflow trigger error:", err);
    }

    return NextResponse.json({ approval: updatedApproval });
  } catch (error) {
    console.error("Portal approval response error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
