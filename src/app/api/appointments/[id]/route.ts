import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, updateAppointmentSchema } from "@/lib/validations";
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

// GET - Fetch single appointment by id
export async function GET(
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

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("*, booking_page:booking_pages(id, name)")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Get appointment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update appointment
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
    const validation = validateBody(updateAppointmentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Fetch current appointment to detect status changes
    const { data: currentAppointment } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!currentAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const allowedFields = [
      "booking_page_id", "client_name", "client_email", "client_phone",
      "start_time", "end_time", "status", "form_response_id", "lead_id",
      "source", "notes", "assigned_member_id", "cancellation_reason",
    ];

    const updates: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    updates.updated_at = new Date().toISOString();

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select("*, booking_page:booking_pages(id, name)")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations on status changes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey && body.status && body.status !== currentAppointment.status) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      const triggerData = {
        entity_id: appointment.id,
        entity_type: "appointment",
        entity_name: appointment.client_name,
        client_name: appointment.client_name,
        client_email: appointment.client_email,
        client_phone: appointment.client_phone,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        booking_page_id: appointment.booking_page_id,
        status: appointment.status,
        previous_status: currentAppointment.status,
      };

      try {
        if (body.status === "cancelled") {
          await checkTriggers("booking_cancelled", triggerData, serviceClient, profile.tenant_id, userId);
        } else if (body.status === "rescheduled") {
          await checkTriggers("booking_rescheduled", triggerData, serviceClient, profile.tenant_id, userId);
        }
      } catch (err) {
        console.error("Workflow trigger error (booking status change):", err);
      }
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete appointment
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
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
