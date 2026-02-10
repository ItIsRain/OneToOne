import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
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

// GET - Fetch all contract templates for the user's tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const contractsAccess = checkFeatureAccess(planInfo.planType, "contracts");
    if (!contractsAccess.allowed) {
      return NextResponse.json(
        {
          error: contractsAccess.reason,
          upgrade_required: contractsAccess.upgrade_required,
          feature: "contracts",
        },
        { status: 403 }
      );
    }

    const { data: templates, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get contract templates error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new contract template
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const contractsAccess = checkFeatureAccess(planInfo.planType, "contracts");
    if (!contractsAccess.allowed) {
      return NextResponse.json(
        {
          error: contractsAccess.reason,
          upgrade_required: contractsAccess.upgrade_required,
          feature: "contracts",
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
      created_by: userId,
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      sections: body.sections || [],
      default_terms: body.default_terms || null,
      default_payment_terms: body.default_payment_terms || null,
    };

    const { data: template, error } = await supabase
      .from("contract_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create contract template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
