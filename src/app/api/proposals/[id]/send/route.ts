import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkTriggers } from "@/lib/workflows/triggers";

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
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          }, serviceClient, proposal.tenant_id, user.id);
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
