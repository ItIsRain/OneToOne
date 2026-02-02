import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, updateContactSchema } from "@/lib/validations";

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

// GET - Fetch a single contact
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

    const { data: contact, error } = await supabase
      .from("contacts")
      .select(`
        *,
        client:clients(id, name, company),
        lead:leads(id, name, company),
        assigned_to_profile:profiles!contacts_assigned_to_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Get contact error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a contact
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
    const validation = validateBody(updateContactSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate FK references belong to the same tenant
    if (body.client_id) {
      const { data: client } = await supabase
        .from("clients").select("id").eq("id", body.client_id).eq("tenant_id", profile.tenant_id).single();
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }
    if (body.lead_id) {
      const { data: lead } = await supabase
        .from("leads").select("id").eq("id", body.lead_id).eq("tenant_id", profile.tenant_id).single();
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
    }
    if (body.reports_to) {
      const { data: reportsToContact } = await supabase
        .from("contacts").select("id").eq("id", body.reports_to).eq("tenant_id", profile.tenant_id).single();
      if (!reportsToContact) {
        return NextResponse.json({ error: "Reports-to contact not found" }, { status: 404 });
      }
    }
    if (body.assigned_to) {
      const { data: assignee } = await supabase
        .from("profiles").select("id").eq("id", body.assigned_to).eq("tenant_id", profile.tenant_id).single();
      if (!assignee) {
        return NextResponse.json({ error: "Assigned user not found in your organization" }, { status: 404 });
      }
    }

    // Only allow updating specific fields
    const allowedFields = [
      "first_name",
      "last_name",
      "email",
      "secondary_email",
      "phone",
      "mobile_phone",
      "work_phone",
      "job_title",
      "department",
      "company",
      "linkedin_url",
      "twitter_handle",
      "client_id",
      "lead_id",
      "is_primary_contact",
      "reports_to",
      "address",
      "city",
      "state",
      "postal_code",
      "country",
      "timezone",
      "preferred_contact_method",
      "do_not_contact",
      "email_opt_in",
      "communication_notes",
      "status",
      "last_contacted_at",
      "next_follow_up",
      "contact_frequency",
      "birthday",
      "anniversary",
      "personal_notes",
      "contact_type",
      "tags",
      "source",
      "notes",
      "avatar_url",
      "assigned_to",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: contact, error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, company),
        lead:leads(id, name, company),
        assigned_to_profile:profiles!contacts_assigned_to_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Update contact error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a contact
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
      .from("contacts")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contact error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
