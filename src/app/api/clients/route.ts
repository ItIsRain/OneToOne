import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, createClientSchema } from "@/lib/validations";

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

// GET - Fetch all clients for the user's tenant
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

    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Get clients error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new client
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
    const validation = validateBody(createClientSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Deduplication check: warn if client with same email or company already exists
    // Skip if user explicitly sets force: true
    if (!body.force && (body.email || body.company)) {
      let dupQuery = supabase
        .from("clients")
        .select("id, name, email, company")
        .eq("tenant_id", profile.tenant_id);

      if (body.email) {
        dupQuery = dupQuery.eq("email", body.email.toLowerCase());
      } else if (body.company) {
        dupQuery = dupQuery.ilike("company", body.company);
      }

      const { data: potentialDuplicates } = await dupQuery.limit(3);

      if (potentialDuplicates && potentialDuplicates.length > 0) {
        // Return warning with existing records for user decision
        const dupInfo = potentialDuplicates.map((d) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          company: d.company,
        }));
        return NextResponse.json(
          {
            error: "Potential duplicate client found",
            code: "DUPLICATE_WARNING",
            duplicates: dupInfo,
            message: `A client with ${body.email ? `email "${body.email}"` : `company "${body.company}"`} already exists. Add "force: true" to create anyway.`,
          },
          { status: 409 }
        );
      }
    }

    const clientData = {
      tenant_id: profile.tenant_id,
      name: body.name.slice(0, 200),
      email: body.email || null,
      phone: body.phone || null,
      company: body.company ? body.company.slice(0, 200) : null,
      notes: body.notes ? body.notes.slice(0, 5000) : null,
      status: body.status || "active",
      website: body.website || null,
      address: body.address || null,
      city: body.city || null,
      country: body.country || null,
      industry: body.industry || null,
      source: body.source || null,
      tags: body.tags || null,
    };

    const { data: client, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for client_created
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("client_created", {
          entity_id: client.id,
          entity_type: "client",
          entity_name: client.name,
          client_name: client.name,
          client_email: client.email,
          client_phone: client.phone,
          client_company: client.company,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error (client_created):", err);
      }
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
