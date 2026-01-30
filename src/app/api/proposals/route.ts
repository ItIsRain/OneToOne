import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
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

// GET - Fetch all proposals for the user's tenant
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

    // Check plan feature access for proposals
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const proposalsAccess = checkFeatureAccess(planInfo.planType, "proposals");
    if (!proposalsAccess.allowed) {
      return NextResponse.json(
        {
          error: proposalsAccess.reason,
          upgrade_required: proposalsAccess.upgrade_required,
          feature: "proposals",
        },
        { status: 403 }
      );
    }

    const { data: proposals, error } = await supabase
      .from("proposals")
      .select('*, client:clients(id, name, company, email)')
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Get proposals error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new proposal
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

    // Check plan feature access for proposals
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const proposalsAccess = checkFeatureAccess(planInfo.planType, "proposals");
    if (!proposalsAccess.allowed) {
      return NextResponse.json(
        {
          error: proposalsAccess.reason,
          upgrade_required: proposalsAccess.upgrade_required,
          feature: "proposals",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // If a template is selected, fetch its sections and pricing items
    let templateSections: unknown[] = [];
    let templatePricingItems: unknown[] = [];
    if (body.template_id) {
      const { data: template } = await supabase
        .from("proposal_templates")
        .select("sections, pricing_items")
        .eq("id", body.template_id)
        .single();

      if (template) {
        templateSections = template.sections || [];
        templatePricingItems = template.pricing_items || [];
      }
    }

    // Auto-generate slug from title
    const baseSlug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    const proposalData = {
      tenant_id: profile.tenant_id,
      created_by: user.id,
      title: body.title,
      slug,
      client_id: body.client_id || null,
      lead_id: body.lead_id || null,
      project_id: body.project_id || null,
      sections: body.sections?.length ? body.sections : templateSections,
      pricing_items: body.pricing_items?.length ? body.pricing_items : templatePricingItems,
      currency: body.currency || "USD",
      valid_until: body.valid_until || null,
      notes: body.notes || null,
      status: "draft",
    };

    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert(proposalData)
      .select('*, client:clients(id, name, company, email)')
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for proposal_created
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("proposal_created", {
          entity_id: proposal.id,
          entity_type: "proposal",
          entity_name: proposal.title,
          proposal_title: proposal.title,
          client_id: proposal.client_id,
          total: proposal.total || 0,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error("Create proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
