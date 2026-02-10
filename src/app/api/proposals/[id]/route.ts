import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, updateProposalSchema } from "@/lib/validations";
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

// GET - Fetch a single proposal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(`
        *,
        client:clients(id, name, company, email),
        lead:leads(id, name, company),
        project:projects(id, name, project_code)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Get proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - Update a proposal
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateProposalSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Only allow updating specific fields
    const allowedFields = [
      "title",
      "slug",
      "status",
      "client_id",
      "project_id",
      "lead_id",
      "sections",
      "pricing_items",
      "subtotal",
      "discount_percent",
      "tax_percent",
      "total",
      "currency",
      "valid_until",
      "notes",
      "agency_signature_data",
      "agency_signature_name",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Validate FK references belong to the same tenant
    if (updates.client_id) {
      const { data: client } = await supabase
        .from("clients").select("id").eq("id", updates.client_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }
    if (updates.lead_id) {
      const { data: lead } = await supabase
        .from("leads").select("id").eq("id", updates.lead_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
    }
    if (updates.project_id) {
      const { data: project } = await supabase
        .from("projects").select("id").eq("id", updates.project_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    // Validate status transitions
    if (updates.status) {
      const { data: current } = await supabase
        .from("proposals")
        .select("status")
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (current) {
        const validTransitions: Record<string, string[]> = {
          draft: ["sent"],
          sent: ["viewed", "accepted", "declined", "expired", "draft"],
          viewed: ["accepted", "declined", "expired", "sent"],
          accepted: [],
          declined: ["draft"],
          expired: ["draft"],
        };
        const allowed = validTransitions[current.status] || [];
        if (!allowed.includes(updates.status as string)) {
          return NextResponse.json(
            { error: `Cannot transition from "${current.status}" to "${updates.status}"` },
            { status: 400 }
          );
        }
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: proposal, error } = await supabase
      .from("proposals")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, company, email),
        lead:leads(id, name, company),
        project:projects(id, name, project_code)
      `)
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Update proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Alias for PUT
export const PATCH = PUT;

// DELETE - Delete a proposal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
