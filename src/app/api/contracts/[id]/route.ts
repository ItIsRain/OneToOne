import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, updateContractSchema } from "@/lib/validations";

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

// GET - Fetch a single contract
export async function GET(
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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { data: contract, error } = await supabase
      .from("contracts")
      .select(`
        *,
        client:clients(id, name, company, email),
        project:projects(id, name, project_code)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("Get contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - Update a contract
export async function PUT(
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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateContractSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const allowedFields = [
      "name",
      "slug",
      "status",
      "client_id",
      "project_id",
      "proposal_id",
      "sections",
      "contract_type",
      "start_date",
      "end_date",
      "value",
      "currency",
      "terms_and_conditions",
      "payment_terms",
      "internal_notes",
      "counter_signatory_name",
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
    if (updates.project_id) {
      const { data: project } = await supabase
        .from("projects").select("id").eq("id", updates.project_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }
    if (updates.proposal_id) {
      const { data: proposal } = await supabase
        .from("proposals").select("id").eq("id", updates.proposal_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!proposal) {
        return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
      }
    }

    // Validate status transitions
    if (updates.status) {
      const { data: current } = await supabase
        .from("contracts")
        .select("status")
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (current) {
        const validTransitions: Record<string, string[]> = {
          draft: ["sent", "active"],
          sent: ["viewed", "active", "signed", "declined", "expired", "draft"],
          viewed: ["active", "signed", "declined", "expired", "sent"],
          pending_signature: ["active", "signed", "declined"],
          active: ["terminated", "expired"],
          signed: [],
          declined: ["draft"],
          expired: ["draft"],
          terminated: [],
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

    const { data: contract, error } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, company, email),
        project:projects(id, name, project_code)
      `)
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("Update contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Alias for PUT
export const PATCH = PUT;

// DELETE - Delete a contract
export async function DELETE(
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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
