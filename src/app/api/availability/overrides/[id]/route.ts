import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { validateBody, updateAvailabilityOverrideSchema } from "@/lib/validations";
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

// PATCH - Update availability override
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
    const { id } = await params;

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
    const validation = validateBody(updateAvailabilityOverrideSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const allowedFields = [
      "override_date", "is_blocked", "start_time", "end_time", "reason",
    ];

    const updates: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    updates.updated_at = new Date().toISOString();

    const { data: override, error } = await supabase
      .from("availability_overrides")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Override not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ override });
  } catch (error) {
    console.error("Update availability override error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete availability override
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
    const { id } = await params;

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

    const { error } = await supabase
      .from("availability_overrides")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete availability override error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
