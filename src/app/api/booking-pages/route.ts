import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, createBookingPageSchema } from "@/lib/validations";
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

// GET - Fetch all booking pages for the user's tenant
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

    const { data: bookingPages, error } = await supabase
      .from("booking_pages")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookingPages });
  } catch (error) {
    console.error("Get booking pages error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new booking page
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
    const validation = validateBody(createBookingPageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bookingPageData = {
      tenant_id: profile.tenant_id,
      name: body.name,
      slug: body.slug,
      duration_minutes: body.duration_minutes,
      description: body.description || null,
      buffer_before: body.buffer_before ?? 0,
      buffer_after: body.buffer_after ?? 0,
      form_id: body.form_id || null,
      assigned_member_id: body.assigned_member_id || null,
      location_type: body.location_type || "video",
      location_details: body.location_details || null,
      min_notice_hours: body.min_notice_hours ?? 1,
      max_advance_days: body.max_advance_days ?? 60,
      color: body.color || "#84cc16",
      is_active: body.is_active !== undefined ? body.is_active : true,
    };

    const { data: bookingPage, error } = await supabase
      .from("booking_pages")
      .insert(bookingPageData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for booking_page_created
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("booking_page_created", {
          entity_id: bookingPage.id,
          entity_type: "booking_page",
          entity_name: bookingPage.name,
          booking_page_name: bookingPage.name,
          booking_page_slug: bookingPage.slug,
          duration_minutes: bookingPage.duration_minutes,
        }, serviceClient, profile.tenant_id, userId);
      } catch (err) {
        console.error("Workflow trigger error (booking_page_created):", err);
      }
    }

    return NextResponse.json({ bookingPage }, { status: 201 });
  } catch (error) {
    console.error("Create booking page error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
