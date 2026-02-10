import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, createLeadSchema } from "@/lib/validations";
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

// GET - Fetch all leads for the user's tenant
export async function GET(request: Request) {
  try {
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

    // Check plan feature access for CRM
    const planInfo = await getUserPlanInfo(supabase, userId);
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

    // Check plan feature access for CRM
    const planInfo = await getUserPlanInfo(supabase, userId);
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

    // Validate input with enum validation for status and priority
    const validation = validateBody(createLeadSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const v = validation.data;

    // Deduplication check: warn if lead with same email exists (unless force is set)
    if (!body.force && v.email) {
      const { data: potentialDuplicates } = await supabase
        .from("leads")
        .select("id, name, email, company, status")
        .eq("tenant_id", profile.tenant_id)
        .eq("email", v.email.toLowerCase())
        .limit(3);

      if (potentialDuplicates && potentialDuplicates.length > 0) {
        const dupInfo = potentialDuplicates.map((d) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          company: d.company,
          status: d.status,
        }));
        return NextResponse.json(
          {
            error: "Potential duplicate lead found",
            code: "DUPLICATE_WARNING",
            duplicates: dupInfo,
            message: `A lead with email "${v.email}" already exists. Add "force: true" to create anyway.`,
          },
          { status: 409 }
        );
      }
    }

    // Validate FK references belong to the same tenant
    if (v.assigned_to) {
      const { data: assignee } = await supabase
        .from("profiles").select("id").eq("id", v.assigned_to).eq("tenant_id", profile.tenant_id).single();
      if (!assignee) {
        return NextResponse.json({ error: "Assigned user not found in your organization" }, { status: 404 });
      }
    }

    // Truncate text fields to prevent oversized payloads
    const truncate = (val: string | null | undefined, max: number) =>
      val ? val.slice(0, max) : null;

    const leadData = {
      tenant_id: profile.tenant_id,
      created_by: userId,
      // Contact Information
      name: v.name.slice(0, 200),
      email: v.email || null,
      phone: v.phone || null,
      company: v.company || null,
      job_title: v.job_title || null,
      website: v.website || null,
      address: v.address || null,
      city: v.city || null,
      country: v.country || null,
      // Sales Pipeline
      status: v.status,
      estimated_value: v.estimated_value ?? 0,
      probability: v.probability ?? 0,
      priority: v.priority,
      score: v.score ?? 0,
      // Source & Attribution
      source: v.source || null,
      campaign: v.campaign || null,
      referral_source: v.referral_source || null,
      // Industry & Company Info
      industry: v.industry || null,
      company_size: v.company_size || null,
      budget_range: v.budget_range || null,
      // Timeline
      next_follow_up: v.next_follow_up || null,
      last_contacted: v.last_contacted || null,
      expected_close_date: v.expected_close_date || null,
      // Assignment
      assigned_to: v.assigned_to || null,
      // Notes & Requirements
      notes: truncate(v.notes, 5000),
      requirements: truncate(body.requirements, 5000),
      pain_points: truncate(body.pain_points, 5000),
      competitor_info: truncate(body.competitor_info, 5000),
      // Categorization
      tags: v.tags || null,
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
        }, serviceClient, profile.tenant_id, userId);
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
