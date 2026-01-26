import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// GET - Fetch single team member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

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

    // Fetch member with custom role
    const { data: member, error } = await supabase
      .from("profiles")
      .select(`
        *,
        custom_role:roles(id, name, color, permissions, description)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch manager info separately if present
    let managerData = null;
    if (member?.manager_id) {
      const { data: manager } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url, job_title")
        .eq("id", member.manager_id)
        .single();
      managerData = manager;
    }

    // Fetch invited_by user info separately if present
    let invitedByData = null;
    if (member?.invited_by) {
      const { data: invitedBy } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("id", member.invited_by)
        .single();
      invitedByData = invitedBy;
    }

    // Get recent activity (tasks assigned to this member)
    const { data: recentTasks } = await supabase
      .from("tasks")
      .select("id, title, status, due_date, priority")
      .eq("assigned_to", id)
      .eq("tenant_id", profile.tenant_id)
      .order("updated_at", { ascending: false })
      .limit(5);

    // Get projects where this member is project manager or team lead
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, status, project_code")
      .eq("tenant_id", profile.tenant_id)
      .or(`project_manager_id.eq.${id},team_lead_id.eq.${id}`)
      .limit(5);

    return NextResponse.json({
      member: {
        ...member,
        manager: managerData,
        invited_by_user: invitedByData,
        recent_tasks: recentTasks || [],
        managed_projects: projects || [],
      },
    });
  } catch (error) {
    console.error("Get member error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update team member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile with tenant_id and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check if user has permission (owner/admin can edit anyone, members can only edit themselves)
    const isAdmin = ["owner", "admin"].includes(currentProfile.role);
    if (!isAdmin && user.id !== id) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();

    // Fields that should be null when empty
    const nullableUuidFields = ["manager_id", "custom_role_id"];
    const nullableDateFields = ["start_date"];
    const nullableStringFields = [
      "job_title", "department", "phone", "bio", "linkedin_url",
      "emergency_contact_name", "emergency_contact_phone", "notes",
      "country", "city", "postal_code", "timezone"
    ];

    // Convert empty strings to null for nullable fields
    nullableUuidFields.forEach((field) => {
      if (body[field] === "") body[field] = null;
    });
    nullableDateFields.forEach((field) => {
      if (body[field] === "") body[field] = null;
    });
    nullableStringFields.forEach((field) => {
      if (body[field] === "") body[field] = null;
    });

    // Build update object with allowed fields
    // Non-admins can only update limited fields
    const adminOnlyFields = [
      "role", "status", "employment_type", "hourly_rate", "manager_id",
      "custom_role_id", "start_date"
    ];
    const commonFields = [
      "first_name", "last_name", "phone", "bio", "avatar_url",
      "country", "city", "postal_code", "job_title", "department",
      "skills", "timezone", "working_hours", "emergency_contact_name",
      "emergency_contact_phone", "linkedin_url", "notes", "tags"
    ];

    const allowedFields = isAdmin ? [...commonFields, ...adminOnlyFields] : commonFields;

    const updates: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    updates.updated_at = new Date().toISOString();

    const { data: member, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .select(`
        *,
        custom_role:roles(id, name, color)
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch manager info separately if present
    let managerData = null;
    if (member?.manager_id) {
      const { data: manager } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .eq("id", member.manager_id)
        .single();
      managerData = manager;
    }

    return NextResponse.json({ member: { ...member, manager: managerData } });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Remove team member (soft delete by setting status to terminated)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile with tenant_id and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only owners and admins can remove members
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Cannot delete yourself
    if (user.id === id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the team" },
        { status: 400 }
      );
    }

    // Check if the member exists and is in the same tenant
    const { data: memberToDelete } = await supabase
      .from("profiles")
      .select("id, role, status")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (!memberToDelete) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot delete owners
    if (memberToDelete.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the account owner" },
        { status: 400 }
      );
    }

    // If status is pending_invite, hard delete (they never actually joined)
    if (memberToDelete.status === "pending_invite") {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id)
        .eq("tenant_id", currentProfile.tenant_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Otherwise, soft delete by setting status to terminated
      const { error } = await supabase
        .from("profiles")
        .update({ status: "terminated", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", currentProfile.tenant_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
