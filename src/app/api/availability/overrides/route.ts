import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { validateBody, createAvailabilityOverrideSchema } from "@/lib/validations";
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

// GET - Fetch availability overrides for the user's tenant
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

    // Check plan feature access for booking
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const bookingAccess = checkFeatureAccess(planInfo.planType, "booking");
    if (!bookingAccess.allowed) {
      return NextResponse.json(
        {
          error: bookingAccess.reason,
          upgrade_required: bookingAccess.upgrade_required,
          feature: "booking",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("member_id");
    const fromDate = searchParams.get("from_date");

    let query = supabase
      .from("availability_overrides")
      .select("*")
      .eq("tenant_id", profile.tenant_id);

    if (memberId) {
      query = query.eq("member_id", memberId);
    }

    if (fromDate) {
      query = query.gte("override_date", fromDate);
    }

    const { data: overrides, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error("Get availability overrides error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create availability override
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

    // Check plan feature access for booking
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const bookingAccess = checkFeatureAccess(planInfo.planType, "booking");
    if (!bookingAccess.allowed) {
      return NextResponse.json(
        {
          error: bookingAccess.reason,
          upgrade_required: bookingAccess.upgrade_required,
          feature: "booking",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createAvailabilityOverrideSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const overrideData = {
      tenant_id: profile.tenant_id,
      member_id: body.member_id,
      override_date: body.override_date,
      is_blocked: body.is_blocked !== undefined ? body.is_blocked : true,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      reason: body.reason || null,
    };

    const { data: override, error } = await supabase
      .from("availability_overrides")
      .insert(overrideData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ override }, { status: 201 });
  } catch (error) {
    console.error("Create availability override error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
