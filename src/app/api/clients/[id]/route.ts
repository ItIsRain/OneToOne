import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, updateClientSchema } from "@/lib/validations";

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

// GET - Fetch a single client
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

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Get client error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a client
export async function PATCH(
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
    const validation = validateBody(updateClientSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Fetch old client for status change trigger
    const { data: oldClient } = await supabase
      .from("clients")
      .select("status, tenant_id, name")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "email",
      "phone",
      "company",
      "notes",
      "status",
      "website",
      "address",
      "city",
      "country",
      "industry",
      "source",
      "tags",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: client, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for client_status_changed
    if (body.status && oldClient && body.status !== oldClient.status && oldClient.tenant_id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("client_status_changed", {
            entity_id: id,
            entity_type: "client",
            entity_name: client.name || oldClient.name,
            client_name: client.name || oldClient.name,
            from_status: oldClient.status,
            to_status: body.status,
            client_email: client.email,
            client_company: client.company,
          }, serviceClient, oldClient.tenant_id, user.id);
        } catch (err) {
          console.error("Workflow trigger error:", err);
        }
      }
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a client
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

    // Check for dependent records before deleting
    const [
      invoicesCheck, projectsCheck, contractsCheck,
      expensesCheck, budgetsCheck, contactsCheck,
      leadsCheck, paymentsCheck, proposalsCheck,
    ] = await Promise.all([
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("client_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("client_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("contracts").select("id", { count: "exact", head: true }).eq("client_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("expenses").select("id", { count: "exact", head: true }).eq("client_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("budgets").select("id", { count: "exact", head: true }).eq("client_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("contacts").select("id", { count: "exact", head: true }).eq("client_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("converted_to_client_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("client_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("proposals").select("id", { count: "exact", head: true }).eq("client_id", id).eq("tenant_id", profile.tenant_id),
    ]);

    const deps: string[] = [];
    if (invoicesCheck.count && invoicesCheck.count > 0) deps.push(`${invoicesCheck.count} invoice(s)`);
    if (projectsCheck.count && projectsCheck.count > 0) deps.push(`${projectsCheck.count} project(s)`);
    if (contractsCheck.count && contractsCheck.count > 0) deps.push(`${contractsCheck.count} contract(s)`);
    if (expensesCheck.count && expensesCheck.count > 0) deps.push(`${expensesCheck.count} expense(s)`);
    if (budgetsCheck.count && budgetsCheck.count > 0) deps.push(`${budgetsCheck.count} budget(s)`);
    if (contactsCheck.count && contactsCheck.count > 0) deps.push(`${contactsCheck.count} contact(s)`);
    if (leadsCheck.count && leadsCheck.count > 0) deps.push(`${leadsCheck.count} lead(s)`);
    if (paymentsCheck.count && paymentsCheck.count > 0) deps.push(`${paymentsCheck.count} payment(s)`);
    if (proposalsCheck.count && proposalsCheck.count > 0) deps.push(`${proposalsCheck.count} proposal(s)`);

    if (deps.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete client with existing ${deps.join(", ")}. Please remove or reassign them first.` },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
