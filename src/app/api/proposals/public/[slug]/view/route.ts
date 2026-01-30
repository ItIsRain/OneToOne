import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";

// POST - Track proposal view (NO AUTH - public)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();

    // Fetch the proposal by slug
    const { data: proposal, error: fetchError } = await serviceClient
      .from("proposals")
      .select("id, slug, title, status, tenant_id, created_by, client_id, total")
      .eq("slug", slug)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Get viewer IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const viewerIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    // Insert view record
    const { error: viewError } = await serviceClient
      .from("proposal_views")
      .insert({
        proposal_id: proposal.id,
        ip_address: viewerIp,
        user_agent: request.headers.get("user-agent") || null,
        sections_viewed: body.sections_viewed || null,
        duration_seconds: body.duration_seconds || null,
      });

    if (viewError) {
      console.error("Insert view error:", viewError);
    }

    // If proposal status is 'sent', update to 'viewed'
    if (proposal.status === "sent") {
      const now = new Date().toISOString();

      const { error: updateError } = await serviceClient
        .from("proposals")
        .update({
          status: "viewed",
          viewed_at: now,
          updated_at: now,
        })
        .eq("id", proposal.id);

      if (updateError) {
        console.error("Update status error:", updateError);
      }
    }

    // Trigger workflow automations for proposal_viewed
    if (proposal.tenant_id) {
      try {
        await checkTriggers("proposal_viewed", {
          entity_id: proposal.id,
          entity_type: "proposal",
          entity_name: proposal.title,
          proposal_title: proposal.title,
          client_id: proposal.client_id,
          total: proposal.total || 0,
        }, serviceClient, proposal.tenant_id, proposal.created_by);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track proposal view error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
