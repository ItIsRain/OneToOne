import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkTriggers } from "@/lib/workflows/triggers";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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

// POST - Send a proposal
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await getSupabaseClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Verify proposal exists and is in a sendable state
    const { data: existing } = await supabase
      .from("proposals")
      .select("status")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const sendableStatuses = ["draft", "sent"]; // Allow re-sending
    if (!sendableStatuses.includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot send a proposal with status "${existing.status}"` },
        { status: 400 }
      );
    }

    // Update proposal status to sent
    const { data: proposal, error } = await supabase
      .from("proposals")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, company, email)
      `)
      .single();

    if (error) {
      console.error("Send error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Trigger workflow automations for proposal_sent
    if (proposal.tenant_id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("proposal_sent", {
            entity_id: proposal.id,
            entity_type: "proposal",
            entity_name: proposal.title,
            proposal_title: proposal.title,
            client_name: proposal.client?.name || null,
            client_email: proposal.client?.email || null,
            total: proposal.total || 0,
          }, serviceClient, proposal.tenant_id, userId);
        } catch (err) {
          console.error("Workflow trigger error:", err);
        }
      }
    }

    const publicUrl = `/proposal/${proposal.slug}`;

    return NextResponse.json({ proposal, public_url: publicUrl });
  } catch (error) {
    console.error("Send proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
