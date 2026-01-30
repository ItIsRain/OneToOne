import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";

// POST - Sign/accept a proposal (NO AUTH - public)
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

    if (!body.signature_data || !body.signature_name) {
      return NextResponse.json(
        { error: "Signature data and name are required" },
        { status: 400 }
      );
    }

    // Get client IP from headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    const now = new Date().toISOString();

    const { data: proposal, error } = await serviceClient
      .from("proposals")
      .update({
        status: "accepted",
        client_signature_data: body.signature_data,
        client_signature_name: body.signature_name,
        client_signature_ip: clientIp,
        client_signed_at: now,
        accepted_at: now,
        updated_at: now,
      })
      .eq("slug", slug)
      .in("status", ["draft", "sent", "viewed"])
      .select(`
        *,
        client:clients(id, name, email)
      `)
      .single();

    if (error || !proposal) {
      console.error("Sign error:", error);
      return NextResponse.json(
        { error: "Proposal not found or already signed" },
        { status: 404 }
      );
    }

    // Trigger workflow automations for proposal_accepted
    if (proposal.tenant_id) {
      try {
        await checkTriggers("proposal_accepted", {
          entity_id: proposal.id,
          entity_type: "proposal",
          entity_name: proposal.title,
          proposal_title: proposal.title,
          client_name: proposal.client?.name || null,
          total: proposal.total || 0,
          signature_name: body.signature_name,
        }, serviceClient, proposal.tenant_id, proposal.created_by);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Sign proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
