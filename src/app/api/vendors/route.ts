import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, createVendorSchema } from "@/lib/validations";
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

// GET - Fetch all vendors for the user's tenant
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

    // Check plan feature access for vendors
    const planInfo = await getUserPlanInfo(supabase, userId);
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
      .select("*, event_vendors(count)")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map event_vendors count to events_count for frontend compatibility
    const vendorsWithCount = (vendors || []).map((v: Record<string, unknown>) => ({
      ...v,
      events_count: Array.isArray(v.event_vendors) && v.event_vendors.length > 0
        ? (v.event_vendors[0] as { count: number }).count
        : 0,
      event_vendors: undefined,
    }));

    return NextResponse.json({ vendors: vendorsWithCount });
  } catch (error) {
    console.error("Get vendors error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new vendor
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

    // Check plan feature access for vendors
    const planInfo = await getUserPlanInfo(supabase, userId);
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

    // Validate input
    const validation = validateBody(createVendorSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const vendorData: Record<string, unknown> = {
      tenant_id: profile.tenant_id,
      name: body.name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone || null,
      category: body.category || null,
      services: body.services || null,
      hourly_rate: body.hourly_rate ?? null,
      rating: body.rating ?? null,
      status: body.status || "active",
      notes: body.notes || null,
      website: body.website || null,
      address: body.address || null,
      city: body.city || null,
      country: body.country || null,
      tags: body.tags || null,
    };

    // If a category name is provided, look up the category_id
    if (body.category) {
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: catRecord } = await serviceClient
        .from("vendor_categories")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("name", body.category)
        .single();
      if (catRecord) {
        vendorData.category_id = catRecord.id;
      }
    }

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
        }, serviceClient, profile.tenant_id, userId);
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
