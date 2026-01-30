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

// GET - List all portal clients for tenant (ADMIN)
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    const planInfo = await getUserPlanInfo(serviceClient, user.id);
    if (!planInfo) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const featureCheck = checkFeatureAccess(planInfo.planType, "client_portal");
    if (!featureCheck.allowed) {
      return NextResponse.json({ error: featureCheck.reason, upgrade_required: true }, { status: 403 });
    }

    const { data: portalClients, error } = await serviceClient
      .from("portal_clients")
      .select("*, clients(id, name, email, company)")
      .eq("tenant_id", planInfo.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch portal clients error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ portal_clients: portalClients || [] });
  } catch (error) {
    console.error("Portal clients error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create portal client (ADMIN)
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    const planInfo = await getUserPlanInfo(serviceClient, user.id);
    if (!planInfo) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const featureCheck = checkFeatureAccess(planInfo.planType, "client_portal");
    if (!featureCheck.allowed) {
      return NextResponse.json({ error: featureCheck.reason, upgrade_required: true }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, client_id, avatar_url } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    // Check for duplicate email within tenant
    const { data: existing } = await serviceClient
      .from("portal_clients")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("tenant_id", planInfo.tenantId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "A portal client with this email already exists" }, { status: 409 });
    }

    // NOTE: In production, password should be hashed with bcrypt before storing.
    const { data: portalClient, error: insertError } = await serviceClient
      .from("portal_clients")
      .insert({
        email: email.toLowerCase(),
        password,
        name,
        client_id: client_id || null,
        avatar_url: avatar_url || null,
        tenant_id: planInfo.tenantId,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Create portal client error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ portal_client: portalClient }, { status: 201 });
  } catch (error) {
    console.error("Create portal client error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - Update portal client (ADMIN)
export async function PUT(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    const planInfo = await getUserPlanInfo(serviceClient, user.id);
    if (!planInfo) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const featureCheck = checkFeatureAccess(planInfo.planType, "client_portal");
    if (!featureCheck.allowed) {
      return NextResponse.json({ error: featureCheck.reason, upgrade_required: true }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, password, is_active, client_id, avatar_url } = body;

    if (!id) {
      return NextResponse.json({ error: "Portal client ID is required" }, { status: 400 });
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase();
    if (password !== undefined) updates.password = password; // NOTE: Should be hashed in production
    if (is_active !== undefined) updates.is_active = is_active;
    if (client_id !== undefined) updates.client_id = client_id;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    updates.updated_at = new Date().toISOString();

    const { data: portalClient, error: updateError } = await serviceClient
      .from("portal_clients")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", planInfo.tenantId)
      .select()
      .single();

    if (updateError) {
      console.error("Update portal client error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ portal_client: portalClient });
  } catch (error) {
    console.error("Update portal client error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete portal client (ADMIN)
export async function DELETE(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    const planInfo = await getUserPlanInfo(serviceClient, user.id);
    if (!planInfo) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const featureCheck = checkFeatureAccess(planInfo.planType, "client_portal");
    if (!featureCheck.allowed) {
      return NextResponse.json({ error: featureCheck.reason, upgrade_required: true }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Portal client ID is required" }, { status: 400 });
    }

    const { error: deleteError } = await serviceClient
      .from("portal_clients")
      .delete()
      .eq("id", id)
      .eq("tenant_id", planInfo.tenantId);

    if (deleteError) {
      console.error("Delete portal client error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete portal client error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
