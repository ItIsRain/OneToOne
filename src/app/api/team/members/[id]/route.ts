import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendTeamInviteEmail } from "@/lib/email";
import { validateBody, updateTeamMemberSchema } from "@/lib/validations";

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

    // First try to fetch from profiles
    const { data: member, error } = await supabase
      .from("profiles")
      .select(`
        *,
        custom_role:roles(id, name, color, permissions, description)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    // If not found in profiles, check team_invites
    if (error && error.code === "PGRST116") {
      const { data: invite, error: inviteError } = await supabase
        .from("team_invites")
        .select(`
          *,
          custom_role:roles(id, name, color, permissions, description)
        `)
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (inviteError) {
        if (inviteError.code === "PGRST116") {
          return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }
        return NextResponse.json({ error: inviteError.message }, { status: 500 });
      }

      // Fetch invited_by user info
      let invitedByData = null;
      if (invite?.invited_by) {
        const { data: invitedBy } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("id", invite.invited_by)
          .single();
        invitedByData = invitedBy;
      }

      // Fetch manager info
      let managerData = null;
      if (invite?.manager_id) {
        const { data: manager } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, avatar_url, job_title")
          .eq("id", invite.manager_id)
          .single();
        managerData = manager;
      }

      // Return invite as member
      return NextResponse.json({
        member: {
          id: invite.id,
          first_name: invite.first_name,
          last_name: invite.last_name,
          email: invite.email,
          phone: invite.phone,
          avatar_url: null,
          job_title: invite.job_title,
          department: invite.department,
          employment_type: invite.employment_type,
          start_date: invite.start_date,
          role: invite.role,
          custom_role: invite.custom_role,
          custom_role_id: invite.custom_role_id,
          manager_id: invite.manager_id,
          hourly_rate: invite.hourly_rate,
          skills: invite.skills,
          timezone: invite.timezone,
          notes: invite.notes,
          linkedin_url: invite.linkedin_url,
          tags: invite.tags,
          status: "pending_invite",
          created_at: invite.created_at,
          manager: managerData,
          invited_by_user: invitedByData,
          is_invite: true,
          invite_token: invite.invite_token,
          invite_expires_at: invite.invite_expires_at,
          invite_status: invite.status,
          recent_tasks: [],
          managed_projects: [],
        },
      });
    }

    if (error) {
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

    // Validate input
    const validation = validateBody(updateTeamMemberSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

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

    // Validate custom_role_id belongs to the same tenant (security: prevent cross-tenant role assignment)
    if (body.custom_role_id && body.custom_role_id !== null) {
      const { data: role, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("id", body.custom_role_id)
        .eq("tenant_id", currentProfile.tenant_id)
        .single();

      if (roleError || !role) {
        return NextResponse.json({ error: "Custom role not found" }, { status: 404 });
      }
    }

    // Validate manager_id belongs to the same tenant (security: prevent cross-tenant manager assignment)
    if (body.manager_id && body.manager_id !== null) {
      const { data: manager, error: managerError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", body.manager_id)
        .eq("tenant_id", currentProfile.tenant_id)
        .single();

      if (managerError || !manager) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }
    }

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

    // First check if it's an invite in team_invites table
    const { data: inviteToDelete } = await supabase
      .from("team_invites")
      .select("id, status")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (inviteToDelete) {
      // Delete or cancel the invite
      const { error } = await supabase
        .from("team_invites")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("tenant_id", currentProfile.tenant_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Check if the member exists in profiles table
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

    // Soft delete by setting status to terminated
    const { error } = await supabase
      .from("profiles")
      .update({ status: "terminated", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Resend invitation email
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== "resend_invite") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile with tenant_id, role, and name
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only owners and admins can resend invites
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Fetch the invite
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "This invitation is no longer pending" }, { status: 400 });
    }

    // Generate new token and extend expiry
    const newInviteToken = crypto.randomUUID();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    // Update the invite with new token and expiry
    const { error: updateError } = await supabase
      .from("team_invites")
      .update({
        invite_token: newInviteToken,
        invite_expires_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Get tenant name for email
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", currentProfile.tenant_id)
      .single();

    // Send the invitation email
    const inviterName = `${currentProfile.first_name} ${currentProfile.last_name || ""}`.trim();
    const inviteeName = `${invite.first_name} ${invite.last_name || ""}`.trim();
    const teamName = tenant?.name || "the team";

    const emailSent = await sendTeamInviteEmail({
      to: invite.email,
      inviteeName,
      inviterName,
      teamName,
      role: invite.role,
      inviteToken: newInviteToken,
      tenantId: currentProfile.tenant_id,
    });

    if (!emailSent) {
      console.warn("Failed to resend invite email to:", invite.email);
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: "Invitation updated but email failed to send"
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: "Invitation resent successfully"
    });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
