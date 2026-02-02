import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// POST - Decline a proposal (NO AUTH - public)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit: 5 decline attempts per IP per minute
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit({
      key: "proposal-decline",
      identifier: ip,
      maxRequests: 5,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds!);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    let body: { reason?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional for decline
    }

    const now = new Date().toISOString();

    const { data: proposal, error } = await serviceClient
      .from("proposals")
      .update({
        status: "declined",
        declined_at: now,
        decline_reason: body?.reason || null,
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
      console.error("Decline error:", error);
      return NextResponse.json(
        { error: "Proposal not found or already resolved" },
        { status: 404 }
      );
    }

    // Trigger workflow automations for proposal_declined
    if (proposal.tenant_id) {
      try {
        await checkTriggers("proposal_declined", {
          entity_id: proposal.id,
          entity_type: "proposal",
          entity_name: proposal.title,
          proposal_title: proposal.title,
          client_name: proposal.client?.name || null,
          total: proposal.total || 0,
          decline_reason: body.reason || null,
        }, serviceClient, proposal.tenant_id, proposal.created_by);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Decline proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
