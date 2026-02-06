import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, createContactSchema } from "@/lib/validations";

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

    // Check plan feature access for CRM
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const crmAccess = checkFeatureAccess(planInfo.planType, "crm");
    if (!crmAccess.allowed) {
      return NextResponse.json(
        {
          error: crmAccess.reason,
          upgrade_required: crmAccess.upgrade_required,
          feature: "crm",
        },
        { status: 403 }
      );
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

    // Check plan feature access for CRM
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const crmAccess = checkFeatureAccess(planInfo.planType, "crm");
    if (!crmAccess.allowed) {
      return NextResponse.json(
        {
          error: crmAccess.reason,
          upgrade_required: crmAccess.upgrade_required,
          feature: "crm",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createContactSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Deduplication check: warn if contact with same email exists (unless force is set)
    if (!body.force && body.email) {
      const { data: potentialDuplicates } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email, company, client_id")
        .eq("tenant_id", profile.tenant_id)
        .eq("email", body.email.toLowerCase())
        .limit(3);

      if (potentialDuplicates && potentialDuplicates.length > 0) {
        const dupInfo = potentialDuplicates.map((d) => ({
          id: d.id,
          name: `${d.first_name || ""} ${d.last_name || ""}`.trim(),
          email: d.email,
          company: d.company,
          client_id: d.client_id,
        }));
        return NextResponse.json(
          {
            error: "Potential duplicate contact found",
            code: "DUPLICATE_WARNING",
            duplicates: dupInfo,
            message: `A contact with email "${body.email}" already exists. Add "force: true" to create anyway.`,
          },
          { status: 409 }
        );
      }
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

    const contactData = {
      tenant_id: profile.tenant_id,
      created_by: user.id,
      // Personal Info
      first_name: body.first_name.slice(0, 200),
      last_name: body.last_name.slice(0, 200),
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
      communication_notes: body.communication_notes ? body.communication_notes.slice(0, 5000) : null,
      // Engagement
      status: body.status || "active",
      last_contacted_at: body.last_contacted_at || null,
      next_follow_up: body.next_follow_up || null,
      contact_frequency: body.contact_frequency || null,
      // Personal
      birthday: body.birthday || null,
      anniversary: body.anniversary || null,
      personal_notes: body.personal_notes ? body.personal_notes.slice(0, 5000) : null,
      // Categorization
      contact_type: body.contact_type || "other",
      tags: body.tags || null,
      source: body.source || null,
      // Notes & Media
      notes: body.notes ? body.notes.slice(0, 5000) : null,
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

    // Trigger workflow automations for contact_created
    if (contact && profile.tenant_id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("contact_created", {
            entity_id: contact.id,
            entity_type: "contact",
            entity_name: `${contact.first_name} ${contact.last_name}`,
            contact_first_name: contact.first_name,
            contact_last_name: contact.last_name,
            contact_email: contact.email,
            contact_phone: contact.phone,
            contact_company: contact.company,
            contact_job_title: contact.job_title,
          }, serviceClient, profile.tenant_id, user.id);
        } catch (err) {
          console.error("Workflow trigger error:", err);
        }
      }
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Create contact error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
