import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, createLeadSchema } from "@/lib/validations";

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

// GET - Fetch all leads for the user's tenant
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
        },
        { status: 403 }
      );
    }

    const { data: leads, error } = await supabase
      .from("leads")
      .select(`
        *,
        assigned_to_profile:profiles!leads_assigned_to_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Get leads error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new lead
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
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createLeadSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate FK references belong to the same tenant
    if (body.assigned_to) {
      const { data: assignee } = await supabase
        .from("profiles").select("id").eq("id", body.assigned_to).eq("tenant_id", profile.tenant_id).single();
      if (!assignee) {
        return NextResponse.json({ error: "Assigned user not found in your organization" }, { status: 404 });
      }
    }

    // Truncate text fields to prevent oversized payloads
    const truncate = (val: string | null | undefined, max: number) =>
      val ? val.slice(0, max) : null;

    const leadData = {
      tenant_id: profile.tenant_id,
      created_by: user.id,
      // Contact Information
      name: body.name.slice(0, 200),
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      job_title: body.job_title || null,
      website: body.website || null,
      address: body.address || null,
      city: body.city || null,
      country: body.country || null,
      // Sales Pipeline
      status: body.status || "new",
      estimated_value: Math.max(0, parseFloat(body.estimated_value) || 0),
      probability: Math.min(100, Math.max(0, parseFloat(body.probability) || 0)),
      priority: body.priority || "medium",
      score: Math.min(100, Math.max(0, parseInt(body.score) || 0)),
      // Source & Attribution
      source: body.source || null,
      campaign: body.campaign || null,
      referral_source: body.referral_source || null,
      // Industry & Company Info
      industry: body.industry || null,
      company_size: body.company_size || null,
      budget_range: body.budget_range || null,
      // Timeline
      next_follow_up: body.next_follow_up || null,
      last_contacted: body.last_contacted || null,
      expected_close_date: body.expected_close_date || null,
      // Assignment
      assigned_to: body.assigned_to || null,
      // Notes & Requirements
      notes: truncate(body.notes, 5000),
      requirements: truncate(body.requirements, 5000),
      pain_points: truncate(body.pain_points, 5000),
      competitor_info: truncate(body.competitor_info, 5000),
      // Categorization
      tags: body.tags || null,
      services_interested: body.services_interested || null,
    };

    const { data: lead, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select(`
        *,
        assigned_to_profile:profiles!leads_assigned_to_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for lead_created
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("lead_created", {
          entity_id: lead.id,
          entity_type: "lead",
          entity_name: lead.name,
          lead_name: lead.name,
          lead_email: lead.email,
          lead_company: lead.company,
          lead_source: lead.source,
          lead_estimated_value: lead.estimated_value,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error (lead_created):", err);
      }
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Create lead error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
