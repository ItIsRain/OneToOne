import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// GET - Fetch all contacts for the user's tenant
export async function GET() {
  try {
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

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select(`
        *,
        client:clients(id, name, company),
        lead:leads(id, name, company),
        assigned_to_profile:profiles!contacts_assigned_to_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Get contacts error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new contact
export async function POST(request: Request) {
  try {
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

    // Validate required fields
    if (!body.first_name || !body.last_name) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    const contactData = {
      tenant_id: profile.tenant_id,
      created_by: user.id,
      // Personal Info
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email || null,
      secondary_email: body.secondary_email || null,
      phone: body.phone || null,
      mobile_phone: body.mobile_phone || null,
      work_phone: body.work_phone || null,
      // Professional Info
      job_title: body.job_title || null,
      department: body.department || null,
      company: body.company || null,
      linkedin_url: body.linkedin_url || null,
      twitter_handle: body.twitter_handle || null,
      // Relationships
      client_id: body.client_id || null,
      lead_id: body.lead_id || null,
      is_primary_contact: body.is_primary_contact || false,
      reports_to: body.reports_to || null,
      // Location
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      postal_code: body.postal_code || null,
      country: body.country || null,
      timezone: body.timezone || null,
      // Communication
      preferred_contact_method: body.preferred_contact_method || null,
      do_not_contact: body.do_not_contact || false,
      email_opt_in: body.email_opt_in !== false,
      communication_notes: body.communication_notes || null,
      // Engagement
      status: body.status || "active",
      last_contacted_at: body.last_contacted_at || null,
      next_follow_up: body.next_follow_up || null,
      contact_frequency: body.contact_frequency || null,
      // Personal
      birthday: body.birthday || null,
      anniversary: body.anniversary || null,
      personal_notes: body.personal_notes || null,
      // Categorization
      contact_type: body.contact_type || "other",
      tags: body.tags || null,
      source: body.source || null,
      // Notes & Media
      notes: body.notes || null,
      avatar_url: body.avatar_url || null,
      // Assignment
      assigned_to: body.assigned_to || null,
    };

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert(contactData)
      .select(`
        *,
        client:clients(id, name, company),
        lead:leads(id, name, company),
        assigned_to_profile:profiles!contacts_assigned_to_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Create contact error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
