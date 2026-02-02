import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { validateBody, createContractSchema } from "@/lib/validations";
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

// GET - Fetch all contracts for the user's tenant
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const planInfo = await getUserPlanInfo(supabase, user.id);
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

    const { data: contracts, error } = await supabase
      .from("contracts")
      .select('*, client:clients(id, name, company, email)')
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Get contracts error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new contract
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const planInfo = await getUserPlanInfo(supabase, user.id);
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

    // Validate input
    const validation = validateBody(createContractSchema, body);
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
    if (body.project_id) {
      const { data: project } = await supabase
        .from("projects").select("id").eq("id", body.project_id).eq("tenant_id", profile.tenant_id).single();
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }
    if (body.proposal_id) {
      const { data: proposal } = await supabase
        .from("proposals").select("id").eq("id", body.proposal_id).eq("tenant_id", profile.tenant_id).single();
      if (!proposal) {
        return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
      }
    }

    // Auto-generate slug from title
    const baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    const contractData = {
      tenant_id: profile.tenant_id,
      created_by: user.id,
      name: body.title,
      slug,
      client_id: body.client_id || null,
      project_id: body.project_id || null,
      proposal_id: body.proposal_id || null,
      sections: body.sections || [],
      contract_type: body.type || "service_agreement",
      status: "draft",
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      value: body.value || 0,
      currency: body.currency || "USD",
      terms_and_conditions: body.terms || null,
      payment_terms: body.payment_terms || null,
      internal_notes: body.notes || null,
    };

    const { data: contract, error } = await supabase
      .from("contracts")
      .insert(contractData)
      .select('*, client:clients(id, name, company, email)')
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for contract_created
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("contract_created", {
          entity_id: contract.id,
          entity_type: "contract",
          entity_name: contract.name,
          contract_title: contract.name,
          client_id: contract.client_id,
          total: contract.value || 0,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error("Create contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
