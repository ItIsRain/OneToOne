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

// GET - Fetch all vendors for the user's tenant
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

    // Check plan feature access for vendors
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const vendorsAccess = checkFeatureAccess(planInfo.planType, "vendors");
    if (!vendorsAccess.allowed) {
      return NextResponse.json(
        {
          error: vendorsAccess.reason,
          upgrade_required: vendorsAccess.upgrade_required,
          feature: "vendors",
        },
        { status: 403 }
      );
    }

    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("Get vendors error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new vendor
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

    // Check plan feature access for vendors
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const vendorsAccess = checkFeatureAccess(planInfo.planType, "vendors");
    if (!vendorsAccess.allowed) {
      return NextResponse.json(
        {
          error: vendorsAccess.reason,
          upgrade_required: vendorsAccess.upgrade_required,
          feature: "vendors",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const vendorData = {
      tenant_id: profile.tenant_id,
      name: body.name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone || null,
      category: body.category || null,
      services: body.services || null,
      hourly_rate: body.hourly_rate || null,
      rating: body.rating || null,
      status: body.status || "active",
      notes: body.notes || null,
      website: body.website || null,
      address: body.address || null,
      city: body.city || null,
      country: body.country || null,
      tags: body.tags || null,
    };

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert(vendorData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for vendor_created
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("vendor_created", {
          entity_id: vendor.id,
          entity_type: "vendor",
          entity_name: vendor.name,
          vendor_name: vendor.name,
          vendor_email: vendor.email,
          vendor_phone: vendor.phone,
          vendor_company: vendor.company,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error (vendor_created):", err);
      }
    }

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    console.error("Create vendor error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
