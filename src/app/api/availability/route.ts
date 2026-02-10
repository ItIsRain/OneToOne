import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { validateBody, createAvailabilitySchema, bulkAvailabilitySchema } from "@/lib/validations";
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

// GET - Fetch team availability for the user's tenant
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

    let query = supabase
      .from("team_availability")
      .select("*")
      .eq("tenant_id", profile.tenant_id);

    if (memberId) {
      query = query.eq("member_id", memberId);
    }

    const { data: availability, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create/upsert availability entry
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
    const validation = validateBody(createAvailabilitySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const availabilityData = {
      tenant_id: profile.tenant_id,
      member_id: body.member_id,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      timezone: body.timezone || "America/New_York",
      is_available: body.is_available !== undefined ? body.is_available : true,
    };

    const { data: availability, error } = await supabase
      .from("team_availability")
      .upsert(availabilityData, {
        onConflict: "tenant_id,member_id,day_of_week",
      })
      .select()
      .single();

    if (error) {
      console.error("Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    console.error("Create availability error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - Bulk update availability entries
export async function PUT(request: Request) {
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
    const validation = validateBody(bulkAvailabilitySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const entries = body.entries.map((entry: Record<string, unknown>) => ({
      tenant_id: profile.tenant_id,
      member_id: entry.member_id || body.member_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      timezone: entry.timezone || "America/New_York",
      is_available: entry.is_available !== undefined ? entry.is_available : true,
    }));

    const { data: availability, error } = await supabase
      .from("team_availability")
      .upsert(entries, {
        onConflict: "tenant_id,member_id,day_of_week",
      })
      .select();

    if (error) {
      console.error("Bulk upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Bulk update availability error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
