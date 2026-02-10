import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, updateTimeEntrySchema } from "@/lib/validations";
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

// GET - Fetch single time entry
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

    // Fetch time entry with related data
    const { data: timeEntry, error } = await supabase
      .from("time_entries")
      .select(`
        *,
        project:projects(id, name, project_code, client_id),
        task:tasks(id, title, status, priority),
        user:profiles!time_entries_user_id_fkey(id, first_name, last_name, email, avatar_url, job_title, hourly_rate),
        approver:profiles!time_entries_approved_by_fkey(id, first_name, last_name, email),
        invoice:invoices(id, invoice_number, status)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Get time entry error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update time entry
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

    // Get user's profile with tenant_id and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", userId)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get the existing time entry
    const { data: existingEntry } = await supabase
      .from("time_entries")
      .select("id, user_id, status")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (!existingEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateTimeEntrySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const isAdmin = ["owner", "admin"].includes(currentProfile.role);
    const isOwner = existingEntry.user_id === userId;

    // Only the owner or admin can edit entries
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Can't edit invoiced entries
    if (existingEntry.status === "invoiced" && !isAdmin) {
      return NextResponse.json({ error: "Cannot edit invoiced entries" }, { status: 400 });
    }

    // Non-admins can't edit submitted or approved entries (prevent post-approval tampering)
    if (["submitted", "approved"].includes(existingEntry.status) && !isAdmin) {
      return NextResponse.json({ error: "Cannot edit entries that have been submitted for review" }, { status: 400 });
    }

    // Calculate duration if start and end time provided
    let durationMinutes = body.duration_minutes;
    if (body.start_time && body.end_time && body.duration_minutes === undefined) {
      const [startH, startM] = body.start_time.split(":").map(Number);
      const [endH, endM] = body.end_time.split(":").map(Number);
      durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (durationMinutes < 0) durationMinutes += 24 * 60;
      durationMinutes -= body.break_minutes || 0;
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    const allowedFields = [
      "project_id", "task_id", "date", "start_time", "end_time",
      "description", "is_billable", "hourly_rate", "break_minutes",
      "work_type", "location", "notes", "tags"
    ];

    // Admin-only fields
    const adminFields = ["status", "approved_by", "approved_at", "rejection_reason", "invoice_id"];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    if (isAdmin) {
      // Validate status transitions before allowing update
      if (body.status && body.status !== existingEntry.status) {
        const validTransitions: Record<string, string[]> = {
          draft: ["submitted", "approved", "rejected"], // Admin can skip submission
          submitted: ["approved", "rejected", "draft"], // Can return to draft for revision
          approved: ["invoiced", "rejected"], // Can only move forward or reject
          rejected: ["draft"], // Can only return to draft for resubmission
          invoiced: [], // Final state - cannot be changed
        };

        const allowed = validTransitions[existingEntry.status] || [];
        if (!allowed.includes(body.status)) {
          return NextResponse.json(
            { error: `Cannot transition time entry from "${existingEntry.status}" to "${body.status}"` },
            { status: 400 }
          );
        }
      }

      adminFields.forEach((field) => {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      });

      // Handle approval
      if (body.status === "approved" && existingEntry.status !== "approved") {
        updates.approved_by = userId;
        updates.approved_at = new Date().toISOString();
      }
    }

    // Handle submission by owner
    if (body.status === "submitted" && isOwner && existingEntry.status === "draft") {
      updates.status = "submitted";
    }

    if (durationMinutes !== undefined) {
      updates.duration_minutes = durationMinutes;
    }

    updates.updated_at = new Date().toISOString();

    const { data: timeEntry, error } = await supabase
      .from("time_entries")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .select(`
        *,
        project:projects(id, name, project_code),
        task:tasks(id, title),
        user:profiles!time_entries_user_id_fkey(id, first_name, last_name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Update time entry error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete time entry
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

    // Get user's profile with tenant_id and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", userId)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get the time entry to check ownership and status
    const { data: existingEntry } = await supabase
      .from("time_entries")
      .select("id, user_id, status")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (!existingEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    const isAdmin = ["owner", "admin"].includes(currentProfile.role);
    const isOwner = existingEntry.user_id === userId;

    // Only owner or admin can delete
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Can't delete approved or invoiced entries without admin
    if (["approved", "invoiced"].includes(existingEntry.status) && !isAdmin) {
      return NextResponse.json({ error: "Cannot delete approved/invoiced entries" }, { status: 400 });
    }

    const { error } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete time entry error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
