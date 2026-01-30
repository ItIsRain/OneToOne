import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";

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

// GET - Fetch all proposal templates for the user's tenant
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

    const { data: templates, error } = await supabase
      .from("proposal_templates")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get proposal templates error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new proposal template
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

    if (!body.name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    const templateData = {
      tenant_id: profile.tenant_id,
      created_by: user.id,
      name: body.name,
      description: body.description || null,
      sections: body.sections || [],
      pricing_items: body.pricing_items || [],
    };

    const { data: template, error } = await supabase
      .from("proposal_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create proposal template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
